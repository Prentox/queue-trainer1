// Tests the match-data pipeline on synthetic matches shaped like Riot's match-v5 + timeline responses.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadEngine } from './load-engine.mjs';
import { compact } from '../tools/compact.mjs';
import { createClient } from '../tools/riot.mjs';
import { championIndex, championStats, suggestions, compRules, lanes, situations, report } from '../tools/analyze-lib.mjs';

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
    const events = [];
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
