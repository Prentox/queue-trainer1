# Queue Trainer (test build)

Short training games for League of Legends players to play while they wait in queue.
Not endorsed by Riot Games. Not for public release until Riot has approved the project.

## How it works

- One static web app. All logic runs on the phone: no server, no database, no login.
  GitHub Pages hosts it for free at any number of users.
- `src/champions.txt` – champion data (one line per champion, 12 attributes).
- `src/engine.js` – generates Draft and Decision tasks, finds the right answer, writes the explanation.
  Rule weights are in the `W` object at the top.
- `src/ui.js` + `src/app.html` – screens and styling.
- `build.mjs` – puts it all together into `dist/site/`.

## Tests

| Command | What it checks |
| --- | --- |
| `npm run test:engine` | Champion data is valid; 1,200 drafts and 800 decisions are valid and explained; no rule decides more than 45%; the enemy is the main reason in 35%+ of drafts; no champion is the answer more than 20% of the time; teamfight, split and pick all win (no style over 70%); lane matchups explain 30%+ of laner drafts; a champion pool rotates (no champion over 40%); Draft options come only from your pool when it has 3+ champions (any role); with 2, one random extra option and in Decision making you play a pool champion; decisions use the champions in 50%+ of explanations, no action is the answer over 30%, split/pick answers only for champions built for it |
| `tests/pipeline.test.mjs` (part of test:engine) | The data pipeline on synthetic matches: records are anonymous, all API champion names map, analysis runs, data reaches the explanations |
| `npm run test:ui` | On a phone-sized screen: onboarding, champion pool, a full Draft round, a full Decision round, settings, answers lock after one tap, progress survives a reload, a round in progress continues after closing the app, no script errors, no third-party requests |
| `npm run balance` | Prints how often each rule decides the answer (for tuning) |
| `npm run test:build` | Release build has no test label, bundled fonts (no Google requests), privacy page, manifest, offline cache, native app files |
| `npm test` | Build + all of the above |

GitHub runs every test on every push. The site is only published if all tests pass.

## Run it on your own computer (optional)

Needs Node.js 22 (nodejs.org).

```
npm install
npx playwright install chromium
npm test
```

Open `dist/site/index.html` in a browser to play.

## Native app (App Store / Google Play)

See [APP-STORE.md](APP-STORE.md): how to test it as a real Android or iPhone app, and the steps to submit once Riot has approved.

## Real match data

See [RUN-DATA.md](RUN-DATA.md): collect EUW Challenger/Grandmaster matches with a Riot development key
(on GitHub with one click, or locally), analyse them, and the app uses the results on the next deploy.

| Command | What it does |
| --- | --- |
| `npm run collect -- --matches 1500` | Fetches matches (needs `RIOT_API_KEY`) |
| `npm run analyze` | Writes `data/derived/` and `REPORT.md` |

## Change something

- **Champion values:** edit the line in `src/champions.txt`, push. Format is explained at the top of the file.
- **Rule weights:** edit `W` in `src/engine.js`, run `npm run balance`, push.
- After a push, check the **Actions** tab: green means tested and live, red means a test failed and nothing was published.
