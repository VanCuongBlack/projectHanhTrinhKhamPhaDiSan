import { cn } from '../../lib/cn';

const variantClass = {
  default: 'bg-slate-100 text-text',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  error: 'bg-red-100 text-red-700',
  info: 'bg-sky-100 text-sky-700',
};

const Badge = ({ children, variant = 'default', className }) => (
  <span className={cn('px-2 py-1 rounded-md text-xs font-semibold', variantClass[variant], className)}>
    {children}
  </span>
);

export default Badge;
