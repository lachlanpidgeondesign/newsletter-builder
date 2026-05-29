# Newsletter Builder

A drag-and-drop builder for HTML newsletters. Outputs email-safe HTML via [MJML](https://mjml.io) that you can paste into Sailthru (or any ESP).

## What this is

- **Static frontend** — Vite + React app deployed to GitHub Pages.
- **MJML under the hood** — your blocks compile to bulletproof table-based HTML.
- **Local autosave** — drafts persist in your browser via `localStorage`.
- **Share drafts as JSON** — export/import for handing off between teammates.
- **Shared editions via Supabase** — authenticated users can save, update, load, and delete named editions.

## Run locally

Create a local env file before starting the app:

```bash
cp .env.example .env.local
```

Then fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`.

If your editions table is not in `public.editions`, also set:

- `VITE_SUPABASE_DB_SCHEMA` (default: `public`)
- `VITE_SUPABASE_EDITIONS_TABLE` (default: `editions`)

For Google OAuth, you can optionally set:

- `VITE_SUPABASE_AUTH_REDIRECT_TO` (default: current app URL)

In Supabase Auth settings, ensure your site URL and redirect URL allow-list include your local URL and your GitHub Pages URL.

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Build for production

```bash
npm run build
```

Output lands in `dist/`.

## Deploy to GitHub Pages

1. Push this repo to GitHub.
2. In repo **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Push to `main`. The workflow in `.github/workflows/deploy.yml` builds and deploys automatically.
4. Your site lives at `https://<user>.github.io/<repo>/`.

### Custom domain (optional)

If you point a domain at the Pages site:

1. Add the domain in **Settings → Pages → Custom domain**.
2. Add a `public/CNAME` file containing the domain.
3. Change `base: "./"` in `vite.config.js` to `base: "/"` so asset paths resolve from the root.

## Adding new block types

Each block lives in `src/blocks/` and is registered in `src/blocks/index.js`. To add one:

1. Create `MyBlockEditor.jsx` in `src/blocks/` — the React component shown in the canvas.
2. Add an entry to `BLOCK_TYPES` in `src/blocks/index.js` with `label`, `icon`, `Editor`, `create()`, and `toMJML(block)`.

The MJML output is what determines email rendering. Reference the [MJML component docs](https://documentation.mjml.io/#components) for available tags (`mj-section`, `mj-column`, `mj-button`, `mj-image`, `mj-divider`, etc.).

## Testing emails

Before sending: paste the compiled HTML into Sailthru, send a test to:

- Gmail (web + iOS app)
- Outlook (desktop on Windows is the strictest renderer)
- Apple Mail

MJML handles most edge cases, but dark mode behavior varies by client and is worth eyeballing.

## Architecture notes

- `src/blocks/` — block definitions. Each has an editor component and a `toMJML()` function.
- `src/lib/mjml.js` — wraps blocks in document scaffolding, runs `mjml-browser` to compile.
- `src/lib/storage.js` — localStorage autosave + JSON file import/export.
- `src/lib/supabase.js` — Supabase client initialization from Vite env variables.
- `src/lib/auth.js` — Google sign-in/sign-out + auth user hook.
- `src/lib/editions.js` — CRUD helpers for named editions in Supabase.
- `src/App.jsx` — top-level editor: palette, canvas, preview, drag-and-drop via `@dnd-kit`, plus edition save/load controls.

## Auth model

- The editor remains open to everyone for local work (autosave + JSON import/export still work without sign-in).
- Named edition storage is gated behind Google sign-in.
- The app uses Supabase auth on the client (`signInWithOAuth` Google provider).
- Supabase row-level security enforces domain-restricted access on the `editions` table.
- In the UI, edition save/load actions are hidden behind sign-in, while core editing remains available.
