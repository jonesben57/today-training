/* =============================================================================
   TODAY — shows today's training session and nothing else.

   ▼ THE PLAN ▼
   Everything you might want to change is in this one object: exercises,
   sets, what each day is, the timeline, the track progression.
   The code underneath adapts on its own. Keep the quotes and commas.
   ============================================================================= */

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const PLAN = {
  // "Today" is worked out in this time zone. Use null to follow the phone's own setting.
  timeZone: "Australia/Sydney",

  // What each weekday is:
  //   title   – the big heading
  //   workout – which gym list (below) to show; leave it out for no gym
  //   run     – pace for the after-uni track session; leave it out for no track
  // A day with no workout and no run is a rest day.
  week: {
    Mon: { title: "Pull + run", workout: "pull", run: "84 s per 400 m (3:30/km)" },
    Tue: { title: "Legs",       workout: "legs" },
    Wed: { title: "Rest" },
    Thu: { title: "Push + run", workout: "push", run: "96 s per 400 m (4:00/km)" },
    Fri: { title: "Pull",       workout: "pull" },
    Sat: { title: "Legs",       workout: "legs" },
    Sun: { title: "Push",       workout: "push" },
  },

  // The line under the heading on training days.
  trainingNote: "2–3 RIR · 2 min rest between sets",

  // Gym sessions. One line per exercise: [name, sets × reps]
  workouts: {
    push: [
      ["Bench press",             "4 × 5–6"],
      ["Standing overhead press", "3 × 6–8"],
      ["JM press",                "2 × 8–12"],
      ["Side lateral raise",      "3 × 10–15"],
    ],
    pull: [
      ["Lat pulldown",            "4 × 6–10"],
      ["Chest-supported row",     "3 × 8–12"],
      ["Barbell bicep curl",      "3 × 8–12"],
      ["Rear delt fly",           "2 × 10–15"],
    ],
    legs: [
      ["Back squat",              "3 × 5–6"],
      ["Sumo deadlift",           "3 × 3–5"],
      ["Bulgarian split squat",   "2 × 8–10 each leg"],
      ["Hip thrust",              "2 × 8–12"],
      ["Nordic curl",             "3 × 3–5"],
      ["Leg extension",           "1 × 10–15"],
    ],
  },

  // Track session: 400 m repeats. The number of repeats goes up by itself each week.
  track: {
    distance: "400 m",
    rest: "60 s rest",
    firstWeek: "2026-11-23", // the Monday the count starts (year-month-day)
    startRepeats: 5,         // repeats in that first week
    addPerWeek: 1,           // added every Monday after that
    maxRepeats: 13,          // never more than this
  },

  // Training-day timeline, top to bottom.
  //   gym: true   → the day's exercises appear under this item
  //   track: true → only on days with a run; shows as "Track · 6 × 400 m"
  //   days: [...] → only on those days (leave out = every day)
  trainingDay: [
    { time: "5:45am",    title: "Snack" },
    { time: "6:00am",    title: "Gym",        gym: true },
    { time: "Then",      title: "Swim",       detail: "30 min easy" },
    { time: "8:00am",    title: "Breakfast" },
    { time: "9am–1pm",   title: "University", days: WEEKDAYS },
    { time: "1pm–2pm",   title: "Lunch" },
    { time: "2pm–5pm",   title: "University", days: WEEKDAYS },
    { time: "After uni", title: "Track",      track: true },
    { time: "7pm–8pm",   title: "Dinner" },
    { time: "10:00pm",   title: "Sleep" },
  ],

  // Rest-day timeline (same "days" rule).
  restDay: [
    { time: "9am–1pm",   title: "University", days: WEEKDAYS },
    { time: "1pm–2pm",   title: "Lunch" },
    { time: "2pm–5pm",   title: "University", days: WEEKDAYS },
    { time: "7pm–8pm",   title: "Dinner" },
    { time: "10:00pm",   title: "Sleep" },
  ],
};

/* ============================ end of the plan ============================== */


