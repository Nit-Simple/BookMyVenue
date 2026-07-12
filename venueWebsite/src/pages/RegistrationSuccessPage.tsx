import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, LayoutDashboard } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import { VENUE_PORTAL_URL } from '@/constants/nav';

export default function RegistrationSuccessPage() {
  return (
    <section className="container-app flex flex-col items-center py-20 text-center">
      <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
        <CheckCircle2 className="h-8 w-8" />
      </span>
      <h1 className="font-display text-3xl font-extrabold text-slate-900">
        Your venue has been submitted!
      </h1>
      <p className="mt-3 max-w-xl text-slate-600">
        Thanks for registering with BookMyVenue. Your listing has been submitted successfully and is
        now pending approval.
      </p>

      <Card className="mt-8 flex max-w-md items-center gap-3 p-4 text-left">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <Clock className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-900">Status: Pending Approval</p>
          <p className="text-sm text-slate-500">
            Our team will verify your details before your venue goes live. This usually takes 1–2
            business days.
          </p>
        </div>
      </Card>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a href={`${VENUE_PORTAL_URL}/dashboard`}>
          <Button leftIcon={<LayoutDashboard className="h-4 w-4" />}>Go to venue dashboard</Button>
        </a>
        <Link to="/">
          <Button variant="outline">Back to home</Button>
        </Link>
      </div>
    </section>
  );
}
