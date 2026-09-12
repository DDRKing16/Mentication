// Pre-built situational pathways. Each references intervention ids by string;
// ids are resolved at runtime via pathwayByIds in interventions.js.

export const SITUATION_GROUPS = [
  { id: "before", label: "Before" },
  { id: "after", label: "After" },
  { id: "waiting", label: "Waiting" },
  { id: "morning", label: "Morning" },
  { id: "night", label: "Sleep & night" },
];

export const SITUATIONS = [
  // ---- BEFORE ----
  { id: "before-meeting", group: "before", icon: "Briefcase", label: "Before a meeting", sub: "Settle in 3 min",
    direction: "calm", directionLabel: "Calm down",
    pathway: ["sigh", "orienting"],
    answers: { timeMin: 3, audio: "quiet", movement: "seated", location: "work", whereFelt: "both", discreet: true } },
  { id: "before-presentation", group: "before", icon: "Mic", label: "Before presenting", sub: "Steady the nerves",
    direction: "calm", directionLabel: "Calm down",
    pathway: ["sigh", "boxV2", "orienting"],
    answers: { timeMin: 4, audio: "quiet", movement: "seated", location: "any", whereFelt: "body" } },
  { id: "before-interview", group: "before", icon: "User", label: "Before an interview", sub: "Come back to yourself",
    direction: "calm", directionLabel: "Calm down",
    pathway: ["sigh", "grounding54321V2"],
    answers: { timeMin: 5, audio: "quiet", movement: "seated", location: "any", whereFelt: "both" } },
  { id: "before-socialising", group: "before", icon: "Users", label: "Before socialising", sub: "Soften before you go in",
    direction: "calm", directionLabel: "Calm down",
    pathway: ["sigh", "orienting"],
    answers: { timeMin: 5, audio: "quiet", movement: "seated", location: "public", whereFelt: "both" } },
  { id: "difficult-conversation", group: "before", icon: "MessageSquare", label: "Before a hard conversation", sub: "Ground first",
    direction: "ground", directionLabel: "Feel grounded",
    pathway: ["orienting", "sigh", "nameFeeling"],
    answers: { timeMin: 5, audio: "quiet", movement: "seated", location: "any", whereFelt: "both" } },

  // ---- AFTER ----
  { id: "after-argument", group: "after", icon: "Zap", label: "After an argument", sub: "Release the charge",
    direction: "reset", directionLabel: "Get unstuck",
    pathway: ["urgeSurf", "factCheck", "progressive-muscle-relaxation-v2"],
    answers: { timeMin: 10, audio: "quiet", movement: "seated", location: "home", whereFelt: "both" } },
  { id: "after-embarrassment", group: "after", icon: "Wind", label: "After embarrassment", sub: "Be kind to yourself",
    direction: "lift", directionLabel: "Feel better",
    pathway: ["compassionBreak", "activationMenu"],
    answers: { timeMin: 5, audio: "quiet", movement: "seated", location: "any", whereFelt: "thoughts" } },
  { id: "after-criticism", group: "after", icon: "ShieldAlert", label: "After criticism", sub: "Loosen the sting",
    direction: "reset", directionLabel: "Get unstuck",
    pathway: ["nameFeeling", "factCheck"],
    answers: { timeMin: 5, audio: "quiet", movement: "seated", location: "any", whereFelt: "thoughts" } },
  { id: "after-stressful-day", group: "after", icon: "Sunset", label: "After a stressful day", sub: "Wind it all down",
    direction: "sleep", directionLabel: "Sleep",
    pathway: ["progressive-muscle-relaxation-v2", "nightChannel"],
    answers: { timeMin: 10, audio: "yes", movement: "seated", location: "home", whereFelt: "body", bedtime: true } },

  // ---- WAITING ----
  { id: "waiting-reply", group: "waiting", icon: "Mail", label: "Waiting for a reply", sub: "Park the checking",
    direction: "reset", directionLabel: "Get unstuck",
    pathway: ["solvableWorry", "urgeSurf"],
    answers: { timeMin: 5, audio: "quiet", movement: "seated", location: "any", whereFelt: "thoughts" } },
  { id: "waiting-results", group: "waiting", icon: "Hourglass", label: "Waiting for results", sub: "Hold the uncertainty",
    direction: "calm", directionLabel: "Calm down",
    pathway: ["factCheck", "sigh"],
    answers: { timeMin: 5, audio: "quiet", movement: "seated", location: "any", whereFelt: "both" } },

  // ---- MORNING ----
  { id: "morning-anxiety", group: "morning", icon: "Sunrise", label: "Morning anxiety", sub: "Ease into the day",
    direction: "calm", directionLabel: "Calm down",
    pathway: ["sigh", "nextAction"],
    answers: { timeMin: 5, audio: "quiet", movement: "seated", location: "home", whereFelt: "both" } },
  { id: "morning-get-going", group: "morning", icon: "Zap", label: "Can’t get going", sub: "One small move",
    direction: "lift", directionLabel: "Feel better",
    pathway: ["pulseShift", "activationMenu"],
    answers: { timeMin: 3, audio: "yes", movement: "yes", location: "home", whereFelt: "both" } },

  // ---- NIGHT / SLEEP ----
  { id: "3am-waking", group: "night", icon: "Moon", label: "3am waking", sub: "Drift back off",
    direction: "sleep", directionLabel: "Sleep",
    pathway: ["awakeInBedReset", "dropSleepStruggle"],
    answers: { timeMin: 5, audio: "quiet", movement: "none", location: "home", whereFelt: "both", bedtime: true } },
  { id: "sunday-night", group: "night", icon: "CalendarHeart", label: "Sunday-night dread", sub: "Quiet the week ahead",
    direction: "calm", directionLabel: "Calm down",
    pathway: ["tomorrowParking", "sigh"],
    answers: { timeMin: 10, audio: "quiet", movement: "seated", location: "home", whereFelt: "thoughts" } },
  { id: "cant-switch-off", group: "night", icon: "RefreshCw", label: "Can’t switch off", sub: "Let the mind slow",
    direction: "sleep", directionLabel: "Sleep",
    pathway: ["tomorrowParking", "dropSleepStruggle"],
    answers: { timeMin: 8, audio: "yes", movement: "seated", location: "home", whereFelt: "thoughts", bedtime: true } },
];

export const situationById = (id) => SITUATIONS.find((s) => s.id === id);
