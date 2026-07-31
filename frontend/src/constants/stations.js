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
  { id: 'thaltej-gam', name: 'Thaltej Gam', line: 'blue', order: 1 },
  { id: 'thaltej', name: 'Thaltej', line: 'blue', order: 2 },
  { id: 'doordarshan-kendra', name: 'Doordarshan Kendra', line: 'blue', order: 3 },
  { id: 'gurukul-road', name: 'Gurukul Road', line: 'blue', order: 4 },
  { id: 'gujarat-university', name: 'Gujarat University', line: 'blue', order: 5 },
  { id: 'commerce-six-road', name: 'Commerce Six Road', line: 'blue', order: 6 },
  { id: 'sp-stadium', name: 'SP Stadium', line: 'blue', order: 7 },
  { id: 'old-high-court', name: 'Old High Court', line: 'blue', order: 8, interchange: ['red'] },
  { id: 'shahpur', name: 'Shahpur', line: 'blue', order: 9 },
  { id: 'gheekanta', name: 'Gheekanta', line: 'blue', order: 10 },
  { id: 'kalupur', name: 'Kalupur Metro Station', line: 'blue', order: 11 },
  { id: 'apparel-park', name: 'Apparel Park', line: 'blue', order: 12 },
  { id: 'amraivadi', name: 'Amraivadi', line: 'blue', order: 13 },
  { id: 'rabari-colony', name: 'Rabari Colony', line: 'blue', order: 14 },
  { id: 'vastral', name: 'Vastral', line: 'blue', order: 15 },
  { id: 'nirant-cross-road', name: 'Nirant Cross Road', line: 'blue', order: 16 },
  { id: 'vastral-gam', name: 'Vastral Gam', line: 'blue', order: 17 },

  // RED LINE — APMC to Motera Stadium (south-north)
  { id: 'apmc', name: 'APMC', line: 'red', order: 1 },
  { id: 'jivraj-park', name: 'Jivraj Park', line: 'red', order: 2 },
  { id: 'rajivnagar', name: 'Rajivnagar', line: 'red', order: 3 },
  { id: 'shreyas', name: 'Shreyas', line: 'red', order: 4 },
  { id: 'paldi', name: 'Paldi', line: 'red', order: 5 },
  { id: 'gandhigram', name: 'Gandhigram', line: 'red', order: 6 },
  { id: 'usmanpura', name: 'Usmanpura', line: 'red', order: 7 },
  { id: 'vijaynagar', name: 'Vijaynagar', line: 'red', order: 8 },
  { id: 'vadaj', name: 'Vadaj', line: 'red', order: 9 },
  { id: 'ranip', name: 'Ranip', line: 'red', order: 10 },
  { id: 'sabarmati-railway', name: 'Sabarmati Railway Station', line: 'red', order: 11 },
  { id: 'aec', name: 'AEC', line: 'red', order: 12 },
  { id: 'sabarmati', name: 'Sabarmati', line: 'red', order: 13 },
  { id: 'motera-stadium', name: 'Motera Stadium', line: 'red', order: 14, interchange: ['yellow'] },

  // YELLOW LINE — Koteshwar Road to Mahatma Mandir (through GNLU)
  { id: 'koteshwar-road', name: 'Koteshwar Road', line: 'yellow', order: 1 },
  { id: 'vishwakarma-college', name: 'Vishwakarma College', line: 'yellow', order: 2 },
  { id: 'tapovan-circle', name: 'Tapovan Circle', line: 'yellow', order: 3 },
  { id: 'narmada-canal', name: 'Narmada Canal', line: 'yellow', order: 4 },
  { id: 'koba-circle', name: 'Koba Circle', line: 'yellow', order: 5 },
  { id: 'juna-koba', name: 'Juna Koba', line: 'yellow', order: 6 },
  { id: 'koba-gam', name: 'Koba Gam', line: 'yellow', order: 7 },
  { id: 'gnlu', name: 'GNLU', line: 'yellow', order: 8, interchange: ['purple'] },
  { id: 'raysan', name: 'Raysan', line: 'yellow', order: 9 },
  { id: 'randesan', name: 'Randesan', line: 'yellow', order: 10 },
  { id: 'dholakuva-circle', name: 'Dholakuva Circle', line: 'yellow', order: 11 },
  { id: 'infocity', name: 'Infocity', line: 'yellow', order: 12 },
  { id: 'sector-1', name: 'Sector-1', line: 'yellow', order: 13 },
  { id: 'sector-10a', name: 'Sector 10A', line: 'yellow', order: 14 },
  { id: 'sachivalaya', name: 'Sachivalaya', line: 'yellow', order: 15 },
  { id: 'akshardham', name: 'Akshardham', line: 'yellow', order: 16 },
  { id: 'juna-sachivalaya', name: 'Juna Sachivalaya', line: 'yellow', order: 17 },
  { id: 'sector-16', name: 'Sector-16', line: 'yellow', order: 18 },
  { id: 'sector-24', name: 'Sector-24', line: 'yellow', order: 19 },
  { id: 'mahatma-mandir', name: 'Mahatama Mandir', line: 'yellow', order: 20 },

  // PINK LINE — Airport spur (branches near Motera/Koteshwar)
  { id: 'koteshwar-prachin-mandir', name: 'Koteshwar Prachin Mandir', line: 'pink', order: 1 },
  { id: 'ashram-road', name: 'Ashram Road', line: 'pink', order: 2 },
  { id: 'sabarmati-river', name: 'Sabarmati River', line: 'pink', order: 3 },
  { id: 'sardarnagar', name: 'Sardarnagar', line: 'pink', order: 4 },
  { id: 'airport', name: 'Airport', line: 'pink', order: 5 },

  // PURPLE LINE — GIFT City extension (from GNLU)
  { id: 'pdeu', name: 'PDEU', line: 'purple', order: 1, interchange: ['purple'] },
  { id: 'gift-city', name: 'Gift City', line: 'purple', order: 2 },
];

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
