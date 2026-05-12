import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { router, publicProcedure } from '../trpc';
import { db } from '@/db';
import { users } from '@/db/schema';

export const authRouter = router({
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8, 'Senha deve ter ao menos 8 caracteres'),
        name: z.string().min(2),
      }),
    )
    .mutation(async ({ input }) => {
      const email = input.email.toLowerCase();

      const existing = await db.query.users.findFirst({ where: eq(users.email, email) });
      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Email já cadastrado' });
      }

      const passwordHash = await bcrypt.hash(input.password, 10);

      const [user] = await db
        .insert(users)
        .values({ email, passwordHash, name: input.name })
        .returning({ id: users.id, email: users.email });

      return user;
    }),
});
