// Tests the match-data pipeline on synthetic matches shaped like Riot's match-v5 + timeline responses.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from './load-engine.mjs';
import { compact } from '../tools/compact.mjs';
import { createClient } from '../tools/riot.mjs';
import { championIndex, championStats, suggestions, compRules, lanes, situations, report, decisionMoments, decisionCheck, decisionReport } from '../tools/analyze-lib.mjs';

const E = loadEngine();
const POS = ['TOP', 'JUNGLE', 'MIDDLE', 'BOTTOM', 'UTILITY'];
const apiName = n => ({ 'Wukong': 'MonkeyKing', 'Nunu & Willump': 'Nunu', 'Renata Glasc': 'Renata' }[n] || n.replace(/[^A-Za-z]/g, ''));

function fakeMatch(seed) {
  let s = seed; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const pickFor = p => { const l = E.byPos({ TOP: 'top', JUNGLE: 'jungle', MIDDLE: 'mid', BOTTOM: 'adc', UTILITY: 'support' }[p]); return l[Math.floor(r() * l.length)]; };
  const participants = [];
  for (let i = 0; i < 10; i++) {
    const c = pickFor(POS[i % 5]);
    participants.push({ participantId: i + 1, teamId: i < 5 ? 100 : 200, teamPosition: POS[i % 5], championName: apiName(c.name),
      puuid: 'SECRET-PUUID-' + i, riotIdGameName: 'SecretName' + i, summonerName: 'SecretSummoner' + i,
      champLevel: 16, kills: 3, deaths: 3, assists: 5, goldEarned: 12000,
      physicalDamageDealtToChampions: Math.round(20000 * c.ad), magicDamageDealtToChampions: Math.round(20000 * (1 - c.ad)), trueDamageDealtToChampions: 1000,
      totalDamageTaken: 15000 + c.fr * 8000, damageSelfMitigated: 8000 + c.fr * 6000, timeCCingOthers: 5 + c.en * 10,
      totalHealsOnTeammates: c.pe * 2000, totalDamageShieldedOnTeammates: c.pe * 1500 });
  }
  const winner = r() < 0.5 ? 100 : 200;
  const frames = [];
  for (let m = 0; m <= 30; m++) {
    const pf = {}; for (let i = 1; i <= 10; i++) pf[i] = { totalGold: 500 + m * 400, level: Math.min(18, 1 + Math.floor(m / 2)), position: { x: 7000, y: 7000 } };
    if (m === 19) for (const i of [1, 2, 3, 4, 5]) pf[i].position = { x: 9700, y: 4500 }; // team 100 at the dragon pit after the fight
    if (m >= 24 && m <= 26) { pf[1].position = { x: 1200, y: 12500 }; for (const i of [2, 3, 4, 5]) pf[i].position = { x: 9500, y: 9500 }; } // top laner alone in a side lane
    const events = [];
    if (m === 5) for (let i = 1; i <= 10; i++) events.push({ type: 'ITEM_PURCHASED', timestamp: m * 60000 + 1000, participantId: i, itemId: 1001 }, { type: 'ITEM_PURCHASED', timestamp: m * 60000 + 3000, participantId: i, itemId: 2003 });
    if (m === 6) events.push({ type: 'WARD_PLACED', timestamp: m * 60000 + 2000, creatorId: 3, wardType: 'YELLOW_TRINKET' }, { type: 'WARD_PLACED', timestamp: m * 60000 + 2500, creatorId: 0, wardType: 'UNDEFINED' });
    if (m === 18) { // a fight: team 100 kills three of team 200, then takes dragon and a tower
      events.push({ type: 'CHAMPION_KILL', timestamp: m * 60000 + 1000, killerId: 1, victimId: 6, position: { x: 9800, y: 4400 } });
      events.push({ type: 'CHAMPION_KILL', timestamp: m * 60000 + 3000, killerId: 2, victimId: 7, position: { x: 9800, y: 4400 } });
      events.push({ type: 'CHAMPION_KILL', timestamp: m * 60000 + 5000, killerId: 3, victimId: 8, position: { x: 9800, y: 4400 } });
      events.push({ type: 'ELITE_MONSTER_KILL', timestamp: m * 60000 + 40000, killerTeamId: 100, monsterType: 'DRAGON', monsterSubType: 'FIRE_DRAGON' });
      events.push({ type: 'BUILDING_KILL', timestamp: m * 60000 + 70000, teamId: 200, buildingType: 'TOWER_BUILDING', laneType: 'BOT_LANE', towerType: 'OUTER_TURRET' });
    }
    frames.push({ timestamp: m * 60000, participantFrames: pf, events });
  }
  const match = { metadata: { matchId: 'EUW1_SECRET', participants: participants.map(p => p.puuid) },
    info: { queueId: 420, gameDuration: 1900, gameVersion: '15.20.123.4567', participants, teams: [{ teamId: 100, win: winner === 100 }, { teamId: 200, win: winner === 200 }] } };
  return { match, timeline: { metadata: { matchId: 'EUW1_SECRET' }, info: { frames } } };
}