(function () {
  "use strict";

  const DAY_KEYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December"];
  const DAY_MS = 24 * 60 * 60 * 1000;
  const MAX_WAIT_MS = 60 * 1000;   // the date is re-checked at least once a minute…
  const AFTER_MIDNIGHT_MS = 250;   // …and this long after every midnight
  const STORE_PREFIX = "today.ticks.";
  const LOG_PREFIX = "today.log.";

  /* ------------------------------------------------------------- dates -- */

  const formatters = new Map();

  // The wall-clock reading of `now` in `timeZone` (the phone's own zone if null).
  function wallClock(now, timeZone) {
    const zone = timeZone || undefined;
    let format = formatters.get(zone);
    if (!format) {
      format = new Intl.DateTimeFormat("en-US", {
        timeZone: zone, hourCycle: "h23",
        year: "numeric", month: "numeric", day: "numeric",
        hour: "numeric", minute: "numeric", second: "numeric",
      });
      formatters.set(zone, format);
    }
    const p = {};
    for (const part of format.formatToParts(now)) p[part.type] = part.value;
    return {
      year: Number(p.year), month: Number(p.month), day: Number(p.day),
      hour: Number(p.hour) % 24, minute: Number(p.minute), second: Number(p.second),
    };
  }

  const pad2 = (n) => String(n).padStart(2, "0");

  // Whole days since 1 Jan 1970 for a calendar date. Pure calendar maths: no time zones,
  // no daylight saving, so day and week counts can never be off by an hour.
  function dayNumber(year, month, day) {
    return Date.UTC(year, month - 1, day) / DAY_MS;
  }

  function dayNumberOfKey(key) {
    const [year, month, day] = key.split("-").map(Number);
    return dayNumber(year, month, day);
  }

  // Today's calendar date in the plan's time zone: { key: "2026-11-23", weekday: 1, … }
  function calendarDate(now, timeZone) {
    const c = wallClock(now, timeZone);
    return {
      key: `${c.year}-${pad2(c.month)}-${pad2(c.day)}`,
      year: c.year,
      month: c.month,
      day: c.day,
      weekday: new Date(Date.UTC(c.year, c.month - 1, c.day)).getUTCDay(), // 0 = Sunday
    };
  }

  // Track repeats on a date: startRepeats in the first week, +addPerWeek each Monday after, capped.
  function trackRepeats(dateKey, track) {
    const weeks = Math.floor((dayNumberOfKey(dateKey) - dayNumberOfKey(track.firstWeek)) / 7);
    const repeats = track.startRepeats + Math.max(0, weeks) * track.addPerWeek;
    return Math.min(track.maxRepeats, repeats);
  }

  // How long to wait before looking at the date again: just past the next midnight,
  // or one minute, whichever comes first.
  function msUntilNextCheck(now, timeZone) {
    const c = wallClock(now, timeZone);
    const msIntoDay = ((c.hour * 60 + c.minute) * 60 + c.second) * 1000 + now.getUTCMilliseconds();
    return Math.min(DAY_MS - msIntoDay + AFTER_MIDNIGHT_MS, MAX_WAIT_MS);
  }

  /* ------------------------------------------------- today's items -- */

  function slug(text) {
    return String(text).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item";
  }

  // The plan + a moment in time → exactly what the screen shows for that day.
  function buildDay(now, plan) {
    const date = calendarDate(now, plan.timeZone);
    const today = plan.week[DAY_KEYS[date.weekday]] || { title: "Rest" };
    const isRest = !today.workout && !today.run;

    const usedIds = new Set();
    const uniqueId = (base) => {
      let id = base;
      for (let n = 2; usedIds.has(id); n++) id = `${base}-${n}`;
      usedIds.add(id);
      return id;
    };

    const items = [];
    for (const entry of isRest ? plan.restDay : plan.trainingDay) {
      if (entry.days && !entry.days.includes(DAY_KEYS[date.weekday])) continue;
      if (entry.gym && !today.workout) continue;
      if (entry.track && !today.run) continue;

      const item = {
        id: uniqueId(slug(entry.title)),
        time: entry.time || "",
        title: entry.title,
        detail: entry.detail || "",
      };

      if (entry.gym) {
        const exercises = plan.workouts[today.workout] ||
          [[`No workout called "${today.workout}"`, "check PLAN.workouts"]];
        item.children = exercises.map(([name, sets]) => ({
          id: uniqueId(`${item.id}/${slug(name)}`),
          title: name,
          detail: sets || "",
        }));
      }

      if (entry.track) {
        const track = plan.track;
        const repeats = trackRepeats(date.key, track);
        item.track = { label: entry.title, repeats, distance: track.distance };
        item.title = trackTitle(item, repeats);
        item.detail = [today.run, track.rest].filter(Boolean).join(" · ");
      }

      items.push(item);
    }

    return {
      key: date.key,
      weekday: DAY_KEYS[date.weekday],
      dateLabel: `${DAY_NAMES[date.weekday]} ${date.day} ${MONTH_NAMES[date.month - 1]}`,
      title: today.title,
      note: isRest ? "" : plan.trainingNote || "",
      items,
    };
  }

  // "Track · 6 × 400 m" with however many laps were actually run.
  function trackTitle(item, laps) {
    return `${item.track.label} · ${laps} × ${item.track.distance}`;
  }

  const MIN_LAPS = 1;
  const MAX_LAPS = 40;
  const clampLaps = (n) => Math.max(MIN_LAPS, Math.min(MAX_LAPS, Math.round(n)));

  /* ------------------------------------------------------------ ticks -- */

  function* everyItem(day) {
    for (const item of day.items) {
      yield item;
      if (item.children) yield* item.children;
    }
  }

  function findItem(day, id) {
    for (const item of everyItem(day)) if (item.id === id) return item;
    return null;
  }

  const hasChildren = (item) => Boolean(item.children && item.children.length);

  // true / false, or "mixed" for a group (Gym) that is partly done.
  function tickState(item, ticks) {
    if (!hasChildren(item)) return ticks.has(item.id);
    const done = item.children.filter((child) => ticks.has(child.id)).length;
    if (done === 0) return false;
    return done === item.children.length ? true : "mixed";
  }

  // How much of today is ticked off, counting each exercise and each other item once.
  function progressOf(day, ticks) {
    let done = 0;
    let total = 0;
    for (const item of everyItem(day)) {
      if (hasChildren(item)) continue;
      total++;
      if (ticks.has(item.id)) done++;
    }
    return { done, total };
  }

  // Tapping an item flips it. Tapping a group ticks all of its exercises,
  // or clears them all if every one was already ticked.
  function toggle(ticks, day, id) {
    const next = new Set(ticks);
    const item = findItem(day, id);
    if (!item) return next;
    if (hasChildren(item)) {
      const allDone = tickState(item, next) === true;
      for (const child of item.children) {
        if (allDone) next.delete(child.id);
        else next.add(child.id);
      }
    } else if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    return next;
  }

  /* ---------------------------------------------------------- storage -- */

  function memoryStorage() {
    const map = new Map();
    return {
      get length() { return map.size; },
      key: (i) => { const keys = [...map.keys()]; return i < keys.length ? keys[i] : null; },
      getItem: (k) => (map.has(k) ? map.get(k) : null),
      setItem: (k, v) => { map.set(k, String(v)); },
      removeItem: (k) => { map.delete(k); },
    };
  }

  // Everything is kept on the phone, per date, and never deleted (that's the log):
  //   "today.ticks.2026-11-23" → ["snack", "gym/bench-press", …]
  //   "today.log.2026-11-23"   → { title: "Pull + run", done: 7, total: 14, laps: 6 }
  function createStore(storage) {
    const attempt = (fn, fallback) => {
      try { return fn(); } catch (_) { return fallback; }
    };
    return {
      load(key) {
        const saved = attempt(() => JSON.parse(storage.getItem(STORE_PREFIX + key)), null);
        return new Set(Array.isArray(saved) ? saved.filter((id) => typeof id === "string") : []);
      },
      save(key, ticks) {
        attempt(() => storage.setItem(STORE_PREFIX + key, JSON.stringify([...ticks])));
      },
      loadRecord(key) {
        const saved = attempt(() => JSON.parse(storage.getItem(LOG_PREFIX + key)), null);
        return saved && typeof saved === "object" && !Array.isArray(saved) ? saved : null;
      },
      saveRecord(key, record) {
        attempt(() => storage.setItem(LOG_PREFIX + key, JSON.stringify(record)));
      },
      // Every saved day: { "2026-11-23": { title, done, total, laps }, … }
      records() {
        return attempt(() => {
          const out = {};
          for (let i = 0; i < storage.length; i++) {
            const k = storage.key(i);
            if (k && k.startsWith(LOG_PREFIX)) {
              const record = this.loadRecord(k.slice(LOG_PREFIX.length));
              if (record) out[k.slice(LOG_PREFIX.length)] = record;
            }
          }
          return out;
        }, {});
      },
    };
  }

  // What the log keeps about a day.
  function summarize(day, ticks, laps) {
    const { done, total } = progressOf(day, ticks);
    const track = day.items.find((item) => item.track);
    const record = { title: day.title, done, total };
    if (track) {
      record.laps = laps == null ? track.track.repeats : laps;
      record.distance = track.track.distance;
    }
    return record;
  }

  // The log, newest first: every day from the first saved one to today, so days
  // the app wasn't used still show up (empty).
  function logEntries(records, todayKey, plan) {
    const keys = Object.keys(records).filter((k) => k <= todayKey).sort();
    const start = keys.length ? dayNumberOfKey(keys[0]) : dayNumberOfKey(todayKey);
    const end = dayNumberOfKey(todayKey);
    const entries = [];
    for (let n = end; n >= start; n--) {
      const d = new Date(n * DAY_MS);
      const key = d.toISOString().slice(0, 10);
      const weekday = d.getUTCDay();
      const record = records[key] || null;
      const planned = plan.week[DAY_KEYS[weekday]] || { title: "Rest" };
      entries.push({
        key,
        isToday: key === todayKey,
        label: `${DAY_NAMES[weekday].slice(0, 3)} ${d.getUTCDate()} ${MONTH_NAMES[d.getUTCMonth()].slice(0, 3)}`,
        title: record ? record.title : planned.title,
        done: record ? record.done : 0,
        total: record ? record.total : 0,
        complete: Boolean(record && record.total > 0 && record.done === record.total),
        laps: record && record.laps != null ? record.laps : null,
        distance: record ? record.distance || null : null,
      });
    }
    return entries;
  }

  /* ----------------------------------------------------------- screen -- */

  const SVG_NS = "http://www.w3.org/2000/svg";

  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    if (attrs) for (const name in attrs) if (attrs[name] != null) node.setAttribute(name, attrs[name]);
    for (const child of children) if (child != null && child !== "") node.append(child);
    return node;
  }

  function setChildren(node, children) {
    node.textContent = "";
    node.append(...children);
  }

  function tickMark() {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 12 12");
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", "M2.6 6.3l2.3 2.3 4.6-5");
    svg.append(path);
    return el("span", { class: "mark", "aria-hidden": "true" }, svg);
  }

  // Keep "400 m", "60 s", "4 × 5–6", "½ scoop" and "each leg" from splitting across two lines.
  function tidy(text) {
    return String(text)
      .replace(/(\d) (s|m|min|km|kg)\b/g, "$1 $2")
      .replace(/ × /g, " × ")
      .replace(/([½¼¾⅓⅔]) /g, "$1 ")
      .replace(/\b(each|per) (\w)/g, "$1 $2"); // "each leg" stays on one line
  }

  // One tappable line. Exercises get a station number ("01") and their sets underneath.
  function row(item, stationNumber) {
    const isExercise = Boolean(stationNumber);
    return el("button", { type: "button", class: "row", "data-id": item.id, "aria-pressed": "false" },
      el("span", { class: "time" }, item.time),
      tickMark(),
      el("span", { class: "body" },
        isExercise ? el("span", { class: "num" }, pad2(stationNumber)) : null,
        el("span", { class: "name" }, tidy(item.title)),
        item.detail ? el("span", { class: isExercise ? "sets" : "detail" }, tidy(item.detail)) : null));
  }

  // The "+" in "Pull + run" picks up the accent colour.
  function titleParts(text) {
    return String(text).split(/(\+)/).filter(Boolean)
      .map((part) => (part === "+" ? el("span", { class: "plus" }, "+") : part));
  }

  function draw(day, view) {
    view.date.textContent = day.dateLabel;
    setChildren(view.title, titleParts(day.title));
    view.note.textContent = day.note;
    setChildren(view.list, day.items.map((item) => {
      const li = el("li", { class: hasChildren(item) ? "item group" : "item" }, row(item, 0));
      if (hasChildren(item)) {
        li.append(el("ul", { class: "sub" },
          ...item.children.map((child, i) => el("li", null, row(child, i + 1)))));
      }
      if (item.track) {
        // − / + to log how many laps were actually run (sits beside the row, not inside it).
        li.classList.add("has-laps");
        li.append(el("span", { class: "laps" },
          el("button", { type: "button", class: "lap", "data-step": "-1", "aria-label": "One lap fewer" }, "−"),
          el("button", { type: "button", class: "lap", "data-step": "1", "aria-label": "One lap more" }, "+")));
      }
      return li;
    }));
    const rows = [...view.list.querySelectorAll(".row")];
    if (rows.length) {
      rows[0].classList.add("is-first");
      rows[rows.length - 1].classList.add("is-last");
    }
    view.buttons = new Map(rows.map((button) => [button.dataset.id, button]));
  }

  function paint(day, ticks, view, laps) {
    for (const item of everyItem(day)) {
      const button = view.buttons.get(item.id);
      if (button) button.setAttribute("aria-pressed", String(tickState(item, ticks)));
      if (button && item.track) {
        button.querySelector(".name").textContent = tidy(trackTitle(item, laps == null ? item.track.repeats : laps));
      }
    }
    const { done, total } = progressOf(day, ticks);
    view.progress.style.setProperty("--done", String(total ? done / total : 0));
    view.progress.setAttribute("aria-valuemax", String(total));
    view.progress.setAttribute("aria-valuenow", String(done));
    view.progress.setAttribute("aria-valuetext", `${done} of ${total} done`);
  }

  // Make the whole day fill exactly one screen: tighten the spacing (--k in styles.css)
  // if the day is too tall, or loosen it (up to 1.5×) if there's room to spare.
  function fitToScreen() {
    const root = document.documentElement;
    const main = document.getElementById("app");
    if (main) main.style.minHeight = `${window.innerHeight}px`; // keeps the switch at the very bottom
    const step = (k, by) => Math.round((k + by) * 10) / 10;
    const fits = (k) => {
      root.style.setProperty("--k", String(k));
      return root.scrollHeight <= window.innerHeight;
    };
    let k = 1;
    if (fits(k)) {
      while (k < 1.5 && fits(step(k, 0.1))) k = step(k, 0.1);
    } else {
      while (k > 0.3 && !fits(k)) k = step(k, -0.1);
    }
    root.style.setProperty("--k", String(k));
  }

  // The Log page: every day, newest first, with a red tick when everything was done.
  function drawLog(list, entries) {
    setChildren(list, entries.map((entry) => {
      const status = entry.complete
        ? el("span", { class: "log-status done", "aria-label": "All done" }, tickMark())
        : el("span", { class: "log-status" }, entry.total ? `${entry.done}/${entry.total}` : "–");
      return el("li", { class: entry.isToday ? "log-day is-today" : "log-day" },
        el("span", { class: "log-date" }, entry.isToday ? "Today" : entry.label),
        el("span", { class: "log-what" },
          el("span", { class: "log-title" }, entry.title),
          entry.laps != null ? el("span", { class: "log-laps" }, tidy(`${entry.laps} × ${entry.distance || "400 m"}`)) : null),
        status);
    }));
  }

  // The light/dark switch at the bottom. Until it's tapped, it follows the phone's setting;
  // after that it remembers the choice ("today.theme" on the phone).
  const THEME_KEY = "today.theme";

  function setupThemeSwitch() {
    const button = document.getElementById("theme");
    if (!button) return;
    const root = document.documentElement;
    const phoneIsDark = window.matchMedia("(prefers-color-scheme: dark)");
    const isDark = () => (root.dataset.theme ? root.dataset.theme === "dark" : phoneIsDark.matches);

    const show = () => {
      button.setAttribute("aria-checked", String(isDark()));
      const bg = getComputedStyle(root).getPropertyValue("--bg").trim();
      for (const meta of document.querySelectorAll('meta[name="theme-color"]')) meta.setAttribute("content", bg);
    };

    button.addEventListener("click", () => {
      const next = isDark() ? "light" : "dark";
      root.dataset.theme = next;
      try { localStorage.setItem(THEME_KEY, next); } catch (_) { /* not saved, still switched */ }
      show();
    });
    if (phoneIsDark.addEventListener) phoneIsDark.addEventListener("change", show);
    show();
  }

  function openStorage() {
    try {
      const storage = window.localStorage;
      storage.getItem(STORE_PREFIX);
      return storage;
    } catch (_) {
      return memoryStorage(); // storage blocked: ticks still work until the app closes
    }
  }

  function boot() {
    const view = {
      date: document.getElementById("date"),
      title: document.getElementById("title"),
      note: document.getElementById("note"),
      list: document.getElementById("timeline"),
      progress: document.getElementById("progress"),
      buttons: new Map(),
    };
    const store = createStore(openStorage());
    const log = {
      page: document.getElementById("log"),
      list: document.getElementById("log-list"),
      open: document.getElementById("log-open"),
      close: document.getElementById("log-close"),
    };
    let day = null;
    let ticks = new Set();
    let laps = null; // laps actually run today (null = the plan's number)
    let timer = 0;

    const saveDay = () => {
      store.save(day.key, ticks);
      store.saveRecord(day.key, summarize(day, ticks, laps));
    };
    const showLog = () => drawLog(log.list, logEntries(store.records(), day.key, PLAN));

    // Show today. Cheap enough to call often: it only redraws when the date has changed.
    function refresh() {
      const next = buildDay(new Date(), PLAN);
      if (!day || next.key !== day.key) {
        day = next;
        ticks = store.load(day.key);
        const record = store.loadRecord(day.key);
        laps = record && record.laps != null ? clampLaps(record.laps) : null;
        draw(day, view);
        paint(day, ticks, view, laps);
        fitToScreen();
        if (log.page && !log.page.hidden) showLog();
      }
      clearTimeout(timer);
      timer = setTimeout(refresh, msUntilNextCheck(new Date(), PLAN.timeZone));
    }

    view.list.addEventListener("click", (event) => {
      const lap = event.target.closest("button.lap");
      const button = event.target.closest("button.row");
      if ((!lap && !button) || !day) return;
      // Midnight passed while yesterday was still on screen: show today instead of ticking.
      if (calendarDate(new Date(), PLAN.timeZone).key !== day.key) {
        refresh();
        return;
      }
      if (lap) {
        const track = day.items.find((item) => item.track);
        laps = clampLaps((laps == null ? track.track.repeats : laps) + Number(lap.dataset.step));
      } else {
        ticks = toggle(ticks, day, button.dataset.id);
      }
      saveDay();
      paint(day, ticks, view, laps);
    });

    if (log.page && log.open && log.close) {
      log.open.addEventListener("click", () => {
        showLog();
        log.page.hidden = false;
        log.page.scrollTop = 0;
        document.documentElement.classList.add("log-open");
      });
      log.close.addEventListener("click", () => {
        log.page.hidden = true;
        document.documentElement.classList.remove("log-open");
      });
    }

    // Ask the phone to keep this app's saved data even when space runs low (where supported).
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

    // Back on screen (from the background, another app, the lock screen): re-check the date.
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") refresh();
    });
    window.addEventListener("pageshow", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("resize", fitToScreen); // rotation, Safari's bars appearing
    if (document.fonts) document.fonts.ready.then(fitToScreen); // real fonts change line widths

    setupThemeSwitch();
    refresh();
    document.body.setAttribute("data-ready", "");
    startOffline();
  }

  /* ---------------------------------------------------------- offline -- */

  function startOffline() {
    if (!("serviceWorker" in navigator)) return;
    const sw = navigator.serviceWorker;
    const hadController = Boolean(sw.controller);
    sw.register("sw.js").catch(() => {});
    // sw.js found a newer copy of the app (e.g. an edited plan): reload once to show it.
    sw.addEventListener("message", (event) => {
      if (event.data && event.data.type === "updated") reloadOnce();
    });
    sw.addEventListener("controllerchange", () => {
      if (hadController) reloadOnce();
    });
    // Back on screen after a while in the background: ask sw.js to look for a newer copy.
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && sw.controller) sw.controller.postMessage({ type: "check" });
    });
  }

  function reloadOnce() {
    try {
      const last = Number(sessionStorage.getItem("today.reloadedAt")) || 0;
      if (Date.now() - last < 30 * 1000) return;
      sessionStorage.setItem("today.reloadedAt", String(Date.now()));
    } catch (_) {
      // no sessionStorage: reload anyway
    }
    location.reload();
  }

  /* -------------------------------------------------------------------- */

  const api = {
    PLAN, STORE_PREFIX, wallClock, calendarDate, trackRepeats, msUntilNextCheck,
    buildDay, tickState, progressOf, toggle, createStore, memoryStorage,
    summarize, logEntries, trackTitle, clampLaps, LOG_PREFIX,
  };
  if (typeof module === "object" && module.exports) module.exports = api; // for the tests
  if (typeof document !== "undefined") boot();
})();
