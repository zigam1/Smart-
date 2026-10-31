import { ui } from './data/ui.js';

let lang = localStorage.getItem('sps-lang') || ((navigator.language || 'ar').startsWith('ar') ? 'ar' : 'en');
const listeners = new Set();

export const getLang = () => lang;
export const pick = (obj) => (obj && typeof obj === 'object' ? (obj[lang] ?? obj.ar ?? '') : obj ?? '');
export const tr = (key, vars) => {
  let s = pick(ui[key]) || key;
  if (vars) for (const k in vars) s = s.replaceAll(`{${k}}`, vars[k]);
  return s;
};
export const onLang = (fn) => listeners.add(fn);

export function setLang(next) {
  lang = next;
  try { localStorage.setItem('sps-lang', lang); } catch {}
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = tr(el.dataset.i18n); });
  const btn = document.getElementById('langBtn');
  if (btn) btn.textContent = lang === 'ar' ? 'EN' : 'عربي';
  listeners.forEach((fn) => fn(lang));
}
