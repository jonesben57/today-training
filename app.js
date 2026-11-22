/* =============================================================================
   TODAY — shows today's training session and nothing else.

   ▼ THE PLAN ▼
   Everything you might want to change is in this one object: exercises,
   sets, what each day is, the timeline, the track progression.
   The code underneath adapts on its own. Keep the quotes and commas.
   ============================================================================= */

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
  trainingDay: [
    { time: "5:45am",    title: "Snack",     detail: "2 kiwis or a banana + ½ scoop whey in water" },
    { time: "6:00am",    title: "Gym",       gym: true },
    { time: "Then",      title: "Swim",      detail: "30 min easy" },
    { time: "After",     title: "Breakfast" },
    { time: "After uni", title: "Track",     track: true },
    { time: "10:00pm",   title: "Sleep" },
  ],

  // Rest-day timeline.
  restDay: [
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
        item.title = `${entry.title} · ${trackRepeats(date.key, track)} × ${track.distance}`;
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

  // Ticks are kept per date: "today.ticks.2026-11-23" → ["snack", "gym/bench-press", …]
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
      // Forget every other day's ticks. Only touches keys starting with "today.ticks.".
      prune(keepKey) {
        attempt(() => {
          const old = [];
          for (let i = 0; i < storage.length; i++) {
            const k = storage.key(i);
            if (k && k.startsWith(STORE_PREFIX) && k !== STORE_PREFIX + keepKey) old.push(k);
          }
          old.forEach((k) => storage.removeItem(k));
        });
      },
    };
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

  // Keep "400 m", "60 s", "4 × 5–6" and "½ scoop" from splitting across two lines.
  function tidy(text) {
    return String(text)
      .replace(/(\d) (s|m|min|km|kg)\b/g, "$1 $2")
      .replace(/ × /g, " × ")
      .replace(/([½¼¾⅓⅔]) /g, "$1 ");
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
      return li;
    }));
    const rows = [...view.list.querySelectorAll(".row")];
    if (rows.length) {
      rows[0].classList.add("is-first");
      rows[rows.length - 1].classList.add("is-last");
    }
    view.buttons = new Map(rows.map((button) => [button.dataset.id, button]));
  }

  function paint(day, ticks, view) {
    for (const item of everyItem(day)) {
      const button = view.buttons.get(item.id);
      if (button) button.setAttribute("aria-pressed", String(tickState(item, ticks)));
    }
    const { done, total } = progressOf(day, ticks);
    view.progress.style.setProperty("--done", String(total ? done / total : 0));
    view.progress.setAttribute("aria-valuemax", String(total));
    view.progress.setAttribute("aria-valuenow", String(done));
    view.progress.setAttribute("aria-valuetext", `${done} of ${total} done`);
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
    let day = null;
    let ticks = new Set();
    let timer = 0;

    // Show today. Cheap enough to call often: it only redraws when the date has changed.
    function refresh() {
      const next = buildDay(new Date(), PLAN);
      if (!day || next.key !== day.key) {
        day = next;
        ticks = store.load(day.key);
        store.prune(day.key);
        draw(day, view);
        paint(day, ticks, view);
      }
      clearTimeout(timer);
      timer = setTimeout(refresh, msUntilNextCheck(new Date(), PLAN.timeZone));
    }

    view.list.addEventListener("click", (event) => {
      const button = event.target.closest("button.row");
      if (!button || !day) return;
      // Midnight passed while yesterday was still on screen: show today instead of ticking.
      if (calendarDate(new Date(), PLAN.timeZone).key !== day.key) {
        refresh();
        return;
      }
      ticks = toggle(ticks, day, button.dataset.id);
      store.save(day.key, ticks);
      paint(day, ticks, view);
    });

    // Back on screen (from the background, another app, the lock screen): re-check the date.
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") refresh();
    });
    window.addEventListener("pageshow", refresh);
    window.addEventListener("focus", refresh);

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
  };
  if (typeof module === "object" && module.exports) module.exports = api; // for the tests
  if (typeof document !== "undefined") boot();
})();
