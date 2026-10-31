import './style.css';
import { tr, pick, setLang, getLang, onLang } from './i18n.js';
import { components } from './data/components.js';
import { content } from './data/content.js';
import { simulation } from './data/simulation.js';
import { SignalEngine } from './sim/engine.js';
import { mountStreet } from './sim/street.js';
import { audio } from './sim/audio.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const h = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const k in attrs) {
    if (k === 'class') n.className = attrs[k];
    else if (k === 'html') n.innerHTML = attrs[k];
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), attrs[k]);
    else if (attrs[k] !== false && attrs[k] != null) n.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
  }
  kids.flat().forEach((c) => c != null && n.append(c.nodeType ? c : document.createTextNode(c)));
  return n;
};
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ───────── helpers ───────── */
const shortName = (cat) => {
  const n = pick(components[cat].name);
  const m = n.match(/^(.*?)\s*\((.*)\)$/);
  if (!m) return n;
  return getLang() === 'ar' ? m[2] : m[1];
};
const labelFor = (cat, role) => (cat === 'led' && role ? pick(components.led.roles[role].short) : cat === 'warningLed' ? pick(components.warningLed.name).replace(/\s*\(.*\)/, '') : shortName(cat));
const inVersions = (cat) => ['v1', 'v2'].filter((v) => content.versions[v].components.includes(cat));
const isNew = (cat) => content.versions.v2.added.includes(cat);

/* ───────── static content render ───────── */
function list(el, items, cls) {
  el.replaceChildren(...items.map((t) => h('li', cls ? { class: cls } : {}, pick(t))));
}

function renderVersions() {
  const mount = $('#versionsMount');
  const cards = ['v1', 'v2'].map((v) => {
    const d = content.versions[v];
    const parts = d.components.map((cat) => h('li', { class: 'part-row' + (v === 'v2' && isNew(cat) ? ' is-new' : '') },
      h('div', {}, h('b', {}, pick(components[cat].name)), v === 'v2' && isNew(cat) ? h('span', { class: 'badge-new' }, tr('ver.new')) : null),
      h('p', {}, pick(components[cat].function))));
    const hasPins = Object.values(simulation.pins[v]).some((x) => x != null);
    const pinsEl = hasPins
      ? h('table', { class: 'pins' }, h('tbody', {}, Object.entries(simulation.pins[v]).filter(([, p]) => p != null).map(([k, p]) => h('tr', {}, h('th', {}, k), h('td', {}, String(p))))))
      : h('p', { class: 'note' }, tr('ver.pinsTbd'));
    const fig = h('figure', { class: 'diagram' },
      h('button', { type: 'button', class: 'zoom', 'aria-label': pick(d.diagram.alt), onclick: () => openLightbox(d.diagram.src, pick(d.diagram.alt)) },
        h('img', { src: d.diagram.src, alt: pick(d.diagram.alt), loading: 'lazy' })),
      h('figcaption', {}, pick(d.diagram.alt)));
    return h('article', { class: `version-card ${v}`, id: `ver-${v}` },
      h('header', {}, h('span', { class: 'ver-tag' }, d.tag), h('h3', {}, pick(d.name))),
      h('p', { class: 'lead-p' }, pick(d.idea)),
      h('div', { class: 'ver-cols' },
        h('div', {}, h('h4', { class: 'mini-h' }, tr('ver.how')), h('p', {}, pick(d.how)),
          v === 'v2' ? h('div', { class: 'added-box' }, h('h4', { class: 'mini-h' }, tr('ver.added')), h('ul', {}, d.added.map((c) => h('li', {}, pick(components[c].name))))) : null,
          h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: () => openLab(v) }, tr('ver.openLab'))),
        h('div', {}, fig, h('h4', { class: 'mini-h' }, tr('ver.diagram')), pinsEl)),
      h('h4', { class: 'mini-h' }, tr('ver.parts')),
      h('ul', { class: 'part-list' }, parts));
  });
  mount.replaceChildren(...cards);
}

