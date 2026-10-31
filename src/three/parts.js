// المجسمات تُبنى برمجيا بأبعاد حقيقية تقريبا (1 وحدة = 1 سم).
// Parts are built procedurally at roughly real scale (1 unit = 1 cm).
import * as THREE from 'three';

export const P = 0.254; // breadboard pitch (0.1")
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05, ...o });
const box = (w, h, d, m) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
const cyl = (rt, rb, h, m, seg = 24) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);

const metal = std(0xc9ccd1, { metalness: 0.9, roughness: 0.3 });
const gold = std(0xd4af37, { metalness: 0.9, roughness: 0.35 });
const black = std(0x141414, { roughness: 0.5 });
const darkGrey = std(0x2b2d31, { roughness: 0.6 });

function tube(points, r, material, seg) {
  const c = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.15);
  return new THREE.Mesh(new THREE.TubeGeometry(c, seg || points.length * 10, r, 8, false), material);
}

let glowTex;
function glowTexture() {
  if (glowTex) return glowTex;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.28, 'rgba(255,255,255,0.4)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  glowTex = new THREE.CanvasTexture(c);
  glowTex.colorSpace = THREE.SRGBColorSpace;
  return glowTex;
}

function textTexture(lines, w, h, color = '#ffffff') {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = color;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  lines.forEach((l) => {
    g.font = `700 ${l.size}px Arial, sans-serif`;
    g.fillText(l.text, w / 2, l.y);
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// ───────────── LED ─────────────
export function makeLED(color) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color, emissive: color, emissiveIntensity: 0.04, roughness: 0.15, metalness: 0, transparent: true, opacity: 0.9,
  });
  const h = 0.55, r = 0.25;
  const body = cyl(r, r, h, bodyMat, 28); body.position.y = 0.3 + h / 2;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), bodyMat); dome.position.y = 0.3 + h;
  const flange = cyl(0.29, 0.29, 0.08, bodyMat, 28); flange.position.y = 0.34;
  g.add(body, dome, flange);
  [-P / 2, P / 2].forEach((x, i) => {
    const leg = cyl(0.03, 0.03, 0.46, metal, 8);
    leg.position.set(x, 0.1, 0);
    leg.scale.y = i === 1 ? 1.08 : 1; // anode (longer leg)
    g.add(leg);
  });
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  sprite.position.y = 0.3 + h * 0.8;
  sprite.userData.noPick = true;
  sprite.scale.setScalar(0.6);
  g.add(sprite);
  g.userData.setLevel = (v) => {
    bodyMat.emissiveIntensity = 0.04 + v * 2.4;
    sprite.material.opacity = v * 0.95;
    sprite.scale.setScalar(0.6 + v * 1.7);
  };
  g.userData.topY = 0.3 + h + r;
  return g;
}

// ───────────── Resistor ─────────────
export function makeResistor(span = 3 * P) {
  const g = new THREE.Group();
  const prof = [[0.05, -0.32], [0.12, -0.28], [0.15, -0.2], [0.11, -0.15], [0.11, 0.15], [0.15, 0.2], [0.12, 0.28], [0.05, 0.32]].map(([x, y]) => new THREE.Vector2(x, y));
  const body = new THREE.Mesh(new THREE.LatheGeometry(prof, 24), std(0xd8b98a, { roughness: 0.7 }));
  body.rotation.z = Math.PI / 2;
  body.position.y = 0.17;
  g.add(body);
  [[-0.11, 0xd32f2f], [-0.05, 0xd32f2f], [0.01, 0x6d4c41], [0.14, 0xd4af37]].forEach(([x, c]) => {
    const b = cyl(0.118, 0.118, 0.04, std(c, { roughness: 0.5 }), 20);
    b.rotation.z = Math.PI / 2;
    b.position.set(x, 0.17, 0);
    g.add(b);
  });
  const hs = span / 2;
  [-1, 1].forEach((s) => {
    g.add(tube([new THREE.Vector3(s * 0.3, 0.17, 0), new THREE.Vector3(s * (hs - 0.06), 0.17, 0), new THREE.Vector3(s * hs, 0.1, 0), new THREE.Vector3(s * hs, -0.1, 0)], 0.028, metal));
  });
  g.userData.topY = 0.33;
  return g;
}

