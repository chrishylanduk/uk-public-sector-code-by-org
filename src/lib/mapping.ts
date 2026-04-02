import fs from 'fs';
import path from 'path';
import type { OrgMapping } from './types';

interface GovUkEntry {
  type: 'gov_uk';
  govuk_slug: string;
  wikidata_id?: string | null;
  site_slug?: string;
  github_accounts: string[];
}

interface EnglishCouncilEntry {
  type: 'english_council';
  england_planning_data_reference: string;
  wikidata_id?: string | null;
  site_slug?: string;
  github_accounts: string[];
}

interface OtherEntry {
  type: 'other';
  wikidata_id: string;
  site_slug?: string;
  github_accounts: string[];
}

type OrgEntry = GovUkEntry | EnglishCouncilEntry | OtherEntry;

interface JsonMappingFile {
  organisations: OrgEntry[];
}

export interface PlanningDataLocalEntry {
  type: 'planning_data';
  planningDataReference: string;
  wikidataId: string | null;
  siteSlug?: string;
  githubOrgs: string[];
}

export interface WikidataLocalEntry {
  type: 'wikidata';
  wikidataId: string;
  siteSlug?: string;
  githubOrgs: string[];
}

export type LocalGovEntry = PlanningDataLocalEntry | WikidataLocalEntry;

function loadFile(): JsonMappingFile {
  const filePath = path.join(process.cwd(), 'public/data/org-mapping.json');
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as JsonMappingFile;
}

export function getRawOrganisations(): OrgEntry[] {
  return loadFile().organisations;
}

export function getOrgMapping(): OrgMapping {
  const raw = loadFile();
  const organisations: OrgMapping = {};
  for (const entry of raw.organisations) {
    if (entry.type === 'gov_uk') {
      organisations[entry.govuk_slug] = { githubOrgs: entry.github_accounts };
    }
  }
  return organisations;
}

export function getLocalGovEntries(): LocalGovEntry[] {
  const raw = loadFile();
  const entries: LocalGovEntry[] = [];
  for (const entry of raw.organisations) {
    if (entry.type === 'english_council') {
      entries.push({
        type: 'planning_data' as const,
        planningDataReference: entry.england_planning_data_reference,
        wikidataId: entry.wikidata_id ?? null,
        siteSlug: entry.site_slug,
        githubOrgs: entry.github_accounts,
      });
    } else if (entry.type === 'other') {
      entries.push({
        type: 'wikidata' as const,
        wikidataId: entry.wikidata_id,
        siteSlug: entry.site_slug,
        githubOrgs: entry.github_accounts,
      });
    }
  }
  return entries;
}

/** Returns a map of govuk_slug → wikidata_id for gov_uk entries that have a wikidata_id. */
export function getGovUkWikidataIds(): Map<string, string> {
  const raw = loadFile();
  const map = new Map<string, string>();
  for (const entry of raw.organisations) {
    if (entry.type === 'gov_uk' && entry.wikidata_id) {
      map.set(entry.govuk_slug, entry.wikidata_id);
    }
  }
  return map;
}

/** Returns a map of wikidata_id → site_slug for all entries that have both. */
export function getWikidataIdToSlug(): Map<string, string> {
  const raw = loadFile();
  const map = new Map<string, string>();
  for (const entry of raw.organisations) {
    if (entry.wikidata_id && entry.site_slug) {
      map.set(entry.wikidata_id, entry.site_slug);
    }
  }
  return map;
}

export function getMissingWikidataOrgs(): string[] {
  const raw = loadFile();
  const missing: string[] = [];
  for (const entry of raw.organisations) {
    if (!entry.wikidata_id) {
      if (entry.type === 'gov_uk') missing.push(entry.govuk_slug);
      else if (entry.type === 'english_council') missing.push(entry.england_planning_data_reference);
    }
  }
  return missing;
}

export function getDuplicateWikidataOrgs(): Array<{ wikidataId: string; orgs: string[] }> {
  const raw = loadFile();
  const wikidataToOrgs = new Map<string, string[]>();
  for (const entry of raw.organisations) {
    if (!entry.wikidata_id) continue;
    const label = entry.type === 'gov_uk' ? entry.govuk_slug
      : entry.type === 'english_council' ? entry.england_planning_data_reference
      : entry.wikidata_id;
    const existing = wikidataToOrgs.get(entry.wikidata_id) ?? [];
    existing.push(label);
    wikidataToOrgs.set(entry.wikidata_id, existing);
  }
  return Array.from(wikidataToOrgs.entries())
    .filter(([, orgs]) => orgs.length > 1)
    .map(([wikidataId, orgs]) => ({ wikidataId, orgs }));
}

export function getAllMappedGithubOrgs(): string[] {
  const central = Object.values(getOrgMapping()).flatMap((c) => c.githubOrgs);
  const local = getLocalGovEntries().flatMap((e) => e.githubOrgs as string[]);
  return [...central, ...local];
}
