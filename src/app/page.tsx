import { Suspense } from 'react';
import { fetchGithubRepos, fetchAllGovUkOrgs, fetchPlanningDataOrgs, fetchLgaFteData, fetchCsStatsFteData, fetchUnavailableRepos } from '@/lib/data-fetcher';
import { processOrganisationData, getOrgList, getGroupedFormats } from '@/lib/data-processor';
import OrgDirectory from '@/components/OrgDirectory';
import StaticOrgTable from '@/components/StaticOrgTable';
import LocalTime from '@/components/LocalTime';
import Link from 'next/link';


export default async function HomePage() {
  const [repos, govOrgs, planningOrgs, lgaFteData, csStatsFteData, unavailableRepos] = await Promise.all([
    fetchGithubRepos(), fetchAllGovUkOrgs(), fetchPlanningDataOrgs(), fetchLgaFteData(), fetchCsStatsFteData(), fetchUnavailableRepos(),
  ]);

  const organisations = await processOrganisationData(repos, govOrgs, planningOrgs, lgaFteData, csStatsFteData, unavailableRepos);
  const orgList = getOrgList(organisations);
  const formats = getGroupedFormats(organisations);

  const buildDate = new Date();
  const totalActiveRepos = orgList.reduce((sum, entry) => sum + entry.repoCount, 0);
  const totalLiveRepos = orgList.reduce((sum, entry) => sum + entry.totalRepoCount, 0);
  const totalUnavailableRepos = orgList.reduce((sum, entry) => sum + (entry.unavailableRepoCount ?? 0), 0);
  const hasUnavailableData = totalUnavailableRepos > 0;

  return (
    <div>
      <div className="mb-10 max-w-3xl">
        <h2 className="text-4xl font-bold mb-4 leading-tight tracking-tight">
          Explore all the open source code from each UK public sector organisation
        </h2>
        <p className="text-lg mb-3">
          Powered by a mapping of UK public sector organisations to their GitHub accounts, because each organisation has up to 20 accounts.
        </p>
        <p className="text-lg mb-3">
          The mapping data is open and available for others to use:{' '}
          <Link
            href="/data"
            className="text-orange underline hover:text-dark-orange focus:outline-2 focus:outline-orange"
          >
            get the mapping data
          </Link>
          .
        </p>
        <p className="text-base mb-3">
          Currently tracking <strong>{orgList.length} organisations</strong> and{' '}
          <strong>{totalLiveRepos.toLocaleString('en-GB')} live repositories</strong>, of which{' '}
          <strong>{totalActiveRepos.toLocaleString('en-GB')} are active</strong> (not archived, pushed to within 180 days).
        </p>
        <p className="text-sm text-grey">
          Data last updated: <LocalTime iso={buildDate.toISOString()} />
        </p>
      </div>

      <Suspense fallback={<StaticOrgTable entries={orgList} hasUnavailableData={hasUnavailableData} />}>
        <OrgDirectory entries={orgList} availableFormats={formats} hasUnavailableData={hasUnavailableData} />
      </Suspense>
    </div>
  );
}
