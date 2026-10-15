/* Compara as contas das metas feitas pela tela (js/regras.js) com as feitas em SQL à parte (conferir_metas.sql), nos mesmos
   dados da simulação gravados no banco. Uso (o testar.sh faz isso): node supabase/tests/conferir_metas.js <saída do .sql> */
const fs = require('fs'), path = require('path');
delete globalThis.SQC; ['dados', 'regras'].forEach(f => require(path.join(__dirname, '..', '..', 'js', f + '.js')));
const SQC = globalThis.SQC, R = SQC.regras, D = SQC.dados;
const J = JSON.parse(fs.readFileSync(process.argv[2], 'utf8').trim()), T = J.tabelas, S = J.sql;
const db = { pessoas: [], itens: [], despesas: [], membros: [] };
for (const k of Object.keys(T)) db[k] = T[k] || [];
const ate = J.sql.hoje, erros = [];
for (const e of D.ETAPAS) {
  const tela = R.feito(db, e, ate), sql = ['2.1', '3.2', '3.3', '4.1', '5.1'].includes(e.id) ? S[e.id] : (S.entregas[e.id] || 0);
  if (tela !== sql) erros.push(`${e.id}: tela ${tela} × SQL ${sql}`);
}
const part = R.indicadores(db, ate).participantes; if (part !== S.participantes) erros.push(`participantes: tela ${part} × SQL ${S.participantes}`);
const n = D.ETAPAS.map(e => `${e.id}=${R.feito(db, e, ate)}`).join(' ');
if (erros.length) { console.log(' METAS (tela × SQL): DIFERENTES — ' + erros.join('; ')); process.exit(1); }
console.log(` METAS (tela × SQL independente): conferem nas ${D.ETAPAS.length} etapas e nos participantes (${n}; participantes=${part})`);
