import * as M from 'react';
import { createRoot } from 'react-dom/client';
import { jsx as p, jsxs as S, Fragment as Gn } from 'react/jsx-runtime';
import { useNight } from './useNight.js';
import { NightControls, AudibleSlot } from './Controls.jsx';
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
  const night = useNight(Vr);
  const {
    channel: e,
    minutes: l,
    seconds: u,
    volume: s,
    texture: v,
    files: $,
    title: fo
  } = night;
  const t = night.status === 'playing',
    a = t && u <= 60 && night.source === 'local';
  const [h, w] = M.useState(false),
    [E, _] = M.useState(false);
  M.useEffect(() => {
    const dismiss = event => { if (event.key === 'Escape') { w(false); _(false); } };
    window.addEventListener('keydown', dismiss);
    return () => window.removeEventListener('keydown', dismiss);
  }, []);
  const Xe = Vr.find(c => c.id === e) || Vr[0],
    ao = night.source === 'local' ? null : night.source;
  const qn = id => {
      w(false);
      return night.play(id);
    },
    mo = night.pause,
    Rf = async (...args) => {
      await night.attach(...args);
      w(false);
    };
  const f = night.setVolume,
    y = night.setTexture,
    o = night.changeTimer,
    i = () => {};
  const Qf = () => night.setPanel('spotify'),
    Bf = () => night.setPanel('apple');
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
      }), !night.view ? S("div", {
        className: "flex flex-col w-full flex-1 min-h-0 justify-evenly gap-[12px] items-stretch overflow-hidden",
        children: [p("div", {
          className: "flex justify-center shrink-0 w-full",
          children: p("div", {
            className: "inline-flex items-center justify-center rounded-[20px] bg-[#3A2C65] border-[1.5px] border-[#C4B5FD] px-[16px] py-[8px] shadow-[0_0_12px_rgba(196,181,253,0.25),0_2px_10px_rgba(42,27,74,0.22),inset_0_1px_0_rgba(255,255,255,0.06)] shrink-0",
            style: {
              minHeight: "33px",
              height: "33px"
            },
            children: p("span", {
              className: "text-[11.5px] font-semibold leading-none text-[#E9D5FF] text-center whitespace-nowrap",
              style: {
                fontFamily: "Quicksand, sans-serif"
              },
              children: "You always get through the day even when you're tired"
            })
          })
        }), S("button", {
          onClick: () => w(true),
          className: "group relative w-[97%] mx-auto text-left rounded-[24px] transition-all cursor-pointer active:scale-[0.98] hover:scale-[1.01] backdrop-blur-[12px] shrink-0",
          style: {
            background: "rgba(58,44,101,0.96)",
            border: "2.5px solid #C4B5FD",
            boxShadow: "0 0 0 5px rgba(196,181,253,0.18), 0 0 32px rgba(167,139,250,0.4), 0 6px 24px rgba(42,27,74,0.32), inset 0 1px 0 rgba(255,255,255,0.10)",
            padding: "22px",
            minHeight: "190px",
            height: "190px"
          },
          children: [p("div", {
            className: "absolute inset-0 rounded-[22px] pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity",
            style: {
              background: "radial-gradient(120% 120% at 20% 10%, rgba(233,213,255,0.18) 0%, transparent 60%)"
            }
          }), S("div", {
            className: "relative flex items-start justify-between mb-2.5",
            children: [p("div", {
              className: "h-6 w-6 rounded-full bg-[#35275E] border border-[#C4B5FD]/50 flex items-center justify-center shadow-inner",
              children: p("div", {
                className: "h-1.5 w-1.5 rounded-full bg-[#E9D5FF] group-active:scale-125 transition-transform animate-pulse"
              })
            }), p("div", {
              className: "flex items-center gap-1.5",
              children: p("span", {
                className: "text-[9px] px-2 py-0.5 rounded-full bg-[#3E2A6E] border border-[#C4B5FD]/30 text-[#E9D5FF] font-medium",
                style: {
                  fontFamily: "Quicksand, sans-serif"
                },
                children: Xe.effortLabel
              })
            })]
          }), p("h2", {
            className: "relative text-[39px] leading-[0.9] tracking-[-0.01em] text-[#F3EFFF] mb-2",
            style: {
              fontFamily: "Caveat, cursive",
              fontWeight: 700,
              transform: "rotate(-0.4deg)"
            },
            children: Xe.name
          }), p("p", {
            className: "relative text-[15px] leading-[1.25] text-[#D8CCFF] mb-1.5 max-w-[32ch] font-medium",
            style: {
              fontFamily: "Quicksand, sans-serif"
            },
            children: night.files[e] ? "Your attached audio file" : Xe.subtitle
          }), p("p", {
            className: "relative text-[14px] leading-[1.32] text-[#DDD6FE]/90 font-light line-clamp-2",
            style: {
              fontFamily: "Quicksand, sans-serif"
            },
            children: Xe.description
          }), S("div", {
            className: "relative mt-3 flex items-center justify-between",
            children: [p("div", {
              className: "flex items-center gap-2 text-[10px] text-[#8E7EBE] tracking-wide flex-1",
              style: {
                fontFamily: "Quicksand, sans-serif"
              },
              children: p("span", {
                className: "h-px flex-1 bg-[#C4B5FD]/30"
              })
            }), S("div", {
              className: "ml-3 inline-flex items-center gap-1.5 rounded-full bg-[#E9D5FF] px-3 py-1 text-[#2A1C4E] text-[10px] font-bold tracking-wide shadow-[0_2px_10px_rgba(233,213,255,0.45)] animate-[pulseSoft_2.2s_ease-in-out_infinite]",
              style: {
                fontFamily: "Quicksand, sans-serif"
              },
              children: ["tap to change ", p("span", {
                className: "text-[12px]",
                children: "\u21BB"
              })]
            })]
          })]
        }), p("div", {
          className: "flex justify-center shrink-0 w-full",
          children: S("div", {
            className: "inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-[#C4B5FD] bg-[#3A2C65] px-[14px] py-[8px] shadow-[0_0_12px_rgba(196,181,253,0.25),0_2px_12px_rgba(221,214,254,0.15),0_2px_10px_rgba(42,27,74,0.2)] shrink-0",
            style: {
              minHeight: "33px",
              height: "33px"
            },
            children: [p("span", {
              className: "h-1.5 w-1.5 rounded-full bg-[#7C5CDB] animate-pulse"
            }), p("span", {
              className: "text-[12.5px] tracking-wide text-[#E9D5FF] font-semibold",
              style: {
                fontFamily: "Quicksand, sans-serif"
              },
              children: night.worries ? "Saved note available on this device" : "No saved worry note"
            })]
          })
        }), Xe.id === "audible" && p(AudibleSlot, {
          night
        }), S("button", {
          onClick: () => qn(),
          className: "w-full h-[56px] rounded-full text-[#2A1C4E] text-[18px] font-semibold tracking-[-0.01em] flex items-center justify-center gap-3 active:scale-[0.98] transition-transform hover:scale-[1.01] shadow-[0_0_0_1px_rgba(233,213,255,0.3),0_8px_28px_rgba(167,139,250,0.35)] shrink-0",
          style: {
            background: "linear-gradient(135deg, #E9D5FF 0%, #DDD6FE 100%)",
            fontFamily: "Quicksand, sans-serif"
          },
          children: [p("span", {
            className: "inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#2A1C4E]/10",
            children: p("svg", {
              width: "12",
              height: "12",
              viewBox: "0 0 14 14",
              fill: "none",
              children: p("path", {
                d: "M3 2.5L11 7L3 11.5V2.5Z",
                fill: "currentColor"
              })
            })
          }), "Tune In"]
        }), S("div", {
          className: "w-full grid grid-cols-2 gap-[10px] shrink-0",
          children: [S("button", {
            onClick: Qf,
            className: "h-[44px] rounded-[14px] px-[16px] py-[10px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shrink-0 cursor-pointer",
            style: {
              background: "#1DB954"
            },
            children: [p("span", {
              className: "h-4 w-4 rounded-full bg-black/20 flex items-center justify-center shrink-0",
              children: p("svg", {
                width: "12",
                height: "12",
                viewBox: "0 0 24 24",
                fill: "white",
                children: p("path", {
                  d: "M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.6-1.559.3z"
                })
              })
            }), p("span", {
              className: "text-[13px] font-bold text-white leading-none",
              style: {
                fontFamily: "Quicksand, sans-serif"
              },
              children: "Spotify"
            })]
          }), S("button", {
            onClick: Bf,
            className: "h-[44px] rounded-[14px] px-[16px] py-[10px] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform bg-[#FAFAFA] border border-white/60 shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.15)] cursor-pointer",
            children: [p("span", {
              className: "h-4 w-4 rounded-full bg-black flex items-center justify-center shrink-0",
              children: p("svg", {
                width: "9",
                height: "9",
                viewBox: "0 0 10 10",
                "aria-hidden": "true",
                children: p("path", {
                  d: "M6.5 2.5v4.2a1.5 1.5 0 11-1-1.4V3.2l4-1v3.5a1.5 1.5 0 11-1-1.4V2.5h-2z",
                  fill: "white"
                })
              })
            }), p("span", {
              className: "text-[13px] font-bold text-black leading-none",
              style: {
                fontFamily: "Quicksand, sans-serif"
              },
              children: "Apple Music"
            })]
          })]
        }), p("div", {
          className: "w-full shrink-0",
          children: S("div", {
            className: "w-full rounded-[14px] bg-[#3A2C65] border-[1.5px] border-[#6B5A9A]/60 px-[14px] py-[10px] flex flex-col justify-start shadow-[0_2px_12px_rgba(42,27,74,0.22),inset_0_1px_0_rgba(255,255,255,0.07)] min-h-[70px] h-[70px]",
            children: [p("span", {
              className: "text-[10px] leading-none mb-[4px]",
              style: {
                color: "#E9D5FF"
              },
              children: "\u2726"
            }), p("span", {
              className: "text-[10.5px] font-semibold leading-[1.25] text-[#E9D5FF]",
              style: {
                fontFamily: "Quicksand, sans-serif",
                textWrap: "balance"
              },
              children: "There's no pressure tonight \u2014 if I don't sleep well it's okay, I'll be home tomorrow before I know it"
            })]
          })
        }), S("div", {
          className: "flex flex-col items-center gap-1 shrink-0",
          children: [p("p", {
            className: "text-center text-[10px] leading-3.5 text-[#8E7EBE] tracking-wide",
            style: {
              fontFamily: "Quicksand, sans-serif"
            },
            children: "Background playback unverified • Local audio fades in the final minute"
          }), p("button", {
            onClick: g => {
              try {
                g.currentTarget.setAttribute("data-toggled", "true");
              } catch {}
              _(T => !T);
            },
            className: "text-[10px] tracking-wide text-[#8E7EBE] hover:text-[#DDD6FE] underline underline-offset-4 decoration-[#4B3D7A]",
            style: {
              fontFamily: "Quicksand, sans-serif"
            },
            "aria-expanded": E,
            "data-how-button": "true",
            children: E ? "Close explanation" : "How it works"
          }), p("div", {
            className: "text-[9px] text-[#4B3D7A] tracking-widest",
            children: "\u2014 \u2726 \u2014"
          })]
        })]
      }) : p(Gn, {
        children: S("div", {
          className: "flex-1 flex flex-col",
          children: [S("div", {
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
                  children: ["Playing from ", ao === "spotify" ? "Spotify" : ao === "apple" ? "Apple Music" : "Audible", " • timer stop; no fade"]
                })]
              })]
            }), p("button", {
              onClick: () => w(true),
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
                      children: t ? a ? "fading..." : "listening" : "paused"
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
                  children: ["tap anywhere to ", t ? "pause" : "resume", " \u2022 it's all soft"]
                })]
              })]
            })
          }), S("div", {
            className: "space-y-5 pb-2",
            children: [S("div", {
              className: "space-y-3",
              children: [S("div", {
                className: "flex items-center justify-between",
                children: [p("label", {
                  className: "text-[10px] tracking-[0.18em] text-[#8E7EBE] uppercase",
                  style: {
                    fontFamily: "Quicksand, sans-serif"
                  },
                  children: "Volume"
                }), S("span", {
                  className: "text-[10px] text-[#B9A8DB] tabular-nums",
                  style: {
                    fontFamily: "Quicksand, sans-serif"
                  },
                  children: [Math.round(s * 100), "%"]
                })]
              }), p("div", {
                className: "relative h-10 flex items-center",
                children: p("input", {
                  type: "range",
                  "aria-label": "Local audio volume",
                  disabled: night.source !== "local",
                  min: 0,
                  max: 1,
                  step: 0.01,
                  value: s,
                  onChange: g => f(parseFloat(g.target.value)),
                  className: "w-full h-1.5 appearance-none bg-[#3A2A6E] rounded-full accent-[#A78BFA] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#E9D5FF] [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:shadow-[0_1px_6px_rgba(0,0,0,0.5)] [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#E9D5FF] [&::-moz-range-thumb]:border-0"
                })
              })]
            }), S("div", {
              className: "space-y-3",
              children: [S("div", {
                className: "flex items-center justify-between",
                children: [p("label", {
                  className: "text-[10px] tracking-[0.18em] text-[#8E7EBE] uppercase",
                  style: {
                    fontFamily: "Quicksand, sans-serif"
                  },
                  children: "Texture"
                }), p("span", {
                  className: "text-[10px] text-[#8E7EBE]",
                  style: {
                    fontFamily: "Quicksand, sans-serif"
                  },
                  children: "generated noise tone"
                })]
              }), p("div", {
                className: "relative h-10 flex items-center",
                children: p("input", {
                  type: "range",
                  "aria-label": "Generated noise texture",
                  disabled: night.source !== "local" || !!night.files[e],
                  min: 0,
                  max: 1,
                  step: 0.01,
                  value: v,
                  onChange: g => y(parseFloat(g.target.value)),
                  className: "w-full h-1.5 appearance-none bg-[#3A2A6E] rounded-full accent-[#A78BFA] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#E9D5FF] [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:shadow-[0_1px_6px_rgba(0,0,0,0.5)] [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#E9D5FF] [&::-moz-range-thumb]:border-0"
                })
              })]
            }), p("div", {
              children: p("div", {
                className: "flex gap-2",
                children: [15, 30, 45, 60].map(g => p("button", {
                  onClick: () => {
                    if (o(g), g === null) i(null);else i(g * 60);
                  },
                  className: `h-9 flex-1 rounded-full text-[12px] tracking-wide font-medium border transition-all active:scale-[0.98] hover:scale-[1.02] ${l === g ? "bg-[#E9D5FF] text-[#2A1C4E] border-[#E9D5FF] shadow-[0_2px_12px_rgba(233,213,255,0.3)]" : "bg-[#2F2354] text-[#8E7EBE] border-[#4B3D7A] hover:border-[#6B5AA6] hover:text-[#DDD6FE]"}`,
                  style: {
                    fontFamily: "Quicksand, sans-serif"
                  },
                  children: g === null ? "\u221E" : `${g}m`
                }, String(g)))
              })
            }), S("div", {
              className: "flex items-center gap-3 pt-2",
              children: [p("button", {
                onClick: () => t ? mo() : qn(),
                className: "h-[56px] flex-1 rounded-full bg-[#2F2354] border border-[#4B3D7A] text-[#DDD6FE] text-[14px] font-medium tracking-wide flex items-center justify-center gap-2 active:scale-[0.98] hover:border-[#6B5AA6] hover:scale-[1.01] transition-all",
                style: {
                  fontFamily: "Quicksand, sans-serif"
                },
                children: t ? S(Gn, {
                  children: [S("svg", {
                    width: "14",
                    height: "14",
                    viewBox: "0 0 14 14",
                    children: [p("rect", {
                      x: "3",
                      y: "2.5",
                      width: "2.5",
                      height: "9",
                      rx: "0.5",
                      fill: "currentColor"
                    }), p("rect", {
                      x: "8.5",
                      y: "2.5",
                      width: "2.5",
                      height: "9",
                      rx: "0.5",
                      fill: "currentColor"
                    })]
                  }), "Pause"]
                }) : S(Gn, {
                  children: [p("svg", {
                    width: "14",
                    height: "14",
                    viewBox: "0 0 14 14",
                    children: p("path", {
                      d: "M3 2.5L11 7L3 11.5V2.5Z",
                      fill: "currentColor"
                    })
                  }), "Resume"]
                })
              }), p("button", {
                onClick: () => w(true),
                className: "h-[56px] px-6 rounded-full bg-transparent border border-transparent text-[#8E7EBE] text-[13px] tracking-wide hover:text-[#DDD6FE] active:scale-[0.98] transition-all",
                style: {
                  fontFamily: "Quicksand, sans-serif"
                },
                children: "Change Channel"
              })]
            })]
          })]
        })
      }), p(NightControls, {
        night
      })]
    }), h && S("div", {
      role:"dialog", "aria-modal":true, "aria-label":"Cozy channels",
      className: "fixed inset-0 z-40 overflow-hidden max-w-[100vw]",
      children: [p("div", {
        className: "absolute inset-0 bg-[#1D1333]/75 backdrop-blur-[12px] max-w-[100vw]",
        onClick: () => w(false)
      }), S("div", {
        className: "absolute inset-x-0 bottom-0 mx-auto max-w-[440px] bg-[#2F2354] border-t border-[#4B3D7A] rounded-t-[32px] max-h-[86vh] flex flex-col animate-[drawerIn_0.32s_cubic-bezier(0.32,0.72,0,1)] shadow-[0_-12px_48px_rgba(29,19,51,0.6)] overflow-hidden",
        children: [p("div", {
          className: "flex justify-center pt-4 pb-2",
          children: p("div", {
            className: "h-1 w-9 rounded-full bg-[#4B3D7A]"
          })
        }), S("div", {
          className: "px-7 pt-2 pb-4 flex items-center justify-between",
          children: [p("h2", {
            className: "text-[22px] text-[#F3EFFF]",
            style: {
              fontFamily: "Caveat, cursive",
              fontWeight: 600
            },
            children: "Cozy Channels"
          }), p("button", {
            "aria-label": "Close channel picker",
            onClick: () => w(false),
            className: "h-8 w-8 rounded-full bg-[#35275E] border border-[#4B3D7A] flex items-center justify-center text-[#8E7EBE] hover:text-[#F3EFFF] active:scale-95",
            children: p("svg", {
              width: "12",
              height: "12",
              viewBox: "0 0 12 12",
              children: p("path", {
                d: "M1 1L11 11M11 1L1 11",
                stroke: "currentColor",
                strokeWidth: "1.2"
              })
            })
          })]
        }), S("div", {
          className: "flex-1 overflow-y-auto px-4 pb-6 space-y-3 scrollbar-thin",
          children: [Vr.map(g => {
            let T = g.id === e,
              D = !!$[g.id];
            return S("div", {
              className: `group rounded-[22px] border p-4 flex items-center justify-between transition-all ${T ? "bg-[#3E2A6E] border-[#6B5AA6] shadow-[0_4px_20px_rgba(124,92,219,0.2)]" : "bg-[#35275E]/80 border-[#4B3D7A] hover:border-[#6B5AA6] hover:bg-[#3A2A6E]"}`,
              children: [S("button", {
                onClick: () => {
                  w(false);
                  night.select(g.id);
                },
                className: "flex-1 text-left",
                children: [S("div", {
                  className: "flex items-center gap-2 flex-wrap",
                  children: [p("h3", {
                    className: `text-[20px] leading-tight ${T ? "text-[#F3EFFF]" : "text-[#DDD6FE]"}`,
                    style: {
                      fontFamily: "Caveat, cursive",
                      fontWeight: 600,
                      transform: "rotate(-0.3deg)"
                    },
                    children: g.name
                  }), T && t && p("span", {
                    className: "h-1.5 w-1.5 rounded-full bg-[#A78BFA] animate-pulse ml-1"
                  }), D && p("span", {
                    className: "text-[9px] tracking-wide px-2 py-0.5 rounded-full bg-[#DDD6FE] text-[#3A2A6E] font-medium",
                    style: {
                      fontFamily: "Quicksand, sans-serif"
                    },
                    children: "custom"
                  }), p("span", {
                    className: "text-[10px] px-2 py-0.5 rounded-full bg-[#2F2354] border border-[#4B3D7A] text-[#B9A8DB]",
                    style: {
                      fontFamily: "Quicksand, sans-serif"
                    },
                    children: g.effortLabel
                  })]
                }), p("p", {
                  className: "mt-1 text-[11px] leading-4 text-[#B9A8DB] max-w-[28ch]",
                  style: {
                    fontFamily: "Quicksand, sans-serif"
                  },
                  children: g.subtitle
                }), p("p", {
                  className: "mt-1 text-[11px] leading-4 text-[#8E7EBE] max-w-[32ch]",
                  style: {
                    fontFamily: "Quicksand, sans-serif"
                  },
                  children: g.description
                })]
              }), S("div", {
                className: "flex items-center gap-2 ml-3 shrink-0",
                children: [S("label", {
                  className: "h-9 w-9 rounded-full bg-[#2F2354] border border-[#4B3D7A] flex items-center justify-center text-[#8E7EBE] hover:text-[#DDD6FE] cursor-pointer active:scale-95 transition-all",
                  title: "Attach your audio file",
                  "aria-label": `Attach audio for ${g.name}`,
                  children: [p("input", {
                    type: "file",
                    "aria-label": `Attach audio for ${g.name}`,
                    accept: "audio/*,.mp3,.wav,.m4a,.ogg",
                    className: "hidden",
                    onChange: O => {
                      let F = O.target.files?.[0];
                      if (F) Rf(g.id, F);
                    }
                  }), p("svg", {
                    width: "14",
                    height: "14",
                    viewBox: "0 0 14 14",
                    fill: "none",
                    children: p("path", {
                      d: "M7 3V11M3 7H11",
                      stroke: "currentColor",
                      strokeWidth: "1.2",
                      strokeLinecap: "round"
                    })
                  })]
                }), p("button", {
                  "aria-label": `Play ${g.name}`,
                  onClick: () => qn(g.id),
                  className: `h-9 w-9 rounded-full flex items-center justify-center active:scale-95 transition-all ${T && t ? "bg-[#E9D5FF] text-[#2A1C4E]" : "bg-[#4B3D7A] text-[#DDD6FE] hover:bg-[#6B5AA6] hover:text-white"}`,
                  children: T && t ? S("svg", {
                    width: "12",
                    height: "12",
                    viewBox: "0 0 12 12",
                    children: [p("rect", {
                      x: "2.5",
                      y: "2",
                      width: "2",
                      height: "8",
                      rx: "0.5",
                      fill: "currentColor"
                    }), p("rect", {
                      x: "7.5",
                      y: "2",
                      width: "2",
                      height: "8",
                      rx: "0.5",
                      fill: "currentColor"
                    })]
                  }) : p("svg", {
                    width: "12",
                    height: "12",
                    viewBox: "0 0 12 12",
                    children: p("path", {
                      d: "M2.5 2L9.5 6L2.5 10V2Z",
                      fill: "currentColor"
                    })
                  })
                })]
              })]
            }, g.id);
          }), p("div", {
            className: "mt-4 rounded-[20px] border border-dashed border-[#4B3D7A] bg-[#1D1333]/60 p-4 backdrop-blur",
            children: S("div", {
              className: "flex items-start gap-3",
              children: [p("div", {
                className: "h-8 w-8 rounded-full bg-[#35275E] border border-[#4B3D7A] flex items-center justify-center text-[#8E7EBE]",
                children: p("svg", {
                  width: "14",
                  height: "14",
                  viewBox: "0 0 14 14",
                  children: p("path", {
                    d: "M7 3V11M3 7H11",
                    stroke: "currentColor",
                    strokeWidth: "1.2"
                  })
                })
              }), S("div", {
                children: [p("p", {
                  className: "text-[12px] text-[#DDD6FE] tracking-wide",
                  style: {
                    fontFamily: "Quicksand, sans-serif"
                  },
                  children: "Add your own file"
                }), p("p", {
                  className: "mt-1 text-[11px] leading-4 text-[#8E7EBE]",
                  style: {
                    fontFamily: "Quicksand, sans-serif"
                  },
                  children: "Attach your own mp3, wav, or m4a. Plays once. Kept in this tab only; never uploaded."
                })]
              })]
            })
          })]
        })]
      })]
    }), E && S("div", {
      className: "fixed inset-0 z-50 flex items-end justify-center sm:items-center overflow-hidden max-w-[100vw]",
      role: "dialog",
      "aria-modal": "true",
      "data-how-modal": "true",
      children: [p("div", {
        className: "absolute inset-0 bg-[#1D1333]/80 backdrop-blur-[12px] max-w-[100vw]",
        onClick: () => _(false)
      }), S("div", {
        className: "relative w-full max-w-[420px] mx-6 mb-10 sm:mb-0 rounded-[28px] bg-[#2F2354] border border-[#4B3D7A] p-7 shadow-[0_20px_80px_rgba(29,19,51,0.8)] max-w-[90vw]",
        children: [p("h3", {
          className: "text-[24px] tracking-[-0.01em] text-[#F3EFFF]",
          style: {
            fontFamily: "Caveat, cursive",
            fontWeight: 600
          },
          children: "How it works \u2728"
        }), p("p", {
          className: "mt-4 text-[13px] leading-[1.6] text-[#DDD6FE] font-light",
          style: {
            fontFamily: "Quicksand, sans-serif"
          },
          children: "If you saved a Tomorrow Parking Lot note, it remains on this device. Saving a note is optional."
        }), p("p", {
          className: "mt-3 text-[13px] leading-[1.6] text-[#B9A8DB] font-light",
          style: {
            fontFamily: "Quicksand, sans-serif"
          },
          children: "Not enough to follow. Just enough to let go. Like late-night radio that is interesting enough to occupy the mind so it doesn\u2019t spiral, but boring enough that you drift off."
        }), p("p", {
          className: "mt-3 text-[11px] leading-4 text-[#8E7EBE]",
          style: {
            fontFamily: "Quicksand, sans-serif"
          },
          children: "Six channels offer generated noise previews, not scene recordings. Podcast, documentary and audiobook recordings have not been added. Spotify and Apple Music require owner configuration and your authorization. Locked-screen playback and timers need device testing."
        }), p("button", {
          onClick: () => _(false),
          className: "mt-6 h-11 w-full rounded-full bg-[#E9D5FF] text-[#2A1C4E] text-[14px] font-semibold hover:bg-[#DDD6FE] active:scale-[0.98] transition-all",
          style: {
            fontFamily: "Quicksand, sans-serif"
          },
          children: "Got it, cozy! \u{1F319}"
        })]
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
