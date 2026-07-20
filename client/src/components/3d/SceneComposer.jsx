import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { SpaceEngineProvider } from './engine/SpaceEngineContext';
import { CameraController } from './controls/CameraController';
import EarthRenderer from './renderers/EarthRenderer';
import StarsRenderer from './renderers/StarsRenderer';
import OrbitRenderer from './renderers/OrbitRenderer';
import SatelliteRenderer from './renderers/SatelliteRenderer';
import GroundStationRenderer from './renderers/GroundStationRenderer';

// Placeholder data vectors
const placeholderOrbits = [
  [-2, 0, 0], [0, 2, 0], [2, 0, 0], [0, -2, 0], [-2, 0, 0]
];
const placeholderSatellites = [
  { id: 'sat-1', position: [1.6, 0.5, 0.5] },
  { id: 'sat-2', position: [-1.2, -1.0, 0.8] }
];
const placeholderStations = [
  { id: 'station-1', position: [0, 1.5, 0] }
];

/**
 * SceneComposer coordinates the different rendering layers of the Space Engine
 * within a single unified React Three Fiber Canvas stack with camera controls.
 */
export default function SceneComposer() {
  const cameraCtrl = useMemo(() => new CameraController(), []);

  return (
    <SpaceEngineProvider>
      <div style={{ width: '100%', height: '100%', minHeight: '500px', background: '#020208' }}>
        <Canvas camera={{ position: cameraCtrl.defaultPosition, fov: 60 }}>
          {/* Camera Orbit Controls */}
          <OrbitControls 
            enablePan={false}
            enableZoom={true}
            enableRotate={true}
            minDistance={cameraCtrl.minDistance}
            maxDistance={cameraCtrl.maxDistance}
          />

          {/* Unified Light Sources */}
          <ambientLight intensity={0.6} color="#ffffff" />
          <directionalLight position={[5, 3, 5]} intensity={1.5} color="#fff6e0" />

          {/* Procedural background starfield */}
          <StarsRenderer starCount={300} radius={50} />

          {/* Earth sphere & atmosphere shell */}
          <EarthRenderer />

          {/* Orbit path trails */}
          <OrbitRenderer orbitPoints={placeholderOrbits} color="#22d3ee" />

          {/* Satellite indicators */}
          <SatelliteRenderer satellites={placeholderSatellites} selectedId={null} />

          {/* Surface tracking stations */}
          <GroundStationRenderer groundStations={placeholderStations} selectedStationId={null} />
        </Canvas>
      </div>
    </SpaceEngineProvider>
  );
}
