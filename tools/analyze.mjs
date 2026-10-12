// Reads data/raw/matches.jsonl and writes aggregate results to data/derived/ (safe to commit).
// Usage: npm run analyze
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEngine } from '../tests/load-engine.mjs';
import { championIndex, championStats, suggestions, compRules, lanes, situations, report, decisionMoments, decisionCheck, decisionReport } from './analyze-lib.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rawFile = join(root, 'data', 'raw', 'matches.jsonl');
if (!existsSync(rawFile)) throw new Error('No data yet. Run: RIOT_API_KEY=RGAPI-... npm run collect');
const matches = readFileSync(rawFile, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l));
const E = loadEngine(), find = championIndex(E);
const unknown = [...new Set(matches.flatMap(m => m.p.map(p => p.ch)).filter(n => !find(n)))];

const champStats = championStats(matches, find);
const sugg = suggestions(E, champStats);
const comp = compRules(E, matches, find);
const lane = lanes(E, matches, find);
const sit = situations(matches);
const dec = decisionCheck(decisionMoments(E, matches, find));
const patches = [...new Set(matches.map(m => m.v))].sort();

const out = join(root, 'data', 'derived');
mkdirSync(out, { recursive: true });
const save = (f, d) => writeFileSync(join(out, f), JSON.stringify(d, null, 1));
save('champions.json', champStats);
save('suggestions.json', sugg);
save('draft-rules.json', comp);
save('lanes.json', lane);
save('situations.json', sit);
save('decisions.json', dec);
writeFileSync(join(out, 'REPORT.md'), report({ n: matches.length, patches, champStats, sugg, comp, lane, sit, unknown }) + '\n' + decisionReport(dec));
console.log(`Analysed ${matches.length} matches. Read data/derived/REPORT.md`);
