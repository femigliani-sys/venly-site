# Contribuindo com o site da Venly Esports

Obrigado pelo interesse. Este documento resume o fluxo de trabalho para manter o
site previsível e seguro.

---

## 1. Preparar o ambiente

```bash
git clone https://github.com/SEU-USUARIO/venly-esports.git
cd venly-esports
npm ci
npm run setup           # cria .env.local + AUTH_SECRET
npm run db:migrate      # cria tabelas/buckets no Supabase apontado por DATABASE_URL
npm run dev
```

Você precisa de um projeto Supabase (ou um Postgres local) — veja o `README.md`,
seção **1. Chaves que você precisa configurar**.

---

## 2. Antes de abrir um Pull Request

Rode os três comandos e garanta que passam:

```bash
npm run typecheck
npm run build
npm run test:e2e      # site precisa estar rodando (npm start) + chromium instalado
```

Checklist:

- [ ] Nenhuma credencial, `.env.local`, dump de banco ou upload foi commitado.
- [ ] Textos novos em português de Brasil, com acentuação correta.
- [ ] Nenhum dado de pessoa, cliente ou resultado foi inventado — conteúdo
      provisório continua marcado como demonstrativo.
- [ ] Se mexeu em banco: `supabase/schema.sql` foi atualizado de forma
      **idempotente** (`CREATE TABLE IF NOT EXISTS`, `ON CONFLICT`) e testado com
      `npm run db:migrate`.
- [ ] Se mexeu em página/rota de API: continua funcionando sem as chaves
      opcionais (pagamento, e-mail, analytics) — o site deve avisar, não quebrar.
- [ ] Acessibilidade preservada: foco visível, `aria-*`, contraste e navegação
      por teclado.

---

## 3. Branches e commits

- Branches: `feat/...`, `fix/...`, `docs/...`, `chore/...`
- Commits no padrão **Conventional Commits** em português ou inglês:
  - `feat: adiciona filtro por status no portfólio`
  - `fix: corrige contraste do botão no banner de cookies`
  - `docs: explica variáveis do Supabase`
  - `chore: atualiza dependências`
- Um PR = um assunto. Descreva **o que muda**, **por quê** e **como testou**.

---

## 4. Regras de segurança (não negociáveis)

- Toda query usa **parâmetros** (`$1`, `$2`…) — nunca interpole valores em SQL.
- Nomes de tabela vindos de rota passam por **whitelist**.
- Rotas administrativas usam `requireAdminApi` (sessão + CSRF + Origin).
- Segredos ficam em variáveis de ambiente; apenas `NEXT_PUBLIC_*` pode ir ao
  navegador. `SUPABASE_SERVICE_ROLE_KEY` jamais recebe prefixo `NEXT_PUBLIC_`.
- Consentimento de cookies: **nada** de rastreamento antes da escolha do usuário.
- Pagamentos: não simule cobranças. Sem credenciais, o checkout deve continuar
  aparecendo como desativado.

---

## 5. Migrações de banco

1. Edite `supabase/schema.sql` mantendo a idempotência.
2. Rode `npm run db:migrate` em um banco de teste.
3. Verifique `/api/health` (`"database":"ok"`).
4. Nunca use `db:reset` em produção — ele apaga os dados.

---

## 6. Licença

Código proprietário da Venly Esports (veja `LICENSE`). Contribuições enviadas por
PR são incorporadas ao projeto sob os mesmos termos.
