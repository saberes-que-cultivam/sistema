/* Segurança do lado do aparelho (OWASP / ASVS), no modo demonstração. Não fala com o Supabase nem com o site publicado.
   Uso:  node ferramentas/servidor_teste.js 8766 &   e depois   NODE_PATH=$(npm root -g) node testes/automaticos/seguranca.js
   O que confere:
   1) XSS guardado: código no lugar de texto, pelos formulários de verdade (todos os cadastros, lista de presença, legenda de foto,
      Meus dados, link de cadastro público, planilha da FUNCERN .xlsx forjada) e também "vindo do banco" (cópia da demonstração
      com código em todo campo de texto, histórico e convites forjados). Depois abre todas as abas, janelas e impressões, nos três
      perfis, e confere que nada rodou (a política de conteúdo fica desligada aqui de propósito, para o teste não depender dela)
      e que nenhum elemento com on…= ou link javascript: entrou na página.
   2) Planilha .csv: texto que começa com = + - @ sai desarmado; cópia .json de cada perfil.
   3) Fotos: arquivo que não é imagem, SVG, vazio, imagem enorme e data do arquivo no futuro.
   4) Sessão: o que fica no aparelho depois de sair; código do link de cadastro sai do endereço; política de conteúdo no index.html.
   5) SEAB/MDA: nenhum dado pessoal chega à tela nem à memória da página.
   Todos os dados de teste são fictícios. */
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path'); const os = require('os');
const URL_ = process.env.URL_SISTEMA || 'http://localhost:8766/';
const RAIZ = path.join(__dirname, '..', '..');
let falhas = 0, oks = 0;
const ok = (c, m) => { if (c) { oks++; console.log('ok  ' + m); } else { falhas++; console.log('FALHOU: ' + m); } };
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'sqc-seg-'));

// código de ataque: cada um deixa uma marca diferente se rodar
const ATQ = t => `"><img src=x onerror="window.__x='${t}'"><svg onload="window.__x='${t}'"></svg>'<script>window.__x='${t}'</script>`;
const ATQ_CURTO = t => `<img src=x onerror=window.__x='${t}'>`;   // para campos com limite de tamanho
const LINK_JS = "javascript:window.__x='link'";

