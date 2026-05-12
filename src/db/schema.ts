import {
  pgTable,
  pgEnum,
  text,
  integer,
  timestamp,
  date,
  uuid,
  primaryKey,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================
// ENUMS
// ============================================================
export const roleEnum = pgEnum('role', ['OWNER', 'ADMIN', 'STAFF']);
export const planEnum = pgEnum('plan', ['FREE', 'PRO', 'BUSINESS']);
export const unitEnum = pgEnum('unit', ['g', 'kg', 'ml', 'l', 'un']);
export const orderStatusEnum = pgEnum('order_status', [
  'PENDING',
  'CONFIRMED',
  'IN_PRODUCTION',
  'READY',
  'DELIVERED',
  'CANCELLED',
]);
export const paymentMethodEnum = pgEnum('payment_method', ['PIX', 'CASH', 'CARD', 'TRANSFER']);

// ============================================================
// PLATAFORMA
// ============================================================
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  name: text('name'),
  image: text('image'),
  emailVerifiedAt: timestamp('email_verified_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tenants = pgTable('tenants', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  plan: planEnum('plan').default('FREE').notNull(),
  trialEndsAt: timestamp('trial_ends_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const memberships = pgTable(
  'memberships',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, { onDelete: 'cascade' })
      .notNull(),
    role: roleEnum('role').default('STAFF').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    userTenantUq: uniqueIndex('memberships_user_tenant_uq').on(t.userId, t.tenantId),
    tenantIdx: index('memberships_tenant_idx').on(t.tenantId),
  }),
);

// ============================================================
// DOMÍNIO — confeitaria
// ============================================================
export const customers = pgTable(
  'customers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, { onDelete: 'cascade' })
      .notNull(),
    name: text('name').notNull(),
    phone: text('phone'),
    email: text('email'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    tenantIdx: index('customers_tenant_idx').on(t.tenantId),
  }),
);

export const ingredients = pgTable(
  'ingredients',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, { onDelete: 'cascade' })
      .notNull(),
    name: text('name').notNull(),
    unit: unitEnum('unit').notNull(),
    packageQty: integer('package_qty').notNull(),
    packageCostCents: integer('package_cost_cents').notNull(),
    supplier: text('supplier'),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    tenantIdx: index('ingredients_tenant_idx').on(t.tenantId),
  }),
);

export const recipes = pgTable(
  'recipes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, { onDelete: 'cascade' })
      .notNull(),
    name: text('name').notNull(),
    yieldQty: integer('yield_qty').notNull(),
    yieldUnit: unitEnum('yield_unit').notNull(),
    laborCostCents: integer('labor_cost_cents').default(0).notNull(),
    fixedCostCents: integer('fixed_cost_cents').default(0).notNull(),
    marginPct: integer('margin_pct').default(50).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    tenantIdx: index('recipes_tenant_idx').on(t.tenantId),
  }),
);

export const recipeIngredients = pgTable(
  'recipe_ingredients',
  {
    recipeId: uuid('recipe_id')
      .references(() => recipes.id, { onDelete: 'cascade' })
      .notNull(),
    ingredientId: uuid('ingredient_id')
      .references(() => ingredients.id, { onDelete: 'restrict' })
      .notNull(),
    qty: integer('qty').notNull(),
    unit: unitEnum('unit').notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.recipeId, t.ingredientId] }),
  }),
);

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .references(() => tenants.id, { onDelete: 'cascade' })
      .notNull(),
    customerId: uuid('customer_id')
      .references(() => customers.id, { onDelete: 'restrict' })
      .notNull(),
    deliveryDate: date('delivery_date').notNull(),
    status: orderStatusEnum('status').default('PENDING').notNull(),
    totalCents: integer('total_cents').default(0).notNull(),
    paidCents: integer('paid_cents').default(0).notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    tenantDeliveryIdx: index('orders_tenant_delivery_idx').on(t.tenantId, t.deliveryDate),
    tenantStatusIdx: index('orders_tenant_status_idx').on(t.tenantId, t.status),
  }),
);

export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id')
    .references(() => orders.id, { onDelete: 'cascade' })
    .notNull(),
  recipeId: uuid('recipe_id')
    .references(() => recipes.id, { onDelete: 'restrict' })
    .notNull(),
  qty: integer('qty').notNull(),
  unitPriceCents: integer('unit_price_cents').notNull(),
  notes: text('notes'),
});

export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id')
    .references(() => orders.id, { onDelete: 'cascade' })
    .notNull(),
  amountCents: integer('amount_cents').notNull(),
  method: paymentMethodEnum('method').notNull(),
  paidAt: timestamp('paid_at').defaultNow().notNull(),
  notes: text('notes'),
});

// ============================================================
// RELATIONS
// ============================================================
export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(memberships),
}));

export const tenantsRelations = relations(tenants, ({ many }) => ({
  memberships: many(memberships),
  customers: many(customers),
  ingredients: many(ingredients),
  recipes: many(recipes),
  orders: many(orders),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(users, { fields: [memberships.userId], references: [users.id] }),
  tenant: one(tenants, { fields: [memberships.tenantId], references: [tenants.id] }),
}));

export const recipesRelations = relations(recipes, ({ many, one }) => ({
  tenant: one(tenants, { fields: [recipes.tenantId], references: [tenants.id] }),
  ingredients: many(recipeIngredients),
}));

export const recipeIngredientsRelations = relations(recipeIngredients, ({ one }) => ({
  recipe: one(recipes, { fields: [recipeIngredients.recipeId], references: [recipes.id] }),
  ingredient: one(ingredients, {
    fields: [recipeIngredients.ingredientId],
    references: [ingredients.id],
  }),
}));

export const ordersRelations = relations(orders, ({ many, one }) => ({
  tenant: one(tenants, { fields: [orders.tenantId], references: [tenants.id] }),
  customer: one(customers, { fields: [orders.customerId], references: [customers.id] }),
  items: many(orderItems),
  payments: many(payments),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  recipe: one(recipes, { fields: [orderItems.recipeId], references: [recipes.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
}));

// Tipos derivados — úteis em todo o app
export type User = typeof users.$inferSelect;
export type Tenant = typeof tenants.$inferSelect;
export type Membership = typeof memberships.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Ingredient = typeof ingredients.$inferSelect;
export type Recipe = typeof recipes.$inferSelect;
export type RecipeIngredient = typeof recipeIngredients.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
export type Role = (typeof roleEnum.enumValues)[number];
export type Plan = (typeof planEnum.enumValues)[number];
