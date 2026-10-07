import * as M from 'react';
import { createRoot } from 'react-dom/client';
import { jsx as p, jsxs as S, Fragment as Gn } from 'react/jsx-runtime';
import { useNight } from './useNight.js';
import { NightControls } from './Controls.jsx';
import SetupFlow from './SetupFlow.jsx';
import { useAccessibilityPrefs } from '../../src/hooks/useAccessibilityPrefs.js';
var Vr = [{
  id: "night-desk",
  name: "The Night Desk",
  subtitle: "papers, soft muttering, desk lamp hum",
  description: "A clerk files things that don't matter tonight. Half-sentences you don't need to follow.",
  effort: 1,
  effortLabel: "barely there",
  freq: 360,
  filterType: "lowpass",
  textureFreq: 1750,
  kind: "core"
}, {
  id: "laundromat",
  name: "The Laundromat After Hours",
  subtitle: "washers humming, folding, warm air",
  description: "Warm machines, someone folding towels slowly. The most low-stakes place on earth at 1am.",
  effort: 1,
  effortLabel: "cozy",
  freq: 300,
  filterType: "lowpass",
  textureFreq: 1300,
  kind: "core"
}, {
  id: "sunny",
  name: "Sunny Field",
  subtitle: "birds, warm breeze, distant lawnmower",
  description: "A lazy sunny day in long grass. Birds doing their thing. Nothing you need to track.",
  effort: 1,
  effortLabel: "sunny",
  freq: 420,
  filterType: "bandpass",
  textureFreq: 2400,
  kind: "nature"
}, {
  id: "rainy",
  name: "Rainy Day",
  subtitle: "rain on window, gutters, soft roof",
  description: "Rain on a window, no thunder. Just steady, boring, perfect rain.",
  effort: 1,
  effortLabel: "cozy",
  freq: 260,
  filterType: "lowpass",
  textureFreq: 1100,
  kind: "nature"
}, {
  id: "waterfall",
  name: "Waterfall Mist",
  subtitle: "soft waterfall, moss, spray",
  description: "Water falling on rocks, far enough away you don't get wet. Just the hiss.",
  effort: 1,
  effortLabel: "misty",
  freq: 600,
  filterType: "lowpass",
  textureFreq: 3200,
  kind: "nature"
}, {
  id: "beach",
  name: "Beach at Night",
  subtitle: "tide in, tide out, no seagulls",
  description: "Night beach, no people, no loud gulls. Just waves doing their job.",
  effort: 1,
  effortLabel: "floating",
  freq: 180,
  filterType: "lowpass",
  textureFreq: 900,
  kind: "nature"
}, {
  id: "podcast",
  name: "The Sleepy Podcast Shelf",
  subtitle: "cozy podcasts \u2022 low stakes",
  description: "Boring-but-nice podcasts. History of pockets, why park benches are green... interesting, but not enough to stay awake for.",
  effort: 2,
  effortLabel: "podcast",
  freq: 380,
  filterType: "lowpass",
  textureFreq: 1600,
  kind: "podcast"
}, {
  id: "documentary",
  name: "Documentary Drift",
  subtitle: "audio documentary \u2022 deep dives",
  description: "Deep dives into super specific things. The history of spoons, how salt gets to your table. Fascinating for 3 minutes, then you drift.",
  effort: 2,
  effortLabel: "deep dive",
  freq: 400,
  filterType: "lowpass",
  textureFreq: 1800,
  kind: "documentary"
}, {
  id: "audible",
  name: "Your Audible",
  subtitle: "your audiobook of choice \u2022 links to Audible",
  description: "Your own audiobook, slowed and softened. We lower it, fade it. You pick the story.",
  effort: 2,
  effortLabel: "audiobook",
  freq: 350,
  filterType: "lowpass",
  textureFreq: 1500,
  kind: "audible"
}];
for (const channel of Vr) {
  channel.concept = channel.description;
  channel.subtitle = ['podcast', 'documentary', 'audible'].includes(channel.id) ? 'Recording not added yet • your audio slot' : 'Generated noise preview • recording not added yet';
  channel.description = 'Planned scene: ' + channel.concept;
  if (channel.id === 'audible') channel.description = 'Your chosen audiobook. External Audible playback uses Audible’s own controls and timer.';
}
function Bi() {
  useAccessibilityPrefs();
  const night = useNight(Vr);
  const {
    channel: e,
    minutes: l,
    seconds: u,
    title: fo
  } = night;
  const t = night.status === 'playing',
    a = t && u <= 60 && night.source === 'local';
  const [focusMode,setFocusMode] = M.useState(false);
  const Xe = Vr.find(c => c.id === e) || Vr[0],
    ao = night.source === 'local' ? null : night.source;
  const qn = night.play, mo = night.pause;
  const $f = seconds => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  const Wf = u / (l * 60);
  return S("div", {
    className: "h-[100dvh] max-h-[100dvh] w-full flex justify-center selection:bg-[#DDD6FE]/40 overflow-y-auto relative max-w-[100vw] box-border",
    style: {
      background: "radial-gradient(120% 120% at 30% 10%, #3E2A6E 0%, #2A1B4A 35%, #1D1333 100%)"
    },
    children: [S("div", {
      className: "pointer-events-none absolute inset-0 z-[0] overflow-hidden max-w-full w-full",
      children: [p("div", {
        className: "absolute top-[-10%] right-[5%] w-[220px] h-[220px] rounded-full blur-[60px] opacity-[0.22] max-w-[60vw]",
        style: {
          background: "#7C5CDB"
        }
      }), p("div", {
        className: "absolute bottom-[-8%] left-[5%] w-[260px] h-[260px] rounded-full blur-[60px] opacity-[0.18] max-w-[60vw]",
        style: {
          background: "#4F3A8B"
        }
      }), p("div", {
        className: "absolute top-[18%] left-[12%] text-[#B9A8DB]/30 text-[10px] tracking-[0.4em]",
        children: "\u2022 \u2022 \u2022"
      }), p("div", {
        className: "absolute top-[42%] right-[8%] text-[#B9A8DB]/20 text-[14px]",
        children: "\u2726"
      }), p("div", {
        className: "absolute bottom-[22%] left-[22%] text-[#B9A8DB]/25 text-[10px]",
        children: "\u2726 \u2022 \u2726"
      }), p("div", {
        className: "absolute top-[68%] right-[18%] text-[#8E7EBE]/20 text-[12px]",
        children: "\u2022"
      })]
    }), p("div", {
      className: "pointer-events-none absolute inset-0 z-[1] opacity-[0.03] mix-blend-soft-light overflow-hidden max-w-full w-full",
      style: {
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
      }
    }), S("div", {
      className: "relative z-10 w-full max-w-[440px] h-[100dvh] max-h-[100dvh] flex flex-col px-[16px] pt-[10px] pb-[10px] justify-evenly gap-[12px] box-border max-w-[100vw]",
      children: [S("div", {
        className: "flex flex-col items-center justify-center shrink-0 pt-1 pb-0 gap-1",
        children: [p("h1", {
          className: "text-[64px] leading-[0.85] tracking-[-0.02em] text-[#F3EFFF] text-center",
          style: {
            fontFamily: "Caveat, cursive",
            fontWeight: 700,
            transform: "rotate(-0.6deg)"
          },
          children: "Night Channel"
        }), p("div", {
          className: "mt-1 opacity-60",
          children: p("svg", {
            width: "140",
            height: "11",
            viewBox: "0 0 92 8",
            fill: "none",
            children: p("path", {
              d: "M2 5.5 C 18 1, 36 7, 52 4.5 S 78 1.5, 90 4",
              stroke: "#A78BFA",
              strokeWidth: "1.4",
              strokeLinecap: "round",
              fill: "none"
            })
          })
        })]
      }), !focusMode && (!night.view ? (!night.panel && p(SetupFlow, {night,channels:Vr})) : p(Gn, {
        children: S("div", {
          className: "flex-1 flex flex-col",
          children: [p("h2",{className:"night-listening-instruction",children:"Rest your attention on the sound."}),p("p",{className:"night-listening-support",children:"When a thought pulls you away, gently return."}),S("div", {
            className: "night-player-status flex items-center justify-between mt-1 mb-2",
            children: [S("div", {
              className: "flex items-center gap-3",
              children: [S("div", {
                className: "h-7 px-3 rounded-full bg-[#2F2354] border border-[#4B3D7A] flex items-center gap-2 backdrop-blur",
                children: [p("div", {
                  className: "h-1.5 w-1.5 rounded-full bg-[#A78BFA] animate-[pulseSlow_2.8s_ease-in-out_infinite]"
                }), p("span", {
                  className: "text-[10px] tracking-[0.18em] text-[#B9A8DB] uppercase",
                  style: {
                    fontFamily: "Quicksand, sans-serif"
                  },
                  children: night.status
                })]
              }), S("div", {
                className: "flex flex-col leading-tight",
                children: [p("span", {
                  className: "text-[15px] text-[#F3EFFF]",
                  style: {
                    fontFamily: "Caveat, cursive",
                    fontWeight: 600
                  },
                  children: fo ? `${fo}` : Xe.name
                }), ao && S("span", {
                  className: "text-[10px] text-[#B9A8DB]",
                  style: {
                    fontFamily: "Quicksand, sans-serif"
                  },
                  children: [night.status==='playing'?"Playing from ":"Selected source: ", ao === "spotify" ? "Spotify" : ao === "apple" ? "Apple Music" : "Audible", " • timer stop; no fade"]
                })]
              })]
            }), p("button", {
              onClick: async () => { if (await night.pause()) { night.setSetupStep("source"); night.setView(false); } },
              className: "text-[11px] text-[#8E7EBE] hover:text-[#DDD6FE] tracking-wide",
              style: {
                fontFamily: "Quicksand, sans-serif"
              },
              children: "Change"
            }), p("button", {
              onClick: night.stop,
              className: "night-stop",
              children: "STOP"
            })]
          }), p("div", {
            className: "flex-1 flex flex-col items-center justify-center pt-4 pb-4",
            children: S("button", {
              onClick: () => t ? mo() : qn(),
              className: "group relative flex flex-col items-center justify-center focus:outline-none",
              "aria-label": t ? "Pause" : "Play",
              children: [S("div", {
                className: "relative",
                children: [S("svg", {
                  width: "260",
                  height: "260",
                  className: "absolute -inset-5 -left-5 -top-5 -right-5 -bottom-5 pointer-events-none",
                  children: [p("circle", {
                    cx: "130",
                    cy: "130",
                    r: "118",
                    stroke: "#4B3D7A",
                    strokeWidth: "1",
                    fill: "none",
                    opacity: "0.6"
                  }), l !== null && p("circle", {
                    cx: "130",
                    cy: "130",
                    r: "118",
                    stroke: "#A78BFA",
                    strokeWidth: "1.2",
                    fill: "none",
                    strokeLinecap: "round",
                    strokeDasharray: `${2 * Math.PI * 118}`,
                    strokeDashoffset: `${2 * Math.PI * 118 * (1 - Wf)}`,
                    style: {
                      transition: "stroke-dashoffset 1s linear",
                      opacity: a ? 0.5 : 0.85
                    },
                    transform: "rotate(-90 130 130)"
                  })]
                }), S("div", {
                  className: "relative h-[220px] w-[220px] rounded-full flex items-center justify-center overflow-hidden",
                  style: {
                    background: "radial-gradient(110% 110% at 35% 30%, #4A2F8A 0%, #3A256E 32%, #2A1B4A 68%)",
                    boxShadow: "inset 0 1px 1px rgba(255,255,255,0.15), 0 0 90px rgba(139,92,246,0.22), 0 20px 60px rgba(29,19,51,0.6)"
                  },
                  children: [p("div", {
                    className: "absolute inset-0 rounded-full opacity-70 animate-[breathe_8s_ease-in-out_infinite]",
                    style: {
                      background: "radial-gradient(70% 70% at 45% 40%, rgba(167,139,250,0.35) 0%, rgba(124,92,219,0.12) 35%, transparent 70%)"
                    }
                  }), p("div", {
                    className: "absolute inset-[18px] rounded-full opacity-50 animate-[float_11s_ease-in-out_infinite]",
                    style: {
                      background: "radial-gradient(60% 60% at 60% 60%, rgba(221,214,254,0.25) 0%, transparent 65%)"
                    }
                  }), p("div", {
                    className: "absolute inset-0 rounded-full opacity-40",
                    style: {
                      background: "radial-gradient(40% 40% at 30% 30%, rgba(255,255,255,0.18) 0%, transparent 60%)"
                    }
                  }), S("div", {
                    className: "relative z-10 flex flex-col items-center",
                    children: [p("div", {
                      className: `h-2 w-2 rounded-full bg-[#E9D5FF] ${t ? "animate-[pulseSlow_2.2s_ease-in-out_infinite] shadow-[0_0_12px_#E9D5FF]" : "opacity-50"}`
                    }), p("span", {
                      className: "mt-3 text-[11px] tracking-[0.18em] text-[#DDD6FE]/80 uppercase",
                      style: {
                        fontFamily: "Quicksand, sans-serif"
                      },
                      children: t ? "Pause" : "Play / resume"
                    })]
                  })]
                })]
              }), S("div", {
                className: "mt-7 text-center",
                children: [S("div", {
                  className: "flex items-baseline justify-center gap-2",
                  children: [p("span", {
                    className: "text-[34px] tracking-[-0.02em] text-[#F3EFFF] tabular-nums",
                    style: {
                      fontFamily: "Caveat, cursive",
                      fontWeight: 600
                    },
                    children: l === null ? "\u221E" : $f(u)
                  }), p("span", {
                    className: "text-[13px] text-[#B9A8DB] font-normal tracking-wide",
                    style: {
                      fontFamily: "Quicksand, sans-serif"
                    },
                    children: l === null ? "continuous" : "remaining"
                  })]
                }), S("p", {
                  className: "mt-1 text-[11px] text-[#8E7EBE] tracking-wide",
                  style: {
                    fontFamily: "Quicksand, sans-serif"
                  },
                  children: ["Tap the light to ", t ? "pause." : "resume."]
                })]
              })]
            })
          })]
        })
      })), p(NightControls, {
        night, channelName:Xe.name,onFocusMode:setFocusMode
      })]
    }), p("style", {
      children: `
        
        * { -webkit-tap-highlight-color: transparent; }
        @keyframes breathe {
          0%, 100% { transform: scale(0.96); opacity: 0.85; }
          50% { transform: scale(1.06); opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(8px,-10px) scale(1.05); }
          66% { transform: translate(-6px,6px) scale(0.98); }
        }
        @keyframes pulseSlow {
          0%, 100% { opacity: 0.9; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
        @keyframes pulseSoft {
          0%, 100% { transform: scale(1); box-shadow: 0 2px 10px rgba(233,213,255,0.45); }
          50% { transform: scale(1.03); box-shadow: 0 4px 18px rgba(233,213,255,0.65); }
        }
        @keyframes drawerIn {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spotifyLoad {
          from { width: 0%; }
          to { width: 100%; }
        }
        ::-webkit-scrollbar { width: 0; height: 0; }
      `
    })]
  });
}
createRoot(document.getElementById("root")).render(p(Bi, {}));
