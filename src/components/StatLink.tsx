'use client';

import { useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  filterValue: string;
  scrollTarget: string;
  children: React.ReactNode;
}

const subscribe = () => () => {};

export default function StatLink({ filterValue, scrollTarget, children }: Props) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const router = useRouter();

  if (!mounted) return <span>{children}</span>;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(window.location.search);
    params.set('filter', filterValue);
    params.delete('page');
    router.replace(`?${params.toString()}`, { scroll: false });
    document.getElementById(scrollTarget)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <a
      href={`?filter=${filterValue}#${scrollTarget}`}
      onClick={handleClick}
      className="underline hover:text-orange focus:outline-2 focus:outline-orange"
    >
      {children}
    </a>
  );
}
