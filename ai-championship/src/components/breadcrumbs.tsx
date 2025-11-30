'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Fragment } from 'react';
import { ChevronRight } from 'lucide-react';

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ');

  return (
    <div className="hidden items-center gap-2 text-sm font-medium md:flex">
      {segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join('/')}`;
        const isLast = index === segments.length - 1;

        return (
          <Fragment key={href}>
            <Link
              href={isLast ? '#' : href}
              className={`${
                isLast
                  ? 'pointer-events-none text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {capitalize(segment)}
            </Link>
            {!isLast && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </Fragment>
        );
      })}
    </div>
  );
}
