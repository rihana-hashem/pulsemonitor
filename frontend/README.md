# PulseMonitor frontend

React + TypeScript single-page app for the PulseMonitor dashboard, built with [Vite](https://vite.dev).

## Requirements

- Node.js 24 LTS (Vite requires Node 20.19+ or 22.12+)

## Connecting to the API

In development the Vite dev server proxies `/api` and `/health` to the .NET API at
`http://localhost:5184` (start it with `dotnet run --launch-profile http` in `src/PulseMonitor.Api`).
To point elsewhere, copy `.env.example` to `.env.local` and change `VITE_API_PROXY_TARGET`.

The header shows an API status chip that polls `/health/ready` every 30 seconds.

## Signing in

Create an account on the sign-up page (new accounts get the read-only **User** role), or sign in
as the bootstrap admin: user name `admin`, password from the API's user-secrets
(`dotnet user-secrets list --project src/PulseMonitor.Api`).

The access token is kept in memory only; the refresh token is an httpOnly cookie the browser
sends to `/api/v1/auth` automatically. Reloading the page restores the session from that cookie.

## Scripts

| Command | What it does |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Start the dev server with hot reload at http://localhost:5173 |
| `npm run lint` | Lint with [oxlint](https://oxc.rs/docs/guide/usage/linter) |
| `npm run build` | Type-check (`tsc -b`) and build to `dist/` |
| `npm run preview` | Serve the production build locally |
