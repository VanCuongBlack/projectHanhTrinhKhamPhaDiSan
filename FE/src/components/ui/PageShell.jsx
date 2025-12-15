import { cn } from '../../lib/cn';

const PageShell = ({ children, className, ...props }) => {
  return (
    <section
      className={cn('w-full flex flex-col gap-4', className)}
      {...props}
    >
      {children}
    </section>
  );
};

export default PageShell;
