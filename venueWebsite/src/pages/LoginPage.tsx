import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { Logo } from '@/components/common/Logo';
import { authApi } from '@/api/auth';
import { getErrorMessage } from '@/api/axios';
import { VENUE_PORTAL_URL } from '@/constants/nav';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type Values = z.infer<typeof schema>;

export default function LoginPage() {
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  const onSubmit = async (values: Values) => {
    try {
      const tokens = await authApi.login(values);
      // Hand the session off to the venue portal (separate app) by writing its
      // namespaced tokens, then redirect there.
      localStorage.setItem('bmv_venue_access_token', tokens.access_token);
      localStorage.setItem('bmv_venue_refresh_token', tokens.refresh_token);
      localStorage.setItem('bmv_venue_email', values.email);
      toast.success('Signed in — taking you to your dashboard…');
      window.location.href = `${VENUE_PORTAL_URL}/dashboard`;
    } catch (err) {
      const message = getErrorMessage(err, 'Login failed. Check your credentials.');
      toast.error(message);
      form.setError('password', { message });
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-brand-800 p-12 text-white lg:flex">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1400&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <Link to="/" className="relative">
          <Logo className="[&_span]:text-white" />
        </Link>
        <div className="relative space-y-4">
          <h1 className="font-display text-4xl font-extrabold leading-tight">Welcome back, partner.</h1>
          <p className="max-w-md text-brand-100">
            Sign in to manage your venue, bookings and revenue in the venue portal.
          </p>
        </div>
        <div className="relative text-sm text-brand-100">BookMyVenue for Partners</div>
      </div>

      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link to="/">
              <Logo />
            </Link>
          </div>
          <h2 className="font-display text-2xl font-bold text-slate-900">Venue login</h2>
          <p className="mt-1.5 text-sm text-slate-500">Access your venue management dashboard.</p>

          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@venue.com"
              leftIcon={<Mail className="h-4 w-4" />}
              error={form.formState.errors.email?.message}
              {...form.register('email')}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              leftIcon={<Lock className="h-4 w-4" />}
              error={form.formState.errors.password?.message}
              {...form.register('password')}
            />
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm font-medium text-brand-700 hover:text-brand-800">
                Forgot password?
              </Link>
            </div>
            <Button type="submit" fullWidth isLoading={form.formState.isSubmitting} rightIcon={<ArrowRight className="h-4 w-4" />}>
              Sign in
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            New here?{' '}
            <Link to="/register" className="font-semibold text-brand-700 hover:text-brand-800">
              List your venue
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
