import { z } from 'zod';
import { execute, queryOne, slugify } from '@/lib/db';
import { requireAdminApi } from '@/lib/admin-guard';
import { ok, fail, zodFail, readBody } from '@/lib/api';
import { categorySchema, mapSchema, productSchema, memberSchema, statusSchema } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ resource: string; id: string }> };
const now = () => new Date().toISOString();

/** Whitelist — o nome da tabela nunca vem cru do cliente. */
const TABLES: Record<string, string> = {
  maps: 'maps', products: 'products', members: 'members', categories: 'categories',
  requests: 'map_requests', orders: 'orders', contacts: 'contacts',
};

export async function PATCH(request: Request, { params }: Ctx) {
  const guard = await requireAdminApi(request, true);
  if (guard) return guard;
  const { resource, id } = await params;
  const numId = Number(id);
  if (!Number.isInteger(numId) || numId < 1) return fail('Identificador inválido.', 400);
  const body = await readBody(request);

  try {
    if (resource === 'maps') {
      const d = mapSchema.parse(body);
      await execute(
        `UPDATE maps SET slug=$1, title=$2, category=$3, summary=$4, description=$5, status=$6, cover=$7,
          gallery=$8, video_url=$9, featured=$10, is_demo=$11, sort_order=$12, updated_at=$13 WHERE id=$14`,
        [d.slug, d.title, d.category, d.summary, d.description, d.status, d.cover, JSON.stringify(d.gallery),
          d.video_url, d.featured ? 1 : 0, d.is_demo ? 1 : 0, d.sort_order, now(), numId]
      );
      return ok({ id: numId });
    }
    if (resource === 'products') {
      const d = productSchema.parse(body);
      await execute(
        `UPDATE products SET slug=$1, name=$2, description=$3, price_cents=$4, category=$5, images=$6, sizes=$7,
          stock=$8, active=$9, featured=$10, is_demo=$11, sort_order=$12, updated_at=$13 WHERE id=$14`,
        [d.slug, d.name, d.description, d.price_cents, d.category, JSON.stringify(d.images), JSON.stringify(d.sizes),
          d.stock, d.active ? 1 : 0, d.featured ? 1 : 0, d.is_demo ? 1 : 0, d.sort_order, now(), numId]
      );
      return ok({ id: numId });
    }
    if (resource === 'members') {
      const d = memberSchema.parse(body);
      await execute(
        `UPDATE members SET name=$1, nickname=$2, role=$3, game=$4, bio=$5, photo=$6, category=$7, socials=$8,
          sort_order=$9 WHERE id=$10`,
        [d.name, d.nickname, d.role, d.game, d.bio, d.photo, d.category, JSON.stringify(d.socials), d.sort_order, numId]
      );
      return ok({ id: numId });
    }
    if (resource === 'categories') {
      const d = categorySchema.parse(body);
      const previous = await queryOne<{ name: string }>('SELECT name FROM categories WHERE id = $1', [numId]);
      const slug = d.slug || slugify(d.name);
      await execute('UPDATE categories SET type=$1, name=$2, slug=$3, sort_order=$4 WHERE id=$5', [d.type, d.name, slug, d.sort_order, numId]);
      if (previous && previous.name !== d.name) {
        const table = d.type === 'map' ? 'maps' : d.type === 'product' ? 'products' : 'members';
        await execute(`UPDATE ${table} SET category = $1 WHERE category = $2`, [d.name, previous.name]);
      }
      return ok({ id: numId, slug });
    }
    if (resource === 'requests' || resource === 'contacts') {
      const d = statusSchema.parse(body);
      const table = TABLES[resource];
      if (d.notes !== undefined && resource === 'requests') {
        await execute(`UPDATE ${table} SET status=$1, notes=$2 WHERE id=$3`, [d.status, d.notes, numId]);
      } else {
        await execute(`UPDATE ${table} SET status=$1 WHERE id=$2`, [d.status, numId]);
      }
      return ok({ id: numId });
    }
    if (resource === 'orders') {
      const schema = z.object({
        status: z.string().min(1).max(60),
        payment_status: z.enum(['not_started', 'pending', 'approved', 'rejected', 'refunded']).optional(),
      });
      const d = schema.parse(body);
      await execute(
        'UPDATE orders SET status=$1, payment_status=COALESCE($2, payment_status), updated_at=$3 WHERE id=$4',
        [d.status, d.payment_status ?? null, now(), numId]
      );
      return ok({ id: numId });
    }
  } catch (error) {
    if (error instanceof z.ZodError) return zodFail(error);
    if (error instanceof Error && /duplicate key|unique/i.test(error.message)) return fail('Já existe um registro com esse identificador.', 409);
    console.error('[venly/admin] update error', error);
    return fail('Não foi possível atualizar o registro.', 500);
  }
  return fail('Recurso não encontrado.', 404);
}

export async function DELETE(request: Request, { params }: Ctx) {
  const guard = await requireAdminApi(request, true);
  if (guard) return guard;
  const { resource, id } = await params;
  const table = TABLES[resource];
  if (!table) return fail('Recurso não encontrado.', 404);
  const numId = Number(id);
  if (!Number.isInteger(numId) || numId < 1) return fail('Identificador inválido.', 400);
  const changed = await execute(`DELETE FROM ${table} WHERE id = $1`, [numId]);
  if (!changed) return fail('Registro não encontrado.', 404);
  return ok({ deleted: true });
}
