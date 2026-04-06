import type { GithubRepo } from '@/lib/types';
import { isActiveRepo } from '@/utils/format';
import RepoCard from './RepoCard';

interface Props {
  repos: GithubRepo[];
}

export default function StaticRepoList({ repos }: Props) {
  const active = repos
    .filter(isActiveRepo)
    .sort((a, b) => b.stargazersCount - a.stargazersCount);

  if (active.length === 0) {
    return <p className="text-grey">This organisation has no active public repositories.</p>;
  }

  return (
    <div>
      <p className="text-sm text-grey mb-4">
        Showing all {active.length} active repositories, sorted by stars
      </p>
      <div className="space-y-4">
        {active.map((repo) => (
          <RepoCard key={repo.url} repo={repo} />
        ))}
      </div>
    </div>
  );
}