// ───────────── Push button ─────────────
export function makeButton() {
  const g = new THREE.Group();
  const base = box(0.95, 0.38, 0.95, std(0x1e1f22, { roughness: 0.5 })); base.position.y = 0.19;
  const ring = cyl(0.36, 0.36, 0.06, metal, 24); ring.position.y = 0.4;
  const cap = new THREE.Group();
  const capMesh = cyl(0.26, 0.28, 0.3, std(0x2fbf71, { roughness: 0.35 }), 24); capMesh.position.y = 0.15;
  const capTop = new THREE.Mesh(new THREE.SphereGeometry(0.26, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), capMesh.material); capTop.position.y = 0.3; capTop.scale.y = 0.35;
  cap.add(capMesh, capTop); cap.position.y = 0.43;
  g.add(base, ring, cap);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    const l = cyl(0.03, 0.03, 0.4, metal, 8); l.position.set(sx * 0.381, -0.05, sz * 0.504 * 0.9); g.add(l);
  });
  g.userData.cap = cap;
  g.userData.topY = 0.9;
  return g;
}

// ───────────── Buzzer ─────────────
export function makeBuzzer() {
  const g = new THREE.Group();
  const body = cyl(0.62, 0.62, 0.95, std(0x151515, { roughness: 0.4 }), 32); body.position.y = 0.5;
  const top = cyl(0.55, 0.55, 0.02, std(0x0b0b0b), 32); top.position.y = 0.99;
  const hole = cyl(0.09, 0.09, 0.03, std(0x000000), 16); hole.position.y = 1.0;
  const plus = box(0.16, 0.012, 0.04, std(0xe9e9e9)); plus.position.set(-0.4, 0.995, 0.28);
  const plus2 = box(0.04, 0.012, 0.16, std(0xe9e9e9)); plus2.position.set(-0.4, 0.995, 0.28);
  g.add(body, top, hole, plus, plus2);
  [-1.5 * P, 1.5 * P].forEach((x) => { const l = cyl(0.03, 0.03, 0.6, metal, 8); l.position.set(x, 0.05, 0); g.add(l); });
  // sound-wave rings
  const rings = [];
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.9, 0.96, 48), new THREE.MeshBasicMaterial({ color: 0xffc247, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.y = 1.15; m.userData.noPick = true; g.add(m); rings.push(m);
  }
  g.userData.rings = rings;
  g.userData.topY = 1.05;
  return g;
}

