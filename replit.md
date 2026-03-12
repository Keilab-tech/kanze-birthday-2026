# Kanze Birthday App

A birthday gift web app for Kanze — a beautiful, animated React frontend with a candle intro, memory hub, gallery, moments, and love letter page.

## Architecture

Full-stack app: Express backend + React/Vite frontend, all served on port 5000.

- **Frontend**: React 18 + Vite + TypeScript
- **Backend**: Express.js (TypeScript, run via tsx)
- **Database**: Replit PostgreSQL via Drizzle ORM
- **File Storage**: Local filesystem (`uploads/` directory, served as static files)
- **Styling**: Tailwind CSS + shadcn/ui
- **Routing**: React Router v6
- **Animations**: Framer Motion

## Key Pages

- `/` — Candle intro animation with optional PWA install prompt
- `/hub` — Memory hub with photo slider and navigation
- `/gallery` — Photo/video gallery
- `/moments` — Moments page  
- `/letter` — Animated typewriter love letter with voice notes

## API Endpoints

- `GET /api/media/:folder` — List all media in a folder (gallery, moments, voice-notes)
- `POST /api/media/:folder` — Upload a new media file to a folder
- `DELETE /api/media/:id` — Delete a media file by ID

## File Structure

```
server/
  index.ts      — Express entry point (port 5000, embeds Vite in dev)
  routes.ts     — API route handlers + multer file upload
  storage.ts    — Drizzle database storage interface
  db.ts         — PostgreSQL connection via Drizzle
  vite.ts       — Vite dev middleware integration
shared/
  schema.ts     — Drizzle schema (media_files table)
src/            — React frontend
uploads/        — Uploaded media files (served as static)
```

## How to Add Media

Upload files via `POST /api/media/gallery`, `POST /api/media/moments`, or `POST /api/media/voice-notes`.
Accepted formats: jpg, jpeg, png, webp (images), mp4, webm, mov (videos), and audio files.

## Development

```bash
npx tsx server/index.ts   # Start dev server (workflow command)
npx drizzle-kit push      # Push schema changes to database
```
