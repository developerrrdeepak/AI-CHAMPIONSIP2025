
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type PageHeaderProps = {
  title: string | ReactNode;
  description?: string | ReactNode;
  children?: ReactNode;
  className?: string;
};

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6", className)}>
      <div className="grid gap-1">
        {typeof title === 'string' ? <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">{title}</h1> : title}
        {description && (
          typeof description === 'string' ? <p className="text-sm text-muted-foreground">{description}</p> : description
        )}
      </div>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </div>
  );
}