// ───────────── HC-SR04 ─────────────
export function makeSensor() {
  const g = new THREE.Group();
  const pcb = box(4.5, 2.0, 0.16, std(0x0b62ad, { roughness: 0.5 })); pcb.position.y = 1.0;
  g.add(pcb);
  const eyeMat = std(0xcfd3d8, { metalness: 0.85, roughness: 0.35 });
  const inner = std(0x2a2d31, { roughness: 0.8 });
  const eyes = [];
  [-1.2, 1.2].forEach((x) => {
    const e = cyl(0.8, 0.8, 1.15, eyeMat, 40); e.rotation.x = Math.PI / 2; e.position.set(x, 1.0, 0.65);
    const mesh = cyl(0.62, 0.62, 0.05, inner, 40); mesh.rotation.x = Math.PI / 2; mesh.position.set(x, 1.0, 1.24);
    const grid = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.02, 8, 40), eyeMat); grid.position.set(x, 1.0, 1.27);
    g.add(e, mesh, grid);
    eyes.push(new THREE.Vector3(x, 1.0, 1.3));
  });
  const xtal = cyl(0.1, 0.1, 0.5, metal, 16); xtal.rotation.z = Math.PI / 2; xtal.position.set(0, 0.35, 0.18);
  const ic = box(0.7, 0.4, 0.1, black); ic.position.set(0, 1.5, 0.12);
  const hdr = box(1.3, 0.28, 0.25, black); hdr.position.set(0, 0.05, 0);
  g.add(xtal, ic, hdr);
  const pinX = [-0.381, -0.127, 0.127, 0.381];
  pinX.forEach((x) => { const p = cyl(0.025, 0.025, 0.5, gold, 8); p.position.set(x, -0.18, 0); g.add(p); });
  g.userData.pinX = pinX;
  // ultrasonic rings (expanding from each eye)
  const rings = [];
  eyes.forEach((pos, ei) => {
    for (let i = 0; i < 3; i++) {
      const m = new THREE.Mesh(new THREE.RingGeometry(0.7, 0.76, 48), new THREE.MeshBasicMaterial({ color: ei === 0 ? 0x4fc3f7 : 0x38e08a, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
      m.position.copy(pos); m.userData.noPick = true; m.userData.base = pos.z; g.add(m); rings.push(m);
    }
  });
  g.userData.rings = rings;
  g.userData.topY = 2.0;
  return g;
}

// ───────────── Arduino Uno ─────────────
export function makeArduino() {
  const g = new THREE.Group();
  const W = 6.86, D = 5.34, T = 0.16;
  const pcb = box(W, T, D, std(0x0b6aa5, { roughness: 0.45 })); pcb.position.y = T / 2; g.add(pcb);
  // silkscreen text
  const tex = textTexture([{ text: 'ARDUINO', size: 64, y: 34 }, { text: 'UNO', size: 72, y: 92 }], 256, 128, '#e9f5ff');
  const sil = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
  sil.rotation.x = -Math.PI / 2; sil.position.set(0.5, T + 0.005, 0.15); sil.userData.noPick = true; g.add(sil);

  // USB-B and power jack (left edge)
  const usb = box(1.6, 1.1, 1.2, metal); usb.position.set(-W / 2 + 0.5, T + 0.55, -1.1);
  const jack = box(1.4, 1.1, 0.95, black); jack.position.set(-W / 2 + 0.45, T + 0.55, 1.35);
  g.add(usb, jack);
  // main chip
  const chip = box(3.5, 0.35, 0.95, black); chip.position.set(1.0, T + 0.18, 0.95); g.add(chip);
  [-1, 1].forEach((s) => { const legs = box(3.4, 0.05, 0.08, metal); legs.position.set(1.0, T + 0.05, 0.95 + s * 0.52); g.add(legs); });
  // reset, crystal, caps
  const rb = box(0.6, 0.3, 0.6, metal); rb.position.set(-1.9, T + 0.15, -1.55);
  const rc = cyl(0.17, 0.17, 0.12, std(0xd32f2f), 16); rc.position.set(-1.9, T + 0.35, -1.55);
  const xt = box(0.9, 0.3, 0.4, metal); xt.position.set(-0.7, T + 0.15, 1.0);
  g.add(rb, rc, xt);
  [[-2.0, 0.2], [-2.0, -0.4], [-0.9, -0.5]].forEach(([x, z]) => { const c = cyl(0.2, 0.2, 0.5, std(0x2b2d31), 16); c.position.set(x, T + 0.25, z); g.add(c); });

  // headers: 18 pins on the back edge (digital), power+analog on the front edge
  const hdrMat = std(0x101113, { roughness: 0.45 });
  const pinMat = std(0x3b3d42, { roughness: 0.4 });
  const pinsTop = []; // x positions for digital header
  const topZ = -D / 2 + 0.25;
  const x0 = -2.0;
  const xTop = (i) => x0 + i * P + (i >= 10 ? 0.4 : 0);
  const h1 = box(10 * P, 0.85, 0.26, hdrMat); h1.position.set((xTop(0) + xTop(9)) / 2, T + 0.425, topZ);
  const h2 = box(8 * P, 0.85, 0.26, hdrMat); h2.position.set((xTop(10) + xTop(17)) / 2, T + 0.425, topZ);
  g.add(h1, h2);
  const holes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 0.02, 0.1), pinMat, 18 + 14);
  holes.raycast = () => {};
  const dm = new THREE.Matrix4();
  for (let i = 0; i < 18; i++) { dm.makeTranslation(xTop(i), T + 0.86, topZ); holes.setMatrixAt(i, dm); pinsTop.push(new THREE.Vector3(xTop(i), T + 0.9, topZ)); }
  const bottomZ = D / 2 - 0.25;
  const xBot = (i) => -0.3 + i * P + (i >= 8 ? 0.4 : 0);
  const b1 = box(8 * P, 0.85, 0.26, hdrMat); b1.position.set((xBot(0) + xBot(7)) / 2, T + 0.425, bottomZ);
  const b2 = box(6 * P, 0.85, 0.26, hdrMat); b2.position.set((xBot(8) + xBot(13)) / 2, T + 0.425, bottomZ);
  g.add(b1, b2);
  for (let i = 0; i < 14; i++) { dm.makeTranslation(xBot(i), T + 0.86, bottomZ); holes.setMatrixAt(18 + i, dm); }
  g.add(holes);

  // header labels
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.3), new THREE.MeshBasicMaterial({ map: textTexture([{ text: 'DIGITAL (PWM~)', size: 36, y: 32 }], 512, 64, '#cfe6f7'), transparent: true }));
  lab.rotation.x = -Math.PI / 2; lab.position.set(1.0, T + 0.005, -D / 2 + 0.7); lab.userData.noPick = true; g.add(lab);

  // standoffs
  [[-3, -2.2], [3, -2.2], [-3, 2.2], [3, 2.2]].forEach(([x, z]) => { const s = cyl(0.14, 0.14, 0.2, std(0x20242a), 12); s.position.set(x, -0.1, z); g.add(s); });

  // pin anchor lookup: i = header index (0..17) left → right
  g.userData.pinAnchor = (i) => pinsTop[Math.max(0, Math.min(17, i))].clone();
  g.userData.topY = 1.1;
  return g;
}

