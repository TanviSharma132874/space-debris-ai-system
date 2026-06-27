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
const parseTLE = (text) => {
  if (!text || typeof text !== 'string') return [];
  
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  
  const satellites = [];
  let i = 0;

  while (i < lines.length) {
    // 1. Standard 3-line format
    if (
      i + 2 < lines.length &&
      lines[i + 1].startsWith('1 ') &&
      lines[i + 2].startsWith('2 ')
    ) {
      satellites.push({
        satelliteName: lines[i],
        tleLine1: lines[i + 1],
        tleLine2: lines[i + 2],
        satelliteNumber: lines[i + 1].substring(2, 7).trim(),
      });
      i += 3;
    } 
    // 2. 2-line format (missing name line)
    else if (
      i + 1 < lines.length &&
      lines[i].startsWith('1 ') &&
      lines[i + 1].startsWith('2 ')
    ) {
      const satNum = lines[i].substring(2, 7).trim();
      satellites.push({
        satelliteName: `SAT-${satNum}`,
        tleLine1: lines[i],
        tleLine2: lines[i + 1],
        satelliteNumber: satNum,
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

module.exports = {
  parseTLE,
};
