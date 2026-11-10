# Copilot instructions for TUPLUS

## Project overview

This repository is a marketing website and quote estimator for TUPLUS. It is built as a static Astro site with pages under `src/pages/`, shared assets in `public/`, and a separate backend under `backend/` for quote persistence.

The frontend is published through GitHub Pages, so it must be static and self-contained. The backend is not part of the site deployment and must run in its own hosting environment.

## Build, test, and validation

There is no dedicated lint script in the root `package.json`.

Use these commands from the repo root:

```bash
npm install
npm run dev
npm run build
npm run preview
npm test
```

The root test command runs all validation in order:

```bash
npm run build
node tests/site.test.cjs
node tests/quote.test.cjs
node tests/i18n.test.cjs
```

For a single focused check, run one of the files after a build:

```bash
npm run build
node tests/site.test.cjs
node tests/quote.test.cjs
node tests/i18n.test.cjs
```

For the backend API:

```bash
cd backend/node
npm install
copy .env.example .env   # or cp .env.example .env on Unix/macOS
npm start
# or for auto-reload during development:
npm run dev
```

The backend is a separate Express + MySQL service; it is not started by the root Astro build.

## High-level architecture

- `src/pages/`: Astro page entry points such as `index.astro`, `cotizador.astro`, `privacidad.astro`, `404.astro`, and `soluciones/*.astro`.
- `public/`: static assets copied directly to the built site. This is where styles, shared scripts, translations, and images live.
- `public/js/`: frontend logic for quotes, theme behavior, country/currency logic, i18n, and page interactions. Important files include:
  - `config.js`: central business configuration values and feature toggles.
  - `cotizador.js` and `quote-core.js`: quote form calculations, pricing, summary rendering, and WhatsApp payload generation.
  - `i18n-translations.json` and `i18n-data.js`: translation source and generated runtime dictionary.
  - `script.js`, `theme.js`, `proyectos.js`, `redesign.js`, etc.: page-level interactions.
- `scripts/build-i18n-data.js`: rebuilds the generated `public/js/i18n-data.js` file from the JSON translation source.
- `backend/`: separate app code for the quote backend, with the Node implementation under `backend/node` and a legacy PHP implementation under `backend/php`.
- `backend/database/database.sql`: MySQL schema used by the backend implementations.
- `tests/`: project-level validation for the built static site and quote logic, reading from `dist/` and `public/`.

Key runtime behavior from the repo docs:

- The site is statically generated and intentionally preserves file-based URLs (`build.format: 'file'` in `astro.config.mjs`).
- GitHub Pages serves static content only; the backend needs separate hosting and is not expected to run there.
- The quote form currently defaults to the PHP flow unless `quoteBackendEnabled` is turned on in `public/js/config.js`.

## Key conventions and repo-specific patterns

### Frontend asset versioning

When editing JavaScript or CSS files, check whether the page references them with a cache-busting query string such as `?v=...`. The repo uses relative asset URLs with a version suffix to force refreshes after deploys. If you change an asset, update the version parameter in the page that references it to avoid stale browser caches.

### Translation workflow

When altering translations, do not hand-edit the generated runtime file unless absolutely necessary. Update `public/js/i18n-translations.json` and regenerate `public/js/i18n-data.js` with:

```bash
node scripts/build-i18n-data.js
```

This is a repo convention because runtime translation data is generated rather than authored directly.

### Quote logic and configuration

The quote form is a central business component, not a generic form scaffold. Relevant logic is spread across several files and should be treated as a connected system:

- `public/js/config.js`: public values, currency defaults, feature toggles, and prices.
- `public/js/cotizador.js`: form behavior and rendering.
- `public/js/quote-core.js`: business rules and pricing calculations.
- `public/js/quote-translations.js`: localized quote text.

If a pricing or UX change affects the quote flow, validate it with the quote tests and check the generated summary/WhatsApp output.

### Backend separation

The backend is intentionally separate from the static site. Do not assume the frontend can hit a local backend from GitHub Pages or from the Astro dev server unless configured explicitly. Keep API hostnames, env variables, and database configuration isolated to `backend/node` or `backend/php`.

### Styling and page structure

This project uses many CSS files under `public/css/` and page-specific variants under `public/css/soluciones/`. The codebase is organized by page/feature, not by a single global app shell. Prefer following the existing page-specific pattern rather than creating a new framework-style structure.

## Working expectations

- Prefer focused, repo-appropriate edits over broad rewrites.
- Keep the static site and backend concerns separated unless the task explicitly changes both.
- Validate the impacted page or quote behavior with the smallest relevant test command.
- For i18n or quote changes, run the relevant tests after building the site.
