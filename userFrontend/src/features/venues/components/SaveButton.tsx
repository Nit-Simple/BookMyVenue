import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSavedVenues, useToggleSaved } from '@/features/profile/queries';
import { useAuthStore } from '@/app/store/authStore';
import { useUiStore, useToast } from '@/app/store/uiStore';
import { cn } from '@/utils/cn';

export function SaveButton({
  venueId,
  className,
}: {
  venueId: string;
  className?: string;
}) {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setAuthRedirect = useUiStore((s) => s.setAuthRedirect);
  const toast = useToast();
  const { data: saved } = useSavedVenues();
  const toggle = useToggleSaved();

  const isSaved = saved?.some((v) => v.id === venueId) ?? false;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast({ variant: 'info', title: 'Sign in to save venues' });
      setAuthRedirect(window.location.pathname);
      navigate('/login');
      return;
    }
    toggle.mutate(venueId);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isSaved ? 'Remove from saved' : 'Save venue'}
      aria-pressed={isSaved}
      className={cn(
        'focus-ring flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm backdrop-blur transition-transform hover:scale-105 active:scale-95',
        className,
      )}
    >
      <Heart
        className={cn('h-[18px] w-[18px]', isSaved && 'fill-red-500 text-red-500')}
      />
    </button>
  );
}
