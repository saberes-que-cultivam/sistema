/* Saberes que Cultivam — leitura de planilha .xlsx no próprio aparelho, sem biblioteca externa.
   Um .xlsx é um arquivo zip com XML dentro: aqui se abre o zip, se descompacta com o que o navegador já tem
   (DecompressionStream) e se leem as abas como listas de linhas. O arquivo não é enviado a lugar nenhum. */
(function () {
  const G = typeof window !== 'undefined' ? window : globalThis;
  const SQC = (G.SQC = G.SQC || {});
  const LIMITE = 5 * 1024 * 1024;
  const txt = b => new TextDecoder('utf-8').decode(b);
  const ent = s => String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&amp;/g, '&');
  async function inflar(bytes) { return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer()); }
  /* índice do zip: nome do arquivo interno -> função que devolve o conteúdo */
  function indice(buf) {
    const v = new DataView(buf), u = new Uint8Array(buf); let fim = -1;
    for (let i = buf.byteLength - 22; i >= Math.max(0, buf.byteLength - 66000); i--) if (v.getUint32(i, true) === 0x06054b50) { fim = i; break; }
    if (fim < 0) throw new Error('Este arquivo não é uma planilha .xlsx.');
    const n = v.getUint16(fim + 10, true); let p = v.getUint32(fim + 16, true); const arqs = {};
    for (let k = 0; k < n; k++) {
      if (v.getUint32(p, true) !== 0x02014b50) break;
      const metodo = v.getUint16(p + 10, true), tam = v.getUint32(p + 20, true), nl = v.getUint16(p + 28, true), el = v.getUint16(p + 30, true), cl = v.getUint16(p + 32, true), local = v.getUint32(p + 42, true);
      const nome = txt(u.subarray(p + 46, p + 46 + nl));
      arqs[nome] = async () => { const ini = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true), dados = u.subarray(ini, ini + tam);
        if (metodo === 0) return dados; if (metodo === 8) return inflar(dados); throw new Error('Planilha compactada de um jeito que o sistema não lê. Salve de novo como .xlsx e tente outra vez.'); };
      p += 46 + nl + el + cl;
    }
    return arqs;
  }
  const coluna = ref => { let c = 0; for (const ch of String(ref).replace(/[^A-Z]/gi, '').toUpperCase()) c = c * 26 + ch.charCodeAt(0) - 64; return c - 1; };
  const textos = x => (String(x).replace(/<rPh[\s\S]*?<\/rPh>/g, '').match(/<t[^>]*>[\s\S]*?<\/t>|<t[^>]*\/>/g) || []).map(t => ent(t.replace(/^<t[^>]*>|<\/t>$/g, '').replace(/^<t[^>]*\/>$/, ''))).join('');
  /* devolve [{ nome, linhas: [[célula, …], …] }], uma por aba, na ordem da planilha */
  async function ler(buf) {
    if (!buf || buf.byteLength > LIMITE) throw new Error('Planilha grande demais (o limite é 5 MB).');
    const z = indice(buf), abre = async n => z[n] ? txt(await z[n]()) : '';
    const livro = await abre('xl/workbook.xml'); if (!livro) throw new Error('Este arquivo não é uma planilha .xlsx.');
    const rels = {}; ((await abre('xl/_rels/workbook.xml.rels')).match(/<Relationship\b[^>]*>/g) || []).forEach(r => { const id = /Id="([^"]+)"/.exec(r), t = /Target="([^"]+)"/.exec(r); if (id && t) rels[id[1]] = t[1].replace(/^\/?xl\//, '').replace(/^\//, ''); });
    const fixos = ((await abre('xl/sharedStrings.xml')).match(/<si>[\s\S]*?<\/si>|<si\/>/g) || []).map(textos);
    const abas = [];
    for (const s of livro.match(/<sheet\b[^>]*>/g) || []) {
      const nome = ent((/name="([^"]*)"/.exec(s) || [])[1] || ''), rid = (/r:id="([^"]+)"/.exec(s) || [])[1], xml = await abre('xl/' + (rels[rid] || '')); const linhas = [];
      for (const row of xml.match(/<row\b[^>]*>[\s\S]*?<\/row>/g) || []) {
        const l = [];
        for (const m of row.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
          const at = m[1], corpo = m[2] || '', tipo = (/\bt="([^"]+)"/.exec(at) || [])[1], ref = (/\br="([^"]+)"/.exec(at) || [])[1], val = (/<v>([\s\S]*?)<\/v>/.exec(corpo) || [])[1];
          const c = tipo === 's' ? fixos[+val] : tipo === 'inlineStr' ? textos(corpo) : val === undefined ? '' : tipo === 'str' || tipo === 'b' ? ent(val) : val;
          l[ref ? coluna(ref) : l.length] = c === undefined ? '' : c;
        }
        for (let i = 0; i < l.length; i++) if (l[i] === undefined) l[i] = '';
        linhas.push(l);
      }
      abas.push({ nome, linhas });
    }
    return abas;
  }
  SQC.planilha = { ler };
})();
