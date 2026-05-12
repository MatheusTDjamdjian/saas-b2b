import { Card } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tone = 'default' | 'primary' | 'success' | 'warning';

const toneClasses: Record<Tone, { bg: string; text: string }> = {
  default: { bg: 'bg-secondary', text: 'text-cocoa-700' },
  primary: { bg: 'bg-primary-soft', text: 'text-primary' },
  success: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
  warning: { bg: 'bg-amber-50', text: 'text-amber-700' },
};

export function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'default',
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  tone?: Tone;
}) {
  const t = toneClasses[tone];

  return (
    <Card className="group relative overflow-hidden p-6 transition-all hover:shadow-lift hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
          <div className="mt-2 font-display text-3xl font-semibold leading-none tracking-tight text-cocoa-900">
            {value}
          </div>
          {hint && <div className="mt-2 text-xs text-muted-foreground">{hint}</div>}
        </div>
        {Icon && (
          <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', t.bg)}>
            <Icon className={cn('h-5 w-5', t.text)} strokeWidth={2} />
          </div>
        )}
      </div>
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5 opacity-0 transition-opacity group-hover:opacity-100" />
    </Card>
  );
}
