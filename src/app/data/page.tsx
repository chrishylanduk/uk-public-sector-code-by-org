import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Data - UK Public Sector Code by Organisation',
  description: 'Download the mapping of GitHub organisations to UK public sector organisations as open data.',
};

const REPO_RAW_BASE = 'https://raw.githubusercontent.com/chrishylanduk/uk-public-sector-code-by-org/main/public/data';
const RAW_URL = `${REPO_RAW_BASE}/org-mapping.json`;
const CSV_URL = `${REPO_RAW_BASE}/org-mapping.csv`;
const SCHEMA_URL = `${REPO_RAW_BASE}/org-mapping.schema.json`;

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Dataset',
  name: 'UK Government GitHub Organisation Mapping',
  description: 'A mapping of GitHub organisations to UK public sector organisations, with references to GOV.UK, planning.data.gov.uk, and Wikidata.',
  license: 'https://creativecommons.org/licenses/by/4.0/',
  isAccessibleForFree: true,
  keywords: ['UK public sector', 'GitHub', 'open source', 'organisations', 'open data'],
  url: 'https://publicsectorcodebyorg.co.uk/data',
  distribution: [
    {
      '@type': 'DataDownload',
      encodingFormat: 'application/json',
      contentUrl: RAW_URL,
    },
    {
      '@type': 'DataDownload',
      encodingFormat: 'text/csv',
      contentUrl: CSV_URL,
    },
  ],
};

