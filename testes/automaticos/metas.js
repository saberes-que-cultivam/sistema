/* Metas do plano de trabalho (Metas 1 a 6), no modo demonstração: cada meta pelos formulários da tela, e depois a conferência
   de que o realizado (etapas), a Visão geral, os avisos, os Relatórios e as planilhas (.csv) batem com os registros.
   Inclui casos de borda: campo obrigatório, número inválido ou negativo, saldo de lote, lote não pronto, datas trocadas,
   atividade no futuro (planejada), mesma unidade produtiva com várias entregas e visitas, filtro de período do relatório.
   Uso:  node ferramentas/servidor_teste.js 8766 &   e depois   NODE_PATH=$(npm root -g) node testes/automaticos/metas.js
   Todos os dados são fictícios e marcados "(exemplo)". Não para na primeira falha: junta tudo e mostra o resumo no fim. */
const { chromium } = require('playwright'); const fs = require('fs');
const URL_ = process.env.URL_SISTEMA || 'http://localhost:8766/';
const R_ = { ok: 0, falhas: [] };
const ok = (c, m, det) => { if (c) { R_.ok++; console.log('ok  ' + m); } else { R_.falhas.push(m + (det ? ' [' + det + ']' : '')); console.log('FALHOU: ' + m + (det ? ' [' + det + ']' : '')); } };
const nota = m => console.log('obs ' + m);
/* datas relativas a hoje, em texto AAAA-MM-DD (o navegador usa o mesmo relógio) */
const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const dia = n => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return iso(d); };
const dt = s => s.split('-').reverse().join('/');
const brl = v => 'R$ ' + new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
const CONFIG = "window.SQC=window.SQC||{};SQC.CONFIG={supabaseUrl:'',supabaseAnonKey:'',semServiceWorker:true};";

