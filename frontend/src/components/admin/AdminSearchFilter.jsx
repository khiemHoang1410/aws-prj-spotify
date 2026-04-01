import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';

/**
 * AdminSearchFilter — search input + optional filter dropdowns
 *
 * Props:
 * - searchPlaceholder: string
 * - filters: [{ key, label, options: [{ value, label }] }]
 * - onChange: fn({ search, ...filterValues })
 */
export default function AdminSearchFilter({ searchPlaceholder = 'Tìm kiếm...', filters = [], onChange }) {
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState({});

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange({ search, ...filterValues });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, filterValues]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (key, value) => {
    setFilterValues((prev) => ({ ...prev, [key]: value || undefined }));
  };

  return (
    <div className="flex gap-3 mb-4">
      <div className="relative flex-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
        />
      </div>
      {filters.map((filter) => (
        <select
          key={filter.key}
          value={filterValues[filter.key] || ''}
          onChange={(e) => handleFilterChange(filter.key, e.target.value)}
          className="px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:border-neutral-600"
        >
          <option value="">{filter.label}</option>
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}