// ───────────── Breadboard ─────────────
export function makeBreadboard() {
  const g = new THREE.Group();
  const H = 0.85, cols = 30;
  const W = (cols - 1) * P + 1.5, D = 6.2;
  const body = box(W, H, D, std(0xe9e6dd, { roughness: 0.6 })); body.position.y = H / 2; g.add(body);
  const groove = box(W - 0.1, 0.02, 0.5, std(0xc9c5b8, { roughness: 0.8 })); groove.position.y = H + 0.001; g.add(groove);
  // rail stripes
  [[-2.8, 0xd32f2f], [-2.04, 0x1976d2], [2.04, 0x1976d2], [2.8, 0xd32f2f]].forEach(([z, c]) => {
    const s = box(W - 0.5, 0.012, 0.03, std(c, { roughness: 0.6 })); s.position.set(0, H + 0.003, z); g.add(s);
  });
  const rowsU = [-1.52, -1.266, -1.012, -0.758, -0.504];
  const rowsL = rowsU.map((z) => -z).reverse();
  const rails = [-2.54, -2.286, 2.286, 2.54];
  const colX = (c) => (c - (cols - 1) / 2) * P;
  const total = cols * 10 + 4 * 25;
  const holes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, 0.02, 0.1), std(0x25252a, { roughness: 0.9 }), total);
  holes.raycast = () => {};
  const m = new THREE.Matrix4();
  let n = 0;
  for (let c = 0; c < cols; c++) [...rowsU, ...rowsL].forEach((z) => { m.makeTranslation(colX(c), H + 0.008, z); holes.setMatrixAt(n++, m); });
  rails.forEach((z) => { for (let k = 0; k < 25; k++) { const c = 2 + k + Math.floor(k / 5) * 0.0; m.makeTranslation((k - 12) * P * 1.12, H + 0.008, z); holes.setMatrixAt(n++, m); } });
  holes.count = n;
  g.add(holes);
  g.userData.layout = { H, W, D, cols, rowsU, rowsL, colX, gndBack: -2.286, gndFront: 2.286 };
  g.userData.topY = H;
  return g;
}

