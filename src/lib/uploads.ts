import 'server-only';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const ALLOWED: Record<string, { ext: string; magic: (buf: Buffer) => boolean }> = {
  'image/png': { ext: 'png', magic: (b) => b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
  'image/jpeg': { ext: 'jpg', magic: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  'image/webp': { ext: 'webp', magic: (b) => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP' },
  'application/pdf': { ext: 'pdf', magic: (b) => b.toString('ascii', 0, 5) === '%PDF-' },
};

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_UPLOAD_FILES = 4;

export const PUBLIC_BUCKET = (process.env.SUPABASE_STORAGE_BUCKET_PUBLIC || 'venly-public').trim();
export const PRIVATE_BUCKET = (process.env.SUPABASE_STORAGE_BUCKET_PRIVATE || 'venly-private').trim();

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

/** Fallback local (apenas desenvolvimento). Em produção usamos Supabase Storage. */
const LOCAL_DIR = path.join(process.cwd(), 'data', 'uploads');

export type StoredFile = { url: string; name: string; size: number; type: string };

export function storageConfigured(): boolean {
  return Boolean(SUPABASE_URL && SERVICE_KEY);
}

let client: SupabaseClient | null = null;
function storageClient(): SupabaseClient {
  if (!storageConfigured()) throw new Error('Supabase Storage não configurado.');
  if (!client) {
    client = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { 'x-application-name': 'venly-esports' } },
    });
  }
  return client;
}

function bucketFor(visibility: 'public' | 'private') {
  return visibility === 'public' ? PUBLIC_BUCKET : PRIVATE_BUCKET;
}

function validate(file: File, buffer: Buffer) {
  const rule = ALLOWED[file.type];
  if (!rule) throw new Error('Formato não suportado. Envie PNG, JPG, WEBP ou PDF.');
  if (file.size > MAX_UPLOAD_BYTES || buffer.length > MAX_UPLOAD_BYTES) throw new Error('Arquivo maior que 5 MB.');
  if (!rule.magic(buffer)) throw new Error('O conteúdo do arquivo não corresponde ao formato informado.');
  return rule;
}

export async function storeFile(file: File, visibility: 'public' | 'private' = 'public'): Promise<StoredFile> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const rule = validate(file, buffer);
  const name = `${crypto.randomBytes(18).toString('hex')}.${rule.ext}`;

  if (storageConfigured()) {
    const supabase = storageClient();
    const { error } = await supabase.storage.from(bucketFor(visibility)).upload(name, buffer, {
      contentType: file.type,
      cacheControl: visibility === 'public' ? '31536000' : '3600',
      upsert: false,
    });
    if (error) {
      throw new Error(`Falha ao enviar o arquivo para o Supabase Storage: ${error.message}`);
    }
  } else {
    if (process.env.VERCEL) {
      throw new Error(
        'Uploads precisam do Supabase Storage em produção (o disco da Vercel é temporário). ' +
        'Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY e rode "npm run db:migrate".'
      );
    }
    const dir = path.join(LOCAL_DIR, visibility);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, name), buffer, { mode: 0o600 });
  }

  const url = visibility === 'public' ? publicUrl(name) : `/api/uploads/private/${name}`;
  return { url, name: file.name.slice(0, 120), size: file.size, type: file.type };
}

/** URL pública (CDN do Supabase) ou rota interna quando em modo local. */
export function publicUrl(name: string): string {
  if (storageConfigured()) {
    return storageClient().storage.from(PUBLIC_BUCKET).getPublicUrl(name).data.publicUrl;
  }
  return `/api/uploads/public/${name}`;
}

/** URL assinada e temporária — usada pelo admin para ler anexos privados. */
export async function signedPrivateUrl(name: string, expiresIn = 3600, download?: string): Promise<string | null> {
  if (!storageConfigured()) return null;
  const { data, error } = await storageClient().storage
    .from(PRIVATE_BUCKET)
    .createSignedUrl(name, expiresIn, download ? { download } : undefined);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

export async function readLocalFile(visibility: 'public' | 'private', name: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(path.join(LOCAL_DIR, visibility, name));
  } catch {
    return null;
  }
}

export function safeUploadName(name: string): string | null {
  return /^[a-f0-9]{36}\.(png|jpg|webp|pdf)$/.test(name) ? name : null;
}

export function contentTypeFor(name: string): string {
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.jpg')) return 'image/jpeg';
  if (name.endsWith('.webp')) return 'image/webp';
  return 'application/pdf';
}
