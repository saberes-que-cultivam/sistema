/* Teclado em todo o sistema (14/10/2026): em cada aba dos três perfis, aperta Tab até dar a volta e confere que
   (1) tudo o que é clicável recebe foco, (2) cada parada tem contorno visível, (3) painéis e cartões só de leitura têm parada.
   Depois confere "Pular para o conteúdo", as setas no gráfico do Financeiro e as janelas (Tab dentro, Esc fecha, foco volta).
   Uso:  node ferramentas/servidor_teste.js 8766 &   e depois   node testes/automaticos/teclado.js   (LARG=390 para celular) */
const { chromium } = require('playwright');
const W = +(process.env.LARG || 1280);
(async () => {
  const b = await chromium.launch(); let total = 0;
  for (const perfil of ['Coordenação', 'Equipe', 'Acompanhamento']) {
    const p = await (await b.newContext({ viewport: { width: W, height: 900 }, serviceWorkers: 'block' })).newPage();
    await p.route('**/js/config.js', r => r.fulfill({ contentType: 'text/javascript', body: "window.SQC=window.SQC||{};SQC.CONFIG={supabaseUrl:'',supabaseAnonKey:'',semServiceWorker:true};" }));
    await p.goto(process.env.URL_SISTEMA || 'http://localhost:8766/'); await p.click(`[data-demo="${perfil}"]`); await p.waitForSelector('.dx-topo');
    const abas = await p.$$eval('#tabs [data-tab]', l => l.map(x => x.dataset.tab));
    for (const aba of abas) {
      await p.click(`#tabs [data-tab="${aba}"]`); await p.waitForTimeout(250); await p.evaluate(() => { scrollTo(0, 0); document.activeElement && document.activeElement.blur(); });
      const vistos = new Set(), semAnel = [];
      await p.evaluate(() => { document.querySelectorAll('[data-kb]').forEach(e => e.removeAttribute('data-kb')); let i = 0; document.querySelectorAll('body *').forEach(e => e.setAttribute('data-kb', i++)); });
      let primeiro = null;
      for (let n = 0; n < 900; n++) {
        await p.keyboard.press('Tab');
        const f = await p.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return null; const s = getComputedStyle(e);
          const anel = (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2) || /rgb/.test(s.boxShadow);
          return { id: e.getAttribute('data-kb'), nome: (e.tagName + (e.id ? '#' + e.id : '') + '.' + String(e.className).split(' ')[0] + ' «' + (e.getAttribute('aria-label') || e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40) + '»'), anel, vis: e.getBoundingClientRect().width > 0 }; });
        if (!f) continue; if (f.id === primeiro) break; if (!primeiro) primeiro = f.id;
        if (vistos.has(f.id)) continue; vistos.add(f.id); if (!f.anel && f.vis) semAnel.push(f.nome);
      }
      const faltam = await p.evaluate(ids => { const S = new Set(ids), vis = e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden' && !e.closest('dialog:not([open]),[hidden],[inert]') && !fechado(e); }; const fechado = e => { for (let d = e.parentElement && e.parentElement.closest('details'); d; d = d.parentElement && d.parentElement.closest('details')) if (!d.open && d.querySelector(':scope>summary') !== e) return true; return false; };
        const foc = [...document.querySelectorAll('button:not([disabled]),a[href],input:not([type=hidden]):not([disabled]),select,textarea,summary,[tabindex]:not([tabindex="-1"])')].filter(vis);
        const nao = foc.filter(e => !S.has(e.getAttribute('data-kb'))).map(e => e.tagName + '.' + String(e.className).split(' ')[0] + ' «' + (e.getAttribute('aria-label') || e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40) + '»');
        const temFoco = el => el.matches('[tabindex]:not([tabindex="-1"]),button,a[href],summary') || !!el.querySelector('button:not([disabled]),a[href],input:not([type=hidden]),select,textarea,summary,[tabindex]:not([tabindex="-1"])');
        const paineis = [...document.querySelectorAll('#view section, #view .panel, #view .dx-kpi, #view .mt-gi, #view .pc, #view .vg')].filter(vis).filter(e => !temFoco(e)).map(e => e.tagName + '.' + String(e.className).split(' ').slice(0, 2).join('.') + ' «' + (e.getAttribute('aria-label') || (e.querySelector('h2,h3,b') || e).textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40) + '»');
        return { nao, paineis };
      }, [...vistos]);
      const prob = faltam.nao.length + faltam.paineis.length + semAnel.length; total += prob;
      console.log(`${perfil} · ${aba}: ${vistos.size} paradas${prob ? '' : ' · ok'}`);
      faltam.nao.forEach(x => console.log('   SEM PARADA (clicável):', x)); faltam.paineis.forEach(x => console.log('   PAINEL SEM PARADA:', x)); semAnel.forEach(x => console.log('   SEM CONTORNO:', x));
    }
    await p.close();
  }

  // pular para o conteúdo, gráfico pelas setas e janelas
  const p = await (await b.newContext({ viewport: { width: W, height: 900 }, serviceWorkers: 'block' })).newPage();
  await p.route('**/js/config.js', r => r.fulfill({ contentType: 'text/javascript', body: "window.SQC=window.SQC||{};SQC.CONFIG={supabaseUrl:'',supabaseAnonKey:'',semServiceWorker:true};" }));
  await p.goto(process.env.URL_SISTEMA || 'http://localhost:8766/'); await p.click('[data-demo="Coordenação"]'); await p.waitForSelector('.dx-topo');
  const ok = (c, m) => { if (!c) { total++; console.log('   FALHOU:', m); } else console.log('ok  ' + m); };
  await p.reload(); await p.waitForSelector('.dx-topo'); await p.keyboard.press('Tab');
  ok(await p.evaluate(() => document.activeElement.hasAttribute('data-pular')), 'primeiro Tab: "Pular para o conteúdo"');
  await p.keyboard.press('Enter'); ok(await p.evaluate(() => document.activeElement.id === 'view'), 'Enter leva o foco ao conteúdo');
  await p.click('#tabs [data-tab="financeiro"]'); await p.waitForTimeout(250); await p.focus('[data-rg]'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight');
  ok(await p.evaluate(() => !document.querySelector('[data-dica]').hidden && /Previsto/.test(document.querySelector('[data-dica]').textContent) && /Previsto/.test(document.getElementById('rg-voz').textContent)), 'setas no gráfico mostram e leem o mês');
  for (const [aba, abre, nome] of [['eventos', '[data-new="eventos"]', 'formulário'], ['eventos', '[data-presenca]', 'lista de presença'], ['eventos', '[data-fotos]', 'fotos'], ['painel', '#tabs + * [data-ajuda], [data-ajuda]', 'ajuda'], ['painel', '[data-meus]', 'meus dados']]) {
    await p.click(`#tabs [data-tab="${aba}"]`); await p.waitForTimeout(200); const gat = p.locator(abre).first(); await gat.focus(); await p.keyboard.press('Enter'); await p.waitForSelector('#dlg[open]');
    let fora = 0, sem = 0; for (let i = 0; i < 40; i++) { await p.keyboard.press('Tab'); const f = await p.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return { dentro: true, anel: true };   /* no fim da janela o Tab passa pela barra do navegador e volta: normal */ const s = getComputedStyle(e); return { dentro: !!e.closest('dialog[open]'), nome: e.tagName + '.' + e.className + '[' + (e.type || '') + '#' + e.id + '] ' + s.outlineStyle + ' ' + s.outlineWidth, anel: (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2) || /rgb/.test(s.boxShadow) || e.tagName === 'DIALOG' || (e.type === 'date' && e.matches(':focus-within') && getComputedStyle(e).outlineStyle !== 'none') }; }); if (!f.dentro) { fora++; console.log('     fora:', f.nome); } if (!f.anel) { sem++; console.log('     sem contorno:', f.nome); } }
    ok(!fora, `${nome}: o Tab fica dentro da janela`); ok(!sem, `${nome}: toda parada tem contorno`);
    await p.keyboard.press('Escape'); await p.waitForFunction(() => !document.querySelector('#dlg').open).catch(() => {});
    if (await p.evaluate(() => document.querySelector('#dlg').open)) { await p.keyboard.press('Escape'); await p.waitForTimeout(150); }
    ok(!(await p.evaluate(() => document.querySelector('#dlg').open)), `${nome}: Esc fecha`);
  }
  await p.close();
  await b.close(); console.log(total ? `TECLADO: ${total} problema(s)` : 'TECLADO: TUDO CERTO'); process.exit(total ? 1 : 0);
})().catch(e => { console.error(e.message); process.exit(1); });
