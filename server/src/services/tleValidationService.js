/**
 * Validates the format of a Two-Line Element (TLE) set.
 *
 * TLE format rules checked:
 * 1. Both lines must be present.
 * 2. Line 1 must start with "1 ".
 * 3. Line 2 must start with "2 ".
 * 4. Line length must be at least 69 characters.
 * 5. The satellite catalog numbers on both lines must match.
 *
 * @param {string} tleLine1 - The first line of the TLE.
 * @param {string} tleLine2 - The second line of the TLE.
 * @returns {Object} The validation results.
 */
const validateTLE = (tleLine1, tleLine2) => {
  const errors = [];
  let isValid = true;
  let satelliteNumber = null;
  let epoch = null;

  // 1. Both lines present
  if (!tleLine1 || !tleLine2) {
    return {
      isValid: false,
      errors: ['Both TLE Line 1 and Line 2 are required.'],
      satelliteNumber: null,
      epoch: null,
    };
  }

  const line1 = tleLine1.trim();
  const line2 = tleLine2.trim();

  // 2. Expected line lengths (standard TLE line is 69 characters)
  if (line1.length < 69) {
    errors.push('TLE Line 1 is too short (must be at least 69 characters).');
    isValid = false;
  }
  if (line2.length < 69) {
    errors.push('TLE Line 2 is too short (must be at least 69 characters).');
    isValid = false;
  }

  // 3. Correct line prefixes
  if (line1.length >= 2 && !line1.startsWith('1 ')) {
    errors.push('TLE Line 1 must start with "1 ".');
    isValid = false;
  }
  if (line2.length >= 2 && !line2.startsWith('2 ')) {
    errors.push('TLE Line 2 must start with "2 ".');
    isValid = false;
  }

  // 4. Equal satellite number on both lines
  if (isValid) {
    const satNum1 = line1.substring(2, 7).trim();
    const satNum2 = line2.substring(2, 7).trim();

    if (satNum1 !== satNum2) {
      errors.push(`Satellite number mismatch: Line 1 indicates "${satNum1}" but Line 2 indicates "${satNum2}".`);
      isValid = false;
    } else {
      satelliteNumber = satNum1;
    }

    // Extract epoch (characters 19-32 in Line 1, 0-indexed index 18 to 32)
    // Format: YYDDD.DDDDDDDD
    epoch = line1.substring(18, 32).trim();
  }

  return {
    isValid,
    errors,
    satelliteNumber,
    epoch,
  };
};

module.exports = {
  validateTLE,
};
