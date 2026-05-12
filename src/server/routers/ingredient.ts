import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, tenantProcedure } from '../trpc';
import { db } from '@/db';
import { ingredients } from '@/db/schema';

const unitEnum = z.enum(['g', 'kg', 'ml', 'l', 'un']);

const ingredientInput = z.object({
  name: z.string().min(2),
  unit: unitEnum,
  packageQty: z.number().int().positive(),
  packageCostCents: z.number().int().positive(),
  supplier: z.string().optional(),
});

export const ingredientRouter = router({
  list: tenantProcedure.query(({ ctx }) => {
    return db
      .select()
      .from(ingredients)
      .where(eq(ingredients.tenantId, ctx.tenantId))
      .orderBy(desc(ingredients.updatedAt));
  }),

  create: tenantProcedure.input(ingredientInput).mutation(async ({ ctx, input }) => {
    const [i] = await db
      .insert(ingredients)
      .values({ ...input, tenantId: ctx.tenantId })
      .returning();
    return i;
  }),

  update: tenantProcedure
    .input(z.object({ id: z.string().uuid() }).merge(ingredientInput))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [i] = await db
        .update(ingredients)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(ingredients.id, id), eq(ingredients.tenantId, ctx.tenantId)))
        .returning();
      if (!i) throw new TRPCError({ code: 'NOT_FOUND' });
      return i;
    }),

  delete: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await db
        .delete(ingredients)
        .where(and(eq(ingredients.id, input.id), eq(ingredients.tenantId, ctx.tenantId)))
        .returning({ id: ingredients.id });
      if (result.length === 0) throw new TRPCError({ code: 'NOT_FOUND' });
      return { id: result[0].id };
    }),
});
