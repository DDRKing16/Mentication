import { THREAT_QUESTIONS, scoreThreatCheck, threatCheckPassed, requiredThreatStep, requiredThreatView, emptyThreatCheck } from "./threat-check.js";
import { createBookStore } from "./storage.js";
import { en, hi, As, ia, ht, Sl, A2, O2, nb, Dd, Y1, q1, lv, J1, h, i, La, za, Nn, tt, Rn, Gr, li, X1, Qe, pu, Mx, LE, tb, Dx, Lx, zx, Rt, Zn, W1, Q1, Ke, hu, F1, fu, ta, Z1, QE, ZE, qE, XE, rb, G1, e2, n2, t2, r2, o2, bs, av, Uh, K1, $1, ob, H1, Bh, Vh, _p, eb, B1, $E, BE, HE, GE, UE, KE, YE, ov } from "./vendor.js";
const _e = en().max(2e3),
  Vx = hi({
    goalState: ht().min(0).max(10).nullable().default(null),
    horizon: ia(["near", "long"]).default("long"),
    want: _e,
    barriers: As(en().max(100)).max(10),
    barrierFocus: ia(["fear", "practical", "both"]).default("fear"),
    practicalNote: _e,
    practicalSupport: _e.default(""),
    prediction: _e,
    audience: _e,
    meaning: _e,
    voice: _e,
    body: As(en().max(100)).max(8),
    now: _e,
    avoidFuture: _e,
    actFuture: _e,
    judgment: _e,
    behavior: _e,
    cost: _e,
    values: As(en().max(60)).max(5),
    customValue: _e.default(""),
    valueAction: _e,
    minutes: ia(["", "5", "15", "30"]),
    budget: ia(["none", "small", "flexible"]),
    competing: _e,
    action: _e,
    likelihood: ht().int().min(0).max(100).nullable(),
    discomfort: ht().int().min(0).max(10).nullable(),
    evidenceLookFor: _e,
    day: _e,
    time: _e,
    ifThen: _e,
    reward: _e,
    proud: _e
  }).strict().refine(e => new Set([...e.values, e.customValue].map(t => t.trim().toLocaleLowerCase()).filter(Boolean)).size <= 5, {
    message: "Choose no more than five values, including your own value.",
    path: ["values"]
  }),
  M2 = hi({
    id: en().uuid(),
    createdAt: en().datetime(),
    want: _e,
    action: _e,
    prediction: _e,
    likelihood: ht().min(0).max(100).nullable(),
    chapterId: en().uuid().nullable().default(null),
    goalStateBefore: ht().min(0).max(10).nullable().default(null),
    goalStateAfter: ht().min(0).max(10).nullable().default(null),
    afterLikelihood: ht().min(0).max(100).nullable(),
    discomfort: ht().min(0).max(10).nullable(),
    actualDiscomfort: ht().min(0).max(10).nullable(),
    result: ia(["less", "same", "more", "unclear"]),
    observed: _e.min(1),
    learned: _e,
    next: _e
  }).strict(),
  Bx = hi({
    id: en().uuid(),
    createdAt: en().datetime(),
    scheduledLabel: en().max(100),
    answers: Vx
  }).strict(),
  os = hi({
    format: Sl(7),
    threatCheck: hi({answers: As(ht().int().min(0).max(3).nullable()).length(4), submitted: A2()}).nullable().default(null),
    resume: hi({ view: en(), section: en(), planTab: en(), threat: ht().int().min(0).max(3), road: en(), checkpoint: ht().int().min(0).max(2), question: en().default("") }).default({view:"cover",section:"start",planTab:"first",threat:0,road:"towards",checkpoint:0}),
    reflectionDraft: hi({ chapterId: en().uuid(), action: _e, result: ia(["less","same","more","unclear"]), observed: _e, learned: _e, next: _e, actualDiscomfort: ht().min(0).max(10).nullable(), afterLikelihood: ht().min(0).max(100).nullable(), goalStateAfter: ht().min(0).max(10).nullable() }).nullable().default(null),
    step: ht().int().min(0).max(9),
    furthestStep: ht().int().min(0).max(9).default(0),
    committed: A2(),
    scheduledLabel: en().max(100).default(""),
    answers: Vx,
    entries: As(M2).max(200),
    chapters: As(Bx).max(200).default([]),
    activeChapterId: en().uuid().nullable().default(null)
  }).strict(),
  D2 = os.omit({
    format: !0,
    step: !0,
    furthestStep: !0
  }).extend({
    format: Sl(5),
    step: ht().int().min(0).max(8),
    furthestStep: ht().int().min(0).max(8).default(0)
  }).strict(),
  Ux = os.omit({
    format: !0,
    step: !0,
    furthestStep: !0,
    chapters: !0,
    activeChapterId: !0
  }).extend({
    format: Sl(4),
    step: ht().int().min(0).max(6),
    furthestStep: ht().int().min(0).max(6).default(0)
  }).strict(),
  L2 = Ux.omit({
    format: !0,
    step: !0,
    furthestStep: !0
  }).extend({
    format: Sl(3),
    step: ht().int().min(0).max(14),
    furthestStep: ht().int().min(0).max(14).default(0)
  }).strict();
function Wp(e) {
  return e <= 1 ? e : e <= 4 ? 2 : e <= 7 ? 3 : e === 8 ? 4 : e <= 13 ? 5 : 6;
}
function Vp(e) {
  return [0, 1, 2, 3, 5, 7, 8][e] ?? 0;
}
function Vi(e) {
  return e <= 3 ? e : e + 1;
}
function parseBook(input) {
  if (input?.format === 7) return os.parse(input);
  if (![3,4,5,6].includes(input?.format)) throw new Error("Unsupported book format");
  const book = structuredClone(input);
  if (book.format < 6) {
    book.step = book.format === 5 ? Vi(book.step) : Vi(Vp(book.format === 3 ? Wp(book.step) : book.step));
    book.furthestStep = book.format === 5 ? Vi(book.furthestStep ?? 0) : Vi(Vp(book.format === 3 ? Wp(book.furthestStep ?? 0) : book.furthestStep ?? 0));
  }
  // Old builds silently supplied scores. Do not present them as user evidence.
  const clear = a => ({...a, likelihood:null, discomfort:null, goalState:null});
  book.answers = clear(book.answers);
  book.chapters = (book.chapters || []).map(c => ({...c, answers:clear(c.answers)}));
  book.entries = (book.entries || []).map(e => ({...e, likelihood:null, afterLikelihood:null, discomfort:null, actualDiscomfort:null}));
  book.format = 7;
  return os.parse(book);
}
const z2 = {
    goalState: null,
    horizon: "long",
    want: "",
    barriers: [],
    barrierFocus: "fear",
    practicalNote: "",
    practicalSupport: "",
    prediction: "",
    audience: "",
    meaning: "",
    voice: "",
    body: [],
    now: "",
    avoidFuture: "",
    actFuture: "",
    judgment: "",
    behavior: "",
    cost: "",
    values: [],
    customValue: "",
    valueAction: "",
    minutes: "",
    budget: "none",
    competing: "",
    action: "",
    likelihood: null,
    discomfort: null,
    evidenceLookFor: "",
    day: "",
    time: "",
    ifThen: "",
    reward: "",
    proud: ""
  },
  Co = () => ({
    format: 7,
    threatCheck: null,
    resume: {view:"cover",section:"start",planTab:"first",threat:0,road:"towards",checkpoint:0},
    reflectionDraft: null,
    step: 0,
    furthestStep: 0,
    committed: !1,
    scheduledLabel: "",
    answers: {
      ...z2,
      barriers: [],
      body: [],
      values: []
    },
    entries: [],
    chapters: [],
    activeChapterId: null
  }),
  F2 = [{
    name: "Pattern",
    range: [1, 4]
  }, {
    name: "Direction",
    range: [5, 6]
  }, {
    name: "Action",
    range: [7, 9]
  }],
  $2 = ["Dear 2100", "What you want", "What's in the way", "Threat detection", "My response to fear", "Two possible futures", "Re-center on values", "Ride the wave", "Build my plan", "Your plan is ready"],
  Hx = [{
    phase: "Pattern",
    title: "What you want",
    cue: "Name the dream."
  }, {
    phase: "Pattern",
    title: "What's in the way",
    cue: "Name the fear or practical barrier."
  }, {
    phase: "Pattern",
    title: "Threat detection",
    cue: "Explore the four phases, then answer four questions."
  }, {
    phase: "Pattern",
    title: "My response to fear",
    cue: "Name what you usually do when fear shows up."
  }, {
    phase: "Direction",
    title: "Two possible futures",
    cue: "Walk both roads to twenty years."
  }, {
    phase: "Direction",
    title: "Re-center on values",
    cue: "Choose your compass."
  }, {
    phase: "Action",
    title: "Ride the wave",
    cue: "Practise keeping your choice."
  }, {
    phase: "Action",
    title: "Build my plan",
    cue: "A small step and a way through fear."
  }, {
    phase: "Action",
    title: "Your plan is ready",
    cue: "Review, then save your chapter."
  }];
function Bp(e) {
  return Hx.map((t, n) => e.barrierFocus === "practical" && n === 3 ? {
    phase: "Pattern",
    title: "What would help?",
    cue: "Name a useful resource or adjustment."
  } : e.barrierFocus === "practical" && n === 6 ? {...t,title:"Make room for support",cue:"Check the practical support your step needs."} : t);
}
function jr(e) {
  const t = new Set();
  return [...e.values, e.customValue].map(n => n.trim()).filter(n => {
    const r = n.toLocaleLowerCase();
    return !r || t.has(r) ? !1 : (t.add(r), !0);
  });
}
const W2 = ["Fear of failing", "What people think", "Not enough time", "Money", "Low energy", "Not sure where to start"],
  V2 = ["I keep researching", "I wait until I feel ready", "I over-prepare", "I stay quiet", "I put it off", "I ask for reassurance"],
  B2 = ["Courage", "Curiosity", "Creativity", "Connection", "Freedom", "Honesty", "Learning", "Care", "Independence", "Integrity", "Play", "Contribution"],
  U2 = {
    Courage: ["Try a first attempt before I feel ready.", "Ask the question I usually keep to myself."],
    Curiosity: ["Ask one useful question.", "Treat the first attempt as information."],
    Creativity: ["Make a rough version without editing it.", "Give an idea five uninterrupted minutes."],
    Connection: ["Send one honest message.", "Listen without preparing my reply."],
    Freedom: ["Choose one thing without polling everyone.", "Make space for something I chose."],
    Honesty: ["Say what I actually need.", "Name a limitation before making a promise."],
    Learning: ["Practise one unfamiliar thing.", "Ask for specific feedback."],
    Care: ["Help in a way I can sustain.", "Include my own capacity in the decision."],
    Independence: ["Make one decision I can own.", "Try before asking someone to check."],
    Integrity: ["Take the action I said I would take.", "Make my next choice consistent with my priorities."],
    Play: ["Try something without needing to be good at it.", "Make time for an activity with no score."],
    Contribution: ["Offer one useful thing.", "Do a small piece of work that matters to someone."]
  };
