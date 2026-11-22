// Date logic, midnight rollover, track progression, ticks and the "only today" rule.
// These read the plan from app.js, so they keep passing after you edit exercises.
// Run from the project folder:  node --test
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT = path.join(__dirname, "..");
const app = require(path.join(ROOT, "app.js"));
const { PLAN } = app;
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

// Every moment below spells out Sydney's UTC offset (+11:00 in summer, +10:00 in winter),
// so the expected answers don't rely on any time-zone code. "+10:30" means "noon-ish on
// that date whichever offset applies", for long sweeps that cross daylight saving.
const dayAt = (iso, plan = PLAN) => app.buildDay(new Date(iso), plan);
const WEEKDAY_KEYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const trackEntry = PLAN.trainingDay.find((entry) => entry.track);

/* ------------------------------------------------------- every weekday -- */

const FIRST_WEEK = [
  ["2026-11-23", "Mon", "Monday 23 November"],
  ["2026-11-24", "Tue", "Tuesday 24 November"],
  ["2026-11-25", "Wed", "Wednesday 25 November"],
  ["2026-11-26", "Thu", "Thursday 26 November"],
  ["2026-11-27", "Fri", "Friday 27 November"],
  ["2026-11-28", "Sat", "Saturday 28 November"],
  ["2026-11-29", "Sun", "Sunday 29 November"],
];

for (const [date, weekday, label] of FIRST_WEEK) {
  test(`${label} shows ${weekday}'s session from 00:00 to 23:59:59.999`, () => {
    const plan = PLAN.week[weekday];
    const isRest = !plan.workout && !plan.run;
    const timeline = (isRest ? PLAN.restDay : PLAN.trainingDay)
      .filter((e) => !e.days || e.days.includes(weekday))
      .filter((e) => (!e.gym || plan.workout) && (!e.track || plan.run));

    for (const clock of ["00:00:00.000", "05:45:00.000", "12:00:00.000", "23:59:59.999"]) {
      const day = dayAt(`${date}T${clock}+11:00`);
      assert.equal(day.key, date, clock);
      assert.equal(day.weekday, weekday);
      assert.equal(day.dateLabel, label);
      assert.equal(day.title, plan.title);
      assert.equal(day.note, isRest ? "" : PLAN.trainingNote);
      assert.deepEqual(day.items.map((i) => i.time), timeline.map((e) => e.time));

      const gym = day.items.find((i) => i.children);
      if (plan.workout) assert.deepEqual(gym.children.map((c) => [c.title, c.detail]), PLAN.workouts[plan.workout]);
      else assert.equal(gym, undefined);

      const track = day.items.find((i) => i.title.startsWith(`${trackEntry.title} · `));
      assert.equal(Boolean(track), Boolean(plan.run), "track only on run days");
      if (track) assert.equal(track.detail, `${plan.run} · ${PLAN.track.rest}`);
    }
  });
}

test("weekday is right for every date across two years (weekday from the calendar date)", () => {
  let checked = 0;
  for (let t = Date.UTC(2026, 10, 1); t <= Date.UTC(2028, 11, 31); t += 86400000) {
    const d = new Date(t);
    const key = d.toISOString().slice(0, 10);
    const day = dayAt(`${key}T12:00:00+10:30`);
    assert.equal(day.key, key);
    assert.equal(day.weekday, WEEKDAY_KEYS[d.getUTCDay()], key);
    assert.equal(day.title, PLAN.week[WEEKDAY_KEYS[d.getUTCDay()]].title, key);
    checked++;
  }
  assert.equal(checked, 792); // 1 Nov 2026 → 31 Dec 2028
});

/* ---------------------------------------------------- midnight rollover -- */

