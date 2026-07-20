/**
 * GroundStationRenderer renders ground-based tracking stations on Earth's surface.
 * 
 * @param {Object} props
 * @param {Array} props.groundStations - List of ground stations, e.g. [{ id: string, position: [x,y,z] }]
 * @param {string|number|null} props.selectedStationId - The active/selected ground station ID
 * @param {Function} props.onSelect - Callback when a ground station is clicked
 */
export default function GroundStationRenderer({
  groundStations = [],
  selectedStationId = null,
  onSelect = null,
}) {
  if (!groundStations || groundStations.length === 0) {
    return null;
  }

  return (
    <group>
      {groundStations.map((station) => {
        const isSelected = selectedStationId === station.id;
        const position = station.position || [0, 0, 0];

        return (
          <group key={station.id} position={position}>
            {/* Ground Station surface pin */}
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                if (onSelect) {
                  onSelect(station.id);
                }
              }}
            >
              <cylinderGeometry args={[0.02, 0.04, 0.08, 8]} />
              <meshStandardMaterial
                color={isSelected ? '#34d399' : '#f59e0b'}
                emissive={isSelected ? '#34d399' : '#000000'}
                emissiveIntensity={isSelected ? 0.6 : 0.0}
              />
            </mesh>

            {/* Coverage Cone Indicator */}
            <mesh position={[0, 0.15, 0]}>
              <coneGeometry args={[0.2, 0.3, 16, 1, true]} />
              <meshBasicMaterial
                color={isSelected ? '#34d399' : '#f59e0b'}
                transparent
                opacity={isSelected ? 0.12 : 0.03}
                wireframe={isSelected}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
