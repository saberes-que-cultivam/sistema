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
  const visitasDe = (db, id) => db.visitas.filter(v => v.agricultor === id).sort((a, b) => a.data < b.data ? 1 : -1);
  const recebeu = (db, id) => db.distribuicoes.filter(d => d.agricultor === id);
  /* "acompanhada" (Meta 4): recebeu bioinsumo e teve ao menos uma visita de monitoramento */
  const acompanhada = (db, a) => recebeu(db, a.id).length > 0 && visitasDe(db, a.id).length > 0;

  /* ---------- execução física: quanto de cada etapa já foi feito ---------- */
  function feito(db, e) {
    switch (e.id) {
      case '2.1': return db.unidades.filter(u => u.conta === 'Sim' && u.funcionando).length;
      case '3.2': return db.eventos.filter(x => x.tipo === 'Capacitação').length;
      case '3.3': return db.agricultores.filter(a => a.kit).length;
      case '4.1': return db.agricultores.filter(a => acompanhada(db, a)).length;
      case '5.1': return db.eventos.filter(x => x.tipo === 'Dia de campo').length;
      default: return db.entregas.filter(g => g.etapa === e.id).length;
    }
  }

  /* ---------- execução física do projeto (número grande do painel) ----------
     Cada etapa pesa o valor que o plano de trabalho destina a ela (quantidade x valor unitário); não é média simples.
     "Previsto" = quanto da etapa já deveria estar feito até o fim do mês passado, distribuído por igual na janela da etapa. */
  const mesesEntre = (a, b) => (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth();
  function previstoEtapa(e, hoje) {
    const ini = pd(e.ini), total = mesesEntre(ini, pd(e.fim)) + 1;
    return Math.max(0, Math.min(1, mesesEntre(ini, new Date(hoje.getFullYear(), hoje.getMonth(), 1)) / total));
  }
  function execucaoGeral(db, hoje) {
    hoje = hoje || new Date();
    const linhas = D.ETAPAS.map(e => ({ e, valor: e.q * e.v, feito: Math.min(1, feito(db, e) / e.q), prev: previstoEtapa(e, hoje) }));
    const tot = linhas.reduce((s, x) => s + x.valor, 0);
    const real = linhas.reduce((s, x) => s + x.valor * x.feito, 0) / tot * 100, prev = linhas.reduce((s, x) => s + x.valor * x.prev, 0) / tot * 100;
    const st = real >= 99.5 ? 'concluida' : real >= prev ? 'andamento' : real >= prev * 0.7 ? 'atencao' : 'atrasada';
    const porMeta = [1, 2, 3, 4, 5, 6].map(m => { const l = linhas.filter(x => x.e.m === m), v = l.reduce((s, x) => s + x.valor, 0); return { m, valor: v, feito: l.reduce((s, x) => s + x.valor * x.feito, 0) / v * 100, prev: l.reduce((s, x) => s + x.valor * x.prev, 0) / v * 100 }; });
    const meses = mesesEntre(pd(D.G0), pd(D.G1)), mes = Math.max(1, Math.min(meses, mesesEntre(pd(D.G0), hoje) + 1));
    const ant = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    return { real, prev, st, porMeta, mes, meses, ate: String(ant.getMonth() + 1).padStart(2, '0') + '/' + ant.getFullYear() };
  }

  /* ---------- financeiro ---------- */
  const recebido = () => D.PARCELAS.filter(p => p.recebida).reduce((s, p) => s + p.valor, 0);
  const previstoMeta = m => D.ETAPAS.filter(e => e.m === m).reduce((s, e) => s + e.q * e.v, 0);
  const somaDesp = (ds, pago) => ds.filter(d => (d.status === 'Pago') === pago).reduce((s, d) => s + n(d.valor), 0);
  const ate = (db, lim) => db.despesas.filter(d => !lim || d.data <= lim);
  /* por meta do TED: previsto, comprometido (solicitado ou em compras), pago, saldo */
  function fin(db, lim) {
    return [1, 2, 3, 4, 5, 6].map(m => {
      const prev = previstoMeta(m); const ds = ate(db, lim).filter(d => String(d.etapa)[0] === String(m));
      const pago = somaDesp(ds, true), comp = somaDesp(ds, false);
      return { m, nome: D.METAS[m], prev, comp, pago, saldo: prev - comp - pago };
    });
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
      return { id: r.id, nome: r.nome, prev: r.v, comp, pago, saldo: r.v - comp - pago };
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
  const brl = v => 'R$ ' + n(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const dt = s => s ? String(s).slice(0, 10).split('-').reverse().join('/') : '—';
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
    D.ETAPAS.forEach(e => { if (venceu(e, hoje) && feito(db, e) < e.q) add('bad', 'Prazo', `Etapa ${e.id} venceu em ${e.fim.split('-').reverse().join('/')} com ${feito(db, e)} de ${e.q}.`, e.nome + '.', iso(fimMes(e.fim)), D.ETAPAS_AUTOMATICAS.includes(e.id) ? '' : 'entregas'); });
    // urgente primeiro; dentro do mesmo nível, o que tem prazo mais próximo
    return A.sort((a, b) => (a[0] === 'bad' ? 0 : 1) - (b[0] === 'bad' ? 0 : 1) || (a[5] || '9') .localeCompare(b[5] || '9'));
  }

  /* ---------- indicadores da Meta 5 ---------- */
  function indicadores(db) {
    // só entra quem tem as duas pontas: linha de base com gasto informado E visita com gasto (campo vazio não é zero)
    const comp = db.agricultores.map(a => { const v = visitasDe(db, a.id).find(x => !vazio(x.gasto)); return a.diag && !vazio(a.gasto0) && v ? [n(a.gasto0), n(v.gasto)] : null; }).filter(Boolean);
    const m0 = comp.reduce((s, c) => s + c[0], 0) / (comp.length || 1), m1 = comp.reduce((s, c) => s + c[1], 0) / (comp.length || 1);
    const ev = db.eventos.filter(e => ['Capacitação', 'Dia de campo'].includes(e.tipo));
    return { pares: comp.length, base: m0, atual: m1, variacao: comp.length && m0 ? (m1 - m0) / m0 * 100 : null,
      visitas: db.visitas.length, usou: db.visitas.filter(v => v.usou === 'Sim').length,
      participantes: ev.reduce((s, e) => s + n(e.part), 0), mulheres: ev.reduce((s, e) => s + n(e.mulheres), 0) };
  }

  /* ---------- conferências antes de gravar: devolve '' ou a mensagem para a tela ---------- */
  function validar(db, tabela, r, anterior) {
    if (tabela === 'unidades') {
      if (!/^[A-Za-z]{2,4}$/.test(String(r.sigla || ''))) return 'A sigla precisa ter de 2 a 4 letras, sem número nem espaço.';
      if (db.unidades.some(u => u.id !== r.id && String(u.sigla).toUpperCase() === String(r.sigla).toUpperCase())) return 'Já existe uma unidade com essa sigla.';
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
    if (tabela === 'eventos') {
      if (!inteiro(r.part) || !inteiro(r.mulheres)) return 'Participantes e mulheres precisam ser números inteiros.';
      if (!vazio(r.mulheres) && vazio(r.part)) return 'Informe o total de participantes antes do número de mulheres.';
      if (n(r.mulheres) > n(r.part)) return 'O número de mulheres não pode passar do total de participantes.';
    }
    if (tabela === 'agricultores' && r.kit && !r.kitdata) return 'Informe a data da entrega do kit.';
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
  const REFS = { unidades: [['itens', 'unidade'], ['lotes', 'unidade'], ['agricultores', 'unidade']], lotes: [['distribuicoes', 'lote']], agricultores: [['distribuicoes', 'agricultor'], ['visitas', 'agricultor']] };
  const emUso = (db, tabela, id) => (REFS[tabela] || []).filter(([c, k]) => db[c].some(x => x[k] === id)).map(([c]) => c);

  /* ---------- quem pode o quê (a tela esconde; o banco recusa) ---------- */
  const RESTRITAS = ['despesas', 'pessoas'];   // só a coordenação grava
  /* perfil Acompanhamento (SEAB/MDA) só lê */
  const podeGravar = (eu, tabela) => !!eu && eu.ativo !== false && (eu.perfil === 'Coordenação' || (eu.perfil === 'Equipe' && !RESTRITAS.includes(tabela)));
  /* excluir: a coordenação exclui tudo; a equipe, só o que ela mesma lançou (nunca despesas nem acessos) */
  const podeExcluir = (eu, tabela, r) => !!eu && eu.ativo !== false && tabela !== 'pessoas'
    && (eu.perfil === 'Coordenação' || (eu.perfil === 'Equipe' && !RESTRITAS.includes(tabela) && !!r && r.criado_por === eu.id));

  const MSG_CONFLITO = 'Este registro foi alterado por outra pessoa depois que você abriu. Feche, confira como ficou e faça a sua alteração de novo.';
  const MSG_EXCLUIDO = 'Este registro foi excluído por outra pessoa enquanto você editava.';
  /* ---------- mensagens de erro do servidor em português de gente ---------- */
  function mensagemErro(e) {
    const m = String((e && (e.message || e.error_description || e.msg)) || e || ''), c = e && e.code;
    if (c === 'P0001') return m;   // mensagem escrita por nós no banco
    if (c === '23503') return 'Este registro está em uso em outro cadastro e não pode ser excluído.';
    if (c === '23505') return 'Já existe um registro igual a este.';
    if (c === '22P02') return 'Algum número foi digitado com vírgula ou letra onde só cabe número inteiro. Confira e tente de novo.';
    if (c === '23514' || c === '23502') return 'Algum campo ficou em branco ou com valor fora do permitido. Confira e tente de novo.';
    if (c === '42501' || /row-level security|permission denied/i.test(m)) return 'O seu perfil não tem permissão para fazer isso.';
    if (/Invalid login credentials/i.test(m)) return 'E-mail ou senha incorretos.';
    if (/Email not confirmed/i.test(m)) return 'Falta confirmar o e-mail: abra a mensagem que o sistema enviou e toque no link.';
    if (/already registered/i.test(m)) return 'Este e-mail já tem senha criada. Use "Entrar" ou "Esqueci a senha".';
    if (/rate limit|security purposes/i.test(m)) return 'Muitas tentativas seguidas. Espere um minuto e tente de novo.';
    if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return 'Sem conexão com o servidor. Confira a internet e tente de novo.';
    if (/Password should be/i.test(m)) return 'A senha precisa ter pelo menos 8 caracteres.';
    return m || 'Não foi possível concluir. Tente de novo.';
  }

  SQC.regras = { pd, iso, dias, fimMes, vazio, distribuido, saldo, pronto, codigoLote, nCheck, proximoPasso, visitasDe, recebeu, acompanhada, feito, previstoEtapa, execucaoGeral,
    venceu, MSG_CONFLITO, MSG_EXCLUIDO, recebido, previstoMeta, fin, finRubrica, finItens, soma, desembolsoMensal, ritmo, tempoDecorrido, alertas, indicadores, validar, REFS, emUso, RESTRITAS, podeGravar, podeExcluir, mensagemErro, brl, dt };
})();
