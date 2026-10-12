// Turns a Riot match + timeline into a small, anonymous record.
// Kept: patch, duration, winner, per-player champion/role/stats, per-minute gold/level/position,
// kills, objectives and towers. Dropped: every player name, PUUID, summoner ID and the match ID.

export function compact(match, timeline) {
  const info = match.info;
  const parts = [...info.participants].sort((a, b) => a.participantId - b.participantId);
  const p = parts.map(x => ({
    t: x.teamId, pos: x.teamPosition || x.individualPosition || '', ch: x.championName,
    lvl: x.champLevel, k: x.kills, d: x.deaths, a: x.assists, gold: x.goldEarned,
    phys: x.physicalDamageDealtToChampions, magic: x.magicDamageDealtToChampions, tru: x.trueDamageDealtToChampions,
    taken: x.totalDamageTaken, mitig: x.damageSelfMitigated, cc: x.timeCCingOthers,
    heal: x.totalHealsOnTeammates || 0, shield: x.totalDamageShieldedOnTeammates || 0, obj: x.damageDealtToObjectives || 0
  }));
  const winTeam = (info.teams.find(t => t.win) || {}).teamId || 0;
  const frames = [], events = [];
  for (const fr of (timeline && timeline.info && timeline.info.frames) || []) {
    const m = Math.round(fr.timestamp / 60000);
    const pf = fr.participantFrames || {};
    const ids = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    frames.push({
      m,
      gold: ids.map(i => (pf[i] && pf[i].totalGold) || 0),
      lvl: ids.map(i => (pf[i] && pf[i].level) || 1),
      pos: ids.map(i => (pf[i] && pf[i].position) ? [pf[i].position.x, pf[i].position.y] : null)
    });
    for (const e of fr.events || []) {
      const t = Math.round(e.timestamp / 1000);
      if (e.type === 'CHAMPION_KILL') events.push([t, 'K', e.killerId || 0, e.victimId, e.position ? e.position.x : null, e.position ? e.position.y : null]);
      else if (e.type === 'ELITE_MONSTER_KILL') events.push([t, 'M', e.killerTeamId, e.monsterType, e.monsterSubType || '']);
      else if (e.type === 'BUILDING_KILL') events.push([t, 'B', e.teamId, e.buildingType, e.laneType || '', e.towerType || '']);
    }
  }
  return { v: String(info.gameVersion || '').split('.').slice(0, 2).join('.'), dur: info.gameDuration, win: winTeam, p, f: frames, e: events };
}
