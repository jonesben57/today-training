// Checks that the plan in app.js matches the original brief (23 Nov 2026) word for word.
// Once you change the plan on purpose, update the expected values here or delete this file;
// logic.test.js keeps checking the date logic either way.
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const app = require(path.join(__dirname, "..", "app.js"));
const dayAt = (iso) => app.buildDay(new Date(iso), app.PLAN);
const lines = (day) => day.items.map((i) => [i.time, i.title, i.detail]);
const exercises = (day) => day.items.find((i) => i.children).children.map((c) => [c.title, c.detail]);

const PUSH = [
  ["Bench press", "4 × 5–6"],
  ["Standing overhead press", "3 × 6–8"],
  ["JM press", "2 × 8–12"],
  ["Side lateral raise", "3 × 10–15"],
];
const PULL = [
  ["Lat pulldown", "4 × 6–10"],
  ["Chest-supported row", "3 × 8–12"],
  ["Barbell bicep curl", "3 × 8–12"],
  ["Rear delt fly", "2 × 10–15"],
];
const LEGS = [
  ["Back squat", "3 × 5–6"],
  ["Sumo deadlift", "3 × 3–5"],
  ["Bulgarian split squat", "2 × 8–10 each leg"],
  ["Hip thrust", "2 × 8–12"],
  ["Nordic curl", "3 × 3–5"],
  ["Leg extension", "1 × 10–15"],
];

const trainingDay = (track) => [
  ["5:45am", "Snack", "2 kiwis or a banana + ½ scoop whey in water"],
  ["6:00am", "Gym", ""],
  ["Then", "Swim", "30 min easy"],
  ["After", "Breakfast", ""],
  ...(track ? [["After uni", ...track]] : []),
  ["10:00pm", "Sleep", ""],
];

test("today is worked out in Sydney time", () => {
  assert.equal(app.PLAN.timeZone, "Australia/Sydney");
});

test("Monday: Pull + run, with the track session at 84 s per 400 m", () => {
  const day = dayAt("2026-11-23T09:00:00+11:00");
  assert.equal(day.dateLabel, "Monday 23 November");
  assert.equal(day.title, "Pull + run");
  assert.equal(day.note, "2–3 RIR · 2 min rest between sets");
  assert.deepEqual(lines(day), trainingDay(["Track · 5 × 400 m", "84 s per 400 m (3:30/km) · 60 s rest"]));
  assert.deepEqual(exercises(day), PULL);
});

test("Tuesday: Legs, no track", () => {
  const day = dayAt("2026-11-24T09:00:00+11:00");
  assert.equal(day.title, "Legs");
  assert.equal(day.note, "2–3 RIR · 2 min rest between sets");
  assert.deepEqual(lines(day), trainingDay(null));
  assert.deepEqual(exercises(day), LEGS);
});

test("Wednesday: Rest, and only 10:00pm Sleep", () => {
  const day = dayAt("2026-11-25T09:00:00+11:00");
  assert.equal(day.title, "Rest");
  assert.equal(day.note, "");
  assert.deepEqual(lines(day), [["10:00pm", "Sleep", ""]]);
});

test("Thursday: Push + run, with the track session at 96 s per 400 m", () => {
  const day = dayAt("2026-11-26T09:00:00+11:00");
  assert.equal(day.title, "Push + run");
  assert.deepEqual(lines(day), trainingDay(["Track · 5 × 400 m", "96 s per 400 m (4:00/km) · 60 s rest"]));
  assert.deepEqual(exercises(day), PUSH);
});

test("Friday Pull, Saturday Legs, Sunday Push, none with a track session", () => {
  for (const [date, title, list] of [
    ["2026-11-27", "Pull", PULL],
    ["2026-11-28", "Legs", LEGS],
    ["2026-11-29", "Push", PUSH],
  ]) {
    const day = dayAt(`${date}T09:00:00+11:00`);
    assert.equal(day.title, title, date);
    assert.deepEqual(lines(day), trainingDay(null), date);
    assert.deepEqual(exercises(day), list, date);
  }
});

test("track repeats: 5 in the week of Mon 23 Nov 2026, +1 each week, capped at 13", () => {
  const schedule = [
    // Monday and Thursday of each week
    ["2026-11-23", "2026-11-26", 5],
    ["2026-11-30", "2026-12-03", 6],
    ["2026-12-07", "2026-12-10", 7],
    ["2026-12-14", "2026-12-17", 8],
    ["2026-12-21", "2026-12-24", 9],
    ["2026-12-28", "2026-12-31", 10],
    ["2027-01-04", "2027-01-07", 11],
    ["2027-01-11", "2027-01-14", 12],
    ["2027-01-18", "2027-01-21", 13],
    ["2027-01-25", "2027-01-28", 13],
    ["2027-06-07", "2027-06-10", 13],
  ];
  for (const [monday, thursday, repeats] of schedule) {
    const mon = dayAt(`${monday}T12:00:00+10:30`);
    const thu = dayAt(`${thursday}T12:00:00+10:30`);
    assert.equal(mon.weekday, "Mon", monday);
    assert.equal(thu.weekday, "Thu", thursday);
    const track = (day) => day.items.find((i) => i.time === "After uni");
    assert.deepEqual([track(mon).title, track(mon).detail],
      [`Track · ${repeats} × 400 m`, "84 s per 400 m (3:30/km) · 60 s rest"], monday);
    assert.deepEqual([track(thu).title, track(thu).detail],
      [`Track · ${repeats} × 400 m`, "96 s per 400 m (4:00/km) · 60 s rest"], thursday);
  }
});
