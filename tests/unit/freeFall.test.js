import test from 'node:test';
import assert from 'node:assert/strict';
import { FreeFallSimulation } from '../../client/scripts/lab/physics/freeFallEngine.js';

test('Erkin tushish dvigateli: boshlang\'ich holat va parametrlar', () => {
  const sim = new FreeFallSimulation({ height: 20, planet: 'earth' });
  assert.equal(sim.state.y, 20);
  assert.equal(sim.state.v, 0);
  assert.equal(sim.state.t, 0);
  assert.equal(sim.state.isRunning, false);
  assert.equal(sim.state.isFinished, false);
});

test('Nazariy va sonli natijalar taqqoslanishi (vakuumda 20 metr balandlikdan)', () => {
  const sim = new FreeFallSimulation({ height: 20, planet: 'earth', restitution: 0 });
  const theoretical = sim.getTheoreticalValues();

  // t_nazariy = sqrt(2h / g) = sqrt(40 / 9.80665) = 2.02s
  // v_nazariy = sqrt(2gh) = sqrt(2 * 9.80665 * 20) = 19.81 m/s
  assert.ok(Math.abs(theoretical.tImpact - 2.02) < 0.05, `Kutilgan vaqt ~2.02s, olindi: ${theoretical.tImpact}`);
  assert.ok(Math.abs(theoretical.vImpact - 19.81) < 0.1, `Kutilgan tezlik ~19.81m/s, olindi: ${theoretical.vImpact}`);

  sim.start();
  // Simulyatsiyani 0.016s qadamlar bilan 2.5s yurgizamiz
  for (let step = 0; step < 160; step++) {
    sim.step(0.016);
  }

  // Jism yerga tushgan bo'lishi kerak
  assert.equal(sim.state.y, 0);
  assert.equal(sim.state.isFinished, true);
  // Simulyatsiya vaqti nazariy vaqtga juda yaqin (xatolik < 2%)
  assert.ok(Math.abs(sim.state.t - theoretical.tImpact) < 0.05);
});

test('Energiya saqlanishi (vakuumda, havoda qarshiliksiz)', () => {
  const mass = 2.0;
  const height = 15;
  const sim = new FreeFallSimulation({ mass, height, planet: 'earth', airResistance: false });
  const initialEnergy = mass * sim.g * height;

  sim.start();
  for (let step = 0; step < 50; step++) {
    sim.step(0.016);
    if (sim.state.y > 0.5) {
      const currentMechanicalEnergy = sim.state.ep + sim.state.ek;
      // Mexanik energiya saqlanish qonuni: E_p + E_k = E_initial
      const relDiff = Math.abs(currentMechanicalEnergy - initialEnergy) / initialEnergy;
      assert.ok(relDiff < 0.01, `Energiya saqlanishi buzildi! relDiff: ${relDiff}`);
    }
  }
});

test('Havo qarshiligi hisobga olinganda tushish sekinlashadi', () => {
  const simVacuum = new FreeFallSimulation({ height: 30, airResistance: false, mass: 0.1 });
  const simAir = new FreeFallSimulation({ height: 30, airResistance: true, mass: 0.1, shape: 'feather' });

  simVacuum.start();
  simAir.start();

  // 1 sekunddan keyingi balandlikni solishtiramiz
  for (let step = 0; step < 60; step++) {
    simVacuum.step(0.016);
    simAir.step(0.016);
  }

  // Havodagi yengil jism qarshilik tufayli sekinroq tushadi, demak uning balandligi vakuumdagidan baland bo'lishi kerak
  assert.ok(simAir.state.y > simVacuum.state.y, 'Havo qarshiligi jismni sekinlashtirishi kerak');
  assert.ok(Math.abs(simAir.state.v) < Math.abs(simVacuum.state.v), 'Havodagi tezlik kamroq bo\'lishi kerak');
});

test('Pause, Resume va Reset xatti-harakati', () => {
  const sim = new FreeFallSimulation({ height: 10 });
  sim.start();
  sim.step(0.05);
  assert.equal(sim.state.isRunning, true);
  const t1 = sim.state.t;

  sim.pause();
  assert.equal(sim.state.isRunning, false);
  sim.step(0.05); // To'xtatilganda t o'zgarmasligi kerak
  assert.equal(sim.state.t, t1);

  sim.resume();
  assert.equal(sim.state.isRunning, true);
  sim.step(0.05);
  assert.ok(sim.state.t > t1);

  sim.reset();
  assert.equal(sim.state.t, 0);
  assert.equal(sim.state.y, 10);
  assert.equal(sim.state.isRunning, false);
});
