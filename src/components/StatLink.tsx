'use client';

import { useSyncExternalStore } from 'react';

interface Props {
  href: string;
  children: React.ReactNode;
}

const subscribe = () => () => {};

export default function StatLink({ href, children }: Props) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  if (!mounted) return <span>{children}</span>;
  return (
    <a href={href} className="underline hover:text-orange focus:outline-2 focus:outline-orange">
      {children}
    </a>
  );
}
