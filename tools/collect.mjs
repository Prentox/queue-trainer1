// Collects recent EUW solo-queue matches from Challenger and Grandmaster players.
// Usage:  RIOT_API_KEY=RGAPI-... node tools/collect.mjs --matches 3000
// Resumable: stop it any time (Ctrl+C) and run it again; it skips matches it already has.
// Output (not committed): data/raw/matches.jsonl (anonymous records) and data/raw/seen.txt (IDs already fetched).
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from './riot.mjs';
import { compact } from './compact.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rawDir = join(root, 'data', 'raw');
mkdirSync(rawDir, { recursive: true });
const seenFile = join(rawDir, 'seen.txt'), outFile = join(rawDir, 'matches.jsonl');

const arg = (name, def) => { const i = process.argv.indexOf('--' + name); return i > 0 ? process.argv[i + 1] : def; };
const target = +arg('matches', 1500);
const tiers = arg('tiers', 'challenger,grandmaster').split(',');

if (target <= 0) { console.log('0 new matches requested: skipping collection, the analysis runs on the matches already saved.'); process.exit(0); }
const api = createClient(process.env.RIOT_API_KEY);
const seen = new Set(existsSync(seenFile) ? readFileSync(seenFile, 'utf8').split('\n').filter(Boolean) : []);
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

console.log(`Already have ${seen.size} matches. Collecting ${target} more from EUW ${tiers.join(' + ')}.`);
const puuids = [];
for (const tier of tiers) {
  const league = await api.league(tier);
  const n = (league && league.entries || []).map(e => e.puuid).filter(Boolean);
  console.log(`  ${tier}: ${n.length} players`);
  puuids.push(...n);
}
if (!puuids.length) throw new Error('No players found. Check the key and region.');

let got = 0; const t0 = Date.now();
for (const puuid of shuffle(puuids)) {
  if (got >= target) break;
  const ids = (await api.matchIds(puuid, 20)) || [];
  for (const id of ids) {
    if (got >= target) break;
    if (seen.has(id)) continue;
    seen.add(id); appendFileSync(seenFile, id + '\n');
    const match = await api.match(id);
    if (!match || match.info.queueId !== 420 || match.info.gameDuration < 15 * 60) continue;
    const timeline = await api.timeline(id);
    appendFileSync(outFile, JSON.stringify(compact(match, timeline)) + '\n');
    got++;
    if (got % 25 === 0) {
      const perHour = got / ((Date.now() - t0) / 3_600_000);
      console.log(`  ${got}/${target} matches · ${Math.round(perHour)} per hour · about ${Math.round((target - got) / perHour * 60)} min left`);
    }
  }
}
console.log(`Done: ${got} new matches saved. Next: npm run analyze`);
