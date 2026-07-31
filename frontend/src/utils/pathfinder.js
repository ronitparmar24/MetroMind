// frontend/src/utils/pathfinder.js
// BFS shortest-path across the Ahmedabad Metro network
// Builds an adjacency graph from STATIONS data + INTERCHANGE_MAP

import { STATIONS, LINES, INTERCHANGE_MAP } from '../constants/stations';

/**
 * Build adjacency list from station data.
 * - Consecutive stations on the same line are connected.
 * - Interchange stations connect across lines via INTERCHANGE_MAP.
 */
function buildGraph() {
  const adj = {};

  // Init all station nodes
  STATIONS.forEach(s => {
    adj[s.id] = adj[s.id] || [];
  });

  // Group stations by line, sorted by order
  const byLine = {};
  STATIONS.forEach(s => {
    byLine[s.line] = byLine[s.line] || [];
    byLine[s.line].push(s);
  });
  Object.values(byLine).forEach(arr => arr.sort((a, b) => a.order - b.order));

  // Connect consecutive stations on the same line
  Object.values(byLine).forEach(lineStations => {
    for (let i = 0; i < lineStations.length - 1; i++) {
      const a = lineStations[i].id;
      const b = lineStations[i + 1].id;
      if (!adj[a].includes(b)) adj[a].push(b);
      if (!adj[b].includes(a)) adj[b].push(a);
    }
  });

  // Add interchange connections
  Object.entries(INTERCHANGE_MAP).forEach(([fromId, toIds]) => {
    toIds.forEach(toId => {
      // Only add if both nodes exist in the graph
      if (adj[fromId] && adj[toId]) {
        if (!adj[fromId].includes(toId)) adj[fromId].push(toId);
        if (!adj[toId].includes(fromId)) adj[toId].push(fromId);
      }
    });
  });

  return adj;
}

// Lazy-initialized graph
let _graph = null;
function getGraph() {
  if (!_graph) _graph = buildGraph();
  return _graph;
}

// Station lookup by ID
const stationById = Object.fromEntries(STATIONS.map(s => [s.id, s]));

/**
 * Find the shortest path between two station IDs using BFS.
 * Returns null if no path found.
 *
 * @param {string} fromId - source station ID
 * @param {string} toId - destination station ID
 * @returns {{ path: Array<{id, name, line, order}>, interchanges: Array<{station, fromLine, toLine}>, totalStations: number }}
 */
export function findRoute(fromId, toId) {
  if (fromId === toId) return null;

  const graph = getGraph();
  if (!graph[fromId] || !graph[toId]) return null;

  // BFS
  const visited = new Set([fromId]);
  const parent = { [fromId]: null };
  const queue = [fromId];

  while (queue.length > 0) {
    const current = queue.shift();
    if (current === toId) break;

    for (const neighbor of graph[current] || []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        parent[neighbor] = current;
        queue.push(neighbor);
      }
    }
  }

  // No path found
  if (!parent.hasOwnProperty(toId)) return null;

  // Reconstruct path
  const pathIds = [];
  let cur = toId;
  while (cur !== null) {
    pathIds.unshift(cur);
    cur = parent[cur];
  }

  const path = pathIds.map(id => stationById[id]).filter(Boolean);

  // Detect interchanges (line changes along the path)
  const interchanges = [];
  for (let i = 1; i < path.length; i++) {
    if (path[i].line !== path[i - 1].line) {
      interchanges.push({
        station: path[i - 1],
        fromLine: path[i - 1].line,
        toLine: path[i].line,
      });
    }
  }

  return {
    path,
    interchanges,
    totalStations: path.length,
  };
}

/**
 * Estimate travel time for a route.
 * ~2 min per station + 3 min per interchange transfer.
 */
export function estimateTravelTime(route) {
  if (!route) return 0;
  const stationMinutes = (route.totalStations - 1) * 2;
  const interchangeMinutes = route.interchanges.length * 3;
  return stationMinutes + interchangeMinutes;
}

/**
 * Get segments of a route grouped by line (for multi-color rendering).
 * Returns array of { line, color, stationIds: [id1, id2, ...] }
 */
export function getRouteSegments(route) {
  if (!route || route.path.length === 0) return [];

  const segments = [];
  let currentLine = route.path[0].line;
  let currentSegment = [route.path[0].id];

  for (let i = 1; i < route.path.length; i++) {
    const station = route.path[i];
    if (station.line !== currentLine) {
      segments.push({
        line: currentLine,
        color: LINES[currentLine]?.color || '#888',
        stationIds: [...currentSegment],
      });
      currentLine = station.line;
      currentSegment = [route.path[i - 1].id, station.id]; // overlap at interchange
    } else {
      currentSegment.push(station.id);
    }
  }

  // Push last segment
  if (currentSegment.length > 0) {
    segments.push({
      line: currentLine,
      color: LINES[currentLine]?.color || '#888',
      stationIds: currentSegment,
    });
  }

  return segments;
}
