import 'server-only';
import { databaseConfigured, ensureSeeded, getContent, query, queryOne } from './db';
import { PRIVATE_BUCKET, PUBLIC_BUCKET, storageConfigured } from './uploads';
import { parseJson, safeParseArray } from './utils';
import type { CartItem, Category, MapProject, Member, Product, SiteContent, SocialLink } from './types';

type Row = Record<string, unknown>;

function toMap(row: Row): MapProject {
  return {
    ...(row as unknown as MapProject),
    gallery: safeParseArray(row.gallery as string),
  };
}
function toProduct(row: Row): Product {
  return {
    ...(row as unknown as Product),
    images: safeParseArray(row.images as string),
    sizes: safeParseArray(row.sizes as string),
  };
}
function toMember(row: Row): Member {
  return {
    ...(row as unknown as Member),
    socials: parseJson<SocialLink[]>(row.socials as string, []),
  };
}

export async function getCategories(type?: string): Promise<Category[]> {
  await ensureSeeded();
  const rows = type
    ? await query<Category>('SELECT * FROM categories WHERE type = $1 ORDER BY sort_order, name', [type])
    : await query<Category>('SELECT * FROM categories ORDER BY sort_order, name');
  return rows;
}

export async function getMaps(options: { category?: string; includeHidden?: boolean } = {}): Promise<MapProject[]> {
  await ensureSeeded();
  const rows = options.category
    ? await query<Row>('SELECT * FROM maps WHERE category = $1 ORDER BY featured DESC, sort_order, id DESC', [options.category])
    : await query<Row>('SELECT * FROM maps ORDER BY featured DESC, sort_order, id DESC');
  return rows.map(toMap);
}

export async function getMapBySlug(slug: string): Promise<MapProject | null> {
  await ensureSeeded();
  const row = await queryOne<Row>('SELECT * FROM maps WHERE slug = $1', [slug]);
  return row ? toMap(row) : null;
}

export async function getFeaturedMaps(limit = 3): Promise<MapProject[]> {
  await ensureSeeded();
  const rows = await query<Row>('SELECT * FROM maps ORDER BY featured DESC, sort_order, id DESC LIMIT $1', [limit]);
  return rows.map(toMap);
}

export async function getProducts(options: { category?: string; activeOnly?: boolean } = {}): Promise<Product[]> {
  await ensureSeeded();
  let rows: Row[];
  if (options.category && options.activeOnly !== false) {
    rows = await query<Row>('SELECT * FROM products WHERE active = 1 AND category = $1 ORDER BY featured DESC, sort_order, id DESC', [options.category]);
  } else if (options.activeOnly !== false) {
    rows = await query<Row>('SELECT * FROM products WHERE active = 1 ORDER BY featured DESC, sort_order, id DESC');
  } else {
    rows = await query<Row>('SELECT * FROM products ORDER BY sort_order, id DESC');
  }
  return rows.map(toProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  await ensureSeeded();
  const row = await queryOne<Row>('SELECT * FROM products WHERE slug = $1 AND active = 1', [slug]);
  return row ? toProduct(row) : null;
}

export async function getProductBySlugAny(slug: string): Promise<Product | null> {
  const row = await queryOne<Row>('SELECT * FROM products WHERE slug = $1', [slug]);
  return row ? toProduct(row) : null;
}

export async function getMembers(): Promise<Member[]> {
  await ensureSeeded();
  const rows = await query<Row>('SELECT * FROM members ORDER BY sort_order, id');
  return rows.map(toMember);
}

export async function getContentSafe(): Promise<SiteContent> {
  return getContent();
}

export async function getAdminData() {
  await ensureSeeded();

  type RawRequest = Record<string, unknown> & { id: number; attachments: string };
  type RawOrder = Record<string, unknown> & { id: number; customer: string; items: string };
  type AdminRow = Record<string, unknown> & { id: number };

  const [stats, content, categories, maps, products, members, requests, orders, contacts, consents, adminEmail] = await Promise.all([
    getDashboardStats(),
    getContent(),
    getCategories(),
    getMaps(),
    getProducts({ activeOnly: false }),
    getMembers(),
    query<RawRequest>('SELECT * FROM map_requests ORDER BY id DESC LIMIT 300'),
    query<RawOrder>('SELECT * FROM orders ORDER BY id DESC LIMIT 300'),
    query<AdminRow>('SELECT * FROM contacts ORDER BY id DESC LIMIT 300'),
    query<AdminRow>('SELECT * FROM consent_logs ORDER BY id DESC LIMIT 100'),
    queryOne<{ email: string }>('SELECT email FROM admins ORDER BY id LIMIT 1'),
  ]);

  return {
    stats,
    content,
    categories,
    maps,
    products,
    members,
    requests: requests.map((r) => ({ ...r, attachments: parseJson<unknown[]>(r.attachments, []) })),
    orders: orders.map((o) => ({ ...o, customer: parseJson<Record<string, string>>(o.customer, {}), items: parseJson<CartItem[]>(o.items, []) })),
    contacts,
    consents,
    config: {
      paymentsConfigured: Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN),
      mailConfigured: Boolean(process.env.RESEND_API_KEY && process.env.NOTIFICATION_EMAIL && process.env.EMAIL_FROM),
      analyticsIdConfigured: Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID),
      adsConfigured: Boolean(process.env.NEXT_PUBLIC_ADS_SCRIPT_URL),
      adminEmail: adminEmail?.email || '',
      databaseConfigured: databaseConfigured(),
      storageConfigured: storageConfigured(),
      storageMode: storageConfigured() ? `Supabase Storage (${PUBLIC_BUCKET} / ${PRIVATE_BUCKET})` : 'Disco local (apenas desenvolvimento)',
    },
  };
}

export async function getOrderByCode(code: string) {
  const row = await queryOne<Record<string, unknown>>('SELECT * FROM orders WHERE code = $1', [code]);
  if (!row) return null;
  return {
    ...row,
    customer: parseJson<Record<string, string>>(row.customer as string, {}),
    items: parseJson<CartItem[]>(row.items as string, []),
  };
}

export async function getDashboardStats() {
  const [maps, products, members, requests, newRequests, orders, contacts, newContacts, revenue] = await Promise.all([
    queryOne<{ n: number }>('SELECT COUNT(*)::int AS n FROM maps'),
    queryOne<{ n: number }>('SELECT COUNT(*)::int AS n FROM products'),
    queryOne<{ n: number }>('SELECT COUNT(*)::int AS n FROM members'),
    queryOne<{ n: number }>('SELECT COUNT(*)::int AS n FROM map_requests'),
    queryOne<{ n: number }>("SELECT COUNT(*)::int AS n FROM map_requests WHERE status = 'Nova'"),
    queryOne<{ n: number }>('SELECT COUNT(*)::int AS n FROM orders'),
    queryOne<{ n: number }>('SELECT COUNT(*)::int AS n FROM contacts'),
    queryOne<{ n: number }>("SELECT COUNT(*)::int AS n FROM contacts WHERE status = 'Nova'"),
    queryOne<{ n: number }>("SELECT COALESCE(SUM(total_cents), 0)::int AS n FROM orders WHERE payment_status = 'approved'"),
  ]);
  return {
    maps: maps?.n ?? 0,
    products: products?.n ?? 0,
    members: members?.n ?? 0,
    requests: requests?.n ?? 0,
    newRequests: newRequests?.n ?? 0,
    orders: orders?.n ?? 0,
    contacts: contacts?.n ?? 0,
    newContacts: newContacts?.n ?? 0,
    paidRevenueCents: revenue?.n ?? 0,
  };
}
