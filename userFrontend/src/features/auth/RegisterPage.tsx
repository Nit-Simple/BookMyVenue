import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Mail, Phone, User as UserIcon } from 'lucide-react';
import { AuthLayout, GoogleButton } from './components/AuthLayout';
import { Button, Input } from '@/components/ui';
import { useAuth } from './useAuth';
import { registerSchema, type RegisterValues } from './schemas';

export function RegisterPage() {
  const { registerMutation, googleMutation } = useAuth();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { acceptTerms: false as unknown as true },
  });

  const accepted = watch('acceptTerms');

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Join thousands of customers booking their perfect venues."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form
        onSubmit={handleSubmit((v) =>
          registerMutation.mutate({
            name: v.name,
            email: v.email,
            phone: v.phone,
            password: v.password,
          }),
        )}
        className="space-y-4"
      >
        <Input
          label="Full name"
          leftIcon={<UserIcon className="h-4 w-4" />}
          placeholder="Ananya Sharma"
          error={errors.name?.message}
          {...register('name')}
        />
        <Input
          label="Email address"
          type="email"
          leftIcon={<Mail className="h-4 w-4" />}
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Phone number"
          type="tel"
          leftIcon={<Phone className="h-4 w-4" />}
          placeholder="+91 98765 43210"
          error={errors.phone?.message}
          {...register('phone')}
        />
        <Input
          label="Password"
          type="password"
          leftIcon={<Lock className="h-4 w-4" />}
          placeholder="At least 8 characters"
          hint="Use 8+ characters with an uppercase letter and a number."
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirm password"
          type="password"
          leftIcon={<Lock className="h-4 w-4" />}
          placeholder="Re-enter your password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <div>
          <label className="flex cursor-pointer items-start gap-2.5 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={!!accepted}
              onChange={(e) => setValue('acceptTerms', e.target.checked as true, { shouldValidate: true })}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span>
              I agree to the <span className="font-medium text-brand-700">Terms of Service</span> and{' '}
              <span className="font-medium text-brand-700">Privacy Policy</span>.
            </span>
          </label>
          {errors.acceptTerms && (
            <p className="mt-1.5 text-xs font-medium text-red-600">{errors.acceptTerms.message}</p>
          )}
        </div>

        <Button type="submit" fullWidth size="lg" isLoading={registerMutation.isPending}>
          Create account
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-medium text-slate-400">OR</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>
      <GoogleButton onClick={() => googleMutation.mutate()} isLoading={googleMutation.isPending} />
    </AuthLayout>
  );
}
