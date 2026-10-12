// Analysis of collected matches. Everything here works on the anonymous records from compact.mjs.
// Output is aggregate numbers only (no match IDs, no players).

const POS_MAP = { TOP: 'top', JUNGLE: 'jungle', MIDDLE: 'mid', BOTTOM: 'adc', UTILITY: 'support' };
const norm = s => s.toLowerCase().replace(/[^a-z]/g, '');
const ALIAS = { monkeyking: 'wukong', nunu: 'nunuwillump', renata: 'renataglasc' };

export function championIndex(E) {
  const byKey = {};
  for (const c of E.all()) byKey[norm(c.name)] = c;
  return name => byKey[ALIAS[norm(name)] || norm(name)] || null;
}

const rate = (w, n) => n ? +(w / n).toFixed(3) : null;
function bucket() { return { n: 0, w: 0 }; }
function addB(b, win) { b.n++; if (win) b.w++; }
const show = b => ({ games: b.n, winRate: rate(b.w, b.n) });

/* 1. Champion values measured from the games, compared with champions.txt */
export function championStats(matches, find) {
  const acc = {};
  for (const m of matches) {
    const mins = m.dur / 60;
    for (const p of m.p) {
      const c = find(p.ch); if (!c) continue;
      const a = acc[c.name] || (acc[c.name] = { n: 0, w: 0, phys: 0, magic: 0, tank: 0, cc: 0, help: 0, dmg: 0, obj: 0, pos: {} });
      a.n++; if (p.t === m.win) a.w++;
      a.phys += p.phys; a.magic += p.magic;
      a.tank += (p.taken + p.mitig) / mins; a.cc += p.cc / mins; a.help += (p.heal + p.shield) / mins; a.dmg += (p.phys + p.magic + p.tru) / mins; a.obj += (p.obj || 0) / mins;
      const pos = POS_MAP[p.pos]; if (pos) a.pos[pos] = (a.pos[pos] || 0) + 1;
    }
  }
  const out = {};
  for (const [name, a] of Object.entries(acc)) {
    out[name] = {
      games: a.n, winRate: rate(a.w, a.n),
      adShare: +(a.phys / Math.max(1, a.phys + a.magic)).toFixed(2),
      tankPerMin: Math.round(a.tank / a.n), ccPerMin: +(a.cc / a.n).toFixed(2),
      helpPerMin: Math.round(a.help / a.n), damagePerMin: Math.round(a.dmg / a.n), objectivePerMin: Math.round(a.obj / a.n),
      positions: a.pos
    };
  }
  return out;
}

/* Percentile -> 0..3 among champions with enough games, then list where the data disagrees with champions.txt */
export function suggestions(E, stats, minGames = 30) {
  const rows = Object.entries(stats).filter(([, s]) => s.games >= minGames);
  const grade = key => {
    const vals = rows.map(([, s]) => s[key]).sort((a, b) => a - b);
    const q = p => vals[Math.floor(p * (vals.length - 1))];
    const cut = [q(0.2), q(0.4), q(0.6), q(0.8)];
    return v => v <= cut[0] ? 1 : v <= cut[1] ? 2 : v <= cut[2] ? 3 : v <= cut[3] ? 4 : 5;
  };
  const gTank = rows.length ? grade('tankPerMin') : () => 1, gCc = rows.length ? grade('ccPerMin') : () => 1, gDmg = rows.length ? grade('damagePerMin') : () => 1;
  const out = [];
  for (const [name, s] of rows) {
    const c = E.all().find(x => x.name === name);
    const notes = [];
    if (Math.abs(c.ad - s.adShare) >= 0.25) notes.push({ field: 'AD share', ours: c.ad, data: s.adShare });
    if (Math.abs(c.s.fr - gTank(s.tankPerMin)) >= 2) notes.push({ field: 'frontline', ours: c.s.fr, data: gTank(s.tankPerMin) });
    if (Math.abs(Math.max(c.s.en, c.s.pe) - gCc(s.ccPerMin)) >= 2) notes.push({ field: 'engage/peel (CC)', ours: Math.max(c.s.en, c.s.pe), data: gCc(s.ccPerMin) });
    if (Math.abs(Math.max(c.s.dp, c.s.bu) - gDmg(s.damagePerMin)) >= 2 && c.cls !== 'Enchanter') notes.push({ field: 'damage', ours: Math.max(c.s.dp, c.s.bu), data: gDmg(s.damagePerMin) });
    if (notes.length) out.push({ name, games: s.games, notes });
  }
  return out.sort((a, b) => b.notes.length - a.notes.length || b.games - a.games);
}

