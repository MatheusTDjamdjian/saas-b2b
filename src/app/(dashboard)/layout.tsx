import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getServerCaller } from '@/trpc/server';
import { Sidebar } from '@/components/dashboard/Sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const caller = await getServerCaller();
  const myTenants = await caller.tenant.myTenants();

  if (myTenants.length === 0) {
    redirect('/setup');
  }

  let current;
  let me;
  try {
    [current, me] = await Promise.all([caller.tenant.current(), caller.user.me()]);
  } catch {
    redirect('/setup');
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        tenantName={current.name}
        user={{
          name: me.name ?? me.email,
          email: me.email,
          image: me.image ?? null,
        }}
      />
      <main className="relative flex-1 overflow-y-auto">
        {/* Background decorativo sutil */}
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-primary-soft/30 via-cream-50/40 to-transparent" />

        <div className="mx-auto w-full max-w-7xl px-6 py-10 sm:px-8 lg:px-10">
          <div className="animate-fade-in">{children}</div>
        </div>
      </main>
    </div>
  );
}
