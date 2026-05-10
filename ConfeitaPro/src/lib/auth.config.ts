import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: { signIn: '/login' },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;

      const isAuthPage = path.startsWith('/login') || path.startsWith('/register');
      const isProtected =
        path.startsWith('/dashboard') ||
        path.startsWith('/setup') ||
        path.startsWith('/encomendas') ||
        path.startsWith('/clientes') ||
        path.startsWith('/receitas') ||
        path.startsWith('/ingredientes') ||
        path.startsWith('/configuracoes') ||
        path.startsWith('/perfil');

      if (isProtected && !isLoggedIn) {
        return false;
      }
      if (isAuthPage && isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      // Garante que a foto NÃO vai pro JWT. Mesmo que algum cookie antigo
      // já tenha `picture`, sumimos com ele aqui — o JWT é re-emitido a
      // cada request, então isso autocorrige sessões existentes assim que
      // o usuário faz uma request bem-sucedida (ou faz login de novo).
      delete token.picture;
      return token;
    },
    session({ session, token }) {
      if (token.sub && session.user) {
        (session.user as { id?: string }).id = token.sub;
      }
      // session.user.image fica indefinido — quem precisa da foto pega via tRPC.
      return session;
    },
  },
} satisfies NextAuthConfig;
