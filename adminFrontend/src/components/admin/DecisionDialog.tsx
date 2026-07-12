import { useEffect, useState } from 'react';
import { Modal, Button, Textarea } from '@/components/ui';

interface DecisionDialogProps {
  open: boolean;
  action: 'approve' | 'reject' | null;
  venueName?: string;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => void;
}

/**
 * Approve (notes optional) / Reject (reason required — backend rejects with 400
 * otherwise) confirmation dialog.
 */
export function DecisionDialog({
  open,
  action,
  venueName,
  isLoading,
  onClose,
  onConfirm,
}: DecisionDialogProps) {
  const [notes, setNotes] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setNotes('');
      setTouched(false);
    }
  }, [open]);

  const isReject = action === 'reject';
  const reasonMissing = isReject && notes.trim().length === 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isReject ? 'Reject venue' : 'Approve venue'}
      description={
        venueName
          ? `${isReject ? 'Reject' : 'Approve'} “${venueName}”?`
          : undefined
      }
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant={isReject ? 'danger' : 'primary'}
            isLoading={isLoading}
            onClick={() => {
              if (reasonMissing) {
                setTouched(true);
                return;
              }
              onConfirm(notes.trim());
            }}
          >
            {isReject ? 'Reject' : 'Approve'}
          </Button>
        </div>
      }
    >
      <p className="mb-3 text-sm text-slate-600">
        {isReject
          ? 'The owner will see this reason. Rejection is required to include a note.'
          : 'You can optionally add an internal note for this approval.'}
      </p>
      <Textarea
        label={isReject ? 'Rejection reason' : 'Notes (optional)'}
        required={isReject}
        rows={3}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={isReject ? 'e.g. Incomplete documentation' : 'e.g. Verified documents'}
        error={touched && reasonMissing ? 'A rejection reason is required.' : undefined}
      />
    </Modal>
  );
}
