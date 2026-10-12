// Engine unit tests: champion data, draft generator, decision generator, balance targets.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from './load-engine.mjs';

const E = loadEngine();
const ROLES = E.POS;

test('champion data is complete and valid', () => {
  const all = E.all();
  assert.ok(all.length >= 160, `expected 160+ champions, got ${all.length}`);
  const names = new Set();
  for (const c of all) {
    assert.ok(!names.has(c.name), `duplicate champion ${c.name}`); names.add(c.name);
    assert.ok(c.pos.length >= 1 && c.pos.every(p => ROLES.includes(p)), `${c.name}: bad positions`);
    assert.ok(c.ad >= 0 && c.ad <= 1, `${c.name}: AD share out of range`);
    assert.ok(['Tank', 'Bruiser', 'Carry', 'Enchanter'].includes(c.cls), `${c.name}: bad class`);
    assert.ok(['Teamfight', 'Split', 'Pick'].includes(c.sty), `${c.name}: bad style`);
    for (const k of ['fr', 'en', 'pe', 'di', 'dp', 'bu', 'wc']) assert.ok(Number.isInteger(c.s[k]) && c.s[k] >= 1 && c.s[k] <= 5, `${c.name}: ${k} must be 1-5`);
    assert.ok([1, 2, 3].includes(c.sc), `${c.name}: scaling must be 1-3`);
  }
  for (const r of ROLES) assert.ok(all.filter(c => c.pos[0] === r).length >= 20, `role ${r} needs 20+ main champions`);
});

test('difficulty rises with level and never exceeds 1', () => {
  assert.equal(E.diff(1), 0);
  for (let L = 2; L < 40; L++) { assert.ok(E.diff(L) > E.diff(L - 1)); assert.ok(E.diff(L) < 1); }
});

test('every draft task is valid and explained', () => {
  for (const role of ROLES) for (const L of [1, 4, 8, 15]) for (let i = 0; i < 60; i++) {
    const t = E.draft(role, L, [], []);
    const names = t.options.map(o => o.name);
    assert.equal(new Set(names).size, names.length, 'options must be unique');
    assert.equal(names.length, L < 4 ? 3 : 4);
    assert.ok(names.includes(t.answer), 'answer must be one of the options');
    assert.ok(t.margin > 0, 'best option must win clearly');
    assert.ok(t.why.length >= 1, 'every task needs an explanation');
    assert.equal(t.allies.length, 4); assert.equal(t.enemy.length, 5);
    assert.ok(!t.allies.some(a => a.pos === role), 'your own role stays open');
    const used = [...t.allies, ...t.enemy].map(x => x.c.name);
    assert.equal(new Set(used.concat(names)).size, used.length + names.length, 'a champion appears only once');
    assert.ok(Array.isArray(t.enemyRead));
  }
});

test('champion pool is respected', () => {
  const pool = ['Orianna', 'Syndra', 'Galio', 'Ahri'];
  for (let i = 0; i < 100; i++) {
    const t = E.draft('mid', 5, pool, []);
    assert.ok(t.fromPool && t.options.every(o => pool.includes(o.name)), 'options must come from the pool');
    assert.ok(t.answer && pool.includes(t.answer));
    const others = [...t.allies, ...t.enemy].map(x => x.c.name);
    assert.ok(!others.some(n => pool.includes(n)), 'pool champions are kept free for you');
  }
});

test('draft balance: no rule dominates, enemy matters, answers vary', () => {
  let n = 0, enemyMain = 0; const share = {};
  for (const role of ROLES) {
    const counts = {}; let recent = [];
    for (let i = 0; i < 200; i++) {
      const t = E.draft(role, 1 + (i % 12), [], recent);
      recent = recent.concat(t.answer).slice(-6); n++;
      counts[t.answer] = (counts[t.answer] || 0) + 1;
      new Set(t.why.map(w => w.id)).forEach(id => { share[id] = (share[id] || 0) + 1; });
      if (t.why[0] && /^(vs|lane)/.test(t.why[0].id)) enemyMain++;
    }
    const top = Math.max(...Object.values(counts)) / 200;
    assert.ok(top <= 0.2, `${role}: one champion is the answer ${Math.round(top * 100)}% of the time`);
  }
  for (const [id, v] of Object.entries(share)) assert.ok(v / n <= 0.45, `rule ${id} appears in ${Math.round(100 * v / n)}% of explanations (max 45%)`);
  assert.ok(enemyMain / n >= 0.35, `the enemy (comp or lane) should be the main reason in 35%+ of drafts, got ${Math.round(100 * enemyMain / n)}%`);
});

test('right answers mix teamfight, split and pick', () => {
  const all = Object.fromEntries(E.all().map(c => [c.name, c]));
  for (const role of ROLES) {
    const st = {}; let recent = [];
    for (let i = 0; i < 300; i++) {
      const t = E.draft(role, 1 + (i % 12), [], recent); recent = recent.concat(t.answer).slice(-6);
      st[all[t.answer].sty] = (st[all[t.answer].sty] || 0) + 1;
    }
    const top = Math.max(...Object.values(st)) / 300;
    assert.ok(Object.keys(st).length >= 2, `${role}: only one play style ever wins`);
    assert.ok(top <= 0.7, `${role}: one play style wins ${Math.round(top * 100)}% of drafts (max 70%)`);
  }
});

