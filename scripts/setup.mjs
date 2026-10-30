#!/usr/bin/env node
/**
 * VENLY ESPORTS — setup local
 * Uso: npm run setup
 *
 * - Verifica a versão do Node.js (>= 20.9).
 * - Cria .env.local a partir de .env.example, se ainda não existir.
 * - Gera um AUTH_SECRET aleatório forte.
 * - Avisa se DATABASE_URL (Supabase) ainda não estiver preenchida.
 *
 * Não sobrescreve nada que já exista (seguro rodar mais de uma vez).
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const envExample = path.join(root, '.env.example');
const envLocal = path.join(root, '.env.local');

const MIN_NODE = [20, 9, 0];

function checkNode() {
  const [major, minor, patch] = process.versions.node.split('.').map(Number);
  const [rMajor, rMinor, rPatch] = MIN_NODE;
  const ok =
    major > rMajor ||
    (major === rMajor && (minor > rMinor || (minor === rMinor && patch >= rPatch)));
  if (!ok) {
    console.error(
      `\n[setup] Node.js ${process.versions.node} encontrado, mas o projeto exige >= ${MIN_NODE.join('.')}.` +
        '\n        Use o Node 20 LTS (arquivo .nvmrc) e rode novamente.\n'
    );
    process.exit(1);
  }
  console.log(`[setup] Node.js ${process.versions.node} — OK`);
}

function setupEnv() {
  if (!fs.existsSync(envExample)) {
    console.warn('[setup] .env.example não encontrado — pulando criação do .env.local.');
    return;
  }
  if (fs.existsSync(envLocal)) {
    console.log('[setup] .env.local já existe — mantido sem alterações.');
    return;
  }

  const secret = crypto.randomBytes(32).toString('hex');
  let content = fs.readFileSync(envExample, 'utf8');

  // Preenche AUTH_SECRET (vazio ou com valor de exemplo).
  content = content.replace(/^AUTH_SECRET=.*$/m, `AUTH_SECRET=${secret}`);
  if (!/^AUTH_SECRET=/m.test(content)) content += `\nAUTH_SECRET=${secret}\n`;

  fs.writeFileSync(envLocal, content, { mode: 0o600 });
  console.log('[setup] .env.local criado com AUTH_SECRET aleatório.');
}

function readEnvLocal() {
  if (!fs.existsSync(envLocal)) return {};
  const out = {};
  for (const line of fs.readFileSync(envLocal, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/i);
    if (match) out[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
  }
  return out;
}

checkNode();
setupEnv();

const env = readEnvLocal();
const missing = [];
if (!env.DATABASE_URL) missing.push('DATABASE_URL (Postgres do Supabase)');
if (!env.NEXT_PUBLIC_SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL');
if (!env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
if (!env.ADMIN_PASSWORD) missing.push('ADMIN_PASSWORD (recomendado; sem ele a senha é gerada e vai para o log)');

console.log(`
[setup] Próximos passos:

  1) Preencha o .env.local com as chaves do Supabase
     (veja o README → "Chaves que você precisa configurar").
     Faltando agora:${missing.length ? '\n' + missing.map((m) => `       • ${m}`).join('\n') : ' nenhuma 🎉'}

  2) Crie as tabelas e os buckets do Storage:
       npm run db:migrate

  3) Suba o site:
       npm run dev            # http://localhost:3000
     ou
       npm run build && npm start

  4) Painel: http://localhost:3000/admin
     E-mail: ${env.ADMIN_EMAIL || 'admin@venly.local'}
     Senha:  a definida em ADMIN_PASSWORD
             (ou data/ADMIN_CREDENTIALS.txt, se foi gerada automaticamente)

  Dica: /api/health mostra o estado do banco, do Storage, do checkout e do e-mail.
`);
