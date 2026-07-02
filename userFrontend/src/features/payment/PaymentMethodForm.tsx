import { CreditCard, Smartphone, Wallet } from 'lucide-react';
import { Input } from '@/components/ui';
import { cn } from '@/utils/cn';
import type { PaymentMethod } from '@/types';

export interface PaymentDetails {
  method: PaymentMethod;
  card: { number: string; name: string; expiry: string; cvv: string };
  upiId: string;
  wallet: string;
}

export const emptyPaymentDetails: PaymentDetails = {
  method: 'card',
  card: { number: '', name: '', expiry: '', cvv: '' },
  upiId: '',
  wallet: 'paytm',
};

const methods: { id: PaymentMethod; label: string; icon: typeof CreditCard }[] = [
  { id: 'card', label: 'Card', icon: CreditCard },
  { id: 'upi', label: 'UPI', icon: Smartphone },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
];

const WALLETS = [
  { value: 'paytm', label: 'Paytm' },
  { value: 'phonepe', label: 'PhonePe' },
  { value: 'amazonpay', label: 'Amazon Pay' },
  { value: 'mobikwik', label: 'Mobikwik' },
];

/** Validates the currently selected payment method's fields. */
export function isPaymentValid(d: PaymentDetails): boolean {
  if (d.method === 'card') {
    const digits = d.card.number.replace(/\s/g, '');
    return (
      digits.length >= 15 &&
      d.card.name.trim().length > 1 &&
      /^\d{2}\/\d{2}$/.test(d.card.expiry) &&
      /^\d{3}$/.test(d.card.cvv)
    );
  }
  if (d.method === 'upi') return /^[\w.-]+@[\w.-]+$/.test(d.upiId);
  return !!d.wallet;
}

function formatCardNumber(value: string): string {
  return value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim();
}

export function PaymentMethodForm({
  value,
  onChange,
}: {
  value: PaymentDetails;
  onChange: (d: PaymentDetails) => void;
}) {
  const set = (patch: Partial<PaymentDetails>) => onChange({ ...value, ...patch });
  const setCard = (patch: Partial<PaymentDetails['card']>) =>
    onChange({ ...value, card: { ...value.card, ...patch } });

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {methods.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => set({ method: m.id })}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-xl border p-3 text-sm font-medium transition-colors',
              value.method === m.id
                ? 'border-brand-500 bg-brand-50/60 text-brand-700 ring-1 ring-brand-500'
                : 'border-slate-200 text-slate-600 hover:border-slate-300',
            )}
          >
            <m.icon className="h-5 w-5" />
            {m.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {value.method === 'card' && (
          <div className="space-y-3">
            <Input
              label="Card number"
              inputMode="numeric"
              placeholder="4242 4242 4242 4242"
              value={value.card.number}
              onChange={(e) => setCard({ number: formatCardNumber(e.target.value) })}
            />
            <Input
              label="Cardholder name"
              placeholder="Name on card"
              value={value.card.name}
              onChange={(e) => setCard({ name: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Expiry (MM/YY)"
                placeholder="12/27"
                maxLength={5}
                value={value.card.expiry}
                onChange={(e) => {
                  let v = e.target.value.replace(/\D/g, '').slice(0, 4);
                  if (v.length >= 3) v = `${v.slice(0, 2)}/${v.slice(2)}`;
                  setCard({ expiry: v });
                }}
              />
              <Input
                label="CVV"
                inputMode="numeric"
                type="password"
                placeholder="123"
                maxLength={3}
                value={value.card.cvv}
                onChange={(e) => setCard({ cvv: e.target.value.replace(/\D/g, '').slice(0, 3) })}
              />
            </div>
          </div>
        )}

        {value.method === 'upi' && (
          <Input
            label="UPI ID"
            placeholder="yourname@bank"
            hint="Enter your UPI ID — e.g. 9876543210@upi"
            value={value.upiId}
            onChange={(e) => set({ upiId: e.target.value })}
          />
        )}

        {value.method === 'wallet' && (
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">Choose a wallet</p>
            <div className="grid grid-cols-2 gap-2">
              {WALLETS.map((w) => (
                <button
                  key={w.value}
                  type="button"
                  onClick={() => set({ wallet: w.value })}
                  className={cn(
                    'rounded-xl border p-3 text-sm font-medium transition-colors',
                    value.wallet === w.value
                      ? 'border-brand-500 bg-brand-50/60 text-brand-700 ring-1 ring-brand-500'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300',
                  )}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
