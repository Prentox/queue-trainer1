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

/* 5. Decision check: real moments from the games, what the team did in the next 90 s, and how it went.
   A moment is described the way the app describes one: players up or down, objective up / spawning soon / not,
   and gold. The action is read from events and positions (positions only exist once a minute, so split
   and grouping are estimates). The result is the team's gold swing over the next 2 minutes.
   The same moment is then given to the engine, so the report can show how often the engine's answer was
   what worked, and the app can use the best measured action as the answer where there is enough data. */
export const MEASURED = ['take', 'setup', 'trade', 'push', 'defend', 'recall', 'split', 'picks'];
const FOUNTAIN = { 100: [560, 560], 200: [14300, 14300] }, PIT = { Dragon: [9866, 4414], Baron: [5007, 10471] };
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const sideLane = p => (p[0] < 3500 && p[1] > 5000) || (p[1] > 11500 && p[0] < 10000) || (p[1] < 3500 && p[0] > 5000) || (p[0] > 11500 && p[1] < 10000);
export const decisionKey = (adv, obj, gold) => `${adv >= 2 ? 'up' : adv <= -2 ? 'down' : 'even'}|${obj}|${gold >= 1500 ? 'ahead' : gold <= -1500 ? 'behind' : 'even'}`;

export function decisionMoments(E, matches, find) {
  const out = [];
  for (const m of matches) {
    if (!m.f || m.f.length < 12) continue;
    const champ = m.p.map(p => find(p.ch)), pos = m.p.map(p => POS_MAP[p.pos]);
    if (champ.some(c => !c) || pos.some(x => !x)) continue;
    const major = parseInt(m.v, 10) || 0, baronFirst = major >= 15 ? 1500 : 1200;
    const hasWards = m.e.some(e => e[1] === 'W'), hasBuys = m.e.some(e => e[1] === 'I');
    const ev = m.e.slice().sort((a, b) => a[0] - b[0]);
    const end = m.dur - 130;
    const teamGold = (team, t) => {
      const i = Math.min(m.f.length - 2, Math.floor(t / 60)), a = m.f[i], b = m.f[i + 1], k = Math.min(1, Math.max(0, t / 60 - i));
      const sum = f => f.gold.reduce((s, g, j) => s + (m.p[j].t === team ? g : 0), 0);
      return sum(a) + (sum(b) - sum(a)) * k;
    };
    const frameAfter = t => m.f.find(f => f.m * 60 > t + 15 && f.m * 60 <= t + 75);
    const lvlAt = (pid, t) => { const f = m.f[Math.min(m.f.length - 1, Math.floor(t / 60))]; return f ? f.lvl[pid - 1] : 10; };
    /* candidate times: every kill, 60 s before and at every objective spawn, and once a minute from 10:00 */
    const dead = Array(11).fill(0);
    let dragonAt = 300, baronAt = baronFirst;
    const marks = new Set();
    for (let t = 600; t < end; t += 60) marks.add(t);
    const stream = ev.map(e => ({ t: e[0], e })).concat([...marks].map(t => ({ t, e: null }))).sort((a, b) => a.t - b.t || (a.e ? -1 : 1));
    const lastAt = { 100: -999, 200: -999 };
    for (let i = 0; i < stream.length; i++) {
      const { t, e } = stream[i];
      if (e && e[1] === 'M') { if (e[3] === 'DRAGON') dragonAt = t + 300; if (e[3] === 'BARON_NASHOR') baronAt = t + 360; continue; }
      if (e && e[1] === 'K') dead[e[3]] = t + deathTimer(lvlAt(e[3], t), t);
      if (e && e[1] !== 'K') continue;
      if (e && stream.slice(i + 1).some(x => x.e && x.e[1] === 'K' && x.t - t <= 10)) continue; // read the fight once it is over
      if (t < 480 || t > end) continue;
      const soonD = dragonAt - t, soonB = baronAt - t;
      const objName = t >= baronAt ? 'Baron' : t >= dragonAt ? 'Dragon' : soonB > 0 && soonB <= 60 ? 'Baron' : soonD > 0 && soonD <= 60 ? 'Dragon' : null;
      const objState = !objName ? 'none' : t >= (objName === 'Baron' ? baronAt : dragonAt) ? 'up' : 'soon';
      const nextObj = objName || (soonB > 0 && soonB < soonD ? 'Baron' : 'Dragon');
      for (const T of [100, 200]) {
        if (!e && t - lastAt[T] < 30) continue; // a fight always counts; the once-a-minute check skips if a fight was just read
        lastAt[T] = t;
        const O = T === 100 ? 200 : 100, mine = pid => (pid <= 5) === (T === 100);
        const ids = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const aliveT = ids.filter(p => mine(p) && dead[p] <= t), aliveO = ids.filter(p => !mine(p) && dead[p] <= t);
        const adv = aliveT.length - aliveO.length;
        const g0 = teamGold(T, t) - teamGold(O, t), g1 = teamGold(T, t + 120) - teamGold(O, t + 120);
        const win = ev.filter(x => x[0] > t && x[0] <= t + 90);
        const objKill = x => x[1] === 'M' && (x[3] === 'DRAGON' || x[3] === 'BARON_NASHOR');
        const tookObj = win.some(x => objKill(x) && x[2] === T), lostObj = win.some(x => objKill(x) && x[2] === O);
        const tookTower = win.some(x => x[1] === 'B' && x[2] === O), lostPlayer = win.some(x => x[1] === 'K' && mine(x[3]));
        const killed = win.some(x => x[1] === 'K' && !mine(x[3]));
        const fr = frameAfter(t), P = fr ? fr.pos : null;
        const at = pid => P && P[pid - 1];
        const near = (pt, r) => aliveT.filter(pid => at(pid) && dist(at(pid), pt) <= r).length;
        /* Actions are read from where the team IS (intent), never from whether it worked:
           success (objective, tower, deaths) is the outcome we compare afterwards. */
        let action = null, splitter = null;
        const pts = aliveT.filter(pid => at(pid)).map(pid => [pid, at(pid)]);
        let group = [];
        for (const [, p] of pts) { const g = pts.filter(([, q]) => dist(p, q) <= 3000); if (g.length > group.length) group = g; }
        const gc = group.length ? [group.reduce((a, [, p]) => a + p[0], 0) / group.length, group.reduce((a, [, p]) => a + p[1], 0) / group.length] : null;
        const enemyHalf = p => T === 100 ? p[0] + p[1] > 15800 : p[0] + p[1] < 13800;
        const grouped = group.length >= 3;
        if (P && objState !== 'none' && near(PIT[objName], 3500) >= 3) action = objState === 'up' ? 'take' : 'setup';
        else if (P && objState !== 'none' && grouped && enemyHalf(gc) && dist(gc, PIT[objName]) > 6000) action = 'trade';
        else if (hasBuys ? new Set(win.filter(x => x[1] === 'I' && mine(x[2])).map(x => x[2])).size >= 3 : P && near(FOUNTAIN[T], 2500) >= 3) action = 'recall';
        else if (P && aliveT.length >= 4) {
          for (const pid of aliveT) {
            const me = at(pid); if (!me || !sideLane(me)) continue;
            const rest = aliveT.filter(x => x !== pid && at(x)).map(at); if (rest.length < 3) continue;
            const c = [rest.reduce((s, p) => s + p[0], 0) / rest.length, rest.reduce((s, p) => s + p[1], 0) / rest.length];
            if (dist(me, c) > 5000) { action = 'split'; splitter = pid; break; }
          }
        }
        if (!action && grouped && enemyHalf(gc)) action = 'push';
        if (!action && hasWards && !grouped && win.filter(x => x[1] === 'W' && mine(x[2])).length >= 3 && pts.filter(([, p]) => enemyHalf(p)).length >= 2) action = 'picks';
        if (!action && P && near(FOUNTAIN[T], 6500) >= 3) action = 'defend';
        if (!action) continue;
        /* the same moment as the app would show it, for the engine */
        const deadSecs = (adv >= 0 ? ids.filter(p => !mine(p)) : ids.filter(p => mine(p))).map(p => dead[p] - t).filter(s => s > 0);
        const team = own => ids.filter(p => mine(p) === own).map(p => ({ pos: pos[p - 1], c: champ[p - 1], alive: dead[p] <= t }));
        const allies = team(true), enemies = team(false);
        const youId = splitter || aliveT.find(p => pos[p - 1] === 'mid') || aliveT[0];
        if (!youId) continue;
        const s = {
          time: t, obj: nextObj, objUp: objState === 'up', spawnIn: objState === 'up' ? 0 : Math.max(1, Math.round((nextObj === 'Baron' ? baronAt : dragonAt) - t)),
          role: pos[youId - 1], you: champ[youId - 1], side: 'mid', allies, enemies, ally: aliveT.length, enemy: aliveO.length,
          respawn: deadSecs.length ? Math.round(Math.min(...deadSecs)) : 0, prio: 'even', wave: 'middle', itemGold: false, goldDiff: Math.round(g0), jg: null
        };
        const { sc } = E.judge(s);
        const top = Object.keys(sc).filter(a => (s.objUp || a !== 'take') && (hasWards || a !== 'picks')).sort((a, b) => sc[b] - sc[a])[0];
        const engine = sc[top] > 0 && MEASURED.includes(top) ? top : null; // null: the engine's answer is something we cannot measure (clear the wave, farm)
        out.push({ key: decisionKey(adv, objState, g0), action, engine, swing: Math.round(g1 - g0), tookObj, tookTower, lostPlayer, youSplit: champ[youId - 1].sty === 'Split' });
      }
    }
  }
  return out;
}

