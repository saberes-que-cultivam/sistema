/* Acessibilidade (WCAG 2.2 AA) — 14/10/2026.
   1. axe-core (wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa e best-practice) em: entrada (normal, "Esqueci a senha", "Primeiro acesso",
      painel de ajuda), todas as abas dos três perfis e as janelas (nova atividade, lista de presença, fotos, ajuda, meus dados, aparência),
      em 1280 e 390 px, nos modos claro, escuro e sol.
   2. Conferências que o axe não faz sozinho: títulos (um h1, sem pular nível), nome acessível de todo controle (e o texto visível dentro
      do nome, 2.5.3), alvo de 24 × 24 px (2.5.8), mensagens em role=status/alert (4.1.3), gráficos e mapas com texto (1.1.1),
      320 px sem rolagem lateral (1.4.10), espaçamento de texto (1.4.12) sem cortar nem sobrepor, e foco não escondido pelo
      cabeçalho ou rodapé fixos (2.4.11).
   Uso:  node ferramentas/servidor_teste.js 8766 &   e depois   node testes/automaticos/acessibilidade.js
   Precisa do Playwright e do axe-core (não fazem parte do sistema):  npm i axe-core  numa pasta qualquer e  AXE=<pasta>/node_modules/axe-core/axe.min.js
   RAPIDO=1 roda o axe só no modo claro. TUDO=1 lista todos os casos (não só os primeiros). FOTOS=pasta guarda as telas com problema de foco. */
const { chromium } = require('playwright'); const fs = require('fs');
const URL_ = process.env.URL_SISTEMA || 'http://localhost:8766/';
const AXE = process.env.AXE || (() => { try { return require.resolve('axe-core/axe.min.js'); } catch (e) { return require('path').join(__dirname, '../../node_modules/axe-core/axe.min.js'); } })();
if (!fs.existsSync(AXE)) { console.error('FALHOU: axe-core não encontrado em ' + AXE + ' (use AXE=caminho/axe.min.js)'); process.exit(1); }
const DEMO = "window.SQC=window.SQC||{};SQC.CONFIG={supabaseUrl:'',supabaseAnonKey:'',semServiceWorker:true};";
const ENTRADA = "window.SQC=window.SQC||{};SQC.CONFIG={supabaseUrl:'https://exemplo.invalid',supabaseAnonKey:'exemplo',semServiceWorker:true};";
const MODOS = process.env.RAPIDO ? ['claro'] : ['claro', 'escuro', 'sol'];
let falhas = 0, oks = 0; const ok = (c, m, det) => { if (c) { oks++; console.log('ok  ' + m); } else { falhas++; console.log('FALHOU: ' + m + (det ? '\n      ' + det : '')); } };

async function contexto(b, larg, modo) {
  const ctx = await b.newContext({ viewport: { width: larg, height: larg < 600 ? 844 : 900 }, hasTouch: larg < 600, isMobile: larg < 600, serviceWorkers: 'block', bypassCSP: true, colorScheme: modo === 'escuro' ? 'dark' : 'light' });
  if (modo === 'sol') await ctx.addInitScript(() => { try { localStorage.setItem('sqc-aparencia', JSON.stringify({ sol: true })); } catch (e) {} });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ contentType: 'text/css', body: '' }));
  await ctx.route(/exemplo\.invalid|supabase\.co/, r => r.abort());
  return ctx;
}
const espera = p => p.waitForTimeout(250);
const fechar = async p => { if (await p.$('dialog[open]')) { await p.keyboard.press('Escape'); await p.waitForSelector('dialog[open]', { state: 'detached' }).catch(() => {}); await p.waitForFunction(() => !document.querySelector('dialog[open]')).catch(() => {}); } };

