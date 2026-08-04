// frontend/src/api/geocode.api.js
// Two-tier geocode strategy:
//   0. Local Ahmedabad landmarks dictionary — resolves abbreviations & popular spots instantly
//   1. Backend proxy (/api/geocode) — server-side Nominatim call
//   2. Browser-direct Nominatim fallback — if backend is 502 (datacenter IP blocked),
//      call Nominatim directly from the browser where IPs are never blocked
import api from './index';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

// ─── Local Ahmedabad Landmarks Dictionary ─────────────────────────────────────
// Maps common names, abbreviations, and area names to precise lat/lng.
// Checked BEFORE geocoding to resolve ambiguous/abbreviated queries instantly.
// Format: { displayName, lat, lng }
const AHMEDABAD_LANDMARKS = {
  // ── Colleges & Universities ──────────────────────────────────────────────
  'lj':                    { displayName: 'LJ Institute of Engineering & Technology, Makarba', lat: 23.0395, lng: 72.5066 },
  'lj institute':          { displayName: 'LJ Institute of Engineering & Technology, Makarba', lat: 23.0395, lng: 72.5066 },
  'ljiet':                 { displayName: 'LJ Institute of Engineering & Technology, Makarba', lat: 23.0395, lng: 72.5066 },
  'lj university':         { displayName: 'LJ University, Sarkhej-Gandhinagar Highway',        lat: 23.0355, lng: 72.5053 },
  'lju':                   { displayName: 'LJ University, Sarkhej-Gandhinagar Highway',        lat: 23.0355, lng: 72.5053 },
  'iim':                   { displayName: 'IIM Ahmedabad, Vastrapur',                          lat: 23.0322, lng: 72.5316 },
  'iima':                  { displayName: 'IIM Ahmedabad, Vastrapur',                          lat: 23.0322, lng: 72.5316 },
  'iim ahmedabad':         { displayName: 'IIM Ahmedabad, Vastrapur',                          lat: 23.0322, lng: 72.5316 },
  'iit':                   { displayName: 'IIT Gandhinagar, Palaj',                            lat: 23.2156, lng: 72.6369 },
  'iit gandhinagar':       { displayName: 'IIT Gandhinagar, Palaj',                            lat: 23.2156, lng: 72.6369 },
  'gtu':                   { displayName: 'Gujarat Technological University, Chandkheda',       lat: 23.0953, lng: 72.5310 },
  'gujarat technological university': { displayName: 'GTU, Chandkheda',                        lat: 23.0953, lng: 72.5310 },
  'gu':                    { displayName: 'Gujarat University, Navrangpura',                   lat: 23.0334, lng: 72.5458 },
  'gujarat university':    { displayName: 'Gujarat University, Navrangpura',                   lat: 23.0334, lng: 72.5458 },
  'cept':                  { displayName: 'CEPT University, Navrangpura',                      lat: 23.0226, lng: 72.5714 },
  'nid':                   { displayName: 'National Institute of Design, Paldi',               lat: 23.0152, lng: 72.5718 },
  'nirma':                 { displayName: 'Nirma University, Sarkhej-Gandhinagar Highway',     lat: 23.0539, lng: 72.5136 },
  'nirma university':      { displayName: 'Nirma University, Sarkhej-Gandhinagar Highway',     lat: 23.0539, lng: 72.5136 },
  'pdpu':                  { displayName: 'PDPU, Gandhinagar',                                 lat: 23.1577, lng: 72.6645 },
  'svnit':                 { displayName: 'SVNIT, Surat',                                      lat: 21.1671, lng: 72.7896 },
  'bits':                  { displayName: 'BITS Pilani Goa Campus',                            lat: 15.4054, lng: 73.9785 },
  'amity':                 { displayName: 'Amity University, Shela',                           lat: 22.9939, lng: 72.4773 },
  'silver oak':            { displayName: 'Silver Oak University, Gota',                       lat: 23.0975, lng: 72.5431 },
  'ganpat':                { displayName: 'Ganpat University, Mehsana Highway',                lat: 23.7243, lng: 72.5131 },
  'ld engineering':        { displayName: 'LD Engineering College, Navrangpura',               lat: 23.0245, lng: 72.5682 },
  'ldrp':                  { displayName: 'LDRP Institute, Gandhinagar',                       lat: 23.2243, lng: 72.6543 },
  'dhirubhai ambani':      { displayName: 'Dhirubhai Ambani Institute, Gandhinagar',           lat: 23.1543, lng: 72.6645 },
  'daiict':                { displayName: 'DA-IICT, Gandhinagar',                              lat: 23.1543, lng: 72.6645 },
  'vit':                   { displayName: 'VIT Ahmedabad, Gandhinagar Highway',                lat: 23.0820, lng: 72.5420 },
  'ict':                   { displayName: 'ICT Mumbai (Matunga)',                              lat: 19.0224, lng: 72.8680 },
  'atmiya':                { displayName: 'Atmiya University, Rajkot',                         lat: 22.2891, lng: 70.7695 },
  'socet':                 { displayName: 'SOCET, Kadi',                                       lat: 23.2980, lng: 72.3368 },
  'sal':                   { displayName: 'SAL Engineering College, Oganaj',                   lat: 23.0859, lng: 72.4918 },

  // ── Ahmedabad Neighborhoods & Areas ─────────────────────────────────────
  'sg highway':            { displayName: 'SG Highway, Ahmedabad',      lat: 23.0230, lng: 72.5250 },
  'satellite':             { displayName: 'Satellite, Ahmedabad',        lat: 23.0243, lng: 72.5269 },
  'vastrapur':             { displayName: 'Vastrapur, Ahmedabad',        lat: 23.0289, lng: 72.5326 },
  'thaltej':               { displayName: 'Thaltej, Ahmedabad',          lat: 23.0520, lng: 72.5125 },
  'bopal':                 { displayName: 'Bopal, Ahmedabad',            lat: 23.0020, lng: 72.4627 },
  'shela':                 { displayName: 'Shela, Ahmedabad',            lat: 22.9905, lng: 72.4644 },
  'shilaj':                { displayName: 'Shilaj, Ahmedabad',           lat: 23.0168, lng: 72.4789 },
  'makarba':               { displayName: 'Makarba, Ahmedabad',          lat: 23.0350, lng: 72.5060 },
  'navrangpura':           { displayName: 'Navrangpura, Ahmedabad',      lat: 23.0350, lng: 72.5679 },
  'paldi':                 { displayName: 'Paldi, Ahmedabad',            lat: 23.0170, lng: 72.5720 },
  'ellis bridge':          { displayName: 'Ellis Bridge, Ahmedabad',     lat: 23.0237, lng: 72.5683 },
  'maninagar':             { displayName: 'Maninagar, Ahmedabad',        lat: 22.9990, lng: 72.6047 },
  'nikol':                 { displayName: 'Nikol, Ahmedabad',            lat: 23.0545, lng: 72.6450 },
  'naroda':                { displayName: 'Naroda, Ahmedabad',           lat: 23.0920, lng: 72.6450 },
  'vastral':               { displayName: 'Vastral, Ahmedabad',          lat: 22.9906, lng: 72.6639 },
  'ranip':                 { displayName: 'Ranip, Ahmedabad',            lat: 23.0815, lng: 72.5463 },
  'gota':                  { displayName: 'Gota, Ahmedabad',             lat: 23.0950, lng: 72.5472 },
  'chandkheda':            { displayName: 'Chandkheda, Ahmedabad',       lat: 23.1066, lng: 72.5877 },
  'motera':                { displayName: 'Motera, Ahmedabad',           lat: 23.0943, lng: 72.5877 },
  'sabarmati':             { displayName: 'Sabarmati, Ahmedabad',        lat: 23.0810, lng: 72.5836 },
  'ambawadi':              { displayName: 'Ambawadi, Ahmedabad',         lat: 23.0300, lng: 72.5530 },
  'jodhpur':               { displayName: 'Jodhpur, Ahmedabad',          lat: 23.0119, lng: 72.5285 },
  'bodakdev':              { displayName: 'Bodakdev, Ahmedabad',         lat: 23.0465, lng: 72.5258 },
  'prahlad nagar':         { displayName: 'Prahlad Nagar, Ahmedabad',   lat: 23.0121, lng: 72.5085 },
  'drive in':              { displayName: 'Drive-In Road, Ahmedabad',    lat: 23.0542, lng: 72.5406 },
  'drivein':               { displayName: 'Drive-In Road, Ahmedabad',    lat: 23.0542, lng: 72.5406 },
  'drive-in':              { displayName: 'Drive-In Road, Ahmedabad',    lat: 23.0542, lng: 72.5406 },
  'iskon':                 { displayName: 'ISKCON Temple, Satellite',    lat: 23.0297, lng: 72.5227 },
  'iskcon':                { displayName: 'ISKCON Temple, Satellite',    lat: 23.0297, lng: 72.5227 },
  'cross roads':           { displayName: 'Cross Roads Mall, Ahmedabad', lat: 23.0259, lng: 72.5281 },
  'crossroads':            { displayName: 'Cross Roads Mall, Ahmedabad', lat: 23.0259, lng: 72.5281 },
  'alphawon':              { displayName: 'AlphaOne Mall, Vastrapur',    lat: 23.0381, lng: 72.5303 },
  'alpha one':             { displayName: 'AlphaOne Mall, Vastrapur',    lat: 23.0381, lng: 72.5303 },
  'vr mall':               { displayName: 'VR Mall, Sindhu Bhavan',      lat: 23.0494, lng: 72.5068 },
  'acropolis':             { displayName: 'Acropolis Mall, Vastrapur',   lat: 23.0325, lng: 72.5318 },
  'palladium':             { displayName: 'Palladium Mall, Paldi',       lat: 23.0144, lng: 72.5748 },
  'one mall':              { displayName: 'One Mall, Manekbaug',         lat: 23.0067, lng: 72.5535 },
  'vaishnodevi':           { displayName: 'Vaishnodevi, Ahmedabad',      lat: 23.1278, lng: 72.5347 },
  'adalaj':                { displayName: 'Adalaj, Gandhinagar',         lat: 23.1667, lng: 72.5822 },
  'ognaj':                 { displayName: 'Ognaj, Ahmedabad',            lat: 23.0870, lng: 72.4925 },
  'oganaj':                { displayName: 'Ognaj, Ahmedabad',            lat: 23.0870, lng: 72.4925 },
  'vatva':                 { displayName: 'Vatva, Ahmedabad',            lat: 22.9672, lng: 72.6256 },
  'odhav':                 { displayName: 'Odhav, Ahmedabad',            lat: 23.0050, lng: 72.6400 },
  'naranpura':             { displayName: 'Naranpura, Ahmedabad',        lat: 23.0593, lng: 72.5590 },
  'gurukul':               { displayName: 'Gurukul, Ahmedabad',          lat: 23.0355, lng: 72.5360 },
  'memorandum':            { displayName: 'Memco, Ahmedabad',            lat: 23.0508, lng: 72.5967 },
  'memco':                 { displayName: 'Memco, Ahmedabad',            lat: 23.0508, lng: 72.5967 },
  'kubernagar':            { displayName: 'Kubernagar, Ahmedabad',       lat: 23.0700, lng: 72.5895 },
  'saijpur':               { displayName: 'Saijpur, Ahmedabad',          lat: 23.0788, lng: 72.6027 },
  'singarva':              { displayName: 'Singarva, Ahmedabad',         lat: 22.9600, lng: 72.5100 },
  'jivraj':                { displayName: 'Jivraj Park, Ahmedabad',      lat: 23.0022, lng: 72.5648 },
  'vejalpur':              { displayName: 'Vejalpur, Ahmedabad',         lat: 23.0060, lng: 72.5421 },
  'nava vadaj':            { displayName: 'Nava Vadaj, Ahmedabad',       lat: 23.0464, lng: 72.5672 },
  'navarangpura':          { displayName: 'Navrangpura, Ahmedabad',      lat: 23.0350, lng: 72.5679 },
  'law garden':            { displayName: 'Law Garden, Navrangpura',     lat: 23.0286, lng: 72.5596 },
  'c g road':              { displayName: 'CG Road, Navrangpura',        lat: 23.0337, lng: 72.5596 },
  'cg road':               { displayName: 'CG Road, Navrangpura',        lat: 23.0337, lng: 72.5596 },
  'ashram road':           { displayName: 'Ashram Road, Ahmedabad',      lat: 23.0322, lng: 72.5765 },
  'relief road':           { displayName: 'Relief Road, Ahmedabad',      lat: 23.0262, lng: 72.5879 },
  'nehru bridge':          { displayName: 'Nehru Bridge, Ahmedabad',     lat: 23.0248, lng: 72.5770 },
  'income tax':            { displayName: 'Income Tax, Navrangpura',     lat: 23.0410, lng: 72.5719 },

  // ── Landmarks & Tourist Spots ────────────────────────────────────────────
  'sabarmati ashram':      { displayName: 'Sabarmati Ashram, Ahmedabad',   lat: 23.0614, lng: 72.5803 },
  'gandhi ashram':         { displayName: 'Gandhi Ashram, Sabarmati',       lat: 23.0614, lng: 72.5803 },
  'kankaria':              { displayName: 'Kankaria Lake, Ahmedabad',        lat: 22.9952, lng: 72.5987 },
  'kankaria lake':         { displayName: 'Kankaria Lake, Ahmedabad',        lat: 22.9952, lng: 72.5987 },
  'science city':          { displayName: 'Science City, Ahmedabad',         lat: 23.0553, lng: 72.5449 },
  'adalaj stepwell':       { displayName: 'Adalaj Stepwell, Adalaj',         lat: 23.1683, lng: 72.5832 },
  'ama':                   { displayName: 'Ahmedabad Management Association', lat: 23.0375, lng: 72.5548 },
  'atira':                 { displayName: 'ATIRA, Navrangpura',              lat: 23.0395, lng: 72.5633 },
  'isro':                  { displayName: 'ISRO Satellite Centre, Jodhpur', lat: 23.0337, lng: 72.5777 },
  'sac':                   { displayName: 'Space Application Centre, ISRO', lat: 23.0337, lng: 72.5777 },
  'gujarat high court':    { displayName: 'Gujarat High Court, Sola',        lat: 23.0602, lng: 72.5284 },
  'high court':            { displayName: 'Gujarat High Court, Sola',        lat: 23.0602, lng: 72.5284 },
  'collectorate':          { displayName: 'Collectorate, Old City',          lat: 23.0259, lng: 72.5878 },
  'civil hospital':        { displayName: 'Civil Hospital, Asarwa',          lat: 23.0408, lng: 72.6003 },
  'svp hospital':          { displayName: 'SVP Hospital, Ahmedabad',         lat: 23.0408, lng: 72.6003 },
  'shahibaug':             { displayName: 'Shahibaug, Ahmedabad',            lat: 23.0506, lng: 72.5946 },
  'sector 19':             { displayName: 'Sector 19, Gandhinagar',          lat: 23.2073, lng: 72.6509 },
  'gandhinagar':           { displayName: 'Gandhinagar, Gujarat',            lat: 23.2156, lng: 72.6369 },
  'secretariat':           { displayName: 'Gujarat Secretariat, Gandhinagar', lat: 23.2222, lng: 72.6503 },
  'airport':               { displayName: 'Sardar Patel Int\'l Airport',     lat: 23.0770, lng: 72.6347 },
  'ahmedabad airport':     { displayName: 'Sardar Patel Int\'l Airport',     lat: 23.0770, lng: 72.6347 },
  'svp airport':           { displayName: 'Sardar Patel Int\'l Airport',     lat: 23.0770, lng: 72.6347 },
  'railway station':       { displayName: 'Ahmedabad Railway Station',       lat: 23.0268, lng: 72.6043 },
  'kalupur station':       { displayName: 'Ahmedabad Railway Station',       lat: 23.0268, lng: 72.6043 },
  'bus stand':             { displayName: 'Ahmedabad Bus Stand (GSRTC)',      lat: 23.0258, lng: 72.6040 },
  'pirana':                { displayName: 'Pirana, Ahmedabad',               lat: 22.9706, lng: 72.5631 },
  'infocity':              { displayName: 'InfoCity, Gandhinagar',            lat: 23.1667, lng: 72.6366 },
  'gidc':                  { displayName: 'GIDC, Ahmedabad',                 lat: 23.0032, lng: 72.5981 },

  // ── Metro Stations (quick lookup) ────────────────────────────────────────
  'old high court':        { displayName: 'Old High Court Metro Station',    lat: 23.0253, lng: 72.5778 },
  'kalupur':               { displayName: 'Kalupur Metro Station',           lat: 23.0268, lng: 72.6043 },
  'sp stadium':            { displayName: 'SP Stadium Metro Station',        lat: 23.0278, lng: 72.5649 },
};

