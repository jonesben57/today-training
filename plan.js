// The Today plan. Edit it in Frank (Training → Edit plan) or by hand; the part between the PLAN and END markers below must stay valid JSON.
globalThis.TODAY_PLAN = /*PLAN*/{
  "timeZone": "Australia/Sydney",
  "week": {
    "Mon": {
      "title": "Pull"
    },
    "Tue": {
      "title": "Legs + Run",
      "workout": "legs",
      "run": "84 s per 400 m (3:30/km)"
    },
    "Wed": {
      "title": "Rest"
    },
    "Thu": {
      "title": "Push + run",
      "workout": "upper",
      "run": "96 s per 400 m (4:00/km)"
    },
    "Fri": {
      "title": "Pull"
    },
    "Sat": {
      "title": "Legs",
      "workout": "legs"
    },
    "Sun": {
      "title": "Push",
      "workout": "upper"
    }
  },
  "trainingNote": "2–3 RIR · 2 min rest between sets",
  "workouts": {
    "legs": [
      [
        "Squat",
        "1 × 10-15"
      ],
      [
        "Hamstring Curl",
        "4 × 10-15"
      ],
      [
        "Leg",
        "4 × 10-15"
      ]
    ],
    "upper": [
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
