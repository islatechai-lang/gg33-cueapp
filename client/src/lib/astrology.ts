// client/src/lib/astrology.ts
// Client-side astrology calculation engine using simplified astronomical algorithms

export interface PlanetPosition {
  name: string;        // e.g. 'Sun', 'Moon', 'Mercury'
  longitude: number;   // ecliptic longitude 0-360
  sign: string;        // e.g. 'Aries', 'Taurus'
  signIndex: number;   // 0-11
  degree: number;      // degree within sign 0-29
  minute: number;      // arc minute 0-59
  retrograde: boolean;
  glyph: string;       // unicode glyph
  color: string;       // hex color for rendering
}

export interface AspectData {
  planet1: string;
  planet2: string;
  planet1Longitude: number;
  planet2Longitude: number;
  type: 'conjunction' | 'sextile' | 'square' | 'trine' | 'opposition';
  angle: number;       // actual angle between planets
  orb: number;         // deviation from exact aspect
  harmonious: boolean; // true for trine/sextile/conjunction, false for square/opposition
  symbol: string;      // unicode symbol for aspect
}

export interface HouseCusp {
  house: number;       // 1-12
  longitude: number;   // ecliptic longitude
  sign: string;
  degree: number;
}

export interface BirthChartData {
  planets: PlanetPosition[];   // Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto
  houses: HouseCusp[];         // 12 house cusps
  ascendant: number;           // ecliptic longitude of ascendant
  ascendantSign: string;
  midheaven: number;
  midheavenSign: string;
  aspects: AspectData[];
  hasBirthTime: boolean;       // false if birth time was not provided (defaulted to 12:00)
  hasLocation: boolean;        // false if location couldn't be geocoded
}

export const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

export const ZODIAC_GLYPHS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];

export const PLANET_NAMES = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];

export const PLANET_GLYPHS: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂',
  Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇'
};

export const PLANET_COLORS: Record<string, string> = {
  Sun: '#F59E0B', Moon: '#94A3B8', Mercury: '#06B6D4', Venus: '#EC4899', Mars: '#EF4444',
  Jupiter: '#F97316', Saturn: '#78716C', Uranus: '#38BDF8', Neptune: '#8B5CF6', Pluto: '#991B1B'
};

export const ELEMENT_FOR_SIGN: Record<string, string> = {
  Aries: 'Fire', Leo: 'Fire', Sagittarius: 'Fire',
  Taurus: 'Earth', Virgo: 'Earth', Capricorn: 'Earth',
  Gemini: 'Air', Libra: 'Air', Aquarius: 'Air',
  Cancer: 'Water', Scorpio: 'Water', Pisces: 'Water'
};

export const ELEMENT_COLORS: Record<string, string> = {
  Fire: '#EF4444', Earth: '#22C55E', Air: '#38BDF8', Water: '#6366F1'
};

