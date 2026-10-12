# From test app to App Store

The app is built so the same code runs as a web app and as a native iOS/Android app (Capacitor).
Nothing has to be rewritten; the native apps are generated from `dist/site`.

## Ready in the code

| Item | Status |
| --- | --- |
| Native wrapper (Capacitor 8), app ID `dk.queuetrainer.app` (change in `capacitor.config.json` before first upload) | Done |
| Works offline: fonts and champion icons ship with the app | Done (icons are downloaded at build time) |
| Progress saved with the app's own storage (iOS may clear browser storage) | Done |
| Real haptics on iPhone/Android (correct / wrong answer) | Done |
| App icon + splash screen sources (`assets/*.png`) | Done (placeholder logo, replace when you have a final one) |
| Privacy policy page (`privacy.html`, linked in Settings) | Done |
| Release build without "Test build" label (`npm run build:release`) | Done |
| No accounts, no tracking, no third-party requests (tested) | Done |
| Android test build and iOS compile check on GitHub | Done (`Native apps` workflow) |

## Test it before anything is sent to Apple

**1. On any phone, as a web app (already working)**
Open the GitHub Pages link → *Add to Home Screen*. Same screens and logic as the native app.

**2. As a real Android app (no setup)**
GitHub → **Actions → Native apps → Run workflow**. When it is green (about 10 min), open the run →
**Artifacts → queue-trainer-android-test** → unzip → copy `app-debug.apk` to an Android phone → open it
(allow "install unknown apps" once).

**3. As a real iPhone app**
The same workflow compiles the iPhone app to prove it builds. To install it on your own iPhone you need either:
- **A Mac with Xcode** (free Apple ID is enough for your own phone, renewed every 7 days):
  `npm ci` → `npm run fetch-icons` → `npm run app:sync` → `npx cap add ios` (first time) → `npx cap open ios` → press Run with your iPhone connected.
- **No Mac:** an Apple Developer account (99 USD/year) + a cloud build service (for example Codemagic's free tier)
  that builds and sends it to **TestFlight**, Apple's test app. You install TestFlight and get the build there.

## When Riot has said yes: submitting

1. **Apple Developer Program** (developer.apple.com, 99 USD/year).
2. **Final name and app ID**: decide the name, check it is free in App Store Connect, set `appId`/`appName` in `capacitor.config.json`.
3. **Final logo**: replace `assets/icon.svg` → `npm run app:icons` → `npx @capacitor/assets@3.0.5 generate`.
4. **App Store Connect listing**: description, keywords (never "League of Legends" in the name or keywords),
   screenshots (6.7" and 6.5" iPhone), age rating, privacy URL = your GitHub Pages link + `/privacy.html`,
   privacy answers: "Data not collected".
5. **Riot's written permission**: keep it ready; App Review may ask for proof that you may use champion names and images.
6. **Build and upload** with Xcode (Product → Archive → Distribute) or the cloud build service → TestFlight → Submit for review.

## Commands

| Command | What it does |
| --- | --- |
| `npm run fetch-icons` | Downloads champion icons for the current patch into `assets/champions/` |
| `npm run build:release` | Store build (no test label) |
| `npm run app:sync` | Release build + copy into the native projects |
| `npm run app:icons` | Re-renders icon and splash PNGs from `assets/icon.svg` |
