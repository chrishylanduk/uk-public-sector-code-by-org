import type { GithubRepo } from '@/lib/types';
import { formatDate } from '@/utils/format';

interface Props {
  repo: GithubRepo;
}

export default function RepoCard({ repo }: Props) {
  return (
    <article className="border border-mid-grey rounded p-4 hover:border-orange transition-colors">
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 flex flex-col items-center justify-center min-w-[4rem]">
          <span className="flex items-center font-bold text-dark-orange text-sm" title={`${repo.stargazersCount} stars`}>
            <svg
              className="w-4 h-4 mr-1 text-yellow-500"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {repo.stargazersCount.toLocaleString('en-GB')}
          </span>
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-lg font-bold">
                <a
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange underline hover:text-dark-orange focus:outline-2 focus:outline-orange"
                >
                  {repo.name}
                </a>
              </h4>
              {repo.archived && (
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-200 text-gray-600">
                  Archived
                </span>
              )}
            </div>
            {repo.language && (
              <span className="flex items-center text-sm text-grey">
                <span className="w-3 h-3 rounded-full bg-orange mr-1" aria-hidden="true" />
                {repo.language}
              </span>
            )}
          </div>

          {repo.description && <p className="text-grey mb-2">{repo.description}</p>}

          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm text-grey">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <span>Last pushed: {formatDate(new Date(repo.pushedAt))}</span>
              {repo.license && (
                <span>License: <span className="font-medium">{repo.license.name}</span></span>
              )}
            </div>
            <a
              href={`https://github.com/${repo.owner}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-dark-orange focus:outline-2 focus:outline-orange"
            >
              github.com/{repo.owner}
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
