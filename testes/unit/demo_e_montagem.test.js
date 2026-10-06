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
