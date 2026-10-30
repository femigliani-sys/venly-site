import type { SiteContent } from './types';

/**
 * Conteúdo provisório e editável pelo painel administrativo.
 * Nenhum dado institucional oficial (história, integrantes, redes, resultados)
 * é inventado aqui: campos não fornecidos ficam vazios e a interface sinaliza
 * claramente o que está pendente de configuração.
 */
export const DEFAULT_CONTENT: SiteContent = {
  home: {
    eyebrow: 'ORGANIZAÇÃO DE ESPORTS · COMUNIDADE · CRIAÇÃO',
    titleTop: 'O JOGO MUDA',
    titleAccent: 'QUANDO A GENTE CRIA.',
    description:
      'Competitividade, criatividade e evolução no mesmo servidor. A Venly Esports conecta a comunidade gamer, projetos competitivos e a Venly Creates — nossa divisão de criação de mapas e experiências.',
    primaryCta: 'CONHEÇA A VENLY',
    secondaryCta: 'CONHEÇA A VENLY CREATES',
    ticker: ['COMUNIDADE GAMER', 'COMPETITIVIDADE', 'CRIAÇÃO DE MAPAS', 'PRODUTOS OFICIAIS', 'EVOLUÇÃO CONSTANTE'],
    previewLabel: 'O UNIVERSO VENLY',
    previewTitle: 'UMA MARCA. VÁRIAS FRENTES.',
    previewText:
      'Conheça as áreas que fazem parte da Venly Esports. Cada uma delas tem espaço próprio neste site e pode ser atualizada pela administração.',
  },
  about: {
    intro:
      'A Venly Esports é uma organização voltada à comunidade gamer, à competitividade e ao desenvolvimento de projetos criativos dentro dos jogos.',
    history:
      'Texto provisório: apresente aqui a trajetória da Venly Esports, marcos importantes, origem da marca e os primeiros projetos. Este conteúdo pode ser substituído no painel administrativo assim que as informações oficiais forem disponibilizadas.',
    mission:
      'Criar experiências de alto nível para jogadores, incentivar a competitividade saudável e desenvolver projetos originais que conectem comunidade, criadores e marcas.',
    vision:
      'Ser reconhecida como uma organização de esports profissional, criativa e confiável — dentro e fora dos servidores.',
    values: [
      { title: 'Competitividade com respeito', text: 'Buscar evolução e resultado sem abrir mão do fair play e da comunidade.' },
      { title: 'Criação com propósito', text: 'Cada mapa, produto ou conteúdo precisa entregar uma experiência real para quem joga.' },
      { title: 'Transparência', text: 'Comunicação clara com jogadores, parceiros e clientes em todas as etapas dos projetos.' },
      { title: 'Qualidade consistente', text: 'Atenção aos detalhes do conceito à entrega, com processos revisáveis e melhoria contínua.' },
    ],
    areas: [
      { title: 'Comunidade e esports', text: 'Presença no cenário competitivo, conteúdo e aproximação com o público gamer.' },
      { title: 'Venly Creates', text: 'Criação de mapas, ambientes e experiências para jogos, treinos, eventos e marcas.' },
      { title: 'Produtos oficiais', text: 'Linha de produtos com a identidade Venly para quem vive a marca dentro e fora do jogo.' },
      { title: 'Parcerias e projetos', text: 'Desenvolvimento de projetos personalizados em conjunto com criadores e empresas.' },
    ],
    creates:
      'A Venly Creates é a divisão de criação da organização. É onde ideias viram ambientes jogáveis: mapas competitivos, cenários de treinamento, experiências criativas e projetos sob medida. O portfólio publicado neste site é demonstrativo até o cadastro dos projetos oficiais.',
    pendingNote:
      'Conteúdo institucional provisório, editável no painel administrativo. Substitua por informações oficiais antes da publicação.',
  },
  creates: {
    intro:
      'Design de níveis, ambientação e experiências jogáveis. A Venly Creates desenvolve mapas com foco em qualidade visual, legibilidade de gameplay e identidade de marca.',
    process: [
      { title: '01 · Briefing', text: 'Entendemos o jogo, o objetivo, o público e as referências do projeto.' },
      { title: '02 · Conceito', text: 'Layout, fluxo de jogo, atmosfera visual e proposta de identidade do mapa.' },
      { title: '03 · Produção', text: 'Construção do ambiente, iluminação, ajustes de jogabilidade e revisões.' },
      { title: '04 · Entrega', text: 'Testes, ajustes finais, documentação e acompanhamento pós-entrega.' },
    ],
    note:
      'Os projetos abaixo são demonstrativos e servem para apresentar o formato do portfólio. Nenhum cliente, resultado ou publicação real está sendo afirmado.',
  },
  store: {
    intro: 'A loja oficial da Venly Esports. Produtos com a identidade da marca para a comunidade.',
    notice:
      'Catálogo demonstrativo: os produtos, imagens e preços abaixo são ilustrativos e devem ser substituídos pelos itens oficiais no painel administrativo.',
  },
  contact: {
    email: '',
    commercialEmail: '',
    privacyEmail: '',
    discord: '',
    socials: [
      { label: 'Instagram', url: '' },
      { label: 'X / Twitter', url: '' },
      { label: 'TikTok', url: '' },
      { label: 'YouTube', url: '' },
      { label: 'Twitch', url: '' },
      { label: 'Discord', url: '' },
    ],
    pendingNote:
      'Os endereços oficiais ainda não foram informados. Enquanto isso, utilize o formulário desta página; os links podem ser configurados no painel administrativo.',
  },
  legal: {
    privacyNote:
      'Texto em versão inicial. Ele descreve as práticas atuais desta implementação e deve ser revisado por um profissional jurídico e pelo responsável pelos dados antes da publicação definitiva.',
    privacy: `## 1. Quem somos e a quem esta política se aplica

Esta Política de Privacidade explica como a **Venly Esports** trata dados pessoais coletados por este site. O texto descreve as funcionalidades realmente implementadas nesta versão e deve ser revisado antes da publicação final, especialmente depois de definidos o responsável legal (controlador), o CNPJ, o encarregado de dados (DPO) e os fornecedores contratados.

## 2. Dados que coletamos

Coletamos apenas os dados necessários para cada finalidade:

- **Solicitação de mapa (orçamento):** nome, e-mail, contato alternativo (opcional), tipo de mapa, nome ou ideia do projeto, descrição, referências, orçamento estimado (opcional), prazo desejado (opcional) e arquivos de referência enviados (opcional).
- **Formulário de contato:** nome, e-mail, assunto e mensagem.
- **Compras na loja:** nome, e-mail, telefone, endereço de entrega (CEP, rua, número, complemento, bairro, cidade e estado), itens do pedido e valores. **Não coletamos e não armazenamos dados de cartão de crédito** — quando o pagamento for ativado, ele será processado diretamente pelo gateway configurado.
- **Administração:** e-mail e senha do administrador (a senha é armazenada apenas como hash criptográfico) e um identificador de sessão.
- **Consentimento de cookies:** um identificador opaco gerado no navegador, versão do aviso, categorias autorizadas, data e tipo de ação. Não associamos esse registro a nome, e-mail ou endereço IP.
- **Segurança:** registros temporários e anonimizados de limitação de requisições (hash do IP), usados para evitar abusos e envios automatizados.

Não solicitamos dados sensíveis (saúde, biometria, religião, orientação política etc.). Não coletamos CPF, a menos que venha a ser necessário por exigência fiscal — nesse caso esta política será atualizada.

## 3. Finalidades e bases legais

| Finalidade | Dados usados | Base legal (Lei nº 13.709/2018) |
| --- | --- | --- |
| Responder pedidos de orçamento e elaborar proposta comercial | Dados da solicitação de mapa | Procedimentos preliminares/execução de contrato — art. 7º, V |
| Responder contatos e solicitações de direitos do titular | Dados do formulário de contato | Legítimo interesse e/ou cumprimento de obrigação legal — art. 7º, IX e II |
| Processar pedidos e entregar produtos | Dados de cadastro e entrega | Execução de contrato — art. 7º, V |
| Cumprir obrigações fiscais e de defesa do consumidor | Dados de pedidos | Obrigação legal — art. 7º, II |
| Manter o site seguro e prevenir fraudes | Sessão, hash de IP, logs técnicos | Legítimo interesse — art. 7º, IX |
| Ativar cookies/ferramentas opcionais | Registro de consentimento | Consentimento — art. 7º, I |

As bases legais indicadas são as previstas para esta implementação e devem ser validadas com o jurídico da organização antes da publicação.

## 4. Como usamos os dados

Usamos os dados para responder solicitações, preparar orçamentos, processar pedidos, entregar produtos, manter a segurança do site e cumprir obrigações legais. **Não vendemos dados pessoais.** Não utilizamos os dados coletados nos formulários para publicidade comportamental nem para finalidades incompatíveis com as informadas aqui. Se isso mudar, solicitaremos base legal adequada e atualizaremos esta política.

## 5. Compartilhamento com terceiros

Podemos compartilhar dados estritamente necessários com:

- **Hospedagem e infraestrutura:** provedor onde o site e o banco de dados são executados.
- **E-mail transacional:** serviço de envio de notificações, **apenas se configurado** (variáveis de ambiente do provedor).
- **Gateway de pagamento:** para processar pagamentos, **apenas se a integração estiver ativa**. Dados de pagamento são tratados diretamente pelo gateway.
- **Autoridades públicas:** quando houver obrigação legal ou requisição válida.

Nesta versão, os serviços externos de e-mail e pagamento estão **desativados por padrão** e nenhum dado é enviado a eles. Ferramentas de análise e publicidade também não são carregadas sem consentimento.

## 6. Cookies e tecnologias semelhantes

Utilizamos por padrão apenas armazenamento estritamente necessário: sessão do painel administrativo, registro da escolha de consentimento e itens do carrinho. Cookies opcionais de análise e publicidade permanecem desativados até consentimento válido e, nesta versão, nenhum fornecedor opcional está configurado. Consulte a [Política de Cookies](/cookies) e use o link **Preferências de cookies** no rodapé para revisar sua escolha.

## 7. Retenção e descarte

Critérios adotados nesta implementação, que devem ser confirmados com o jurídico e ajustados à operação real:

- Solicitações de orçamento e contatos: até **24 meses** após o último contato, salvo necessidade de defesa em processo ou negociação em andamento.
- Pedidos e dados fiscais: pelo prazo necessário ao cumprimento de obrigações legais e defesa de direitos, adotando-se como referência **5 anos**.
- Registros de consentimento: pelo prazo de validade da escolha e até **12 meses** após a expiração, sem dados pessoais identificáveis.
- Logs técnicos e registros de limitação de requisições: até **30 dias**.
- Sessões administrativas: expiram automaticamente; registros expirados são removidos.

Após o prazo, os dados são excluídos ou anonimizados de forma segura, ressalvadas obrigações legais de conservação.

## 8. Segurança

Medidas implementadas: validação de dados no servidor, senhas com hash scrypt e salt individual, sessões em cookies httpOnly com SameSite, proteção CSRF no painel, limitação de requisições, verificação de tipo e tamanho de arquivos enviados, cabeçalhos de segurança HTTP e separação entre área pública e administrativa. Nenhuma medida é absoluta: incidentes devem ser comunicados pelo canal de privacidade assim que identificados.

## 9. Seus direitos

Você pode solicitar, nos limites da LGPD: confirmação da existência de tratamento; acesso; correção de dados incompletos, inexatos ou desatualizados; anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade; portabilidade; informação sobre compartilhamento; revogação do consentimento; e revisão de decisões automatizadas, quando aplicável.

Para exercer seus direitos, use o [formulário de contato](/contato) com o assunto **Privacidade e dados pessoais** ou o e-mail de privacidade informado nesta página, quando configurado. Responderemos no prazo legal, podendo solicitar informações mínimas para confirmar a identidade do titular. Você também pode reclamar perante a ANPD.

## 10. Alterações

Esta política pode ser atualizada para refletir mudanças reais no site, nos fornecedores ou na legislação. A versão revisada será publicada nesta página antes de produzir efeitos.`,
    cookiesPolicy: `## O que são cookies

Cookies são pequenos arquivos armazenados pelo navegador. Também utilizamos armazenamento local (localStorage) para funções essenciais, como manter o carrinho e lembrar sua escolha de privacidade. Tratamos essas tecnologias de forma equivalente para fins de transparência e consentimento.

## Categorias utilizadas neste site

### 1. Estritamente necessários — sempre ativos

Não podem ser desativados, pois são indispensáveis ao funcionamento do site:

| Nome / tecnologia | Finalidade | Duração |
| --- | --- | --- |
| \`venly_session\` (cookie httpOnly) | Manter a sessão autenticada do painel administrativo | Até 7 dias ou ao sair |
| \`venly_csrf\` (cookie) | Proteger formulários administrativos contra CSRF | Até 7 dias ou ao sair |
| \`venly_consent\` (localStorage) | Registrar a escolha de consentimento e sua versão | 180 dias |
| \`venly_cart\` (localStorage) | Manter os itens do carrinho de compras | Até a conclusão ou limpeza do carrinho |

Esses dados não são usados para publicidade, perfilamento ou rastreamento entre sites.

### 2. Análise e desempenho — opcionais

Permanecem **desativados até consentimento válido**. Nesta versão, nenhuma ferramenta de análise está configurada; somente se um identificador for configurado pelo administrador o script correspondente poderá ser carregado, e nunca antes da autorização.

### 3. Publicidade e rastreamento — opcionais

Permanecem **desativados até consentimento válido**. Nesta versão, nenhum pixel ou ferramenta de publicidade está configurada. Não fazemos publicidade comportamental com dados de formulários.

## Como funciona o consentimento

- Na primeira visita, você vê um aviso com três opções igualmente acessíveis: **Aceitar todos**, **Recusar não essenciais** e **Configurar preferências**.
- Nenhuma caixa opcional vem marcada previamente e nenhum script opcional é carregado antes da escolha.
- Recusar não essenciais não prejudica nenhuma função essencial do site.
- Você pode alterar sua escolha a qualquer momento pelo link **Preferências de cookies** no rodapé ou pelo botão nesta página.
- A escolha é registrada com versão do aviso, data e categorias autorizadas, usando identificador opaco que não identifica você.
- A escolha expira em **180 dias**; ao expirar, o aviso é exibido novamente. Se a versão do aviso mudar, novas categorias só serão ativadas após nova manifestação.
- Ao retirar o consentimento, os scripts opcionais correspondentes deixam de ser carregados nas novas navegações e o armazenamento opcional é limpo.

## Verificação

A implementação foi testada nos fluxos de aceitar, recusar e alterar preferências. Nesta página você pode conferir, em tempo real, quais categorias estão ativas e se algum recurso opcional foi carregado.`,
    terms: `## 1. Sobre estes termos

Estes Termos de Uso regulam a navegação e o uso deste site da **Venly Esports**. Ao utilizar o site, você concorda com as condições abaixo. Este é um texto inicial e deve ser revisado antes da publicação definitiva, especialmente quando dados societários e canais oficiais forem definidos.

## 2. Conteúdo demonstrativo

Partes deste site — incluindo projetos do portfólio, produtos, preços, imagens e textos institucionais — estão identificadas como **demonstrativas ou provisórias**. Elas existem para apresentar a estrutura do site e não constituem oferta real de produto, serviço, vaga ou resultado. Informações oficiais substituirão esse conteúdo por meio do painel administrativo.

## 3. Solicitações de mapas

O formulário **Solicite seu mapa** é um pedido de orçamento, não uma compra. O envio não cria obrigação de contratação nem de pagamento. A Venly Esports analisará a ideia e poderá entrar em contato para discutir requisitos, prazos e proposta comercial. Nenhuma cobrança é feita automaticamente.

## 4. Loja e pagamentos

A loja exibe um catálogo administrável. A finalização de pedidos depende da configuração de um gateway de pagamento. **Se a integração não estiver configurada, o checkout permanece explicitamente inativo** e nenhum pagamento é processado ou simulado. Quando ativado, o pagamento será processado pelo gateway, responsável pelos dados do meio de pagamento. Preços, disponibilidade e prazos devem ser confirmados antes da compra.

## 5. Uso aceitável

É proibido usar o site para fins ilícitos, enviar conteúdo ofensivo, violar direitos de terceiros, tentar acessar áreas restritas ou contornar mecanismos de segurança. O envio de arquivos deve respeitar direitos autorais e as limitações de tipo e tamanho indicadas nos formulários.

## 6. Propriedade intelectual

A marca, a logo, os elementos visuais e o conteúdo original deste site pertencem à Venly Esports ou a seus licenciadores. A logo exibida é o arquivo oficial fornecido e não pode ser alterada ou reutilizada sem autorização. Referências enviadas por clientes permanecem sob responsabilidade de quem as enviou.

## 7. Limitação de responsabilidade

O site é oferecido em caráter informativo e comercial, com esforços razoáveis de disponibilidade e segurança. Não garantimos funcionamento ininterrupto nem isenção de falhas. A organização não se responsabiliza por danos indiretos decorrentes do uso do site, nos limites permitidos pela legislação brasileira.

## 8. Privacidade

O tratamento de dados pessoais é descrito na [Política de Privacidade](/privacidade) e na [Política de Cookies](/cookies).

## 9. Alterações e contato

Podemos atualizar estes termos; a versão vigente será sempre a publicada nesta página. Dúvidas podem ser enviadas pelo [formulário de contato](/contato).

## 10. Foro e legislação aplicável

Aplica-se a legislação brasileira. O foro competente será definido na versão definitiva destes termos, observadas as normas do Código de Defesa do Consumidor.`,
  },
  consent: {
    version: '2026-10-v1',
    policyTitle: 'Sua privacidade, suas regras',
    policyText:
      'Usamos apenas cookies e armazenamento estritamente necessários (sessão, segurança, carrinho e registro da sua escolha). Cookies opcionais de análise e publicidade só serão ativados com a sua autorização, e você pode mudar de ideia quando quiser.',
  },
  footer: {
    note: 'Venly Esports · Comunidade, competição e criação. Projeto em configuração — conteúdos oficiais pendentes de cadastro.',
  },
};
