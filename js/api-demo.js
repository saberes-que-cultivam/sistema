/* Saberes que Cultivam — modo demonstração: sem servidor, dados só neste navegador.
   Vale quando js/config.js está com supabaseUrl vazio. Serve para conhecer e testar as telas.
   Os registros marcados com ex:1 são FICTÍCIOS (aparecem com a etiqueta "exemplo"). */
(function () {
  const G = typeof window !== 'undefined' ? window : globalThis;
  const SQC = (G.SQC = G.SQC || {});
  const R = SQC.regras, D = SQC.dados;
  const CHAVE = 'sqc-demo-v1';
  const mem = {};   // usado quando o navegador bloqueia o armazenamento (e nos testes)
  const ler = k => { try { const v = G.localStorage.getItem(k); return v == null ? (k in mem ? mem[k] : null) : v; } catch (e) { return k in mem ? mem[k] : null; } };
  const gravar = (k, v) => { mem[k] = v; try { G.localStorage.setItem(k, v); } catch (e) { /* fica só na memória */ } };

  function semente(hoje) {
    hoje = hoje || new Date(); const atras = n => R.iso(new Date(hoje.getTime() - n * 864e5));
    return {
      membros: [
        { id: 'q1', ex: 1, lgpd: true, arlo: 'Sim', outra_bolsa: 'Não', funcao: 'coordenacao', nome: 'Coordenador de exemplo', vinculo: 'IFRN Campus Apodi', email: 'coordenador@exemplo.invalid', telefone: '(00) 00000-0000', municipio: 'Apodi/RN', inicio: '2026-08-01' },
        { id: 'q2', ex: 1, lgpd: true, funcao: 'discente', nome: 'Bolsista de exemplo (saiu)', vinculo: 'Tecnologia em Agroecologia', inicio: '2026-08-10', fim: atras(20), motivo: 'Concluiu o curso' }],
      pessoas: [
        { id: 'p-coord', nome: 'Coordenação (demonstração)', email: 'coordenacao@exemplo.br', perfil: 'Coordenação', ativo: true },
        { id: 'p-equipe', nome: 'Equipe (demonstração)', email: 'equipe@exemplo.br', perfil: 'Equipe', ativo: true },
        { id: 'p-mda', nome: 'Acompanhamento (demonstração)', email: 'acompanhamento@exemplo.br', perfil: 'Acompanhamento', orgao: 'SEAB/MDA', ativo: true }],
      unidades: [
        { id: 'u1', nome: 'Polo São Paulo do Potengi', sigla: 'SPP', municipio: 'São Paulo do Potengi', uf: 'RN', territorio: 'Potengi/RN', modelo: 'A definir', conta: 'Sim', parceiro: '', responsavel: '', obs: 'Ata 22/2026: microrganismos isolados se houver local adequado; senão, área aberta com cobertura.' },
        { id: 'u2', nome: 'Polo Mulungu', sigla: 'MUL', municipio: 'Mulungu', uf: 'CE', territorio: 'Maciço de Baturité/CE', modelo: 'A definir', conta: 'Sim', parceiro: '', responsavel: '', obs: 'Ata 22/2026: mesma regra do polo de São Paulo do Potengi.' },
        { id: 'u3', nome: 'Base IFRN Campus Apodi (minhocário)', sigla: 'APO', municipio: 'Apodi', uf: 'RN', territorio: 'Outro', modelo: 'Área aberta com cobertura (compostagem e biofertilizantes)', conta: 'Não', parceiro: 'IFRN Campus Apodi', responsavel: '', local_ok: true, parceiro_ok: true, obs: 'Área da fazenda com piso concretado; laboratório do campus como apoio.' }],
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
      entregas: [
        { id: 'g1', etapa: '6.3', titulo: 'Contrato 220/2026 com a FUNCERN; 1ª parcela de R$ 200.000,00 liquidada (2026NS001323)', data: '2026-09-22', link: '', obs: 'Contrato assinado em 20/08/2026.' }]
    };
  }

  let db = null, eu = null;
  function carregarLocal() {
    try { db = JSON.parse(ler(CHAVE)); } catch (e) { db = null; }
    const s = semente(); if (!db || !Array.isArray(db.unidades)) db = s;
    D.TABELAS.forEach(t => { if (!Array.isArray(db[t])) db[t] = s[t]; });
    if (!db.pessoas.some(p => p.perfil === 'Acompanhamento')) db.pessoas.push(s.pessoas.find(p => p.perfil === 'Acompanhamento'));   // demonstração criada antes desse perfil existir
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
    async sair() { eu = null; gravar(CHAVE + '-eu', ''); },
    /* igual ao banco de verdade: quem acompanha de fora recebe as unidades produtivas numeradas e as visitas sem texto livre */
    async carregar() {
      const c = JSON.parse(JSON.stringify(carregarLocal()));
      if (eu && eu.perfil === 'Acompanhamento') {
        c.agricultores = c.agricultores.map((a, i) => ({ id: a.id, nome: 'Unidade produtiva ' + String(i + 1).padStart(2, '0'), municipio: a.municipio, uf: a.uf, territorio: a.territorio, unidade: a.unidade, area: a.area, diag: a.diag, quimico: a.quimico, gasto0: a.gasto0, kit: a.kit, kitdata: a.kitdata, ex: a.ex }));
        c.visitas = c.visitas.map(v => ({ id: v.id, data: v.data, agricultor: v.agricultor, usou: v.usou, vigor: v.vigor, gasto: v.gasto, ex: v.ex }));
        c.pessoas = c.pessoas.filter(p => p.id === eu.id); c.membros = [];
      }
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
    async auditoria() { return []; },
    async acessos() { if (!db) carregarLocal(); return eu && eu.perfil === 'Coordenação' ? db.pessoas.map((p, i) => ({ id: p.id, nome: p.nome, perfil: p.perfil, orgao: p.orgao, ativo: p.ativo !== false, ultimo: p.id === eu.id ? new Date().toISOString() : i === 1 ? new Date(Date.now() - 12 * 864e5).toISOString() : null })) : []; },
    /* só na demonstração */
    async apagarExemplos() {
      ['distribuicoes', 'visitas', 'lotes', 'agricultores', 'eventos', 'entregas', 'itens', 'despesas', 'membros'].forEach(t => { db[t] = db[t].filter(r => !r.ex); });
      db.distribuicoes = db.distribuicoes.filter(x => db.lotes.some(l => l.id === x.lote) && db.agricultores.some(a => a.id === x.agricultor));
      db.visitas = db.visitas.filter(x => db.agricultores.some(a => a.id === x.agricultor)); persistir();
    },
    async recomecar() { const p = db.pessoas; db = semente(); db.pessoas = p; persistir(); },
    _db: () => db, _zerar() { db = null; eu = null; Object.keys(mem).forEach(k => delete mem[k]); try { G.localStorage.removeItem(CHAVE); G.localStorage.removeItem(CHAVE + '-eu'); } catch (e) {} }
  };
})();
