/* Desempenho das contas do painel com volume. Uso: npm run test:desempenho
   Mede as funções que rodam a cada vez que uma tela é desenhada, no tamanho previsto do projeto (1x) e em 10x e 50x.
   Falha se alguma passar de 150 ms em 10x: acima disso a troca de aba começa a ser percebida num celular simples. */
const { carregar } = require('../unit/ambiente'); const SQC = carregar(), R = SQC.regras, D = SQC.dados;
function gerar(k) {
  const db = { pessoas: [], unidades: [], itens: [], lotes: [], agricultores: [], distribuicoes: [], visitas: [], eventos: [], entregas: [], despesas: [] };
  for (let i = 0; i < 3; i++) db.unidades.push({ id: 'u' + i, nome: 'Unidade ' + i, sigla: 'U' + 'ABC'[i], conta: i < 2 ? 'Sim' : 'Não' });
  for (let i = 0; i < 30 * k; i++) db.agricultores.push({ id: 'a' + i, nome: 'Pessoa ' + i, diag: '2026-08-10', gasto0: 100 + i % 200, kit: i % 2 === 0, kitdata: '2026-12-01', unidade: 'u' + i % 3 });
  for (let i = 0; i < 40 * k; i++) db.lotes.push({ id: 'l' + i, codigo: 'UA-CMP-' + i, unidade: 'u' + i % 3, tipo: 'Composto orgânico', inicio: '2026-08-01', dias: 90, qtd: 1000, med: 'kg', status: i % 4 ? 'Pronto' : 'Maturando' });
  const prontos = db.lotes.filter(l => l.status === 'Pronto');
  for (let i = 0; i < 300 * k; i++) db.distribuicoes.push({ id: 'd' + i, data: '2026-09-' + String(1 + i % 28).padStart(2, '0'), lote: prontos[i % prontos.length].id, agricultor: 'a' + i % (30 * k), qtd: 1 });
  for (let i = 0; i < 360 * k; i++) db.visitas.push({ id: 'v' + i, data: '2026-10-' + String(1 + i % 28).padStart(2, '0'), agricultor: 'a' + i % (30 * k), usou: 'Sim', gasto: 80 });
  for (let i = 0; i < 20 * k; i++) db.eventos.push({ id: 'e' + i, tipo: i % 2 ? 'Capacitação' : 'Reunião', data: '2026-11-01', part: 20, mulheres: 12 });
  for (let i = 0; i < 300 * k; i++) db.despesas.push({ id: 'x' + i, data: '2026-' + String(8 + i % 5).padStart(2, '0') + '-10', etapa: D.ETAPAS[i % 11].id, rubrica: D.RUBRICAS[i % 9].id, valor: 50, status: i % 3 ? 'Pago' : 'Solicitado' });
  return db;
}
const hoje = new Date(2027, 1, 15); let pior10 = 0;
const medir = (nome, f) => { f(); const n = 5, t = process.hrtime.bigint(); for (let i = 0; i < n; i++) f(); return Number(process.hrtime.bigint() - t) / 1e6 / n; };
console.log('função'.padEnd(34), '1x'.padStart(9), '10x'.padStart(9), '50x'.padStart(9), '  (ms por chamada)');
const dbs = [1, 10, 50].map(gerar);
[['painel: alertas', db => R.alertas(db, hoje)], ['painel: execução física', db => R.execucaoGeral(db, hoje)], ['painel: indicadores da Meta 5', db => R.indicadores(db)],
  ['financeiro: por meta e rubrica', db => { R.fin(db); R.finRubrica(db); }], ['financeiro: ritmo do gasto', db => R.ritmo(db, hoje)],
  ['lotes: saldo de todos os lotes', db => db.lotes.forEach(l => R.saldo(db, l))], ['unid. produtivas: acompanhadas', db => db.agricultores.forEach(a => R.acompanhada(db, a))],
  ['validar 1 entrega', db => R.validar(db, 'distribuicoes', { id: 'n', data: '2026-10-01', lote: db.lotes.find(l => l.status === 'Pronto').id, agricultor: 'a1', qtd: 1 })]]
  .forEach(([nome, f]) => { const t = dbs.map(db => medir(nome, () => f(db))); pior10 = Math.max(pior10, t[1]); console.log(nome.padEnd(34), ...t.map(x => x.toFixed(2).padStart(9))); });
console.log('\nregistros em 10x:', Object.entries(dbs[1]).map(([k, v]) => k + ' ' + v.length).filter(x => !/ 0$/.test(x)).join(', '));
if (pior10 > 150) { console.error('LENTO: ' + pior10.toFixed(0) + ' ms em 10x'); process.exit(1); }
console.log('DESEMPENHO DAS CONTAS: DENTRO DO LIMITE (pior caso em 10x: ' + pior10.toFixed(1) + ' ms)');
