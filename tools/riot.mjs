// Minimal Riot API client with the development-key rate limits (20 requests / 1 s, 100 requests / 2 min).
// The key is read from the RIOT_API_KEY environment variable and is never written to disk.

const PLATFORM = 'https://euw1.api.riotgames.com';
const REGION = 'https://europe.api.riotgames.com';

export function createClient(key, { perSecond = 20, perTwoMinutes = 100, log = console.log } = {}) {
  if (!key || !key.startsWith('RGAPI-')) throw new Error('Set RIOT_API_KEY to your key from developer.riotgames.com (starts with RGAPI-).');
  const stamps = [];
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  async function slot() {
    for (;;) {
      const now = Date.now();
      while (stamps.length && now - stamps[0] > 120_000) stamps.shift();
      const lastSecond = stamps.filter(t => now - t < 1000).length;
      if (stamps.length < perTwoMinutes && lastSecond < perSecond) { stamps.push(now); return; }
      const wait = stamps.length >= perTwoMinutes ? 120_000 - (now - stamps[0]) + 50 : 1000;
      await sleep(Math.max(50, wait));
    }
  }

  async function get(url, tries = 0) {
    await slot();
    const res = await fetch(url, { headers: { 'X-Riot-Token': key } });
    if (res.status === 429 || res.status >= 500) {
      if (tries > 5) throw new Error(`${res.status} after retries: ${url}`);
      const wait = (+res.headers.get('retry-after') || 5) * 1000;
      log(`  ${res.status} from Riot, waiting ${Math.round(wait / 1000)} s`);
      await sleep(wait);
      return get(url, tries + 1);
    }
    if (res.status === 401 || res.status === 403) throw new Error('Riot rejected the key (401/403). Development keys expire after 24 hours: get a new one at developer.riotgames.com.');
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`${res.status}: ${url}`);
    return res.json();
  }

  return {
    league: tier => get(`${PLATFORM}/lol/league/v4/${tier}leagues/by-queue/RANKED_SOLO_5x5`),
    matchIds: (puuid, count = 20) => get(`${REGION}/lol/match/v5/matches/by-puuid/${puuid}/ids?queue=420&type=ranked&start=0&count=${count}`),
    match: id => get(`${REGION}/lol/match/v5/matches/${id}`),
    timeline: id => get(`${REGION}/lol/match/v5/matches/${id}/timeline`)
  };
}
