import { chromium } from "playwright";
import fs from "node:fs/promises";

const base = "http://127.0.0.1:4173";
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
await page.addInitScript(() => localStorage.setItem("haven_onboarded", "1"));
await fs.mkdir("qa-preview", { recursive: true });

async function snap(name, pathway) {
  await page.goto(base + "/", { waitUntil: "domcontentloaded", timeout: 15000 });
  if (pathway) {
    const state = {
      prebuilt: true,
      pathway: [pathway],
      direction: ["nextAction","signalLock"].includes(pathway) ? "focus" : pathway === "happyBump" ? "lift" : pathway === "nightChannel" || pathway === "tomorrowParking" ? "sleep" : "calm",
      directionLabel: pathway,
      intensity: 5,
      whereFelt: "both",
      timeMin: 5,
      audio: "no",
      movement: "seated"
    };
    await page.evaluate((s) => history.replaceState({ usr: s, key: "qa", idx: 0 }, "", "/reset"), state);
    await page.reload({ waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(4200);
  } else {
    await page.waitForTimeout(1200);
  }
  await page.screenshot({ path: `qa-preview/${name}.png`, fullPage: false });
  const metrics = await page.evaluate(() => ({
    innerWidth,
    innerHeight,
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight,
    bodyWidth: document.body.getBoundingClientRect().width
  }));
  console.log(name, JSON.stringify(metrics));
}

await snap("home", null);
for (const [name, id] of [
  ["thought-or-fact","factCheck"],
  ["change-scene","changeScene"],
  ["tomorrow-parking","tomorrowParking"],
  ["next-easiest-step","nextAction"],
  ["happy-bump","happyBump"],
  ["signal-lock","signalLock"],
  ["vector-shift","vectorShift"],
  ["night-channel","nightChannel"]
]) await snap(name, id);

await browser.close();
