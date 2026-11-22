# Today

A tiny home-screen app that shows today's training session and nothing else.

**Live:** https://jonesben57.github.io/today-training/

## Put it on your phone

**iPhone (Safari):** open the link → tap Share (on newer iOS: the ••• button, then Share) → scroll down → **Add to Home Screen** → keep "Open as Web App" on → **Add**.

**Android (Chrome):** open the link → ⋮ menu → **Add to Home screen** (or **Install app**) → **Install**.

Open it once from the home screen while you have signal. After that it works with none.

## Change the plan

Everything lives in the `PLAN` object at the top of `app.js`: exercises, sets, what each weekday is, the timeline and the track progression. Edit it, then:

```bash
node --test
```

```bash
git commit -am "Update plan" && git push
```

GitHub Pages republishes within a minute or two. The next time the app opens with signal it picks up the change and reloads itself once. There are no version numbers to bump.

`tests/brief.test.js` checks the plan matches the original brief word for word, so it will fail once you change the plan on purpose: update it or delete it. `tests/logic.test.js` keeps checking the date logic either way.

## How it works

- **Today** is the calendar date in Australia/Sydney (`PLAN.timeZone`; set it to `null` to follow the phone's own zone). The weekday comes from that date, so daylight saving can't shift it.
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
| `app.js` | `PLAN` at the top, then the logic |
| `sw.js` | offline storage and self-updating |
| `manifest.json` | app name, icons, standalone display |
| `icons/` | home-screen icons (`python3 tools/make-icons.py` redraws them) |
| `tests/` | `node --test` |
