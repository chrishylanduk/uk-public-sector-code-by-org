import type { GithubRepo, GovUkOrg, GovUkApiResponse, PlanningDataOrg, PlanningDataApiResponse, WikidataLocalOrg } from './types';
import { promises as fs } from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';

const CACHE_DIR = path.join(process.cwd(), '.cache');
const REPOS_CACHE_FILE = path.join(CACHE_DIR, 'repos.json');
const ORGS_CACHE_FILE = path.join(CACHE_DIR, 'orgs.json');
const PLANNING_DATA_CACHE_FILE = path.join(CACHE_DIR, 'planning-data-local-authorities.json');
const WIKIDATA_ORGS_DIR = path.join(CACHE_DIR, 'wikidata-orgs');
const LGA_FTE_CACHE_FILE = path.join(CACHE_DIR, 'lga-fte.json');
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

// Update this URL when a new quarterly release is published
export const LGA_FTE_URL = 'https://www.local.gov.uk/sites/default/files/documents/QPSES%20Q4%202025.xlsx';
const ONS_GEOGRAPHY_URL = 'https://open-geography-portalx-ons.hub.arcgis.com/api/download/v1/items/984b3f485d1a4c0f9d9e51617cafc224/csv?layers=0';

/**
 * Check if cache file exists and is fresh
 */
async function isCacheFresh(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath);
    const age = Date.now() - stats.mtimeMs;
    return age < CACHE_MAX_AGE_MS;
  } catch {
    return false;
  }
}

/**
 * Read data from cache file
 */
async function readCache<T>(filePath: string): Promise<T | null> {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Write data to cache file
 */
async function writeCache<T>(filePath: string, data: T): Promise<void> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data), 'utf-8');
  } catch (error) {
    console.warn('Failed to write cache:', error);
  }
}

/**
 * Fetch with retry logic for reliability
 */
async function fetchWithRetry(
  url: string,
  maxRetries = 3,
  delay = 1000,
  headers?: Record<string, string>
): Promise<Response> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, { cache: 'no-store', headers });

      if (response.ok) {
        return response;
      }

      if (response.status === 429) {
        // Rate limited
        const retryAfter = response.headers.get('retry-after');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : delay * (i + 1);
        console.warn(`Rate limited, waiting ${waitTime}ms before retry`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.warn(`Fetch attempt ${i + 1} failed, retrying...`);
      await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
    }
  }

  throw new Error(`Failed to fetch after ${maxRetries} attempts`);
}

/**
 * Fetch all GitHub repos from the scraper JSON
 */
export async function fetchGithubRepos(): Promise<GithubRepo[]> {
  // Try cache first (works in all environments)
  if (await isCacheFresh(REPOS_CACHE_FILE)) {
    const cached = await readCache<GithubRepo[]>(REPOS_CACHE_FILE);
    if (cached) {
      console.log(`✓ Using cached GitHub repos (${cached.length} repos)`);
      return cached;
    }
  }

  console.log('Fetching GitHub repos...');
  const response = await fetchWithRetry(
    'https://www.uk-x-gov-software-community.org.uk/xgov-opensource-repo-scraper/repos.json'
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch repos: ${response.status}`);
  }

  const repos: GithubRepo[] = await response.json();
  console.log(`✓ Fetched ${repos.length} GitHub repos`);

  // Always cache to disk
  await writeCache(REPOS_CACHE_FILE, repos);
  console.log('✓ Cached repos to disk');

  return repos;
}

/**
 * Fetch all gov.uk organisations (all pages)
 */
export async function fetchAllGovUkOrgs(): Promise<GovUkOrg[]> {
  // Try cache first (works in all environments)
  if (await isCacheFresh(ORGS_CACHE_FILE)) {
    const cached = await readCache<GovUkOrg[]>(ORGS_CACHE_FILE);
    if (cached) {
      console.log(`✓ Using cached gov.uk organisations (${cached.length} orgs)`);
      return cached;
    }
  }

  console.log('Fetching gov.uk organisations...');
  const allOrgs: GovUkOrg[] = [];
  let currentPage = 1;
  let totalPages = 1;

  while (currentPage <= totalPages) {
    const response = await fetchWithRetry(
      `https://www.gov.uk/api/organisations?page=${currentPage}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch gov.uk orgs page ${currentPage}: ${response.status}`);
    }

    const data: GovUkApiResponse = await response.json();
    allOrgs.push(...data.results);
    totalPages = data.pages;

    console.log(`✓ Fetched page ${currentPage}/${totalPages} (${data.results.length} orgs)`);
    currentPage++;

    // Rate limiting: wait 100ms between requests
    if (currentPage <= totalPages) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  console.log(`✓ Fetched ${allOrgs.length} total gov.uk organisations`);

  // Always cache to disk
  await writeCache(ORGS_CACHE_FILE, allOrgs);
  console.log('✓ Cached organisations to disk');

  return allOrgs;
}

