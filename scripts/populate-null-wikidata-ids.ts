/**
 * Populates null wikidata_id fields in public/data/org-mapping.json by querying
 * the Wikidata SPARQL endpoint for items whose official website (P856) matches
 * the constructed GOV.UK URL for each organisation.
 *
 * Run with: npx tsx scripts/populate-null-wikidata-ids.ts
 */

import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'public/data/org-mapping.json');

interface CentralGovEntry {
  govuk_slug: string;
  wikidata_id: string | null;
  github_orgs: string[];
}

interface LocalGovEntry {
  england_planning_data_reference: string;
  wikidata_id?: string | null;
  github_orgs: string[];
}

interface JsonMappingFile {
  description: string;
  licence: string;
  source: string;
  central_government: CentralGovEntry[];
  local_government: LocalGovEntry[];
}

const URL_PREFIXES = [
  'https://www.gov.uk/government/organisations/',
  'https://www.gov.uk/',
];

function slugFromUrl(url: string): string | null {
  for (const prefix of URL_PREFIXES) {
    if (url.startsWith(prefix)) return url.slice(prefix.length);
  }
  return null;
}

async function queryWikidataByUrls(urls: string[]): Promise<Map<string, string>> {
  // P856 values are stored as URIs in Wikidata, so use angle-bracket URI syntax.
  const urlValues = urls.map((u) => `<${u}>`).join(' ');

  const query = `
    SELECT ?item ?url WHERE {
      VALUES ?url { ${urlValues} }
      ?item wdt:P856 ?url .
    }
  `;

  const response = await fetch(
    `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`,
    {
      headers: {
        'User-Agent': 'publicsectorcodebyorg.co.uk/1.0 (https://publicsectorcodebyorg.co.uk)',
        Accept: 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Wikidata SPARQL query failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as {
    results: { bindings: { item: { value: string }; url: { value: string } }[] };
  };

  // Returns url → wikidataId
  const results = new Map<string, string>();
  for (const binding of data.results.bindings) {
    const wikidataId = binding.item.value.replace('http://www.wikidata.org/entity/', '');
    if (!results.has(binding.url.value)) results.set(binding.url.value, wikidataId);
  }

  return results;
}

async function queryWikidata(slugs: string[]): Promise<Map<string, string>> {
  const urls = slugs.flatMap((slug) => URL_PREFIXES.map((prefix) => `${prefix}${slug}`));
  const byUrl = await queryWikidataByUrls(urls);

  // Map back from slug to wikidata ID
  const results = new Map<string, string>();
  for (const slug of slugs) {
    for (const prefix of URL_PREFIXES) {
      const id = byUrl.get(`${prefix}${slug}`);
      if (id) { results.set(slug, id); break; }
    }
  }
  return results;
}

async function fetchPlanningDataWebsite(reference: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://www.planning.data.gov.uk/entity.json?dataset=local-authority&reference=${reference}&limit=1`
    );
    if (!response.ok) return null;
    const data = await response.json() as { entities: { website: string }[] };
    return data.entities[0]?.website ?? null;
  } catch {
    return null;
  }
}

async function main() {
  const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) as JsonMappingFile;

  let found = 0;
  let missing = 0;

  // Central government — match by GOV.UK URL
  const centralToQuery = raw.central_government.filter((e) => e.wikidata_id == null);
  if (centralToQuery.length > 0) {
    console.log(`\nQuerying Wikidata for ${centralToQuery.length} central gov entries with null IDs...`);
    const wikidataIds = await queryWikidata(centralToQuery.map((e) => e.govuk_slug));
    for (const entry of centralToQuery) {
      const id = wikidataIds.get(entry.govuk_slug) ?? null;
      entry.wikidata_id = id;
      if (id) { console.log(`  ✓  ${entry.govuk_slug} → ${id}`); found++; }
      else { console.log(`  -  ${entry.govuk_slug} (not found)`); missing++; }
    }
  }

  // Local government — match by council website URL from planning data API
  const localToQuery = (raw.local_government ?? []).filter((e) => e.wikidata_id == null);
  if (localToQuery.length > 0) {
    console.log(`\nQuerying Wikidata for ${localToQuery.length} local gov entries with null IDs...`);
    for (const entry of localToQuery) {
      const website = await fetchPlanningDataWebsite(entry.england_planning_data_reference);
      if (!website) {
        console.log(`  -  ${entry.england_planning_data_reference} (no website in planning data)`);
        entry.wikidata_id = null;
        missing++;
        continue;
      }
      // Try both with and without trailing slash
      const urls = [website, website.replace(/\/$/, ''), website + '/'].filter((v, i, a) => a.indexOf(v) === i);
      const byUrl = await queryWikidataByUrls(urls);
      const id = urls.map((u) => byUrl.get(u)).find(Boolean) ?? null;
      entry.wikidata_id = id;
      if (id) { console.log(`  ✓  ${entry.england_planning_data_reference} → ${id}`); found++; }
      else { console.log(`  -  ${entry.england_planning_data_reference} (not found)`); missing++; }
    }
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(raw, null, 2) + '\n');

  console.log(`\nDone. ${found} matched, ${missing} still null.`);
  console.log(`Updated ${DATA_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
