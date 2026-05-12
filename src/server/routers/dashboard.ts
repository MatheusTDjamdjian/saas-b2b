import { and, eq, gte, lte, sql, desc, ne } from 'drizzle-orm';
import { router, tenantProcedure } from '../trpc';
import { db } from '@/db';
import { orders, customers } from '@/db/schema';

export const dashboardRouter = router({
  metrics: tenantProcedure.query(async ({ ctx }) => {
    const today = new Date().toISOString().slice(0, 10);
    const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthStartStr = monthStart.toISOString().slice(0, 10);

    const [todayOrders, weekOrders, monthRevenue, pending] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(orders)
        .where(
          and(
            eq(orders.tenantId, ctx.tenantId),
            eq(orders.deliveryDate, today),
            ne(orders.status, 'CANCELLED'),
          ),
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(orders)
        .where(
          and(
            eq(orders.tenantId, ctx.tenantId),
            gte(orders.deliveryDate, today),
            lte(orders.deliveryDate, in7Days),
            ne(orders.status, 'CANCELLED'),
          ),
        ),
      db
        .select({
          revenue: sql<number>`COALESCE(SUM(${orders.totalCents}), 0)::int`,
          paid: sql<number>`COALESCE(SUM(${orders.paidCents}), 0)::int`,
        })
        .from(orders)
        .where(
          and(
            eq(orders.tenantId, ctx.tenantId),
            gte(orders.deliveryDate, monthStartStr),
            ne(orders.status, 'CANCELLED'),
          ),
        ),
      db
        .select({
          pending: sql<number>`COALESCE(SUM(${orders.totalCents} - ${orders.paidCents}), 0)::int`,
        })
        .from(orders)
        .where(and(eq(orders.tenantId, ctx.tenantId), ne(orders.status, 'CANCELLED'))),
    ]);

    return {
      ordersToday: todayOrders[0]?.count ?? 0,
      ordersNext7Days: weekOrders[0]?.count ?? 0,
      monthRevenueCents: monthRevenue[0]?.revenue ?? 0,
      monthPaidCents: monthRevenue[0]?.paid ?? 0,
      pendingReceivableCents: pending[0]?.pending ?? 0,
    };
  }),

  upcomingOrders: tenantProcedure.query(async ({ ctx }) => {
    const today = new Date().toISOString().slice(0, 10);
    const rows = await db
      .select({
        order: orders,
        customer: customers,
      })
      .from(orders)
      .innerJoin(customers, eq(orders.customerId, customers.id))
      .where(
        and(
          eq(orders.tenantId, ctx.tenantId),
          gte(orders.deliveryDate, today),
          ne(orders.status, 'CANCELLED'),
          ne(orders.status, 'DELIVERED'),
        ),
      )
      .orderBy(orders.deliveryDate)
      .limit(10);

    return rows.map((r) => ({ ...r.order, customer: r.customer }));
  }),

  recentOrders: tenantProcedure.query(async ({ ctx }) => {
    const rows = await db
      .select({
        order: orders,
        customer: customers,
      })
      .from(orders)
      .innerJoin(customers, eq(orders.customerId, customers.id))
      .where(eq(orders.tenantId, ctx.tenantId))
      .orderBy(desc(orders.createdAt))
      .limit(5);

    return rows.map((r) => ({ ...r.order, customer: r.customer }));
  }),
});
