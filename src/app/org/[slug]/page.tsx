import { fetchGithubRepos, fetchAllGovUkOrgs, fetchPlanningDataOrgs, fetchLgaFteData, fetchCsStatsFteData } from '@/lib/data-fetcher';
import { isActiveRepo } from '@/utils/format';
import { processOrganisationData } from '@/lib/data-processor';
import RepoList from '@/components/RepoList';
import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const dynamic = 'force-static';
export const revalidate = false;

export async function generateStaticParams() {
  const [repos, govOrgs, planningOrgs, lgaFteData, csStatsFteData] = await Promise.all([fetchGithubRepos(), fetchAllGovUkOrgs(), fetchPlanningDataOrgs(), fetchLgaFteData(), fetchCsStatsFteData()]);
  const organisations = await processOrganisationData(repos, govOrgs, planningOrgs, lgaFteData, csStatsFteData);
  return organisations.map((org) => ({ slug: org.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [repos, govOrgs, planningOrgs, lgaFteData, csStatsFteData] = await Promise.all([fetchGithubRepos(), fetchAllGovUkOrgs(), fetchPlanningDataOrgs(), fetchLgaFteData(), fetchCsStatsFteData()]);

  const organisations = await processOrganisationData(repos, govOrgs, planningOrgs, lgaFteData, csStatsFteData);
  const org = organisations.find((d) => d.slug === slug);

  if (!org) {
    return {
      title: 'Organisation Not Found',
    };
  }

  return {
    title: `${org.name} - UK Public Sector Code by Organisation`,
    description: `${org.name} has ${org.repoCount} active open source repositories with ${org.totalStars.toLocaleString('en-GB')} total stars on GitHub.`,
    openGraph: {
      title: `${org.name} - UK Public Sector Code by Organisation`,
      description: `${org.repoCount} active repositories · ${org.totalStars.toLocaleString('en-GB')} total stars`,
    },
  };
}

export default async function OrganisationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [repos, govOrgs, planningOrgs, lgaFteData, csStatsFteData] = await Promise.all([fetchGithubRepos(), fetchAllGovUkOrgs(), fetchPlanningDataOrgs(), fetchLgaFteData(), fetchCsStatsFteData()]);

  const organisations = await processOrganisationData(repos, govOrgs, planningOrgs, lgaFteData, csStatsFteData);
  const org = organisations.find((d) => d.slug === slug);

  if (!org) {
    notFound();
  }

  return (
    <div>
      <nav className="mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2 text-sm">
          <li>
            <Link
              href="/"
              className="text-gov-blue underline hover:text-gov-dark-blue focus:outline-2 focus:outline-gov-blue"
            >
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-bold">
            {org.name}
          </li>
        </ol>
      </nav>

      <h2 className="text-3xl font-bold mb-2">{org.name}</h2>
      <p className="text-gov-grey mb-1">{org.format}</p>
      <p className={`text-sm ${org.fte == null && org.digitalDataFte == null ? 'mb-6' : 'mb-1'}`}>
        <svg className="inline-block w-4 h-4 mr-1 text-gov-blue" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
        <a
          href={org.webUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gov-blue underline hover:text-gov-dark-blue focus:outline-2 focus:outline-gov-blue"
        >
          {org.webUrl}
        </a>
      </p>
      {(org.fte != null || org.digitalDataFte != null) && (
        <p className="text-sm mb-6 text-gov-grey">
          {org.fte != null && <span>Total FTE: <span className="font-semibold text-gov-dark-blue">{org.fte.toLocaleString('en-GB')}</span></span>}
          {org.fte != null && org.digitalDataFte != null && <span className="mx-2">·</span>}
          {org.digitalDataFte != null && <span>Digital &amp; data FTE: <span className="font-semibold text-gov-dark-blue">{org.digitalDataFte.toLocaleString('en-GB')}</span></span>}
        </p>
      )}
      {(() => {
        const parent = org.parentSlug ? organisations.find((o) => o.slug === org.parentSlug) : null;
        const subs = organisations.filter((o) => o.parentSlug === org.slug);
        if (!parent && subs.length === 0) return null;
        return (
          <div className="text-sm text-gov-grey mb-6 space-y-1">
            {parent && (
              <p>
                Part of{' '}
                <Link
                  href={`/org/${parent.slug}`}
                  className="text-gov-blue underline hover:text-gov-dark-blue focus:outline-2 focus:outline-gov-blue"
                >
                  {parent.name}
                </Link>
              </p>
            )}
            {subs.length > 0 && (
              <p>
                Sub-organisations:{' '}
                {subs.map((sub, i) => (
                  <span key={sub.slug}>
                    {i > 0 && ', '}
                    <Link
                      href={`/org/${sub.slug}`}
                      className="text-gov-blue underline hover:text-gov-dark-blue focus:outline-2 focus:outline-gov-blue"
                    >
                      {sub.name}
                    </Link>
                  </span>
                ))}
              </p>
            )}
          </div>
        );
      })()}

      <div className="bg-gov-light-grey p-6 rounded mb-8 grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-gov-grey mb-1">Stars of active repositories</p>
          <p className="text-3xl font-bold text-gov-dark-blue">
            {org.totalStars.toLocaleString('en-GB')}
          </p>
        </div>
        <div>
          <p className="text-sm text-gov-grey mb-1">Active repositories</p>
          <p className="text-3xl font-bold text-gov-dark-blue">
            {org.repoCount.toLocaleString('en-GB')}
          </p>
        </div>
        <div>
          <p className="text-sm text-gov-grey mb-1">Total repositories</p>
          <p className="text-3xl font-bold text-gov-dark-blue">
            {org.totalRepoCount.toLocaleString('en-GB')}
          </p>
        </div>
        <div>
          <p className="text-sm text-gov-grey mb-1">GitHub organisations</p>
          <p className="text-lg font-semibold">
            {[...org.githubOrgs].sort((a, b) => {
              const aCount = org.repos.filter((r) => r.owner === a && isActiveRepo(r)).length;
              const bCount = org.repos.filter((r) => r.owner === b && isActiveRepo(r)).length;
              return bCount - aCount;
            }).map((githubOrg, index) => {
              const isInactive = !org.repos.some(
                (repo) => repo.owner === githubOrg && isActiveRepo(repo)
              );
              return (
                <span key={githubOrg}>
                  {index > 0 && ', '}
                  <span className="whitespace-nowrap">
                    <a
                      href={`https://github.com/${githubOrg}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gov-blue underline hover:text-gov-dark-blue focus:outline-2 focus:outline-gov-blue"
                    >
                      {githubOrg}
                    </a>
                    {isInactive && <span className="text-sm font-normal text-gov-grey"> (inactive)</span>}
                  </span>
                </span>
              );
            })}
          </p>
        </div>
      </div>

      <h3 className="text-2xl font-bold mb-4">Repositories</h3>
      <RepoList repos={org.repos} />
    </div>
  );
}
