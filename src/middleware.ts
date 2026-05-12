import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { authConfig } from '@/lib/auth.config';

const { auth } = NextAuth(authConfig);

/**
 * Limite acima do qual consideramos o cookie "monstruoso" e nuked.
 * O JWT saudável da nossa app fica em ~200-400 bytes. 16KB é folga
 * confortável; qualquer coisa acima disso é resíduo de bug (ex.: foto
 * em data URL que entrou no JWT antes do fix).
 */
const MAX_HEALTHY_COOKIE_BYTES = 16 * 1024;

const AUTH_COOKIE_PREFIXES = [
  'authjs.',
  '__Secure-authjs.',
  '__Host-authjs.',
  'next-auth.',
  '__Secure-next-auth.',
  '__Host-next-auth.',
];

function isAuthCookie(name: string): boolean {
  return AUTH_COOKIE_PREFIXES.some((p) => name.startsWith(p));
}

function nukeCookies(req: NextRequest, res: NextResponse) {
  for (const c of req.cookies.getAll()) {
    if (isAuthCookie(c.name)) {
      // Apaga em todos os paths comuns pra garantir
      res.cookies.set(c.name, '', { maxAge: 0, path: '/' });
    }
  }
}

export default auth((req) => {
  // Camada 1: cookie monstruoso → limpa tudo de auth e manda pro login.
  // Self-healing: usuário fica destravado sem precisar mexer em DevTools.
  const cookieHeader = req.headers.get('cookie') ?? '';
  if (cookieHeader.length > MAX_HEALTHY_COOKIE_BYTES) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('reason', 'session-reset');
    const res = NextResponse.redirect(url);
    nukeCookies(req, res);
    return res;
  }

  // Camada 2: comportamento padrão do Auth.js (callback `authorized`)
  return undefined;
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
