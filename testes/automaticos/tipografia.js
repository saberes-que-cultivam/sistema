/* Conferência do padrão tipográfico em 390 px e em 1440 px, medindo o que o navegador desenhou (não o que o CSS diz).
   Confere em todas as abas, na entrada e nas janelas: tamanho fora da escala, texto menor que 12 px, texto cortado,
   fonte que não é Manrope (fora a marca, em Lora), itálico, maiúsculas fora do sobretítulo e de cabeçalho de tabela, e contraste abaixo de 4,5:1.
   Uso:  node ferramentas/servidor_teste.js 8766 &   e depois   node testes/automaticos/tipografia.js
   FONTES=pasta com node_modules/@fontsource (opcional) carrega as fontes de verdade; sem isso mede com a fonte de reserva.
   ESCURO=1 confere o modo escuro. */
const { chromium } = require('playwright'); const fs = require('fs');
const URL_ = process.env.URL_SISTEMA || 'http://localhost:8766/', FOTOS = process.env.FOTOS || '';
let cssFontes = '';
if (process.env.FONTES) { const B = process.env.FONTES + '/node_modules/@fontsource/', f = p => 'data:font/woff2;base64,' + fs.readFileSync(B + p).toString('base64');
  cssFontes = [600, 700].map(w => `@font-face{font-family:"Lora";font-weight:${w};src:url(${f(`lora/files/lora-latin-${w}-normal.woff2`)})}`).concat([400, 500, 600, 700, 800].map(w => `@font-face{font-family:"Manrope";font-weight:${w};src:url(${f(`manrope/files/manrope-latin-${w}-normal.woff2`)})}`)).join('\n'); }
