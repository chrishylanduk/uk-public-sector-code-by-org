'use client';

import { useMemo } from 'react';
import { useQueryState, parseAsInteger, parseAsStringLiteral } from 'nuqs';
import type { GithubRepo, UnavailableRepo } from '@/lib/types';
import { isActiveRepo } from '@/utils/format';
import RepoCard from './RepoCard';

interface Props {
  repos: GithubRepo[];
  unavailableRepos?: UnavailableRepo[];
}

const REPOS_PER_PAGE = 10;
const UNAVAILABLE_PER_PAGE = 50;
const URL_OPTIONS = { history: 'replace', shallow: true, scroll: false } as const;
const FILTER_VALUES = ['active', 'all', 'unavailable'] as const;
type FilterValue = typeof FILTER_VALUES[number];

export default function RepoList({ repos, unavailableRepos }: Props) {
  const hasUnavailable = (unavailableRepos?.length ?? 0) > 0;

  const [filter, setFilter] = useQueryState(
    'filter',
    parseAsStringLiteral(FILTER_VALUES).withDefault('active').withOptions(URL_OPTIONS)
  );
  const [currentPage, setCurrentPage] = useQueryState('page', parseAsInteger.withDefault(1).withOptions(URL_OPTIONS));

  const effectiveFilter: FilterValue = filter === 'unavailable' && !hasUnavailable ? 'active' : filter;

  const { sorted, isUnavailableView } = useMemo(() => {
    if (effectiveFilter === 'unavailable') {
      return {
        sorted: [...(unavailableRepos ?? [])].sort((a, b) => a.owner.localeCompare(b.owner) || a.name.localeCompare(b.name)),
        isUnavailableView: true,
      };
    }
    const filtered = effectiveFilter === 'active' ? repos.filter(isActiveRepo) : repos;
    return {
      sorted: [...filtered].sort((a, b) => b.stargazersCount - a.stargazersCount),
      isUnavailableView: false,
    };
  }, [repos, unavailableRepos, effectiveFilter]);

  const perPage = isUnavailableView ? UNAVAILABLE_PER_PAGE : REPOS_PER_PAGE;
  const totalPages = Math.ceil(sorted.length / perPage);
  const startIndex = (currentPage - 1) * perPage;
  const currentItems = sorted.slice(startIndex, startIndex + perPage);

  const handleFilterChange = (next: FilterValue) => {
    setFilter(next);
    setCurrentPage(1);
  };

  if (repos.length === 0 && !hasUnavailable) {
    return <p className="text-grey">This organisation has no public repositories.</p>;
  }

  const scrollToRepos = () => document.getElementById('repositories')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const FILTER_LABELS: Record<FilterValue, string> = {
    active: 'Active: currently on GitHub, not archived, and pushed to within 180 days',
    all: 'Live: currently on GitHub',
    unavailable: 'Unavailable: previously on GitHub but not currently found',
  };

  const filterBtn = (value: FilterValue, label: string, borderLeft = true) => (
    <button
      onClick={() => handleFilterChange(value)}
      aria-pressed={effectiveFilter === value}
      aria-label={FILTER_LABELS[value]}
      className={`px-3 py-1.5 text-sm focus:outline-2 focus:outline-orange
        ${effectiveFilter === value ? 'bg-orange text-white font-medium' : 'bg-white hover:bg-light-grey'}
        ${borderLeft ? 'border-l border-mid-grey' : ''}`}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="mb-4 space-y-2">
        <div
          role="group"
          aria-label="Repository filter"
          className="flex border border-mid-grey rounded overflow-hidden w-fit"
        >
          {filterBtn('active', 'Active', false)}
          {filterBtn('all', 'Live')}
          {hasUnavailable && filterBtn('unavailable', 'Unavailable')}
        </div>
        <p className="text-xs text-grey">
          <strong>Active:</strong> currently on GitHub, not archived, and pushed to within 180 days.
          {' '}<strong>Live:</strong> currently on GitHub.
          {hasUnavailable && <> <strong>Unavailable:</strong> previously on GitHub but not currently found.</>}
        </p>
        <p className="text-sm text-grey">
          {`Showing ${startIndex + 1}–${Math.min(startIndex + perPage, sorted.length)} of ${sorted.length} ${isUnavailableView ? 'unavailable' : effectiveFilter === 'active' ? 'active' : 'live'} ${sorted.length === 1 ? 'repository' : 'repositories'}, sorted ${isUnavailableView ? 'by organisation then name' : 'by stars'}`}
        </p>
      </div>

      {isUnavailableView ? (
        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b border-mid-grey text-left text-grey">
              <th scope="col" className="py-2 pr-4 font-medium w-px whitespace-nowrap">GitHub organisation</th>
              <th scope="col" className="py-2 font-medium">Repository name</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-mid-grey">
            {(currentItems as UnavailableRepo[]).map((repo) => (
              <tr key={repo.url}>
                <td className="py-2 pr-4 w-px whitespace-nowrap">
                  <a
                    href={`https://github.com/${repo.owner}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange underline hover:text-dark-orange focus:outline-2 focus:outline-orange"
                  >
                    {repo.owner}
                  </a>
                </td>
                <td className="py-2">
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange underline hover:text-dark-orange focus:outline-2 focus:outline-orange"
                  >
                    {repo.name}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="space-y-4 mb-6">
          {(currentItems as GithubRepo[]).map((repo) => (
            <RepoCard key={repo.url} repo={repo} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-mid-grey pt-4">
          <button
            onClick={() => { setCurrentPage((p) => Math.max(1, p - 1)); scrollToRepos(); }}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-orange text-white rounded hover:bg-dark-orange disabled:bg-grey disabled:cursor-not-allowed focus:outline-2 focus:outline-orange"
            aria-label="Previous page"
          >
            Previous
          </button>
          <span className="text-sm text-grey">Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => { setCurrentPage((p) => Math.min(totalPages, p + 1)); scrollToRepos(); }}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-orange text-white rounded hover:bg-dark-orange disabled:bg-grey disabled:cursor-not-allowed focus:outline-2 focus:outline-orange"
            aria-label="Next page"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
