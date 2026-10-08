# ⚡ Zolution — Frontend Web Application

Universal Multi-Tenant AI platform for WhatsApp customer communication, real-time consultation management, and appointment scheduling across any industry and business size.

---

## 🚀 Tech Stack

- **Framework:** [Next.js 16 (App Router)](https://nextjs.org) with React 19
- **Styling:** Tailwind CSS v4 with OKLCH design tokens & Lucide React
- **Component Primitives:** Radix UI / shadcn/ui components
- **Architecture:** Client-side API client with multi-tenant header propagation (`X-Organization-ID`)
- **Themes:** Dark & Light mode support

---

## 📁 Key Routes & Views

| Route | Purpose |
|---|---|
| `/` | **Overview Dashboard:** Multi-sector KPIs, live WhatsApp activity stream, and AI tool calling monitor. |
| `/login` | **Universal Access & Tenant Switcher:** Switch between legal, tech, healthcare, and spa demo organizations or register a new business. |
| `/onboarding` | **Universal Setup Wizard:** 4-step wizard that configures services, business hours, and generates an optimized system prompt for the AI agent. |
| `/agent` | **Agent Configuration & Simulator:** Prompt tuning, LLM provider selection (Claude, GPT-4o, Gemini), and live WhatsApp preview. |
| `/conversations` | **WhatsApp Live Inbox:** Monitor live chat threads between customers and the AI agent with sentiment and status tags. |
| `/appointments` | **Calendar & Bookings:** Google Calendar real-time slot checker and manual appointment booking modal. |
| `/integrations` | **Third-Party Connections:** Google Calendar OAuth authorization and WhatsApp Cloud API webhook configuration. |

---

## 🛠️ Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. **Start local development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Deployment on Vercel

This repository is optimized for zero-config deployment on [Vercel](https://vercel.com):

1. **Create New Project** in Vercel.
2. Select **Import Git Repository** and choose `andresZam12/Zolution_front`.
3. **Project Settings:**
   - **Framework Preset:** Next.js
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
4. **Environment Variables:**
   - `NEXT_PUBLIC_API_URL`: Your deployed Render backend URL (e.g., `https://zolution-api.onrender.com`).
5. Click **Deploy**.
