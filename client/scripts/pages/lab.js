// 3D Virtual Fizika Laboratoriyasi sahifasi

import { GRAVITY, SHAPES } from '../lab/physics/constants.js';
import { FreeFallSimulation } from '../lab/physics/freeFallEngine.js';
import { LabScene } from '../lab/scene.js';
import { LiveChart } from '../lab/chart.js';
import { showToast } from '../components/toast.js';

export function render(ctx) {
  const root = document.createElement('div');
  root.className = 'page lab-page';

  // 1. Simulyatsiya obyekti
  const sim = new FreeFallSimulation({
    height: 25,
    planet: 'earth',
    mass: 2.0,
    radius: 0.25,
    airResistance: false,
    shape: 'sphere',
    restitution: 0.35,
  });

  root.innerHTML = `
    <header class="page__header lab-header">
      <div class="lab-title-row">
        <div>
          <h1 class="page__title">3D Laboratoriya</h1>
          <p class="page__subtitle">1-Tajriba: Erkin tushish va Nyuton qonuni</p>
        </div>
        <button id="theoryBtn" class="btn btn--subtle btn--sm" aria-label="Nazariya">Formulalar</button>
      </div>
    </header>

    <!-- 3D Canvas konteyneri -->
    <div class="lab-viewport-card card">
      <div id="sceneContainer" class="lab-scene-container"></div>
      
      <!-- Jonli HUD Telemetriya ustki paneli -->
      <div class="lab-hud">
        <div class="hud-stat">
          <span class="hud-label">Vaqt t</span>
          <span id="hudTime" class="hud-val">0.00 <small>s</small></span>
        </div>
        <div class="hud-stat">
          <span class="hud-label">Balandlik h</span>
          <span id="hudHeight" class="hud-val">25.0 <small>m</small></span>
        </div>
        <div class="hud-stat">
          <span class="hud-label">Tezlik |v|</span>
          <span id="hudSpeed" class="hud-val">0.0 <small>m/s</small></span>
        </div>
        <div class="hud-stat">
          <span class="hud-label">Tezlanish a</span>
          <span id="hudAccel" class="hud-val">9.8 <small>m/s²</small></span>
        </div>
      </div>
    </div>

    <!-- Boshqaruv pulti (Playback controls) -->
    <div class="lab-controls-card card">
      <div class="lab-btn-row">
        <button id="playBtn" class="btn btn--primary lab-btn-main">Boshlash</button>
        <button id="resetBtn" class="btn btn--subtle">Qayta oʻrnatish</button>
        <button id="slowMoBtn" class="btn btn--subtle btn--sm">0.5x Sekin</button>
      </div>

      <!-- Parametrlar sozlash bloki -->
      <div class="lab-settings">
        <!-- Sayyora / Gravitatsiya -->
        <div class="setting-row">
          <label class="setting-label">Muhit (Gravitatsiya):</label>
          <div class="planet-chips" id="planetChips">
            <button class="chip chip--active" data-planet="earth">Yer (9.8 m/s²)</button>
            <button class="chip" data-planet="moon">Oy (1.6 m/s²)</button>
            <button class="chip" data-planet="mars">Mars (3.7 m/s²)</button>
            <button class="chip" data-planet="jupiter">Yupiter (24.8 m/s²)</button>
          </div>
        </div>

        <!-- Balandlik slayderi -->
        <div class="setting-row">
          <div class="slider-header">
            <span>Balandlik (h)</span>
            <span id="heightVal" class="slider-value">25 m</span>
          </div>
          <input type="range" id="heightSlider" min="5" max="45" value="25" step="1" class="slider" />
        </div>

        <!-- Jism massasi slayderi -->
        <div class="setting-row">
          <div class="slider-header">
            <span>Massa (m)</span>
            <span id="massVal" class="slider-value">2.0 kg</span>
          </div>
          <input type="range" id="massSlider" min="0.1" max="20" value="2.0" step="0.1" class="slider" />
        </div>

        <!-- Havo qarshiligi va shakl -->
        <div class="setting-row setting-row--toggle">
          <div>
            <div class="toggle-title">Havo qarshiligi</div>
            <div class="toggle-sub">Vakuumda barcha jismlar bir xil tezlanishda tushadi</div>
          </div>
          <label class="switch">
            <input type="checkbox" id="airToggle" />
            <span class="slider-toggle"></span>
          </label>
        </div>

        <!-- Jism shakli (havo qarshiligi yoqilganda faol) -->
        <div class="setting-row" id="shapeRow" style="display:none;">
          <label class="setting-label">Jism shakli:</label>
          <div class="shape-chips" id="shapeChips">
            <button class="chip chip--active" data-shape="sphere">Shar</button>
            <button class="chip" data-shape="cube">Kub</button>
            <button class="chip" data-shape="feather">Yengil disk/pat</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Energiya balansi -->
    <div class="lab-energy-card card">
      <div class="energy-title">Energiya balansi (Joul)</div>
      <div class="energy-bars">
        <div class="energy-item">
          <span>Potensial Ep: <strong id="epVal">0 J</strong></span>
          <div class="bar-track"><div id="epBar" class="bar-fill" style="background:#38bdf8;width:100%;"></div></div>
        </div>
        <div class="energy-item">
          <span>Kinetik Ek: <strong id="ekVal">0 J</strong></span>
          <div class="bar-track"><div id="ekBar" class="bar-fill" style="background:#22c55e;width:0%;"></div></div>
        </div>
      </div>
    </div>

    <!-- Jonli Grafik -->
    <div id="chartContainer"></div>

    <!-- Nazariya va Formulalar modali (Accordion) -->
    <div id="theoryModal" class="card lab-theory-card" style="display:none;">
      <h3>Erkin tushish fizikasi</h3>
      <p>Jism faqat ogʻirlik kuchi taʼsirida harakatlansa, bu <strong>erkin tushish</strong> deyiladi.</p>
      <div class="formula-box">
        <code>y(t) = h₀ - ½ · g · t²</code><br>
        <code>v(t) = g · t</code><br>
        <code>E_toʻliq = m·g·h + ½·m·v² = const</code>
      </div>
      <div id="theoryCalculations" class="theory-calc"></div>
    </div>
  `;

  // 2. Modullarni ulash
  const sceneContainer = root.querySelector('#sceneContainer');
  const scene = new LabScene(sceneContainer);
  const chartContainer = root.querySelector('#chartContainer');
  const chart = new LiveChart(chartContainer);

  // Elementlar
  const playBtn = root.querySelector('#playBtn');
  const resetBtn = root.querySelector('#resetBtn');
  const slowMoBtn = root.querySelector('#slowMoBtn');
  const heightSlider = root.querySelector('#heightSlider');
  const heightVal = root.querySelector('#heightVal');
  const massSlider = root.querySelector('#massSlider');
  const massVal = root.querySelector('#massVal');
  const airToggle = root.querySelector('#airToggle');
  const shapeRow = root.querySelector('#shapeRow');
  const planetChips = root.querySelector('#planetChips');
  const shapeChips = root.querySelector('#shapeChips');
  const theoryBtn = root.querySelector('#theoryBtn');
  const theoryModal = root.querySelector('#theoryModal');
  const theoryCalculations = root.querySelector('#theoryCalculations');

  // HUD elementlar
  const hudTime = root.querySelector('#hudTime');
  const hudHeight = root.querySelector('#hudHeight');
  const hudSpeed = root.querySelector('#hudSpeed');
  const hudAccel = root.querySelector('#hudAccel');
  const epVal = root.querySelector('#epVal');
  const ekVal = root.querySelector('#ekVal');
  const epBar = root.querySelector('#epBar');
  const ekBar = root.querySelector('#ekBar');

  let timeScale = 1.0;
  let animId = null;
  let lastTimestamp = performance.now();

  function updateHUD(state) {
    hudTime.innerHTML = `${state.t.toFixed(2)} <small>s</small>`;
    hudHeight.innerHTML = `${Math.max(0, state.y).toFixed(2)} <small>m</small>`;
    hudSpeed.innerHTML = `${Math.abs(state.v).toFixed(2)} <small>m/s</small>`;
    hudAccel.innerHTML = `${Math.abs(state.a).toFixed(2)} <small>m/s²</small>`;

    const totalE = Math.max(1, (state.ep || 0) + (state.ek || 0));
    epVal.textContent = `${Math.round(state.ep)} J`;
    ekVal.textContent = `${Math.round(state.ek)} J`;
    epBar.style.width = `${Math.min(100, Math.max(0, (state.ep / totalE) * 100))}%`;
    ekBar.style.width = `${Math.min(100, Math.max(0, (state.ek / totalE) * 100))}%`;
  }

  function updateTheoryDisplay() {
    const th = sim.getTheoreticalValues();
    theoryCalculations.innerHTML = `
      <div class="theory-grid">
        <div>Kutilgan tushish vaqti: <strong>${th.tImpact} s</strong></div>
        <div>Urilishdagi tezlik: <strong>${th.vImpact} m/s (${(th.vImpact * 3.6).toFixed(1)} km/soat)</strong></div>
        <div>Erkin tushish tezlanishi g: <strong>${th.g} m/s²</strong></div>
      </div>
    `;
  }

  // 3. Animatsiya tsikli
  function loop(now) {
    if (scene.disposed) return;
    const dtReal = (now - lastTimestamp) / 1000;
    lastTimestamp = now;

    // dt ni cheklaymiz (tablar o'rtasida katta sakrash bo'lmasligi uchun)
    const dt = Math.min(0.05, dtReal) * timeScale;

    const state = sim.step(dt);
    scene.render(state);
    updateHUD(state);

    if (sim.state.isFinished && playBtn.textContent === 'Pauza') {
      playBtn.textContent = 'Qayta boshlash';
      showToast("Jism yerga tushdi! Natijalarni ko'ring.", { type: 'success' });
    }

    // Grafikni har 4 kadrda 1 marta chizamiz (CPU tejash)
    if (Math.random() < 0.35) {
      chart.update(sim.history, sim.params.height);
    }

    animId = requestAnimationFrame(loop);
  }

  // Voqealar (Event listeners)
  playBtn.addEventListener('click', () => {
    if (sim.state.isRunning) {
      sim.pause();
      playBtn.textContent = 'Davom etish';
    } else {
      sim.resume();
      playBtn.textContent = 'Pauza';
    }
  });

  resetBtn.addEventListener('click', () => {
    sim.reset();
    playBtn.textContent = 'Boshlash';
    scene.render(sim.state);
    updateHUD(sim.state);
    chart.update(sim.history, sim.params.height);
  });

  slowMoBtn.addEventListener('click', () => {
    if (timeScale === 1.0) {
      timeScale = 0.35;
      slowMoBtn.textContent = '1.0x Normal';
      slowMoBtn.classList.add('btn--active');
    } else {
      timeScale = 1.0;
      slowMoBtn.textContent = '0.5x Sekin';
      slowMoBtn.classList.remove('btn--active');
    }
  });

  heightSlider.addEventListener('input', (e) => {
    const val = Number(e.target.value);
    heightVal.textContent = `${val} m`;
    sim.setParams({ ...sim.params, height: val });
    sim.reset();
    playBtn.textContent = 'Boshlash';
    scene.render(sim.state);
    updateHUD(sim.state);
    updateTheoryDisplay();
    chart.update(sim.history, val);
  });

  massSlider.addEventListener('input', (e) => {
    const val = Number(e.target.value);
    massVal.textContent = `${val.toFixed(1)} kg`;
    sim.setParams({ ...sim.params, mass: val });
    updateHUD(sim.state);
  });

  airToggle.addEventListener('change', (e) => {
    const checked = e.target.checked;
    shapeRow.style.display = checked ? 'block' : 'none';
    sim.setParams({ ...sim.params, airResistance: checked });
    sim.reset();
    playBtn.textContent = 'Boshlash';
    showToast(checked ? 'Havo qarshiligi yoqildi' : 'Vakuum rejimi (qarshiliksiz)', { type: 'info' });
  });

  planetChips.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    planetChips.querySelectorAll('.chip').forEach((c) => c.classList.remove('chip--active'));
    chip.classList.add('chip--active');
    const planet = chip.dataset.planet;
    sim.setParams({ ...sim.params, planet });
    sim.reset();
    playBtn.textContent = 'Boshlash';
    scene.render(sim.state);
    updateHUD(sim.state);
    updateTheoryDisplay();
  });

  shapeChips.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    shapeChips.querySelectorAll('.chip').forEach((c) => c.classList.remove('chip--active'));
    chip.classList.add('chip--active');
    const shape = chip.dataset.shape;
    sim.setParams({ ...sim.params, shape });
    scene.updateObject(shape, sim.params.radius);
    sim.reset();
    playBtn.textContent = 'Boshlash';
  });

  theoryBtn.addEventListener('click', () => {
    theoryModal.style.display = theoryModal.style.display === 'none' ? 'block' : 'none';
  });

  // Boshlang'ich holatni chizish
  updateHUD(sim.state);
  updateTheoryDisplay();
  scene.render(sim.state);
  animId = requestAnimationFrame(loop);

  // Sahifadan chiqishda resurslarni tozalash (Garbage Collection & Animation Stop)
  root.cleanup = () => {
    cancelAnimationFrame(animId);
    scene.dispose();
    chart.destroy();
  };

  return root;
}