const MIDNIGHTS = [
  // last moment of one day, first moment of the next (Sydney time)
  ["2026-11-22T23:59:59.999+11:00", "2026-11-23T00:00:00.000+11:00", "Sun", "Mon"],
  ["2026-11-23T23:59:59.999+11:00", "2026-11-24T00:00:00.000+11:00", "Mon", "Tue"],
  ["2026-11-24T23:59:59.999+11:00", "2026-11-25T00:00:00.000+11:00", "Tue", "Wed"],
  ["2026-11-25T23:59:59.999+11:00", "2026-11-26T00:00:00.000+11:00", "Wed", "Thu"],
  ["2026-11-26T23:59:59.999+11:00", "2026-11-27T00:00:00.000+11:00", "Thu", "Fri"],
  ["2026-11-27T23:59:59.999+11:00", "2026-11-28T00:00:00.000+11:00", "Fri", "Sat"],
  ["2026-11-28T23:59:59.999+11:00", "2026-11-29T00:00:00.000+11:00", "Sat", "Sun"],
  ["2026-11-29T23:59:59.999+11:00", "2026-11-30T00:00:00.000+11:00", "Sun", "Mon"],
  // New Year
  ["2026-12-31T23:59:59.999+11:00", "2027-01-01T00:00:00.000+11:00", "Thu", "Fri"],
  // Daylight saving ends Sun 4 Apr 2027 (3am → 2am): before and after
  ["2027-04-03T23:59:59.999+11:00", "2027-04-04T00:00:00.000+11:00", "Sat", "Sun"],
  ["2027-04-04T23:59:59.999+10:00", "2027-04-05T00:00:00.000+10:00", "Sun", "Mon"],
  // Daylight saving starts Sun 3 Oct 2027 (2am → 3am): before and after
  ["2027-10-02T23:59:59.999+10:00", "2027-10-03T00:00:00.000+10:00", "Sat", "Sun"],
  ["2027-10-03T23:59:59.999+11:00", "2027-10-04T00:00:00.000+11:00", "Sun", "Mon"],
];

test("midnight: one millisecond before is still the old day, midnight is the new day", () => {
  for (const [before, after, from, to] of MIDNIGHTS) {
    const a = dayAt(before);
    const b = dayAt(after);
    assert.equal(a.weekday, from, before);
    assert.equal(b.weekday, to, after);
    assert.equal(a.title, PLAN.week[from].title);
    assert.equal(b.title, PLAN.week[to].title);
    assert.notEqual(a.key, b.key);
  }
});

test("daylight-saving Sundays stay Sunday all day, including the skipped and repeated hours", () => {
  for (const moment of [
    "2027-04-04T01:59:59+11:00", "2027-04-04T02:30:00+11:00", // first 2:30am…
    "2027-04-04T02:30:00+10:00", "2027-04-04T03:00:00+10:00", // …and the repeated one
    "2027-10-03T01:59:59+10:00", "2027-10-03T03:00:00+11:00", // 2am jumps straight to 3am
  ]) {
    assert.equal(dayAt(moment).weekday, "Sun", moment);
  }
});

