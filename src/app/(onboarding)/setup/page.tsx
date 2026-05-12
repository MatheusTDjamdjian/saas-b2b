'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Cherry, Sparkles } from 'lucide-react';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SetupPage() {
  const router = useRouter();
  const create = trpc.tenant.create.useMutation();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await create.mutateAsync({ name });
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar empresa');
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-hero px-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="mb-10 flex items-center justify-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-soft">
            <Cherry className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-display text-xl font-semibold tracking-tight text-cocoa-900">
            ConfeitaPro
          </span>
        </div>

        <div className="rounded-3xl border border-border/60 bg-card p-8 shadow-elevated sm:p-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Etapa 1 de 1 — quase lá!
          </div>

          <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-cocoa-900">
            Como vamos chamar
            <br />
            sua confeitaria?
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Esse nome aparece nas suas notas e no painel. Pode ser um nome
            informal, igual ao que você usa no Instagram.
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da confeitaria</Label>
              <Input
                id="name"
                placeholder="Ex.: Doces da Maria"
                value={name}
                onChange={(e) => setName(e.target.value)}
                minLength={2}
                autoFocus
                required
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={create.isPending || name.length < 2}
            >
              {create.isPending ? 'Configurando...' : 'Entrar no painel'}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Você pode mudar isso depois nas configurações.
        </p>
      </div>
    </div>
  );
}
