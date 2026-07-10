import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Eye, Info, RotateCcw, Save } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { PolicyEditor } from '@/components/policy/PolicyEditor';
import { makeRule, validateRules } from '@/components/policy/policyUtils';
import { PolicyPreview } from '@/components/policy/PolicyPreview';
import { Card, Button, PageLoader, ErrorState, EmptyState } from '@/components/ui';
import { useMyVenue } from '@/hooks/useVenue';
import { useCancellationPolicy, useSaveCancellationPolicy } from '@/hooks/useCancellationPolicy';
import { getErrorMessage } from '@/api/axios';
import type { CancellationRule } from '@/types';

const EXAMPLE: CancellationRule[] = [
  { id: 'ex-1', hours_before: 48, refund_percentage: 100 },
  { id: 'ex-2', hours_before: 24, refund_percentage: 50 },
  { id: 'ex-3', hours_before: 12, refund_percentage: 20 },
  { id: 'ex-4', hours_before: 0, refund_percentage: 0 },
];

export default function CancellationPolicyPage() {
  const { venueId, hasVenue, isLoading: venueLoading } = useMyVenue();
  const { data, isLoading, isError, refetch } = useCancellationPolicy(venueId);
  const save = useSaveCancellationPolicy(venueId ?? '');

  const [rules, setRules] = useState<CancellationRule[]>([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (data) setRules(data.rules);
  }, [data]);

  const errors = useMemo(() => validateRules(rules), [rules]);
  const hasErrors = Object.keys(errors).length > 0;

  const change = (next: CancellationRule[]) => {
    setRules(next);
    setDirty(true);
  };

  const onSave = async () => {
    if (hasErrors) {
      toast.error('Please fix the highlighted errors first.');
      return;
    }
    try {
      await save.mutateAsync(rules);
      toast.success('Cancellation policy saved.');
      setDirty(false);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save policy.'));
    }
  };

  const loading = venueLoading || isLoading;

  if (loading) return <PageLoader label="Loading policy…" />;
  if (!hasVenue) {
    return (
      <>
        <PageHeader title="Cancellation Policy" />
        <EmptyState title="No venue yet" description="Create your venue profile to set a cancellation policy." />
      </>
    );
  }
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <>
      <PageHeader
        title="Cancellation Policy"
        description="Define how much is refunded based on how far in advance a booking is cancelled."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => change(EXAMPLE.map((r) => ({ ...r, id: makeRule().id })))}
              leftIcon={<RotateCcw className="h-4 w-4" />}
            >
              Use example
            </Button>
            <Button onClick={onSave} isLoading={save.isPending} disabled={!dirty || hasErrors} leftIcon={<Save className="h-4 w-4" />}>
              Save policy
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex items-start gap-2 rounded-xl border border-sky-100 bg-sky-50 p-4 text-sm text-sky-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Each rule maps a cancellation window (hours before the event) to a refund percentage.
          Higher hours = more notice = usually a higher refund.
          <br />
          <span className="text-xs text-sky-700">
            Note: the backend does not persist cancellation policies yet — changes are stored
            locally for now.
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Rules</h3>
          {rules.length === 0 ? (
            <EmptyState
              title="No rules yet"
              description="Add your first cancellation rule to get started."
              action={{ label: 'Add rule', onClick: () => change([makeRule()]) }}
            />
          ) : (
            <PolicyEditor rules={rules} onChange={change} errors={errors} />
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Eye className="h-4 w-4 text-brand-600" />
            <h3 className="text-sm font-semibold text-slate-900">Preview</h3>
          </div>
          <PolicyPreview rules={rules} />
        </Card>
      </div>
    </>
  );
}
