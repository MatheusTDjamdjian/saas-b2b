import { z } from 'zod';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, tenantProcedure } from '../trpc';
import { db } from '@/db';
import { recipes, recipeIngredients, ingredients } from '@/db/schema';
import { calculateRecipeCost } from '@/domain/pricing/recipeCost';

const unitEnum = z.enum(['g', 'kg', 'ml', 'l', 'un']);

const recipeIngredientInput = z.object({
  ingredientId: z.string().uuid(),
  qty: z.number().int().positive(),
  unit: unitEnum,
});

const recipeInput = z.object({
  name: z.string().min(2),
  yieldQty: z.number().int().positive(),
  yieldUnit: unitEnum,
  laborCostCents: z.number().int().nonnegative().default(0),
  fixedCostCents: z.number().int().nonnegative().default(0),
  marginPct: z.number().int().min(0).max(1000).default(50),
  ingredients: z.array(recipeIngredientInput).min(1),
});

export const recipeRouter = router({
  list: tenantProcedure.query(({ ctx }) => {
    return db
      .select()
      .from(recipes)
      .where(eq(recipes.tenantId, ctx.tenantId))
      .orderBy(desc(recipes.createdAt));
  }),

  get: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const recipe = await db.query.recipes.findFirst({
        where: and(eq(recipes.id, input.id), eq(recipes.tenantId, ctx.tenantId)),
      });
      if (!recipe) throw new TRPCError({ code: 'NOT_FOUND' });

      const items = await db
        .select({
          ingredientId: recipeIngredients.ingredientId,
          qty: recipeIngredients.qty,
          unit: recipeIngredients.unit,
          ingredient: ingredients,
        })
        .from(recipeIngredients)
        .innerJoin(ingredients, eq(recipeIngredients.ingredientId, ingredients.id))
        .where(eq(recipeIngredients.recipeId, recipe.id));

      const cost = calculateRecipeCost({
        ingredients: items.map((i) => ({
          qty: i.qty,
          unit: i.unit,
          ingredient: {
            unit: i.ingredient.unit,
            packageQty: i.ingredient.packageQty,
            packageCostCents: i.ingredient.packageCostCents,
          },
        })),
        laborCostCents: recipe.laborCostCents,
        fixedCostCents: recipe.fixedCostCents,
        yieldQty: recipe.yieldQty,
        marginPct: recipe.marginPct,
      });

      return { ...recipe, ingredients: items, cost };
    }),

  create: tenantProcedure.input(recipeInput).mutation(async ({ ctx, input }) => {
    // valida que todos os ingredientes pertencem ao tenant
    const ids = input.ingredients.map((i) => i.ingredientId);
    const owned = await db
      .select({ id: ingredients.id })
      .from(ingredients)
      .where(and(eq(ingredients.tenantId, ctx.tenantId), inArray(ingredients.id, ids)));
    if (owned.length !== ids.length) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Ingrediente inválido' });
    }

    return db.transaction(async (tx) => {
      const [recipe] = await tx
        .insert(recipes)
        .values({
          tenantId: ctx.tenantId,
          name: input.name,
          yieldQty: input.yieldQty,
          yieldUnit: input.yieldUnit,
          laborCostCents: input.laborCostCents,
          fixedCostCents: input.fixedCostCents,
          marginPct: input.marginPct,
        })
        .returning();

      await tx.insert(recipeIngredients).values(
        input.ingredients.map((i) => ({
          recipeId: recipe.id,
          ingredientId: i.ingredientId,
          qty: i.qty,
          unit: i.unit,
        })),
      );

      return recipe;
    });
  }),

  delete: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const result = await db
        .delete(recipes)
        .where(and(eq(recipes.id, input.id), eq(recipes.tenantId, ctx.tenantId)))
        .returning({ id: recipes.id });
      if (result.length === 0) throw new TRPCError({ code: 'NOT_FOUND' });
      return { id: result[0].id };
    }),
});
