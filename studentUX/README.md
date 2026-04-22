# Exxat One — Student UX

Student-facing experience for Exxat One, built from the [Exxat One School 2.1](https://www.figma.com/design/lnrLD0FNFwL46Bq6Lt7sT8/Exxat-One_School_2.1) design system.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 + TypeScript |
| Build | Vite 6 + SWC |
| Styling | Tailwind CSS v4 + CSS custom properties |
| UI | Shadcn/UI + Radix UI |
| State | Zustand |
| Icons | Font Awesome Pro, Lucide React |

## Getting Started

```bash
npm i
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Key Features

- **Home** — Profile cards, todo tasks, explore opportunities, career resources
- **Jobs** — Discover jobs carousel, job list, job detail (responsive split view on desktop)
- **Leo AI** — In-app AI assistant panel
- **Design System** — Component catalog and prompt library (sidebar → Design System)

## Project Structure

```
src/
├── components/
│   ├── pages/     # Page components (Home, Jobs, etc.)
│   ├── shared/    # Shared composites (cards, sections)
│   └── ui/        # UI primitives
├── data/          # Mock data
├── stores/        # Zustand store (app-store)
└── styles/       # Global styles
```

## Environment

Copy `.env.example` to `.env` and configure any required variables (e.g. Supabase, API keys).
