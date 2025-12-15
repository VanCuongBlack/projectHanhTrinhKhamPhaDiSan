import { cn } from '../../lib/cn';

const Skeleton = ({ className }) => (
  <div className={cn('animate-pulse bg-slate-200 rounded-md', className)} />
);

export default Skeleton;