/**
 * Look up a query in the local landmarks dictionary.
 * Normalizes to lowercase, trims whitespace.
 */
function _localLookup(query) {
  const key = query.trim().toLowerCase();
  if (AHMEDABAD_LANDMARKS[key]) {
    return { ...AHMEDABAD_LANDMARKS[key], query, local: true, success: true };
  }
  // Partial match — try if any key starts with the query (for 3+ char queries)
  if (key.length >= 3) {
    for (const [lmKey, val] of Object.entries(AHMEDABAD_LANDMARKS)) {
      if (lmKey.startsWith(key) || lmKey.includes(key)) {
        return { ...val, query, local: true, success: true };
      }
    }
  }
  return null;
}

/**
 * Browser-direct Nominatim call (fallback only).
 * NOTE: bounded=0 so real Ahmedabad areas like Nikol, Naroda, ISCON etc.
 * are not filtered out by the viewbox boundary check.
 */
async function _nominatimDirect(query) {
  const params = new URLSearchParams({
    q:            `${query}, Ahmedabad, India`,
    format:       'json',
    limit:        '1',
    countrycodes: 'in',
    viewbox:      '72.40,22.85,72.85,23.30', // soft bias toward Ahmedabad
    bounded:      '0',                         // don't hard-restrict — allow nearby matches
  });
  const res  = await fetch(`${NOMINATIM_URL}?${params}`);
  const data = await res.json();
  if (!data.length) return null;
  return {
    success:     true,
    lat:         parseFloat(data[0].lat),
    lng:         parseFloat(data[0].lon),
    displayName: data[0].display_name,
    query,
    direct:      true,
  };
}

/**
 * Geocode a free-text Ahmedabad location.
 * Priority: local dictionary → backend proxy → browser-direct Nominatim
 * @param {string} query  e.g. "LJ", "CEPT", "Bopal", "SG Highway"
 * @returns {Promise<{lat, lng, displayName}>}
 */
export async function geocodeLocation(query) {
  // 0. Check local landmarks dictionary first (instant, no network)
  const local = _localLookup(query);
  if (local) return local;

  // 1. Try backend proxy
  try {
    const res = await api.get('/api/geocode', { params: { q: query } });
    return res.data;
  } catch (err) {
    // Backend 502 = Nominatim blocked server IP; fall back to browser-direct
    if (err.response?.status === 502 || !err.response) {
      const result = await _nominatimDirect(query);
      if (!result) {
        const e = new Error('Location not found');
        e.response = { status: 404 };
        throw e;
      }
      return result;
    }
    throw err; // re-throw 404 and other genuine errors
  }
}
