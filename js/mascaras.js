/* Saberes que Cultivam — máscaras de digitação: CPF, celular e e-mail, em todos os formulários (cadastro e link de cadastro).
   Trazido do sistema Mulheres & Quintais (12/10/2026). O banco continua guardando o CPF só com números (regras.normalizarMembro). */
(function () {
  const SQC = (window.SQC = window.SQC || {});
  const dig = v => String(v || '').replace(/\D/g, '');
  const fmtCPF = d => { d = d.slice(0, 11);
    return d.length > 9 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : d.length > 6 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
      : d.length > 3 ? `${d.slice(0, 3)}.${d.slice(3)}` : d; };
  const fmtTel = d => { d = d.slice(0, 11); if (!d) return '';
    if (d.length <= 2) return `(${d}`;
    const meio = d.length === 11 ? 5 : 4, ddd = d.slice(0, 2), r = d.slice(2);
    return r.length > meio ? `(${ddd}) ${r.slice(0, meio)}-${r.slice(meio)}` : `(${ddd}) ${r}`; };
  const TIPOS = { cpf: { fmt: fmtCPF, max: 14, ph: '000.000.000-00', modo: 'numeric' }, tel: { fmt: fmtTel, max: 15, ph: '(00) 00000-0000', modo: 'tel' } };
  const tipoDe = el => !el || el.tagName !== 'INPUT' || el.readOnly ? null : el.id === 'f_cpf' || el.dataset.mascara === 'cpf' ? 'cpf'
    : el.id === 'f_telefone' || el.type === 'tel' || el.dataset.mascara === 'tel' ? 'tel' : null;
  const emailValido = v => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);

  // aplica a máscara mantendo o cursor depois do mesmo número de dígitos
  function aplicar(el, t) {
    const pos = el.selectionStart == null ? el.value.length : el.selectionStart, antes = dig(el.value.slice(0, pos)).length, novo = TIPOS[t].fmt(dig(el.value));
    if (novo === el.value) return;
    el.value = novo;
    let n = 0, p = 0; while (p < novo.length && n < antes) { if (/\d/.test(novo[p])) n++; p++; }
    try { if (document.activeElement === el) el.setSelectionRange(p, p); } catch (e) { /* campo sem cursor */ }
  }
  /* prepara os campos que acabaram de aparecer: formata o que veio do cadastro, põe exemplo e teclado numérico */
  function preparar(raiz) {
    (raiz || document).querySelectorAll('input').forEach(el => { const t = tipoDe(el); if (!t || el.dataset.mascaraOk) return;
      el.dataset.mascaraOk = '1'; el.maxLength = TIPOS[t].max; el.inputMode = TIPOS[t].modo; if (!el.placeholder) el.placeholder = TIPOS[t].ph; if (el.value) aplicar(el, t); });
  }
  const limparDica = el => { const d = el.parentElement && el.parentElement.querySelector('.dica-masc'); if (d) d.remove(); el.removeAttribute('aria-invalid'); };
  document.addEventListener('input', ev => {
    const el = ev.target, t = tipoDe(el);
    if (t) { aplicar(el, t); limparDica(el); return; }
    if (el && el.tagName === 'INPUT' && el.type === 'email') {   // e-mail: sem espaços e em minúsculas
      const pos = el.selectionStart, v = el.value.replace(/\s+/g, '').toLowerCase();
      if (v !== el.value) { el.value = v; try { el.setSelectionRange(pos, pos); } catch (e) {} }
      limparDica(el);
    }
  });
  // erros comuns de digitação no final do e-mail (gmial.com, hotmail.con…)
  const DOMINIOS = { 'gmial.com': 'gmail.com', 'gmal.com': 'gmail.com', 'gmai.com': 'gmail.com', 'gamil.com': 'gmail.com', 'gnail.com': 'gmail.com', 'gmaill.com': 'gmail.com',
    'gmail.co': 'gmail.com', 'gmail.con': 'gmail.com', 'gmail.cm': 'gmail.com', 'gmail.om': 'gmail.com', 'gmail.com.br': 'gmail.com', 'gmail.cpm': 'gmail.com', 'gmaul.com': 'gmail.com',
    'hotmal.com': 'hotmail.com', 'hotmai.com': 'hotmail.com', 'hotmial.com': 'hotmail.com', 'hotmail.con': 'hotmail.com', 'hotmail.co': 'hotmail.com', 'hotmil.com': 'hotmail.com',
    'outlok.com': 'outlook.com', 'outloo.com': 'outlook.com', 'outlook.con': 'outlook.com', 'yahoo.con': 'yahoo.com', 'yaho.com': 'yahoo.com', 'yahoo.com.b': 'yahoo.com.br',
    'icloud.con': 'icloud.com', 'bol.com': 'bol.com.br', 'uol.com': 'uol.com.br', 'ifrn.edu': 'ifrn.edu.br', 'escolar.ifrn.edu': 'escolar.ifrn.edu.br' };
  function corrigirEmail(v) {
    const m = String(v || '').toLowerCase().match(/^([a-z0-9._%+-]+)@([a-z0-9.-]+)$/); if (!m) return null;
    const dom = DOMINIOS[m[2]] || (/\.con$/.test(m[2]) ? m[2].replace(/\.con$/, '.com') : null);
    return dom ? m[1] + '@' + dom : null;
  }
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // ao sair do campo: confere CPF, celular e e-mail e avisa na hora (o Salvar confere de novo)
  document.addEventListener('focusout', ev => {
    const el = ev.target; if (!el || el.tagName !== 'INPUT' || el.readOnly || !el.value) return;
    const t = tipoDe(el); let msg = '';
    if (t === 'cpf' && SQC.regras && !SQC.regras.cpfValido(el.value)) msg = 'CPF inválido: confira os 11 números.';
    if (t === 'tel' && dig(el.value).length < 10) msg = 'Celular incompleto: DDD e número.';
    if (el.type === 'email' && !emailValido(el.value)) msg = 'E-mail incompleto ou com erro (exemplo: nome@gmail.com).';
    else if (el.type === 'email') { const c = corrigirEmail(el.value); if (c) msg = `Confira o e-mail: não seria <b>${esc(c)}</b>? <button type="button" class="b s sug-email" data-email="${esc(c)}">Usar ${esc(c)}</button>`; }
    limparDica(el);
    if (msg) { el.setAttribute('aria-invalid', 'true'); el.insertAdjacentHTML('afterend', `<span class="fm-dica dica-masc" role="alert">${msg}</span>`); }
  });
  document.addEventListener('click', ev => {
    const b = ev.target.closest && ev.target.closest('.sug-email'); if (!b) return;
    const inp = b.closest('.fld') && b.closest('.fld').querySelector('input[type=email]'); if (!inp) return;
    inp.value = b.dataset.email; limparDica(inp); inp.focus();
  });
  if (typeof MutationObserver !== 'undefined') new MutationObserver(() => preparar()).observe(document.documentElement, { childList: true, subtree: true });
  SQC.mascaras = { fmtCPF, fmtTel, corrigirEmail, preparar };
})();