// Major World Cities Database for fallback geocoding
const CITIES_DB: Record<string, { lat: number; lon: number }> = {
  'new york': { lat: 40.7128, lon: -74.0060 },
  'los angeles': { lat: 34.0522, lon: -118.2437 },
  'chicago': { lat: 41.8781, lon: -87.6298 },
  'houston': { lat: 29.7604, lon: -95.3698 },
  'phoenix': { lat: 33.4484, lon: -112.0740 },
  'philadelphia': { lat: 39.9526, lon: -75.1652 },
  'san antonio': { lat: 29.4241, lon: -98.4936 },
  'san diego': { lat: 32.7157, lon: -117.1611 },
  'dallas': { lat: 32.7767, lon: -96.7970 },
  'san francisco': { lat: 37.7749, lon: -122.4194 },
  'seattle': { lat: 47.6062, lon: -122.3321 },
  'denver': { lat: 39.7392, lon: -104.9903 },
  'boston': { lat: 42.3601, lon: -71.0589 },
  'miami': { lat: 25.7617, lon: -80.1918 },
  'atlanta': { lat: 33.7490, lon: -84.3880 },
  'las vegas': { lat: 36.1699, lon: -115.1398 },
  'portland': { lat: 45.5152, lon: -122.6784 },
  'detroit': { lat: 42.3314, lon: -83.0458 },
  'minneapolis': { lat: 44.9778, lon: -93.2650 },
  'nashville': { lat: 36.1627, lon: -86.7816 },
  'austin': { lat: 30.2672, lon: -97.7431 },
  'washington': { lat: 38.9072, lon: -77.0369 },
  'toronto': { lat: 43.6532, lon: -79.3832 },
  'vancouver': { lat: 49.2827, lon: -123.1207 },
  'montreal': { lat: 45.5017, lon: -73.5673 },
  'london': { lat: 51.5074, lon: -0.1278 },
  'paris': { lat: 48.8566, lon: 2.3522 },
  'berlin': { lat: 52.5200, lon: 13.4050 },
  'rome': { lat: 41.9028, lon: 12.4964 },
  'madrid': { lat: 40.4168, lon: -3.7038 },
  'barcelona': { lat: 41.3874, lon: 2.1686 },
  'amsterdam': { lat: 52.3676, lon: 4.9041 },
  'brussels': { lat: 50.8503, lon: 4.3517 },
  'vienna': { lat: 48.2082, lon: 16.3738 },
  'zurich': { lat: 47.3769, lon: 8.5417 },
  'munich': { lat: 48.1351, lon: 11.5820 },
  'stockholm': { lat: 59.3293, lon: 18.0686 },
  'oslo': { lat: 59.9139, lon: 10.7522 },
  'copenhagen': { lat: 55.6761, lon: 12.5683 },
  'helsinki': { lat: 60.1699, lon: 24.9384 },
  'dublin': { lat: 53.3498, lon: -6.2603 },
  'lisbon': { lat: 38.7223, lon: -9.1393 },
  'athens': { lat: 37.9838, lon: 23.7275 },
  'istanbul': { lat: 41.0082, lon: 28.9784 },
  'moscow': { lat: 55.7558, lon: 37.6173 },
  'tokyo': { lat: 35.6762, lon: 139.6503 },
  'osaka': { lat: 34.6937, lon: 135.5023 },
  'seoul': { lat: 37.5665, lon: 126.9780 },
  'beijing': { lat: 39.9042, lon: 116.4074 },
  'shanghai': { lat: 31.2304, lon: 121.4737 },
  'hong kong': { lat: 22.3193, lon: 114.1694 },
  'taipei': { lat: 25.0330, lon: 121.5654 },
  'singapore': { lat: 1.3521, lon: 103.8198 },
  'bangkok': { lat: 13.7563, lon: 100.5018 },
  'jakarta': { lat: -6.2088, lon: 106.8456 },
  'manila': { lat: 14.5995, lon: 120.9842 },
  'kuala lumpur': { lat: 3.1390, lon: 101.6869 },
  'ho chi minh': { lat: 10.8231, lon: 106.6297 },
  'hanoi': { lat: 21.0278, lon: 105.8342 },
  'mumbai': { lat: 19.0760, lon: 72.8777 },
  'delhi': { lat: 28.7041, lon: 77.1025 },
  'bangalore': { lat: 12.9716, lon: 77.5946 },
  'chennai': { lat: 13.0827, lon: 80.2707 },
  'kolkata': { lat: 22.5726, lon: 88.3639 },
  'dubai': { lat: 25.2048, lon: 55.2708 },
  'abu dhabi': { lat: 24.4539, lon: 54.3773 },
  'riyadh': { lat: 24.7136, lon: 46.6753 },
  'doha': { lat: 25.2854, lon: 51.5310 },
  'cairo': { lat: 30.0444, lon: 31.2357 },
  'lagos': { lat: 6.5244, lon: 3.3792 },
  'johannesburg': { lat: -26.2041, lon: 28.0473 },
  'cape town': { lat: -33.9249, lon: 18.4241 },
  'nairobi': { lat: -1.2921, lon: 36.8219 },
  'sydney': { lat: -33.8688, lon: 151.2093 },
  'melbourne': { lat: -37.8136, lon: 144.9631 },
  'auckland': { lat: -36.8485, lon: 174.7633 },
  'lima': { lat: -12.0464, lon: -77.0428 },
  'bogota': { lat: 4.7110, lon: -74.0721 },
  'buenos aires': { lat: -34.6037, lon: -58.3816 },
  'santiago': { lat: -33.4489, lon: -70.6693 },
  'mexico city': { lat: 19.4326, lon: -99.1332 },
  'sao paulo': { lat: -23.5505, lon: -46.6333 },
  'rio de janeiro': { lat: -22.9068, lon: -43.1729 }
};

