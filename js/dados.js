/* Saberes que Cultivam — dados fixos do projeto.
   Fonte: Plano de Trabalho do TED assinado com o MDA em 17/07/2026 (Plano de Ação 30879420260055-006262, SEI 55000.010072/2026-02):
   metas, etapas e cronograma físico (é o compromisso que o SEAB/MDA acompanha).
   Plano de Trabalho universal, versão 4 (atualização de 07/10/2026), executado via FUNCERN (contrato 220/2026): orçamento por rubrica (item 14).
   O v4 traz outras janelas de mês por meta (ex.: Meta 1 só em ago/2026); o cronograma do sistema segue o TED de propósito.
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
    { id: 'bolsa_pesquisador', n: 1, nome: 'Bolsas de pesquisador', v: 46000 },
    { id: 'bolsa_estudante', n: 2, nome: 'Bolsas de estudante', v: 14400 },
    { id: 'diarias', n: 4, nome: 'Diárias', v: 9600 },
    { id: 'ajuda_custo', n: 5, nome: 'Ajuda de custo (pessoa física)', v: 10000 },
    { id: 'passagens', n: 6, nome: 'Passagens e locomoção', v: 39000 },
    { id: 'servicos_pj', n: 7, nome: 'Serviços de terceiros (pessoa jurídica)', v: 170000 },
    { id: 'consumo', n: 9, nome: 'Material de consumo', v: 61000 },
    { id: 'equipamentos', n: 10, nome: 'Máquinas e equipamentos', v: 10000 },
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


  /* Plano de desembolso (planilha "Plano de desembolso - Saberes que Cultivam", atualização de 05/10/2026), ajustado ao plano universal v4 (07/10/2026):
     quanto cada item do orçamento prevê gastar em cada mês, de ago/2026 a jul/2027. É a linha "previsto" do gráfico de ritmo do gasto.
     Itens que o v4 mudou e que a planilha de 05/10 ainda não tinha (i02, i03, i04, i05, i11, i14 e o i16 novo): bolsas pelo período da equipe
     no v4 (item 13); os demais com o mesmo formato mensal da planilha, no valor novo. Quando a FUNCERN mandar a planilha nova, troque por ela.
     Mudou a planilha? Mude aqui: os testes conferem que cada rubrica e o total continuam batendo com o plano. */
  /* id do item: é o que a despesa guarda no campo "item". Não reaproveite nem troque um id já usado; item novo recebe o próximo número. */
  const DESEMBOLSO = { inicio: '2026-08', itens: [
    { id: 'i01', rubrica: 'bolsa_pesquisador', nome: 'Bolsa - coordenador do projeto', m: [0, 2181.82, 2181.82, 2181.82, 2181.82, 2181.82, 2181.82, 2181.82, 2181.82, 2181.82, 2181.82, 2181.8] },
    { id: 'i02', rubrica: 'bolsa_pesquisador', nome: 'Bolsa - auxiliar administrativo', m: [0, 0, 1400, 1400, 1400, 1400, 1400, 1400, 1400, 1400, 1400, 1400] },   // v4: 10 × R$ 1.400, out/2026 a jul/2027
    { id: 'i03', rubrica: 'bolsa_estudante', nome: 'Bolsa - apoio técnico (discente)', m: [0, 0, 0, 0, 1800, 1800, 1800, 1800, 1800, 1800, 1800, 1800] },   // v4: 3 discentes × 8 × R$ 600, dez/2026 a jul/2027
    { id: 'i04', rubrica: 'diarias', nome: 'Diárias', m: [0, 0, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 800, 800] },   // v4: 24 × R$ 400
    { id: 'i05', rubrica: 'ajuda_custo', nome: 'Ajuda de custo', m: [0, 0, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000] },   // v4: 4 dias de campo × R$ 2.500 (Meta 5)
    { id: 'i06', rubrica: 'passagens', nome: 'Passagens', m: [0, 0, 3500, 3500, 3500, 0, 0, 3500, 3500, 0, 3500, 0] },
    { id: 'i07', rubrica: 'passagens', nome: 'Locação de veículos', m: [0, 0, 1800, 1800, 1800, 1800, 1800, 1800, 1800, 1800, 1800, 1800] },
    { id: 'i08', rubrica: 'servicos_pj', nome: 'Serviços gráficos e comunicação visual', m: [0, 0, 0, 0, 0, 0, 0, 2000, 2000, 2000, 2000, 2000] },
    { id: 'i09', rubrica: 'servicos_pj', nome: 'Produção de material didático', m: [0, 0, 0, 0, 0, 0, 0, 4000, 3000, 3000, 0, 0] },
    { id: 'i10', rubrica: 'servicos_pj', nome: 'Implantação das Unidades de Produção de Bioinsumos', m: [0, 0, 75000, 0, 0, 0, 0, 75000, 0, 0, 0, 0] },
    { id: 'i11', rubrica: 'consumo', nome: 'Combustível', m: [0, 0, 900, 900, 900, 900, 900, 900, 900, 900, 900, 900] },   // v4: R$ 9.000
    { id: 'i12', rubrica: 'consumo', nome: 'Kits para produção de bioinsumos', m: [0, 0, 15000, 0, 0, 0, 0, 15000, 0, 0, 0, 0] },
    { id: 'i13', rubrica: 'consumo', nome: 'Insumos para produção de bioinsumos', m: [0, 0, 11000, 0, 0, 0, 0, 11000, 0, 0, 0, 0] },
    { id: 'i14', rubrica: 'equipamentos', nome: 'Material diverso', m: [0, 0, 0, 0, 0, 0, 0, 10000, 0, 0, 0, 0] },   // v4: R$ 10.000
    { id: 'i15', rubrica: 'doa', nome: 'DOA - FUNCERN', m: [20000, 0, 0, 0, 0, 0, 0, 20000, 0, 0, 0, 0] },
    { id: 'i16', rubrica: 'bolsa_pesquisador', nome: 'Bolsa - formador(a)', m: [0, 0, 0, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 0] }   // novo no v4: 80 atividades × R$ 100, nov/2026 a jun/2027 (Meta 3)
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
    TABELAS: ['unidades', 'itens', 'lotes', 'agricultores', 'distribuicoes', 'visitas', 'eventos', 'entregas', 'despesas', 'pessoas', 'membros', 'presencas', 'fotos']
  };
})();
