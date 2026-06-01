# Kalakbay

Your daily commute companion.

Kalakbay is a responsive commute-tracking and route-logging app for everyday riders. It helps users save regular trips, search real addresses, estimate routes, log ride experiences, track live movement, and understand commute patterns through a Supabase-backed dashboard.

The app is built as a polished data engineering project: public mobility/weather APIs feed route context, Supabase stores user-scoped data, and Next.js API routes transform that data into dashboard metrics, insights, maps, and logs.

## Current Status

- Rebranded from LakbayLoop to Kalakbay.
- GitHub repository renamed to `marcxxz21/kalakbay`.
- Local project folder renamed to `kalakbay`.
- Vercel production deployments are working from Git pushes, but the Vercel project/domain still need to be renamed in the Vercel dashboard because the connector does not expose a project-rename action.
- The app uses local email-based profiles instead of Supabase Auth email confirmation, avoiding email rate-limit issues while still storing data in Supabase by browser profile/session.

## Target Users

- Commuters of all ages with recurring routes, errands, appointments, work, school, or caregiving trips.
- Riders who combine walking, jeepney, bus, train, bike, car, and mixed commutes.
- People who want a quick way to compare estimated travel time with actual commute experience.
- Builders reviewing a compact full-stack data engineering app with a product-quality interface.

## Features

- Local profile creation and login by email, backed by Supabase tables.
- Dashboard with saved route count, monthly logs, average commute time, pipeline status, daily commute context, weather/air-quality chart, favorite routes, and recent logs.
- Time-aware personalized greetings such as Good morning, Good afternoon, and Good night.
- Route library with search, filtering, favorites, route details modal, and log-ride shortcuts.
- Add route flow with searchable start and end addresses through OpenStreetMap Nominatim.
- Multi-mode commute support, including combinations such as Jeepney + Bus + Walking.
- Route logging from either a saved route or a newly created route.
- Log form captures travel date, actual minutes, crowd level, experience rating, notes, and modes used.
- Insights page with average commute duration, most-used route, average rating, common crowd level, route usage, crowd distribution, and recent trends.
- Tracking page with a map-first interface, draggable/zoomable OpenStreetMap tiles, route geometry, real-time location samples, ETA, arrival estimate, remaining distance, elapsed time, speed, and street-by-street directions from OSRM.
- Pipeline page for manual refreshes and observability around weather, air quality, and routing data pulls.
- Settings/profile page for updating name, email context, workplace or regular destination, and preferred commute modes.
- Mobile app shell with bottom navigation and desktop shell with fixed sidebar/topbar.
- Kalakbay logo and browser tab icon wired into the app.

## Pages

- `/` - Landing page
- `/auth/signup` - Create local Kalakbay profile
- `/auth/login` - Open existing local profile by email
- `/auth/reset` - No-password/reset explanation
- `/dashboard` - Main commute dashboard
- `/routes` - Saved route library, filters, favorites, details, and add route
- `/logs` - Commute logging flow
- `/tracking` - Live route tracking map
- `/insights` - Commute analytics and patterns
- `/pipeline` - Data refresh and pipeline status
- `/settings` - Profile/settings tab

## API Routes

- `/api/local-auth` - Local profile lookup and creation
- `/api/profile` - Profile read/update
- `/api/routes` - Saved route list/create/update support
- `/api/routes/[id]` - Route-specific updates
- `/api/logs` - Route log list/create
- `/api/dashboard` - Dashboard metrics and commute context
- `/api/insights` - Aggregated commute insights
- `/api/tracking` - Tracking point storage and retrieval
- `/api/geocode` - Address search through Nominatim
- `/api/directions` - OSRM route geometry and street directions
- `/api/pipeline` - Manual refresh of weather, air quality, route snapshots, and pipeline logs

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Local shadcn-style UI primitives
- Lucide React icons
- Recharts
- Supabase JavaScript client
- Supabase Postgres
- Next.js API routes
- Vercel deployment

## External APIs

- OpenStreetMap Nominatim for address and landmark search.
- OSRM for route geometry, estimated duration, route distance, and street-by-street directions.
- Open-Meteo Forecast API for weather and rain probability.
- Open-Meteo Air Quality API for AQI context.
- OpenStreetMap tile server for map tiles.

## Database

Kalakbay uses Supabase Postgres with `ll_`-prefixed tables:

- `ll_app_users`
- `ll_saved_routes`
- `ll_route_logs`
- `ll_tracking_points`
- `ll_weather_daily`
- `ll_air_quality_daily`
- `ll_route_snapshots`
- `ll_raw_api_responses`
- `ll_pipeline_logs`

Data is scoped by the current browser profile/session using the `x-lakbayloop-session` request header. This keeps multiple local profiles separated without requiring Supabase email confirmation.

## Data Flow

```text
User actions
↓
Next.js pages and forms
↓
Next.js API routes
↓
Supabase Postgres
↓
Dashboard, insights, logs, and tracking UI
```

```text
Nominatim / OSRM / Open-Meteo
↓
Next.js API transformation layer
↓
Raw API response storage
↓
Clean commute context tables
↓
Dashboard and pipeline analytics
```

## Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPEN_METEO_FORECAST_URL=
OPEN_METEO_AIR_QUALITY_URL=
OSRM_ROUTE_URL=
NOMINATIM_SEARCH_URL=
NOMINATIM_COUNTRYCODES=ph
```

Only the Supabase URL and publishable key are required for normal app usage. The API URL variables are optional overrides because the app has defaults for the public providers.

## Build Checks

```bash
npm run lint
npm run build
```

## Deployment

The app is deployed through Vercel from the GitHub repository. Pushing to `main` triggers the connected Vercel production deployment.

Current follow-up for deployment branding:

- Rename the Vercel project from `lakbayloop` to `kalakbay`.
- Move the production domain from `lakbayloop.vercel.app` to a Kalakbay-branded Vercel domain or custom domain.

## Future Improvements

- Rename the Vercel project/domain to match Kalakbay.
- Add route editing and route deletion controls.
- Add log editing/deletion.
- Add richer notification functionality instead of static notification UI.
- Add optional full Supabase Auth if production account security becomes a priority.
- Add scheduled Vercel Cron refreshes for weather, air quality, and route snapshots.
- Generate typed Supabase database definitions for stricter end-to-end typing.
