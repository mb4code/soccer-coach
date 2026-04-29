const HOME_ROLES = [
  "LF",
  "CF",
  "RF",
  "LM",
  "CM",
  "RM",
  "LD",
  "CD",
  "RD",
  "SW",
  "GK",
];

const AWAY_ROLES = [
  "OLF",
  "OCF",
  "ORF",
  "OLM",
  "OCM",
  "ORM",
  "OLD",
  "OCD",
  "ORD",
  "OSW",
  "OGK",
];

const OFF_FIELD_AWAY = {
  OLF: { x: 10, y: 150 },
  OCF: { x: 18, y: 150 },
  ORF: { x: 26, y: 150 },
  OLM: { x: 34, y: 150 },
  OCM: { x: 42, y: 150 },
  ORM: { x: 50, y: 150 },
  OLD: { x: 58, y: 150 },
  OCD: { x: 66, y: 150 },
  ORD: { x: 74, y: 150 },
  OSW: { x: 82, y: 150 },
  OGK: { x: 90, y: 150 },
};

const DEFAULT_FRAME_NOTES = [
  "Explain what the team shape looks like in this frame.",
  "Call out the key movement or spacing idea.",
];

function rosterFromRoles(roles, prefix) {
  return roles.map((role, index) => ({
    id: `${prefix}-${index + 1}`,
    label: role,
    name: role,
    x: 50,
    y: 75,
  }));
}

function mergeRoster(baseRoster, positions) {
  return baseRoster.map((player) => ({
    ...player,
    ...(positions[player.label] ?? {}),
  }));
}

function makeFrame({
  id,
  label,
  ball,
  home,
  away,
  arrows = [],
  notes = [],
}) {
  return {
    id,
    label,
    ball,
    homePlayers: mergeRoster(rosterFromRoles(HOME_ROLES, "home"), home),
    awayPlayers: mergeRoster(rosterFromRoles(AWAY_ROLES, "away"), away),
    arrows,
    notes,
  };
}

export function createBlankFrame(label = "New Frame") {
  return makeFrame({
    id: crypto.randomUUID(),
    label,
    ball: { x: 50, y: 75 },
    notes: DEFAULT_FRAME_NOTES,
    home: {
      LF: { x: 18, y: 26 },
      CF: { x: 50, y: 22 },
      RF: { x: 82, y: 26 },
      LM: { x: 22, y: 48 },
      CM: { x: 50, y: 50 },
      RM: { x: 78, y: 48 },
      LD: { x: 24, y: 88 },
      CD: { x: 50, y: 92 },
      RD: { x: 76, y: 88 },
      SW: { x: 50, y: 108 },
      GK: { x: 50, y: 126 },
    },
    away: OFF_FIELD_AWAY,
  });
}

export function createEmptyScenario(title = "New Scenario") {
  return {
    id: crypto.randomUUID(),
    title,
    description: "Describe what this scenario teaches.",
    summary: [
      "Add short coaching bullets here.",
      "Use frames to show bad shape, then better shape.",
    ],
    frames: [createBlankFrame("Frame 1"), createBlankFrame("Frame 2")],
  };
}

export function createEmptyLesson(title = "New Concept") {
  return {
    id: crypto.randomUUID(),
    section: "Custom Concept",
    title,
    keyPhrase: "Add a teaching phrase.",
    summaryBullets: [
      "Describe the main idea.",
      "Add the key movement pattern.",
      "Explain what players should notice.",
    ],
    scenarios: [createEmptyScenario("Scenario 1")],
  };
}