export function decisionCheck(moments, minMoments = 50) {
  const keys = {};
  for (const x of moments) {
    const k = keys[x.key] || (keys[x.key] = { moments: 0, actions: {} });
    k.moments++;
    const a = k.actions[x.action] || (k.actions[x.action] = { n: 0, swing: 0, obj: 0, tower: 0, lost: 0 });
    a.n++; a.swing += x.swing; if (x.tookObj) a.obj++; if (x.tookTower) a.tower++; if (x.lostPlayer) a.lost++;
  }
  const table = Object.entries(keys).map(([key, k]) => {
    const actions = Object.entries(k.actions).map(([action, a]) => ({ action, moments: a.n, avgGoldSwing: Math.round(a.swing / a.n), tookObjective: rate(a.obj, a.n), tookTower: rate(a.tower, a.n), lostAPlayer: rate(a.lost, a.n) }))
      .sort((a, b) => b.avgGoldSwing - a.avgGoldSwing);
    const ok = actions.filter(a => a.moments >= minMoments);
    let best = null;
    if (ok.length >= 2) {
      const b = ok[0], rest = actions.filter(a => a !== b), restN = rest.reduce((s, a) => s + a.moments, 0);
      const restSwing = Math.round(rest.reduce((s, a) => s + a.avgGoldSwing * a.moments, 0) / Math.max(1, restN));
      if (b.avgGoldSwing - restSwing >= 150) best = { action: b.action, moments: b.moments, avgGoldSwing: b.avgGoldSwing, othersGoldSwing: restSwing };
    }
    return { key, moments: k.moments, best, actions };
  }).sort((a, b) => b.moments - a.moments);
  /* how the engine does on the same moments */
  const judged = moments.filter(x => x.engine);
  const did = judged.filter(x => x.action === x.engine), didNot = judged.filter(x => x.action !== x.engine);
  const avg = l => l.length ? Math.round(l.reduce((s, x) => s + x.swing, 0) / l.length) : null;
  const byKey = Object.fromEntries(table.map(r => [r.key, r.best]));
  const withBest = judged.filter(x => byKey[x.key]);
  const engine = {
    moments: judged.length, unmeasurable: moments.length - judged.length,
    sameAsTeam: rate(did.length, judged.length),
    swingWhenTeamDidEngineAnswer: avg(did), swingOtherwise: avg(didNot),
    matchesBestMeasured: rate(withBest.filter(x => x.engine === byKey[x.key].action).length, withBest.length), momentsWithBest: withBest.length,
    perAction: Object.fromEntries(MEASURED.map(a => { const l = judged.filter(x => x.engine === a); const d = l.filter(x => x.action === a), o = l.filter(x => x.action !== a);
      return [a, { engineSaid: l.length, teamDidIt: d.length, swingDid: avg(d), swingOther: avg(o) }]; }))
  };
  return { method: 2, table, engine }; // method 2: actions read from intent (v0.10.1)
}

