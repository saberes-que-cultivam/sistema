/* Saberes que Cultivam — gera os scripts SQL que POVOAM o banco com dados fictícios e que LIMPAM esses dados depois.
   Uso:  node ferramentas/simulacao_sql.js [AAAA-MM-DD]     (padrão: hoje; é o último dia com registro)
   Grava supabase/simulacao/povoar.sql e supabase/simulacao/limpar.sql.

   Os dados vêm do mesmo gerador da simulação no navegador (js/simulacao.js), com o ano inteiro do projeto
   COMPRIMIDO entre 01/08/2026 e a véspera do dia escolhido: o banco recusa visita e entrega com data no futuro,
   e o sistema conta só o que já aconteceu. Assim o banco fica com o projeto inteiro registrado (todas as metas).
   Todo registro criado tem id começando por  ffffffff-0000-4000-8000-  e nome/descrição marcados como fictícios:
   é por esse começo de id que o limpar.sql apaga, sem tocar em nenhum registro real. */
const fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..');
const hojeReal = new Date(); const pad = n => String(n).padStart(2, '0');
const ARG = process.argv[2] || `${hojeReal.getFullYear()}-${pad(hojeReal.getMonth() + 1)}-${pad(hojeReal.getDate())}`;
if (!/^\d{4}-\d{2}-\d{2}$/.test(ARG) || ARG <= '2026-08-15') { console.error('Data inválida (use AAAA-MM-DD, depois de 15/08/2026).'); process.exit(1); }

/* carrega o gerador no Node, simulando o fim do projeto (31/07/2027) */
const RealDate = Date;
global.window = global; global.location = { search: '?simulacao=2027-07-31', pathname: '/' };
global.document = { readyState: 'complete', getElementById: () => true, body: { prepend() {} } };
['dados', 'regras', 'simulacao', 'api-demo'].forEach(f => require(path.join(raiz, 'js', f + '.js')));
const SQC = global.SQC, D = SQC.dados;
const db = SQC.apiDemo.semente(new Date());
global.Date = RealDate;

/* ---------- comprime as datas: 01/08/2026 → 01/08/2026; 31/07/2027 → véspera do dia escolhido ---------- */
const dia = s => new RealDate(s + 'T12:00:00Z').getTime(), isoUTC = t => new RealDate(t).toISOString().slice(0, 10);
const S = dia('2026-08-01'), E = dia('2027-07-31'), F = dia(ARG) - 864e5, r = (F - S) / (E - S);
const comp = s => s ? isoUTC(S + Math.floor((dia(s) - S) * r / 864e5) * 864e5) : s;

/* ---------- ids: tudo novo, com o começo fixo que o limpar.sql reconhece ---------- */
let n = 0; const ID = new Map(), PREF = 'ffffffff-0000-4000-8000-';
const novo = velho => { if (!ID.has(velho)) ID.set(velho, PREF + String(++n).padStart(12, '0')); return ID.get(velho); };

/* biofábricas próprias da simulação (as reais não são tocadas) */
const UN = { u1: ['Polo simulado Potengi (fictício)', 'SRN'], u2: ['Polo simulado Maciço (fictício)', 'SCE'], u3: ['Base simulada do campus (fictícia)', 'SAP'] };
const tab = {};
tab.unidades = db.unidades.map(u => Object.assign({}, u, { id: novo(u.id), nome: UN[u.id][0], sigla: UN[u.id][1], obs: 'Simulação: dado fictício.', funcionando_em: comp(u.funcionando_em) || null }));
tab.itens = db.itens.map(i => Object.assign({}, i, { id: novo(i.id), unidade: novo(i.unidade), data: comp(i.data) }));
tab.membros = db.membros.map(m => Object.assign({}, m, { id: novo(m.id), nome: /fict/.test(m.nome) ? m.nome : m.nome + ' (fictício)', inicio: comp(m.inicio), fim: comp(m.fim) || null }));
const usadas = new Set(db.distribuicoes.map(d => d.lote));
tab.lotes = db.lotes.map(l => { const ini = comp(l.inicio), dias = Math.max(1, Math.floor(l.dias * r)), pronto = isoUTC(dia(ini) + dias * 864e5);
  return Object.assign({}, l, { id: novo(l.id), unidade: novo(l.unidade), inicio: ini, dias, status: usadas.has(l.id) || pronto <= isoUTC(F) ? 'Pronto' : 'Maturando' }); });
