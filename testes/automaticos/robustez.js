/* Robustez no navegador (modo demonstração + Supabase simulado): texto malicioso, duplo clique, validação, edição, exclusão,
   permissão por perfil e tela protegida sem login. Dados sempre fictícios.
   Uso:  node ferramentas/servidor_teste.js 8766 &   e depois   node testes/automaticos/robustez.js */
const { chromium } = require('playwright'); const path = require('path');
const URL_ = process.env.URL_SISTEMA || 'http://localhost:8766/';
const ok = (c, m) => { if (!c) throw new Error('FALHOU: ' + m); console.log('ok  ' + m); };
const X = '<img src=x onerror="window.__xss=1">', S = '<script>window.__xss=1</script>';
const DEMO = "window.SQC=window.SQC||{};SQC.CONFIG={supabaseUrl:'',supabaseAnonKey:'',semServiceWorker:true};";
const TODAS = ['painel', 'equipe', 'financeiro', 'unidades', 'lotes', 'distribuicoes', 'agricultores', 'visitas', 'eventos', 'relatorios', 'historico', 'dados'];
async function pagina(b, demo) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' }); const p = await ctx.newPage(); p.erros = [];
  p.on('pageerror', e => p.erros.push(String(e))); p.on('dialog', d => { p.erros.push('abriu diálogo do navegador: ' + d.message()); d.dismiss(); });
  await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ contentType: 'text/css', body: '' }));
  if (demo) await p.route('**/js/config.js', r => r.fulfill({ contentType: 'text/javascript', body: DEMO }));
  else await p.route(/supabase\.co\//, r => r.fulfill({ status: r.request().method() === 'OPTIONS' ? 204 : 200, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' }, contentType: 'application/json', body: '{}' }));
  return p;
}
const n = (p, t) => p.evaluate(t => SQC.app._estado().db[t].length, t);
const semXss = async (p, onde) => ok(!(await p.evaluate(() => window.__xss)) && !(await p.$('img[src="x"]')) && !(await p.$('#view script, #dlg script, svg[onload]')), 'texto malicioso não executa nem vira marcação: ' + onde);
const passear = async p => { for (const t of TODAS) if (await p.$(`[data-tab="${t}"]`)) { await p.click(`[data-tab="${t}"]`); await p.waitForTimeout(40); for (const d of await p.$$('#view details:not([open]) > summary')) await d.click().catch(() => {}); } };
const fechado = p => p.waitForSelector('#dlg:not([open])', { state: 'attached' });

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  try {
    /* ---------- 1. tela protegida sem login (Supabase simulado, sem sessão) ---------- */
    let p = await pagina(b, false); await p.goto(URL_ + '#financeiro'); await p.waitForSelector('#tab_entrar');
    ok(await p.isHidden('#app') && await p.isVisible('#auth'), 'sem login, o endereço de uma aba interna mostra só a tela de entrada');
    ok(await p.evaluate(() => !SQC.app._estado().db && !SQC.app._estado().eu), 'sem login, nenhum dado é carregado no navegador');
    ok(await p.evaluate(() => !Object.keys(localStorage).some(k => /sqc-dados|sqc-eu/.test(k) && localStorage.getItem(k))), 'sem login, nada do projeto fica guardado no aparelho');
    await p.context().close();

    /* ---------- 2. coordenação: validação, duplo clique, edição, exclusão ---------- */
    p = await pagina(b, true); await p.goto(URL_); await p.click('[data-demo="Coordenação"]'); await p.waitForSelector('.dx-topo');
    await p.click('[data-tab="lotes"]'); let antes = await n(p, 'lotes');
    await p.click('[data-new="lotes"]'); await p.click('#fsalvar'); ok((await p.textContent('#ferr')).trim().length > 5 && await n(p, 'lotes') === antes, 'campo obrigatório vazio: avisa e não grava');
    await p.selectOption('#f_unidade', { index: 1 }); await p.selectOption('#f_tipo', 'Bokashi'); await p.fill('#f_qtd', '-5'); await p.click('#fsalvar');
    ok(await n(p, 'lotes') === antes, 'quantidade negativa: não grava'); await p.fill('#f_qtd', '12.5');
    await p.fill('#f_responsavel', '   ' + X + ' Ação ç ã “aspas” \' ; -- '); await p.fill('#f_obs', S + 'A'.repeat(6000));
    await p.reload(); await p.waitForFunction(() => !document.querySelector('#app').hidden || !!document.querySelector('[data-demo]')); if (await p.$('[data-demo="Coordenação"]')) await p.click('[data-demo="Coordenação"]'); await p.waitForSelector('#app:not([hidden])'); ok(await n(p, 'lotes') === antes, 'recarregar a página no meio do preenchimento não grava nada');
    await p.click('[data-tab="lotes"]'); await p.click('[data-new="lotes"]'); await p.selectOption('#f_unidade', { index: 1 }); await p.selectOption('#f_tipo', 'Bokashi'); await p.fill('#f_qtd', '12.5'); await p.selectOption('#f_status', 'Pronto');
    await p.fill('#f_responsavel', '   ' + X + ' Ação ç ã “aspas” \' ; -- '); await p.fill('#f_obs', S + ' linha ' + 'A'.repeat(3000));
    await p.evaluate(() => { const s = document.querySelector('#fsalvar'); s.click(); s.click(); s.click(); }); await fechado(p);
    ok(await n(p, 'lotes') === antes + 1, 'três cliques seguidos em Salvar criam um registro só');
    let lote = await p.evaluate(() => SQC.app._estado().db.lotes.slice(-1)[0]);
    ok(lote.qtd === 12.5 && lote.responsavel.startsWith('<img') && !/^\s|\s$/.test(lote.responsavel), 'casas decimais, acentos e símbolos guardados como texto; espaços das pontas retirados');
    await semXss(p, 'lista de lotes'); await p.click(`[data-edit="lotes:${lote.id}"]`); await semXss(p, 'formulário de edição');
    await p.fill('#f_qtd', '20'); await p.click('#fsalvar'); await fechado(p); const dep = await p.evaluate(id => SQC.app._estado().db.lotes.find(l => l.id === id), lote.id);
    ok(dep.qtd === 20 && dep.responsavel === lote.responsavel && dep.obs === lote.obs && dep.codigo === lote.codigo && dep.tipo === lote.tipo, 'edição parcial: muda só o campo alterado e preserva o resto');
    // exclusão: pede confirmação; sair da tela cancela; confirmar remove; registro em uso não sai
    await p.click(`[data-del="lotes:${lote.id}"]`); ok(await n(p, 'lotes') === antes + 1 && (await p.textContent(`[data-del="lotes:${lote.id}"]`)).includes('Confirmar'), 'excluir: o primeiro toque só pede confirmação');
    await p.click('[data-tab="painel"]'); await p.click('[data-tab="lotes"]'); ok(await n(p, 'lotes') === antes + 1 && !(await p.textContent(`[data-del="lotes:${lote.id}"]`)).includes('Confirmar'), 'excluir: sair sem confirmar cancela');
    const usado = await p.evaluate(() => { const d = SQC.app._estado().db; return (d.lotes.find(l => d.distribuicoes.some(x => x.lote === l.id)) || {}).id; });
    if (usado) { await p.click(`[data-del="lotes:${usado}"]`); ok(await p.isDisabled(`[data-del="lotes:${usado}"]`) && await n(p, 'lotes') === antes + 1, 'excluir lote com entrega registrada: bloqueado (não deixa registro solto)'); }
    await p.click(`[data-del="lotes:${lote.id}"]`); await p.click(`[data-del="lotes:${lote.id}"]`); await p.waitForFunction(a => SQC.app._estado().db.lotes.length === a, antes);
    ok(!(await p.textContent('#view')).includes(lote.codigo), 'excluir confirmado: o registro some da lista');
    // entrega acima do saldo (regra de negócio) e datas
    await p.click('[data-tab="equipe"]'); await p.click('.vg-b'); await p.fill('#f_nome', X + S); await p.fill('#f_inicio', '2026-10-10'); await p.fill('#f_fim', '2026-10-01'); await p.check('#f_lgpd'); antes = await n(p, 'membros'); await p.click('#fsalvar');
    ok(await n(p, 'membros') === antes && /antes do início/.test(await p.textContent('#ferr')), 'desligamento antes do início: recusado'); await p.fill('#f_fim', ''); await p.uncheck('#f_lgpd'); await p.click('#fsalvar');
    ok(await n(p, 'membros') === antes, 'sem o registro de LGPD: não grava'); await p.check('#f_lgpd'); await p.click('#fsalvar'); await fechado(p); ok(await n(p, 'membros') === antes + 1, 'cadastro válido da equipe grava');
    await semXss(p, 'aba Equipe');
    /* ---------- 3. planilha com conteúdo malicioso e linhas inválidas ---------- */
    await p.click('[data-tab="financeiro"]'); antes = await n(p, 'despesas'); await p.setInputFiles('#imp_arq', path.join(__dirname, '..', 'unit', 'dados', 'solicitacoes_maliciosa.xlsx')); await p.waitForSelector('#dlg[open] [data-impok]');
    await semXss(p, 'prévia da importação'); ok((await p.textContent('#frm')).includes('não consegui ler (2)'), 'importação: valor negativo e data inválida ficam de fora, com aviso');
    ok(await p.isDisabled('[data-impok]'), 'importação: rubrica desconhecida e etapa em branco impedem gravar');
    for (const s of await p.$$('#frm select[data-imp-rb]')) await s.selectOption('consumo').catch(() => {});
    while (await p.$('#frm select[data-imp-rb]:has(option[value=""]:checked)')) await p.selectOption('#frm select[data-imp-rb]:has(option[value=""]:checked)', 'consumo');
    while (await p.$('#frm select[data-imp-et]:has(option[value=""]:checked)')) await p.selectOption('#frm select[data-imp-et]:has(option[value=""]:checked)', '6.1');
    await p.click('[data-impok]'); await fechado(p); ok(await n(p, 'despesas') === antes + 2, 'importação: as duas linhas válidas entram, como texto');
    await passear(p); await semXss(p, 'todas as abas, com tudo aberto'); await p.click('[data-tab="relatorios"]'); await semXss(p, 'relatório');
    ok(!p.erros.length, 'coordenação: sem erro de script' + (p.erros.length ? ': ' + p.erros.join(' | ') : ''));

    /* ---------- 4. permissão por perfil (na tela; a garantia é o banco, ver test_banco.sql) ---------- */
    await p.click('[data-sair]'); await p.click('[data-demo="Equipe"]'); await p.waitForFunction(q => !document.querySelector('#app').hidden && document.querySelector('#quem').textContent.length > 0); await p.click('[data-tab="painel"]');
    ok(!(await p.$('[data-tab="historico"]')), 'Equipe: não tem a aba Histórico');
    await p.click('[data-tab="financeiro"]'); ok(!(await p.$('#imp_arq')) && !(await p.$('[data-new="despesas"]')) && !(await p.$('[data-edit^="despesas"]')) && !(await p.$('[data-del^="despesas"]')), 'Equipe: não importa, não lança, não edita nem exclui despesa');
    await p.click('[data-tab="equipe"]'); ok(!(await p.$('[data-new="membros"]')) && !(await p.$('[data-edit^="membros"]')) && !(await p.$('.ae')), 'Equipe: vê a equipe, sem cadastrar nem ver o acompanhamento externo');
    await p.click('[data-tab="dados"]'); ok(!(await p.$('[data-new="pessoas"]')), 'Equipe: não cadastra acessos');
    const r1 = await p.evaluate(async () => { try { await SQC.apiDemo.salvar('despesas', { id: 'zz1', data: '2026-10-01', etapa: '6.1', rubrica: 'consumo', descricao: 'x', valor: 1, status: 'Pago' }); return 'gravou'; } catch (e) { return e.message; } });
    ok(/permissão/.test(r1), 'Equipe: chamar a gravação de despesa direto, por fora da tela, é recusado');
    await p.click('[data-sair]'); await p.click('[data-demo="Acompanhamento"]'); await p.waitForFunction(q => !document.querySelector('#app').hidden && document.querySelector('#quem').textContent.length > 0); await p.click('[data-tab="painel"]');
    let botoes = 0; for (const t of TODAS) if (await p.$(`[data-tab="${t}"]`)) { await p.click(`[data-tab="${t}"]`); botoes += await p.locator('#view [data-new], #view [data-edit], #view [data-del], #view #imp_arq').count(); }
    ok(botoes === 0, 'SEAB/MDA: nenhum botão de incluir, editar, excluir ou importar em aba nenhuma');
    ok(!(await p.$('[data-tab="equipe"]')) && !(await p.$('[data-tab="agricultores"]')) && !(await p.$('[data-tab="visitas"]')) && !(await p.$('[data-tab="historico"]')), 'SEAB/MDA: sem as abas Equipe, Unidades produtivas, Monitoramento e Histórico');
    const d = await p.evaluate(() => JSON.stringify(SQC.app._estado().db));
    ok(!/onerror|Agricultor[ao] de exemplo|"comunidade"|"tecnico"|"obs":"[^"]/.test(JSON.parse(d).agricultores.concat(JSON.parse(d).visitas).map(x => JSON.stringify(x)).join('')) && JSON.parse(d).membros.length === 0, 'SEAB/MDA: os dados que chegam ao navegador não têm nome de agricultor, texto de visita nem a equipe');
    const r2 = await p.evaluate(async () => { try { await SQC.apiDemo.salvar('lotes', { id: 'zz2', unidade: 'u1', tipo: 'Bokashi', inicio: '2026-10-01', dias: 15, qtd: 1, med: 'kg', status: 'Pronto' }); return 'gravou'; } catch (e) { return e.message; } });
    ok(/permissão/.test(r2), 'SEAB/MDA: chamar a gravação direto, por fora da tela, é recusado');
    ok(!p.erros.length, 'perfis: sem erro de script' + (p.erros.length ? ': ' + p.erros.join(' | ') : ''));
    console.log('\nROBUSTEZ: TUDO CERTO');
  } catch (e) { console.error(String(e.message || e)); process.exitCode = 1; }
  await b.close();
})();
