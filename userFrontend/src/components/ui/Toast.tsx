import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useUiStore, type ToastVariant } from '@/app/store/uiStore';
import { cn } from '@/utils/cn';

const config: Record<
  ToastVariant,
  { icon: React.ReactNode; ring: string; iconColor: string }
> = {
  success: {
    icon: <CheckCircle2 className="h-5 w-5" />,
    ring: 'ring-emerald-200',
    iconColor: 'text-emerald-600',
  },
  error: {
    icon: <AlertCircle className="h-5 w-5" />,
    ring: 'ring-red-200',
    iconColor: 'text-red-600',
  },
  warning: {
    icon: <AlertTriangle className="h-5 w-5" />,
    ring: 'ring-amber-200',
    iconColor: 'text-amber-600',
  },
  info: {
    icon: <Info className="h-5 w-5" />,
    ring: 'ring-sky-200',
    iconColor: 'text-sky-600',
  },
};

export function ToastViewport() {
  const toasts = useUiStore((s) => s.toasts);
  const dismiss = useUiStore((s) => s.dismissToast);

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6">
      <AnimatePresence>
        {toasts.map((t) => {
          const c = config[t.variant];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ type: 'spring', damping: 24, stiffness: 320 }}
              className={cn(
                'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl bg-white p-4 shadow-elevated ring-1',
                c.ring,
              )}
            >
              <span className={cn('mt-0.5 shrink-0', c.iconColor)}>{c.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{t.title}</p>
                {t.description && (
                  <p className="mt-0.5 text-sm text-slate-500">{t.description}</p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                className="-mr-1 -mt-1 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>,
    document.body,
  );
}
