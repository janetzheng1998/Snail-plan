# Snail Plan

Snail Plan is an AI-powered planning and reflection web app for long-term personal growth.

It helps users turn messy notes from daily learning, training, or work sessions into structured progress records, reflection insights, and visible growth trajectories.

> Slow progress still counts. What matters is keeping a record of every step forward.

## Live Demo

[Open Snail Plan](https://snailplan.edgeone.dev)

## Product Overview

Many personal growth goals are not simple tasks that can be checked off once. Learning singing, building a fitness habit, practicing badminton, improving writing, or pushing a side project forward all require repeated practice, reflection, and adjustment.

Snail Plan is designed around this loop:

1. Create a long-term plan that has already started.
2. Add a short record after each practice, session, or progress update.
3. Let AI organize the messy input into clear reflection sections.
4. Review the plan archive and growth calendar over time.
5. Manually mark a plan as completed when the user feels the stage is finished.

The goal is not to pressure users into moving faster, but to help them notice progress, identify patterns, and keep going.

## Core Features

- Create long-term growth plans with fixed or open-ended targets.
- Support flexible measurement units such as sessions, days, hours, or irregular plans.
- Add messy text records after each learning or training session.
- Use AI to organize records into progress, blockers, possible causes, and next actions.
- Store records locally during the MVP stage.
- View plan archives with clickable record details.
- Explore growth history through a calendar-style check-in view.
- Mobile-responsive UI optimized for lightweight daily use.

## AI Reflection Structure

For each record, the AI coach generates:

- Cleaned original record
- One-sentence reflection
- Progress made
- Key findings
- Current blockers
- Possible reasons
- Concrete next actions
- Reminders for the next record

The prompt is designed to avoid shallow rewriting. Instead of simply paraphrasing the user’s text, the AI is guided to provide practical coaching-style feedback.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- App Router
- DeepSeek API
- Tencent EdgeOne deployment
- Vercel deployment support

## Project Structure

```text
src/
  app/
    api/organize/        # Next.js API route for AI organization
    calendar/            # Growth calendar page
    plans/               # Plan list, plan detail, new plan, new record pages
    page.tsx             # Home page
  components/
    home/                # Home hero and animation components
    plans/               # Plan cards, record forms, calendar, detail views
    ui/                  # Reusable UI components
  lib/
    mock-data.ts         # Mock data for the MVP
    local-plans.ts       # Local plan persistence
    local-records.ts     # Local record persistence
functions/
  api/organize.ts        # EdgeOne function for AI organization
```

## Getting Started

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp env.example .env.local
```

Add your DeepSeek API key:

```bash
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_MODEL=deepseek-chat
```

Run the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

If port 3000 is already in use, run:

```bash
npm run dev -- -p 3001
```

## Environment Variables

```text
DEEPSEEK_API_KEY
DEEPSEEK_MODEL
NEXT_PUBLIC_ORGANIZE_API_URL
ORGANIZE_API_ALLOWED_ORIGIN
```

`DEEPSEEK_API_KEY` should only be stored on the server side. Do not expose it in frontend code.

`NEXT_PUBLIC_ORGANIZE_API_URL` is optional. It can be used when the frontend is deployed on one platform and the AI API is deployed elsewhere.

## Deployment Notes

The project supports deployment on Vercel and Tencent EdgeOne.

Vercel works well for standard Next.js hosting and API routes.

Tencent EdgeOne is used to improve accessibility for users in mainland China. The EdgeOne function under `functions/api/organize.ts` calls the DeepSeek API directly, so the EdgeOne deployment can keep the AI feature available without relying only on Vercel.

## Current MVP Limitations

- User data is stored in the browser through local storage.
- There is no authentication system yet.
- Records are not synced across devices.
- The current version is suitable for demo, portfolio, competition, and small-scale testing.

## Future Improvements

- Add Supabase for persistent cloud storage.
- Add authentication and user-specific plan data.
- Add API usage limits and basic abuse protection.
- Add richer plan completion summaries.
- Add shareable growth cards for social media.
- Add voice-to-text support for faster record input.

## Why I Built This

Snail Plan was built as a from-zero-to-one AI web app project. The focus was not only on implementing pages, but also on shaping a product experience around a real user behavior: long-term growth through repeated action and reflection.

The project covers product design, information architecture, frontend implementation, AI API integration, responsive design, deployment, and China-accessible hosting.

