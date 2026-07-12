import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui';

export function CTASection() {
  return (
    <section className="bg-brand-800">
      <div className="container-app flex flex-col items-center gap-6 py-16 text-center">
        <h2 className="font-display text-3xl font-extrabold text-white sm:text-4xl">
          Ready to fill your calendar?
        </h2>
        <p className="max-w-xl text-brand-100">
          Join BookMyVenue today and start receiving booking requests from customers near you.
          Listing is quick and free to get started.
        </p>
        <Link to="/register">
          <Button size="lg" variant="secondary" rightIcon={<ArrowRight className="h-4 w-4" />}>
            List your venue
          </Button>
        </Link>
      </div>
    </section>
  );
}
