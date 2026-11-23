# Today

A tiny home-screen app that shows today's training session and nothing else.

**Live:** https://jonesben57.github.io/today-training/

## Put it on your phone

**iPhone (Safari):** open the link → tap Share (on newer iOS: the ••• button, then Share) → scroll down → **Add to Home Screen** → keep "Open as Web App" on → **Add**.

**Android (Chrome):** open the link → ⋮ menu → **Add to Home screen** (or **Install app**) → **Install**.

Open it once from the home screen while you have signal. After that it works with none.

## Change the plan

Everything lives in `plan.js`: exercises, sets, what each weekday is, the timeline and the track progression. The easy way to change it is Frank on the laptop (Training → Edit plan), which rewrites `plan.js` and pushes it.

To edit it by hand: the part between the `/*PLAN*/` and `/*END*/` markers is strict JSON (Frank reads and writes it), so use double quotes, no trailing commas and no comments. Keep the first line and the markers as they are.

| Field | What it does |
| --- | --- |
| `timeZone` | "Today" is worked out in this zone. `null` follows the phone's own setting. |
| `week` | `Mon`…`Sun`, each `{ "title", "workout", "run" }`. `title` is the big heading. `workout` names a gym list in `workouts` (leave it out for no gym). `run` is the pace for the after-uni track session (leave it out for no track). A day with neither is a rest day. |
| `trainingNote` | The line under the heading on training days. |
| `workouts` | Gym lists by name. Each exercise is `["name", "sets × reps"]`. |
| `track` | 400 m repeats: `distance`, `rest`, `firstWeek` (the Monday the count starts, `YYYY-MM-DD`), `startRepeats` (that first week), `addPerWeek` (added each Monday after) and `maxRepeats` (the cap). |
| `trainingDay` | The training-day timeline, top to bottom. Each item is `{ "time", "title" }` plus optionally `"detail"`, `"gym": true` (the day's exercises go under it), `"track": true` (only on days with a `run`; shows as "Track · 6 × 400 m") or `"days": ["Mon", …]` (only on those days; leave it out for every day). |
| `restDay` | The rest-day timeline, with the same rules. |

Then:

```bash
node --test
```

```bash
git commit -am "Update plan" && git push
```

GitHub Pages republishes within a minute or two. The next time the app opens with signal it picks up the change and reloads itself once. There are no version numbers to bump.

`tests/brief.test.js` checks the plan matches the original brief word for word, so it will fail once you change the plan on purpose: update it or delete it. `tests/logic.test.js` keeps checking the date logic either way.

## How it works

- **Today** is the calendar date in Australia/Sydney (`timeZone` in `plan.js`; set it to `null` to follow the phone's own zone). The weekday comes from that date, so daylight saving can't shift it.
- **New day:** the date is re-checked just after midnight (and at least once a minute while open), every time the app comes back on screen, and before any tap is saved.
- **Ticks** are saved on the phone per date (`today.ticks.YYYY-MM-DD`) and kept. A new day starts empty.
- **Log:** the Log button at the bottom lists every day (newest first) with a red tick when everything was done, otherwise how many were done (e.g. 8/14), plus the laps run on track days. Summaries are kept as `today.log.YYYY-MM-DD`. Deleting the app from the home screen deletes the log too.
- **Laps:** the − / + buttons on the track row record how many repeats you actually ran that day. The plan's own number still rises each week.
- **Track repeats** = 5 + whole weeks since Monday 23 Nov 2026, capped at 13.
- **Offline:** `sw.js` saves the app files and both fonts on the phone. It answers from the saved copy instantly, then checks the server for changes in the background.
- **Only today:** the main page shows only today; past days appear only as summaries on the Log page. No links, URL parameters, history or swipes, and every address shows the same page.

## Files

| File | What it is |
| --- | --- |
| `index.html` | the page and the home-screen tags |
| `styles.css` | the look (light and dark) |
| `plan.js` | the plan (JSON between two markers) |
| `app.js` | the logic |
| `sw.js` | offline storage and self-updating |
| `manifest.json` | app name, icons, standalone display |
| `icons/` | home-screen icons (`python3 tools/make-icons.py` redraws them) |
| `tests/` | `node --test` |
