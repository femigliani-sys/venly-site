import { z } from 'zod';
import { execute, hashPassword, patchContent, queryOne, slugify, verifyPassword } from '@/lib/db';
import { requireAdminApi } from '@/lib/admin-guard';
import { getAdminData } from '@/lib/queries';
import { ok, fail, zodFail, readBody } from '@/lib/api';
import { categorySchema, mapSchema, productSchema, memberSchema, contentSchema } from '@/lib/validation';
import { storeFile } from '@/lib/uploads';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ resource: string }> };
const now = () => new Date().toISOString();

export async function GET(request: Request, { params }: Ctx) {
  const guard = await requireAdminApi(request);
  if (guard) return guard;
  const { resource } = await params;
  if (resource === 'bootstrap') return ok(await getAdminData());
  return fail('Recurso não encontrado.', 404);
}

export async function POST(request: Request, { params }: Ctx) {
  const guard = await requireAdminApi(request, true);
  if (guard) return guard;
  const { resource } = await params;

  if (resource === 'upload') {
    let form: FormData;
    try { form = await request.formData(); } catch { return fail('Envio inválido.', 400); }
    const files = form.getAll('files').filter((f): f is File => f instanceof File);
    if (!files.length) return fail('Nenhum arquivo recebido.', 400);
    if (files.length > 6) return fail('Envie no máximo 6 arquivos por vez.', 400);
    try {
      const stored = [];
      for (const file of files) stored.push(await storeFile(file, 'public'));
      return ok({ files: stored }, 201);
    } catch (e) { return fail(e instanceof Error ? e.message : 'Falha no envio.', 400); }
  }

  if (resource === 'content') {
    const parsed = contentSchema.safeParse(await readBody(request));
    if (!parsed.success) return zodFail(parsed.error);
    if (JSON.stringify(parsed.data.content).length > 120_000) return fail('Conteúdo muito grande.', 413);
    return ok({ content: await patchContent(parsed.data.content) });
  }

  if (resource === 'password') {
    const body = await readBody(request);
    const schema = z.object({ current: z.string().min(1).max(200), next: z.string().min(10, 'Use ao menos 10 caracteres.').max(200) });
    const parsed = schema.safeParse(body);
    if (!parsed.success) return zodFail(parsed.error);
    const admin = await queryOne<{ id: number; password_hash: string }>('SELECT id, password_hash FROM admins ORDER BY id LIMIT 1');
    if (!admin) return fail('Administrador não encontrado.', 404);
    if (!verifyPassword(parsed.data.current, admin.password_hash)) return fail('Senha atual incorreta.', 403);
    await execute('UPDATE admins SET password_hash = $1 WHERE id = $2', [hashPassword(parsed.data.next), admin.id]);
    return ok({ changed: true });
  }

  try {
    if (resource === 'maps') {
      const data = mapSchema.parse(await readBody(request));
      const row = await queryOne<{ id: number }>(
        `INSERT INTO maps
          (slug, title, category, summary, description, status, cover, gallery, video_url, featured, is_demo, sort_order, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$13) RETURNING id`,
        [data.slug, data.title, data.category, data.summary, data.description, data.status, data.cover,
          JSON.stringify(data.gallery), data.video_url, data.featured ? 1 : 0, data.is_demo ? 1 : 0, data.sort_order, now()]
      );
      return ok({ id: row?.id ?? 0 }, 201);
    }
    if (resource === 'products') {
      const data = productSchema.parse(await readBody(request));
      const row = await queryOne<{ id: number }>(
        `INSERT INTO products
          (slug, name, description, price_cents, category, images, sizes, stock, active, featured, is_demo, sort_order, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$13) RETURNING id`,
        [data.slug, data.name, data.description, data.price_cents, data.category, JSON.stringify(data.images),
          JSON.stringify(data.sizes), data.stock, data.active ? 1 : 0, data.featured ? 1 : 0,
          data.is_demo ? 1 : 0, data.sort_order, now()]
      );
      return ok({ id: row?.id ?? 0 }, 201);
    }
    if (resource === 'members') {
      const data = memberSchema.parse(await readBody(request));
      const row = await queryOne<{ id: number }>(
        `INSERT INTO members (name, nickname, role, game, bio, photo, category, socials, sort_order, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
        [data.name, data.nickname, data.role, data.game, data.bio, data.photo, data.category,
          JSON.stringify(data.socials), data.sort_order, now()]
      );
      return ok({ id: row?.id ?? 0 }, 201);
    }
    if (resource === 'categories') {
      const data = categorySchema.parse(await readBody(request));
      const slug = data.slug || slugify(data.name);
      const row = await queryOne<{ id: number }>(
        'INSERT INTO categories (type, name, slug, sort_order) VALUES ($1,$2,$3,$4) RETURNING id',
        [data.type, data.name, slug, data.sort_order]
      );
      return ok({ id: row?.id ?? 0, slug }, 201);
    }
  } catch (error) {
    if (error instanceof z.ZodError) return zodFail(error);
    if (error instanceof Error && /duplicate key|unique/i.test(error.message)) return fail('Já existe um registro com esse identificador (slug/nome).', 409);
    console.error('[venly/admin] create error', error);
    return fail('Não foi possível salvar o registro.', 500);
  }
  return fail('Recurso não encontrado.', 404);
}
