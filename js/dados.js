/* Saberes que Cultivam — dados fixos do projeto.
   Fonte: Plano de Trabalho do TED (Plano de Ação 30879420260055-006262, SEI 55000.010072/2026-02)
   e Plano de Trabalho universal (11 meses, ago/2026 a 30/07/2027), executado via FUNCERN (contrato 220/2026).
   Mudou o plano? Mude aqui e rode os testes: eles conferem que os totais fecham em R$ 400.000,00. */
(function () {
  const G = typeof window !== 'undefined' ? window : globalThis;
  const SQC = (G.SQC = G.SQC || {});

  const METAS = {
    1: 'Diagnóstico territorial e planejamento', 2: 'Implantação das unidades de produção',
    3: 'Capacitação, acompanhamento e segurança', 4: 'Produção e monitoramento do uso',
    5: 'Avaliação e validação participativa', 6: 'Comunicação, gestão e prestação de contas'
  };
  /* q = quantidade prevista, v = valor unitário; ini/fim = mês de início e fim no cronograma físico-financeiro */
  const ETAPAS = [
    { id: '1.1', m: 1, nome: 'Diagnóstico socioeconômico, produtivo e tecnológico', un: 'relatório técnico', q: 1, v: 35000, ini: '2026-07', fim: '2027-07' },
    { id: '2.1', m: 2, nome: 'Estruturação física e operacional das unidades', un: 'unidade em funcionamento', q: 2, v: 82500, ini: '2026-08', fim: '2027-01' },
    { id: '3.1', m: 3, nome: 'Materiais didáticos e instrumentos de apoio', un: 'material didático', q: 1, v: 10000, ini: '2026-10', fim: '2027-05' },
    { id: '3.2', m: 3, nome: 'Ações de capacitação e formação', un: 'capacitação', q: 5, v: 5000, ini: '2026-11', fim: '2027-04' },
    { id: '3.3', m: 3, nome: 'Orientação técnica e kits de apoio', un: 'kit distribuído', q: 30, v: 1000, ini: '2026-12', fim: '2027-05' },
    { id: '4.1', m: 4, nome: 'Produção, distribuição e acompanhamento do uso', un: 'unidade produtiva', q: 30, v: 2000, ini: '2026-07', fim: '2027-06' },
    { id: '5.1', m: 5, nome: 'Dias de campo e validação participativa', un: 'dia de campo', q: 4, v: 2500, ini: '2026-07', fim: '2027-07' },
    { id: '5.2', m: 5, nome: 'Sistematização e avaliação dos resultados', un: 'relatório de avaliação', q: 1, v: 5000, ini: '2026-07', fim: '2027-07' },
    { id: '6.1', m: 6, nome: 'Materiais e ações de comunicação', un: 'produto de comunicação', q: 10, v: 1000, ini: '2026-07', fim: '2027-07' },
    { id: '6.2', m: 6, nome: 'Monitoramento e prestação de contas', un: 'relatório', q: 1, v: 10000, ini: '2026-07', fim: '2027-07' },
    { id: '6.3', m: 6, nome: 'Gestão administrativa e financeira (FUNCERN)', un: 'contrato com a fundação', q: 1, v: 40000, ini: '2026-07', fim: '2027-07' }
  ];
  /* etapas cujo "realizado" o sistema conta sozinho (as demais contam pelos registros da aba Entregas) */
  const ETAPAS_AUTOMATICAS = ['2.1', '3.2', '3.3', '4.1', '5.1'];

  /* Rubricas do orçamento resumido do plano universal (item 14). É por rubrica que a FUNCERN controla o gasto.
     Rubricas com valor zero no plano (CLT, pessoa física, ressarcimento, outros custos) ficam de fora. */
  const RUBRICAS = [
    { id: 'bolsa_pesquisador', n: 1, nome: 'Bolsas de pesquisador', v: 38400 },
    { id: 'bolsa_estudante', n: 2, nome: 'Bolsas de estudante', v: 21600 },
    { id: 'diarias', n: 4, nome: 'Diárias', v: 7200 },
    { id: 'ajuda_custo', n: 5, nome: 'Ajuda de custo (pessoa física)', v: 14400 },
    { id: 'passagens', n: 6, nome: 'Passagens e locomoção', v: 39000 },
    { id: 'servicos_pj', n: 7, nome: 'Serviços de terceiros (pessoa jurídica)', v: 170000 },
    { id: 'consumo', n: 9, nome: 'Material de consumo', v: 60100 },
    { id: 'equipamentos', n: 10, nome: 'Máquinas e equipamentos', v: 9300 },
    { id: 'doa', n: 13, nome: 'Despesas operacionais e administrativas (FUNCERN)', v: 40000 }
  ];

  /* tipo de bioinsumo: [prefixo do código do lote, dias até ficar pronto, medida] */
  const TIPOS = {
    'Composto orgânico': ['CMP', 90, 'kg'], 'Biofertilizante líquido': ['BIO', 30, 'L'], 'Húmus de minhoca': ['HUM', 60, 'kg'],
    'Bokashi': ['BOK', 15, 'kg'], 'Microrganismos eficientes (EM)': ['EM', 15, 'L'], 'Microrganismo isolado': ['ISO', 7, 'L'], 'Outro': ['OUT', 30, 'kg']
  };
  /* passos da implantação de uma unidade de produção (colunas booleanas da tabela unidades) */
  const CHECK = [['local_ok', 'Local definido'], ['parceiro_ok', 'Parceiro institucional definido'], ['termo', 'Termo de doação ou cessão formalizado'],
    ['itens_ok', 'Lista de itens fechada'], ['orcamento', 'Orçamentos enviados à FUNCERN'], ['entregue', 'Itens entregues'],
    ['montada', 'Estrutura montada'], ['funcionando', 'Em funcionamento']];


  /* Plano de desembolso (planilha "Plano de desembolso - Saberes que Cultivam", atualização de 05/10/2026):
     quanto cada item do orçamento prevê gastar em cada mês, de ago/2026 a jul/2027. É a linha "previsto" do gráfico de ritmo do gasto.
     Mudou a planilha? Mude aqui: os testes conferem que cada rubrica e o total continuam batendo com o plano. */
  const DESEMBOLSO = { inicio: '2026-08', itens: [
    { rubrica: 'bolsa_pesquisador', nome: 'Bolsa - coordenador do projeto', m: [0, 2181.82, 2181.82, 2181.82, 2181.82, 2181.82, 2181.82, 2181.82, 2181.82, 2181.82, 2181.82, 2181.8] },
    { rubrica: 'bolsa_pesquisador', nome: 'Bolsa - auxiliar administrativo', m: [0, 0, 0, 1600, 1600, 1600, 1600, 1600, 1600, 1600, 1600, 1600] },
    { rubrica: 'bolsa_estudante', nome: 'Bolsa - apoio técnico (discente)', m: [0, 0, 0, 2400, 2400, 2400, 2400, 2400, 2400, 2400, 2400, 2400] },
    { rubrica: 'diarias', nome: 'Diárias', m: [0, 0, 800, 800, 800, 800, 800, 800, 800, 800, 400, 400] },
    { rubrica: 'ajuda_custo', nome: 'Ajuda de custo', m: [0, 0, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1200, 1200] },
    { rubrica: 'passagens', nome: 'Passagens', m: [0, 0, 3500, 3500, 3500, 0, 0, 3500, 3500, 0, 3500, 0] },
    { rubrica: 'passagens', nome: 'Locação de veículos', m: [0, 0, 1800, 1800, 1800, 1800, 1800, 1800, 1800, 1800, 1800, 1800] },
    { rubrica: 'servicos_pj', nome: 'Serviços gráficos e comunicação visual', m: [0, 0, 0, 0, 0, 0, 0, 2000, 2000, 2000, 2000, 2000] },
    { rubrica: 'servicos_pj', nome: 'Produção de material didático', m: [0, 0, 0, 0, 0, 0, 0, 4000, 3000, 3000, 0, 0] },
    { rubrica: 'servicos_pj', nome: 'Implantação das Unidades de Produção de Bioinsumos', m: [0, 0, 75000, 0, 0, 0, 0, 75000, 0, 0, 0, 0] },
    { rubrica: 'consumo', nome: 'Combustível', m: [0, 0, 810, 810, 810, 810, 810, 810, 810, 810, 810, 810] },
    { rubrica: 'consumo', nome: 'Kits para produção de bioinsumos', m: [0, 0, 15000, 0, 0, 0, 0, 15000, 0, 0, 0, 0] },
    { rubrica: 'consumo', nome: 'Insumos para produção de bioinsumos', m: [0, 0, 11000, 0, 0, 0, 0, 11000, 0, 0, 0, 0] },
    { rubrica: 'equipamentos', nome: 'Material diverso', m: [0, 0, 0, 0, 0, 0, 0, 9300, 0, 0, 0, 0] },
    { rubrica: 'doa', nome: 'DOA - FUNCERN', m: [20000, 0, 0, 0, 0, 0, 0, 20000, 0, 0, 0, 0] }
  ] };

  SQC.dados = {
    NOME: 'Saberes que Cultivam',
    NOME_COMPLETO: 'Saberes que Cultivam: Bioinsumos, Agroecologia e Fortalecimento da Agricultura Familiar na Região Nordeste',
    IDENT: 'TED MDA/IFRN · Plano de Ação 30879420260055-006262 · Processo SEI 55000.010072/2026-02 · Execução: IFRN Campus Apodi, via FUNCERN (contrato 220/2026)',
    METAS, ETAPAS, ETAPAS_AUTOMATICAS, RUBRICAS, TIPOS, CHECK, DESEMBOLSO,
    VIGENCIA: { ini: '2026-08-01', fim: '2027-07-30' },
    TOTAL: 400000,
    /* parcelas do TED repassadas à FUNCERN. Chegou parcela nova? Acrescente aqui. */
    PARCELAS: [{ valor: 200000, data: '2026-09-22', doc: '2026NS001323', recebida: true }, { valor: 200000, previsao: '2027-03', recebida: false }],
    TETO_UNIDADE: 82500,
    TERRITORIOS: ['Potengi/RN', 'Maciço de Baturité/CE', 'Outro'],
    /* janela do cronograma na tela: jul/2026 a jul/2027 (13 meses) */
    G0: '2026-07-01', G1: '2027-08-01',
    TABELAS: ['unidades', 'itens', 'lotes', 'agricultores', 'distribuicoes', 'visitas', 'eventos', 'entregas', 'despesas', 'pessoas']
  };
})();
