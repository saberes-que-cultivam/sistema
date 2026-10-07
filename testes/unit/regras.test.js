const test = require('node:test'); const assert = require('node:assert');
const { carregar } = require('./ambiente');
const SQC = carregar(), R = SQC.regras;
const HOJE = new Date(2026, 9, 6);   // 06/10/2026
const base = () => ({ pessoas: [], unidades: [{ id: 'u1', nome: 'Polo A', sigla: 'PA', conta: 'Sim' }, { id: 'u2', nome: 'Apoio', sigla: 'AP', conta: 'Não', funcionando: true }], itens: [],
  lotes: [{ id: 'l1', codigo: 'PA-HUM-001', unidade: 'u1', tipo: 'Húmus de minhoca', inicio: '2026-08-01', dias: 60, qtd: 100, med: 'kg', status: 'Pronto' },
    { id: 'l2', codigo: 'PA-BIO-001', unidade: 'u1', tipo: 'Biofertilizante líquido', inicio: '2026-08-01', dias: 30, qtd: 50, med: 'L', status: 'Maturando' }],
  agricultores: [{ id: 'a1', nome: 'A', diag: '2026-08-10', gasto0: 200 }, { id: 'a2', nome: 'B', diag: '', gasto0: 0 }],
  distribuicoes: [{ id: 'd1', data: '2026-08-20', lote: 'l1', agricultor: 'a1', qtd: 30 }], visitas: [], eventos: [], entregas: [], despesas: [] });

