/* Tela de entrada só com o teclado (Tab, Shift+Tab, Enter, Espaço, setas), em 1440 e 390 px.
   O Supabase é simulado: nenhum pedido sai para o banco de verdade (as respostas são montadas aqui e os dados são fictícios).
   Uso:  node ferramentas/servidor_teste.js 8766 &   e depois   node testes/automaticos/entrada_teclado.js
   FOTOS=pasta guarda as imagens de cada parada do foco. */
const { chromium } = require('playwright');
const URL_ = process.env.URL_SISTEMA || 'http://localhost:8766/';
const FOTOS = process.env.FOTOS || '';
const ok = (c, m) => { if (!c) throw new Error('FALHOU: ' + m); console.log('ok  ' + m); };
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'access-control-expose-headers': '*' };
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
const EMAIL = 'pessoa.exemplo@exemplo.test', SENHA = 'senha-de-exemplo-1';   // fictícios
async function simularSupabase(p) {
  await p.route(/supabase\.co\//, async r => {
    const q = r.request(), u = q.url(), j = (s, o) => r.fulfill({ status: s, headers: CORS, contentType: 'application/json', body: JSON.stringify(o) });
    if (q.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: CORS });
    if (/auth\/v1\/token/.test(u)) {
      const c = JSON.parse(q.postData() || '{}');
      if (c.email !== EMAIL || c.password !== SENHA) return j(400, { code: 400, error_code: 'invalid_credentials', msg: 'Invalid login credentials' });
      const exp = Math.floor(Date.now() / 1000) + 3600, user = { id: '00000000-0000-4000-8000-000000000001', aud: 'authenticated', role: 'authenticated', email: EMAIL };
      return j(200, { access_token: b64({ alg: 'HS256', typ: 'JWT' }) + '.' + b64({ sub: user.id, exp, role: 'authenticated' }) + '.x', token_type: 'bearer', expires_in: 3600, expires_at: exp, refresh_token: 'r', user });
    }
    if (/rpc\/vincular_conta/.test(u)) return j(200, { id: 'p-exemplo', nome: 'Pessoa de Exemplo', email: EMAIL, perfil: 'Coordenação', ativo: true });
    if (/rest\/v1\//.test(u)) return j(200, []);
    return j(200, {});
  });
  await p.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ contentType: 'text/css', body: '' }));
  await p.route('**/js/config.js', async r => { const o = await r.fetch(); r.fulfill({ response: o, body: (await o.text()).replace('semServiceWorker: false', 'semServiceWorker: true') }); });
}
const foco = p => p.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return { nome: 'corpo' };
  const s = getComputedStyle(e), r = e.getBoundingClientRect();
  return { nome: e.id || (e.dataset.olho ? 'olho' : e.dataset.auth ? 'lk_' + e.dataset.auth : e.tagName.toLowerCase()), dentro: !!e.closest('#auth'), anel: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2, afast: parseFloat(s.outlineOffset), cor: s.outlineColor,
    visivel: r.width > 0 && r.height > 0 && r.top >= 0 && r.bottom <= innerHeight + 1 }; });
const caixa = p => p.evaluate(() => JSON.stringify(['.authbox', '#fauth', '#abotao', '#a_email'].map(s => { const r = document.querySelector(s).getBoundingClientRect(); return [r.x + scrollX, r.y + scrollY, r.width, r.height].map(Math.round); })));
const ORDEM = ['tab_entrar', 'tab_primeiro', 'a_email', 'a_senha', 'olho', 'abotao', 'lk_esqueci', 'summary'];

