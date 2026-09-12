import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const outputDir = "tmp/intervention-audit/screens";
mkdirSync(outputDir, { recursive: true });

const interventions = [
  ["sigh", "Cyclic Sighing & Extended Exhale"],
  ["boxV2", "Box Breathing"],
  ["progressive-muscle-relaxation-v2", "Progressive Muscle Relaxation"],
  ["factCheck", "Thought or Fact?"],
  ["solvableWorry", "Solvable or Hypothetical Worry?"],
  ["urgeSurf", "Urge Surfing"],
  ["thenWhat", "Then What?"],
  ["activationMenu", "Ignition Point"],
  ["countermove", "Countermove"],
  ["openChannel", "Open Channel"],
  ["pulseShift", "Pulse Shift"],
  ["testPrediction", "Test the Prediction"],
  ["changeScene", "Change the Scene"],
  ["compassionBreak", "Self-Compassion Break"],
  ["grounding54321V2", "5-4-3-2-1 Grounding"],
  ["reroute", "Reroute"],
  ["orienting", "Orienting Scan"],
  ["nameFeeling", "Name What You're Feeling"],
  ["nextAction", "Next Easiest Step"],
  ["signalLock", "Signal Lock"],
  ["frictionSweep", "Friction Sweep"],
  ["tomorrowParking", "Tomorrow Parking Lot"],
  ["nightChannel", "Night Channel"],
  ["awakeInBedReset", "Awake-in-Bed Reset"],
  ["dropSleepStruggle", "Drop the Sleep Struggle"],
];

const scriptedChoices = {
  factCheck: ["Continue", "Adding an interpretation", "Continue", "Finish"],
  thenWhat: ["Continue", "Yes - I can reflect safely", "Continue", "Something painful", "Continue", "No", "Finish"],
  activationMenu: ["Continue", "Pleasure", "Continue", "I am back", "Completed", "Finish"],
  countermove: ["Continue", "Isolate", "Giving short relief", "5° - Nudge", "Continue", "I am back", "Completed", "Finish"],
  openChannel: ["Continue", "Stopped replying", "Awkwardness", "Yes - contact is safe", "Signal", "Light", "I reviewed the action", "I am back", "Sent or completed", "Finish"],
  pulseShift: ["Continue", "Flat", "Seated", "Flicker", "Continue when ready", "Showering", "I am back", "Completed", "Finish"],
  testPrediction: ["Continue", "Continue", "Yes - small and safe", "Continue", "I am back", "Continue", "Finish"],
  changeScene: ["Continue", "Move to a window or doorway", "I am back", "Completed", "Finish"],
  nextAction: ["Continue", "Cannot see the next action", "Continue", "I am back", "Completed", "Finish"],
  tomorrowParking: ["It can wait until tomorrow", "Continue", "Finish"],
  reroute: ["Continue", "I am safe enough to continue", "Familiar", "Music or known audio", "Put the needed item within reach", "I came back", "Attention settled elsewhere", "No", "Finish"],
  signalLock: ["Test the signal", "Make it smaller", "Lock it", "3 min", "Perimeter ready", "LOCK AND START", "Target reached", "Helped", "Made meaningful progress"],
  nightChannel: ["Familiar Replay", "Predictable content already heard", "Use my audio app", "15 minutes", "Enter Night Channel", "Leave Night Channel"],
};

const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run",
  "--no-default-browser-check", "--remote-debugging-port=9225",
  "--user-data-dir=/private/tmp/mentation-audit-cdp", "about:blank",
], { stdio: "ignore" });

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let version;
for (let attempt = 0; attempt < 50; attempt += 1) {
  try { version = await fetch("http://127.0.0.1:9225/json/version").then((r) => r.json()); break; }
  catch { await wait(100); }
}
if (!version) throw new Error("Chrome DevTools did not start");