test("gives Sydney's answer whatever time zone the phone itself is set to", () => {
  const moments = [...MIDNIGHTS.flatMap(([a, b]) => [a, b]), "2026-11-23T05:45:00+11:00", "2027-04-04T02:30:00+10:00"];
  const script = `
    const app = require(${JSON.stringify(path.join(ROOT, "app.js"))});
    const moments = ${JSON.stringify(moments)};
    process.stdout.write(JSON.stringify({
      offset: new Date("2026-11-23T00:00:00Z").getTimezoneOffset(),
      days: moments.map((m) => { const d = app.buildDay(new Date(m), app.PLAN); return [d.key, d.title, d.items.length]; }),
    }));`;
  const zones = ["Australia/Sydney", "UTC", "America/Los_Angeles", "Asia/Kolkata", "Pacific/Kiritimati", "Pacific/Pago_Pago"];
  const runs = zones.map((zone) => {
    const result = spawnSync(process.execPath, ["-e", script], { env: { ...process.env, TZ: zone }, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout);
  });
  assert.equal(new Set(runs.map((r) => r.offset)).size, zones.length, "the six runs really were in six time zones");
  for (const run of runs) assert.deepEqual(run.days, runs[0].days);
  assert.deepEqual(runs[0].days.map((d) => d[0]), moments.map((m) => dayAt(m).key));
});

test("timeZone: null follows the phone's own zone instead", () => {
  const script = `
    const app = require(${JSON.stringify(path.join(ROOT, "app.js"))});
    const plan = { ...app.PLAN, timeZone: null };
    process.stdout.write(app.buildDay(new Date("2026-11-23T00:00:00+11:00"), plan).key);`;
  const result = spawnSync(process.execPath, ["-e", script], { env: { ...process.env, TZ: "America/Los_Angeles" }, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "2026-11-22"); // still Sunday morning in Los Angeles
});

test("the next date check is just after midnight, and never more than a minute away", () => {
  const wait = (iso) => app.msUntilNextCheck(new Date(iso), PLAN.timeZone);
  assert.equal(wait("2026-11-23T23:59:59.000+11:00"), 1250);
  assert.equal(wait("2026-11-23T23:59:30.000+11:00"), 30250);
  assert.equal(wait("2026-11-23T23:59:00.000+11:00"), 60000);
  assert.equal(wait("2026-11-23T12:00:00.000+11:00"), 60000);
  assert.equal(wait("2026-11-24T00:00:00.000+11:00"), 60000);
});

test("simulated open screen: the day flips within 250 ms after each midnight, DST weekends included", () => {
  const windows = [
    ["2026-11-22T21:00:00.000+11:00", ["2026-11-23T00:00:00+11:00", "2026-11-24T00:00:00+11:00", "2026-11-25T00:00:00+11:00"]],
    ["2027-04-02T21:00:17.123+11:00", ["2027-04-03T00:00:00+11:00", "2027-04-04T00:00:00+11:00", "2027-04-05T00:00:00+10:00"]],
    ["2027-10-01T21:00:59.999+10:00", ["2027-10-02T00:00:00+10:00", "2027-10-03T00:00:00+10:00", "2027-10-04T00:00:00+11:00"]],
  ];
  for (const [start, midnights] of windows) {
    let now = Date.parse(start);
    const end = now + 72 * 3600 * 1000;
    let key = dayAt(start).key;
    const flips = [];
    while (now < end) {
      const wait = app.msUntilNextCheck(new Date(now), PLAN.timeZone);
      assert.ok(wait > 0 && wait <= 60000, `wait of ${wait} ms`);
      now += wait; // the timer fires
      const next = app.buildDay(new Date(now), PLAN).key;
      if (next !== key) {
        flips.push(now);
        key = next;
      }
    }
    assert.equal(flips.length, midnights.length, start);
    flips.forEach((flip, i) => {
      const late = flip - Date.parse(midnights[i]);
      assert.ok(late >= 0 && late <= 250, `${midnights[i]}: flipped ${late} ms after midnight`);
    });
  }
});

/* --------------------------------------------------- track progression -- */

test("track repeats count whole weeks from the start Monday, never below the start or above the cap", () => {
  const track = { ...PLAN.track, firstWeek: "2026-11-23", startRepeats: 5, addPerWeek: 1, maxRepeats: 13 };
  const expected = [
    ["2026-11-16", 5], ["2026-11-22", 5], // before the start
    ["2026-11-23", 5], ["2026-11-29", 5], // all of week one, Monday to Sunday
    ["2026-11-30", 6], ["2026-12-06", 6],
    ["2026-12-07", 7], ["2027-01-11", 12],
    ["2027-01-18", 13], ["2027-01-25", 13], ["2030-01-01", 13], // capped
  ];
  for (const [date, repeats] of expected) assert.equal(app.trackRepeats(date, track), repeats, date);
});

test("week counting isn't thrown by daylight saving or New Year", () => {
  const uncapped = { ...PLAN.track, startRepeats: 1, addPerWeek: 1, maxRepeats: 1000 };
  const cases = [
    ["2027-03-29", "2027-04-04", 1], ["2027-03-29", "2027-04-05", 2], // DST ends
    ["2027-09-27", "2027-10-03", 1], ["2027-09-27", "2027-10-04", 2], // DST starts
    ["2026-12-28", "2027-01-03", 1], ["2026-12-28", "2027-01-04", 2], // New Year
    ["2026-11-23", "2027-11-22", 53], ["2026-11-23", "2028-02-28", 67], ["2026-11-23", "2028-03-06", 68], // leap day
  ];
  for (const [firstWeek, date, repeats] of cases) {
    assert.equal(app.trackRepeats(date, { ...uncapped, firstWeek }), repeats, `${firstWeek} → ${date}`);
  }
});

test("the track line shows the repeats for that date", () => {
  const monday = PLAN.week.Mon;
  if (!monday.run) return; // no run on Mondays any more
  const day = dayAt("2026-11-30T15:00:00+11:00");
  const repeats = app.trackRepeats("2026-11-30", PLAN.track);
  const track = day.items.find((i) => i.title.startsWith(`${trackEntry.title} · `));
  assert.equal(track.title, `${trackEntry.title} · ${repeats} × ${PLAN.track.distance}`);
});

/* --------------------------------------------------------------- ticks -- */

test("tapping toggles an item; tapping Gym ticks or clears all its exercises", () => {
  const day = dayAt("2026-11-23T07:00:00+11:00");
  const gym = day.items.find((i) => i.children);
  const leaf = day.items.find((i) => !i.children);
  let ticks = new Set();

  ticks = app.toggle(ticks, day, leaf.id);
  assert.equal(app.tickState(leaf, ticks), true);
  ticks = app.toggle(ticks, day, leaf.id);
  assert.equal(app.tickState(leaf, ticks), false);

  ticks = app.toggle(ticks, day, gym.children[0].id);
  assert.equal(app.tickState(gym, ticks), "mixed");
  ticks = app.toggle(ticks, day, gym.id); // partly done → all done
  assert.equal(app.tickState(gym, ticks), true);
  assert.ok(gym.children.every((c) => ticks.has(c.id)));
  ticks = app.toggle(ticks, day, gym.id); // all done → none
  assert.equal(app.tickState(gym, ticks), false);
  assert.equal(ticks.size, 0, "Gym itself is never stored, only its exercises");

  assert.deepEqual([...app.toggle(ticks, day, "no-such-item")], []);
});

test("progress counts each exercise and each other item once", () => {
  const day = dayAt("2026-11-23T07:00:00+11:00");
  const leaves = day.items.flatMap((i) => (i.children ? i.children : [i]));
  let ticks = new Set();
  assert.deepEqual(app.progressOf(day, ticks), { done: 0, total: leaves.length });
  ticks = app.toggle(ticks, day, day.items.find((i) => i.children).id);
  ticks = app.toggle(ticks, day, leaves[0].id);
  const gymSize = day.items.find((i) => i.children).children.length;
  assert.deepEqual(app.progressOf(day, ticks), { done: gymSize + 1, total: leaves.length });
});

test("ticks are saved per date: a new day starts empty and old days are cleared", () => {
  const storage = app.memoryStorage();
  storage.setItem("some-other-app", "keep me");
  const store = app.createStore(storage);

  store.save("2026-11-23", new Set(["snack", "gym/lat-pulldown"]));
  assert.deepEqual([...store.load("2026-11-23")].sort(), ["gym/lat-pulldown", "snack"]);
  assert.equal(store.load("2026-11-24").size, 0, "the next day starts empty");

  store.prune("2026-11-24");
  assert.equal(storage.getItem(`${app.STORE_PREFIX}2026-11-23`), null, "yesterday's ticks are gone");
  assert.equal(storage.getItem("some-other-app"), "keep me", "nothing else is touched");
});

test("broken or blocked storage never stops the app", () => {
  const storage = app.memoryStorage();
  storage.setItem(`${app.STORE_PREFIX}2026-11-23`, "{not json");
  assert.equal(app.createStore(storage).load("2026-11-23").size, 0);
  storage.setItem(`${app.STORE_PREFIX}2026-11-24`, '{"an":"object"}');
  assert.equal(app.createStore(storage).load("2026-11-24").size, 0);

  const fail = () => { throw new Error("blocked"); };
  const blocked = app.createStore({ get length() { return fail(); }, key: fail, getItem: fail, setItem: fail, removeItem: fail });
  assert.equal(blocked.load("2026-11-23").size, 0);
  assert.doesNotThrow(() => blocked.save("2026-11-23", new Set(["snack"])));
  assert.doesNotThrow(() => blocked.prune("2026-11-23"));
});

/* ------------------------------------------------------ plan is sound -- */

test("the plan is complete: seven days, real workouts, unique ids", () => {
  assert.deepEqual(Object.keys(PLAN.week).sort(), ["Fri", "Mon", "Sat", "Sun", "Thu", "Tue", "Wed"]);
  for (const [name, day] of Object.entries(PLAN.week)) {
    assert.ok(day.title, `${name} needs a title`);
    if (day.workout) assert.ok(Array.isArray(PLAN.workouts[day.workout]), `${name}: no workout called "${day.workout}"`);
  }
  for (const [name, exercises] of Object.entries(PLAN.workouts)) {
    for (const exercise of exercises) {
      assert.equal(exercise.length, 2, `${name}: each line is [exercise, sets]`);
      assert.ok(exercise[0] && exercise[1], `${name}: empty exercise or sets`);
    }
  }
  for (const [date] of FIRST_WEEK) {
    const day = dayAt(`${date}T12:00:00+11:00`);
    const ids = day.items.flatMap((i) => [i.id, ...(i.children || []).map((c) => c.id)]);
    assert.equal(new Set(ids).size, ids.length, `${date}: duplicate ids`);
  }
});

/* ------------------------------------------------- the shipped files -- */

test("there is no route to another day: no links, address tricks, history, swipes or menus", () => {
  const html = read("index.html");
  const js = read("app.js");
  assert.doesNotMatch(html, /<a[\s>]/i, "links");
  assert.doesNotMatch(html, /<(nav|select|input|form|iframe|dialog)[\s>]/i, "navigation, menus or settings");
  const banned = [
    [/location\.(search|hash|pathname)|location\.href\s*=|URLSearchParams/, "reading or changing the address"],
    [/history\.|popstate|hashchange/, "browser history"],
    [/addEventListener\(\s*["'](touch\w+|pointer\w+|wheel|key\w+|swipe\w*)["']/, "swipe or key handling"],
    [/createElement\(\s*["'](a|select|input|nav)["']|el\(\s*["'](a|select|input|nav)["']/, "links, menus or inputs"],
  ];
  for (const [pattern, what] of banned) assert.doesNotMatch(js, pattern, what);
  assert.match(read("sw.js"), /request\.mode === "navigate"[^\n]*\n\s*event\.respondWith\(page\(\)\)/,
    "every page address gets the same single page");
});

test("home-screen app wiring: manifest, icons, iOS tags, safe areas, offline files, fonts", () => {
  const manifest = JSON.parse(read("manifest.json"));
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "./");
  assert.ok(manifest.icons.some((icon) => icon.purpose === "maskable"));
  const pngSize = (file) => {
    const bytes = fs.readFileSync(path.join(ROOT, file));
    return `${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}`;
  };
  for (const icon of manifest.icons) assert.equal(pngSize(icon.src), icon.sizes, icon.src);

  const html = read("index.html");
  assert.match(html, /<meta name="apple-mobile-web-app-capable" content="yes">/);
  assert.match(html, /<link rel="apple-touch-icon" href="icons\/apple-touch-icon\.png">/);
  assert.equal(pngSize("icons/apple-touch-icon.png"), "180x180");
  assert.match(html, /viewport-fit=cover/);
  assert.match(html, /<link rel="manifest" href="manifest\.json">/);
  for (const side of ["top", "right", "bottom", "left"]) assert.match(read("styles.css"), new RegExp(`env\\(safe-area-inset-${side}`));

  const sw = read("sw.js");
  const appFiles = [...sw.match(/const APP_FILES = \[([\s\S]*?)\];/)[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  for (const file of ["index.html", "styles.css", "app.js", "manifest.json", "icons/apple-touch-icon.png"]) {
    assert.ok(appFiles.includes(file), `${file} is saved for offline use`);
  }
  for (const file of appFiles) if (file !== "./") assert.ok(fs.existsSync(path.join(ROOT, file)), `${file} exists`);

  const fontInSw = sw.match(/const FONT_CSS = "([^"]+)"/)[1];
  assert.ok(html.includes(`<link rel="stylesheet" href="${fontInSw}">`), "index.html and sw.js use the same font address");
});
