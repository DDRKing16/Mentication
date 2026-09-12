import { spawn } from "node:child_process";
import { writeFileSync } from "node:fs";

const chrome = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", [
  "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run",
  "--no-default-browser-check", "--remote-debugging-port=9223",
  "--user-data-dir=/private/tmp/mentation-cdp-responsive", "about:blank",
], { stdio: "ignore" });

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let version;
for (let attempt = 0; attempt < 40; attempt += 1) {
  try { version = await fetch("http://127.0.0.1:9223/json/version").then((r) => r.json()); break; }
  catch { await wait(100); }
}
if (!version) throw new Error("Chrome DevTools did not start");

const target = await fetch("http://127.0.0.1:9223/json/new?http://127.0.0.1:5173/", { method: "PUT" }).then((r) => r.json());
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
const evaluate = (expression) => send("Runtime.evaluate", { expression, returnByValue: true });
const metrics = () => evaluate(`JSON.stringify({url:location.pathname,clientWidth:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,clientHeight:document.documentElement.clientHeight,scrollY:window.scrollY,bodyText:document.body.innerText.slice(0,120)})`);
const screenshot = async (path) => {
  const capture = await send("Page.captureScreenshot", { format: "png", fromSurface: true });
  writeFileSync(path, Buffer.from(capture.data, "base64"));
};
const clickText = async (text) => {
  const result = await evaluate(`(() => { const target=[...document.querySelectorAll('button')].find((node)=>node.textContent.trim().includes(${JSON.stringify(text)})); if(!target)return false; target.click(); return true; })()`);
  if (!result.result.value) throw new Error(`Button not found: ${text}`);
  await wait(550);
};

await send("Runtime.enable");
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: 390, height: 844, deviceScaleFactor: 1, mobile: true,
  screenWidth: 390, screenHeight: 844,
});
await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
await send("Page.navigate", { url: "http://127.0.0.1:5173/" });
await wait(2500);
const checks = [];
checks.push(JSON.parse((await metrics()).result.value));
await screenshot("tmp/intervention-library/app-mobile-cdp.png");
await clickText("Library");
checks.push(JSON.parse((await metrics()).result.value));
await screenshot("tmp/intervention-library/library-mobile-cdp.png");
await clickText("Ignition Point");
await clickText("Begin");
checks.push(JSON.parse((await metrics()).result.value));
await screenshot("tmp/intervention-library/flagship-mobile-cdp.png");
console.log(JSON.stringify(checks));
console.log(JSON.stringify({ runtimeExceptions: exceptions }));
ws.close();
chrome.kill("SIGTERM");