function renderCompare() {
  const t = $('#cmpTable');
  const all = [...new Set([...content.versions.v1.components, ...content.versions.v2.components])];
  const mark = (yes) => h('span', { class: yes ? 'yes' : 'no', 'aria-label': yes ? tr('cmp.has') : tr('cmp.no') }, yes ? '✓' : '—');
  const head = h('thead', {}, h('tr', {}, h('th', {}, tr('cmp.item')), h('th', {}, 'V1'), h('th', {}, 'V2')));
  const rowsParts = all.map((cat) => h('tr', { class: isNew(cat) ? 'is-new' : '' },
    h('th', { scope: 'row' }, pick(components[cat].name), isNew(cat) ? h('span', { class: 'badge-new' }, tr('ver.new')) : null),
    h('td', {}, mark(inVersions(cat).includes('v1'))), h('td', {}, mark(inVersions(cat).includes('v2')))));
  const rowsFn = content.compare.rows.map((r) => h('tr', { class: r.newInV2 ? 'is-new' : '' },
    h('th', { scope: 'row' }, pick(r.label), r.newInV2 ? h('span', { class: 'badge-new' }, tr('ver.new')) : null),
    h('td', {}, pick(r.v1)), h('td', {}, pick(r.v2))));
  t.replaceChildren(head,
    h('tbody', {}, h('tr', { class: 'group' }, h('th', { colspan: 3 }, tr('cmp.parts'))), rowsParts,
      h('tr', { class: 'group' }, h('th', { colspan: 3 }, tr('cmp.features'))), rowsFn),
    h('tfoot', {}, h('tr', {}, h('td', { colspan: 3 }, pick(content.compare.summary)))));
}

function renderJourney() {
  $('#stagesList').replaceChildren(...content.stages.map((s) => h('li', { class: s.placeholder ? 'placeholder' : '' },
    h('b', {}, pick(s.title)), h('p', {}, pick(s.text)), s.date ? h('time', {}, s.date) : null, s.placeholder ? h('span', { class: 'tag-ph' }, tr('placeholder')) : null)));
  const rm = $('#resultsMount');
  rm.replaceChildren(content.results.items.length
    ? h('ul', { class: 'check-list' }, content.results.items.map((r) => h('li', {}, h('b', {}, pick(r.title)), ' ', pick(r.text))))
    : h('div', { class: 'empty' }, h('span', { class: 'tag-ph' }, tr('placeholder')), h('p', {}, pick(content.results.empty))));
  list($('#usesList'), content.uses);
  list($('#futureList'), content.future);
}

function renderGallery() {
  $('#galleryGrid').replaceChildren(...content.gallery.map((g) => {
    const cap = pick(g.caption);
    let media;
    if (g.placeholder || !g.src) media = h('div', { class: 'ph-tile' }, h('span', { class: 'tag-ph' }, tr('placeholder')), h('b', {}, cap));
    else if (g.type === 'video') media = h('video', { src: g.src, controls: true, preload: 'metadata', playsinline: true });
    else media = h('button', { type: 'button', class: 'zoom', onclick: () => openLightbox(g.src, cap) }, h('img', { src: g.src, alt: cap, loading: 'lazy' }));
    return h('figure', { class: 'gal-item' }, media, g.placeholder ? null : h('figcaption', {}, cap));
  }));
}

function renderContact() {
  $('#contactList').replaceChildren(...content.contact.map((c) => h('li', {},
    h('span', {}, pick(c.label)),
    c.value ? (c.href ? h('a', { href: c.href + c.value }, c.value) : h('b', {}, c.value)) : h('i', { class: 'tbd' }, tr('contact.tbd')))));
}

function renderAll() {
  list($('#goalsList'), content.goals);
  $$('#howList').forEach((ol) => ol.replaceChildren(...content.how.map((t) => h('li', {}, pick(t)))));
  renderVersions(); renderCompare(); renderJourney(); renderGallery(); renderContact();
}

/* ───────── lightbox ───────── */
const lb = $('#lightbox');
function openLightbox(src, cap) { $('#lbImg').src = src; $('#lbImg').alt = cap; $('#lbCap').textContent = cap; lb.showModal(); }
$('#lbClose').addEventListener('click', () => lb.close());
lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });

/* ───────── header ───────── */
const topbar = $('#topbar');
addEventListener('scroll', () => topbar.classList.toggle('scrolled', scrollY > 12), { passive: true });
$('#menuBtn').addEventListener('click', () => {
  const open = topbar.classList.toggle('open');
  $('#menuBtn').setAttribute('aria-expanded', open);
});
$('#nav').addEventListener('click', (e) => { if (e.target.closest('a')) { topbar.classList.remove('open'); $('#menuBtn').setAttribute('aria-expanded', 'false'); } });
$('#langBtn').addEventListener('click', () => setLang(getLang() === 'ar' ? 'en' : 'ar'));

/* ───────── lab state ───────── */
let labVer = 'v1';
let viewer = null;
let heroViewer = null;
const engine = new SignalEngine((key) => pushLog(key));
const street = mountStreet($('#street'));
let soundOn = true;
let selection = null;

