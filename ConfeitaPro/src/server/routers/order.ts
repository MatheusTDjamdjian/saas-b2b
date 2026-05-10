import { z } from 'zod';
import { and, desc, eq, gte, lte, sql, inArray } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, tenantProcedure } from '../trpc';
import { db } from '@/db';
import { orders, orderItems, payments, customers, recipes } from '@/db/schema';
import { canTransition } from '@/domain/orders/statusMachine';

const orderStatusZ = z.enum([
  'PENDING',
  'CONFIRMED',
  'IN_PRODUCTION',
  'READY',
  'DELIVERED',
  'CANCELLED',
]);

const itemInput = z.object({
  recipeId: z.string().uuid(),
  qty: z.number().int().positive(),
  unitPriceCents: z.number().int().positive(),
  notes: z.string().optional(),
});

export const orderRouter = router({
  list: tenantProcedure
    .input(
      z
        .object({
          from: z.string().date().optional(),
          to: z.string().date().optional(),
          status: orderStatusZ.optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const where = and(
        eq(orders.tenantId, ctx.tenantId),
        input?.from ? gte(orders.deliveryDate, input.from) : undefined,
        input?.to ? lte(orders.deliveryDate, input.to) : undefined,
        input?.status ? eq(orders.status, input.status) : undefined,
      );

      const rows = await db
        .select({
          order: orders,
          customer: customers,
        })
        .from(orders)
        .innerJoin(customers, eq(orders.customerId, customers.id))
        .where(where)
        .orderBy(desc(orders.deliveryDate));

      return rows.map((r) => ({ ...r.order, customer: r.customer }));
    }),

  get: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const order = await db.query.orders.findFirst({
        where: and(eq(orders.id, input.id), eq(orders.tenantId, ctx.tenantId)),
      });
      if (!order) throw new TRPCError({ code: 'NOT_FOUND' });

      const [customer, items, paymentList] = await Promise.all([
        db.query.customers.findFirst({ where: eq(customers.id, order.customerId) }),
        db
          .select({
            item: orderItems,
            recipe: recipes,
          })
          .from(orderItems)
          .innerJoin(recipes, eq(orderItems.recipeId, recipes.id))
          .where(eq(orderItems.orderId, order.id)),
        db.select().from(payments).where(eq(payments.orderId, order.id)),
      ]);

      return {
        ...order,
        customer,
        items: items.map((i) => ({ ...i.item, recipe: i.recipe })),
        payments: paymentList,
      };
    }),

  create: tenantProcedure
    .input(
      z.object({
        customerId: z.string().uuid(),
        deliveryDate: z.string().date(),
        notes: z.string().optional(),
        items: z.array(itemInput).min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const customer = await db.query.customers.findFirst({
        where: and(eq(customers.id, input.customerId), eq(customers.tenantId, ctx.tenantId)),
      });
      if (!customer) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Cliente não encontrado' });
      }

      const recipeIds = input.items.map((i) => i.recipeId);
      const owned = await db
        .select({ id: recipes.id })
        .from(recipes)
        .where(and(eq(recipes.tenantId, ctx.tenantId), inArray(recipes.id, recipeIds)));
      if (owned.length !== new Set(recipeIds).size) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Receita inválida' });
      }

      const totalCents = input.items.reduce((s, i) => s + i.qty * i.unitPriceCents, 0);

      return db.transaction(async (tx) => {
        const [order] = await tx
          .insert(orders)
          .values({
            tenantId: ctx.tenantId,
            customerId: input.customerId,
            deliveryDate: input.deliveryDate,
            notes: input.notes,
            totalCents,
          })
          .returning();

        await tx
          .insert(orderItems)
          .values(input.items.map((i) => ({ ...i, orderId: order.id })));

        return order;
      });
    }),

  updateStatus: tenantProcedure
    .input(z.object({ id: z.string().uuid(), status: orderStatusZ }))
    .mutation(async ({ ctx, input }) => {
      const current = await db.query.orders.findFirst({
        where: and(eq(orders.id, input.id), eq(orders.tenantId, ctx.tenantId)),
      });
      if (!current) throw new TRPCError({ code: 'NOT_FOUND' });

      if (!canTransition(current.status, input.status)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Transição inválida: ${current.status} → ${input.status}`,
        });
      }

      const [updated] = await db
        .update(orders)
        .set({ status: input.status })
        .where(and(eq(orders.id, input.id), eq(orders.tenantId, ctx.tenantId)))
        .returning();
      return updated;
    }),

  registerPayment: tenantProcedure
    .input(
      z.object({
        orderId: z.string().uuid(),
        amountCents: z.number().int().positive(),
        method: z.enum(['PIX', 'CASH', 'CARD', 'TRANSFER']),
        notes: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return db.transaction(async (tx) => {
        const order = await tx.query.orders.findFirst({
          where: and(eq(orders.id, input.orderId), eq(orders.tenantId, ctx.tenantId)),
        });
        if (!order) throw new TRPCError({ code: 'NOT_FOUND' });

        await tx.insert(payments).values({
          orderId: input.orderId,
          amountCents: input.amountCents,
          method: input.method,
          notes: input.notes,
        });

        await tx
          .update(orders)
          .set({ paidCents: sql`${orders.paidCents} + ${input.amountCents}` })
          .where(eq(orders.id, input.orderId));

        return { ok: true };
      });
    }),

  delete: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await db
        .delete(orders)
        .where(and(eq(orders.id, input.id), eq(orders.tenantId, ctx.tenantId)))
        .returning({ id: orders.id });
      if (result.length === 0) throw new TRPCError({ code: 'NOT_FOUND' });
      return { id: result[0].id };
    }),
});
