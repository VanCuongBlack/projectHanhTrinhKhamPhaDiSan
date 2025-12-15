import { cn } from '../../lib/cn';

const InputField = ({ label, hint, error, className, inputClassName, ...props }) => {
  return (
    <label className={cn('flex flex-col gap-2 text-sm font-semibold text-text', className)}>
      {label}
      <input
        className={cn(
          'w-full px-3 py-2 rounded-md border border-slate-200 bg-white transition focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30',
          error && 'border-error focus:ring-error/30',
          inputClassName
        )}
        {...props}
      />
      {hint && !error && <span className="text-xs text-muted font-normal">{hint}</span>}
      {error && <span className="text-xs text-error font-normal">{error}</span>}
    </label>
  );
};

export default InputField;