function setTab(name) {
  $$('#sideTabs button').forEach((b) => b.setAttribute('aria-selected', b.dataset.tab === name));
  $('#paneParts').hidden = name !== 'parts';
  $('#paneSim').hidden = name !== 'sim';
}

function openLab(v, tab) {
  setLabVersion(v);
  if (tab) setTab(tab);
  $('#lab').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
}

function setLabVersion(v) {
  labVer = v;
  $$('#verSeg button').forEach((b) => b.setAttribute('aria-selected', b.dataset.ver === v));
  engine.setVersion(v);
  $('#v2Controls').hidden = v !== 'v2';
  selection = null;
  if (viewer) viewer.setVersion(v);
  renderChips(); renderInfo(); renderSimUI();
}

function renderChips() {
  const wrap = $('#partChips');
  const cats = content.versions[labVer].components;
  wrap.replaceChildren(...cats.map((cat) => {
    const on = viewer ? viewer.isCategoryVisible(cat) : true;
    return h('button', { type: 'button', class: 'chip' + (labVer === 'v2' && isNew(cat) ? ' is-new' : ''), 'aria-pressed': on, onclick: (e) => {
      const next = e.currentTarget.getAttribute('aria-pressed') !== 'true';
      e.currentTarget.setAttribute('aria-pressed', next);
      viewer && viewer.setCategoryVisible(cat, next);
    } }, labelFor(cat, null));
  }));
}

function renderInfo() {
  const box = $('#infoCard');
  if (!selection) { box.className = 'info-card empty'; box.replaceChildren(h('p', {}, tr('lab.pickPart'))); return; }
  const { cat, role } = selection;
  const c = components[cat];
  const vs = inVersions(cat);
  box.className = 'info-card';
  box.replaceChildren(
    h('h4', {}, pick(c.name)),
    role && c.roles ? h('span', { class: `role role-${role}` }, pick(c.roles[role])) : null,
    h('p', {}, h('b', {}, tr('lab.function') + ': '), pick(c.function)),
    h('p', {}, h('b', {}, tr('lab.about') + ': '), pick(c.details)),
    h('div', { class: 'vtags' }, h('span', {}, tr('lab.inVersion')), vs.map((v) => h('em', {}, v.toUpperCase())), isNew(cat) ? h('span', { class: 'badge-new' }, tr('ver.new')) : null));
}

/* tools */
function renderTools() {
  const lab = viewer ? viewer.labelsOn : true;
  $('#tgLabels').textContent = tr(lab ? 'lab.labelsOn' : 'lab.labelsOff'); $('#tgLabels').setAttribute('aria-pressed', lab);
  const spin = viewer ? viewer.isSpinning() : false;
  $('#tgSpin').textContent = tr(spin ? 'lab.spinOn' : 'lab.spinOff'); $('#tgSpin').setAttribute('aria-pressed', spin);
  $('#tgReset').textContent = tr('lab.reset');
  $('#tgSound').textContent = tr(soundOn ? 'sim.soundOn' : 'sim.soundOff'); $('#tgSound').setAttribute('aria-pressed', soundOn);
}
$('#tgLabels').addEventListener('click', () => { if (!viewer) return; viewer.setLabelsVisible(!viewer.labelsOn); renderTools(); });
$('#tgSpin').addEventListener('click', () => { if (!viewer) return; viewer.setSpin(!viewer.isSpinning()); renderTools(); });
$('#tgReset').addEventListener('click', () => viewer && viewer.resetView(true));
$('#tgSound').addEventListener('click', () => { soundOn = !soundOn; audio.setEnabled(soundOn); renderTools(); });

/* ───────── simulation UI ───────── */
const logEl = $('#simLog');
function pushLog(key) {
  const li = h('li', {}, tr(key));
  li.dataset.key = key;
  logEl.prepend(li);
  while (logEl.children.length > 6) logEl.lastChild.remove();
}

function renderSimUI() {
  const running = engine.running;
  $('#simRun').textContent = tr(running ? 'sim.stop' : 'sim.start');
  $('#simRun').classList.toggle('is-stop', running);
  $('#simCross').textContent = tr('sim.cross');
  $('#simCross').disabled = !running;
  $('#distOut').textContent = `${$('#distRange').value} cm`;
  const t = simulation.timings;
  let note = tr('sim.timingNote', { y: t.yellowMs / 1000, c: t.crossingMs / 1000 });
  if (labVer === 'v2') note += tr('sim.thresholdNote', { t: simulation.v2.thresholdCm });
  $('#timingNote').textContent = note;
  renderTools();
}

