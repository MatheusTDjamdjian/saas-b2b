import type { OrderStatus } from '@/db/schema';

const transitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['IN_PRODUCTION', 'CANCELLED'],
  IN_PRODUCTION: ['READY', 'CANCELLED'],
  READY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return transitions[from].includes(to);
}

export function nextStatuses(from: OrderStatus): OrderStatus[] {
  return transitions[from];
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Aguardando',
  CONFIRMED: 'Confirmado',
  IN_PRODUCTION: 'Em produção',
  READY: 'Pronto',
  DELIVERED: 'Entregue',
  CANCELLED: 'Cancelado',
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-800 ring-amber-700/10',
  CONFIRMED: 'bg-sky-50 text-sky-800 ring-sky-700/10',
  IN_PRODUCTION: 'bg-violet-50 text-violet-800 ring-violet-700/10',
  READY: 'bg-emerald-50 text-emerald-800 ring-emerald-700/10',
  DELIVERED: 'bg-stone-100 text-stone-700 ring-stone-700/10',
  CANCELLED: 'bg-rose-50 text-rose-800 ring-rose-700/10',
};

export const STATUS_DOTS: Record<OrderStatus, string> = {
  PENDING: 'bg-amber-500',
  CONFIRMED: 'bg-sky-500',
  IN_PRODUCTION: 'bg-violet-500',
  READY: 'bg-emerald-500',
  DELIVERED: 'bg-stone-400',
  CANCELLED: 'bg-rose-500',
};
