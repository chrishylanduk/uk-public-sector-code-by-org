import type { Metadata } from 'next';
import './globals.css';
import SkipLink from '@/components/SkipLink';
import Link from 'next/link';
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION } from '@/lib/constants';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  keywords: ['UK public sector', 'open source', 'GitHub', 'transparency', 'code'],
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL(SITE_URL),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-white text-gray-900">
        <SkipLink />
        <header className="bg-dark-orange text-white py-3">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-2xl font-bold tracking-tight">
              <Link
                href="/"
                className="hover:underline focus:outline-2 focus:outline-white"
              >
                UK Public Sector Code by Organisation
              </Link>
            </h1>
          </div>
        </header>
        <main id="main-content" className="w-full max-w-7xl mx-auto px-4 py-8 flex-1">
          <NuqsAdapter>{children}</NuqsAdapter>
        </main>
        <footer className="bg-light-grey border-t border-mid-grey mt-16 py-8">
          <div className="max-w-7xl mx-auto px-4 text-sm text-grey space-y-3">
            <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-1">
              <Link href="/data" className="underline hover:text-orange focus:outline-2 focus:outline-orange">
                Get the mapping data
              </Link>
              <a href="https://github.com/chrishylanduk/uk-public-sector-code-by-org" target="_blank" rel="noopener noreferrer" className="underline hover:text-orange focus:outline-2 focus:outline-orange">
                Source code
              </a>
              <a href="https://github.com/chrishylanduk/uk-public-sector-code-by-org/issues" target="_blank" rel="noopener noreferrer" className="underline hover:text-orange focus:outline-2 focus:outline-orange">
                Report an issue
              </a>
            </nav>
            <p>
              Maintained by{' '}
              <a href="https://www.chrishyland.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-orange focus:outline-2 focus:outline-orange">
                Chris Hyland
              </a>
              {' '}in a personal capacity, with community contributions. Not affiliated with any organisation.
            </p>
            <p>
              Repository data from the{' '}
              <a href="https://github.com/uk-x-gov-software-community/xgov-opensource-repo-scraper" target="_blank" rel="noopener noreferrer" className="underline hover:text-orange focus:outline-2 focus:outline-orange">
                UK X-Gov Open Source Repo Scraper
              </a>
              . Organisation data from the{' '}
              <a href="https://www.gov.uk/api/organisations" target="_blank" rel="noopener noreferrer" className="underline hover:text-orange focus:outline-2 focus:outline-orange">
                GOV.UK Organisations API
              </a>
              ,{' '}
              <a href="https://www.planning.data.gov.uk/dataset/local-authority" target="_blank" rel="noopener noreferrer" className="underline hover:text-orange focus:outline-2 focus:outline-orange">
                planning.data.gov.uk
              </a>
              , and{' '}
              <a href="https://www.wikidata.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-orange focus:outline-2 focus:outline-orange">
                Wikidata
              </a>
              . Workforce data from the{' '}
              <a href="https://www.local.gov.uk/publications/ons-quarterly-public-sector-employment-survey" target="_blank" rel="noopener noreferrer" className="underline hover:text-orange focus:outline-2 focus:outline-orange">
                LGA Quarterly Workforce Survey
              </a>
              {' '}and{' '}
              <a href="https://www.gov.uk/government/collections/civil-service-statistics" target="_blank" rel="noopener noreferrer" className="underline hover:text-orange focus:outline-2 focus:outline-orange">
                Civil Service Statistics
              </a>
              . Contains public sector information licensed under the{' '}
              <a href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/" target="_blank" rel="noopener noreferrer" className="underline hover:text-orange focus:outline-2 focus:outline-orange">
                Open Government Licence v3.0
              </a>
              .
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
