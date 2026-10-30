# Segurança

## Como reportar uma vulnerabilidade

**Não abra uma issue pública.** Envie um e-mail para
`seguranca@SEU-DOMINIO.com.br` (substitua pelo canal real da organização) com:

- descrição do problema e impacto;
- passos para reproduzir (URL, payload, prints);
- versão/commit afetado;
- se possível, uma sugestão de correção.

Retorno em até **5 dias úteis**. Pedimos que não publique detalhes antes da
correção.

---

## Escopo

Este repositório contém o site público e o painel administrativo da Venly
Esports. Estão no escopo, entre outros:

- autenticação e sessão do painel (`/admin`);
- rotas de API públicas (contato, orçamento, pedidos, consentimento);
- uploads e acesso a anexos privados;
- vazamento de dados pessoais (LGPD);
- falhas de autorização em `/api/admin/*`.

Fora do escopo: engenharia social, força bruta em massa, negação de serviço,
relatos gerados apenas por scanners sem prova de impacto e problemas em serviços
de terceiros (Supabase, Vercel, Mercado Pago, Resend).

---

## Proteções já implementadas

- Senhas com `scrypt` + salt; sessões no banco com expiração de 7 dias; cookie
  `httpOnly`, `SameSite=Strict` e `Secure` em HTTPS.
- CSRF por duplo envio e validação de `Origin` em mutações.
- Rate limit por hash de IP (o IP não é armazenado) em login, formulários,
  uploads e consentimento.
- Validação com Zod no servidor, honeypot nos formulários públicos.
- SQL parametrizado e whitelist de tabelas.
- **RLS habilitado** em todas as tabelas: a `anon key` do Supabase não lê nem
  escreve; a `service_role` só é usada no servidor.
- Uploads com allowlist de MIME, verificação de *magic bytes*, limite de 5 MB e
  nomes aleatórios; anexos privados via URL assinada de curta duração.
- Cabeçalhos `nosniff`, `Referrer-Policy` e `Permissions-Policy`.

## Recomendado ao publicar

- [ ] `AUTH_SECRET` forte e exclusivo do ambiente.
- [ ] CSP com `frame-ancestors 'none'` (ou apenas o seu domínio).
- [ ] Backups automáticos do Postgres e teste de restauração.
- [ ] Monitoramento de erros (Sentry ou equivalente) e alerta de indisponibilidade.
- [ ] Rotação de chaves (service role, tokens de pagamento) a cada 6–12 meses.