/**
 * Fetch org metadata (name, website) for a single Wikidata entity, cached per ID.
 * Uses SPARQL to fetch rdfs:label (en) and P856 (official website).
 */
export async function fetchWikidataLocalOrg(wikidataId: string): Promise<WikidataLocalOrg> {
  const cacheFile = path.join(WIKIDATA_ORGS_DIR, `${wikidataId}.json`);

  if (await isCacheFresh(cacheFile)) {
    const cached = await readCache<WikidataLocalOrg>(cacheFile);
    if (cached) return cached;
  }

  const query = `
    SELECT ?label ?website ?instanceOfLabel ?parentOrg WHERE {
      BIND(wd:${wikidataId} AS ?item)
      ?item rdfs:label ?label . FILTER(LANG(?label) = "en")
      OPTIONAL { ?item wdt:P856 ?website . }
      OPTIONAL {
        ?item wdt:P31 ?instanceOf .
        ?instanceOf rdfs:label ?instanceOfLabel . FILTER(LANG(?instanceOfLabel) = "en")
      }
      OPTIONAL { ?item wdt:P749 ?parentOrg . }
      OPTIONAL { ?item wdt:P361 ?parentOrg . }
    } LIMIT 1
  `;

  const response = await fetchWithRetry(
    `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`,
    3, 1000,
    {
      'User-Agent': 'publicsectorcodebyorg.co.uk/1.0 (https://github.com/chrishylanduk/uk-public-sector-code-by-org)',
      'Accept': 'application/json',
    }
  );

  const data = await response.json() as {
    results: { bindings: { label: { value: string }; website?: { value: string }; instanceOfLabel?: { value: string }; parentOrg?: { value: string } }[] };
  };

  const binding = data.results.bindings[0];
  if (!binding) throw new Error(`Wikidata entity ${wikidataId} not found or has no English label`);

  const rawFormat = binding.instanceOfLabel?.value;
  const format = rawFormat
    ? rawFormat.charAt(0).toUpperCase() + rawFormat.slice(1)
    : undefined;

  const parentWikidataId = binding.parentOrg?.value
    ? binding.parentOrg.value.replace('http://www.wikidata.org/entity/', '')
    : undefined;

  const result: WikidataLocalOrg = {
    wikidataId,
    name: binding.label.value,
    webUrl: binding.website?.value ?? '',
    format,
    parentWikidataId,
  };

  await fs.mkdir(WIKIDATA_ORGS_DIR, { recursive: true });
  await writeCache(cacheFile, result);
  console.log(`✓ Fetched Wikidata org ${wikidataId}: ${result.name}`);

  return result;
}

/**
 * Fetch all local authority entries from planning.data.gov.uk
 */
export async function fetchPlanningDataOrgs(): Promise<PlanningDataOrg[]> {
  if (await isCacheFresh(PLANNING_DATA_CACHE_FILE)) {
    const cached = await readCache<PlanningDataOrg[]>(PLANNING_DATA_CACHE_FILE);
    if (cached) {
      console.log(`✓ Using cached planning data local authorities (${cached.length} orgs)`);
      return cached;
    }
  }

  console.log('Fetching planning data local authorities...');
  const allOrgs: PlanningDataOrg[] = [];
  const pageSize = 100;
  let offset = 0;
  let total = Infinity;

  while (offset < total) {
    const url = `https://www.planning.data.gov.uk/entity.json?dataset=local-authority&limit=${pageSize}&offset=${offset}`;
    const response = await fetchWithRetry(url);
    const data: PlanningDataApiResponse = await response.json();
    total = data.count;
    allOrgs.push(...data.entities);
    console.log(`✓ Fetched planning data page (offset ${offset}, ${allOrgs.length}/${total})`);
    offset += pageSize;
  }

  console.log(`✓ Fetched ${allOrgs.length} local authorities from planning.data.gov.uk`);

  await writeCache(PLANNING_DATA_CACHE_FILE, allOrgs);
  console.log('✓ Cached planning data local authorities to disk');

  return allOrgs;
}

