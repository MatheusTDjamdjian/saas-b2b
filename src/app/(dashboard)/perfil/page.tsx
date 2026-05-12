'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Camera,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Trash2,
  UserRound,
} from 'lucide-react';
import { trpc } from '@/trpc/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { cn } from '@/lib/utils';

const MAX_IMAGE_BYTES = 500 * 1024; // 500KB depois da compressão

export default function PerfilPage() {
  const router = useRouter();
  const me = trpc.user.me.useQuery();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Meu perfil"
        description="Atualize seus dados de acesso, foto e senha."
      />

      {me.isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </CardContent>
        </Card>
      ) : me.data ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Coluna esquerda: avatar + email read-only */}
          <div className="space-y-6 lg:col-span-1">
            <ProfileCard
              currentImage={me.data.image}
              currentName={me.data.name ?? ''}
              email={me.data.email}
              onChange={() => {
                me.refetch();
                router.refresh();
              }}
            />
          </div>

          {/* Coluna direita: nome + senha */}
          <div className="space-y-6 lg:col-span-2">
            <NameForm
              initialName={me.data.name ?? ''}
              onSaved={() => {
                me.refetch();
                router.refresh();
              }}
            />
            <PasswordForm />
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ============================================================
   Foto + email (read-only)
============================================================ */
function ProfileCard({
  currentImage,
  currentName,
  email,
  onChange,
}: {
  currentImage: string | null;
  currentName: string;
  email: string;
  onChange: () => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const update = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      onChange();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    },
    onError: (err) => setError(err.message),
  });

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);

    if (!file.type.startsWith('image/')) {
      setError('Arquivo precisa ser uma imagem');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Imagem muito grande (máx. 5MB antes da compressão)');
      return;
    }

    try {
      const dataUrl = await compressImage(file, 512, 0.85);
      const approxBytes = Math.round((dataUrl.length * 3) / 4);
      if (approxBytes > MAX_IMAGE_BYTES) {
        const more = await compressImage(file, 384, 0.7);
        update.mutate({ image: more });
      } else {
        update.mutate({ image: dataUrl });
      }
    } catch {
      setError('Não foi possível processar essa imagem');
    }
  }

  function onRemove() {
    setError(null);
    update.mutate({ image: null });
  }

  const initial = (currentName || email).trim().slice(0, 1).toUpperCase();

  return (
    <Card className="p-6">
      <CardContent className="space-y-5 p-0">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            {currentImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentImage}
                alt="Foto de perfil"
                className="h-28 w-28 rounded-3xl object-cover shadow-soft ring-1 ring-border"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-primary font-display text-4xl font-semibold text-white shadow-soft">
                {initial}
              </div>
            )}
            <button
              onClick={() => fileInput.current?.click()}
              disabled={update.isPending}
              className="absolute -bottom-1.5 -right-1.5 flex h-9 w-9 items-center justify-center rounded-xl border-2 border-card bg-gradient-primary text-white shadow-lift transition-transform hover:scale-105 disabled:opacity-60"
              aria-label="Trocar foto"
            >
              {update.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>
          </div>

          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={onPickFile}
          />

          <h3 className="mt-4 font-display text-lg font-semibold tracking-tight text-cocoa-900">
            {currentName || 'Sem nome'}
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{email}</p>

          {success && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-700/10">
              <Check className="h-3 w-3" />
              Foto atualizada
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => fileInput.current?.click()}
            disabled={update.isPending}
          >
            <Camera className="h-3.5 w-3.5" />
            {currentImage ? 'Trocar foto' : 'Enviar foto'}
          </Button>
          {currentImage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              disabled={update.isPending}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remover
            </Button>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <p className="text-center text-[11px] text-muted-foreground">
          PNG, JPG ou WEBP · até 5MB · será otimizado automaticamente
        </p>
      </CardContent>
    </Card>
  );
}

