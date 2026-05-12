'use client';

import { useState } from 'react';
import { Plus, Trash2, Beaker, X } from 'lucide-react';
import { trpc } from '@/trpc/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { formatBRL, parseBRLToCents } from '@/lib/format';
import { cn } from '@/lib/utils';

const UNITS = ['g', 'kg', 'ml', 'l', 'un'] as const;

export default function IngredientesPage() {
  const list = trpc.ingredient.list.useQuery();
  const utils = trpc.useUtils();
  const create = trpc.ingredient.create.useMutation({
    onSuccess: () => {
      utils.ingredient.list.invalidate();
      reset();
    },
  });
  const del = trpc.ingredient.delete.useMutation({
    onSuccess: () => utils.ingredient.list.invalidate(),
  });

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState<(typeof UNITS)[number]>('kg');
  const [packageQty, setPackageQty] = useState('');
  const [packageCost, setPackageCost] = useState('');

  function reset() {
    setName('');
    setUnit('kg');
    setPackageQty('');
    setPackageCost('');
    setOpen(false);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await create.mutateAsync({
      name,
      unit,
      packageQty: Number(packageQty),
      packageCostCents: parseBRLToCents(packageCost),
    });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Ingredientes"
        description="Atualize aqui sempre que o preço dos seus insumos mudar — o cálculo de custo das receitas atualiza automaticamente."
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
              Novo ingrediente
            </>
          )}
        </Button>
      </PageHeader>

      {open && (
        <Card className="animate-fade-in-up">
          <CardContent className="p-6">
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="i-name">Nome do ingrediente *</Label>
                  <Input
                    id="i-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex.: Farinha de trigo"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="i-unit">Unidade *</Label>
                  <select
                    id="i-unit"
                    className="flex h-11 w-full rounded-lg border border-input bg-card px-3.5 text-sm shadow-inner-soft focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as (typeof UNITS)[number])}
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="i-qty">Qtd. da embalagem *</Label>
                  <Input
                    id="i-qty"
                    type="number"
                    min={1}
                    value={packageQty}
                    onChange={(e) => setPackageQty(e.target.value)}
                    placeholder="1000"
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="i-cost">Quanto custa essa embalagem? *</Label>
                  <Input
                    id="i-cost"
                    value={packageCost}
                    onChange={(e) => setPackageCost(e.target.value)}
                    placeholder="R$ 8,90"
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-muted-foreground">Custo unitário calculado</Label>
                  <div className="flex h-11 items-center rounded-lg bg-secondary px-3.5 text-sm">
                    {packageQty && packageCost ? (
                      <>
                        <span className="font-display font-semibold text-cocoa-900">
                          {formatBRL(parseBRLToCents(packageCost) / Number(packageQty || 1))}
                        </span>
                        <span className="ml-1.5 text-muted-foreground">por {unit}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">
                        Preencha quantidade e preço
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending ? 'Salvando...' : 'Salvar ingrediente'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {list.isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : !list.data?.length ? (
            <EmptyState
              icon={Beaker}
              title="Nenhum ingrediente cadastrado"
              description="Comece cadastrando os ingredientes que você usa com mais frequência. Você só precisa fazer isso uma vez."
              action={
                <Button onClick={() => setOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Cadastrar primeiro ingrediente
                </Button>
              }
            />
          ) : (
            <div className="overflow-hidden">
              <div className="hidden border-b border-border/60 bg-secondary/40 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:grid sm:grid-cols-12 sm:gap-4">
                <div className="sm:col-span-4">Ingrediente</div>
                <div className="sm:col-span-3">Embalagem</div>
                <div className="sm:col-span-2">Custo embalagem</div>
                <div className="sm:col-span-2">Por unidade</div>
                <div className="sm:col-span-1" />
              </div>
              <ul className="divide-y divide-border/60">
                {list.data.map((i, idx) => {
                  const perUnit = i.packageCostCents / i.packageQty;
                  return (
                    <li
                      key={i.id}
                      className={cn(
                        'group grid gap-2 px-6 py-4 transition-colors hover:bg-secondary/30 sm:grid-cols-12 sm:items-center sm:gap-4',
                      )}
                    >
                      <div className="flex items-center gap-3 sm:col-span-4">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-soft font-semibold text-primary">
                          {(idx + 1).toString().padStart(2, '0')}
                        </div>
                        <span className="font-medium text-cocoa-900">{i.name}</span>
                      </div>
                      <div className="text-sm text-muted-foreground sm:col-span-3">
                        <span className="font-medium text-cocoa-900">{i.packageQty}</span> {i.unit}
                      </div>
                      <div className="text-sm sm:col-span-2">{formatBRL(i.packageCostCents)}</div>
                      <div className="text-sm sm:col-span-2">
                        <span className="font-medium text-cocoa-900">{formatBRL(perUnit)}</span>
                        <span className="ml-1 text-xs text-muted-foreground">/ {i.unit}</span>
                      </div>
                      <div className="flex justify-end sm:col-span-1">
                        <button
                          onClick={() => del.mutate({ id: i.id })}
                          disabled={del.isPending}
                          className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                          aria-label="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
