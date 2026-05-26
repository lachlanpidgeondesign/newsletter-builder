# Newsletter Builder

A drag-and-drop builder for HTML newsletters. Outputs email-safe HTML via [MJML](https://mjml.io) that you can paste into Sailthru (or any ESP).

## What this is

- **Static site** — pure browser, no backend, no database.
- **MJML under the hood** — your blocks compile to bulletproof table-based HTML.
- **Local autosave** — drafts persist in your browser via `localStorage`.
- **Share drafts as JSON** — export/import for handing off between teammates.

## Run locally

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
- `src/App.jsx` — top-level editor: palette, canvas, preview, HTML view, drag-and-drop via `@dnd-kit`.