// Normalize angle to 0 - 360
function norm360(angle: number): number {
  let a = angle % 360;
  if (a < 0) a += 360;
  return a;
}

// Convert degrees to radians
function d2r(deg: number): number {
  return (deg * Math.PI) / 180;
}

// Convert radians to degrees
function r2d(rad: number): number {
  return (rad * 180) / Math.PI;
}

// Calculate Julian Day Number
function getJulianDay(date: Date, hoursUTC: number): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();

  let Y = y;
  let M = m;
  if (m <= 2) {
    Y = y - 1;
    M = m + 12;
  }

  // Gregorian calendar adoption
  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);

  const JD = Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + d + B - 1524.5 + hoursUTC / 24;
  return JD;
}

// Parse location string to coordinates
export function geocodeLocation(location: string): { lat: number; lon: number } | null {
  if (!location) return null;
  const clean = location.trim().toLowerCase();

  // Try parsing coordinates like "40.7128, -74.0060"
  const coordRegex = /^(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)$/;
  const match = clean.match(coordRegex);
  if (match) {
    const lat = parseFloat(match[1]);
    const lon = parseFloat(match[3]);
    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return { lat, lon };
    }
  }

  // Database search
  for (const city of Object.keys(CITIES_DB)) {
    if (clean.includes(city) || city.includes(clean)) {
      return CITIES_DB[city];
    }
  }

  return null;
}

// Planetary orbital elements at J2000 (T = 0) and century rates (rates per century)
// Keplerian elements are: semi-major axis (a), eccentricity (e), inclination (i), longitude of ascending node (Omega), longitude of perihelion (varpi), mean longitude (L)
interface OrbitalElements {
  a: number;
  aRate: number;
  e: number;
  eRate: number;
  i: number;
  iRate: number;
  Omega: number;
  OmegaRate: number;
  varpi: number;
  varpiRate: number;
  L: number;
  LRate: number;
}

