// محرك المحاكاة: آلة حالات مستقلة تماما، بلا Arduino حقيقي.
// Standalone state machine. V1 and V2 share the base cycle; V2 adds the warning layer.
import { simulation } from '../data/simulation.js';

export class SignalEngine {
  constructor(onEvent) {
    this.onEvent = onEvent || (() => {});
    this.version = 'v1';
    this.running = false;
    this.phase = 'idle'; // idle | cars_green | cars_yellow | all_red | ped_green
    this.phaseEnd = 0;
    this.phaseStart = 0;
    this.distance = simulation.v2.defaultCm;
    this.warning = false;
    this.pressedUntil = 0;
  }

  setVersion(v) {
    this.version = v;
    this.warning = false;
    if (this.running) this.stop(true);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._enter('cars_green', 0);
    this.onEvent('log.started');
  }

  stop(silent) {
    if (!this.running) return;
    this.running = false;
    this.phase = 'idle';
    this.warning = false;
    if (!silent) this.onEvent('log.stopped');
  }

  requestCross() {
    if (!this.running) return;
    this.pressedUntil = performance.now() + 280;
    this.onEvent('log.request');
    if (this.phase !== 'cars_green') { this.onEvent('log.busy'); return; }
    this._enter('cars_yellow', simulation.timings.yellowMs);
    this.onEvent('log.yellow');
  }

  setDistance(cm) { this.distance = cm; }

  _enter(phase, ms) {
    this.phase = phase;
    this.phaseStart = performance.now();
    this.phaseEnd = ms ? this.phaseStart + ms : 0;
  }

  update(now = performance.now()) {
    if (this.running && this.phaseEnd && now >= this.phaseEnd) {
      const t = simulation.timings;
      if (this.phase === 'cars_yellow') { this._enter('all_red', t.allRedMs); this.onEvent('log.allRed'); }
      else if (this.phase === 'all_red') { this._enter('ped_green', t.crossingMs); this.onEvent('log.pedGreen'); }
      else if (this.phase === 'ped_green') { this._enter('cars_green', 0); this.onEvent('log.back'); }
    }

    let warn = false;
    if (this.running && this.version === 'v2') {
      warn = simulation.v2.warnDuringPhases.includes(this.phase) && this.distance < simulation.v2.thresholdCm;
    }
    if (warn !== this.warning) { this.warning = warn; this.onEvent(warn ? 'log.warnOn' : 'log.warnOff'); }
    return this.snapshot(now);
  }

  snapshot(now = performance.now()) {
    const on = this.running;
    const p = this.phase;
    const cars = !on ? 'off' : p === 'cars_green' ? 'green' : p === 'cars_yellow' ? 'yellow' : 'red';
    const ped = !on ? 'off' : p === 'ped_green' ? 'green' : 'red';
    const total = this.phaseEnd ? this.phaseEnd - this.phaseStart : 0;
    const remaining = this.phaseEnd ? Math.max(0, this.phaseEnd - now) : 0;
    return {
      running: on, phase: p, cars, ped,
      progress: total ? 1 - remaining / total : 0,
      remaining,
      warning: this.warning,
      distance: this.distance,
      pressed: now < this.pressedUntil,
      version: this.version,
    };
  }
}
