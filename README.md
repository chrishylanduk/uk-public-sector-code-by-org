# UK Public Sector Code by Organisation

A static website that shows UK public sector organisations and their open-source code on GitHub, covering both central and local government.

**Live at:** [publicsectorcodebyorg.co.uk](https://publicsectorcodebyorg.co.uk)

## Features

- **Directory** of UK central and local government organisations with their open-source GitHub activity
- **Organisation detail pages** showing all repos, stats, and links
- **Search and filtering** by organisation name and organisation type
- **Sortable columns** (name, type, stars, active repos, total repos)
- **WCAG 2.2 AA compliant** with full keyboard navigation and screen reader support
- **Daily automated updates** via GitHub Actions
- **Static export** hosted on Cloudflare Pages for fast global delivery

## Tech Stack

- **Next.js** with App Router and static export
- **TypeScript** for type safety
- **Tailwind CSS** for styling (gov.uk-inspired design)
- **Cloudflare Pages** for hosting
- **GitHub Actions** for daily rebuilds

## Data Sources

- **GitHub Repos:** [UK X-Gov Open Source Repo Scraper](https://github.com/uk-x-gov-software-community/xgov-opensource-repo-scraper)
- **Central government organisations:** [GOV.UK Organisations API](https://www.gov.uk/api/organisations)
- **Local government organisations:** [planning.data.gov.uk local authority dataset](https://www.planning.data.gov.uk/dataset/local-authority)
- **Organisation metadata:** [Wikidata](https://www.wikidata.org/)

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

- `npm run dev` - Start development server
- `npm run prebuild` - Fetch and cache data from APIs
- `npm run build` - Build static site (runs prebuild automatically)
- `npm run lint` - Run linter
- `npm run type-check` - Run TypeScript type checking

### Building Locally

The build process has two steps:

1. **Prebuild:** Validates `org-mapping.json` against its JSON Schema, fetches data from APIs, and generates the CSV export
2. **Build:** Generates static pages using cached data

```bash
npm run build
```

This creates an `out/` directory with all static files ready for deployment.

**Data Caching:**

Fetched data is cached to `.cache/` for 24 hours. The prebuild script fetches data once before the build, then all Next.js workers use the cached data.

To force a fresh fetch:
```bash
rm -rf .cache && npm run build
```

### Pre-commit Hooks

Pre-commit hooks are automatically installed when you run `npm install`. They run on every commit:

- **ESLint** - Auto-fixes linting issues in staged files
- **Secretlint** - Checks for accidentally committed secrets

## Project Structure

```
├── src/
│   ├── app/                      # Next.js app router pages
│   │   ├── layout.tsx            # Root layout with SEO
│   │   ├── page.tsx              # Home page (organisation directory)
│   │   ├── data/page.tsx         # Data download and documentation page
│   │   └── org/[slug]/page.tsx   # Organisation detail pages
│   ├── components/               # React components
│   │   ├── OrgDirectory.tsx      # Main table with filtering/sorting
│   │   ├── SearchAndFilter.tsx   # Search and filter controls
│   │   ├── RepoList.tsx          # Repo listing with pagination
│   │   ├── RepoCard.tsx          # Individual repo display
│   │   ├── AboutTheData.tsx      # Data documentation component
│   │   └── SkipLink.tsx          # Accessibility skip link
│   └── lib/                      # Core logic
│       ├── types.ts              # TypeScript interfaces
│       ├── data-fetcher.ts       # API fetching with caching
│       ├── data-processor.ts     # Data aggregation
│       └── mapping.ts            # Mapping utilities
├── public/data/
│   ├── org-mapping.json          # GitHub org → public sector org mapping
│   ├── org-mapping.schema.json   # JSON Schema for the mapping file
│   └── org-mapping.csv           # CSV export (generated at build time)
├── scripts/
│   └── prebuild.ts               # Pre-build data fetching and validation
├── .github/workflows/
│   └── deploy.yml                # Daily rebuild workflow
└── public/
    └── robots.txt
```

## Mapping File

The [`public/data/org-mapping.json`](public/data/org-mapping.json) file maps GitHub organisations to UK public sector organisations. It is validated against [`public/data/org-mapping.schema.json`](public/data/org-mapping.schema.json) at build time.

The file has two top-level arrays: `central_government` and `local_government`.

**Central government entries** use GOV.UK organisation slugs and Wikidata IDs:
```json
{
  "govuk_slug": "cabinet-office",
  "wikidata_id": "Q1006053",
  "github_orgs": ["cabinetoffice", "Civil-Service-Human-Resources"]
}
```

**Local government entries** use planning.data.gov.uk local authority references and Wikidata IDs:
```json
{
  "england_planning_data_reference": "COV",
  "wikidata_id": "Q49202",
  "github_orgs": ["coventrycc"]
}
```

**To add an organisation:**

1. For central government, find the GOV.UK slug from [https://www.gov.uk/api/organisations](https://www.gov.uk/api/organisations)
2. For local government, find the reference from [https://www.planning.data.gov.uk/dataset/local-authority](https://www.planning.data.gov.uk/dataset/local-authority)
3. Find their GitHub org(s)
4. Add an entry to `org-mapping.json`
5. Run `npm run build` to validate and verify

The mapping data is also available as a CSV download from the `/data` page and is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

## Deployment

### Cloudflare Pages Setup

1. **Create a Cloudflare Pages project**
2. **Get API credentials:**
   - Account ID: Cloudflare dashboard → Account → Account ID
   - API Token: Cloudflare dashboard → Profile → API Tokens → Create Token (Pages Edit permissions)
3. **Add GitHub Secrets:**
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`

### Automated Deployments

GitHub Actions workflow runs:
- **On push to main** (immediate deployment)
- **Daily at 6am UTC** (scheduled rebuild with fresh data)
- **Manual trigger** (via GitHub UI)

## Accessibility

WCAG 2.2 AA compliant:
- Semantic HTML with proper landmarks
- Keyboard navigation for all interactive elements
- ARIA labels and live regions
- Screen reader tested (VoiceOver/NVDA)
- 4.5:1 colour contrast
- Focus indicators (2px, 3:1 contrast)

## License

MIT (code) · [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) (data)

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run build` to verify
5. Submit a pull request

## Acknowledgements

- Data from [UK X-Gov Software Community](https://www.uk-x-gov-software-community.org.uk/)
- Built with [Next.js](https://nextjs.org/)
- Hosted on [Cloudflare Pages](https://pages.cloudflare.com/)
