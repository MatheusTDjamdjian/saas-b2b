import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { router, protectedProcedure } from '../trpc';
import { db } from '@/db';
import { users } from '@/db/schema';

// Aceita data URLs (foto enviada do navegador como base64) ou URL https.
// Limite de ~700KB no payload — o cliente já redimensiona/comprime antes.
const imageSchema = z
  .string()
  .max(900_000, 'Imagem muito grande (máx. 500KB)')
  .refine(
    (s) => s.startsWith('data:image/') || s.startsWith('https://') || s === '',
    'Imagem inválida',
  )
  .nullable();

export const userRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, ctx.user.id),
      columns: {
        id: true,
        email: true,
        name: true,
        image: true,
        createdAt: true,
      },
    });
    if (!user) throw new TRPCError({ code: 'NOT_FOUND' });
    return user;
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2, 'Nome muito curto').max(80).optional(),
        image: imageSchema.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const patch: { name?: string; image?: string | null } = {};
      if (input.name !== undefined) patch.name = input.name;
      if (input.image !== undefined) patch.image = input.image;

      if (Object.keys(patch).length === 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Nada para atualizar' });
      }

      const [updated] = await db
        .update(users)
        .set(patch)
        .where(eq(users.id, ctx.user.id))
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
          image: users.image,
        });
      return updated;
    }),

  updatePassword: protectedProcedure
    .input(
      z
        .object({
          currentPassword: z.string().min(1, 'Senha atual obrigatória'),
          newPassword: z
            .string()
            .min(8, 'Nova senha precisa de ao menos 8 caracteres')
            .max(72, 'Senha muito longa'),
        })
        .refine((d) => d.currentPassword !== d.newPassword, {
          message: 'A nova senha precisa ser diferente da atual',
          path: ['newPassword'],
        }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, ctx.user.id),
      });
      if (!user || !user.passwordHash) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Conta sem senha definida',
        });
      }

      const ok = await bcrypt.compare(input.currentPassword, user.passwordHash);
      if (!ok) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Senha atual incorreta',
        });
      }

      const newHash = await bcrypt.hash(input.newPassword, 10);
      await db
        .update(users)
        .set({ passwordHash: newHash })
        .where(eq(users.id, ctx.user.id));

      return { ok: true };
    }),
});
