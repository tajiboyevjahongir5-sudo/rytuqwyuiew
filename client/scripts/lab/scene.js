// 3D Fizika Laboratoriyasi sahnasi (Three.js)

import * as THREE from '../../vendor/three.module.js';

export class LabScene {
  constructor(container) {
    this.container = container;
    this.disposed = false;
    this.webglSupported = this._checkWebGL();

    if (!this.webglSupported) {
      this._createFallback2D();
      return;
    }

    this._initThree();
    this._buildEnvironment();
    this._attachEvents();
  }

  _checkWebGL() {
    try {
      const canvas = document.createElement('canvas');
      return Boolean(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch {
      return false;
    }
  }

  _initThree() {
    const width = this.container.clientWidth || 360;
    const height = this.container.clientHeight || 320;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b1329);
    this.scene.fog = new THREE.FogExp2(0x0b1329, 0.015);

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 500);
    this.camera.position.set(0, 15, 38);
    this.camera.lookAt(0, 10, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // Yoritish
    const ambient = new THREE.AmbientLight(0xffffff, 0.65);
    this.scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(15, 40, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 100;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 40;
    dirLight.shadow.camera.bottom = -5;
    this.scene.add(dirLight);

    const blueRim = new THREE.PointLight(0x38bdf8, 2, 40);
    blueRim.position.set(-15, 20, -10);
    this.scene.add(blueRim);
  }

  _buildEnvironment() {
    // 1. Zamin / Laboratoriya platformasi
    const floorGeo = new THREE.CylinderGeometry(18, 18, 0.6, 48);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x111c38,
      roughness: 0.4,
      metalness: 0.6,
    });
    this.floor = new THREE.Mesh(floorGeo, floorMat);
    this.floor.position.y = -0.3;
    this.floor.receiveShadow = true;
    this.scene.add(this.floor);

    // Zamin doirasi (neon kontur)
    const ringGeo = new THREE.RingGeometry(17.8, 18.0, 48);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.01;
    this.scene.add(ring);

    // To'r (Grid)
    const grid = new THREE.GridHelper(30, 30, 0x38bdf8, 0x1e293b);
    grid.position.y = 0.02;
    this.scene.add(grid);

    // 2. Vertikal o'lchov ustuni / Chizg'ich (Ruler pillar)
    const postGeo = new THREE.BoxGeometry(0.3, 50, 0.3);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.2 });
    this.rulerPost = new THREE.Mesh(postGeo, postMat);
    this.rulerPost.position.set(-4, 25, 0);
    this.rulerPost.castShadow = true;
    this.scene.add(this.rulerPost);

    // O'lchov belgilari (har 5 metrda gorizontal tishlar)
    const notchGeo = new THREE.BoxGeometry(1.0, 0.08, 0.08);
    const notchMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    for (let h = 0; h <= 50; h += 5) {
      const notch = new THREE.Mesh(notchGeo, notchMat);
      notch.position.set(-3.5, h, 0);
      this.scene.add(notch);
    }

    // 3. Eksperiment jismi (Harakatlanuvchi obyekt)
    const sphereGeo = new THREE.SphereGeometry(0.8, 32, 32);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      metalness: 0.7,
      roughness: 0.2,
      emissive: 0x0284c7,
      emissiveIntensity: 0.2,
    });
    this.bodyMesh = new THREE.Mesh(sphereGeo, sphereMat);
    this.bodyMesh.position.set(0, 20, 0);
    this.bodyMesh.castShadow = true;
    this.scene.add(this.bodyMesh);

    // 4. Tezlik vektori strelkasi (Velocity Vector Arrow)
    this.arrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(0, 20, 0),
      0,
      0x22c55e,
      0.6,
      0.4,
    );
    this.arrow.visible = false;
    this.scene.add(this.arrow);

    // 5. Yerga tushgan soya (Contact shadow dot)
    const shadowGeo = new THREE.CircleGeometry(0.8, 32);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.5,
    });
    this.contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.contactShadow.rotation.x = -Math.PI / 2;
    this.contactShadow.position.y = 0.03;
    this.scene.add(this.contactShadow);
  }

  _attachEvents() {
    this.onResize = () => {
      if (this.disposed || !this.renderer) return;
      const width = this.container.clientWidth || 360;
      const height = this.container.clientHeight || 320;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    };
    window.addEventListener('resize', this.onResize);

    // Mobil touch orqali sahnani biroz aylantirib ko'rish (Pan/Rotate)
    let isDragging = false;
    let prevX = 0;
    let targetAngle = 0;
    this.currentAngle = 0;

    const onPointerDown = (e) => {
      isDragging = true;
      prevX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    };
    const onPointerMove = (e) => {
      if (!isDragging) return;
      const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      const dx = clientX - prevX;
      prevX = clientX;
      targetAngle += dx * 0.01;
      // Burchakni cheklaymiz (-45° dan +45° gacha)
      targetAngle = Math.max(-0.8, Math.min(0.8, targetAngle));
    };
    const onPointerUp = () => {
      isDragging = false;
    };

    const dom = this.renderer.domElement;
    dom.addEventListener('mousedown', onPointerDown);
    dom.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);

    dom.addEventListener('touchstart', onPointerDown, { passive: true });
    dom.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    this.updateControls = () => {
      this.currentAngle += (targetAngle - this.currentAngle) * 0.1;
      const radius = 38;
      this.camera.position.x = Math.sin(this.currentAngle) * radius;
      this.camera.position.z = Math.cos(this.currentAngle) * radius;
      this.camera.lookAt(0, 10, 0);
    };
  }

  updateObject(shape, radius, color = 0x38bdf8) {
    if (!this.bodyMesh) return;
    this.scene.remove(this.bodyMesh);
    this.bodyMesh.geometry.dispose();

    let geo;
    if (shape === 'cube') {
      const s = radius * 2.2;
      geo = new THREE.BoxGeometry(s, s, s);
    } else if (shape === 'feather') {
      geo = new THREE.CylinderGeometry(radius * 2.5, radius * 2.5, 0.1, 24);
    } else {
      geo = new THREE.SphereGeometry(Math.max(0.4, radius * 2.5), 32, 32);
    }

    const mat = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.6,
      roughness: 0.3,
      emissive: color,
      emissiveIntensity: 0.2,
    });
    this.bodyMesh = new THREE.Mesh(geo, mat);
    this.bodyMesh.castShadow = true;
    this.scene.add(this.bodyMesh);
  }

  render(state) {
    if (this.disposed) return;

    if (!this.webglSupported) {
      this._renderFallback2D(state);
      return;
    }

    this.updateControls?.();

    if (state && this.bodyMesh) {
      // 3D sahnada y koordinatasi metrga mutanosib
      this.bodyMesh.position.y = Math.max(0.4, state.y);

      // Soya masshtabi balandlikka teskari mutanosib
      const shadowScale = Math.max(0.2, 1 - state.y / 60);
      this.contactShadow.scale.set(shadowScale, shadowScale, shadowScale);
      this.contactShadow.material.opacity = Math.max(0.1, 0.6 - state.y / 70);

      // Tezlik vektori strelkasi
      const speed = Math.abs(state.v);
      if (speed > 0.2 && state.y > 0.2) {
        this.arrow.visible = true;
        this.arrow.position.copy(this.bodyMesh.position);
        const dir = state.v >= 0 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, -1, 0);
        this.arrow.setDirection(dir);
        this.arrow.setLength(Math.min(8, speed * 0.4), 0.5, 0.3);
      } else {
        this.arrow.visible = false;
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  _createFallback2D() {
    this.fallbackCanvas = document.createElement('canvas');
    this.fallbackCanvas.className = 'lab-fallback-canvas';
    this.container.appendChild(this.fallbackCanvas);
    this.ctx2d = this.fallbackCanvas.getContext('2d');
  }

  _renderFallback2D(state) {
    const canvas = this.fallbackCanvas;
    const ctx = this.ctx2d;
    if (!canvas || !ctx) return;

    canvas.width = this.container.clientWidth || 360;
    canvas.height = this.container.clientHeight || 320;

    ctx.fillStyle = '#0b1329';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Chizg'ich
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 20);
    ctx.lineTo(40, canvas.height - 30);
    ctx.stroke();

    // Zamin
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(20, canvas.height - 30, canvas.width - 40, 6);

    // Jism pozitsiyasi
    const yMax = 50;
    const normY = Math.max(0, Math.min(1, (state?.y || 0) / yMax));
    const screenY = (canvas.height - 50) - normY * (canvas.height - 80);

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, screenY, 14, 0, Math.PI * 2);
    ctx.fill();
  }

  dispose() {
    this.disposed = true;
    window.removeEventListener('resize', this.onResize);
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement.remove();
    }
    if (this.fallbackCanvas) {
      this.fallbackCanvas.remove();
    }
  }
}