const data = Array.from({ length: 300 }, (_, i) => fakeMatch(i + 1)).map(x => compact(x.match, x.timeline));

test('compact records are anonymous', () => {
  const text = JSON.stringify(data[0]);
  for (const secret of ['SECRET-PUUID', 'SecretName', 'SecretSummoner', 'EUW1_SECRET']) assert.ok(!text.includes(secret), `record leaks ${secret}`);
  assert.equal(data[0].p.length, 10); assert.equal(data[0].v, '15.20');
  assert.ok(data[0].f.length > 20 && data[0].e.length >= 5);
});

test('every champion name from the API maps to champions.txt', () => {
  const find = championIndex(E);
  for (const m of data) for (const p of m.p) assert.ok(find(p.ch), `unknown champion ${p.ch}`);
  for (const n of ['MonkeyKing', 'Nunu', 'Renata', 'KSante', 'Belveth', 'Kaisa', 'Chogath', 'DrMundo', 'JarvanIV', 'LeeSin']) assert.ok(find(n), n);
});

test('analysis produces champion values, rule checks, lanes and situations', () => {
  const find = championIndex(E);
  const stats = championStats(data, find);
  assert.ok(Object.keys(stats).length > 50);
  const someone = Object.values(stats)[0];
  for (const k of ['games', 'winRate', 'adShare', 'tankPerMin', 'ccPerMin', 'damagePerMin']) assert.ok(k in someone);
  const sugg = suggestions(E, stats, 5);
  assert.ok(Array.isArray(sugg));
  const comp = compRules(E, data, find);
  assert.ok(comp.front && comp.mix && comp.front.when.games + comp.front.otherwise.games === 600);
  const lane = lanes(E, data, find, 1);
  assert.ok(lane.matchups.length > 0);
  const sit = situations(data);
  const three = sit.find(s => s.playersUp === 3 && s.objectiveUp === 'dragon');
  assert.ok(three && three.moments === 300, 'the scripted 3-up fight with dragon up is found in every match');
  assert.equal(three.tookObjectiveWithin90s, 1); assert.equal(three.tookTowerWithin90s, 1);
  const md = report({ n: data.length, patches: ['15.20'], champStats: stats, sugg, comp, lane, sit, unknown: [] });
  assert.ok(md.includes('Draft rules vs real results'));
});

test('the API client refuses a missing or malformed key', () => {
  assert.throws(() => createClient(undefined));
  assert.throws(() => createClient('not-a-key'));
});

test('collected data flows into the explanations', () => {
  const find = championIndex(E);
  const lane = lanes(E, data, find, 1), sit = situations(data);
  E.setData({ lanes: { matchups: lane.matchups.map(m => ({ ...m, games: 50, winRate: 0.6 })) }, situations: sit.map(r => ({ ...r, moments: 100 })) });
  let laneSeen = false, sitSeen = false;
  for (let i = 0; i < 400 && !(laneSeen && sitSeen); i++) {
    const t = E.draft(['top', 'mid', 'adc'][i % 3], 3, [], []);
    if (t.why.some(w => w.text.includes('high-elo EUW'))) laneSeen = true;
    const d = E.decision(3, 'mid', []);
    if (d.why.some(w => w.includes('high-elo EUW'))) sitSeen = true;
  }
  E.setData(null);
  assert.ok(laneSeen, 'lane matchup data shows up in Draft explanations');
  assert.ok(sitSeen, 'situation data shows up in Decision explanations');
});

