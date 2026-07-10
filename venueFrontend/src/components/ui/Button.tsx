import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'subtle';
type Size = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900 shadow-sm disabled:bg-brand-700/60',
  secondary:
    'bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-700 shadow-sm disabled:opacity-60',
  outline:
    'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-60',
  ghost: 'text-slate-700 hover:bg-slate-100 active:bg-slate-200 disabled:opacity-50',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm disabled:opacity-60',
  subtle: 'bg-brand-50 text-brand-700 hover:bg-brand-100 active:bg-brand-200 disabled:opacity-60',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-sm gap-1.5 rounded-lg',
  md: 'h-11 px-5 text-sm gap-2 rounded-xl',
  lg: 'h-13 px-7 text-base gap-2.5 rounded-xl py-3.5',
  icon: 'h-10 w-10 rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    fullWidth,
    children,
    disabled,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        'focus-ring inline-flex select-none items-center justify-center font-semibold transition-all duration-150 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
});