/* 2. Do the Draft rules match what wins? Win rate when each team-level condition is true vs false. */
export function compRules(E, matches, find) {
  const R = {}; const add = (id, label, cond, win) => { if (cond === null) return; const r = R[id] || (R[id] = { label, yes: bucket(), no: bucket() }); addB(cond ? r.yes : r.no, win); };
  for (const m of matches) {
    const teams = [100, 200].map(t => ({ t, ch: m.p.filter(p => p.t === t).map(p => find(p.ch)).filter(Boolean) }));
    if (teams.some(x => x.ch.length !== 5)) continue;
    const S = teams.map(x => E.stats(x.ch));
    for (let i = 0; i < 2; i++) {
      const T = S[i], F = S[1 - i], win = teams[i].t === m.win;
      add('front', '2+ frontliners', T.nFr >= 2, win);
      add('engage', '2+ engage champions', T.nEn >= 2, win);
      add('mix', 'Magic damage 20-80%', T.apShare >= 0.2 && T.apShare <= 0.8, win);
      add('threat', 'At least one top-damage champion', T.threat >= 1, win);
      add('peel', 'Late carry with a peeler (teams with a late carry)', T.late > 0 ? T.nPe >= 1 : null, win);
      add('split', 'Fewer than 2 split pushers', T.split < 2, win);
      add('plan', '4+ champions share one plan (teamfight or pick)', Math.max(T.tf, T.pk) >= 4, win);
      if (F.nEn >= 3) add('vsEng', 'vs heavy engage: 2+ peel/disengage champions', T.nPe + T.nDi >= 2, win);
      if (F.nFr >= 3) add('vsTank', 'vs tanky team: 2+ sustained-damage carries', T.nDp >= 2, win);
      if (F.split >= 2) add('vsSplit', 'vs split pushers: 3+ waveclear champions', T.nWc >= 3, win);
      if (F.nFr === 0) add('vsSquishy', 'vs squishy team: 3+ engage/burst champions', T.nEn + T.nBu >= 3, win);
      if (F.tf >= 4) add('vsTF', 'vs teamfight comp: disengage or a split pusher', T.nDi + T.split >= 2, win);
    }
  }
  // "peel" uses null for teams without a late carry: drop those
  return Object.fromEntries(Object.entries(R).map(([k, r]) => [k, { rule: r.label, when: show(r.yes), otherwise: show(r.no), difference: r.yes.n && r.no.n ? +(rate(r.yes.w, r.yes.n) - rate(r.no.w, r.no.n)).toFixed(3) : null }]));
}

/* 3. Lane matchups: same position, champion vs champion, plus the type-level lane rules */
export function lanes(E, matches, find, minGames = 10) {
  const pairs = {}, rules = {};
  for (const m of matches) {
    for (const pos of ['TOP', 'MIDDLE', 'BOTTOM']) {
      const a = m.p.find(p => p.t === 100 && p.pos === pos), b = m.p.find(p => p.t === 200 && p.pos === pos);
      if (!a || !b) continue;
      const ca = find(a.ch), cb = find(b.ch); if (!ca || !cb) continue;
      for (const [x, y, px] of [[ca, cb, a], [cb, ca, b]]) {
        const key = `${POS_MAP[pos]}|${x.name}|${y.name}`;
        const k = pairs[key] || (pairs[key] = bucket()); addB(k, px.t === m.win);
        for (const r of E.LANE_RULES) { const v = r.f(x, y); if (v) { const rr = rules[r.id] || (rules[r.id] = bucket()); addB(rr, px.t === m.win); } }
      }
    }
  }
  const matchups = Object.entries(pairs).filter(([, b]) => b.n >= minGames).map(([k, b]) => { const [pos, a, c] = k.split('|'); return { pos, champion: a, versus: c, ...show(b) }; });
  return { matchups, typeRules: Object.fromEntries(Object.entries(rules).map(([k, b]) => [k, show(b)])) };
}