/* ============================================================
   Nome
============================================================ */
function NameForm({
  initialName,
  onSaved,
}: {
  initialName: string;
  onSaved: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => setName(initialName), [initialName]);

  const update = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      onSaved();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    },
    onError: (err) => setError(err.message),
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    update.mutate({ name });
  }

  const dirty = name.trim() !== initialName.trim();

  return (
    <Card>
      <CardContent className="p-6">
        <SectionHeader
          icon={UserRound}
          title="Dados pessoais"
          description="Esse nome aparece na barra lateral e nas suas saudações."
        />

        <form onSubmit={onSubmit} className="mt-5 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Nome</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              minLength={2}
              maxLength={80}
              required
            />
          </div>

          {error && (
            <Alert>{error}</Alert>
          )}
          {success && !error && (
            <SuccessAlert>Nome atualizado.</SuccessAlert>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={!dirty || update.isPending}>
              {update.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/* ============================================================
   Senha
============================================================ */
function PasswordForm() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const update = trpc.user.updatePassword.useMutation({
    onSuccess: () => {
      setCurrent('');
      setNext('');
      setConfirm('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    },
    onError: (err) => setError(err.message),
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (next !== confirm) {
      setError('A confirmação não bate com a nova senha');
      return;
    }
    if (next.length < 8) {
      setError('Nova senha precisa de ao menos 8 caracteres');
      return;
    }
    update.mutate({ currentPassword: current, newPassword: next });
  }

  const strength = passwordStrength(next);

  return (
    <Card>
      <CardContent className="p-6">
        <SectionHeader
          icon={KeyRound}
          title="Segurança"
          description="Altere sua senha. Você precisa informar a senha atual."
        />

        <form onSubmit={onSubmit} className="mt-5 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="cur-pass">Senha atual</Label>
            <div className="relative">
              <Input
                id="cur-pass"
                type={showCurrent ? 'text' : 'password'}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-cocoa-900"
                aria-label={showCurrent ? 'Esconder' : 'Mostrar'}
                tabIndex={-1}
              >
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-pass">Nova senha</Label>
              <div className="relative">
                <Input
                  id="new-pass"
                  type={showNext ? 'text' : 'password'}
                  value={next}
                  onChange={(e) => setNext(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNext((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-cocoa-900"
                  aria-label={showNext ? 'Esconder' : 'Mostrar'}
                  tabIndex={-1}
                >
                  {showNext ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-pass">Confirmar nova senha</Label>
              <Input
                id="confirm-pass"
                type={showNext ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
          </div>

          {/* Indicador de força */}
          {next.length > 0 && (
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Força da senha</span>
                <span
                  className={cn(
                    'font-medium',
                    strength.score >= 3
                      ? 'text-emerald-700'
                      : strength.score >= 2
                        ? 'text-amber-700'
                        : 'text-rose-700',
                  )}
                >
                  {strength.label}
                </span>
              </div>
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-1 flex-1 rounded-full transition-colors',
                      i < strength.score
                        ? strength.score >= 3
                          ? 'bg-emerald-500'
                          : strength.score >= 2
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        : 'bg-secondary',
                    )}
                  />
                ))}
              </div>
            </div>
          )}

          {error && <Alert>{error}</Alert>}
          {success && !error && <SuccessAlert>Senha alterada com sucesso.</SuccessAlert>}

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={
                update.isPending ||
                !current ||
                !next ||
                next !== confirm ||
                next.length < 8
              }
            >
              {update.isPending ? 'Atualizando...' : 'Alterar senha'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/* ============================================================
   Helpers
============================================================ */
function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof UserRound;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-soft">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h2 className="font-display text-lg font-semibold tracking-tight text-cocoa-900">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function Alert({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function SuccessAlert({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
      <Check className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function passwordStrength(p: string): { score: number; label: string } {
  if (!p) return { score: 0, label: '' };
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 12) s++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
  if (/\d/.test(p) && /[^a-zA-Z0-9]/.test(p)) s++;
  return {
    score: s,
    label: ['Fraca', 'Fraca', 'Razoável', 'Boa', 'Forte'][Math.min(s, 4)],
  };
}

/* Comprime a imagem no navegador via canvas → JPEG.
   Mantém proporção, redimensiona para `maxDim` no maior lado. */
async function compressImage(file: File, maxDim: number, quality: number): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = () => reject(new Error('read fail'));
    fr.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('img fail'));
    i.src = dataUrl;
  });

  const ratio = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.round(img.width * ratio);
  const h = Math.round(img.height * ratio);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas fail');
  ctx.drawImage(img, 0, 0, w, h);

  return canvas.toDataURL('image/jpeg', quality);
}
