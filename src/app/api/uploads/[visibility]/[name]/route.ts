import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/auth';
import {
  contentTypeFor, publicUrl, readLocalFile, safeUploadName, signedPrivateUrl, storageConfigured,
} from '@/lib/uploads';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ visibility: string; name: string }> }) {
  const { visibility, name } = await params;
  if (visibility !== 'public' && visibility !== 'private') return new NextResponse('Not found', { status: 404 });
  const safe = safeUploadName(name);
  if (!safe) return new NextResponse('Not found', { status: 404 });

  const isPdf = safe.endsWith('.pdf');

  if (visibility === 'private') {
    const admin = await getAdmin();
    if (!admin) return new NextResponse('Unauthorized', { status: 401 });

    // Supabase Storage: gera uma URL assinada de curta duração.
    if (storageConfigured()) {
      const signed = await signedPrivateUrl(safe, 900, isPdf ? safe : undefined);
      if (!signed) return new NextResponse('Not found', { status: 404 });
      return NextResponse.redirect(signed, {
        headers: { 'Cache-Control': 'private, no-store' },
      });
    }
  } else if (storageConfigured()) {
    // Arquivos públicos vivem no CDN do Supabase; redireciona quem tiver o link antigo.
    return NextResponse.redirect(publicUrl(safe), {
      headers: { 'Cache-Control': 'public, max-age=86400' },
    });
  }

  // Modo local (desenvolvimento): serve do disco.
  const data = await readLocalFile(visibility, safe);
  if (!data) return new NextResponse('Not found', { status: 404 });
  return new NextResponse(new Uint8Array(data), {
    headers: {
      'Content-Type': contentTypeFor(safe),
      'Content-Length': String(data.byteLength),
      'Cache-Control': visibility === 'private' ? 'private, no-store' : 'public, max-age=86400',
      'Content-Disposition': isPdf ? `attachment; filename="${safe}"` : 'inline',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
