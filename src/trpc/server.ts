import 'server-only';
import { cache } from 'react';
import { createContext } from '@/server/context';
import { appRouter } from '@/server/routers/_app';

export const getServerCaller = cache(async () => {
  const ctx = await createContext();
  return appRouter.createCaller(ctx);
});
