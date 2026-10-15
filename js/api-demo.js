/* Saberes que Cultivam — modo demonstração: sem servidor, dados só neste navegador.
   Vale quando js/config.js está com supabaseUrl vazio. Serve para conhecer e testar as telas.
   Os registros marcados com ex:1 são FICTÍCIOS (aparecem com a etiqueta "exemplo"). */
(function () {
  const G = typeof window !== 'undefined' ? window : globalThis;
  const SQC = (G.SQC = G.SQC || {});
  const R = SQC.regras, D = SQC.dados;
  const SIM = SQC.SIMULACAO, CHAVE = SIM ? 'sqc-sim-v1-' + SIM.dia : 'sqc-demo-v1';   // simulação (js/simulacao.js): guarda à parte, uma por data
  const mem = {};   // usado quando o navegador bloqueia o armazenamento (e nos testes)
  const ler = k => { try { const v = G.localStorage.getItem(k); return v == null ? (k in mem ? mem[k] : null) : v; } catch (e) { return k in mem ? mem[k] : null; } };
  const gravar = (k, v) => { mem[k] = v; try { G.localStorage.setItem(k, v); } catch (e) { /* fica só na memória */ } };

  const semente = hoje => SIM && SQC.simular ? SQC.simular(sementeBase(hoje)) : sementeBase(hoje);
  function sementeBase(hoje) {
    hoje = hoje || new Date(); const atras = n => R.iso(new Date(hoje.getTime() - n * 864e5));
    return {
      membros: [
        { id: 'q1', ex: 1, lgpd: true, arlo: 'Sim', outra_bolsa: 'Não', funcao: 'coordenacao', nome: 'Coordenador de exemplo', vinculo: 'IFRN Campus Apodi', email: 'coordenacao@exemplo.br', telefone: '(00) 00000-0000', municipio: 'Apodi/RN', inicio: '2026-08-01' },
        { id: 'q2', ex: 1, lgpd: true, funcao: 'discente', nome: 'Bolsista de exemplo (saiu)', vinculo: 'Tecnologia em Agroecologia', inicio: '2026-08-10', fim: atras(20), motivo: 'Concluiu o curso' }],
      pessoas: [
        { id: 'p-coord', nome: 'Coordenação (demonstração)', email: 'coordenacao@exemplo.br', perfil: 'Coordenação', ativo: true },
        { id: 'p-equipe', nome: 'Equipe (demonstração)', email: 'equipe@exemplo.br', perfil: 'Equipe', ativo: true },
        { id: 'p-mda', nome: 'Acompanhamento (demonstração)', email: 'acompanhamento@exemplo.br', perfil: 'Acompanhamento', orgao: 'SEAB/MDA', ativo: true },
        { id: 'p-aux', nome: 'Auxiliar administrativo (demonstração)', email: 'auxiliar@exemplo.br', perfil: 'Auxiliar', ativo: true },
        { id: 'p-form', nome: 'Formador(a) (demonstração)', email: 'formador@exemplo.br', perfil: 'Formador', ativo: true }],
      unidades: [
        { id: 'u1', nome: 'Polo São Paulo do Potengi', sigla: 'SPP', municipio: 'São Paulo do Potengi', uf: 'RN', territorio: 'Potengi/RN', modelo: 'A definir', conta: 'Sim', parceiro: '', responsavel: '', obs: 'Ata 22/2026: microrganismos isolados se houver local adequado; senão, área aberta com cobertura.' },
        { id: 'u2', nome: 'Polo Mulungu', sigla: 'MUL', municipio: 'Mulungu', uf: 'CE', territorio: 'Maciço de Baturité/CE', modelo: 'A definir', conta: 'Sim', parceiro: '', responsavel: '', obs: 'Ata 22/2026: mesma regra do polo de São Paulo do Potengi.' },
        { id: 'u3', nome: 'Base IFRN Campus Apodi (minhocário)', sigla: 'APO', municipio: 'Apodi', uf: 'RN', territorio: 'Sertão do Apodi/RN', modelo: 'Área aberta com cobertura (compostagem e biofertilizantes)', conta: 'Não', parceiro: 'IFRN Campus Apodi', responsavel: '', local_ok: true, parceiro_ok: true, obs: 'Área da fazenda com piso concretado; laboratório do campus como apoio.' }],
      itens: [],
      lotes: [
        { id: 'l1', ex: 1, codigo: 'APO-HUM-001', unidade: 'u3', tipo: 'Húmus de minhoca', inicio: atras(70), dias: 60, qtd: 180, med: 'kg', insumos: 'Esterco bovino curtido, restos de capina', responsavel: '', status: 'Pronto', obs: 'Odor de terra, sem aquecimento' },
        { id: 'l2', ex: 1, codigo: 'APO-BIO-001', unidade: 'u3', tipo: 'Biofertilizante líquido', inicio: atras(12), dias: 30, qtd: 200, med: 'L', insumos: 'Esterco fresco, melaço, leite, cinzas, água sem cloro', responsavel: '', status: 'Maturando', obs: '' }],
      agricultores: [
        { id: 'a1', ex: 1, nome: 'Maria das Dores (exemplo)', comunidade: 'Assentamento vizinho ao campus', municipio: 'Apodi', uf: 'RN', territorio: 'Outro', unidade: 'u3', culturas: 'Hortaliças, milho, feijão', area: 1.5, quimico: 'Parcial', gasto0: 180, diag: atras(60), kit: true, kitdata: atras(20) },
        { id: 'a2', ex: 1, nome: 'José Raimundo (exemplo)', comunidade: 'Assentamento vizinho ao campus', municipio: 'Apodi', uf: 'RN', territorio: 'Outro', unidade: 'u3', culturas: 'Banana, macaxeira', area: 2, quimico: 'Sim', gasto0: 320, diag: atras(60), kit: false, kitdata: '' },
        { id: 'a3', ex: 1, nome: 'Francisca Lima (exemplo)', comunidade: 'Sítio Lagoa', municipio: 'Apodi', uf: 'RN', territorio: 'Outro', unidade: 'u3', culturas: 'Hortaliças', area: 0.5, quimico: 'Não', gasto0: 0, diag: '', kit: false, kitdata: '' }],
      distribuicoes: [
        { id: 'd1', ex: 1, data: atras(8), lote: 'l1', agricultor: 'a1', qtd: 40, cultura: 'Hortaliças', area: 0.3, forma: 'No solo' },
        { id: 'd2', ex: 1, data: atras(45), lote: 'l1', agricultor: 'a2', qtd: 60, cultura: 'Banana', area: 0.5, forma: 'No solo' }],
      visitas: [
        { id: 'v1', ex: 1, data: atras(2), agricultor: 'a1', tecnico: '', usou: 'Sim', vigor: 4, gasto: 120, obs: 'Canteiros com melhor retenção de umidade', problemas: '' }],
      eventos: [
        { id: 'e1', tipo: 'Articulação', data: '2026-09-03', tema: 'Encontro da Rede BioAF (SEAB/MDA) na Expointer', lugar: 'Parque de Exposições Assis Brasil', municipio: 'Esteio/RS', part: '', mulheres: '', link: '', obs: 'Participação da coordenação, 03 e 04/09/2026.' },
        { id: 'e2', tipo: 'Reunião', data: '2026-09-08', tema: 'Informes da Rede BioAF e planejamento das unidades de produção', lugar: 'Google Meet', municipio: '', part: 2, mulheres: 0, link: '', obs: 'Ata 22/2026 - DG/AP/RE/IFRN.' }],
      despesas: [
        { id: 'x1', ex: 1, data: atras(25), etapa: '3.1', rubrica: 'servicos_pj', item: 'i09', descricao: 'Impressão de cartilhas (exemplo)', favorecido: 'Gráfica', doc: 'NF 0000', valor: 1800, status: 'Pago' },
        { id: 'x2', ex: 1, data: atras(10), etapa: '6.1', rubrica: 'consumo', descricao: 'Material para feira e oficinas (exemplo)', favorecido: '', doc: '', valor: 2400, status: 'Em compras na FUNCERN' }],
      presencas: [], fotos: [],
      entregas: [
        { id: 'g1', etapa: '6.3', titulo: 'Contrato 220/2026 com a FUNCERN; 1ª parcela de R$ 200.000,00 liquidada (2026NS001323)', data: '2026-09-22', link: '', obs: 'Contrato assinado em 20/08/2026.' }]
    };
  }

  let db = null, eu = null;
  function carregarLocal() {
    if (SIM && SQC.simularPlano) SQC.simularPlano();
    try { db = JSON.parse(ler(CHAVE)); } catch (e) { db = null; }
    const s = semente(); if (!db || !Array.isArray(db.unidades)) db = s;
    D.TABELAS.forEach(t => { if (!Array.isArray(db[t])) db[t] = s[t]; });
    ['Acompanhamento', 'Auxiliar', 'Formador'].forEach(pf => { if (!db.pessoas.some(p => p.perfil === pf)) db.pessoas.push(s.pessoas.find(p => p.perfil === pf)); });   // demonstração criada antes desses perfis existirem
    return db;
  }
  const persistir = () => gravar(CHAVE, JSON.stringify(db));
  const falha = msg => { const e = new Error(msg); e.code = 'P0001'; return e; };

  SQC.apiDemo = {
    modo: 'demo', semente,
    async iniciar() {
      carregarLocal(); const id = ler(CHAVE + '-eu'); eu = db.pessoas.find(p => p.id === id && p.ativo !== false) || null; return eu;
    },
    async entrarDemo(perfil) {
      carregarLocal(); eu = db.pessoas.find(p => p.perfil === perfil && p.ativo !== false) || null;
      if (!eu) throw falha('Não há acesso ativo com esse perfil na demonstração.');
      gravar(CHAVE + '-eu', eu.id); return eu;
    },
    async atualizarMeusContatos(telefone, municipio) {
      if (!db) carregarLocal(); const e = String((eu && eu.email) || '').trim().toLowerCase(), hj = new Date().toISOString().slice(0, 10);
      const L = db.membros.filter(m => String(m.email || '').trim().toLowerCase() === e && (!m.fim || m.fim >= hj));
      if (!L.length) throw falha('Seu cadastro na equipe não está ligado a este e-mail. Peça à coordenação para conferir o e-mail no cadastro.');
      L.forEach(m => { m.telefone = telefone || null; m.municipio = municipio || null; m.atualizado_em = new Date().toISOString(); }); persistir();
    },
    async habilitar(id, arlo, termoEm) {
      if (!eu || !['Coordenação', 'Auxiliar'].includes(eu.perfil)) throw falha('Só a coordenação e o auxiliar administrativo marcam a habilitação.');
      const m = db.membros.find(x => x.id === id); if (!m) throw falha(R.MSG_EXCLUIDO);
      m.arlo = arlo || null; m.termo_em = termoEm || null; m.atualizado_em = new Date().toISOString(); persistir(); return JSON.parse(JSON.stringify(m));
    },
    /* foto da equipe na demonstração: guardada no próprio navegador (imagem pequena, 320 px) */
    async fotoEquipe(caminho) { return caminho; },
    async trocarFotoEquipe(membro, blob) {
      if (!eu || !(eu.perfil === 'Coordenação' || (db.membros.find(m => m.id === membro) || {}).email === eu.email)) throw falha('Só a própria pessoa ou a coordenação trocam esta foto.');
      const url = await new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => no(falha('Não foi possível ler a foto.')); r.readAsDataURL(blob); });
      const m = db.membros.find(x => x.id === membro); m.foto = url; persistir(); return url;
    },
    /* documento das entregas na demonstração: o arquivo fica só na memória enquanto a página está aberta (o nome fica gravado) */
    _docs: {},
    async enviarDocumento(entrega, arquivo) {
      if (!eu || !['Coordenação', 'Equipe'].includes(eu.perfil)) throw falha('Só a equipe do projeto anexa documento às entregas.');
      const msg = R.validarDocumento(arquivo); if (msg) throw falha(msg);
      const g = db.entregas.find(x => x.id === entrega); if (!g) throw falha(R.MSG_EXCLUIDO);
      const caminho = `${entrega}/${SQC.novoId()}.${R.extDocumento(arquivo.name)}`; this._docs[caminho] = arquivo;
      g.arquivo = caminho; g.arquivo_nome = String(arquivo.name || '').slice(0, 200); g.atualizado_em = new Date().toISOString(); persistir(); return caminho;
    },
    async tirarDocumento(entrega) { const g = db.entregas.find(x => x.id === entrega); if (g) { g.arquivo = null; g.arquivo_nome = null; persistir(); } },
    async urlDocumento(caminho) { const a = this._docs[caminho]; if (!a) throw falha('Na demonstração o arquivo fica só enquanto a página está aberta. Envie de novo para ver.'); return URL.createObjectURL(a); },
    async tirarFotoEquipe(membro) { const m = db.membros.find(x => x.id === membro); if (m) { m.foto = null; persistir(); } },
    async sair() { eu = null; gravar(CHAVE + '-eu', ''); },
    /* igual ao banco de verdade: quem acompanha de fora recebe as unidades produtivas numeradas e as visitas sem texto livre */
    async carregar() {
      const c = JSON.parse(JSON.stringify(carregarLocal()));
      const pf = eu ? eu.perfil : '';
      if (pf === 'Auxiliar' || pf === 'Formador') {   // como no banco (23): unidades produtivas numeradas, visitas sem texto; cada um só o que é seu
        c.agricultores = [...c.agricultores].sort((a, b) => String(a.criado_em || '') < String(b.criado_em || '') ? -1 : 1).map((a, i) => ({ id: a.id, nome: 'Unidade produtiva ' + String(i + 1).padStart(2, '0'), municipio: a.municipio, uf: a.uf, territorio: a.territorio, unidade: a.unidade, area: a.area, diag: a.diag, quimico: a.quimico, gasto0: a.gasto0, kit: a.kit, kitdata: a.kitdata, criado_em: a.criado_em, ex: a.ex }));
        c.visitas = c.visitas.map(v => ({ id: v.id, data: v.data, agricultor: v.agricultor, usou: v.usou, vigor: v.vigor, gasto: v.gasto, ex: v.ex }));
        c.pessoas = c.pessoas.filter(p => p.id === eu.id);
        if (pf === 'Auxiliar') { c.presencas = []; c.fotos = []; c.eventos = c.eventos.map(e => { const x = Object.assign({}, e); delete x.link; delete x.obs; return x; }); }
        else { c.despesas = []; c.membros = []; c.fotos = c.fotos.filter(f => f.tabela === 'eventos'); c.itens = c.itens.map(i => { const x = Object.assign({}, i); delete x.valor; delete x.rubrica; return x; }); }
      }
      if (eu && eu.perfil === 'Acompanhamento') {
        c.agricultores = c.agricultores.map((a, i) => ({ id: a.id, nome: 'Unidade produtiva ' + String(i + 1).padStart(2, '0'), municipio: a.municipio, uf: a.uf, territorio: a.territorio, unidade: a.unidade, area: a.area, diag: a.diag, quimico: a.quimico, gasto0: a.gasto0, kit: a.kit, kitdata: a.kitdata, ex: a.ex }));
        c.visitas = c.visitas.map(v => ({ id: v.id, data: v.data, agricultor: v.agricultor, usou: v.usou, vigor: v.vigor, gasto: v.gasto, ex: v.ex }));
        c.pessoas = c.pessoas.filter(p => p.id === eu.id); c.membros = []; c.presencas = []; c.fotos = [];
        c.despesas = []; c.itens = c.itens.map(i => { const x = Object.assign({}, i); delete x.valor; delete x.rubrica; return x; });   // como no banco (script 16): sem despesas; itens sem valor
        c.eventos = c.eventos.map(e => { const x = Object.assign({}, e); delete x.link; delete x.obs; return x; });   // como no banco (script 15)
      }
      if (eu && !['Coordenação', 'Auxiliar'].includes(eu.perfil)) c.membros = c.membros.map(m => { const x = Object.assign({}, m); R.CAMPOS_RESERVADOS.forEach(k => { delete x[k]; }); return x; });   // como no banco: dado reservado só para a coordenação
      return c;
    },
    async salvar(tabela, reg) {
      if (!db) carregarLocal();
      if (!R.podeGravar(eu, tabela)) throw falha('O seu perfil não tem permissão para fazer isso.');
      const i = db[tabela].findIndex(x => x.id === reg.id); const ant = i >= 0 ? db[tabela][i] : null;
      const r = Object.assign({}, ant || {}, reg); delete r._pendente; delete r._erro;
      const msg = R.validar(db, tabela, r, ant); if (msg) throw falha(msg);
      if (!ant) { r.id = r.id || SQC.novoId(); r.criado_por = eu.id; r.criado_em = new Date().toISOString(); if (tabela === 'lotes') r.codigo = R.codigoLote(db, r); }
      else { r.criado_por = ant.criado_por; r.criado_em = ant.criado_em; if (tabela === 'lotes') r.codigo = ant.codigo; }
      r.atualizado_em = new Date().toISOString();
      if (ant) db[tabela][i] = r; else db[tabela].push(r);
      persistir(); if (eu && r.id === eu.id) eu = r;
      return JSON.parse(JSON.stringify(r));
    },
    async excluir(tabela, id) {
      const r = db[tabela].find(x => x.id === id); if (!r) return;
      if (tabela === 'pessoas') throw falha('Acesso não se exclui: desative.');
      if (!R.podeExcluir(eu, tabela, r)) throw falha('Só a coordenação ou quem lançou pode excluir este registro.');
      if (R.emUso(db, tabela, id).length) { const e = new Error('em uso'); e.code = '23503'; throw e; }
      db[tabela] = db[tabela].filter(x => x.id !== id); persistir();
    },
    /* demonstração: alguns registros fictícios, montados com os dados de exemplo, para mostrar como o histórico aparece */
    async auditoria(limite, antes) {
      if (!db) carregarLocal(); if (antes) return [];
      const quem = (db.pessoas.find(p => p.perfil === 'Coordenação') || {}).id, eqp = (db.pessoas.find(p => p.perfil === 'Equipe') || {}).id, h = Date.now(), H = [];
      const em = horas => new Date(h - horas * 3600e3).toISOString(), l = db.lotes[0], u = db.unidades[0], v = db.visitas[0];
      if (l) H.push({ id: 1, tabela: 'lotes', registro_id: l.id, acao: 'UPDATE', por: eqp, em: em(2), antes: Object.assign({}, l, { status: 'Maturando' }), depois: l });
      H.push({ id: 2, tabela: 'planilhas', acao: 'PLANILHA', por: quem, em: em(5), depois: { tipo: 'agricultores', qtd: db.agricultores.length } });
      if (v) H.push({ id: 3, tabela: 'visitas', registro_id: v.id, acao: 'INSERT', por: eqp, em: em(27), depois: v });
      if (u) H.push({ id: 4, tabela: 'unidades', registro_id: u.id, acao: 'UPDATE', por: quem, em: em(50), antes: Object.assign({}, u, { local_ok: false }), depois: u });
      H.push({ id: 5, tabela: 'planilhas', acao: 'PLANILHA', por: quem, em: em(75), depois: { tipo: 'json', qtd: D.TABELAS.reduce((t, k) => t + (db[k] || []).length, 0) } });
      return H.slice(0, limite || 200);
    },
    async registrarDownload() { /* a demonstração não guarda histórico */ },
    async informarFila() {},
    async listarFila() {   // demonstração: um exemplo fixo, para a coordenação ver como aparece
      if (!eu || eu.perfil !== 'Coordenação' || SIM) return [];
      return [{ pessoa: 'p-equipe', nome: 'Equipe (demonstração)', quantos: 3, recusados: 1, desde: new Date(Date.now() - 3 * 864e5).toISOString(), informado_em: new Date(Date.now() - 2 * 3600e3).toISOString(), ex: 1 }];
    },
    /* fotos na demonstração: a imagem fica só na memória desta página (não ocupa o armazenamento do navegador) */
    _img: {},
    async enviarFoto(tabela, registro, blob, tiradaEm, legenda) {
      if (!R.podeGravar(eu, 'fotos')) throw falha('O seu perfil não tem permissão para fazer isso.');
      if (!(db[tabela] || []).some(x => x.id === registro)) throw falha('A atividade ou visita desta foto não existe mais.');
      const id = SQC.novoId(); this._img[id] = blob;
      return this.salvar('fotos', { id, tabela, registro, caminho: `${tabela}/${registro}/${id}.jpg`, tirada_em: tiradaEm || null, legenda: legenda || null });
    },
    async arquivoFoto(f) { if (!this._img[f.id]) throw falha('Na demonstração a imagem fica só enquanto a página está aberta.'); return this._img[f.id]; },
    async excluirFoto(f) { await this.excluir('fotos', f.id); delete this._img[f.id]; },
    /* link de cadastro, simulado neste navegador (na demonstração o "banco" é o próprio aparelho) */
    preparar() {},
    _cv(g) { const K = 'sqc-demo-convites'; let l = []; try { l = JSON.parse(ler(K)) || []; } catch (e) { l = []; } if (g) { const n = g(l); gravar(K, JSON.stringify(n)); return n; } return l; },
    async convites() { if (!eu || eu.perfil !== 'Coordenação') return []; return this._cv().filter(c => c.status === 'preenchido' || (c.status === 'aberto' && new Date(c.expira_em) > new Date())).map(c => ({ id: c.id, funcao: c.funcao, status: c.status, dados: c.dados, expira_em: c.expira_em, preenchido_em: c.preenchido_em, criado_em: c.criado_em })); },
    async criarConvite(funcao) { if (!eu || eu.perfil !== 'Coordenação') throw falha('Só a coordenação gera link de cadastro.'); const token = (SQC.novoId() + SQC.novoId()).replace(/-/g, '');
      this._cv(l => l.concat([{ id: SQC.novoId(), funcao, token, status: 'aberto', dados: null, expira_em: new Date(Date.now() + 7 * 864e5).toISOString(), criado_em: new Date().toISOString() }])); return token; },
    async conviteVer(token) { const c = this._cv().find(x => x.token === token && x.status === 'aberto' && new Date(x.expira_em) > new Date()); return c ? c.funcao : null; },
    async conviteEnviar(token, dados) { let ok = false; const limpo = {}; R.CAMPOS_CONVITE.forEach(k => { if (k in dados && String(dados[k]).length <= 300) limpo[k] = dados[k]; });
      const fn = (this._cv().find(x => x.token === token) || {}).funcao; const msg = R.validarConvite(limpo, fn); if (msg) throw falha(msg);
      this._cv(l => l.map(c => { if (c.token === token && c.status === 'aberto' && new Date(c.expira_em) > new Date()) { ok = true; return Object.assign({}, c, { status: 'preenchido', dados: limpo, preenchido_em: new Date().toISOString() }); } return c; }));
      if (!ok) throw falha('Este link já foi usado ou venceu. Peça outro à coordenação do projeto.'); },
    async conviteEncerrar(id, status) { if (!eu || eu.perfil !== 'Coordenação') throw falha('Só a coordenação encerra convite.'); this._cv(l => l.map(c => c.id === id ? Object.assign({}, c, { status, dados: null }) : c)); },
    async acessos() { if (!db) carregarLocal(); return eu && eu.perfil === 'Coordenação' ? db.pessoas.map((p, i) => ({ id: p.id, nome: p.nome, perfil: p.perfil, orgao: p.orgao, ativo: p.ativo !== false, ultimo: p.id === eu.id ? new Date().toISOString() : i === 1 ? new Date(Date.now() - 12 * 864e5).toISOString() : null })) : []; },
    /* só na demonstração */
    async apagarExemplos() {
      ['distribuicoes', 'visitas', 'lotes', 'agricultores', 'eventos', 'entregas', 'itens', 'despesas', 'membros'].forEach(t => { db[t] = db[t].filter(r => !r.ex); });
      db.distribuicoes = db.distribuicoes.filter(x => db.lotes.some(l => l.id === x.lote) && db.agricultores.some(a => a.id === x.agricultor));
      db.visitas = db.visitas.filter(x => db.agricultores.some(a => a.id === x.agricultor));
      db.presencas = (db.presencas || []).filter(x => db.eventos.some(e => e.id === x.evento));
      db.fotos = (db.fotos || []).filter(x => (db[x.tabela] || []).some(r => r.id === x.registro)); persistir();
    },
    async recomecar() { const p = db.pessoas; db = semente(); db.pessoas = p; persistir(); },
    _db: () => db, _zerar() { db = null; eu = null; Object.keys(mem).forEach(k => delete mem[k]); try { G.localStorage.removeItem(CHAVE); G.localStorage.removeItem(CHAVE + '-eu'); } catch (e) {} }
  };
})();
