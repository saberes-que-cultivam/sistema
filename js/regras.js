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

  /* ---------- o que precisa de atenção (painel) ---------- */
  const brl = v => 'R$ ' + n(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const dt = s => s ? String(s).slice(0, 10).split('-').reverse().join('/') : '—';
  function alertas(db, hoje) {
    hoje = hoje || new Date(); const A = [];
    const F = fin(db), usado = soma(F, 'pago') + soma(F, 'comp'), rec = recebido();
    const prox = D.PARCELAS.find(p => !p.recebida);
    if (usado > rec) A.push(['bad', 'Financeiro', `Pago e comprometido somam ${brl(usado)}, acima do que já foi recebido (${brl(rec)}).${prox ? ' A próxima parcela está prevista para ' + prox.previsao.split('-').reverse().join('/') + '.' : ''}`]);
    F.filter(r => r.saldo < 0).forEach(r => A.push(['bad', 'Financeiro', `Meta ${r.m} está ${brl(-r.saldo)} acima do valor previsto no plano.`]));
    finRubrica(db).forEach(r => {
      if (r.semRubrica) A.push(['f', 'Financeiro', `Há despesa lançada sem rubrica (${brl(r.comp + r.pago)}). Sem rubrica ela não entra na conferência com a FUNCERN.`]);
      else if (r.saldo < 0) A.push(['bad', 'Rubrica', `${r.nome}: ${brl(-r.saldo)} acima do previsto no plano. Remanejar exige ajuste do plano de trabalho.`]);
      else if (r.prev && (r.comp + r.pago) / r.prev >= 0.9) A.push(['f', 'Rubrica', `${r.nome}: ${Math.round((r.comp + r.pago) / r.prev * 100)}% do previsto já pago ou comprometido.`]);
    });
    const e21 = D.ETAPAS.find(e => e.id === '2.1'); const lim = new Date(fimMes(e21.fim).getTime() - 60 * 864e5);
    db.unidades.filter(u => u.conta === 'Sim').forEach(u => {
      if (!u.orcamento) A.push([dias(hoje, lim) < 30 ? 'bad' : 'f', 'Compras', `${u.nome}: envie os orçamentos à FUNCERN até ${dt(iso(lim))}. A etapa 2.1 termina em ${e21.fim.split('-').reverse().join('/')} e uma compra pela fundação leva cerca de dois meses.`]);
      if (!u.parceiro_ok) A.push(['f', 'Patrimônio', `${u.nome}: defina o parceiro institucional que receberá os bens. Não é possível doar a pessoa física.`]);
    });
    const semBase = db.agricultores.filter(a => !a.diag);
    if (semBase.length) A.push(['bad', 'Linha de base', `${semBase.length} unidade(s) produtiva(s) sem diagnóstico inicial. Sem ele, a avaliação da Meta 5 não tem com o que comparar.`]);
    db.agricultores.forEach(a => {
      const r = recebeu(db, a.id).sort((x, y) => x.data < y.data ? 1 : -1)[0]; if (!r) return; const v = visitasDe(db, a.id)[0];
      if ((!v || v.data < r.data) && dias(pd(r.data), hoje) > 30) A.push(['f', 'Monitoramento', `${a.nome}: recebeu bioinsumo em ${dt(r.data)} e não teve visita depois.`]);
    });
    db.lotes.forEach(l => { if (['Em preparo', 'Maturando'].includes(l.status) && pronto(l) < hoje) A.push(['f', 'Lote', `${l.codigo || 'Lote sem código'}: passou da previsão (${dt(iso(pronto(l)))}). Confira e marque como pronto.`]); });
    D.ETAPAS.forEach(e => { if (fimMes(e.fim) < hoje && feito(db, e) < e.q) A.push(['bad', 'Prazo', `Etapa ${e.id} venceu em ${e.fim.split('-').reverse().join('/')} com ${feito(db, e)} de ${e.q}.`]); });
    return A;
  }

  /* ---------- indicadores da Meta 5 ---------- */
  function indicadores(db) {
    const comp = db.agricultores.map(a => { const v = visitasDe(db, a.id).find(x => !vazio(x.gasto)); return a.diag && v ? [n(a.gasto0), n(v.gasto)] : null; }).filter(Boolean);
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
    if (tabela === 'lotes') {
      if (!(n(r.qtd) > 0)) return 'Informe a quantidade produzida.';
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
    }
    if (tabela === 'eventos' && n(r.mulheres) > n(r.part)) return 'O número de mulheres não pode passar do total de participantes.';
    if (tabela === 'agricultores' && r.kit && !r.kitdata) return 'Informe a data da entrega do kit.';
    if (tabela === 'despesas') {
      if (!(n(r.valor) > 0)) return 'Informe o valor da despesa.';
      if (!D.RUBRICAS.some(x => x.id === r.rubrica)) return 'Escolha a rubrica.';
      if (!D.ETAPAS.some(x => x.id === r.etapa)) return 'Escolha a etapa do plano.';
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
  const podeGravar = (eu, tabela) => !!eu && eu.ativo !== false && (eu.perfil === 'Coordenação' || !RESTRITAS.includes(tabela));
  /* excluir: a coordenação exclui tudo; a equipe, só o que ela mesma lançou (nunca despesas nem acessos) */
  const podeExcluir = (eu, tabela, r) => !!eu && eu.ativo !== false && tabela !== 'pessoas'
    && (eu.perfil === 'Coordenação' || (!RESTRITAS.includes(tabela) && !!r && r.criado_por === eu.id));

  /* ---------- mensagens de erro do servidor em português de gente ---------- */
  function mensagemErro(e) {
    const m = String((e && (e.message || e.error_description || e.msg)) || e || ''), c = e && e.code;
    if (c === 'P0001') return m;   // mensagem escrita por nós no banco
    if (c === '23503') return 'Este registro está em uso em outro cadastro e não pode ser excluído.';
    if (c === '23505') return 'Já existe um registro igual a este.';
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

  SQC.regras = { pd, iso, dias, fimMes, vazio, distribuido, saldo, pronto, codigoLote, nCheck, proximoPasso, visitasDe, recebeu, acompanhada, feito,
    recebido, previstoMeta, fin, finRubrica, soma, alertas, indicadores, validar, REFS, emUso, RESTRITAS, podeGravar, podeExcluir, mensagemErro, brl, dt };
})();
