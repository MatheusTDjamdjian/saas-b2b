import { initTRPC, TRPCError } from '@trpc/server';
import { ZodError } from 'zod';
import superjson from 'superjson';
import type { Context } from './context';

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      ...ctx,
      user: { id: ctx.session.user.id, email: ctx.session.user.email ?? '' },
    },
  });
});

const hasTenant = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user?.id) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  if (!ctx.tenantId || !ctx.role) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Nenhuma empresa selecionada' });
  }
  return next({
    ctx: {
      ...ctx,
      user: { id: ctx.session.user.id, email: ctx.session.user.email ?? '' },
      tenantId: ctx.tenantId,
      role: ctx.role,
    },
  });
});

const isAdmin = t.middleware(({ ctx, next }) => {
  if (ctx.role !== 'OWNER' && ctx.role !== 'ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Permissão insuficiente' });
  }
  return next({ ctx });
});

export const protectedProcedure = t.procedure.use(isAuthed);
export const tenantProcedure = t.procedure.use(isAuthed).use(hasTenant);
export const adminProcedure = tenantProcedure.use(isAdmin);
