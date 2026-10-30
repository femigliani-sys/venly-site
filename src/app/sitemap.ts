import type { MetadataRoute } from 'next';
import { getMaps, getProducts } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const now = new Date();
  const staticPaths = ['', '/creates', '/solicitar-mapa', '/loja', '/carrinho', '/equipe', '/sobre', '/contato', '/privacidade', '/cookies', '/termos'];
  const entries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${base}${path}`, lastModified: now, changeFrequency: path === '' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : path === '/creates' || path === '/loja' ? 0.9 : 0.6,
  }));
  for (const map of await getMaps()) entries.push({ url: `${base}/creates/mapa/${map.slug}`, lastModified: new Date(map.updated_at), priority: 0.7 });
  for (const product of await getProducts()) entries.push({ url: `${base}/loja/produto/${product.slug}`, lastModified: new Date(product.updated_at), priority: 0.7 });
  return entries;
}
