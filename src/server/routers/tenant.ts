import { z } from 'zod';
import { cookies } from 'next/headers';
import { and, eq } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure, tenantProcedure } from '../trpc';
import { db } from '@/db';
import { tenants, memberships } from '@/db/schema';

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40);
}

export const tenantRouter = router({
  myTenants: protectedProcedure.query(async ({ ctx }) => {
    const result = await db
      .select({
        tenant: tenants,
        role: memberships.role,
      })
      .from(memberships)
      .innerJoin(tenants, eq(memberships.tenantId, tenants.id))
      .where(eq(memberships.userId, ctx.user.id));

    return result;
  }),

  current: tenantProcedure.query(async ({ ctx }) => {
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, ctx.tenantId),
    });
    if (!tenant) throw new TRPCError({ code: 'NOT_FOUND' });
    return { ...tenant, role: ctx.role };
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).max(100),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      let slug = slugify(input.name);
      let suffix = 0;
      while (await db.query.tenants.findFirst({ where: eq(tenants.slug, slug) })) {
        suffix++;
        slug = `${slugify(input.name)}-${suffix}`;
      }

      const tenant = await db.transaction(async (tx) => {
        const [t] = await tx
          .insert(tenants)
          .values({
            name: input.name,
            slug,
            trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          })
          .returning();

        await tx.insert(memberships).values({
          userId: ctx.user.id,
          tenantId: t.id,
          role: 'OWNER',
        });

        return t;
      });

      const cookieStore = await cookies();
      cookieStore.set('tenant_id', tenant.id, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
      });

      return tenant;
    }),

  switch: protectedProcedure
    .input(z.object({ tenantId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const m = await db.query.memberships.findFirst({
        where: and(
          eq(memberships.userId, ctx.user.id),
          eq(memberships.tenantId, input.tenantId),
        ),
      });
      if (!m) throw new TRPCError({ code: 'FORBIDDEN' });

      const cookieStore = await cookies();
      cookieStore.set('tenant_id', input.tenantId, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
      });
      return { ok: true };
    }),
});
