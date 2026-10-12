/* Queue Trainer engine: pure logic, no DOM. Champion data in, scenarios + answers + explanations out. */
const Engine = (() => {
  const POS = ['top', 'jungle', 'mid', 'adc', 'support'];
  const POS_LABEL = { top: 'Top', jungle: 'Jungle', mid: 'Mid', adc: 'ADC', support: 'Support' };
  const PMAP = { T: 'top', J: 'jungle', M: 'mid', A: 'adc', S: 'support' };
  const CLS = { K: 'Tank', B: 'Bruiser', C: 'Carry', E: 'Enchanter' };
  const STY = { T: 'Teamfight', S: 'Split', P: 'Pick' };

  let rnd = Math.random;
  const setRandom = f => { rnd = f; };
  const rand = (a, b) => a + rnd() * (b - a);
  const randi = (a, b) => Math.floor(rand(a, b + 1));
  const pick = a => a[Math.floor(rnd() * a.length)];
  const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const pct = x => Math.round(x * 100) + '%';

  /* Difficulty 0..1: rises fast early, flattens, never capped. */
  const diff = L => 1 - Math.exp(-(L - 1) / 8);
  const rankOf = L => L >= 14 ? 'Apex' : L >= 10 ? 'Stalker' : L >= 7 ? 'Hunter' : L >= 4 ? 'Scout' : 'Rookie';

  /* ---------- champions ---------- */
  let CH = [], BY_POS = {};
  /* champions.txt scores each trait 1-5; a champion "brings" a trait at 4+.
     Internally the rules use 0-3 (1->0, 2->1, 3->1.5, 4->2, 5->3), so 4+ on the file scale = 2+ inside. */
  const SC5 = { 1: 0, 2: 1, 3: 1.5, 4: 2, 5: 3 };
  const sc5 = v => { const x = SC5[+v]; if (x === undefined) throw new Error(`score must be 1-5, got ${v}`); return x; };
  function load(raw) {
    CH = raw.split('\n').map(l => l.trim()).filter(l => l && l[0] !== '#').map(l => {
      const p = l.split('|');
      return { name: p[0], pos: [...p[1]].map(c => PMAP[c]), ad: +p[2] / 10, cls: CLS[p[3]], sty: STY[p[4]],
        fr: sc5(p[5]), en: sc5(p[6]), pe: sc5(p[7]), di: sc5(p[8]), dp: sc5(p[9]), bu: sc5(p[10]), wc: sc5(p[11]), sc: +p[12],
        s: { fr: +p[5], en: +p[6], pe: +p[7], di: +p[8], dp: +p[9], bu: +p[10], wc: +p[11] } };
    });
    BY_POS = {}; POS.forEach(p => BY_POS[p] = CH.filter(c => c.pos.includes(p)));
    return CH;
  }
  const dmgType = c => c.ad >= 0.7 ? 'AD' : c.ad <= 0.3 ? 'AP' : 'Mixed';

  function stats(team) {
    const s = { n: team.length, fr: 0, en: 0, pe: 0, di: 0, dp: 0, bu: 0, wc: 0, ap: 0, split: 0, tf: 0, pk: 0, threat: 0, late: 0, early: 0, sc: 0, nFr: 0, nEn: 0, nPe: 0, nDi: 0, nDp: 0, nBu: 0, nWc: 0 };
    team.forEach(c => {
      s.fr += c.fr; s.en += c.en; s.pe += c.pe; s.di += c.di; s.dp += c.dp; s.bu += c.bu; s.wc += c.wc; s.ap += 1 - c.ad; s.sc += c.sc;
      if (c.sty === 'Split') s.split++; if (c.sty === 'Teamfight') s.tf++; if (c.sty === 'Pick') s.pk++;
      if (c.cls === 'Carry' && c.sc === 3) s.late++; if (c.sc === 1) s.early++; if (c.bu === 3 || c.dp === 3) s.threat++;
      /* Counts of champions (0-5) that bring a trait: what the player sees and reasons about. */
      if (c.fr >= 2) s.nFr++; if (c.en >= 2) s.nEn++; if (c.pe >= 2) s.nPe++; if (c.di >= 2) s.nDi++;
      if (c.dp >= 3) s.nDp++; if (c.bu >= 3) s.nBu++; if (c.wc >= 2) s.nWc++;
    });
    s.apShare = s.ap / s.n; s.dmg = s.dp + s.bu; s.scAvg = s.sc / s.n;
    return s;
  }

  /* Rule weights in one place, so they can be tuned (later: fitted on real match data).
     Team rules count champions (0-5) that bring a trait, e.g. frontliners = champions with frontline 2+. */
  const W = { mixBad: -12, mixGood: 3, frontNeed: 2, frontPer: -10, frontOk: 3, engNeed: 2, eng0: -14, eng1: -5, engOk: 2,
              peel: -8, planFull: 14, planMost: 8, twoSplit: -12, hold131: 6,
              vsEng: 9, vsTank: 12, vsSplit: 6, vsEarly: 3, vsLate: 5, vsPick: 6, vsTF: 8, vsSquishy: 6, vsLowEng: 8,
              threat0: -14, threat1: -5, lane: 1.5, laneData: 0.8,
              dataAct: 26 };
  const planOf = T => T.tf >= T.pk ? 'teamfight' : 'pick';
  const of5 = (b, a) => `${b} to ${a} (of 5)`;
  /* Draft rules: f(team stats, enemy stats) -> points. t(before, after, enemy) -> explanation. */
  const RULES = [
    { id: 'mix', name: 'Damage mix', f: T => (T.apShare < 0.2 || T.apShare > 0.8) ? W.mixBad : (T.apShare >= 0.3 && T.apShare <= 0.7 ? W.mixGood : 0),
      t: (B, A) => `Magic damage goes from ${pct(B.apShare)} to ${pct(A.apShare)} of your team's damage. One damage type is easy to build armor or magic resist against.` },
    { id: 'front', name: 'Frontline', f: T => T.nFr < W.frontNeed ? W.frontPer * (W.frontNeed - T.nFr) : W.frontOk,
      t: (B, A) => `Frontliners go from ${of5(B.nFr, A.nFr)}. A team wants at least ${W.frontNeed} to hold a fight.` },
    { id: 'engage', name: 'Engage', f: T => T.nEn === 0 ? W.eng0 : T.nEn < W.engNeed ? W.eng1 : W.engOk,
      t: (B, A) => `Champions who can start a fight go from ${of5(B.nEn, A.nEn)}. A team wants at least ${W.engNeed}.` },
    { id: 'threat', name: 'Damage threat', f: T => T.threat === 0 ? W.threat0 : T.threat === 1 ? W.threat1 : 0,
      t: (B, A) => `Champions with top-tier damage go from ${of5(B.threat, A.threat)}. Without real threats your team cannot win fights.` },
    { id: 'peel', name: 'Protect the carry', f: T => (T.late > 0 && T.nPe < 1) ? W.peel : 0,
      t: (B, A) => `Your late-game carry needs a bodyguard. Champions with strong peel go from ${of5(B.nPe, A.nPe)}.` },
    { id: 'plan', name: 'Team plan', f: T => { if (T.split >= 2) return 0; const c = Math.max(T.tf, T.pk); return c >= 4 ? W.planFull : c === 3 ? W.planMost : 0; },
      t: (B, A) => { const p = planOf(A), n = p === 'teamfight' ? A.tf : A.pk; return `Your team is built to ${p === 'teamfight' ? 'teamfight' : 'pick enemies off'}: ${n} of 5 champions now share that plan.`; } },
    { id: 'split', name: 'Split pushers', f: T => T.split >= 2 ? W.twoSplit : 0,
      t: () => `Two split pushers pull the team apart. One side lane is enough; the rest should group.` },
    { id: 'hold', name: 'Hold the 1-3-1', f: T => (T.split === 1 && T.nWc + T.nDi >= 4) ? W.hold131 : 0,
      t: (B, A) => `With one split pusher, the other four must hold the map. Champions with waveclear or disengage go from ${B.nWc + B.nDi} to ${A.nWc + A.nDi}.` },
    { id: 'vsEng', name: 'Against engage', f: (T, E) => E.nEn >= 3 ? W.vsEng * Math.min(T.nPe + T.nDi, 5) : 0,
      t: (B, A, E) => `The enemy has ${E.nEn} of 5 champions who can start a fight. Your champions with peel or disengage go from ${B.nPe + B.nDi} to ${A.nPe + A.nDi}.` },
    { id: 'vsTank', name: 'Against tanks', f: (T, E) => E.nFr >= 3 ? W.vsTank * Math.min(T.nDp, 3) : 0,
      t: (B, A, E) => `The enemy has ${E.nFr} of 5 frontliners. Your sustained-damage carries go from ${of5(B.nDp, A.nDp)}.` },
    { id: 'vsSplit', name: 'Against split', f: (T, E) => E.split >= 2 ? W.vsSplit * Math.min(T.nWc, 5) : 0,
      t: (B, A, E) => `The enemy has ${E.split} split pushers. Your champions with waveclear go from ${of5(B.nWc, A.nWc)}.` },
    { id: 'vsPick', name: 'Against pick', f: (T, E) => (E.pk >= 2 && E.nBu >= 2) ? W.vsPick * Math.min(T.nPe + T.nFr, 6) : 0,
      t: (B, A, E) => `The enemy is a pick comp (${E.pk} pick champions, ${E.nBu} burst threats) that wants to catch someone alone. Your champions with peel or frontline go from ${B.nPe + B.nFr} to ${A.nPe + A.nFr}.` },
    { id: 'vsTF', name: 'Against teamfight', f: (T, E) => E.tf >= 4 ? W.vsTF * Math.min(T.nDi + 2 * T.split, 5) : 0,
      t: (B, A, E) => `The enemy is built for 5v5 teamfights (${E.tf} of 5). Disengage and a side-lane threat let you avoid their fight: ${B.nDi + B.split} to ${A.nDi + A.split} of your champions.` },
    { id: 'vsSquishy', name: 'Against squishy', f: (T, E) => E.nFr === 0 ? W.vsSquishy * Math.min(T.nEn + T.nBu, 6) : 0,
      t: (B, A) => `The enemy has no frontliners. Your champions who can jump on their carries (engage or burst) go from ${B.nEn + B.nBu} to ${A.nEn + A.nBu}.` },
    { id: 'vsLowEng', name: 'Against low engage', f: (T, E) => E.nEn <= 1 ? W.vsLowEng * Math.min(T.nEn, 4) : 0,
      t: (B, A, E) => `The enemy has ${E.nEn} of 5 champions who can start a fight, so your team decides when fights happen. Your engage champions go from ${of5(B.nEn, A.nEn)}.` },
    { id: 'vsEarly', name: 'Against early', f: (T, E) => E.scAvg <= 1.6 ? W.vsEarly * Math.min(T.nDi + T.nWc, 8) : 0,
      t: (B, A) => `The enemy is strongest early. Champions with disengage or waveclear help you survive it: ${B.nDi + B.nWc} to ${A.nDi + A.nWc}.` },
    { id: 'vsLate', name: 'Against scaling', f: (T, E) => E.scAvg >= 2.4 ? W.vsLate * T.early : 0,
      t: (B, A) => `The enemy scales late, so you want to win early. Early-game champions go from ${of5(B.early, A.early)}.` }
  ];
  function enemyTags(E) {
    const t = [];
    if (E.nEn >= 3) t.push('Heavy engage'); else if (E.nEn <= 1) t.push('Low engage');
    if (E.tf >= 4) t.push('Teamfight comp');
    if (E.pk >= 2 && E.nBu >= 2) t.push('Pick comp');
    if (E.split >= 2) t.push('Split pushers');
    if (E.nFr >= 3) t.push('Tanky'); else if (E.nFr === 0) t.push('Squishy');
    if (E.scAvg <= 1.6) t.push('Strong early'); else if (E.scAvg >= 2.4) t.push('Scales late');
    if (E.apShare < 0.25) t.push('Mostly AD'); else if (E.apShare > 0.75) t.push('Mostly AP');
    return t;
  }
  const scoreTeam = (team, E) => RULES.reduce((s, r) => s + r.f(stats(team), E), 0);

  /* Lane matchup ("counterpick") rules: your pick against the enemy in the same role.
     Type-level heuristics for now; to be replaced by real matchup win rates from match data. */
  const MELEE = new Set(['Aatrox','Akali','Alistar','Ambessa','Amumu',"Bel'Veth",'Braum','Briar','Camille',"Cho'Gath",'Darius','Diana','Dr. Mundo','Ekko','Evelynn','Fiora','Fizz','Galio','Gangplank','Garen','Gragas','Gwen','Hecarim','Illaoi','Irelia','Jarvan IV','Jax',"K'Sante",'Kassadin','Katarina','Kayn',"Kha'Zix",'Kled','Lee Sin','Leona','Lillia','Malphite','Maokai','Master Yi','Mordekaiser','Naafiri','Nasus','Nautilus','Nilah','Nocturne','Nunu & Willump','Olaf','Ornn','Pantheon','Poppy','Pyke','Qiyana','Rakan','Rammus',"Rek'Sai",'Rell','Renekton','Rengar','Riven','Rumble','Sejuani','Sett','Shaco','Shen','Shyvana','Singed','Sion','Skarner','Sylas','Tahm Kench','Talon','Taric','Trundle','Tryndamere','Udyr','Vi','Viego','Volibear','Warwick','Wukong','Xin Zhao','Yasuo','Yone','Yorick','Zac','Zed']);
  const melee = c => MELEE.has(c.name);
  const LANE_ROLES = ['top', 'mid', 'adc'];
  const LANE_RULES = [
    { id: 'laneRange', f: (c, e) => (!melee(c) && melee(e) && e.en <= 1) ? 8 : 0,
      t: (c, e) => `Lane: ${c.name} is ranged and ${e.name} is melee with little engage, so you can hit them for free in lane.` },
    { id: 'laneTank', f: (c, e) => (e.fr >= 3 && c.dp >= 3) ? 8 : 0,
      t: (c, e) => `Lane: ${e.name} is a tank. ${c.name}'s sustained damage wins the long trades.` },
    { id: 'laneBurst', f: (c, e) => (e.bu >= 3 && e.fr === 0 && (c.fr >= 2 || c.di >= 2)) ? 7 : 0,
      t: (c, e) => `Lane: ${e.name} relies on burst. ${c.name} is ${c.fr >= 2 ? 'durable' : 'slippery'} enough to survive it.` },
    { id: 'laneEarly', f: (c, e) => (c.sc === 1 && e.sc === 3) ? 2 : 0, // was 7: in high-elo data this pick won only 43% (419 games)
      t: (c, e) => `Lane: ${c.name} is strongest early and ${e.name} wants to scale. Punish them before they come online.` },
    { id: 'laneBully', f: (c, e) => (c.sc === 3 && e.sc === 1 && c.wc <= 1) ? -6 : 0,
      t: () => '' },
    { id: 'laneSide', f: (c, e) => (e.sty === 'Split' && c.dp >= 2 && c.fr >= 2) ? 5 : 0,
      t: (c, e) => `Lane: ${e.name} wants to split push. ${c.name} can hold the side lane against them.` }
  ];
  const laneData = (role, c, e) => (DATA.lanes && e) ? DATA.lanes[`${role}|${c.name}|${e.name}`] || null : null;
  const laneDataScore = (role, c, e) => { const m = laneData(role, c, e); return m ? (m.winRate - 0.5) * 100 * W.laneData : 0; };
  const laneScore = (c, e, role) => e ? LANE_RULES.reduce((s, r) => s + W.lane * r.f(c, e), 0) + laneDataScore(role, c, e) : 0;

  const ARCH = {
    engage: c => c.en * 2 + c.fr,
    pick: c => c.bu * 2 + (c.sty === 'Pick' ? 3 : 0),
    split: c => (c.sty === 'Split' ? 4 : 0) + c.dp,
    scaling: c => c.sc * 2 + c.pe,
    early: c => (4 - c.sc) * 2 + c.en,
    tanky: c => c.fr * 2 + c.en,
    squishy: c => (3 - c.fr) * 2 + c.bu,
    teamfight: c => (c.sty === 'Teamfight' ? 3 : 0) + c.en
  };
  const GAP = {
    ap: c => c.ad >= 0.7 ? 3 : 0.2,
    ad: c => c.ad <= 0.3 ? 3 : 0.2,
    front: c => c.fr <= 1 ? 3 : 0.3,
    engage: c => c.en <= 1 ? 3 : 0.3,
    peel: c => c.pe <= 1 ? 3 : 0.5,
    threat: c => (c.bu < 3 && c.dp < 3) ? 3 : 0.2,
    hold: c => c.sty === 'Split' ? 0.05 : 1 + c.wc + c.di,
    pickteam: c => c.sty === 'Pick' ? 3 : 0.5 + c.en / 2,
    none: () => 1
  };
  /* Each task first picks which kind of champion should win (teamfight, split or pick),
     roughly in line with how common that style is in the role, then builds a draft where it does. */
  const SETUPS = {
    Teamfight: { arch: ['engage', 'scaling', 'tanky', 'early', 'pick'], gap: ['ap', 'ad', 'front', 'engage', 'peel', 'none'] },
    Split: { arch: ['teamfight', 'scaling', 'engage'], gap: ['hold', 'threat'] },
    Pick: { arch: ['squishy', 'scaling', 'split'], gap: ['pickteam', 'threat', 'engage'] }
  };
  function targetStyle(role) {
    const n = { Teamfight: 0, Split: 0, Pick: 0 };
    BY_POS[role].filter(c => c.pos[0] === role).forEach(c => n[c.sty]++);
    const w = Object.entries(n).map(([k, v]) => [k, v ? Math.sqrt(v) : 0]);
    let t = rnd() * w.reduce((a, b) => a + b[1], 0);
    for (const [k, v] of w) { t -= v; if (t <= 0) return k; }
    return 'Teamfight';
  }
  function weighted(list, w) {
    const ws = list.map(c => Math.pow(Math.max(0.05, w(c)), 2) + 0.2);
    let t = rnd() * ws.reduce((a, b) => a + b, 0);
    for (let i = 0; i < list.length; i++) { t -= ws[i]; if (t <= 0) return list[i]; }
    return list[list.length - 1];
  }

  /* Build one draft task. pool = array of champion names (may be empty). */
  function draft(role, level, pool, avoid) {
    avoid = avoid || [];
    const d = diff(level);
    const N = level < 4 ? 3 : 4;
    const margin = Math.round(28 - d * 20); /* 28 at level 1 -> ~8 late */
    /* Your champion pool decides the options: every champion you chose, whatever role it is listed for. */
    const poolAll = CH.filter(c => pool.includes(c.name));
    const usePool = poolAll.length >= 3;
    const styleSrc = poolAll.length >= 2 ? poolAll : BY_POS[role].filter(c => c.pos[0] === role);
    let target = targetStyle(role);
    if (!styleSrc.some(c => c.sty === target)) target = pick(styleSrc).sty;
    const setup = SETUPS[target];
    /* The champion we try to make the right answer this time: rotates, skipping recent answers. */
    const leadPool = styleSrc.filter(c => c.sty === target);
    const wanted = pick(leadPool.filter(c => !avoid.includes(c.name)).length ? leadPool.filter(c => !avoid.includes(c.name)) : leadPool);
    let last = null;
    for (let attempt = 0; attempt < 160; attempt++) {
      const used = new Set();
      const take = (p, w) => { const c = weighted(BY_POS[p].filter(x => !used.has(x.name) && !pool.includes(x.name)), w); used.add(c.name); return c; };
      const arch = pick(setup.arch), gap = pick(setup.gap);
      const enemy = POS.map(p => ({ pos: p, c: take(p, ARCH[arch]) }));
      const allies = POS.filter(p => p !== role).map(p => ({ pos: p, c: take(p, GAP[gap]) }));
      const E = stats(enemy.map(x => x.c));
      const foeLaner = LANE_ROLES.includes(role) ? enemy.find(x => x.pos === role).c : null;
      const roleList = BY_POS[role].filter(c => c.pos[0] === role && !used.has(c.name));
      /* 3+ pool champions: only those. 1-2: yours plus random champions of your role (2 -> one extra, 1 -> fill up). */
      const extra = poolAll.length === 2 ? 1 : N - 1;
      const src = usePool ? poolAll : poolAll.length ? poolAll.concat(shuffle(roleList.filter(c => !poolAll.includes(c))).slice(0, extra)) : roleList;
      if (src.length < 2) continue;
      const n = Math.min(N, src.length);
      const lead = src.includes(wanted) ? wanted : shuffle(src.filter(c => c.sty === target))[0];
      /* Leave out recent right answers as options when there are enough others, so the pool rotates. */
      const rest = src.filter(c => c !== lead), restFresh = rest.filter(c => !avoid.slice(-2).includes(c.name));
      const chosen = (lead ? [lead] : []).concat(shuffle(restFresh.length >= n - 1 ? restFresh : rest)).slice(0, n);
      const opts = chosen.map(c => ({ c, s: scoreTeam(allies.map(x => x.c).concat(c), E) + laneScore(c, foeLaner, role) })).sort((a, b) => b.s - a.s);
      const gapNow = opts.length > 1 ? opts[0].s - opts[1].s : 99;
      last = { role, allies, enemy, E, opts, fromPool: usePool, foeLaner };
      const need = attempt < 120 ? margin : attempt < 150 ? Math.round(margin / 2) : 1;
      const styleOk = attempt >= 140 || (attempt < 100 ? opts[0].c === wanted : opts[0].c.sty === target);
      if (styleOk && gapNow >= need && gapNow <= margin + 40 && (attempt > 130 || !avoid.includes(opts[0].c.name))) break;
    }
    const t = last;
    const best = t.opts[0];
    const others = t.opts.slice(1);
    const allyTeam = t.allies.map(x => x.c);
    const B = stats(allyTeam), A = stats(allyTeam.concat(best.c));
    const mean = f => others.reduce((s, o) => s + f(o.c), 0) / Math.max(1, others.length);
    const why = RULES.map(r => ({ id: r.id, name: r.name, delta: r.f(A, t.E) - mean(c => r.f(stats(allyTeam.concat(c)), t.E)), text: () => r.t(B, A, t.E) }))
      .concat(t.foeLaner ? LANE_RULES.map(r => ({ id: r.id, name: 'Lane matchup', delta: W.lane * (r.f(best.c, t.foeLaner) - mean(c => r.f(c, t.foeLaner))), text: () => r.t(best.c, t.foeLaner) })) : [])
      .concat(t.foeLaner && laneData(role, best.c, t.foeLaner) ? [(() => { const m = laneData(role, best.c, t.foeLaner); return { id: 'laneData', name: 'Lane matchup (data)', delta: laneDataScore(role, best.c, t.foeLaner) - mean(c => laneDataScore(role, c, t.foeLaner)), text: () => `Lane: in high-elo EUW games, ${best.c.name} wins ${Math.round(m.winRate * 100)}% against ${t.foeLaner.name} (${m.games} games).` }; })()] : [])
      .filter(x => x.delta > 0).sort((a, b) => b.delta - a.delta);
    let pickWhy = why.slice(0, 2);
    const foe = why.find(x => x.id.startsWith('vs') || x.id.startsWith('lane'));
    if (foe && !pickWhy.includes(foe)) pickWhy = [pickWhy[0], foe];
    const whyOut = pickWhy.filter(Boolean).map(x => ({ rule: x.name, id: x.id, text: x.text() })).filter(x => x.text);
    return {
      role, allies: t.allies, enemy: t.enemy, fromPool: t.fromPool,
      options: shuffle(t.opts.map(o => ({ name: o.c.name, c: o.c, score: o.s }))),
      answer: best.c.name, margin: others.length ? best.s - others[0].s : 0,
      before: B, enemyStats: t.E, why: whyOut, enemyRead: enemyTags(t.E)
    };
  }

  /* ---------- Decision making ----------
     A moment from a game with real champions on both sides. The rules look at who you are
     (a split pusher, a pick champion, a scaling carry), who is alive, how the two comps fight
     and scale, the objective timer, lanes, gold and vision. Every rule that applies adds points
     to some actions and carries the sentence that explains why. */
  const ACT = {
    take: o => `Start ${o} now`,
    setup: o => `Ward the ${o} pit and group`,
    trade: () => 'Trade: take a tower on the other side',
    push: () => 'Group and push the nearest tower',
    defend: () => 'Fall back and defend',
    recall: () => 'Recall to buy items',
    clear: () => 'Clear your wave first',
    split: () => 'Split push a side lane',
    picks: () => 'Ward their jungle and look for picks',
    scale: () => 'Farm safely and avoid fights'
  };
  const mmss = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const power = list => list.reduce((s, c) => s + c.fr + c.en + c.dp + c.bu + c.pe * 0.5, 0);
  const avg = (list, k) => list.reduce((s, c) => s + c[k], 0) / Math.max(1, list.length);
  const styleWord = c => c.sty === 'Split' ? 'split pusher' : c.sty === 'Pick' ? 'pick champion' : (c.cls === 'Tank' ? 'engage tank' : c.cls === 'Enchanter' ? 'enchanter' : 'teamfighter');
  const SIDE = { top: 'top', mid: 'mid', adc: 'bot', support: 'bot' };

  /* Each moment starts from a theme, so champion-driven situations (split, picks, scaling,
     comp strength) come up as often as the plain numbers-and-timers ones. */
  const THEMES = [['numbers', 2], ['objective', 1.5], ['split', 1.5], ['picks', 1.5], ['scale', 1.5], ['comp', 2]];
  function makeState(level, role, theme, pool) {
    const mine = CH.filter(c => (pool || []).includes(c.name));
    const primary = p => BY_POS[p].filter(c => c.pos[0] === p);
    if (!theme) { let t = rnd() * THEMES.reduce((a, b) => a + b[1], 0); for (const [k, w] of THEMES) { t -= w; if (t <= 0) { theme = k; break; } } theme = theme || 'numbers'; }
    const youList = mine.length ? mine : primary(role);
    if (theme === 'split' && !youList.some(c => c.sty === 'Split' && c.dp >= 2)) theme = 'picks';
    if (theme === 'picks' && !youList.some(c => c.sty === 'Pick')) theme = 'comp';
    const time = theme === 'scale' ? randi(10, 22) * 60 + randi(0, 59) : randi(9, 32) * 60 + randi(0, 59);
    const objKind = time >= 21 * 60 && rnd() < 0.45 ? 'Baron' : 'Dragon';
    const quiet = theme === 'split' || theme === 'picks' || theme === 'scale';
    const objUp = quiet ? false : theme === 'objective' || theme === 'comp' ? rnd() < 0.6 : rnd() < 0.5;
    const spawnIn = objUp ? 0 : quiet ? pick([90, 120]) : pick([20, 30, 45, 60, 90]);
    const prefer = { split: { you: c => c.sty === 'Split' && c.dp >= 2, ally: c => c.wc + c.di >= 3, foe: () => true },
      picks: { you: c => c.sty === 'Pick', ally: c => c.en >= 2 || c.sty === 'Pick', foe: c => c.fr <= 1 },
      scale: { you: c => c.sc >= 2, ally: c => c.sc === 3, foe: c => c.sc === 1 },
      comp: rnd() < 0.5 ? { you: () => true, ally: c => c.en + c.fr >= 4, foe: c => c.fr + c.en <= 2 } : { you: () => true, ally: c => c.fr + c.en <= 2, foe: c => c.en + c.fr >= 4 } }[theme];
    const choose = (p, f, isYou) => { const l = isYou ? youList : primary(p).filter(c => !mine.includes(c)), good = f ? l.filter(f) : []; return pick(good.length ? good : l); };
    const team = side => POS.map(p => ({ pos: p, c: choose(p, prefer ? (side === 'ally' ? (p === role ? prefer.you : prefer.ally) : prefer.foe) : null, side === 'ally' && p === role), alive: true }));
    const allies = team('ally');
    let enemies = team('foe'), guard = 0;
    while (enemies.some(e => allies.some(a => a.c.name === e.c.name)) && guard++ < 50) enemies = team('foe');
    const k = theme === 'numbers' ? pick([[5, 2], [5, 3], [4, 2], [3, 5], [2, 4], [4, 1], [2, 5], [5, 3]])
      : quiet || theme === 'comp' ? pick([[5, 5], [5, 5], [4, 4], [4, 5], [5, 4]])
      : rnd() < 0.6 ? pick([[5, 2], [5, 3], [4, 2], [3, 5], [2, 4], [4, 4], [5, 5], [3, 3], [4, 1], [2, 5]]) : [5, 5];
    shuffle(allies.filter(a => a.pos !== role)).slice(0, 5 - k[0]).forEach(a => { a.alive = false; });
    shuffle(enemies).slice(0, 5 - k[1]).forEach(e => { e.alive = false; });
    const respawn = (k[0] < 5 || k[1] < 5) ? pick([15, 20, 30, 40]) : 0;
    const you = allies.find(a => a.pos === role).c;
    const jgC = enemies.find(e => e.pos === 'jungle');
    return {
      theme, time, clock: mmss(time), obj: objKind, objUp, spawnIn, role, you, side: SIDE[role] || pick(['top', 'bot']),
      allies, enemies, ally: k[0], enemy: k[1], respawn,
      prio: pick(['ours', 'theirs', 'even']), wave: quiet ? pick(['pushing', 'middle']) : pick(['pushing', 'middle', 'crashing']),
      itemGold: quiet ? rnd() < 0.25 : rnd() < 0.5,
      goldDiff: theme === 'scale' ? pick([-3500, -1500, -500, 0]) : pick([-5000, -3500, -1500, -500, 0, 500, 1500, 3500, 5000]),
      jg: jgC.alive && rnd() < 0.5 ? { side: pick(['near', 'far']), ago: pick([5, 10, 20, 40]), name: jgC.c.name } : null
    };
  }

  /* Mobility (escape and roam), used for split pushing and picks. 3 = very mobile, 0 = immobile, others 1. */
  const MOBILE = new Set(['Ahri','Akali','Akshan','Ambessa','Aurora',"Bel'Veth",'Camille','Corki','Ekko','Evelynn','Ezreal','Fiora','Fizz','Graves','Hecarim','Irelia','Jax',"Kai'Sa",'Kalista','Kassadin','Katarina','Kayn',"Kha'Zix",'Kindred','Kled','LeBlanc','Lee Sin','Lucian','Master Yi','Naafiri','Nidalee','Nilah','Nocturne','Pyke','Qiyana','Quinn','Rakan',"Rek'Sai",'Rengar','Riven','Samira','Shaco','Sylas','Talon','Tristana','Tryndamere','Vayne','Viego','Yasuo','Yone','Zed','Zeri']);
  const IMMOBILE = new Set(['Anivia','Annie','Aphelios','Ashe','Brand','Cassiopeia',"Cho'Gath",'Darius','Dr. Mundo','Garen','Heimerdinger','Illaoi','Jhin','Jinx','Karthus',"Kog'Maw",'Lux','Malzahar','Miss Fortune','Mordekaiser','Nasus','Orianna','Senna','Seraphine','Sion','Sona','Soraka','Swain','Syndra','Taric','Urgot','Varus','Veigar',"Vel'Koz",'Viktor','Xerath','Yorick','Ziggs','Zilean','Zyra']);
  const mobility = c => MOBILE.has(c.name) ? 3 : IMMOBILE.has(c.name) ? 0 : 1;

  /* Optional real match data (built in from data/derived when it exists). */
  let DATA = { lanes: null, situations: null, decisions: null };
  function setData(d) {
    DATA = { lanes: null, situations: null, decisions: null };
    if (d && d.decisions) { DATA.decisions = {}; for (const r of d.decisions) if (r.best) DATA.decisions[r.key] = r.best; }
    if (d && d.lanes) { DATA.lanes = {}; for (const m of d.lanes.matchups || []) DATA.lanes[`${m.pos}|${m.champion}|${m.versus}`] = m; }
    if (d && d.situations) DATA.situations = d.situations;
  }
  const situationStat = (adv, obj) => {
    if (!DATA.situations) return null;
    const row = DATA.situations.find(r => String(r.playersUp) === (adv >= 4 ? '4+' : String(adv)) && r.objectiveUp === obj);
    return row && row.moments >= 30 ? row : null;
  };

  /* The conclusion: which call is probably right in this exact situation. */
  const CONCLUDE = {
    take: s => `Starting the ${s.obj} now is probably the best use of it.`,
    setup: s => `Warding the ${s.obj} pit and grouping before it spawns is probably the better option.`,
    trade: s => `Trading for a tower on the other side is probably worth more than contesting the ${s.obj}.`,
    push: () => 'Grouping to push the nearest tower turns this into a lasting lead.',
    defend: () => 'Falling back to defend under your tower is probably the safer option.',
    recall: () => 'Recalling now costs you the least.',
    clear: () => 'Clearing the wave first is probably worth more than anything else right now.',
    split: s => `${!s.objUp ? `With ${s.spawnIn} seconds to ${s.obj}, ` : ''}side-laning as ${s.you.name} and pulling enemies toward you is probably the better option.`,
    picks: () => 'Warding their jungle to catch someone alone is probably the better option.',
    scale: () => 'Farming safely and avoiding fights until your items are in is probably the better option.'
  };
  /* Measured in real games: the action that gained teams the most gold in the same kind of moment. */
  const DID = { take: o => `started the ${o}`, setup: o => `grouped at the ${o} pit before it spawned`, trade: () => 'traded for a tower on the other side',
    push: () => 'grouped to push a tower', defend: () => 'fell back to defend', recall: () => 'recalled', split: () => 'sent one player to split push', picks: () => 'warded and looked for picks' };
  const decisionKey = (adv, obj, gold) => `${adv >= 2 ? 'up' : adv <= -2 ? 'down' : 'even'}|${obj}|${gold >= 1500 ? 'ahead' : gold <= -1500 ? 'behind' : 'even'}`;
  const measuredBest = s => {
    if (!DATA.decisions) return null;
    return DATA.decisions[decisionKey(s.ally - s.enemy, s.objUp ? 'up' : !s.objUp && s.spawnIn <= 60 ? 'soon' : 'none', s.goldDiff)] || null;
  };
  const goldWords = g => Math.abs(g) < 1000 ? 'gold is even' : g > 0 ? `your team is ${g.toLocaleString('en-US')} gold ahead` : `your team is ${(-g).toLocaleString('en-US')} gold behind`;

  /* Every rule adds points to actions and states a FACT about the situation (the why, not the what). */
  function judge(s) {
    const ids = Object.keys(ACT);
    const sc = {}, why = {}; ids.forEach(a => { sc[a] = 0; why[a] = []; });
    const add = (a, v, text) => { sc[a] += v; if (v > 0 && text) why[a].push({ v, text }); };
    const A = s.allies.filter(x => x.alive).map(x => x.c), Ef = s.enemies.filter(x => x.alive).map(x => x.c);
    const adv = s.ally - s.enemy, soon = !s.objUp && s.spawnIn <= 60, O = s.obj, you = s.you;
    const g = s.goldDiff / 15000;
    const pa = power(A) * (1 + g), pe = power(Ef) * (1 - g), edge = (pa - pe) / Math.max(pa, pe, 1);
    const deadKey = s.enemies.filter(x => !x.alive && (x.c.en >= 3 || x.c.bu >= 3 || x.c.dp >= 3)).map(x => x.c.name);
    const deadText = deadKey.length ? `; ${deadKey.slice(0, 2).join(' and ')} ${deadKey.length > 1 ? 'are' : 'is'} dead` : '';
    const objKey = s.objUp ? O.toLowerCase() : 'none';

    if (!s.objUp) add('take', -100);
    if (s.objUp && O === 'Baron' && s.ally < 4) add('take', -25);
    /* numbers */
    if (adv >= 2 && s.respawn >= 20) {
      const t = `You are ${s.ally} v ${s.enemy} for the next ${s.respawn} seconds${deadText}.`;
      const st = situationStat(adv, objKey);
      const proof = st ? ` In high-elo EUW games, teams ${st.playersUp} up${s.objUp ? ` with the ${O} up took it within 90 seconds ${Math.round(st.tookObjectiveWithin90s * 100)}% of the time` : ` took a tower within 90 seconds ${Math.round(st.tookTowerWithin90s * 100)}% of the time`}.` : '';
      add('take', s.objUp ? 45 : 0, t + ` The ${O} is up and nobody on their side can contest it.` + proof);
      add('push', 32, t + ' No objective is up, but their towers are open.' + proof);
      if (soon && s.spawnIn < s.respawn) add('setup', 20, `You are ${s.ally} v ${s.enemy}, and the ${O} spawns in ${s.spawnIn} seconds, before they respawn.`);
      ['recall', 'defend', 'scale', 'split'].forEach(a => add(a, -25));
    } else if (adv >= 2) add('push', 15, `You are ${s.ally} v ${s.enemy}, but they respawn in only ${s.respawn} seconds.`);
    if (adv <= -2) {
      add('defend', 45, `You are ${-adv} players down for the next ${s.respawn} seconds, and your tower is the only thing evening the fight.`);
      ['take', 'setup', 'push', 'picks'].forEach(a => add(a, -35)); add('trade', -10);
    }
    /* how the alive comps fight 5v5 */
    if (Math.abs(adv) < 2 && edge >= 0.2 && (s.objUp || soon)) add(s.objUp ? 'take' : 'setup', 22, `Your team is stronger 5v5: about ${Math.round(edge * 100)}% more engage, frontline and damage alive, and ${goldWords(s.goldDiff)}.`);
    if (Math.abs(adv) < 2 && edge <= -0.1) {
      const t = `The enemy team is stronger 5v5: about ${Math.round(-edge * 100)}% more engage, frontline and damage alive, and ${goldWords(s.goldDiff)}.`;
      if (edge <= -0.2) { add('trade', 18, t); add('defend', 12, t); add('take', -20); add('setup', -12); }
      if (you.sty === 'Split') add('split', 14, t);
      if (you.sty === 'Pick') add('picks', 8, t);
    }
    /* who you are */
    const holders = A.filter(c => c !== you), holdN = holders.filter(c => c.wc >= 2 || c.di >= 2).length, hold = holdN >= 2 ? 5 : 0;
    if (you.sty === 'Split' && you.dp >= 2 && adv > -2 && !soon && !s.objUp) {
      add('split', hold >= 5 ? 32 : 16, `You are ${you.name}, a split pusher who wins most 1v1s, and ${holdN} of your teammates have the waveclear or disengage to hold mid without you.`);
      if (mobility(you) >= 3) add('split', 6, `${you.name} has the mobility to escape if they send more than one.`);
    } else if (you.sty !== 'Split') add('split', -22);
    if ((you.sty === 'Pick' || A.filter(c => c.sty === 'Pick').length >= 2) && adv >= -1 && !soon && !s.objUp) {
      const ef = Ef.reduce((t, c) => t + c.fr, 0);
      if (ef <= 4) add('picks', 30, `Their alive team is squishy (${ef} frontline), and you are ${you.name}, built to catch one target alone.`);
      if (mobility(you) >= 3 && ef <= 4) add('picks', 4, `${you.name} is mobile enough to get in and out.`);
    } else add('picks', -10);
    const sa = avg(s.allies.map(x => x.c), 'sc'), se = avg(s.enemies.map(x => x.c), 'sc');
    if (sa - se >= 0.4 && s.goldDiff <= 0 && s.time < 26 * 60 && adv < 2) {
      add('scale', 30, `Your team scales better (${sa.toFixed(1)} vs ${se.toFixed(1)}), ${goldWords(s.goldDiff)}, and every minute without a fight favors you.`);
      add('push', -10); add('take', -8);
    } else if (se - sa >= 0.4 && s.goldDiff >= 0) {
      const t = `Their team scales better (${se.toFixed(1)} vs ${sa.toFixed(1)}), and ${goldWords(s.goldDiff)}, so your advantage shrinks every minute.`;
      add('push', 16, t); if (s.objUp) add('take', 10, t); add('scale', -25);
    } else add('scale', -6);
    /* objective timer and lane priority */
    if (s.objUp && adv >= 0 && adv < 2) add('take', 10, `The ${O} is up and the numbers are even.`);
    if (soon && adv > -2) { add('setup', 25, `The ${O} spawns in ${s.spawnIn} seconds, and vision has to be down before it spawns.`); add('recall', -20); add('split', -15); }
    if (soon || s.objUp) {
      if (s.prio === 'ours') { add('setup', 22, 'Your lanes near the pit have pushed their waves, so you can move first.'); add('take', 8, 'Your lanes near the pit have priority.'); }
      if (s.prio === 'theirs') { add('trade', 32, 'The enemy lanes near the pit have priority, so they get there first.'); add('setup', -22); add('take', -12); }
    }
    /* your wave, gold and vision */
    if (s.wave === 'crashing') { add('clear', 30, `A big wave is about to hit your ${s.side} tower, which costs plates or the tower if nobody is there.`); add('recall', -25); add('split', -10); }
    if (s.wave === 'pushing') add('recall', 14, 'Your wave is crashing into their tower, so leaving costs almost nothing.');
    if (s.itemGold && !soon && !s.objUp && adv > -2) add('recall', you.cls === 'Carry' ? 26 : 20, `You have gold for an item${you.cls === 'Carry' ? `, ${you.name}'s damage depends on it,` : ''} and nothing spawns in the next minute.`);
    if (s.goldDiff >= 3000) { const t = `Your team is ${s.goldDiff.toLocaleString('en-US')} gold ahead, so even fights favor you.`; add('take', 6, t); add('setup', 6, t); add('push', 6, t); }
    if (s.goldDiff <= -3000) { const t = `Your team is ${(-s.goldDiff).toLocaleString('en-US')} gold behind, so even fights favor them.`; add('defend', 10, t); add('trade', 6, t); add('scale', 6, t); }
    if (s.jg && s.jg.ago <= 20 && s.jg.side === 'far') { const t = `Their jungler ${s.jg.name} was seen on the far side ${s.jg.ago} seconds ago.`; add('push', 8, t); add('trade', 6, t); add('split', 8, t); add('picks', -8); }
    if (s.jg && s.jg.ago <= 20 && s.jg.side === 'near') { add('defend', 6, `Their jungler ${s.jg.name} was seen nearby ${s.jg.ago} seconds ago.`); add('push', -10); add('split', -12); }
    /* real games: where the data has a clear best action for this kind of moment, it weighs heavily */
    const mb = measuredBest(s);
    const fits = mb && (mb.action !== 'take' || s.objUp) && (mb.action !== 'setup' || soon) && (mb.action !== 'split' || you.sty === 'Split')
      && (mb.action !== 'picks' || you.sty === 'Pick' || A.filter(c => c.sty === 'Pick').length >= 2);
    if (fits) add(mb.action, W.dataAct, `In ${mb.moments} similar high-elo EUW moments, teams that ${DID[mb.action](O)} gained ${mb.avgGoldSwing > 0 ? '+' : ''}${mb.avgGoldSwing.toLocaleString('en-US')} gold over the next 2 minutes, against ${mb.othersGoldSwing > 0 ? '+' : ''}${mb.othersGoldSwing.toLocaleString('en-US')} for everything else.`);
    return { sc, why };
  }

  function decision(level, role, avoid, pool) {
    avoid = avoid || [];
    const d = diff(level);
    const N = level < 3 ? 3 : 4;
    const margin = Math.round(30 - d * 20);
    let best = null;
    for (let attempt = 0; attempt < 300; attempt++) {
      const s = makeState(level, role, null, pool);
      const { sc, why } = judge(s);
      const ranked = Object.keys(sc).filter(a => s.objUp || a !== 'take').sort((a, b) => sc[b] - sc[a]);
      const top = ranked[0];
      if (sc[top] <= 0 || why[top].length === 0) continue;
      if (attempt < 200 && avoid.slice(-2).includes(top)) continue;
      const weaker = ranked.slice(1).filter(a => sc[top] - sc[a] >= margin);
      const runner = weaker[0];
      if (!runner || weaker.length < N - 1) continue;
      const others = [runner].concat(shuffle(weaker.slice(1))).slice(0, N - 1);
      const opts = shuffle([top].concat(others));
      const seen = new Set();
      const expl = why[top].sort((a, b) => b.v - a.v).filter(x => !seen.has(x.text) && seen.add(x.text)).slice(0, 2).map(x => x.text);
      best = { state: s, options: opts.map(a => ({ id: a, text: ACT[a](s.obj) })), answer: top, scores: sc, why: expl, conclusion: CONCLUDE[top](s), margin: sc[top] - sc[runner] };
      if (best.margin <= margin + 45) break;
    }
    return best;
  }

  return { W, styleWord, melee, mobility, setData, LANE_RULES, POS, POS_LABEL, load, draft, decision, stats, diff, rankOf, dmgType, setRandom, all: () => CH, byPos: p => BY_POS[p], RULES, judge, makeState };
})();
if (typeof module !== 'undefined') module.exports = Engine;
