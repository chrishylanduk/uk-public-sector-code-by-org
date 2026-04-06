import type { GithubRepo, GovUkOrg, PlanningDataOrg, OrganisationStats, OrgEntry, GroupedFormats } from './types';
import { getOrgMapping, getLocalGovEntries, getAllMappedGithubOrgs, getMissingWikidataOrgs, getDuplicateWikidataOrgs, getWikidataIdToSlug, getGovUkWikidataIds } from './mapping';
import { fetchWikidataLocalOrgs } from './data-fetcher';
import type { CsStatsFteEntry } from './data-fetcher';
import { isActiveRepo } from '@/utils/format';

function resolveParentViaWikidata(
  wikidataId: string,
  wikidataOrgs: Map<string, import('./types').WikidataLocalOrg>,
  wikidataIdToSlug: Map<string, string>
): string | undefined {
  const org = wikidataOrgs.get(wikidataId);
  return org?.parentWikidataId ? wikidataIdToSlug.get(org.parentWikidataId) : undefined;
}

const LOCAL_AUTHORITY_TYPE: Record<string, string> = {
  CTY: 'County council',
  MD: 'Metropolitan district',
  LBO: 'London borough',
  UA: 'Unitary authority',
  NMD: 'Non-metropolitan district',
  COMB: 'Combined authority',
  SRA: 'Strategic regional authority',
  PARK: 'National park authority',
  SD: 'Special district',
  SCO: 'Scottish council',
  WD: 'Welsh council',
  NID: 'Northern Ireland district',
};


/**
 * Process and aggregate organisation data
 * Validates mapping file and fails build if stale
 */
function normaliseOrgName(s: string): string {
  return s.replace(/&/g, 'and').replace(/\s+/g, ' ').trim().toLowerCase();
}

/**
 * Run data quality checks. Call from prebuild only — not during page rendering.
 * Throws on critical errors; warns on issues that don't block builds.
 */
export function validateDataQuality(repos: GithubRepo[], govUkOrgs: GovUkOrg[], planningDataOrgs: PlanningDataOrg[]): void {
  const mapping = getOrgMapping();
  const allowedGithubOrgs = getAllMappedGithubOrgs();
  const localGovEntries = getLocalGovEntries();

  // FAIL: Same GitHub org mapped to multiple orgs
  const githubOrgToSlugs = new Map<string, string[]>();
  for (const [slug, config] of Object.entries(mapping)) {
    for (const githubOrg of config.githubOrgs) {
      const existing = githubOrgToSlugs.get(githubOrg) ?? [];
      existing.push(slug);
      githubOrgToSlugs.set(githubOrg, existing);
    }
  }
  for (const [githubOrg, slugs] of githubOrgToSlugs) {
    if (slugs.length > 1) {
      throw new Error(`❌ GitHub org "${githubOrg}" is mapped to multiple orgs: ${slugs.join(', ')}`);
    }
  }

  // FAIL: Orgs missing Wikidata IDs
  for (const id of getMissingWikidataOrgs()) {
    throw new Error(`❌ "${id}" has no wikidata_id`);
  }

  // FAIL: Duplicate Wikidata IDs
  for (const { wikidataId, orgs } of getDuplicateWikidataOrgs()) {
    throw new Error(`❌ wikidata_id "${wikidataId}" is shared by multiple entries: ${orgs.join(', ')}`);
  }

  // FAIL: Mapped gov.uk slugs that don't exist or are closed/devolved
  const govOrgBySlug = new Map<string, GovUkOrg>();
  for (const org of govUkOrgs) govOrgBySlug.set(org.details.slug, org);
  for (const slug of Object.keys(mapping)) {
    const org = govOrgBySlug.get(slug);
    if (!org) {
      throw new Error(`❌ Gov.uk slug "${slug}" not found in gov.uk API — mapping may be stale`);
    }
    if (org.details.govuk_status === 'closed') {
      throw new Error(`❌ Gov.uk org "${slug}" is closed — mapping may be stale`);
    }
    if (org.details.govuk_status === 'devolved' && org.details.govuk_closed_status === 'devolved') {
      throw new Error(`❌ Gov.uk org "${slug}" is devolved — mapping may be stale`);
    }
  }

  // FAIL: Planning data references that don't exist or have an end-date
  const planningDataByRef = new Map<string, PlanningDataOrg>();
  for (const org of planningDataOrgs) planningDataByRef.set(org.reference, org);
  for (const entry of localGovEntries) {
    if (entry.type !== 'planning_data') continue;
    const planningOrg = planningDataByRef.get(entry.planningDataReference);
    if (!planningOrg) {
      throw new Error(`❌ england_planning_data_reference "${entry.planningDataReference}" not found in planning.data.gov.uk`);
    }
    if (planningOrg['end-date']) {
      throw new Error(`❌ Local authority "${entry.planningDataReference}" (${planningOrg.name}) has end-date "${planningOrg['end-date']}"`);
    }
  }

  // WARN: GitHub orgs in the data that aren't in the mapping
  const allGithubOrgsInData = new Set(repos.map((repo) => repo.owner));
  for (const githubOrg of allGithubOrgsInData) {
    if (!allowedGithubOrgs.includes(githubOrg)) {
      console.warn(`⚠️  Warning: GitHub org "${githubOrg}" is not in org-mapping.json`);
    }
  }

  // WARN: Gov.uk orgs whose parent isn't in the mapping
  for (const slug of Object.keys(mapping)) {
    const govOrg = govOrgBySlug.get(slug);
    if (!govOrg) continue;
    for (const p of (govOrg.parent_organisations ?? []).map((po) => po.id.split('/').pop()!)) {
      if (!(p in mapping)) {
        console.warn(`⚠️  Warning: "${slug}" has parent "${p}" on GOV.UK but "${p}" is not in org-mapping.json`);
      }
    }
  }
}

