// Raw API types
export interface GithubRepo {
  owner: string;
  name: string;
  description: string | null;
  url: string;
  archived: boolean;
  license: {
    key: string;
    name: string;
    spdxId: string;
  } | null;
  stargazersCount: number;
  language: string | null;
  forksCount: number;
  openIssuesCount: number;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
}

export interface GovUkOrg {
  title: string;
  format: string;
  web_url: string;
  updated_at: string;
  analytics_identifier: string;
  details: {
    slug: string;
    abbreviation?: string;
    logo_formatted_name?: string;
    govuk_status: string;
    govuk_closed_status?: string;
  };
  parent_organisations: { id: string; web_url: string }[];
}

export interface WikidataLocalOrg {
  wikidataId: string;
  name: string;
  webUrl: string;
  format?: string;
  parentWikidataId?: string;
}

export interface PlanningDataOrg {
  entity: number;
  name: string;
  reference: string;
  website: string;
  wikidata: string;
  'local-authority-type': string;
  'statistical-geography': string;
  'end-date': string;
}

export interface PlanningDataApiResponse {
  entities: PlanningDataOrg[];
  count: number;
  links: { next?: string };
}

export interface GovUkApiResponse {
  results: GovUkOrg[];
  current_page: number;
  total: number;
  pages: number;
  page_size: number;
  next_page_url: string | null;
}

// Mapping file structure
export interface OrgMappingEntry {
  githubOrgs: string[];
}

export interface OrgMapping {
  [govUkSlug: string]: OrgMappingEntry;
}

export interface MappingConfig {
  organisations: OrgMapping;
}

// Processed/aggregated types
export interface GithubOrgStats {
  orgName: string;
  totalStars: number;
  repoCount: number;
  repos: GithubRepo[];
}

export interface GroupedFormats {
  govUk: string[];
  englishCouncil: string[];
  other: string[];
}

export interface OrganisationStats {
  slug: string;
  name: string;
  format: string;
  mappingType: 'gov_uk' | 'english_council' | 'other';
  totalStars: number;
  repoCount: number;
  totalRepoCount: number;
  githubOrgs: string[];
  repos: GithubRepo[];
  webUrl: string;
  parentSlug?: string;
  fte?: number;
  digitalDataFte?: number;
}

export interface OrgEntry {
  slug: string;
  name: string;
  format: string;
  totalStars: number;
  repoCount: number;
  totalRepoCount: number;
  parentSlug?: string;
  githubOrgs: string[];
  fte?: number;
  digitalDataFte?: number;
}

// Filter/sort state (client-side)
export type SortField = 'type' | 'name' | 'stars' | 'repos' | 'total' | 'fte' | 'digitalDataFte';
export type SortDirection = 'asc' | 'desc';

export interface FilterState {
  searchQuery: string;
  excludedFormats: string[]; // formats to hide (empty = show all)
  sortField: SortField;
  sortDirection: SortDirection;
}
