import demoOrbitalObjects from '../../../data/demoOrbitalObjects';
import { prepareVisualizationData } from '../../../services/visualizationAdapter';

export class DataAdapter {
  static normalize(node) {
    if (!node) return null;
    return {
      id: node.id || node.catalogNumber || 'unknown',
      name: node.name || 'Unknown Object',
      position: node.position || [0, 0, 0],
      velocity: node.velocityKmPerSec || 0,
      altitude: node.altitudeKm || 0,
      risk: node.riskLevel || 'Low',
      color: node.color || 'gray',
    };
  }

  static transform(rawObjects = demoOrbitalObjects) {
    if (!Array.isArray(rawObjects) || rawObjects.length === 0) {
      return { orbitPoints: [], satellites: [], groundStations: [] };
    }

    const nodes = prepareVisualizationData({ orbitalObjects: rawObjects });

    const orbitPoints = nodes.map((node) => node.position).filter(Boolean);
    const satellites = nodes
      .filter((node) => node.objectType !== 'GroundStation')
      .map((node) => ({ id: node.id || node.catalogNumber, position: node.position }));
    const groundStations = nodes
      .filter((node) => node.objectType === 'GroundStation')
      .map((node) => ({ id: node.id || node.catalogNumber, position: node.position }));

    return { orbitPoints, satellites, groundStations };
  }
}

