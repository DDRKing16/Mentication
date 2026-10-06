var Qu = [
  {q:"What did you notice while looking at the screen?",a:["A colour or shape", "Nothing stood out", "I'd rather skip"],v:["That is something you noticed.", "Not noticing a change is okay.", "You can leave this unanswered."]},
  {q:"How demanding did the activities feel?",a:["Manageable", "Too demanding", "Not sure"],v:["You can keep your own pace.", "An easier option or stopping is available.", "You do not need to decide."]},
  {q:"Would looking around your room feel useful?",a:["I'll notice one nearby object", "I'd prefer to stay here", "Skip"],v:["Take a moment if you want.", "That choice is yours.", "No need to do every step."]},
  {q:"What would suit you after this?",a:["Rest for a moment", "Talk to someone I trust", "Choose later"],v:["Rest is an option.", "You can ask for company or support.", "You can choose later."]},
  {q:"Ready to check how you feel?",a:["Yes", "I'm not sure", "I'd rather skip the reflection"],v:["Answer honestly; there is no target score.", "Uncertainty is a valid response.", "You can skip any rating."]}
],
  Jt = ["BREATHE", "PRESENT", "BALANCE", "ANCHORS", "RECOVER", "HOLDING", "RETURNS", "GROUNDS", "CALMING", "STABLES", "UNWINDS", "RELAXED"],
  Zv = [],
  Gv = [],
  Qa = [{
    id: 0,
    x: 64,
    y: 41,
    side: "left",
    label: "LUNA",
    kind: "moon"
  }, {
    id: 1,
    x: 70,
    y: 58,
    side: "left",
    label: "SATURN RINGS",
    kind: "rings"
  }, {
    id: 2,
    x: 54,
    y: 62,
    side: "left",
    label: "MARS ICE CAP",
    kind: "polar"
  }, {
    id: 3,
    x: 18,
    y: 20,
    side: "left",
    label: "COMET",
    kind: "comet"
  }, {
    id: 4,
    x: 48,
    y: 72,
    side: "left",
    label: "GREAT RED SPOT",
    kind: "spot"
  }, {
    id: 5,
    x: 84,
    y: 18,
    side: "right",
    label: "PLEIADES",
    kind: "stars"
  }, {
    id: 6,
    x: 42,
    y: 36,
    side: "left",
    label: "VENUS",
    kind: "venus"
  }, {
    id: 7,
    x: 50,
    y: 55,
    side: "left",
    label: "ASTEROID BELT",
    kind: "belt"
  }, {
    id: 8,
    x: 55,
    y: 48,
    side: "left",
    label: "SOLAR FLARE",
    kind: "flare"
  }, {
    id: 9,
    x: 88,
    y: 71,
    side: "right",
    label: "TRITON",
    kind: "neptune-moon"
  }];
function Rv({
  fullText: e,
  speed: n = 18
}) {
  let [t, r] = w.useState("");
  w.useEffect(() => {
    let u = 0;
    r("");
    let o = vectorClock.interval(() => {
      if (u++, r(e.slice(0, u)), u >= e.length) vectorClock.cancel(o);
    }, n);
    return () => vectorClock.cancel(o);
  }, [e, n]);
  let l = t.length >= e.length;
  return _("span", {
    children: [t, s("span", {
      style: {
        opacity: l ? 0 : 1,
        marginLeft: 2,
        borderLeft: "1px solid #143D2A",
        animation: "blink 0.9s step-end infinite"
      },
      children: " "
    })]
  });
}
function Jv({left:e}) {
  return s("span", {children:`DIFFERENCES LEFT: ${e}`});
}

