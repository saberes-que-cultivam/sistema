/* Saberes que Cultivam — aparência da tela (trazido do Mulheres & Quintais, v261, 12/10/2026).
   O sistema é usado no campo, muitas vezes no sol do meio-dia. Duas escolhas, guardadas NESTE aparelho
   (não vão para o servidor e continuam valendo depois de sair da conta):
   1. Modo sol: letra preta em fundo branco, bordas escuras e grossas, etiquetas contornadas e letra um pouco maior.
      É o que se lê melhor com muita luz (fundo escuro vira espelho no sol). Vale por cima do tema: a tela fica sempre clara.
   2. Tema: Automático (segue o celular), Claro ou Escuro.
   Roda logo no começo do tudo.js, antes da primeira tela, para não piscar. */
(function () {
  const G = typeof window !== 'undefined' ? window : globalThis;
  const SQC = (G.SQC = G.SQC || {});
  const CHAVE = 'sqc-aparencia';
  const TEMAS = { auto: 'Automático', claro: 'Claro', escuro: 'Escuro' };
  function ler() {
    let v = null; try { v = JSON.parse(G.localStorage.getItem(CHAVE) || 'null'); } catch (e) { v = null; }
    v = v && typeof v === 'object' ? v : {};
    return { tema: TEMAS[v.tema] ? v.tema : 'auto', sol: v.sol === true };
  }
  function aplicar(v) {
    v = v || ler(); const raiz = typeof document !== 'undefined' && document.documentElement; if (!raiz || !raiz.setAttribute) return v;
    const tema = v.sol || v.tema === 'claro' ? 'light' : v.tema === 'escuro' ? 'dark' : null;
    if (tema) raiz.setAttribute('data-theme', tema); else raiz.removeAttribute('data-theme');
    if (v.sol) raiz.setAttribute('data-sol', ''); else raiz.removeAttribute('data-sol');
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', v.sol ? '#FFFFFF' : '#27663A');
    document.querySelectorAll('[data-aparencia]').forEach(b => { b.classList.toggle('ligado', v.sol); b.setAttribute('aria-label', 'Aparência da tela: modo sol, claro ou escuro' + (v.sol ? ' (modo sol ligado)' : '')); });
    return v;
  }
  function mudar(campo, valor) { const v = ler(); v[campo] = valor; try { G.localStorage.setItem(CHAVE, JSON.stringify(v)); } catch (e) { /* vale só até fechar */ } aplicar(v); return v; }
  const ICONE = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>';
  /* conteúdo da janela "Aparência da tela" (a janela é a mesma das outras: #dlg) */
  function janela() {
    const v = ler(), opc = k => `<button type="button" data-ap-tema="${k}" aria-pressed="${v.tema === k}"${v.sol ? ' disabled' : ''}>${TEMAS[k]}</button>`;
    return `<div class="fm-cab"><div><span class="fm-eye">Neste aparelho</span><h2>Aparência da tela</h2></div><button type="button" class="fm-x" data-fechar aria-label="Fechar">×</button></div>
     <div class="fm-corpo ap-corpo">
      <button type="button" class="ap-chave" data-ap-sol role="switch" aria-checked="${v.sol}"><span class="ap-ic" aria-hidden="true">${ICONE}</span>
       <span class="ap-txt"><b>Modo sol</b><small>Para usar no campo, com sol forte: letra preta em fundo branco, bordas escuras e letra maior.</small></span><span class="ap-trilho" aria-hidden="true"><span></span></span></button>
      <section class="ap-bloco" aria-labelledby="ap-tema-t"><h3 id="ap-tema-t">Tema</h3>
       <div class="ap-seg" role="group" aria-labelledby="ap-tema-t">${Object.keys(TEMAS).map(opc).join('')}</div>
       <p>${v.sol ? 'Com o modo sol ligado a tela fica sempre clara. Desligue o modo sol para escolher o tema.' : 'Automático segue o celular (claro de dia, escuro se o celular estiver no modo escuro). O escuro é bom à noite e gasta menos bateria em alguns celulares, mas no sol é difícil de ler.'}</p></section>
      <p class="ap-nota">A escolha fica guardada neste aparelho e continua valendo depois de sair do sistema. Dica: no sol, deixe também o brilho do celular no máximo.</p></div>`;
  }
  aplicar();
  SQC.aparencia = { ler, aplicar, mudar, janela, ICONE, TEMAS, CHAVE };
})();
