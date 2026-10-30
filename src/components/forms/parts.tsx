'use client';
import { Loader2 } from 'lucide-react';

export function ButtonSpinner() { return <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />; }

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <span className="form-error" role="alert">{message}</span>;
}
