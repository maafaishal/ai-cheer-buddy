import fs from "node:fs/promises";
import express from "express";

import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

import "dotenv/config";

// Constants
const isProduction = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || "/";

// Cached production assets
const templateHtml = isProduction
  ? await fs.readFile("./dist/client/index.html", "utf-8")
  : "";

const getPrompt = (situation, language) => `
  Given this situation: "${situation}", first **analyze the situation carefully** to understand its context, emotional tone, and the challenges involved. Based on this detailed understanding, provide exactly 3 **unique and relevant** quotes that can help someone feel better. The quotes should be **directly related to the situation** and provide emotional support, motivation, or practical advice for overcoming the difficulty.

  Each quote **must be from a different category**, such as:  
  1. **Ancient wisdom or philosophy** (e.g., from Stoicism, Confucianism, or old proverbs)  
  2. **Modern authors, scientists, or leaders** (20th century to present)  
  3. **A surprising or unexpected source** (e.g., songs, movies, cultural sayings, folklore)  

  Ensure each quote is **distinct in meaning and phrasing**. Avoid using similar themes across all three.  

  For each quote, return:  
  1. The quote itself  
  2. The author's name  
  3. A **clear, actionable explanation** that offers both emotional support and **practical advice or steps** the user can take to improve their situation. The explanation should be **simple and engaging**, with **emojis** to make it approachable. The focus should be on suggesting solutions, such as mindset shifts, coping strategies, or small actions to move forward.


  The user prefers in ${language} for the explanation. Keep the quote in English.

  Please be careful, the result format must be: '"[quote]" - [author] | [explanation]' || '"[quote]" - [author] | [explanation]'. Separate each quote with "||".  
`;

// Create http server
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log("import.meta.env.OPEN_AI_API_KEY", process.env.OPEN_AI_API_KEY);

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
const openAIClient = new OpenAI({
  apiKey: process.env.OPEN_AI_API_KEY,
  dangerouslyAllowBrowser: true,
});

// Add Vite or respective production middlewares
/** @type {import('vite').ViteDevServer | undefined} */
let vite;
if (!isProduction) {
  const { createServer } = await import("vite");
  vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
    base,
  });
  app.use(vite.middlewares);
} else {
  const compression = (await import("compression")).default;
  const sirv = (await import("sirv")).default;
  app.use(compression());
  app.use(base, sirv("./dist/client", { extensions: [] }));
}

app.post("/api/gemini", async (req, res) => {
  const { situation, language } = req.body;

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(getPrompt(situation, language));
  const response = result.response.text();

  res.json({ response });
});

app.post("/api/gpt", async (req, res) => {
  const { situation, language } = req.body;

  const completion = await openAIClient.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: getPrompt(situation, language),
      },
    ],
  });

  response = completion.choices[0].message.content || "";

  res.json({ response });
});

// Serve HTML
app.use("*all", async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, "");

    /** @type {string} */
    let template;
    /** @type {import('./src/entry-server.ts').render} */
    let render;
    if (!isProduction) {
      // Always read fresh template in development
      template = await fs.readFile("./index.html", "utf-8");
      template = await vite.transformIndexHtml(url, template);
      render = (await vite.ssrLoadModule("/src/entry-server.tsx")).render;
    } else {
      template = templateHtml;
      render = (await import("./dist/server/entry-server.js")).render;
    }

    const rendered = await render(url);

    const html = template
      .replace(`<!--app-head-->`, rendered.head ?? "")
      .replace(`<!--app-html-->`, rendered.html ?? "");

    res.status(200).set({ "Content-Type": "text/html" }).send(html);
  } catch (e) {
    vite?.ssrFixStacktrace(e);
    console.log(e.stack);
    res.status(500).end(e.stack);
    console.log("🚀 ~ app.use ~ e:", e);
  }
});

// Start http server
app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
