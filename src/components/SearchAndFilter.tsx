'use client';

import type { FilterState } from '@/lib/types';

interface Props {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableFormats: string[];
}

export default function SearchAndFilter({ filters, onFiltersChange, availableFormats }: Props) {
  return (
    <div className="bg-gov-light-grey p-4 rounded space-y-4">
      <div>
        <label htmlFor="search" className="block font-bold mb-2">
          Search by organisation name
        </label>
        <input
          id="search"
          type="text"
          value={filters.searchQuery}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              searchQuery: e.target.value,
            })
          }
          placeholder="Search organisations"
          className="w-full px-4 py-2 border-2 border-gov-border rounded focus:outline-none focus:border-gov-blue focus:ring-2 focus:ring-gov-blue"
          aria-label="Search organisations by name"
        />
      </div>

      <details>
        <summary className="font-bold cursor-pointer">Filter by organisation type</summary>
        <fieldset className="mt-2">
          <div className="space-y-2">
            {availableFormats.map((format) => {
              const isChecked = !filters.excludedFormats.includes(format);
              const id = `format-${format.replace(/\s+/g, '-').toLowerCase()}`;
              return (
                <div key={format} className="flex items-center">
                  <input
                    type="checkbox"
                    id={id}
                    checked={isChecked}
                    onChange={(e) => {
                      const newExcluded = e.target.checked
                        ? filters.excludedFormats.filter((f) => f !== format)
                        : [...filters.excludedFormats, format];
                      onFiltersChange({
                        ...filters,
                        excludedFormats: newExcluded,
                      });
                    }}
                    className="w-5 h-5 border-2 border-gov-border rounded focus:outline-none focus:ring-2 focus:ring-gov-blue"
                  />
                  <label htmlFor={id} className="ml-2 cursor-pointer">
                    {format}
                  </label>
                </div>
              );
            })}
          </div>
        </fieldset>
      </details>
    </div>
  );
}
