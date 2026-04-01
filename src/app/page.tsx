import { fetchGithubRepos, fetchAllGovUkOrgs, fetchPlanningDataOrgs, fetchLgaFteData, fetchCsStatsFteData } from '@/lib/data-fetcher';
import { processOrganisationData, getOrgList, getGroupedFormats } from '@/lib/data-processor';
import OrgDirectory from '@/components/OrgDirectory';
import { formatDateTime } from '@/utils/format';
import Link from 'next/link';

export const dynamic = 'force-static';
export const revalidate = false;

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
          Explore the open source code published by UK public sector organisations
        </h2>
        <p className="text-lg mb-3">
          Powered by a mapping of GitHub organisations to UK public sector organisations.
          The mapping data is open and available for others to use:{' '}
          <Link
            href="/data"
            className="text-gov-blue underline hover:text-gov-dark-blue focus:outline-2 focus:outline-gov-blue"
          >
            get the mapping data
          </Link>
          .
        </p>
        <p className="text-base mb-3">
          Currently tracking <strong>{orgList.length} organisations</strong> and{' '}
          <strong>{totalRepos.toLocaleString('en-GB')} active repositories</strong> (pushed to within the last 180 days).
        </p>
        <p className="text-sm text-gov-grey">
          Data last updated: {formatDateTime(buildDate)}
        </p>
      </div>

      <OrgDirectory entries={orgList} availableFormats={formats} />
    </div>
  );
}
