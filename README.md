# UK Public Sector Code by Organisation

A static website that shows UK public sector organisations and their open-source code on GitHub, covering both central and local government.

**Live at:** [publicsectorcodebyorg.co.uk](https://publicsectorcodebyorg.co.uk)

## Features

- **Directory** of UK central and local government organisations with their open-source GitHub activity
- **Organisation detail pages** showing all repos, stats, and links
- **Search and filtering** by organisation name and organisation type
- **Sortable columns** (name, type, stars, active repos, total repos, total FTE, digital & data FTE)
- **Workforce data** — Total FTE and Digital & data FTE for civil service departments; Total FTE for English councils
- **Responsive layout** — table on desktop, card list on mobile with native sort controls
- **Sticky table header** for easy scrolling through large lists
- **WCAG 2.2 AA compliant** with full keyboard navigation and screen reader support
- **Daily automated updates** via GitHub Actions
- **Static export** hosted on Cloudflare Pages for fast global delivery

## Tech Stack

- **Next.js** with App Router and static export (`output: 'export'`)
- **TypeScript** for type safety
- **Tailwind CSS** for styling (gov.uk-inspired design)
- **Cloudflare Pages** for hosting
- **GitHub Actions** for daily rebuilds

## Data Sources

- **GitHub repos:** [UK X-Gov Open Source Repo Scraper](https://github.com/uk-x-gov-software-community/xgov-opensource-repo-scraper)
- **Central government organisations:** [GOV.UK Organisations API](https://www.gov.uk/api/organisations)
- **Local government organisations:** [planning.data.gov.uk local authority dataset](https://www.planning.data.gov.uk/dataset/local-authority)
- **Organisation metadata:** [Wikidata](https://www.wikidata.org/)
- **Civil service workforce data:** [Civil Service Statistics](https://www.gov.uk/government/collections/civil-service-statistics) (Cabinet Office, Table 8A)
- **Local authority workforce data:** [LGA Quarterly Workforce Survey](https://www.local.gov.uk/publications/ons-quarterly-public-sector-employment-survey) via ONS geography codes

## Development

### Prerequisites

- Node.js 20+
- npm

### Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/chrishylanduk/uk-public-sector-code-by-org.git
   cd uk-public-sector-code-by-org
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)** in your browser.

### Available Scripts

- `npm run dev` — Start development server
- `npm run update-mapping` — Populate missing fields in `org-mapping.json` and regenerate the CSV (run locally after adding entries, then commit)
- `npm run prebuild` — Fetch and cache all external data, validate mapping (runs automatically before build)
- `npm run build` — Full production build (runs prebuild automatically)
- `npm run lint` — Run ESLint
- `npm run type-check` — Run TypeScript type checking

### Build Process

The build has two steps:

1. **Prebuild** (`scripts/prebuild.ts`):
   - Fetches and caches data from all external APIs in parallel (GitHub repos, GOV.UK organisations, planning.data.gov.uk, LGA FTE, Civil Service Statistics)
   - Fetches Wikidata organisation metadata sequentially (to respect rate limits), cached per ID
   - Validates `org-mapping.json` against its JSON Schema and against live API data (fails build if stale)

2. **Next.js build** — generates static pages in `out/` using cached data

```bash
npm run build
```

**Data caching:**

All external data is cached to `.cache/` for 24 hours. This means Next.js workers all share the same fetched data rather than making redundant API calls.

To force a fresh fetch:
```bash
rm -rf .cache && npm run build
```

### Pre-commit Hooks

Installed automatically via `npm install`. Run on every commit:

- **ESLint** — auto-fixes linting issues in staged files
- **Secretlint** — checks for accidentally committed secrets

## Project Structure

```
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout, metadata, header/footer
│   │   ├── page.tsx                  # Home page (organisation directory)
│   │   ├── not-found.tsx             # 404 page
│   │   ├── sitemap.ts                # Generates /sitemap.xml
│   │   ├── manifest.ts               # Generates /manifest.webmanifest
│   │   ├── data/page.tsx             # Data download and documentation page
│   │   └── org/[slug]/page.tsx       # Organisation detail pages
│   ├── components/
│   │   ├── OrgDirectory.tsx          # Directory table (desktop) + card list (mobile)
│   │   ├── SearchAndFilter.tsx       # Search and filter controls
│   │   ├── RepoList.tsx              # Paginated repo listing
│   │   ├── RepoCard.tsx              # Individual repo card
│   │   ├── AboutTheData.tsx          # Data methodology note
│   │   └── SkipLink.tsx              # Accessibility skip link
│   └── lib/
│       ├── types.ts                  # TypeScript interfaces
│       ├── data-fetcher.ts           # API fetching with caching
│       ├── data-processor.ts         # Data aggregation and enrichment
│       └── mapping.ts                # org-mapping.json utilities
├── scripts/
│   ├── prebuild.ts                   # Orchestrates the full prebuild sequence
│   ├── update-mapping.ts             # Developer tool: populate slugs and regenerate CSV
│   ├── populate-site-slugs.ts        # Generates site_slug and site_url fields
│   └── generate-csv.ts              # Generates org-mapping.csv from JSON
├── public/
│   ├── data/
│   │   ├── org-mapping.json          # GitHub account → public sector org mapping
│   │   ├── org-mapping.schema.json   # JSON Schema for the mapping file
│   │   └── org-mapping.csv           # CSV export (generated at build time)
│   └── robots.txt
└── .github/workflows/
    └── deploy.yml                    # Build, type-check, lint, deploy workflow
```

## Mapping File

The [`public/data/org-mapping.json`](public/data/org-mapping.json) file maps GitHub accounts to UK public sector organisations. It is validated against [`public/data/org-mapping.schema.json`](public/data/org-mapping.schema.json) and against live API data at build time — the build will fail if any entry references a closed or missing organisation.

All entries have a `type` field and a `github_accounts` array. The `site_slug` and `site_url` fields are generated automatically and should not be edited by hand.

**Central government** (`type: "gov_uk"`) — identified by GOV.UK organisation slug:
```json
{
  "type": "gov_uk",
  "govuk_slug": "cabinet-office",
  "wikidata_id": "Q5995",
  "github_accounts": ["cabinetoffice", "Civil-Service-Human-Resources"],
  "site_slug": "cabinet-office",
  "site_url": "https://publicsectorcodebyorg.co.uk/org/cabinet-office"
}
```

**English councils** (`type: "english_council"`) — identified by planning.data.gov.uk reference:
```json
{
  "type": "english_council",
  "england_planning_data_reference": "BAS",
  "wikidata_id": "Q16966588",
  "github_accounts": ["BathnesDevelopment"],
  "site_slug": "bath-and-north-east-somerset-council",
  "site_url": "https://publicsectorcodebyorg.co.uk/org/bath-and-north-east-somerset-council"
}
```

**Other** (`type: "other"`) — identified by Wikidata ID only (Scottish councils, Welsh councils, NHS bodies, etc.):
```json
{
  "type": "other",
  "wikidata_id": "Q788265",
  "github_accounts": ["nhsengland"],
  "site_slug": "nhs-england",
  "site_url": "https://publicsectorcodebyorg.co.uk/org/nhs-england"
}
```

**To add an organisation:**

1. Find their GitHub account(s)
2. For `gov_uk`: find the GOV.UK slug from [https://www.gov.uk/api/organisations](https://www.gov.uk/api/organisations)
3. For `english_council`: find the reference from [https://www.planning.data.gov.uk/dataset/local-authority](https://www.planning.data.gov.uk/dataset/local-authority)
4. For `other`: find the Wikidata ID
5. Add an entry with `type`, the relevant identifier, `github_accounts`, and `wikidata_id` — leave `site_slug` and `site_url` blank
6. Run `npm run update-mapping` to populate slugs and regenerate the CSV
7. Review the diff, then commit — `npm run build` will validate the mapping

The mapping data is also available as a CSV download from the `/data` page and is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

## Deployment

### Cloudflare Pages Setup

1. **Create a Cloudflare Pages project** connected to this GitHub repo
   - Build command: `npm run build`
   - Build output directory: `out`
   - Node.js version: `20` (set as environment variable `NODE_VERSION = 20`)
2. **Add GitHub repository secrets:**
   - `CLOUDFLARE_API_TOKEN` — create at Cloudflare dashboard → Profile → API Tokens (Pages Edit permissions)
   - `CLOUDFLARE_ACCOUNT_ID` — found on the Cloudflare dashboard homepage

### Automated Deployments

The GitHub Actions workflow (`.github/workflows/deploy.yml`) runs:
- **On push to `main`** — immediate deployment
- **Daily at 6am UTC** — scheduled rebuild with fresh data
- **Manual trigger** — via GitHub Actions UI

Each run performs: type-check → lint → build (including prebuild) → deploy to Cloudflare Pages.

## Accessibility

Targeting WCAG 2.2 AA:
- Semantic HTML with proper landmarks and heading hierarchy
- Keyboard navigation for all interactive elements
- ARIA labels, roles, and live regions
- Sticky table header with accessible sort buttons (`aria-sort`)
- `<dl>` markup for definition lists on mobile cards
- Focus indicators (2px, 3:1 contrast)
- Skip to main content link

## License

MIT (code) · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (mapping data)

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run build` to validate
5. Submit a pull request

## Acknowledgements

- Repository data from the [UK X-Gov Software Community](https://www.uk-x-gov-software-community.org.uk/)
- Built with [Next.js](https://nextjs.org/)
- Hosted on [Cloudflare Pages](https://pages.cloudflare.com/)
