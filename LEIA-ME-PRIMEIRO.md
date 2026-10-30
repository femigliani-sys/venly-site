# VENLY ESPORTS — leia-me primeiro

Este pacote contém o site completo da **Venly Esports** (Next.js 15 + React 19),
agora com **banco de dados PostgreSQL no Supabase** e **uploads no Supabase Storage** —
a combinação que funciona no deploy da **Vercel**.

> A versão anterior usava SQLite em arquivo, o que **não funciona na Vercel**
> (o disco do servidor é temporário). Esta versão já está adaptada.

---

## 1. Requisitos

- **Node.js 20 LTS** (ou 20.x) — https://nodejs.org
- npm 10+
- Conta gratuita no **Supabase** — https://supabase.com
- Conta na **Vercel** (deploy) — https://vercel.com

---

## 2. As chaves que você precisa pegar no Supabase

Você vai preencher **5 chaves obrigatórias**. Todas saem do painel do Supabase:

| # | Variável | Onde pegar |
| --- | --- | --- |
| 1 | `DATABASE_URL` | **Project Settings → Database → Connection string → URI** (aba *Transaction pooler*, porta **6543**) |
| 2 | `NEXT_PUBLIC_SUPABASE_URL` | **Project Settings → API → Project URL** |
| 3 | `SUPABASE_SERVICE_ROLE_KEY` | **Project Settings → API → `service_role` (secret)** |
| 4 | `AUTH_SECRET` | Você gera: `openssl rand -hex 32` (o `npm run setup` gera sozinho) |
| 5 | `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` no local; seu domínio em produção |

E **2 recomendadas** para o painel:

| Variável | Valor |
| --- | --- |
| `ADMIN_EMAIL` | `admin@venly.local` (ou o seu) |
| `ADMIN_PASSWORD` | uma senha forte com 16+ caracteres (**obrigatória na Vercel**) |

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` é um segredo. Nunca coloque `NEXT_PUBLIC_` no nome
> dela e nunca faça commit do `.env.local`.

A explicação de cada chave (e as opcionais de pagamento/e-mail/analytics) está no
`README.md` → seção **1. Chaves que você precisa configurar**.

---

## 3. Instalar e rodar localmente

Dentro da pasta `venly-esports`:

```bash
npm ci          # instala as dependências exatas
npm run setup   # cria .env.local com AUTH_SECRET aleatório
```

Abra o `.env.local` e preencha:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres.SEU_PROJETO:SENHA@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
ADMIN_EMAIL=admin@venly.local
ADMIN_PASSWORD=uma-senha-forte-com-16-caracteres
AUTH_SECRET=ja-gerado-pelo-setup
```

Depois:

```bash
npm run db:migrate   # cria as tabelas, os buckets do Storage e o admin
npm run dev          # abre em http://localhost:3000
```

O banco já vem com **6 mapas** e **6 produtos demonstrativos** (criados no
primeiro acesso). O painel fica em **http://localhost:3000/admin** com
`ADMIN_EMAIL` + `ADMIN_PASSWORD`.

Produção local: `npm run build && npm start`.

---

## 4. Deploy na Vercel

1. Suba o código para o GitHub (seção 6).
2. Rode a migração uma vez, do seu computador, apontando para o banco de produção:
   ```bash
   DATABASE_URL="postgresql://postgres...:6543/postgres?sslmode=require" \
   SUPABASE_URL="https://SEU_PROJETO.supabase.co" \
   SUPABASE_SERVICE_ROLE_KEY="sua-service-role-key" \
   ADMIN_EMAIL="admin@venly.local" ADMIN_PASSWORD="sua-senha-forte" \
   npm run db:migrate
   ```
3. Na Vercel: **Add New → Project → importar o repositório**.
   Framework: *Next.js* (automático) · Node 20 · Build: `npm run build`.
4. Em **Environment Variables**, adicione as 7 chaves da seção 2
   (marque Production, Preview e Development).
5. **Deploy**. Depois copie o domínio gerado, atualize `NEXT_PUBLIC_SITE_URL`
   e faça um **Redeploy**.
