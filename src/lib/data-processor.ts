import type { GithubRepo, GovUkOrg, PlanningDataOrg, OrganisationStats, OrgEntry, GroupedFormats } from './types';
import { getOrgMapping, getLocalGovEntries, getAllMappedGithubOrgs, getMissingWikidataOrgs, getDuplicateWikidataOrgs, getWikidataIdToSlug, getGovUkWikidataIds } from './mapping';
import { fetchWikidataLocalOrg } from './data-fetcher';
import { isActiveRepo } from '@/utils/format';

async function resolveParentViaWikidata(
  wikidataId: string,
  wikidataIdToSlug: Map<string, string>
): Promise<string | undefined> {
  const wikidataOrg = await fetchWikidataLocalOrg(wikidataId);
  return wikidataOrg.parentWikidataId
    ? wikidataIdToSlug.get(wikidataOrg.parentWikidataId)
    : undefined;
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
export async function processOrganisationData(
  repos: GithubRepo[],
  govUkOrgs: GovUkOrg[],
  planningDataOrgs: PlanningDataOrg[] = []
): Promise<OrganisationStats[]> {
  const mapping = getOrgMapping();
  const allowedGithubOrgs = getAllMappedGithubOrgs();
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
  console.log(`Filtered to ${liveGovUkOrgs.length} active gov.uk organisations (excluded ${govUkOrgs.length - liveGovUkOrgs.length} closed/devolved)`);

  // Filter repos: exclude archived, exclude repos not pushed in 180 days, exclude unmapped orgs
  const validRepos = repos.filter(
    (repo) => isActiveRepo(repo) && allowedGithubOrgs.includes(repo.owner)
  );

  console.log(`Filtered to ${validRepos.length} active repositories (non-archived, pushed within 180 days)`);

  // WARNING: Same GitHub org mapped to multiple gov.uk orgs
  const githubOrgToGovSlugs = new Map<string, string[]>();
  for (const [slug, config] of Object.entries(mapping)) {
    for (const githubOrg of config.githubOrgs) {
      const existing = githubOrgToGovSlugs.get(githubOrg) ?? [];
      existing.push(slug);
      githubOrgToGovSlugs.set(githubOrg, existing);
    }
  }
  for (const [githubOrg, slugs] of githubOrgToGovSlugs) {
    if (slugs.length > 1) {
      console.warn(`⚠️  Warning: GitHub org "${githubOrg}" is mapped to multiple gov.uk orgs: ${slugs.join(', ')}`);
    }
  }

  // WARNING: Orgs missing Wikidata IDs
  for (const id of getMissingWikidataOrgs()) {
    console.warn(`⚠️  Warning: "${id}" has no wikidata_id`);
  }

  // WARNING: Duplicate Wikidata IDs
  for (const { wikidataId, orgs } of getDuplicateWikidataOrgs()) {
    console.warn(`⚠️  Warning: wikidata_id "${wikidataId}" is shared by multiple entries: ${orgs.join(', ')}`);
  }

  // WARNING: GitHub orgs in the data that aren't in the mapping
  const allGithubOrgsInData = new Set(repos.map((repo) => repo.owner));
  for (const githubOrg of allGithubOrgsInData) {
    if (!allowedGithubOrgs.includes(githubOrg)) {
      console.warn(`⚠️  Warning: GitHub org "${githubOrg}" is not in org-mapping.json`);
    }
  }

  // Create gov.uk org lookup (live orgs only)
  const govOrgBySlug = new Map<string, GovUkOrg>();
  for (const org of liveGovUkOrgs) {
    govOrgBySlug.set(org.details.slug, org);
  }

  // Also create a lookup for all orgs (to check if a mapped org is closed)
  const allGovOrgBySlug = new Map<string, GovUkOrg>();
  for (const org of govUkOrgs) {
    allGovOrgBySlug.set(org.details.slug, org);
  }

  // VALIDATION: Check that all mapped gov.uk slugs exist and are live
  for (const slug of Object.keys(mapping)) {
    const org = allGovOrgBySlug.get(slug);
    if (!org) {
      throw new Error(
        `❌ BUILD FAILED: Gov.uk slug "${slug}" in mapping file not found in gov.uk API. ` +
        `The mapping file may be stale. Please update public/data/org-mapping.json`
      );
    }
    if (org.details.govuk_status === 'closed') {
      throw new Error(
        `❌ BUILD FAILED: Gov.uk org "${slug}" in mapping file is closed. ` +
        `The mapping file may be stale. Please update public/data/org-mapping.json`
      );
    }
    if (org.details.govuk_status === 'devolved' && org.details.govuk_closed_status === 'devolved') {
      throw new Error(
        `❌ BUILD FAILED: Gov.uk org "${slug}" in mapping file is devolved. ` +
        `The mapping file may be stale. Please update public/data/org-mapping.json`
      );
    }
  }

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

    // Warn if this org has a parent on GOV.UK but the parent isn't in our mapping
    for (const p of parentSlugs) {
      if (!(p in mapping)) {
        console.warn(`⚠️  Warning: "${slug}" has parent "${p}" on GOV.UK but "${p}" is not in org-mapping.json`);
      }
    }

    // Fall back to Wikidata if no parent found via GOV.UK
    if (!parentSlug) {
      const wikidataId = govUkWikidataIds.get(slug);
      if (wikidataId) {
        parentSlug = await resolveParentViaWikidata(wikidataId, wikidataIdToSlug);
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
    });
  }

  // Process local government / other entries
  const localGovEntries = getLocalGovEntries();
  const planningDataByRef = new Map<string, PlanningDataOrg>();
  for (const org of planningDataOrgs) {
    planningDataByRef.set(org.reference, org);
  }

  for (const entry of localGovEntries) {
    let name: string;
    let webUrl: string;
    let format: string;
    let parentSlug: string | undefined;

    if (entry.type === 'planning_data') {
      const planningOrg = planningDataByRef.get(entry.planningDataReference);
      if (!planningOrg) {
        throw new Error(
          `❌ BUILD FAILED: england_planning_data_reference "${entry.planningDataReference}" not found in planning.data.gov.uk. ` +
          `Please update public/data/org-mapping.json`
        );
      }
      if (planningOrg['end-date']) {
        throw new Error(
          `❌ BUILD FAILED: Local authority "${entry.planningDataReference}" (${planningOrg.name}) has end-date "${planningOrg['end-date']}". ` +
          `Please update public/data/org-mapping.json`
        );
      }
      name = planningOrg.name;
      webUrl = planningOrg.website;
      format = LOCAL_AUTHORITY_TYPE[planningOrg['local-authority-type']] ?? planningOrg['local-authority-type'];
      if (entry.wikidataId) {
        parentSlug = await resolveParentViaWikidata(entry.wikidataId, wikidataIdToSlug);
      }
    } else {
      const wikidataOrg = await fetchWikidataLocalOrg(entry.wikidataId);
      name = wikidataOrg.name;
      webUrl = wikidataOrg.webUrl;
      format = wikidataOrg.format ?? 'Other';
      parentSlug = await resolveParentViaWikidata(entry.wikidataId, wikidataIdToSlug);
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
    });
  }

  const organisations = Array.from(orgMap.values());
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
  for (const f of govUk) englishCouncil.delete(f);
  for (const f of govUk) other.delete(f);
  for (const f of englishCouncil) other.delete(f);
  return {
    govUk: Array.from(govUk).sort(),
    englishCouncil: Array.from(englishCouncil).sort(),
    other: Array.from(other).sort(),
  };
}