/* passa por todas as telas e chama visita(p, nome) em cada uma */
async function percorrer(ctx, visita, { soAbas = false } = {}) {
  // entrada (configuração com servidor que não responde: mostra a tela de entrada sem falar com ninguém)
  if (!soAbas) {
    const e = await ctx.newPage(); await e.route('**/js/config.js', r => r.fulfill({ contentType: 'text/javascript', body: ENTRADA }));
    await e.goto(URL_); await e.waitForSelector('#tab_entrar'); await espera(e); await visita(e, 'entrada');
    await e.click('[data-auth="esqueci"]'); await espera(e); await visita(e, 'entrada · Esqueci a senha');
    await e.click('[data-auth="entrar"]'); await e.click('[data-auth="primeiro"]'); await espera(e); await visita(e, 'entrada · Primeiro acesso');
    await e.click('[data-auth="entrar"]'); await e.click('[data-ajudaentrada]'); await espera(e); await visita(e, 'entrada · ajuda'); await fechar(e); await e.keyboard.press('Escape');
    await e.close();
  }
  const p = await ctx.newPage(); await p.route('**/js/config.js', r => r.fulfill({ contentType: 'text/javascript', body: DEMO }));
  await p.goto(URL_); await p.waitForSelector('[data-demo="Coordenação"]');
  for (const perfil of ['Coordenação', 'Equipe', 'Acompanhamento']) {
    if (await p.$('[data-sair]:visible')) await p.click('header [data-sair]');
    await p.click(`[data-demo="${perfil}"]`); await p.waitForFunction(x => (document.querySelector('#quem') || {}).textContent.includes(x), perfil);
    const abas = await p.$$eval('#tabs [data-tab]', l => l.map(x => x.dataset.tab));
    for (const t of abas) { await p.click(`#tabs [data-tab="${t}"]`); await espera(p); await visita(p, `${perfil} · aba ${t}`); }
    if (perfil !== 'Coordenação' || soAbas) continue;
    const janelas = [['eventos', '[data-new="eventos"]', 'nova atividade'], ['eventos', '[data-presenca]', 'lista de presença'], ['eventos', '[data-fotos]', 'fotos'],
      ['painel', 'header [data-ajuda]', 'ajuda'], ['painel', 'header [data-meus]', 'meus dados'], ['painel', 'header [data-aparencia]', 'aparência']];
    for (const [aba, sel, nome] of janelas) {
      await p.click(`#tabs [data-tab="${aba}"]`); await espera(p); const alvo = await p.$(sel);
      if (!alvo) { ok(false, `janela "${nome}": não achei ${sel}`); continue; }
      await alvo.click(); await p.waitForSelector('dialog[open]'); await espera(p); await visita(p, `janela ${nome}`); await fechar(p);
    }
  }
  await p.close();
}

/* ---------- 1. axe ---------- */
const VIOL = {};
async function axe(p, onde) {
  if (!(await p.evaluate(() => typeof window.axe === 'object'))) await p.addScriptTag({ path: AXE });
  const r = await p.evaluate(() => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }, resultTypes: ['violations'] }));
  for (const v of r.violations) { const x = VIOL[v.id] = VIOL[v.id] || { impacto: v.impact, ajuda: v.help, nos: new Map(), telas: new Set() };
    x.telas.add(onde); v.nodes.forEach(n => { const k = n.target.join(' '); if (!x.nos.has(k)) x.nos.set(k, onde + ' — ' + (n.failureSummary || '').split('\n').slice(1, 2).join('').trim().slice(0, 140)); }); }
}

