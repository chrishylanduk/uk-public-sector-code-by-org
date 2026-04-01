import type { Metadata } from 'next';
import './globals.css';
import SkipLink from '@/components/SkipLink';
import Link from 'next/link';

export const SITE_NAME = 'UK Public Sector Code by Organisation';
export const SITE_URL = 'https://publicsectorcodebyorg.co.uk';
export const SITE_DESCRIPTION = 'Explore the open source code published by UK public sector organisations.';

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
        <header className="bg-gov-dark-blue text-white py-3 border-b-4 border-gov-blue">
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-2xl font-bold tracking-tight">
              <Link
                href="/"
                className="hover:underline focus:outline-2 focus:outline-white"
              >
                UK Public Sector Code by Organisation
              </Link>
            </h1>
            <p className="text-xs text-white/60 mt-0.5">An independent project</p>
          </div>
        </header>
        <main id="main-content" className="w-full max-w-7xl mx-auto px-4 py-8 flex-1">
          {children}
        </main>
        <footer className="bg-gov-light-grey border-t border-gov-border mt-16 py-8">
          <div className="max-w-7xl mx-auto px-4 text-sm text-gov-grey space-y-3">
            <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-1">
              <Link href="/data" className="underline hover:text-gov-blue focus:outline-2 focus:outline-gov-blue">
                Get the mapping data
              </Link>
              <a href="https://github.com/chrishylanduk/uk-public-sector-code-by-org" target="_blank" rel="noopener noreferrer" className="underline hover:text-gov-blue focus:outline-2 focus:outline-gov-blue">
                Source code
              </a>
              <a href="https://github.com/chrishylanduk/uk-public-sector-code-by-org/issues" target="_blank" rel="noopener noreferrer" className="underline hover:text-gov-blue focus:outline-2 focus:outline-gov-blue">
                Report an issue
              </a>
            </nav>
            <p>
              Maintained by{' '}
              <a href="https://www.chrishyland.com/" target="_blank" rel="noopener noreferrer" className="underline hover:text-gov-blue focus:outline-2 focus:outline-gov-blue">
                Chris Hyland
              </a>
              {' '}in a personal capacity, with community contributions. Not affiliated with any of the organisations listed.
            </p>
            <p>
              Repository data from the{' '}
              <a href="https://github.com/uk-x-gov-software-community/xgov-opensource-repo-scraper" target="_blank" rel="noopener noreferrer" className="underline hover:text-gov-blue focus:outline-2 focus:outline-gov-blue">
                UK X-Gov Open Source Repo Scraper
              </a>
              . Organisation data from the{' '}
              <a href="https://www.gov.uk/api/organisations" target="_blank" rel="noopener noreferrer" className="underline hover:text-gov-blue focus:outline-2 focus:outline-gov-blue">
                GOV.UK Organisations API
              </a>
              ,{' '}
              <a href="https://www.planning.data.gov.uk/dataset/local-authority" target="_blank" rel="noopener noreferrer" className="underline hover:text-gov-blue focus:outline-2 focus:outline-gov-blue">
                planning.data.gov.uk
              </a>
              , and{' '}
              <a href="https://www.wikidata.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-gov-blue focus:outline-2 focus:outline-gov-blue">
                Wikidata
              </a>
              . Workforce data from the{' '}
              <a href="https://www.local.gov.uk/publications/ons-quarterly-public-sector-employment-survey" target="_blank" rel="noopener noreferrer" className="underline hover:text-gov-blue focus:outline-2 focus:outline-gov-blue">
                LGA Quarterly Workforce Survey
              </a>
              {' '}and{' '}
              <a href="https://www.gov.uk/government/collections/civil-service-statistics" target="_blank" rel="noopener noreferrer" className="underline hover:text-gov-blue focus:outline-2 focus:outline-gov-blue">
                Civil Service Statistics
              </a>
              .
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
