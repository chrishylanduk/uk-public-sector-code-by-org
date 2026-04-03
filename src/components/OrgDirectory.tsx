'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import type { OrgEntry, FilterState, GroupedFormats } from '@/lib/types';
import SearchAndFilter from './SearchAndFilter';

interface Props {
  entries: OrgEntry[];
  availableFormats: GroupedFormats;
}

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

export default function OrgDirectory({ entries, availableFormats }: Props) {
  const [groupByParent, setGroupByParent] = useState(true);
  const [groupByParentUserSet, setGroupByParentUserSet] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    excludedFormats: [],
    sortField: 'type',
    sortDirection: 'desc',
  });

  const getAriaSortValue = (field: typeof filters.sortField): 'ascending' | 'descending' | 'none' => {
    if (filters.sortField !== field) return 'none';
    return filters.sortDirection === 'asc' ? 'ascending' : 'descending';
  };

  const getSortIcon = (field: typeof filters.sortField) => {
    if (filters.sortField !== field) {
      return <span className="ml-1 text-grey opacity-50" aria-hidden="true">↕</span>;
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
        case 'fte':           comparison = (a.fte ?? -1) - (b.fte ?? -1); break;
        case 'digitalDataFte': comparison = (a.digitalDataFte ?? -1) - (b.digitalDataFte ?? -1); break;
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

  const OrgCard = ({ entry, depth = 0 }: { entry: OrgEntry; depth?: number }) => (
    <div className={`border-b border-mid-grey py-3 ${depth === 1 ? 'pl-6' : depth === 2 ? 'pl-12' : depth >= 3 ? 'pl-18' : ''}`}>
      {depth > 0 && <span className="text-grey mr-1 text-sm" aria-hidden="true">↳</span>}
      <Link
        href={`/org/${entry.slug}`}
        className="text-orange underline hover:text-dark-orange focus:outline-2 focus:outline-orange font-semibold"
      >
        {entry.name}
      </Link>
      <p className="text-xs text-grey mt-0.5">{entry.format}</p>
      {(entry.fte != null || entry.digitalDataFte != null) && (
        <p className="text-xs text-grey mt-0.5">
          {entry.fte != null && <span>Total FTE: {entry.fte.toLocaleString('en-GB')}</span>}
          {entry.fte != null && entry.digitalDataFte != null && <span> · </span>}
          {entry.digitalDataFte != null && <span>Digital &amp; data FTE: {entry.digitalDataFte.toLocaleString('en-GB')}</span>}
        </p>
      )}
      <dl className="mt-1.5 text-sm flex flex-wrap gap-x-4 gap-y-1">
        <div className="flex gap-1">
          <dt className="text-grey">Stars of active repos:</dt>
          <dd className="font-semibold">{entry.totalStars.toLocaleString('en-GB')}</dd>
        </div>
        <div className="flex gap-1">
          <dt className="text-grey">Active repos:</dt>
          <dd>{entry.repoCount.toLocaleString('en-GB')}</dd>
        </div>
        <div className="flex gap-1">
          <dt className="text-grey">Total repos:</dt>
          <dd>{entry.totalRepoCount.toLocaleString('en-GB')}</dd>
        </div>
      </dl>
    </div>
  );

  const OrgRow = ({ entry, depth = 0 }: { entry: OrgEntry; depth?: number }) => (
    <tr className="border-b border-mid-grey hover:bg-light-grey transition-colors">
      <td className={`px-4 py-3 ${depth === 1 ? 'pl-10' : depth >= 2 ? 'pl-16' : ''}`}>
        {depth > 0 && <span className="text-grey mr-2" aria-hidden="true">↳</span>}
        <Link
          href={`/org/${entry.slug}`}
          className="text-orange underline hover:text-dark-orange focus:outline-2 focus:outline-orange"
        >
          {entry.name}
        </Link>
      </td>
      <td className="px-4 py-3 text-sm text-grey hidden md:table-cell">{entry.format}</td>
      <td className="px-4 py-3 text-right font-semibold">
        {entry.totalStars.toLocaleString('en-GB')}
      </td>
      <td className="px-4 py-3 text-right">{entry.repoCount.toLocaleString('en-GB')}</td>
      <td className="px-4 py-3 text-right hidden lg:table-cell">{entry.totalRepoCount.toLocaleString('en-GB')}</td>
      <td className="px-4 py-3 text-right">{entry.fte != null ? entry.fte.toLocaleString('en-GB') : <span className="text-grey">—</span>}</td>
      <td className="px-4 py-3 text-right">{entry.digitalDataFte != null ? entry.digitalDataFte.toLocaleString('en-GB') : <span className="text-grey">—</span>}</td>
    </tr>
  );

  const renderRows = (entry: OrgEntry, depth = 0): React.ReactNode => (
    <React.Fragment key={entry.slug}>
      <OrgRow entry={entry} depth={depth} />
      {childrenByParent.get(entry.slug)?.map((child) => renderRows(child, depth + 1))}
    </React.Fragment>
  );

  const renderCards = (entry: OrgEntry, depth = 0): React.ReactNode => (
    <React.Fragment key={entry.slug}>
      <OrgCard entry={entry} depth={depth} />
      {childrenByParent.get(entry.slug)?.map((child) => renderCards(child, depth + 1))}
    </React.Fragment>
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
          className=""
        />
        Group sub-organisations under their parent
      </label>

      {/* Mobile sort controls */}
      <div className="md:hidden flex items-center gap-2 text-sm">
        <label htmlFor="mobile-sort" className="text-grey shrink-0">Sort by:</label>
        <select
          id="mobile-sort"
          value={filters.sortField}
          onChange={(e) => {
            const field = e.target.value as typeof filters.sortField;
            if (!groupByParentUserSet) {
              setGroupByParent(field === 'name' || field === 'type');
            }
            setFilters({ ...filters, sortField: field, sortDirection: field === 'name' ? 'asc' : 'desc' });
          }}
          className="border border-mid-grey rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange bg-white"
        >
          <option value="type">Type (default)</option>
          <option value="name">Name A–Z</option>
          <option value="stars">Stars of active repos</option>
          <option value="repos">Active repos</option>
          <option value="total">Total repos</option>
          <option value="fte">Total FTE</option>
          <option value="digitalDataFte">Digital &amp; data FTE</option>
        </select>
      </div>

      {/* Mobile card layout */}
      <div className="md:hidden" role="list" aria-label="UK public sector organisations and their GitHub code">
        {topLevel.length === 0 ? (
          <p className="py-8 text-center text-grey">No organisations match your search criteria.</p>
        ) : (
          topLevel.map((entry) => renderCards(entry))
        )}
      </div>

      {/* Desktop table layout */}
      <div className="hidden md:block overflow-x-clip">
        <table
          className="w-full border-collapse"
          role="table"
          aria-label="UK public sector organisations and their GitHub code"
        >
          <thead className="sticky top-0 z-10 shadow-[0_2px_0_0_#9a3412]">
            <tr className="bg-light-grey">
              <th scope="col" className="px-4 py-3 text-left font-bold" aria-sort={getAriaSortValue('name')}>
                <button onClick={() => handleSort('name')} className="flex items-center hover:underline focus:outline-2 focus:outline-orange" aria-label="Sort by organisation name">
                  Organisation{getSortIcon('name')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-left font-bold hidden md:table-cell" aria-sort={getAriaSortValue('type')}>
                <button onClick={() => handleSort('type')} className="flex items-center hover:underline focus:outline-2 focus:outline-orange" aria-label="Sort by organisation type">
                  Type{getSortIcon('type')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-right font-bold" aria-sort={getAriaSortValue('stars')}>
                <button onClick={() => handleSort('stars')} className="flex items-center justify-end w-full hover:underline focus:outline-2 focus:outline-orange" aria-label="Sort by total stars">
                  Stars of active repos{getSortIcon('stars')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-right font-bold" aria-sort={getAriaSortValue('repos')}>
                <button onClick={() => handleSort('repos')} className="flex items-center justify-end w-full hover:underline focus:outline-2 focus:outline-orange" aria-label="Sort by active repository count">
                  Active repos{getSortIcon('repos')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-right font-bold hidden lg:table-cell" aria-sort={getAriaSortValue('total')}>
                <button onClick={() => handleSort('total')} className="flex items-center justify-end w-full hover:underline focus:outline-2 focus:outline-orange" aria-label="Sort by total repository count">
                  Total repos{getSortIcon('total')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-right font-bold" aria-sort={getAriaSortValue('fte')}>
                <button onClick={() => handleSort('fte')} className="flex items-center justify-end w-full hover:underline focus:outline-2 focus:outline-orange" aria-label="Sort by total FTE">
                  Total FTE{getSortIcon('fte')}
                </button>
              </th>
              <th scope="col" className="px-4 py-3 text-right font-bold" aria-sort={getAriaSortValue('digitalDataFte')}>
                <button onClick={() => handleSort('digitalDataFte')} className="flex items-center justify-end w-full hover:underline focus:outline-2 focus:outline-orange" aria-label="Sort by digital and data FTE">
                  Digital &amp; data FTE{getSortIcon('digitalDataFte')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {topLevel.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-grey">
                  No organisations match your search criteria.
                </td>
              </tr>
            ) : (
              topLevel.map((entry) => renderRows(entry))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-grey" role="status" aria-live="polite">
        Showing {filteredAndSorted.length} of {entries.length} organisations
      </p>
    </div>
  );
}
