/* Teste de fumaça no navegador (modo demonstração): entra com cada perfil, passa por todas as abas e faz um lançamento de ponta a ponta.
   Uso:  node ferramentas/servidor_teste.js 8766 &   e depois   node testes/automaticos/fumaca.js
   Precisa do Playwright (npm i playwright) — não faz parte do sistema, só do teste. CHROME=caminho usa um navegador já instalado. */
const { chromium } = require('playwright');
const URL_ = process.env.URL_SISTEMA || 'http://localhost:8766/';
const FOTOS = process.env.FOTOS || '';
const ok = (c, m) => { if (!c) throw new Error('FALHOU: ' + m); console.log('ok  ' + m); };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' }); const p = await ctx.newPage();
  const erros = []; p.on('console', m => { if (m.type() === 'error') erros.push(m.text()); }); p.on('pageerror', e => erros.push(String(e)));
  // config vazio = modo demonstração (o teste nunca toca no banco de verdade)
  await p.route('**/js/config.js', r => r.fulfill({ contentType: 'text/javascript', body: "window.SQC=window.SQC||{};SQC.CONFIG={supabaseUrl:'',supabaseAnonKey:'',semServiceWorker:true};" }));
  await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ contentType: 'text/css', body: '' }));
  await p.goto(URL_); await p.click('[data-demo="Equipe"]'); await p.waitForSelector('.stats');
  ok((await p.textContent('#quem')).includes('Equipe'), 'entra como Equipe');
  await p.click('[data-tab="financeiro"]'); ok(!(await p.$('[data-new="despesas"]')), 'Equipe não vê o botão de lançar despesa');
  await p.click('[data-tab="dados"]'); ok(!(await p.$('[data-new="pessoas"]')), 'Equipe não vê o cadastro de acessos');
  await p.click('[data-sair]'); await p.click('[data-demo="Coordenação"]'); await p.waitForFunction(() => document.querySelector('#quem').textContent.includes('Coordenação'));
  for (const t of ['unidades', 'lotes', 'agricultores', 'distribuicoes', 'visitas', 'eventos', 'entregas', 'financeiro', 'relatorios', 'dados', 'painel']) {
    await p.click(`[data-tab="${t}"]`); ok((await p.textContent('#view')).length > 80, 'aba ' + t + ' abre');
    if (FOTOS) await p.screenshot({ path: `${FOTOS}/${t}.png`, fullPage: true });
  }
  ok((await p.textContent('#view')).includes('R$ 400.000,00'), 'painel mostra o valor total do TED');
  // lote novo -> entrega acima do saldo é recusada -> entrega dentro do saldo passa
  await p.click('[data-tab="lotes"]'); await p.click('[data-new="lotes"]');
  await p.selectOption('#f_unidade', { index: 1 }); await p.selectOption('#f_tipo', 'Bokashi'); ok((await p.inputValue('#f_dias')) === '15', 'tipo do lote preenche os dias');
  await p.fill('#f_qtd', '20'); await p.selectOption('#f_status', 'Pronto'); await p.click('#fsalvar'); await p.waitForSelector('#dlg:not([open])', { state: 'attached' });
  ok((await p.textContent('#view')).includes('SPP-BOK-001'), 'código do lote gerado');
  await p.click('[data-tab="distribuicoes"]'); await p.click('[data-new="distribuicoes"]');
  const ops = await p.$$eval('#f_lote option', o => o.map(x => x.textContent)); ok(ops.some(x => x.includes('SPP-BOK-001')) && !ops.some(x => x.includes('Maturando')), 'só lote pronto aparece para entrega');
  await p.selectOption('#f_lote', { label: ops.find(x => x.includes('SPP-BOK-001')) }); await p.selectOption('#f_agricultor', { index: 1 }); await p.fill('#f_qtd', '21'); await p.click('#fsalvar');
  await p.waitForFunction(() => document.querySelector('#ferr').textContent.length > 0); ok((await p.textContent('#ferr')).includes('só tem 20 kg'), 'entrega acima do saldo é recusada');
  await p.fill('#f_qtd', '5'); await p.click('#fsalvar'); await p.waitForSelector('#dlg:not([open])', { state: 'attached' });
  await p.click('[data-tab="lotes"]'); ok(/SPP-BOK-001[\s\S]*15 kg/.test(await p.textContent('#view')), 'saldo do lote caiu para 15 kg');
  // despesa exige rubrica e aparece nas duas tabelas
  await p.click('[data-tab="financeiro"]'); await p.click('[data-new="despesas"]'); await p.fill('#f_descricao', 'Teste'); await p.fill('#f_valor', '9400'); await p.click('#fsalvar');
  await p.waitForFunction(() => document.querySelector('#ferr').textContent.length > 0); ok(/Rubrica/.test(await p.textContent('#ferr')), 'despesa sem rubrica é recusada');
  await p.selectOption('#f_rubrica', 'equipamentos'); await p.click('#fsalvar'); await p.waitForSelector('#dlg:not([open])', { state: 'attached' });
  await p.click('[data-tab="painel"]'); ok(/Máquinas e equipamentos: R\$ 100,00 acima/.test(await p.textContent('#view')), 'painel avisa rubrica estourada');
  if (FOTOS) { await p.screenshot({ path: `${FOTOS}/painel-final.png`, fullPage: true }); await p.setViewportSize({ width: 1280, height: 900 }); await p.screenshot({ path: `${FOTOS}/painel-largo.png`, fullPage: true }); await p.setViewportSize({ width: 390, height: 844 }); }
  ok(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'sem rolagem lateral no celular');
  ok(!erros.length, 'sem erro no console' + (erros.length ? ': ' + erros.join(' | ').slice(0, 600) : ''));
  await b.close(); console.log('FUMAÇA: TUDO CERTO');
})().catch(e => { console.error(String(e.message || e)); process.exit(1); });
