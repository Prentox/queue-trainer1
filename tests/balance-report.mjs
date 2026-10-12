// Prints how often each draft rule decides the answer. Run: npm run balance
import { loadEngine } from './load-engine.mjs';
const E = loadEngine();
let n = 0; const share = {}, main = {};
for (const role of E.POS) { let recent = []; for (let i = 0; i < 400; i++) {
  const t = E.draft(role, 1 + (i % 12), [], recent); recent = recent.concat(t.answer).slice(-6); n++;
  new Set(t.why.map(w => w.id)).forEach(id => { share[id] = (share[id] || 0) + 1; });
  if (t.why[0]) main[t.why[0].id] = (main[t.why[0].id] || 0) + 1;
} }
const fmt = o => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${Math.round(100 * v / n)}%`).join(', ');
console.log('In explanation:', fmt(share));
console.log('Main reason:   ', fmt(main));
