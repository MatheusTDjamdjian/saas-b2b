import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, tenantProcedure } from '../trpc';
import { db } from '@/db';
import { customers } from '@/db/schema';

const customerInput = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  notes: z.string().optional(),
});

export const customerRouter = router({
  list: tenantProcedure.query(({ ctx }) => {
    return db
      .select()
      .from(customers)
      .where(eq(customers.tenantId, ctx.tenantId))
      .orderBy(desc(customers.createdAt));
  }),

  get: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const c = await db.query.customers.findFirst({
        where: and(eq(customers.id, input.id), eq(customers.tenantId, ctx.tenantId)),
      });
      if (!c) throw new TRPCError({ code: 'NOT_FOUND' });
      return c;
    }),

  create: tenantProcedure.input(customerInput).mutation(async ({ ctx, input }) => {
    const [c] = await db
      .insert(customers)
      .values({
        ...input,
        email: input.email || null,
        tenantId: ctx.tenantId,
      })
      .returning();
    return c;
  }),

  update: tenantProcedure
    .input(z.object({ id: z.string().uuid() }).merge(customerInput))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [c] = await db
        .update(customers)
        .set({ ...data, email: data.email || null })
        .where(and(eq(customers.id, id), eq(customers.tenantId, ctx.tenantId)))
        .returning();
      if (!c) throw new TRPCError({ code: 'NOT_FOUND' });
      return c;
    }),

  delete: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await db
        .delete(customers)
        .where(and(eq(customers.id, input.id), eq(customers.tenantId, ctx.tenantId)))
        .returning({ id: customers.id });
      if (result.length === 0) throw new TRPCError({ code: 'NOT_FOUND' });
      return { id: result[0].id };
    }),
});
