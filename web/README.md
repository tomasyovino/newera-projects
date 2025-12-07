# UO New Era — Website (SSR, i18n, mock toggle)

Next.js 14 + TypeScript + Tailwind. Two languages (es/en) via `/[lang]` routes.
SSR-ready server components. Toggle mock vs API via `.env`.

## Quickstart

```bash
npm i
cp .env.example .env
npm run dev
```

Open http://localhost:3000 (auto-redirects to /es).

### Toggle data source

- **Mocked (default):** `USE_MOCK=true`
- **Real API:** set `USE_MOCK=false` and define `API_BASE_URL`, e.g. `https://api.uonewera.com`

### Structure

- `src/app/[lang]/*` — pages (Home, About, Discord, Wiki, Donate)
- `i18n/*.json` — translations (edit freely)
- `src/lib/data-source.ts` — chooses MOCK or API at runtime
- `src/mocks/*.json` — local mock data
- `src/styles/global.css` — Tailwind and CSS variables (theme palette)

### Theme palette

Derived from provided images. You can adjust CSS variables in `src/styles/global.css`:

```
--color-bg: #424f5b;
--color-surface: #8c98b4;
--color-primary: #1c2023;
--color-accent: #3e4c6a;
--color-muted: #251f34;
--color-text: #e6edf3;
--color-subtle: #9aa7b2;
```

### Timezone

Set `TZ` in `.env` (default `Europe/Madrid`) used for event schedule.

### Notes

- Replace Discord URL in `src/app/[lang]/discord/page.tsx`.
- Replace favicon/logo in `public/images/` if needed.
- Add API endpoints `/events` and `/donations` on your backend to switch off mocks.
