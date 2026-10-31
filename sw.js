/* Guarda o sistema no aparelho para abrir e lançar registros sem internet.
   Os dados vão para o servidor pela fila do próprio app quando a conexão volta. */
const VERSAO = 'sqc-v185';
/* 29/10/2026: a página pede css e js com "?v=<versão>"; a página nova (que chega antes do sw novo) busca os arquivos novos na hora,
   em vez de abrir com os da versão anterior guardados no aparelho (o rodapé dizia 168 e o visual era o da 167) */
const V = VERSAO.replace('sqc-v', '');
const ARQUIVOS = ['./', 'index.html', 'css/app.css?v=' + V, 'js/config.js?v=' + V, 'js/simulacao.js?v=' + V, 'js/tudo.js?v=' + V,
  'assets/icon-192.png', 'manifest.webmanifest',
  'assets/fontes/manrope-latin-wght-normal.woff2', 'assets/fontes/cormorant-garamond-latin-700-normal.woff2'];   // 29/10/2026: Manrope variável (1 arquivo); 30/10/2026: marca em Cormorant Garamond (era Lora)
// cada versão nova baixa tudo de novo, sem passar pelo cache do navegador (senão podia guardar arquivo velho)
self.addEventListener('install', e => e.waitUntil(caches.open(VERSAO)
  .then(c => c.addAll(ARQUIVOS.map(u => new Request(u, { cache: 'no-cache' })   /* no-cache: o servidor responde “não mudou” para o que o navegador já tem (reload baixava tudo de novo) */))).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k)))).then(() => self.clients.claim())));
const guardar = (req, r) => { if (r && (r.ok || r.type === 'opaque')) { const c = r.clone(); caches.open(VERSAO).then(x => x.put(req, c)); } return r; };
// internet com prazo: se não responder em ms milissegundos, usa a cópia do aparelho (se houver)
/* 29/10/2026 (auditoria): a página que chega pela navegação NÃO é guardada na cópia: a página guardada é só a da instalação, que bate
   com os arquivos da mesma versão (antes, a página nova da versão seguinte ia para a cópia velha e, sem internet, abria sem o código dela) */
const comPrazo = (req, ms) => new Promise((ok, falha) => {
  let feito = false; const t = setTimeout(() => caches.match(req).then(r => { if (r && !feito) { feito = true; ok(r); } }), ms);
  fetch(req).then(r => { clearTimeout(t); if (!feito) { feito = true; ok(r); } })
    .catch(() => { clearTimeout(t); caches.match(req).then(r => { if (!feito) { feito = true; r ? ok(r) : falha(); } }); });
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  const proprio = u.origin === location.origin;
  if (!proprio) return;   // API do Supabase e qualquer outro endereço passam direto
  if (proprio && u.pathname.includes('/manuais/')) return;   // manuais em PDF: sempre da internet, não ocupam o aparelho
  if (proprio && u.pathname.includes('/js/vendor/ocr-')) return;   // 30/10/2026: leitor da lista por foto (~5 MB), só quem usa baixa; o próprio leitor guarda o modelo de português
  // a página: internet com prazo de 1,5 s (para pegar versão nova); sem sinal, abre a guardada
  if (e.request.mode === 'navigate') {
    e.respondWith(comPrazo(e.request, 1500).catch(() => caches.match('index.html')));
    return;
  }
  // arquivos do sistema, biblioteca e fontes: abre do aparelho na hora; o que não estiver guardado vem da internet
  /* sem internet e sem o arquivo desta versão (?v= novo): usa o mesmo arquivo de outra versão guardada, em vez de deixar a página sem código */
  /* 29/10/2026 (auditoria de campo): com sinal que trava (não cai), a versão nova do código (?v=) ficava esperando sem prazo e o sistema não abria;
     depois de 6 s usa o mesmo arquivo de outra versão guardada, e a busca continua por trás para a próxima vez */
  const req = e.request; let acabou; const busca = new Promise(ok => { acabou = ok; });
  e.respondWith(caches.match(req).then(r => { if (r) { acabou(); return r; } return new Promise(ok => {
    let feito = false; const fim = x => { if (!feito && x) { feito = true; ok(x); } };
    const t = u.search ? setTimeout(() => caches.match(req, { ignoreSearch: true }).then(fim), 6000) : 0;
    fetch(req).then(x => { clearTimeout(t); guardar(req, x); fim(x); })
      .catch(() => { clearTimeout(t); return caches.match(req, { ignoreSearch: true }).then(x => { if (!feito) { feito = true; ok(x || Response.error()); } }); })
      .finally(acabou);
  }); }).catch(() => { acabou(); return Response.error(); }));
  e.waitUntil(busca);
});
/* 30/10/2026 (v179): avisos no celular. O aviso chega da função "enviar-push" do Supabase com título, texto e a aba; não leva dado pessoal.
   Tocar no aviso abre o sistema (ou traz para a frente o que já está aberto) na aba do aviso. */
self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (x) { d = { corpo: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(String(d.titulo || 'Saberes que Cultivam').slice(0, 80), { body: String(d.corpo || '').slice(0, 240), icon: 'assets/icon-192.png', badge: 'assets/icon-192.png', lang: 'pt-BR', tag: d.id ? String(d.id) : undefined, data: { aba: /^[a-z]{2,20}$/.test(d.aba || '') ? d.aba : '' } }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close(); const aba = (e.notification.data || {}).aba || '';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(L => {
    const c = L.find(x => x.url.startsWith(self.registration.scope));
    if (c) { if (aba) c.postMessage({ irAba: aba }); return c.focus(); }
    return self.clients.openWindow(new URL('./' + (aba ? '#' + aba : ''), self.registration.scope).href);
  }));
});
