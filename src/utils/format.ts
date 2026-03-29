/**
 * Convert a name to a URL-safe kebab-case slug
 */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Check if a repository is active (non-archived and pushed within last 180 days)
 */
export function isActiveRepo(repo: { archived: boolean; pushedAt: string }): boolean {
  if (repo.archived) return false;
  const daysSincePush = (Date.now() - new Date(repo.pushedAt).getTime()) / (1000 * 60 * 60 * 24);
  return daysSincePush <= 180;
}

/**
 * Format number with UK locale (commas for thousands)
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-GB');
}

/**
 * Format date to UK format
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Format date and time to UK format
 */
export function formatDateTime(date: Date): string {
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}
