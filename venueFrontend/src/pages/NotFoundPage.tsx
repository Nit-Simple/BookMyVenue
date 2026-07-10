import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-6 text-center">
      <p className="font-display text-6xl font-extrabold text-brand-700">404</p>
      <h1 className="text-xl font-bold text-slate-900">Page not found</h1>
      <p className="max-w-sm text-sm text-slate-500">
        The page you’re looking for doesn’t exist or has been moved.
      </p>
      <Link to="/dashboard">
        <Button>Back to dashboard</Button>
      </Link>
    </div>
  );
}
