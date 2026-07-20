export class TimeController {
  constructor(speed = 1) {
    this.speed = speed;
  }
  tick(deltaMs, currentEpoch) {
    return currentEpoch + deltaMs * this.speed;
  }
  setSpeed(newSpeed) {
    this.speed = newSpeed;
  }
}
