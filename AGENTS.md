# Repository Guidelines

## Project Structure

This is an Astro static site deployed under `/tuplus/`. Pages live in `src/pages/`, reusable Astro components in `src/components/`, and shared styles and data in `src/styles/` and `src/data/`. Static JavaScript, CSS, images, and audio live in `public/` and are copied to `dist/` during the build. Node-based checks are in `tests/`; maintenance utilities are in `scripts/`. The legacy Node, PHP, and MySQL backend is in `backend/`; see its README for setup. Project notes are in `docs/`.

## Build, Test, and Development

- `npm install` installs frontend dependencies.
- `npm run dev` starts Astro on port 4321; visit `http://localhost:4321/tuplus/`.
- `npm run build` generates the static site in `dist/`.
- `npm run preview` serves the built site locally.
- `npm test` builds the site and runs the configured Node checks.
- `node scripts/build-i18n-data.js` regenerates translation data after editing `src/i18n/i18n-translations.json`.

## Coding Style and Naming

Follow the surrounding file's formatting; existing JavaScript commonly uses two-space indentation, semicolons, and single quotes. Use descriptive names and keep page-specific code near its page or in the corresponding `public/js/` or `public/css/` module. Astro routes use lowercase, hyphenated filenames. No formatter or linter is configured in the root package scripts. Linked CSS and JS get a content hash in `?v=` at build time (`scripts/optimizar-dist.mjs`); no manual cache bump is needed.

## Testing

Tests use Node's built-in assertions and, where needed, `linkedom`. Name new checks `tests/<feature>.test.cjs` and add them to the root `test` script so they run in the suite. Run `npm test` before submitting changes; individual checks can be run with `node tests/<feature>.test.cjs` after building. No coverage threshold is configured.

## Commits and Pull Requests

Recent commits use short, informal English or Spanish subjects, with no consistent prefix. Prefer a concise, descriptive imperative subject. Pull requests should explain the change and its verification, link the relevant issue when available, and include screenshots for visible UI changes. Deployment to GitHub Pages runs on pushes to `main`. For Hostinger, run `npm run build:hostinger` and upload the contents of `dist/` (including `.htaccess`) to `public_html`.

## Configuration

Copy `.env.example` to `.env` for local overrides; never commit secrets. Local `/api` requests default to the published ERP, so forms can reach the live service. Set `TUPLUS_API_PROXY_TARGET` to a local ERP when needed and restart Astro.
