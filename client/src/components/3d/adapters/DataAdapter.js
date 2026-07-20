export class DataAdapter {
  static normalize(node) {
    return {
      id: node.id || Math.random().toString(),
      name: node.name || 'Unknown Object',
      position: node.position || [0, 0, 0],
      velocity: node.velocityKmPerSec || 0,
      altitude: node.altitudeKm || 0,
      risk: node.riskLevel || 'Low',
      color: node.color || 'gray',
    };
  }
}
