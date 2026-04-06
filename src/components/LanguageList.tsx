'use client';

import { useState } from 'react';

interface Props {
  languages: { name: string; pct: number }[];
}

export default function LanguageList({ languages }: Props) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? languages : languages.slice(0, 3);

  if (languages.length === 0) return <p className="text-sm text-grey mt-1">None recorded</p>;

  return (
    <div>
      <ol className="mt-1 space-y-0.5">
        {visible.map(({ name, pct }, i) => (
          <li key={name} className="text-sm">
            <span className="text-grey mr-1">{i + 1}.</span>
            <span className="font-semibold">{name}</span>
            <span className="text-grey"> ({pct}%)</span>
          </li>
        ))}
      </ol>
      {languages.length > 3 && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="mt-1 text-xs text-grey underline hover:text-orange focus:outline-2 focus:outline-orange"
        >
          {showAll ? 'Show less' : `Show all ${languages.length}`}
        </button>
      )}
    </div>
  );
}
