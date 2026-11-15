// Jonli SVG grafik komponenti (Live Physics Graph)

export class LiveChart {
  constructor(container, { title = 'h(t) - Balandlik va v(t) - Tezlik grafigi' } = {}) {
    this.container = container;
    this.title = title;
    this._initDom();
  }

  _initDom() {
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'lab-chart-card card';
    this.wrapper.innerHTML = `
      <div class="lab-chart-header">
        <span class="lab-chart-title">${this.title}</span>
        <div class="lab-chart-legend">
          <span class="legend-item"><span class="legend-dot" style="background:#38bdf8"></span> Balandlik h (m)</span>
          <span class="legend-item"><span class="legend-dot" style="background:#22c55e"></span> Tezlik |v| (m/s)</span>
        </div>
      </div>
      <svg class="lab-chart-svg" viewBox="0 0 320 120" preserveAspectRatio="none">
        <defs>
          <linearGradient id="hGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.0"/>
          </linearGradient>
        </defs>
        <line x1="25" y1="10" x2="25" y2="105" stroke="#334155" stroke-width="1"/>
        <line x1="25" y1="105" x2="310" y2="105" stroke="#334155" stroke-width="1"/>
        <path id="hArea" d="" fill="url(#hGrad)"/>
        <path id="hLine" d="" fill="none" stroke="#38bdf8" stroke-width="2"/>
        <path id="vLine" d="" fill="none" stroke="#22c55e" stroke-width="1.8" stroke-dasharray="3 2"/>
        <text x="28" y="18" fill="#64748b" font-size="8">h, v</text>
        <text x="295" y="100" fill="#64748b" font-size="8">t (s)</text>
      </svg>
    `;
    this.container.appendChild(this.wrapper);
    this.hLine = this.wrapper.querySelector('#hLine');
    this.hArea = this.wrapper.querySelector('#hArea');
    this.vLine = this.wrapper.querySelector('#vLine');
  }

  update(history, maxHeight = 50) {
    if (!history || history.length < 2) {
      this.hLine.setAttribute('d', '');
      this.hArea.setAttribute('d', '');
      this.vLine.setAttribute('d', '');
      return;
    }

    const maxT = Math.max(1.5, history[history.length - 1].t);
    const maxV = Math.sqrt(2 * 9.8 * maxHeight) * 1.1; // masshtab uchun

    const width = 285;
    const height = 95;
    const originX = 25;
    const originY = 105;

    let hPoints = [];
    let vPoints = [];

    for (let i = 0; i < history.length; i++) {
      const p = history[i];
      const x = originX + (p.t / maxT) * width;
      const yH = originY - (p.y / maxHeight) * height;
      const yV = originY - (Math.abs(p.v) / maxV) * height;

      hPoints.push(`${x.toFixed(1)},${Math.max(10, yH).toFixed(1)}`);
      vPoints.push(`${x.toFixed(1)},${Math.max(10, yV).toFixed(1)}`);
    }

    const hPath = 'M ' + hPoints.join(' L ');
    const vPath = 'M ' + vPoints.join(' L ');

    this.hLine.setAttribute('d', hPath);
    this.vLine.setAttribute('d', vPath);

    const firstX = originX;
    const lastX = originX + (history[history.length - 1].t / maxT) * width;
    const areaPath = `${hPath} L ${lastX.toFixed(1)},${originY} L ${firstX},${originY} Z`;
    this.hArea.setAttribute('d', areaPath);
  }

  destroy() {
    this.wrapper?.remove();
  }
}
