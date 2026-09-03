# tvmaze-catalog

Feature remote for the ABN AMRO TVmaze frontend assessment.

## What this exposes

Module Federation remote name: `tvmaze_catalog`

| Expose | Description |
| --- | --- |
| `./DashboardPage` | Genre dashboard (sorted by rating) |
| `./SearchPage` | Debounced name search |
| `./ShowDetailsPage` | Show details with sanitised summary |

Owns the TVmaze API client, genre grouping, rating sort, and Pinia catalog store. Consumes `tvmaze_ui` for presentational components and **theme** (`tvmaze_ui/styles`) — catalog does not own brand tokens.

## Requirements

- Node.js `20.19.0+` (Storybook 10)
- npm `10.2.4+`
- Sibling checkout of `tvmaze-ui` at `../tvmaze-ui` (for Storybook path aliases and unit-test aliases)

## Local development

This remote defaults to the **deployed** `tvmaze_ui` entry, so it runs on its own:

```bash
npm install
npm run dev
```

Dev server: [http://localhost:5002](http://localhost:5002)  
Remote entry: `http://localhost:5002/remoteEntry.js`

When changing `tvmaze-ui` source, start it on `:5001` and use local mode:

```bash
# terminal 1 — UI remote
cd ../tvmaze-ui && npm run dev

# terminal 2 — catalog remote in local mode
npm run dev:local
```

To make that the default for your checkout, copy `.env.example` to `.env.local`
(gitignored) and uncomment the override.

```bash
npm test
npm run lint
npm run build
npm run storybook        # API playground on :6007
npm run build-storybook
```

## Storybook (API playground)

GitHub Pages serves **Storybook as the site root**. Stories under `API/*` call the live TVmaze API (index / search / details) with controls for page, embeds, and raw JSON preview. Please respect [TVmaze rate limits](https://www.tvmaze.com/api#rate-limiting).

Storybook resolves `tvmaze_ui/*` via aliases into the sibling `tvmaze-ui` source tree (no remotes required for Storybook). Tailwind v4 only auto-scans this repo, so `.storybook/preview.css` adds `@source '../../tvmaze-ui/src'` so UI utility classes (SearchInput, AppHeader, etc.) are generated.

## Production

- Storybook / API playground: `https://abn-challenge.github.io/tvmaze-catalog/`
- Remote entry: `https://abn-challenge.github.io/tvmaze-catalog/remoteEntry.js`

Deploy **tvmaze-ui** first so the production UI remote URL resolves. Enable **GitHub Pages → Source: GitHub Actions**.
