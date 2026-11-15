// Erkin tushish fizika simulyatsiya dvigateli (Free Fall Physics Engine)
// Velocity Verlet va analitik hisoblash integratori

import { AIR_DENSITY, GRAVITY, SHAPES } from './constants.js';

export class FreeFallSimulation {
  constructor(options = {}) {
    this.setParams(options);
    this.reset();
  }

  setParams({
    height = 20, // metr (1 - 100)
    v0 = 0, // boshlang'ich tezlik m/s (-20 dan +20 gacha)
    mass = 1.0, // kg (0.05 - 50)
    radius = 0.2, // metr (shakl radiusi)
    planet = 'earth', // 'earth', 'moon', 'mars', 'jupiter', 'zero'
    airResistance = false, // true / false
    shape = 'sphere', // 'sphere', 'cube', 'feather'
    restitution = 0.35, // yerga urilish elastikligi (0 - noelastik, 1 - to'liq elastik)
  } = {}) {
    this.params = {
      height: Math.max(0.5, Math.min(100, Number(height) || 20)),
      v0: Math.max(-50, Math.min(50, Number(v0) || 0)),
      mass: Math.max(0.01, Math.min(100, Number(mass) || 1.0)),
      radius: Math.max(0.05, Math.min(1.0, Number(radius) || 0.2)),
      planet: GRAVITY[planet] ? planet : 'earth',
      airResistance: Boolean(airResistance),
      shape: SHAPES[shape] ? shape : 'sphere',
      restitution: Math.max(0, Math.min(0.95, Number(restitution) ?? 0.35)),
    };
  }

  get g() {
    return GRAVITY[this.params.planet].g;
  }

  get rho() {
    return this.params.airResistance ? AIR_DENSITY.air : AIR_DENSITY.vacuum;
  }

  get cd() {
    return SHAPES[this.params.shape].cd;
  }

  get area() {
    return SHAPES[this.params.shape].crossSection(this.params.radius);
  }

  reset() {
    this.state = {
      t: 0,
      y: this.params.height,
      v: this.params.v0,
      a: -this.g,
      fDrag: 0,
      ep: this.params.mass * this.g * this.params.height,
      ek: 0.5 * this.params.mass * this.params.v0 * this.params.v0,
      lostEnergy: 0,
      bounceCount: 0,
      isFinished: false,
      isRunning: false,
    };
    this.history = [];
    this._recordSample();
  }

  start() {
    if (this.state.isFinished) this.reset();
    this.state.isRunning = true;
  }

  pause() {
    this.state.isRunning = false;
  }

  resume() {
    if (!this.state.isFinished) {
      this.state.isRunning = true;
    }
  }

  computeAcceleration(y, v) {
    if (y <= 0) return { a: 0, fDrag: 0 };
    let a = -this.g;
    let fDrag = 0;

    if (this.params.airResistance && Math.abs(v) > 1e-6) {
      // F_drag = 0.5 * rho * Cd * A * v^2 (qarama-qarshi yo'nalishda)
      fDrag = 0.5 * this.rho * this.cd * this.area * v * v;
      const dragAccel = fDrag / this.params.mass;
      a += v > 0 ? -dragAccel : dragAccel;
    }

    return { a, fDrag };
  }

  /**
   * Kichik dt (sekund) bo'yicha integratsiyalash (Velocity Verlet)
   */
  step(dt) {
    if (!this.state.isRunning || this.state.isFinished) return this.state;

    // dt ni stabil saqlash uchun substep'larga bo'lamiz (max dt = 0.005s)
    const maxSubStep = 0.005;
    let remaining = dt;

    while (remaining > 0) {
      const stepDt = Math.min(remaining, maxSubStep);
      this._subStep(stepDt);
      remaining -= stepDt;
    }

    this._updateEnergies();
    this._recordSample();

    return this.state;
  }

  _subStep(dt) {
    let { y, v, t, bounceCount } = this.state;
    const { a: a0, fDrag } = this.computeAcceleration(y, v);
    this.state.fDrag = fDrag;

    // Koordinata yangilanishi
    let nextY = y + v * dt + 0.5 * a0 * dt * dt;

    // Yerga urilish (y <= 0) holati
    if (nextY <= 0) {
      nextY = 0;
      // Urilishdagi tezlik
      const impactVelocity = Math.abs(v) > 0.05 ? -Math.abs(v) : 0;
      const bouncedVelocity = -impactVelocity * this.params.restitution;

      // Yo'qotilgan mexanik energiya
      const eBefore = 0.5 * this.params.mass * impactVelocity * impactVelocity;
      const eAfter = 0.5 * this.params.mass * bouncedVelocity * bouncedVelocity;
      this.state.lostEnergy += Math.max(0, eBefore - eAfter);

      if (bouncedVelocity < 0.15) {
        // Tebranish tugadi
        v = 0;
        this.state.isFinished = true;
        this.state.isRunning = false;
        this.state.a = 0;
      } else {
        v = bouncedVelocity;
        bounceCount += 1;
      }
      y = 0;
    } else {
      // O'rtadagi tezlanish bilan tezlikni yangilash
      const { a: a1 } = this.computeAcceleration(nextY, v + a0 * dt);
      v = v + 0.5 * (a0 + a1) * dt;
      y = nextY;
      this.state.a = a1;
    }

    this.state.y = y;
    this.state.v = v;
    this.state.t = t + dt;
    this.state.bounceCount = bounceCount;
  }

  _updateEnergies() {
    const { y, v } = this.state;
    const { mass } = this.params;
    this.state.ep = Math.max(0, mass * this.g * y);
    this.state.ek = 0.5 * mass * v * v;
  }

  _recordSample() {
    // Grafik uchun har 0.05 sekundda 1 ta nuqta saqlash
    const lastSample = this.history[this.history.length - 1];
    if (!lastSample || this.state.t - lastSample.t >= 0.045 || this.state.isFinished) {
      this.history.push({
        t: Number(this.state.t.toFixed(3)),
        y: Number(this.state.y.toFixed(3)),
        v: Number(this.state.v.toFixed(3)),
        ep: Number(this.state.ep.toFixed(2)),
        ek: Number(this.state.ek.toFixed(2)),
      });
      // Xotirani tejash uchun max 600 nuqta
      if (this.history.length > 600) this.history.shift();
    }
  }

  /**
   * Vakuum uchun nazariy / analitik hisob-kitoblar (o'quvchi tekshirishi uchun)
   */
  getTheoreticalValues() {
    const h = this.params.height;
    const v0 = this.params.v0;
    const g = this.g;

    if (g === 0) {
      return { tImpact: Infinity, vImpact: v0, maxH: h };
    }

    // v0*t - 0.5*g*t^2 + h = 0 -> 0.5*g*t^2 - v0*t - h = 0
    // D = v0^2 - 4*(0.5g)*(-h) = v0^2 + 2gh
    const disc = v0 * v0 + 2 * g * h;
    const tImpact = (v0 + Math.sqrt(disc)) / g;
    const vImpact = -Math.sqrt(disc);
    const maxH = v0 > 0 ? h + (v0 * v0) / (2 * g) : h;

    return {
      tImpact: Number(tImpact.toFixed(3)),
      vImpact: Number(Math.abs(vImpact).toFixed(2)),
      maxH: Number(maxH.toFixed(2)),
      g,
    };
  }
}
