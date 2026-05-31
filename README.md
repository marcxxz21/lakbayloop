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
- Mock route cards, ride logs, weather, air quality, insights, and pipeline freshness data.
- Backend-ready folders for API extraction, transform logic, and Supabase clients.

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

- `profiles`
- `saved_routes`
- `route_logs`
- `weather_daily`
- `air_quality_daily`
- `route_snapshots`
- `raw_api_responses`
- `pipeline_logs`

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

The current UI uses mock data and does not require environment variables.

When Supabase integration begins, add:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Use the service role key only on the server.

## Deployment

Deploy to Vercel after the project builds:

```bash
npm run build
```

Then connect the repository in Vercel or push to the configured GitHub remote.

## Future Improvements

- Connect login and signup to Supabase Auth.
- Create Supabase tables, RLS policies, and generated TypeScript database types.
- Add Next.js route handlers for public API extraction.
- Add Vercel Cron for scheduled weather, air quality, and OSRM refreshes.
- Store raw API responses before transformation.
- Replace mock data with Supabase queries and chart aggregations.

## Screenshots

Add screenshots after the first browser QA pass:

- Mobile landing
- Mobile dashboard
- Desktop dashboard
- Routes
- Insights
- Pipeline logs
