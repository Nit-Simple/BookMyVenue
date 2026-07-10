import { FileClock } from 'lucide-react';
import { Card } from '@/components/ui';
import { StatusBadge } from '@/components/common/StatusBadge';
import { formatDate } from '@/utils/format';
import type { VenueApplication } from '@/types';

const TYPE_LABEL: Record<VenueApplication['type'], string> = {
  NEW_VENUE: 'New venue',
  PRICING_UPDATE: 'Pricing update',
};

export function ApplicationsPanel({ applications }: { applications: VenueApplication[] }) {
  const sorted = [...applications].sort(
    (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime(),
  );

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <FileClock className="h-4 w-4 text-brand-600" />
        <h3 className="text-sm font-semibold text-slate-900">Review history</h3>
      </div>
      {sorted.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">No applications submitted yet.</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {sorted.map((app) => (
            <div key={app.application_id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">{TYPE_LABEL[app.type]}</p>
                <p className="text-xs text-slate-500">
                  Submitted {formatDate(app.submitted_at)}
                  {app.admin_notes ? ` · ${app.admin_notes}` : ''}
                </p>
              </div>
              <StatusBadge kind="application" status={app.status} />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
