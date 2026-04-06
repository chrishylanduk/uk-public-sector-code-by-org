'use client';

import type { FilterState, GroupedFormats } from '@/lib/types';

interface Props {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableFormats: GroupedFormats;
  formatCounts: Map<string, number>;
}

function FormatCheckbox({ format, count, filters, onFiltersChange }: {
  format: string;
  count: number;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}) {
  const isChecked = !filters.excludedFormats.includes(format);
  const id = `format-${format.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div className="flex items-center">
      <input
        type="checkbox"
        id={id}
        checked={isChecked}
        onChange={(e) => {
          const newExcluded = e.target.checked
            ? filters.excludedFormats.filter((f) => f !== format)
            : [...filters.excludedFormats, format];
          onFiltersChange({ ...filters, excludedFormats: newExcluded });
        }}
        className=""
      />
      <label htmlFor={id} className="ml-2 cursor-pointer">{format} <span className="text-grey">[{count}]</span></label>
    </div>
  );
}

const btnClass = 'text-xs underline hover:text-orange focus:outline-2 focus:outline-orange text-grey';

export default function SearchAndFilter({ filters, onFiltersChange, availableFormats, formatCounts }: Props) {

  const groups: { label: string; formats: string[] }[] = [
    { label: 'GOV.UK organisations', formats: availableFormats.govUk },
    { label: 'English councils', formats: availableFormats.englishCouncil },
    { label: 'Other', formats: availableFormats.other },
  ].filter((g) => g.formats.length > 0);

  const allFormats = groups.flatMap((g) => g.formats);

  const selectGroup = (formats: string[]) =>
    onFiltersChange({ ...filters, excludedFormats: filters.excludedFormats.filter((f) => !formats.includes(f)) });

  const deselectGroup = (formats: string[]) =>
    onFiltersChange({ ...filters, excludedFormats: [...new Set([...filters.excludedFormats, ...formats])] });

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="search" className="block font-bold mb-2">
          Search by organisation name
        </label>
        <input
          id="search"
          type="text"
          value={filters.searchQuery}
          onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
          placeholder="Search organisations"
          className="w-full max-w-md px-3 py-2 border-2 border-mid-grey focus:outline-none focus:border-orange focus:ring-2 focus:ring-orange"
          aria-label="Search organisations by name"
        />
      </div>

      <details>
        <summary className="font-bold cursor-pointer select-none">Filter by organisation type</summary>
        <div className="mt-3 pl-4 border-l-2 border-mid-grey">
        <div className="mb-3 flex gap-3">
          <button type="button" className={btnClass} onClick={() => selectGroup(allFormats)}>
            Select all
          </button>
          <button type="button" className={btnClass} onClick={() => deselectGroup(allFormats)}>
            Deselect all
          </button>
        </div>
        <fieldset className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {groups.map(({ label, formats }) => (
            <div key={label}>
              <div className="flex items-baseline gap-3 mb-1">
                <p className="text-sm font-semibold text-grey">{label}</p>
                <button
                  type="button"
                  className={btnClass}
                  onClick={() => selectGroup(formats)}
                  aria-label={`Select all ${label} types`}
                >
                  All
                </button>
                <button
                  type="button"
                  className={btnClass}
                  onClick={() => deselectGroup(formats)}
                  aria-label={`Deselect all ${label} types`}
                >
                  None
                </button>
              </div>
              <div className="space-y-2">
                {formats.map((format) => (
                  <FormatCheckbox
                    key={format}
                    format={format}
                    count={formatCounts.get(format) ?? 0}
                    filters={filters}
                    onFiltersChange={onFiltersChange}
                  />
                ))}
              </div>
            </div>
          ))}
        </fieldset>
        </div>
      </details>
    </div>
  );
}