function qv({
  side: e,
  found: n,
  layoutSeed: t,
  particles: r,
  wrongFlash: l
}) {
  let u = t * 2,
    o = e === "left" ? !0 : !1;
  return _("div", {
    className: "relative w-full h-full overflow-hidden",
    style: {
      background: "radial-gradient(420px 320px at 50% 50%, #132A20 0%, #0A1A14 55%, #060E0A 100%)"
    },
    children: [_("div", {
      className: "absolute inset-0",
      children: [Array.from({
        length: 42
      }).map((i, a) => {
        let f = (a * 37 + t * 13) % 100,
          y = (a * 61 + t * 7) % 100,
          g = a % 3 === 0 ? 1.6 : a % 2 === 0 ? 1.2 : 0.8;
        return s("div", {
          className: "absolute rounded-full",
          style: {
            left: `${f}%`,
            top: `${y}%`,
            width: g,
            height: g,
            background: a % 7 === 0 ? "#FFD93D" : "#E8F0F6",
            opacity: a % 5 === 0 ? 0.9 : 0.55,
            boxShadow: a % 7 === 0 ? "0 0 4px #FFD93D" : "none"
          }
        }, a);
      }), e === "right" && !n.has(5) && s("div", {
        className: "absolute",
        style: {
          left: "78%",
          top: "12%",
          width: 34,
          height: 18
        },
        children: Array.from({
          length: 6
        }).map((i, a) => s("div", {
          className: "absolute w-[2px] h-[2px] rounded-full bg-[#7FC8D6]",
          style: {
            left: `${a * 18 % 100}%`,
            top: `${a * 31 % 100}%`,
            boxShadow: "0 0 6px #7FC8D6",
            opacity: 0.9
          }
        }, a))
      })]
    }), s("div", {
      className: "absolute inset-[8%] rounded-full pointer-events-none",
      style: {
        border: "1px solid rgba(255,255,255,0.04)"
      }
    }), s("div", {
      className: "absolute inset-[18%] rounded-full pointer-events-none",
      style: {
        border: "1px solid rgba(255,255,255,0.05)"
      }
    }), s("div", {
      className: "absolute inset-[28%] rounded-full pointer-events-none",
      style: {
        border: "1px solid rgba(255,255,255,0.04)"
      }
    }), s("div", {
      className: "absolute inset-[38%] rounded-full pointer-events-none",
      style: {
        border: "1px dashed rgba(255,255,255,0.03)"
      }
    }), s("div", {
      className: "absolute rounded-full",
      style: {
        left: "50%",
        top: "50%",
        width: 28,
        height: 28,
        transform: "translate(-50%,-50%)",
        background: "radial-gradient(circle at 35% 35%, #FFF7A0 0%, #FFD93D 45%, #FF9D1C 100%)",
        boxShadow: "0 0 18px #FFD93D, 0 0 36px #FF9D1C55, inset 0 0 8px rgba(255,255,255,0.7)"
      },
      children: e === "left" && !n.has(8) && s("div", {
        className: "absolute w-[16px] h-[3px] rounded-full",
        style: {
          left: 14,
          top: -2,
          background: "linear-gradient(90deg, #FFD93D, #FF5A1F)",
          transform: "rotate(-28deg)",
          boxShadow: "0 0 8px #FF9D1C",
          opacity: 0.95
        }
      })
    }), s("div", {
      className: "absolute rounded-full",
      style: {
        left: `${36 + u}%`,
        top: `${32 - u * 0.5}%`,
        width: 5,
        height: 5,
        background: "#B6B6B6",
        boxShadow: "0 0 6px rgba(182,182,182,0.5)"
      }
    }), o && s("div", {
      className: "absolute rounded-full",
      style: {
        left: `${42 + u * 0.3}%`,
        top: `${36 + u * 0.2}%`,
        width: 8,
        height: 8,
        background: "radial-gradient(circle at 30% 30%, #F5E6C8, #E6C9A8)",
        boxShadow: "0 0 8px rgba(230,201,168,0.5)"
      }
    }), _("div", {
      className: "absolute",
      style: {
        left: `${60 - u * 0.4}%`,
        top: `${44 + u * 0.3}%`
      },
      children: [s("div", {
        className: "rounded-full",
        style: {
          width: 9,
          height: 9,
          background: "radial-gradient(circle at 30% 30%, #8AB4FF, #2A5DB0)",
          boxShadow: "0 0 8px rgba(74,144,217,0.6)"
        }
      }), e === "left" && !n.has(0) && s("div", {
        className: "absolute rounded-full",
        style: {
          left: 11,
          top: -2,
          width: 3,
          height: 3,
          background: "#E8E8E8",
          boxShadow: "0 0 4px rgba(255,255,255,0.7)"
        }
      })]
    }), _("div", {
      className: "absolute",
      style: {
        left: `${54 + u * 0.2}%`,
        top: `${62 - u * 0.3}%`
      },
      children: [s("div", {
        className: "rounded-full",
        style: {
          width: 7,
          height: 7,
          background: "#C1440E",
          boxShadow: "0 0 7px rgba(193,68,14,0.5)"
        }
      }), e === "left" && !n.has(2) && s("div", {
        className: "absolute rounded-full",
        style: {
          left: 1,
          top: 0,
          width: 2.5,
          height: 2.5,
          background: "rgba(255,255,255,0.9)",
          boxShadow: "0 0 4px white"
        }
      })]
    }), _("div", {
      className: "absolute",
      style: {
        left: `${46 - u * 0.2}%`,
        top: `${72 + u * 0.2}%`
      },
      children: [s("div", {
        className: "rounded-full",
        style: {
          width: 14,
          height: 14,
          background: "radial-gradient(circle at 30% 30%, #EADDC0, #C9A86A)",
          boxShadow: "0 0 10px rgba(201,168,106,0.4)"
        }
      }), e === "left" && !n.has(4) && s("div", {
        className: "absolute rounded-full",
        style: {
          left: 3,
          top: 4,
          width: 4,
          height: 2.5,
          background: "#A8322E",
          borderRadius: "60% 40%",
          boxShadow: "0 0 4px #A8322E"
        }
      })]
    }), _("div", {
      className: "absolute",
      style: {
        left: `${70 + u * 0.3}%`,
        top: `${58 - u * 0.2}%`
      },
      children: [s("div", {
        className: "rounded-full",
        style: {
          width: 12,
          height: 12,
          background: "#EAD6A6",
          boxShadow: "0 0 10px rgba(234,214,166,0.4)"
        }
      }), e === "left" && !n.has(1) && s("div", {
        className: "absolute rounded-full",
        style: {
          left: -4,
          top: 4,
          width: 20,
          height: 5,
          border: "1.5px solid rgba(234,214,166,0.85)",
          transform: "rotate(-18deg)",
          boxShadow: "0 0 6px rgba(234,214,166,0.5)"
        }
      })]
    }), s("div", {
      className: "absolute rounded-full",
      style: {
        left: `${78 - u * 0.3}%`,
        top: `${40 + u * 0.2}%`,
        width: 10,
        height: 10,
        background: "radial-gradient(circle, #A7E1E8, #5FAFB8)",
        boxShadow: "0 0 8px rgba(127,200,214,0.4)"
      }
    }), _("div", {
      className: "absolute",
      style: {
        left: `${84 - u * 0.4}%`,
        top: `${68 + u * 0.1}%`
      },
      children: [s("div", {
        className: "rounded-full",
        style: {
          width: 10,
          height: 10,
          background: "radial-gradient(circle at 30% 30%, #6A8CFF, #2A4CB0)",
          boxShadow: "0 0 8px rgba(58,95,205,0.5)"
        }
      }), e === "right" && !n.has(9) && s("div", {
        className: "absolute rounded-full",
        style: {
          left: 11,
          top: 1,
          width: 2.5,
          height: 2.5,
          background: "#D6E4FF",
          boxShadow: "0 0 4px #D6E4FF"
        }
      })]
    }), e === "left" && !n.has(3) && _("div", {
      className: "absolute",
      style: {
        left: "16%",
        top: "18%"
      },
      children: [s("div", {
        className: "w-[4px] h-[4px] rounded-full bg-[#E8F0F6]",
        style: {
          boxShadow: "0 0 6px white"
        }
      }), s("div", {
        className: "absolute left-[2px] top-[2px] w-[18px] h-[1px] bg-gradient-to-r from-white/80 to-transparent",
        style: {
          transform: "rotate(32deg)",
          transformOrigin: "left"
        }
      })]
    }), e === "left" && !n.has(7) && s("div", {
      className: "absolute inset-0 pointer-events-none",
      children: Array.from({
        length: 10
      }).map((i, a) => s("div", {
        className: "absolute w-[1.5px] h-[1.5px] rounded-full bg-[#8A7F6A]",
        style: {
          left: `${44 + a * 1.6}%`,
          top: `${54 + Math.sin(a) * 3}%`,
          opacity: 0.7
        }
      }, a))
    }), Qa.map(i => {
      if (!n.has(i.id)) return null;
      if (i.side !== e) {
        if (i.kind === "venus" && e === "right") return _("div", {
          className: "absolute",
          style: {
            left: `${i.x}%`,
            top: `${i.y}%`,
            transform: "translate(-50%,-50%)"
          },
          children: [s("div", {
            className: "w-[22px] h-[22px] rounded-full",
            style: {
              border: "2px dashed rgba(255,100,100,0.7)",
              background: "rgba(255,80,80,0.12)"
            }
          }), s("div", {
            className: "absolute left-1/2 top-1/2 w-[10px] h-[1.5px] bg-[#FF6B6B] rotate-45 -translate-x-1/2 -translate-y-1/2"
          }), s("div", {
            className: "absolute left-1/2 top-1/2 w-[10px] h-[1.5px] bg-[#FF6B6B] -rotate-45 -translate-x-1/2 -translate-y-1/2"
          })]
        }, `found-${i.id}-${e}`);
        return null;
      }
      return _("div", {
        className: "absolute",
        style: {
          left: `${i.x}%`,
          top: `${i.y}%`,
          transform: "translate(-50%,-50%)",
          animation: "spotFoundPop 0.42s cubic-bezier(.16,1,.3,1)"
        },
        children: [s("div", {
          className: "w-[26px] h-[26px] rounded-full",
          style: {
            border: "2px solid #00FF88",
            boxShadow: "0 0 12px #00FF88, inset 0 0 6px rgba(0,255,136,0.2)"
          }
        }), s("div", {
          className: "absolute left-1/2 top-1/2 w-[26px] h-[26px] rounded-full",
          style: {
            border: "1px solid rgba(0,255,136,0.7)",
            transform: "translate(-50%,-50%)",
            animation: "spotPing 1s ease-out infinite"
          }
        })]
      }, `found-${i.id}`);
    }), r.map(i => s("div", {
      className: "absolute w-1 h-1 rounded-full pointer-events-none",
      style: {
        left: `${i.x}%`,
        top: `${i.y}%`,
        background: i.color,
        boxShadow: `0 0 8px ${i.color}`,
        animation: "floatUp 0.9s ease-out forwards"
      }
    }, i.id)), l && s("div", {
      className: "absolute w-5 h-5 rounded-full pointer-events-none",
      style: {
        left: `${l.x}%`,
        top: `${l.y}%`,
        transform: "translate(-50%,-50%)",
        background: "rgba(255,80,80,0.22)",
        border: "1.5px solid rgba(255,80,80,0.55)",
        boxShadow: "0 0 12px rgba(255,80,80,0.5)",
        animation: "shakeX 0.22s ease-in-out 2"
      }
    }), s("div", {
      className: "absolute left-2 top-2 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-[0.12em] bg-black/60 text-white/70 border border-white/10",
      style: {
        fontFamily: "'JetBrains Mono', monospace"
      },
      children: e.toUpperCase()
    })]
  });
}
function Aa() {
  const [saved] = w.useState(readVectorProgress);
  const [progressSaved,setProgressSaved] = w.useState(true);
  const [paused,setPaused] = w.useState(Boolean(saved && saved.e > 1));
  const [stopped,setStopped] = w.useState(false);
  const [easy,setEasy] = w.useState(saved?.easy || false);
  const [helpfulness,setHelpfulness] = w.useState(saved?.helpfulness || null);
  const [skipped,setSkipped] = w.useState(saved?.skipped || []);
  const [exitReason,setExitReason] = w.useState(saved?.exitReason || "completed");
  const sent = w.useRef(false);
  const stageRef = w.useRef(saved?.e || 1);
  let [e, setStage] = w.useState(saved?.e || 1);
  const n = (next) => { vectorClock.clear(); stageRef.current=next; ao(null); co(""); if(next!==2)qt(false); if(next===4)ju(false); setStage(next); };
  const finish = () => {if(sent.current)return;sent.current=true;
    window.parent.postMessage({type:"vector-shift:complete",sessionId:vectorSession,helpfulness,
      exitReason,outcome:{skippedStages:skipped,easierMode:easy,gameplayOnly:true}},location.origin);
    if(window.parent===window)sent.current=false;
  };
  let
    [t, r] = w.useState(!0),
    l = w.useRef(null),
    u = w.useCallback(() => {
      if (new URLSearchParams(location.search).get("audio")==="off") return null;
      if (!l.current) l.current = new (window.AudioContext || window.webkitAudioContext)();
      if (l.current.state === "suspended") l.current.resume();
      try {
        if (navigator.audioSession) navigator.audioSession.type = "playback";
      } catch {}
      return l.current;
    }, []),
    o = w.useCallback((p = 1200, v = 0.35, k = 1800) => {
      let C = u();
      if (!C) return;
      let O = C.currentTime,
        U = (le, j = 0) => {
          let A = C.createOscillator(),
            H = C.createGain();
          A.type = "sine", A.frequency.value = le, A.connect(H), H.connect(C.destination), H.gain.setValueAtTime(0.0001, O + j), H.gain.exponentialRampToValueAtTime(v, O + j + 0.01), H.gain.exponentialRampToValueAtTime(0.0001, O + j + 0.6), A.start(O + j), A.stop(O + j + 0.65);
        };
      if (U(p, 0), k) U(k, 0.08);
    }, [u]),
    i = w.useCallback((p = 180) => {
      let v = u();
      if (!v) return;
      let k = v.currentTime,
        C = v.createOscillator(),
        O = v.createGain();
      C.type = "sine", C.frequency.value = p, C.connect(O), O.connect(v.destination), O.gain.setValueAtTime(0.22, k), O.gain.exponentialRampToValueAtTime(0.0001, k + 0.25), C.start(k), C.stop(k + 0.28);
    }, [u]),
    a = w.useRef(null),
    f = w.useRef(0),
    y = w.useRef({
      x: 180,
      y: 180
    }),
    g = w.useRef({
      x: 180,
      y: 180
    }),
    h = w.useRef({
      x: 180,
      y: 180
    }),
    z = w.useRef(!1),
    N = w.useRef(0),
    L = w.useRef(0),
    K = w.useRef(0),
    d = w.useRef(0),
    c = w.useRef(0),
    m = w.useRef(0),
    E = w.useRef(0),
    T = w.useRef(0),
    I = w.useRef(0),
    [M, D] = w.useState(0),
    [ee, $] = w.useState(0),
    [ae, el] = w.useState(!1),
    [ge, Ba] = w.useState(!1),
    [Au, Bu] = w.useState(0),
    [Rd, ft] = w.useState([]),
    [Jd, Wu] = w.useState([]),
    [xd, Ku] = w.useState([]),
    [qd, Yu] = w.useState([]),
    [nl, jd] = w.useState({
      x: 180,
      y: 180
    }),
    [tl, bd] = w.useState({
      x: 180,
      y: 180
    }),
    [Wa, Xu] = w.useState(!1),
    [ep, Hu] = w.useState(!1),
    [Zu, rl] = w.useState([]),
    [Xn, xt] = w.useState(null),
    ll = w.useRef(new Set()),
    [Ye, qt] = w.useState(!1),
    [jv, Gu] = w.useState(!1),
    bv = 18,
    e1 = 15,
    [np, Ka] = w.useState(saved?.np || [{
      x: 9,
      y: 9
    }, {
      x: 8,
      y: 9
    }, {
      x: 7,
      y: 9
    }]),
    [jt, Ya] = w.useState(saved?.jt || {
      x: 14,
      y: 9
    }),
    dt = w.useRef(saved?.direction || {x:1,y:0}),
    Sn = w.useRef(saved?.direction || {x:1,y:0}),
    [$e, Xa] = w.useState(saved?.score || 0),
    [Ha, Za] = w.useState(!1),
    [tp, Ga] = w.useState([]),
    [Ru, Ra] = w.useState(!1),
    Ju = w.useRef(null),
    bt = w.useRef(null),
    Ja = w.useRef(""),
    ul = w.useCallback(() => {
      let p = Jt[Math.floor(Math.random() * Jt.length)],
        v = 0;
      while (p === Ja.current && v < 10) p = Jt[Math.floor(Math.random() * Jt.length)], v++;
      return Ja.current = p, p;
    }, []),
    [be, xa] = w.useState(() => saved?.be || Jt[Math.floor(Math.random() * Jt.length)]),
    [en, ol] = w.useState(new Set(saved?.en || [])),
    [xu, er] = w.useState(saved?.xu || 0),
    [rp, pt] = w.useState([]),
    [qu, mt] = w.useState(""),
    [il, ju] = w.useState(!1),
    [lp, bu] = w.useState(null),
    [up, al] = w.useState([]),
    [eo, no] = w.useState(saved?.eo || 0),
    [op, to] = w.useState(null),
    [ro, lo] = w.useState(!1),
    [Hn, uo] = w.useState(new Set(saved?.Hn || [])),
    [ip, cl] = w.useState([]),
    [ap, sl] = w.useState(null),
    [Zn, oo] = w.useState(!1),
    [qa, vt] = w.useState(""),
    [cp, ja] = w.useState(saved?.cp || 0),
    [sp, io] = w.useState(0),
    [nn, ba] = w.useState(saved?.nn || 0),
    [fl, ao] = w.useState(null),
    [ec, co] = w.useState(""),
    sn = 1.1;
  if (e === 1) sn = 1.1;else if (e === 2) {
    if (Ye) sn = 1;else sn = 0.38 + M / 100 * 0.4;
  } else if (e === 3) sn = 0.78 + $e / 15 * 0.18;else if (e === 4) sn = 0.96 + xu / 100 * 0.06;else if (e === 5) sn = 1.02 + Hn.size / 10 * 0.06;else if (e === 6) sn = 1.08 + nn / 5 * 0.04;else if (e === 7) sn = 1.15;
  let nr = Math.max(0, Math.min(1.2, sn)),
    dl = 0,
    so = 1.15,
    fo = 0,
    po = 1.08;
  if (e === 1) dl = 0, so = 1.15, fo = 0, po = 1.08;else so = 0.58 + nr * 0.45, fo = (1 - nr) * 5.5, dl = (1 - nr) * 0.42, po = 0.82 + nr * 0.3;
  let pl = w.useCallback(() => {
      Ka([{
        x: 9,
        y: 9
      }, {
        x: 8,
        y: 9
      }, {
        x: 7,
        y: 9
      }]), dt.current = {
        x: 1,
        y: 0
      }, Sn.current = {
        x: 1,
        y: 0
      }, Ya({
        x: Math.floor(Math.random() * 18),
        y: Math.floor(Math.random() * 18)
      }), Xa(0), ba(0), ao(null), co(""), rl([]), xt(null), ll.current = new Set(), qt(!1), Gu(!1);
      let p = ul();
      xa(p), ol(new Set()), er(0), pt([]), mt(""), ju(!1), al([]), no(0), lo(!1), uo(new Set()), oo(!1), cl([]), sl(null), vt(""), ja(Math.floor(Math.random() * 3)), io(0);
    }, [ul]),
    ml = w.useCallback(() => {
      let p = ul();
      xa(p), ol(new Set()), er(0), pt([]), mt(""), ju(!1), al([]), bu(null), no(0), lo(!1), to(null);
    }, [ul]),
    vl = w.useCallback(() => {
      uo(new Set()), oo(!1), cl([]), sl(null), vt(""), ja(Math.floor(Math.random() * 3)), io(0);
    }, []),
    nc = w.useCallback(p => {
      let v;
      do v = {
        x: Math.floor(Math.random() * 18),
        y: Math.floor(Math.random() * 18)
      }; while (p.some(k => k.x === v.x && k.y === v.y));
      Ya(v);
    }, []),
    mo = w.useCallback(p => {
      let v = [{
          pos: 0,
          r: 255,
          g: 157,
          b: 28
        }, {
          pos: 0.25,
          r: 255,
          g: 217,
          b: 61
        }, {
          pos: 0.5,
          r: 124,
          g: 255,
          b: 94
        }, {
          pos: 0.75,
          r: 94,
          g: 225,
          b: 255
        }, {
          pos: 1,
          r: 0,
          g: 255,
          b: 136
        }],
        k = v[0],
        C = v[v.length - 1];
      for (let H = 0; H < v.length - 1; H++) if (p >= v[H].pos && p <= v[H + 1].pos) {
        k = v[H], C = v[H + 1];
        break;
      }
      let O = C.pos - k.pos || 1,
        U = (p - k.pos) / O,
        le = Math.round(k.r + (C.r - k.r) * U),
        j = Math.round(k.g + (C.g - k.g) * U),
        A = Math.round(k.b + (C.b - k.b) * U);
      return `rgb(${le},${j},${A})`;
    }, []);
  w.useEffect(()=>{if(l.current){if(paused||stopped)l.current.suspend();else l.current.resume().catch(()=>{})}},[paused,stopped]);
  // Keep the secure host pause contract in editable source, so rebuilds retain it.
  w.useEffect(() => {
    const receive = async event => {
      if (event.origin !== location.origin || event.source !== window.parent || event.data?.type !== 'mentication:pause-for-alternative' || typeof event.data.requestId !== 'string') return;
      vectorClock.paused = true;
      setPaused(true);
      try {
        await l.current?.suspend();
        window.parent.postMessage({type:'mentication:alternative-ready',requestId:event.data.requestId},location.origin);
      } catch { /* No acknowledgement if audio could not be paused. The host retains its retry/exit controls. */ }
    };
    window.addEventListener('message',receive);
    return ()=>window.removeEventListener('message',receive);
  },[]);
  vectorClock.paused = paused || stopped;
  document.documentElement.classList.toggle("vs-paused", paused || stopped);
  const progress = {e,easy,helpfulness,skipped,exitReason,np,jt,score:$e,be,en:[...en],Hn:[...Hn],nn,cp,xu,eo,direction:Sn.current,align:M,hold:ee};
  const progressRef = w.useRef(progress); progressRef.current=progress;
  w.useEffect(()=>{const save=()=>{setProgressSaved(saveVectorProgress(progressRef.current))};
    save();const timer=window.setInterval(save,500);window.addEventListener("pagehide",save);
    return()=>{save();window.clearInterval(timer);window.removeEventListener("pagehide",save)};
  },[]);
  const retryProgress=()=>setProgressSaved(saveVectorProgress(progressRef.current));
  w.useEffect(()=>{document.querySelector(".vs-stage")?.focus();window.scrollTo(0,0)},[e]);

  w.useEffect(() => {
    if (e !== 2) return;
    if (Ye) return;
    r(!0);
    let p = vectorClock.timeout(() => r(!1), 2600);
    N.current = saved?.e===2 ? saved.align || 0 : 0, L.current = saved?.e===2 ? saved.hold || 0 : 0, T.current = 0, I.current = vectorClock.now(), y.current = {
      x: 180,
      y: 180
    }, h.current = {
      x: 180,
      y: 180
    }, g.current = {
      x: 180,
      y: 180
    }, K.current = 0, d.current = 0, c.current = 0, m.current = 0, E.current = 0, D(N.current), $(L.current), el(!1), Ba(!1), Bu(0), ft([]), Wu([]), Ku([]), Yu([{
      id: Date.now(),
      x: 100 + Math.random() * 160,
      y: 100 + Math.random() * 160
    }]), Xu(!1), Hu(!1), rl([]), xt(null), ll.current = new Set(), qt(!1);
    let v = 0,
      k = {
        current: 0
      },
      C = O => {
        let U = (O - I.current) / 1000;
        T.current = U;
        let le = 180 + Math.sin(U * 0.7) * 40 + Math.cos(U * 0.35) * 12,
          j = 180 + Math.cos(U * 0.55) * 40 + Math.sin(U * 0.9) * 10;
        g.current.x += (le - g.current.x) * 0.05, g.current.y += (j - g.current.y) * 0.05, h.current.x += (y.current.x - h.current.x) * 0.35, h.current.y += (y.current.y - h.current.y) * 0.35;
        let A = h.current.x - g.current.x,
          H = h.current.y - g.current.y,
          ce = Math.sqrt(A * A + H * H),
          _e = ce < 52,
          Te = ce < 20;
        if (Te) N.current = Math.min(100, N.current + 0.75), L.current += 0.016666666666666666;else if (_e) N.current = Math.min(100, N.current + 0.18), L.current += 0.016666666666666666;else N.current = Math.max(0, N.current - 0.04), L.current = Math.max(0, L.current - 0.01);
        if (Zv.forEach(Q => {
          if (N.current >= Q.thr && !ll.current.has(Q.thr)) ll.current.add(Q.thr), rl(F => [...F, {
            id: `${Q.thr}-${Date.now()}`,
            thr: Q.thr,
            num: Q.num,
            label: Q.label,
            text: Q.text,
            isFindings: Q.isFindings
          }]);
        }), U > 90 && N.current < 10) N.current = 100;
        if (N.current >= 100 || L.current >= 24) {
          let Q = [];
          for (let F = 0; F < 24; F++) {
            let ue = F / 24 * Math.PI * 2;
            Q.push({
              id: k.current++,
              x: h.current.x,
              y: h.current.y,
              vx: Math.cos(ue) * (3 + Math.random() * 4),
              vy: Math.sin(ue) * (3 + Math.random() * 4),
              life: 1
            });
          }
          ft(F => [...F, ...Q]);
          try {
            navigator.vibrate?.(60);
          } catch {}
          o(1400, 0.4, 2100), qt(!0);
          return;
        }
        if (_e) {
          if (Math.random() < 0.45) ft(F => [...F.slice(-40), {
            id: k.current++,
            x: h.current.x + (Math.random() - 0.5) * 10,
            y: h.current.y + (Math.random() - 0.5) * 10,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5 - 0.5,
            life: 1
          }]);
          let Q = vectorClock.now();
          if (Q - K.current > 700) o(1200 + N.current * 3.5, 0.32, 1800 + N.current * 2), K.current = Q;
          if (Q - d.current > 1100) {
            try {
              navigator.vibrate?.(12);
            } catch {}
            d.current = Q;
          }
          if (Q - c.current > 550) Bu(F => F + (Te ? 2 : 1)), c.current = Q;
          if (Q - m.current > 1200) {
            let F = Date.now() + Math.random();
            Wu(ue => [...ue.slice(-6), {
              id: F,
              x: h.current.x,
              y: h.current.y - 20
            }]), vectorClock.timeout(() => Wu(ue => ue.filter(fn => fn.id !== F)), 900), m.current = Q;
          }
          if (Te && Q - E.current > 700) {
            o(1400, 0.36, 0), vectorClock.timeout(() => o(1800, 0.34, 0), 80), vectorClock.timeout(() => o(2200, 0.32, 0), 160);
            let F = [];
            for (let Me = 0; Me < 18; Me++) {
              let tn = Me / 18 * Math.PI * 2;
              F.push({
                id: k.current++,
                x: h.current.x,
                y: h.current.y,
                vx: Math.cos(tn) * (2.5 + Math.random() * 3.5),
                vy: Math.sin(tn) * (2.5 + Math.random() * 3.5),
                life: 1,
                color: Me % 2 === 0 ? "#A855F7" : "#FF5CA1"
              });
            }
            ft(Me => [...Me.slice(-50), ...F]);
            let ue = ["VECTOR CLEARED", "BULLSEYE +15", "STAGE CLEARED"],
              fn = ue[Math.floor(Math.random() * ue.length)],
              tr = Date.now() + Math.random();
            Ku(Me => [...Me.slice(-3), {
              id: tr,
              text: fn
            }]), vectorClock.timeout(() => Ku(Me => Me.filter(tn => tn.id !== tr)), 900), Xu(!0), vectorClock.timeout(() => Xu(!1), 200);
            try {
              navigator.vibrate?.([20, 30, 20]);
            } catch {}
            Hu(!0), vectorClock.timeout(() => Hu(!1), 700), E.current = Q;
          }
        } else if (vectorClock.now() - c.current > 900) Bu(0);
        if (v += 0.016666666666666666, v > 5) v = 0, Yu(Q => [...Q.slice(-3), {
          id: Date.now() + Math.random(),
          x: 40 + Math.random() * 280,
          y: 40 + Math.random() * 280
        }]);
        Yu(Q => {
          let F = [];
          for (let ue of Q) {
            let fn = h.current.x - ue.x,
              tr = h.current.y - ue.y;
            if (Math.sqrt(fn * fn + tr * tr) < 30) {
              N.current = Math.min(100, N.current + 8);
              let Me = [];
              for (let tn = 0; tn < 12; tn++) {
                let uc = tn / 12 * Math.PI * 2;
                Me.push({
                  id: k.current++,
                  x: ue.x,
                  y: ue.y,
                  vx: Math.cos(uc) * 3,
                  vy: Math.sin(uc) * 3,
                  life: 1
                });
              }
              ft(tn => [...tn.slice(-30), ...Me]), o(1600, 0.38, 2400), o(2000, 0.28, 2600);
            } else F.push(ue);
          }
          return F;
        }), D(N.current), $(L.current), el(_e), Ba(Te), jd({
          ...h.current
        }), bd({
          ...g.current
        }), ft(Q => Q.map(F => ({
          ...F,
          x: F.x + F.vx,
          y: F.y + F.vy,
          life: F.life - 0.02,
          vy: F.vy + 0.06,
          vx: F.vx * 0.99
        })).filter(F => F.life > 0).slice(-80)), f.current = vectorClock.frame(C);
      };
    return f.current = vectorClock.frame(C), () => {
      vectorClock.cancel(f.current), vectorClock.cancel(p);
    };
  }, [e, o, Ye]), w.useEffect(() => {
    if (Xn) return;
    if (Zu.length === 0) return;
    let p = Zu[0];
    xt(p), rl(O => O.slice(1));
    let v = p.isFindings,
      C = vectorClock.timeout(() => {
        if (xt(null), v) Gu(!0);
      }, v ? 6200 : 2800);
    return () => vectorClock.cancel(C);
  }, [Zu, Xn]), w.useEffect(() => {
    if (!Ye) return;
    let p = vectorClock.timeout(() => {
      qt(!1), n(3);
    }, 4000);
    return () => vectorClock.cancel(p);
  }, [Ye]);
  let ht = w.useCallback(p => {
      if (!a.current) return;
      let v = a.current.getBoundingClientRect(),
        k,
        C;
      if ("touches" in p && p.touches[0]) k = p.touches[0].clientX, C = p.touches[0].clientY;else if ("clientX" in p) k = p.clientX, C = p.clientY;else return;
      let O = k - v.left,
        U = C - v.top;
      O = Math.max(11, Math.min(349, O)), U = Math.max(11, Math.min(349, U)), y.current = {
        x: O,
        y: U
      };
    }, []),
    fp = w.useCallback(p => {
      u(), z.current = !0, p.target.setPointerCapture?.(p.pointerId), ht(p);
    }, [u, ht]),
    dp = w.useCallback(p => {
      if (!z.current) return;
      ht(p);
    }, [ht]),
    tc = w.useCallback(p => {
      z.current = !1;
      try {
        p.target.releasePointerCapture?.(p.pointerId);
      } catch {}
    }, []);
  w.useEffect(() => {
    if (e !== 3) return;
    let p = Math.max(75, 135 - $e * 3);
    return Ju.current = vectorClock.interval(() => {
      if (easy) return;
      dt.current = Sn.current, Ka(v => {
        let k = v[0],
          C = k.x + dt.current.x,
          O = k.y + dt.current.y;
        if (C < 0) C = 17;
        if (C >= 18) C = 0;
        if (O < 0) O = 17;
        if (O >= 18) O = 0;
        if (v.some(j => j.x === C && j.y === O)) {
          Za(!0);
          try {
            navigator.vibrate?.(40);
          } catch {}
          return vectorClock.timeout(() => Za(!1), 400), v;
        }
        let U = {
          x: C,
          y: O
        };
        if (U.x === jt.x && U.y === jt.y) {
          Xa(A => {
            let H = A + 1;
            if (H >= 15) vectorClock.timeout(() => {
              ml(), n(4);
            }, 800);
            return H;
          }), nc([U, ...v]), o(600 + $e * 40, 0.35, 0);
          let j = [];
          for (let A = 0; A < 10; A++) j.push({
            id: Date.now() + A + Math.random(),
            x: U.x,
            y: U.y,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2
          });
          Ga(A => [...A.slice(-20), ...j]), vectorClock.timeout(() => Ga(A => A.slice(10)), 600), Ra(!0), vectorClock.timeout(() => Ra(!1), 180);
          try {
            navigator.vibrate?.(25);
          } catch {}
          return [U, ...v];
        } else return [U, ...v.slice(0, -1)];
      });
    }, p), () => {
      if (Ju.current) vectorClock.cancel(Ju.current);
    };
  }, [e, $e, jt, nc, o, ml, easy]), w.useEffect(() => {
    let p = v => {
      if(vectorClock.paused || stageRef.current!==3)return;
      if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(v.key))v.preventDefault();
      let k = v.key.toLowerCase(),
        C = dt.current;
      if ((k === "arrowup" || k === "w") && C.y === 0) Sn.current = {
        x: 0,
        y: -1
      };
      if ((k === "arrowdown" || k === "s") && C.y === 0) Sn.current = {
        x: 0,
        y: 1
      };
      if ((k === "arrowleft" || k === "a") && C.x === 0) Sn.current = {
        x: -1,
        y: 0
      };
      if ((k === "arrowright" || k === "d") && C.x === 0) Sn.current = {
        x: 1,
        y: 0
      };
    };
    return window.addEventListener("keydown", p), () => window.removeEventListener("keydown", p);
  }, []);
  let yt = (p, v) => {
      let k = dt.current;
      if (p !== 0 && k.x === 0) Sn.current = {
        x: p,
        y: v
      };
      if (v !== 0 && k.y === 0) Sn.current = {
        x: p,
        y: v
      };
    },
    pp = p => {
      if (en.has(p) || il) return;
      u();
      let v = new Set(en);
      if (v.add(p), ol(v), be.includes(p)) {
        o(1100 + Math.random() * 300, 0.38, 0), er(U => Math.min(100, U + 12));
        let C = Date.now() + Math.random();
        pt(U => [...U.slice(-5), {
          id: C,
          text: "CORRECT +12%",
          x: 50,
          y: 40,
          color: "#00FF88"
        }]), vectorClock.timeout(() => pt(U => U.filter(le => le.id !== C)), 800);
        let O = Date.now() + Math.random();
        al(U => [...U.slice(-6), {
          x: 50 + Math.random() * 10,
          y: 30,
          id: O
        }]), vectorClock.timeout(() => al(U => U.filter(le => le.id !== O)), 700);
        try {
          navigator.vibrate?.(18);
        } catch {}
        be.split("").forEach((U, le) => {
          if (U === p) to(le), vectorClock.timeout(() => to(null), 360);
        });
      } else {
        i(190 + Math.random() * 40), er(O => Math.min(100, O + 6)), no(O => O + 1), mt("Not that one — still building +6%"), bu(p), vectorClock.timeout(() => {
          mt(""), bu(null);
        }, 1100);
        let C = Date.now() + Math.random();
        pt(O => [...O.slice(-5), {
          id: C,
          text: "+6% still building",
          x: 50,
          y: 40,
          color: "#FFB3D6"
        }]), vectorClock.timeout(() => pt(O => O.filter(U => U.id !== C)), 900);
      }
    };
  w.useEffect(() => {
    if (e !== 4) return;
    if (eo > 10 && !ro) {
      let p = be[0];
      if (!en.has(p)) ol(v => {
        let k = new Set(v);
        return k.add(p), k;
      }), mt(`HINT → first letter ${p} revealed`), lo(!0), vectorClock.timeout(() => mt(""), 1800);
    }
  }, [eo, e, be, en, ro]), w.useEffect(() => {
    if (e !== 4) return;
    if (be.split("").every(v => en.has(v))) {
      if (!il) {
        ju(!0), er(100), o(1400, 0.45, 2100);
        try {
          navigator.vibrate?.(50);
        } catch {}
        vectorClock.timeout(() => {
          n(5);
        }, 1300);
      }
    }
  }, [en, be, e, il, o, vl]);
  let rc = w.useCallback((p, v) => {
      if (Zn) return;
      u();
      let C = p.currentTarget.getBoundingClientRect(),
        O,
        U;
      if ("touches" in p && p.touches[0]) O = p.touches[0].clientX, U = p.touches[0].clientY;else if ("changedTouches" in p && p.changedTouches[0]) O = p.changedTouches[0].clientX, U = p.changedTouches[0].clientY;else O = p.clientX, U = p.clientY;
      let le = (O - C.left) / C.width * 100,
        j = (U - C.top) / C.height * 100,
        A = null,
        H = 1 / 0;
      for (let ce of Qa) {
        if (Hn.has(ce.id)) continue;
        if (ce.kind === "venus" && v === "right") {
          let F = (ce.x - le) * (C.width / 100),
            ue = (ce.y - j) * (C.height / 100),
            fn = Math.sqrt(F * F + ue * ue);
          if (fn < H) H = fn, A = ce;
          continue;
        }
        if (ce.side !== v) continue;
        let _e = (ce.x - le) * (C.width / 100),
          Te = (ce.y - j) * (C.height / 100),
          Q = Math.sqrt(_e * _e + Te * Te);
        if (Q < H) H = Q, A = ce;
      }
      if (A && H < 34) {
        uo(_e => {
          let Te = new Set(_e);
          if (Te.add(A.id), Te.size >= 10) {
            oo(!0), o(1400, 0.45, 2100);
            try {
              navigator.vibrate?.([30, 40, 30]);
            } catch {}
            vectorClock.timeout(() => n(6), 1200);
          }
          return Te;
        });
        let ce = Date.now() + Math.random();
        cl(_e => [..._e.slice(-18), {
          id: ce,
          x: A.x,
          y: A.y,
          color: "#00FF88"
        }]), vectorClock.timeout(() => cl(_e => _e.filter(Te => Te.id !== ce)), 900), o(1100 + A.id * 80, 0.38, 0);
        try {
          navigator.vibrate?.(20);
        } catch {}
        vt(`FOUND ${A.label} • ${Hn.size + 1}/10`), vectorClock.timeout(() => vt(""), 900), io(_e => _e + 1);
      } else {
        let ce = Date.now() + Math.random();
        sl({
          x: le,
          y: j,
          id: ce
        }), vectorClock.timeout(() => sl(null), 420), vt("Scanning solar field..."), vectorClock.timeout(() => vt(""), 600), i(220);
      }
    }, [Hn, Zn, u, o, i]),
    Xe = (p => {
      let v = {
          r: 255,
          g: 157,
          b: 28
        },
        k = {
          r: 0,
          g: 255,
          b: 136
        },
        C = Math.round(v.r + (k.r - v.r) * p),
        O = Math.round(v.g + (k.g - v.g) * p),
        U = Math.round(v.b + (k.b - v.b) * p);
      return `rgb(${C},${O},${U})`;
    })(M / 100),
    Gn = mo($e / 15),
    lc = e === 1,
    mp = 10 - Hn.size;
  return _("div", {
    className: "min-h-[100dvh] w-full flex flex-col relative select-none",
    style: {
      background: "#0F2F23",
      fontFamily: "'Space Grotesk', system-ui, sans-serif",
      overflowX: "hidden"
    },
    children: [s("style", {
      children: `

        *{ -webkit-tap-highlight-color: transparent; }
        @keyframes blob { 0%,100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; } 25% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; } 50% { border-radius: 70% 30% 46% 54% / 30% 29% 71% 70%; } 75% { border-radius: 40% 60% 60% 40% / 70% 30% 60% 40%; } }
        @keyframes pulseGlow { 0%,100% { transform: scale(1); opacity:0.9; } 50% { transform: scale(1.04); opacity:1; } }
        @keyframes breathe { 0%,100% { transform: scale(0.95); } 50% { transform: scale(1.08); } }
        @keyframes floatUp { 0% { transform: translateY(0) scale(0.8); opacity:0; } 15% { opacity:1; } 100% { transform: translateY(-70px) scale(1.2); opacity:0; } }
        @keyframes floatCenter { 0% { transform: translate(-50%,-50%) scale(0.7); opacity:0; } 18% { transform: translate(-50%,-70%) scale(1.15); opacity:1; } 100% { transform: translate(-50%,-120%) scale(1); opacity:0; } }
        @keyframes pop { 0% { transform: scale(0.6); } 50% { transform: scale(1.35); } 100% { transform: scale(1); } }
        @keyframes popLetter { 0% { transform: scale(0.4) translateY(10px); opacity:0; } 55% { transform: scale(1.22) translateY(-2px); opacity:1; } 100% { transform: scale(1) translateY(0); opacity:1; } }
        @keyframes confettiFall { 0% { transform: translateY(-20vh) rotate(0deg); } 100% { transform: translateY(110vh) rotate(720deg); } }
        @keyframes bullseyePulse { 0%,100% { transform: translate(-50%,-50%) scale(0.85); } 50% { transform: translate(-50%,-50%) scale(1.15); } }
        @keyframes sonar { 0% { transform: translate(-50%,-50%) scale(0.8); opacity:0.7; } 100% { transform: translate(-50%,-50%) scale(1.9); opacity:0; } }
        @keyframes modalSpring { 0% { transform: scale(0.9) translateY(16px); opacity:0; } 60% { transform: scale(1.04) translateY(-2px); opacity:1; } 100% { transform: scale(1) translateY(0); opacity:1; } }
        @keyframes ctaFloat { 0%,100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-4px) scale(1.02); } }
        @keyframes ctaGlow { 0%,100% { box-shadow: 0 0 24px rgba(0,255,136,0.55), 0 0 56px rgba(0,255,136,0.22), 0 8px 28px rgba(0,0,0,0.45); } 50% { box-shadow: 0 0 36px rgba(0,255,136,0.75), 0 0 78px rgba(0,255,136,0.32), 0 10px 36px rgba(0,0,0,0.55); } }
        @keyframes slideUp { 0% { transform: translateY(110%); opacity:0; } 100% { transform: translateY(0); opacity:1; } }
        @keyframes shakeX { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-2px); } 75% { transform: translateX(2px); } }
        @keyframes keyHue { 0% { filter: hue-rotate(0deg); } 100% { filter: hue-rotate(26deg); } }
        @keyframes badgeSwing { 0%,100% { transform: rotate(-12deg); } 50% { transform: rotate(-6deg); } }
        @keyframes blink { 0%,50% { opacity:1; } 51%,100% { opacity:0; } }
        @keyframes factIn { 0% { transform: translate(-50%,-58%) scale(0.86) rotate(-0.8deg); opacity:0; } 55% { transform: translate(-50%,-58%) scale(1.03) rotate(0.6deg); opacity:1; } 100% { transform: translate(-50%,-58%) scale(1) rotate(0deg); opacity:1; } }
        @keyframes factOut { 0% { transform: translate(-50%,-58%) scale(1) rotate(0deg); opacity:1; } 100% { transform: translate(-50%,-58%) scale(0.92) rotate(1deg); opacity:0; } }
        @keyframes factIn68 { 0% { transform: translate(-50%,-50%) scale(0.86) rotate(-0.8deg); opacity:0; } 55% { transform: translate(-50%,-50%) scale(1.03) rotate(0.6deg); opacity:1; } 100% { transform: translate(-50%,-50%) scale(1) rotate(0deg); opacity:1; } }
        @keyframes factOut68 { 0% { transform: translate(-50%,-50%) scale(1) rotate(0deg); opacity:1; } 100% { transform: translate(-50%,-50%) scale(0.92) rotate(1deg); opacity:0; } }
        @keyframes tickIn { 0% { transform: translateX(-14px) scale(0.9); opacity:0; } 60% { transform: translateX(2px) scale(1.04); opacity:1; } 100% { transform: translateX(0) scale(1); opacity:1; } }
        @keyframes fillBar { 0% { width:0%; } 100% { width:100%; } }
        @keyframes noiseShift { 0% { transform: translate(0,0); } 100% { transform: translate(-2%, -2%); } }
        @keyframes spotPing { 0% { transform: translate(-50%,-50%) scale(0.7); opacity:0.9; } 100% { transform: translate(-50%,-50%) scale(2.1); opacity:0; } }
        @keyframes spotFoundPop { 0% { transform: translate(-50%,-50%) scale(0.4); opacity:0; } 50% { transform: translate(-50%,-50%) scale(1.2); opacity:1; } 100% { transform: translate(-50%,-50%) scale(1); opacity:1; } }
        @keyframes sheen { 0% { transform: translateX(-120%) skewX(-12deg); } 100% { transform: translateX(220%) skewX(-12deg); } }
        @keyframes playWobble { 0%,100% { transform: scale(1); } 25% { transform: scale(1.08) rotate(1deg); } 50% { transform: scale(1.02) rotate(-1deg); } 75% { transform: scale(1.06); } }
        @keyframes neonPulse { 0%,100% { box-shadow: 0 0 12px rgba(255,255,255,0.75), 0 0 24px rgba(255,255,255,0.35), inset 0 0 0 1px rgba(255,255,255,0.2); } 50% { box-shadow: 0 0 20px rgba(255,255,255,0.95), 0 0 36px rgba(255,255,255,0.55), inset 0 0 0 1px rgba(255,255,255,0.35); } }
        @keyframes neonPulseRed { 0%,100% { box-shadow: 0 0 12px rgba(255,59,59,0.65), 0 0 24px rgba(255,45,45,0.32), inset 0 0 0 1px rgba(255,59,59,0.18); } 50% { box-shadow: 0 0 18px rgba(255,59,59,0.90), 0 0 36px rgba(255,45,45,0.48), inset 0 0 0 1px rgba(255,59,59,0.28); } }
        @keyframes rippleRing { 0% { transform: translate(-50%,-50%) scale(0.9); opacity:0.7; } 100% { transform: translate(-50%,-50%) scale(2.1); opacity:0; } }
        @keyframes stringGlow { 0%,100% { filter: drop-shadow(0 0 4px rgba(124,255,94,0.7)); } 50% { filter: drop-shadow(0 0 8px rgba(124,255,94,0.95)); } }
      `
    }), s("div", {
      className: "pointer-events-none absolute inset-0",
      style: {
        background: "radial-gradient(900px 700px at 50% 38%, #1B4A3A 0%, #143D2A 45%, #0F2F23 78%)"
      }
    }), s("div", {
      className: "pointer-events-none absolute inset-0 opacity-[0.07]",
      style: {
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        animation: "noiseShift 14s linear infinite"
      }
    }), s("div", {
      className: "pointer-events-none absolute inset-0",
      style: {
        background: "radial-gradient(ellipse at center, transparent 52%, rgba(0,0,0,0.35) 100%)",
        opacity: 0.55
      }
    }), s("div", {
      className: "pointer-events-none absolute inset-0 z-[1]",
      style: {
        background: "radial-gradient(ellipse at center, transparent 48%, rgba(0,0,0,0.72) 100%)",
        opacity: e === 1 ? 0 : dl,
        transition: "opacity 0.6s ease"
      }
    }), s("div", {
      className: "pointer-events-none absolute inset-0 z-[1]",
      style: {
        background: "#000",
        opacity: e === 1 ? 0 : dl * 0.45,
        transition: "opacity 0.6s ease"
      }
    }), e === 2 && s("div", {
      className: "pointer-events-none fixed bottom-0 left-1/2 -translate-x-1/2 z-[6]",
      style: {
        width: "84%",
        height: "62%",
        background: "radial-gradient(ellipse at center bottom, rgba(245,241,232,0.20) 0%, rgba(94,225,160,0.14) 22%, rgba(94,225,160,0.07) 38%, transparent 70%)",
        filter: "blur(0.8px)",
        opacity: 0.92
      }
    }), lc ? _("div", {
      className: "relative z-10 w-full flex items-center justify-between px-6 md:px-10 pt-6 pb-2",
      children: [s("div", {
        className: "text-[11px] tracking-[0.18em] font-bold",
        style: {
          fontFamily: "'JetBrains Mono', monospace",
          color: "#F5F1E8",
          opacity: 0.75
        },
        children: "VECTOR SHIFT"
      }), s("div", {
        className: "w-2 h-2 rounded-full bg-[#00FF88] animate-pulse shadow-[0_0_10px_#00FF88]"
      })]
    }) : s("h1", {className:"vs-stage", tabIndex:-1, children:vectorStages[e]}), _("div", {
      className: "relative z-10 flex-1 flex flex-col items-center justify-center px-4 pb-20 pt-2",
      inert: paused||stopped ? "" : undefined,
      style: lc ? {} : {
        filter: "none",
        transition: "filter 0.7s ease"
      },
      children: [
        s("section",{className:"vs-instructions",children:[
          !progressSaved && s("p",{role:"alert",children:["This tab could not save your place. Your activity is still here; refresh may lose progress. ",s("button",{onClick:retryProgress,children:"Retry saving place"})]}),
          s("p",{children:vectorInstructions[e]}),
          e===1 && s("p",{children:"Putting attention on colours, movement and simple choices may help you reconnect with what is around you. It may not change how you feel. These games do not measure your mood or nervous system."}),
          e>=2 && e<=5 && s("button",{"aria-pressed":easy,onClick:()=>setEasy(v=>!v),children:easy?"Use original activity":"Try an easier option"}),
          easy && e===2 && s("button",{onClick:()=>n(3),children:"I noticed a colour or shape — continue"}),
          easy && e===3 && s("button",{onClick:()=>{Xa(v=>v+1);nc(np);if($e>=2)n(4)},children:`Collect a light at your pace (${$e}/3)`}),
          e===4 && s("button",{onClick:()=>{const letter=be.split("").find(v=>!en.has(v));if(letter)pp(letter)},children:"Reveal a letter"}),
          easy && e===4 && s("p",{children:`Match the letters in ${be}. You can also reveal them one at a time.`}),
          easy && e===5 && s("div",{className:"vs-scan-list",children:Qa.filter(item=>!Hn.has(item.id)).slice(0,1).map(item=>s("button",{onClick:()=>{uo(v=>new Set([...v,item.id]));vt(`Noticed ${item.label}`)},children:`Notice ${item.label} — then tap here`},item.id))}),
          easy && e===5 && s("button",{onClick:()=>n(6),children:"I've looked — continue"})
        ]}),
        e === 1 && _("div", {
        className: "flex flex-col w-full max-w-[760px] px-2 md:px-6 relative min-h-[78vh]",
        children: [_("div", {
          className: "mt-2 md:mt-6 relative z-20",
          children: [_("h1", {
            className: "text-[44px] md:text-[58px] font-[800] leading-[0.92] tracking-[-0.03em]",
            style: {
              fontFamily: "'Space Grotesk', sans-serif",
              color: "#FFF8E7"
            },
            children: ["VECTOR", s("br", {}), "SHIFT"]
          }), s("div", {
            className: "mt-3 text-[11px] tracking-[0.14em] font-medium",
            style: {
              fontFamily: "'JetBrains Mono', monospace",
              color: "rgba(255,248,231,0.72)"
            },
            children: "Visual attention practice • about 5 minutes • your pace"
          })]
        }), s("div", {
          className: "flex-1 flex flex-col items-center justify-start relative w-full",
          children: _("div", {
            className: "relative w-[380px] max-w-[92vw] h-[580px] md:h-[620px] mt-2 md:mt-4",
            children: [s("div", {
              className: "absolute left-1/2 top-[14%] -translate-x-1/2 -translate-y-1/2",
              style: {
                zIndex: 3
              },
              children: s("div", {
                className: "relative",
                style: {
                  width: 140,
                  height: 140,
                  background: "#FF9D1C",
                  animation: "blob 6s ease-in-out infinite, pulseGlow 3s ease-in-out infinite",
                  boxShadow: "0 0 20px rgba(255,157,28,0.35), 0 0 40px rgba(255,157,28,0.14), inset 0 0 16px rgba(255,255,255,0.28)"
                },
                children: s("div", {
                  className: "absolute inset-[36px] bg-white/90 rounded-full",
                  style: {
                    animation: "blob 4s ease-in-out infinite reverse",
                    boxShadow: "0 0 12px rgba(255,255,255,0.7)"
                  }
                })
              })
            }), _("svg", {
              className: "absolute inset-0 w-full h-full pointer-events-none",
              style: {
                zIndex: 10,
                overflow: "visible",
                animation: "stringGlow 1.6s ease-in-out infinite"
              },
              viewBox: "0 0 380 580",
              preserveAspectRatio: "none",
              children: [s("path", {
                d: "M 190 81 C 180 98, 152 136, 110 182 C 82 215, 66 240, 62 260",
                fill: "none",
                stroke: "#7CFF5E",
                strokeWidth: "3",
                strokeLinecap: "round",
                strokeLinejoin: "round",
                style: {
                  filter: "drop-shadow(0 0 6px rgba(124,255,94,0.85)) drop-shadow(0 0 12px rgba(124,255,94,0.35))"
                }
              }), s("path", {
                d: "M 190 81 C 180 98, 152 136, 110 182 C 82 215, 66 240, 62 260",
                fill: "none",
                stroke: "rgba(255,255,255,0.85)",
                strokeWidth: "1.1",
                strokeLinecap: "round",
                strokeLinejoin: "round",
                opacity: "0.9"
              })]
            }), s("div", {
              className: "absolute",
              style: {
                left: "16%",
                top: "46%",
                transform: "translate(-50%,-50%) rotate(-8deg)",
                zIndex: 11
              },
              children: _("div", {
                className: "relative flex items-center justify-center",
                style: {
                  background: "#FFF8E7",
                  borderRadius: 6,
                  padding: "8px 14px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.30), 0 1px 0 rgba(255,255,255,0.6) inset",
                  transformOrigin: "top center",
                  animation: "badgeSwing 3.2s ease-in-out infinite"
                },
                children: [s("div", {
                  style: {
                    position: "absolute",
                    top: 4,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 6,
                    height: 6,
                    borderRadius: 999,
                    background: "#0F2F23",
                    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.4)"
                  }
                }), s("span", {
                  style: {
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    color: "#143D2A",
                    marginTop: 5,
                    display: "block"
                  },
                  children: "GROUND"
                })]
              })
            }), _("div", {
              className: "absolute left-1/2 top-[62%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center",
              style: {
                zIndex: 12
              },
              children: [_("button", {
                onClick: () => {
                  u(), n(2);
                  try {
                    navigator.vibrate?.(30);
                  } catch {}
                },
                onPointerDown: () => u(),
                className: "group relative flex items-center justify-center active:scale-[0.94] active:translate-y-[3px] cursor-pointer select-none",
                style: {
                  width: 220,
                  height: 220,
                  borderRadius: 110,
                  background: "radial-gradient(112% 112% at 32% 28%, #9DFFB0 0%, #7CFF8A 12%, #00FF88 38%, #00CC6A 68%, #00AA5A 100%)",
                  border: "3px solid rgba(255,255,255,0.92)",
                  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.55), inset 0 8px 0 rgba(255,255,255,0.58), inset 0 -10px 0 rgba(0,0,0,0.22), 0 14px 28px rgba(0,255,136,0.42), 0 0 56px rgba(0,255,136,0.26)",
                  transition: "transform 0.14s cubic-bezier(.16,1,.3,1), box-shadow 0.14s"
                },
                children: [s("div", {
                  className: "pointer-events-none absolute inset-[10%] rounded-full opacity-[0.38]",
                  style: {
                    background: "radial-gradient(78% 58% at 34% 24%, rgba(255,255,255,0.9) 0%, transparent 62%)"
                  }
                }), _("div", {
                  className: "relative flex flex-col items-center justify-center",
                  style: {
                    border: "2.5px solid #FF3B3B",
                    borderRadius: 10,
                    padding: "14px 18px",
                    background: "rgba(0,0,0,0.06)",
                    boxShadow: "0 0 12px rgba(255,45,45,0.60), 0 0 24px rgba(255,45,45,0.32), inset 0 0 0 1px rgba(255,59,59,0.18)",
                    animation: "neonPulseRed 1.8s ease-in-out infinite",
                    minWidth: 108,
                    minHeight: 92
                  },
                  children: [s("div", {
                    className: "pointer-events-none absolute left-1/2 top-[36%] w-[62px] h-[62px] rounded-full border-[1.5px] border-white/70",
                    style: {
                      transform: "translate(-50%,-50%)",
                      animation: "rippleRing 2s ease-out infinite"
                    }
                  }), s("div", {
                    className: "pointer-events-none absolute left-1/2 top-[36%] w-[62px] h-[62px] rounded-full border-[1.2px] border-white/50",
                    style: {
                      transform: "translate(-50%,-50%)",
                      animation: "rippleRing 2s ease-out infinite 0.6s"
                    }
                  }), s("div", {
                    className: "relative",
                    style: {
                      width: 0,
                      height: 0,
                      borderLeft: "48px solid white",
                      borderTop: "28px solid transparent",
                      borderBottom: "28px solid transparent",
                      filter: "drop-shadow(0 0 16px rgba(255,255,255,0.95)) drop-shadow(0 0 22px rgba(255,255,255,0.65))",
                      marginLeft: 8,
                      animation: "playWobble 1.5s ease-in-out infinite",
                      transformOrigin: "40% 50%"
                    }
                  }), s("div", {
                    className: "mt-[8px] whitespace-nowrap text-center",
                    style: {
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: "-0.01em",
                      color: "#0A0A0A",
                      lineHeight: 1
                    },
                    children: "Tap here to begin"
                  })]
                }), s("div", {
                  className: "pointer-events-none absolute inset-[-10px] rounded-full border border-[#00FF88]/30",
                  style: {
                    boxShadow: "0 0 18px rgba(0,255,136,0.22)"
                  }
                })]
              }), s("div", {
                className: "mt-4 text-[10px] tracking-[0.12em] font-medium text-center",
                style: {
                  fontFamily: "'JetBrains Mono', monospace",
                  color: "rgba(255,248,231,0.48)"
                },
                children: "Look • steer • match • notice"
              })]
            })]
          })
        })]
      }), e === 2 && _("div", {
        className: "flex flex-col items-center gap-4 w-full relative",
        children: [s("div", {
          className: "relative w-[360px] max-w-[92vw] flex justify-center",
          children: _("div", {
            className: "z-[20] px-4 py-2 rounded-full text-[11px] font-bold tracking-[0.14em] flex items-center gap-2",
            style: {
              background: ge ? "#A855F7" : ae ? "#00FF88" : "#FF9D1C",
              color: ge ? "#fff" : "#000",
              fontFamily: "'JetBrains Mono', monospace",
              boxShadow: `0 0 18px ${ge ? "#A855F7" : ae ? "#00FF88" : "#FF9D1C"}88`,
              transition: "background 0.2s"
            },
            children: [s("span", {
              className: "w-1.5 h-1.5 rounded-full bg-current animate-pulse"
            }), " ", ge ? "PERFECT LOCK • BULLSEYE" : "KEEP STAR IN RING"]
          })
        }), t && !Ye && s("div", {
          className: "text-[11px] tracking-[0.12em] text-white/50 animate-pulse",
          style: {
            fontFamily: "'JetBrains Mono', monospace"
          },
          children: "DRAG ANYWHERE ↓"
        }), _("div", {
          ref: a,
          tabIndex: 0,
          role: "group",
          "aria-label": "Alignment field. Use arrow keys to move the star, or choose the easier option.",
          onKeyDown: event => {const delta={ArrowLeft:[-12,0],ArrowRight:[12,0],ArrowUp:[0,-12],ArrowDown:[0,12]}[event.key];if(delta){event.preventDefault();y.current={x:Math.max(11,Math.min(349,y.current.x+delta[0])),y:Math.max(11,Math.min(349,y.current.y+delta[1]))}}},
          onPointerDown: fp,
          onPointerMove: dp,
          onPointerUp: tc,
          onPointerCancel: tc,
          onTouchStart: p => {
            p.preventDefault(), ht(p), z.current = !0, u();
          },
          onTouchMove: p => {
            if (p.preventDefault(), z.current) ht(p);
          },
          onTouchEnd: p => {
            p.preventDefault(), z.current = !1;
          },
          className: "relative w-[360px] h-[360px] max-w-[92vw] max-h-[92vw] rounded-[20px] overflow-hidden",
          style: {
            background: "rgba(20,35,28,0.82)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: `1px solid ${Wa ? "rgba(168,85,247,0.8)" : ge ? "rgba(168,85,247,0.5)" : ae ? "rgba(0,255,136,0.35)" : "rgba(255,255,255,0.08)"}`,
            boxShadow: Wa ? "0 0 36px rgba(168,85,247,0.6), inset 0 0 0 1px rgba(168,85,247,0.4)" : ge ? "0 0 30px rgba(168,85,247,0.35), inset 0 0 0 1px rgba(168,85,247,0.2)" : ae ? `0 0 30px ${Xe}22, inset 0 0 0 1px ${Xe}22` : "0 12px 40px rgba(0,0,0,0.5)",
            touchAction: "none",
            userSelect: "none",
            WebkitUserSelect: "none",
            transition: "border-color 0.18s, box-shadow 0.18s"
          },
          children: [_("div", {
            className: "absolute rounded-full pointer-events-none",
            style: {
              width: 160,
              height: 160,
              left: tl.x - 80,
              top: tl.y - 80,
              border: `2px dashed ${ge ? "#A855F7" : ae ? "#00FF88" : "#FF9D1C"}`,
              background: `${Xe}${Math.round(M * 0.004 * 255).toString(16).padStart(2, "0")}`,
              boxShadow: ge ? "0 0 26px #A855F788, inset 0 0 20px #A855F722" : ae ? `0 0 22px ${Xe}88, inset 0 0 20px ${Xe}22` : "0 0 14px #FF9D1C44",
              transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s"
            },
            children: [s("div", {
              className: "absolute inset-0 rounded-full border border-white/10",
              style: {
                margin: 12
              }
            }), s("div", {
              className: "absolute left-1/2 top-1/2",
              style: {
                width: 42,
                height: 42,
                borderRadius: 999,
                background: "linear-gradient(135deg,#A855F7,#FF5CA1)",
                border: "2px solid rgba(255,255,255,0.4)",
                boxShadow: "0 0 20px #B24CFF, inset 0 0 10px rgba(255,255,255,0.35)",
                animation: "bullseyePulse 1s ease-in-out infinite"
              },
              children: s("div", {
                className: "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[8px] h-[8px] rounded-full bg-white",
                style: {
                  boxShadow: "0 0 8px white"
                }
              })
            }), s("div", {
              className: "absolute left-1/2 top-1/2 rounded-full pointer-events-none",
              style: {
                width: 42,
                height: 42,
                border: "1px solid rgba(168,85,247,0.8)",
                animation: "sonar 1.4s ease-out infinite"
              }
            }), s("div", {
              className: "absolute left-1/2 top-1/2 rounded-full pointer-events-none",
              style: {
                width: 42,
                height: 42,
                border: "1px solid rgba(255,92,161,0.6)",
                animation: "sonar 1.4s ease-out infinite 0.3s"
              }
            })]
          }), !ae && !Ye && s("svg", {
            className: "absolute inset-0 w-full h-full pointer-events-none",
            children: s("line", {
              x1: tl.x,
              y1: tl.y,
              x2: nl.x,
              y2: nl.y,
              stroke: "rgba(255,157,28,0.35)",
              strokeWidth: "1.2",
              strokeDasharray: "6 6"
            })
          }), qd.map(p => s("div", {
            className: "absolute w-[18px] h-[18px] rotate-45",
            style: {
              left: p.x - 9,
              top: p.y - 9,
              background: "linear-gradient(135deg,#FFD93D,#FF9D1C)",
              boxShadow: "0 0 12px #FF9D1C",
              clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)"
            }
          }, p.id)), Rd.map(p => s("div", {
            className: "absolute rounded-full pointer-events-none",
            style: {
              left: p.x - 2,
              top: p.y - 2,
              width: 4,
              height: 4,
              background: p.color || Xe,
              opacity: p.life,
              boxShadow: `0 0 6px ${p.color || Xe}`
            }
          }, p.id)), Jd.map(p => s("div", {
            className: "absolute pointer-events-none font-bold text-[12px]",
            style: {
              left: p.x,
              top: p.y,
              color: "#00FF88",
              fontFamily: "'JetBrains Mono', monospace",
              animation: "floatUp 0.9s ease-out forwards",
              textShadow: "0 0 8px #00FF88"
            },
            children: "+2%"
          }, p.id)), xd.map(p => s("div", {
            className: "absolute left-1/2 top-1/2 pointer-events-none font-bold",
            style: {
              fontSize: 24,
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              background: "linear-gradient(90deg,#A855F7,#FF5CA1)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "floatCenter 0.9s ease-out forwards",
              whiteSpace: "nowrap",
              letterSpacing: "-0.02em"
            },
            children: p.text
          }, p.id)), _("div", {
            className: "absolute rounded-full",
            style: {
              left: nl.x - 11,
              top: nl.y - 11,
              width: 22,
              height: 22,
              background: "#fff",
              boxShadow: ge ? "0 0 22px #A855F7, 0 0 36px #FF5CA188" : `0 0 ${10 + M * 0.8}px ${Xe}, 0 0 ${20 + M * 0.4}px ${Xe}66`,
              pointerEvents: "none"
            },
            children: [s("div", {
              className: "absolute inset-[5px] rounded-full bg-white",
              style: {
                boxShadow: `0 0 8px ${ge ? "#A855F7" : Xe}`
              }
            }), ep && s("div", {
              className: "absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-[0.12em] whitespace-nowrap",
              style: {
                background: "linear-gradient(90deg,#A855F7,#FF5CA1)",
                color: "#fff",
                fontFamily: "'JetBrains Mono', monospace",
                boxShadow: "0 0 12px #A855F7",
                animation: "pop 0.28s ease-out"
              },
              children: "PERFECT LOCK"
            })]
          }), Au > 1 && _("div", {
            className: "absolute left-3 top-3 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-widest bg-black/70 text-white border border-white/10",
            style: {
              fontFamily: "'JetBrains Mono', monospace",
              animation: "pop 0.3s ease-out"
            },
            children: ["COMBO x", Au, " ", ge ? "• 2×" : ""]
          }, Au), !ae && M > 5 && !Ye && s("div", {
            className: "absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full text-[10px] tracking-[0.16em] font-bold bg-[#FF9D1C] text-black",
            style: {
              fontFamily: "'JetBrains Mono', monospace"
            },
            children: "RE-ALIGN →"
          })]
        }), _("div", {
          className: "w-[360px] max-w-[92vw] rounded-[20px] p-[14px] flex flex-col gap-2.5",
          style: {
            background: "rgba(20,35,28,0.88)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
          },
          children: [_("div", {
            className: "vs-game-metrics flex items-center justify-between text-[11px] tracking-[0.12em]",
            style: {
              fontFamily: "'JetBrains Mono', monospace"
            },
            children: [_("span", {
              className: "text-white/70",
              children: ["GAME PROGRESS ", _("span", {
                style: {
                  color: ge ? "#A855F7" : Xe
                },
                children: [Math.round(M), "%"]
              })]
            }), _("span", {
              className: "text-white/60",
              children: ["HOLD ", ee.toFixed(1), "/24.0s ", ge ? "• BULLSEYE +15" : ""]
            })]
          }), s("div", {
            className: "relative w-full h-[10px] rounded-full bg-white/10 overflow-hidden",
            children: s("div", {
              className: "absolute left-0 top-0 h-full rounded-full",
              style: {
                width: `${M}%`,
                background: ge ? "linear-gradient(90deg,#A855F7,#FF5CA1)" : "linear-gradient(90deg,#00FF88,#00E676)",
                boxShadow: ge ? "0 0 12px #A855F7, 0 0 20px #FF5CA188" : "0 0 14px #00FF88, 0 0 24px #00FF8866"
              }
            })
          })]
        }), Ye && s("div", {
          className: "fixed bottom-[78px] left-0 right-0 z-30 flex justify-center px-3",
          style: {
            animation: "slideUp 0.45s cubic-bezier(.16,1,.3,1)"
          },
          children: s("div", {
            className: "flex gap-2 md:gap-3 max-w-[720px] w-full justify-center flex-wrap",
            children: ["You can take your time.", "You do not have to feel better.", "You can pause or stop."].map((p, v) => s("div", {
              className: "flex-1 min-w-[110px] max-w-[220px] px-4 py-3 md:px-5 md:py-3.5 rounded-[16px] text-center font-semibold text-[13px] md:text-[14px] leading-[1.25]",
              style: {
                fontFamily: "'Space Grotesk', sans-serif",
                background: "rgba(255,179,214,0.20)",
                border: "1px solid rgba(255,179,214,0.44)",
                color: "#FFD6E5",
                boxShadow: "0 0 22px rgba(255,179,214,0.28), 0 8px 24px rgba(0,0,0,0.25)",
                backdropFilter: "blur(14px)",
                animation: `slideUp 0.5s cubic-bezier(.16,1,.3,1) ${v * 0.12}s both, breathe 2.2s ease-in-out ${0.6 + v * 0.1}s infinite`
              },
              children: p
            }, v))
          })
        })]
      }), e === 3 && _("div", {
        className: "flex flex-col items-center gap-3 w-full",
        children: [_("div", {
          className: "w-[400px] max-w-[92vw] rounded-[14px] px-4 py-2.5 flex items-center justify-between",
          style: {
            background: "rgba(20,35,28,0.82)",
            backdropFilter: "blur(20px)",
            border: `1px solid ${Ru ? "#00FF88" : "rgba(255,255,255,0.08)"}`,
            boxShadow: Ru ? "0 0 20px #00FF8844" : void 0,
            transition: "border-color 0.15s"
          },
          children: [_("div", {
            className: "text-[11px] tracking-[0.14em] font-bold text-white/80",
            style: {
              fontFamily: "'JetBrains Mono', monospace"
            },
            children: ["LIGHTS COLLECTED ", $e, "/", easy?3:15]
          }), s("div", {
            className: "flex gap-1 flex-wrap max-w-[120px] justify-end",
            children: Array.from({
              length: easy?3:15
            }).map((p, v) => s("div", {
              className: "w-2 h-2 rounded-full transition-all",
              style: {
                background: v < $e ? Gn : "rgba(255,255,255,0.15)",
                boxShadow: v < $e ? `0 0 8px ${Gn}` : void 0
              }
            }, v))
          })]
        }), _("div", {
          className: "relative w-[400px] h-[400px] max-w-[92vw] max-h-[92vw] rounded-[20px] overflow-hidden grid",
          style: {
            background: "rgba(20,35,28,0.82)",
            backdropFilter: "blur(20px)",
            border: `1px solid ${Ha ? "#ff3b3b" : Ru ? "#00FF88" : "rgba(255,255,255,0.08)"}`,
            boxShadow: Ha ? "0 0 24px #ff3b3b66 inset" : void 0,
            gridTemplateColumns: "repeat(18, 1fr)",
            gridTemplateRows: "repeat(18, 1fr)",
            touchAction: "none",
            animation: $e >= 15 ? "breathe 2s ease-in-out infinite" : void 0
          },
          onTouchStart: p => {
            let v = p.touches[0];
            bt.current = {
              x: v.clientX,
              y: v.clientY
            };
          },
          onTouchEnd: p => {
            if (!bt.current) return;
            let v = p.changedTouches[0],
              k = v.clientX - bt.current.x,
              C = v.clientY - bt.current.y;
            if (Math.abs(k) > 30 || Math.abs(C) > 30) if (Math.abs(k) > Math.abs(C)) yt(k > 0 ? 1 : -1, 0);else yt(0, C > 0 ? 1 : -1);
            bt.current = null;
          },
          children: [Array.from({
            length: 324
          }).map((p, v) => s("div", {
            className: "border-[0.5px] border-white/[0.03]"
          }, v)), s("div", {
            className: "absolute rounded-full",
            style: {
              width: "5.555555555555555%",
              height: "5.555555555555555%",
              left: `${jt.x / 18 * 100}%`,
              top: `${jt.y / 18 * 100}%`,
              background: Gn,
              boxShadow: `0 0 14px ${Gn}, inset 0 0 6px white`,
              transform: "scale(0.68)"
            }
          }), np.map((p, v) => s("div", {
            className: "absolute rounded-[4px]",
            style: {
              width: "5.555555555555555%",
              height: "5.555555555555555%",
              left: `${p.x / 18 * 100}%`,
              top: `${p.y / 18 * 100}%`,
              background: v === 0 ? "#fff" : mo(($e + v * 0.05) / 15),
              boxShadow: v === 0 ? `0 0 10px ${Gn}` : `0 0 6px ${mo(($e + v * 0.05) / 15)}88`,
              transform: `scale(${v === 0 ? 0.92 : 0.82})`,
              border: v === 0 ? "1px solid rgba(255,255,255,0.9)" : void 0,
              zIndex: 2
            }
          }, v)), tp.map(p => s("div", {
            className: "absolute w-1.5 h-1.5 rounded-full",
            style: {
              left: `${p.x / 18 * 100}%`,
              top: `${p.y / 18 * 100}%`,
              background: Gn,
              boxShadow: `0 0 6px ${Gn}`
            }
          }, p.id))]
        }), _("div", {
          className: "flex flex-col items-center gap-2 mt-1",
          children: [s("div", {
            className: "flex gap-2",
            children: s("button", {
              onClick: () => yt(0, -1),
              "aria-label": "Move up",
              className: "w-[48px] h-[48px] rounded-[14px] flex items-center justify-center text-white/80 active:scale-95 active:bg-white/15 transition-all",
              style: {
                background: "rgba(20,35,28,0.82)",
                border: "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(12px)"
              },
              children: "↑"
            })
          }), _("div", {
            className: "flex gap-2",
            children: [s("button", {
              onClick: () => yt(-1, 0),
              "aria-label": "Move left",
              className: "w-[48px] h-[48px] rounded-[14px] flex items-center justify-center text-white/80 active:scale-95 active:bg-white/15 transition-all",
              style: {
                background: "rgba(20,35,28,0.82)",
                border: "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(12px)"
              },
              children: "←"
            }), s("button", {
              onClick: () => yt(0, 1),
              "aria-label": "Move down",
              className: "w-[48px] h-[48px] rounded-[14px] flex items-center justify-center text-white/80 active:scale-95 active:bg-white/15 transition-all",
              style: {
                background: "rgba(20,35,28,0.82)",
                border: "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(12px)"
              },
              children: "↓"
            }), s("button", {
              onClick: () => yt(1, 0),
              "aria-label": "Move right",
              className: "w-[48px] h-[48px] rounded-[14px] flex items-center justify-center text-white/80 active:scale-95 active:bg-white/15 transition-all",
              style: {
                background: "rgba(20,35,28,0.82)",
                border: "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(12px)"
              },
              children: "→"
            })]
          }), _("div", {
            className: "text-[10px] text-white/25 tracking-widest mt-1",
            style: {
              fontFamily: "'JetBrains Mono', monospace"
            },
            children: [easy?"AT YOUR PACE • ":"ARROWS OR SWIPE • WRAP WALLS • ", $e, "/", easy?3:15]
          })]
        })]
      }), e === 4 && _("div", {
        className: "flex flex-col items-center gap-4 w-full",
        children: [_("div", {
          className: "w-[400px] max-w-[92vw] rounded-[16px] px-4 py-3 flex flex-col gap-2",
          style: {
            background: "rgba(20,35,28,0.88)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08)"
          },
          children: [_("div", {
            className: "flex items-center justify-between text-[11px] tracking-[0.14em] font-bold",
            style: {
              fontFamily: "'JetBrains Mono', monospace"
            },
            children: [s("span", {
              className: "text-white/70",
              children: "WORD MATCH • guess letters or reveal a hint"
            }), _("span", {
              className: "text-[#00FF88]",
              children: [xu, "%"]
            })]
          }), s("div", {
            className: "relative w-full h-[10px] rounded-full bg-white/10 overflow-hidden",
            children: s("div", {
              className: "absolute left-0 top-0 h-full rounded-full",
              style: {
                width: `${xu}%`,
                background: "linear-gradient(90deg,#00FF88,#7CFF5E)",
                boxShadow: "0 0 14px #00FF88"
              }
            })
          }), _("div", {
            className: "text-[10px] tracking-[0.12em] text-white/35",
            style: {
              fontFamily: "'JetBrains Mono', monospace"
            },
            children: ["GUESS OR REVEAL • ", en.size, " ATTEMPTS • 7 LETTERS"]
          })]
        }), _("div", {
          className: "relative w-[420px] max-w-[96vw] rounded-[22px] p-5 flex flex-col gap-5",
          style: {
            background: "rgba(20,35,28,0.88)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.09)",
            boxShadow: "0 16px 50px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.04)"
          },
          children: [s("div", {
            className: "flex justify-center gap-[7px] md:gap-2 flex-wrap",
            children: be.split("").map((p, v) => {
              let k = en.has(p);
              return _("div", {
                className: "w-[38px] md:w-[44px] h-[56px] md:h-[60px] rounded-[12px] flex flex-col items-center justify-end pb-1 relative",
                style: {
                  background: k ? "rgba(0,255,136,0.16)" : "rgba(255,255,255,0.05)",
                  border: `1.5px solid ${k ? "#00FF88" : "rgba(255,255,255,0.12)"}`,
                  boxShadow: k ? "0 0 18px rgba(0,255,136,0.35), inset 0 0 12px rgba(0,255,136,0.12)" : "inset 0 1px 0 rgba(255,255,255,0.06)",
                  transition: "all 0.28s",
                  animation: op === v ? "popLetter 0.42s cubic-bezier(.16,1,.3,1)" : void 0
                },
                children: [s("span", {
                  className: "text-[20px] md:text-[22px] font-bold tracking-[-0.02em]",
                  style: {
                    fontFamily: "'Space Grotesk', sans-serif",
                    color: k ? "#00FF88" : "transparent",
                    textShadow: k ? "0 0 10px #00FF88" : "none",
                    opacity: k ? 1 : 0
                  },
                  children: k ? p : "_"
                }), s("div", {
                  className: "w-[24px] md:w-[26px] h-[2px] rounded-full mt-1",
                  style: {
                    background: k ? "#00FF88" : "rgba(255,255,255,0.18)",
                    boxShadow: k ? "0 0 8px #00FF88" : "none"
                  }
                })]
              }, v);
            })
          }), _("div", {
            className: "h-[20px] flex justify-center items-center gap-2",
            children: [qu && s("span", {
              className: "text-[11px] tracking-[0.08em] text-white/60 text-center",
              style: {
                fontFamily: "'JetBrains Mono', monospace"
              },
              children: qu
            }), ro && !qu && s("span", {
              className: "text-[11px] tracking-[0.08em] text-[#FFD93D]/80",
              style: {
                fontFamily: "'JetBrains Mono', monospace"
              },
              children: "Hint active • first letter revealed"
            })]
          }), s("div", {
            className: "grid grid-cols-7 gap-2 justify-items-center",
            children: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((p, v) => {
              let k = en.has(p),
                C = k && be.includes(p),
                O = k && !be.includes(p),
                U = 200 + v % 7 * 14 + Math.floor(v / 7) * 6,
                le = `hsl(${U}, 90%, 68%)`,
                j = lp === p;
              return s("button", {
                onClick: () => pp(p),
                disabled: k,
                className: "w-[40px] h-[40px] md:w-[42px] md:h-[42px] rounded-[11px] flex items-center justify-center text-[14px] font-bold active:scale-[0.92] transition-all",
                style: {
                  fontFamily: "'Space Grotesk', sans-serif",
                  background: C ? "rgba(0,255,136,0.22)" : O ? "rgba(255,100,100,0.14)" : `hsla(${U}, 70%, 58%, 0.14)`,
                  border: `1.2px solid ${C ? "#00FF88" : O ? "rgba(255,100,100,0.32)" : `hsla(${U}, 80%, 68%, 0.38)`}`,
                  color: C ? "#00FF88" : O ? "rgba(255,140,140,0.7)" : "#E8F0F6",
                  boxShadow: C ? "0 0 16px rgba(0,255,136,0.45), inset 0 0 10px rgba(0,255,136,0.18)" : O ? "0 0 10px rgba(255,100,100,0.18)" : `0 0 12px ${le}22, inset 0 1px 0 rgba(255,255,255,0.08)`,
                  opacity: k ? C ? 1 : 0.62 : 1,
                  animation: j ? "shakeX 0.22s ease-in-out 2" : k ? void 0 : `keyHue ${4 + v % 3}s ease-in-out infinite alternate`
                },
                children: p
              }, p);
            })
          }), rp.map(p => s("div", {
            className: "absolute left-1/2 -translate-x-1/2 pointer-events-none font-bold text-[12px] tracking-[0.08em]",
            style: {
              top: p.y,
              color: p.color,
              fontFamily: "'JetBrains Mono', monospace",
              animation: "floatUp 0.9s ease-out forwards",
              textShadow: `0 0 10px ${p.color}`
            },
            children: p.text
          }, p.id)), up.map(p => s("div", {
            className: "absolute left-1/2 -translate-x-1/2 pointer-events-none",
            style: {
              top: `${p.y}%`
            },
            children: Array.from({
              length: 8
            }).map((v, k) => s("div", {
              className: "absolute w-1 h-1 rounded-full",
              style: {
                background: "#00FF88",
                boxShadow: "0 0 6px #00FF88",
                left: Math.cos(k / 8 * Math.PI * 2) * 22,
                top: Math.sin(k / 8 * Math.PI * 2) * 22,
                animation: "pop 0.36s ease-out"
              }
            }, k))
          }, p.id)), il && s("div", {
            className: "absolute inset-0 flex items-center justify-center z-10 rounded-[22px]",
            style: {
              background: "rgba(0,0,0,0.42)",
              backdropFilter: "blur(8px)"
            },
            children: _("div", {
              className: "px-6 py-4 rounded-[16px] flex flex-col items-center gap-1",
              style: {
                background: "linear-gradient(135deg, rgba(0,255,136,0.22), rgba(124,255,94,0.14))",
                border: "1.5px solid #00FF88",
                boxShadow: "0 0 28px rgba(0,255,136,0.45)",
                animation: "modalSpring 0.55s cubic-bezier(.16,1,.3,1)"
              },
              children: [s("div", {
                className: "text-[18px] font-bold tracking-[-0.02em] text-[#00FF88]",
                style: {
                  fontFamily: "'Space Grotesk', sans-serif",
                  textShadow: "0 0 12px #00FF88"
                },
                children: "CODE CLEARED"
              }), _("div", {
                className: "text-[11px] tracking-[0.12em] text-white/70",
                style: {
                  fontFamily: "'JetBrains Mono', monospace"
                },
                children: [be, " • VECTOR 100%"]
              })]
            })
          })]
        }), _("div", {
          className: "text-[10px] tracking-[0.12em] text-white/30 text-center max-w-[420px] px-3",
          style: {
            fontFamily: "'JetBrains Mono', monospace"
          },
          children: [eo > 10 ? "HINT UNLOCKED • " : "", en.size, " GUESSES • hints and skipping are always available"]
        })]
      }), e === 5 && _("div", {
        className: "flex flex-col items-center gap-5 w-full max-w-[760px]",
        children: [_("div", {
          className: "flex flex-col items-center gap-2",
          children: [_("div", {
            className: "px-5 py-[10px] rounded-[12px] flex items-center gap-3",
            style: {
              background: "rgba(20,35,28,0.92)",
              border: "1px solid rgba(255,255,255,0.10)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)"
            },
            children: [s("div", {
              className: "w-2 h-2 rounded-full bg-[#00FF88] animate-pulse shadow-[0_0_8px_#00FF88]"
            }), s("span", {
              className: "text-[16px] md:text-[18px] font-bold tracking-[-0.01em]",
              style: {
                fontFamily: "'Space Grotesk', sans-serif",
                color: "#FFF8E7"
              },
              children: s(Jv, {
                left: mp,
                popKey: sp
              })
            })]
          }), _("div", {
            className: "text-[10px] tracking-[0.14em] font-bold text-white/35",
            style: {
              fontFamily: "'JetBrains Mono', monospace"
            },
            children: ["SOLAR SCAN • GAME FINDS ", Hn.size, "/10"]
          })]
        }), s("div", {
          className: "flex flex-col md:flex-row gap-4 w-full justify-center items-center",
          children: ["left", "right"].map(p => s("div", {
            className: "relative w-[320px] h-[320px] max-w-[90vw] max-h-[90vw] rounded-[18px] overflow-hidden cursor-crosshair",
            style: {
              border: `1px solid ${Zn ? "#00FF88" : "rgba(255,255,255,0.10)"}`,
              boxShadow: Zn ? "0 0 22px rgba(0,255,136,0.32)" : "0 12px 36px rgba(0,0,0,0.45), inset 0 0 0 1px rgba(255,255,255,0.04)",
              touchAction: "manipulation"
            },
            onClick: v => rc(v, p),
            onTouchEnd: v => {
              v.preventDefault(), rc(v, p);
            },
            children: s(qv, {
              side: p,
              found: Hn,
              layoutSeed: cp,
              particles: ip.filter(v => p === "left" && Qa.find(k => k.id === Math.floor(v.id) % 10)?.side === p || !0),
              wrongFlash: ap
            })
          }, p))
        }), s("div", {
          className: "min-h-[18px] text-[11px] tracking-[0.12em] font-bold text-center max-w-[520px] px-3",
          style: {
            fontFamily: "'JetBrains Mono', monospace",
            color: Zn ? "#00FF88" : qa.includes("FOUND") ? "#00FF88" : "rgba(255,255,255,0.55)"
          },
          children: Zn ? "SCAN COMPLETE // VECTOR CLEAR" : qa || "Compare the two pictures. Tap a difference, or use the easier list."
        }), Zn && s("div", {
          className: "px-5 py-2.5 rounded-full text-[11px] tracking-[0.14em] font-bold",
          style: {
            fontFamily: "'JetBrains Mono', monospace",
            background: "#00FF88",
            color: "#000",
            boxShadow: "0 0 20px #00FF88aa",
            animation: "modalSpring 0.5s cubic-bezier(.16,1,.3,1)"
          },
          children: "VECTOR CLEAR • PROCEEDING"
        })]
      }), e === 6 && s("div", {
        className: "vs-reframe flex items-center justify-center p-4",
        style: {
          background: "rgba(216,213,206,0.88)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)"
        },
        children: _("div", {
          className: "w-[500px] max-w-[92vw] flex flex-col",
          style: {
            minHeight: 460,
            background: "rgba(248,246,242,0.94)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(0,0,0,0.08)",
            borderRadius: 24,
            boxShadow: "0 24px 80px rgba(0,0,0,0.14), 0 0 0 1px rgba(255,255,255,0.6) inset, 0 8px 24px rgba(0,0,0,0.06)",
            animation: "modalSpring 0.6s cubic-bezier(.16,1,.3,1)",
            overflow: "hidden",
            position: "relative"
          },
          children: [s("div", {
            className: "absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-black/10 to-transparent"
          }), _("div", {
            className: "px-8 pt-7 pb-2 flex items-center justify-between",
            children: [_("div", {
              className: "px-3 py-1 rounded-full text-[11px] tracking-[0.14em] font-bold border",
              style: {
                fontFamily: "'JetBrains Mono', monospace",
                background: "rgba(0,0,0,0.04)",
                color: "rgba(0,0,0,0.52)",
                borderColor: "rgba(0,0,0,0.08)"
              },
              children: ["REFRAME ", nn + 1, "/5"]
            }), s("div", {
              className: "flex gap-1.5 items-center",
              children: Qu.map((p, v) => s("div", {
                className: "rounded-full transition-all",
                style: {
                  width: 8,
                  height: 8,
                  background: v <= nn ? "#0F2A1F" : "rgba(0,0,0,0.12)",
                  boxShadow: v <= nn ? "0 0 0 3px rgba(15,42,31,0.12)" : "none",
                  transform: v === nn ? "scale(1.25)" : "scale(1)"
                }
              }, v))
            })]
          }), s("h3", {
            className: "text-left px-8",
            style: {
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 24,
              fontWeight: 700,
              lineHeight: 1.25,
              color: "#1A1A1A",
              letterSpacing: "-0.02em",
              paddingTop: 14,
              paddingBottom: 8
            },
            children: Qu[nn].q
          }), s("div", {
            className: "flex flex-col gap-3.5 px-6 pb-6 pt-4",
            children: Qu[nn].a.map((p, v) => {
              let k = fl === v,
                C = fl !== null && fl !== v;
              return _("button", {
                "aria-label": p,
                onClick: () => {
                  if (fl !== null) return;
                  ao(v), co(Qu[nn].v[v]), o(900 + nn * 80, 0.36, 0);
                  try {
                    navigator.vibrate?.(22);
                  } catch {}
                  vectorClock.timeout(() => {
                    if (nn < 4) ba(O => O + 1), ao(null), co("");else n(7);
                  }, 900);
                },
                className: "text-left w-full relative flex items-center justify-between",
                style: {
                  minHeight: 72,
                  padding: "20px 20px",
                  borderRadius: 18,
                  fontSize: 16,
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 600,
                  lineHeight: 1.35,
                  background: k ? "linear-gradient(135deg, rgba(0,255,136,0.24) 0%, rgba(0,255,136,0.10) 100%)" : C ? "rgba(0,0,0,0.03)" : "linear-gradient(135deg, rgba(139,184,204,0.20) 0%, rgba(139,184,204,0.10) 100%)",
                  border: k ? "1.6px solid #00B86A" : "1px solid rgba(0,0,0,0.08)",
                  color: k ? "#0F2A1F" : C ? "rgba(0,0,0,0.42)" : "#1A1A1A",
                  boxShadow: k ? "0 0 20px rgba(0,255,136,0.20), 0 4px 18px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.7)" : "0 2px 10px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.8)",
                  transform: k ? "translateY(-1px) scale(1.01)" : "translateY(0) scale(1)",
                  opacity: C ? 0.55 : 1,
                  transition: "all 0.22s cubic-bezier(.16,1,.3,1)",
                  cursor: "pointer"
                },
                children: [s("span", {
                  className: "pr-3 flex-1",
                  children: p
                }), s("span", {
                  className: "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                  style: {
                    background: k ? "#0F2A1F" : "rgba(0,0,0,0.06)",
                    border: k ? "1px solid #0F2A1F" : "1px solid rgba(0,0,0,0.08)",
                    color: k ? "#00FF88" : "transparent",
                    boxShadow: k ? "0 0 0 3px rgba(15,42,31,0.10)" : "none",
                    transform: k ? "scale(1)" : "scale(0.9)"
                  },
                  children: s("span", {
                    style: {
                      fontSize: 14,
                      fontWeight: 700,
                      color: k ? "#F5F1E8" : "transparent"
                    },
                    children: "✓"
                  })
                })]
              }, v);
            })
          }), ec && _("div", {
            className: "mx-6 mb-6 px-4 py-3.5 rounded-[14px] flex items-start gap-2.5",
            style: {
              background: "linear-gradient(135deg, rgba(15,42,31,0.08) 0%, rgba(15,42,31,0.04) 100%)",
              border: "1px solid rgba(15,42,31,0.14)",
              boxShadow: "0 4px 16px rgba(15,42,31,0.06)"
            },
            children: [s("span", {
              className: "w-6 h-6 rounded-full bg-[#0F2A1F] text-[#F5F1E8] flex items-center justify-center text-[12px] font-bold flex-shrink-0 mt-[1px]",
              children: "✓"
            }), s("span", {
              style: {
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 14,
                fontWeight: 500,
                color: "#0F2A1F",
                lineHeight: 1.5
              },
              children: ec
            })]
          }), s("div", {
            className: "px-8 pb-5 text-[10px] tracking-[0.12em] text-black/35",
            style: {
              fontFamily: "'JetBrains Mono', monospace"
            },
            children: "Your answers do not need to show improvement."
          })]
        })
      }), e === 7 && _("div", {
        className: "flex flex-col items-center w-full max-w-[440px]",
        children: [_("div", {
          className: "vs-ending w-[380px] max-w-[92vw] rounded-[24px] p-8 flex flex-col gap-6",
          style: {
            background: "#1B3D2F",
            border: "1px solid rgba(255,248,231,0.12)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06) inset, 0 0 40px rgba(0,255,136,0.06)",
            animation: "pop 0.55s cubic-bezier(.16,1,.3,1)"
          },
          children: [s("div", {
            className: "w-14 h-14 rounded-full flex items-center justify-center bg-[#00FF88] text-black text-[28px] font-bold shadow-[0_0_28px_#00FF88aa]",
            children: "•"
          }), _("div", {
            children: [s("h2", {
              className: "text-[32px] font-bold tracking-[-0.025em] leading-[0.95]",
              style: {
                fontFamily: "'Space Grotesk', sans-serif",
                color: "#FFF8E7"
              },
              children: "How was this for you?"
            }), s("p", {
              className: "text-[13px] leading-[1.5] tracking-[0.08em] mt-2.5",
              style: {
                fontFamily: "'JetBrains Mono', monospace",
                color: "rgba(255,248,231,0.62)"
              },
              children: "Game progress cannot tell us how you feel."
            })]
          }), s("div", {
            className: "h-[1px] w-full",
            style: {
              background: "linear-gradient(90deg, transparent, rgba(255,248,231,0.14), transparent)"
            }
          }), s("div", {
            className: "flex flex-col gap-3.5",
            children: ["You can stop here", "You can choose support", "No improvement is required"].map(p => _("div", {
              className: "flex items-center gap-3 px-4 py-3.5 rounded-[14px]",
              style: {
                background: "rgba(255,248,231,0.06)",
                border: "1px solid rgba(255,248,231,0.10)"
              },
              children: [s("div", {
                className: "w-1.5 h-1.5 rounded-full bg-[#00FF88] shadow-[0_0_8px_#00FF88]"
              }), s("span", {
                className: "text-[14px]",
                style: {
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 500,
                  color: "#FFF8E7"
                },
                children: p
              })]
            }, p))
          }), s("p", {
            className: "text-[12px] leading-[1.6] italic px-1",
            style: {
              fontFamily: "'JetBrains Mono', monospace",
              color: "rgba(255,248,231,0.48)"
            },
            children: "Next, you can answer the same check-in as at the start, or leave it unanswered."
          }), s("div", {className:"vs-feedback", children: [
            s("fieldset", {children:[s("legend",{children:"Did this practice help? (optional)"}),
              ...[["helpful","Helpful"],["same","No change"],["worse","Felt worse"],["unsure","Not sure"]].map(([value,label])=>s("button",{type:"button","aria-pressed":helpfulness===value,onClick:()=>setHelpfulness(value),children:label},value))]}),
            s("p", {role:"status",children:helpfulness==="helpful"?"You said this was helpful.":helpfulness==="same"?"You reported no change. You do not need to keep trying this.":helpfulness==="worse"?"You reported feeling worse. You can stop and choose rest or support.":helpfulness==="unsure"?"You are not sure whether it helped. That is okay.":"No feedback selected. We will leave it unanswered."}),
            s("button",{onClick:finish,disabled:sent.current,children:"Continue to check-in"})
          ]})]
        })]
      })]
    }), s("div", {className:"vs-controls", inert:paused||stopped?"":undefined, children:[
      e>1 && e<7 && s("button",{onClick:()=>setPaused(true),children:"Pause"}),
      e>1 && e<7 && s("button",{onClick:()=>{setSkipped(v=>[...new Set([...v,e])]);n(e+1)},children:"Skip step"}),
      e>1 && e<7 && s("button",{onClick:()=>n(e-1),children:"Back"}),
      e<7 && s("button",{onClick:()=>setStopped(true),children:"Stop"})
    ]}),
    (paused||stopped) && s("div",{className:"vs-overlay",role:"dialog","aria-modal":true,"aria-label":stopped?"Stop or resume":"Paused",onKeyDown:event=>{if(event.key==="Escape"){setPaused(false);setStopped(false)}if(event.key==="Tab"){const buttons=event.currentTarget.querySelectorAll("button");if(event.shiftKey&&document.activeElement===buttons[0]){event.preventDefault();buttons[buttons.length-1].focus()}else if(!event.shiftKey&&document.activeElement===buttons[buttons.length-1]){event.preventDefault();buttons[0].focus()}}},children:s("div",{className:"vs-dialog",children:[
      s("h2",{children:stopped?"Stop here?":"Paused"}),s("p",{role:"status",children:progressSaved?"Your place is saved in this tab. Resume when you want, or finish with an optional check-in.":"Your place could not be saved in this tab. Your current activity is still here; refresh may lose progress."}),!progressSaved && s("button",{onClick:retryProgress,children:"Retry saving place"}),
      s("button",{autoFocus:true,onClick:()=>{setPaused(false);setStopped(false)},children:"Resume"}),
      s("button",{onClick:()=>{setExitReason("stopped");setPaused(false);setStopped(false);n(7)},children:"Finish here"})
    ]})})
    ]
  });
}
Gd.createRoot(document.getElementById("root")).render(s(Zd.default.StrictMode, {
  children: s(Aa, {})
}));
