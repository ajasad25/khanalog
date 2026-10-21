/**
 * Local chat loop for testing the agent without Twilio or WhatsApp.
 *
 *   npm run chat
 *
 * Needs OPENROUTER_API_KEY in .env.local. Without Upstash vars it stores your
 * data in .data/local-user.json. Type a path to a jpg/png to send a photo.
 */
import { config } from "dotenv";
import { promises as fs } from "fs";
import readline from "readline";
import { handleMessage } from "../lib/agent";

config({ path: ".env.local", quiet: true });

const USER_ID = process.env.CHAT_USER_ID || "local-user";

async function toImageDataUrl(p: string): Promise<string | undefined> {
  if (!/\.(jpe?g|png|webp)$/i.test(p)) return undefined;
  try {
    const buf = await fs.readFile(p);
    const ext = p.toLowerCase().endsWith(".png") ? "png" : p.toLowerCase().endsWith(".webp") ? "webp" : "jpeg";
    return `data:image/${ext};base64,${buf.toString("base64")}`;
  } catch {
    return undefined;
  }
}

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log("Calorie Bot (local). Type a message, or a path to a food photo. Ctrl+C to quit.\n");

  const ask = () =>
    rl.question("you> ", async (line) => {
      const text = line.trim();
      if (!text) return ask();
      try {
        const imageUrl = await toImageDataUrl(text);
        const reply = await handleMessage(USER_ID, imageUrl ? { imageUrl } : { text });
        console.log(`bot> ${reply}\n`);
      } catch (err) {
        console.error("error:", err instanceof Error ? err.message : err);
      }
      ask();
    });

  ask();
}

main();
