import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  Cherry,
  Calculator,
  Calendar,
  Wallet,
  Users,
  ArrowRight,
  Sparkles,
  Check,
} from 'lucide-react';
import { auth } from '@/lib/auth';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: Calculator,
    title: 'Custo real, não chute',
    description:
      'Cadastre suas receitas e o sistema calcula sozinho o custo unitário e o preço de venda sugerido.',
  },
  {
    icon: Calendar,
    title: 'Calendário de entregas',
    description:
      'Veja num piscar quais encomendas vencem hoje, amanhã e na semana — adeus planilha do Excel.',
  },
  {
    icon: Wallet,
    title: 'Sinal e quitação',
    description:
      'Controle quem pagou, quem deve, e quanto falta. Sem precisar lembrar de cabeça.',
  },
  {
    icon: Users,
    title: 'Cadastro de clientes',
    description:
      'Histórico completo de quem comprou, quanto comprou, e o que pediu da última vez.',
  },
];

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Nav */}
      <header className="container flex items-center justify-between py-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-soft">
            <Cherry className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight text-cocoa-900">
            ConfeitaPro
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link href="/login">Entrar</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Começar grátis</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="container relative pb-20 pt-12 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-soft">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            14 dias grátis · sem cartão de crédito
          </div>

          <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-cocoa-900 sm:text-6xl">
            Pare de perder dinheiro <br />
            <span className="text-gradient-primary">a cada encomenda.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            ConfeitaPro é a primeira plataforma feita para confeiteiras
            de encomenda — calcula o custo real, organiza pedidos e mostra,
            de uma vez por todas, quanto você está ganhando de verdade.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="xl" className="w-full sm:w-auto">
              <Link href="/register">
                Começar grátis por 14 dias <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline" className="w-full sm:w-auto">
              <Link href="/login">Já tenho conta</Link>
            </Button>
          </div>

          <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            {['Cancelamento a qualquer momento', 'Suporte em português', 'Dados protegidos'].map(
              (item) => (
                <li key={item} className="inline-flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-primary" />
                  {item}
                </li>
              ),
            )}
          </ul>
        </div>

        {/* Visual demo card */}
        <div className="mx-auto mt-20 max-w-4xl">
          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-primary opacity-10 blur-2xl" />
            <div className="overflow-hidden rounded-3xl border border-border/60 bg-card shadow-elevated">
              <div className="border-b border-border/60 bg-secondary/40 px-6 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-300" />
                  <div className="h-3 w-3 rounded-full bg-amber-300" />
                  <div className="h-3 w-3 rounded-full bg-emerald-300" />
                  <div className="ml-3 text-xs text-muted-foreground">
                    confeitapro.app/dashboard
                  </div>
                </div>
              </div>
              <div className="grid gap-4 p-8 sm:grid-cols-3">
                {[
                  { label: 'Encomendas hoje', value: '7', tone: 'primary' },
                  { label: 'Receita do mês', value: 'R$ 8.420', tone: 'success' },
                  { label: 'A receber', value: 'R$ 1.840', tone: 'warning' },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="rounded-2xl border border-border/60 bg-background p-5 shadow-soft"
                  >
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {m.label}
                    </div>
                    <div className="mt-2 font-display text-3xl font-semibold tracking-tight text-cocoa-900">
                      {m.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-20">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-primary">
            Tudo que falta na sua planilha
          </div>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-cocoa-900">
            Feito para quem leva confeitaria a sério
          </h2>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-2">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group rounded-2xl border border-border/60 bg-card p-7 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft transition-transform group-hover:scale-105">
                  <Icon className="h-5 w-5 text-primary" strokeWidth={2} />
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold tracking-tight text-cocoa-900">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA final */}
      <section className="container pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-primary p-10 text-center shadow-elevated sm:p-16">
          <div className="absolute inset-0 bg-dots opacity-20" />
          <div className="relative">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Sua confeitaria merece organização profissional.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-base text-white/90">
              Comece hoje, leve menos de 5 minutos para configurar.
            </p>
            <div className="mt-8">
              <Button
                asChild
                size="xl"
                className="bg-white text-primary shadow-lift hover:bg-cream-50 hover:text-primary"
              >
                <Link href="/register">
                  Criar conta grátis <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container border-t border-border/60 py-8">
        <div className="flex flex-col items-center justify-between gap-3 text-xs text-muted-foreground sm:flex-row">
          <div>© {new Date().getFullYear()} ConfeitaPro. Feito com carinho no Brasil.</div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-foreground">
              Entrar
            </Link>
            <Link href="/register" className="hover:text-foreground">
              Criar conta
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
