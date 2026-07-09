/**
 * Parses pasted TLE text block into structured satellite objects.
 *
 * Supports both standard 3-line TLE format:
 *   Line 0: Satellite Name
 *   Line 1: TLE Line 1 (starts with '1 ')
 *   Line 2: TLE Line 2 (starts with '2 ')
 * And 2-line format (where name is defaulted to the catalog number).
 *
 * @param {string} text - The raw pasted TLE text.
 * @returns {Array} List of parsed satellite objects.
 */
const getTLELine1NoradId = (line) => {
  const match = line.match(/^1\s+(\d{1,5})[A-Z]?\s/);
  return match ? match[1] : null;
};

const getTLELine2NoradId = (line) => {
  const match = line.match(/^2\s+(\d{1,5})\s/);
  return match ? match[1] : null;
};

const isLikelyCsvLine = (line) => {
  return (
    line.includes(',') &&
    /OBJECT_NAME|NORAD_CAT_ID|MEAN_MOTION|EPOCH/i.test(line)
  );
};

const parseTLE = (text) => {
  if (!text || typeof text !== 'string') return [];
  
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  
  const satellites = [];
  let i = 0;

  while (i < lines.length) {
    if (isLikelyCsvLine(lines[i])) {
      return [];
    }

    const currentLine1NoradId = getTLELine1NoradId(lines[i]);
    const currentLine2NoradId = i + 1 < lines.length ? getTLELine2NoradId(lines[i + 1]) : null;
    const namedLine1NoradId = i + 1 < lines.length ? getTLELine1NoradId(lines[i + 1]) : null;
    const namedLine2NoradId = i + 2 < lines.length ? getTLELine2NoradId(lines[i + 2]) : null;

    // 1. Standard 3-line format
    if (
      i + 2 < lines.length &&
      namedLine1NoradId &&
      namedLine2NoradId &&
      namedLine1NoradId === namedLine2NoradId
    ) {
      const noradId = namedLine1NoradId;
      satellites.push({
        satelliteName: lines[i],
        tleLine1: lines[i + 1],
        tleLine2: lines[i + 2],
        satelliteNumber: noradId,
        noradId,
        internationalDesignator: lines[i + 1].substring(9, 17).trim(),
      });
      i += 3;
    } 
    // 2. 2-line format (missing name line)
    else if (
      i + 1 < lines.length &&
      currentLine1NoradId &&
      currentLine2NoradId &&
      currentLine1NoradId === currentLine2NoradId
    ) {
      const satNum = currentLine1NoradId;
      satellites.push({
        satelliteName: `SAT-${satNum}`,
        tleLine1: lines[i],
        tleLine2: lines[i + 1],
        satelliteNumber: satNum,
        noradId: satNum,
        internationalDesignator: lines[i].substring(9, 17).trim(),
      });
      i += 2;
    } 
    // 3. Skip malformed lines
    else {
      i++;
    }
  }

  return satellites;
};

const getOrbitTypeFromMeanMotion = (meanMotion) => {
  if (Number.isNaN(meanMotion)) return 'LEO';
  if (meanMotion >= 11.25) return 'LEO';
  if (meanMotion > 1.05 && meanMotion < 11.25) return 'MEO';
  if (meanMotion >= 0.95 && meanMotion <= 1.05) return 'GEO';
  return 'HEO';
};

const calculateOrbitSummary = (meanMotion) => {
  if (Number.isNaN(meanMotion)) {
    return {
      altitudeKm: 400,
      velocityKmPerSec: 7.7,
    };
  }

  const gravitationalParameter = 398600.4418;
  const earthRadiusKm = 6378.1;
  const meanMotionRadiansPerSecond = (meanMotion * 2 * Math.PI) / 86400;
  const semiMajorAxisKm = Math.pow(
    gravitationalParameter / (meanMotionRadiansPerSecond * meanMotionRadiansPerSecond),
    1 / 3
  );

  return {
    altitudeKm: Math.round((semiMajorAxisKm - earthRadiusKm) * 100) / 100,
    velocityKmPerSec:
      Math.round(Math.sqrt(gravitationalParameter / semiMajorAxisKm) * 10000) / 10000,
  };
};

const extractTLEOrbitalData = (satellite) => {
  const line2 = satellite.tleLine2.trim();
  const finiteOrUndefined = (value) => (Number.isFinite(value) ? value : undefined);
  const meanMotion = parseFloat(line2.substring(52, 63).trim());
  const inclination = parseFloat(line2.substring(8, 16).trim());
  const raan = parseFloat(line2.substring(17, 25).trim());
  const eccentricity = parseFloat(`.${line2.substring(26, 33).trim()}`);
  const argumentOfPerigee = parseFloat(line2.substring(34, 42).trim());
  const meanAnomaly = parseFloat(line2.substring(43, 51).trim());
  const { altitudeKm, velocityKmPerSec } = calculateOrbitSummary(meanMotion);

  return {
    orbitType: getOrbitTypeFromMeanMotion(meanMotion),
    altitudeKm,
    velocityKmPerSec,
    inclination: Number.isFinite(inclination) ? inclination : 0,
    eccentricity: Number.isFinite(eccentricity) ? eccentricity : 0,
    orbitalElements: {
      eccentricity: finiteOrUndefined(eccentricity),
      raan: finiteOrUndefined(raan),
      argumentOfPerigee: finiteOrUndefined(argumentOfPerigee),
      meanAnomaly: finiteOrUndefined(meanAnomaly),
      meanMotion: finiteOrUndefined(meanMotion),
    },
  };
};

const buildOrbitalObjectFromTLE = ({
  satellite,
  validation,
  source = 'Manual Import',
  objectType = 'Satellite',
}) => {
  const now = new Date();
  const orbitalData = extractTLEOrbitalData(satellite);
  const noradId = satellite.noradId || satellite.satelliteNumber;

  return {
    name: satellite.satelliteName,
    catalogNumber: noradId,
    noradId,
    internationalDesignator: satellite.internationalDesignator,
    objectType,
    ...orbitalData,
    status: objectType === 'Debris' ? 'Inactive' : 'Active',
    tle: {
      line1: satellite.tleLine1,
      line2: satellite.tleLine2,
      epoch: validation?.epoch,
      source,
      lastUpdated: now,
    },
    tracking: {
      dataSource: source,
    },
  };
};

module.exports = {
  buildOrbitalObjectFromTLE,
  extractTLEOrbitalData,
  parseTLE,
};
