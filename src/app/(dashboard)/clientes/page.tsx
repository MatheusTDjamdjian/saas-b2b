'use client';

import { useState } from 'react';
import { Plus, Trash2, Users, Mail, Phone, X } from 'lucide-react';
import { trpc } from '@/trpc/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { EmptyState } from '@/components/dashboard/EmptyState';

const AVATAR_GRADIENTS = [
  'from-rose-400 to-pink-500',
  'from-amber-400 to-orange-500',
  'from-violet-400 to-purple-500',
  'from-sky-400 to-blue-500',
  'from-emerald-400 to-teal-500',
  'from-fuchsia-400 to-rose-500',
];

function getGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

export default function ClientesPage() {
  const list = trpc.customer.list.useQuery();
  const utils = trpc.useUtils();
  const create = trpc.customer.create.useMutation({
    onSuccess: () => {
      utils.customer.list.invalidate();
      reset();
    },
  });
  const del = trpc.customer.delete.useMutation({
    onSuccess: () => utils.customer.list.invalidate(),
  });

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  function reset() {
    setName('');
    setPhone('');
    setEmail('');
    setOpen(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await create.mutateAsync({ name, phone: phone || undefined, email: email || undefined });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Clientes"
        description="Mantenha o cadastro de quem comanda suas encomendas."
      >
        <Button onClick={() => setOpen(!open)} variant={open ? 'outline' : 'default'}>
          {open ? (
            <>
              <X className="h-4 w-4" />
              Cancelar
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Novo cliente
            </>
          )}
        </Button>
      </PageHeader>

      {open && (
        <Card className="animate-fade-in-up">
          <CardContent className="p-6">
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="c-name">Nome *</Label>
                  <Input
                    id="c-name"
                    placeholder="Maria Silva"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-phone">Telefone</Label>
                  <Input
                    id="c-phone"
                    placeholder="(11) 99999-9999"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-email">Email</Label>
                  <Input
                    id="c-email"
                    type="email"
                    placeholder="maria@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending ? 'Salvando...' : 'Salvar cliente'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {list.isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </CardContent>
        </Card>
      ) : !list.data?.length ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={Users}
              title="Você ainda não tem clientes"
              description="Cadastre seus clientes para criar encomendas mais rápido e ter histórico de pedidos."
              action={
                <Button onClick={() => setOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Cadastrar primeiro cliente
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.data.map((c) => {
            const initial = c.name.trim().slice(0, 1).toUpperCase();
            const gradient = getGradient(c.name);
            return (
              <Card
                key={c.id}
                className="group relative overflow-hidden p-5 transition-all hover:-translate-y-0.5 hover:shadow-lift"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} font-display text-lg font-semibold text-white shadow-soft`}
                  >
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-cocoa-900">{c.name}</div>
                    <div className="mt-1.5 space-y-1">
                      {c.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {c.phone}
                        </div>
                      )}
                      {c.email && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{c.email}</span>
                        </div>
                      )}
                      {!c.phone && !c.email && (
                        <div className="text-xs text-muted-foreground/70">Sem contato</div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => del.mutate({ id: c.id })}
                    disabled={del.isPending}
                    className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    aria-label="Excluir cliente"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
