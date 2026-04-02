/**
 * Generates public/data/org-mapping.csv from public/data/org-mapping.json.
 * Produces one row per GitHub org (or one row per gov org if github_accounts is empty).
 *
 * Columns:
 *   github_account, org_type, govuk_slug, england_planning_data_reference, wikidata_id, site_slug, site_url
 */

import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'public/data/org-mapping.json');
const CSV_FILE = path.join(process.cwd(), 'public/data/org-mapping.csv');

interface GovUkEntry {
  type: 'gov_uk';
  govuk_slug: string;
  wikidata_id?: string | null;
  site_slug?: string;
  site_url?: string;
  github_accounts: string[];
}

interface EnglishCouncilEntry {
  type: 'english_council';
  england_planning_data_reference: string;
  wikidata_id?: string | null;
  site_slug?: string;
  site_url?: string;
  github_accounts: string[];
}

interface OtherEntry {
  type: 'other';
  wikidata_id: string;
  site_slug?: string;
  site_url?: string;
  github_accounts: string[];
}

type OrgEntry = GovUkEntry | EnglishCouncilEntry | OtherEntry;

interface JsonMappingFile {
  organisations: OrgEntry[];
}

function escapeCell(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function row(...cells: string[]): string {
  return cells.map(escapeCell).join(',');
}

export function generateCsv(): void {
  const raw = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) as JsonMappingFile;
  const lines: string[] = [];

  lines.push(row('github_account', 'org_type', 'govuk_slug', 'england_planning_data_reference', 'wikidata_id', 'site_slug', 'site_url'));

  for (const entry of raw.organisations) {
    if (entry.type === 'gov_uk') {
      const wikidataId = entry.wikidata_id ?? '';
      const siteSlug = entry.site_slug ?? '';
      const siteUrl = entry.site_url ?? '';
      if (entry.github_accounts.length === 0) {
        lines.push(row('', 'gov_uk', entry.govuk_slug, '', wikidataId, siteSlug, siteUrl));
      } else {
        for (const githubOrg of entry.github_accounts) {
          lines.push(row(githubOrg, 'gov_uk', entry.govuk_slug, '', wikidataId, siteSlug, siteUrl));
        }
      }
    } else if (entry.type === 'english_council') {
      const planningRef = entry.england_planning_data_reference;
      const wikidataId = entry.wikidata_id ?? '';
      const siteSlug = entry.site_slug ?? '';
      const siteUrl = entry.site_url ?? '';
      if (entry.github_accounts.length === 0) {
        lines.push(row('', 'english_council', '', planningRef, wikidataId, siteSlug, siteUrl));
      } else {
        for (const githubOrg of entry.github_accounts) {
          lines.push(row(githubOrg, 'english_council', '', planningRef, wikidataId, siteSlug, siteUrl));
        }
      }
    } else {
      const siteSlug = entry.site_slug ?? '';
      const siteUrl = entry.site_url ?? '';
      for (const githubOrg of entry.github_accounts) {
        lines.push(row(githubOrg, 'other', '', '', entry.wikidata_id, siteSlug, siteUrl));
      }
    }
  }

  fs.writeFileSync(CSV_FILE, lines.join('\n') + '\n');
  console.log(`✓ Generated org-mapping.csv (${lines.length - 1} rows)`);
}
