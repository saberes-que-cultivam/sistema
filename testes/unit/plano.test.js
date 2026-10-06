const test = require('node:test'); const assert = require('node:assert');
const { carregar } = require('./ambiente');
const SQC = carregar(), D = SQC.dados, R = SQC.regras;

test('o plano do TED fecha em R$ 400.000,00 por etapa', () => {
  assert.strictEqual(D.ETAPAS.reduce((s, e) => s + e.q * e.v, 0), 400000);
  assert.strictEqual(D.TOTAL, 400000);
});
test('valor de cada meta confere com o plano de trabalho pactuado', () => {
  assert.deepStrictEqual([1, 2, 3, 4, 5, 6].map(R.previstoMeta), [35000, 165000, 65000, 60000, 15000, 60000]);
});
test('as rubricas do plano universal fecham em R$ 400.000,00', () => {
  assert.strictEqual(D.RUBRICAS.reduce((s, r) => s + r.v, 0), 400000);
  assert.strictEqual(new Set(D.RUBRICAS.map(r => r.id)).size, D.RUBRICAS.length);
});
test('as parcelas somam o total e a recebida é a de R$ 200 mil', () => {
  assert.strictEqual(D.PARCELAS.reduce((s, p) => s + p.valor, 0), 400000);
  assert.strictEqual(R.recebido(), 200000);
});
test('toda etapa cabe na janela do cronograma e tem início antes do fim', () => {
  D.ETAPAS.forEach(e => { assert.ok(e.ini <= e.fim, e.id); assert.ok(e.ini + '-01' >= D.G0 && e.fim + '-01' < D.G1, e.id); });
});
test('o teto por unidade é o valor unitário da etapa 2.1', () => {
  assert.strictEqual(D.TETO_UNIDADE, D.ETAPAS.find(e => e.id === '2.1').v);
});
test('plano de desembolso: cada rubrica e o total batem com o orçamento do plano', () => {
  const it = D.DESEMBOLSO.itens; assert.ok(it.every(x => x.m.length === 12));
  D.RUBRICAS.forEach(r => assert.strictEqual(Math.round(it.filter(x => x.rubrica === r.id).reduce((s, x) => s + x.m.reduce((a, b) => a + b, 0), 0) * 100) / 100, r.v, r.nome));
  assert.strictEqual(Math.round(R.desembolsoMensal().reduce((a, b) => a + b, 0)), 400000);
});
test('ritmo do gasto: pagamento depois do último mês do plano não some do acumulado', () => {
  const X = R.ritmo({ despesas: [{ data: '2027-08-05', valor: 1000, status: 'Pago' }, { data: '2027-07-05', valor: 10, status: 'Pago' }] }, new Date(2027, 8, 1));
  assert.strictEqual(X.pontos[11].executado, 1010);
});
test('ritmo do gasto: acumulados por mês, só até o mês atual para pago e recebido', () => {
  const db = { despesas: [{ data: '2026-09-10', valor: 1000, status: 'Pago' }, { data: '2026-10-02', valor: 500, status: 'Pago' }, { data: '2026-10-03', valor: 900, status: 'Solicitado' }, { data: '2026-07-20', valor: 50, status: 'Pago' }] };
  const X = R.ritmo(db, new Date(2026, 9, 6)), p = X.pontos;
  assert.strictEqual(p.length, 12); assert.strictEqual(p[0].rotulo, 'ago/26'); assert.strictEqual(p[11].previsto, 400000); assert.strictEqual(p[0].previsto, 20000);
  assert.deepStrictEqual(p.slice(0, 4).map(x => x.executado), [50, 1050, 1550, null]);
  assert.deepStrictEqual(p.slice(0, 4).map(x => x.recebido), [0, 200000, 200000, null]);
  assert.ok(p[2].atual && !p[3].atual); assert.ok(X.tempo > 0.17 && X.tempo < 0.19);
  assert.strictEqual(R.tempoDecorrido(new Date(2026, 5, 1)), 0); assert.strictEqual(R.tempoDecorrido(new Date(2028, 0, 1)), 1);
});
