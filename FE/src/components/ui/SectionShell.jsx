import { cn } from '../../lib/cn';

const SectionShell = ({ className, children, ...props }) => (
  <section className={cn('w-full flex flex-col gap-4', className)} {...props}>
    {children}
  </section>
);

export default SectionShell;