/**
 * Fetch LGA FTE data from the QPSES spreadsheet, returning a map of ONS code → total FTE.
 * Matches via LGA Name → ONS code using the ONS geography CSV.
 *
 * Update LGA_FTE_URL when a new quarterly release is published.
 */
export async function fetchLgaFteData(): Promise<Map<string, number>> {
  if (await isCacheFresh(LGA_FTE_CACHE_FILE)) {
    const cached = await readCache<[string, number][]>(LGA_FTE_CACHE_FILE);
    if (cached) {
      console.log(`✓ Using cached LGA FTE data (${cached.length} entries)`);
      return new Map(cached);
    }
  }

  console.log('Fetching ONS geography (LGA name → ONS code)...');
  const onsResponse = await fetchWithRetry(ONS_GEOGRAPHY_URL);
  const onsCsv = await onsResponse.text();

  // Parse CSV: LAD24CD (ONS code), LAD24NM (LGA name)
  // Must handle quoted fields (e.g. "Bristol, City of") — can't naive-split on comma
  const lgaNameToOnsCode = new Map<string, string>();
  // Fallback: maps the part before the first comma (e.g. "Bristol" from "Bristol, City of")
  const lgaShortNameToOnsCode = new Map<string, string>();
  for (const line of onsCsv.split('\n').slice(1)) {
    if (!line.trim()) continue;
    // Match: onsCode,optionally-quoted-name
    const m = line.match(/^([^,]+),("([^"]*)"|(.*?))(?:,|$)/);
    if (!m) continue;
    const onsCode = m[1].trim().replace(/^\uFEFF/, '');
    const lgaName = (m[3] ?? m[4] ?? '').trim();
    if (!onsCode || !lgaName) continue;
    lgaNameToOnsCode.set(lgaName, onsCode);
    const shortName = lgaName.split(',')[0].trim();
    if (shortName !== lgaName) lgaShortNameToOnsCode.set(shortName, onsCode);
  }
  console.log(`✓ Parsed ${lgaNameToOnsCode.size} LGA name → ONS code mappings`);

  console.log(`Fetching LGA FTE data from ${LGA_FTE_URL}...`);
  const xlsxResponse = await fetchWithRetry(LGA_FTE_URL);
  const xlsxBuffer = await xlsxResponse.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(xlsxBuffer);

  const ws = wb.getWorksheet('Final Individual');
  if (!ws) throw new Error('Sheet "Final Individual" not found in QPSES spreadsheet');

  const allRows = ws.getSheetValues() as (ExcelJS.CellValue[])[];
  // getSheetValues() is 1-indexed and may have a leading undefined at index 0
  const rows = allRows.filter(Boolean);

  // Row 0 is headers: find "LGA Name" and "Total FTE" column indices
  const headers = rows[0].map((h) => (h == null ? '' : String(h)));
  const lgaNameCol = headers.indexOf('LGA Name');
  const fteCol = headers.indexOf('Total FTE');
  if (lgaNameCol === -1 || fteCol === -1) {
    throw new Error(`Expected columns "LGA Name" and "Total FTE" in QPSES spreadsheet, got: ${headers.join(', ')}`);
  }

  const onsFteMap = new Map<string, number>();
  let matched = 0;
  let unmatched = 0;

  for (const row of rows.slice(1)) {
    const lgaName = String(row[lgaNameCol] ?? '').trim();
    const fte = row[fteCol];
    if (!lgaName || typeof fte !== 'number') continue;

    const onsCode = lgaNameToOnsCode.get(lgaName) ?? lgaShortNameToOnsCode.get(lgaName);
    if (onsCode) {
      onsFteMap.set(onsCode, fte);
      matched++;
    } else {
      console.warn(`⚠️  LGA FTE: no ONS code match for "${lgaName}"`);
      unmatched++;
    }
  }

  console.log(`✓ Matched ${matched} LGA FTE entries, ${unmatched} unmatched`);

  await writeCache(LGA_FTE_CACHE_FILE, Array.from(onsFteMap.entries()));
  console.log('✓ Cached LGA FTE data to disk');

  return onsFteMap;
}
