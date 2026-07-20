export class CameraController {
  constructor(initialZoom = 1, initialRotation = 0) {
    this.state = { zoom: initialZoom, rotation: initialRotation, target: null };
    
    // Limits and defaults suited for Earth space visualization
    this.minDistance = 2.2;      // Prevents clipping Earth atmospheric shell (radius ~1.56)
    this.maxDistance = 12.0;     // Prevents zooming out beyond the starfield threshold
    this.defaultPosition = [0, 0, 4.5];
  }
  zoom(factor) {
    this.state.zoom = Math.max(0.5, Math.min(2.0, this.state.zoom + factor));
    return { ...this.state };
  }
  rotate(deg) {
    this.state.rotation = (this.state.rotation + deg) % 360;
    return { ...this.state };
  }
  lock(targetId) {
    this.state.target = targetId;
    return { ...this.state };
  }
}
