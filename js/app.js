/* Saberes que Cultivam — telas e navegação.
   Uma aba por assunto. Os cadastros são descritos em MOD (campos do formulário e colunas da lista);
   as contas ficam em js/regras.js e os números do plano em js/dados.js. */
(function () {
  const SQC = (window.SQC = window.SQC || {});
  const D = SQC.dados, R = SQC.regras;
  let api = null, eu = null, db = null, pend = [], hist = null;
  let tab = 'painel', ed = null, rel = null, authModo = 'entrar';

  /* ---------- utilidades ---------- */
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (v, d = 0) => (+v || 0).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
  const brl = R.brl, dt = R.dt, pd = R.pd, iso = R.iso;
  const hoje = () => new Date();
  const by = (t, id) => db[t].find(r => r.id === id);
  const coord = () => !!eu && eu.perfil === 'Coordenação';
  const demo = () => api.modo === 'demo';
  const mesAno = s => String(s).split('-').reverse().join('/');
  const exChip = r => (r.ex ? ' <span class="chip ex">exemplo</span>' : '') + (r._erro ? ' <span class="chip bad">não enviado</span>' : r._pendente ? ' <span class="chip pend">aguardando envio</span>' : '');
  const bar = (v, t, c = '') => `<div class="bar ${c}"><i style="width:${Math.max(0, Math.min(100, t ? v / t * 100 : 0))}%"></i></div>`;
  const link = (u, txt) => /^https?:\/\//i.test(String(u || '')) ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${txt || 'abrir'}</a>` : (u ? esc(u) : '<span class="chip f">sem link</span>');
  const saldo = l => R.saldo(db, l), nCheck = R.nCheck;
  const visitasDe = id => R.visitasDe(db, id), recebeu = id => R.recebeu(db, id), acompanhada = a => R.acompanhada(db, a), feito = e => R.feito(db, e);
  let toastT = null;
  function toast(msg) { let t = $('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; clearTimeout(toastT); toastT = setTimeout(() => t.remove(), 5000); }

  /* ---------- cadastros: campos = [chave, rótulo, tipo, obrigatório, opções]; cols = [título, função, classe] ---------- */
  const opt = a => a.map(x => [x, x]);
  const optRubrica = () => D.RUBRICAS.map(r => [r.id, r.nome]);
  const nomeRubrica = id => (D.RUBRICAS.find(r => r.id === id) || {}).nome || '';
  const MOD = {
    unidades: { um: 'Unidade de produção de bioinsumos', oque: 'Biofábrica do projeto. As duas que contam para a Meta 2 do TED são as dos territórios; as outras são de apoio. Marque cada passo da implantação conforme for acontecendo.', dicas: { sigla: 'Aparece no código de todos os lotes desta unidade. Não mude depois de criar lotes.', parceiro: 'Associação, cooperativa, prefeitura ou escola. Bem público não pode ser doado a pessoa física.' }, nome: 'Biofábricas', titulo: 'Unidades de produção de bioinsumos', desc: 'Etapas de implantação de cada unidade. Conta para a Meta 2 a unidade marcada como “em funcionamento”.', novo: 'Nova unidade',
      campos: [['_s1', 'Identificação', 'sec'], ['nome', 'Nome', 'text', 1], ['sigla', 'Sigla (2 a 4 letras, usada no código dos lotes)', 'text', 1], ['municipio', 'Município', 'text'], ['uf', 'UF', 'text'],
        ['territorio', 'Território', 'select', 0, opt(D.TERRITORIOS)],
        ['modelo', 'Modelo', 'select', 0, opt(['A definir', 'Área aberta com cobertura (compostagem e biofertilizantes)', 'Microrganismos isolados'])],
        ['conta', 'Conta para a Meta 2 do TED?', 'select', 0, opt(['Sim', 'Não'])], ['_s2', 'Parceria', 'sec'], ['parceiro', 'Parceiro institucional que recebe os bens', 'text'], ['responsavel', 'Responsável local', 'text'],
        ['_s3', 'Implantação', 'sec'], ['_chk', 'Passos concluídos', 'checks'], ['obs', 'Observações', 'textarea']],
      cols: [['Unidade', u => `<b>${esc(u.nome)}</b>${exChip(u)}<div class="small">${esc(u.municipio)}/${esc(u.uf)} · ${esc(u.modelo)}</div>`],
        ['Meta 2', u => u.conta === 'Sim' ? '<span class="chip ok">conta</span>' : '<span class="chip">apoio</span>'],
        ['Implantação', u => `${bar(nCheck(u), D.CHECK.length)}<div class="small">${nCheck(u)} de ${D.CHECK.length} · próximo: ${esc(R.proximoPasso(u))}</div>`],
        ['Parceiro', u => esc(u.parceiro) || '<span class="chip f">a definir</span>'],
        ['Itens estimados', u => { const s = db.itens.filter(i => i.unidade === u.id).reduce((t, i) => t + (+i.valor || 0), 0); return `${brl(s)}${u.conta === 'Sim' ? `<div class="small">de ${brl(D.TETO_UNIDADE)}</div>` : ''}`; }, 'n']] },
    itens: { um: 'Item de aquisição', oque: 'Bem ou material a comprar pela FUNCERN para uma unidade de produção.', dicas: { rubrica: 'A rubrica do plano em que a compra vai entrar.' }, nome: 'Itens', titulo: 'Itens e aquisições das unidades', desc: `Cada item passa por orçamento, compra pela FUNCERN e entrega. O teto do plano é ${brl(D.TETO_UNIDADE)} por unidade.`, novo: 'Novo item',
      campos: [['unidade', 'Unidade', 'ref', 1, 'unidades'], ['descricao', 'Descrição', 'text', 1], ['valor', 'Valor estimado (R$)', 'number'],
        ['rubrica', 'Rubrica do plano', 'select', 0, () => [['', '']].concat(optRubrica())],
        ['status', 'Situação', 'select', 0, opt(['A definir', 'Orçamento enviado', 'Em compras na FUNCERN', 'Entregue'])], ['data', 'Data do envio do orçamento', 'date']],
      cols: [['Item', i => esc(i.descricao) + exChip(i) + (i.rubrica ? `<div class="small">${esc(nomeRubrica(i.rubrica))}</div>` : '')], ['Unidade', i => esc((by('unidades', i.unidade) || {}).nome)],
        ['Situação', i => `<span class="chip ${i.status === 'Entregue' ? 'ok' : i.status === 'A definir' ? '' : 'f'}">${esc(i.status)}</span>`], ['Enviado em', i => dt(i.data)], ['Valor', i => brl(i.valor), 'n']] },
    lotes: { um: 'Lote de produção', oque: 'Uma batelada de bioinsumo. O código é gerado ao salvar. Só lote marcado como “Pronto” pode ser distribuído.', dicas: { dias: 'Preenchido pelo tipo; ajuste se o seu preparo for diferente.', obs: 'O que você observou ao conferir: é o registro de qualidade do lote.' }, nome: 'Lotes', titulo: 'Lotes de produção', desc: 'Um lote por batelada. O código é gerado pela sigla da unidade e pelo tipo. O saldo desconta o que já foi distribuído.', novo: 'Novo lote',
      campos: [['_s1', 'Produção', 'sec'], ['unidade', 'Unidade', 'ref', 1, 'unidades'], ['tipo', 'Tipo de bioinsumo', 'select', 1, opt(Object.keys(D.TIPOS))], ['inicio', 'Início do preparo', 'date', 1],
        ['dias', 'Dias até ficar pronto', 'number'], ['qtd', 'Quantidade produzida', 'number', 1], ['med', 'Medida', 'select', 0, opt(['kg', 'L'])],
        ['_s2', 'Acompanhamento do lote', 'sec'], ['status', 'Situação', 'select', 0, opt(['Em preparo', 'Maturando', 'Pronto', 'Descartado'])], ['responsavel', 'Responsável', 'text'],
        ['insumos', 'Ingredientes e proporções', 'textarea'], ['obs', 'Qualidade (cheiro, temperatura, pH, aspecto)', 'textarea']],
      cols: [['Lote', l => `<span class="mono">${esc(l.codigo || 'código ao enviar')}</span>${exChip(l)}<div class="small">${esc(l.tipo)} · ${esc((by('unidades', l.unidade) || {}).nome)}</div>`],
        ['Situação', l => `<span class="chip ${l.status === 'Pronto' ? 'ok' : l.status === 'Descartado' ? 'bad' : 'f'}">${esc(l.status)}</span>`],
        ['Maturação', l => { const p = R.dias(pd(l.inicio), hoje()); return l.status === 'Pronto' || l.status === 'Descartado' ? `<span class="small">início ${dt(l.inicio)}</span>` : `${bar(p, l.dias, 'f')}<div class="small">dia ${Math.max(0, p)} de ${l.dias} · previsto ${dt(iso(R.pronto(l)))}</div>`; }],
        ['Produzido', l => `${num(l.qtd)} ${esc(l.med)}`, 'n'], ['Saldo', l => `<b>${num(saldo(l))} ${esc(l.med)}</b>`, 'n']] },
    agricultores: { um: 'Unidade produtiva', oque: 'Agricultor ou agricultora atendido pelo projeto. Conta como “acompanhada” quando recebe bioinsumo e tem pelo menos uma visita de monitoramento. É dado pessoal: registre só o necessário e não compartilhe fora da equipe.', dicas: { diag: 'Dia em que você levantou a situação antes do projeto. Sem essa data, a avaliação final não tem com o que comparar.', gasto0: 'Quanto a família gastava por mês com adubo e defensivo comprados, antes de receber bioinsumo.', kitdata: 'Obrigatória quando o kit foi entregue.' }, nome: 'Unidades produtivas', titulo: 'Agricultores e unidades produtivas', desc: 'Meta de 30 unidades produtivas acompanhadas e 30 kits. Registre a linha de base antes da primeira entrega de bioinsumo.', novo: 'Nova unidade produtiva',
      campos: [['_s1', 'Dados pessoais', 'sec'], ['nome', 'Nome do agricultor ou agricultora', 'text', 1], ['comunidade', 'Comunidade ou assentamento', 'text'], ['municipio', 'Município', 'text'], ['uf', 'UF', 'text'],
        ['territorio', 'Território', 'select', 0, opt(D.TERRITORIOS)], ['unidade', 'Biofábrica que atende', 'ref', 0, 'unidades'],
        ['_s2', 'Produção', 'sec'], ['culturas', 'Culturas principais', 'text'], ['area', 'Área cultivada (ha)', 'number'],
        ['_s3', 'Linha de base (antes do projeto)', 'sec'], ['diag', 'Data do diagnóstico inicial', 'date'], ['quimico', 'Usa adubo ou defensivo químico?', 'select', 0, opt(['', 'Sim', 'Parcial', 'Não'])], ['gasto0', 'Gasto com insumos comprados (R$/mês)', 'number'],
        ['_s4', 'Kit de apoio', 'sec'], ['kit', 'Kit de apoio entregue', 'check'], ['kitdata', 'Data da entrega do kit', 'date']],
      cols: [['Agricultor(a)', a => `<b>${esc(a.nome)}</b>${exChip(a)}<div class="small">${esc(a.comunidade)} · ${esc(a.municipio)}/${esc(a.uf)}</div>`],
        ['Culturas', a => `${esc(a.culturas)}<div class="small">${num(a.area, 1)} ha</div>`],
        ['Linha de base', a => a.diag ? `<span class="chip ok">${dt(a.diag)}</span><div class="small">${brl(a.gasto0)}/mês · químico: ${esc(a.quimico || '—')}</div>` : '<span class="chip bad">falta</span>'],
        ['Kit', a => a.kit ? `<span class="chip ok">${dt(a.kitdata)}</span>` : '<span class="chip">não</span>'],
        ['Acompanhamento', a => { const r = recebeu(a.id).length, v = visitasDe(a.id); return `<span class="chip ${acompanhada(a) ? 'ok' : ''}">${r} entrega(s) · ${v.length} visita(s)</span>${v[0] ? `<div class="small">última ${dt(v[0].data)}</div>` : ''}`; }]] },
    distribuicoes: { um: 'Entrega de bioinsumo', oque: 'Liga um lote a quem recebeu. O sistema desconta do saldo do lote e não deixa entregar mais do que existe.', nome: 'Distribuição', titulo: 'Distribuição de bioinsumos', desc: 'Cada entrega liga um lote a uma unidade produtiva. É o que permite dizer de onde veio o que foi aplicado.', novo: 'Registrar entrega',
      campos: [['data', 'Data', 'date', 1], ['lote', 'Lote (só os prontos)', 'ref', 1, 'lotes', l => l.status === 'Pronto'], ['agricultor', 'Unidade produtiva', 'ref', 1, 'agricultores'], ['qtd', 'Quantidade', 'number', 1],
        ['cultura', 'Cultura que vai receber', 'text'], ['area', 'Área de aplicação (ha)', 'number'], ['forma', 'Forma de aplicação', 'select', 0, opt(['No solo', 'Foliar', 'Na cova ou sulco', 'Tratamento de sementes', 'Outro'])]],
      cols: [['Data', d => dt(d.data) + exChip(d)], ['Lote', d => { const l = by('lotes', d.lote) || {}; return `<span class="mono">${esc(l.codigo || 'código ao enviar')}</span><div class="small">${esc(l.tipo)}</div>`; }],
        ['Para', d => esc((by('agricultores', d.agricultor) || {}).nome)], ['Uso', d => `${esc(d.cultura)}<div class="small">${esc(d.forma)} · ${num(d.area, 1)} ha</div>`],
        ['Quantidade', d => `${num(d.qtd)} ${esc((by('lotes', d.lote) || {}).med || '')}`, 'n']] },
    visitas: { um: 'Visita de monitoramento', oque: 'O que foi visto em campo depois da entrega. O gasto informado aqui é comparado com a linha de base no painel.', dicas: { gasto: 'Mesma pergunta da linha de base, para comparar antes e depois.' }, nome: 'Monitoramento', titulo: 'Visitas de monitoramento', desc: 'Registro do uso em campo. O gasto mensal com insumos comprados é comparado com a linha de base no painel.', novo: 'Registrar visita',
      campos: [['_s1', 'A visita', 'sec'], ['data', 'Data', 'date', 1], ['agricultor', 'Unidade produtiva', 'ref', 1, 'agricultores'], ['tecnico', 'Quem visitou', 'text'],
        ['_s2', 'O que foi visto', 'sec'],
        ['usou', 'Aplicou o bioinsumo recebido?', 'select', 1, opt(['Sim', 'Parcial', 'Não'])], ['vigor', 'Vigor da cultura (1 ruim a 5 ótimo)', 'select', 0, opt(['', '1', '2', '3', '4', '5'])],
        ['gasto', 'Gasto atual com insumos comprados (R$/mês)', 'number'], ['obs', 'O que foi observado', 'textarea'], ['problemas', 'Dificuldades relatadas', 'textarea']],
      cols: [['Data', v => dt(v.data) + exChip(v)], ['Unidade produtiva', v => esc((by('agricultores', v.agricultor) || {}).nome)],
        ['Uso', v => `<span class="chip ${v.usou === 'Sim' ? 'ok' : v.usou === 'Não' ? 'bad' : 'f'}">${esc(v.usou)}</span>`], ['Vigor', v => v.vigor ? `${esc(v.vigor)}/5` : '—', 'n'],
        ['Gasto/mês', v => R.vazio(v.gasto) ? '—' : brl(v.gasto), 'n'], ['Observações', v => `${esc(v.obs)}${v.problemas ? `<div class="small">Dificuldade: ${esc(v.problemas)}</div>` : ''}`]] },
    eventos: { um: 'Atividade', oque: 'Capacitação e dia de campo contam para as metas do plano. Reunião e articulação ficam registradas, mas não contam.', dicas: { link: 'Pasta com a lista de presença e as fotos: é a evidência para a prestação de contas.' }, nome: 'Formação', titulo: 'Capacitações, dias de campo e reuniões', desc: 'O plano prevê 5 capacitações (etapa 3.2) e 4 dias de campo (etapa 5.1). Reuniões e articulações ficam registradas, mas não contam para essas metas.', novo: 'Registrar atividade',
      campos: [['tipo', 'Tipo', 'select', 1, opt(['Capacitação', 'Dia de campo', 'Reunião', 'Articulação'])], ['data', 'Data', 'date', 1], ['tema', 'Tema', 'text', 1], ['lugar', 'Local', 'text'], ['municipio', 'Município/UF', 'text'],
        ['part', 'Participantes', 'number'], ['mulheres', 'Dos quais, mulheres', 'number'], ['link', 'Link da lista de presença e fotos', 'text'], ['obs', 'Observações', 'textarea']],
      cols: [['Data', e => dt(e.data) + exChip(e)], ['Tipo', e => `<span class="chip ${['Capacitação', 'Dia de campo'].includes(e.tipo) ? 'ok' : ''}">${esc(e.tipo)}</span>`],
        ['Tema', e => `${esc(e.tema)}<div class="small">${esc(e.lugar)}${e.municipio ? ' · ' + esc(e.municipio) : ''}</div>`],
        ['Participantes', e => R.vazio(e.part) ? '—' : `${num(e.part)}<div class="small">${num(e.mulheres)} mulheres</div>`, 'n'],
        ['Evidência', e => link(e.link)]] },
    entregas: { um: 'Entrega do plano de trabalho', oque: 'Relatório, material didático ou produto de comunicação concluído. Cada registro conta 1 na etapa escolhida.', dicas: { link: 'Onde o documento está guardado.' }, nome: 'Entregas', titulo: 'Entregas e evidências do plano de trabalho', desc: 'Relatórios, material didático e produtos de comunicação. Cada registro conta para a etapa escolhida.', novo: 'Registrar entrega',
      campos: [['etapa', 'Etapa do plano', 'select', 1, D.ETAPAS.filter(e => !D.ETAPAS_AUTOMATICAS.includes(e.id)).map(e => [e.id, `${e.id} · ${e.nome}`])],
        ['titulo', 'Título', 'text', 1], ['data', 'Data', 'date', 1], ['link', 'Link do documento', 'text'], ['obs', 'Observações', 'textarea']],
      cols: [['Etapa', g => `<span class="mono">${esc(g.etapa)}</span>`], ['Entrega', g => `${esc(g.titulo)}${exChip(g)}${g.obs ? `<div class="small">${esc(g.obs)}</div>` : ''}`], ['Data', g => dt(g.data)],
        ['Evidência', g => link(g.link)]] },
    despesas: { um: 'Despesa', oque: 'Lançamento de acompanhamento. O registro oficial é o da FUNCERN: confira os dois antes de cada prestação de contas.', dicas: { rubrica: 'É por rubrica que a fundação controla o gasto.', status: 'Enquanto não estiver “Pago”, conta como comprometido.' }, nome: 'Despesas', titulo: 'Lançamentos de despesa', desc: 'Cada despesa tem a etapa (plano do TED) e a rubrica (plano executado pela FUNCERN). Enquanto não estiver paga, conta como comprometida.', novo: 'Lançar despesa', restrito: 1,
      campos: [['data', 'Data', 'date', 1], ['etapa', 'Etapa do plano', 'select', 1, D.ETAPAS.map(e => [e.id, `${e.id} · ${e.nome}`])], ['rubrica', 'Rubrica', 'select', 1, () => [['', 'Escolha']].concat(optRubrica())],
        ['descricao', 'Descrição', 'text', 1], ['valor', 'Valor (R$)', 'number', 1],
        ['status', 'Situação', 'select', 1, opt(['Solicitado', 'Em compras na FUNCERN', 'Pago'])], ['favorecido', 'Favorecido', 'text'], ['doc', 'Documento (nota fiscal, solicitação)', 'text']],
      cols: [['Data', d => dt(d.data) + exChip(d)], ['Etapa', d => `<span class="mono">${esc(d.etapa)}</span>`],
        ['Descrição', d => `${esc(d.descricao)}<div class="small">${esc(nomeRubrica(d.rubrica) || 'sem rubrica')}${d.favorecido ? ' · ' + esc(d.favorecido) : ''}${d.doc ? ' · ' + esc(d.doc) : ''}</div>`],
        ['Situação', d => `<span class="chip ${d.status === 'Pago' ? 'ok' : 'f'}">${esc(d.status)}</span>`], ['Valor', d => brl(d.valor), 'n']] },
    pessoas: { um: 'Acesso ao sistema', oque: 'Quem pode entrar. Coordenação faz tudo; Equipe registra o trabalho de campo e de produção, mas não lança despesa nem cadastra acesso.', dicas: { email: 'É o login. A pessoa cria a própria senha em “Primeiro acesso”, na tela de entrada, e confirma pelo e-mail que recebe.', ativo: 'Desmarque para tirar o acesso sem apagar o histórico.' }, nome: 'Acessos', titulo: 'Pessoas com acesso', desc: 'A coordenação cadastra o nome e o e-mail de quem pode entrar. A pessoa cria a própria senha em “Primeiro acesso”, na tela de entrada. Para tirar o acesso de alguém, desmarque “Acesso ativo”.', novo: 'Novo acesso', restrito: 1, semExcluir: 1,
      campos: [['nome', 'Nome', 'text', 1], ['email', 'E-mail', 'email', 1], ['perfil', 'Perfil', 'select', 1, opt(['Equipe', 'Coordenação'])], ['ativo', 'Acesso ativo', 'check']],
      cols: [['Nome', u => esc(u.nome)], ['E-mail', u => `<span class="mono">${esc(u.email)}</span>`], ['Perfil', u => `<span class="chip ${u.perfil === 'Coordenação' ? 'ok' : ''}">${esc(u.perfil)}</span>`],
        ['Situação', u => u.ativo === false ? '<span class="chip bad">desativado</span>' : (demo() || u.auth_id ? '<span class="chip ok">ativo</span>' : '<span class="chip f">ainda não criou a senha</span>')]] }
  };
  const rotulo = { unidades: u => u.nome, lotes: l => `${l.codigo || 'código ao enviar'} · ${l.tipo} · saldo ${num(saldo(l))} ${l.med}${l.status !== 'Pronto' ? ' · ' + l.status : ''}`, agricultores: a => `${a.nome}${a.comunidade ? ' · ' + a.comunidade : ''}` };

  /* ---------- telas ---------- */
  const TABS = [['painel', 'Painel'], ['unidades', 'Biofábricas'], ['lotes', 'Lotes'], ['agricultores', 'Unidades produtivas'], ['distribuicoes', 'Distribuição'], ['visitas', 'Monitoramento'], ['eventos', 'Formação'], ['entregas', 'Entregas'], ['financeiro', 'Financeiro'], ['relatorios', 'Relatórios'], ['dados', 'Dados']];
  function nav() { $('#tabs').innerHTML = TABS.map(t => `<button role="tab" aria-selected="${t[0] === tab}" data-tab="${t[0]}">${t[1]}</button>`).join(''); }
  function tabela(m) {
    const M = MOD[m], pode = R.podeGravar(eu, m), rows = [...db[m]].sort((a, b) => (b.data || b.inicio || '') > (a.data || a.inicio || '') ? 1 : -1);
    const acoes = r => `${pode ? `<button class="b s" data-edit="${m}:${esc(r.id)}">Editar</button>` : ''}${!M.semExcluir && R.podeExcluir(eu, m, r) && !r._pendente ? ` <button class="b s d" data-del="${m}:${esc(r.id)}">Excluir</button>` : ''}`;
    return `<div class="head"><div><h2>${M.titulo}</h2><p>${M.desc}</p></div><div class="acts">${pode ? `<button class="b p" data-new="${m}">${M.novo}</button>` : ''}</div></div>
 <div class="panel scroll">${rows.length ? `<table><thead><tr>${M.cols.map(c => `<th class="${c[2] || ''}">${c[0]}</th>`).join('')}<th></th></tr></thead><tbody>${rows.map(r => `<tr>${M.cols.map(c => `<td class="${c[2] || ''}">${c[1](r)}</td>`).join('')}<td class="a">${acoes(r)}</td></tr>`).join('')}</tbody></table>` : `<div class="empty">Nenhum registro ainda.${pode ? ` Use “${M.novo}”.` : ''}</div>`}</div>`;
  }
  const finTabela = (F, titulo) => `<table><thead><tr><th>${titulo}</th><th class="n">Previsto</th><th class="n">Comprometido</th><th class="n">Pago</th><th class="n">Saldo</th></tr></thead><tbody>${F.map(r => `<tr><td>${r.m ? `Meta ${r.m} · ` : ''}${esc(r.nome)}${r.saldo < 0 ? ' <span class="chip bad">acima do previsto</span>' : ''}</td><td class="n">${brl(r.prev)}</td><td class="n">${brl(r.comp)}</td><td class="n">${brl(r.pago)}</td><td class="n">${brl(r.saldo)}</td></tr>`).join('')}<tr class="tot"><td>Total</td><td class="n">${brl(R.soma(F, 'prev'))}</td><td class="n">${brl(R.soma(F, 'comp'))}</td><td class="n">${brl(R.soma(F, 'pago'))}</td><td class="n">${brl(R.soma(F, 'saldo'))}</td></tr></tbody></table>`;
  const parcelasTxt = () => D.PARCELAS.map((p, i) => p.recebida ? `<dt>${i + 1}ª parcela, liquidada à FUNCERN em ${dt(p.data)}</dt><dd>${brl(p.valor)}</dd>` : `<dt>${i + 1}ª parcela, prevista para ${mesAno(p.previsao)}</dt><dd>${brl(p.valor)}</dd>`).join('');
  function avisoFila() {
    const ruins = pend.filter(p => p.erro), esperando = pend.length - ruins.length;
    return (esperando ? `<div class="banner"><span><b>${esperando}</b> lançamento(s) guardado(s) neste aparelho, aguardando internet para enviar.</span><button class="b s" data-sinc>Tentar enviar agora</button></div>` : '')
      + ruins.map(p => `<div class="banner"><span><b>Não enviado</b> (${esc(MOD[p.tabela].nome)}): ${esc(p.erro)}</span><span class="acts"><button class="b s" data-edit="${p.tabela}:${esc(p.dados.id)}">Corrigir</button><button class="b s d" data-descartar="${esc(p.id)}">Descartar</button></span></div>`).join('');
  }
  /* indicador com anel: pc = percentual (0 a 100), n e de = textos do número grande e do total */
  const kpi = (k, pc, n, de, rot, s2) => { pc = Math.max(0, Math.min(100, +pc || 0)); const pr = Math.round(pc), C = 2 * Math.PI * 18;
    return `<div class="dx-kpi k${k}"><div class="dx-kpi-topo"><span class="dx-anel" aria-hidden="true"><svg viewBox="0 0 44 44" width="52" height="52" focusable="false"><circle cx="22" cy="22" r="18" class="tr"/>${pc > 0 ? `<circle cx="22" cy="22" r="18" class="pg" stroke-dasharray="${(C * pc / 100).toFixed(2)} ${C.toFixed(2)}" transform="rotate(-90 22 22)"/>` : ''}</svg><b>${pr}%</b></span>
      <span class="dx-kpi-n"><b>${n}</b><small>${typeof de === 'number' ? ' / ' + de : de}</small></span></div><span class="dx-kpi-r">${rot}</span>
      <span class="medidor fino" aria-hidden="true"><i style="width:${pc}%"></i></span><span class="dx-kpi-s">${esc(s2)}</span></div>`; };
  const pct = v => (Math.round(v * 10) / 10).toLocaleString('pt-BR', { maximumFractionDigits: v < 10 && v > 0 ? 1 : 0 });
  function painel() {
    const st = ['2.1', '4.1', '3.3', '3.2'].map(id => D.ETAPAS.find(e => e.id === id));
    const lab = { '2.1': 'biofábricas em funcionamento', '4.1': 'unidades produtivas acompanhadas', '3.3': 'kits de apoio entregues', '3.2': 'capacitações realizadas' };
    const X = R.execucaoGeral(db, hoje());
    const ST = { concluida: ['ok', 'Concluída'], andamento: ['ok', 'No ritmo'], atencao: ['f', 'Pouco abaixo do previsto'], atrasada: ['bad', 'Abaixo do previsto'] };
    const uConta = db.unidades.filter(u => u.conta === 'Sim'), comBase = db.agricultores.filter(a => a.diag).length, caps = db.eventos.filter(e => e.tipo === 'Capacitação'), dc = db.eventos.filter(e => e.tipo === 'Dia de campo').length;
    const sub = { '2.1': uConta.length ? `${uConta.length} em implantação · ${uConta.reduce((s, u) => s + nCheck(u), 0)} de ${uConta.length * D.CHECK.length} passos` : 'nenhuma unidade cadastrada',
      '4.1': `${db.agricultores.length} cadastrada(s) · ${comBase} com linha de base`, '3.3': `${db.agricultores.filter(a => !a.kit).length} cadastrada(s) ainda sem kit`,
      '3.2': `${num(caps.reduce((s, e) => s + (+e.part || 0), 0))} participante(s) · ${dc} dia(s) de campo` };
    const A = R.alertas(db, hoje());
    const prazoTxt = p => { const d = R.dias(new Date(hoje().getFullYear(), hoje().getMonth(), hoje().getDate()), pd(p)); return d < 0 ? `venceu há ${-d} dia${d === -1 ? '' : 's'}` : d === 0 ? 'hoje' : `em ${d} dia${d === 1 ? '' : 's'}`; }; const G0 = pd(D.G0), G1 = pd(D.G1), span = G1 - G0; const pos = d => Math.max(0, Math.min(100, (d - G0) / span * 100));
    const meses = []; for (let i = 0; i < 13; i++) { const d = new Date(G0.getFullYear(), G0.getMonth() + i, 1); meses.push(d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '') + '/' + String(d.getFullYear()).slice(2)); }
    let g = '', mm = 0; D.ETAPAS.forEach(e => {
      if (e.m !== mm) { mm = e.m; g += `<div class="g-row m"><span>Meta ${mm} · ${D.METAS[mm]}</span><span></span><span></span></div>`; }
      const a = pos(pd(e.ini)), b = pos(new Date(R.fimMes(e.fim).getTime() + 864e5)), f = feito(e), late = R.fimMes(e.fim) < hoje() && f < e.q;
      g += `<div class="g-row"><div class="g-lab"><span class="mono">${e.id}</span>${e.nome}</div><div class="g-track"><div class="g-bar ${late ? 'late' : ''}" style="left:${a}%;width:${b - a}%"><i style="width:${Math.min(100, f / e.q * 100)}%"></i></div><div class="g-today" style="left:${pos(hoje())}%"></div></div><div class="g-n">${f}/${e.q}</div></div>`;
    });
    const prod = {}; db.lotes.filter(l => l.status !== 'Descartado').forEach(l => { prod[l.tipo] = prod[l.tipo] || [0, 0, l.med]; prod[l.tipo][0] += +l.qtd || 0; prod[l.tipo][1] += (+l.qtd || 0) - saldo(l); });
    const I = R.indicadores(db); const F = R.fin(db), usado = R.soma(F, 'pago') + R.soma(F, 'comp'), rec = R.recebido();
    const temEx = Object.keys(MOD).some(m => db[m].some(r => r.ex));
    return `${temEx ? `<div class="banner"><span>Modo demonstração: os registros marcados como <b>exemplo</b> são fictícios e entram nas contas abaixo.</span>${coord() ? '<button class="b s" data-limpar>Apagar exemplos</button>' : ''}</div>` : ''}
 <section class="dx-topo panel" aria-label="Indicadores principais">
  <div class="dx-exec"><span class="dx-rot">Execução física do projeto</span>
   <div class="dx-exec-num"><b>${pct(X.real)}%</b></div><div><span class="chip ${ST[X.st][0]}">${ST[X.st][1]}</span></div>
   <div class="medidor" role="img" aria-label="Executado ${pct(X.real)}%, previsto até o mês passado ${pct(X.prev)}%"><i class="${ST[X.st][0]}" style="width:${Math.min(100, X.real)}%"></i>${X.prev > 0 ? `<b style="left:${Math.min(100, X.prev)}%"></b>` : ''}</div>
   <p class="dx-exec-sub"><span>Previsto até ${X.ate}: <b>${pct(X.prev)}%</b></span><span>Mês <b>${X.mes}</b> de ${X.meses}</span></p>
   <details class="dx-como"><summary>Como é calculado</summary><p>Média ponderada pelo valor que o plano de trabalho destina a cada meta: ${X.porMeta.map(x => `Meta ${x.m} (${brl(x.valor).replace(',00', '')}): ${Math.round(x.feito)}%`).join(' · ')}. Cada etapa conta a quantidade registrada sobre a prevista. O traço na barra é o previsto pelo cronograma até o fim do mês passado. É execução física (o que foi entregue), não quanto do dinheiro foi gasto.</p></details></div>
  <div class="dx-kpis">${st.map((e, i) => kpi(i + 1, feito(e) / e.q * 100, feito(e), e.q, lab[e.id], sub[e.id])).join('')}</div>
 </section>
 <section class="at panel ${A.some(a => a[0] === 'bad') ? 'crit' : A.length ? 'pend' : ''}" aria-label="O que pede atenção">
  <div class="at-cab"><h2>O que pede atenção</h2><span class="chip">${A.length ? A.length + (A.length === 1 ? ' aviso' : ' avisos') : 'nada pendente'}</span></div>
  ${A.length ? `<div class="at-col" aria-hidden="true"><span>Problema</span><span>Prazo</span><span></span></div>
  <ul class="at-lista">${A.map(a => `<li class="at-item ${a[0]}"><div class="at-txt"><span class="at-tag">${a[0] === 'bad' ? 'Urgente' : 'Atenção'} · ${esc(a[1])}</span><b>${esc(a[3])}</b><span class="small">${esc(a[4])}</span></div>
   <div class="at-prazo">${a[5] ? `${dt(a[5])}<small>${prazoTxt(a[5])}</small>` : '—'}</div>
   <div class="at-acao">${a[6] ? `<button class="b" data-tab="${a[6]}">${R.podeGravar(eu, a[6] === 'financeiro' ? 'despesas' : a[6]) ? 'Resolver' : 'Consultar'}</button>` : ''}</div></li>`).join('')}</ul>` : '<p class="small">Nenhum prazo vencendo, nenhuma rubrica estourada, nenhuma unidade produtiva sem acompanhamento.</p>'}
 </section>
 <div class="two">
  <div class="panel box"><h3>Recursos do TED</h3><dl class="kv"><dt>Valor total</dt><dd>${brl(D.TOTAL)}</dd>${parcelasTxt()}<dt>Pago</dt><dd>${brl(R.soma(F, 'pago'))}</dd><dt>Comprometido (solicitado ou em compras)</dt><dd>${brl(R.soma(F, 'comp'))}</dd><dt>Disponível do que já foi recebido</dt><dd>${brl(rec - usado)}</dd></dl>
  ${bar(usado, D.TOTAL)}<div class="small">${num(usado / D.TOTAL * 100, 1)}% do valor total pago ou comprometido. Detalhe por meta e por rubrica na aba Financeiro.</div></div>
 </div>
 <div><div class="head"><div><h2>Cronograma físico do plano de trabalho</h2><p>Barra cinza: janela da etapa. Preenchimento: quanto da quantidade prevista já foi registrado. Linha âmbar: hoje.</p></div></div>
 <div class="panel scroll" style="margin-top:10px"><div class="gantt"><div class="g-row"><span></span><div class="g-months">${meses.map(m => `<span>${m}</span>`).join('')}</div><span></span></div>${g}</div></div></div>
 <div class="two">
  <div class="panel box"><h3>Produção e distribuição</h3>${Object.keys(prod).length ? `<div class="scroll"><table><thead><tr><th>Tipo</th><th class="n">Produzido</th><th class="n">Distribuído</th></tr></thead><tbody>${Object.entries(prod).map(([k, v]) => `<tr><td>${esc(k)}</td><td class="n">${num(v[0])} ${esc(v[2])}</td><td class="n">${num(v[1])} ${esc(v[2])}</td></tr>`).join('')}</tbody></table></div>` : '<div class="small">Nenhum lote registrado.</div>'}</div>
  <div class="panel box"><h3>Indicadores para a avaliação (Meta 5)</h3><dl class="kv">
   <dt>Gasto médio com insumos comprados, linha de base</dt><dd>${I.pares ? brl(I.base) + '/mês' : '—'}</dd>
   <dt>Gasto médio na última visita</dt><dd>${I.pares ? brl(I.atual) + '/mês' : '—'}</dd>
   <dt>Variação (${I.pares} unidade(s) com os dois dados)</dt><dd>${I.variacao == null ? '—' : num(I.variacao) + '%'}</dd>
   <dt>Visitas em que o bioinsumo foi aplicado</dt><dd>${I.visitas ? `${I.usou} de ${I.visitas}` : '—'}</dd>
   <dt>Participantes em capacitações e dias de campo</dt><dd>${I.participantes ? `${num(I.participantes)} (${num(I.mulheres / I.participantes * 100)}% mulheres)` : '—'}</dd></dl></div>
 </div>`;
  }
  /* ---------- unidades produtivas: indicadores, cartão por pessoa e ficha com o histórico ---------- */
  const iniciais = n => String(n || '?').replace(/\(.*?\)/g, '').trim().split(/\s+/).filter(Boolean).map(x => x[0]).filter((x, i, a) => i === 0 || i === a.length - 1).join('').toUpperCase() || '?';
  function situacaoAgr(a) {
    if (!a.diag) return ['bad', 'Sem linha de base'];
    const r = recebeu(a.id).length, v = visitasDe(a.id).length;
    if (r && v) return ['ok', 'Acompanhada'];
    if (r) return ['f', 'Recebeu, falta visita'];
    return ['', 'Aguardando bioinsumo'];
  }
  function telaAgricultores() {
    const L = db.agricultores, pode = R.podeGravar(eu, 'agricultores'), meta = 30;
    const base = L.filter(a => a.diag).length, kits = L.filter(a => a.kit).length, acomp = L.filter(acompanhada).length;
    const falta = (n, de) => n >= de ? 'completo' : `faltam ${de - n}`;
    const ordem = [...L].sort((a, b) => String(a.nome).localeCompare(String(b.nome), 'pt-BR'));
    const cartao = a => { const st = situacaoAgr(a), u = by('unidades', a.unidade), v = visitasDe(a.id);
      return `<li class="pc"><span class="pc-av" aria-hidden="true">${esc(iniciais(a.nome))}</span>
     <div class="pc-t"><div class="pc-n"><b>${esc(a.nome)}</b><span class="chip ${st[0]}">${st[1]}</span>${a.kit ? '<span class="chip ok">kit entregue</span>' : ''}${exChip(a)}</div>
      <div class="pc-d"><span>${esc(a.comunidade || 'comunidade não informada')}</span><span>${esc(a.municipio || '')}${a.uf ? '/' + esc(a.uf) : ''}</span>${a.culturas ? `<span>${esc(a.culturas)}</span>` : ''}${u ? `<span>${esc(u.nome)}</span>` : ''}<span>${recebeu(a.id).length} entrega(s) · ${v.length} visita(s)</span></div></div>
     <button class="b" data-ficha="${esc(a.id)}">Ver detalhes</button></li>`; };
    return `<div class="head"><div><h2>Agricultores e unidades produtivas</h2><p>Meta de ${meta} unidades produtivas acompanhadas e ${meta} kits. Registre a linha de base antes da primeira entrega de bioinsumo.</p></div><div class="acts">${pode ? '<button class="b p" data-new="agricultores">Nova unidade produtiva</button>' : ''}</div></div>
 <section class="dx-topo so panel" aria-label="Indicadores das unidades produtivas"><div class="dx-kpis">
  ${kpi(1, L.length / meta * 100, L.length, 'de ' + meta, 'unidades produtivas cadastradas', falta(L.length, meta))}
  ${kpi(2, L.length ? base / L.length * 100 : 0, base, 'de ' + L.length, 'com linha de base (diagnóstico inicial)', L.length ? falta(base, L.length) : 'nenhuma cadastrada')}
  ${kpi(3, kits / meta * 100, kits, 'de ' + meta, 'kits de apoio entregues', falta(kits, meta))}
  ${kpi(4, acomp / meta * 100, acomp, 'de ' + meta, 'acompanhadas (entrega e visita)', falta(acomp, meta))}</div></section>
 <div><div class="head"><div><h2>Quem está cadastrado</h2><p>Em ordem alfabética. A etiqueta mostra o que falta para a unidade contar como acompanhada.</p></div></div>
 ${ordem.length ? `<ul class="pcs">${ordem.map(cartao).join('')}</ul>` : `<div class="panel empty" style="margin-top:10px">Nenhuma unidade produtiva cadastrada ainda.${pode ? ' Use “Nova unidade produtiva”.' : ''}</div>`}</div>`;
  }
  function abrirFicha(id) {
    const a = by('agricultores', id); if (!a) return; ed = null; const st = situacaoAgr(a), u = by('unidades', a.unidade), ent = recebeu(id).sort((x, y) => x.data < y.data ? 1 : -1), vis = visitasDe(id);
    const linha = (r, v) => `<dt>${r}</dt><dd>${v}</dd>`; $('#frm').className = '';
    $('#frm').innerHTML = `<div class="pc-cab"><span class="pc-av g" aria-hidden="true">${esc(iniciais(a.nome))}</span><div><h2>${esc(a.nome)}</h2><div class="pc-n"><span class="chip ${st[0]}">${st[1]}</span>${a.kit ? '<span class="chip ok">kit entregue</span>' : ''}${exChip(a)}</div></div></div>
 <dl class="kv">${linha('Comunidade', esc(a.comunidade) || '—')}${linha('Município', (esc(a.municipio) || '—') + (a.uf ? '/' + esc(a.uf) : ''))}${linha('Território', esc(a.territorio) || '—')}${linha('Biofábrica que atende', esc(u ? u.nome : '') || '—')}
  ${linha('Culturas', esc(a.culturas) || '—')}${linha('Área cultivada', R.vazio(a.area) ? '—' : num(a.area, 1) + ' ha')}${linha('Diagnóstico inicial', a.diag ? dt(a.diag) : '<span class="chip bad">falta</span>')}
  ${linha('Usa químico', esc(a.quimico) || '—')}${linha('Gasto com insumos (linha de base)', R.vazio(a.gasto0) ? '—' : brl(a.gasto0) + '/mês')}${linha('Kit de apoio', a.kit ? 'entregue em ' + dt(a.kitdata) : 'não entregue')}</dl>
 <div><h3>Bioinsumos recebidos (${ent.length})</h3>${ent.length ? `<div class="scroll"><table><tbody>${ent.map(d => { const l = by('lotes', d.lote) || {}; return `<tr><td>${dt(d.data)}</td><td><span class="mono">${esc(l.codigo || '')}</span> ${esc(l.tipo || '')}</td><td class="n">${num(d.qtd)} ${esc(l.med || '')}</td></tr>`; }).join('')}</tbody></table></div>` : '<p class="small">Nenhuma entrega registrada.</p>'}</div>
 <div><h3>Visitas de monitoramento (${vis.length})</h3>${vis.length ? `<div class="scroll"><table><tbody>${vis.map(v => `<tr><td>${dt(v.data)}</td><td><span class="chip ${v.usou === 'Sim' ? 'ok' : v.usou === 'Não' ? 'bad' : 'f'}">aplicou: ${esc(v.usou)}</span></td><td>${R.vazio(v.gasto) ? '' : brl(v.gasto) + '/mês'}</td><td class="small">${esc(v.obs || '')}</td></tr>`).join('')}</tbody></table></div>` : '<p class="small">Nenhuma visita registrada.</p>'}</div>
 <div class="frow">${R.podeExcluir(eu, 'agricultores', a) && !a._pendente ? `<button type="button" class="b d" data-del="agricultores:${esc(id)}" data-fechaapos>Excluir</button>` : ''}<button type="button" class="b" data-fechar>Fechar</button>
  ${R.podeGravar(eu, 'visitas') ? `<button type="button" class="b" data-new="visitas" data-pre="${esc(id)}">Registrar visita</button><button type="button" class="b" data-new="distribuicoes" data-pre="${esc(id)}">Registrar entrega</button><button type="button" class="b p" data-edit="agricultores:${esc(id)}">Editar cadastro</button>` : ''}</div>`;
    if (!$('#dlg').open) $('#dlg').showModal();
  }
  /* ---------- financeiro: gráfico do ritmo do gasto, uso de cada rubrica e tabela que abre ---------- */
  let ritmoAtual = null;   // o que o gráfico mostrou por último (a dica ao passar o mouse lê daqui)
  const GR = { w: 640, h: 300, l: 78, r: 14, t: 14, b: 30 };
  function graficoRitmo() {
    const X = R.ritmo(db, hoje()), P = X.pontos, n = P.length, max = X.total; ritmoAtual = X;
    const x = i => GR.l + (GR.w - GR.l - GR.r) * (i + 1) / n, y = v => GR.h - GR.b - (GR.h - GR.t - GR.b) * v / max, x0 = GR.l;
    const linha = k => { const pts = P.map((p, i) => p[k] == null ? null : [x(i), y(p[k])]).filter(Boolean); return pts.length ? 'M' + [[x0, y(0)]].concat(pts).map(q => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' L') : ''; };
    // recebido entra de uma vez (parcela): linha em degrau
    const degrau = () => { let d = `M${x0} ${y(0)}`, ant = 0; P.forEach((p, i) => { if (p.recebido == null) return; d += ` L${x(i).toFixed(1)} ${y(ant).toFixed(1)}`; if (p.recebido !== ant) { d += ` L${x(i).toFixed(1)} ${y(p.recebido).toFixed(1)}`; ant = p.recebido; } }); return d; };
    const ult = P.filter(p => p.executado != null).length - 1, grade = [0, .25, .5, .75, 1].map(f => max * f);
    const mk = v => v === 0 ? '0' : 'R$ ' + num(v / 1000) + ' mil';
    const atual = P.findIndex(p => p.atual);
    return `<div class="panel box fin-g"><div><h2 class="fin-t">Ritmo do gasto <small>acumulado mês a mês</small></h2>
   <div class="leg"><span><i class="lg prev"></i>Previsto (plano de desembolso)</span><span><i class="lg exec"></i>Pago</span><span><i class="lg rec"></i>Recebido do MDA</span></div></div>
   <div class="rg" data-rg><svg viewBox="0 0 ${GR.w} ${GR.h}" role="img" aria-label="Gasto acumulado mês a mês: previsto, pago e recebido. Os valores estão na tabela logo abaixo.">
    ${grade.map(v => `<line class="gr" x1="${GR.l}" x2="${GR.w - GR.r}" y1="${y(v)}" y2="${y(v)}"/><text class="ax" x="${GR.l - 8}" y="${y(v) + 4}" text-anchor="end">${mk(v)}</text>`).join('')}
    ${P.map((p, i) => i % 2 ? '' : `<text class="ax" x="${x(i)}" y="${GR.h - 8}" text-anchor="middle">${p.rotulo}</text>`).join('')}
    ${atual >= 0 ? `<line class="hj" x1="${x(atual)}" x2="${x(atual)}" y1="${GR.t}" y2="${GR.h - GR.b}"/><text class="ax" x="${x(atual) + 5}" y="${GR.t + 10}">mês atual</text>` : ''}
    <path class="l prev" d="${linha('previsto')}"/><path class="l rec" d="${degrau()}"/><path class="l exec" d="${linha('executado')}"/>
    ${ult >= 0 ? `<circle class="pt exec" cx="${x(ult)}" cy="${y(P[ult].executado)}" r="4.5"/><circle class="pt rec" cx="${x(ult)}" cy="${y(P[ult].recebido)}" r="4.5"/>` : ''}
    <line class="cr" data-cr x1="0" x2="0" y1="${GR.t}" y2="${GR.h - GR.b}" hidden/></svg><div class="dica" data-dica hidden></div></div>
   <p class="small">Passe o mouse ou toque num mês. O previsto é o plano de desembolso enviado à FUNCERN (atualização de 05/10/2026) e fecha em ${brl(X.total)}.</p>
   <details class="dx-como"><summary>Ver os números em tabela</summary><div class="scroll"><table><thead><tr><th>Mês</th><th class="n">Previsto</th><th class="n">Pago</th><th class="n">Recebido</th></tr></thead><tbody>${P.map(p => `<tr><td>${p.rotulo}</td><td class="n">${brl(p.previsto)}</td><td class="n">${p.executado == null ? '—' : brl(p.executado)}</td><td class="n">${p.recebido == null ? '—' : brl(p.recebido)}</td></tr>`).join('')}</tbody></table></div></details></div>`;
  }
  function usoRubricas(FR) {
    const t = R.tempoDecorrido(hoje()) * 100;
    return `<div class="panel box fin-g"><div><h2 class="fin-t">Uso de cada rubrica <small>% do previsto · clique para ver os itens</small></h2>
   <div class="leg"><span><i class="lg exec"></i>Pago</span><span><i class="lg comp"></i>Comprometido</span><span><i class="lg tempo"></i>Tempo decorrido (${pct(t)}%)</span></div></div>
   <div class="ur">${FR.filter(r => !r.semRubrica).map(r => { const a = r.prev ? r.pago / r.prev * 100 : 0, b = r.prev ? r.comp / r.prev * 100 : 0, tot = a + b;
      return `<button type="button" class="ur-l" data-rub="${r.id}" title="Pago ${brl(r.pago)} · comprometido ${brl(r.comp)} · previsto ${brl(r.prev)}"><span class="ur-n">${esc(r.nome)}</span><span class="ur-p${tot > 100 ? ' est' : ''}">${pct(tot)}%${tot > 100 ? ' · acima' : ''}</span>
       <span class="ur-b"><i class="exec" style="width:${Math.min(100, a)}%"></i><i class="comp" style="left:${Math.min(100, a)}%;width:${Math.max(0, Math.min(100 - Math.min(100, a), b))}%"></i><b style="left:${t}%"></b></span></button>`; }).join('')}</div>
   <p class="small">O traço marca quanto da vigência já passou. Barra muito à frente do traço: a rubrica acaba antes do projeto. Muito atrás: há recurso parado.</p></div>`;
  }
  function tabelaRubricas(FR) {
    const linha = r => { const u = r.prev ? (r.pago + r.comp) / r.prev * 100 : 0, itens = D.DESEMBOLSO.itens.filter(i => i.rubrica === r.id), ds = db.despesas.filter(d => r.semRubrica ? !D.RUBRICAS.some(x => x.id === d.rubrica) : d.rubrica === r.id).sort((a, b) => a.data < b.data ? 1 : -1);
      const v = (x, forte) => x ? (forte ? `<b>${brl(x)}</b>` : brl(x)) : '—';
      return `<details class="rb" id="rb-${r.id || 'sem'}"><summary><span class="rb-n"><i class="rb-s" aria-hidden="true"></i><span>${esc(r.nome)}</span><span class="chip">${itens.length ? itens.length + (itens.length === 1 ? ' item' : ' itens') : ds.length + ' despesa(s)'}</span></span>
     <span class="rb-v" data-r="Previsto">${v(r.prev)}</span><span class="rb-v" data-r="Pago">${v(r.pago)}</span><span class="rb-v" data-r="Comprometido">${v(r.comp)}</span><span class="rb-v${r.saldo < 0 ? ' neg' : ''}" data-r="Saldo"><b>${brl(r.saldo)}</b></span>
     <span class="rb-e"><span class="medidor fino"><i class="${u > 100 ? 'bad' : ''}" style="width:${Math.min(100, u)}%"></i></span><b>${pct(u)}%</b></span></summary>
    <div class="rb-c">${itens.length ? `<div><h3>Itens do plano</h3><div class="scroll"><table><thead><tr><th>Item</th><th class="n">Previsto</th><th>Meses com desembolso previsto</th></tr></thead><tbody>${itens.map(i => { const tot = i.m.reduce((a, b) => a + b, 0), ms = i.m.map((x, k) => x ? k : -1).filter(k => k >= 0);
        return `<tr><td>${esc(i.nome)}</td><td class="n">${brl(tot)}</td><td class="small">${ms.length === 12 ? 'todos os meses' : ms.map(k => ritmoAtual ? ritmoAtual.pontos[k].rotulo : k + 1).join(', ')}</td></tr>`; }).join('')}</tbody></table></div></div>` : ''}
     <div><h3>Despesas lançadas nesta rubrica</h3>${ds.length ? `<div class="scroll"><table><thead><tr><th>Data</th><th>Etapa</th><th>Descrição</th><th>Situação</th><th class="n">Valor</th></tr></thead><tbody>${ds.map(d => `<tr><td>${dt(d.data)}${exChip(d)}</td><td><span class="mono">${esc(d.etapa)}</span></td><td>${esc(d.descricao)}${d.favorecido ? `<div class="small">${esc(d.favorecido)}</div>` : ''}</td><td><span class="chip ${d.status === 'Pago' ? 'ok' : 'f'}">${esc(d.status)}</span></td><td class="n">${brl(d.valor)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="small">Nenhuma despesa lançada ainda.</p>'}</div></div></details>`; };
    return `<div><div class="head"><div><h2>Por rubrica</h2><p>Toque na rubrica para ver os itens do plano e as despesas lançadas nela.</p></div><div class="acts"><button class="b" data-abrir-rub>Abrir todas</button></div></div>
   <div class="panel rb-t" style="margin-top:10px"><div class="rb-h" aria-hidden="true"><span>Rubrica</span><span>Previsto</span><span>Pago</span><span>Comprometido</span><span>Saldo</span><span>Execução</span></div>${FR.map(linha).join('')}
    <div class="rb-tot"><span>Total</span><span>${brl(R.soma(FR, 'prev'))}</span><span>${brl(R.soma(FR, 'pago'))}</span><span>${brl(R.soma(FR, 'comp'))}</span><span><b>${brl(R.soma(FR, 'saldo'))}</b></span><span></span></div></div>
   <p class="note" style="margin-top:8px">Passar de uma rubrica para outra exige ajuste do plano de trabalho. O sistema avisa no painel quando uma rubrica chega a 90% ou estoura.</p></div>`;
  }
  /* dica do gráfico: mês mais próximo do ponteiro, com os três valores */
  function aoMoverGrafico(ev) {
    const g = ev.target.closest && ev.target.closest('[data-rg]'); const dica = document.querySelector('[data-dica]'), cr = document.querySelector('[data-cr]');
    if (!g || !ritmoAtual) { if (dica) dica.hidden = true; if (cr) cr.setAttribute('hidden', ''); return; }
    const svg = g.querySelector('svg'), b = svg.getBoundingClientRect(), P = ritmoAtual.pontos, n = P.length, k = GR.w / b.width;
    const px = (ev.clientX - b.left) * k, i = Math.max(0, Math.min(n - 1, Math.round((px - GR.l) / (GR.w - GR.l - GR.r) * n) - 1)), p = P[i], cx = GR.l + (GR.w - GR.l - GR.r) * (i + 1) / n;
    cr.removeAttribute('hidden'); cr.setAttribute('x1', cx); cr.setAttribute('x2', cx);
    dica.innerHTML = `<b>${p.rotulo}</b><span><i class="lg prev"></i>Previsto <b>${brl(p.previsto)}</b></span>${p.executado == null ? '<span class="small">mês que ainda não chegou</span>' : `<span><i class="lg exec"></i>Pago <b>${brl(p.executado)}</b></span><span><i class="lg rec"></i>Recebido <b>${brl(p.recebido)}</b></span>`}`;
    dica.hidden = false; const gb = g.getBoundingClientRect(), esq = cx / k; dica.style.left = Math.max(0, Math.min(gb.width - dica.offsetWidth, esq > gb.width / 2 ? esq - dica.offsetWidth - 12 : esq + 12)) + 'px';
  }
  function financeiro() {
    const F = R.fin(db), FR = R.finRubrica(db), pago = R.soma(F, 'pago'), comp = R.soma(F, 'comp'), usado = pago + comp, rec = R.recebido(), prox = D.PARCELAS.find(p => !p.recebida);
    const mil = v => num(v / 1000, Math.abs(v) % 1000 ? 1 : 0);
    return `<div class="head"><div><h2>Acompanhamento financeiro</h2><p>Valores previstos no plano de trabalho, comparados com as despesas lançadas aqui. O registro oficial continua sendo o da FUNCERN; confira os dois antes de cada prestação de contas.</p></div></div>
 <section class="dx-topo panel" aria-label="Resumo financeiro">
  <div class="dx-exec"><span class="dx-rot">Execução financeira do projeto</span>
   <div class="dx-exec-num"><b>${pct(usado / D.TOTAL * 100)}%</b></div><div><span class="chip ${usado > rec ? 'bad' : 'ok'}">${usado > rec ? 'Acima do que já foi recebido' : 'Dentro do que já foi recebido'}</span></div>
   <div class="medidor" role="img" aria-label="Pago ou comprometido ${pct(usado / D.TOTAL * 100)}% do total; recebido ${pct(rec / D.TOTAL * 100)}%"><i class="${usado > rec ? 'bad' : ''}" style="width:${Math.min(100, usado / D.TOTAL * 100)}%"></i><b style="left:${Math.min(100, rec / D.TOTAL * 100)}%"></b></div>
   <p class="dx-exec-sub"><span>Pago ou comprometido: <b>${brl(usado)}</b></span><span>Total do TED: <b>${brl(D.TOTAL)}</b></span></p>
   <details class="dx-como"><summary>Como é calculado</summary><p>Soma das despesas pagas e das comprometidas (solicitadas ou em compras na FUNCERN), dividida pelo valor total do TED. O traço na barra marca quanto já foi repassado à fundação (${pct(rec / D.TOTAL * 100)}%). São os valores lançados neste sistema; o registro oficial é o da FUNCERN.</p></details></div>
  <div class="dx-kpis fin">${kpi(1, rec / D.TOTAL * 100, mil(rec), 'de ' + mil(D.TOTAL) + ' mil', 'recebido', prox ? `próxima parcela de ${brl(prox.valor)} prevista para ${mesAno(prox.previsao)}` : 'todas as parcelas recebidas')}
   ${kpi(2, pago / rec * 100, mil(pago), 'de ' + mil(rec) + ' mil', 'pago', `${db.despesas.filter(d => d.status === 'Pago').length} despesa(s) paga(s)`)}
   ${kpi(3, comp / rec * 100, mil(comp), 'de ' + mil(rec) + ' mil', 'comprometido', `${db.despesas.filter(d => d.status !== 'Pago').length} despesa(s) solicitada(s) ou em compras`)}
   ${kpi(4, (rec - usado) / rec * 100, mil(rec - usado), 'de ' + mil(rec) + ' mil', 'disponível do recebido', rec - usado < 0 ? 'o lançado passa do que já foi recebido' : 'recebido menos pago e comprometido')}</div>
 </section>
 <div class="two fin-2">${graficoRitmo()}${usoRubricas(FR)}</div>
 ${tabelaRubricas(FR)}
 <div><div class="head"><div><h2>Por meta do TED</h2><p>O mesmo gasto, visto pelas metas do plano pactuado com o MDA.</p></div></div><div class="panel scroll" style="margin-top:10px">${finTabela(F, 'Meta')}</div></div>
 ${tabela('despesas')}`;
  }
  function relatorio() {
    if (!rel) rel = { de: D.G0, ate: iso(hoje()) };
    const no = s => !!s && s >= rel.de && s <= rel.ate, F = R.fin(db, rel.ate), FR = R.finRubrica(db, rel.ate);
    const ev = db.eventos.filter(e => no(e.data)).sort((a, b) => a.data > b.data ? 1 : -1), lo = db.lotes.filter(l => no(l.inicio)), di = db.distribuicoes.filter(d => no(d.data)), vi = db.visitas.filter(v => no(v.data)), en = db.entregas.filter(g => no(g.data)), de = db.despesas.filter(d => no(d.data));
    const tl = (h, rows) => rows.length ? `<div class="scroll"><table><thead><tr>${h.map(x => `<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '<p class="small">Sem registros no período.</p>';
    const ben = new Set(di.map(d => d.agricultor)).size, tp = ev.reduce((s, e) => s + (+e.part || 0), 0), tm = ev.reduce((s, e) => s + (+e.mulheres || 0), 0);
    return `<div class="head noprint"><div><h2>Relatório de execução</h2><p>Escolha o período. As metas físicas e o financeiro saem acumulados até a data final; as atividades, só as do período.</p></div></div>
 <div class="ctrl noprint"><div class="fld"><label for="rde">De</label><input type="date" id="rde" value="${rel.de}"></div><div class="fld"><label for="rate">Até</label><input type="date" id="rate" value="${rel.ate}"></div><button class="b p" data-rel>Gerar</button><button class="b" data-print>Imprimir ou salvar em PDF</button></div>
 <div class="panel rel">
 <div><h3>Relatório de execução · ${dt(rel.de)} a ${dt(rel.ate)}</h3><h2>${esc(D.NOME_COMPLETO)}</h2>
 <p class="small">${esc(D.IDENT)}<br>Gerado em ${hoje().toLocaleDateString('pt-BR')} por ${esc(eu ? eu.nome : '')}</p></div>
 <section><h4>1. Execução física acumulada</h4>${tl(['Etapa', 'Descrição', 'Previsto', 'Realizado', '%'], D.ETAPAS.map(e => [`<span class="mono">${e.id}</span>`, e.nome, `${e.q} ${e.un}`, feito(e), num(Math.min(100, feito(e) / e.q * 100)) + '%']))}</section>
 <section><h4>2. Unidades de produção de bioinsumos</h4>${tl(['Unidade', 'Modelo', 'Implantação', 'Parceiro institucional'], db.unidades.map(u => [esc(u.nome) + (u.conta === 'Sim' ? '' : ' (apoio)'), esc(u.modelo), `${nCheck(u)} de ${D.CHECK.length} etapas${u.funcionando ? ' · em funcionamento' : ''}`, esc(u.parceiro) || 'a definir']))}</section>
 <section><h4>3. Capacitações, dias de campo e reuniões no período</h4>${tl(['Data', 'Tipo', 'Tema', 'Local', 'Participantes'], ev.map(e => [dt(e.data), esc(e.tipo), esc(e.tema), esc(e.lugar) + (e.municipio ? ' · ' + esc(e.municipio) : ''), R.vazio(e.part) ? '—' : `${num(e.part)} (${num(e.mulheres)} mulheres)`]))}${tp ? `<p>Total de ${num(tp)} participações, ${num(tm / tp * 100)}% de mulheres.</p>` : ''}</section>
 <section><h4>4. Produção de bioinsumos no período</h4>${tl(['Lote', 'Tipo', 'Unidade', 'Início', 'Situação', 'Produzido'], lo.map(l => [`<span class="mono">${esc(l.codigo)}</span>`, esc(l.tipo), esc((by('unidades', l.unidade) || {}).nome), dt(l.inicio), esc(l.status), `${num(l.qtd)} ${esc(l.med)}`]))}</section>
 <section><h4>5. Distribuição no período</h4>${tl(['Data', 'Lote', 'Unidade produtiva', 'Cultura', 'Quantidade'], di.map(d => { const l = by('lotes', d.lote) || {}; return [dt(d.data), `<span class="mono">${esc(l.codigo)}</span>`, esc((by('agricultores', d.agricultor) || {}).nome), esc(d.cultura), `${num(d.qtd)} ${esc(l.med || '')}`]; }))}${di.length ? `<p>${di.length} entrega(s) a ${ben} unidade(s) produtiva(s).</p>` : ''}</section>
 <section><h4>6. Monitoramento do uso no período</h4>${tl(['Data', 'Unidade produtiva', 'Aplicou?', 'Vigor', 'Observações'], vi.map(v => [dt(v.data), esc((by('agricultores', v.agricultor) || {}).nome), esc(v.usou), v.vigor ? esc(v.vigor) + '/5' : '—', esc(v.obs) + (v.problemas ? ' Dificuldade: ' + esc(v.problemas) : '')]))}${vi.length ? `<p>${vi.length} visita(s); em ${vi.filter(v => v.usou === 'Sim').length} o bioinsumo havia sido aplicado.</p>` : ''}</section>
 <section><h4>7. Entregas e evidências no período</h4>${tl(['Etapa', 'Entrega', 'Data'], en.map(g => [`<span class="mono">${esc(g.etapa)}</span>`, esc(g.titulo), dt(g.data)]))}</section>
 <section><h4>8. Execução financeira acumulada até ${dt(rel.ate)}, por meta</h4><div class="scroll">${finTabela(F, 'Meta')}</div></section>
 <section><h4>9. Execução financeira acumulada até ${dt(rel.ate)}, por rubrica</h4><div class="scroll">${finTabela(FR, 'Rubrica')}</div><p class="small">Valores lançados no sistema. O registro oficial é o da FUNCERN.</p></section>
 <section><h4>10. Despesas do período</h4>${tl(['Data', 'Etapa', 'Rubrica', 'Descrição', 'Situação', 'Valor'], de.map(d => [dt(d.data), `<span class="mono">${esc(d.etapa)}</span>`, esc(nomeRubrica(d.rubrica)), esc(d.descricao), esc(d.status), brl(d.valor)]))}</section>
 </div>`;
  }
  const NOME_ACAO = { INSERT: 'incluiu', UPDATE: 'alterou', DELETE: 'excluiu' };
  function historico() {
    if (!hist) return '<div class="acts"><button class="b" data-hist>Carregar o histórico</button></div>';
    if (!hist.length) return '<div class="small">Nenhuma alteração registrada ainda.</div>';
    const nomeDe = id => (db.pessoas.find(p => p.id === id) || {}).nome || (id ? 'pessoa removida' : 'direto no banco');
    const mudou = h => { if (h.acao !== 'UPDATE' || !h.antes || !h.depois) return ''; return Object.keys(h.depois).filter(k => !/^(atualizado_em|criado_em|criado_por|auth_id)$/.test(k) && JSON.stringify(h.antes[k]) !== JSON.stringify(h.depois[k])).map(k => `${k}: ${JSON.stringify(h.antes[k])} → ${JSON.stringify(h.depois[k])}`).join('\n'); };
    const resumo = h => { const o = h.depois || h.antes || {}; return o.nome || o.codigo || o.titulo || o.tema || o.descricao || o.data || ''; };
    return `<div class="scroll"><table class="hist"><thead><tr><th>Quando</th><th>Quem</th><th>O quê</th><th>Detalhe</th></tr></thead><tbody>${hist.map(h => `<tr><td>${new Date(h.em).toLocaleString('pt-BR')}</td><td>${esc(nomeDe(h.por))}</td><td>${NOME_ACAO[h.acao] || esc(h.acao)} em ${esc((MOD[h.tabela] || {}).nome || h.tabela)}<div class="small">${esc(resumo(h))}</div></td><td>${mudou(h) ? `<details><summary>ver o que mudou</summary><pre>${esc(mudou(h))}</pre></details>` : ''}</td></tr>`).join('')}</tbody></table></div><div class="small">Últimas ${hist.length} alterações.</div>`;
  }
  function dados() {
    return `<div class="head"><div><h2>Dados</h2><p>${demo() ? 'Modo demonstração: os registros ficam guardados somente neste navegador.' : 'Os registros ficam no banco do projeto (Supabase) e aparecem em qualquer aparelho de quem tem acesso.'}</p></div></div>
 <div class="panel box"><h3>Planilhas para a prestação de contas (.csv)</h3><div class="acts">${Object.keys(MOD).filter(m => m !== 'pessoas').map(m => `<button class="b s" data-exp="${m}">${MOD[m].nome}</button>`).join('')}</div>
 <div class="small">Abre no Excel e no LibreOffice. A planilha de unidades produtivas tem dados pessoais: guarde em pasta do projeto, não envie por aplicativo de mensagem.</div></div>
 <div class="panel box"><h3>Cópia de segurança</h3><div class="acts"><button class="b" data-exp="json">Baixar cópia completa (.json)</button></div><div id="msg" class="small"></div></div>
 <div class="panel box"><h3>Minha senha</h3>${demo() ? '<div class="small">A demonstração não usa senha.</div>' : '<div class="acts"><button class="b" data-senha>Trocar a minha senha</button></div>'}</div>
 ${coord() ? tabela('pessoas') + (demo() ? `<div class="panel box"><h3>Recomeçar a demonstração</h3><div class="acts"><button class="b d" data-zerar>Apagar tudo e voltar aos exemplos</button></div></div>`
      : `<div><div class="head"><div><h2>Histórico de alterações</h2><p>Tudo o que foi incluído, alterado ou excluído, com quem fez e quando. Só a coordenação vê.</p></div></div><div class="panel box" style="margin-top:10px">${historico()}</div></div>`) : ''}`;
  }
  function render() {
    if (!eu || !db) return;
    nav(); const v = $('#view');
    v.innerHTML = avisoFila() + (tab === 'painel' ? painel() : tab === 'dados' ? dados() : tab === 'financeiro' ? financeiro() : tab === 'relatorios' ? relatorio() : tab === 'unidades' ? tabela('unidades') + tabela('itens') : tab === 'agricultores' ? telaAgricultores() : tabela(tab));
    $('#quem').textContent = demo() ? eu.perfil + ' · demonstração' : eu.nome + ' · ' + eu.perfil;
    $('#net').hidden = navigator.onLine !== false && !(api.offline);
  }

  /* ---------- formulário ---------- */
  function abrir(m, id, pre) {
    const M = MOD[m], r = id ? (by(m, id) || {}) : (m === 'pessoas' ? { ativo: true } : pre ? { agricultor: pre } : {}); ed = { m, id };
    const campo = ([k, l, t, req, o, filtro]) => {
      const v = r[k] == null ? '' : r[k], idc = 'f_' + k, Rq = req ? ' required' : '';
      if (t === 'checks') return `<div class="fld w"><fieldset><legend>${l}</legend>${D.CHECK.map(c => `<label><input type="checkbox" id="f_${c[0]}" ${r[c[0]] ? 'checked' : ''}>${c[1]}</label>`).join('')}</fieldset></div>`;
      if (t === 'check') return `<div class="fld"><span aria-hidden="true"></span><fieldset><label><input type="checkbox" id="${idc}" ${v ? 'checked' : ''}>${l}</label></fieldset></div>`;
      if (t === 'select') { const ops = typeof o === 'function' ? o() : o; return `<div class="fld"><label for="${idc}">${l}</label><select id="${idc}"${Rq}>${ops.map(x => `<option value="${esc(x[0])}" ${String(v) === String(x[0]) ? 'selected' : ''}>${esc(x[1]) || '—'}</option>`).join('')}</select></div>`; }
      if (t === 'ref') { const lista = db[o].filter(x => !filtro || filtro(x) || x.id === v); return `<div class="fld"><label for="${idc}">${l}</label><select id="${idc}"${Rq}><option value="">Escolha</option>${lista.map(x => `<option value="${esc(x.id)}" ${v === x.id ? 'selected' : ''}>${esc(rotulo[o](x))}</option>`).join('')}</select></div>`; }
      if (t === 'textarea') return `<div class="fld w"><label for="${idc}">${l}</label><textarea id="${idc}">${esc(v)}</textarea></div>`;
      return `<div class="fld${['nome', 'tema', 'titulo', 'descricao', 'email'].includes(k) ? ' w' : ''}"><label for="${idc}">${l}</label><input id="${idc}" type="${t}" ${t === 'number' ? 'step="any" min="0" inputmode="decimal"' : ''} value="${esc(v === '' && t === 'date' && req && !id ? iso(hoje()) : v)}"${Rq}></div>`;
    };
    // os campos vão em grupos: cada marcador de seção (tipo 'sec') fecha um grupo e abre outro com título
    let corpo = '', aberto = false; const dica = k => M.dicas && M.dicas[k] ? `<span class="fm-dica">${esc(M.dicas[k])}</span>` : '';
    M.campos.forEach(c => {
      if (c[2] === 'sec') { corpo += (aberto ? '</div>' : '') + `<h3 class="fm-sec">${c[1]}</h3><div class="fields">`; aberto = true; return; }
      if (!aberto) { corpo += '<div class="fields">'; aberto = true; }
      corpo += campo(c).replace(/<\/div>$/, dica(c[0]) + '</div>');
    });
    if (aberto) corpo += '</div>';
    $('#frm').innerHTML = `<div class="fm-cab"><div><span class="fm-eye">${id ? 'Editar cadastro' : 'Novo cadastro'}</span><h2>${esc(M.um || M.novo)}</h2></div><button type="button" class="fm-x" data-fechar aria-label="Fechar">×</button></div>
     <div class="fm-corpo">${M.oque && !id ? `<div class="fm-oque"><span>O que é</span><p>${esc(M.oque)}</p></div>` : ''}${corpo}</div>
     <div class="fm-pe"><div class="err" id="ferr" role="alert"></div><div class="frow"><button type="button" class="b" data-fechar>Cancelar</button><button class="b p" id="fsalvar">Salvar</button></div></div>`;
    $('#frm').className = 'fm';
    $('#dlg').showModal();
  }
  /* guarda no aparelho quando não há internet (só o que a equipe lança em campo; despesas e acessos exigem conexão) */
  async function enfileirar(m, r) {
    const it = { id: SQC.fila.chave(m, r.id), tabela: m, dados: r, dono: eu.id, erro: '', reenviar: true };
    await SQC.fila.salvar(it); pend = await SQC.fila.listar(eu.id); aplicarFila();
  }
  function aplicarFila() {
    pend.forEach(p => { const r = Object.assign({}, p.dados, { _pendente: true, _erro: p.erro || '' }); const i = db[p.tabela].findIndex(x => x.id === r.id); if (i >= 0) db[p.tabela][i] = Object.assign({}, db[p.tabela][i], r); else db[p.tabela].push(r); });
  }
  async function gravarRegistro(m, r, ant) {
    const limpo = Object.assign({}, r); delete limpo._pendente; delete limpo._erro;
    try {
      const salvo = await api.salvar(m, limpo);
      const i = db[m].findIndex(x => x.id === salvo.id); if (i >= 0) db[m][i] = salvo; else db[m].push(salvo);
      await SQC.fila.remover(SQC.fila.chave(m, salvo.id)); pend = pend.filter(p => p.id !== SQC.fila.chave(m, salvo.id));
      if (eu && salvo.id === eu.id) eu = salvo;
      if (api.guardarCopia) api.guardarCopia(db);
      return { ok: true };
    } catch (e) {
      if (e.semRede && !demo() && !R.RESTRITAS.includes(m)) { await enfileirar(m, limpo); return { ok: true, fila: true }; }
      return { ok: false, msg: e.message };
    }
  }
  async function aoSalvar(ev) {
    ev.preventDefault(); if (!ed) return; const { m, id } = ed, M = MOD[m], ant = id ? Object.assign({}, by(m, id)) : null, r = id ? Object.assign({}, ant) : { id: SQC.novoId() };
    const er = t => { $('#ferr').textContent = t; };
    for (const [k, l, t, req] of M.campos) {
      if (t === 'sec') continue;
      if (t === 'checks') { D.CHECK.forEach(c => { r[c[0]] = $('#f_' + c[0]).checked; }); continue; }
      const el = $('#f_' + k); r[k] = t === 'check' ? el.checked : t === 'number' ? (el.value === '' ? '' : +el.value) : el.value.trim();
      if (t === 'number' && el.value !== '' && !(r[k] >= 0)) { er(`“${l}” precisa ser um número positivo.`); el.focus(); return; }
      if (req && (r[k] === '' || r[k] == null)) { er(`Preencha “${l}”.`); el.focus(); return; }
    }
    if (m === 'lotes' && !r.dias && r.dias !== 0) r.dias = (D.TIPOS[r.tipo] || [0, 30])[1];
    if (m === 'pessoas') r.email = r.email.toLowerCase();
    const msg = R.validar(db, m, r, ant); if (msg) return er(msg);
    const b = $('#fsalvar'); b.disabled = true; b.textContent = 'Salvando…';
    const res = await gravarRegistro(m, r, ant);
    b.disabled = false; b.textContent = 'Salvar';
    if (!res.ok) return er(res.msg);
    $('#dlg').close(); ed = null; render();
    if (res.fila) toast('Sem internet: guardado neste aparelho. Envia sozinho quando o sinal voltar.');
    else if (m === 'pessoas' && !id && !demo()) toast('Acesso criado. Avise a pessoa para abrir o sistema e usar “Primeiro acesso”.');
  }

  /* ---------- planilhas e cópia ---------- */
  function csv(m) {
    const M = MOD[m], cs = M.campos.filter(c => c[2] !== 'checks' && c[2] !== 'sec'), q = s => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
    // texto que começa com = + - @ vira fórmula no Excel: um apóstrofo na frente desarma
    const seguro = v => typeof v === 'string' && /^[=+\-@\t\r]/.test(v) ? "'" + v : v;
    const val = (c, r) => c[2] === 'ref' ? (by(c[4], r[c[0]]) ? rotulo[c[4]](by(c[4], r[c[0]])) : '') : c[2] === 'check' ? (r[c[0]] ? 'Sim' : 'Não') : c[0] === 'rubrica' ? nomeRubrica(r[c[0]]) : typeof r[c[0]] === 'number' ? String(r[c[0]]).replace('.', ',') : r[c[0]];
    const head = [...(m === 'lotes' ? ['Código'] : []), ...cs.map(c => c[1]), ...(m === 'unidades' ? D.CHECK.map(c => c[1]) : []), ...(m === 'lotes' ? ['Saldo'] : [])];
    const lin = db[m].filter(r => !r._pendente).map(r => [...(m === 'lotes' ? [r.codigo] : []), ...cs.map(c => val(c, r)), ...(m === 'unidades' ? D.CHECK.map(c => r[c[0]] ? 'Sim' : 'Não') : []), ...(m === 'lotes' ? [String(saldo(r)).replace('.', ',')] : [])].map(seguro).map(q).join(';'));
    return '﻿' + [head.map(q).join(';'), ...lin].join('\r\n');
  }
  function baixar(nome, txt, tipo) {
    try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: tipo })); a.download = nome; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); toast('Arquivo gerado: ' + nome); }
    catch (e) { toast('Este navegador não deixou baixar o arquivo.'); }
  }

  /* ---------- entrada no sistema ---------- */
  const EXP = 'Sessão encerrada após 15 minutos sem uso. Entre de novo para continuar.';
  function telaAcesso(msg, ok) {
    $('#carregando').hidden = true; $('#app').hidden = true; $('#auth').hidden = false;
    const f = (id, l, t, ac) => `<div class="fld"><label for="${id}">${l}</label><input id="${id}" type="${t}" autocomplete="${ac}" required></div>`;
    const aviso = `<div class="err" id="aerr" role="alert">${esc(msg || '')}</div><div class="ok-msg" id="aok" role="status">${esc(ok || '')}</div>`;
    if (demo()) {
      $('#authcorpo').innerHTML = `<p class="small">Modo demonstração: os dados ficam só neste navegador e os registros marcados como “exemplo” são fictícios. Escolha com qual perfil quer ver o sistema.</p><div class="acts"><button class="b p" data-demo="Coordenação">Entrar como Coordenação</button><button class="b" data-demo="Equipe">Entrar como Equipe</button></div>${aviso}`;
      return;
    }
    if (authModo === 'nova') {
      $('#authcorpo').innerHTML = `<form id="fauth" novalidate><p class="small">Crie a sua senha nova.</p>${f('a_senha', 'Senha nova (mínimo 8 caracteres)', 'password', 'new-password')}${f('a_senha2', 'Repita a senha', 'password', 'new-password')}${aviso}<button class="b p">Guardar a senha e entrar</button></form>`;
      return;
    }
    const abas = [['entrar', 'Entrar'], ['primeiro', 'Primeiro acesso'], ['esqueci', 'Esqueci a senha']];
    const corpo = authModo === 'primeiro' ? `<p class="small">Para quem a coordenação já cadastrou e ainda não tem senha. Você recebe um e-mail para confirmar; depois é só entrar.</p>${f('a_email', 'Seu e-mail (o mesmo que a coordenação cadastrou)', 'email', 'username')}${f('a_senha', 'Crie uma senha (mínimo 8 caracteres)', 'password', 'new-password')}${f('a_senha2', 'Repita a senha', 'password', 'new-password')}`
      : authModo === 'esqueci' ? `<p class="small">Você recebe um e-mail com um link para criar outra senha.</p>${f('a_email', 'Seu e-mail', 'email', 'username')}`
        : `${f('a_email', 'E-mail', 'email', 'username')}${f('a_senha', 'Senha', 'password', 'current-password')}`;
    $('#authcorpo').innerHTML = `<div class="authtabs" role="tablist">${abas.map(a => `<button type="button" role="tab" aria-selected="${a[0] === authModo}" data-auth="${a[0]}">${a[1]}</button>`).join('')}</div>
 <form id="fauth" novalidate style="margin-top:14px">${corpo}${aviso}<button class="b p" id="abotao">${authModo === 'primeiro' ? 'Criar a senha' : authModo === 'esqueci' ? 'Enviar o e-mail' : 'Entrar'}</button></form>`;
  }
  async function aoEntrar(ev) {
    ev.preventDefault(); const g = id => ($('#' + id) || { value: '' }).value, er = t => { $('#aerr').textContent = t; $('#aok').textContent = ''; };
    const email = g('a_email').trim().toLowerCase(), pw = g('a_senha'), b = ev.target.querySelector('button.b.p'), rot = b.textContent;
    if (authModo !== 'nova' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return er('Informe o seu e-mail.');
    if (authModo === 'primeiro' || authModo === 'nova') { if (pw.length < 8) return er('A senha precisa de pelo menos 8 caracteres.'); if (pw !== g('a_senha2')) return er('As duas senhas não são iguais.'); }
    if (authModo === 'entrar' && !pw) return er('Informe a senha.');
    b.disabled = true; b.textContent = 'Aguarde…';
    try {
      if (authModo === 'entrar') { eu = await api.entrar(email, pw); return await aposEntrar(); }
      if (authModo === 'primeiro') {
        const r = await api.criarSenha(email, pw);
        if (r.entrou && r.eu) { eu = r.eu; return await aposEntrar(); }
        authModo = 'entrar'; return telaAcesso('', 'Senha criada. Abra o e-mail que acabamos de enviar, toque no link de confirmação e depois entre aqui.');
      }
      if (authModo === 'esqueci') { await api.esqueci(email); authModo = 'entrar'; return telaAcesso('', 'Se esse e-mail tem acesso, a mensagem com o link já foi enviada. Confira também a caixa de spam.'); }
      if (authModo === 'nova') { await api.trocarSenha(pw); authModo = 'entrar'; eu = await api.eu(true); if (eu) return await aposEntrar(); return telaAcesso('', 'Senha guardada. Entre com ela.'); }
    } catch (e) { er(e.message); b.disabled = false; b.textContent = rot; }
  }
  async function aposEntrar() {
    $('#auth').hidden = true; $('#carregando').hidden = false; $('#carregando').textContent = 'Carregando os dados…';
    try { db = await api.carregar(); }
    catch (e) { $('#carregando').hidden = true; eu = null; return telaAcesso(e.message); }
    D.TABELAS.forEach(t => { if (!Array.isArray(db[t])) db[t] = []; });
    pend = demo() ? [] : await SQC.fila.listar(eu.id); aplicarFila(); hist = null;
    $('#carregando').hidden = true; $('#app').hidden = false;
    if (!TABS.some(t => t[0] === tab)) tab = 'painel';
    render();
    if (!demo()) { SQC.sessao.tocar(true); SQC.sessao.iniciar({ ativo: () => !!eu, aoVencer: () => sair(EXP), temConexao: async () => navigator.onLine !== false }); sincronizar(); }
  }
  async function sair(msg) {
    if ($('#dlg').open) $('#dlg').close();
    try { await api.sair(); } catch (e) { /* segue */ }
    if (SQC.sessao) { SQC.sessao.parar(); SQC.sessao.esquecer(); }
    eu = null; db = null; hist = null; $('#view').innerHTML = ''; authModo = 'entrar'; telaAcesso(msg || '');
  }
  /* envia o que ficou guardado no aparelho e busca o que os outros lançaram */
  let sincronizando = false;
  async function sincronizar(avisar) {
    if (!eu || demo() || sincronizando || navigator.onLine === false) { if (avisar) toast('Ainda sem internet.'); return; }
    sincronizando = true;
    try {
      const r = await SQC.fila.sincronizar(api, eu.id);
      const novo = await api.carregar(); if ($('#dlg').open) return;   // não troca os dados por baixo de um formulário aberto
      db = novo; pend = await SQC.fila.listar(eu.id); aplicarFila(); render();
      if (r.enviados) toast(r.enviados + ' lançamento(s) enviado(s).');
      else if (avisar) toast(r.erros ? 'Há lançamento que o servidor não aceitou. Corrija ou descarte.' : 'Nada para enviar.');
    } catch (e) { if (avisar) toast(e.message); }
    finally { sincronizando = false; }
  }
  function pedirSenhaNova() { authModo = 'nova'; eu = null; $('#app').hidden = true; telaAcesso(''); }

  /* ---------- cliques ---------- */
  async function aoClicar(ev) {
    const t = ev.target.closest('button,label'); if (!t) return; const d = t.dataset;
    if (d.auth) { authModo = d.auth; telaAcesso(''); }
    else if (d.demo) { try { eu = await api.entrarDemo(d.demo); await aposEntrar(); } catch (e) { telaAcesso(e.message); } }
    else if (d.tab) { tab = d.tab; try { localStorage.setItem('sqc-aba', tab); } catch (e) {} render(); window.scrollTo(0, 0); }
    else if (d.sair !== undefined) sair('');
    else if (d.rel !== undefined) { const a = $('#rde').value, b = $('#rate').value; if (a && b && a <= b) { rel = { de: a, ate: b }; render(); } else toast('Confira as datas: a inicial precisa ser anterior à final.'); }
    else if (d.print !== undefined) window.print();
    else if (d.ficha) abrirFicha(d.ficha);
    else if (d.new) abrir(d.new, null, d.pre);
    else if (d.edit) { const [m, id] = d.edit.split(':'); abrir(m, id); }
    else if (d.fechar !== undefined) { $('#dlg').close(); ed = null; }
    else if (d.sinc !== undefined) sincronizar(true);
    else if (d.rub) { const el = document.getElementById('rb-' + d.rub); if (el) { el.open = true; el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }
    else if (d.abrirRub !== undefined) { const todos = [...document.querySelectorAll('details.rb')], abrir = todos.some(x => !x.open); todos.forEach(x => { x.open = abrir; }); t.textContent = abrir ? 'Fechar todas' : 'Abrir todas'; }
    else if (d.descartar) { if (!d.ok) { d.ok = 1; t.textContent = 'Confirmar: descartar'; return; } await SQC.fila.remover(d.descartar); db = await api.carregar(); pend = await SQC.fila.listar(eu.id); aplicarFila(); render(); }
    else if (d.del) {
      const [m, id] = d.del.split(':');
      const uso = R.emUso(db, m, id).map(c => MOD[c].nome.toLowerCase());
      if (uso.length) { t.textContent = 'Em uso em ' + uso.join(', '); t.disabled = true; return; }
      if (!d.ok) { d.ok = 1; t.textContent = 'Confirmar exclusão'; return; }
      t.disabled = true;
      try { await api.excluir(m, id); db[m] = db[m].filter(x => x.id !== id); if (api.guardarCopia) api.guardarCopia(db); if (d.fechaapos !== undefined && $('#dlg').open) $('#dlg').close(); render(); }
      catch (e) { t.textContent = e.semRede ? 'Sem internet: tente depois' : e.message; }
    }
    else if (d.limpar !== undefined) { if (!d.ok) { d.ok = 1; t.textContent = 'Confirmar: apagar exemplos'; return; } await api.apagarExemplos(); db = await api.carregar(); render(); }
    else if (d.zerar !== undefined) { if (!d.ok) { d.ok = 1; t.textContent = 'Confirmar: apagar tudo'; return; } await api.recomecar(); db = await api.carregar(); render(); }
    else if (d.exp) { if (d.exp === 'json') { const c = {}; D.TABELAS.forEach(k => { c[k] = db[k].filter(r => !r._pendente); }); baixar('saberes-que-cultivam-' + iso(hoje()) + '.json', JSON.stringify(c, null, 1), 'application/json'); } else baixar(d.exp + '-' + iso(hoje()) + '.csv', csv(d.exp), 'text/csv;charset=utf-8'); }
    else if (d.hist !== undefined) { t.disabled = true; t.textContent = 'Carregando…'; try { hist = await api.auditoria(200); } catch (e) { hist = null; toast(e.message); } render(); }
    else if (d.senha !== undefined) {
      ed = null; $('#frm').className = ''; $('#frm').innerHTML = `<h2>Trocar a minha senha</h2><div class="fields"><div class="fld"><label for="s1">Senha nova (mínimo 8 caracteres)</label><input id="s1" type="password" autocomplete="new-password"></div><div class="fld"><label for="s2">Repita a senha</label><input id="s2" type="password" autocomplete="new-password"></div></div><div class="err" id="ferr" role="alert"></div><div class="frow"><button type="button" class="b" data-fechar>Cancelar</button><button type="button" class="b p" data-senhaok>Guardar</button></div>`; $('#dlg').showModal();
    }
    else if (d.senhaok !== undefined) {
      const a = $('#s1').value, b = $('#s2').value; if (a.length < 8) { $('#ferr').textContent = 'A senha precisa de pelo menos 8 caracteres.'; return; } if (a !== b) { $('#ferr').textContent = 'As duas senhas não são iguais.'; return; }
      t.disabled = true; try { await api.trocarSenha(a); $('#dlg').close(); toast('Senha trocada.'); } catch (e) { $('#ferr').textContent = e.message; t.disabled = false; }
    }
  }

  /* ---------- partida ---------- */
  async function iniciar() {
    api = SQC.CONFIG && SQC.CONFIG.supabaseUrl ? SQC.apiSupabase : SQC.apiDemo; SQC.api = api;
    document.addEventListener('click', ev => { aoClicar(ev).catch(e => toast(e.message || 'Algo deu errado. Tente de novo.')); });
    document.addEventListener('submit', ev => { if (ev.target.id === 'frm') aoSalvar(ev).catch(e => { $('#ferr').textContent = e.message; }); else if (ev.target.id === 'fauth') aoEntrar(ev); });
    document.addEventListener('change', ev => { if (ev.target.id === 'f_tipo' && ed && ed.m === 'lotes' && !ed.id) { const t = D.TIPOS[ev.target.value]; if (t) { $('#f_dias').value = t[1]; $('#f_med').value = t[2]; } } });
    $('#dlg').addEventListener('close', () => { ed = null; });
    document.addEventListener('pointermove', aoMoverGrafico); document.addEventListener('pointerdown', aoMoverGrafico);
    ['online', 'offline'].forEach(e => window.addEventListener(e, () => { if (eu) { $('#net').hidden = navigator.onLine !== false; if (e === 'online') sincronizar(); } }));
    try { const t = localStorage.getItem('sqc-aba'); if (t && TABS.some(x => x[0] === t)) tab = t; } catch (e) {}
    if (location.hash && TABS.some(x => x[0] === location.hash.slice(1))) tab = location.hash.slice(1);
    try {
      eu = await api.iniciar();
      if (api.recuperando) return pedirSenhaNova();
      // ficou mais de 15 minutos sem usar e fechou a página: pede a senha de novo
      if (eu && !demo() && navigator.onLine !== false && SQC.sessao.venceu(SQC.sessao.ultimo())) return sair(EXP);
      if (eu) await aposEntrar(); else telaAcesso('');
    } catch (e) { telaAcesso(e.message); }
    // funcionamento sem internet (só em endereço https ou no computador de quem desenvolve)
    try {
      if ('serviceWorker' in navigator && !(SQC.CONFIG && SQC.CONFIG.semServiceWorker) && (location.protocol === 'https:' || location.hostname === 'localhost')) {
        const tinha = !!navigator.serviceWorker.controller; let recarregou = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => { if (tinha && !recarregou && !$('#dlg').open) { recarregou = true; location.reload(); } });
        navigator.serviceWorker.register('sw.js').catch(() => {});
      }
    } catch (e) { /* sem service worker: o sistema funciona, só não abre sem internet */ }
  }

  SQC.app = { iniciar, pedirSenhaNova, MOD, TABS, csv, _estado: () => ({ eu, db, pend, tab }) };
  if (typeof document !== 'undefined' && !SQC.SEM_PARTIDA) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar(); }
})();
