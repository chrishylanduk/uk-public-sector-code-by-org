import { Suspense } from 'react';
import { fetchGithubRepos, fetchAllGovUkOrgs, fetchPlanningDataOrgs, fetchLgaFteData, fetchCsStatsFteData } from '@/lib/data-fetcher';
import { processOrganisationData, getOrgList, getGroupedFormats } from '@/lib/data-processor';
import OrgDirectory from '@/components/OrgDirectory';
import StaticOrgTable from '@/components/StaticOrgTable';
import LocalTime from '@/components/LocalTime';
import Link from 'next/link';


export default async function HomePage() {
  // Fetch data at build time
  const [repos, govOrgs, planningOrgs, lgaFteData, csStatsFteData] = await Promise.all([fetchGithubRepos(), fetchAllGovUkOrgs(), fetchPlanningDataOrgs(), fetchLgaFteData(), fetchCsStatsFteData()]);

  const organisations = await processOrganisationData(repos, govOrgs, planningOrgs, lgaFteData, csStatsFteData);
  const orgList = getOrgList(organisations);
  const formats = getGroupedFormats(organisations);

  const buildDate = new Date();
  const totalRepos = orgList.reduce((sum, entry) => sum + entry.repoCount, 0);

  return (
    <div>
      <div className="mb-10 max-w-3xl">
        <h2 className="text-4xl font-bold mb-4 leading-tight tracking-tight">
          Explore all the open source code from each UK public sector organisation
        </h2>
        <p className="text-lg mb-3">
          Powered by a mapping of UK public sector organisations to their GitHub accounts, because each organisation has up to 14 accounts.
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
          <strong>{totalRepos.toLocaleString('en-GB')} active repositories</strong> (not archived, pushed to within the last 180 days).
        </p>
        <p className="text-sm text-grey">
          Data last updated: <LocalTime iso={buildDate.toISOString()} />
        </p>
      </div>

      <Suspense fallback={<StaticOrgTable entries={orgList} />}>
        <OrgDirectory entries={orgList} availableFormats={formats} />
      </Suspense>
    </div>
  );
}
