# Kanze Birthday App

A birthday gift web app for Kanze — a beautiful, animated React frontend with a candle intro, memory hub, gallery, moments, and love letter page.

## Architecture

This is a **frontend-only** React + Vite + TypeScript app. There is no backend server.

- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Routing**: React Router v6
- **Animations**: Framer Motion
- **Storage**: Supabase Storage (public bucket `kanze-birthday`) for gallery images, moments photos, and voice notes

## Key Pages

- `/` — Candle intro animation with optional PWA install prompt
- `/hub` — Memory hub with navigation to all sections
- `/gallery` — Photo/video gallery loaded from Supabase Storage `gallery/` folder
- `/moments` — Moments page loaded from Supabase Storage `moments/` folder
- `/letter` — Animated typewriter love letter with voice notes from `voice-notes/` folder

## Environment Variables

- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon/public key

These are set in Replit's shared environment. They are public-facing anon keys (safe to expose in frontend).

## Audio

Background music tracks are served from `/audio/` in the public folder:
- `background-song.mp3`
- `birkin-bag.mp3`

## Development

```bash
npm run dev    # Start dev server on port 5000
npm run build  # Build for production
```
