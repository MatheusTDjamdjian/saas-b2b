import Link from 'next/link';
import {
  CalendarDays,
  ShoppingBag,
  DollarSign,
  Clock,
  ArrowRight,
  Package,
} from 'lucide-react';
import { getServerCaller } from '@/trpc/server';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatBRL, formatDate } from '@/lib/format';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_DOTS,
} from '@/domain/orders/statusMachine';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
};

export default async function DashboardPage() {
  const caller = await getServerCaller();
  const [metrics, upcoming, current] = await Promise.all([
    caller.dashboard.metrics(),
    caller.dashboard.upcomingOrders(),
    caller.tenant.current(),
  ]);

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title={`${greeting()}, ${current.name.split(' ')[0]}`}
        description={`Hoje é ${today}. Aqui está o panorama do seu negócio.`}
      >
        <Button asChild>
          <Link href="/encomendas">
            Nova encomenda <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </PageHeader>

      {/* Métricas */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Encomendas hoje"
          value={String(metrics.ordersToday)}
          hint={metrics.ordersToday === 0 ? 'Dia tranquilo!' : 'Para entregar até o fim do dia'}
          icon={CalendarDays}
          tone="primary"
        />
        <MetricCard
          label="Próximos 7 dias"
          value={String(metrics.ordersNext7Days)}
          hint="Encomendas confirmadas"
          icon={ShoppingBag}
          tone="default"
        />
        <MetricCard
          label="Receita do mês"
          value={formatBRL(metrics.monthRevenueCents)}
          hint={`${formatBRL(metrics.monthPaidCents)} já recebido`}
          icon={DollarSign}
          tone="success"
        />
        <MetricCard
          label="A receber"
          value={formatBRL(metrics.pendingReceivableCents)}
          hint="De encomendas em aberto"
          icon={Clock}
          tone="warning"
        />
      </div>

      {/* Próximas entregas */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Próximas entregas</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {upcoming.length > 0
                ? `${upcoming.length} encomenda${upcoming.length > 1 ? 's' : ''} para os próximos dias`
                : 'Sem encomendas pendentes'}
            </p>
          </div>
          {upcoming.length > 0 && (
            <Button asChild variant="ghost" size="sm">
              <Link href="/encomendas">
                Ver todas <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-0">
          {upcoming.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Nenhuma encomenda agendada"
              description="Quando você cadastrar suas próximas encomendas, elas aparecem aqui em ordem de entrega."
              action={
                <Button asChild>
                  <Link href="/encomendas">Cadastrar encomenda</Link>
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-border/60">
              {upcoming.map((o) => {
                const remaining = o.totalCents - o.paidCents;
                return (
                  <li
                    key={o.id}
                    className="flex items-center justify-between gap-4 py-4 first:pt-2 last:pb-2"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-11 w-11 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-primary-soft text-primary">
                        <span className="text-[10px] font-semibold uppercase leading-none">
                          {new Date(o.deliveryDate)
                            .toLocaleDateString('pt-BR', { month: 'short' })
                            .replace('.', '')}
                        </span>
                        <span className="font-display text-lg font-semibold leading-none">
                          {new Date(o.deliveryDate).getDate()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-cocoa-900">{o.customer.name}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          Entrega em {formatDate(o.deliveryDate)}
                          {remaining > 0 && (
                            <span className="ml-2 text-amber-700">
                              · falta {formatBRL(remaining)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="hidden font-medium text-cocoa-900 sm:inline">
                        {formatBRL(o.totalCents)}
                      </span>
                      <Badge className={STATUS_COLORS[o.status]}>
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${STATUS_DOTS[o.status]}`}
                        />
                        {STATUS_LABELS[o.status]}
                      </Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
