import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, Users } from 'lucide-react';
import { Button, DatePicker, Select } from '@/components/ui';
import { CATEGORIES, CITIES } from '@/utils/constants';
import { cn } from '@/utils/cn';

/** Big multi-field venue search used on the home hero. */
export function SearchBar({ className }: { className?: string }) {
  const navigate = useNavigate();
  const [city, setCity] = useState('');
  const [date, setDate] = useState('');
  const [guests, setGuests] = useState('');
  const [category, setCategory] = useState('');

  const submit = () => {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (date) params.set('dateFrom', date);
    if (guests) params.set('capacity', guests);
    if (category) params.set('category', category);
    navigate(`/venues?${params.toString()}`);
  };

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-3 rounded-2xl bg-white p-3 shadow-elevated md:grid-cols-[1.2fr_1fr_0.9fr_1fr_auto] md:items-end md:gap-2 md:rounded-full md:p-2',
        className,
      )}
    >
      <div className="md:pl-3">
        <label className="mb-1 block px-1 text-xs font-semibold text-slate-500 md:mb-0">Location</label>
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-2.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400 md:hidden" />
          <Select
            options={CITIES.map((c) => ({ value: c, label: c }))}
            placeholder="Any city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="border-0 pl-9 shadow-none focus:ring-0 md:pl-3"
          />
        </div>
      </div>

      <div className="md:border-l md:border-slate-200 md:pl-3">
        <label className="mb-1 block px-1 text-xs font-semibold text-slate-500 md:mb-0">Event date</label>
        <DatePicker value={date} onChange={setDate} placeholder="Add date" className="[&_button]:border-0 [&_button]:shadow-none [&_button]:focus:ring-0" />
      </div>

      <div className="md:border-l md:border-slate-200 md:pl-3">
        <label className="mb-1 block px-1 text-xs font-semibold text-slate-500 md:mb-0">Guests</label>
        <div className="relative">
          <Users className="pointer-events-none absolute left-2.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="number"
            min={1}
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            placeholder="Count"
            className="h-11 w-full rounded-xl border-0 bg-transparent pl-9 text-sm focus:outline-none focus:ring-0 md:rounded-none"
          />
        </div>
      </div>

      <div className="md:border-l md:border-slate-200 md:pl-3">
        <label className="mb-1 block px-1 text-xs font-semibold text-slate-500 md:mb-0">Category</label>
        <Select
          options={CATEGORIES.map((c) => ({ value: c.id, label: c.label }))}
          placeholder="Any type"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border-0 shadow-none focus:ring-0"
        />
      </div>

      <Button onClick={submit} size="lg" className="md:h-12 md:w-12 md:rounded-full md:p-0" leftIcon={<Search className="h-5 w-5" />}>
        <span className="md:hidden">Search venues</span>
      </Button>
    </div>
  );
}
