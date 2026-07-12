import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowRight, Building2, Check } from 'lucide-react';
import { Button, Card, Input, Select, Textarea, Checkbox } from '@/components/ui';
import { MediaUploader, type UploadFile } from '@/components/common/MediaUploader';
import { Stepper } from '@/components/registration/Stepper';
import {
  AMENITIES,
  DEFAULT_REGISTRATION,
  STEP_FIELDS,
  registrationSchema,
  type Amenity,
  type RegistrationValues,
} from '@/components/registration/schema';
import { VENUE_CATEGORIES } from '@/constants';
import { authApi } from '@/api/auth';
import { profileApi } from '@/api/profile';
import { tokenStorage, getErrorMessage } from '@/api/axios';
import type { CreateVenueRequest } from '@/types';

const STEP_LABELS = ['Owner', 'Business', 'Venue', 'Amenities', 'Media', 'Review'];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [amenities, setAmenities] = useState<Record<string, boolean>>({ AC: true });
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<RegistrationValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: DEFAULT_REGISTRATION,
    mode: 'onTouched',
  });
  const { register, watch, formState: { errors } } = form;
  const v = watch();

  const next = async () => {
    const fields = STEP_FIELDS[step];
    if (fields.length) {
      const valid = await form.trigger(fields);
      if (!valid) return;
    }
    if (step === 4 && files.length < 3) {
      toast.error('Please upload at least 3 images.');
      return;
    }
    setStep((s) => Math.min(s + 1, STEP_LABELS.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const onSubmit = async () => {
    if (files.length < 3) {
      toast.error('Please upload at least 3 images.');
      setStep(4);
      return;
    }
    setSubmitting(true);
    try {
      // 1) Register the owner (forced venue_manager) + login → tokens.
      const tokens = await authApi.register({
        email: v.owner_email,
        password: v.password,
        phone: v.owner_phone,
      });
      tokenStorage.set(tokens.access_token, tokens.refresh_token);
      localStorage.setItem('bmv_web_email', v.owner_email);

      // 2) Create the venue (multipart). Fields with no backend home are dropped
      //    with TODO(backend): business_name, gst_number, trade_license,
      //    google_maps_url, description, amenities (except AC → is_air_conditioned).
      const payload: CreateVenueRequest = {
        venue_name: v.venue_name,
        venue_type: v.venue_type,
        addressline_1: v.addressline_1,
        addressline_2: v.addressline_2 || undefined,
        phone: v.owner_phone,
        email: v.owner_email,
        city: v.city,
        district: v.district,
        state: v.state,
        postal_code: v.postal_code,
        country_code: v.country_code,
        seating_capacity: Number(v.seating_capacity),
        is_air_conditioned: !!amenities.AC,
        min_booking_duration: '2h',
        opening_period: '09:00',
        closing_period: '23:00',
        relaxation_period: '1h',
        media: [],
        pricing: [], // owner sets base price later in the venue portal
      };
      await profileApi.createVenue(payload, files.map((f) => f.file));
      toast.success('Venue submitted successfully!');
      navigate('/registration-success');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Registration failed. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAmenity = (a: Amenity) => setAmenities((prev) => ({ ...prev, [a]: !prev[a] }));

  return (
    <section className="bg-slate-50">
      <div className="container-app max-w-3xl py-12">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-extrabold text-slate-900">List your venue</h1>
          <p className="mt-2 text-sm text-slate-500">Complete the steps below to submit your venue for approval.</p>
        </div>

        <div className="mb-8">
          <Stepper steps={STEP_LABELS} current={step} />
        </div>

        <Card className="p-6 sm:p-8">
          {/* Step 1 — Owner */}
          {step === 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input label="Full name" required error={errors.full_name?.message} {...register('full_name')} />
              </div>
              <Input label="Email" type="email" required error={errors.owner_email?.message} {...register('owner_email')} />
              <Input label="Phone" type="tel" required error={errors.owner_phone?.message} {...register('owner_phone')} />
              <Input label="Password" type="password" required hint="6–20 characters" error={errors.password?.message} {...register('password')} />
              <Input label="Confirm password" type="password" required error={errors.confirm_password?.message} {...register('confirm_password')} />
            </div>
          )}

          {/* Step 2 — Business */}
          {step === 1 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Business name" required error={errors.business_name?.message} {...register('business_name')} />
              <Input label="Venue name" required error={errors.venue_name?.message} {...register('venue_name')} />
              <Select
                label="Category"
                required
                placeholder="Select a category"
                options={VENUE_CATEGORIES.map((c) => ({ value: c, label: c }))}
                error={errors.venue_type?.message}
                {...register('venue_type')}
              />
              <Input label="GST / Tax number" hint="Optional" error={errors.gst_number?.message} {...register('gst_number')} />
              <div className="sm:col-span-2">
                <Input label="Trade license" hint="Optional" error={errors.trade_license?.message} {...register('trade_license')} />
              </div>
            </div>
          )}

          {/* Step 3 — Venue info */}
          {step === 2 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input label="Address line 1" required error={errors.addressline_1?.message} {...register('addressline_1')} />
              </div>
              <div className="sm:col-span-2">
                <Input label="Address line 2" hint="Optional" error={errors.addressline_2?.message} {...register('addressline_2')} />
              </div>
              <Input label="City" required error={errors.city?.message} {...register('city')} />
              <Input label="District" required error={errors.district?.message} {...register('district')} />
              <Input label="State" required error={errors.state?.message} {...register('state')} />
              <Input label="Country code" required error={errors.country_code?.message} {...register('country_code')} />
              <Input label="Postal code" required error={errors.postal_code?.message} {...register('postal_code')} />
              <Input label="Capacity" type="number" min={1} required error={errors.seating_capacity?.message} {...register('seating_capacity')} />
              <div className="sm:col-span-2">
                <Input label="Google Maps URL" hint="Optional" error={errors.google_maps_url?.message} {...register('google_maps_url')} />
              </div>
              <div className="sm:col-span-2">
                <Textarea label="Description" rows={3} hint="Tell customers what makes your venue special" error={errors.description?.message} {...register('description')} />
              </div>
            </div>
          )}

          {/* Step 4 — Amenities */}
          {step === 3 && (
            <div>
              <p className="mb-4 text-sm text-slate-500">Select all amenities your venue offers.</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {AMENITIES.map((a) => (
                  <label
                    key={a}
                    className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 px-3 py-2.5 text-sm hover:border-brand-300"
                  >
                    <Checkbox checked={!!amenities[a]} onChange={() => toggleAmenity(a)} label={a} />
                  </label>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-400">
                Note: only “AC” maps to the backend today; other amenities are captured for future use.
              </p>
            </div>
          )}

          {/* Step 5 — Media */}
          {step === 4 && (
            <div>
              <p className="mb-4 text-sm text-slate-500">
                Upload at least 3 photos of your venue. The first image is used as your cover.
              </p>
              <MediaUploader files={files} onChange={setFiles} minFiles={3} />
              <p className="mt-3 text-xs text-slate-400">
                Logo, banner and videos aren’t stored separately by the backend yet — add them to the
                gallery for now.
              </p>
            </div>
          )}

          {/* Step 6 — Review */}
          {step === 5 && (
            <div className="space-y-5">
              <ReviewGroup title="Owner" rows={[['Name', v.full_name], ['Email', v.owner_email], ['Phone', v.owner_phone]]} />
              <ReviewGroup title="Business" rows={[['Business', v.business_name], ['Venue', v.venue_name], ['Category', v.venue_type], ['GST', v.gst_number || '—']]} />
              <ReviewGroup
                title="Venue"
                rows={[
                  ['Address', `${v.addressline_1}${v.addressline_2 ? ', ' + v.addressline_2 : ''}`],
                  ['Location', `${v.city}, ${v.district}, ${v.state} ${v.postal_code}`],
                  ['Capacity', `${v.seating_capacity} guests`],
                ]}
              />
              <ReviewGroup
                title="Amenities"
                rows={[['Selected', AMENITIES.filter((a) => amenities[a]).join(', ') || '—']]}
              />
              <ReviewGroup title="Media" rows={[['Photos', `${files.length} uploaded`]]} />
              <p className="text-xs text-slate-400">
                By submitting, you agree to BookMyVenue’s partner terms. Your listing will be reviewed
                before going live.
              </p>
            </div>
          )}

          {/* Nav */}
          <div className="mt-8 flex items-center justify-between">
            <Button variant="ghost" onClick={back} disabled={step === 0 || submitting} leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back
            </Button>
            {step < STEP_LABELS.length - 1 ? (
              <Button onClick={next} rightIcon={<ArrowRight className="h-4 w-4" />}>
                Continue
              </Button>
            ) : (
              <Button onClick={onSubmit} isLoading={submitting} leftIcon={<Building2 className="h-4 w-4" />}>
                Submit venue
              </Button>
            )}
          </div>
        </Card>
      </div>
    </section>
  );
}

function ReviewGroup({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="rounded-xl border border-slate-100 p-4">
      <div className="mb-2 flex items-center gap-1.5">
        <Check className="h-4 w-4 text-emerald-500" />
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      </div>
      <dl className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {rows.map(([k, val]) => (
          <div key={k} className="flex gap-2 text-sm">
            <dt className="text-slate-500">{k}:</dt>
            <dd className="font-medium text-slate-800">{val}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
