// مشهد الشارع المبسط (SVG): إشارة السيارات، إشارة المشاة، مشاة، مركبة، مستشعر V2.
import { simulation } from '../data/simulation.js';

const NS = 'http://www.w3.org/2000/svg';
const C = { red: '#ff5a4f', yellow: '#ffc247', green: '#38e08a', off: '#2a3a31' };

export function mountStreet(root) {
  root.innerHTML = `
  <svg viewBox="0 0 400 250" role="img" aria-label="street" class="street-svg">
    <rect width="400" height="250" fill="#0f1a15"/>
    <rect y="0" width="400" height="92" fill="#16261e"/>
    <rect y="170" width="400" height="80" fill="#16261e"/>
    <rect y="92" width="400" height="78" fill="#1d2a24"/>
    <path d="M0 131 H400" stroke="#8fa876" stroke-opacity=".55" stroke-width="2" stroke-dasharray="14 12"/>
    <g id="zebra" fill="#e8efe0" fill-opacity=".85"></g>
    <!-- car signal (left of crosswalk) -->
    <g transform="translate(142 22)">
      <rect x="-9" y="62" width="4" height="8" fill="#2a3a31"/>
      <rect x="-14" y="-6" width="28" height="74" rx="8" fill="#0c1511" stroke="#3a5646" stroke-width="1.5"/>
      <circle id="cR" cx="0" cy="8" r="7.5"/><circle id="cY" cx="0" cy="28" r="7.5"/><circle id="cG" cx="0" cy="48" r="7.5"/>
    </g>
    <!-- ped signal + button (right of crosswalk) -->
    <g transform="translate(262 30)">
      <rect x="-13" y="-6" width="26" height="46" rx="8" fill="#0c1511" stroke="#3a5646" stroke-width="1.5"/>
      <circle id="pR" cx="0" cy="8" r="7"/><circle id="pG" cx="0" cy="26" r="7"/>
      <rect x="-9" y="46" width="18" height="18" rx="5" fill="#0c1511" stroke="#3a5646" stroke-width="1.5"/>
      <circle id="btn" cx="0" cy="55" r="5.5" fill="#2fbf71"/>
    </g>
    <!-- pedestrian -->
    <g id="ped">
      <circle cx="0" cy="-9" r="4.2" fill="#e8efe0"/>
      <path d="M0 -4 V9 M-6 0 H6 M0 9 L-5 19 M0 9 L5 19" stroke="#e8efe0" stroke-width="2.6" stroke-linecap="round" fill="none"/>
    </g>
    <!-- car -->
    <g id="car">
      <rect x="-24" y="-9" width="48" height="16" rx="5" fill="#cfd8cc"/>
      <path d="M-13 -9 l5 -8 h16 l5 8z" fill="#9fb3a4"/>
      <circle cx="-13" cy="8" r="4.5" fill="#0c1511" stroke="#e8efe0" stroke-width="1.2"/><circle cx="13" cy="8" r="4.5" fill="#0c1511" stroke="#e8efe0" stroke-width="1.2"/>
    </g>
    <!-- V2 sensor + beacon -->
    <g id="v2gear" transform="translate(318 206)">
      <path id="beam" d="M-20 -6 L-90 -50" stroke="#4fc3f7" stroke-width="1.4" stroke-dasharray="5 5" opacity="0"/>
      <rect x="-20" y="-12" width="40" height="16" rx="3" fill="#0b62ad"/>
      <circle cx="-9" cy="-4" r="5" fill="#cfd3d8"/><circle cx="9" cy="-4" r="5" fill="#cfd3d8"/>
      <circle id="beacon" cx="34" cy="-4" r="6" fill="#2a3a31"/>
      <g id="sound" opacity="0" stroke="#ffc247" stroke-width="1.6" fill="none"><path d="M44 -10 q6 6 0 12"/><path d="M50 -14 q10 10 0 20"/></g>
    </g>
  </svg>
  <div class="street-readout"><span id="phaseText"></span><b id="countdown"></b></div>`;

  const z = root.querySelector('#zebra');
  for (let i = 0; i < 9; i++) {
    const r = document.createElementNS(NS, 'rect');
    r.setAttribute('x', 174 + i * 6.8); r.setAttribute('y', 94); r.setAttribute('width', 4); r.setAttribute('height', 74); r.setAttribute('rx', 1);
    z.appendChild(r);
  }
  const q = (id) => root.querySelector(id);
  const el = { cR: q('#cR'), cY: q('#cY'), cG: q('#cG'), pR: q('#pR'), pG: q('#pG'), ped: q('#ped'), car: q('#car'), beam: q('#beam'), beacon: q('#beacon'), sound: q('#sound'), btn: q('#btn'), v2: q('#v2gear'), phase: q('#phaseText'), count: q('#countdown') };
  const dim = (node, c, on) => { node.setAttribute('fill', on ? c : C.off); node.style.filter = on ? `drop-shadow(0 0 5px ${c})` : 'none'; };
  const { minCm, maxCm } = simulation.v2;
  let lastPhase = '';
  let walk = 0;

  return {
    // text: phase sentence; s: engine snapshot; time: ms
    update(s, text, time) {
      dim(el.cR, C.red, s.cars === 'red'); dim(el.cY, C.yellow, s.cars === 'yellow'); dim(el.cG, C.green, s.cars === 'green');
      dim(el.pR, C.red, s.ped === 'red'); dim(el.pG, C.green, s.ped === 'green');
      el.btn.setAttribute('fill', s.pressed ? '#ffffff' : '#2fbf71');
      el.v2.style.display = s.version === 'v2' ? '' : 'none';

      // pedestrian: waits on the top kerb, walks across during green, resets after
      if (s.phase === 'ped_green') walk = Math.min(1, s.progress * 1.05);
      else if (s.phase !== lastPhase && s.phase === 'cars_green') walk = 0;
      lastPhase = s.phase;
      el.ped.setAttribute('transform', `translate(200 ${72 + walk * 120})`);

      // car: distance maps to x (sensor at the crosswalk, car approaches from the left lane)
      const d = Math.max(minCm, Math.min(maxCm, s.distance));
      const x = 200 - 14 - ((d - minCm) / (maxCm - minCm)) * 170;
      el.car.setAttribute('transform', `translate(${x} 152)`);

      if (s.version === 'v2') {
        const sensing = s.running;
        el.beam.setAttribute('opacity', sensing ? '0.8' : '0');
        el.beam.setAttribute('d', `M-22 -4 L${x + 26 - 318} ${152 - 206}`);
        const flash = s.warning && Math.floor(time / 110) % 2 === 0;
        el.beacon.setAttribute('fill', flash ? '#ff8a00' : C.off);
        el.beacon.style.filter = flash ? 'drop-shadow(0 0 7px #ff8a00)' : 'none';
        el.sound.setAttribute('opacity', s.warning ? (Math.floor(time / 180) % 2 ? '1' : '0.25') : '0');
      }
      el.phase.textContent = text;
      el.count.textContent = s.running && s.remaining ? `${(s.remaining / 1000).toFixed(1)}s` : '';
    },
  };
}
