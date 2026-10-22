/**
 * Render for-linkedin/khanalog/slides.html into PNGs (one per slide) and a PDF.
 *
 *   npx tsx scripts/carousel.ts
 */
import { promises as fs } from "fs";
import path from "path";
import puppeteer from "puppeteer-core";

const DIR = path.resolve("for-linkedin", "khanalog");
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";

async function main() {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 2 });
  await page.goto(`file:///${path.join(DIR, "slides.html").replace(/\\/g, "/")}`, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);

  const slides = await page.$$("section.slide");
  await fs.mkdir(path.join(DIR, "out"), { recursive: true });
  for (let i = 0; i < slides.length; i++) {
    const file = path.join(DIR, "out", `slide-${i + 1}.png`);
    await slides[i].screenshot({ path: file as `${string}.png` });
    console.log("saved", file);
  }

  // PDF: one slide per page, exact size.
  await page.addStyleTag({ content: "@page { size: 1080px 1350px; margin: 0 } body { background: none } section.slide { page-break-after: always }" });
  await page.pdf({ path: path.join(DIR, "out", "khanalog-carousel.pdf"), width: "1080px", height: "1350px", printBackground: true, preferCSSPageSize: true });
  console.log("saved", path.join(DIR, "out", "khanalog-carousel.pdf"));
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
