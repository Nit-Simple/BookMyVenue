import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import { Building2, Info, Pencil, Plus, Save, X } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatusBadge } from '@/components/common/StatusBadge';
import { MediaUploader, type UploadFile } from '@/components/common/MediaUploader';
import { VenueForm } from '@/components/profile/VenueForm';
import { BasePriceCard } from '@/components/profile/BasePriceCard';
import { VenueMediaGallery } from '@/components/profile/VenueMediaGallery';
import { ApplicationsPanel } from '@/components/profile/ApplicationsPanel';
import {
  DEFAULT_VENUE_FORM,
  formToCreatePayload,
  venueSchema,
  venueToForm,
  type VenueFormValues,
} from '@/components/profile/venueSchema';
import { Button, Card, Input, Select, PageLoader, ErrorState } from '@/components/ui';
import { CURRENCIES } from '@/constants';
import { useMyVenue } from '@/hooks/useVenue';
import { useApplications, useCreateVenue, usePricing, useUpdateVenue } from '@/hooks/useProfile';
import { getErrorMessage } from '@/api/axios';
import type { CreateVenueRequest } from '@/types';

function OnboardingForm({ onSuccess }: { onSuccess?: () => void }) {
  const form = useForm<VenueFormValues>({
    resolver: zodResolver(venueSchema),
    defaultValues: DEFAULT_VENUE_FORM,
  });
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('INR');
  const createVenue = useCreateVenue();

  const onSubmit = async (values: VenueFormValues) => {
    if (files.length < 3) {
      toast.error('Please upload at least 3 images.');
      return;
    }
    const priceValue = Number(price);
    if (!priceValue || priceValue <= 0) {
      toast.error('Enter a valid base price per hour.');
      return;
    }
    const payload: CreateVenueRequest = {
      ...formToCreatePayload(values),
      media: [], // media is attached as multipart files, not JSON
      pricing: [
        {
          price_per_hour: priceValue,
          is_weekend: false,
          currency,
          start_date: dayjs().format('YYYY-MM-DD'),
          end_date: null,
        },
      ],
    };
    try {
      await createVenue.mutateAsync({ payload, files: files.map((f) => f.file) });
      toast.success('Venue submitted for approval!');
      onSuccess?.();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create venue.'));
    }
  };

  return (
    <>
      <PageHeader
        title="Set up your venue"
        description="Complete your venue profile to start receiving bookings. It will be reviewed before going live."
      />
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <VenueForm form={form} />

        <Card className="p-5 sm:p-6">
          <h3 className="mb-4 text-sm font-semibold text-slate-900">Base price</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Input
                label="Price per hour"
                type="number"
                min={0}
                step="50"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 4500"
              />
            </div>
            <Select
              label="Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              options={CURRENCIES.map((c) => ({ value: c.value, label: c.label }))}
            />
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <h3 className="mb-1 text-sm font-semibold text-slate-900">Photos</h3>
          <p className="mb-4 text-xs text-slate-500">At least 3 images are required.</p>
          <MediaUploader files={files} onChange={setFiles} minFiles={3} />
        </Card>

        <div className="flex justify-end">
          <Button type="submit" size="lg" isLoading={createVenue.isPending} leftIcon={<Building2 className="h-4 w-4" />}>
            Submit venue for approval
          </Button>
        </div>
      </form>
    </>
  );
}

export default function ProfilePage() {
  const { venue, venueId, hasVenue, isLoading, isError, refetch } = useMyVenue();
  const pricingQuery = usePricing(venueId);
  const applicationsQuery = useApplications();
  const [editing, setEditing] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const form = useForm<VenueFormValues>({
    resolver: zodResolver(venueSchema),
    defaultValues: DEFAULT_VENUE_FORM,
  });
  const updateVenue = useUpdateVenue(venueId ?? '');

  useEffect(() => {
    if (venue) form.reset(venueToForm(venue));
  }, [venue, form]);

  if (isLoading) return <PageLoader label="Loading your venue…" />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (!hasVenue || !venue || showOnboarding) {
    return <OnboardingForm onSuccess={() => setShowOnboarding(false)} />;
  }

  const canEdit = venue.onboarding_status === "APPROVED";
  console.log('🔍 Venue Debug:', {
    status: venue.onboarding_status,
    canEdit,
    editing,
    formReadOnly: !canEdit || !editing,
  });

  const onSave = async (values: VenueFormValues) => {
    try {
      await updateVenue.mutateAsync(formToCreatePayload(values));
      toast.success('Venue profile updated.');
      setEditing(false);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update venue.'));
    }
  };

  return (
    <>
      <PageHeader
        title="Venue Profile"
        description="Manage your venue’s details, pricing and media."
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge kind="onboarding" status={venue.onboarding_status} />
            <Button
              variant="outline"
              onClick={() => setShowOnboarding(true)}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Add new venue
            </Button>
            {canEdit &&
              (editing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      form.reset(venueToForm(venue));
                      setEditing(false);
                    }}
                    leftIcon={<X className="h-4 w-4" />}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={form.handleSubmit(onSave)}
                    isLoading={updateVenue.isPending}
                    leftIcon={<Save className="h-4 w-4" />}
                  >
                    Save changes
                  </Button>
                </>
              ) : (
                <Button onClick={() => setEditing(true)} leftIcon={<Pencil className="h-4 w-4" />}>
                  Edit
                </Button>
              ))}
          </div>
        }
      />

      {venue.onboarding_status === "PENDING_APPROVAL" && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Your venue is pending approval. You can edit its details once it is approved.</p>
        </div>
      )}

      {venue.onboarding_status === "REJECTED" && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-800">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>Your venue has been rejected. Please contact support to resubmit your venue.</p>
        </div>
      )}

      <div className="space-y-4">
        <VenueForm form={form} readOnly={!canEdit || !editing} />
        {venueId && <BasePriceCard venueId={venueId} pricing={pricingQuery.data} />}
        <VenueMediaGallery media={venue.media} />
        {applicationsQuery.data && <ApplicationsPanel applications={applicationsQuery.data} />}
      </div>
    </>
  );
}
