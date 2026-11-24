// The Today plan. Edit it in Frank (Training → Edit plan) or by hand; the part between the PLAN and END markers below must stay valid JSON.
globalThis.TODAY_PLAN = /*PLAN*/{
  "timeZone": "Australia/Sydney",
  "week": {
    "Mon": {
      "title": "Upper then Swim",
      "workout": "upper"
    },
    "Tue": {
      "title": "Legs then Swim",
      "workout": "legs"
    },
    "Wed": {
      "title": "Rest"
    },
    "Thu": {
      "title": "Upper then Run",
      "workout": "upper",
      "run": "84 s per 400 m (3:30/km)"
    },
    "Fri": {
      "title": "Lower then Swim",
      "workout": "legs"
    },
    "Sat": {
      "title": "Upper then Swim",
      "workout": "upper"
    },
    "Sun": {
      "title": "Run then Lower",
      "workout": "legs",
      "run": "84 s per 400 m (3:30/km)"
    }
  },
  "trainingNote": "2 RIR · 2 min rest between sets",
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
        "Leg Extension",
        "4 × 10-15"
      ],
      [
        "Glute Kickback",
        "3 × 10-15"
      ],
      [
        "Standing Cable Hip abduction",
        "4 × 10-15"
      ]
    ],
    "upper": [
      [
        "Overhand Lat Pulldown",
        "3 × 5-10"
      ],
      [
        "Incline Dumbbell Bench",
        "3 × 5-10"
      ],
      [
        "Chest-Supported Row",
        "3 × 5-10"
      ],
      [
        "Dips",
        "3 × 5-10"
      ],
      [
        "Barbell Bicep Curl",
        "2 × 10-15"
      ],
      [
        "Rear Delt Fly",
        "2 × 10-15"
      ],
      [
        "Side Lateral Raise",
        "3 × 10-15"
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
      "time": "6am-8am",
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
      "time": "7pm–8pm",
      "title": "Dinner"
    },
    {
      "time": "10:00pm",
      "title": "Sleep"
    }
  ]
}/*END*/;
