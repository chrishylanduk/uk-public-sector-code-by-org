'use client';

export default function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-orange focus:text-white focus:outline-2 focus:outline-offset-2 focus:outline-black"
    >
      Skip to main content
    </a>
  );
}
