'use client';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export function Reveal({ children, delay = 0, className, as: Tag = 'div' }: {
  children: React.ReactNode; delay?: number; className?: string; as?: 'div' | 'section' | 'li' | 'article';
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setVisible(true); return; }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const Component = Tag as React.ElementType;
  return (
    <Component ref={ref} data-reveal="" style={{ transitionDelay: `${delay}ms` }}
      className={cn('transition-all duration-700 ease-out will-change-transform', visible ? 'translate-y-0 opacity-100' : 'translate-y-7 opacity-0', className)}>
      {children}
    </Component>
  );
}
