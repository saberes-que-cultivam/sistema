/* Guarda o sistema no aparelho para abrir e lançar registros sem internet.
   Os dados vão para o servidor pela fila do próprio app quando a conexão volta. */
const VERSAO = 'sqc-v167';
const ARQUIVOS = ['./', 'index.html', 'css/app.css', 'js/config.js', 'js/simulacao.js', 'js/tudo.js',
  'assets/icon-192.png', 'manifest.webmanifest',
  'assets/fontes/manrope-latin-400-normal.woff2', 'assets/fontes/manrope-latin-500-normal.woff2', 'assets/fontes/manrope-latin-600-normal.woff2',
  'assets/fontes/manrope-latin-700-normal.woff2', 'assets/fontes/manrope-latin-800-normal.woff2', 'assets/fontes/lora-latin-600-normal.woff2', 'assets/fontes/lora-latin-700-normal.woff2'];
// cada versão nova baixa tudo de novo, sem passar pelo cache do navegador (senão podia guardar arquivo velho)
self.addEventListener('install', e => e.waitUntil(caches.open(VERSAO)
  .then(c => c.addAll(ARQUIVOS.map(u => new Request(u, { cache: 'no-cache' })   /* no-cache: o servidor responde “não mudou” para o que o navegador já tem (reload baixava tudo de novo) */))).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k)))).then(() => self.clients.claim())));
const guardar = (req, r) => { if (r && (r.ok || r.type === 'opaque')) { const c = r.clone(); caches.open(VERSAO).then(x => x.put(req, c)); } return r; };
// internet com prazo: se não responder em ms milissegundos, usa a cópia do aparelho (se houver)
const comPrazo = (req, ms) => new Promise((ok, falha) => {
  let feito = false; const t = setTimeout(() => caches.match(req).then(r => { if (r && !feito) { feito = true; ok(r); } }), ms);
  fetch(req).then(r => { clearTimeout(t); guardar(req, r); if (!feito) { feito = true; ok(r); } })
    .catch(() => { clearTimeout(t); caches.match(req).then(r => { if (!feito) { feito = true; r ? ok(r) : falha(); } }); });
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  const proprio = u.origin === location.origin;
  if (!proprio) return;   // API do Supabase e qualquer outro endereço passam direto
  if (proprio && u.pathname.includes('/manuais/')) return;   // manuais em PDF: sempre da internet, não ocupam o aparelho
  // a página: internet com prazo de 1,5 s (para pegar versão nova); sem sinal, abre a guardada
  if (e.request.mode === 'navigate') {
    e.respondWith(comPrazo(e.request, 1500).catch(() => caches.match('index.html')));
    return;
  }
  // arquivos do sistema, biblioteca e fontes: abre do aparelho na hora; o que não estiver guardado vem da internet
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(x => guardar(e.request, x)))
    .catch(() => proprio ? caches.match(e.request) : Response.error()));
});
