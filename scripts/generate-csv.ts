/**
 * Generates public/data/org-mapping.csv from public/data/org-mapping.json.
 * Produces one row per GitHub org (or one row per gov org if github_orgs is empty).
 *
 * Columns:
 *   github_org, org_type, govuk_slug, england_planning_data_reference, wikidata_id
 */

import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'public/data/org-mapping.json');
const CSV_FILE = path.join(process.cwd(), 'public/data/org-mapping.csv');

interface CentralGovEntry {
  govuk_slug: string;
  wikidata_id: string | null;
  github_orgs: string[];
}

interface LocalGovEntry {
  england_planning_data_reference?: string;
  wikidata_id?: string | null;
  github_orgs: string[];
}

interface JsonMappingFile {
  central_government: CentralGovEntry[];
  local_government: LocalGovEntry[];
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

  lines.push(row('github_org', 'org_type', 'govuk_slug', 'england_planning_data_reference', 'wikidata_id'));

  for (const entry of raw.central_government) {
    if (entry.github_orgs.length === 0) {
      lines.push(row('', 'central_government', entry.govuk_slug, '', entry.wikidata_id ?? ''));
    } else {
      for (const githubOrg of entry.github_orgs) {
        lines.push(row(githubOrg, 'central_government', entry.govuk_slug, '', entry.wikidata_id ?? ''));
      }
    }
  }

  for (const entry of (raw.local_government ?? [])) {
    const planningRef = entry.england_planning_data_reference ?? '';
    const wikidataId = entry.wikidata_id ?? '';
    if (entry.github_orgs.length === 0) {
      lines.push(row('', 'local_government', '', planningRef, wikidataId));
    } else {
      for (const githubOrg of entry.github_orgs) {
        lines.push(row(githubOrg, 'local_government', '', planningRef, wikidataId));
      }
    }
  }

  fs.writeFileSync(CSV_FILE, lines.join('\n') + '\n');
  console.log(`✓ Generated org-mapping.csv (${lines.length - 1} rows)`);
}
