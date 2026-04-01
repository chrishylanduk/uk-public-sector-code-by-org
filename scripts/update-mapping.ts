#!/usr/bin/env tsx

/**
 * Developer tool: populates missing fields in org-mapping.json and regenerates the CSV.
 * Run locally after adding new entries, then commit the results.
 *
 * Usage: npm run update-mapping
 */

import { populateSiteSlugs } from './populate-site-slugs';
import { generateCsv } from './generate-csv';

async function main() {
  console.log('🔧 Updating mapping...\n');

  try {
    await populateSiteSlugs();
    generateCsv();

    console.log('\n✅ Mapping updated. Review the diff and commit.\n');
  } catch (error) {
    console.error('❌ Update failed:', error);
    process.exit(1);
  }
}

main();
