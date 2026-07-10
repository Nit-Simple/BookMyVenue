import type { UseFormReturn } from 'react-hook-form';
import { Input, Select, Textarea, Checkbox, Card } from '@/components/ui';
import { VENUE_CATEGORIES } from '@/constants';
import type { VenueFormValues } from './venueSchema';

const DURATION_OPTIONS = [
  { value: '1h', label: '1 hour' },
  { value: '2h', label: '2 hours' },
  { value: '3h', label: '3 hours' },
  { value: '4h', label: '4 hours' },
  { value: '6h', label: '6 hours' },
];

const RELAXATION_OPTIONS = [
  { value: '0h', label: 'None' },
  { value: '30m', label: '30 minutes' },
  { value: '1h', label: '1 hour' },
  { value: '2h', label: '2 hours' },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5 sm:p-6">
      <h3 className="mb-4 text-sm font-semibold text-slate-900">{title}</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </Card>
  );
}

interface VenueFormProps {
  form: UseFormReturn<VenueFormValues>;
  readOnly?: boolean;
}

export function VenueForm({ form, readOnly }: VenueFormProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-4">
      <Section title="Basic information">
        <Input
          label="Venue name"
          required
          disabled={readOnly}
          error={errors.venue_name?.message}
          {...register('venue_name')}
        />
        <Select
          label="Category"
          required
          disabled={readOnly}
          placeholder="Select a category"
          options={VENUE_CATEGORIES.map((c) => ({ value: c, label: c }))}
          error={errors.venue_type?.message}
          {...register('venue_type')}
        />
        <div className="sm:col-span-2">
          <Textarea
            label="Description"
            rows={3}
            disabled={readOnly}
            hint="Not stored by the backend yet — shown for future use. (TODO backend)"
            error={errors.description?.message}
            {...register('description')}
          />
        </div>
      </Section>

      <Section title="Contact">
        <Input
          label="Email"
          type="email"
          required
          disabled={readOnly}
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Contact number"
          required
          disabled={readOnly}
          error={errors.phone?.message}
          {...register('phone')}
        />
        <Input
          label="Private number"
          hint="Not shown publicly"
          disabled={readOnly}
          error={errors.phone_private?.message}
          {...register('phone_private')}
        />
      </Section>

      <Section title="Address & location">
        <div className="sm:col-span-2">
          <Input
            label="Address line 1"
            required
            disabled={readOnly}
            error={errors.addressline_1?.message}
            {...register('addressline_1')}
          />
        </div>
        <div className="sm:col-span-2">
          <Input
            label="Address line 2"
            disabled={readOnly}
            error={errors.addressline_2?.message}
            {...register('addressline_2')}
          />
        </div>
        <Input label="City" required disabled={readOnly} error={errors.city?.message} {...register('city')} />
        <Input
          label="District"
          required
          disabled={readOnly}
          error={errors.district?.message}
          {...register('district')}
        />
        <Input label="State" required disabled={readOnly} error={errors.state?.message} {...register('state')} />
        <Input
          label="Postal code"
          required
          disabled={readOnly}
          error={errors.postal_code?.message}
          {...register('postal_code')}
        />
        <Input
          label="Country code"
          required
          disabled={readOnly}
          error={errors.country_code?.message}
          {...register('country_code')}
        />
        <Input
          label="Latitude"
          hint="Google Maps latitude"
          disabled={readOnly}
          error={errors.latitude?.message}
          {...register('latitude')}
        />
        <Input
          label="Longitude"
          hint="Google Maps longitude"
          disabled={readOnly}
          error={errors.longitude?.message}
          {...register('longitude')}
        />
      </Section>

      <Section title="Capacity & timings">
        <Input
          label="Seating capacity"
          type="number"
          min={1}
          required
          disabled={readOnly}
          error={errors.seating_capacity?.message}
          {...register('seating_capacity')}
        />
        <Select
          label="Minimum booking duration"
          disabled={readOnly}
          options={DURATION_OPTIONS}
          error={errors.min_booking_duration?.message}
          {...register('min_booking_duration')}
        />
        <Input
          label="Opening time"
          type="time"
          required
          disabled={readOnly}
          error={errors.opening_period?.message}
          {...register('opening_period')}
        />
        <Input
          label="Closing time"
          type="time"
          required
          disabled={readOnly}
          error={errors.closing_period?.message}
          {...register('closing_period')}
        />
        <Select
          label="Relaxation period"
          hint="Buffer between bookings"
          disabled={readOnly}
          options={RELAXATION_OPTIONS}
          error={errors.relaxation_period?.message}
          {...register('relaxation_period')}
        />
        <div className="flex items-end pb-2">
          <Checkbox
            checked={watch('is_air_conditioned')}
            onChange={(v) => !readOnly && setValue('is_air_conditioned', v)}
            label="Air conditioned"
          />
        </div>
      </Section>
    </div>
  );
}