export const defaultLessons = [
  {
    id: "lesson-1",
    section: "Creating Space",
    title: "Spacing: Width and Depth",
    keyPhrase: "Make the field big when we have it.",
    summaryBullets: [
      "Wide players stretch the field side to side.",
      "A high central player stretches the defense front to back.",
      "Support behind the ball keeps the team connected and safe.",
    ],
    scenarios: [
      {
        id: "l1-s1",
        title: "Crowded to Spread",
        description: "Show the same attack starting too cramped and then opening up.",
        summary: [
          "The first frame shows players crowding the ball.",
          "The second frame spreads forwards, midfield, and defenders into useful lanes.",
        ],
        frames: [
          makeFrame({
            id: "l1-s1-f1",
            label: "Crowded shape",
            ball: { x: 49, y: 64 },
            notes: [
              "Players are too close to the ball and to each other.",
              "There is not enough width or depth to stretch the field.",
            ],
            home: {
              LF: { x: 40, y: 45 },
              CF: { x: 49, y: 42 },
              RF: { x: 58, y: 45 },
              LM: { x: 43, y: 56 },
              CM: { x: 48, y: 63 },
              RM: { x: 55, y: 57 },
              LD: { x: 41, y: 84 },
              CD: { x: 48, y: 88 },
              RD: { x: 55, y: 84 },
              SW: { x: 49, y: 104 },
              GK: { x: 49, y: 124 },
            },
            away: OFF_FIELD_AWAY,
            arrows: [],
          }),
          makeFrame({
            id: "l1-s1-f2",
            label: "Better spacing",
            ball: { x: 49, y: 64 },
            notes: [
              "The left and right sides are now occupied.",
              "The center forward stays high and the team keeps safe support behind the ball.",
            ],
            home: {
              LF: { x: 12, y: 39 },
              CF: { x: 50, y: 34 },
              RF: { x: 88, y: 39 },
              LM: { x: 22, y: 56 },
              CM: { x: 47, y: 63 },
              RM: { x: 74, y: 55 },
              LD: { x: 22, y: 84 },
              CD: { x: 49, y: 88 },
              RD: { x: 76, y: 84 },
              SW: { x: 49, y: 106 },
              GK: { x: 49, y: 126 },
            },
            away: OFF_FIELD_AWAY,
            arrows: [
              { id: "a-1", x1: 22, y1: 56, x2: 12, y2: 39, color: "#f2b94b" },
              { id: "a-2", x1: 47, y1: 63, x2: 50, y2: 34, color: "#f2b94b" },
              { id: "a-3", x1: 74, y1: 55, x2: 88, y2: 39, color: "#f2b94b" },
            ],
          }),
        ],
      },
    ],
  },
  {
    id: "lesson-2",
    section: "Creating Space",
    title: "Support Angles Around the Ball",
    keyPhrase: "Give the ball an angle.",
    summaryBullets: [
      "Teammates help most when they create visible passing lanes.",
      "Support should give the ball carrier forward, sideways, and backward choices.",
      "Players standing in straight lines are easy to defend.",
    ],
    scenarios: [
      {
        id: "l2-s1",
        title: "Flat Support to Helpful Angles",
        description: "Show one ball carrier first with teammates in straight lines, then with clear angled options.",
        summary: [
          "Nearby teammates are not useful if defenders block the lane.",
          "Angles make the next pass easier and safer.",
        ],
        frames: [
          makeFrame({
            id: "l2-s1-f1",
            label: "Flat support",
            ball: { x: 74, y: 82 },
            notes: [
              "Nearby teammates are still hard to pass to because they sit in straight lines.",
              "The ball carrier does not have clear angled support.",
            ],
            home: {
              LF: { x: 18, y: 34 },
              CF: { x: 48, y: 28 },
              RF: { x: 80, y: 26 },
              LM: { x: 26, y: 58 },
              CM: { x: 48, y: 58 },
              RM: { x: 74, y: 82 },
              LD: { x: 28, y: 86 },
              CD: { x: 48, y: 88 },
              RD: { x: 74, y: 102 },
              SW: { x: 50, y: 109 },
              GK: { x: 50, y: 127 },
            },
            away: OFF_FIELD_AWAY,
          }),
          makeFrame({
            id: "l2-s1-f2",
            label: "Angled support",
            ball: { x: 74, y: 82 },
            notes: [
              "Support is now available underneath, ahead, and behind the ball.",
              "Each angle gives the ball carrier a different safe option.",
            ],
            home: {
              LF: { x: 18, y: 34 },
              CF: { x: 50, y: 28 },
              RF: { x: 86, y: 41 },
              LM: { x: 26, y: 58 },
              CM: { x: 58, y: 66 },
              RM: { x: 74, y: 82 },
              LD: { x: 30, y: 87 },
              CD: { x: 58, y: 88 },
              RD: { x: 69, y: 98 },
              SW: { x: 52, y: 110 },
              GK: { x: 50, y: 127 },
            },
            away: OFF_FIELD_AWAY,
            arrows: [
              { id: "a-21", x1: 74, y1: 82, x2: 58, y2: 66, color: "#60a5fa" },
              { id: "a-22", x1: 74, y1: 82, x2: 69, y2: 98, color: "#60a5fa" },
              { id: "a-23", x1: 74, y1: 82, x2: 86, y2: 41, color: "#60a5fa" },
            ],
          }),
        ],
      },
    ],
  },
  {
    id: "lesson-3",
    section: "Moving Together",
    title: "Team Shape Moves with the Ball",
    keyPhrase: "The ball moves, we move.",
    summaryBullets: [
      "The whole team should slide with the ball, not just the nearest player.",
      "The far side stays tucked in and connected instead of getting stranded wide.",
      "The midfield and back line should stay linked to the play as it shifts.",
    ],
    scenarios: [
      {
        id: "l3-s1",
        title: "Central Shape to Left Shift",
        description: "Show the team moving together as the ball travels from the middle to the left side.",
        summary: [
          "Frame 1 shows a balanced central shape.",
          "Frame 2 shifts the group left while the far side stays connected.",
        ],
        frames: [
          makeFrame({
            id: "l3-s1-f1",
            label: "Ball central",
            ball: { x: 50, y: 70 },
            notes: [
              "The team starts in a balanced shape with the ball in the middle.",
              "Both sides are available before the ball shifts.",
            ],
            home: {
              LF: { x: 20, y: 34 },
              CF: { x: 50, y: 30 },
              RF: { x: 80, y: 34 },
              LM: { x: 24, y: 54 },
              CM: { x: 50, y: 56 },
              RM: { x: 76, y: 54 },
              LD: { x: 24, y: 90 },
              CD: { x: 50, y: 93 },
              RD: { x: 76, y: 90 },
              SW: { x: 50, y: 110 },
              GK: { x: 50, y: 127 },
            },
            away: OFF_FIELD_AWAY,
          }),
          makeFrame({
            id: "l3-s1-f2",
            label: "Ball left",
            ball: { x: 20, y: 58 },
            notes: [
              "The team slides left together instead of leaving players stranded.",
              "The far side stays tucked in and connected to the play.",
            ],
            home: {
              LF: { x: 12, y: 33 },
              CF: { x: 40, y: 31 },
              RF: { x: 68, y: 36 },
              LM: { x: 20, y: 58 },
              CM: { x: 38, y: 58 },
              RM: { x: 63, y: 57 },
              LD: { x: 18, y: 91 },
              CD: { x: 38, y: 94 },
              RD: { x: 65, y: 91 },
              SW: { x: 42, y: 111 },
              GK: { x: 45, y: 127 },
            },
            away: OFF_FIELD_AWAY,
            arrows: [
              { id: "a-31", x1: 80, y1: 34, x2: 68, y2: 36, color: "#22c55e" },
              { id: "a-32", x1: 76, y1: 54, x2: 63, y2: 57, color: "#22c55e" },
              { id: "a-33", x1: 76, y1: 90, x2: 65, y2: 91, color: "#22c55e" },
            ],
          }),
        ],
      },
    ],
  },
  {
    id: "lesson-4",
    section: "Moving Together",
    title: "Back Line Steps Up When Attacking",
    keyPhrase: "Step up when there is pressure.",
    summaryBullets: [
      "The defenders should not stay deep when the attack is established.",
      "The sweeper and goalkeeper come up behind the line to keep the team connected.",
      "A stepped-up back line helps the team win second balls and stop counters.",
    ],
    scenarios: [
      {
        id: "l4-s1",
        title: "Deep Line to Stepped Up Line",
        description: "Compare a stretched team to one whose back line moves up behind the midfield.",
        summary: [
          "Frame 1 leaves a big gap between midfield and defenders.",
          "Frame 2 brings the whole defensive unit closer to the attack.",
        ],
        frames: [
          makeFrame({
            id: "l4-s1-f1",
            label: "Defense too deep",
            ball: { x: 52, y: 36 },
            notes: [
              "The defenders are too far from the midfield and attack.",
              "A big gap opens if possession is lost.",
            ],
            home: {
              LF: { x: 18, y: 24 },
              CF: { x: 50, y: 20 },
              RF: { x: 82, y: 24 },
              LM: { x: 26, y: 44 },
              CM: { x: 50, y: 46 },
              RM: { x: 74, y: 44 },
              LD: { x: 20, y: 102 },
              CD: { x: 50, y: 108 },
              RD: { x: 80, y: 102 },
              SW: { x: 50, y: 118 },
              GK: { x: 50, y: 132 },
            },
            away: OFF_FIELD_AWAY,
          }),
          makeFrame({
            id: "l4-s1-f2",
            label: "Defense steps up",
            ball: { x: 52, y: 36 },
            notes: [
              "The back line moves higher to keep the team compact.",
              "The sweeper and goalkeeper also stay connected behind the play.",
            ],
            home: {
              LF: { x: 18, y: 24 },
              CF: { x: 50, y: 20 },
              RF: { x: 82, y: 24 },
              LM: { x: 26, y: 44 },
              CM: { x: 50, y: 46 },
              RM: { x: 74, y: 44 },
              LD: { x: 24, y: 76 },
              CD: { x: 50, y: 80 },
              RD: { x: 76, y: 76 },
              SW: { x: 50, y: 95 },
              GK: { x: 50, y: 118 },
            },
            away: OFF_FIELD_AWAY,
            arrows: [
              { id: "a-41", x1: 20, y1: 102, x2: 24, y2: 76, color: "#a855f7" },
              { id: "a-42", x1: 50, y1: 108, x2: 50, y2: 80, color: "#a855f7" },
              { id: "a-43", x1: 80, y1: 102, x2: 76, y2: 76, color: "#a855f7" },
            ],
          }),
        ],
      },
    ],
  },
  {
    id: "lesson-5",
    section: "Creating Space",
    title: "Through Balls and Timed Runs",
    keyPhrase: "Pass into space, run onto it.",
    summaryBullets: [
      "The runner waits until the passer is ready to play the ball.",
      "The best pass often goes into open space instead of straight to feet.",
      "Timing the run makes it easier to break behind the defense.",
    ],
    scenarios: [
      {
        id: "l5-s1",
        title: "Wait, Then Break Behind",
        description: "Show the forward waiting in a safe position and then running into space at the right moment.",
        summary: [
          "Frame 1 shows patience before the pass is available.",
          "Frame 2 shows the run and the ball played into space.",
        ],
        frames: [
          makeFrame({
            id: "l5-s1-f1",
            label: "Wait",
            ball: { x: 50, y: 76 },
            notes: [
              "The runner holds position until the pass is really on.",
              "The passer still has control and time to look up.",
            ],
            home: {
              LF: { x: 24, y: 41 },
              CF: { x: 52, y: 45 },
              RF: { x: 74, y: 40 },
              LM: { x: 28, y: 61 },
              CM: { x: 50, y: 76 },
              RM: { x: 70, y: 61 },
              LD: { x: 26, y: 91 },
              CD: { x: 50, y: 94 },
              RD: { x: 74, y: 91 },
              SW: { x: 50, y: 111 },
              GK: { x: 50, y: 127 },
            },
            away: OFF_FIELD_AWAY,
          }),
          makeFrame({
            id: "l5-s1-f2",
            label: "Timed run",
            ball: { x: 50, y: 76 },
            notes: [
              "The forward breaks behind only when the passer is ready.",
              "The pass travels into space for the runner to attack.",
            ],
            home: {
              LF: { x: 22, y: 39 },
              CF: { x: 56, y: 27 },
              RF: { x: 76, y: 39 },
              LM: { x: 30, y: 61 },
              CM: { x: 50, y: 76 },
              RM: { x: 70, y: 61 },
              LD: { x: 26, y: 91 },
              CD: { x: 50, y: 94 },
              RD: { x: 74, y: 91 },
              SW: { x: 50, y: 111 },
              GK: { x: 50, y: 127 },
            },
            away: OFF_FIELD_AWAY,
            arrows: [
              { id: "a-51", x1: 52, y1: 45, x2: 56, y2: 27, color: "#f97316" },
              { id: "a-52", x1: 50, y1: 76, x2: 58, y2: 34, color: "#f97316" },
            ],
          }),
        ],
      },
    ],
  },
  {
    id: "lesson-6",
    section: "Creating Space",
    title: "Crosses with Organized Box Runs",
    keyPhrase: "Attack different spaces in the box.",
    summaryBullets: [
      "Different runners should attack different target zones in the box.",
      "A cutback option and a safety player behind the attack keep the move organized.",
      "Crossing runs work best when players arrive with timing, not all at once.",
    ],
    scenarios: [
      {
        id: "l6-s1",
        title: "Wide Service, Organized Runs",
        description: "Show a wide attack and then the runners spreading into near-post, middle, far-post, and support zones.",
        summary: [
          "Frame 1 shows the ball wide before the runners attack the box.",
          "Frame 2 spreads the runs across different spaces instead of crowding one spot.",
        ],
        frames: [
          makeFrame({
            id: "l6-s1-f1",
            label: "Ball wide",
            ball: { x: 14, y: 34 },
            notes: [
              "The wide player has the ball and the runners are just starting to react.",
              "This is the setup before the crossing runs happen.",
            ],
            home: {
              LF: { x: 14, y: 34 },
              CF: { x: 50, y: 43 },
              RF: { x: 76, y: 39 },
              LM: { x: 20, y: 52 },
              CM: { x: 46, y: 58 },
              RM: { x: 68, y: 57 },
              LD: { x: 24, y: 91 },
              CD: { x: 50, y: 95 },
              RD: { x: 74, y: 91 },
              SW: { x: 50, y: 111 },
              GK: { x: 50, y: 127 },
            },
            away: {
              OLF: { x: 10, y: 150 },
              OCF: { x: 18, y: 150 },
              ORF: { x: 26, y: 150 },
              OLM: { x: 34, y: 150 },
              OCM: { x: 42, y: 150 },
              ORM: { x: 50, y: 150 },
              OLD: { x: 58, y: 150 },
              OCD: { x: 66, y: 150 },
              ORD: { x: 74, y: 150 },
              OSW: { x: 82, y: 150 },
              OGK: { x: 90, y: 150 },
            },
          }),
          makeFrame({
            id: "l6-s1-f2",
            label: "Spread box runs",
            ball: { x: 14, y: 34 },
            notes: [
              "The runners attack different spaces instead of bunching together.",
              "Another player stays available for a cutback or support option.",
            ],
            home: {
              LF: { x: 14, y: 34 },
              CF: { x: 42, y: 27 },
              RF: { x: 69, y: 24 },
              LM: { x: 25, y: 49 },
              CM: { x: 52, y: 38 },
              RM: { x: 57, y: 58 },
              LD: { x: 24, y: 91 },
              CD: { x: 50, y: 95 },
              RD: { x: 74, y: 91 },
              SW: { x: 50, y: 111 },
              GK: { x: 50, y: 127 },
            },
            away: {
              OLF: { x: 10, y: 150 },
              OCF: { x: 18, y: 150 },
              ORF: { x: 26, y: 150 },
              OLM: { x: 34, y: 150 },
              OCM: { x: 42, y: 150 },
              ORM: { x: 50, y: 150 },
              OLD: { x: 58, y: 150 },
              OCD: { x: 66, y: 150 },
              ORD: { x: 74, y: 150 },
              OSW: { x: 82, y: 150 },
              OGK: { x: 90, y: 150 },
            },
            arrows: [
              { id: "a-61", x1: 50, y1: 43, x2: 42, y2: 27, color: "#f43f5e" },
              { id: "a-62", x1: 76, y1: 39, x2: 69, y2: 24, color: "#f43f5e" },
              { id: "a-63", x1: 46, y1: 58, x2: 52, y2: 38, color: "#f43f5e" },
            ],
          }),
        ],
      },
    ],
  },
];