export function decisionReport(check) {
  const pct = x => x == null ? '–' : Math.round(x * 100) + '%', g = x => x == null ? '–' : (x > 0 ? '+' : '') + x;
  const e = check.engine, L = [];
  L.push(`## Decision making vs real results`, ``,
    `Real moments (after a kill, around objective spawns, and once a minute), what the team did in the next 90 seconds, and its gold swing over the next 2 minutes. ` +
    `The action is read from where the team was (positions exist once a minute, so it is an estimate), not from whether it worked. ` +
    `Stronger teams also choose more aggressive actions, so compare actions within one situation, not across situations.`, ``,
    `**Engine check:** ${e.moments} moments (plus ${e.unmeasurable} where the engine's answer, such as clearing a wave or farming, cannot be read from the data). The engine's answer was what the team did in ${pct(e.sameAsTeam)} of them. ` +
    `When the team did the engine's answer: ${g(e.swingWhenTeamDidEngineAnswer)} gold on average; otherwise ${g(e.swingOtherwise)}. ` +
    `Where the data has a clear best action (${e.momentsWithBest} moments), the engine picked it ${pct(e.matchesBestMeasured)} of the time.`, ``,
    `| Engine answer | Engine said it | Team did it | Gold swing when they did | When they did something else |`, `| --- | --- | --- | --- | --- |`);
  for (const [a, v] of Object.entries(e.perAction)) if (v.engineSaid) L.push(`| ${a} | ${v.engineSaid} | ${v.teamDidIt} | ${g(v.swingDid)} | ${g(v.swingOther)} |`);
  L.push(``, `**Best measured action per situation** (players up or down | objective | gold; used as the app's answer when it is clear):`, ``,
    `| Situation | Moments | Best action | Its gold swing | Everything else | All actions (moments, avg gold swing) |`, `| --- | --- | --- | --- | --- | --- |`);
  for (const r of check.table) L.push(`| ${r.key.replace(/\|/g, ' · ')} | ${r.moments} | ${r.best ? r.best.action : '–'} | ${r.best ? g(r.best.avgGoldSwing) : '–'} | ${r.best ? g(r.best.othersGoldSwing) : '–'} | ${r.actions.map(a => `${a.action} ${a.moments}/${g(a.avgGoldSwing)}`).join(', ')} |`);
  return L.join('\n') + '\n';
}