async function novaPagina(b, opcoes) {
  const ctx = await b.newContext(Object.assign({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block', locale: 'pt-BR', acceptDownloads: true }, opcoes || {}));
  const p = await ctx.newPage(); const erros = []; p.on('pageerror', e => erros.push(String(e))); p.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  await p.route('**/js/config.js', r => r.fulfill({ contentType: 'text/javascript', body: CONFIG }));
  await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ contentType: 'text/css', body: '' }));
  return { ctx, p, erros };
}

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const { p, erros } = await novaPagina(b);
  await p.goto(URL_); await p.click('[data-demo="Coordenação"]'); await p.waitForSelector('.dx-topo');
  const db = () => p.evaluate(() => JSON.parse(JSON.stringify(SQC.app._estado().db)));
  const feito = id => p.evaluate(id => SQC.regras.feito(SQC.app._estado().db, SQC.dados.ETAPAS.find(e => e.id === id)), id);
  const aba = async t => { await p.click(`#tabs [data-tab="${t}"]`); await p.waitForFunction(t => SQC.app._estado().tab === t, t); };
  const fechar = async () => { for (let i = 0; i < 3 && await p.evaluate(() => document.getElementById('dlg').open); i++) { await p.click('#frm [data-fechar]'); await p.waitForTimeout(50); } };
  /* preenche e salva um formulário; devolve '' (gravou) ou a mensagem de erro mostrada */
  async function form(abre, vals) {
    await p.click(abre); await p.waitForSelector('#fsalvar');
    for (const [k, v] of Object.entries(vals)) {
      const el = await p.$('#f_' + k); if (!el) throw new Error('campo não encontrado: ' + k);
      const tipo = await el.evaluate(e => e.tagName === 'SELECT' ? 'select' : e.type);
      if (tipo === 'select') await el.selectOption(String(v)); else if (tipo === 'checkbox') await el.setChecked(!!v); else await el.fill(String(v));
    }
    await p.evaluate(() => { document.getElementById('ferr').textContent = ''; });
    await p.click('#fsalvar');
    await p.waitForFunction(() => !document.getElementById('dlg').open || document.getElementById('ferr').textContent.trim());
    const err = await p.evaluate(() => document.getElementById('dlg').open ? document.getElementById('ferr').textContent.trim() : '');
    if (err) await fechar(); return err;
  }
  const idPor = async (t, campo, valor) => (await db())[t].find(x => x[campo] === valor).id;

  /* ---------- ponto de partida: só o que não é exemplo (3 biofábricas, 2 atividades que não contam, 1 entrega da 6.3) ---------- */
  await p.click('[data-limpar]'); await p.click('[data-limpar]'); await p.waitForFunction(() => SQC.app._estado().db.agricultores.length === 0);
  { const d = await db(); ok(d.lotes.length === 0 && d.distribuicoes.length === 0 && d.visitas.length === 0 && d.despesas.length === 0 && d.unidades.length === 3, 'ponto de partida limpo (exemplos apagados pela tela)'); }

  /* =================== META 2: biofábricas implantadas E em funcionamento =================== */
  await aba('unidades');
  ok(/Preencha “Nome”/.test(await form('[data-new="unidades"]', { sigla: 'TS' })), 'Meta 2: biofábrica sem nome é recusada (obrigatório)');
  ok(/sigla precisa ter de 2 a 4 letras/.test(await form('[data-new="unidades"]', { nome: 'Biofábrica errada (exemplo)', sigla: 'T1' })), 'Meta 2: sigla com número é recusada');
  ok(/Já existe uma unidade com essa sigla/.test(await form('[data-new="unidades"]', { nome: 'Biofábrica repetida (exemplo)', sigla: 'spp' })), 'Meta 2: sigla repetida (maiúscula/minúscula) é recusada');
  // u1 (conta para a Meta 2): sete passos de oito, sem "Em funcionamento"
  const sete = { local_ok: 1, parceiro_ok: 1, termo: 1, itens_ok: 1, orcamento: 1, entregue: 1, montada: 1 };
  ok(await form('[data-edit="unidades:u1"]', Object.assign({ parceiro: 'Associação de exemplo (exemplo)' }, sete)) === '', 'Meta 2: passos da implantação marcados na tela (7 de 8)');
  ok(await feito('2.1') === 0, 'Meta 2: unidade com 7 de 8 passos (sem “em funcionamento”) não conta na etapa 2.1', 'feito=' + await feito('2.1'));
  // u3 é de apoio (conta = Não): mesmo em funcionamento não conta
  ok(await form('[data-edit="unidades:u3"]', Object.assign({ funcionando: 1, funcionando_em: dia(-30) }, sete)) === '', 'Meta 2: biofábrica de apoio marcada em funcionamento');
  ok(await feito('2.1') === 0, 'Meta 2: biofábrica de apoio (conta = Não) em funcionamento não conta na 2.1');
  { const m = await form('[data-edit="unidades:u1"]', { funcionando: 1 }); ok(/Informe a data/.test(m), 'Meta 2 (26): “Em funcionamento” sem a data é recusado', m); await fechar(); }
  { const m = await form('[data-edit="unidades:u1"]', { funcionando: 1, funcionando_em: dia(5) }); ok(/não pode ser no futuro/.test(m), 'Meta 2 (26): data de funcionamento no futuro é recusada', m); await fechar(); }
  ok(await form('[data-edit="unidades:u1"]', { funcionando: 1, funcionando_em: dia(-30) }) === '', 'Meta 2: u1 marcada em funcionamento (há 30 dias)');
  ok(await feito('2.1') === 1, 'Meta 2: u1 completa e em funcionamento conta 1 na 2.1');
  // unidade nova cadastrada que conta para a Meta 2, sem nenhum passo: não conta só por existir
  ok(await form('[data-new="unidades"]', { nome: 'Biofábrica nova (exemplo)', sigla: 'NOV', conta: 'Sim' }) === '', 'Meta 2: biofábrica nova cadastrada');
  ok(await feito('2.1') === 1, 'Meta 2: biofábrica só cadastrada (0 de 8 passos) não conta');
  // 15/10/2026 (decisão da coordenação): "Em funcionamento" só depois dos outros 7 passos; sem eles a tela recusa e a meta não conta
  { const id = await idPor('unidades', 'sigla', 'NOV'); const msg = await form(`[data-edit="unidades:${id}"]`, { funcionando: 1 });
    ok(/Falta: Local definido/.test(msg), 'Meta 2: “Em funcionamento” sem os outros passos é recusado na tela', msg); await fechar();
    ok(await feito('2.1') === 1, 'Meta 2: a biofábrica recusada continua sem contar (2.1 = 1)'); }
  { const d = await db(); const u2 = d.unidades.find(u => u.id === 'u2'); await aba('painel'); const A = await p.$$eval('.at-lista li', l => l.map(x => x.textContent.replace(/\s+/g, ' ')));
    ok(A.some(t => /Polo Mulungu: envie os orçamentos/.test(t)) && !A.some(t => /Polo São Paulo do Potengi: envie os orçamentos/.test(t)), 'Meta 2: aviso de orçamento só para a biofábrica que ainda não enviou (u2), não para a u1');
    ok(A.some(t => /Polo Mulungu: defina o parceiro institucional/.test(t)) === !u2.parceiro_ok, 'Meta 2: aviso de parceiro institucional bate com o cadastro'); }

  /* =================== lotes (base da Meta 4) =================== */
  await aba('lotes');
  ok(/Informe a quantidade produzida|Preencha “Quantidade produzida”/.test(await form('[data-new="lotes"]', { unidade: 'u3', tipo: 'Húmus de minhoca', inicio: dia(-90), qtd: '' })), 'Lote: quantidade obrigatória');
  ok(/número positivo/.test(await form('[data-new="lotes"]', { unidade: 'u3', tipo: 'Húmus de minhoca', inicio: dia(-90), qtd: 'cem' })), 'Lote: quantidade não numérica é recusada');
  ok(/número positivo/.test(await form('[data-new="lotes"]', { unidade: 'u3', tipo: 'Húmus de minhoca', inicio: dia(-90), qtd: '-5' })), 'Lote: quantidade negativa é recusada');
  ok(/número inteiro/.test(await form('[data-new="lotes"]', { unidade: 'u3', tipo: 'Húmus de minhoca', inicio: dia(-90), qtd: '100', dias: '2,5' })), 'Lote: dias quebrados são recusados');
  ok(await form('[data-new="lotes"]', { unidade: 'u3', tipo: 'Húmus de minhoca', inicio: dia(-90), dias: '60', qtd: '100', med: 'kg', status: 'Pronto', obs: 'Lote A (exemplo)' }) === '', 'Lote A (pronto, 100 kg) gravado');
  ok(await form('[data-new="lotes"]', { unidade: 'u3', tipo: 'Biofertilizante líquido', inicio: dia(-5), qtd: '50', status: 'Maturando', obs: 'Lote B (exemplo)' }) === '', 'Lote B (maturando) gravado');
  ok(await form('[data-new="lotes"]', { unidade: 'u3', tipo: 'Composto orgânico', inicio: dia(-200), dias: '30', qtd: '80', status: 'Maturando', obs: 'Lote C (exemplo)' }) === '', 'Lote C (maturando, passou da previsão) gravado');
  const LA = await idPor('lotes', 'obs', 'Lote A (exemplo)'), LB = await idPor('lotes', 'obs', 'Lote B (exemplo)'), LC = await idPor('lotes', 'obs', 'Lote C (exemplo)');
  { const d = await db(); ok(d.lotes.find(l => l.id === LA).codigo === 'APO-HUM-001' && d.lotes.find(l => l.id === LC).codigo === 'APO-CMP-001', 'Lote: código gerado pela sigla e pelo tipo'); }

  /* =================== unidades produtivas (Metas 3.3, 4 e 5) =================== */
  await aba('agricultores');
  ok(/Preencha “Nome/.test(await form('[data-new="agricultores"]', { comunidade: 'Sítio de exemplo' })), 'Unidade produtiva: nome obrigatório');
  ok(/número positivo/.test(await form('[data-new="agricultores"]', { nome: 'Pessoa Negativa (exemplo)', gasto0: '-10' })), 'Unidade produtiva: gasto da linha de base negativo é recusado');
  ok(/número positivo/.test(await form('[data-new="agricultores"]', { nome: 'Pessoa Letra (exemplo)', area: 'meio' })), 'Unidade produtiva: área não numérica é recusada');
  ok(/data da entrega do kit/.test(await form('[data-new="agricultores"]', { nome: 'Pessoa Sem Data (exemplo)', kit: 1 })), 'Meta 3 (kits): kit marcado sem data é recusado');
  const AG = [
    { nome: 'Agricultora Um (exemplo)', municipio: 'Apodi', uf: 'RN', diag: dia(-80), gasto0: '200', kit: 1, kitdata: dia(-30) },
    { nome: 'Agricultor Dois (exemplo)', municipio: 'Apodi', uf: 'RN', diag: dia(-80), gasto0: '150,50' },
    { nome: 'Agricultora Três (exemplo)', municipio: 'Apodi', uf: 'RN' },
    { nome: 'Agricultor Quatro (exemplo)', municipio: 'Apodi', uf: 'RN', diag: dia(-80), gasto0: '100', kit: 1, kitdata: dia(60) }];
  for (const a of AG) ok(await form('[data-new="agricultores"]', a) === '', 'Unidade produtiva gravada: ' + a.nome);
  const [A1, A2, A3, A4] = await Promise.all(AG.map(a => idPor('agricultores', 'nome', a.nome)));
  ok((await db()).agricultores.find(a => a.id === A2).gasto0 === 150.5, 'Número no padrão brasileiro (150,50) é gravado como 150,5');

  /* =================== distribuição =================== */
  await aba('distribuicoes');
  { await p.click('[data-new="distribuicoes"]'); await p.waitForSelector('#f_lote'); const ops = await p.$$eval('#f_lote option', o => o.map(x => x.value)); await fechar();
    ok(ops.includes(LA) && !ops.includes(LB) && !ops.includes(LC), 'Distribuição: só lote “Pronto” aparece para escolher (B e C maturando ficam de fora)'); }
  const DS = [[A1, 30, dia(-60)], [A1, 20, dia(-40)], [A2, 10, dia(-50)], [A4, 10, dia(-45)]];
  for (const [ag, q, d] of DS) ok(await form('[data-new="distribuicoes"]', { data: d, lote: LA, agricultor: ag, qtd: String(q), cultura: 'Hortaliças (exemplo)' }) === '', `Distribuição gravada: ${q} kg em ${dt(d)}`);
  ok(/só tem 30 kg de saldo/.test(await form('[data-new="distribuicoes"]', { data: dia(-10), lote: LA, agricultor: A3, qtd: '31' })), 'Distribuição: quantidade maior que o saldo (31 de 30) é recusada');
  ok(await p.evaluate(LA => SQC.regras.saldo(SQC.app._estado().db, SQC.app._estado().db.lotes.find(l => l.id === LA)), LA) === 30, 'Lote A: saldo = 100 − 70 = 30');
  ok(/anterior ao início do preparo/.test(await form('[data-new="distribuicoes"]', { data: dia(-100), lote: LA, agricultor: A3, qtd: '1' })), 'Distribuição: data antes do início do lote é recusada');
  ok(/no futuro/.test(await form('[data-new="distribuicoes"]', { data: dia(5), lote: LA, agricultor: A3, qtd: '1' })), 'Distribuição: data no futuro (+5 dias) é recusada');
  ok(/Informe a quantidade entregue/.test(await form('[data-new="distribuicoes"]', { data: dia(-10), lote: LA, agricultor: A3, qtd: '0' })), 'Distribuição: quantidade zero é recusada');
  ok(/número positivo/.test(await form('[data-new="distribuicoes"]', { data: dia(-10), lote: LA, agricultor: A3, qtd: 'dez' })), 'Distribuição: quantidade não numérica é recusada');
  ok(/Preencha “Unidade produtiva”/.test(await form('[data-new="distribuicoes"]', { data: dia(-10), lote: LA, qtd: '1' })), 'Distribuição: unidade produtiva obrigatória');
  await aba('lotes');
  ok(/não pode deixar de estar pronto/.test(await form(`[data-edit="lotes:${LA}"]`, { status: 'Maturando' })), 'Lote com distribuição não volta a “Maturando”');
  ok(/menor do que o já distribuído/.test(await form(`[data-edit="lotes:${LA}"]`, { qtd: '60' })), 'Lote: quantidade abaixo do já distribuído é recusada');

  /* =================== visitas (Meta 4 e indicadores da Meta 5) =================== */
  await aba('visitas');
  ok(/Preencha “Aplicou o bioinsumo recebido\?”/.test(await form('[data-new="visitas"]', { data: dia(-10), agricultor: A1 })), 'Visita: “Aplicou?” é obrigatório');
  ok(/número positivo/.test(await form('[data-new="visitas"]', { data: dia(-10), agricultor: A1, usou: 'Sim', gasto: 'abc' })), 'Visita: gasto não numérico é recusado');
  const VS = [[A1, dia(-50), 'Sim', '150'], [A1, dia(-10), 'Sim', '120'], [A1, dia(-5), 'Parcial', ''], [A2, dia(-55), 'Não', '100'], [A3, dia(-3), 'Sim', '50']];
  for (const [ag, d, u, g] of VS) ok(await form('[data-new="visitas"]', { data: d, agricultor: ag, usou: u, gasto: g, obs: 'Visita (exemplo)' }) === '', `Visita gravada em ${dt(d)}`);

  /* ---- Meta 4 (etapa 4.1): unidade acompanhada = recebeu bioinsumo e teve visita de monitoramento ---- */
  const acomp = id => p.evaluate(id => SQC.regras.acompanhada(SQC.app._estado().db, SQC.app._estado().db.agricultores.find(a => a.id === id)), id);
  ok(await acomp(A1), 'Meta 4: A1 (2 entregas, 3 visitas depois) está acompanhada');
  ok(!(await acomp(A3)), 'Meta 4: A3 (visita sem ter recebido bioinsumo) não está acompanhada');
  ok(!(await acomp(A4)), 'Meta 4: A4 (recebeu, sem visita) não está acompanhada');
  ok(!(await acomp(A2)), 'Meta 4: A2, cuja única visita (' + dt(dia(-55)) + ') é ANTERIOR à entrega (' + dt(dia(-50)) + '), não deveria contar como acompanhada', 'acompanhada() = ' + await acomp(A2));
  { await aba('painel'); const A = await p.$$eval('.at-lista li', l => l.map(x => x.textContent.replace(/\s+/g, ' ')));
    const avisaA2 = A.some(t => /Agricultor Dois \(exemplo\): recebeu bioinsumo/.test(t));
    ok(avisaA2, 'Avisos: A2 aparece como “recebeu bioinsumo e não teve visita depois”');
    ok(!(avisaA2 && await acomp(A2)), 'Meta 4: o aviso (sem visita depois da entrega) e a contagem (acompanhada) concordam sobre A2', 'o painel avisa que A2 não teve visita depois e ao mesmo tempo a conta como acompanhada');
    ok(!A.some(t => /Agricultora Um \(exemplo\): recebeu/.test(t)), 'Avisos: A1 (visitada depois da entrega) não aparece no aviso de monitoramento');
    ok(A.some(t => /Agricultor Quatro \(exemplo\): recebeu bioinsumo/.test(t)), 'Avisos: A4 (recebeu há 45 dias, sem visita) aparece no aviso de monitoramento'); }
  // a mesma unidade produtiva com várias entregas e visitas conta uma vez só
  { const d = await db(); const correto = d.agricultores.filter(a => { const r = d.distribuicoes.filter(x => x.agricultor === a.id).map(x => x.data).sort()[0]; return r && d.visitas.some(v => v.agricultor === a.id && v.data >= r); }).length;
    const f41 = await feito('4.1'), porPessoa = (await Promise.all([A1, A2, A3, A4].map(acomp))).filter(Boolean).length;
    ok(f41 === porPessoa && f41 < d.distribuicoes.length, 'Meta 4: A1 com 2 entregas e 3 visitas conta uma vez só na 4.1 (4.1 = nº de pessoas acompanhadas, não de entregas)', `4.1 = ${f41}, pessoas = ${porPessoa}`);
    ok(f41 === correto, `Meta 4: 4.1 = ${correto} (só A1: entrega e visita depois dela)`, '4.1 calculado pelo sistema = ' + f41); }

  /* ---- Meta 5: indicadores (linha de base x última visita) refeitos à mão ---- */
  const ind = () => p.evaluate(() => SQC.regras.indicadores(SQC.app._estado().db));
  { const d = await db(); const pares = d.agricultores.filter(a => a.diag && a.gasto0 !== '' && a.gasto0 != null).map(a => { const v = d.visitas.filter(x => x.agricultor === a.id && x.gasto !== '' && x.gasto != null).sort((x, y) => x.data < y.data ? 1 : -1)[0]; return v ? [+a.gasto0, +v.gasto] : null; }).filter(Boolean);
    const base = pares.reduce((s, c) => s + c[0], 0) / pares.length, atual = pares.reduce((s, c) => s + c[1], 0) / pares.length, varia = (atual - base) / base * 100;
    const I = await ind(); ok(pares.length === 2 && base === 175.25 && atual === 110, 'Meta 5 (à mão): pares A1 (200 → 120, a visita mais recente sem gasto é pulada) e A2 (150,50 → 100); base 175,25; atual 110');
    ok(I.pares === 2 && Math.abs(I.base - base) < 1e-9 && Math.abs(I.atual - atual) < 1e-9 && Math.abs(I.variacao - varia) < 1e-9, 'Meta 5: indicadores() bate com a conta à mão', JSON.stringify(I));
    await aba('painel'); const kv = await p.$$eval('.i5-p', bs => { const x = bs.find(b => /Indicadores para a avaliação/.test(b.textContent)); return [...x.querySelectorAll('.i5-v')].map(d => d.textContent.replace(/\s+/g, ' ').trim()); });
    ok(kv[0] === brl(175.25) + '/mês' && kv[1] === brl(110) + '/mês' && kv[2] === '-37%', 'Meta 5: Visão geral mostra R$ 175,25 → R$ 110,00 (−37%)', kv.join(' | '));
    const usou = d.visitas.filter(v => v.usou === 'Sim').length; ok(kv[3] === `${usou} de ${d.visitas.length}`, `Meta 5: visitas em que aplicou = ${usou} de ${d.visitas.length}`, kv[3]); }
  // visita com data no futuro: aceita? entra na contagem e no indicador?
  await aba('visitas');
  { const e = await form('[data-new="visitas"]', { data: dia(30), agricultor: A4, usou: 'Sim', gasto: '80', obs: 'Visita futura (exemplo)' });
    ok(e !== '', 'Visita: data no futuro (+30 dias) deveria ser recusada, como na distribuição', 'gravou sem aviso');
    if (!e) { ok(!(await acomp(A4)), 'Meta 4: visita com data futura não deveria tornar A4 acompanhada', 'A4 passou a contar');
      const I = await ind(); ok(I.pares === 2, 'Meta 5: visita com data futura não deveria entrar no indicador de gasto', `pares = ${I.pares}, atual = ${I.atual}`); } }

  /* =================== META 3: capacitações (3.2), kits (3.3) e META 5: dias de campo (5.1) =================== */
  await aba('eventos');
  ok(/Preencha “Tipo”/.test(await form('[data-new="eventos"]', { data: dia(-1), tema: 'Sem tipo (exemplo)' })), 'Atividade: tipo obrigatório');
  ok(/Preencha “Tema”/.test(await form('[data-new="eventos"]', { tipo: 'Capacitação', data: dia(-1) })), 'Atividade: tema obrigatório');
  ok(/mulheres não pode passar/.test(await form('[data-new="eventos"]', { tipo: 'Capacitação', data: dia(-1), tema: 'X (exemplo)', part: '5', mulheres: '10' })), 'Atividade: mulheres > participantes é recusado');
  ok(/números inteiros/.test(await form('[data-new="eventos"]', { tipo: 'Capacitação', data: dia(-1), tema: 'X (exemplo)', part: '2,5' })), 'Atividade: participantes quebrado é recusado');
  ok(/número positivo/.test(await form('[data-new="eventos"]', { tipo: 'Capacitação', data: dia(-1), tema: 'X (exemplo)', part: '-3' })), 'Atividade: participantes negativo é recusado');
  ok(/total de participantes antes/.test(await form('[data-new="eventos"]', { tipo: 'Capacitação', data: dia(-1), tema: 'X (exemplo)', mulheres: '3' })), 'Atividade: mulheres sem total é recusado');
  const EV = [['Capacitação', dia(-20), 'Capacitação em compostagem (exemplo)', '12', '7'], ['Dia de campo', dia(-15), 'Dia de campo realizado (exemplo)', '20', '15'], ['Reunião', dia(-3), 'Reunião da equipe (exemplo)', '5', '2']];
  for (const [t, d, tema, pa, mu] of EV) ok(await form('[data-new="eventos"]', { tipo: t, data: d, tema, part: pa, mulheres: mu }) === '', `Atividade realizada gravada: ${tema}`);
  ok(await feito('3.2') === 1 && await feito('5.1') === 1, 'Meta 3/5: 1 capacitação e 1 dia de campo realizados; reunião não conta');
  // 15/10/2026 (decisão da coordenação): data passada sem participantes não conta e vira aviso; com participantes, passa a contar
  ok(await form('[data-new="eventos"]', { tipo: 'Capacitação', data: dia(-5), tema: 'Capacitação sem registro (exemplo)' }) === '', 'Atividade com data passada e sem participantes é gravada');
  ok(await feito('3.2') === 1, 'Meta 3: capacitação passada sem participantes não conta na 3.2', '3.2 = ' + await feito('3.2'));
  ok(/sem participantes: não conta/.test(await p.textContent('#view')), 'Formação: a atividade sem participantes aparece marcada “sem participantes: não conta”');
  { await aba('painel'); const A = await p.$$eval('.at-lista li', l => l.map(x => x.textContent.replace(/\s+/g, ' ')));
    ok(A.some(t => /Capacitação sem registro \(exemplo\).*sem participantes registrados/.test(t)), 'Avisos: “sem participantes registrados” aparece em O que pede atenção'); await aba('eventos');
    const id = await idPor('eventos', 'tema', 'Capacitação sem registro (exemplo)');
    ok(await form(`[data-edit="eventos:${id}"]`, { part: '9', mulheres: '4' }) === '', 'Participantes informados depois');
    ok(await feito('3.2') === 2, 'Meta 3: com participantes, a capacitação passa a contar (3.2 = 2)', '3.2 = ' + await feito('3.2'));
    await form(`[data-edit="eventos:${id}"]`, { tipo: 'Reunião' }); }   // volta ao ponto de partida das contas abaixo (reunião não conta)
  // atividades planejadas (datas futuras): o formulário não tem situação (planejada/realizada/cancelada); só a data diz que ainda não aconteceu
  { await p.click('[data-new="eventos"]'); await p.waitForSelector('#f_tipo'); const ids = await p.$$eval('#frm input,#frm select,#frm textarea', l => l.map(x => x.id)); await fechar();
    nota('campos do formulário de atividade: ' + ids.join(', ') + ' (não há situação planejada/realizada/cancelada)'); }
  const PLAN = [['Capacitação', dia(1), 'Capacitação marcada para amanhã (exemplo)', '', ''], ['Capacitação', dia(30), 'Capacitação planejada (exemplo)', '', ''], ['Dia de campo', dia(10), 'Dia de campo planejado (exemplo)', '30', '20']];
  for (const [t, d, tema, pa, mu] of PLAN) ok(await form('[data-new="eventos"]', { tipo: t, data: d, tema, part: pa, mulheres: mu }) === '', `Atividade planejada gravada (data ${dt(d)}): ${tema}`);
  { const f32 = await feito('3.2'), f51 = await feito('5.1');
    ok(f32 === 1, 'Meta 3: capacitação de amanhã e de daqui a 30 dias não contam como realizadas na 3.2', '3.2 = ' + f32);
    ok(f51 === 1, 'Meta 5: dia de campo daqui a 10 dias não conta como realizado na 5.1', '5.1 = ' + f51);
    const I = await ind(); ok(I.participantes === 32 && I.mulheres === 22, 'Meta 5: participantes = 12 + 20 = 32 (22 mulheres), sem as estimativas das atividades futuras', `participantes = ${I.participantes}, mulheres = ${I.mulheres}`); }
  // lista de presença: nome repetido (maiúsculas, acento e espaços diferentes) não entra
  { const ev = await idPor('eventos', 'tema', 'Capacitação em compostagem (exemplo)'); await p.click(`[data-presenca="${ev}"]`); await p.waitForSelector('#pr_nome');
    await p.fill('#pr_nome', 'Participante Um (exemplo)'); await p.click('[data-pradd]'); await p.waitForFunction(() => (SQC.app._estado().db.presencas || []).length === 1 && /entrou na lista/.test(document.querySelector('#dlg').textContent));   // espera a lista redesenhar antes de digitar de novo
    await p.fill('#pr_nome', '  participante   UM (Exemplo) '); await p.click('[data-pradd]'); await p.waitForFunction(() => /já está nesta lista/.test(document.querySelector('#ferr').textContent));
    ok((await db()).presencas.length === 1, 'Meta 3: nome repetido na lista (caixa e espaços diferentes) é avisado e não grava');
    await p.keyboard.press('Escape'); await fechar(); }
  // kits (3.3): A1 com kit entregue há 30 dias; A4 com data de entrega daqui a 60 dias
  { const f33 = await feito('3.3'); ok(f33 === 1, 'Meta 3 (kits): kit com data de entrega no futuro (+60 dias) não deveria contar como distribuído', '3.3 = ' + f33); }

  /* =================== METAS 1, 5 (relatório) e 6: entregas do plano =================== */
  await aba('painel');
  { const s = await p.$$('.mts-l details.mt'); await s[0].evaluate(d => { d.open = true; }); await p.waitForSelector('[data-new="entregas"][data-pre="1.1"]');
    await p.click('[data-new="entregas"][data-pre="1.1"]'); await p.waitForSelector('#f_etapa', { state: 'attached' }); const ops = await p.$$eval('#f_etapa option', o => o.map(x => x.value)); await fechar();
    ok(['2.1', '3.2', '3.3', '4.1', '5.1'].every(x => !ops.includes(x)) && ['1.1', '5.2', '6.2'].every(x => ops.includes(x)), 'Entregas: etapas contadas sozinhas não aparecem para registro manual'); }
  ok(/Preencha “Título”/.test(await form('[data-new="entregas"][data-pre="1.1"]', { data: dia(-5) })), 'Meta 1: entrega sem título é recusada');
  ok(await form('[data-new="entregas"][data-pre="1.1"]', { titulo: 'Relatório do diagnóstico (exemplo)', data: dia(-5) }) === '', 'Meta 1: relatório de diagnóstico registrado pela Visão geral');
  ok(await feito('1.1') === 1, 'Meta 1: etapa 1.1 = 1 de 1');
  { const s = await p.$$('.mts-l details.mt'); await s[4].evaluate(d => { d.open = true; }); await p.waitForSelector('[data-new="entregas"][data-pre="5.2"]'); }
  ok(await form('[data-new="entregas"][data-pre="5.2"]', { titulo: 'Relatório de avaliação previsto (exemplo)', data: dia(90) }) === '' && await feito('5.2') === 0, 'Meta 5: relatório de avaliação com data futura (+90 dias) não deveria contar como entregue na 5.2', '5.2 = ' + await feito('5.2'));

  /* Meta 6: financeiro (o registro oficial é o da FUNCERN; aqui é o acompanhamento) */
  await aba('financeiro');
  ok(/número positivo/.test(await form('[data-new="despesas"]', { data: dia(-20), etapa: '1.1', rubrica: 'servicos_pj', descricao: 'Negativa (exemplo)', valor: '-100', status: 'Pago' })), 'Meta 6: despesa negativa é recusada');
  ok(/Preencha “Descrição”/.test(await form('[data-new="despesas"]', { data: dia(-20), etapa: '1.1', rubrica: 'servicos_pj', valor: '100', status: 'Pago' })), 'Meta 6: despesa sem descrição é recusada');
  ok(/outra rubrica/.test(await form('[data-new="despesas"]', { data: dia(-20), etapa: '1.1', rubrica: 'consumo', item: 'i09', descricao: 'Item trocado (exemplo)', valor: '100', status: 'Pago' })), 'Meta 6: item de outra rubrica é recusado');
  ok(await form('[data-new="despesas"]', { data: dia(-20), etapa: '1.1', rubrica: 'servicos_pj', descricao: 'Serviço de diagnóstico (exemplo)', valor: '1.000,00', status: 'Pago' }) === '', 'Meta 6: despesa paga de R$ 1.000,00 gravada');
  ok(await form('[data-new="despesas"]', { data: dia(-2), etapa: '1.1', rubrica: 'servicos_pj', descricao: 'Serviço recente (exemplo)', valor: '500', status: 'Solicitado' }) === '', 'Meta 6: despesa solicitada de R$ 500,00 gravada');
  { const F = await p.evaluate(() => SQC.regras.fin(SQC.app._estado().db)); ok(F[0].pago === 1000 && F[0].comp === 500 && F[0].saldo === 35000 - 1500, 'Meta 6: Meta 1 com R$ 1.000 pago, R$ 500 comprometido, saldo R$ 33.500'); }

  /* =================== Visão geral: cartões, cronograma e metas batem com feito() =================== */
  await aba('painel');
  { const d = await db(); const ETAPAS = await p.evaluate(() => SQC.dados.ETAPAS.map(e => ({ id: e.id, q: e.q })));
    const real = {}; for (const e of ETAPAS) real[e.id] = await feito(e.id);
    const kpis = await p.$$eval('.dx-topo .dx-kpis .dx-kpi', l => l.map(x => x.querySelector('.dx-kpi-n b').textContent.trim()));
    ok(kpis[0] === String(real['2.1']) && kpis[1] === String(real['4.1']) && kpis[2] === String(real['3.3']) && kpis[3] === String(real['3.2']), 'Visão geral: os 4 cartões (2.1, 4.1, 3.3, 3.2) mostram o mesmo número da conta das etapas', kpis.join(','));
    const gantt = await p.$$eval('.gantt .g-row', l => l.filter(r => r.querySelector('.g-lab .mono')).map(r => [r.querySelector('.g-lab .mono').textContent, r.querySelector('.g-n b').textContent]));
    ok(gantt.length === ETAPAS.length && gantt.every(([id, n]) => n === String(real[id])), 'Visão geral: cronograma mostra o realizado de cada etapa igual à conta');
    for (const s of await p.$$('.mts-l details.mt')) await s.evaluate(x => { x.open = true; });
    const mts = await p.$$eval('.mt-e > li', l => l.map(x => [x.querySelector('.mono').textContent, x.querySelector(':scope > b').textContent]));
    ok(mts.length === ETAPAS.length && mts.every(([id, t]) => t.startsWith(real[id] + ' de ')), 'Visão geral: lista de metas mostra o realizado de cada etapa igual à conta');
    // cartão de unidades produtivas = cartão da Visão geral
    await aba('agricultores'); const kp = await p.$$eval('.dx-kpis .dx-kpi .dx-kpi-n b', l => l.map(x => x.textContent.trim()));
    ok(kp[0] === String(d.agricultores.length) && kp[1] === String(d.agricultores.filter(a => a.diag).length) && kp[2] === String(real['3.3']) && kp[3] === String(real['4.1']), 'Unidades produtivas: cartões (cadastradas, com linha de base, kits, acompanhadas) batem com os registros', kp.join(','));
    const chip = await p.$$eval('.pcs .pc', l => l.map(x => [x.querySelector('.pc-n b').textContent, x.querySelector('.pc-n .chip').textContent]));
    ok(chip.find(c => /Agricultora Três/.test(c[0]))[1] === 'Sem linha de base', 'Unidades produtivas: A3 sem diagnóstico aparece como “Sem linha de base”');
    await aba('painel'); const A = await p.$$eval('.at-lista li', l => l.map(x => x.textContent.replace(/\s+/g, ' ')));
    ok(A.some(t => /1 unidade\(s\) produtiva\(s\) sem diagnóstico inicial/.test(t)), 'Avisos: 1 unidade produtiva sem linha de base (A3)');
    ok(A.some(t => /APO-CMP-001: passou da previsão/.test(t)) && !A.some(t => /APO-BIO-001: passou/.test(t)), 'Avisos: lote C passou da previsão; lote B (dentro do prazo) não'); }

  /* =================== Relatórios: período e totais =================== */
  await aba('relatorios');
  const DE = dia(-55), ATE = dia(-12);
  await p.fill('#rde', DE); await p.fill('#rate', ATE); await p.click('[data-rel]'); await p.waitForFunction(de => document.querySelector('.rel .rel-sup').textContent.includes(de), dt(DE));
  { const d = await db(); const no = s => s >= DE && s <= ATE;
    const sec = await p.$$eval('.rel section', ss => ss.map(s => ({ h: s.querySelector('h3').textContent, linhas: [...s.querySelectorAll('tbody tr')].map(tr => [...tr.children].map(td => td.textContent.trim())), txt: s.textContent.replace(/\s+/g, ' ') })));
    { const s2 = sec.find(s => /Unidades de produção/.test(s.h)), PASSOS = ['local_ok', 'parceiro_ok', 'termo', 'itens_ok', 'orcamento', 'entregue', 'montada', 'funcionando'];
      const n8 = d.unidades.filter(u => PASSOS.every(k => u[k]) && (!u.funcionando_em || u.funcionando_em <= ATE)).length;   // 15/10/2026: 8 passos e funcionando até a data final (26)
      ok(n8 === 2 && s2 && s2.txt.includes(`${n8} em funcionamento até ${dt(ATE)} (com os 8 passos) de ${d.unidades.length} cadastrada(s)`), `Relatório, seção 2: ${n8} em funcionamento até ${dt(ATE)} (8 passos e data) de ${d.unidades.length}`, s2 && s2.txt.slice(0, 160)); }
    const evP = d.eventos.filter(e => no(e.data)); ok(sec[2].linhas.length === evP.length && evP.length === 4 && !sec[2].txt.includes('Reunião da equipe') && !sec[2].txt.includes('planejad'), `Relatório: só as ${evP.length} atividades do período (2 da demonstração + capacitação e dia de campo; fora: reunião de ${dt(dia(-3))} e as futuras)`, sec[2].linhas.length + ' linhas');
    const tp = evP.reduce((s, e) => s + (+e.part || 0), 0), tm = evP.reduce((s, e) => s + (+e.mulheres || 0), 0);
    ok(tp === 34 && sec[2].txt.includes(`Total de ${tp} participações, ${Math.round(tm / tp * 100)}% de mulheres`), `Relatório: total de participações do período (2 + 12 + 20 = ${tp}; ${tm} mulheres)`);
    const diP = d.distribuicoes.filter(x => no(x.data)), ben = new Set(diP.map(x => x.agricultor)).size;
    ok(sec[4].linhas.length === diP.length && sec[4].txt.includes(`${diP.length} entrega(s) a ${ben} unidade(s) produtiva(s)`), `Relatório: ${diP.length} entregas a ${ben} unidades produtivas no período (a de ${dt(dia(-60))} fica fora)`);
    const viP = d.visitas.filter(v => no(v.data)); ok(sec[5].linhas.length === viP.length && viP.length === 2, `Relatório: ${viP.length} visitas no período`, sec[5].linhas.length + ' linhas');
    ok(sec[3].txt.includes('Sem registros no período'), 'Relatório: nenhum lote iniciado no período');
    const enP = d.entregas.filter(g => no(g.data)); ok(sec[6].linhas.length === enP.length && !sec[6].txt.includes('Relatório do diagnóstico'), `Relatório: entregas do período = ${enP.length} (a da Meta 1, de ${dt(dia(-5))}, fica fora)`, sec[6].linhas.length + ' linhas');
    ok(sec[9].linhas.length === 1 && sec[9].txt.includes('Serviço de diagnóstico'), 'Relatório: só a despesa do período (a de ' + dt(dia(-2)) + ' fica fora)');
    const m1 = sec[7].linhas[0]; ok(m1[2] === brl(0) && m1[3] === brl(1000), 'Relatório: financeiro acumulado até a data final (Meta 1: pago R$ 1.000, sem o comprometido posterior)', m1.join(' | '));
    // execução física "acumulada até a data final": o que aconteceu depois de ATE não deveria entrar
    const fis = Object.fromEntries(sec[0].linhas.map(l => [l[0], l[3]]));
    const esperado = { '1.1': d.entregas.filter(g => g.etapa === '1.1' && g.data <= ATE).length, '3.2': d.eventos.filter(e => e.tipo === 'Capacitação' && e.data <= ATE).length, '5.1': d.eventos.filter(e => e.tipo === 'Dia de campo' && e.data <= ATE).length };
    for (const id of Object.keys(esperado)) ok(fis[id] === String(esperado[id]), `Relatório: execução física acumulada até ${dt(ATE)} na etapa ${id} = ${esperado[id]}`, 'relatório mostra ' + fis[id]);
    const todos = {}; for (const id of Object.keys(fis)) todos[id] = String(await p.evaluate(([id, ate]) => SQC.regras.feito(SQC.app._estado().db, SQC.dados.ETAPAS.find(e => e.id === id), ate), [id, ATE]));
    ok(Object.keys(fis).every(id => fis[id] === todos[id]), 'Relatório: (consistência) seção 1 = a mesma conta da Visão geral, com a data final do período'); }

  /* =================== planilhas (.csv) batem com os registros =================== */
  await aba('dados');
  const baixarCsv = async m => { const [dl] = await Promise.all([p.waitForEvent('download'), p.click(`[data-exp="${m}"]`)]); const txt = fs.readFileSync(await dl.path(), 'utf8').replace(/^﻿/, '');
    return txt.split('\r\n').map(l => l.slice(1, -1).split('";"')); };
  { const d = await db();
    const ag = await baixarCsv('agricultores'); const hA = ag[0];
    ok(ag.length - 1 === d.agricultores.length, `CSV unidades produtivas: ${d.agricultores.length} linhas`);
    const lin2 = ag.find(l => l[0] === 'Agricultor Dois (exemplo)'); ok(lin2 && lin2[hA.indexOf('Gasto com insumos comprados (R$/mês)')] === '150,5', 'CSV unidades produtivas: gasto da linha de base 150,5 (vírgula)');
    const k = hA.indexOf('Kit de apoio entregue'); ok(ag.slice(1).filter(l => l[k] === 'Sim').length === d.agricultores.filter(a => a.kit).length && d.agricultores.filter(a => a.kit && a.kitdata <= dia(0)).length === await feito('3.3'), 'CSV unidades produtivas: kits “Sim” = cadastro; etapa 3.3 = os com data até hoje');
    const di = await baixarCsv('distribuicoes'); ok(di.length - 1 === d.distribuicoes.length && di.slice(1).reduce((s, l) => s + +l[di[0].indexOf('Quantidade')], 0) === 70, 'CSV distribuição: 4 entregas, 70 kg no total');
    const lo = await baixarCsv('lotes'); const la = lo.find(l => l[0] === 'APO-HUM-001'); ok(la && la[lo[0].indexOf('Saldo')] === '30', 'CSV lotes: saldo do lote A = 30');
    const vi = await baixarCsv('visitas'); ok(vi.length - 1 === d.visitas.length, `CSV visitas: ${d.visitas.length} linhas`);
    const ev = await baixarCsv('eventos'); const t = ev[0].indexOf('Tipo'); ok(ev.slice(1).filter(l => l[t] === 'Capacitação').length === d.eventos.filter(e => e.tipo === 'Capacitação').length, 'CSV atividades: mesmas capacitações do cadastro');
    ok(d.eventos.filter(e => e.tipo === 'Capacitação' && e.data <= dia(0)).length === await feito('3.2'), 'CSV atividades x etapa 3.2: (consistência) capacitações da planilha com data até hoje = realizado na etapa');
    const un = await baixarCsv('unidades'); const f = un[0].indexOf('Em funcionamento'), c = un[0].indexOf('Conta para a Meta 2 do TED?');
    ok(un.slice(1).filter(l => l[f] === 'Sim' && l[c] === 'Sim').length === await feito('2.1'), 'CSV biofábricas: “conta” e “em funcionamento” = etapa 2.1'); }

  /* =================== SEAB/MDA vê os mesmos números (sem nomes) =================== */
  const real = {}; for (const id of ['2.1', '4.1', '3.3', '3.2']) real[id] = await feito(id);
  await p.click('[data-sair]'); await p.click('[data-demo="Acompanhamento"]'); await p.waitForSelector('.dx-topo');
  { const kpis = await p.$$eval('.dx-topo .dx-kpis .dx-kpi .dx-kpi-n b', l => l.map(x => x.textContent.trim()));
    ok(kpis.join(',') === [real['2.1'], real['4.1'], real['3.3'], real['3.2']].join(','), 'SEAB/MDA: cartões da Visão geral iguais aos da coordenação', kpis.join(','));
    ok(!(await p.textContent('#view')).includes('Agricultora Um'), 'SEAB/MDA: nenhum nome de agricultor na Visão geral'); }
  ok(!erros.length, 'sem erro de script' + (erros.length ? ': ' + erros.join(' | ') : ''));

  /* =================== aviso de prazo vencido (relógio adiantado para depois do fim da etapa 2.1) =================== */
  { const { ctx, p: q, erros: e2 } = await novaPagina(b); await q.clock.setFixedTime(new Date('2027-02-10T12:00:00'));
    await q.goto(URL_); await q.click('[data-demo="Coordenação"]'); await q.waitForSelector('.dx-topo');
    const A = await q.$$eval('.at-lista li', l => l.map(x => x.textContent.replace(/\s+/g, ' ')));
    ok(A.some(t => /Etapa 2\.1 venceu em 01\/2027 com 0 de 2/.test(t)), 'Avisos: etapa 2.1 vencida em 01/2027 com 0 de 2 aparece como urgente');
    ok(!A.some(t => /Etapa 3\.2 venceu/.test(t)), 'Avisos: etapa 3.2 (vai até 04/2027) ainda não aparece como vencida');
    ok(!e2.length, 'sem erro de script (relógio adiantado)'); await ctx.close(); }

  await b.close();
  console.log(`\nRESUMO METAS: ${R_.ok} ok, ${R_.falhas.length} FALHOU`); R_.falhas.forEach(f => console.log('  - ' + f));
  process.exit(R_.falhas.length ? 1 : 0);
})().catch(e => { console.error('ERRO NO TESTE: ' + e.message); console.log(`RESUMO PARCIAL: ${R_.ok} ok, ${R_.falhas.length} FALHOU`); R_.falhas.forEach(f => console.log('  - ' + f)); process.exit(2); });
