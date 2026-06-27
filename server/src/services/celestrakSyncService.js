const https = require('https');
const { parseTLE } = require('./tleImportService');
const { validateTLE } = require('./tleValidationService');
const OrbitalObject = require('../models/OrbitalObject');

/**
 * Downloads raw TLE data from the official public CelesTrak feed for a given group name.
 * Does not require API keys.
 * 
 * @param {string} groupName - The group name to fetch (active, stations, visual)
 * @returns {Promise<string>} Raw TLE text content
 */
const downloadTLE = (groupName) => {
  return new Promise((resolve, reject) => {
    const url = `https://celestrak.org/NORAD/elements/gp.php?GROUP=${groupName}&FORMAT=tle`;
    
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download CelesTrak TLE feed: HTTP Status ${res.statusCode}`));
        return;
      }
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve(data);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
};

/**
 * Synchronizes orbital objects from public CelesTrak TLE feeds.
 * Supports groups: active, stations, visual.
 * Reuse existing parser, validator, and creation logic.
 * Skip duplicates using catalogNumber.
 * 
 * @param {string} groupName - The group name to synchronize
 * @returns {Promise<Object>} Statistics of the sync operation
 */
const syncGroup = async (groupName) => {
  const supportedGroups = ['active', 'stations', 'visual'];
  if (!supportedGroups.includes(groupName)) {
    throw new Error(`Unsupported CelesTrak group: ${groupName}. Supported groups are: ${supportedGroups.join(', ')}`);
  }

  const tleText = await downloadTLE(groupName);
  const parsedSatellites = parseTLE(tleText);
  
  let downloaded = parsedSatellites.length;
  let imported = 0;
  let updated = 0; // Since we skip duplicates, updated is 0
  let skipped = 0;
  const errors = [];
  const processedInBatch = new Set();

  for (const sat of parsedSatellites) {
    const satNum = sat.satelliteNumber;
    
    // Check for batch duplicates
    if (processedInBatch.has(satNum)) {
      skipped++;
      continue;
    }
    processedInBatch.add(satNum);

    // Validate using existing TLE validator
    const validation = validateTLE(sat.tleLine1, sat.tleLine2);
    if (!validation.isValid) {
      skipped++;
      errors.push(`Satellite "${sat.satelliteName || satNum}" validation failed: ${validation.errors.join(', ')}`);
      continue;
    }

    try {
      // Skip duplicates using catalogNumber (check database)
      const existing = await OrbitalObject.findOne({ catalogNumber: satNum });
      if (existing) {
        skipped++;
        continue;
      }

      // Reuse the existing orbital object creation workflow
      const line2 = sat.tleLine2.trim();
      const meanMotion = parseFloat(line2.substring(52, 63).trim());
      const inclination = parseFloat(line2.substring(8, 16).trim());
      const eccentricity = parseFloat('.' + line2.substring(26, 33).trim());

      let orbitType = 'LEO';
      let altitudeKm = 400;
      let velocityKmPerSec = 7.7;

      if (!isNaN(meanMotion)) {
        if (meanMotion >= 11.25) orbitType = 'LEO';
        else if (meanMotion > 1.05 && meanMotion < 11.25) orbitType = 'MEO';
        else if (meanMotion >= 0.95 && meanMotion <= 1.05) orbitType = 'GEO';
        else orbitType = 'HEO';

        try {
          const G_M = 398600.4418; // km^3/s^2
          const R_E = 6378.1; // km
          const n_rad_s = (meanMotion * 2 * Math.PI) / 86400;
          const a = Math.pow(G_M / (n_rad_s * n_rad_s), 1/3);
          altitudeKm = Math.round((a - R_E) * 100) / 100;
          velocityKmPerSec = Math.round(Math.sqrt(G_M / a) * 10000) / 10000;
        } catch (mathErr) {
          // Keep defaults
        }
      }

      await OrbitalObject.create({
        name: sat.satelliteName,
        catalogNumber: satNum,
        objectType: 'Satellite',
        orbitType,
        altitudeKm,
        velocityKmPerSec,
        inclination,
        eccentricity,
        status: 'Active',
      });

      imported++;
    } catch (dbErr) {
      skipped++;
      errors.push(`Failed to create satellite "${sat.satelliteName || satNum}": ${dbErr.message}`);
    }
  }

  return {
    downloaded,
    imported,
    updated,
    skipped,
    errors,
  };
};

module.exports = {
  syncGroup,
};
