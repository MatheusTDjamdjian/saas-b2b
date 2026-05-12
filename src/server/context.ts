import { cookies } from 'next/headers';
import { and, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { memberships } from '@/db/schema';
import type { Role } from '@/db/schema';

export async function createContext() {
  const session = await auth();

  let tenantId: string | undefined;
  let role: Role | undefined;

  if (session?.user) {
    const userId = (session.user as { id?: string }).id;
    if (userId) {
      const cookieStore = await cookies();
      const selectedTenantId = cookieStore.get('tenant_id')?.value;

      const membership = selectedTenantId
        ? await db.query.memberships.findFirst({
            where: and(
              eq(memberships.userId, userId),
              eq(memberships.tenantId, selectedTenantId),
            ),
          })
        : await db.query.memberships.findFirst({
            where: eq(memberships.userId, userId),
          });

      if (membership) {
        tenantId = membership.tenantId;
        role = membership.role;
      }
    }
  }

  return { session, tenantId, role };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
