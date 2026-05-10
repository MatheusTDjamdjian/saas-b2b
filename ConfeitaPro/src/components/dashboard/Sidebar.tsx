'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  ChefHat,
  Beaker,
  Settings,
  LogOut,
  Cherry,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/encomendas', label: 'Encomendas', icon: ShoppingBag },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/receitas', label: 'Receitas', icon: ChefHat },
  { href: '/ingredientes', label: 'Ingredientes', icon: Beaker },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
];

export function Sidebar({
  tenantName,
  user,
}: {
  tenantName: string;
  user: { name: string; email: string; image: string | null };
}) {
  const pathname = usePathname();
  const profileActive = pathname === '/perfil' || pathname.startsWith('/perfil/');

  // Inicial preferindo nome de usuário; fallback pro nome da loja
  const initial =
    (user.name || user.email || tenantName).trim().slice(0, 1).toUpperCase() || 'C';

  return (
    <aside className="sticky top-0 flex h-screen w-64 flex-col border-r border-border/60 bg-card/80 backdrop-blur-xl">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-soft">
          <Cherry className="h-5 w-5 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <div className="font-display text-lg font-semibold leading-none tracking-tight text-cocoa-900">
            ConfeitaPro
          </div>
          <div className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">
            Gestão profissional
          </div>
        </div>
      </div>

      {/* Profile + tenant info — agora clicável → /perfil */}
      <Link
        href="/perfil"
        aria-label="Abrir meu perfil"
        title="Editar perfil, foto e senha"
        className={cn(
          'group mx-3 mb-4 flex items-center gap-3 rounded-xl p-3 transition-all',
          profileActive
            ? 'bg-primary-soft ring-1 ring-primary/20'
            : 'bg-secondary/60 hover:bg-secondary hover:shadow-soft',
        )}
      >
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt={user.name}
            className="h-10 w-10 flex-shrink-0 rounded-lg object-cover shadow-soft ring-1 ring-border/60"
          />
        ) : (
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-primary font-display text-base font-semibold text-primary-foreground shadow-soft">
            {initial}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              'truncate text-sm font-medium',
              profileActive ? 'text-primary' : 'text-cocoa-900',
            )}
          >
            {tenantName}
          </div>
          <div className="truncate text-xs text-muted-foreground">Plano Gratuito</div>
        </div>
        <ChevronRight
          className={cn(
            'h-4 w-4 flex-shrink-0 transition-transform',
            profileActive
              ? 'text-primary'
              : 'text-muted-foreground/60 group-hover:translate-x-0.5 group-hover:text-cocoa-700',
          )}
        />
      </Link>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                active
                  ? 'bg-primary-soft text-primary'
                  : 'text-muted-foreground hover:bg-secondary/60 hover:text-cocoa-900',
              )}
            >
              {active && (
                <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-gradient-primary" />
              )}
              <Icon
                className={cn(
                  'h-[18px] w-[18px] transition-transform',
                  active ? 'text-primary' : 'group-hover:scale-110',
                )}
                strokeWidth={active ? 2.5 : 2}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Sair */}
      <div className="border-t border-border/60 p-3">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-cocoa-900"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Sair
        </button>
      </div>
    </aside>
  );
}
