// backend-node/src/services/routeGraph.service.js
//
// Builds a weighted adjacency-list graph of the full GMRC metro network and
// exposes a real Dijkstra's shortest-path algorithm over it.
//
// Graph weights
// ─────────────
//  • Adjacent stations on the same line  →  2.5 min  (realistic ~2-3 min between stops)
//  • Cross-line transfer at an interchange  →  5 min  (platform-to-platform walk penalty)
//
// The graph is constructed ONCE at server start-up and reused for every
// request, so route queries are O(V²) in-memory lookups — no DB hit needed.

const STATIONS = require('../constants/stations');

// ── 1. Build adjacency list ──────────────────────────────────────────────────

/**
 * Constructs the full metro network graph as an adjacency list.
 *
 * Each entry  graph[stationId]  is an array of { to: stationId, weight: number }.
 *
 * Two kinds of edges are added:
 *   (a) Sequential edges  — consecutive stations along the same physical line
 *   (b) Interchange edges — same physical station represented on two lines
 *       (e.g. "Old High Court" appears as `old-high-court` on Blue and
 *        `old-high-court-red` on Red; they share one real building).
 *
 * @returns {Object.<string, Array<{to: string, weight: number}>>}
 */
function buildGraph() {
  const graph = {};

  // Initialise empty adjacency list for every station
  STATIONS.forEach(s => {
    graph[s.id] = [];
  });

  // (a) Sequential edges — group stations by line, sort by order, link neighbours
  const byLine = {};
  STATIONS.forEach(s => {
    if (!byLine[s.line]) byLine[s.line] = [];
    byLine[s.line].push(s);
  });

  Object.values(byLine).forEach(lineStations => {
    lineStations.sort((a, b) => a.order - b.order);

    for (let i = 0; i < lineStations.length - 1; i++) {
      const a = lineStations[i].id;
      const b = lineStations[i + 1].id;

      // Bidirectional: metro runs in both directions on each line
      graph[a].push({ to: b, weight: 2.5 });
      graph[b].push({ to: a, weight: 2.5 });
    }
  });

  // (b) Interchange edges — connect physically adjacent stations across lines.
  //
  //  Strategy 1 (exact): match by same human-readable name on the target line.
  //     Works for Old High Court (Blue ↔ Red) where both entries share the name.
  //
  //  Strategy 2 (proximity): when no name match exists (e.g. "Motera Stadium"
  //     on Red wants to connect to Yellow, but Yellow's nearest station is
  //     "Koteshwar Road"), find the station on the target line within
  //     PROXIMITY_KM km and use a slightly higher transfer penalty (7 min)
  //     to reflect that these are street-level rather than platform-level transfers.
  const PROXIMITY_KM = 0.5; // 500 m

  /** Simple equirectangular distance in km (adequate for short inter-station gaps) */
  function approxKm(s1, s2) {
    const R = 6371;
    const dLat = (s2.lat - s1.lat) * Math.PI / 180;
    const dLng = (s2.lng - s1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(s1.lat * Math.PI / 180) * Math.cos(s2.lat * Math.PI / 180) *
              Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  STATIONS.forEach(s => {
    if (!Array.isArray(s.interchange)) return;

    s.interchange.forEach(otherLine => {
      // --- Strategy 1: exact name match (same station, two line entries) ---
      const nameMatch = STATIONS.find(
        o => o.line === otherLine && o.name === s.name
      );
      if (nameMatch) {
        const alreadyLinked = graph[s.id].some(e => e.to === nameMatch.id);
        if (!alreadyLinked) {
          graph[s.id].push({ to: nameMatch.id, weight: 5 });
          graph[nameMatch.id].push({ to: s.id, weight: 5 });
        }
        return; // done for this otherLine entry
      }

      // --- Strategy 2: proximity-based match (different names, close together) ---
      // The `interchange` field is an authoritative declaration from the data author.
      // Connect to the nearest station on the target line (no hard distance cap —
      // the explicit `interchange` flag is sufficient authority).
      let nearest = null;
      let nearestDist = Infinity;
      STATIONS.forEach(o => {
        if (o.line !== otherLine) return;
        const d = approxKm(s, o);
        if (d < nearestDist) { nearestDist = d; nearest = o; }
      });

      if (nearest) {
        const alreadyLinked = graph[s.id].some(e => e.to === nearest.id);
        if (!alreadyLinked) {
          // 7-min penalty: these are real-world transfers between adjacent stations
          graph[s.id].push({ to: nearest.id, weight: 7 });
          graph[nearest.id].push({ to: s.id, weight: 7 });
        }
      }
    });
  });

  return graph;
}

// Build once at module load — reused for every incoming request
const GRAPH = buildGraph();

// ── 2. Dijkstra's algorithm ──────────────────────────────────────────────────

/**
 * Classic Dijkstra's shortest-path algorithm over the metro graph.
 *
 * Time complexity: O(V²) with a simple linear scan for the minimum node
 * (adequate for V ≈ 53 stations; a min-heap would give O((V+E) log V) if needed).
 *
 * @param {string} startId  - Station ID of the origin
 * @param {string} endId    - Station ID of the destination
 * @returns {{ path: string[], totalMinutes: number }}
 *   path          — ordered array of station IDs from start → end
 *   totalMinutes  — total weighted cost (travel + transfer minutes)
 */
function dijkstra(startId, endId) {
  // distances[id] = best-known cost to reach `id` from `startId`
  const distances = {};
  // previous[id] = predecessor ID on the shortest path to `id`
  const previous = {};
  // Set of permanently settled nodes
  const visited = new Set();

  // Initialise all distances to +∞
  Object.keys(GRAPH).forEach(id => {
    distances[id] = Infinity;
  });
  distances[startId] = 0;

  // Main loop — runs until all reachable nodes are settled
  while (visited.size < Object.keys(GRAPH).length) {
    // Pick the unvisited node with the smallest tentative distance (linear scan)
    let current = null;
    let minDist = Infinity;

    for (const id in distances) {
      if (!visited.has(id) && distances[id] < minDist) {
        minDist = distances[id];
        current = id;
      }
    }

    // No more reachable unvisited nodes, or destination already settled
    if (current === null || current === endId) break;

    visited.add(current);

    // Relax each outgoing edge
    GRAPH[current].forEach(edge => {
      const alt = distances[current] + edge.weight;
      if (alt < distances[edge.to]) {
        distances[edge.to] = alt;
        previous[edge.to] = current;
      }
    });
  }

  // Reconstruct path by walking `previous` back from destination
  const path = [];
  let node = endId;
  while (node !== undefined) {
    path.unshift(node);
    node = previous[node];
  }

  // If path[0] !== startId, no route exists (disconnected graph)
  if (path[0] !== startId) {
    return { path: [], totalMinutes: Infinity };
  }

  return { path, totalMinutes: distances[endId] };
}

// ── 3. Public API ────────────────────────────────────────────────────────────

/**
 * Find the shortest route between two stations identified by their IDs.
 *
 * Returns human-readable station names, computed travel time, and the
 * interchange stations encountered along the path (if any).
 *
 * @param {string} startId
 * @param {string} endId
 * @returns {{
 *   stations: string[],
 *   stationIds: string[],
 *   totalMinutes: number,
 *   interchangeCount: number,
 *   interchangeStations: string[],
 * }}
 */
exports.findShortestRoute = (startId, endId) => {
  const result = dijkstra(startId, endId);

  if (result.path.length === 0) {
    return {
      stations: [],
      stationIds: [],
      totalMinutes: 0,
      interchangeCount: 0,
      interchangeStations: [],
      error: 'No route found between these stations',
    };
  }

  // Identify interchange nodes on the path (stations with cross-line connections)
  const interchangeIds = result.path.filter(id => {
    const station = STATIONS.find(s => s.id === id);
    return Array.isArray(station?.interchange) && station.interchange.length > 0;
  });

  // Deduplicate by human-readable name — "Old High Court" has two IDs (one per
  // line) but is one physical stop; show it only once in the interchange list.
  const seen = new Set();
  const uniqueInterchangeNames = interchangeIds
    .map(id => STATIONS.find(s => s.id === id)?.name ?? id)
    .filter(name => {
      if (seen.has(name)) return false;
      seen.add(name);
      return true;
    });

  return {
    // Human-readable station names along the shortest path
    stations: result.path.map(id => STATIONS.find(s => s.id === id)?.name ?? id),
    // Raw IDs (useful for further processing on the frontend)
    stationIds: result.path,
    // Round to nearest minute for clean display
    totalMinutes: Math.round(result.totalMinutes),
    interchangeCount: uniqueInterchangeNames.length,
    interchangeStations: uniqueInterchangeNames,
  };
};

// Expose graph + algorithm internals for testing / debugging purposes
exports._GRAPH = GRAPH;
exports._dijkstra = dijkstra;
