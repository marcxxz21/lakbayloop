# LakbayLoop

Plan. Log. Learn your commute.

LakbayLoop is a responsive daily commute intelligence app for students and young adults. It uses a premium dark mobile-first interface and a desktop SaaS-style dashboard to help users save routes, log rides, monitor commute conditions, and understand mobility patterns. The project is designed as an end-to-end data engineering app using Next.js, Supabase, free public APIs, and Vercel Cron Jobs.

## Target Users

- Students who commute to campus.
- Interns and young professionals balancing school, work, and transit.
- Builders who want a compact data engineering project with a polished product surface.

## Features

- Responsive landing, login, signup, dashboard, routes, insights, and pipeline logs pages.
- Mobile app shell with floating bottom navigation.
- Desktop dashboard shell with fixed sidebar, topbar, KPI grid, route panels, charts, and pipeline table.
- Supabase-backed profile, saved routes, route logs, insights, and pipeline freshness data.
- Working add route, search routes, favorite route, log ride, and API refresh flows.
- API routes for `/api/profile`, `/api/routes`, `/api/logs`, `/api/dashboard`, `/api/insights`, and `/api/pipeline`.
- Pipeline refresh calls Open-Meteo Weather, Open-Meteo Air Quality, and OSRM, stores raw responses, transforms clean rows, and logs observability records.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn-style local UI primitives
- Lucide React
- Recharts
- Supabase Auth and PostgreSQL later
- Vercel deployment later

## UI Mockup Source

This implementation is converted from the existing project mockups:

- `lakbayloop-web.html` for the desktop dashboard shell, sidebar, auth overlay direction, KPI cards, dashboard styling, routes, insights, tables, and modals.
- `lakbayloop.html` for the mobile app flow, bottom navigation, route cards, metric cards, badges, route logging, and mobile interaction style.

## Responsive Design

The app intentionally uses two layout systems that share tokens and components:

- `MobileAppShell` below large desktop widths.
- `DesktopDashboardShell` for desktop dashboard workflows.

Mobile is stacked, touch-friendly, and app-like. Desktop is denser, scannable, and dashboard-oriented.

## Color System

The UI uses the improved dark token system from the brief:

- Blue: primary actions, selected states, route intelligence, active navigation.
- Teal: successful pipeline runs, good conditions, completed logs.
- Amber: caution, partial pipeline runs, rain warnings, moderate crowding.
- Red: failed pipeline runs, errors, poor conditions.
- White and muted white: primary and secondary text hierarchy.

## Data Engineering Architecture

```text
Free APIs
↓
Vercel Cron Job
↓
Next.js API Route
↓
Raw API Response Storage
↓
Transform Layer
↓
Clean Supabase Tables
↓
Dashboard Analytics
```

## Planned Database Schema

- `ll_app_users`
- `ll_saved_routes`
- `ll_route_logs`
- `ll_weather_daily`
- `ll_air_quality_daily`
- `ll_route_snapshots`
- `ll_raw_api_responses`
- `ll_pipeline_logs`

The `ll_` prefix keeps LakbayLoop isolated from other tables in the shared Supabase project. RLS is enabled and scoped by the `x-lakbayloop-session` request header for the current demo session. Production auth should replace this with `auth.uid()` ownership policies.

## Planned APIs

- Open-Meteo weather
- Open-Meteo air quality
- OSRM route estimates
- Manual refresh endpoint for development
- Vercel Cron route for scheduled refreshes

## Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Build Checks

```bash
npm run lint
npm run build
```

## Environment Variables

Add these locally in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

The current app only requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Use `SUPABASE_SERVICE_ROLE_KEY` only on the server if admin-only jobs are added later.

## Deployment

Deploy to Vercel after the project builds:

```bash
npm run build
```

Then connect the repository in Vercel or push to the configured GitHub remote.

## Future Improvements

- Replace demo profile login with full Supabase Auth.
- Generate TypeScript database types from Supabase.
- Add Vercel Cron for scheduled weather, air quality, and OSRM refreshes.
- Tighten RLS from session-header demo scoping to authenticated user ownership.
- Add edit route and delete log UI controls.

## Screenshots

Add screenshots after the first browser QA pass:

- Mobile landing
- Mobile dashboard
- Desktop dashboard
- Routes
- Insights
- Pipeline logs
