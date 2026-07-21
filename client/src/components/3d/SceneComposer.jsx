import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { SpaceEngineProvider } from './engine/SpaceEngineContext';
import { CameraController } from './controls/CameraController';
import { DataAdapter } from './adapters/DataAdapter';
import EarthRenderer from './renderers/EarthRenderer';
import StarsRenderer from './renderers/StarsRenderer';
import OrbitRenderer from './renderers/OrbitRenderer';
import SatelliteRenderer from './renderers/SatelliteRenderer';
import GroundStationRenderer from './renderers/GroundStationRenderer';

/**
 * SceneComposer coordinates the different rendering layers of the Space Engine
 * within a single unified React Three Fiber Canvas stack with camera controls.
 */
export default function SceneComposer({ visualizationData = [] }) {
  const cameraCtrl = useMemo(() => new CameraController(), []);
  const { orbitPoints, satellites, groundStations } = useMemo(
    () => DataAdapter.transform(visualizationData),
    [visualizationData]
  );

  return (
    <SpaceEngineProvider>
      <div style={{ width: '100%', height: '100%', minHeight: '500px', background: '#020208' }}>
        <Canvas camera={{ position: cameraCtrl.defaultPosition, fov: 60 }}>
          {/* Reusable Camera Orbit Controls */}
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
          <OrbitRenderer orbitPoints={orbitPoints} color="#22d3ee" />

          {/* Satellite indicators */}
          <SatelliteRenderer satellites={satellites} selectedId={null} />

          {/* Surface tracking stations */}
          <GroundStationRenderer groundStations={groundStations} selectedStationId={null} />
        </Canvas>
      </div>
    </SpaceEngineProvider>
  );
}
