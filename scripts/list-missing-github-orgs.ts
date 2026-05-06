#!/usr/bin/env tsx

/**
 * Developer tool: reports GitHub org coverage gaps.
 *
 * Outputs:
 *   1. Scraper orgs not in mapping
 *   2. Mapping orgs not in scraper
 *   3. uk-gov-mirror orgs not in scraper
 *   4. Scraper orgs not in uk-gov-mirror
 *
 * Usage: npm run list-missing-github-orgs
 */

import fs from 'fs';
import path from 'path';
import { fetchGithubRepos } from '../src/lib/data-fetcher';
import { getAllMappedGithubOrgs } from '../src/lib/mapping';

const CACHE_DIR = path.join(process.cwd(), '.cache');
const MIRROR_CACHE_FILE = path.join(CACHE_DIR, 'uk-gov-mirror-orgs.json');
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function isCacheFresh(filePath: string): boolean {
  try {
    const age = Date.now() - fs.statSync(filePath).mtimeMs;
    return age < CACHE_MAX_AGE_MS;
  } catch {
    return false;
  }
}

const GRAPHQL_URL = 'https://api.github.com/graphql';
const MAX_RETRIES = 5;
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function graphqlFetch(query: string): Promise<unknown> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN is required (uk-gov-mirror has ~21k repos)');

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    let resp: Response;
    try {
      resp = await fetch(GRAPHQL_URL, {
        method: 'POST',
        headers: {
          Authorization: `bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'uk-public-sector-code-by-org',
        },
        body: JSON.stringify({ query }),
      });
    } catch (err) {
      const waitMs = Math.min(2000 * Math.pow(2, attempt), 60000);
      console.log(`Network error, retrying in ${Math.ceil(waitMs / 1000)}s...`);
      await delay(waitMs);
      continue;
    }

    if (resp.status === 403 || resp.status === 429 || resp.status === 502) {
      const retryAfter = resp.headers.get('retry-after');
      const waitMs = retryAfter
        ? parseInt(retryAfter, 10) * 1000
        : Math.min(2000 * Math.pow(2, attempt), 120000);
      console.log(`Rate limit/server error (${resp.status}), retrying in ${Math.ceil(waitMs / 1000)}s...`);
      await delay(waitMs);
      continue;
    }

    if (!resp.ok) throw new Error(`GraphQL HTTP ${resp.status}: ${await resp.text()}`);

    const json = await resp.json() as { data?: unknown; errors?: { type?: string; message: string }[] };
    if (json.errors) {
      const fatal = json.errors.filter((e) => e.type !== 'NOT_FOUND');
      if (fatal.length && !json.data) throw new Error(`GraphQL errors: ${JSON.stringify(fatal)}`);
    }
    return json;
  }
  throw new Error(`GraphQL failed after ${MAX_RETRIES} retries`);
}

async function fetchUkGovMirrorOrgs(): Promise<Set<string>> {
  if (isCacheFresh(MIRROR_CACHE_FILE)) {
    const cached = JSON.parse(fs.readFileSync(MIRROR_CACHE_FILE, 'utf-8')) as string[];
    console.log('  (using cached uk-gov-mirror orgs)');
    return new Set(cached);
  }

  const orgs = new Set<string>();
  let cursor: string | null = null;
  let page = 1;

  do {
    const afterArg = cursor ? `, after: "${cursor}"` : '';
    const query = `{
      repositoryOwner(login: "uk-gov-mirror") {
        repositories(first: 100${afterArg}) {
          pageInfo { hasNextPage endCursor }
          nodes { name }
        }
      }
    }`;

    const result = await graphqlFetch(query) as {
      data?: { repositoryOwner?: { repositories: { pageInfo: { hasNextPage: boolean; endCursor: string }; nodes: { name: string }[] } } };
    };

    const repos = result.data?.repositoryOwner?.repositories;
    if (!repos) break;

    for (const repo of repos.nodes) {
      const orgName = repo.name.split('.')[0];
      if (orgName) orgs.add(orgName.toLowerCase());
    }

    console.log(`  Fetched uk-gov-mirror page ${page} (${repos.nodes.length} repos, ${orgs.size} orgs so far)`);
    cursor = repos.pageInfo.hasNextPage ? repos.pageInfo.endCursor : null;
    page++;
  } while (cursor);

  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(MIRROR_CACHE_FILE, JSON.stringify([...orgs]));

  return orgs;
}

function printList(items: string[]): void {
  if (items.length === 0) {
    console.log('  (none)');
  } else {
    for (const item of items.sort((a, b) => a.localeCompare(b))) {
      console.log(`  ${item}`);
    }
  }
}

async function main() {
  console.log('Fetching scraper repos...');
  const repos = await fetchGithubRepos();
  const scraperOrgs = new Set(repos.map((r) => r.owner.toLowerCase()));
  console.log(`✓ ${scraperOrgs.size} unique orgs in scraper\n`);

  const mappedOrgs = new Set(getAllMappedGithubOrgs().map((o) => o.toLowerCase()));
  console.log(`✓ ${mappedOrgs.size} orgs in mapping\n`);

  console.log('Fetching uk-gov-mirror repos...');
  const mirrorOrgs = await fetchUkGovMirrorOrgs();
  console.log(`✓ ${mirrorOrgs.size} unique orgs in uk-gov-mirror\n`);

  const scraperNotInMapping = [...scraperOrgs].filter((o) => !mappedOrgs.has(o));
  const mappingNotInScraper = [...mappedOrgs].filter((o) => !scraperOrgs.has(o));
  const mirrorNotInScraper = [...mirrorOrgs].filter((o) => !scraperOrgs.has(o));
  const scraperNotInMirror = [...scraperOrgs].filter((o) => !mirrorOrgs.has(o));

  console.log(`\n── Scraper orgs not in mapping (${scraperNotInMapping.length}) ──`);
  printList(scraperNotInMapping);

  console.log(`\n── Mapping orgs not in scraper (${mappingNotInScraper.length}) ──`);
  printList(mappingNotInScraper);

  console.log(`\n── uk-gov-mirror orgs not in scraper (${mirrorNotInScraper.length}) ──`);
  printList(mirrorNotInScraper);

  console.log(`\n── Scraper orgs not in uk-gov-mirror (${scraperNotInMirror.length}) ──`);
  printList(scraperNotInMirror);
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