let _organisationDataPromise: Promise<OrganisationStats[]> | null = null;

export function processOrganisationData(
  repos: GithubRepo[],
  govUkOrgs: GovUkOrg[],
  planningDataOrgs: PlanningDataOrg[] = [],
  lgaFteData: Map<string, number> = new Map(),
  csStatsFteData: Map<string, CsStatsFteEntry> = new Map()
): Promise<OrganisationStats[]> {
  if (!_organisationDataPromise) {
    _organisationDataPromise = _processOrganisationData(repos, govUkOrgs, planningDataOrgs, lgaFteData, csStatsFteData);
  }
  return _organisationDataPromise;
}

async function _processOrganisationData(
  repos: GithubRepo[],
  govUkOrgs: GovUkOrg[],
  planningDataOrgs: PlanningDataOrg[],
  lgaFteData: Map<string, number>,
  csStatsFteData: Map<string, CsStatsFteEntry>
): Promise<OrganisationStats[]> {
  const mapping = getOrgMapping();
  const wikidataIdToSlug = getWikidataIdToSlug();
  const govUkWikidataIds = getGovUkWikidataIds();

  // Deduplicate repos by URL in case the scraper contains duplicate entries
  const seen = new Set<string>();
  repos = repos.filter((repo) => {
    if (seen.has(repo.url)) return false;
    seen.add(repo.url);
    return true;
  });

  // Filter out closed/devolved gov.uk orgs
  const liveGovUkOrgs = govUkOrgs.filter((org) => {
    if (org.details.govuk_status === 'closed') return false;
    if (org.details.govuk_status === 'devolved' && org.details.govuk_closed_status === 'devolved') return false;
    return true;
  });
  // Create gov.uk org lookup (live orgs only)
  const govOrgBySlug = new Map<string, GovUkOrg>();
  for (const org of liveGovUkOrgs) {
    govOrgBySlug.set(org.details.slug, org);
  }

  // Pre-fetch all Wikidata orgs needed (gov.uk parent fallbacks + local gov entries) in one batch
  const localGovEntriesEarly = getLocalGovEntries();
  const allWikidataIds = [...new Set([
    ...[...govUkWikidataIds.values()],
    ...localGovEntriesEarly.map((e) => e.wikidataId).filter((id): id is string => !!id),
  ])];
  const wikidataOrgs = await fetchWikidataLocalOrgs(allWikidataIds);

  // Aggregate by gov.uk org slug
  const orgMap = new Map<string, OrganisationStats>();

  for (const [slug, config] of Object.entries(mapping)) {
    const govOrg = govOrgBySlug.get(slug)!; // Safe because we validated above

    const allOrgRepos = repos.filter((repo) => config.githubOrgs.includes(repo.owner));
    const activeOrgRepos = allOrgRepos.filter(isActiveRepo);

    const totalStars = activeOrgRepos.reduce((sum, repo) => sum + repo.stargazersCount, 0);

    // Find parent slug via GOV.UK API first, then fall back to Wikidata P749
    const parentSlugs = (govOrg.parent_organisations ?? []).map((p) => p.id.split('/').pop()!);
    let parentSlug = parentSlugs.find((s) => s in mapping);

    // Fall back to Wikidata if no parent found via GOV.UK
    if (!parentSlug) {
      const wikidataId = govUkWikidataIds.get(slug);
      if (wikidataId) {
        parentSlug = resolveParentViaWikidata(wikidataId, wikidataOrgs, wikidataIdToSlug);
      }
    }

    const abbr = govOrg.details.abbreviation;
    const name = abbr && abbr !== govOrg.title
      ? `${govOrg.title} (${abbr})`
      : govOrg.title;

    orgMap.set(slug, {
      slug,
      name,
      format: govOrg.format,
      mappingType: 'gov_uk',
      totalStars,
      repoCount: activeOrgRepos.length,
      totalRepoCount: allOrgRepos.length,
      githubOrgs: config.githubOrgs,
      repos: allOrgRepos,
      webUrl: govOrg.web_url,
      parentSlug,
      fte: csStatsFteData.get(normaliseOrgName(govOrg.title))?.fte,
      digitalDataFte: csStatsFteData.get(normaliseOrgName(govOrg.title))?.digitalDataFte,
    });
  }

  // Process local government / other entries
  const localGovEntries = localGovEntriesEarly;
  const planningDataByRef = new Map<string, PlanningDataOrg>();
  for (const org of planningDataOrgs) {
    planningDataByRef.set(org.reference, org);
  }

  for (const entry of localGovEntries) {
    let name: string;
    let webUrl: string;
    let format: string;
    let parentSlug: string | undefined;
    let fte: number | undefined;

    if (entry.type === 'planning_data') {
      const planningOrg = planningDataByRef.get(entry.planningDataReference)!;
      name = planningOrg.name;
      webUrl = planningOrg.website;
      format = LOCAL_AUTHORITY_TYPE[planningOrg['local-authority-type']] ?? planningOrg['local-authority-type'];
      if (entry.wikidataId) {
        parentSlug = resolveParentViaWikidata(entry.wikidataId, wikidataOrgs, wikidataIdToSlug);
      }
      fte = lgaFteData.get(planningOrg['statistical-geography']);
    } else {
      const wikidataOrg = wikidataOrgs.get(entry.wikidataId)!;
      name = wikidataOrg.name;
      webUrl = wikidataOrg.webUrl;
      format = wikidataOrg.format ?? 'Other';
      parentSlug = resolveParentViaWikidata(entry.wikidataId, wikidataOrgs, wikidataIdToSlug);
    }

    const slug = entry.siteSlug!;

    const allOrgRepos = repos.filter((repo) => entry.githubOrgs.includes(repo.owner));
    const activeOrgRepos = allOrgRepos.filter(isActiveRepo);
    const totalStars = activeOrgRepos.reduce((sum, repo) => sum + repo.stargazersCount, 0);

    orgMap.set(slug, {
      slug,
      name,
      format,
      mappingType: entry.type === 'planning_data' ? 'english_council' : 'other',
      totalStars,
      repoCount: activeOrgRepos.length,
      totalRepoCount: allOrgRepos.length,
      githubOrgs: entry.githubOrgs,
      repos: allOrgRepos,
      webUrl,
      parentSlug,
      fte,
    });
  }

  const organisations = Array.from(orgMap.values());

  // Suffix "(Other)" on other-type orgs whose format clashes with gov_uk or english_council
  const nonOtherFormats = new Set(
    organisations.filter((o) => o.mappingType !== 'other').map((o) => o.format)
  );
  for (const org of organisations) {
    if (org.mappingType === 'other' && nonOtherFormats.has(org.format)) {
      org.format = `${org.format} (Other)`;
    }
  }

  console.log(`✓ Processed ${organisations.length} organisations`);

  return organisations;
}

/**
 * Get a flat list of organisations sorted alphabetically
 */
export function getOrgList(organisations: OrganisationStats[]): OrgEntry[] {
  return [...organisations]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((org) => ({
      slug: org.slug,
      name: org.name,
      format: org.format,
      totalStars: org.totalStars,
      repoCount: org.repoCount,
      totalRepoCount: org.totalRepoCount,
      parentSlug: org.parentSlug,
      githubOrgs: org.githubOrgs,
      fte: org.fte,
      digitalDataFte: org.digitalDataFte,
    }));
}

/**
 * Get unique organisation formats grouped by mapping type
 */
export function getGroupedFormats(organisations: OrganisationStats[]): GroupedFormats {
  const govUk = new Set<string>();
  const englishCouncil = new Set<string>();
  const other = new Set<string>();
  for (const org of organisations) {
    if (org.mappingType === 'gov_uk') govUk.add(org.format);
    else if (org.mappingType === 'english_council') englishCouncil.add(org.format);
    else other.add(org.format);
  }
  return {
    govUk: Array.from(govUk).sort(),
    englishCouncil: Array.from(englishCouncil).sort(),
    other: Array.from(other).sort(),
  };
}
