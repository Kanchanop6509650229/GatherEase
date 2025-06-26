# GatherEase

GatherEase is a small demo built with **Next.js** and **Firebase App Hosting**.
It helps a group decide when and where to meet by combining date polling with
AI‑powered restaurant suggestions. Participant responses are now stored in a
local **SQLite** database so that everyone accessing the same link can see the
same data.

## Features

- **Date Polling** – collect each participant's availability.
- **Availability Matrix** – visualize responses and pick the best date.
- **Restaurant Suggestions** – use an AI flow to recommend places based on
  location and dietary needs.

The core logic lives in [`src/app/page.tsx`](src/app/page.tsx) and the AI flow
is defined in [`src/ai/flows/suggest-restaurant.ts`](src/ai/flows/suggest-restaurant.ts).

## Development

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the Next.js dev server

   ```bash
   npm run dev
   ```

   This command will automatically create `db.sqlite` in the project root if it
   doesn't already exist.

3. In a separate terminal, run the Genkit development server for the AI flow

   ```bash
   npm run genkit:dev
   ```

## Building

To create a production build use:

```bash
npm run build
```

and then start the server with `npm start`.

## Deploying to Vercel

Vercel's serverless functions run on a read-only filesystem, so the local
`db.sqlite` file cannot be created. GatherEase automatically connects to a
Postgres database when the `POSTGRES_URL` environment variable is defined.
Provision a Vercel Postgres instance (or any external Postgres database) and set
`POSTGRES_URL` in your project settings. If this variable is not set, the app
falls back to the local SQLite database.

## Notes

The AI flow relies on environment variables for authentication with Google AI
models. Create a `.env` file in the project root with the necessary keys before
running `npm run genkit:dev`.

## Using the App with Multiple Devices

GatherEase stores participant responses in a local `db.sqlite` file on the
server. To ensure everyone sees the same information:

1. **Run a single server instance.** Start `npm run dev` on one machine and make
   sure other devices access the app via this server's URL.
2. **Share the room link.** When a room is created, the page URL contains a
   `?room=ID` query parameter. Share this full link (or use the "Share Your Room"
   button) so others join the exact same room.

GatherEase uses an embedded SQLite database and will create `db.sqlite`
automatically on startup. No external SQLite installation is required.
