/**
 * Validates the orbital objects input for collision prediction.
 *
 * @param {Object} params - The parameter object.
 * @param {Object} params.primaryObject - The primary orbital object document.
 * @param {Object} params.secondaryObject - The secondary orbital object document.
 * @returns {Object} Validation result containing isValid, qualityLevel, and warnings.
 */
const validatePredictionInput = ({ primaryObject, secondaryObject }) => {
  const warnings = [];
  let isValid = true;
  let qualityLevel = 'Optimal';

  // 1. Check if both objects exist
  if (!primaryObject || !secondaryObject) {
    return {
      isValid: false,
      qualityLevel: 'Invalid',
      warnings: ['One or both orbital objects could not be resolved.'],
    };
  }

  const primaryId = (primaryObject._id || primaryObject.id)?.toString();
  const secondaryId = (secondaryObject._id || secondaryObject.id)?.toString();

  // 2. Check if it's the same object
  if (primaryId && secondaryId && primaryId === secondaryId) {
    return {
      isValid: false,
      qualityLevel: 'Invalid',
      warnings: ['Cannot predict collision risk between the same orbital object.'],
    };
  }

  // 3. Check for essential numerical parameters (altitude and velocity)
  const checkEssentialFields = (obj, label) => {
    if (obj.altitudeKm === undefined || obj.altitudeKm === null || Number.isNaN(Number(obj.altitudeKm))) {
      warnings.push(`${label} is missing a valid altitude value.`);
      isValid = false;
    }
    if (obj.velocityKmPerSec === undefined || obj.velocityKmPerSec === null || Number.isNaN(Number(obj.velocityKmPerSec))) {
      warnings.push(`${label} is missing a valid velocity value.`);
      isValid = false;
    }
  };

  checkEssentialFields(primaryObject, 'Primary object');
  checkEssentialFields(secondaryObject, 'Secondary object');

  // 4. Check for metadata quality warnings (non-blocking)
  const checkMetadataFields = (obj, label) => {
    if (!obj.orbitType || obj.orbitType === 'Unknown') {
      warnings.push(`${label} has an unspecified or unknown orbit type.`);
    }
    if (!obj.objectType || obj.objectType === 'Unknown') {
      warnings.push(`${label} has an unspecified or unknown object type.`);
    }
    if (!obj.operator || obj.operator === 'Unknown') {
      warnings.push(`${label} is missing operator registration metadata.`);
    }
  };

  checkMetadataFields(primaryObject, 'Primary object');
  checkMetadataFields(secondaryObject, 'Secondary object');

  // Determine final quality level
  if (!isValid) {
    qualityLevel = 'Invalid';
  } else if (warnings.length > 0) {
    qualityLevel = 'Warning';
  }

  return {
    isValid,
    qualityLevel,
    warnings,
  };
};

module.exports = {
  validatePredictionInput,
};