export default function DataPage() {
  return (
    <div className="max-w-3xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-sm">
          <li>
            <Link
              href="/"
              className="text-gov-blue underline hover:text-gov-dark-blue focus:outline-2 focus:outline-gov-blue"
            >
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-bold">Data</li>
        </ol>
      </nav>

      <h2 className="text-3xl font-bold mb-3">Organisation mapping</h2>
      <p className="text-lg mb-6">
        A mapping of GitHub organisations to UK public sector organisations.
        Central government entries reference the{' '}
        <a href="https://www.gov.uk/api/organisations" target="_blank" rel="noopener noreferrer" className="text-gov-blue underline hover:text-gov-dark-blue">GOV.UK Organisations API</a>.
        English local government entries reference the{' '}
        <a href="https://www.planning.data.gov.uk/dataset/local-authority" target="_blank" rel="noopener noreferrer" className="text-gov-blue underline hover:text-gov-dark-blue">planning.data.gov.uk local authority dataset</a>.
        All entries include a <a href="https://www.wikidata.org" target="_blank" rel="noopener noreferrer" className="text-gov-blue underline hover:text-gov-dark-blue">Wikidata</a> ID.
      </p>

      <p className="text-sm text-gov-grey mb-4">Updated daily. The URLs below are permanent — safe to use in automated pipelines.</p>

      <div className="flex flex-wrap gap-3 mb-3">
        <a
          href={RAW_URL}
          className="inline-block bg-gov-blue text-white px-4 py-2 rounded hover:bg-gov-dark-blue focus:outline-2 focus:outline-gov-blue font-semibold"
        >
          Download JSON
        </a>
        <a
          href={CSV_URL}
          className="inline-block bg-gov-blue text-white px-4 py-2 rounded hover:bg-gov-dark-blue focus:outline-2 focus:outline-gov-blue font-semibold"
        >
          Download CSV
        </a>
      </div>
      <p className="text-sm text-gov-grey mb-8">
        Licence:{' '}
        <a href="https://creativecommons.org/licenses/by/4.0/" className="underline hover:text-gov-blue" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>
      </p>

      <section className="mb-10">
        <h3 className="text-2xl font-bold mb-6">Format</h3>

        <h4 className="text-lg font-bold mb-3">JSON</h4>

        <h5 className="font-bold mb-2">Schema</h5>
        <p className="text-sm mb-4">
          <a href={SCHEMA_URL} className="text-gov-blue underline hover:text-gov-dark-blue font-mono" target="_blank" rel="noopener noreferrer">org-mapping.schema.json</a>
        </p>

        <h5 className="font-bold mb-2">Example</h5>
        <pre className="bg-gray-100 border border-gov-border rounded p-4 text-sm overflow-x-auto mb-4">{`{
  "last_updated": "2026-03-30",
  "central_government": [
    {
      "govuk_slug": "home-office",
      "wikidata_id": "Q763388",
      "github_orgs": ["UKHomeOffice", "UKHomeOfficeForms", "HO-CTO"]
    }
  ],
  "local_government": [
    {
      "england_planning_data_reference": "COV",
      "wikidata_id": "Q5179058",
      "github_orgs": ["coventry-city-council"]
    },
    {
      "wikidata_id": "Q28530250",
      "github_orgs": ["edinburghcouncil"]
    }
  ]
}`}</pre>

        <h5 className="font-bold mb-2">Fields</h5>
        <table className="w-full border-collapse text-sm mb-10">
          <thead>
            <tr className="bg-gov-light-grey border-b-2 border-gov-dark-blue">
              <th scope="col" className="px-3 py-2 text-left font-bold">Field</th>
              <th scope="col" className="px-3 py-2 text-left font-bold">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gov-border">
              <td className="px-3 py-2 font-mono">last_updated</td>
              <td className="px-3 py-2">ISO 8601 date the file was last updated</td>
            </tr>
            <tr className="border-b border-gov-border">
              <td className="px-3 py-2 font-mono">govuk_slug</td>
              <td className="px-3 py-2">GOV.UK organisation slug (central government only)</td>
            </tr>
            <tr className="border-b border-gov-border">
              <td className="px-3 py-2 font-mono">england_planning_data_reference</td>
              <td className="px-3 py-2">planning.data.gov.uk local authority reference code (English local government only)</td>
            </tr>
            <tr className="border-b border-gov-border">
              <td className="px-3 py-2 font-mono">wikidata_id</td>
              <td className="px-3 py-2">Wikidata entity ID (e.g. Q5995) — present for all entries</td>
            </tr>
            <tr className="border-b border-gov-border">
              <td className="px-3 py-2 font-mono">github_orgs</td>
              <td className="px-3 py-2">Array of GitHub organisation names belonging to this government organisation</td>
            </tr>
          </tbody>
        </table>

        <h4 className="text-lg font-bold mb-1">CSV</h4>
        <p className="text-sm text-gov-grey mb-3">One row per GitHub organisation.</p>

        <h5 className="font-bold mb-2">Example</h5>
        <pre className="bg-gray-100 border border-gov-border rounded p-4 text-sm overflow-x-auto mb-4">{`github_org,org_type,govuk_slug,england_planning_data_reference,wikidata_id
UKHomeOffice,central_government,home-office,,Q763388
UKHomeOfficeForms,central_government,home-office,,Q763388
HO-CTO,central_government,home-office,,Q763388
coventry-city-council,local_government,,COV,Q5179058
edinburghcouncil,local_government,,,Q28530250`}</pre>

        <h5 className="font-bold mb-2">Columns</h5>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gov-light-grey border-b-2 border-gov-dark-blue">
              <th scope="col" className="px-3 py-2 text-left font-bold">Column</th>
              <th scope="col" className="px-3 py-2 text-left font-bold">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gov-border">
              <td className="px-3 py-2 font-mono">github_org</td>
              <td className="px-3 py-2">GitHub organisation name. Empty if the government organisation has no mapped GitHub presence.</td>
            </tr>
            <tr className="border-b border-gov-border">
              <td className="px-3 py-2 font-mono">org_type</td>
              <td className="px-3 py-2"><code className="font-mono bg-gray-100 px-1">central_government</code> or <code className="font-mono bg-gray-100 px-1">local_government</code></td>
            </tr>
            <tr className="border-b border-gov-border">
              <td className="px-3 py-2 font-mono">govuk_slug</td>
              <td className="px-3 py-2">GOV.UK organisation slug (central government only)</td>
            </tr>
            <tr className="border-b border-gov-border">
              <td className="px-3 py-2 font-mono">england_planning_data_reference</td>
              <td className="px-3 py-2">planning.data.gov.uk local authority reference code (English local government only)</td>
            </tr>
            <tr className="border-b border-gov-border">
              <td className="px-3 py-2 font-mono">wikidata_id</td>
              <td className="px-3 py-2">Wikidata entity ID (e.g. Q5995)</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="mb-10">
        <h3 className="text-2xl font-bold mb-3">Related data sources</h3>
        <p className="mb-4 text-gov-grey text-sm">
          Each field in the mapping is a key into one of these datasets. Use them together to enrich the data.
        </p>
        <ul className="space-y-6">
          <li className="border-l-4 border-gov-blue pl-4">
            <p className="font-bold mb-1">
              <a
                href="https://github.com/uk-x-gov-software-community/xgov-opensource-repo-scraper"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gov-blue underline hover:text-gov-dark-blue"
              >
                UK X-Gov Open Source Repo Scraper
              </a>
            </p>
            <p className="text-sm text-gov-grey mb-1">GitHub repository data for UK public sector organisations, maintained by the UK cross-government software community.</p>
            <p className="text-sm">Use the <code className="font-mono bg-gray-100 px-1">github_orgs</code> field to filter repos by owner. Each entry in the scraper JSON has an <code className="font-mono bg-gray-100 px-1">owner</code> field matching the GitHub organisation name.</p>
          </li>
          <li className="border-l-4 border-gov-blue pl-4">
            <p className="font-bold mb-1">
              <a
                href="https://www.gov.uk/api/organisations"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gov-blue underline hover:text-gov-dark-blue"
              >
                GOV.UK Organisations API
              </a>
            </p>
            <p className="text-sm text-gov-grey mb-1">Official metadata for central government organisations — names, formats, status, parent/child relationships. Open Government Licence.</p>
            <p className="text-sm">Use <code className="font-mono bg-gray-100 px-1">govuk_slug</code> to query a specific organisation: <code className="font-mono bg-gray-100 px-1">GET https://www.gov.uk/api/organisations/{'{govuk_slug}'}</code>. Or fetch the full list paginated from <code className="font-mono bg-gray-100 px-1">https://www.gov.uk/api/organisations</code>.</p>
          </li>
          <li className="border-l-4 border-gov-blue pl-4">
            <p className="font-bold mb-1">
              <a
                href="https://www.planning.data.gov.uk/dataset/local-authority"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gov-blue underline hover:text-gov-dark-blue"
              >
                planning.data.gov.uk — Local authority dataset
              </a>
            </p>
            <p className="text-sm text-gov-grey mb-1">Official metadata for English local authorities — names, types, ONS codes, websites. Open Government Licence.</p>
            <p className="text-sm">Use <code className="font-mono bg-gray-100 px-1">england_planning_data_reference</code> to query a specific authority: <code className="font-mono bg-gray-100 px-1">GET https://www.planning.data.gov.uk/entity.json?dataset=local-authority&reference={'{england_planning_data_reference}'}</code>.</p>
          </li>
          <li className="border-l-4 border-gov-blue pl-4">
            <p className="font-bold mb-1">
              <a
                href="https://www.wikidata.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gov-blue underline hover:text-gov-dark-blue"
              >
                Wikidata
              </a>
            </p>
            <p className="text-sm text-gov-grey mb-1">Structured data about organisations including names, websites, and relationships. CC0.</p>
            <p className="text-sm">Use <code className="font-mono bg-gray-100 px-1">wikidata_id</code> to look up an entity directly at <code className="font-mono bg-gray-100 px-1">https://www.wikidata.org/entity/{'{wikidata_id}'}</code>, or query via SPARQL at <code className="font-mono bg-gray-100 px-1">https://query.wikidata.org/sparql</code> using <code className="font-mono bg-gray-100 px-1">BIND(wd:{'{wikidata_id}'} AS ?item)</code>.</p>
          </li>
        </ul>
      </section>

      <section>
        <h3 className="text-2xl font-bold mb-3">Contributing</h3>
        <p>
          The mapping is maintained manually. If you spot an error or want to add an organisation,{' '}
          <a
            href="https://github.com/chrishylanduk/uk-public-sector-code-by-org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gov-blue underline hover:text-gov-dark-blue"
          >
            open an issue or pull request on GitHub
          </a>
          .
        </p>
      </section>
    </div>
  );
}
