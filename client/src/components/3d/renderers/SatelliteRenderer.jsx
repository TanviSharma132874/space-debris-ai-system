/**
 * SatelliteRenderer renders an array of satellite markers in a 3D context.
 * 
 * @param {Object} props
 * @param {Array} props.satellites - List of satellite data points, e.g. [{ id: string, position: [x,y,z] }]
 * @param {string|number|null} props.selectedId - The ID of the currently selected satellite
 * @param {Function} props.onSelect - Callback triggered when a satellite mesh is clicked
 */
export default function SatelliteRenderer({
  satellites = [],
  selectedId = null,
  onSelect = null,
}) {
  if (!satellites || satellites.length === 0) {
    return null;
  }

  return (
    <group>
      {satellites.map((sat) => {
        const isSelected = selectedId === sat.id;
        const position = sat.position || [0, 0, 0];

        return (
          <mesh
            key={sat.id}
            position={position}
            onClick={(e) => {
              e.stopPropagation();
              if (onSelect) {
                onSelect(sat.id);
              }
            }}
          >
            <boxGeometry args={[0.08, 0.08, 0.08]} />
            <meshStandardMaterial
              color={isSelected ? '#22d3ee' : '#94a3b8'}
              emissive={isSelected ? '#22d3ee' : '#000000'}
              emissiveIntensity={isSelected ? 1.0 : 0.0}
            />
          </mesh>
        );
      })}
    </group>
  );
}
