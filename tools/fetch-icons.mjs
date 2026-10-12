// Downloads the champion icons from Riot's Data Dragon into assets/champions/ so the app works offline
// and does not depend on Riot's servers at runtime. Run on a machine with internet: npm run fetch-icons
// (GitHub Actions runs it before each deploy.) Uses only the public Data Dragon CDN, no API key.
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEngine } from '../tests/load-engine.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'assets', 'champions');
mkdirSync(out, { recursive: true });
const DD = 'https://ddragon.leagueoflegends.com';
const json = async url => { const r = await fetch(url); if (!r.ok) throw new Error(`${r.status} ${url}`); return r.json(); };

const [version] = await json(`${DD}/api/versions.json`);
const data = await json(`${DD}/cdn/${version}/data/en_US/champion.json`);
const byName = {}; for (const c of Object.values(data.data)) byName[c.name] = c.id;

const E = loadEngine();
const index = {}, missing = [];
for (const c of E.all()) {
  const id = byName[c.name];
  if (!id) { missing.push(c.name); continue; }
  const file = `${id}.png`;
  if (!existsSync(join(out, file))) {
    const r = await fetch(`${DD}/cdn/${version}/img/champion/${file}`);
    if (!r.ok) { missing.push(c.name); continue; }
    writeFileSync(join(out, file), Buffer.from(await r.arrayBuffer()));
  }
  index[c.name] = file;
}
writeFileSync(join(out, 'index.json'), JSON.stringify(index));
const notInOurData = Object.keys(byName).filter(n => !E.all().some(c => c.name === n));
console.log(`Patch ${version}: ${Object.keys(index).length} icons ready.`);
if (missing.length) console.log(`No icon found for: ${missing.join(', ')} (check the spelling in champions.txt)`);
if (notInOurData.length) console.log(`New champions not in champions.txt yet: ${notInOurData.join(', ')}`);
