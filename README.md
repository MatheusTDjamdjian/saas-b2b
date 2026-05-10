# 🍒 ConfeitaPro

> Sistema de gestão SaaS para confeitarias e doceiras de encomenda. Pare de perder dinheiro a cada encomenda.

ConfeitaPro é a primeira plataforma feita para confeiteiras de encomenda no Brasil. Calcula o custo real de cada receita, organiza encomendas, controla pagamentos parciais e mostra de uma vez por todas quanto você está ganhando de verdade.

---

## ✨ Funcionalidades

- 📦 **Encomendas** — calendário visual com máquina de estados validada (aguardando → confirmado → em produção → pronto → entregue)
- 🧁 **Receitas com custo automático** — cadastre ingredientes uma vez, sistema calcula o custo unitário e sugere preço de venda
- 🥣 **Ingredientes** — controle de matérias-primas com custo por unidade calculado automaticamente
- 👥 **Clientes** — cadastro com histórico
- 💰 **Pagamentos parciais** — controle de sinal e quitação (50% adiantado / 50% entrega)
- 📊 **Dashboard** — encomendas do dia, receita do mês, a receber
- 💳 **Billing Stripe** — plano gratuito + Pro (R$ 79/mês) + Business (R$ 149/mês), trial de 14 dias
- 🔐 **Multi-tenant** — dados de cada confeitaria isolados por `tenant_id`
- 👤 **Perfil do usuário** — troca de senha e foto

---

## 🛠 Stack

| Camada | Tecnologia |
| --- | --- |
| Frontend | Next.js 15 (App Router, RSC, Server Actions) |
| API | tRPC v11 — type-safety end-to-end |
| ORM | Drizzle ORM |
| Database | PostgreSQL |
| Auth | Auth.js v5 (Credentials + JWT) |
| Pagamentos | Stripe Subscriptions + Customer Portal |
| Styling | Tailwind CSS + primitives shadcn-style |
| Validação | Zod (compartilhado client/server) |
| Tipografia | Inter + Fraunces via `next/font/google` |

---

## 📁 Estrutura

```
ConfeitaPro/
├── src/
│   ├── app/
│   │   ├── (auth)/              # Login e registro
│   │   ├── (onboarding)/        # Setup inicial do tenant
│   │   ├── (dashboard)/         # App protegido (sidebar + páginas)
│   │   └── api/
│   │       ├── trpc/            # Endpoint tRPC
│   │       ├── auth/            # Handlers Auth.js
│   │       └── webhooks/stripe/ # Webhook Stripe
│   ├── server/
│   │   ├── trpc.ts              # Init + middlewares (auth, tenant)
│   │   ├── context.ts
│   │   └── routers/             # Routers tRPC por domínio
│   ├── db/
│   │   ├── schema.ts            # Schema Drizzle completo
│   │   └── index.ts
│   ├── domain/                  # Lógica de negócio sem framework
│   │   ├── pricing/recipeCost.ts
│   │   └── orders/statusMachine.ts
│   ├── lib/                     # auth, stripe, env, format, utils
│   ├── components/              # UI + dashboard + orders
│   └── middleware.ts            # Gate de autenticação
├── drizzle.config.ts
├── tailwind.config.ts
└── package.json
```

---

## 🚀 Setup local

### Pré-requisitos

- Node.js ≥ 20
- PostgreSQL ≥ 14 (local ou serviço gerenciado)
- Conta Stripe em modo teste

### Passo a passo

```bash
# 1. Instalar dependências
npm install

# 2. Subir Postgres local (Docker)
docker run --name confeitapro-db \
  -e POSTGRES_PASSWORD=dev \
  -e POSTGRES_DB=confeitapro \
  -p 5432:5432 -d postgres:16

# 3. Configurar variáveis de ambiente
cp .env.example .env
# edite .env com suas credenciais

# 4. Sincronizar schema com o banco
npm run db:push

# 5. Subir o app
npm run dev
```

Disponível em [http://localhost:3000](http://localhost:3000).

### Webhooks Stripe (terminal separado)

```bash
npm run stripe:listen
# copie o whsec_... que aparece pro seu .env e reinicie o dev
```

---

## 🔑 Variáveis de ambiente

```bash
# Banco
DATABASE_URL="postgresql://user:pass@localhost:5432/confeitapro"

# Auth.js (gere com: openssl rand -base64 32)
AUTH_SECRET="..."
AUTH_URL="http://localhost:3000"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PRICE_PRO="price_..."
NEXT_PUBLIC_STRIPE_PRICE_BUSINESS="price_..."

NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 📜 Scripts disponíveis

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm start` | Inicia em modo produção (após `build`) |
| `npm run lint` | Lint via ESLint |
| `npm run db:generate` | Gera arquivo SQL de migration a partir do schema |
| `npm run db:migrate` | Aplica migrations geradas |
| `npm run db:push` | Sincroniza schema → banco direto (sem migration file) |
| `npm run db:studio` | Abre Drizzle Studio (UI visual do banco) |
| `npm run stripe:listen` | Encaminha webhooks Stripe pra rota local |

---

## 🏢 Multi-tenancy — como funciona

Estratégia: **shared-schema com coluna `tenant_id`** (padrão da indústria pra SaaS B2B SMB).

- Toda tabela de domínio (`customers`, `ingredients`, `recipes`, `orders`, etc) tem `tenant_id` NOT NULL com FK pra `tenants`
- O middleware `tenantProcedure` no tRPC injeta `ctx.tenantId` automaticamente da sessão
- **Toda query de domínio é forçada a filtrar por `tenant_id`** — code review rejeita queries que não filtram
- Cookie `tenant_id` permite que um mesmo usuário troque entre confeitarias (caso multi-loja)
- Roles na tabela `memberships`: `OWNER`, `ADMIN`, `STAFF`

---

## 💵 Planos

| Plano | Preço | Limite |
| --- | --- | --- |
| Gratuito | R$ 0 | Até 10 pedidos/mês · 1 usuário |
| Profissional | R$ 79/mês | Pedidos ilimitados · até 3 usuários · cálculo automático |
| Negócio | R$ 149/mês | Tudo do Pro · usuários ilimitados · suporte prioritário |

Trial de 14 dias automático no signup. Webhook Stripe cuida do ciclo de vida (`trialing` → `active` → `past_due` → `canceled`).

---

## 🚢 Deploy sugerido

- **Frontend** → Vercel (deploy automático via push)
- **Database** → Railway / Neon / Supabase
- **Stripe** → adicionar endpoint de produção em `https://seudominio.com/api/webhooks/stripe`
- **Variáveis** → replicar `.env` na Vercel (lembre de trocar `localhost` para o domínio real)

---

## 🗺 Roadmap

- [ ] Recuperação de senha via email (Resend)
- [ ] Convite de membros ao tenant (multi-staff)
- [ ] Row-Level Security no Postgres como segunda camada
- [ ] Rate limiting (Upstash)
- [ ] Testes (começando pelo domínio puro: `recipeCost`, `statusMachine`)
- [ ] Dark mode
- [ ] Integração WhatsApp Business
- [ ] Exportação PDF de relatórios mensais

---

## 📄 Licença

Proprietário — todos os direitos reservados.

---

<p align="center">Feito por Matheus Tasso Djamdjian</p>