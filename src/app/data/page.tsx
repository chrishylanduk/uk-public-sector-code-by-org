import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Data - UK Public Sector Code by Organisation',
  description: 'Download the mapping of GitHub accounts to UK public sector organisations as open data.',
};

const REPO_RAW_BASE = 'https://raw.githubusercontent.com/chrishylanduk/uk-public-sector-code-by-org/main/public/data';
const RAW_URL = `${REPO_RAW_BASE}/org-mapping.json`;
const CSV_URL = `${REPO_RAW_BASE}/org-mapping.csv`;
const SCHEMA_URL = `${REPO_RAW_BASE}/org-mapping.schema.json`;

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Dataset',
  name: 'UK Government GitHub Organisation Mapping',
  description: 'A mapping of GitHub accounts to UK public sector organisations, with references to GOV.UK, planning.data.gov.uk, and Wikidata.',
  license: 'https://opensource.org/licenses/MIT',
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
              className="text-orange underline hover:text-dark-orange focus:outline-2 focus:outline-orange"
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
        A mapping of GitHub accounts to UK public sector organisations.
        Each entry has a <code className="font-mono bg-gray-100 px-1">type</code> field:{' '}
        <code className="font-mono bg-gray-100 px-1">gov_uk</code> entries reference the{' '}
        <a href="https://www.gov.uk/api/organisations" target="_blank" rel="noopener noreferrer" className="text-orange underline hover:text-dark-orange">GOV.UK Organisations API</a>.{' '}
        <code className="font-mono bg-gray-100 px-1">english_council</code> entries reference the{' '}
        <a href="https://www.planning.data.gov.uk/dataset/local-authority" target="_blank" rel="noopener noreferrer" className="text-orange underline hover:text-dark-orange">planning.data.gov.uk local authority dataset</a>.{' '}
        All entries include a <a href="https://www.wikidata.org" target="_blank" rel="noopener noreferrer" className="text-orange underline hover:text-dark-orange">Wikidata</a> ID.
      </p>

      <p className="text-sm text-grey mb-4">The URLs below are permanent - safe to use in automated pipelines.</p>

      <div className="flex flex-wrap gap-3 mb-3">
        <a
          href={RAW_URL}
          className="inline-block bg-orange text-white px-4 py-2 rounded hover:bg-dark-orange focus:outline-2 focus:outline-orange font-semibold"
        >
          View JSON
        </a>
        <a
          href={CSV_URL}
          className="inline-block bg-orange text-white px-4 py-2 rounded hover:bg-dark-orange focus:outline-2 focus:outline-orange font-semibold"
        >
          View CSV
        </a>
      </div>
      <p className="text-sm text-grey mb-8">
        Licence:{' '}
        <a href="https://opensource.org/licenses/MIT" className="underline hover:text-orange" target="_blank" rel="noopener noreferrer">MIT</a>
      </p>

      <section className="mb-10">
        <h3 className="text-2xl font-bold mb-6">Format</h3>

        <h4 className="text-lg font-bold mb-3">JSON</h4>

        <h5 className="font-bold mb-2">Schema</h5>
        <p className="text-sm mb-4">
          <a href={SCHEMA_URL} className="text-orange underline hover:text-dark-orange font-mono" target="_blank" rel="noopener noreferrer">org-mapping.schema.json</a>
        </p>

        <h5 className="font-bold mb-2">Example</h5>
        <pre className="bg-gray-100 border border-mid-grey rounded p-4 text-sm overflow-x-auto mb-4">{`{
  "last_updated": "2026-03-30",
  "organisations": [
    {
      "type": "gov_uk",
      "govuk_slug": "home-office",
      "wikidata_id": "Q763388",
      "site_slug": "home-office",
      "site_url": "https://publicsectorcodebyorg.co.uk/org/home-office",
      "github_accounts": ["UKHomeOffice", "UKHomeOfficeForms", "HO-CTO"]
    },
    {
      "type": "english_council",
      "england_planning_data_reference": "COV",
      "wikidata_id": "Q5179058",
      "site_slug": "coventry-city-council",
      "site_url": "https://publicsectorcodebyorg.co.uk/org/coventry-city-council",
      "github_accounts": ["coventry-city-council"]
    },
    {
      "type": "other",
      "wikidata_id": "Q28530250",
      "site_slug": "city-of-edinburgh-council",
      "site_url": "https://publicsectorcodebyorg.co.uk/org/city-of-edinburgh-council",
      "github_accounts": ["edinburghcouncil"]
    }
  ]
}`}</pre>

        <h5 className="font-bold mb-2">Fields</h5>
        <div className="overflow-x-auto mb-10"><table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-light-grey border-b-2 border-dark-orange">
              <th scope="col" className="px-3 py-2 text-left font-bold">Field</th>
              <th scope="col" className="px-3 py-2 text-left font-bold">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-mid-grey">
              <td className="px-3 py-2 font-mono">last_updated</td>
              <td className="px-3 py-2">ISO 8601 date the file was last updated</td>
            </tr>
            <tr className="border-b border-mid-grey">
              <td className="px-3 py-2 font-mono">type</td>
              <td className="px-3 py-2"><code className="font-mono bg-gray-100 px-1">gov_uk</code>, <code className="font-mono bg-gray-100 px-1">english_council</code>, or <code className="font-mono bg-gray-100 px-1">other</code></td>
            </tr>
            <tr className="border-b border-mid-grey">
              <td className="px-3 py-2 font-mono">govuk_slug</td>
              <td className="px-3 py-2">GOV.UK organisation slug (<code className="font-mono bg-gray-100 px-1">gov_uk</code> entries only)</td>
            </tr>
            <tr className="border-b border-mid-grey">
              <td className="px-3 py-2 font-mono">england_planning_data_reference</td>
              <td className="px-3 py-2">planning.data.gov.uk local authority reference code (<code className="font-mono bg-gray-100 px-1">english_council</code> entries only)</td>
            </tr>
            <tr className="border-b border-mid-grey">
              <td className="px-3 py-2 font-mono">wikidata_id</td>
              <td className="px-3 py-2">Wikidata entity ID (e.g. Q5995) — present for all entries</td>
            </tr>
            <tr className="border-b border-mid-grey">
              <td className="px-3 py-2 font-mono">site_slug</td>
              <td className="px-3 py-2">URL slug for the organisation&apos;s page on this site</td>
            </tr>
            <tr className="border-b border-mid-grey">
              <td className="px-3 py-2 font-mono">site_url</td>
              <td className="px-3 py-2">URL of the organisation&apos;s page on this site</td>
            </tr>
            <tr className="border-b border-mid-grey">
              <td className="px-3 py-2 font-mono">github_accounts</td>
              <td className="px-3 py-2">Array of GitHub account names belonging to this organisation</td>
            </tr>
          </tbody>
        </table></div>

        <h4 className="text-lg font-bold mb-1">CSV</h4>
        <p className="text-sm text-grey mb-3">One row per GitHub account.</p>

        <h5 className="font-bold mb-2">Example</h5>
        <pre className="bg-gray-100 border border-mid-grey rounded p-4 text-sm overflow-x-auto mb-4">{`github_account,org_type,govuk_slug,england_planning_data_reference,wikidata_id,site_slug,site_url
UKHomeOffice,gov_uk,home-office,,Q763388,home-office,https://publicsectorcodebyorg.co.uk/org/home-office
UKHomeOfficeForms,gov_uk,home-office,,Q763388,home-office,https://publicsectorcodebyorg.co.uk/org/home-office
HO-CTO,gov_uk,home-office,,Q763388,home-office,https://publicsectorcodebyorg.co.uk/org/home-office
coventry-city-council,english_council,,COV,Q5179058,coventry-city-council,https://publicsectorcodebyorg.co.uk/org/coventry-city-council
edinburghcouncil,other,,,Q28530250,city-of-edinburgh-council,https://publicsectorcodebyorg.co.uk/org/city-of-edinburgh-council`}</pre>

        <h5 className="font-bold mb-2">Columns</h5>
        <div className="overflow-x-auto"><table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-light-grey border-b-2 border-dark-orange">
              <th scope="col" className="px-3 py-2 text-left font-bold">Column</th>
              <th scope="col" className="px-3 py-2 text-left font-bold">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-mid-grey">
              <td className="px-3 py-2 font-mono">github_account</td>
              <td className="px-3 py-2">GitHub account name. Empty if the organisation has no mapped GitHub presence.</td>
            </tr>
            <tr className="border-b border-mid-grey">
              <td className="px-3 py-2 font-mono">org_type</td>
              <td className="px-3 py-2"><code className="font-mono bg-gray-100 px-1">gov_uk</code>, <code className="font-mono bg-gray-100 px-1">english_council</code>, or <code className="font-mono bg-gray-100 px-1">other</code></td>
            </tr>
            <tr className="border-b border-mid-grey">
              <td className="px-3 py-2 font-mono">govuk_slug</td>
              <td className="px-3 py-2">GOV.UK organisation slug (<code className="font-mono bg-gray-100 px-1">gov_uk</code> entries only)</td>
            </tr>
            <tr className="border-b border-mid-grey">
              <td className="px-3 py-2 font-mono">england_planning_data_reference</td>
              <td className="px-3 py-2">planning.data.gov.uk local authority reference code (<code className="font-mono bg-gray-100 px-1">english_council</code> entries only)</td>
            </tr>
            <tr className="border-b border-mid-grey">
              <td className="px-3 py-2 font-mono">wikidata_id</td>
              <td className="px-3 py-2">Wikidata entity ID (e.g. Q5995)</td>
            </tr>
            <tr className="border-b border-mid-grey">
              <td className="px-3 py-2 font-mono">site_slug</td>
              <td className="px-3 py-2">URL slug for the organisation&apos;s page on this site</td>
            </tr>
            <tr className="border-b border-mid-grey">
              <td className="px-3 py-2 font-mono">site_url</td>
              <td className="px-3 py-2">URL of the organisation&apos;s page on this site</td>
            </tr>
          </tbody>
        </table></div>
      </section>

      <section className="mb-10">
        <h3 className="text-2xl font-bold mb-3">Related data sources</h3>
        <p className="mb-4 text-grey text-sm">
          Data sources used to build and enrich this site. Many fields in the mapping are keys into these datasets.
        </p>
        <ul className="space-y-6 [&_code]:break-all">
          <li className="border-l-4 border-orange pl-4">
            <p className="font-bold mb-1">
              <a
                href="https://github.com/chrishylanduk/xgov-opensource-repo-scraper"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange underline hover:text-dark-orange"
              >
                UK X-Gov Open Source Repo Scraper
              </a>
            </p>
            <p className="text-sm text-grey mb-1">GitHub repository data for UK public sector organisations, maintained by the UK cross-government software community.</p>
            <p className="text-sm">Use the <code className="font-mono bg-gray-100 px-1">github_accounts</code> field to filter repos by owner. Each entry in the scraper JSON has an <code className="font-mono bg-gray-100 px-1">owner</code> field matching the GitHub account name.</p>
          </li>
          <li className="border-l-4 border-orange pl-4">
            <p className="font-bold mb-1">
              <a
                href="https://www.gov.uk/api/organisations"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange underline hover:text-dark-orange"
              >
                GOV.UK Organisations API
              </a>
            </p>
            <p className="text-sm text-grey mb-1">Official metadata for central government organisations — names, formats, status, parent/child relationships. Open Government Licence.</p>
            <p className="text-sm">Use <code className="font-mono bg-gray-100 px-1">govuk_slug</code> to query a specific organisation: <code className="font-mono bg-gray-100 px-1">GET https://www.gov.uk/api/organisations/{'{govuk_slug}'}</code>. Or fetch the full list paginated from <code className="font-mono bg-gray-100 px-1">https://www.gov.uk/api/organisations</code>.</p>
          </li>
          <li className="border-l-4 border-orange pl-4">
            <p className="font-bold mb-1">
              <a
                href="https://www.planning.data.gov.uk/dataset/local-authority"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange underline hover:text-dark-orange"
              >
                planning.data.gov.uk — Local authority dataset
              </a>
            </p>
            <p className="text-sm text-grey mb-1">Official metadata for English local authorities — names, types, ONS codes, websites. Open Government Licence.</p>
            <p className="text-sm">Use <code className="font-mono bg-gray-100 px-1">england_planning_data_reference</code> to query a specific authority: <code className="font-mono bg-gray-100 px-1">GET https://www.planning.data.gov.uk/entity.json?dataset=local-authority&reference={'{england_planning_data_reference}'}</code>.</p>
          </li>
          <li className="border-l-4 border-orange pl-4">
            <p className="font-bold mb-1">
              <a
                href="https://www.wikidata.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange underline hover:text-dark-orange"
              >
                Wikidata
              </a>
            </p>
            <p className="text-sm text-grey mb-1">Structured data about organisations including names, websites, and relationships. CC0.</p>
            <p className="text-sm">Use <code className="font-mono bg-gray-100 px-1">wikidata_id</code> to look up an entity directly at <code className="font-mono bg-gray-100 px-1">https://www.wikidata.org/entity/{'{wikidata_id}'}</code>, or query via SPARQL at <code className="font-mono bg-gray-100 px-1">https://query.wikidata.org/sparql</code> using <code className="font-mono bg-gray-100 px-1">BIND(wd:{'{wikidata_id}'} AS ?item)</code>.</p>
          </li>
          <li className="border-l-4 border-orange pl-4">
            <p className="font-bold mb-1">
              <a
                href="https://www.gov.uk/government/collections/civil-service-statistics"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange underline hover:text-dark-orange"
              >
                Civil Service Statistics
              </a>
            </p>
            <p className="text-sm text-grey mb-1">Annual FTE data for civil service departments and agencies, published by the Cabinet Office. Used to populate Total FTE and Digital &amp; data FTE figures for central government organisations on this site.</p>
            <p className="text-sm">Matched to organisations via GOV.UK organisation titles. Data from Table 8A (FTE by profession and department).</p>
          </li>
          <li className="border-l-4 border-orange pl-4">
            <p className="font-bold mb-1">
              <a
                href="https://www.local.gov.uk/publications/ons-quarterly-public-sector-employment-survey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange underline hover:text-dark-orange"
              >
                LGA Quarterly Workforce Survey (QPSES)
              </a>
            </p>
            <p className="text-sm text-grey mb-1">Quarterly headcount and FTE data for English and Welsh local authorities, published by the Local Government Association.</p>
            <p className="text-sm">Used to populate the Total FTE figures shown for English councils on this site. Matched to councils via{' '}
              <a href="https://www.data.gov.uk/dataset/cbaf0333-3548-4e42-8a8f-6dc5376bc360/local-authority-districts-december-2024-names-and-codes-in-the-uk" target="_blank" rel="noopener noreferrer" className="text-orange underline hover:text-dark-orange">ONS geography codes</a>.
            </p>
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
            className="text-orange underline hover:text-dark-orange"
          >
            open an issue or pull request on GitHub
          </a>
          .
        </p>
      </section>
    </div>
  );
}
