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
    // Safari (iPad, iPhone) não recalcula as cores feitas com color-mix() quando o tema muda: só depois de recarregar a página.
    // Desligar e religar a folha de estilo na mesma tarefa obriga o navegador a refazer tudo, sem piscar (não há desenho no meio).
    const chave = (tema || 'auto') + (v.sol ? '+sol' : '');
    if (aplicar.ultima !== undefined && aplicar.ultima !== chave) document.querySelectorAll('link[rel="stylesheet"]').forEach(l => { l.disabled = true; void raiz.offsetHeight; l.disabled = false; });
    // fundo da página: alguns navegadores trocam a cor dos painéis mas não a do fundo (o fundo do body "vaza" para a janela e não é redesenhado).
    // Pôr a cor nova direto no html e no body força o redesenho; no quadro seguinte volta a valer a variável (assim a impressão continua branca).
    if (aplicar.ultima !== undefined && aplicar.ultima !== chave && document.body) {
      const cor = getComputedStyle(raiz).getPropertyValue('--bg').trim();
      if (cor) { raiz.style.backgroundColor = cor; document.body.style.backgroundColor = cor;
        (G.requestAnimationFrame || setTimeout)(() => (G.requestAnimationFrame || setTimeout)(() => { raiz.style.backgroundColor = ''; document.body.style.backgroundColor = ''; })); }
    }
    aplicar.ultima = chave; raiz.style.colorScheme = tema === 'dark' ? 'dark' : tema === 'light' ? 'light' : '';
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', v.sol ? '#FFFFFF' : '#27663A');
    document.querySelectorAll('[data-aparencia]').forEach(b => { b.classList.toggle('ligado', v.sol); b.setAttribute('aria-label', 'Aparência da tela: modo sol, claro ou escuro' + (v.sol ? ' (modo sol ligado)' : '')); });
    return v;
  }
  /* Safari e todo navegador do iPad e do iPhone (motor WebKit) deixam partes da tela com as cores do tema anterior, mesmo depois
     de trocar de aba: só recarregar a página resolve. Neles, a troca de aparência recarrega a página sozinha (a aba e o login continuam). */
  const webkit = () => { const u = (G.navigator && G.navigator.userAgent) || ''; return /AppleWebKit/.test(u) && !/Chrome\/|Chromium|Edg\/|Android/.test(u); };
  const recarregar = () => { try { G.sessionStorage.setItem('sqc-aparencia-aberta', '1'); } catch (e) {} setTimeout(() => G.location.reload(), 250); };
  function mudar(campo, valor) { const v = ler(); v[campo] = valor; try { G.localStorage.setItem(CHAVE, JSON.stringify(v)); } catch (e) { /* vale só até fechar */ } aplicar(v); if (webkit()) recarregar(); return v; }
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
  /* uma escolha só para o aparelho inteiro: vale a ÚLTIMA, feita na entrada ou dentro do sistema, em qualquer aba ou janela aberta.
     Outra aba que muda a escolha avisa esta (evento storage); ao voltar para a aba ou para a página guardada pelo navegador, lê de novo. */
  if (G.addEventListener) {
    G.addEventListener('storage', e => { if (e.key !== CHAVE && e.key !== null) return; aplicar();
      if (webkit() && typeof document !== 'undefined' && !document.querySelector('dialog[open]')) G.location.reload(); });   // outra aba trocou: aqui também (sem janela aberta, para não perder o que se digita)
    G.addEventListener('pageshow', () => aplicar());
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { if (!document.hidden) aplicar(); });
  }
  SQC.aparencia = { ler, aplicar, mudar, janela, ICONE, TEMAS, CHAVE, webkit };
})();
