'use client';

import { useMemo, useState } from 'react';
import { Trash2, Plus, X, AlertCircle, ShoppingBag } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatBRL, parseBRLToCents } from '@/lib/format';

interface ItemDraft {
  recipeId: string;
  qty: number;
  unitPriceBRL: string;
}

const selectClass =
  'flex h-11 w-full rounded-lg border border-input bg-card px-3.5 text-sm shadow-inner-soft transition-colors hover:border-border focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10';

export function OrderCreateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const utils = trpc.useUtils();
  const customers = trpc.customer.list.useQuery();
  const recipes = trpc.recipe.list.useQuery();
  const create = trpc.order.create.useMutation({
    onSuccess: () => {
      utils.order.list.invalidate();
      utils.dashboard.invalidate();
      onOpenChange(false);
      reset();
    },
  });

  const [customerId, setCustomerId] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ItemDraft[]>([{ recipeId: '', qty: 1, unitPriceBRL: '' }]);
  const [error, setError] = useState<string | null>(null);

  const total = useMemo(
    () =>
      items.reduce(
        (sum, i) => sum + (i.qty || 0) * parseBRLToCents(i.unitPriceBRL),
        0,
      ),
    [items],
  );

  function reset() {
    setCustomerId('');
    setDeliveryDate('');
    setNotes('');
    setItems([{ recipeId: '', qty: 1, unitPriceBRL: '' }]);
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await create.mutateAsync({
        customerId,
        deliveryDate,
        notes: notes || undefined,
        items: items.map((i) => ({
          recipeId: i.recipeId,
          qty: i.qty,
          unitPriceCents: parseBRLToCents(i.unitPriceBRL),
        })),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar encomenda');
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-cocoa-900/40 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-card shadow-elevated data-[state=open]:animate-fade-in-up">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-border/60 bg-gradient-to-br from-primary-soft/50 to-cream-50 p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary shadow-soft">
                <ShoppingBag className="h-5 w-5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <Dialog.Title className="font-display text-xl font-semibold tracking-tight text-cocoa-900">
                  Nova encomenda
                </Dialog.Title>
                <Dialog.Description className="mt-0.5 text-sm text-muted-foreground">
                  Cliente, data de entrega e o que vai ser produzido.
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-cocoa-900">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <form onSubmit={onSubmit} className="max-h-[70vh] overflow-y-auto">
            <div className="space-y-5 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="o-customer">Cliente *</Label>
                  <select
                    id="o-customer"
                    className={selectClass}
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    required
                  >
                    <option value="">Selecione um cliente</option>
                    {customers.data?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="o-delivery">Data de entrega *</Label>
                  <Input
                    id="o-delivery"
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-secondary/30 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <Label>Itens da encomenda</Label>
                  <span className="text-xs text-muted-foreground">
                    {items.length} {items.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex gap-2">
                      <select
                        className={selectClass + ' flex-1'}
                        value={item.recipeId}
                        onChange={(e) => {
                          const next = [...items];
                          next[idx] = { ...next[idx], recipeId: e.target.value };
                          setItems(next);
                        }}
                        required
                      >
                        <option value="">Selecione uma receita</option>
                        {recipes.data?.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                      <Input
                        type="number"
                        min={1}
                        placeholder="Qtd"
                        className="w-20"
                        value={item.qty}
                        onChange={(e) => {
                          const next = [...items];
                          next[idx] = { ...next[idx], qty: Number(e.target.value) };
                          setItems(next);
                        }}
                        required
                      />
                      <Input
                        placeholder="R$ 0,00"
                        className="w-28"
                        value={item.unitPriceBRL}
                        onChange={(e) => {
                          const next = [...items];
                          next[idx] = { ...next[idx], unitPriceBRL: e.target.value };
                          setItems(next);
                        }}
                        required
                      />
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
                      setItems([...items, { recipeId: '', qty: 1, unitPriceBRL: '' }])
                    }
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar item
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="o-notes">Observações</Label>
                <Input
                  id="o-notes"
                  placeholder="Recheio, decoração, restrições alimentares..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Footer com total */}
            <div className="flex items-center justify-between gap-3 border-t border-border/60 bg-secondary/30 px-6 py-4">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Total da encomenda
                </div>
                <div className="font-display text-2xl font-semibold tracking-tight text-cocoa-900">
                  {formatBRL(total)}
                </div>
              </div>
              <div className="flex gap-2">
                <Dialog.Close asChild>
                  <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                </Dialog.Close>
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending ? 'Criando...' : 'Criar encomenda'}
                </Button>
              </div>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
