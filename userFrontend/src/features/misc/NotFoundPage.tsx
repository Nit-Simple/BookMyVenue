import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui';

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="container-app flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="font-display text-7xl font-extrabold text-brand-700">404</span>
      <h1 className="mt-4 font-display text-2xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-2 max-w-md text-slate-500">
        The page you’re looking for doesn’t exist or may have moved. Let’s get you back on track.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={() => navigate('/')}>Back to home</Button>
        <Button variant="outline" leftIcon={<Compass className="h-4 w-4" />} onClick={() => navigate('/venues')}>
          Explore venues
        </Button>
      </div>
    </div>
  );
}
