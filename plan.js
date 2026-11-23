// The Today plan. Edit it in Frank (Training → Edit plan) or by hand; the part between the PLAN and END markers below must stay valid JSON.
globalThis.TODAY_PLAN = /*PLAN*/{
  "timeZone": "Australia/Sydney",
  "week": {
    "Mon": {
      "title": "Pull + run",
      "workout": "pull",
      "run": "84 s per 400 m (3:30/km)"
    },
    "Tue": {
      "title": "Legs",
      "workout": "legs"
    },
    "Wed": {
      "title": "Rest"
    },
    "Thu": {
      "title": "Push + run",
      "workout": "push",
      "run": "96 s per 400 m (4:00/km)"
    },
    "Fri": {
      "title": "Pull",
      "workout": "pull"
    },
    "Sat": {
      "title": "Legs",
      "workout": "legs"
    },
    "Sun": {
      "title": "Push",
      "workout": "push"
    }
  },
  "trainingNote": "2–3 RIR · 2 min rest between sets",
  "workouts": {
    "push": [
      [
        "Bench press",
        "4 × 5–6"
      ],
      [
        "Standing overhead press",
        "3 × 6–8"
      ],
      [
        "JM press",
        "2 × 8–12"
      ],
      [
        "Side lateral raise",
        "3 × 10–15"
      ]
    ],
    "pull": [
      [
        "Lat pulldown",
        "4 × 6–10"
      ],
      [
        "Chest-supported row",
        "3 × 8–12"
      ],
      [
        "Barbell bicep curl",
        "3 × 8–12"
      ],
      [
        "Rear delt fly",
        "2 × 10–15"
      ]
    ],
    "legs": [
      [
        "Back squat",
        "3 × 5–6"
      ],
      [
        "Sumo deadlift",
        "3 × 3–5"
      ],
      [
        "Bulgarian split squat",
        "2 × 8–10 each leg"
      ],
      [
        "Hip thrust",
        "2 × 8–12"
      ],
      [
        "Nordic curl",
        "3 × 3–5"
      ],
      [
        "Leg extension",
        "1 × 10–15"
      ]
    ]
  },
  "track": {
    "distance": "400 m",
    "rest": "60 s rest",
    "firstWeek": "2026-11-23",
    "startRepeats": 5,
    "addPerWeek": 1,
    "maxRepeats": 13
  },
  "trainingDay": [
    {
      "time": "5:45am",
      "title": "Snack"
    },
    {
      "time": "6:00am",
      "title": "Gym",
      "gym": true
    },
    {
      "time": "Then",
      "title": "Swim",
      "detail": "30 min easy"
    },
    {
      "time": "8:00am",
      "title": "Breakfast"
    },
    {
      "time": "9am–1pm",
      "title": "University",
      "days": [
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri"
      ]
    },
    {
      "time": "1pm–2pm",
      "title": "Lunch"
    },
    {
      "time": "2pm–5pm",
      "title": "University",
      "days": [
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri"
      ]
    },
    {
      "time": "After uni",
      "title": "Track",
      "track": true
    },
    {
      "time": "7pm–8pm",
      "title": "Dinner"
    },
    {
      "time": "10:00pm",
      "title": "Sleep"
    }
  ],
  "restDay": [
    {
      "time": "9am–1pm",
      "title": "University",
      "days": [
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri"
      ]
    },
    {
      "time": "1pm–2pm",
      "title": "Lunch"
    },
    {
      "time": "2pm–5pm",
      "title": "University",
      "days": [
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri"
      ]
    },
    {
      "time": "7pm–8pm",
      "title": "Dinner"
    },
    {
      "time": "10:00pm",
      "title": "Sleep"
    }
  ]
}/*END*/;
