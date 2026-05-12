'use client';

import { useMemo, useState } from 'react';
import { Plus, Package, ShoppingBag } from 'lucide-react';
import { trpc } from '@/trpc/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { formatBRL, formatDate } from '@/lib/format';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_DOTS,
  nextStatuses,
} from '@/domain/orders/statusMachine';
import { OrderCreateDialog } from '@/components/orders/OrderCreateDialog';
import type { OrderStatus } from '@/db/schema';
import { cn } from '@/lib/utils';

const FILTERS: { label: string; value: OrderStatus | 'ALL' }[] = [
  { label: 'Todas', value: 'ALL' },
  { label: 'Aguardando', value: 'PENDING' },
  { label: 'Confirmadas', value: 'CONFIRMED' },
  { label: 'Em produção', value: 'IN_PRODUCTION' },
  { label: 'Prontas', value: 'READY' },
  { label: 'Entregues', value: 'DELIVERED' },
];

export default function EncomendasPage() {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<OrderStatus | 'ALL'>('ALL');

  const list = trpc.order.list.useQuery();
  const utils = trpc.useUtils();
  const updateStatus = trpc.order.updateStatus.useMutation({
    onSuccess: () => {
      utils.order.list.invalidate();
      utils.dashboard.invalidate();
    },
  });

  const filtered = useMemo(() => {
    if (!list.data) return [];
    if (filter === 'ALL') return list.data;
    return list.data.filter((o) => o.status === filter);
  }, [list.data, filter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { ALL: list.data?.length ?? 0 };
    list.data?.forEach((o) => {
      c[o.status] = (c[o.status] ?? 0) + 1;
    });
    return c;
  }, [list.data]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Encomendas"
        description="Acompanhe o status dos pedidos da confirmação à entrega."
      >
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Nova encomenda
        </Button>
      </PageHeader>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = filter === f.value;
          const count = counts[f.value];
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-all',
                active
                  ? 'border-primary bg-primary text-primary-foreground shadow-soft'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-cocoa-900',
              )}
            >
              {f.label}
              {count !== undefined && count > 0 && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                    active
                      ? 'bg-white/20 text-white'
                      : 'bg-secondary text-muted-foreground',
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-0">
          {list.isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={list.data?.length ? Package : ShoppingBag}
              title={
                list.data?.length
                  ? 'Nenhuma encomenda nesse filtro'
                  : 'Comece criando sua primeira encomenda'
              }
              description={
                list.data?.length
                  ? 'Tente outro status ou crie uma nova encomenda.'
                  : 'Toda encomenda registrada aqui entra automaticamente no seu calendário de produção.'
              }
              action={
                <Button onClick={() => setOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Nova encomenda
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-border/60">
              {filtered.map((o) => {
                const remaining = o.totalCents - o.paidCents;
                const isPaid = remaining <= 0;
                return (
                  <li
                    key={o.id}
                    className="group flex flex-col gap-4 p-5 transition-colors hover:bg-secondary/30 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-primary-soft text-primary">
                        <span className="text-[10px] font-semibold uppercase leading-none">
                          {new Date(o.deliveryDate)
                            .toLocaleDateString('pt-BR', { month: 'short' })
                            .replace('.', '')}
                        </span>
                        <span className="font-display text-xl font-semibold leading-none">
                          {new Date(o.deliveryDate).getDate()}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-medium text-cocoa-900">{o.customer.name}</h3>
                          <Badge className={STATUS_COLORS[o.status]}>
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${STATUS_DOTS[o.status]}`}
                            />
                            {STATUS_LABELS[o.status]}
                          </Badge>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                          <span>Entrega {formatDate(o.deliveryDate)}</span>
                          <span className="text-border">•</span>
                          <span>Total {formatBRL(o.totalCents)}</span>
                          <span className="text-border">•</span>
                          <span
                            className={cn(
                              isPaid ? 'text-emerald-700' : 'text-amber-700',
                            )}
                          >
                            {isPaid ? 'Pago' : `Falta ${formatBRL(remaining)}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
                      {nextStatuses(o.status).map((next) => (
                        <Button
                          key={next}
                          size="sm"
                          variant={next === 'CANCELLED' ? 'outline' : 'default'}
                          disabled={updateStatus.isPending}
                          onClick={() => updateStatus.mutate({ id: o.id, status: next })}
                        >
                          {actionLabel(next)}
                        </Button>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <OrderCreateDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

function actionLabel(status: OrderStatus): string {
  switch (status) {
    case 'CONFIRMED':
      return 'Confirmar';
    case 'IN_PRODUCTION':
      return 'Iniciar produção';
    case 'READY':
      return 'Marcar pronto';
    case 'DELIVERED':
      return 'Entregar';
    case 'CANCELLED':
      return 'Cancelar';
    default:
      return status;
  }
}