const ORBITAL_PARAMS: Record<string, OrbitalElements> = {
  Mercury: {
    a: 0.38709927, aRate: 0,
    e: 0.20563593, eRate: 0.00001906,
    i: 7.00497, iRate: -0.00594,
    Omega: 48.33167, OmegaRate: -0.12530,
    varpi: 77.45780, varpiRate: 0.16047,
    L: 252.25032, LRate: 149472.67411
  },
  Venus: {
    a: 0.72333566, aRate: 0,
    e: 0.00677672, eRate: -0.00004107,
    i: 3.39467, iRate: -0.00078,
    Omega: 76.67984, OmegaRate: -0.27769,
    varpi: 131.56371, varpiRate: 0.00268,
    L: 181.97973, LRate: 58517.81539
  },
  Earth: { // Used for heliocentric -> geocentric correction
    a: 1.00000261, aRate: 0,
    e: 0.01671123, eRate: -0.00004392,
    i: 0.0, iRate: 0,
    Omega: 0.0, OmegaRate: 0,
    varpi: 102.93768, varpiRate: 0.32327,
    L: 100.46457, LRate: 35999.37245
  },
  Mars: {
    a: 1.52371034, aRate: 0,
    e: 0.09339410, eRate: 0.00007882,
    i: 1.84969, iRate: -0.00813,
    Omega: 49.55954, OmegaRate: -0.29257,
    varpi: 336.04084, varpiRate: 0.44442,
    L: 355.45332, LRate: 19140.30268
  },
  Jupiter: {
    a: 5.20288700, aRate: 0,
    e: 0.04838624, eRate: -0.00013253,
    i: 1.30327, iRate: -0.01953,
    Omega: 100.47391, OmegaRate: 0.20009,
    varpi: 14.72847, varpiRate: 0.21252,
    L: 34.39645, LRate: 3034.74613
  },
  Saturn: {
    a: 9.53667594, aRate: 0,
    e: 0.05386179, eRate: -0.00050991,
    i: 2.48888, iRate: 0.00193,
    Omega: 113.66242, OmegaRate: -0.28867,
    varpi: 92.59887, varpiRate: 0.90483,
    L: 49.95424, LRate: 1222.11494
  },
  Uranus: {
    a: 19.18916464, aRate: 0,
    e: 0.04725744, eRate: -0.00004397,
    i: 0.77320, iRate: -0.00242,
    Omega: 74.01693, OmegaRate: 0.04240,
    varpi: 170.95427, varpiRate: 0.40805,
    L: 313.23810, LRate: 428.48202
  },
  Neptune: {
    a: 30.06992276, aRate: 0,
    e: 0.00859048, eRate: 0.00005105,
    i: 1.77004, iRate: 0.00035,
    Omega: 131.78423, OmegaRate: -0.00606,
    varpi: 44.96476, varpiRate: -0.32241,
    L: 304.88003, LRate: 218.45850
  },
  Pluto: {
    a: 39.48211675, aRate: 0,
    e: 0.24882730, eRate: 0.00005170,
    i: 17.14001, iRate: 0.00004,
    Omega: 110.30394, OmegaRate: -0.01183,
    varpi: 224.06892, varpiRate: -0.04062,
    L: 238.92903, LRate: 145.20780
  }
};

// Kepler solver
function solveKepler(M: number, e: number): number {
  let E = M;
  const tol = 1e-6;
  const maxIter = 100;
  for (let iter = 0; iter < maxIter; iter++) {
    const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= dE;
    if (Math.abs(dE) < tol) break;
  }
  return E;
}

// Compute heliocentric coordinates (X, Y, Z)
function getHeliocentricCoords(planet: string, T: number): { x: number; y: number; z: number } {
  const p = ORBITAL_PARAMS[planet];
  if (!p) return { x: 0, y: 0, z: 0 };

  const a = p.a + p.aRate * T;
  const e = p.e + p.eRate * T;
  const i = norm360(p.i + p.iRate * T);
  const Omega = norm360(p.Omega + p.OmegaRate * T);
  const varpi = norm360(p.varpi + p.varpiRate * T);
  const L = norm360(p.L + p.LRate * T);

  const M = d2r(norm360(L - varpi));
  const E = solveKepler(M, e);

  // True anomaly ν
  const nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
  // Radius vector r
  const r = a * (1 - e * Math.cos(E));

  const omega = d2r(norm360(varpi - Omega));
  const radOmega = d2r(Omega);
  const radI = d2r(i);
  const nu_omega = nu + omega;

  const xh = r * (Math.cos(radOmega) * Math.cos(nu_omega) - Math.sin(radOmega) * Math.sin(nu_omega) * Math.cos(radI));
  const yh = r * (Math.sin(radOmega) * Math.cos(nu_omega) + Math.cos(radOmega) * Math.sin(nu_omega) * Math.cos(radI));
  const zh = r * Math.sin(nu_omega) * Math.sin(radI);

  return { x: xh, y: yh, z: zh };
}

// Calculate geocentric longitude for a planet
function getGeocentricLongitude(planet: string, T: number): number {
  const helio = getHeliocentricCoords(planet, T);
  const earth = getHeliocentricCoords('Earth', T);

  // Geocentric vector = heliocentric planet - heliocentric earth
  const xg = helio.x - earth.x;
  const yg = helio.y - earth.y;

  const longitude = r2d(Math.atan2(yg, xg));
  return norm360(longitude);
}

