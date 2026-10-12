/* Correções da auditoria de 12/10/2026, conferidas no navegador (modo demonstração).
   Uso:  node ferramentas/servidor_teste.js 8766 &   e depois   node testes/automaticos/auditoria_1210.js */
const { chromium } = require('playwright');
const URL_ = process.env.URL_SISTEMA || 'http://localhost:8766/';
const ok = (c, m) => { if (!c) throw new Error('FALHOU: ' + m); console.log('ok  ' + m); };
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block', locale: 'pt-BR' }); const p = await ctx.newPage();
  const erros = []; p.on('pageerror', e => erros.push(String(e))); p.on('console', m => { if (m.type() === 'error') erros.push(m.text()); });
  await p.route('**/js/config.js', r => r.fulfill({ contentType: 'text/javascript', body: "window.SQC=window.SQC||{};SQC.CONFIG={supabaseUrl:'',supabaseAnonKey:'',semServiceWorker:true};" }));
  await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ contentType: 'text/css', body: '' }));
  await p.goto(URL_); await p.click('[data-demo="Coordenação"]'); await p.waitForSelector('.dx-topo');
  const db = () => p.evaluate(() => SQC.app._estado().db);
  // valor com vírgula
  await p.click('[data-tab="financeiro"]'); await p.click('[data-new="despesas"]');
  ok(await p.getAttribute('#f_valor', 'type') === 'text' && await p.getAttribute('#f_valor', 'inputmode') === 'decimal', 'valor: campo de texto com teclado numérico');
  await p.fill('#f_descricao', 'Teste de vírgula'); await p.fill('#f_valor', '1.234,56');
  for (const s of await p.$$('#frm select[required]')) { if (!(await s.inputValue())) await s.selectOption({ index: 1 }); }
  await p.click('#fsalvar'); await p.waitForSelector('#dlg:not([open])', { state: 'attached' });
  ok((await db()).despesas.some(d => d.descricao === 'Teste de vírgula' && d.valor === 1234.56), 'valor “1.234,56” gravado como 1234,56');
  await p.click('[data-new="despesas"]'); await p.fill('#f_valor', '12x'); await p.fill('#f_descricao', 'Errado');
  for (const s of await p.$$('#frm select[required]')) { if (!(await s.inputValue())) await s.selectOption({ index: 1 }); }
  await p.click('#fsalvar'); ok((await p.textContent('#ferr')).includes('número'), 'valor que não é número é recusado com aviso');
  // fechar com alteração não salva pede confirmação
  await p.keyboard.press('Escape'); ok(await p.$('#dlg[open]') && (await p.textContent('#ferr')).includes('não foram salvas'), 'Esc com texto digitado avisa em vez de fechar');
  await p.keyboard.press('Escape'); await p.waitForSelector('#dlg:not([open])', { state: 'attached' }); ok(true, 'segundo Esc fecha');
  await p.click('[data-new="despesas"]'); await p.click('#dlg [data-fechar]'); ok(!(await p.$('#dlg[open]')), 'sem nada digitado, Cancelar fecha direto');
  // ações sempre à vista no celular
  await p.click('[data-tab="lotes"]');
  const vis = await p.evaluate(() => { const a = document.querySelector('.scroll td.a'); if (!a) return null; const r = a.getBoundingClientRect(); return r.right <= innerWidth + 1 && r.left >= 0; });
  ok(vis === true, 'Editar e Excluir à vista na tabela no celular');
  // cartões do financeiro e total com rótulo
  await p.click('[data-tab="financeiro"]'); const fin = await p.textContent('#view');
  ok(fin.includes('do recebido') && !/disponível do recebido[\s\S]{0,200}concluído/.test(fin), 'cartões do financeiro sem “concluído”');
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('.rb-tot span[data-r]'), '::before').content.includes('Previsto')), 'linha Total com rótulos no celular');
  // foco depois de gerar link de cadastro
  await p.click('[data-tab="equipe"]'); await p.click('[data-cadeq]');
  const gerar = await p.$('#frm button:has-text("link")'); if (gerar) { await gerar.click(); await p.waitForSelector('#lk_txt'); ok(await p.evaluate(() => document.activeElement && document.activeElement.closest('#dlg') !== null), 'foco fica na janela depois de gerar o link'); await p.click('#dlg [data-fechar]'); }
  // ficha da unidade produtiva abre com foco em Fechar
  await p.click('[data-tab="agricultores"]'); const f = await p.$('[data-ficha]');
  if (f) { await f.click(); await p.waitForSelector('#dlg[open]'); ok(await p.evaluate(() => document.activeElement.textContent.trim()) === 'Fechar', 'ficha abre com foco em Fechar, não em Excluir'); await p.keyboard.press('Escape'); }
  // relatório no plural
  await p.click('[data-tab="relatorios"]'); const rel = await p.textContent('#view');
  ok(rel.includes('5 capacitações') && rel.includes('30 unidades produtivas') && !rel.includes('5 capacitação'), 'relatório concorda no plural');
  // link de cadastro cortado
  const p2 = await ctx.newPage(); await p2.route('**/js/config.js', r => r.fulfill({ contentType: 'text/javascript', body: "window.SQC=window.SQC||{};SQC.CONFIG={supabaseUrl:'',supabaseAnonKey:'',semServiceWorker:true};" }));
  await p2.goto(URL_ + '#c=abc123'); await p2.waitForSelector('#pub:not([hidden])'); ok((await p2.textContent('#pub')).includes('incompleto'), 'link de cadastro cortado explica o que houve');
  ok(!erros.length, 'sem erro de script' + (erros.length ? ': ' + erros.join(' | ') : ''));
  await b.close(); console.log('AUDITORIA 12/10: CORREÇÕES CONFERIDAS');
})().catch(e => { console.error(e.message); process.exit(1); });
