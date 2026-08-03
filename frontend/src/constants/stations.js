// frontend/src/constants/stations.js
// Real Ahmedabad Metro (GMRC) station data — all 5 lines

export const LINES = {
  blue: { name: 'Blue Line', color: '#2563EB' },
  red: { name: 'Red Line', color: '#DC2626' },
  yellow: { name: 'Yellow Line', color: '#EAB308' },
  pink: { name: 'Pink Line', color: '#EC4899' },
  purple: { name: 'Purple Line', color: '#7C3AED' },
};

export const STATIONS = [
  // BLUE LINE — Thaltej Gam to Vastral Gam (east-west)
  { id: 'thaltej-gam',         name: 'Thaltej Gam',              line: 'blue',   order: 1,  lat: 23.0469, lng: 72.5118 },
  { id: 'thaltej',             name: 'Thaltej',                   line: 'blue',   order: 2,  lat: 23.0431, lng: 72.5165 },
  { id: 'doordarshan-kendra',  name: 'Doordarshan Kendra',        line: 'blue',   order: 3,  lat: 23.0393, lng: 72.5268 },
  { id: 'gurukul-road',        name: 'Gurukul Road',              line: 'blue',   order: 4,  lat: 23.0358, lng: 72.5363 },
  { id: 'gujarat-university',  name: 'Gujarat University',         line: 'blue',   order: 5,  lat: 23.0333, lng: 72.5452 },
  { id: 'commerce-six-road',   name: 'Commerce Six Road',          line: 'blue',   order: 6,  lat: 23.0304, lng: 72.5549 },
  { id: 'sp-stadium',          name: 'SP Stadium',                line: 'blue',   order: 7,  lat: 23.0278, lng: 72.5649 },
  { id: 'old-high-court',      name: 'Old High Court',            line: 'blue',   order: 8,  lat: 23.0253, lng: 72.5778, interchange: ['red'] },
  { id: 'shahpur',             name: 'Shahpur',                   line: 'blue',   order: 9,  lat: 23.0261, lng: 72.5878 },
  { id: 'gheekanta',           name: 'Gheekanta',                 line: 'blue',   order: 10, lat: 23.0263, lng: 72.5949 },
  { id: 'kalupur',             name: 'Kalupur Metro Station',     line: 'blue',   order: 11, lat: 23.0268, lng: 72.6043 },
  { id: 'apparel-park',        name: 'Apparel Park',              line: 'blue',   order: 12, lat: 23.0265, lng: 72.6148 },
  { id: 'amraivadi',           name: 'Amraivadi',                 line: 'blue',   order: 13, lat: 23.0244, lng: 72.6268 },
  { id: 'rabari-colony',       name: 'Rabari Colony',             line: 'blue',   order: 14, lat: 23.0218, lng: 72.6378 },
  { id: 'vastral',             name: 'Vastral',                   line: 'blue',   order: 15, lat: 23.0191, lng: 72.6490 },
  { id: 'nirant-cross-road',   name: 'Nirant Cross Road',         line: 'blue',   order: 16, lat: 23.0175, lng: 72.6575 },
  { id: 'vastral-gam',         name: 'Vastral Gam',               line: 'blue',   order: 17, lat: 23.0158, lng: 72.6643 },

  // RED LINE — APMC to Motera Stadium (south-north)
  { id: 'apmc',                name: 'APMC',                      line: 'red',    order: 1,  lat: 22.9899, lng: 72.5853 },
  { id: 'jivraj-park',         name: 'Jivraj Park',               line: 'red',    order: 2,  lat: 22.9984, lng: 72.5783 },
  { id: 'rajivnagar',          name: 'Rajivnagar',                line: 'red',    order: 3,  lat: 23.0064, lng: 72.5745 },
  { id: 'shreyas',             name: 'Shreyas',                   line: 'red',    order: 4,  lat: 23.0118, lng: 72.5726 },
  { id: 'paldi',               name: 'Paldi',                     line: 'red',    order: 5,  lat: 23.0178, lng: 72.5701 },
  { id: 'gandhigram',          name: 'Gandhigram',                line: 'red',    order: 6,  lat: 23.0228, lng: 72.5686 },
  { id: 'usmanpura',           name: 'Usmanpura',                 line: 'red',    order: 7,  lat: 23.0353, lng: 72.5663 },
  { id: 'vijaynagar',          name: 'Vijaynagar',                line: 'red',    order: 8,  lat: 23.0478, lng: 72.5643 },
  { id: 'vadaj',               name: 'Vadaj',                     line: 'red',    order: 9,  lat: 23.0578, lng: 72.5619 },
  { id: 'ranip',               name: 'Ranip',                     line: 'red',    order: 10, lat: 23.0683, lng: 72.5591 },
  { id: 'sabarmati-railway',   name: 'Sabarmati Railway Station', line: 'red',    order: 11, lat: 23.0776, lng: 72.5563 },
  { id: 'aec',                 name: 'AEC',                       line: 'red',    order: 12, lat: 23.0853, lng: 72.5543 },
  { id: 'sabarmati',           name: 'Sabarmati',                 line: 'red',    order: 13, lat: 23.0918, lng: 72.5521 },
  { id: 'motera-stadium',      name: 'Motera Stadium',            line: 'red',    order: 14, lat: 23.0993, lng: 72.5497, interchange: ['yellow'] },

  // YELLOW LINE — Koteshwar Road to Mahatma Mandir (through GNLU)
  { id: 'koteshwar-road',      name: 'Koteshwar Road',            line: 'yellow', order: 1,  lat: 23.1038, lng: 72.5571 },
  { id: 'vishwakarma-college', name: 'Vishwakarma College',       line: 'yellow', order: 2,  lat: 23.1108, lng: 72.5631 },
  { id: 'tapovan-circle',      name: 'Tapovan Circle',            line: 'yellow', order: 3,  lat: 23.1178, lng: 72.5683 },
  { id: 'narmada-canal',       name: 'Narmada Canal',             line: 'yellow', order: 4,  lat: 23.1251, lng: 72.5741 },
  { id: 'koba-circle',         name: 'Koba Circle',               line: 'yellow', order: 5,  lat: 23.1318, lng: 72.5798 },
  { id: 'juna-koba',           name: 'Juna Koba',                 line: 'yellow', order: 6,  lat: 23.1381, lng: 72.5851 },
  { id: 'koba-gam',            name: 'Koba Gam',                  line: 'yellow', order: 7,  lat: 23.1438, lng: 72.5903 },
  { id: 'gnlu',                name: 'GNLU',                      line: 'yellow', order: 8,  lat: 23.1503, lng: 72.5963, interchange: ['purple'] },
  { id: 'raysan',              name: 'Raysan',                    line: 'yellow', order: 9,  lat: 23.1578, lng: 72.6028 },
  { id: 'randesan',            name: 'Randesan',                  line: 'yellow', order: 10, lat: 23.1643, lng: 72.6091 },
  { id: 'dholakuva-circle',    name: 'Dholakuva Circle',          line: 'yellow', order: 11, lat: 23.1701, lng: 72.6148 },
  { id: 'infocity',            name: 'Infocity',                  line: 'yellow', order: 12, lat: 23.1748, lng: 72.6181 },
  { id: 'sector-1',            name: 'Sector-1',                  line: 'yellow', order: 13, lat: 23.2028, lng: 72.6348 },
  { id: 'sector-10a',          name: 'Sector 10A',                line: 'yellow', order: 14, lat: 23.2118, lng: 72.6398 },
  { id: 'sachivalaya',         name: 'Sachivalaya',               line: 'yellow', order: 15, lat: 23.2218, lng: 72.6448 },
  { id: 'akshardham',          name: 'Akshardham',                line: 'yellow', order: 16, lat: 23.2318, lng: 72.6481 },
  { id: 'juna-sachivalaya',    name: 'Juna Sachivalaya',          line: 'yellow', order: 17, lat: 23.2398, lng: 72.6503 },
  { id: 'sector-16',           name: 'Sector-16',                 line: 'yellow', order: 18, lat: 23.2481, lng: 72.6521 },
  { id: 'sector-24',           name: 'Sector-24',                 line: 'yellow', order: 19, lat: 23.2558, lng: 72.6541 },
  { id: 'mahatma-mandir',      name: 'Mahatama Mandir',           line: 'yellow', order: 20, lat: 23.2633, lng: 72.6558 },

  // PINK LINE — Airport spur
  { id: 'koteshwar-prachin-mandir', name: 'Koteshwar Prachin Mandir', line: 'pink', order: 1, lat: 23.1023, lng: 72.5538 },
  { id: 'ashram-road',         name: 'Ashram Road',               line: 'pink',   order: 2,  lat: 23.0513, lng: 72.5668 },
  { id: 'sabarmati-river',     name: 'Sabarmati River',           line: 'pink',   order: 3,  lat: 23.0703, lng: 72.5588 },
  { id: 'sardarnagar',         name: 'Sardarnagar',               line: 'pink',   order: 4,  lat: 23.0851, lng: 72.5921 },
  { id: 'airport',             name: 'Airport',                   line: 'pink',   order: 5,  lat: 23.0728, lng: 72.6271 },

  // PURPLE LINE — GIFT City extension
  { id: 'pdeu',                name: 'PDEU',                      line: 'purple', order: 1,  lat: 23.1528, lng: 72.6038, interchange: ['yellow'] },
  { id: 'gift-city',           name: 'Gift City',                 line: 'purple', order: 2,  lat: 23.1633, lng: 72.6153 },
];

