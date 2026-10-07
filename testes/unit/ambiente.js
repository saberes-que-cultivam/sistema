/* Carrega dados, regras, fila e o modo demonstração no Node (sem navegador), para os testes de unidade. */
const path = require('path');
function carregar() {
  delete globalThis.SQC;
  ['dados', 'regras', 'planilha', 'fila', 'api-demo'].forEach(f => { const p = path.join(__dirname, '..', '..', 'js', f + '.js'); delete require.cache[require.resolve(p)]; require(p); });
  return globalThis.SQC;
}
module.exports = { carregar };
