/* Lista de presença, fotos de evidência e impressão em branco (12/10/2026), no modo demonstração.
   Uso:  node ferramentas/servidor_teste.js 8766 &   e depois   node testes/automaticos/evidencias.js
   As fotos de teste (testes/automaticos/dados) são imagens lisas, sem pessoa nenhuma. */
const { chromium } = require('playwright'); const path = require('path');
const URL_ = process.env.URL_SISTEMA || 'http://localhost:8766/';
const FOTO = n => path.join(__dirname, 'dados', n);
const ok = (c, m) => { if (!c) throw new Error('FALHOU: ' + m); console.log('ok  ' + m); };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', locale: 'pt-BR' });
  // impressão de mentira: guarda o que iria para o papel
  await ctx.addInitScript(() => { window.print = () => { window._impresso = document.getElementById('impresso').innerHTML; window._classe = document.body.className; window.dispatchEvent(new Event('afterprint')); }; });
  const p = await ctx.newPage(); const erros = []; p.on('pageerror', e => erros.push(String(e))); p.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  await p.route('**/js/config.js', r => r.fulfill({ contentType: 'text/javascript', body: "window.SQC=window.SQC||{};SQC.CONFIG={supabaseUrl:'',supabaseAnonKey:'',semServiceWorker:true};" }));
  await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ contentType: 'text/css', body: '' }));
  await p.goto(URL_); await p.click('[data-demo="Coordenação"]'); await p.waitForSelector('.dx-topo');
  const db = () => p.evaluate(() => SQC.app._estado().db);
  await p.click('[data-tab="eventos"]');
  ok(!!(await p.$('[data-presenca="e2"]')) && !!(await p.$('[data-fotos="eventos:e2"]')), 'atividade tem os botões Lista e Fotos');
  // lista de presença
  await p.click('[data-presenca="e2"]'); await p.waitForSelector('#pr_nome');
  await p.fill('#pr_nome', 'Participante Um (exemplo)'); await p.fill('#pr_com', 'Sítio Exemplo'); await p.check('#pr_mul'); await p.keyboard.press('Enter');
  await p.waitForFunction(() => (SQC.app._estado().db.presencas || []).length === 1 && /entrou na lista/.test((document.querySelector('#fok') || {}).textContent || ''));
  ok(await p.inputValue('#pr_com') === 'Sítio Exemplo' && await p.evaluate(() => document.activeElement.id) === 'pr_nome', 'Enter adiciona, repete a comunidade e volta ao campo do nome');
  await p.fill('#pr_nome', 'Participante Dois (exemplo)'); await p.click('[data-pradd]'); await p.waitForFunction(() => SQC.app._estado().db.presencas.length === 2);
  await p.fill('#pr_nome', 'Jo'); await p.click('[data-pradd]'); ok((await p.textContent('#ferr')).includes('nome'), 'nome curto demais é recusado');
  ok((await p.textContent('#frm')).includes('2 pessoas na lista, das quais 1 mulher'), 'contagem da lista com mulheres');
  await p.click('[data-prcontar]'); await p.waitForFunction(() => +SQC.app._estado().db.eventos.find(e => e.id === 'e2').part === 2);
  ok((await db()).eventos.find(e => e.id === 'e2').mulheres === 1, '“Usar o total da lista” atualiza participantes e mulheres da atividade');
  await p.click('[data-imprimirlista="e2"]'); const imp = await p.evaluate(() => window._impresso);
  ok(imp.includes('Lista de presença') && (imp.match(/<tr>/g) || []).length === 26 && imp.includes('Assinatura'), 'lista de presença em branco com 25 linhas e assinatura');
  ok(await p.evaluate(() => !document.body.classList.contains('imprimindo') && !document.getElementById('impresso').innerHTML), 'depois de imprimir a tela volta ao normal');
  const del = await p.$('[data-prdel]'); await del.click(); await del.click(); await p.waitForFunction(() => SQC.app._estado().db.presencas.length === 1);
  ok(true, 'lixeira tira da lista com dois toques');
  await p.keyboard.press('Escape');
  // fotos
  await p.click('[data-fotos="eventos:e2"]'); await p.waitForSelector('#ft_arq', { state: 'attached' });
  await p.setInputFiles('#ft_arq', FOTO('foto_2026-09-01.jpg')); await p.waitForFunction(() => /Esta foto é de/.test(document.querySelector('#ferr').textContent));
  ok((await p.textContent('#ferr')).includes('01/09/2026'), 'foto de outro dia é recusada, com a data dela');
  await p.fill('#ft_leg', 'Lista assinada (exemplo)'); await p.setInputFiles('#ft_arq', FOTO('foto_2026-09-08.jpg')); await p.waitForFunction(() => (SQC.app._estado().db.fotos || []).length === 1);
  await p.waitForSelector('.ft-i img'); ok((await p.textContent('#frm')).includes('tirada em 08/09/2026') && (await p.textContent('#frm')).includes('Lista assinada'), 'foto do dia entra com a data confirmada e a legenda');
  await p.setInputFiles('#ft_arq', FOTO('foto_sem_data.jpg')); await p.waitForFunction(() => SQC.app._estado().db.fotos.length === 2);
  ok((await p.textContent('#frm')).includes('data não confirmada'), 'foto sem data no arquivo entra marcada como “data não confirmada”');
  const f = (await db()).fotos[0]; ok(f.caminho === `eventos/e2/${f.id}.jpg`, 'caminho da foto segue a pasta da atividade');
  await p.keyboard.press('Escape');
  ok((await p.textContent('[data-fotos="eventos:e2"]')).includes('(2)') && (await p.textContent('[data-presenca="e2"]')).includes('(1)'), 'a tabela mostra quantas fotos e nomes a atividade tem');
  // atividade com lista e fotos não é excluída por engano
  const d = await p.$('[data-del="eventos:e2"]'); await d.click(); ok(/Em uso/.test(await d.textContent()), 'atividade com lista e fotos não é excluída');
  // excluir foto
  await p.click('[data-fotos="eventos:e2"]'); await p.waitForSelector('[data-fotodel]'); const fd = await p.$('[data-fotodel]'); await fd.click(); await fd.click();
  await p.waitForFunction(() => SQC.app._estado().db.fotos.length === 1); ok(true, 'foto excluída com dois toques'); await p.keyboard.press('Escape');
  // imprimir em branco
  await p.click('[data-tab="visitas"]'); await p.click('[data-new="visitas"]'); await p.click('[data-imprimir="visitas"]');
  const iv = await p.evaluate(() => window._impresso); ok(iv.includes('Visita') && iv.includes('Aplicado por') && !iv.includes('Maria das Dores'), 'visita em branco para o papel, sem dado de ninguém');
  await p.keyboard.press('Escape');
  // SEAB/MDA não vê lista nem fotos
  await p.click('[data-sair]'); await p.click('[data-demo="Acompanhamento"]'); await p.waitForSelector('.dx-topo'); await p.click('[data-tab="eventos"]');
  ok(!(await p.$('[data-presenca]')) && !(await p.$('[data-fotos]')) && !(await p.textContent('#view')).includes('Lista e fotos'), 'SEAB/MDA não vê a coluna Lista e fotos');
  ok((await db()).presencas.length === 0 && (await db()).fotos.length === 0, 'SEAB/MDA não recebe nomes nem fotos');
  ok(!erros.length, 'sem erro de script' + (erros.length ? ': ' + erros.join(' | ') : ''));
  await b.close(); console.log('EVIDÊNCIAS: TUDO CERTO');
})().catch(e => { console.error(e.message); process.exit(1); });