/* ---------- 2. conferências no navegador ---------- */
const CONF = {};   // tipo -> Map(chave -> tela)
const anota = (tipo, lista, onde) => { const m = CONF[tipo] = CONF[tipo] || new Map(); lista.forEach(k => { if (!m.has(k)) m.set(k, onde); }); };
const conferir = W => {   // W: largura pedida (no celular simulado o innerWidth cresce junto com o conteúdo que vaza, como num celular de verdade)
  const fechado = e => { const d = e.closest('details:not([open])'); return d && !d.querySelector(':scope>summary').contains(e); };   // conteúdo de <details> fechado não é desenhado
  const vis = e => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && !e.closest('[hidden],[aria-hidden="true"]') && !fechado(e) && (!e.checkVisibility || e.checkVisibility({ contentVisibilityAuto: true })); };
  const dlg = document.querySelector('dialog[open]'), raiz = dlg || document.body;
  const quem = e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/)[0] : '') + [...e.attributes].filter(a => a.name.startsWith('data-') && a.name !== 'data-kb').slice(0, 1).map(a => `[${a.name}${a.value ? '="' + a.value.slice(0, 20) + '"' : ''}]`).join('') + ' «' + (e.getAttribute('aria-label') || e.textContent || e.value || '').trim().replace(/\s+/g, ' ').slice(0, 30) + '»';
  const out = { titulos: [], nomes: [], alvo: [], borda: [], status: [], graficos: [] };
  // títulos
  const hs = sel => [...document.querySelectorAll(sel)].filter(vis).filter(h => dlg ? dlg.contains(h) : !h.closest('dialog'));
  const lista = hs('h1,h2,h3,h4,h5,h6,[role=heading]'), nivel = h => +(h.getAttribute('aria-level') || h.tagName[1]);
  if (!dlg) { const n1 = lista.filter(h => nivel(h) === 1).length; if (n1 !== 1) out.titulos.push(`${n1} h1 na página`); }
  let ant = dlg ? 1 : 0; lista.forEach(h => { const n = nivel(h); if (n > ant + 1) out.titulos.push(`pula de h${ant} para h${n}: ${quem(h)}`); ant = n; });
  // nome acessível e texto visível dentro do nome
  const txt = e => { let s = ''; e.childNodes.forEach(n => { if (n.nodeType === 3) s += n.textContent; else if (n.nodeType === 1 && !n.matches('.so,[aria-hidden="true"],svg') && getComputedStyle(n).display !== 'none') s += ' ' + txt(n); }); return s; };
  const nome = e => { const lb = e.getAttribute('aria-labelledby'); if (lb) return lb.split(/\s+/).map(i => (document.getElementById(i) || {}).textContent || '').join(' ').trim();
    if ((e.getAttribute('aria-label') || '').trim()) return e.getAttribute('aria-label').trim();
    if (e.labels && [...e.labels].some(l => l.textContent.trim())) return [...e.labels].map(l => l.textContent).join(' ').trim();
    if (e.matches('button,a,summary,[role=tab],[role=button],[role=switch]')) return (e.textContent + ' ' + [...e.querySelectorAll('img[alt]')].map(i => i.alt).join(' ')).trim() || (e.title || '').trim();
    if (e.matches('input[type=submit],input[type=button]')) return e.value;
    if (e.matches('[tabindex]') && !e.matches('input,select,textarea,[role]')) return e.textContent.trim();   // painel ou cartão só de leitura com parada de Tab: o leitor lê o conteúdo
    return (e.title || '').trim(); };
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const ctl = [...raiz.querySelectorAll('input:not([type=hidden]),select,textarea,button,a[href],summary,[role=tab],[role=button],[role=switch],[tabindex]:not([tabindex="-1"])')].filter(e => vis(e) || (e.matches('input[type=file]') && !e.closest('[hidden]')));
  ctl.forEach(e => { const n = nome(e); if (!n) out.nomes.push('sem nome: ' + quem(e) + (e.placeholder ? ' (só placeholder)' : ''));
    else if (e.matches('button,a,[role=tab],[role=button]') && e.hasAttribute('aria-label')) { const v = norm(txt(e)); if (v && !norm(n).includes(v)) out.nomes.push(`texto visível "${v}" fora do nome "${n}": ${quem(e)}`); } });
  // alvo de 24 × 24 (2.5.8): menor que isso só passa se o círculo de 24 px em volta não encostar em outro alvo; link no meio do texto é exceção
  const alvos = ctl.filter(vis).filter(e => !e.matches('input[type=file]') && !(e.matches('[tabindex]') && !e.matches('button,a,input,select,textarea,summary,[role=tab],[role=button],[role=switch]'))).map(e => ({ e, r: e.getBoundingClientRect() }));
  alvos.forEach(({ e, r }) => { if (r.width >= 23.5 && r.height >= 23.5) return;
    if (e.matches('a') && e.parentElement && /\S/.test([...e.parentElement.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join(''))) return;
    const lab = e.closest('label') || (e.labels && e.labels[0]); if (lab && lab.getBoundingClientRect().height >= 24 && lab.getBoundingClientRect().width >= 24) return;
    const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
    const perto = alvos.some(o => { if (o.e === e || o.e.contains(e) || e.contains(o.e)) return false; const dx = Math.max(o.r.left - cx, 0, cx - o.r.right), dy = Math.max(o.r.top - cy, 0, cy - o.r.bottom);
      const pequeno = o.r.width < 23.5 || o.r.height < 23.5; return pequeno ? Math.hypot(o.r.x + o.r.width / 2 - cx, o.r.y + o.r.height / 2 - cy) < 24 : Math.hypot(dx, dy) < 12; });
    if (perto) out.alvo.push(`${Math.round(r.width)}×${Math.round(r.height)} px, encostado em outro alvo: ${quem(e)}`); });
  // controle que passa da borda da tela e não está numa região que rola (fica cortado ou cria rolagem lateral)
  alvos.forEach(({ e, r }) => { if (r.right <= W + 1 && r.left >= -1) return; for (let a = e.parentElement; a; a = a.parentElement) { const o = getComputedStyle(a).overflowX; if (o === 'auto' || o === 'scroll') return; } out.borda.push(`${Math.round(r.left)}–${Math.round(r.right)} px numa tela de ${W}: ${quem(e)}`); });
  if (document.documentElement.scrollWidth > W + 1) out.borda.push(`página ${document.documentElement.scrollWidth - W} px mais larga que a tela`);
  // mensagens de estado (4.1.3)
  [...document.querySelectorAll('.toast,.err,.ok-msg,.ac-erro,.ac-ok,[id$="err"],[id$="ok"],.aviso-salvo')].forEach(e => { if (!e.closest('[role=status],[role=alert],[aria-live]:not([aria-live=off]),output')) out.status.push('mensagem fora de região viva: ' + quem(e)); });
  // gráficos e mapas (1.1.1)
  [...raiz.querySelectorAll('svg,canvas,[role=img]')].filter(vis).forEach(e => { if (e.closest('[aria-hidden="true"]') || e.getAttribute('aria-hidden') === 'true') return;
    if (e.matches('svg') && e.closest('button,a,[role=img],[role=button]') && e.closest('button,a,[role=img],[role=button]') !== e) return;
    const n = (e.getAttribute('aria-label') || '').trim() || (e.getAttribute('aria-labelledby') ? 'x' : '') || (e.querySelector(':scope>title') || {}).textContent;
    if (e.matches('canvas') && !e.textContent.trim() && !n) out.graficos.push('canvas sem alternativa: ' + quem(e));
    else if (!n || (e.matches('svg') && e.getAttribute('role') !== 'img' && !e.closest('[role=img]'))) out.graficos.push('desenho sem papel img ou sem nome: ' + quem(e)); });
  return out;
};

