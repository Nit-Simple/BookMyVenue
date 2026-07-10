import { ImageOff, Star } from 'lucide-react';
import { Card, Badge } from '@/components/ui';
import type { VenueMedia } from '@/types';

/**
 * Read-only gallery of the venue's existing media.
 * TODO(backend): there is no standalone add/replace/delete-media endpoint —
 * media can currently only be set at venue creation. Editing is disabled.
 */
export function VenueMediaGallery({ media }: { media: VenueMedia[] }) {
  const sorted = [...media].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">Media</h3>
        <Badge variant="neutral">Editing coming soon</Badge>
      </div>
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-slate-400">
          <ImageOff className="h-8 w-8" />
          <p className="text-sm">No media uploaded.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {sorted.map((m) => (
            <div
              key={m.media_id}
              className="relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-200"
            >
              <img src={m.url} alt="" className="h-full w-full object-cover" loading="lazy" />
              {m.primary && (
                <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-brand-700 px-2 py-0.5 text-[10px] font-semibold text-white">
                  <Star className="h-2.5 w-2.5" /> Primary
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