// ───────────── Wire ─────────────
export function makeWire(from, to, color, lift = 2.2) {
  const g = new THREE.Group();
  const mat = std(color, { roughness: 0.4 });
  const mid1 = from.clone().lerp(to, 0.25); mid1.y = Math.max(from.y, to.y) + lift * 0.8;
  const mid2 = from.clone().lerp(to, 0.75); mid2.y = Math.max(from.y, to.y) + lift * 0.8;
  const pts = [from.clone(), from.clone().add(new THREE.Vector3(0, 0.35, 0)), mid1, mid2, to.clone().add(new THREE.Vector3(0, 0.35, 0)), to.clone()];
  g.add(tube(pts, 0.05, mat, 40));
  [from, to].forEach((p) => { const tip = cyl(0.07, 0.07, 0.3, black, 12); tip.position.copy(p).add(new THREE.Vector3(0, 0.18, 0)); g.add(tip); });
  return g;
}

// ───────────── Base plate with Islamic star pattern ─────────────
export function makeBase(w, d) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#12201a'; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = 'rgba(143,168,118,0.55)'; g.lineWidth = 2;
  const s = 128, h = s / 2, q = s / 4;
  for (let ox = 0; ox < 2; ox++) for (let oy = 0; oy < 2; oy++) {
    const cx = ox * s + h, cy = oy * s + h;
    g.strokeRect(cx - q, cy - q, h, h);
    g.save(); g.translate(cx, cy); g.rotate(Math.PI / 4); g.strokeRect(-q, -q, h, h); g.restore();
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { g.beginPath(); g.moveTo(cx + a * q, cy + b * q); g.lineTo(cx + a * h, cy + b * h); g.stroke(); });
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(w / 7, d / 7);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const mesh = box(w, 0.5, d, [std(0x0f1a15), std(0x0f1a15), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 }), std(0x0f1a15), std(0x0f1a15), std(0x0f1a15)]);
  mesh.position.y = -0.25;
  mesh.userData.noPick = true;
  return mesh;
}

// ───────────── Whole rig (V1 or V2) ─────────────
const WIRE = { carRed: 0xe53935, carYellow: 0xf9c22e, carGreen: 0x2ecc71, pedRed: 0xc77dff, pedGreen: 0x26c6da, button: 0x4fc3f7, warning: 0xff9800, buzzer: 0xf5f5f5, gnd: 0x6b7280 };
const LED_COLOR = { carRed: 0xff3b30, carYellow: 0xffc400, carGreen: 0x22e07a, pedRed: 0xff3b30, pedGreen: 0x22e07a, warning: 0xff8a00 };