/* 1.4.12: o que corta ou sobrepõe com espaçamento aumentado (só o que não acontecia antes) */
const medirCorte = () => {
  const fechado = e => { const d = e.closest('details:not([open])'); return d && !d.querySelector(':scope>summary').contains(e); };
  const vis = e => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && !e.closest('[hidden],.so') && !fechado(e) && (!e.checkVisibility || e.checkVisibility({ contentVisibilityAuto: true })); };
  const dlg = document.querySelector('dialog[open]'), raiz = dlg || document.body, res = [];
  const folhas = [...raiz.querySelectorAll('*')].filter(e => !['SCRIPT', 'STYLE', 'OPTION', 'svg'].includes(e.tagName) && !e.closest('svg') && (dlg || !e.closest('dialog')) && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && vis(e));
  const quem = e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/)[0] : '') + ' «' + e.textContent.trim().replace(/\s+/g, ' ').slice(0, 30) + '»';
  const clip = (e, r) => { let x = { left: r.left, top: r.top, right: r.right, bottom: r.bottom }; for (let a = e.parentElement; a && a !== document.documentElement; a = a.parentElement) { const s = getComputedStyle(a); if (s.overflowX === 'visible' && s.overflowY === 'visible') continue; const q = a.getBoundingClientRect(); x = { left: Math.max(x.left, q.left), top: Math.max(x.top, q.top), right: Math.min(x.right, q.right), bottom: Math.min(x.bottom, q.bottom) }; } return x; };
  const fixo = e => { for (let a = e; a; a = a.parentElement) if (/sticky|fixed/.test(getComputedStyle(a).position)) return a; return null; };
  const caixas = folhas.map(e => { const rg = document.createRange(); const rs = [...e.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim()).flatMap(n => { rg.selectNodeContents(n); return [...rg.getClientRects()]; }); return { e, rs, vs: rs.map(r => clip(e, r)).filter(r => r.right - r.left > 1 && r.bottom - r.top > 1), fx: fixo(e) }; });
  caixas.forEach(({ e, rs }) => {
    for (let a = e; a && a !== document.documentElement; a = a.parentElement) { const s = getComputedStyle(a); if (!/hidden|clip/.test(s.overflowX + s.overflowY)) continue; const q = a.getBoundingClientRect();
      if (rs.some(r => r.right > q.right + 1.5 || r.bottom > q.bottom + 1.5 || r.left < q.left - 1.5 || r.top < q.top - 1.5)) { res.push('cortado: ' + quem(e) + (a !== e ? ' (dentro de ' + quem(a).split(' «')[0] + ')' : '')); break; } }
    const s = getComputedStyle(e); if (s.textOverflow === 'ellipsis' && e.scrollWidth > e.clientWidth + 1) res.push('reticências: ' + quem(e)); });
  for (let i = 0; i < caixas.length; i++) for (let j = i + 1; j < caixas.length; j++) { const A = caixas[i], B = caixas[j]; if (A.e.contains(B.e) || B.e.contains(A.e)) continue;
    if (A.fx !== B.fx) continue;   // texto que rola por baixo de barra fixa não é sobreposição
    if (A.vs.some(a => B.vs.some(b => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2))) res.push('sobreposto: ' + quem(A.e) + ' × ' + quem(B.e)); }
  return res;
};
const ESPACO = '*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}';

