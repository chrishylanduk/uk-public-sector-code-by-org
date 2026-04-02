import { PHASE_PRODUCTION_BUILD } from 'next/constants.js';

/** @param {string} phase @returns {import('next').NextConfig} */
export default function config(phase) {
  return {
    output: phase === PHASE_PRODUCTION_BUILD ? 'export' : undefined,
    images: {
      unoptimized: true,
    },
    trailingSlash: true,
    typescript: {
      ignoreBuildErrors: false,
    },
  };
}
