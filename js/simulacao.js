/* Saberes que Cultivam — SIMULAÇÃO: o sistema inteiro povoado com dados FICTÍCIOS, para ver como fica com o projeto andando.
   Abre com  ?simulacao  no endereço (data simulada: fim do projeto, 31/07/2027) ou  ?simulacao=AAAA-MM-DD  (qualquer dia da vigência).
   Na simulação: nada fala com o Supabase (vira modo demonstração), os dados ficam só neste navegador, o relógio do sistema
   passa a marcar a data escolhida e uma faixa no alto avisa que tudo é fictício. Sem  ?simulacao  este arquivo não faz nada.
   Nomes, comunidades e valores são inventados (sorteio com semente fixa: a mesma data gera sempre os mesmos dados). */
(function () {
  const G = window, SQC = (G.SQC = G.SQC || {});
  const q = new URLSearchParams(location.search);
  if (!q.has('simulacao')) return;
  const pedido = q.get('simulacao') || '';
  const dia = /^\d{4}-\d{2}-\d{2}$/.test(pedido) && pedido >= '2026-08-01' && pedido <= '2027-07-31' ? pedido : '2027-07-31';
  SQC.SIMULACAO = { dia };
  SQC.CONFIG = Object.assign({}, SQC.CONFIG || {}, { supabaseUrl: '', supabaseAnonKey: '', semServiceWorker: true });   // nunca o banco de verdade

  /* relógio: o dia escolhido, na hora atual (o tempo continua passando, para a sessão e os avisos funcionarem) */
  const RD = Date, meiaNoite = new RD(); meiaNoite.setHours(0, 0, 0, 0);
  const desloc = new RD(dia + 'T00:00:00').getTime() - meiaNoite.getTime();
  class DataSimulada extends RD {
    constructor(...a) { if (a.length) super(...a); else super(RD.now() + desloc); }
    static now() { return RD.now() + desloc; }
  }
  G.Date = DataSimulada;

  /* faixa de aviso, sempre visível */
  const br = s => s.split('-').reverse().join('/');
  const faixa = () => {
    if (document.getElementById('sim-faixa')) return;
    const d = document.createElement('div'); d.id = 'sim-faixa'; d.setAttribute('role', 'note');
    const ir = x => `?simulacao=${x}`;
    d.innerHTML = `<b>Simulação com dados fictícios</b><span>Data simulada: ${br(dia)}. Nada aqui vai para o banco do projeto.</span>`
      + `<span class="sim-ir">Ver em: <a href="${ir('2026-10-31')}">out/2026</a> · <a href="${ir('2027-01-31')}">jan/2027</a> · <a href="${ir('2027-04-30')}">abr/2027</a> · <a href="${ir('2027-07-31')}">fim do projeto</a> · <a href="${location.pathname}">sair da simulação</a></span>`;
    document.body.prepend(d);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', faixa); else faixa();

  /* 2ª parcela do TED: na simulação, chega na data prevista (só nesta página; js/dados.js não muda). Chamado a cada carga. */
  SQC.simularPlano = function () {
    SQC.dados.PARCELAS.forEach(p => { if (!p.recebida && p.previsao && p.previsao + '-20' <= dia) { p.recebida = true; p.data = p.previsao + '-20'; p.doc = '(simulação)'; } });
  };

  /* ---------------- gerador ---------------- */
  SQC.simular = function (base) {
    const R = SQC.regras, D = SQC.dados;
    let s = 20261014; const sorte = () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const entre = (a, b) => a + Math.floor(sorte() * (b - a + 1)), um = l => l[Math.floor(sorte() * l.length)];
    const pd = x => new RD(x + 'T12:00:00'), iso = x => R.iso(x), mais = (x, n) => { const d = pd(x); d.setDate(d.getDate() + n); return iso(d); };
    const HOJE = dia, ja = x => x && x <= HOJE;
    let n = 0; const id = p => `${p}-sim-${++n}`;
    const db = base;

    /* equipe (fictícia) */
    const mb = (funcao, nome, vinculo, inicio, extra) => Object.assign({ id: id('m'), funcao, nome, vinculo, email: `${nome.split(' ')[0].toLowerCase()}@exemplo.br`, telefone: '(00) 00000-0000', municipio: 'Apodi/RN', inicio, lgpd: true, arlo: 'Não', outra_bolsa: 'Não' }, extra || {});
    db.membros = db.membros.filter(m => m.funcao === 'coordenacao').concat([
      mb('auxiliar', 'Lívia Auxiliar (fictícia)', 'IFRN Campus Apodi', '2026-10-01'),
      mb('discente', 'Caio Discente (fictício)', 'Tecnologia em Agroecologia', '2026-12-01'),
      mb('discente', 'Bruna Discente (fictícia)', 'Tecnologia em Agroecologia', '2026-12-01'),
      mb('discente', 'Davi Discente (fictício)', 'Tecnologia em Agroecologia', '2026-12-01', { fim: '2027-04-30', motivo: 'Concluiu o curso' }),
      mb('discente', 'Elisa Discente (fictícia)', 'Tecnologia em Agroecologia', '2027-05-01'),
      mb('formador', 'Rita Formadora (fictícia)', 'Associação parceira', '2026-11-01'),
      mb('formador', 'Paulo Formador (fictício)', 'Técnico de ATER', '2026-11-01')]).filter(m => ja(m.inicio));
    db.membros.forEach(m => { if (m.fim && !ja(m.fim)) { delete m.fim; delete m.motivo; } });

    /* unidades de produção: implantação passo a passo, com as datas de cada passo */
    const passos = { u1: ['2026-08-20', '2026-09-10', '2026-10-15', '2026-11-05', '2026-11-20', '2026-12-18', '2027-01-12', '2027-01-26'],
      u2: ['2026-08-25', '2026-09-18', '2026-10-28', '2026-11-12', '2026-11-27', '2027-01-08', '2027-02-05', '2027-02-19'] };
    const parceiro = { u1: 'Associação de agricultores do Potengi (fictícia)', u2: 'Cooperativa do Maciço (fictícia)' };
    db.unidades.forEach(u => { const p = passos[u.id]; if (!p) return;
      D.CHECK.forEach((c, i) => { u[c[0]] = ja(p[i]); });
      if (u.parceiro_ok) u.parceiro = parceiro[u.id]; if (u.local_ok) u.modelo = 'Microrganismos isolados'; u.responsavel = 'Técnico responsável (fictício)'; });
    const comeca = { u3: '2026-08-05', u1: passos.u1[7], u2: passos.u2[7] };

    /* itens das unidades (compra pela FUNCERN) */
    db.itens = [];
    [['u1', passos.u1], ['u2', passos.u2]].forEach(([u, p]) => {
      [['Biorreator de 500 L com agitador', 18000, 'servicos_pj'], ['Estrutura coberta e bancadas', 26000, 'servicos_pj'], ['Caixas d’água e tubulação', 9000, 'servicos_pj'],
        ['Bomba e instalação elétrica', 7500, 'servicos_pj'], ['Balança e medidores', 4500, 'servicos_pj'], ['Material de laboratório', 5000, 'equipamentos']].forEach(([descricao, valor, rubrica]) => {
        if (!ja(p[3])) return;
        const status = ja(p[5]) ? 'Entregue' : ja(p[4]) ? 'Em compras na FUNCERN' : 'Orçamento enviado';
        db.itens.push({ id: id('i'), unidade: u, descricao, valor, rubrica, status, data: status === 'Entregue' ? p[5] : p[4] > HOJE ? p[3] : p[4] });
      });
    });

    /* lotes: a base do campus produz desde agosto; os polos, depois de entrar em funcionamento */
    const tiposDe = { u3: ['Húmus de minhoca', 'Composto orgânico', 'Biofertilizante líquido'], u1: ['Microrganismo isolado', 'Microrganismos eficientes (EM)', 'Bokashi'], u2: ['Microrganismo isolado', 'Microrganismos eficientes (EM)', 'Bokashi'] };
    const seq = {}; db.lotes = [];
    Object.keys(comeca).forEach(u => {
      const un = db.unidades.find(x => x.id === u); if (!un) return;
      for (let ini = comeca[u], k = 0; ja(ini); ini = mais(ini, entre(14, 22)), k++) {
        const tipo = tiposDe[u][k % 3], [pre, dias, med] = D.TIPOS[tipo], pronto = mais(ini, dias);
        const cod = `${un.sigla}-${pre}`; seq[cod] = (seq[cod] || 0) + 1;
        db.lotes.push({ id: id('l'), codigo: `${cod}-${String(seq[cod]).padStart(3, '0')}`, unidade: u, tipo, inicio: ini, dias, qtd: med === 'L' ? entre(200, 400) : entre(250, 600), med,
          insumos: { 'Húmus de minhoca': 'Esterco bovino curtido, restos de capina', 'Composto orgânico': 'Palhada, esterco e poda triturada', 'Biofertilizante líquido': 'Esterco fresco, melaço, cinzas, água sem cloro',
            'Microrganismo isolado': 'Cepa local isolada da mata, meio de cultura', 'Microrganismos eficientes (EM)': 'Arroz cozido, melaço, serrapilheira', 'Bokashi': 'Farelos, carvão, EM ativado' }[tipo],
          responsavel: 'Equipe do polo (fictícia)', status: ja(pronto) ? 'Pronto' : mais(ini, 3) <= HOJE ? 'Maturando' : 'Em preparo', obs: '' });
      }
    });

    /* unidades produtivas acompanhadas (32 cadastros fictícios: 30 da meta e 2 que entraram no fim) */
    const mulheres = ['Maria', 'Francisca', 'Antônia', 'Raimunda', 'Josefa', 'Luzia', 'Terezinha', 'Rita', 'Cícera', 'Joana', 'Socorro', 'Fátima', 'Aparecida', 'Edileuza', 'Damiana', 'Lúcia'];
    const homens = ['José', 'João', 'Antônio', 'Francisco', 'Raimundo', 'Pedro', 'Sebastião', 'Manoel', 'Luiz', 'Paulo', 'Cícero', 'Expedito', 'Valdir', 'Geraldo', 'Damião', 'Severino'];
    const sobren = ['Silva', 'Souza', 'Oliveira', 'Lima', 'Pereira', 'Costa', 'Ferreira', 'Almeida', 'Nascimento', 'Carvalho', 'Araújo', 'Ribeiro', 'Gomes', 'Barbosa', 'Rocha', 'Dantas'];
    const RN = ['São Paulo do Potengi', 'Barcelona', 'Ruy Barbosa', 'São Pedro', 'Lagoa de Velhos', 'Riachuelo', 'Santa Maria', 'Senador Elói de Souza'];
    const CE = ['Mulungu', 'Baturité', 'Guaramiranga', 'Pacoti', 'Aratuba', 'Capistrano', 'Redenção', 'Palmácia'];
    const lugares = ['Assentamento Esperança', 'Sítio Lagoa Seca', 'Comunidade Serrote', 'Sítio Riacho Fundo', 'Vila Boa Vista', 'Sítio Pau-Ferro', 'Comunidade Quilombola Serra Verde', 'Sítio Olho d’Água'];
    const culturas = ['Hortaliças', 'Milho e feijão', 'Banana e macaxeira', 'Café sombreado', 'Frutíferas', 'Hortaliças e ervas', 'Feijão-verde e jerimum', 'Mandioca'];
    db.agricultores = []; const usados = new Set();
    for (let i = 0; i < 32; i++) {
      const ce = i % 2 === 1, mulher = i % 3 !== 2; let nome;
      do { nome = `${um(mulher ? mulheres : homens)} ${um(sobren)} ${um(sobren)}`; } while (usados.has(nome)); usados.add(nome);
      const diag = i < 30 ? mais('2026-09-15', Math.floor(i * 6.2) + entre(0, 4)) : mais('2027-06-01', i);
      if (!ja(diag)) continue;
      const kitdata = i < 30 ? mais('2026-12-05', Math.floor(i * 5.4) + entre(0, 3)) : '';
      const kit = !!kitdata && ja(kitdata), g0 = entre(9, 45) * 10;
      db.agricultores.push({ id: id('a'), nome: `${nome} (${mulher ? 'fictícia' : 'fictício'})`, comunidade: um(lugares), municipio: um(ce ? CE : RN), uf: ce ? 'CE' : 'RN', territorio: ce ? 'Maciço de Baturité/CE' : 'Potengi/RN',
        unidade: ce ? 'u2' : 'u1', culturas: um(culturas), area: entre(3, 30) / 10, diag, quimico: um(['Sim', 'Parcial', 'Parcial', 'Não']), gasto0: g0, kit, kitdata: kit ? kitdata : '', _mulher: mulher });
    }

    /* entregas de bioinsumo, respeitando lote pronto, data e saldo; depois de cada entrega, uma visita */
    const saldo = new Map(db.lotes.map(l => [l.id, l.qtd])), pedidos = [];
    db.agricultores.forEach(a => { let d = mais(a.diag, entre(12, 25)); for (let k = 0; k < 5 && ja(d) && d <= '2027-07-20'; k++, d = mais(d, entre(30, 48))) pedidos.push({ a, d, k }); });
    pedidos.sort((x, y) => x.d < y.d ? -1 : 1);
    db.distribuicoes = []; db.visitas = [];
    const ultimaVisita = new Map();
    pedidos.forEach(({ a, d }) => {
      const qtd = entre(3, 8) * 5, pronto = l => mais(l.inicio, l.dias) <= d && l.status === 'Pronto' && saldo.get(l.id) >= qtd;
      const l = db.lotes.find(x => x.unidade === a.unidade && pronto(x)) || db.lotes.find(x => x.unidade === 'u3' && pronto(x)); if (!l) return;
      saldo.set(l.id, saldo.get(l.id) - qtd);
      db.distribuicoes.push({ id: id('d'), data: d, lote: l.id, agricultor: a.id, qtd, cultura: a.culturas, area: Math.min(a.area, entre(1, 5) / 10), forma: um(['No solo', 'No solo', 'Foliar', 'Na cova ou sulco']) });
      const v = mais(d, entre(10, 24)); if (!ja(v)) return;
      const k = (ultimaVisita.get(a.id) || 0) + 1; ultimaVisita.set(a.id, k);
      const gasto = Math.round(a.gasto0 * Math.max(0.35, 1 - 0.12 * k - sorte() * 0.1));
      db.visitas.push({ id: id('v'), data: v, agricultor: a.id, tecnico: um(['Caio (fictício)', 'Bruna (fictícia)', 'Técnico do polo (fictício)']), usou: sorte() < 0.78 ? 'Sim' : sorte() < 0.7 ? 'Parcial' : 'Não',
        vigor: String(Math.min(5, 2 + Math.floor(k / 2) + entre(0, 1))), gasto,
        obs: um(['Plantas com melhor coloração depois da aplicação.', 'Solo mais solto e úmido nos canteiros.', 'Agricultora pediu mais biofertilizante para a próxima safra.', 'Menos ataque de pulgão observado.', 'Aplicação feita junto com a família; usou a dose orientada.']),
        problemas: sorte() < 0.2 ? um(['Falta de água para diluir.', 'Dúvida sobre a dose foliar.', 'Chuva logo depois da aplicação.']) : '' });
    });
    // o lote que esvaziou fica com saldo zero, igual à vida real
    db.agricultores.forEach(a => { delete a._mulher; });

    /* atividades: capacitações, dias de campo, reuniões e articulações */
    const ev = (tipo, data, tema, lugar, municipio, part, mulheres) => ({ id: id('e'), tipo, data, tema, lugar, municipio, part, mulheres, link: '', obs: '' });
    const novos = [
      ev('Capacitação', '2026-11-21', 'Bioinsumos: o que são, segurança e boas práticas', 'Sede da associação parceira', 'São Paulo do Potengi/RN', 26, 17),
      ev('Capacitação', '2026-12-12', 'Produção de biofertilizante e bokashi', 'Polo Mulungu', 'Mulungu/CE', 24, 15),
      ev('Capacitação', '2027-02-20', 'Microrganismos isolados: coleta, multiplicação e armazenamento', 'Polo São Paulo do Potengi', 'São Paulo do Potengi/RN', 22, 13),
      ev('Capacitação', '2027-03-20', 'Aplicação no campo: doses, épocas e equipamentos de proteção', 'Escola municipal', 'Baturité/CE', 28, 19),
      ev('Capacitação', '2027-04-17', 'Registro da produção e avaliação dos resultados', 'IFRN Campus Apodi', 'Apodi/RN', 20, 12),
      ev('Dia de campo', '2027-03-27', 'Hortaliças com bioinsumos: antes e depois', 'Sítio Lagoa Seca', 'Barcelona/RN', 34, 21),
      ev('Dia de campo', '2027-05-15', 'Café sombreado e bokashi', 'Comunidade Serrote', 'Guaramiranga/CE', 31, 18),
      ev('Dia de campo', '2027-06-12', 'Validação participativa dos resultados (RN)', 'Polo São Paulo do Potengi', 'São Paulo do Potengi/RN', 38, 24),
      ev('Dia de campo', '2027-07-10', 'Validação participativa dos resultados (CE)', 'Polo Mulungu', 'Mulungu/CE', 36, 22),
      ev('Articulação', '2026-10-20', 'Reunião com a prefeitura sobre o terreno do polo', 'Secretaria de Agricultura', 'São Paulo do Potengi/RN', 6, 2),
      ev('Articulação', '2027-05-28', 'Apresentação dos resultados parciais ao SEAB/MDA', 'Google Meet', '', 9, 4)];
    for (let d = '2026-10-06'; d <= '2027-07-31'; d = mais(d, 28)) novos.push(ev('Reunião', d, 'Reunião mensal da equipe', 'IFRN Campus Apodi', 'Apodi/RN', entre(5, 8), entre(2, 5)));
    // o que já passou entra; o que vem no próximo mês aparece como agendado
    const ate = mais(HOJE, 30);
    db.eventos = db.eventos.filter(e => e.data <= HOJE).concat(novos.filter(e => e.data <= ate).map(e => e.data > HOJE ? Object.assign(e, { part: '', mulheres: '' }) : e));
    db.eventos.sort((x, y) => x.data < y.data ? -1 : 1);

    /* listas de presença das capacitações e dias de campo já feitos (nomes das unidades produtivas e de outras pessoas, todos fictícios) */
    db.presencas = []; db.fotos = [];
    db.eventos.filter(e => ['Capacitação', 'Dia de campo'].includes(e.tipo) && e.data <= HOJE).forEach(e => {
      const uf = (e.municipio || '').split('/')[1], daqui = db.agricultores.filter(a => a.uf === uf && a.diag <= e.data);
      const lista = [], nomes = new Set();
      daqui.slice(0, Math.min(daqui.length, e.part - 4)).forEach(a => { nomes.add(a.nome); lista.push({ nome: a.nome, comunidade: a.comunidade, municipio: `${a.municipio}/${a.uf}`, agricultor: a.id }); });
      while (lista.length < e.part) { const m = sorte() < 0.62, nome = `${um(m ? mulheres : homens)} ${um(sobren)} (${m ? 'fictícia' : 'fictício'})`; if (nomes.has(nome)) continue; nomes.add(nome); lista.push({ nome, comunidade: um(lugares), municipio: e.municipio, mulher: m }); }
      lista.forEach(x => { const a = x.agricultor && db.agricultores.find(y => y.id === x.agricultor);
        db.presencas.push({ id: id('pr'), evento: e.id, nome: x.nome, comunidade: x.comunidade, municipio: x.municipio, mulher: x.mulher != null ? x.mulher : !!(a && mulheres.includes(a.nome.split(' ')[0])), agricultor: x.agricultor || null }); });
      e.mulheres = db.presencas.filter(p => p.evento === e.id && p.mulher).length;
    });

    /* entregas do plano (relatórios, materiais e comunicação) */
    const en = (etapa, data, titulo) => ({ id: id('g'), etapa, data, titulo, link: 'https://exemplo.br/documento-ficticio', obs: '' });
    const ents = [en('3.1', '2027-01-29', 'Cartilha “Bioinsumos na agricultura familiar” (fictícia)'), en('1.1', '2027-03-31', 'Relatório técnico do diagnóstico territorial e produtivo'),
      en('5.2', '2027-07-23', 'Relatório de avaliação e validação participativa'), en('6.2', '2027-07-28', 'Relatório final de execução do TED'),
      ...['2026-10-30', '2026-11-28', '2026-12-20', '2027-01-30', '2027-02-27', '2027-03-28', '2027-04-24', '2027-05-29', '2027-06-26', '2027-07-24'].map((d, i) => en('6.1', d, ['Vídeo curto da implantação do polo', 'Matéria no site do IFRN', 'Série de cards para redes sociais', 'Podcast com agricultoras', 'Folder dos polos', 'Vídeo da capacitação', 'Boletim da Rede BioAF', 'Exposição em feira regional', 'Vídeo do dia de campo', 'Catálogo de bioinsumos'][i] + ' (fictício)'))];
    db.entregas = db.entregas.filter(g => g.data <= HOJE).concat(ents.filter(g => ja(g.data)));

    /* despesas: o desembolso do plano, mês a mês; pago o que já passou, em compras o do mês passado, solicitado o do mês */
    const resta = Object.fromEntries(D.ETAPAS.map(e => [e.id, e.q * e.v]));
    const ETAPA = { i01: ['6.2', '1.1', '5.2'], i02: ['6.2', '1.1'], i03: ['4.1', '1.1'], i04: ['4.1', '1.1', '3.2'], i05: ['5.1'], i06: ['3.2', '1.1', '4.1'], i07: ['4.1', '1.1', '3.2'], i08: ['6.1', '3.1'],
      i09: ['3.1', '6.1', '5.2'], i10: ['2.1'], i11: ['4.1', '1.1'], i12: ['3.3'], i13: ['4.1', '2.1'], i14: ['2.1'], i15: ['6.3'], i16: ['3.2', '4.1'] };
    const favorecido = { servicos_pj: 'Empresa fornecedora (fictícia)', consumo: 'Comércio local (fictício)', equipamentos: 'Loja de equipamentos (fictícia)', passagens: 'Locadora / companhia (fictícia)', doa: 'FUNCERN' };
    db.despesas = []; let nf = 0;
    const meses = D.DESEMBOLSO.itens[0].m.length, [a0, m0] = D.DESEMBOLSO.inicio.split('-').map(Number);
    for (let k = 0; k < meses; k++) {
      const ym = `${a0 + Math.floor((m0 - 1 + k) / 12)}-${String((m0 - 1 + k) % 12 + 1).padStart(2, '0')}`, data = `${ym}-${String(entre(8, 24)).padStart(2, '0')}`;
      if (!ja(data)) continue;
      const fimMes = iso(R.fimMes(ym)), status = fimMes < mais(HOJE, -20) ? 'Pago' : fimMes < HOJE ? 'Em compras na FUNCERN' : 'Solicitado';
      D.DESEMBOLSO.itens.forEach(it => {
        const v0 = it.m[k]; if (!(v0 > 0)) return;
        // bolsa: uma solicitação por bolsista ativo no mês, no nome da pessoa (é assim que a aba Equipe liga a bolsa a quem recebe)
        const fn = { i01: 'coordenacao', i02: 'auxiliar', i03: 'discente', i16: 'formador' }[it.id];
        const quem = fn ? db.membros.filter(m => m.funcao === fn && m.inicio <= data && (!m.fim || m.fim >= data)) : [];
        const partes = quem.length ? quem.map((m, i) => [m.nome, i < quem.length - 1 ? Math.round(v0 / quem.length * 100) / 100 : Math.round((v0 - Math.round(v0 / quem.length * 100) / 100 * (quem.length - 1)) * 100) / 100]) : [[null, v0]];
        partes.forEach(([pessoa, v]) => {
        // cada despesa vai para uma etapa que ainda tem saldo no plano (se não couber inteira, divide em duas): nenhuma meta passa do previsto
        for (let falta = v; falta > 0.004;) {
          const etapa = ETAPA[it.id].find(e => resta[e] >= falta) || ETAPA[it.id].find(e => resta[e] > 0.004) || Object.keys(resta).find(e => resta[e] > 0.004) || ETAPA[it.id][0];
          const parte = Math.round(Math.min(falta, Math.max(resta[etapa], 0) || falta) * 100) / 100; resta[etapa] -= parte; falta = Math.round((falta - parte) * 100) / 100;
          db.despesas.push({ id: id('x'), data, etapa, rubrica: it.rubrica, item: it.id, descricao: `${it.nome} — ${ym.split('-').reverse().join('/')}`, favorecido: pessoa || (/bolsa/.test(it.rubrica) ? 'Bolsistas do projeto' : it.rubrica === 'diarias' || it.rubrica === 'ajuda_custo' ? 'Equipe do projeto' : favorecido[it.rubrica] || 'Fornecedor (fictício)'),
            doc: status === 'Pago' ? `NF ${String(++nf).padStart(4, '0')} (fictícia)` : '', valor: parte, status });
        }
        });
      });
    }

    /* carimbos: cada registro "criado" na própria data (o histórico e as listas ficam na ordem certa) */
    D.TABELAS.forEach(t => (db[t] || []).forEach(r => { const d = r.data || r.inicio || r.diag || '2026-08-01'; r.criado_em = r.criado_em || `${d}T12:00:00.000Z`; r.atualizado_em = r.atualizado_em || r.criado_em; delete r.ex; }));
    return db;
  };
})();
