/* Saberes que Cultivam — foto de evidência (atividade ou visita): data de dentro do arquivo, tamanho reduzido e câmera do sistema.
   Trazido do sistema Mulheres & Quintais (fotodia.js, 12/10/2026), com uma diferença de regra combinada para este projeto:
   - foto COM data dentro do arquivo (EXIF, gravado pela câmera do celular) só vale se for do dia da atividade ou da visita
     (visita que passa da meia-noite: vale também foto do dia seguinte até as 4h);
   - foto SEM data dentro do arquivo (encaminhada pelo WhatsApp, captura de tela) é aceita, mas fica marcada
     "data não confirmada" — aqui é comum receber a foto da capacitação pelo WhatsApp de quem estava lá;
   - foto tirada pela câmera do próprio sistema é sempre de agora.
   Antes de enviar, a foto é reduzida (lado maior 1600 px, JPEG): cabe no espaço gratuito do Supabase e sobe com sinal fraco.
   Limite conhecido: ninguém impede fotografar, hoje, uma foto antiga impressa ou mostrada em outra tela. */
(function () {
  const G = typeof window !== 'undefined' ? window : globalThis;
  const SQC = (G.SQC = G.SQC || {});

  /* momento em que a foto foi tirada, lido do EXIF: DateTimeOriginal (0x9003), senão DateTimeDigitized (0x9004),
     senão DateTime (0x0132). Devolve { dia: 'AAAA-MM-DD', hora } ou null. Nunca lança erro. */
  async function lerMomentoExif(arquivo) {
    try {
      const ini = await arquivo.slice(0, 512 * 1024).arrayBuffer(); const v = new DataView(ini);
      if (v.byteLength >= 4 && v.getUint16(0) === 0xFFD8) {
        let p = 2;
        while (p + 4 <= v.byteLength) {
          if (v.getUint8(p) !== 0xFF) break;
          const marca = v.getUint8(p + 1), tam = v.getUint16(p + 2);
          if (marca === 0xE1 && p + 10 <= v.byteLength && v.getUint32(p + 4) === 0x45786966) { const r = lerTiff(v, p + 10, Math.min(v.byteLength, p + 2 + tam)); if (r) return r; break; }
          if (marca === 0xDA || marca === 0xD9) break;
          p += 2 + tam;
        }
        return null;   // JPEG sem EXIF (WhatsApp, captura de tela)
      }
      const r = procurarTiff(v); if (r || arquivo.size <= ini.byteLength) return r;
      return procurarTiff(new DataView(await arquivo.slice(0, 16 * 1024 * 1024).arrayBuffer()));   // HEIC, PNG, WebP
    } catch (e) { return null; }
  }
  function procurarTiff(v) {
    let tentativas = 0;   // arquivo forjado com o cabeçalho repetido milhares de vezes travava a tela: no máximo 50 tentativas
    for (let i = 0, n = v.byteLength - 8; i < n && tentativas < 50; i++) {
      const a = v.getUint8(i);
      if ((a === 0x49 && v.getUint8(i + 1) === 0x49 && v.getUint8(i + 2) === 0x2A && v.getUint8(i + 3) === 0)
        || (a === 0x4D && v.getUint8(i + 1) === 0x4D && v.getUint8(i + 2) === 0 && v.getUint8(i + 3) === 0x2A)) {
        tentativas++; let r = null; try { r = lerTiff(v, i, v.byteLength); } catch (e) { r = null; }
        if (r) return r;
      }
    }
    return null;
  }
  function lerTiff(v, t, fim) {
    if (t + 8 > fim) return null;
    const le = v.getUint16(t) === 0x4949, u16 = o => v.getUint16(o, le), u32 = o => v.getUint32(o, le);
    if (u16(t + 2) !== 42) return null;
    const ifd = off => { const base = t + off; if (off < 8 || base + 2 > fim) return []; const n = u16(base), l = [];
      for (let i = 0; i < n && i < 500; i++) { const e = base + 2 + i * 12; if (e + 12 > fim) break; l.push({ tag: u16(e), tipo: u16(e + 2), qtd: u32(e + 4), val: u32(e + 8), e }); } return l; };
    const texto = x => { if (!x || x.tipo !== 2 || x.qtd < 19) return null; const o = x.qtd > 4 ? t + x.val : x.e + 8; if (o + 19 > fim) return null;
      let s = ''; for (let i = 0; i < 19; i++) s += String.fromCharCode(v.getUint8(o + i)); return s; };
    const ifd0 = ifd(u32(t + 4)), ptr = ifd0.find(x => x.tag === 0x8769), exif = ptr ? ifd(ptr.val) : [];
    const bruto = texto(exif.find(x => x.tag === 0x9003)) || texto(exif.find(x => x.tag === 0x9004)) || texto(ifd0.find(x => x.tag === 0x0132));
    const m = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):\d{2}:\d{2}$/.exec(bruto || '');
    if (!m || m[1] === '0000' || +m[2] < 1 || +m[2] > 12 || +m[3] < 1 || +m[3] > 31 || +m[4] > 23) return null;   // data impossível = sem data
    return { dia: m[1] + '-' + m[2] + '-' + m[3], hora: +m[4] };
  }

  /* regra: devolve '' (vale) ou a mensagem que explica por que não vale. diaFoto vazio = sem data no arquivo (vale, marcada) */
  const hoje = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const br = d => d.split('-').reverse().join('/');
  const diaSeguinte = d => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + 1); return x.toISOString().slice(0, 10); };
  function conferir(diaFoto, diaRegistro, hora) {
    if (!diaFoto) return '';
    if (diaFoto > hoje()) return `A data desta foto está no futuro (${br(diaFoto)}). Confira a data do celular e tire a foto de novo.`;
    if (!diaRegistro || diaFoto === diaRegistro) return '';
    if (diaFoto === diaSeguinte(diaRegistro) && hora != null && hora < 4) return '';
    return `Esta foto é de ${br(diaFoto)} e o registro é de ${br(diaRegistro)}. Só vale foto tirada no dia: escolha outra foto ou corrija a data do registro.`;
  }

  /* reduz para o lado maior ter no máximo 1600 px, em JPEG; devolve um Blob */
  async function reduzir(arquivo, lado = 1600, qualidade = 0.82) {
    const url = URL.createObjectURL(arquivo);
    try {
      const img = await new Promise((ok, falha) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => falha(new Error('Este arquivo não é uma foto que o navegador consiga abrir. Use JPEG ou PNG.')); i.src = url; });
      const f = Math.min(1, lado / Math.max(img.naturalWidth, img.naturalHeight)), w = Math.round(img.naturalWidth * f), h = Math.round(img.naturalHeight * f);
      const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(img, 0, 0, w, h);
      const b = await new Promise(ok => c.toBlob(ok, 'image/jpeg', qualidade));
      if (!b) throw new Error('A foto não pôde ser preparada. Tente de novo.');
      return b;
    } finally { URL.revokeObjectURL(url); }
  }

  /* câmera do próprio sistema (traseira): a foto é tirada agora. Devolve um File, ou null se a pessoa cancelou. */
  function abrirCamera(avisar) {
    return new Promise(async pronto => {
      if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) { avisar('Este navegador não abre a câmera pelo sistema. Use “Escolher foto” ou atualize o navegador.'); return pronto(null); }
      let fluxo;
      try { fluxo = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1440 } }, audio: false }); }
      catch (e) { avisar('Não foi possível abrir a câmera. Permita o uso da câmera para este site nas configurações do navegador.'); return pronto(null); }
      const j = document.createElement('div'); j.className = 'cam-janela'; j.setAttribute('role', 'dialog'); j.setAttribute('aria-modal', 'true'); j.setAttribute('aria-label', 'Tirar foto');
      j.innerHTML = '<div class="cam-caixa"><video autoplay playsinline muted></video><p class="small">Enquadre e toque em Tirar foto. A foto fica com a data de agora.</p><div class="frow"><button type="button" class="b" data-cam="cancelar">Cancelar</button><button type="button" class="b p" data-cam="tirar">Tirar foto</button></div></div>';
      const video = j.querySelector('video'); video.srcObject = fluxo;
      (document.querySelector('dialog[open]') || document.body).appendChild(j); j.querySelector('[data-cam=tirar]').focus();
      let fechou = false;
      const fechar = r => { if (fechou) return; fechou = true; fluxo.getTracks().forEach(t => t.stop()); j.remove(); document.removeEventListener('keydown', tecla, true); pronto(r); };
      const dlg = j.closest('dialog'); if (dlg) dlg.addEventListener('close', () => fechar(null), { once: true });   // a janela fechou por outro caminho (saída automática, voltar): a câmera desliga
      const tecla = ev => { if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); fechar(null); } };
      document.addEventListener('keydown', tecla, true);
      j.addEventListener('click', ev => {
        const b = ev.target.closest('[data-cam]'); if (!b) return;
        if (b.dataset.cam === 'cancelar') return fechar(null);
        if (!video.videoWidth) return;
        const c = document.createElement('canvas'); c.width = video.videoWidth; c.height = video.videoHeight; c.getContext('2d').drawImage(video, 0, 0);
        b.disabled = true; b.textContent = 'Preparando…';
        c.toBlob(blob => fechar(blob ? new File([blob], 'camera_' + Date.now() + '.jpg', { type: 'image/jpeg', lastModified: Date.now() }) : null), 'image/jpeg', 0.9);
      });
    });
  }

  /* foto de perfil: recorte quadrado do meio da foto, 320 × 320 px, JPEG (uns 20 a 40 KB). Redesenhar no canvas descarta qualquer
     coisa que não seja imagem (um SVG com código, por exemplo). */
  async function quadrada(arquivo, lado = 320) {
    if (!arquivo || !/^image\//.test(arquivo.type || '') || arquivo.size > 25 * 1024 * 1024) throw new Error('Escolha uma foto (JPEG ou PNG) de até 25 MB.');
    const url = URL.createObjectURL(arquivo);
    try {
      const img = await new Promise((ok, falha) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => falha(new Error('Este arquivo não é uma foto que o navegador consiga abrir. Use JPEG ou PNG.')); i.src = url; });
      const m = Math.min(img.naturalWidth, img.naturalHeight); if (!m) throw new Error('Foto vazia.');
      const c = document.createElement('canvas'); c.width = c.height = lado;
      c.getContext('2d').drawImage(img, (img.naturalWidth - m) / 2, (img.naturalHeight - m) / 2, m, m, 0, 0, lado, lado);
      const b = await new Promise(ok => c.toBlob(ok, 'image/jpeg', 0.82)); if (!b) throw new Error('A foto não pôde ser preparada. Tente de novo.');
      return b;
    } finally { URL.revokeObjectURL(url); }
  }
  SQC.fotodia = { lerMomentoExif, conferir, reduzir, quadrada, abrirCamera, hoje };
})();
