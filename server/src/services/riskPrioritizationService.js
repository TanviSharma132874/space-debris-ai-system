const { calculatePredictionConfidence } = require('./confidenceScoringService');
const { generateMissionImpact } = require('./missionImpactService');

/**
 * Prioritizes a list of collision events based on operational urgency.
 *
 * Scoring factors:
 * 1. Risk Level (Critical = 4000, High = 3000, Medium = 2000, Low = 1000)
 * 2. Mission Impact Level (Critical = 3000, Moderate/High = 2000, Low = 1000)
 * 3. Prediction Confidence (Scaled score 0 - 1000)
 * 4. Proximity in Time (Closer future events get higher scores, past events get 0)
 *
 * @param {Array} events - List of collision events or timeline entries.
 * @returns {Array} List of events sorted by priority descending, with priority details attached.
 */
const prioritizeCollisionEvents = (events = []) => {
  const getRiskScore = (riskLevel) => {
    const mapping = { Critical: 4000, High: 3000, Medium: 2000, Low: 1000 };
    return mapping[riskLevel] || 1000;
  };

  const getImpactScore = (impactLevel) => {
    const mapping = { Critical: 3000, High: 3000, Moderate: 2000, Low: 1000 };
    return mapping[impactLevel] || 1000;
  };

  const getConfidenceScore = (confidence) => {
    if (!confidence) return 500;
    const score = confidence.confidenceScore ?? 50;
    return score * 10; // Scale 0-100 to 0-1000
  };

  const getTimeScore = (predictedTime) => {
    if (!predictedTime) return 0;
    const diffMs = new Date(predictedTime).getTime() - Date.now();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 0) {
      return 0; // Past events are no longer operationally urgent
    }

    // Closer events in the future get higher scores.
    // Base time score is 1000, minus 5 points per hour in the future.
    return Math.max(0, 1000 - diffHours * 5);
  };

  const prioritized = events.map((event) => {
    const riskLevel = event.riskLevel || 'Low';

    // Resolve or generate Mission Impact
    let missionImpact = event.missionImpact;
    if (!missionImpact) {
      const primaryObj = event.primaryObject || {};
      missionImpact = generateMissionImpact(primaryObj, riskLevel);
    }
    const impactLevel = missionImpact?.impactLevel || 'Low';

    // Resolve or generate Confidence
    let confidence = event.confidence;
    if (!confidence) {
      confidence = calculatePredictionConfidence({
        altitudeDifference: event.minimumDistanceKm ?? event.altitudeDifference ?? 10,
        relativeVelocity: event.relativeVelocityKmPerSec ?? event.relativeVelocity ?? 5,
        riskLevel,
      });
    }

    const time = event.predictedTime || event.timestamp || event.createdAt;

    const riskScore = getRiskScore(riskLevel);
    const impactScore = getImpactScore(impactLevel);
    const confidenceScore = getConfidenceScore(confidence);
    const timeScore = getTimeScore(time);

    const totalPriorityScore = riskScore + impactScore + confidenceScore + timeScore;

    return {
      ...event,
      missionImpact,
      confidence,
      priorityScore: totalPriorityScore,
    };
  });

  // Sort from highest to lowest operational priority
  return prioritized.sort((first, second) => second.priorityScore - first.priorityScore);
};

module.exports = {
  prioritizeCollisionEvents,
};
