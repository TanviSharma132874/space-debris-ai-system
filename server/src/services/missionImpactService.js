const missionCategoryByObjectType = {
  Satellite: 'Communication',
  RocketBody: 'Launch Infrastructure',
  Debris: 'Orbital Safety',
  Unknown: 'Unknown',
};

const impactLevelByRiskLevel = {
  Low: 'Low',
  Medium: 'Moderate',
  High: 'Critical',
  Critical: 'Critical',
};

const impactDescriptionByCategory = {
  Communication: 'Potential disruption of communication services if collision occurs.',
  'Launch Infrastructure':
    'Potential disruption to launch infrastructure tracking and orbital operations.',
  'Orbital Safety': 'Potential increase in debris hazards and orbital safety risk.',
  Unknown: 'Potential operational impact requires further mission analysis.',
};

const generateMissionImpact = (primaryObject, riskLevel) => {
  const missionCategory =
    missionCategoryByObjectType[primaryObject.objectType] || 'Unknown';

  return {
    missionCategory,
    impactLevel: impactLevelByRiskLevel[riskLevel] || 'Low',
    impactDescription:
      impactDescriptionByCategory[missionCategory] ||
      impactDescriptionByCategory.Unknown,
  };
};

module.exports = {
  generateMissionImpact,
};
