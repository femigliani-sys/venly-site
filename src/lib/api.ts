import { NextResponse } from 'next/server';
import { z } from 'zod';

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function fail(error: string, status = 400, fields?: Record<string, string>) {
  return NextResponse.json({ ok: false, error, ...(fields ? { fields } : {}) }, { status });
}

export function zodFail(error: z.ZodError, status = 422) {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) fields[issue.path.join('.') || '_'] = issue.message;
  return fail('Verifique os campos destacados.', status, fields);
}

export async function readBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const parsed = await request.json();
      return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {};
    }
    const form = await request.formData();
    const out: Record<string, unknown> = {};
    form.forEach((value, key) => { out[key] = typeof value === 'string' ? value : (value as File).name; });
    return out;
  } catch { return {}; }
}
