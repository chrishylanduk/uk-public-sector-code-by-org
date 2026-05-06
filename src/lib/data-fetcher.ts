import type { GithubRepo, GovUkOrg, GovUkApiResponse, PlanningDataOrg, PlanningDataApiResponse, WikidataLocalOrg } from './types';
import { promises as fs } from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import { unzipSync } from 'fflate';

const CACHE_DIR = path.join(process.cwd(), '.cache');
const REPOS_CACHE_FILE = path.join(CACHE_DIR, 'repos.json');
const ORGS_CACHE_FILE = path.join(CACHE_DIR, 'orgs.json');
const PLANNING_DATA_CACHE_FILE = path.join(CACHE_DIR, 'planning-data-local-authorities.json');
const WIKIDATA_ORGS_DIR = path.join(CACHE_DIR, 'wikidata-orgs');
const LGA_FTE_CACHE_FILE = path.join(CACHE_DIR, 'lga-fte.json');
const CS_STATS_FTE_CACHE_FILE = path.join(CACHE_DIR, 'cs-stats-fte.json');
const CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

// Update this URL when a new quarterly release is published
export const LGA_FTE_URL = 'https://www.local.gov.uk/sites/default/files/documents/QPSES%20Q4%202025.xlsx';
// Update this URL when a new annual release is published
export const CS_STATS_URL = 'https://assets.publishing.service.gov.uk/media/696f6cdc7e827090d02d4219/Statistical_tables_-_Civil_Service_Statistics_2025.ods';
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
      return cached;
    }
  }

  console.log('Fetching GitHub repos...');
  const response = await fetchWithRetry(
    'https://chrishylanduk.github.io/xgov-opensource-repo-scraper/repos.json'
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
/**
 * Fetch metadata for multiple Wikidata entities in a single SPARQL query.
 * Checks per-ID cache first; only fetches IDs that are missing or stale.
 * Fetches in batches of 100 to avoid query size limits.
 */
export async function fetchWikidataLocalOrgs(wikidataIds: string[]): Promise<Map<string, WikidataLocalOrg>> {
  await fs.mkdir(WIKIDATA_ORGS_DIR, { recursive: true });

  const result = new Map<string, WikidataLocalOrg>();
  const toFetch: string[] = [];

  for (const id of wikidataIds) {
    const cacheFile = path.join(WIKIDATA_ORGS_DIR, `${id}.json`);
    if (await isCacheFresh(cacheFile)) {
      const cached = await readCache<WikidataLocalOrg>(cacheFile);
      if (cached) { result.set(id, cached); continue; }
    }
    toFetch.push(id);
  }

  if (toFetch.length === 0) return result;

  console.log(`Fetching ${toFetch.length} Wikidata orgs in batch...`);

  type Binding = {
    item: { value: string };
    label: { value: string };
    website?: { value: string };
    instanceOfLabel?: { value: string };
    parentOrg?: { value: string };
  };

  const BATCH_SIZE = 100;
  for (let i = 0; i < toFetch.length; i += BATCH_SIZE) {
    const batch = toFetch.slice(i, i + BATCH_SIZE);
    const values = batch.map((id) => `wd:${id}`).join(' ');

    const query = `
      SELECT ?item ?label ?website ?instanceOfLabel ?parentOrg WHERE {
        VALUES ?item { ${values} }
        ?item rdfs:label ?label . FILTER(LANG(?label) = "en")
        OPTIONAL { ?item wdt:P856 ?website . }
        OPTIONAL {
          ?item wdt:P31 ?instanceOf .
          ?instanceOf rdfs:label ?instanceOfLabel . FILTER(LANG(?instanceOfLabel) = "en")
        }
        OPTIONAL { ?item wdt:P749 ?parentOrg . }
        OPTIONAL { ?item wdt:P361 ?parentOrg . }
      }
    `;

    const response = await fetchWithRetry(
      `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`,
      3, 2000,
      {
        'User-Agent': 'publicsectorcodebyorg.co.uk/1.0 (https://github.com/chrishylanduk/uk-public-sector-code-by-org)',
        'Accept': 'application/json',
      }
    );

    const data = await response.json() as { results: { bindings: Binding[] } };

    // Group by item — take first row per ID (multiple rows arise from multiple instanceOf values)
    const byId = new Map<string, WikidataLocalOrg>();
    for (const binding of data.results.bindings) {
      const id = binding.item.value.replace('http://www.wikidata.org/entity/', '');
      if (byId.has(id)) continue;
      const rawFormat = binding.instanceOfLabel?.value;
      byId.set(id, {
        wikidataId: id,
        name: binding.label.value,
        webUrl: binding.website?.value ?? '',
        format: rawFormat ? rawFormat.charAt(0).toUpperCase() + rawFormat.slice(1) : undefined,
        parentWikidataId: binding.parentOrg?.value?.replace('http://www.wikidata.org/entity/', ''),
      });
    }

    for (const id of batch) {
      const org = byId.get(id);
      if (!org) { console.warn(`⚠ Wikidata entity ${id} not found or has no English label`); continue; }
      await writeCache(path.join(WIKIDATA_ORGS_DIR, `${id}.json`), org);
      result.set(id, org);
    }

    console.log(`✓ Fetched batch of ${batch.length} Wikidata orgs`);
  }

  return result;
}

/**
 * Fetch all local authority entries from planning.data.gov.uk
 */
export async function fetchPlanningDataOrgs(): Promise<PlanningDataOrg[]> {
  if (await isCacheFresh(PLANNING_DATA_CACHE_FILE)) {
    const cached = await readCache<PlanningDataOrg[]>(PLANNING_DATA_CACHE_FILE);
    if (cached) {
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

function normaliseOrgName(s: string): string {
  return s.replace(/&/g, 'and').replace(/\s+/g, ' ').trim().toLowerCase();
}

export interface CsStatsFteEntry {
  fte: number;
  digitalDataFte?: number;
}

/**
 * Fetch Civil Service FTE data from Table 8A of the Civil Service Statistics ODS file.
 * Returns a map of normalised organisation name → { fte, digitalDataFte }.
 *
 * Update CS_STATS_URL when a new annual release is published.
 */
export async function fetchCsStatsFteData(): Promise<Map<string, CsStatsFteEntry>> {
  if (await isCacheFresh(CS_STATS_FTE_CACHE_FILE)) {
    const cached = await readCache<[string, CsStatsFteEntry][]>(CS_STATS_FTE_CACHE_FILE);
    if (cached) {
      return new Map(cached);
    }
  }

  console.log(`Fetching Civil Service Statistics from ${CS_STATS_URL}...`);
  const response = await fetchWithRetry(CS_STATS_URL);
  const buffer = new Uint8Array(await response.arrayBuffer());

  // ODS is a ZIP archive — extract content/content.xml
  const unzipped = unzipSync(buffer);
  const contentXmlBytes = unzipped['content.xml'];
  if (!contentXmlBytes) throw new Error('content.xml not found in ODS archive');
  const contentXml = new TextDecoder().decode(contentXmlBytes);

  // Parse XML to find table_8A
  // Use regex to extract the table rather than a full XML parser
  const tableMatch = contentXml.match(/<table:table[^>]+table:name="table_8A"[\s\S]*?<\/table:table>/);
  if (!tableMatch) throw new Error('table_8A not found in Civil Service Statistics ODS');
  const tableXml = tableMatch[0];

  // Extract all rows
  const rowMatches = [...tableXml.matchAll(/<table:table-row[\s\S]*?<\/table:table-row>/g)];

  // Extract text content from a cell
  const cellText = (cellXml: string): string => {
    const texts = [...cellXml.matchAll(/<text:p[^>]*>([\s\S]*?)<\/text:p>/g)];
    return texts.map(m => m[1].replace(/<[^>]+>/g, '')).join(' ').trim();
  };

  // Extract all cells from a row
  const rowCells = (rowXml: string): string[] => {
    const cells: string[] = [];
    const cellRe = /<table:table-cell[\s\S]*?<\/table:table-cell>/g;
    for (const m of rowXml.matchAll(cellRe)) {
      // Handle repeated empty cells
      const repeatMatch = m[0].match(/table:number-columns-repeated="(\d+)"/);
      const repeat = repeatMatch ? parseInt(repeatMatch[1]) : 1;
      const text = cellText(m[0]);
      for (let i = 0; i < repeat; i++) cells.push(text);
    }
    return cells;
  };

  // Find header row to locate column indices
  let orgNameCol = -1;
  let fteTotalCol = -1;
  let digitalDataFteCol = -1;
  const dataRows: string[] = [];
  let headerFound = false;

  for (const rowMatch of rowMatches) {
    const cells = rowCells(rowMatch[0]);
    if (!headerFound) {
      const orgIdx = cells.findIndex(c => c === 'Civil Service organisation');
      const fteIdx = cells.findIndex(c => c.includes('Total full-time equivalent'));
      const ddIdx = cells.findIndex(c => c.includes('Digital and Data'));
      if (orgIdx !== -1 && fteIdx !== -1) {
        orgNameCol = orgIdx;
        fteTotalCol = fteIdx;
        digitalDataFteCol = ddIdx;
        headerFound = true;
      }
      continue;
    }
    dataRows.push(rowMatch[0]);
  }

  if (!headerFound) throw new Error('Could not find header row in table_8A');

  const fteMap = new Map<string, CsStatsFteEntry>();
  let matched = 0;

  for (const rowXml of dataRows) {
    const cells = rowCells(rowXml);
    let orgName = cells[orgNameCol]?.trim() ?? '';
    if (!orgName) continue;

    // Discard "X Overall" rows — represent combined parent+agencies totals
    if (orgName.endsWith(' Overall')) continue;

    // Strip "(excl. agencies)" suffix — this is the core dept row, match to parent dept name
    if (orgName.endsWith(' (excl. agencies)')) {
      orgName = orgName.slice(0, -' (excl. agencies)'.length).trim();
    }

    const fteRaw = cells[fteTotalCol]?.replace(/,/g, '').trim();
    const fte = fteRaw ? parseFloat(fteRaw) : NaN;
    if (!orgName || isNaN(fte)) continue;

    const ddRaw = digitalDataFteCol !== -1 ? cells[digitalDataFteCol]?.replace(/,/g, '').trim() : '';
    const digitalDataFte = ddRaw ? parseFloat(ddRaw) : NaN;

    fteMap.set(normaliseOrgName(orgName), {
      fte,
      digitalDataFte: isNaN(digitalDataFte) ? undefined : digitalDataFte,
    });
    matched++;
  }

  console.log(`✓ Parsed ${matched} Civil Service FTE entries`);

  await writeCache(CS_STATS_FTE_CACHE_FILE, Array.from(fteMap.entries()));
  console.log('✓ Cached Civil Service FTE data to disk');

  return fteMap;
}