/* 2.4.11: com Tab em cada aba, o elemento com foco nunca fica todo coberto pelo que é fixo (cabeçalho, abas, rodapé, aviso) */
async function focoEscondido(p, onde) {
  await p.evaluate(() => { scrollTo(0, 0); document.activeElement && document.activeElement.blur(); });
  const ruins = [], parcial = []; let primeiro = null;
  for (let n = 0; n < 400; n++) {
    await p.keyboard.press('Tab');
    const f = await p.evaluate(async () => { const e = document.activeElement; if (!e || e === document.body) return null; if (!e.dataset.kb) e.dataset.kb = Math.random().toString(36).slice(2);
      let r = e.getBoundingClientRect(); for (let i = 0, k = 0; i < 40 && k < 3; i++) { await new Promise(f => requestAnimationFrame(f)); const q = e.getBoundingClientRect(); k = q.x === r.x && q.y === r.y ? k + 1 : 0; r = q; } if (r.width < 1 || r.height < 1) return { id: e.dataset.kb };
      const pts = []; for (const fx of [0.2, 0.5, 0.8]) for (const fy of [0.25, 0.5, 0.75]) pts.push([r.left + r.width * fx, r.top + r.height * fy]);
      const dentro = pts.filter(([x, y]) => x >= 0 && y >= 0 && x < innerWidth && y < innerHeight);
      const vistos = dentro.filter(([x, y]) => { const t = document.elementFromPoint(x, y); return t && (e.contains(t) || t.contains(e)); }).length;
      const cobre = dentro.map(([x, y]) => document.elementFromPoint(x, y)).find(t => t && !e.contains(t) && !t.contains(e));
      return { id: e.dataset.kb, nome: e.tagName.toLowerCase() + '.' + String(e.className).split(' ')[0] + ' «' + (e.getAttribute('aria-label') || e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30) + '»', vistos, total: pts.length, fora: dentro.length === 0, por: cobre ? cobre.tagName.toLowerCase() + '.' + String(cobre.className).split(' ')[0] : '' }; });
    if (!f) continue; if (f.id === primeiro) break; if (!primeiro) primeiro = f.id; if (f.total === undefined) continue;
    if (f.vistos === 0) ruins.push(f.nome + (f.fora ? ' (fora da tela)' : ' (coberto por ' + f.por + ')')); else if (f.vistos < f.total) parcial.push(f.nome + ' (parte sob ' + f.por + ')');
  }
  if (process.env.FOTOS && ruins.length) await p.screenshot({ path: `${process.env.FOTOS}/foco-${onde.replace(/\W+/g, '_')}.png` });
  return { ruins, parcial };
}

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  const t0 = Date.now(); let telas = 0;
  // axe em 1280 e 390 × claro, escuro e sol; conferências no modo claro
  for (const larg of [1280, 390]) for (const modo of MODOS) {
    const ctx = await contexto(b, larg, modo); let n = 0;
    await percorrer(ctx, async (p, onde) => {
      if (modo === 'sol') ok(await p.evaluate(() => document.documentElement.hasAttribute('data-sol')), `[${larg}px sol] ${onde}: data-sol ligado`);
      const k = `[${larg}px ${modo}] ${onde}`; await axe(p, k); n++;
      if (modo === 'claro') { const c = await p.evaluate(conferir, larg); for (const t in c) anota(t, c[t], k); }
    });
    telas += n; console.log(`·· axe ${larg}px ${modo}: ${n} telas`); await ctx.close();
  }
  // 320 px (1.4.10) e espaçamento de texto (1.4.12)
  { const ctx = await contexto(b, 320, 'claro'); let n = 0;
    await percorrer(ctx, async (p, onde) => { n++;
      const lado = await p.evaluate(() => document.documentElement.scrollWidth - 320); if (lado > 1) anota('reflow', [`rola ${lado}px para o lado`], '[320px] ' + onde);
      const antes = new Set(await p.evaluate(medirCorte));
      await p.evaluate(css => { const s = document.createElement('style'); s.id = 'a11y-espaco'; s.textContent = css; document.head.appendChild(s); }, ESPACO); await p.waitForTimeout(80);
      const depois = await p.evaluate(medirCorte), lado2 = await p.evaluate(() => document.documentElement.scrollWidth - 320);
      anota('espacamento', depois.filter(x => !antes.has(x)).concat(lado2 > 1 ? [`rola ${lado2}px para o lado com espaçamento`] : []), '[320px] ' + onde);
      await p.evaluate(() => document.getElementById('a11y-espaco').remove()); });
    console.log(`·· 320px reflow e espaçamento: ${n} telas`); await ctx.close(); }
  // foco não escondido (2.4.11) em 1280 e 390
  for (const larg of [1280, 390]) { const ctx = await contexto(b, larg, 'claro');
    await percorrer(ctx, async (p, onde) => { const r = await focoEscondido(p, `${larg}-${onde}`); anota('foco', r.ruins, `[${larg}px] ${onde}`); anota('foco_parcial', r.parcial, `[${larg}px] ${onde}`); }, { soAbas: true });
    await ctx.close(); }
  // mensagens que aparecem depois de uma ação (4.1.3): erro da entrada e erro do formulário
  { const ctx = await contexto(b, 390, 'claro'), e = await ctx.newPage(); await e.route('**/js/config.js', r => r.fulfill({ contentType: 'text/javascript', body: ENTRADA }));
    await e.goto(URL_); await e.waitForSelector('#tab_entrar'); await e.click('#abotao'); await e.waitForTimeout(400);
    const ent = await e.evaluate(() => { const m = document.querySelector('#aerr'), f = document.activeElement, d = f && (f.getAttribute('aria-describedby') || '').split(/\s+/).map(i => document.getElementById(i)).filter(Boolean);
      return { viva: !!(m && !m.hidden && m.textContent.trim() && m.closest('[role=alert],[role=status],[aria-live]')), foco: f && f.id, invalido: f && f.getAttribute('aria-invalid') === 'true', desc: d ? d.map(x => x.textContent.trim()).join(' ') : '',
        todos: [...document.querySelectorAll('input[aria-invalid="true"]')].every(x => (x.getAttribute('aria-describedby') || '').split(/\s+/).some(i => (document.getElementById(i) || {}).textContent)) }; });
    ok(ent.viva || (ent.invalido && !!ent.desc), 'entrada vazia: o erro é anunciado (região viva, ou foco no campo inválido com aria-describedby no texto do erro)', JSON.stringify(ent));
    ok(ent.todos, 'entrada vazia: todo campo inválido aponta para o texto do seu erro (aria-describedby)');
    const p = await ctx.newPage(); await p.route('**/js/config.js', r => r.fulfill({ contentType: 'text/javascript', body: DEMO })); await p.goto(URL_);
    await p.click('[data-demo="Coordenação"]'); await p.click('#tabs [data-tab="eventos"]'); await p.click('[data-new="eventos"]'); await p.click('#fsalvar');
    await p.waitForFunction(() => document.querySelector('#ferr').textContent.trim().length > 0).catch(() => {});
    const fe = await p.evaluate(() => { const m = document.querySelector('#ferr'); return { txt: m.textContent.trim(), viva: !!m.closest('[role=alert],[role=status],[aria-live]'), inval: [...document.querySelectorAll('#frm [aria-invalid="true"]')].length }; });
    ok(!!fe.txt && fe.viva, 'formulário com erro: mensagem numa região viva (role=alert)', JSON.stringify(fe));
    await ctx.close(); }
  await b.close();

  // ---------- relatório ----------
  console.log(`\n== axe: ${telas} telas ==`);
  const ORD = { critical: 0, serious: 1, moderate: 2, minor: 3 };
  Object.entries(VIOL).sort((a, b) => ORD[a[1].impacto] - ORD[b[1].impacto] || b[1].nos.size - a[1].nos.size).forEach(([id, v]) => {
    ok(false, `axe ${id} (${v.impacto}) — ${v.ajuda}: ${v.nos.size} elemento(s) em ${v.telas.size} tela(s)`, [...v.nos].slice(0, process.env.TUDO ? 1e9 : 4).map(([k, o]) => k + '  @ ' + o).join('\n      ')); });
  if (!Object.keys(VIOL).length) ok(true, 'axe: nenhuma violação');
  const NOMES = { titulos: 'títulos (um h1, sem pular nível)', nomes: 'nome acessível dos controles (e 2.5.3)', alvo: 'alvo de 24 × 24 px (2.5.8)', status: 'mensagens em região viva (4.1.3)', graficos: 'gráficos e mapas com alternativa (1.1.1)', borda: 'nada passa da borda da tela em 1280 e 390 px (1.4.10)', reflow: '320 px sem rolagem lateral (1.4.10)', espacamento: 'espaçamento de texto sem corte nem sobreposição (1.4.12)', foco: 'foco nunca todo escondido (2.4.11)' };
  console.log('\n== conferências ==');
  for (const t in NOMES) { const m = CONF[t] || new Map(); ok(!m.size, NOMES[t] + (m.size ? `: ${m.size} caso(s)` : ''), [...m].slice(0, process.env.TUDO ? 1e9 : 6).map(([k, o]) => k + '  @ ' + o).join('\n      ')); }
  const pa = CONF.foco_parcial || new Map(); if (pa.size) console.log(`aviso: foco parcialmente coberto em ${pa.size} caso(s) (2.4.12, AAA; não conta como falha)\n      ` + [...pa].slice(0, 4).map(([k, o]) => k + '  @ ' + o).join('\n      '));
  console.log(`\nACESSIBILIDADE: ${oks} ok, ${falhas} FALHOU — ${Math.round((Date.now() - t0) / 1000)} s`);
  process.exit(falhas ? 1 : 0);
})().catch(e => { console.error('FALHOU: ' + String(e.stack || e)); process.exit(1); });