// ── Nearest-station lookup helper ─────────────────────────────────────────
// Keyed by station name for O(1) access from haversine calculations.
export const STATION_COORDS = Object.fromEntries(
  STATIONS.map(s => [s.name, { lat: s.lat, lng: s.lng, line: s.line, id: s.id }])
);

// National Common Mobility Card (NCMC) info — referenced in Wallet/MetroCard pages
export const NCMC_INFO = {
  enabled: true,
  description:
    'This ticket is compatible with the National Common Mobility Card (NCMC) — the same card works across metro systems in other Indian cities.',
};

// ═══════════════════════════════════════════════════════════
// STATION FACILITIES — per-station facility availability
// Structured so individual stations can be overridden later
// ═══════════════════════════════════════════════════════════
const DEFAULT_FACILITIES = {
  ticketVendingMachine: true,
  liftsAndEscalators: true,
  securityCheck: true,
  publicWashrooms: true,
};

export const FACILITY_LABELS = {
  ticketVendingMachine: { label: 'Ticket Vending Machine (TVM)', icon: '🎫' },
  liftsAndEscalators: { label: 'Lifts & Escalators', icon: '🛗' },
  securityCheck: { label: 'Security Check', icon: '🛡️' },
  publicWashrooms: { label: 'Public Washrooms', icon: '🚻' },
};

