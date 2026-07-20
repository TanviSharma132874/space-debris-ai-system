import SceneComposer from '../components/3d/SceneComposer';

/**
 * SpaceEnginePreview renders a temporary full-screen preview page 
 * of the Space Visualization Engine architecture.
 */
export default function SpaceEnginePreview() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <SceneComposer />
    </div>
  );
}
