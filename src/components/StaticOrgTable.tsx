import Link from 'next/link';
import type { OrgEntry } from '@/lib/types';
import { TYPE_ORDER } from '@/lib/type-order';

interface Props {
  entries: OrgEntry[];
}

export default function StaticOrgTable({ entries }: Props) {
  const sorted = [...entries].sort((a, b) => {
    const aOrder = TYPE_ORDER[a.format] ?? 13;
    const bOrder = TYPE_ORDER[b.format] ?? 13;
    if (aOrder !== bOrder) return bOrder - aOrder;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse" aria-label="UK public sector organisations and their GitHub code">
        <thead>
          <tr className="bg-light-grey [&>th]:shadow-[0_2px_0_0_#9a3412]">
            <th scope="col" className="px-4 py-3 text-left font-bold">Organisation</th>
            <th scope="col" className="px-4 py-3 text-left font-bold hidden md:table-cell">Type</th>
            <th scope="col" className="px-4 py-3 text-right font-bold">Stars of active repos</th>
            <th scope="col" className="px-4 py-3 text-right font-bold">Active repos</th>
            <th scope="col" className="px-4 py-3 text-right font-bold hidden lg:table-cell">Total repos</th>
            <th scope="col" className="px-4 py-3 text-right font-bold">Total FTE</th>
            <th scope="col" className="px-4 py-3 text-right font-bold">Digital &amp; data FTE</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((entry) => (
            <tr key={entry.slug} className="border-b border-mid-grey hover:bg-light-grey transition-colors">
              <td className="px-4 py-3">
                <Link href={`/org/${entry.slug}`} className="text-orange underline hover:text-dark-orange focus:outline-2 focus:outline-orange">
                  {entry.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-sm text-grey hidden md:table-cell">{entry.format}</td>
              <td className="px-4 py-3 text-right font-semibold">{entry.totalStars.toLocaleString('en-GB')}</td>
              <td className="px-4 py-3 text-right">{entry.repoCount.toLocaleString('en-GB')}</td>
              <td className="px-4 py-3 text-right hidden lg:table-cell">{entry.totalRepoCount.toLocaleString('en-GB')}</td>
              <td className="px-4 py-3 text-right">{entry.fte != null ? entry.fte.toLocaleString('en-GB') : <span className="text-grey">—</span>}</td>
              <td className="px-4 py-3 text-right">{entry.digitalDataFte != null ? entry.digitalDataFte.toLocaleString('en-GB') : <span className="text-grey">—</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
