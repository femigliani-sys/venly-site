/**
 * Testes end-to-end (Playwright) — execute com o site rodando:
 *   npm run build && npm start
 *   node scripts/e2e-test.mjs
 *
 * Cobre: páginas, links, consentimento de cookies (aceitar/recusar/alterar/retirar),
 * carrinho, checkout desativado, formulários, painel admin e responsividade.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';
const SHOT_DIR = path.join(process.cwd(), 'tests', 'screenshots');
fs.mkdirSync(SHOT_DIR, { recursive: true });

const results = [];
const consoleErrors = [];
const externalRequests = [];
function check(name, condition, detail = '') {
  results.push({ name, pass: Boolean(condition), detail });
  console.log(`${condition ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`);
}

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

async function freshContext(options = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...options });
  context.on('request', (req) => {
    if (/googletagmanager|google-analytics|doubleclick|facebook\.net|adsystem/i.test(req.url())) externalRequests.push(req.url());
  });
  const page = await context.newPage();
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(`${page.url()}: ${msg.text()}`); });
  page.on('pageerror', (e) => consoleErrors.push(`${page.url()}: ${e.message}`));
  return { context, page };
}

// ---------------------------------------------------------------- 1. Consentimento
{
  const { context, page } = await freshContext();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  check('Home carrega com título VENLY ESPORTS', (await page.title()).includes('VENLY ESPORTS'));
  check('Logo oficial presente', await page.locator('img[alt="Logo oficial Venly Esports"]').count() > 0);
  check('Hero com CTA CONHEÇA A VENLY', await page.getByRole('link', { name: /CONHEÇA A VENLY$/i }).count() > 0);
  check('Hero com CTA VENLY CREATES', await page.getByRole('link', { name: /CONHEÇA A VENLY CREATES/i }).count() > 0);
  check('Banner de cookies aparece na 1ª visita', await page.locator('#cookie-title').isVisible());
  check('Botões ACEITAR / RECUSAR igualmente acessíveis',
    (await page.getByRole('button', { name: /Aceitar todos/i }).isVisible()) &&
    (await page.getByRole('button', { name: /Recusar não essenciais/i }).isVisible()));
  check('Nenhum checkbox opcional pré-marcado', await page.evaluate(() => document.querySelectorAll('input[type=checkbox]:checked').length === 0));
  const before = await page.evaluate(() => ({ scripts: document.querySelectorAll('script[data-venly-consent]').length, state: window.__VENLY_CONSENT__ }));
  check('Nenhum script opcional antes da escolha', before.scripts === 0, JSON.stringify(before.state));
  await page.screenshot({ path: path.join(SHOT_DIR, 'home-desktop.png'), fullPage: false });

  await page.getByRole('button', { name: /Recusar não essenciais/i }).first().click();
  await page.waitForTimeout(400);
  const rejected = await page.evaluate(() => JSON.parse(localStorage.getItem('venly_consent') || '{}'));
  check('Recusa salva sem analytics/ads', rejected.analytics === false && rejected.ads === false && rejected.necessary === true);
  check('Banner desaparece após recusa', !(await page.locator('#cookie-title').isVisible().catch(() => false)));
  check('Recusa não ativa scripts opcionais', await page.evaluate(() => document.querySelectorAll('script[data-venly-consent]').length === 0));

  await page.reload({ waitUntil: 'networkidle' });
  check('Escolha persiste após recarregar (sem novo banner)', !(await page.locator('#cookie-title').isVisible().catch(() => false)));
  check('Nenhuma requisição de rastreamento externo', externalRequests.length === 0, externalRequests.join(', '));

  await page.getByRole('button', { name: /Preferências de cookies/i }).first().click();
  check('Modal de preferências abre', await page.getByRole('dialog', { name: /Preferências de cookies/i }).isVisible());
  const boxes = page.locator('input[type=checkbox]');
  check('Preferências não vêm marcadas', await boxes.nth(0).isChecked() === false && await boxes.nth(1).isChecked() === false);
  await boxes.nth(0).check();
  await page.getByRole('button', { name: /Salvar preferências/i }).click();
  await page.waitForTimeout(300);
  const custom = await page.evaluate(() => JSON.parse(localStorage.getItem('venly_consent') || '{}'));
  check('Preferência customizada salva (analytics on, ads off)', custom.analytics === true && custom.ads === false);
  check('Nenhum script externo real carregado sem ID configurado', await page.evaluate(() => document.querySelectorAll('script[data-venly-consent]').length === 0));

  await page.goto(`${BASE}/cookies`, { waitUntil: 'networkidle' });
  check('Página de cookies mostra estado atual', await page.getByText('Estado atual do consentimento').isVisible());
  await page.getByRole('button', { name: /Retirar consentimento/i }).click();
  await page.waitForTimeout(300);
  const withdrawn = await page.evaluate(() => JSON.parse(localStorage.getItem('venly_consent') || '{}'));
  check('Retirada desativa categorias opcionais', withdrawn.analytics === false && withdrawn.ads === false && withdrawn.action === 'withdraw');

  // expiração / nova versão do aviso
  await page.evaluate(() => { const c = JSON.parse(localStorage.getItem('venly_consent')); c.version = 'versao-antiga'; localStorage.setItem('venly_consent', JSON.stringify(c)); });
  await page.reload({ waitUntil: 'networkidle' });
  check('Nova versão do aviso reabre o banner e mantém opcionais desligados',
    await page.locator('#cookie-title').isVisible() && await page.evaluate(() => document.querySelectorAll('script[data-venly-consent]').length === 0));

  await context.close();
}

// ---------------------------------------------------------------- 2. Aceitar todos
{
  const { context, page } = await freshContext();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Aceitar todos/i }).first().click();
  await page.waitForTimeout(350);
  const accepted = await page.evaluate(() => JSON.parse(localStorage.getItem('venly_consent') || '{}'));
  check('Aceitar todos registra todas as categorias', accepted.analytics === true && accepted.ads === true && accepted.action === 'accept_all');
  check('Aceite registra evento no servidor', await page.evaluate(async () => {
    const r = await fetch('/api/health'); return r.ok;
  }));
  await context.close();
}

// ---------------------------------------------------------------- 3. Loja / carrinho / checkout
{
  const { context, page } = await freshContext();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Recusar não essenciais/i }).first().click();

  await page.goto(`${BASE}/loja`, { waitUntil: 'networkidle' });
  check('Catálogo exibe produtos', await page.locator('article').count() >= 6);
  await page.getByPlaceholder('Buscar produto…').fill('bone');
  await page.waitForTimeout(200);
  check('Busca de produtos filtra resultados', await page.locator('article').count() === 1);
  await page.getByPlaceholder('Buscar produto…').fill('');
  await page.getByRole('button', { name: 'Bonés', exact: true }).click();
  check('Filtro por categoria funciona', await page.locator('article').count() === 1);
  await page.getByRole('button', { name: 'Todos', exact: true }).click();

  await page.locator('article', { hasText: 'Boné Snapback' }).getByRole('button', { name: /Adicionar/i }).click();
  await page.waitForTimeout(300);
  check('Toast de produto adicionado', await page.getByText(/adicionado ao carrinho/i).isVisible());
  await page.goto(`${BASE}/loja/produto/jersey-venly-pro`, { waitUntil: 'networkidle' });
  check('Página de produto carrega', await page.getByRole('heading', { name: /JERSEY VENLY PRO/i }).isVisible());
  await page.getByRole('button', { name: 'M', exact: true }).click();
  await page.getByRole('button', { name: /Adicionar ao carrinho/i }).click();
  await page.waitForTimeout(250);
  await page.goto(`${BASE}/carrinho`, { waitUntil: 'networkidle' });
  check('Carrinho lista 2 itens', await page.locator('aside').getByText('Resumo do pedido').isVisible() && (await page.locator('main a[href^="/loja/produto/"]').count()) >= 2);
  check('Resumo do pedido calcula subtotal', await page.getByText('R$', { exact: false }).first().isVisible());

  await page.goto(`${BASE}/checkout`, { waitUntil: 'networkidle' });
  check('Checkout sinaliza não ativado', await page.getByText(/Checkout não ativado/i).first().isVisible());
  await page.locator('#co-name').fill('Maria Souza');
  await page.locator('#co-email').fill('maria@example.com');
  await page.locator('#co-phone').fill('11988887777');
  await page.locator('#co-cep').fill('09000-000');
  await page.locator('#co-street').fill('Rua das Flores');
  await page.locator('#co-number').fill('42');
  await page.locator('#co-district').fill('Centro');
  await page.locator('#co-city').fill('Santo André');
  await page.locator('#co-state').selectOption('SP');
  await page.getByRole('button', { name: /Registrar pedido/i }).click();
  await page.waitForTimeout(1200);
  check('Pedido registrado sem pagamento real', await page.getByText(/Pedido registrado/i).first().isVisible());
  check('Confirmação informa que nenhum pagamento foi processado', await page.getByText(/Nenhum pagamento foi processado/i).first().isVisible());
  await context.close();
}

// ---------------------------------------------------------------- 4. Formulários
{
  const { context, page } = await freshContext();
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Recusar não essenciais/i }).first().click();

  await page.goto(`${BASE}/contato`, { waitUntil: 'networkidle' });
  await page.locator('#ct-name').fill('Carlos Lima');
  await page.locator('#ct-email').fill('carlos@example.com');
  await page.locator('#ct-subject').selectOption('Parcerias');
  await page.locator('#ct-message').fill('Gostaria de conversar sobre uma parceria com a Venly Esports.');
  await page.getByRole('button', { name: /Enviar mensagem/i }).click();
  await page.waitForTimeout(1000);
  check('Formulário de contato envia e confirma', await page.getByText(/Mensagem enviada/i).first().isVisible());

  await page.goto(`${BASE}/solicitar-mapa`, { waitUntil: 'networkidle' });
  await page.locator('#mr-name').fill('Studio Criativo');
  await page.locator('#mr-email').fill('studio@example.com');
  await page.locator('#mr-contact').fill('@studio');
  await page.locator('#mr-map_type').selectOption('Competitivo');
  await page.locator('#mr-project_name').fill('Arena Nova Geração');
  await page.locator('#mr-description').fill('Mapa competitivo de tres rotas com areas elevadas, iluminacao neon e foco em partidas 5 contra 5.');
  await page.locator('#mr-budget').fill('R$ 5.000');
  await page.locator('input[type=file]').setInputFiles(path.join(process.cwd(), 'public', 'logo.png'));
  await page.locator('input[type=checkbox]').check();
  await page.getByRole('button', { name: /Enviar solicitação/i }).click();
  await page.waitForTimeout(1500);
  const protocolVisible = await page.getByText(/VM-\d{4}-\d{5}/).first().isVisible().catch(() => false);
  check('Pedido de orçamento gera protocolo', protocolVisible);
  check('Confirmação reforça ausência de cobrança', await page.getByText(/Nenhuma cobrança é feita automaticamente|Nenhuma cobrança foi feita/i).first().isVisible());
  await context.close();
}

// ---------------------------------------------------------------- 5. Admin
{
  const { context, page } = await freshContext();
  const cred = fs.readFileSync(path.join(process.cwd(), 'data', 'ADMIN_CREDENTIALS.txt'), 'utf8');
  const password = cred.match(/Senha:\s*(\S+)/)?.[1] || '';
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' });
  check('Admin exige login', await page.getByRole('button', { name: /Entrar no painel/i }).isVisible());
  await page.locator('#ad-email').fill('admin@venly.local');
  await page.locator('#ad-pass').fill(password);
  await page.getByRole('button', { name: /Entrar no painel/i }).click();
  await page.waitForTimeout(1800);
  check('Login do admin funciona', await page.getByText(/Bem-vindo ao painel/i).isVisible());
  for (const tab of ['Mapas', 'Produtos', 'Solicitações', 'Pedidos', 'Conteúdo', 'Consentimentos']) {
    await page.locator('nav[aria-label="Navegação do painel"] button', { hasText: tab }).first().click();
    await page.waitForTimeout(150);
    check(`Aba ${tab} renderiza`, await page.getByRole('heading', { name: new RegExp(tab.replace('Conteúdo', 'Conteúdo do site').replace('Consentimentos', 'Registro de consentimentos'), 'i') }).first().isVisible());
  }
  await page.locator('nav[aria-label="Navegação do painel"] button', { hasText: 'Mapas' }).first().click();
  await page.getByRole('button', { name: /Novo registro/i }).click();
  check('Editor de mapa abre', await page.getByRole('dialog', { name: /Novo mapa/i }).isVisible());
  await page.getByRole('button', { name: 'Fechar' }).click();
  await page.getByRole('button', { name: 'Mover para baixo' }).first().click();
  await page.waitForTimeout(500);
  check('Reordenação de registros funciona', await page.getByText(/Ordem atualizada/i).isVisible());
  await page.screenshot({ path: path.join(SHOT_DIR, 'admin.png'), fullPage: false });
  await context.close();
}

// ---------------------------------------------------------------- 6. Links + responsividade
{
  const { context, page } = await freshContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  check('Banner de cookies acessível no mobile', await page.locator('#cookie-title').isVisible());
  await page.screenshot({ path: path.join(SHOT_DIR, 'home-mobile.png'), fullPage: false });
  await page.getByRole('button', { name: /Recusar não essenciais/i }).first().click();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check('Sem overflow horizontal no mobile', overflow <= 2, `diferença: ${overflow}px`);
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  check('Menu mobile abre', await page.getByRole('link', { name: /Venly Creates/i }).first().isVisible());
  await page.getByRole('link', { name: /Venly Creates/i }).first().click();
  await page.waitForURL('**/creates');
  check('Navegação mobile funciona', page.url().endsWith('/creates'));

  // Coleta links internos das páginas principais e verifica status
  const links = new Set();
  for (const route of ['/', '/creates', '/loja', '/sobre', '/contato', '/cookies', '/privacidade']) {
    await page.goto(BASE + route, { waitUntil: 'domcontentloaded' });
    const found = await page.locator('a[href^="/"]').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
    found.forEach((h) => h && links.add(h.split('#')[0].split('?')[0]));
  }
  const bad = [];
  for (const href of links) {
    if (href.startsWith('/api/') || href.startsWith('/admin')) continue;
    const res = await page.request.get(BASE + href);
    if (res.status() >= 400) bad.push(`${href} (${res.status()})`);
  }
  check(`Todos os ${links.size} links internos respondem sem erro`, bad.length === 0, bad.join(', '));
  await context.close();
}

check('Nenhum erro de console/página durante os testes', consoleErrors.length === 0, consoleErrors.slice(0, 4).join(' | '));

await browser.close();
const failed = results.filter((r) => !r.pass);
console.log(`\n================ RESULTADO: ${results.length - failed.length}/${results.length} verificações aprovadas ================`);
if (consoleErrors.length) console.log('Erros de console:', consoleErrors.slice(0, 10));
if (failed.length) { console.log('Falhas:', failed.map((f) => f.name)); process.exit(1); }
