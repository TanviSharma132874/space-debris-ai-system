import { Line } from '@react-three/drei';

/**
 * OrbitRenderer renders a single orbital path path in 3D space.
 * 
 * @param {Object} props
 * @param {Array} props.orbitPoints - Array of 3D coordinates (e.g., [[x, y, z], ...] or Vector3[])
 * @param {string} props.color - Color of the orbital path line
 * @param {number} props.lineWidth - Thickness of the rendered line
 * @param {boolean} props.dashed - Whether the orbital path is dashed
 */
export default function OrbitRenderer({
  orbitPoints = [],
  color = '#22d3ee',
  lineWidth = 1.5,
  dashed = false,
}) {
  if (!orbitPoints || orbitPoints.length === 0) {
    return null;
  }

  return (
    <Line
      points={orbitPoints}
      color={color}
      lineWidth={lineWidth}
      dashed={dashed}
    />
  );
}