function H2(e) {
  const t = e.want.toLowerCase(),
    n = e.minutes || "a few";
  return e.barrierFocus === "practical" ? ["Ask one person about the support I need", `Spend ${n} minutes finding a realistic first option`, "Check the cost or access requirement", "Choose a date to revisit this with more capacity"] : /piano|music|guitar|sing|instrument/.test(t) ? [`Practise one passage for ${n} minutes`, "Find one beginner lesson", "Ask about borrowing an instrument"] : /writ|book|poem/.test(t) ? [`Write without editing for ${n} minutes`, "Write the first three sentences", "Outline one scene on paper"] : /travel|trip/.test(t) ? ["Check one realistic destination", "Write down the cost of a short trip", "Plan a short solo outing nearby"] : /job|work|career|business/.test(t) ? [`Spend ${n} minutes on one application`, "List three conditions I want in my work", "Ask one person about their experience"] : /connect|friend|someone|family/.test(t) ? ["Draft a short message", "Send a low-pressure invitation", "Choose a time for a conversation"] : /speak|confiden/.test(t) ? ["Write one point I want to make", "Ask one question in a safe setting", "Practise saying one sentence aloud"] : /study|learn|school/.test(t) ? [`Try a free lesson for ${n} minutes`, "Look up one course requirement", "Write down the first question I need answered"] : [`Spend ${n} minutes on a rough first attempt`, "Write down the first concrete action", "Find one useful piece of information"];
}
function _t(e, t) {
  return e === 1 ? !!t.want.trim() : e === 2 ? (t.barrierFocus === "practical" || !!t.prediction.trim()) && (t.barrierFocus === "fear" || !!t.practicalNote.trim()) : e === 4 ? !!(t.barrierFocus === "practical" ? t.practicalSupport : t.behavior).trim() : e === 6 ? jr(t).length >= 3 && jr(t).length <= 5 : e === 8 || e === 9 ? !!(t.action.trim() && t.ifThen.trim() && t.day && t.time && t.minutes) : !0;
}
function G2(e, t) {
  return _t(e, t) ? "" : e === 1 ? "Name what you want" : e === 2 ? t.barrierFocus !== "practical" && !t.prediction.trim() ? "Name the fear or choose a suggestion" : "Name the practical barrier" : e === 4 ? t.barrierFocus === "practical" ? "Write or choose what would help above" : "Write or choose your usual response above" : e === 6 ? `Choose ${Math.max(0, 3 - jr(t).length)} more values` : !t.action.trim() ? "Choose your next step" : !t.day || !t.time || !t.minutes ? "Choose the day, time and duration for your action" : "Choose a response to your obstacle";
}
function $u(e) {
  const t = e.chapters.find(n => n.id === e.activeChapterId);
  return !!(t && JSON.stringify(t.answers) === JSON.stringify(e.answers) && t.scheduledLabel === e.scheduledLabel);
}
function Y2(e, t, n) {
  if (!threatCheckPassed(e)) throw new Error("Complete the four-question threat-system check with at least 3 of 4 correct first.");
  if (!_t(1, e.answers) || !_t(6, e.answers) || !_t(9, e.answers)) throw new Error("Complete your direction, values and plan first.");
  if ($u(e)) return e.committed && e.step === 9 && e.furthestStep === 9 ? e : {
    ...e,
    committed: !0,
    step: 9,
    furthestStep: 9
  };
  if (e.chapters.length >= 200) throw new Error("Your book is full. Export your book before beginning another chapter.");
  const r = Bx.parse({
    id: t,
    createdAt: n,
    scheduledLabel: e.scheduledLabel,
    answers: structuredClone(e.answers)
  });
  return {
    ...e,
    committed: !0,
    step: 9,
    furthestStep: 9,
    activeChapterId: t,
    chapters: [r, ...e.chapters]
  };
}
function K2(e, t = new Date()) {
  if (e.day === "Decide later") return "Timing to decide";
  const n = new Date(t);
  e.day === "Tomorrow" && n.setDate(n.getDate() + 1), e.day === "This week" && n.setDate(n.getDate() - (n.getDay() + 6) % 7);
  const r = n.toLocaleDateString(void 0, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
  return e.day === "This week" ? `Week of ${r}` : r;
}
const pc = [{
    title: "Build a big idea",
    detail: "Book · venture · bold idea",
    prompt: "What have you dreamed of creating?",
    examples: ["Write the book I've imagined for years", "Start the business I believe in", "Create a film or album", "Put my work out into the world"],
    icon: nb,
    tone: "rose"
  }, {
    title: "Change my direction",
    detail: "Work · place · purpose",
    prompt: "What big change have you wanted to make?",
    examples: ["Pursue the career I really want", "Move to the place I dream about", "Apply for an opportunity that feels out of reach", "Make a life around work I care about"],
    icon: Dd,
    tone: "blue"
  }, {
    title: "Do the daring thing",
    detail: "Adventure · stage · challenge",
    prompt: "What bold dream have you wanted to try?",
    examples: ["Perform on a stage", "Take the journey I've put off for years", "Train for a challenge I thought I couldn't do", "Audition for the role I want"],
    icon: Y1,
    tone: "paper"
  }],
  Up = [{
    name: "Notice",
    icon: q1,
    title: "An alarm arrives.",
    description: "A dream that matters can make uncertainty feel unusually significant."
  }, {
    name: "Predict",
    icon: lv,
    title: "“What if it goes badly?”",
    description: "The mind tries to protect you by filling in an outcome before it happens."
  }, {
    name: "Protect",
    icon: J1,
    title: "Putting it off brings relief.",
    description: "The relief makes sense, but the prediction stays untested."
  }],
  Hp = [{
    label: "Today",
    left: "Leave it for now.",
    leftBody: "A pause can protect resources or bring relief. You can choose when to revisit it.",
    right: "Make room for a first step.",
    rightBody: "A small attempt can teach you something, while taking time and energy."
  }, {
    label: "1 year",
    left: "Keep the question open.",
    leftBody: "Your circumstances may change. If waiting becomes automatic, the idea may stay untested.",
    right: "Find out what fits.",
    rightBody: "Small attempts could help you decide what fits—and what doesn’t."
  }, {
    label: "20 years",
    left: "A choice to revisit.",
    leftBody: "You may feel at peace with your priorities, or wonder what trying could have meant.",
    right: "Experience to draw on.",
    rightBody: "The idea may grow, change or lead elsewhere. Trying never guarantees one particular future."
  }];
function Z2({
  canResume: e,
  furthestStep: t,
  resumeStep: n,
  blocked: r,
  initialWant: o = "",
  stages: s = Hx,
  initialSection = "start",
  onSectionChange: a,
  onBegin: l,
  onResume: c,
  onOpenStage: u,
  onSound: d,
  onSettings: p,
  onLearn: f
}) {
  var xe;
  const [y, x] = h.useState(initialSection),
    [w, k] = h.useState(null),
    [m, g] = h.useState(o),
    [v, b] = h.useState(!!o),
    [S, j] = h.useState(0),
    [C, _] = h.useState("try"),
    [R, I] = h.useState(0),
    [B, z] = h.useState({
      previous: !1,
      next: !1
    }),
    Y = h.useRef(null),
    Z = h.useRef(null),
    ne = h.useRef(null),
    V = h.useRef(null),
    F = h.useRef(null),
    N = h.useRef(null),
    M = pc.find(({
      title: P
    }) => P === w),
    T = M == null ? void 0 : M.icon,
    ae = (M == null ? void 0 : M.examples) ?? ["Write the book I've imagined", "Take the journey I keep dreaming about", "Pursue the career I really want", "Start the idea I keep returning to"],
    Q = Up[S],
    ie = Hp[R],
    de = P => {
      P !== "start" && P !== "pattern" && P !== "futures" || (x(P), a(P), d());
    },
    pe = () => {
      de("start"), requestAnimationFrame(() => {
        var P;
        return (P = Y.current) == null ? void 0 : P.focus({
          preventScroll: !0
        });
      });
    },
    re = P => {
      k(P), b(!0), d();
    },
    Ne = () => {
      m.trim() && l(m.trim());
    },
    ee = () => {
      const P = N.current;
      P && z({
        previous: P.scrollLeft > 2,
        next: P.scrollLeft + P.clientWidth < P.scrollWidth - 2
      });
    },
    J = P => {
      const $ = N.current;
      $ && $.scrollBy({
        left: P * Math.max(170, $.clientWidth * .72),
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth"
      });
    },
    Pe = P => {
      g(P), d(), requestAnimationFrame(() => {
        var $, me;
        ($ = F.current) == null || $.focus({
          preventScroll: !0
        }), (me = F.current) == null || me.scrollIntoView({
          block: "nearest",
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth"
        });
      });
    };
  return h.useEffect(() => {
    if (!v) return;
    const P = requestAnimationFrame(() => {
        var Le, vt;
        (Le = ne.current) == null || Le.focus({
          preventScroll: !0
        }), (vt = ne.current) == null || vt.scrollIntoView({
          block: "nearest",
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth"
        });
        const me = N.current;
        me && (me.scrollLeft = 0), ee();
      }),
      $ = new ResizeObserver(ee);
    return N.current && $.observe(N.current), () => {
      cancelAnimationFrame(P), $.disconnect();
    };
  }, [v, w]), h.useEffect(() => {
    if (!v) return;
    const P = window.visualViewport;
    if (!P) return;
    const $ = () => {
      var me;
      document.activeElement === V.current && ((me = V.current) == null || me.scrollIntoView({
        block: "nearest"
      }));
    };
    return P.addEventListener("resize", $), () => P.removeEventListener("resize", $);
  }, [v]), i.jsxs("div", {
    className: "home-v2",
    children: [i.jsx("svg", {
      className: "home-metal-defs",
      width: "0",
      height: "0",
      "aria-hidden": "true",
      focusable: "false",
      children: i.jsxs("defs", {
        children: [i.jsxs("linearGradient", {
          id: "home-red-metal",
          x1: "0%",
          y1: "0%",
          x2: "100%",
          y2: "100%",
          children: [i.jsx("stop", {
            offset: "0%",
            stopColor: "#762332"
          }), i.jsx("stop", {
            offset: "19%",
            stopColor: "#b84951"
          }), i.jsx("stop", {
            offset: "39%",
            stopColor: "#ffe2d8"
          }), i.jsx("stop", {
            offset: "52%",
            stopColor: "#982a38"
          }), i.jsx("stop", {
            offset: "76%",
            stopColor: "#d66f73"
          }), i.jsx("stop", {
            offset: "100%",
            stopColor: "#70202f"
          })]
        }), i.jsxs("linearGradient", {
          id: "home-choice-red-lustre",
          x1: "8%",
          y1: "5%",
          x2: "92%",
          y2: "95%",
          children: [i.jsx("stop", {
            offset: "0%",
            stopColor: "#692131"
          }), i.jsx("stop", {
            offset: "18%",
            stopColor: "#c45562"
          }), i.jsx("stop", {
            offset: "32%",
            stopColor: "#f0c8c2"
          }), i.jsx("stop", {
            offset: "45%",
            stopColor: "#9d293c"
          }), i.jsx("stop", {
            offset: "65%",
            stopColor: "#e98e91"
          }), i.jsx("stop", {
            offset: "77%",
            stopColor: "#efceca"
          }), i.jsx("stop", {
            offset: "100%",
            stopColor: "#70202f"
          })]
        })]
      })
    }), i.jsxs(La, {
      value: y,
      onValueChange: de,
      className: "home-tabs",
      children: [i.jsxs(za, {
        className: "home-tab-list",
        "aria-label": "Explore Dear 2100",
        children: [i.jsxs(Nn, {
          value: "start",
          ref: Y,
          className: "home-tab-card home-tab-start",
          children: [i.jsxs("span", {
            className: "home-tab-heading",
            children: [i.jsx("span", {
              className: "home-tab-index",
              children: "01"
            }), i.jsx("strong", {
              children: "Starting point"
            })]
          }), i.jsx("span", {
            className: "home-tab-symbol home-tab-symbol-start",
            "aria-hidden": "true",
            children: i.jsx(Dd, {
              strokeWidth: 1.5
            })
          }), i.jsxs("span", {
            className: "home-tab-invite",
            children: ["Tap to explore ", i.jsx(tt, {
              size: 12,
              "aria-hidden": "true"
            })]
          })]
        }), i.jsxs(Nn, {
          value: "pattern",
          className: "home-tab-card home-tab-pattern",
          children: [i.jsxs("span", {
            className: "home-tab-heading",
            children: [i.jsx("span", {
              className: "home-tab-index",
              children: "02"
            }), i.jsx("strong", {
              children: "The pattern"
            })]
          }), i.jsx("span", {
            className: "home-tab-symbol home-tab-symbol-pattern",
            "aria-hidden": "true",
            children: i.jsx(Q2, {})
          }), i.jsxs("span", {
            className: "home-tab-invite",
            children: ["Tap to explore ", i.jsx(tt, {
              size: 12,
              "aria-hidden": "true"
            })]
          })]
        }), i.jsxs(Nn, {
          value: "futures",
          className: "home-tab-card home-tab-futures",
          children: [i.jsxs("span", {
            className: "home-tab-heading",
            children: [i.jsx("span", {
              className: "home-tab-index",
              children: "03"
            }), i.jsx("strong", {
              children: "Two futures"
            })]
          }), i.jsx("span", {
            className: "home-tab-symbol home-tab-symbol-futures",
            "aria-hidden": "true",
            children: i.jsx(X2, {})
          }), i.jsxs("span", {
            className: "home-tab-invite",
            children: ["Tap to explore ", i.jsx(tt, {
              size: 12,
              "aria-hidden": "true"
            })]
          })]
        })]
      }), i.jsx(q2, {
        active: Math.max(1, n),
        furthestStep: t,
        stages: s,
        onSelect: P => {
          P === 1 ? pe() : u(P);
        }
      }), i.jsxs(Rn, {
        value: "start",
        className: `home-panel home-start home-notepad ${v ? "is-answering" : "is-choosing"}`,
        children: [i.jsxs("span", {
          className: "home-ink-flecks",
          "aria-hidden": "true",
          children: [i.jsx("i", {}), i.jsx("i", {}), i.jsx("i", {}), i.jsx("i", {}), i.jsx("i", {})]
        }), i.jsxs("span", {
          className: "home-note-binding",
          "aria-hidden": "true",
          children: [i.jsx("i", {}), i.jsx("i", {}), i.jsx("i", {})]
        }), i.jsx("span", {
          className: "home-note-corner",
          "aria-hidden": "true"
        }), i.jsx("div", {
          className: "home-panel-heading",
          children: i.jsx("h2", {
            ref: ne,
            tabIndex: v ? -1 : void 0,
            id: "home-direction-question",
            children: v && M ? M.prompt : "I’ve always wanted to…"
          })
        }), v ? i.jsxs("div", {
          className: "home-answer-stage",
          children: [i.jsxs("div", {
            className: "home-answer-stage-top",
            children: [i.jsxs("button", {
              type: "button",
              className: "home-back-categories",
              onClick: () => {
                b(!1), d(), requestAnimationFrame(() => {
                  var P;
                  return (P = Z.current) == null ? void 0 : P.focus({
                    preventScroll: !0
                  });
                });
              },
              children: [i.jsx(Gr, {
                size: 16,
                "aria-hidden": "true"
              }), "All directions"]
            }), i.jsxs("span", {
              className: "home-answer-category",
              children: [T && i.jsx(T, {
                size: 13,
                strokeWidth: 1.7,
                "aria-hidden": "true"
              }), w ?? "My own idea"]
            })]
          }), i.jsx("label", {
            className: "home-answer-label",
            htmlFor: "home-direction",
            children: "Your answer"
          }), i.jsx("textarea", {
            ref: V,
            className: m.trim() ? "" : "required-pulse",
            required: !0,
            id: "home-direction",
            rows: 2,
            maxLength: 1200,
            "aria-describedby": "home-direction-question",
            value: m,
            onChange: P => g(P.target.value),
            placeholder: "Write what comes to mind…"
          }), i.jsxs("div", {
            className: "home-suggestion-heading",
            children: [i.jsx("span", {
              children: "Or try an idea"
            }), i.jsxs("div", {
              className: "home-suggestion-controls",
              children: [i.jsx("button", {
                type: "button",
                "aria-label": "Previous suggestions",
                disabled: !B.previous,
                onClick: () => J(-1),
                children: i.jsx(Gr, {
                  size: 17,
                  "aria-hidden": "true"
                })
              }), i.jsx("button", {
                type: "button",
                "aria-label": "More suggestions",
                disabled: !B.next,
                onClick: () => J(1),
                children: i.jsx(li, {
                  size: 17,
                  "aria-hidden": "true"
                })
              })]
            })]
          }), i.jsx("div", {
            ref: N,
            className: "home-suggestions",
            role: "group",
            "aria-label": "Suggested answers",
            onScroll: ee,
            children: ae.map(P => i.jsx("button", {
              type: "button",
              "aria-pressed": m === P,
              onClick: () => Pe(P),
              children: P
            }, P))
          })]
        }, w ?? "own") : i.jsxs("div", {
          className: "home-choice-stage",
          children: [i.jsx("div", {
            className: "home-choices",
            role: "group",
            "aria-label": "Choose a direction",
            children: pc.map(({
              title: P,
              detail: $,
              icon: me,
              tone: Le
            }) => i.jsxs("button", {
              ref: P === pc[0].title ? Z : void 0,
              type: "button",
              className: `home-choice home-tone-${Le}`,
              "aria-label": `Choose ${P}`,
              onClick: () => re(P),
              children: [i.jsx("span", {
                className: "home-choice-icon",
                "aria-hidden": "true",
                children: i.jsx(me, {
                  size: 20,
                  strokeWidth: 1.6
                })
              }), i.jsxs("span", {
                className: "home-choice-copy",
                children: [i.jsx("strong", {
                  children: P
                }), i.jsx("small", {
                  children: $
                })]
              }), i.jsx(tt, {
                className: "home-choice-arrow",
                size: 15,
                "aria-hidden": "true"
              })]
            }, P))
          }), i.jsxs("button", {
            className: "home-write-own",
            onClick: () => re(null),
            children: [i.jsx(X1, {
              size: 16
            }), "I have my own idea", i.jsx(Qe, {
              size: 16
            })]
          })]
        }, "categories"), i.jsxs("div", {
          className: "home-action-area",
          children: [i.jsxs("button", {
            ref: F,
            className: `home-primary ${m.trim() && v ? "is-ready" : ""}`,
            disabled: r || !v || !m.trim(),
            "aria-describedby": !r && (!v || !m.trim()) ? "home-action-reason" : void 0,
            onClick: Ne,
            children: [r ? "Opening your space…" : "Explore this", i.jsx(Qe, {
              size: 20,
              "aria-hidden": "true"
            })]
          }), !r && (!v || !m.trim()) && i.jsx("p", {
            id: "home-action-reason",
            className: "sr-only",
            children: v ? "Write a few words or choose an idea to continue." : "Choose a direction to continue."
          }), e && i.jsxs("button", {
            type: "button",
            className: "home-resume-link",
            disabled: r,
            "aria-label": `Resume saved step: ${(xe = s[Math.max(1, n) - 1]) == null ? void 0 : xe.title}`,
            onClick: c,
            children: ["Resume saved step", i.jsx(tt, {
              size: 15,
              "aria-hidden": "true"
            })]
          })]
        })]
      }), i.jsxs(Rn, {
        value: "pattern",
        className: "home-panel home-pattern",
        children: [i.jsxs("div", {
          className: "home-panel-heading",
          children: [i.jsx("p", {
            className: "home-kicker",
            children: "DIRECTION · UNDERSTAND, THEN CHOOSE"
          }), i.jsxs("h2", {
            children: ["Why can it feel ", i.jsx("em", {
              children: "threatening?"
            })]
          }), i.jsx("p", {
            children: "Understand the protective loop. Then decide what you want to stand for."
          })]
        }), i.jsxs("div", {
          className: `home-loop home-loop-step-${S}`,
          role: "group",
          "aria-label": "Explore the postponement loop",
          children: [i.jsxs("svg", {
            viewBox: "0 0 380 190",
            preserveAspectRatio: "none",
            "aria-hidden": "true",
            children: [i.jsx("defs", {
              children: i.jsx("marker", {
                id: "home-arrow",
                markerWidth: "6",
                markerHeight: "6",
                refX: "4",
                refY: "3",
                orient: "auto",
                children: i.jsx("path", {
                  d: "M0,0 L5,3 L0,6",
                  fill: "none",
                  stroke: "currentColor"
                })
              })
            }), i.jsx("path", {
              className: S === 0 ? "is-active" : "",
              d: "M232 35 Q303 38 309 98",
              markerEnd: "url(#home-arrow)"
            }), i.jsx("path", {
              className: S === 1 ? "is-active" : "",
              d: "M260 148 Q190 197 119 148",
              markerEnd: "url(#home-arrow)"
            }), i.jsx("path", {
              className: S === 2 ? "is-active" : "",
              d: "M72 98 Q76 38 146 35",
              markerEnd: "url(#home-arrow)"
            })]
          }), Up.map(({
            name: P,
            icon: $
          }, me) => i.jsxs("button", {
            className: `home-loop-node home-loop-node-${me} ${S === me ? "is-active" : ""}`,
            "aria-pressed": S === me,
            onClick: () => {
              j(me), d();
            },
            children: [i.jsx("span", {
              children: i.jsx($, {
                size: 23,
                strokeWidth: 1.5
              })
            }), i.jsx("strong", {
              children: P
            })]
          }, P))]
        }), i.jsxs("div", {
          className: "home-loop-insight",
          "aria-live": "polite",
          "aria-atomic": "true",
          children: [i.jsxs("span", {
            className: "home-insight-number",
            children: ["0", S + 1]
          }), i.jsxs("div", {
            children: [i.jsx("h3", {
              children: Q.title
            }), i.jsx("p", {
              children: Q.description
            })]
          }, S)]
        }), i.jsxs("button", {
          className: "home-primary home-primary-light",
          onClick: pe,
          children: ["Name what I want", i.jsx(Qe, {
            size: 20
          })]
        })]
      }), i.jsxs(Rn, {
        value: "futures",
        className: "home-panel home-futures",
        children: [i.jsxs("div", {
          className: "home-panel-heading",
          children: [i.jsx("p", {
            className: "home-kicker",
            children: "SAME YOU. TWO DIRECTIONS."
          }), i.jsxs("h2", {
            children: ["Where could this ", i.jsx("em", {
              children: "lead?"
            })]
          }), i.jsx("p", {
            children: "Tap either road. Both have trade-offs; neither measures your worth."
          })]
        }), i.jsxs("div", {
          className: "home-future-map",
          role: "group",
          "aria-label": "Explore two possible roads over time",
          children: [i.jsxs("div", {
            className: "home-road-labels",
            children: [i.jsx("span", {
              children: "Leave it for now"
            }), i.jsx("span", {
              children: "Make a little room"
            })]
          }), i.jsxs("div", {
            className: "home-road-stage",
            children: [i.jsxs("svg", {
              viewBox: "0 0 360 172",
              preserveAspectRatio: "none",
              "aria-hidden": "true",
              children: [i.jsx("path", {
                className: `home-road-wait ${C === "wait" ? "is-active" : ""}`,
                d: "M42 151 C114 147 73 111 101.5 82 S133 37 157 20"
              }), i.jsx("path", {
                className: `home-road-try ${C === "try" ? "is-active" : ""}`,
                d: "M222 151 C294 147 253 111 281.5 82 S313 37 337 20"
              })]
            }), Hp.map(({
              label: P
            }, $) => i.jsxs("div", {
              className: `home-road-row home-road-row-${$}`,
              children: [i.jsx("button", {
                type: "button",
                className: `home-road-stop wait ${C === "wait" && R === $ ? "is-active" : ""}`,
                "aria-label": `Leave it for now: ${P}`,
                "aria-pressed": C === "wait" && R === $,
                onClick: () => {
                  _("wait"), I($), d();
                },
                children: i.jsx("span", {
                  children: $ === 0 ? "•" : $ === 1 ? "1" : "20"
                })
              }), i.jsx("span", {
                className: "home-road-time",
                children: P
              }), i.jsx("button", {
                type: "button",
                className: `home-road-stop try ${C === "try" && R === $ ? "is-active" : ""}`,
                "aria-label": `Make a little room: ${P}`,
                "aria-pressed": C === "try" && R === $,
                onClick: () => {
                  _("try"), I($), d();
                },
                children: i.jsx("span", {
                  children: $ === 0 ? "•" : $ === 1 ? "1" : "20"
                })
              })]
            }, P))]
          })]
        }), i.jsx("div", {
          className: `home-future-insight ${C}`,
          "aria-live": "polite",
          "aria-atomic": "true",
          children: i.jsxs("div", {
            children: [i.jsxs("span", {
              children: [ie.label, " · ", C === "try" ? "Make a little room" : "Leave it for now"]
            }), i.jsx("h3", {
              children: C === "try" ? ie.right : ie.left
            }), i.jsx("p", {
              children: C === "try" ? ie.rightBody : ie.leftBody
            })]
          }, `${C}-${R}`)
        }), i.jsx("div", {
          className: "home-action-area",
          children: i.jsxs("button", {
            className: "home-primary",
            onClick: pe,
            children: ["Explore my own direction", i.jsx(Qe, {
              size: 20
            })]
          })
        })]
      })]
    }), i.jsxs("footer", {
      className: "home-footer",
      children: [i.jsxs("button", {
        onClick: p,
        children: [i.jsx(pu, {
          size: 14
        }), "Your private space"]
      }), i.jsxs("button", {
        onClick: f,
        children: ["The thinking behind it", i.jsx(tt, {
          size: 14
        })]
      })]
    })]
  });
}
function q2({
  active: e,
  furthestStep: t,
  stages: n,
  onSelect: r
}) {
  return i.jsxs("div", {
    className: "home-checkpoints",
    "aria-label": `Journey stage ${e} of ${n.length}: ${n[e - 1].title}`,
    children: [i.jsx("span", {
      className: "home-checkpoint-line",
      children: n.map((o, s) => {
        const a = s + 1;
        return a <= Math.max(1, t) ? i.jsx("button", {
          type: "button",
          className: `home-checkpoint-dot ${a === e ? "is-active" : "is-complete"}`,
          "aria-label": `Open stage ${a}: ${o.title}`,
          title: `Stage ${a}: ${o.title}`,
          "aria-current": a === e ? "step" : void 0,
          onClick: () => r(a),
          children: i.jsx("span", {})
        }, a) : i.jsx("i", {
          className: "home-checkpoint-dot",
          "aria-hidden": "true",
          children: i.jsx("span", {})
        }, a);
      })
    }), i.jsxs(Mx, {
      children: [i.jsx(LE, {
        asChild: !0,
        children: i.jsxs("button", {
          type: "button",
          className: "home-see-path",
          children: [i.jsx("span", {
            className: "home-see-path-label",
            children: "See the path"
          }), i.jsx("span", {
            className: "home-see-path-icon",
            children: i.jsx(tb, {
              size: 17,
              strokeWidth: 1.9,
              "aria-hidden": "true"
            })
          })]
        })
      }), i.jsxs(Dx, {
        className: "home-path-dialog",
        children: [i.jsx("p", {
          className: "home-path-eyebrow",
          children: "DEAR 2100 · THE JOURNEY"
        }), i.jsx(Lx, {
          children: "The path ahead."
        }), i.jsx(zx, {
          children: "Nine stages, usually 10–20 minutes. Pause and resume whenever you need. “2100” invites distance from today, not a lifespan prediction; choose a nearer future if that fits better."
        }), i.jsx("ol", {
          className: "home-path-map",
          children: n.map((o, s) => i.jsxs("li", {
            className: `home-path-map-step home-path-map-${o.phase.toLowerCase()} ${s + 1 === e ? "is-current" : ""}`,
            "aria-current": s + 1 === e ? "step" : void 0,
            children: [i.jsx("span", {
              className: "home-path-map-node",
              "aria-hidden": "true",
              children: String(s + 1).padStart(2, "0")
            }), i.jsxs("div", {
              className: "home-path-map-copy",
              children: [s % 2 === 0 && i.jsx("span", {
                className: "home-path-map-phase",
                children: o.phase
              }), i.jsx("strong", {
                children: o.title
              }), i.jsx("span", {
                children: o.cue
              })]
            })]
          }, o.title))
        })]
      })]
    })]
  });
}
function Q2() {
  return i.jsxs("svg", {
    viewBox: "0 0 64 64",
    fill: "none",
    focusable: "false",
    children: [i.jsx("path", {
      d: "M34 11c13 0 21 9 21 21 0 2-.3 4-.8 5M50 43C45 51 37 55 28 53M20 50C12 46 8 39 9 30M12 22c4-7 11-11 19-11"
    }), i.jsx("path", {
      className: "home-glyph-accent",
      d: "m49 34 5 4 5-5M34 49l-6 4 5 5M17 25l-6-4-5 5"
    }), i.jsx("circle", {
      cx: "31",
      cy: "11",
      r: "3"
    }), i.jsx("circle", {
      cx: "54",
      cy: "38",
      r: "3"
    }), i.jsx("circle", {
      cx: "28",
      cy: "53",
      r: "3"
    })]
  });
}
function X2() {
  return i.jsxs("svg", {
    viewBox: "0 0 64 64",
    fill: "none",
    focusable: "false",
    children: [i.jsx("path", {
      d: "M32 56V36c0-7-3-12-11-17L12 9M32 36c0-7 3-12 11-17l9-10"
    }), i.jsx("path", {
      className: "home-glyph-accent",
      d: "M12 9v9m0-9h9M52 9v9m0-9h-9"
    }), i.jsx("circle", {
      cx: "32",
      cy: "55",
      r: "3"
    }), i.jsx("circle", {
      cx: "12",
      cy: "9",
      r: "3"
    }), i.jsx("circle", {
      cx: "52",
      cy: "9",
      r: "3"
    })]
  });
}
function J2({
  onEnter: e
}) {
  return i.jsx("main", {
    className: "title-cover",
    "aria-labelledby": "title-cover-heading",
    children: i.jsxs("section", {
      className: "title-cover-inner",
      children: [i.jsx("p", {
        className: "title-cover-kicker",
        children: "A LITTLE DISTANCE. A CLEARER VIEW."
      }), i.jsxs("h1", {
        className: "title-cover-heading",
        id: "title-cover-heading",
        children: ["Dear ", i.jsx("span", {
          children: "2100."
        })]
      }), i.jsxs("p", {
        className: "title-cover-question",
        children: ["What have you always", i.jsx("br", {}), i.jsx("em", {
          children: "wanted to do?"
        })]
      }), i.jsxs("button", {
        className: "title-cover-enter",
        type: "button",
        onClick: e,
        children: ["Begin ", i.jsx(Qe, {
          size: 20,
          "aria-hidden": "true"
        })]
      })]
    })
  });
}
function eN({
  answers: e,
  onChange: t
}) {
  const n = jr(e),
    r = n.length,
    o = r >= 3 && r <= 5,
    s = h.useId(),
    a = r < 3 ? `Choose ${3 - r} more ${r === 2 ? "value" : "values"}.` : r === 3 ? "Three chosen. Add up to two more if you wish." : r === 4 ? "Four chosen. Add one more if you wish." : "Five chosen. Tap a selected value to make room.";
  return i.jsxs("div", {
    className: "values-self-choice",
    children: [i.jsxs("div", {
      className: "values-choice-heading",
      children: [i.jsxs("div", {
        children: [i.jsx("span", {
          children: "MY INNER COMPASS"
        }), i.jsx("h2", {
          children: "What matters to me?"
        })]
      }), i.jsxs("span", {
        className: `values-count ${o ? "is-ready" : ""}`,
        "aria-hidden": "true",
        children: [o && i.jsx(Rt, {
          size: 12
        }), r, " / 5"]
      })]
    }), i.jsxs("p", {
      className: "values-instruction",
      children: ["Choose at least ", i.jsx("strong", {
        children: "3"
      }), ". You can choose ", i.jsx("strong", {
        children: "5"
      }), "."]
    }), i.jsx("div", {
      className: "flow-value-grid",
      role: "group",
      "aria-label": "Choose three to five values",
      "aria-describedby": `${s}-status`,
      children: B2.map(l => {
        const c = e.values.includes(l),
          u = e.customValue.trim().toLocaleLowerCase() === l.toLocaleLowerCase();
        return i.jsxs("button", {
          type: "button",
          "aria-pressed": c,
          disabled: !c && r >= 5 && !u,
          className: c ? "selected" : "",
          onClick: () => t(c ? e.values.filter(d => d !== l) : [...e.values, l]),
          children: [c && i.jsx(Rt, {
            size: 11,
            strokeWidth: 2.5,
            "aria-hidden": "true"
          }), i.jsx("span", {
            children: l
          })]
        }, l);
      })
    }), i.jsx("p", {
      id: `${s}-status`,
      className: "values-selection-status",
      role: "status",
      "aria-live": "polite",
      children: a
    }), i.jsx(tN, {
      selected: n
    })]
  });
}
function tN({
  selected: e
}) {
  const t = h.useId().replace(/:/g, ""),
    n = [[91, 42, 133, 42], [253, 73, 194, 73], [85, 112, 142, 112], [252, 153, 194, 153], [94, 192, 144, 192]];
  return i.jsxs("figure", {
    className: `values-helix ${e.length >= 3 ? "is-ready" : ""}`,
    "aria-label": e.length ? `My values: ${e.join(", ")}` : "Your values will attach to this helix as you choose them",
    children: [i.jsxs("svg", {
      viewBox: "0 0 340 228",
      fill: "none",
      "aria-hidden": "true",
      children: [i.jsxs("defs", {
        children: [i.jsxs("linearGradient", {
          id: `${t}-strand`,
          x1: "136",
          y1: "10",
          x2: "204",
          y2: "219",
          gradientUnits: "userSpaceOnUse",
          children: [i.jsx("stop", {
            stopColor: "#8bc1e6"
          }), i.jsx("stop", {
            offset: ".35",
            stopColor: "#244a72"
          }), i.jsx("stop", {
            offset: ".58",
            stopColor: "#dae9f5"
          }), i.jsx("stop", {
            offset: "1",
            stopColor: "#386b96"
          })]
        }), i.jsxs("linearGradient", {
          id: `${t}-red`,
          x1: "205",
          y1: "10",
          x2: "135",
          y2: "220",
          gradientUnits: "userSpaceOnUse",
          children: [i.jsx("stop", {
            stopColor: "#ce9287"
          }), i.jsx("stop", {
            offset: ".45",
            stopColor: "#913e49"
          }), i.jsx("stop", {
            offset: ".7",
            stopColor: "#eed9cb"
          }), i.jsx("stop", {
            offset: "1",
            stopColor: "#ad6970"
          })]
        }), i.jsxs("radialGradient", {
          id: `${t}-facet`,
          children: [i.jsx("stop", {
            stopColor: "#f9fbfc"
          }), i.jsx("stop", {
            offset: "1",
            stopColor: "#bdd9e9"
          })]
        })]
      }), i.jsx("ellipse", {
        cx: "170",
        cy: "211",
        rx: "69",
        ry: "10",
        fill: "#173c6510"
      }), Array.from({
        length: 19
      }, (r, o) => {
        const s = 14 + o * 11,
          a = 170 + Math.sin(o / 18 * Math.PI * 3) * 33;
        return i.jsxs("g", {
          opacity: .35 + Math.abs(Math.sin(o)) * .4,
          children: [i.jsx("path", {
            d: `M${a} ${s} L${340 - a} ${s}`,
            stroke: "#698da8",
            strokeWidth: "1.3"
          }), i.jsx("circle", {
            cx: a,
            cy: s,
            r: "2",
            fill: "#467aa2"
          }), i.jsx("circle", {
            cx: 340 - a,
            cy: s,
            r: "2",
            fill: "#b47070"
          })]
        }, o);
      }), i.jsx("path", {
        d: "M170 14 C214 31 214 62 170 80 S126 128 170 146 S214 194 170 212",
        stroke: `url(#${t}-strand)`,
        strokeWidth: "5",
        strokeLinecap: "round"
      }), i.jsx("path", {
        d: "M170 14 C126 31 126 62 170 80 S214 128 170 146 S126 194 170 212",
        stroke: `url(#${t}-red)`,
        strokeWidth: "4",
        strokeLinecap: "round"
      }), n.map(([r, o, s, a], l) => i.jsxs("g", {
        className: e[l] ? "helix-bond populated" : "helix-bond",
        children: [i.jsx("path", {
          d: `M${s} ${a} L${r} ${o}`,
          stroke: l % 2 ? "#ae616c" : "#547fa0",
          strokeDasharray: e[l] ? void 0 : "3 4"
        }), i.jsx("circle", {
          cx: s,
          cy: a,
          r: "4",
          fill: "#f8f6ef",
          stroke: "#6c92ae"
        }), i.jsx("path", {
          d: `M${r} ${o - 10} l9 5 v10 l-9 5 -9 -5 v-10Z`,
          fill: `url(#${t}-facet)`,
          stroke: l % 2 ? "#b76c75" : "#537fa0"
        }), i.jsx("path", {
          d: `M${r - 9} ${o - 5} L${r} ${o} l9 -5 M${r} ${o} v10`,
          stroke: "#7799b0",
          strokeWidth: ".7"
        })]
      }, l))]
    }), i.jsx("ul", {
      className: "helix-values",
      children: e.map((r, o) => i.jsx("li", {
        style: {
          "--node-top": `${n[o][1] / 228 * 100}%`,
          "--value-index": o
        },
        className: o % 2 ? "right" : "left",
        children: i.jsx("span", {
          children: r
        })
      }, r))
    }), i.jsx("figcaption", {
      children: e.length ? "The qualities I choose to live by." : "Choose a value. Watch it take shape."
    })]
  });
}
class nN {
  constructor() {
    Zn(this, "context", null);
    Zn(this, "master", null);
    Zn(this, "voices", []);
    Zn(this, "surfSource", null);
    Zn(this, "surfGain", null);
    Zn(this, "enabled", !1);
    Zn(this, "level", .3);
  }
  async enable(t) {
    if (this.enabled = t, !t) return this.stop(), !1;
    try {
      if (this.context ?? (this.context = new AudioContext()), await this.context.resume(), !this.enabled) return !1;
      this.start(), this.cue("open");
    } catch {
      this.enabled = !1;
    }
    return this.enabled;
  }
  start() {
    if (!this.context || this.master) return;
    const t = this.context;
    this.master = t.createGain(), this.master.gain.setValueAtTime(0, t.currentTime), this.master.gain.linearRampToValueAtTime(this.level * .035, t.currentTime + 2), this.master.connect(t.destination), [130.81, 196, 261.63].forEach((n, r) => {
      const o = t.createOscillator(),
        s = t.createGain();
      o.type = "sine", o.frequency.value = n, o.detune.value = r * 2, s.gain.value = .6 / (r + 1), o.connect(s), s.connect(this.master), o.start(), this.voices.push(o);
    });
  }
  volume(t) {
    this.level = Math.max(0, Math.min(1, t)), this.context && this.master && this.master.gain.setTargetAtTime(this.level * .035, this.context.currentTime, .2), this.context && this.surfGain && this.surfGain.gain.setTargetAtTime(this.level * .045, this.context.currentTime, .2);
  }
  cue(t = "tap") {
    const n = this.context;
    if (!this.enabled || !n || n.state !== "running") return;
    (t === "save" ? [392, 523.25, 659.25] : t === "open" ? [261.63, 392] : t === "next" ? [329.63, 440] : [440]).forEach((o, s) => {
      const a = n.createOscillator(),
        l = n.createGain(),
        c = n.currentTime + s * .08;
      a.type = "sine", a.frequency.value = o, l.gain.setValueAtTime(0, c), l.gain.linearRampToValueAtTime(this.level * .045, c + .018), l.gain.exponentialRampToValueAtTime(1e-4, c + .55), a.connect(l), l.connect(n.destination), a.start(c), a.stop(c + .6), a.onended = () => {
        a.disconnect(), l.disconnect();
      };
    });
  }
  wave(t) {
    const n = this.context;
    if (!this.enabled || !n || n.state !== "running") return;
    t === "start" && this.startWaveBed(), (t === "start" ? [293.66, 369.99] : t === "crest" ? [440, 554.37] : t === "return" ? [369.99, 493.88] : [440, 554.37, 659.25]).forEach((o, s) => {
      const a = n.createOscillator(),
        l = n.createGain(),
        c = n.currentTime + s * .09;
      a.type = s === 0 ? "sine" : "triangle", a.frequency.setValueAtTime(o, c), l.gain.setValueAtTime(1e-4, c), l.gain.exponentialRampToValueAtTime(this.level * .045, c + .025), l.gain.exponentialRampToValueAtTime(1e-4, c + .8), a.connect(l), l.connect(n.destination), a.start(c), a.stop(c + .85), a.onended = () => {
        a.disconnect(), l.disconnect();
      };
    }), t === "complete" && this.stopWaveBed();
  }
  stopWave() {
    this.stopWaveBed();
  }
  startWaveBed() {
    if (!this.context || this.surfSource || !this.enabled) return;
    const t = this.context,
      n = t.createBuffer(1, t.sampleRate * 2.5, t.sampleRate),
      r = n.getChannelData(0);
    let o = 0;
    for (let c = 0; c < r.length; c += 1) o = (o + (Math.random() * 2 - 1) * .08) / 1.03, r[c] = o * .75;
    const s = t.createBufferSource(),
      a = t.createBiquadFilter(),
      l = t.createGain();
    s.buffer = n, s.loop = !0, a.type = "lowpass", a.frequency.setValueAtTime(750, t.currentTime), a.frequency.linearRampToValueAtTime(1250, t.currentTime + 1.4), l.gain.setValueAtTime(1e-4, t.currentTime), l.gain.linearRampToValueAtTime(this.level * .045, t.currentTime + .65), s.connect(a), a.connect(l), l.connect(t.destination), s.start(), this.surfSource = s, this.surfGain = l;
  }
  stopWaveBed() {
    if (!this.context || !this.surfSource || !this.surfGain) return;
    const t = this.surfSource,
      n = this.surfGain;
    n.gain.cancelScheduledValues(this.context.currentTime), n.gain.setTargetAtTime(1e-4, this.context.currentTime, .12), t.stop(this.context.currentTime + .5), t.onended = () => {
      t.disconnect(), n.disconnect();
    }, this.surfSource = null, this.surfGain = null;
  }
  shift(t) {
    if (!this.context) return;
    const n = t >= 5 ? [146.83, 220, 293.66] : [130.81, 196, 261.63];
    this.voices.forEach((r, o) => r.frequency.setTargetAtTime(n[o], this.context.currentTime, 1.2));
  }
  pause() {
    var t;
    (t = this.context) == null || t.suspend();
  }
  resume() {
    var t;
    this.enabled && ((t = this.context) == null || t.resume());
  }
  stop() {
    if (!this.context) return;
    const t = this.master;
    t == null || t.gain.setTargetAtTime(0, this.context.currentTime, .12);
    for (const n of this.voices) n.stop(this.context.currentTime + .5), n.onended = () => n.disconnect();
    this.voices = [], this.stopWaveBed(), this.master = null, t && setTimeout(() => t.disconnect(), 650);
  }
  destroy() {
    var t;
    this.enabled = !1, this.stop(), (t = this.context) == null || t.close(), this.context = null;
  }
}
const ge = new nN();
const dearEmbeddedHistory=window.parent!==window;
let dearHistoryStarted=false,dearHistoryRestoring=false,dearHistoryDepth=0,dearHistoryCursor="";
function rememberDearScreen(id,stage) {
  const screen={id,cursors:{stage}},cursor=JSON.stringify(screen);
  if(!dearEmbeddedHistory)return;
  const mode=!dearHistoryStarted?"init":dearHistoryRestoring||cursor===dearHistoryCursor?"replace":"push";
  if(mode==="push")dearHistoryDepth++;
  dearHistoryStarted=true;dearHistoryRestoring=false;dearHistoryCursor=cursor;
  window.parent.postMessage({type:"mentication:screen",journeyId:"dear2100",mode,screen},location.origin);
}
function requestDearHistoryBack(){
  if(!dearEmbeddedHistory||dearHistoryDepth<=0)return false;
  window.parent.postMessage({type:"mentication:screen-back",journeyId:"dear2100"},location.origin);return true;
}
function useQuestionHistory(id,current,onCurrent) {
  const restore=h.useRef(false),mounted=h.useRef(false);
  h.useEffect(()=>{
    if(dearEmbeddedHistory){rememberDearScreen(current,id==="outcome"?9:Number(id));return;}
    const state={...history.state,dearQuestion:{id,current:current||""}};if(!mounted.current){history.replaceState(state,"");mounted.current=true;}else if(restore.current){restore.current=false;}else history.pushState(state,"");
  },[id,current]);
  h.useEffect(()=>{const pop=event=>{if(dearEmbeddedHistory||event.state?.dearQuestion?.id!==id)return;restore.current=true;onCurrent(event.state.dearQuestion.current);};window.addEventListener("popstate",pop);return()=>window.removeEventListener("popstate",pop);});
}
function SequentialQuestions({id, steps, current, onCurrent, onDone, doneLabel="Continue", optionalStart=steps.length, blocked=false}) {
  useQuestionHistory(id,steps.some(step=>`${id}:${step.id}`===current)?current:`${id}:${steps[0].id}`,onCurrent);
  const root=h.useRef(null), index=Math.max(0,steps.findIndex(step=>`${id}:${step.id}`===current)), step=steps[index];
  const go=next=>onCurrent(`${id}:${steps[next].id}`);
  h.useEffect(()=>{const element=root.current?.querySelector("h1");element?.focus({preventScroll:true});root.current?.scrollIntoView({block:"start"});},[index]);
  h.useEffect(()=>{const back=event=>{if(requestDearHistoryBack()){event.preventDefault();return;}if(index>0){event.preventDefault();go(index>=optionalStart?optionalStart-1:index-1);}};document.addEventListener("dear:question-back",back);return()=>document.removeEventListener("dear:question-back",back);});
  return i.jsxs("section",{ref:root,className:"question-page sequential-question",children:[
    i.jsx("p",{className:"question-kicker",children:index<optionalStart?`One question · ${index+1} of ${optionalStart}`:"Optional detail"}),
    i.jsx("h1",{id:"screen-title",tabIndex:-1,children:step.title}),
    step.hint&&i.jsx("p",{className:"lede",children:step.hint}),step.field,
    i.jsx("button",{className:"primary-button",disabled:blocked||step.valid===false,onClick:()=>index>=optionalStart?go(optionalStart-1):index<optionalStart-1?go(index+1):onDone(),children:index>=optionalStart?"Return to my answer":index<optionalStart-1?"Continue":doneLabel}),
    index===optionalStart-1&&steps.length>optionalStart&&i.jsxs("details",{className:"foldout",children:[i.jsx("summary",{children:"Add an optional detail"}),...steps.slice(optionalStart).map((extra,key)=>i.jsx("button",{className:"text-button",onClick:()=>go(optionalStart+key),children:extra.title},extra.id))]}),
    index>0&&i.jsx("button",{className:"text-button",onClick:()=>{if(!requestDearHistoryBack())go(index>=optionalStart?optionalStart-1:index-1);},children:"Back to previous question"})
  ]});
}
function ThreatCheck({check,onCheck,current,onCurrent,onDone}) {
  useQuestionHistory("3",current?.startsWith("threat:")?current:"threat:0",onCurrent);
  const value=check||emptyThreatCheck(),score=scoreThreatCheck(value),passed=value.submitted&&score!==null&&score>=3;
  const index=Math.min(3,Math.max(0,Number(current?.split(":")[1])||0)),question=THREAT_QUESTIONS[index],root=h.useRef(null);
  h.useEffect(()=>{root.current?.querySelector("h1")?.focus();},[index,value.submitted]);
  h.useEffect(()=>{const back=event=>{event.preventDefault();if(!requestDearHistoryBack())onCurrent(current==="threat:score"?"threat:3":index>0?`threat:${index-1}`:"");};document.addEventListener("dear:question-back",back);return()=>document.removeEventListener("dear:question-back",back);});
  return i.jsxs("section",{ref:root,className:"threat-understanding-check sequential-question",children:value.submitted&&current==="threat:score"?[
    i.jsx("h1",{tabIndex:-1,children:"Your understanding check"}),i.jsx("p",{role:"status",children:`${score} of 4 correct (${score*25}%). ${passed?"You can continue.":"Review the takeaways, then try again."}`}),
    ...THREAT_QUESTIONS.map((q,key)=>i.jsxs("p",{className:"threat-check-feedback",children:[i.jsx("strong",{children:value.answers[key]===q.correct?"Matched the teaching. ":"Review this takeaway. "}),q.explanation]},q.id)),
    i.jsx("button",{className:"primary-button cream-button",onClick:()=>{if(passed)onDone();else{onCheck(emptyThreatCheck());onCurrent("threat:0");}},children:passed?"Continue":"Try the four questions again"}),i.jsx("button",{className:"text-button",onClick:()=>onCurrent(""),children:"Return to the teaching"})
  ]:[i.jsx("p",{className:"question-kicker",children:`Understanding · ${index+1} of 4`}),i.jsx("h1",{tabIndex:-1,children:question.question}),
    i.jsx("p",{children:"Choose one answer. At least 3 of 4 correct (75%) are needed to continue. This checks understanding, not your mental health."}),
    i.jsxs("fieldset",{children:[i.jsx("legend",{className:"sr-only",children:question.question}),...question.options.map((option,answer)=>i.jsxs("label",{children:[i.jsx("input",{type:"radio",name:`threat-check-${question.id}`,checked:value.answers[index]===answer,onChange:()=>onCheck({answers:value.answers.map((old,key)=>key===index?answer:old),submitted:false})}),i.jsx("span",{children:option})]},answer))]}),
    i.jsx("button",{className:"primary-button cream-button",disabled:value.answers[index]===null,onClick:()=>{if(index<3)onCurrent(`threat:${index+1}`);else{onCheck({...value,submitted:true});onCurrent("threat:score");}},children:index<3?"Next question":"Check my answers"}),
    i.jsx("button",{className:"text-button",onClick:()=>{if(!requestDearHistoryBack())onCurrent(index>0?`threat:${index-1}`:"");},children:index>0?"Previous question":"Return to the teaching"})]});
}
function rN({
  phases: e,
  onLearn: t,
  phase = 0, onPhase = () => {}, check, onCheck, current, onCurrent, onDone
}) {
  const n = phase, r = onPhase,
    o = h.useRef(null),
    s = h.useRef([]),
    a = h.useId(),
    l = e[n],
    c = (f, y = !1) => {
      var w;
      const x = Math.max(0, Math.min(e.length - 1, f));
      x !== n && (r(x), ge.cue()), y && ((w = s.current[x]) == null || w.focus());
    },
    u = (f, y = !1) => {
      const x = f.key === "ArrowRight" ? n + 1 : f.key === "ArrowLeft" ? n - 1 : f.key === "Home" ? 0 : f.key === "End" ? e.length - 1 : null;
      x !== null && (f.preventDefault(), c(x, y));
    },
    d = f => {
      !f.isPrimary || f.button !== 0 || f.target.closest("button") || (o.current = {
        x: f.clientX,
        y: f.clientY,
        id: f.pointerId
      }, f.currentTarget.setPointerCapture(f.pointerId));
    },
    p = f => {
      const y = o.current;
      if (o.current = null, !y || y.id !== f.pointerId) return;
      const x = f.clientX - y.x,
        w = f.clientY - y.y;
      Math.abs(x) >= 44 && Math.abs(x) > Math.abs(w) * 1.35 && c(n + (x < 0 ? 1 : -1));
    };
  if(current?.startsWith("threat:"))return i.jsx(ThreatCheck,{check,onCheck,current,onCurrent,onDone});
  return i.jsxs("div", {
    className: "threat-system threat-system-standalone",
    role: "region",
    "aria-label": "Our Threat Detection System",
    children: [i.jsxs("div", {
      className: "threat-system-heading",
      children: [i.jsxs("span", {
        children: ["THREAT SYSTEM ", i.jsx("i", {}), " EVOLUTION"]
      }), i.jsxs("span", {
        children: ["0", n + 1, " / 0", e.length]
      })]
    }), i.jsxs("h1", {
      id: "screen-title",
      children: ["Our Threat", i.jsx("br", {}), "Detection ", i.jsx("em", {
        children: "System."
      })]
    }), i.jsxs("button", {
      type: "button",
      className: "threat-system-principle",
      onClick: t,
      children: [i.jsx("span", {
        className: "threat-brain",
        "aria-hidden": "true",
        children: i.jsx(W1, {
          size: 24
        })
      }), i.jsxs("span", {
        children: [i.jsx("strong", {
          children: "Protective responses can sometimes get in the way of what matters."
        }), i.jsx("small", {
          children: "HOW SURVIVAL BECAME SOCIAL · TAP TO EXPLORE"
        })]
      }), i.jsx(tt, {
        size: 18
      })]
    }), i.jsx("div", {
      className: "threat-system-timeline",
      role: "tablist",
      "aria-label": "Explore the four threat-detection phases",
      children: e.map((f, y) => i.jsxs("button", {
        ref: x => {
          s.current[y] = x;
        },
        type: "button",
        role: "tab",
        id: `${a}-tab-${y}`,
        "aria-controls": `${a}-panel`,
        "aria-selected": n === y,
        tabIndex: n === y ? 0 : -1,
        className: n === y ? "active" : "",
        onKeyDown: x => u(x, !0),
        onClick: () => c(y),
        children: [i.jsx("i", {
          className: "threat-phase-node",
          "aria-hidden": "true"
        }), i.jsxs("span", {
          children: ["0", y + 1]
        }), i.jsx("strong", {
          children: f.name
        })]
      }, f.name))
    }), i.jsxs("div", {
      className: "threat-system-scene threat-swipe-scene",
      tabIndex: 0,
      role: "group",
      "aria-label": `Explore the threat scene: ${l.name}`,
      "aria-describedby": `${a}-gesture-help`,
      onKeyDown: f => u(f),
      onPointerDown: d,
      onPointerUp: p,
      onPointerCancel: () => {
        o.current = null;
      },
      children: [e.map((f, y) => i.jsx("img", {
        className: n === y ? "is-current" : "",
        loading: "lazy",
        decoding: "async",
        width: 1536,
        height: 1024,
        src: f.image,
        alt: n === y ? f.scene : "",
        "aria-hidden": n !== y,
        draggable: !1
      }, f.image)), i.jsxs("span", {
        className: "threat-scene-badge",
        children: ["LIVE POV · ", l.name.toUpperCase()]
      }), i.jsxs("div", {
        className: "threat-scene-arrows",
        children: [i.jsx("button", {
          type: "button",
          "aria-label": "Previous threat phase",
          disabled: n === 0,
          onClick: () => c(n - 1),
          children: i.jsx(Gr, {
            size: 20
          })
        }), i.jsx("button", {
          type: "button",
          "aria-label": "Next threat phase",
          disabled: n === e.length - 1,
          onClick: () => c(n + 1),
          children: i.jsx(li, {
            size: 20
          })
        })]
      }), i.jsxs("div", {
        className: "threat-scene-caption",
        children: [i.jsxs("span", {
          children: [l.moment, " · ", l.tag]
        }), i.jsx("strong", {
          children: l.title
        })]
      })]
    }), i.jsxs("p", {
      className: "threat-interaction-hint",
      children: [i.jsx(Q1, {
        size: 15,
        "aria-hidden": "true"
      }), i.jsx("strong", {
        children: "Tap a phase"
      }), i.jsx("span", {
        children: "or swipe the image"
      })]
    }), i.jsx("span", {
      id: `${a}-gesture-help`,
      className: "sr-only",
      children: "Swipe left or right. With a keyboard, use Left and Right arrows, Home for the first phase and End for the last."
    }), i.jsxs("div", {
      className: "threat-system-insight",
      id: `${a}-panel`,
      role: "tabpanel",
      "aria-labelledby": `${a}-tab-${n}`,
      tabIndex: 0,
      "aria-live": "polite",
      children: [i.jsx("p", {
        children: l.text
      }), i.jsxs("div", {
        children: [i.jsx("small", {
          children: "REFRAME"
        }), i.jsxs("span", {
          children: ["“", l.reframe, "”"]
        })]
      })]
    }), i.jsx("div", {
      className: "threat-system-footer",
      children: i.jsx("span", {
        children: "Noticing may create room to choose; it does not switch off fear."
      })
    }), i.jsxs("details", {
      className: "threat-system-deep",
      children: [i.jsxs("summary", {
        children: ["Explore this phase ", i.jsx(Ke, {
          size: 15
        })]
      }), i.jsx("p", {
        children: l.detail
      }), i.jsxs("button", {
        type: "button",
        onClick: t,
        children: ["How did protection become social? ", i.jsx(tt, {
          size: 14
        })]
      })]
    }, `detail-${n}`), i.jsx("button",{className:"primary-button cream-button",onClick:()=>onCurrent("threat:0"),children:"Check my understanding"})]
  });
}
function oN({
  entries: e
}) {
  const [t, n] = h.useState(null);
  if (!e.length) return null;
  const r = Math.max(0, e.findIndex(l => l.id === t)),
    o = e[r],
    s = o.actualDiscomfort == null || o.discomfort == null ? null : o.actualDiscomfort - o.discomfort,
    a = s === null ? "No comparison: one or both optional ratings were not recorded. Expected versus experienced discomfort is not a before/after improvement score." : s > 0 ? "This attempt felt more uncomfortable than you expected. Consider what support or adjustment a next attempt would need." : s < 0 ? "This attempt felt less uncomfortable than you expected. Note the conditions that made this attempt different." : "Your expected and reported discomfort matched. What happened still matters more than the score.";
  return i.jsxs("section", {
    className: "comparison-card",
    "aria-label": "Prediction Lab comparison",
    children: [i.jsxs("div", {
      className: "comparison-top",
      children: [i.jsx(hu, {
        size: 17
      }), i.jsx("span", {
        children: "YOUR EXPECTATION, MEET EXPERIENCE."
      })]
    }), i.jsxs("h2", {
      children: ["The part you", i.jsx("br", {}), i.jsx("em", {
        children: "couldn’t know before."
      })]
    }), i.jsx("p", {
      className: "comparison-action",
      children: o.action
    }), i.jsxs("div", {
      className: "comparison-bars",
      "aria-label": `Expected discomfort ${o.discomfort} out of 10. Actual discomfort ${o.actualDiscomfort} out of 10.`,
      children: [i.jsxs("div", {
        className: "comparison-row",
        children: [i.jsx("span", {
          children: "I expected"
        }), i.jsxs("b", {
          children: [ratingText(o.discomfort), i.jsx("small", {
            children: " / 10"
          })]
        }), i.jsx("div", {
          className: "comparison-track",
          children: i.jsx("i", {
            style: {
              width: `${o.discomfort * 10}%`
            }
          })
        })]
      }), i.jsxs("div", {
        className: "comparison-row actual",
        children: [i.jsx("span", {
          children: "I experienced"
        }), i.jsxs("b", {
          children: [ratingText(o.actualDiscomfort), i.jsx("small", {
            children: " / 10"
          })]
        }), i.jsx("div", {
          className: "comparison-track",
          children: i.jsx("i", {
            style: {
              width: `${o.actualDiscomfort * 10}%`
            }
          })
        })]
      })]
    }), i.jsx("p", {
      className: "comparison-reading",
      "aria-live": "polite",
      children: a
    }), i.jsxs("div", {
      className: "comparison-bottom",
      children: [i.jsxs("span", {
        children: [new Date(o.createdAt).toLocaleDateString(void 0, {
          day: "numeric",
          month: "short"
        }), " ", "· Your own ratings"]
      }), i.jsxs("div", {
        children: [i.jsx("button", {
          "aria-label": "Newer experiment",
          disabled: r === 0,
          onClick: () => n(e[r - 1].id),
          children: i.jsx(F1, {
            size: 16
          })
        }), i.jsxs("span", {
          children: [r + 1, " / ", e.length]
        }), i.jsx("button", {
          "aria-label": "Older experiment",
          disabled: r === e.length - 1,
          onClick: () => n(e[r + 1].id),
          children: i.jsx(Qe, {
            size: 16
          })
        })]
      })]
    })]
  });
}
function Gx(e, t, n) {
  const r = URL.createObjectURL(new Blob([t], {
      type: n
    })),
    o = document.createElement("a");
  o.href = r, o.download = e, o.click(), setTimeout(() => URL.revokeObjectURL(r), 1e4);
}
function mc(e) {
  const t = a => String(a ?? "").replace(/[&<>"']/g, l => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[l]),
    n = {
      want: "What I want",
      barriers: "What gets in the way",
      barrierFocus: "The kind of barrier I chose to explore",
      practicalNote: "Practical constraints",
      practicalSupport: "Support or adjustments that would help",
      prediction: "My prediction",
      audience: "Whose response I imagine",
      meaning: "What I fear it would mean",
      voice: "Where this expectation feels familiar",
      body: "What I notice in my body",
      now: "What starting could change now",
      avoidFuture: "If I keep postponing",
      actFuture: "If I make room for it",
      judgment: "The standard I chose",
      behavior: "My protective response",
      cost: "What that response costs",
      values: "My chosen values",
      customValue: "My own value",
      valueAction: "My values in action",
      minutes: "Minutes available",
      budget: "Available budget",
      competing: "What competes for my time",
      action: "My next step",
      likelihood: "Predicted likelihood (%)",
      discomfort: "Expected discomfort (0–10)",
      evidenceLookFor: "What I will observe",
      day: "When",
      time: "Time",
      ifThen: "If the obstacle appears",
      reward: "Afterwards",
      proud: "A past moment worth remembering"
    },
    r = Object.entries(e.answers).map(([a, l]) => `<section><h2>${t(n[a] || a)}</h2><p>${t(a === "day" && e.scheduledLabel ? e.scheduledLabel : Array.isArray(l) ? l.join(", ") : l) || "Not recorded"}</p></section>`).join(""),
    o = e.entries.map(a => `<article><small>${t(new Date(a.createdAt).toLocaleDateString())}</small><h2>${t(a.action)}</h2><p><b>Wanted:</b> ${t(a.want)}</p><p><b>Predicted:</b> ${t(a.prediction)}</p><p><b>Observed:</b> ${t(a.observed)}</p><p><b>Result:</b> ${t(a.result)}</p><p><b>Likelihood estimate:</b> ${ratingText(a.likelihood)}% before → ${ratingText(a.afterLikelihood)}% after</p><p><b>Discomfort:</b> ${ratingText(a.discomfort)} expected → ${ratingText(a.actualDiscomfort)} experienced</p><p><b>Learned:</b> ${t(a.learned) || "Not recorded"}</p><p><b>Next adjustment:</b> ${t(a.next) || "Not recorded"}</p></article>`).join(""),
    s = e.chapters.map(a => `<article><small>${t(new Date(a.createdAt).toLocaleDateString())} · SAVED CHAPTER</small><h2>${t(a.answers.want)}</h2>${Object.entries(a.answers).filter(([, l]) => Array.isArray(l) ? l.length : String(l).trim()).map(([l, c]) => `<section><h2>${t(n[l] || l)}</h2><p>${t(l === "day" ? a.scheduledLabel || c : Array.isArray(c) ? c.join(", ") : c)}</p></section>`).join("")}</article>`).join("");
  Gx("Dear-2100-My-Book.html", `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>My Dear 2100 Book</title><style>body{max-width:760px;margin:50px auto;padding:24px;background:#f7f1e6;color:#112b50;font:17px/1.6 Georgia,serif}h1{font-size:64px;font-weight:400;font-style:italic}h2{font-size:17px;margin:0;color:#a94338}section{padding:20px 0;border-bottom:1px solid #d7cebe}p{white-space:pre-wrap;margin:8px 0}article{padding:24px;border:1px solid #d7cebe;border-radius:16px;margin:18px 0}small{font:12px sans-serif;color:#657181}@media print{body{margin:0;background:white}article,section{break-inside:avoid}}</style><small>MENTICATION · PERSONAL COPY · ${t(new Date().toLocaleDateString())}</small><h1>Dear 2100.</h1><p>A record of what matters to me, what I predicted, and what I learned.</p><h1 style="font-size:40px">My saved chapters</h1>${s || "<p>No chapters completed yet.</p>"}<h1 style="font-size:40px">My current direction</h1>${r}<h1 style="font-size:40px">My evidence</h1>${o || "<p>No outcomes recorded yet.</p>"}<p><small>This is a personal reflection record, not a diagnosis or clinical assessment. Keep this downloaded copy somewhere private.</small></p></html>`, "text/html");
}
function gc() {
  if (typeof crypto < "u" && typeof crypto.randomUUID == "function") try {
    return crypto.randomUUID();
  } catch {}
  if (typeof crypto < "u" && typeof crypto.getRandomValues == "function") {
    const e = crypto.getRandomValues(new Uint8Array(16));
    e[6] = e[6] & 15 | 64, e[8] = e[8] & 63 | 128;
    const t = [...e].map(n => n.toString(16).padStart(2, "0")).join("");
    return `${t.slice(0, 8)}-${t.slice(8, 12)}-${t.slice(12, 16)}-${t.slice(16, 20)}-${t.slice(20)}`;
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, e => {
    const t = Math.random() * 16 | 0;
    return (e === "x" ? t : t & 3 | 8).toString(16);
  });
}
const sN = "" + new URL("physical-threat-ByiYxJQt.webp", import.meta.url).href,
  iN = "" + new URL("threat-phase-02-D3-7lfyk.webp", import.meta.url).href,
  aN = "" + new URL("social-moment-CNxb0E0p.webp", import.meta.url).href,
  lN = "" + new URL("prediction-BLQjKvD2.webp", import.meta.url).href,
  cN = "" + new URL("mentation-blue-symbol-D1yARSmr.png", import.meta.url).href,
  uN = "" + new URL("mentation-cream-symbol-u9ufjM8H.png", import.meta.url).href,
  Sf = "dear2100-book-v1";
const bookStore = createBookStore(localStorage, parseBook, Co, navigator.locks);
const dN = () => bookStore.load();
const fN = (book, version) => bookStore.save(book, version);
const hN = () => bookStore.remove();
const ratingText = (value, suffix = "") => value == null ? "Not recorded" : `${value}${suffix}`;
const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches || document.querySelector('[data-motion="quiet"]') !== null;
function useQuietMotion() {
  const [quiet, setQuiet] = h.useState(reducedMotion);
  h.useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setQuiet(reducedMotion());
    const observer = new MutationObserver(update);
    observer.observe(document.body, {subtree:true, attributes:true, attributeFilter:["data-motion"]});
    media.addEventListener("change", update);
    return () => { observer.disconnect(); media.removeEventListener("change", update); };
  }, []);
  return quiet;
}
const Wu = {
    "If I try, I’m afraid…": ["People will judge my attempt", "I’ll find out I’m not good enough", "I’ll risk the security I have", "I’m not sure how to name it yet"],
    "The practical thing in the way": ["I need a realistic time slot", "The cost feels out of reach", "My energy is already stretched", "I have responsibilities to work around"],
    "A practical barrier or other detail": ["I need more time", "I need help with the cost", "I need support or access", "I don’t know the first step"],
    "What might I miss if I keep postponing?": ["Finding out what I’m capable of", "Experiences I keep imagining", "Time spent on something that matters", "My priorities may change, and that may be okay"],
    "What might become possible if I try?": ["A life with more room for this dream", "Skills and experiences I can build on", "Knowing I gave it a real chance", "Learning that a different direction fits better"],
    "A resource, adjustment or support I need": ["Find a free or lower-cost way in", "Ask someone for practical help", "Make a smaller version fit my energy", "Protect one realistic time slot"],
    "My usual response": ["I keep researching instead of starting", "I wait until I feel ready", "I over-prepare", "I put it off", "I ask for reassurance"],
    "The longer-term cost": ["The idea stays untested", "I lose time I wanted to spend on it", "My world feels a little smaller", "I’m not sure yet"],
    "My own value": ["Adventure", "Compassion", "Independence", "Belonging"],
    "I am someone who…": ["Makes room for what matters", "Tries even when uncertain", "Treats myself with care while learning"],
    "The standard I want to use": ["Whether this matters to me", "Whether I showed up and tried", "Whether it fits my values and real responsibilities"],
    "My next step": ["Spend five minutes on a first attempt", "Ask one person for useful information", "Find one realistic opportunity"],
    "When fear arises, I will…": ["Notice the urge, ride the wave, then try one small part", "Name the prediction and check what is actually happening", "Make the step smaller and ask for support"],
    "If the usual obstacle shows up, then I will…": ["Shrink the step to two minutes", "Ask for practical help", "Change the time or setting"],
    "What will I actually look for?": ["Whether I can begin while uncomfortable", "What someone actually says or does", "What makes the task easier or harder"],
    "When have I done something that mattered, despite discomfort?": ["I had a difficult conversation", "I began before I felt ready", "I asked for help", "I kept going after a setback"],
    "What did I observe?": ["I stayed with it longer than I expected", "It was uncomfortable but manageable", "The response was mixed or neutral", "I stopped and noticed where I got stuck"],
    "What did I learn?": ["My prediction was only partly right", "The step needs to be smaller", "I need more information", "I don’t know yet"],
    "What would I keep or change next time?": ["Repeat the same step", "Make the next attempt smaller", "Ask for support", "Change the time or setting"]
  },
  pN = [{
    title: "The dream",
    fields: [["want", "I’ve always wanted to"], ["now", "What starting could change now"]]
  }, {
    title: "What gets in the way",
    fields: [["prediction", "If I try, I’m afraid"], ["practicalNote", "The practical barrier"], ["practicalSupport", "What would help"], ["barriers", "Other barriers"], ["behavior", "My protective response"], ["cost", "What this can cost"], ["audience", "Whose reaction I imagine"], ["meaning", "What I fear it means"], ["voice", "Where that expectation feels familiar"], ["body", "What I notice"]]
  }, {
    title: "Twenty years · two possibilities",
    fields: [["avoidFuture", "If I keep postponing"], ["actFuture", "If I make room to try"]]
  }, {
    title: "What matters to me",
    fields: [["values", "My values"], ["customValue", "My own value"], ["valueAction", "How I want to act"], ["judgment", "The standard I choose"]]
  }, {
    title: "My way forward",
    fields: [["action", "My next step"], ["day", "When"], ["time", "Time of day"], ["minutes", "Minutes"], ["ifThen", "When fear or an obstacle arrives"], ["budget", "Resources"], ["competing", "What competes for my time"], ["evidenceLookFor", "What I’ll look for"], ["likelihood", "My prediction estimate (%)"], ["discomfort", "Expected discomfort (out of 10)"], ["reward", "How I’ll mark the attempt"], ["proud", "A moment I want to remember"]]
  }];
function mN({
  chapter: e,
  saveStatus: t,
  current: n,
  onBook: r,
  onPlan: o,
  onObserve: s,
  onNew: a
}) {
  const [l, c] = h.useState("overview"),
    u = e.answers,
    d = jr(u);
  return i.jsxs("main", {
    className: "chapter-finish collection-page enter",
    tabIndex: -1,
    children: [i.jsxs("div", {
      className: "chapter-finish-top",
      children: [i.jsxs("button", {
        className: "text-button",
        onClick: r,
        children: [i.jsx(Gr, {
          size: 16
        }), " My book"]
      }), i.jsxs("span", {
        role: "status",
        children: [t === "saved" && i.jsx(Rt, {
          size: 14
        }), " ", t === "saved" ? "Chapter saved" : t === "error" ? "Save needs attention" : "Saving your chapter…"]
      })]
    }), i.jsxs("header", {
      className: "chapter-finish-heading",
      children: [i.jsx("span", {
        className: "eyebrow",
        children: "DEAR 2100 · MY CHAPTER SAVED"
      }), i.jsxs("h1", {
        children: ["Here’s what", i.jsx("br", {}), i.jsx("em", {
          children: "you have so far."
        })]
      }), i.jsx("p", {
        children: "You’ve given this a direction. Your next step is here when you’re ready."
      })]
    }), i.jsxs(La, {
      value: l,
      onValueChange: c,
      className: "chapter-tabs",
      children: [i.jsxs(za, {
        "aria-label": "Read my chapter",
        children: [i.jsx(Nn, {
          value: "overview",
          children: "At a glance"
        }), i.jsx(Nn, {
          value: "full",
          children: "Full chapter"
        })]
      }), i.jsxs(Rn, {
        value: "overview",
        children: [i.jsxs("article", {
          className: "finished-notebook",
          children: [i.jsxs("div", {
            className: "chapter-dateline",
            children: [i.jsx(fu, {
              size: 17
            }), i.jsx("time", {
              dateTime: e.createdAt,
              children: new Date(e.createdAt).toLocaleDateString(void 0, {
                day: "numeric",
                month: "long",
                year: "numeric"
              })
            })]
          }), i.jsx("small", {
            children: "I’VE ALWAYS WANTED TO"
          }), i.jsx("h2", {
            children: u.want
          }), i.jsx("div", {
            className: "chapter-values",
            children: d.map(p => i.jsx("span", {
              children: p
            }, p))
          }), i.jsxs("div", {
            className: "chapter-next-step",
            children: [i.jsx(ta, {
              size: 19
            }), i.jsxs("div", {
              children: [i.jsx("small", {
                children: "THE STEP I CHOSE"
              }), i.jsx("p", {
                children: u.action
              }), i.jsxs("span", {
                children: [e.scheduledLabel || u.day, " · ", u.time, " · ", u.minutes, " min"]
              })]
            })]
          }), i.jsxs("div", {
            className: "chapter-fear-response",
            children: [i.jsx("small", {
              children: u.barrierFocus === "practical" ? "IF THE OBSTACLE RETURNS" : "WHEN FEAR ARRIVES"
            }), i.jsx("p", {
              children: u.ifThen
            })]
          }), i.jsx("p", {
            className: "chapter-signature",
            children: "A beginning. Mine to build on."
          })]
        }), i.jsxs("button", {
          className: "chapter-read-all text-button",
          onClick: () => c("full"),
          children: ["Read my reflections and both futures ", i.jsx(Qe, {
            size: 15
          })]
        })]
      }), i.jsx(Rn, {
        value: "full",
        children: i.jsxs("article", {
          className: "chapter-full-text",
          children: [i.jsx("h2", {
            children: "Dear future me,"
          }), pN.map(p => {
            const f = p.fields.filter(([y]) => Array.isArray(u[y]) ? u[y].length : String(u[y] ?? "Not recorded").trim());
            return f.length ? i.jsxs("section", {
              children: [i.jsx("h3", {
                children: p.title
              }), i.jsx("dl", {
                children: f.map(([y, x]) => i.jsxs("div", {
                  children: [i.jsx("dt", {
                    children: x
                  }), i.jsx("dd", {
                    children: y === "day" ? e.scheduledLabel || u.day : Array.isArray(u[y]) ? u[y].join(", ") : String(u[y] ?? "Not recorded")
                  })]
                }, y))
              })]
            }, p.title) : null;
          }), i.jsx("p", {
            className: "chapter-signature",
            children: "My words. My way forward."
          })]
        })
      })]
    }), i.jsxs("div", {
      className: "chapter-finish-actions",
      children: [n && i.jsxs(i.Fragment, {
        children: [i.jsxs("button", {
          className: "primary-button",
          onClick: o,
          children: ["Revisit my plan ", i.jsx(Qe, {
            size: 17
          })]
        }), i.jsx("button", {
          className: "text-button",
          onClick: s,
          children: "I’ve tried it · add what happened"
        })]
      }), i.jsx("button", {
        className: "text-button",
        onClick: a,
        children: "Begin another chapter"
      })]
    }), i.jsxs("button", {
      type: "button",
      className: "chapter-return-home",
      onClick: () => window.dispatchEvent(new Event("dear2100-exit")),
      children: [i.jsx(Z1, {
        size: 17
      }), " Done — return to Mentication"]
    })]
  });
}
hi({
  book: os.optional(),
  version: ht().int().min(0)
});
const ms = {
    less: "Less difficult",
    same: "About as expected",
    more: "More difficult",
    unclear: "Still unclear"
  },
  gN = [{
    name: "Threat",
    title: "Threat detected",
    text: "A shape, a glance or a message catches your attention before you know what it means. Noticing is automatic; meaning is still open.",
    image: sN,
    scene: "A shape in the grass",
    moment: "FIRST SIGNAL",
    tag: "BEAR · FREEZE",
    reframe: "I noticed a signal. I do not have to treat my first impression as a fact.",
    detail: "The first signal is an incomplete snapshot. Orienting to a possibility is useful, but it is not the same as knowing what is there."
  }, {
    name: "Alarm",
    title: "Alarm before thought",
    text: "Your body may prepare for danger while you are still working out what happened. A racing heart is a response, not proof of a threat.",
    image: iN,
    scene: "The body prepares to move",
    moment: "BODY RESPONSE",
    tag: "BEAR · FLIGHT",
    reframe: "My body is preparing to protect me. I can give it a moment to settle.",
    detail: "Physical sensations can be persuasive. A quickened breath or heartbeat may be part of a protective response; context still matters."
  }, {
    name: "Check",
    title: "Reasoning arrives",
    text: "Now you can check the context: is there a clear danger, or an uncertain social meaning? Your first prediction can be examined.",
    image: aN,
    scene: "A social moment is harder to read",
    moment: "CONTEXT CHECK",
    tag: "MEETING · PAUSE",
    reframe: "What can I actually observe, beyond what I fear someone thinks?",
    detail: "A social cue can have several meanings. Check what was actually said or done before treating a prediction as the only explanation."
  }, {
    name: "Loop",
    title: "The story can take over",
    text: "The mind may fill uncertainty with a story and an urge to escape. If you are safe, noticing the loop gives you room to choose your next move.",
    image: lN,
    scene: "A story forms around uncertainty",
    moment: "THE STORY",
    tag: "MEETING · SPIRAL",
    reframe: "This is a story my mind is offering. I can check it before I follow it.",
    detail: "Avoiding can reduce discomfort for a moment while leaving uncertainty intact. When the situation is safe enough, a small test may offer more useful information."
  }],
  vN = [{
    label: "Cumulative development",
    title: "Knowledge began to compound",
    text: "Language, teaching, cooperation and tools allowed each generation to preserve and improve what came before."
  }, {
    label: "Survival advantage",
    title: "Threats became more manageable",
    text: "Better planning and collective action increased control over danger, food and other essential resources."
  }, {
    label: "Population growth",
    title: "Communities grew larger",
    text: "Permanent settlements expanded populations, relationships and more complex social organisation."
  }, {
    label: "Hierarchy and inequality",
    title: "Power accumulated unevenly",
    text: "Governance expanded while storable resources allowed wealth and influence to concentrate."
  }, {
    label: "Survival became social",
    title: "Rank carried greater consequences",
    text: "Safety and opportunity became increasingly affected by social position, reputation and other people’s perceptions."
  }, {
    label: "Threat-system mismatch",
    title: "Old protection met new danger",
    text: "A system built for immediate threats also began responding to social threats that were subtle, subjective and extended across time."
  }, {
    label: "Compensatory ego activation",
    title: "Protection turned inward",
    text: "Social hurt and uncertainty increased vigilance, prediction and the defence of identity, reputation and perceived worth."
  }, {
    label: "Modern comparison dependence",
    title: "Worth became something to maintain",
    text: "Approval can briefly reduce insecurity, while comparison renews the question of whether we are enough."
  }];
function yN(e) {
  const t = e.want.trim(),
    n = t ? `“${t.length > 100 ? `${t.slice(0, 97).trimEnd()}…` : t}”` : "this ambition",
    r = e.barrierFocus !== "fear";
  return {
    away: [{
      title: "Space for now",
      text: r ? `Leaving ${n} for now can protect time, energy or money you need elsewhere.` : `Setting ${n} aside may bring relief from the pressure of trying.`
    }, {
      title: "Keep the question open",
      text: r ? "Your constraints may change. A time to revisit this can keep a deliberate pause from becoming an automatic one." : "A pause can be useful. If waiting becomes automatic, you may still not know what a first attempt would show you."
    }, {
      title: "A choice to revisit",
      text: `${n} may still matter, or your priorities may change. You may feel at peace with waiting—or wish you had explored it.`
    }],
    towards: [{
      title: "Make a little room",
      text: r ? `Explore a version of ${n} that fits the resources you have. Finding support can be the first step.` : `A small step towards ${n} may bring both interest and discomfort. You can choose the pace.`
    }, {
      title: "Find out what fits",
      text: "You collect some real experience, including the effort it takes. You can adjust the scale, ask for help, or pause."
    }, {
      title: "Experience to draw on",
      text: `You have explored ${n} in some form. It may grow, change, or help you choose another direction.`
    }]
  };
}
const gs = {
    road: "towards",
    checkpoint: 0
  },
  fo = "dear2100-future-walk-v1";
function xN() {
  try {
    const e = JSON.parse(sessionStorage.getItem(fo) || "null");
    if (!e || typeof e != "object" || !("road" in e) || !("checkpoint" in e)) return null;
    const {
      road: t,
      checkpoint: n
    } = e;
    if ((t === "away" || t === "towards") && (n === 0 || n === 1 || n === 2)) return {
      road: t,
      checkpoint: n
    };
  } catch {}
  return null;
}
const vc = {
  away: [[164, 111], [108, 72], [54, 18]],
  towards: [[236, 111], [292, 72], [346, 18]]
};
function yc({
  children: e,
  tone: t = "paper"
}) {
  return i.jsx("div", {
    className: "note " + t,
    children: e
  });
}
function Ye({
  label: e,
  value: t,
  onChange: n,
  placeholder: r,
  small: o = !1,
  required: s = !1,
  suggestions: a,
  questionId: l
}) {
  const c = e.replace(/[^a-z]/gi, "").toLowerCase(),
    u = h.useRef(null);
  return h.useEffect(() => {
    const d = u.current;
    d && (d.style.height = "auto", d.style.height = `${Math.max(64, d.scrollHeight)}px`);
  }, [t]), i.jsxs("div", {
    className: `write-wrap guided-answer ${s ? "required-answer" : ""} ${s && !t.trim() ? "needs-answer" : ""} ${t.trim() ? "is-answered" : ""}`,
    children: [s && i.jsxs("div", {
      className: "answer-location",
      children: [i.jsx("span", {
        className: "answer-location-dot",
        "aria-hidden": "true"
      }), i.jsx("strong", {
        children: t.trim() ? "Your answer" : "Answer here"
      }), i.jsx("span", {
        children: t.trim() ? "You can still edit it" : "Type below or tap an idea"
      })]
    }), i.jsxs("label", {
      className: "field-label",
      htmlFor: c,
      children: [i.jsx("span", {
        children: e
      }), i.jsx("small", {
        children: s ? t.trim() ? i.jsxs(i.Fragment, {
          children: [i.jsx(Rt, {
            size: 12
          }), " Answered"]
        }) : "Needed to continue" : "Optional"
      })]
    }), i.jsx("textarea", {
      ref: u,
      id: c,
      value: t,
      maxLength: 2e3,
      rows: 2,
      required: s,
      "aria-labelledby": l,
      "aria-describedby": `${c}-suggestions`,
      onChange: d => n(d.target.value),
      className: "writing-field " + (o ? "compact" : ""),
      placeholder: r || "Write what comes to mind…"
    }), i.jsx("div", {
      id: `${c}-suggestions`,
      children: l === "screen-title" ? i.jsxs("details",{className:"answer-suggestion-disclosure",children:[i.jsx("summary",{children:"Need an idea?"}),i.jsx(Yx,{items:a ?? Wu[e] ?? ["I’m still figuring this out","I’d like to try one small step","I need more information first"],value:t,onChange:n})]}) : i.jsx(Yx,{items:a ?? Wu[e] ?? ["I’m still figuring this out","I’d like to try one small step","I need more information first"],value:t,onChange:n})
    })]
  });
}
function Yx({
  items: e,
  value: t,
  onChange: n
}) {
  const [r, o] = h.useState(!1);
  return i.jsxs("div", {
    className: "suggestion-browser answer-ideas",
    children: [i.jsxs("div", {
      className: "suggestion-heading",
      children: [i.jsx("span", {
        children: "Tap an idea · make it yours"
      }), e.length > 3 && i.jsx("button", {
        type: "button",
        className: "more-ideas",
        "aria-expanded": r,
        onClick: () => o(!r),
        children: r ? "Fewer" : "More ideas"
      })]
    }), i.jsx("div", {
      className: "suggestions",
      role: "group",
      "aria-label": "Suggested answers",
      children: (r ? e : e.slice(0, 3)).map(s => i.jsx("button", {
        type: "button",
        "aria-pressed": t === s,
        className: t === s ? "selected" : "",
        onClick: () => {
          n(s), ge.cue();
        },
        children: s
      }, s))
    })]
  });
}
function wN({
  items: e,
  selected: t,
  onChange: n,
  max: r = 10
}) {
  const o = h.useRef(null),
    [s, a] = h.useState({
      back: !1,
      forward: e.length > 2
    }),
    l = () => {
      const c = o.current;
      c && a({
        back: c.scrollLeft > 4,
        forward: c.scrollLeft + c.clientWidth < c.scrollWidth - 4
      });
    };
  return i.jsxs("div", {
    className: "multi-browser",
    children: [i.jsxs("div", {
      className: "suggestion-heading",
      children: [i.jsx("span", {
        children: "Suggested answers"
      }), i.jsxs("div", {
        children: [i.jsx("button", {
          type: "button",
          "aria-label": "Previous suggested answers",
          disabled: !s.back,
          onClick: () => {
            var c;
            return (c = o.current) == null ? void 0 : c.scrollBy({
              left: -260,
              behavior: reducedMotion() ? "instant" : "smooth"
            });
          },
          children: i.jsx(Gr, {
            size: 16
          })
        }), i.jsx("button", {
          type: "button",
          "aria-label": "More suggested answers",
          disabled: !s.forward,
          onClick: () => {
            var c;
            return (c = o.current) == null ? void 0 : c.scrollBy({
              left: 260,
              behavior: reducedMotion() ? "instant" : "smooth"
            });
          },
          children: i.jsx(li, {
            size: 16
          })
        })]
      })]
    }), i.jsx("div", {
      className: "choice-grid",
      ref: o,
      onScroll: l,
      children: e.map((c, u) => i.jsxs("label", {
        className: "choice " + (t.includes(c) ? "chosen" : ""),
        children: [i.jsx(QE, {
          "aria-label": c,
          checked: t.includes(c),
          disabled: !t.includes(c) && t.length >= r,
          onCheckedChange: d => {
            n(d ? [...t, c] : t.filter(p => p !== c)), ge.cue();
          }
        }), i.jsx("span", {
          children: c
        }), i.jsx("span", {
          className: "choice-number",
          children: String(u + 1).padStart(2, "0")
        })]
      }, c))
    })]
  });
}
function Kx({
  label: e,
  options: t,
  value: n,
  onChange: r
}) {
  return i.jsx(ZE, {
    className: "radio-options",
    "aria-label": e,
    value: n,
    onValueChange: o => {
      r(o), ge.cue();
    },
    children: t.map(o => i.jsxs("label", {
      className: "radio-option " + (n === o ? "chosen" : ""),
      children: [i.jsx(qE, {
        value: o
      }), i.jsx("span", {
        children: o
      })]
    }, o))
  });
}
function aa({label, value, onChange, max = 100, suffix = "%", ends = ["Unlikely", "Very likely"]}) {
  const id = h.useId();
  return i.jsxs("div", {className:"meter", children:[
    i.jsxs("div", {className:"meter-heading",children:[i.jsx("label",{htmlFor:id,children:label}),i.jsx("b",{children:ratingText(value,suffix)})]}),
    i.jsxs("select",{id,value:value == null ? "" : String(value),onChange:event=>onChange(event.target.value === "" ? null : Number(event.target.value)),children:[i.jsx("option",{value:"",children:"Skip / not recorded"}),...Array.from({length:max === 100 ? 21 : 11},(_,index)=>{const score=index*(max===100?5:1);return i.jsx("option",{value:score,children:`${score}${suffix}`},score);})]}),
    i.jsxs("div",{className:"meter-ends",children:[i.jsx("span",{children:ends[0]}),i.jsx("span",{children:ends[1]})]})
  ]});
}
function Zx({
  a: e,
  committed: t
}) {
  const [n, r] = h.useState(0),
    o = [{
      icon: rb,
      label: "I WANT",
      value: e.want || "A direction I can choose",
      insight: "This is the direction, not a standard you have to meet.",
      tone: ""
    }, {
      icon: G1,
      label: "MY MIND PREDICTS",
      value: e.prediction || "An outcome I have not named yet",
      insight: "A prediction can feel certain before it has been tested.",
      tone: "red"
    }, {
      icon: lv,
      label: "SO I PROTECT MYSELF BY",
      value: e.behavior || "Choosing a familiar response",
      insight: "The response can ease the moment while leaving the prediction open.",
      tone: ""
    }, {
      icon: tt,
      label: t ? "MY NEXT EXPERIMENT" : "THE CHOICE POINT",
      value: t ? e.action : "A small action can give me new information.",
      insight: "A manageable step can test what happens without requiring certainty first.",
      tone: "green"
    }];
  return i.jsx("div", {
    className: "pattern-map",
    role: "group",
    "aria-label": "Explore your four-part pattern",
    style: {
      "--pattern-progress": n / 3
    },
    children: o.map(({
      icon: s,
      label: a,
      value: l,
      insight: c,
      tone: u
    }, d) => i.jsxs("button", {
      type: "button",
      className: `pattern-item ${n === d ? "is-active" : ""}`,
      "aria-pressed": n === d,
      onClick: () => {
        r(d), ge.cue();
      },
      children: [i.jsx("span", {
        className: `pattern-node ${u}`,
        children: i.jsx(s, {
          size: 17
        })
      }), i.jsxs("span", {
        className: "pattern-copy",
        children: [i.jsx("small", {
          children: a
        }), i.jsx("strong", {
          children: l
        }), n === d && i.jsx("em", {
          children: c
        }, d)]
      }), i.jsx(li, {
        className: "pattern-chevron",
        size: 16,
        "aria-hidden": "true"
      })]
    }, a))
  });
}
function xc({
  label: e,
  value: t,
  options: n,
  onChange: r
}) {
  return i.jsxs("div", {
    className: "schedule-choice",
    children: [i.jsx("span", {
      children: e
    }), i.jsxs(e2, {
      value: t,
      onValueChange: r,
      children: [i.jsx(n2, {
        "aria-label": e,
        children: i.jsx(t2, {placeholder:"Choose…"})
      }), i.jsx(r2, {
        className: "schedule-menu",
        children: n.map(o => i.jsx(o2, {
          value: o,
          children: o
        }, o))
      })]
    })]
  });
}
function bN({onNext}) {
  const quiet = useQuietMotion();
  const [e, t] = h.useState(30),
    [n, r] = h.useState(0),
    [o, s] = h.useState(!1),
    a = h.useRef(0),
    l = h.useRef(0),
    c = h.useCallback(k => {
      if (ge.wave(k), typeof navigator > "u" || !("vibrate" in navigator)) return;
      const m = k === "crest" ? [8, 46, 12] : k === "return" ? [7, 30, 7] : k === "complete" ? [8, 35, 8, 35, 14] : 7;
      navigator.vibrate(m);
    }, []),
    u = Math.min(n / (e * 1e3), 1),
    d = (k, m, g, v, b) => (1 - b) ** 3 * k + 3 * (1 - b) ** 2 * b * m + 3 * (1 - b) * b ** 2 * g + b ** 3 * v,
    p = u <= .305 ? {
      x: d(0, 68, 102, 171, u / .305),
      y: d(174, 164, 184, 153, u / .305)
    } : u <= .641 ? {
      x: d(171, 244, 291, 359, (u - .305) / .336),
      y: d(153, 120, 35, 92, (u - .305) / .336)
    } : {
      x: d(359, 427, 486, 560, (u - .641) / .359),
      y: d(92, 149, 103, 110, (u - .641) / .359)
    },
    f = n >= e * 1e3,
    y = u < .22 ? {
      number: "01",
      label: "Notice the rise",
      copy: "Name the urge. You do not have to act on it."
    } : u < .72 ? {
      number: "02",
      label: "Ride the crest",
      copy: "Stay curious as it shifts. Let it be here without following it."
    } : {
      number: "03",
      label: f ? "Practice complete" : "Come back to choice",
      copy: f ? "The timer has ended. This does not tell us whether your urge changed. Notice how you feel and choose what helps next." : "Turn toward the smallest part of your chosen step."
    };
  h.useEffect(() => {
    if (!o || f) return;
    const k = performance.now() - a.current;
    let m = 0;
    const g = v => {
      const b = Math.min(v - k, e * 1e3);
      a.current = b, r(b);
      const S = b / (e * 1e3),
        j = S >= 1 ? 3 : S >= .72 ? 2 : S >= .22 ? 1 : 0;
      j > l.current && (l.current = j, c(j === 1 ? "crest" : j === 2 ? "return" : "complete")), b < e * 1e3 ? m = quiet ? setTimeout(()=>g(performance.now()),1000) : requestAnimationFrame(g) : s(!1);
    };
    return m = quiet ? setTimeout(()=>g(performance.now()),1000) : requestAnimationFrame(g), () => quiet ? clearTimeout(m) : cancelAnimationFrame(m);
  }, [o, f, e, c, quiet]), h.useEffect(() => {
    const k = () => {
      document.hidden && (s(!1), ge.stopWave());
    };
    return document.addEventListener("visibilitychange", k), () => {
      document.removeEventListener("visibilitychange", k), ge.stopWave();
    };
  }, []);
  const x = () => {
      f && (a.current = 0, r(0)), o ? (ge.stopWave(), typeof navigator < "u" && "vibrate" in navigator && navigator.vibrate(0)) : (l.current = f ? 0 : u >= .72 ? 2 : u >= .22 ? 1 : 0, c("start")), s(k => !k);
    },
    w = k => {
      t(k), a.current = 0, r(0), l.current = 0, s(!1), ge.stopWave(), ge.cue();
    };
  return i.jsxs("section", {
    className: "urge-surf-plan",
    "aria-labelledby": "urge-surf-title",
    children: [i.jsxs("div", {
      className: "urge-surf-heading",
      children: [i.jsxs("span", {
        className: "urge-surf-kicker",
        children: [i.jsx("span", {
          "aria-hidden": "true",
          children: "≈"
        }), " WHEN FEAR ARRIVES"]
      }), i.jsx("h2", {
        id: "urge-surf-title",
        children: "Keep your direction."
      }), i.jsx("p", {
        children: "Urges may shift, stay strong or return. This optional practice makes space to notice and choose; it does not measure whether fear has passed."
      })]
    }), i.jsxs("div", {
      className: `urge-wave-stage ${o ? "is-riding" : ""} ${f ? "is-complete" : ""}`,
      children: [i.jsx("div", {
        className: "urge-wave-canvas",
        children: i.jsxs("svg", {
          viewBox: "0 0 560 220",
          preserveAspectRatio: "none",
          "aria-hidden": "true",
          children: [i.jsxs("defs", {
            children: [i.jsxs("linearGradient", {
              id: "urge-wave-fill",
              x1: "0",
              y1: "0",
              x2: "1",
              y2: "1",
              children: [i.jsx("stop", {
                offset: "0",
                stopColor: "#edaaa0"
              }), i.jsx("stop", {
                offset: ".48",
                stopColor: "#8eb8dc"
              }), i.jsx("stop", {
                offset: "1",
                stopColor: "#244f7b"
              })]
            }), i.jsxs("linearGradient", {
              id: "urge-wave-line",
              x1: "0",
              y1: "0",
              x2: "1",
              y2: "0",
              children: [i.jsx("stop", {
                offset: "0",
                stopColor: "#d95f5b"
              }), i.jsx("stop", {
                offset: ".52",
                stopColor: "#e9d5b6"
              }), i.jsx("stop", {
                offset: "1",
                stopColor: "#83bfe5"
              })]
            }), i.jsxs("filter", {
              id: "urge-wave-glow",
              x: "-20%",
              y: "-60%",
              width: "140%",
              height: "220%",
              children: [i.jsx("feGaussianBlur", {
                stdDeviation: "4",
                result: "blur"
              }), i.jsxs("feMerge", {
                children: [i.jsx("feMergeNode", {
                  in: "blur"
                }), i.jsx("feMergeNode", {
                  in: "SourceGraphic"
                })]
              })]
            })]
          }), i.jsx("path", {
            className: "urge-wave-back",
            d: "M0,164 C74,149 111,170 180,146 C245,123 283,85 348,112 C425,144 479,97 560,78 L560,220 L0,220Z"
          }), i.jsx("path", {
            className: "urge-wave-fill",
            d: "M0,174 C68,164 102,184 171,153 C244,120 291,35 359,92 C427,149 486,103 560,110 L560,220 L0,220Z"
          }), i.jsx("path", {
            className: "urge-wave-line",
            d: "M0,174 C68,164 102,184 171,153 C244,120 291,35 359,92 C427,149 486,103 560,110",
            filter: "url(#urge-wave-glow)"
          }), i.jsxs("g", {
            className: "wave-rider-svg",
            transform: quiet ? "translate(0 174)" : `translate(${p.x} ${p.y})`,
            children: [i.jsx("circle", {
              r: "13",
              fill: "#c4525550"
            }), i.jsx("circle", {
              r: "7",
              fill: "#bd414b",
              stroke: "#fff6ea",
              strokeWidth: "2"
            }), i.jsx("circle", {
              r: "2",
              fill: "#ffe1cc"
            })]
          })]
        })
      }), i.jsxs("div", {
        className: "urge-wave-status",
        children: [i.jsxs("span", {
          "aria-hidden": "true",
          children: [y.number, " · ", Math.round(u * 100), "%"]
        }), i.jsx("strong", {
          children: y.label
        }), i.jsx("p", {
          children: y.copy
        })]
      }), i.jsx("span", {
        className: "sr-only",
        role: "status",
        children: y.label
      }), i.jsxs("div", {
        className: "urge-wave-controls",
        "aria-label": "Choose a wave duration",
        children: [i.jsx("div", {
          role: "group",
          "aria-label": "Wave duration",
          children: [30, 60].map(k => i.jsxs("button", {
            type: "button",
            "aria-pressed": e === k,
            onClick: () => w(k),
            children: [k, "s"]
          }, k))
        }), i.jsxs("button", {
          type: "button",
          className: "urge-wave-play",
          onClick: x,
          children: [o ? i.jsx(bs, {
            size: 16
          }) : i.jsx(av, {
            size: 16
          }), o ? "Pause wave" : f ? "Ride again" : n ? "Keep riding" : "Ride the wave"]
        })]
      })]
    }), i.jsx("p", {
      className: "wave-choice-note",
      children: "Stay for as long as feels useful. You can pause or move on at any time."
    }),i.jsx("button",{className:f?"primary-button":"text-button",onClick:onNext,children:f?"Continue to my plan":"Move on to my plan"})]
  });
}
function kN({
  step: e,
  book: t,
  answer: n,
  onLearn: r,
  futureWalk: o,
  onFutureWalkChange: s,
  focusRequest: a, onResumeChange, onThreatCheck, onDone
}) {
  const l = t.answers,
    c = yN(l),
    u = jr(l),
    {
      road: d,
      checkpoint: p
    } = o,
    [f, y] = h.useState(!1),
    x = t.resume.planTab, w = value => onResumeChange({planTab:value}),
    k = h.useRef(0);
  h.useEffect(() => {
    if (!a || k.current === a) return;
    k.current = a, w(e === 8 && l.action.trim() ? "second" : "first");
    const m = requestAnimationFrame(() => requestAnimationFrame(() => {
      const g = document.querySelector(".needs-answer textarea, .flow-value-grid button:not([aria-pressed='true'])");
      g == null || g.focus(), g == null || g.scrollIntoView({
        block: "nearest"
      });
    }));
    return () => cancelAnimationFrame(m);
  }, [a, e, l.action]);
  const text=(key,title,required=false,suggestions)=>({id:key,title,valid:!required||!!l[key]?.trim(),field:i.jsx(Ye,{label:title,value:l[key]||"",required,small:true,questionId:"screen-title",onChange:value=>n(key,value),suggestions})});
  const choice=(key,title,options)=>({id:key,title,valid:!!l[key],field:i.jsx(Kx,{label:title,options,value:l[key],onChange:value=>n(key,value)})});
  let questions,core;
  if(e===2){questions=[{id:"kind",title:"What’s getting in the way?",hint:"Choose the kind of barrier you want to work with.",field:i.jsx(Kx,{label:"Kind of barrier",options:["Fear or doubt","Practical limits","Both"],value:{fear:"Fear or doubt",practical:"Practical limits",both:"Both"}[l.barrierFocus],onChange:value=>n("barrierFocus",{"Fear or doubt":"fear","Practical limits":"practical",Both:"both"}[value])})},...(l.barrierFocus!=="practical"?[text("prediction","If you try, what are you afraid might happen?",true,Wu["If I try, I’m afraid…"])]:[]),...(l.barrierFocus!=="fear"?[text("practicalNote","What practical thing is in the way?",true,Wu["A practical barrier or other detail"])]:[])];core=questions.length;}
  if(e===2){questions.push({id:"other-barriers",title:"Any other barriers you want to note?",field:i.jsx(wN,{items:W2,selected:l.barriers,onChange:value=>n("barriers",value)})});if(l.barrierFocus==="fear")questions.push(text("practicalNote","Any practical detail you want to keep?"));}
  if(e===4){questions=[l.barrierFocus==="practical"?text("practicalSupport","What would help you start?",true,Wu["A resource, adjustment or support I need"]):text("behavior","When fear shows up, what do you usually do?",true,V2),...(l.barrierFocus==="both"?[text("practicalSupport","What practical support would help?")]:[]),text("cost","What might postponing cost you later?")];core=1;}
  if(e===6){questions=[{id:"values",title:"Which qualities do you want to carry forward?",hint:"Choose three to five. These are options for one question.",valid:u.length>=3&&u.length<=5,field:i.jsxs(i.Fragment,{children:[i.jsx(eN,{answers:l,onChange:value=>n("values",value)}),i.jsx("label",{htmlFor:"custom-value",children:"Or include your own value"}),i.jsx("input",{id:"custom-value",value:l.customValue,maxLength:60,disabled:!l.customValue.trim()&&u.length>=5,onChange:event=>{if(jr({...l,customValue:event.target.value}).length<=5)n("customValue",event.target.value);}})]})},text("valueAction","How could you act on a value?",false,U2[l.values[0]]),text("judgment","What standard do you want to use?")];core=1;}
  if(e===8){questions=[text("action","What’s your next small step?",true,H2(l)),choice("day","When would you like to try it?",["Today","Tomorrow","This week","Decide later"]),choice("time","What part of the day suits you?",["Morning","Afternoon","Evening","Decide later"]),{id:"minutes",title:"How long could you give it?",valid:!!l.minutes,field:i.jsx(Kx,{label:"Duration",options:["5 min","15 min","30 min"],value:l.minutes?`${l.minutes} min`:"",onChange:value=>n("minutes",value.split(" ")[0])})},text("ifThen",l.barrierFocus==="practical"?"If the obstacle returns, what will you do?":"When fear returns, what will you do?",true,Wu[l.barrierFocus==="practical"?"If the usual obstacle shows up, then I will…":"When fear arises, I will…"]),choice("budget","What resources could you use?",["none","small","flexible"]),...[["likelihood","How likely does your prediction feel?",100],["discomfort","How much discomfort do you expect?",10],["goalState","How able do you feel to take this step?",10]].map(([key,title,max])=>({id:key,title,field:i.jsx(aa,{label:title,value:l[key],max,suffix:max===10?" / 10":"%",onChange:value=>n(key,value)})})),text("evidenceLookFor","What will you actually look for?")];core=5;}
  if(e===5&&t.resume.question!=="5:roads")return i.jsx(SequentialQuestions,{id:"5",current:t.resume.question,onCurrent:question=>onResumeChange({question}),steps:[{id:"horizon",title:"How far ahead would you like to look?",hint:"Explore possibilities, not predictions.",field:i.jsx(Kx,{label:"Future horizon",options:["One year","Twenty years"],value:l.horizon==="near"?"One year":"Twenty years",onChange:value=>n("horizon",value==="One year"?"near":"long")})}],onDone:()=>onResumeChange({question:"5:roads"}),doneLabel:"Explore the two roads"});
  if(e===4&&l.barrierFocus!=="practical"&&l.behavior)questions[0].field=i.jsxs(i.Fragment,{children:[questions[0].field,i.jsxs("details",{className:"foldout",children:[i.jsx("summary",{children:"See the pattern you named"}),i.jsx(Zx,{a:l,committed:t.committed})]})]});
  if(questions)return i.jsx(SequentialQuestions,{id:String(e),steps:questions,optionalStart:core,current:t.resume.question,onCurrent:question=>onResumeChange({question}),onDone,doneLabel:e===2?"Next: Understand the alarm":"Continue"});
  return i.jsxs("section", {
    className: `question-page enter flow-stage flow-stage-${e}`,
    "aria-labelledby": "screen-title",
    children: [e === 5 && i.jsxs(i.Fragment, {
      children: [i.jsx("button",{className:"text-button",onClick:()=>onResumeChange({question:"5:horizon"}),children:"Change future horizon"}),i.jsxs("h1", {
        id: "screen-title",
        children: [l.horizon === "near" ? "One year. " : "Twenty years. ", i.jsx("em", {
          children: "Two futures."
        })]
      }), i.jsx("p", {
        className: "lede",
        children: "Walk each road. What kind of life could it lead to?"
      }), i.jsxs(La, {
        value: x,
        onValueChange: w,
        className: "stage-tabs futures-tabs",
        children: [i.jsxs(za, {
          "aria-label": "Explore my two futures",
          children: [i.jsx(Nn, {
            value: "first",
            children: "Walk the roads"
          }), i.jsx(Nn, {
            value: "second",
            children: l.horizon === "near" ? "My one-year view" : "My twenty-year view"
          })]
        }), i.jsx(Rn, {
          value: "first",
          children: i.jsxs("div", {
            className: "flow-section flow-futures-section",
            children: [i.jsx("p", {
              className: "flow-section-copy",
              children: "Two possibilities, with trade-offs. Neither is a prediction."
            }), i.jsxs("div", {
              className: `choice-walk choice-walk-${d}`,
              role: "group",
              "aria-label": "Walk the two possible futures",
              children: [l.want.trim() && i.jsxs("div", {
                className: "choice-walk-ambition",
                children: [i.jsx("small", {
                  children: "THE DIRECTION I NAMED"
                }), i.jsx("p", {
                  children: l.want
                })]
              }), i.jsxs("div", {
                className: "choice-walk-labels",
                "aria-hidden": "true",
                children: [i.jsx("span", {
                  children: "LEAVE IT FOR NOW"
                }), i.jsx("span", {
                  children: "MAKE ROOM TO TRY"
                })]
              }), i.jsxs("div", {
                className: "choice-walk-map",
                "aria-label": `${d === "towards" ? "Make room to try" : "Leave it for now"}, checkpoint ${p + 1} of 3`,
                children: [i.jsxs("div", {
                  className: "choice-walk-track",
                  role: "group",
                  "aria-label": "Choose a checkpoint on either road",
                  children: [i.jsxs("svg", {
                    viewBox: "0 0 400 152",
                    "aria-hidden": "true",
                    children: [i.jsx("path", {
                      className: "away-path",
                      d: "M200 145 C186 103 112 112 54 18"
                    }), i.jsx("path", {
                      className: "towards-path",
                      d: "M200 145 C214 103 288 112 346 18"
                    }), i.jsx("circle", {
                      className: "choice-origin",
                      cx: "200",
                      cy: "145",
                      r: "7"
                    })]
                  }), ["away", "towards"].flatMap(m => [0, 1, 2].map(g => {
                    const [v, b] = vc[m][g];
                    return i.jsxs("button", {
                      type: "button",
                      className: `choice-walk-node ${m} ${d === m && p >= g ? "reached" : ""} ${d === m && p === g ? "current" : ""} ${g === 2 ? "endpoint" : ""}`,
                      style: {
                        "--node-x": `${v / 4}%`,
                        "--node-y": `${b / 1.52}%`
                      },
                      "aria-label": `${m === "away" ? "Leave it for now" : "Make room to try"}, ${g === 2 ? (l.horizon === "near" ? "one-year view" : "twenty-year view") : `checkpoint ${g + 1}`}: ${c[m][g].title}`,
                      "aria-pressed": d === m && p === g,
                      onClick: () => {
                        s({
                          road: m,
                          checkpoint: g
                        }), ge.cue();
                      },
                      children: [i.jsx("span", {
                        className: "choice-walk-node-dot"
                      }), g === 2 && i.jsx("span", {
                        className: "choice-walk-horizon",
                        "aria-hidden": "true",
                        children: l.horizon === "near" ? "1 YEAR" : "20 YEARS"
                      })]
                    }, `${m}-${g}`);
                  })), i.jsx("span", {
                    className: `choice-walk-traveller ${d}`,
                    style: {
                      left: `${vc[d][p][0] / 4}%`,
                      top: `${vc[d][p][1] / 1.52}%`
                    },
                    "aria-hidden": "true",
                    children: i.jsx(Uh, {
                      size: 13,
                      strokeWidth: 2.3
                    })
                  })]
                }), i.jsx("div", {
                  className: `choice-walk-insight ${f ? "is-comparing" : ""}`,
                  id: "future-checkpoint-panel",
                  "aria-live": "polite",
                  children: f ? i.jsxs(i.Fragment, {
                    children: [i.jsxs("small", {
                      children: [p === 2 ? "TWENTY YEARS FROM NOW" : `CHECKPOINT 0${p + 1}`, " · BOTH ROADS"]
                    }), i.jsxs("div", {
                      className: "choice-walk-comparison",
                      children: [i.jsxs("div", {
                        className: "away",
                        children: [i.jsx("span", {
                          children: "LEAVE IT FOR NOW"
                        }), i.jsx("strong", {
                          children: c.away[p].title
                        }), i.jsx("p", {
                          children: c.away[p].text
                        })]
                      }), i.jsxs("div", {
                        className: "towards",
                        children: [i.jsx("span", {
                          children: "MAKE ROOM TO TRY"
                        }), i.jsx("strong", {
                          children: c.towards[p].title
                        }), i.jsx("p", {
                          children: c.towards[p].text
                        })]
                      })]
                    })]
                  }) : i.jsxs(i.Fragment, {
                    children: [i.jsxs("small", {
                      children: [d === "away" ? "LEAVE IT FOR NOW" : "MAKE ROOM TO TRY", " · ", p === 2 ? "TWENTY YEARS FROM NOW" : `CHECKPOINT 0${p + 1}`]
                    }), i.jsx("strong", {
                      children: c[d][p].title
                    }), i.jsx("p", {
                      children: c[d][p].text
                    })]
                  })
                }, `${d}-${p}-${f}`)]
              }), i.jsxs("div", {
                className: "choice-walk-controls",
                children: [i.jsx("button", {
                  type: "button",
                  className: d === "away" ? "selected away" : "away",
                  "aria-pressed": d === "away",
                  onClick: () => {
                    s({
                      road: "away",
                      checkpoint: p
                    }), ge.cue();
                  },
                  children: "Away path"
                }), i.jsxs("button", {
                  type: "button",
                  className: "walk-button",
                  "aria-label": p === 2 ? `Replay the ${d === "away" ? "away" : "towards"} path from its first checkpoint` : `Walk to the next checkpoint on the ${d === "away" ? "away" : "towards"} path`,
                  onClick: () => {
                    s({
                      road: d,
                      checkpoint: p === 2 ? 0 : p + 1
                    }), ge.cue("next");
                  },
                  children: [i.jsx(Uh, {
                    size: 17
                  }), " ", p === 2 ? "Replay" : "Walk"]
                }), i.jsx("button", {
                  type: "button",
                  className: d === "towards" ? "selected towards" : "towards",
                  "aria-pressed": d === "towards",
                  onClick: () => {
                    s({
                      road: "towards",
                      checkpoint: p
                    }), ge.cue();
                  },
                  children: "Towards path"
                })]
              }), i.jsxs("button", {
                type: "button",
                className: "choice-walk-compare-toggle",
                "aria-expanded": f,
                "aria-controls": "future-checkpoint-panel",
                onClick: () => {
                  y(m => !m), ge.cue();
                },
                children: [i.jsx(K1, {
                  size: 14,
                  "aria-hidden": "true"
                }), f ? "Show one road" : "Compare both at this checkpoint"]
              })]
            }), i.jsxs("button", {
              type: "button",
              className: "text-button stage-local-next",
              onClick: () => w("second"),
              children: ["Put my futures into words ", i.jsx(Qe, {
                size: 16
              })]
            })]
          })
        }), i.jsx(Rn, {
          value: "second",
          children: i.jsxs("div", {
            className: "flow-section",
            children: [i.jsxs("div", {
              className: "future-answer-toggle",
              role: "group",
              "aria-label": "Choose the future to describe",
              children: [i.jsx("button", {
                "aria-pressed": d === "away",
                onClick: () => s({
                  road: "away",
                  checkpoint: 2
                }),
                children: "If I keep postponing"
              }), i.jsx("button", {
                "aria-pressed": d === "towards",
                onClick: () => s({
                  road: "towards",
                  checkpoint: 2
                }),
                children: "If I make room to try"
              })]
            }), i.jsxs("div", {
              className: "future-personal-answer",
              children: [d === "away" ? i.jsx(Ye, {
                small: !0,
                label: "What might I miss if I keep postponing?",
                value: l.avoidFuture,
                onChange: m => n("avoidFuture", m),
                placeholder: l.horizon === "near" ? "In one year, I might…" : "In twenty years, I might…"
              }) : i.jsx(Ye, {
                small: !0,
                label: "What might become possible if I try?",
                value: l.actFuture,
                onChange: m => n("actFuture", m),
                placeholder: l.horizon === "near" ? "In one year, I might…" : "In twenty years, I might…"
              }), i.jsxs("button", {
                type: "button",
                className: "text-button",
                onClick: () => s({
                  road: d === "away" ? "towards" : "away",
                  checkpoint: 2
                }),
                children: ["Reflect on the other road ", i.jsx(Qe, {
                  size: 14
                })]
              }), (l.avoidFuture || l.actFuture) && i.jsx("button", {
                type: "button",
                className: "text-button",
                "aria-expanded": f,
                onClick: () => y(!f),
                children: f ? "Hide comparison" : "Read my two futures together"
              }), f && (l.avoidFuture || l.actFuture) && i.jsxs("div", {
                className: "personal-futures-comparison",
                children: [i.jsxs("div", {
                  children: [i.jsx("small", {
                    children: "IF I KEEP POSTPONING"
                  }), i.jsx("p", {
                    children: l.avoidFuture || "Not written yet"
                  })]
                }), i.jsxs("div", {
                  children: [i.jsx("small", {
                    children: "IF I MAKE ROOM TO TRY"
                  }), i.jsx("p", {
                    children: l.actFuture || "Not written yet"
                  })]
                })]
              })]
            }, d), l.avoidFuture && l.actFuture && i.jsx("p", {
              className: "flow-contrast-line",
              children: "Which road feels closer to the life you want?"
            })]
          })
        })]
      })]
    }), e === 3 && i.jsx(i.Fragment, {
      children: i.jsx(rN, {
        phases: gN,
        phase:t.resume.threat, onPhase:threat=>onResumeChange({threat}),
        check:t.threatCheck, onCheck:onThreatCheck,current:t.resume.question,onCurrent:question=>onResumeChange({question}),onDone,
        onLearn: r
      })
    }), e === 7 && l.barrierFocus !== "practical" && i.jsxs(i.Fragment, {
      children: [i.jsxs("h1", {
        id: "screen-title",
        children: ["Ride ", i.jsx("em", {
          children: "the wave."
        })]
      }), i.jsx("p", {
        className: "lede",
        children: "Practise staying with an urge without following it."
      }), i.jsx(bN, {onNext:onDone}), i.jsxs("details", {
        className: "foldout flow-support-detail",
        children: [i.jsxs("summary", {
          children: ["More ways to support myself ", i.jsx(Ke, {
            size: 18
          })]
        }), i.jsxs("div", {
          className: "coping-strip",
          children: [i.jsxs("div", {
            children: [i.jsx("b", {
              children: "01"
            }), i.jsx("span", {
              children: "Notice"
            }), i.jsx("p", {
              children: "“I’m having the prediction that…”"
            })]
          }), i.jsxs("div", {
            children: [i.jsx("b", {
              children: "02"
            }), i.jsx("span", {
              children: "Check"
            }), i.jsx("p", {
              children: "What can I actually observe?"
            })]
          }), i.jsxs("div", {
            children: [i.jsx("b", {
              children: "03"
            }), i.jsx("span", {
              children: "Choose"
            }), i.jsx("p", {
              children: "A safe move towards what matters."
            })]
          })]
        })]
      })]
    }), e === 7 && l.barrierFocus === "practical" && i.jsxs(i.Fragment,{children:[i.jsx("h1",{id:"screen-title",children:"Make room for support."}),i.jsx("p",{className:"lede",children:"A practical limit needs a practical response. Check the time, energy, cost or access your step needs. You can choose a smaller step, ask for support or pause."}),i.jsx("p",{children:l.practicalSupport || l.practicalNote})]})]
  });
}
function SN() {
  var Nf;
  const [e, t] = h.useState(Co),
    [n, r] = h.useState("cover"),
    [o, s] = h.useState("start"),
    [a, l] = h.useState(null),
    [c, u] = h.useState(!1),
    [d, p] = h.useState(!1),
    [f, y] = h.useState(null),
    [x, w] = h.useState(!1),
    [k, m] = h.useState(0),
    [g, v] = h.useState(null),
    [b, S] = h.useState(null),
    [j, C] = h.useState("loading"),
    [_, R] = h.useState(""),
    [I, B] = h.useState(!1),
    [z, Y] = h.useState(!1),
    [Z, ne] = h.useState(30),
    [V, F] = h.useState(!1),
    [N, M] = h.useState(!1),
    [T, ae] = h.useState(0),
    [Q, ie] = h.useState(!1),
    [de, pe] = h.useState(0),
    [re, setReflection] = h.useState({
      result: "unclear",
      observed: "",
      learned: "",
      next: "",
      actualDiscomfort: null,
      afterLikelihood: null,
      goalStateAfter: null
    }),
    [ee, J] = h.useState(gs),
    [Pe, xe] = h.useState(!1),
    P = h.useRef(0),
    $ = h.useRef(e),
    me = h.useRef(""),
    Le = h.useRef(!1),
    vt = h.useRef(!1),
    ut = h.useRef(null),
    sn = h.useRef(!1),
    D = e.answers,
    ue = e.step,
    an = Bp(D),
    Gt = jr(D),
    pi = e.chapters.find(E => E.id === (f || e.activeChapterId));
  h.useEffect(() => {
    if (I && (requiredThreatView(e,n) !== n || n === "journey" && e.step > 3 && !threatCheckPassed(e))) {
      t(book=>({...book,step:3})); r("journey");
    }
  }, [I,e,n]);
  h.useEffect(()=>{const pop=event=>{if(dearEmbeddedHistory)return;const question=event.state?.dearQuestion;if(!question)return;const stage=Number(question.id);if(Number.isInteger(stage)&&stage>=1&&stage<=8){t(book=>({...book,step:requiredThreatStep(book,stage),resume:{...book.resume,question:question.current}}));r("journey");l(null);}};window.addEventListener("popstate",pop);return()=>window.removeEventListener("popstate",pop);},[]);
  h.useEffect(()=>{
    const restore=event=>{
      if(event.origin!==location.origin||event.source!==window.parent||event.data?.type!=="mentication:restore-screen"||event.data?.journeyId!=="dear2100")return;
      const screen=event.data.screen,stage=screen?.cursors?.stage;if(!screen||!Number.isInteger(stage)||stage<1||stage>9||typeof screen.id!=="string")return;
      const known=/^stage-[1-9]$/.test(screen.id)||["2:kind","2:prediction","2:practicalNote","2:other-barriers","4:practicalSupport","4:behavior","4:cost","5:horizon","5:roads","6:values","6:valueAction","6:judgment","8:action","8:day","8:time","8:minutes","8:ifThen","8:budget","8:likelihood","8:discomfort","8:goalState","8:evidenceLookFor","threat:0","threat:1","threat:2","threat:3","threat:score","outcome:observed","outcome:result","outcome:actualDiscomfort","outcome:afterLikelihood","outcome:goalStateAfter","outcome:learned","outcome:next"].includes(screen.id);
      if(!known)return;
      dearHistoryRestoring=dearHistoryCursor!==JSON.stringify({id:screen.id,cursors:{stage}});dearHistoryDepth=Number.isSafeInteger(screen.depth)&&screen.depth>=0?screen.depth:0;
      const target=requiredThreatStep($.current,stage),question=screen.id.startsWith("stage-")?target===3?"threat-teaching":"":screen.id;
      t(book=>({...book,step:target,resume:{...book.resume,question}}));
      if(screen.id.startsWith("outcome:")&&$.current.reflectionDraft&&target===9){setReflection($.current.reflectionDraft);r("plan");l("outcome");}else{l(null);r(target===9?"plan":"journey");}
    };
    window.addEventListener("message",restore);return()=>window.removeEventListener("message",restore);
  },[]);
  h.useEffect(()=>{
    if(!dearEmbeddedHistory||!I)return;
    if(a==="outcome"||n==="journey"&&document.querySelector(".sequential-question"))return;
    if(n==="journey")rememberDearScreen(e.step===5&&e.resume.question==="5:roads"?"5:roads":`stage-${e.step}`,e.step);
    else if(n==="plan"||n==="closing")rememberDearScreen("stage-9",9);
  },[I,n,a,e.step,e.resume.question]);
  const Ne = update => {
    const next = typeof update === "function" ? update(re) : update;
    setReflection(next);
    t(book => ({...book, reflectionDraft: next.chapterId ? next : null}));
  };
  h.useEffect(() => {
    if (!I) return;
    t(book => {
      const resume = {...book.resume,view:n,section:o,road:ee.road,checkpoint:ee.checkpoint};
      return JSON.stringify(resume) === JSON.stringify(book.resume) ? book : {...book,resume};
    });
  }, [n,o,ee,I]);
  h.useEffect(() => {
    $.current = e;
  }, [e]), h.useEffect(() => {
    const E = window.visualViewport,
      A = () => {
        const X = E ? Math.max(0, window.innerHeight - E.height - E.offsetTop) : 0;
        document.documentElement.style.setProperty("--keyboard-inset", `${X > 120 ? X : 0}px`);
      };
    return E == null || E.addEventListener("resize", A), E == null || E.addEventListener("scroll", A), () => {
      E == null || E.removeEventListener("resize", A), E == null || E.removeEventListener("scroll", A), document.documentElement.style.removeProperty("--keyboard-inset");
    };
  }, []), h.useEffect(() => {
    const E = requestAnimationFrame(() => {
      var A;
      n === "closing" && ((A = document.querySelector(".chapter-finish")) == null || A.focus({
        preventScroll: !0
      }));
    });
    return () => cancelAnimationFrame(E);
  }, [n]);
  const jl = h.useCallback(async () => {
    C("loading");
    try {
      const E = await dN(),
        A = parseBook(E.book);
      if (A.furthestStep = Math.max(A.furthestStep, A.step), !A.answers.want.trim()) {
        J(gs);
        try {
          sessionStorage.removeItem(fo);
        } catch {}
      }
      if (requiredThreatView(A,A.resume.view) !== A.resume.view || A.resume.view === "journey") A.step = requiredThreatStep(A,A.step);
      t(A), r(requiredThreatView(A,A.resume.view)), s(A.resume.section), J({road:A.resume.road,checkpoint:A.resume.checkpoint}), A.reflectionDraft && setReflection(A.reflectionDraft), $.current = A, P.current = E.version, me.current = JSON.stringify(A), C("saved"), R(""), B(!0), sn.current = !0;
    } catch (E) {
      C("error"), R(E instanceof Error ? E.message : "Your book could not be opened.");
    }
  }, []);
  h.useEffect(() => {
    const E = requestAnimationFrame(() => {
      jl();
      xe(!0);
      try {
        const X = JSON.parse(localStorage.getItem("dear2100-preferences") || "{}");
        ne(typeof X.volume == "number" ? Math.max(0, Math.min(100, X.volume)) : 30), F(!!X.quiet);
      } catch {}
      M(!0);
    });
    return () => {
      cancelAnimationFrame(E), ge.destroy();
    };
  }, [jl]), h.useEffect(() => {
    if (Pe) try {
      sessionStorage.setItem(fo, JSON.stringify(ee));
    } catch {}
  }, [ee, Pe]);
  const Yn = h.useCallback(async () => {
    if (!sn.current || Le.current || vt.current) return !1;
    const E = $.current,
      A = JSON.stringify(E);
    if (A === me.current) return !0;
    Le.current = !0, C("saving");
    try {
      const X = await fN(E, P.current);
      return P.current = X.version, me.current = A, R(""), C("saved"), !0;
    } catch (X) {
      return C("error"), R(X instanceof Error ? X.message : "Your changes have not been saved."), !1;
    } finally {
      Le.current = !1;
    }
  }, []);
  h.useEffect(() => {
    if (!I || j === "error") return;
    const E = setTimeout(() => void Yn(), 0);
    return () => clearTimeout(E);
  }, [e, I, Yn, j]), h.useEffect(() => {
    const E = setInterval(() => {
      sn.current && JSON.stringify($.current) !== me.current && !Le.current && j !== "error" && Yn();
    }, 1500);
    return () => clearInterval(E);
  }, [Yn, j]), h.useEffect(() => {
    if (ge.volume(Z / 100), !!N) try {
      localStorage.setItem("dear2100-preferences", JSON.stringify({
        volume: Z,
        quiet: V
      }));
    } catch {}
  }, [Z, V, N]), h.useEffect(() => {
    const E = () => {
      document.hidden ? (ge.pause(), ie(!1), Yn()) : ge.resume();
    };
    document.addEventListener("visibilitychange", E);
    const A = X => {
      JSON.stringify($.current) !== me.current && sn.current && X.preventDefault();
    };
    return window.addEventListener("beforeunload", A), () => {
      document.removeEventListener("visibilitychange", E), window.removeEventListener("beforeunload", A);
    };
  }, [Yn]), h.useEffect(() => {
    if (!Q || a !== "pause") return;
    const E = setInterval(() => pe(A => A >= 29 ? (ie(!1), ge.cue("save"), 30) : A + 1), 1e3);
    return () => clearInterval(E);
  }, [Q, n, ue, a]);
  h.useEffect(() => {
    const exit = async () => {
      for (; Le.current;) await new Promise(resolve=>setTimeout(resolve,30));
      if (!await Yn()) return;
      C("saved");
      if (window.parent !== window) window.parent.postMessage({type:"dear2100-saved-exit"},location.origin);
      else location.href = "/#/";
    };
    const message = event => {
      if(event.origin !== location.origin || event.source !== window.parent) return;
      if(event.data?.type === "dear2100-save-exit") void exit();
      if(event.data?.type === "mentication:pause-for-alternative" && typeof event.data.requestId === "string") {
        ge.pause(); ie(!1);
        window.parent.postMessage({type:"mentication:alternative-ready",requestId:event.data.requestId},location.origin);
      }
    };
    const changed = event => { if(event.key === Sf) { C("error"); R("This book changed in another tab. Export your current copy, then reload the saved book. Nothing was overwritten."); } };
    window.addEventListener("message", message);
    window.addEventListener("storage",changed);
    window.addEventListener("dear2100-exit",exit);
    return () => {window.removeEventListener("message",message);window.removeEventListener("storage",changed);window.removeEventListener("dear2100-exit",exit);};
  }, [Yn]);
  const jf = (E, A) => t(X => ({
      ...X,
      answers: {
        ...X.answers,
        [E]: A
      }
    })),
    Ct = E => {
      if (m(0), ie(!1), u(!1), E <= 1) {
        s("start"), r("home"), window.scrollTo({
          top: 0,
          behavior: "instant"
        }), requestAnimationFrame(() => {
          var X;
          return (X = ut.current) == null ? void 0 : X.focus({
            preventScroll: !0
          });
        }), ge.cue();
        return;
      }
      const A = requiredThreatStep($.current, Math.max(0, Math.min(9, E)));
      t(X => ({
        ...X,
        step: A,
        furthestStep: Math.max(X.furthestStep ?? X.step, A)
      })), r(A === 9 ? "plan" : "journey"), ge.shift(E), ge.cue("next"), window.scrollTo({
        top: 0,
        behavior: "instant"
      }), requestAnimationFrame(() => {
        var X;
        return (X = ut.current) == null ? void 0 : X.focus({
          preventScroll: !0
        });
      });
    },
    oo = E => {
      if (requiredThreatView($.current,E) !== E) { Ct(3); return; }
      ie(!1), u(!1), w(!1), E === "home" && s("start"), r(E), ge.cue(), window.scrollTo({
        top: 0,
        behavior: "instant"
      });
    },
    Cf = async E => {
      Y(await ge.enable(E));
    },
    qx = () => {
      if (ue === 3 && !threatCheckPassed(e)) return;
      if (!_t(ue, D)) {
        m(A => A + 1);
        const E = document.querySelector(".needs-answer textarea, .flow-value-grid button:not([aria-pressed='true'])");
        E == null || E.focus(), E == null || E.scrollIntoView({
          block: "center",
          behavior: reducedMotion() ? "instant" : "smooth"
        });
        return;
      }
      ue === 8 || x ? (t(E => ({
        ...E,
        committed: !0,
        scheduledLabel: K2(E.answers),
        step: 9,
        furthestStep: 9
      })), ge.cue("save"), u(!0), w(!1), r("plan"), window.scrollTo({
        top: 0,
        behavior: "instant"
      })) : Ct(ue + 1);
    },
    bn = E => {
      w(!0), Ct(E);
    },
    Qx = async () => {
      if (!d) {
        if (!threatCheckPassed(e)) { Ct(3); return; }
        if (!_t(1, D)) {
          bn(1);
          return;
        }
        if (!_t(6, D)) {
          bn(6);
          return;
        }
        if (!_t(9, D)) {
          bn(8);
          return;
        }
        p(!0);
        try {
          const E = Y2($.current, gc(), new Date().toISOString());
          for ($.current = E, t(E); Le.current;) await new Promise(A => setTimeout(A, 50));
          (await Yn()) && (y(null), r("closing"), u(!1), ge.cue("save"), window.scrollTo({
            top: 0,
            behavior: "instant"
          }));
        } catch (E) {
          R(E instanceof Error ? E.message : "Your chapter could not be saved. Your answers are still here.");
        } finally {
          p(!1);
        }
      }
    },
    Cl = async () => {
      if (d) return;
      if (!threatCheckPassed(e)) { Ct(3); return; }
      p(true);
      try {
        const book = Y2($.current,gc(),new Date().toISOString());
        $.current = book; t(book);
        for (; Le.current;) await new Promise(resolve=>setTimeout(resolve,30));
        if (!await Yn()) return;
        const chapter = book.chapters.find(c=>c.id === book.activeChapterId);
        const existing = book.reflectionDraft;
        if (existing && existing.chapterId !== chapter.id) {
          R("A reflection draft belongs to another chapter. Finish or export that draft before starting this observation."); return;
        }
        Ne(existing || {chapterId:chapter.id,action:chapter.answers.action,result:"unclear",observed:"",learned:"",next:"",actualDiscomfort:null,afterLikelihood:null,goalStateAfter:null});
        l("outcome");
      } catch(error) { R(error.message); } finally { p(false); }
    },
    Xx = async () => {
      if (d || !re.observed.trim() || e.entries.length >= 200) return;
      const chapter = e.chapters.find(c=>c.id === re.chapterId);
      if (!chapter || chapter.answers.action !== re.action) {R("The original chapter could not be found. Your draft is preserved.");return;}
      p(true);
      const answers = chapter.answers;
      const entry = {id:gc(),createdAt:new Date().toISOString(),chapterId:chapter.id,want:answers.want,action:re.action,prediction:answers.prediction,likelihood:answers.likelihood,discomfort:answers.discomfort,goalStateBefore:answers.goalState,goalStateAfter:re.goalStateAfter,result:re.result,observed:re.observed.trim(),learned:re.learned,next:re.next,actualDiscomfort:re.actualDiscomfort,afterLikelihood:re.afterLikelihood};
      const previous = $.current;
      const book = {...previous,entries:[entry,...previous.entries],reflectionDraft:null};
      $.current = book;t(book);
      for (; Le.current;) await new Promise(resolve=>setTimeout(resolve,30));
      if(await Yn()) {l(null);u(false);r("closing");ge.cue("save");}
      else {$.current=previous;t(previous);}
      p(false);
    },
    Jx = async () => {
      vt.current = !0;
      try {
        for (; Le.current;) await new Promise(A => setTimeout(A, 100));
        await hN();
        const E = Co();
        t(E), J(gs);
        try {
          sessionStorage.removeItem(fo);
        } catch {}
        $.current = E, me.current = JSON.stringify(E), P.current = 0, r("cover"), C("saved"), R(""), l(null);
      } catch (E) {
        C("error"), R(String(E));
      } finally {
        vt.current = !1, v(null);
      }
    },
    _f = E => {
      const A = E.chapters.find(X => X.id === E.activeChapterId);
      return !E.answers.want.trim() || A && JSON.stringify(A.answers) === JSON.stringify(E.answers) ? E.chapters : [{
        id: gc(),
        createdAt: new Date().toISOString(),
        answers: structuredClone(E.answers),
        scheduledLabel: E.scheduledLabel
      }, ...E.chapters];
    },
    ew = () => {
      if (e.chapters.length >= 200) {
        R("Your book is full. Export your book before beginning another chapter."), v(null);
        return;
      }
      t(E => ({
        ...Co(),
        entries: E.entries,
        chapters: _f(E)
      })), y(null), w(!1), J(gs);
      try {
        sessionStorage.removeItem(fo);
      } catch {}
      r("home"), v(null), l(null);
    },
    Ef = (E, A = !1) => {
      if (A && e.chapters.length >= 200) {
        R("Your book is full. Export your book before beginning another chapter.");
        return;
      }
      if (A) {
        J(gs);
        try {
          sessionStorage.removeItem(fo);
        } catch {}
      }
      t(X => {
        const Lt = A ? {
          ...Co(),
          entries: X.entries,
          chapters: _f(X)
        } : X;
        return {
          ...Lt,
          answers: {
            ...Lt.answers,
            want: E
          },
          step: x && !A ? 9 : 2,
          furthestStep: A ? 2 : Math.max(Lt.furthestStep, 2)
        };
      }), r(x && !A ? "plan" : "journey"), w(!1), ge.shift(2), ge.cue("next"), window.scrollTo({
        top: 0,
        behavior: "instant"
      }), requestAnimationFrame(() => {
        var X;
        return (X = ut.current) == null ? void 0 : X.focus({
          preventScroll: !0
        });
      });
    },
    tw = E => {
      const A = E.trim();
      if (!(Kn || !A)) {
        if (D.want.trim() && D.want.trim().toLocaleLowerCase() !== A.toLocaleLowerCase()) {
          S(A), v("newDirection");
          return;
        }
        Ef(A);
      }
    },
    ss = n === "journey" && ue === 3,
    nw = F2.findIndex(E => ue >= E.range[0] && ue <= E.range[1]),
    rw = {
      2: "Next: Understand the alarm",
      3: D.barrierFocus === "practical" ? "Next: choose what would help" : "Next: my response to fear",
      4: "Explore my two futures",
      5: "Choose what matters to me",
      6: D.barrierFocus === "practical" ? "Make room for support" : "Practise riding the wave",
      7: "Build my plan",
      8: "Review my plan"
    },
    Kn = !I || j === "loading";
  h.useEffect(() => {
    const E = document.modelContext;
    if (!(E != null && E.registerTool)) return;
    const A = new AbortController(),
      X = [{
        name: "get_journey_progress",
        description: "Read only the current chapter and progress, without revealing private reflection text.",
        inputSchema: {
          type: "object",
          properties: {},
          additionalProperties: !1
        },
        annotations: {
          readOnlyHint: !0,
          untrustedContentHint: !1
        },
        execute: () => {
          var Lt;
          return {
            step: $.current.step,
            chapter: ((Lt = Bp($.current.answers)[$.current.step - 1]) == null ? void 0 : Lt.title) ?? $2[$.current.step],
            committed: $.current.committed,
            recordedOutcomes: $.current.entries.length
          };
        }
      }, {
        name: "open_journey_view",
        description: "Navigate to the title page, home, journey, next-step plan, or saved book. Does not change answers or submit an outcome.",
        inputSchema: {
          type: "object",
          properties: {
            view: {
              type: "string",
              enum: ["cover", "home", "journey", "plan", "book"]
            }
          },
          required: ["view"],
          additionalProperties: !1
        },
        annotations: {
          readOnlyHint: !1,
          untrustedContentHint: !1
        },
        execute: async Lt => {
          const Ir = Lt == null ? void 0 : Lt.view;
          if (Ir !== "cover" && Ir !== "home" && Ir !== "journey" && Ir !== "plan" && Ir !== "book") throw new Error("Choose cover, home, journey, plan, or book.");
          const Rf = requiredThreatView($.current, Ir === "journey" && $.current.step >= 9 ? "plan" : Ir);
          if (Rf === "journey") t(book=>({...book,step:requiredThreatStep(book,book.step)}));
          return r(Rf), await new Promise(sw => requestAnimationFrame(() => requestAnimationFrame(() => sw()))), {
            view: Rf
          };
        }
      }];
    for (const Lt of X) try {
      Promise.resolve(E.registerTool(Lt, {
        signal: A.signal
      })).catch(() => {});
    } catch {}
    return () => A.abort();
  }, []);
  const ow = i.jsxs(i.Fragment, {
    children: [i.jsxs("div", {
      className: "pause-orbit " + (Q ? "running" : ""),
      children: [i.jsx("div", {}), i.jsx("span", {
        children: de === 30 ? "Your pace." : Q ? de < 10 ? "Look around." : de < 20 ? "Feel the support." : "Choose your next move." : "Take a moment."
      })]
    }), i.jsx("p", {
      className: "pause-instruction",
      children: de < 10 ? "Name three things you can see." : de < 20 ? "Feel where your feet or body meet a surface." : "Let your breathing stay natural. Decide what you need next."
    }), i.jsxs("button", {
      className: "secondary-button",
      onClick: () => {
        de === 30 && pe(0), ie(!Q), ge.cue();
      },
      children: [Q ? i.jsx(bs, {
        size: 16
      }) : i.jsx(av, {
        size: 16
      }), " ", Q ? "Pause" : de === 30 ? "Repeat the pause" : "Start a 30-second pause"]
    }), i.jsx("p", {
      className: "fine-print",
      children: "Eyes open. No breath holding. You can stop at any time."
    })]
  });
  return i.jsxs("div", {
    className: "app-world " + (ss ? "deep-world " : "") + (ss ? "judgment-world " : "") + (n === "journey" ? `chapter-world-${nw} journey-world-step-${ue}` : ""),
    "data-motion": V ? "quiet" : "full",
    children: [i.jsxs("header", {
      className: `topbar ${n === "home" || n === "journey" && ue <= 1 ? "topbar-home" : ""}`,
      children: [i.jsxs("div", {
        className: "topbar-identity",
        children: [i.jsxs("button", {
          className: "wordmark",
          onClick: () => oo("home"),
          "aria-label": "Dear 2100 home",
          children: [i.jsx("span", {
            className: "brand-symbol",
            "aria-hidden": "true",
            children: i.jsx("img", {
              src: ss ? cN : uN,
              alt: ""
            })
          }), i.jsx("span", {
            className: "brand-word",
            children: "Mentication"
          })]
        }), (n === "home" || n === "journey" && ue <= 1) && i.jsxs("span", {
          className: "home-header-label",
          children: [i.jsxs("b", {
            children: ["0", o === "start" ? 1 : o === "pattern" ? 2 : 3]
          }), o === "start" ? "Your thread" : o === "pattern" ? "The pattern" : "Two futures"]
        })]
      }), n !== "home" && !(n === "journey" && ue <= 1) && i.jsxs("span", {
        className: "edition",
        children: ["DEAR 2100 ", i.jsx("i", {}), " VOL. 03"]
      }), i.jsxs("div", {
        className: "header-controls",
        children: [i.jsx("button", {
          className: "icon-button " + (z ? "is-on" : ""),
          "aria-label": z ? "Turn sound off" : "Turn sound on",
          "aria-pressed": z,
          onClick: () => void Cf(!z),
          children: z ? i.jsx($1, {
            size: 19
          }) : i.jsx(ob, {
            size: 18
          })
        }), i.jsx("button", {
          className: "icon-button settings-button",
          "aria-label": "Settings and privacy",
          onClick: () => l("settings"),
          children: i.jsx(H1, {
            size: 19
          })
        })]
      })]
    }), _ && i.jsxs("div", {
      className: "save-error",
      role: "alert",
      children: [i.jsx("span", {
        children: _
      }), i.jsx("button", {
        onClick: () => void (I ? Yn() : jl()),
        children: "Try again"
      }), i.jsx("button",{onClick:()=>Gx("Dear-2100-original.json",bookStore.original() || "null","application/json"),children:"Download original saved data"}), I && i.jsx("button",{onClick:()=>void jl(),children:"Reload saved book (discard this tab’s edits)"}), I && i.jsx("button", {
        onClick: () => mc(e),
        children: "Export current copy"
      })]
    }), n === "cover" ? i.jsx(J2, {
      onEnter: () => {
        s("start"), r(e.step === 9 && $u(e) ? "closing" : "home"), ge.cue("next"), window.scrollTo({
          top: 0,
          behavior: "instant"
        }), requestAnimationFrame(() => {
          var E;
          return (E = ut.current) == null ? void 0 : E.focus({
            preventScroll: !0
          });
        });
      }
    }) : n === "home" || n === "journey" && ue <= 1 ? i.jsx("main", {
      className: "home-main",
      ref: ut,
      tabIndex: -1,
      children: i.jsx(Z2, {
        canResume: e.furthestStep > 1,
        furthestStep: e.furthestStep,
        resumeStep: e.step > 1 ? e.step : e.furthestStep,
        stages: an,
        initialWant: D.want,
        blocked: Kn,
        initialSection:e.resume.section,
        onSectionChange: s,
        onSound: () => ge.cue(),
        onSettings: () => l("settings"),
        onLearn: () => l("learn"),
        onBegin: tw,
        onResume: () => {
          Kn || Ct(e.step > 1 ? e.step : e.furthestStep);
        },
        onOpenStage: E => {
          !Kn && E <= e.furthestStep && Ct(E);
        }
      }, I ? "ready" : "loading")
    }) : n === "journey" ? i.jsxs("main", {
      className: `experience-shell flow-experience flow-experience-${ue} ${ss ? "threat-screen" : ""}`,
      ref: ut,
      tabIndex: -1,
      children: [i.jsxs("aside", {
        className: "chapter-rail",
        children: [i.jsxs("div", {
          className: "rail-title",
          children: ["PATTERN.", i.jsx("br", {}), i.jsx("span", {
            children: "DIRECTION. ACTION."
          })]
        }), i.jsx("nav", {
          "aria-label": "Journey stages",
          children: an.map((E, A) => {
            const X = A + 1;
            return i.jsxs("button", {
              type: "button",
              className: ue === X ? "current" : "",
              disabled: X > e.furthestStep,
              onClick: () => Ct(X),
              children: [i.jsx("span", {
                children: ue > X ? i.jsx(Rt, {
                  size: 14
                }) : String(X).padStart(2, "0")
              }), i.jsxs("div", {
                children: [i.jsx("small", {
                  children: E.phase.toUpperCase()
                }), E.title]
              })]
            }, E.title);
          })
        }), i.jsxs("div", {
          className: "rail-note",
          children: [i.jsx(Bh, {
            size: 28,
            strokeWidth: 1
          }), i.jsxs("p", {
            children: ["Your words.", i.jsx("br", {}), "Your way forward."]
          })]
        }), i.jsxs("button", {
          className: "text-button",
          onClick: () => l("pause"),
          children: [i.jsx(bs, {
            size: 14
          }), " Take a pause"]
        })]
      }), i.jsxs("div", {
        className: "experience-content",
        children: [i.jsxs("div", {
          className: "flow-top",
          children: [i.jsxs("button", {
            className: "back-button",
            "aria-label": "Previous stage",
            onClick: () => {if(requestDearHistoryBack())return;if(document.dispatchEvent(new Event("dear:question-back",{cancelable:true})))Ct(ue-1);},
            children: [i.jsx(Gr, {
              size: 18
            }), " Back"]
          }), i.jsxs("button", {
            className: "journey-map-trigger",
            onClick: () => l("path"),
            "aria-label": "Open journey overview",
            children: [i.jsx("strong", {
              children: an[ue - 1].title
            }), i.jsxs("span", {
              children: [ue, " of ", an.length, " · View path"]
            })]
          }), i.jsx("button", {
            className: "mobile-pause",
            "aria-label": "Take a pause",
            onClick: () => l("pause"),
            children: i.jsx(bs, {
              size: 17
            })
          })]
        }), i.jsx("nav", {
          className: "flow-stage-rail",
          "aria-label": "Journey stages",
          children: an.map((E, A) => {
            const X = A + 1;
            return i.jsx("button", {
              type: "button",
              "aria-label": `${X <= e.furthestStep ? "Review" : "Not reached"} stage ${X}: ${E.title}`,
              "aria-current": ue === X ? "step" : void 0,
              className: ue === X ? "current" : X < e.furthestStep ? "passed" : "",
              disabled: X > e.furthestStep,
              onClick: () => Ct(X),
              children: i.jsx("span", {
                children: X < e.furthestStep && ue !== X ? i.jsx(Rt, {
                  size: 13,
                  "aria-hidden": "true"
                }) : String(X).padStart(2, "0")
              })
            }, E.title);
          })
        }), i.jsx(kN, {
          step: ue,
          book: e,
          answer: jf,
          onLearn: () => l("learn"),
          futureWalk: ee,
          onFutureWalkChange: J,
          onResumeChange: patch => t(book=>({...book,resume:{...book.resume,...patch}})),
          onThreatCheck: threatCheck => t(book=>({...book,threatCheck})),
          focusRequest: k, onDone:qx
        }, ue), ue < 9 && ![2,3,4,6,8].includes(ue) && !(ue===7&&D.barrierFocus!=="practical") && i.jsxs("footer", {
          className: "flow-actions",
          children: [i.jsx("span", {
            className: "save-status",
            id: "continue-guidance",
            children: ue === 3 ? (threatCheckPassed(e) ? "Understanding check passed · 75% or more" : "Answer all four questions · 3 of 4 correct to continue") : i.jsxs(i.Fragment, {
              children: [i.jsx(pu, {
                size: 12
              }), _t(ue, D) ? j === "saved" ? "Saved privately" : j === "saving" ? "Saving…" : j === "loading" ? "Opening…" : "Not saved yet" : G2(ue, D)]
            })
          }), i.jsxs("button", {
            className: "primary-button " + (ss ? "cream-button" : "") + (_t(ue, D) ? "" : " needs-input"),
            disabled: Kn || ue === 3 && !threatCheckPassed(e),
            "aria-describedby": "continue-guidance",
            onClick: qx,
            children: [_t(ue, D) ? x ? "Return to my plan" : rw[ue] : ue === 8 && D.action.trim() ? "Next: my response to fear" : ue === 6 ? "Choose my values above" : "Answer above to continue", i.jsx(Qe, {
              size: 18
            })]
          })]
        })]
      }), i.jsxs("aside", {
        className: "context-rail",
        children: [i.jsx("span", {
          children: "DEAR FUTURE ME,"
        }), i.jsx("p", {
          children: D.want || "What I keep coming back to…"
        }), i.jsx("div", {
          className: "context-rule"
        }), i.jsxs("small", {
          children: [an[ue - 1].phase.toUpperCase(), " · ", an[ue - 1].cue.toUpperCase()]
        }), Gt.length > 0 && i.jsx("div", {
          className: "context-values",
          children: Gt.map(E => i.jsx("span", {
            children: E
          }, E))
        }), i.jsxs("span", {
          className: "margin-note",
          children: ["one honest answer", i.jsx("br", {}), "at a time."]
        })]
      })]
    }) : n === "closing" && pi ? i.jsx(mN, {
      chapter: pi,
      saveStatus: j,
      current: pi.id === e.activeChapterId,
      onBook: () => oo("book"),
      onPlan: () => Ct(9),
      onObserve: Cl,
      onNew: () => v("restart")
    }, pi.id) : n === "plan" ? i.jsxs("main", {
      className: "collection-page plan-page plan-review enter",
      ref: ut,
      tabIndex: -1,
      children: [i.jsxs("div", {
        className: "plan-review-top",
        children: [i.jsxs("button", {
          className: "text-button",
          onClick: () => Ct(8),
          children: [i.jsx(Gr, {
            size: 16
          }), "Back"]
        }), i.jsx("span", {
          className: "eyebrow",
          children: "MY PLAN · 9 OF 9"
        })]
      }), i.jsxs("div", {
        className: "collection-heading",
        children: [i.jsxs("h1", {
          children: ["Your plan is ", i.jsx("em", {
            children: "ready."
          })]
        }), i.jsx("span", {
          className: "small-orbit",
          children: i.jsx(ta, {
            size: 26,
            strokeWidth: 1
          })
        })]
      }), e.committed && D.action ? i.jsxs(i.Fragment, {
        children: [i.jsx("p", {
          className: "lede",
          children: "Check the details. Then keep this chapter in your book."
        }), i.jsxs("div", {
          className: "plan-purpose",
          children: [i.jsxs("div", {
            children: [i.jsx("small", {
              children: "THE DIRECTION I CHOSE"
            }), i.jsx("p", {
              children: D.want
            })]
          }), i.jsx("button", {
            className: "text-button",
            onClick: () => bn(1),
            "aria-label": "Edit my direction",
            children: "Edit"
          })]
        }), i.jsxs("div", {
          className: "plan-card",
          children: [i.jsxs("div", {
            className: "plan-card-label",
            children: [i.jsx("small", {
              children: "MY NEXT STEP"
            }), i.jsx("button", {
              className: "text-button",
              onClick: () => bn(8),
              "aria-label": "Edit my next step",
              children: "Edit"
            })]
          }), i.jsx("p", {
            className: "handwritten",
            children: D.action
          }), i.jsxs("small", {
            children: [(e.scheduledLabel || D.day).toUpperCase(), " ·", " ", D.time.toUpperCase(), " · ", D.minutes, " MIN"]
          }), i.jsxs("div", {
            className: "plan-values-row",
            children: [i.jsx("div", {
              className: "value-tags",
              children: Gt.map(E => i.jsx("span", {
                children: E
              }, E))
            }), i.jsx("button", {
              className: "text-button",
              onClick: () => bn(6),
              "aria-label": "Edit my values",
              children: "Edit values"
            })]
          }), i.jsxs("div", {
            className: "plan-fallback",
            children: [i.jsxs("div", {
              className: "plan-card-label",
              children: [i.jsx("small", {
                children: D.barrierFocus === "practical" ? "IF THE OBSTACLE RETURNS" : "WHEN FEAR ARRIVES"
              }), i.jsx("button", {
                className: "text-button",
                onClick: () => bn(8),
                "aria-label": "Edit my response to fear",
                children: "Edit"
              })]
            }), i.jsx("p", {
              children: D.ifThen || "Choose how you’ll respond when fear appears."
            })]
          }), D.practicalSupport && i.jsxs("div", {
            className: "plan-support",
            children: [i.jsx("small", {
              children: "SUPPORT THAT MAKES ROOM"
            }), i.jsx("p", {
              children: D.practicalSupport
            }), i.jsx("button", {
              className: "text-button",
              onClick: () => bn(4),
              children: "Edit support"
            })]
          })]
        }), i.jsxs("div", {
          className: "plan-buttons",
          children: [i.jsxs("button", {
            className: "primary-button",
            disabled: Kn || d,
            onClick: () => void Qx(),
            children: [d ? "Saving my chapter…" : "Done for now", i.jsx(Rt, {
              size: 18
            })]
          }), i.jsx("span", {
            className: "plan-finish-hint",
            children: _t(9, D) && _t(6, D) ? "Save and open my complete chapter" : "Finish the missing details to save this chapter"
          }), !c && i.jsx("button", {
            className: "text-button",
            onClick: Cl,
            children: "I’ve tried it · add what happened"
          })]
        }), i.jsxs("p", {
          className: "flow-input-hint",
          children: [j === "saved" ? "Your plan is saved." : j === "error" ? "Your latest changes need saving. Use Try again above." : "Saving your latest changes…", " Nothing here needs to be called a success or failure."]
        }), e.entries.find(E => E.chapterId === e.activeChapterId && E.action === D.action) && i.jsxs("div", {
          className: "plan-latest",
          children: [i.jsx("small", {
            children: "LAST OBSERVATION"
          }), i.jsx("p", {
            children: (Nf = e.entries.find(E => E.chapterId === e.activeChapterId && E.action === D.action)) == null ? void 0 : Nf.observed
          })]
        }), i.jsxs("div", {
          className: "plan-links",
          children: [i.jsxs("button", {
            type: "button",
            className: "text-button",
            onClick: () => bn(5),
            children: ["Review my two futures ", i.jsx(Qe, {
              size: 15
            })]
          }), i.jsxs("button", {
            type: "button",
            className: "text-button",
            onClick: () => oo("book"),
            children: ["Open my book ", i.jsx(tt, {
              size: 15
            })]
          })]
        }), i.jsxs("details", {
          className: "foldout plan-background",
          children: [i.jsxs("summary", {
            children: ["See the pattern and my prediction ", i.jsx(Ke, {
              size: 16
            })]
          }), i.jsxs(yc, {
            tone: "lilac",
            children: [i.jsx(hu, {
              size: 25
            }), i.jsxs("div", {
              children: [i.jsx("small", {
                children: "PREDICTION LAB"
              }), i.jsx("p", {
                children: D.prediction || "No prediction named yet."
              }), i.jsxs("p", {
                className: "fine-print",
                children: ["Your estimate: ", ratingText(D.likelihood,"%"), " · expected discomfort: ", ratingText(D.discomfort,"/10")]
              })]
            })]
          }), i.jsx(Zx, {
            a: D,
            committed: e.committed
          })]
        })]
      }) : i.jsxs("div", {
        className: "empty-state",
        children: [i.jsx("div", {
          className: "empty-orbit",
          children: i.jsx(ta, {
            size: 40,
            strokeWidth: 1
          })
        }), i.jsxs("h2", {
          children: ["Your next step starts", i.jsx("br", {}), "with what matters."]
        }), i.jsx("p", {
          children: "Work through your letter to turn that into a practical plan."
        }), i.jsxs("button", {
          className: "primary-button",
          disabled: Kn,
          onClick: () => Ct(ue >= 8 ? 8 : Math.max(1, ue)),
          children: [ue > 0 ? "Continue my letter" : "Start my letter", i.jsx(Qe, {
            size: 18
          })]
        })]
      }), i.jsxs("button", {
        className: "pause-link",
        onClick: () => l("pause"),
        children: [i.jsx(bs, {
          size: 18
        }), i.jsxs("span", {
          children: ["Need a moment first?", i.jsx("small", {
            children: "Open a short grounding pause"
          })]
        }), i.jsx(tt, {
          size: 18
        })]
      })]
    }) : i.jsxs("main", {
      className: "collection-page book-page enter",
      ref: ut,
      tabIndex: -1,
      children: [e.reflectionDraft && i.jsx("button",{className:"primary-button",onClick:()=>{setReflection(e.reflectionDraft);l("outcome");},children:"Continue my reflection draft"}),i.jsx("div", {
        className: "eyebrow",
        children: "YOUR RECORD"
      }), i.jsxs("div", {
        className: "collection-heading",
        children: [i.jsxs("h1", {
          children: ["Your ", i.jsx("em", {
            children: "2100 Book."
          })]
        }), i.jsx(fu, {
          size: 40,
          strokeWidth: 1
        })]
      }), i.jsx("p", {
        className: "lede",
        children: "Your direction, your step, and what you learn."
      }), e.chapters.length > 0 && i.jsxs("section", {
        className: "saved-chapters",
        "aria-label": "My saved chapters",
        children: [i.jsxs("div", {
          className: "evidence-heading",
          children: [i.jsx("h2", {
            children: "My chapters"
          }), i.jsxs("span", {
            children: [e.chapters.length, " SAVED"]
          })]
        }), e.chapters.map((E, A) => i.jsxs("button", {
          className: "saved-chapter",
          onClick: () => {
            y(E.id), r("closing"), window.scrollTo({
              top: 0,
              behavior: "instant"
            });
          },
          children: [i.jsx("span", {
            className: "saved-chapter-number",
            children: String(e.chapters.length - A).padStart(2, "0")
          }), i.jsxs("span", {
            children: [i.jsx("small", {
              children: new Date(E.createdAt).toLocaleDateString(void 0, {
                day: "numeric",
                month: "short",
                year: "numeric"
              })
            }), i.jsx("strong", {
              children: E.answers.want
            }), i.jsx("em", {
              children: E.answers.action || "A direction I’m exploring"
            })]
          }), i.jsx(tt, {
            size: 18
          })]
        }, E.id))]
      }), D.want ? i.jsxs(i.Fragment, {
        children: [i.jsxs("div", {
          className: "book-cover",
          children: [i.jsx("small", {
            children: "THIS CHAPTER OF MY LIFE"
          }), i.jsx("h2", {
            children: D.want
          }), D.action && i.jsxs("p", {
            className: "book-cover-step",
            children: ["Next step · ", D.action]
          }), i.jsx("div", {
            className: "value-tags",
            children: Gt.map(E => i.jsx("span", {
              children: E
            }, E))
          }), i.jsxs("div", {
            className: "book-cover-foot",
            children: [i.jsx("span", {
              children: e.committed && D.action ? "A STEP CHOSEN" : "A LETTER IN PROGRESS"
            }), i.jsx(Bh, {
              size: 31,
              strokeWidth: 1
            })]
          })]
        }), i.jsxs("details", {
          className: "foldout",
          children: [i.jsxs("summary", {
            children: ["Read my letter ", i.jsx(Ke, {
              size: 16
            })]
          }), i.jsxs("div", {
            className: "letter-content",
            children: [i.jsx("h2", {
              children: "Dear future me,"
            }), i.jsxs("p", {
              children: ["I want to ", D.want.replace(/^I want to /i, "").toLowerCase(), "."]
            }), D.prediction && i.jsxs("p", {
              children: ["When I think about starting, I predict: ", D.prediction]
            }), D.practicalNote && i.jsxs("p", {
              children: ["A practical constraint I named: ", D.practicalNote]
            }), (D.audience || D.meaning || D.voice) && i.jsxs("details", {
              className: "foldout",
              children: [i.jsxs("summary", {
                children: ["Earlier thoughts about the fear ", i.jsx(Ke, {
                  size: 16
                })]
              }), D.audience && i.jsxs("p", {
                children: ["Whose reaction I imagined: ", D.audience]
              }), D.meaning && i.jsxs("p", {
                children: ["What I feared it might mean: ", D.meaning]
              }), D.voice && i.jsxs("p", {
                children: ["Where that expectation sounded familiar: ", D.voice]
              })]
            }), D.behavior && i.jsxs("p", {
              children: ["My usual response is: ", D.behavior, ".", " ", D.cost ? "The possible cost: " + D.cost : ""]
            }), D.avoidFuture && i.jsxs("p", {
              children: ["If I keep postponing: ", D.avoidFuture]
            }), D.actFuture && i.jsxs("p", {
              children: ["If I make room for it: ", D.actFuture]
            }), D.now && i.jsxs("p", {
              children: ["What starting could change now: ", D.now]
            }), D.judgment && i.jsxs("p", {
              children: ["The standard I chose: ", D.judgment]
            }), Gt.length > 0 && i.jsxs("p", {
              children: ["I want to act with ", Gt.join(", ").toLowerCase(), ".", " ", D.valueAction]
            }), D.action && i.jsxs("p", {
              children: ["My next step: ", D.action, ". ", D.ifThen]
            }), D.competing && i.jsxs("p", {
              children: ["What competes for my time: ", D.competing]
            }), D.evidenceLookFor && i.jsxs("p", {
              children: ["What I planned to look for: ", D.evidenceLookFor]
            }), D.reward && i.jsxs("p", {
              children: ["How I planned to mark the attempt: ", D.reward]
            }), i.jsx("span", {
              className: "handwritten",
              children: "A working draft. Mine to change."
            })]
          }), i.jsxs("button", {
            className: "text-button",
            onClick: () => Ct(1),
            children: ["Return to my answers ", i.jsx(Qe, {
              size: 14
            })]
          })]
        })]
      }) : i.jsxs(yc, {
        children: [i.jsx("p", {
          children: "Your letter will appear here as you work through the journey."
        }), i.jsxs("button", {
          className: "text-button",
          onClick: () => Ct(1),
          disabled: Kn,
          children: ["Start my letter ", i.jsx(Qe, {
            size: 15
          })]
        })]
      }), i.jsx(oN, {
        entries: e.entries
      }), i.jsxs("div", {
        className: "evidence-heading",
        children: [i.jsx("h2", {
          children: "What I learned"
        }), i.jsxs("span", {
          children: [e.entries.length, " ", e.entries.length === 1 ? "ENTRY" : "ENTRIES"]
        })]
      }), e.entries.length === 0 ? i.jsxs("div", {
        className: "evidence-empty",
        children: [i.jsx(hu, {
          size: 30,
          strokeWidth: 1
        }), i.jsxs("p", {
          children: ["No results yet.", i.jsx("br", {}), i.jsx("span", {
            children: "A plan is a starting point. Add evidence after trying it."
          })]
        })]
      }) : i.jsx("div", {
        className: "evidence-stack",
        children: e.entries.map((E, A) => i.jsxs("details", {
          className: "evidence-card result-" + E.result,
          open: A === 0,
          children: [i.jsxs("summary", {
            children: [i.jsxs("span", {
              className: "evidence-date",
              children: [new Date(E.createdAt).toLocaleDateString(void 0, {
                month: "short",
                day: "numeric"
              }), i.jsxs("small", {
                children: ["FIELD NOTE", " ", String(e.entries.length - A).padStart(2, "0")]
              })]
            }), i.jsx("h3", {
              children: E.action
            }), i.jsx("span", {
              className: "result-badge",
              children: ms[E.result]
            })]
          }), i.jsxs("div", {
            className: "evidence-details",
            children: [i.jsx("small", {
              children: "I PREDICTED"
            }), i.jsx("p", {
              children: E.prediction
            }), i.jsx("small", {
              children: "WHAT ACTUALLY HAPPENED"
            }), i.jsx("p", {
              children: E.observed
            }), i.jsxs("div", {
              className: "belief-shift",
              children: [i.jsxs("div", {
                children: [i.jsx("small", {
                  children: "BEFORE"
                }), i.jsxs("b", {
                  children: ratingText(E.likelihood, "%")
                })]
              }), i.jsx(Qe, {
                size: 22
              }), i.jsxs("div", {
                children: [i.jsx("small", {
                  children: "MY ESTIMATE NOW"
                }), i.jsxs("b", {
                  children: ratingText(E.afterLikelihood, "%")
                })]
              })]
            }), i.jsx("p", {
              className: "fine-print",
              children: `Your estimates, not objective probabilities. Ability to take this exact step (same question before and after): ${ratingText(E.goalStateBefore,"/10")} → ${ratingText(E.goalStateAfter,"/10")}. These are personal reflections, not clinical improvement scores.`
            }), E.learned && i.jsxs(i.Fragment, {
              children: [i.jsx("small", {
                children: "WHAT I LEARNED"
              }), i.jsx("p", {
                children: E.learned
              })]
            }), E.next && i.jsxs(i.Fragment, {
              children: [i.jsx("small", {
                children: "NEXT ADJUSTMENT"
              }), i.jsx("p", {
                children: E.next
              })]
            })]
          })]
        }, E.id))
      }), e.committed && D.action && i.jsxs("button", {
        className: "secondary-button add-evidence",
        disabled: e.entries.length >= 200,
        onClick: Cl,
        children: [i.jsx(Ke, {
          size: 18
        }), " ", e.entries.length ? "Add another observation" : "Record your first observation"]
      }), i.jsxs("details", {
        className: "foldout",
        children: [i.jsxs("summary", {
          children: ["A moment from before this letter ", i.jsx(Ke, {
            size: 16
          })]
        }), i.jsx(Ye, {
          label: "When have I done something that mattered, despite discomfort?",
          value: D.proud,
          onChange: E => jf("proud", E),
          placeholder: "Optional. What happened, and what helped?"
        })]
      }), i.jsxs("div", {
        className: "book-actions",
        children: [i.jsxs("button", {
          className: "primary-button",
          onClick: () => mc(e),
          disabled: !I,
          children: [i.jsx(Vh, {
            size: 18
          }), " Take my book with me"]
        }), i.jsx("button", {
          className: "text-button",
          onClick: () => Gx("Dear-2100-Data.json", JSON.stringify(e, null, 2), "application/json"),
          disabled: !I,
          children: "Download my data"
        }), i.jsxs("button", {
          className: "text-button",
          onClick: () => v("restart"),
          disabled: !I,
          children: ["Explore a new direction ", i.jsx(tt, {
            size: 14
          })]
        })]
      }), i.jsx("p", {
        className: "fine-print",
        children: "Your download contains personal reflections. Choose where you keep it."
      })]
    }), n !== "cover" && n !== "journey" && i.jsxs("nav", {
      className: "bottom-nav",
      "aria-label": "Main navigation",
      children: [i.jsxs("button", {
        className: n === "home" ? "active" : "",
        "aria-current": n === "home" ? "page" : void 0,
        onClick: () => oo("home"),
        children: [i.jsx(Dd, {
          size: 19
        }), i.jsx("span", {
          children: "Journey"
        })]
      }), i.jsxs("button", {
        className: n === "plan" ? "active" : "",
        "aria-current": n === "plan" ? "page" : void 0,
        onClick: () => oo("plan"),
        children: [i.jsx(ta, {
          size: 19
        }), i.jsx("span", {
          children: "My next step"
        })]
      }), i.jsxs("button", {
        className: n === "book" || n === "closing" ? "active" : "",
        "aria-current": n === "book" || n === "closing" ? "page" : void 0,
        onClick: () => oo("book"),
        children: [i.jsx(fu, {
          size: 19
        }), i.jsx("span", {
          children: "My book"
        }), e.chapters.length + e.entries.length > 0 && i.jsx("i", {
          className: "nav-count",
          children: e.chapters.length + e.entries.length
        })]
      })]
    }), i.jsx(Mx, {
      open: a !== null,
      onOpenChange: E => {
        E || (l(null), ie(!1));
      },
      children: i.jsxs(Dx, {
        className: "experience-dialog " + (a === "outcome" ? "outcome-dialog" : ""),
        children: [i.jsx(Lx, {
          children: a === "settings" ? "Make it yours." : a === "pause" ? "A moment to choose." : a === "learn" ? "Understand the framework." : a === "path" ? "Your path, at a glance." : "What happened?"
        }), i.jsx(zx, {
          children: a === "settings" ? "Sound, motion, privacy and your saved book." : a === "pause" ? "Use the room around you as a point of reference." : a === "learn" ? "A simplified working model. Your experience may differ." : a === "path" ? "See where you are. Revisit any step you’ve reached." : "Just what you noticed. It needn’t be a success story."
        }), a === "path" && i.jsx("ol", {
          className: "journey-overview",
          children: an.map((E, A) => i.jsx("li", {
            children: i.jsxs("button", {
              disabled: A + 1 > e.furthestStep,
              "aria-current": ue === A + 1 ? "step" : void 0,
              onClick: () => {
                l(null), Ct(A + 1);
              },
              children: [i.jsx("span", {
                children: A + 1
              }), i.jsxs("div", {
                children: [i.jsx("small", {
                  children: E.phase
                }), i.jsx("strong", {
                  children: E.title
                }), i.jsx("p", {
                  children: E.cue
                })]
              }), A + 1 < e.furthestStep && i.jsx(Rt, {
                size: 16
              })]
            })
          }, E.title))
        }), a === "settings" && i.jsxs("div", {
          className: "settings-content",
          children: [i.jsxs("div", {
            className: "setting-row",
            children: [i.jsxs("div", {
              children: [i.jsx("b", {
                children: "Soundscape"
              }), i.jsx("small", {
                children: "Soft, responsive tones. No narration."
              })]
            }), i.jsx(_p, {
              "aria-label": "Soundscape",
              checked: z,
              onCheckedChange: E => void Cf(E)
            })]
          }), i.jsx(aa, {
            label: "Sound volume",
            value: Z,
            onChange: ne,
            ends: ["Quiet", "Full"]
          }), i.jsxs("div", {
            className: "setting-row",
            children: [i.jsxs("div", {
              children: [i.jsx("b", {
                children: "Reduce motion"
              }), i.jsx("small", {
                children: "Keep transitions and diagrams still."
              })]
            }), i.jsx(_p, {
              "aria-label": "Reduce motion",
              checked: V,
              onCheckedChange: F
            })]
          }), i.jsxs(yc, {
            children: [i.jsx(pu, {
              size: 20
            }), i.jsxs("div", {
              children: [i.jsx("small", {
                children: "YOUR PRIVATE WORKSPACE"
              }), i.jsx("p", {
                children: "Your book is saved only in this browser on this device. There is no account, cloud backup or sync. Clearing site data, private browsing or changing devices can lose it. Anyone with access to this browser profile may read it. Export a private copy to keep a backup. Your reflections are not sent to a server or analysed by AI."
              })]
            })]
          }), i.jsxs("div", {
            className: "settings-links",
            children: [i.jsxs("button", {
              onClick: () => mc(e),
              disabled: !I,
              children: [i.jsx(Vh, {
                size: 17
              }), " Export my book"]
            }), i.jsxs("button", {
              onClick: () => v("delete"),
              disabled: !I,
              className: "delete-link",
              children: [i.jsx(eb, {
                size: 17
              }), " Delete my saved book"]
            }), i.jsxs("button", {
              onClick: () => l("learn"),
              children: [i.jsx(B1, {
                size: 17
              }), " Framework and sources"]
            })]
          }), i.jsx("p", {
            className: "fine-print",
            children: "Dear 2100 is a reflection and learning tool, not a diagnosis or treatment. Keep experiments safe, proportionate, and within your control."
          }), i.jsxs("a", {
            className: "support-link",
            href: "https://findahelpline.com/",
            target: "_blank",
            rel: "noopener noreferrer",
            children: ["Find support in your country ", i.jsx(tt, {
              size: 14
            })]
          })]
        }), a === "pause" && i.jsx("div", {
          className: "pause-modal",
          children: ow
        }), a === "learn" && i.jsxs("div", {
          className: "learn-content",
          children: [i.jsx("div", {
            className: "evolution-kicker",
            children: "HUMAN DEVELOPMENT · THEN TO NOW"
          }), i.jsx("h3", {
            children: "How survival became social"
          }), i.jsx("p", {
            children: "One simplified perspective on protection and social comparison, not a proven sequence or an explanation of every person’s experience."
          }), i.jsx("div", {
            className: "evolution-model",
            role: "group",
            "aria-label": "Eight-stage conceptual evolutionary model",
            style: {
              "--evolution-progress": T / 7
            },
            children: vN.map((E, A) => i.jsxs("button", {
              "aria-pressed": T === A,
              className: T === A ? "selected" : A < T ? "passed" : "",
              onClick: () => {
                ae(A), ge.cue();
              },
              children: [i.jsx("span", {
                className: "evolution-node",
                children: String(A + 1).padStart(2, "0")
              }), i.jsxs("span", {
                className: "evolution-copy",
                children: [i.jsx("small", {
                  children: E.label
                }), i.jsx("strong", {
                  children: E.title
                }), T === A && i.jsx("em", {
                  children: E.text
                })]
              }), i.jsx(li, {
                size: 16
              })]
            }, E.label))
          }), i.jsxs("div", {
            className: "evolution-result",
            children: [i.jsx("small", {
              children: "THE MODERN RESULT"
            }), i.jsx("strong", {
              children: "Comparison can affect how some people feel about themselves."
            }), i.jsx("p", {
              children: "A value that cannot be objectively defined, reliably calculated or permanently secured."
            })]
          }), i.jsx("p", {
            className: "fine-print",
            children: "This is a simplified conceptual model, not a complete history of evolution or a diagnosis of why you feel something."
          }), i.jsx("h3", {
            children: "The practical framework"
          }), i.jsx("p", {
            children: "Pattern: name what you want, then examine the block, fear and two possible futures. Direction: understand the protective response and choose your values. Action: use a coping tool, plan one workable step, then review and adjust."
          }), i.jsx("p", {
            children: "Prediction Lab uses the established idea of a behavioural experiment. The feature is new to this version; the psychological method is not new."
          }), i.jsxs("a", {
            href: "https://www.cci.health.wa.gov.au/Resources/Looking-After-Yourself/Anxiety",
            target: "_blank",
            rel: "noopener noreferrer",
            children: ["Centre for Clinical Interventions · Anxiety resources", " ", i.jsx(tt, {
              size: 14
            })]
          }), i.jsxs("a", {
            href: "https://www.who.int/publications/i/item/9789240003927",
            target: "_blank",
            rel: "noopener noreferrer",
            children: ["WHO · Doing What Matters in Times of Stress", " ", i.jsx(tt, {
              size: 14
            })]
          }), i.jsx("p", {
            className: "fine-print",
            children: "Original app wording, with artwork from the supplied design references. These resources inform the approach; they do not constitute endorsement or validation of this app."
          })]
        }), a === "outcome" && i.jsx(SequentialQuestions,{
          id:"outcome",current:e.resume.question,onCurrent:question=>t(book=>({...book,resume:{...book.resume,question}})),optionalStart:1,onDone:Xx,doneLabel:"Save this observation",blocked:d||e.entries.length>=200,
          steps:[{id:"observed",title:"What did you observe?",hint:`The step you tried: ${re.action}. Include anything difficult or unresolved.`,valid:!!re.observed.trim(),field:i.jsx(Ye,{required:true,questionId:"screen-title",label:"What did I observe?",value:re.observed,onChange:observed=>Ne(previous=>({...previous,observed}))})},
          {id:"result",title:"How did it compare with your expectation?",field:i.jsx(Kx,{label:"How the outcome compared",options:Object.values(ms),value:ms[re.result],onChange:value=>Ne(previous=>({...previous,result:Object.keys(ms).find(key=>ms[key]===value)}))})},
          ...[["actualDiscomfort","How much discomfort did you experience?",10],["afterLikelihood","How likely does your prediction feel now?",100],["goalStateAfter","How able do you feel to take this step?",10]].map(([key,title,max])=>({id:key,title,field:i.jsx(aa,{label:title,value:re[key],max,suffix:max===10?" / 10":"%",onChange:value=>Ne(previous=>({...previous,[key]:value}))})})),
          ...[["learned","What did you learn?"],["next","What would you keep or change next time?"]].map(([key,title])=>({id:key,title,field:i.jsx(Ye,{questionId:"screen-title",label:title,value:re[key],onChange:value=>Ne(previous=>({...previous,[key]:value}))})}))]

        })]
      })
    }), i.jsx($E, {
      open: g !== null,
      onOpenChange: E => {
        E || (v(null), S(null));
      },
      children: i.jsxs(BE, {
        children: [i.jsx(HE, {
          children: g === "delete" ? "Delete your saved book?" : g === "newDirection" ? "Start a new direction?" : "Explore a new direction?"
        }), i.jsx(GE, {
          children: g === "delete" ? "This permanently removes your book from this browser on this device. Downloaded copies are not deleted. Export a copy first if you want to keep them." : "Your current words will be kept as a chapter in your book. Your earlier chapters and observations stay saved while you explore a new direction."
        }), i.jsxs(UE, {
          children: [i.jsx(KE, {
            children: g === "delete" ? "Keep my book" : "Keep my current direction"
          }), i.jsx(YE, {
            onClick: () => {
              g === "delete" ? Jx() : g === "newDirection" && b ? (Ef(b, !0), S(null), v(null)) : ew();
            },
            children: g === "delete" ? "Delete my book" : "Start a new direction"
          })]
        })]
      })
    })]
  });
}
ov(document.getElementById("root")).render(i.jsx(h.StrictMode, {
  children: i.jsx(SN, {})
}));