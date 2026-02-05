# Arma Unit ORBAT Website (Blank Repo)

This repo is designed to be **branched per-unit**.
To configure a new unit, you should only need to edit **one file**:

- `src/config/unit-config.json`

Everything “unit-specific” (names, titles, logos, terminal text, Google Sheets URLs, rank icon paths, etc.) should live there.

---

## Quick start

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

---

## The only file you edit

### `src/config/unit-config.json`

Minimum required keys:

- `unit.name`
- `unit.tagline`
- `defaultTitle`
- `icon`
- `branding.headerLogo`
- `branding.ghostLogo`
- `header.*`
- `sheets.*CsvUrl`

See the file itself for examples and defaults.

---

## Google Sheets → CSV

You need **3 published CSV URLs** (one per tab):

- `membersCsvUrl`
- `refDataCsvUrl`
- `opsCsvUrl`

Open your sheet → **File → Share → Publish to web** → choose the tab → **CSV** → Publish → copy the URL into `unit-config.json`.

---

## Netlify + Google Apps Script (admin / deployment)

This template expects a Netlify function proxy at:

- `deployment.execUrl` (default `/.netlify/functions/gas`)

Netlify settings:
- Add your Google Apps Script URL as an env var (see `.env.example`)
- Deploy

---

## Assets

You can keep the repo “blank” and just swap files in `public/` (logos, rank icons, etc.).
Paths for all branding assets are referenced from `unit-config.json`.

---

## Branching workflow (recommended)

1. Keep `main` as your blank “golden” repo
2. Create a new branch for a unit
3. Edit `src/config/unit-config.json`
4. Deploy / iterate
5. Transfer repo ownership when done

