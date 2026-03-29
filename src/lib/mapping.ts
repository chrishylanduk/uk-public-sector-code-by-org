import fs from 'fs';
import path from 'path';
import type { OrgMapping, MappingConfig } from './types';

interface CentralGovEntry {
  govuk_slug: string;
  wikidata_id: string | null;
  github_orgs: string[];
}

interface RawLocalGovEntry {
  england_planning_data_reference?: string;
  wikidata_id?: string | null;
  github_orgs: string[];
}

interface JsonMappingFile {
  central_government: CentralGovEntry[];
  local_government: RawLocalGovEntry[];
}

export interface PlanningDataLocalEntry {
  type: 'planning_data';
  planningDataReference: string;
  wikidataId: string | null;
  githubOrgs: string[];
}

export interface WikidataLocalEntry {
  type: 'wikidata';
  wikidataId: string;
  githubOrgs: string[];
}

export type LocalGovEntry = PlanningDataLocalEntry | WikidataLocalEntry;

function loadFile(): JsonMappingFile {
  const filePath = path.join(process.cwd(), 'public/data/org-mapping.json');
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as JsonMappingFile;
}

export function getOrgMapping(): OrgMapping {
  const raw = loadFile();
  const organisations: OrgMapping = {};
  for (const entry of raw.central_government) {
    organisations[entry.govuk_slug] = { githubOrgs: entry.github_orgs };
  }
  return organisations;
}

export function getLocalGovEntries(): LocalGovEntry[] {
  const raw = loadFile();
  const entries: LocalGovEntry[] = [];
  for (const entry of (raw.local_government ?? [])) {
    if (entry.england_planning_data_reference) {
      entries.push({
        type: 'planning_data' as const,
        planningDataReference: entry.england_planning_data_reference,
        wikidataId: entry.wikidata_id ?? null,
        githubOrgs: entry.github_orgs,
      });
    } else if (entry.wikidata_id) {
      entries.push({
        type: 'wikidata' as const,
        wikidataId: entry.wikidata_id,
        githubOrgs: entry.github_orgs,
      });
    }
  }
  return entries;
}

export function getMissingWikidataOrgs(): string[] {
  const raw = loadFile();
  const missing: string[] = [];
  for (const entry of raw.central_government) {
    if (!entry.wikidata_id) missing.push(entry.govuk_slug);
  }
  for (const entry of (raw.local_government ?? [])) {
    if (!entry.wikidata_id) {
      missing.push(entry.england_planning_data_reference ?? '(unknown)');
    }
  }
  return missing;
}

export function getAllMappedGithubOrgs(): string[] {
  const central = Object.values(getOrgMapping()).flatMap((c) => c.githubOrgs);
  const local = getLocalGovEntries().flatMap((e) => e.githubOrgs as string[]);
  return [...central, ...local];
}