const target = await fetch("http://127.0.0.1:9225/json/new?http://127.0.0.1:5173/library", { method: "PUT" }).then((r) => r.json());
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
let nextId = 0;
const pending = new Map();
const exceptions = [];
ws.onmessage = ({ data }) => {
  const message = JSON.parse(data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message)); else resolve(message.result);
  }
  if (message.method === "Runtime.exceptionThrown") exceptions.push(message.params.exceptionDetails.text);
};
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++nextId;
  pending.set(id, { resolve, reject });
  ws.send(JSON.stringify({ id, method, params }));
});
const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })).result.value;
const safe = (value) => JSON.stringify(value);
const screenshot = async (path) => {
  const capture = await send("Page.captureScreenshot", { format: "png", fromSurface: true });
  writeFileSync(path, Buffer.from(capture.data, "base64"));
};
const pageState = () => evaluate(`JSON.stringify({
  path: location.pathname,
  title: [...document.querySelectorAll('h1,h2')].map(x=>x.innerText.trim()).filter(Boolean).slice(0,4),
  text: document.body.innerText.replace(/\\n{3,}/g,'\\n\\n').slice(0,1800),
  buttons: [...document.querySelectorAll('button')].filter(x=>x.offsetParent!==null).map(x=>({text:x.innerText.trim(),aria:x.getAttribute('aria-label'),disabled:x.disabled})),
  fields: [...document.querySelectorAll('input,textarea')].filter(x=>x.offsetParent!==null).map(x=>({type:x.type,placeholder:x.placeholder,aria:x.getAttribute('aria-label')})),
  width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth
})`);
const clickContaining = (label) => evaluate(`(() => {
  const label=${safe(label)}.toLowerCase();
  const nodes=[...document.querySelectorAll('button')].filter(x=>x.offsetParent!==null&&!x.disabled);
  const target=nodes.find(x=>(x.innerText||'').trim().toLowerCase().includes(label));
  if(!target)return false; target.click(); return true;
})()`);
const fillFields = (value) => evaluate(`(() => {
  const value=${safe(value)};
  const nodes=[...document.querySelectorAll('textarea,input')].filter(x=>x.offsetParent!==null&&['text','textarea',''].includes(x.type||''));
  for(const node of nodes){const proto=node.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(node,value);node.dispatchEvent(new Event('input',{bubbles:true}));}
  return nodes.length;
})()`);
const clickFirstAction = () => evaluate(`(() => {
  const blocked=['back','exit','close','menu','audio on','audio off','captions on','captions off','timer on','timer off','ambient sound','this is not helping','pause','play'];
  const nodes=[...document.querySelectorAll('button')].filter(x=>x.offsetParent!==null&&!x.disabled);
  const target=nodes.find(x=>{const t=((x.innerText||x.getAttribute('aria-label')||'').trim().toLowerCase());return t&&!blocked.some(b=>t===b||t.startsWith(b));});
  if(!target)return false; target.click(); return (target.innerText||target.getAttribute('aria-label')||'').trim();
})()`);

await send("Runtime.enable");
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true, screenWidth: 390, screenHeight: 844 });
await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });

const audit = [];
for (const [id, name] of interventions) {
  await evaluate(`localStorage.removeItem('mentation.active-flagship.v1'); location.href='http://127.0.0.1:5173/library'`);
  await wait(800);
  const launched = await clickContaining(name);
  await wait(650);
  if (!launched) { audit.push({ id, name, error: "library card not found" }); continue; }
  await clickContaining("Begin");
  await wait(750);
  const screens = [];
  const choices = [...(scriptedChoices[id] || [])];
  for (let step = 0; step < 14; step += 1) {
    const state = JSON.parse(await pageState());
    screens.push(state);
    await screenshot(`${outputDir}/${String(interventions.indexOf(interventions.find(x=>x[0]===id))+1).padStart(2,'0')}-${id}-${String(step+1).padStart(2,'0')}.png`);
    if (state.path !== "/reset") break;
    const buttonText = state.buttons.map((b) => b.text).filter(Boolean);
    if (buttonText.some((x) => x.includes("Finish gently"))) {
      await clickContaining("Finish gently");
      await wait(350);
      break;
    }
    await fillFields(id === "signalLock" ? "Open the report and write the first paragraph" : "A realistic audit example entered by the user.");
    let clicked = false;
    while (choices.length && !clicked) clicked = await clickContaining(choices.shift());
    if (!clicked) {
      if (buttonText.some((x) => x === "Next" || x.includes("Next body part") || x.includes("Next intervention"))) clicked = await clickContaining("Next");
      else clicked = await clickFirstAction();
    }
    if (!clicked) break;
    await wait(550);
  }
  audit.push({ id, name, screens });
}

writeFileSync("tmp/intervention-audit/screen-inventory.json", JSON.stringify({ audit, exceptions }, null, 2));
console.log(JSON.stringify(audit.map((x)=>({id:x.id,name:x.name,screens:x.screens?.length||0,error:x.error,overflow:x.screens?.some(s=>s.scrollWidth>s.width)}))));
console.log(JSON.stringify({ runtimeExceptions: exceptions }));
ws.close();
chrome.kill("SIGTERM");
