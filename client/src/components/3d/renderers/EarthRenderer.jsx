import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * EarthRenderer renders the Earth sphere and its outer atmospheric shell.
 * It is designed to be placed directly within a React Three Fiber Canvas.
 */
export default function EarthRenderer() {
  const earthRef = useRef();

  useFrame((state, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.05;
    }
  });

  const texture = new THREE.TextureLoader().load(
    'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg'
  );

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
