import * as React from 'react';

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1.5">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-cocoa-900">
          {title}
        </h1>
        {description && (
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      {children && <div className="flex flex-shrink-0 items-center gap-2">{children}</div>}
    </div>
  );
}
