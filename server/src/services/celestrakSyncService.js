const https = require('https');
const { buildOrbitalObjectFromTLE, parseTLE } = require('./tleImportService');
const { validateTLE } = require('./tleValidationService');
const OrbitalObject = require('../models/OrbitalObject');

const supportedGroups = ['active', 'debris', 'stations', 'visual'];
const celestrakRequestTimeoutMs = 30000;
const celestrakMaxAttempts = 3;
const celestrakRetryDelayMs = 1000;
const celestrakUserAgent = 'AI-Space-Debris-System/1.0';

const buildCelesTrakUrl = (groupName) => {
  const url = new URL('https://celestrak.org/NORAD/elements/gp.php');
  url.searchParams.set('GROUP', groupName);
  url.searchParams.set('FORMAT', 'tle');
  return url.toString();
};

const looksLikeCsvResponse = (text) => {
  const firstLine = text.trim().split(/\r?\n/, 1)[0] || '';
  return (
    firstLine.includes(',') &&
    /OBJECT_NAME|NORAD_CAT_ID|MEAN_MOTION|EPOCH/i.test(firstLine)
  );
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const requestTLEOnce = (url) => {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      family: 4,
      headers: {
        'User-Agent': celestrakUserAgent,
      },
    };

    const req = https.get(url, requestOptions, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        reject(new Error(`Failed to download CelesTrak TLE feed: HTTP Status ${res.statusCode}`));
        return;
      }

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (!data.trim()) {
          reject(new Error('CelesTrak returned an empty TLE feed'));
          return;
        }
        if (looksLikeCsvResponse(data)) {
          reject(new Error('CelesTrak returned CSV/GP data instead of TLE format'));
          return;
        }
        resolve(data);
      });
    });

    req.setTimeout(celestrakRequestTimeoutMs, () => {
      req.destroy(new Error(`CelesTrak request timed out after ${celestrakRequestTimeoutMs}ms`));
    });

    req.on('error', (err) => {
      reject(err);
    });
  });
};

/**
 * Downloads raw TLE data from the official public CelesTrak feed for a given group name.
 * Does not require API keys.
 * 
 * @param {string} groupName - The group name to fetch (active, debris, stations)
 * @returns {Promise<string>} Raw TLE text content
 */
const downloadTLE = async (groupName) => {
  const url = buildCelesTrakUrl(groupName);
  let lastError;

  for (let attempt = 1; attempt <= celestrakMaxAttempts; attempt++) {
    try {
      return await requestTLEOnce(url);
    } catch (error) {
      lastError = error;
      if (attempt < celestrakMaxAttempts) {
        await delay(celestrakRetryDelayMs);
      }
    }
  }

  throw lastError;
};

const getObjectTypeForGroup = (groupName) => {
  return groupName === 'debris' ? 'Debris' : 'Satellite';
};

const findExistingByNorad = (noradId) => {
  return OrbitalObject.findOne({
    $or: [
      { noradId },
      { catalogNumber: noradId },
    ],
  });
};

const updateExistingObject = async (existing, payload) => {
  const updatePayload = { ...payload };
  delete updatePayload.catalogNumber;

  existing.set(updatePayload);
  return existing.save();
};

/**
 * Synchronizes orbital objects from public CelesTrak TLE feeds.
 * Supports groups: active, debris, stations.
 * Reuse existing parser, validator, and creation logic.
 * Update duplicates by NORAD ID instead of creating new documents.
 * 
 * @param {string} groupName - The group name to synchronize
 * @returns {Promise<Object>} Statistics of the sync operation
 */
const syncGroup = async (groupName) => {
  if (!supportedGroups.includes(groupName)) {
    throw new Error(
      `Unsupported CelesTrak group: ${groupName}. Supported groups are: active, debris, stations`
    );
  }

  const tleText = await downloadTLE(groupName);
  const parsedSatellites = parseTLE(tleText);
  if (parsedSatellites.length === 0) {
    throw new Error('CelesTrak TLE feed did not contain any valid TLE records');
  }
  
  let downloaded = parsedSatellites.length;
  let imported = 0;
  let updated = 0;
  let skipped = 0;
  const errors = [];
  const processedInBatch = new Set();

  for (const sat of parsedSatellites) {
    const satNum = sat.noradId || sat.satelliteNumber;
    
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
      const payload = buildOrbitalObjectFromTLE({
        satellite: sat,
        validation,
        source: 'CelesTrak',
        objectType: getObjectTypeForGroup(groupName),
      });
      const existing = await findExistingByNorad(satNum);

      if (existing) {
        await updateExistingObject(existing, payload);
        updated++;
        continue;
      }

      await OrbitalObject.create(payload);

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
  buildCelesTrakUrl,
  syncGroup,
};
