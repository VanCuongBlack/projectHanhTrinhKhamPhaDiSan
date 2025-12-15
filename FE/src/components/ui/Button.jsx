import { cn } from '../../lib/cn';

const base =
  'inline-flex items-center justify-center gap-2 font-semibold rounded-md transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

const variants = {
  primary:
    'bg-gradient-to-br from-primary to-primary-hover text-white shadow-md px-4 py-2.5 hover:shadow-lg hover:-translate-y-0.5 focus-visible:ring-primary',
  ghost:
    'bg-white text-text border border-slate-200 px-4 py-2.5 hover:-translate-y-0.5 hover:shadow-sm focus-visible:ring-primary',
  soft:
    'bg-slate-100 text-text px-4 py-2.5 hover:-translate-y-0.5 hover:shadow-sm focus-visible:ring-primary',
};

const sizes = {
  sm: 'text-sm px-3 py-2',
  md: '',
  lg: 'text-lg px-5 py-3',
};

const Button = ({ variant = 'primary', size = 'md', className, ...props }) => {
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />;
};

export default Button;
