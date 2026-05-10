'use client';

import { useState } from 'react';
import { Plus, Trash2, ChefHat, X, TrendingUp } from 'lucide-react';
import { trpc } from '@/trpc/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { formatBRL, parseBRLToCents } from '@/lib/format';

const UNITS = ['g', 'kg', 'ml', 'l', 'un'] as const;

interface IngDraft {
  ingredientId: string;
  qty: number;
  unit: (typeof UNITS)[number];
}

const selectClass =
  'flex h-11 w-full rounded-lg border border-input bg-card px-3.5 text-sm shadow-inner-soft focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10';

export default function ReceitasPage() {
  const list = trpc.recipe.list.useQuery();
  const ingredients = trpc.ingredient.list.useQuery();
  const utils = trpc.useUtils();
  const create = trpc.recipe.create.useMutation({
    onSuccess: () => {
      utils.recipe.list.invalidate();
      reset();
    },
  });
  const del = trpc.recipe.delete.useMutation({
    onSuccess: () => utils.recipe.list.invalidate(),
  });

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [yieldQty, setYieldQty] = useState('1');
  const [yieldUnit, setYieldUnit] = useState<(typeof UNITS)[number]>('un');
  const [labor, setLabor] = useState('');
  const [fixed, setFixed] = useState('');
  const [margin, setMargin] = useState('50');
  const [items, setItems] = useState<IngDraft[]>([
    { ingredientId: '', qty: 0, unit: 'g' },
  ]);

  function reset() {
    setOpen(false);
    setName('');
    setYieldQty('1');
    setYieldUnit('un');
    setLabor('');
    setFixed('');
    setMargin('50');
    setItems([{ ingredientId: '', qty: 0, unit: 'g' }]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    await create.mutateAsync({
      name,
      yieldQty: Number(yieldQty),
      yieldUnit,
      laborCostCents: parseBRLToCents(labor),
      fixedCostCents: parseBRLToCents(fixed),
      marginPct: Number(margin),
      ingredients: items.filter((i) => i.ingredientId && i.qty > 0),
    });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Receitas"
        description="Cadastre uma vez. O sistema calcula automaticamente quanto cada porção custa pra você produzir e sugere o preço de venda."
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
              Nova receita
            </>
          )}
        </Button>
      </PageHeader>

      {open && (
        <Card className="animate-fade-in-up">
          <CardContent className="p-6">
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="r-name">Nome *</Label>
                  <Input
                    id="r-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex.: Brigadeiro gourmet"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="r-yield">Rendimento *</Label>
                  <Input
                    id="r-yield"
                    type="number"
                    min={1}
                    value={yieldQty}
                    onChange={(e) => setYieldQty(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="r-yield-unit">Unidade *</Label>
                  <select
                    id="r-yield-unit"
                    className={selectClass}
                    value={yieldUnit}
                    onChange={(e) => setYieldUnit(e.target.value as (typeof UNITS)[number])}
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-secondary/30 p-5">
                <div className="mb-3 flex items-center justify-between">
                  <Label>Ingredientes da receita</Label>
                  <span className="text-xs text-muted-foreground">
                    {items.filter((i) => i.ingredientId && i.qty > 0).length} adicionado(s)
                  </span>
                </div>
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex gap-2">
                      <select
                        className={selectClass + ' flex-1'}
                        value={item.ingredientId}
                        onChange={(e) => {
                          const next = [...items];
                          next[idx] = { ...next[idx], ingredientId: e.target.value };
                          setItems(next);
                        }}
                      >
                        <option value="">Selecione um ingrediente</option>
                        {ingredients.data?.map((ing) => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name}
                          </option>
                        ))}
                      </select>
                      <Input
                        type="number"
                        min={1}
                        className="w-24"
                        placeholder="Qtd"
                        value={item.qty || ''}
                        onChange={(e) => {
                          const next = [...items];
                          next[idx] = { ...next[idx], qty: Number(e.target.value) };
                          setItems(next);
                        }}
                      />
                      <select
                        className={selectClass + ' w-24'}
                        value={item.unit}
                        onChange={(e) => {
                          const next = [...items];
                          next[idx] = {
                            ...next[idx],
                            unit: e.target.value as (typeof UNITS)[number],
                          };
                          setItems(next);
                        }}
                      >
                        {UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                      {items.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setItems(items.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="soft"
                    size="sm"
                    onClick={() =>
                      setItems([...items, { ingredientId: '', qty: 0, unit: 'g' }])
                    }
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar ingrediente
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="r-labor">Custo de mão de obra</Label>
                  <Input
                    id="r-labor"
                    placeholder="R$ 0,00"
                    value={labor}
                    onChange={(e) => setLabor(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Sua hora vale dinheiro.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="r-fixed">Custos fixos</Label>
                  <Input
                    id="r-fixed"
                    placeholder="R$ 0,00"
                    value={fixed}
                    onChange={(e) => setFixed(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Gás, embalagem, energia, descartáveis...
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="r-margin">Margem desejada (%)</Label>
                  <Input
                    id="r-margin"
                    type="number"
                    value={margin}
                    onChange={(e) => setMargin(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Recomendado: 80–150% para confeitaria.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending ? 'Salvando...' : 'Salvar receita'}
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
              icon={ChefHat}
              title="Nenhuma receita cadastrada"
              description="Cadastre suas receitas e descubra de uma vez por todas se você está cobrando o preço certo."
              action={
                <Button onClick={() => setOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Cadastrar primeira receita
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.data.map((r) => (
            <RecipeCard key={r.id} id={r.id} onDelete={() => del.mutate({ id: r.id })} />
          ))}
        </div>
      )}
    </div>
  );
}

function RecipeCard({ id, onDelete }: { id: string; onDelete: () => void }) {
  const detail = trpc.recipe.get.useQuery({ id });

  if (!detail.data) {
    return (
      <Card className="p-6">
        <div className="space-y-3">
          <div className="h-4 w-2/3 animate-pulse rounded bg-secondary" />
          <div className="h-8 w-1/2 animate-pulse rounded bg-secondary" />
          <div className="h-3 w-full animate-pulse rounded bg-secondary" />
        </div>
      </Card>
    );
  }

  const r = detail.data;
  const marginRatio =
    r.cost.suggestedPriceCents > 0
      ? r.cost.marginCents / r.cost.suggestedPriceCents
      : 0;

  return (
    <Card className="group relative flex flex-col overflow-hidden p-6 transition-all hover:-translate-y-0.5 hover:shadow-lift">
      {/* Top accent */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-primary opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-lg font-semibold tracking-tight text-cocoa-900">
            {r.name}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Rende {r.yieldQty} {r.yieldUnit} · margem alvo {r.marginPct}%
          </p>
        </div>
        <button
          onClick={onDelete}
          className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
          aria-label="Excluir receita"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-5 space-y-1">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Preço sugerido por unidade
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-3xl font-semibold tracking-tight text-cocoa-900">
            {formatBRL(r.cost.suggestedPriceCents)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-700/10">
            <TrendingUp className="h-3 w-3" />
            {formatBRL(r.cost.marginCents)} de margem
          </span>
        </div>
      </div>

      {/* Cost breakdown */}
      <div className="mt-5 space-y-2 rounded-xl bg-secondary/40 p-4">
        <Row label="Custo unitário" value={formatBRL(r.cost.costPerYieldUnitCents)} />
        <Row label="Ingredientes" value={formatBRL(r.cost.ingredientsCostCents)} muted />
        <Row label="Mão de obra" value={formatBRL(r.laborCostCents)} muted />
        <Row label="Custos fixos" value={formatBRL(r.fixedCostCents)} muted />
      </div>

      {/* Margin bar */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Margem sobre venda</span>
          <span className="font-medium text-cocoa-900">
            {(marginRatio * 100).toFixed(0)}%
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-gradient-primary transition-all"
            style={{ width: `${Math.min(100, Math.max(0, marginRatio * 100))}%` }}
          />
        </div>
      </div>
    </Card>
  );
}

function Row({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={muted ? 'text-cocoa-700' : 'font-semibold text-cocoa-900'}>
        {value}
      </span>
    </div>
  );
}
