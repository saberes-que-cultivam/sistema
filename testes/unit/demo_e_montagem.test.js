const test = require('node:test'); const assert = require('node:assert');
const fs = require('fs'); const path = require('path'); const { execFileSync } = require('child_process');
const { carregar } = require('./ambiente');
const raiz = path.join(__dirname, '..', '..');

test('js/tudo.js está em dia com os arquivos de js/', () => {
  execFileSync('node', [path.join(raiz, 'ferramentas', 'montar.js'), '--conferir']);
});
test('o service worker guarda arquivos que existem e a página carrega config + tudo', () => {
  const sw = fs.readFileSync(path.join(raiz, 'sw.js'), 'utf8'); const lista = eval(sw.match(/const ARQUIVOS = (\[[^\]]+\])/)[1]);
  lista.filter(f => f !== './').forEach(f => assert.ok(fs.existsSync(path.join(raiz, f)), 'falta ' + f));
  const html = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8'); assert.match(html, /js\/config\.js/); assert.match(html, /js\/tudo\.js/);
  assert.doesNotMatch(html, /<script(?![^>]*src=)/, 'script dentro da página quebra a política de conteúdo');
});
test('nenhum arquivo do repositório aponta para o banco do Mulheres & Quintais nem guarda chave secreta', () => {
  const ver = d => fs.readdirSync(d, { withFileTypes: true }).forEach(e => { if (e.name === '.git' || e.name === 'node_modules' || e.name === 'vendor' || e.name === 'tudo.js') return; const p = path.join(d, e.name);
    if (e.isDirectory()) return ver(p); if (!/\.(js|html|sql|md|json|css|sh|webmanifest)$/.test(e.name) || p === __filename) return; const t = fs.readFileSync(p, 'utf8');
    assert.doesNotMatch(t, /tgdfhdwdobsrjvvixhem/, p); assert.doesNotMatch(t, /sb_secret_|service_role['"]?\s*[:=]\s*['"]ey/, p); });
  ver(raiz);
});
test('demonstração: perfis, código do lote, travas e exclusão', async () => {
  const SQC = carregar(), api = SQC.apiDemo; api._zerar();
  assert.strictEqual(await api.iniciar(), null);
  let eu = await api.entrarDemo('Equipe'); assert.strictEqual(eu.perfil, 'Equipe');
  await assert.rejects(api.salvar('despesas', { id: 'x9', data: '2026-10-01', etapa: '3.1', rubrica: 'consumo', descricao: 'x', valor: 1, status: 'Pago' }), /permissão/);
  const lote = await api.salvar('lotes', { id: 'n1', unidade: 'u3', tipo: 'Húmus de minhoca', inicio: '2026-09-01', dias: 60, qtd: 10, med: 'kg', status: 'Pronto' });
  assert.strictEqual(lote.codigo, 'APO-HUM-002'); assert.strictEqual(lote.criado_por, eu.id);
  await assert.rejects(api.salvar('distribuicoes', { id: 'n2', data: '2026-10-01', lote: 'n1', agricultor: 'a1', qtd: 11 }), /só tem 10 kg/);
  await api.salvar('distribuicoes', { id: 'n2', data: '2026-10-01', lote: 'n1', agricultor: 'a1', qtd: 10 });
  await assert.rejects(api.excluir('lotes', 'n1'), e => e.code === '23503');
  await assert.rejects(api.excluir('lotes', 'l2'), /Só a coordenação/);     // exemplo não foi lançado por ela
  await api.excluir('distribuicoes', 'n2'); await api.excluir('lotes', 'n1');
  eu = await api.entrarDemo('Coordenação');
  await api.salvar('despesas', { id: 'x9', data: '2026-10-01', etapa: '3.1', rubrica: 'consumo', descricao: 'x', valor: 1, status: 'Pago' });
  await api.apagarExemplos(); const db = await api.carregar();
  assert.ok(!db.lotes.length && !db.agricultores.length && !db.visitas.length); assert.strictEqual(db.unidades.length, 3); assert.strictEqual(db.despesas.length, 1);
});
test('fila do aparelho: envia na ordem, para na falta de rede, guarda o erro de regra', async () => {
  const SQC = carregar(), F = SQC.fila; const enviados = [];
  await F.salvar({ id: F.chave('lotes', '1'), tabela: 'lotes', dados: { id: '1' }, dono: 'p' }); await new Promise(r => setTimeout(r, 3));
  await F.salvar({ id: F.chave('distribuicoes', '2'), tabela: 'distribuicoes', dados: { id: '2' }, dono: 'p' }); await new Promise(r => setTimeout(r, 3));
  await F.salvar({ id: F.chave('visitas', '3'), tabela: 'visitas', dados: { id: '3' }, dono: 'outra' });
  let r = await F.sincronizar({ salvar: async () => { const e = new Error('rede'); e.semRede = true; throw e; } }, 'p');
  assert.deepStrictEqual(r, { enviados: 0, erros: 0 }); assert.strictEqual((await F.listar('p')).length, 2);
  r = await F.sincronizar({ salvar: async (t, d) => { if (t === 'distribuicoes') throw new Error('O lote só tem 3 kg de saldo.'); enviados.push(t + d.id); } }, 'p');
  assert.deepStrictEqual(enviados, ['lotes1']); assert.deepStrictEqual(r, { enviados: 1, erros: 1 });
  const resto = await F.listar('p'); assert.strictEqual(resto.length, 1); assert.match(resto[0].erro, /3 kg/);
  assert.strictEqual((await F.listar('outra')).length, 1);
});
test('a política de conteúdo da página só deixa falar com o Supabase do config.js', () => {
  const html = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8'), cfg = fs.readFileSync(path.join(raiz, 'js', 'config.js'), 'utf8');
  const host = (cfg.match(/supabaseUrl:\s*'https:\/\/([^']+)'/) || [])[1]; assert.ok(host, 'config.js sem supabaseUrl');
  assert.ok(html.includes('https://' + host) && html.includes('wss://' + host), 'index.html: connect-src não tem o endereço do config.js');
  assert.doesNotMatch(html, /\*\.supabase\.co/);
});
test('demonstração: quem acompanha (SEAB/MDA) não recebe nome de agricultor nem texto de visita e não grava', async () => {
  const SQC = carregar(), api = SQC.apiDemo; api._zerar(); await api.entrarDemo('Acompanhamento'); const db = await api.carregar();
  assert.strictEqual(db.agricultores.length, 3); assert.ok(db.agricultores.every(a => /^Unidade produtiva \d\d$/.test(a.nome) && !('comunidade' in a) && !('culturas' in a)));
  assert.ok(db.visitas.every(v => !('obs' in v) && !('tecnico' in v) && !('problemas' in v))); assert.strictEqual(db.pessoas.length, 1);
  assert.ok(!JSON.stringify(db).includes('Maria das Dores'));
  await assert.rejects(api.salvar('eventos', { id: 'z', tipo: 'Reunião', data: '2026-10-01', tema: 'x' }), /permissão/);
  assert.strictEqual(SQC.regras.feito(db, SQC.dados.ETAPAS.find(e => e.id === '4.1')), 1);   // as contas do painel continuam fechando
});
test('mapa: contorno dos dois estados e todos os municípios do CE e do RN, com os do projeto no lugar certo', () => {
  delete globalThis.SQC; const g = path.join(raiz, 'js', 'geo.js'); delete require.cache[require.resolve(g)]; require(g); const G = globalThis.SQC.GEO;
  assert.deepStrictEqual(Object.keys(G.uf).sort(), ['CE', 'RN']); assert.ok(G.uf.CE.r[0].length > 100 && G.uf.RN.r[0].length > 100);
  const ms = Object.keys(G.mun); assert.strictEqual(ms.filter(k => k.endsWith('/CE')).length, 184); assert.strictEqual(ms.filter(k => k.endsWith('/RN')).length, 167);
  ['apodi/RN', 'sao paulo do potengi/RN', 'mulungu/CE'].forEach(k => { const p = G.mun[k], b = G.uf[k.slice(-2)].b; assert.ok(p && p[0] >= b[0] && p[0] <= b[2] && p[1] >= b[1] && p[1] <= b[3], k); });
});
test('tipografia: nenhum tamanho de letra solto no CSS (tudo sai da escala --t-*), e só Manrope e Lora', () => {
  const css = fs.readFileSync(path.join(raiz, 'css', 'app.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const soltos = (css.match(/font(-size)?:[^;}]*/g) || []).filter(d => /\d(px|pt|rem|em)\b/.test(d.replace(/var\([^)]*\)/g, '')));
  assert.deepStrictEqual(soltos, [], 'use var(--t-...) em vez de tamanho solto');
  const escala = css.match(/--t-(2xs|xs|sm|md|base|lg|xl|2xl|3xl):\s*(\d+)px/g).map(x => +x.match(/(\d+)px/)[1]);
  assert.deepStrictEqual(escala, [12, 12, 13, 14, 15, 16, 18, 22, 28]); assert.ok(Math.min(...escala) >= 12);
  const html = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8'); assert.match(html, /family=Lora:wght@600;700&family=Manrope:wght@400;500;600;700;800&display=swap/); assert.match(html, /rel="preconnect" href="https:\/\/fonts\.googleapis\.com"/);
  assert.doesNotMatch(css + html, /DM Serif|Plus Jakarta|Bricolage|Figtree|IBM Plex/);
  assert.doesNotMatch(fs.readFileSync(path.join(raiz, 'js', 'app.js'), 'utf8'), /font-size|style="[^"]*font/, 'tamanho de letra não se define nas telas');
});