// Meeus' simplified solar longitude (~0.01 degree accuracy)
function getSunLongitude(T: number): number {
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const C = (1.914602 - 0.004817 * T) * Math.sin(d2r(M)) + 0.019993 * Math.sin(d2r(2 * M)) + 0.000289 * Math.sin(d2r(3 * M));
  return norm360(L0 + C);
}

// Meeus' simplified Moon longitude (~1 degree accuracy)
function getMoonLongitude(T: number): number {
  const Lp = 218.3165 + 481267.8813 * T;
  const D = 297.8502 + 445267.1115 * T;
  const M = 357.5291 + 35999.0503 * T;
  const Mp = 134.9634 + 477198.8676 * T;
  const F = 93.2720 + 483202.0175 * T;

  const longitude = Lp +
    6.289 * Math.sin(d2r(Mp)) +
    1.274 * Math.sin(d2r(2 * D - Mp)) +
    0.658 * Math.sin(d2r(2 * D)) +
    0.214 * Math.sin(d2r(2 * Mp)) -
    0.186 * Math.sin(d2r(M)) -
    0.114 * Math.sin(d2r(2 * F)) +
    0.059 * Math.sin(d2r(2 * D - 2 * Mp)) +
    0.057 * Math.sin(d2r(2 * D - M - Mp)) +
    0.053 * Math.sin(d2r(2 * D + Mp)) +
    0.046 * Math.sin(d2r(2 * D - M)) -
    0.041 * Math.sin(d2r(M - Mp));

  return norm360(longitude);
}

// Map coordinate longitude to sign index & degrees
function getSignDetails(longitude: number): { sign: string; signIndex: number; degree: number; minute: number } {
  const norm = norm360(longitude);
  const signIndex = Math.floor(norm / 30);
  const sign = ZODIAC_SIGNS[signIndex];
  const exactDegree = norm % 30;
  const degree = Math.floor(exactDegree);
  const minute = Math.floor((exactDegree % 1) * 60);

  return { sign, signIndex, degree, minute };
}