/* 4. Situations for Decision making: after a kill leaves one team 2+ players up, what happened in the next 90 s? */
const BRW = [6, 6, 8, 8, 10, 12, 16, 21, 26, 32.5, 35, 37.5, 40, 42.5, 45, 47.5, 50, 52.5];
const deathTimer = (lvl, t) => BRW[Math.min(17, Math.max(0, lvl - 1))] * (1 + Math.min(0.5, Math.max(0, (t / 60 - 15) * 0.0425)));
export function situations(matches) {
  const B = {};
  const key = (adv, obj) => `${Math.min(adv, 4)}|${obj}`;
  for (const m of matches) {
    const dead = Array(11).fill(0); // participant -> time they are back (seconds)
    let dragonAt = 300, baronAt = 1200;
    const lvlAt = (pid, t) => { const f = m.f[Math.min(m.f.length - 1, Math.floor(t / 60))]; return f ? f.lvl[pid - 1] : 10; };
    const ev = m.e.slice().sort((a, b) => a[0] - b[0]);
    for (let i = 0; i < ev.length; i++) {
      const e = ev[i], t = e[0];
      if (e[1] === 'M') { if (e[3] === 'DRAGON') dragonAt = t + 300; if (e[3] === 'BARON_NASHOR') baronAt = t + 360; continue; }
      if (e[1] !== 'K') continue;
      dead[e[3]] = t + deathTimer(lvlAt(e[3], t), t);
      const alive = team => [1, 2, 3, 4, 5].map(i => team === 100 ? i : i + 5).filter(pid => dead[pid] <= t).length;
      const a100 = alive(100), a200 = alive(200);
      const adv = Math.abs(a100 - a200); if (adv < 2) continue;
      const up = a100 > a200 ? 100 : 200;
      const obj = t >= baronAt && t >= 1200 ? 'baron' : t >= dragonAt ? 'dragon' : 'none';
      const win = ev.slice(i + 1).filter(x => x[0] <= t + 90);
      const b = B[key(adv, obj)] || (B[key(adv, obj)] = { n: 0, objective: 0, tower: 0, lostPlayer: 0, won: 0 });
      b.n++;
      if (win.some(x => x[1] === 'M' && x[2] === up && (x[3] === 'DRAGON' || x[3] === 'BARON_NASHOR'))) b.objective++;
      if (win.some(x => x[1] === 'B' && x[2] !== up)) b.tower++;
      if (win.some(x => x[1] === 'K' && (up === 100 ? x[3] <= 5 : x[3] > 5))) b.lostPlayer++;
      if (m.win === up) b.won++;
    }
  }
  return Object.entries(B).map(([k, b]) => { const [adv, obj] = k.split('|'); return {
    playersUp: adv === '4' ? '4+' : +adv, objectiveUp: obj, moments: b.n,
    tookObjectiveWithin90s: rate(b.objective, b.n), tookTowerWithin90s: rate(b.tower, b.n), lostAPlayerWithin90s: rate(b.lostPlayer, b.n), wonTheGame: rate(b.won, b.n) }; })
    .sort((a, b) => String(a.playersUp).localeCompare(String(b.playersUp)) || a.objectiveUp.localeCompare(b.objectiveUp));
}

export function report({ n, patches, champStats, sugg, comp, lane, sit, unknown }) {
  const pct = x => x == null ? '–' : Math.round(x * 100) + '%';
  const L = [];
  L.push(`# Match data report`, ``, `${n} EUW Challenger/Grandmaster solo-queue matches · patches ${patches.join(', ')}.`, ``);
  if (unknown.length) L.push(`Champions in the data that are missing from champions.txt: ${unknown.join(', ')}.`, ``);
  L.push(`## Draft rules vs real results`, ``, `| Rule | Win rate when true | Win rate otherwise | Difference | Games (true / otherwise) |`, `| --- | --- | --- | --- | --- |`);
  for (const r of Object.values(comp)) L.push(`| ${r.rule} | ${pct(r.when.winRate)} | ${pct(r.otherwise.winRate)} | ${r.difference == null ? '–' : (r.difference > 0 ? '+' : '') + Math.round(r.difference * 1000) / 10 + ' pts'} | ${r.when.games} / ${r.otherwise.games} |`);
  L.push(``, `## Lane rules vs real results`, ``, `| Lane rule | Win rate when it applies | Games |`, `| --- | --- | --- |`);
  for (const [k, v] of Object.entries(lane.typeRules)) L.push(`| ${k} | ${pct(v.winRate)} | ${v.games} |`);
  L.push(``, `Champion-vs-champion matchups with 10+ games: ${lane.matchups.length}.`, ``);
  L.push(`## After a kill leaves a team 2+ players up (next 90 s)`, ``, `| Players up | Objective up | Moments | Took objective | Took tower | Lost a player | Won the game |`, `| --- | --- | --- | --- | --- | --- | --- |`);
  for (const s of sit) L.push(`| ${s.playersUp} | ${s.objectiveUp} | ${s.moments} | ${pct(s.tookObjectiveWithin90s)} | ${pct(s.tookTowerWithin90s)} | ${pct(s.lostAPlayerWithin90s)} | ${pct(s.wonTheGame)} |`);
  L.push(``, `## champions.txt values the data disagrees with`, ``, `Measured from damage, damage taken, crowd control and healing per minute, graded 1-5 against all champions (5 = top 20%). Review before changing anything: the data measures what champions do, not always what they are for.`, ``, `| Champion | Games | Field | Ours | Data |`, `| --- | --- | --- | --- | --- |`);
  for (const s of sugg.slice(0, 60)) for (const x of s.notes) L.push(`| ${s.name} | ${s.games} | ${x.field} | ${x.ours} | ${x.data} |`);
  return L.join('\n') + '\n';
}
