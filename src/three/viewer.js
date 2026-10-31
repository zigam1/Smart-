import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import gsap from 'gsap';
import { buildRig } from './parts.js';

const CAT_ORDER = ['arduino', 'breadboard', 'led', 'warningLed', 'resistor', 'button', 'wires', 'sensor', 'buzzer'];
const LABEL_OFFSET = {
  arduino: [2.4, 1.3, 1.9],
  breadboard: [-3.5, 0.95, 2.9],
};
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export class Viewer {
  constructor(el, opts = {}) {
    this.el = el;
    this.opts = { interactive: true, labels: true, autoRotate: false, version: 'v2', onSelect: null, getLabel: null, rotateSpeed: 0.9, ...opts };
    this.version = this.opts.version;
    this.rigs = {};
    this.rig = null;
    this.hidden = new Set();
    this.labelsOn = this.opts.labels;
    this.selected = null;
    this.helper = null;
    this.levels = {};
    this.targets = {};
    this.state = { running: false, warning: false, pressed: false, version: this.version };
    this.clock = new THREE.Clock();
    this.visible = true;
    this.running = false;

    const small = window.innerWidth < 700;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.75 : 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.className = 'gl-canvas';
    el.appendChild(this.renderer.domElement);

    this.labelRenderer = new CSS2DRenderer();
    Object.assign(this.labelRenderer.domElement.style, { position: 'absolute', inset: '0', pointerEvents: 'none' });
    el.appendChild(this.labelRenderer.domElement);

    this.scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.6;
    pmrem.dispose();

    this.scene.add(new THREE.HemisphereLight(0xcfe8ff, 0x1a2a22, 0.5));
    const sun = new THREE.DirectionalLight(0xffffff, 2.4);
    sun.position.set(6, 14, 9);
    sun.castShadow = true;
    sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
    Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 50 });
    sun.shadow.bias = -0.0004;
    sun.shadow.radius = 3;
    this.scene.add(sun);

    this.camera = new THREE.PerspectiveCamera(35, 1, 0.1, 200);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 70;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.03;
    this.controls.autoRotate = this.opts.autoRotate && !reduceMotion();
    this.controls.autoRotateSpeed = this.opts.rotateSpeed;
    if (!this.opts.interactive) {
      this.controls.enableRotate = false;
      this.controls.enableZoom = false;
      this.controls.enablePan = false;
      this.renderer.domElement.style.touchAction = 'pan-y';
    }

    this.raycaster = new THREE.Raycaster();
    this.ndc = new THREE.Vector2();
    if (this.opts.interactive) this._bindPointer();

    this._setRig(this.version, false);
    this._resize();
    this.ro = new ResizeObserver(() => this._resize());
    this.ro.observe(el);
    this.io = new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; this.visible ? this.start() : this.stop(); }, { threshold: 0.01 });
    this.io.observe(el);
    this._onVis = () => (document.hidden ? this.stop() : this.visible && this.start());
    document.addEventListener('visibilitychange', this._onVis);
    this._tick = this._tick.bind(this);
    this.start();
  }

  /* ───────── rig / version ───────── */
  _getRig(v) {
    if (!this.rigs[v]) {
      const rig = buildRig(v);
      rig.map = new Map(rig.parts.map((p) => [p.obj, p]));
      this._makeLabels(rig);
      this.rigs[v] = rig;
    }
    return this.rigs[v];
  }

  _setRig(v, animate) {
    if (this.rig) this.scene.remove(this.rig.group);
    this._select(null, true);
    this.version = v;
    this.rig = this._getRig(v);
    this.scene.add(this.rig.group);
    this.state.version = v;
    this.rig.parts.forEach((p) => { p.obj.visible = !this.hidden.has(p.cat); });
    this._applyLabelVisibility();
    Object.keys(this.rig.leds).forEach((k) => { this.levels[k] = 0; this.targets[k] = 0; });
    if (animate) {
      const g = this.rig.group;
      gsap.fromTo(g.scale, { x: 0.9, y: 0.9, z: 0.9 }, { x: 1, y: 1, z: 1, duration: 0.7, ease: 'power3.out' });
      gsap.fromTo(g.position, { y: -1.2 }, { y: 0, duration: 0.7, ease: 'power3.out' });
    }
    this.resetView(animate);
  }

  setVersion(v) { if (v !== this.version) this._setRig(v, !reduceMotion()); }

  /* ───────── camera ───────── */
  _home() {
    const back = this.rig.depthBack;
    const half = (7.4 - back) / 2;
    const cz = (7.4 + back) / 2;
    const aspect = this.camera.aspect || 1;
    const m = Math.max(1, 1.15 / aspect);
    const target = new THREE.Vector3(0, 0.6, cz - 0.3);
    const dir = new THREE.Vector3(0.42, 0.62 + half * 0.01, 1).normalize();
    const pos = target.clone().add(dir.multiplyScalar(half * 2.35 * m));
    return { target, pos };
  }

  resetView(animate = true) {
    const h = this._home();
    if (!animate || reduceMotion()) {
      this.camera.position.copy(h.pos);
      this.controls.target.copy(h.target);
      this.controls.update();
      return;
    }
    gsap.to(this.camera.position, { x: h.pos.x, y: h.pos.y, z: h.pos.z, duration: 0.9, ease: 'power3.inOut' });
    gsap.to(this.controls.target, { x: h.target.x, y: h.target.y, z: h.target.z, duration: 0.9, ease: 'power3.inOut' });
  }

  _resize() {
    const w = this.el.clientWidth || 300;
    const h = this.el.clientHeight || 300;
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.labelRenderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (!this._userMoved && this.rig) this.resetView(false);
  }

  /* ───────── labels ───────── */
  _makeLabels(rig) {
    rig.labels = [];
    rig.parts.forEach((p) => {
      if (!p.label) return;
      const div = document.createElement('button');
      div.type = 'button';
      div.className = `model-label cat-${p.cat}`;
      div.style.pointerEvents = 'auto';
      div.addEventListener('click', (e) => { e.stopPropagation(); this.select(p); });
      const obj = new CSS2DObject(div);
      const off = LABEL_OFFSET[p.cat];
      if (off) obj.position.set(...off);
      else if (p.cat === 'wires') {
        const b = new THREE.Box3().setFromObject(p.obj);
        const c = b.getCenter(new THREE.Vector3());
        obj.position.set(c.x, b.max.y + 0.2, c.z);
      } else obj.position.set(0, (p.obj.userData.topY || 1) + 0.35, 0);
      p.obj.add(obj);
      p.label = { div, obj };
      rig.labels.push(p);
    });
    this._labelText(rig);
  }

  _labelText(rig = this.rig) {
    if (!rig || !rig.labels || !this.opts.getLabel) return;
    rig.labels.forEach((p) => { p.label.div.textContent = this.opts.getLabel(p.cat, p.role, true); });
  }

  refreshText() { Object.values(this.rigs).forEach((r) => this._labelText(r)); }

  setLabelsVisible(on) { this.labelsOn = on; this._applyLabelVisibility(); }

  _applyLabelVisibility() {
    if (!this.rig || !this.rig.labels) return;
    this.rig.labels.forEach((p) => { p.label.div.style.display = this.labelsOn && !this.hidden.has(p.cat) ? '' : 'none'; });
  }

  /* ───────── visibility ───────── */
  getCategories() {
    const set = new Set(this.rig.parts.map((p) => p.cat));
    return CAT_ORDER.filter((c) => set.has(c));
  }

  setCategoryVisible(cat, on) {
    on ? this.hidden.delete(cat) : this.hidden.add(cat);
    Object.values(this.rigs).forEach((r) => r.parts.forEach((p) => { if (p.cat === cat) p.obj.visible = on; }));
    if (this.selected && this.selected.cat === cat && !on) this._select(null);
    this._applyLabelVisibility();
  }

  isCategoryVisible(cat) { return !this.hidden.has(cat); }

  /* ───────── selection / picking ───────── */
  _bindPointer() {
    const cv = this.renderer.domElement;
    let down = null;
    cv.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; this._userMoved = true; });
    cv.addEventListener('pointerup', (e) => {
      if (!down) return;
      const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
      const quick = performance.now() - down.t < 600;
      down = null;
      if (moved < 6 && quick) this.select(this._pick(e));
    });
    cv.addEventListener('wheel', () => { this._userMoved = true; }, { passive: true });
    let pending = false;
    cv.addEventListener('pointermove', (e) => {
      if (pending || e.pointerType === 'touch') return;
      pending = true;
      requestAnimationFrame(() => { pending = false; cv.style.cursor = this._pick(e) ? 'pointer' : 'grab'; });
    });
  }

  _pick(e) {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(this.ndc, this.camera);
    const hits = this.raycaster.intersectObject(this.rig.group, true);
    for (const h of hits) {
      let o = h.object;
      let ok = true;
      let part = null;
      while (o) {
        if (o.visible === false || o.userData.noPick) { ok = false; break; }
        if (!part && this.rig.map.has(o)) part = this.rig.map.get(o);
        o = o.parent;
      }
      if (ok && part) return part;
    }
    return null;
  }

  select(part) { this._select(part); }

  _select(part, silent) {
    if (this.helper) { this.rig && this.rig.group.remove(this.helper); this.helper.geometry.dispose(); this.helper = null; }
    this.rigs && Object.values(this.rigs).forEach((r) => r.labels && r.labels.forEach((p) => p.label.div.classList.remove('active')));
    this.selected = part;
    if (part) {
      this.helper = new THREE.BoxHelper(part.obj, 0xffc247);
      this.helper.userData.noPick = true;
      this.rig.group.add(this.helper);
      if (part.label) part.label.div.classList.add('active');
      const c = new THREE.Box3().setFromObject(part.obj).getCenter(new THREE.Vector3());
      if (!reduceMotion()) {
        const d = c.clone().sub(this.controls.target).multiplyScalar(0.6);
        gsap.to(this.controls.target, { x: this.controls.target.x + d.x, y: this.controls.target.y + d.y, z: this.controls.target.z + d.z, duration: 0.6, ease: 'power2.out' });
      }
    }
    if (!silent && this.opts.onSelect) this.opts.onSelect(part ? { cat: part.cat, role: part.role } : null);
  }

  selectByCat(cat, role = null) {
    const p = this.rig.parts.find((x) => x.cat === cat && (role ? x.role === role : true));
    if (p && p.obj.visible) this._select(p);
  }

  /* ───────── live signal state ───────── */
  setSignals(s) {
    this.state = { ...this.state, ...s };
    const t = this.targets;
    const on = s.running;
    t.carRed = on && s.cars === 'red' ? 1 : 0;
    t.carYellow = on && s.cars === 'yellow' ? 1 : 0;
    t.carGreen = on && s.cars === 'green' ? 1 : 0;
    t.pedRed = on && s.ped === 'red' ? 1 : 0;
    t.pedGreen = on && s.ped === 'green' ? 1 : 0;
  }

  setSpin(on) { this.controls.autoRotate = on && !reduceMotion(); }
  isSpinning() { return this.controls.autoRotate; }

  /* ───────── loop ───────── */
  start() { if (this.running || document.hidden) return; this.running = true; this.clock.getDelta(); this._raf = requestAnimationFrame(this._tick); }
  stop() { this.running = false; cancelAnimationFrame(this._raf); }

  _tick() {
    if (!this.running) return;
    this._raf = requestAnimationFrame(this._tick);
    const dt = Math.min(this.clock.getDelta(), 0.1);
    const time = this.clock.elapsedTime;
    const k = 1 - Math.exp(-dt * 14);
    const rig = this.rig;
    const st = this.state;

    // LEDs
    for (const role in rig.leds) {
      const led = rig.leds[role];
      if (!led.userData.setLevel) continue;
      let target = this.targets[role] || 0;
      if (role === 'warning') target = st.running && st.warning ? (Math.sin(time * 18) > 0 ? 1 : 0.08) : 0;
      this.levels[role] = (this.levels[role] || 0) + (target - (this.levels[role] || 0)) * k;
      led.userData.setLevel(this.levels[role]);
    }
    // button press
    if (rig.button) rig.button.userData.cap.position.y += ((st.pressed ? 0.3 : 0.43) - rig.button.userData.cap.position.y) * k * 1.5;
    // buzzer rings
    if (rig.buzzer) {
      const on = st.running && st.warning;
      rig.buzzer.userData.rings.forEach((r, i) => {
        const p = (time * 2.2 + i / 3) % 1;
        r.scale.setScalar(on ? 0.5 + p * 1.6 : 1);
        r.material.opacity = on ? (1 - p) * 0.8 : 0;
      });
    }
    // ultrasonic rings
    if (rig.sensor) {
      const on = st.running;
      rig.sensor.userData.rings.forEach((r, i) => {
        const j = i % 3;
        const p = (time * 0.9 + j / 3) % 1;
        r.position.z = r.userData.base + p * 3.2;
        r.scale.setScalar(0.5 + p * 1.8);
        r.material.opacity = on ? (1 - p) * 0.55 : 0;
      });
    }
    if (this.helper) this.helper.update();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.labelRenderer.render(this.scene, this.camera);
  }

  dispose() {
    this.stop();
    this.ro.disconnect();
    this.io.disconnect();
    document.removeEventListener('visibilitychange', this._onVis);
    this.controls.dispose();
    this.renderer.dispose();
    this.el.replaceChildren();
  }
}
