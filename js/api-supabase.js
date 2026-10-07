/* Saberes que Cultivam — modo produção: Supabase (login com e-mail e senha; dados no banco com regras de acesso).
   Quem decide o que cada perfil pode é o banco (supabase/01_criar_banco.sql). Aqui só se pede e se traduz o erro. */
(function () {
  const SQC = (window.SQC = window.SQC || {});
  const R = SQC.regras, D = SQC.dados;
  let sb = null, euCache = null, semItem = false;   // semItem: o banco ainda não tem a coluna "item" em despesas (falta rodar o script 06)
  const CHAVE_EU = 'sqc-eu', CHAVE_DADOS = 'sqc-dados', CHAVE_QUANDO = 'sqc-dados-em';
  const PRAZO_OFFLINE = 72 * 3600 * 1000;   // sem falar com o servidor há mais de 72 h, o aparelho não abre os dados guardados
  const copiaValida = () => { const t = +ler(CHAVE_QUANDO) || 0; return t > 0 && Date.now() - t < PRAZO_OFFLINE; };

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
    pessoas: ['nome', 'email', 'perfil', 'orgao', 'ativo'],
    unidades: ['nome', 'sigla', 'municipio', 'uf', 'territorio', 'modelo', 'conta', 'parceiro', 'responsavel', 'obs'].concat(D.CHECK.map(c => c[0])),
    itens: ['unidade', 'descricao', 'valor', 'rubrica', 'status', 'data'],
    lotes: ['unidade', 'tipo', 'inicio', 'dias', 'qtd', 'med', 'status', 'responsavel', 'insumos', 'obs'],
    agricultores: ['nome', 'comunidade', 'municipio', 'uf', 'territorio', 'unidade', 'culturas', 'area', 'diag', 'quimico', 'gasto0', 'kit', 'kitdata'],
    distribuicoes: ['data', 'lote', 'agricultor', 'qtd', 'cultura', 'area', 'forma'],
    visitas: ['data', 'agricultor', 'tecnico', 'usou', 'vigor', 'gasto', 'obs', 'problemas'],
    eventos: ['tipo', 'data', 'tema', 'lugar', 'municipio', 'part', 'mulheres', 'link', 'obs'],
    entregas: ['etapa', 'titulo', 'data', 'link', 'obs'],
    membros: ['funcao', 'nome', 'vinculo', 'email', 'telefone', 'municipio', 'inicio', 'fim', 'motivo', 'obs'],
    despesas: ['data', 'etapa', 'rubrica', 'item', 'descricao', 'favorecido', 'doc', 'valor', 'status']
  };
  const BOOL = ['ativo', 'kit'].concat(D.CHECK.map(c => c[0]));
  /* só as colunas da tabela; campo vazio vira nulo (o banco não aceita '' em número e data) */
  function limpar(tabela, o) {
    const r = { id: o.id };
    COLUNAS[tabela].forEach(k => { if (k === 'item' && semItem) return; if (k in o) r[k] = BOOL.includes(k) ? !!o[k] : (o[k] === '' || o[k] === undefined ? null : o[k]); });
    return r;
  }
  /* o Supabase devolve no máximo 1.000 linhas por pedido: busca em partes até acabar */
  async function todas(tabela) {
    let tudo = [];
    for (let de = 0; de < 100000;) {
      const { data, error } = await sb.from(tabela).select('*').order('criado_em', { ascending: true }).order('id', { ascending: true }).range(de, de + 999);
      if (error && tabela === 'membros' && (error.code === '42P01' || error.code === 'PGRST205' || /membros/.test(String(error.message)))) { SQC.apiSupabase.semMembros = true; return []; }   // falta rodar o script 07: o resto do sistema abre normalmente
      if (error) throw erro(error);
      tudo = tudo.concat(data || []); de += (data || []).length;
      if (!data || data.length < 1000) break;
    }
    return tudo;
  }

  SQC.apiSupabase = {
    modo: 'supabase', offline: false, recuperando: false,
    async iniciar() {
      // chegou por um link do e-mail (primeiro acesso ou senha esquecida)? então a próxima tela é a de criar a senha
      const h = String(location.hash || ''); const veioDeLink = /[#&]type=(signup|magiclink|recovery|invite)/.test(h);
      if (/[#&]error(_code|_description)?=/.test(h)) this.linkVencido = true;
      sb = window.supabase.createClient(SQC.CONFIG.supabaseUrl, SQC.CONFIG.supabaseAnonKey, { auth: { persistSession: true, detectSessionInUrl: true } });
      // voltou pelo link de "esqueci a senha": a tela pede a senha nova antes de qualquer coisa
      sb.auth.onAuthStateChange(ev => { if (ev === 'PASSWORD_RECOVERY') { this.recuperando = true; if (SQC.app && SQC.app.pedirSenhaNova) SQC.app.pedirSenhaNova(); } });
      let sessao = null;
      try { sessao = (await sb.auth.getSession()).data.session; } catch (e) { /* sem rede */ }
      const guardado = ler(CHAVE_EU);
      if (!sessao) {
        // sem internet a sessão pode não renovar: segue com o perfil guardado para trabalhar no campo
        if (!navigator.onLine && guardado && copiaValida()) { this.offline = true; euCache = guardado; return guardado; }
        return null;
      }
      if (veioDeLink) this.recuperando = true;
      try { return await this.eu(true); }
      catch (e) { if (guardado && copiaValida() && (e.semRede || !navigator.onLine)) { this.offline = true; euCache = guardado; return guardado; } throw e; }
    },
    async eu(forcar) {
      if (euCache && !forcar) return euCache;
      const { data, error } = await sb.rpc('vincular_conta');
      if (error) throw erro(error);
      euCache = data && data.id ? data : null;
      guardar(CHAVE_EU, euCache); this.offline = false;
      if (!euCache) { guardar(CHAVE_DADOS, null); guardar(CHAVE_QUANDO, null); }   // acesso retirado: os dados guardados no aparelho saem junto
      return euCache;
    },
    async entrar(email, senha) {
      const { error } = await sb.auth.signInWithPassword({ email: String(email).trim().toLowerCase(), password: senha });
      if (error) throw erro(error);
      const eu = await this.eu(true);
      if (!eu) { await sb.auth.signOut(); throw erro({ code: 'P0001', message: 'Este e-mail não tem acesso ativo ao sistema. Fale com a coordenação.' }); }
      return eu;
    },
    /* primeiro acesso: a pessoa informa só o e-mail e recebe um link. A senha é criada DEPOIS de clicar no link,
       já dentro do sistema. (Criar a senha antes de confirmar o e-mail deixava outra pessoa "reservar" a conta de alguém.)
       A resposta é sempre a mesma, tenha o e-mail cadastro ou não: a tela não revela quem é da equipe. */
    async primeiroAcesso(email) {
      const { error } = await sb.auth.signInWithOtp({ email: String(email).trim().toLowerCase(), options: { shouldCreateUser: true, emailRedirectTo: aqui() } });
      if (error && !/não cadastrado|Database error|Signups not allowed/i.test(String(error.message))) throw erro(error);
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
      // a cópia dos dados sai do aparelho; o que estava na fila (lançado sem internet e ainda não enviado) FICA, para não se perder
      euCache = null; guardar(CHAVE_EU, null); guardar(CHAVE_DADOS, null); guardar(CHAVE_QUANDO, null);
      try { await sb.auth.signOut(); } catch (e) { /* sem rede: a sessão local já foi apagada */ }
    },
    /* tudo de uma vez (o projeto é pequeno). Sem rede, devolve a última cópia guardada no aparelho. */
    async carregar() {
      try {
        // quem acompanha de fora (SEAB/MDA) recebe unidades produtivas numeradas e visitas sem texto livre: o banco não entrega dado pessoal
        const fora = euCache && euCache.perfil === 'Acompanhamento';
        const anon = async f => { const { data, error } = await sb.rpc(f); if (error) throw erro(error); return data || []; };
        const listas = await Promise.all(D.TABELAS.map(t => fora && t === 'membros' ? [] : fora && t === 'agricultores' ? anon('agricultores_anonimos') : fora && t === 'visitas' ? anon('visitas_anonimas') : todas(t)));
        const db = {}; D.TABELAS.forEach((t, i) => { db[t] = listas[i]; });
        guardar(CHAVE_DADOS, db); guardar(CHAVE_QUANDO, Date.now()); this.offline = false; return db;
      } catch (e) {
        const g = ler(CHAVE_DADOS);
        if (g && e.semRede && copiaValida()) { this.offline = true; D.TABELAS.forEach(t => { if (!Array.isArray(g[t])) g[t] = []; }); return g; }
        throw e;
      }
    },
    /* op.novo = inclusão; senão é edição, e op.base é a versão (atualizado_em) que a pessoa leu.
       Edição só grava se o registro ainda está nessa versão: o que um colega mudou depois não é desfeito,
       e registro excluído por outra pessoa não volta a existir. */
    async salvar(tabela, reg, op) {
      try { return await this._salvar(tabela, reg, op); }
      catch (e) {
        // banco sem a coluna "item" (script 06 ainda não rodado): despesa sem item segue normalmente; com item, avisa o que falta
        const o = e.original || {}; if (tabela !== 'despesas' || semItem || !(o.code === 'PGRST204' || /column .*item|'item' column/i.test(String(o.message)))) throw e;
        if (reg.item) throw erro({ code: 'P0001', message: 'Para indicar o item do plano na despesa, a coordenação precisa rodar antes o script 06_item_da_despesa.sql no Supabase. Enquanto isso, grave a despesa sem item.' });
        semItem = true; return await this._salvar(tabela, reg, op);
      }
    },
    async _salvar(tabela, reg, op) {
      op = op || {}; const r = limpar(tabela, reg); const { id, ...campos } = r;
      if (op.novo) {
        const ins = await sb.from(tabela).insert(r).select().single();
        if (!ins.error) return ins.data;
        if (ins.error.code !== '23505') throw erro(ins.error);
        // já existe com este id: é reenvio da fila (a primeira tentativa gravou e a resposta se perdeu); segue como edição sem versão
        const de = await sb.from(tabela).select('id').eq('id', id).maybeSingle();
        if (de.error || !de.data) throw erro(ins.error);
        op = {};
      }
      let q = sb.from(tabela).update(campos).eq('id', id); if (op.base) q = q.eq('atualizado_em', op.base);
      const up = await q.select();
      if (up.error) throw erro(up.error);
      if (up.data && up.data.length) return up.data[0];
      const existe = await sb.from(tabela).select('id').eq('id', id).maybeSingle();
      if (existe.error) throw erro(existe.error);
      if (existe.data) throw erro(op.base ? { code: 'P0001', message: R.MSG_CONFLITO } : { code: '42501', message: 'permission denied' });
      if (op.novo === false || op.base) throw erro({ code: 'P0001', message: R.MSG_EXCLUIDO });
      const ins = await sb.from(tabela).insert(r).select().single();   // sem informação de origem (item antigo da fila): comporta-se como antes
      if (ins.error) throw erro(ins.error);
      return ins.data;
    },
    /* o servidor responde de verdade? (navigator.onLine diz "tem rede" até com sinal que não passa nada) */
    async temConexao() {
      if (navigator.onLine === false) return false;
      try { const c = new AbortController(); const t = setTimeout(() => c.abort(), 6000);
        const r = await fetch(SQC.CONFIG.supabaseUrl + '/auth/v1/settings', { headers: { apikey: SQC.CONFIG.supabaseAnonKey }, signal: c.signal, cache: 'no-store' }); clearTimeout(t); return r.ok; }
      catch (e) { return false; }
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
