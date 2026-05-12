import { router } from '../trpc';
import { authRouter } from './auth';
import { userRouter } from './user';
import { tenantRouter } from './tenant';
import { customerRouter } from './customer';
import { ingredientRouter } from './ingredient';
import { recipeRouter } from './recipe';
import { orderRouter } from './order';
import { dashboardRouter } from './dashboard';

export const appRouter = router({
  auth: authRouter,
  user: userRouter,
  tenant: tenantRouter,
  customer: customerRouter,
  ingredient: ingredientRouter,
  recipe: recipeRouter,
  order: orderRouter,
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;
