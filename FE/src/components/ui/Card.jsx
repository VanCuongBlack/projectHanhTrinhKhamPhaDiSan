import { cn } from '../../lib/cn';

const Card = ({ className, children, ...props }) => (
  <div
    className={cn(
      'bg-white rounded-lg border border-slate-100 shadow-md p-4',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export default Card;
