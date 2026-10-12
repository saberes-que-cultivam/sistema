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

test('auditoria 12/10: valor, data e situação da planilha lidos no padrão brasileiro', () => {
  const v = R.valorPlanilha, d = R.dataPlanilha, s = R.destinoStatus;
  assert.strictEqual(v('1.500'), 1500); assert.strictEqual(v('R$ 2.400'), 2400); assert.strictEqual(v('1.234.567'), 1234567);
  assert.strictEqual(v('1.234,56'), 1234.56); assert.strictEqual(v('120,5'), 120.5); assert.strictEqual(v(980.25), 980.25);
  assert.strictEqual(d('31/02/2026'), ''); assert.strictEqual(d('9/22/2026'), ''); assert.strictEqual(d('2026-13-01'), '');
  assert.strictEqual(d('05/10/2026'), '2026-10-05'); assert.strictEqual(d('2026-02-28'), '2026-02-28');
  assert.strictEqual(s('Não pago'), 'Comprometido'); assert.strictEqual(s('Devolvida para correção'), 'Comprometido'); assert.strictEqual(s('Aguardando pagamento'), 'Comprometido');
  assert.strictEqual(s('Cancelada'), 'Ignorar'); assert.strictEqual(s('Pago'), 'Pago'); assert.strictEqual(s('Pagamento'), 'Comprometido');
});
test('auditoria 12/10: linha nova num grupo já classificado herda rubrica e etapa; linha sem rubrica trava a gravação', () => {
  const db = { despesas: [{ id: 'x1', data: '2026-09-01', etapa: '3.3', rubrica: 'consumo', item: '', descricao: 'Compra · Kits', favorecido: 'Loja Exemplo', doc: 'Solicitação FUNCERN 100', valor: 10, status: 'Pago' }] };
  const sol = n => ({ sol: n, aba: 'A', tipo: 'Compra', beneficiario: 'Loja Exemplo', valor: 20, rubricaTxt: 'Serviços de Terceiros - PJ', sub: '', detalhe: 'Kits', statusTxt: 'Pago', data: '2026-10-01' });
  const P = R.planoImportacao(db, [sol('100'), sol('101')], {});
  const nova = P.linhas.find(l => l.s.sol === '101');
  assert.strictEqual(nova.reg.rubrica, 'consumo'); assert.strictEqual(nova.reg.etapa, '3.3'); assert.strictEqual(P.faltam, 0);
  const P2 = R.planoImportacao({ despesas: [] }, [sol('200')], {});
  assert.ok(P2.faltam > 0, 'sem rubrica reconhecida, a gravação não pode ser liberada');
});
test('auditoria 12/10: telefone do cadastro confere DDD e número', () => {
  const t = tel => R.validarDadosPessoais({ telefone: tel });
  assert.ok(t('abc')); assert.ok(t('12345'));
  assert.strictEqual(t('(84) 99999-0000'), ''); assert.strictEqual(t('84 3333-0000'), ''); assert.strictEqual(t('+55 84 99999-0000'), '');
});
