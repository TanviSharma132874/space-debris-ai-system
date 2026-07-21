import { useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';

const EARTH_TEXTURE_URL = 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg';

/**
 * EarthRenderer renders the Earth sphere and its outer atmospheric shell.
 * It is designed to be placed directly within a React Three Fiber Canvas.
 */
export default function EarthRenderer() {
  const earthRef = useRef();
  const texture = useLoader(THREE.TextureLoader, EARTH_TEXTURE_URL);

  useFrame((state, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <group>
      {/* Textured Earth Sphere */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[1.5, 64, 64]} />
        <meshStandardMaterial 
          map={texture} 
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>

      {/* Atmosphere Shell */}
      <mesh>
        <sphereGeometry args={[1.56, 64, 64]} />
        <meshBasicMaterial
          color="#8ac6ff"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}
