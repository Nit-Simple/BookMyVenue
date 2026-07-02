import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LifeBuoy, Search } from 'lucide-react';
import { useFaqs } from './queries';
import { FaqAccordion } from './components/FaqAccordion';
import { Button, EmptyState, Input, Skeleton } from '@/components/ui';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { cn } from '@/utils/cn';

export function FaqPage() {
  const { data: faqs, isLoading } = useFaqs();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 250);
  const [category, setCategory] = useState<string>('All');

  const categories = useMemo(
    () => ['All', ...Array.from(new Set((faqs ?? []).map((f) => f.category)))],
    [faqs],
  );

  const filtered = useMemo(() => {
    if (!faqs) return [];
    const q = debouncedQuery.toLowerCase();
    return faqs.filter(
      (f) =>
        (category === 'All' || f.category === category) &&
        (!q || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)),
    );
  }, [faqs, debouncedQuery, category]);

  return (
    <div className="container-app max-w-3xl py-8 lg:py-12">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold text-slate-900">How can we help?</h1>
        <p className="mt-2 text-slate-500">
          Search our FAQs or browse by topic. Still stuck? Our team is one message away.
        </p>
        <div className="mx-auto mt-6 max-w-xl">
          <Input
            leftIcon={<Search className="h-4 w-4" />}
            placeholder="Search for answers…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="no-scrollbar mt-6 flex justify-center gap-2 overflow-x-auto">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              'shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors',
              category === c
                ? 'border-brand-600 bg-brand-50 text-brand-700'
                : 'border-slate-200 text-slate-600 hover:border-slate-300',
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No matching answers"
            description="Try a different search term, or reach out to our support team."
          />
        ) : (
          <FaqAccordion items={filtered} />
        )}
      </div>

      <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl bg-brand-50 p-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-brand-700">
            <LifeBuoy className="h-5 w-5" />
          </span>
          <div>
            <p className="font-semibold text-slate-900">Still need help?</p>
            <p className="text-sm text-slate-500">Raise a ticket and we’ll get back within 24 hours.</p>
          </div>
        </div>
        <Link to="/support">
          <Button>Contact support</Button>
        </Link>
      </div>
    </div>
  );
}
