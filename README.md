# TalentFlow (recruit-ai)

AI-powered candidate screening pipeline. Upload a resume, paste a job description, and get instant AI analysis.

**Live:** [recruit.elunari.uk](https://recruit.elunari.uk)

## Features

- **Resume Parsing** — Extracts structured data (contact, skills, experience, education) from PDF/TXT
- **6-Axis Scoring** — Evaluates candidate fit against a job description across multiple dimensions
- **Interview Questions** — Generates tailored screening questions based on gaps and strengths
- **Summary View** — Combined overview of score + questions with clickable navigation
- **Auto-Pilot** — One-click full pipeline execution with JD templates
- **History** — Local storage of past analyses with instant reload
- **PDF Export** — Download complete analysis reports
- **Mobile-First** — Responsive design with descriptive step icons

## Tech Stack

- Next.js 16, React 19, TypeScript
- Framer Motion (animations)
- OpenRouter (LLM API — Llama 3.3 70B, Gemma 3 27B, Mistral Small 3.1)
- Tailwind CSS 4
- Vercel (hosting)
- Cloudflare (DNS)

## Getting Started

```bash
npm install
npm run dev
```

Set `OPENROUTER_API_KEY` in your environment.

Open [http://localhost:3000](http://localhost:3000).
