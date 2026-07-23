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

// Helper to generate circular orbit points for a satellite position
function generateOrbitPoints(position) {
  const [x, y, z] = position;
  const r = Math.sqrt(x * x + y * y + z * z);
  if (r === 0) return [];

  let ref = [0, 0, 1];
  if (Math.abs(x) < 0.01 && Math.abs(y) < 0.01) {
    ref = [1, 0, 0];
  }

  const cx = ref[1] * z - ref[2] * y;
  const cy = ref[2] * x - ref[0] * z;
  const cz = ref[0] * y - ref[1] * x;
  const cLen = Math.sqrt(cx * cx + cy * cy + cz * cz);

  const vx = (cx / cLen) * r;
  const vy = (cy / cLen) * r;
  const vz = (cz / cLen) * r;

  const points = [];
  const segments = 64;
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const px = x * Math.cos(theta) + vx * Math.sin(theta);
    const py = y * Math.cos(theta) + vy * Math.sin(theta);
    const pz = z * Math.cos(theta) + vz * Math.sin(theta);
    points.push([px, py, pz]);
  }
  return points;
}

/**
 * SceneComposer coordinates the different rendering layers of the Space Engine
 * within a single unified React Three Fiber Canvas stack with camera controls.
 */
export default function SceneComposer({ visualizationData = [] }) {
  const cameraCtrl = useMemo(() => new CameraController(), []);
  const { satellites, groundStations } = useMemo(
    () => DataAdapter.transform(visualizationData && visualizationData.length > 0 ? visualizationData : undefined),
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
          {satellites.map((sat) => {
            const points = generateOrbitPoints(sat.position);
            return (
              <OrbitRenderer
                key={`orbit-${sat.id}`}
                orbitPoints={points}
                color="#22d3ee"
                lineWidth={0.5}
                dashed={true}
              />
            );
          })}

          {/* Satellite indicators */}
          <SatelliteRenderer satellites={satellites} selectedId={null} />

          {/* Surface tracking stations */}
          <GroundStationRenderer groundStations={groundStations} selectedStationId={null} />
        </Canvas>
      </div>
    </SpaceEngineProvider>
  );
}
