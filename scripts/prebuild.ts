#!/usr/bin/env tsx

/**
 * Pre-build script to fetch and cache data before Next.js build starts
 * This ensures data is fetched only once, not by every worker
 */

import fs from 'fs';
import path from 'path';
import Ajv from 'ajv/dist/2020';
import { fetchGithubRepos, fetchAllGovUkOrgs, fetchPlanningDataOrgs, fetchWikidataLocalOrgs, fetchLgaFteData, fetchCsStatsFteData } from '../src/lib/data-fetcher';
import { getRawOrganisations } from '../src/lib/mapping';
import { validateDataQuality } from '../src/lib/data-processor';

function validateOrgMapping() {
  const dataFile = path.join(process.cwd(), 'public/data/org-mapping.json');
  const schemaFile = path.join(process.cwd(), 'public/data/org-mapping.schema.json');

  const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  const schema = JSON.parse(fs.readFileSync(schemaFile, 'utf8'));

  const ajv = new Ajv({ allErrors: true });
  const valid = ajv.validate(schema, data);

  if (!valid) {
    const errors = ajv.errors!.map((e) => `  - ${e.instancePath || '(root)'} ${e.message}`).join('\n');
    throw new Error(`org-mapping.json does not match schema:\n${errors}`);
  }

  console.log('✓ org-mapping.json validated against schema');
}

async function main() {
  console.log('🚀 Pre-build: Fetching and caching data...\n');

  try {
    // Cache all external data in parallel before Next.js build starts
    const wikidataIds = [...new Set(
      getRawOrganisations()
        .map((e) => ('wikidata_id' in e ? e.wikidata_id : null))
        .filter((id): id is string => typeof id === 'string')
    )];

    const [repos, govUkOrgs, planningDataOrgs] = await Promise.all([
      fetchGithubRepos(),
      fetchAllGovUkOrgs(),
      fetchPlanningDataOrgs(),
      fetchLgaFteData(),
      fetchCsStatsFteData(),
    ]);

    await fetchWikidataLocalOrgs(wikidataIds);

    validateOrgMapping();
    validateDataQuality(repos, govUkOrgs, planningDataOrgs);

    console.log('\n✅ Pre-build complete: Data cached to .cache/\n');
  } catch (error) {
    console.error('❌ Pre-build failed:', error);
    process.exit(1);
  }
}

main();
