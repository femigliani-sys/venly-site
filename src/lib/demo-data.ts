// Dados demonstrativos e categorias iniciais.
// IMPORTANTE: tudo aqui é ilustrativo (mapas, produtos e preços) e está marcado
// como demonstrativo (is_demo = 1). Substitua pelos dados oficiais no painel.

export const DEMO_MAPS = [
  {
    slug: 'neon-circuit', title: 'Neon Circuit', category: 'Competitivo',
    summary: 'Arena simétrica de três rotas com disputa de altitude e rotações rápidas.',
    description: 'Conceito de arena competitiva com três rotas conectadas por passagens elevadas. O layout prioriza leitura rápida de ângulos, retomada de posições e fluxo de rotação entre os lados do mapa. A identidade visual usa iluminação magenta sobre superfícies escuras para destacar pontos de disputa.',
    status: 'Projeto conceitual', cover: '/demo/maps/neon-circuit.jpg',
    gallery: ['/demo/maps/neon-circuit-2.jpg', '/demo/maps/neon-circuit-3.jpg'], featured: 1,
  },
  {
    slug: 'pulse-yard', title: 'Pulse Yard', category: 'Treinamento',
    summary: 'Área de aquecimento com alvos modulares e zonas de mobilidade cronometradas.',
    description: 'Mapa de treinamento pensado para rotinas curtas de aquecimento. Módulos de alvos podem ser redistribuídos e o percurso de mobilidade oferece diferentes níveis de dificuldade. Projeto demonstrativo para apresentar a categoria de treinos.',
    status: 'Em desenvolvimento', cover: '/demo/maps/pulse-yard.jpg',
    gallery: ['/demo/maps/pulse-yard-2.jpg', '/demo/maps/pulse-yard-3.jpg'], featured: 0,
  },
  {
    slug: 'violet-hold', title: 'Violet Hold', category: 'Competitivo',
    summary: 'Mapa de controle com ponto central, flancos verticais e visibilidade trabalhada.',
    description: 'Estudo de mapa de controle com um objetivo central e duas rotas de flanco em níveis diferentes. A proposta equilibra exposição e cobertura, criando disputas curtas e intensas. Conceito visual demonstrativo.',
    status: 'Projeto conceitual', cover: '/demo/maps/violet-hold.jpg',
    gallery: ['/demo/maps/violet-hold-2.jpg', '/demo/maps/violet-hold-3.jpg'], featured: 1,
  },
  {
    slug: 'echo-garden', title: 'Echo Garden', category: 'Criativo',
    summary: 'Experiência exploratória de geometria orgânica com iluminação reativa.',
    description: 'Ambiente não competitivo voltado à exploração e à ambientação. Caminhos suspensos, volumes orgânicos e iluminação que responde à movimentação do jogador. Projeto demonstrativo para a categoria de experiências criativas.',
    status: 'Projeto conceitual', cover: '/demo/maps/echo-garden.jpg',
    gallery: ['/demo/maps/echo-garden-2.jpg', '/demo/maps/echo-garden-3.jpg'], featured: 0,
  },
  {
    slug: 'grid-lab', title: 'Grid Lab', category: 'Treinamento',
    summary: 'Laboratório de movimentação com módulos reconfiguráveis para drills.',
    description: 'Espaço modular para treinos de movimentação, mira e posicionamento. A grade permite combinar blocos, rampas e alvos em diferentes configurações. Projeto demonstrativo em desenvolvimento.',
    status: 'Em desenvolvimento', cover: '/demo/maps/grid-lab.jpg',
    gallery: ['/demo/maps/grid-lab-2.jpg', '/demo/maps/grid-lab-3.jpg'], featured: 0,
  },
  {
    slug: 'brand-arena', title: 'Brand Arena', category: 'Personalizado',
    summary: 'Conceito de arena licenciada para ativações de marca e eventos.',
    description: 'Estrutura de arena personalizável para eventos, transmissões e ativações de marca. Espaços reservados para sinalização, palco e áreas de interação. Projeto demonstrativo — nenhum cliente real está associado a este conceito.',
    status: 'Projeto conceitual', cover: '/demo/maps/brand-arena.jpg',
    gallery: ['/demo/maps/brand-arena-2.jpg', '/demo/maps/brand-arena-3.jpg'], featured: 1,
  },
];

export const DEMO_PRODUCTS = [
  { slug: 'jersey-venly-pro', name: 'Jersey Venly Pro', category: 'Jerseys', price_cents: 24990, sizes: ['P','M','G','GG','XG'], stock: 14, image: '/demo/products/jersey.jpg', description: 'Jersey demonstrativa com identidade Venly. Tecido leve, modelagem esportiva e acabamento em pink vibrante. Produto ilustrativo — substitua pelos dados oficiais no painel.' },
  { slug: 'camiseta-essential', name: 'Camiseta Essential', category: 'Camisetas', price_cents: 12990, sizes: ['P','M','G','GG'], stock: 25, image: '/demo/products/tee.jpg', description: 'Camiseta demonstrativa com aplicação da marca. Modelagem clássica e confortável para o dia a dia. Produto ilustrativo.' },
  { slug: 'moletom-oversized', name: 'Moletom Oversized', category: 'Moletons', price_cents: 28990, sizes: ['P','M','G','GG'], stock: 8, image: '/demo/products/hoodie.jpg', description: 'Moletom demonstrativo de modelagem ampla, com detalhes em pink e capuz estruturado. Produto ilustrativo.' },
  { slug: 'bone-snapback', name: 'Boné Snapback', category: 'Bonés', price_cents: 9990, sizes: ['Único'], stock: 20, image: '/demo/products/cap.jpg', description: 'Boné demonstrativo com aba reta e ajuste traseiro. Produto ilustrativo.' },
  { slug: 'manguito-gamer', name: 'Manguito Gamer', category: 'Acessórios', price_cents: 5990, sizes: ['P/M','G/GG'], stock: 30, image: '/demo/products/sleeve.jpg', description: 'Manguito demonstrativo em tecido compressivo leve. Produto ilustrativo.' },
  { slug: 'mousepad-xl', name: 'Mousepad XL', category: 'Acessórios', price_cents: 11990, sizes: ['Único'], stock: 0, image: '/demo/products/mousepad.jpg', description: 'Mousepad demonstrativo em tamanho estendido, superfície lisa e base antiderrapante. Produto ilustrativo.' },
];

export const CATEGORIES: [string, string][] = [
  ['map', 'Competitivo'], ['map', 'Treinamento'], ['map', 'Criativo'], ['map', 'Personalizado'],
  ['product', 'Camisetas'], ['product', 'Jerseys'], ['product', 'Moletons'], ['product', 'Bonés'], ['product', 'Acessórios'],
  ['member', 'Direção e gestão'], ['member', 'Jogadores competitivos'], ['member', 'Criadores de conteúdo'], ['member', 'Equipe criativa'], ['member', 'Desenvolvimento e criação de mapas'],
];

export function slugify(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'item';
}
