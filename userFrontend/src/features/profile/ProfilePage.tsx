import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Heart, KeyRound, Mail, Phone, Settings2, User as UserIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Avatar, Button, Card, Checkbox, EmptyState, Input, Select, Skeleton } from '@/components/ui';
import { VenueCard } from '@/features/venues/components/VenueCard';
import { useChangePassword, useSavedVenues, useUpdateProfile } from './queries';
import { useAuthStore } from '@/app/store/authStore';
import { CATEGORIES, CITIES } from '@/utils/constants';
import { cn } from '@/utils/cn';
import type { EventCategory } from '@/types';

type Section = 'account' | 'preferences' | 'security' | 'saved';

const nav: { id: Section; label: string; icon: typeof UserIcon }[] = [
  { id: 'account', label: 'Account', icon: UserIcon },
  { id: 'preferences', label: 'Preferences', icon: Settings2 },
  { id: 'security', label: 'Security', icon: KeyRound },
  { id: 'saved', label: 'Saved Venues', icon: Heart },
];

export function ProfilePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [section, setSection] = useState<Section>(
    location.pathname.endsWith('/saved') ? 'saved' : 'account',
  );

  useEffect(() => {
    setSection(location.pathname.endsWith('/saved') ? 'saved' : 'account');
  }, [location.pathname]);

  if (!user) return null;

  const changeSection = (s: Section) => {
    setSection(s);
    navigate(s === 'saved' ? '/profile/saved' : '/profile', { replace: true });
  };

  return (
    <div className="container-app py-6 lg:py-10">
      <div className="mb-6 flex items-center gap-4">
        <Avatar src={user.avatarUrl} name={user.name} size={64} />
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">{user.name}</h1>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Sidebar nav */}
        <aside>
          <nav className="no-scrollbar flex gap-2 overflow-x-auto lg:flex-col">
            {nav.map((item) => (
              <button
                key={item.id}
                onClick={() => changeSection(item.id)}
                className={cn(
                  'flex shrink-0 items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
                  section === item.id
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-100',
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <div>
          {section === 'account' && <AccountSection />}
          {section === 'preferences' && <PreferencesSection />}
          {section === 'security' && <SecuritySection />}
          {section === 'saved' && <SavedSection />}
        </div>
      </div>
    </div>
  );
}

// --- Account ----------------------------------------------------------------
const accountSchema = z.object({
  name: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().regex(/^[0-9+\s-]{10,15}$/, 'Enter a valid phone number'),
});
type AccountValues = z.infer<typeof accountSchema>;

function AccountSection() {
  const user = useAuthStore((s) => s.user)!;
  const update = useUpdateProfile();
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<AccountValues>({
    resolver: zodResolver(accountSchema),
    values: { name: user.name, email: user.email, phone: user.phone },
  });

  return (
    <Card className="p-6">
      <h2 className="font-semibold text-slate-900">Personal information</h2>
      <p className="mt-0.5 text-sm text-slate-500">Update your contact details.</p>
      <form onSubmit={handleSubmit((v) => update.mutate(v))} className="mt-5 space-y-4">
        <Input label="Full name" leftIcon={<UserIcon className="h-4 w-4" />} error={errors.name?.message} {...register('name')} />
        <Input label="Email" type="email" leftIcon={<Mail className="h-4 w-4" />} error={errors.email?.message} {...register('email')} />
        <Input label="Phone" type="tel" leftIcon={<Phone className="h-4 w-4" />} error={errors.phone?.message} {...register('phone')} />
        <Button type="submit" isLoading={update.isPending} disabled={!isDirty}>
          Save changes
        </Button>
      </form>
    </Card>
  );
}

// --- Preferences ------------------------------------------------------------
function PreferencesSection() {
  const user = useAuthStore((s) => s.user)!;
  const update = useUpdateProfile();
  const [city, setCity] = useState(user.preferences.preferredCity);
  const [cats, setCats] = useState<EventCategory[]>(user.preferences.preferredCategories);
  const [newsletter, setNewsletter] = useState(user.preferences.newsletter);
  const [sms, setSms] = useState(user.preferences.smsAlerts);

  const toggleCat = (id: EventCategory) =>
    setCats((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));

  const save = () => {
    update.mutate({
      preferences: {
        preferredCity: city,
        preferredCategories: cats,
        newsletter,
        smsAlerts: sms,
        currency: 'INR',
      },
    });
  };

  return (
    <Card className="p-6">
      <h2 className="font-semibold text-slate-900">Preferences</h2>
      <p className="mt-0.5 text-sm text-slate-500">Personalise your recommendations and alerts.</p>
      <div className="mt-5 space-y-5">
        <Select
          label="Preferred city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          options={CITIES.map((c) => ({ value: c, label: c }))}
        />
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Favourite event types</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => toggleCat(c.id)}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-sm transition-colors',
                  cats.includes(c.id)
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300',
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-3 border-t border-slate-100 pt-4">
          <Checkbox checked={newsletter} onChange={setNewsletter} label="Email me offers and venue recommendations" />
          <Checkbox checked={sms} onChange={setSms} label="Send SMS alerts about my bookings" />
        </div>
        <Button onClick={save} isLoading={update.isPending}>
          Save preferences
        </Button>
      </div>
    </Card>
  );
}

// --- Security ---------------------------------------------------------------
const passwordSchema = z
  .object({
    currentPassword: z.string().min(6, 'Enter your current password'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Include an uppercase letter')
      .regex(/[0-9]/, 'Include a number'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
type PasswordValues = z.infer<typeof passwordSchema>;

function SecuritySection() {
  const change = useChangePassword();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) });

  return (
    <Card className="p-6">
      <h2 className="font-semibold text-slate-900">Change password</h2>
      <p className="mt-0.5 text-sm text-slate-500">Keep your account secure with a strong password.</p>
      <form
        onSubmit={handleSubmit((v) =>
          change.mutate(
            { currentPassword: v.currentPassword, newPassword: v.newPassword },
            { onSuccess: () => reset() },
          ),
        )}
        className="mt-5 max-w-md space-y-4"
      >
        <Input label="Current password" type="password" error={errors.currentPassword?.message} {...register('currentPassword')} />
        <Input label="New password" type="password" error={errors.newPassword?.message} {...register('newPassword')} />
        <Input label="Confirm new password" type="password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <Button type="submit" isLoading={change.isPending}>
          Update password
        </Button>
      </form>
    </Card>
  );
}

// --- Saved venues -----------------------------------------------------------
function SavedSection() {
  const navigate = useNavigate();
  const { data, isLoading } = useSavedVenues();

  if (isLoading) {
    return (
      <div className="grid gap-5 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-72 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="No saved venues yet"
        description="Tap the heart on any venue to save it here for easy comparison later."
        action={{ label: 'Explore venues', onClick: () => navigate('/venues') }}
      />
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {data.map((venue) => (
        <VenueCard key={venue.id} venue={venue} />
      ))}
    </div>
  );
}
