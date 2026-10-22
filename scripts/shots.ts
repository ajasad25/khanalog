/**
 * Capture real screenshots of the running app for the LinkedIn carousel.
 *
 *   npm run build && npm start   (in another terminal)
 *   npx tsx scripts/shots.ts
 *
 * Starts a demo sandbox, seeds a realistic day through the real chat API
 * (three model calls), then screenshots each screen at 2x.
 */
import { promises as fs } from "fs";
import path from "path";
import puppeteer from "puppeteer-core";

const BASE = process.env.SHOTS_BASE || "http://localhost:3000";
const OUT = process.env.SHOTS_OUT || path.join("for-linkedin", "khanalog", "shots");
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]);

  const shot = async (name: string, opts: { fullPage?: boolean } = {}) => {
    await new Promise((r) => setTimeout(r, 800));
    const file = path.join(OUT, `${name}.png`);
    await page.screenshot({ path: file as `${string}.png`, fullPage: opts.fullPage ?? false });
    console.log("saved", file);
  };

  // Public pages
  await page.goto(`${BASE}/`, { waitUntil: "networkidle0" });
  await shot("landing");
  await shot("landing-full", { fullPage: true });
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle0" });
  await shot("login");

  // Demo sandbox + seed a day
  await page.goto(`${BASE}/`, { waitUntil: "networkidle0" });
  await page.evaluate(async () => {
    await fetch("/api/auth/demo", { method: "POST" });
  });
  const say = async (text: string) => {
    const reply = await page.evaluate(async (t) => {
      const r = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: t }) });
      const j = await r.json();
      return j.reply ?? j.error;
    }, text);
    console.log(`> ${text}\n  ${String(reply).split("\n")[0]}`);
  };
  await say("I'm 62kg, 160cm, 25, female, lightly active and want to lose weight. I live in Karachi.");
  await say("had chai and 2 parathas for breakfast");
  await say("walked 6000 steps");

  await page.goto(`${BASE}/chat`, { waitUntil: "networkidle0" });
  await shot("chat");
  await page.goto(`${BASE}/today`, { waitUntil: "networkidle0" });
  await shot("today");
  await page.goto(`${BASE}/profile`, { waitUntil: "networkidle0" });
  await shot("profile");

  // Phone-sized chat for a portrait slide
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3 });
  await page.goto(`${BASE}/chat`, { waitUntil: "networkidle0" });
  await shot("chat-mobile");
  await page.goto(`${BASE}/today`, { waitUntil: "networkidle0" });
  await shot("today-mobile");

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
