# Studyverse Pro

A futuristic learning dashboard built with React, TypeScript, and Vite. Study progress, quiz results, upgrades, achievements, XP, and coins are saved in the browser.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Create a production build with `npm run build`.

### Configure the AI Tutor

The tutor calls OpenAI's Responses API through a server-side endpoint. Its API key is never sent to the browser.

1. Copy `.env.example` to `.env` in the project root:

   ```powershell
   Copy-Item .env.example .env
   ```
2. Open `.env` and replace the placeholder with your OpenAI API key:

   ```dotenv
   OPENAI_API_KEY=your_real_key_here
   ```
3. Restart the Vite development server after saving the file. `.env` is ignored by Git; do not commit or share it.

`OPENAI_MODEL` is optional and defaults to `gpt-4.1-mini`. The tutor supports explanations, practice quiz generation, correct-answer explanations, and incorrect-answer analysis. Responses follow the language of the question, including natural Korean responses to Korean questions.

Troubleshooting: `.env` must be in the project root, alongside `package.json` and `vite.config.ts`. On startup, the Vite server logs whether the key is configured without showing its value. During local development, a key in the project `.env` takes precedence over an inherited shell environment variable. Submit a tutor question to test the connection; development errors show a sanitized OpenAI diagnostic in the browser developer console and the server terminal. A 401 `invalid_api_key` means the configured key was rejected: replace it with a valid key in `.env`, or update the Vercel environment variable, then restart/redeploy. Check model access for model errors and OpenAI billing/usage limits for quota errors. Never paste or share the key in logs, screenshots, chat, or browser code.

## Deploy publicly with Vercel

1. Push this project to a GitHub repository.
2. Sign in to [Vercel](https://vercel.com/) and choose **Add New → Project**.
3. Import the GitHub repository. Vercel detects Vite; use these settings if prompted:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
   - **Install command:** `npm install`
4. Before deploying, open the Vercel project **Settings → Environment Variables** and add `OPENAI_API_KEY` with your OpenAI API key. Select the environments you use (at least **Production**; add **Preview** and **Development** if needed). Optionally add `OPENAI_MODEL` to select a different supported model.
5. Choose **Deploy**. When the deployment finishes, Vercel provides a public `*.vercel.app` URL. Share that URL with your friends. Later pushes to the connected branch deploy updates automatically.

If you add or change an environment variable after deployment, redeploy the project for the change to take effect. Keep the key in Vercel's server-side environment settings only—never add it to source files, client-side code, or a `VITE_` variable. The tutor endpoint is public like the rest of the site, so visitors can trigger usage billed to your OpenAI account; set an appropriate usage limit and add authentication or distributed rate limiting before sharing beyond a trusted audience. The included `vercel.json` sends app routes to the Vite entry point so refreshing or directly opening a route works; `/api/chat` is handled by the Vercel serverless function. The app has no account system: profile progress is saved in each visitor's own browser.

## Features

- **Overview:** subject progress, level progression, weekly activity, and learning shortcuts.
- **AI Tutor:** an OpenAI-powered, subject-aware tutor with guided prompts, Korean-language support, quiz generation, answer explanations, and incorrect-answer analysis. The API key remains on the server in local development and on Vercel.
- **Quiz Lab:** subject-specific, three-question quizzes with step-by-step explanations, answer feedback, XP, and coin rewards.
- **Battle Arena:** a playable 2D survival game. Move with **WASD** or **arrow keys**, aim with the mouse, and hold to shoot. Touchscreen players can use the on-screen movement pad and fire button. Monsters chase the player; bosses arrive as takedowns accumulate. Random health, ammo, damage, speed, shield, and rapid-fire drops appear during a run, can be collected by walking over them, and expire if left behind. Weapon upgrades and repair kits are available in the shop.
- **Achievements:** track learning milestones and claim XP/coin rewards.
- **Persistence:** profile and progress are stored in `localStorage` under `studyverse-pro-profile-v1`.

## Tech

React 18 · TypeScript · Vite · Lucide
