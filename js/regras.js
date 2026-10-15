/* Saberes que Cultivam — regras de negócio (contas e conferências), sem tela e sem servidor.
   Tudo aqui recebe o conjunto de dados (db) por parâmetro: por isso roda igual no navegador e nos testes (node).
   As mesmas travas que importam para a integridade (saldo do lote, lote pronto, mulheres <= participantes)
   existem também no banco (supabase/01_criar_banco.sql): a tela avisa antes, o banco garante. */
(function () {
  const G = typeof window !== 'undefined' ? window : globalThis;
  const SQC = (G.SQC = G.SQC || {});
  const D = SQC.dados;

  /* ---------- datas (sempre texto AAAA-MM-DD; nada de fuso) ---------- */
  const pd = s => { const [a, b, c] = String(s).split('-').map(Number); return new Date(a, b - 1, c || 1); };
  const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const dias = (a, b) => Math.round((b - a) / 864e5);
  const fimMes = s => { const d = pd(s); return new Date(d.getFullYear(), d.getMonth() + 1, 0); };
  const n = v => +v || 0;
  const vazio = v => v === '' || v == null;

  /* ---------- lotes ---------- */
  const distribuido = (db, loteId, menosId) => db.distribuicoes.filter(d => d.lote === loteId && d.id !== menosId).reduce((s, d) => s + n(d.qtd), 0);
  const saldo = (db, l) => n(l.qtd) - distribuido(db, l.id);
  const pronto = l => { const d = pd(l.inicio); d.setDate(d.getDate() + n(l.dias)); return d; };
  function codigoLote(db, r) {
    const t = D.TIPOS[r.tipo] || D.TIPOS.Outro; const u = db.unidades.find(x => x.id === r.unidade) || {};
    const pre = `${u.sigla || 'UN'}-${t[0]}-`.toUpperCase();
    // maior número já usado nesse prefixo + 1 (contar registros repetiria o código depois de uma exclusão)
    const maior = db.lotes.filter(l => l.id !== r.id && String(l.codigo || '').startsWith(pre)).reduce((m, l) => Math.max(m, parseInt(String(l.codigo).slice(pre.length), 10) || 0), 0);
    return pre + String(maior + 1).padStart(3, '0');
  }

  /* ---------- unidades de produção e unidades produtivas ---------- */
  const nCheck = u => D.CHECK.filter(c => u[c[0]]).length;
  const proximoPasso = u => (D.CHECK.find(c => !u[c[0]]) || [0, 'concluída'])[1];
  /* agrupado uma vez por lista (antes filtrava a lista inteira para cada agricultor: lento com volume). A lista nova invalida sozinha. */
  let porAgr = new WeakMap();
  const novoDesenho = () => { porAgr = new WeakMap(); };   // a tela chama no começo de cada desenho: a lista pode ter mudado no lugar
  const grupo = (lista, ordenar) => { let c = porAgr.get(lista); if (c && c.n === lista.length && c.u === lista[lista.length - 1]) return c.m; const m = new Map();
    lista.forEach(x => { const k = x.agricultor; if (!m.has(k)) m.set(k, []); m.get(k).push(x); });
    if (ordenar) m.forEach(l => l.sort((a, b) => a.data < b.data ? 1 : -1)); porAgr.set(lista, { m, n: lista.length, u: lista[lista.length - 1] }); return m; };
  const visitasDe = (db, id) => (grupo(db.visitas, true).get(id) || []).slice();
  const recebeu = (db, id) => (grupo(db.distribuicoes, false).get(id) || []).slice();
  /* até que dia conta (AAAA-MM-DD). Sem data final, conta até hoje: atividade marcada para o futuro é planejada, não realizada. */
  const ateDia = ate => ate || iso(new Date());
  const ateh = (d, ate) => String(d || '') <= ate;   // registro antigo sem data continua contando
  /* "acompanhada" (Meta 4): recebeu bioinsumo e teve visita de monitoramento NO DIA da primeira entrega ou depois
     (mesma conta do aviso "recebeu bioinsumo e não teve visita depois"); visita antes da entrega não acompanha uso. */
  const acompanhada = (db, a, ate) => { ate = ateDia(ate);
    const r = recebeu(db, a.id).filter(x => ateh(x.data, ate)).map(x => String(x.data || '')).sort()[0];
    return r !== undefined && visitasDe(db, a.id).some(v => ateh(v.data, ate) && String(v.data || '') >= r); };

  /* ---------- execução física: quanto de cada etapa já foi feito ---------- */
  /* ate (opcional, AAAA-MM-DD): conta só o que tem data até esse dia. Sem ele, até hoje. */
  /* biofábrica em funcionamento (Meta 2): conta para a meta e tem os 8 passos da implantação marcados (decisão da coordenação, 15/10/2026) */
  /* ate (opcional): só conta se começou a funcionar até esse dia (data do 26). Cadastro antigo sem data conta como hoje e vira aviso. */
  const unidadePronta = (u, ate) => u.conta === 'Sim' && nCheck(u) === D.CHECK.length && (!u.funcionando_em || String(u.funcionando_em) <= ateDia(ate));
  /* atividade realizada (Metas 3 e 5): a data chegou E há participantes informados ou lista de presença. Data passada sem ninguém
     registrado não conta: pode não ter acontecido (decisão da coordenação, 15/10/2026) */
  const realizada = (db, x) => n(x.part) > 0 || (db.presencas || []).some(p => p.evento === x.id);
  function feito(db, e, ate) {
    ate = ateDia(ate);
    switch (e.id) {
      case '2.1': return db.unidades.filter(u => unidadePronta(u, ate)).length;
      case '3.2': return db.eventos.filter(x => x.tipo === 'Capacitação' && ateh(x.data, ate) && realizada(db, x)).length;
      case '3.3': return db.agricultores.filter(a => a.kit && ateh(a.kitdata, ate)).length;
      case '4.1': return db.agricultores.filter(a => acompanhada(db, a, ate)).length;
      case '5.1': return db.eventos.filter(x => x.tipo === 'Dia de campo' && ateh(x.data, ate) && realizada(db, x)).length;
      default: return db.entregas.filter(g => g.etapa === e.id && ateh(g.data, ate)).length;
    }
  }

  /* ---------- execução física do projeto (número grande do painel) ----------
     Cada etapa pesa o valor que o plano de trabalho destina a ela (quantidade x valor unitário); não é média simples.
     "Previsto" = quanto da etapa já deveria estar feito até o fim do mês passado, distribuído por igual na janela da etapa. */
  const mesesEntre = (a, b) => (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth();
  /* fonte 'equipe': usa a janela do cronograma da equipe (e.eq) quando a etapa está nele; senão, a do plano de trabalho (TED) */
  function previstoEtapa(e, hoje, fonte) {
    const j = fonte === 'equipe' && e.eq ? e.eq : e, ini = pd(j.ini), total = mesesEntre(ini, pd(j.fim)) + 1;
    return Math.max(0, Math.min(1, mesesEntre(ini, new Date(hoje.getFullYear(), hoje.getMonth(), 1)) / total));
  }
  function execucaoGeral(db, hoje) {
    hoje = hoje || new Date();
    const linhas = D.ETAPAS.map(e => ({ e, valor: e.q * e.v, feito: Math.min(1, feito(db, e, iso(hoje)) / e.q), prev: previstoEtapa(e, hoje), prevEq: previstoEtapa(e, hoje, 'equipe') }));
    const tot = linhas.reduce((s, x) => s + x.valor, 0);
    const real = linhas.reduce((s, x) => s + x.valor * x.feito, 0) / tot * 100, prev = linhas.reduce((s, x) => s + x.valor * x.prev, 0) / tot * 100;
    const prevEq = linhas.reduce((s, x) => s + x.valor * x.prevEq, 0) / tot * 100;
    const situacao = p => real >= 99.5 ? 'concluida' : real >= p ? 'andamento' : real >= p * 0.7 ? 'atencao' : 'atrasada';
    const st = situacao(prev), stEq = situacao(prevEq);
    const porMeta = [1, 2, 3, 4, 5, 6].map(m => { const l = linhas.filter(x => x.e.m === m), v = l.reduce((s, x) => s + x.valor, 0); return { m, valor: v, feito: l.reduce((s, x) => s + x.valor * x.feito, 0) / v * 100, prev: l.reduce((s, x) => s + x.valor * x.prev, 0) / v * 100, prevEq: l.reduce((s, x) => s + x.valor * x.prevEq, 0) / v * 100, temEq: l.some(x => x.e.eq) }; });
    const meses = mesesEntre(pd(D.G0), pd(D.G1)), mes = Math.max(1, Math.min(meses, mesesEntre(pd(D.G0), hoje) + 1));
    const ant = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    return { real, prev, st, prevEq, stEq, porMeta, mes, meses, ate: String(ant.getMonth() + 1).padStart(2, '0') + '/' + ant.getFullYear() };
  }

  /* ---------- financeiro ---------- */
  const cent = x => Math.round(x * 100) / 100;
  const recebido = () => D.PARCELAS.filter(p => p.recebida).reduce((s, p) => s + p.valor, 0);
  const previstoMeta = m => D.ETAPAS.filter(e => e.m === m).reduce((s, e) => s + e.q * e.v, 0);
  const somaDesp = (ds, pago) => ds.filter(d => (d.status === 'Pago') === pago).reduce((s, d) => s + n(d.valor), 0);
  const ate = (db, lim) => db.despesas.filter(d => !lim || d.data <= lim);
  /* por meta do TED: previsto, comprometido (solicitado ou em compras), pago, saldo */
  function fin(db, lim) {
    return [1, 2, 3, 4, 5, 6].map(m => {
      const prev = previstoMeta(m); const ds = ate(db, lim).filter(d => String(d.etapa)[0] === String(m));
      const pago = somaDesp(ds, true), comp = somaDesp(ds, false);
      return { m, nome: D.METAS[m], prev, comp: cent(comp), pago: cent(pago), saldo: cent(prev - comp - pago) };   // centavos: somas de valores quebrados (2.181,82 × 11) davam “R$ 0,00 acima”
    });
  }
  /* ---------- importação da planilha de solicitações da FUNCERN ----------
     A planilha é a fonte das despesas: cada solicitação vira (ou atualiza) uma despesa, reconhecida pelo número da solicitação
     guardado em "doc". O CPF do beneficiário é descartado na leitura e nunca é guardado. */
  const nrm = s => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  const limpo = s => { const t = String(s == null ? '' : s).trim(); return t === '-' ? '' : t; };
  const DOC_SOL = 'Solicitação FUNCERN ';
  const numSol = d => { const m = /^Solicitação FUNCERN (\S+)$/.exec(String((d && d.doc) || '')); return m ? m[1] : ''; };
  function valorPlanilha(x) {
    if (typeof x === 'number') return x; let t = String(x == null ? '' : x).replace(/[R$\s]/g, '');
    if (/,\d{1,2}$/.test(t)) t = t.replace(/\./g, '').replace(',', '.');
    else if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');   // "1.500" é mil e quinhentos, não 1,5
    const n = Number(t); return isFinite(n) ? Math.round(n * 100) / 100 : NaN;
  }
  /* data que não existe (31/02, mês 22) volta vazia: a linha é apontada como erro em vez de parar a gravação no meio */
  const dataExiste = (a, m, d) => { const x = new Date(Date.UTC(+a, +m - 1, +d)); return x.getUTCFullYear() === +a && x.getUTCMonth() === +m - 1 && x.getUTCDate() === +d; };
  function dataPlanilha(x) {
    const t = String(x == null ? '' : x).trim(); let m;
    if ((m = /^(\d{4})-(\d{2})-(\d{2})/.exec(t))) return dataExiste(m[1], m[2], m[3]) ? `${m[1]}-${m[2]}-${m[3]}` : '';
    if ((m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(t))) return dataExiste(m[3], m[2], m[1]) ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : '';
    if (/^\d+(\.\d+)?$/.test(t) && +t > 20000 && +t < 80000) return new Date(Date.UTC(1899, 11, 30) + Math.floor(+t) * 864e5).toISOString().slice(0, 10);   // número de série do Excel
    return '';
  }
  /* das abas lidas (SQC.planilha.ler) para solicitações; a linha de títulos é a que tem "ID Solicitação" */
  function lerSolicitacoes(abas) {
    const sols = [], erros = [];
    (abas || []).forEach(aba => {
      const ic = aba.linhas.findIndex(l => l.some(c => nrm(c) === 'id solicitacao')); if (ic < 0) return;
      const col = {}; aba.linhas[ic].forEach((c, i) => { col[nrm(c)] = i; });
      const g = (l, nome) => col[nome] === undefined ? '' : limpo(l[col[nome]]);
      aba.linhas.slice(ic + 1).forEach((l, k) => {
        const sol = g(l, 'id solicitacao'); if (!sol) return;
        const valor = valorPlanilha(g(l, 'valor')), data = dataPlanilha(g(l, 'data solicitacao'));
        if (!(valor > 0) || !data) { erros.push(`Aba “${aba.nome}”, linha ${ic + k + 2} (solicitação ${sol}): ${!(valor > 0) ? 'valor' : 'data'} não reconhecido.`); return; }
        sols.push({ sol, aba: aba.nome, tipo: g(l, 'tipo solicitacao'), beneficiario: g(l, 'beneficiario nome'), valor, rubricaTxt: g(l, 'rubrica financeira'), sub: g(l, 'subrubrica financeira'), detalhe: g(l, 'detalhe rubrica'), statusTxt: g(l, 'status') || '(sem status)', data });
      });
    });
    return { sols, erros };
  }
  function rubricaDaFuncern(rub, detalhe, tipo) {
    const r = nrm(rub), d = nrm(detalhe), t = nrm(tipo);
    if (/\bdoa\b/.test(d) || /\bdoa\b/.test(t)) return 'doa';
    return /pesquisador/.test(r) ? 'bolsa_pesquisador' : /estudante|discente|aluno/.test(r) ? 'bolsa_estudante' : /diaria/.test(r) ? 'diarias' : /ajuda de custo/.test(r) ? 'ajuda_custo'
      : /passage|locomocao/.test(r) ? 'passagens' : /pessoa juridica/.test(r) ? 'servicos_pj' : /consumo/.test(r) ? 'consumo' : /equipamento|permanente/.test(r) ? 'equipamentos' : '';
  }
  function itemDaFuncern(rubrica, detalhe) {
    const its = D.DESEMBOLSO.itens.filter(i => i.rubrica === rubrica), d = nrm(detalhe); if (its.length === 1) return its[0].id; if (!d) return '';
    const x = its.filter(i => nrm(i.nome).includes(d) || d.includes(nrm(i.nome).replace(/^bolsa - /, ''))); return x.length === 1 ? x[0].id : '';
  }
  /* como cada status da fundação entra na conta, quando a coordenação ainda não escolheu */
  function destinoStatus(txt) {
    const s = nrm(txt);
    if (/\b(nao|sem|aguardando|pendente|a) (pago|paga|pagamento|pagar)\b|devolv/.test(s)) return 'Comprometido';   // "Não pago", "Devolvida para correção": ainda vale como comprometido
    return /cancel|recus|reprov|indefer|estorn/.test(s) ? 'Ignorar' : /\bpago\b|\bpaga\b|finaliz|conclu|liquid|quitad/.test(s) ? 'Pago' : 'Comprometido';
  }
  /* escolhas = { status: { texto: 'Pago' | 'Comprometido' | 'Ignorar' }, etapa: { grupo: id }, rubrica: { grupo: id } }
     Devolve o que seria feito, sem gravar nada: a tela mostra, a coordenação confirma. */
  function planoImportacao(db, sols, escolhas) {
    escolhas = escolhas || {}; const es = escolhas.status || {}, ee = escolhas.etapa || {}, er = escolhas.rubrica || {};
    const porSol = {}; db.despesas.forEach(d => { const n = numSol(d); if (n) porSol[n] = d; });
    const grupos = {}, status = {}, linhas = [], vistos = new Set();
    sols.forEach(s => {
      if (vistos.has(s.sol)) return; vistos.add(s.sol);
      const dest = es[s.statusTxt] || destinoStatus(s.statusTxt), ant = porSol[s.sol] || null;
      const st = status[s.statusTxt] = status[s.statusTxt] || { txt: s.statusTxt, n: 0, total: 0, destino: dest }; st.n++; st.total += s.valor;
      if (dest === 'Ignorar') { linhas.push({ s, ant, acao: ant ? 'remove' : 'ignora' }); return; }
      const chave = nrm(s.rubricaTxt) + ' | ' + nrm(s.detalhe), auto = rubricaDaFuncern(s.rubricaTxt, s.detalhe, s.tipo);
      const g0 = grupos[chave];   // linha nova num grupo que já tem rubrica/etapa escolhida (em importação anterior) herda a do grupo
      const rubrica = er[chave] || (ant && ant.rubrica) || auto || (g0 && g0.rubrica) || '';
      const igual = db.despesas.filter(d => numSol(d) && d.rubrica === rubrica && nrm(d.descricao).endsWith('· ' + nrm(s.detalhe))).sort((a, b) => a.data < b.data ? 1 : -1)[0];
      const etapa = ee[chave] || (ant && ant.etapa) || (igual && igual.etapa) || (rubrica === 'doa' ? '6.3' : '') || (g0 && g0.rubrica === rubrica && g0.etapa) || '';
      const g = grupos[chave] = grupos[chave] || { chave, rubricaTxt: s.rubricaTxt, detalhe: s.detalhe, rubricaAuto: auto, rubrica, etapa, n: 0, total: 0 }; g.n++; g.total += s.valor;
      const item = ant && ant.item && D.DESEMBOLSO.itens.some(i => i.id === ant.item && i.rubrica === rubrica) ? ant.item : itemDaFuncern(rubrica, s.detalhe);
      const reg = { id: ant ? ant.id : null, data: s.data, etapa, rubrica, item: item || '', descricao: [String(s.tipo).replace(/^Solicitação de /i, ''), s.detalhe].filter((x, i, a) => x && a.indexOf(x) === i).join(' · ') || 'Solicitação',
        favorecido: s.beneficiario, doc: DOC_SOL + s.sol, valor: s.valor, status: dest === 'Pago' ? 'Pago' : 'Solicitado' };
      const mudou = !ant || ['data', 'etapa', 'rubrica', 'descricao', 'favorecido', 'status'].some(k => String(ant[k] || '') !== String(reg[k] || '')) || Number(ant.valor) !== reg.valor || String(ant.item || '') !== reg.item;
      linhas.push({ s, ant, reg, grupo: chave, acao: !ant ? 'nova' : mudou ? 'atualiza' : 'igual' });
    });
    const G = Object.values(grupos), conta = a => linhas.filter(l => l.acao === a).length, vale = linhas.filter(l => l.reg);
    return { linhas, grupos: G, status: Object.values(status), faltam: G.filter(g => !g.rubrica || !g.etapa).length + vale.filter(l => (!l.reg.rubrica || !l.reg.etapa) && !G.some(g => g.chave === l.grupo && (!g.rubrica || !g.etapa))).length,
      novas: conta('nova'), atualizadas: conta('atualiza'), iguais: conta('igual'), removidas: conta('remove'), ignoradas: conta('ignora'),
      pago: vale.filter(l => l.reg.status === 'Pago').reduce((t, l) => t + l.reg.valor, 0), comprometido: vale.filter(l => l.reg.status !== 'Pago').reduce((t, l) => t + l.reg.valor, 0),
      foraDaPlanilha: db.despesas.filter(d => numSol(d) && !vistos.has(numSol(d))).length, manuais: db.despesas.filter(d => !numSol(d)).length };
  }
  /* por item do plano (dentro da rubrica): previsto, pago, comprometido e saldo. Só entra a despesa que indica o item;
     "composicao" descreve como o previsto se distribui (meses e valor por mês, quando é sempre o mesmo). */
  function finItens(db, lim) {
    const ds = ate(db, lim);
    return D.DESEMBOLSO.itens.map(i => {
      const x = ds.filter(d => d.item === i.id && d.rubrica === i.rubrica), pago = somaDesp(x, true), comp = somaDesp(x, false);
      const prev = Math.round(i.m.reduce((a, b) => a + b, 0) * 100) / 100, ms = i.m.map((v, k) => v ? k : -1).filter(k => k >= 0), vs = ms.map(k => i.m[k]);
      const igual = vs.every(v => Math.abs(v - vs[0]) < 0.05);
      return { id: i.id, rubrica: i.rubrica, nome: i.nome, prev, pago, comp, saldo: prev - pago - comp, meses: ms, mensal: igual && vs.length > 1 ? vs[0] : null, despesas: x };
    });
  }
  /* por rubrica do plano universal (FUNCERN); despesa sem rubrica aparece numa linha própria, para ser corrigida */
  function finRubrica(db, lim) {
    const ds = ate(db, lim);
    const linhas = D.RUBRICAS.map(r => {
      const x = ds.filter(d => d.rubrica === r.id); const pago = somaDesp(x, true), comp = somaDesp(x, false);
      return { id: r.id, nome: r.nome, prev: r.v, comp: cent(comp), pago: cent(pago), saldo: cent(r.v - comp - pago) };
    });
    const sem = ds.filter(d => !D.RUBRICAS.some(r => r.id === d.rubrica));
    if (sem.length) { const pago = somaDesp(sem, true), comp = somaDesp(sem, false); linhas.push({ id: '', nome: 'Sem rubrica (corrija o lançamento)', prev: 0, comp, pago, saldo: -comp - pago, semRubrica: true }); }
    return linhas;
  }
  const soma = (F, k) => F.reduce((s, r) => s + r[k], 0);

  /* ---------- ritmo do gasto: acumulado mês a mês (previsto do plano de desembolso x pago x recebido) ---------- */
  const mesDe = (i) => { const d = pd(D.DESEMBOLSO.inicio); return new Date(d.getFullYear(), d.getMonth() + i, 1); };   // i = 0 é ago/2026
  const chaveMes = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  const desembolsoMensal = () => D.DESEMBOLSO.itens[0].m.map((_, i) => Math.round(D.DESEMBOLSO.itens.reduce((s, it) => s + it.m[i], 0) * 100) / 100);
  function ritmo(db, hoje) {
    hoje = hoje || new Date(); const mensal = desembolsoMensal(), n = mensal.length, hj = iso(hoje);
    const noMes = (lista, campo, k) => lista.filter(x => String(x[campo] || '').slice(0, 7) === k).reduce((s, x) => s + (+x.valor || 0), 0);
    const pagos = db.despesas.filter(d => d.status === 'Pago' && d.data <= hj), recebidas = D.PARCELAS.filter(p => p.recebida && p.data <= hj);
    // parcela ou despesa com data anterior ao primeiro mês do plano entra no primeiro mês (não some do acumulado)
    const k0 = chaveMes(mesDe(0)); const antes = (lista) => lista.filter(x => String(x.data).slice(0, 7) < k0).reduce((s, x) => s + (+x.valor || 0), 0);
    let ap = 0, ae = antes(pagos), ar = antes(recebidas); const pontos = [];
    for (let i = 0; i < n; i++) {
      const d = mesDe(i), k = chaveMes(d), passou = k <= hj.slice(0, 7);
      ap += mensal[i]; if (passou) { ae += noMes(pagos, 'data', k); ar += noMes(recebidas, 'data', k); }
      // o que for pago ou recebido depois do último mês do plano entra no último ponto (não some do acumulado)
      if (i === n - 1 && passou) { const depois = l => l.filter(x => String(x.data).slice(0, 7) > k).reduce((s, x) => s + (+x.valor || 0), 0); ae += depois(pagos); ar += depois(recebidas); }
      pontos.push({ mes: k, rotulo: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '') + '/' + String(d.getFullYear()).slice(2), previsto: Math.round(ap * 100) / 100, executado: passou ? ae : null, recebido: passou ? ar : null, atual: k === hj.slice(0, 7) });
    }
    return { pontos, total: Math.round(ap * 100) / 100, tempo: tempoDecorrido(hoje) };
  }
  /* quanto da vigência já passou (0 a 1) */
  function tempoDecorrido(hoje) { const a = pd(D.VIGENCIA.ini), b = pd(D.VIGENCIA.fim); return Math.max(0, Math.min(1, ((hoje || new Date()) - a) / (b - a))); }

  /* ---------- o que precisa de atenção (painel) ---------- */
  const FMT_BRL = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });   // criado uma vez: toLocaleString a cada chamada era ~50 vezes mais lento (auditoria 14/10)
  const brl = v => 'R$ ' + FMT_BRL.format(n(v));
  // só dígitos e traço passam: a data vai direto para o HTML, então nada que não seja data chega à tela
  const dt = s => s ? String(s).slice(0, 10).replace(/[^0-9-]/g, '').split('-').reverse().join('/') : '—';
  const venceu = (e, hoje) => iso(fimMes(e.fim)) < iso(hoje || new Date());   // a etapa só vence depois do último dia do mês final
  /* cada aviso: [nível ('bad' urgente, 'f' atenção), assunto, texto completo, título, detalhe, prazo (AAAA-MM-DD ou ''), aba onde se resolve] */
  function alertas(db, hoje) {
    hoje = hoje || new Date(); const A = [];
    const add = (nivel, cat, titulo, detalhe, prazo, aba) => A.push([nivel, cat, titulo + (detalhe ? ' ' + detalhe : ''), titulo, detalhe || '', prazo || '', aba || '']);
    const F = fin(db), usado = soma(F, 'pago') + soma(F, 'comp'), rec = recebido();
    const prox = D.PARCELAS.find(p => !p.recebida);
    if (usado > rec) add('bad', 'Financeiro', `Pago e comprometido somam ${brl(usado)}, acima do que já foi recebido (${brl(rec)}).`, prox ? 'A próxima parcela está prevista para ' + prox.previsao.split('-').reverse().join('/') + '.' : '', '', 'financeiro');
    F.filter(r => r.saldo < 0).forEach(r => add('bad', 'Financeiro', `Meta ${r.m} está ${brl(-r.saldo)} acima do valor previsto no plano.`, 'Confira os lançamentos dessa meta.', '', 'financeiro'));
    finRubrica(db).forEach(r => {
      if (r.semRubrica) add('f', 'Financeiro', `Há despesa lançada sem rubrica (${brl(r.comp + r.pago)}).`, 'Sem rubrica ela não entra na conferência com a FUNCERN.', '', 'financeiro');
      else if (r.saldo < 0) add('bad', 'Rubrica', `${r.nome}: ${brl(-r.saldo)} acima do previsto no plano.`, 'Remanejar exige ajuste do plano de trabalho.', '', 'financeiro');
      else if (r.prev && (r.comp + r.pago) / r.prev >= 0.9) add('f', 'Rubrica', `${r.nome}: ${Math.round((r.comp + r.pago) / r.prev * 100)}% do previsto já pago ou comprometido.`, 'O que ainda falta comprar nessa rubrica cabe no saldo?', '', 'financeiro');
    });
    const e21 = D.ETAPAS.find(e => e.id === '2.1'); const lim = new Date(fimMes(e21.fim).getTime() - 60 * 864e5);
    db.unidades.filter(u => u.conta === 'Sim').forEach(u => {
      if (!u.orcamento) add(dias(hoje, lim) < 30 ? 'bad' : 'f', 'Compras', `${u.nome}: envie os orçamentos à FUNCERN até ${dt(iso(lim))}.`, `A etapa 2.1 termina em ${e21.fim.split('-').reverse().join('/')} e uma compra pela fundação leva cerca de dois meses.`, iso(lim), 'unidades');
      if (!u.parceiro_ok) add('f', 'Patrimônio', `${u.nome}: defina o parceiro institucional que receberá os bens.`, 'Não é possível doar a pessoa física.', '', 'unidades');
    });
    const semBase = db.agricultores.filter(a => !a.diag);
    if (semBase.length) add('bad', 'Linha de base', `${semBase.length} unidade(s) produtiva(s) sem diagnóstico inicial.`, 'Sem ele, a avaliação da Meta 5 não tem com o que comparar.', '', 'agricultores');
    db.agricultores.forEach(a => {
      const r = recebeu(db, a.id).sort((x, y) => x.data < y.data ? 1 : -1)[0]; if (!r) return; const v = visitasDe(db, a.id)[0];
      if ((!v || v.data < r.data) && dias(pd(r.data), hoje) > 30) add('f', 'Monitoramento', `${a.nome}: recebeu bioinsumo em ${dt(r.data)} e não teve visita depois.`, 'Registre a visita de monitoramento.', '', 'visitas');
    });
    const hj = iso(hoje);   // datas comparadas como texto AAAA-MM-DD: o dia previsto e o último dia do mês ainda não são atraso
    db.lotes.forEach(l => { if (['Em preparo', 'Maturando'].includes(l.status) && iso(pronto(l)) < hj) add('f', 'Lote', `${l.codigo || 'Lote sem código'}: passou da previsão (${dt(iso(pronto(l)))}).`, 'Confira e marque como pronto.', '', 'lotes'); });
    db.unidades.forEach(u => { if (u.funcionando && !u.funcionando_em) add('f', 'Meta 2', `${u.nome}: falta a data em que começou a funcionar.`, 'Edite a unidade e informe a data: sem ela, o relatório de um período passado conta a unidade como se já funcionasse.', '', 'unidades'); });
    db.eventos.forEach(x => { if (['Capacitação', 'Dia de campo'].includes(x.tipo) && String(x.data || '') < hj && !realizada(db, x))
      add('f', 'Atividade', `${x.tipo} “${x.tema || 'sem tema'}” (${dt(x.data)}) está sem participantes registrados.`, 'Informe quantas pessoas participaram ou exclua, se não aconteceu. Sem isso, não conta para a meta.', '', 'eventos'); });
    D.ETAPAS.forEach(e => { if (venceu(e, hoje) && feito(db, e, hj) < e.q) add('bad', 'Prazo', `Etapa ${e.id} venceu em ${e.fim.split('-').reverse().join('/')} com ${feito(db, e, hj)} de ${e.q}.`, e.nome + '.', iso(fimMes(e.fim)), D.ETAPAS_AUTOMATICAS.includes(e.id) ? '' : 'painel'); });
    // urgente primeiro; dentro do mesmo nível, o que tem prazo mais próximo
    return A.sort((a, b) => (a[0] === 'bad' ? 0 : 1) - (b[0] === 'bad' ? 0 : 1) || (a[5] || '9') .localeCompare(b[5] || '9'));
  }

  /* ---------- indicadores da Meta 5 ---------- */
  function indicadores(db, ate) {
    ate = ateDia(ate); const vs = db.visitas.filter(v => ateh(v.data, ate));
    // só entra quem tem as duas pontas: linha de base com gasto informado E visita com gasto (campo vazio não é zero)
    const comp = db.agricultores.map(a => { const v = visitasDe(db, a.id).find(x => !vazio(x.gasto) && ateh(x.data, ate)); return a.diag && !vazio(a.gasto0) && v ? [n(a.gasto0), n(v.gasto)] : null; }).filter(Boolean);
    const m0 = comp.reduce((s, c) => s + c[0], 0) / (comp.length || 1), m1 = comp.reduce((s, c) => s + c[1], 0) / (comp.length || 1);
    const ev = db.eventos.filter(e => ['Capacitação', 'Dia de campo'].includes(e.tipo) && ateh(e.data, ate) && realizada(db, e));   // atividade planejada não soma participantes
    return { pares: comp.length, base: m0, atual: m1, variacao: comp.length && m0 ? (m1 - m0) / m0 * 100 : null,
      visitas: vs.length, usou: vs.filter(v => v.usou === 'Sim').length,
      participantes: ev.reduce((s, e) => s + n(e.part), 0), mulheres: ev.reduce((s, e) => s + n(e.mulheres), 0) };
  }

  /* ---------- conferências antes de gravar: devolve '' ou a mensagem para a tela ---------- */
  function validar(db, tabela, r, anterior) {
    if (tabela === 'unidades') {
      if (!/^[A-Za-z]{2,4}$/.test(String(r.sigla || ''))) return 'A sigla precisa ter de 2 a 4 letras, sem número nem espaço.';
      if (db.unidades.some(u => u.id !== r.id && String(u.sigla).toUpperCase() === String(r.sigla).toUpperCase())) return 'Já existe uma unidade com essa sigla.';
      const falta = D.CHECK.filter(c => c[0] !== 'funcionando' && !r[c[0]]).map(c => c[1]);
      // vale ao marcar (ou ao desmarcar um passo de quem já estava marcada); cadastro antigo já marcado continua editável
      if (!r.funcionando) r.funcionando_em = null;   // desmarcou: a data sai junto (o banco faz o mesmo, script 26)
      if (r.funcionando && falta.length && (!anterior || !anterior.funcionando || D.CHECK.some(c => anterior[c[0]] && !r[c[0]]))) return `Só marque “Em funcionamento” depois dos outros passos. Falta: ${falta.join('; ')}.`;
      if (r.funcionando && !r.funcionando_em && (!anterior || !anterior.funcionando || anterior.funcionando_em)) return 'Informe a data em que a unidade começou a funcionar.';
      if (r.funcionando_em && String(r.funcionando_em) > iso(new Date())) return 'A data em que a unidade começou a funcionar não pode ser no futuro.';
    }
    const inteiro = v => vazio(v) || Number.isInteger(+v);
    if (tabela === 'lotes') {
      if (!(n(r.qtd) > 0)) return 'Informe a quantidade produzida.';
      if (!inteiro(r.dias) || n(r.dias) > 730) return 'Os dias até ficar pronto precisam ser um número inteiro, de 0 a 730.';
      if (n(r.qtd) > 1000000) return 'Confira a quantidade: o valor está alto demais.';
      if (anterior && (anterior.unidade !== r.unidade || anterior.tipo !== r.tipo)) return 'Lote não muda de unidade nem de tipo depois de criado, porque o código depende deles. Crie outro lote.';
      if (anterior && distribuido(db, r.id) > 0 && (anterior.med !== r.med || anterior.inicio !== r.inicio)) return 'Este lote já teve distribuição: a medida e a data de início não mudam mais.';
      const ja = distribuido(db, r.id); if (n(r.qtd) < ja) return `A quantidade ficou menor do que o já distribuído (${ja}).`;
      if (anterior && anterior.status === 'Pronto' && r.status !== 'Pronto' && ja > 0) return 'Este lote já teve distribuição: não pode deixar de estar pronto.';
    }
    if (tabela === 'distribuicoes') {
      const l = db.lotes.find(x => x.id === r.lote); if (!l) return 'Escolha o lote.';
      if (!(n(r.qtd) > 0)) return 'Informe a quantidade entregue.';
      if (l.status !== 'Pronto') return `O lote ${l.codigo || ''} ainda não está marcado como pronto.`;
      const disp = n(l.qtd) - distribuido(db, l.id, r.id);
      if (n(r.qtd) > disp) return `O lote ${l.codigo || ''} só tem ${disp} ${l.med} de saldo.`;
      if (r.data < l.inicio) return 'A data da entrega é anterior ao início do preparo do lote.';
      { const lim = new Date(); lim.setDate(lim.getDate() + 1); if (r.data > iso(lim)) return 'A data da entrega está no futuro. Confira o ano.'; }
    }
    if (tabela === 'visitas' && r.data) { const lim = new Date(); lim.setDate(lim.getDate() + 1); if (r.data > iso(lim)) return 'A data da visita está no futuro. Registre a visita depois de feita.'; }
    if (tabela === 'presencas') {
      if (!(db.eventos || []).some(e => e.id === r.evento)) return 'Escolha a atividade.';
      if (String(r.nome || '').trim().length < 3) return 'Informe o nome de quem participou.';
    }
    if (tabela === 'eventos') {
      if (!inteiro(r.part) || !inteiro(r.mulheres)) return 'Participantes e mulheres precisam ser números inteiros.';
      if (!vazio(r.mulheres) && vazio(r.part)) return 'Informe o total de participantes antes do número de mulheres.';
      if (n(r.mulheres) > n(r.part)) return 'O número de mulheres não pode passar do total de participantes.';
    }
    if (tabela === 'agricultores' && r.kit && !r.kitdata) return 'Informe a data da entrega do kit.';
    if (tabela === 'membros') {
      if (!String(r.nome || '').trim()) return 'Informe o nome.';
      if (!['coordenacao', 'auxiliar', 'discente', 'formador'].includes(r.funcao)) return 'Escolha a função.';
      if (!r.inicio) return 'Informe a data de início.';
      if (r.fim && r.fim < r.inicio) return 'O desligamento não pode ser antes do início.';
      const ob = obrigatoriosMembro(r, anterior); if (ob) return ob;
      if (!r.lgpd) return 'Marque que a pessoa foi informada e concorda com o uso dos dados.';
      const mc = validarDadosPessoais(r); if (mc) return mc;
      // ninguém duas vezes na equipe ao mesmo tempo, e as vagas do plano (o banco confere CPF e e-mail; as vagas, a tela)
      const hj = iso(new Date()), ativoM = m => !m.fim || m.fim >= hj, outros = (db.membros || []).filter(m => m.id !== r.id && ativoM(m));
      if (ativoM(r)) {
        if (r.cpf && outros.some(m => m.cpf && soDigitos(m.cpf) === soDigitos(r.cpf))) return 'Já existe uma pessoa ativa na equipe com este CPF.';
        if (r.email && outros.some(m => String(m.email || '').trim().toLowerCase() === String(r.email).trim().toLowerCase())) return 'Já existe uma pessoa ativa na equipe com este e-mail.';
        const lim = VAGAS[r.funcao]; if (lim && (!anterior || anterior.funcao !== r.funcao || !ativoM(anterior)) && outros.filter(m => m.funcao === r.funcao).length >= lim) return `As vagas desta função já estão ocupadas (${lim} no plano). Registre o desligamento de quem saiu antes de cadastrar outra pessoa.`;
      }
    }
    if (tabela === 'despesas') {
      if (!(n(r.valor) > 0)) return 'Informe o valor da despesa.';
      if (!D.RUBRICAS.some(x => x.id === r.rubrica)) return 'Escolha a rubrica.';
      if (!D.ETAPAS.some(x => x.id === r.etapa)) return 'Escolha a etapa do plano.';
      if (r.item) { const it = D.DESEMBOLSO.itens.find(i => i.id === r.item); if (!it) return 'Item do plano desconhecido. Escolha outro ou deixe sem item.';
        if (it.rubrica !== r.rubrica) return `O item “${it.nome}” é de outra rubrica. Escolha um item da rubrica desta despesa ou deixe sem item.`; }
    }
    if (tabela === 'pessoas') {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(r.email || ''))) return 'Informe um e-mail válido.';
      if (db.pessoas.some(p => p.id !== r.id && String(p.email).toLowerCase() === String(r.email).toLowerCase())) return 'Já existe um acesso com esse e-mail.';
      const eraCoord = anterior && anterior.perfil === 'Coordenação' && anterior.ativo !== false;
      const segueCoord = r.perfil === 'Coordenação' && r.ativo !== false;
      if (eraCoord && !segueCoord && db.pessoas.filter(p => p.perfil === 'Coordenação' && p.ativo !== false).length < 2) return 'É preciso manter pelo menos um acesso de coordenação ativo.';
    }
    return '';
  }

  /* ---------- exclusão: onde o registro está em uso ---------- */
  const REFS = { unidades: [['itens', 'unidade'], ['lotes', 'unidade'], ['agricultores', 'unidade']], lotes: [['distribuicoes', 'lote']], agricultores: [['distribuicoes', 'agricultor'], ['visitas', 'agricultor']], eventos: [['presencas', 'evento'], ['fotos', 'registro']], visitas: [['fotos', 'registro']] };
  const emUso = (db, tabela, id) => (REFS[tabela] || []).filter(([c, k]) => (db[c] || []).some(x => x[k] === id)).map(([c]) => c);

  /* ---------- quem pode o quê (a tela esconde; o banco recusa) ---------- */
  const RESTRITAS = ['despesas', 'pessoas', 'membros'];   // a equipe (bolsistas) não grava
  /* perfis (23): o auxiliar administrativo cuida do financeiro e dos itens; formador(a), só da Formação. Acompanhamento (SEAB/MDA) só lê.
     A habilitação da equipe (Arlo e termo) o auxiliar marca por outro caminho (api.habilitar), não pelo formulário. */
  const PERFIS = ['Coordenação', 'Equipe', 'Auxiliar', 'Formador', 'Acompanhamento'];
  const NOME_PERFIL = { Coordenação: 'Coordenação', Equipe: 'Equipe (bolsistas)', Auxiliar: 'Auxiliar administrativo', Formador: 'Formador(a)', Acompanhamento: 'Acompanhamento (SEAB/MDA)' };
  const GRAVA = { Auxiliar: ['despesas', 'itens'], Formador: ['eventos', 'presencas', 'fotos'] };
  const podeGravar = (eu, tabela) => !!eu && eu.ativo !== false && (eu.perfil === 'Coordenação' || (eu.perfil === 'Equipe' && !RESTRITAS.includes(tabela)) || (GRAVA[eu.perfil] || []).includes(tabela));
  /* excluir: a coordenação exclui tudo; o auxiliar, qualquer despesa; nos demais casos, só o que a própria pessoa lançou (nunca acessos) */
  const podeExcluir = (eu, tabela, r) => !!eu && eu.ativo !== false && tabela !== 'pessoas'
    && (eu.perfil === 'Coordenação' || (eu.perfil === 'Auxiliar' && tabela === 'despesas')
      || (((eu.perfil === 'Equipe' && !RESTRITAS.includes(tabela)) || (GRAVA[eu.perfil] || []).includes(tabela)) && !!r && r.criado_por === eu.id));

  /* ---------- cadastro da equipe: documentos e endereço (vale na tela da coordenação e no link que a pessoa preenche) ---------- */
  const soDigitos = s => String(s == null ? '' : s).replace(/\D/g, '');
  function cpfValido(c) {
    c = soDigitos(c); if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
    const dv = n => { let s = 0; for (let i = 0; i < n; i++) s += +c[i] * (n + 1 - i); const r = (s * 10) % 11; return r === 10 ? 0 : r; };
    return dv(9) === +c[9] && dv(10) === +c[10];
  }
  /* campos que a pessoa pode preencher pelo link (o banco aceita só estes) e os que só a coordenação lê */
  const CAMPOS_CONVITE = ['nome', 'nome_social', 'cpf', 'pis', 'nascimento', 'telefone', 'email', 'cep', 'logradouro', 'numero', 'complemento', 'bairro', 'municipio', 'uf',
    'vinculo', 'siape', 'organizacao', 'experiencia', 'outra_bolsa', 'arlo', 'agricultor', 'atua_af', 'zona_rural', 'celular_internet', 'socio', 'escolaridade', 'raca_cor', 'renda', 'pessoas_casa', 'lgpd'];
  const CAMPOS_RESERVADOS = ['cpf', 'pis', 'nascimento', 'cep', 'logradouro', 'numero', 'complemento', 'bairro', 'uf', 'socio', 'escolaridade', 'raca_cor', 'renda', 'pessoas_casa'];
  /* guarda documento só com números, UF em maiúsculas, e apaga o questionário se a pessoa não quis responder */
  function normalizarMembro(r) {
    ['cpf', 'pis', 'cep'].forEach(k => { if (r[k] != null) r[k] = soDigitos(r[k]); });
    if (r.uf) r.uf = String(r.uf).toUpperCase().trim();
    if (!r.socio) { r.socio = false; ['escolaridade', 'raca_cor', 'renda', 'pessoas_casa'].forEach(k => { r[k] = ''; }); }
    return r;
  }
  function validarDadosPessoais(r) {
    if (r.cpf && !cpfValido(r.cpf)) return 'O CPF informado não é válido. Confira os números.';
    if (r.pis && soDigitos(r.pis).length !== 11) return 'O PIS/NIS/PASEP tem 11 números.';
    if (r.cep && soDigitos(r.cep).length !== 8) return 'O CEP tem 8 números.';
    if (r.nascimento && (r.nascimento < '1900-01-02' || r.nascimento >= iso(new Date()))) return 'Confira a data de nascimento.';
    if (r.nascimento && r.inicio && r.nascimento >= r.inicio) return 'A data de nascimento não pode ser depois do início da bolsa.';
    if (r.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.email)) return 'Confira o e-mail.';
    if (r.telefone && !/^\d{10,11}$/.test(soDigitos(r.telefone).replace(/^55(?=\d{10,11}$)/, ''))) return 'Confira o telefone: DDD e número, com 10 ou 11 algarismos.';
    if (r.renda !== '' && r.renda != null && !(Number(r.renda) >= 0)) return 'A renda precisa ser um número positivo.';
    if (r.pessoas_casa !== '' && r.pessoas_casa != null && !(Number.isInteger(Number(r.pessoas_casa)) && r.pessoas_casa >= 1 && r.pessoas_casa <= 40)) return 'Pessoas na casa: informe um número de 1 a 40.';
    return '';
  }
  /* vagas do plano de trabalho por função (formador(a): por atividade, sem número fixo) */
  const VAGAS = { coordenacao: 1, auxiliar: 1, discente: 3 };
  /* obrigatórios do cadastro da equipe (padrão do Mulheres & Quintais). Cadastro antigo sem CPF, celular ou e-mail continua
     podendo ser editado; o que já foi informado não pode ser apagado. */
  function obrigatoriosMembro(r, anterior) {
    const tem = k => String(r[k] == null ? '' : r[k]).trim() !== '', tinha = k => !anterior || String(anterior[k] == null ? '' : anterior[k]).trim() !== '';
    if (String(r.nome || '').trim().split(/\s+/).filter(Boolean).length < 2) return 'Informe o nome completo (nome e sobrenome).';
    if (!tem('cpf') && tinha('cpf')) return 'Informe o CPF.';
    if (!tem('telefone') && tinha('telefone')) return 'Informe o celular com WhatsApp.';
    if (!tem('email') && tinha('email')) return 'Informe o e-mail: é o login no sistema.';
    if (r.siape && !/^\d{5,8}$/.test(soDigitos(r.siape))) return 'A matrícula SIAPE tem de 5 a 8 números.';
    if (r.nascimento && r.inicio) { const d = new Date(r.nascimento + 'T12:00:00'); d.setFullYear(d.getFullYear() + 16); if (iso(d) > r.inicio) return 'Confira a data de nascimento: a pessoa precisa ter pelo menos 16 anos no início da bolsa.'; }
    if (r.socio && ['escolaridade', 'raca_cor', 'renda', 'pessoas_casa'].some(k => !tem(k))) return 'Questionário socioeconômico: responda as quatro perguntas ou desmarque o questionário.';
    return '';
  }
  /* o que a pessoa envia pelo link: nome e termo são obrigatórios; o resto é conferido se vier */
  function validarConvite(r, funcao) {
    if (String(r.nome || '').trim().split(/\s+/).filter(Boolean).length < 2) return 'Informe o nome completo (nome e sobrenome).';
    if (!r.cpf) return 'Informe o CPF.'; if (!r.telefone) return 'Informe o celular com WhatsApp.'; if (!r.email) return 'Informe o e-mail: será o seu login no sistema.';
    if (r.arlo !== 'Sim' && !r.nascimento) return 'Informe a data de nascimento (a FUNCERN pede para o cadastro no Arlo).';
    if (['discente', 'formador'].includes(funcao) && ['agricultor', 'atua_af', 'zona_rural', 'celular_internet'].some(k => !r[k])) return 'Responda as perguntas do “Perfil no campo”.';
    { const ob = obrigatoriosMembro(Object.assign({}, r, { inicio: '' }), null); if (ob) return ob; }
    const m = validarDadosPessoais(r); if (m) return m;
    if (!r.lgpd) return 'Para enviar, marque que você leu e concorda com o uso dos dados.';
    return '';
  }
  /* equipe: quem está em cada função hoje e quem já saiu (fim preenchido e já passado) */
  const ativo = (m, hojeIso) => !m.fim || m.fim > hojeIso;
  function equipePorFuncao(db, funcao, hojeIso) {
    const L = (db.membros || []).filter(m => m.funcao === funcao);
    return { ativos: L.filter(m => ativo(m, hojeIso)).sort((a, b) => a.inicio < b.inicio ? -1 : 1), antigos: L.filter(m => !ativo(m, hojeIso)).sort((a, b) => a.fim < b.fim ? 1 : -1) };
  }
  const MSG_CONFLITO = 'Este registro foi alterado por outra pessoa depois que você abriu. Feche, confira como ficou e faça a sua alteração de novo.';
  const MSG_EXCLUIDO = 'Este registro foi excluído por outra pessoa enquanto você editava.';
  /* ---------- mensagens de erro do servidor em português de gente ---------- */
  function mensagemErro(e) {
    const m = String((e && (e.message || e.error_description || e.msg)) || e || ''), c = e && e.code;
    if (c === 'P0001') return m;   // mensagem escrita por nós no banco
    if (c === '23503') return /insert|update/i.test(m) ? 'Este registro aponta para um cadastro que não existe mais (lote, biofábrica ou unidade produtiva excluída). Confira e escolha de novo.' : 'Este registro está em uso em outro cadastro e não pode ser excluído.';
    if (c === '23505') return 'Já existe um registro igual a este.';
    if (c === '22P02') return 'Algum número foi digitado com vírgula ou letra onde só cabe número inteiro. Confira e tente de novo.';
    if (c === '23514' || c === '23502') return 'Algum campo ficou em branco ou com valor fora do permitido. Confira e tente de novo.';
    if (c === '42501' || /row-level security|permission denied/i.test(m)) return 'O seu perfil não tem permissão para fazer isso.';
    if (/Invalid login credentials/i.test(m)) return 'E-mail ou senha incorretos.';
    if (/Email not confirmed/i.test(m)) return 'Falta confirmar o e-mail: abra a mensagem que o sistema enviou e toque no link.';
    if (/already registered/i.test(m)) return 'Este e-mail já tem senha criada. Use “Já tenho senha” ou “Esqueci a senha”.';
    if (/rate limit|security purposes/i.test(m)) return 'Muitas tentativas seguidas. Espere um minuto e tente de novo.';
    if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return 'Sem conexão com o servidor. Confira a internet e tente de novo.';
    if (/Password should be/i.test(m)) return 'A senha precisa ter pelo menos 8 caracteres.';
    return m || 'Não foi possível concluir. Tente de novo.';
  }

  /* documento das entregas (script 27): extensões aceitas e o tipo que vai para a pasta; até 20 MB */
  const DOC_TIPOS = { pdf: 'application/pdf', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', odt: 'application/vnd.oasis.opendocument.text',
    ods: 'application/vnd.oasis.opendocument.spreadsheet', odp: 'application/vnd.oasis.opendocument.presentation', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png' };
  const DOC_MAX = 20 * 1024 * 1024;
  const extDocumento = nome => { const m = String(nome || '').toLowerCase().match(/\.([a-z0-9]+)$/); return m ? m[1] : ''; };
  const validarDocumento = a => !a ? 'Escolha o arquivo.' : !DOC_TIPOS[extDocumento(a.name)] ? 'Este tipo de arquivo não é aceito. Envie PDF, Word, Excel, PowerPoint, LibreOffice, JPEG ou PNG.'
    : !(a.size > 0) ? 'O arquivo está vazio.' : a.size > DOC_MAX ? 'O arquivo passa de 20 MB. Diminua (por exemplo, salvando o PDF em qualidade menor) ou use um link.' : '';
  SQC.regras = { DOC_TIPOS, DOC_MAX, extDocumento, validarDocumento, pd, iso, dias, fimMes, vazio, distribuido, saldo, pronto, codigoLote, nCheck, unidadePronta, realizada, proximoPasso, visitasDe, recebeu, acompanhada, feito, previstoEtapa, execucaoGeral,
    novoDesenho, venceu, MSG_CONFLITO, MSG_EXCLUIDO, recebido, previstoMeta, fin, finRubrica, finItens, equipePorFuncao, cpfValido, soDigitos, normalizarMembro, validarDadosPessoais, validarConvite, CAMPOS_CONVITE, CAMPOS_RESERVADOS, nrm, lerSolicitacoes, planoImportacao, rubricaDaFuncern, itemDaFuncern, destinoStatus, numSol, valorPlanilha, dataPlanilha, soma, desembolsoMensal, ritmo, tempoDecorrido, alertas, indicadores, validar, REFS, emUso, RESTRITAS, PERFIS, NOME_PERFIL, VAGAS, obrigatoriosMembro, podeGravar, podeExcluir, mensagemErro, brl, dt };
})();