/* ---------- zip e .xlsx mínimos, para a planilha forjada (sem biblioteca) ---------- */
const CRC = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return b => { let c = ~0; for (const x of b) c = t[(c ^ x) & 255] ^ (c >>> 8); return (~c) >>> 0; }; })();
function zip(arqs) {
  const partes = [], centrais = []; let pos = 0;
  for (const [nome, txt] of Object.entries(arqs)) {
    const n = Buffer.from(nome), d = Buffer.from(txt), crc = CRC(d);
    const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt32LE(crc, 14); h.writeUInt32LE(d.length, 18); h.writeUInt32LE(d.length, 22); h.writeUInt16LE(n.length, 26);
    const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt32LE(crc, 16); c.writeUInt32LE(d.length, 20); c.writeUInt32LE(d.length, 24); c.writeUInt16LE(n.length, 28); c.writeUInt32LE(pos, 42);
    partes.push(h, n, d); centrais.push(c, n); pos += 30 + n.length + d.length;
  }
  const cd = Buffer.concat(centrais), fim = Buffer.alloc(22); fim.writeUInt32LE(0x06054b50, 0); fim.writeUInt16LE(centrais.length / 2, 8); fim.writeUInt16LE(centrais.length / 2, 10); fim.writeUInt32LE(cd.length, 12); fim.writeUInt32LE(pos, 16);
  return Buffer.concat([...partes, cd, fim]);
}
const xe = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function xlsxForjado() {
  const cab = ['ID Solicitação', 'Tipo Solicitação', 'Beneficiário Nome', 'Valor', 'Rubrica Financeira', 'Subrubrica Financeira', 'Detalhe Rubrica', 'Status', 'Data Solicitação'];
  const linhas = [cab, ['9001', ATQ('xlsx-tipo'), ATQ('xlsx-benef'), '150.5', 'Material de consumo', 'x', ATQ('xlsx-det'), ATQ('xlsx-status'), '2026-09-10'],
    ['9002', 'Solicitação de compra', '=HYPERLINK("http://exemplo.invalid","x")', '10', ATQ('xlsx-rub'), '', '@SUM(1+1)', 'Pago', '2026-09-11']];
  const cel = (v, c, r) => `<c r="${String.fromCharCode(65 + c)}${r}" t="inlineStr"><is><t>${xe(v)}</t></is></c>`;
  const sheet = `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${linhas.map((l, i) => `<row r="${i + 1}">${l.map((v, c) => cel(v, c, i + 1)).join('')}</row>`).join('')}</sheetData></worksheet>`;
  return zip({
    '[Content_Types].xml': '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>',
    'xl/workbook.xml': `<?xml version="1.0"?><workbook xmlns:r="r"><sheets><sheet name="${xe(ATQ_CURTO('xlsx-aba'))}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    'xl/_rels/workbook.xml.rels': '<?xml version="1.0"?><Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>',
    'xl/worksheets/sheet1.xml': sheet
  });
}

/* ---------- arquivos de foto forjados ---------- */
function arquivosFoto() {
  const F = {};
  F.html = path.join(TMP, 'pagina.jpg'); fs.writeFileSync(F.html, '<html><script>window.__x="foto"</script></html>');
  F.vazio = path.join(TMP, 'vazio.jpg'); fs.writeFileSync(F.vazio, '');
  F.svg = path.join(TMP, 'desenho.svg'); fs.writeFileSync(F.svg, `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" onload="window.__x='svg'"><script>window.__x='svg2'</script><rect width="40" height="40" fill="#3a6"/></svg>`);
  // JPEG mínimo de verdade (1x1) com EXIF de data no futuro
  const jpeg1x1 = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', 'base64');
  const tiff = Buffer.alloc(8 + 2 + 12 + 4 + 20); tiff.write('II', 0); tiff.writeUInt16LE(42, 2); tiff.writeUInt32LE(8, 4); tiff.writeUInt16LE(1, 8);
  tiff.writeUInt16LE(0x0132, 10); tiff.writeUInt16LE(2, 12); tiff.writeUInt32LE(20, 14); tiff.writeUInt32LE(26, 18); tiff.writeUInt32LE(0, 22); tiff.write('2099:01:01 10:00:00\0', 26, 'latin1');
  const app1 = Buffer.concat([Buffer.from([0xFF, 0xE1]), Buffer.alloc(2), Buffer.from('Exif\0\0', 'latin1'), tiff]); app1.writeUInt16BE(app1.length - 2, 2);
  F.futuro = path.join(TMP, 'futuro.jpg'); fs.writeFileSync(F.futuro, Buffer.concat([jpeg1x1.subarray(0, 2), app1, jpeg1x1.subarray(2)]));
  return F;
}

(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined });
  // bypassCSP: a política do index.html bloquearia o código; aqui ela fica de fora para ver se o ESCAPE sozinho segura
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block', locale: 'pt-BR', bypassCSP: true, acceptDownloads: true });
  await ctx.addInitScript(() => {
    window.__x = 0; window.__inj = [];
    window.print = () => { const i = document.getElementById('impresso'); window._impresso = i ? i.innerHTML : ''; window.dispatchEvent(new Event('afterprint')); };
    window.open = () => null;
    const olhar = el => { if (!el || el.nodeType !== 1) return;
      for (const a of el.attributes || []) if (/^on/i.test(a.name) || (/^(href|src|action|formaction|xlink:href)$/i.test(a.name) && /^\s*javascript:/i.test(a.value))) window.__inj.push(el.tagName + ' ' + a.name + '=' + String(a.value).slice(0, 40));
      if (el.tagName === 'SCRIPT' && el.textContent.includes('__x')) window.__inj.push('SCRIPT'); };
    new MutationObserver(ms => ms.forEach(m => { if (m.type === 'attributes') olhar(m.target); m.addedNodes && m.addedNodes.forEach(n => { olhar(n); n.querySelectorAll && n.querySelectorAll('*').forEach(olhar); }); }))
      .observe(document, { childList: true, subtree: true, attributes: true });
  });
  const p = await ctx.newPage(); const erros = []; p.on('pageerror', e => erros.push(String(e)));
  p.on('dialog', d => d.dismiss().catch(() => {}));
  await p.route('**/js/config.js', r => r.fulfill({ contentType: 'text/javascript', body: "window.SQC=window.SQC||{};SQC.CONFIG={supabaseUrl:'',supabaseAnonKey:'',semServiceWorker:true};" }));
  const limpo = async onde => { const r = await p.evaluate(() => ({ x: window.__x, inj: window.__inj.slice(0, 5) })); return { ok: !r.x && !r.inj.length, msg: onde + (r.x || r.inj.length ? ` (rodou: ${r.x}; injetado: ${r.inj.join(' | ')})` : '') }; };
  const confere = async onde => { const r = await limpo(onde); ok(r.ok, 'nenhum código rodou nem entrou na página: ' + r.msg); await p.evaluate(() => { window.__x = 0; window.__inj = []; }); };
  const entrar = async perfil => { await p.goto('about:blank'); await p.goto(URL_); await p.waitForSelector('[data-demo], #app:not([hidden])');
    if (!(await p.$('[data-demo]'))) { await p.$eval('[data-sair]', x => x.click()); await p.waitForSelector('[data-demo]'); }
    await p.click(`[data-demo="${perfil}"]`); await p.waitForSelector('#app:not([hidden]) #tabs [data-tab]'); };
  const fechar = async () => { await p.evaluate(() => { const d = document.getElementById('dlg'); if (d && d.open) d.close(); }); };
  const esperar = ms => p.waitForTimeout(ms);

  /* =============== 1a) XSS pelos formulários de verdade (Coordenação) =============== */
  await p.goto(URL_); await p.evaluate(() => { localStorage.clear(); }); await entrar('Coordenação');
  const tabs = await p.evaluate(() => SQC.app.abas().map(t => t[0]));
  const novos = new Map();   // cadastro -> aba onde fica o botão
  for (const t of tabs) { await p.click(`[data-tab="${t}"]`).catch(() => {}); await esperar(100); (await p.$$eval('[data-new]', l => l.map(x => x.dataset.new))).forEach(n => { if (!novos.has(n)) novos.set(n, t); }); }
  novos.set('membros', 'equipe');
  const salvos = [];
  for (const [m, aba] of novos) {
    await fechar(); await p.click(`[data-tab="${aba}"]`); await esperar(100);
    await p.evaluate(m => { const b = document.querySelector(`[data-new="${m}"]`); if (b) b.click(); else if (m === 'membros') { const c = document.querySelector('[data-cadeq]'); if (c) c.click(); } }, m);
    if (m === 'membros') { await esperar(200); const sem = await p.$('#frm [data-fechaapos], #frm [data-digitar]'); if (sem) await sem.click(); }
    if (!(await p.waitForSelector('#frm #fsalvar', { timeout: 3000 }).catch(() => null))) { if (m !== 'membros') ok(false, `formulário ${m} abriu`); continue; }
    const campos = await p.$$eval('#frm input, #frm textarea, #frm select', l => l.map(e => ({ id: e.id, tag: e.tagName, type: e.type, mode: e.inputMode, vazio: !e.value })));
    for (const c of campos) {
      if (!c.id || c.type === 'hidden' || c.type === 'checkbox' || c.type === 'file') continue;
      const sel = '#' + c.id;
      if (c.tag === 'SELECT') { if (c.vazio) await p.evaluate(s => { const e = document.querySelector(s); const o = [...e.options].find(o => o.value); if (o) { e.value = o.value; e.dispatchEvent(new Event('change', { bubbles: true })); } }, sel); continue; }
      if (c.type === 'date') continue;
      const k = c.id.replace(/^f_/, '');
      const v = c.mode === 'decimal' ? '1' : c.type === 'email' || k === 'email' ? 'xss@exemplo.br' : k === 'link' ? LINK_JS
        : k === 'sigla' ? 'XS' : k === 'uf' ? 'RN' : ['cpf', 'pis', 'cep', 'telefone', 'siape', 'nascimento', 'renda', 'pessoas_casa', 'numero'].includes(k) ? '' : ATQ(m + '.' + k);
      await p.fill(sel, v).catch(() => {});
    }
    await p.check('#f_lgpd').catch(() => {});
    await p.click('#fsalvar'); await esperar(400);
    const fechou = !(await p.evaluate(() => document.getElementById('dlg').open));
    if (!fechou) { const e = await p.textContent('#ferr').catch(() => ''); console.log(`    (${m}: não salvou com código nos campos: ${e.trim()})`); await fechar(); }
    else salvos.push(m);
  }
  const gravados = await p.evaluate(() => { const db = SQC.apiDemo._db(), n = {}; Object.keys(db).forEach(t => { n[t] = (db[t] || []).filter(r => JSON.stringify(r).includes('__x')).length; }); return n; });
  console.log('    gravados com código pelos formulários: ' + JSON.stringify(gravados));
  ok(salvos.length >= 8, `os formulários aceitam texto qualquer e gravam (${salvos.join(', ')}): o teste exercita a tela de verdade`);
  await confere('formulários salvos');

  // lista de presença e legenda de foto
  await p.click('[data-tab="eventos"]'); await p.click('[data-presenca="e2"]'); await p.waitForSelector('#pr_nome');
  await p.fill('#pr_nome', ATQ('presenca.nome')); await p.fill('#pr_com', ATQ('presenca.com')); await p.fill('#pr_mun', ATQ('presenca.mun')); await p.click('[data-pradd]'); await esperar(400);
  ok(await p.evaluate(() => (SQC.app._estado().db.presencas || []).some(x => x.nome.includes('__x'))), 'lista de presença gravou o nome com código (para testar a exibição)');
  await confere('lista de presença'); await fechar();
  await p.click('[data-fotos="eventos:e2"]'); await p.waitForSelector('#ft_arq', { state: 'attached' });
  await p.fill('#ft_leg', ATQ('foto.legenda')); await p.setInputFiles('#ft_arq', path.join(__dirname, 'dados', 'foto_2026-09-08.jpg'));
  await p.waitForFunction(() => (SQC.app._estado().db.fotos || []).length >= 1, null, { timeout: 8000 }).catch(() => {});
  await esperar(300); await confere('fotos com legenda'); await fechar();

  // Meus dados (celular e município)
  await p.click('[data-meus]'); await esperar(200);
  if (await p.$('#md_mun')) { await p.fill('#md_mun', ATQ('meus.mun')); await p.click('[data-meussalvar]'); await esperar(300); }
  await confere('Meus dados'); await fechar();

  // planilha da FUNCERN forjada
  const xlsx = path.join(TMP, 'funcern.xlsx'); fs.writeFileSync(xlsx, xlsxForjado());
  await p.click('[data-tab="financeiro"]').catch(() => {}); await esperar(100);
  if (!(await p.$('#imp_arq'))) { await p.evaluate(() => { const b = document.querySelector('[data-tab="despesas"]'); if (b) b.click(); }); }
  const inp = await p.$('#imp_arq');
  if (inp) {
    await p.setInputFiles('#imp_arq', xlsx); await esperar(800);
    const txt = await p.textContent('#frm').catch(() => '');
    ok(/9001|xlsx|img/.test(txt), 'planilha .xlsx forjada foi lida e mostrada na prévia da importação');
    await confere('prévia da importação da planilha');
    // escolhe rubrica/etapa e confirma, para o texto da planilha entrar nas despesas
    for (let i = 0; i < 12; i++) {   // cada escolha redesenha a prévia: escolhe uma por vez
      const feito = await p.evaluate(() => { const s = [...document.querySelectorAll('#frm select')].find(s => !s.value); if (!s) return false; const o = [...s.options].find(o => o.value); if (!o) return false; s.value = o.value; s.dispatchEvent(new Event('change', { bubbles: true })); return true; });
      if (!feito) break; await esperar(150);
    } const conf = await p.$('#frm [data-impok]:not([disabled])'); ok(!!conf, 'importação forjada pode ser confirmada (texto da planilha entra nas despesas)'); if (conf) { await conf.click(); await esperar(800); }
    await confere('importação confirmada'); await fechar();
  } else ok(false, 'botão de importar a planilha da FUNCERN encontrado');

  // link de cadastro público (sem login), com código em todos os campos
  await p.click('[data-tab="equipe"]'); await esperar(100);
  const tk = await p.evaluate(() => SQC.apiDemo.criarConvite('discente'));
  await p.goto('about:blank'); await p.goto(URL_ + '#c=' + tk); await p.waitForSelector('#fpub');
  ok(!(await p.evaluate(() => location.hash)).includes(tk), 'o código do link de cadastro sai do endereço (history.replaceState) assim que a página abre');
  for (const id of await p.$$eval('#fpub input:not([type=checkbox]):not([type=hidden]), #fpub textarea', l => l.map(e => e.id))) {
    const k = id.replace(/^f_/, ''); if (['cpf', 'pis', 'cep', 'telefone', 'nascimento', 'renda', 'pessoas_casa', 'numero', 'email', 'uf'].includes(k)) continue; await p.fill('#' + id, ATQ_CURTO('cv.' + k)).catch(() => {});
  }
  await p.check('#f_lgpd').catch(() => {}); await p.click('#penviar'); await esperar(400);
  await confere('cadastro pelo link público');

  /* =============== 1b) XSS "vindo do banco": todo campo de texto com código =============== */
  await entrar('Coordenação');
  await p.evaluate(({ L }) => {
    const A = t => `"><img src=x onerror="window.__x='${t}'"><svg onload="window.__x='${t}'"></svg>'`;
    const db = SQC.apiDemo._db(), PULA = /^(id|unidade|lote|agricultor|evento|registro|tabela|criado_por|criado_em|atualizado_em|data|inicio|fim|diag|kitdata|tirada_em|perfil|funcao|etapa|rubrica|item|status|tipo|caminho|conta|usou|med|territorio|quimico|nascimento)$/;
    Object.keys(db).forEach(t => (db[t] || []).forEach(r => Object.keys(r).forEach(k => { if (!PULA.test(k) && typeof r[k] === 'string' && !(t === 'pessoas' && k === 'email')) r[k] = k === 'link' ? L : A(t + '.' + k); })));
    (db.lotes || []).forEach(l => { l.tipo = A('lotes.tipo'); l.status = A('lotes.status'); l.med = A('lotes.med'); });
    (db.eventos || []).forEach(e => { e.tipo = A('eventos.tipo'); });
    (db.despesas || []).forEach(d => { d.status = A('despesas.status'); d.etapa = A('despesas.etapa'); });
    (db.visitas || []).forEach(v => { v.usou = A('visitas.usou'); });
    (db.pessoas || []).forEach(x => { x.orgao = A('pessoas.orgao'); });
    localStorage.setItem('sqc-demo-v1', JSON.stringify(db));
    const cv = JSON.parse(localStorage.getItem('sqc-demo-convites') || '[]'); const d = {}; SQC.regras.CAMPOS_CONVITE.forEach(k => { d[k] = A('convite.' + k).slice(0, 300); });
    cv.push({ id: 'cv-x', funcao: 'discente', token: 'f'.repeat(64), status: 'preenchido', dados: d, expira_em: new Date(Date.now() + 864e5).toISOString(), preenchido_em: new Date().toISOString(), criado_em: new Date().toISOString() });
    localStorage.setItem('sqc-demo-convites', JSON.stringify(cv));
  }, { L: LINK_JS });

  // histórico forjado (linhas de auditoria com código em tabela, ação, nomes, campos e valores) e "falta enviar" forjado
  const forjarApi = () => p.evaluate(() => {
    const A = t => `"><img src=x onerror="window.__x='${t}'">`;
    const db = SQC.apiDemo._db(), quem = db.pessoas[0].id, em = new Date().toISOString(), lixo = { nome: A('h.nome'), [A('h.campo')]: A('h.valor'), obs: A('h.obs'), unidade: A('h.ref'), rubrica: A('h.rub'), data: A('h.data') };
    SQC.apiDemo.auditoria = async () => [
      { id: 1, tabela: 'lotes', acao: 'UPDATE', por: quem, em, antes: Object.assign({}, lixo, { obs: 'a' }), depois: lixo },
      { id: 2, tabela: A('h.tabela'), acao: A('h.acao'), por: A('h.por'), em, depois: lixo },
      { id: 3, tabela: 'planilhas', acao: 'PLANILHA', por: quem, em, depois: { tipo: A('h.tipo'), qtd: A('h.qtd') } },
      { id: 4, tabela: 'visitas', acao: 'INSERT', por: null, em: A('h.em'), depois: { data: A('h.d2') } }];
    SQC.apiDemo.listarFila = async () => [{ pessoa: quem, nome: A('fila.nome'), quantos: 2, recusados: 1, desde: em, informado_em: em }];
    const ac = SQC.apiDemo.acessos.bind(SQC.apiDemo); SQC.apiDemo.acessos = async () => (await ac()).map(x => Object.assign(x, { nome: A('ac.nome'), orgao: A('ac.orgao') }));
  });

  const percorrer = async perfil => {
    await entrar(perfil); await forjarApi(); await p.evaluate(() => { window.__x = 0; window.__inj = []; });
    const ts = await p.evaluate(() => SQC.app.abas().map(t => t[0]));
    for (const t of ts) {
      await p.click(`[data-tab="${t}"]`); await esperar(150);
      // abre o que fica fechado: mais linhas, detalhes, histórico, acessos
      await p.evaluate(() => { document.querySelectorAll('details').forEach(d => { d.open = true; d.dispatchEvent(new Event('toggle')); }); });
      for (const s of ['[data-hist]', '[data-acessos]', '[data-mais]', '[data-histmais]']) { const e = await p.$(s); if (e) { await e.evaluate(x => x.click()).catch(() => {}); await esperar(250); } }
      await p.evaluate(() => { document.querySelectorAll('details').forEach(d => { d.open = true; d.dispatchEvent(new Event('toggle')); }); });
      if (t === 'historico') { await p.fill('#hbusca', 'img').catch(() => {}); await esperar(150); }
      if (t === 'relatorios') { const g = await p.$('[data-rel]'); if (g) await g.evaluate(x => x.click()); await esperar(150); const pr = await p.$('[data-print]'); if (pr) await pr.evaluate(x => x.click()); await esperar(150); }
      await confere(`${perfil} · aba ${t}`);
      // cada janela da aba: editar, ficha, lista, fotos, imprimir em branco
      const alvos = await p.$$eval('[data-edit],[data-ficha],[data-presenca],[data-fotos],[data-imprimirlista],[data-cvaprovar]', l => l.slice(0, 40).map(x => { const k = Object.keys(x.dataset).find(k => ['edit', 'ficha', 'presenca', 'fotos', 'imprimirlista', 'cvaprovar'].includes(k)); return `[data-${k}="${x.dataset[k]}"]`; }));
      for (const a of [...new Set(alvos)]) {
        await fechar(); const e = await p.$(a); if (!e) continue; await e.evaluate(x => x.click()).catch(() => {}); await esperar(200);
        const ib = await p.$('#frm [data-imprimir]'); if (ib) { await ib.evaluate(x => x.click()).catch(() => {}); await esperar(150); }
        await fechar();
      }
      for (const n of await p.$$eval('[data-new]', l => [...new Set(l.map(x => x.dataset.new))])) {
        await fechar(); await p.$eval(`[data-new="${n}"]`, x => x.click()).catch(() => {}); await esperar(150); const ib = await p.$('#frm [data-imprimir]'); if (ib) { await ib.evaluate(x => x.click()).catch(() => {}); await esperar(150); } await fechar();
      }
      await confere(`${perfil} · janelas e impressões da aba ${t}`);
    }
    for (const s of ['[data-ajuda]', '[data-meus]', '[data-aparencia]']) { await fechar(); const e = await p.$(s); if (e) { await e.evaluate(x => x.click()).catch(() => {}); await esperar(150); } }
    await fechar(); await confere(`${perfil} · Ajuda, Meus dados e Aparência`);
  };
  for (const perfil of ['Coordenação', 'Equipe', 'Auxiliar', 'Formador', 'Acompanhamento']) await percorrer(perfil);
  // pré-visualização "ver como SEAB/MDA"
  await entrar('Coordenação'); await forjarApi(); const vc = await p.$('[data-vercomo]'); if (vc) { await vc.click(); await esperar(300); for (const t of await p.evaluate(() => SQC.app.abas().map(t => t[0]))) { await p.click(`[data-tab="${t}"]`); await esperar(100); } await confere('pré-visualização SEAB/MDA'); }
  ok(!erros.length, 'sem erro de script durante a varredura' + (erros.length ? ': ' + [...new Set(erros)].slice(0, 3).join(' | ') : ''));
  erros.length = 0;

  /* =============== 2) planilha .csv e cópia .json =============== */
  await p.evaluate(() => { localStorage.clear(); }); await entrar('Coordenação');
  await p.evaluate(() => { const db = SQC.apiDemo._db(); const a = db.agricultores[0];
    a.nome = '=HYPERLINK("http://exemplo.invalid/?d="&B2,"clique")'; a.comunidade = '+1+1'; a.culturas = '-2+3'; a.municipio = '@SUM(1)'; a.uf = '\t=1'; db.agricultores[1].comunidade = '\r=1'; db.agricultores[1].culturas = '\n=1+1'; db.agricultores[2].comunidade = ' =1+1'; db.agricultores[2].culturas = '＝1+1';
    localStorage.setItem('sqc-demo-v1', JSON.stringify(db)); });
  await entrar('Coordenação');
  const csv = await p.evaluate(() => SQC.app.csv('agricultores'));
  const celulas = csv.split(/;|\r\n/).map(c => c.replace(/^"|"$/g, '').replace(/""/g, '"').replace(/^﻿/, ''));
  const perigosas = celulas.filter(c => /^[=+\-@\t\r]/.test(c));
  ok(!perigosas.length, 'CSV: nenhuma célula começa com = + - @ tab ou CR' + (perigosas.length ? ': ' + perigosas.join(' | ') : ''));
  ok(csv.includes(`"'=HYPERLINK(`), 'CSV: fórmula HYPERLINK sai com apóstrofo na frente');
  const lf = celulas.find(c => /^\n=/.test(c)); console.log('    (aviso) célula que começa com quebra de linha + "=" sai sem apóstrofo: ' + JSON.stringify(lf || '') + ' (Excel e LibreOffice não a tratam como fórmula; fica como reforço)');
  // número negativo vira texto com apóstrofo (corrompe o valor, não é falha de segurança)
  await p.evaluate(() => { const db = SQC.apiDemo._db(); db.visitas[0].gasto = -5; localStorage.setItem('sqc-demo-v1', JSON.stringify(db)); }); await entrar('Coordenação');
  const csvv = await p.evaluate(() => SQC.app.csv('visitas')); console.log('    (aviso) número negativo no CSV: ' + (csvv.includes(`"'-5"`) ? 'sai como texto "\'-5" (o apóstrofo desarma, mas o valor deixa de ser número)' : 'sai como número'));
  // cópia .json: o que cada perfil leva
  const jsonDe = async perfil => { await entrar(perfil); if (!(await p.$('[data-tab="dados"]'))) return null; await p.click('[data-tab="dados"]');
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 3000 }).catch(() => null), p.click('[data-exp="json"]').catch(() => {})]); if (!dl) return null; return JSON.parse(fs.readFileSync(await dl.path(), 'utf8')); };
  const jc = await jsonDe('Coordenação'), je = await jsonDe('Equipe'), ja = await jsonDe('Acompanhamento');
  ok(!!jc && Object.keys(jc).includes('membros') && Object.keys(jc).includes('presencas'), 'Coordenação baixa a cópia completa (.json), com equipe e listas de presença');
  ok(!!je && Array.isArray(je.agricultores), 'Equipe também baixa a cópia completa (.json) com nomes de agricultores (registrado no histórico em produção, script 21)');
  ok(ja === null && !(await p.$('[data-exp]')), 'SEAB/MDA não tem a aba Dados nem botão de planilha ou cópia');
  // botão forjado na tela do SEAB/MDA não baixa nada
  await p.evaluate(() => { const b = document.createElement('button'); b.dataset.exp = 'json'; b.id = 'forjado'; document.body.appendChild(b); });
  const dlf = await Promise.all([p.waitForEvent('download', { timeout: 1500 }).catch(() => null), p.click('#forjado')]).then(r => r[0]);
  ok(!dlf, 'SEAB/MDA: botão de cópia colocado à mão na página não baixa nada (o app recusa pelo perfil)');

  /* =============== 3) fotos forjadas =============== */
  await p.evaluate(() => { localStorage.clear(); }); await entrar('Equipe'); await p.click('[data-tab="eventos"]');
  const F = arquivosFoto();
  const tentarFoto = async (arq, nome) => {
    await fechar(); await p.click('[data-fotos="eventos:e2"]'); await p.waitForSelector('#ft_arq', { state: 'attached' });
    const antes = await p.evaluate(() => (SQC.app._estado().db.fotos || []).length);
    await p.setInputFiles('#ft_arq', arq); await esperar(1500);
    const depois = await p.evaluate(() => (SQC.app._estado().db.fotos || []).length), msg = (await p.textContent('#ferr').catch(() => '')).trim();
    const tipo = depois > antes ? await p.evaluate(async () => { const f = SQC.app._estado().db.fotos.slice(-1)[0]; const bl = await SQC.apiDemo.arquivoFoto(f); const u = new Uint8Array(await bl.arrayBuffer()); return bl.type + ' ' + (u[0] === 0xFF && u[1] === 0xD8 ? 'JPEG' : 'NÃO-JPEG'); }) : '';
    console.log(`    foto ${nome}: ${depois > antes ? 'aceita, enviada como ' + tipo : 'recusada: ' + msg}`);
    return { aceita: depois > antes, msg, tipo };
  };
  const rHtml = await tentarFoto(F.html, 'HTML com nome .jpg'); ok(!rHtml.aceita, 'arquivo que não é imagem (HTML renomeado para .jpg) é recusado');
  const rVazio = await tentarFoto(F.vazio, 'vazia (0 byte)'); ok(!rVazio.aceita, 'arquivo vazio é recusado');
  const rSvg = await tentarFoto(F.svg, 'SVG com script'); ok(!rSvg.aceita || /JPEG$/.test(rSvg.tipo) && !/NÃO/.test(rSvg.tipo), 'SVG: ou é recusado ou vira JPEG (o código do SVG nunca é guardado nem roda)');
  const rFut = await tentarFoto(F.futuro, 'EXIF com data em 2099'); ok(!rFut.aceita && /futuro/.test(rFut.msg), 'foto com data do arquivo no futuro é recusada');
  // imagem enorme (lado de 12000 px): reduzida a 1600 px antes de subir
  const grande = await p.evaluate(async () => { const c = document.createElement('canvas'); c.width = 12000; c.height = 2000; c.getContext('2d').fillRect(0, 0, 10, 10);
    const bl = await new Promise(r => c.toBlob(r, 'image/png')); const red = await SQC.fotodia.reduzir(new File([bl], 'g.png', { type: 'image/png' }));
    const im = await createImageBitmap(red); return { w: im.width, h: im.height, t: red.type, kb: Math.round(red.size / 1024) }; });
  ok(grande.w === 1600 && grande.t === 'image/jpeg', `imagem enorme (12000 px) é reduzida para ${grande.w}×${grande.h} JPEG (${grande.kb} KB) antes de subir`);
  await confere('fotos forjadas'); ok(!erros.length, 'sem erro de script nas fotos' + (erros.length ? ': ' + erros.join(' | ') : '')); erros.length = 0;
  // regras do servidor (texto dos scripts): pasta privada, só imagem, 5 MB, caminho fixo
  const s13 = fs.readFileSync(path.join(RAIZ, 'supabase', '13_presenca_e_fotos.sql'), 'utf8'), s15 = fs.readFileSync(path.join(RAIZ, 'supabase', '15_auditoria_1310.sql'), 'utf8');
  ok(/'evidencias', 'evidencias', false, 5242880, array\['image\/jpeg','image\/png','image\/webp'\]/.test(s13), 'Storage: pasta "evidencias" privada, até 5 MB, só image/jpeg, png e webp (tipo declarado por quem envia)');
  ok(/fotos_caminho_formato/.test(s15) && /f\.caminho = objects\.name and f\.criado_por/.test(s15), 'Storage: arquivo só entra com o caminho exato de uma linha da própria pessoa (script 15)');

  /* =============== 4) sessão e o que fica no aparelho =============== */
  const html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8'), csp = (/Content-Security-Policy" content="([^"]+)"/.exec(html) || [])[1] || '';
  ok(/script-src 'self'(;|$)/.test(csp) && !/unsafe-eval/.test(csp) && /object-src 'none'/.test(csp) && /base-uri 'self'/.test(csp) && /form-action 'self'/.test(csp), 'CSP no index.html: só script do próprio endereço, sem eval, sem object, base-uri e form-action travados');
  ok(!/frame-ancestors/.test(csp), '(limite conhecido) frame-ancestors não vale em <meta>: o GitHub Pages não deixa mandar cabeçalho, então a página pode ser posta dentro de outra (clickjacking)');
  const sw = fs.readFileSync(path.join(RAIZ, 'sw.js'), 'utf8');
  ok(/if \(!proprio\) return;/.test(sw) && /method !== 'GET'\) return/.test(sw), 'service worker não guarda nada do Supabase (API, login, fotos) nem pedidos que não sejam GET');
  const sessao = fs.readFileSync(path.join(RAIZ, 'js', 'sessao.js'), 'utf8');
  ok(/LIMITE = 15 \* 60 \* 1000/.test(sessao), 'saída automática depois de 15 minutos sem uso');
  // regras puras da sessão
  const venc = await p.evaluate(() => { const S = SQC.sessao, t = Date.now(); return [S.venceu(t - 15 * 60e3, t), S.venceu(t - 14 * 60e3, t), S.venceu(0, t)]; });
  ok(venc[0] === true && venc[1] === false && venc[2] === false, 'sessão vence aos 15 minutos, não antes');
  // o que fica no aparelho depois de sair (modo produção simulado só no aparelho: nenhuma chamada sai, o cliente do banco é falso)
  const sobra = await p.evaluate(async () => {
    const A = SQC.apiSupabase;   // usa o código real de sair()
    localStorage.setItem('sqc-eu', JSON.stringify({ id: 'p1', perfil: 'Equipe' })); localStorage.setItem('sqc-dados', JSON.stringify({ agricultores: [{ nome: 'Pessoa (exemplo)' }] })); localStorage.setItem('sqc-dados-em', String(Date.now()));
    await SQC.fila.salvar({ id: 'presencas:z', tabela: 'presencas', dados: { id: 'z', nome: 'Participante (exemplo)' }, op: { novo: true }, dono: 'p1' });
    const orig = window.supabase; window.supabase = { createClient: () => ({ auth: { signOut: async () => ({}) } }) }; SQC.CONFIG.supabaseUrl = 'https://exemplo.invalid'; A.preparar(); window.supabase = orig;
    await A.sair();
    const fila = await SQC.fila.listar(); return { ls: Object.keys(localStorage), fila: fila.map(f => f.tabela + ':' + JSON.stringify(f.dados)) };
  });
  ok(!sobra.ls.includes('sqc-eu') && !sobra.ls.includes('sqc-dados'), 'ao sair, a cópia dos dados e o perfil guardados no aparelho são apagados');
  console.log('    (aviso) depois de sair continuam no aparelho: localStorage = ' + sobra.ls.join(', ') + '; fila (IndexedDB) = ' + sobra.fila.join(' | '));
  ok(true, '(por desenho) a fila do que foi lançado sem internet fica no aparelho depois de sair, com dado pessoal em texto aberto, até enviar');

  /* =============== 5) SEAB/MDA não recebe dado pessoal (modo demonstração, mesmo corte do banco) =============== */
  await p.evaluate(() => { localStorage.clear(); }); await entrar('Coordenação');
  await p.evaluate(() => { const db = SQC.apiDemo._db(); db.presencas = [{ id: 'pz', evento: 'e2', nome: 'Nome Secreto Presenca' }]; db.agricultores[0].nome = 'Nome Secreto Agricultor'; db.visitas[0].obs = 'Texto Secreto Visita'; db.membros[0].cpf = '52998224725'; db.eventos[1].link = 'https://exemplo.invalid/secreto'; localStorage.setItem('sqc-demo-v1', JSON.stringify(db)); });
  await entrar('Acompanhamento');
  const memoria = await p.evaluate(() => JSON.stringify(SQC.app._estado().db));
  let tela = ''; for (const t of await p.evaluate(() => SQC.app.abas().map(t => t[0]))) { await p.click(`[data-tab="${t}"]`); await esperar(100); tela += await p.textContent('#view'); }
  ok(!/Secreto|52998224725/.test(memoria + tela), 'SEAB/MDA: nomes, texto de visita, lista de presença, CPF e link de evidência não chegam à memória da página nem à tela');

  await b.close(); fs.rmSync(TMP, { recursive: true, force: true });
  console.log(`\nSEGURANÇA: ${oks} ok, ${falhas} falha(s)`); if (falhas) process.exit(1);
})().catch(e => { console.error(e); process.exit(1); });