// Calculate birth chart data
export function calculateBirthChart(birthDate: Date, birthTime: string, birthLocation: string): BirthChartData {
  let hasBirthTime = true;
  let hasLocation = true;

  // 1. Time parsing
  let timeStr = birthTime ? birthTime.trim() : '';
  if (!timeStr || timeStr.toLowerCase() === 'unknown' || timeStr === '12:00') {
    timeStr = '12:00';
    hasBirthTime = false;
  }

  const timeParts = timeStr.split(':');
  const hours = parseInt(timeParts[0]) || 12;
  const minutes = parseInt(timeParts[1]) || 0;
  const seconds = parseInt(timeParts[2]) || 0;

  // Calculate local hours decimal
  const localHours = hours + minutes / 60 + seconds / 3600;

  // For simplicity, we assume UTC timezone offset is 0 unless location geocoding gives us coordinates,
  // in which case we approximate offset by longitude (15 degrees per hour).
  // This is a reasonable approximation for client-side offline astrology.
  let coordinates = geocodeLocation(birthLocation);
  if (!coordinates) {
    coordinates = { lat: 0, lon: 0 };
    hasLocation = false;
  }

  // Estimate timezone from longitude
  const tzOffset = Math.round(coordinates.lon / 15);
  const utcHours = localHours - tzOffset;

  // 2. Julian day calculation
  const jd = getJulianDay(birthDate, utcHours);
  const T = (jd - 2451545.0) / 36525;

  // 3. Planet positions
  const planets: PlanetPosition[] = [];

  // Sun
  const sunLong = getSunLongitude(T);
  const sunDetails = getSignDetails(sunLong);
  planets.push({
    name: 'Sun',
    longitude: sunLong,
    ...sunDetails,
    retrograde: false,
    glyph: PLANET_GLYPHS['Sun'],
    color: PLANET_COLORS['Sun']
  });

  // Moon
  const moonLong = getMoonLongitude(T);
  const moonDetails = getSignDetails(moonLong);
  planets.push({
    name: 'Moon',
    longitude: moonLong,
    ...moonDetails,
    retrograde: false,
    glyph: PLANET_GLYPHS['Moon'],
    color: PLANET_COLORS['Moon']
  });

  // Inner and Outer planets
  const otherPlanets = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
  const dT = 0.0001; // small delta for retrograde calculation

  for (const name of otherPlanets) {
    const long = getGeocentricLongitude(name, T);
    const longNext = getGeocentricLongitude(name, T + dT);

    // If longitude is decreasing, it is retrograde
    let diff = longNext - long;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    const retrograde = diff < 0;

    const details = getSignDetails(long);
    planets.push({
      name,
      longitude: long,
      ...details,
      retrograde,
      glyph: PLANET_GLYPHS[name],
      color: PLANET_COLORS[name]
    });
  }

  // 4. Sidereal Time & Cusps
  // GMST
  const gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T - T * T * T / 38710000;
  const lst = norm360(gmst + coordinates.lon);

  // Obliquity of the Ecliptic
  const obliquity = 23.4393 - 0.0130 * T;

  // Ascendant
  const radLST = d2r(lst);
  const radObliq = d2r(obliquity);
  const radLat = d2r(coordinates.lat);

  // ASC formula
  let asc = r2d(Math.atan2(-Math.cos(radLST), Math.sin(radObliq) * Math.tan(radLat) + Math.cos(radObliq) * Math.sin(radLST)));
  asc = norm360(asc);
  const ascDetails = getSignDetails(asc);

  // Midheaven
  let mc = r2d(Math.atan2(Math.sin(radLST), Math.cos(radLST) * Math.cos(radObliq)));
  mc = norm360(mc);
  const mcDetails = getSignDetails(mc);

  // Equal House system division based on Ascendant
  const houses: HouseCusp[] = [];
  for (let h = 1; h <= 12; h++) {
    const cuspLong = norm360(asc + (h - 1) * 30);
    const details = getSignDetails(cuspLong);
    houses.push({
      house: h,
      longitude: cuspLong,
      sign: details.sign,
      degree: details.degree
    });
  }

  // 5. Aspects calculation
  const aspects: AspectData[] = [];
  const aspectDefs = [
    { type: 'conjunction' as const, angle: 0, orb: 8, symbol: '☌', harmonious: true },
    { type: 'sextile' as const, angle: 60, orb: 6, symbol: '⚹', harmonious: true },
    { type: 'square' as const, angle: 90, orb: 7, symbol: '□', harmonious: false },
    { type: 'trine' as const, angle: 120, orb: 8, symbol: '△', harmonious: true },
    { type: 'opposition' as const, angle: 180, orb: 8, symbol: '☍', harmonious: false }
  ];

  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const p1 = planets[i];
      const p2 = planets[j];

      // Calculate shortest angular distance
      let diff = Math.abs(p1.longitude - p2.longitude);
      if (diff > 180) diff = 360 - diff;

      for (const def of aspectDefs) {
        const orbValue = Math.abs(diff - def.angle);
        if (orbValue <= def.orb) {
          aspects.push({
            planet1: p1.name,
            planet2: p2.name,
            planet1Longitude: p1.longitude,
            planet2Longitude: p2.longitude,
            type: def.type,
            angle: diff,
            orb: orbValue,
            harmonious: def.harmonious,
            symbol: def.symbol
          });
        }
      }
    }
  }

  // Sort aspects by orb (exactness)
  aspects.sort((a, b) => a.orb - b.orb);

  return {
    planets,
    houses,
    ascendant: asc,
    ascendantSign: ascDetails.sign,
    midheaven: mc,
    midheavenSign: mcDetails.sign,
    aspects,
    hasBirthTime,
    hasLocation
  };
}