test('saldo do lote desconta o distribuído', () => { const db = base(); assert.strictEqual(R.saldo(db, db.lotes[0]), 70); });
test('distribuição: não passa do saldo, e editar a própria entrega não conta ela duas vezes', () => {
  const db = base();
  assert.match(R.validar(db, 'distribuicoes', { id: 'n', data: '2026-09-01', lote: 'l1', agricultor: 'a1', qtd: 71 }), /só tem 70 kg/);
  assert.strictEqual(R.validar(db, 'distribuicoes', { id: 'n', data: '2026-09-01', lote: 'l1', agricultor: 'a1', qtd: 70 }), '');
  assert.strictEqual(R.validar(db, 'distribuicoes', { id: 'd1', data: '2026-08-20', lote: 'l1', agricultor: 'a1', qtd: 100 }), '');
});
test('distribuição: só de lote pronto e nunca antes do início do preparo', () => {
  const db = base();
  assert.match(R.validar(db, 'distribuicoes', { id: 'n', data: '2026-09-01', lote: 'l2', agricultor: 'a1', qtd: 1 }), /não está marcado como pronto/);
  assert.match(R.validar(db, 'distribuicoes', { id: 'n', data: '2026-07-01', lote: 'l1', agricultor: 'a1', qtd: 1 }), /anterior ao início/);
});
test('lote: quantidade não fica menor que o distribuído; distribuído não deixa de estar pronto', () => {
  const db = base(), l = db.lotes[0];
  assert.match(R.validar(db, 'lotes', { ...l, qtd: 20 }, l), /menor do que o já distribuído/);
  assert.match(R.validar(db, 'lotes', { ...l, status: 'Maturando' }, l), /não pode deixar de estar pronto/);
});
test('código do lote: sigla + tipo + sequência, sem repetir depois de exclusão', () => {
  const db = base();
  assert.strictEqual(R.codigoLote(db, { id: 'n', unidade: 'u1', tipo: 'Húmus de minhoca' }), 'PA-HUM-002');
  db.lotes.push({ id: 'l9', codigo: 'PA-HUM-007', unidade: 'u1', tipo: 'Húmus de minhoca' });
  assert.strictEqual(R.codigoLote(db, { id: 'n', unidade: 'u1', tipo: 'Húmus de minhoca' }), 'PA-HUM-008');
  assert.strictEqual(R.codigoLote(db, { id: 'n', unidade: 'u1', tipo: 'Bokashi' }), 'PA-BOK-001');
});
test('execução física: unidade de apoio não conta na Meta 2; acompanhada exige entrega E visita', () => {
  const db = base(), e = id => SQC.dados.ETAPAS.find(x => x.id === id);
  assert.strictEqual(R.feito(db, e('2.1')), 0);
  db.unidades[0].funcionando = true; assert.strictEqual(R.feito(db, e('2.1')), 1);
  assert.strictEqual(R.feito(db, e('4.1')), 0);
  db.visitas.push({ id: 'v1', data: '2026-09-25', agricultor: 'a1', usou: 'Sim', gasto: 150 });
  assert.strictEqual(R.feito(db, e('4.1')), 1);
  db.eventos.push({ tipo: 'Capacitação' }, { tipo: 'Reunião' }, { tipo: 'Dia de campo' });
  assert.strictEqual(R.feito(db, e('3.2')), 1); assert.strictEqual(R.feito(db, e('5.1')), 1);
  db.entregas.push({ etapa: '6.1' }, { etapa: '6.1' }); assert.strictEqual(R.feito(db, e('6.1')), 2);
});
test('financeiro por meta e por rubrica: pago x comprometido, e os totais batem entre si', () => {
  const db = base();
  db.despesas.push({ data: '2026-09-01', etapa: '3.1', rubrica: 'servicos_pj', valor: 1800, status: 'Pago' }, { data: '2026-09-10', etapa: '6.1', rubrica: 'consumo', valor: 2400, status: 'Em compras na FUNCERN' }, { data: '2026-10-01', etapa: '6.3', rubrica: 'doa', valor: 40000, status: 'Solicitado' });
  const F = R.fin(db), FR = R.finRubrica(db);
  assert.strictEqual(F[2].pago, 1800); assert.strictEqual(F[5].comp, 42400); assert.strictEqual(F[5].saldo, 60000 - 42400);
  assert.strictEqual(R.soma(F, 'pago') + R.soma(F, 'comp'), R.soma(FR, 'pago') + R.soma(FR, 'comp'));
  assert.strictEqual(R.soma(FR, 'prev'), 400000);
  assert.strictEqual(FR.find(r => r.id === 'doa').saldo, 0);
  assert.strictEqual(R.soma(R.fin(db, '2026-09-05'), 'pago') + R.soma(R.fin(db, '2026-09-05'), 'comp'), 1800);
});
test('alertas: rubrica estourada, despesa sem rubrica, gasto acima do recebido, linha de base faltando', () => {
  const db = base();
  db.despesas.push({ data: '2026-09-01', etapa: '2.1', rubrica: 'equipamentos', valor: 9301, status: 'Pago' }, { data: '2026-09-01', etapa: '2.1', rubrica: '', valor: 10, status: 'Pago' });
  let txt = R.alertas(db, HOJE).map(a => a[1] + ': ' + a[2]).join('\n');
  assert.match(txt, /Máquinas e equipamentos: R\$ 1,00 acima/); assert.match(txt, /sem rubrica/); assert.match(txt, /1 unidade\(s\) produtiva\(s\) sem diagnóstico/);
  assert.doesNotMatch(txt, /acima do que já foi recebido/);
  db.despesas.push({ data: '2026-09-01', etapa: '2.1', rubrica: 'servicos_pj', valor: 195000, status: 'Solicitado' });
  txt = R.alertas(db, HOJE).map(a => a[2]).join('\n'); assert.match(txt, /acima do que já foi recebido/);
});
test('alertas: entrega sem visita há mais de 30 dias; lote que passou da previsão; etapa vencida', () => {
  const db = base(); const txt = d => R.alertas(db, d).map(a => a[2]).join('\n');
  assert.match(txt(HOJE), /A: recebeu bioinsumo em 20\/08\/2026 e não teve visita depois/);
  assert.match(txt(HOJE), /PA-BIO-001: passou da previsão \(31\/08\/2026\)/);
  db.visitas.push({ id: 'v', data: '2026-09-30', agricultor: 'a1', usou: 'Sim' });
  assert.doesNotMatch(txt(HOJE), /não teve visita depois/);
  assert.doesNotMatch(txt(HOJE), /Etapa 2\.1 venceu/);
  assert.match(txt(new Date(2027, 1, 1)), /Etapa 2\.1 venceu em 01\/2027 com 0 de 2/);
});
test('indicadores da Meta 5: só compara quem tem linha de base e visita com gasto', () => {
  const db = base();
  assert.strictEqual(R.indicadores(db).variacao, null);
  db.visitas.push({ id: 'v', data: '2026-09-30', agricultor: 'a1', usou: 'Sim', gasto: 150 }, { id: 'w', data: '2026-09-30', agricultor: 'a2', usou: 'Não', gasto: 90 });
  const I = R.indicadores(db); assert.strictEqual(I.pares, 1); assert.strictEqual(I.variacao, -25); assert.strictEqual(I.usou, 1); assert.strictEqual(I.visitas, 2);
});
test('validações de cadastro: sigla, mulheres, kit, despesa, e-mail e última coordenação', () => {
  const db = base();
  assert.match(R.validar(db, 'unidades', { id: 'n', sigla: 'A1' }), /2 a 4 letras/);
  assert.match(R.validar(db, 'unidades', { id: 'n', sigla: 'pa' }), /Já existe/);
  assert.match(R.validar(db, 'eventos', { part: 5, mulheres: 6 }), /mulheres/);
  assert.match(R.validar(db, 'agricultores', { kit: true, kitdata: '' }), /data da entrega do kit/);
  assert.match(R.validar(db, 'despesas', { valor: 10, etapa: '3.1', rubrica: '' }), /rubrica/);
  assert.match(R.validar(db, 'despesas', { valor: 0, etapa: '3.1', rubrica: 'consumo' }), /valor/);
  db.pessoas.push({ id: 'p1', email: 'c@x.br', perfil: 'Coordenação', ativo: true });
  assert.match(R.validar(db, 'pessoas', { id: 'p2', email: 'C@X.br', perfil: 'Equipe' }), /Já existe/);
  assert.match(R.validar(db, 'pessoas', { id: 'p1', email: 'c@x.br', perfil: 'Coordenação', ativo: false }, db.pessoas[0]), /pelo menos um acesso de coordenação/);
});
test('permissões: equipe não grava despesa nem acesso e só exclui o que lançou; pessoa inativa não faz nada', () => {
  const c = { id: 'c', perfil: 'Coordenação' }, e = { id: 'e', perfil: 'Equipe' }, x = { id: 'x', perfil: 'Coordenação', ativo: false };
  assert.ok(R.podeGravar(c, 'despesas')); assert.ok(!R.podeGravar(e, 'despesas')); assert.ok(!R.podeGravar(e, 'pessoas')); assert.ok(R.podeGravar(e, 'visitas'));
  assert.ok(!R.podeGravar(x, 'visitas')); assert.ok(!R.podeGravar(null, 'visitas'));
  assert.ok(R.podeExcluir(c, 'visitas', { criado_por: 'e' })); assert.ok(R.podeExcluir(e, 'visitas', { criado_por: 'e' })); assert.ok(!R.podeExcluir(e, 'visitas', { criado_por: 'c' }));
  assert.ok(!R.podeExcluir(e, 'despesas', { criado_por: 'e' })); assert.ok(!R.podeExcluir(c, 'pessoas', {}));
  const m = { id: 'm', perfil: 'Acompanhamento' };   // SEAB/MDA: só leitura
  ['visitas', 'lotes', 'despesas', 'pessoas', 'eventos'].forEach(t => { assert.ok(!R.podeGravar(m, t), t); assert.ok(!R.podeExcluir(m, t, { criado_por: 'm' }), t); });
});
test('registro em uso não é excluído', () => {
  const db = base(); assert.deepStrictEqual(R.emUso(db, 'lotes', 'l1'), ['distribuicoes']); assert.deepStrictEqual(R.emUso(db, 'lotes', 'l2'), []); assert.deepStrictEqual(R.emUso(db, 'unidades', 'u1'), ['lotes']);
});
test('mensagens do servidor viram português claro', () => {
  assert.match(R.mensagemErro({ message: 'Invalid login credentials' }), /E-mail ou senha incorretos/);
  assert.match(R.mensagemErro({ code: '42501', message: 'new row violates row-level security policy' }), /não tem permissão/);
  assert.strictEqual(R.mensagemErro({ code: 'P0001', message: 'O lote X só tem 3 kg de saldo.' }), 'O lote X só tem 3 kg de saldo.');
});
test('execução física: pesa pelo valor de cada etapa e compara com o previsto do cronograma', () => {
  const db = base(); let X = R.execucaoGeral(db, HOJE);
  assert.strictEqual(X.real, 0); assert.strictEqual(X.mes, 4); assert.strictEqual(X.meses, 13); assert.strictEqual(X.ate, '09/2026'); assert.strictEqual(X.st, 'atrasada');
  db.entregas.push({ etapa: '6.3' });                       // contrato com a FUNCERN: R$ 40 mil de R$ 400 mil
  X = R.execucaoGeral(db, HOJE); assert.strictEqual(X.real, 10); assert.strictEqual(Math.round(X.porMeta[5].feito), 67);
  db.entregas.push({ etapa: '6.3' }); assert.strictEqual(R.execucaoGeral(db, HOJE).real, 10);   // não passa de 100% da etapa
  const e = id => SQC.dados.ETAPAS.find(x => x.id === id);
  assert.strictEqual(R.previstoEtapa(e('2.1'), HOJE), 2 / 6);   // ago e set completos, de 6 meses
  assert.strictEqual(R.previstoEtapa(e('3.2'), HOJE), 0); assert.strictEqual(R.previstoEtapa(e('2.1'), new Date(2027, 5, 1)), 1);
  assert.strictEqual(Math.round(R.execucaoGeral(db, new Date(2027, 7, 15)).prev), 100);
});
test('auditoria 06/10: linha de base vazia não vira zero; dia previsto e último dia do mês não são atraso', () => {
  const db = base(); db.agricultores = [{ id: 'a1', nome: 'A', diag: '2026-08-10', gasto0: '' }, { id: 'a2', nome: 'B', diag: '2026-08-10', gasto0: 200 }];
  db.visitas = [{ id: 'v1', data: '2026-09-30', agricultor: 'a1', usou: 'Sim', gasto: 50 }, { id: 'v2', data: '2026-09-30', agricultor: 'a2', usou: 'Sim', gasto: 150 }];
  const I = R.indicadores(db); assert.strictEqual(I.pares, 1); assert.strictEqual(I.base, 200); assert.strictEqual(I.variacao, -25);
  const txt = d => R.alertas(base(), d).map(a => a[2]).join('\n');
  assert.doesNotMatch(txt(new Date(2026, 7, 31, 10)), /PA-BIO-001: passou da previsão/);     // 31/08: é o próprio dia previsto
  assert.match(txt(new Date(2026, 8, 1, 0, 1)), /PA-BIO-001: passou da previsão/);
  assert.doesNotMatch(txt(new Date(2027, 0, 31, 10)), /Etapa 2\.1 venceu/);                    // último dia de jan/2027, 10h
  assert.match(txt(new Date(2027, 1, 1, 0, 1)), /Etapa 2\.1 venceu/);
});
test('auditoria 06/10: validações que faltavam (inteiros, mulheres sem total, lote e entrega)', () => {
  const db = base(), l = db.lotes[0];
  assert.match(R.validar(db, 'eventos', { part: 2.5, mulheres: 1 }), /inteiros/);
  assert.match(R.validar(db, 'eventos', { part: '', mulheres: 3 }), /total de participantes/);
  assert.strictEqual(R.validar(db, 'eventos', { part: '', mulheres: '' }), '');
  assert.match(R.validar(db, 'lotes', { ...l, dias: 1.5 }, l), /inteiro/);
  assert.match(R.validar(db, 'lotes', { ...l, tipo: 'Bokashi' }, l), /não muda de unidade nem de tipo/);
  assert.match(R.validar(db, 'lotes', { ...l, inicio: '2026-07-01' }, l), /medida e a data de início não mudam/);
  assert.strictEqual(R.validar(db, 'lotes', { ...db.lotes[1], inicio: '2026-07-01' }, db.lotes[1]), '');   // sem distribuição pode
  assert.match(R.validar(db, 'distribuicoes', { id: 'n', data: '2999-01-01', lote: 'l1', agricultor: 'a1', qtd: 1 }), /futuro/);
});
test('CPF: confere os dígitos; aceita com ou sem pontuação; recusa sequência repetida', () => {
  assert.ok(R.cpfValido('529.982.247-25')); assert.ok(R.cpfValido('52998224725'));
  ['529.982.247-26', '111.111.111-11', '123', '', '1234567890a'].forEach(c => assert.ok(!R.cpfValido(c), c));
});
test('cadastro da equipe: documento guardado só com números; questionário não respondido é apagado', () => {
  const r = R.normalizarMembro({ cpf: '529.982.247-25', cep: '59700-000', uf: 'rn', socio: false, renda: 1200, raca_cor: 'Parda' });
  assert.deepStrictEqual([r.cpf, r.cep, r.uf, r.renda, r.raca_cor], ['52998224725', '59700000', 'RN', '', '']);
});
test('link de cadastro: nome e termo obrigatórios; CPF e CEP conferidos; campos da coordenação não estão na lista aceita', () => {
  assert.match(R.validarConvite({ nome: 'Ab', lgpd: true }), /nome/); assert.match(R.validarConvite({ nome: 'Pessoa Exemplo' }), /concorda/);
  assert.match(R.validarConvite({ nome: 'Pessoa Exemplo', lgpd: true, cpf: '11111111111' }), /CPF/); assert.match(R.validarConvite({ nome: 'Pessoa Exemplo', lgpd: true, cep: '123' }), /CEP/);
  assert.strictEqual(R.validarConvite({ nome: 'Pessoa Exemplo', lgpd: true, cpf: '52998224725' }), '');
  ['funcao', 'inicio', 'fim', 'motivo', 'obs', 'id', 'criado_por'].forEach(k => assert.ok(!R.CAMPOS_CONVITE.includes(k), k));
  R.CAMPOS_RESERVADOS.forEach(k => assert.ok(R.CAMPOS_CONVITE.includes(k), k));
});
