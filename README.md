# VENLY ESPORTS — site oficial (Next.js + Supabase + Vercel)

Site completo da **Venly Esports**: comunidade gamer, competitividade, portfólio de mapas (**Venly Creates**), captação de orçamentos, loja oficial, equipe, páginas institucionais e painel administrativo protegido.

Agora com **PostgreSQL (Supabase)** como banco de dados e **Supabase Storage** para uploads — a combinação que funciona no **deploy da Vercel** (serverless, sem disco local).

> **Novo por aqui?** Comece pelo [`LEIA-ME-PRIMEIRO.md`](./LEIA-ME-PRIMEIRO.md) (instalação em 3 passos) e volte aqui para as chaves e o deploy.

> **Status honesto:** a versão é funcional de ponta a ponta. Pagamentos, e-mails e analytics **dependem de credenciais externas** e ficam explicitamente desativados até serem configurados. Mapas, produtos, preços e textos são **provisórios/demonstrativos** e estão sinalizados como tal. A conformidade com a LGPD depende de revisão jurídica e da configuração real de produção.

---

## 1. Chaves que você precisa configurar

Crie um projeto no [Supabase](https://supabase.com), copie os valores e preencha **o `.env.local`** (local) e **as Environment Variables da Vercel** (produção). Nada de chave secreta vai para o navegador.

### Obrigatórias

| Variável | Onde pegar no Supabase / como gerar | Para que serve |
| --- | --- | --- |
| `DATABASE_URL` | **Project Settings → Database → Connection string → URI** (use o **Transaction pooler**, porta **6543**, e mantenha `?sslmode=require`) | Conexão do site com o Postgres. É o coração da aplicação. |
| `NEXT_PUBLIC_SUPABASE_URL` | **Project Settings → API → Project URL** (`https://xxxxxxxx.supabase.co`) | Monta as URLs públicas das imagens no Storage. Pode ser exposta ao navegador. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Project Settings → API → `service_role` (secret)** | Upload/leitura de arquivos no Storage. **Segredo absoluto — só no servidor.** |
| `AUTH_SECRET` | Gere com `openssl rand -hex 32` (ou `npm run setup` gera para você) | Assina o hash do rate limiting e reforça CSRF. |
| `NEXT_PUBLIC_SITE_URL` | Sua URL final. Local: `http://localhost:3000`. Produção: `https://seu-dominio.com` (ou `https://seu-projeto.vercel.app`) | SEO/canonical, cookies `Secure` e URL de retorno do Mercado Pago. |

### Recomendadas (painel administrativo)

| Variável | Padrão | Para que serve |
| --- | --- | --- |
| `ADMIN_EMAIL` | `admin@venly.local` | E-mail de login do painel. |
| `ADMIN_PASSWORD` | (gerada aleatória) | Senha inicial do admin. **Na Vercel é obrigatória** — sem ela a senha é gerada e só aparece nos logs da função. Use 16+ caracteres. |

Se você só definir `ADMIN_PASSWORD` **depois** que o admin já existe, a senha não muda sozinha. Use `npm run admin:password` (seção 9.4).

### Opcionais

| Variável | Para que serve |
| --- | --- |
| `DIRECT_URL` | Conexão direta/session pooler (porta 5432) usada só pelo `npm run db:migrate`. Se vazia, usa `DATABASE_URL`. |
| `SUPABASE_STORAGE_BUCKET_PUBLIC` | Nome do bucket público (padrão `venly-public`). |
| `SUPABASE_STORAGE_BUCKET_PRIVATE` | Nome do bucket privado (padrão `venly-private`). |
| `MERCADO_PAGO_ACCESS_TOKEN` | Ativa o checkout real (Checkout Pro). |
| `MERCADO_PAGO_WEBHOOK_SECRET` | Valida a assinatura do webhook de pagamentos. |
| `MERCADO_PAGO_STATEMENT_DESCRIPTOR` | Nome que aparece na fatura do cliente (ex.: `VENLY`). |
| `MERCADO_PAGO_USE_SANDBOX` | `true` para testar em sandbox. |
| `NOTIFICATION_EMAIL` | Para onde vão os avisos de contato/orçamento/pedido. |
| `RESEND_API_KEY` | Envio de e-mails via [Resend](https://resend.com). |
| `EMAIL_FROM` | Remetente verificado no Resend (ex.: `Venly <contato@seudominio.com>`). |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 — só carrega **após consentimento**. |
| `NEXT_PUBLIC_ADS_SCRIPT_URL` | Script de publicidade — só carrega **após consentimento**. |

> **Regra de ouro:** apenas `NEXT_PUBLIC_*` vai para o navegador. `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `AUTH_SECRET` e tokens de pagamento/e-mail são **exclusivamente do servidor**. Se você prefixar a service role com `NEXT_PUBLIC_`, ela vira pública e qualquer visitante acessa seu banco.

Sem as chaves opcionais o site **funciona e diz a verdade**: checkout aparece como *não ativado*, nenhum e-mail é enviado (a mensagem fica no banco) e nenhum script de terceiros é carregado.

---

## 2. Início rápido (local)

Requisitos: **Node.js 20 LTS** (veja `.nvmrc`) e uma conta gratuita no Supabase.

```bash
cd venly-esports
npm ci                # instala as versões exatas
npm run setup         # cria .env.local + AUTH_SECRET aleatório
# edite .env.local e preencha DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL,
# SUPABASE_SERVICE_ROLE_KEY e ADMIN_PASSWORD
npm run db:migrate    # cria tabelas, buckets e o admin inicial
npm run dev           # http://localhost:3000
```

O `db:migrate` é idempotente (pode rodar quantas vezes quiser). Os dados demonstrativos — 6 mapas, 6 produtos, categorias e textos — são criados automaticamente pelo site **no primeiro acesso**, depois que as tabelas existem.

Produção local:

```bash
npm run build && npm start
```

> **Precisa de um Postgres para testar sem criar conta?** Instale o Postgres local e aponte `DATABASE_URL=postgresql://usuario:senha@127.0.0.1:5432/venly`. Sem `NEXT_PUBLIC_SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`, os uploads usam o disco (`data/uploads/`) — modo apenas de desenvolvimento.

---

## 3. Configurando o Supabase (passo a passo)

1. **Criar o projeto** — [supabase.com](https://supabase.com) → *New project*. Anote a senha do banco e escolha a região mais próxima (ex.: `South America (São Paulo)`).
2. **Copiar a connection string** — *Project Settings → Database → Connection string → URI*. Use a aba **Transaction pooler** (porta `6543`) e substitua `[YOUR-PASSWORD]` pela senha do banco:
   ```
   postgresql://postgres.SEU_PROJETO:SENHA@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require
   ```
   Essa é a `DATABASE_URL`. Para o `db:migrate`, se quiser, use a **Session pooler** (porta `5432`) em `DIRECT_URL`.
3. **Copiar as chaves da API** — *Project Settings → API*: `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`; `service_role` → `SUPABASE_SERVICE_ROLE_KEY`.
4. **Aplicar o schema** — no seu computador, com o `.env.local` preenchido:
   ```bash
   npm run db:migrate
   ```
   O script aplica `supabase/schema.sql`, cria o admin inicial e cria os buckets `venly-public` (público) e `venly-private` (privado).
   *Alternativa sem rodar Node:* cole o conteúdo de `supabase/schema.sql` no **SQL Editor** do Supabase e crie os buckets manualmente em **Storage → New bucket**.
5. **Conferir** — `curl http://localhost:3000/api/health` deve retornar `"database":"ok"` e `"storage":"supabase_storage"`.

### O que o schema cria

11 tabelas: `admins`, `sessions`, `settings`, `categories`, `maps`, `map_requests`, `products`, `orders`, `members`, `contacts`, `consent_logs` e `rate_limits`. Todas com **RLS habilitado** (a chave anônima não lê nem escreve nada — todo acesso é server-side com a connection string). Há índices em sessões, categorias e logs de consentimento. Arquivo: [`supabase/schema.sql`](./supabase/schema.sql).

---

## 4. Deploy na Vercel (passo a passo)

O projeto já está preparado para a Vercel: todas as páginas são dinâmicas (`force-dynamic`), o `pg` é carregado só no servidor e **nada é gravado em disco** — uploads vão para o Supabase Storage.

1. **Suba o código para o GitHub** (seção 5).
2. **Rode a migração** apontando para o banco de produção (uma vez, do seu computador):
   ```bash
   DATABASE_URL="postgresql://postgres.SEU_PROJETO:SENHA@...pooler.supabase.com:6543/postgres?sslmode=require" \
   SUPABASE_URL="https://SEU_PROJETO.supabase.co" \
   SUPABASE_SERVICE_ROLE_KEY="SUA_SERVICE_ROLE_KEY" \
   ADMIN_EMAIL="admin@venly.local" ADMIN_PASSWORD="sua-senha-forte" \
   npm run db:migrate
   ```
   *(Também é possível rodar o `supabase/schema.sql` no SQL Editor e criar os buckets na mão.)*
3. **Importar na Vercel** — [vercel.com/new](https://vercel.com/new) → selecione o repositório.
   - **Framework Preset:** Next.js (detectado automaticamente)
   - **Root Directory:** `./` (ou `venly-esports` se o projeto estiver dentro de uma pasta no repositório)
   - **Build Command:** `npm run build` · **Install Command:** `npm ci`
   - **Node.js Version:** 20.x
4. **Environment Variables** — adicione, para **Production, Preview e Development**:
   ```
   DATABASE_URL
   NEXT_PUBLIC_SUPABASE_URL
   SUPABASE_SERVICE_ROLE_KEY
   AUTH_SECRET
   NEXT_PUBLIC_SITE_URL
   ADMIN_EMAIL
   ADMIN_PASSWORD
   ```
   (As opcionais entram depois, se você for usar pagamento/e-mail/analytics.)
5. **Deploy.** Ao terminar, copie o domínio (ex.: `https://venly-esports.vercel.app`) e:
   - atualize `NEXT_PUBLIC_SITE_URL` com esse domínio;
   - faça um **Redeploy** (variáveis `NEXT_PUBLIC_*` são embutidas no build).
6. **Validar** — abra `https://SEU-SITE/api/health` (deve dizer `"status":"healthy"`), entre em `/admin` com `ADMIN_EMAIL`/`ADMIN_PASSWORD`, publique um mapa de teste e envie uma imagem para confirmar o Storage.

### Dicas de produção na Vercel

- **Região:** escolha a mesma região do Supabase (ex.: `gru1` — São Paulo) em *Settings → Functions* para reduzir latência.
- **Plano gratuito do Supabase** pausa o projeto após dias sem uso; o primeiro acesso depois disso pode falhar até o projeto "acordar". Planos pagos têm backup diário.
- **Domínio próprio:** *Settings → Domains*. Depois atualize `NEXT_PUBLIC_SITE_URL` e faça redeploy (HTTPS ativa cookies `Secure`).
- **Logs:** *Deployments → Functions → Logs* mostra erros de banco e a senha inicial do admin, caso `ADMIN_PASSWORD` não tenha sido definida.
- **Nada de arquivos locais:** em produção, uploads sem Storage configurado falham com uma mensagem clara (o disco da Vercel é temporário).
- **`X-Frame-Options`** foi removido para permitir o preview embarcado; em produção adicione CSP com `frame-ancestors` (seção 12).

---

## 5. GitHub — já está pronto

O pacote vem com **repositório Git inicializado**: branch `main`, commit inicial e
tag `v1.0.0`. Para publicar, basta apontar para o seu repositório e dar push.

```bash
cd venly-esports

git log --oneline          # confira o commit inicial
git status                 # deve estar limpo

git remote add origin https://github.com/SEU-USUARIO/venly-esports.git
git push -u origin main --tags
```

Com o GitHub CLI, tudo em um comando (cria o repositório privado e envia):

```bash
gh repo create venly-esports --private --source=. --remote=origin --push
```

> Prefere começar sem histórico? `rm -rf .git && git init -b main && git add . && git commit -m "feat: site Venly Esports"`.

### O que já está configurado no repositório

| Arquivo | Para que serve |
| --- | --- |
| `.gitignore` | Protege `.env.local`, banco, uploads, credenciais e caches |
| `.gitattributes` | Normaliza fim de linha (LF) e marca imagens como binárias |
| `.editorconfig` | Padroniza indentação entre editores |
| `.nvmrc` | Fixa Node 20 |
| `.env.example` | Documenta **todas** as chaves, sem valores reais |
| `.github/workflows/ci.yml` | CI em 2 jobs: *typecheck + build* e *migração + smoke com Postgres* |
| `.github/dependabot.yml` | Atualizações semanais de dependências e Actions |
| `.github/PULL_REQUEST_TEMPLATE.md` | Checklist de PR (testes, segredos, LGPD) |
| `.github/ISSUE_TEMPLATE/*` | Templates de bug e de melhoria |
| `CONTRIBUTING.md` | Fluxo de branches, commits e regras de segurança |
| `SECURITY.md` | Canal de reporte de vulnerabilidades e escopo |
| `LICENSE` | Licença proprietária da Venly Esports |

O CI **não precisa de segredos**: o job de qualidade builda sem banco e o job de
banco sobe um Postgres temporário no runner, aplica `supabase/schema.sql` e
valida `/api/health`, `/`, `/creates`, `/loja` e `/admin`.

### Depois de criar o repositório (recomendado)

1. **Settings → Branches** → proteger `main`: exigir PR + status check `CI` antes do merge.
2. **Settings → Secrets and variables → Actions** → nenhum segredo é necessário hoje; se um dia o CI precisar, use *Repository secrets* (nunca no código).
3. **Settings → General → Danger Zone** → confirme que o repositório está **privado** enquanto a marca e os textos não estiverem aprovados.
4. **Settings → Integrations → Vercel** → conecte o repositório para deploy automático a cada push (o deploy da Vercel não depende de Actions).
5. Um PR por assunto, usando o template — veja `CONTRIBUTING.md`.

⚠️ **Se você já tinha um `.git` antigo com `.env.local` commitado**, o histórico
manteria os segredos: nesse caso troque `AUTH_SECRET`/senhas e comece um histórico
novo (`rm -rf .git && git init`).

## 6. Tecnologias

| Camada | Escolha |
| --- | --- |
| Interface + servidor | Next.js 15 (App Router), React 19, TypeScript |
| Estilo | Tailwind CSS 3 + CSS customizado (identidade rosa/preto) |
| Ícones | lucide-react |
| Fontes | Rajdhani (títulos) + Inter (texto), auto-hospedadas via `@fontsource` — sem requisições externas |
| Banco de dados | **PostgreSQL no Supabase** via `pg` (pool), validação no servidor com Zod |
| Uploads | **Supabase Storage** (bucket público + privado com URL assinada); fallback em disco no modo local |
| Autenticação | Sessão no servidor, senha com `scrypt` + salt, cookie httpOnly SameSite=Strict, CSRF duplo envio, rate limit em Postgres |
| Markdown | `react-markdown` + `remark-gfm` para as políticas editáveis |
| Pagamentos | Mercado Pago Checkout Pro (opcional, via REST) |
| E-mail | Resend (opcional, via REST) |
| Deploy | **Vercel** (serverless) — também roda em VPS/Docker |
| Testes | Playwright (51 verificações end-to-end) |

---

## 7. Rotas

| Rota | Descrição |
| --- | --- |
| `/` | Home com hero, divisões, destaques e CTA |
| `/creates` | Venly Creates + portfólio com filtros e busca |
| `/creates/mapa/[slug]` | Detalhe do projeto (galeria, status, relacionados) |
| `/solicitar-mapa` | Formulário de orçamento com anexos |
| `/loja` | Catálogo com busca, filtros e ordenação |
| `/loja/produto/[slug]` | Detalhe do produto (tamanhos, estoque, relacionados) |
| `/carrinho` | Carrinho persistente |
| `/checkout` | Finalização (avisa quando o pagamento está desativado) |
| `/checkout/retorno` | Retorno do gateway |
| `/equipe` | Integrantes oficiais (vazio por padrão, sem inventar pessoas) |
| `/sobre` | História, missão, visão, valores e áreas |
| `/contato` | Contato comercial |
| `/privacidade` | Política de Privacidade |
| `/cookies` | Política de Cookies + estado atual do consentimento |
| `/termos` | Termos de Uso |
| `/admin` | Painel protegido |
| `/api/health` | Diagnóstico (banco, storage, checkout, e-mail, analytics) |
| `/sitemap.xml`, `/robots.txt` | SEO |

---

## 8. Identidade visual e logo oficial

- A logo enviada pela Venly está em `public/logo.png` — **sem alteração**, respeitando formato e proporções. O favicon (`public/favicon.ico`) foi derivado dela.
- Paleta: magenta `#FF008F` como destaque, fundos preto/azul-preto (`ink-950`, `ink-900`, `ink-850`), tipografia Rajdhani (títulos) + Inter (texto).
- Texturas, brilhos e grids são CSS puro (sem imagens externas) e as animações respeitam `prefers-reduced-motion`.
- **Não substitua** `public/logo.png` por uma versão recriada.

---

## 9. Painel administrativo (`/admin`)

Login em `/admin` com `ADMIN_EMAIL` + `ADMIN_PASSWORD` (ou a senha de `data/ADMIN_CREDENTIALS.txt`, se foi gerada automaticamente).

| Aba | O que permite |
| --- | --- |
| Visão geral | Estatísticas (mapas, produtos, solicitações, pedidos, receita aprovada) |
| Mapas | CRUD, capa/galeria, vídeo, destaque, status, reordenação |
| Produtos | CRUD, preço, estoque, tamanhos, imagens, ativo/inativo |
| Categorias | CRUD por tipo (mapa/produto/integrante) com renomear em cascata |
| Integrantes | CRUD, foto, redes sociais, categoria |
| Solicitações | Pedidos de orçamento, anexos privados, status e notas |
| Pedidos | Itens, cliente, status e status de pagamento |
| Contatos | Mensagens recebidas e status |
| Consentimentos | Registro anônimo de consentimento (LGPD) |
| Conteúdo | Todos os textos da home, sobre, creates, loja, contato, políticas, rodapé e redes sociais |
| Configurações | Alterar senha, ver estado das integrações |

### 9.1 Uploads

As imagens enviadas no painel vão para o bucket público do Supabase e voltam como URL do CDN. Os anexos de orçamento vão para o bucket **privado**: o admin recebe uma **URL assinada** de 15 minutos; ninguém mais acessa. Validação de MIME + *magic bytes*, limite de 5 MB e nomes aleatórios.

### 9.2 Conteúdo editável

Tudo em `settings.content` (JSON) e mesclado com os padrões do código — campos novos em versões futuras não quebram o conteúdo salvo.

### 9.3 Migrações

```bash
npm run db:migrate    # aplica supabase/schema.sql (idempotente)
npm run db:reset      # APAGA tudo e recria (somente em desenvolvimento/preview)
```

### 9.4 Senha do admin

```bash
ADMIN_EMAIL="admin@venly.local" ADMIN_PASSWORD="nova-senha-forte" npm run admin:password
```

Atualiza (ou cria) o admin, invalida as sessões ativas e libera o login novo. Também é possível trocar em **Painel → Configurações → Alterar senha**.

---

## 10. Formulários e fluxos

### Orçamento (`/solicitar-mapa`)
Validação Zod no servidor, honeypot, rate limit por IP (hash), até 4 anexos privados, protocolo `VM-ANO-00001`, gravação no banco e e-mail opcional. A confirmação deixa claro que **nenhuma cobrança é feita**.

### Loja e checkout
Carrinho no navegador com revalidação no servidor: preço, tamanho e estoque são conferidos no banco ao criar o pedido; o total é recalculado no servidor. **Sem `MERCADO_PAGO_ACCESS_TOKEN` o checkout aparece como desativado**, o pedido é registrado e a resposta diz explicitamente que nada foi cobrado. **Nenhum pagamento é simulado.** Frete ainda não é calculado (o site informa “frete a calcular”).

---

## 11. Privacidade, LGPD e cookies

- **Por padrão só cookies estritamente necessários.** Analytics e publicidade ficam desligados até consentimento válido; categorias opcionais nunca vêm pré-marcadas.
- O banner oferece **Aceitar todos / Recusar opcionais / Preferências** com o mesmo destaque visual (sem *dark pattern*), permite **retirar o consentimento** depois e reabre quando a versão do aviso muda.
- Cada decisão é registrada de forma **anônima** em `consent_logs` (token aleatório, categorias, ação, data) — sem IP e sem e-mail. Retenção de ~13 meses.
- Scripts opcionais só são injetados após consentimento e apenas se as chaves estiverem configuradas.
- O site informa quais dados coleta (formulários, pedidos, consentimento), a base legal, o canal do encarregado e os direitos do titular nas páginas `/privacidade`, `/cookies` e `/termos` — textos editáveis no painel.
- **Revisão jurídica é obrigatória antes do lançamento.**

---

## 12. Segurança

- Senhas com `scrypt` + salt; sessões no banco com expiração de 7 dias; cookie `httpOnly`, `SameSite=Strict` e `Secure` quando a URL é HTTPS.
- CSRF por duplo envio + verificação de `Origin` em todas as mutações administrativas.
- Rate limit em Postgres com **hash do IP** (o IP não é armazenado) em login, formulários, uploads, pedidos e consentimento.
- Honeypot + Zod no servidor em todos os formulários públicos.
- SQL sempre parametrizado; nomes de tabela vêm de uma *whitelist*.
- **RLS habilitado** em todas as tabelas: a `anon key` do Supabase não lê nem escreve nada; a `service_role` só é usada no servidor.
- Uploads: allowlist de MIME, verificação de *magic bytes*, 5 MB, nomes aleatórios, PDFs como anexo, anexos privados via URL assinada.
- Cabeçalhos: `nosniff`, `Referrer-Policy`, `Permissions-Policy`. Para produção, adicione CSP com `frame-ancestors` no seu domínio (o `X-Frame-Options` foi omitido só para permitir o preview desta entrega).

---

## 13. Banco de dados: detalhes operacionais

- **Modelo:** tudo que precisa persistir está em Postgres (textos, mapas, produtos, pedidos, solicitações, integrantes, consentimentos, sessões, rate limit). Não há estado em memória relevante.
- **Conexões:** o pool usa no máximo 3 conexões por instância na Vercel (`PG_POOL_MAX` ajusta). O Transaction pooler do Supabase (porta 6543) é o modo recomendado para serverless.
- **Backup:** planos pagos do Supabase têm backup diário; no gratuito use `pg_dump "$DATABASE_URL" > backup.sql`. Faça isso antes de `db:reset`.
- **Migrações futuras:** edite `supabase/schema.sql` (sempre idempotente) e rode `npm run db:migrate`.
- **Ambiente local sem Supabase:** qualquer Postgres 14+ serve; uploads caem para `data/uploads/` (ignorado pelo Git).

---

## 14. Testes

```bash
npm run typecheck   # TypeScript estrito
npm run build       # build de produção (funciona sem banco configurado)
npm run test:e2e    # Playwright — requer o site rodando + chromium instalado
```

Para o E2E: `npx playwright install chromium` (no Debian/Ubuntu: `sudo npx playwright install-deps chromium`).

O script `scripts/e2e-test.mjs` cobre:

- hero, logo oficial, navegação e **25 links internos**;
- **cookies**: banner na 1ª visita, nenhum script antes da escolha, recusar, preferências, aceitar, retirar, mudança de versão;
- **loja**: busca (com acentos), filtros, produto, carrinho e resumo;
- **checkout**: aviso de não ativado e pedido registrado sem pagamento;
- **formulários**: contato e orçamento com anexo e protocolo;
- **admin**: login, todas as abas, editor e reordenação;
- **mobile**: menu, banner e zero overflow horizontal;
- ausência de erros de console/página.

Resultado nesta entrega: **51/51 verificações aprovadas** (rodando sobre PostgreSQL 17).

---

## 15. Checklist antes de publicar

- [ ] `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` configuradas na Vercel.
- [ ] `AUTH_SECRET` forte (não o valor de exemplo) e `ADMIN_PASSWORD` com 16+ caracteres.
- [ ] `NEXT_PUBLIC_SITE_URL` com o domínio final em **HTTPS** + redeploy.
- [ ] `npm run db:migrate` executado no banco de produção; `/api/health` retorna `healthy`.
- [ ] Login no painel funcionando e senha trocada.
- [ ] Substituir mapas, produtos, preços, integrantes e textos provisórios; remover selos de demonstração.
- [ ] Revisar Privacidade, Cookies e Termos com jurídico/DPO (controlador, CNPJ, encarregado, canal).
- [ ] Configurar Mercado Pago (sandbox primeiro) e o webhook assinado, ou manter o checkout desativado de propósito.
- [ ] Configurar e-mail transacional (Resend) e conferir o recebimento.
- [ ] Adicionar CSP com `frame-ancestors`, backups e monitoramento de erros.
- [ ] Rodar `npm run typecheck`, `npm run build` e `npm run test:e2e` novamente.

---

## 16. Limitações conhecidas

- Checkout, e-mail e analytics/publicidade ficam **desativados** sem credenciais — e o site informa isso ao usuário.
- **Frete não é calculado**; o valor final precisa ser confirmado antes de cobrar.
- O estoque só é debitado após confirmação de pagamento aprovado via webhook; com o checkout desativado, pedidos não reservam estoque.
- Se você hospedar fora da Vercel (VPS/Docker), precisa de Node 20 + Postgres; uploads podem usar Supabase Storage do mesmo jeito.
- Plano gratuito do Supabase pausa por inatividade (primeiro acesso pode demorar a responder).
- Mapas e produtos iniciais são artes geradas (demonstrativas), não capturas de projetos reais.
- Nenhum integrante é cadastrado por padrão, para não inventar pessoas.
- Revisão jurídica da LGPD é obrigatória antes do lançamento.

---

## 17. Problemas comuns

| Sintoma | Causa provável | Solução |
| --- | --- | --- |
| Página de erro “BANCO DE DADOS NÃO CONFIGURADO” | `DATABASE_URL` ausente ou schema não aplicado | Preencha a variável e rode `npm run db:migrate` |
| `/api/health` com `"databaseMessage": "As tabelas do banco ainda não existem"` | Faltou migrar | `npm run db:migrate` (ou cole `supabase/schema.sql` no SQL Editor) |
| `password authentication failed for user` | Senha errada na URL | Supabase → Database → *Reset database password* e atualize a URL |
| `self[- ]signed certificate` | Falta SSL | Acrescente `?sslmode=require` no fim da `DATABASE_URL` |
| `prepared statement "s0" already exists` | Conexão direta em modo serverless | Use o **Transaction pooler** (porta 6543) |
| Upload falha com “Supabase Storage não configurado” | Faltam as chaves do Storage | Defina `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` e rode `npm run db:migrate` |
| Login não aceita a senha nova | `ADMIN_PASSWORD` só vale na criação | `ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run admin:password` |
| Esqueci a senha e não tenho acesso ao banco | — | Use `npm run admin:password` apontando para o `DATABASE_URL` de produção |
| Site “acorda” devagar depois de dias parado | Supabase free pausado | Abra o painel do Supabase para reativar (ou use plano pago) |
| Porta 3000 ocupada no local | Outro processo rodando | Feche o processo ou use `PORT=3001` no `dev`/`start` |
| Playwright não abre o navegador | Faltam libs do Chromium | `npx playwright install chromium` e `sudo npx playwright install-deps chromium` |

---

## 18. Estrutura do código

```
src/
  app/                     páginas (App Router) + route handlers em api/
  components/              UI pública, carrinho, consentimento, cards, formulários
    admin/                 painel: shell, login, editor genérico, conteúdo
  lib/
    db.ts                  pool Postgres, seed idempotente, conteúdo padrão, senhas
    queries.ts             consultas tipadas + dados do painel
    auth.ts                sessão, CSRF, Origin, cookies
    validation.ts          schemas Zod
    rate-limit.ts          rate limiting com hash de IP (Postgres)
    uploads.ts             Supabase Storage (público) + anexos privados assinados
    payments.ts            Mercado Pago + verificação de webhook
    mail.ts                notificações via Resend (opcional)
    demo-data.ts           mapas/produtos/categorias demonstrativos
    content.ts             textos provisórios/padrão (Markdown)
supabase/
  schema.sql               schema completo (idempotente, com RLS)
scripts/
  db-migrate.mjs           aplica schema + cria admin + buckets
  admin-password.mjs       redefine a senha do admin
  setup.mjs                cria .env.local + AUTH_SECRET
  e2e-test.mjs             suíte Playwright
  generate_demo_assets.py  artes demonstrativas
public/
  logo.png                 LOGO OFICIAL (inalterada)
  images/, demo/           fundos e artes substituíveis
data/                      credencial local e uploads de desenvolvimento (ignorados pelo Git)
.github/workflows/ci.yml   typecheck + build em cada push/PR
```

---

## 19. Licença e marca

O nome, a logo e a identidade da **Venly Esports** pertencem à organização. Este código foi produzido para uso da Venly; não há licença open source definida. Se quiser abrir o código, adicione um arquivo `LICENSE` (MIT, Apache-2.0 etc.).