test('records keep recalls (item purchases) and wards, still anonymous', () => {
  const buys = data[0].e.filter(e => e[1] === 'I'), wards = data[0].e.filter(e => e[1] === 'W');
  assert.equal(buys.length, 10, 'one purchase per player per shopping trip');
  assert.deepEqual(wards.map(w => w[2]), [3], 'player wards only, no undefined wards');
  assert.ok(buys.every(e => e.length === 3) && wards.every(e => e.length === 3), 'only time and player number');
});

test('decision check: real moments are read, scored and compared with the engine', () => {
  const find = championIndex(E);
  const moments = decisionMoments(E, data, find);
  const take = moments.filter(x => x.action === 'take' && x.key === 'up|up|even');
  assert.equal(take.length, 300, 'the scripted 5v2 with dragon up is read as "take" in every match');
  assert.ok(take.every(x => x.tookObj), 'and the objective was taken');
  assert.ok(take.filter(x => x.engine === 'take').length / take.length >= 0.9, 'the engine also says take');
  assert.ok(moments.some(x => x.action === 'split'), 'a lone player in a side lane far from the team is read as a split');
  assert.ok(!moments.some(x => x.action === 'recall'), 'nobody shopped in the scripted windows');
  assert.ok(moments.every(x => x.engine === null || ['take', 'setup', 'trade', 'push', 'defend', 'recall', 'split', 'picks', 'farm'].includes(x.engine)));
  const check = decisionCheck(moments, 5);
  assert.ok(check.engine.moments + check.engine.unmeasurable === moments.length && check.engine.sameAsTeam > 0);
  assert.ok(decisionReport(check).includes('Decision making vs real results'));
  /* best action needs enough moments and a clear gold difference */
  const fake = [...Array(120).fill({ key: 'even|none|even', action: 'recall', engine: 'recall', swing: 400 }), ...Array(120).fill({ key: 'even|none|even', action: 'push', engine: 'recall', swing: -100 }),
    ...Array(120).fill({ key: 'up|none|ahead', action: 'push', engine: 'push', swing: 300 }), ...Array(120).fill({ key: 'up|none|ahead', action: 'recall', engine: 'push', swing: 250 })];
  const c2 = decisionCheck(fake), row = k => c2.table.find(r => r.key === k);
  assert.equal(row('even|none|even').best.action, 'recall');
  assert.equal(row('even|none|even').best.othersGoldSwing, -100);
  assert.equal(row('up|none|ahead').best, null, 'a 50-gold difference is not clear enough');
  assert.equal(c2.engine.sameAsTeam, 0.5);
  assert.equal(decisionCheck([{ key: 'k', action: 'push', engine: null, swing: 0 }]).engine.unmeasurable, 1);
  /* noisy: a 300-gold gap with a huge spread is not accepted as a best action */
  const noisy = [];
  for (let i = 0; i < 120; i++) noisy.push({ key: 'n', action: 'push', engine: 'push', swing: (i % 2 ? 1 : -1) * 6000 + 300 }, { key: 'n', action: 'farm', engine: 'push', swing: (i % 2 ? 1 : -1) * 6000 });
  assert.equal(decisionCheck(noisy).table[0].best, null, 'chance differences are not used');
  /* too few moments: not used */
  assert.equal(decisionCheck([...Array(60).fill({ key: 's', action: 'recall', engine: 'x', swing: 900 }), ...Array(200).fill({ key: 's', action: 'farm', engine: 'x', swing: 0 })]).table[0].best, null);
  assert.equal(c2.engine.swingWhenTeamDidEngineAnswer, 350);
});

test('the best measured action becomes the answer where it fits', () => {
  E.setData({ decisions: [{ key: 'even|none|even', best: { action: 'recall', moments: 412, avgGoldSwing: 600, othersGoldSwing: -50 } }] });
  let seen = 0, answered = 0;
  for (let i = 0; i < 400; i++) {
    const d = E.decision(3, 'mid', []);
    const s = d.state;
    if (s.ally - s.enemy > -2 && s.ally - s.enemy < 2 && !s.objUp && s.spawnIn > 60 && Math.abs(s.goldDiff) < 1500) {
      seen++; if (d.answer === 'recall') answered++;
      if (d.answer === 'recall') assert.ok(d.why.some(w => w.includes('412 similar high-elo EUW moments')), 'the data is the reason given');
    }
  }
  E.setData(null);
  assert.ok(seen > 10 && answered / seen >= 0.5, `recall answered ${answered} of ${seen}`);
});
