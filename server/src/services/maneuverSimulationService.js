const { predictCollision } = require('./collisionPredictionService');

const simulateAltitudeAdjustment = (
  primaryObject,
  secondaryObject,
  altitudeAdjustmentKm
) => {
  const primaryObjectCopy = {
    ...(primaryObject.toObject ? primaryObject.toObject() : primaryObject),
    altitudeKm: primaryObject.altitudeKm + altitudeAdjustmentKm,
  };

  return predictCollision(primaryObjectCopy, secondaryObject);
};

module.exports = {
  simulateAltitudeAdjustment,
};
