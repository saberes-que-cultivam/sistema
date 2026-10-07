const test = require('node:test'); const assert = require('node:assert'); const fs = require('fs'); const path = require('path');
const { carregar } = require('./ambiente');
const SQC = carregar(), D = SQC.dados, R = SQC.regras;
/* planilha fictícia (nomes de exemplo), no mesmo formato da exportação de solicitações da FUNCERN */
const lerExemplo = async () => { const b = fs.readFileSync(path.join(__dirname, 'dados', 'solicitacoes_exemplo.xlsx')); return SQC.planilha.ler(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)); };

test('lê o .xlsx sem biblioteca: duas abas, títulos e células', async () => {
  const abas = await lerExemplo();
  assert.strictEqual(abas.length, 2); assert.strictEqual(abas[0].linhas[0][0], 'ID Solicitação'); assert.strictEqual(abas[0].linhas.length, 5);
  assert.strictEqual(abas[0].linhas[4][3], 'Empresa Exemplo Ltda & Cia');
});
test('solicitações: valor e data nos dois formatos; o CPF não é guardado em lugar nenhum', async () => {
  const { sols, erros } = R.lerSolicitacoes(await lerExemplo());
  assert.strictEqual(erros.length, 0); assert.strictEqual(sols.length, 4);
  assert.strictEqual(sols[3].valor, 1250.5); assert.strictEqual(sols[3].data, '2026-10-05');
  assert.doesNotMatch(JSON.stringify(sols), /000\.000\.000-00|cpf/i);
});
test('plano da importação: cancelada não entra, DOA vai para a rubrica e a etapa da fundação, bolsa pede a etapa', async () => {
  const { sols } = R.lerSolicitacoes(await lerExemplo()), P = R.planoImportacao({ despesas: [] }, sols);
  assert.strictEqual(P.novas, 3); assert.strictEqual(P.ignoradas, 1);
  const doa = P.linhas.find(l => l.s.sol === '90002').reg; assert.strictEqual(doa.rubrica, 'doa'); assert.strictEqual(doa.etapa, '6.3'); assert.strictEqual(doa.item, 'i15');
  const bolsa = P.linhas.find(l => l.s.sol === '90001').reg; assert.strictEqual(bolsa.rubrica, 'bolsa_pesquisador'); assert.strictEqual(bolsa.item, 'i01'); assert.strictEqual(bolsa.etapa, '');
  assert.strictEqual(P.faltam, 2);   // bolsa do coordenador e combustível ainda sem etapa
  assert.strictEqual(P.linhas.find(l => l.s.sol === '90004').reg.status, 'Pago');
  assert.strictEqual(bolsa.status, 'Solicitado');   // "Pagamento" conta como comprometido até a coordenação dizer o contrário
});
test('subir a mesma planilha de novo não duplica; mudar o status atualiza; cancelar remove', async () => {
  const { sols } = R.lerSolicitacoes(await lerExemplo()), esc = { etapa: {} };
  let P = R.planoImportacao({ despesas: [] }, sols); P.grupos.forEach(g => { esc.etapa[g.chave] = g.etapa || '6.2'; });
  P = R.planoImportacao({ despesas: [] }, sols, esc); assert.strictEqual(P.faltam, 0);
  const db = { despesas: P.linhas.filter(l => l.reg).map((l, i) => ({ ...l.reg, id: 'd' + i })) };
  P.linhas.filter(l => l.reg).forEach(l => assert.ok(!R.validar({ despesas: [] }, 'despesas', l.reg), l.s.sol));
  let P2 = R.planoImportacao(db, sols); assert.strictEqual(P2.novas, 0); assert.strictEqual(P2.atualizadas, 0); assert.strictEqual(P2.iguais, 3); assert.strictEqual(P2.faltam, 0);
  P2 = R.planoImportacao(db, sols, { status: { Pagamento: 'Pago' } }); assert.strictEqual(P2.atualizadas, 2);
  P2 = R.planoImportacao(db, sols, { status: { Pagamento: 'Ignorar' } }); assert.strictEqual(P2.removidas, 2);
});
