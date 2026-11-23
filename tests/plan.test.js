// Checks that plan.js is a plan the app can show, whatever its contents.
// The plan is edited from Frank (Training → Edit plan) or by hand, so nothing here
// checks particular exercises or wording: only the shape the app relies on.
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const app = require(path.join(__dirname, "..", "app.js"));
const { PLAN } = app;
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const isText = (value) => typeof value === "string" && value.trim() !== "";
const isWhole = (value) => Number.isInteger(value);

test("week: all seven days, each with a title; workouts it names exist", () => {
  assert.deepEqual(Object.keys(PLAN.week).sort(), [...DAYS].sort());
  for (const [day, plan] of Object.entries(PLAN.week)) {
    assert.ok(isText(plan.title), `${day} needs a title`);
    if ("workout" in plan) assert.ok(Array.isArray(PLAN.workouts[plan.workout]), `${day}: no workout called "${plan.workout}"`);
    if ("run" in plan) assert.ok(isText(plan.run), `${day}: run must be text`);
  }
  assert.equal(typeof PLAN.trainingNote, "string");
});

test("workouts: each exercise is [name, sets]", () => {
  for (const [name, exercises] of Object.entries(PLAN.workouts)) {
    assert.ok(Array.isArray(exercises) && exercises.length > 0, `${name}: needs at least one exercise`);
    for (const exercise of exercises) {
      assert.ok(Array.isArray(exercise) && exercise.length === 2, `${name}: each line is [exercise, sets]`);
      assert.ok(isText(exercise[0]) && isText(exercise[1]), `${name}: empty exercise or sets`);
    }
  }
});

test("track: whole numbers that make sense and a real start date", () => {
  const t = PLAN.track;
  assert.ok(isText(t.distance) && typeof t.rest === "string");
  assert.match(t.firstWeek, /^\d{4}-\d{2}-\d{2}$/, "firstWeek is YYYY-MM-DD");
  const [y, m, d] = t.firstWeek.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  assert.equal(date.toISOString().slice(0, 10), t.firstWeek, "firstWeek is a real date");
  for (const key of ["startRepeats", "addPerWeek", "maxRepeats"]) assert.ok(isWhole(t[key]) && t[key] >= 0, `${key} is a whole number`);
  assert.ok(t.startRepeats >= 1, "at least one repeat");
  assert.ok(t.maxRepeats >= t.startRepeats, "maxRepeats is at least startRepeats");
});

test("timelines: every item has a time and a title; days are real weekdays", () => {
  for (const name of ["trainingDay", "restDay"]) {
    assert.ok(Array.isArray(PLAN[name]), `${name} is a list`);
    for (const item of PLAN[name]) {
      assert.ok(isText(item.time) && isText(item.title), `${name}: each item needs a time and a title`);
      if ("detail" in item) assert.equal(typeof item.detail, "string", `${name}: detail is text`);
      if ("days" in item) {
        assert.ok(Array.isArray(item.days) && item.days.length, `${name} › ${item.title}: days is a list`);
        for (const day of item.days) assert.ok(DAYS.includes(day), `${name} › ${item.title}: "${day}" isn't Mon…Sun`);
      }
    }
  }
});

test("every day of a whole week draws without errors, with unique ids", () => {
  const monday = Date.parse("2026-11-23T12:00:00+11:00");
  for (let i = 0; i < 7; i++) {
    const day = app.buildDay(new Date(monday + i * 86400000), PLAN);
    assert.ok(isText(day.title));
    const ids = day.items.flatMap((item) => [item.id, ...(item.children || []).map((c) => c.id)]);
    assert.equal(new Set(ids).size, ids.length, `${day.key}: duplicate ids`);
  }
});