async function roteiro(b, largura, altura) {
  console.log(`\n== ${largura} × ${altura} ==`);
  const ctx = await b.newContext({ viewport: { width: largura, height: altura }, serviceWorkers: 'block' }); const p = await ctx.newPage();
  const erros = []; p.on('pageerror', e => erros.push(String(e)));
  await simularSupabase(p); await p.goto(URL_); await p.waitForSelector('#tab_entrar');
  const k = t => p.keyboard.press(t);
  // 1. ordem do Tab, anel visível em cada parada e nada muda de lugar
  const antes = await caixa(p), ida = [];
  for (let i = 0; i < ORDEM.length; i++) { await k('Tab'); const f = await foco(p); ida.push(f.nome);
    ok(f.anel && f.afast >= 2, `parada ${i + 1} (${f.nome}): anel de foco visível, ${f.afast}px afastado`); ok(f.visivel, `parada ${i + 1} fica dentro da tela`);
    ok((await caixa(p)) === antes, `parada ${i + 1}: o foco não desloca nada`);
    if (FOTOS) await p.screenshot({ path: `${FOTOS}/foco_${largura}_${i + 1}_${f.nome}.png` }); }
  ok(ida.join() === ORDEM.join(), 'ordem do Tab: ' + ida.join(' → '));
  await k('Tab'); ok(!(await foco(p)).dentro, 'depois da última parada o foco sai da tela de entrada (não fica preso)');
  // 2. Shift+Tab volta na ordem inversa
  const volta = []; for (let i = 0; i < ORDEM.length; i++) { await k('Shift+Tab'); volta.push((await foco(p)).nome); }
  ok(volta.join() === ORDEM.slice().reverse().join(), 'Shift+Tab volta na ordem inversa');
  // 3. seletor: setas trocam, foco e seleção são coisas diferentes
  await k('ArrowRight'); let f = await foco(p);
  ok(f.nome === 'tab_primeiro' && await p.getAttribute('#tab_primeiro', 'aria-selected') === 'true' && !(await p.$('#a_senha')), 'seta para a direita: “Primeiro acesso” selecionado, painel só com o e-mail');
  
  await k('ArrowLeft'); ok((await foco(p)).nome === 'tab_entrar' && !!(await p.$('#a_senha')), 'seta para a esquerda volta para “Já tenho senha”');
  await k('End'); await k('Home'); ok(await p.getAttribute('#tab_entrar', 'aria-selected') === 'true', 'Home e End funcionam no seletor');
  await k('Tab'); ok((await foco(p)).nome === 'tab_primeiro', 'Tab chega em “Primeiro acesso”'); await k('Enter'); ok(await p.getAttribute('#tab_primeiro', 'aria-selected') === 'true' && !(await p.$('#a_senha')) && (await foco(p)).nome === 'tab_primeiro', 'Enter em “Primeiro acesso” abre essa opção');
  await k('Shift+Tab'); await k('Space'); ok(await p.getAttribute('#tab_entrar', 'aria-selected') === 'true', 'Espaço em “Já tenho senha” volta');
  // 4. Enter com tudo vazio: erro em cada campo, com texto, e o foco vai ao primeiro
  await k('Tab'); await k('Tab'); await k('Enter'); f = await foco(p);
  ok(f.nome === 'a_email', 'Enter com campos vazios: foco no primeiro campo com erro');
  for (const id of ['a_email', 'a_senha']) { ok(await p.getAttribute('#' + id, 'aria-invalid') === 'true' && await p.getAttribute('#' + id, 'aria-describedby') === 'e_' + id, id + ': aria-invalid e aria-describedby');
    ok((await p.textContent('#e_' + id)).trim().length > 5 && !!(await p.$(`#e_${id} svg`)), id + ': erro com texto e ícone (não só cor)'); }
  if (FOTOS) await p.screenshot({ path: `${FOTOS}/erro_${largura}.png`, fullPage: true });
  // 5. mostrar/ocultar senha com Espaço e Enter
  await p.keyboard.type(EMAIL); ok(!(await p.getAttribute('#a_email', 'aria-invalid')), 'digitar limpa o erro do campo');
  await k('Tab'); await p.keyboard.type('senha-errada'); await k('Tab'); await k('Space');
  ok(await p.getAttribute('#a_senha', 'type') === 'text' && await p.getAttribute('.cp-olho', 'aria-pressed') === 'true' && await p.getAttribute('.cp-olho', 'aria-label') === 'Ocultar senha', 'Espaço mostra a senha (estado e nome do botão mudam)');
  await k('Enter'); ok(await p.getAttribute('#a_senha', 'type') === 'password' && (await foco(p)).nome === 'olho', 'Enter oculta de novo e o foco fica no botão');
  // 6. senha errada: aviso com texto, anunciado, sem perder o foco
  await k('Tab'); ok((await foco(p)).nome === 'abotao', 'Tab chega ao botão Entrar'); await k('Enter'); await p.waitForSelector('#aerr:not([hidden])');
  ok((await p.textContent('#aerr')).trim().length > 10 && await p.getAttribute('#aerr', 'role') === 'alert', 'senha errada: aviso em texto com role=alert: “' + (await p.textContent('#aerr')).trim() + '”');
  f = await foco(p); ok(f.dentro && f.nome !== 'corpo', 'depois do erro o foco continua na tela (' + f.nome + ')');
  // 7. ajuda e "Esqueci a senha"
  await p.focus('#abotao'); await k('Tab'); await k('Tab'); await k('Space'); ok(await p.evaluate(() => document.querySelector('.ent-aj').open), 'Espaço abre a ajuda');
  await k('Enter'); ok(!(await p.evaluate(() => document.querySelector('.ent-aj').open)), 'Enter fecha a ajuda');
  await k('Shift+Tab'); await k('Enter'); ok((await foco(p)).nome === 'a_email' && !(await p.$('.sg')), '“Esqueci a senha” com Enter: abre o pedido e o foco vai para o e-mail');
  await k('Tab'); await k('Tab'); ok((await foco(p)).nome === 'lk_entrar', 'Tab chega em “Voltar para a entrada”'); await k('Enter');
  ok((await foco(p)).nome === 'tab_entrar', 'voltar devolve o foco ao seletor');
  // 8. entrada completa só com o teclado
  await k('Tab'); await k('Tab'); await p.keyboard.type(EMAIL); await k('Tab'); await p.keyboard.type(SENHA); await k('Enter');
  await p.waitForSelector('#app:not([hidden])'); ok(await p.evaluate(() => document.querySelector('#auth').hidden), 'ENTRADA CONCLUÍDA só com o teclado');
  ok(!erros.length, 'sem erro de script' + (erros.length ? ': ' + erros.join(' | ') : ''));
  await ctx.close();
}
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  try { await roteiro(b, 1440, 900); await roteiro(b, 390, 844); console.log('\nTeclado: tudo certo.'); }
  catch (e) { console.error(String(e.message || e)); process.exitCode = 1; }
  await b.close();
})();
