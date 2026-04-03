import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page not found – UK Public Sector Code by Organisation',
};

export default function NotFound() {
  return (
    <div className="max-w-lg">
      <h2 className="text-3xl font-bold mb-4">Page not found</h2>
      <p className="text-grey mb-6">
        The page you&apos;re looking for doesn&apos;t exist. It may have been moved or the URL may be incorrect.
      </p>
      <Link
        href="/"
        className="text-orange underline hover:text-dark-orange focus:outline-2 focus:outline-orange"
      >
        Go to homepage
      </Link>
    </div>
  );
}
