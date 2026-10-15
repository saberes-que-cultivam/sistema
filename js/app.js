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
  const FMT_NUM = {}, num = (v, d = 0) => (FMT_NUM[d] = FMT_NUM[d] || new Intl.NumberFormat('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d })).format(+v || 0);
  const brl = R.brl, dt = R.dt, pd = R.pd, iso = R.iso;
  const hoje = () => new Date();
  /* busca por id com índice por tabela, refeito quando a lista muda (antes era uma varredura da lista a cada linha desenhada) */
  const IDX = new WeakMap();
  //  guarda a POSIÇÃO de cada id e confere na hora: registro trocado no mesmo lugar (edição) é achado novo; lista que mudou de tamanho ou ordem refaz o índice
  const by = (t, id) => { const L = db[t]; if (!L) return undefined; let m = IDX.get(L), i = m && m.get(id);
    if (i !== undefined && L[i] && L[i].id === id) return L[i];
    m = new Map(); L.forEach((r, k) => m.set(r.id, k)); IDX.set(L, m); i = m.get(id); return i === undefined ? undefined : L[i]; };
  const coord = () => !!eu && eu.perfil === 'Coordenação';
  /* pré-visualização "ver como o SEAB/MDA vê": a coordenação enxerga o sistema com o perfil de acompanhamento, com os mesmos cortes
     que o banco faz para esse perfil (unidade produtiva numerada, visita sem texto, sem equipe). Nada é gravado nesse modo. */
  let real = null;
  function semPessoal(d) {
    const c = JSON.parse(JSON.stringify(d)); c.presencas = []; c.fotos = []; c.despesas = []; c.itens = c.itens.map(i => { const x = Object.assign({}, i); delete x.valor; delete x.rubrica; return x; }); c.eventos = c.eventos.map(e => { const x = Object.assign({}, e); delete x.link; delete x.obs; return x; });
    c.agricultores = [...c.agricultores].sort((a, b) => String(a.criado_em || '') < String(b.criado_em || '') ? -1 : 1).map((a, i) => ({ id: a.id, nome: 'Unidade produtiva ' + String(i + 1).padStart(2, '0'), municipio: a.municipio, uf: a.uf, territorio: a.territorio, unidade: a.unidade, area: a.area, diag: a.diag, quimico: a.quimico, gasto0: a.gasto0, kit: a.kit, kitdata: a.kitdata, ex: a.ex }));
    c.visitas = c.visitas.map(v => ({ id: v.id, data: v.data, agricultor: v.agricultor, usou: v.usou, vigor: v.vigor, gasto: v.gasto, ex: v.ex }));
    c.pessoas = c.pessoas.filter(p => eu && p.id === eu.id); c.membros = []; return c;
  }
  const trocarDb = d => { if (real) { real.db = d; db = semPessoal(d); } else db = d; };   // na pré-visualização "Ver como SEAB/MDA", o que chega passa pelo mesmo corte
  async function recarregarDb() { trocarDb(await api.carregar()); }
  const fora = () => !!eu && eu.perfil === 'Acompanhamento';   // SEAB/MDA: só leitura, sem dado pessoal
  const formador = () => !!eu && eu.perfil === 'Formador', auxiliar = () => !!eu && eu.perfil === 'Auxiliar';   // perfis do 23
  const semDinheiro = () => fora() || formador();   // não veem valores
  const semCampo = () => fora() || auxiliar() || formador();   // recebem as unidades produtivas numeradas, sem dado pessoal
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
    unidades: { um: 'Unidade de produção de bioinsumos', oque: 'Biofábrica do projeto. As duas que contam para a Meta 2 do TED são as dos territórios; as outras são de apoio. Marque cada passo da implantação conforme for acontecendo.', dicas: { sigla: 'Aparece no código de todos os lotes desta unidade. Não mude depois de criar lotes.', parceiro: 'Associação, cooperativa, prefeitura ou escola. Bem público não pode ser doado a pessoa física.' }, nome: 'Biofábricas', titulo: 'Unidades de produção de bioinsumos', desc: 'Passos da implantação de cada unidade. Conta para a Meta 2 a unidade marcada como “em funcionamento”.', novo: 'Nova unidade',
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
      campos: [['unidade', 'Biofábrica', 'ref', 1, 'unidades'], ['descricao', 'Descrição', 'text', 1], ['valor', 'Valor estimado (R$)', 'number'],
        ['rubrica', 'Rubrica do plano', 'select', 0, () => [['', '']].concat(optRubrica())],
        ['status', 'Situação', 'select', 0, opt(['A definir', 'Orçamento enviado', 'Em compras na FUNCERN', 'Entregue'])], ['data', 'Data do envio do orçamento', 'date']],
      cols: [['Item', i => esc(i.descricao) + exChip(i) + (i.rubrica ? `<div class="small">${esc(nomeRubrica(i.rubrica))}</div>` : '')], ['Unidade', i => esc((by('unidades', i.unidade) || {}).nome)],
        ['Situação', i => `<span class="chip ${i.status === 'Entregue' ? 'ok' : i.status === 'A definir' ? '' : 'f'}">${esc(i.status)}</span>`], ['Enviado em', i => dt(i.data)], ['Valor', i => brl(i.valor), 'n']] },
    lotes: { um: 'Lote de produção', oque: 'Uma batelada de bioinsumo. O código é gerado ao salvar. Só lote marcado como “Pronto” pode ser distribuído.', dicas: { dias: 'Preenchido pelo tipo; ajuste se o seu preparo for diferente.', obs: 'O que você observou ao conferir: é o registro de qualidade do lote.' }, nome: 'Lotes', titulo: 'Lotes de produção', desc: 'Um lote por batelada. O código é gerado pela sigla da unidade e pelo tipo. O saldo desconta o que já foi distribuído.', novo: 'Novo lote',
      campos: [['_s1', 'Produção', 'sec'], ['unidade', 'Biofábrica', 'ref', 1, 'unidades'], ['tipo', 'Tipo de bioinsumo', 'select', 1, opt(Object.keys(D.TIPOS))], ['inicio', 'Início do preparo', 'date', 1],
        ['dias', 'Dias até ficar pronto', 'number'], ['qtd', 'Quantidade produzida', 'number', 1], ['med', 'Medida', 'select', 0, opt(['kg', 'L'])],
        ['_s2', 'Acompanhamento do lote', 'sec'], ['status', 'Situação', 'select', 0, opt(['Em preparo', 'Maturando', 'Pronto', 'Descartado'])], ['responsavel', 'Responsável', 'text'],
        ['insumos', 'Ingredientes e proporções', 'textarea'], ['obs', 'Qualidade (cheiro, temperatura, pH, aspecto)', 'textarea']],
      cols: [['Lote', l => `<span class="mono">${esc(l.codigo || 'código ao enviar')}</span>${exChip(l)}<div class="small">${esc(l.tipo)} · ${esc((by('unidades', l.unidade) || {}).nome)}</div>`],
        ['Situação', l => `<span class="chip ${l.status === 'Pronto' ? 'ok' : l.status === 'Descartado' ? 'bad' : 'f'}">${esc(l.status)}</span>`],
        ['Maturação', l => { const p = R.dias(pd(l.inicio), hoje()); return l.status === 'Pronto' || l.status === 'Descartado' ? `<span class="small">início ${dt(l.inicio)}</span>` : `${bar(p, l.dias, 'f')}<div class="small">dia ${Math.max(0, p)} de ${l.dias} · previsto ${dt(iso(R.pronto(l)))}</div>`; }],
        ['Produzido', l => `${num(l.qtd)} ${esc(l.med)}`, 'n'], ['Saldo', l => `<b>${num(saldo(l))} ${esc(l.med)}</b>`, 'n']] },
    agricultores: { um: 'Unidade produtiva', oque: 'Agricultor ou agricultora atendido pelo projeto. Conta como “acompanhada” quando recebe bioinsumo e tem pelo menos uma visita de monitoramento depois da primeira entrega. É dado pessoal: registre só o necessário e não compartilhe fora da equipe.', dicas: { diag: 'Dia em que você levantou a situação antes do projeto. Sem essa data, a avaliação final não tem com o que comparar.', gasto0: 'Quanto a família gastava por mês com adubo e defensivo comprados, antes de receber bioinsumo.', kitdata: 'Obrigatória quando o kit foi entregue.' }, nome: 'Unidades produtivas', titulo: 'Agricultores e unidades produtivas', desc: 'Meta de 30 unidades produtivas acompanhadas e 30 kits. Registre a linha de base antes da primeira entrega de bioinsumo.', novo: 'Nova unidade produtiva',
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
    distribuicoes: { um: 'Entrega de bioinsumo', oque: 'Liga um lote a quem recebeu. O sistema desconta do saldo do lote e não deixa entregar mais do que existe.', nome: 'Distribuição', titulo: 'Distribuição de bioinsumos', desc: 'Cada entrega liga um lote a uma unidade produtiva. É o que permite dizer de onde veio o que foi aplicado.', novo: 'Registrar entrega de bioinsumo',
      campos: [['data', 'Data', 'date', 1], ['lote', 'Lote (só os prontos)', 'ref', 1, 'lotes', l => l.status === 'Pronto'], ['agricultor', 'Unidade produtiva', 'ref', 1, 'agricultores'], ['qtd', 'Quantidade', 'number', 1],
        ['cultura', 'Cultura que vai receber', 'text'], ['area', 'Área de aplicação (ha)', 'number'], ['forma', 'Forma de aplicação', 'select', 0, opt(['No solo', 'Foliar', 'Na cova ou sulco', 'Tratamento de sementes', 'Outro'])]],
      cols: [['Data', d => dt(d.data) + exChip(d)], ['Lote', d => { const l = by('lotes', d.lote) || {}; return `<span class="mono">${esc(l.codigo || 'código ao enviar')}</span><div class="small">${esc(l.tipo)}</div>`; }],
        ['Para', d => esc((by('agricultores', d.agricultor) || {}).nome)], ['Uso', d => `${esc(d.cultura)}<div class="small">${esc(d.forma)} · ${num(d.area, 1)} ha</div>`],
        ['Quantidade', d => `${num(d.qtd)} ${esc((by('lotes', d.lote) || {}).med || '')}`, 'n']] },
    visitas: { um: 'Visita de monitoramento', oque: 'O que foi visto em campo depois da entrega. O gasto informado aqui é comparado com a linha de base no painel.', dicas: { gasto: 'Mesma pergunta da linha de base, para comparar antes e depois.', local: 'Pelo GPS do celular, na propriedade (funciona sem internet). Só a equipe do projeto vê.' }, nome: 'Monitoramento', titulo: 'Visitas de monitoramento', desc: 'Registro do uso em campo. O gasto mensal com insumos comprados é comparado com a linha de base no painel.', novo: 'Registrar visita',
      campos: [['_s1', 'A visita', 'sec'], ['data', 'Data', 'date', 1], ['agricultor', 'Unidade produtiva', 'ref', 1, 'agricultores'], ['tecnico', 'Quem visitou', 'text'], ['local', 'Localização da visita', 'geo'],
        ['_s2', 'O que foi visto', 'sec'],
        ['usou', 'Aplicou o bioinsumo recebido?', 'select', 1, opt(['', 'Sim', 'Parcial', 'Não'])], ['vigor', 'Vigor da cultura (1 ruim a 5 ótimo)', 'select', 0, opt(['', '1', '2', '3', '4', '5'])],
        ['gasto', 'Gasto atual com insumos comprados (R$/mês)', 'number'], ['obs', 'O que foi observado', 'textarea'], ['problemas', 'Dificuldades relatadas', 'textarea']],
      cols: [['Data', v => dt(v.data) + exChip(v)], ['Fotos', v => evid('visitas', v), '', 'equipe'], ['Unidade produtiva', v => esc((by('agricultores', v.agricultor) || {}).nome) + (v.lat != null && v.lat !== '' && !fora() ? '<div class="small">com localização</div>' : '')],
        ['Uso', v => `<span class="chip ${v.usou === 'Sim' ? 'ok' : v.usou === 'Não' ? 'bad' : 'f'}">${esc(v.usou)}</span>`], ['Vigor', v => v.vigor ? `${esc(v.vigor)}/5` : '—', 'n'],
        ['Gasto/mês', v => R.vazio(v.gasto) ? '—' : brl(v.gasto), 'n'], ['Observações', v => `${esc(v.obs)}${v.problemas ? `<div class="small">Dificuldade: ${esc(v.problemas)}</div>` : ''}`]] },
    eventos: { um: 'Atividade', oque: 'Capacitação e dia de campo contam para as metas do plano quando a data chega (com data futura, a atividade aparece como agendada). Reunião e articulação ficam registradas, mas não contam.', dicas: { link: 'Pasta com a lista de presença e as fotos: é a evidência para a prestação de contas.' }, nome: 'Formação', titulo: 'Capacitações, dias de campo e reuniões', desc: 'O plano prevê 5 capacitações (etapa 3.2) e 4 dias de campo (etapa 5.1). Reuniões e articulações ficam registradas, mas não contam para essas metas.', novo: 'Registrar atividade',
      campos: [['tipo', 'Tipo', 'select', 1, opt(['', 'Capacitação', 'Dia de campo', 'Reunião', 'Articulação'])], ['data', 'Data', 'date', 1], ['tema', 'Tema', 'text', 1], ['lugar', 'Local', 'text'], ['municipio', 'Município/UF', 'text'],
        ['part', 'Participantes', 'number'], ['mulheres', 'Quantas são mulheres', 'number'], ['link', 'Link da lista de presença e fotos', 'text'], ['obs', 'Observações', 'textarea']],
      cols: [['Data', e => dt(e.data) + (String(e.data || '') > iso(hoje()) ? ' <span class="chip f">agendada</span>' : '') + exChip(e)], ['Lista e fotos', e => evid('eventos', e), '', 'equipe'], ['Tipo', e => `<span class="chip ${['Capacitação', 'Dia de campo'].includes(e.tipo) ? 'ok' : ''}">${esc(e.tipo)}</span>`],
        ['Tema', e => `${esc(e.tema)}<div class="small">${esc(e.lugar)}${e.municipio ? ' · ' + esc(e.municipio) : ''}</div>`],
        ['Participantes', e => R.vazio(e.part) ? '—' : `${num(e.part)}<div class="small">${num(e.mulheres)} mulheres</div>`, 'n'],
        ['Evidência', e => link(e.link), '', 'equipe']] },
    entregas: { um: 'Entrega do plano de trabalho', oque: 'Relatório, material didático ou produto de comunicação concluído. Cada registro conta 1 na etapa escolhida.', dicas: { link: 'Onde o documento está guardado.' }, nome: 'Entregas', titulo: 'Entregas e evidências do plano de trabalho', desc: 'Relatórios, material didático e produtos de comunicação. Cada registro conta para a etapa escolhida.', novo: 'Registrar entrega',
      campos: [['etapa', 'Etapa do plano', 'select', 1, D.ETAPAS.filter(e => !D.ETAPAS_AUTOMATICAS.includes(e.id)).map(e => [e.id, `${e.id} · ${e.nome}`])],
        ['titulo', 'Título', 'text', 1], ['data', 'Data', 'date', 1], ['link', 'Link do documento', 'text'], ['obs', 'Observações', 'textarea']],
      cols: [['Etapa', g => `<span class="mono">${esc(g.etapa)}</span>`], ['Entrega', g => `${esc(g.titulo)}${exChip(g)}${g.obs ? `<div class="small">${esc(g.obs)}</div>` : ''}`], ['Data', g => dt(g.data)],
        ['Evidência', g => link(g.link)]] },
    despesas: { um: 'Despesa', oque: 'Lançamento de acompanhamento. O registro oficial é o da FUNCERN: confira os dois antes de cada prestação de contas.', dicas: { rubrica: 'É por rubrica que a fundação controla o gasto.', item: 'Opcional. Escolha um item da mesma rubrica: é o que permite ver, no Financeiro, quanto de cada item já foi gasto.', status: 'Enquanto não estiver “Pago”, conta como comprometido.' }, nome: 'Despesas', titulo: 'Despesas do projeto', desc: 'Vêm da planilha de solicitações da FUNCERN: suba a planilha atualizada e o sistema mostra o que mudou antes de gravar. Enquanto não estiver paga, a despesa conta como comprometida.', novo: 'Lançar despesa', restrito: 1,
      campos: [['data', 'Data', 'date', 1], ['etapa', 'Etapa do plano', 'select', 1, D.ETAPAS.map(e => [e.id, `${e.id} · ${e.nome}`])], ['rubrica', 'Rubrica', 'select', 1, () => [['', 'Escolha']].concat(optRubrica())],
        ['item', 'Item do plano', 'select', 0, () => [['', 'Sem item indicado']].concat(D.DESEMBOLSO.itens.map(i => [i.id, `${nomeRubrica(i.rubrica)} · ${i.nome}`]))],
        ['descricao', 'Descrição', 'text', 1], ['valor', 'Valor (R$)', 'number', 1],
        ['status', 'Situação', 'select', 1, opt(['Solicitado', 'Em compras na FUNCERN', 'Pago'])], ['favorecido', 'Favorecido', 'text'], ['doc', 'Documento (nota fiscal, solicitação)', 'text']],
      cols: [['Data', d => dt(d.data) + exChip(d)], ['Etapa', d => `<span class="mono">${esc(d.etapa)}</span>`],
        ['Descrição', d => `${esc(d.descricao)}<div class="small">${esc(nomeRubrica(d.rubrica) || 'sem rubrica')}${d.favorecido ? ' · ' + esc(d.favorecido) : ''}${d.doc ? ' · ' + esc(d.doc) : ''}</div>`],
        ['Situação', d => `<span class="chip ${d.status === 'Pago' ? 'ok' : 'f'}">${esc(d.status)}</span>`], ['Valor', d => brl(d.valor), 'n']] },
    membros: { um: 'Pessoa da equipe', oque: 'Quem ocupa uma função no projeto. Quando a pessoa sair, preencha o desligamento: o registro fica como histórico e a vaga volta a aparecer aberta.', dicas: { fim: 'Deixe vazio enquanto a pessoa estiver na equipe.', vinculo: 'Exemplo: IFRN Campus Apodi, ou o curso do estudante.', inicio: 'Sugerimos hoje. Mude se a pessoa começou em outro dia.', lgpd: 'Conta bancária e chave Pix não entram aqui: vão direto para a FUNCERN, que faz o pagamento.', cpf: 'Só a coordenação e o auxiliar administrativo veem (para o cadastro na FUNCERN). Guardado só com os números.', email: 'É o login no sistema: a pessoa entra com este e-mail.', termo_em: 'Marcado pela coordenação ou pelo auxiliar administrativo quando a FUNCERN confirmar.', cep: 'Só os 8 números. Com internet, rua, bairro e município se preenchem sozinhos.', socio: 'Com uma equipe pequena não dá para esconder de quem é cada resposta: por isso ela fica só com a coordenação e não entra em relatório.', siape: 'Deixe vazio se não for.', organizacao: 'Exemplo: sindicato, associação, cooperativa.', outra_bolsa: 'A fundação confere acúmulo de bolsas antes de pagar.', arlo: 'É o sistema em que a FUNCERN cadastra quem recebe. Sem esse cadastro a bolsa não é paga.', nome: 'Escreva como aparece na planilha da FUNCERN, para o sistema ligar a pessoa às bolsas.' }, nome: 'Equipe', titulo: 'Equipe', desc: '', novo: 'Cadastrar', restrito: 1,
      campos: [['funcao', 'Função', 'select', 1, [['coordenacao', 'Coordenação do projeto'], ['auxiliar', 'Auxiliar administrativo'], ['discente', 'Bolsista discente'], ['formador', 'Formador(a)']]],
        ['_s1', 'Dados pessoais', 'sec'], ['nome', 'Nome completo', 'text', 1], ['cpf', 'CPF', 'text', 1], ['telefone', 'Celular com WhatsApp', 'tel', 1], ['email', 'E-mail', 'email', 1], ['municipio', 'Município onde mora', 'text'],
        ['siape', 'Matrícula SIAPE (só se for servidor(a) público(a) federal)', 'text'], ['vinculo', 'Instituição ou curso', 'text'], ['organizacao', 'Organização ou movimento', 'text'],
        ['_s2b', 'Perfil no campo', 'sec', { so: ['discente', 'formador'] }], ['agricultor', 'É agricultor(a)? (produz alimento em quintal, roça ou lote)', 'select', 0, opt(['', 'Sim', 'Não'])], ['atua_af', 'Atua junto a agricultoras e agricultores familiares do território?', 'select', 0, opt(['', 'Sim', 'Não'])], ['zona_rural', 'Mora na zona rural?', 'select', 0, opt(['', 'Sim', 'Não'])], ['celular_internet', 'Tem celular com internet?', 'select', 0, opt(['', 'Sim', 'Não'])],
        ['experiencia', 'Experiência com agricultura familiar ou agroecologia', 'select', 0, opt(['', 'Nenhuma ainda', 'Estudo ou estágio na área', 'Até 2 anos de trabalho', 'Mais de 2 anos de trabalho', 'É de família agricultora'])],
        ['_s3b', 'Cadastro na FUNCERN (sistema Arlo)', 'sec'], ['_arloq', '', 'html', '<details class="fm-arlo"><summary>O que é o Arlo?</summary><p>É o sistema da FUNCERN, a fundação que paga as bolsas. Toda pessoa que recebe bolsa precisa estar cadastrada nele, com documentos e endereço. Quem já tem cadastro no Arlo (de outro projeto, por exemplo) não precisa informar de novo os dados abaixo.</p></details>'],
        ['arlo', 'A pessoa já tem cadastro no sistema Arlo, da FUNCERN?', 'select', 0, opt(['', 'Sim', 'Não'])], ['termo_em', 'Termo de compromisso assinado na FUNCERN em', 'date'],
        ['_s2', 'Mais dados pessoais', 'sec', { semArlo: 1 }], ['nome_social', 'Nome social (se usar)', 'text'], ['nascimento', 'Data de nascimento', 'date'], ['pis', 'PIS/NIS/PASEP (se tiver)', 'text'],
        ['_s1b', 'Endereço', 'sec', { semArlo: 1 }], ['cep', 'CEP', 'text'], ['numero', 'Número', 'text'], ['logradouro', 'Logradouro (rua, sítio, estrada)', 'text'], ['complemento', 'Complemento', 'text'], ['bairro', 'Bairro ou comunidade', 'text'], ['uf', 'Estado', 'select', 0, opt(['', 'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'])],
        ['_s1c', 'Questionário socioeconômico (opcional)', 'sec'], ['socio', 'Responder. Só a coordenação vê estas respostas.', 'check'],
        ['_s1d', '', 'sec', { socio: 1 }], ['escolaridade', 'Escolaridade', 'select', 0, opt(['', 'Fundamental incompleto', 'Fundamental completo', 'Médio incompleto', 'Médio completo', 'Técnico', 'Superior incompleto', 'Superior completo', 'Pós-graduação'])], ['raca_cor', 'Raça/cor', 'select', 0, opt(['', 'Branca', 'Preta', 'Parda', 'Amarela', 'Indígena', 'Prefiro não informar'])], ['renda', 'Renda familiar por mês (R$)', 'number'], ['pessoas_casa', 'Pessoas na casa', 'number'],
        ['_s3', 'Bolsa', 'sec'], ['inicio', 'Início da bolsa', 'date', 1], ['outra_bolsa', 'Recebe hoje outra bolsa, de qualquer instituição?', 'select', 0, opt(['', 'Não', 'Sim'])],
        ['_s4', 'Proteção de dados', 'sec'], ['lgpd', 'A pessoa foi informada e concorda que estes dados sejam usados só para a gestão do projeto e o pagamento da bolsa (Lei nº 13.709/2018).', 'check'],
        ['_s5', 'Desligamento', 'sec', { edicao: 1 }], ['fim', 'Data do desligamento', 'date'], ['motivo', 'Motivo', 'text'], ['obs', 'Observações', 'textarea']], cols: [] },
    presencas: { um: 'Participante', nome: 'Presença', novo: 'Adicionar participante', titulo: 'Lista de presença', desc: '', cols: [],
      campos: [['evento', 'Atividade', 'ref', 1, 'eventos'], ['nome', 'Nome', 'text', 1], ['comunidade', 'Comunidade', 'text'], ['municipio', 'Município', 'text'], ['mulher', 'Mulher', 'check'],
        ['agricultor', 'É uma unidade produtiva acompanhada?', 'ref', 0, 'agricultores']] },
    pessoas: { um: 'Acesso ao sistema', oque: 'Quem pode entrar. Coordenação faz tudo; Equipe (bolsistas) registra o trabalho de campo e de produção; Auxiliar administrativo cuida do financeiro e da habilitação da equipe na FUNCERN; Formador(a) registra as atividades de formação. Quem entra na equipe pela aba Equipe já ganha o acesso com o perfil da função.', dicas: { email: 'É o login. A pessoa cria a própria senha em “Primeiro acesso”, na tela de entrada, e confirma pelo e-mail que recebe.', ativo: 'Desmarque para tirar o acesso sem apagar o histórico.', perfil: 'Acompanhamento vê o andamento em tempo real (visão geral, biofábricas, lotes, distribuição e formação), não grava nada, não vê valores nem nome ou dado pessoal de agricultor.', orgao: 'Exemplo: SEAB/MDA. Aparece ao lado do nome.' }, nome: 'Acessos', titulo: 'Pessoas com acesso', desc: 'A coordenação cadastra o nome e o e-mail de quem pode entrar. A pessoa cria a própria senha em “Primeiro acesso”, na tela de entrada. Para tirar o acesso de alguém, desmarque “Acesso ativo”.', novo: 'Novo acesso', restrito: 1, semExcluir: 1,
      campos: [['nome', 'Nome', 'text', 1], ['email', 'E-mail', 'email', 1], ['perfil', 'Perfil', 'select', 1, [['Equipe', 'Equipe (bolsistas: campo, produção e formação)'], ['Auxiliar', 'Auxiliar administrativo (financeiro e habilitação da equipe)'], ['Formador', 'Formador(a) (só a Formação)'], ['Coordenação', 'Coordenação (faz tudo)'], ['Acompanhamento', 'Acompanhamento (SEAB/MDA: só consulta, sem dados pessoais)']]], ['orgao', 'Órgão ou setor (para quem acompanha)', 'text'], ['ativo', 'Acesso ativo', 'check']],
      cols: [['Nome', u => esc(u.nome)], ['E-mail', u => `<span class="mono">${esc(u.email)}</span>`], ['Perfil', u => `<span class="chip ${u.perfil === 'Coordenação' ? 'ok' : u.perfil === 'Acompanhamento' ? 'f' : ''}">${esc(R.NOME_PERFIL[u.perfil] || u.perfil)}</span>${u.orgao ? `<div class="small">${esc(u.orgao)}</div>` : ''}`],
        ['Situação', u => u.ativo === false ? '<span class="chip bad">desativado</span>' : (demo() || u.auth_id ? '<span class="chip ok">ativo</span>' : '<span class="chip f">ainda não criou a senha</span>')]] }
  };
  /* lista de presença e fotos de cada atividade/visita (script 13). Só a equipe do projeto vê: o SEAB/MDA fica com o número de participantes */
  const CONTA = new WeakMap(), contar = (L, chave) => { let c = CONTA.get(L); if (!c || c.n !== L.length) { c = { n: L.length, m: new Map() }; L.forEach(x => { const k = chave(x); c.m.set(k, (c.m.get(k) || 0) + 1); }); CONTA.set(L, c); } return c.m; };
  const evid = (t, r) => { if (r._pendente) return '<span class="small">depois de enviar</span>'; const nf = contar(db.fotos || [], f => f.tabela + ':' + f.registro).get(t + ':' + r.id) || 0, np = t === 'eventos' ? contar(db.presencas || [], x => x.evento).get(r.id) || 0 : null;
    const qt = (n, um, varios) => n ? `<span class="evb-n" aria-hidden="true">${n}</span><span class="so"> (${n} ${n === 1 ? um : varios})</span>` : `<span class="so"> (nenhum ainda)</span>`;
    return `<span class="ev-b">${np !== null ? `<button type="button" class="evb" data-presenca="${esc(r.id)}" title="Lista de presença">${IC_LISTA}<span>Lista</span>${qt(np, 'nome', 'nomes')}</button>` : ''}<button type="button" class="evb" data-fotos="${t}:${esc(r.id)}" title="Fotos">${IC_CAMERA}<span>Fotos</span>${qt(nf, 'foto', 'fotos')}</button></span>`; };
  const IC_LISTA = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM8.500 11.500h7M8.500 15.500h5"/></svg>';
  const IC_CAMERA = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l1.600-2.400h6.800L17 8h3v11H4z"/><circle cx="12" cy="13.500" r="3.500"/></svg>';
  const rotulo = { eventos: e => `${dt(e.data)} · ${e.tipo} · ${e.tema}`, unidades: u => u.nome, lotes: l => `${l.codigo || 'código ao enviar'} · ${l.tipo} · saldo ${num(saldo(l))} ${l.med}${l.status !== 'Pronto' ? ' · ' + l.status : ''}`, agricultores: a => `${a.nome}${a.comunidade ? ' · ' + a.comunidade : ''}` };

  /* ---------- telas ---------- */
  const TABS = [['painel', 'Visão geral'], ['equipe', 'Equipe'], ['unidades', 'Biofábricas'], ['lotes', 'Lotes'], ['agricultores', 'Unidades produtivas'], ['distribuicoes', 'Distribuição'], ['visitas', 'Monitoramento'], ['eventos', 'Formação'], ['financeiro', 'Financeiro'], ['relatorios', 'Relatórios'], ['historico', 'Histórico'], ['dados', 'Dados']];
  /* quem acompanha de fora não tem as abas de cadastro de pessoas, monitoramento em campo nem a de dados */
  const ABAS_FORA = ['painel', 'unidades', 'lotes', 'distribuicoes', 'eventos'];   // SEAB/MDA (14/10/2026): sem Financeiro, Relatórios e Dados; a parte financeira fica com a gestão do projeto
  const COLS_DINHEIRO = ['itens:Valor', 'unidades:Itens estimados'];   // o SEAB/MDA não vê valores (14/10/2026)
  /* abas de cada perfil: auxiliar administrativo (gestão e financeiro) e formador(a) (formação) têm as suas */
  const ABAS_PERFIL = { Acompanhamento: ABAS_FORA, Auxiliar: ['painel', 'equipe', 'financeiro', 'unidades', 'relatorios', 'dados'], Formador: ['painel', 'eventos'] };
  const abas = () => { const L = eu && ABAS_PERFIL[eu.perfil]; return L ? TABS.filter(t => L.includes(t[0])) : TABS.filter(t => t[0] !== 'historico' || coord()); };
  /* menu superior em grupos (rótulo em cima, abas embaixo); grupo sem nenhuma aba para o perfil não aparece */
  const GRUPOS = [['Gestão', ['painel', 'equipe', 'financeiro']], ['Produção', ['unidades', 'lotes', 'distribuicoes']], ['Campo', ['agricultores', 'visitas', 'eventos']], ['Documentação', ['relatorios', 'historico', 'dados']]];
  /* menu de abas que rola para o lado (celular, tablet): esmaece a borda do lado em que ainda há abas */
  /* deixa a aba inteira à vista na barra que rola de lado, longe da sombra das bordas (36 px): vale para a aba escolhida e para a que recebe o foco pelo Tab */
  function mostrarAba(s, tb) { const a = s.offsetLeft - tb.offsetLeft, z = a + s.offsetWidth, m = 40;
    if (a < tb.scrollLeft + m) tb.scrollLeft = Math.max(0, a - m); else if (z > tb.scrollLeft + tb.clientWidth - m) tb.scrollLeft = z - tb.clientWidth + m; }
  function bordasMenu() { const t = $('#tabs'); if (!t) return; const sobra = t.scrollWidth - t.clientWidth;
    t.classList.toggle('mais-esq', sobra > 2 && t.scrollLeft > 2); t.classList.toggle('mais-dir', sobra > 2 && t.scrollLeft < sobra - 2); }
  function nav() {
    const tem = abas();
    $('#tabs').innerHTML = GRUPOS.map(g => { const ts = g[1].map(k => tem.find(t => t[0] === k)).filter(Boolean); return ts.length ? `<div class="ng" role="presentation"><span class="ng-r" aria-hidden="true">${g[0]}</span><div class="ng-a" role="presentation">${ts.map(t => `<button role="tab" aria-selected="${t[0] === tab}" data-tab="${t[0]}">${t[1]}</button>`).join('')}</div></div>` : ''; }).join('');
    // aba ativa à vista no menu que rola: rola só o menu (scrollIntoView movia o ponto de partida do Tab para a aba e o primeiro Tab pulava o cabeçalho)
    const s = $('#tabs [aria-selected="true"]'), tb = $('#tabs'); if (s && tb) mostrarAba(s, tb);
    bordasMenu();
  }
  /* listas longas aparecem de 100 em 100 (as mais recentes primeiro): desenhar milhares de linhas trava celular simples */
  const PAGINA = 100, mostrando = {};
  const IC_LAPIS = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9a2.800 2.800 0 0 0-4-4L4 16v4zM13.500 6.500l4 4"/></svg>';
  const IC_LIXO = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>';
  const IC_SUBIR = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5M5 20h14"/></svg>';
  function tabela(m) {
    const M0 = MOD[m], M = Object.assign({}, M0, { cols: M0.cols.filter(c => !((c[3] === 'equipe' && (fora() || auxiliar())) || (semDinheiro() && COLS_DINHEIRO.includes(m + ':' + c[0])))) }, semDinheiro() && m === 'itens' ? { desc: 'Cada item passa por orçamento, compra pela FUNCERN e entrega.' } : {}), pode = R.podeGravar(eu, m), todas = [...db[m]].sort((a, b) => (b.data || b.inicio || '') > (a.data || a.inicio || '') ? 1 : -1);
    const lim = mostrando[m] || PAGINA, rows = todas.slice(0, lim), resto = todas.length - rows.length;
    const acoes = r => `<span class="ac">${pode ? `<button class="ab" title="Editar" data-edit="${m}:${esc(r.id)}">${IC_LAPIS}<span class="so">Editar</span></button>` : ''}${!M.semExcluir && R.podeExcluir(eu, m, r) && !r._pendente ? `<button class="ab d" title="Excluir" data-del="${m}:${esc(r.id)}">${IC_LIXO}<span class="so">Excluir</span></button>` : ''}</span>`;
    return `<div class="head"><div><h2>${M.titulo}</h2><p>${M.desc}</p></div><div class="acts">${pode && m === 'despesas' ? `<button class="b" data-new="despesas">Lançar à mão</button><label class="b p imp-b">${IC_SUBIR}Importar planilha da FUNCERN<input type="file" id="imp_arq" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" class="imp-f"></label>` : pode ? `<button class="b p" data-new="${m}">${M.novo}</button>` : ''}</div></div>
 <div class="panel scroll" tabindex="0" role="region" aria-label="${esc(M.titulo)}">${rows.length ? `<table class="tc"><thead><tr>${M.cols.map(c => `<th class="${c[2] || ''}">${c[0]}</th>`).join('')}${fora() ? '' : '<th><span class="so">Ações</span></th>'}</tr></thead><tbody>${rows.map(r => `<tr>${M.cols.map(c => `<td class="${c[2] || ''}" data-r="${esc(c[0])}">${c[1](r)}</td>`).join('')}${fora() ? '' : `<td class="a">${acoes(r)}</td>`}</tr>`).join('')}</tbody></table>` : `<div class="empty">Nenhum registro ainda.${pode ? (m === 'despesas' ? ' Use “Importar planilha da FUNCERN” ou “Lançar à mão”.' : ` Use “${M.novo}”.`) : ''}</div>`}</div>${resto > 0 ? `<div class="acts"><button class="b" data-mais="${m}">Mostrar mais ${Math.min(PAGINA, resto)} (faltam ${resto} de ${todas.length})</button></div>` : ''}`;
  }
  const finTabela = (F, titulo) => `<table><thead><tr><th>${titulo}</th><th class="n">Previsto</th><th class="n">Comprometido</th><th class="n">Pago</th><th class="n">Saldo</th></tr></thead><tbody>${F.map(r => `<tr><td>${r.m ? `Meta ${r.m} · ` : ''}${esc(r.nome)}${r.saldo < 0 ? ' <span class="chip bad">acima do previsto</span>' : ''}</td><td class="n">${brl(r.prev)}</td><td class="n">${brl(r.comp)}</td><td class="n">${brl(r.pago)}</td><td class="n">${brl(r.saldo)}</td></tr>`).join('')}<tr class="tot"><td>Total</td><td class="n">${brl(R.soma(F, 'prev'))}</td><td class="n">${brl(R.soma(F, 'comp'))}</td><td class="n">${brl(R.soma(F, 'pago'))}</td><td class="n">${brl(R.soma(F, 'saldo'))}</td></tr></tbody></table>`;
  const parcelasTxt = () => D.PARCELAS.map((p, i) => p.recebida ? `<dt>${i + 1}ª parcela, liquidada à FUNCERN em ${dt(p.data)}</dt><dd>${brl(p.valor)}</dd>` : `<dt>${i + 1}ª parcela, prevista para ${mesAno(p.previsao)}</dt><dd>${brl(p.valor)}</dd>`).join('');
  function avisoFila() {
    const ruins = pend.filter(p => p.erro), esperando = pend.length - ruins.length;
    return (esperando ? `<div class="banner"><span><b>${esperando}</b> lançamento(s) guardado(s) neste aparelho, aguardando internet para enviar.</span><button class="b s" data-sinc>Tentar enviar agora</button></div>` : '')
      + ruins.map(p => `<div class="banner"><span><b>Não enviado</b> (${esc(MOD[p.tabela].nome)}): ${esc(p.erro)}</span><span class="acts"><button class="b s" data-edit="${p.tabela}:${esc(p.dados.id)}">Corrigir</button><button class="b s d" data-descartar="${esc(p.id)}">Descartar</button></span></div>`).join('');
  }
  /* indicador com anel: pc = percentual (0 a 100), n e de = textos do número grande e do total */
  /* símbolo da biofábrica: frasco de fermentação com o preparo dentro (desenhado em torno do ponto 0,0) */
  const FRASCO = '<circle class="fr-f" r="12"/><path class="fr-l" d="M-3.900 1.5h7.800l1.900 3.700a.9.9 0 0 1-.8 1.300h-10a.9.9 0 0 1-.8-1.300z"/><path class="fr-v" d="M-3-7.500h6M-1.900-7.500v4.700l-4.300 8.200a1.200 1.200 0 0 0 1.100 1.800h10.200a1.200 1.200 0 0 0 1.100-1.800l-4.300-8.200v-4.700"/>';
  const kpi = (k, pc, n, de, rot, s2, aba, rotPc) => { const vai = aba && abas().some(t => t[0] === aba), el = vai ? 'button' : 'div'; pc = Math.max(0, Math.min(100, +pc || 0)); const pr = Math.round(pc), C = 2 * Math.PI * 18;
    return `<${el} class="dx-kpi k${k}"${vai ? ` type="button" data-tab="${aba}" title="Abrir ${abas().find(t => t[0] === aba)[1]}"` : ' tabindex="0"'}><span class="dx-kpi-topo"><span class="dx-anel" aria-hidden="true"><svg viewBox="0 0 44 44" width="52" height="52" focusable="false"><circle cx="22" cy="22" r="18" class="tr"/>${pc > 0 ? `<circle cx="22" cy="22" r="18" class="pg" stroke-dasharray="${(C * pc / 100).toFixed(2)} ${C.toFixed(2)}" transform="rotate(-90 22 22)"/>` : ''}</svg><b>${pr}%</b></span>
      <span class="dx-kpi-n"><b>${n}</b><small>${typeof de === 'number' ? ' / ' + de : ' ' + String(de).trim()}</small></span></span><span class="dx-kpi-r">${rot}</span>
      <span class="medidor fino" aria-hidden="true"><i style="width:${pc}%"></i></span><span class="dx-kpi-p"><b>${pr}%</b> ${rotPc || 'concluído'}</span><span class="dx-kpi-s">${esc(s2)}</span></${el}>`; };
  const FMT_PCT = [new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }), new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })];
  const pct = v => FMT_PCT[v < 10 && v > 0 ? 1 : 0].format(Math.round(v * 10) / 10);
  function painel() {
    const st = ['2.1', '4.1', '3.3', '3.2'].map(id => D.ETAPAS.find(e => e.id === id));
    const lab = { '2.1': 'biofábricas em funcionamento', '4.1': 'unidades produtivas acompanhadas', '3.3': 'kits de apoio entregues', '3.2': 'capacitações realizadas' };
    const X = R.execucaoGeral(db, hoje());
    const ST = { concluida: ['ok', 'Concluída'], andamento: ['ok', 'No ritmo'], atencao: ['f', 'Pouco abaixo do previsto'], atrasada: ['bad', 'Abaixo do previsto'] };
    const uConta = db.unidades.filter(u => u.conta === 'Sim'), comBase = db.agricultores.filter(a => a.diag).length, caps = db.eventos.filter(e => e.tipo === 'Capacitação'), dc = db.eventos.filter(e => e.tipo === 'Dia de campo').length;
    const sub = { '2.1': uConta.length ? `${uConta.filter(u => u.funcionando).length === uConta.length ? uConta.length + ' em funcionamento' : uConta.filter(u => !u.funcionando).length + ' em implantação'} · ${uConta.reduce((s, u) => s + nCheck(u), 0)} de ${uConta.length * D.CHECK.length} passos` : 'nenhuma unidade cadastrada',
      '4.1': `${db.agricultores.length} cadastrada(s) · ${comBase} com linha de base`, '3.3': `${db.agricultores.filter(a => !a.kit).length} cadastrada(s) ainda sem kit`,
      '3.2': `${num(caps.reduce((s, e) => s + (+e.part || 0), 0))} participante(s) · ${dc} dia(s) de campo` };
    const A = R.alertas(db, hoje());
    const prazoTxt = p => { const d = R.dias(new Date(hoje().getFullYear(), hoje().getMonth(), hoje().getDate()), pd(p)); return d < 0 ? `venceu há ${-d} dia${d === -1 ? '' : 's'}` : d === 0 ? 'hoje' : `em ${d} dia${d === 1 ? '' : 's'}`; }; const G0 = pd(D.G0), G1 = pd(D.G1), span = G1 - G0; const pos = d => Math.max(0, Math.min(100, (d - G0) / span * 100));
    const meses = []; for (let i = 0; i < 13; i++) { const d = new Date(G0.getFullYear(), G0.getMonth() + i, 1); meses.push(d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '') + '/' + String(d.getFullYear()).slice(2)); }
    let g = '', mm = 0; D.ETAPAS.forEach(e => {
      if (e.m !== mm) { mm = e.m; g += `<div class="g-row m"><span><b aria-hidden="true">M${mm}</b>Meta ${mm} · ${D.METAS[mm]}</span></div>`; }
      const a = pos(pd(e.ini)), b = pos(new Date(R.fimMes(e.fim).getTime() + 864e5)), f = feito(e), late = R.venceu(e, hoje()) && f < e.q;
      g += `<div class="g-row"><div class="g-lab"><span class="mono">${e.id}</span>${e.nome}</div><div class="g-track"><div class="g-bar ${f >= e.q ? 'ok' : late ? 'late' : hoje() < pd(e.ini) ? 'fut' : ''}" style="left:${a}%;width:${b - a}%" title="${mesAno(e.ini)} a ${mesAno(e.fim)}"><i style="width:${Math.min(100, f / e.q * 100)}%"></i></div><div class="g-today" style="left:${pos(hoje())}%"></div></div><div class="g-n"><span><b>${f}</b> de ${e.q}</span>${f >= e.q ? '<small class="ok">concluída</small>' : late ? '<small class="bad">vencida</small>' : hoje() < pd(e.ini) ? '<small>não começou</small>' : '<small>em curso</small>'}</div></div>`;
    });
    /* metas do plano de trabalho: uma linha por meta (barra = realizado, traço = previsto até o mês passado); abrir mostra as etapas */
    const mesCurto = d => d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '') + '/' + String(d.getFullYear()).slice(2);
    /* etapa que não é contada sozinha pelo sistema: as entregas (relatório, material, produto) são registradas e listadas aqui mesmo */
    const entregasDe = e => { const gs = db.entregas.filter(g => g.etapa === e.id).sort((a, b) => a.data < b.data ? 1 : -1), pode = R.podeGravar(eu, 'entregas');
      return `<div class="mt-g">${gs.map(g => `<div class="mt-gi"><span>${esc(g.titulo)}${g._pendente ? ' <span class="chip f">aguardando envio</span>' : ''}<small>${dt(g.data)}${/^https?:\/\//i.test(g.link || '') ? ` · <a href="${esc(g.link)}" target="_blank" rel="noopener noreferrer">abrir a evidência</a>` : ''}</small></span><span class="acts">${pode ? `<button class="b s" data-edit="entregas:${esc(g.id)}">Editar</button>` : ''}${R.podeExcluir(eu, 'entregas', g) && !g._pendente ? `<button class="b s d" data-del="entregas:${esc(g.id)}">Excluir</button>` : ''}</span></div>`).join('')}
        ${pode ? `<button class="b s" data-new="entregas" data-pre="${e.id}">Registrar entrega desta etapa</button>` : gs.length ? '' : '<span class="small">Nenhuma entrega registrada.</span>'}</div>`; };
    const metas = X.porMeta.map(pm => {
      const es = D.ETAPAS.filter(e => e.m === pm.m), prontas = es.filter(e => feito(e) >= e.q).length, ini = es.map(e => pd(e.ini)).sort((a, b) => a - b)[0];
      const stM = pm.feito >= 99.5 ? ['ok', 'Concluída'] : hoje() < ini ? ['', 'Começa em ' + mesCurto(ini)] : pm.feito >= pm.prev ? ['ok', 'No ritmo'] : pm.feito >= pm.prev * 0.7 ? ['f', 'Pouco abaixo do previsto'] : ['bad', 'Abaixo do previsto'];
      const conta = es.length === 1 ? `<b>${num(feito(es[0]))}</b> de ${num(es[0].q)} (${esc(es[0].un)})` : `<b>${prontas}</b> de ${es.length} etapas concluídas`;
      return `<li><details class="mt ${stM[0]}"><summary><span class="mt-n" aria-hidden="true">M${pm.m}</span><span class="mt-c"><span class="mt-t"><b>${esc(D.METAS[pm.m])}</b><span class="chip ${stM[0]}">${stM[1]}</span></span>
        <span class="medidor" role="img" aria-label="Meta ${pm.m}: ${pct(pm.feito)}% realizado, ${pct(pm.prev)}% previsto até o mês passado"><i style="width:${Math.min(100, pm.feito)}%"></i>${pm.prev > 0 && pm.prev < 100 ? `<b style="left:${pm.prev}%"></b>` : ''}</span>
        <span class="mt-p"><span>${conta} · ${pct(pm.feito)}% realizado</span><span class="mt-v">Ver detalhes</span></span></span></summary>
        <ul class="mt-e">${es.map(e => `<li><span class="mono">${e.id}</span><span>${esc(e.nome)}<small>${mesAno(e.ini)} a ${mesAno(e.fim)}${semDinheiro() ? '' : ' · ' + brl(e.q * e.v)}</small></span><b>${num(feito(e))} de ${num(e.q)}</b>${D.ETAPAS_AUTOMATICAS.includes(e.id) ? '' : entregasDe(e)}</li>`).join('')}</ul></details></li>`; }).join('');
    /* próximos marcos: saem do que já está no plano (início e prazo de etapa ainda não concluída, parcela a receber, fim da vigência) */
    const dia0 = new Date(hoje().getFullYear(), hoje().getMonth(), hoje().getDate()), marcosT = [];
    D.ETAPAS.forEach(e => { const tag = `Meta ${e.m} · ${D.METAS[e.m]}`; if (pd(e.ini) > dia0) marcosT.push([pd(e.ini), `Começa a etapa ${e.id}: ${e.nome}`, tag]); if (feito(e) < e.q) marcosT.push([R.fimMes(e.fim), `Prazo da etapa ${e.id}: ${e.nome}`, tag]); });
    if (!semDinheiro()) D.PARCELAS.forEach((p, i) => { if (!p.recebida && p.previsao) marcosT.push([R.fimMes(p.previsao), `${i + 1}ª parcela do MDA prevista (${brl(p.valor)})`, '']); });
    marcosT.push([pd(D.VIGENCIA.fim), 'Fim da vigência do TED', '']);
    const MESES3 = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const marcosF = marcosT.filter(m => m[0] >= dia0).sort((a, b) => a[0] - b[0]), nMarcos = 5;
    const marcos = marcosF.slice(0, nMarcos).map((m, i) => { const d = R.dias(dia0, m[0]); return `<li class="${i ? '' : 'prox'}" tabindex="0"><time datetime="${iso(m[0])}"><b>${m[0].getDate()}</b><span>${MESES3[m[0].getMonth()]} ${m[0].getFullYear()}</span></time><div><b>${esc(m[1])}</b>${m[2] ? `<span class="mc-m">${esc(m[2])}</span>` : ''}<span class="mc-d">${d === 0 ? 'hoje' : `em ${d} dia${d === 1 ? '' : 's'}`}</span></div></li>`; }).join('');
    const prod = {}; db.lotes.filter(l => l.status !== 'Descartado').forEach(l => { prod[l.tipo] = prod[l.tipo] || [0, 0, l.med]; prod[l.tipo][0] += +l.qtd || 0; prod[l.tipo][1] += (+l.qtd || 0) - saldo(l); });
    const I = R.indicadores(db); const F = R.fin(db), usado = R.soma(F, 'pago') + R.soma(F, 'comp'), rec = R.recebido();
    const temEx = Object.keys(MOD).some(m => db[m].some(r => r.ex));
    return `${faltaEnviar()}${fora() ? `<div class="banner fora"><span><b>Acesso de acompanhamento${eu.orgao ? ' · ' + esc(eu.orgao) : ''}.</b> Você vê o andamento do projeto como a equipe registrou, em tempo real, e não altera nada. Nomes e dados pessoais de agricultoras e agricultores não são exibidos: as unidades produtivas aparecem numeradas. A parte financeira fica com a gestão do projeto.</span>${demo() || real ? '' : '<button class="b s" data-senha>Trocar minha senha</button>'}</div>` : ''}${temEx ? `<div class="banner"><span>Modo demonstração: os registros marcados como <b>exemplo</b> são fictícios e entram nas contas abaixo.</span>${coord() ? '<button class="b s" data-limpar>Apagar exemplos</button>' : ''}</div>` : ''}
 <section class="dx-topo panel" aria-label="Indicadores principais">
  <div class="dx-exec"><span class="dx-rot">Execução física do projeto</span>
   <div class="dx-exec-num"><b>${pct(X.real)}%</b></div><div><span class="chip ${ST[X.st][0]}">${ST[X.st][1]}</span></div>
   <div class="medidor" role="img" aria-label="Executado ${pct(X.real)}%, previsto até o mês passado ${pct(X.prev)}%"><i class="${ST[X.st][0]}" style="width:${Math.min(100, X.real)}%"></i>${X.prev > 0 ? `<b style="left:${Math.min(100, X.prev)}%"></b>` : ''}</div>
   <p class="dx-exec-sub"><span>Previsto até ${X.ate}: <b>${pct(X.prev)}%</b></span><span>Mês <b>${X.mes}</b> de ${X.meses}</span></p>
   <details class="dx-como"><summary>Como é calculado</summary><p>Média ponderada pelo valor que o plano de trabalho destina a cada meta: ${X.porMeta.map(x => `Meta ${x.m} (${semDinheiro() ? 'peso ' + Math.round(x.valor / D.TOTAL * 100) + '%' : brl(x.valor).replace(',00', '')}): ${Math.round(x.feito)}%`).join(' · ')}. Cada etapa conta a quantidade registrada sobre a prevista; atividade, kit ou entrega com data depois de hoje é planejada e só conta quando a data chega. O traço na barra é o previsto pelo cronograma até o fim do mês passado. É execução física (o que foi entregue), não quanto do dinheiro foi gasto.</p></details></div>
  <div class="dx-kpis">${st.map((e, i) => kpi(i + 1, feito(e) / e.q * 100, feito(e), e.q, lab[e.id], sub[e.id], { '2.1': 'unidades', '4.1': 'agricultores', '3.3': 'agricultores', '3.2': 'eventos' }[e.id] || '')).join('')}</div>
 </section>
 ${semDinheiro() ? '' : `<section class="at panel ${A.some(a => a[0] === 'bad') ? 'crit' : A.length ? 'pend' : ''}" aria-label="O que pede atenção">
  <div class="at-cab"><h2>O que pede atenção</h2><span class="chip">${A.length ? A.length + (A.length === 1 ? ' aviso' : ' avisos') : 'nada pendente'}</span></div>
  ${A.length ? `<div class="at-col" aria-hidden="true"><span>Problema</span><span>Prazo</span><span></span></div>
  <ul class="at-lista">${A.map(a => `<li class="at-item ${a[0]}"><div class="at-txt"><span class="at-tag">${a[0] === 'bad' ? 'Urgente' : 'Atenção'} · ${esc(a[1])}</span><b>${esc(a[3])}</b><span class="small">${esc(a[4])}</span></div>
   <div class="at-prazo">${a[5] ? `${dt(a[5])}<small>${prazoTxt(a[5])}</small>` : '—'}</div>
   <div class="at-acao">${a[6] && abas().some(t => t[0] === a[6]) ? `<button class="b" data-tab="${a[6]}">${R.podeGravar(eu, a[6] === 'financeiro' ? 'despesas' : a[6]) ? 'Resolver' : 'Consultar'}</button>` : ''}</div></li>`).join('')}</ul>` : '<p class="small">Nenhum prazo vencendo, nenhuma rubrica estourada, nenhuma unidade produtiva sem acompanhamento.</p>'}
 </section>`}
 <div class="mm">
 <section class="panel mts" aria-label="Metas do plano de trabalho"><div class="mts-cab"><h2>Metas do plano de trabalho</h2><p>Barra: realizado · traço: previsto até o mês passado · toque na meta para ver as etapas e registrar as entregas</p></div><ul class="mts-l">${metas}</ul></section>
 <section class="panel mts mcs" aria-label="Próximos marcos"><div class="mts-cab"><h2>Próximos marcos</h2><p>Datas do plano de trabalho: início e prazo das etapas, ${semDinheiro() ? '' : 'parcela a receber e '}fim da vigência.${marcosF.length > nMarcos ? ` Mostrando os ${nMarcos} mais próximos de ${marcosF.length}.` : ''}</p></div>${marcos ? `<ol class="mc">${marcos}</ol>` : '<p class="small">Nenhum marco à frente.</p>'}</section>
 </div>
 ${mapa()}
 <section class="panel mts gt" aria-label="Cronograma físico do plano de trabalho"><div class="mts-cab"><h2>Cronograma físico do plano de trabalho</h2>
  <p class="g-leg"><span><i class="g-k jan"></i>período da etapa</span><span><i class="g-k fei"></i>já registrado</span><span><i class="g-k fut"></i>ainda não começou</span><span><i class="g-k late"></i>prazo vencido</span><span><i class="g-k hj"></i>hoje</span></p></div>
  <div class="scroll" tabindex="0" role="region" aria-label="Tabela (role para o lado no celular)"><div class="gantt"><div class="g-row cab"><span></span><div class="g-months">${meses.map((m, i) => `<span class="${i === (hoje().getFullYear() - G0.getFullYear()) * 12 + hoje().getMonth() - G0.getMonth() ? 'g-at' : ''}">${m}</span>`).join('')}<i class="g-hj" style="left:${pos(hoje())}%">hoje</i></div><span></span></div>${g}</div></div></section>
 <div class="two">
  ${prodDist(prod)}
  ${indMeta5(I)}
 </div>`;
  }
  /* indicadores da Meta 5: cada um com ícone, o número e uma linha dizendo de onde ele sai */
  const IC5 = {
    base: '<path d="M3 7h18v10H3z"/><circle cx="12" cy="12" r="2.6"/><path d="M6.5 7V5.5h11V7"/>',
    atual: '<path d="M9 4h6v3H9z"/><path d="M8 5.5H6.5A1.5 1.5 0 0 0 5 7v12.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V7a1.5 1.5 0 0 0-1.5-1.5H16"/><path d="m9 14 2 2 4-4"/>',
    cai: '<path d="M3 6l7 7 4-4 7 7"/><path d="M15 16h6v-6"/>',
    sobe: '<path d="M3 18l7-7 4 4 7-7"/><path d="M15 8h6v6"/>',
    usou: '<path d="M12 21v-8"/><path d="M12 13c0-4 3-7 8-7 0 5-3 8-8 7z"/><path d="M12 15c0-3-2.5-5.5-7-5.5 0 4 2.5 6 7 5.5z"/>',
    caixa: '<path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    pino: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    gente: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17.5" cy="9" r="2.5"/><path d="M17 14.2a5 5 0 0 1 4.5 5"/>'
  };
  /* "?" ao lado do nome do indicador: abre e fecha a explicação logo abaixo (botão de verdade: teclado e leitor de tela) */
  let nExpl = 0;
  const explica = (rot, txt) => { const id = 'ex' + (++nExpl);
    const btn = `<button type="button" class="i5-q" data-expl="${id}" aria-expanded="false" aria-controls="${id}" aria-label="O que é: ${rot.replace(/<[^>]*>/g, '')}"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.8"/><circle cx="12" cy="17.2" r=".6" fill="currentColor"/></svg></button>`;
    // o "?" fica grudado na última palavra do nome: se o nome quebra a linha, o botão vai junto (não sobra sozinho embaixo)
    const m = rot.match(/^(.*?)(\S+)$/s);
    return [`<span class="i5-r">${m ? m[1] : ''}<span class="nw">${m ? m[2] : rot}${btn}</span></span>`,
      `<p class="i5-x" id="${id}" hidden>${txt}</p>`]; };
  function indMeta5(I) {
    const ic = (k, cls) => `<span class="i5-ic ${cls || ''}" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${IC5[k]}</svg></span>`;
    const barra = (pc, cls) => `<span class="i5-bar" aria-hidden="true"><i class="${cls || ''}" style="width:${Math.max(0, Math.min(100, pc)).toFixed(1)}%"></i></span>`;
    const caiu = I.variacao != null && I.variacao < 0, maxG = Math.max(I.base, I.atual) || 1;
    const item = (icone, rot, valor, como, extra) => { const [r, x] = explica(rot, como); return `<li class="i5">${icone}<div class="i5-t">${r}<b class="i5-v">${valor}</b>${extra || ''}${x}</div></li>`; };
    return `<section class="panel mts i5-p" aria-label="Indicadores para a avaliação"><div class="mts-cab"><h2>Indicadores para a avaliação</h2><p>Meta 5 · calculados a partir das visitas e das atividades registradas; resultados ainda a validar com as agricultoras e agricultores</p></div><ul class="i5-l">
     ${item(ic('base'), 'Gasto com insumos comprados, antes do projeto', I.pares ? brl(I.base) + '<small class="i5-u">/mês</small>' : '—', 'Média da linha de base (diagnóstico inicial) das unidades que também têm gasto na última visita.', I.pares ? barra(I.base / maxG * 100, 'ant') : '')}
     ${item(ic('atual'), 'Gasto com insumos comprados, hoje', I.pares ? brl(I.atual) + '<small class="i5-u">/mês</small>' : '—', 'Média do gasto informado na visita mais recente de cada unidade.', I.pares ? barra(I.atual / maxG * 100) : '')}
     ${item(ic(caiu ? 'cai' : 'sobe', I.variacao == null ? '' : caiu ? 'ok' : 'bad'), 'Variação do gasto', I.variacao == null ? '—' : `<span class="${caiu ? 'i5-ok' : 'i5-bad'}">${I.variacao > 0 ? '+' : ''}${num(I.variacao)}%</span>`, `Comparação entre as duas médias acima, nas ${I.pares} unidade(s) produtiva(s) com os dois dados. Queda = economia com insumo comprado.`)}
     ${item(ic('usou'), 'Visitas em que o bioinsumo foi aplicado', I.visitas ? `${num(I.usou)} <small class="i5-u">de ${num(I.visitas)}</small>` : '—', 'Visitas de monitoramento em que a resposta foi “Sim, aplicou”. “Parcial” e “Não” ficam de fora.', I.visitas ? barra(I.usou / I.visitas * 100) : '')}
     ${item(ic('gente'), 'Participantes em capacitações e dias de campo', I.participantes ? `${num(I.participantes)} <small class="i5-u">${num(I.mulheres / I.participantes * 100)}% mulheres</small>` : '—', 'Soma dos participantes das atividades já realizadas (as agendadas não contam). A barra é a parte de mulheres.', I.participantes ? barra(I.mulheres / I.participantes * 100, 'mul') : '')}
    </ul></section>`;
  }
  /* produção e distribuição por tipo de bioinsumo, no mesmo desenho dos indicadores */
  function prodDist(prod) {
    const L = Object.entries(prod);
    const ic = '<span class="i5-ic" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M10 3v6L5 18a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3"/><path d="M7.5 14h9"/></svg></span>';
    return `<section class="panel mts i5-p" aria-label="Produção e distribuição"><div class="mts-cab"><h2>Produção e distribuição</h2><p>Por tipo de bioinsumo, somando os lotes (menos os descartados) · barra: parte já distribuída</p></div>
     ${L.length ? `<ul class="i5-l">${L.map(([k, v]) => { const pc = v[0] ? v[1] / v[0] * 100 : 0, nl = db.lotes.filter(l => l.tipo === k && l.status !== 'Descartado').length;
       const [r, x] = explica(esc(k), `Produzido: soma dos lotes de ${esc(k.toLowerCase())} registrados (os descartados ficam de fora). Distribuído: o que saiu desses lotes nas entregas às unidades produtivas. Saldo: o que ainda está nos lotes. A barra é a parte já distribuída.`);
       return `<li class="i5">${ic}<div class="i5-t">${r}<b class="i5-v">${num(v[0])} <small class="i5-u">${esc(v[2])} produzidos</small></b><span class="i5-bar" aria-hidden="true"><i style="width:${Math.min(100, pc).toFixed(1)}%"></i></span>
        <small>${num(v[1])} ${esc(v[2])} distribuídos (${num(pc)}%) · saldo ${num(v[0] - v[1])} ${esc(v[2])} · ${nl} lote(s)</small>${x}</div></li>`; }).join('')}</ul>` : '<p class="small">Nenhum lote registrado.</p>'}</section>`;
  }
  /* ---------- unidades produtivas: indicadores, cartão por pessoa e ficha com o histórico ---------- */
  const iniciais = n => String(n || '?').replace(/\(.*?\)/g, '').trim().split(/\s+/).filter(Boolean).map(x => x[0]).filter((x, i, a) => i === 0 || i === a.length - 1).join('').toUpperCase() || '?';
  function situacaoAgr(a) {
    if (!a.diag) return ['bad', 'Sem linha de base'];
    const r = recebeu(a.id).length, v = visitasDe(a.id).length;
    if (r && v && acompanhada(a)) return ['ok', 'Acompanhada'];   // mesma regra da Meta 4: visita no dia da 1ª entrega ou depois
    if (r) return ['f', 'Recebeu, falta visita'];
    return ['', 'Aguardando bioinsumo'];
  }
  function telaAgricultores() {
    const L = db.agricultores, pode = R.podeGravar(eu, 'agricultores'), meta = 30;
    const base = L.filter(a => a.diag).length, kits = L.filter(a => a.kit && String(a.kitdata || '') <= iso(hoje())).length, acomp = L.filter(acompanhada).length;
    const falta = (n, de) => n >= de ? 'completo' : `faltam ${de - n}`;
    const ordem = [...L].sort((a, b) => String(a.nome).localeCompare(String(b.nome), 'pt-BR'));
    const cartao = a => { const st = situacaoAgr(a), u = by('unidades', a.unidade), v = visitasDe(a.id);
      return `<li class="pc"><span class="pc-av" aria-hidden="true">${esc(iniciais(a.nome))}</span>
     <div class="pc-t"><div class="pc-n"><b>${esc(a.nome)}</b><span class="chip ${st[0]}">${st[1]}</span>${a.kit ? (String(a.kitdata || '') <= iso(hoje()) ? '<span class="chip ok">kit entregue</span>' : `<span class="chip">kit previsto para ${dt(a.kitdata)}</span>`) : ''}${exChip(a)}</div>
      <div class="pc-d"><span>${esc(a.comunidade || 'comunidade não informada')}</span><span>${esc(a.municipio || '')}${a.uf ? '/' + esc(a.uf) : ''}</span>${a.culturas ? `<span>${esc(a.culturas)}</span>` : ''}${u ? `<span>${esc(u.nome)}</span>` : ''}<span>${recebeu(a.id).length} entrega(s) · ${v.length} visita(s)</span></div></div>
     <button class="b" data-ficha="${esc(a.id)}">Ver detalhes</button></li>`; };
    return `<div class="head"><div><h2>Agricultores e unidades produtivas</h2><p>Meta de ${meta} unidades produtivas acompanhadas e ${meta} kits. Registre a linha de base antes da primeira entrega de bioinsumo.</p></div><div class="acts">${pode ? '<button class="b p" data-new="agricultores">Nova unidade produtiva</button>' : ''}</div></div>
 <section class="dx-topo panel" aria-label="Indicadores das unidades produtivas">
  ${(() => { const real = acomp / meta * 100, prev = R.previstoEtapa(D.ETAPAS.find(e => e.id === '4.1'), hoje()) * 100, st = real >= 99.5 ? ['ok', 'Meta alcançada'] : real >= prev ? ['ok', 'No ritmo'] : real >= prev * 0.7 ? ['f', 'Pouco abaixo do previsto'] : ['bad', 'Abaixo do previsto'];
    return `<div class="dx-exec"><span class="dx-rot">Unidades produtivas acompanhadas</span><div class="dx-exec-num"><b>${pct(real)}%</b></div><div><span class="chip ${st[0]}">${st[1]}</span></div>
   <span class="medidor" role="img" aria-label="${pct(real)}% acompanhadas; previsto até o mês passado: ${pct(prev)}%"><i class="${st[0] === 'ok' ? '' : st[0]}" style="width:${Math.min(100, real)}%"></i>${prev > 0 && prev < 100 ? `<b style="left:${prev}%"></b>` : ''}</span>
   <p class="dx-exec-sub"><span>Acompanhadas: <b>${acomp}</b></span><span>Meta do plano: <b>${meta}</b></span></p>
   <details class="dx-como"><summary>Como é calculado</summary><p>Conta como acompanhada a unidade produtiva que recebeu bioinsumo e teve pelo menos uma visita de monitoramento no dia da primeira entrega ou depois (visita anterior à entrega não acompanha o uso). O percentual é sobre a meta de ${meta} da etapa 4.1. O traço na barra é o previsto pelo cronograma até o fim do mês passado.</p></details></div>`; })()}
  <div class="dx-kpis fin">
  ${kpi(1, L.length / meta * 100, L.length, 'de ' + meta, 'unidades produtivas cadastradas', falta(L.length, meta))}
  ${kpi(2, L.length ? base / L.length * 100 : 0, base, 'de ' + L.length, 'com linha de base (diagnóstico inicial)', L.length ? falta(base, L.length) : 'nenhuma cadastrada')}
  ${kpi(3, kits / meta * 100, kits, 'de ' + meta, 'kits de apoio entregues', falta(kits, meta))}
  ${kpi(4, acomp / meta * 100, acomp, 'de ' + meta, 'acompanhadas (entrega e visita)', falta(acomp, meta))}</div></section>
 <div><div class="head"><div><h2>Quem está cadastrado</h2><p>Em ordem alfabética. A etiqueta mostra o que falta para a unidade contar como acompanhada.</p></div></div>
 ${ordem.length ? `<ul class="pcs">${ordem.map(cartao).join('')}</ul>` : `<div class="panel empty" style="margin-top:10px">Nenhuma unidade produtiva cadastrada ainda.${pode ? ' Use “Nova unidade produtiva”.' : ''}</div>`}</div>`;
  }
  /* ajuda: o que cada aba faz, só das abas que o perfil da pessoa enxerga */
  const AJUDA = { historico: 'Quem entrou no sistema e tudo o que foi incluído, alterado ou excluído, com quem fez e quando. Só a coordenação vê.', equipe: 'Coordenação do projeto, auxiliar administrativo, bolsistas discentes e formadores: quanto o plano prevê para cada função e quem já recebeu bolsa, conforme a planilha da FUNCERN.', painel: 'Resumo do projeto: quanto do plano já foi executado, o que pede atenção, metas, próximos marcos, mapa e cronograma.', unidades: 'As biofábricas, os passos da implantação de cada uma e os itens a comprar pela FUNCERN.',
    lotes: 'Cada batelada de bioinsumo produzida, com código, maturação e saldo.', agricultores: 'Quem o projeto atende: cadastro, linha de base, kit, entregas e visitas de cada pessoa.',
    distribuicoes: 'Cada entrega de bioinsumo: de qual lote saiu e quem recebeu.', visitas: 'Visitas de monitoramento: se aplicou, como está a cultura e quanto gasta com insumos comprados. Dá para imprimir a ficha em branco, pegar a localização pelo GPS (opcional, só a equipe vê) e anexar fotos da visita.',
    eventos: 'Capacitações, dias de campo, reuniões e articulações. Em cada uma: lista de presença (imprimir em branco, colher assinaturas e digitar os nomes) e fotos do dia.', entregas: 'Relatórios, materiais e produtos concluídos, com o link da evidência.',
    financeiro: 'Despesas por rubrica e por meta, comparadas com o plano de desembolso.', relatorios: 'Relatório de execução por período, pronto para imprimir ou salvar em PDF.', dados: 'Planilhas, cópia de segurança e (para a coordenação) quem tem acesso. A senha se troca em Meus dados, tocando no seu nome no alto.' };
  /* onde a ajuda da equipe não vale para o SEAB/MDA (que não vê lista, fotos, avisos internos nem valores) */
  const AJUDA_FORA = { painel: 'Resumo do projeto: quanto do plano já foi executado, metas, próximos marcos, mapa e cronograma.', eventos: 'Capacitações, dias de campo, reuniões e articulações, com o número de participantes.',
    unidades: 'As biofábricas, os passos da implantação de cada uma e a situação dos itens a comprar.' };
  const ajudaDe = k => (fora() && AJUDA_FORA[k]) || AJUDA[k] || '';
  const DESCR_PERFIL = { Coordenação: 'faz tudo, inclusive lançar despesas, cadastrar a equipe e os acessos e ver o histórico.', Equipe: 'registra o trabalho de campo, de produção e de formação. Despesas, equipe e acessos são da coordenação.',
    Auxiliar: 'cuida do financeiro (lança e importa as despesas da FUNCERN, acompanha os itens das biofábricas) e da habilitação da equipe na FUNCERN (cadastro no Arlo e termo). Vê as unidades produtivas numeradas, sem dado pessoal, e não lança dado de campo.',
    Formador: 'registra as capacitações e os dias de campo, com a lista de presença e as fotos. Vê o andamento do projeto sem valores e sem dado pessoal das unidades produtivas.',
    Acompanhamento: 'consulta o andamento em tempo real, sem alterar nada e sem ver dados pessoais.' };
  function abrirAjuda() {
    ed = null; $('#frm').className = 'fm';
    $('#frm').innerHTML = `<div class="fm-cab"><div><span class="fm-eye">Ajuda</span><h2>Como usar o sistema</h2></div><button type="button" class="fm-x" data-fechar aria-label="Fechar">×</button></div>
     <div class="fm-corpo"><div class="fm-oque"><span>O seu perfil</span><p>${esc(R.NOME_PERFIL[eu.perfil] || eu.perfil)}${eu.orgao ? ' · ' + esc(eu.orgao) : ''}: ${DESCR_PERFIL[eu.perfil] || ''}</p></div>
      <h3 class="fm-sec">Você está em: ${esc((abas().find(t => t[0] === tab) || ['', ''])[1])}</h3><p class="aj-p aj-aqui">${ajudaDe(tab)}</p>
      <h3 class="fm-sec">As outras abas</h3><dl class="aj">${abas().filter(t => t[0] !== tab).map(t => `<dt>${t[1]}</dt><dd>${ajudaDe(t[0])}</dd>`).join('')}</dl>
      ${fora() || auxiliar() ? '' : `<h3 class="fm-sec">Sem internet</h3><p class="aj-p">Pode lançar lotes, entregas, visitas e cadastros de campo. Eles ficam com a etiqueta “aguardando envio” e sobem sozinhos quando o sinal voltar. Despesas, acessos e exclusões precisam de internet. Depois de 72 horas sem conexão o sistema pede internet para abrir.</p>`}
      <h3 class="fm-sec">Sol forte</h3><p class="aj-p">Toque no botão do sol, no alto da tela, e ligue o <b>modo sol</b>: letra preta em fundo branco e maior. Ali também se escolhe tema claro ou escuro. Vale só neste aparelho.</p>
      <h3 class="fm-sec">Manual</h3><p class="aj-p"><a href="manuais/manual-${{ 'Coordenação': 'coordenacao', 'Equipe': 'equipe', 'Acompanhamento': 'acompanhamento', 'Auxiliar': 'coordenacao', 'Formador': 'equipe' }[eu.perfil] || 'equipe'}.pdf" target="_blank" rel="noopener">Manual do seu perfil (PDF)</a>, com as telas passo a passo. Abre numa aba nova e precisa de internet.</p>
      <h3 class="fm-sec">Segurança</h3><p class="aj-p">O sistema sai sozinho depois de 15 minutos sem uso. Em aparelho de outra pessoa, toque em sair ao terminar. Dúvida ou erro: fale com a coordenação do projeto.</p></div>
     <div class="fm-pe"><div class="frow"><button type="button" class="b p" data-fechar>Entendi</button></div></div>`;
    if (!$('#dlg').open) $('#dlg').showModal();
  }
  /* relatar problema: monta um texto com o que a coordenação precisa para entender (onde estava, perfil, aparelho) e a pessoa
     envia pelo canal que já usa. Nada é gravado no banco: o projeto é pequeno e o relato vai direto para quem resolve. */
  function abrirRelato() {
    ed = null; $('#frm').className = 'fm'; const aba = (abas().find(t => t[0] === tab) || ['', ''])[1];
    $('#frm').innerHTML = `<div class="fm-cab"><div><span class="fm-eye">Relatar problema</span><h2>O que aconteceu?</h2></div><button type="button" class="fm-x" data-fechar aria-label="Fechar">×</button></div>
     <div class="fm-corpo"><div class="fm-oque"><span>Como funciona</span><p>Escreva o que você estava fazendo e o que deu errado. O sistema junta as informações técnicas e você envia o texto para a coordenação do projeto pelo WhatsApp ou e-mail.</p></div>
      <div class="fields"><div class="fld w"><label for="rl_txt">O que você estava fazendo e o que aconteceu</label><textarea id="rl_txt" rows="5" placeholder="Exemplo: fui registrar uma entrega do lote APO-HUM-001 e apareceu que não tem saldo, mas o lote mostra 80 kg."></textarea><span class="fm-dica">Não escreva nome nem dado de agricultor aqui: diga só a aba e o que tentou fazer.</span></div></div>
      <div class="fld w" id="rl_saida" hidden><label for="rl_pronto">Texto pronto para enviar</label><textarea id="rl_pronto" rows="8" readonly></textarea></div></div>
     <div class="fm-pe"><div class="err" id="ferr" role="alert"></div><div class="frow"><button type="button" class="b" data-fechar>Fechar</button><button type="button" class="b p" data-relatook>Gerar e copiar o texto</button></div></div>`;
    $('#frm').dataset.aba = aba; if (!$('#dlg').open) $('#dlg').showModal();
  }
  async function gerarRelato(botao) {
    const t = $('#rl_txt').value.trim(); if (t.length < 10) { $('#ferr').textContent = 'Conte em uma ou duas frases o que aconteceu.'; return; }
    let versao = ''; try { versao = (await caches.keys()).filter(k => k.startsWith('sqc-')).join(', '); } catch (e) { /* sem cache */ }
    const txt = ['PROBLEMA NO SISTEMA SABERES QUE CULTIVAM', '', t, '', '— informações técnicas —', 'Quando: ' + new Date().toLocaleString('pt-BR'), 'Quem: ' + eu.nome + ' (' + eu.perfil + ')', 'Aba: ' + ($('#frm').dataset.aba || tab),
      'Versão: ' + (versao || 'não instalada neste aparelho'), 'Internet: ' + (navigator.onLine === false ? 'sem conexão' : 'com conexão') + (pend.length ? ' · ' + pend.length + ' lançamento(s) aguardando envio' : ''),
      'Tela: ' + window.innerWidth + ' x ' + window.innerHeight, 'Navegador: ' + navigator.userAgent].join('\n');
    $('#rl_saida').hidden = false; $('#rl_pronto').value = txt; $('#ferr').textContent = '';
    try { await navigator.clipboard.writeText(txt); botao.textContent = 'Copiado'; toast('Texto copiado. Cole no WhatsApp ou no e-mail da coordenação.'); }
    catch (e) { $('#rl_pronto').focus(); $('#rl_pronto').select(); toast('Selecione e copie o texto que apareceu, e envie para a coordenação.'); }
  }
  function abrirFicha(id) {
    const a = by('agricultores', id); if (!a) return; ed = null; const st = situacaoAgr(a), u = by('unidades', a.unidade), ent = recebeu(id).sort((x, y) => x.data < y.data ? 1 : -1), vis = visitasDe(id);
    const linha = (r, v) => `<dt>${r}</dt><dd>${v}</dd>`; $('#frm').className = 'fm ficha';
    $('#frm').innerHTML = `<div class="fm-cab"><div class="pc-cab"><span class="pc-av g" aria-hidden="true">${esc(iniciais(a.nome))}</span><div><h2>${esc(a.nome)}</h2><div class="pc-n"><span class="chip ${st[0]}">${st[1]}</span>${a.kit ? (String(a.kitdata || '') <= iso(hoje()) ? '<span class="chip ok">kit entregue</span>' : `<span class="chip">kit previsto para ${dt(a.kitdata)}</span>`) : ''}${exChip(a)}</div></div></div><button type="button" class="fm-x" data-fechar aria-label="Fechar">×</button></div>
 <div class="fm-corpo"><dl class="kv">${linha('Comunidade', esc(a.comunidade) || '—')}${linha('Município', (esc(a.municipio) || '—') + (a.uf ? '/' + esc(a.uf) : ''))}${linha('Território', esc(a.territorio) || '—')}${linha('Biofábrica que atende', esc(u ? u.nome : '') || '—')}
  ${linha('Culturas', esc(a.culturas) || '—')}${linha('Área cultivada', R.vazio(a.area) ? '—' : num(a.area, 1) + ' ha')}${linha('Diagnóstico inicial', a.diag ? dt(a.diag) : '<span class="chip bad">falta</span>')}
  ${linha('Usa químico', esc(a.quimico) || '—')}${linha('Gasto com insumos (linha de base)', R.vazio(a.gasto0) ? '—' : brl(a.gasto0) + '/mês')}${linha('Kit de apoio', a.kit ? 'entregue em ' + dt(a.kitdata) : 'não entregue')}</dl>
 <div><h3>Bioinsumos recebidos (${ent.length})</h3>${ent.length ? `<div class="scroll" tabindex="0" role="region" aria-label="Tabela (role para o lado no celular)"><table><tbody>${ent.map(d => { const l = by('lotes', d.lote) || {}; return `<tr><td>${dt(d.data)}</td><td><span class="mono">${esc(l.codigo || '')}</span> ${esc(l.tipo || '')}</td><td class="n">${num(d.qtd)} ${esc(l.med || '')}</td></tr>`; }).join('')}</tbody></table></div>` : '<p class="small">Nenhuma entrega registrada.</p>'}</div>
 <div><h3>Visitas de monitoramento (${vis.length})</h3>${vis.length ? `<div class="scroll" tabindex="0" role="region" aria-label="Tabela (role para o lado no celular)"><table><tbody>${vis.map(v => `<tr><td>${dt(v.data)}</td><td><span class="chip ${v.usou === 'Sim' ? 'ok' : v.usou === 'Não' ? 'bad' : 'f'}">aplicou: ${esc(v.usou)}</span></td><td>${R.vazio(v.gasto) ? '' : brl(v.gasto) + '/mês'}</td><td class="small">${esc(v.obs || '')}</td></tr>`).join('')}</tbody></table></div>` : '<p class="small">Nenhuma visita registrada.</p>'}</div></div>
 <div class="fm-pe"><div class="frow">${R.podeExcluir(eu, 'agricultores', a) && !a._pendente ? `<button type="button" class="b d" data-del="agricultores:${esc(id)}" data-fechaapos>Excluir</button>` : ''}<button type="button" class="b" data-fechar autofocus>Fechar</button>
  ${R.podeGravar(eu, 'visitas') ? `<button type="button" class="b" data-new="visitas" data-pre="${esc(id)}">Registrar visita</button><button type="button" class="b" data-new="distribuicoes" data-pre="${esc(id)}">Registrar entrega</button><button type="button" class="b p" data-edit="agricultores:${esc(id)}">Editar cadastro</button>` : ''}</div></div>`;
    if (!$('#dlg').open) $('#dlg').showModal();
  }
  /* município aberto no mapa: o que dá para saber dali sem sair da Visão geral (para o SEAB/MDA, os nomes já chegam numerados pelo banco) */
  function detalheMun(g) {
    const L = g.l.slice().sort((a, b) => String(a.nome).localeCompare(String(b.nome), 'pt-BR'));
    const ent = L.reduce((t, a) => t + recebeu(a.id).length, 0), vis = L.reduce((t, a) => t + visitasDe(a.id).length, 0), kits = L.filter(a => a.kit && String(a.kitdata || '') <= iso(hoje())).length;
    const ult = L.map(a => (visitasDe(a.id)[0] || {}).data).filter(Boolean).sort().pop();
    const bios = [...new Set(L.map(a => a.unidade).filter(Boolean))].map(id => by('unidades', id)).filter(Boolean);
    return `<div class="mp-det" role="region" aria-label="Dados de ${esc(g.nome)}"><div class="mp-det-c"><h3>${esc(g.nome)}</h3><button type="button" class="b s" data-mapamun="" aria-label="Fechar os dados de ${esc(g.nome)}">Fechar</button></div>
     <dl class="mp-det-n">${[['gente', 'Unidades produtivas', g.n], ['atual', 'Acompanhadas', g.ac], ['caixa', 'Kits entregues', kits], ['usou', 'Entregas de bioinsumo', ent], ['pino', 'Visitas', vis], ['cal', 'Última visita', ult ? dt(ult) : '—']]
       .map(([k, t, v]) => `<div><span class="md-ic" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${IC5[k]}</svg></span><dt>${t}</dt><dd>${v}</dd></div>`).join('')}</dl>
     ${bios.length ? `<p class="small">Atendidas por: ${bios.map(u => esc(u.nome)).join(', ')}</p>` : ''}
     <p class="small mp-dica">Toque numa unidade produtiva para ver entregas, visitas e linha de base.</p><ul class="mp-det-l">${L.map(a => { const st = situacaoAgr(a); return `<li><button type="button" class="mp-pessoa" data-ficha="${esc(a.id)}" title="Ver tudo de ${esc(a.nome)}"><span>${esc(a.nome)}${a.comunidade ? `<small>${esc(a.comunidade)}</small>` : ''}</span><span class="chip ${st[0]}">${st[1]}</span><span class="mp-seta" aria-hidden="true">›</span></button></li>`; }).join('')}</ul></div>`;
  }
  /* ---------- mapa: onde estão as biofábricas e as unidades produtivas (Ceará e Rio Grande do Norte) ---------- */
  let mapaUF = 'todos', mapaMun = '';   // mapaMun: município aberto no mapa (clique ou Enter no círculo)
  const semAcento = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[-']/g, ' ').replace(/\s+/g, ' ').trim();
  const pontoDe = (mun, uf) => SQC.GEO.mun[semAcento(mun) + '/' + String(uf || '').toUpperCase().trim()] || null;
  function mapa() {
    const estreito = window.innerWidth < 720, G = SQC.GEO, ufs = mapaUF === 'todos' ? ['CE', 'RN'] : [mapaUF], W = estreito ? 340 : 620, H = estreito ? 300 : 440, M = 22;
    const b = ufs.map(u => G.uf[u].b).reduce((a, x) => [Math.min(a[0], x[0]), Math.min(a[1], x[1]), Math.max(a[2], x[2]), Math.max(a[3], x[3])]);
    const kx = Math.cos((b[1] + b[3]) / 2 * Math.PI / 180), esc_ = Math.min((W - 2 * M) / ((b[2] - b[0]) * kx), (H - 2 * M) / (b[3] - b[1]));
    const ox = (W - (b[2] - b[0]) * kx * esc_) / 2, oy = (H - (b[3] - b[1]) * esc_) / 2;
    const X = lon => ox + (lon - b[0]) * kx * esc_, Y = lat => oy + (b[3] - lat) * esc_;
    const noRecorte = a => ufs.includes(String(a.uf || '').toUpperCase().trim());
    // unidades produtivas agrupadas por município
    const grupos = {}; let fora = 0; const L = db.agricultores;
    L.forEach(a => { const p = pontoDe(a.municipio, a.uf); if (!p) { fora++; return; } if (!noRecorte(a)) return; const k = semAcento(a.municipio) + '/' + String(a.uf).toUpperCase().trim(); (grupos[k] = grupos[k] || { k, p, nome: a.municipio + '/' + String(a.uf).toUpperCase().trim(), n: 0, ac: 0, l: [] }).n++; grupos[k].l.push(a); if (acompanhada(a)) grupos[k].ac++; });
    const pts = Object.values(grupos).sort((a, c) => c.n - a.n), bio = db.unidades.map(u => ({ u, p: pontoDe(u.municipio, u.uf) })).filter(x => x.p && noRecorte(x.u));
    const visiveis = L.filter(a => pontoDe(a.municipio, a.uf) && noRecorte(a)), cont = {}; visiveis.forEach(a => { const s = situacaoAgr(a)[1]; cont[s] = (cont[s] || 0) + 1; });
    const ORDEM = [['Acompanhada', 'ok'], ['Recebeu, falta visita', 'f'], ['Aguardando bioinsumo', ''], ['Sem linha de base', 'bad']];
    const anel = r => 'M' + r.map(q => X(q[0]).toFixed(1) + ' ' + Y(q[1]).toFixed(1)).join(' L') + ' Z';
    const raio = n => Math.min(26, 10 + 3.2 * Math.sqrt(n));
    /* municípios vizinhos (e a biofábrica do próprio município) cairiam um em cima do outro: cada marca é empurrada
       só o bastante para não encostar nas outras. A posição fica aproximada; o nome certo está na dica e na lista ao lado. */
    const nos = pts.map(g => ({ g, x: X(g.p[0]), y: Y(g.p[1]), r: raio(g.n) })).concat(bio.map(x => ({ b: x, x: X(x.p[0]) + 6, y: Y(x.p[1]) - 6, r: 12 })));
    for (let v = 0; v < 80; v++) for (let i = 0; i < nos.length; i++) for (let j = i + 1; j < nos.length; j++) {
      const a = nos[i], c = nos[j]; let dx = c.x - a.x, dy = c.y - a.y, d = Math.hypot(dx, dy); const min = a.r + c.r + 3;
      if (d >= min) continue; if (d < 0.01) { dx = 1; dy = -1; d = Math.SQRT2; }
      const e = (min - d) / 2 / d; a.x -= dx * e; a.y -= dy * e; c.x += dx * e; c.y += dy * e;
    }
    nos.forEach(o => { o.x = Math.max(o.r + 2, Math.min(W - o.r - 2, o.x)); o.y = Math.max(o.r + 2, Math.min(H - o.r - 2, o.y)); });
    // município aberto: os dados dele tomam o lugar do resumo ao lado do mapa (o painel não cresce para baixo); “Fechar” volta ao resumo
    const aberto = pts.find(x => x.k === mapaMun);
    return `<section class="mp panel" aria-label="Mapa do projeto"><div class="head"><div><h2>Onde o projeto está</h2><p>${visiveis.length} unidade(s) produtiva(s) e ${bio.length} biofábrica(s) no mapa${fora ? ` · ${fora} cadastro(s) fora do mapa (município não reconhecido no CE ou no RN)` : ''}</p></div>
   <div class="seg peq" role="tablist">${[['todos', 'Todos'], ['CE', 'CE'], ['RN', 'RN']].map(o => `<button type="button" role="tab" aria-selected="${mapaUF === o[0]}" data-mapa="${o[0]}">${o[1]}</button>`).join('')}</div></div>
  <div class="mp-g"><div class="mp-m"><svg data-vb="${W}" viewBox="0 0 ${W} ${H}" role="group" aria-label="Mapa do ${ufs.map(u => u === 'CE' ? 'Ceará' : 'Rio Grande do Norte').join(' e do ')} com as biofábricas e as unidades produtivas por município. Cada círculo abre os dados do município; os mesmos números estão na lista ao lado.">
    ${ufs.map(u => G.uf[u].r.map(r => `<path class="mp-uf" d="${anel(r)}"/>`).join('') + `<text class="mp-sg" x="${X((G.uf[u].b[0] + G.uf[u].b[2]) / 2)}" y="${Y((G.uf[u].b[1] + G.uf[u].b[3]) / 2 - (u === 'CE' ? 0.9 : 0.35))}" text-anchor="middle">${u}</text>`).join('')}
    ${nos.filter(o => o.g).map(o => { const g = o.g; return `<g class="mp-p${g.k === mapaMun ? ' sel' : ''}" role="button" tabindex="0" data-mapamun="${esc(g.k)}" aria-pressed="${g.k === mapaMun}" aria-label="${esc(g.nome)}: ${g.n} unidade(s) produtiva(s), ${g.ac} acompanhada(s). Ver detalhes"><circle cx="${o.x.toFixed(1)}" cy="${o.y.toFixed(1)}" r="${o.r.toFixed(1)}"/><text x="${o.x.toFixed(1)}" y="${(o.y + 4.5).toFixed(1)}" text-anchor="middle">${g.n}</text></g>`; }).join('')}
    ${nos.filter(o => o.b).map(o => { const x = o.b, cx = o.x, cy = o.y; return `<g class="mp-b"><title>${esc(x.u.nome)} (${esc(x.u.municipio)}/${esc(x.u.uf)}): ${nCheck(x.u)} de ${D.CHECK.length} passos da implantação</title><g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)})">${FRASCO}</g><text x="${(cx + 17).toFixed(1)}" data-esq="${(cx - 17).toFixed(1)}" y="${(cy + 4).toFixed(1)}">${esc(x.u.sigla)}</text></g>`; }).join('')}
   </svg><div class="leg"><span><i class="mk c"></i>Unidades produtivas no município (o número é quantas)</span><span><svg class="mk-f" viewBox="-13 -13 26 26" width="20" height="20" aria-hidden="true" focusable="false">${FRASCO}</svg>Biofábrica</span></div></div>
   <div class="mp-l">${aberto ? detalheMun(aberto) : ''}<div class="mp-resumo"${aberto ? ' hidden' : ''}><div class="mp-n"><b>${visiveis.length}</b><span><strong>unidades produtivas</strong>${pts.length} município(s) · meta de 30</span></div>
    <div><h3>Situação</h3><ul class="mp-s">${ORDEM.map(o => `<li><span class="chip ${o[1]}">${o[0]}</span><b>${cont[o[0]] || 0}</b></li>`).join('')}</ul></div>
    <div><h3>Biofábricas</h3>${bio.length ? `<ul class="mp-s bf">${bio.map(x => `<li><svg class="mk-f" viewBox="-13 -13 26 26" width="28" height="28" aria-hidden="true" focusable="false">${FRASCO}</svg><span>${esc(x.u.nome)}<small>${esc(x.u.municipio)}/${esc(x.u.uf)}${x.u.conta === 'Sim' ? '' : ' · apoio'}</small></span><b>${nCheck(x.u)}/${D.CHECK.length}</b></li>`).join('')}</ul>` : '<p class="small">Nenhuma neste recorte.</p>'}</div>
    <div><h3>Municípios com mais unidades produtivas</h3>${pts.length ? `<ul class="mp-s pt">${pts.slice(0, 8).map(g => `<li><button type="button" class="mp-mun" data-mapamun="${esc(g.k)}" aria-pressed="${g.k === mapaMun}"><span>${esc(g.nome)}</span><b>${g.n}</b></button></li>`).join('')}</ul>` : '<p class="small">Nenhuma unidade produtiva cadastrada neste recorte.</p>'}</div></div></div></div></section>`;
  }
  /* ---------- financeiro: gráfico do ritmo do gasto, uso de cada rubrica e tabela que abre ---------- */
  let ritmoAtual = null;   // o que o gráfico mostrou por último (a dica ao passar o mouse lê daqui)
  /* medidas do desenho: no celular ele já nasce estreito, para a letra (que não encolhe) caber na margem */
  const GR_LARGO = { w: 640, h: 300, l: 78, r: 14, t: 14, b: 30 }, GR_ESTREITO = { w: 340, h: 250, l: 74, r: 10, t: 16, b: 30 }; let GR = GR_LARGO;
  function graficoRitmo(forcar) {
    const caixa = document.querySelector('.fin-2'), larg = caixa ? (window.innerWidth > 980 ? caixa.clientWidth / 2 : caixa.clientWidth) : window.innerWidth;
    GR = forcar || (larg < 560 ? GR_ESTREITO : GR_LARGO);   // palpite antes de desenhar; ajustarGrafico() confere depois, pelo espaço que o gráfico ganhou de fato
    const X = R.ritmo(db, hoje()), P = X.pontos, n = P.length, max = X.total; ritmoAtual = X;
    const x = i => GR.l + (GR.w - GR.l - GR.r) * (i + 1) / n, y = v => GR.h - GR.b - (GR.h - GR.t - GR.b) * v / max, x0 = GR.l;
    const linha = k => { const pts = P.map((p, i) => p[k] == null ? null : [x(i), y(p[k])]).filter(Boolean); return pts.length ? 'M' + [[x0, y(0)]].concat(pts).map(q => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' L') : ''; };
    // recebido entra de uma vez (parcela): linha em degrau
    const degrau = () => { let d = `M${x0} ${y(0)}`, ant = 0; P.forEach((p, i) => { if (p.recebido == null) return; d += ` L${x(i).toFixed(1)} ${y(ant).toFixed(1)}`; if (p.recebido !== ant) { d += ` L${x(i).toFixed(1)} ${y(p.recebido).toFixed(1)}`; ant = p.recebido; } }); return d; };
    const ult = P.filter(p => p.executado != null).length - 1, grade = [0, .25, .5, .75, 1].map(f => max * f);
    const mk = v => v === 0 ? '0' : (GR === GR_ESTREITO ? '' : 'R$ ') + num(v / 1000) + ' mil';   // estreito: "400 mil" cabe na margem
    const atual = P.findIndex(p => p.atual);
    return `<div class="panel box fin-g"><div><h2 class="fin-t">Ritmo do gasto <small>acumulado mês a mês</small></h2>
   <div class="leg"><span><i class="lg prev"></i>Previsto (plano de desembolso)</span><span><i class="lg exec"></i>Pago</span><span><i class="lg rec"></i>Recebido do MDA</span></div></div>
   <div class="rg" data-rg tabindex="0" role="group" aria-label="Gráfico do gasto acumulado. Use as setas para a esquerda e para a direita para ouvir cada mês."><span class="so" id="rg-voz" aria-live="polite"></span><svg data-vb="${GR.w}" viewBox="0 0 ${GR.w} ${GR.h}" role="img" aria-label="Gasto acumulado mês a mês: previsto, pago e recebido. Os valores estão na tabela logo abaixo.">
    ${grade.map(v => `<line class="gr" x1="${GR.l}" x2="${GR.w - GR.r}" y1="${y(v)}" y2="${y(v)}"/><text class="ax" x="${GR.l - 8}" y="${y(v) + 4}" text-anchor="end">${mk(v)}</text>`).join('')}
    ${P.map((p, i) => i % (window.innerWidth < 720 ? 3 : 2) ? '' : `<text class="ax" x="${x(i)}" y="${GR.h - 8}" text-anchor="middle">${p.rotulo}</text>`).join('')}
    ${atual >= 0 ? `<line class="hj" x1="${x(atual)}" x2="${x(atual)}" y1="${GR.t}" y2="${GR.h - GR.b}"/><text class="ax" x="${x(atual) + 5}" y="${GR.t + 10}">mês atual</text>` : ''}
    <path class="l prev" d="${linha('previsto')}"/><path class="l rec" d="${degrau()}"/><path class="l exec" d="${linha('executado')}"/>
    ${ult >= 0 ? `<circle class="pt exec" cx="${x(ult)}" cy="${y(P[ult].executado)}" r="4.5"/><circle class="pt rec" cx="${x(ult)}" cy="${y(P[ult].recebido)}" r="4.5"/>` : ''}
    <line class="cr" data-cr x1="0" x2="0" y1="${GR.t}" y2="${GR.h - GR.b}" hidden/></svg><div class="dica" data-dica hidden></div></div>
   <p class="small">Passe o mouse ou toque num mês. O previsto é o plano de desembolso enviado à FUNCERN (planilha de 05/10/2026, ajustada ao plano universal v4 de 07/10/2026) e fecha em ${brl(X.total)}.</p>
   <details class="dx-como"><summary>Ver os números em tabela</summary><div class="scroll" tabindex="0" role="region" aria-label="Tabela (role para o lado no celular)"><table><thead><tr><th>Mês</th><th class="n">Previsto</th><th class="n">Pago</th><th class="n">Recebido</th></tr></thead><tbody>${P.map(p => `<tr><td>${p.rotulo}</td><td class="n">${brl(p.previsto)}</td><td class="n">${p.executado == null ? '—' : brl(p.executado)}</td><td class="n">${p.recebido == null ? '—' : brl(p.recebido)}</td></tr>`).join('')}</tbody></table></div></details></div>`;
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
  /* conteúdo de linha que abre (rubrica, meta): só é montado quando alguém abre. Antes cada despesa era desenhada três vezes
     escondida e o Financeiro levava 1,4 s num celular simples (auditoria de 14/10) */
  let TARDE = new Map(), nTarde = 0;
  const adiar = html => html.trim().replace(/<\/summary>([\s\S]*)<\/details>$/, (x, corpo) => { const k = 't' + (++nTarde); TARDE.set(k, corpo); return `</summary><div data-tarde="${k}" hidden></div></details>`; });
  function abrirTarde(d) { d.querySelectorAll(':scope > [data-tarde]').forEach(x => { const h = TARDE.get(x.dataset.tarde); x.outerHTML = h == null ? '' : h; }); }
  function tabelaRubricas(FR, lim) {
    const FI = R.finItens(db, lim);
    const rm = k => ritmoAtual ? ritmoAtual.pontos[k].rotulo : k + 1;
    const linha = r => { const u = r.prev ? (r.pago + r.comp) / r.prev * 100 : 0, itens = D.DESEMBOLSO.itens.filter(i => i.rubrica === r.id), ds = db.despesas.filter(d => r.semRubrica ? !D.RUBRICAS.some(x => x.id === d.rubrica) : d.rubrica === r.id).sort((a, b) => a.data < b.data ? 1 : -1);
      const v = (x, forte) => x ? (forte ? `<b>${brl(x)}</b>` : brl(x)) : '—';
      return `<details class="rb" id="rb-${r.id || 'sem'}"><summary><span class="rb-n"><i class="rb-s" aria-hidden="true"></i><span>${esc(r.nome)}</span><span class="chip">${itens.length ? itens.length + (itens.length === 1 ? ' item' : ' itens') : ds.length + ' despesa(s)'}</span></span>
     <span class="rb-v" data-r="Previsto">${v(r.prev)}</span><span class="rb-v" data-r="Pago">${v(r.pago)}</span><span class="rb-v" data-r="Comprometido">${v(r.comp)}</span><span class="rb-v${r.saldo < 0 ? ' neg' : ''}" data-r="Saldo"><b>${brl(r.saldo)}</b></span>
     <span class="rb-e"><span class="medidor fino"><i class="${u > 100 ? 'bad' : ''}" style="width:${Math.min(100, u)}%"></i></span><b>${pct(u)}%</b></span></summary>
    <div class="rb-c">${itens.map(i => { const x = FI.find(y => y.id === i.id), ui = x.prev ? (x.pago + x.comp) / x.prev * 100 : 0, ms = x.meses;
        const comp_ = x.mensal ? `${ms.length} meses · ${brl(x.mensal)}/mês` : ms.length === 1 ? `1 desembolso, em ${rm(ms[0])}` : `${ms.length} desembolsos, de ${rm(ms[0])} a ${rm(ms[ms.length - 1])}`;
        return `<details class="rb-i"><summary><span class="rb-in">${esc(i.nome)}</span><span class="rb-v" data-r="Previsto">${brl(x.prev)}</span><span class="rb-v" data-r="Pago">${v(x.pago)}</span><span class="rb-v" data-r="Comprometido">${v(x.comp)}</span><span class="rb-v${x.saldo < 0 ? ' neg' : ''}" data-r="Saldo">${brl(x.saldo)}</span>
          <span class="rb-e"><span class="medidor fino"><i class="${ui > 100 ? 'bad' : ''}" style="width:${Math.min(100, ui)}%"></i></span><b>${pct(ui)}%</b></span></summary>
          <dl class="rb-x"><div><dt>Composição</dt><dd>${comp_}</dd></div><div><dt>Previsto</dt><dd>${brl(x.prev)}</dd></div><div><dt>Pago</dt><dd>${brl(x.pago)}</dd></div><div><dt>Comprometido</dt><dd>${brl(x.comp)}</dd></div><div><dt>Saldo</dt><dd class="${x.saldo < 0 ? 'neg' : ''}"><b>${brl(x.saldo)}</b></dd></div><div><dt>Despesas com este item</dt><dd>${x.despesas.length}</dd></div></dl></details>`; }).join('')}
      ${itens.length && ds.some(d => !d.item) ? `<p class="rb-si">${ds.filter(d => !d.item).length} despesa(s) desta rubrica sem item indicado (${brl(ds.filter(d => !d.item).reduce((t, d) => t + (+d.valor || 0), 0))}): entram no total da rubrica, mas não em nenhum item. Para corrigir, edite a despesa na lista “Despesas do projeto”, no fim desta página, e escolha o item.</p>` : ''}
     <div class="rb-d"><h3>Despesas lançadas nesta rubrica</h3>${ds.length ? `<div class="scroll" tabindex="0" role="region" aria-label="Tabela (role para o lado no celular)"><table><thead><tr><th>Data</th><th>Etapa</th><th>Descrição</th><th>Situação</th><th class="n">Valor</th></tr></thead><tbody>${ds.map(d => `<tr><td>${dt(d.data)}${exChip(d)}</td><td><span class="mono">${esc(d.etapa)}</span></td><td>${esc(d.descricao)}<div class="small">${esc((D.DESEMBOLSO.itens.find(i => i.id === d.item) || { nome: 'sem item indicado' }).nome)}${d.favorecido ? ' · ' + esc(d.favorecido) : ''}</div></td><td><span class="chip ${d.status === 'Pago' ? 'ok' : 'f'}">${esc(d.status)}</span></td><td class="n">${brl(d.valor)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="small">Nenhuma despesa lançada ainda.</p>'}</div></div></details>`; };
    return `<div><div class="head"><div><h2>Por rubrica</h2><p>Toque na rubrica para ver os itens do plano e as despesas lançadas nela.</p></div><div class="acts"><button class="b" data-abrir-rub>Abrir todas</button></div></div>
   <div class="panel rb-t" style="margin-top:10px"><div class="rb-h" aria-hidden="true"><span>Rubrica</span><span>Previsto</span><span>Pago</span><span>Comprometido</span><span>Saldo</span><span>Execução</span></div>${FR.map(r => adiar(linha(r))).join('')}
    <div class="rb-tot"><span>Total</span><span data-r="Previsto">${brl(R.soma(FR, 'prev'))}</span><span data-r="Pago">${brl(R.soma(FR, 'pago'))}</span><span data-r="Comprometido">${brl(R.soma(FR, 'comp'))}</span><span data-r="Saldo"><b>${brl(R.soma(FR, 'saldo'))}</b></span><span></span></div></div>
   <p class="note" style="margin-top:8px">Passar de uma rubrica para outra exige ajuste do plano de trabalho. O sistema avisa no painel quando uma rubrica chega a 90% ou estoura.</p></div>`;
  }
  /* ---------- importar a planilha de solicitações da FUNCERN: lê no aparelho, mostra o que vai mudar e só grava depois de confirmar ---------- */
  let imp = null;
  const CH_ST = 'sqc-imp-status';
  const lerLS = k => { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; } };
  async function aoEscolherPlanilha(arq) {
    if (!arq) return;
    try {
      if (!/\.xlsx$/i.test(arq.name)) throw new Error('Envie a planilha no formato .xlsx, como a FUNCERN exporta.');
      const L = R.lerSolicitacoes(await SQC.planilha.ler(await arq.arrayBuffer()));
      if (!L.sols.length) throw new Error('Não encontrei solicitações nesta planilha. Ela precisa ter a coluna “ID Solicitação”, como a exportação da FUNCERN.');
      imp = { nome: arq.name, sols: L.sols, erros: L.erros, escolhas: { status: lerLS(CH_ST), etapa: {}, rubrica: {} } }; desenharImportacao();
    } catch (e) { toast(e.message || 'Não consegui ler a planilha.'); }
  }
  function desenharImportacao(msg) {
    const P = imp.plano = R.planoImportacao(db, imp.sols, imp.escolhas); ed = null; $('#frm').className = 'fm';
    const op = (lista, sel) => lista.map(o => `<option value="${esc(o[0])}"${o[0] === sel ? ' selected' : ''}>${esc(o[1])}</option>`).join('');
    const n = P.novas + P.atualizadas + P.removidas;
    $('#frm').innerHTML = `<div class="fm-cab"><div><span class="fm-eye">Importar planilha</span><h2>Solicitações da FUNCERN</h2></div><button type="button" class="fm-x" data-fechar aria-label="Fechar">×</button></div>
     <div class="fm-corpo"><div class="fm-oque"><span>${esc(imp.nome)}</span><p>Nada é gravado antes de você confirmar. O CPF dos beneficiários não é lido nem guardado. Cada solicitação é reconhecida pelo número: subir a mesma planilha de novo não duplica nada.</p></div>
      <dl class="imp-r"><div><dt>Novas</dt><dd>${P.novas}</dd></div><div><dt>Atualizadas</dt><dd>${P.atualizadas}</dd></div><div><dt>Sem mudança</dt><dd>${P.iguais}</dd></div><div><dt>Removidas</dt><dd>${P.removidas}</dd></div><div><dt>Pago</dt><dd>${brl(P.pago)}</dd></div><div><dt>Comprometido</dt><dd>${brl(P.comprometido)}</dd></div></dl>
      <h3 class="fm-sec">Como cada status da fundação entra na conta</h3>
      <div class="imp-l">${P.status.map(s => `<div class="imp-i"><div><b>${esc(s.txt)}</b><span class="small">${s.n} solicitação(ões) · ${brl(s.total)}</span></div><select data-imp-st="${esc(s.txt)}" aria-label="Como contar o status ${esc(s.txt)}">${op([['Pago', 'Conta como pago'], ['Comprometido', 'Conta como comprometido'], ['Ignorar', 'Não entra (cancelada)']], s.destino)}</select></div>`).join('')}</div>
      <h3 class="fm-sec">Etapa do plano de cada tipo de despesa</h3><p class="aj-p">A planilha não traz a etapa do TED. Escolha uma vez por tipo: nas próximas importações o sistema repete a escolha.</p>
      <div class="imp-l">${P.grupos.map(g => `<div class="imp-i${!g.rubrica || !g.etapa ? ' falta' : ''}"><div><b>${esc(g.detalhe || g.rubricaTxt || 'Sem detalhe')}</b><span class="small">${esc(g.rubricaTxt)} · ${g.n} solicitação(ões) · ${brl(g.total)}</span></div>
        <span class="imp-s">${g.rubricaAuto ? '' : `<select data-imp-rb="${esc(g.chave)}" aria-label="Rubrica de ${esc(g.detalhe)}">${op([['', 'Escolha a rubrica']].concat(D.RUBRICAS.map(x => [x.id, x.nome])), g.rubrica)}</select>`}<select data-imp-et="${esc(g.chave)}" aria-label="Etapa de ${esc(g.detalhe)}">${op([['', 'Escolha a etapa']].concat(D.ETAPAS.map(e => [e.id, `${e.id} · ${e.nome}`])), g.etapa)}</select></span></div>`).join('') || '<p class="small">Nenhuma solicitação a importar.</p>'}</div>
      ${imp.erros.length ? `<h3 class="fm-sec">Linhas que não consegui ler (${imp.erros.length})</h3><ul class="al">${imp.erros.slice(0, 8).map(e => `<li><span>${esc(e)}</span></li>`).join('')}</ul>` : ''}
      ${P.foraDaPlanilha || P.manuais ? `<p class="note">${P.foraDaPlanilha ? `${P.foraDaPlanilha} despesa(s) importada(s) antes não estão nesta planilha e ficam como estão. ` : ''}${P.manuais ? `${P.manuais} despesa(s) lançada(s) à mão não são alteradas pela importação.` : ''}</p>` : ''}</div>
     <div class="fm-pe"><div class="err" id="ferr" role="alert">${esc(msg || (P.faltam ? `Falta escolher a etapa${P.grupos.some(g => !g.rubrica) ? ' ou a rubrica' : ''} de ${P.faltam} tipo(s) de despesa.` : ''))}</div><div class="frow"><button type="button" class="b" data-fechar>Cancelar</button><button type="button" class="b p" data-impok${P.faltam || !n ? ' disabled' : ''}>${n ? `Gravar ${n} alteração(ões)` : 'Nada a gravar'}</button></div></div>`;
    if (!$('#dlg').open) $('#dlg').showModal();
  }
  async function confirmarImportacao(bt) {
    const P = imp.plano; bt.disabled = true; let feitas = 0; const total = P.novas + P.atualizadas + P.removidas;
    try {
      for (const l of P.linhas) {
        if (l.acao === 'nova') await api.salvar('despesas', Object.assign({}, l.reg, { id: SQC.novoId() }), { novo: true });
        else if (l.acao === 'atualiza') await api.salvar('despesas', Object.assign({}, l.ant, l.reg), { novo: false, base: l.ant.atualizado_em || null });
        else if (l.acao === 'remove') await api.excluir('despesas', l.ant.id);
        else continue;
        bt.textContent = `Gravando ${++feitas} de ${total}…`;
      }
      await recarregarDb(); $('#dlg').close(); imp = null; render(); toast(`Planilha importada: ${P.novas} nova(s), ${P.atualizadas} atualizada(s), ${P.removidas} removida(s).`);
    } catch (e) { try { await recarregarDb(); } catch (x) { /* fica com o que tinha */ } render(); desenharImportacao(`Parou depois de ${feitas} de ${total}: ${e.message} O que já foi gravado continua gravado; corrija e confirme de novo.`); }
  }
  /* o mesmo gasto pelas metas do TED: meta abre as etapas; etapa abre a composição e os valores (mesmo desenho da tabela por rubrica) */
  function tabelaMetas(F) {
    const v = x => x ? brl(x) : '—', somaD = (ds, pago) => ds.filter(d => (d.status === 'Pago') === pago).reduce((t, d) => t + (+d.valor || 0), 0);
    const barra = u => `<span class="rb-e"><span class="medidor fino"><i class="${u > 100 ? 'bad' : ''}" style="width:${Math.min(100, u)}%"></i></span><b>${pct(u)}%</b></span>`;
    const linha = m => { const u = m.prev ? (m.pago + m.comp) / m.prev * 100 : 0, es = D.ETAPAS.filter(e => e.m === m.m), ds = db.despesas.filter(d => String(d.etapa)[0] === String(m.m)).sort((a, b) => a.data < b.data ? 1 : -1);
      return `<details class="rb"><summary><span class="rb-n"><i class="rb-s" aria-hidden="true"></i><span>Meta ${m.m} · ${esc(m.nome)}</span><span class="chip">${es.length === 1 ? '1 etapa' : es.length + ' etapas'}</span></span>
     <span class="rb-v" data-r="Previsto">${v(m.prev)}</span><span class="rb-v" data-r="Pago">${v(m.pago)}</span><span class="rb-v" data-r="Comprometido">${v(m.comp)}</span><span class="rb-v${m.saldo < 0 ? ' neg' : ''}" data-r="Saldo"><b>${brl(m.saldo)}</b></span>${barra(u)}</summary>
    <div class="rb-c">${es.map(e => { const de = ds.filter(d => d.etapa === e.id), prev = e.q * e.v, pago = somaD(de, true), comp = somaD(de, false), saldo = prev - pago - comp;
        return `<details class="rb-i"><summary><span class="rb-in"><span class="mono">${e.id}</span> ${esc(e.nome)}</span><span class="rb-v" data-r="Previsto">${brl(prev)}</span><span class="rb-v" data-r="Pago">${v(pago)}</span><span class="rb-v" data-r="Comprometido">${v(comp)}</span><span class="rb-v${saldo < 0 ? ' neg' : ''}" data-r="Saldo">${brl(saldo)}</span>${barra(prev ? (pago + comp) / prev * 100 : 0)}</summary>
          <dl class="rb-x"><div><dt>Composição</dt><dd>${num(e.q)} × ${brl(e.v)} (${esc(e.un)}) · ${mesAno(e.ini)} a ${mesAno(e.fim)}</dd></div><div><dt>Previsto</dt><dd>${brl(prev)}</dd></div><div><dt>Pago</dt><dd>${brl(pago)}</dd></div><div><dt>Comprometido</dt><dd>${brl(comp)}</dd></div><div><dt>Saldo</dt><dd class="${saldo < 0 ? 'neg' : ''}"><b>${brl(saldo)}</b></dd></div><div><dt>Despesas nesta etapa</dt><dd>${de.length}</dd></div></dl></details>`; }).join('')}
     <div class="rb-d"><h3>Despesas lançadas nesta meta</h3>${ds.length ? `<div class="scroll" tabindex="0" role="region" aria-label="Tabela (role para o lado no celular)"><table><thead><tr><th>Data</th><th>Etapa</th><th>Descrição</th><th>Situação</th><th class="n">Valor</th></tr></thead><tbody>${ds.map(d => `<tr><td>${dt(d.data)}${exChip(d)}</td><td><span class="mono">${esc(d.etapa)}</span></td><td>${esc(d.descricao)}<div class="small">${esc(nomeRubrica(d.rubrica) || 'sem rubrica')}${d.favorecido ? ' · ' + esc(d.favorecido) : ''}</div></td><td><span class="chip ${d.status === 'Pago' ? 'ok' : 'f'}">${esc(d.status)}</span></td><td class="n">${brl(d.valor)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="small">Nenhuma despesa lançada ainda.</p>'}</div></div></details>`; };
    return `<div><div class="head"><div><h2>Por meta do TED</h2><p>O mesmo gasto, visto pelas metas do plano pactuado com o MDA. Toque na meta para ver as etapas e as despesas lançadas nela.</p></div><div class="acts"><button class="b" data-abrir-rub>Abrir todas</button></div></div>
   <div class="panel rb-t" style="margin-top:10px"><div class="rb-h" aria-hidden="true"><span>Meta</span><span>Previsto</span><span>Pago</span><span>Comprometido</span><span>Saldo</span><span>Execução</span></div>${F.map(m => adiar(linha(m))).join('')}
    <div class="rb-tot"><span>Total</span><span data-r="Previsto">${brl(R.soma(F, 'prev'))}</span><span data-r="Pago">${brl(R.soma(F, 'pago'))}</span><span data-r="Comprometido">${brl(R.soma(F, 'comp'))}</span><span data-r="Saldo"><b>${brl(R.soma(F, 'saldo'))}</b></span><span></span></div></div></div>`;
  }
  /* dica do gráfico: mês mais próximo do ponteiro, com os três valores */
  /* gráfico pelo teclado (14/10/2026): com o foco no gráfico, as setas passam de mês em mês e mostram a mesma dica do mouse */
  let mesTeclado = -1;
  function mostrarMes(g, i) {
    const dica = document.querySelector('[data-dica]'), cr = document.querySelector('[data-cr]'); if (!g || !ritmoAtual || !dica || !cr) return;
    const P = ritmoAtual.pontos, n = P.length; i = Math.max(0, Math.min(n - 1, i)); mesTeclado = i;
    const svg = g.querySelector('svg'), b = svg.getBoundingClientRect(), k = GR.w / b.width, p = P[i], cx = GR.l + (GR.w - GR.l - GR.r) * (i + 1) / n;
    cr.removeAttribute('hidden'); cr.setAttribute('x1', cx); cr.setAttribute('x2', cx);
    dica.innerHTML = `<b>${p.rotulo}</b><span><i class="lg prev"></i>Previsto <b>${brl(p.previsto)}</b></span>${p.executado == null ? '<span class="small">mês que ainda não chegou</span>' : `<span><i class="lg exec"></i>Pago <b>${brl(p.executado)}</b></span><span><i class="lg rec"></i>Recebido <b>${brl(p.recebido)}</b></span>`}`;
    dica.hidden = false; const gb = g.getBoundingClientRect(), esq = cx / k; dica.style.left = Math.max(0, Math.min(gb.width - dica.offsetWidth, esq > gb.width / 2 ? esq - dica.offsetWidth - 12 : esq + 12)) + 'px';
    const v = document.getElementById('rg-voz'); if (v) v.textContent = dica.textContent.replace(/(\d)(Previsto|Pago|Recebido)/g, '$1 · $2');
  }
  function teclaGrafico(ev) {
    const g = ev.target.closest && ev.target.closest('[data-rg]'); if (!g || !ritmoAtual) return;
    const n = ritmoAtual.pontos.length, atual = ritmoAtual.pontos.findIndex(p => p.atual), ini = mesTeclado >= 0 ? mesTeclado : (atual >= 0 ? atual : 0);
    const alvo = { ArrowRight: ini + 1, ArrowLeft: ini - 1, Home: 0, End: n - 1 }[ev.key]; if (alvo === undefined) return;
    ev.preventDefault(); mostrarMes(g, mesTeclado < 0 && (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') ? ini : alvo);
  }
  function aoMoverGrafico(ev) {
    const g = ev.target.closest && ev.target.closest('[data-rg]'); const dica = document.querySelector('[data-dica]'), cr = document.querySelector('[data-cr]');
    if (!g || !ritmoAtual) { if (dica && !(document.activeElement && document.activeElement.matches && document.activeElement.matches('[data-rg]'))) { dica.hidden = true; if (cr) cr.setAttribute('hidden', ''); } return; }
    const b = g.querySelector('svg').getBoundingClientRect(), n = ritmoAtual.pontos.length, px = (ev.clientX - b.left) * (GR.w / b.width);
    mostrarMes(g, Math.round((px - GR.l) / (GR.w - GR.l - GR.r) * n) - 1);
  }
  /* ---------- equipe: as três funções com bolsa no plano; as pessoas vêm das solicitações importadas da FUNCERN ---------- */
  const FUNCOES = [['coordenacao', 'i01', 'Coordenação do projeto', 'coordenação do projeto', 'Uma pessoa · responde pelo projeto e assina as solicitações à fundação · cadastrada pela coordenação', 1],
    ['auxiliar', 'i02', 'Auxiliar administrativo', 'auxiliar administrativo', 'Uma pessoa · apoia a gestão: solicitações, documentos e prestação de contas', 1],
    ['discente', 'i03', 'Bolsistas discentes', 'bolsista discente', 'Estudantes que dão apoio técnico às unidades de produção e ao acompanhamento em campo', 0],
    ['formador', 'i16', 'Formadores', 'formador(a)', 'Especialistas em bioinsumos e agroecologia que planejam e ministram as capacitações da Meta 3 · bolsa por atividade realizada', 0]];
  const IC_GENTE = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.500"/><path d="M2.500 20a6.500 6.500 0 0 1 13 0"/><circle cx="17.500" cy="9" r="2.500"/><path d="M17 14.200a5 5 0 0 1 4.500 5"/></svg>';
  function equipe() {
    if (coord() && !real && convites === undefined) { convites = []; carregarConvites(); }
    const FI = R.finItens(db), hj = iso(hoje()), pode = R.podeGravar(eu, 'membros');
    const semTabela = api.semMembros ? `<div class="banner"><span>O cadastro da equipe ainda não foi ligado no banco: a coordenação precisa rodar o script <b>07_equipe.sql</b> no Supabase. Até lá, nada do que for cadastrado aqui é gravado.</span></div>` : '';
    const bloco = f => { const x = FI.find(i => i.id === f[1]), E = R.equipePorFuncao(db, f[0], hj), ms = x ? x.meses : [], bolsas = {};
      (x ? x.despesas : []).forEach(d => { const k = R.nrm(d.favorecido); if (!k) return; const g = bolsas[k] = bolsas[k] || { nome: d.favorecido, n: 0, pago: 0, comp: 0 }; g.n++; if (d.status === 'Pago') g.pago += +d.valor || 0; else g.comp += +d.valor || 0; });
      const bolsaDe = m => { const g = bolsas[R.nrm(m.nome)]; if (g) g.visto = 1; return g ? `<span>${g.n} solicitação(ões) de bolsa</span><span>pago ${brl(g.pago)}</span>${g.comp ? `<span>comprometido ${brl(g.comp)}</span>` : ''}` : '<span>nenhuma bolsa na planilha ainda</span>'; };
      const cartao = m => `<li class="pc">${avatar(m)}<div class="pc-t"><div class="pc-n"><b>${esc(m.nome)}</b><span class="chip ok vg-c">${m.fim ? 'Sai em ' + dt(m.fim) : 'Na equipe'}</span>${cuidaHab() ? seloHab(m) : ''}${exChip(m)}</div><div class="pc-d">${[m.email, m.telefone, m.municipio, m.vinculo].filter(Boolean).map(t => `<span>${esc(t)}</span>`).join('')}<span>desde ${dt(m.inicio)}</span></div><div class="pc-d eq-bo">${bolsaDe(m)}</div></div>
        <button class="b eq-vd" data-fichamembro="${esc(m.id)}">Ver detalhes</button></li>`;
      const ult = E.antigos[0], vaga = `<div class="vg"><div><span class="chip f vg-c">Vaga aberta</span><p>${ult ? `A pessoa anterior, ${esc(ult.nome)}, foi desligada em ${dt(ult.fim)}.` : 'Ninguém foi cadastrado nesta função ainda.'}</p></div>${pode ? `<button class="vg-b" data-cadeq="${f[0]}">${IC_GENTE}<span>Cadastrar ${f[3]}</span></button>` : ''}</div>`;
      const corpo = (E.ativos.length ? `<ul class="eq-l">${E.ativos.map(cartao).join('')}</ul>` : '') + (!E.ativos.length ? vaga : !f[5] && pode ? `<div class="acts"><button class="vg-b" data-cadeq="${f[0]}">${IC_GENTE}<span>Cadastrar ${f[3]}</span></button></div>` : '');
      const cvs = pode && Array.isArray(convites) ? convites.filter(c => c.funcao === f[0]) : [];
      const cvHtml = cvs.length ? `<ul class="cv">${cvs.map(c => c.status === 'preenchido'
        ? `<li class="cv-i ok"><div><b>${esc((c.dados && c.dados.nome) || 'Cadastro recebido')}</b><small>preencheu pelo link em ${dt(String(c.preenchido_em).slice(0, 10))} · falta você conferir e aprovar</small></div><span class="ac"><button class="b p" data-cvaprovar="${esc(c.id)}">Conferir e aprovar</button><button class="b" data-cvfim="${esc(c.id)}:recusado">Recusar</button></span></li>`
        : `<li class="cv-i"><div><b>Link de cadastro enviado</b><small>gerado em ${dt(String(c.criado_em).slice(0, 10))} · vale até ${dt(String(c.expira_em).slice(0, 10))} · aguardando a pessoa preencher</small></div><span class="ac"><button class="b" data-cvfim="${esc(c.id)}:cancelado">Cancelar o link</button></span></li>`).join('')}</ul>` : '';
      const fora_ = Object.values(bolsas).filter(g => !g.visto && !E.antigos.some(m => R.nrm(m.nome) === R.nrm(g.nome)));
      return `<section class="eq" aria-label="${f[2]}"><div class="eq-cab"><div><h2>${f[2]}</h2><p>${f[4]}</p></div>${f[5] ? '' : `<span class="chip">${E.ativos.length} na equipe</span>`}</div>
       ${cvHtml}${corpo}
       ${fora_.length ? `<p class="note eq-n">Na planilha da FUNCERN há bolsa desta função para ${fora_.map(g => esc(g.nome)).join(', ')}, que não ${fora_.length === 1 ? 'está' : 'estão'} no cadastro. Cadastre com o mesmo nome para ligar a pessoa às bolsas.</p>` : ''}
       ${E.antigos.length ? `<details class="dx-como eq-h"><summary>Quem já passou por esta função (${E.antigos.length})</summary><ul class="eq-a">${E.antigos.map(m => `<li><span><b>${esc(m.nome)}</b>${exChip(m)}<small>${m.vinculo ? esc(m.vinculo) + ' · ' : ''}${dt(m.inicio)} a ${dt(m.fim)}${m.motivo ? ' · ' + esc(m.motivo) : ''}</small></span>${pode ? `<span class="ac"><button class="ab" title="Editar" data-edit="membros:${esc(m.id)}">${IC_LAPIS}<span class="so">Editar</span></button>${R.podeExcluir(eu, 'membros', m) ? `<button class="ab d" title="Excluir" data-del="membros:${esc(m.id)}">${IC_LIXO}<span class="so">Excluir</span></button>` : ''}</span>` : ''}</li>`).join('')}</ul></details>` : ''}</section>`; };
    const habil = () => { if (!cuidaHab()) return ''; const at = (db.membros || []).filter(m => !m.fim || m.fim >= hj);
      const semArlo = at.filter(m => m.arlo !== 'Sim'), semTermo = at.filter(m => m.arlo === 'Sim' && !m.termo_em), ok_ = at.filter(m => m.arlo === 'Sim' && m.termo_em);
      const col = (t, L, cls) => `<div class="hab-c"><h3>${t} <span class="chip ${cls}">${L.length}</span></h3>${L.length ? `<ul>${L.map(m => `<li><button class="lk" data-fichamembro="${esc(m.id)}">${esc(m.nome)}</button><small>${esc(NOME_FUNCAO[m.funcao] || '')}</small></li>`).join('')}</ul>` : '<p class="small">Ninguém.</p>'}</div>`;
      return `<section class="panel mts hab" aria-label="Habilitação na FUNCERN"><div class="mts-cab"><h2>Habilitação na FUNCERN</h2><p>Para receber bolsa, cada pessoa precisa de cadastro no Arlo e do termo de compromisso assinado. ${auxiliar() ? 'Abra a pessoa para ver os dados e marcar o que já foi feito.' : 'O auxiliar administrativo acompanha e marca; a coordenação também pode.'}</p></div>
       <div class="hab-g">${col('Falta cadastrar no Arlo', semArlo, semArlo.length ? 'f' : 'ok')}${col('No Arlo, falta o termo', semTermo, semTermo.length ? 'f' : 'ok')}${col('Habilitados', ok_, 'ok')}</div></section>`; };
    const IC_MAIS = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="10" cy="8" r="3.500"/><path d="M3.500 20a6.500 6.500 0 0 1 11-4.700M18 14v6M15 17h6"/></svg>';
    const ext = () => { if (!coord()) return ''; const P = db.pessoas.filter(p => p.perfil === 'Acompanhamento'), org = {}; P.forEach(p => { const o = (p.orgao || '').trim() || 'Órgão não informado'; (org[o] = org[o] || []).push(p); }); if (!P.length) org['SEAB/MDA'] = [];
      const sit = p => p.ativo === false ? ['', 'Desativado'] : demo() || p.auth_id ? ['ok', 'Com acesso'] : ['f', 'Aguardando primeiro acesso'];
      return `<section class="eq" aria-label="Acompanhamento externo"><div class="eq-cab"><div><h2>Acompanhamento externo (SEAB/MDA)</h2><p>Área própria, só de leitura · não vê nome nem dado pessoal de agricultoras e agricultores, nem a equipe · só a coordenação cadastra</p></div></div>
       <div class="panel ae"><div class="ae-h" aria-hidden="true"><span>Órgão</span><span>Quem acompanha</span><span></span></div>${Object.keys(org).sort().map(o => { const L = org[o], at = L.filter(p => p.ativo !== false).length;
        return `<div class="ae-l"><div class="ae-o"><span class="mt-n" aria-hidden="true">${esc((o.replace(/[^A-Za-zÀ-ú/ ]/g, '').split(/[\s/]+/).filter(Boolean).slice(-1)[0] || '?').slice(0, 4).toUpperCase())}</span><div><b>${esc(o)}</b><small>${at} pessoa${at === 1 ? '' : 's'} com acesso</small></div></div>
         <div class="ae-p">${L.length ? L.map(p => { const st = sit(p); return `<button class="ae-c${p.ativo === false ? ' off' : ''}" data-edit="pessoas:${esc(p.id)}" title="Abrir o cadastro de ${esc(p.nome)}"><span class="pc-av" aria-hidden="true">${esc(iniciais(p.nome))}</span><span class="ae-t"><b>${esc(p.nome)}</b><span class="chip ${st[0]} vg-c">${st[1]}</span></span></button>`; }).join('') : '<p class="small">Ninguém cadastrado ainda.</p>'}</div>
         <div class="ae-a"><button class="ae-b" data-new="pessoas" data-pre="${esc(o === 'Órgão não informado' ? '-' : o)}">${IC_MAIS}<span>Adicionar pessoa</span></button><button class="ae-b" data-vercomo="${esc(o === 'Órgão não informado' ? '' : o)}">${IC_OLHO.split('<svg class="o2"')[0].replace('class="o1" ', '').replace('width="22" height="22"', 'width="20" height="20"')}<span>Ver como ${esc(o === 'Órgão não informado' ? 'quem acompanha' : o)} vê</span></button></div></div>`; }).join('')}</div></section>`; };
    /* resumo no alto (14/10/2026, no formato do Mulheres & Quintais): vagas do plano preenchidas e atividades de formador pagas */
    const nAt = f => R.equipePorFuncao(db, f, hj).ativos.length, VAGAS = { coordenacao: 1, auxiliar: 1, discente: 3 };
    const abertas = Object.keys(VAGAS).reduce((t, f) => t + Math.max(0, VAGAS[f] - nAt(f)), 0);
    /* formadores: o plano v4 paga por atividade (80 × R$ 100, Meta 3); as atividades pagas saem das bolsas do item i16 lançadas como pagas */
    const atF = Math.floor(db.despesas.filter(d => d.item === 'i16' && d.status === 'Pago').reduce((t, d) => t + (+d.valor || 0), 0) / 100);
    const resumo = `<section class="dx-topo panel eq-top" aria-label="Resumo da equipe"><div class="dx-kpis">
      ${kpi(1, nAt('coordenacao') * 100, nAt('coordenacao'), 'de 1', 'coordenação do projeto cadastrada', '', undefined)}
      ${kpi(2, Math.min(1, nAt('auxiliar')) * 100, nAt('auxiliar'), 'de 1', 'auxiliar administrativo cadastrado', '', undefined)}
      ${kpi(3, Math.min(3, nAt('discente')) / 3 * 100, nAt('discente'), 'de 3', 'bolsistas discentes na equipe', '', undefined)}
      ${kpi(4, Math.min(80, atF) / 80 * 100, atF, 'de 80', 'atividades de formação pagas', nAt('formador') ? nAt('formador') + (nAt('formador') === 1 ? ' formador(a) cadastrado(a)' : ' formadores cadastrados') : 'nenhum formador cadastrado ainda', undefined, 'concluído')}</div></section>`;
    return `<div class="head"><div><h2>Coordenação e bolsistas</h2><p>Quem ocupa cada função com bolsa no plano de trabalho. O cadastro é da coordenação; os valores de bolsa vêm da planilha da FUNCERN, importada na aba Financeiro.</p>${abertas ? `<span class="eq-pill">${abertas} ${abertas === 1 ? 'vaga aberta' : 'vagas abertas'} no plano de trabalho</span>` : '<span class="eq-pill ok">Todas as vagas do plano preenchidas</span>'}</div></div>${semTabela}${resumo}${habil()}${FUNCOES.map(bloco).join('')}${ext()}`;
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
  <div class="dx-kpis fin">${kpi(1, rec / D.TOTAL * 100, mil(rec), 'de ' + mil(D.TOTAL) + ' mil', 'recebido', prox ? `próxima parcela de ${brl(prox.valor)} prevista para ${mesAno(prox.previsao)}` : 'todas as parcelas recebidas', undefined, 'do total')}
   ${kpi(2, pago / rec * 100, mil(pago), 'de ' + mil(rec) + ' mil', 'pago', `${db.despesas.filter(d => d.status === 'Pago').length} despesa(s) paga(s)`, undefined, 'do recebido')}
   ${kpi(3, comp / rec * 100, mil(comp), 'de ' + mil(rec) + ' mil', 'comprometido', `${db.despesas.filter(d => d.status !== 'Pago').length} despesa(s) solicitada(s) ou em compras`, undefined, 'do recebido')}
   ${kpi(4, (rec - usado) / rec * 100, mil(rec - usado), 'de ' + mil(rec) + ' mil', 'disponível do recebido', rec - usado < 0 ? 'o lançado passa do que já foi recebido' : 'recebido menos pago e comprometido', undefined, 'do recebido')}</div>
 </section>
 <div class="two fin-2">${graficoRitmo()}${usoRubricas(FR)}</div>
 ${tabelaRubricas(FR)}
 ${tabelaMetas(F)}
 ${tabela('despesas')}`;
  }
  const PLURAL = { 'capacitação': 'capacitações', 'contrato com a fundação': 'contratos com a fundação', 'dia de campo': 'dias de campo', 'kit distribuído': 'kits distribuídos', 'material didático': 'materiais didáticos',
    'produto de comunicação': 'produtos de comunicação', 'relatório de avaliação': 'relatórios de avaliação', 'relatório técnico': 'relatórios técnicos', 'relatório': 'relatórios', 'unidade em funcionamento': 'unidades em funcionamento', 'unidade produtiva': 'unidades produtivas' };
  const quantos = (q, un) => +q === 1 ? un : PLURAL[un] || un;
  /* ícones das seções do relatório (mesmo traço dos indicadores) */
  const IC_REL = { fis: IC5.atual, bio: '<path d="M9 3h6M10 3v6L5 18a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3"/><path d="M7.5 14h9"/>', ati: IC5.gente, lot: IC5.caixa, dis: IC5.usou, mon: IC5.pino,
    ent: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>', fin: IC5.base, rub: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>', des: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>' };
  function relatorio() {
    if (!rel) rel = { de: D.G0, ate: iso(hoje()) };
    const no = s => !!s && s >= rel.de && s <= rel.ate, F = R.fin(db, rel.ate), FR = R.finRubrica(db, rel.ate);
    const fimRel = rel.ate < iso(hoje()) ? rel.ate : iso(hoje());   // metas físicas: só o realizado até a data final (o que está marcado para depois de hoje é planejado)
    const ev = db.eventos.filter(e => no(e.data)).sort((a, b) => a.data > b.data ? 1 : -1), lo = db.lotes.filter(l => no(l.inicio)), di = db.distribuicoes.filter(d => no(d.data)), vi = db.visitas.filter(v => no(v.data)), en = db.entregas.filter(g => no(g.data)), de = db.despesas.filter(d => no(d.data));
    /* tabela do relatório: na tela mostra as 10 primeiras linhas e um botão para ver todas; impressa, sai inteira */
    const LIM = 10, tl = (h, rows, todas) => rows.length ? `<div class="scroll" tabindex="0" role="region" aria-label="Tabela (role para o lado no celular)"><table><thead><tr>${h.map(x => `<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.map((r, i) => `<tr${i >= LIM && !todas ? ' class="rx"' : ''}>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${rows.length > LIM && !todas ? `<div class="acts noprint"><button type="button" class="b s" data-relmais="${rows.length}" aria-expanded="false">Ver todas as ${rows.length} linhas</button></div>` : ''}` : '<p class="small">Sem registros no período.</p>';
    const sec = (ic, titulo, sub, corpo) => `<section class="panel mts rs"><div class="mts-cab rs-cab"><span class="i5-ic" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${IC_REL[ic]}</svg></span><div><h3>${titulo}</h3>${sub ? `<p>${sub}</p>` : ''}</div></div>${corpo}</section>`;
    const ben = new Set(di.map(d => d.agricultor)).size, tp = ev.reduce((s, e) => s + (+e.part || 0), 0), tm = ev.reduce((s, e) => s + (+e.mulheres || 0), 0);
    const fis = D.ETAPAS.map(e => ({ e, f: R.feito(db, e, fimRel) })), pfis = fis.reduce((t, x) => t + x.e.q * x.e.v * Math.min(1, x.f / x.e.q), 0) / D.TOTAL * 100;
    const gasto = de.reduce((t, d) => t + (+d.valor || 0), 0), pagas = de.filter(d => d.status === 'Pago').length, aplic = vi.filter(v => v.usou === 'Sim').length;
    const atalho = [['mes', 'Mês passado'], ['tri', 'Últimos 3 meses'], ['ano', 'Este ano'], ['tudo', 'Desde o início']];
    return `<div class="head noprint"><div><h2>Relatório de execução</h2><p>Escolha o período. As metas físicas e o financeiro saem acumulados até a data final; as atividades, só as do período. Na tela, as tabelas longas mostram as 10 primeiras linhas; impresso ou em PDF, o relatório sai completo.</p></div></div>
 <section class="panel rel-f noprint" aria-label="Período do relatório"><div class="rel-at" role="group" aria-label="Períodos prontos">${atalho.map(([k, t]) => `<button type="button" class="b s" data-relp="${k}">${t}</button>`).join('')}</div>
  <div class="ctrl"><div class="fld"><label for="rde">De</label><input type="date" id="rde" value="${rel.de}"></div><div class="fld"><label for="rate">Até</label><input type="date" id="rate" value="${rel.ate}"></div><button class="b p" data-rel>Gerar</button><button class="b" data-print>Imprimir ou salvar em PDF</button></div></section>
 <div class="dx-topo panel noprint" role="region" aria-label="Resumo do período">
  <div class="dx-exec"><span class="dx-rot">Execução física até ${dt(fimRel)}</span><div class="dx-exec-num"><b>${pct(pfis)}%</b></div>
   <span class="medidor" role="img" aria-label="${pct(pfis)}% da execução física"><i style="width:${Math.min(100, pfis)}%"></i></span>
   <p class="dx-exec-sub"><span>Período: <b>${dt(rel.de)} a ${dt(rel.ate)}</b></span></p></div>
  <div class="dx-kpis fin">${kpi(1, tp ? tm / tp * 100 : 0, ev.length, 'no período', 'atividades', tp ? `${num(tp)} participações` : 'sem participantes registrados', undefined, 'mulheres')}
   ${kpi(2, ben / 30 * 100, di.length, 'entregas', 'de bioinsumo', `a ${ben} unidade(s) produtiva(s)`, undefined, 'da meta de 30 unidades')}
   ${kpi(3, vi.length ? aplic / vi.length * 100 : 0, vi.length, 'visitas', 'de monitoramento', `em ${aplic} o bioinsumo foi aplicado`, undefined, 'com aplicação')}
   ${kpi(4, gasto / D.TOTAL * 100, gasto >= 1e4 ? num(Math.round(gasto / 1000)) : num(Math.round(gasto)), gasto >= 1e4 ? 'mil reais' : 'reais', 'em despesas no período', `${de.length} despesa(s), ${pagas} paga(s)`, undefined, 'do TED')}</div></div>
 <div class="rel">
 <div class="panel rel-doc"><p class="rel-sup">Relatório de execução · ${dt(rel.de)} a ${dt(rel.ate)}</p><h2>${esc(D.NOME_COMPLETO)}</h2>
 <p class="small">${esc(D.IDENT)}<br>Gerado em ${hoje().toLocaleDateString('pt-BR')} por ${esc(eu ? eu.nome : '')}</p></div>
 ${sec('fis', '1. Execução física acumulada', `Até ${dt(fimRel)} · o que está marcado para depois é planejado e não conta`, tl(['Etapa', 'Descrição', 'Previsto', 'Realizado', '%'], fis.map(({ e, f }) => [`<span class="mono">${e.id}</span>`, e.nome, `${num(e.q)} ${quantos(e.q, e.un)}`, f, num(Math.min(100, f / e.q * 100)) + '%']), true))}
 ${sec('bio', '2. Unidades de produção de bioinsumos', `${db.unidades.filter(u => u.funcionando).length} em funcionamento de ${db.unidades.length} cadastrada(s)`, tl(['Unidade', 'Modelo', 'Implantação', 'Parceiro institucional'], db.unidades.map(u => [esc(u.nome) + (u.conta === 'Sim' ? '' : ' (apoio)'), esc(u.modelo), `${nCheck(u)} de ${D.CHECK.length} passos${u.funcionando ? ' · em funcionamento' : ''}`, esc(u.parceiro) || 'a definir']), true))}
 ${sec('ati', '3. Capacitações, dias de campo e reuniões no período', ev.length ? `${ev.length} atividade(s)` : '', tl(['Data', 'Tipo', 'Tema', 'Local', 'Participantes'], ev.map(e => [dt(e.data), esc(e.tipo), esc(e.tema), esc(e.lugar) + (e.municipio ? ' · ' + esc(e.municipio) : ''), R.vazio(e.part) ? '—' : `${num(e.part)} (${num(e.mulheres)} mulheres)`])) + (tp ? `<p>Total de ${num(tp)} participações, ${num(tm / tp * 100)}% de mulheres.</p>` : ''))}
 ${sec('lot', '4. Produção de bioinsumos no período', lo.length ? `${lo.length} lote(s) iniciado(s)` : '', tl(['Lote', 'Tipo', 'Unidade', 'Início', 'Situação', 'Produzido'], lo.map(l => [`<span class="mono">${esc(l.codigo)}</span>`, esc(l.tipo), esc((by('unidades', l.unidade) || {}).nome), dt(l.inicio), esc(l.status), `${num(l.qtd)} ${esc(l.med)}`])))}
 ${sec('dis', '5. Distribuição no período', '', tl(['Data', 'Lote', 'Unidade produtiva', 'Cultura', 'Quantidade'], di.map(d => { const l = by('lotes', d.lote) || {}; return [dt(d.data), `<span class="mono">${esc(l.codigo)}</span>`, esc((by('agricultores', d.agricultor) || {}).nome), esc(d.cultura), `${num(d.qtd)} ${esc(l.med || '')}`]; })) + (di.length ? `<p>${di.length} entrega(s) a ${ben} unidade(s) produtiva(s).</p>` : ''))}
 ${sec('mon', '6. Monitoramento do uso no período', '', tl(['Data', 'Unidade produtiva', 'Aplicou?', 'Vigor', 'Observações'], vi.map(v => [dt(v.data), esc((by('agricultores', v.agricultor) || {}).nome), esc(v.usou), v.vigor ? esc(v.vigor) + '/5' : '—', esc(v.obs) + (v.problemas ? ' Dificuldade: ' + esc(v.problemas) : '')])) + (vi.length ? `<p>${vi.length} visita(s); em ${aplic} o bioinsumo havia sido aplicado.</p>` : ''))}
 ${sec('ent', '7. Entregas e evidências no período', en.length ? `${en.length} entrega(s) do plano` : '', tl(['Etapa', 'Entrega', 'Data'], en.map(g => [`<span class="mono">${esc(g.etapa)}</span>`, esc(g.titulo), dt(g.data)])))}
 ${sec('fin', `8. Execução financeira acumulada até ${dt(rel.ate)}, por meta`, '', `<div class="scroll" tabindex="0" role="region" aria-label="Tabela (role para o lado no celular)">${finTabela(F, 'Meta')}</div>`)}
 ${sec('rub', `9. Execução financeira acumulada até ${dt(rel.ate)}, por rubrica`, 'Valores lançados no sistema. O registro oficial é o da FUNCERN.', `<div class="scroll" tabindex="0" role="region" aria-label="Tabela (role para o lado no celular)">${finTabela(FR, 'Rubrica')}</div>`)}
 ${sec('des', '10. Despesas do período', de.length ? `${de.length} despesa(s) · ${brl(gasto)}` : '', tl(['Data', 'Etapa', 'Rubrica', 'Descrição', 'Situação', 'Valor'], de.map(d => [dt(d.data), `<span class="mono">${esc(d.etapa)}</span>`, esc(nomeRubrica(d.rubrica)), esc(d.descricao), esc(d.status), brl(d.valor)])))}
 </div>`;
  }
  /* ---------- aba Histórico (só a coordenação): últimos acessos e alterações ---------- */
  let acessos;   // undefined = ainda não carregou; null = falta o script 09; lista = carregado
  function telaHistorico() {
    if (!coord()) return '<div class="panel empty">O histórico é só da coordenação.</div>';
    const ha = d => { const n = Math.floor((hoje() - new Date(d)) / 864e5); return n <= 0 ? 'hoje' : n === 1 ? 'ontem' : `há ${n} dias`; };
    const quadroA = acessos === undefined ? '<div class="panel box"><div class="acts"><button class="b" data-acessos>Carregar os últimos acessos</button></div></div>'
      : acessos === null ? '<div class="banner"><span>Para ver os últimos acessos, a coordenação precisa rodar o script <b>09_ultimos_acessos.sql</b> no Supabase.</span></div>'
      : (() => { const at = acessos.filter(a => a.ativo), sem = at.filter(a => a.ultimo && hoje() - new Date(a.ultimo) < 7 * 864e5).length;
        return `<p class="hs-r"><b>${sem}</b> de ${at.length} pessoa(s) com acesso ativo entraram nos últimos 7 dias.</p>
         <div class="panel scroll" tabindex="0" role="region" aria-label="Tabela (role para o lado no celular)"><table><thead><tr><th>Pessoa</th><th>Perfil</th><th>Último acesso</th><th>Situação</th></tr></thead><tbody>${acessos.map(a => `<tr><td><b>${esc(a.nome)}</b></td><td>${esc(a.perfil)}${a.orgao ? `<div class="small">${esc(a.orgao)}</div>` : ''}</td><td>${a.ultimo ? `${new Date(a.ultimo).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}<div class="small">${ha(a.ultimo)}</div>` : '—'}</td><td>${!a.ativo ? '<span class="chip">Desativado</span>' : !a.ultimo ? '<span class="chip f">Nunca entrou</span>' : hoje() - new Date(a.ultimo) > 30 * 864e5 ? '<span class="chip f">Sem entrar há mais de 30 dias</span>' : '<span class="chip ok">Em uso</span>'}</td></tr>`).join('')}</tbody></table></div>`; })();
    return `<div class="head"><div><h2>Histórico</h2><p>Quem entrou no sistema e tudo o que foi incluído, alterado ou excluído, com quem fez e quando. Serve para a prestação de contas. Só a coordenação vê.</p></div></div>
     <div><div class="head"><div><h2>Últimos acessos</h2><p>Quando cada pessoa cadastrada entrou pela última vez. O sistema mostra só o acesso mais recente de cada uma, não a lista de todos.</p></div>${Array.isArray(acessos) ? '<div class="acts"><button class="b" data-acessos>Atualizar</button></div>' : ''}</div>${quadroA}</div>
     <div><div class="head"><div><h2>Alterações</h2><p>Inclusões, alterações e exclusões em qualquer cadastro, e quem baixou planilhas ou a cópia dos dados. Carrega de 200 em 200.</p></div>${hist ? '<div class="acts"><button class="b" data-hist>Atualizar</button></div>' : ''}</div><div class="panel box" style="margin-top:10px">${historico()}</div></div>`;
  }
  const NOME_ACAO = { INSERT: 'incluiu', UPDATE: 'alterou', DELETE: 'excluiu' };
  /* histórico em linha do tempo (14/10/2026, trazido do Mulheres & Quintais): frases por dia, com hora; o detalhe campo a campo
     ("antes → depois") continua a um toque; filtro por cadastro e busca; registros mais antigos de 200 em 200; downloads (script 21) */
  let histFim = false, histFiltro = '', histBusca = '';
  const OCULTOS_HIST = /^(id|atualizado_em|criado_em|criado_por|auth_id|ex|codigo_seq)$/;
  function rotuloCampo(t, k) { const M = MOD[t]; const c = M && M.campos.find(x => x[0] === k); if (c) return c[1]; const ch = D.CHECK.find(x => x[0] === k); return ch ? ch[1] : k.replace(/_/g, ' '); }
  function valorHist(t, k, v) {
    if (v == null || v === '') return '—'; if (v === true) return 'Sim'; if (v === false) return 'Não';
    const M = MOD[t], c = M && M.campos.find(x => x[0] === k);
    if (c && c[2] === 'ref' && typeof v === 'string') { const r = by(c[4], v); return r ? rotulo[c[4]](r) : 'registro excluído'; }
    if (k === 'rubrica') return nomeRubrica(v) || v; if (/^\d{4}-\d{2}-\d{2}$/.test(String(v))) return dt(v);
    return typeof v === 'object' ? JSON.stringify(v) : String(v);
  }
  function fraseHist(h) {
    const quem = h.por ? (db.pessoas.find(p => p.id === h.por) || {}).nome || 'Pessoa removida' : 'Direto no banco';
    if (h.tabela === 'planilhas') { const x = h.depois || {}, q = +x.qtd || 0;
      return x.tipo === 'json' ? `<b>${esc(quem)}</b> baixou a cópia completa dos dados (${num(q)} registros).` : `<b>${esc(quem)}</b> baixou a planilha de <b>${esc((MOD[x.tipo] || {}).nome || x.tipo)}</b> (${num(q)} linha${q === 1 ? '' : 's'}).`; }
    const o = h.depois || h.antes || {}, M = MOD[h.tabela] || {}, oque = (M.um || M.nome || h.tabela).toLowerCase();
    const nome = o.nome || o.codigo || o.titulo || o.tema || o.descricao || (o.data ? dt(o.data) : '');
    const verbo = { INSERT: 'incluiu', UPDATE: 'alterou', DELETE: 'excluiu' }[h.acao] || esc(String(h.acao).toLowerCase());
    return `<b>${esc(quem)}</b> ${verbo} ${esc(oque)}${nome ? `: <b>${esc(nome)}</b>` : ''}.`;
  }
  function detalheHist(h) {
    if (h.acao !== 'UPDATE' || !h.antes || !h.depois) return '';
    const L = Object.keys(h.depois).filter(k => !OCULTOS_HIST.test(k) && JSON.stringify(h.antes[k]) !== JSON.stringify(h.depois[k]));
    return L.length ? `<details class="hs-d"><summary>O que mudou (${L.length})</summary><dl>${L.map(k => `<dt>${esc(rotuloCampo(h.tabela, k))}</dt><dd><s>${esc(valorHist(h.tabela, k, h.antes[k]))}</s> → <b>${esc(valorHist(h.tabela, k, h.depois[k]))}</b></dd>`).join('')}</dl></details>` : '';
  }
  function historico() {
    if (!hist) return '<div class="acts"><button class="b" data-hist>Carregar o histórico</button></div>';
    if (!hist.length) return '<div class="small">Nenhuma alteração registrada ainda. Aqui aparece, com data, hora e autor, tudo o que é incluído, alterado ou excluído, e quem baixou planilhas.</div>';
    const tabs = [...new Set(hist.map(h => h.tabela))].sort((a, b) => ((MOD[a] || {}).nome || a).localeCompare((MOD[b] || {}).nome || b));
    const nomeT = t => t === 'planilhas' ? 'Planilhas baixadas' : (MOD[t] || {}).nome || t;
    const vis = hist.filter(h => (!histFiltro || h.tabela === histFiltro) && (!histBusca || R.nrm(fraseHist(h).replace(/<[^>]+>/g, '')).includes(R.nrm(histBusca))));
    const dia = t => { const d = new Date(t), k = x => x.toLocaleDateString('pt-BR'), h = new Date(), o = new Date(h); o.setDate(h.getDate() - 1); return k(d) === k(h) ? 'Hoje' : k(d) === k(o) ? 'Ontem' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }); };
    let ult = ''; const itens = vis.map(h => { const d = dia(h.em), cab = d !== ult ? `<li class="hs-dia">${esc(d)}</li>` : ''; ult = d;
      return cab + `<li class="hs-i"><time datetime="${esc(h.em)}">${new Date(h.em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</time><div>${fraseHist(h)}${detalheHist(h)}</div></li>`; }).join('');
    const semana = hist.filter(h => Date.now() - new Date(h.em) < 7 * 864e5).length;
    return `<div class="hs-f"><label class="fld"><span>Cadastro</span><select id="hfiltro" data-histfiltro><option value="">Todos</option>${tabs.map(t => `<option value="${esc(t)}" ${t === histFiltro ? 'selected' : ''}>${esc(nomeT(t))}</option>`).join('')}</select></label>
      <label class="fld"><span>Procurar</span><input type="search" id="hbusca" data-histbusca value="${esc(histBusca)}" placeholder="nome, código, pessoa…"></label></div>
     <p class="small">${num(hist.length)} registro(s) carregado(s) · ${num(semana)} nos últimos 7 dias${histFiltro || histBusca ? ` · mostrando ${num(vis.length)}` : ''}</p>
     ${vis.length ? `<ul class="hs-l">${itens}</ul>` : '<p class="small">Nada com esse filtro.</p>'}
     ${histFim ? '<p class="small">Esse é o começo do histórico.</p>' : `<div class="acts"><button class="b" data-histmais>Carregar registros mais antigos</button></div>`}`;
  }
  function dados() {
    return `<div class="head"><div><h2>Dados</h2><p>${demo() ? 'Modo demonstração: os registros ficam guardados somente neste navegador.' : 'Os registros ficam no banco do projeto (Supabase) e aparecem em qualquer aparelho de quem tem acesso.'}</p></div></div>
 <div class="panel box"><h2 class="bx">Planilhas para a prestação de contas (.csv)</h2><div class="acts">${Object.keys(MOD).filter(m => m !== 'pessoas').map(m => `<button class="b s" data-exp="${m}">${MOD[m].nome}</button>`).join('')}</div>
 <div class="small">Abre no Excel e no LibreOffice. A planilha de unidades produtivas tem dados pessoais: guarde em pasta do projeto, não envie por aplicativo de mensagem.</div></div>
 <div class="panel box"><h2 class="bx">Cópia de segurança</h2><div class="acts"><button class="b" data-exp="json">Baixar cópia completa (.json)</button></div><div id="msg" class="small"></div></div>
 <div class="panel box"><h2 class="bx">Minha senha e meus dados</h2><p class="small">Toque no seu nome, no alto da tela, para abrir <b>Meus dados</b>: lá você troca a senha e atualiza celular e município.</p><div class="acts"><button class="b" data-meus>Abrir Meus dados</button></div></div>
 ${coord() ? tabela('pessoas') + (demo() ? `<div class="panel box"><h2 class="bx">Recomeçar a demonstração</h2><div class="acts"><button class="b d" data-zerar>Apagar tudo e voltar aos exemplos</button></div></div>` : '') : ''}`;
  }
  /* cada tela tem um h1 com sobretítulo. Nas abas que já começam com um cabeçalho, o primeiro título vira o h1;
     no painel (que começa pelos indicadores) o cabeçalho é criado aqui. */
  const SOBRE = { historico: 'Histórico', painel: 'Visão geral', equipe: 'Equipe do projeto', unidades: 'Biofábricas', lotes: 'Produção', agricultores: 'Quem o projeto atende', distribuicoes: 'Rastreabilidade', visitas: 'Monitoramento', eventos: 'Formação', entregas: 'Plano de trabalho', financeiro: 'Recursos do TED', relatorios: 'Prestação de contas', dados: 'Administração' };
  function tituloDaTela(v) {
    const cab = [...v.children].find(c => c.classList && c.classList.contains('head')), eye = `<span class="eyebrow">${SOBRE[tab] || ''}</span>`;
    if (cab && tab !== 'painel') { const h2 = cab.querySelector('h2'), d = h2 && h2.parentElement; if (!h2) return; const h1 = document.createElement('h1'); h1.textContent = h2.textContent; h2.replaceWith(h1); d.classList.add('pg'); h1.insertAdjacentHTML('beforebegin', eye); return; }
    const novo = document.createElement('div'); novo.className = 'head'; novo.innerHTML = `<div class="pg">${eye}<h1>Execução do projeto</h1><p>${fora() ? 'Andamento do projeto em tempo real, como a equipe registrou.' : 'O que já foi feito, o que pede atenção e o que vem pela frente.'}</p></div>`;
    const ref = [...v.children].find(c => c.classList && (c.classList.contains('dx-topo') || c.classList.contains('banner') || c.classList.contains('fe'))); v.insertBefore(novo, ref || v.firstChild);   // o título vem antes do "Falta enviar"
  }
  /* texto dentro de gráfico e mapa: o desenho encolhe ou cresce com a tela; --k devolve a letra ao tamanho da escala */
  /* depois de desenhar: se o gráfico ganhou menos (ou mais) espaço do que o palpite, redesenha só ele com a medida certa */
  function ajustarGrafico() {
    const rg = document.querySelector('[data-rg]'); if (!rg) return;
    const w = rg.clientWidth; if (!w) return;
    const certo = w < 560 ? GR_ESTREITO : GR_LARGO; if (certo === GR) return;
    const painel = rg.closest('.fin-g'); if (painel) painel.outerHTML = graficoRitmo(certo);
  }
  /* blocos só de leitura também recebem o Tab (14/10/2026): quem navega pelo teclado lê cada painel, cartão e aviso.
     Só ganham parada os que não têm nada clicável dentro (os outros já são alcançados pelo que têm dentro). */
  const FOCAVEL = 'button:not([disabled]),a[href],input:not([type=hidden]),select,textarea,summary,[tabindex]:not([tabindex="-1"])';
  function paradasDeLeitura() {
    document.querySelectorAll('#view section, #view .panel, #view .pc, #view .vg, #view .mt-gi').forEach(el => {
      if (el.hasAttribute('tabindex') || el.matches(FOCAVEL) || el.querySelector(FOCAVEL)) return;
      el.setAttribute('tabindex', '0');
      if (!el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')) { const h = el.querySelector('h2,h3,b,.vg-c'); if (h) { if (!h.id) h.id = 'pl-' + Math.random().toString(36).slice(2, 9); el.setAttribute('aria-labelledby', h.id); } }
      if (!el.getAttribute('role') && !/^(SECTION|LI)$/.test(el.tagName)) el.setAttribute('role', 'group');
    });
    // cada tabela com nome próprio (antes, todas se chamavam "Tabela", e o leitor de tela não distinguia uma da outra)
    document.querySelectorAll('#view .scroll[role=region]').forEach(el => {
      const c = el.closest('details, section, .panel'), h = c && (c.querySelector(':scope > summary') || c.querySelector('h2,h3,h4'));
      const t = h && h.textContent.replace(/\s+/g, ' ').trim(); if (t) el.setAttribute('aria-label', `Tabela: ${t.slice(0, 80)} (role para o lado no celular)`);
    });
  }
  function escalaDesenhos() {
    ajustarGrafico();
    document.querySelectorAll('svg[data-vb]').forEach(sv => { const w = sv.getBoundingClientRect().width; if (w > 0) sv.style.setProperty('--k', (+sv.dataset.vb / w).toFixed(4)); });
    // sigla da biofábrica perto da borda direita: com a letra no tamanho da tela (maior no modo sol) ela sairia do desenho; passa para a esquerda do frasco
    document.querySelectorAll('svg[data-vb] text[data-esq]').forEach(t => { try {
      if (!t.dataset.dir) t.dataset.dir = t.getAttribute('x');
      t.setAttribute('x', t.dataset.dir); t.removeAttribute('text-anchor');
      const bb = t.getBBox(); if (bb.width && bb.x + bb.width > +t.ownerSVGElement.dataset.vb - 2) { t.setAttribute('x', t.dataset.esq); t.setAttribute('text-anchor', 'end'); }
    } catch (e) { /* getBBox falha com o desenho escondido: fica como está */ } });
  }
  /* foco que sobrevive ao redesenho (14/10/2026): trocar de aba, salvar ou fechar uma janela redesenha a tela; o foco volta
     ao mesmo botão (a mesma aba, o mesmo "Editar") e o próximo Tab continua dali, em vez de recomeçar do topo da página */
  const ATR_FOCO = ['data-tab', 'data-new', 'data-edit', 'data-fichamembro', 'data-del', 'data-presenca', 'data-fotos', 'data-rub', 'data-mapa', 'data-exp', 'data-meus', 'data-ajuda', 'data-aparencia', 'data-mais', 'data-abrir-rub', 'data-hist', 'data-acessos'];
  function chaveFoco(el) {
    if (!el || el === document.body || !el.closest || el.closest('dialog')) return null;
    if (el.id && el.id !== 'view') return '#' + CSS.escape(el.id);
    const a = ATR_FOCO.find(x => el.hasAttribute(x)); if (!a) return null;
    return (el.closest('#tabs') ? '#tabs ' : el.closest('header') ? 'header ' : '#view ') + `[${a}="${CSS.escape(el.getAttribute(a))}"]`;
  }
  function devolverFoco(chave) {
    if (!chave) return; const atual = document.activeElement;
    if (atual && atual !== document.body && atual.isConnected && !atual.matches('#view')) return;   // alguém já pôs o foco num lugar certo
    const el = document.querySelector(chave); if (el) el.focus({ preventScroll: true });
  }
  // o foco pelo Tab não fica embaixo do menu fixo (WCAG 2.4.11): a rolagem automática para o foco deixa a altura do menu livre
  function margemDoMenu() { const nv = $('nav'); if (nv && nv.offsetHeight) document.documentElement.style.scrollPaddingTop = (nv.offsetHeight + 12) + 'px'; }
  let gatilho = null;   // botão que abriu a janela: o foco volta para ele quando a janela fecha
  function render() {
    const chave = chaveFoco(document.activeElement);
    R.novoDesenho(); TARDE = new Map();
    if (!eu || !db) return;
    nav(); const v = $('#view');
    v.innerHTML = (real ? `<div class="banner sim"><span><b>Pré-visualização.</b> É assim que ${esc(eu.orgao || 'SEAB/MDA')} vê o sistema: só leitura, sem nomes de agricultores e sem a equipe. Você continua com a sua conta.</span><button class="b p" data-sairver>Voltar à minha visão</button></div>` : '') + avisoFila() + (tab === 'painel' ? painel() : tab === 'dados' ? dados() : tab === 'financeiro' ? financeiro() : tab === 'equipe' ? equipe() : tab === 'historico' ? telaHistorico() : tab === 'relatorios' ? relatorio() : tab === 'unidades' ? tabela('unidades') + tabela('itens') : tab === 'agricultores' ? telaAgricultores() : tabela(tab));
    tituloDaTela(v); escalaDesenhos(); paradasDeLeitura(); margemDoMenu(); carregarFotosEq(); if (chave) requestAnimationFrame(() => devolverFoco(chave));   // depois de desenhar: focar antes forçava refazer a página inteira na hora
    if (!abas().some(t => t[0] === tab)) tab = 'painel';
    $('#quem-av').textContent = iniciais(demo() ? eu.perfil : eu.nome); atualizarCabecalhoFoto(); carregarFotosEq();
    $('#quem-nome').textContent = demo() ? 'Demonstração' : eu.nome;
    $('#quem-papel').textContent = (R.NOME_PERFIL[eu.perfil] || eu.perfil) + (eu.orgao ? ' · ' + eu.orgao : '');
    $('#net').hidden = navigator.onLine !== false && !(api.offline);
  }

  /* ---------- formulário ---------- */
  /* corpo de um formulário: os campos vão em grupos; cada marcador de seção (tipo 'sec') fecha um grupo e abre outro com título.
     "quais" (opcional) limita aos campos indicados: é assim que o link de cadastro mostra só o que a pessoa pode preencher. */
  /* número digitado no padrão brasileiro: "120,50", "1.234,56" e "1.500" (mil e quinhentos). Texto que não é número vira NaN e a validação recusa. */
  const numCampo = x => { let t = String(x == null ? '' : x).trim().replace(/\s|R\$/g, ''); if (t === '') return '';
    if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.'); else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
    return /^\d+(\.\d+)?$/.test(t) ? +t : NaN; };
  const AUTO = { nome: 'autocomplete="name"', email: 'autocomplete="email"', telefone: 'autocomplete="tel"', cep: 'autocomplete="postal-code" inputmode="numeric"', logradouro: 'autocomplete="address-line1"',
    complemento: 'autocomplete="address-line2"', municipio: 'autocomplete="address-level2"', nascimento: 'autocomplete="bday"', pis: 'inputmode="numeric" autocomplete="off"', siape: 'inputmode="numeric" autocomplete="off"', numero: 'inputmode="numeric"' };
  const IC_PINO = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.800 12 21 12 21z"/><circle cx="12" cy="9.500" r="2.500"/></svg>';
  const textoLocal = r => `${(+r.lat).toFixed(5).replace('.', ',')}; ${(+r.lng).toFixed(5).replace('.', ',')}${r.precisao != null && r.precisao !== '' ? ` · precisão de ${num(+r.precisao)} m` : ''}`;
  /* GPS do celular: alta precisão, até 25 s; funciona sem internet. Precisão pior que 100 m é avisada (dentro de casa, céu fechado) */
  function pegarLocal(b) {
    const t = $('#f_geo_t'); if (!navigator.geolocation) { t.textContent = 'Este navegador não informa a localização.'; return; }
    b.disabled = true; t.textContent = 'Procurando o sinal do GPS… fique a céu aberto, se puder.';
    const dono = ed, aqui = () => ed === dono && b.isConnected;   // a resposta do GPS demora: se o formulário fechou ou mudou, ela é descartada (auditoria 14/10)
    navigator.geolocation.getCurrentPosition(p => {
      if (!aqui()) return; const t = $('#f_geo_t');
      b.disabled = false; const r = { lat: Math.round(p.coords.latitude * 1e6) / 1e6, lng: Math.round(p.coords.longitude * 1e6) / 1e6, precisao: Math.round(p.coords.accuracy) };
      $('#f_lat').value = r.lat; $('#f_lng').value = r.lng; $('#f_precisao').value = r.precisao; b.querySelector('span').textContent = 'Pegar de novo';
      t.textContent = textoLocal(r) + (r.precisao > 100 ? ' · precisão baixa: tente de novo fora de casa' : '');
      if (!$('[data-geolimpar]')) t.insertAdjacentHTML('afterend', '<button type="button" class="lk geo-x" data-geolimpar>Apagar</button>');
    }, e => { if (!aqui()) return; const t = $('#f_geo_t'); b.disabled = false; t.textContent = e.code === 1 ? 'O celular não deixou pegar a localização. Permita a localização para este site nas configurações do navegador e tente de novo.' : e.code === 3 ? 'O GPS demorou demais. Vá para um lugar aberto e tente de novo.' : 'Não foi possível pegar a localização agora. Tente de novo.'; },
    { enableHighAccuracy: true, timeout: 25000, maximumAge: 0 });
  }
  const OBR = ' <span class="obr" aria-hidden="true">*</span>';   // campo obrigatório (o navegador também anuncia pelo required)
  function corpoForm(M, r, id, quais) {
    const campo = ([k, l, t, req, o, filtro]) => {
      const v = r[k] == null ? '' : r[k], idc = 'f_' + k, Rq = req ? ' required' : '', L = l + (req ? OBR : '');
      if (t === 'checks') return `<div class="fld w"><fieldset><legend>${l}</legend>${D.CHECK.map(c => `<label><input type="checkbox" id="f_${c[0]}" ${r[c[0]] ? 'checked' : ''}>${c[1]}</label>`).join('')}</fieldset></div>`;
      if (t === 'check') return `<div class="fld"><span aria-hidden="true"></span><fieldset><label><input type="checkbox" id="${idc}" ${v ? 'checked' : ''}>${l}</label></fieldset></div>`;
      if (t === 'select') { const ops = typeof o === 'function' ? o() : o; return `<div class="fld"><label for="${idc}">${L}</label><select id="${idc}"${Rq}>${ops.map(x => `<option value="${esc(x[0])}" ${String(v) === String(x[0]) ? 'selected' : ''}>${esc(x[1]) || '—'}</option>`).join('')}</select></div>`; }
      if (t === 'ref') { const lista = db[o].filter(x => !filtro || filtro(x) || x.id === v); return `<div class="fld"><label for="${idc}">${L}</label><select id="${idc}"${Rq}><option value="">Escolha</option>${lista.map(x => `<option value="${esc(x.id)}" ${v === x.id ? 'selected' : ''}>${esc(rotulo[o](x))}</option>`).join('')}</select></div>`; }
      if (t === 'html') return `<div class="fld w fm-html">${o}</div>`;
      if (t === 'textarea') return `<div class="fld w"><label for="${idc}">${l}</label><textarea id="${idc}">${esc(v)}</textarea></div>`;
      if (t === 'geo') { const tem = r.lat != null && r.lat !== ''; return `<div class="fld w"><span class="geo-r" id="f_local_r">${l}</span><div class="geo" role="group" aria-labelledby="f_local_r"><input type="hidden" id="f_lat" value="${tem ? esc(r.lat) : ''}"><input type="hidden" id="f_lng" value="${tem ? esc(r.lng) : ''}"><input type="hidden" id="f_precisao" value="${tem && r.precisao != null ? esc(r.precisao) : ''}">
        <button type="button" class="b geo-b" data-geo>${IC_PINO}<span>${tem ? 'Pegar de novo' : 'Pegar a localização'}</span></button><span class="geo-t" id="f_geo_t" aria-live="polite">${tem ? textoLocal(r) : 'Ainda não registrada.'}</span>${tem ? '<button type="button" class="lk geo-x" data-geolimpar>Apagar</button>' : ''}</div></div>`; }
      return `<div class="fld${['nome', 'tema', 'titulo', 'descricao', 'email'].includes(k) ? ' w' : ''}"><label for="${idc}">${L}</label><input id="${idc}" type="${t === 'number' ? 'text' : t}" ${t === 'number' ? 'inputmode="decimal" autocomplete="off"' : (M === MOD.membros || M.membrosPub) && AUTO[k] ? AUTO[k] : ''} value="${esc(v === '' && t === 'date' && req && !id ? iso(hoje()) : t === 'number' && v !== '' ? String(v).replace('.', ',') : v)}"${Rq}></div>`;
    };
    let corpo = '', aberto = false; const dica = k => M.dicas && M.dicas[k] ? `<span class="fm-dica">${esc(M.dicas[k])}</span>` : '';
    /* cada seção é um grupo; o grupo pode aparecer só para algumas funções (so), sumir quando a pessoa já tem Arlo (semArlo),
       abrir com o questionário (socio) ou existir só na edição (edicao). Quem mostra e esconde é ajustarFormMembro. */
    let pend = null, pular = false;
    const atr = op => (op.so ? ` data-so="${op.so.join(' ')}"` : '') + (op.semArlo ? ' data-semarlo' : '') + (op.socio ? ' data-socio' : '');
    M.campos.forEach(c => {
      if (c[2] === 'sec') { pend = c; pular = !!(c[3] && c[3].edicao && !id); return; }
      if (pular || (quais && !quais.includes(c[0]) && c[2] !== 'html')) return;
      if (pend) { corpo += (aberto ? '</div></div>' : '') + `<div class="fm-g"${atr(pend[3] || {})}>${pend[1] ? `<h3 class="fm-sec">${pend[1]}</h3>` : ''}<div class="fields">`; aberto = true; pend = null; }
      if (!aberto) { corpo += '<div class="fm-g"><div class="fields">'; aberto = true; }
      corpo += campo(c).replace(/<\/div>$/, dica(c[0]) + '</div>');
    });
    if (aberto) corpo += '</div></div>';
    return corpo;
  }
  /* formulário da equipe: o que aparece depende da função, da resposta sobre o Arlo e do questionário */
  function ajustarFormMembro(root) {
    if (!root || !root.querySelector('.fm-g')) return;
    const fun = (root.querySelector('#f_funcao') || {}).value || (pub && pub.funcao) || '', arlo = (root.querySelector('#f_arlo') || {}).value, soc = !!(root.querySelector('#f_socio') || {}).checked;
    root.querySelectorAll('.fm-g[data-so]').forEach(g => { g.hidden = !g.dataset.so.split(' ').includes(fun); });
    root.querySelectorAll('.fm-g[data-semarlo]').forEach(g => { g.hidden = arlo === 'Sim'; });
    root.querySelectorAll('.fm-g[data-socio]').forEach(g => { g.hidden = !soc; });
    const faz = root.querySelector('#fm_faz'), F = FUNCOES.find(x => x[0] === fun);
    if (faz) { faz.hidden = !F; faz.innerHTML = F ? `<span>${esc(NOME_FUNCAO[fun])}</span><p>${esc(F[4])}</p>` : ''; }
  }
  /* CEP: com internet, preenche rua, bairro, município e estado (só o que estiver vazio). Vai para o ViaCEP apenas o CEP. */
  let cepUlt = '';
  async function buscarCep(root) {
    const el = root.querySelector('#f_cep'), c = R.soDigitos(el && el.value); if (c.length !== 8 || c === cepUlt) return; cepUlt = c;
    try {
      const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 5000);
      const r = await fetch(`https://viacep.com.br/ws/${c}/json/`, { signal: ctl.signal, referrerPolicy: 'no-referrer', credentials: 'omit' }); clearTimeout(t);
      const j = await r.json(); if (!j || j.erro) return;
      const por = (id, v) => { const x = root.querySelector('#' + id); if (x && !x.value && v) x.value = v; };
      por('f_logradouro', j.logradouro); por('f_bairro', j.bairro); por('f_complemento', j.complemento);
      por('f_municipio', j.localidade && j.uf ? `${j.localidade}/${j.uf}` : ''); por('f_uf', j.uf);
    } catch (e) { /* sem internet ou ViaCEP fora do ar: a pessoa digita */ }
  }
  /* ---------- link de cadastro da equipe ---------- */
  let convites, preMembro = null;   // convites: undefined = ainda não carregou; null = o banco não tem (falta o script 11); lista = carregado
  const NOME_FUNCAO = { coordenacao: 'Coordenação do projeto', auxiliar: 'Auxiliar administrativo', discente: 'Bolsista discente', formador: 'Formador(a)' };
  async function carregarConvites() { try { convites = await api.convites(); } catch (e) { convites = []; toast(e.message); } if (tab === 'equipe') render(); }
  function abrirEscolha(funcao) {
    ed = null; $('#frm').className = 'fm';
    $('#frm').innerHTML = `<div class="fm-cab"><div><span class="fm-eye">Cadastrar</span><h2>${NOME_FUNCAO[funcao]}</h2></div><button type="button" class="fm-x" data-fechar aria-label="Fechar">×</button></div>
     <div class="fm-corpo"><p class="aj-p">Como você quer fazer este cadastro?</p>
      <button type="button" class="esc" data-gerarlink="${funcao}"><span class="esc-r">Recomendado</span><b>Gerar link de cadastro</b><span>A pessoa preenche os próprios dados pelo celular e aceita o termo de uso dos dados. Você confere e aprova. Menos digitação e menos erro.</span></button>
      <button type="button" class="esc" data-digitar="${funcao}"><b>Digitar os dados agora</b><span>Você digita os dados. Use quando já tem tudo em mãos ou a pessoa não tem internet.</span></button></div>
     <div class="fm-pe"><div class="err" id="ferr" role="alert"></div><div class="frow"><button type="button" class="b" data-fechar>Cancelar</button></div></div>`;
    if (!$('#dlg').open) $('#dlg').showModal();
  }
  /* a janela já estava aberta e o conteúdo mudou: o foco vai ao primeiro campo (ou ao ×), não se perde na página */
  const focarDlg = () => { const f = $('#frm').querySelector('input:not([type=hidden]):not([disabled]),select,textarea,[autofocus]') || $('#frm .fm-x'); if (f) f.focus(); };
  function mostrarLink(funcao, token) {
    const link = location.origin + location.pathname + '#c=' + token, msg = `Olá! Para entrar na equipe do projeto Saberes que Cultivam (${NOME_FUNCAO[funcao]}), preencha o seu cadastro neste link. Ele vale 7 dias e serve uma vez só: ${link}`;
    $('#frm').innerHTML = `<div class="fm-cab"><div><span class="fm-eye">Link de cadastro</span><h2>${NOME_FUNCAO[funcao]}</h2></div><button type="button" class="fm-x" data-fechar aria-label="Fechar">×</button></div>
     <div class="fm-corpo"><div class="fm-oque"><span>Link gerado</span><p>Mande para a pessoa. Vale 7 dias e serve uma vez só. Depois que ela preencher, o cadastro aparece na aba Equipe para você conferir e aprovar.</p></div>
      <div class="fields"><div class="fld w"><label for="lk_txt">Link</label><input id="lk_txt" readonly value="${esc(link)}"><span class="fm-dica">Copie agora: por segurança o sistema não guarda o link e não consegue mostrá-lo de novo. Se perder, cancele este e gere outro.</span></div></div></div>
     <div class="fm-pe"><div class="err" id="ferr" role="status"></div><div class="frow"><button type="button" class="b" data-fechar>Fechar</button><a class="b" href="https://wa.me/?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener noreferrer">Mandar pelo WhatsApp</a><button type="button" class="b p" data-copiarlink>Copiar o link</button></div></div>`;
    focarDlg();
  }
  /* página do link: sem login. A pessoa só fala com duas funções do banco (ver se o link vale; enviar uma vez). */
  let pub = null;
  async function telaConvite(token) {
    $('#carregando').hidden = true; $('#auth').hidden = true; $('#app').hidden = true; const P = $('#pub'); P.hidden = false;
    const cab = '<div class="pub-m"><img src="assets/icon-192.png" alt="" width="48" height="48"><div><b>Saberes que Cultivam</b><span>Bioinsumos, agroecologia e agricultura familiar</span></div></div>';
    const aviso = (t, p) => { P.innerHTML = `<div class="pub">${cab}<div class="panel pub-c"><h1>${t}</h1><p>${p}</p></div></div>`; };
    if (!/^[0-9a-f]{64}$/.test(token)) return aviso('Este link está incompleto', 'Parte do endereço se perdeu ao copiar ou encaminhar. Abra o link inteiro, do jeito que a coordenação enviou, ou peça outro.');
    let funcao = null; try { funcao = await api.conviteVer(token); } catch (e) { return aviso('Não foi possível abrir o cadastro', 'Confira a sua internet e abra o link de novo.'); }
    if (!funcao) return aviso('Este link não vale mais', 'Ele já foi usado ou passou dos 7 dias. Peça outro à coordenação do projeto.');
    pub = { token, funcao }; try { history.replaceState(null, '', location.pathname); } catch (x) {}   // o código sai do endereço e do histórico enquanto a pessoa preenche (fica só na memória)
    const M = MOD.membros, rotLgpd = 'Autorizo o projeto Saberes que Cultivam (IFRN, MDA e FUNCERN) a usar estes dados só para a gestão do projeto e o pagamento da bolsa, conforme a Lei nº 13.709/2018 (LGPD).';
    const Mp = Object.assign({}, M, { membrosPub: true, campos: M.campos.map(c => c[0] === 'lgpd' ? ['lgpd', rotLgpd, 'check'] : c[0] === 'socio' ? ['socio', 'Quero responder. Só a coordenação do projeto vê estas respostas.', 'check'] : c[0] === 'arlo' ? ['arlo', 'Você já tem cadastro no sistema Arlo, da FUNCERN?', 'select', 0, c[4]] : c),
      dicas: Object.assign({}, M.dicas, { nome: '', vinculo: 'Exemplo: IFRN Campus Apodi, ou o seu curso.', cpf: 'Só a coordenação do projeto vê.', socio: '' }) });
    P.innerHTML = `<div class="pub">${cab}<form id="fpub" class="fm panel pub-c" novalidate><div class="fm-cab"><div><span class="fm-eye">Cadastro na equipe</span><h1>${NOME_FUNCAO[funcao]}</h1></div></div>
      <div class="fm-corpo"><ol class="pub-passos" aria-label="Etapas do cadastro"><li class="pp-at" aria-current="step"><b>1</b>Seus dados</li><li><b>2</b>A coordenação confere</li><li><b>3</b>Você cria a senha</li></ol>
       <div class="fm-faz" id="fm_faz" hidden></div>
       <div class="fm-oque"><span>Como funciona</span><p>Preencha e envie. A coordenação do projeto confere e confirma o seu cadastro; depois você recebe o aviso para criar a senha com este mesmo e-mail. O link serve uma vez só. O que você digitar fica guardado neste aparelho por 24 horas (sem CPF, documentos, endereço e questionário), caso a internet caia.</p></div>${corpoForm(Mp, rascunhoLer(funcao), null, R.CAMPOS_CONVITE)}</div>
      <div class="fm-pe"><div class="err" id="perr" role="alert"></div><div class="frow"><button class="b p" id="penviar">Enviar o meu cadastro</button></div></div></form></div>`;
    if (SQC.mascaras) SQC.mascaras.preparar($('#fpub')); ajustarFormMembro($('#fpub'));
  }
  /* rascunho do link: 24 h neste aparelho, sem os dados reservados (CPF, documentos, endereço, questionário) */
  const RASC = 'sqc-rascunho-cadastro', RASC_FORA = R.CAMPOS_RESERVADOS.concat(['lgpd']);
  function rascunhoLer(funcao) { try { const x = JSON.parse(localStorage.getItem(RASC) || 'null'); if (!x || x.funcao !== funcao || Date.now() - x.em > 864e5) { localStorage.removeItem(RASC); return {}; } return x.dados || {}; } catch (e) { return {}; } }
  function rascunhoGuardar() {
    if (!pub || !$('#fpub')) return; const d = {};
    R.CAMPOS_CONVITE.filter(k => !RASC_FORA.includes(k)).forEach(k => { const el = $('#f_' + k); if (el && el.type !== 'checkbox' && el.value) d[k] = el.value; });
    try { localStorage.setItem(RASC, JSON.stringify({ funcao: pub.funcao, em: Date.now(), dados: d })); } catch (e) { /* sem armazenamento: segue sem rascunho */ }
  }
  async function aoEnviarConvite(ev) {
    ev.preventDefault(); if (!pub) return; const r = {}, er = t => { $('#perr').textContent = t; };
    for (const [k, l, t] of MOD.membros.campos) { if (t === 'sec' || !R.CAMPOS_CONVITE.includes(k)) continue; const el = $('#f_' + k); if (!el) continue;
      r[k] = t === 'check' ? el.checked : t === 'number' ? numCampo(el.value) : el.value.trim(); }
    R.normalizarMembro(r); const msg = R.validarConvite(r, pub.funcao);
    if (msg) { const alvo = [['nome', 'nome'], ['CPF', 'cpf'], ['PIS', 'pis'], ['CEP', 'cep'], ['nascimento', 'nascimento'], ['e-mail', 'email'], ['telefone', 'telefone'], ['renda', 'renda'], ['Pessoas', 'pessoas_casa'], ['concorda', 'lgpd']].find(x => msg.includes(x[0])) || (/celular/.test(msg) ? [0, 'telefone'] : /Perfil no campo/.test(msg) ? [0, 'agricultor'] : null);
      const el = alvo && $('#f_' + alvo[1]); if (el) el.focus(); return er(msg); }
    Object.keys(r).forEach(k => { if (r[k] === '' || r[k] == null) delete r[k]; });
    const b = $('#penviar'); if (b.disabled) return; b.disabled = true; b.textContent = 'Enviando…'; er('');
    try { await api.conviteEnviar(pub.token, r); } catch (e) { b.disabled = false; b.textContent = 'Enviar o meu cadastro'; return er(e.message || 'Não foi possível enviar. Tente de novo.'); }
    pub = null; try { localStorage.removeItem(RASC); history.replaceState(null, '', location.pathname); } catch (x) {}
    $('#pub').querySelector('.pub-c').outerHTML = '<div class="panel pub-c"><h1>Cadastro enviado</h1><p>Obrigado. A coordenação do projeto vai conferir os seus dados e confirmar o cadastro. Pode fechar esta página.</p></div>'; scrollTo(0, 0);
  }

  /* ---------- lista de presença de uma atividade (script 13) ---------- */
  let prUlt = {};   // comunidade e município do último nome digitado: na mesma atividade quase sempre se repetem
  function abrirPresenca(evId, msg) {
    const e = by('eventos', evId); if (!e) return;
    ed = null; prEv = evId; const L = (db.presencas || []).filter(x => x.evento === evId).sort((a, b) => R.nrm(a.nome) < R.nrm(b.nome) ? -1 : 1), pode = R.podeGravar(eu, 'presencas'), mul = L.filter(x => x.mulher).length;
    const difere = L.length && (+e.part !== L.length || +e.mulheres !== mul);
    $('#frm').className = 'fm';
    $('#frm').innerHTML = `<div class="fm-cab"><div><span class="fm-eye">Lista de presença</span><h2>${esc(e.tema)}</h2></div><button type="button" class="fm-x" data-fechar aria-label="Fechar">×</button></div>
     <div class="fm-corpo"><p class="fm-sub">${esc(e.tipo)} · ${dt(e.data)}${e.lugar ? ' · ' + esc(e.lugar) : ''}</p>
      <div class="fm-oque"><span>Como fazer</span><p>Imprima a lista em branco, passe na atividade para as pessoas assinarem e digite aqui os nomes depois. A folha assinada é a evidência: fotografe e anexe em Fotos. Só a equipe do projeto vê os nomes; o SEAB/MDA vê só o total de participantes.</p></div>
      <p class="pr-t"><b>${L.length}</b> pessoa${L.length === 1 ? '' : 's'} na lista${L.length ? `, das quais ${mul} mulher${mul === 1 ? '' : 'es'}` : ''}.${difere ? ` Na atividade estão registrados ${R.vazio(e.part) ? 'sem número de' : num(e.part)} participantes${R.vazio(e.mulheres) ? '' : ` (${num(e.mulheres)} mulheres)`}.` : ''}</p>
      ${L.length ? `<ol class="pr-l">${L.map(x => `<li><span><b>${esc(x.nome)}</b>${x.mulher ? ' <span class="chip">mulher</span>' : ''}${x._pendente ? ' <span class="chip f">aguardando envio</span>' : ''}<small>${esc([x.comunidade, x.municipio].filter(Boolean).join(' · '))}</small></span>${R.podeExcluir(eu, 'presencas', x) && !x._pendente ? `<button type="button" class="ab d" title="Tirar da lista" data-prdel="${esc(x.id)}">${IC_LIXO}<span class="so">Tirar ${esc(x.nome)} da lista</span></button>` : ''}</li>`).join('')}</ol>` : ''}
      ${pode ? `<h3 class="fm-sec">Adicionar à lista</h3><div class="fields"><div class="fld w"><label for="pr_nome">Nome</label><input id="pr_nome" autocomplete="off"></div>
        <div class="fld"><label for="pr_com">Comunidade</label><input id="pr_com" value="${esc(prUlt.comunidade || '')}"></div><div class="fld"><label for="pr_mun">Município</label><input id="pr_mun" value="${esc(prUlt.municipio || e.municipio || '')}"></div>
        <div class="fld"><span aria-hidden="true"></span><fieldset><label><input type="checkbox" id="pr_mul">Mulher</label></fieldset></div></div>
        <div class="acts"><button type="button" class="b p" data-pradd="${esc(evId)}">Adicionar</button></div>` : ''}</div>
     <div class="fm-pe"><div class="err" id="ferr" role="alert"></div><div class="ok-msg" id="fok" role="status">${esc(msg || '')}</div><div class="frow"><button type="button" class="b" data-imprimirlista="${esc(evId)}">Imprimir lista em branco</button>${pode && difere ? `<button type="button" class="b" data-prcontar="${esc(evId)}">Usar o total da lista na atividade</button>` : ''}<button type="button" class="b" data-fechar>Fechar</button></div></div>`;
    if ($('#dlg').open) ($('#pr_nome') || $('#frm .fm-x')).focus(); else $('#dlg').showModal();
  }
  let prEv = null;
  let prOcupado = false;
  async function adicionarPresenca(evId) {
    if (prOcupado) return; prOcupado = true;
    try { await adicionarPresenca_(evId); } finally { prOcupado = false; }
  }
  async function adicionarPresenca_(evId) {
    const v = id => ($('#' + id) || {}).value || '', r = { id: SQC.novoId(), evento: evId, nome: v('pr_nome').trim(), comunidade: v('pr_com').trim(), municipio: v('pr_mun').trim(), mulher: !!($('#pr_mul') && $('#pr_mul').checked) };
    const msg = R.validar(db, 'presencas', r, null); if (msg) { $('#ferr').textContent = msg; $('#pr_nome').focus(); return; }
    if ((db.presencas || []).some(x => x.evento === evId && R.nrm(x.nome) === R.nrm(r.nome))) { $('#ferr').textContent = `${r.nome} já está nesta lista.`; $('#pr_nome').select(); return; }
    const res = await gravarRegistro('presencas', r, null);
    if (!res.ok) { $('#ferr').textContent = res.msg; return; }
    prUlt = { comunidade: r.comunidade, municipio: r.municipio };
    abrirPresenca(evId, res.fila ? `${r.nome}: guardado neste aparelho, envia quando o sinal voltar.` : `${r.nome} entrou na lista.`); $('#pr_nome').focus();
  }

  /* ---------- fotos de uma atividade ou visita (script 13) ---------- */
  const urlsFoto = {};   // id da foto → endereço da imagem já baixada nesta página
  function abrirFotos(t, id, msg) {
    const r = by(t, id); if (!r) return;
    ed = null; const F = (db.fotos || []).filter(f => f.tabela === t && f.registro === id).sort((a, b) => (a.criado_em || '') < (b.criado_em || '') ? -1 : 1), pode = R.podeGravar(eu, 'fotos');
    const titulo = t === 'eventos' ? esc(r.tema) : esc((by('agricultores', r.agricultor) || { nome: 'Visita' }).nome), dia = r.data;
    $('#frm').className = 'fm';
    $('#frm').innerHTML = `<div class="fm-cab"><div><span class="fm-eye">Fotos ${t === 'eventos' ? 'da atividade' : 'da visita'}</span><h2>${titulo}</h2></div><button type="button" class="fm-x" data-fechar aria-label="Fechar">×</button></div>
     <div class="fm-corpo"><p class="fm-sub">${t === 'eventos' ? esc(r.tipo) + ' · ' : ''}${dt(dia)}</p>
      <div class="fm-oque"><span>Regra da foto</span><p>Vale foto tirada no dia ${dt(dia)}. A data vem de dentro do arquivo, gravada pela câmera. Foto sem essa data (encaminhada pelo WhatsApp, captura de tela) entra marcada como “data não confirmada”. Só a equipe do projeto vê as fotos.</p></div>
      ${F.length ? `<ul class="ft-g">${F.map(f => `<li><div class="ft-i" data-ftimg="${esc(f.id)}" role="img" aria-label="${esc(f.legenda || 'Foto')}"><span class="small">carregando…</span></div>
        <div class="ft-d"><span>${f.tirada_em ? `<span class="chip ok">tirada em ${dt(f.tirada_em)}</span>` : '<span class="chip f">data não confirmada</span>'}</span>${f.legenda ? `<small>${esc(f.legenda)}</small>` : ''}
        ${R.podeExcluir(eu, 'fotos', f) ? `<button type="button" class="ab d" title="Excluir foto" data-fotodel="${esc(f.id)}">${IC_LIXO}<span class="so">Excluir foto</span></button>` : ''}</div></li>`).join('')}</ul>` : '<p class="small">Nenhuma foto ainda.</p>'}
      ${pode ? `<h3 class="fm-sec">Anexar foto</h3><div class="fields"><div class="fld w"><label for="ft_leg">Legenda (opcional)</label><input id="ft_leg" maxlength="300" placeholder="Ex.: lista de presença assinada; aplicação do biofertilizante"></div></div>
        <div class="acts"><button type="button" class="b p" data-fotocam="${t}:${esc(id)}">Tirar foto agora</button><label class="b imp-b">Escolher foto<input type="file" id="ft_arq" data-alvo="${t}:${esc(id)}" accept="image/jpeg,image/png,image/webp,image/heic" class="imp-f"></label></div>` : ''}</div>
     <div class="fm-pe"><div class="err" id="ferr" role="alert"></div><div class="ok-msg" id="fok" role="status">${esc(msg || '')}</div><div class="frow"><button type="button" class="b" data-fechar>Fechar</button></div></div>`;
    if ($('#dlg').open) $('#frm .fm-x').focus(); else $('#dlg').showModal();
    F.forEach(async f => { const el = document.querySelector(`[data-ftimg="${CSS.escape(f.id)}"]`); if (!el) return;
      try { if (!urlsFoto[f.id]) urlsFoto[f.id] = URL.createObjectURL(await api.arquivoFoto(f)); el.innerHTML = `<img src="${urlsFoto[f.id]}" alt="${esc(f.legenda || 'Foto')}" loading="lazy">`; }
      catch (e) { el.innerHTML = `<span class="small">${esc(e.semRede ? 'Sem internet: a foto aparece quando o sinal voltar.' : e.message)}</span>`; } });
  }
  async function anexarFoto(alvo, arquivo, daCamera) {
    const [t, id] = alvo.split(':'), r = by(t, id); if (!r || !arquivo) return;
    const er = m => { const e = $('#ferr'), o = $('#fok'); if (e) e.textContent = m; if (o) o.textContent = ''; };
    const andamento = m => { const e = $('#ferr'), o = $('#fok'); if (o) o.textContent = m; if (e) e.textContent = ''; };
    if (!demo() && navigator.onLine === false) return er('Foto precisa de internet para subir. Guarde a foto no celular e anexe quando o sinal voltar: a data dela continua valendo.');
    andamento('Conferindo a data da foto…');
    const m = daCamera ? { dia: SQC.fotodia.hoje(), hora: new Date().getHours() } : await SQC.fotodia.lerMomentoExif(arquivo);
    const erro = SQC.fotodia.conferir(m && m.dia, r.data, m && m.hora); if (erro) return er(erro);
    let blob; try { andamento('Preparando a foto…'); blob = await SQC.fotodia.reduzir(arquivo); } catch (e) { return er(e.message); }
    andamento('Enviando…');
    try { const f = await api.enviarFoto(t, id, blob, m && m.dia, (($('#ft_leg') || {}).value || '').trim()); if (!eu || !db) return;   // saiu da conta durante o envio
      db.fotos = (db.fotos || []).concat([f]); urlsFoto[f.id] = URL.createObjectURL(blob); if (api.guardarCopia) api.guardarCopia(db); render();
      if ($('#dlg').open && $(`#frm [data-fotocam="${t}:${CSS.escape(id)}"]`)) abrirFotos(t, id, m && m.dia ? 'Foto anexada.' : 'Foto anexada, marcada como “data não confirmada”.'); else toast('Foto anexada.'); }
    catch (e) { er(e.semRede ? 'Sem internet agora: a foto não subiu. Tente de novo quando o sinal voltar.' : e.message); }
  }

  /* ---------- imprimir em branco, para aplicar no papel (trazido do Mulheres & Quintais) ---------- */
  const IMPRIMIVEIS = ['agricultores', 'visitas', 'distribuicoes', 'eventos'];
  function imprimir(html) {
    let el = document.getElementById('impresso'); if (!el) { el = document.createElement('div'); el.id = 'impresso'; document.body.appendChild(el); }
    el.innerHTML = html; document.body.classList.add('imprimindo');
    // sem prazo para limpar: no iPhone o print() não espera a impressão e a folha saía em branco. Fora da impressão o #impresso já fica escondido.
    const fim = () => { document.body.classList.remove('imprimindo'); window.removeEventListener('afterprint', fim); };
    window.addEventListener('afterprint', fim);
    const img = el.querySelector('img'); Promise.race([img && img.decode ? img.decode().catch(() => {}) : null, new Promise(r => setTimeout(r, 800))]).then(() => window.print());
  }
  const cabImp = (titulo, sub) => `<header class="pf-cab"><img src="assets/icon-192.png" alt="" width="40" height="40"><div><b>Saberes que Cultivam</b><span>IFRN Campus Apodi · TED MDA</span></div><div class="pf-t"><h1>${esc(titulo)}</h1>${sub ? `<p>${sub}</p>` : ''}</div></header>`;
  function imprimirBranco(m) {
    const M = MOD[m], ln = '<span class="pf-ln"></span>', cx = t => `<span class="pf-op"><span class="pf-bx"></span>${esc(t)}</span>`;
    const campo = ([k, l, t, req, o]) => {
      if (t === 'sec') return `<h2>${esc(l)}</h2>`;
      if (t === 'checks') return `<div class="pf-i"><b>${esc(l)}</b><div class="pf-ops">${D.CHECK.map(c => cx(c[1])).join('')}</div></div>`;
      if (t === 'check') return `<div class="pf-i">${cx(l)}</div>`;
      if (t === 'select') { const ops = (typeof o === 'function' ? o() : o).filter(x => x[0] !== '' && x[1]); return `<div class="pf-i"><b>${esc(l)}${req ? ' *' : ''}</b><div class="pf-ops">${ops.map(x => cx(x[1])).join('')}</div></div>`; }
      if (t === 'ref') return `<div class="pf-i"><b>${esc(l)}${req ? ' *' : ''}</b>${ln}</div>`;
      if (t === 'textarea') return `<div class="pf-i w"><b>${esc(l)}</b>${ln.repeat(k === 'problemas' ? 4 : 5)}</div>`;
      if (t === 'geo') return `<div class="pf-i w"><b>${esc(l)} (GPS, se tiver)</b><span class="pf-dt">Lat. ______________ &nbsp; Long. ______________</span></div>`;
      if (t === 'date') return `<div class="pf-i"><b>${esc(l)}${req ? ' *' : ''}</b><span class="pf-dt">____ / ____ / ________</span></div>`;
      return `<div class="pf-i"><b>${esc(l)}${req ? ' *' : ''}</b>${ln}</div>`;
    };
    imprimir(`<section class="pf">${cabImp(M.um, `Aplicado por: ${esc(eu.nome)} &nbsp;·&nbsp; Data: ____ / ____ / ________`)}${M.oque ? `<p class="pf-o">${esc(M.oque)}</p>` : ''}<p class="pf-inst">Escreva com letra de forma. Nas opções, marque com <b>X</b> o quadrinho. Se faltar espaço, continue no verso indicando o nome do campo.</p><div class="pf-c">${M.campos.map(campo).join('')}</div><p class="pf-r">* obrigatório. Depois, digite no sistema: Saberes que Cultivam › ${esc(M.nome)}.</p></section>`);
  }
  function imprimirLista(evId) {
    const e = by('eventos', evId); if (!e) return;
    const linhas = Array.from({ length: 20 }, (_, i) => `<tr><td>${i + 1}</td><td></td><td></td><td></td><td></td><td></td></tr>`).join('');
    imprimir(`<section class="pf">${cabImp('Lista de presença', `${esc(e.tipo)} · ${esc(e.tema)} · ${dt(e.data)}${e.lugar ? ' · ' + esc(e.lugar) : ''}${e.municipio ? ' · ' + esc(e.municipio) : ''}`)}
      <p class="pf-o">Ao assinar, você concorda que seu nome conste nesta lista, usada só para comprovar a atividade ao financiador (Lei nº 13.709/2018).</p>
      <table class="pf-lp"><thead><tr><th>Nº</th><th>Nome completo</th><th>Comunidade</th><th>Município</th><th>Mulher? (S/N)</th><th>Assinatura</th></tr></thead><tbody>${linhas}</tbody></table>
      <p class="pf-r">Responsável: ${esc(eu.nome)} &nbsp;·&nbsp; Folha ____ de ____</p></section>`);
  }
  function abrir(m, id, pre) {
    const M = MOD[m], r = id ? (by(m, id) || {}) : (m === 'pessoas' ? (pre ? { ativo: true, perfil: 'Acompanhamento', orgao: pre === '-' ? '' : pre } : { ativo: true }) : pre ? (m === 'entregas' ? { etapa: pre } : m === 'membros' ? Object.assign({ funcao: pre, inicio: iso(hoje()) }, preMembro ? preMembro.dados : {}) : m === 'presencas' ? { evento: pre } : { agricultor: pre }) : {}); ed = { m, id, convite: m === 'membros' && !id && preMembro ? preMembro.convite : null }; preMembro = null;
    const corpo = corpoForm(M, r, id);
    $('#frm').innerHTML = `<div class="fm-cab"><div><span class="fm-eye">${id ? 'Editar cadastro' : 'Novo cadastro'}</span><h2>${esc(M.um || M.novo)}</h2></div><button type="button" class="fm-x" data-fechar aria-label="Fechar">×</button></div>
     ${!id && IMPRIMIVEIS.includes(m) ? `<div class="imp-barra"><span>Vai aplicar no papel?</span><button type="button" class="b s" data-imprimir="${m}">Imprimir em branco</button></div>` : ''}
     <div class="fm-corpo">${M.oque && !id ? `<div class="fm-oque"><span>O que é</span><p>${esc(M.oque)}</p></div>` : ''}${M.campos.some(c => c[3] && c[2] !== 'sec' && c[2] !== 'check') ? '<p class="fm-obr"><span class="obr" aria-hidden="true">*</span> obrigatório</p>' : ''}${m === 'membros' ? '<div class="fm-faz" id="fm_faz" hidden></div>' : ''}${m === 'membros' && !id && pre ? (() => { const u = R.equipePorFuncao(db, pre, iso(hoje())).antigos[0]; return u ? `<p class="fm-sub">Substitui <b>${esc(u.nome)}</b>, desligada(o) em ${dt(u.fim)}. O histórico liga as duas pessoas.</p>` : ''; })() : ''}${corpo}</div>
     <div class="fm-pe"><div class="err" id="ferr" role="alert"></div><div class="frow"><button type="button" class="b" data-fechar>Cancelar</button>${m === 'visitas' && R.podeGravar(eu, 'fotos') ? (id ? `<button type="button" class="b" data-fotos="visitas:${esc(id)}">Fotos (${(db.fotos || []).filter(f => f.tabela === 'visitas' && f.registro === id).length})</button>` : '<button type="button" class="b" data-salvarfotos>Salvar e anexar fotos</button>') : ''}<button class="b p" id="fsalvar">Salvar</button></div></div>`;
    $('#frm').className = 'fm'; if (SQC.mascaras) SQC.mascaras.preparar($('#frm'));   // formata CPF e celular ANTES do retrato, senão abrir já contaria como alteração
    if (m === 'membros') ajustarFormMembro($('#frm'));
    ed.foto = fotoForm(); ed.avisado = false;
    if ($('#dlg').open) focarDlg(); else $('#dlg').showModal();
  }
  /* retrato do formulário: se mudou e a pessoa tenta fechar, avisa antes de jogar fora o que foi digitado */
  const fotoForm = () => JSON.stringify([...document.querySelectorAll('#frm input,#frm select,#frm textarea')].map(x => x.type === 'checkbox' ? x.checked : x.value));
  const perderia = () => !!ed && ed.foto !== undefined && fotoForm() !== ed.foto && !ed.avisado;
  const avisarPerda = () => { ed.avisado = true; const e = $('#ferr'); if (e) e.textContent = 'Há alterações que ainda não foram salvas. Para descartar, feche de novo; para guardar, use Salvar.'; };
  /* guarda no aparelho quando não há internet (só o que a equipe lança em campo; despesas e acessos exigem conexão) */
  async function enfileirar(m, r, op) {
    // se o registro já estava na fila, vale a origem da primeira vez (continua sendo inclusão, ou edição sobre a mesma versão lida)
    const ja = pend.find(p => p.id === SQC.fila.chave(m, r.id));
    const it = { id: SQC.fila.chave(m, r.id), tabela: m, dados: r, op: ja && ja.op ? ja.op : op, dono: eu.id, erro: '', reenviar: true };
    await SQC.fila.salvar(it); pend = await SQC.fila.listar(eu.id); aplicarFila();
  }
  function aplicarFila() {
    pend.forEach(p => { const r = Object.assign({}, p.dados, { _pendente: true, _erro: p.erro || '' }); const i = db[p.tabela].findIndex(x => x.id === r.id); if (i >= 0) db[p.tabela][i] = Object.assign({}, db[p.tabela][i], r); else db[p.tabela].push(r); });
  }
  async function gravarRegistro(m, r, ant) {
    const limpo = Object.assign({}, r); delete limpo._pendente; delete limpo._erro;
    try {
      const naFila = pend.find(p => p.id === SQC.fila.chave(m, r.id));
      const op = naFila && naFila.op ? naFila.op : { novo: !ant, base: ant ? ant.atualizado_em || null : null };
      const salvo = await api.salvar(m, limpo, op);
      const i = db[m].findIndex(x => x.id === salvo.id); if (i >= 0) db[m][i] = salvo; else db[m].push(salvo);
      await SQC.fila.remover(SQC.fila.chave(m, salvo.id)); pend = pend.filter(p => p.id !== SQC.fila.chave(m, salvo.id));
      if (eu && salvo.id === eu.id) eu = salvo;
      if (api.guardarCopia) api.guardarCopia(db);
      return { ok: true };
    } catch (e) {
      if (e.semRede && !demo() && !R.RESTRITAS.includes(m)) { await enfileirar(m, limpo, { novo: !ant, base: ant ? ant.atualizado_em || null : null }); return { ok: true, fila: true }; }
      if (e.message === R.MSG_CONFLITO || e.message === R.MSG_EXCLUIDO) atualizarPorBaixo();   // busca como ficou, para a pessoa conferir ao fechar
      return { ok: false, msg: e.message };
    }
  }
  async function aoSalvar(ev) {
    ev.preventDefault(); if (!ed) return; const depoisFotos = ed.depoisFotos; ed.depoisFotos = false;   // vale só para este envio (um erro de validação não deixa o pedido ligado)
    const { m, id } = ed, M = MOD[m], ant = id ? Object.assign({}, by(m, id)) : null, r = id ? Object.assign({}, ant) : { id: SQC.novoId() };
    const er = t => { $('#ferr').textContent = t; };
    if (m === 'membros' && ant && ant._sr) return er('Os dados pessoais desta pessoa (CPF, endereço…) não foram carregados, porque o sistema abriu sem internet. Para não apagá-los, feche, espere a conexão voltar e abra o cadastro de novo.');
    for (const [k, l, t, req] of M.campos) {
      if (t === 'sec' || t === 'html') continue;
      if (t === 'checks') { D.CHECK.forEach(c => { r[c[0]] = $('#f_' + c[0]).checked; }); continue; }
      if (t === 'geo') { const la = $('#f_lat').value, lo = $('#f_lng').value, pr = $('#f_precisao').value; r.lat = la === '' ? null : +la; r.lng = lo === '' ? null : +lo; r.precisao = la === '' || pr === '' ? null : +pr; continue; }
      const el = $('#f_' + k); if (!el) continue;   // campo que só existe na edição (desligamento)
      r[k] = t === 'check' ? el.checked : t === 'number' ? numCampo(el.value) : el.value.trim();
      if (t === 'number' && el.value !== '' && !(r[k] >= 0)) { er(`“${l}” precisa ser um número positivo, como 120 ou 120,50.`); el.focus(); return; }
      // cadastro antigo da equipe, de antes de CPF, celular e e-mail serem obrigatórios: pode ser editado sem eles (R.obrigatoriosMembro decide)
      const antigo = m === 'membros' && ant && ['cpf', 'telefone', 'email'].includes(k) && !String(ant[k] == null ? '' : ant[k]).trim();
      if (req && !antigo && (r[k] === '' || r[k] == null)) { er(`Preencha “${l}”.`); el.focus(); return; }
    }
    if (m === 'lotes' && !r.dias && r.dias !== 0) r.dias = (D.TIPOS[r.tipo] || [0, 30])[1];
    if (m === 'pessoas') r.email = r.email.toLowerCase();
    if (m === 'membros') R.normalizarMembro(r);
    const conviteAberto = ed.convite;
    const msg = R.validar(db, m, r, ant); if (msg) return er(msg);
    const b = $('#fsalvar'); b.disabled = true; b.textContent = 'Salvando…';
    const res = await gravarRegistro(m, r, ant);
    b.disabled = false; b.textContent = 'Salvar';
    if (!res.ok) return er(res.msg);
    if (conviteAberto) { try { await api.conviteEncerrar(conviteAberto, 'aprovado'); } catch (e) { toast('Cadastro gravado, mas o convite não foi encerrado: ' + e.message); } convites = undefined; }
    let acesso = '';
    if (m === 'membros' && !id && !res.fila && coord() && r.email) acesso = await criarAcessoDaFuncao(r);
    $('#dlg').close(); ed = null; render();
    if (acesso) return toast(acesso);
    if (depoisFotos && !res.fila) return abrirFotos(m, r.id, 'Visita salva. Agora tire ou escolha as fotos.');
    if (depoisFotos && res.fila) return toast('Sem internet: a visita ficou guardada neste aparelho. As fotos precisam de internet: anexe depois, pelo botão Fotos da visita.');
    if (res.fila) toast('Sem internet: guardado neste aparelho. Envia sozinho quando o sinal voltar.');
    else if (m === 'pessoas' && !id && !demo()) toast('Acesso criado. Avise a pessoa para abrir o sistema e usar “Primeiro acesso”.');
    else toast(id ? 'Alterações salvas.' : 'Registro salvo.');
  }

  /* foto de perfil da equipe (24): avatar com a foto quando houver; a imagem chega depois (pasta privada), por carregarFotosEq */
  const avatar = (m, cls) => `<span class="${cls || 'pc-av'}${m.foto ? ' com-foto' : ''}"${m.foto ? ` data-fotoeq="${esc(m.foto)}"` : ''} aria-hidden="true">${esc(iniciais(m.nome))}</span>`;
  const podeFoto = m => !!m && (coord() || (eu && R.nrm(eu.email) === R.nrm(m.email)));
  const botoesFoto = m => `<div class="foto-acts"><button type="button" class="b s" data-fotoeqtrocar="${esc(m.id)}">${m.foto ? 'Trocar a foto' : 'Pôr uma foto'}</button>${m.foto ? `<button type="button" class="b s" data-fotoeqtirar="${esc(m.id)}">Tirar a foto</button>` : ''}<span class="small">A foto aparece só para a equipe do projeto.</span></div>`;
  function carregarFotosEq() {
    document.querySelectorAll('[data-fotoeq]:not([data-fotook])').forEach(async el => {
      el.dataset.fotook = '1';
      try { const u = await api.fotoEquipe(el.dataset.fotoeq); if (el.isConnected) el.innerHTML = `<img src="${esc(u)}" alt="" width="64" height="64" decoding="async">`; }
      catch (e) { /* sem internet ou foto apagada: ficam as iniciais */ }
    });
  }
  function escolherFotoEq(id, b) {
    const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.hidden = true; document.body.appendChild(i);
    i.addEventListener('change', async () => { const f = i.files && i.files[0]; i.remove(); if (!f) return;
      const err = $('#ferr'); b.disabled = true; b.textContent = 'Enviando…';
      try { const blob = await SQC.fotodia.quadrada(f); const caminho = await api.trocarFotoEquipe(id, blob); const m = by('membros', id); if (m) m.foto = caminho; depoisFotoEq(id, 'Foto atualizada.'); }
      catch (e) { b.disabled = false; b.textContent = 'Trocar a foto'; if (err) err.textContent = e.semRede ? 'Sem internet: a foto precisa de conexão. Tente quando o sinal voltar.' : e.message; }
    }, { once: true });
    i.click();
  }
  async function tirarFotoEq(id, b) {
    b.disabled = true; try { await api.tirarFotoEquipe(id); const m = by('membros', id); if (m) m.foto = null; depoisFotoEq(id, 'Foto retirada.'); }
    catch (e) { b.disabled = false; const err = $('#ferr'); if (err) err.textContent = e.message; }
  }
  // volta à janela de onde veio (Meus dados ou a ficha) e redesenha a aba
  function depoisFotoEq(id, msg) { const meus = !!$('#frm.md'); render(); if (meus) abrirMeusDados({ msg }); else { abrirFichaMembro(id); const ok = $('#fok'); if (ok) ok.textContent = msg; } atualizarCabecalhoFoto(); }
  function atualizarCabecalhoFoto() { const m = meuMembro(), el = $('#quem-av'); if (!el || !eu) return;
    el.removeAttribute('data-fotook'); if (m && m.foto) { el.dataset.fotoeq = m.foto; el.classList.add('com-foto'); } else { delete el.dataset.fotoeq; el.classList.remove('com-foto'); el.textContent = iniciais(demo() ? eu.perfil : eu.nome); } }
  /* habilitação na FUNCERN (Arlo e termo): a coordenação e o auxiliar administrativo acompanham e marcam */
  const cuidaHab = () => coord() || auxiliar();
  const seloHab = m => m.arlo === 'Sim' && m.termo_em ? '<span class="chip ok">Habilitado(a) na FUNCERN</span>' : m.arlo === 'Sim' ? '<span class="chip f">Falta o termo</span>' : '<span class="chip f">Falta o Arlo</span>';
  const fmtCpf = c => { const d = R.soDigitos(c); return d.length === 11 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : esc(c || ''); };
  /* ficha de uma pessoa da equipe: só leitura, com as ações ao pé (no formato do Mulheres & Quintais) */
  function abrirFichaMembro(id) {
    const m = by('membros', id); if (!m) return; const F = FUNCOES.find(f => f[0] === m.funcao), hj = iso(hoje()), ativo = !m.fim || m.fim >= hj, res = cuidaHab();
    const l = (t, v) => v ? `<div><dt>${t}</dt><dd>${v}</dd></div>` : '', bloco = (t, h) => h.trim() ? `<section class="fi-s"><h3 class="fm-sec">${t}</h3><dl class="fi-dl">${h}</dl></section>` : '';
    const end = [m.logradouro, m.numero, m.complemento, m.bairro].filter(Boolean).map(esc).join(', ') + (m.cep ? ` · CEP ${esc(m.cep)}` : '') + (m.uf ? ` · ${esc(m.uf)}` : '');
    const perf = [['agricultor', 'É agricultor(a)'], ['atua_af', 'Atua com agricultura familiar'], ['zona_rural', 'Mora na zona rural'], ['celular_internet', 'Celular com internet']].filter(([k]) => m[k]).map(([k, t]) => `${t}: ${esc(m[k])}`).join(' · ');
    ed = null; $('#frm').className = 'fm';
    $('#frm').innerHTML = `<div class="fm-cab"><div><span class="fm-eye">${esc(NOME_FUNCAO[m.funcao] || 'Equipe')}</span><h2>${esc(m.nome)}</h2></div><button type="button" class="fm-x" data-fechar aria-label="Fechar">×</button></div>
     <div class="fm-corpo fi"><div class="fi-top">${avatar(m)}<div><span class="chip ${ativo ? 'ok' : ''}">${ativo ? (m.fim ? 'Sai em ' + dt(m.fim) : 'Na equipe') : 'Desligado(a) em ' + dt(m.fim)}</span>${res ? seloHab(m) : ''}${F ? `<p class="small">${esc(F[4])}</p>` : ''}</div></div>
      ${podeFoto(m) ? botoesFoto(m) : ''}
      ${bloco('Contato', l('E-mail (login)', esc(m.email)) + l('Celular', esc(m.telefone)) + l('Município', esc(m.municipio)))}
      ${bloco('Vínculo', l('Nome social', esc(m.nome_social)) + l('Instituição ou curso', esc(m.vinculo)) + l('Organização', esc(m.organizacao)) + l('SIAPE', esc(m.siape)))}
      ${bloco('Bolsa', l('Início', dt(m.inicio)) + l('Desligamento', m.fim ? dt(m.fim) + (m.motivo ? ' · ' + esc(m.motivo) : '') : '') + l('Outra bolsa hoje', esc(m.outra_bolsa)))}
      ${res ? bloco('Habilitação na FUNCERN', l('Cadastro no Arlo', esc(m.arlo || 'não informado')) + l('Termo assinado em', m.termo_em ? dt(m.termo_em) : 'ainda não')) : ''}
      ${res ? bloco('Dados para o cadastro no Arlo (reservados)', l('CPF', m.cpf ? fmtCpf(m.cpf) : '') + l('PIS/NIS', esc(m.pis)) + l('Nascimento', m.nascimento ? dt(m.nascimento) : '') + l('Endereço', end)) : ''}
      ${['discente', 'formador'].includes(m.funcao) && perf ? bloco('Perfil no campo', l('Respostas', perf) + l('Experiência', esc(m.experiencia))) : ''}
      ${coord() ? bloco('Questionário socioeconômico', l('Respondeu', m.socio ? 'Sim (só a coordenação vê as respostas, no formulário de edição)' : 'Não')) : ''}</div>
     <div class="fm-pe"><div class="err" id="ferr" role="alert"></div><div class="ok-msg" id="fok" role="status"></div><div class="frow"><button type="button" class="b" data-fechar>Fechar</button>${res ? `<button type="button" class="b" data-habilitar="${esc(m.id)}">Marcar habilitação</button>` : ''}${R.podeGravar(eu, 'membros') ? `<button type="button" class="b p" data-edit="membros:${esc(m.id)}">Editar cadastro</button>` : ''}</div></div>`;
    if ($('#dlg').open) focarDlg(); else $('#dlg').showModal();
    carregarFotosEq();
  }
  function abrirHabilitacao(id, msg) {
    const m = by('membros', id); if (!m) return; ed = null; $('#frm').className = 'fm'; hab = { id, base: m.atualizado_em };
    $('#frm').innerHTML = `<div class="fm-cab"><div><span class="fm-eye">Habilitação na FUNCERN</span><h2>${esc(m.nome)}</h2></div><button type="button" class="fm-x" data-fechar aria-label="Fechar">×</button></div>
     <div class="fm-corpo"><div class="fm-oque"><span>O que marcar</span><p>Quando a FUNCERN confirmar o cadastro da pessoa no Arlo, marque “Sim”. Quando o termo de compromisso estiver assinado, informe a data. Só esses dois dados mudam aqui; o resto do cadastro é da coordenação.</p></div>
      <div class="fields"><div class="fld"><label for="h_arlo">Cadastro no Arlo</label><select id="h_arlo">${[['', '—'], ['Sim', 'Sim'], ['Não', 'Não']].map(o => `<option value="${o[0]}" ${String(m.arlo || '') === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></div>
       <div class="fld"><label for="h_termo">Termo assinado em</label><input id="h_termo" type="date" value="${esc(m.termo_em || '')}"></div></div></div>
     <div class="fm-pe"><div class="err" id="ferr" role="alert">${msg ? esc(msg) : ''}</div><div class="frow"><button type="button" class="b" data-fichamembro="${esc(id)}">Voltar</button><button type="button" class="b p" data-habsalvar>Salvar</button></div></div>`;
    if ($('#dlg').open) focarDlg(); else $('#dlg').showModal();
  }
  let hab = null;
  async function salvarHabilitacao(b) {
    if (!hab) return; const arlo = $('#h_arlo').value, termo = $('#h_termo').value;
    if (termo && termo > iso(hoje())) return void ($('#ferr').textContent = 'A data do termo não pode ser no futuro.');
    b.disabled = true; b.textContent = 'Salvando…';
    try { const r = await api.habilitar(hab.id, arlo, termo, hab.base); const m = by('membros', hab.id); if (m) Object.assign(m, r); const id = hab.id; hab = null; abrirFichaMembro(id); render(); toast('Habilitação salva.'); }
    catch (e) { b.disabled = false; b.textContent = 'Salvar'; $('#ferr').textContent = e.message; }
  }
  /* acesso ao sistema de quem entra na equipe: o perfil vem da função (auxiliar e formador(a) têm perfil próprio) */
  const PERFIL_DA_FUNCAO = { coordenacao: 'Coordenação', auxiliar: 'Auxiliar', discente: 'Equipe', formador: 'Formador' };
  async function criarAcessoDaFuncao(r) {
    const email = String(r.email).trim().toLowerCase(), ja = db.pessoas.find(p => String(p.email || '').toLowerCase() === email);
    if (ja) return ja.perfil === PERFIL_DA_FUNCAO[r.funcao] ? 'Cadastro salvo. Esta pessoa já tinha acesso ao sistema.' : `Cadastro salvo. Esta pessoa já tem acesso como ${R.NOME_PERFIL[ja.perfil] || ja.perfil}: se precisar, mude o perfil em Dados › Pessoas com acesso.`;
    const p = { id: SQC.novoId(), nome: r.nome, email, perfil: PERFIL_DA_FUNCAO[r.funcao] || 'Equipe', ativo: true };
    const res = await gravarRegistro('pessoas', p, null);
    return res.ok ? `Cadastro salvo e acesso criado, com o perfil ${R.NOME_PERFIL[p.perfil]}. Avise a pessoa para abrir o sistema e usar “Primeiro acesso” com o e-mail ${email}.` : 'Cadastro salvo, mas o acesso não foi criado: ' + res.msg;
  }
  /* ---------- planilhas e cópia ---------- */
  function csv(m) {
    const M = MOD[m], cs = M.campos.filter(c => c[2] !== 'checks' && c[2] !== 'sec' && c[2] !== 'html'), q = s => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
    // texto que começa com = + - @ vira fórmula no Excel: um apóstrofo na frente desarma
    // (número negativo, como -5 ou -12,50, fica número)
    const seguro = v => typeof v === 'string' && /^[=+\-@\t\r\n]/.test(v) && !/^-\d+(,\d+)?$/.test(v) ? "'" + v : v;
    const val = (c, r) => c[2] === 'geo' ? (r.lat != null && r.lat !== '' ? `${r.lat}; ${r.lng}${r.precisao != null ? ' (±' + r.precisao + ' m)' : ''}` : '') : c[2] === 'ref' ? (by(c[4], r[c[0]]) ? rotulo[c[4]](by(c[4], r[c[0]])) : '') : c[2] === 'check' ? (r[c[0]] ? 'Sim' : 'Não') : c[0] === 'rubrica' ? nomeRubrica(r[c[0]]) : c[0] === 'item' && m === 'despesas' ? ((D.DESEMBOLSO.itens.find(i => i.id === r.item) || { nome: '' }).nome) : typeof r[c[0]] === 'number' ? String(r[c[0]]).replace('.', ',') : r[c[0]];
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
  /* ---------- tela de entrada ---------- */
  const IC_OLHO = '<svg class="o1" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg><svg class="o2" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18M10.6 5.1A10.6 10.6 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.7 8.5 2 12 2 12s3.6 7 10 7c1.7 0 3.2-.5 4.5-1.200M9.9 9.900a3 3 0 0 0 4.2 4.2"/></svg>';
  const IC_ERRO = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.500v.01"/></svg>';
  const IC_SETA = '<svg class="seta" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  /* campo da entrada: rótulo ligado ao campo, mensagem de erro própria (ligada por aria-describedby quando aparece) e, na senha, botão de mostrar */
  const campoA = (id, rotulo, tipo, ac) => `<div class="cp"><label for="${id}">${rotulo}</label><div class="cp-c">
    <input id="${id}" name="${id}" type="${tipo}" autocomplete="${ac}" required${tipo === 'email' ? ' inputmode="email" autocapitalize="none" spellcheck="false" placeholder="seu@email.com" maxlength="254"' : ''}>${tipo === 'password' ? `<button type="button" class="cp-olho" data-olho="${id}" aria-label="Mostrar senha" aria-pressed="false">${IC_OLHO}</button>` : ''}</div>
    <p class="cp-e" id="e_${id}" hidden></p></div>`;
  const avisoA = (msg, ok) => `<p class="ac-erro" id="aerr" role="alert"${msg ? '' : ' hidden'}>${msg ? IC_ERRO + '<span>' + esc(msg) + '</span>' : ''}</p><p class="ac-ok" id="aok" role="status"${ok ? '' : ' hidden'}>${esc(ok || '')}</p>`;
  function painelAcesso(msg, ok) {
    const esq = authModo === 'esqueci', pri = authModo === 'primeiro';
    const intro = pri ? '<p class="ent-p">Para quem a coordenação já cadastrou e ainda não tem senha. Informe o seu e-mail: você recebe um link, toca nele e cria a senha na tela que abrir.</p>' : '';
    const campos = pri ? campoA('a_email', 'Seu e-mail (o mesmo que a coordenação cadastrou)', 'email', 'username') : esq ? campoA('a_email', 'Seu e-mail', 'email', 'username') : campoA('a_email', 'E-mail', 'email', 'username') + campoA('a_senha', 'Senha', 'password', 'current-password');
    return `<form id="fauth" novalidate>${intro}${campos}${avisoA(msg, ok)}<button class="bt" id="abotao"><span>${pri ? 'Enviar o link' : esq ? 'Enviar o e-mail' : 'Entrar'}</span>${IC_SETA}</button></form>
     <div class="ent-links">${esq ? '<button type="button" class="lk" data-auth="entrar">Voltar para a entrada</button>' : '<button type="button" class="lk" data-auth="esqueci">Esqueci a senha</button>'}
      <button type="button" id="aj_entrada" class="ent-aj-b" data-ajudaentrada aria-haspopup="dialog"><i aria-hidden="true">?</i>Precisa de ajuda para entrar?</button></div>`;
  }
  /* painel "Como entrar no sistema" (14/10/2026, no formato da ajuda do Mulheres & Quintais, com o caminho deste sistema:
     o primeiro acesso e a senha esquecida chegam por LINK NO E-MAIL). O WhatsApp da coordenação só aparece se estiver
     em SQC.CONFIG.contato = { tel: '(84) 9 0000-0000', wa: '5584900000000' } (config.js): sem ele, o painel indica falar com a coordenação. */
  function abrirAjudaEntrada() {
    const c = (SQC.CONFIG && SQC.CONFIG.contato) || {}, wa = String(c.wa || '').replace(/\D/g, ''), tel = String(c.tel || '').trim();
    const tarefas = [
      ['Entrar pela primeira vez', ['Abra o endereço do sistema no <b>Chrome</b> (Android) ou no <b>Safari</b> (iPhone e iPad).', 'Toque em <b>Primeiro acesso</b>.', 'Digite o e-mail que a coordenação cadastrou e toque em <b>Enviar o link</b>.', 'Abra a mensagem que chegar no seu e-mail (confira também o spam e a aba Promoções) e toque no link.', 'Na tela que abrir, crie uma senha com pelo menos 8 caracteres, repita e toque em <b>Guardar a senha e entrar</b>.']],
      ['Entrar nas próximas vezes', ['Toque em <b>Já tenho senha</b>.', 'Digite o e-mail e a senha.', 'Toque em <b>Entrar</b>.']],
      ['Esqueci a senha', ['Toque em <b>Esqueci a senha</b>.', 'Digite o seu e-mail e toque em <b>Enviar o e-mail</b>.', 'Abra a mensagem, toque no link e crie outra senha. O que você já registrou no sistema não se perde.']]
    ];
    const antes = ['Abra o link do e-mail no mesmo aparelho em que vai usar o sistema. Se ele abrir dentro do aplicativo de e-mail, use o menu desse aplicativo para abrir no Chrome ou no Safari.', 'Para usar como aplicativo, no menu do navegador toque em <b>Adicionar à tela inicial</b>. Depois de entrar com internet, dá para registrar no campo sem sinal.', 'No sol forte, toque em <b>Modo sol</b>, no cartão de acesso: letra preta em fundo branco e maior.'];
    const duvidas = [
      ['O e-mail com o link não chegou.', 'Espere alguns minutos e confira o spam e a aba Promoções. Veja se o e-mail foi digitado exatamente como a coordenação cadastrou. Peça o link uma vez só: pedidos seguidos são bloqueados por alguns minutos. Se não chegar, fale com a coordenação.'],
      ['Aparece “O link que você abriu já foi usado ou venceu”.', 'Cada link vale uma vez só e por pouco tempo. Peça outro em Primeiro acesso (ou em Esqueci a senha, se você já tinha senha) e use o link mais recente.'],
      ['Aparece “Este e-mail não tem acesso ativo ao sistema”.', 'O e-mail não está cadastrado ou o acesso foi desligado. Fale com a coordenação do projeto.'],
      ['Aparece “E-mail ou senha incorretos”.', 'Confira o e-mail e a senha (letra maiúscula conta). Se não lembrar a senha, use Esqueci a senha.'],
      ['Aparece “Este e-mail já tem senha criada”.', 'Você já fez o primeiro acesso. Use Já tenho senha ou, se não lembrar, Esqueci a senha.'],
      ['Quero ver a senha que estou digitando.', 'Toque no olho, dentro do campo da senha. Toque de novo para esconder. Use quando ninguém estiver olhando a sua tela.'],
      ['O sistema saiu sozinho.', 'Depois de 15 minutos sem uso ele sai, para proteger os dados. Entre de novo: neste aparelho ele volta para a mesma aba em que você estava.'],
      ['Quero trocar a minha senha.', 'Depois de entrar, toque no seu nome, no alto da tela (Meus dados), e abra “Trocar minha senha”.']
    ];
    ed = null; $('#frm').className = 'fm aj-ent';
    $('#frm').innerHTML = `<div class="fm-cab"><div><span class="fm-eye">Ajuda</span><h2>Como entrar no sistema</h2></div><button type="button" class="fm-x" data-fechar aria-label="Fechar">×</button></div>
     <div class="fm-corpo"><p class="aj-intro">Só entra quem a coordenação do projeto cadastrou, com o e-mail que ela registrou. Na primeira vez, o sistema manda para esse e-mail um link: é por ele que você cria a sua senha.</p>
      <div class="aj-ct"><p>Não conseguiu entrar? Fale com a coordenação do projeto${wa && tel ? ':' : '.'}</p>${wa && tel ? `<a class="aj-wa" href="https://wa.me/${esc(wa)}" target="_blank" rel="noopener">WhatsApp ${esc(tel)}</a>` : ''}</div>
      <h3 class="fm-sec">Passo a passo</h3><div class="aj-dd">${tarefas.map(([t, l], i) => `<details${i === 0 ? ' open' : ''}><summary>${esc(t)}</summary><ol>${l.map(x => `<li>${x}</li>`).join('')}</ol></details>`).join('')}</div>
      <h3 class="fm-sec">Antes de entrar</h3><ul class="aj-ul">${antes.map(x => `<li>${x}</li>`).join('')}</ul>
      <h3 class="fm-sec">Dúvidas comuns</h3><div class="aj-dd">${duvidas.map(([q, r]) => `<details><summary>${esc(q)}</summary><p>${esc(r)}</p></details>`).join('')}</div></div>
     <div class="fm-pe"><div class="frow"><button type="button" class="b p" data-fechar>Entendi</button></div></div>`;
    if ($('#dlg').open) $('#frm .fm-x').focus(); else $('#dlg').showModal();
  }
  /* cabeçalho do cartão de acesso conforme o caminho (14/10/2026: "Esqueci a senha" ganhou título próprio, como no Mulheres & Quintais) */
  const CAB_ACESSO = { esqueci: ['Esqueci a senha', 'Criar uma senha nova', 'Digite o e-mail do seu cadastro. Chega uma mensagem com um link: toque nele e crie outra senha. O que você já registrou no sistema não se perde.'],
    nova: ['Senha nova', 'Crie a sua senha', 'E-mail confirmado. Agora crie a senha que você vai usar para entrar.'] };
  function cabAcesso() { const c = CAB_ACESSO[authModo] || ['Área de acesso', 'Que bom ver você', 'Entre com o e-mail cadastrado pela coordenação.']; $('#authey').textContent = c[0]; $('#autht').textContent = c[1]; $('#authsub').textContent = c[2]; }
  function telaAcesso(msg, ok) {
    $('#carregando').hidden = true; $('#app').hidden = true; $('#auth').hidden = false; if (!demo()) cabAcesso();
    if (demo()) {
      $('#authsub').textContent = 'Modo demonstração: os dados ficam só neste navegador e os registros marcados como “exemplo” são fictícios.';
      $('#authcorpo').innerHTML = `<p class="ent-p">Escolha com qual perfil quer ver o sistema.</p><div class="ent-demo"><button class="bt" data-demo="Coordenação"><span>Entrar como Coordenação</span>${IC_SETA}</button><button class="bt sec" data-demo="Equipe"><span>Entrar como Equipe (bolsistas)</span></button><button class="bt sec" data-demo="Auxiliar"><span>Entrar como Auxiliar administrativo</span></button><button class="bt sec" data-demo="Formador"><span>Entrar como Formador(a)</span></button><button class="bt sec" data-demo="Acompanhamento"><span>Entrar como SEAB/MDA</span></button></div>${avisoA(msg, ok)}`;
      return;
    }
    if (authModo === 'nova') {
      $('#authcorpo').innerHTML = `<form id="fauth" novalidate>${campoA('a_senha', 'Senha nova (mínimo 8 caracteres)', 'password', 'new-password')}${campoA('a_senha2', 'Repita a senha', 'password', 'new-password')}${avisoA(msg, ok)}<button class="bt" id="abotao"><span>Guardar a senha e entrar</span>${IC_SETA}</button></form>`;
      return;
    }
    /* "Já tenho senha | Primeiro acesso" troca o painel logo abaixo: é um conjunto de abas (Tab para nas duas opções; Enter, Espaço ou setas trocam) */
    const sel = authModo === 'primeiro' ? 1 : 0, aba = (m, i, t) => `<button type="button" role="tab" id="tab_${m}" aria-controls="painel_acesso" aria-selected="${sel === i}" data-auth="${m}">${t}</button>`;
    $('#authcorpo').innerHTML = `${authModo === 'esqueci' ? '' : `<div class="sg" role="tablist" aria-label="Forma de acesso" data-sel="${sel}">${aba('entrar', 0, 'Já tenho senha')}${aba('primeiro', 1, 'Primeiro acesso')}</div>`}
     <div id="painel_acesso"${authModo === 'esqueci' ? '' : ` role="tabpanel" aria-labelledby="tab_${authModo}"`}>${painelAcesso(msg, ok)}</div>`;
  }
  /* troca entre "Já tenho senha" e "Primeiro acesso" sem redesenhar o seletor (o destaque desliza e o foco fica onde estava) */
  function trocarModo(m, focar) {
    const sg = $('.sg');
    if (!sg || !['entrar', 'primeiro'].includes(m) || !['entrar', 'primeiro'].includes(authModo)) { authModo = m; telaAcesso(''); const alvo = m === 'esqueci' ? $('#a_email') : $('#tab_' + m); if (focar && alvo) alvo.focus(); return; }
    authModo = m; const sel = m === 'primeiro' ? 1 : 0; sg.dataset.sel = sel;
    sg.querySelectorAll('[role="tab"]').forEach((b, i) => { b.setAttribute('aria-selected', i === sel); });
    const pn = $('#painel_acesso'); pn.setAttribute('aria-labelledby', 'tab_' + m); pn.innerHTML = painelAcesso('');
    if (focar) $('#tab_' + m).focus();
  }
  function erroCampo(id, msg) {
    const el = $('#' + id), p = $('#e_' + id); if (!el || !p) return; el.setAttribute('aria-invalid', 'true'); el.setAttribute('aria-describedby', 'e_' + id);
    p.innerHTML = IC_ERRO + '<span>' + esc(msg) + '</span>'; p.hidden = false; el.closest('.cp').classList.add('erro');
  }
  function limparErros() {
    document.querySelectorAll('#fauth [aria-invalid]').forEach(el => { el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby'); });
    document.querySelectorAll('#fauth .cp').forEach(c => c.classList.remove('erro')); document.querySelectorAll('#fauth .cp-e').forEach(p => { p.hidden = true; p.textContent = ''; });
    const a = $('#aerr'); if (a) { a.hidden = true; a.textContent = ''; } const o = $('#aok'); if (o) { o.hidden = true; o.textContent = ''; }
  }
  async function aoEntrar(ev) {
    ev.preventDefault(); const g = id => ($('#' + id) || { value: '' }).value; limparErros();
    const email = g('a_email').trim().toLowerCase(), pw = g('a_senha'), b = $('#abotao'), rot = b.querySelector('span').textContent, erros = [];
    if (authModo !== 'nova' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) erros.push(['a_email', email ? 'Este e-mail não parece completo. Confira se tem @ e o final (por exemplo, .br).' : 'Informe o seu e-mail.']);
    if (authModo === 'nova') { if (pw.length < 8) erros.push(['a_senha', 'A senha precisa de pelo menos 8 caracteres.']); else if (pw !== g('a_senha2')) erros.push(['a_senha2', 'As duas senhas não são iguais.']); }
    if (authModo === 'entrar' && !pw) erros.push(['a_senha', 'Informe a senha.']);
    if (erros.length) { erros.forEach(e => erroCampo(e[0], e[1])); $('#' + erros[0][0]).focus(); return; }   // o foco vai para o primeiro campo com problema
    b.disabled = true; b.setAttribute('aria-busy', 'true'); b.querySelector('span').textContent = 'Aguarde…';
    try {
      if (authModo === 'entrar') { eu = await api.entrar(email, pw); return await aposEntrar(); }
      if (authModo === 'primeiro') {
        await api.primeiroAcesso(email);
        authModo = 'entrar'; telaAcesso('', 'Se esse e-mail foi cadastrado pela coordenação, o link já foi enviado. Abra a mensagem (confira o spam), toque no link e crie a sua senha.'); $('#tab_entrar').focus(); return;
      }
      if (authModo === 'esqueci') { await api.esqueci(email); authModo = 'entrar'; telaAcesso('', 'Se esse e-mail tem acesso, a mensagem com o link já foi enviada. Confira também a caixa de spam.'); $('#tab_entrar').focus(); return; }
      if (authModo === 'nova') { await api.trocarSenha(pw); authModo = 'entrar'; try { history.replaceState(null, '', location.pathname); } catch (x) {} eu = await api.eu(true); if (eu) return await aposEntrar(); await api.sair(); return telaAcesso('Este e-mail não tem acesso ativo ao sistema. Fale com a coordenação.'); }
    } catch (e) {
      // erro do servidor (e-mail ou senha incorretos, sem conexão): mensagem com ícone e texto, ligada ao campo, e o foco volta para ele
      b.disabled = false; b.removeAttribute('aria-busy'); b.querySelector('span').textContent = rot;
      const a = $('#aerr'); a.innerHTML = IC_ERRO + '<span>' + esc(e.message) + '</span>'; a.hidden = false;
      const alvo = $('#a_senha') || $('#a_email'); if (alvo) { alvo.setAttribute('aria-invalid', 'true'); alvo.setAttribute('aria-describedby', 'aerr'); alvo.focus(); if (alvo.select) alvo.select(); }
    }
  }
  /* sair e entrar de novo (trazido do Mulheres & Quintais, v261): ao sair (botão, 15 minutos sem uso ou fechar a página) guarda a aba e a
     altura da tela de QUEM saiu; se a MESMA pessoa entrar de novo neste aparelho em até 7 dias, volta para o mesmo lugar. Outra pessoa
     começa do início. Só o nome da aba e a altura: nenhum dado do projeto. */
  const CHAVE_VOLTAR = 'sqc-voltar';
  const guardarLugar = () => { try { if (eu && eu.id && !real) localStorage.setItem(CHAVE_VOLTAR, JSON.stringify({ quem: eu.id, aba: tab, y: Math.round(window.scrollY || 0), em: Date.now() })); } catch (e) { /* aparelho bloqueia */ } };
  function voltarAoLugar() {
    let v = null; try { v = JSON.parse(localStorage.getItem(CHAVE_VOLTAR) || 'null'); localStorage.removeItem(CHAVE_VOLTAR); } catch (e) { v = null; }
    if (!v || !eu || v.quem !== eu.id || !(Date.now() - v.em < 7 * 864e5) || !abas().some(t => t[0] === v.aba)) { if (v && eu && v.quem !== eu.id) tab = 'painel'; return 0; }   // outra pessoa: começa do início
    tab = v.aba; return +v.y > 0 ? +v.y : 0;
  }
  async function aposEntrar() {
    $('#auth').hidden = true; $('#carregando').hidden = false; $('#carregando-txt').textContent = 'Carregando os dados…';
    try { await recarregarDb(); }
    catch (e) { $('#carregando').hidden = true; eu = null; return telaAcesso(e.message); }
    D.TABELAS.forEach(t => { if (!Array.isArray(db[t])) db[t] = []; });
    pend = demo() ? [] : await SQC.fila.listar(eu.id); aplicarFila(); hist = null;
    $('#carregando').hidden = true; $('#app').hidden = false;
    const y = location.hash && TABS.some(x => x[0] === location.hash.slice(1)) ? 0 : voltarAoLugar();   // link com a aba no endereço vale mais
    if (!abas().some(t => t[0] === tab)) tab = 'painel';
    render(); if (y) requestAnimationFrame(() => window.scrollTo(0, y));
    if (!demo()) { SQC.sessao.tocar(true); SQC.sessao.iniciar({ ativo: () => !!eu, aoVencer: () => sair(EXP), temConexao: () => api.temConexao() }); sincronizar(); }
  }
  async function sair(msg) {
    guardarLugar();   // antes de esquecer a aba: a mesma pessoa volta para cá quando entrar de novo
    Object.keys(urlsFoto).forEach(k => { URL.revokeObjectURL(urlsFoto[k]); delete urlsFoto[k]; });
    if ($('#dlg').open) $('#dlg').close();
    try { await api.sair(); } catch (e) { /* segue */ }
    if (SQC.sessao) { SQC.sessao.parar(); SQC.sessao.esquecer(); }
    eu = null; db = null; real = null; hist = null; convites = undefined; filas = undefined; acessos = undefined; prUlt = {}; imp = null; tab = 'painel'; $('#view').innerHTML = ''; authModo = 'entrar'; telaAcesso(msg || '');   // a aba de quem saiu fica guardada à parte (guardarLugar)   // nada de quem saiu fica para a próxima pessoa
  }
  /* envia o que ficou guardado no aparelho e busca o que os outros lançaram */
  let sincronizando = false, espera = null;
  async function atualizarPorBaixo() { try { espera = { db: await api.carregar(), pend: demo() ? [] : await SQC.fila.listar(eu.id) }; } catch (e) { /* fica como está */ } }
  function aplicarEspera() { if (!espera || !eu) return; trocarDb(espera.db); pend = espera.pend; espera = null; aplicarFila(); render(); }
  /* "falta enviar" (script 14): com internet, o aparelho informa só a contagem do que guarda sem enviar. A coordenação vê na Visão geral. */
  const aparelho = () => { let a = ''; try { a = localStorage.getItem('sqc-aparelho') || ''; if (!a) { a = SQC.novoId(); localStorage.setItem('sqc-aparelho', a); } } catch (e) { a = a || 'sem-armazenamento'; } return a; };
  async function informarFila() {
    if (!eu || demo() || fora() || !api.informarFila || navigator.onLine === false) return;
    const desde = pend.length ? new Date(Math.min(...pend.map(p => p.criado || Date.now()))).toISOString() : null;
    try { await api.informarFila(aparelho(), pend.length, pend.filter(p => p.erro).length, desde); } catch (e) { /* é só aviso: não atrapalha */ }
  }
  let filas;   // undefined = ainda não carregou; null = o banco não tem (falta o script 14)
  async function carregarFilas() { try { filas = await api.listarFila(); } catch (e) { filas = []; } if (tab === 'painel') render(); }
  function faltaEnviar() {
    if (!coord() || real) return '';
    if (filas === undefined) { filas = []; carregarFilas(); return ''; }
    if (!filas || !filas.length) return '';
    const dias = d => Math.floor((Date.now() - new Date(d).getTime()) / 864e5);
    return `<section class="panel fe" aria-label="Lançamentos que ainda não foram enviados"><div class="fe-cab"><h2>Falta enviar</h2><p>Lançamentos feitos sem internet que ainda estão guardados no celular de alguém. O sistema sabe só quantos são, não o que são.</p></div>
      <ul class="fe-l">${filas.map(f => { const d = f.desde ? dias(f.desde) : 0, velho = d >= 2;
        return `<li class="${velho ? 'velho' : ''}"><b>${esc(f.nome)}</b>${f.ex ? exChip(f) : ''}<span>${f.quantos} lançamento${f.quantos === 1 ? '' : 's'} guardado${f.quantos === 1 ? '' : 's'}${f.recusados ? ` · <b>${f.recusados} recusado${f.recusados === 1 ? '' : 's'} pelo servidor</b>` : ''}</span>
          <small>${f.desde ? (d === 0 ? 'desde hoje' : `há ${d} dia${d === 1 ? '' : 's'}`) : ''}${velho ? ' · peça para a pessoa abrir o sistema com internet' : ''}</small></li>`; }).join('')}</ul></section>`;
  }
  async function sincronizar(avisar) {
    if (!eu || demo()) return;
    if (sincronizando) { if (avisar) toast('Já estou enviando. Aguarde.'); return; }
    if (navigator.onLine === false) { if (avisar) toast('Ainda sem internet.'); return; }
    document.querySelectorAll('[data-sinc]').forEach(b => { b.disabled = true; b.textContent = 'Enviando…'; });
    sincronizando = true;
    try {
      const r = await SQC.fila.sincronizar(api, eu.id);
      // só busca tudo de novo se algo foi enviado, se abriu com a cópia do aparelho ou se a pessoa pediu: logo depois de entrar
      // os dados acabaram de chegar, e baixar tudo outra vez dobrava o tempo e o consumo de internet (auditoria de 14/10)
      const precisa = r.enviados || r.erros || api.offline || avisar;
      const novo = precisa ? await api.carregar() : null; const fila = await SQC.fila.listar(eu.id);
      if (novo) { if ($('#dlg').open) { espera = { db: novo, pend: fila }; }   // não troca os dados por baixo de um formulário aberto: aplica quando ele fechar
        else { trocarDb(novo); pend = fila; aplicarFila(); render(); } }
      informarFila(); if (coord()) filas = undefined;   // a lista da coordenação busca de novo na próxima vez que o painel aparecer
      const resta = (await SQC.fila.listar(eu.id)).filter(p => !p.erro).length;
      if (r.enviados) toast(r.enviados + ' lançamento(s) enviado(s).' + (resta ? ` ${resta} continuam guardados: o servidor não respondeu a tempo.` : ''));
      else if (avisar) toast(resta ? `O servidor não respondeu: ${resta} lançamento(s) continuam guardados neste aparelho. Tento de novo sozinho.` : r.erros ? 'Há lançamento que o servidor não aceitou. Corrija ou descarte.' : 'Nada para enviar.');
    } catch (e) { if (avisar) toast(e.message); }
    finally { sincronizando = false; }
  }
  function pedirSenhaNova() { authModo = 'nova'; eu = null; $('#app').hidden = true; telaAcesso(''); }

  /* ---------- cliques ---------- */
  async function aoClicar(ev) {
    const t = ev.target.closest('button,label,g[data-mapamun]'); if (!t) return; const d = t.dataset;
    if (!t.closest('dialog')) { const k = chaveFoco(t); if (k) gatilho = k; }
    if (d.auth) trocarModo(d.auth, true);
    else if (d.olho) { const c = $('#' + d.olho), mostrar = c.type === 'password'; c.type = mostrar ? 'text' : 'password'; t.setAttribute('aria-pressed', mostrar); t.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha'); }
    else if (d.demo) { try { eu = await api.entrarDemo(d.demo); await aposEntrar(); } catch (e) { telaAcesso(e.message); } }
    else if (d.tab) { tab = d.tab; try { localStorage.setItem('sqc-aba', tab); } catch (e) {} render(); window.scrollTo(0, 0); }
    else if (d.sair !== undefined) { if (pend.length && !d.ok) { d.ok = 1; t.classList.add('conf'); toast(`Há ${pend.length} lançamento(s) guardado(s) neste aparelho ainda não enviado(s). Eles ficam guardados e sobem na sua próxima entrada com internet. Toque em sair de novo para confirmar.`); return; } delete d.ok; t.classList.remove('conf'); sair(''); }
    else if (d.ajuda !== undefined) abrirAjuda();
    else if (d.relatar !== undefined) abrirRelato();
    else if (d.relatook !== undefined) await gerarRelato(t);
    else if (d.mapa) { const y = window.scrollY; mapaUF = d.mapa; mapaMun = ''; render(); window.scrollTo(0, y); }
    else if (d.mapamun !== undefined) { const y = window.scrollY, antes = mapaMun; mapaMun = d.mapamun === mapaMun ? '' : d.mapamun; render(); window.scrollTo(0, y);
      // abriu: o foco vai para os dados do município; fechou: volta para o círculo de onde veio
      const alvo = mapaMun ? document.querySelector('.mp-det') : document.querySelector(`g[data-mapamun="${CSS.escape(antes)}"]`);
      if (alvo) { if (mapaMun) alvo.setAttribute('tabindex', '-1'); alvo.focus({ preventScroll: true }); if (mapaMun && window.innerWidth < 720) alvo.scrollIntoView({ block: 'nearest' }); } }
    else if (d.expl) { const x = document.getElementById(d.expl); if (x) { const abre = x.hidden; x.hidden = !abre; t.setAttribute('aria-expanded', abre); t.classList.toggle('on', abre); } }
    else if (d.relp) { const h = hoje(), f = x => iso(x); let de_, ate_ = f(h);
      if (d.relp === 'mes') { de_ = f(new Date(h.getFullYear(), h.getMonth() - 1, 1)); ate_ = f(new Date(h.getFullYear(), h.getMonth(), 0)); }
      else if (d.relp === 'tri') de_ = f(new Date(h.getFullYear(), h.getMonth() - 3, h.getDate() + 1));
      else if (d.relp === 'ano') de_ = `${h.getFullYear()}-01-01`; else de_ = D.G0;
      if (de_ < D.G0) de_ = D.G0; rel = { de: de_, ate: ate_ }; render(); }
    else if (d.relmais) { const sc = t.closest('section'), abre = !sc.classList.contains('tudo'); sc.classList.toggle('tudo', abre); t.setAttribute('aria-expanded', abre); t.textContent = abre ? 'Mostrar só as 10 primeiras' : `Ver todas as ${d.relmais} linhas`; }
    else if (d.rel !== undefined) { const a = $('#rde').value, b = $('#rate').value; if (a && b && a <= b) { rel = { de: a, ate: b }; render(); } else toast('Confira as datas: a inicial não pode ser depois da final.'); }
    else if (d.print !== undefined) window.print();
    else if (d.ficha) abrirFicha(d.ficha);
    else if (d.new) abrir(d.new, null, d.pre);
    else if (d.fotoeqtrocar) escolherFotoEq(d.fotoeqtrocar, t);
    else if (d.fotoeqtirar) await tirarFotoEq(d.fotoeqtirar, t);
    else if (d.fichamembro) abrirFichaMembro(d.fichamembro);
    else if (d.habilitar) abrirHabilitacao(d.habilitar);
    else if (d.habsalvar !== undefined) await salvarHabilitacao(t);
    else if (d.edit) { const [m, id] = d.edit.split(':'); abrir(m, id); if (d.deslig !== undefined && $('#f_fim')) { if (!$('#f_fim').value) $('#f_fim').value = iso(hoje()); $('#f_fim').focus(); } }
    else if (d.cadeq) { if (convites === null) abrir('membros', null, d.cadeq); else abrirEscolha(d.cadeq); }
    else if (d.digitar) abrir('membros', null, d.digitar);
    else if (d.gerarlink) { t.disabled = true; try { const tk = await api.criarConvite(d.gerarlink); convites = undefined; mostrarLink(d.gerarlink, tk); render(); } catch (e) { t.disabled = false; $('#ferr').textContent = e.message; } }
    else if (d.copiarlink !== undefined) { const c = $('#lk_txt'); try { await navigator.clipboard.writeText(c.value); $('#ferr').textContent = 'Link copiado.'; } catch (e) { c.select(); $('#ferr').textContent = 'Selecionei o link: copie com Ctrl+C (ou segure o dedo e escolha Copiar).'; } }
    else if (d.cvaprovar) { const c = (convites || []).find(x => x.id === d.cvaprovar); if (c) { preMembro = { dados: c.dados || {}, convite: c.id }; abrir('membros', null, c.funcao); } }
    else if (d.cvfim) { const [id, st] = d.cvfim.split(':'); if (!d.ok) { d.ok = 1; t.textContent = st === 'recusado' ? 'Confirmar: recusar e apagar os dados' : 'Confirmar: cancelar o link'; return; } await api.conviteEncerrar(id, st); convites = undefined; render(); }
    else if (d.vercomo !== undefined) { if (coord() && !real) { real = { eu, db, tab }; db = semPessoal(db); eu = Object.assign({}, eu, { perfil: 'Acompanhamento', orgao: d.vercomo || 'SEAB/MDA' }); tab = 'painel'; nav(); render(); scrollTo(0, 0); } }
    else if (d.sairver !== undefined) { if (real) { eu = real.eu; db = real.db; tab = real.tab; real = null; nav(); render(); scrollTo(0, 0); } }
    else if (d.impok !== undefined) { if (imp) await confirmarImportacao(t); }
    else if (d.fechar !== undefined) { if (perderia()) return avisarPerda(); $('#dlg').close(); ed = null; }
    else if (d.pular !== undefined) { const v = $('#view'); v.setAttribute('tabindex', '-1'); v.focus(); }
    else if (d.ajudaentrada !== undefined) abrirAjudaEntrada();
    else if (d.geo !== undefined) pegarLocal(t);
    else if (d.geolimpar !== undefined) { ['f_lat', 'f_lng', 'f_precisao'].forEach(i => { $('#' + i).value = ''; }); $('#f_geo_t').textContent = 'Localização apagada.'; const g = $('[data-geo] span'); if (g) g.textContent = 'Pegar a localização'; t.remove(); }
    else if (d.salvarfotos !== undefined) { if (ed) { ed.depoisFotos = true; $('#frm').requestSubmit($('#fsalvar')); } }
    else if (d.aparencia !== undefined) { ed = null; $('#frm').className = 'fm'; $('#frm').innerHTML = SQC.aparencia.janela(); $('#dlg').classList.add('dlg-ap'); if ($('#dlg').open) $('#frm .fm-x').focus(); else $('#dlg').showModal(); }
    else if (d.apSol !== undefined) { SQC.aparencia.mudar('sol', !SQC.aparencia.ler().sol); $('#frm').innerHTML = SQC.aparencia.janela(); $('#frm [data-ap-sol]').focus(); }
    else if (d.apTema) { SQC.aparencia.mudar('tema', d.apTema); $('#frm').innerHTML = SQC.aparencia.janela(); $(`#frm [data-ap-tema="${d.apTema}"]`).focus(); }
    else if (d.presenca) abrirPresenca(d.presenca);
    else if (d.pradd) { t.disabled = true; try { await adicionarPresenca(d.pradd); } finally { t.disabled = false; } }
    else if (d.prdel) { if (!d.ok) { d.ok = 1; t.classList.add('conf'); t.title = 'Toque de novo para confirmar'; $('#ferr').textContent = 'Toque de novo na lixeira para tirar da lista.'; return; }
      try { await api.excluir('presencas', d.prdel); db.presencas = db.presencas.filter(x => x.id !== d.prdel); if (api.guardarCopia) api.guardarCopia(db); render(); abrirPresenca(prEv, 'Tirado da lista.'); } catch (e) { $('#ferr').textContent = e.semRede ? 'Sem internet: tente depois.' : e.message; } }
    else if (d.prcontar) { if (!d.ok) { d.ok = 1; t.textContent = 'Confirmar: trocar os participantes pelos da lista'; return; } const e = by('eventos', d.prcontar), L = db.presencas.filter(x => x.evento === d.prcontar), r = Object.assign({}, e, { part: L.length, mulheres: L.filter(x => x.mulher).length });
      const res = await gravarRegistro('eventos', r, e); render(); abrirPresenca(d.prcontar, res.ok ? 'Participantes da atividade atualizados pela lista.' : res.msg); }
    else if (d.imprimirlista) imprimirLista(d.imprimirlista);
    else if (d.imprimir) imprimirBranco(d.imprimir);
    else if (d.fotos) { if ($('#dlg').open && ed && perderia()) return avisarPerda(); const [tt, id] = d.fotos.split(':'); abrirFotos(tt, id); }
    else if (d.fotocam) { if (!demo() && navigator.onLine === false) { $('#ferr').textContent = 'Sem internet a foto não sobe, e a foto tirada por aqui não fica salva no celular. Tire com a câmera do próprio celular e anexe depois em “Escolher foto”: a data dela continua valendo.'; return; } const f = await SQC.fotodia.abrirCamera(m => { $('#ferr').textContent = m; }); if (f) await anexarFoto(d.fotocam, f, true); }
    else if (d.fotodel) { if (!d.ok) { d.ok = 1; t.classList.add('conf'); t.title = 'Toque de novo para confirmar'; $('#ferr').textContent = 'Toque de novo na lixeira para excluir a foto.'; return; }
      const f = db.fotos.find(x => x.id === d.fotodel); if (!f) return;
      try { await api.excluirFoto(f); db.fotos = db.fotos.filter(x => x.id !== f.id); if (urlsFoto[f.id]) { URL.revokeObjectURL(urlsFoto[f.id]); delete urlsFoto[f.id]; } if (api.guardarCopia) api.guardarCopia(db); render(); abrirFotos(f.tabela, f.registro, 'Foto excluída.'); } catch (e) { $('#ferr').textContent = e.semRede ? 'Sem internet: tente depois.' : e.message; } }
    else if (d.sinc !== undefined) sincronizar(true);
    else if (d.mais) { const y = window.scrollY; mostrando[d.mais] = (mostrando[d.mais] || PAGINA) + PAGINA; render(); window.scrollTo(0, y); }
    else if (d.rub) { const el = document.getElementById('rb-' + d.rub); if (el) { el.open = true; el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }
    else if (d.abrirRub !== undefined) { const todos = [...t.closest('.head').parentNode.querySelectorAll('details.rb')], abrir = todos.some(x => !x.open); todos.forEach(x => { x.open = abrir; }); t.textContent = abrir ? 'Fechar todas' : 'Abrir todas'; }
    else if (d.descartar) { if (!d.ok) { d.ok = 1; t.textContent = 'Confirmar: descartar'; return; } await SQC.fila.remover(d.descartar); await recarregarDb(); pend = await SQC.fila.listar(eu.id); aplicarFila(); render(); }
    else if (d.del) {
      const [m, id] = d.del.split(':');
      const uso = R.emUso(db, m, id).map(c => ({ presencas: 'lista de presença', fotos: 'fotos' })[c] || MOD[c].nome.toLowerCase());
      if (uso.length) { t.textContent = 'Em uso em ' + uso.join(', '); t.disabled = true; return; }
      if (!d.ok) { d.ok = 1; t.textContent = 'Confirmar exclusão'; return; }
      t.disabled = true;
      try { await api.excluir(m, id); db[m] = db[m].filter(x => x.id !== id); if (api.guardarCopia) api.guardarCopia(db); if (d.fechaapos !== undefined && $('#dlg').open) $('#dlg').close(); render(); }
      catch (e) { t.textContent = e.semRede ? 'Sem internet: tente depois' : e.message; }
    }
    else if (d.limpar !== undefined) { if (!d.ok) { d.ok = 1; t.textContent = 'Confirmar: apagar exemplos'; return; } await api.apagarExemplos(); await recarregarDb(); render(); }
    else if (d.zerar !== undefined) { if (!d.ok) { d.ok = 1; t.textContent = 'Confirmar: apagar tudo'; return; } await api.recomecar(); await recarregarDb(); render(); }
    else if (d.exp) { if (fora()) return; let qtd = 0;
      if (d.exp === 'json') { const c = {}; D.TABELAS.forEach(k => { c[k] = db[k].filter(r => !r._pendente); qtd += c[k].length; }); baixar('saberes-que-cultivam-' + iso(hoje()) + '.json', JSON.stringify(c, null, 1), 'application/json'); }
      else { qtd = db[d.exp].filter(r => !r._pendente).length; baixar(d.exp + '-' + iso(hoje()) + '.csv', csv(d.exp), 'text/csv;charset=utf-8'); }
      if (api.registrarDownload && !demo()) api.registrarDownload(d.exp, qtd);   // fica no histórico (script 21): quem baixou, quando e quantas linhas
    }
    else if (d.acessos !== undefined) { t.disabled = true; t.textContent = 'Carregando…'; try { acessos = await api.acessos(); } catch (e) { acessos = undefined; toast(e.message); } render(); }
    else if (d.hist !== undefined) { t.disabled = true; t.textContent = 'Carregando…'; try { hist = await api.auditoria(200); histFim = hist.length < 200; } catch (e) { hist = null; toast(e.message); } render(); }
    else if (d.histmais !== undefined && hist && hist.length) { t.disabled = true; t.textContent = 'Carregando…'; try { const mais = await api.auditoria(200, hist[hist.length - 1].em); hist = hist.concat(mais); histFim = mais.length < 200; } catch (e) { toast(e.message); } render(); }
    else if (d.meus !== undefined) abrirMeusDados();
    else if (d.meussalvar !== undefined) await salvarMeusContatos(t);
    else if (d.senha !== undefined && !demo()) abrirMeusDados({ senha: true });
    else if (d.senhaok !== undefined) {
      const a = $('#s1').value, b = $('#s2').value; if (a.length < 8) { $('#ferr').textContent = 'A senha precisa de pelo menos 8 caracteres.'; return; } if (a !== b) { $('#ferr').textContent = 'As duas senhas não são iguais.'; return; }
      t.disabled = true; try { await api.trocarSenha(a); $('#dlg').close(); toast('Senha trocada. Use a nova senha na próxima entrada.'); } catch (e) { $('#ferr').textContent = e.message; t.disabled = false; }
    }
  }

  /* ---------- "Meus dados" (14/10/2026, como no Mulheres & Quintais): o botão do perfil, no alto, abre os dados de quem entrou.
     Quem é da equipe muda o próprio celular e município (script 19); a coordenação também abre o cadastro completo.
     E-mail é o login: muda só pela coordenação, em Dados › acessos. ---------- */
  const meuMembro = () => { const e = R.nrm(eu && eu.email), hj = iso(hoje()); return e ? (db.membros || []).filter(m => R.nrm(m.email) === e).sort((a, b) => (!a.fim || a.fim >= hj ? 0 : 1) - (!b.fim || b.fim >= hj ? 0 : 1))[0] || null : null; };
  function abrirMeusDados(op) {
    op = op || {}; const m = fora() ? null : meuMembro(), hj = iso(hoje()), ativo = m && (!m.fim || m.fim >= hj);
    const linha = (k, v) => v ? `<dt>${k}</dt><dd>${esc(v)}</dd>` : '';
    ed = null; $('#frm').className = 'fm md';
    $('#frm').innerHTML = `<div class="fm-cab"><div><span class="fm-eye">${esc(demo() ? 'Demonstração · ' + (R.NOME_PERFIL[eu.perfil] || eu.perfil) : (R.NOME_PERFIL[eu.perfil] || eu.perfil) + (eu.orgao ? ' · ' + eu.orgao : ''))}</span><h2>Meus dados</h2></div><button type="button" class="fm-x" data-fechar aria-label="Fechar">×</button></div>
     <div class="fm-corpo">
      <section class="md-c" aria-label="Seus dados"><div class="md-t">${m && m.foto ? avatar(m, "md-av") : `<span class="md-av" aria-hidden="true">${esc(iniciais(demo() ? eu.perfil : eu.nome))}</span>`}<div><b>${esc(demo() ? eu.nome : (m && m.nome) || eu.nome)}</b><span>${esc(m ? NOME_FUNCAO[m.funcao] || '' : eu.perfil)}${m && !ativo ? ' · saiu em ' + dt(m.fim) : ''}</span></div></div>
       ${m && ativo && podeFoto(m) ? botoesFoto(m) : ''}
       <dl class="md-l">${linha('E-mail de acesso', eu.email)}${linha('Perfil no sistema', R.NOME_PERFIL[eu.perfil] || eu.perfil)}${linha('Órgão', eu.orgao)}${m ? linha('Celular', m.telefone) + linha('Município', m.municipio) + linha('Vínculo', m.vinculo) + linha('Na equipe desde', dt(m.inicio)) : ''}</dl></section>
      ${m && ativo ? `<section class="md-c" aria-labelledby="md-ed"><h3 class="fm-sec" id="md-ed">Atualizar meu celular e município</h3><div class="fields"><div class="fld"><label for="f_telefone">Celular (com DDD)</label><input id="f_telefone" autocomplete="tel" inputmode="tel" value="${esc(m.telefone || '')}"></div><div class="fld"><label for="md_mun">Município</label><input id="md_mun" autocomplete="address-level2" value="${esc(m.municipio || '')}"></div></div>
        <div class="acts"><button type="button" class="b p" data-meussalvar>Salvar meus dados</button>${coord() ? `<button type="button" class="b" data-edit="membros:${esc(m.id)}">Editar meu cadastro completo</button>` : ''}</div>
        <p class="note">Nome, função, e-mail e os dados da bolsa só a coordenação altera.</p></section>`
        : fora() ? '' : m ? `<p class="note">Seu cadastro na equipe está encerrado desde ${dt(m.fim)}. Para corrigir, fale com a coordenação.</p>` : formador() ? '<p class="note">Os dados do seu cadastro na equipe ficam com a coordenação. Para mudar celular ou município, fale com ela.</p>' : `<p class="note">Seu acesso ainda não está ligado a um cadastro da equipe (o e-mail do cadastro é diferente deste). Peça à coordenação para conferir o e-mail em Equipe.</p>`}
      ${demo() ? '<p class="note">A demonstração não usa senha.</p>' : `<details class="md-s"${op.senha ? ' open' : ''}><summary>Trocar minha senha</summary><div class="fields"><div class="fld"><label for="s1">Senha nova (mínimo 8 caracteres)</label><input id="s1" type="password" autocomplete="new-password"></div><div class="fld"><label for="s2">Repita a senha</label><input id="s2" type="password" autocomplete="new-password"></div></div><div class="acts"><button type="button" class="b p" data-senhaok>Trocar senha</button></div></details>`}
     </div>
     <div class="fm-pe"><div class="err" id="ferr" role="alert"></div><div class="ok-msg" id="fok" role="status">${esc(op.msg || '')}</div><div class="frow md-pe"><button type="button" class="b p" data-fechar>Voltar ao sistema</button><button type="button" class="b" data-sair>Sair do sistema</button></div></div>`;
    if (SQC.mascaras) SQC.mascaras.preparar($('#frm')); carregarFotosEq();
    if ($('#dlg').open) $('#frm .fm-x').focus(); else $('#dlg').showModal();
    if (op.senha) { const s1 = $('#s1'); if (s1) s1.focus(); }
  }
  async function salvarMeusContatos(b) {
    const tel = $('#f_telefone').value.trim(), mun = $('#md_mun').value.trim(), dg = R.soDigitos(tel).replace(/^55(?=\d{10,11}$)/, '');
    if (tel && !/^\d{10,11}$/.test(dg)) { $('#ferr').textContent = 'Confira o celular: DDD e número, como (84) 99999-0000.'; $('#f_telefone').focus(); return; }
    b.disabled = true; b.textContent = 'Salvando…'; $('#ferr').textContent = '';
    try { await api.atualizarMeusContatos(tel, mun); const m = meuMembro(); if (m) { m.telefone = tel || null; m.municipio = mun || null; } if (api.guardarCopia) api.guardarCopia(db); render(); abrirMeusDados({ msg: 'Dados atualizados.' }); }
    catch (e) { b.disabled = false; b.textContent = 'Salvar meus dados'; $('#ferr').textContent = e.semRede ? 'Sem internet: tente de novo quando o sinal voltar.' : e.message; }
  }

  /* ---------- partida ---------- */
  async function iniciar() {
    // dentro de moldura de outro site (clickjacking): não abre. O GitHub Pages não deixa mandar o cabeçalho que proíbe isso.
    try { if (window.top !== window.self) { document.body.textContent = 'Abra o sistema direto pelo endereço oficial.'; return; } } catch (e) { document.body.textContent = 'Abra o sistema direto pelo endereço oficial.'; return; }
    api = SQC.CONFIG && SQC.CONFIG.supabaseUrl ? SQC.apiSupabase : SQC.apiDemo; SQC.api = api;
    document.addEventListener('click', ev => { aoClicar(ev).catch(e => toast(e.message || 'Algo deu errado. Tente de novo.')); });
    document.addEventListener('submit', ev => { if (ev.target.id === 'frm') aoSalvar(ev).catch(e => { $('#ferr').textContent = e.message; }); else if (ev.target.id === 'fauth') aoEntrar(ev); else if (ev.target.id === 'fpub') aoEnviarConvite(ev).catch(e => { $('#perr').textContent = e.message; }); });
    let tBusca = null;
    document.addEventListener('input', ev => { if (!ev.target.matches || !ev.target.matches('[data-histbusca]')) return; clearTimeout(tBusca);
      tBusca = setTimeout(() => { histBusca = ev.target.value.trim(); render(); const b = $('#hbusca'); if (b) { b.focus({ preventScroll: true }); b.setSelectionRange(b.value.length, b.value.length); } }, 250); });
    document.addEventListener('change', ev => { if (ev.target.matches && ev.target.matches('[data-histfiltro]')) { histFiltro = ev.target.value; render(); } });
    document.addEventListener('change', ev => {
      const e = ev.target, de = e.dataset || {};
      if (e.id === 'imp_arq') { const a = e.files && e.files[0]; e.value = ''; aoEscolherPlanilha(a); return; }
      if (e.id === 'ft_arq') { const a = e.files && e.files[0]; e.value = ''; anexarFoto(de.alvo, a, false).catch(x => { $('#ferr').textContent = x.message; }); return; }
      if (imp && (de.impSt !== undefined || de.impEt !== undefined || de.impRb !== undefined)) {
        if (de.impSt !== undefined) { imp.escolhas.status[de.impSt] = e.value; try { localStorage.setItem(CH_ST, JSON.stringify(imp.escolhas.status)); } catch (x) {} }
        else if (de.impEt !== undefined) imp.escolhas.etapa[de.impEt] = e.value; else imp.escolhas.rubrica[de.impRb] = e.value;
        const foco = Object.keys(de).find(k => /^imp/.test(k)), val = de[foco]; desenharImportacao();
        const alvo = [...document.querySelectorAll('#frm select')].find(x => x.dataset[foco] === val); if (alvo) alvo.focus(); return;
      } if (ev.target.id === 'f_tipo' && ed && ed.m === 'lotes' && !ed.id) { const t = D.TIPOS[ev.target.value]; if (t) { $('#f_dias').value = t[1]; $('#f_med').value = t[2]; } } });
    // lista de presença: Enter em qualquer campo de "Adicionar à lista" adiciona (a janela não tem botão de enviar)
    document.addEventListener('keydown', ev => { if (ev.key === 'Enter' && ev.target && /^pr_(nome|com|mun|mul)$/.test(ev.target.id) && prEv) { ev.preventDefault(); adicionarPresenca(prEv).catch(e => { $('#ferr').textContent = e.message; }); } });
    $('#dlg').addEventListener('cancel', ev => { if (perderia()) { ev.preventDefault(); avisarPerda(); } });   // Esc ou "voltar" do Android
    $('#dlg').addEventListener('close', () => { ed = null; $('#dlg').classList.remove('dlg-ap'); aplicarEspera(); const g = gatilho; setTimeout(() => devolverFoco(g), 0); });
    // abas da entrada: setas, Home e End trocam a opção (e o foco acompanha)
    document.addEventListener('keydown', ev => { const t = ev.target; if (!t.matches || !t.matches('.sg [role="tab"]')) return; const ordem = ['entrar', 'primeiro'], i = ordem.indexOf(authModo);
      const n = ev.key === 'ArrowRight' || ev.key === 'ArrowDown' ? (i + 1) % 2 : ev.key === 'ArrowLeft' || ev.key === 'ArrowUp' ? (i + 1) % 2 : ev.key === 'Home' ? 0 : ev.key === 'End' ? 1 : -1; if (n < 0) return; ev.preventDefault(); if (n !== i) trocarModo(ordem[n], true); });
    // ao digitar num campo com erro, o erro daquele campo sai
    document.addEventListener('input', ev => { const c = ev.target.closest && ev.target.closest('#fauth .cp.erro'); if (!c) return; c.classList.remove('erro'); const e = c.querySelector('.cp-e'); e.hidden = true; e.textContent = ''; ev.target.removeAttribute('aria-invalid'); ev.target.removeAttribute('aria-describedby'); });
    document.addEventListener('pointermove', aoMoverGrafico); document.addEventListener('pointerdown', aoMoverGrafico);
    document.addEventListener('toggle', ev => { if (ev.target.open && ev.target.matches && ev.target.matches('details')) abrirTarde(ev.target); }, true);
    document.addEventListener('keydown', ev => { const t = ev.target; if ((ev.key === 'Enter' || ev.key === ' ') && t.matches && t.matches('g[data-mapamun]')) { ev.preventDefault(); t.dispatchEvent(new MouseEvent('click', { bubbles: true })); } });
    document.addEventListener('change', ev => { const t = ev.target, f = t.closest && t.closest('#frm, #fpub'); if (f && /^f_(funcao|arlo|socio)$/.test(t.id)) ajustarFormMembro(f); });
    document.addEventListener('input', ev => { const t = ev.target, f = t.closest && t.closest('#frm, #fpub'); if (!f) return; if (t.id === 'f_cep') buscarCep(f); if (f.id === 'fpub') rascunhoGuardar(); });
    document.addEventListener('keydown', teclaGrafico); document.addEventListener('focusout', ev => { if (ev.target.matches && ev.target.matches('[data-rg]')) { mesTeclado = -1; const d = document.querySelector('[data-dica]'), c = document.querySelector('[data-cr]'); if (d) d.hidden = true; if (c) c.setAttribute('hidden', ''); } });
    let rz = null, larg = window.innerWidth; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (!eu || !db) return; const cruzou = (larg < 720) !== (window.innerWidth < 720); larg = window.innerWidth; if (cruzou && !$('#dlg').open) render(); else escalaDesenhos(); }, 150); });
    ['online', 'offline'].forEach(e => window.addEventListener(e, () => { if (eu) { $('#net').hidden = navigator.onLine !== false && !api.offline; if (e === 'online') sincronizar(); } }));
    // sinal fraco que "parece conectado": tenta de novo a cada 2 minutos e quando a tela volta a aparecer, enquanto houver o que enviar
    const tentarDeNovo = () => { if (eu && !demo() && pend.some(p => !p.erro) && navigator.onLine !== false && document.visibilityState !== 'hidden') sincronizar(); };
    setInterval(tentarDeNovo, 120000); document.addEventListener('visibilitychange', tentarDeNovo);
    try { const t = localStorage.getItem('sqc-aba'); if (t && TABS.some(x => x[0] === t)) tab = t; } catch (e) {}
    if (location.hash && TABS.some(x => x[0] === location.hash.slice(1))) tab = location.hash.slice(1);
    window.addEventListener('pagehide', guardarLugar);
    $('#tabs').addEventListener('scroll', bordasMenu, { passive: true }); window.addEventListener('resize', bordasMenu);
    // celular: o campo em foco não fica escondido atrás do teclado nem do rodapé da janela
    document.addEventListener('focusin', ev => { const t = ev.target, tb = t && t.closest && t.closest('#tabs'); if (tb && t.matches('[data-tab]:focus-visible')) mostrarAba(t, tb); });   // só pelo teclado: no toque/clique, rolar a barra no meio do clique tirava o botão de baixo do dedo
    document.addEventListener('focusin', ev => { const el = ev.target; if (!el.closest || !el.closest('#frm .fm-corpo') || !el.matches('input,select,textarea') || window.innerHeight > 700) return;
      setTimeout(() => { try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {} }, 300); });
    // sem internet: o aviso aparece também dentro das janelas (ficam por cima de tudo)
    const marcarRede = () => document.documentElement.classList.toggle('sem-rede', navigator.onLine === false);
    marcarRede(); window.addEventListener('online', marcarRede); window.addEventListener('offline', marcarRede);   // fechou ou recarregou a página logado: volta ao mesmo lugar
    // abriu por um link de cadastro da equipe: mostra só o formulário público, sem entrar em conta nenhuma
    const mc = /^#c=(.*)$/.exec(location.hash || ''); if (mc) { if (api.preparar) api.preparar(); return telaConvite(mc[1]); }
    try {
      eu = await api.iniciar();
      if (api.recuperando) return pedirSenhaNova();
      if (api.linkVencido && !eu) { try { history.replaceState(null, '', location.pathname); } catch (x) {} return telaAcesso('O link que você abriu já foi usado ou venceu. Peça outro em “Primeiro acesso” ou “Esqueci a senha”.'); }
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

  SQC.app = { iniciar, pedirSenhaNova, MOD, TABS, csv, toast, AJUDA, AJUDA_FORA, abas, _estado: () => ({ eu, db, pend, tab }) };
  /* depois de recarregar por causa da troca de aparência (Safari): a janela de aparência volta aberta, como a pessoa deixou */
  async function partir() {
    await iniciar();
    let volta = false; try { volta = sessionStorage.getItem('sqc-aparencia-aberta') === '1'; sessionStorage.removeItem('sqc-aparencia-aberta'); } catch (e) {}
    if (volta) setTimeout(() => { const b = [...document.querySelectorAll('[data-aparencia]')].find(x => x.offsetParent); if (b) b.click(); }, 400);
  }
  if (typeof document !== 'undefined' && !SQC.SEM_PARTIDA) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', partir); else partir(); }
})();
