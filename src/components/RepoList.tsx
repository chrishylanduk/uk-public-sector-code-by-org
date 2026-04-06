'use client';

import { useMemo } from 'react';
import { useQueryState, parseAsInteger, parseAsBoolean } from 'nuqs';
import type { GithubRepo } from '@/lib/types';
import { isActiveRepo } from '@/utils/format';
import RepoCard from './RepoCard';

interface Props {
  repos: GithubRepo[];
}

const REPOS_PER_PAGE = 10;
const URL_OPTIONS = { history: 'replace', shallow: true, scroll: false } as const;

export default function RepoList({ repos }: Props) {
  const [activeOnly, setActiveOnly] = useQueryState('active', parseAsBoolean.withDefault(true).withOptions(URL_OPTIONS));
  const [currentPage, setCurrentPage] = useQueryState('page', parseAsInteger.withDefault(1).withOptions(URL_OPTIONS));

  const filtered = useMemo(
    () => activeOnly ? repos.filter(isActiveRepo) : repos,
    [repos, activeOnly]
  );

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => b.stargazersCount - a.stargazersCount),
    [filtered]
  );

  const totalPages = Math.ceil(sorted.length / REPOS_PER_PAGE);
  const startIndex = (currentPage - 1) * REPOS_PER_PAGE;
  const currentRepos = sorted.slice(startIndex, startIndex + REPOS_PER_PAGE);

  const handleFilterChange = (checked: boolean) => {
    setActiveOnly(checked);
    setCurrentPage(1);
  };

  if (repos.length === 0) {
    return <p className="text-grey">This organisation has no public repositories.</p>;
  }

  const scrollToRepos = () => document.getElementById('repositories')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div>
      <div className="mb-4 space-y-2">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => handleFilterChange(e.target.checked)}
            className=""
          />
          Active only (not archived, pushed to within the last 180 days)
        </label>
        <p className="text-sm text-grey">
          Showing {startIndex + 1}–{Math.min(startIndex + REPOS_PER_PAGE, sorted.length)} of {sorted.length}{' '}
          repositories, sorted by stars
        </p>
      </div>

      <div className="space-y-4 mb-6">
        {currentRepos.map((repo) => (
          <RepoCard key={repo.url} repo={repo} />
        ))}
      </div>

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