tab.agricultores = db.agricultores.map(a => Object.assign({}, a, { id: novo(a.id), unidade: novo(a.unidade), diag: comp(a.diag), kitdata: comp(a.kitdata) || null }));
tab.distribuicoes = db.distribuicoes.map(d => Object.assign({}, d, { id: novo(d.id), lote: novo(d.lote), agricultor: novo(d.agricultor), data: comp(d.data) }));
tab.visitas = db.visitas.map(v => Object.assign({}, v, { id: novo(v.id), agricultor: novo(v.agricultor), data: comp(v.data) }));
const reais = new Set(['e1', 'e2', 'g1']);   // registros reais da semente (03_dados_iniciais.sql): ficam de fora
tab.eventos = db.eventos.filter(e => !reais.has(e.id)).map(e => Object.assign({}, e, { id: novo(e.id), data: comp(e.data), tema: e.tema + ' (simulação)' }));
tab.presencas = db.presencas.map(p => Object.assign({}, p, { id: novo(p.id), evento: novo(p.evento), agricultor: p.agricultor ? novo(p.agricultor) : null }));
tab.entregas = db.entregas.filter(g => !reais.has(g.id)).map(g => Object.assign({}, g, { id: novo(g.id), data: comp(g.data), titulo: /fict/.test(g.titulo) ? g.titulo : g.titulo + ' (simulação)' }));
tab.despesas = db.despesas.map(x => Object.assign({}, x, { id: novo(x.id), data: comp(x.data), descricao: x.descricao + ' (simulação)', status: 'Pago' }));

/* ---------- SQL ---------- */
const COL = {
  unidades: ['id', 'nome', 'sigla', 'municipio', 'uf', 'territorio', 'modelo', 'conta', 'parceiro', 'responsavel', 'obs'].concat(D.CHECK.map(c => c[0])).concat(['funcionando_em']),
  itens: ['id', 'unidade', 'descricao', 'valor', 'rubrica', 'status', 'data'],
  membros: ['id', 'funcao', 'nome', 'vinculo', 'cpf', 'email', 'telefone', 'municipio', 'outra_bolsa', 'arlo', 'lgpd', 'inicio', 'fim', 'motivo'],
  lotes: ['id', 'unidade', 'tipo', 'inicio', 'dias', 'qtd', 'med', 'status', 'responsavel', 'insumos', 'obs'],
  agricultores: ['id', 'nome', 'comunidade', 'municipio', 'uf', 'territorio', 'unidade', 'culturas', 'area', 'diag', 'quimico', 'gasto0', 'kit', 'kitdata'],
  distribuicoes: ['id', 'data', 'lote', 'agricultor', 'qtd', 'cultura', 'area', 'forma'],
  visitas: ['id', 'data', 'agricultor', 'tecnico', 'usou', 'vigor', 'gasto', 'obs', 'problemas'],
  eventos: ['id', 'tipo', 'data', 'tema', 'lugar', 'municipio', 'part', 'mulheres', 'link', 'obs'],
  presencas: ['id', 'evento', 'nome', 'comunidade', 'municipio', 'mulher', 'agricultor'],
  entregas: ['id', 'etapa', 'titulo', 'data', 'link', 'obs'],
  despesas: ['id', 'data', 'etapa', 'rubrica', 'item', 'descricao', 'favorecido', 'doc', 'valor', 'status']
};
// colunas sim/não: vazio vira falso (o banco não aceita nulo nelas)
const BOOL = { unidades: D.CHECK.map(c => c[0]), agricultores: ['kit'], presencas: ['mulher'], membros: ['lgpd'] };
Object.entries(BOOL).forEach(([t, cs]) => tab[t].forEach(x => cs.forEach(c => { x[c] = !!x[c]; })));
const ORDEM = ['unidades', 'itens', 'membros', 'lotes', 'agricultores', 'distribuicoes', 'visitas', 'eventos', 'presencas', 'entregas', 'despesas'];
const v = x => x === null || x === undefined || x === '' ? 'null' : typeof x === 'boolean' ? String(x) : typeof x === 'number' ? String(x) : `'${String(x).replace(/'/g, "''")}'`;
const lista = ORDEM.map(t => `('${t}')`).join(', ');
const total = ORDEM.reduce((s, t) => s + tab[t].length, 0);

