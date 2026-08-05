import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Lock, Mail, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { Logo } from '@/components/common/Logo';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/api/axios';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
type Values = z.infer<typeof schema>;

export default function LoginPage() {
  const { login, isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { from?: { pathname: string }; error?: string } | null;
  const from = state?.from?.pathname;

  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  // Only admins are auto-redirected in. An authenticated NON-admin must NOT be
  // sent to /dashboard — ProtectedRoute would bounce them right back to /login,
  // creating an infinite redirect loop. They stay here and can sign out.
  if (isAuthenticated && user?.role === 'admin') {
    return <Navigate to={from ?? '/dashboard'} replace />;
  }
  const wrongAccount = isAuthenticated && user?.role !== 'admin';

  const onSubmit = async (values: Values) => {
    try {
      await login(values);
      toast.success('Welcome back!');
      navigate(from ?? '/dashboard', { replace: true });
    } catch (err) {
      const message = getErrorMessage(err, 'Login failed. Check your credentials.');
      toast.error(message);
      form.setError('password', { message });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo className="[&_span]:text-white" />
        </div>
        <div className="rounded-2xl bg-white p-8 shadow-elevated">
          <div className="mb-6 flex flex-col items-center text-center">
            <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <h1 className="font-display text-xl font-bold text-slate-900">Admin sign in</h1>
            <p className="mt-1 text-sm text-slate-500">
              Access the BookMyVenue administration console.
            </p>
          </div>

          {(state?.error === 'not-an-admin' || wrongAccount) && (
            <div className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
              <div className="flex items-start gap-2">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {user?.email ? `“${user.email}” is not an administrator. ` : 'That account is not an administrator. '}
                  Sign in with an admin account.
                </span>
              </div>
              {wrongAccount && (
                <button
                  type="button"
                  onClick={() => logout()}
                  className="mt-2 font-semibold underline hover:text-red-800"
                >
                  Sign out of the current account
                </button>
              )}
            </div>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="admin@bookmyvenue.com"
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
              <Link to="/forgot-password" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                Forgot password?
              </Link>
            </div>
            <Button type="submit" fullWidth isLoading={form.formState.isSubmitting}>
              Sign in
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          This portal is restricted to authorized BookMyVenue employees.
        </p>
      </div>
    </div>
  );
}
