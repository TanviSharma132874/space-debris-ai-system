import SceneComposer from './SceneComposer';

/**
 * Scene3D component acts as the presentation layer for 3D orbital data by rendering SceneComposer.
 *
 * @param {Object} props - Component props.
 * @param {Array} props.visualizationData - Formatted orbital nodes from the visualization adapter.
 */
export default function Scene3D({ visualizationData = [] }) {
  return <SceneComposer visualizationData={visualizationData} />;
}