const cab = (titulo, linhas) => `-- =====================================================================\n-- Saberes que Cultivam — ${titulo}\n${linhas.map(l => '-- ' + l).join('\n')}\n-- GERADO por ferramentas/simulacao_sql.js (${ARG}). Não edite à mão: gere de novo.\n-- =====================================================================\n`;
let P = cab('SIMULAÇÃO: povoa o banco com dados FICTÍCIOS (o projeto inteiro, comprimido até ' + ARG.split('-').reverse().join('/') + ')', [
  'ATENÇÃO, leia antes de rodar:',
  '  * O SEAB/MDA e toda a equipe passam a ver estes números como se fossem do projeto (metas, unidades acompanhadas,',
  '    capacitações, despesas). Use num banco de teste ou só enquanto ninguém de fora estiver olhando, e rode o limpar.sql depois.',
  '  * Recusa rodar se o banco já tiver registro REAL de campo (unidade produtiva, lote, distribuição ou visita): não mistura dado real com fictício.',
  '  * Não cria acesso (login) para ninguém e não mexe nas biofábricas reais: cria três biofábricas simuladas (SRN, SCE, SAP).',
  '  * Despesas: o desembolso inteiro do plano (R$ 400.000,00) como pago; com só a 1ª parcela recebida, o painel avisa "acima do recebido".',
  `  * ${total} registros: ${ORDEM.map(t => `${tab[t].length} ${t}`).join(', ')}.`,
  '  * Para desfazer: supabase/simulacao/limpar.sql (apaga só o que tem id ffffffff-0000-4000-8000-…).',
  'Rode inteiro, de uma vez, no SQL Editor do Supabase. Se der erro, nada é gravado (tudo numa transação).']);
P += `begin;\ndo $$ begin\n  if exists (select 1 from public.unidades where id::text like '${PREF}%') then\n    raise exception 'A simulação já está no banco. Rode o limpar.sql antes de povoar de novo.';\n  end if;\n`;
P += `  if exists (select 1 from public.agricultores where id::text not like '${PREF}%') or exists (select 1 from public.lotes where id::text not like '${PREF}%')\n     or exists (select 1 from public.distribuicoes where id::text not like '${PREF}%') or exists (select 1 from public.visitas where id::text not like '${PREF}%') then\n    raise exception 'O banco já tem registros reais de campo (unidades produtivas, lotes, distribuições ou visitas). A simulação não mistura dado real com fictício: use um banco de teste.';\n  end if;\nend $$;\n\n`;
ORDEM.forEach(t => {
  if (!tab[t].length) return;
  P += `-- ${t} (${tab[t].length})\ninsert into public.${t} (${COL[t].join(', ')}) values\n` + tab[t].map(x => ' (' + COL[t].map(c => v(x[c])).join(', ') + ')').join(',\n') + ';\n\n';
});
P += `commit;\n\nselect ${ORDEM.map(t => `(select count(*) from public.${t} where id::text like '${PREF}%') as ${t}`).join(',\n       ')};\n`;

let L = cab('SIMULAÇÃO: apaga os dados fictícios criados pelo povoar.sql', [
  'Apaga SÓ os registros cujo id começa por ffffffff-0000-4000-8000- (os da simulação) e as linhas do histórico desses registros.',
  'Nenhum registro real é tocado. Pode rodar mais de uma vez. Rode inteiro, de uma vez, no SQL Editor do Supabase.']);
L += `begin;\n`;
[...ORDEM].reverse().forEach(t => { L += `delete from public.${t} where id::text like '${PREF}%';\n`; });
L += `-- histórico: as inclusões feitas pelo povoar.sql e as exclusões feitas agora (a simulação não deixa rastro na prestação de contas)\ndelete from public.auditoria where registro_id::text like '${PREF}%';\ncommit;\n\n`;
L += `select ${ORDEM.map(t => `(select count(*) from public.${t} where id::text like '${PREF}%') as ${t}`).join(',\n       ')},\n       (select count(*) from public.auditoria where registro_id::text like '${PREF}%') as historico;   -- tudo zero = limpo\n`;

const pasta = path.join(raiz, 'supabase', 'simulacao'); fs.mkdirSync(pasta, { recursive: true });
fs.writeFileSync(path.join(pasta, 'povoar.sql'), P); fs.writeFileSync(path.join(pasta, 'limpar.sql'), L);
console.log(`supabase/simulacao/povoar.sql: ${total} registros (${Math.round(P.length / 1024)} KB); limpar.sql gravado.`);

/* conferência: as metas como o sistema vai contar com estes dados (no dia escolhido) */
const R = SQC.regras, base = Object.fromEntries(D.TABELAS.map(t => [t, (tab[t] || []).map(x => Object.assign({}, x))]));
console.log('Metas que o sistema vai mostrar:', D.ETAPAS.map(e => `${e.id} ${R.feito(base, e, ARG)}/${e.q}`).join(' · '));
const lotesRuins = base.distribuicoes.filter(d => { const l = base.lotes.find(x => x.id === d.lote); return d.data < l.inicio || l.status !== 'Pronto'; }).length;
const acima = R.fin(base, ARG).filter(m => m.saldo < 0).map(m => 'Meta ' + m.m);
console.log('Conferência: distribuições fora da regra =', lotesRuins, '· metas acima do previsto =', acima.length ? acima.join(', ') : 'nenhuma', '· data mais nova =', [].concat(...D.TABELAS.map(t => base[t].map(x => x.data || x.inicio || '')) ).sort().pop());
