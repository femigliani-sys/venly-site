import type { Metadata, Viewport } from 'next';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/rajdhani/500.css';
import '@fontsource/rajdhani/600.css';
import '@fontsource/rajdhani/700.css';
import './globals.css';
import { getContent } from '@/lib/db';
import { ConsentProvider } from '@/components/ConsentProvider';
import { CartProvider } from '@/components/CartProvider';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'VENLY ESPORTS — Comunidade, Competição e Criação', template: '%s | VENLY ESPORTS' },
  description: 'Venly Esports: organização de esports, comunidade gamer, Venly Creates (criação de mapas) e loja oficial. Conheça nossos projetos e solicite um mapa personalizado.',
  keywords: ['esports', 'Venly Esports', 'Venly Creates', 'criação de mapas', 'comunidade gamer', 'loja de esports'],
  openGraph: {
    type: 'website', locale: 'pt_BR', siteName: 'VENLY ESPORTS',
    title: 'VENLY ESPORTS — Comunidade, Competição e Criação',
    description: 'Organização de esports, criação de mapas e produtos oficiais.',
    images: [{ url: '/logo.png', width: 300, height: 300, alt: 'Logo oficial Venly Esports' }],
  },
  twitter: { card: 'summary_large_image' },
  icons: { icon: '/favicon.ico', apple: '/logo.png' },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { themeColor: '#050509', width: 'device-width', initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const content = await getContent();
  return (
    <html lang="pt-BR">
      <head>
        {/* Sem JavaScript, o conteúdo permanece visível (as animações são progressivas). */}
        <noscript><style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style></noscript>
      </head>
      <body>
        <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-sm focus:bg-pink focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white">Pular para o conteúdo</a>
        <ConsentProvider
          version={content.consent.version}
          policyTitle={content.consent.policyTitle}
          policyText={content.consent.policyText}
          analyticsId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}
          adsScriptUrl={process.env.NEXT_PUBLIC_ADS_SCRIPT_URL}
        >
          <CartProvider>
            <SiteHeader />
            <main id="conteudo" className="min-h-[60vh]">{children}</main>
            <SiteFooter socials={content.contact.socials} note={content.footer.note} email={content.contact.email} />
          </CartProvider>
        </ConsentProvider>
      </body>
    </html>
  );
}