// Build per-station facilities map — default all stations to having all facilities
export const STATION_FACILITIES = Object.fromEntries(
  STATIONS.map(s => [s.id, { ...DEFAULT_FACILITIES }])
);

// ═══════════════════════════════════════════════════════════
// ACCESSIBILITY — real GMRC accessibility features
// ═══════════════════════════════════════════════════════════
export const ACCESSIBILITY_FEATURES = [
  {
    id: 'audible-lifts',
    name: 'Audible Lift Announcements',
    description: 'All lifts at metro stations are equipped with audible floor and direction announcements.',
    icon: '🔊',
  },
  {
    id: 'braille-plates',
    name: 'Braille Plates at Stations',
    description: 'Station signage, handrails, and ticket counters include braille plates for visually impaired passengers.',
    icon: '⠿',
  },
  {
    id: 'flashing-maps',
    name: 'Flashing System Maps & Active Line Diagrams',
    description: 'LED-based system maps at platforms display the active line with flashing indicators showing the current train position.',
    icon: '🗺️',
  },
  {
    id: 'train-displays',
    name: 'On-Train Information Display Systems',
    description: 'Inside each coach, LED/LCD displays show the next station, line diagram, and door-opening side.',
    icon: '📺',
  },
];

// ═══════════════════════════════════════════════════════════
// INTERCHANGE MAP — bidirectional connections for pathfinding
// Maps station ID to the IDs of stations it connects to on other lines
// ═══════════════════════════════════════════════════════════
export const INTERCHANGE_MAP = {
  // Old High Court (Blue order 8) ↔ Old High Court exists only on Blue,
  // but it's the interchange point for Red line.
  // Red line's closest station to Old High Court is between Gandhigram and Usmanpura.
  // For simplicity in our metro model, we treat Old High Court as a shared station.
  'old-high-court': ['old-high-court-red'],
  'old-high-court-red': ['old-high-court'],

  // Motera Stadium (Red order 14) ↔ Koteshwar Road (Yellow order 1)
  'motera-stadium': ['koteshwar-road'],
  'koteshwar-road': ['motera-stadium'],

  // GNLU (Yellow order 8) ↔ PDEU (Purple order 1)
  'gnlu': ['pdeu'],
  'pdeu': ['gnlu'],
};

// Per-line station lists for backward compatibility
export const BLUE_LINE_STATIONS = STATIONS.filter(s => s.line === 'blue');
export const RED_LINE_STATIONS = STATIONS.filter(s => s.line === 'red');
export const YELLOW_LINE_STATIONS = STATIONS.filter(s => s.line === 'yellow');
export const PINK_LINE_STATIONS = STATIONS.filter(s => s.line === 'pink');
export const PURPLE_LINE_STATIONS = STATIONS.filter(s => s.line === 'purple');
