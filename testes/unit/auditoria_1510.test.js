/* Auditoria de 15/10/2026: regras novas da contagem das metas (decisões da coordenação) e o cronograma da equipe ao lado do plano de trabalho. */
const test = require('node:test'); const assert = require('node:assert');
const { carregar } = require('./ambiente');
const SQC = carregar(), R = SQC.regras, D = SQC.dados;
const CHECK_TUDO = Object.fromEntries(D.CHECK.map(c => [c[0], true]));
const vazio = () => ({ pessoas: [], unidades: [], itens: [], lotes: [], agricultores: [], distribuicoes: [], visitas: [], eventos: [], entregas: [], despesas: [], presencas: [] });
const e = id => D.ETAPAS.find(x => x.id === id);

test('Meta 2: só conta biofábrica com os 8 passos e que conta para a meta', () => {
  const db = vazio();
  db.unidades = [
    { id: 'a', sigla: 'AA', conta: 'Sim', funcionando: true },                 // marcada antes da regra, sem os passos: não conta
    { id: 'b', sigla: 'BB', conta: 'Sim', ...CHECK_TUDO },                     // completa: conta
    { id: 'c', sigla: 'CC', conta: 'Não', ...CHECK_TUDO }];                    // apoio: não conta
  assert.strictEqual(R.feito(db, e('2.1')), 1);
  assert.strictEqual(R.unidadePronta(db.unidades[0]), false);
});
test('Meta 2: a tela não deixa marcar "Em funcionamento" antes dos outros passos', () => {
  const db = vazio(), u = { id: 'n', sigla: 'NV', conta: 'Sim', local_ok: true, funcionando: true };
  assert.match(R.validar(db, 'unidades', u), /Falta: Parceiro institucional/);
  assert.match(R.validar(db, 'unidades', { ...u, ...CHECK_TUDO }), /Informe a data/);                         // 26: data obrigatória ao marcar
  assert.match(R.validar(db, 'unidades', { ...u, ...CHECK_TUDO, funcionando_em: '2099-01-01' }), /não pode ser no futuro/);
  assert.strictEqual(R.validar(db, 'unidades', { ...u, ...CHECK_TUDO, funcionando_em: '2026-09-01' }), '');
  const pronta = { id: 'p', sigla: 'PR', conta: 'Sim', ...CHECK_TUDO, funcionando_em: '2026-09-01' };
  assert.match(R.validar(db, 'unidades', { ...pronta, montada: false }, pronta), /Falta: Estrutura montada/);   // desmarcar passo de quem já funciona
  const antiga = { id: 'v', sigla: 'VE', conta: 'Sim', funcionando: true };
  assert.strictEqual(R.validar(db, 'unidades', { ...antiga, obs: 'x' }, antiga), '');                         // cadastro antigo continua editável
});
test('Meta 2 (26): conta a partir da data em que começou a funcionar; cadastro antigo sem data conta e vira aviso', () => {
  const db = vazio();
  db.unidades = [{ id: 'a', nome: 'Polo A', sigla: 'AA', conta: 'Sim', ...CHECK_TUDO, funcionando_em: '2026-12-10' },
    { id: 'b', nome: 'Polo B', sigla: 'BB', conta: 'Sim', ...CHECK_TUDO }];
  assert.strictEqual(R.feito(db, e('2.1'), '2026-11-30'), 1);   // relatório de novembro: só a antiga (sem data)
  assert.strictEqual(R.feito(db, e('2.1'), '2026-12-31'), 2);
  const av = R.alertas(db, new Date(2027, 0, 5)).filter(a => a[1] === 'Meta 2' && /falta a data/.test(a[3]));
  assert.strictEqual(av.length, 1); assert.match(av[0][3], /Polo B/);
  const r = { ...db.unidades[0], funcionando: false }; R.validar(db, 'unidades', r, db.unidades[0]);
  assert.strictEqual(r.funcionando_em, null);                   // desmarcou: a data sai junto
});
test('Metas 3 e 5: capacitação e dia de campo com data passada só contam com participantes ou lista de presença', () => {
  const db = vazio();
  db.eventos = [
    { id: 'e1', tipo: 'Capacitação', data: '2026-10-01', part: 20 },
    { id: 'e2', tipo: 'Capacitação', data: '2026-10-02' },                     // sem ninguém: pode não ter acontecido
    { id: 'e3', tipo: 'Capacitação', data: '2026-10-03', part: '' },
    { id: 'e4', tipo: 'Dia de campo', data: '2026-10-04' },
    { id: 'e5', tipo: 'Capacitação', data: '2099-01-01', part: 30 }];          // futura: planejada
  db.presencas = [{ id: 'p1', evento: 'e4', nome: 'Pessoa (fictícia)' }];
  assert.strictEqual(R.feito(db, e('3.2'), '2026-10-10'), 1);
  assert.strictEqual(R.feito(db, e('5.1'), '2026-10-10'), 1);                 // a lista de presença basta
  assert.strictEqual(R.indicadores(db, '2026-10-10').participantes, 20);
  const av = R.alertas(db, new Date(2026, 9, 10)).filter(a => a[1] === 'Atividade');
  assert.strictEqual(av.length, 2);                                            // e2 e e3; e4 tem presença, e5 é futura
  assert.match(av[0][3], /sem participantes registrados/);
});
test('cronograma da equipe: janelas dentro da vigência, ordem certa, metas válidas, sem valor em reais no texto', () => {
  const C = D.CRONOGRAMA_EQUIPE;
  assert.ok(C.fonte && C.itens.length >= 10);
  C.itens.forEach(([id, txt, ini, fim, metas]) => {
    assert.ok(ini <= fim, id); assert.ok(ini >= '2026-08-01' && fim <= '2027-07-31', id);
    assert.ok(metas.length && metas.every(m => D.METAS[m]), id); assert.ok(!/R\$/.test(txt), id);
  });
  D.ETAPAS.filter(x => x.eq).forEach(x => { assert.ok(x.eq.ini <= x.eq.fim, x.id); assert.ok(x.eq.ini >= D.G0.slice(0, 7) && x.eq.fim < D.G1.slice(0, 7), x.id); });
});
test('previsto: o do plano de trabalho não muda; o da equipe usa a janela dela só onde existe', () => {
  const hoje = new Date(2026, 11, 15);   // dez/2026
  assert.ok(R.previstoEtapa(e('4.1'), hoje) > 0);                     // TED: acompanhamento desde jul/2026
  assert.strictEqual(R.previstoEtapa(e('4.1'), hoje, 'equipe'), 0);   // equipe: só a partir de fev/2027
  assert.strictEqual(R.previstoEtapa(e('5.1'), hoje, 'equipe'), R.previstoEtapa(e('5.1'), hoje));   // sem janela da equipe: igual ao TED
  const X = R.execucaoGeral(vazio(), hoje);
  assert.ok(X.prevEq < X.prev, 'o cronograma da equipe começa depois: previsto menor');
  assert.ok(['concluida', 'andamento', 'atencao', 'atrasada'].includes(X.stEq));
});
test('territórios: Sertão do Apodi está na lista (cronograma da equipe atende Apodi)', () => {
  assert.ok(D.TERRITORIOS.includes('Sertão do Apodi/RN'));
});
test('documento das entregas (27): tipos aceitos, vazio e acima de 20 MB recusados', () => {
  assert.strictEqual(R.validarDocumento({ name: 'Relatório Final.PDF', size: 1000 }), '');
  assert.strictEqual(R.extDocumento('Relatório Final.PDF'), 'pdf');
  assert.match(R.validarDocumento({ name: 'planilha.exe', size: 10 }), /não é aceito/);
  assert.match(R.validarDocumento({ name: 'sem-extensao', size: 10 }), /não é aceito/);
  assert.match(R.validarDocumento({ name: 'vazio.docx', size: 0 }), /vazio/);
  assert.match(R.validarDocumento({ name: 'grande.pdf', size: 21 * 1024 * 1024 }), /20 MB/);
  assert.match(R.validarDocumento(null), /Escolha o arquivo/);
});
