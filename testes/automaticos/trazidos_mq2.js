/* Trazidos do Mulheres & Quintais v261 (12/10/2026): voltar à mesma aba, modo sol e "falta enviar".
   Uso:  node ferramentas/servidor_teste.js 8766 &   e depois   node testes/automaticos/trazidos_mq2.js */
const { chromium } = require('playwright');
const URL_ = process.env.URL_SISTEMA || 'http://localhost:8766/';
const ok = (c, m) => { if (!c) throw new Error('FALHOU: ' + m); console.log('ok  ' + m); };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', locale: 'pt-BR' }); const p = await ctx.newPage();
  const erros = []; p.on('pageerror', e => erros.push(String(e)));
  await p.route('**/js/config.js', r => r.fulfill({ contentType: 'text/javascript', body: "window.SQC=window.SQC||{};SQC.CONFIG={supabaseUrl:'',supabaseAnonKey:'',semServiceWorker:true};" }));
  await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ contentType: 'text/css', body: '' }));
  await p.goto(URL_); await p.waitForSelector('[data-demo]');
  // modo sol na tela de entrada
  await p.click('#auth [data-aparencia]'); await p.waitForSelector('#dlg[open] [data-ap-sol]');
  await p.click('[data-ap-sol]'); ok(await p.evaluate(() => document.documentElement.hasAttribute('data-sol') && document.documentElement.getAttribute('data-theme') === 'light'), 'modo sol liga e força a tela clara');
  ok(await p.evaluate(() => document.activeElement.matches('[data-ap-sol]')) && await p.getAttribute('[data-ap-sol]', 'aria-checked') === 'true', 'chave do modo sol mostra ligada e mantém o foco');
  ok(await p.isDisabled('[data-ap-tema="escuro"]'), 'com o modo sol ligado, o tema não muda');
  await p.click('#dlg [data-fechar]');
  ok(await p.evaluate(() => parseFloat(getComputedStyle(document.body).fontSize)) === 16, 'modo sol: letra um ponto maior');
  await p.reload(); await p.waitForSelector('[data-demo]'); ok(await p.evaluate(() => document.documentElement.hasAttribute('data-sol')), 'modo sol continua depois de recarregar');
  await p.click('#auth [data-aparencia]'); await p.click('[data-ap-sol]'); await p.click('[data-ap-tema="escuro"]');
  ok(await p.evaluate(() => !document.documentElement.hasAttribute('data-sol') && document.documentElement.getAttribute('data-theme') === 'dark'), 'tema escuro escolhido à mão');
  await p.click('[data-ap-tema="auto"]'); ok(await p.evaluate(() => !document.documentElement.hasAttribute('data-theme')), 'Automático volta a seguir o celular');
  await p.click('#dlg [data-fechar]');
  // falta enviar: a coordenação vê, a equipe não
  await p.click('[data-demo="Coordenação"]'); await p.waitForSelector('.fe');
  ok((await p.textContent('.fe')).includes('Equipe (demonstração)') && (await p.textContent('.fe')).includes('3 lançamentos guardados') && !!(await p.$('.fe li.velho')), 'coordenação vê quem tem lançamento parado há mais de 2 dias');
  // voltar à mesma aba
  await p.click('[data-tab="financeiro"]');
  await p.click('[data-sair]'); await p.waitForSelector('[data-demo]');
  await p.click('[data-demo="Coordenação"]'); await p.waitForSelector('#view .dx-topo');
  ok(await p.evaluate(() => SQC.app._estado().tab) === 'financeiro', 'a mesma pessoa volta à aba em que estava');
  // fechou a página (ou recarregou) no meio da tela: volta à mesma altura
  await p.evaluate(() => scrollTo(0, 600)); await p.waitForTimeout(100); await p.reload(); await p.waitForSelector('#view .dx-topo'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => SQC.app._estado().tab) === 'financeiro' && await p.evaluate(() => window.scrollY) > 300, 'ao reabrir a página volta à mesma aba e altura');
  await p.click('[data-tab="lotes"]'); await p.click('[data-sair]'); await p.waitForSelector('[data-demo]');
  await p.click('[data-demo="Equipe"]'); await p.waitForSelector('.dx-topo');
  ok(await p.evaluate(() => SQC.app._estado().tab) === 'painel', 'outra pessoa começa da Visão geral');
  ok(!(await p.$('.fe')), 'equipe não vê o “Falta enviar” dos outros');
  ok(!erros.length, 'sem erro de script' + (erros.length ? ': ' + erros.join(' | ') : ''));
  await b.close(); console.log('TRAZIDOS DO MULHERES & QUINTAIS (v261): CONFERIDOS');
})().catch(e => { console.error(e.message); process.exit(1); });
