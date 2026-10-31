// صوت الجرس عبر Web Audio (بدون ملفات صوت). يبدأ فقط بعد تفاعل المستخدم.
let ctx = null;
let timer = null;
let enabled = true;

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function beep() {
  const c = ensure();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = 'square';
  o.frequency.value = 2400;
  const t = c.currentTime;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.05, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + 0.18);
}

export const audio = {
  unlock() { ensure(); },
  setEnabled(v) { enabled = v; if (!v) this.setBuzzer(false); },
  isEnabled: () => enabled,
  setBuzzer(on) {
    if (on && enabled) {
      if (timer) return;
      beep();
      timer = setInterval(beep, 360);
    } else if (timer) {
      clearInterval(timer);
      timer = null;
    }
  },
};
