import { useState } from 'react';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { CalendarOff, Plus, Trash2, Wrench } from 'lucide-react';
import { Modal, Button, Input } from '@/components/ui';
import { useAddMaintenance, useRemoveMaintenance } from '@/hooks/useCalendar';
import { getErrorMessage } from '@/api/axios';
import { formatDate } from '@/utils/format';
import type { MaintenanceDay } from '@/types';

export function MaintenanceDialog({
  venueId,
  maintenance,
  open,
  onClose,
}: {
  venueId: string;
  maintenance: MaintenanceDay[];
  open: boolean;
  onClose: () => void;
}) {
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const add = useAddMaintenance(venueId);
  const remove = useRemoveMaintenance(venueId);

  const handleAdd = async () => {
    if (!date) {
      toast.error('Pick a date to block.');
      return;
    }
    try {
      await add.mutateAsync({ date, reason: reason || undefined });
      toast.success('Maintenance day added. Bookings are blocked for that day.');
      setDate('');
      setReason('');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not add maintenance day.'));
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await remove.mutateAsync(id);
      toast.success('Maintenance day removed.');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not remove maintenance day.'));
    }
  };

  const sorted = [...maintenance].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Maintenance days"
      description="Block days so no new bookings can be made."
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Date"
            type="date"
            min={dayjs().format('YYYY-MM-DD')}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Input
            label="Reason (optional)"
            placeholder="e.g. AC servicing"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
        <Button onClick={handleAdd} isLoading={add.isPending} leftIcon={<Plus className="h-4 w-4" />}>
          Add maintenance day
        </Button>

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
            <Wrench className="h-4 w-4 text-slate-500" /> Blocked days
          </p>
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center gap-1 rounded-xl border border-dashed border-slate-200 py-8 text-slate-400">
              <CalendarOff className="h-6 w-6" />
              <p className="text-sm">No maintenance days set.</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
              {sorted.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{formatDate(m.date)}</p>
                    {m.reason && <p className="text-xs text-slate-500">{m.reason}</p>}
                  </div>
                  <button
                    onClick={() => handleRemove(m.id)}
                    className="focus-ring rounded-lg p-2 text-red-500 hover:bg-red-50"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
