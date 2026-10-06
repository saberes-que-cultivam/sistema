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
