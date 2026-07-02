import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LayoutGrid, List, SlidersHorizontal } from 'lucide-react';
import { VenueCard } from './components/VenueCard';
import { FiltersPanel } from './components/FiltersPanel';
import { useVenueList } from './queries';
import {
  Button,
  Drawer,
  EmptyState,
  ErrorState,
  Select,
  VenueGridSkeleton,
} from '@/components/ui';
import { useUiStore } from '@/app/store/uiStore';
import { cn } from '@/utils/cn';
import type { EventCategory, SortOption, VenueFilters } from '@/types';

const PAGE_SIZE = 12;

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'popular', label: 'Most Popular' },
];

function parseFilters(params: URLSearchParams): VenueFilters {
  const num = (k: string) => (params.has(k) ? Number(params.get(k)) : undefined);
  return {
    query: params.get('query') ?? undefined,
    city: params.get('city') ?? undefined,
    category: (params.get('category') as EventCategory) ?? undefined,
    dateFrom: params.get('dateFrom') ?? undefined,
    capacity: num('capacity'),
    priceMin: num('priceMin'),
    priceMax: num('priceMax'),
    minRating: num('minRating'),
    offersOnly: params.get('offersOnly') === 'true' || undefined,
    sort: (params.get('sort') as SortOption) ?? 'recommended',
    page: num('page') ?? 1,
    pageSize: PAGE_SIZE,
  };
}

export function VenuesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const viewMode = useUiStore((s) => s.venueViewMode);
  const setViewMode = useUiStore((s) => s.setVenueViewMode);

  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);
  const { data, isLoading, isError, refetch, isFetching } = useVenueList(filters);

  const updateParams = (patch: Partial<VenueFilters>, resetPage = true) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '' || v === false) next.delete(k);
      else next.set(k, String(v));
    });
    if (resetPage) next.delete('page');
    setSearchParams(next, { replace: true });
  };

  const resetFilters = () => {
    const next = new URLSearchParams();
    if (filters.query) next.set('query', filters.query);
    setSearchParams(next, { replace: true });
  };

  const activeFilterCount = [
    filters.city,
    filters.category,
    filters.capacity,
    filters.priceMin,
    filters.priceMax,
    filters.minRating,
    filters.offersOnly,
  ].filter(Boolean).length;

  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const currentPage = filters.page ?? 1;

  return (
    <div className="container-app py-6 lg:py-8">
      <div className="mb-5">
        <h1 className="font-display text-2xl font-bold text-slate-900 sm:text-3xl">
          {filters.city ? `Venues in ${filters.city}` : 'Explore venues'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {isLoading ? 'Searching…' : `${total} venue${total === 1 ? '' : 's'} found`}
          {filters.query && ` for “${filters.query}”`}
        </p>
      </div>

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-20 rounded-2xl border border-slate-100 bg-white p-5 shadow-card">
            <FiltersPanel filters={filters} onChange={(p) => updateParams(p)} onReset={resetFilters} />
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {/* Toolbar */}
          <div className="mb-5 flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              leftIcon={<SlidersHorizontal className="h-4 w-4" />}
              onClick={() => setDrawerOpen(true)}
            >
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1 rounded-full bg-brand-600 px-1.5 text-xs text-white">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            <div className="ml-auto w-44">
              <Select
                options={sortOptions}
                value={filters.sort}
                onChange={(e) => updateParams({ sort: e.target.value as SortOption })}
              />
            </div>

            <div className="hidden items-center gap-1 rounded-xl bg-slate-100 p-1 sm:flex">
              <button
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                className={cn(
                  'rounded-lg p-2 transition-colors',
                  viewMode === 'grid' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-400',
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                aria-label="List view"
                className={cn(
                  'rounded-lg p-2 transition-colors',
                  viewMode === 'list' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-400',
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Results */}
          {isLoading ? (
            <VenueGridSkeleton count={9} />
          ) : isError ? (
            <ErrorState onRetry={refetch} />
          ) : total === 0 ? (
            <EmptyState
              title="No venues match your filters"
              description="Try widening your search — remove a filter or pick a different city."
              action={{ label: 'Clear filters', onClick: resetFilters }}
            />
          ) : (
            <>
              <div
                className={cn(
                  'transition-opacity',
                  isFetching && 'opacity-60',
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3'
                    : 'flex flex-col gap-4',
                )}
              >
                {data?.items.map((venue) => (
                  <VenueCard key={venue.id} venue={venue} view={viewMode} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => updateParams({ page: currentPage - 1 }, false)}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }).slice(0, 7).map((_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => updateParams({ page }, false)}
                          className={cn(
                            'h-9 w-9 rounded-lg text-sm font-medium transition-colors',
                            page === currentPage
                              ? 'bg-brand-700 text-white'
                              : 'text-slate-600 hover:bg-slate-100',
                          )}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => updateParams({ page: currentPage + 1 }, false)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile filters drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Filters"
        side="bottom"
        footer={
          <Button fullWidth onClick={() => setDrawerOpen(false)}>
            Show {total} venues
          </Button>
        }
      >
        <FiltersPanel filters={filters} onChange={(p) => updateParams(p)} onReset={resetFilters} />
      </Drawer>
    </div>
  );
}