test('lane matchups (counterpicks) show up for laners', () => {
  let n = 0, lane = 0;
  for (const role of ['top', 'mid', 'adc']) for (let i = 0; i < 200; i++) {
    const t = E.draft(role, 1 + (i % 12), [], []); n++;
    if (t.why.some(w => w.id.startsWith('lane'))) lane++;
  }
  assert.ok(lane / n >= 0.3, `lane matchup explains only ${Math.round(100 * lane / n)}% of laner drafts (min 30%)`);
});

test('a champion pool rotates between its champions', () => {
  const pool = ['Ahri', 'Syndra', 'Zed', 'Yasuo', 'Orianna', 'Galio'];
  const counts = {}; let recent = [];
  for (let i = 0; i < 300; i++) {
    const t = E.draft('mid', 1 + (i % 12), pool, recent); recent = recent.concat(t.answer).slice(-6);
    counts[t.answer] = (counts[t.answer] || 0) + 1;
  }
  const top = Math.max(...Object.values(counts)) / 300;
  assert.ok(top <= 0.4, `one pool champion is the answer ${Math.round(top * 100)}% of the time (max 40%)`);
});

test('every decision task is valid and explained', () => {
  for (const L of [1, 3, 8, 15]) for (let i = 0; i < 200; i++) {
    const d = E.decision(L, ROLES[i % 5]);
    assert.ok(d, 'generator must always return a task');
    const ids = d.options.map(o => o.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.equal(ids.length, L < 3 ? 3 : 4);
    assert.ok(ids.includes(d.answer));
    assert.ok(d.margin > 0);
    assert.ok(d.why.length >= 1);
    assert.match(d.conclusion, /probably|least|lasting/, 'every decision ends with a conclusion');
    assert.ok(!d.why.some(w => /^(Take|Ward|Group|Fall back|Recall|Clear|Split|Farm)\b/.test(w)), 'reasons state facts, not orders');
    if (!d.state.objUp) assert.ok(!ids.includes('take'), 'cannot offer to start an objective that is not up');
  }
});

test('decisions depend on the champions, not only on numbers and timers', () => {
  for (const role of ROLES) {
    const counts = {}; let recent = [], champ = 0;
    for (let i = 0; i < 300; i++) {
      const d = E.decision(1 + (i % 15), role, recent); recent = recent.concat(d.answer).slice(-4);
      counts[d.answer] = (counts[d.answer] || 0) + 1;
      const s = d.state, names = [...s.allies, ...s.enemies].map(x => x.c.name);
      if (d.why.some(w => names.some(n => w.includes(n)) || /stronger 5v5|scales better|squishy/.test(w))) champ++;
      if (d.answer === 'split') assert.equal(s.you.sty, 'Split', `split push answer for ${s.you.name}, who is not a split pusher`);
      if (d.answer === 'picks') assert.ok(s.you.sty === 'Pick' || s.allies.filter(x => x.alive && x.c.sty === 'Pick').length >= 2, 'picks answer needs pick champions');
      assert.equal(s.allies.find(x => x.pos === role).alive, true, 'you are always alive');
    }
    const top = Math.max(...Object.values(counts)) / 300;
    assert.ok(top <= 0.3, `${role}: one action is the answer ${Math.round(top * 100)}% of the time (max 30%)`);
    assert.ok(champ / 300 >= 0.5, `${role}: only ${Math.round(100 * champ / 300)}% of explanations use the champions (min 50%)`);
  }
});

test('team counts never exceed 5 and match the 4+ rule', () => {
  for (const role of ROLES) for (let i = 0; i < 100; i++) {
    const t = E.draft(role, 1 + (i % 12), [], []);
    for (const [S, team] of [[t.before, t.allies.map(x => x.c)], [t.enemyStats, t.enemy.map(x => x.c)]]) {
      for (const k of ['nFr', 'nEn', 'nPe', 'nDi', 'nWc']) assert.ok(S[k] >= 0 && S[k] <= team.length, `${k} = ${S[k]} for ${team.length} champions`);
      assert.equal(S.nFr, team.filter(c => c.s.fr >= 4).length, 'frontliners = champions scoring 4+');
    }
  }
});

test('a pool can include champions from other roles; 2 champions get one random extra option', () => {
  const extras = new Set();
  for (let i = 0; i < 50; i++) {
    const t = E.draft('top', 3 + (i % 10), ['Galio', 'Garen'], []);
    const names = t.options.map(o => o.name);
    assert.equal(names.length, 3, 'two pool champions + one random');
    assert.ok(names.includes('Galio') && names.includes('Garen'));
    extras.add(names.find(n => n !== 'Galio' && n !== 'Garen'));
  }
  assert.ok(extras.size > 5, 'the third option changes each time');
  for (let i = 0; i < 30; i++) {
    const t = E.draft('top', 3, ['Garen'], []);
    assert.ok(t.options.some(o => o.name === 'Garen'), 'a one-champion pool is always an option');
  }
});

test('in Decision making you play a champion from your pool', () => {
  const pool = ['Riven', 'Fiora', 'Ornn'];
  for (let i = 0; i < 150; i++) {
    const d = E.decision(1 + (i % 12), 'top', [], pool);
    assert.ok(pool.includes(d.state.you.name), `you were ${d.state.you.name}`);
    const others = [...d.state.allies.filter(x => x.pos !== 'top'), ...d.state.enemies].map(x => x.c.name);
    assert.ok(!others.includes(d.state.you.name));
  }
});
