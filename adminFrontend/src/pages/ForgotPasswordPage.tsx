import { Link } from 'react-router-dom';
import { ArrowLeft, MailQuestion } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { Button } from '@/components/ui';

/**
 * Placeholder — TODO(backend): no forgot-password endpoint exists. Admins reset
 * credentials out-of-band for now.
 */
export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo className="[&_span]:text-white" />
        </div>
        <div className="rounded-2xl bg-white p-8 text-center shadow-elevated">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
            <MailQuestion className="h-6 w-6" />
          </span>
          <h1 className="font-display text-xl font-bold text-slate-900">Password reset</h1>
          <p className="mt-2 text-sm text-slate-500">
            Self-service password reset isn’t available yet. Please contact your system
            administrator to reset your credentials.
          </p>
          <Link to="/login" className="mt-6 inline-block">
            <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Back to sign in
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
