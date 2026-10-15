/* Simulação (?simulacao): o sistema inteiro povoado com dados fictícios, sem falar com o Supabase.
   Uso: node ferramentas/servidor_teste.js 8766 &   e   NODE_PATH=$(npm root -g) node testes/automaticos/simulacao.js
   Confere, em quatro datas e nos três perfis: nenhum pedido ao Supabase, nenhum erro de script, todas as abas abrem,
   contas coerentes (saldo de lote nunca negativo, distribuição só de lote pronto e depois do início, visita depois da entrega,
   nenhuma meta acima do valor do plano) e, no fim do projeto, todas as etapas do plano cumpridas. */
const { chromium } = require('playwright');
const URL = process.env.URL_SISTEMA || 'http://localhost:8766/';
let falhas = 0; const ok = (c, m, x) => { if (c) console.log('ok  ' + m); else { falhas++; console.log('FALHOU: ' + m + (x ? ' — ' + x : '')); } };
(async () => {
  const b = await chromium.launch();
  for (const dia of ['2026-10-31', '2027-01-31', '2027-04-30', '']) {
    for (const perfil of ['Coordenação', 'Equipe', 'Auxiliar', 'Formador', 'Acompanhamento']) {
      const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' }), p = await ctx.newPage(), erros = [], rede = [];
      p.on('pageerror', e => erros.push(e.message)); p.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
      p.on('request', r => { if (/supabase\.co/.test(r.url())) rede.push(r.url()); });
      await p.goto(URL + '?simulacao' + (dia ? '=' + dia : '')); await p.click(`[data-demo="${perfil}"]`); await p.waitForSelector('#view h1');
      const rot = `${dia || 'fim do projeto'} · ${perfil}`;
      ok(await p.$('#sim-faixa') !== null, `${rot}: faixa “Simulação com dados fictícios” visível`);
      for (const t of await p.$$eval('#tabs [data-tab]', l => l.map(x => x.dataset.tab))) { await p.click(`#tabs [data-tab="${t}"]`); await p.waitForSelector('#view h1'); }
      if (['Auxiliar', 'Formador', 'Acompanhamento'].includes(perfil)) {   // sem dado pessoal de agricultor (nome, comunidade) nem visita com texto
        const r = await p.evaluate(() => { const db = SQC.app._estado().db; return { nomes: db.agricultores.filter(a => /fict/i.test(a.nome || '') || a.comunidade).length, obs: db.visitas.filter(v => v.obs).length }; });
        const r2 = await p.evaluate(() => { const db = SQC.app._estado().db; return { pres: (db.presencas || []).length, fotos: (db.fotos || []).filter(f => f.tabela !== 'eventos').length, desp: (db.despesas || []).length }; });
        ok(r.nomes === 0 && r.obs === 0, `${rot}: nenhum nome, comunidade ou observação de visita de agricultor chega a este perfil`, JSON.stringify(r));
        if (perfil !== 'Formador') ok(r2.pres === 0, `${rot}: lista de presença não chega a este perfil`, JSON.stringify(r2));
        ok(r2.fotos === 0, `${rot}: foto de visita não chega a este perfil`, JSON.stringify(r2));
        if (perfil !== 'Auxiliar') ok(r2.desp === 0, `${rot}: despesas não chegam a este perfil`, JSON.stringify(r2));
      }
      if (perfil === 'Coordenação') {
        const r = await p.evaluate(() => { const db = SQC.app._estado().db, R = SQC.regras, D = SQC.dados, hj = new Date().toISOString().slice(0, 10);
          const lote = id => db.lotes.find(l => l.id === id);
          return { hj, saldoNeg: db.lotes.filter(l => R.saldo(db, l) < 0).length,
            distRuim: db.distribuicoes.filter(d => { const l = lote(d.lote); return !l || l.status !== 'Pronto' || d.data < l.inicio || d.data > hj; }).length,
            visFutura: db.visitas.filter(v => v.data > hj).length,
            acima: R.fin(db).filter(m => m.saldo < 0).map(m => m.m), feito: D.ETAPAS.map(e => [e.id, R.feito(db, e), e.q]),
            vazias: D.TABELAS.filter(t => t !== 'fotos' && !db[t].length) }; });
        ok(r.saldoNeg === 0 && r.distRuim === 0 && r.visFutura === 0, `${rot}: lotes, distribuições e visitas coerentes`, JSON.stringify(r));
        ok(!r.acima.length, `${rot}: nenhuma meta acima do valor do plano`, r.acima.join(','));
        if (!dia) { ok(r.feito.every(([, f, q]) => f >= q), `${rot}: todas as etapas do plano cumpridas no fim do projeto`, JSON.stringify(r.feito)); ok(!r.vazias.length, `${rot}: todas as tabelas com dados`, r.vazias.join(',')); }
      }
      ok(!rede.length, `${rot}: nenhum pedido ao Supabase`, rede[0]); ok(!erros.length, `${rot}: sem erro de script`, erros[0]);
      await ctx.close();
    }
  }
  // sem ?simulacao, o sistema continua apontando para o banco de verdade
  { const ctx = await b.newContext({ serviceWorkers: 'block' }), p = await ctx.newPage(); await p.route(/supabase\.co/, r => r.abort());
    await p.goto(URL); ok(await p.evaluate(() => !SQC.SIMULACAO && /supabase\.co/.test(SQC.CONFIG.supabaseUrl) && Date.name === 'Date'), 'sem ?simulacao: nada muda (banco de verdade, relógio de verdade)'); await ctx.close(); }
  await b.close();
  console.log(falhas ? `\nSIMULAÇÃO: ${falhas} FALHOU` : '\nSIMULAÇÃO: TUDO CERTO'); process.exit(falhas ? 1 : 0);
})();
