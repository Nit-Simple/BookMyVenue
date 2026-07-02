import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, Mail, Phone } from 'lucide-react';
import { AuthLayout, GoogleButton } from './components/AuthLayout';
import { Button, Input } from '@/components/ui';
import { useAuth } from './useAuth';
import {
  emailLoginSchema,
  otpSchema,
  phoneSchema,
  type EmailLoginValues,
  type OtpValues,
  type PhoneValues,
} from './schemas';
import { useToast } from '@/app/store/uiStore';
import { cn } from '@/utils/cn';

type Method = 'email' | 'phone';

export function LoginPage() {
  const [method, setMethod] = useState<Method>('email');

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to manage bookings and pick up where you left off."
      footer={
        <>
          New to BookMyVenue?{' '}
          <Link to="/register" className="font-semibold text-brand-700 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
        {(['email', 'phone'] as Method[]).map((m) => (
          <button
            key={m}
            onClick={() => setMethod(m)}
            className={cn(
              'rounded-lg py-2 text-sm font-medium transition-colors',
              method === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500',
            )}
          >
            {m === 'email' ? 'Email' : 'Phone'}
          </button>
        ))}
      </div>

      {method === 'email' ? <EmailLogin /> : <PhoneLogin />}

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-medium text-slate-400">OR</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>
      <GoogleLoginButton />
    </AuthLayout>
  );
}

function EmailLogin() {
  const { loginMutation } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailLoginValues>({
    resolver: zodResolver(emailLoginSchema),
    defaultValues: { email: 'demo@bookmyvenue.app', password: 'password123' },
  });

  return (
    <form onSubmit={handleSubmit((v) => loginMutation.mutate(v))} className="space-y-4">
      <Input
        label="Email address"
        type="email"
        autoComplete="email"
        leftIcon={<Mail className="h-4 w-4" />}
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register('email')}
      />
      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        leftIcon={<Lock className="h-4 w-4" />}
        placeholder="••••••••"
        error={errors.password?.message}
        {...register('password')}
      />
      <div className="flex justify-end">
        <button type="button" className="text-sm font-medium text-brand-700 hover:underline">
          Forgot password?
        </button>
      </div>
      <Button type="submit" fullWidth size="lg" isLoading={loginMutation.isPending}>
        Log in
      </Button>
      <p className="text-center text-xs text-slate-400">
        Demo: any email + 6+ char password works.
      </p>
    </form>
  );
}

function PhoneLogin() {
  const { sendOtpMutation, verifyOtpMutation } = useAuth();
  const toast = useToast();
  const [phone, setPhone] = useState('');
  const [stage, setStage] = useState<'phone' | 'otp'>('phone');

  const phoneForm = useForm<PhoneValues>({ resolver: zodResolver(phoneSchema) });
  const otpForm = useForm<OtpValues>({ resolver: zodResolver(otpSchema) });

  const requestOtp = phoneForm.handleSubmit((v) => {
    setPhone(v.phone);
    sendOtpMutation.mutate(v.phone, {
      onSuccess: (res) => {
        setStage('otp');
        toast({
          variant: 'info',
          title: 'OTP sent',
          description: `Use code ${res.devOtp} for this demo.`,
        });
      },
    });
  });

  const verify = otpForm.handleSubmit((v) => verifyOtpMutation.mutate({ phone, otp: v.otp }));

  if (stage === 'otp') {
    return (
      <form onSubmit={verify} className="space-y-4">
        <p className="text-sm text-slate-600">
          Enter the 6-digit code sent to <span className="font-semibold">{phone}</span>.
        </p>
        <Input
          label="Verification code"
          inputMode="numeric"
          maxLength={6}
          placeholder="123456"
          className="text-center text-lg tracking-[0.5em]"
          error={otpForm.formState.errors.otp?.message}
          {...otpForm.register('otp')}
        />
        <Button type="submit" fullWidth size="lg" isLoading={verifyOtpMutation.isPending}>
          Verify & continue
        </Button>
        <button
          type="button"
          onClick={() => setStage('phone')}
          className="w-full text-center text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          Change phone number
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={requestOtp} className="space-y-4">
      <Input
        label="Phone number"
        type="tel"
        autoComplete="tel"
        leftIcon={<Phone className="h-4 w-4" />}
        placeholder="+91 98765 43210"
        error={phoneForm.formState.errors.phone?.message}
        {...phoneForm.register('phone')}
      />
      <Button type="submit" fullWidth size="lg" isLoading={sendOtpMutation.isPending}>
        Send OTP
      </Button>
    </form>
  );
}

function GoogleLoginButton() {
  const { googleMutation } = useAuth();
  return <GoogleButton onClick={() => googleMutation.mutate()} isLoading={googleMutation.isPending} />;
}