export function buildRig(version) {
  const v2 = version === 'v2';
  const rig = new THREE.Group();
  const parts = []; // { obj, cat, role, label }
  const leds = {};
  const reg = (obj, cat, role = null, label = true) => { obj.userData.cat = cat; obj.userData.role = role; rig.add(obj); parts.push({ obj, cat, role, label }); return obj; };

  const bbPos = new THREE.Vector3(0, 0, -3.4);
  const arPos = new THREE.Vector3(0, 0.45, 3.7);
  const sensPos = new THREE.Vector3(0, 0.9, -8.9);

  const depthBack = v2 ? -11.6 : -7.6;
  const base = makeBase(15, 7.4 - depthBack);
  base.position.z = (7.4 + depthBack) / 2;
  rig.add(base);

  const bb = makeBreadboard(); bb.position.copy(bbPos); reg(bb, 'breadboard');
  const L = bb.userData.layout;
  const H = L.H;
  const at = (col, z, y = H) => new THREE.Vector3(L.colX(col) + bbPos.x, y + bbPos.y, z + bbPos.z);

  const ar = makeArduino(); ar.position.copy(arPos); reg(ar, 'arduino');
  const pin = (i) => ar.userData.pinAnchor(i).add(arPos);

  // LED slots
  const slots = [
    ['carRed', 0, 0], ['carYellow', 4, 0], ['carGreen', 8, 0], ['pedRed', 18, 0], ['pedGreen', 23, 0],
  ];
  const headerIdx = { carRed: 16, carYellow: 15, carGreen: 14, pedRed: 13, pedGreen: 12, button: 11, warning: 10, buzzer: 9 };
  const wires = [];
  const addWire = (a, b, color, lift) => { const w = makeWire(a, b, color, lift); wires.push(w); };

  const gndPin = pin(3);
  const placeLED = (role, c, upper, cat = 'led') => {
    const zLed = upper ? L.rowsU[4] : L.rowsL[0];
    const zRes = upper ? L.rowsU[2] : L.rowsL[2];
    const zIn = upper ? L.rowsU[0] : L.rowsL[4];
    const zGnd = upper ? L.rowsU[3] : L.rowsL[1];
    const led = makeLED(LED_COLOR[role]);
    led.position.set((L.colX(c) + L.colX(c + 1)) / 2 + bbPos.x, H + bbPos.y, zLed + bbPos.z);
    reg(led, cat, role);
    leds[role] = led;
    const res = makeResistor(3 * P);
    res.position.set((L.colX(c + 1) + L.colX(c + 4)) / 2 + bbPos.x, H + bbPos.y, zRes + bbPos.z);
    reg(res, 'resistor', role, role === 'carRed');
    addWire(pin(headerIdx[role === 'warning' ? 'warning' : role]), at(c + 4, zIn), WIRE[role], 2.4 + c * 0.03);
    addWire(at(c, zGnd), at(c, upper ? L.gndBack : L.gndFront), WIRE.gnd, 0.9);
  };
  slots.forEach(([role, c]) => placeLED(role, c, true));
  if (v2) placeLED('warning', 9, false, 'warningLed');

  // button over the centre groove
  const btn = makeButton();
  btn.position.set(L.colX(15.5) + bbPos.x, H + bbPos.y, bbPos.z);
  reg(btn, 'button');
  addWire(pin(headerIdx.button), at(14, L.rowsU[0]), WIRE.button, 2.3);
  addWire(at(17, L.rowsU[2]), at(17, L.gndBack), WIRE.gnd, 0.9);

  // GND from Arduino to back rail
  addWire(gndPin, at(26, L.gndBack), WIRE.gnd, 3.0);

  if (v2) {
    const bz = makeBuzzer();
    bz.position.set((L.colX(21) + L.colX(24)) / 2 + bbPos.x, H + bbPos.y, L.rowsL[1] + bbPos.z);
    reg(bz, 'buzzer');
    addWire(pin(headerIdx.buzzer), at(21, L.rowsL[4]), WIRE.buzzer, 2.2);
    addWire(at(24, L.rowsL[2]), at(24, L.gndFront), WIRE.gnd, 0.9);

    const sn = makeSensor(); sn.position.copy(sensPos); reg(sn, 'sensor');
    const stand = box(0.8, 0.9, 0.5, darkGrey); stand.position.set(sensPos.x, sensPos.y - 0.45, sensPos.z - 0.1); stand.userData.noPick = true; rig.add(stand);
    const sc = [0xe53935, 0xb388ff, 0x42a5f5, 0x6b7280]; // VCC, Trig, Echo, GND
    const ai = [8, 7, 6, 5];
    sn.userData.pinX.forEach((x, k) => addWire(new THREE.Vector3(sensPos.x + x, sensPos.y - 0.4, sensPos.z), pin(ai[k]), sc[k], 3.6));
    leds.sensor = sn;
  }

  const wireGroup = new THREE.Group();
  wires.forEach((w) => wireGroup.add(w));
    reg(wireGroup, 'wires');

  const buttonRef = btn;
  const buzzerRef = parts.find((p) => p.cat === 'buzzer')?.obj || null;
  const sensorRef = parts.find((p) => p.cat === 'sensor')?.obj || null;

  rig.traverse((o) => { if (o.isMesh && !o.userData.noPick) { o.castShadow = true; o.receiveShadow = true; } });
  base.receiveShadow = true;

  return { group: rig, parts, leds, button: buttonRef, buzzer: buzzerRef, sensor: sensorRef, hasSensor: v2, depthBack };
}
