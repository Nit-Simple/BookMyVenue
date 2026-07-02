import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui';
import { formatCurrency } from '@/utils/format';

export type PaymentPhase = 'idle' | 'processing' | 'success' | 'failed';

export function PaymentProcessing({
  phase,
  amount,
  errorMessage,
  onRetry,
  onClose,
}: {
  phase: PaymentPhase;
  amount: number;
  errorMessage?: string;
  onRetry?: () => void;
  onClose?: () => void;
}) {
  const visible = phase !== 'idle';
  return createPortal(
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-elevated"
          >
            {phase === 'processing' && (
              <>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-50">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
                </div>
                <h3 className="mt-5 font-display text-lg font-bold text-slate-900">
                  Processing payment
                </h3>
                <p className="mt-1.5 text-sm text-slate-500">
                  Securely charging {formatCurrency(amount)}. Please don’t close this window.
                </p>
                <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <motion.div
                    className="h-full bg-brand-600"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                  />
                </div>
              </>
            )}

            {phase === 'success' && (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 12 }}
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50"
                >
                  <CheckCircle2 className="h-9 w-9 text-emerald-600" />
                </motion.div>
                <h3 className="mt-5 font-display text-lg font-bold text-slate-900">
                  Payment successful
                </h3>
                <p className="mt-1.5 text-sm text-slate-500">
                  {formatCurrency(amount)} paid. Finalising your booking…
                </p>
              </>
            )}

            {phase === 'failed' && (
              <>
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                  <XCircle className="h-9 w-9 text-red-600" />
                </div>
                <h3 className="mt-5 font-display text-lg font-bold text-slate-900">
                  Payment failed
                </h3>
                <p className="mt-1.5 text-sm text-slate-500">
                  {errorMessage ?? 'Your payment could not be processed.'}
                </p>
                <div className="mt-6 flex gap-2">
                  <Button variant="outline" fullWidth onClick={onClose}>
                    Cancel
                  </Button>
                  <Button fullWidth onClick={onRetry}>
                    Try again
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