$('#simRun').addEventListener('click', () => {
  audio.unlock();
  if (engine.running) { engine.stop(); audio.setBuzzer(false); logEl.replaceChildren(); pushLog('log.stopped'); }
  else { logEl.replaceChildren(); engine.start(); }
  renderSimUI(); loopKick();
});
$('#simCross').addEventListener('click', () => { audio.unlock(); engine.requestCross(); });
$('#distRange').min = simulation.v2.minCm; $('#distRange').max = simulation.v2.maxCm; $('#distRange').value = simulation.v2.defaultCm;
$('#distRange').addEventListener('input', (e) => { engine.setDistance(+e.target.value); $('#distOut').textContent = `${e.target.value} cm`; });
engine.setDistance(simulation.v2.defaultCm);

let raf = 0;
function loop(now) {
  const s = engine.update(now);
  const text = tr('sim.' + (s.running ? s.phase : 'idle')) + (s.warning ? ' ' + tr('sim.warn') : '');
  street.update(s, text, now);
  $('#simStatus').textContent = text;
  $('.street-readout').classList.toggle('warn', s.warning);
  if (viewer) viewer.setSignals(s);
  audio.setBuzzer(s.running && s.warning && soundOn);
  const sideVisible = !$('#paneSim').hidden;
  raf = (s.running || sideVisible) ? requestAnimationFrame(loop) : 0;
}
function loopKick() { if (!raf) raf = requestAnimationFrame(loop); }
new MutationObserver(loopKick).observe($('#paneSim'), { attributes: true, attributeFilter: ['hidden'] });

/* ───────── tabs + version switch ───────── */
$$('#verSeg button').forEach((b) => b.addEventListener('click', () => setLabVersion(b.dataset.ver)));
$$('#sideTabs button').forEach((b) => b.addEventListener('click', () => setTab(b.dataset.tab)));
$('#heroRun').addEventListener('click', () => openLab('v2', 'sim'));

/* ───────── 3D (lazy, fails gracefully) ───────── */
const getLabel = (cat, role) => labelFor(cat, role);

async function loadViewerModule() { return (await import('./three/viewer.js')).Viewer; }

function showFallback() {
  const f = $('#viewerFallback');
  f.hidden = false;
  f.textContent = tr('lab.noGL');
}

async function startLabViewer() {
  try {
    const Viewer = await loadViewerModule();
    viewer = new Viewer($('#labViewer'), { version: labVer, getLabel, interactive: true, labels: true, onSelect: (sel) => { selection = sel; renderInfo(); } });
    $('#labViewer').classList.add('ready');
    viewer.setLabelsVisible(true);
    renderChips(); renderTools();
  } catch (err) {
    console.warn('3D viewer unavailable:', err);
    showFallback();
  }
}

async function startHeroViewer() {
  try {
    const Viewer = await loadViewerModule();
    heroViewer = new Viewer($('#heroViewer'), { version: 'v2', interactive: false, labels: false, autoRotate: true, rotateSpeed: 1.1 });
    $('#heroViewer').classList.add('ready');
    const cycle = [['green', 'red', 3200], ['yellow', 'red', 1200], ['red', 'red', 700], ['red', 'green', 3200], ['red', 'red', 600]];
    const total = cycle.reduce((a, c) => a + c[2], 0);
    setInterval(() => {
      let t = performance.now() % total;
      for (const [cars, ped, d] of cycle) { if (t < d) { heroViewer.setSignals({ running: true, cars, ped, warning: false, pressed: false }); break; } t -= d; }
    }, 120);
  } catch (err) {
    console.warn('Hero 3D unavailable:', err);
  }
}

let labStarted = false;
new IntersectionObserver((es, io) => { if (es[0].isIntersecting && !labStarted) { labStarted = true; io.disconnect(); startLabViewer(); } }, { rootMargin: '600px 0px' }).observe($('#lab'));
const idle = window.requestIdleCallback || ((f) => setTimeout(f, 300));
idle(startHeroViewer);

/* ───────── nav highlight ───────── */
const links = $$('#nav a');
const secIO = new IntersectionObserver((es) => es.forEach((e) => {
  if (e.isIntersecting) links.forEach((a) => a.toggleAttribute('aria-current', a.getAttribute('href') === '#' + e.target.id));
}), { rootMargin: '-45% 0px -50% 0px' });
$$('main section[id]').forEach((s) => secIO.observe(s));

/* ───────── language ───────── */
onLang(() => {
  renderAll(); renderChips(); renderInfo(); renderSimUI();
  viewer && viewer.refreshText();
  document.title = tr('brand.name') + ' | Smart Pedestrian Signal';
});
setLang(getLang());
setLabVersion('v1');
setTab('parts');
