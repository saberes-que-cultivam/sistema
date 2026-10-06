/* Saberes que Cultivam — modo produção: Supabase (login com e-mail e senha; dados no banco com regras de acesso).
   Quem decide o que cada perfil pode é o banco (supabase/01_criar_banco.sql). Aqui só se pede e se traduz o erro. */
(function () {
  const SQC = (window.SQC = window.SQC || {});
  const R = SQC.regras, D = SQC.dados;
  let sb = null, euCache = null;
  const CHAVE_EU = 'sqc-eu', CHAVE_DADOS = 'sqc-dados';

  const erro = e => {
    const x = new Error(R.mensagemErro(e)); x.original = e; x.code = e && e.code;
    x.semRede = !navigator.onLine || /Failed to fetch|NetworkError|Load failed|network/i.test(String((e && e.message) || e));
    return x;
  };
  const ler = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } };
  const guardar = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* aparelho cheio ou bloqueado */ } };
  const aqui = () => location.origin + location.pathname;

  /* colunas que o sistema grava em cada tabela (o resto — carimbos, código do lote — é do banco) */
  const COLUNAS = {
    pessoas: ['nome', 'email', 'perfil', 'ativo'],
    unidades: ['nome', 'sigla', 'municipio', 'uf', 'territorio', 'modelo', 'conta', 'parceiro', 'responsavel', 'obs'].concat(D.CHECK.map(c => c[0])),
    itens: ['unidade', 'descricao', 'valor', 'rubrica', 'status', 'data'],
    lotes: ['unidade', 'tipo', 'inicio', 'dias', 'qtd', 'med', 'status', 'responsavel', 'insumos', 'obs'],
    agricultores: ['nome', 'comunidade', 'municipio', 'uf', 'territorio', 'unidade', 'culturas', 'area', 'diag', 'quimico', 'gasto0', 'kit', 'kitdata'],
    distribuicoes: ['data', 'lote', 'agricultor', 'qtd', 'cultura', 'area', 'forma'],
    visitas: ['data', 'agricultor', 'tecnico', 'usou', 'vigor', 'gasto', 'obs', 'problemas'],
    eventos: ['tipo', 'data', 'tema', 'lugar', 'municipio', 'part', 'mulheres', 'link', 'obs'],
    entregas: ['etapa', 'titulo', 'data', 'link', 'obs'],
    despesas: ['data', 'etapa', 'rubrica', 'descricao', 'favorecido', 'doc', 'valor', 'status']
  };
  const BOOL = ['ativo', 'kit'].concat(D.CHECK.map(c => c[0]));
  /* só as colunas da tabela; campo vazio vira nulo (o banco não aceita '' em número e data) */
  function limpar(tabela, o) {
    const r = { id: o.id };
    COLUNAS[tabela].forEach(k => { if (k in o) r[k] = BOOL.includes(k) ? !!o[k] : (o[k] === '' || o[k] === undefined ? null : o[k]); });
    return r;
  }
  /* o Supabase devolve no máximo 1.000 linhas por pedido: busca em partes até acabar */
  async function todas(tabela) {
    let tudo = [];
    for (let de = 0; de < 100000;) {
      const { data, error } = await sb.from(tabela).select('*').order('criado_em', { ascending: true }).order('id', { ascending: true }).range(de, de + 999);
      if (error) throw erro(error);
      tudo = tudo.concat(data || []); de += (data || []).length;
      if (!data || data.length < 1000) break;
    }
    return tudo;
  }

  SQC.apiSupabase = {
    modo: 'supabase', offline: false, recuperando: false,
    async iniciar() {
      sb = window.supabase.createClient(SQC.CONFIG.supabaseUrl, SQC.CONFIG.supabaseAnonKey, { auth: { persistSession: true, detectSessionInUrl: true } });
      // voltou pelo link de "esqueci a senha": a tela pede a senha nova antes de qualquer coisa
      sb.auth.onAuthStateChange(ev => { if (ev === 'PASSWORD_RECOVERY') { this.recuperando = true; if (SQC.app && SQC.app.pedirSenhaNova) SQC.app.pedirSenhaNova(); } });
      let sessao = null;
      try { sessao = (await sb.auth.getSession()).data.session; } catch (e) { /* sem rede */ }
      const guardado = ler(CHAVE_EU);
      if (!sessao) {
        // sem internet a sessão pode não renovar: segue com o perfil guardado para trabalhar no campo
        if (!navigator.onLine && guardado) { this.offline = true; euCache = guardado; return guardado; }
        return null;
      }
      try { return await this.eu(true); }
      catch (e) { if (guardado && (e.semRede || !navigator.onLine)) { this.offline = true; euCache = guardado; return guardado; } throw e; }
    },
    async eu(forcar) {
      if (euCache && !forcar) return euCache;
      const { data, error } = await sb.rpc('vincular_conta');
      if (error) throw erro(error);
      euCache = data && data.id ? data : null;
      guardar(CHAVE_EU, euCache); this.offline = false;
      return euCache;
    },
    async entrar(email, senha) {
      const { error } = await sb.auth.signInWithPassword({ email: String(email).trim().toLowerCase(), password: senha });
      if (error) throw erro(error);
      const eu = await this.eu(true);
      if (!eu) { await sb.auth.signOut(); throw erro({ code: 'P0001', message: 'Este e-mail não tem acesso ativo ao sistema. Fale com a coordenação.' }); }
      return eu;
    },
    /* primeiro acesso: a pessoa cria a própria senha. O banco só aceita e-mail que a coordenação cadastrou;
       o Supabase manda um e-mail de confirmação (é o que garante que a senha é de quem recebe aquele e-mail). */
    async criarSenha(email, senha) {
      const { data, error } = await sb.auth.signUp({ email: String(email).trim().toLowerCase(), password: senha, options: { emailRedirectTo: aqui() } });
      if (error) {
        if (/não cadastrado|Database error/i.test(String(error.message))) throw erro({ code: 'P0001', message: 'Este e-mail não está cadastrado no projeto. Peça à coordenação para cadastrar o seu acesso.' });
        throw erro(error);
      }
      // e-mail que já tem conta: o Supabase responde "ok" sem criar nada (não revela quem tem conta); dá para notar pela lista vazia
      if (data && data.user && Array.isArray(data.user.identities) && !data.user.identities.length) throw erro({ code: 'P0001', message: 'Este e-mail já tem senha criada. Use "Entrar" ou "Esqueci a senha".' });
      if (data && data.session) return { entrou: true, eu: await this.eu(true) };
      return { entrou: false };
    },
    async esqueci(email) {
      const { error } = await sb.auth.resetPasswordForEmail(String(email).trim().toLowerCase(), { redirectTo: aqui() });
      if (error) throw erro(error);
    },
    async trocarSenha(nova) {
      const { error } = await sb.auth.updateUser({ password: nova });
      if (error) throw erro(error);
      this.recuperando = false;
    },
    async sair() {
      euCache = null; guardar(CHAVE_EU, null); guardar(CHAVE_DADOS, null);   // dados de agricultores não ficam no aparelho depois de sair
      try { await sb.auth.signOut(); } catch (e) { /* sem rede: a sessão local já foi apagada */ }
    },
    /* tudo de uma vez (o projeto é pequeno). Sem rede, devolve a última cópia guardada no aparelho. */
    async carregar() {
      try {
        const listas = await Promise.all(D.TABELAS.map(todas));
        const db = {}; D.TABELAS.forEach((t, i) => { db[t] = listas[i]; });
        guardar(CHAVE_DADOS, db); this.offline = false; return db;
      } catch (e) {
        const g = ler(CHAVE_DADOS);
        if (g && e.semRede) { this.offline = true; D.TABELAS.forEach(t => { if (!Array.isArray(g[t])) g[t] = []; }); return g; }
        throw e;
      }
    },
    /* UPDATE quando já existe, INSERT quando é novo (reenviar o mesmo registro da fila não duplica) */
    async salvar(tabela, reg) {
      const r = limpar(tabela, reg); const { id, ...campos } = r;
      const up = await sb.from(tabela).update(campos).eq('id', id).select();
      if (up.error) throw erro(up.error);
      if (up.data && up.data.length) return up.data[0];
      const ins = await sb.from(tabela).insert(r).select().single();
      if (ins.error) throw erro(ins.error);
      return ins.data;
    },
    async excluir(tabela, id) {
      const { data, error } = await sb.from(tabela).delete().eq('id', id).select('id');
      if (error) throw erro(error);
      if (!data || !data.length) throw erro({ code: '42501', message: 'permission denied' });
    },
    /* histórico (só a coordenação enxerga; para os outros o banco devolve lista vazia) */
    async auditoria(limite) {
      const { data, error } = await sb.from('auditoria').select('*').order('em', { ascending: false }).limit(limite || 200);
      if (error) throw erro(error);
      return data || [];
    },
    guardarCopia(db) { guardar(CHAVE_DADOS, db); },
    COLUNAS, limpar
  };
})();
