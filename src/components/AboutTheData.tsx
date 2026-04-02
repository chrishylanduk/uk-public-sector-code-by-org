'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AboutTheData() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gov-border rounded">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 text-left bg-gov-light-grey hover:bg-gray-200 focus:outline-2 focus:outline-gov-blue transition-colors flex items-center justify-between"
        aria-expanded={isOpen}
        aria-controls="about-data-content"
      >
        <span className="font-bold text-lg">About the data</span>
        <span className="text-2xl text-gov-grey" aria-hidden="true">
          {isOpen ? '−' : '+'}
        </span>
      </button>

      {isOpen && (
        <div
          id="about-data-content"
          className="px-6 py-4 bg-white border-t border-gov-border"
        >
          <h3 className="font-bold text-lg mb-3">What this site shows</h3>

          <p className="mb-4">
            Each row represents a UK government organisation and its publicly visible GitHub activity.
            Stars are shown as a rough signal of how widely used a codebase is &mdash; they are not
            a ranking and should not be interpreted as one.
          </p>

          <h4 className="font-bold mb-2">What counts as an active repository?</h4>
          <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
            <li>
              <strong>Not archived:</strong> The repository is not marked as archived on GitHub
            </li>
            <li>
              <strong>Recently updated:</strong> The repository has been pushed to within the last
              180 days
            </li>
          </ul>

          <h4 className="font-bold mb-2">The organisation mapping</h4>
          <p className="mb-4">
            GitHub accounts are manually mapped to their corresponding GOV.UK organisations.
            Some GOV.UK organisations have multiple GitHub accounts (for example, GDS and i.AI
            are both part of DSIT). The mapping is available as{' '}
            <Link
              href="/data"
              className="text-gov-blue underline hover:text-gov-dark-blue"
            >
              open data
            </Link>
            .
          </p>

          <h4 className="font-bold mb-2">Data sources</h4>
          <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
            <li>
              <strong>GitHub repository data:</strong>{' '}
              <a
                href="https://github.com/uk-x-gov-software-community/xgov-opensource-repo-scraper"
                className="text-gov-blue underline hover:text-gov-dark-blue"
                target="_blank"
                rel="noopener noreferrer"
              >
                UK X-Gov Open Source Repo Scraper
              </a>
            </li>
            <li>
              <strong>GOV.UK organisation information:</strong>{' '}
              <a
                href="https://www.gov.uk/api/organisations"
                className="text-gov-blue underline hover:text-gov-dark-blue"
                target="_blank"
                rel="noopener noreferrer"
              >
                GOV.UK Organisations API
              </a>
            </li>
          </ul>

          <h4 className="font-bold mb-2">Limitations</h4>
          <ul className="list-disc list-inside mb-0 space-y-2 ml-4">
            <li>
              <strong>Stars are a poor metric:</strong> GitHub stars only count how many times the
              star button has been clicked. They do not reflect code quality, usage, or value.
            </li>
            <li>
              <strong>Lifetime stars:</strong> Stars accumulated years ago still count, even if
              the code is no longer relevant.
            </li>
            <li>
              <strong>Only organisation-owned repos:</strong> Contributions to external open source
              projects are not counted.
            </li>
            <li>
              <strong>The 180-day rule is arbitrary:</strong> Stable, mature code may not need
              frequent updates. This threshold may exclude genuinely active projects.
            </li>
            <li>
              <strong>GitHub only:</strong> Organisations using GitLab, Bitbucket, or self-hosted
              solutions are not represented.
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
