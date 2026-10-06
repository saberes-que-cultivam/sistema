/* Saberes que Cultivam — fila do aparelho: guarda o que foi lançado sem internet e envia quando o sinal volta.
   Usa IndexedDB; se o navegador não permitir, guarda só na memória (vale até fechar a página).
   Cada item: { id: 'tabela:idDoRegistro', tabela, dados, op: { novo, base }, dono (id da pessoa), criado, erro }.
   op.novo = registro que ainda não existe no servidor; op.base = versão (atualizado_em) que a pessoa leu antes de editar.
   Lançar de novo o mesmo registro antes de enviar substitui o item (mesmo id), mantendo a ordem. */
(function () {
  const G = typeof window !== 'undefined' ? window : globalThis;
  const SQC = (G.SQC = G.SQC || {});
  const BANCO = 'saberes-que-cultivam', LOJA = 'fila';
  let dbp = null; const memoria = new Map();

  function abrir() {
    if (dbp) return dbp;
    dbp = new Promise(res => {
      try {
        const req = indexedDB.open(BANCO, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(LOJA, { keyPath: 'id' });
        req.onsuccess = () => res(req.result);
        req.onerror = () => res(null);
      } catch (e) { res(null); }
    });
    return dbp;
  }
  async function tx(modo, fn) {
    const db = await abrir();
    if (!db) { const r = fn(null); return r && typeof r === 'object' && 'result' in r ? r.result : r; }
    return new Promise((res, rej) => {
      const t = db.transaction(LOJA, modo); const r = fn(t.objectStore(LOJA));
      t.oncomplete = () => res(r && r.result !== undefined ? r.result : r);
      t.onerror = () => rej(t.error);
    });
  }

  const F = (SQC.fila = {
    chave: (tabela, id) => tabela + ':' + id,
    async listar(dono) {
      const todos = await tx('readonly', l => l ? l.getAll() : { result: [...memoria.values()] });
      return (todos || []).filter(x => !dono || x.dono === dono).sort((a, b) => a.criado - b.criado);
    },
    async salvar(item) {
      if (!item.criado) { const antes = await tx('readonly', l => l ? l.get(item.id) : { result: memoria.get(item.id) }); item.criado = (antes && antes.criado) || Date.now(); }
      await tx('readwrite', l => { if (l) l.put(item); else memoria.set(item.id, item); });
      return item;
    },
    async remover(id) { await tx('readwrite', l => { if (l) l.delete(id); else memoria.delete(id); }); },
    async limpar(dono) { for (const it of await F.listar(dono)) await F.remover(it.id); },

    /* Envia o que estiver pendente, na ordem em que foi lançado (um lote sobe antes da entrega que depende dele).
       Erro de regra fica marcado no item para a pessoa corrigir; falta de rede só deixa para depois. */
    enviando: false,
    async sincronizar(api, dono) {
      if (F.enviando) return { enviados: 0, erros: 0 };
      F.enviando = true; let enviados = 0, erros = 0;
      try {
        for (const it of await F.listar(dono)) {
          if (it.erro && !it.reenviar) { erros++; continue; }
          try { await api.salvar(it.tabela, it.dados, it.op || {}); await F.remover(it.id); enviados++; }
          catch (e) {
            if (e.semRede) break;
            it.erro = e.message || 'Não foi possível enviar. Tente de novo.'; it.reenviar = false; erros++;
            await F.salvar(it);
          }
        }
      } finally { F.enviando = false; }
      return { enviados, erros };
    }
  });

  SQC.novoId = () => (G.crypto && G.crypto.randomUUID ? G.crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16); }));
})();
