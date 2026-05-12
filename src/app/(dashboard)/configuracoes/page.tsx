import { Check, Sparkles, Lock } from 'lucide-react';
import { getServerCaller } from '@/trpc/server';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

const PLAN_DETAILS = {
  FREE: {
    name: 'Gratuito',
    price: 'R$ 0',
    pricePeriod: '',
    description: 'Para começar a organizar.',
    features: ['Até 10 pedidos por mês', '1 usuário', 'Receitas e clientes ilimitados'],
    popular: false,
  },
  PRO: {
    name: 'Profissional',
    price: 'R$ 79',
    pricePeriod: '/mês',
    description: 'Para quem leva confeitaria a sério.',
    features: [
      'Pedidos ilimitados',
      'Até 3 usuários',
      'Cálculo automático de custo',
      'Relatórios mensais',
      'Calendário de produção',
    ],
    popular: true,
  },
  BUSINESS: {
    name: 'Negócio',
    price: 'R$ 149',
    pricePeriod: '/mês',
    description: 'Para confeitarias em crescimento.',
    features: [
      'Tudo do Profissional',
      'Usuários ilimitados',
      'Suporte prioritário',
      'Integração com WhatsApp',
      'API e exportação',
    ],
    popular: false,
  },
} as const;

export default async function ConfiguracoesPage() {
  const caller = await getServerCaller();
  const tenant = await caller.tenant.current();

  const currentPlan = tenant.plan;
  const trialEndsAt = tenant.trialEndsAt;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Configurações"
        description="Veja seu plano atual e conheça os planos pagos que estamos preparando."
      />

      {/* Plano atual */}
      <Card className="overflow-hidden">
        <div className="relative bg-gradient-to-br from-primary-soft via-cream-50 to-background p-6 sm:p-8">
          <div className="absolute inset-0 bg-dots opacity-30" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Plano atual
                </span>
                <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-700/10">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Ativo
                </Badge>
              </div>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-cocoa-900">
                {PLAN_DETAILS[currentPlan].name}
              </h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                {trialEndsAt && new Date(trialEndsAt) > new Date() ? (
                  <>
                    Seu período de teste vai até{' '}
                    <strong className="text-cocoa-900">{formatDate(trialEndsAt)}</strong>.
                  </>
                ) : (
                  'Aproveite ConfeitaPro sem custo. Em breve liberaremos os planos pagos.'
                )}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Aviso de planos em breve */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
        <div className="flex items-start gap-3">
          <Lock className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <div>
            <strong>Pagamentos serão liberados em breve.</strong> Por enquanto, todos os recursos
            estão disponíveis no plano gratuito enquanto a gente prepara o checkout. Os planos
            abaixo são uma prévia do que está vindo.
          </div>
        </div>
      </div>

      {/* Pricing visual */}
      <div>
        <div className="mb-6">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-cocoa-900">
            Conheça os planos
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Estamos finalizando os pagamentos. Os preços abaixo são uma prévia.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {(['FREE', 'PRO', 'BUSINESS'] as const).map((plan) => {
            const isCurrent = plan === currentPlan;
            const details = PLAN_DETAILS[plan];
            const isPopular = details.popular;

            return (
              <div key={plan} className="relative">
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-primary px-3 py-1 text-xs font-semibold text-white shadow-soft">
                      <Sparkles className="h-3 w-3" />
                      Mais escolhido
                    </span>
                  </div>
                )}
                <Card
                  className={cn(
                    'relative flex h-full flex-col p-6 transition-all',
                    isPopular && 'border-primary/40 shadow-lift',
                    isCurrent && 'ring-2 ring-primary',
                  )}
                >
                  <CardContent className="flex flex-1 flex-col p-0">
                    <div>
                      <h3 className="font-display text-xl font-semibold tracking-tight text-cocoa-900">
                        {details.name}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {details.description}
                      </p>
                    </div>

                    <div className="mt-5 flex items-baseline gap-1">
                      <span className="font-display text-4xl font-semibold tracking-tight text-cocoa-900">
                        {details.price}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {details.pricePeriod}
                      </span>
                    </div>

                    <ul className="mt-6 flex-1 space-y-3">
                      {details.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm">
                          <span
                            className={cn(
                              'mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full',
                              isPopular ? 'bg-primary text-white' : 'bg-primary-soft text-primary',
                            )}
                          >
                            <Check className="h-3 w-3" strokeWidth={3} />
                          </span>
                          <span className="leading-relaxed text-cocoa-700">{f}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-7">
                      {isCurrent ? (
                        <Button variant="outline" disabled className="w-full">
                          Plano atual
                        </Button>
                      ) : plan === 'FREE' ? (
                        <Button variant="outline" disabled className="w-full">
                          Você está no gratuito
                        </Button>
                      ) : (
                        <Button
                          className="w-full"
                          variant="outline"
                          disabled
                          title="Pagamentos serão liberados em breve"
                        >
                          <Lock className="h-3.5 w-3.5" />
                          Em breve
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Sem fidelidade · Cancelamento em 1 clique · Suporte em português
        </p>
      </div>
    </div>
  );
}