const medir = () => {
  const ESCALA = [12, 13, 14, 15, 16, 18, 22, 28], prob = [], tons = {}, vw = window.innerWidth;
  const cor = s => { let m = s.match(/rgba?\(([^)]+)\)/); if (m) { const p = m[1].split(/[ ,/]+/).map(Number); return [p[0], p[1], p[2], p[3] == null ? 1 : p[3]]; } m = s.match(/color\(srgb ([^)]+)\)/); if (m) { const p = m[1].split(/[ /]+/).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p[3] == null ? 1 : p[3]]; } return null; };
  const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const fundo = el => { for (let e = el; e; e = e.parentElement) { const st = getComputedStyle(e), c = cor(st.backgroundColor); if (c && c[3] > 0.98) return c; if (st.backgroundImage !== 'none' && e !== el) return null; } return [255, 255, 255, 1]; };
  const quem = el => (el.tagName.toLowerCase() + (el.className && el.className.baseVal === undefined && el.className ? '.' + String(el.className).trim().split(/\s+/).join('.') : '') + ' "' + (el.textContent || '').trim().slice(0, 28) + '"');
  const raiz = document.querySelector('dialog[open]') || document.body;
  raiz.querySelectorAll('*').forEach(el => {
    if (['SCRIPT', 'STYLE', 'OPTION', 'TITLE', 'NOSCRIPT'].includes(el.tagName.toUpperCase())) return;
    const proprio = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()); if (!proprio && !['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName)) return;
    const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return; const st = getComputedStyle(el); if (st.visibility === 'hidden' || st.display === 'none' || +st.opacity === 0) return;
    if (el.closest('[hidden]') || (raiz === document.body && el.closest('dialog'))) return;
    let px = parseFloat(st.fontSize); const sv = el.closest('svg'); if (sv && sv.viewBox && sv.viewBox.baseVal.width) px = px * sv.getBoundingClientRect().width / sv.viewBox.baseVal.width;
    const naEscala = ESCALA.some(v => Math.abs(v - px) < 0.35) || (el.closest('h1') && px >= 25.7 && px <= 34.3);
    if (px < 11.7) prob.push('MENOR QUE 12: ' + px.toFixed(1) + 'px ' + quem(el)); else if (!naEscala) prob.push('FORA DA ESCALA: ' + px.toFixed(1) + 'px ' + quem(el));
    const fam = st.fontFamily.split(',')[0].replace(/["']/g, '').trim(), marca = el.matches('.marca-nome, .ent-marca b, .pe-m b');
    if (marca ? fam !== 'Lora' : fam !== 'Manrope') prob.push('FONTE ' + fam + ': ' + quem(el));
    if (st.fontStyle === 'italic') prob.push('ITÁLICO: ' + quem(el));
    if (st.textTransform === 'uppercase' && !el.matches('th, .eyebrow, .fm-eye, .rb-h span, .at-col span')) prob.push('MAIÚSCULAS: ' + quem(el));
    // cortado: conteúdo maior que a caixa numa caixa que esconde o excesso, ou texto saindo pela direita da tela
    if (!sv && el.scrollWidth > el.clientWidth + 1 && ['hidden', 'clip'].includes(st.overflowX) && !['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) prob.push('CORTADO: ' + quem(el));
    const rolavel = (() => { for (let e = el.parentElement; e; e = e.parentElement) { const o = getComputedStyle(e).overflowX; if (o === 'auto' || o === 'scroll') return true; } return false; })();
    if (!rolavel && !el.closest('nav') && r.right > vw + 1 && r.left < vw) prob.push('SAI DA TELA: ' + quem(el));
    if (sv) { const q = sv.getBoundingClientRect(); if (r.left < q.left - 1 || r.right > q.right + 1 || r.top < q.top - 1 || r.bottom > q.bottom + 1) prob.push('CORTADO NO DESENHO: ' + quem(el)); }
    // contraste
    const c = cor(st.color), b = fundo(el); if (c && b && !sv) { const a = lum(c), d = lum(b), k = (Math.max(a, d) + 0.05) / (Math.min(a, d) + 0.05); const chave = st.color; tons[chave] = (tons[chave] || 0) + 1;
      if (k < 4.5 && !el.matches(':disabled, [disabled], ::placeholder')) prob.push('CONTRASTE ' + k.toFixed(2) + ': ' + quem(el)); }
  });
  return { prob: [...new Set(prob)], tons: Object.keys(tons).length };
};
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined }); let total = 0; const visto = new Set();
  for (const larg of [390, 1440]) {
    const ctx = await b.newContext({ viewport: { width: larg, height: 900 }, serviceWorkers: 'block', colorScheme: process.env.ESCURO ? 'dark' : 'light' });
    await ctx.route(/fonts\.googleapis\.com/, r => r.fulfill({ contentType: 'text/css', body: cssFontes })); await ctx.route(/supabase\.co/, r => r.abort());
    const rel = async (p, onde) => { await p.waitForTimeout(250); await p.evaluate(() => document.fonts.ready); const m = await p.evaluate(medir); m.prob.forEach(x => { const k = larg + ' ' + x; if (!visto.has(k)) { visto.add(k); total++; console.log(`[${larg}px · ${onde}] ${x}`); } }); if (FOTOS) await p.screenshot({ path: `${FOTOS}/tipo-${larg}-${onde.replace(/\W+/g, '_')}.png`, fullPage: !(await p.$('dialog[open]')) }); };
    // entrada de verdade (configuração do projeto, sem falar com o servidor)
    const e = await ctx.newPage(); await e.goto(URL_); await e.waitForSelector('#fauth'); await rel(e, 'entrada'); await e.click('[data-auth="primeiro"]'); await rel(e, 'primeiro acesso'); await e.close();
    // sistema em modo demonstração
    const p = await ctx.newPage(); await p.route('**/js/config.js', r => r.fulfill({ contentType: 'text/javascript', body: "window.SQC=window.SQC||{};SQC.CONFIG={supabaseUrl:'',semServiceWorker:true};" }));
    await p.goto(URL_); await p.evaluate(() => { localStorage.clear(); }); await p.reload(); await p.click('[data-demo="Coordenação"]'); await p.waitForSelector('.dx-topo');
    for (const t of ['painel', 'unidades', 'lotes', 'agricultores', 'distribuicoes', 'visitas', 'eventos', 'entregas', 'financeiro', 'relatorios', 'dados']) { await p.click(`[data-tab="${t}"]`); if (t === 'financeiro') await p.click('[data-abrir-rub]'); await rel(p, 'aba ' + t); }
    await p.click('[data-tab="agricultores"]'); await p.click('[data-new="agricultores"]'); await rel(p, 'formulário'); await p.click('#fsalvar'); await rel(p, 'formulário com erro'); await p.click('[data-fechar]');
    await p.click('.pc [data-ficha]'); await rel(p, 'ficha'); await p.click('[data-fechar]');
    await p.click('[data-ajuda]'); await rel(p, 'ajuda'); await p.click('[data-fechar]'); await p.click('[data-relatar]'); await rel(p, 'relato'); await p.click('[data-fechar]');
    await p.click('[data-sair]'); await p.click('[data-demo="Acompanhamento"]'); await p.waitForSelector('.dx-topo'); await p.click('[data-tab="painel"]'); await rel(p, 'painel SEAB-MDA'); await p.click('[data-tab="dados"]'); await rel(p, 'dados SEAB-MDA');
    await ctx.close();
  }
  await b.close(); if (total) { console.error(`TIPOGRAFIA: ${total} problema(s)`); process.exit(1); } console.log('TIPOGRAFIA: TUDO CERTO em 390 px e 1440 px (escala, mínimo de 12 px, corte, fonte, itálico, maiúsculas e contraste)');
})().catch(e => { console.error(String(e.message || e)); process.exit(1); });
