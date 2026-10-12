# Collect real match data

The app works without match data. With it, Draft shows real lane matchups ("in high-elo EUW games, X wins 54% against Y")
and Decision making shows what high-elo teams actually did in the same situation. The report also shows which
of our rules and champion values the data agrees or disagrees with.

Only anonymous aggregates are saved in the repo (`data/derived/`). No player names, no IDs.
Raw match records stay out of git (`data/raw/`).

## Option A: let GitHub do it (no setup on your computer)

1. **Get a key:** developer.riotgames.com → log in → copy the *Development API Key* (starts with `RGAPI-`).
   It expires after 24 hours, so get a fresh one each time.
2. **Save it in the repo:** github.com → your app repo → **Settings → Secrets and variables → Actions →
   New repository secret**. Name: `RIOT_API_KEY`. Value: the key. (Next time: click the secret → **Update**.)
3. **Run:** **Actions → Collect match data → Run workflow**. Type how many matches (1,500 ≈ 1 hour) → **Run workflow**.
4. **Wait.** When it is green it has committed `data/derived/` (with `REPORT.md`), and **Test and deploy** starts by
   itself, so the app is updated with the data a few minutes later.
5. **Run it again** another day to add more matches. Each run adds to the matches already collected
   (kept in the Actions cache for 7 days after the last run).

## Option B: on your own computer

Needs Node.js 22.

```
npm install
RIOT_API_KEY=RGAPI-your-key npm run collect -- --matches 1500
npm run analyze
```

On Windows PowerShell: `$env:RIOT_API_KEY="RGAPI-your-key"; npm run collect -- --matches 1500`

Stop with Ctrl+C at any time and start again; it continues where it stopped.
Then commit `data/derived/` and push.

## What to look at afterwards

`data/derived/REPORT.md`:

- **Draft rules vs real results:** win rate when each rule is met vs not. A rule with a difference close to zero
  (or negative) should weigh less; send me the report and I'll retune the weights.
- **Lane rules vs real results:** whether the type-level counterpick rules hold up.
- **After a kill leaves a team 2+ players up:** how often teams took the objective, a tower, or lost a player.
- **champions.txt values the data disagrees with:** candidates for you to check (Masters eye).

## Good to know

- Development keys are limited to 100 requests per 2 minutes. Each match takes 2 requests, so ~1,500 matches per hour.
- Lane matchups only show in the app once a pair has 30+ games, so they fill in over several runs.
- The key is never written to any file, log or commit.
