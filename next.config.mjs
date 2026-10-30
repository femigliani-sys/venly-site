/** @type {import('next').NextConfig} */
const nextConfig = {
  // O acesso ao Postgres (Supabase) acontece apenas no servidor.
  serverExternalPackages: ['pg'],
  // Origens liberadas apenas para o ambiente de preview (Arena/E2B).
  // Em produção você pode remover esta linha ou restringir ao seu domínio.
  allowedDevOrigins: ['*.e2b.app', 'localhost'],
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // X-Frame-Options é omitido para permitir o preview embarcado.
          // Em produção, configure CSP frame-ancestors para as origens autorizadas.
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};
export default nextConfig;
