import { useMemo } from 'react';

/**
 * StarsRenderer creates a lightweight procedural starfield.
 * 
 * @param {Object} props
 * @param {number} props.starCount - The number of stars to render
 * @param {number} props.radius - The distance from the center of the scene to place the stars
 */
export default function StarsRenderer({ starCount = 600, radius = 100 }) {
  const positions = useMemo(() => {
    const coords = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount; i++) {
      // Uniform distribution on a sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      coords[i * 3] = x;
      coords[i * 3 + 1] = y;
      coords[i * 3 + 2] = z;
    }
    
    return coords;
  }, [starCount, radius]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.25}
        color="#ffffff"
        sizeAttenuation={true}
        transparent={true}
        opacity={0.7}
      />
    </points>
  );
}
