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

    const scaleFactor = 2.2;
    const satellites = nodes
      .filter((node) => node.objectType !== 'GroundStation')
      .map((node) => {
        const [x = 0, y = 0, z = 0] = node.position || [0, 0, 0];
        return {
          id: node.id || node.catalogNumber,
          position: [x * scaleFactor, y * scaleFactor, z * scaleFactor],
        };
      });

    const groundStations = nodes
      .filter((node) => node.objectType === 'GroundStation')
      .map((node) => {
        const [x = 0, y = 0, z = 0] = node.position || [0, 0, 0];
        const mag = Math.sqrt(x * x + y * y + z * z);
        const factor = mag > 0 ? 1.5 / mag : 1.5;
        return {
          id: node.id || node.catalogNumber,
          position: [x * factor, y * factor, z * factor],
        };
      });

    return { orbitPoints: [], satellites, groundStations };
  }
}

