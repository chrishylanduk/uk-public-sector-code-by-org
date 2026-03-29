'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import type { OrgEntry, FilterState } from '@/lib/types';
import SearchAndFilter from './SearchAndFilter';

interface Props {
  entries: OrgEntry[];
  availableFormats: string[];
}

export default function OrgDirectory({ entries, availableFormats }: Props) {
  const [groupByParent, setGroupByParent] = useState(true);
  const [groupByParentUserSet, setGroupByParentUserSet] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    excludedFormats: [],
    sortField: 'type',
    sortDirection: 'desc',
  });

  const TYPE_ORDER: Record<string, number> = {
    // Central government — higher = more senior
    'Ministerial department': 25,
    'Non-ministerial department': 24,
    'Executive office': 23,
    'Executive agency': 22,
    'Executive non-departmental public body': 21,
    'Advisory non-departmental public body': 20,
    'Tribunal': 19,
    'Public corporation': 18,
    'Independent monitoring body': 17,
    'Special health authority': 16,
    'Civil service': 15,
    'Sub organisation': 14,
    // Other central (Ad-hoc advisory group, Court, Devolved government, Other)
    // → fallback value of 13
    // Local government — higher = larger area covered
    'Strategic regional authority': 12,
    'Combined authority': 11,
    'County council': 10,
    'Metropolitan district': 9,
    'London borough': 8,
    'Unitary authority': 7,
    'Non-metropolitan district': 6,
    'National park authority': 5,
    'Scottish council': 4,
    'Welsh council': 3,
    'Northern Ireland district': 2,
    'Local authority': 1,
    'Special district': 0,
  };

  const getAriaSortValue = (field: typeof filters.sortField): 'ascending' | 'descending' | 'none' => {
    if (filters.sortField !== field) return 'none';
    return filters.sortDirection === 'asc' ? 'ascending' : 'descending';
  };

  const getSortIcon = (field: typeof filters.sortField) => {
    if (filters.sortField !== field) {
      return <span className="ml-1 text-gov-grey opacity-50" aria-hidden="true">↕</span>;
    }
    return filters.sortDirection === 'asc' ? (
      <span className="ml-1" aria-hidden="true">↑</span>
    ) : (
      <span className="ml-1" aria-hidden="true">↓</span>
    );
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...entries];

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter((entry) => entry.name.toLowerCase().includes(query));
    }

    if (filters.excludedFormats.length > 0) {
      result = result.filter((entry) => !filters.excludedFormats.includes(entry.format));
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (filters.sortField) {
        case 'type': {
          const aOrder = TYPE_ORDER[a.format] ?? 13;
          const bOrder = TYPE_ORDER[b.format] ?? 13;
          if (aOrder !== bOrder) {
            comparison = aOrder - bOrder;
          } else {
            return a.name.localeCompare(b.name); // always ascending within a type
          }
          break;
        }
        case 'name':  comparison = a.name.localeCompare(b.name); break;
        case 'stars': comparison = a.totalStars - b.totalStars; break;
        case 'repos': comparison = a.repoCount - b.repoCount; break;
        case 'total': comparison = a.totalRepoCount - b.totalRepoCount; break;
      }
      return filters.sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [entries, filters]);

  const { topLevel, childrenByParent } = useMemo(() => {
    if (!groupByParent) {
      return { topLevel: filteredAndSorted, childrenByParent: new Map<string, OrgEntry[]>() };
    }

    const filteredSlugs = new Set(filteredAndSorted.map((e) => e.slug));
    const childrenByParent = new Map<string, OrgEntry[]>();
    const childSlugsWithVisibleParent = new Set<string>();

    for (const entry of filteredAndSorted) {
      if (entry.parentSlug && filteredSlugs.has(entry.parentSlug)) {
        childSlugsWithVisibleParent.add(entry.slug);
        const siblings = childrenByParent.get(entry.parentSlug) ?? [];
        siblings.push(entry);
        childrenByParent.set(entry.parentSlug, siblings);
      }
    }

    const topLevel = filteredAndSorted.filter((e) => !childSlugsWithVisibleParent.has(e.slug));
    return { topLevel, childrenByParent };
  }, [filteredAndSorted, groupByParent]);

  const handleSort = (field: typeof filters.sortField) => {
    if (!groupByParentUserSet) {
      setGroupByParent(field === 'name' || field === 'type');
    }
    setFilters({
      ...filters,
      sortField: field,
      sortDirection:
        filters.sortField === field && filters.sortDirection === 'desc' ? 'asc' : 'desc',
    });
  };

  const renderRows = (entry: OrgEntry, depth = 0): React.ReactNode => (
    <React.Fragment key={entry.slug}>
      <OrgRow entry={entry} depth={depth} />
      {childrenByParent.get(entry.slug)?.map((child) => renderRows(child, depth + 1))}
    </React.Fragment>
  );

  const OrgRow = ({ entry, depth = 0 }: { entry: OrgEntry; depth?: number }) => (
    <tr className="border-b border-gov-border hover:bg-gov-light-grey transition-colors">
      <td className={`px-4 py-3 ${depth === 1 ? 'pl-10' : depth >= 2 ? 'pl-16' : ''}`}>
        {depth > 0 && <span className="text-gov-grey mr-2" aria-hidden="true">↳</span>}
        <Link
          href={`/org/${entry.slug}`}
          className="text-gov-blue underline hover:text-gov-dark-blue focus:outline-2 focus:outline-gov-blue"
        >
          {entry.name}
        </Link>
      </td>
      <td className="px-4 py-3 text-sm text-gov-grey hidden md:table-cell">{entry.format}</td>
      <td className="px-4 py-3 text-right font-semibold">
        {entry.totalStars.toLocaleString('en-GB')}
      </td>
      <td className="px-4 py-3 text-right">{entry.repoCount.toLocaleString('en-GB')}</td>
      <td className="px-4 py-3 text-right hidden lg:table-cell">{entry.totalRepoCount.toLocaleString('en-GB')}</td>
    </tr>
  );

  return (
    <div className="space-y-6">
      <SearchAndFilter
        filters={filters}
        onFiltersChange={setFilters}
        availableFormats={availableFormats}
      />

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={groupByParent}
          onChange={(e) => { setGroupByParent(e.target.checked); setGroupByParentUserSet(true); }}
          className="w-4 h-4 border-2 border-gov-border rounded focus:outline-none focus:ring-2 focus:ring-gov-blue"
        />
        Group sub-organisations under their parent
      </label>

      <div className="overflow-x-auto">
        <table
          className="w-full border-collapse"
          role="table"
          aria-label="UK public sector organisations and their GitHub code"
        >
          <thead>
            <tr className="bg-gov-light-grey border-b-2 border-gov-dark-blue">
              <th scope="col" className="px-4 py-3 text-left font-bold" aria-sort={getAriaSortValue('name')}>
                <button onClick={() => handleSort('name')} className="flex items-center hover:underline focus:outline-2 focus:outline-gov-blue" aria-label="Sort by organisation name">
                  Organisation{getSortIcon('name')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-left font-bold hidden md:table-cell" aria-sort={getAriaSortValue('type')}>
                <button onClick={() => handleSort('type')} className="flex items-center hover:underline focus:outline-2 focus:outline-gov-blue" aria-label="Sort by organisation type">
                  Type{getSortIcon('type')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-right font-bold" aria-sort={getAriaSortValue('stars')}>
                <button onClick={() => handleSort('stars')} className="flex items-center justify-end w-full hover:underline focus:outline-2 focus:outline-gov-blue" aria-label="Sort by total stars">
                  Stars of active repos{getSortIcon('stars')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-right font-bold" aria-sort={getAriaSortValue('repos')}>
                <button onClick={() => handleSort('repos')} className="flex items-center justify-end w-full hover:underline focus:outline-2 focus:outline-gov-blue" aria-label="Sort by active repository count">
                  Active repos{getSortIcon('repos')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-right font-bold hidden lg:table-cell" aria-sort={getAriaSortValue('total')}>
                <button onClick={() => handleSort('total')} className="flex items-center justify-end w-full hover:underline focus:outline-2 focus:outline-gov-blue" aria-label="Sort by total repository count">
                  Total repos{getSortIcon('total')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {topLevel.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gov-grey">
                  No organisations match your search criteria.
                </td>
              </tr>
            ) : (
              topLevel.map((entry) => renderRows(entry))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-gov-grey" role="status" aria-live="polite">
        Showing {filteredAndSorted.length} of {entries.length} organisations
      </p>
    </div>
  );
}
