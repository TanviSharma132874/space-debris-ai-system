const explanationsByRiskLevel = {
  Low: 'Objects are well separated and relative velocity is within a safe operating range.',
  Medium: 'Moderate orbital proximity or relative velocity requires increased observation.',
  High: 'Low orbital separation and/or elevated relative velocity increase collision probability.',
  Critical:
    'Very small orbital separation combined with high relative velocity indicates an immediate collision risk.',
};

const generateRiskExplanation = ({ riskLevel }) => {
  return explanationsByRiskLevel[riskLevel] || explanationsByRiskLevel.Low;
};

module.exports = {
  generateRiskExplanation,
};
