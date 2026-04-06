/**
 * Populates the site_slug and site_url fields for each entry in public/data/org-mapping.json.
 * - gov_uk: slug is the govuk_slug
 * - english_council: slug is derived from the name in planning.data.gov.uk
 * - other: slug is derived from the English label in Wikidata
 *
 * Overwrites any existing site_slug/site_url values.
 *
 * Run via prebuild: npm run prebuild
 */

import fs from 'fs';
import path from 'path';
import { fetchPlanningDataOrgs, fetchWikidataLocalOrgs } from '../src/lib/data-fetcher';
import { slugify } from '../src/utils/format';

const DATA_FILE = path.join(process.cwd(), 'public/data/org-mapping.json');
const SITE_BASE = 'https://publicsectorcodebyorg.co.uk';

interface GovUkEntry {
  type: 'gov_uk';
  govuk_slug: string;
  site_slug?: string;
  site_url?: string;
  [key: string]: unknown;
}

interface EnglishCouncilEntry {
  type: 'english_council';
  england_planning_data_reference: string;
  site_slug?: string;
  site_url?: string;
  [key: string]: unknown;
}

interface OtherEntry {
  type: 'other';
  wikidata_id: string;
  site_slug?: string;
  site_url?: string;
  [key: string]: unknown;
}

type OrgEntry = GovUkEntry | EnglishCouncilEntry | OtherEntry;

interface JsonMappingFile {
  organisations: OrgEntry[];
  [key: string]: unknown;
}

export async function populateSiteSlugs(): Promise<void> {
  const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) as JsonMappingFile;

  const planningOrgs = await fetchPlanningDataOrgs();
  const planningByRef = new Map(planningOrgs.map((o) => [o.reference, o]));

  const otherIds = raw.organisations
    .filter((e) => e.type === 'other')
    .map((e) => (e as { wikidata_id: string }).wikidata_id);
  const wikidataOrgs = await fetchWikidataLocalOrgs(otherIds);

  for (const entry of raw.organisations) {
    let slug: string;

    if (entry.type === 'gov_uk') {
      slug = entry.govuk_slug;
    } else if (entry.type === 'english_council') {
      const planningOrg = planningByRef.get(entry.england_planning_data_reference);
      if (!planningOrg) {
        console.warn(`  -  ${entry.england_planning_data_reference} not found in planning data, skipping site_slug/site_url`);
        continue;
      }
      slug = slugify(planningOrg.name);
    } else {
      const wikidataOrg = wikidataOrgs.get((entry as { wikidata_id: string }).wikidata_id);
      if (!wikidataOrg) { console.warn(`  -  ${(entry as { wikidata_id: string }).wikidata_id} not found in Wikidata, skipping`); continue; }
      slug = slugify(wikidataOrg.name);
    }

    entry.site_slug = slug;
    entry.site_url = `${SITE_BASE}/org/${slug}`;
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(raw, null, 2) + '\n');
  console.log(`✓ Generated site_slug and site_url for ${raw.organisations.length} organisations`);
}
