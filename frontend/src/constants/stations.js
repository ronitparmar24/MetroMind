// frontend/src/constants/stations.js
// All GMRC stations with GPS coordinates — used for fare preview in UI
export const STATIONS = [
  { name: 'Motera Stadium', lat: 23.0735, lng: 72.6097, line: 'blue' },
  { name: 'Sabarmati', lat: 23.0611, lng: 72.6031, line: 'blue' },
  { name: 'Ranip', lat: 23.0485, lng: 72.5971, line: 'blue' },
  { name: 'Kankaria East', lat: 23.0072, lng: 72.6031, line: 'blue' },
  { name: 'Kalupur Railway Station', lat: 23.0225, lng: 72.6074, line: 'blue' },
  { name: 'Gheekanta', lat: 23.0247, lng: 72.5862, line: 'blue' },
  { name: 'Old High Court', lat: 23.0261, lng: 72.5718, line: 'blue' },
  { name: 'Shahpur', lat: 23.0365, lng: 72.5710, line: 'blue' },
  { name: 'Vadaj', lat: 23.0480, lng: 72.5594, line: 'blue' },
  { name: 'Thaltej', lat: 23.0467, lng: 72.5136, line: 'blue' },
  { name: 'Doordarshan Kendra', lat: 23.0380, lng: 72.5270, line: 'blue' },
  { name: 'Gujarat University', lat: 23.0350, lng: 72.5430, line: 'blue' },
  { name: 'Commerce Six Roads', lat: 23.0320, lng: 72.5560, line: 'blue' },
  { name: 'SSG Hospital', lat: 23.0289, lng: 72.5650, line: 'blue' },
  { name: 'AEC', lat: 23.0250, lng: 72.5550, line: 'blue' },
  { name: 'Paldi', lat: 23.0130, lng: 72.5610, line: 'blue' },
  { name: 'Shreyas', lat: 23.0060, lng: 72.5680, line: 'blue' },
  { name: 'Amraiwadi', lat: 23.0040, lng: 72.6200, line: 'blue' },
  { name: 'Rabari Colony', lat: 23.0020, lng: 72.6340, line: 'blue' },
  { name: 'Apparel Park', lat: 22.9950, lng: 72.6420, line: 'blue' },
  { name: 'APMC', lat: 22.9860, lng: 72.6460, line: 'blue' },
  { name: 'Vastral Gam', lat: 23.0140, lng: 72.6650, line: 'red' },
  { name: 'Nirant Cross Road', lat: 23.0150, lng: 72.6500, line: 'red' },
  { name: 'Vastral', lat: 23.0160, lng: 72.6350, line: 'red' },
  { name: 'Odhav', lat: 23.0180, lng: 72.6180, line: 'red' },
  { name: 'CTM Cross Road', lat: 23.0200, lng: 72.6050, line: 'red' },
  { name: 'Jivraj Mehta Hospital', lat: 23.0220, lng: 72.5920, line: 'red' },
  { name: 'Kankaria', lat: 23.0080, lng: 72.5980, line: 'red' },
  { name: 'Kalupur', lat: 23.0220, lng: 72.6070, line: 'red' },
  { name: 'Usmanpura', lat: 23.0430, lng: 72.5560, line: 'red' },
  { name: 'Chandkheda', lat: 23.1100, lng: 72.5850, line: 'red' },
  { name: 'GNLU', lat: 23.1280, lng: 72.5800, line: 'red' },
];

export const BLUE_LINE_STATIONS = STATIONS.filter(s => s.line === 'blue');
export const RED_LINE_STATIONS = STATIONS.filter(s => s.line === 'red');
