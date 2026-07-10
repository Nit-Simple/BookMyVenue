import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, Lock, Phone, Building2 } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { Logo } from '@/components/common/Logo';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/api/axios';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  phone: z.string().min(8, 'Enter a valid phone number'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(20, 'Password must be at most 20 characters'),
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

type Mode = 'login' | 'register';

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('login');
  const { login, register: registerUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', phone: '', password: '' },
  });

  if (isAuthenticated) {
    return <Navigate to={from ?? '/dashboard'} replace />;
  }

  const onLogin = async (values: LoginValues) => {
    try {
      await login(values);
      toast.success('Welcome back!');
      navigate(from ?? '/dashboard', { replace: true });
    } catch (err) {
      const message = getErrorMessage(err, 'Login failed. Check your credentials.');
      toast.error(message);
      loginForm.setError('password', { message });
    }
  };

  const onRegister = async (values: RegisterValues) => {
    try {
      await registerUser(values);
      toast.success('Account created. Welcome to BookMyVenue!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Registration failed.'));
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-brand-800 p-12 text-white lg:flex">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'url(https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1400&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="relative">
          <Logo className="[&_span]:text-white" />
        </div>
        <div className="relative space-y-4">
          <h1 className="font-display text-4xl font-extrabold leading-tight">
            Manage your venue, <br /> grow your bookings.
          </h1>
          <p className="max-w-md text-brand-100">
            Track bookings, revenue and refunds, manage availability, and keep your listing
            up to date — all from one dashboard.
          </p>
        </div>
        <div className="relative flex items-center gap-2 text-sm text-brand-100">
          <Building2 className="h-4 w-4" />
          Trusted by venue partners across India
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          <h2 className="font-display text-2xl font-bold text-slate-900">
            {mode === 'login' ? 'Sign in to your portal' : 'Create your venue account'}
          </h2>
          <p className="mt-1.5 text-sm text-slate-500">
            {mode === 'login'
              ? 'Enter your credentials to access your dashboard.'
              : 'Register as a venue manager to list and manage your venue.'}
          </p>

          {mode === 'login' ? (
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="mt-8 space-y-4" noValidate>
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="you@venue.com"
                leftIcon={<Mail className="h-4 w-4" />}
                error={loginForm.formState.errors.email?.message}
                {...loginForm.register('email')}
              />
              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                leftIcon={<Lock className="h-4 w-4" />}
                error={loginForm.formState.errors.password?.message}
                {...loginForm.register('password')}
              />
              <Button type="submit" fullWidth isLoading={loginForm.formState.isSubmitting}>
                Sign in
              </Button>
            </form>
          ) : (
            <form
              onSubmit={registerForm.handleSubmit(onRegister)}
              className="mt-8 space-y-4"
              noValidate
            >
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="you@venue.com"
                leftIcon={<Mail className="h-4 w-4" />}
                error={registerForm.formState.errors.email?.message}
                {...registerForm.register('email')}
              />
              <Input
                label="Phone"
                type="tel"
                autoComplete="tel"
                placeholder="+91 98765 43210"
                leftIcon={<Phone className="h-4 w-4" />}
                error={registerForm.formState.errors.phone?.message}
                {...registerForm.register('phone')}
              />
              <Input
                label="Password"
                type="password"
                autoComplete="new-password"
                placeholder="6–20 characters"
                leftIcon={<Lock className="h-4 w-4" />}
                error={registerForm.formState.errors.password?.message}
                {...registerForm.register('password')}
              />
              <Button type="submit" fullWidth isLoading={registerForm.formState.isSubmitting}>
                Create account
              </Button>
            </form>
          )}

          {/*
            TODO(backend): Phone-OTP and OAuth (Google) login are NOT supported by
            the backend (email/password only). Buttons are intentionally omitted.
          */}

          <p className="mt-6 text-center text-sm text-slate-500">
            {mode === 'login' ? "Don't have an account?" : 'Already registered?'}{' '}
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="font-semibold text-brand-700 hover:text-brand-800"
            >
              {mode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </p>

          <p className="mt-8 text-center text-xs text-slate-400">
            Looking to book a venue?{' '}
            <Link to="http://localhost:5173" className="underline">
              Go to the customer app
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
