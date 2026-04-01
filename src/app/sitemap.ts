export const dynamic = 'force-static';

import type { MetadataRoute } from 'next';
import { fetchGithubRepos, fetchAllGovUkOrgs, fetchPlanningDataOrgs, fetchLgaFteData, fetchCsStatsFteData } from '@/lib/data-fetcher';
import { processOrganisationData } from '@/lib/data-processor';
import { SITE_URL } from './layout';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [repos, govOrgs, planningOrgs, lgaFteData, csStatsFteData] = await Promise.all([
    fetchGithubRepos(), fetchAllGovUkOrgs(), fetchPlanningDataOrgs(), fetchLgaFteData(), fetchCsStatsFteData(),
  ]);
  const organisations = await processOrganisationData(repos, govOrgs, planningOrgs, lgaFteData, csStatsFteData);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, priority: 1 },
    { url: `${SITE_URL}/data`, priority: 0.9 },
  ];

  const orgRoutes: MetadataRoute.Sitemap = organisations.map((org) => ({
    url: `${SITE_URL}/org/${org.slug}`,
    priority: 0.5,
  }));

  return [...staticRoutes, ...orgRoutes];
}
