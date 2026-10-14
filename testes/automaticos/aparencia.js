/* Aparência: uma escolha só por aparelho — vale a última, feita na entrada ou dentro do sistema, em qualquer aba aberta.
   Uso: node ferramentas/servidor_teste.js 8766 &   e   NODE_PATH=$(npm root -g) node testes/automaticos/aparencia.js */
const { chromium } = require('playwright');
let f = 0; const ok = (c, m) => { if (c) console.log('ok  ' + m); else { f++; console.log('FALHOU: ' + m); } };
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });
  await ctx.route('**/js/config.js', r => r.fulfill({ contentType: 'text/javascript', body: "window.SQC=window.SQC||{};SQC.CONFIG={supabaseUrl:'',supabaseAnonKey:'',semServiceWorker:true};" }));
  const tema = p => p.evaluate(() => document.documentElement.getAttribute('data-theme'));
  const escolher = async (p, sel, t) => { await p.click(sel); await p.click(`[data-ap-tema="${t}"]`); await p.click('#frm [data-fechar]'); };
  const a = await ctx.newPage(); await a.goto(process.env.URL_SISTEMA || 'http://localhost:8766/');
  await escolher(a, '#ap_entrada', 'claro'); await a.click('[data-demo="Coordenação"]'); await a.waitForSelector('.dx-topo');
  ok(await tema(a) === 'light', 'claro escolhido na entrada vale dentro do sistema');
  await escolher(a, 'header [data-aparencia]', 'escuro'); await a.click('#sair, [data-sair]').catch(() => {});
  await a.evaluate(() => SQC.app && SQC.app.sair && SQC.app.sair()).catch(() => {}); await a.waitForTimeout(400);
  ok(await tema(a) === 'dark', 'escuro escolhido dentro vale na entrada depois de sair');
  const c = await ctx.newPage(); await c.goto(process.env.URL_SISTEMA || 'http://localhost:8766/'); await c.waitForSelector('#ap_entrada');
  await escolher(c, '#ap_entrada', 'claro'); await a.waitForTimeout(300);
  ok(await tema(a) === 'light' && await tema(c) === 'light', 'outra aba aberta acompanha a última escolha');
  await b.close(); console.log(f ? `\nAPARÊNCIA: ${f} FALHOU` : '\nAPARÊNCIA: TUDO CERTO'); process.exit(f ? 1 : 0);
})();
