'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { AlertCircle, Check } from 'lucide-react';
import { trpc } from '@/trpc/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function RegisterPage() {
  const router = useRouter();
  const register = trpc.auth.register.useMutation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await register.mutateAsync({ name, email, password });
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) {
        setError('Conta criada, mas não foi possível fazer login. Tente entrar.');
        return;
      }
      router.push('/setup');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta');
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-cocoa-900">
          Comece grátis
        </h1>
        <p className="text-sm text-muted-foreground">
          14 dias grátis · sem cartão de crédito · cancele quando quiser
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">Seu nome</Label>
          <Input
            id="name"
            placeholder="Maria Silva"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="voce@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            minLength={8}
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={register.isPending}>
          {register.isPending ? 'Criando sua conta...' : 'Criar minha conta'}
        </Button>

        <ul className="space-y-1.5 text-xs text-muted-foreground">
          {['Sem cartão de crédito', 'Suporte em português', 'Cancele a qualquer momento'].map(
            (item) => (
              <li key={item} className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-primary" />
                {item}
              </li>
            ),
          )}
        </ul>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{' '}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
