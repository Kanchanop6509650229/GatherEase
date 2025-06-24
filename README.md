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
   `?room=ID` query parameter. Share this full link (or use the "Share Link"
   button) so others join the exact same room.

The server requires the `sqlite3` command line tool. If you encounter errors
related to SQLite, install `sqlite3` and restart the server.