6. Abra `https://SEU-SITE/api/health` → deve retornar `"status":"healthy"`.
   Entre em `/admin`, publique um mapa de teste e envie uma imagem para
   confirmar o Storage.

Passo a passo detalhado (região, domínio, logs, backups): `README.md` → seção **4**.

---

## 5. O que já funciona e o que precisa de credencial

**Funciona sem configuração extra (além das 5 chaves obrigatórias):**

- todas as páginas públicas e o painel admin;
- cadastro de mapas, produtos, integrantes, categorias e textos;
- pedidos de orçamento e contato (gravados no Postgres, com protocolo);
- upload de imagens (Supabase Storage) e anexos privados com URL assinada;
- carrinho e registro de pedido **sem** cobrança;
- gerenciamento de consentimento de cookies (LGPD) com registro no servidor.

**Desativado por falta de credenciais (e o site informa isso com clareza):**

- pagamento real (Mercado Pago) — o checkout aparece como **não ativado**;
- envio de e-mails (Resend);
- Google Analytics / scripts de publicidade.

Nenhum pagamento é simulado como se fosse real.

---

## 6. Enviar para o GitHub (já está pronto)

O pacote já vem com o repositório Git inicializado (branch `main`, commit inicial
e tag `v1.0.0`). Só falta apontar para o seu repositório:

```bash
git log --oneline                    # confira o histórico
git remote add origin https://github.com/SEU-USUARIO/venly-esports.git
git push -u origin main --tags
```

Ou, com o GitHub CLI: `gh repo create venly-esports --private --source=. --remote=origin --push`.

Já incluído: `.gitignore`, `.gitattributes`, CI (typecheck + build + migração em
Postgres), Dependabot, templates de PR/issue, `CONTRIBUTING.md`, `SECURITY.md` e
`LICENSE`. Recomendações pós-criação (proteger `main`, repositório privado,
integração com a Vercel) estão no `README.md` → seção **5**.

O `.gitignore` protege `.env.local`, banco, uploads e credenciais — nada disso vai
para o GitHub.

## 7. Comandos úteis

| Comando | O que faz |
| --- | --- |
| `npm run dev` | desenvolvimento em `localhost:3000` |
| `npm run build` / `npm start` | build e execução de produção |
| `npm run setup` | cria `.env.local` + `AUTH_SECRET` |
| `npm run db:migrate` | cria/atualiza as tabelas e buckets (seguro repetir) |
| `npm run db:reset` | **apaga tudo** e recria (só em dev/preview) |
| `npm run admin:password` | redefine a senha do admin |
| `npm run test:e2e` | 51 verificações no navegador (site precisa estar rodando) |
| `npm run typecheck` | checagem de TypeScript |

---

## 8. Estrutura resumida

```
src/app/          páginas públicas + rotas de API
src/components/   UI, carrinho, consentimento e painel admin
src/lib/          banco (Postgres), consultas, autenticação, Storage, pagamentos
supabase/         schema.sql (tabelas + RLS)
public/           logo oficial, imagens e artes demonstrativas
scripts/          migração, senha do admin, setup e suíte E2E
```

**Não substitua** `public/logo.png` — é a logo oficial enviada pela Venly.

---

## 9. Problemas comuns

| Sintoma | Solução |
| --- | --- |
| Tela “BANCO DE DADOS NÃO CONFIGURADO” | Falta `DATABASE_URL` ou a migração: rode `npm run db:migrate` |
| `password authentication failed` | Confira a senha na `DATABASE_URL` (Supabase → Database → Reset password) |
| `self-signed certificate` | Acrescente `?sslmode=require` na `DATABASE_URL` |
| `prepared statement already exists` | Use o Transaction pooler (porta 6543), não a conexão direta |
| Upload falha | Confira `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` e rode `npm run db:migrate` |
| Senha do admin errada | `ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run admin:password` |
| Vercel mostra erro 500 na primeira visita | Veja *Deployments → Functions → Logs*; normalmente é `DATABASE_URL` ausente |
| Site lento no primeiro acesso | Plano gratuito do Supabase estava pausado (acesse o painel para reativar) |
