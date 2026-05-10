import Link from 'next/link';
import { Cherry, Quote } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Marca lateral */}
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-primary p-12 text-white lg:flex">
        <div className="absolute inset-0 bg-dots opacity-15" />
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-white/5 blur-3xl" />

        <Link href="/" className="relative flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <Cherry className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">ConfeitaPro</span>
        </Link>

        <div className="relative max-w-md">
          <Quote className="h-10 w-10 text-white/40" strokeWidth={2} />
          <p className="mt-5 font-display text-2xl font-medium leading-snug">
            Em uma semana de uso eu descobri que estava cobrando barato em
            <span className="text-cream-100"> 7 das minhas receitas</span>. Me paguei o ano todo só
            ajustando os preços.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 font-display text-lg font-semibold">
              J
            </div>
            <div>
              <div className="font-medium">Juliana M.</div>
              <div className="text-sm text-white/70">Doces da Ju · São Paulo</div>
            </div>
          </div>
        </div>

        <div className="relative text-xs text-white/60">
          © {new Date().getFullYear()} ConfeitaPro. Todos os direitos reservados.
        </div>
      </aside>

      {/* Form */}
      <main className="flex items-center justify-center bg-background p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-soft">
                <Cherry className="h-5 w-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-display text-lg font-semibold tracking-tight text-cocoa-900">
                ConfeitaPro
              </span>
            </Link>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
