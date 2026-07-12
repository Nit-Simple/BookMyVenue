import { useMemo, useState } from 'react';

export type SortDir = 'asc' | 'desc';

interface UseTableOptions<T> {
  data: T[];
  /** Fields to match the search query against (string/number values). */
  searchFields: (keyof T)[];
  pageSize?: number;
  initialSort?: { key: keyof T; dir: SortDir };
  /** Optional extra predicate for column filters. */
  filter?: (row: T) => boolean;
}

function getField<T>(row: T, key: keyof T): unknown {
  return (row as Record<string, unknown>)[key as string];
}

/** Client-side search + sort + pagination over an in-memory array. */
export function useTable<T extends object>({
  data,
  searchFields,
  pageSize = 10,
  initialSort,
  filter,
}: UseTableOptions<T>) {
  const [search, setSearchRaw] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: keyof T; dir: SortDir } | null>(initialSort ?? null);

  const setSearch = (value: string) => {
    setSearchRaw(value);
    setPage(1);
  };

  const toggleSort = (key: keyof T) => {
    setSort((prev) => {
      if (prev?.key === key) {
        return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
      }
      return { key, dir: 'asc' };
    });
  };

  const processed = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = data;
    if (filter) rows = rows.filter(filter);
    if (q) {
      rows = rows.filter((row) =>
        searchFields.some((f) => String(getField(row, f) ?? '').toLowerCase().includes(q)),
      );
    }
    if (sort) {
      rows = [...rows].sort((a, b) => {
        const av = getField(a, sort.key);
        const bv = getField(b, sort.key);
        let cmp: number;
        if (typeof av === 'number' && typeof bv === 'number') cmp = av - bv;
        else cmp = String(av ?? '').localeCompare(String(bv ?? ''));
        return sort.dir === 'asc' ? cmp : -cmp;
      });
    }
    return rows;
  }, [data, filter, search, searchFields, sort]);

  const total = processed.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const rows = processed.slice((safePage - 1) * pageSize, safePage * pageSize);

  return {
    rows,
    total,
    page: safePage,
    totalPages,
    setPage,
    search,
    setSearch,
    sort,
    toggleSort,
  };
}
