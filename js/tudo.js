/* GERADO por ferramentas/montar.js — não edite aqui: edite os arquivos de js/ e rode a montagem de novo. */
/* ===== aparencia.js ===== */
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
;
/* ===== vendor/supabase-2.117.2.js ===== */
var supabase=(function(e){function t(e,t){var n={};for(var r in e)Object.prototype.hasOwnProperty.call(e,r)&&t.indexOf(r)<0&&(n[r]=e[r]);if(e!=null&&typeof Object.getOwnPropertySymbols==`function`)for(var i=0,r=Object.getOwnPropertySymbols(e);i<r.length;i++)t.indexOf(r[i])<0&&Object.prototype.propertyIsEnumerable.call(e,r[i])&&(n[r[i]]=e[r[i]]);return n}function n(e,t,n,r){function i(e){return e instanceof n?e:new n(function(t){t(e)})}return new(n||=Promise)(function(n,a){function o(e){try{c(r.next(e))}catch(e){a(e)}}function s(e){try{c(r.throw(e))}catch(e){a(e)}}function c(e){e.done?n(e.value):i(e.value).then(o,s)}c((r=r.apply(e,t||[])).next())})}let r=e=>e?(...t)=>e(...t):(...e)=>fetch(...e);var i=class extends Error{constructor(e,t=`FunctionsError`,n){super(e),this.name=t,this.context=n}toJSON(){return{name:this.name,message:this.message,context:this.context}}},a=class extends i{constructor(e){super(`Failed to send a request to the Edge Function`,`FunctionsFetchError`,e)}},o=class extends i{constructor(e){super(`Relay Error invoking the Edge Function`,`FunctionsRelayError`,e)}},s=class extends i{constructor(e){super(`Edge Function returned a non-2xx status code`,`FunctionsHttpError`,e)}},c;(function(e){e.Any=`any`,e.ApNortheast1=`ap-northeast-1`,e.ApNortheast2=`ap-northeast-2`,e.ApSouth1=`ap-south-1`,e.ApSoutheast1=`ap-southeast-1`,e.ApSoutheast2=`ap-southeast-2`,e.CaCentral1=`ca-central-1`,e.EuCentral1=`eu-central-1`,e.EuWest1=`eu-west-1`,e.EuWest2=`eu-west-2`,e.EuWest3=`eu-west-3`,e.SaEast1=`sa-east-1`,e.UsEast1=`us-east-1`,e.UsWest1=`us-west-1`,e.UsWest2=`us-west-2`})(c||={});var l=class{constructor(e,{headers:t={},customFetch:n,region:i=c.Any}={}){this.url=e,this.headers=t,this.region=i,this.fetch=r(n)}setAuth(e){this.headers.Authorization=`Bearer ${e}`}invoke(e){return n(this,arguments,void 0,function*(e,t={}){var n;let r,i,c;try{let{headers:n,method:l,body:u,signal:d,timeout:f}=t,p={},{region:m}=t;m||=this.region;let h=new URL(`${this.url}/${e}`);m&&m!==`any`&&(p[`x-region`]=m,h.searchParams.set(`forceFunctionRegion`,m));let g,ee=!!n&&Object.keys(n).some(e=>e.toLowerCase()===`content-type`);u&&!ee?typeof Blob<`u`&&u instanceof Blob||u instanceof ArrayBuffer?(p[`Content-Type`]=`application/octet-stream`,g=u):typeof u==`string`?(p[`Content-Type`]=`text/plain`,g=u):typeof FormData<`u`&&u instanceof FormData?g=u:(p[`Content-Type`]=`application/json`,g=JSON.stringify(u)):g=u&&typeof u!=`string`&&!(typeof Blob<`u`&&u instanceof Blob)&&!(u instanceof ArrayBuffer)&&!(typeof FormData<`u`&&u instanceof FormData)?JSON.stringify(u):u;let te=d;f&&(i=new AbortController,r=setTimeout(()=>i.abort(),f),d?(te=i.signal,c=()=>i.abort(),d.addEventListener(`abort`,c)):te=i.signal);let _=yield this.fetch(h.toString(),{method:l||`POST`,headers:Object.assign(Object.assign(Object.assign({},p),this.headers),n),body:g,signal:te}).catch(e=>{throw new a(e)}),ne=_.headers.get(`x-relay-error`);if(ne&&ne===`true`)throw new o(_);if(!_.ok)throw new s(_);let re=(_.headers.get(`Content-Type`)??`text/plain`).split(`;`)[0].trim().toLowerCase(),ie;return ie=re===`application/json`?yield _.json():re===`application/octet-stream`||re===`application/pdf`?yield _.blob():re===`text/event-stream`?_:re===`multipart/form-data`?yield _.formData():yield _.text(),{data:ie,error:null,response:_}}catch(e){return{data:null,error:e,response:e instanceof s||e instanceof o?e.context:void 0}}finally{r&&clearTimeout(r),c&&((n=t.signal)==null||n.removeEventListener(`abort`,c))}})}},u=class extends Error{constructor(e){super(e.message),this.name=`PostgrestError`,this.details=e.details,this.hint=e.hint,this.code=e.code}toJSON(){return{name:this.name,message:this.message,details:this.details,hint:this.hint,code:this.code}}};let d=e=>Math.min(1e3*2**e,3e4),f=[520,503],p=[`GET`,`HEAD`,`OPTIONS`];function m(e){"@babel/helpers - typeof";return m=typeof Symbol==`function`&&typeof Symbol.iterator==`symbol`?function(e){return typeof e}:function(e){return e&&typeof Symbol==`function`&&e.constructor===Symbol&&e!==Symbol.prototype?`symbol`:typeof e},m(e)}function h(e,t){if(m(e)!=`object`||!e)return e;var n=e[Symbol.toPrimitive];if(n!==void 0){var r=n.call(e,t||`default`);if(m(r)!=`object`)return r;throw TypeError(`@@toPrimitive must return a primitive value.`)}return(t===`string`?String:Number)(e)}function g(e){var t=h(e,`string`);return m(t)==`symbol`?t:t+``}function ee(e,t,n){return(t=g(t))in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function te(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),n.push.apply(n,r)}return n}function _(e){for(var t=1;t<arguments.length;t++){var n=arguments[t]==null?{}:arguments[t];t%2?te(Object(n),!0).forEach(function(t){ee(e,t,n[t])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):te(Object(n)).forEach(function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))})}return e}function ne(e,t){return new Promise(n=>{if(t?.aborted){n();return}let r=setTimeout(()=>{t?.removeEventListener(`abort`,i),n()},e);function i(){clearTimeout(r),n()}t?.addEventListener(`abort`,i)})}function re(e,t,n,r){return!(!r||n>=3||!p.includes(e)||!f.includes(t))}async function ie(e,t,n,r){let i=0;for(;;){let a=_({},n.headers);i>0&&(a[`X-Retry-Count`]=String(i));let o;try{o=await e(t,{method:n.method,headers:a,body:n.body,signal:n.signal})}catch(e){if(e?.name===`AbortError`||e?.code===`ABORT_ERR`||!p.includes(n.method))throw e;if(r&&i<3){let e=d(i);i++,await ne(e,n.signal);continue}throw e}if(re(n.method,o.status,i,r)){let e=o.headers?.get(`Retry-After`)??null,t=e===null?d(i):Math.max(0,parseInt(e,10)||0)*1e3;await o.text(),i++,await ne(t,n.signal);continue}return o}}var ae=class{constructor(e){this.shouldThrowOnError=!1,this.retryEnabled=!0,this.method=e.method,this.url=e.url,this.headers=new Headers(e.headers),this.schema=e.schema,this.body=e.body,this.shouldThrowOnError=e.shouldThrowOnError??!1,this.signal=e.signal,this.isMaybeSingle=e.isMaybeSingle??!1,this.shouldStripNulls=e.shouldStripNulls??!1,this.urlLengthLimit=e.urlLengthLimit??8e3,this.retryEnabled=e.retry??!0,e.fetch?this.fetch=e.fetch:this.fetch=fetch}throwOnError(){return this.shouldThrowOnError=!0,this}stripNulls(){if(this.headers.get(`Accept`)===`text/csv`)throw Error(`stripNulls() cannot be used with csv()`);return this.shouldStripNulls=!0,this}setHeader(e,t){return this.headers=new Headers(this.headers),this.headers.set(e,t),this}retry(e){return this.retryEnabled=e,this}then(e,t){var n=this;if(this.schema===void 0||([`GET`,`HEAD`].includes(this.method)?this.headers.set(`Accept-Profile`,this.schema):this.headers.set(`Content-Profile`,this.schema)),this.method!==`GET`&&this.method!==`HEAD`&&this.headers.set(`Content-Type`,`application/json`),this.shouldStripNulls){let e=this.headers.get(`Accept`);e===`application/vnd.pgrst.object+json`?this.headers.set(`Accept`,`application/vnd.pgrst.object+json;nulls=stripped`):(!e||e===`application/json`)&&this.headers.set(`Accept`,`application/vnd.pgrst.array+json;nulls=stripped`)}let r=this.fetch,i=(async()=>{let e={};n.headers.forEach((t,n)=>{e[n]=t});let t=await ie(r,n.url.toString(),{method:n.method,headers:e,body:JSON.stringify(n.body,(e,t)=>typeof t==`bigint`?t.toString():t),signal:n.signal},n.retryEnabled);return await n.processResponse(t)})();return this.shouldThrowOnError||(i=i.catch(e=>{let t=``,n=``,r=``,i=e?.cause;if(i){let n=i?.message??``,r=i?.code??``;t=`${e?.name??`FetchError`}: ${e?.message}`,t+=`\n\nCaused by: ${i?.name??`Error`}: ${n}`,r&&(t+=` (${r})`),i?.stack&&(t+=`\n${i.stack}`)}else t=e?.stack??``;let a=this.url.toString().length;return e?.name===`AbortError`||e?.code===`ABORT_ERR`?(r=``,n=`Request was aborted (timeout or manual cancellation)`,a>this.urlLengthLimit&&(n+=`. Note: Your request URL is ${a} characters, which may exceed server limits. If selecting many fields, consider using views. If filtering with large arrays (e.g., .in('id', [many IDs])), consider using an RPC function to pass values server-side.`)):(i?.name===`HeadersOverflowError`||i?.code===`UND_ERR_HEADERS_OVERFLOW`)&&(r=``,n=`HTTP headers exceeded server limits (typically 16KB)`,a>this.urlLengthLimit&&(n+=`. Your request URL is ${a} characters. If selecting many fields, consider using views. If filtering with large arrays (e.g., .in('id', [200+ IDs])), consider using an RPC function instead.`)),{success:!1,error:{message:`${e?.name??`FetchError`}: ${e?.message}`,details:t,hint:n,code:r},data:null,count:null,status:0,statusText:``}})),i.then(e,t)}async processResponse(e){var t=this;let n=null,r=null,i=null,a=e.status,o=e.statusText;if(e.ok){if(t.method!==`HEAD`){let i=await e.text();if(i!==``)if(t.headers.get(`Accept`)===`text/csv`)r=i;else if(t.headers.get(`Accept`)&&t.headers.get(`Accept`)?.includes(`application/vnd.pgrst.plan+text`))r=i;else try{r=JSON.parse(i)}catch{if(n={message:i},r=null,t.shouldThrowOnError)throw new u({message:i,details:``,hint:``,code:``})}}let s=t.headers.get(`Prefer`)?.match(/count=(exact|planned|estimated)/),c=e.headers.get(`content-range`)?.split(`/`);if(s&&c&&c.length>1&&(i=parseInt(c[1])),t.isMaybeSingle&&Array.isArray(r))if(r.length>1){if(n={code:`PGRST116`,details:`Results contain ${r.length} rows, application/vnd.pgrst.object+json requires 1 row`,hint:null,message:`JSON object requested, multiple (or no) rows returned`},r=null,i=null,a=406,o=`Not Acceptable`,t.shouldThrowOnError)throw new u(_(_({},n),{},{hint:n.hint??``}))}else r=r.length===1?r[0]:null}else{let i=await e.text();try{n=JSON.parse(i),Array.isArray(n)&&e.status===404&&(r=[],n=null,a=200,o=`OK`)}catch{e.status===404&&i===``?(a=204,o=`No Content`):n={message:i}}if(n&&t.shouldThrowOnError)throw new u(n)}return{success:n===null,error:n,data:r,count:i,status:a,statusText:o}}returns(){return this}overrideTypes(){return this}},oe=class extends ae{throwOnError(){return super.throwOnError()}select(e){let t=!1,n=(e??`*`).split(``).map(e=>/\s/.test(e)&&!t?``:(e===`"`&&(t=!t),e)).join(``);return this.url.searchParams.set(`select`,n),this.headers.append(`Prefer`,`return=representation`),this}order(e,{ascending:t=!0,nullsFirst:n,foreignTable:r,referencedTable:i=r}={}){let a=i?`${i}.order`:`order`,o=this.url.searchParams.get(a);return this.url.searchParams.set(a,`${o?`${o},`:``}${e}.${t?`asc`:`desc`}${n===void 0?``:n?`.nullsfirst`:`.nullslast`}`),this}limit(e,{foreignTable:t,referencedTable:n=t}={}){let r=n===void 0?`limit`:`${n}.limit`;return this.url.searchParams.set(r,`${e}`),this}range(e,t,{foreignTable:n,referencedTable:r=n}={}){let i=r===void 0?`offset`:`${r}.offset`,a=r===void 0?`limit`:`${r}.limit`;return this.url.searchParams.set(i,`${e}`),this.url.searchParams.set(a,`${t-e+1}`),this}abortSignal(e){return this.signal=e,this}single(){return this.headers.set(`Accept`,`application/vnd.pgrst.object+json`),this}maybeSingle(){return this.isMaybeSingle=!0,this}csv(){return this.headers.set(`Accept`,`text/csv`),this}geojson(){return this.headers.set(`Accept`,`application/geo+json`),this}explain({analyze:e=!1,verbose:t=!1,settings:n=!1,buffers:r=!1,wal:i=!1,format:a=`text`}={}){let o=[e?`analyze`:null,t?`verbose`:null,n?`settings`:null,r?`buffers`:null,i?`wal`:null].filter(Boolean).join(`|`),s=this.headers.get(`Accept`)??`application/json`;return this.headers.set(`Accept`,`application/vnd.pgrst.plan+${a}; for="${s}"; options=${o};`),this}rollback(){return this.headers.append(`Prefer`,`tx=rollback`),this}returns(){return this}maxAffected(e){return this.headers.append(`Prefer`,`handling=strict`),this.headers.append(`Prefer`,`max-affected=${e}`),this}};let se=RegExp(`[,()]`);var ce=class extends oe{throwOnError(){return super.throwOnError()}eq(e,t){return this.url.searchParams.append(e,`eq.${t}`),this}neq(e,t){return this.url.searchParams.append(e,`neq.${t}`),this}gt(e,t){return this.url.searchParams.append(e,`gt.${t}`),this}gte(e,t){return this.url.searchParams.append(e,`gte.${t}`),this}lt(e,t){return this.url.searchParams.append(e,`lt.${t}`),this}lte(e,t){return this.url.searchParams.append(e,`lte.${t}`),this}like(e,t){return this.url.searchParams.append(e,`like.${t}`),this}likeAllOf(e,t){return this.url.searchParams.append(e,`like(all).{${t.join(`,`)}}`),this}likeAnyOf(e,t){return this.url.searchParams.append(e,`like(any).{${t.join(`,`)}}`),this}ilike(e,t){return this.url.searchParams.append(e,`ilike.${t}`),this}ilikeAllOf(e,t){return this.url.searchParams.append(e,`ilike(all).{${t.join(`,`)}}`),this}ilikeAnyOf(e,t){return this.url.searchParams.append(e,`ilike(any).{${t.join(`,`)}}`),this}regexMatch(e,t){return this.url.searchParams.append(e,`match.${t}`),this}regexIMatch(e,t){return this.url.searchParams.append(e,`imatch.${t}`),this}is(e,t){return this.url.searchParams.append(e,`is.${t}`),this}isDistinct(e,t){return this.url.searchParams.append(e,`isdistinct.${t}`),this}in(e,t){let n=Array.from(new Set(t)).map(e=>typeof e==`string`&&se.test(e)?`"${e}"`:`${e}`).join(`,`);return this.url.searchParams.append(e,`in.(${n})`),this}notIn(e,t){let n=Array.from(new Set(t)).map(e=>typeof e==`string`&&se.test(e)?`"${e}"`:`${e}`).join(`,`);return this.url.searchParams.append(e,`not.in.(${n})`),this}contains(e,t){return typeof t==`string`?this.url.searchParams.append(e,`cs.${t}`):Array.isArray(t)?this.url.searchParams.append(e,`cs.{${t.join(`,`)}}`):this.url.searchParams.append(e,`cs.${JSON.stringify(t)}`),this}containedBy(e,t){return typeof t==`string`?this.url.searchParams.append(e,`cd.${t}`):Array.isArray(t)?this.url.searchParams.append(e,`cd.{${t.join(`,`)}}`):this.url.searchParams.append(e,`cd.${JSON.stringify(t)}`),this}rangeGt(e,t){return this.url.searchParams.append(e,`sr.${t}`),this}rangeGte(e,t){return this.url.searchParams.append(e,`nxl.${t}`),this}rangeLt(e,t){return this.url.searchParams.append(e,`sl.${t}`),this}rangeLte(e,t){return this.url.searchParams.append(e,`nxr.${t}`),this}rangeAdjacent(e,t){return this.url.searchParams.append(e,`adj.${t}`),this}overlaps(e,t){return typeof t==`string`?this.url.searchParams.append(e,`ov.${t}`):this.url.searchParams.append(e,`ov.{${t.join(`,`)}}`),this}textSearch(e,t,{config:n,type:r}={}){let i=``;r===`plain`?i=`pl`:r===`phrase`?i=`ph`:r===`websearch`&&(i=`w`);let a=n===void 0?``:`(${n})`;return this.url.searchParams.append(e,`${i}fts${a}.${t}`),this}match(e){return Object.entries(e).filter(([e,t])=>t!==void 0).forEach(([e,t])=>{this.url.searchParams.append(e,`eq.${t}`)}),this}not(e,t,n){return this.url.searchParams.append(e,`not.${t}.${n}`),this}or(e,{foreignTable:t,referencedTable:n=t}={}){let r=n?`${n}.or`:`or`;return this.url.searchParams.append(r,`(${e})`),this}filter(e,t,n){return this.url.searchParams.append(e,`${t}.${n}`),this}},le=class{constructor(e,{headers:t={},schema:n,fetch:r,urlLengthLimit:i=8e3,retry:a}){this.url=e,this.headers=new Headers(t),this.schema=n,this.fetch=r,this.urlLengthLimit=i,this.retry=a}cloneRequestState(){return{url:new URL(this.url.toString()),headers:new Headers(this.headers)}}select(e,t){let{head:n=!1,count:r}=t??{},i=n?`HEAD`:`GET`,a=!1,o=(e??`*`).split(``).map(e=>/\s/.test(e)&&!a?``:(e===`"`&&(a=!a),e)).join(``),{url:s,headers:c}=this.cloneRequestState();return s.searchParams.set(`select`,o),r&&c.append(`Prefer`,`count=${r}`),new ce({method:i,url:s,headers:c,schema:this.schema,fetch:this.fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}insert(e,{count:t,defaultToNull:n=!0}={}){let{url:r,headers:i}=this.cloneRequestState();if(t&&i.append(`Prefer`,`count=${t}`),n||i.append(`Prefer`,`missing=default`),Array.isArray(e)){let t=e.reduce((e,t)=>e.concat(Object.keys(t)),[]);if(t.length>0){let e=[...new Set(t)].map(e=>`"${e}"`);r.searchParams.set(`columns`,e.join(`,`))}}return new ce({method:`POST`,url:r,headers:i,schema:this.schema,body:e,fetch:this.fetch??fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}upsert(e,{onConflict:t,ignoreDuplicates:n=!1,count:r,defaultToNull:i=!0}={}){let{url:a,headers:o}=this.cloneRequestState();if(o.append(`Prefer`,`resolution=${n?`ignore`:`merge`}-duplicates`),t!==void 0&&a.searchParams.set(`on_conflict`,t),r&&o.append(`Prefer`,`count=${r}`),i||o.append(`Prefer`,`missing=default`),Array.isArray(e)){let t=e.reduce((e,t)=>e.concat(Object.keys(t)),[]);if(t.length>0){let e=[...new Set(t)].map(e=>`"${e}"`);a.searchParams.set(`columns`,e.join(`,`))}}return new ce({method:`POST`,url:a,headers:o,schema:this.schema,body:e,fetch:this.fetch??fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}update(e,{count:t}={}){let{url:n,headers:r}=this.cloneRequestState();return t&&r.append(`Prefer`,`count=${t}`),new ce({method:`PATCH`,url:n,headers:r,schema:this.schema,body:e,fetch:this.fetch??fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}delete({count:e}={}){let{url:t,headers:n}=this.cloneRequestState();return e&&n.append(`Prefer`,`count=${e}`),new ce({method:`DELETE`,url:t,headers:n,schema:this.schema,fetch:this.fetch??fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}};function ue(e,t){try{let t=JSON.parse(e);if(t&&typeof t==`object`&&!Array.isArray(t))return new u({message:String(t.message??e),details:t.details??``,hint:t.hint??``,code:t.code??``})}catch{}return new u({message:e||t,details:``,hint:``,code:``})}function de(e,t,n){let r=e;return{success:!1,error:new u({message:`${r?.name??`FetchError`}: ${r?.message}`,details:``,hint:``,code:``}),data:null,count:null,status:t,statusText:n}}var fe=class e{constructor(e,{headers:t={},schema:n,fetch:r,timeout:i,urlLengthLimit:a=8e3,retry:o}={}){this.url=e,this.headers=new Headers(t),this.schemaName=n,this.urlLengthLimit=a;let s=r??globalThis.fetch;i!==void 0&&i>0?this.fetch=(e,t)=>{let n=new AbortController,r=setTimeout(()=>n.abort(),i),a=t?.signal;if(a){if(a.aborted)return clearTimeout(r),s(e,t);let i=()=>{clearTimeout(r),n.abort()};return a.addEventListener(`abort`,i,{once:!0}),s(e,_(_({},t),{},{signal:n.signal})).finally(()=>{clearTimeout(r),a.removeEventListener(`abort`,i)})}return s(e,_(_({},t),{},{signal:n.signal})).finally(()=>clearTimeout(r))}:this.fetch=s,this.retry=o}from(e){if(!e||typeof e!=`string`||e.trim()===``)throw Error(`Invalid relation name: relation must be a non-empty string.`);return new le(new URL(`${this.url}/${e}`),{headers:new Headers(this.headers),schema:this.schemaName,fetch:this.fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}schema(t){return new e(this.url,{headers:this.headers,schema:t,fetch:this.fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}async getOpenApiSpec(){var e=this;let t=new Headers(e.headers);t.set(`Accept`,`application/openapi+json`),e.schemaName&&t.set(`Accept-Profile`,e.schemaName);let n={};t.forEach((e,t)=>{n[t]=e});let r=e.fetch??globalThis.fetch,i;try{i=await ie(r,`${e.url}/`,{method:`GET`,headers:n},e.retry??!0)}catch(e){return de(e,0,``)}let a;try{a=await i.text()}catch(e){return de(e,i.status,i.statusText)}if(i.ok)try{return{success:!0,error:null,data:JSON.parse(a),count:null,status:i.status,statusText:i.statusText}}catch{}return{success:!1,error:ue(a,i.statusText),data:null,count:null,status:i.status,statusText:i.statusText}}rpc(e,t={},{head:n=!1,get:r=!1,count:i}={}){let a,o=new URL(`${this.url}/rpc/${e}`),s,c=e=>typeof e==`object`&&!!e&&(!Array.isArray(e)||e.some(c)),l=n&&Object.values(t).some(c);l?(a=`POST`,s=t):n||r?(a=n?`HEAD`:`GET`,Object.entries(t).filter(([e,t])=>t!==void 0).map(([e,t])=>[e,Array.isArray(t)?`{${t.join(`,`)}}`:`${t}`]).forEach(([e,t])=>{o.searchParams.append(e,t)})):(a=`POST`,s=t);let u=new Headers(this.headers);return l?u.set(`Prefer`,i?`count=${i},return=minimal`:`return=minimal`):i&&u.set(`Prefer`,`count=${i}`),new ce({method:a,url:o,headers:u,schema:this.schemaName,body:s,fetch:this.fetch??fetch,urlLengthLimit:this.urlLengthLimit,retry:this.retry})}},pe=class{constructor(){}static detectEnvironment(){if(typeof WebSocket<`u`)return{type:`native`,wsConstructor:WebSocket};let e=globalThis;if(typeof globalThis<`u`&&e.WebSocket!==void 0)return{type:`native`,wsConstructor:e.WebSocket};let t=typeof global<`u`?global:void 0;if(t&&t.WebSocket!==void 0)return{type:`native`,wsConstructor:t.WebSocket};if(typeof globalThis<`u`&&e.WebSocketPair!==void 0&&globalThis.WebSocket===void 0)return{type:`cloudflare`,error:`Cloudflare Workers detected. WebSocket clients are not supported in Cloudflare Workers.`,workaround:`Use Cloudflare Workers WebSocket API for server-side WebSocket handling, or deploy to a different runtime.`};if(typeof globalThis<`u`&&e.EdgeRuntime||typeof navigator<`u`&&navigator.userAgent?.includes(`Vercel-Edge`))return{type:`unsupported`,error:`Edge runtime detected (Vercel Edge/Netlify Edge). WebSockets are not supported in edge functions.`,workaround:`Use serverless functions or a different deployment target for WebSocket functionality.`};let n=globalThis.process;if(n){let e=n.versions;if(e&&e.node)return{type:`unsupported`,error:`Node.js detected but native WebSocket not found.`,workaround:`Ensure you are running Node.js 22+ or provide a WebSocket implementation via the transport option.`}}return{type:`unsupported`,error:`Unknown JavaScript runtime without WebSocket support.`,workaround:`Ensure you're running in a supported environment (browser, Node.js, Deno) or provide a custom WebSocket implementation.`}}static getWebSocketConstructor(){let e=this.detectEnvironment();if(e.wsConstructor)return e.wsConstructor;let t=e.error||`WebSocket not supported in this environment.`;throw e.workaround&&(t+=`\n\nSuggested solution: ${e.workaround}`),Error(t)}static isWebSocketSupported(){try{return this.detectEnvironment().type===`native`}catch{return!1}}};let v={closed:`closed`,errored:`errored`,joined:`joined`,joining:`joining`,leaving:`leaving`},me={close:`phx_close`,error:`phx_error`,join:`phx_join`,reply:`phx_reply`,leave:`phx_leave`,access_token:`access_token`},he={connecting:`connecting`,open:`open`,closing:`closing`,closed:`closed`};var ge=class{constructor(e){this.HEADER_LENGTH=1,this.USER_BROADCAST_PUSH_META_LENGTH=6,this.KINDS={userBroadcastPush:3,userBroadcast:4},this.BINARY_ENCODING=0,this.JSON_ENCODING=1,this.BROADCAST_EVENT=`broadcast`,this.allowedMetadataKeys=[],this.allowedMetadataKeys=e??[]}encode(e,t){if(e.event===this.BROADCAST_EVENT&&!(e.payload instanceof ArrayBuffer)&&typeof e.payload.event==`string`)return t(this._binaryEncodeUserBroadcastPush(e));let n=[e.join_ref,e.ref,e.topic,e.event,e.payload];return t(JSON.stringify(n))}_binaryEncodeUserBroadcastPush(e){return this._isArrayBuffer(e.payload?.payload)?this._encodeBinaryUserBroadcastPush(e):this._encodeJsonUserBroadcastPush(e)}_encodeBinaryUserBroadcastPush(e){let t=e.payload?.payload??new ArrayBuffer(0);return this._encodeUserBroadcastPush(e,this.BINARY_ENCODING,t)}_encodeJsonUserBroadcastPush(e){let t=e.payload?.payload??{},n=new TextEncoder().encode(JSON.stringify(t)).buffer;return this._encodeUserBroadcastPush(e,this.JSON_ENCODING,n)}_encodeUserBroadcastPush(e,t,n){let r=new TextEncoder,i=r.encode(e.topic),a=r.encode(e.ref??``),o=r.encode(e.join_ref??``),s=r.encode(e.payload.event),c=this.allowedMetadataKeys?this._pick(e.payload,this.allowedMetadataKeys):{},l=r.encode(Object.keys(c).length===0?``:JSON.stringify(c));if(o.length>255)throw Error(`joinRef length ${o.length} exceeds maximum of 255`);if(a.length>255)throw Error(`ref length ${a.length} exceeds maximum of 255`);if(i.length>255)throw Error(`topic length ${i.length} exceeds maximum of 255`);if(s.length>255)throw Error(`userEvent length ${s.length} exceeds maximum of 255`);if(l.length>255)throw Error(`metadata length ${l.length} exceeds maximum of 255`);let u=this.USER_BROADCAST_PUSH_META_LENGTH+o.length+a.length+i.length+s.length+l.length,d=new ArrayBuffer(this.HEADER_LENGTH+u),f=new DataView(d),p=new Uint8Array(d),m=0;f.setUint8(m++,this.KINDS.userBroadcastPush),f.setUint8(m++,o.length),f.setUint8(m++,a.length),f.setUint8(m++,i.length),f.setUint8(m++,s.length),f.setUint8(m++,l.length),f.setUint8(m++,t),p.set(o,m),m+=o.length,p.set(a,m),m+=a.length,p.set(i,m),m+=i.length,p.set(s,m),m+=s.length,p.set(l,m),m+=l.length;var h=new Uint8Array(d.byteLength+n.byteLength);return h.set(new Uint8Array(d),0),h.set(new Uint8Array(n),d.byteLength),h.buffer}decode(e,t){if(this._isArrayBuffer(e))return t(this._binaryDecode(e));if(typeof e==`string`){let[n,r,i,a,o]=JSON.parse(e);return t({join_ref:n,ref:r,topic:i,event:a,payload:o})}return t({})}_binaryDecode(e){let t=new DataView(e),n=t.getUint8(0),r=new TextDecoder;switch(n){case this.KINDS.userBroadcast:return this._decodeUserBroadcast(e,t,r)}}_decodeUserBroadcast(e,t,n){let r=t.getUint8(1),i=t.getUint8(2),a=t.getUint8(3),o=t.getUint8(4),s=this.HEADER_LENGTH+4,c=n.decode(e.slice(s,s+r));s+=r;let l=n.decode(e.slice(s,s+i));s+=i;let u=n.decode(e.slice(s,s+a));s+=a;let d=e.slice(s,e.byteLength),f=o===this.JSON_ENCODING?JSON.parse(n.decode(d)):d,p={type:this.BROADCAST_EVENT,event:l,payload:f};return a>0&&(p.meta=JSON.parse(u)),{join_ref:null,ref:null,topic:c,event:this.BROADCAST_EVENT,payload:p}}_isArrayBuffer(e){return e instanceof ArrayBuffer||e?.constructor?.name===`ArrayBuffer`}_pick(e,t){return!e||typeof e!=`object`?{}:Object.fromEntries(Object.entries(e).filter(([e])=>t.includes(e)))}},y;(function(e){e.abstime=`abstime`,e.bool=`bool`,e.date=`date`,e.daterange=`daterange`,e.float4=`float4`,e.float8=`float8`,e.int2=`int2`,e.int4=`int4`,e.int4range=`int4range`,e.int8=`int8`,e.int8range=`int8range`,e.json=`json`,e.jsonb=`jsonb`,e.money=`money`,e.numeric=`numeric`,e.oid=`oid`,e.reltime=`reltime`,e.text=`text`,e.time=`time`,e.timestamp=`timestamp`,e.timestamptz=`timestamptz`,e.timetz=`timetz`,e.tsrange=`tsrange`,e.tstzrange=`tstzrange`})(y||={});let _e=(e,t,n={})=>{let r=n.skipTypes??[];return t?Object.keys(t).reduce((n,i)=>(n[i]=ve(i,e,t,r),n),{}):{}},ve=(e,t,n,r)=>{let i=t.find(t=>t.name===e)?.type,a=n[e];return i&&!r.includes(i)?ye(i,a):be(a)},ye=(e,t)=>{if(e.charAt(0)===`_`)return we(t,e.slice(1,e.length));switch(e){case y.bool:return xe(t);case y.float4:case y.float8:case y.int2:case y.int4:case y.int8:case y.numeric:case y.oid:return Se(t);case y.json:case y.jsonb:return Ce(t);case y.timestamp:return Te(t);case y.abstime:case y.date:case y.daterange:case y.int4range:case y.int8range:case y.money:case y.reltime:case y.text:case y.time:case y.timestamptz:case y.timetz:case y.tsrange:case y.tstzrange:return be(t);default:return be(t)}},be=e=>e,xe=e=>{switch(e){case`t`:return!0;case`f`:return!1;default:return e}},Se=e=>{if(typeof e==`string`){let t=parseFloat(e);if(!Number.isNaN(t))return t}return e},Ce=e=>{if(typeof e==`string`)try{return JSON.parse(e)}catch{return e}return e},we=(e,t)=>{if(typeof e!=`string`)return e;let n=e.length-1,r=e[n];if(e[0]===`{`&&r===`}`){let r,i=e.slice(1,n);try{r=JSON.parse(`[`+i+`]`)}catch{r=i?i.split(`,`):[]}return r.map(e=>ye(t,e))}return e},Te=e=>typeof e==`string`?e.replace(` `,`T`):e,Ee=e=>{let t=new URL(e);return t.protocol=t.protocol.replace(/^ws/i,`http`),t.pathname=t.pathname.replace(/\/+$/,``).replace(/\/socket\/websocket$/i,``).replace(/\/socket$/i,``).replace(/\/websocket$/i,``),t.pathname===``||t.pathname===`/`?t.pathname=`/api/broadcast`:t.pathname+=`/api/broadcast`,t.href};var b=e=>typeof e==`function`?e:function(){return e},De=typeof self<`u`?self:null,Oe=typeof window<`u`?window:null,x=De||Oe||globalThis,ke=`2.0.0`,Ae=1e4,je=1e3,Me=100,S={connecting:0,open:1,closing:2,closed:3},C={closed:`closed`,errored:`errored`,joined:`joined`,joining:`joining`,leaving:`leaving`},w={close:`phx_close`,error:`phx_error`,join:`phx_join`,reply:`phx_reply`,leave:`phx_leave`},Ne={longpoll:`longpoll`,websocket:`websocket`},Pe={complete:4},Fe=`base64url.bearer.phx.`,Ie=class{constructor(e,t,n,r){this.channel=e,this.event=t,this.payload=n||function(){return{}},this.receivedResp=null,this.timeout=r,this.timeoutTimer=null,this.recHooks=[],this.sent=!1,this.ref=void 0}resend(e){this.timeout=e,this.reset(),this.send()}send(){this.hasReceived(`timeout`)||(this.startTimeout(),this.sent=!0,this.channel.socket.push({topic:this.channel.topic,event:this.event,payload:this.payload(),ref:this.ref,join_ref:this.channel.joinRef()}))}receive(e,t){return this.hasReceived(e)&&t(this.receivedResp.response),this.recHooks.push({status:e,callback:t}),this}reset(){this.cancelRefEvent(),this.ref=null,this.refEvent=null,this.receivedResp=null,this.sent=!1}destroy(){this.cancelRefEvent(),this.cancelTimeout()}matchReceive({status:e,response:t,_ref:n}){this.recHooks.filter(t=>t.status===e).forEach(e=>e.callback(t))}cancelRefEvent(){this.refEvent&&this.channel.off(this.refEvent)}cancelTimeout(){clearTimeout(this.timeoutTimer),this.timeoutTimer=null}startTimeout(){this.timeoutTimer&&this.cancelTimeout(),this.ref=this.channel.socket.makeRef(),this.refEvent=this.channel.replyEventName(this.ref),this.channel.on(this.refEvent,e=>{this.cancelRefEvent(),this.cancelTimeout(),this.receivedResp=e,this.matchReceive(e)}),this.timeoutTimer=setTimeout(()=>{this.trigger(`timeout`,{})},this.timeout)}hasReceived(e){return this.receivedResp&&this.receivedResp.status===e}trigger(e,t){this.channel.trigger(this.refEvent,{status:e,response:t})}},Le=class{constructor(e,t){this.callback=e,this.timerCalc=t,this.timer=void 0,this.tries=0}reset(){this.tries=0,clearTimeout(this.timer)}scheduleTimeout(){clearTimeout(this.timer),this.timer=setTimeout(()=>{this.tries+=1,this.callback()},this.timerCalc(this.tries+1))}},Re=class{constructor(e,t,n){this.state=C.closed,this.topic=e,this.params=b(t||{}),this.socket=n,this.bindings=[],this.bindingRef=0,this.timeout=this.socket.timeout,this.joinedOnce=!1,this.joinPush=new Ie(this,w.join,this.params,this.timeout),this.pushBuffer=[],this.stateChangeRefs=[],this.rejoinTimer=new Le(()=>{this.socket.isConnected()&&this.rejoin()},this.socket.rejoinAfterMs),this.stateChangeRefs.push(this.socket.onError(()=>this.rejoinTimer.reset())),this.stateChangeRefs.push(this.socket.onOpen(()=>{this.rejoinTimer.reset(),this.isErrored()&&this.rejoin()})),this.joinPush.receive(`ok`,()=>{this.state=C.joined,this.rejoinTimer.reset(),this.pushBuffer.forEach(e=>e.send()),this.pushBuffer=[]}),this.joinPush.receive(`error`,e=>{this.state=C.errored,this.socket.hasLogger()&&this.socket.log(`channel`,`error ${this.topic}`,e),this.socket.isConnected()&&this.rejoinTimer.scheduleTimeout()}),this.onClose(()=>{this.rejoinTimer.reset(),this.socket.hasLogger()&&this.socket.log(`channel`,`close ${this.topic}`),this.state=C.closed,this.socket.remove(this)}),this.onError(e=>{this.socket.hasLogger()&&this.socket.log(`channel`,`error ${this.topic}`,e),this.isJoining()&&this.joinPush.reset(),this.state=C.errored,this.socket.isConnected()&&this.rejoinTimer.scheduleTimeout()}),this.joinPush.receive(`timeout`,()=>{this.socket.hasLogger()&&this.socket.log(`channel`,`timeout ${this.topic}`,this.joinPush.timeout),new Ie(this,w.leave,b({}),this.timeout).send(),this.state=C.errored,this.joinPush.reset(),this.socket.isConnected()&&this.rejoinTimer.scheduleTimeout()}),this.on(w.reply,(e,t)=>{this.trigger(this.replyEventName(t),e)})}join(e=this.timeout){if(this.joinedOnce)throw Error(`tried to join multiple times. 'join' can only be called a single time per channel instance`);return this.timeout=e,this.joinedOnce=!0,this.rejoin(),this.joinPush}teardown(){this.pushBuffer.forEach(e=>e.destroy()),this.pushBuffer=[],this.rejoinTimer.reset(),this.joinPush.destroy(),this.state=C.closed,this.bindings=[]}onClose(e){this.on(w.close,e)}onError(e){return this.on(w.error,t=>e(t))}on(e,t){let n=this.bindingRef++;return this.bindings.push({event:e,ref:n,callback:t}),n}off(e,t){this.bindings=this.bindings.filter(n=>!(n.event===e&&(t===void 0||t===n.ref)))}canPush(){return this.socket.isConnected()&&this.isJoined()}push(e,t,n=this.timeout){if(t||={},!this.joinedOnce)throw Error(`tried to push '${e}' to '${this.topic}' before joining. Use channel.join() before pushing events`);let r=new Ie(this,e,function(){return t},n);return this.canPush()?r.send():(r.startTimeout(),this.pushBuffer.push(r)),r}leave(e=this.timeout){this.rejoinTimer.reset(),this.joinPush.cancelTimeout(),this.state=C.leaving;let t=()=>{this.socket.hasLogger()&&this.socket.log(`channel`,`leave ${this.topic}`),this.trigger(w.close,`leave`)},n=new Ie(this,w.leave,b({}),e);return n.receive(`ok`,()=>t()).receive(`timeout`,()=>t()),n.send(),this.canPush()||n.trigger(`ok`,{}),n}onMessage(e,t,n){return t}filterBindings(e,t,n){return!0}isMember(e,t,n,r){return this.topic===e?r&&r!==this.joinRef()?(this.socket.hasLogger()&&this.socket.log(`channel`,`dropping outdated message`,{topic:e,event:t,payload:n,joinRef:r}),!1):!0:!1}joinRef(){return this.joinPush.ref}rejoin(e=this.timeout){this.isLeaving()||(this.socket.leaveOpenTopic(this.topic),this.state=C.joining,this.joinPush.resend(e))}trigger(e,t,n,r){let i=this.onMessage(e,t,n,r);if(t&&!i)throw Error(`channel onMessage callbacks must return the payload, modified or unmodified`);let a=this.bindings.filter(r=>r.event===e&&this.filterBindings(r,t,n));for(let e=0;e<a.length;e++)a[e].callback(i,n,r||this.joinRef())}replyEventName(e){return`chan_reply_${e}`}isClosed(){return this.state===C.closed}isErrored(){return this.state===C.errored}isJoined(){return this.state===C.joined}isJoining(){return this.state===C.joining}isLeaving(){return this.state===C.leaving}},ze=class{static request(e,t,n,r,i,a,o){if(x.XDomainRequest){let n=new x.XDomainRequest;return this.xdomainRequest(n,e,t,r,i,a,o)}else if(x.XMLHttpRequest){let s=new x.XMLHttpRequest;return this.xhrRequest(s,e,t,n,r,i,a,o)}else if(x.fetch&&x.AbortController)return this.fetchRequest(e,t,n,r,i,a,o);else throw Error(`No suitable XMLHttpRequest implementation found`)}static fetchRequest(e,t,n,r,i,a,o){let s={method:e,headers:n,body:r},c=null;return i&&(c=new AbortController,setTimeout(()=>c.abort(),i),s.signal=c.signal),x.fetch(t,s).then(e=>e.text()).then(e=>this.parseJSON(e)).then(e=>o&&o(e)).catch(e=>{e.name===`AbortError`&&a?a():o&&o(null)}),c}static xdomainRequest(e,t,n,r,i,a,o){return e.timeout=i,e.open(t,n),e.onload=()=>{let t=this.parseJSON(e.responseText);o&&o(t)},a&&(e.ontimeout=a),e.onprogress=()=>{},e.send(r),e}static xhrRequest(e,t,n,r,i,a,o,s){e.open(t,n,!0),e.timeout=a;for(let[t,n]of Object.entries(r))e.setRequestHeader(t,n);return e.onerror=()=>s&&s(null),e.onreadystatechange=()=>{e.readyState===Pe.complete&&s&&s(this.parseJSON(e.responseText))},o&&(e.ontimeout=o),e.send(i),e}static parseJSON(e){if(!e||e===``)return null;try{return JSON.parse(e)}catch{return console&&console.log(`failed to parse JSON response`,e),null}}static serialize(e,t){let n=[];for(var r in e){if(!Object.prototype.hasOwnProperty.call(e,r))continue;let i=t?`${t}[${r}]`:r,a=e[r];typeof a==`object`?n.push(this.serialize(a,i)):n.push(encodeURIComponent(i)+`=`+encodeURIComponent(a))}return n.join(`&`)}static appendParams(e,t){return Object.keys(t).length===0?e:`${e}${e.match(/\?/)?`&`:`?`}${this.serialize(t)}`}},Be=e=>{let t=``,n=new Uint8Array(e),r=n.byteLength;for(let e=0;e<r;e++)t+=String.fromCharCode(n[e]);return btoa(t)},Ve=class{constructor(e,t){t&&t.length===2&&t[1].startsWith(Fe)&&(this.authToken=atob(t[1].slice(Fe.length))),this.endPoint=null,this.token=null,this.skipHeartbeat=!0,this.reqs=new Set,this.awaitingBatchAck=!1,this.currentBatch=null,this.currentBatchTimer=null,this.batchBuffer=[],this.onopen=function(){},this.onerror=function(){},this.onmessage=function(){},this.onclose=function(){},this.pollEndpoint=this.normalizeEndpoint(e),this.readyState=S.connecting,setTimeout(()=>this.poll(),0)}normalizeEndpoint(e){return e.replace(`ws://`,`http://`).replace(`wss://`,`https://`).replace(RegExp(`(.*)/`+Ne.websocket),`$1/`+Ne.longpoll)}endpointURL(){return ze.appendParams(this.pollEndpoint,{token:this.token})}closeAndRetry(e,t,n){this.close(e,t,n),this.readyState=S.connecting}ontimeout(){this.onerror(`timeout`),this.closeAndRetry(1005,`timeout`,!1)}isActive(){return this.readyState===S.open||this.readyState===S.connecting}poll(){let e={Accept:`application/json`};this.authToken&&(e[`X-Phoenix-AuthToken`]=this.authToken),this.ajax(`GET`,e,null,()=>this.ontimeout(),e=>{if(e){var{status:t,token:n,messages:r}=e;if(t===410&&this.token!==null){this.onerror(410),this.closeAndRetry(3410,`session_gone`,!1);return}this.token=n}else t=0;switch(t){case 200:r.forEach(e=>{setTimeout(()=>this.onmessage({data:e}),0)}),this.poll();break;case 204:this.poll();break;case 410:this.readyState=S.open,this.onopen({}),this.poll();break;case 403:this.onerror(403),this.close(1008,`forbidden`,!1);break;case 0:case 500:this.onerror(500),this.closeAndRetry(1011,`internal server error`,500);break;default:throw Error(`unhandled poll status ${t}`)}})}send(e){typeof e!=`string`&&(e=Be(e)),this.currentBatch?this.currentBatch.push(e):this.awaitingBatchAck?this.batchBuffer.push(e):(this.currentBatch=[e],this.currentBatchTimer=setTimeout(()=>{this.batchSend(this.currentBatch),this.currentBatch=null},0))}batchSend(e,t=0){this.awaitingBatchAck=!0;let n=t+Me,r=e.slice(t,n);this.ajax(`POST`,{"Content-Type":`application/x-ndjson`},r.join(`
`),()=>this.onerror(`timeout`),t=>{!t||t.status!==200?(this.awaitingBatchAck=!1,this.onerror(t&&t.status),this.closeAndRetry(1011,`internal server error`,!1)):n<e.length?this.batchSend(e,n):this.batchBuffer.length>0?(this.batchSend(this.batchBuffer),this.batchBuffer=[]):this.awaitingBatchAck=!1})}close(e,t,n){for(let e of this.reqs)e.abort();this.readyState=S.closed;let r=Object.assign({code:1e3,reason:void 0,wasClean:!0},{code:e,reason:t,wasClean:n});this.batchBuffer=[],clearTimeout(this.currentBatchTimer),this.currentBatchTimer=null,typeof CloseEvent<`u`?this.onclose(new CloseEvent(`close`,r)):this.onclose(r)}ajax(e,t,n,r,i){let a;a=ze.request(e,this.endpointURL(),t,n,this.timeout,()=>{this.reqs.delete(a),r()},e=>{this.reqs.delete(a),this.isActive()&&i(e)}),this.reqs.add(a)}},He=class e{constructor(t,n={}){let r=n.events||{state:`presence_state`,diff:`presence_diff`};this.state=Object.create(null),this.pendingDiffs=[],this.channel=t,this.joinRef=null,this.caller={onJoin:function(){},onLeave:function(){},onSync:function(){}},this.channel.on(r.state,t=>{let{onJoin:n,onLeave:r,onSync:i}=this.caller;this.joinRef=this.channel.joinRef(),this.state=e.syncState(this.state,t,n,r),this.pendingDiffs.forEach(t=>{this.state=e.syncDiff(this.state,t,n,r)}),this.pendingDiffs=[],i()}),this.channel.on(r.diff,t=>{let{onJoin:n,onLeave:r,onSync:i}=this.caller;this.inPendingSyncState()?this.pendingDiffs.push(t):(this.state=e.syncDiff(this.state,t,n,r),i())})}onJoin(e){this.caller.onJoin=e}onLeave(e){this.caller.onLeave=e}onSync(e){this.caller.onSync=e}list(t){return e.list(this.state,t)}inPendingSyncState(){return!this.joinRef||this.joinRef!==this.channel.joinRef()}static syncState(e,t,n,r){let i=this.toNullProtoObj(this.clone(e));t=this.toNullProtoObj(t);let a=Object.create(null),o=Object.create(null);return this.map(i,(e,n)=>{t[e]||(o[e]=n)}),this.map(t,(e,t)=>{let n=i[e];if(n){let r=t.metas.map(e=>e.phx_ref),i=n.metas.map(e=>e.phx_ref),s=t.metas.filter(e=>i.indexOf(e.phx_ref)<0),c=n.metas.filter(e=>r.indexOf(e.phx_ref)<0);s.length>0&&(a[e]=t,a[e].metas=s),c.length>0&&(o[e]=this.clone(n),o[e].metas=c)}else a[e]=t}),this.syncDiff(i,{joins:a,leaves:o},n,r)}static syncDiff(e,t,n,r){e=this.toNullProtoObj(e);let{joins:i,leaves:a}=this.clone(t);return n||=function(){},r||=function(){},this.map(i,(t,r)=>{let i=e[t];if(e[t]=this.clone(r),i){let n=e[t].metas.map(e=>e.phx_ref),r=i.metas.filter(e=>n.indexOf(e.phx_ref)<0);e[t].metas.unshift(...r)}n(t,i,r)}),this.map(a,(t,n)=>{let i=e[t];if(!i)return;let a=n.metas.map(e=>e.phx_ref);i.metas=i.metas.filter(e=>a.indexOf(e.phx_ref)<0),r(t,i,n),i.metas.length===0&&delete e[t]}),e}static list(e,t){return t||=function(e,t){return t},this.map(e,(e,n)=>t(e,n))}static map(e,t){return Object.getOwnPropertyNames(e).map(n=>t(n,e[n]))}static toNullProtoObj(e){if(Object.getPrototypeOf(e)===null)return e;let t=Object.create(null);return Object.getOwnPropertyNames(e).forEach(n=>{t[n]=e[n]}),t}static clone(e){return JSON.parse(JSON.stringify(e))}},Ue={HEADER_LENGTH:1,META_LENGTH:4,KINDS:{push:0,reply:1,broadcast:2},encode(e,t){if(e.payload.constructor===ArrayBuffer)return t(this.binaryEncode(e));{let n=[e.join_ref,e.ref,e.topic,e.event,e.payload];return t(JSON.stringify(n))}},decode(e,t){if(e.constructor===ArrayBuffer)return t(this.binaryDecode(e));{let[n,r,i,a,o]=JSON.parse(e);return t({join_ref:n,ref:r,topic:i,event:a,payload:o})}},binaryEncode(e){let{join_ref:t,ref:n,event:r,topic:i,payload:a}=e,o=new TextEncoder,s=o.encode(t),c=o.encode(n),l=o.encode(i),u=o.encode(r);this.assertFieldSize(s.byteLength,`join_ref`),this.assertFieldSize(c.byteLength,`ref`),this.assertFieldSize(l.byteLength,`topic`),this.assertFieldSize(u.byteLength,`event`);let d=this.META_LENGTH+s.byteLength+c.byteLength+l.byteLength+u.byteLength,f=new ArrayBuffer(this.HEADER_LENGTH+d),p=new Uint8Array(f),m=new DataView(f),h=0;m.setUint8(h++,this.KINDS.push),m.setUint8(h++,s.byteLength),m.setUint8(h++,c.byteLength),m.setUint8(h++,l.byteLength),m.setUint8(h++,u.byteLength),p.set(s,h),h+=s.byteLength,p.set(c,h),h+=c.byteLength,p.set(l,h),h+=l.byteLength,p.set(u,h),h+=u.byteLength;var g=new Uint8Array(f.byteLength+a.byteLength);return g.set(p,0),g.set(new Uint8Array(a),f.byteLength),g.buffer},assertFieldSize(e,t){if(e>255)throw Error(`unable to convert ${t} to binary: must be less than or equal to 255 bytes, but is ${e} bytes`)},binaryDecode(e){let t=new DataView(e),n=t.getUint8(0),r=new TextDecoder;switch(n){case this.KINDS.push:return this.decodePush(e,t,r);case this.KINDS.reply:return this.decodeReply(e,t,r);case this.KINDS.broadcast:return this.decodeBroadcast(e,t,r)}},decodePush(e,t,n){let r=t.getUint8(1),i=t.getUint8(2),a=t.getUint8(3),o=this.HEADER_LENGTH+this.META_LENGTH-1,s=n.decode(e.slice(o,o+r));o+=r;let c=n.decode(e.slice(o,o+i));o+=i;let l=n.decode(e.slice(o,o+a));return o+=a,{join_ref:s,ref:null,topic:c,event:l,payload:e.slice(o,e.byteLength)}},decodeReply(e,t,n){let r=t.getUint8(1),i=t.getUint8(2),a=t.getUint8(3),o=t.getUint8(4),s=this.HEADER_LENGTH+this.META_LENGTH,c=n.decode(e.slice(s,s+r));s+=r;let l=n.decode(e.slice(s,s+i));s+=i;let u=n.decode(e.slice(s,s+a));s+=a;let d=n.decode(e.slice(s,s+o));s+=o;let f={status:d,response:e.slice(s,e.byteLength)};return{join_ref:c,ref:l,topic:u,event:w.reply,payload:f}},decodeBroadcast(e,t,n){let r=t.getUint8(1),i=t.getUint8(2),a=this.HEADER_LENGTH+2,o=n.decode(e.slice(a,a+r));a+=r;let s=n.decode(e.slice(a,a+i));return a+=i,{join_ref:null,ref:null,topic:o,event:s,payload:e.slice(a,e.byteLength)}}},We=class{constructor(e,t={}){this.stateChangeCallbacks={open:[],close:[],error:[],message:[]},this.channels=[],this.sendBuffer=[],this.ref=0,this.fallbackRef=null,this.timeout=t.timeout||Ae,this.transport=t.transport||x.WebSocket||Ve,this.conn=void 0,this.primaryPassedHealthCheck=!1,this.longPollFallbackMs=t.longPollFallbackMs,this.fallbackTimer=null;let n=null;try{n=x&&x.sessionStorage}catch{}this.sessionStore=t.sessionStorage||n,this.establishedConnections=0,this.defaultEncoder=Ue.encode.bind(Ue),this.defaultDecoder=Ue.decode.bind(Ue),this.closeWasClean=!0,this.disconnecting=!1,this.binaryType=t.binaryType||`arraybuffer`,this.connectClock=1,this.pageHidden=!1,this.encode=void 0,this.decode=void 0,this.transport===Ve?(this.encode=this.defaultEncoder,this.decode=this.defaultDecoder):(this.encode=t.encode||this.defaultEncoder,this.decode=t.decode||this.defaultDecoder);let r=null;Oe&&Oe.addEventListener&&(Oe.addEventListener(`pagehide`,e=>{this.conn&&(this.disconnect(),r=this.connectClock)}),Oe.addEventListener(`pageshow`,e=>{r===this.connectClock&&(r=null,this.connect())}),Oe.addEventListener(`visibilitychange`,()=>{document.visibilityState===`hidden`?this.pageHidden=!0:(this.pageHidden=!1,!this.isConnected()&&!this.closeWasClean&&this.teardown(()=>this.connect()))})),this.heartbeatIntervalMs=t.heartbeatIntervalMs||3e4,this.autoSendHeartbeat=t.autoSendHeartbeat??!0,this.heartbeatCallback=t.heartbeatCallback??(()=>{}),this.rejoinAfterMs=e=>t.rejoinAfterMs?t.rejoinAfterMs(e):[1e3,2e3,5e3][e-1]||1e4,this.reconnectAfterMs=e=>t.reconnectAfterMs?t.reconnectAfterMs(e):[10,50,100,150,200,250,500,1e3,2e3][e-1]||5e3,this.logger=t.logger||null,!this.logger&&t.debug&&(this.logger=(e,t,n)=>{console.log(`${e}: ${t}`,n)}),this.longpollerTimeout=t.longpollerTimeout||2e4,this.params=b(t.params||{}),this.endPoint=`${e}/${Ne.websocket}`,this.vsn=t.vsn||ke,this.heartbeatTimeoutTimer=null,this.heartbeatTimer=null,this.heartbeatSentAt=null,this.pendingHeartbeatRef=null,this.reconnectTimer=new Le(()=>{if(this.pageHidden){this.log(`Not reconnecting as page is hidden!`),this.teardown();return}this.teardown(async()=>{t.beforeReconnect&&await t.beforeReconnect(),this.connect()})},this.reconnectAfterMs),this.authToken=t.authToken&&b(t.authToken)}getLongPollTransport(){return Ve}replaceTransport(e){this.connectClock++,this.closeWasClean=!0,clearTimeout(this.fallbackTimer),this.reconnectTimer.reset(),this.conn&&=(this.conn.close(),null),this.transport=e}protocol(){return location.protocol.match(/^https/)?`wss`:`ws`}endPointURL(){let e=ze.appendParams(ze.appendParams(this.endPoint,this.params()),{vsn:this.vsn});return e.charAt(0)===`/`?e.charAt(1)===`/`?`${this.protocol()}:${e}`:`${this.protocol()}://${location.host}${e}`:e}disconnect(e,t,n){this.connectClock++,this.disconnecting=!0,this.closeWasClean=!0,clearTimeout(this.fallbackTimer),this.reconnectTimer.reset(),this.teardown(()=>{this.disconnecting=!1,e&&e()},t,n)}connect(e){e&&(console&&console.log(`passing params to connect is deprecated. Instead pass :params to the Socket constructor`),this.params=b(e)),!(this.conn&&!this.disconnecting)&&(this.longPollFallbackMs&&this.transport!==Ve?this.connectWithFallback(Ve,this.longPollFallbackMs):this.transportConnect())}log(e,t,n){this.logger&&this.logger(e,t,n)}hasLogger(){return this.logger!==null}onOpen(e){let t=this.makeRef();return this.stateChangeCallbacks.open.push([t,e]),t}onClose(e){let t=this.makeRef();return this.stateChangeCallbacks.close.push([t,e]),t}onError(e){let t=this.makeRef();return this.stateChangeCallbacks.error.push([t,e]),t}onMessage(e){let t=this.makeRef();return this.stateChangeCallbacks.message.push([t,e]),t}onHeartbeat(e){this.heartbeatCallback=e}ping(e){if(!this.isConnected())return!1;let t=this.makeRef(),n=Date.now();this.push({topic:`phoenix`,event:`heartbeat`,payload:{},ref:t});let r=this.onMessage(i=>{i.ref===t&&(this.off([r]),e(Date.now()-n))});return!0}transportName(e){switch(e){case Ve:return`LongPoll`;default:return e.name}}transportConnect(){this.connectClock++,this.closeWasClean=!1;let e;this.authToken&&(e=[`phoenix`,`${Fe}${btoa(this.authToken()).replace(/=/g,``)}`]),this.conn=new this.transport(this.endPointURL(),e),this.conn.binaryType=this.binaryType,this.conn.timeout=this.longpollerTimeout,this.conn.onopen=()=>this.onConnOpen(),this.conn.onerror=e=>this.onConnError(e),this.conn.onmessage=e=>this.onConnMessage(e),this.conn.onclose=e=>this.onConnClose(e)}getSession(e){return this.sessionStore&&this.sessionStore.getItem(e)}storeSession(e,t){this.sessionStore&&this.sessionStore.setItem(e,t)}connectWithFallback(e,t=2500){clearTimeout(this.fallbackTimer);let n=!1,r=!0,i,a=this.transportName(e),o=t=>{this.log(`transport`,`falling back to ${a}...`,t),this.off([void 0,i]),r=!1,this.replaceTransport(e),this.transportConnect()};if(this.getSession(`phx:fallback:${a}`))return o(`memorized`);this.fallbackTimer=setTimeout(o,t),i=this.onError(e=>{this.log(`transport`,`error`,e),r&&!n&&(clearTimeout(this.fallbackTimer),o(e))}),this.fallbackRef&&this.off([this.fallbackRef]),this.fallbackRef=this.onOpen(()=>{if(n=!0,!r){let t=this.transportName(e);return this.primaryPassedHealthCheck||this.storeSession(`phx:fallback:${t}`,`true`),this.log(`transport`,`established ${t} fallback`)}clearTimeout(this.fallbackTimer),this.fallbackTimer=setTimeout(o,t),this.ping(e=>{this.log(`transport`,`connected to primary after`,e),this.primaryPassedHealthCheck=!0,clearTimeout(this.fallbackTimer)})}),this.transportConnect()}clearHeartbeats(){clearTimeout(this.heartbeatTimer),clearTimeout(this.heartbeatTimeoutTimer)}onConnOpen(){this.hasLogger()&&this.log(`transport`,`connected to ${this.endPointURL()}`),this.closeWasClean=!1,this.disconnecting=!1,this.establishedConnections++,this.flushSendBuffer(),this.reconnectTimer.reset(),this.autoSendHeartbeat&&this.resetHeartbeat(),this.triggerStateCallbacks(`open`)}heartbeatTimeout(){if(this.pendingHeartbeatRef){this.pendingHeartbeatRef=null,this.heartbeatSentAt=null,this.hasLogger()&&this.log(`transport`,`heartbeat timeout. Attempting to re-establish connection`);try{this.heartbeatCallback(`timeout`)}catch(e){this.log(`error`,`error in heartbeat callback`,e)}this.triggerChanError(Error(`heartbeat timeout`)),this.closeWasClean=!1,this.teardown(()=>this.reconnectTimer.scheduleTimeout(),je,`heartbeat timeout`)}}resetHeartbeat(){this.conn&&this.conn.skipHeartbeat||(this.pendingHeartbeatRef=null,this.clearHeartbeats(),this.heartbeatTimer=setTimeout(()=>this.sendHeartbeat(),this.heartbeatIntervalMs))}teardown(e,t,n){if(!this.conn)return e&&e();let r=this.conn;this.waitForBufferDone(r,()=>{t?r.close(t,n||``):r.close(),this.waitForSocketClosed(r,()=>{this.conn===r&&(this.conn.onopen=function(){},this.conn.onerror=function(){},this.conn.onmessage=function(){},this.conn.onclose=function(){},this.conn=null),e&&e()})})}waitForBufferDone(e,t,n=1){if(n===5||!e.bufferedAmount){t();return}setTimeout(()=>{this.waitForBufferDone(e,t,n+1)},150*n)}waitForSocketClosed(e,t,n=1){if(n===5||e.readyState===S.closed){t();return}setTimeout(()=>{this.waitForSocketClosed(e,t,n+1)},150*n)}onConnClose(e){this.conn&&(this.conn.onclose=()=>{}),this.hasLogger()&&this.log(`transport`,`close`,e),this.triggerChanError(e),this.clearHeartbeats(),this.closeWasClean||this.reconnectTimer.scheduleTimeout(),this.triggerStateCallbacks(`close`,e)}onConnError(e){this.hasLogger()&&this.log(`transport`,`error`,e);let t=this.transport,n=this.establishedConnections;this.triggerStateCallbacks(`error`,e,t,n),(t===this.transport||n>0)&&this.triggerChanError(e)}triggerChanError(e){this.channels.forEach(t=>{t.isErrored()||t.isLeaving()||t.isClosed()||t.trigger(w.error,e)})}connectionState(){switch(this.conn&&this.conn.readyState){case S.connecting:return`connecting`;case S.open:return`open`;case S.closing:return`closing`;default:return`closed`}}isConnected(){return this.connectionState()===`open`}remove(e){this.off(e.stateChangeRefs),this.channels=this.channels.filter(t=>t!==e)}off(e){for(let t in this.stateChangeCallbacks)this.stateChangeCallbacks[t]=this.stateChangeCallbacks[t].filter(([t])=>e.indexOf(t)===-1)}channel(e,t={}){let n=new Re(e,t,this);return this.channels.push(n),n}push(e){if(this.hasLogger()){let{topic:t,event:n,payload:r,ref:i,join_ref:a}=e;this.log(`push`,`${t} ${n} (${a}, ${i})`,r)}this.isConnected()?this.encode(e,e=>this.conn.send(e)):this.sendBuffer.push(()=>this.encode(e,e=>this.conn.send(e)))}makeRef(){let e=this.ref+1;return e===this.ref?this.ref=0:this.ref=e,this.ref.toString()}sendHeartbeat(){if(!this.isConnected()){try{this.heartbeatCallback(`disconnected`)}catch(e){this.log(`error`,`error in heartbeat callback`,e)}return}if(this.pendingHeartbeatRef){this.heartbeatTimeout();return}this.pendingHeartbeatRef=this.makeRef(),this.heartbeatSentAt=Date.now(),this.push({topic:`phoenix`,event:`heartbeat`,payload:{},ref:this.pendingHeartbeatRef});try{this.heartbeatCallback(`sent`)}catch(e){this.log(`error`,`error in heartbeat callback`,e)}this.heartbeatTimeoutTimer=setTimeout(()=>this.heartbeatTimeout(),this.heartbeatIntervalMs)}flushSendBuffer(){this.isConnected()&&this.sendBuffer.length>0&&(this.sendBuffer.forEach(e=>e()),this.sendBuffer=[])}onConnMessage(e){this.decode(e.data,e=>{let{topic:t,event:n,payload:r,ref:i,join_ref:a}=e;if(i&&i===this.pendingHeartbeatRef){let e=this.heartbeatSentAt?Date.now()-this.heartbeatSentAt:void 0;this.clearHeartbeats();try{this.heartbeatCallback(r.status===`ok`?`ok`:`error`,e)}catch(e){this.log(`error`,`error in heartbeat callback`,e)}this.pendingHeartbeatRef=null,this.heartbeatSentAt=null,this.autoSendHeartbeat&&(this.heartbeatTimer=setTimeout(()=>this.sendHeartbeat(),this.heartbeatIntervalMs))}this.hasLogger()&&this.log(`receive`,`${r.status||``} ${t} ${n} ${i&&`(`+i+`)`||``}`.trim(),r);for(let e=0;e<this.channels.length;e++){let o=this.channels[e];o.isMember(t,n,r,a)&&o.trigger(n,r,i,a)}this.triggerStateCallbacks(`message`,e)})}triggerStateCallbacks(e,...t){try{this.stateChangeCallbacks[e].forEach(([n,r])=>{try{r(...t)}catch(t){this.log(`error`,`error in ${e} callback`,t)}})}catch(t){this.log(`error`,`error triggering ${e} callbacks`,t)}}leaveOpenTopic(e){let t=this.channels.find(t=>t.topic===e&&(t.isJoined()||t.isJoining()));t&&(this.hasLogger()&&this.log(`transport`,`leaving duplicate topic "${e}"`),t.leave())}},Ge=class e{constructor(t,n){let r=Je(n);this.presence=new He(t.getChannel(),r),this.presence.onJoin((n,r,i)=>{let a=e.onJoinPayload(n,r,i);t.getChannel().trigger(`presence`,a)}),this.presence.onLeave((n,r,i)=>{let a=e.onLeavePayload(n,r,i);t.getChannel().trigger(`presence`,a)}),this.presence.onSync(()=>{t.getChannel().trigger(`presence`,{event:`sync`})})}get state(){return e.transformState(this.presence.state)}static transformState(e){return e=qe(e),Object.getOwnPropertyNames(e).reduce((t,n)=>{let r=e[n];return t[n]=Ke(r),t},{})}static onJoinPayload(e,t,n){return{event:`join`,key:e,currentPresences:Ye(t),newPresences:Ke(n)}}static onLeavePayload(e,t,n){return{event:`leave`,key:e,currentPresences:Ye(t),leftPresences:Ke(n)}}};function Ke(e){return e.metas.map(e=>{let t=Object.getOwnPropertyDescriptors(e),n=Object.defineProperties({},t);return n.presence_ref=n.phx_ref,delete n.phx_ref,delete n.phx_ref_prev,n})}function qe(e){return JSON.parse(JSON.stringify(e))}function Je(e){return e?.events&&{events:e.events}}function Ye(e){return e?.metas?Ke(e):[]}var Xe;(function(e){e.SYNC=`sync`,e.JOIN=`join`,e.LEAVE=`leave`})(Xe||={});var Ze=class{get state(){return this.presenceAdapter.state}constructor(e,t){this.channel=e,this.presenceAdapter=new Ge(this.channel.channelAdapter,t)}};function Qe(e){if(e instanceof Error)return e;if(typeof e==`string`)return Error(e);if(e&&typeof e==`object`){let t=e;if(typeof t.code==`number`){let n=typeof t.reason==`string`&&t.reason?` (${t.reason})`:``;return Error(`socket closed: ${t.code}${n}`,{cause:e})}return Error(`channel error: transport failure`,{cause:e})}return Error(`channel error: connection lost`)}var $e=class{constructor(e,t,n){let r=et(n);this.channel=e.getSocket().channel(t,r),this.socket=e}get state(){return this.channel.state}set state(e){this.channel.state=e}get joinedOnce(){return this.channel.joinedOnce}get joinPush(){return this.channel.joinPush}get rejoinTimer(){return this.channel.rejoinTimer}on(e,t){return this.channel.on(e,t)}off(e,t){this.channel.off(e,t)}subscribe(e){return this.channel.join(e)}unsubscribe(e){return this.channel.leave(e)}teardown(){this.channel.teardown()}onClose(e){this.channel.onClose(e)}onError(e){return this.channel.onError(e)}push(e,t,n){let r;try{r=this.channel.push(e,t,n)}catch{throw Error(`tried to push '${e}' to '${this.channel.topic}' before joining. Use channel.subscribe() before pushing events`)}if(this.channel.pushBuffer.length>100){let e=this.channel.pushBuffer.shift();e.cancelTimeout(),this.socket.log(`channel`,`discarded push due to buffer overflow: ${e.event}`,e.payload())}return r}updateJoinPayload(e){let t=this.channel.joinPush.payload();this.channel.joinPush.payload=()=>Object.assign(Object.assign({},t),e)}canPush(){return this.socket.isConnected()&&this.state===v.joined}isJoined(){return this.state===v.joined}isJoining(){return this.state===v.joining}isClosed(){return this.state===v.closed}isLeaving(){return this.state===v.leaving}updateFilterBindings(e){this.channel.filterBindings=e}updatePayloadTransform(e){this.channel.onMessage=e}getChannel(){return this.channel}};function et(e){return{config:Object.assign({broadcast:{ack:!1,self:!1},presence:{key:``,enabled:!1},private:!1},e.config)}}let tt=/[,()"\\]/,nt=e=>tt.test(e)||e!==e.trim(),rt=e=>`"${e.replace(/\\/g,`\\\\`).replace(/"/g,`\\"`)}"`,it=e=>{let t=e===null?`null`:String(e);return nt(t)?rt(t):t},at=e=>e===null?`null`:String(e),ot=(e,t)=>{if(e===`in`){let e=Array.isArray(t)?t:[t];if(e.length===0)throw Error("Realtime `in` filter requires at least one value.");return`in.(${Array.from(new Set(e)).map(e=>it(e)).join(`,`)})`}return e===`is`?`is.${at(t)}`:`${e}.${it(t)}`};var st=class{constructor(){this.filters=[]}add(e,t,n,r=!1){let i=r?`not.`:``;return this.filters.push(`${e}=${i}${ot(t,n)}`),this}eq(e,t){return this.add(e,`eq`,t)}neq(e,t){return this.add(e,`neq`,t)}gt(e,t){return this.add(e,`gt`,t)}gte(e,t){return this.add(e,`gte`,t)}lt(e,t){return this.add(e,`lt`,t)}lte(e,t){return this.add(e,`lte`,t)}in(e,t){return this.add(e,`in`,t)}like(e,t){return this.add(e,`like`,t)}ilike(e,t){return this.add(e,`ilike`,t)}match(e,t){return this.add(e,`match`,t)}imatch(e,t){return this.add(e,`imatch`,t)}is(e,t){return this.add(e,`is`,t)}isDistinct(e,t){return this.add(e,`isdistinct`,t)}not(e,t,n){return this.add(e,t,n,!0)}build(){return this.filters.join(`,`)}toString(){return this.build()}};let ct=()=>new st;var lt;(function(e){e.ALL=`*`,e.INSERT=`INSERT`,e.UPDATE=`UPDATE`,e.DELETE=`DELETE`})(lt||={});var T;(function(e){e.BROADCAST=`broadcast`,e.PRESENCE=`presence`,e.POSTGRES_CHANGES=`postgres_changes`,e.SYSTEM=`system`})(T||={});var E;(function(e){e.SUBSCRIBED=`SUBSCRIBED`,e.TIMED_OUT=`TIMED_OUT`,e.CLOSED=`CLOSED`,e.CHANNEL_ERROR=`CHANNEL_ERROR`})(E||={});let ut=v;var dt=class e{get state(){return this.channelAdapter.state}set state(e){this.channelAdapter.state=e}get joinedOnce(){return this.channelAdapter.joinedOnce}get timeout(){return this.socket.timeout}get joinPush(){return this.channelAdapter.joinPush}get rejoinTimer(){return this.channelAdapter.rejoinTimer}constructor(e,t={config:{}},n){if(this.topic=e,this.params=t,this.socket=n,this.bindings={},this.subTopic=e.replace(/^realtime:/i,``),this.params.config=Object.assign({broadcast:{ack:!1,self:!1},presence:{key:``,enabled:!1},private:!1},t.config),this.channelAdapter=new $e(this.socket.socketAdapter,e,this.params),this.presence=new Ze(this),this._onClose(()=>{this.socket._remove(this)}),this._updateFilterTransform(),this.broadcastEndpointURL=Ee(this.socket.socketAdapter.endPointURL()),this.private=this.params.config.private||!1,!this.private&&this.params.config?.broadcast?.replay)throw Error(`tried to use replay on public channel '${this.topic}'. It must be a private channel.`)}subscribe(e,t=this.timeout){if(this.socket.isConnected()||this.socket.connect(),this.channelAdapter.isClosed()){let{config:{broadcast:n,presence:r,private:i,postgres_changes_options:a}}=this.params,o=this.bindings.postgres_changes?.map(e=>e.filter)??[],s=!!this.bindings[T.PRESENCE]&&this.bindings[T.PRESENCE].length>0||this.params.config.presence?.enabled===!0,c={},l=Object.assign({broadcast:n,presence:Object.assign(Object.assign({},r),{enabled:s}),postgres_changes:o,private:i},a?{postgres_changes_options:a}:{});this.socket.accessTokenValue&&(c.access_token=this.socket.accessTokenValue),this._onError(t=>{e?.(E.CHANNEL_ERROR,Qe(t))}),this._onClose(()=>e?.(E.CLOSED)),this.updateJoinPayload(Object.assign({config:l},c)),this._updateFilterMessage();let u=a?.wait&&o.length>0?Math.max(t,(a.timeout??15e3)+1e4):t;this.channelAdapter.subscribe(u).receive(`ok`,async({postgres_changes:t})=>{if(this.socket._isManualToken()||this.socket.setAuth(),t===void 0){e?.(E.SUBSCRIBED);return}this._updatePostgresBindings(t,e)}).receive(`error`,t=>{this.state=v.errored;let n=Object.values(t).join(`, `)||`error`;e?.(E.CHANNEL_ERROR,Error(n,{cause:t}))}).receive(`timeout`,()=>{e?.(E.TIMED_OUT)})}return this}_updatePostgresBindings(t,n){let r=this.bindings.postgres_changes,i=r?.length??0,a=[];for(let o=0;o<i;o++){let i=r[o],{filter:{event:s,schema:c,table:l,filter:u}}=i,d=t&&t[o];if(d&&d.event===s&&e.isFilterValueEqual(d.schema,c)&&e.isFilterValueEqual(d.table,l)&&e.isFilterValueEqual(d.filter,u))a.push(Object.assign(Object.assign({},i),{id:d.id}));else{this.unsubscribe(),this.state=v.errored,n?.(E.CHANNEL_ERROR,Error(`mismatch between server and client bindings for postgres changes`));return}}this.bindings.postgres_changes=a,this.state!=v.errored&&n&&n(E.SUBSCRIBED)}presenceState(){return this.presence.state}async track(e,t={}){return await this.send({type:`presence`,event:`track`,payload:e},t)}async untrack(e={}){return await this.send({type:`presence`,event:`untrack`},e)}on(e,t,n){let r=this.channelAdapter.isJoined()||this.channelAdapter.isJoining(),i=e===T.PRESENCE||e===T.POSTGRES_CHANGES;if(r&&i)throw this.socket.log(`channel`,`cannot add \`${e}\` callbacks for ${this.topic} after \`subscribe()\`.`),Error(`cannot add \`${e}\` callbacks for ${this.topic} after \`subscribe()\`.`);return this._on(e,t,n)}async httpSend(e,t,n={}){if(t==null)return Promise.reject(Error(`Payload is required for httpSend()`));let r=t instanceof ArrayBuffer||ArrayBuffer.isView(t),i={apikey:this.socket.apiKey?this.socket.apiKey:``,"Content-Type":r?`application/octet-stream`:`application/json`};this.socket.accessTokenValue&&(i.Authorization=`Bearer ${this.socket.accessTokenValue}`);let a=new URL(this.broadcastEndpointURL);a.pathname+=`/${encodeURIComponent(this.subTopic)}/events/${encodeURIComponent(e)}`,this.private&&a.searchParams.set(`private`,`true`);let o={method:`POST`,headers:i,body:r?t:JSON.stringify(t)},s=await this._fetchWithTimeout(a.toString(),o,n.timeout??this.timeout);if(s.status===202)return{success:!0};if(s.status===404)return Promise.reject(Error(`httpSend() requires Realtime server v2.97.0 or newer; the endpoint returned 404. Update your Supabase CLI to a recent version, or upgrade the Realtime server in your self-hosted setup. See https://github.com/supabase/supabase-js/blob/master/packages/core/realtime-js/migrations/httpsend-server-version.md`));let c=s.statusText;try{let e=await s.json();c=e.error||e.message||c}catch{}return Promise.reject(Error(c))}async send(e,t={}){if(!this.channelAdapter.canPush()&&e.type===`broadcast`){let n=`Realtime send() is automatically falling back to REST API. This behavior will be deprecated in the future. Please use httpSend() explicitly for REST delivery.`;this.socket.hasLogger()?this.socket.log(`channel`,n):console.warn(n);let{event:r,payload:i}=e,a={apikey:this.socket.apiKey?this.socket.apiKey:``,"Content-Type":`application/json`};this.socket.accessTokenValue&&(a.Authorization=`Bearer ${this.socket.accessTokenValue}`);let o={method:`POST`,headers:a,body:JSON.stringify({messages:[{topic:this.subTopic,event:r,payload:i,private:this.private}]})};try{let e=await this._fetchWithTimeout(this.broadcastEndpointURL,o,t.timeout??this.timeout);return await e.body?.cancel(),e.ok?`ok`:`error`}catch(e){return e instanceof Error&&e.name===`AbortError`?`timed out`:`error`}}else return new Promise(n=>{let r=this.channelAdapter.push(e.type,e,t.timeout||this.timeout);e.type===`broadcast`&&!this.params?.config?.broadcast?.ack&&n(`ok`),r.receive(`ok`,()=>n(`ok`)),r.receive(`error`,()=>n(`error`)),r.receive(`timeout`,()=>n(`timed out`))})}updateJoinPayload(e){this.channelAdapter.updateJoinPayload(e)}async unsubscribe(e=this.timeout){return new Promise(t=>{this.channelAdapter.unsubscribe(e).receive(`ok`,()=>t(`ok`)).receive(`timeout`,()=>t(`timed out`)).receive(`error`,()=>t(`error`))})}teardown(){this.channelAdapter.teardown()}async _fetchWithTimeout(e,t,n){let r=new AbortController,i=setTimeout(()=>r.abort(),n),a=await this.socket.fetch(e,Object.assign(Object.assign({},t),{signal:r.signal}));return clearTimeout(i),a}_on(t,n,r){let i=t.toLocaleLowerCase(),a=n?.filter;if((a instanceof st||typeof a==`object`&&a&&typeof a.build==`function`)&&(n=Object.assign(Object.assign({},n),{filter:a.build()})),i===T.POSTGRES_CHANGES&&this.bindings[i]?.find(t=>e.isSamePostgresFilter(t.filter,n)))return this.socket.log(`error`,`duplicate \`postgres_changes\` binding for ${this.topic} ignored`,n),this;let o=this.channelAdapter.on(t,r),s={type:i,filter:n,callback:r,ref:o};return this.bindings[i]?this.bindings[i].push(s):this.bindings[i]=[s],this._updateFilterMessage(),this}_onClose(e){this.channelAdapter.onClose(e)}_onError(e){this.channelAdapter.onError(e)}_updateFilterMessage(){this.channelAdapter.updateFilterBindings((e,t,n)=>{let r=e.event.toLocaleLowerCase();if(this._notThisChannelEvent(r,n))return!1;let i=this.bindings[r]?.find(t=>t.ref===e.ref);if(!i)return!0;if([`broadcast`,`presence`,`postgres_changes`].includes(r))if(`id`in i){let e=i.id,n=i.filter?.event;return e&&t.ids?.includes(e)&&(n===`*`||n?.toLocaleLowerCase()===t.data?.type.toLocaleLowerCase())}else{let e=(i?.filter?.event)?.toLocaleLowerCase();return e===`*`||e===(t?.event)?.toLocaleLowerCase()}else return i.type.toLocaleLowerCase()===r})}_notThisChannelEvent(e,t){let{close:n,error:r,leave:i,join:a}=me;return t&&[n,r,i,a].includes(e)&&t!==this.joinPush.ref}_updateFilterTransform(){this.channelAdapter.updatePayloadTransform((e,t,n)=>{if(typeof t==`object`&&`ids`in t){let e=t.data,{schema:n,table:r,commit_timestamp:i,type:a,errors:o}=e,s={schema:n,table:r,commit_timestamp:i,eventType:a,new:{},old:{},errors:o};return Object.assign(Object.assign({},s),this._getPayloadRecords(e))}return t})}copyBindings(e){if(this.joinedOnce)throw Error(`cannot copy bindings into joined channel`);for(let t in e.bindings)for(let n of e.bindings[t])this._on(n.type,n.filter,n.callback)}static isFilterValueEqual(e,t){return(e??void 0)===(t??void 0)}static isSamePostgresFilter(t,n){let r=(t?.select)?.join()??void 0,i=(n?.select)?.join()??void 0;return t?.event===n?.event&&e.isFilterValueEqual(t?.schema,n?.schema)&&e.isFilterValueEqual(t?.table,n?.table)&&e.isFilterValueEqual(t?.filter,n?.filter)&&r===i}_getPayloadRecords(e){let t={new:{},old:{}};return(e.type===`INSERT`||e.type===`UPDATE`)&&(t.new=_e(e.columns,e.record)),(e.type===`UPDATE`||e.type===`DELETE`)&&(t.old=_e(e.columns,e.old_record)),t}},ft=class{constructor(e,t){this.socket=new We(e,t)}get timeout(){return this.socket.timeout}get endPoint(){return this.socket.endPoint}get transport(){return this.socket.transport}get heartbeatIntervalMs(){return this.socket.heartbeatIntervalMs}get heartbeatCallback(){return this.socket.heartbeatCallback}set heartbeatCallback(e){this.socket.heartbeatCallback=e}get heartbeatTimer(){return this.socket.heartbeatTimer}get pendingHeartbeatRef(){return this.socket.pendingHeartbeatRef}get reconnectTimer(){return this.socket.reconnectTimer}get vsn(){return this.socket.vsn}get encode(){return this.socket.encode}get decode(){return this.socket.decode}get reconnectAfterMs(){return this.socket.reconnectAfterMs}get sendBuffer(){return this.socket.sendBuffer}get stateChangeCallbacks(){return this.socket.stateChangeCallbacks}connect(){this.socket.connect()}disconnect(e,t,n,r=1e4){return new Promise(i=>{setTimeout(()=>i(`timeout`),r),this.socket.disconnect(()=>{e(),i(`ok`)},t,n)})}push(e){this.socket.push(e)}log(e,t,n){this.socket.log(e,t,n)}hasLogger(){return this.socket.hasLogger()}makeRef(){return this.socket.makeRef()}onOpen(e){this.socket.onOpen(e)}onClose(e){this.socket.onClose(e)}onError(e){this.socket.onError(e)}onMessage(e){this.socket.onMessage(e)}isConnected(){return this.socket.isConnected()}isConnecting(){return this.socket.connectionState()==he.connecting}isDisconnecting(){return this.socket.connectionState()==he.closing}connectionState(){return this.socket.connectionState()}endPointURL(){return this.socket.endPointURL()}sendHeartbeat(){this.socket.sendHeartbeat()}getSocket(){return this.socket}};let pt={HEARTBEAT_INTERVAL:25e3,RECONNECT_DELAY:10,HEARTBEAT_TIMEOUT_FALLBACK:100},mt=[1e3,2e3,5e3,1e4];function ht(){let e=new Map;return{get length(){return e.size},clear(){e.clear()},getItem(t){return e.has(t)?e.get(t):null},key(t){return Array.from(e.keys())[t]??null},removeItem(t){e.delete(t)},setItem(t,n){e.set(t,String(n))}}}function gt(){try{if(typeof globalThis<`u`&&globalThis.sessionStorage)return globalThis.sessionStorage}catch{}return ht()}var _t=class{get endPoint(){return this.socketAdapter.endPoint}get timeout(){return this.socketAdapter.timeout}get transport(){return this.socketAdapter.transport}get heartbeatCallback(){return this.socketAdapter.heartbeatCallback}get heartbeatIntervalMs(){return this.socketAdapter.heartbeatIntervalMs}get heartbeatTimer(){return this.worker?this._workerHeartbeatTimer:this.socketAdapter.heartbeatTimer}get pendingHeartbeatRef(){return this.worker?this._pendingWorkerHeartbeatRef:this.socketAdapter.pendingHeartbeatRef}get reconnectTimer(){return this.socketAdapter.reconnectTimer}get vsn(){return this.socketAdapter.vsn}get encode(){return this.socketAdapter.encode}get decode(){return this.socketAdapter.decode}get reconnectAfterMs(){return this.socketAdapter.reconnectAfterMs}get sendBuffer(){return this.socketAdapter.sendBuffer}get stateChangeCallbacks(){return this.socketAdapter.stateChangeCallbacks}constructor(e,t){if(this.channels=[],this.accessTokenValue=null,this.accessToken=null,this.apiKey=null,this.httpEndpoint=``,this.headers={},this.params={},this.ref=0,this.serializer=new ge,this._manuallySetToken=!1,this._authPromise=null,this._authGeneration=0,this._workerHeartbeatTimer=void 0,this._pendingWorkerHeartbeatRef=null,this._pendingDisconnectTimer=null,this._disconnectOnEmptyChannelsAfterMs=0,this._resolveFetch=e=>e?(...t)=>e(...t):(...e)=>fetch(...e),!t?.params?.apikey)throw Error(`API key is required to connect to Realtime`);this.apiKey=t.params.apikey,this.socketAdapter=new ft(e,this._initializeOptions(t)),this.httpEndpoint=Ee(e),this.fetch=this._resolveFetch(t?.fetch)}connect(){if(!(this.isConnecting()||this.isDisconnecting()||this.isConnected())){this.accessToken&&!this._authPromise&&this._setAuthSafely(`connect`),this._setupConnectionHandlers();try{this.socketAdapter.connect()}catch(e){let t=e.message;throw Error(`WebSocket not available: ${t}`)}this._handleNodeJsRaceCondition()}}endpointURL(){return this.socketAdapter.endPointURL()}async disconnect(e,t){return this._cancelPendingDisconnect(),this.isDisconnecting()?`ok`:await this.socketAdapter.disconnect(()=>{clearInterval(this._workerHeartbeatTimer),this._terminateWorker()},e,t)}getChannels(){return this.channels}async removeChannel(e){let t=await e.unsubscribe();return t===`ok`&&e.teardown(),t}async removeAllChannels(){let e=this.channels.map(async e=>{let t=await e.unsubscribe();return e.teardown(),t}),t=await Promise.all(e);return await this.disconnect(),t}log(e,t,n){this.socketAdapter.log(e,t,n)}hasLogger(){return this.socketAdapter.hasLogger()}connectionState(){return this.socketAdapter.connectionState()||he.closed}isConnected(){return this.socketAdapter.isConnected()}isConnecting(){return this.socketAdapter.isConnecting()}isDisconnecting(){return this.socketAdapter.isDisconnecting()}channel(e,t={config:{}}){let n=`realtime:${e}`,r=this.getChannels().find(e=>e.topic===n);if(r)return r;{let n=new dt(`realtime:${e}`,t,this);return this._cancelPendingDisconnect(),this.channels.push(n),n}}push(e){this.socketAdapter.push(e)}async setAuth(e=null){let t=++this._authGeneration,n=this._performAuth(e,t);t===this._authGeneration&&(this._authPromise=n);try{await n}finally{this._authPromise===n&&(this._authPromise=null)}}_isManualToken(){return this._manuallySetToken}async sendHeartbeat(){this.socketAdapter.sendHeartbeat()}onHeartbeat(e){this.socketAdapter.heartbeatCallback=this._wrapHeartbeatCallback(e)}_makeRef(){return this.socketAdapter.makeRef()}_remove(e){this.channels=this.channels.filter(t=>t.topic!==e.topic),this.channels.length===0&&(this.log(`transport`,`no channels remaining, scheduling disconnect`),this._schedulePendingDisconnect())}_schedulePendingDisconnect(){if(this._cancelPendingDisconnect(),this._disconnectOnEmptyChannelsAfterMs===0){this.log(`transport`,`disconnecting immediately - no channels`),this.disconnect();return}this._pendingDisconnectTimer=setTimeout(()=>{this._pendingDisconnectTimer=null,this.channels.length===0&&(this.log(`transport`,`deferred disconnect fired - no channels, disconnecting`),this.disconnect())},this._disconnectOnEmptyChannelsAfterMs),this.log(`transport`,`deferred disconnect scheduled in ${this._disconnectOnEmptyChannelsAfterMs}ms`)}_cancelPendingDisconnect(){this._pendingDisconnectTimer!==null&&(this.log(`transport`,`pending disconnect cancelled - channel activity detected`),clearTimeout(this._pendingDisconnectTimer),this._pendingDisconnectTimer=null)}async _performAuth(e,t){let n,r=!1;if(e)n=e,r=!0;else if(this.accessToken)try{n=await this.accessToken()}catch(e){this.log(`error`,`Error fetching access token from callback`,e),n=this.accessTokenValue}else n=this.accessTokenValue;t===this._authGeneration&&(this.accessToken?this._manuallySetToken=!1:r&&(this._manuallySetToken=!0),this.accessTokenValue!=n&&(this.accessTokenValue=n,this.channels.forEach(e=>{let t={access_token:n,version:`realtime-js/2.117.2`};e.updateJoinPayload(t),e.joinedOnce&&e.channelAdapter.isJoined()&&e.channelAdapter.push(me.access_token,{access_token:n})})))}async _waitForAuthIfNeeded(){this._authPromise&&await this._authPromise}_setAuthSafely(e=`general`){this._isManualToken()||this.setAuth().catch(t=>{this.log(`error`,`Error setting auth in ${e}`,t)})}_setupConnectionHandlers(){this.socketAdapter.onOpen(()=>{(this._authPromise||(this.accessToken&&!this.accessTokenValue?this.setAuth():Promise.resolve())).catch(e=>{this.log(`error`,`error waiting for auth on connect`,e)}),this.worker&&!this.workerRef&&this._startWorkerHeartbeat()}),this.socketAdapter.onClose(()=>{this.worker&&this.workerRef&&this._terminateWorker()}),this.socketAdapter.onMessage(e=>{e.ref&&e.ref===this._pendingWorkerHeartbeatRef&&(this._pendingWorkerHeartbeatRef=null)})}_handleNodeJsRaceCondition(){this.socketAdapter.isConnected()&&this.socketAdapter.getSocket().onConnOpen()}_wrapHeartbeatCallback(e){return(t,n)=>{t!==`disconnected`&&(t==`sent`&&this._setAuthSafely(),e&&e(t,n))}}_startWorkerHeartbeat(){this.workerUrl?this.log(`worker`,`starting worker for from ${this.workerUrl}`):this.log(`worker`,`starting default worker`);let e=this._workerObjectUrl(this.workerUrl);this.workerRef=new Worker(e),this.workerRef.onerror=e=>{this.log(`worker`,`worker error`,e.message),this._terminateWorker(),this.disconnect()},this.workerRef.onmessage=e=>{e.data.event===`keepAlive`&&this.sendHeartbeat()},this.workerRef.postMessage({event:`start`,interval:this.heartbeatIntervalMs})}_terminateWorker(){this.workerRef&&=(this.log(`worker`,`terminating worker`),this.workerRef.terminate(),void 0)}_workerObjectUrl(e){let t;if(e)t=e;else{let e=new Blob([`
  addEventListener("message", (e) => {
    if (e.data.event === "start") {
      setInterval(() => postMessage({ event: "keepAlive" }), e.data.interval);
    }
  });`],{type:`application/javascript`});t=URL.createObjectURL(e)}return t}_initializeOptions(e){this.worker=e?.worker??!1,this.accessToken=e?.accessToken??null;let t={};t.timeout=e?.timeout??1e4,t.heartbeatIntervalMs=e?.heartbeatIntervalMs??pt.HEARTBEAT_INTERVAL,this._disconnectOnEmptyChannelsAfterMs=e?.disconnectOnEmptyChannelsAfterMs??2*(e?.heartbeatIntervalMs??pt.HEARTBEAT_INTERVAL),t.transport=e?.transport??pe.getWebSocketConstructor(),t.params=e?.params,t.logger=e?.logger,t.heartbeatCallback=this._wrapHeartbeatCallback(e?.heartbeatCallback),t.sessionStorage=e?.sessionStorage??gt(),t.reconnectAfterMs=e?.reconnectAfterMs??(e=>mt[e-1]||1e4);let n,r,i=e?.vsn??`2.0.0`;switch(i){case`1.0.0`:n=(e,t)=>t(JSON.stringify(e)),r=(e,t)=>t(JSON.parse(e));break;case`2.0.0`:n=this.serializer.encode.bind(this.serializer),r=this.serializer.decode.bind(this.serializer);break;default:throw Error(`Unsupported serializer version: ${t.vsn}`)}if(t.vsn=i,t.encode=e?.encode??n,t.decode=e?.decode??r,t.beforeReconnect=this._reconnectAuth.bind(this),(e?.logLevel||e?.log_level)&&(this.logLevel=e.logLevel||e.log_level,t.params=Object.assign(Object.assign({},t.params),{log_level:this.logLevel})),this.worker){if(typeof window<`u`&&!window.Worker)throw Error(`Web Worker is not supported`);this.workerUrl=e?.workerUrl,t.autoSendHeartbeat=!this.worker}return t}async _reconnectAuth(){await this._waitForAuthIfNeeded(),this.isConnected()||this.connect()}},vt=class extends Error{constructor(e,t){super(e),this.name=`IcebergError`,this.status=t.status,this.icebergType=t.icebergType,this.icebergCode=t.icebergCode,this.details=t.details,this.isCommitStateUnknown=t.icebergType===`CommitStateUnknownException`||[500,502,504].includes(t.status)&&t.icebergType?.includes(`CommitState`)===!0}isNotFound(){return this.status===404}isConflict(){return this.status===409}isAuthenticationTimeout(){return this.status===419}};function yt(e,t,n){let r=new URL(t,e);if(n)for(let[e,t]of Object.entries(n))t!==void 0&&r.searchParams.set(e,t);return r.toString()}async function bt(e){return!e||e.type===`none`?{}:e.type===`bearer`?{Authorization:`Bearer ${e.token}`}:e.type===`header`?{[e.name]:e.value}:e.type===`custom`?await e.getHeaders():{}}function xt(e){let t=e.fetchImpl??globalThis.fetch;return{async request({method:n,path:r,query:i,body:a,headers:o}){let s=yt(e.baseUrl,r,i),c=await bt(e.auth),l=await t(s,{method:n,headers:{...a?{"Content-Type":`application/json`}:{},...c,...o},body:a?JSON.stringify(a):void 0}),u=await l.text(),d=(l.headers.get(`content-type`)||``).includes(`application/json`),f=d&&u?JSON.parse(u):u;if(!l.ok){let e=d?f:void 0,t=e?.error;throw new vt(t?.message??`Request failed with status ${l.status}`,{status:l.status,icebergType:t?.type,icebergCode:t?.code,details:e})}return{status:l.status,headers:l.headers,data:f}}}}function St(e){return e.join(``)}var Ct=class{constructor(e,t=``){this.client=e,this.prefix=t}async listNamespaces(e){let t=e?{parent:St(e.namespace)}:void 0;return(await this.client.request({method:`GET`,path:`${this.prefix}/namespaces`,query:t})).data.namespaces.map(e=>({namespace:e}))}async createNamespace(e,t){let n={namespace:e.namespace,properties:t?.properties};return(await this.client.request({method:`POST`,path:`${this.prefix}/namespaces`,body:n})).data}async dropNamespace(e){await this.client.request({method:`DELETE`,path:`${this.prefix}/namespaces/${St(e.namespace)}`})}async loadNamespaceMetadata(e){return{properties:(await this.client.request({method:`GET`,path:`${this.prefix}/namespaces/${St(e.namespace)}`})).data.properties}}async namespaceExists(e){try{return await this.client.request({method:`HEAD`,path:`${this.prefix}/namespaces/${St(e.namespace)}`}),!0}catch(e){if(e instanceof vt&&e.status===404)return!1;throw e}}async createNamespaceIfNotExists(e,t){try{return await this.createNamespace(e,t)}catch(e){if(e instanceof vt&&e.status===409)return;throw e}}};function wt(e){return e.join(``)}var Tt=class{constructor(e,t=``,n){this.client=e,this.prefix=t,this.accessDelegation=n}async listTables(e){return(await this.client.request({method:`GET`,path:`${this.prefix}/namespaces/${wt(e.namespace)}/tables`})).data.identifiers}async createTable(e,t){let n={};return this.accessDelegation&&(n[`X-Iceberg-Access-Delegation`]=this.accessDelegation),(await this.client.request({method:`POST`,path:`${this.prefix}/namespaces/${wt(e.namespace)}/tables`,body:t,headers:n})).data.metadata}async updateTable(e,t){let n=await this.client.request({method:`POST`,path:`${this.prefix}/namespaces/${wt(e.namespace)}/tables/${e.name}`,body:t});return{"metadata-location":n.data[`metadata-location`],metadata:n.data.metadata}}async dropTable(e,t){await this.client.request({method:`DELETE`,path:`${this.prefix}/namespaces/${wt(e.namespace)}/tables/${e.name}`,query:{purgeRequested:String(t?.purge??!1)}})}async loadTable(e){let t={};return this.accessDelegation&&(t[`X-Iceberg-Access-Delegation`]=this.accessDelegation),(await this.client.request({method:`GET`,path:`${this.prefix}/namespaces/${wt(e.namespace)}/tables/${e.name}`,headers:t})).data.metadata}async tableExists(e){let t={};this.accessDelegation&&(t[`X-Iceberg-Access-Delegation`]=this.accessDelegation);try{return await this.client.request({method:`HEAD`,path:`${this.prefix}/namespaces/${wt(e.namespace)}/tables/${e.name}`,headers:t}),!0}catch(e){if(e instanceof vt&&e.status===404)return!1;throw e}}async createTableIfNotExists(e,t){try{return await this.createTable(e,t)}catch(n){if(n instanceof vt&&n.status===409)return await this.loadTable({namespace:e.namespace,name:t.name});throw n}}},Et=class{constructor(e){let t=`v1`;e.catalogName&&(t+=`/${e.catalogName}`),this.client=xt({baseUrl:e.baseUrl.endsWith(`/`)?e.baseUrl:`${e.baseUrl}/`,auth:e.auth,fetchImpl:e.fetch}),this.accessDelegation=e.accessDelegation?.join(`,`),this.namespaceOps=new Ct(this.client,t),this.tableOps=new Tt(this.client,t,this.accessDelegation)}async listNamespaces(e){return this.namespaceOps.listNamespaces(e)}async createNamespace(e,t){return this.namespaceOps.createNamespace(e,t)}async dropNamespace(e){await this.namespaceOps.dropNamespace(e)}async loadNamespaceMetadata(e){return this.namespaceOps.loadNamespaceMetadata(e)}async listTables(e){return this.tableOps.listTables(e)}async createTable(e,t){return this.tableOps.createTable(e,t)}async updateTable(e,t){return this.tableOps.updateTable(e,t)}async dropTable(e,t){await this.tableOps.dropTable(e,t)}async loadTable(e){return this.tableOps.loadTable(e)}async namespaceExists(e){return this.namespaceOps.namespaceExists(e)}async tableExists(e){return this.tableOps.tableExists(e)}async createNamespaceIfNotExists(e,t){return this.namespaceOps.createNamespaceIfNotExists(e,t)}async createTableIfNotExists(e,t){return this.tableOps.createTableIfNotExists(e,t)}};function Dt(e){"@babel/helpers - typeof";return Dt=typeof Symbol==`function`&&typeof Symbol.iterator==`symbol`?function(e){return typeof e}:function(e){return e&&typeof Symbol==`function`&&e.constructor===Symbol&&e!==Symbol.prototype?`symbol`:typeof e},Dt(e)}function Ot(e,t){if(Dt(e)!=`object`||!e)return e;var n=e[Symbol.toPrimitive];if(n!==void 0){var r=n.call(e,t||`default`);if(Dt(r)!=`object`)return r;throw TypeError(`@@toPrimitive must return a primitive value.`)}return(t===`string`?String:Number)(e)}function kt(e){var t=Ot(e,`string`);return Dt(t)==`symbol`?t:t+``}function At(e,t,n){return(t=kt(t))in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function jt(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable})),n.push.apply(n,r)}return n}function D(e){for(var t=1;t<arguments.length;t++){var n=arguments[t]==null?{}:arguments[t];t%2?jt(Object(n),!0).forEach(function(t){At(e,t,n[t])}):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):jt(Object(n)).forEach(function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))})}return e}var Mt=class extends Error{constructor(e,t=`storage`,n,r){super(e),this.__isStorageError=!0,this.namespace=t,this.name=t===`vectors`?`StorageVectorsError`:`StorageError`,this.status=n,this.statusCode=r}toJSON(){return{name:this.name,message:this.message,status:this.status,statusCode:this.statusCode}}};function Nt(e){return typeof e==`object`&&!!e&&`__isStorageError`in e}var Pt=class extends Mt{constructor(e,t,n,r=`storage`,i){super(e,r,t,n),this.name=r===`vectors`?`StorageVectorsApiError`:`StorageApiError`,this.status=t,this.statusCode=n,this.code=i}toJSON(){return D(D({},super.toJSON()),{},{code:this.code})}},Ft=class extends Mt{constructor(e,t,n=`storage`){super(e,n),this.name=n===`vectors`?`StorageVectorsUnknownError`:`StorageUnknownError`,this.originalError=t}};function It(e,t,n){let r=D({},e),i=t.toLowerCase();for(let e of Object.keys(r))e.toLowerCase()===i&&delete r[e];return r[i]=n,r}function Lt(e){let t={};for(let[n,r]of Object.entries(e))t[n.toLowerCase()]=r;return t}let Rt=e=>e?(...t)=>e(...t):(...e)=>fetch(...e),zt=e=>{if(typeof e!=`object`||!e)return!1;let t=Object.getPrototypeOf(e);return(t===null||t===Object.prototype||Object.getPrototypeOf(t)===null)&&!(Symbol.toStringTag in e)&&!(Symbol.iterator in e)},Bt=e=>{if(Array.isArray(e))return e.map(e=>Bt(e));if(typeof e==`function`||e!==Object(e))return e;let t={};return Object.entries(e).forEach(([e,n])=>{let r=e.replace(/([-_][a-z])/gi,e=>e.toUpperCase().replace(/[-_]/g,``));t[r]=Bt(n)}),t},Vt=e=>!e||typeof e!=`string`||e.length===0||e.length>100||e.trim()!==e||e.includes(`/`)||e.includes(`\\`)?!1:/^[\w!.\*'() &$@=;:+,?-]+$/.test(e),Ht=e=>e.split(`/`).map(encodeURIComponent).join(`/`),Ut=e=>{if(typeof e==`object`&&e){let t=e;if(typeof t.msg==`string`)return t.msg;if(typeof t.message==`string`)return t.message;if(typeof t.error_description==`string`)return t.error_description;if(typeof t.error==`string`)return t.error;if(typeof t.error==`object`&&t.error!==null){let e=t.error;if(typeof e.message==`string`)return e.message}}return JSON.stringify(e)},Wt=async(e,t,n,r)=>{if(typeof e==`object`&&e&&`json`in e&&typeof e.json==`function`){let n=e,i=parseInt(String(n.status),10);Number.isFinite(i)||(i=500),n.json().then(e=>{let n=e?.statusCode||e?.code||i+``;t(new Pt(Ut(e),i,n,r,e?.code))}).catch(()=>{let e=i+``;t(new Pt(n.statusText||`HTTP ${i} error`,i,e,r))})}else t(new Ft(Ut(e),e,r))},Gt=(e,t,n,r)=>{let i={method:e,headers:t?.headers||{}};if(e===`GET`||e===`HEAD`||!r)return D(D({},i),n);if(zt(r)){let e=t?.headers||{},n;for(let[t,r]of Object.entries(e))t.toLowerCase()===`content-type`&&(n=r);i.headers=It(e,`Content-Type`,n??`application/json`),i.body=JSON.stringify(r)}else i.body=r;return t?.duplex&&(i.duplex=t.duplex),D(D({},i),n)};async function Kt(e,t,n,r,i,a,o){return new Promise((s,c)=>{e(n,Gt(t,r,i,a)).then(e=>{if(!e.ok)throw e;if(r?.noResolveJson)return e;if(o===`vectors`){let t=e.headers.get(`content-type`);if(e.headers.get(`content-length`)===`0`||e.status===204||!t||!t.includes(`application/json`))return{}}return e.json()}).then(e=>s(e)).catch(e=>Wt(e,c,r,o))})}function qt(e=`storage`){return{get:async(t,n,r,i)=>Kt(t,`GET`,n,r,i,void 0,e),post:async(t,n,r,i,a)=>Kt(t,`POST`,n,i,a,r,e),put:async(t,n,r,i,a)=>Kt(t,`PUT`,n,i,a,r,e),head:async(t,n,r,i)=>Kt(t,`HEAD`,n,D(D({},r),{},{noResolveJson:!0}),i,void 0,e),remove:async(t,n,r,i,a)=>Kt(t,`DELETE`,n,i,a,r,e)}}let{get:O,post:k,put:Jt,head:Yt,remove:A}=qt(`storage`),j=qt(`vectors`);var Xt=class{constructor(e,t={},n,r=`storage`){this.shouldThrowOnError=!1,this.url=e,this.headers=Lt(t),this.fetch=Rt(n),this.namespace=r}throwOnError(){return this.shouldThrowOnError=!0,this}setHeader(e,t){return this.headers=It(this.headers,e,t),this}async handleOperation(e){var t=this;try{return{data:await e(),error:null}}catch(e){if(t.shouldThrowOnError)throw e;if(Nt(e))return{data:null,error:e};throw e}}};let Zt;Zt=Symbol.toStringTag;var Qt=class{constructor(e,t){this.downloadFn=e,this.shouldThrowOnError=t,this[Zt]=`StreamDownloadBuilder`,this.promise=null}then(e,t){return this.getPromise().then(e,t)}catch(e){return this.getPromise().catch(e)}finally(e){return this.getPromise().finally(e)}getPromise(){return this.promise||=this.execute(),this.promise}async execute(){var e=this;try{return{data:(await e.downloadFn()).body,error:null}}catch(t){if(e.shouldThrowOnError)throw t;if(Nt(t))return{data:null,error:t};throw t}}};let $t;$t=Symbol.toStringTag;var en=class{constructor(e,t){this.downloadFn=e,this.shouldThrowOnError=t,this[$t]=`BlobDownloadBuilder`,this.promise=null}asStream(){return new Qt(this.downloadFn,this.shouldThrowOnError)}then(e,t){return this.getPromise().then(e,t)}catch(e){return this.getPromise().catch(e)}finally(e){return this.getPromise().finally(e)}getPromise(){return this.promise||=this.execute(),this.promise}async execute(){var e=this;try{return{data:await(await e.downloadFn()).blob(),error:null}}catch(t){if(e.shouldThrowOnError)throw t;if(Nt(t))return{data:null,error:t};throw t}}};let tn={limit:100,offset:0,sortBy:{column:`name`,order:`asc`}},nn={cacheControl:`3600`,contentType:`text/plain;charset=UTF-8`,upsert:!1};var rn=class extends Xt{constructor(e,t={},n,r){super(e,t,r,`storage`),this.bucketId=n}async uploadOrUpdate(e,t,n,r){var i=this;return i.handleOperation(async()=>{let a,o=D(D({},nn),r),s=D(D({},i.headers),e===`POST`&&{"x-upsert":String(o.upsert)}),c=o.metadata;if(typeof Blob<`u`&&n instanceof Blob?(a=new FormData,a.append(`cacheControl`,o.cacheControl),c&&a.append(`metadata`,i.encodeMetadata(c)),a.append(``,n)):typeof FormData<`u`&&n instanceof FormData?(a=n,a.has(`cacheControl`)||a.append(`cacheControl`,o.cacheControl),c&&!a.has(`metadata`)&&a.append(`metadata`,i.encodeMetadata(c))):(a=n,s[`cache-control`]=`max-age=${o.cacheControl}`,s[`content-type`]=o.contentType,c&&(s[`x-metadata`]=i.toBase64(i.encodeMetadata(c))),(typeof ReadableStream<`u`&&a instanceof ReadableStream||a&&typeof a==`object`&&`pipe`in a&&typeof a.pipe==`function`)&&!o.duplex&&(o.duplex=`half`)),r?.headers)for(let[e,t]of Object.entries(r.headers))s=It(s,e,t);let l=i._removeEmptyFolders(t),u=i._getFinalPath(l),d=await(e==`PUT`?Jt:k)(i.fetch,`${i.url}/object/${u}`,a,D({headers:s},o?.duplex?{duplex:o.duplex}:{}));return{path:l,id:d.Id,fullPath:d.Key}})}async upload(e,t,n){return this.uploadOrUpdate(`POST`,e,t,n)}async uploadToSignedUrl(e,t,n,r){var i=this;let a=i._removeEmptyFolders(e),o=i._getFinalPath(a),s=new URL(i.url+`/object/upload/sign/${o}`);return s.searchParams.set(`token`,t),i.handleOperation(async()=>{let e,t=D(D({},nn),r),o=D(D({},i.headers),{"x-upsert":String(t.upsert)}),c=t.metadata;if(typeof Blob<`u`&&n instanceof Blob?(e=new FormData,e.append(`cacheControl`,t.cacheControl),c&&e.append(`metadata`,i.encodeMetadata(c)),e.append(``,n)):typeof FormData<`u`&&n instanceof FormData?(e=n,e.has(`cacheControl`)||e.append(`cacheControl`,t.cacheControl),c&&!e.has(`metadata`)&&e.append(`metadata`,i.encodeMetadata(c))):(e=n,o[`cache-control`]=`max-age=${t.cacheControl}`,o[`content-type`]=t.contentType,c&&(o[`x-metadata`]=i.toBase64(i.encodeMetadata(c))),(typeof ReadableStream<`u`&&e instanceof ReadableStream||e&&typeof e==`object`&&`pipe`in e&&typeof e.pipe==`function`)&&!t.duplex&&(t.duplex=`half`)),r?.headers)for(let[e,t]of Object.entries(r.headers))o=It(o,e,t);return{path:a,fullPath:(await Jt(i.fetch,s.toString(),e,D({headers:o},t?.duplex?{duplex:t.duplex}:{}))).Key}})}async createSignedUploadUrl(e,t){var n=this;return n.handleOperation(async()=>{let r=n._getFinalPath(e),i=D({},n.headers);t?.upsert&&(i[`x-upsert`]=`true`);let a=await k(n.fetch,`${n.url}/object/upload/sign/${r}`,{},{headers:i}),o=new URL(n.url+a.url),s=o.searchParams.get(`token`);if(!s)throw new Mt(`No token returned by API`);return{signedUrl:o.toString(),path:e,token:s}})}async update(e,t,n){return this.uploadOrUpdate(`PUT`,e,t,n)}async move(e,t,n){var r=this;return r.handleOperation(async()=>await k(r.fetch,`${r.url}/object/move`,{bucketId:r.bucketId,sourceKey:e,destinationKey:t,destinationBucket:n?.destinationBucket,sourceVersionId:n?.sourceVersionId},{headers:r.headers}))}async copy(e,t,n){var r=this;return r.handleOperation(async()=>({path:(await k(r.fetch,`${r.url}/object/copy`,{bucketId:r.bucketId,sourceKey:e,destinationKey:t,destinationBucket:n?.destinationBucket,sourceVersionId:n?.sourceVersionId},{headers:r.headers})).Key}))}async createSignedUrl(e,t,n){var r=this;return r.handleOperation(async()=>{let i=r._getFinalPath(e),a=typeof n?.transform==`object`&&n.transform!==null&&Object.keys(n.transform).length>0,o=await k(r.fetch,`${r.url}/object/sign/${i}`,D(D({expiresIn:t},a?{transform:n.transform}:{}),n?.versionId==null?{}:{versionId:n.versionId}),{headers:r.headers}),s=new URLSearchParams;n?.download&&s.set(`download`,n.download===!0?``:n.download),n?.cacheNonce!=null&&s.set(`cacheNonce`,String(n.cacheNonce));let c=s.toString();return{signedUrl:encodeURI(`${r.url}${o.signedURL}${c?`&${c}`:``}`)}})}async createSignedUrls(e,t,n){var r=this;return r.handleOperation(async()=>{let i=await k(r.fetch,`${r.url}/object/sign/${r.bucketId}`,{expiresIn:t,paths:e},{headers:r.headers}),a=new URLSearchParams;n?.download&&a.set(`download`,n.download===!0?``:n.download),n?.cacheNonce!=null&&a.set(`cacheNonce`,String(n.cacheNonce));let o=a.toString();return i.map(e=>D(D({},e),{},{signedUrl:e.signedURL?encodeURI(`${r.url}${e.signedURL}${o?`&${o}`:``}`):null}))})}download(e,t,n){let r=typeof t?.transform==`object`&&t.transform!==null&&Object.keys(t.transform).length>0?`render/image/authenticated`:`object`,i=new URLSearchParams;t?.transform&&this.applyTransformOptsToQuery(i,t.transform),t?.cacheNonce!=null&&i.set(`cacheNonce`,String(t.cacheNonce)),t?.versionId!=null&&i.set(`versionId`,String(t.versionId));let a=i.toString(),o=this._getFinalPath(e);return new en(()=>O(this.fetch,`${this.url}/${r}/${o}${a?`?${a}`:``}`,{headers:this.headers,noResolveJson:!0},n),this.shouldThrowOnError)}async info(e,t){var n=this;let r=n._getFinalPath(e),i=new URLSearchParams;t?.versionId!=null&&i.set(`versionId`,String(t.versionId));let a=i.toString();return n.handleOperation(async()=>Bt(await O(n.fetch,`${n.url}/object/info/${r}${a?`?${a}`:``}`,{headers:n.headers})))}async exists(e){var t=this;let n=t._getFinalPath(e);try{return await Yt(t.fetch,`${t.url}/object/${n}`,{headers:t.headers}),{data:!0,error:null}}catch(e){if(t.shouldThrowOnError)throw e;if(Nt(e)){let t=e instanceof Pt?e.status:e instanceof Ft?e.originalError?.status:void 0;if(t!==void 0&&[400,404].includes(t))return{data:!1,error:e}}throw e}}getPublicUrl(e,t){let n=this._getFinalPath(e),r=new URLSearchParams;t?.download&&r.set(`download`,t.download===!0?``:t.download),t?.transform&&this.applyTransformOptsToQuery(r,t.transform),t?.cacheNonce!=null&&r.set(`cacheNonce`,String(t.cacheNonce)),t?.versionId!=null&&r.set(`versionId`,String(t.versionId));let i=r.toString(),a=typeof t?.transform==`object`&&t.transform!==null&&Object.keys(t.transform).length>0?`render/image`:`object`;return{data:{publicUrl:encodeURI(`${this.url}/${a}/public/${n}`)+(i?`?${i}`:``)}}}async remove(e){var t=this;return t.handleOperation(async()=>await A(t.fetch,`${t.url}/object/${t.bucketId}`,{prefixes:e},{headers:t.headers}))}async purgeCache(e,t,n){var r=this;return r.handleOperation(async()=>{let i=Ht(r._getFinalPath(e)),a=new URLSearchParams;t?.transformations&&a.set(`transformations`,`true`);let o=a.toString();return await A(r.fetch,`${r.url}/cdn/${i}${o?`?${o}`:``}`,{},{headers:r.headers},n)})}async list(e,t,n){var r=this;return r.handleOperation(async()=>{let i=t?.sortBy?D(D({},tn.sortBy),t.sortBy):tn.sortBy,a=D(D(D({},tn),t),{},{sortBy:i,prefix:e||``});return await k(r.fetch,`${r.url}/object/list/${r.bucketId}`,a,{headers:r.headers},n)})}async listV2(e,t){var n=this;return n.handleOperation(async()=>{let r=D({},e);return await k(n.fetch,`${n.url}/object/list-v2/${n.bucketId}`,r,{headers:n.headers},t)})}encodeMetadata(e){return JSON.stringify(e)}toBase64(e){return typeof Buffer<`u`?Buffer.from(e).toString(`base64`):btoa(e)}_getFinalPath(e){return`${this.bucketId}/${e.replace(/^\/+/,``)}`}_removeEmptyFolders(e){return e.replace(/^\/|\/$/g,``).replace(/\/+/g,`/`)}applyTransformOptsToQuery(e,t){return t.width&&e.set(`width`,t.width.toString()),t.height&&e.set(`height`,t.height.toString()),t.resize&&e.set(`resize`,t.resize),t.format&&e.set(`format`,t.format),t.quality&&e.set(`quality`,t.quality.toString()),e}};let an={"X-Client-Info":`storage-js/2.117.2`};var on=class extends Xt{constructor(e,t={},n,r){let i=new URL(e);r?.useNewHostname&&/supabase\.(co|in|red)$/.test(i.hostname)&&!i.hostname.includes(`storage.supabase.`)&&(i.hostname=i.hostname.replace(`supabase.`,`storage.supabase.`));let a=i.href.replace(/\/$/,``),o=D(D({},an),t);super(a,o,n,`storage`)}async listBuckets(e){var t=this;return t.handleOperation(async()=>{let n=t.listBucketOptionsToQueryString(e);return await O(t.fetch,`${t.url}/bucket${n}`,{headers:t.headers})})}async getBucket(e){var t=this;return t.handleOperation(async()=>await O(t.fetch,`${t.url}/bucket/${e}`,{headers:t.headers}))}async createBucket(e,t={public:!1}){var n=this;return n.handleOperation(async()=>await k(n.fetch,`${n.url}/bucket`,{id:e,name:e,type:t.type,public:t.public,file_size_limit:t.fileSizeLimit,allowed_mime_types:t.allowedMimeTypes,versioning_status:t.versioningStatus},{headers:n.headers}))}async updateBucket(e,t){var n=this;return n.handleOperation(async()=>await Jt(n.fetch,`${n.url}/bucket/${e}`,{id:e,name:e,public:t.public,file_size_limit:t.fileSizeLimit,allowed_mime_types:t.allowedMimeTypes,versioning_status:t.versioningStatus},{headers:n.headers}))}async emptyBucket(e){var t=this;return t.handleOperation(async()=>await k(t.fetch,`${t.url}/bucket/${e}/empty`,{},{headers:t.headers}))}async deleteBucket(e){var t=this;return t.handleOperation(async()=>await A(t.fetch,`${t.url}/bucket/${e}`,{},{headers:t.headers}))}async getBucketLifecycle(e){var t=this;return t.handleOperation(async()=>await O(t.fetch,t.bucketLifecycleUrl(e),{headers:t.headers}))}async updateBucketLifecycle(e,t){var n=this;return n.handleOperation(async()=>await Jt(n.fetch,n.bucketLifecycleUrl(e),t,{headers:n.headers}))}async deleteBucketLifecycle(e){var t=this;return t.handleOperation(async()=>await A(t.fetch,t.bucketLifecycleUrl(e),{},{headers:t.headers}))}async purgeBucketCache(e,t,n){var r=this;return r.handleOperation(async()=>{let i=new URLSearchParams;t?.transformations&&i.set(`transformations`,`true`);let a=i.toString();return await A(r.fetch,`${r.url}/cdn/${Ht(e)}${a?`?${a}`:``}`,{},{headers:r.headers},n)})}bucketLifecycleUrl(e){return`${this.url}/bucket/${Ht(e)}/lifecycle`}listBucketOptionsToQueryString(e){let t={};return e&&(`limit`in e&&(t.limit=String(e.limit)),`offset`in e&&(t.offset=String(e.offset)),e.search&&(t.search=e.search),e.sortColumn&&(t.sortColumn=e.sortColumn),e.sortOrder&&(t.sortOrder=e.sortOrder)),Object.keys(t).length>0?`?`+new URLSearchParams(t).toString():``}},sn=class extends Xt{constructor(e,t={},n){let r=e.replace(/\/$/,``),i=D(D({},an),t);super(r,i,n,`storage`)}async createBucket(e){var t=this;return t.handleOperation(async()=>await k(t.fetch,`${t.url}/bucket`,{name:e},{headers:t.headers}))}async listBuckets(e){var t=this;return t.handleOperation(async()=>{let n=new URLSearchParams;e?.limit!==void 0&&n.set(`limit`,e.limit.toString()),e?.offset!==void 0&&n.set(`offset`,e.offset.toString()),e?.sortColumn&&n.set(`sortColumn`,e.sortColumn),e?.sortOrder&&n.set(`sortOrder`,e.sortOrder),e?.search&&n.set(`search`,e.search);let r=n.toString(),i=r?`${t.url}/bucket?${r}`:`${t.url}/bucket`;return await O(t.fetch,i,{headers:t.headers})})}async deleteBucket(e){var t=this;return t.handleOperation(async()=>await A(t.fetch,`${t.url}/bucket/${e}`,{},{headers:t.headers}))}from(e){var t=this;if(!Vt(e))throw new Mt(`Invalid bucket name: File, folder, and bucket names must follow AWS object key naming guidelines and should avoid the use of any other characters.`);let n=new Et({baseUrl:this.url,catalogName:e,auth:{type:`custom`,getHeaders:async()=>t.headers},fetch:this.fetch}),r=this.shouldThrowOnError;return new Proxy(n,{get(e,t){let n=e[t];return typeof n==`function`?async(...t)=>{try{return{data:await n.apply(e,t),error:null}}catch(e){if(r)throw e;return{data:null,error:e}}}:n}})}},cn=class extends Xt{constructor(e,t={},n){let r=e.replace(/\/$/,``),i=D(D({},an),{},{"Content-Type":`application/json`},t);super(r,i,n,`vectors`)}async createIndex(e){var t=this;return t.handleOperation(async()=>await j.post(t.fetch,`${t.url}/CreateIndex`,e,{headers:t.headers})||{})}async getIndex(e,t){var n=this;return n.handleOperation(async()=>await j.post(n.fetch,`${n.url}/GetIndex`,{vectorBucketName:e,indexName:t},{headers:n.headers}))}async listIndexes(e){var t=this;return t.handleOperation(async()=>await j.post(t.fetch,`${t.url}/ListIndexes`,e,{headers:t.headers}))}async deleteIndex(e,t){var n=this;return n.handleOperation(async()=>await j.post(n.fetch,`${n.url}/DeleteIndex`,{vectorBucketName:e,indexName:t},{headers:n.headers})||{})}},ln=class extends Xt{constructor(e,t={},n){let r=e.replace(/\/$/,``),i=D(D({},an),{},{"Content-Type":`application/json`},t);super(r,i,n,`vectors`)}async putVectors(e){var t=this;if(e.vectors.length<1||e.vectors.length>500)throw Error(`Vector batch size must be between 1 and 500 items`);return t.handleOperation(async()=>await j.post(t.fetch,`${t.url}/PutVectors`,e,{headers:t.headers})||{})}async getVectors(e){var t=this;return t.handleOperation(async()=>await j.post(t.fetch,`${t.url}/GetVectors`,e,{headers:t.headers}))}async listVectors(e){var t=this;if(e.segmentCount!==void 0){if(e.segmentCount<1||e.segmentCount>16)throw Error(`segmentCount must be between 1 and 16`);if(e.segmentIndex!==void 0&&(e.segmentIndex<0||e.segmentIndex>=e.segmentCount))throw Error(`segmentIndex must be between 0 and ${e.segmentCount-1}`)}return t.handleOperation(async()=>await j.post(t.fetch,`${t.url}/ListVectors`,e,{headers:t.headers}))}async queryVectors(e){var t=this;return t.handleOperation(async()=>await j.post(t.fetch,`${t.url}/QueryVectors`,e,{headers:t.headers}))}async deleteVectors(e){var t=this;if(e.keys.length<1||e.keys.length>500)throw Error(`Keys batch size must be between 1 and 500 items`);return t.handleOperation(async()=>await j.post(t.fetch,`${t.url}/DeleteVectors`,e,{headers:t.headers})||{})}},un=class extends Xt{constructor(e,t={},n){let r=e.replace(/\/$/,``),i=D(D({},an),{},{"Content-Type":`application/json`},t);super(r,i,n,`vectors`)}async createBucket(e){var t=this;return t.handleOperation(async()=>await j.post(t.fetch,`${t.url}/CreateVectorBucket`,{vectorBucketName:e},{headers:t.headers})||{})}async getBucket(e){var t=this;return t.handleOperation(async()=>await j.post(t.fetch,`${t.url}/GetVectorBucket`,{vectorBucketName:e},{headers:t.headers}))}async listBuckets(e={}){var t=this;return t.handleOperation(async()=>await j.post(t.fetch,`${t.url}/ListVectorBuckets`,e,{headers:t.headers}))}async deleteBucket(e){var t=this;return t.handleOperation(async()=>await j.post(t.fetch,`${t.url}/DeleteVectorBucket`,{vectorBucketName:e},{headers:t.headers})||{})}},dn=class extends un{constructor(e,t={}){super(e,t.headers||{},t.fetch)}from(e){return new fn(this.url,this.headers,e,this.fetch)}async createBucket(e){var t=()=>super.createBucket,n=this;return t().call(n,e)}async getBucket(e){var t=()=>super.getBucket,n=this;return t().call(n,e)}async listBuckets(e={}){var t=()=>super.listBuckets,n=this;return t().call(n,e)}async deleteBucket(e){var t=()=>super.deleteBucket,n=this;return t().call(n,e)}},fn=class extends cn{constructor(e,t,n,r){super(e,t,r),this.vectorBucketName=n}async createIndex(e){var t=()=>super.createIndex,n=this;return t().call(n,D(D({},e),{},{vectorBucketName:n.vectorBucketName}))}async listIndexes(e={}){var t=()=>super.listIndexes,n=this;return t().call(n,D(D({},e),{},{vectorBucketName:n.vectorBucketName}))}async getIndex(e){var t=()=>super.getIndex,n=this;return t().call(n,n.vectorBucketName,e)}async deleteIndex(e){var t=()=>super.deleteIndex,n=this;return t().call(n,n.vectorBucketName,e)}index(e){return new pn(this.url,this.headers,this.vectorBucketName,e,this.fetch)}},pn=class extends ln{constructor(e,t,n,r,i){super(e,t,i),this.vectorBucketName=n,this.indexName=r}async putVectors(e){var t=()=>super.putVectors,n=this;return t().call(n,D(D({},e),{},{vectorBucketName:n.vectorBucketName,indexName:n.indexName}))}async getVectors(e){var t=()=>super.getVectors,n=this;return t().call(n,D(D({},e),{},{vectorBucketName:n.vectorBucketName,indexName:n.indexName}))}async listVectors(e={}){var t=()=>super.listVectors,n=this;return t().call(n,D(D({},e),{},{vectorBucketName:n.vectorBucketName,indexName:n.indexName}))}async queryVectors(e){var t=()=>super.queryVectors,n=this;return t().call(n,D(D({},e),{},{vectorBucketName:n.vectorBucketName,indexName:n.indexName}))}async deleteVectors(e){var t=()=>super.deleteVectors,n=this;return t().call(n,D(D({},e),{},{vectorBucketName:n.vectorBucketName,indexName:n.indexName}))}},mn=class extends on{constructor(e,t={},n,r){super(e,t,n,r)}from(e){return new rn(this.url,this.headers,e,this.fetch)}get vectors(){return new dn(this.url+`/vector`,{headers:this.headers,fetch:this.fetch})}get analytics(){return new sn(this.url+`/iceberg`,this.headers,this.fetch)}};let hn=``,gn;typeof Deno<`u`?(hn=`deno`,gn=Deno.version?.deno):typeof document<`u`?hn=`web`:typeof navigator<`u`&&navigator.product===`ReactNative`?hn=`react-native`:(hn=`node`,gn=globalThis.process?.version?.replace(/^v/,``));let _n=[`runtime=${hn}`];gn&&_n.push(`runtime-version=${gn}`);let vn={headers:{"X-Client-Info":`supabase-js/2.117.2; ${_n.join(`; `)}`}},yn={schema:`public`},bn={autoRefreshToken:!0,persistSession:!0,detectSessionInUrl:!0,flowType:`implicit`},xn={},Sn={enabled:!1,respectSamplingDecision:!0};function Cn(e){if(!e||typeof e!=`string`)return null;let t=e.split(`-`);if(t.length!==4)return null;let[n,r,i,a]=t;if(n.length!==2||r.length!==32||i.length!==16||a.length!==2)return null;let o=/^[0-9a-f]+$/i;return!o.test(n)||!o.test(r)||!o.test(i)||!o.test(a)||r===`00000000000000000000000000000000`||i===`0000000000000000`?null:{version:n,traceId:r,parentId:i,traceFlags:a,isSampled:(parseInt(a,16)&1)==1}}function wn(e,t){if(!e||!t||t.length===0)return!1;let n;if(e instanceof URL)n=e;else try{n=new URL(e)}catch{return!1}for(let e of t)try{if(typeof e==`string`){if(Tn(n.hostname,e))return!0}else if(e instanceof RegExp){if(e.test(n.hostname))return!0}else if(typeof e==`function`&&e(n))return!0}catch{continue}return!1}function Tn(e,t){if(t===e)return!0;if(t.startsWith(`*.`)){let n=t.slice(2);if(e.endsWith(n)&&(e===n||e.endsWith(`.`+n)))return!0}return!1}function En(e){let t=[];try{let n=new URL(e);t.push(n.hostname)}catch{}return t.push(`*.supabase.co`,`*.supabase.in`),t.push(`localhost`,`127.0.0.1`,`[::1]`),t}let Dn=Symbol.for(`@supabase/supabase-js.traceContextExtractor`);function On(){return globalThis[Dn]}let kn=e=>e?(...t)=>e(...t):(...e)=>fetch(...e),An=()=>Headers,jn=e=>e.startsWith(`sb_publishable_`)||e.startsWith(`sb_secret_`),Mn=new Set,Nn=e=>{if(!e.startsWith(`sb_`)||jn(e)||e.startsWith(`sb_temp_`))return;let t=e.match(/^sb_[a-zA-Z0-9]+_/)?.[0]??`unknown`;Mn.has(t)||(Mn.add(t),console.warn(`@supabase/supabase-js: Unrecognized Supabase API key format. The client will proceed and send this key as-is; if you see authentication errors you may need to upgrade @supabase/supabase-js to a version that recognizes this key type.`))},Pn=(e,t,n,r,i,a)=>{let o=kn(r),s=An(),c=i?.enabled===!0,l=i?.respectSamplingDecision!==!1,u=c?En(t):null,d=!(a?.omitApiKeyAsBearer&&jn(e));return async(t,r)=>{let i=await n(),a=new s(r?.headers);if(a.has(`apikey`)||a.set(`apikey`,e),!a.has(`Authorization`)){let t=i??(d?e:null);t&&a.set(`Authorization`,`Bearer ${t}`)}if(u){let e=Ln(t,u,l);e&&(e.traceparent&&!a.has(`traceparent`)&&a.set(`traceparent`,e.traceparent),e.tracestate&&!a.has(`tracestate`)&&a.set(`tracestate`,e.tracestate),e.baggage&&!a.has(`baggage`)&&a.set(`baggage`,e.baggage))}return o(t,{...r,headers:a})}},Fn=!1,In=!1;function Ln(e,t,n){let r=On();if(!r)return Fn||(Fn=!0,console.warn("@supabase/supabase-js: tracePropagation is enabled but the tracing runtime is not loaded, so trace headers will not be attached. Add `import '@supabase/supabase-js/tracing'` at your application entry point (requires the OpenTelemetry API package to be installed). The CDN/UMD build does not support trace propagation.")),null;if(!wn(typeof e==`string`||e instanceof URL?e:e.url,t))return null;let i=r();if(!i||!i.traceparent){if(i?.carrierKeys?.length&&!In){In=!0;let e=i.carrierKeys.includes(`sentry-trace`)?" Sentry detected: set `propagateTraceparent: true` in Sentry.init() to emit it.":` Configure your tracing SDK to emit W3C trace context on outgoing requests.`;console.warn(`@supabase/supabase-js: tracePropagation is enabled and a tracing SDK is active, but its propagator wrote [${i.carrierKeys.join(`, `)}] and no W3C traceparent header, so trace headers will not be attached.`+e)}return null}if(n){let e=Cn(i.traceparent);if(e&&!e.isSampled)return{traceparent:i.traceparent}}return i}function Rn(e){return typeof e==`boolean`?{enabled:e}:e}function zn(e){return e.endsWith(`/`)?e:e+`/`}let Bn=!1;function Vn(e){Bn||typeof e!=`object`||!e||!(`schema`in e)||e.schema===void 0||(Bn=!0,console.warn(`@supabase/supabase-js: The "schema" option must be nested under "db", e.g. createClient(url, key, { db: { schema: 'myschema' } }). A top-level "schema" is ignored and queries go to the default schema.`))}function Hn(e,t){let{db:n,auth:r,realtime:i,global:a}=e,{db:o,auth:s,realtime:c,global:l}=t,u=Rn(e.tracePropagation),d=Rn(t.tracePropagation),f={db:{...o,...n},auth:{...s,...r},realtime:{...c,...i},storage:{},global:{...l,...a,headers:{...l?.headers??{},...a?.headers??{}}},tracePropagation:{enabled:u?.enabled??d?.enabled??!1,respectSamplingDecision:u?.respectSamplingDecision??d?.respectSamplingDecision??!0},accessToken:async()=>``};return e.accessToken?f.accessToken=e.accessToken:delete f.accessToken,f}function Un(e){let t=e?.trim();if(!t)throw Error(`supabaseUrl is required.`);if(!t.match(/^https?:\/\//i))throw Error(`Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL.`);try{return new URL(zn(t))}catch{throw Error(`Invalid supabaseUrl: Provided URL is malformed.`)}}let Wn=`2.117.2`,M=30*1e3,Gn=3*M;2*M;let Kn={"X-Client-Info":`gotrue-js/${Wn}`},qn=`X-Supabase-Api-Version`,Jn={"2024-01-01":{timestamp:Date.parse(`2024-01-01T00:00:00.0Z`),name:`2024-01-01`}},Yn=/^([a-z0-9_-]{4})*($|[a-z0-9_-]{3}$|[a-z0-9_-]{2}$)$/i,N=`sb_flow_id`;var Xn=class extends Error{constructor(e,t,n){super(e),this.__isAuthError=!0,this.name=`AuthError`,this.status=t,this.code=n}toJSON(){return{name:this.name,message:this.message,status:this.status,code:this.code}}};function P(e){return typeof e==`object`&&!!e&&`__isAuthError`in e}var Zn=class extends Xn{constructor(e,t,n){super(e,t,n),this.name=`AuthApiError`,this.status=t,this.code=n}};function Qn(e){return P(e)&&e.name===`AuthApiError`}var F=class extends Xn{constructor(e,t){super(e),this.name=`AuthUnknownError`,this.originalError=t}},I=class extends Xn{constructor(e,t,n,r){super(e,n,r),this.name=t,this.status=n}},L=class extends I{constructor(){super(`Auth session missing!`,`AuthSessionMissingError`,400,void 0)}};function $n(e){return P(e)&&e.name===`AuthSessionMissingError`}var R=class extends I{constructor(){super(`Auth session or user missing`,`AuthInvalidTokenResponseError`,500,void 0)}},er=class extends I{constructor(e){super(e,`AuthInvalidCredentialsError`,400,void 0)}},tr=class extends I{constructor(e,t=null){super(e,`AuthImplicitGrantRedirectError`,500,void 0),this.details=null,this.details=t}toJSON(){return Object.assign(Object.assign({},super.toJSON()),{details:this.details})}};function nr(e){return P(e)&&e.name===`AuthImplicitGrantRedirectError`}var rr=class extends I{constructor(e,t=null){super(e,`AuthPKCEGrantCodeExchangeError`,500,void 0),this.details=null,this.details=t}toJSON(){return Object.assign(Object.assign({},super.toJSON()),{details:this.details})}},ir=class extends I{constructor(){super(`PKCE code verifier not found in storage. This can happen if the auth flow was initiated in a different browser or device, or if the storage was cleared. For SSR frameworks (Next.js, SvelteKit, etc.), use @supabase/ssr on both the server and client to store the code verifier in cookies.`,`AuthPKCECodeVerifierMissingError`,400,`pkce_code_verifier_not_found`)}};function ar(e){return P(e)&&e.name===`AuthPKCECodeVerifierMissingError`}var or=class extends I{constructor(e,t){super(e,`AuthRetryableFetchError`,t,void 0)}};function sr(e){return P(e)&&e.name===`AuthRetryableFetchError`}var cr=class extends I{constructor(e=`Refresh result discarded: session state changed mid-flight (e.g., concurrent signOut)`){super(e,`AuthRefreshDiscardedError`,409,void 0)}};function lr(e){return P(e)&&e.name===`AuthRefreshDiscardedError`}var ur=class extends I{constructor(e,t,n){super(e,`AuthWeakPasswordError`,t,`weak_password`),this.reasons=n}toJSON(){return Object.assign(Object.assign({},super.toJSON()),{reasons:this.reasons})}};function dr(e){return P(e)&&e.name===`AuthWeakPasswordError`}var fr=class extends I{constructor(e){super(e,`AuthInvalidJwtError`,400,`invalid_jwt`)}};let pr=`ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_`.split(``),mr=` 	
\r=`.split(``),hr=(()=>{let e=Array(128);for(let t=0;t<e.length;t+=1)e[t]=-1;for(let t=0;t<mr.length;t+=1)e[mr[t].charCodeAt(0)]=-2;for(let t=0;t<pr.length;t+=1)e[pr[t].charCodeAt(0)]=t;return e})();function gr(e,t,n){if(e!==null)for(t.queue=t.queue<<8|e,t.queuedBits+=8;t.queuedBits>=6;)n(pr[t.queue>>t.queuedBits-6&63]),t.queuedBits-=6;else if(t.queuedBits>0)for(t.queue<<=6-t.queuedBits,t.queuedBits=6;t.queuedBits>=6;)n(pr[t.queue>>t.queuedBits-6&63]),t.queuedBits-=6}function _r(e,t,n){let r=hr[e];if(r>-1)for(t.queue=t.queue<<6|r,t.queuedBits+=6;t.queuedBits>=8;)n(t.queue>>t.queuedBits-8&255),t.queuedBits-=8;else if(r===-2)return;else throw Error(`Invalid Base64-URL character "${String.fromCharCode(e)}"`)}function vr(e){let t=[],n=e=>{t.push(String.fromCodePoint(e))},r={utf8seq:0,codepoint:0},i={queue:0,queuedBits:0},a=e=>{xr(e,r,n)};for(let t=0;t<e.length;t+=1)_r(e.charCodeAt(t),i,a);return t.join(``)}function yr(e,t){if(e<=127){t(e);return}else if(e<=2047){t(192|e>>6),t(128|e&63);return}else if(e<=65535){t(224|e>>12),t(128|e>>6&63),t(128|e&63);return}else if(e<=1114111){t(240|e>>18),t(128|e>>12&63),t(128|e>>6&63),t(128|e&63);return}throw Error(`Unrecognized Unicode codepoint: ${e.toString(16)}`)}function br(e,t){for(let n=0;n<e.length;n+=1){let r=e.charCodeAt(n);if(r>55295&&r<=56319){let t=(r-55296)*1024&65535;r=(e.charCodeAt(n+1)-56320&65535|t)+65536,n+=1}yr(r,t)}}function xr(e,t,n){if(t.utf8seq===0){if(e<=127){n(e);return}for(let n=1;n<6;n+=1)if(!(e>>7-n&1)){t.utf8seq=n;break}if(t.utf8seq===2)t.codepoint=e&31;else if(t.utf8seq===3)t.codepoint=e&15;else if(t.utf8seq===4)t.codepoint=e&7;else throw Error(`Invalid UTF-8 sequence`);--t.utf8seq}else if(t.utf8seq>0){if(e<=127)throw Error(`Invalid UTF-8 sequence`);t.codepoint=t.codepoint<<6|e&63,--t.utf8seq,t.utf8seq===0&&n(t.codepoint)}}function Sr(e){let t=[],n={queue:0,queuedBits:0},r=e=>{t.push(e)};for(let t=0;t<e.length;t+=1)_r(e.charCodeAt(t),n,r);return new Uint8Array(t)}function Cr(e){let t=[];return br(e,e=>t.push(e)),new Uint8Array(t)}function z(e){let t=[],n={queue:0,queuedBits:0},r=e=>{t.push(e)};return e.forEach(e=>gr(e,n,r)),gr(null,n,r),t.join(``)}function wr(e){return Math.round(Date.now()/1e3)+e}function Tr(){return Symbol(`auth-callback`)}let B=()=>typeof window<`u`&&typeof document<`u`,V={tested:!1,writable:!1},Er=()=>{if(!B())return!1;try{if(typeof globalThis.localStorage!=`object`)return!1}catch{return!1}if(V.tested)return V.writable;let e=`lswt-${Math.random()}${Math.random()}`;try{globalThis.localStorage.setItem(e,e),globalThis.localStorage.removeItem(e),V.tested=!0,V.writable=!0}catch{V.tested=!0,V.writable=!1}return V.writable};function Dr(e){let t={},n=new URL(e);if(n.hash&&n.hash[0]===`#`)try{new URLSearchParams(n.hash.substring(1)).forEach((e,n)=>{t[n]=e})}catch{}return n.searchParams.forEach((e,n)=>{t[n]=e}),t}let Or=e=>e?(...t)=>e(...t):(...e)=>fetch(...e),kr=e=>typeof e==`object`&&!!e&&`status`in e&&`ok`in e&&`json`in e&&typeof e.json==`function`,H=async(e,t,n)=>{await e.setItem(t,JSON.stringify(n))},U=async(e,t)=>{let n=await e.getItem(t);if(!n)return null;try{return JSON.parse(n)}catch{return null}},W=async(e,t)=>{await e.removeItem(t)};var Ar=class e{constructor(){this.promise=new e.promiseConstructor((e,t)=>{this.resolve=e,this.reject=t})}};Ar.promiseConstructor=Promise;function jr(e){let t=e.split(`.`);if(t.length!==3)throw new fr(`Invalid JWT structure`);for(let e=0;e<t.length;e++)if(!Yn.test(t[e]))throw new fr(`JWT not in base64url format`);return{header:JSON.parse(vr(t[0])),payload:JSON.parse(vr(t[1])),signature:Sr(t[2]),raw:{header:t[0],payload:t[1]}}}async function Mr(e){return await new Promise(t=>{setTimeout(()=>t(null),e)})}function Nr(e,t){return new Promise((n,r)=>{(async()=>{for(let i=0;i<1/0;i++)try{let r=await e(i);if(!t(i,null,r)){n(r);return}}catch(e){if(!t(i,e)){r(e);return}}})()})}function Pr(e){return(`0`+e.toString(16)).substr(-2)}function Fr(){let e=new Uint32Array(56);if(typeof crypto>`u`){let e=``;for(let t=0;t<56;t++)e+=`ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~`.charAt(Math.floor(Math.random()*66));return e}return crypto.getRandomValues(e),Array.from(e,Pr).join(``)}async function Ir(e){let t=new TextEncoder().encode(e),n=await crypto.subtle.digest(`SHA-256`,t),r=new Uint8Array(n);return Array.from(r).map(e=>String.fromCharCode(e)).join(``)}async function Lr(e){if(!(typeof crypto<`u`&&crypto.subtle!==void 0&&typeof TextEncoder<`u`))return console.warn(`WebCrypto API is not supported. Code challenge method will default to use plain instead of sha256.`),e;let t=await Ir(e);return btoa(t).replace(/\+/g,`-`).replace(/\//g,`_`).replace(/=+$/,``)}let Rr=/^[a-zA-Z0-9_-]{8,64}$/;function zr(e){return typeof e==`string`&&Rr.test(e)?e:null}function Br(){if(typeof crypto<`u`&&typeof crypto.getRandomValues==`function`){let e=new Uint8Array(16);return crypto.getRandomValues(e),Array.from(e,Pr).join(``)}let e=``;for(let t=0;t<32;t++)e+=Math.floor(Math.random()*16).toString(16);return e}let Vr=(e,t)=>`${e}-flow-${t}-code-verifier`,Hr=e=>`${e}-flows-code-verifier`;async function Ur(e,t){let n=await U(e,Hr(t));return Array.isArray(n)?n.filter(e=>zr(e)!==null):[]}async function Wr(e,t,n,r,i){await H(e,Vr(t,n),r);let a=(await Ur(e,t)).filter(e=>e!==n);for(a.push(n);a.length>5;){let n=a.shift();await W(e,Vr(t,n)),i?.(n)}await H(e,Hr(t),a),await H(e,`${t}-code-verifier`,r)}async function Gr(e,t,n){if(n){let r=await U(e,Vr(t,n));return{verifier:typeof r==`string`?r:null,flowId:n}}let r=await U(e,`${t}-code-verifier`);return{verifier:typeof r==`string`?r:null,flowId:null}}async function G(e,t,n){let r=`${t}-code-verifier`;if(!n){await W(e,r);return}let i=Vr(t,n),a=await U(e,i);await W(e,i);let o=await Ur(e,t),s=o.filter(e=>e!==n);s.length!==o.length&&(s.length>0?await H(e,Hr(t),s):await W(e,Hr(t))),a!=null&&a===await U(e,r)&&await W(e,r)}async function Kr(e,t){let n=await Ur(e,t);for(let r of n)await W(e,Vr(t,r));await W(e,Hr(t)),await W(e,`${t}-code-verifier`)}function qr(e,t){let n=e.indexOf(`#`),r=n===-1?e:e.slice(0,n),i=n===-1?``:e.slice(n),a=r.indexOf(`?`);if(a!==-1){let e=r.slice(0,a),t=r.slice(a+1).split(`&`).filter(e=>e!==``&&e!==N&&!e.startsWith(`${N}=`));r=t.length>0?`${e}?${t.join(`&`)}`:e}let o=r.includes(`?`)?`&`:`?`;return`${r}${o}${N}=${encodeURIComponent(t)}${i}`}async function Jr(e,t,n=!1,r){let i=Fr(),a=i;n&&(a+=`/recovery`);let o=Br();await Wr(e,t,o,a,r);let s=await Lr(i);return[s,i===s?`plain`:`s256`,o]}let Yr=/^2[0-9]{3}-(0[1-9]|1[0-2])-(0[1-9]|1[0-9]|2[0-9]|3[0-1])$/i;function Xr(e){let t=e.headers.get(qn);if(!t||!t.match(Yr))return null;try{return new Date(`${t}T00:00:00.0Z`)}catch{return null}}function Zr(e){if(!e)throw Error(`Missing exp claim`);if(e<=Math.floor(Date.now()/1e3))throw Error(`JWT has expired`)}function Qr(e){switch(e){case`RS256`:return{name:`RSASSA-PKCS1-v1_5`,hash:{name:`SHA-256`}};case`ES256`:return{name:`ECDSA`,namedCurve:`P-256`,hash:{name:`SHA-256`}};default:throw Error(`Invalid alg claim`)}}let $r=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;function K(e){if(!$r.test(e))throw Error(`@supabase/auth-js: Expected parameter to be UUID but is not`)}function ei(e){if(!e.recoveryCodes)throw Error("@supabase/auth-js: the MFA recovery codes API is experimental and disabled by default. Enable it by passing `auth: { experimental: { recoveryCodes: true } }` to createClient (or to the GoTrueClient constructor).")}function ti(){return new Proxy({},{get:(e,t)=>{if(t===`__isUserNotAvailableProxy`)return!0;if(typeof t==`symbol`){let e=t.toString();if(e===`Symbol(Symbol.toPrimitive)`||e===`Symbol(Symbol.toStringTag)`||e===`Symbol(util.inspect.custom)`)return}throw Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Accessing the "${t}" property of the session object is not supported. Please use getUser() instead.`)},set:(e,t)=>{throw Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Setting the "${t}" property of the session object is not supported. Please use getUser() to fetch a user object you can manipulate.`)},deleteProperty:(e,t)=>{throw Error(`@supabase/auth-js: client was created with userStorage option and there was no user stored in the user storage. Deleting the "${t}" property of the session object is not supported. Please use getUser() to fetch a user object you can manipulate.`)}})}function ni(e,t){return new Proxy(e,{get:(e,n,r)=>{if(n===`__isInsecureUserWarningProxy`)return!0;if(typeof n==`symbol`){let t=n.toString();if(t===`Symbol(Symbol.toPrimitive)`||t===`Symbol(Symbol.toStringTag)`||t===`Symbol(util.inspect.custom)`||t===`Symbol(nodejs.util.inspect.custom)`)return Reflect.get(e,n,r)}return!t.value&&typeof n==`string`&&(console.warn(`Using the user object as returned from supabase.auth.getSession() or from some supabase.auth.onAuthStateChange() events could be insecure! This value comes directly from the storage medium (usually cookies on the server) and may not be authentic. Use supabase.auth.getUser() instead which authenticates the data by contacting the Supabase Auth server.`),t.value=!0),Reflect.get(e,n,r)}})}function ri(e){return JSON.parse(JSON.stringify(e))}let q=e=>{if(typeof e==`object`&&e){let t=e;if(typeof t.msg==`string`)return t.msg;if(typeof t.message==`string`)return t.message;if(typeof t.error_description==`string`)return t.error_description;if(typeof t.error==`string`)return t.error}return JSON.stringify(e)},ii=[500,501,502,503,504,520,521,522,523,524,525,526,527,528,529,530];async function ai(e){if(!kr(e))throw new or(q(e),0);let t;try{t=await e.json()}catch(t){throw ii.includes(e.status)?new or(e.statusText||`HTTP ${e.status}`,e.status):new F(q(t),t)}if(ii.includes(e.status))throw new or(q(t),e.status);let n,r=Xr(e);if(r&&r.getTime()>=Jn[`2024-01-01`].timestamp&&typeof t==`object`&&t&&typeof t.code==`string`?n=t.code:typeof t==`object`&&t&&typeof t.error_code==`string`&&(n=t.error_code),n){if(n===`weak_password`)throw new ur(q(t),e.status,t.weak_password?.reasons||[]);if(n===`session_not_found`)throw new L}else if(typeof t==`object`&&t&&typeof t.weak_password==`object`&&t.weak_password&&Array.isArray(t.weak_password.reasons)&&t.weak_password.reasons.length&&t.weak_password.reasons.reduce((e,t)=>e&&typeof t==`string`,!0))throw new ur(q(t),e.status,t.weak_password.reasons);throw new Zn(q(t),e.status||500,n)}let oi=(e,t,n,r)=>{let i={method:e,headers:t?.headers||{}};return e===`GET`?i:(i.headers=Object.assign({"Content-Type":`application/json;charset=UTF-8`},t?.headers),i.body=JSON.stringify(r),Object.assign(Object.assign({},i),n))};async function J(e,t,n,r){let i=Object.assign({},r?.headers);i[qn]||(i[qn]=Jn[`2024-01-01`].name),r?.jwt&&(i.Authorization=`Bearer ${r.jwt}`);let a=r?.query??{};r?.redirectTo&&(a.redirect_to=r.redirectTo);let o=await si(e,t,n+(Object.keys(a).length?`?`+new URLSearchParams(a).toString():``),{headers:i,noResolveJson:r?.noResolveJson},{},r?.body);return r?.xform?r?.xform(o):{data:Object.assign({},o),error:null}}async function si(e,t,n,r,i,a){let o=oi(t,r,i,a),s;try{s=await e(n,Object.assign({},o))}catch(e){throw new or(q(e),0)}if(s.ok||await ai(s),r?.noResolveJson)return s;try{return await s.json()}catch(e){await ai(e)}}function Y(e){let t=null;fi(e)&&(t=Object.assign({},e),e.expires_at||(t.expires_at=wr(e.expires_in)));let n=e.user??(typeof e?.id==`string`?e:null);return{data:{session:t,user:n},error:null}}function ci(e){let t=Y(e);return!t.error&&e.weak_password&&typeof e.weak_password==`object`&&Array.isArray(e.weak_password.reasons)&&e.weak_password.reasons.length&&e.weak_password.message&&typeof e.weak_password.message==`string`&&e.weak_password.reasons.reduce((e,t)=>e&&typeof t==`string`,!0)&&(t.data.weak_password=e.weak_password),t}function X(e){return{data:{user:e.user??e},error:null}}function li(e){return{data:e,error:null}}function ui(e){let{action_link:n,email_otp:r,hashed_token:i,redirect_to:a,verification_type:o}=e,s=t(e,[`action_link`,`email_otp`,`hashed_token`,`redirect_to`,`verification_type`]);return{data:{properties:{action_link:n,email_otp:r,hashed_token:i,redirect_to:a,verification_type:o},user:Object.assign({},s)},error:null}}function di(e){return e}function fi(e){return!!e.access_token&&!!e.refresh_token&&!!e.expires_in}let pi=[`global`,`local`,`others`];var mi=class{constructor({url:e=``,headers:t={},fetch:n,experimental:r}){this.url=e,this.headers=t,this.fetch=Or(n),this.experimental=r??{},this.mfa={listFactors:this._listFactors.bind(this),deleteFactor:this._deleteFactor.bind(this)},this.oauth={listClients:this._listOAuthClients.bind(this),createClient:this._createOAuthClient.bind(this),getClient:this._getOAuthClient.bind(this),updateClient:this._updateOAuthClient.bind(this),deleteClient:this._deleteOAuthClient.bind(this),regenerateClientSecret:this._regenerateOAuthClientSecret.bind(this)},this.customProviders={listProviders:this._listCustomProviders.bind(this),createProvider:this._createCustomProvider.bind(this),getProvider:this._getCustomProvider.bind(this),updateProvider:this._updateCustomProvider.bind(this),deleteProvider:this._deleteCustomProvider.bind(this)},this.passkey={listPasskeys:this._adminListPasskeys.bind(this),deletePasskey:this._adminDeletePasskey.bind(this)}}async signOut(e,t=pi[0]){if(pi.indexOf(t)<0)throw Error(`@supabase/auth-js: Parameter scope must be one of ${pi.join(`, `)}`);try{return await J(this.fetch,`POST`,`${this.url}/logout?scope=${t}`,{headers:this.headers,jwt:e,noResolveJson:!0}),{data:null,error:null}}catch(e){if(P(e))return{data:null,error:e};throw e}}async inviteUserByEmail(e,t={}){try{return await J(this.fetch,`POST`,`${this.url}/invite`,{body:{email:e,data:t.data},headers:this.headers,redirectTo:t.redirectTo,xform:X})}catch(e){if(P(e))return{data:{user:null},error:e};throw e}}async generateLink(e){try{let{options:n}=e,r=t(e,[`options`]),i=Object.assign(Object.assign({},r),n);return`newEmail`in r&&(i.new_email=r?.newEmail,delete i.newEmail),await J(this.fetch,`POST`,`${this.url}/admin/generate_link`,{body:i,headers:this.headers,xform:ui,redirectTo:n?.redirectTo})}catch(e){if(P(e))return{data:{properties:null,user:null},error:e};throw e}}async createUser(e){try{return await J(this.fetch,`POST`,`${this.url}/admin/users`,{body:e,headers:this.headers,xform:X})}catch(e){if(P(e))return{data:{user:null},error:e};throw e}}async listUsers(e){try{let t={nextPage:null,lastPage:0,total:0},n=await J(this.fetch,`GET`,`${this.url}/admin/users`,{headers:this.headers,noResolveJson:!0,query:{page:(e?.page)?.toString()??``,per_page:(e?.perPage)?.toString()??``},xform:di});if(n.error)throw n.error;let r=await n.json(),i=n.headers.get(`x-total-count`)??0,a=n.headers.get(`link`)?.split(`,`)??[];return a.length>0&&(a.forEach(e=>{let n=parseInt(e.split(`;`)[0].split(`=`)[1].substring(0,1)),r=JSON.parse(e.split(`;`)[1].split(`=`)[1]);t[`${r}Page`]=n}),t.total=parseInt(i)),{data:Object.assign(Object.assign({},r),t),error:null}}catch(e){if(P(e))return{data:{users:[]},error:e};throw e}}async getUserById(e){K(e);try{return await J(this.fetch,`GET`,`${this.url}/admin/users/${e}`,{headers:this.headers,xform:X})}catch(e){if(P(e))return{data:{user:null},error:e};throw e}}async updateUserById(e,t){K(e);try{return await J(this.fetch,`PUT`,`${this.url}/admin/users/${e}`,{body:t,headers:this.headers,xform:X})}catch(e){if(P(e))return{data:{user:null},error:e};throw e}}async deleteUser(e,t=!1){K(e);try{return await J(this.fetch,`DELETE`,`${this.url}/admin/users/${e}`,{headers:this.headers,body:{should_soft_delete:t},xform:X})}catch(e){if(P(e))return{data:{user:null},error:e};throw e}}async _listFactors(e){K(e.userId);try{let{data:t,error:n}=await J(this.fetch,`GET`,`${this.url}/admin/users/${e.userId}/factors`,{headers:this.headers,xform:e=>({data:{factors:e},error:null})});return{data:t,error:n}}catch(e){if(P(e))return{data:null,error:e};throw e}}async _deleteFactor(e){K(e.userId),K(e.id);try{return{data:await J(this.fetch,`DELETE`,`${this.url}/admin/users/${e.userId}/factors/${e.id}`,{headers:this.headers}),error:null}}catch(e){if(P(e))return{data:null,error:e};throw e}}async _listOAuthClients(e){try{let t={nextPage:null,lastPage:0,total:0},n=await J(this.fetch,`GET`,`${this.url}/admin/oauth/clients`,{headers:this.headers,noResolveJson:!0,query:{page:(e?.page)?.toString()??``,per_page:(e?.perPage)?.toString()??``},xform:di});if(n.error)throw n.error;let r=await n.json(),i=n.headers.get(`x-total-count`)??0,a=n.headers.get(`link`)?.split(`,`)??[];return a.length>0&&(a.forEach(e=>{let n=parseInt(e.split(`;`)[0].split(`=`)[1].substring(0,1)),r=JSON.parse(e.split(`;`)[1].split(`=`)[1]);t[`${r}Page`]=n}),t.total=parseInt(i)),{data:Object.assign(Object.assign({},r),t),error:null}}catch(e){if(P(e))return{data:{clients:[]},error:e};throw e}}async _createOAuthClient(e){try{return await J(this.fetch,`POST`,`${this.url}/admin/oauth/clients`,{body:e,headers:this.headers,xform:e=>({data:e,error:null})})}catch(e){if(P(e))return{data:null,error:e};throw e}}async _getOAuthClient(e){try{return await J(this.fetch,`GET`,`${this.url}/admin/oauth/clients/${e}`,{headers:this.headers,xform:e=>({data:e,error:null})})}catch(e){if(P(e))return{data:null,error:e};throw e}}async _updateOAuthClient(e,t){try{return await J(this.fetch,`PUT`,`${this.url}/admin/oauth/clients/${e}`,{body:t,headers:this.headers,xform:e=>({data:e,error:null})})}catch(e){if(P(e))return{data:null,error:e};throw e}}async _deleteOAuthClient(e){try{return await J(this.fetch,`DELETE`,`${this.url}/admin/oauth/clients/${e}`,{headers:this.headers,noResolveJson:!0}),{data:null,error:null}}catch(e){if(P(e))return{data:null,error:e};throw e}}async _regenerateOAuthClientSecret(e){try{return await J(this.fetch,`POST`,`${this.url}/admin/oauth/clients/${e}/regenerate_secret`,{headers:this.headers,xform:e=>({data:e,error:null})})}catch(e){if(P(e))return{data:null,error:e};throw e}}async _listCustomProviders(e){try{let t={};return e?.type&&(t.type=e.type),await J(this.fetch,`GET`,`${this.url}/admin/custom-providers`,{headers:this.headers,query:t,xform:e=>({data:{providers:e?.providers??[]},error:null})})}catch(e){if(P(e))return{data:{providers:[]},error:e};throw e}}async _createCustomProvider(e){try{return await J(this.fetch,`POST`,`${this.url}/admin/custom-providers`,{body:e,headers:this.headers,xform:e=>({data:e,error:null})})}catch(e){if(P(e))return{data:null,error:e};throw e}}async _getCustomProvider(e){try{return await J(this.fetch,`GET`,`${this.url}/admin/custom-providers/${e}`,{headers:this.headers,xform:e=>({data:e,error:null})})}catch(e){if(P(e))return{data:null,error:e};throw e}}async _updateCustomProvider(e,t){try{return await J(this.fetch,`PUT`,`${this.url}/admin/custom-providers/${e}`,{body:t,headers:this.headers,xform:e=>({data:e,error:null})})}catch(e){if(P(e))return{data:null,error:e};throw e}}async _deleteCustomProvider(e){try{return await J(this.fetch,`DELETE`,`${this.url}/admin/custom-providers/${e}`,{headers:this.headers,noResolveJson:!0}),{data:null,error:null}}catch(e){if(P(e))return{data:null,error:e};throw e}}async _adminListPasskeys(e){K(e.userId);try{return await J(this.fetch,`GET`,`${this.url}/admin/users/${e.userId}/passkeys`,{headers:this.headers,xform:e=>({data:e,error:null})})}catch(e){if(P(e))return{data:null,error:e};throw e}}async _adminDeletePasskey(e){K(e.userId),K(e.passkeyId);try{return await J(this.fetch,`DELETE`,`${this.url}/admin/users/${e.userId}/passkeys/${e.passkeyId}`,{headers:this.headers,noResolveJson:!0}),{data:null,error:null}}catch(e){if(P(e))return{data:null,error:e};throw e}}};function hi(e={}){return{getItem:t=>e[t]||null,setItem:(t,n)=>{e[t]=n},removeItem:t=>{delete e[t]}}}let Z={debug:!!(globalThis&&Er()&&globalThis.localStorage&&globalThis.localStorage.getItem(`supabase.gotrue-js.locks.debug`)===`true`)};var gi=class extends Error{constructor(e){super(e),this.isAcquireTimeout=!0}},_i=class extends gi{},vi=class extends gi{};async function yi(e,t,n){Z.debug&&console.log(`@supabase/gotrue-js: navigatorLock: acquire lock`,e,t);let r=new globalThis.AbortController,i;t>0&&(i=setTimeout(()=>{r.abort(),Z.debug&&console.log(`@supabase/gotrue-js: navigatorLock acquire timed out`,e)},t)),await Promise.resolve();try{return await globalThis.navigator.locks.request(e,t===0?{mode:`exclusive`,ifAvailable:!0}:{mode:`exclusive`,signal:r.signal},async r=>{if(r){clearTimeout(i),Z.debug&&console.log(`@supabase/gotrue-js: navigatorLock: acquired`,e,r.name);try{return await n()}finally{Z.debug&&console.log(`@supabase/gotrue-js: navigatorLock: released`,e,r.name)}}else if(t===0)throw Z.debug&&console.log(`@supabase/gotrue-js: navigatorLock: not immediately available`,e),new _i(`Acquiring an exclusive Navigator LockManager lock "${e}" immediately failed`);else{if(Z.debug)try{let e=await globalThis.navigator.locks.query();console.log(`@supabase/gotrue-js: Navigator LockManager state`,JSON.stringify(e,null,`  `))}catch(e){console.warn(`@supabase/gotrue-js: Error when querying Navigator LockManager state`,e)}return console.warn(`@supabase/gotrue-js: Navigator LockManager returned a null lock when using #request without ifAvailable set to true, it appears this browser is not following the LockManager spec https://developer.mozilla.org/en-US/docs/Web/API/LockManager/request`),clearTimeout(i),await n()}})}catch(a){if(clearTimeout(i),typeof a==`object`&&a&&`name`in a&&a.name===`AbortError`){if(r.signal.aborted)return Z.debug&&console.log(`@supabase/gotrue-js: navigatorLock: acquire timeout, recovering by stealing lock`,e),console.warn(`@supabase/gotrue-js: Lock "${e}" was not released within ${t}ms. This may indicate an orphaned lock from a component unmount (e.g., React Strict Mode). Forcefully acquiring the lock to recover.`),await Promise.resolve().then(()=>globalThis.navigator.locks.request(e,{mode:`exclusive`,steal:!0},async t=>{if(t){Z.debug&&console.log(`@supabase/gotrue-js: navigatorLock: recovered (stolen)`,e,t.name);try{return await n()}finally{Z.debug&&console.log(`@supabase/gotrue-js: navigatorLock: released (stolen)`,e,t.name)}}else return console.warn(`@supabase/gotrue-js: Navigator LockManager returned null lock even with steal: true`),await n()}));throw Z.debug&&console.log(`@supabase/gotrue-js: navigatorLock: lock was stolen by another request`,e),new _i(`Lock "${e}" was released because another request stole it`)}throw a}}let bi={};async function xi(e,t,n){let r=bi[e]??Promise.resolve(),i=(async()=>{try{return await r,null}catch{return null}})(),a=(async()=>{let r=null;try{let n=t>=0?new Promise((n,i)=>{r=setTimeout(()=>{console.warn(`@supabase/gotrue-js: Lock "${e}" acquisition timed out after ${t}ms. This may be caused by another operation holding the lock. Consider increasing lockAcquireTimeout or checking for stuck operations.`),i(new vi(`Acquiring process lock with name "${e}" timed out`))},t)}):null;await Promise.race([i,n].filter(e=>e)),r!==null&&clearTimeout(r)}catch(e){if(r!==null&&clearTimeout(r),e instanceof gi)throw e}return await n()})();return bi[e]=(async()=>{try{return await a}catch(e){if(e instanceof gi){try{await r}catch{}return null}throw e}})(),await a}function Si(){if(typeof globalThis!=`object`)try{Object.defineProperty(Object.prototype,`__magic__`,{get:function(){return this},configurable:!0}),__magic__.globalThis=__magic__,delete Object.prototype.__magic__}catch{typeof self<`u`&&(self.globalThis=self)}}function Ci(e){if(!/^0x[a-fA-F0-9]{40}$/.test(e))throw Error(`@supabase/auth-js: Address "${e}" is invalid.`);return e.toLowerCase()}function wi(e){return parseInt(e,16)}function Ti(e){let t=new TextEncoder().encode(e);return`0x`+Array.from(t,e=>e.toString(16).padStart(2,`0`)).join(``)}function Ei(e){let{chainId:t,domain:n,expirationTime:r,issuedAt:i=new Date,nonce:a,notBefore:o,requestId:s,resources:c,scheme:l,uri:u,version:d}=e;if(!Number.isInteger(t))throw Error(`@supabase/auth-js: Invalid SIWE message field "chainId". Chain ID must be a EIP-155 chain ID. Provided value: ${t}`);if(!n)throw Error(`@supabase/auth-js: Invalid SIWE message field "domain". Domain must be provided.`);if(a&&a.length<8)throw Error(`@supabase/auth-js: Invalid SIWE message field "nonce". Nonce must be at least 8 characters. Provided value: ${a}`);if(!u)throw Error(`@supabase/auth-js: Invalid SIWE message field "uri". URI must be provided.`);if(d!==`1`)throw Error(`@supabase/auth-js: Invalid SIWE message field "version". Version must be '1'. Provided value: ${d}`);if(e.statement?.includes(`
`))throw Error(`@supabase/auth-js: Invalid SIWE message field "statement". Statement must not include '\\n'. Provided value: ${e.statement}`);let f=Ci(e.address),p=`${l?`${l}://${n}`:n} wants you to sign in with your Ethereum account:\n${f}\n\n${e.statement?`${e.statement}\n`:``}`,m=`URI: ${u}\nVersion: ${d}\nChain ID: ${t}${a?`\nNonce: ${a}`:``}\nIssued At: ${i.toISOString()}`;if(r&&(m+=`\nExpiration Time: ${r.toISOString()}`),o&&(m+=`\nNot Before: ${o.toISOString()}`),s&&(m+=`\nRequest ID: ${s}`),c){let e=`
Resources:`;for(let t of c){if(!t||typeof t!=`string`)throw Error(`@supabase/auth-js: Invalid SIWE message field "resources". Every resource must be a valid string. Provided value: ${t}`);e+=`\n- ${t}`}m+=e}return`${p}\n${m}`}var Q=class extends Error{constructor({message:e,code:t,cause:n,name:r}){super(e,{cause:n}),this.__isWebAuthnError=!0,this.name=r??(n instanceof Error?n.name:void 0)??`Unknown Error`,this.code=t}toJSON(){return{name:this.name,message:this.message,code:this.code}}},Di=class extends Q{constructor(e,t){super({code:`ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY`,cause:t,message:e}),this.name=`WebAuthnUnknownError`,this.originalError=t}};function Oi({error:e,options:t}){let{publicKey:n}=t;if(!n)throw Error(`options was missing required publicKey property`);if(e.name===`AbortError`){if(t.signal instanceof AbortSignal)return new Q({message:`Registration ceremony was sent an abort signal`,code:`ERROR_CEREMONY_ABORTED`,cause:e})}else if(e.name===`ConstraintError`){if(n.authenticatorSelection?.requireResidentKey===!0)return new Q({message:`Discoverable credentials were required but no available authenticator supported it`,code:`ERROR_AUTHENTICATOR_MISSING_DISCOVERABLE_CREDENTIAL_SUPPORT`,cause:e});if(t.mediation===`conditional`&&n.authenticatorSelection?.userVerification===`required`)return new Q({message:`User verification was required during automatic registration but it could not be performed`,code:`ERROR_AUTO_REGISTER_USER_VERIFICATION_FAILURE`,cause:e});if(n.authenticatorSelection?.userVerification===`required`)return new Q({message:`User verification was required but no available authenticator supported it`,code:`ERROR_AUTHENTICATOR_MISSING_USER_VERIFICATION_SUPPORT`,cause:e})}else if(e.name===`InvalidStateError`)return new Q({message:`The authenticator was previously registered`,code:`ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED`,cause:e});else if(e.name===`NotAllowedError`)return new Q({message:e.message,code:`ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY`,cause:e});else if(e.name===`NotSupportedError`)return n.pubKeyCredParams.filter(e=>e.type===`public-key`).length===0?new Q({message:`No entry in pubKeyCredParams was of type "public-key"`,code:`ERROR_MALFORMED_PUBKEYCREDPARAMS`,cause:e}):new Q({message:`No available authenticator supported any of the specified pubKeyCredParams algorithms`,code:`ERROR_AUTHENTICATOR_NO_SUPPORTED_PUBKEYCREDPARAMS_ALG`,cause:e});else if(e.name===`SecurityError`){let t=window.location.hostname;if(Fi(t)){if(n.rp.id!==t)return new Q({message:`The RP ID "${n.rp.id}" is invalid for this domain`,code:`ERROR_INVALID_RP_ID`,cause:e})}else return new Q({message:`${window.location.hostname} is an invalid domain`,code:`ERROR_INVALID_DOMAIN`,cause:e})}else if(e.name===`TypeError`){if(n.user.id.byteLength<1||n.user.id.byteLength>64)return new Q({message:`User ID was not between 1 and 64 characters`,code:`ERROR_INVALID_USER_ID_LENGTH`,cause:e})}else if(e.name===`UnknownError`)return new Q({message:`The authenticator was unable to process the specified options, or could not create a new credential`,code:`ERROR_AUTHENTICATOR_GENERAL_ERROR`,cause:e});return new Q({message:`a Non-Webauthn related error has occurred`,code:`ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY`,cause:e})}function ki({error:e,options:t}){let{publicKey:n}=t;if(!n)throw Error(`options was missing required publicKey property`);if(e.name===`AbortError`){if(t.signal instanceof AbortSignal)return new Q({message:`Authentication ceremony was sent an abort signal`,code:`ERROR_CEREMONY_ABORTED`,cause:e})}else if(e.name===`NotAllowedError`)return new Q({message:e.message,code:`ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY`,cause:e});else if(e.name===`SecurityError`){let t=window.location.hostname;if(Fi(t)){if(n.rpId!==t)return new Q({message:`The RP ID "${n.rpId}" is invalid for this domain`,code:`ERROR_INVALID_RP_ID`,cause:e})}else return new Q({message:`${window.location.hostname} is an invalid domain`,code:`ERROR_INVALID_DOMAIN`,cause:e})}else if(e.name===`UnknownError`)return new Q({message:`The authenticator was unable to process the specified options, or could not create a new assertion signature`,code:`ERROR_AUTHENTICATOR_GENERAL_ERROR`,cause:e});return new Q({message:`a Non-Webauthn related error has occurred`,code:`ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY`,cause:e})}let Ai=new class{createNewAbortSignal(){if(this.controller){let e=Error(`Cancelling existing WebAuthn API call for new one`);e.name=`AbortError`,this.controller.abort(e)}let e=new AbortController;return this.controller=e,e.signal}cancelCeremony(){if(this.controller){let e=Error(`Manually cancelling existing WebAuthn API call`);e.name=`AbortError`,this.controller.abort(e),this.controller=void 0}}};function ji(e){if(!e)throw Error(`Credential creation options are required`);if(typeof PublicKeyCredential<`u`&&`parseCreationOptionsFromJSON`in PublicKeyCredential&&typeof PublicKeyCredential.parseCreationOptionsFromJSON==`function`)return PublicKeyCredential.parseCreationOptionsFromJSON(e);let{challenge:n,user:r,excludeCredentials:i}=e,a=t(e,[`challenge`,`user`,`excludeCredentials`]),o=Sr(n).buffer,s=Object.assign(Object.assign({},r),{id:Sr(r.id).buffer}),c=Object.assign(Object.assign({},a),{challenge:o,user:s});if(i&&i.length>0){c.excludeCredentials=Array(i.length);for(let e=0;e<i.length;e++){let t=i[e];c.excludeCredentials[e]=Object.assign(Object.assign({},t),{id:Sr(t.id).buffer,type:t.type||`public-key`,transports:t.transports})}}return c}function Mi(e){if(!e)throw Error(`Credential request options are required`);if(typeof PublicKeyCredential<`u`&&`parseRequestOptionsFromJSON`in PublicKeyCredential&&typeof PublicKeyCredential.parseRequestOptionsFromJSON==`function`)return PublicKeyCredential.parseRequestOptionsFromJSON(e);let{challenge:n,allowCredentials:r}=e,i=t(e,[`challenge`,`allowCredentials`]),a=Sr(n).buffer,o=Object.assign(Object.assign({},i),{challenge:a});if(r&&r.length>0){o.allowCredentials=Array(r.length);for(let e=0;e<r.length;e++){let t=r[e];o.allowCredentials[e]=Object.assign(Object.assign({},t),{id:Sr(t.id).buffer,type:t.type||`public-key`,transports:t.transports})}}return o}function Ni(e){if(`toJSON`in e&&typeof e.toJSON==`function`)return e.toJSON();let t=e;return{id:e.id,rawId:e.id,response:{attestationObject:z(new Uint8Array(e.response.attestationObject)),clientDataJSON:z(new Uint8Array(e.response.clientDataJSON))},type:`public-key`,clientExtensionResults:e.getClientExtensionResults(),authenticatorAttachment:t.authenticatorAttachment??void 0}}function Pi(e){if(`toJSON`in e&&typeof e.toJSON==`function`)return e.toJSON();let t=e,n=e.getClientExtensionResults(),r=e.response;return{id:e.id,rawId:e.id,response:{authenticatorData:z(new Uint8Array(r.authenticatorData)),clientDataJSON:z(new Uint8Array(r.clientDataJSON)),signature:z(new Uint8Array(r.signature)),userHandle:r.userHandle?z(new Uint8Array(r.userHandle)):void 0},type:`public-key`,clientExtensionResults:n,authenticatorAttachment:t.authenticatorAttachment??void 0}}function Fi(e){return e===`localhost`||/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(e)}function Ii(){return!!(B()&&`PublicKeyCredential`in window&&window.PublicKeyCredential&&`credentials`in navigator&&typeof(navigator==null?void 0:navigator.credentials)?.create==`function`&&typeof(navigator==null?void 0:navigator.credentials)?.get==`function`)}async function Li(e){try{let t=await navigator.credentials.create(e);return t?t instanceof PublicKeyCredential?{data:t,error:null}:{data:null,error:new Di(`Browser returned unexpected credential type`,t)}:{data:null,error:new Di(`Empty credential response`,t)}}catch(t){return{data:null,error:Oi({error:t,options:e})}}}async function Ri(e){try{let t=await navigator.credentials.get(e);return t?t instanceof PublicKeyCredential?{data:t,error:null}:{data:null,error:new Di(`Browser returned unexpected credential type`,t)}:{data:null,error:new Di(`Empty credential response`,t)}}catch(t){return{data:null,error:ki({error:t,options:e})}}}let zi={hints:[`security-key`],authenticatorSelection:{authenticatorAttachment:`cross-platform`,requireResidentKey:!1,userVerification:`preferred`,residentKey:`discouraged`},attestation:`direct`},Bi={userVerification:`preferred`,hints:[`security-key`],attestation:`direct`};function Vi(...e){let t=e=>typeof e==`object`&&!!e&&!Array.isArray(e),n=e=>e instanceof ArrayBuffer||ArrayBuffer.isView(e),r={};for(let i of e)if(i)for(let e in i){let a=i[e];if(a!==void 0)if(Array.isArray(a))r[e]=a;else if(n(a))r[e]=a;else if(t(a)){let n=r[e];t(n)?r[e]=Vi(n,a):r[e]=Vi(a)}else r[e]=a}return r}function Hi(e,t){return Vi(zi,e,t||{})}function Ui(e,t){return Vi(Bi,e,t||{})}var Wi=class{constructor(e){this.client=e,this.enroll=this._enroll.bind(this),this.challenge=this._challenge.bind(this),this.verify=this._verify.bind(this),this.authenticate=this._authenticate.bind(this),this.register=this._register.bind(this)}async _enroll(e){return this.client.mfa.enroll(Object.assign(Object.assign({},e),{factorType:`webauthn`}))}async _challenge({factorId:e,webauthn:t,friendlyName:n,signal:r},i){try{let{data:a,error:o}=await this.client.mfa.challenge({factorId:e,webauthn:t});if(!a)return{data:null,error:o};let s=r??Ai.createNewAbortSignal();if(a.webauthn.type===`create`){let{user:e}=a.webauthn.credential_options.publicKey;if(!e.name){let t=n;if(t)e.name=`${e.id}:${t}`;else{let t=(await this.client.getUser()).data.user,n=t?.user_metadata?.name||t?.email||t?.id||`User`;e.name=`${e.id}:${n}`}}e.displayName||=e.name}switch(a.webauthn.type){case`create`:{let{data:t,error:n}=await Li({publicKey:Hi(a.webauthn.credential_options.publicKey,i?.create),signal:s});return t?{data:{factorId:e,challengeId:a.id,webauthn:{type:a.webauthn.type,credential_response:t}},error:null}:{data:null,error:n}}case`request`:{let t=Ui(a.webauthn.credential_options.publicKey,i?.request),{data:n,error:r}=await Ri(Object.assign(Object.assign({},a.webauthn.credential_options),{publicKey:t,signal:s}));return n?{data:{factorId:e,challengeId:a.id,webauthn:{type:a.webauthn.type,credential_response:n}},error:null}:{data:null,error:r}}}}catch(e){return P(e)?{data:null,error:e}:{data:null,error:new F(`Unexpected error in challenge`,e)}}}async _verify({challengeId:e,factorId:t,webauthn:n}){return this.client.mfa.verify({factorId:t,challengeId:e,webauthn:n})}async _authenticate({factorId:e,webauthn:{rpId:t=typeof window<`u`?window.location.hostname:void 0,rpOrigins:n=typeof window<`u`?[window.location.origin]:void 0,signal:r}={}},i){if(!t)return{data:null,error:new Xn(`rpId is required for WebAuthn authentication`)};try{if(!Ii())return{data:null,error:new F(`Browser does not support WebAuthn`,null)};let{data:a,error:o}=await this.challenge({factorId:e,webauthn:{rpId:t,rpOrigins:n},signal:r},{request:i});if(!a)return{data:null,error:o};let{webauthn:s}=a;return this._verify({factorId:e,challengeId:a.challengeId,webauthn:{type:s.type,rpId:t,rpOrigins:n,credential_response:s.credential_response}})}catch(e){return P(e)?{data:null,error:e}:{data:null,error:new F(`Unexpected error in authenticate`,e)}}}async _register({friendlyName:e,webauthn:{rpId:t=typeof window<`u`?window.location.hostname:void 0,rpOrigins:n=typeof window<`u`?[window.location.origin]:void 0,signal:r}={}},i){if(!t)return{data:null,error:new Xn(`rpId is required for WebAuthn registration`)};try{if(!Ii())return{data:null,error:new F(`Browser does not support WebAuthn`,null)};let{data:a,error:o}=await this._enroll({friendlyName:e});if(!a)return await this.client.mfa.listFactors().then(t=>t.data?.all.find(t=>t.factor_type===`webauthn`&&t.friendly_name===e&&t.status===`unverified`)).then(e=>e?this.client.mfa.unenroll({factorId:e?.id}):void 0),{data:null,error:o};let{data:s,error:c}=await this._challenge({factorId:a.id,friendlyName:a.friendly_name,webauthn:{rpId:t,rpOrigins:n},signal:r},{create:i});return s?this._verify({factorId:a.id,challengeId:s.challengeId,webauthn:{rpId:t,rpOrigins:n,type:s.webauthn.type,credential_response:s.webauthn.credential_response}}):{data:null,error:c}}catch(e){return P(e)?{data:null,error:e}:{data:null,error:new F(`Unexpected error in register`,e)}}}};Si();let Gi={url:`http://localhost:9999`,storageKey:`supabase.auth.token`,autoRefreshToken:!0,persistSession:!0,detectSessionInUrl:!0,headers:Kn,flowType:`implicit`,debug:!1,hasCustomAuthorizationHeader:!1,throwOnError:!1,lockAcquireTimeout:5e3,skipAutoInitialize:!1,experimental:{}},$={},Ki=!1;var qi=class e{get jwks(){return $[this.storageKey]?.jwks??{keys:[]}}set jwks(e){$[this.storageKey]=Object.assign(Object.assign({},$[this.storageKey]),{jwks:e})}get jwks_cached_at(){return $[this.storageKey]?.cachedAt??-(2**53-1)}set jwks_cached_at(e){$[this.storageKey]=Object.assign(Object.assign({},$[this.storageKey]),{cachedAt:e})}constructor(t){var n;this.userStorage=null,this.memoryStorage=null,this.stateChangeEmitters=new Map,this.autoRefreshTicker=null,this.autoRefreshTickTimeout=null,this.visibilityChangedCallback=null,this.refreshingDeferred=null,this.lastRefreshFailure=null,this._sessionRemovalEpoch=0,this.initializePromise=null,this._pendingInitNotifications=null,this.detectSessionInUrl=!0,this.hasCustomAuthorizationHeader=!1,this.suppressGetSessionWarning=!1,this.lock=null,this.lockAcquired=!1,this.pendingInLock=[],this.broadcastChannel=null,this.logger=console.log;let r=Object.assign(Object.assign({},Gi),t);if(this.storageKey=r.storageKey,this.instanceID=e.nextInstanceID[this.storageKey]??0,e.nextInstanceID[this.storageKey]=this.instanceID+1,this.logDebugMessages=!!r.debug,typeof r.debug==`function`&&(this.logger=r.debug),this.instanceID>0&&B()){let e=`${this._logPrefix()} Multiple GoTrueClient instances detected in the same browser context. It is not an error, but this should be avoided as it may produce undefined behavior when used concurrently under the same storage key.`;console.warn(e),this.logDebugMessages&&console.trace(e)}if(this.persistSession=r.persistSession,this.autoRefreshToken=r.autoRefreshToken,this.experimental=r.experimental??{},this.admin=new mi({url:r.url,headers:r.headers,fetch:r.fetch,experimental:this.experimental}),this.url=r.url,this.headers=r.headers,this.fetch=Or(r.fetch),this.detectSessionInUrl=r.detectSessionInUrl,this.flowType=r.flowType,this.hasCustomAuthorizationHeader=r.hasCustomAuthorizationHeader,this.throwOnError=r.throwOnError,this.lockAcquireTimeout=r.lockAcquireTimeout,r.lock!=null&&(this.lock=r.lock,Ki||(Ki=!0,console.warn(`${this._logPrefix()} The "lock" option is deprecated and will be removed in v3. The client now coordinates session refreshes without a lock, so most apps can drop the option. See https://github.com/supabase/supabase-js/blob/master/packages/core/auth-js/migrations/lockless-coordination.md`))),this.jwks||(this.jwks={keys:[]},this.jwks_cached_at=-(2**53-1)),this.mfa={verify:this._verify.bind(this),enroll:this._enroll.bind(this),unenroll:this._unenroll.bind(this),challenge:this._challenge.bind(this),listFactors:this._listFactors.bind(this),challengeAndVerify:this._challengeAndVerify.bind(this),getAuthenticatorAssuranceLevel:this._getAuthenticatorAssuranceLevel.bind(this),webauthn:new Wi(this),recoveryCodes:{getStatus:this._getRecoveryCodesStatus.bind(this),generate:this._generateRecoveryCodes.bind(this),verify:this._verifyRecoveryCode.bind(this),regenerate:this._regenerateRecoveryCodes.bind(this),unenroll:this._unenrollRecoveryCodes.bind(this)}},this.oauth={getAuthorizationDetails:this._getAuthorizationDetails.bind(this),approveAuthorization:this._approveAuthorization.bind(this),denyAuthorization:this._denyAuthorization.bind(this),listGrants:this._listOAuthGrants.bind(this),revokeGrant:this._revokeOAuthGrant.bind(this)},this.passkey={startRegistration:this._startPasskeyRegistration.bind(this),verifyRegistration:this._verifyPasskeyRegistration.bind(this),startAuthentication:this._startPasskeyAuthentication.bind(this),verifyAuthentication:this._verifyPasskeyAuthentication.bind(this),list:this._listPasskeys.bind(this),update:this._updatePasskey.bind(this),delete:this._deletePasskey.bind(this)},this.persistSession?(r.storage?this.storage=r.storage:Er()?this.storage=globalThis.localStorage:(this.memoryStorage={},this.storage=hi(this.memoryStorage)),r.userStorage&&(this.userStorage=r.userStorage)):(this.memoryStorage={},this.storage=hi(this.memoryStorage)),B()&&globalThis.BroadcastChannel&&this.persistSession&&this.storageKey){try{this.broadcastChannel=new globalThis.BroadcastChannel(this.storageKey)}catch(e){console.error(`Failed to create a new BroadcastChannel, multi-tab state changes will not be available`,e)}(n=this.broadcastChannel)==null||n.addEventListener(`message`,async e=>{this._debug(`received broadcast notification from other tab or client`,e),(e.data.event===`TOKEN_REFRESHED`||e.data.event===`SIGNED_IN`)&&(this.lastRefreshFailure=null);try{await this._notifyAllSubscribers(e.data.event,e.data.session,!1)}catch(e){this._debug(`#broadcastChannel`,`error`,e)}})}r.skipAutoInitialize||this.initialize().catch(e=>{this._debug(`#initialize()`,`error`,e)})}isThrowOnErrorEnabled(){return this.throwOnError}_returnResult(e){if(this.throwOnError&&e&&e.error)throw e.error;return e}_logPrefix(){return`GoTrueClient@${this.storageKey}:${this.instanceID} (${Wn}) ${new Date().toISOString()}`}_debug(...e){return this.logDebugMessages&&this.logger(this._logPrefix(),...e),this}async initialize(){if(this.initializePromise)return await this.initializePromise;this._pendingInitNotifications=[],this.initializePromise=(async()=>this.lock==null?await this._initialize():await this._acquireLock(this.lockAcquireTimeout,async()=>await this._initialize()))();let e=await this.initializePromise,t=this._pendingInitNotifications??[];this._pendingInitNotifications=null;for(let e of t)await this._notifyAllSubscribers(e.event,e.session,e.broadcast);return e}async _initialize(){try{let e={},t=`none`;if(B()&&(e=Dr(window.location.href),this._isImplicitGrantCallback(e)?t=`implicit`:await this._isPKCECallback(e)&&(t=`pkce`)),B()&&this.detectSessionInUrl&&t!==`none`){let{data:n,error:r}=await this._getSessionFromURL(e,t);if(r){if(this._debug(`#_initialize()`,`error detecting session from URL`,r),nr(r)){let e=r.details?.code;if(e===`identity_already_exists`||e===`identity_not_found`||e===`single_identity_not_deletable`)return{error:r}}return{error:r}}let{session:i,redirectType:a}=n;return this._debug(`#_initialize()`,`detected session in URL`,i,`redirect type`,a),await this._saveSession(i),setTimeout(async()=>{a===`recovery`?await this._notifyAllSubscribers(`PASSWORD_RECOVERY`,i):await this._notifyAllSubscribers(`SIGNED_IN`,i)},0),{error:null}}return await this._recoverAndRefresh(),{error:null}}catch(e){return P(e)?this._returnResult({error:e}):this._returnResult({error:new F(`Unexpected error during initialization`,e)})}finally{await this._handleVisibilityChange(),this._debug(`#_initialize()`,`end`)}}async signInAnonymously(e){try{let{data:t,error:n}=await J(this.fetch,`POST`,`${this.url}/signup`,{headers:this.headers,body:{data:e?.options?.data??{},gotrue_meta_security:{captcha_token:e?.options?.captchaToken}},xform:Y});if(n||!t)return this._returnResult({data:{user:null,session:null},error:n});let r=t.session,i=t.user;return t.session&&(await this._saveSession(t.session),await this._notifyAllSubscribers(`SIGNED_IN`,r)),this._returnResult({data:{user:i,session:r},error:null})}catch(e){if(P(e))return this._returnResult({data:{user:null,session:null},error:e});throw e}}async signUp(e){let t=null;try{let n;if(`email`in e){let{email:r,password:i,options:a}=e,o=null,s=null;this.flowType===`pkce`&&([o,s,t]=await this._getCodeChallengeAndMethod()),n=await J(this.fetch,`POST`,`${this.url}/signup`,{headers:this.headers,redirectTo:this._maybeAppendFlowIdToRedirect(a?.emailRedirectTo,t),body:{email:r,password:i,data:a?.data??{},gotrue_meta_security:{captcha_token:a?.captchaToken},code_challenge:o,code_challenge_method:s},xform:Y})}else if(`phone`in e){let{phone:t,password:r,options:i}=e;n=await J(this.fetch,`POST`,`${this.url}/signup`,{headers:this.headers,body:{phone:t,password:r,data:i?.data??{},channel:i?.channel??`sms`,gotrue_meta_security:{captcha_token:i?.captchaToken}},xform:Y})}else throw new er(`You must provide either an email or phone number and a password`);let{data:r,error:i}=n;if(i||!r)return await G(this.storage,this.storageKey,t),this._returnResult({data:{user:null,session:null},error:i});let a=r.session,o=r.user;return r.session&&(await this._saveSession(r.session),await this._notifyAllSubscribers(`SIGNED_IN`,a)),this._returnResult({data:{user:o,session:a},error:null})}catch(e){if(await G(this.storage,this.storageKey,t),P(e))return this._returnResult({data:{user:null,session:null},error:e});throw e}}async signInWithPassword(e){try{let t;if(`email`in e){let{email:n,password:r,options:i}=e;t=await J(this.fetch,`POST`,`${this.url}/token?grant_type=password`,{headers:this.headers,body:{email:n,password:r,gotrue_meta_security:{captcha_token:i?.captchaToken}},xform:ci})}else if(`phone`in e){let{phone:n,password:r,options:i}=e;t=await J(this.fetch,`POST`,`${this.url}/token?grant_type=password`,{headers:this.headers,body:{phone:n,password:r,gotrue_meta_security:{captcha_token:i?.captchaToken}},xform:ci})}else throw new er(`You must provide either an email or phone number and a password`);let{data:n,error:r}=t;if(r)return this._returnResult({data:{user:null,session:null},error:r});if(!n||!n.session||!n.user){let e=new R;return this._returnResult({data:{user:null,session:null},error:e})}return n.session&&(await this._saveSession(n.session),await this._notifyAllSubscribers(`SIGNED_IN`,n.session)),this._returnResult({data:Object.assign({user:n.user,session:n.session},n.weak_password?{weakPassword:n.weak_password}:null),error:r})}catch(e){if(P(e))return this._returnResult({data:{user:null,session:null},error:e});throw e}}async signInWithOAuth(e){return await this._handleProviderSignIn(e.provider,{redirectTo:e.options?.redirectTo,scopes:e.options?.scopes,queryParams:e.options?.queryParams,skipBrowserRedirect:e.options?.skipBrowserRedirect})}async exchangeCodeForSession(e,t){return await this.initializePromise,this.lock==null?this._exchangeCodeForSession(e,t):this._acquireLock(this.lockAcquireTimeout,async()=>this._exchangeCodeForSession(e,t))}async signInWithWeb3(e){let{chain:t}=e;switch(t){case`ethereum`:return await this.signInWithEthereum(e);case`solana`:return await this.signInWithSolana(e);default:throw Error(`@supabase/auth-js: Unsupported chain "${t}"`)}}async signInWithEthereum(e){let t,n;if(`message`in e)t=e.message,n=e.signature;else{let{chain:r,wallet:i,statement:a,options:o}=e,s;if(B())if(typeof i==`object`)s=i;else{let e=window;if(`ethereum`in e&&typeof e.ethereum==`object`&&`request`in e.ethereum&&typeof e.ethereum.request==`function`)s=e.ethereum;else throw Error(`@supabase/auth-js: No compatible Ethereum wallet interface on the window object (window.ethereum) detected. Make sure the user already has a wallet installed and connected for this app. Prefer passing the wallet interface object directly to signInWithWeb3({ chain: 'ethereum', wallet: resolvedUserWallet }) instead.`)}else{if(typeof i!=`object`||!o?.url)throw Error(`@supabase/auth-js: Both wallet and url must be specified in non-browser environments.`);s=i}let c=new URL(o?.url??window.location.href),l=await s.request({method:`eth_requestAccounts`}).then(e=>e).catch(()=>{throw Error(`@supabase/auth-js: Wallet method eth_requestAccounts is missing or invalid`)});if(!l||l.length===0)throw Error(`@supabase/auth-js: No accounts available. Please ensure the wallet is connected.`);let u=Ci(l[0]),d=o?.signInWithEthereum?.chainId;d||=wi(await s.request({method:`eth_chainId`})),t=Ei({domain:c.host,address:u,statement:a,uri:c.href,version:`1`,chainId:d,nonce:o?.signInWithEthereum?.nonce,issuedAt:o?.signInWithEthereum?.issuedAt??new Date,expirationTime:o?.signInWithEthereum?.expirationTime,notBefore:o?.signInWithEthereum?.notBefore,requestId:o?.signInWithEthereum?.requestId,resources:o?.signInWithEthereum?.resources}),n=await s.request({method:`personal_sign`,params:[Ti(t),u]})}try{let{data:r,error:i}=await J(this.fetch,`POST`,`${this.url}/token?grant_type=web3`,{headers:this.headers,body:Object.assign({chain:`ethereum`,message:t,signature:n},e.options?.captchaToken?{gotrue_meta_security:{captcha_token:e.options?.captchaToken}}:null),xform:Y});if(i)throw i;if(!r||!r.session||!r.user){let e=new R;return this._returnResult({data:{user:null,session:null},error:e})}return r.session&&(await this._saveSession(r.session),await this._notifyAllSubscribers(`SIGNED_IN`,r.session)),this._returnResult({data:Object.assign({},r),error:i})}catch(e){if(P(e))return this._returnResult({data:{user:null,session:null},error:e});throw e}}async signInWithSolana(e){let t,n;if(`message`in e)t=e.message,n=e.signature;else{let{chain:r,wallet:i,statement:a,options:o}=e,s;if(B())if(typeof i==`object`)s=i;else{let e=window;if(`solana`in e&&typeof e.solana==`object`&&(`signIn`in e.solana&&typeof e.solana.signIn==`function`||`signMessage`in e.solana&&typeof e.solana.signMessage==`function`))s=e.solana;else throw Error(`@supabase/auth-js: No compatible Solana wallet interface on the window object (window.solana) detected. Make sure the user already has a wallet installed and connected for this app. Prefer passing the wallet interface object directly to signInWithWeb3({ chain: 'solana', wallet: resolvedUserWallet }) instead.`)}else{if(typeof i!=`object`||!o?.url)throw Error(`@supabase/auth-js: Both wallet and url must be specified in non-browser environments.`);s=i}let c=new URL(o?.url??window.location.href);if(`signIn`in s&&s.signIn){let e=await s.signIn(Object.assign(Object.assign(Object.assign({issuedAt:new Date().toISOString()},o?.signInWithSolana),{version:`1`,domain:c.host,uri:c.href}),a?{statement:a}:null)),r;if(Array.isArray(e)&&e[0]&&typeof e[0]==`object`)r=e[0];else if(e&&typeof e==`object`&&`signedMessage`in e&&`signature`in e)r=e;else throw Error(`@supabase/auth-js: Wallet method signIn() returned unrecognized value`);if(`signedMessage`in r&&`signature`in r&&(typeof r.signedMessage==`string`||r.signedMessage instanceof Uint8Array)&&r.signature instanceof Uint8Array)t=typeof r.signedMessage==`string`?r.signedMessage:new TextDecoder().decode(r.signedMessage),n=r.signature;else throw Error(`@supabase/auth-js: Wallet method signIn() API returned object without signedMessage and signature fields`)}else{if(!(`signMessage`in s)||typeof s.signMessage!=`function`||!(`publicKey`in s)||typeof s!=`object`||!s.publicKey||!(`toBase58`in s.publicKey)||typeof s.publicKey.toBase58!=`function`)throw Error(`@supabase/auth-js: Wallet does not have a compatible signMessage() and publicKey.toBase58() API`);t=[`${c.host} wants you to sign in with your Solana account:`,s.publicKey.toBase58(),...a?[``,a,``]:[``],`Version: 1`,`URI: ${c.href}`,`Issued At: ${o?.signInWithSolana?.issuedAt??new Date().toISOString()}`,...o?.signInWithSolana?.notBefore?[`Not Before: ${o.signInWithSolana.notBefore}`]:[],...o?.signInWithSolana?.expirationTime?[`Expiration Time: ${o.signInWithSolana.expirationTime}`]:[],...o?.signInWithSolana?.chainId?[`Chain ID: ${o.signInWithSolana.chainId}`]:[],...o?.signInWithSolana?.nonce?[`Nonce: ${o.signInWithSolana.nonce}`]:[],...o?.signInWithSolana?.requestId?[`Request ID: ${o.signInWithSolana.requestId}`]:[],...o?.signInWithSolana?.resources?.length?[`Resources`,...o.signInWithSolana.resources.map(e=>`- ${e}`)]:[]].join(`
`);let e=await s.signMessage(new TextEncoder().encode(t),`utf8`);if(!e||!(e instanceof Uint8Array))throw Error(`@supabase/auth-js: Wallet signMessage() API returned an recognized value`);n=e}}try{let{data:r,error:i}=await J(this.fetch,`POST`,`${this.url}/token?grant_type=web3`,{headers:this.headers,body:Object.assign({chain:`solana`,message:t,signature:z(n)},e.options?.captchaToken?{gotrue_meta_security:{captcha_token:e.options?.captchaToken}}:null),xform:Y});if(i)throw i;if(!r||!r.session||!r.user){let e=new R;return this._returnResult({data:{user:null,session:null},error:e})}return r.session&&(await this._saveSession(r.session),await this._notifyAllSubscribers(`SIGNED_IN`,r.session)),this._returnResult({data:Object.assign({},r),error:i})}catch(e){if(P(e))return this._returnResult({data:{user:null,session:null},error:e});throw e}}async _exchangeCodeForSession(e,t){let n=t?.flowId!=null,r=n?zr(t?.flowId):B()?zr(Dr(window.location.href)[N]):null;n&&!r&&this._debug(`#_exchangeCodeForSession()`,`provided flowId is not a valid flow id`,t?.flowId);let{verifier:i,flowId:a}=n&&!r?{verifier:null,flowId:null}:await Gr(this.storage,this.storageKey,r),[o,s]=(i??``).split(`/`);try{if(!o&&this.flowType===`pkce`)throw new ir;let{data:t,error:n}=await J(this.fetch,`POST`,`${this.url}/token?grant_type=pkce`,{headers:this.headers,body:{auth_code:e,code_verifier:o},xform:Y});if(await G(this.storage,this.storageKey,a),n)throw n;if(!t||!t.session||!t.user){let e=new R;return this._returnResult({data:{user:null,session:null,redirectType:null},error:e})}return t.session&&(await this._saveSession(t.session),await this._notifyAllSubscribers(s===`recovery`?`PASSWORD_RECOVERY`:`SIGNED_IN`,t.session)),this._returnResult({data:Object.assign(Object.assign({},t),{redirectType:s??null}),error:n})}catch(e){if(await G(this.storage,this.storageKey,a),P(e))return this._returnResult({data:{user:null,session:null,redirectType:null},error:e});throw e}}async signInWithIdToken(e){try{let{options:t,provider:n,token:r,access_token:i,nonce:a}=e,{data:o,error:s}=await J(this.fetch,`POST`,`${this.url}/token?grant_type=id_token`,{headers:this.headers,body:{provider:n,id_token:r,access_token:i,nonce:a,gotrue_meta_security:{captcha_token:t?.captchaToken}},xform:Y});if(s)return this._returnResult({data:{user:null,session:null},error:s});if(!o||!o.session||!o.user){let e=new R;return this._returnResult({data:{user:null,session:null},error:e})}return o.session&&(await this._saveSession(o.session),await this._notifyAllSubscribers(`SIGNED_IN`,o.session)),this._returnResult({data:o,error:s})}catch(e){if(P(e))return this._returnResult({data:{user:null,session:null},error:e});throw e}}async signInWithOtp(e){let t=null;try{if(`email`in e){let{email:n,options:r}=e,i=null,a=null;this.flowType===`pkce`&&([i,a,t]=await this._getCodeChallengeAndMethod());let{error:o}=await J(this.fetch,`POST`,`${this.url}/otp`,{headers:this.headers,body:{email:n,data:r?.data??{},create_user:r?.shouldCreateUser??!0,gotrue_meta_security:{captcha_token:r?.captchaToken},code_challenge:i,code_challenge_method:a},redirectTo:this._maybeAppendFlowIdToRedirect(r?.emailRedirectTo,t)});return this._returnResult({data:{user:null,session:null},error:o})}if(`phone`in e){let{phone:t,options:n}=e,{data:r,error:i}=await J(this.fetch,`POST`,`${this.url}/otp`,{headers:this.headers,body:{phone:t,data:n?.data??{},create_user:n?.shouldCreateUser??!0,gotrue_meta_security:{captcha_token:n?.captchaToken},channel:n?.channel??`sms`}});return this._returnResult({data:{user:null,session:null,messageId:r?.message_id},error:i})}throw new er(`You must provide either an email or phone number.`)}catch(e){if(await G(this.storage,this.storageKey,t),P(e))return this._returnResult({data:{user:null,session:null},error:e});throw e}}async verifyOtp(e){try{let t,n;`options`in e&&(t=e.options?.redirectTo,n=e.options?.captchaToken);let{data:r,error:i}=await J(this.fetch,`POST`,`${this.url}/verify`,{headers:this.headers,body:Object.assign(Object.assign({},e),{gotrue_meta_security:{captcha_token:n}}),redirectTo:t,xform:Y});if(i)throw i;if(!r)throw Error(`An error occurred on token verification.`);let a=r.session,o=r.user;return a?.access_token&&(await this._saveSession(a),await this._notifyAllSubscribers(e.type==`recovery`?`PASSWORD_RECOVERY`:`SIGNED_IN`,a)),this._returnResult({data:{user:o,session:a},error:null})}catch(e){if(P(e))return this._returnResult({data:{user:null,session:null},error:e});throw e}}async signInWithSSO(e){let t=null;try{let n=null,r=null;this.flowType===`pkce`&&([n,r,t]=await this._getCodeChallengeAndMethod());let i=await J(this.fetch,`POST`,`${this.url}/sso`,{body:Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({},`providerId`in e?{provider_id:e.providerId}:null),`domain`in e?{domain:e.domain}:null),{redirect_to:this._maybeAppendFlowIdToRedirect(e.options?.redirectTo,t)}),e?.options?.captchaToken?{gotrue_meta_security:{captcha_token:e.options.captchaToken}}:null),{skip_http_redirect:!0,code_challenge:n,code_challenge_method:r}),headers:this.headers,xform:li});return i.data?.url&&B()&&!e.options?.skipBrowserRedirect&&window.location.assign(i.data.url),this._returnResult(i)}catch(e){if(await G(this.storage,this.storageKey,t),P(e))return this._returnResult({data:null,error:e});throw e}}async reauthenticate(){return await this.initializePromise,this.lock==null?await this._reauthenticate():await this._acquireLock(this.lockAcquireTimeout,async()=>await this._reauthenticate())}async _reauthenticate(){try{return await this._useSession(async e=>{let{data:{session:t},error:n}=e;if(n)throw n;if(!t)throw new L;let{error:r}=await J(this.fetch,`GET`,`${this.url}/reauthenticate`,{headers:this.headers,jwt:t.access_token});return this._returnResult({data:{user:null,session:null},error:r})})}catch(e){if(P(e))return this._returnResult({data:{user:null,session:null},error:e});throw e}}async resend(e){let t=null;try{let n=`${this.url}/resend`;if(`email`in e){let{email:r,type:i,options:a}=e,o=null,s=null;this.flowType===`pkce`&&([o,s,t]=await this._getCodeChallengeAndMethod());let{error:c}=await J(this.fetch,`POST`,n,{headers:this.headers,body:{email:r,type:i,gotrue_meta_security:{captcha_token:a?.captchaToken},code_challenge:o,code_challenge_method:s},redirectTo:this._maybeAppendFlowIdToRedirect(a?.emailRedirectTo,t)});return c&&await G(this.storage,this.storageKey,t),this._returnResult({data:{user:null,session:null},error:c})}else if(`phone`in e){let{phone:t,type:r,options:i}=e,{data:a,error:o}=await J(this.fetch,`POST`,n,{headers:this.headers,body:{phone:t,type:r,gotrue_meta_security:{captcha_token:i?.captchaToken}}});return this._returnResult({data:{user:null,session:null,messageId:a?.message_id},error:o})}throw new er(`You must provide either an email or phone number and a type`)}catch(e){if(await G(this.storage,this.storageKey,t),P(e))return this._returnResult({data:{user:null,session:null},error:e});throw e}}async getSession(){return await this.initializePromise,this.lock==null?await this._useSession(async e=>e):await this._acquireLock(this.lockAcquireTimeout,async()=>this._useSession(async e=>e))}async _acquireLock(e,t){this._debug(`#_acquireLock`,`begin`,e);try{if(this.lockAcquired){let e=this.pendingInLock.length?this.pendingInLock[this.pendingInLock.length-1]:Promise.resolve(),n=(async()=>(await e,await t()))();return this.pendingInLock.push((async()=>{try{await n}catch{}})()),n}return await this.lock(`lock:${this.storageKey}`,e,async()=>{this._debug(`#_acquireLock`,`lock acquired for storage key`,this.storageKey);try{this.lockAcquired=!0;let e=t();for(this.pendingInLock.push((async()=>{try{await e}catch{}})()),await e;this.pendingInLock.length;){let e=[...this.pendingInLock];await Promise.all(e),this.pendingInLock.splice(0,e.length)}return await e}finally{this._debug(`#_acquireLock`,`lock released for storage key`,this.storageKey),this.lockAcquired=!1}})}finally{this._debug(`#_acquireLock`,`end`)}}async _useSession(e){this._debug(`#_useSession`,`begin`);try{return await e(await this.__loadSession())}finally{this._debug(`#_useSession`,`end`)}}async __loadSession(){this._debug(`#__loadSession()`,`begin`),this.lock!=null&&!this.lockAcquired&&this._debug(`#__loadSession()`,`used outside of an acquired lock!`,Error().stack);try{let e=null,t=await U(this.storage,this.storageKey);if(this._debug(`#getSession()`,`session from storage`,t),t!==null&&(this._isValidSession(t)?e=t:(this._debug(`#getSession()`,`session from storage is not valid`),await this._removeSession())),!e)return{data:{session:null},error:null};let n=e.expires_at?e.expires_at*1e3-Date.now()<Gn:!1;if(this._debug(`#__loadSession()`,`session has${n?``:` not`} expired`,`expires_at`,e.expires_at),!n)return{data:{session:await this._hydrateSessionUser(e)},error:null};let{data:r,error:i}=await this._callRefreshToken(e.refresh_token);if(i){let e=await U(this.storage,this.storageKey);return e&&this._isValidSession(e)&&e.expires_at&&e.expires_at*1e3>Date.now()?this._returnResult({data:{session:await this._hydrateSessionUser(e)},error:null}):this._returnResult({data:{session:null},error:i})}return this._returnResult({data:{session:r},error:null})}finally{this._debug(`#__loadSession()`,`end`)}}async _hydrateSessionUser(e){if(this.userStorage){let t=await U(this.userStorage,this.storageKey+`-user`);e.user=t?.user?t.user:ti()}if(this.storage.isServer&&e.user&&!e.user.__isUserNotAvailableProxy){let t={value:this.suppressGetSessionWarning};e.user=ni(e.user,t),t.value&&(this.suppressGetSessionWarning=!0)}return e}async getUser(e){if(e)return await this._getUser(e);await this.initializePromise;let t;return t=this.lock==null?await this._getUser():await this._acquireLock(this.lockAcquireTimeout,async()=>await this._getUser()),t.data.user&&(this.suppressGetSessionWarning=!0),t}async _getUser(e){try{return e?await J(this.fetch,`GET`,`${this.url}/user`,{headers:this.headers,jwt:e,xform:X}):await this._useSession(async e=>{let{data:t,error:n}=e;if(n)throw n;return!t.session?.access_token&&!this.hasCustomAuthorizationHeader?{data:{user:null},error:new L}:await J(this.fetch,`GET`,`${this.url}/user`,{headers:this.headers,jwt:t.session?.access_token??void 0,xform:X})})}catch(e){if(P(e))return $n(e)&&await this._removeSession(),this._returnResult({data:{user:null},error:e});throw e}}async updateUser(e,t={}){return await this.initializePromise,this.lock==null?await this._updateUser(e,t):await this._acquireLock(this.lockAcquireTimeout,async()=>await this._updateUser(e,t))}async _updateUser(e,t={}){let n=null;try{return await this._useSession(async r=>{let{data:i,error:a}=r;if(a)throw a;if(!i.session)throw new L;let o=i.session,s=null,c=null;this.flowType===`pkce`&&e.email!=null&&([s,c,n]=await this._getCodeChallengeAndMethod());let{data:l,error:u}=await J(this.fetch,`PUT`,`${this.url}/user`,{headers:this.headers,redirectTo:this._maybeAppendFlowIdToRedirect(t?.emailRedirectTo,n),body:Object.assign(Object.assign({},e),{code_challenge:s,code_challenge_method:c}),jwt:o.access_token,xform:X});if(u)throw u;return o.user=l.user,await this._saveSession(o),await this._notifyAllSubscribers(`USER_UPDATED`,o),this._returnResult({data:{user:o.user},error:null})})}catch(e){if(await G(this.storage,this.storageKey,n),P(e))return this._returnResult({data:{user:null},error:e});throw e}}async setSession(e){return await this.initializePromise,this.lock==null?await this._setSession(e):await this._acquireLock(this.lockAcquireTimeout,async()=>await this._setSession(e))}async _setSession(e){try{if(!e.access_token||!e.refresh_token)throw new L;let t=Date.now()/1e3,n=t,r=!0,i=null,{payload:a}=jr(e.access_token);if(a.exp&&(n=a.exp,r=n<=t),r){let{data:t,error:n}=await this._callRefreshToken(e.refresh_token);if(n)return this._returnResult({data:{user:null,session:null},error:n});if(!t)return{data:{user:null,session:null},error:null};i=t}else{let{data:r,error:a}=await this._getUser(e.access_token);if(a)return this._returnResult({data:{user:null,session:null},error:a});i={access_token:e.access_token,refresh_token:e.refresh_token,user:r.user,token_type:`bearer`,expires_in:n-t,expires_at:n},await this._saveSession(i),await this._notifyAllSubscribers(`SIGNED_IN`,i)}return this._returnResult({data:{user:i.user,session:i},error:null})}catch(e){if(P(e))return this._returnResult({data:{session:null,user:null},error:e});throw e}}async refreshSession(e){return await this.initializePromise,this.lock==null?await this._refreshSession(e):await this._acquireLock(this.lockAcquireTimeout,async()=>await this._refreshSession(e))}async _refreshSession(e){try{return await this._useSession(async t=>{if(!e){let{data:n,error:r}=t;if(r)throw r;e=n.session??void 0}if(!e?.refresh_token)throw new L;let{data:n,error:r}=await this._callRefreshToken(e.refresh_token);return r?this._returnResult({data:{user:null,session:null},error:r}):n?this._returnResult({data:{user:n.user,session:n},error:null}):this._returnResult({data:{user:null,session:null},error:null})})}catch(e){if(P(e))return this._returnResult({data:{user:null,session:null},error:e});throw e}}async _getSessionFromURL(e,t){try{if(!B())throw new tr(`No browser detected.`);if(e.error||e.error_description||e.error_code)throw new tr(e.error_description||`Error in URL with unspecified error_description`,{error:e.error||`unspecified_error`,code:e.error_code||`unspecified_code`});switch(t){case`implicit`:if(this.flowType===`pkce`)throw new rr(`Not a valid PKCE flow url.`);break;case`pkce`:if(this.flowType===`implicit`)throw new tr(`Not a valid implicit grant flow url.`);break;default:}if(t===`pkce`){if(this._debug(`#_initialize()`,`begin`,`is PKCE flow`,!0),!e.code)throw new rr(`No code detected.`);let{data:t,error:n}=await this._exchangeCodeForSession(e.code,{flowId:e[N]});if(n)throw n;let r=new URL(window.location.href);return r.searchParams.delete(`code`),r.searchParams.delete(N),window.history.replaceState(window.history.state,``,r.toString()),{data:{session:t.session,redirectType:t.redirectType??null},error:null}}let{provider_token:n,provider_refresh_token:r,access_token:i,refresh_token:a,expires_in:o,expires_at:s,token_type:c}=e;if(!i||!o||!a||!c)throw new tr(`No session defined in URL`);let l=Math.round(Date.now()/1e3),u=parseInt(o),d=l+u;s&&(d=parseInt(s));let f=d-l;f*1e3<=M&&console.warn(`@supabase/gotrue-js: Session as retrieved from URL expires in ${f}s, should have been closer to ${u}s`);let p=d-u;l-p>=120?console.warn(`@supabase/gotrue-js: Session as retrieved from URL was issued over 120s ago, URL could be stale`,p,d,l):l-p<0&&console.warn(`@supabase/gotrue-js: Session as retrieved from URL was issued in the future? Check the device clock for skew`,p,d,l);let{data:m,error:h}=await this._getUser(i);if(h)throw h;let g={provider_token:n,provider_refresh_token:r,access_token:i,expires_in:u,expires_at:d,refresh_token:a,token_type:c,user:m.user};return window.location.hash=``,this._debug(`#_getSessionFromURL()`,`clearing window.location.hash`),this._returnResult({data:{session:g,redirectType:e.type},error:null})}catch(e){if(P(e))return this._returnResult({data:{session:null,redirectType:null},error:e});throw e}}_isImplicitGrantCallback(e){return typeof this.detectSessionInUrl==`function`?this.detectSessionInUrl(new URL(window.location.href),e):!!(e.access_token||e.error||e.error_description||e.error_code)}async _isPKCECallback(e){if(!e.code)return!1;let t=zr(e[N]);return t&&await U(this.storage,Vr(this.storageKey,t))?!0:!!await U(this.storage,`${this.storageKey}-code-verifier`)}async signOut(e={scope:`global`}){return await this.initializePromise,this.lock==null?await this._signOut(e):await this._acquireLock(this.lockAcquireTimeout,async()=>await this._signOut(e))}async _signOut({scope:e}={scope:`global`}){return await this._useSession(async t=>{let n=async()=>{await this._removeSession()},{data:r,error:i}=t;if(i&&!$n(i))return this._returnResult({error:i});let a=r.session?.access_token;if(a){let{error:t}=await this.admin.signOut(a,e);if(t&&!(Qn(t)&&(t.status===404||t.status===401||t.status===403)||$n(t)))return e!==`others`&&await n(),this._returnResult({error:t})}return e!==`others`&&await n(),this._returnResult({error:null})})}onAuthStateChange(e){let t=Tr(),n={id:t,callback:e,unsubscribe:()=>{this._debug(`#unsubscribe()`,`state change callback with id removed`,t),this.stateChangeEmitters.delete(t)}};return this._debug(`#onAuthStateChange()`,`registered callback with id`,t),this.stateChangeEmitters.set(t,n),(async()=>{await this.initializePromise,this.lock==null?await this._emitInitialSession(t):await this._acquireLock(this.lockAcquireTimeout,async()=>{this._emitInitialSession(t)})})(),{data:{subscription:n}}}async _emitInitialSession(e){return await this._useSession(async t=>{try{let{data:{session:n},error:r}=t;if(r)throw r;await this.stateChangeEmitters.get(e)?.callback(`INITIAL_SESSION`,n),this._debug(`INITIAL_SESSION`,`callback id`,e,`session`,n)}catch(t){if(await this.stateChangeEmitters.get(e)?.callback(`INITIAL_SESSION`,null),this._debug(`INITIAL_SESSION`,`callback id`,e,`error`,t),lr(t))return;$n(t)||sr(t)||Qn(t)&&(t.code===`refresh_token_not_found`||t.code===`refresh_token_already_used`||t.code===`session_expired`)?console.warn(t):console.error(t)}})}async resetPasswordForEmail(e,t={}){let n=null,r=null,i=null;this.flowType===`pkce`&&([n,r,i]=await this._getCodeChallengeAndMethod(!0));try{return await J(this.fetch,`POST`,`${this.url}/recover`,{body:{email:e,code_challenge:n,code_challenge_method:r,gotrue_meta_security:{captcha_token:t.captchaToken}},headers:this.headers,redirectTo:this._maybeAppendFlowIdToRedirect(t.redirectTo,i)})}catch(e){if(await G(this.storage,this.storageKey,i),P(e))return this._returnResult({data:null,error:e});throw e}}async getUserIdentities(){try{let{data:e,error:t}=await this.getUser();if(t)throw t;return this._returnResult({data:{identities:e.user.identities??[]},error:null})}catch(e){if(P(e))return this._returnResult({data:null,error:e});throw e}}async linkIdentity(e){return`token`in e?this.linkIdentityIdToken(e):this.linkIdentityOAuth(e)}async linkIdentityOAuth(e){let t=null;try{let{data:n,error:r}=await this._useSession(async n=>{let{data:r,error:i}=n;if(i)throw i;let{url:a,flowId:o}=await this._getUrlForProvider(`${this.url}/user/identities/authorize`,e.provider,{redirectTo:e.options?.redirectTo,scopes:e.options?.scopes,queryParams:e.options?.queryParams,skipBrowserRedirect:!0});return t=o,await J(this.fetch,`GET`,a,{headers:this.headers,jwt:r.session?.access_token??void 0})});if(r)throw r;return B()&&!e.options?.skipBrowserRedirect&&window.location.assign(n?.url),this._returnResult({data:{provider:e.provider,url:n?.url,flowId:t},error:null})}catch(n){if(P(n))return this._returnResult({data:{provider:e.provider,url:null,flowId:t},error:n});throw n}}async linkIdentityIdToken(e){return await this._useSession(async t=>{try{let{error:n,data:{session:r}}=t;if(n)throw n;let{options:i,provider:a,token:o,access_token:s,nonce:c}=e,{data:l,error:u}=await J(this.fetch,`POST`,`${this.url}/token?grant_type=id_token`,{headers:this.headers,jwt:r?.access_token??void 0,body:{provider:a,id_token:o,access_token:s,nonce:c,link_identity:!0,gotrue_meta_security:{captcha_token:i?.captchaToken}},xform:Y});return u?this._returnResult({data:{user:null,session:null},error:u}):!l||!l.session||!l.user?this._returnResult({data:{user:null,session:null},error:new R}):(l.session&&(await this._saveSession(l.session),await this._notifyAllSubscribers(`USER_UPDATED`,l.session)),this._returnResult({data:l,error:u}))}catch(e){if(await G(this.storage,this.storageKey,null),P(e))return this._returnResult({data:{user:null,session:null},error:e});throw e}})}async unlinkIdentity(e){try{return await this._useSession(async t=>{let{data:n,error:r}=t;if(r)throw r;return await J(this.fetch,`DELETE`,`${this.url}/user/identities/${e.identity_id}`,{headers:this.headers,jwt:n.session?.access_token??void 0})})}catch(e){if(P(e))return this._returnResult({data:null,error:e});throw e}}async _refreshAccessToken(e){let t=`#_refreshAccessToken()`;this._debug(t,`begin`);try{let n=Date.now();return await Nr(async n=>(n>0&&await Mr(200*2**(n-1)),this._debug(t,`refreshing attempt`,n),await J(this.fetch,`POST`,`${this.url}/token?grant_type=refresh_token`,{body:{refresh_token:e},headers:this.headers,xform:Y})),(e,t)=>{let r=200*2**e;return t&&sr(t)&&Date.now()+r-n<M})}catch(e){if(this._debug(t,`error`,e),P(e))return this._returnResult({data:{session:null,user:null},error:e});throw e}finally{this._debug(t,`end`)}}_isValidSession(e){return typeof e==`object`&&!!e&&`access_token`in e&&`refresh_token`in e&&`expires_at`in e}async _handleProviderSignIn(e,t){let{url:n,flowId:r}=await this._getUrlForProvider(`${this.url}/authorize`,e,{redirectTo:t.redirectTo,scopes:t.scopes,queryParams:t.queryParams});return this._debug(`#_handleProviderSignIn()`,`provider`,e,`options`,t,`url`,n),B()&&!t.skipBrowserRedirect&&window.location.assign(n),{data:{provider:e,url:n,flowId:r},error:null}}async _recoverAndRefresh(){let e=`#_recoverAndRefresh()`;this._debug(e,`begin`);try{let t=await U(this.storage,this.storageKey);if(t&&this.userStorage){let e=await U(this.userStorage,this.storageKey+`-user`);!this.storage.isServer&&Object.is(this.storage,this.userStorage)&&!e&&(e={user:t.user},await H(this.userStorage,this.storageKey+`-user`,e)),t.user=e?.user??ti()}else if(t&&!t.user&&!t.user){let e=await U(this.storage,this.storageKey+`-user`);e&&e?.user?(t.user=e.user,await W(this.storage,this.storageKey+`-user`),await H(this.storage,this.storageKey,t)):t.user=ti()}if(this._debug(e,`session from storage`,t),!this._isValidSession(t)){this._debug(e,`session is not valid`),t!==null&&await this._removeSession();return}let n=(t.expires_at??1/0)*1e3-Date.now()<Gn;if(this._debug(e,`session has${n?``:` not`} expired with margin of ${Gn}s`),n){if(this.autoRefreshToken&&t.refresh_token){let{error:n}=await this._callRefreshToken(t.refresh_token);n&&(lr(n)?this._debug(e,`refresh discarded by commit guard`,n):this._debug(e,`refresh failed`,n))}}else if(t.user&&t.user.__isUserNotAvailableProxy===!0)try{let{data:n,error:r}=await this._getUser(t.access_token);!r&&n?.user?(t.user=n.user,await this._saveSession(t),await this._notifyAllSubscribers(`SIGNED_IN`,t)):this._debug(e,`could not get user data, skipping SIGNED_IN notification`)}catch(t){console.error(`Error getting user data:`,t),this._debug(e,`error getting user data, skipping SIGNED_IN notification`,t)}else await this._notifyAllSubscribers(`SIGNED_IN`,t)}catch(t){this._debug(e,`error`,t),sr(t)?console.warn(t):console.error(t);return}finally{this._debug(e,`end`)}}async _callRefreshToken(e){var t,n;if(!e)throw new L;if(this.refreshingDeferred)return this.refreshingDeferred.promise;if(this.lastRefreshFailure&&this.lastRefreshFailure.refreshToken===e&&Date.now()<this.lastRefreshFailure.expiresAt)return this._debug(`#_callRefreshToken()`,`returning cached failure (cooldown active)`),this.lastRefreshFailure.result;let r=`#_callRefreshToken()`;this._debug(r,`begin`);try{this.refreshingDeferred=new Ar,this.refreshingDeferred.promise.then(void 0,()=>{});let t=await U(this.storage,this.storageKey),{data:n,error:i}=await this._refreshAccessToken(e);if(i)throw i;if(!n.session)throw new L;let a=await U(this.storage,this.storageKey);if(t!==null&&(a===null||a.refresh_token!==t.refresh_token)){this._debug(r,`commit guard: storage changed since refresh started, discarding rotated tokens`,{startedWith:`present`,nowHolds:a?`replaced`:`cleared`});let e={data:null,error:new cr};return this.refreshingDeferred.resolve(e),e}let o=this._sessionRemovalEpoch;if(await this._saveSession(n.session),this._sessionRemovalEpoch!==o){this._debug(r,`commit guard (post-save): _removeSession ran during _saveSession, undoing write`),await W(this.storage,this.storageKey),this.userStorage&&await W(this.userStorage,this.storageKey+`-user`);let e={data:null,error:new cr};return this.refreshingDeferred.resolve(e),e}await this._notifyAllSubscribers(`TOKEN_REFRESHED`,n.session);let s={data:n.session,error:null};return this.lastRefreshFailure=null,this.refreshingDeferred.resolve(s),s}catch(i){if(this._debug(r,`error`,i),P(i)){let n={data:null,error:i};if(!sr(i)){let e=await U(this.storage,this.storageKey);e?.expires_at&&e.expires_at*1e3>Date.now()?this._debug(r,`proactive refresh failed, access token still valid — preserving session`):await this._removeSession()}return this.lastRefreshFailure={refreshToken:e,result:n,expiresAt:Date.now()+6e4},(t=this.refreshingDeferred)==null||t.resolve(n),n}throw(n=this.refreshingDeferred)==null||n.reject(i),i}finally{this.refreshingDeferred=null,this._debug(r,`end`)}}async _notifyAllSubscribers(e,t,n=!0){if(this._pendingInitNotifications!==null&&n){this._pendingInitNotifications.push({event:e,session:t,broadcast:n});return}let r=`#_notifyAllSubscribers(${e})`;this._debug(r,`begin`,t,`broadcast = ${n}`);try{this.broadcastChannel&&n&&this.broadcastChannel.postMessage({event:e,session:t});let r=[],i=Array.from(this.stateChangeEmitters.values()).map(async n=>{try{await n.callback(e,t)}catch(e){r.push(e)}});if(await Promise.all(i),r.length>0){for(let e=0;e<r.length;e+=1)console.error(r[e]);throw r[0]}}finally{this._debug(r,`end`)}}async _saveSession(e){this._debug(`#_saveSession()`,e),this.suppressGetSessionWarning=!0;let t=Object.assign({},e),n=t.user&&t.user.__isUserNotAvailableProxy===!0;if(this.userStorage){!n&&t.user&&await H(this.userStorage,this.storageKey+`-user`,{user:t.user});let e=Object.assign({},t);delete e.user;let r=ri(e);await H(this.storage,this.storageKey,r)}else{let e=ri(t);await H(this.storage,this.storageKey,e)}}async _removeSession(){this._sessionRemovalEpoch+=1,this._debug(`#_removeSession()`),this.lastRefreshFailure=null,this.suppressGetSessionWarning=!1,await W(this.storage,this.storageKey),await Kr(this.storage,this.storageKey),await W(this.storage,this.storageKey+`-user`),this.userStorage&&await W(this.userStorage,this.storageKey+`-user`),await this._notifyAllSubscribers(`SIGNED_OUT`,null)}_removeVisibilityChangedCallback(){this._debug(`#_removeVisibilityChangedCallback()`);let e=this.visibilityChangedCallback;this.visibilityChangedCallback=null;try{e&&B()&&window!=null&&window.removeEventListener&&window.removeEventListener(`visibilitychange`,e)}catch(e){console.error(`removing visibilitychange callback failed`,e)}}async _startAutoRefresh(){await this._stopAutoRefresh(),this._debug(`#_startAutoRefresh()`);let e=setInterval(()=>this._autoRefreshTokenTick(),M);this.autoRefreshTicker=e,e&&typeof e==`object`&&typeof e.unref==`function`?e.unref():typeof Deno<`u`&&typeof Deno.unrefTimer==`function`&&Deno.unrefTimer(e);let t=setTimeout(async()=>{await this.initializePromise,await this._autoRefreshTokenTick()},0);this.autoRefreshTickTimeout=t,t&&typeof t==`object`&&typeof t.unref==`function`?t.unref():typeof Deno<`u`&&typeof Deno.unrefTimer==`function`&&Deno.unrefTimer(t)}async _stopAutoRefresh(){this._debug(`#_stopAutoRefresh()`);let e=this.autoRefreshTicker;this.autoRefreshTicker=null,e&&clearInterval(e);let t=this.autoRefreshTickTimeout;this.autoRefreshTickTimeout=null,t&&clearTimeout(t)}async startAutoRefresh(){this._removeVisibilityChangedCallback(),await this._startAutoRefresh()}async stopAutoRefresh(){this._removeVisibilityChangedCallback(),await this._stopAutoRefresh()}async dispose(){var e;this._removeVisibilityChangedCallback(),await this._stopAutoRefresh(),(e=this.broadcastChannel)==null||e.close(),this.broadcastChannel=null,this.stateChangeEmitters.clear()}async _autoRefreshTokenTick(){if(this._debug(`#_autoRefreshTokenTick()`,`begin`),this.lock!=null){try{await this._acquireLock(0,async()=>{try{let e=Date.now();try{return await this._useSession(async t=>{let{data:{session:n}}=t;if(!n||!n.refresh_token||!n.expires_at){this._debug(`#_autoRefreshTokenTick()`,`no session`);return}let r=Math.floor((n.expires_at*1e3-e)/M);this._debug(`#_autoRefreshTokenTick()`,`access token expires in ${r} ticks, a tick lasts ${M}ms, refresh threshold is 3 ticks`),r<=3&&await this._callRefreshToken(n.refresh_token)})}catch(e){console.error(`Auto refresh tick failed with error. This is likely a transient error.`,e)}}finally{this._debug(`#_autoRefreshTokenTick()`,`end`)}})}catch(e){if(e instanceof gi)this._debug(`auto refresh token tick lock not available`);else throw e}return}if(this.refreshingDeferred!==null){this._debug(`#_autoRefreshTokenTick()`,`refresh already in flight, skipping`);return}try{let e=Date.now();try{await this._useSession(async t=>{let{data:{session:n}}=t;if(!n||!n.refresh_token||!n.expires_at){this._debug(`#_autoRefreshTokenTick()`,`no session`);return}let r=Math.floor((n.expires_at*1e3-e)/M);this._debug(`#_autoRefreshTokenTick()`,`access token expires in ${r} ticks, a tick lasts ${M}ms, refresh threshold is 3 ticks`),r<=3&&await this._callRefreshToken(n.refresh_token)})}catch(e){console.error(`Auto refresh tick failed with error. This is likely a transient error.`,e)}}finally{this._debug(`#_autoRefreshTokenTick()`,`end`)}}async _handleVisibilityChange(){if(this._debug(`#_handleVisibilityChange()`),!B()||!(window!=null&&window.addEventListener))return this.autoRefreshToken&&this.startAutoRefresh(),!1;try{this.visibilityChangedCallback=async()=>{try{await this._onVisibilityChanged(!1)}catch(e){this._debug(`#visibilityChangedCallback`,`error`,e)}},window==null||window.addEventListener(`visibilitychange`,this.visibilityChangedCallback),await this._onVisibilityChanged(!0)}catch(e){console.error(`_handleVisibilityChange`,e)}}async _onVisibilityChanged(e){let t=`#_onVisibilityChanged(${e})`;if(this._debug(t,`visibilityState`,document.visibilityState),document.visibilityState===`visible`){if(this.autoRefreshToken&&this._startAutoRefresh(),!e)if(await this.initializePromise,this.lock!=null)await this._acquireLock(this.lockAcquireTimeout,async()=>{if(document.visibilityState!==`visible`){this._debug(t,`acquired the lock to recover the session, but the browser visibilityState is no longer visible, aborting`);return}await this._recoverAndRefresh()});else{if(document.visibilityState!==`visible`){this._debug(t,`visibilityState is no longer visible, skipping recovery`);return}await this._recoverAndRefresh()}}else document.visibilityState===`hidden`&&this.autoRefreshToken&&this._stopAutoRefresh()}async _getUrlForProvider(e,t,n){let r=n?.redirectTo,i=null,a=null,o=null;this.flowType===`pkce`&&([i,a,o]=await this._getCodeChallengeAndMethod(),r=this._maybeAppendFlowIdToRedirect(r,o));let s=[`provider=${encodeURIComponent(t)}`];if(r&&s.push(`redirect_to=${encodeURIComponent(r)}`),n?.scopes&&s.push(`scopes=${encodeURIComponent(n.scopes)}`),i!=null&&a!=null){let e=new URLSearchParams({code_challenge:`${encodeURIComponent(i)}`,code_challenge_method:`${encodeURIComponent(a)}`});s.push(e.toString())}if(n?.queryParams){let e=new URLSearchParams(n.queryParams);s.push(e.toString())}return n?.skipBrowserRedirect&&s.push(`skip_http_redirect=${n.skipBrowserRedirect}`),{url:`${e}?${s.join(`&`)}`,flowId:o}}_maybeAppendFlowIdToRedirect(e,t){return!e||!t||!this.experimental.appendPkceFlowIdToRedirects?e??void 0:qr(e,t)}async _getCodeChallengeAndMethod(e=!1){return Jr(this.storage,this.storageKey,e,e=>this._debug(`#_getCodeChallengeAndMethod()`,`evicted oldest pending PKCE verifier slot`,e))}async _unenroll(e){try{return await this._useSession(async t=>{let{data:n,error:r}=t;return r?this._returnResult({data:null,error:r}):await J(this.fetch,`DELETE`,`${this.url}/factors/${e.factorId}`,{headers:this.headers,jwt:n?.session?.access_token})})}catch(e){if(P(e))return this._returnResult({data:null,error:e});throw e}}async _enroll(e){try{return await this._useSession(async t=>{let{data:n,error:r}=t;if(r)return this._returnResult({data:null,error:r});let i=Object.assign({friendly_name:e.friendlyName,factor_type:e.factorType},e.factorType===`phone`?{phone:e.phone}:e.factorType===`totp`?{issuer:e.issuer}:{}),{data:a,error:o}=await J(this.fetch,`POST`,`${this.url}/factors`,{body:i,headers:this.headers,jwt:n?.session?.access_token});return o?this._returnResult({data:null,error:o}):(e.factorType===`totp`&&a.type===`totp`&&a?.totp?.qr_code&&(a.totp.qr_code=`data:image/svg+xml;utf-8,${a.totp.qr_code}`),this._returnResult({data:a,error:null}))})}catch(e){if(P(e))return this._returnResult({data:null,error:e});throw e}}async _verify(e){let t=async()=>{try{return await this._useSession(async t=>{let{data:n,error:r}=t;if(r)return this._returnResult({data:null,error:r});let i=Object.assign({challenge_id:e.challengeId},`webauthn`in e?{webauthn:Object.assign(Object.assign({},e.webauthn),{credential_response:e.webauthn.type===`create`?Ni(e.webauthn.credential_response):Pi(e.webauthn.credential_response)})}:{code:e.code}),{data:a,error:o}=await J(this.fetch,`POST`,`${this.url}/factors/${e.factorId}/verify`,{body:i,headers:this.headers,jwt:n?.session?.access_token});return o?this._returnResult({data:null,error:o}):(await this._saveSession(Object.assign({expires_at:Math.round(Date.now()/1e3)+a.expires_in},a)),await this._notifyAllSubscribers(`MFA_CHALLENGE_VERIFIED`,a),this._returnResult({data:a,error:o}))})}catch(e){if(P(e))return this._returnResult({data:null,error:e});throw e}};return this.lock==null?t():this._acquireLock(this.lockAcquireTimeout,t)}async _challenge(e){let t=async()=>{try{return await this._useSession(async t=>{let{data:n,error:r}=t;if(r)return this._returnResult({data:null,error:r});let i=await J(this.fetch,`POST`,`${this.url}/factors/${e.factorId}/challenge`,{body:e,headers:this.headers,jwt:n?.session?.access_token});if(i.error)return i;let{data:a}=i;if(a.type!==`webauthn`)return{data:a,error:null};switch(a.webauthn.type){case`create`:return{data:Object.assign(Object.assign({},a),{webauthn:Object.assign(Object.assign({},a.webauthn),{credential_options:Object.assign(Object.assign({},a.webauthn.credential_options),{publicKey:ji(a.webauthn.credential_options.publicKey)})})}),error:null};case`request`:return{data:Object.assign(Object.assign({},a),{webauthn:Object.assign(Object.assign({},a.webauthn),{credential_options:Object.assign(Object.assign({},a.webauthn.credential_options),{publicKey:Mi(a.webauthn.credential_options.publicKey)})})}),error:null}}})}catch(e){if(P(e))return this._returnResult({data:null,error:e});throw e}};return this.lock==null?t():this._acquireLock(this.lockAcquireTimeout,t)}async _challengeAndVerify(e){let{data:t,error:n}=await this._challenge({factorId:e.factorId});return n?this._returnResult({data:null,error:n}):await this._verify({factorId:e.factorId,challengeId:t.id,code:e.code})}async _listFactors(){let{data:{user:e},error:t}=await this.getUser();if(t)return{data:null,error:t};let n={all:[],phone:[],totp:[],webauthn:[],recovery_code:[]};for(let t of e?.factors??[])n.all.push(t),t.status===`verified`&&t.factor_type in n&&Array.isArray(n[t.factor_type])&&n[t.factor_type].push(t);return{data:n,error:null}}async _getAuthenticatorAssuranceLevel(e){if(e)try{let{payload:t}=jr(e),n=null;t.aal&&(n=t.aal);let r=n,{data:{user:i},error:a}=await this.getUser(e);if(a)return this._returnResult({data:null,error:a});((i?.factors)?.filter(e=>e.status===`verified`)??[]).length>0&&(r=`aal2`);let o=t.amr||[];return{data:{currentLevel:n,nextLevel:r,currentAuthenticationMethods:o},error:null}}catch(e){if(P(e))return this._returnResult({data:null,error:e});throw e}let{data:{session:t},error:n}=await this.getSession();if(n)return this._returnResult({data:null,error:n});if(!t)return{data:{currentLevel:null,nextLevel:null,currentAuthenticationMethods:[]},error:null};let{payload:r}=jr(t.access_token),i=null;r.aal&&(i=r.aal);let a=i;(t.user.factors?.filter(e=>e.status===`verified`)??[]).length>0&&(a=`aal2`);let o=r.amr||[];return{data:{currentLevel:i,nextLevel:a,currentAuthenticationMethods:o},error:null}}async _getRecoveryCodesStatus(){ei(this.experimental);try{return await this._useSession(async e=>{let{data:t,error:n}=e;if(n)return this._returnResult({data:null,error:n});let{data:r,error:i}=await J(this.fetch,`GET`,`${this.url}/factors/recovery-codes`,{headers:this.headers,jwt:t?.session?.access_token});return i?this._returnResult({data:null,error:i}):this._returnResult({data:r,error:null})})}catch(e){if(P(e))return this._returnResult({data:null,error:e});throw e}}async _generateRecoveryCodes(e){ei(this.experimental);try{return await this._useSession(async t=>{let{data:n,error:r}=t;if(r)return this._returnResult({data:null,error:r});let{data:i,error:a}=await J(this.fetch,`POST`,`${this.url}/factors/recovery-codes`,{body:e?.friendlyName?{friendly_name:e.friendlyName}:void 0,headers:this.headers,jwt:n?.session?.access_token});return a?this._returnResult({data:null,error:a}):this._returnResult({data:i,error:null})})}catch(e){if(P(e))return this._returnResult({data:null,error:e});throw e}}async _verifyRecoveryCode(e){ei(this.experimental);let t=async()=>{try{return await this._useSession(async t=>{let{data:n,error:r}=t;if(r)return this._returnResult({data:null,error:r});let{data:i,error:a}=await J(this.fetch,`POST`,`${this.url}/factors/recovery-codes/verify`,{body:{code:e.code},headers:this.headers,jwt:n?.session?.access_token});if(a)return this._returnResult({data:null,error:a});let o=Object.assign({expires_at:wr(i.expires_in)},i);return await this._saveSession(o),await this._notifyAllSubscribers(`MFA_CHALLENGE_VERIFIED`,o),this._returnResult({data:i,error:null})})}catch(e){if(P(e))return this._returnResult({data:null,error:e});throw e}};return this.lock==null?t():this._acquireLock(this.lockAcquireTimeout,t)}async _regenerateRecoveryCodes(){ei(this.experimental);try{return await this._useSession(async e=>{let{data:t,error:n}=e;if(n)return this._returnResult({data:null,error:n});let{data:r,error:i}=await J(this.fetch,`POST`,`${this.url}/factors/recovery-codes/regenerate`,{headers:this.headers,jwt:t?.session?.access_token});return i?this._returnResult({data:null,error:i}):this._returnResult({data:r,error:null})})}catch(e){if(P(e))return this._returnResult({data:null,error:e});throw e}}async _unenrollRecoveryCodes(){ei(this.experimental);try{return await this._useSession(async e=>{let{data:t,error:n}=e;if(n)return this._returnResult({data:null,error:n});let{data:r,error:i}=await J(this.fetch,`DELETE`,`${this.url}/factors/recovery-codes`,{headers:this.headers,jwt:t?.session?.access_token});return i?this._returnResult({data:null,error:i}):this._returnResult({data:r,error:null})})}catch(e){if(P(e))return this._returnResult({data:null,error:e});throw e}}async _getAuthorizationDetails(e){try{return await this._useSession(async t=>{let{data:{session:n},error:r}=t;return r?this._returnResult({data:null,error:r}):n?await J(this.fetch,`GET`,`${this.url}/oauth/authorizations/${e}`,{headers:this.headers,jwt:n.access_token,xform:e=>({data:e,error:null})}):this._returnResult({data:null,error:new L})})}catch(e){if(P(e))return this._returnResult({data:null,error:e});throw e}}async _approveAuthorization(e,t){try{return await this._useSession(async n=>{let{data:{session:r},error:i}=n;if(i)return this._returnResult({data:null,error:i});if(!r)return this._returnResult({data:null,error:new L});let a=await J(this.fetch,`POST`,`${this.url}/oauth/authorizations/${e}/consent`,{headers:this.headers,jwt:r.access_token,body:{action:`approve`},xform:e=>({data:e,error:null})});return a.data&&a.data.redirect_url&&B()&&!t?.skipBrowserRedirect&&window.location.assign(a.data.redirect_url),a})}catch(e){if(P(e))return this._returnResult({data:null,error:e});throw e}}async _denyAuthorization(e,t){try{return await this._useSession(async n=>{let{data:{session:r},error:i}=n;if(i)return this._returnResult({data:null,error:i});if(!r)return this._returnResult({data:null,error:new L});let a=await J(this.fetch,`POST`,`${this.url}/oauth/authorizations/${e}/consent`,{headers:this.headers,jwt:r.access_token,body:{action:`deny`},xform:e=>({data:e,error:null})});return a.data&&a.data.redirect_url&&B()&&!t?.skipBrowserRedirect&&window.location.assign(a.data.redirect_url),a})}catch(e){if(P(e))return this._returnResult({data:null,error:e});throw e}}async _listOAuthGrants(){try{return await this._useSession(async e=>{let{data:{session:t},error:n}=e;return n?this._returnResult({data:null,error:n}):t?await J(this.fetch,`GET`,`${this.url}/user/oauth/grants`,{headers:this.headers,jwt:t.access_token,xform:e=>({data:e,error:null})}):this._returnResult({data:null,error:new L})})}catch(e){if(P(e))return this._returnResult({data:null,error:e});throw e}}async _revokeOAuthGrant(e){try{return await this._useSession(async t=>{let{data:{session:n},error:r}=t;return r?this._returnResult({data:null,error:r}):n?(await J(this.fetch,`DELETE`,`${this.url}/user/oauth/grants`,{headers:this.headers,jwt:n.access_token,query:{client_id:e.clientId},noResolveJson:!0}),{data:{},error:null}):this._returnResult({data:null,error:new L})})}catch(e){if(P(e))return this._returnResult({data:null,error:e});throw e}}async fetchJwk(e,t={keys:[]}){let n=t.keys.find(t=>t.kid===e);if(n)return n;let r=Date.now();if(n=this.jwks.keys.find(t=>t.kid===e),n&&this.jwks_cached_at+6e5>r)return n;let{data:i,error:a}=await J(this.fetch,`GET`,`${this.url}/.well-known/jwks.json`,{headers:this.headers});if(a)throw a;return!i.keys||i.keys.length===0||(this.jwks=i,this.jwks_cached_at=r,n=i.keys.find(t=>t.kid===e),!n)?null:n}async getClaims(e,t={}){try{let n=e;if(!n){let{data:e,error:t}=await this.getSession();if(t||!e.session)return this._returnResult({data:null,error:t});n=e.session.access_token}let{header:r,payload:i,signature:a,raw:{header:o,payload:s}}=jr(n);if(!t?.allowExpired)try{Zr(i.exp)}catch(e){throw new fr(e instanceof Error?e.message:`JWT validation failed`)}let c=!r.alg||r.alg.startsWith(`HS`)||!r.kid||!(`crypto`in globalThis&&`subtle`in globalThis.crypto)?null:await this.fetchJwk(r.kid,t?.keys?{keys:t.keys}:t?.jwks);if(!c){let{error:e}=await this.getUser(n);if(e)throw e;return{data:{claims:i,header:r,signature:a},error:null}}let l=Qr(r.alg),u=await crypto.subtle.importKey(`jwk`,c,l,!0,[`verify`]);if(!await crypto.subtle.verify(l,u,a,Cr(`${o}.${s}`)))throw new fr(`Invalid JWT signature`);return{data:{claims:i,header:r,signature:a},error:null}}catch(e){if(P(e))return this._returnResult({data:null,error:e});throw e}}async signInWithPasskey(e){try{if(!Ii())return this._returnResult({data:null,error:new F(`Browser does not support WebAuthn`,null)});let{data:t,error:n}=await this._startPasskeyAuthentication({options:{captchaToken:e?.options?.captchaToken}});if(n||!t)return this._returnResult({data:null,error:n});let{data:r,error:i}=await Ri({publicKey:Mi(t.options),signal:e?.options?.signal??Ai.createNewAbortSignal(),mediation:e?.options?.mediation});if(i||!r)return this._returnResult({data:null,error:i??new F(`WebAuthn ceremony failed`,null)});let a=Pi(r);return this._verifyPasskeyAuthentication({challengeId:t.challenge_id,credential:a})}catch(e){if(P(e))return this._returnResult({data:null,error:e});throw e}}async registerPasskey(e){try{if(!Ii())return this._returnResult({data:null,error:new F(`Browser does not support WebAuthn`,null)});let{data:t,error:n}=await this._startPasskeyRegistration();if(n||!t)return this._returnResult({data:null,error:n});let{data:r,error:i}=await Li({publicKey:ji(t.options),signal:e?.options?.signal??Ai.createNewAbortSignal()});if(i||!r)return this._returnResult({data:null,error:i??new F(`WebAuthn ceremony failed`,null)});let a=Ni(r);return this._verifyPasskeyRegistration({challengeId:t.challenge_id,credential:a})}catch(e){if(P(e))return this._returnResult({data:null,error:e});throw e}}async _startPasskeyRegistration(){try{return await this._useSession(async e=>{let{data:{session:t},error:n}=e;if(n)return this._returnResult({data:null,error:n});if(!t)return this._returnResult({data:null,error:new L});let{data:r,error:i}=await J(this.fetch,`POST`,`${this.url}/passkeys/registration/options`,{headers:this.headers,jwt:t.access_token,body:{}});return i?this._returnResult({data:null,error:i}):this._returnResult({data:r,error:null})})}catch(e){if(P(e))return this._returnResult({data:null,error:e});throw e}}async _verifyPasskeyRegistration(e){try{return await this._useSession(async t=>{let{data:{session:n},error:r}=t;if(r)return this._returnResult({data:null,error:r});if(!n)return this._returnResult({data:null,error:new L});let{data:i,error:a}=await J(this.fetch,`POST`,`${this.url}/passkeys/registration/verify`,{headers:this.headers,jwt:n.access_token,body:{challenge_id:e.challengeId,credential:e.credential}});return a?this._returnResult({data:null,error:a}):this._returnResult({data:i,error:null})})}catch(e){if(P(e))return this._returnResult({data:null,error:e});throw e}}async _startPasskeyAuthentication(e){try{let{data:t,error:n}=await J(this.fetch,`POST`,`${this.url}/passkeys/authentication/options`,{headers:this.headers,body:{gotrue_meta_security:{captcha_token:e?.options?.captchaToken}}});return n?this._returnResult({data:null,error:n}):this._returnResult({data:t,error:null})}catch(e){if(P(e))return this._returnResult({data:null,error:e});throw e}}async _verifyPasskeyAuthentication(e){try{let{data:t,error:n}=await J(this.fetch,`POST`,`${this.url}/passkeys/authentication/verify`,{headers:this.headers,body:{challenge_id:e.challengeId,credential:e.credential},xform:Y});return n?this._returnResult({data:null,error:n}):(t.session&&(await this._saveSession(t.session),await this._notifyAllSubscribers(`SIGNED_IN`,t.session)),this._returnResult({data:t,error:null}))}catch(e){if(P(e))return this._returnResult({data:null,error:e});throw e}}async _listPasskeys(){try{return await this._useSession(async e=>{let{data:{session:t},error:n}=e;if(n)return this._returnResult({data:null,error:n});if(!t)return this._returnResult({data:null,error:new L});let{data:r,error:i}=await J(this.fetch,`GET`,`${this.url}/passkeys`,{headers:this.headers,jwt:t.access_token,xform:e=>({data:e,error:null})});return i?this._returnResult({data:null,error:i}):this._returnResult({data:r,error:null})})}catch(e){if(P(e))return this._returnResult({data:null,error:e});throw e}}async _updatePasskey(e){try{return await this._useSession(async t=>{let{data:{session:n},error:r}=t;if(r)return this._returnResult({data:null,error:r});if(!n)return this._returnResult({data:null,error:new L});let{data:i,error:a}=await J(this.fetch,`PATCH`,`${this.url}/passkeys/${e.passkeyId}`,{headers:this.headers,jwt:n.access_token,body:{friendly_name:e.friendlyName}});return a?this._returnResult({data:null,error:a}):this._returnResult({data:i,error:null})})}catch(e){if(P(e))return this._returnResult({data:null,error:e});throw e}}async _deletePasskey(e){try{return await this._useSession(async t=>{let{data:{session:n},error:r}=t;if(r)return this._returnResult({data:null,error:r});if(!n)return this._returnResult({data:null,error:new L});let{error:i}=await J(this.fetch,`DELETE`,`${this.url}/passkeys/${e.passkeyId}`,{headers:this.headers,jwt:n.access_token,noResolveJson:!0});return i?this._returnResult({data:null,error:i}):this._returnResult({data:null,error:null})})}catch(e){if(P(e))return this._returnResult({data:null,error:e});throw e}}};qi.nextInstanceID={};var Ji=qi,Yi=mi,Xi=Ji,Zi=class extends Xi{constructor(e){super(e)}},Qi=class{constructor(e,t,n){this.supabaseUrl=e,this.supabaseKey=t;let r=Un(e);if(!t)throw Error(`supabaseKey is required.`);Nn(t),Vn(n),this.realtimeUrl=new URL(`realtime/v1`,r),this.realtimeUrl.protocol=this.realtimeUrl.protocol.replace(`http`,`ws`),this.authUrl=new URL(`auth/v1`,r),this.storageUrl=new URL(`storage/v1`,r),this.functionsUrl=new URL(`functions/v1`,r);let i=`sb-${r.hostname.split(`.`)[0]}-auth-token`,a={db:yn,realtime:xn,auth:{...bn,storageKey:i},global:vn,tracePropagation:Sn},o=Hn(n??{},a);this.settings=o,this.storageKey=o.auth.storageKey??``,this.headers=o.global.headers??{},o.accessToken?(this.accessToken=o.accessToken,this.auth=new Proxy({},{get:(e,t)=>{throw Error(`@supabase/supabase-js: Supabase Client is configured with the accessToken option, accessing supabase.auth.${String(t)} is not possible`)}})):this.auth=this._initSupabaseAuthClient(o.auth??{},this.headers,o.global.fetch),this.fetch=Pn(t,e,this._getSessionToken.bind(this),o.global.fetch,o.tracePropagation),this.functionsFetch=Pn(t,e,this._getSessionToken.bind(this),o.global.fetch,o.tracePropagation,{omitApiKeyAsBearer:!0}),this.realtime=this._initRealtimeClient({headers:this.headers,accessToken:this._getAccessToken.bind(this),fetch:this.fetch,...o.realtime}),this.accessToken&&Promise.resolve(this.accessToken()).then(e=>this.realtime.setAuth(e)).catch(e=>console.warn(`Failed to set initial Realtime auth token:`,e)),this.rest=new fe(new URL(`rest/v1`,r).href,{headers:this.headers,schema:o.db.schema,fetch:this.fetch,timeout:o.db.timeout,urlLengthLimit:o.db.urlLengthLimit,retry:o.db.retry}),this.storage=new mn(this.storageUrl.href,this.headers,this.fetch,n?.storage),o.accessToken||this._listenForAuthEvents()}get functions(){return new l(this.functionsUrl.href,{headers:this.headers,customFetch:this.functionsFetch})}from(e){return this.rest.from(e)}schema(e){return this.rest.schema(e)}getOpenApiSpec(){return this.rest.getOpenApiSpec()}rpc(e,t={},n={head:!1,get:!1,count:void 0}){return this.rest.rpc(e,t,n)}channel(e,t={config:{}}){return this.realtime.channel(e,t)}getChannels(){return this.realtime.getChannels()}removeChannel(e){return this.realtime.removeChannel(e)}removeAllChannels(){return this.realtime.removeAllChannels()}async _getSessionToken(){if(this.accessToken)return await this.accessToken();let{data:e}=await this.auth.getSession();return e.session?.access_token??null}async _getAccessToken(){return await this._getSessionToken()??this.supabaseKey}_initSupabaseAuthClient({autoRefreshToken:e,persistSession:t,detectSessionInUrl:n,storage:r,userStorage:i,storageKey:a,flowType:o,lock:s,debug:c,throwOnError:l,experimental:u,lockAcquireTimeout:d,skipAutoInitialize:f},p,m){let h={Authorization:`Bearer ${this.supabaseKey}`,apikey:`${this.supabaseKey}`};return new Zi({url:this.authUrl.href,headers:{...h,...p},storageKey:a,autoRefreshToken:e,persistSession:t,detectSessionInUrl:n,storage:r,userStorage:i,flowType:o,lock:s,debug:c,throwOnError:l,experimental:u,fetch:m,lockAcquireTimeout:d,skipAutoInitialize:f,hasCustomAuthorizationHeader:Object.keys(this.headers).some(e=>e.toLowerCase()===`authorization`)})}_initRealtimeClient(e){return new _t(this.realtimeUrl.href,{...e,params:{apikey:this.supabaseKey,...e?.params}})}_listenForAuthEvents(){return this.auth.onAuthStateChange((e,t)=>{this._handleTokenChanged(e,`CLIENT`,t?.access_token)})}_handleTokenChanged(e,t,n){(e===`TOKEN_REFRESHED`||e===`SIGNED_IN`||e===`INITIAL_SESSION`)&&this.changedAccessToken!==n?(this.changedAccessToken=n,this.realtime.setAuth(n)):e===`SIGNED_OUT`&&(this.realtime.setAuth(),t==`STORAGE`&&this.auth.signOut(),this.changedAccessToken=void 0)}};let $i=(e,t,n)=>new Qi(e,t,n);function ea(){if(typeof window<`u`||globalThis.Deno!==void 0)return!1;let e=globalThis.process;if(!e)return!1;let t=e.version;if(t==null)return!1;let n=t.match(/^v(\d+)\./);return n?parseInt(n[1],10)<=20:!1}return ea()&&console.warn(`⚠️  Node.js 20 and below are deprecated and will no longer be supported in future versions of @supabase/supabase-js. Please upgrade to Node.js 22 or later. For more information, visit: https://github.com/orgs/supabase/discussions/45715`),e.AuthAdminApi=Yi,e.AuthApiError=Zn,e.AuthClient=Xi,e.AuthError=Xn,e.AuthImplicitGrantRedirectError=tr,e.AuthInvalidCredentialsError=er,e.AuthInvalidJwtError=fr,e.AuthInvalidTokenResponseError=R,e.AuthPKCECodeVerifierMissingError=ir,e.AuthPKCEGrantCodeExchangeError=rr,e.AuthRefreshDiscardedError=cr,e.AuthRetryableFetchError=or,e.AuthSessionMissingError=L,e.AuthUnknownError=F,e.AuthWeakPasswordError=ur,e.CustomAuthError=I,Object.defineProperty(e,`FunctionRegion`,{enumerable:!0,get:function(){return c}}),e.FunctionsError=i,e.FunctionsFetchError=a,e.FunctionsHttpError=s,e.FunctionsRelayError=o,e.GoTrueAdminApi=mi,e.GoTrueClient=Ji,e.NavigatorLockAcquireTimeoutError=_i,e.PostgrestError=u,e.REALTIME_CHANNEL_STATES=ut,Object.defineProperty(e,`REALTIME_LISTEN_TYPES`,{enumerable:!0,get:function(){return T}}),Object.defineProperty(e,`REALTIME_POSTGRES_CHANGES_LISTEN_EVENT`,{enumerable:!0,get:function(){return lt}}),Object.defineProperty(e,`REALTIME_PRESENCE_LISTEN_EVENTS`,{enumerable:!0,get:function(){return Xe}}),Object.defineProperty(e,`REALTIME_SUBSCRIBE_STATES`,{enumerable:!0,get:function(){return E}}),e.RealtimeChannel=dt,e.RealtimeClient=_t,e.RealtimePostgresFilterBuilder=st,e.RealtimePresence=Ze,e.SIGN_OUT_SCOPES=pi,e.StorageApiError=Pt,e.SupabaseClient=Qi,e.WebSocketFactory=pe,e.createClient=$i,e.isAuthApiError=Qn,e.isAuthError=P,e.isAuthImplicitGrantRedirectError=nr,e.isAuthPKCECodeVerifierMissingError=ar,e.isAuthRefreshDiscardedError=lr,e.isAuthRetryableFetchError=sr,e.isAuthSessionMissingError=$n,e.isAuthWeakPasswordError=dr,e.lockInternals=Z,e.navigatorLock=yi,e.postgresChangesFilter=ct,e.processLock=xi,e})({});
;
/* ===== dados.js ===== */
/* Saberes que Cultivam — dados fixos do projeto.
   Fonte: Plano de Trabalho do TED assinado com o MDA em 17/07/2026 (Plano de Ação 30879420260055-006262, SEI 55000.010072/2026-02):
   metas, etapas e cronograma físico (é o compromisso que o SEAB/MDA acompanha).
   Plano de Trabalho universal, versão 4 (atualização de 07/10/2026), executado via FUNCERN (contrato 220/2026): orçamento por rubrica (item 14).
   O v4 traz outras janelas de mês por meta (ex.: Meta 1 só em ago/2026); o cronograma do sistema segue o TED de propósito.
   Mudou o plano? Mude aqui e rode os testes: eles conferem que os totais fecham em R$ 400.000,00. */
(function () {
  const G = typeof window !== 'undefined' ? window : globalThis;
  const SQC = (G.SQC = G.SQC || {});

  const METAS = {
    1: 'Diagnóstico territorial e planejamento', 2: 'Implantação das unidades de produção',
    3: 'Capacitação, acompanhamento e segurança', 4: 'Produção e monitoramento do uso',
    5: 'Avaliação e validação participativa', 6: 'Comunicação, gestão e prestação de contas'
  };
  /* q = quantidade prevista, v = valor unitário; ini/fim = mês de início e fim no cronograma físico-financeiro */
  const ETAPAS = [
    { id: '1.1', m: 1, nome: 'Diagnóstico socioeconômico, produtivo e tecnológico', un: 'relatório técnico', q: 1, v: 35000, ini: '2026-07', fim: '2027-07' },
    { id: '2.1', m: 2, nome: 'Estruturação física e operacional das unidades', un: 'unidade em funcionamento', q: 2, v: 82500, ini: '2026-08', fim: '2027-01' },
    { id: '3.1', m: 3, nome: 'Materiais didáticos e instrumentos de apoio', un: 'material didático', q: 1, v: 10000, ini: '2026-10', fim: '2027-05' },
    { id: '3.2', m: 3, nome: 'Ações de capacitação e formação', un: 'capacitação', q: 5, v: 5000, ini: '2026-11', fim: '2027-04' },
    { id: '3.3', m: 3, nome: 'Orientação técnica e kits de apoio', un: 'kit distribuído', q: 30, v: 1000, ini: '2026-12', fim: '2027-05' },
    { id: '4.1', m: 4, nome: 'Produção, distribuição e acompanhamento do uso', un: 'unidade produtiva', q: 30, v: 2000, ini: '2026-07', fim: '2027-06' },
    { id: '5.1', m: 5, nome: 'Dias de campo e validação participativa', un: 'dia de campo', q: 4, v: 2500, ini: '2026-07', fim: '2027-07' },
    { id: '5.2', m: 5, nome: 'Sistematização e avaliação dos resultados', un: 'relatório de avaliação', q: 1, v: 5000, ini: '2026-07', fim: '2027-07' },
    { id: '6.1', m: 6, nome: 'Materiais e ações de comunicação', un: 'produto de comunicação', q: 10, v: 1000, ini: '2026-07', fim: '2027-07' },
    { id: '6.2', m: 6, nome: 'Monitoramento e prestação de contas', un: 'relatório', q: 1, v: 10000, ini: '2026-07', fim: '2027-07' },
    { id: '6.3', m: 6, nome: 'Gestão administrativa e financeira (FUNCERN)', un: 'contrato com a fundação', q: 1, v: 40000, ini: '2026-07', fim: '2027-07' }
  ];
  /* etapas cujo "realizado" o sistema conta sozinho (as demais contam pelos registros da aba Entregas) */
  const ETAPAS_AUTOMATICAS = ['2.1', '3.2', '3.3', '4.1', '5.1'];

  /* Rubricas do orçamento resumido do plano universal (item 14). É por rubrica que a FUNCERN controla o gasto.
     Rubricas com valor zero no plano (CLT, pessoa física, ressarcimento, outros custos) ficam de fora. */
  const RUBRICAS = [
    { id: 'bolsa_pesquisador', n: 1, nome: 'Bolsas de pesquisador', v: 46000 },
    { id: 'bolsa_estudante', n: 2, nome: 'Bolsas de estudante', v: 14400 },
    { id: 'diarias', n: 4, nome: 'Diárias', v: 9600 },
    { id: 'ajuda_custo', n: 5, nome: 'Ajuda de custo (pessoa física)', v: 10000 },
    { id: 'passagens', n: 6, nome: 'Passagens e locomoção', v: 39000 },
    { id: 'servicos_pj', n: 7, nome: 'Serviços de terceiros (pessoa jurídica)', v: 170000 },
    { id: 'consumo', n: 9, nome: 'Material de consumo', v: 61000 },
    { id: 'equipamentos', n: 10, nome: 'Máquinas e equipamentos', v: 10000 },
    { id: 'doa', n: 13, nome: 'Despesas operacionais e administrativas (FUNCERN)', v: 40000 }
  ];

  /* tipo de bioinsumo: [prefixo do código do lote, dias até ficar pronto, medida] */
  const TIPOS = {
    'Composto orgânico': ['CMP', 90, 'kg'], 'Biofertilizante líquido': ['BIO', 30, 'L'], 'Húmus de minhoca': ['HUM', 60, 'kg'],
    'Bokashi': ['BOK', 15, 'kg'], 'Microrganismos eficientes (EM)': ['EM', 15, 'L'], 'Microrganismo isolado': ['ISO', 7, 'L'], 'Outro': ['OUT', 30, 'kg']
  };
  /* passos da implantação de uma unidade de produção (colunas booleanas da tabela unidades) */
  const CHECK = [['local_ok', 'Local definido'], ['parceiro_ok', 'Parceiro institucional definido'], ['termo', 'Termo de doação ou cessão formalizado'],
    ['itens_ok', 'Lista de itens fechada'], ['orcamento', 'Orçamentos enviados à FUNCERN'], ['entregue', 'Itens entregues'],
    ['montada', 'Estrutura montada'], ['funcionando', 'Em funcionamento']];


  /* Plano de desembolso (planilha "Plano de desembolso - Saberes que Cultivam", atualização de 05/10/2026), ajustado ao plano universal v4 (07/10/2026):
     quanto cada item do orçamento prevê gastar em cada mês, de ago/2026 a jul/2027. É a linha "previsto" do gráfico de ritmo do gasto.
     Itens que o v4 mudou e que a planilha de 05/10 ainda não tinha (i02, i03, i04, i05, i11, i14 e o i16 novo): bolsas pelo período da equipe
     no v4 (item 13); os demais com o mesmo formato mensal da planilha, no valor novo. Quando a FUNCERN mandar a planilha nova, troque por ela.
     Mudou a planilha? Mude aqui: os testes conferem que cada rubrica e o total continuam batendo com o plano. */
  /* id do item: é o que a despesa guarda no campo "item". Não reaproveite nem troque um id já usado; item novo recebe o próximo número. */
  const DESEMBOLSO = { inicio: '2026-08', itens: [
    { id: 'i01', rubrica: 'bolsa_pesquisador', nome: 'Bolsa - coordenador do projeto', m: [0, 2181.82, 2181.82, 2181.82, 2181.82, 2181.82, 2181.82, 2181.82, 2181.82, 2181.82, 2181.82, 2181.8] },
    { id: 'i02', rubrica: 'bolsa_pesquisador', nome: 'Bolsa - auxiliar administrativo', m: [0, 0, 1400, 1400, 1400, 1400, 1400, 1400, 1400, 1400, 1400, 1400] },   // v4: 10 × R$ 1.400, out/2026 a jul/2027
    { id: 'i03', rubrica: 'bolsa_estudante', nome: 'Bolsa - apoio técnico (discente)', m: [0, 0, 0, 0, 1800, 1800, 1800, 1800, 1800, 1800, 1800, 1800] },   // v4: 3 discentes × 8 × R$ 600, dez/2026 a jul/2027
    { id: 'i04', rubrica: 'diarias', nome: 'Diárias', m: [0, 0, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 800, 800] },   // v4: 24 × R$ 400
    { id: 'i05', rubrica: 'ajuda_custo', nome: 'Ajuda de custo', m: [0, 0, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000] },   // v4: 4 dias de campo × R$ 2.500 (Meta 5)
    { id: 'i06', rubrica: 'passagens', nome: 'Passagens', m: [0, 0, 3500, 3500, 3500, 0, 0, 3500, 3500, 0, 3500, 0] },
    { id: 'i07', rubrica: 'passagens', nome: 'Locação de veículos', m: [0, 0, 1800, 1800, 1800, 1800, 1800, 1800, 1800, 1800, 1800, 1800] },
    { id: 'i08', rubrica: 'servicos_pj', nome: 'Serviços gráficos e comunicação visual', m: [0, 0, 0, 0, 0, 0, 0, 2000, 2000, 2000, 2000, 2000] },
    { id: 'i09', rubrica: 'servicos_pj', nome: 'Produção de material didático', m: [0, 0, 0, 0, 0, 0, 0, 4000, 3000, 3000, 0, 0] },
    { id: 'i10', rubrica: 'servicos_pj', nome: 'Implantação das Unidades de Produção de Bioinsumos', m: [0, 0, 75000, 0, 0, 0, 0, 75000, 0, 0, 0, 0] },
    { id: 'i11', rubrica: 'consumo', nome: 'Combustível', m: [0, 0, 900, 900, 900, 900, 900, 900, 900, 900, 900, 900] },   // v4: R$ 9.000
    { id: 'i12', rubrica: 'consumo', nome: 'Kits para produção de bioinsumos', m: [0, 0, 15000, 0, 0, 0, 0, 15000, 0, 0, 0, 0] },
    { id: 'i13', rubrica: 'consumo', nome: 'Insumos para produção de bioinsumos', m: [0, 0, 11000, 0, 0, 0, 0, 11000, 0, 0, 0, 0] },
    { id: 'i14', rubrica: 'equipamentos', nome: 'Material diverso', m: [0, 0, 0, 0, 0, 0, 0, 10000, 0, 0, 0, 0] },   // v4: R$ 10.000
    { id: 'i15', rubrica: 'doa', nome: 'DOA - FUNCERN', m: [20000, 0, 0, 0, 0, 0, 0, 20000, 0, 0, 0, 0] },
    { id: 'i16', rubrica: 'bolsa_pesquisador', nome: 'Bolsa - formador(a)', m: [0, 0, 0, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000, 0] }   // novo no v4: 80 atividades × R$ 100, nov/2026 a jun/2027 (Meta 3)
  ] };

  SQC.dados = {
    NOME: 'Saberes que Cultivam',
    NOME_COMPLETO: 'Saberes que Cultivam: Bioinsumos, Agroecologia e Fortalecimento da Agricultura Familiar na Região Nordeste',
    IDENT: 'TED MDA/IFRN · Plano de Ação 30879420260055-006262 · Processo SEI 55000.010072/2026-02 · Execução: IFRN Campus Apodi, via FUNCERN (contrato 220/2026)',
    METAS, ETAPAS, ETAPAS_AUTOMATICAS, RUBRICAS, TIPOS, CHECK, DESEMBOLSO,
    VIGENCIA: { ini: '2026-08-01', fim: '2027-07-30' },
    TOTAL: 400000,
    /* parcelas do TED repassadas à FUNCERN. Chegou parcela nova? Acrescente aqui. */
    PARCELAS: [{ valor: 200000, data: '2026-09-22', doc: '2026NS001323', recebida: true }, { valor: 200000, previsao: '2027-03', recebida: false }],
    TETO_UNIDADE: 82500,
    TERRITORIOS: ['Potengi/RN', 'Maciço de Baturité/CE', 'Outro'],
    /* janela do cronograma na tela: jul/2026 a jul/2027 (13 meses) */
    G0: '2026-07-01', G1: '2027-08-01',
    TABELAS: ['unidades', 'itens', 'lotes', 'agricultores', 'distribuicoes', 'visitas', 'eventos', 'entregas', 'despesas', 'pessoas', 'membros', 'presencas', 'fotos']
  };
})();
;
/* ===== geo.js ===== */
/* Saberes que Cultivam — mapa: contorno do Ceará e do Rio Grande do Norte e ponto central de cada município dos dois estados.
   GERADO a partir de dados públicos (não edite à mão):
     contornos: malha do IBGE, pelo repositório giuliano-macedo/geodata-br-states (simplificada para ~1 km);
     municípios: kelvins/municipios-brasileiros (latitude e longitude da sede, 184 do CE e 167 do RN).
   uf.XX.r = anel [longitude, latitude]; uf.XX.b = [oeste, sul, leste, norte]; mun["nome sem acento/UF"] = [longitude, latitude]. */
(function () { const G = typeof window !== 'undefined' ? window : globalThis; (G.SQC = G.SQC || {}).GEO = {"uf":{"CE":{"r":[[[-37.25,-4.83],[-37.64,-4.93],[-37.68,-5.05],[-37.72,-5.07],[-37.76,-5.14],[-37.79,-5.21],[-37.78,-5.29],[-37.85,-5.34],[-37.9,-5.5],[-37.93,-5.5],[-37.95,-5.53],[-37.99,-5.56],[-38.03,-5.64],[-38.08,-5.67],[-38.09,-5.73],[-38.05,-5.73],[-38.11,-5.82],[-38.12,-5.89],[-38.16,-5.95],[-38.24,-6.0],[-38.26,-6.05],[-38.3,-6.09],[-38.35,-6.07],[-38.37,-6.09],[-38.38,-6.05],[-38.45,-6.09],[-38.5,-6.19],[-38.53,-6.19],[-38.53,-6.24],[-38.58,-6.28],[-38.57,-6.3],[-38.58,-6.33],[-38.56,-6.36],[-38.6,-6.39],[-38.57,-6.4],[-38.53,-6.39],[-38.52,-6.41],[-38.61,-6.51],[-38.64,-6.58],[-38.63,-6.6],[-38.66,-6.63],[-38.65,-6.66],[-38.67,-6.7],[-38.65,-6.76],[-38.61,-6.78],[-38.68,-6.83],[-38.68,-6.86],[-38.77,-6.91],[-38.77,-6.95],[-38.74,-6.98],[-38.77,-6.99],[-38.67,-7.05],[-38.68,-7.07],[-38.66,-7.09],[-38.69,-7.19],[-38.62,-7.19],[-38.6,-7.25],[-38.55,-7.24],[-38.53,-7.29],[-38.6,-7.41],[-38.58,-7.43],[-38.6,-7.46],[-38.64,-7.46],[-38.63,-7.49],[-38.65,-7.52],[-38.66,-7.57],[-38.71,-7.59],[-38.74,-7.66],[-38.82,-7.66],[-38.83,-7.72],[-38.87,-7.71],[-38.88,-7.75],[-38.94,-7.76],[-38.96,-7.84],[-39.0,-7.84],[-39.02,-7.81],[-39.05,-7.82],[-39.09,-7.86],[-39.1,-7.78],[-39.13,-7.73],[-39.21,-7.69],[-39.25,-7.7],[-39.27,-7.66],[-39.31,-7.67],[-39.37,-7.61],[-39.42,-7.6],[-39.43,-7.57],[-39.47,-7.58],[-39.49,-7.54],[-39.46,-7.5],[-39.46,-7.47],[-39.5,-7.46],[-39.55,-7.48],[-39.57,-7.43],[-39.63,-7.43],[-39.65,-7.37],[-39.72,-7.33],[-39.85,-7.33],[-40.09,-7.38],[-40.2,-7.36],[-40.26,-7.3],[-40.32,-7.3],[-40.39,-7.37],[-40.43,-7.37],[-40.52,-7.32],[-40.49,-7.12],[-40.43,-7.03],[-40.44,-7.02],[-40.41,-7.01],[-40.43,-6.99],[-40.43,-6.86],[-40.37,-6.8],[-40.43,-6.81],[-40.47,-6.73],[-40.6,-6.72],[-40.65,-6.68],[-40.73,-6.66],[-40.72,-6.62],[-40.79,-6.51],[-40.81,-6.39],[-40.78,-6.33],[-40.81,-6.29],[-40.85,-6.22],[-40.85,-6.14],[-40.87,-6.06],[-40.91,-6.04],[-40.87,-5.97],[-40.9,-5.9],[-40.91,-5.73],[-40.94,-5.67],[-40.91,-5.66],[-40.9,-5.61],[-40.93,-5.55],[-40.92,-5.47],[-40.94,-5.42],[-40.91,-5.41],[-40.94,-5.37],[-40.91,-5.31],[-40.93,-5.29],[-40.91,-5.27],[-40.94,-5.24],[-40.92,-5.23],[-40.93,-5.18],[-40.98,-5.15],[-41.03,-5.09],[-41.05,-5.1],[-41.08,-5.09],[-41.1,-5.05],[-41.13,-5.05],[-41.12,-5.01],[-41.19,-4.94],[-41.22,-4.94],[-41.25,-4.87],[-41.21,-4.78],[-41.25,-4.76],[-41.17,-4.67],[-41.23,-4.62],[-41.22,-4.58],[-41.24,-4.57],[-41.22,-4.57],[-41.19,-4.52],[-41.16,-4.38],[-41.12,-4.33],[-41.14,-4.23],[-41.09,-4.17],[-41.12,-4.17],[-41.14,-4.12],[-41.11,-4.04],[-41.18,-4.02],[-41.26,-4.03],[-41.22,-3.94],[-41.28,-3.83],[-41.3,-3.83],[-41.25,-3.78],[-41.26,-3.73],[-41.24,-3.71],[-41.34,-3.68],[-41.33,-3.62],[-41.37,-3.57],[-41.34,-3.55],[-41.32,-3.5],[-41.3,-3.49],[-41.33,-3.49],[-41.35,-3.41],[-41.39,-3.41],[-41.4,-3.36],[-41.42,-3.37],[-41.32,-3.15],[-41.26,-3.09],[-41.25,-3.03],[-41.27,-2.97],[-41.32,-2.95],[-41.32,-2.92],[-41.27,-2.89],[-41.1,-2.9],[-40.86,-2.86],[-40.84,-2.88],[-40.76,-2.85],[-40.59,-2.84],[-40.5,-2.78],[-40.43,-2.81],[-40.26,-2.81],[-40.19,-2.81],[-40.15,-2.84],[-40.13,-2.83],[-40.03,-2.83],[-39.89,-2.88],[-39.74,-2.99],[-39.62,-3.03],[-39.6,-3.07],[-39.46,-3.14],[-39.25,-3.22],[-39.17,-3.32],[-39.11,-3.35],[-39.08,-3.4],[-39.04,-3.41],[-38.99,-3.4],[-38.91,-3.5],[-38.85,-3.54],[-38.81,-3.54],[-38.76,-3.6],[-38.67,-3.67],[-38.5,-3.73],[-38.48,-3.72],[-38.48,-3.7],[-38.36,-3.88],[-38.3,-3.94],[-38.27,-3.95],[-38.12,-4.15],[-38.01,-4.25],[-37.86,-4.37],[-37.77,-4.4],[-37.73,-4.5],[-37.6,-4.62],[-37.54,-4.64],[-37.5,-4.63],[-37.33,-4.7],[-37.29,-4.74],[-37.25,-4.83]]],"b":[-41.42,-7.86,-37.25,-2.78]},"RN":{"r":[[[-34.97,-6.49],[-35.06,-6.53],[-35.1,-6.5],[-35.17,-6.56],[-35.22,-6.52],[-35.27,-6.54],[-35.33,-6.54],[-35.4,-6.49],[-35.53,-6.48],[-35.56,-6.49],[-35.6,-6.46],[-35.66,-6.45],[-35.77,-6.48],[-35.98,-6.49],[-36.08,-6.41],[-36.11,-6.43],[-36.25,-6.44],[-36.25,-6.4],[-36.3,-6.38],[-36.28,-6.35],[-36.3,-6.29],[-36.31,-6.28],[-36.36,-6.31],[-36.39,-6.29],[-36.43,-6.36],[-36.5,-6.36],[-36.53,-6.45],[-36.53,-6.5],[-36.44,-6.56],[-36.44,-6.63],[-36.46,-6.63],[-36.52,-6.6],[-36.56,-6.71],[-36.5,-6.75],[-36.51,-6.81],[-36.57,-6.85],[-36.57,-6.87],[-36.61,-6.94],[-36.69,-6.93],[-36.72,-6.98],[-36.77,-6.94],[-36.73,-6.84],[-36.77,-6.84],[-36.77,-6.79],[-36.84,-6.73],[-36.96,-6.79],[-36.98,-6.72],[-37.0,-6.71],[-37.06,-6.75],[-37.13,-6.77],[-37.19,-6.83],[-37.23,-6.82],[-37.27,-6.77],[-37.26,-6.73],[-37.29,-6.71],[-37.28,-6.69],[-37.48,-6.71],[-37.47,-6.66],[-37.48,-6.55],[-37.4,-6.51],[-37.38,-6.44],[-37.4,-6.4],[-37.36,-6.32],[-37.32,-6.28],[-37.27,-6.28],[-37.25,-6.23],[-37.17,-6.17],[-37.17,-6.05],[-37.25,-6.03],[-37.27,-6.06],[-37.3,-6.05],[-37.38,-6.09],[-37.39,-6.11],[-37.45,-6.11],[-37.46,-6.15],[-37.54,-6.17],[-37.57,-6.16],[-37.65,-6.19],[-37.71,-6.18],[-37.74,-6.19],[-37.78,-6.23],[-37.76,-6.29],[-37.81,-6.29],[-37.84,-6.33],[-37.84,-6.36],[-37.86,-6.37],[-37.89,-6.36],[-37.89,-6.4],[-37.93,-6.42],[-37.95,-6.42],[-37.96,-6.4],[-37.98,-6.43],[-38.01,-6.43],[-38.03,-6.47],[-38.05,-6.44],[-38.12,-6.52],[-38.15,-6.49],[-38.19,-6.5],[-38.24,-6.48],[-38.29,-6.51],[-38.33,-6.46],[-38.37,-6.46],[-38.4,-6.41],[-38.49,-6.4],[-38.49,-6.37],[-38.46,-6.33],[-38.51,-6.36],[-38.58,-6.35],[-38.57,-6.3],[-38.58,-6.28],[-38.53,-6.24],[-38.53,-6.19],[-38.5,-6.19],[-38.45,-6.09],[-38.38,-6.05],[-38.37,-6.09],[-38.35,-6.07],[-38.3,-6.09],[-38.26,-6.05],[-38.24,-6.0],[-38.16,-5.95],[-38.12,-5.89],[-38.11,-5.82],[-38.05,-5.73],[-38.09,-5.73],[-38.08,-5.67],[-38.03,-5.64],[-37.99,-5.56],[-37.95,-5.53],[-37.93,-5.5],[-37.9,-5.5],[-37.85,-5.34],[-37.78,-5.29],[-37.79,-5.21],[-37.76,-5.14],[-37.72,-5.07],[-37.68,-5.05],[-37.64,-4.93],[-37.25,-4.83],[-37.17,-4.93],[-37.1,-4.92],[-37.04,-4.95],[-36.96,-4.92],[-36.92,-4.95],[-36.88,-4.95],[-36.8,-5.04],[-36.72,-5.08],[-36.7,-5.07],[-36.69,-5.09],[-36.62,-5.08],[-36.56,-5.08],[-36.5,-5.06],[-36.34,-5.08],[-36.31,-5.1],[-36.29,-5.09],[-36.14,-5.09],[-35.98,-5.04],[-35.64,-5.12],[-35.62,-5.11],[-35.49,-5.16],[-35.4,-5.25],[-35.35,-5.36],[-35.32,-5.38],[-35.29,-5.46],[-35.26,-5.48],[-35.22,-5.67],[-35.19,-5.7],[-35.2,-5.74],[-35.18,-5.87],[-35.15,-5.88],[-35.15,-5.95],[-35.11,-6.01],[-35.09,-6.18],[-35.07,-6.22],[-35.04,-6.24],[-35.03,-6.34],[-34.99,-6.37],[-34.97,-6.49]]],"b":[-38.58,-6.98,-34.97,-4.83]}},"mun":{"abaiara/CE":[-39.04,-7.35],"acarape/CE":[-38.71,-4.22],"acarau/CE":[-40.12,-2.89],"acari/RN":[-36.63,-6.43],"acopiara/CE":[-39.45,-6.09],"acu/RN":[-36.91,-5.58],"afonso bezerra/RN":[-36.51,-5.49],"agua nova/RN":[-38.29,-6.2],"aiuaba/CE":[-40.12,-6.57],"alcantaras/CE":[-40.55,-3.59],"alexandria/RN":[-38.01,-6.41],"almino afonso/RN":[-37.76,-6.15],"altaneira/CE":[-39.74,-7.0],"alto do rodrigues/RN":[-36.75,-5.28],"alto santo/CE":[-38.27,-5.51],"amontada/CE":[-39.83,-3.36],"angicos/RN":[-36.61,-5.66],"antonina do norte/CE":[-39.99,-6.77],"antonio martins/RN":[-37.88,-6.21],"apodi/RN":[-37.79,-5.65],"apuiares/CE":[-39.44,-3.95],"aquiraz/CE":[-38.39,-3.9],"aracati/CE":[-37.77,-4.56],"aracoiaba/CE":[-38.81,-4.37],"ararenda/CE":[-40.83,-4.75],"araripe/CE":[-40.14,-7.21],"aratuba/CE":[-39.05,-4.41],"areia branca/RN":[-37.13,-4.95],"ares/RN":[-35.16,-6.19],"arneiroz/CE":[-40.17,-6.32],"assare/CE":[-39.87,-6.87],"augusto severo (campo grande)/RN":[-37.31,-5.86],"aurora/CE":[-38.97,-6.93],"baia formosa/RN":[-35.0,-6.37],"baixio/CE":[-38.71,-6.72],"banabuiu/CE":[-38.91,-5.3],"barauna/RN":[-37.61,-5.07],"barbalha/CE":[-39.3,-7.3],"barcelona/RN":[-35.92,-5.94],"barreira/CE":[-38.64,-4.29],"barro/CE":[-38.77,-7.17],"barroquinha/CE":[-41.14,-3.02],"baturite/CE":[-38.88,-4.33],"beberibe/CE":[-38.13,-4.18],"bela cruz/CE":[-40.17,-3.05],"bento fernandes/RN":[-35.81,-5.7],"boa viagem/CE":[-39.73,-5.11],"bodo/RN":[-36.42,-5.98],"bom jesus/RN":[-35.58,-5.99],"brejinho/RN":[-35.36,-6.19],"brejo santo/CE":[-38.98,-7.48],"caicara do norte/RN":[-36.07,-5.07],"caicara do rio do vento/RN":[-35.99,-5.77],"caico/RN":[-37.11,-6.45],"camocim/CE":[-40.85,-2.9],"campo redondo/RN":[-36.19,-6.24],"campos sales/CE":[-40.37,-7.07],"canguaretama/RN":[-35.13,-6.37],"caninde/CE":[-39.32,-4.35],"capistrano/CE":[-38.9,-4.46],"caraubas/RN":[-37.56,-5.78],"caridade/CE":[-39.19,-4.23],"carire/CE":[-40.48,-3.95],"caririacu/CE":[-39.28,-7.03],"carius/CE":[-39.49,-6.52],"carnauba dos dantas/RN":[-36.59,-6.55],"carnaubais/RN":[-36.83,-5.34],"carnaubal/CE":[-40.94,-4.16],"cascavel/CE":[-38.24,-4.13],"catarina/CE":[-39.87,-6.12],"catunda/CE":[-40.2,-4.64],"caucaia/CE":[-38.66,-3.73],"ceara mirim/RN":[-35.42,-5.64],"cedro/CE":[-39.06,-6.6],"cerro cora/RN":[-36.35,-6.04],"chaval/CE":[-41.24,-3.04],"choro/CE":[-39.13,-4.84],"chorozinho/CE":[-38.5,-4.29],"coreau/CE":[-40.66,-3.54],"coronel ezequiel/RN":[-36.22,-6.37],"coronel joao pessoa/RN":[-38.44,-6.25],"crateus/CE":[-40.65,-5.17],"crato/CE":[-39.41,-7.22],"croata/CE":[-40.9,-4.4],"cruz/CE":[-40.18,-2.92],"cruzeta/RN":[-36.78,-6.41],"currais novos/RN":[-36.51,-6.25],"deputado irapuan pinheiro/CE":[-39.26,-5.91],"doutor severiano/RN":[-38.38,-6.08],"encanto/RN":[-38.3,-6.11],"equador/RN":[-36.72,-6.94],"erere/CE":[-38.35,-6.03],"espirito santo/RN":[-35.31,-6.34],"eusebio/CE":[-38.46,-3.89],"extremoz/RN":[-35.3,-5.7],"farias brito/CE":[-39.57,-6.92],"felipe guerra/RN":[-37.69,-5.59],"fernando pedroza/RN":[-36.53,-5.69],"florania/RN":[-36.82,-6.12],"forquilha/CE":[-40.26,-3.8],"fortaleza/CE":[-38.54,-3.72],"fortim/CE":[-37.8,-4.45],"francisco dantas/RN":[-38.12,-6.07],"frecheirinha/CE":[-40.82,-3.76],"frutuoso gomes/RN":[-37.84,-6.16],"galinhos/RN":[-36.28,-5.09],"general sampaio/CE":[-39.45,-4.04],"goianinha/RN":[-35.19,-6.26],"governador dix sept rosado/RN":[-37.52,-5.45],"graca/CE":[-40.75,-4.04],"granja/CE":[-40.84,-3.13],"granjeiro/CE":[-39.21,-6.88],"groairas/CE":[-40.39,-3.92],"grossos/RN":[-37.16,-4.98],"guaiuba/CE":[-38.64,-4.04],"guamare/RN":[-36.32,-5.11],"guaraciaba do norte/CE":[-40.75,-4.16],"guaramiranga/CE":[-38.93,-4.26],"hidrolandia/CE":[-40.41,-4.41],"horizonte/CE":[-38.47,-4.12],"ibaretama/CE":[-38.75,-4.8],"ibiapina/CE":[-40.89,-3.92],"ibicuitinga/CE":[-38.64,-4.97],"icapui/CE":[-37.35,-4.71],"ico/CE":[-38.86,-6.4],"ielmo marinho/RN":[-35.55,-5.82],"iguatu/CE":[-39.29,-6.36],"independencia/CE":[-40.31,-5.39],"ipanguacu/RN":[-36.85,-5.49],"ipaporanga/CE":[-40.75,-4.9],"ipaumirim/CE":[-38.72,-6.78],"ipu/CE":[-40.71,-4.32],"ipueira/RN":[-37.2,-6.81],"ipueiras/CE":[-40.71,-4.54],"iracema/CE":[-38.29,-5.81],"iraucuba/CE":[-39.78,-3.75],"itaicaba/CE":[-37.83,-4.67],"itaitinga/CE":[-38.53,-3.97],"itaja/RN":[-36.87,-5.64],"itapaje/CE":[-39.59,-3.68],"itapipoca/CE":[-39.58,-3.5],"itapiuna/CE":[-38.93,-4.56],"itarema/CE":[-39.92,-2.92],"itatira/CE":[-39.62,-4.53],"itau/RN":[-37.99,-5.84],"jacana/RN":[-36.2,-6.42],"jaguaretama/CE":[-38.76,-5.61],"jaguaribara/CE":[-38.54,-5.68],"jaguaribe/CE":[-38.62,-5.9],"jaguaruana/CE":[-37.78,-4.83],"jandaira/RN":[-36.13,-5.35],"janduis/RN":[-37.4,-6.01],"januario cicco (boa saude)/RN":[-35.62,-6.17],"japi/RN":[-35.93,-6.47],"jardim/CE":[-39.28,-7.58],"jardim de angicos/RN":[-35.97,-5.65],"jardim de piranhas/RN":[-37.35,-6.38],"jardim do serido/RN":[-36.77,-6.58],"jati/CE":[-39.0,-7.68],"jijoca de jericoacoara/CE":[-40.51,-2.79],"joao camara/RN":[-35.81,-5.54],"joao dias/RN":[-37.79,-6.27],"jose da penha/RN":[-38.28,-6.31],"juazeiro do norte/CE":[-39.31,-7.2],"jucas/CE":[-39.52,-6.52],"jucurutu/RN":[-37.01,-6.03],"jundia/RN":[-35.35,-6.27],"lagoa d anta/RN":[-35.59,-6.39],"lagoa de pedras/RN":[-35.43,-6.15],"lagoa de velhos/RN":[-35.87,-6.01],"lagoa nova/RN":[-36.47,-6.09],"lagoa salgada/RN":[-35.47,-6.12],"lajes/RN":[-36.25,-5.69],"lajes pintadas/RN":[-36.12,-6.15],"lavras da mangabeira/CE":[-38.97,-6.74],"limoeiro do norte/CE":[-38.08,-5.14],"lucrecia/RN":[-37.81,-6.11],"luis gomes/RN":[-38.39,-6.41],"macaiba/RN":[-35.36,-5.85],"macau/RN":[-36.63,-5.11],"madalena/CE":[-39.57,-4.85],"major sales/RN":[-38.32,-6.4],"maracanau/CE":[-38.63,-3.87],"maranguape/CE":[-38.68,-3.89],"marcelino vieira/RN":[-38.16,-6.28],"marco/CE":[-40.16,-3.13],"martinopole/CE":[-40.69,-3.23],"martins/RN":[-37.91,-6.08],"massape/CE":[-40.34,-3.52],"mauriti/CE":[-38.77,-7.39],"maxaranguape/RN":[-35.26,-5.52],"meruoca/CE":[-40.45,-3.54],"messias targino/RN":[-37.52,-6.07],"milagres/CE":[-38.94,-7.3],"milha/CE":[-39.19,-5.67],"miraima/CE":[-39.97,-3.57],"missao velha/CE":[-39.14,-7.24],"mombaca/CE":[-39.63,-5.74],"monsenhor tabosa/CE":[-40.06,-4.79],"montanhas/RN":[-35.28,-6.49],"monte alegre/RN":[-35.33,-6.07],"monte das gameleiras/RN":[-35.78,-6.44],"morada nova/CE":[-38.37,-5.1],"moraujo/CE":[-40.68,-3.46],"morrinhos/CE":[-40.12,-3.23],"mossoro/RN":[-37.35,-5.18],"mucambo/CE":[-40.75,-3.9],"mulungu/CE":[-39.0,-4.3],"natal/RN":[-35.2,-5.79],"nisia floresta/RN":[-35.2,-6.09],"nova cruz/RN":[-35.43,-6.48],"nova olinda/CE":[-39.67,-7.08],"nova russas/CE":[-40.56,-4.71],"novo oriente/CE":[-40.77,-5.53],"ocara/CE":[-38.59,-4.49],"olho d agua do borges/RN":[-37.7,-5.95],"oros/CE":[-38.91,-6.25],"ouro branco/RN":[-36.94,-6.7],"pacajus/CE":[-38.47,-4.17],"pacatuba/CE":[-38.62,-3.98],"pacoti/CE":[-38.92,-4.22],"pacuja/CE":[-40.7,-3.98],"palhano/CE":[-37.97,-4.74],"palmacia/CE":[-38.84,-4.14],"paracuru/CE":[-39.03,-3.41],"paraipaba/CE":[-39.15,-3.44],"parambu/CE":[-40.69,-6.21],"paramoti/CE":[-39.24,-4.09],"parana/RN":[-38.31,-6.48],"parau/RN":[-37.1,-5.77],"parazinho/RN":[-35.84,-5.22],"parelhas/RN":[-36.66,-6.68],"parnamirim/RN":[-35.27,-5.91],"passa e fica/RN":[-35.64,-6.43],"passagem/RN":[-35.37,-6.27],"patu/RN":[-37.64,-6.11],"pau dos ferros/RN":[-38.21,-6.1],"pedra branca/CE":[-39.71,-5.45],"pedra grande/RN":[-35.88,-5.15],"pedra preta/RN":[-36.11,-5.57],"pedro avelino/RN":[-36.39,-5.52],"pedro velho/RN":[-35.22,-6.44],"penaforte/CE":[-39.07,-7.82],"pendencias/RN":[-36.71,-5.26],"pentecoste/CE":[-39.27,-3.79],"pereiro/CE":[-38.46,-6.04],"piloes/RN":[-38.05,-6.26],"pindoretama/CE":[-38.31,-4.02],"piquet carneiro/CE":[-39.42,-5.8],"pires ferreira/CE":[-40.64,-4.24],"poco branco/RN":[-35.66,-5.62],"poranga/CE":[-40.92,-4.75],"portalegre/RN":[-37.99,-6.02],"porteiras/CE":[-39.11,-7.52],"porto do mangue/RN":[-36.79,-5.05],"potengi/CE":[-40.02,-7.09],"potiretama/CE":[-38.16,-5.71],"pureza/RN":[-35.56,-5.46],"quiterianopolis/CE":[-40.7,-5.84],"quixada/CE":[-39.02,-4.97],"quixelo/CE":[-39.2,-6.25],"quixeramobim/CE":[-39.29,-5.19],"quixere/CE":[-37.98,-5.07],"rafael fernandes/RN":[-38.22,-6.19],"rafael godeiro/RN":[-37.72,-6.07],"redencao/CE":[-38.73,-4.22],"reriutaba/CE":[-40.58,-4.14],"riacho da cruz/RN":[-37.95,-5.93],"riacho de santana/RN":[-38.31,-6.25],"riachuelo/RN":[-35.82,-5.82],"rio do fogo/RN":[-35.38,-5.28],"rodolfo fernandes/RN":[-38.06,-5.78],"russas/CE":[-37.97,-4.93],"ruy barbosa/RN":[-35.93,-5.89],"saboeiro/CE":[-39.9,-6.53],"salitre/CE":[-40.45,-7.28],"santa cruz/RN":[-36.02,-6.22],"santa maria/RN":[-35.69,-5.84],"santa quiteria/CE":[-40.15,-4.33],"santana do acarau/CE":[-40.21,-3.46],"santana do cariri/CE":[-39.73,-7.18],"santana do matos/RN":[-36.66,-5.95],"santana do serido/RN":[-36.73,-6.77],"santo antonio/RN":[-35.47,-6.31],"sao benedito/CE":[-40.86,-4.05],"sao bento do norte/RN":[-35.96,-5.09],"sao bento do trairi/RN":[-36.09,-6.34],"sao fernando/RN":[-37.19,-6.38],"sao francisco do oeste/RN":[-38.15,-5.97],"sao goncalo do amarante/RN":[-35.33,-5.79],"sao goncalo do amarante/CE":[-38.97,-3.61],"sao joao do jaguaribe/CE":[-38.27,-5.28],"sao joao do sabugi/RN":[-37.2,-6.71],"sao jose de mipibu/RN":[-35.24,-6.08],"sao jose do campestre/RN":[-35.71,-6.31],"sao jose do serido/RN":[-36.87,-6.44],"sao luis do curu/CE":[-39.24,-3.67],"sao miguel/RN":[-38.49,-6.2],"sao miguel do gostoso/RN":[-35.64,-5.12],"sao paulo do potengi/RN":[-35.76,-5.9],"sao pedro/RN":[-35.63,-5.91],"sao rafael/RN":[-36.88,-5.8],"sao tome/RN":[-36.08,-5.96],"sao vicente/RN":[-36.68,-6.22],"senador eloi de souza/RN":[-35.7,-6.03],"senador georgino avelino/RN":[-35.13,-6.16],"senador pompeu/CE":[-39.37,-5.58],"senador sa/CE":[-40.47,-3.35],"serra caiada/RN":[-35.71,-6.1],"serra de sao bento/RN":[-35.7,-6.42],"serra do mel/RN":[-37.02,-5.18],"serra negra do norte/RN":[-37.4,-6.66],"serrinha/RN":[-35.5,-6.28],"serrinha dos pintos/RN":[-37.95,-6.11],"severiano melo/RN":[-37.96,-5.78],"sitio novo/RN":[-35.91,-6.11],"sobral/CE":[-40.35,-3.69],"solonopole/CE":[-39.01,-5.72],"taboleiro grande/RN":[-38.04,-5.92],"tabuleiro do norte/CE":[-38.13,-5.24],"taipu/RN":[-35.59,-5.63],"tamboril/CE":[-40.32,-4.83],"tangara/RN":[-35.8,-6.2],"tarrafas/CE":[-39.75,-6.68],"taua/CE":[-40.3,-5.99],"tejucuoca/CE":[-39.58,-3.99],"tenente ananias/RN":[-38.18,-6.46],"tenente laurentino cruz/RN":[-36.71,-6.14],"tiangua/CE":[-40.99,-3.73],"tibau/RN":[-37.26,-4.84],"tibau do sul/RN":[-35.09,-6.19],"timbauba dos batistas/RN":[-37.27,-6.46],"touros/RN":[-35.46,-5.2],"trairi/CE":[-39.27,-3.27],"triunfo potiguar/RN":[-37.18,-5.85],"tururu/CE":[-39.43,-3.58],"ubajara/CE":[-40.92,-3.85],"umari/CE":[-38.7,-6.64],"umarizal/RN":[-37.82,-5.98],"umirim/CE":[-39.35,-3.68],"upanema/RN":[-37.26,-5.64],"uruburetama/CE":[-39.51,-3.62],"uruoca/CE":[-40.56,-3.31],"varjota/CE":[-40.47,-4.19],"varzea/RN":[-35.37,-6.35],"varzea alegre/CE":[-39.29,-6.78],"venha ver/RN":[-38.49,-6.32],"vera cruz/RN":[-35.43,-6.04],"vicosa/RN":[-37.95,-5.98],"vicosa do ceara/CE":[-41.09,-3.57],"vila flor/RN":[-35.07,-6.31]}}; })();
;
/* ===== regras.js ===== */
/* Saberes que Cultivam — regras de negócio (contas e conferências), sem tela e sem servidor.
   Tudo aqui recebe o conjunto de dados (db) por parâmetro: por isso roda igual no navegador e nos testes (node).
   As mesmas travas que importam para a integridade (saldo do lote, lote pronto, mulheres <= participantes)
   existem também no banco (supabase/01_criar_banco.sql): a tela avisa antes, o banco garante. */
(function () {
  const G = typeof window !== 'undefined' ? window : globalThis;
  const SQC = (G.SQC = G.SQC || {});
  const D = SQC.dados;

  /* ---------- datas (sempre texto AAAA-MM-DD; nada de fuso) ---------- */
  const pd = s => { const [a, b, c] = String(s).split('-').map(Number); return new Date(a, b - 1, c || 1); };
  const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const dias = (a, b) => Math.round((b - a) / 864e5);
  const fimMes = s => { const d = pd(s); return new Date(d.getFullYear(), d.getMonth() + 1, 0); };
  const n = v => +v || 0;
  const vazio = v => v === '' || v == null;

  /* ---------- lotes ---------- */
  const distribuido = (db, loteId, menosId) => db.distribuicoes.filter(d => d.lote === loteId && d.id !== menosId).reduce((s, d) => s + n(d.qtd), 0);
  const saldo = (db, l) => n(l.qtd) - distribuido(db, l.id);
  const pronto = l => { const d = pd(l.inicio); d.setDate(d.getDate() + n(l.dias)); return d; };
  function codigoLote(db, r) {
    const t = D.TIPOS[r.tipo] || D.TIPOS.Outro; const u = db.unidades.find(x => x.id === r.unidade) || {};
    const pre = `${u.sigla || 'UN'}-${t[0]}-`.toUpperCase();
    // maior número já usado nesse prefixo + 1 (contar registros repetiria o código depois de uma exclusão)
    const maior = db.lotes.filter(l => l.id !== r.id && String(l.codigo || '').startsWith(pre)).reduce((m, l) => Math.max(m, parseInt(String(l.codigo).slice(pre.length), 10) || 0), 0);
    return pre + String(maior + 1).padStart(3, '0');
  }

  /* ---------- unidades de produção e unidades produtivas ---------- */
  const nCheck = u => D.CHECK.filter(c => u[c[0]]).length;
  const proximoPasso = u => (D.CHECK.find(c => !u[c[0]]) || [0, 'concluída'])[1];
  /* agrupado uma vez por lista (antes filtrava a lista inteira para cada agricultor: lento com volume). A lista nova invalida sozinha. */
  let porAgr = new WeakMap();
  const novoDesenho = () => { porAgr = new WeakMap(); };   // a tela chama no começo de cada desenho: a lista pode ter mudado no lugar
  const grupo = (lista, ordenar) => { let c = porAgr.get(lista); if (c && c.n === lista.length && c.u === lista[lista.length - 1]) return c.m; const m = new Map();
    lista.forEach(x => { const k = x.agricultor; if (!m.has(k)) m.set(k, []); m.get(k).push(x); });
    if (ordenar) m.forEach(l => l.sort((a, b) => a.data < b.data ? 1 : -1)); porAgr.set(lista, { m, n: lista.length, u: lista[lista.length - 1] }); return m; };
  const visitasDe = (db, id) => (grupo(db.visitas, true).get(id) || []).slice();
  const recebeu = (db, id) => (grupo(db.distribuicoes, false).get(id) || []).slice();
  /* até que dia conta (AAAA-MM-DD). Sem data final, conta até hoje: atividade marcada para o futuro é planejada, não realizada. */
  const ateDia = ate => ate || iso(new Date());
  const ateh = (d, ate) => String(d || '') <= ate;   // registro antigo sem data continua contando
  /* "acompanhada" (Meta 4): recebeu bioinsumo e teve visita de monitoramento NO DIA da primeira entrega ou depois
     (mesma conta do aviso "recebeu bioinsumo e não teve visita depois"); visita antes da entrega não acompanha uso. */
  const acompanhada = (db, a, ate) => { ate = ateDia(ate);
    const r = recebeu(db, a.id).filter(x => ateh(x.data, ate)).map(x => String(x.data || '')).sort()[0];
    return r !== undefined && visitasDe(db, a.id).some(v => ateh(v.data, ate) && String(v.data || '') >= r); };

  /* ---------- execução física: quanto de cada etapa já foi feito ---------- */
  /* ate (opcional, AAAA-MM-DD): conta só o que tem data até esse dia. Sem ele, até hoje. */
  function feito(db, e, ate) {
    ate = ateDia(ate);
    switch (e.id) {
      case '2.1': return db.unidades.filter(u => u.conta === 'Sim' && u.funcionando).length;
      case '3.2': return db.eventos.filter(x => x.tipo === 'Capacitação' && ateh(x.data, ate)).length;
      case '3.3': return db.agricultores.filter(a => a.kit && ateh(a.kitdata, ate)).length;
      case '4.1': return db.agricultores.filter(a => acompanhada(db, a, ate)).length;
      case '5.1': return db.eventos.filter(x => x.tipo === 'Dia de campo' && ateh(x.data, ate)).length;
      default: return db.entregas.filter(g => g.etapa === e.id && ateh(g.data, ate)).length;
    }
  }

  /* ---------- execução física do projeto (número grande do painel) ----------
     Cada etapa pesa o valor que o plano de trabalho destina a ela (quantidade x valor unitário); não é média simples.
     "Previsto" = quanto da etapa já deveria estar feito até o fim do mês passado, distribuído por igual na janela da etapa. */
  const mesesEntre = (a, b) => (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth();
  function previstoEtapa(e, hoje) {
    const ini = pd(e.ini), total = mesesEntre(ini, pd(e.fim)) + 1;
    return Math.max(0, Math.min(1, mesesEntre(ini, new Date(hoje.getFullYear(), hoje.getMonth(), 1)) / total));
  }
  function execucaoGeral(db, hoje) {
    hoje = hoje || new Date();
    const linhas = D.ETAPAS.map(e => ({ e, valor: e.q * e.v, feito: Math.min(1, feito(db, e, iso(hoje)) / e.q), prev: previstoEtapa(e, hoje) }));
    const tot = linhas.reduce((s, x) => s + x.valor, 0);
    const real = linhas.reduce((s, x) => s + x.valor * x.feito, 0) / tot * 100, prev = linhas.reduce((s, x) => s + x.valor * x.prev, 0) / tot * 100;
    const st = real >= 99.5 ? 'concluida' : real >= prev ? 'andamento' : real >= prev * 0.7 ? 'atencao' : 'atrasada';
    const porMeta = [1, 2, 3, 4, 5, 6].map(m => { const l = linhas.filter(x => x.e.m === m), v = l.reduce((s, x) => s + x.valor, 0); return { m, valor: v, feito: l.reduce((s, x) => s + x.valor * x.feito, 0) / v * 100, prev: l.reduce((s, x) => s + x.valor * x.prev, 0) / v * 100 }; });
    const meses = mesesEntre(pd(D.G0), pd(D.G1)), mes = Math.max(1, Math.min(meses, mesesEntre(pd(D.G0), hoje) + 1));
    const ant = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
    return { real, prev, st, porMeta, mes, meses, ate: String(ant.getMonth() + 1).padStart(2, '0') + '/' + ant.getFullYear() };
  }

  /* ---------- financeiro ---------- */
  const cent = x => Math.round(x * 100) / 100;
  const recebido = () => D.PARCELAS.filter(p => p.recebida).reduce((s, p) => s + p.valor, 0);
  const previstoMeta = m => D.ETAPAS.filter(e => e.m === m).reduce((s, e) => s + e.q * e.v, 0);
  const somaDesp = (ds, pago) => ds.filter(d => (d.status === 'Pago') === pago).reduce((s, d) => s + n(d.valor), 0);
  const ate = (db, lim) => db.despesas.filter(d => !lim || d.data <= lim);
  /* por meta do TED: previsto, comprometido (solicitado ou em compras), pago, saldo */
  function fin(db, lim) {
    return [1, 2, 3, 4, 5, 6].map(m => {
      const prev = previstoMeta(m); const ds = ate(db, lim).filter(d => String(d.etapa)[0] === String(m));
      const pago = somaDesp(ds, true), comp = somaDesp(ds, false);
      return { m, nome: D.METAS[m], prev, comp: cent(comp), pago: cent(pago), saldo: cent(prev - comp - pago) };   // centavos: somas de valores quebrados (2.181,82 × 11) davam “R$ 0,00 acima”
    });
  }
  /* ---------- importação da planilha de solicitações da FUNCERN ----------
     A planilha é a fonte das despesas: cada solicitação vira (ou atualiza) uma despesa, reconhecida pelo número da solicitação
     guardado em "doc". O CPF do beneficiário é descartado na leitura e nunca é guardado. */
  const nrm = s => String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  const limpo = s => { const t = String(s == null ? '' : s).trim(); return t === '-' ? '' : t; };
  const DOC_SOL = 'Solicitação FUNCERN ';
  const numSol = d => { const m = /^Solicitação FUNCERN (\S+)$/.exec(String((d && d.doc) || '')); return m ? m[1] : ''; };
  function valorPlanilha(x) {
    if (typeof x === 'number') return x; let t = String(x == null ? '' : x).replace(/[R$\s]/g, '');
    if (/,\d{1,2}$/.test(t)) t = t.replace(/\./g, '').replace(',', '.');
    else if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');   // "1.500" é mil e quinhentos, não 1,5
    const n = Number(t); return isFinite(n) ? Math.round(n * 100) / 100 : NaN;
  }
  /* data que não existe (31/02, mês 22) volta vazia: a linha é apontada como erro em vez de parar a gravação no meio */
  const dataExiste = (a, m, d) => { const x = new Date(Date.UTC(+a, +m - 1, +d)); return x.getUTCFullYear() === +a && x.getUTCMonth() === +m - 1 && x.getUTCDate() === +d; };
  function dataPlanilha(x) {
    const t = String(x == null ? '' : x).trim(); let m;
    if ((m = /^(\d{4})-(\d{2})-(\d{2})/.exec(t))) return dataExiste(m[1], m[2], m[3]) ? `${m[1]}-${m[2]}-${m[3]}` : '';
    if ((m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(t))) return dataExiste(m[3], m[2], m[1]) ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : '';
    if (/^\d+(\.\d+)?$/.test(t) && +t > 20000 && +t < 80000) return new Date(Date.UTC(1899, 11, 30) + Math.floor(+t) * 864e5).toISOString().slice(0, 10);   // número de série do Excel
    return '';
  }
  /* das abas lidas (SQC.planilha.ler) para solicitações; a linha de títulos é a que tem "ID Solicitação" */
  function lerSolicitacoes(abas) {
    const sols = [], erros = [];
    (abas || []).forEach(aba => {
      const ic = aba.linhas.findIndex(l => l.some(c => nrm(c) === 'id solicitacao')); if (ic < 0) return;
      const col = {}; aba.linhas[ic].forEach((c, i) => { col[nrm(c)] = i; });
      const g = (l, nome) => col[nome] === undefined ? '' : limpo(l[col[nome]]);
      aba.linhas.slice(ic + 1).forEach((l, k) => {
        const sol = g(l, 'id solicitacao'); if (!sol) return;
        const valor = valorPlanilha(g(l, 'valor')), data = dataPlanilha(g(l, 'data solicitacao'));
        if (!(valor > 0) || !data) { erros.push(`Aba “${aba.nome}”, linha ${ic + k + 2} (solicitação ${sol}): ${!(valor > 0) ? 'valor' : 'data'} não reconhecido.`); return; }
        sols.push({ sol, aba: aba.nome, tipo: g(l, 'tipo solicitacao'), beneficiario: g(l, 'beneficiario nome'), valor, rubricaTxt: g(l, 'rubrica financeira'), sub: g(l, 'subrubrica financeira'), detalhe: g(l, 'detalhe rubrica'), statusTxt: g(l, 'status') || '(sem status)', data });
      });
    });
    return { sols, erros };
  }
  function rubricaDaFuncern(rub, detalhe, tipo) {
    const r = nrm(rub), d = nrm(detalhe), t = nrm(tipo);
    if (/\bdoa\b/.test(d) || /\bdoa\b/.test(t)) return 'doa';
    return /pesquisador/.test(r) ? 'bolsa_pesquisador' : /estudante|discente|aluno/.test(r) ? 'bolsa_estudante' : /diaria/.test(r) ? 'diarias' : /ajuda de custo/.test(r) ? 'ajuda_custo'
      : /passage|locomocao/.test(r) ? 'passagens' : /pessoa juridica/.test(r) ? 'servicos_pj' : /consumo/.test(r) ? 'consumo' : /equipamento|permanente/.test(r) ? 'equipamentos' : '';
  }
  function itemDaFuncern(rubrica, detalhe) {
    const its = D.DESEMBOLSO.itens.filter(i => i.rubrica === rubrica), d = nrm(detalhe); if (its.length === 1) return its[0].id; if (!d) return '';
    const x = its.filter(i => nrm(i.nome).includes(d) || d.includes(nrm(i.nome).replace(/^bolsa - /, ''))); return x.length === 1 ? x[0].id : '';
  }
  /* como cada status da fundação entra na conta, quando a coordenação ainda não escolheu */
  function destinoStatus(txt) {
    const s = nrm(txt);
    if (/\b(nao|sem|aguardando|pendente|a) (pago|paga|pagamento|pagar)\b|devolv/.test(s)) return 'Comprometido';   // "Não pago", "Devolvida para correção": ainda vale como comprometido
    return /cancel|recus|reprov|indefer|estorn/.test(s) ? 'Ignorar' : /\bpago\b|\bpaga\b|finaliz|conclu|liquid|quitad/.test(s) ? 'Pago' : 'Comprometido';
  }
  /* escolhas = { status: { texto: 'Pago' | 'Comprometido' | 'Ignorar' }, etapa: { grupo: id }, rubrica: { grupo: id } }
     Devolve o que seria feito, sem gravar nada: a tela mostra, a coordenação confirma. */
  function planoImportacao(db, sols, escolhas) {
    escolhas = escolhas || {}; const es = escolhas.status || {}, ee = escolhas.etapa || {}, er = escolhas.rubrica || {};
    const porSol = {}; db.despesas.forEach(d => { const n = numSol(d); if (n) porSol[n] = d; });
    const grupos = {}, status = {}, linhas = [], vistos = new Set();
    sols.forEach(s => {
      if (vistos.has(s.sol)) return; vistos.add(s.sol);
      const dest = es[s.statusTxt] || destinoStatus(s.statusTxt), ant = porSol[s.sol] || null;
      const st = status[s.statusTxt] = status[s.statusTxt] || { txt: s.statusTxt, n: 0, total: 0, destino: dest }; st.n++; st.total += s.valor;
      if (dest === 'Ignorar') { linhas.push({ s, ant, acao: ant ? 'remove' : 'ignora' }); return; }
      const chave = nrm(s.rubricaTxt) + ' | ' + nrm(s.detalhe), auto = rubricaDaFuncern(s.rubricaTxt, s.detalhe, s.tipo);
      const g0 = grupos[chave];   // linha nova num grupo que já tem rubrica/etapa escolhida (em importação anterior) herda a do grupo
      const rubrica = er[chave] || (ant && ant.rubrica) || auto || (g0 && g0.rubrica) || '';
      const igual = db.despesas.filter(d => numSol(d) && d.rubrica === rubrica && nrm(d.descricao).endsWith('· ' + nrm(s.detalhe))).sort((a, b) => a.data < b.data ? 1 : -1)[0];
      const etapa = ee[chave] || (ant && ant.etapa) || (igual && igual.etapa) || (rubrica === 'doa' ? '6.3' : '') || (g0 && g0.rubrica === rubrica && g0.etapa) || '';
      const g = grupos[chave] = grupos[chave] || { chave, rubricaTxt: s.rubricaTxt, detalhe: s.detalhe, rubricaAuto: auto, rubrica, etapa, n: 0, total: 0 }; g.n++; g.total += s.valor;
      const item = ant && ant.item && D.DESEMBOLSO.itens.some(i => i.id === ant.item && i.rubrica === rubrica) ? ant.item : itemDaFuncern(rubrica, s.detalhe);
      const reg = { id: ant ? ant.id : null, data: s.data, etapa, rubrica, item: item || '', descricao: [String(s.tipo).replace(/^Solicitação de /i, ''), s.detalhe].filter((x, i, a) => x && a.indexOf(x) === i).join(' · ') || 'Solicitação',
        favorecido: s.beneficiario, doc: DOC_SOL + s.sol, valor: s.valor, status: dest === 'Pago' ? 'Pago' : 'Solicitado' };
      const mudou = !ant || ['data', 'etapa', 'rubrica', 'descricao', 'favorecido', 'status'].some(k => String(ant[k] || '') !== String(reg[k] || '')) || Number(ant.valor) !== reg.valor || String(ant.item || '') !== reg.item;
      linhas.push({ s, ant, reg, grupo: chave, acao: !ant ? 'nova' : mudou ? 'atualiza' : 'igual' });
    });
    const G = Object.values(grupos), conta = a => linhas.filter(l => l.acao === a).length, vale = linhas.filter(l => l.reg);
    return { linhas, grupos: G, status: Object.values(status), faltam: G.filter(g => !g.rubrica || !g.etapa).length + vale.filter(l => (!l.reg.rubrica || !l.reg.etapa) && !G.some(g => g.chave === l.grupo && (!g.rubrica || !g.etapa))).length,
      novas: conta('nova'), atualizadas: conta('atualiza'), iguais: conta('igual'), removidas: conta('remove'), ignoradas: conta('ignora'),
      pago: vale.filter(l => l.reg.status === 'Pago').reduce((t, l) => t + l.reg.valor, 0), comprometido: vale.filter(l => l.reg.status !== 'Pago').reduce((t, l) => t + l.reg.valor, 0),
      foraDaPlanilha: db.despesas.filter(d => numSol(d) && !vistos.has(numSol(d))).length, manuais: db.despesas.filter(d => !numSol(d)).length };
  }
  /* por item do plano (dentro da rubrica): previsto, pago, comprometido e saldo. Só entra a despesa que indica o item;
     "composicao" descreve como o previsto se distribui (meses e valor por mês, quando é sempre o mesmo). */
  function finItens(db, lim) {
    const ds = ate(db, lim);
    return D.DESEMBOLSO.itens.map(i => {
      const x = ds.filter(d => d.item === i.id && d.rubrica === i.rubrica), pago = somaDesp(x, true), comp = somaDesp(x, false);
      const prev = Math.round(i.m.reduce((a, b) => a + b, 0) * 100) / 100, ms = i.m.map((v, k) => v ? k : -1).filter(k => k >= 0), vs = ms.map(k => i.m[k]);
      const igual = vs.every(v => Math.abs(v - vs[0]) < 0.05);
      return { id: i.id, rubrica: i.rubrica, nome: i.nome, prev, pago, comp, saldo: prev - pago - comp, meses: ms, mensal: igual && vs.length > 1 ? vs[0] : null, despesas: x };
    });
  }
  /* por rubrica do plano universal (FUNCERN); despesa sem rubrica aparece numa linha própria, para ser corrigida */
  function finRubrica(db, lim) {
    const ds = ate(db, lim);
    const linhas = D.RUBRICAS.map(r => {
      const x = ds.filter(d => d.rubrica === r.id); const pago = somaDesp(x, true), comp = somaDesp(x, false);
      return { id: r.id, nome: r.nome, prev: r.v, comp: cent(comp), pago: cent(pago), saldo: cent(r.v - comp - pago) };
    });
    const sem = ds.filter(d => !D.RUBRICAS.some(r => r.id === d.rubrica));
    if (sem.length) { const pago = somaDesp(sem, true), comp = somaDesp(sem, false); linhas.push({ id: '', nome: 'Sem rubrica (corrija o lançamento)', prev: 0, comp, pago, saldo: -comp - pago, semRubrica: true }); }
    return linhas;
  }
  const soma = (F, k) => F.reduce((s, r) => s + r[k], 0);

  /* ---------- ritmo do gasto: acumulado mês a mês (previsto do plano de desembolso x pago x recebido) ---------- */
  const mesDe = (i) => { const d = pd(D.DESEMBOLSO.inicio); return new Date(d.getFullYear(), d.getMonth() + i, 1); };   // i = 0 é ago/2026
  const chaveMes = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  const desembolsoMensal = () => D.DESEMBOLSO.itens[0].m.map((_, i) => Math.round(D.DESEMBOLSO.itens.reduce((s, it) => s + it.m[i], 0) * 100) / 100);
  function ritmo(db, hoje) {
    hoje = hoje || new Date(); const mensal = desembolsoMensal(), n = mensal.length, hj = iso(hoje);
    const noMes = (lista, campo, k) => lista.filter(x => String(x[campo] || '').slice(0, 7) === k).reduce((s, x) => s + (+x.valor || 0), 0);
    const pagos = db.despesas.filter(d => d.status === 'Pago' && d.data <= hj), recebidas = D.PARCELAS.filter(p => p.recebida && p.data <= hj);
    // parcela ou despesa com data anterior ao primeiro mês do plano entra no primeiro mês (não some do acumulado)
    const k0 = chaveMes(mesDe(0)); const antes = (lista) => lista.filter(x => String(x.data).slice(0, 7) < k0).reduce((s, x) => s + (+x.valor || 0), 0);
    let ap = 0, ae = antes(pagos), ar = antes(recebidas); const pontos = [];
    for (let i = 0; i < n; i++) {
      const d = mesDe(i), k = chaveMes(d), passou = k <= hj.slice(0, 7);
      ap += mensal[i]; if (passou) { ae += noMes(pagos, 'data', k); ar += noMes(recebidas, 'data', k); }
      // o que for pago ou recebido depois do último mês do plano entra no último ponto (não some do acumulado)
      if (i === n - 1 && passou) { const depois = l => l.filter(x => String(x.data).slice(0, 7) > k).reduce((s, x) => s + (+x.valor || 0), 0); ae += depois(pagos); ar += depois(recebidas); }
      pontos.push({ mes: k, rotulo: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '') + '/' + String(d.getFullYear()).slice(2), previsto: Math.round(ap * 100) / 100, executado: passou ? ae : null, recebido: passou ? ar : null, atual: k === hj.slice(0, 7) });
    }
    return { pontos, total: Math.round(ap * 100) / 100, tempo: tempoDecorrido(hoje) };
  }
  /* quanto da vigência já passou (0 a 1) */
  function tempoDecorrido(hoje) { const a = pd(D.VIGENCIA.ini), b = pd(D.VIGENCIA.fim); return Math.max(0, Math.min(1, ((hoje || new Date()) - a) / (b - a))); }

  /* ---------- o que precisa de atenção (painel) ---------- */
  const FMT_BRL = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });   // criado uma vez: toLocaleString a cada chamada era ~50 vezes mais lento (auditoria 14/10)
  const brl = v => 'R$ ' + FMT_BRL.format(n(v));
  // só dígitos e traço passam: a data vai direto para o HTML, então nada que não seja data chega à tela
  const dt = s => s ? String(s).slice(0, 10).replace(/[^0-9-]/g, '').split('-').reverse().join('/') : '—';
  const venceu = (e, hoje) => iso(fimMes(e.fim)) < iso(hoje || new Date());   // a etapa só vence depois do último dia do mês final
  /* cada aviso: [nível ('bad' urgente, 'f' atenção), assunto, texto completo, título, detalhe, prazo (AAAA-MM-DD ou ''), aba onde se resolve] */
  function alertas(db, hoje) {
    hoje = hoje || new Date(); const A = [];
    const add = (nivel, cat, titulo, detalhe, prazo, aba) => A.push([nivel, cat, titulo + (detalhe ? ' ' + detalhe : ''), titulo, detalhe || '', prazo || '', aba || '']);
    const F = fin(db), usado = soma(F, 'pago') + soma(F, 'comp'), rec = recebido();
    const prox = D.PARCELAS.find(p => !p.recebida);
    if (usado > rec) add('bad', 'Financeiro', `Pago e comprometido somam ${brl(usado)}, acima do que já foi recebido (${brl(rec)}).`, prox ? 'A próxima parcela está prevista para ' + prox.previsao.split('-').reverse().join('/') + '.' : '', '', 'financeiro');
    F.filter(r => r.saldo < 0).forEach(r => add('bad', 'Financeiro', `Meta ${r.m} está ${brl(-r.saldo)} acima do valor previsto no plano.`, 'Confira os lançamentos dessa meta.', '', 'financeiro'));
    finRubrica(db).forEach(r => {
      if (r.semRubrica) add('f', 'Financeiro', `Há despesa lançada sem rubrica (${brl(r.comp + r.pago)}).`, 'Sem rubrica ela não entra na conferência com a FUNCERN.', '', 'financeiro');
      else if (r.saldo < 0) add('bad', 'Rubrica', `${r.nome}: ${brl(-r.saldo)} acima do previsto no plano.`, 'Remanejar exige ajuste do plano de trabalho.', '', 'financeiro');
      else if (r.prev && (r.comp + r.pago) / r.prev >= 0.9) add('f', 'Rubrica', `${r.nome}: ${Math.round((r.comp + r.pago) / r.prev * 100)}% do previsto já pago ou comprometido.`, 'O que ainda falta comprar nessa rubrica cabe no saldo?', '', 'financeiro');
    });
    const e21 = D.ETAPAS.find(e => e.id === '2.1'); const lim = new Date(fimMes(e21.fim).getTime() - 60 * 864e5);
    db.unidades.filter(u => u.conta === 'Sim').forEach(u => {
      if (!u.orcamento) add(dias(hoje, lim) < 30 ? 'bad' : 'f', 'Compras', `${u.nome}: envie os orçamentos à FUNCERN até ${dt(iso(lim))}.`, `A etapa 2.1 termina em ${e21.fim.split('-').reverse().join('/')} e uma compra pela fundação leva cerca de dois meses.`, iso(lim), 'unidades');
      if (!u.parceiro_ok) add('f', 'Patrimônio', `${u.nome}: defina o parceiro institucional que receberá os bens.`, 'Não é possível doar a pessoa física.', '', 'unidades');
    });
    const semBase = db.agricultores.filter(a => !a.diag);
    if (semBase.length) add('bad', 'Linha de base', `${semBase.length} unidade(s) produtiva(s) sem diagnóstico inicial.`, 'Sem ele, a avaliação da Meta 5 não tem com o que comparar.', '', 'agricultores');
    db.agricultores.forEach(a => {
      const r = recebeu(db, a.id).sort((x, y) => x.data < y.data ? 1 : -1)[0]; if (!r) return; const v = visitasDe(db, a.id)[0];
      if ((!v || v.data < r.data) && dias(pd(r.data), hoje) > 30) add('f', 'Monitoramento', `${a.nome}: recebeu bioinsumo em ${dt(r.data)} e não teve visita depois.`, 'Registre a visita de monitoramento.', '', 'visitas');
    });
    const hj = iso(hoje);   // datas comparadas como texto AAAA-MM-DD: o dia previsto e o último dia do mês ainda não são atraso
    db.lotes.forEach(l => { if (['Em preparo', 'Maturando'].includes(l.status) && iso(pronto(l)) < hj) add('f', 'Lote', `${l.codigo || 'Lote sem código'}: passou da previsão (${dt(iso(pronto(l)))}).`, 'Confira e marque como pronto.', '', 'lotes'); });
    D.ETAPAS.forEach(e => { if (venceu(e, hoje) && feito(db, e, hj) < e.q) add('bad', 'Prazo', `Etapa ${e.id} venceu em ${e.fim.split('-').reverse().join('/')} com ${feito(db, e, hj)} de ${e.q}.`, e.nome + '.', iso(fimMes(e.fim)), D.ETAPAS_AUTOMATICAS.includes(e.id) ? '' : 'painel'); });
    // urgente primeiro; dentro do mesmo nível, o que tem prazo mais próximo
    return A.sort((a, b) => (a[0] === 'bad' ? 0 : 1) - (b[0] === 'bad' ? 0 : 1) || (a[5] || '9') .localeCompare(b[5] || '9'));
  }

  /* ---------- indicadores da Meta 5 ---------- */
  function indicadores(db, ate) {
    ate = ateDia(ate); const vs = db.visitas.filter(v => ateh(v.data, ate));
    // só entra quem tem as duas pontas: linha de base com gasto informado E visita com gasto (campo vazio não é zero)
    const comp = db.agricultores.map(a => { const v = visitasDe(db, a.id).find(x => !vazio(x.gasto) && ateh(x.data, ate)); return a.diag && !vazio(a.gasto0) && v ? [n(a.gasto0), n(v.gasto)] : null; }).filter(Boolean);
    const m0 = comp.reduce((s, c) => s + c[0], 0) / (comp.length || 1), m1 = comp.reduce((s, c) => s + c[1], 0) / (comp.length || 1);
    const ev = db.eventos.filter(e => ['Capacitação', 'Dia de campo'].includes(e.tipo) && ateh(e.data, ate));   // atividade planejada não soma participantes
    return { pares: comp.length, base: m0, atual: m1, variacao: comp.length && m0 ? (m1 - m0) / m0 * 100 : null,
      visitas: vs.length, usou: vs.filter(v => v.usou === 'Sim').length,
      participantes: ev.reduce((s, e) => s + n(e.part), 0), mulheres: ev.reduce((s, e) => s + n(e.mulheres), 0) };
  }

  /* ---------- conferências antes de gravar: devolve '' ou a mensagem para a tela ---------- */
  function validar(db, tabela, r, anterior) {
    if (tabela === 'unidades') {
      if (!/^[A-Za-z]{2,4}$/.test(String(r.sigla || ''))) return 'A sigla precisa ter de 2 a 4 letras, sem número nem espaço.';
      if (db.unidades.some(u => u.id !== r.id && String(u.sigla).toUpperCase() === String(r.sigla).toUpperCase())) return 'Já existe uma unidade com essa sigla.';
    }
    const inteiro = v => vazio(v) || Number.isInteger(+v);
    if (tabela === 'lotes') {
      if (!(n(r.qtd) > 0)) return 'Informe a quantidade produzida.';
      if (!inteiro(r.dias) || n(r.dias) > 730) return 'Os dias até ficar pronto precisam ser um número inteiro, de 0 a 730.';
      if (n(r.qtd) > 1000000) return 'Confira a quantidade: o valor está alto demais.';
      if (anterior && (anterior.unidade !== r.unidade || anterior.tipo !== r.tipo)) return 'Lote não muda de unidade nem de tipo depois de criado, porque o código depende deles. Crie outro lote.';
      if (anterior && distribuido(db, r.id) > 0 && (anterior.med !== r.med || anterior.inicio !== r.inicio)) return 'Este lote já teve distribuição: a medida e a data de início não mudam mais.';
      const ja = distribuido(db, r.id); if (n(r.qtd) < ja) return `A quantidade ficou menor do que o já distribuído (${ja}).`;
      if (anterior && anterior.status === 'Pronto' && r.status !== 'Pronto' && ja > 0) return 'Este lote já teve distribuição: não pode deixar de estar pronto.';
    }
    if (tabela === 'distribuicoes') {
      const l = db.lotes.find(x => x.id === r.lote); if (!l) return 'Escolha o lote.';
      if (!(n(r.qtd) > 0)) return 'Informe a quantidade entregue.';
      if (l.status !== 'Pronto') return `O lote ${l.codigo || ''} ainda não está marcado como pronto.`;
      const disp = n(l.qtd) - distribuido(db, l.id, r.id);
      if (n(r.qtd) > disp) return `O lote ${l.codigo || ''} só tem ${disp} ${l.med} de saldo.`;
      if (r.data < l.inicio) return 'A data da entrega é anterior ao início do preparo do lote.';
      { const lim = new Date(); lim.setDate(lim.getDate() + 1); if (r.data > iso(lim)) return 'A data da entrega está no futuro. Confira o ano.'; }
    }
    if (tabela === 'visitas' && r.data) { const lim = new Date(); lim.setDate(lim.getDate() + 1); if (r.data > iso(lim)) return 'A data da visita está no futuro. Registre a visita depois de feita.'; }
    if (tabela === 'presencas') {
      if (!(db.eventos || []).some(e => e.id === r.evento)) return 'Escolha a atividade.';
      if (String(r.nome || '').trim().length < 3) return 'Informe o nome de quem participou.';
    }
    if (tabela === 'eventos') {
      if (!inteiro(r.part) || !inteiro(r.mulheres)) return 'Participantes e mulheres precisam ser números inteiros.';
      if (!vazio(r.mulheres) && vazio(r.part)) return 'Informe o total de participantes antes do número de mulheres.';
      if (n(r.mulheres) > n(r.part)) return 'O número de mulheres não pode passar do total de participantes.';
    }
    if (tabela === 'agricultores' && r.kit && !r.kitdata) return 'Informe a data da entrega do kit.';
    if (tabela === 'membros') {
      if (!String(r.nome || '').trim()) return 'Informe o nome.';
      if (!['coordenacao', 'auxiliar', 'discente', 'formador'].includes(r.funcao)) return 'Escolha a função.';
      if (!r.inicio) return 'Informe a data de início.';
      if (r.fim && r.fim < r.inicio) return 'O desligamento não pode ser antes do início.';
      const ob = obrigatoriosMembro(r, anterior); if (ob) return ob;
      if (!r.lgpd) return 'Marque que a pessoa foi informada e concorda com o uso dos dados.';
      const mc = validarDadosPessoais(r); if (mc) return mc;
      // ninguém duas vezes na equipe ao mesmo tempo, e as vagas do plano (o banco confere CPF e e-mail; as vagas, a tela)
      const hj = iso(new Date()), ativoM = m => !m.fim || m.fim >= hj, outros = (db.membros || []).filter(m => m.id !== r.id && ativoM(m));
      if (ativoM(r)) {
        if (r.cpf && outros.some(m => m.cpf && soDigitos(m.cpf) === soDigitos(r.cpf))) return 'Já existe uma pessoa ativa na equipe com este CPF.';
        if (r.email && outros.some(m => String(m.email || '').trim().toLowerCase() === String(r.email).trim().toLowerCase())) return 'Já existe uma pessoa ativa na equipe com este e-mail.';
        const lim = VAGAS[r.funcao]; if (lim && (!anterior || anterior.funcao !== r.funcao || !ativoM(anterior)) && outros.filter(m => m.funcao === r.funcao).length >= lim) return `As vagas desta função já estão ocupadas (${lim} no plano). Registre o desligamento de quem saiu antes de cadastrar outra pessoa.`;
      }
    }
    if (tabela === 'despesas') {
      if (!(n(r.valor) > 0)) return 'Informe o valor da despesa.';
      if (!D.RUBRICAS.some(x => x.id === r.rubrica)) return 'Escolha a rubrica.';
      if (!D.ETAPAS.some(x => x.id === r.etapa)) return 'Escolha a etapa do plano.';
      if (r.item) { const it = D.DESEMBOLSO.itens.find(i => i.id === r.item); if (!it) return 'Item do plano desconhecido. Escolha outro ou deixe sem item.';
        if (it.rubrica !== r.rubrica) return `O item “${it.nome}” é de outra rubrica. Escolha um item da rubrica desta despesa ou deixe sem item.`; }
    }
    if (tabela === 'pessoas') {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(r.email || ''))) return 'Informe um e-mail válido.';
      if (db.pessoas.some(p => p.id !== r.id && String(p.email).toLowerCase() === String(r.email).toLowerCase())) return 'Já existe um acesso com esse e-mail.';
      const eraCoord = anterior && anterior.perfil === 'Coordenação' && anterior.ativo !== false;
      const segueCoord = r.perfil === 'Coordenação' && r.ativo !== false;
      if (eraCoord && !segueCoord && db.pessoas.filter(p => p.perfil === 'Coordenação' && p.ativo !== false).length < 2) return 'É preciso manter pelo menos um acesso de coordenação ativo.';
    }
    return '';
  }

  /* ---------- exclusão: onde o registro está em uso ---------- */
  const REFS = { unidades: [['itens', 'unidade'], ['lotes', 'unidade'], ['agricultores', 'unidade']], lotes: [['distribuicoes', 'lote']], agricultores: [['distribuicoes', 'agricultor'], ['visitas', 'agricultor']], eventos: [['presencas', 'evento'], ['fotos', 'registro']], visitas: [['fotos', 'registro']] };
  const emUso = (db, tabela, id) => (REFS[tabela] || []).filter(([c, k]) => (db[c] || []).some(x => x[k] === id)).map(([c]) => c);

  /* ---------- quem pode o quê (a tela esconde; o banco recusa) ---------- */
  const RESTRITAS = ['despesas', 'pessoas', 'membros'];   // a equipe (bolsistas) não grava
  /* perfis (23): o auxiliar administrativo cuida do financeiro e dos itens; formador(a), só da Formação. Acompanhamento (SEAB/MDA) só lê.
     A habilitação da equipe (Arlo e termo) o auxiliar marca por outro caminho (api.habilitar), não pelo formulário. */
  const PERFIS = ['Coordenação', 'Equipe', 'Auxiliar', 'Formador', 'Acompanhamento'];
  const NOME_PERFIL = { Coordenação: 'Coordenação', Equipe: 'Equipe (bolsistas)', Auxiliar: 'Auxiliar administrativo', Formador: 'Formador(a)', Acompanhamento: 'Acompanhamento (SEAB/MDA)' };
  const GRAVA = { Auxiliar: ['despesas', 'itens'], Formador: ['eventos', 'presencas', 'fotos'] };
  const podeGravar = (eu, tabela) => !!eu && eu.ativo !== false && (eu.perfil === 'Coordenação' || (eu.perfil === 'Equipe' && !RESTRITAS.includes(tabela)) || (GRAVA[eu.perfil] || []).includes(tabela));
  /* excluir: a coordenação exclui tudo; o auxiliar, qualquer despesa; nos demais casos, só o que a própria pessoa lançou (nunca acessos) */
  const podeExcluir = (eu, tabela, r) => !!eu && eu.ativo !== false && tabela !== 'pessoas'
    && (eu.perfil === 'Coordenação' || (eu.perfil === 'Auxiliar' && tabela === 'despesas')
      || (((eu.perfil === 'Equipe' && !RESTRITAS.includes(tabela)) || (GRAVA[eu.perfil] || []).includes(tabela)) && !!r && r.criado_por === eu.id));

  /* ---------- cadastro da equipe: documentos e endereço (vale na tela da coordenação e no link que a pessoa preenche) ---------- */
  const soDigitos = s => String(s == null ? '' : s).replace(/\D/g, '');
  function cpfValido(c) {
    c = soDigitos(c); if (c.length !== 11 || /^(\d)\1{10}$/.test(c)) return false;
    const dv = n => { let s = 0; for (let i = 0; i < n; i++) s += +c[i] * (n + 1 - i); const r = (s * 10) % 11; return r === 10 ? 0 : r; };
    return dv(9) === +c[9] && dv(10) === +c[10];
  }
  /* campos que a pessoa pode preencher pelo link (o banco aceita só estes) e os que só a coordenação lê */
  const CAMPOS_CONVITE = ['nome', 'nome_social', 'cpf', 'pis', 'nascimento', 'telefone', 'email', 'cep', 'logradouro', 'numero', 'complemento', 'bairro', 'municipio', 'uf',
    'vinculo', 'siape', 'organizacao', 'experiencia', 'outra_bolsa', 'arlo', 'agricultor', 'atua_af', 'zona_rural', 'celular_internet', 'socio', 'escolaridade', 'raca_cor', 'renda', 'pessoas_casa', 'lgpd'];
  const CAMPOS_RESERVADOS = ['cpf', 'pis', 'nascimento', 'cep', 'logradouro', 'numero', 'complemento', 'bairro', 'uf', 'socio', 'escolaridade', 'raca_cor', 'renda', 'pessoas_casa'];
  /* guarda documento só com números, UF em maiúsculas, e apaga o questionário se a pessoa não quis responder */
  function normalizarMembro(r) {
    ['cpf', 'pis', 'cep'].forEach(k => { if (r[k] != null) r[k] = soDigitos(r[k]); });
    if (r.uf) r.uf = String(r.uf).toUpperCase().trim();
    if (!r.socio) { r.socio = false; ['escolaridade', 'raca_cor', 'renda', 'pessoas_casa'].forEach(k => { r[k] = ''; }); }
    return r;
  }
  function validarDadosPessoais(r) {
    if (r.cpf && !cpfValido(r.cpf)) return 'O CPF informado não é válido. Confira os números.';
    if (r.pis && soDigitos(r.pis).length !== 11) return 'O PIS/NIS/PASEP tem 11 números.';
    if (r.cep && soDigitos(r.cep).length !== 8) return 'O CEP tem 8 números.';
    if (r.nascimento && (r.nascimento < '1900-01-02' || r.nascimento >= iso(new Date()))) return 'Confira a data de nascimento.';
    if (r.nascimento && r.inicio && r.nascimento >= r.inicio) return 'A data de nascimento não pode ser depois do início da bolsa.';
    if (r.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.email)) return 'Confira o e-mail.';
    if (r.telefone && !/^\d{10,11}$/.test(soDigitos(r.telefone).replace(/^55(?=\d{10,11}$)/, ''))) return 'Confira o telefone: DDD e número, com 10 ou 11 algarismos.';
    if (r.renda !== '' && r.renda != null && !(Number(r.renda) >= 0)) return 'A renda precisa ser um número positivo.';
    if (r.pessoas_casa !== '' && r.pessoas_casa != null && !(Number.isInteger(Number(r.pessoas_casa)) && r.pessoas_casa >= 1 && r.pessoas_casa <= 40)) return 'Pessoas na casa: informe um número de 1 a 40.';
    return '';
  }
  /* vagas do plano de trabalho por função (formador(a): por atividade, sem número fixo) */
  const VAGAS = { coordenacao: 1, auxiliar: 1, discente: 3 };
  /* obrigatórios do cadastro da equipe (padrão do Mulheres & Quintais). Cadastro antigo sem CPF, celular ou e-mail continua
     podendo ser editado; o que já foi informado não pode ser apagado. */
  function obrigatoriosMembro(r, anterior) {
    const tem = k => String(r[k] == null ? '' : r[k]).trim() !== '', tinha = k => !anterior || String(anterior[k] == null ? '' : anterior[k]).trim() !== '';
    if (String(r.nome || '').trim().split(/\s+/).filter(Boolean).length < 2) return 'Informe o nome completo (nome e sobrenome).';
    if (!tem('cpf') && tinha('cpf')) return 'Informe o CPF.';
    if (!tem('telefone') && tinha('telefone')) return 'Informe o celular com WhatsApp.';
    if (!tem('email') && tinha('email')) return 'Informe o e-mail: é o login no sistema.';
    if (r.siape && !/^\d{5,8}$/.test(soDigitos(r.siape))) return 'A matrícula SIAPE tem de 5 a 8 números.';
    if (r.nascimento && r.inicio) { const d = new Date(r.nascimento + 'T12:00:00'); d.setFullYear(d.getFullYear() + 16); if (iso(d) > r.inicio) return 'Confira a data de nascimento: a pessoa precisa ter pelo menos 16 anos no início da bolsa.'; }
    if (r.socio && ['escolaridade', 'raca_cor', 'renda', 'pessoas_casa'].some(k => !tem(k))) return 'Questionário socioeconômico: responda as quatro perguntas ou desmarque o questionário.';
    return '';
  }
  /* o que a pessoa envia pelo link: nome e termo são obrigatórios; o resto é conferido se vier */
  function validarConvite(r, funcao) {
    if (String(r.nome || '').trim().split(/\s+/).filter(Boolean).length < 2) return 'Informe o nome completo (nome e sobrenome).';
    if (!r.cpf) return 'Informe o CPF.'; if (!r.telefone) return 'Informe o celular com WhatsApp.'; if (!r.email) return 'Informe o e-mail: será o seu login no sistema.';
    if (r.arlo !== 'Sim' && !r.nascimento) return 'Informe a data de nascimento (a FUNCERN pede para o cadastro no Arlo).';
    if (['discente', 'formador'].includes(funcao) && ['agricultor', 'atua_af', 'zona_rural', 'celular_internet'].some(k => !r[k])) return 'Responda as perguntas do “Perfil no campo”.';
    { const ob = obrigatoriosMembro(Object.assign({}, r, { inicio: '' }), null); if (ob) return ob; }
    const m = validarDadosPessoais(r); if (m) return m;
    if (!r.lgpd) return 'Para enviar, marque que você leu e concorda com o uso dos dados.';
    return '';
  }
  /* equipe: quem está em cada função hoje e quem já saiu (fim preenchido e já passado) */
  const ativo = (m, hojeIso) => !m.fim || m.fim > hojeIso;
  function equipePorFuncao(db, funcao, hojeIso) {
    const L = (db.membros || []).filter(m => m.funcao === funcao);
    return { ativos: L.filter(m => ativo(m, hojeIso)).sort((a, b) => a.inicio < b.inicio ? -1 : 1), antigos: L.filter(m => !ativo(m, hojeIso)).sort((a, b) => a.fim < b.fim ? 1 : -1) };
  }
  const MSG_CONFLITO = 'Este registro foi alterado por outra pessoa depois que você abriu. Feche, confira como ficou e faça a sua alteração de novo.';
  const MSG_EXCLUIDO = 'Este registro foi excluído por outra pessoa enquanto você editava.';
  /* ---------- mensagens de erro do servidor em português de gente ---------- */
  function mensagemErro(e) {
    const m = String((e && (e.message || e.error_description || e.msg)) || e || ''), c = e && e.code;
    if (c === 'P0001') return m;   // mensagem escrita por nós no banco
    if (c === '23503') return /insert|update/i.test(m) ? 'Este registro aponta para um cadastro que não existe mais (lote, biofábrica ou unidade produtiva excluída). Confira e escolha de novo.' : 'Este registro está em uso em outro cadastro e não pode ser excluído.';
    if (c === '23505') return 'Já existe um registro igual a este.';
    if (c === '22P02') return 'Algum número foi digitado com vírgula ou letra onde só cabe número inteiro. Confira e tente de novo.';
    if (c === '23514' || c === '23502') return 'Algum campo ficou em branco ou com valor fora do permitido. Confira e tente de novo.';
    if (c === '42501' || /row-level security|permission denied/i.test(m)) return 'O seu perfil não tem permissão para fazer isso.';
    if (/Invalid login credentials/i.test(m)) return 'E-mail ou senha incorretos.';
    if (/Email not confirmed/i.test(m)) return 'Falta confirmar o e-mail: abra a mensagem que o sistema enviou e toque no link.';
    if (/already registered/i.test(m)) return 'Este e-mail já tem senha criada. Use “Já tenho senha” ou “Esqueci a senha”.';
    if (/rate limit|security purposes/i.test(m)) return 'Muitas tentativas seguidas. Espere um minuto e tente de novo.';
    if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return 'Sem conexão com o servidor. Confira a internet e tente de novo.';
    if (/Password should be/i.test(m)) return 'A senha precisa ter pelo menos 8 caracteres.';
    return m || 'Não foi possível concluir. Tente de novo.';
  }

  SQC.regras = { pd, iso, dias, fimMes, vazio, distribuido, saldo, pronto, codigoLote, nCheck, proximoPasso, visitasDe, recebeu, acompanhada, feito, previstoEtapa, execucaoGeral,
    novoDesenho, venceu, MSG_CONFLITO, MSG_EXCLUIDO, recebido, previstoMeta, fin, finRubrica, finItens, equipePorFuncao, cpfValido, soDigitos, normalizarMembro, validarDadosPessoais, validarConvite, CAMPOS_CONVITE, CAMPOS_RESERVADOS, nrm, lerSolicitacoes, planoImportacao, rubricaDaFuncern, itemDaFuncern, destinoStatus, numSol, valorPlanilha, dataPlanilha, soma, desembolsoMensal, ritmo, tempoDecorrido, alertas, indicadores, validar, REFS, emUso, RESTRITAS, PERFIS, NOME_PERFIL, VAGAS, obrigatoriosMembro, podeGravar, podeExcluir, mensagemErro, brl, dt };
})();
;
/* ===== planilha.js ===== */
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
;
/* ===== fila.js ===== */
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
    async ler(id) { return await tx('readonly', l => l ? l.get(id) : { result: memoria.get(id) }); },
    async salvar(item) {
      if (!item.versao) item.versao = Date.now() + '-' + Math.random().toString(36).slice(2);   // cada lançamento tem versão própria
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
          // enquanto este envio corria, a pessoa pode ter corrigido o mesmo registro (mesma chave, versão nova):
          // aí o item da fila é o novo e não pode ser apagado nem sobrescrito pelo resultado do antigo
          const atual = async () => { const x = await F.ler(it.id); return !!x && x.versao === it.versao; };
          try { await api.salvar(it.tabela, it.dados, it.op || {}); if (await atual()) await F.remover(it.id); enviados++; }
          catch (e) {
            if (e.semRede) break;
            if (!(await atual())) continue;
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
;
/* ===== api-demo.js ===== */
/* Saberes que Cultivam — modo demonstração: sem servidor, dados só neste navegador.
   Vale quando js/config.js está com supabaseUrl vazio. Serve para conhecer e testar as telas.
   Os registros marcados com ex:1 são FICTÍCIOS (aparecem com a etiqueta "exemplo"). */
(function () {
  const G = typeof window !== 'undefined' ? window : globalThis;
  const SQC = (G.SQC = G.SQC || {});
  const R = SQC.regras, D = SQC.dados;
  const SIM = SQC.SIMULACAO, CHAVE = SIM ? 'sqc-sim-v1-' + SIM.dia : 'sqc-demo-v1';   // simulação (js/simulacao.js): guarda à parte, uma por data
  const mem = {};   // usado quando o navegador bloqueia o armazenamento (e nos testes)
  const ler = k => { try { const v = G.localStorage.getItem(k); return v == null ? (k in mem ? mem[k] : null) : v; } catch (e) { return k in mem ? mem[k] : null; } };
  const gravar = (k, v) => { mem[k] = v; try { G.localStorage.setItem(k, v); } catch (e) { /* fica só na memória */ } };

  const semente = hoje => SIM && SQC.simular ? SQC.simular(sementeBase(hoje)) : sementeBase(hoje);
  function sementeBase(hoje) {
    hoje = hoje || new Date(); const atras = n => R.iso(new Date(hoje.getTime() - n * 864e5));
    return {
      membros: [
        { id: 'q1', ex: 1, lgpd: true, arlo: 'Sim', outra_bolsa: 'Não', funcao: 'coordenacao', nome: 'Coordenador de exemplo', vinculo: 'IFRN Campus Apodi', email: 'coordenacao@exemplo.br', telefone: '(00) 00000-0000', municipio: 'Apodi/RN', inicio: '2026-08-01' },
        { id: 'q2', ex: 1, lgpd: true, funcao: 'discente', nome: 'Bolsista de exemplo (saiu)', vinculo: 'Tecnologia em Agroecologia', inicio: '2026-08-10', fim: atras(20), motivo: 'Concluiu o curso' }],
      pessoas: [
        { id: 'p-coord', nome: 'Coordenação (demonstração)', email: 'coordenacao@exemplo.br', perfil: 'Coordenação', ativo: true },
        { id: 'p-equipe', nome: 'Equipe (demonstração)', email: 'equipe@exemplo.br', perfil: 'Equipe', ativo: true },
        { id: 'p-mda', nome: 'Acompanhamento (demonstração)', email: 'acompanhamento@exemplo.br', perfil: 'Acompanhamento', orgao: 'SEAB/MDA', ativo: true },
        { id: 'p-aux', nome: 'Auxiliar administrativo (demonstração)', email: 'auxiliar@exemplo.br', perfil: 'Auxiliar', ativo: true },
        { id: 'p-form', nome: 'Formador(a) (demonstração)', email: 'formador@exemplo.br', perfil: 'Formador', ativo: true }],
      unidades: [
        { id: 'u1', nome: 'Polo São Paulo do Potengi', sigla: 'SPP', municipio: 'São Paulo do Potengi', uf: 'RN', territorio: 'Potengi/RN', modelo: 'A definir', conta: 'Sim', parceiro: '', responsavel: '', obs: 'Ata 22/2026: microrganismos isolados se houver local adequado; senão, área aberta com cobertura.' },
        { id: 'u2', nome: 'Polo Mulungu', sigla: 'MUL', municipio: 'Mulungu', uf: 'CE', territorio: 'Maciço de Baturité/CE', modelo: 'A definir', conta: 'Sim', parceiro: '', responsavel: '', obs: 'Ata 22/2026: mesma regra do polo de São Paulo do Potengi.' },
        { id: 'u3', nome: 'Base IFRN Campus Apodi (minhocário)', sigla: 'APO', municipio: 'Apodi', uf: 'RN', territorio: 'Outro', modelo: 'Área aberta com cobertura (compostagem e biofertilizantes)', conta: 'Não', parceiro: 'IFRN Campus Apodi', responsavel: '', local_ok: true, parceiro_ok: true, obs: 'Área da fazenda com piso concretado; laboratório do campus como apoio.' }],
      itens: [],
      lotes: [
        { id: 'l1', ex: 1, codigo: 'APO-HUM-001', unidade: 'u3', tipo: 'Húmus de minhoca', inicio: atras(70), dias: 60, qtd: 180, med: 'kg', insumos: 'Esterco bovino curtido, restos de capina', responsavel: '', status: 'Pronto', obs: 'Odor de terra, sem aquecimento' },
        { id: 'l2', ex: 1, codigo: 'APO-BIO-001', unidade: 'u3', tipo: 'Biofertilizante líquido', inicio: atras(12), dias: 30, qtd: 200, med: 'L', insumos: 'Esterco fresco, melaço, leite, cinzas, água sem cloro', responsavel: '', status: 'Maturando', obs: '' }],
      agricultores: [
        { id: 'a1', ex: 1, nome: 'Maria das Dores (exemplo)', comunidade: 'Assentamento vizinho ao campus', municipio: 'Apodi', uf: 'RN', territorio: 'Outro', unidade: 'u3', culturas: 'Hortaliças, milho, feijão', area: 1.5, quimico: 'Parcial', gasto0: 180, diag: atras(60), kit: true, kitdata: atras(20) },
        { id: 'a2', ex: 1, nome: 'José Raimundo (exemplo)', comunidade: 'Assentamento vizinho ao campus', municipio: 'Apodi', uf: 'RN', territorio: 'Outro', unidade: 'u3', culturas: 'Banana, macaxeira', area: 2, quimico: 'Sim', gasto0: 320, diag: atras(60), kit: false, kitdata: '' },
        { id: 'a3', ex: 1, nome: 'Francisca Lima (exemplo)', comunidade: 'Sítio Lagoa', municipio: 'Apodi', uf: 'RN', territorio: 'Outro', unidade: 'u3', culturas: 'Hortaliças', area: 0.5, quimico: 'Não', gasto0: 0, diag: '', kit: false, kitdata: '' }],
      distribuicoes: [
        { id: 'd1', ex: 1, data: atras(8), lote: 'l1', agricultor: 'a1', qtd: 40, cultura: 'Hortaliças', area: 0.3, forma: 'No solo' },
        { id: 'd2', ex: 1, data: atras(45), lote: 'l1', agricultor: 'a2', qtd: 60, cultura: 'Banana', area: 0.5, forma: 'No solo' }],
      visitas: [
        { id: 'v1', ex: 1, data: atras(2), agricultor: 'a1', tecnico: '', usou: 'Sim', vigor: 4, gasto: 120, obs: 'Canteiros com melhor retenção de umidade', problemas: '' }],
      eventos: [
        { id: 'e1', tipo: 'Articulação', data: '2026-09-03', tema: 'Encontro da Rede BioAF (SEAB/MDA) na Expointer', lugar: 'Parque de Exposições Assis Brasil', municipio: 'Esteio/RS', part: '', mulheres: '', link: '', obs: 'Participação da coordenação, 03 e 04/09/2026.' },
        { id: 'e2', tipo: 'Reunião', data: '2026-09-08', tema: 'Informes da Rede BioAF e planejamento das unidades de produção', lugar: 'Google Meet', municipio: '', part: 2, mulheres: 0, link: '', obs: 'Ata 22/2026 - DG/AP/RE/IFRN.' }],
      despesas: [
        { id: 'x1', ex: 1, data: atras(25), etapa: '3.1', rubrica: 'servicos_pj', item: 'i09', descricao: 'Impressão de cartilhas (exemplo)', favorecido: 'Gráfica', doc: 'NF 0000', valor: 1800, status: 'Pago' },
        { id: 'x2', ex: 1, data: atras(10), etapa: '6.1', rubrica: 'consumo', descricao: 'Material para feira e oficinas (exemplo)', favorecido: '', doc: '', valor: 2400, status: 'Em compras na FUNCERN' }],
      presencas: [], fotos: [],
      entregas: [
        { id: 'g1', etapa: '6.3', titulo: 'Contrato 220/2026 com a FUNCERN; 1ª parcela de R$ 200.000,00 liquidada (2026NS001323)', data: '2026-09-22', link: '', obs: 'Contrato assinado em 20/08/2026.' }]
    };
  }

  let db = null, eu = null;
  function carregarLocal() {
    if (SIM && SQC.simularPlano) SQC.simularPlano();
    try { db = JSON.parse(ler(CHAVE)); } catch (e) { db = null; }
    const s = semente(); if (!db || !Array.isArray(db.unidades)) db = s;
    D.TABELAS.forEach(t => { if (!Array.isArray(db[t])) db[t] = s[t]; });
    ['Acompanhamento', 'Auxiliar', 'Formador'].forEach(pf => { if (!db.pessoas.some(p => p.perfil === pf)) db.pessoas.push(s.pessoas.find(p => p.perfil === pf)); });   // demonstração criada antes desses perfis existirem
    return db;
  }
  const persistir = () => gravar(CHAVE, JSON.stringify(db));
  const falha = msg => { const e = new Error(msg); e.code = 'P0001'; return e; };

  SQC.apiDemo = {
    modo: 'demo', semente,
    async iniciar() {
      carregarLocal(); const id = ler(CHAVE + '-eu'); eu = db.pessoas.find(p => p.id === id && p.ativo !== false) || null; return eu;
    },
    async entrarDemo(perfil) {
      carregarLocal(); eu = db.pessoas.find(p => p.perfil === perfil && p.ativo !== false) || null;
      if (!eu) throw falha('Não há acesso ativo com esse perfil na demonstração.');
      gravar(CHAVE + '-eu', eu.id); return eu;
    },
    async atualizarMeusContatos(telefone, municipio) {
      if (!db) carregarLocal(); const e = String((eu && eu.email) || '').trim().toLowerCase(), hj = new Date().toISOString().slice(0, 10);
      const L = db.membros.filter(m => String(m.email || '').trim().toLowerCase() === e && (!m.fim || m.fim >= hj));
      if (!L.length) throw falha('Seu cadastro na equipe não está ligado a este e-mail. Peça à coordenação para conferir o e-mail no cadastro.');
      L.forEach(m => { m.telefone = telefone || null; m.municipio = municipio || null; m.atualizado_em = new Date().toISOString(); }); persistir();
    },
    async habilitar(id, arlo, termoEm) {
      if (!eu || !['Coordenação', 'Auxiliar'].includes(eu.perfil)) throw falha('Só a coordenação e o auxiliar administrativo marcam a habilitação.');
      const m = db.membros.find(x => x.id === id); if (!m) throw falha(R.MSG_EXCLUIDO);
      m.arlo = arlo || null; m.termo_em = termoEm || null; m.atualizado_em = new Date().toISOString(); persistir(); return JSON.parse(JSON.stringify(m));
    },
    /* foto da equipe na demonstração: guardada no próprio navegador (imagem pequena, 320 px) */
    async fotoEquipe(caminho) { return caminho; },
    async trocarFotoEquipe(membro, blob) {
      if (!eu || !(eu.perfil === 'Coordenação' || (db.membros.find(m => m.id === membro) || {}).email === eu.email)) throw falha('Só a própria pessoa ou a coordenação trocam esta foto.');
      const url = await new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => no(falha('Não foi possível ler a foto.')); r.readAsDataURL(blob); });
      const m = db.membros.find(x => x.id === membro); m.foto = url; persistir(); return url;
    },
    async tirarFotoEquipe(membro) { const m = db.membros.find(x => x.id === membro); if (m) { m.foto = null; persistir(); } },
    async sair() { eu = null; gravar(CHAVE + '-eu', ''); },
    /* igual ao banco de verdade: quem acompanha de fora recebe as unidades produtivas numeradas e as visitas sem texto livre */
    async carregar() {
      const c = JSON.parse(JSON.stringify(carregarLocal()));
      const pf = eu ? eu.perfil : '';
      if (pf === 'Auxiliar' || pf === 'Formador') {   // como no banco (23): unidades produtivas numeradas, visitas sem texto; cada um só o que é seu
        c.agricultores = [...c.agricultores].sort((a, b) => String(a.criado_em || '') < String(b.criado_em || '') ? -1 : 1).map((a, i) => ({ id: a.id, nome: 'Unidade produtiva ' + String(i + 1).padStart(2, '0'), municipio: a.municipio, uf: a.uf, territorio: a.territorio, unidade: a.unidade, area: a.area, diag: a.diag, quimico: a.quimico, gasto0: a.gasto0, kit: a.kit, kitdata: a.kitdata, criado_em: a.criado_em, ex: a.ex }));
        c.visitas = c.visitas.map(v => ({ id: v.id, data: v.data, agricultor: v.agricultor, usou: v.usou, vigor: v.vigor, gasto: v.gasto, ex: v.ex }));
        c.pessoas = c.pessoas.filter(p => p.id === eu.id);
        if (pf === 'Auxiliar') { c.presencas = []; c.fotos = []; c.eventos = c.eventos.map(e => { const x = Object.assign({}, e); delete x.link; delete x.obs; return x; }); }
        else { c.despesas = []; c.membros = []; c.fotos = c.fotos.filter(f => f.tabela === 'eventos'); c.itens = c.itens.map(i => { const x = Object.assign({}, i); delete x.valor; delete x.rubrica; return x; }); }
      }
      if (eu && eu.perfil === 'Acompanhamento') {
        c.agricultores = c.agricultores.map((a, i) => ({ id: a.id, nome: 'Unidade produtiva ' + String(i + 1).padStart(2, '0'), municipio: a.municipio, uf: a.uf, territorio: a.territorio, unidade: a.unidade, area: a.area, diag: a.diag, quimico: a.quimico, gasto0: a.gasto0, kit: a.kit, kitdata: a.kitdata, ex: a.ex }));
        c.visitas = c.visitas.map(v => ({ id: v.id, data: v.data, agricultor: v.agricultor, usou: v.usou, vigor: v.vigor, gasto: v.gasto, ex: v.ex }));
        c.pessoas = c.pessoas.filter(p => p.id === eu.id); c.membros = []; c.presencas = []; c.fotos = [];
        c.despesas = []; c.itens = c.itens.map(i => { const x = Object.assign({}, i); delete x.valor; delete x.rubrica; return x; });   // como no banco (script 16): sem despesas; itens sem valor
        c.eventos = c.eventos.map(e => { const x = Object.assign({}, e); delete x.link; delete x.obs; return x; });   // como no banco (script 15)
      }
      if (eu && !['Coordenação', 'Auxiliar'].includes(eu.perfil)) c.membros = c.membros.map(m => { const x = Object.assign({}, m); R.CAMPOS_RESERVADOS.forEach(k => { delete x[k]; }); return x; });   // como no banco: dado reservado só para a coordenação
      return c;
    },
    async salvar(tabela, reg) {
      if (!db) carregarLocal();
      if (!R.podeGravar(eu, tabela)) throw falha('O seu perfil não tem permissão para fazer isso.');
      const i = db[tabela].findIndex(x => x.id === reg.id); const ant = i >= 0 ? db[tabela][i] : null;
      const r = Object.assign({}, ant || {}, reg); delete r._pendente; delete r._erro;
      const msg = R.validar(db, tabela, r, ant); if (msg) throw falha(msg);
      if (!ant) { r.id = r.id || SQC.novoId(); r.criado_por = eu.id; r.criado_em = new Date().toISOString(); if (tabela === 'lotes') r.codigo = R.codigoLote(db, r); }
      else { r.criado_por = ant.criado_por; r.criado_em = ant.criado_em; if (tabela === 'lotes') r.codigo = ant.codigo; }
      r.atualizado_em = new Date().toISOString();
      if (ant) db[tabela][i] = r; else db[tabela].push(r);
      persistir(); if (eu && r.id === eu.id) eu = r;
      return JSON.parse(JSON.stringify(r));
    },
    async excluir(tabela, id) {
      const r = db[tabela].find(x => x.id === id); if (!r) return;
      if (tabela === 'pessoas') throw falha('Acesso não se exclui: desative.');
      if (!R.podeExcluir(eu, tabela, r)) throw falha('Só a coordenação ou quem lançou pode excluir este registro.');
      if (R.emUso(db, tabela, id).length) { const e = new Error('em uso'); e.code = '23503'; throw e; }
      db[tabela] = db[tabela].filter(x => x.id !== id); persistir();
    },
    /* demonstração: alguns registros fictícios, montados com os dados de exemplo, para mostrar como o histórico aparece */
    async auditoria(limite, antes) {
      if (!db) carregarLocal(); if (antes) return [];
      const quem = (db.pessoas.find(p => p.perfil === 'Coordenação') || {}).id, eqp = (db.pessoas.find(p => p.perfil === 'Equipe') || {}).id, h = Date.now(), H = [];
      const em = horas => new Date(h - horas * 3600e3).toISOString(), l = db.lotes[0], u = db.unidades[0], v = db.visitas[0];
      if (l) H.push({ id: 1, tabela: 'lotes', registro_id: l.id, acao: 'UPDATE', por: eqp, em: em(2), antes: Object.assign({}, l, { status: 'Maturando' }), depois: l });
      H.push({ id: 2, tabela: 'planilhas', acao: 'PLANILHA', por: quem, em: em(5), depois: { tipo: 'agricultores', qtd: db.agricultores.length } });
      if (v) H.push({ id: 3, tabela: 'visitas', registro_id: v.id, acao: 'INSERT', por: eqp, em: em(27), depois: v });
      if (u) H.push({ id: 4, tabela: 'unidades', registro_id: u.id, acao: 'UPDATE', por: quem, em: em(50), antes: Object.assign({}, u, { local_ok: false }), depois: u });
      H.push({ id: 5, tabela: 'planilhas', acao: 'PLANILHA', por: quem, em: em(75), depois: { tipo: 'json', qtd: D.TABELAS.reduce((t, k) => t + (db[k] || []).length, 0) } });
      return H.slice(0, limite || 200);
    },
    async registrarDownload() { /* a demonstração não guarda histórico */ },
    async informarFila() {},
    async listarFila() {   // demonstração: um exemplo fixo, para a coordenação ver como aparece
      if (!eu || eu.perfil !== 'Coordenação' || SIM) return [];
      return [{ pessoa: 'p-equipe', nome: 'Equipe (demonstração)', quantos: 3, recusados: 1, desde: new Date(Date.now() - 3 * 864e5).toISOString(), informado_em: new Date(Date.now() - 2 * 3600e3).toISOString(), ex: 1 }];
    },
    /* fotos na demonstração: a imagem fica só na memória desta página (não ocupa o armazenamento do navegador) */
    _img: {},
    async enviarFoto(tabela, registro, blob, tiradaEm, legenda) {
      if (!R.podeGravar(eu, 'fotos')) throw falha('O seu perfil não tem permissão para fazer isso.');
      if (!(db[tabela] || []).some(x => x.id === registro)) throw falha('A atividade ou visita desta foto não existe mais.');
      const id = SQC.novoId(); this._img[id] = blob;
      return this.salvar('fotos', { id, tabela, registro, caminho: `${tabela}/${registro}/${id}.jpg`, tirada_em: tiradaEm || null, legenda: legenda || null });
    },
    async arquivoFoto(f) { if (!this._img[f.id]) throw falha('Na demonstração a imagem fica só enquanto a página está aberta.'); return this._img[f.id]; },
    async excluirFoto(f) { await this.excluir('fotos', f.id); delete this._img[f.id]; },
    /* link de cadastro, simulado neste navegador (na demonstração o "banco" é o próprio aparelho) */
    preparar() {},
    _cv(g) { const K = 'sqc-demo-convites'; let l = []; try { l = JSON.parse(ler(K)) || []; } catch (e) { l = []; } if (g) { const n = g(l); gravar(K, JSON.stringify(n)); return n; } return l; },
    async convites() { if (!eu || eu.perfil !== 'Coordenação') return []; return this._cv().filter(c => c.status === 'preenchido' || (c.status === 'aberto' && new Date(c.expira_em) > new Date())).map(c => ({ id: c.id, funcao: c.funcao, status: c.status, dados: c.dados, expira_em: c.expira_em, preenchido_em: c.preenchido_em, criado_em: c.criado_em })); },
    async criarConvite(funcao) { if (!eu || eu.perfil !== 'Coordenação') throw falha('Só a coordenação gera link de cadastro.'); const token = (SQC.novoId() + SQC.novoId()).replace(/-/g, '');
      this._cv(l => l.concat([{ id: SQC.novoId(), funcao, token, status: 'aberto', dados: null, expira_em: new Date(Date.now() + 7 * 864e5).toISOString(), criado_em: new Date().toISOString() }])); return token; },
    async conviteVer(token) { const c = this._cv().find(x => x.token === token && x.status === 'aberto' && new Date(x.expira_em) > new Date()); return c ? c.funcao : null; },
    async conviteEnviar(token, dados) { let ok = false; const limpo = {}; R.CAMPOS_CONVITE.forEach(k => { if (k in dados && String(dados[k]).length <= 300) limpo[k] = dados[k]; });
      const fn = (this._cv().find(x => x.token === token) || {}).funcao; const msg = R.validarConvite(limpo, fn); if (msg) throw falha(msg);
      this._cv(l => l.map(c => { if (c.token === token && c.status === 'aberto' && new Date(c.expira_em) > new Date()) { ok = true; return Object.assign({}, c, { status: 'preenchido', dados: limpo, preenchido_em: new Date().toISOString() }); } return c; }));
      if (!ok) throw falha('Este link já foi usado ou venceu. Peça outro à coordenação do projeto.'); },
    async conviteEncerrar(id, status) { if (!eu || eu.perfil !== 'Coordenação') throw falha('Só a coordenação encerra convite.'); this._cv(l => l.map(c => c.id === id ? Object.assign({}, c, { status, dados: null }) : c)); },
    async acessos() { if (!db) carregarLocal(); return eu && eu.perfil === 'Coordenação' ? db.pessoas.map((p, i) => ({ id: p.id, nome: p.nome, perfil: p.perfil, orgao: p.orgao, ativo: p.ativo !== false, ultimo: p.id === eu.id ? new Date().toISOString() : i === 1 ? new Date(Date.now() - 12 * 864e5).toISOString() : null })) : []; },
    /* só na demonstração */
    async apagarExemplos() {
      ['distribuicoes', 'visitas', 'lotes', 'agricultores', 'eventos', 'entregas', 'itens', 'despesas', 'membros'].forEach(t => { db[t] = db[t].filter(r => !r.ex); });
      db.distribuicoes = db.distribuicoes.filter(x => db.lotes.some(l => l.id === x.lote) && db.agricultores.some(a => a.id === x.agricultor));
      db.visitas = db.visitas.filter(x => db.agricultores.some(a => a.id === x.agricultor));
      db.presencas = (db.presencas || []).filter(x => db.eventos.some(e => e.id === x.evento));
      db.fotos = (db.fotos || []).filter(x => (db[x.tabela] || []).some(r => r.id === x.registro)); persistir();
    },
    async recomecar() { const p = db.pessoas; db = semente(); db.pessoas = p; persistir(); },
    _db: () => db, _zerar() { db = null; eu = null; Object.keys(mem).forEach(k => delete mem[k]); try { G.localStorage.removeItem(CHAVE); G.localStorage.removeItem(CHAVE + '-eu'); } catch (e) {} }
  };
})();
;
/* ===== api-supabase.js ===== */
/* Saberes que Cultivam — modo produção: Supabase (login com e-mail e senha; dados no banco com regras de acesso).
   Quem decide o que cada perfil pode é o banco (supabase/01_criar_banco.sql). Aqui só se pede e se traduz o erro. */
(function () {
  const SQC = (window.SQC = window.SQC || {});
  const R = SQC.regras, D = SQC.dados;
  let sb = null, euCache = null, semItem = false;   // semItem: o banco ainda não tem a coluna "item" em despesas (falta rodar o script 06)
  const CHAVE_EU = 'sqc-eu', CHAVE_DADOS = 'sqc-dados', CHAVE_QUANDO = 'sqc-dados-em';
  const PRAZO_OFFLINE = 72 * 3600 * 1000;   // sem falar com o servidor há mais de 72 h, o aparelho não abre os dados guardados
  // passou do prazo: a cópia não serve mais e é apagada (não fica guardada no aparelho sem uso)
  const copiaValida = () => { const t = +ler(CHAVE_QUANDO) || 0, ok = t > 0 && Date.now() - t < PRAZO_OFFLINE;
    if (!ok && t > 0) { guardar(CHAVE_DADOS, null); guardar(CHAVE_QUANDO, null); } return ok; };

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
    visitas: ['data', 'agricultor', 'tecnico', 'usou', 'vigor', 'gasto', 'obs', 'problemas', 'lat', 'lng', 'precisao'],
    eventos: ['tipo', 'data', 'tema', 'lugar', 'municipio', 'part', 'mulheres', 'link', 'obs'],
    entregas: ['etapa', 'titulo', 'data', 'link', 'obs'],
    membros: ['funcao', 'nome', 'nome_social', 'vinculo', 'siape', 'email', 'telefone', 'municipio', 'outra_bolsa', 'arlo', 'experiencia', 'lgpd', 'organizacao', 'agricultor', 'atua_af', 'zona_rural', 'celular_internet'].concat(R.CAMPOS_RESERVADOS).concat(['inicio', 'fim', 'motivo', 'obs', 'termo_em']),
    despesas: ['data', 'etapa', 'rubrica', 'item', 'descricao', 'favorecido', 'doc', 'valor', 'status'],
    presencas: ['evento', 'nome', 'comunidade', 'municipio', 'mulher', 'agricultor'],
    fotos: ['tabela', 'registro', 'caminho', 'tirada_em', 'legenda']
  };
  const BOOL = ['ativo', 'kit', 'lgpd', 'socio', 'mulher'].concat(D.CHECK.map(c => c[0]));
  /* membros: os dados reservados (CPF, endereço, renda…) não podem ser lidos direto da tabela por ninguém: a leitura pede só as colunas abertas,
     e a coordenação recebe o resto pela função membros_reservados(). "semCompleto" = o banco ainda não tem as colunas do script 10. */
  let semCompleto = false;
  let semFoto = false;   // o banco ainda não tem a coluna da foto (falta rodar o script 24): lê sem ela
  const ABERTAS = () => ['id', 'criado_por', 'criado_em', 'atualizado_em'].concat(semFoto ? [] : ['foto']).concat(COLUNAS.membros.filter(k => !R.CAMPOS_RESERVADOS.includes(k))).join(',');
  const sel = t => t === 'membros' && !semCompleto ? ABERTAS() : '*';
  /* a cópia que fica no aparelho para trabalhar sem internet nunca leva os dados reservados da equipe (CPF, endereço, renda…) */
  const semReservado = db => Object.assign({}, db, { membros: (db.membros || []).map(m => { const x = Object.assign({}, m); R.CAMPOS_RESERVADOS.forEach(k => { delete x[k]; }); x._sr = true; return x; }) });   // _sr: "sem os reservados" — não pode ser regravado
  /* só as colunas da tabela; campo vazio vira nulo (o banco não aceita '' em número e data) */
  function limpar(tabela, o) {
    const r = { id: o.id };
    // membro vindo da cópia do aparelho não tem CPF, endereço etc.: nunca manda esses campos, senão o banco os apagaria
    const pula = tabela === 'membros' && o._sr ? R.CAMPOS_RESERVADOS : [];
    COLUNAS[tabela].forEach(k => { if (k === 'item' && semItem) return; if (pula.includes(k)) return; if (k in o) r[k] = BOOL.includes(k) ? !!o[k] : (o[k] === '' || o[k] === undefined ? null : o[k]); });
    return r;
  }
  /* o Supabase devolve no máximo 1.000 linhas por pedido: busca em partes até acabar */
  async function todas(tabela) {
    let tudo = [];
    for (let de = 0; de < 100000;) {
      let { data, error } = await sb.from(tabela).select(sel(tabela)).order('criado_em', { ascending: true }).order('id', { ascending: true }).range(de, de + 999);
      if (error && tabela === 'membros' && !semFoto && (error.code === '42703' || error.code === 'PGRST204') && /foto/.test(String(error.message))) { semFoto = true; de = 0; tudo = []; continue; }
      if (error && tabela === 'membros' && !semCompleto && (error.code === '42703' || error.code === 'PGRST204')) { semCompleto = true; de = 0; tudo = []; continue; }   // falta rodar o script 10: lê do jeito antigo
      if (error && (tabela === 'presencas' || tabela === 'fotos') && (error.code === '42P01' || error.code === 'PGRST205' || new RegExp(tabela).test(String(error.message)))) { SQC.apiSupabase.semEvidencias = true; return []; }   // falta rodar o script 13
      if (error && tabela === 'membros' && (error.code === '42P01' || error.code === 'PGRST205' || /membros/.test(String(error.message)))) { SQC.apiSupabase.semMembros = true; return []; }   // falta rodar o script 07: o resto do sistema abre normalmente
      if (error) throw erro(error);
      tudo = tudo.concat(data || []); de += (data || []).length;
      if (!data || data.length < 1000) break;
    }
    return tudo;
  }

  /* prazo em cada chamada ao servidor (trazido do Mulheres & Quintais, 12/10/2026): com sinal que engana (rede "conectada"
     que não responde) a chamada esperava para sempre e o botão ficava em "Salvando…". Passou de 30 s, conta como falta de
     internet: o lançamento vai para a fila do aparelho e é enviado depois. */
  SQC.prazoRede = 30000; SQC.prazoArquivo = 120000;
  function fetchComPrazo(url, op) {
    if (typeof AbortController === 'undefined') return fetch(url, op);
    const ctl = new AbortController(); let esgotou = false;
    const arquivo = /\/storage\/v1\/object/.test(String((url && url.url) || url)) && op && op.method && op.method !== 'GET', prazo = arquivo ? SQC.prazoArquivo : SQC.prazoRede;   // foto: 2 minutos
    const t = setTimeout(() => { esgotou = true; ctl.abort(); }, prazo);
    if (op && op.signal) { if (op.signal.aborted) ctl.abort(); else op.signal.addEventListener('abort', () => ctl.abort(), { once: true }); }   // quem chamou também pode cancelar
    return fetch(url, Object.assign({}, op, { signal: ctl.signal }))
      .catch(e => { if (esgotou) throw new TypeError('Failed to fetch: o servidor não respondeu em ' + Math.round(prazo / 1000) + ' segundos'); throw e; })
      .finally(() => clearTimeout(t));
  }
  SQC.fetchComPrazo = fetchComPrazo;
  SQC.apiSupabase = {
    modo: 'supabase', offline: false, recuperando: false,
    /* liga o cliente do banco sem entrar em conta nenhuma (o link de cadastro usa assim) */
    preparar() { if (!sb) sb = window.supabase.createClient(SQC.CONFIG.supabaseUrl, SQC.CONFIG.supabaseAnonKey, { global: { fetch: fetchComPrazo }, auth: { persistSession: true, detectSessionInUrl: true } }); },
    /* ----- "falta enviar" (script 14): o aparelho informa só a contagem do que guarda sem enviar; a coordenação vê a lista ----- */
    async informarFila(aparelho, quantos, recusados, desde) {
      const { error } = await sb.rpc('informar_fila', { p_aparelho: aparelho, p_quantos: quantos, p_recusados: recusados, p_desde: desde });
      if (error && !(error.code === 'PGRST202' || error.code === '42883')) throw erro(error);   // sem o script 14: não informa e segue
    },
    async listarFila() {   // null = o banco ainda não tem (falta o script 14)
      const { data, error } = await sb.rpc('listar_fila_celular');
      if (error && (error.code === 'PGRST202' || error.code === '42883')) return null;
      if (error) throw erro(error); return data || [];
    },
    /* ----- fotos de evidência (script 13): arquivo no Storage, pasta privada "evidencias"; a lista fica na tabela fotos ----- */
    async enviarFoto(tabela, registro, blob, tiradaEm, legenda) {
      // script 15: primeiro a linha (o banco só aceita arquivo com o caminho exato de uma linha sua), depois o arquivo.
      // Se o arquivo não subir, a linha sai; assim nunca sobra arquivo solto no Storage.
      const id = SQC.novoId(), caminho = `${tabela}/${registro}/${id}.jpg`, pasta = sb.storage.from('evidencias');
      const linha = await this._salvar('fotos', { id, tabela, registro, caminho, tirada_em: tiradaEm || null, legenda: legenda || null }, { novo: true });
      const up = await pasta.upload(caminho, blob, { contentType: 'image/jpeg', upsert: false, cacheControl: '0' });
      if (up.error) {
        await this.excluir('fotos', id).catch(() => {});
        const m = String(up.error.message || ''); throw erro(/bucket|not found/i.test(m) ? { code: 'P0001', message: 'As fotos ainda não foram ligadas no banco: a coordenação precisa rodar o script 13_presenca_e_fotos.sql no Supabase.' } : up.error);
      }
      return linha;
    },
    /* ----- foto de perfil da equipe (script 24): pasta privada "equipe", caminho <id da pessoa>/<código>.jpg ----- */
    _fotosEq: new Map(),
    async fotoEquipe(caminho) {
      if (this._fotosEq.has(caminho)) return this._fotosEq.get(caminho);
      const { data, error } = await sb.storage.from('equipe').download(caminho); if (error) throw erro(error);
      const u = URL.createObjectURL(data); this._fotosEq.set(caminho, u); return u;
    },
    async trocarFotoEquipe(membro, blob) {
      const caminho = `${membro}/${SQC.novoId()}.jpg`, pasta = sb.storage.from('equipe');
      const up = await pasta.upload(caminho, blob, { contentType: 'image/jpeg', upsert: false, cacheControl: '3600' });
      if (up.error) { const m = String(up.error.message || ''); throw erro(/bucket|not found/i.test(m) ? { code: 'P0001', message: 'A foto da equipe ainda não foi ligada no banco: a coordenação precisa rodar o script 24_foto_da_equipe.sql no Supabase.' } : up.error); }
      const { data: antes, error } = await sb.rpc('definir_foto', { p_membro: membro, p_caminho: caminho });
      if (error) { await pasta.remove([caminho]).catch(() => {}); throw erro(error); }
      if (antes) await pasta.remove([antes]).catch(() => {});
      return caminho;
    },
    async tirarFotoEquipe(membro) {
      const { data: antes, error } = await sb.rpc('definir_foto', { p_membro: membro, p_caminho: null }); if (error) throw erro(error);
      if (antes) await sb.storage.from('equipe').remove([antes]).catch(() => {});
    },
    async arquivoFoto(f) { const { data, error } = await sb.storage.from('evidencias').download(f.caminho);
      if (error && /not found|404|Object not found/i.test(String(error.message || error.statusCode || ''))) throw erro({ code: 'P0001', message: 'O arquivo desta foto não chegou ao servidor. Exclua e envie de novo.' });
      if (error) throw erro(error); return data; },
    async excluirFoto(f) {
      const rm = await sb.storage.from('evidencias').remove([f.caminho]); if (rm.error && !/not found/i.test(String(rm.error.message))) throw erro(rm.error);
      await this.excluir('fotos', f.id);
    },
    /* ----- link de cadastro da equipe ----- */
    async convites() {   // null = o banco ainda não tem a tabela (falta rodar o script 11)
      const { data, error } = await sb.from('convites').select('id,funcao,status,dados,expira_em,preenchido_em,criado_em').in('status', ['aberto', 'preenchido']).order('criado_em', { ascending: false });
      if (error && (error.code === '42P01' || error.code === 'PGRST205' || /convites/.test(String(error.message)))) return null;
      if (error) throw erro(error);
      return (data || []).filter(c => c.status === 'preenchido' || new Date(c.expira_em) > new Date());
    },
    async criarConvite(funcao) { const { data, error } = await sb.rpc('criar_convite', { p_funcao: funcao }); if (error) throw erro(error); return data; },
    async conviteVer(token) { this.preparar(); const { data, error } = await sb.rpc('convite_ver', { p_token: token }); if (error) throw erro(error); return data || null; },
    async conviteEnviar(token, dados) { this.preparar(); const { error } = await sb.rpc('convite_enviar', { p_token: token, p_dados: dados }); if (error) throw erro(error); },
    async conviteEncerrar(id, status) { const { error } = await sb.rpc('convite_encerrar', { p_id: id, p_status: status }); if (error) throw erro(error); },
    async iniciar() {
      // chegou por um link do e-mail (primeiro acesso ou senha esquecida)? então a próxima tela é a de criar a senha
      const h = String(location.hash || ''); const veioDeLink = /[#&]type=(signup|magiclink|recovery|invite)/.test(h);
      if (/[#&]error(_code|_description)?=/.test(h)) this.linkVencido = true;
      this.preparar();
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
    /* "Meus dados" (script 19): a pessoa muda só o próprio celular e município */
    /* habilitação na FUNCERN (Arlo e termo): só essas duas colunas vão ao banco (o 23 recusa o auxiliar mexer em outra) */
    async habilitar(id, arlo, termoEm, base) {
      let q = sb.from('membros').update({ arlo: arlo || null, termo_em: termoEm || null }).eq('id', id); if (base) q = q.eq('atualizado_em', base);
      const { data, error } = await q.select('id, arlo, termo_em, atualizado_em');
      if (error) { if (error.code === 'PGRST204' || error.code === '42703') throw erro({ code: 'P0001', message: 'Para marcar a habilitação, a coordenação precisa rodar antes o script 23_perfis_auxiliar_formador.sql no Supabase.' }); throw erro(error); }
      if (!data || !data.length) throw erro({ code: 'P0001', message: R.MSG_CONFLITO });
      return data[0];
    },
    async atualizarMeusContatos(telefone, municipio) {
      const { error } = await sb.rpc('atualizar_meus_contatos', { p_telefone: telefone || null, p_municipio: municipio || null });
      if (error) { if (error.code === 'PGRST202' || /atualizar_meus_contatos/.test(String(error.message))) throw erro({ code: 'P0001', message: 'Para atualizar os seus dados por aqui, a coordenação precisa rodar antes o script 19_meus_contatos.sql no Supabase.' }); throw erro(error); }
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
        const anon = async f => { const { data, error } = await sb.rpc(f); if (error) throw erro(error); return data || []; };
        const evFora = async () => { const { data, error } = await sb.rpc('eventos_acompanhamento'); if (error && (error.code === 'PGRST202' || error.code === '42883')) return todas('eventos'); if (error) throw erro(error); return data || []; };
        // itens das biofábricas (script 20): o SEAB/MDA recebe sem valor e sem rubrica; banco sem o 20 ainda: tira na chegada
        const itFora = async () => { const { data, error } = await sb.rpc('itens_acompanhamento'); if (error && (error.code === 'PGRST202' || error.code === '42883')) return (await todas('itens')).map(i => { const x = Object.assign({}, i); delete x.valor; delete x.rubrica; return x; }); if (error) throw erro(error); return data || []; };
        // o que cada perfil recebe (o banco corta igual; aqui só se pede o caminho certo):
        //   SEAB/MDA, auxiliar e formador(a): unidades produtivas numeradas e visitas sem texto livre;
        //   atividades sem link e observações para SEAB/MDA e auxiliar; itens sem valor para SEAB/MDA e formador(a);
        //   despesas e equipe: coordenação, equipe e auxiliar; listas de presença e fotos: coordenação, equipe e formador(a)
        const p = (euCache && euCache.perfil) || '', campoAnon = ['Acompanhamento', 'Auxiliar', 'Formador'].includes(p);
        const vazio = { membros: ['Acompanhamento', 'Formador'], despesas: ['Acompanhamento', 'Formador'], presencas: ['Acompanhamento', 'Auxiliar'], fotos: ['Acompanhamento', 'Auxiliar'] };
        const pedir = t => (vazio[t] || []).includes(p) ? [] : t === 'eventos' && ['Acompanhamento', 'Auxiliar'].includes(p) ? evFora() : t === 'itens' && ['Acompanhamento', 'Formador'].includes(p) ? itFora()
          : campoAnon && t === 'agricultores' ? anon('agricultores_anonimos') : campoAnon && t === 'visitas' ? anon('visitas_anonimas') : todas(t);
        const listas = await Promise.all(D.TABELAS.map(pedir));
        const db = {}; D.TABELAS.forEach((t, i) => { db[t] = listas[i]; });
        // dados reservados da equipe: só a coordenação recebe, por função própria do banco
        if (euCache && ['Coordenação', 'Auxiliar'].includes(euCache.perfil) && db.membros.length && !semCompleto) {
          const rs = await sb.rpc('membros_reservados'); if (rs.error && rs.error.code !== 'PGRST202' && rs.error.code !== '42883') throw erro(rs.error);
          (rs.data || []).forEach(x => { const m = db.membros.find(y => y.id === x.id); if (m) Object.assign(m, x); });
        }
        guardar(CHAVE_DADOS, semReservado(db)); guardar(CHAVE_QUANDO, Date.now()); this.offline = false; return db;
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
      try { const out = await this._salvar(tabela, reg, op); if (tabela === 'membros') R.CAMPOS_RESERVADOS.forEach(k => { if (k in reg) out[k] = reg[k]; }); return out; }
      catch (e) {
        // banco sem a coluna "item" (script 06 ainda não rodado): despesa sem item segue normalmente; com item, avisa o que falta
        const o = e.original || {};
        // banco sem o 23 (coluna termo_em): grava o resto e deixa a data do termo para depois
        if (tabela === 'membros' && (o.code === 'PGRST204' || o.code === '42703') && /termo_em/.test(String(o.message)) && COLUNAS.membros.includes('termo_em')) { COLUNAS.membros = COLUNAS.membros.filter(k => k !== 'termo_em'); return await this.salvar(tabela, reg, op); }
        if (tabela === 'membros' && (o.code === 'PGRST204' || o.code === '42703')) throw erro({ code: 'P0001', message: 'O cadastro da equipe ganhou campos novos e o banco ainda não os tem: a coordenação precisa rodar os scripts 08_equipe_dados.sql e 10_equipe_cadastro_completo.sql no Supabase.' });
        // banco sem as colunas da localização (script 18 ainda não rodado): a visita sem localização segue; com localização, avisa
        if (tabela === 'visitas' && (o.code === 'PGRST204' || /column .*(lat|lng|precisao)/i.test(String(o.message)))) {
          if (reg.lat != null) throw erro({ code: 'P0001', message: 'Para guardar a localização da visita, a coordenação precisa rodar antes o script 18_local_da_visita.sql no Supabase. Enquanto isso, apague a localização e salve.' });
          const sem = Object.assign({}, reg); delete sem.lat; delete sem.lng; delete sem.precisao; COLUNAS.visitas = COLUNAS.visitas.filter(k => !['lat', 'lng', 'precisao'].includes(k)); return await this._salvar(tabela, sem, op);
        }
        if (tabela !== 'despesas' || semItem || !(o.code === 'PGRST204' || /column .*item|'item' column/i.test(String(o.message)))) throw e;
        if (reg.item) throw erro({ code: 'P0001', message: 'Para indicar o item do plano na despesa, a coordenação precisa rodar antes o script 06_item_da_despesa.sql no Supabase. Enquanto isso, grave a despesa sem item.' });
        semItem = true; return await this._salvar(tabela, reg, op);
      }
    },
    async _salvar(tabela, reg, op) {
      op = op || {}; const r = limpar(tabela, reg); const { id, ...campos } = r;
      if (op.novo) {
        const ins = await sb.from(tabela).insert(r).select(sel(tabela)).single();
        if (!ins.error) return ins.data;
        if (ins.error.code !== '23505') throw erro(ins.error);
        // já existe com este id: é reenvio da fila (a primeira tentativa gravou e a resposta se perdeu); segue como edição sem versão
        const de = await sb.from(tabela).select('id').eq('id', id).maybeSingle();
        if (de.error || !de.data) throw erro(ins.error);
        op = {};
      }
      let q = sb.from(tabela).update(campos).eq('id', id); if (op.base) q = q.eq('atualizado_em', op.base);
      const up = await q.select(sel(tabela));
      if (up.error) throw erro(up.error);
      if (up.data && up.data.length) return up.data[0];
      const existe = await sb.from(tabela).select('id').eq('id', id).maybeSingle();
      if (existe.error) throw erro(existe.error);
      if (existe.data) throw erro(op.base ? { code: 'P0001', message: R.MSG_CONFLITO } : { code: '42501', message: 'permission denied' });
      if (op.novo === false || op.base) throw erro({ code: 'P0001', message: R.MSG_EXCLUIDO });
      const ins = await sb.from(tabela).insert(r).select(sel(tabela)).single();   // sem informação de origem (item antigo da fila): comporta-se como antes
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
    /* histórico de 200 em 200: "antes" = data do registro mais antigo já carregado (para buscar os anteriores) */
    async registrarDownload(tipo, qtd) { try { await sb.rpc('registrar_download', { p_tipo: tipo, p_qtd: qtd || 0 }); } catch (e) { /* sem rede ou sem o script 21: o download segue */ } },
    async auditoria(limite, antes) {
      let q = sb.from('auditoria').select('*').order('em', { ascending: false }).limit(limite || 200); if (antes) q = q.lt('em', antes);
      const { data, error } = await q;
      if (error) throw erro(error);
      return data || [];
    },
    /* último acesso de cada pessoa cadastrada (só a coordenação recebe). null = o banco ainda não tem a função (falta rodar o script 09) */
    async acessos() {
      const { data, error } = await sb.rpc('ultimos_acessos');
      if (error && (error.code === 'PGRST202' || error.code === '42883')) return null;
      if (error) throw erro(error);
      return data || [];
    },
    guardarCopia(db) { guardar(CHAVE_DADOS, semReservado(db)); },
    COLUNAS, limpar
  };
})();
;
/* ===== sessao.js ===== */
/* Saberes que Cultivam — desconexão depois de 15 minutos sem uso, em todos os perfis (com internet).
   Aos 13 minutos aparece um aviso com contagem; aos 15, o sistema sai sozinho. O último uso fica
   guardado no aparelho, então vale entre abas do navegador e também ao reabrir o sistema depois.
   O que estava guardado na fila (preenchido sem internet) não se perde: sobe na próxima entrada. */
(function () {
  const SQC = (window.SQC = window.SQC || {});
  const LIMITE = 15 * 60 * 1000;   // 15 minutos
  const AVISO = 2 * 60 * 1000;     // avisa 2 minutos antes
  const CHAVE = 'sqc-ultimo-uso';
  let memoria = 0, ultimaGravacao = 0, timer = null, cfg = null, caixa = null;

  const agora = () => Date.now();
  function ultimo() { try { const v = +localStorage.getItem(CHAVE); return v || memoria; } catch (e) { return memoria; } }
  function tocar(forcar) {
    const t = agora(); memoria = t;
    if (!forcar && t - ultimaGravacao < 5000) return;   // grava no máximo a cada 5 s
    ultimaGravacao = t; try { localStorage.setItem(CHAVE, String(t)); } catch (e) {}
  }
  function esquecer() { memoria = 0; ultimaGravacao = 0; try { localStorage.removeItem(CHAVE); } catch (e) {} }
  /* regras puras (usadas também nos testes) */
  const venceu = (ult, t = agora(), limite = LIMITE) => !!ult && t - ult >= limite;
  const falta = (ult, t = agora(), limite = LIMITE) => ult ? Math.max(0, limite - (t - ult)) : limite;
  const fmt = ms => { const s = Math.ceil(ms / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

  function mostrarAviso(ms) {
    if (!caixa) {
      caixa = document.createElement('div'); caixa.className = 'sessao-aviso'; caixa.setAttribute('role', 'alertdialog'); caixa.setAttribute('aria-live', 'assertive');
      document.body.appendChild(caixa);
    }
    caixa.innerHTML = `<div class="sessao-in"><b>Você está sem usar o sistema.</b>
      <span>Por segurança, ele sai sozinho em <b class="num">${fmt(ms)}</b>. O que estiver guardado no celular não se perde.</span>
      <button type="button" class="b p" data-acao="sessao-continuar">Continuar usando</button></div>`;
  }
  function esconderAviso() { if (caixa) { caixa.remove(); caixa = null; } }

  /* Sem internet o sistema NÃO sai: para entrar de novo é preciso conexão, e a pessoa ficaria travada
     no campo. Quando o sinal volta, se a pessoa continua parada há 15 minutos ou mais, aí sai.
     navigator.onLine às vezes diz "tem rede" com sinal fraco; por isso, antes de sair, o app confere
     se o servidor responde (cfg.temConexao). Se não responder, tenta de novo em 30 segundos. */
  const semRede = () => typeof navigator !== 'undefined' && navigator.onLine === false;
  let conferindo = false, esperarAte = 0;
  async function conferir() {
    if (!cfg || !cfg.ativo()) { esconderAviso(); return; }
    if (semRede()) { esconderAviso(); return; }   // sem sinal: não avisa nem sai
    const f = falta(ultimo());
    if (f > AVISO) { esconderAviso(); return; }
    if (f > 0) { mostrarAviso(f); return; }
    if (conferindo || agora() < esperarAte) return;
    conferindo = true;
    // passou do prazo: a tela com dados fica coberta enquanto confere a conexão (com sinal fraco pode levar segundos)
    document.documentElement.classList.add('bloq');
    try {
      const ok = cfg.temConexao ? await cfg.temConexao() : true;
      if (!ok) { document.documentElement.classList.remove('bloq'); esconderAviso(); esperarAte = agora() + 30000; return; }
      if (!cfg || !cfg.ativo() || !venceu(ultimo())) { document.documentElement.classList.remove('bloq'); return; }
      esconderAviso(); parar(); cfg.aoVencer();
    } finally { conferindo = false; setTimeout(() => document.documentElement.classList.remove('bloq'), 50); }
  }
  function parar() { if (timer) clearInterval(timer); timer = null; }
  /* cfg: { ativo(): há alguém logado?, aoVencer(): sai do sistema } */
  function iniciar(c) {
    cfg = c; parar(); esperarAte = 0; timer = setInterval(conferir, 1000);
    if (timer && typeof timer === 'object' && timer.unref) timer.unref();   // só no Node (testes); no navegador é número
  }
  // qualquer uso conta: toque, clique, tecla, rolagem, digitação
  ['pointerdown', 'keydown', 'touchstart', 'input', 'scroll', 'wheel'].forEach(ev =>
    document.addEventListener(ev, () => { if (cfg && cfg.ativo()) { tocar(); if (caixa) esconderAviso(); } }, { passive: true, capture: true }));
  // o celular pausa o relógio com a tela apagada: ao voltar, confere na hora
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') conferir(); });
  // o sinal voltou: confere na hora (se continua parada há 15 minutos, sai)
  if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('online', () => { esperarAte = 0; conferir(); });
  document.addEventListener('click', ev => { const b = ev.target.closest && ev.target.closest('[data-acao="sessao-continuar"]'); if (b) { tocar(true); esconderAviso(); } });

  SQC.sessao = { LIMITE, AVISO, iniciar, parar, tocar, esquecer, ultimo, venceu, falta, conferir, fmt, semRede };
})();
;
/* ===== mascaras.js ===== */
/* Saberes que Cultivam — máscaras de digitação: CPF, celular e e-mail, em todos os formulários (cadastro e link de cadastro).
   Trazido do sistema Mulheres & Quintais (12/10/2026). O banco continua guardando o CPF só com números (regras.normalizarMembro). */
(function () {
  const SQC = (window.SQC = window.SQC || {});
  const dig = v => String(v || '').replace(/\D/g, '');
  const fmtCPF = d => { d = d.slice(0, 11);
    return d.length > 9 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : d.length > 6 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
      : d.length > 3 ? `${d.slice(0, 3)}.${d.slice(3)}` : d; };
  // +55 e 0 de operadora/DDD na frente saem antes de formatar: "+55 84 99999-8888" e "084 99999-8888" viram (84) 99999-8888
  const fmtTel = d => { if (/^55\d{10,11}$/.test(d)) d = d.slice(2); else if (/^0\d{10,11}$/.test(d)) d = d.slice(1); d = d.slice(0, 11); if (!d) return '';
    if (d.length <= 2) return `(${d}`;
    const meio = d.length === 11 ? 5 : 4, ddd = d.slice(0, 2), r = d.slice(2);
    return r.length > meio ? `(${ddd}) ${r.slice(0, meio)}-${r.slice(meio)}` : `(${ddd}) ${r}`; };
  // limite folgado: colar "CPF: 529.982.247-25" ou "+55 (84) 99999-8888" não pode ser cortado antes de a máscara limpar
  const TIPOS = { cpf: { fmt: fmtCPF, max: 24, ph: '000.000.000-00', modo: 'numeric' }, tel: { fmt: fmtTel, max: 24, ph: '(00) 00000-0000', modo: 'tel' } };
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
;
/* ===== voz.js ===== */
/* Saberes que Cultivam — ditado por voz nos campos de texto (observações da visita, relato de problema…).
   Trazido do sistema Mulheres & Quintais (12/10/2026), sem a parte de "organizar o texto" (que dependia de um serviço externo).
   Usa o reconhecimento de fala do próprio navegador (Chrome/Android e Safari/iPhone), em português; o texto vai aparecendo
   no campo e a pessoa revisa antes de salvar. Sem suporte no navegador o botão não aparece (o microfone do teclado continua valendo).
   Atenção: no Chrome o áudio passa pelo serviço de fala do Google; por isso o botão não aparece no link de cadastro público. */
(function () {
  const SQC = (window.SQC = window.SQC || {});
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const ICONE = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2Z"/></svg>';
  let ativo = null;   // { rec, ta, btn, base, finais, parcial, erro }

  /* comandos falados simples: "vírgula", "ponto final", "nova linha" */
  const ajustar = t => t.replace(/\s*\bv[íi]rgula\b/gi, ',').replace(/\s*\bponto final\b/gi, '.').replace(/\s*\bponto de interroga[çc][ãa]o\b/gi, '?')
    .replace(/\s*\b(nova linha|pr[óo]xima linha|par[áa]grafo)\b\s*/gi, '\n');
  const maiuscula = (antes, t) => { t = t.replace(/([.!?]\s+|\n\s*)(\p{Ll})/gu, (m, p, c) => p + c.toUpperCase());
    return (!antes.trim() || /[.!?\n]\s*$/.test(antes)) ? t.replace(/^(\s*)(\S)/, (m, e, c) => e + c.toUpperCase()) : t; };
  const juntar = (a, b) => !a ? b : (/[\s\n]$/.test(a) || /^[,.?\n]/.test(b)) ? a + b : a + ' ' + b;
  const avisar = m => { if (m && SQC.app && SQC.app.toast) SQC.app.toast(m); };

  function escrever() {
    const a = ativo; if (!a) return; if (!a.ta.isConnected) return parar();
    a.ta.value = juntar(a.base, a.finais + (a.parcial ? (a.finais ? ' ' : '') + a.parcial : '')).replace(/ +\n/g, '\n');
    a.ta.scrollTop = a.ta.scrollHeight;
  }
  function parar(msg) {
    const a = ativo; if (!a) return; ativo = null;
    a.ta.value = juntar(a.base, a.finais).replace(/ +\n/g, '\n').replace(/[ ]+$/, '');
    if (a.ta.value && !/[.!?]\s*$/.test(a.ta.value) && a.finais) a.ta.value += '.';
    try { a.rec.stop(); } catch (e) {}
    a.btn.classList.remove('gravando'); a.btn.innerHTML = ICONE + '<span>Falar</span>'; a.btn.setAttribute('aria-pressed', 'false');
    const c = a.ta.closest('.voz-caixa'); if (c) c.classList.remove('ouvindo');
    avisar(msg);
  }
  function comecar(ta, btn) {
    if (ativo) { const mesmo = ativo.ta === ta; parar(); if (mesmo) return; }
    const rec = new SR(); rec.lang = 'pt-BR'; rec.continuous = true; rec.interimResults = true;
    const a = ativo = { rec, ta, btn, base: ta.value, finais: '', parcial: '', erro: null };
    rec.onresult = ev => {
      let parcial = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const t = ajustar(ev.results[i][0].transcript);
        if (ev.results[i].isFinal) a.finais = juntar(a.finais, maiuscula(juntar(a.base, a.finais), t.replace(/^ +| +$/g, '')));
        else parcial += t;
      }
      a.parcial = parcial.trim(); escrever();
    };
    rec.onerror = ev => { a.erro = ev.error; };
    rec.onend = () => {
      if (ativo !== a) return;
      if (!a.ta.isConnected) return parar();   // o formulário foi trocado: não volta a ouvir
      if (!a.erro) { try { rec.start(); return; } catch (e) {} }   // o navegador para sozinho no silêncio: continua até a pessoa tocar em Parar
      const m = { 'not-allowed': 'O microfone está bloqueado. Libere o microfone para este site nas permissões do navegador.',
        'service-not-allowed': 'O microfone está bloqueado. Libere o microfone para este site nas permissões do navegador.',
        network: 'Para ditar, o navegador precisa de internet. Sem internet, use o microfone do teclado do celular.',
        'audio-capture': 'Não achei o microfone do aparelho.' }[a.erro];
      parar(m || (a.erro && a.erro !== 'no-speech' && a.erro !== 'aborted' ? 'O ditado parou. Toque em Falar para continuar.' : null));
    };
    try { rec.start(); } catch (e) { ativo = null; return; }
    btn.classList.add('gravando'); btn.innerHTML = '<i class="voz-ponto" aria-hidden="true"></i><span>Parar</span>'; btn.setAttribute('aria-pressed', 'true');
    const c = ta.closest('.voz-caixa'); if (c) c.classList.add('ouvindo');
    ta.focus();
  }
  /* põe o botão "Falar" embaixo de cada campo de texto longo que aparecer (formulários são desenhados na hora) */
  function preparar(raiz) {
    if (!SR) return;
    (raiz || document).querySelectorAll('textarea:not([readonly]):not([disabled]):not([data-voz-ok])').forEach(ta => {
      ta.dataset.vozOk = '1'; if (ta.closest('#pub')) return;   // link de cadastro público: sem ditado (o áudio sairia para o serviço de fala)
      const caixa = document.createElement('div'); caixa.className = 'voz-caixa'; ta.parentNode.insertBefore(caixa, ta); caixa.appendChild(ta);
      const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'btn-voz'; btn.setAttribute('aria-pressed', 'false');
      btn.setAttribute('aria-label', 'Falar: ditar por voz neste campo'); btn.innerHTML = ICONE + '<span>Falar</span>';
      btn.addEventListener('click', () => comecar(ta, btn));
      const barra = document.createElement('div'); barra.className = 'voz-barra'; barra.appendChild(btn); caixa.appendChild(barra);
    });
  }
  if (SR && typeof MutationObserver !== 'undefined') new MutationObserver(() => preparar()).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('submit', () => { if (ativo) parar(); }, true);
  document.addEventListener('close', () => { if (ativo) parar(); }, true);   // fechou a janela: o microfone desliga
  SQC.voz = { suportado: !!SR, parar, preparar };
})();
;
/* ===== fotodia.js ===== */
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
;
/* ===== app.js ===== */
/* Saberes que Cultivam — telas e navegação.
   Uma aba por assunto. Os cadastros são descritos em MOD (campos do formulário e colunas da lista);
   as contas ficam em js/regras.js e os números do plano em js/dados.js. */
(function () {
  const SQC = (window.SQC = window.SQC || {});
  const D = SQC.dados, R = SQC.regras;
  let api = null, eu = null, db = null, pend = [], hist = null;
  let tab = 'painel', ed = null, rel = null, authModo = 'entrar';

  /* ---------- utilidades ---------- */
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const FMT_NUM = {}, num = (v, d = 0) => (FMT_NUM[d] = FMT_NUM[d] || new Intl.NumberFormat('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d })).format(+v || 0);
  const brl = R.brl, dt = R.dt, pd = R.pd, iso = R.iso;
  const hoje = () => new Date();
  /* busca por id com índice por tabela, refeito quando a lista muda (antes era uma varredura da lista a cada linha desenhada) */
  const IDX = new WeakMap();
  //  guarda a POSIÇÃO de cada id e confere na hora: registro trocado no mesmo lugar (edição) é achado novo; lista que mudou de tamanho ou ordem refaz o índice
  const by = (t, id) => { const L = db[t]; if (!L) return undefined; let m = IDX.get(L), i = m && m.get(id);
    if (i !== undefined && L[i] && L[i].id === id) return L[i];
    m = new Map(); L.forEach((r, k) => m.set(r.id, k)); IDX.set(L, m); i = m.get(id); return i === undefined ? undefined : L[i]; };
  const coord = () => !!eu && eu.perfil === 'Coordenação';
  /* pré-visualização "ver como o SEAB/MDA vê": a coordenação enxerga o sistema com o perfil de acompanhamento, com os mesmos cortes
     que o banco faz para esse perfil (unidade produtiva numerada, visita sem texto, sem equipe). Nada é gravado nesse modo. */
  let real = null;
  function semPessoal(d) {
    const c = JSON.parse(JSON.stringify(d)); c.presencas = []; c.fotos = []; c.despesas = []; c.itens = c.itens.map(i => { const x = Object.assign({}, i); delete x.valor; delete x.rubrica; return x; }); c.eventos = c.eventos.map(e => { const x = Object.assign({}, e); delete x.link; delete x.obs; return x; });
    c.agricultores = [...c.agricultores].sort((a, b) => String(a.criado_em || '') < String(b.criado_em || '') ? -1 : 1).map((a, i) => ({ id: a.id, nome: 'Unidade produtiva ' + String(i + 1).padStart(2, '0'), municipio: a.municipio, uf: a.uf, territorio: a.territorio, unidade: a.unidade, area: a.area, diag: a.diag, quimico: a.quimico, gasto0: a.gasto0, kit: a.kit, kitdata: a.kitdata, ex: a.ex }));
    c.visitas = c.visitas.map(v => ({ id: v.id, data: v.data, agricultor: v.agricultor, usou: v.usou, vigor: v.vigor, gasto: v.gasto, ex: v.ex }));
    c.pessoas = c.pessoas.filter(p => eu && p.id === eu.id); c.membros = []; return c;
  }
  const trocarDb = d => { if (real) { real.db = d; db = semPessoal(d); } else db = d; };   // na pré-visualização "Ver como SEAB/MDA", o que chega passa pelo mesmo corte
  async function recarregarDb() { trocarDb(await api.carregar()); }
  const fora = () => !!eu && eu.perfil === 'Acompanhamento';   // SEAB/MDA: só leitura, sem dado pessoal
  const formador = () => !!eu && eu.perfil === 'Formador', auxiliar = () => !!eu && eu.perfil === 'Auxiliar';   // perfis do 23
  const semDinheiro = () => fora() || formador();   // não veem valores
  const semCampo = () => fora() || auxiliar() || formador();   // recebem as unidades produtivas numeradas, sem dado pessoal
  const demo = () => api.modo === 'demo';
  const mesAno = s => String(s).split('-').reverse().join('/');
  const exChip = r => (r.ex ? ' <span class="chip ex">exemplo</span>' : '') + (r._erro ? ' <span class="chip bad">não enviado</span>' : r._pendente ? ' <span class="chip pend">aguardando envio</span>' : '');
  const bar = (v, t, c = '') => `<div class="bar ${c}"><i style="width:${Math.max(0, Math.min(100, t ? v / t * 100 : 0))}%"></i></div>`;
  const link = (u, txt) => /^https?:\/\//i.test(String(u || '')) ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${txt || 'abrir'}</a>` : (u ? esc(u) : '<span class="chip f">sem link</span>');
  const saldo = l => R.saldo(db, l), nCheck = R.nCheck;
  /* de que biofábricas a unidade produtiva recebeu de fato: pelas entregas até hoje (o cadastro guarda só a de referência) */
  const deOnde = id => { const hj = iso(hoje()); return [...new Set(recebeu(id).filter(d => String(d.data || '') <= hj).map(d => (by('lotes', d.lote) || {}).unidade).filter(Boolean))]; };
  const visitasDe = id => R.visitasDe(db, id), recebeu = id => R.recebeu(db, id), acompanhada = a => R.acompanhada(db, a), feito = e => R.feito(db, e);
  let toastT = null;
  function toast(msg) { let t = $('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg; clearTimeout(toastT); toastT = setTimeout(() => t.remove(), 5000); }

  /* ---------- cadastros: campos = [chave, rótulo, tipo, obrigatório, opções]; cols = [título, função, classe] ---------- */
  const opt = a => a.map(x => [x, x]);
  const optRubrica = () => D.RUBRICAS.map(r => [r.id, r.nome]);
  const nomeRubrica = id => (D.RUBRICAS.find(r => r.id === id) || {}).nome || '';
  const MOD = {
    unidades: { um: 'Unidade de produção de bioinsumos', oque: 'Biofábrica do projeto. As duas que contam para a Meta 2 do TED são as dos territórios; as outras são de apoio. Marque cada passo da implantação conforme for acontecendo.', dicas: { sigla: 'Aparece no código de todos os lotes desta unidade. Não mude depois de criar lotes.', parceiro: 'Associação, cooperativa, prefeitura ou escola. Bem público não pode ser doado a pessoa física.' }, nome: 'Biofábricas', titulo: 'Unidades de produção de bioinsumos', desc: 'Passos da implantação de cada unidade. Conta para a Meta 2 a unidade marcada como “em funcionamento”.', novo: 'Nova unidade',
      campos: [['_s1', 'Identificação', 'sec'], ['nome', 'Nome', 'text', 1], ['sigla', 'Sigla (2 a 4 letras, usada no código dos lotes)', 'text', 1], ['municipio', 'Município', 'text'], ['uf', 'UF', 'text'],
        ['territorio', 'Território', 'select', 0, opt(D.TERRITORIOS)],
        ['modelo', 'Modelo', 'select', 0, opt(['A definir', 'Área aberta com cobertura (compostagem e biofertilizantes)', 'Microrganismos isolados'])],
        ['conta', 'Conta para a Meta 2 do TED?', 'select', 0, opt(['Sim', 'Não'])], ['_s2', 'Parceria', 'sec'], ['parceiro', 'Parceiro institucional que recebe os bens', 'text'], ['responsavel', 'Responsável local', 'text'],
        ['_s3', 'Implantação', 'sec'], ['_chk', 'Passos concluídos', 'checks'], ['obs', 'Observações', 'textarea']],
      cols: [['Unidade', u => `<b>${esc(u.nome)}</b>${exChip(u)}<div class="small">${esc(u.municipio)}/${esc(u.uf)} · ${esc(u.modelo)}</div>`],
        ['Meta 2', u => u.conta === 'Sim' ? '<span class="chip ok">conta</span>' : '<span class="chip">apoio</span>'],
        ['Implantação', u => `${bar(nCheck(u), D.CHECK.length)}<div class="small">${nCheck(u)} de ${D.CHECK.length} · próximo: ${esc(R.proximoPasso(u))}</div>`],
        ['Parceiro', u => esc(u.parceiro) || '<span class="chip f">a definir</span>'],
        ['Itens estimados', u => { const s = db.itens.filter(i => i.unidade === u.id).reduce((t, i) => t + (+i.valor || 0), 0); return `${brl(s)}${u.conta === 'Sim' ? `<div class="small">de ${brl(D.TETO_UNIDADE)}</div>` : ''}`; }, 'n']] },
    itens: { um: 'Item de aquisição', oque: 'Bem ou material a comprar pela FUNCERN para uma unidade de produção.', dicas: { rubrica: 'A rubrica do plano em que a compra vai entrar.' }, nome: 'Itens', titulo: 'Itens e aquisições das unidades', desc: `Cada item passa por orçamento, compra pela FUNCERN e entrega. O teto do plano é ${brl(D.TETO_UNIDADE)} por unidade.`, novo: 'Novo item',
      campos: [['unidade', 'Biofábrica', 'ref', 1, 'unidades'], ['descricao', 'Descrição', 'text', 1], ['valor', 'Valor estimado (R$)', 'number'],
        ['rubrica', 'Rubrica do plano', 'select', 0, () => [['', '']].concat(optRubrica())],
        ['status', 'Situação', 'select', 0, opt(['A definir', 'Orçamento enviado', 'Em compras na FUNCERN', 'Entregue'])], ['data', 'Data do envio do orçamento', 'date']],
      cols: [['Item', i => esc(i.descricao) + exChip(i) + (i.rubrica ? `<div class="small">${esc(nomeRubrica(i.rubrica))}</div>` : '')], ['Unidade', i => esc((by('unidades', i.unidade) || {}).nome)],
        ['Situação', i => `<span class="chip ${i.status === 'Entregue' ? 'ok' : i.status === 'A definir' ? '' : 'f'}">${esc(i.status)}</span>`], ['Enviado em', i => dt(i.data)], ['Valor', i => brl(i.valor), 'n']] },
    lotes: { um: 'Lote de produção', oque: 'Uma batelada de bioinsumo. O código é gerado ao salvar. Só lote marcado como “Pronto” pode ser distribuído.', dicas: { dias: 'Preenchido pelo tipo; ajuste se o seu preparo for diferente.', obs: 'O que você observou ao conferir: é o registro de qualidade do lote.' }, nome: 'Lotes', titulo: 'Lotes de produção', desc: 'Um lote por batelada. O código é gerado pela sigla da unidade e pelo tipo. O saldo desconta o que já foi distribuído.', novo: 'Novo lote',
      campos: [['_s1', 'Produção', 'sec'], ['unidade', 'Biofábrica', 'ref', 1, 'unidades'], ['tipo', 'Tipo de bioinsumo', 'select', 1, opt(Object.keys(D.TIPOS))], ['inicio', 'Início do preparo', 'date', 1],
        ['dias', 'Dias até ficar pronto', 'number'], ['qtd', 'Quantidade produzida', 'number', 1], ['med', 'Medida', 'select', 0, opt(['kg', 'L'])],
        ['_s2', 'Acompanhamento do lote', 'sec'], ['status', 'Situação', 'select', 0, opt(['Em preparo', 'Maturando', 'Pronto', 'Descartado'])], ['responsavel', 'Responsável', 'text'],
        ['insumos', 'Ingredientes e proporções', 'textarea'], ['obs', 'Qualidade (cheiro, temperatura, pH, aspecto)', 'textarea']],
      cols: [['Lote', l => `<span class="mono">${esc(l.codigo || 'código ao enviar')}</span>${exChip(l)}<div class="small">${esc(l.tipo)} · ${esc((by('unidades', l.unidade) || {}).nome)}</div>`],
        ['Situação', l => `<span class="chip ${l.status === 'Pronto' ? 'ok' : l.status === 'Descartado' ? 'bad' : 'f'}">${esc(l.status)}</span>`],
        ['Maturação', l => { const p = R.dias(pd(l.inicio), hoje()); return l.status === 'Pronto' || l.status === 'Descartado' ? `<span class="small">início ${dt(l.inicio)}</span>` : `${bar(p, l.dias, 'f')}<div class="small">dia ${Math.max(0, p)} de ${l.dias} · previsto ${dt(iso(R.pronto(l)))}</div>`; }],
        ['Produzido', l => `${num(l.qtd)} ${esc(l.med)}`, 'n'], ['Saldo', l => `<b>${num(saldo(l))} ${esc(l.med)}</b>`, 'n']] },
    agricultores: { um: 'Unidade produtiva', oque: 'Agricultor ou agricultora atendido pelo projeto. Conta como “acompanhada” quando recebe bioinsumo e tem pelo menos uma visita de monitoramento depois da primeira entrega. É dado pessoal: registre só o necessário e não compartilhe fora da equipe.', dicas: { unidade: 'A biofábrica que, pelo território, deve abastecer esta unidade produtiva. De onde ela recebeu de fato o sistema mostra pelas entregas.', diag: 'Dia em que você levantou a situação antes do projeto. Sem essa data, a avaliação final não tem com o que comparar.', gasto0: 'Quanto a família gastava por mês com adubo e defensivo comprados, antes de receber bioinsumo.', kitdata: 'Obrigatória quando o kit foi entregue.' }, nome: 'Unidades produtivas', titulo: 'Agricultores e unidades produtivas', desc: 'Meta de 30 unidades produtivas acompanhadas e 30 kits. Registre a linha de base antes da primeira entrega de bioinsumo.', novo: 'Nova unidade produtiva',
      campos: [['_s1', 'Dados pessoais', 'sec'], ['nome', 'Nome do agricultor ou agricultora', 'text', 1], ['comunidade', 'Comunidade ou assentamento', 'text'], ['municipio', 'Município', 'text'], ['uf', 'UF', 'text'],
        ['territorio', 'Território', 'select', 0, opt(D.TERRITORIOS)], ['unidade', 'Biofábrica de referência', 'ref', 0, 'unidades'],
        ['_s2', 'Produção', 'sec'], ['culturas', 'Culturas principais', 'text'], ['area', 'Área cultivada (ha)', 'number'],
        ['_s3', 'Linha de base (antes do projeto)', 'sec'], ['diag', 'Data do diagnóstico inicial', 'date'], ['quimico', 'Usa adubo ou defensivo químico?', 'select', 0, opt(['', 'Sim', 'Parcial', 'Não'])], ['gasto0', 'Gasto com insumos comprados (R$/mês)', 'number'],
        ['_s4', 'Kit de apoio', 'sec'], ['kit', 'Kit de apoio entregue', 'check'], ['kitdata', 'Data da entrega do kit', 'date']],
      cols: [['Agricultor(a)', a => `<b>${esc(a.nome)}</b>${exChip(a)}<div class="small">${esc(a.comunidade)} · ${esc(a.municipio)}/${esc(a.uf)}</div>`],
        ['Culturas', a => `${esc(a.culturas)}<div class="small">${num(a.area, 1)} ha</div>`],
        ['Linha de base', a => a.diag ? `<span class="chip ok">${dt(a.diag)}</span><div class="small">${brl(a.gasto0)}/mês · químico: ${esc(a.quimico || '—')}</div>` : '<span class="chip bad">falta</span>'],
        ['Kit', a => a.kit ? `<span class="chip ok">${dt(a.kitdata)}</span>` : '<span class="chip">não</span>'],
        ['Acompanhamento', a => { const r = recebeu(a.id).length, v = visitasDe(a.id); return `<span class="chip ${acompanhada(a) ? 'ok' : ''}">${r} entrega(s) · ${v.length} visita(s)</span>${v[0] ? `<div class="small">última ${dt(v[0].data)}</div>` : ''}`; }]] },
    distribuicoes: { um: 'Entrega de bioinsumo', oque: 'Liga um lote a quem recebeu. O sistema desconta do saldo do lote e não deixa entregar mais do que existe.', nome: 'Distribuição', titulo: 'Distribuição de bioinsumos', desc: 'Cada entrega liga um lote a uma unidade produtiva. É o que permite dizer de onde veio o que foi aplicado.', novo: 'Registrar entrega de bioinsumo',
      campos: [['data', 'Data', 'date', 1], ['lote', 'Lote (só os prontos)', 'ref', 1, 'lotes', l => l.status === 'Pronto'], ['agricultor', 'Unidade produtiva', 'ref', 1, 'agricultores'], ['qtd', 'Quantidade', 'number', 1],
        ['cultura', 'Cultura que vai receber', 'text'], ['area', 'Área de aplicação (ha)', 'number'], ['forma', 'Forma de aplicação', 'select', 0, opt(['No solo', 'Foliar', 'Na cova ou sulco', 'Tratamento de sementes', 'Outro'])]],
      cols: [['Data', d => dt(d.data) + exChip(d)], ['Lote', d => { const l = by('lotes', d.lote) || {}; return `<span class="mono">${esc(l.codigo || 'código ao enviar')}</span><div class="small">${esc(l.tipo)}</div>`; }],
        ['Para', d => esc((by('agricultores', d.agricultor) || {}).nome)], ['Uso', d => `${esc(d.cultura)}<div class="small">${esc(d.forma)} · ${num(d.area, 1)} ha</div>`],
        ['Quantidade', d => `${num(d.qtd)} ${esc((by('lotes', d.lote) || {}).med || '')}`, 'n']] },
    visitas: { um: 'Visita de monitoramento', oque: 'O que foi visto em campo depois da entrega. O gasto informado aqui é comparado com a linha de base no painel.', dicas: { gasto: 'Mesma pergunta da linha de base, para comparar antes e depois.', local: 'Pelo GPS do celular, na propriedade (funciona sem internet). Só a equipe do projeto vê.' }, nome: 'Monitoramento', titulo: 'Visitas de monitoramento', desc: 'Registro do uso em campo. O gasto mensal com insumos comprados é comparado com a linha de base no painel.', novo: 'Registrar visita',
      campos: [['_s1', 'A visita', 'sec'], ['data', 'Data', 'date', 1], ['agricultor', 'Unidade produtiva', 'ref', 1, 'agricultores'], ['tecnico', 'Quem visitou', 'text'], ['local', 'Localização da visita', 'geo'],
        ['_s2', 'O que foi visto', 'sec'],
        ['usou', 'Aplicou o bioinsumo recebido?', 'select', 1, opt(['', 'Sim', 'Parcial', 'Não'])], ['vigor', 'Vigor da cultura (1 ruim a 5 ótimo)', 'select', 0, opt(['', '1', '2', '3', '4', '5'])],
        ['gasto', 'Gasto atual com insumos comprados (R$/mês)', 'number'], ['obs', 'O que foi observado', 'textarea'], ['problemas', 'Dificuldades relatadas', 'textarea']],
      cols: [['Data', v => dt(v.data) + exChip(v)], ['Fotos', v => evid('visitas', v), '', 'equipe'], ['Unidade produtiva', v => esc((by('agricultores', v.agricultor) || {}).nome) + (v.lat != null && v.lat !== '' && !fora() ? '<div class="small">com localização</div>' : '')],
        ['Uso', v => `<span class="chip ${v.usou === 'Sim' ? 'ok' : v.usou === 'Não' ? 'bad' : 'f'}">${esc(v.usou)}</span>`], ['Vigor', v => v.vigor ? `${esc(v.vigor)}/5` : '—', 'n'],
        ['Gasto/mês', v => R.vazio(v.gasto) ? '—' : brl(v.gasto), 'n'], ['Observações', v => `${esc(v.obs)}${v.problemas ? `<div class="small">Dificuldade: ${esc(v.problemas)}</div>` : ''}`]] },
    eventos: { um: 'Atividade', oque: 'Capacitação e dia de campo contam para as metas do plano quando a data chega (com data futura, a atividade aparece como agendada). Reunião e articulação ficam registradas, mas não contam.', dicas: { link: 'Pasta com a lista de presença e as fotos: é a evidência para a prestação de contas.' }, nome: 'Formação', titulo: 'Capacitações, dias de campo e reuniões', desc: 'O plano prevê 5 capacitações (etapa 3.2) e 4 dias de campo (etapa 5.1). Reuniões e articulações ficam registradas, mas não contam para essas metas.', novo: 'Registrar atividade',
      campos: [['tipo', 'Tipo', 'select', 1, opt(['', 'Capacitação', 'Dia de campo', 'Reunião', 'Articulação'])], ['data', 'Data', 'date', 1], ['tema', 'Tema', 'text', 1], ['lugar', 'Local', 'text'], ['municipio', 'Município/UF', 'text'],
        ['part', 'Participantes', 'number'], ['mulheres', 'Quantas são mulheres', 'number'], ['link', 'Link da lista de presença e fotos', 'text'], ['obs', 'Observações', 'textarea']],
      cols: [['Data', e => dt(e.data) + (String(e.data || '') > iso(hoje()) ? ' <span class="chip f">agendada</span>' : '') + exChip(e)], ['Lista e fotos', e => evid('eventos', e), '', 'equipe'], ['Tipo', e => `<span class="chip ${['Capacitação', 'Dia de campo'].includes(e.tipo) ? 'ok' : ''}">${esc(e.tipo)}</span>`],
        ['Tema', e => `${esc(e.tema)}<div class="small">${esc(e.lugar)}${e.municipio ? ' · ' + esc(e.municipio) : ''}</div>`],
        ['Participantes', e => R.vazio(e.part) ? '—' : `${num(e.part)}<div class="small">${num(e.mulheres)} mulheres</div>`, 'n'],
        ['Evidência', e => link(e.link), '', 'equipe']] },
    entregas: { um: 'Entrega do plano de trabalho', oque: 'Relatório, material didático ou produto de comunicação concluído. Cada registro conta 1 na etapa escolhida.', dicas: { link: 'Onde o documento está guardado.' }, nome: 'Entregas', titulo: 'Entregas e evidências do plano de trabalho', desc: 'Relatórios, material didático e produtos de comunicação. Cada registro conta para a etapa escolhida.', novo: 'Registrar entrega',
      campos: [['etapa', 'Etapa do plano', 'select', 1, D.ETAPAS.filter(e => !D.ETAPAS_AUTOMATICAS.includes(e.id)).map(e => [e.id, `${e.id} · ${e.nome}`])],
        ['titulo', 'Título', 'text', 1], ['data', 'Data', 'date', 1], ['link', 'Link do documento', 'text'], ['obs', 'Observações', 'textarea']],
      cols: [['Etapa', g => `<span class="mono">${esc(g.etapa)}</span>`], ['Entrega', g => `${esc(g.titulo)}${exChip(g)}${g.obs ? `<div class="small">${esc(g.obs)}</div>` : ''}`], ['Data', g => dt(g.data)],
        ['Evidência', g => link(g.link)]] },
    despesas: { um: 'Despesa', oque: 'Lançamento de acompanhamento. O registro oficial é o da FUNCERN: confira os dois antes de cada prestação de contas.', dicas: { rubrica: 'É por rubrica que a fundação controla o gasto.', item: 'Opcional. Escolha um item da mesma rubrica: é o que permite ver, no Financeiro, quanto de cada item já foi gasto.', status: 'Enquanto não estiver “Pago”, conta como comprometido.' }, nome: 'Despesas', titulo: 'Despesas do projeto', desc: 'Vêm da planilha de solicitações da FUNCERN: suba a planilha atualizada e o sistema mostra o que mudou antes de gravar. Enquanto não estiver paga, a despesa conta como comprometida.', novo: 'Lançar despesa', restrito: 1,
      campos: [['data', 'Data', 'date', 1], ['etapa', 'Etapa do plano', 'select', 1, D.ETAPAS.map(e => [e.id, `${e.id} · ${e.nome}`])], ['rubrica', 'Rubrica', 'select', 1, () => [['', 'Escolha']].concat(optRubrica())],
        ['item', 'Item do plano', 'select', 0, () => [['', 'Sem item indicado']].concat(D.DESEMBOLSO.itens.map(i => [i.id, `${nomeRubrica(i.rubrica)} · ${i.nome}`]))],
        ['descricao', 'Descrição', 'text', 1], ['valor', 'Valor (R$)', 'number', 1],
        ['status', 'Situação', 'select', 1, opt(['Solicitado', 'Em compras na FUNCERN', 'Pago'])], ['favorecido', 'Favorecido', 'text'], ['doc', 'Documento (nota fiscal, solicitação)', 'text']],
      cols: [['Data', d => dt(d.data) + exChip(d)], ['Etapa', d => `<span class="mono">${esc(d.etapa)}</span>`],
        ['Descrição', d => `${esc(d.descricao)}<div class="small">${esc(nomeRubrica(d.rubrica) || 'sem rubrica')}${d.favorecido ? ' · ' + esc(d.favorecido) : ''}${d.doc ? ' · ' + esc(d.doc) : ''}</div>`],
        ['Situação', d => `<span class="chip ${d.status === 'Pago' ? 'ok' : 'f'}">${esc(d.status)}</span>`], ['Valor', d => brl(d.valor), 'n']] },
    membros: { um: 'Pessoa da equipe', oque: 'Quem ocupa uma função no projeto. Quando a pessoa sair, preencha o desligamento: o registro fica como histórico e a vaga volta a aparecer aberta.', dicas: { fim: 'Deixe vazio enquanto a pessoa estiver na equipe.', vinculo: 'Exemplo: IFRN Campus Apodi, ou o curso do estudante.', inicio: 'Sugerimos hoje. Mude se a pessoa começou em outro dia.', lgpd: 'Conta bancária e chave Pix não entram aqui: vão direto para a FUNCERN, que faz o pagamento.', cpf: 'Só a coordenação e o auxiliar administrativo veem (para o cadastro na FUNCERN). Guardado só com os números.', email: 'É o login no sistema: a pessoa entra com este e-mail.', termo_em: 'Marcado pela coordenação ou pelo auxiliar administrativo quando a FUNCERN confirmar.', cep: 'Só os 8 números. Com internet, rua, bairro e município se preenchem sozinhos.', socio: 'Com uma equipe pequena não dá para esconder de quem é cada resposta: por isso ela fica só com a coordenação e não entra em relatório.', siape: 'Deixe vazio se não for.', organizacao: 'Exemplo: sindicato, associação, cooperativa.', outra_bolsa: 'A fundação confere acúmulo de bolsas antes de pagar.', arlo: 'É o sistema em que a FUNCERN cadastra quem recebe. Sem esse cadastro a bolsa não é paga.', nome: 'Escreva como aparece na planilha da FUNCERN, para o sistema ligar a pessoa às bolsas.' }, nome: 'Equipe', titulo: 'Equipe', desc: '', novo: 'Cadastrar', restrito: 1,
      campos: [['funcao', 'Função', 'select', 1, [['coordenacao', 'Coordenação do projeto'], ['auxiliar', 'Auxiliar administrativo'], ['discente', 'Bolsista discente'], ['formador', 'Formador(a)']]],
        ['_s1', 'Dados pessoais', 'sec'], ['nome', 'Nome completo', 'text', 1], ['cpf', 'CPF', 'text', 1], ['telefone', 'Celular com WhatsApp', 'tel', 1], ['email', 'E-mail', 'email', 1], ['municipio', 'Município onde mora', 'text'],
        ['siape', 'Matrícula SIAPE (só se for servidor(a) público(a) federal)', 'text'], ['vinculo', 'Instituição ou curso', 'text'], ['organizacao', 'Organização ou movimento', 'text'],
        ['_s2b', 'Perfil no campo', 'sec', { so: ['discente', 'formador'] }], ['agricultor', 'É agricultor(a)? (produz alimento em quintal, roça ou lote)', 'select', 0, opt(['', 'Sim', 'Não'])], ['atua_af', 'Atua junto a agricultoras e agricultores familiares do território?', 'select', 0, opt(['', 'Sim', 'Não'])], ['zona_rural', 'Mora na zona rural?', 'select', 0, opt(['', 'Sim', 'Não'])], ['celular_internet', 'Tem celular com internet?', 'select', 0, opt(['', 'Sim', 'Não'])],
        ['experiencia', 'Experiência com agricultura familiar ou agroecologia', 'select', 0, opt(['', 'Nenhuma ainda', 'Estudo ou estágio na área', 'Até 2 anos de trabalho', 'Mais de 2 anos de trabalho', 'É de família agricultora'])],
        ['_s3b', 'Cadastro na FUNCERN (sistema Arlo)', 'sec'], ['_arloq', '', 'html', '<details class="fm-arlo"><summary>O que é o Arlo?</summary><p>É o sistema da FUNCERN, a fundação que paga as bolsas. Toda pessoa que recebe bolsa precisa estar cadastrada nele, com documentos e endereço. Quem já tem cadastro no Arlo (de outro projeto, por exemplo) não precisa informar de novo os dados abaixo.</p></details>'],
        ['arlo', 'A pessoa já tem cadastro no sistema Arlo, da FUNCERN?', 'select', 0, opt(['', 'Sim', 'Não'])], ['termo_em', 'Termo de compromisso assinado na FUNCERN em', 'date'],
        ['_s2', 'Mais dados pessoais', 'sec', { semArlo: 1 }], ['nome_social', 'Nome social (se usar)', 'text'], ['nascimento', 'Data de nascimento', 'date'], ['pis', 'PIS/NIS/PASEP (se tiver)', 'text'],
        ['_s1b', 'Endereço', 'sec', { semArlo: 1 }], ['cep', 'CEP', 'text'], ['numero', 'Número', 'text'], ['logradouro', 'Logradouro (rua, sítio, estrada)', 'text'], ['complemento', 'Complemento', 'text'], ['bairro', 'Bairro ou comunidade', 'text'], ['uf', 'Estado', 'select', 0, opt(['', 'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'])],
        ['_s1c', 'Questionário socioeconômico (opcional)', 'sec'], ['socio', 'Responder. Só a coordenação vê estas respostas.', 'check'],
        ['_s1d', '', 'sec', { socio: 1 }], ['escolaridade', 'Escolaridade', 'select', 0, opt(['', 'Fundamental incompleto', 'Fundamental completo', 'Médio incompleto', 'Médio completo', 'Técnico', 'Superior incompleto', 'Superior completo', 'Pós-graduação'])], ['raca_cor', 'Raça/cor', 'select', 0, opt(['', 'Branca', 'Preta', 'Parda', 'Amarela', 'Indígena', 'Prefiro não informar'])], ['renda', 'Renda familiar por mês (R$)', 'number'], ['pessoas_casa', 'Pessoas na casa', 'number'],
        ['_s3', 'Bolsa', 'sec'], ['inicio', 'Início da bolsa', 'date', 1], ['outra_bolsa', 'Recebe hoje outra bolsa, de qualquer instituição?', 'select', 0, opt(['', 'Não', 'Sim'])],
        ['_s4', 'Proteção de dados', 'sec'], ['lgpd', 'A pessoa foi informada e concorda que estes dados sejam usados só para a gestão do projeto e o pagamento da bolsa (Lei nº 13.709/2018).', 'check'],
        ['_s5', 'Desligamento', 'sec', { edicao: 1 }], ['fim', 'Data do desligamento', 'date'], ['motivo', 'Motivo', 'text'], ['obs', 'Observações', 'textarea']], cols: [] },
    presencas: { um: 'Participante', nome: 'Presença', novo: 'Adicionar participante', titulo: 'Lista de presença', desc: '', cols: [],
      campos: [['evento', 'Atividade', 'ref', 1, 'eventos'], ['nome', 'Nome', 'text', 1], ['comunidade', 'Comunidade', 'text'], ['municipio', 'Município', 'text'], ['mulher', 'Mulher', 'check'],
        ['agricultor', 'É uma unidade produtiva acompanhada?', 'ref', 0, 'agricultores']] },
    pessoas: { um: 'Acesso ao sistema', oque: 'Quem pode entrar. Coordenação faz tudo; Equipe (bolsistas) registra o trabalho de campo e de produção; Auxiliar administrativo cuida do financeiro e da habilitação da equipe na FUNCERN; Formador(a) registra as atividades de formação. Quem entra na equipe pela aba Equipe já ganha o acesso com o perfil da função.', dicas: { email: 'É o login. A pessoa cria a própria senha em “Primeiro acesso”, na tela de entrada, e confirma pelo e-mail que recebe.', ativo: 'Desmarque para tirar o acesso sem apagar o histórico.', perfil: 'Acompanhamento vê o andamento em tempo real (visão geral, biofábricas, lotes, distribuição e formação), não grava nada, não vê valores nem nome ou dado pessoal de agricultor.', orgao: 'Exemplo: SEAB/MDA. Aparece ao lado do nome.' }, nome: 'Acessos', titulo: 'Pessoas com acesso', desc: 'A coordenação cadastra o nome e o e-mail de quem pode entrar. A pessoa cria a própria senha em “Primeiro acesso”, na tela de entrada. Para tirar o acesso de alguém, desmarque “Acesso ativo”.', novo: 'Novo acesso', restrito: 1, semExcluir: 1,
      campos: [['nome', 'Nome', 'text', 1], ['email', 'E-mail', 'email', 1], ['perfil', 'Perfil', 'select', 1, [['Equipe', 'Equipe (bolsistas: campo, produção e formação)'], ['Auxiliar', 'Auxiliar administrativo (financeiro e habilitação da equipe)'], ['Formador', 'Formador(a) (só a Formação)'], ['Coordenação', 'Coordenação (faz tudo)'], ['Acompanhamento', 'Acompanhamento (SEAB/MDA: só consulta, sem dados pessoais)']]], ['orgao', 'Órgão ou setor (para quem acompanha)', 'text'], ['ativo', 'Acesso ativo', 'check']],
      cols: [['Nome', u => esc(u.nome)], ['E-mail', u => `<span class="mono">${esc(u.email)}</span>`], ['Perfil', u => `<span class="chip ${u.perfil === 'Coordenação' ? 'ok' : u.perfil === 'Acompanhamento' ? 'f' : ''}">${esc(R.NOME_PERFIL[u.perfil] || u.perfil)}</span>${u.orgao ? `<div class="small">${esc(u.orgao)}</div>` : ''}`],
        ['Situação', u => u.ativo === false ? '<span class="chip bad">desativado</span>' : (demo() || u.auth_id ? '<span class="chip ok">ativo</span>' : '<span class="chip f">ainda não criou a senha</span>')]] }
  };
  /* lista de presença e fotos de cada atividade/visita (script 13). Só a equipe do projeto vê: o SEAB/MDA fica com o número de participantes */
  const CONTA = new WeakMap(), contar = (L, chave) => { let c = CONTA.get(L); if (!c || c.n !== L.length) { c = { n: L.length, m: new Map() }; L.forEach(x => { const k = chave(x); c.m.set(k, (c.m.get(k) || 0) + 1); }); CONTA.set(L, c); } return c.m; };
  const evid = (t, r) => { if (r._pendente) return '<span class="small">depois de enviar</span>'; const nf = contar(db.fotos || [], f => f.tabela + ':' + f.registro).get(t + ':' + r.id) || 0, np = t === 'eventos' ? contar(db.presencas || [], x => x.evento).get(r.id) || 0 : null;
    const qt = (n, um, varios) => n ? `<span class="evb-n" aria-hidden="true">${n}</span><span class="so"> (${n} ${n === 1 ? um : varios})</span>` : `<span class="so"> (nenhum ainda)</span>`;
    return `<span class="ev-b">${np !== null ? `<button type="button" class="evb" data-presenca="${esc(r.id)}" title="Lista de presença">${IC_LISTA}<span>Lista</span>${qt(np, 'nome', 'nomes')}</button>` : ''}<button type="button" class="evb" data-fotos="${t}:${esc(r.id)}" title="Fotos">${IC_CAMERA}<span>Fotos</span>${qt(nf, 'foto', 'fotos')}</button></span>`; };
  const IC_LISTA = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM8.500 11.500h7M8.500 15.500h5"/></svg>';
  const IC_CAMERA = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l1.600-2.400h6.800L17 8h3v11H4z"/><circle cx="12" cy="13.500" r="3.500"/></svg>';
  const rotulo = { eventos: e => `${dt(e.data)} · ${e.tipo} · ${e.tema}`, unidades: u => u.nome, lotes: l => `${l.codigo || 'código ao enviar'} · ${l.tipo} · saldo ${num(saldo(l))} ${l.med}${l.status !== 'Pronto' ? ' · ' + l.status : ''}`, agricultores: a => `${a.nome}${a.comunidade ? ' · ' + a.comunidade : ''}` };

  /* ---------- telas ---------- */
  const TABS = [['painel', 'Visão geral'], ['equipe', 'Equipe'], ['unidades', 'Biofábricas'], ['lotes', 'Lotes'], ['agricultores', 'Unidades produtivas'], ['distribuicoes', 'Distribuição'], ['visitas', 'Monitoramento'], ['eventos', 'Formação'], ['financeiro', 'Financeiro'], ['relatorios', 'Relatórios'], ['historico', 'Histórico'], ['dados', 'Dados']];
  /* quem acompanha de fora não tem as abas de cadastro de pessoas, monitoramento em campo nem a de dados */
  const ABAS_FORA = ['painel', 'unidades', 'lotes', 'distribuicoes', 'eventos'];   // SEAB/MDA (14/10/2026): sem Financeiro, Relatórios e Dados; a parte financeira fica com a gestão do projeto
  const COLS_DINHEIRO = ['itens:Valor', 'unidades:Itens estimados'];   // o SEAB/MDA não vê valores (14/10/2026)
  /* abas de cada perfil: auxiliar administrativo (gestão e financeiro) e formador(a) (formação) têm as suas */
  const ABAS_PERFIL = { Acompanhamento: ABAS_FORA, Auxiliar: ['painel', 'equipe', 'financeiro', 'unidades', 'relatorios', 'dados'], Formador: ['painel', 'eventos'] };
  const abas = () => { const L = eu && ABAS_PERFIL[eu.perfil]; return L ? TABS.filter(t => L.includes(t[0])) : TABS.filter(t => t[0] !== 'historico' || coord()); };
  /* menu superior em grupos (rótulo em cima, abas embaixo); grupo sem nenhuma aba para o perfil não aparece */
  const GRUPOS = [['Gestão', ['painel', 'equipe', 'financeiro']], ['Produção', ['unidades', 'lotes', 'distribuicoes']], ['Campo', ['agricultores', 'visitas', 'eventos']], ['Documentação', ['relatorios', 'historico', 'dados']]];
  /* menu de abas que rola para o lado (celular, tablet): esmaece a borda do lado em que ainda há abas */
  /* deixa a aba inteira à vista na barra que rola de lado, longe da sombra das bordas (36 px): vale para a aba escolhida e para a que recebe o foco pelo Tab */
  function mostrarAba(s, tb) { const a = s.offsetLeft - tb.offsetLeft, z = a + s.offsetWidth, m = 40;
    if (a < tb.scrollLeft + m) tb.scrollLeft = Math.max(0, a - m); else if (z > tb.scrollLeft + tb.clientWidth - m) tb.scrollLeft = z - tb.clientWidth + m; }
  function bordasMenu() { const t = $('#tabs'); if (!t) return; const sobra = t.scrollWidth - t.clientWidth;
    t.classList.toggle('mais-esq', sobra > 2 && t.scrollLeft > 2); t.classList.toggle('mais-dir', sobra > 2 && t.scrollLeft < sobra - 2); }
  function nav() {
    const tem = abas();
    $('#tabs').innerHTML = GRUPOS.map(g => { const ts = g[1].map(k => tem.find(t => t[0] === k)).filter(Boolean); return ts.length ? `<div class="ng" role="presentation"><span class="ng-r" aria-hidden="true">${g[0]}</span><div class="ng-a" role="presentation">${ts.map(t => `<button role="tab" aria-selected="${t[0] === tab}" data-tab="${t[0]}">${t[1]}</button>`).join('')}</div></div>` : ''; }).join('');
    // aba ativa à vista no menu que rola: rola só o menu (scrollIntoView movia o ponto de partida do Tab para a aba e o primeiro Tab pulava o cabeçalho)
    const s = $('#tabs [aria-selected="true"]'), tb = $('#tabs'); if (s && tb) mostrarAba(s, tb);
    bordasMenu();
  }
  /* listas longas aparecem de 100 em 100 (as mais recentes primeiro): desenhar milhares de linhas trava celular simples */
  const PAGINA = 100, mostrando = {};
  const IC_LAPIS = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9a2.800 2.800 0 0 0-4-4L4 16v4zM13.500 6.500l4 4"/></svg>';
  const IC_LIXO = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>';
  const IC_SUBIR = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5M5 20h14"/></svg>';
  function tabela(m) {
    const M0 = MOD[m], M = Object.assign({}, M0, { cols: M0.cols.filter(c => !((c[3] === 'equipe' && (fora() || auxiliar())) || (semDinheiro() && COLS_DINHEIRO.includes(m + ':' + c[0])))) }, semDinheiro() && m === 'itens' ? { desc: 'Cada item passa por orçamento, compra pela FUNCERN e entrega.' } : {}), pode = R.podeGravar(eu, m), todas = [...db[m]].sort((a, b) => (b.data || b.inicio || '') > (a.data || a.inicio || '') ? 1 : -1);
    const lim = mostrando[m] || PAGINA, rows = todas.slice(0, lim), resto = todas.length - rows.length;
    const acoes = r => `<span class="ac">${pode ? `<button class="ab" title="Editar" data-edit="${m}:${esc(r.id)}">${IC_LAPIS}<span class="so">Editar</span></button>` : ''}${!M.semExcluir && R.podeExcluir(eu, m, r) && !r._pendente ? `<button class="ab d" title="Excluir" data-del="${m}:${esc(r.id)}">${IC_LIXO}<span class="so">Excluir</span></button>` : ''}</span>`;
    return `<div class="head"><div><h2>${M.titulo}</h2><p>${M.desc}</p></div><div class="acts">${pode && m === 'despesas' ? `<button class="b" data-new="despesas">Lançar à mão</button><label class="b p imp-b">${IC_SUBIR}Importar planilha da FUNCERN<input type="file" id="imp_arq" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" class="imp-f"></label>` : pode ? `<button class="b p" data-new="${m}">${M.novo}</button>` : ''}</div></div>
 <div class="panel scroll" tabindex="0" role="region" aria-label="${esc(M.titulo)}">${rows.length ? `<table class="tc"><thead><tr>${M.cols.map(c => `<th class="${c[2] || ''}">${c[0]}</th>`).join('')}${fora() ? '' : '<th><span class="so">Ações</span></th>'}</tr></thead><tbody>${rows.map(r => `<tr>${M.cols.map(c => `<td class="${c[2] || ''}" data-r="${esc(c[0])}">${c[1](r)}</td>`).join('')}${fora() ? '' : `<td class="a">${acoes(r)}</td>`}</tr>`).join('')}</tbody></table>` : `<div class="empty">Nenhum registro ainda.${pode ? (m === 'despesas' ? ' Use “Importar planilha da FUNCERN” ou “Lançar à mão”.' : ` Use “${M.novo}”.`) : ''}</div>`}</div>${resto > 0 ? `<div class="acts"><button class="b" data-mais="${m}">Mostrar mais ${Math.min(PAGINA, resto)} (faltam ${resto} de ${todas.length})</button></div>` : ''}`;
  }
  const finTabela = (F, titulo) => `<table><thead><tr><th>${titulo}</th><th class="n">Previsto</th><th class="n">Comprometido</th><th class="n">Pago</th><th class="n">Saldo</th></tr></thead><tbody>${F.map(r => `<tr><td>${r.m ? `Meta ${r.m} · ` : ''}${esc(r.nome)}${r.saldo < 0 ? ' <span class="chip bad">acima do previsto</span>' : ''}</td><td class="n">${brl(r.prev)}</td><td class="n">${brl(r.comp)}</td><td class="n">${brl(r.pago)}</td><td class="n">${brl(r.saldo)}</td></tr>`).join('')}<tr class="tot"><td>Total</td><td class="n">${brl(R.soma(F, 'prev'))}</td><td class="n">${brl(R.soma(F, 'comp'))}</td><td class="n">${brl(R.soma(F, 'pago'))}</td><td class="n">${brl(R.soma(F, 'saldo'))}</td></tr></tbody></table>`;
  const parcelasTxt = () => D.PARCELAS.map((p, i) => p.recebida ? `<dt>${i + 1}ª parcela, liquidada à FUNCERN em ${dt(p.data)}</dt><dd>${brl(p.valor)}</dd>` : `<dt>${i + 1}ª parcela, prevista para ${mesAno(p.previsao)}</dt><dd>${brl(p.valor)}</dd>`).join('');
  function avisoFila() {
    const ruins = pend.filter(p => p.erro), esperando = pend.length - ruins.length;
    return (esperando ? `<div class="banner"><span><b>${esperando}</b> lançamento(s) guardado(s) neste aparelho, aguardando internet para enviar.</span><button class="b s" data-sinc>Tentar enviar agora</button></div>` : '')
      + ruins.map(p => `<div class="banner"><span><b>Não enviado</b> (${esc(MOD[p.tabela].nome)}): ${esc(p.erro)}</span><span class="acts"><button class="b s" data-edit="${p.tabela}:${esc(p.dados.id)}">Corrigir</button><button class="b s d" data-descartar="${esc(p.id)}">Descartar</button></span></div>`).join('');
  }
  /* indicador com anel: pc = percentual (0 a 100), n e de = textos do número grande e do total */
  /* símbolo da biofábrica: frasco de fermentação com o preparo dentro (desenhado em torno do ponto 0,0) */
  const FRASCO = '<circle class="fr-f" r="12"/><path class="fr-l" d="M-3.900 1.5h7.800l1.900 3.700a.9.9 0 0 1-.8 1.300h-10a.9.9 0 0 1-.8-1.300z"/><path class="fr-v" d="M-3-7.500h6M-1.900-7.500v4.700l-4.300 8.200a1.200 1.200 0 0 0 1.100 1.800h10.200a1.200 1.200 0 0 0 1.100-1.800l-4.300-8.200v-4.700"/>';
  const kpi = (k, pc, n, de, rot, s2, aba, rotPc) => { const vai = aba && abas().some(t => t[0] === aba), el = vai ? 'button' : 'div'; pc = Math.max(0, Math.min(100, +pc || 0)); const pr = Math.round(pc), C = 2 * Math.PI * 18;
    return `<${el} class="dx-kpi k${k}"${vai ? ` type="button" data-tab="${aba}" title="Abrir ${abas().find(t => t[0] === aba)[1]}"` : ' tabindex="0"'}><span class="dx-kpi-topo"><span class="dx-anel" aria-hidden="true"><svg viewBox="0 0 44 44" width="52" height="52" focusable="false"><circle cx="22" cy="22" r="18" class="tr"/>${pc > 0 ? `<circle cx="22" cy="22" r="18" class="pg" stroke-dasharray="${(C * pc / 100).toFixed(2)} ${C.toFixed(2)}" transform="rotate(-90 22 22)"/>` : ''}</svg><b>${pr}%</b></span>
      <span class="dx-kpi-n"><b>${n}</b><small>${typeof de === 'number' ? ' / ' + de : ' ' + String(de).trim()}</small></span></span><span class="dx-kpi-r">${rot}</span>
      <span class="medidor fino" aria-hidden="true"><i style="width:${pc}%"></i></span><span class="dx-kpi-p"><b>${pr}%</b> ${rotPc || 'concluído'}</span><span class="dx-kpi-s">${esc(s2)}</span></${el}>`; };
  const FMT_PCT = [new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }), new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })];
  const pct = v => FMT_PCT[v < 10 && v > 0 ? 1 : 0].format(Math.round(v * 10) / 10);
  function painel() {
    const st = ['2.1', '4.1', '3.3', '3.2'].map(id => D.ETAPAS.find(e => e.id === id));
    const lab = { '2.1': 'biofábricas em funcionamento', '4.1': 'unidades produtivas acompanhadas', '3.3': 'kits de apoio entregues', '3.2': 'capacitações realizadas' };
    const X = R.execucaoGeral(db, hoje());
    const ST = { concluida: ['ok', 'Concluída'], andamento: ['ok', 'No ritmo'], atencao: ['f', 'Pouco abaixo do previsto'], atrasada: ['bad', 'Abaixo do previsto'] };
    const uConta = db.unidades.filter(u => u.conta === 'Sim'), comBase = db.agricultores.filter(a => a.diag).length, caps = db.eventos.filter(e => e.tipo === 'Capacitação'), dc = db.eventos.filter(e => e.tipo === 'Dia de campo').length;
    const sub = { '2.1': uConta.length ? `${uConta.filter(u => u.funcionando).length === uConta.length ? uConta.length + ' em funcionamento' : uConta.filter(u => !u.funcionando).length + ' em implantação'} · ${uConta.reduce((s, u) => s + nCheck(u), 0)} de ${uConta.length * D.CHECK.length} passos` : 'nenhuma unidade cadastrada',
      '4.1': `${db.agricultores.length} cadastrada(s) · ${comBase} com linha de base`, '3.3': `${db.agricultores.filter(a => !a.kit).length} cadastrada(s) ainda sem kit`,
      '3.2': `${num(caps.reduce((s, e) => s + (+e.part || 0), 0))} participante(s) · ${dc} dia(s) de campo` };
    const A = R.alertas(db, hoje());
    const prazoTxt = p => { const d = R.dias(new Date(hoje().getFullYear(), hoje().getMonth(), hoje().getDate()), pd(p)); return d < 0 ? `venceu há ${-d} dia${d === -1 ? '' : 's'}` : d === 0 ? 'hoje' : `em ${d} dia${d === 1 ? '' : 's'}`; }; const G0 = pd(D.G0), G1 = pd(D.G1), span = G1 - G0; const pos = d => Math.max(0, Math.min(100, (d - G0) / span * 100));
    const meses = []; for (let i = 0; i < 13; i++) { const d = new Date(G0.getFullYear(), G0.getMonth() + i, 1); meses.push(d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '') + '/' + String(d.getFullYear()).slice(2)); }
    let g = '', mm = 0; D.ETAPAS.forEach(e => {
      if (e.m !== mm) { mm = e.m; g += `<div class="g-row m"><span><b aria-hidden="true">M${mm}</b>Meta ${mm} · ${D.METAS[mm]}</span></div>`; }
      const a = pos(pd(e.ini)), b = pos(new Date(R.fimMes(e.fim).getTime() + 864e5)), f = feito(e), late = R.venceu(e, hoje()) && f < e.q;
      g += `<div class="g-row"><div class="g-lab"><span class="mono">${e.id}</span>${e.nome}</div><div class="g-track"><div class="g-bar ${f >= e.q ? 'ok' : late ? 'late' : hoje() < pd(e.ini) ? 'fut' : ''}" style="left:${a}%;width:${b - a}%" title="${mesAno(e.ini)} a ${mesAno(e.fim)}"><i style="width:${Math.min(100, f / e.q * 100)}%"></i></div><div class="g-today" style="left:${pos(hoje())}%"></div></div><div class="g-n"><span><b>${f}</b> de ${e.q}</span>${f >= e.q ? '<small class="ok">concluída</small>' : late ? '<small class="bad">vencida</small>' : hoje() < pd(e.ini) ? '<small>não começou</small>' : '<small>em curso</small>'}</div></div>`;
    });
    /* metas do plano de trabalho: uma linha por meta (barra = realizado, traço = previsto até o mês passado); abrir mostra as etapas */
    const mesCurto = d => d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '') + '/' + String(d.getFullYear()).slice(2);
    /* etapa que não é contada sozinha pelo sistema: as entregas (relatório, material, produto) são registradas e listadas aqui mesmo */
    const entregasDe = e => { const gs = db.entregas.filter(g => g.etapa === e.id).sort((a, b) => a.data < b.data ? 1 : -1), pode = R.podeGravar(eu, 'entregas');
      return `<div class="mt-g">${gs.map(g => `<div class="mt-gi"><span>${esc(g.titulo)}${g._pendente ? ' <span class="chip f">aguardando envio</span>' : ''}<small>${dt(g.data)}${/^https?:\/\//i.test(g.link || '') ? ` · <a href="${esc(g.link)}" target="_blank" rel="noopener noreferrer">abrir a evidência</a>` : ''}</small></span><span class="acts">${pode ? `<button class="b s" data-edit="entregas:${esc(g.id)}">Editar</button>` : ''}${R.podeExcluir(eu, 'entregas', g) && !g._pendente ? `<button class="b s d" data-del="entregas:${esc(g.id)}">Excluir</button>` : ''}</span></div>`).join('')}
        ${pode ? `<button class="b s" data-new="entregas" data-pre="${e.id}">Registrar entrega desta etapa</button>` : gs.length ? '' : '<span class="small">Nenhuma entrega registrada.</span>'}</div>`; };
    const metas = X.porMeta.map(pm => {
      const es = D.ETAPAS.filter(e => e.m === pm.m), prontas = es.filter(e => feito(e) >= e.q).length, ini = es.map(e => pd(e.ini)).sort((a, b) => a - b)[0];
      const stM = pm.feito >= 99.5 ? ['ok', 'Concluída'] : hoje() < ini ? ['', 'Começa em ' + mesCurto(ini)] : pm.feito >= pm.prev ? ['ok', 'No ritmo'] : pm.feito >= pm.prev * 0.7 ? ['f', 'Pouco abaixo do previsto'] : ['bad', 'Abaixo do previsto'];
      const conta = es.length === 1 ? `<b>${num(feito(es[0]))}</b> de ${num(es[0].q)} (${esc(es[0].un)})` : `<b>${prontas}</b> de ${es.length} etapas concluídas`;
      return `<li><details class="mt ${stM[0]}"><summary><span class="mt-n" aria-hidden="true">M${pm.m}</span><span class="mt-c"><span class="mt-t"><b>${esc(D.METAS[pm.m])}</b><span class="chip ${stM[0]}">${stM[1]}</span></span>
        <span class="medidor" role="img" aria-label="Meta ${pm.m}: ${pct(pm.feito)}% realizado, ${pct(pm.prev)}% previsto até o mês passado"><i style="width:${Math.min(100, pm.feito)}%"></i>${pm.prev > 0 && pm.prev < 100 ? `<b style="left:${pm.prev}%"></b>` : ''}</span>
        <span class="mt-p"><span>${conta} · ${pct(pm.feito)}% realizado</span><span class="mt-v">Ver detalhes</span></span></span></summary>
        <ul class="mt-e">${es.map(e => `<li><span class="mono">${e.id}</span><span>${esc(e.nome)}<small>${mesAno(e.ini)} a ${mesAno(e.fim)}${semDinheiro() ? '' : ' · ' + brl(e.q * e.v)}</small></span><b>${num(feito(e))} de ${num(e.q)}</b>${D.ETAPAS_AUTOMATICAS.includes(e.id) ? '' : entregasDe(e)}</li>`).join('')}</ul></details></li>`; }).join('');
    /* próximos marcos: saem do que já está no plano (início e prazo de etapa ainda não concluída, parcela a receber, fim da vigência) */
    const dia0 = new Date(hoje().getFullYear(), hoje().getMonth(), hoje().getDate()), marcosT = [];
    D.ETAPAS.forEach(e => { const tag = `Meta ${e.m} · ${D.METAS[e.m]}`; if (pd(e.ini) > dia0) marcosT.push([pd(e.ini), `Começa a etapa ${e.id}: ${e.nome}`, tag]); if (feito(e) < e.q) marcosT.push([R.fimMes(e.fim), `Prazo da etapa ${e.id}: ${e.nome}`, tag]); });
    if (!semDinheiro()) D.PARCELAS.forEach((p, i) => { if (!p.recebida && p.previsao) marcosT.push([R.fimMes(p.previsao), `${i + 1}ª parcela do MDA prevista (${brl(p.valor)})`, '']); });
    marcosT.push([pd(D.VIGENCIA.fim), 'Fim da vigência do TED', '']);
    const MESES3 = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const marcosF = marcosT.filter(m => m[0] >= dia0).sort((a, b) => a[0] - b[0]), nMarcos = 5;
    const marcos = marcosF.slice(0, nMarcos).map((m, i) => { const d = R.dias(dia0, m[0]); return `<li class="${i ? '' : 'prox'}" tabindex="0"><time datetime="${iso(m[0])}"><b>${m[0].getDate()}</b><span>${MESES3[m[0].getMonth()]} ${m[0].getFullYear()}</span></time><div><b>${esc(m[1])}</b>${m[2] ? `<span class="mc-m">${esc(m[2])}</span>` : ''}<span class="mc-d">${d === 0 ? 'hoje' : `em ${d} dia${d === 1 ? '' : 's'}`}</span></div></li>`; }).join('');
    const prod = {}; db.lotes.filter(l => l.status !== 'Descartado').forEach(l => { prod[l.tipo] = prod[l.tipo] || [0, 0, l.med]; prod[l.tipo][0] += +l.qtd || 0; prod[l.tipo][1] += (+l.qtd || 0) - saldo(l); });
    const I = R.indicadores(db); const F = R.fin(db), usado = R.soma(F, 'pago') + R.soma(F, 'comp'), rec = R.recebido();
    const temEx = Object.keys(MOD).some(m => db[m].some(r => r.ex));
    return `${faltaEnviar()}${fora() ? `<div class="banner fora"><span><b>Acesso de acompanhamento${eu.orgao ? ' · ' + esc(eu.orgao) : ''}.</b> Você vê o andamento do projeto como a equipe registrou, em tempo real, e não altera nada. Nomes e dados pessoais de agricultoras e agricultores não são exibidos: as unidades produtivas aparecem numeradas. A parte financeira fica com a gestão do projeto.</span>${demo() || real ? '' : '<button class="b s" data-senha>Trocar minha senha</button>'}</div>` : ''}${temEx ? `<div class="banner"><span>Modo demonstração: os registros marcados como <b>exemplo</b> são fictícios e entram nas contas abaixo.</span>${coord() ? '<button class="b s" data-limpar>Apagar exemplos</button>' : ''}</div>` : ''}
 <section class="dx-topo panel" aria-label="Indicadores principais">
  <div class="dx-exec"><span class="dx-rot">Execução física do projeto</span>
   <div class="dx-exec-num"><b>${pct(X.real)}%</b></div><div><span class="chip ${ST[X.st][0]}">${ST[X.st][1]}</span></div>
   <div class="medidor" role="img" aria-label="Executado ${pct(X.real)}%, previsto até o mês passado ${pct(X.prev)}%"><i class="${ST[X.st][0]}" style="width:${Math.min(100, X.real)}%"></i>${X.prev > 0 ? `<b style="left:${Math.min(100, X.prev)}%"></b>` : ''}</div>
   <p class="dx-exec-sub"><span>Previsto até ${X.ate}: <b>${pct(X.prev)}%</b></span><span>Mês <b>${X.mes}</b> de ${X.meses}</span></p>
   <details class="dx-como"><summary>Como é calculado</summary><p>Média ponderada pelo valor que o plano de trabalho destina a cada meta: ${X.porMeta.map(x => `Meta ${x.m} (${semDinheiro() ? 'peso ' + Math.round(x.valor / D.TOTAL * 100) + '%' : brl(x.valor).replace(',00', '')}): ${Math.round(x.feito)}%`).join(' · ')}. Cada etapa conta a quantidade registrada sobre a prevista; atividade, kit ou entrega com data depois de hoje é planejada e só conta quando a data chega. O traço na barra é o previsto pelo cronograma até o fim do mês passado. É execução física (o que foi entregue), não quanto do dinheiro foi gasto.</p></details></div>
  <div class="dx-kpis">${st.map((e, i) => kpi(i + 1, feito(e) / e.q * 100, feito(e), e.q, lab[e.id], sub[e.id], { '2.1': 'unidades', '4.1': 'agricultores', '3.3': 'agricultores', '3.2': 'eventos' }[e.id] || '')).join('')}</div>
 </section>
 ${semDinheiro() ? '' : `<section class="at panel ${A.some(a => a[0] === 'bad') ? 'crit' : A.length ? 'pend' : ''}" aria-label="O que pede atenção">
  <div class="at-cab"><h2>O que pede atenção</h2><span class="chip">${A.length ? A.length + (A.length === 1 ? ' aviso' : ' avisos') : 'nada pendente'}</span></div>
  ${A.length ? `<div class="at-col" aria-hidden="true"><span>Problema</span><span>Prazo</span><span></span></div>
  <ul class="at-lista">${A.map(a => `<li class="at-item ${a[0]}"><div class="at-txt"><span class="at-tag">${a[0] === 'bad' ? 'Urgente' : 'Atenção'} · ${esc(a[1])}</span><b>${esc(a[3])}</b><span class="small">${esc(a[4])}</span></div>
   <div class="at-prazo">${a[5] ? `${dt(a[5])}<small>${prazoTxt(a[5])}</small>` : '—'}</div>
   <div class="at-acao">${a[6] && abas().some(t => t[0] === a[6]) ? `<button class="b" data-tab="${a[6]}">${R.podeGravar(eu, a[6] === 'financeiro' ? 'despesas' : a[6]) ? 'Resolver' : 'Consultar'}</button>` : ''}</div></li>`).join('')}</ul>` : '<p class="small">Nenhum prazo vencendo, nenhuma rubrica estourada, nenhuma unidade produtiva sem acompanhamento.</p>'}
 </section>`}
 <div class="mm">
 <section class="panel mts" aria-label="Metas do plano de trabalho"><div class="mts-cab"><h2>Metas do plano de trabalho</h2><p>Barra: realizado · traço: previsto até o mês passado · toque na meta para ver as etapas e registrar as entregas</p></div><ul class="mts-l">${metas}</ul></section>
 <section class="panel mts mcs" aria-label="Próximos marcos"><div class="mts-cab"><h2>Próximos marcos</h2><p>Datas do plano de trabalho: início e prazo das etapas, ${semDinheiro() ? '' : 'parcela a receber e '}fim da vigência.${marcosF.length > nMarcos ? ` Mostrando os ${nMarcos} mais próximos de ${marcosF.length}.` : ''}</p></div>${marcos ? `<ol class="mc">${marcos}</ol>` : '<p class="small">Nenhum marco à frente.</p>'}</section>
 </div>
 ${mapa()}
 <section class="panel mts gt" aria-label="Cronograma físico do plano de trabalho"><div class="mts-cab"><h2>Cronograma físico do plano de trabalho</h2>
  <p class="g-leg"><span><i class="g-k jan"></i>período da etapa</span><span><i class="g-k fei"></i>já registrado</span><span><i class="g-k fut"></i>ainda não começou</span><span><i class="g-k late"></i>prazo vencido</span><span><i class="g-k hj"></i>hoje</span></p></div>
  <div class="scroll" tabindex="0" role="region" aria-label="Tabela (role para o lado no celular)"><div class="gantt"><div class="g-row cab"><span></span><div class="g-months">${meses.map((m, i) => `<span class="${i === (hoje().getFullYear() - G0.getFullYear()) * 12 + hoje().getMonth() - G0.getMonth() ? 'g-at' : ''}">${m}</span>`).join('')}<i class="g-hj" style="left:${pos(hoje())}%">hoje</i></div><span></span></div>${g}</div></div></section>
 <div class="two">
  ${prodDist(prod)}
  ${indMeta5(I)}
 </div>`;
  }
  /* indicadores da Meta 5: cada um com ícone, o número e uma linha dizendo de onde ele sai */
  const IC5 = {
    base: '<path d="M3 7h18v10H3z"/><circle cx="12" cy="12" r="2.6"/><path d="M6.5 7V5.5h11V7"/>',
    atual: '<path d="M9 4h6v3H9z"/><path d="M8 5.5H6.5A1.5 1.5 0 0 0 5 7v12.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V7a1.5 1.5 0 0 0-1.5-1.5H16"/><path d="m9 14 2 2 4-4"/>',
    cai: '<path d="M3 6l7 7 4-4 7 7"/><path d="M15 16h6v-6"/>',
    sobe: '<path d="M3 18l7-7 4 4 7-7"/><path d="M15 8h6v6"/>',
    usou: '<path d="M12 21v-8"/><path d="M12 13c0-4 3-7 8-7 0 5-3 8-8 7z"/><path d="M12 15c0-3-2.5-5.5-7-5.5 0 4 2.5 6 7 5.5z"/>',
    caixa: '<path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    pino: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    gente: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><circle cx="17.5" cy="9" r="2.5"/><path d="M17 14.2a5 5 0 0 1 4.5 5"/>'
  };
  /* "?" ao lado do nome do indicador: abre e fecha a explicação logo abaixo (botão de verdade: teclado e leitor de tela) */
  let nExpl = 0;
  const explica = (rot, txt) => { const id = 'ex' + (++nExpl);
    const btn = `<button type="button" class="i5-q" data-expl="${id}" aria-expanded="false" aria-controls="${id}" aria-label="O que é: ${rot.replace(/<[^>]*>/g, '')}"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.8"/><circle cx="12" cy="17.2" r=".6" fill="currentColor"/></svg></button>`;
    // o "?" fica grudado na última palavra do nome: se o nome quebra a linha, o botão vai junto (não sobra sozinho embaixo)
    const m = rot.match(/^(.*?)(\S+)$/s);
    return [`<span class="i5-r">${m ? m[1] : ''}<span class="nw">${m ? m[2] : rot}${btn}</span></span>`,
      `<p class="i5-x" id="${id}" hidden>${txt}</p>`]; };
  function indMeta5(I) {
    const ic = (k, cls) => `<span class="i5-ic ${cls || ''}" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${IC5[k]}</svg></span>`;
    const barra = (pc, cls) => `<span class="i5-bar" aria-hidden="true"><i class="${cls || ''}" style="width:${Math.max(0, Math.min(100, pc)).toFixed(1)}%"></i></span>`;
    const caiu = I.variacao != null && I.variacao < 0, maxG = Math.max(I.base, I.atual) || 1;
    const item = (icone, rot, valor, como, extra) => { const [r, x] = explica(rot, como); return `<li class="i5">${icone}<div class="i5-t">${r}<b class="i5-v">${valor}</b>${extra || ''}${x}</div></li>`; };
    return `<section class="panel mts i5-p" aria-label="Indicadores para a avaliação"><div class="mts-cab"><h2>Indicadores para a avaliação</h2><p>Meta 5 · calculados a partir das visitas e das atividades registradas; resultados ainda a validar com as agricultoras e agricultores</p></div><ul class="i5-l">
     ${item(ic('base'), 'Gasto com insumos comprados, antes do projeto', I.pares ? brl(I.base) + '<small class="i5-u">/mês</small>' : '—', 'Média da linha de base (diagnóstico inicial) das unidades que também têm gasto na última visita.', I.pares ? barra(I.base / maxG * 100, 'ant') : '')}
     ${item(ic('atual'), 'Gasto com insumos comprados, hoje', I.pares ? brl(I.atual) + '<small class="i5-u">/mês</small>' : '—', 'Média do gasto informado na visita mais recente de cada unidade.', I.pares ? barra(I.atual / maxG * 100) : '')}
     ${item(ic(caiu ? 'cai' : 'sobe', I.variacao == null ? '' : caiu ? 'ok' : 'bad'), 'Variação do gasto', I.variacao == null ? '—' : `<span class="${caiu ? 'i5-ok' : 'i5-bad'}">${I.variacao > 0 ? '+' : ''}${num(I.variacao)}%</span>`, `Comparação entre as duas médias acima, nas ${I.pares} unidade(s) produtiva(s) com os dois dados. Queda = economia com insumo comprado.`)}
     ${item(ic('usou'), 'Visitas em que o bioinsumo foi aplicado', I.visitas ? `${num(I.usou)} <small class="i5-u">de ${num(I.visitas)}</small>` : '—', 'Visitas de monitoramento em que a resposta foi “Sim, aplicou”. “Parcial” e “Não” ficam de fora.', I.visitas ? barra(I.usou / I.visitas * 100) : '')}
     ${item(ic('gente'), 'Participantes em capacitações e dias de campo', I.participantes ? `${num(I.participantes)} <small class="i5-u">${num(I.mulheres / I.participantes * 100)}% mulheres</small>` : '—', 'Soma dos participantes das atividades já realizadas (as agendadas não contam). A barra é a parte de mulheres.', I.participantes ? barra(I.mulheres / I.participantes * 100, 'mul') : '')}
    </ul></section>`;
  }
  /* produção e distribuição por tipo de bioinsumo, no mesmo desenho dos indicadores */
  function prodDist(prod) {
    const L = Object.entries(prod);
    const ic = '<span class="i5-ic" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M10 3v6L5 18a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3"/><path d="M7.5 14h9"/></svg></span>';
    return `<section class="panel mts i5-p" aria-label="Produção e distribuição"><div class="mts-cab"><h2>Produção e distribuição</h2><p>Por tipo de bioinsumo, somando os lotes (menos os descartados) · barra: parte já distribuída</p></div>
     ${L.length ? `<ul class="i5-l">${L.map(([k, v]) => { const pc = v[0] ? v[1] / v[0] * 100 : 0, nl = db.lotes.filter(l => l.tipo === k && l.status !== 'Descartado').length;
       const [r, x] = explica(esc(k), `Produzido: soma dos lotes de ${esc(k.toLowerCase())} registrados (os descartados ficam de fora). Distribuído: o que saiu desses lotes nas entregas às unidades produtivas. Saldo: o que ainda está nos lotes. A barra é a parte já distribuída.`);
       return `<li class="i5">${ic}<div class="i5-t">${r}<b class="i5-v">${num(v[0])} <small class="i5-u">${esc(v[2])} produzidos</small></b><span class="i5-bar" aria-hidden="true"><i style="width:${Math.min(100, pc).toFixed(1)}%"></i></span>
        <small>${num(v[1])} ${esc(v[2])} distribuídos (${num(pc)}%) · saldo ${num(v[0] - v[1])} ${esc(v[2])} · ${nl} lote(s)</small>${x}</div></li>`; }).join('')}</ul>` : '<p class="small">Nenhum lote registrado.</p>'}</section>`;
  }
  /* ---------- unidades produtivas: indicadores, cartão por pessoa e ficha com o histórico ---------- */
  const iniciais = n => String(n || '?').replace(/\(.*?\)/g, '').trim().split(/\s+/).filter(Boolean).map(x => x[0]).filter((x, i, a) => i === 0 || i === a.length - 1).join('').toUpperCase() || '?';
  function situacaoAgr(a) {
    if (!a.diag) return ['bad', 'Sem linha de base'];
    const r = recebeu(a.id).length, v = visitasDe(a.id).length;
    if (r && v && acompanhada(a)) return ['ok', 'Acompanhada'];   // mesma regra da Meta 4: visita no dia da 1ª entrega ou depois
    if (r) return ['f', 'Recebeu, falta visita'];
    return ['', 'Aguardando bioinsumo'];
  }
  function telaAgricultores() {
    const L = db.agricultores, pode = R.podeGravar(eu, 'agricultores'), meta = 30;
    const base = L.filter(a => a.diag).length, kits = L.filter(a => a.kit && String(a.kitdata || '') <= iso(hoje())).length, acomp = L.filter(acompanhada).length;
    const falta = (n, de) => n >= de ? 'completo' : `faltam ${de - n}`;
    const ordem = [...L].sort((a, b) => String(a.nome).localeCompare(String(b.nome), 'pt-BR'));
    const cartao = a => { const st = situacaoAgr(a), u = by('unidades', a.unidade), v = visitasDe(a.id);
      return `<li class="pc"><span class="pc-av" aria-hidden="true">${esc(iniciais(a.nome))}</span>
     <div class="pc-t"><div class="pc-n"><b>${esc(a.nome)}</b><span class="chip ${st[0]}">${st[1]}</span>${a.kit ? (String(a.kitdata || '') <= iso(hoje()) ? '<span class="chip ok">kit entregue</span>' : `<span class="chip">kit previsto para ${dt(a.kitdata)}</span>`) : ''}${exChip(a)}</div>
      <div class="pc-d"><span>${esc(a.comunidade || 'comunidade não informada')}</span><span>${esc(a.municipio || '')}${a.uf ? '/' + esc(a.uf) : ''}</span>${a.culturas ? `<span>${esc(a.culturas)}</span>` : ''}${u ? `<span>${esc(u.nome)}</span>` : ''}<span>${recebeu(a.id).length} entrega(s) · ${v.length} visita(s)</span></div></div>
     <button class="b" data-ficha="${esc(a.id)}">Ver detalhes</button></li>`; };
    return `<div class="head"><div><h2>Agricultores e unidades produtivas</h2><p>Meta de ${meta} unidades produtivas acompanhadas e ${meta} kits. Registre a linha de base antes da primeira entrega de bioinsumo.</p></div><div class="acts">${pode ? '<button class="b p" data-new="agricultores">Nova unidade produtiva</button>' : ''}</div></div>
 <section class="dx-topo panel" aria-label="Indicadores das unidades produtivas">
  ${(() => { const real = acomp / meta * 100, prev = R.previstoEtapa(D.ETAPAS.find(e => e.id === '4.1'), hoje()) * 100, st = real >= 99.5 ? ['ok', 'Meta alcançada'] : real >= prev ? ['ok', 'No ritmo'] : real >= prev * 0.7 ? ['f', 'Pouco abaixo do previsto'] : ['bad', 'Abaixo do previsto'];
    return `<div class="dx-exec"><span class="dx-rot">Unidades produtivas acompanhadas</span><div class="dx-exec-num"><b>${pct(real)}%</b></div><div><span class="chip ${st[0]}">${st[1]}</span></div>
   <span class="medidor" role="img" aria-label="${pct(real)}% acompanhadas; previsto até o mês passado: ${pct(prev)}%"><i class="${st[0] === 'ok' ? '' : st[0]}" style="width:${Math.min(100, real)}%"></i>${prev > 0 && prev < 100 ? `<b style="left:${prev}%"></b>` : ''}</span>
   <p class="dx-exec-sub"><span>Acompanhadas: <b>${acomp}</b></span><span>Meta do plano: <b>${meta}</b></span></p>
   <details class="dx-como"><summary>Como é calculado</summary><p>Conta como acompanhada a unidade produtiva que recebeu bioinsumo e teve pelo menos uma visita de monitoramento no dia da primeira entrega ou depois (visita anterior à entrega não acompanha o uso). O percentual é sobre a meta de ${meta} da etapa 4.1. O traço na barra é o previsto pelo cronograma até o fim do mês passado.</p></details></div>`; })()}
  <div class="dx-kpis fin">
  ${kpi(1, L.length / meta * 100, L.length, 'de ' + meta, 'unidades produtivas cadastradas', falta(L.length, meta))}
  ${kpi(2, L.length ? base / L.length * 100 : 0, base, 'de ' + L.length, 'com linha de base (diagnóstico inicial)', L.length ? falta(base, L.length) : 'nenhuma cadastrada')}
  ${kpi(3, kits / meta * 100, kits, 'de ' + meta, 'kits de apoio entregues', falta(kits, meta))}
  ${kpi(4, acomp / meta * 100, acomp, 'de ' + meta, 'acompanhadas (entrega e visita)', falta(acomp, meta))}</div></section>
 <div><div class="head"><div><h2>Quem está cadastrado</h2><p>Em ordem alfabética. A etiqueta mostra o que falta para a unidade contar como acompanhada.</p></div></div>
 ${ordem.length ? `<ul class="pcs">${ordem.map(cartao).join('')}</ul>` : `<div class="panel empty" style="margin-top:10px">Nenhuma unidade produtiva cadastrada ainda.${pode ? ' Use “Nova unidade produtiva”.' : ''}</div>`}</div>`;
  }
  /* ajuda: o que cada aba faz, só das abas que o perfil da pessoa enxerga */
  const AJUDA = { historico: 'Quem entrou no sistema e tudo o que foi incluído, alterado ou excluído, com quem fez e quando. Só a coordenação vê.', equipe: 'Coordenação do projeto, auxiliar administrativo, bolsistas discentes e formadores: quanto o plano prevê para cada função e quem já recebeu bolsa, conforme a planilha da FUNCERN.', painel: 'Resumo do projeto: quanto do plano já foi executado, o que pede atenção, metas, próximos marcos, mapa e cronograma.', unidades: 'As biofábricas, os passos da implantação de cada uma e os itens a comprar pela FUNCERN.',
    lotes: 'Cada batelada de bioinsumo produzida, com código, maturação e saldo.', agricultores: 'Quem o projeto atende: cadastro, linha de base, kit, entregas e visitas de cada pessoa.',
    distribuicoes: 'Cada entrega de bioinsumo: de qual lote saiu e quem recebeu.', visitas: 'Visitas de monitoramento: se aplicou, como está a cultura e quanto gasta com insumos comprados. Dá para imprimir a ficha em branco, pegar a localização pelo GPS (opcional, só a equipe vê) e anexar fotos da visita.',
    eventos: 'Capacitações, dias de campo, reuniões e articulações. Em cada uma: lista de presença (imprimir em branco, colher assinaturas e digitar os nomes) e fotos do dia.', entregas: 'Relatórios, materiais e produtos concluídos, com o link da evidência.',
    financeiro: 'Despesas por rubrica e por meta, comparadas com o plano de desembolso.', relatorios: 'Relatório de execução por período, pronto para imprimir ou salvar em PDF.', dados: 'Planilhas, cópia de segurança e (para a coordenação) quem tem acesso. A senha se troca em Meus dados, tocando no seu nome no alto.' };
  /* onde a ajuda da equipe não vale para o SEAB/MDA (que não vê lista, fotos, avisos internos nem valores) */
  const AJUDA_FORA = { painel: 'Resumo do projeto: quanto do plano já foi executado, metas, próximos marcos, mapa e cronograma.', eventos: 'Capacitações, dias de campo, reuniões e articulações, com o número de participantes.',
    unidades: 'As biofábricas, os passos da implantação de cada uma e a situação dos itens a comprar.' };
  const ajudaDe = k => (fora() && AJUDA_FORA[k]) || AJUDA[k] || '';
  const DESCR_PERFIL = { Coordenação: 'faz tudo, inclusive lançar despesas, cadastrar a equipe e os acessos e ver o histórico.', Equipe: 'registra o trabalho de campo, de produção e de formação. Despesas, equipe e acessos são da coordenação.',
    Auxiliar: 'cuida do financeiro (lança e importa as despesas da FUNCERN, acompanha os itens das biofábricas) e da habilitação da equipe na FUNCERN (cadastro no Arlo e termo). Vê as unidades produtivas numeradas, sem dado pessoal, e não lança dado de campo.',
    Formador: 'registra as capacitações e os dias de campo, com a lista de presença e as fotos. Vê o andamento do projeto sem valores e sem dado pessoal das unidades produtivas.',
    Acompanhamento: 'consulta o andamento em tempo real, sem alterar nada e sem ver dados pessoais.' };
  function abrirAjuda() {
    ed = null; $('#frm').className = 'fm';
    $('#frm').innerHTML = `<div class="fm-cab"><div><span class="fm-eye">Ajuda</span><h2>Como usar o sistema</h2></div><button type="button" class="fm-x" data-fechar aria-label="Fechar">×</button></div>
     <div class="fm-corpo"><div class="fm-oque"><span>O seu perfil</span><p>${esc(R.NOME_PERFIL[eu.perfil] || eu.perfil)}${eu.orgao ? ' · ' + esc(eu.orgao) : ''}: ${DESCR_PERFIL[eu.perfil] || ''}</p></div>
      <h3 class="fm-sec">Você está em: ${esc((abas().find(t => t[0] === tab) || ['', ''])[1])}</h3><p class="aj-p aj-aqui">${ajudaDe(tab)}</p>
      <h3 class="fm-sec">As outras abas</h3><dl class="aj">${abas().filter(t => t[0] !== tab).map(t => `<dt>${t[1]}</dt><dd>${ajudaDe(t[0])}</dd>`).join('')}</dl>
      ${fora() || auxiliar() ? '' : `<h3 class="fm-sec">Sem internet</h3><p class="aj-p">Pode lançar lotes, entregas, visitas e cadastros de campo. Eles ficam com a etiqueta “aguardando envio” e sobem sozinhos quando o sinal voltar. Despesas, acessos e exclusões precisam de internet. Depois de 72 horas sem conexão o sistema pede internet para abrir.</p>`}
      <h3 class="fm-sec">Sol forte</h3><p class="aj-p">Toque no botão do sol, no alto da tela, e ligue o <b>modo sol</b>: letra preta em fundo branco e maior. Ali também se escolhe tema claro ou escuro. Vale só neste aparelho.</p>
      <h3 class="fm-sec">Manual</h3><p class="aj-p"><a href="manuais/manual-${{ 'Coordenação': 'coordenacao', 'Equipe': 'equipe', 'Acompanhamento': 'acompanhamento', 'Auxiliar': 'coordenacao', 'Formador': 'equipe' }[eu.perfil] || 'equipe'}.pdf" target="_blank" rel="noopener">Manual do seu perfil (PDF)</a>, com as telas passo a passo. Abre numa aba nova e precisa de internet.</p>
      <h3 class="fm-sec">Segurança</h3><p class="aj-p">O sistema sai sozinho depois de 15 minutos sem uso. Em aparelho de outra pessoa, toque em sair ao terminar. Dúvida ou erro: fale com a coordenação do projeto.</p></div>
     <div class="fm-pe"><div class="frow"><button type="button" class="b p" data-fechar>Entendi</button></div></div>`;
    if (!$('#dlg').open) $('#dlg').showModal();
  }
  /* relatar problema: monta um texto com o que a coordenação precisa para entender (onde estava, perfil, aparelho) e a pessoa
     envia pelo canal que já usa. Nada é gravado no banco: o projeto é pequeno e o relato vai direto para quem resolve. */
  function abrirRelato() {
    ed = null; $('#frm').className = 'fm'; const aba = (abas().find(t => t[0] === tab) || ['', ''])[1];
    $('#frm').innerHTML = `<div class="fm-cab"><div><span class="fm-eye">Relatar problema</span><h2>O que aconteceu?</h2></div><button type="button" class="fm-x" data-fechar aria-label="Fechar">×</button></div>
     <div class="fm-corpo"><div class="fm-oque"><span>Como funciona</span><p>Escreva o que você estava fazendo e o que deu errado. O sistema junta as informações técnicas e você envia o texto para a coordenação do projeto pelo WhatsApp ou e-mail.</p></div>
      <div class="fields"><div class="fld w"><label for="rl_txt">O que você estava fazendo e o que aconteceu</label><textarea id="rl_txt" rows="5" placeholder="Exemplo: fui registrar uma entrega do lote APO-HUM-001 e apareceu que não tem saldo, mas o lote mostra 80 kg."></textarea><span class="fm-dica">Não escreva nome nem dado de agricultor aqui: diga só a aba e o que tentou fazer.</span></div></div>
      <div class="fld w" id="rl_saida" hidden><label for="rl_pronto">Texto pronto para enviar</label><textarea id="rl_pronto" rows="8" readonly></textarea></div></div>
     <div class="fm-pe"><div class="err" id="ferr" role="alert"></div><div class="frow"><button type="button" class="b" data-fechar>Fechar</button><button type="button" class="b p" data-relatook>Gerar e copiar o texto</button></div></div>`;
    $('#frm').dataset.aba = aba; if (!$('#dlg').open) $('#dlg').showModal();
  }
  async function gerarRelato(botao) {
    const t = $('#rl_txt').value.trim(); if (t.length < 10) { $('#ferr').textContent = 'Conte em uma ou duas frases o que aconteceu.'; return; }
    let versao = ''; try { versao = (await caches.keys()).filter(k => k.startsWith('sqc-')).join(', '); } catch (e) { /* sem cache */ }
    const txt = ['PROBLEMA NO SISTEMA SABERES QUE CULTIVAM', '', t, '', '— informações técnicas —', 'Quando: ' + new Date().toLocaleString('pt-BR'), 'Quem: ' + eu.nome + ' (' + eu.perfil + ')', 'Aba: ' + ($('#frm').dataset.aba || tab),
      'Versão: ' + (versao || 'não instalada neste aparelho'), 'Internet: ' + (navigator.onLine === false ? 'sem conexão' : 'com conexão') + (pend.length ? ' · ' + pend.length + ' lançamento(s) aguardando envio' : ''),
      'Tela: ' + window.innerWidth + ' x ' + window.innerHeight, 'Navegador: ' + navigator.userAgent].join('\n');
    $('#rl_saida').hidden = false; $('#rl_pronto').value = txt; $('#ferr').textContent = '';
    try { await navigator.clipboard.writeText(txt); botao.textContent = 'Copiado'; toast('Texto copiado. Cole no WhatsApp ou no e-mail da coordenação.'); }
    catch (e) { $('#rl_pronto').focus(); $('#rl_pronto').select(); toast('Selecione e copie o texto que apareceu, e envie para a coordenação.'); }
  }
  function abrirFicha(id) {
    const a = by('agricultores', id); if (!a) return; ed = null; const st = situacaoAgr(a), u = by('unidades', a.unidade), ent = recebeu(id).sort((x, y) => x.data < y.data ? 1 : -1), vis = visitasDe(id);
    const linha = (r, v) => `<dt>${r}</dt><dd>${v}</dd>`; $('#frm').className = 'fm ficha';
    $('#frm').innerHTML = `<div class="fm-cab"><div class="pc-cab"><span class="pc-av g" aria-hidden="true">${esc(iniciais(a.nome))}</span><div><h2>${esc(a.nome)}</h2><div class="pc-n"><span class="chip ${st[0]}">${st[1]}</span>${a.kit ? (String(a.kitdata || '') <= iso(hoje()) ? '<span class="chip ok">kit entregue</span>' : `<span class="chip">kit previsto para ${dt(a.kitdata)}</span>`) : ''}${exChip(a)}</div></div></div><button type="button" class="fm-x" data-fechar aria-label="Fechar">×</button></div>
 <div class="fm-corpo"><dl class="kv">${linha('Comunidade', esc(a.comunidade) || '—')}${linha('Município', (esc(a.municipio) || '—') + (a.uf ? '/' + esc(a.uf) : ''))}${linha('Território', esc(a.territorio) || '—')}${linha('Biofábrica de referência', esc(u ? u.nome : '') || '—')}${(() => { const de = deOnde(a.id), outras = de.filter(x => !u || x !== u.id); return de.length ? linha('Recebeu bioinsumo de', de.map(x => esc((by('unidades', x) || {}).nome || '')).join(', ') + (outras.length ? ` <span class="chip f">${!u ? 'sem referência no cadastro' : de.includes(u.id) ? 'também de outra' : 'diferente da de referência'}</span>` : '')) : ''; })()}
  ${linha('Culturas', esc(a.culturas) || '—')}${linha('Área cultivada', R.vazio(a.area) ? '—' : num(a.area, 1) + ' ha')}${linha('Diagnóstico inicial', a.diag ? dt(a.diag) : '<span class="chip bad">falta</span>')}
  ${linha('Usa químico', esc(a.quimico) || '—')}${linha('Gasto com insumos (linha de base)', R.vazio(a.gasto0) ? '—' : brl(a.gasto0) + '/mês')}${linha('Kit de apoio', a.kit ? 'entregue em ' + dt(a.kitdata) : 'não entregue')}</dl>
 <div><h3>Bioinsumos recebidos (${ent.length})</h3>${ent.length ? `<div class="scroll" tabindex="0" role="region" aria-label="Tabela (role para o lado no celular)"><table><tbody>${ent.map(d => { const l = by('lotes', d.lote) || {}; return `<tr><td>${dt(d.data)}</td><td><span class="mono">${esc(l.codigo || '')}</span> ${esc(l.tipo || '')}</td><td class="n">${num(d.qtd)} ${esc(l.med || '')}</td></tr>`; }).join('')}</tbody></table></div>` : '<p class="small">Nenhuma entrega registrada.</p>'}</div>
 <div><h3>Visitas de monitoramento (${vis.length})</h3>${vis.length ? `<div class="scroll" tabindex="0" role="region" aria-label="Tabela (role para o lado no celular)"><table><tbody>${vis.map(v => `<tr><td>${dt(v.data)}</td><td><span class="chip ${v.usou === 'Sim' ? 'ok' : v.usou === 'Não' ? 'bad' : 'f'}">aplicou: ${esc(v.usou)}</span></td><td>${R.vazio(v.gasto) ? '' : brl(v.gasto) + '/mês'}</td><td class="small">${esc(v.obs || '')}</td></tr>`).join('')}</tbody></table></div>` : '<p class="small">Nenhuma visita registrada.</p>'}</div></div>
 <div class="fm-pe"><div class="frow">${R.podeExcluir(eu, 'agricultores', a) && !a._pendente ? `<button type="button" class="b d" data-del="agricultores:${esc(id)}" data-fechaapos>Excluir</button>` : ''}<button type="button" class="b" data-fechar autofocus>Fechar</button>
  ${R.podeGravar(eu, 'visitas') ? `<button type="button" class="b" data-new="visitas" data-pre="${esc(id)}">Registrar visita</button><button type="button" class="b" data-new="distribuicoes" data-pre="${esc(id)}">Registrar entrega</button><button type="button" class="b p" data-edit="agricultores:${esc(id)}">Editar cadastro</button>` : ''}</div></div>`;
    if (!$('#dlg').open) $('#dlg').showModal();
  }
  /* município aberto no mapa: o que dá para saber dali sem sair da Visão geral (para o SEAB/MDA, os nomes já chegam numerados pelo banco) */
  function detalheMun(g) {
    const L = g.l.slice().sort((a, b) => String(a.nome).localeCompare(String(b.nome), 'pt-BR'));
    const ent = L.reduce((t, a) => t + recebeu(a.id).length, 0), vis = L.reduce((t, a) => t + visitasDe(a.id).length, 0), kits = L.filter(a => a.kit && String(a.kitdata || '') <= iso(hoje())).length;
    const ult = L.map(a => (visitasDe(a.id)[0] || {}).data).filter(Boolean).sort().pop();
    const bios = [...new Set(L.flatMap(a => deOnde(a.id)))].map(id => by('unidades', id)).filter(Boolean);   // pelas entregas, não pelo cadastro
    return `<div class="mp-det" role="region" aria-label="Dados de ${esc(g.nome)}"><div class="mp-det-c"><h3>${esc(g.nome)}</h3><button type="button" class="b s" data-mapamun="" aria-label="Fechar os dados de ${esc(g.nome)}">Fechar</button></div>
     <dl class="mp-det-n">${[['gente', 'Unidades produtivas', g.n], ['atual', 'Acompanhadas', g.ac], ['caixa', 'Kits entregues', kits], ['usou', 'Entregas de bioinsumo', ent], ['pino', 'Visitas', vis], ['cal', 'Última visita', ult ? dt(ult) : '—']]
       .map(([k, t, v]) => `<div><span class="md-ic" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${IC5[k]}</svg></span><dt>${t}</dt><dd>${v}</dd></div>`).join('')}</dl>
     ${bios.length ? `<p class="small">Receberam bioinsumo de: ${bios.map(u => esc(u.nome)).join(', ')}</p>` : ''}
     <p class="small mp-dica">Toque numa unidade produtiva para ver entregas, visitas e linha de base.</p><ul class="mp-det-l">${L.map(a => { const st = situacaoAgr(a); return `<li><button type="button" class="mp-pessoa" data-ficha="${esc(a.id)}" title="Ver tudo de ${esc(a.nome)}"><span>${esc(a.nome)}${a.comunidade ? `<small>${esc(a.comunidade)}</small>` : ''}</span><span class="chip ${st[0]}">${st[1]}</span><span class="mp-seta" aria-hidden="true">›</span></button></li>`; }).join('')}</ul></div>`;
  }
  /* biofábrica aberta no mapa: um resumo (implantação, produção, alcance); o resto fica na aba Biofábricas. Sem valor em dinheiro: o SEAB/MDA também vê. */
  function detalheBio(u) {
    const hj = iso(hoje()), Ls = db.lotes.filter(l => l.unidade === u.id && l.status !== 'Descartado' && String(l.inicio || '') <= hj), ids = new Set(Ls.map(l => l.id));
    const prep = Ls.filter(l => ['Em preparo', 'Maturando'].includes(l.status)).length;
    const disp = {}; Ls.filter(l => l.status === 'Pronto').forEach(l => { const s = saldo(l); if (s > 0) { const k = l.tipo + '|' + (l.med || ''); disp[k] = (disp[k] || 0) + s; } });
    const ent = db.distribuicoes.filter(d => ids.has(d.lote) && String(d.data || '') <= hj), ult = ent.map(d => d.data).sort().pop();
    const ref = db.agricultores.filter(a => a.unidade === u.id).length, receberam = db.agricultores.filter(a => deOnde(a.id).includes(u.id)).length, feitos = nCheck(u), tot = D.CHECK.length;
    const nome = esc(u.nome) + ' (' + esc(u.municipio) + '/' + esc(u.uf) + ')';
    return `<div class="mp-det mp-bio" role="region" aria-label="Dados da biofábrica ${nome}"><div class="mp-det-c"><h3><svg class="mk-f" viewBox="-13 -13 26 26" width="26" height="26" aria-hidden="true" focusable="false">${FRASCO}</svg><span>${esc(u.nome)}<small>${esc(u.municipio)}/${esc(u.uf)}${u.conta === 'Sim' ? '' : ' · apoio'}</small></span></h3><button type="button" class="b s" data-mapamun="" aria-label="Fechar os dados da biofábrica ${esc(u.nome)}">Fechar</button></div>
     <div class="mp-imp"><div class="mp-imp-t"><b>Implantação</b><span>${feitos} de ${tot}${feitos < tot ? ' · próximo: ' + esc(R.proximoPasso(u)) : ' · concluída'}</span></div>${bar(feitos, tot)}
      <ul class="mp-ck">${D.CHECK.map(c => `<li class="${u[c[0]] ? 'ok' : ''}"><i aria-hidden="true">${u[c[0]] ? '✓' : ''}</i>${esc(c[1])}<span class="so">${u[c[0]] ? ': feito' : ': falta'}</span></li>`).join('')}</ul></div>
     <dl class="mp-det-n">${[['caixa', 'Lotes produzidos', Ls.length], ['cal', 'Em preparo', prep], ['gente', 'Unidades produtivas que receberam daqui', receberam + `<small class="mp-ult">${ref} com esta como referência</small>`], ['usou', 'Entregas de bioinsumo', ent.length + (ult ? `<small class="mp-ult">última em ${dt(ult)}</small>` : '')]]
       .map(([k, t, v]) => `<div><span class="md-ic" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${IC5[k]}</svg></span><dt>${t}</dt><dd>${v}</dd></div>`).join('')}</dl>
     <div><h4 class="mp-h4">Disponível agora para entregar</h4>${Object.keys(disp).length ? `<ul class="mp-disp">${Object.entries(disp).sort((a, b) => b[1] - a[1]).map(([k, v]) => { const [t, m] = k.split('|'); return `<li><span>${esc(t)}</span><b>${num(v)} ${esc(m)}</b></li>`; }).join('')}</ul>` : '<p class="small">Nenhum lote pronto com saldo.</p>'}</div>
     ${abas().some(t => t[0] === 'unidades') ? `<div class="frow"><button type="button" class="b" data-tab="unidades">Ver na aba Biofábricas</button></div>` : ''}</div>`;
  }
  /* ---------- mapa: onde estão as biofábricas e as unidades produtivas (Ceará e Rio Grande do Norte) ---------- */
  let mapaUF = 'todos', mapaMun = '';   // mapaMun: município aberto no mapa (clique ou Enter no círculo)
  const semAcento = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[-']/g, ' ').replace(/\s+/g, ' ').trim();
  const pontoDe = (mun, uf) => SQC.GEO.mun[semAcento(mun) + '/' + String(uf || '').toUpperCase().trim()] || null;
  function mapa() {
    const estreito = window.innerWidth < 720, G = SQC.GEO, ufs = mapaUF === 'todos' ? ['CE', 'RN'] : [mapaUF], W = estreito ? 340 : 620, H = estreito ? 300 : 440, M = 22;
    const b = ufs.map(u => G.uf[u].b).reduce((a, x) => [Math.min(a[0], x[0]), Math.min(a[1], x[1]), Math.max(a[2], x[2]), Math.max(a[3], x[3])]);
    const kx = Math.cos((b[1] + b[3]) / 2 * Math.PI / 180), esc_ = Math.min((W - 2 * M) / ((b[2] - b[0]) * kx), (H - 2 * M) / (b[3] - b[1]));
    const ox = (W - (b[2] - b[0]) * kx * esc_) / 2, oy = (H - (b[3] - b[1]) * esc_) / 2;
    const X = lon => ox + (lon - b[0]) * kx * esc_, Y = lat => oy + (b[3] - lat) * esc_;
    const noRecorte = a => ufs.includes(String(a.uf || '').toUpperCase().trim());
    // unidades produtivas agrupadas por município
    const grupos = {}; let fora = 0; const L = db.agricultores;
    L.forEach(a => { const p = pontoDe(a.municipio, a.uf); if (!p) { fora++; return; } if (!noRecorte(a)) return; const k = semAcento(a.municipio) + '/' + String(a.uf).toUpperCase().trim(); (grupos[k] = grupos[k] || { k, p, nome: a.municipio + '/' + String(a.uf).toUpperCase().trim(), n: 0, ac: 0, l: [] }).n++; grupos[k].l.push(a); if (acompanhada(a)) grupos[k].ac++; });
    const pts = Object.values(grupos).sort((a, c) => c.n - a.n), bio = db.unidades.map(u => ({ u, p: pontoDe(u.municipio, u.uf) })).filter(x => x.p && noRecorte(x.u));
    const visiveis = L.filter(a => pontoDe(a.municipio, a.uf) && noRecorte(a)), cont = {}; visiveis.forEach(a => { const s = situacaoAgr(a)[1]; cont[s] = (cont[s] || 0) + 1; });
    const ORDEM = [['Acompanhada', 'ok'], ['Recebeu, falta visita', 'f'], ['Aguardando bioinsumo', ''], ['Sem linha de base', 'bad']];
    const anel = r => 'M' + r.map(q => X(q[0]).toFixed(1) + ' ' + Y(q[1]).toFixed(1)).join(' L') + ' Z';
    const raio = n => Math.min(26, 10 + 3.2 * Math.sqrt(n));
    /* municípios vizinhos (e a biofábrica do próprio município) cairiam um em cima do outro: cada marca é empurrada
       só o bastante para não encostar nas outras. A posição fica aproximada; o nome certo está na dica e na lista ao lado. */
    const nos = pts.map(g => ({ g, x: X(g.p[0]), y: Y(g.p[1]), r: raio(g.n) })).concat(bio.map(x => ({ b: x, x: X(x.p[0]) + 6, y: Y(x.p[1]) - 6, r: 12 })));
    for (let v = 0; v < 80; v++) for (let i = 0; i < nos.length; i++) for (let j = i + 1; j < nos.length; j++) {
      const a = nos[i], c = nos[j]; let dx = c.x - a.x, dy = c.y - a.y, d = Math.hypot(dx, dy); const min = a.r + c.r + 3;
      if (d >= min) continue; if (d < 0.01) { dx = 1; dy = -1; d = Math.SQRT2; }
      const e = (min - d) / 2 / d; a.x -= dx * e; a.y -= dy * e; c.x += dx * e; c.y += dy * e;
    }
    nos.forEach(o => { o.x = Math.max(o.r + 2, Math.min(W - o.r - 2, o.x)); o.y = Math.max(o.r + 2, Math.min(H - o.r - 2, o.y)); });
    // município aberto: os dados dele tomam o lugar do resumo ao lado do mapa (o painel não cresce para baixo); “Fechar” volta ao resumo
    const aberto = pts.find(x => x.k === mapaMun), bioAberta = mapaMun.startsWith('bio:') ? (bio.find(x => 'bio:' + x.u.id === mapaMun) || {}).u : null;
    return `<section class="mp panel" aria-label="Mapa do projeto"><div class="head"><div><h2>Onde o projeto está</h2><p>${visiveis.length} unidade(s) produtiva(s) e ${bio.length} biofábrica(s) no mapa${fora ? ` · ${fora} cadastro(s) fora do mapa (município não reconhecido no CE ou no RN)` : ''}</p></div>
   <div class="seg peq" role="tablist">${[['todos', 'Todos'], ['CE', 'CE'], ['RN', 'RN']].map(o => `<button type="button" role="tab" aria-selected="${mapaUF === o[0]}" data-mapa="${o[0]}">${o[1]}</button>`).join('')}</div></div>
  <div class="mp-g"><div class="mp-m"><svg data-vb="${W}" viewBox="0 0 ${W} ${H}" role="group" aria-label="Mapa do ${ufs.map(u => u === 'CE' ? 'Ceará' : 'Rio Grande do Norte').join(' e do ')} com as biofábricas e as unidades produtivas por município. Cada círculo abre os dados do município e cada frasco, os da biofábrica; os mesmos números estão na lista ao lado.">
    ${ufs.map(u => G.uf[u].r.map(r => `<path class="mp-uf" d="${anel(r)}"/>`).join('') + `<text class="mp-sg" x="${X((G.uf[u].b[0] + G.uf[u].b[2]) / 2)}" y="${Y((G.uf[u].b[1] + G.uf[u].b[3]) / 2 - (u === 'CE' ? 0.9 : 0.35))}" text-anchor="middle">${u}</text>`).join('')}
    ${nos.filter(o => o.g).map(o => { const g = o.g; return `<g class="mp-p${g.k === mapaMun ? ' sel' : ''}" role="button" tabindex="0" data-mapamun="${esc(g.k)}" aria-pressed="${g.k === mapaMun}" aria-label="${esc(g.nome)}: ${g.n} unidade(s) produtiva(s), ${g.ac} acompanhada(s). Ver detalhes"><circle cx="${o.x.toFixed(1)}" cy="${o.y.toFixed(1)}" r="${o.r.toFixed(1)}"/><text x="${o.x.toFixed(1)}" y="${(o.y + 4.5).toFixed(1)}" text-anchor="middle">${g.n}</text></g>`; }).join('')}
    ${nos.filter(o => o.b).map(o => { const x = o.b, cx = o.x, cy = o.y; const k = 'bio:' + x.u.id; return `<g class="mp-b${k === mapaMun ? ' sel' : ''}" role="button" tabindex="0" data-mapamun="${esc(k)}" aria-pressed="${k === mapaMun}" aria-label="Biofábrica ${esc(x.u.nome)} (${esc(x.u.municipio)}/${esc(x.u.uf)}): ${nCheck(x.u)} de ${D.CHECK.length} passos da implantação. Ver detalhes"><circle class="mp-b-alvo" cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="16"/><g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)})">${FRASCO}</g><text x="${(cx + 17).toFixed(1)}" data-esq="${(cx - 17).toFixed(1)}" y="${(cy + 4).toFixed(1)}">${esc(x.u.sigla)}</text></g>`; }).join('')}
   </svg><div class="leg"><span><i class="mk c"></i>Unidades produtivas no município (o número é quantas)</span><span><svg class="mk-f" viewBox="-13 -13 26 26" width="20" height="20" aria-hidden="true" focusable="false">${FRASCO}</svg>Biofábrica</span></div></div>
   <div class="mp-l">${aberto ? detalheMun(aberto) : bioAberta ? detalheBio(bioAberta) : ''}<div class="mp-resumo"${aberto || bioAberta ? ' hidden' : ''}><div class="mp-n"><b>${visiveis.length}</b><span><strong>unidades produtivas</strong>${pts.length} município(s) · meta de 30</span></div>
    <div><h3>Situação</h3><ul class="mp-s">${ORDEM.map(o => `<li><span class="chip ${o[1]}">${o[0]}</span><b>${cont[o[0]] || 0}</b></li>`).join('')}</ul></div>
    <div><h3>Biofábricas</h3>${bio.length ? `<ul class="mp-s bf">${bio.map(x => `<li><button type="button" class="mp-mun mp-bf" data-mapamun="bio:${esc(x.u.id)}" aria-pressed="false" aria-label="${esc(x.u.nome)}, ${esc(x.u.municipio)}/${esc(x.u.uf)}: ${nCheck(x.u)} de ${D.CHECK.length} passos da implantação. Ver detalhes"><svg class="mk-f" viewBox="-13 -13 26 26" width="28" height="28" aria-hidden="true" focusable="false">${FRASCO}</svg><span>${esc(x.u.nome)}<small>${esc(x.u.municipio)}/${esc(x.u.uf)}${x.u.conta === 'Sim' ? '' : ' · apoio'}</small></span><b>${nCheck(x.u)}/${D.CHECK.length}</b></button></li>`).join('')}</ul>` : '<p class="small">Nenhuma neste recorte.</p>'}</div>
    <div><h3>Municípios com mais unidades produtivas</h3>${pts.length ? `<ul class="mp-s pt">${pts.slice(0, 8).map(g => `<li><button type="button" class="mp-mun" data-mapamun="${esc(g.k)}" aria-pressed="${g.k === mapaMun}"><span>${esc(g.nome)}</span><b>${g.n}</b></button></li>`).join('')}</ul>` : '<p class="small">Nenhuma unidade produtiva cadastrada neste recorte.</p>'}</div></div></div></div></section>`;
  }
  /* ---------- financeiro: gráfico do ritmo do gasto, uso de cada rubrica e tabela que abre ---------- */
  let ritmoAtual = null;   // o que o gráfico mostrou por último (a dica ao passar o mouse lê daqui)
  /* medidas do desenho: no celular ele já nasce estreito, para a letra (que não encolhe) caber na margem */
  const GR_LARGO = { w: 640, h: 300, l: 78, r: 14, t: 14, b: 30 }, GR_ESTREITO = { w: 340, h: 250, l: 74, r: 10, t: 16, b: 30 }; let GR = GR_LARGO;
  function graficoRitmo(forcar) {
    const caixa = document.querySelector('.fin-2'), larg = caixa ? (window.innerWidth > 980 ? caixa.clientWidth / 2 : caixa.clientWidth) : window.innerWidth;
    GR = forcar || (larg < 560 ? GR_ESTREITO : GR_LARGO);   // palpite antes de desenhar; ajustarGrafico() confere depois, pelo espaço que o gráfico ganhou de fato
    const X = R.ritmo(db, hoje()), P = X.pontos, n = P.length, max = X.total; ritmoAtual = X;
    const x = i => GR.l + (GR.w - GR.l - GR.r) * (i + 1) / n, y = v => GR.h - GR.b - (GR.h - GR.t - GR.b) * v / max, x0 = GR.l;
    const linha = k => { const pts = P.map((p, i) => p[k] == null ? null : [x(i), y(p[k])]).filter(Boolean); return pts.length ? 'M' + [[x0, y(0)]].concat(pts).map(q => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' L') : ''; };
    // recebido entra de uma vez (parcela): linha em degrau
    const degrau = () => { let d = `M${x0} ${y(0)}`, ant = 0; P.forEach((p, i) => { if (p.recebido == null) return; d += ` L${x(i).toFixed(1)} ${y(ant).toFixed(1)}`; if (p.recebido !== ant) { d += ` L${x(i).toFixed(1)} ${y(p.recebido).toFixed(1)}`; ant = p.recebido; } }); return d; };
    const ult = P.filter(p => p.executado != null).length - 1, grade = [0, .25, .5, .75, 1].map(f => max * f);
    const mk = v => v === 0 ? '0' : (GR === GR_ESTREITO ? '' : 'R$ ') + num(v / 1000) + ' mil';   // estreito: "400 mil" cabe na margem
    const atual = P.findIndex(p => p.atual);
    return `<div class="panel box fin-g"><div><h2 class="fin-t">Ritmo do gasto <small>acumulado mês a mês</small></h2>
   <div class="leg"><span><i class="lg prev"></i>Previsto (plano de desembolso)</span><span><i class="lg exec"></i>Pago</span><span><i class="lg rec"></i>Recebido do MDA</span></div></div>
   <div class="rg" data-rg tabindex="0" role="group" aria-label="Gráfico do gasto acumulado. Use as setas para a esquerda e para a direita para ouvir cada mês."><span class="so" id="rg-voz" aria-live="polite"></span><svg data-vb="${GR.w}" viewBox="0 0 ${GR.w} ${GR.h}" role="img" aria-label="Gasto acumulado mês a mês: previsto, pago e recebido. Os valores estão na tabela logo abaixo.">
    ${grade.map(v => `<line class="gr" x1="${GR.l}" x2="${GR.w - GR.r}" y1="${y(v)}" y2="${y(v)}"/><text class="ax" x="${GR.l - 8}" y="${y(v) + 4}" text-anchor="end">${mk(v)}</text>`).join('')}
    ${P.map((p, i) => i % (window.innerWidth < 720 ? 3 : 2) ? '' : `<text class="ax" x="${x(i)}" y="${GR.h - 8}" text-anchor="middle">${p.rotulo}</text>`).join('')}
    ${atual >= 0 ? `<line class="hj" x1="${x(atual)}" x2="${x(atual)}" y1="${GR.t}" y2="${GR.h - GR.b}"/><text class="ax" x="${x(atual) + 5}" y="${GR.t + 10}">mês atual</text>` : ''}
    <path class="l prev" d="${linha('previsto')}"/><path class="l rec" d="${degrau()}"/><path class="l exec" d="${linha('executado')}"/>
    ${ult >= 0 ? `<circle class="pt exec" cx="${x(ult)}" cy="${y(P[ult].executado)}" r="4.5"/><circle class="pt rec" cx="${x(ult)}" cy="${y(P[ult].recebido)}" r="4.5"/>` : ''}
    <line class="cr" data-cr x1="0" x2="0" y1="${GR.t}" y2="${GR.h - GR.b}" hidden/></svg><div class="dica" data-dica hidden></div></div>
   <p class="small">Passe o mouse ou toque num mês. O previsto é o plano de desembolso enviado à FUNCERN (planilha de 05/10/2026, ajustada ao plano universal v4 de 07/10/2026) e fecha em ${brl(X.total)}.</p>
   <details class="dx-como"><summary>Ver os números em tabela</summary><div class="scroll" tabindex="0" role="region" aria-label="Tabela (role para o lado no celular)"><table><thead><tr><th>Mês</th><th class="n">Previsto</th><th class="n">Pago</th><th class="n">Recebido</th></tr></thead><tbody>${P.map(p => `<tr><td>${p.rotulo}</td><td class="n">${brl(p.previsto)}</td><td class="n">${p.executado == null ? '—' : brl(p.executado)}</td><td class="n">${p.recebido == null ? '—' : brl(p.recebido)}</td></tr>`).join('')}</tbody></table></div></details></div>`;
  }
  function usoRubricas(FR) {
    const t = R.tempoDecorrido(hoje()) * 100;
    return `<div class="panel box fin-g"><div><h2 class="fin-t">Uso de cada rubrica <small>% do previsto · clique para ver os itens</small></h2>
   <div class="leg"><span><i class="lg exec"></i>Pago</span><span><i class="lg comp"></i>Comprometido</span><span><i class="lg tempo"></i>Tempo decorrido (${pct(t)}%)</span></div></div>
   <div class="ur">${FR.filter(r => !r.semRubrica).map(r => { const a = r.prev ? r.pago / r.prev * 100 : 0, b = r.prev ? r.comp / r.prev * 100 : 0, tot = a + b;
      return `<button type="button" class="ur-l" data-rub="${r.id}" title="Pago ${brl(r.pago)} · comprometido ${brl(r.comp)} · previsto ${brl(r.prev)}"><span class="ur-n">${esc(r.nome)}</span><span class="ur-p${tot > 100 ? ' est' : ''}">${pct(tot)}%${tot > 100 ? ' · acima' : ''}</span>
       <span class="ur-b"><i class="exec" style="width:${Math.min(100, a)}%"></i><i class="comp" style="left:${Math.min(100, a)}%;width:${Math.max(0, Math.min(100 - Math.min(100, a), b))}%"></i><b style="left:${t}%"></b></span></button>`; }).join('')}</div>
   <p class="small">O traço marca quanto da vigência já passou. Barra muito à frente do traço: a rubrica acaba antes do projeto. Muito atrás: há recurso parado.</p></div>`;
  }
  /* conteúdo de linha que abre (rubrica, meta): só é montado quando alguém abre. Antes cada despesa era desenhada três vezes
     escondida e o Financeiro levava 1,4 s num celular simples (auditoria de 14/10) */
  let TARDE = new Map(), nTarde = 0;
  const adiar = html => html.trim().replace(/<\/summary>([\s\S]*)<\/details>$/, (x, corpo) => { const k = 't' + (++nTarde); TARDE.set(k, corpo); return `</summary><div data-tarde="${k}" hidden></div></details>`; });
  function abrirTarde(d) { d.querySelectorAll(':scope > [data-tarde]').forEach(x => { const h = TARDE.get(x.dataset.tarde); x.outerHTML = h == null ? '' : h; }); }
  function tabelaRubricas(FR, lim) {
    const FI = R.finItens(db, lim);
    const rm = k => ritmoAtual ? ritmoAtual.pontos[k].rotulo : k + 1;
    const linha = r => { const u = r.prev ? (r.pago + r.comp) / r.prev * 100 : 0, itens = D.DESEMBOLSO.itens.filter(i => i.rubrica === r.id), ds = db.despesas.filter(d => r.semRubrica ? !D.RUBRICAS.some(x => x.id === d.rubrica) : d.rubrica === r.id).sort((a, b) => a.data < b.data ? 1 : -1);
      const v = (x, forte) => x ? (forte ? `<b>${brl(x)}</b>` : brl(x)) : '—';
      return `<details class="rb" id="rb-${r.id || 'sem'}"><summary><span class="rb-n"><i class="rb-s" aria-hidden="true"></i><span>${esc(r.nome)}</span><span class="chip">${itens.length ? itens.length + (itens.length === 1 ? ' item' : ' itens') : ds.length + ' despesa(s)'}</span></span>
     <span class="rb-v" data-r="Previsto">${v(r.prev)}</span><span class="rb-v" data-r="Pago">${v(r.pago)}</span><span class="rb-v" data-r="Comprometido">${v(r.comp)}</span><span class="rb-v${r.saldo < 0 ? ' neg' : ''}" data-r="Saldo"><b>${brl(r.saldo)}</b></span>
     <span class="rb-e"><span class="medidor fino"><i class="${u > 100 ? 'bad' : ''}" style="width:${Math.min(100, u)}%"></i></span><b>${pct(u)}%</b></span></summary>
    <div class="rb-c">${itens.map(i => { const x = FI.find(y => y.id === i.id), ui = x.prev ? (x.pago + x.comp) / x.prev * 100 : 0, ms = x.meses;
        const comp_ = x.mensal ? `${ms.length} meses · ${brl(x.mensal)}/mês` : ms.length === 1 ? `1 desembolso, em ${rm(ms[0])}` : `${ms.length} desembolsos, de ${rm(ms[0])} a ${rm(ms[ms.length - 1])}`;
        return `<details class="rb-i"><summary><span class="rb-in">${esc(i.nome)}</span><span class="rb-v" data-r="Previsto">${brl(x.prev)}</span><span class="rb-v" data-r="Pago">${v(x.pago)}</span><span class="rb-v" data-r="Comprometido">${v(x.comp)}</span><span class="rb-v${x.saldo < 0 ? ' neg' : ''}" data-r="Saldo">${brl(x.saldo)}</span>
          <span class="rb-e"><span class="medidor fino"><i class="${ui > 100 ? 'bad' : ''}" style="width:${Math.min(100, ui)}%"></i></span><b>${pct(ui)}%</b></span></summary>
          <dl class="rb-x"><div><dt>Composição</dt><dd>${comp_}</dd></div><div><dt>Previsto</dt><dd>${brl(x.prev)}</dd></div><div><dt>Pago</dt><dd>${brl(x.pago)}</dd></div><div><dt>Comprometido</dt><dd>${brl(x.comp)}</dd></div><div><dt>Saldo</dt><dd class="${x.saldo < 0 ? 'neg' : ''}"><b>${brl(x.saldo)}</b></dd></div><div><dt>Despesas com este item</dt><dd>${x.despesas.length}</dd></div></dl></details>`; }).join('')}
      ${itens.length && ds.some(d => !d.item) ? `<p class="rb-si">${ds.filter(d => !d.item).length} despesa(s) desta rubrica sem item indicado (${brl(ds.filter(d => !d.item).reduce((t, d) => t + (+d.valor || 0), 0))}): entram no total da rubrica, mas não em nenhum item. Para corrigir, edite a despesa na lista “Despesas do projeto”, no fim desta página, e escolha o item.</p>` : ''}
     <div class="rb-d"><h3>Despesas lançadas nesta rubrica</h3>${ds.length ? `<div class="scroll" tabindex="0" role="region" aria-label="Tabela (role para o lado no celular)"><table><thead><tr><th>Data</th><th>Etapa</th><th>Descrição</th><th>Situação</th><th class="n">Valor</th></tr></thead><tbody>${ds.map(d => `<tr><td>${dt(d.data)}${exChip(d)}</td><td><span class="mono">${esc(d.etapa)}</span></td><td>${esc(d.descricao)}<div class="small">${esc((D.DESEMBOLSO.itens.find(i => i.id === d.item) || { nome: 'sem item indicado' }).nome)}${d.favorecido ? ' · ' + esc(d.favorecido) : ''}</div></td><td><span class="chip ${d.status === 'Pago' ? 'ok' : 'f'}">${esc(d.status)}</span></td><td class="n">${brl(d.valor)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="small">Nenhuma despesa lançada ainda.</p>'}</div></div></details>`; };
    return `<div><div class="head"><div><h2>Por rubrica</h2><p>Toque na rubrica para ver os itens do plano e as despesas lançadas nela.</p></div><div class="acts"><button class="b" data-abrir-rub>Abrir todas</button></div></div>
   <div class="panel rb-t" style="margin-top:10px"><div class="rb-h" aria-hidden="true"><span>Rubrica</span><span>Previsto</span><span>Pago</span><span>Comprometido</span><span>Saldo</span><span>Execução</span></div>${FR.map(r => adiar(linha(r))).join('')}
    <div class="rb-tot"><span>Total</span><span data-r="Previsto">${brl(R.soma(FR, 'prev'))}</span><span data-r="Pago">${brl(R.soma(FR, 'pago'))}</span><span data-r="Comprometido">${brl(R.soma(FR, 'comp'))}</span><span data-r="Saldo"><b>${brl(R.soma(FR, 'saldo'))}</b></span><span></span></div></div>
   <p class="note" style="margin-top:8px">Passar de uma rubrica para outra exige ajuste do plano de trabalho. O sistema avisa no painel quando uma rubrica chega a 90% ou estoura.</p></div>`;
  }
  /* ---------- importar a planilha de solicitações da FUNCERN: lê no aparelho, mostra o que vai mudar e só grava depois de confirmar ---------- */
  let imp = null;
  const CH_ST = 'sqc-imp-status';
  const lerLS = k => { try { return JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return {}; } };
  async function aoEscolherPlanilha(arq) {
    if (!arq) return;
    try {
      if (!/\.xlsx$/i.test(arq.name)) throw new Error('Envie a planilha no formato .xlsx, como a FUNCERN exporta.');
      const L = R.lerSolicitacoes(await SQC.planilha.ler(await arq.arrayBuffer()));
      if (!L.sols.length) throw new Error('Não encontrei solicitações nesta planilha. Ela precisa ter a coluna “ID Solicitação”, como a exportação da FUNCERN.');
      imp = { nome: arq.name, sols: L.sols, erros: L.erros, escolhas: { status: lerLS(CH_ST), etapa: {}, rubrica: {} } }; desenharImportacao();
    } catch (e) { toast(e.message || 'Não consegui ler a planilha.'); }
  }
  function desenharImportacao(msg) {
    const P = imp.plano = R.planoImportacao(db, imp.sols, imp.escolhas); ed = null; $('#frm').className = 'fm';
    const op = (lista, sel) => lista.map(o => `<option value="${esc(o[0])}"${o[0] === sel ? ' selected' : ''}>${esc(o[1])}</option>`).join('');
    const n = P.novas + P.atualizadas + P.removidas;
    $('#frm').innerHTML = `<div class="fm-cab"><div><span class="fm-eye">Importar planilha</span><h2>Solicitações da FUNCERN</h2></div><button type="button" class="fm-x" data-fechar aria-label="Fechar">×</button></div>
     <div class="fm-corpo"><div class="fm-oque"><span>${esc(imp.nome)}</span><p>Nada é gravado antes de você confirmar. O CPF dos beneficiários não é lido nem guardado. Cada solicitação é reconhecida pelo número: subir a mesma planilha de novo não duplica nada.</p></div>
      <dl class="imp-r"><div><dt>Novas</dt><dd>${P.novas}</dd></div><div><dt>Atualizadas</dt><dd>${P.atualizadas}</dd></div><div><dt>Sem mudança</dt><dd>${P.iguais}</dd></div><div><dt>Removidas</dt><dd>${P.removidas}</dd></div><div><dt>Pago</dt><dd>${brl(P.pago)}</dd></div><div><dt>Comprometido</dt><dd>${brl(P.comprometido)}</dd></div></dl>
      <h3 class="fm-sec">Como cada status da fundação entra na conta</h3>
      <div class="imp-l">${P.status.map(s => `<div class="imp-i"><div><b>${esc(s.txt)}</b><span class="small">${s.n} solicitação(ões) · ${brl(s.total)}</span></div><select data-imp-st="${esc(s.txt)}" aria-label="Como contar o status ${esc(s.txt)}">${op([['Pago', 'Conta como pago'], ['Comprometido', 'Conta como comprometido'], ['Ignorar', 'Não entra (cancelada)']], s.destino)}</select></div>`).join('')}</div>
      <h3 class="fm-sec">Etapa do plano de cada tipo de despesa</h3><p class="aj-p">A planilha não traz a etapa do TED. Escolha uma vez por tipo: nas próximas importações o sistema repete a escolha.</p>
      <div class="imp-l">${P.grupos.map(g => `<div class="imp-i${!g.rubrica || !g.etapa ? ' falta' : ''}"><div><b>${esc(g.detalhe || g.rubricaTxt || 'Sem detalhe')}</b><span class="small">${esc(g.rubricaTxt)} · ${g.n} solicitação(ões) · ${brl(g.total)}</span></div>
        <span class="imp-s">${g.rubricaAuto ? '' : `<select data-imp-rb="${esc(g.chave)}" aria-label="Rubrica de ${esc(g.detalhe)}">${op([['', 'Escolha a rubrica']].concat(D.RUBRICAS.map(x => [x.id, x.nome])), g.rubrica)}</select>`}<select data-imp-et="${esc(g.chave)}" aria-label="Etapa de ${esc(g.detalhe)}">${op([['', 'Escolha a etapa']].concat(D.ETAPAS.map(e => [e.id, `${e.id} · ${e.nome}`])), g.etapa)}</select></span></div>`).join('') || '<p class="small">Nenhuma solicitação a importar.</p>'}</div>
      ${imp.erros.length ? `<h3 class="fm-sec">Linhas que não consegui ler (${imp.erros.length})</h3><ul class="al">${imp.erros.slice(0, 8).map(e => `<li><span>${esc(e)}</span></li>`).join('')}</ul>` : ''}
      ${P.foraDaPlanilha || P.manuais ? `<p class="note">${P.foraDaPlanilha ? `${P.foraDaPlanilha} despesa(s) importada(s) antes não estão nesta planilha e ficam como estão. ` : ''}${P.manuais ? `${P.manuais} despesa(s) lançada(s) à mão não são alteradas pela importação.` : ''}</p>` : ''}</div>
     <div class="fm-pe"><div class="err" id="ferr" role="alert">${esc(msg || (P.faltam ? `Falta escolher a etapa${P.grupos.some(g => !g.rubrica) ? ' ou a rubrica' : ''} de ${P.faltam} tipo(s) de despesa.` : ''))}</div><div class="frow"><button type="button" class="b" data-fechar>Cancelar</button><button type="button" class="b p" data-impok${P.faltam || !n ? ' disabled' : ''}>${n ? `Gravar ${n} alteração(ões)` : 'Nada a gravar'}</button></div></div>`;
    if (!$('#dlg').open) $('#dlg').showModal();
  }
  async function confirmarImportacao(bt) {
    const P = imp.plano; bt.disabled = true; let feitas = 0; const total = P.novas + P.atualizadas + P.removidas;
    try {
      for (const l of P.linhas) {
        if (l.acao === 'nova') await api.salvar('despesas', Object.assign({}, l.reg, { id: SQC.novoId() }), { novo: true });
        else if (l.acao === 'atualiza') await api.salvar('despesas', Object.assign({}, l.ant, l.reg), { novo: false, base: l.ant.atualizado_em || null });
        else if (l.acao === 'remove') await api.excluir('despesas', l.ant.id);
        else continue;
        bt.textContent = `Gravando ${++feitas} de ${total}…`;
      }
      await recarregarDb(); $('#dlg').close(); imp = null; render(); toast(`Planilha importada: ${P.novas} nova(s), ${P.atualizadas} atualizada(s), ${P.removidas} removida(s).`);
    } catch (e) { try { await recarregarDb(); } catch (x) { /* fica com o que tinha */ } render(); desenharImportacao(`Parou depois de ${feitas} de ${total}: ${e.message} O que já foi gravado continua gravado; corrija e confirme de novo.`); }
  }
  /* o mesmo gasto pelas metas do TED: meta abre as etapas; etapa abre a composição e os valores (mesmo desenho da tabela por rubrica) */
  function tabelaMetas(F) {
    const v = x => x ? brl(x) : '—', somaD = (ds, pago) => ds.filter(d => (d.status === 'Pago') === pago).reduce((t, d) => t + (+d.valor || 0), 0);
    const barra = u => `<span class="rb-e"><span class="medidor fino"><i class="${u > 100 ? 'bad' : ''}" style="width:${Math.min(100, u)}%"></i></span><b>${pct(u)}%</b></span>`;
    const linha = m => { const u = m.prev ? (m.pago + m.comp) / m.prev * 100 : 0, es = D.ETAPAS.filter(e => e.m === m.m), ds = db.despesas.filter(d => String(d.etapa)[0] === String(m.m)).sort((a, b) => a.data < b.data ? 1 : -1);
      return `<details class="rb"><summary><span class="rb-n"><i class="rb-s" aria-hidden="true"></i><span>Meta ${m.m} · ${esc(m.nome)}</span><span class="chip">${es.length === 1 ? '1 etapa' : es.length + ' etapas'}</span></span>
     <span class="rb-v" data-r="Previsto">${v(m.prev)}</span><span class="rb-v" data-r="Pago">${v(m.pago)}</span><span class="rb-v" data-r="Comprometido">${v(m.comp)}</span><span class="rb-v${m.saldo < 0 ? ' neg' : ''}" data-r="Saldo"><b>${brl(m.saldo)}</b></span>${barra(u)}</summary>
    <div class="rb-c">${es.map(e => { const de = ds.filter(d => d.etapa === e.id), prev = e.q * e.v, pago = somaD(de, true), comp = somaD(de, false), saldo = prev - pago - comp;
        return `<details class="rb-i"><summary><span class="rb-in"><span class="mono">${e.id}</span> ${esc(e.nome)}</span><span class="rb-v" data-r="Previsto">${brl(prev)}</span><span class="rb-v" data-r="Pago">${v(pago)}</span><span class="rb-v" data-r="Comprometido">${v(comp)}</span><span class="rb-v${saldo < 0 ? ' neg' : ''}" data-r="Saldo">${brl(saldo)}</span>${barra(prev ? (pago + comp) / prev * 100 : 0)}</summary>
          <dl class="rb-x"><div><dt>Composição</dt><dd>${num(e.q)} × ${brl(e.v)} (${esc(e.un)}) · ${mesAno(e.ini)} a ${mesAno(e.fim)}</dd></div><div><dt>Previsto</dt><dd>${brl(prev)}</dd></div><div><dt>Pago</dt><dd>${brl(pago)}</dd></div><div><dt>Comprometido</dt><dd>${brl(comp)}</dd></div><div><dt>Saldo</dt><dd class="${saldo < 0 ? 'neg' : ''}"><b>${brl(saldo)}</b></dd></div><div><dt>Despesas nesta etapa</dt><dd>${de.length}</dd></div></dl></details>`; }).join('')}
     <div class="rb-d"><h3>Despesas lançadas nesta meta</h3>${ds.length ? `<div class="scroll" tabindex="0" role="region" aria-label="Tabela (role para o lado no celular)"><table><thead><tr><th>Data</th><th>Etapa</th><th>Descrição</th><th>Situação</th><th class="n">Valor</th></tr></thead><tbody>${ds.map(d => `<tr><td>${dt(d.data)}${exChip(d)}</td><td><span class="mono">${esc(d.etapa)}</span></td><td>${esc(d.descricao)}<div class="small">${esc(nomeRubrica(d.rubrica) || 'sem rubrica')}${d.favorecido ? ' · ' + esc(d.favorecido) : ''}</div></td><td><span class="chip ${d.status === 'Pago' ? 'ok' : 'f'}">${esc(d.status)}</span></td><td class="n">${brl(d.valor)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="small">Nenhuma despesa lançada ainda.</p>'}</div></div></details>`; };
    return `<div><div class="head"><div><h2>Por meta do TED</h2><p>O mesmo gasto, visto pelas metas do plano pactuado com o MDA. Toque na meta para ver as etapas e as despesas lançadas nela.</p></div><div class="acts"><button class="b" data-abrir-rub>Abrir todas</button></div></div>
   <div class="panel rb-t" style="margin-top:10px"><div class="rb-h" aria-hidden="true"><span>Meta</span><span>Previsto</span><span>Pago</span><span>Comprometido</span><span>Saldo</span><span>Execução</span></div>${F.map(m => adiar(linha(m))).join('')}
    <div class="rb-tot"><span>Total</span><span data-r="Previsto">${brl(R.soma(F, 'prev'))}</span><span data-r="Pago">${brl(R.soma(F, 'pago'))}</span><span data-r="Comprometido">${brl(R.soma(F, 'comp'))}</span><span data-r="Saldo"><b>${brl(R.soma(F, 'saldo'))}</b></span><span></span></div></div></div>`;
  }
  /* dica do gráfico: mês mais próximo do ponteiro, com os três valores */
  /* gráfico pelo teclado (14/10/2026): com o foco no gráfico, as setas passam de mês em mês e mostram a mesma dica do mouse */
  let mesTeclado = -1;
  function mostrarMes(g, i) {
    const dica = document.querySelector('[data-dica]'), cr = document.querySelector('[data-cr]'); if (!g || !ritmoAtual || !dica || !cr) return;
    const P = ritmoAtual.pontos, n = P.length; i = Math.max(0, Math.min(n - 1, i)); mesTeclado = i;
    const svg = g.querySelector('svg'), b = svg.getBoundingClientRect(), k = GR.w / b.width, p = P[i], cx = GR.l + (GR.w - GR.l - GR.r) * (i + 1) / n;
    cr.removeAttribute('hidden'); cr.setAttribute('x1', cx); cr.setAttribute('x2', cx);
    dica.innerHTML = `<b>${p.rotulo}</b><span><i class="lg prev"></i>Previsto <b>${brl(p.previsto)}</b></span>${p.executado == null ? '<span class="small">mês que ainda não chegou</span>' : `<span><i class="lg exec"></i>Pago <b>${brl(p.executado)}</b></span><span><i class="lg rec"></i>Recebido <b>${brl(p.recebido)}</b></span>`}`;
    dica.hidden = false; const gb = g.getBoundingClientRect(), esq = cx / k; dica.style.left = Math.max(0, Math.min(gb.width - dica.offsetWidth, esq > gb.width / 2 ? esq - dica.offsetWidth - 12 : esq + 12)) + 'px';
    const v = document.getElementById('rg-voz'); if (v) v.textContent = dica.textContent.replace(/(\d)(Previsto|Pago|Recebido)/g, '$1 · $2');
  }
  function teclaGrafico(ev) {
    const g = ev.target.closest && ev.target.closest('[data-rg]'); if (!g || !ritmoAtual) return;
    const n = ritmoAtual.pontos.length, atual = ritmoAtual.pontos.findIndex(p => p.atual), ini = mesTeclado >= 0 ? mesTeclado : (atual >= 0 ? atual : 0);
    const alvo = { ArrowRight: ini + 1, ArrowLeft: ini - 1, Home: 0, End: n - 1 }[ev.key]; if (alvo === undefined) return;
    ev.preventDefault(); mostrarMes(g, mesTeclado < 0 && (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft') ? ini : alvo);
  }
  function aoMoverGrafico(ev) {
    const g = ev.target.closest && ev.target.closest('[data-rg]'); const dica = document.querySelector('[data-dica]'), cr = document.querySelector('[data-cr]');
    if (!g || !ritmoAtual) { if (dica && !(document.activeElement && document.activeElement.matches && document.activeElement.matches('[data-rg]'))) { dica.hidden = true; if (cr) cr.setAttribute('hidden', ''); } return; }
    const b = g.querySelector('svg').getBoundingClientRect(), n = ritmoAtual.pontos.length, px = (ev.clientX - b.left) * (GR.w / b.width);
    mostrarMes(g, Math.round((px - GR.l) / (GR.w - GR.l - GR.r) * n) - 1);
  }
  /* ---------- equipe: as três funções com bolsa no plano; as pessoas vêm das solicitações importadas da FUNCERN ---------- */
  const FUNCOES = [['coordenacao', 'i01', 'Coordenação do projeto', 'coordenação do projeto', 'Uma pessoa · responde pelo projeto e assina as solicitações à fundação · cadastrada pela coordenação', 1],
    ['auxiliar', 'i02', 'Auxiliar administrativo', 'auxiliar administrativo', 'Uma pessoa · apoia a gestão: solicitações, documentos e prestação de contas', 1],
    ['discente', 'i03', 'Bolsistas discentes', 'bolsista discente', 'Estudantes que dão apoio técnico às unidades de produção e ao acompanhamento em campo', 0],
    ['formador', 'i16', 'Formadores', 'formador(a)', 'Especialistas em bioinsumos e agroecologia que planejam e ministram as capacitações da Meta 3 · bolsa por atividade realizada', 0]];
  const IC_GENTE = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.500"/><path d="M2.500 20a6.500 6.500 0 0 1 13 0"/><circle cx="17.500" cy="9" r="2.500"/><path d="M17 14.200a5 5 0 0 1 4.500 5"/></svg>';
  function equipe() {
    if (coord() && !real && convites === undefined) { convites = []; carregarConvites(); }
    const FI = R.finItens(db), hj = iso(hoje()), pode = R.podeGravar(eu, 'membros');
    const semTabela = api.semMembros ? `<div class="banner"><span>O cadastro da equipe ainda não foi ligado no banco: a coordenação precisa rodar o script <b>07_equipe.sql</b> no Supabase. Até lá, nada do que for cadastrado aqui é gravado.</span></div>` : '';
    const bloco = f => { const x = FI.find(i => i.id === f[1]), E = R.equipePorFuncao(db, f[0], hj), ms = x ? x.meses : [], bolsas = {};
      (x ? x.despesas : []).forEach(d => { const k = R.nrm(d.favorecido); if (!k) return; const g = bolsas[k] = bolsas[k] || { nome: d.favorecido, n: 0, pago: 0, comp: 0 }; g.n++; if (d.status === 'Pago') g.pago += +d.valor || 0; else g.comp += +d.valor || 0; });
      const bolsaDe = m => { const g = bolsas[R.nrm(m.nome)]; if (g) g.visto = 1; return g ? `<span>${g.n} solicitação(ões) de bolsa</span><span>pago ${brl(g.pago)}</span>${g.comp ? `<span>comprometido ${brl(g.comp)}</span>` : ''}` : '<span>nenhuma bolsa na planilha ainda</span>'; };
      const cartao = m => `<li class="pc">${avatar(m)}<div class="pc-t"><div class="pc-n"><b>${esc(m.nome)}</b><span class="chip ok vg-c">${m.fim ? 'Sai em ' + dt(m.fim) : 'Na equipe'}</span>${cuidaHab() ? seloHab(m) : ''}${exChip(m)}</div><div class="pc-d">${[m.email, m.telefone, m.municipio, m.vinculo].filter(Boolean).map(t => `<span>${esc(t)}</span>`).join('')}<span>desde ${dt(m.inicio)}</span></div><div class="pc-d eq-bo">${bolsaDe(m)}</div></div>
        <button class="b eq-vd" data-fichamembro="${esc(m.id)}">Ver detalhes</button></li>`;
      const ult = E.antigos[0], vaga = `<div class="vg"><div><span class="chip f vg-c">Vaga aberta</span><p>${ult ? `A pessoa anterior, ${esc(ult.nome)}, foi desligada em ${dt(ult.fim)}.` : 'Ninguém foi cadastrado nesta função ainda.'}</p></div>${pode ? `<button class="vg-b" data-cadeq="${f[0]}">${IC_GENTE}<span>Cadastrar ${f[3]}</span></button>` : ''}</div>`;
      const corpo = (E.ativos.length ? `<ul class="eq-l">${E.ativos.map(cartao).join('')}</ul>` : '') + (!E.ativos.length ? vaga : !f[5] && pode ? `<div class="acts"><button class="vg-b" data-cadeq="${f[0]}">${IC_GENTE}<span>Cadastrar ${f[3]}</span></button></div>` : '');
      const cvs = pode && Array.isArray(convites) ? convites.filter(c => c.funcao === f[0]) : [];
      const cvHtml = cvs.length ? `<ul class="cv">${cvs.map(c => c.status === 'preenchido'
        ? `<li class="cv-i ok"><div><b>${esc((c.dados && c.dados.nome) || 'Cadastro recebido')}</b><small>preencheu pelo link em ${dt(String(c.preenchido_em).slice(0, 10))} · falta você conferir e aprovar</small></div><span class="ac"><button class="b p" data-cvaprovar="${esc(c.id)}">Conferir e aprovar</button><button class="b" data-cvfim="${esc(c.id)}:recusado">Recusar</button></span></li>`
        : `<li class="cv-i"><div><b>Link de cadastro enviado</b><small>gerado em ${dt(String(c.criado_em).slice(0, 10))} · vale até ${dt(String(c.expira_em).slice(0, 10))} · aguardando a pessoa preencher</small></div><span class="ac"><button class="b" data-cvfim="${esc(c.id)}:cancelado">Cancelar o link</button></span></li>`).join('')}</ul>` : '';
      const fora_ = Object.values(bolsas).filter(g => !g.visto && !E.antigos.some(m => R.nrm(m.nome) === R.nrm(g.nome)));
      return `<section class="eq" aria-label="${f[2]}"><div class="eq-cab"><div><h2>${f[2]}</h2><p>${f[4]}</p></div>${f[5] ? '' : `<span class="chip">${E.ativos.length} na equipe</span>`}</div>
       ${cvHtml}${corpo}
       ${fora_.length ? `<p class="note eq-n">Na planilha da FUNCERN há bolsa desta função para ${fora_.map(g => esc(g.nome)).join(', ')}, que não ${fora_.length === 1 ? 'está' : 'estão'} no cadastro. Cadastre com o mesmo nome para ligar a pessoa às bolsas.</p>` : ''}
       ${E.antigos.length ? `<details class="dx-como eq-h"><summary>Quem já passou por esta função (${E.antigos.length})</summary><ul class="eq-a">${E.antigos.map(m => `<li><span><b>${esc(m.nome)}</b>${exChip(m)}<small>${m.vinculo ? esc(m.vinculo) + ' · ' : ''}${dt(m.inicio)} a ${dt(m.fim)}${m.motivo ? ' · ' + esc(m.motivo) : ''}</small></span>${pode ? `<span class="ac"><button class="ab" title="Editar" data-edit="membros:${esc(m.id)}">${IC_LAPIS}<span class="so">Editar</span></button>${R.podeExcluir(eu, 'membros', m) ? `<button class="ab d" title="Excluir" data-del="membros:${esc(m.id)}">${IC_LIXO}<span class="so">Excluir</span></button>` : ''}</span>` : ''}</li>`).join('')}</ul></details>` : ''}</section>`; };
    /* habilitação na FUNCERN: barra das três etapas e uma linha por pessoa, com os dois passos (Arlo e termo) marcados */
    const habil = () => { if (!cuidaHab()) return ''; const at = (db.membros || []).filter(m => !m.fim || m.fim >= hj);
      const etapa = m => m.arlo === 'Sim' && m.termo_em ? 2 : m.arlo === 'Sim' ? 1 : 0, n = [0, 1, 2].map(k => at.filter(m => etapa(m) === k).length), tot = at.length || 1;
      const ROT = [['f', 'Falta o Arlo'], ['f', 'Falta o termo'], ['ok', 'Habilitado(a)']];
      const passo = (feito, rot, extra) => `<span class="hab-p ${feito ? 'ok' : ''}"><i aria-hidden="true">${feito ? '✓' : ''}</i>${rot}${extra ? `<small>${extra}</small>` : ''}</span>`;
      const L = at.slice().sort((x, y) => etapa(x) - etapa(y) || String(x.nome).localeCompare(String(y.nome), 'pt-BR'));
      return `<section class="panel mts hab" aria-label="Habilitação na FUNCERN"><div class="mts-cab"><h2>Habilitação na FUNCERN</h2><p>Para receber bolsa, cada pessoa precisa de cadastro no Arlo e do termo de compromisso assinado. ${auxiliar() ? 'Toque na pessoa para ver os dados e marcar o que já foi feito.' : 'O auxiliar administrativo acompanha e marca; a coordenação também pode.'}</p></div>
       <div class="hab-top"><div class="hab-n">${[['Falta cadastrar no Arlo', n[0], 'f'], ['No Arlo, falta o termo', n[1], 'f'], ['Habilitados', n[2], 'ok']].map(([t, v, c]) => `<div class="hab-k ${v ? c : ''}"><b>${v}</b><span>${t}</span></div>`).join('')}</div>
        <div class="hab-bar" role="img" aria-label="${n[2]} de ${at.length} habilitados">${n.map((v, k) => v ? `<i class="e${k}" style="width:${(v / tot * 100).toFixed(1)}%"></i>` : '').join('')}</div></div>
       ${L.length ? `<ul class="hab-l">${L.map(m => { const e = etapa(m); return `<li><button type="button" class="hab-i" data-fichamembro="${esc(m.id)}">${avatar(m)}<span class="hab-t"><b>${esc(m.nome)}</b><small>${esc(NOME_FUNCAO[m.funcao] || '')}</small></span>
         <span class="hab-ps">${passo(m.arlo === 'Sim', 'Arlo')}${passo(!!m.termo_em, 'Termo', m.termo_em ? dt(m.termo_em) : '')}</span><span class="chip ${ROT[e][0]}">${ROT[e][1]}</span><span class="mp-seta" aria-hidden="true">›</span></button></li>`; }).join('')}</ul>` : '<p class="small">Ninguém na equipe ainda.</p>'}</section>`; };
    const IC_MAIS = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="10" cy="8" r="3.500"/><path d="M3.500 20a6.500 6.500 0 0 1 11-4.700M18 14v6M15 17h6"/></svg>';
    const ext = () => { if (!coord()) return ''; const P = db.pessoas.filter(p => p.perfil === 'Acompanhamento'), org = {}; P.forEach(p => { const o = (p.orgao || '').trim() || 'Órgão não informado'; (org[o] = org[o] || []).push(p); }); if (!P.length) org['SEAB/MDA'] = [];
      const sit = p => p.ativo === false ? ['', 'Desativado'] : demo() || p.auth_id ? ['ok', 'Com acesso'] : ['f', 'Aguardando primeiro acesso'];
      return `<section class="eq" aria-label="Acompanhamento externo"><div class="eq-cab"><div><h2>Acompanhamento externo (SEAB/MDA)</h2><p>Área própria, só de leitura · não vê nome nem dado pessoal de agricultoras e agricultores, nem a equipe · só a coordenação cadastra</p></div></div>
       <div class="panel ae"><div class="ae-h" aria-hidden="true"><span>Órgão</span><span>Quem acompanha</span><span></span></div>${Object.keys(org).sort().map(o => { const L = org[o], at = L.filter(p => p.ativo !== false).length;
        return `<div class="ae-l"><div class="ae-o"><span class="mt-n" aria-hidden="true">${esc((o.replace(/[^A-Za-zÀ-ú/ ]/g, '').split(/[\s/]+/).filter(Boolean).slice(-1)[0] || '?').slice(0, 4).toUpperCase())}</span><div><b>${esc(o)}</b><small>${at} pessoa${at === 1 ? '' : 's'} com acesso</small></div></div>
         <div class="ae-p">${L.length ? L.map(p => { const st = sit(p); return `<button class="ae-c${p.ativo === false ? ' off' : ''}" data-edit="pessoas:${esc(p.id)}" title="Abrir o cadastro de ${esc(p.nome)}"><span class="pc-av" aria-hidden="true">${esc(iniciais(p.nome))}</span><span class="ae-t"><b>${esc(p.nome)}</b><span class="chip ${st[0]} vg-c">${st[1]}</span></span></button>`; }).join('') : '<p class="small">Ninguém cadastrado ainda.</p>'}</div>
         <div class="ae-a"><button class="ae-b" data-new="pessoas" data-pre="${esc(o === 'Órgão não informado' ? '-' : o)}">${IC_MAIS}<span>Adicionar pessoa</span></button><button class="ae-b" data-vercomo="${esc(o === 'Órgão não informado' ? '' : o)}">${IC_OLHO.split('<svg class="o2"')[0].replace('class="o1" ', '').replace('width="22" height="22"', 'width="20" height="20"')}<span>Ver como ${esc(o === 'Órgão não informado' ? 'quem acompanha' : o)} vê</span></button></div></div>`; }).join('')}</div></section>`; };
    /* resumo no alto (14/10/2026, no formato do Mulheres & Quintais): vagas do plano preenchidas e atividades de formador pagas */
    const nAt = f => R.equipePorFuncao(db, f, hj).ativos.length, VAGAS = { coordenacao: 1, auxiliar: 1, discente: 3 };
    const abertas = Object.keys(VAGAS).reduce((t, f) => t + Math.max(0, VAGAS[f] - nAt(f)), 0);
    /* formadores: o plano v4 paga por atividade (80 × R$ 100, Meta 3); as atividades pagas saem das bolsas do item i16 lançadas como pagas */
    const atF = Math.floor(db.despesas.filter(d => d.item === 'i16' && d.status === 'Pago').reduce((t, d) => t + (+d.valor || 0), 0) / 100);
    const resumo = `<section class="dx-topo panel eq-top" aria-label="Resumo da equipe"><div class="dx-kpis">
      ${kpi(1, nAt('coordenacao') * 100, nAt('coordenacao'), 'de 1', 'coordenação do projeto cadastrada', '', undefined)}
      ${kpi(2, Math.min(1, nAt('auxiliar')) * 100, nAt('auxiliar'), 'de 1', 'auxiliar administrativo cadastrado', '', undefined)}
      ${kpi(3, Math.min(3, nAt('discente')) / 3 * 100, nAt('discente'), 'de 3', 'bolsistas discentes na equipe', '', undefined)}
      ${kpi(4, Math.min(80, atF) / 80 * 100, atF, 'de 80', 'atividades de formação pagas', nAt('formador') ? nAt('formador') + (nAt('formador') === 1 ? ' formador(a) cadastrado(a)' : ' formadores cadastrados') : 'nenhum formador cadastrado ainda', undefined, 'concluído')}</div></section>`;
    return `<div class="head"><div><h2>Coordenação e bolsistas</h2><p>Quem ocupa cada função com bolsa no plano de trabalho. O cadastro é da coordenação; os valores de bolsa vêm da planilha da FUNCERN, importada na aba Financeiro.</p>${abertas ? `<span class="eq-pill">${abertas} ${abertas === 1 ? 'vaga aberta' : 'vagas abertas'} no plano de trabalho</span>` : '<span class="eq-pill ok">Todas as vagas do plano preenchidas</span>'}</div></div>${semTabela}${resumo}${habil()}${FUNCOES.map(bloco).join('')}${ext()}`;
  }
  function financeiro() {
    const F = R.fin(db), FR = R.finRubrica(db), pago = R.soma(F, 'pago'), comp = R.soma(F, 'comp'), usado = pago + comp, rec = R.recebido(), prox = D.PARCELAS.find(p => !p.recebida);
    const mil = v => num(v / 1000, Math.abs(v) % 1000 ? 1 : 0);
    return `<div class="head"><div><h2>Acompanhamento financeiro</h2><p>Valores previstos no plano de trabalho, comparados com as despesas lançadas aqui. O registro oficial continua sendo o da FUNCERN; confira os dois antes de cada prestação de contas.</p></div></div>
 <section class="dx-topo panel" aria-label="Resumo financeiro">
  <div class="dx-exec"><span class="dx-rot">Execução financeira do projeto</span>
   <div class="dx-exec-num"><b>${pct(usado / D.TOTAL * 100)}%</b></div><div><span class="chip ${usado > rec ? 'bad' : 'ok'}">${usado > rec ? 'Acima do que já foi recebido' : 'Dentro do que já foi recebido'}</span></div>
   <div class="medidor" role="img" aria-label="Pago ou comprometido ${pct(usado / D.TOTAL * 100)}% do total; recebido ${pct(rec / D.TOTAL * 100)}%"><i class="${usado > rec ? 'bad' : ''}" style="width:${Math.min(100, usado / D.TOTAL * 100)}%"></i><b style="left:${Math.min(100, rec / D.TOTAL * 100)}%"></b></div>
   <p class="dx-exec-sub"><span>Pago ou comprometido: <b>${brl(usado)}</b></span><span>Total do TED: <b>${brl(D.TOTAL)}</b></span></p>
   <details class="dx-como"><summary>Como é calculado</summary><p>Soma das despesas pagas e das comprometidas (solicitadas ou em compras na FUNCERN), dividida pelo valor total do TED. O traço na barra marca quanto já foi repassado à fundação (${pct(rec / D.TOTAL * 100)}%). São os valores lançados neste sistema; o registro oficial é o da FUNCERN.</p></details></div>
  <div class="dx-kpis fin">${kpi(1, rec / D.TOTAL * 100, mil(rec), 'de ' + mil(D.TOTAL) + ' mil', 'recebido', prox ? `próxima parcela de ${brl(prox.valor)} prevista para ${mesAno(prox.previsao)}` : 'todas as parcelas recebidas', undefined, 'do total')}
   ${kpi(2, pago / rec * 100, mil(pago), 'de ' + mil(rec) + ' mil', 'pago', `${db.despesas.filter(d => d.status === 'Pago').length} despesa(s) paga(s)`, undefined, 'do recebido')}
   ${kpi(3, comp / rec * 100, mil(comp), 'de ' + mil(rec) + ' mil', 'comprometido', `${db.despesas.filter(d => d.status !== 'Pago').length} despesa(s) solicitada(s) ou em compras`, undefined, 'do recebido')}
   ${kpi(4, (rec - usado) / rec * 100, mil(rec - usado), 'de ' + mil(rec) + ' mil', 'disponível do recebido', rec - usado < 0 ? 'o lançado passa do que já foi recebido' : 'recebido menos pago e comprometido', undefined, 'do recebido')}</div>
 </section>
 <div class="two fin-2">${graficoRitmo()}${usoRubricas(FR)}</div>
 ${tabelaRubricas(FR)}
 ${tabelaMetas(F)}
 ${tabela('despesas')}`;
  }
  const PLURAL = { 'capacitação': 'capacitações', 'contrato com a fundação': 'contratos com a fundação', 'dia de campo': 'dias de campo', 'kit distribuído': 'kits distribuídos', 'material didático': 'materiais didáticos',
    'produto de comunicação': 'produtos de comunicação', 'relatório de avaliação': 'relatórios de avaliação', 'relatório técnico': 'relatórios técnicos', 'relatório': 'relatórios', 'unidade em funcionamento': 'unidades em funcionamento', 'unidade produtiva': 'unidades produtivas' };
  const quantos = (q, un) => +q === 1 ? un : PLURAL[un] || un;
  /* ícones das seções do relatório (mesmo traço dos indicadores) */
  const IC_REL = { fis: IC5.atual, bio: '<path d="M9 3h6M10 3v6L5 18a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3"/><path d="M7.5 14h9"/>', ati: IC5.gente, lot: IC5.caixa, dis: IC5.usou, mon: IC5.pino,
    ent: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>', fin: IC5.base, rub: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>', des: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>' };
  function relatorio() {
    if (!rel) rel = { de: D.G0, ate: iso(hoje()) };
    const no = s => !!s && s >= rel.de && s <= rel.ate, F = R.fin(db, rel.ate), FR = R.finRubrica(db, rel.ate);
    const fimRel = rel.ate < iso(hoje()) ? rel.ate : iso(hoje());   // metas físicas: só o realizado até a data final (o que está marcado para depois de hoje é planejado)
    const ev = db.eventos.filter(e => no(e.data)).sort((a, b) => a.data > b.data ? 1 : -1), lo = db.lotes.filter(l => no(l.inicio)), di = db.distribuicoes.filter(d => no(d.data)), vi = db.visitas.filter(v => no(v.data)), en = db.entregas.filter(g => no(g.data)), de = db.despesas.filter(d => no(d.data));
    /* tabela do relatório: na tela mostra as 10 primeiras linhas e um botão para ver todas; impressa, sai inteira */
    const LIM = 10, tl = (h, rows, todas) => rows.length ? `<div class="scroll" tabindex="0" role="region" aria-label="Tabela (role para o lado no celular)"><table><thead><tr>${h.map(x => `<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.map((r, i) => `<tr${i >= LIM && !todas ? ' class="rx"' : ''}>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${rows.length > LIM && !todas ? `<div class="acts noprint"><button type="button" class="b s" data-relmais="${rows.length}" aria-expanded="false">Ver todas as ${rows.length} linhas</button></div>` : ''}` : '<p class="small">Sem registros no período.</p>';
    const sec = (ic, titulo, sub, corpo) => `<section class="panel mts rs"><div class="mts-cab rs-cab"><span class="i5-ic" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${IC_REL[ic]}</svg></span><div><h3>${titulo}</h3>${sub ? `<p>${sub}</p>` : ''}</div></div>${corpo}</section>`;
    const ben = new Set(di.map(d => d.agricultor)).size, tp = ev.reduce((s, e) => s + (+e.part || 0), 0), tm = ev.reduce((s, e) => s + (+e.mulheres || 0), 0);
    const fis = D.ETAPAS.map(e => ({ e, f: R.feito(db, e, fimRel) })), pfis = fis.reduce((t, x) => t + x.e.q * x.e.v * Math.min(1, x.f / x.e.q), 0) / D.TOTAL * 100;
    const gasto = de.reduce((t, d) => t + (+d.valor || 0), 0), pagas = de.filter(d => d.status === 'Pago').length, aplic = vi.filter(v => v.usou === 'Sim').length;
    const atalho = [['mes', 'Mês passado'], ['tri', 'Últimos 3 meses'], ['ano', 'Este ano'], ['tudo', 'Desde o início']];
    return `<div class="head noprint"><div><h2>Relatório de execução</h2><p>Escolha o período. As metas físicas e o financeiro saem acumulados até a data final; as atividades, só as do período. Na tela, as tabelas longas mostram as 10 primeiras linhas; impresso ou em PDF, o relatório sai completo.</p></div></div>
 <section class="panel rel-f noprint" aria-label="Período do relatório"><div class="rel-at" role="group" aria-label="Períodos prontos">${atalho.map(([k, t]) => `<button type="button" class="b s" data-relp="${k}">${t}</button>`).join('')}</div>
  <div class="ctrl"><div class="fld"><label for="rde">De</label><input type="date" id="rde" value="${rel.de}"></div><div class="fld"><label for="rate">Até</label><input type="date" id="rate" value="${rel.ate}"></div><button class="b p" data-rel>Gerar</button><button class="b" data-print>Imprimir ou salvar em PDF</button></div></section>
 <div class="dx-topo panel noprint" role="region" aria-label="Resumo do período">
  <div class="dx-exec"><span class="dx-rot">Execução física até ${dt(fimRel)}</span><div class="dx-exec-num"><b>${pct(pfis)}%</b></div>
   <span class="medidor" role="img" aria-label="${pct(pfis)}% da execução física"><i style="width:${Math.min(100, pfis)}%"></i></span>
   <p class="dx-exec-sub"><span>Período: <b>${dt(rel.de)} a ${dt(rel.ate)}</b></span></p></div>
  <div class="dx-kpis fin">${kpi(1, tp ? tm / tp * 100 : 0, ev.length, 'no período', 'atividades', tp ? `${num(tp)} participações` : 'sem participantes registrados', undefined, 'mulheres')}
   ${kpi(2, ben / 30 * 100, di.length, 'entregas', 'de bioinsumo', `a ${ben} unidade(s) produtiva(s)`, undefined, 'da meta de 30 unidades')}
   ${kpi(3, vi.length ? aplic / vi.length * 100 : 0, vi.length, 'visitas', 'de monitoramento', `em ${aplic} o bioinsumo foi aplicado`, undefined, 'com aplicação')}
   ${kpi(4, gasto / D.TOTAL * 100, gasto >= 1e4 ? num(Math.round(gasto / 1000)) : num(Math.round(gasto)), gasto >= 1e4 ? 'mil reais' : 'reais', 'em despesas no período', `${de.length} despesa(s), ${pagas} paga(s)`, undefined, 'do TED')}</div></div>
 <div class="rel">
 <div class="panel rel-doc"><p class="rel-sup">Relatório de execução · ${dt(rel.de)} a ${dt(rel.ate)}</p><h2>${esc(D.NOME_COMPLETO)}</h2>
 <p class="small">${esc(D.IDENT)}<br>Gerado em ${hoje().toLocaleDateString('pt-BR')} por ${esc(eu ? eu.nome : '')}</p></div>
 ${sec('fis', '1. Execução física acumulada', `Até ${dt(fimRel)} · o que está marcado para depois é planejado e não conta`, tl(['Etapa', 'Descrição', 'Previsto', 'Realizado', '%'], fis.map(({ e, f }) => [`<span class="mono">${e.id}</span>`, e.nome, `${num(e.q)} ${quantos(e.q, e.un)}`, f, num(Math.min(100, f / e.q * 100)) + '%']), true))}
 ${sec('bio', '2. Unidades de produção de bioinsumos', `${db.unidades.filter(u => u.funcionando).length} em funcionamento de ${db.unidades.length} cadastrada(s)`, tl(['Unidade', 'Modelo', 'Implantação', 'Parceiro institucional'], db.unidades.map(u => [esc(u.nome) + (u.conta === 'Sim' ? '' : ' (apoio)'), esc(u.modelo), `${nCheck(u)} de ${D.CHECK.length} passos${u.funcionando ? ' · em funcionamento' : ''}`, esc(u.parceiro) || 'a definir']), true))}
 ${sec('ati', '3. Capacitações, dias de campo e reuniões no período', ev.length ? `${ev.length} atividade(s)` : '', tl(['Data', 'Tipo', 'Tema', 'Local', 'Participantes'], ev.map(e => [dt(e.data), esc(e.tipo), esc(e.tema), esc(e.lugar) + (e.municipio ? ' · ' + esc(e.municipio) : ''), R.vazio(e.part) ? '—' : `${num(e.part)} (${num(e.mulheres)} mulheres)`])) + (tp ? `<p>Total de ${num(tp)} participações, ${num(tm / tp * 100)}% de mulheres.</p>` : ''))}
 ${sec('lot', '4. Produção de bioinsumos no período', lo.length ? `${lo.length} lote(s) iniciado(s)` : '', tl(['Lote', 'Tipo', 'Unidade', 'Início', 'Situação', 'Produzido'], lo.map(l => [`<span class="mono">${esc(l.codigo)}</span>`, esc(l.tipo), esc((by('unidades', l.unidade) || {}).nome), dt(l.inicio), esc(l.status), `${num(l.qtd)} ${esc(l.med)}`])))}
 ${sec('dis', '5. Distribuição no período', '', tl(['Data', 'Lote', 'Unidade produtiva', 'Cultura', 'Quantidade'], di.map(d => { const l = by('lotes', d.lote) || {}; return [dt(d.data), `<span class="mono">${esc(l.codigo)}</span>`, esc((by('agricultores', d.agricultor) || {}).nome), esc(d.cultura), `${num(d.qtd)} ${esc(l.med || '')}`]; })) + (di.length ? `<p>${di.length} entrega(s) a ${ben} unidade(s) produtiva(s).</p>` : ''))}
 ${sec('mon', '6. Monitoramento do uso no período', '', tl(['Data', 'Unidade produtiva', 'Aplicou?', 'Vigor', 'Observações'], vi.map(v => [dt(v.data), esc((by('agricultores', v.agricultor) || {}).nome), esc(v.usou), v.vigor ? esc(v.vigor) + '/5' : '—', esc(v.obs) + (v.problemas ? ' Dificuldade: ' + esc(v.problemas) : '')])) + (vi.length ? `<p>${vi.length} visita(s); em ${aplic} o bioinsumo havia sido aplicado.</p>` : ''))}
 ${sec('ent', '7. Entregas e evidências no período', en.length ? `${en.length} entrega(s) do plano` : '', tl(['Etapa', 'Entrega', 'Data'], en.map(g => [`<span class="mono">${esc(g.etapa)}</span>`, esc(g.titulo), dt(g.data)])))}
 ${sec('fin', `8. Execução financeira acumulada até ${dt(rel.ate)}, por meta`, '', `<div class="scroll" tabindex="0" role="region" aria-label="Tabela (role para o lado no celular)">${finTabela(F, 'Meta')}</div>`)}
 ${sec('rub', `9. Execução financeira acumulada até ${dt(rel.ate)}, por rubrica`, 'Valores lançados no sistema. O registro oficial é o da FUNCERN.', `<div class="scroll" tabindex="0" role="region" aria-label="Tabela (role para o lado no celular)">${finTabela(FR, 'Rubrica')}</div>`)}
 ${sec('des', '10. Despesas do período', de.length ? `${de.length} despesa(s) · ${brl(gasto)}` : '', tl(['Data', 'Etapa', 'Rubrica', 'Descrição', 'Situação', 'Valor'], de.map(d => [dt(d.data), `<span class="mono">${esc(d.etapa)}</span>`, esc(nomeRubrica(d.rubrica)), esc(d.descricao), esc(d.status), brl(d.valor)])))}
 </div>`;
  }
  /* ---------- aba Histórico (só a coordenação): últimos acessos e alterações ---------- */
  let acessos;   // undefined = ainda não carregou; null = falta o script 09; lista = carregado
  function telaHistorico() {
    if (!coord()) return '<div class="panel empty">O histórico é só da coordenação.</div>';
    const ha = d => { const n = Math.floor((hoje() - new Date(d)) / 864e5); return n <= 0 ? 'hoje' : n === 1 ? 'ontem' : `há ${n} dias`; };
    const quadroA = acessos === undefined ? '<div class="panel box"><div class="acts"><button class="b" data-acessos>Carregar os últimos acessos</button></div></div>'
      : acessos === null ? '<div class="banner"><span>Para ver os últimos acessos, a coordenação precisa rodar o script <b>09_ultimos_acessos.sql</b> no Supabase.</span></div>'
      : (() => { const at = acessos.filter(a => a.ativo), sem = at.filter(a => a.ultimo && hoje() - new Date(a.ultimo) < 7 * 864e5).length;
        return `<p class="hs-r"><b>${sem}</b> de ${at.length} pessoa(s) com acesso ativo entraram nos últimos 7 dias.</p>
         <div class="panel scroll" tabindex="0" role="region" aria-label="Tabela (role para o lado no celular)"><table><thead><tr><th>Pessoa</th><th>Perfil</th><th>Último acesso</th><th>Situação</th></tr></thead><tbody>${acessos.map(a => `<tr><td><b>${esc(a.nome)}</b></td><td>${esc(a.perfil)}${a.orgao ? `<div class="small">${esc(a.orgao)}</div>` : ''}</td><td>${a.ultimo ? `${new Date(a.ultimo).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}<div class="small">${ha(a.ultimo)}</div>` : '—'}</td><td>${!a.ativo ? '<span class="chip">Desativado</span>' : !a.ultimo ? '<span class="chip f">Nunca entrou</span>' : hoje() - new Date(a.ultimo) > 30 * 864e5 ? '<span class="chip f">Sem entrar há mais de 30 dias</span>' : '<span class="chip ok">Em uso</span>'}</td></tr>`).join('')}</tbody></table></div>`; })();
    return `<div class="head"><div><h2>Histórico</h2><p>Quem entrou no sistema e tudo o que foi incluído, alterado ou excluído, com quem fez e quando. Serve para a prestação de contas. Só a coordenação vê.</p></div></div>
     <div><div class="head"><div><h2>Últimos acessos</h2><p>Quando cada pessoa cadastrada entrou pela última vez. O sistema mostra só o acesso mais recente de cada uma, não a lista de todos.</p></div>${Array.isArray(acessos) ? '<div class="acts"><button class="b" data-acessos>Atualizar</button></div>' : ''}</div>${quadroA}</div>
     <div><div class="head"><div><h2>Alterações</h2><p>Inclusões, alterações e exclusões em qualquer cadastro, e quem baixou planilhas ou a cópia dos dados. Carrega de 200 em 200.</p></div>${hist ? '<div class="acts"><button class="b" data-hist>Atualizar</button></div>' : ''}</div><div class="panel box" style="margin-top:10px">${historico()}</div></div>`;
  }
  const NOME_ACAO = { INSERT: 'incluiu', UPDATE: 'alterou', DELETE: 'excluiu' };
  /* histórico em linha do tempo (14/10/2026, trazido do Mulheres & Quintais): frases por dia, com hora; o detalhe campo a campo
     ("antes → depois") continua a um toque; filtro por cadastro e busca; registros mais antigos de 200 em 200; downloads (script 21) */
  let histFim = false, histFiltro = '', histBusca = '';
  const OCULTOS_HIST = /^(id|atualizado_em|criado_em|criado_por|auth_id|ex|codigo_seq)$/;
  function rotuloCampo(t, k) { const M = MOD[t]; const c = M && M.campos.find(x => x[0] === k); if (c) return c[1]; const ch = D.CHECK.find(x => x[0] === k); return ch ? ch[1] : k.replace(/_/g, ' '); }
  function valorHist(t, k, v) {
    if (v == null || v === '') return '—'; if (v === true) return 'Sim'; if (v === false) return 'Não';
    const M = MOD[t], c = M && M.campos.find(x => x[0] === k);
    if (c && c[2] === 'ref' && typeof v === 'string') { const r = by(c[4], v); return r ? rotulo[c[4]](r) : 'registro excluído'; }
    if (k === 'rubrica') return nomeRubrica(v) || v; if (/^\d{4}-\d{2}-\d{2}$/.test(String(v))) return dt(v);
    return typeof v === 'object' ? JSON.stringify(v) : String(v);
  }
  function fraseHist(h) {
    const quem = h.por ? (db.pessoas.find(p => p.id === h.por) || {}).nome || 'Pessoa removida' : 'Direto no banco';
    if (h.tabela === 'planilhas') { const x = h.depois || {}, q = +x.qtd || 0;
      return x.tipo === 'json' ? `<b>${esc(quem)}</b> baixou a cópia completa dos dados (${num(q)} registros).` : `<b>${esc(quem)}</b> baixou a planilha de <b>${esc((MOD[x.tipo] || {}).nome || x.tipo)}</b> (${num(q)} linha${q === 1 ? '' : 's'}).`; }
    const o = h.depois || h.antes || {}, M = MOD[h.tabela] || {}, oque = (M.um || M.nome || h.tabela).toLowerCase();
    const nome = o.nome || o.codigo || o.titulo || o.tema || o.descricao || (o.data ? dt(o.data) : '');
    const verbo = { INSERT: 'incluiu', UPDATE: 'alterou', DELETE: 'excluiu' }[h.acao] || esc(String(h.acao).toLowerCase());
    return `<b>${esc(quem)}</b> ${verbo} ${esc(oque)}${nome ? `: <b>${esc(nome)}</b>` : ''}.`;
  }
  function detalheHist(h) {
    if (h.acao !== 'UPDATE' || !h.antes || !h.depois) return '';
    const L = Object.keys(h.depois).filter(k => !OCULTOS_HIST.test(k) && JSON.stringify(h.antes[k]) !== JSON.stringify(h.depois[k]));
    return L.length ? `<details class="hs-d"><summary>O que mudou (${L.length})</summary><dl>${L.map(k => `<dt>${esc(rotuloCampo(h.tabela, k))}</dt><dd><s>${esc(valorHist(h.tabela, k, h.antes[k]))}</s> → <b>${esc(valorHist(h.tabela, k, h.depois[k]))}</b></dd>`).join('')}</dl></details>` : '';
  }
  function historico() {
    if (!hist) return '<div class="acts"><button class="b" data-hist>Carregar o histórico</button></div>';
    if (!hist.length) return '<div class="small">Nenhuma alteração registrada ainda. Aqui aparece, com data, hora e autor, tudo o que é incluído, alterado ou excluído, e quem baixou planilhas.</div>';
    const tabs = [...new Set(hist.map(h => h.tabela))].sort((a, b) => ((MOD[a] || {}).nome || a).localeCompare((MOD[b] || {}).nome || b));
    const nomeT = t => t === 'planilhas' ? 'Planilhas baixadas' : (MOD[t] || {}).nome || t;
    const vis = hist.filter(h => (!histFiltro || h.tabela === histFiltro) && (!histBusca || R.nrm(fraseHist(h).replace(/<[^>]+>/g, '')).includes(R.nrm(histBusca))));
    const dia = t => { const d = new Date(t), k = x => x.toLocaleDateString('pt-BR'), h = new Date(), o = new Date(h); o.setDate(h.getDate() - 1); return k(d) === k(h) ? 'Hoje' : k(d) === k(o) ? 'Ontem' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }); };
    let ult = ''; const itens = vis.map(h => { const d = dia(h.em), cab = d !== ult ? `<li class="hs-dia">${esc(d)}</li>` : ''; ult = d;
      return cab + `<li class="hs-i"><time datetime="${esc(h.em)}">${new Date(h.em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</time><div>${fraseHist(h)}${detalheHist(h)}</div></li>`; }).join('');
    const semana = hist.filter(h => Date.now() - new Date(h.em) < 7 * 864e5).length;
    return `<div class="hs-f"><label class="fld"><span>Cadastro</span><select id="hfiltro" data-histfiltro><option value="">Todos</option>${tabs.map(t => `<option value="${esc(t)}" ${t === histFiltro ? 'selected' : ''}>${esc(nomeT(t))}</option>`).join('')}</select></label>
      <label class="fld"><span>Procurar</span><input type="search" id="hbusca" data-histbusca value="${esc(histBusca)}" placeholder="nome, código, pessoa…"></label></div>
     <p class="small">${num(hist.length)} registro(s) carregado(s) · ${num(semana)} nos últimos 7 dias${histFiltro || histBusca ? ` · mostrando ${num(vis.length)}` : ''}</p>
     ${vis.length ? `<ul class="hs-l">${itens}</ul>` : '<p class="small">Nada com esse filtro.</p>'}
     ${histFim ? '<p class="small">Esse é o começo do histórico.</p>' : `<div class="acts"><button class="b" data-histmais>Carregar registros mais antigos</button></div>`}`;
  }
  function dados() {
    return `<div class="head"><div><h2>Dados</h2><p>${demo() ? 'Modo demonstração: os registros ficam guardados somente neste navegador.' : 'Os registros ficam no banco do projeto (Supabase) e aparecem em qualquer aparelho de quem tem acesso.'}</p></div></div>
 <div class="panel box"><h2 class="bx">Planilhas para a prestação de contas (.csv)</h2><div class="acts">${Object.keys(MOD).filter(m => m !== 'pessoas').map(m => `<button class="b s" data-exp="${m}">${MOD[m].nome}</button>`).join('')}</div>
 <div class="small">Abre no Excel e no LibreOffice. A planilha de unidades produtivas tem dados pessoais: guarde em pasta do projeto, não envie por aplicativo de mensagem.</div></div>
 <div class="panel box"><h2 class="bx">Cópia de segurança</h2><div class="acts"><button class="b" data-exp="json">Baixar cópia completa (.json)</button></div><div id="msg" class="small"></div></div>
 <div class="panel box"><h2 class="bx">Minha senha e meus dados</h2><p class="small">Toque no seu nome, no alto da tela, para abrir <b>Meus dados</b>: lá você troca a senha e atualiza celular e município.</p><div class="acts"><button class="b" data-meus>Abrir Meus dados</button></div></div>
 ${coord() ? tabela('pessoas') + (demo() ? `<div class="panel box"><h2 class="bx">Recomeçar a demonstração</h2><div class="acts"><button class="b d" data-zerar>Apagar tudo e voltar aos exemplos</button></div></div>` : '') : ''}`;
  }
  /* cada tela tem um h1 com sobretítulo. Nas abas que já começam com um cabeçalho, o primeiro título vira o h1;
     no painel (que começa pelos indicadores) o cabeçalho é criado aqui. */
  const SOBRE = { historico: 'Histórico', painel: 'Visão geral', equipe: 'Equipe do projeto', unidades: 'Biofábricas', lotes: 'Produção', agricultores: 'Quem o projeto atende', distribuicoes: 'Rastreabilidade', visitas: 'Monitoramento', eventos: 'Formação', entregas: 'Plano de trabalho', financeiro: 'Recursos do TED', relatorios: 'Prestação de contas', dados: 'Administração' };
  function tituloDaTela(v) {
    const cab = [...v.children].find(c => c.classList && c.classList.contains('head')), eye = `<span class="eyebrow">${SOBRE[tab] || ''}</span>`;
    if (cab && tab !== 'painel') { const h2 = cab.querySelector('h2'), d = h2 && h2.parentElement; if (!h2) return; const h1 = document.createElement('h1'); h1.textContent = h2.textContent; h2.replaceWith(h1); d.classList.add('pg'); h1.insertAdjacentHTML('beforebegin', eye); return; }
    const novo = document.createElement('div'); novo.className = 'head'; novo.innerHTML = `<div class="pg">${eye}<h1>Execução do projeto</h1><p>${fora() ? 'Andamento do projeto em tempo real, como a equipe registrou.' : 'O que já foi feito, o que pede atenção e o que vem pela frente.'}</p></div>`;
    const ref = [...v.children].find(c => c.classList && (c.classList.contains('dx-topo') || c.classList.contains('banner') || c.classList.contains('fe'))); v.insertBefore(novo, ref || v.firstChild);   // o título vem antes do "Falta enviar"
  }
  /* texto dentro de gráfico e mapa: o desenho encolhe ou cresce com a tela; --k devolve a letra ao tamanho da escala */
  /* depois de desenhar: se o gráfico ganhou menos (ou mais) espaço do que o palpite, redesenha só ele com a medida certa */
  function ajustarGrafico() {
    const rg = document.querySelector('[data-rg]'); if (!rg) return;
    const w = rg.clientWidth; if (!w) return;
    const certo = w < 560 ? GR_ESTREITO : GR_LARGO; if (certo === GR) return;
    const painel = rg.closest('.fin-g'); if (painel) painel.outerHTML = graficoRitmo(certo);
  }
  /* blocos só de leitura também recebem o Tab (14/10/2026): quem navega pelo teclado lê cada painel, cartão e aviso.
     Só ganham parada os que não têm nada clicável dentro (os outros já são alcançados pelo que têm dentro). */
  const FOCAVEL = 'button:not([disabled]),a[href],input:not([type=hidden]),select,textarea,summary,[tabindex]:not([tabindex="-1"])';
  function paradasDeLeitura() {
    document.querySelectorAll('#view section, #view .panel, #view .pc, #view .vg, #view .mt-gi').forEach(el => {
      if (el.hasAttribute('tabindex') || el.matches(FOCAVEL) || el.querySelector(FOCAVEL)) return;
      el.setAttribute('tabindex', '0');
      if (!el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')) { const h = el.querySelector('h2,h3,b,.vg-c'); if (h) { if (!h.id) h.id = 'pl-' + Math.random().toString(36).slice(2, 9); el.setAttribute('aria-labelledby', h.id); } }
      if (!el.getAttribute('role') && !/^(SECTION|LI)$/.test(el.tagName)) el.setAttribute('role', 'group');
    });
    // cada tabela com nome próprio (antes, todas se chamavam "Tabela", e o leitor de tela não distinguia uma da outra)
    document.querySelectorAll('#view .scroll[role=region]').forEach(el => {
      const c = el.closest('details, section, .panel'), h = c && (c.querySelector(':scope > summary') || c.querySelector('h2,h3,h4'));
      const t = h && h.textContent.replace(/\s+/g, ' ').trim(); if (t) el.setAttribute('aria-label', `Tabela: ${t.slice(0, 80)} (role para o lado no celular)`);
    });
  }
  function escalaDesenhos() {
    ajustarGrafico();
    document.querySelectorAll('svg[data-vb]').forEach(sv => { const w = sv.getBoundingClientRect().width; if (w > 0) sv.style.setProperty('--k', (+sv.dataset.vb / w).toFixed(4)); });
    // sigla da biofábrica perto da borda direita: com a letra no tamanho da tela (maior no modo sol) ela sairia do desenho; passa para a esquerda do frasco
    document.querySelectorAll('svg[data-vb] text[data-esq]').forEach(t => { try {
      if (!t.dataset.dir) t.dataset.dir = t.getAttribute('x');
      t.setAttribute('x', t.dataset.dir); t.removeAttribute('text-anchor');
      const bb = t.getBBox(); if (bb.width && bb.x + bb.width > +t.ownerSVGElement.dataset.vb - 2) { t.setAttribute('x', t.dataset.esq); t.setAttribute('text-anchor', 'end'); }
    } catch (e) { /* getBBox falha com o desenho escondido: fica como está */ } });
  }
  /* foco que sobrevive ao redesenho (14/10/2026): trocar de aba, salvar ou fechar uma janela redesenha a tela; o foco volta
     ao mesmo botão (a mesma aba, o mesmo "Editar") e o próximo Tab continua dali, em vez de recomeçar do topo da página */
  const ATR_FOCO = ['data-tab', 'data-new', 'data-edit', 'data-fichamembro', 'data-del', 'data-presenca', 'data-fotos', 'data-rub', 'data-mapa', 'data-exp', 'data-meus', 'data-ajuda', 'data-aparencia', 'data-mais', 'data-abrir-rub', 'data-hist', 'data-acessos'];
  function chaveFoco(el) {
    if (!el || el === document.body || !el.closest || el.closest('dialog')) return null;
    if (el.id && el.id !== 'view') return '#' + CSS.escape(el.id);
    const a = ATR_FOCO.find(x => el.hasAttribute(x)); if (!a) return null;
    return (el.closest('#tabs') ? '#tabs ' : el.closest('header') ? 'header ' : '#view ') + `[${a}="${CSS.escape(el.getAttribute(a))}"]`;
  }
  function devolverFoco(chave) {
    if (!chave) return; const atual = document.activeElement;
    if (atual && atual !== document.body && atual.isConnected && !atual.matches('#view')) return;   // alguém já pôs o foco num lugar certo
    const el = document.querySelector(chave); if (el) el.focus({ preventScroll: true });
  }
  // o foco pelo Tab não fica embaixo do menu fixo (WCAG 2.4.11): a rolagem automática para o foco deixa a altura do menu livre
  function margemDoMenu() { const nv = $('nav'); if (nv && nv.offsetHeight) document.documentElement.style.scrollPaddingTop = (nv.offsetHeight + 12) + 'px'; }
  let gatilho = null;   // botão que abriu a janela: o foco volta para ele quando a janela fecha
  function render() {
    const chave = chaveFoco(document.activeElement);
    R.novoDesenho(); TARDE = new Map();
    if (!eu || !db) return;
    nav(); const v = $('#view');
    v.innerHTML = (real ? `<div class="banner sim"><span><b>Pré-visualização.</b> É assim que ${esc(eu.orgao || 'SEAB/MDA')} vê o sistema: só leitura, sem nomes de agricultores e sem a equipe. Você continua com a sua conta.</span><button class="b p" data-sairver>Voltar à minha visão</button></div>` : '') + avisoFila() + (tab === 'painel' ? painel() : tab === 'dados' ? dados() : tab === 'financeiro' ? financeiro() : tab === 'equipe' ? equipe() : tab === 'historico' ? telaHistorico() : tab === 'relatorios' ? relatorio() : tab === 'unidades' ? tabela('unidades') + tabela('itens') : tab === 'agricultores' ? telaAgricultores() : tabela(tab));
    tituloDaTela(v); escalaDesenhos(); paradasDeLeitura(); margemDoMenu(); carregarFotosEq(); if (chave) requestAnimationFrame(() => devolverFoco(chave));   // depois de desenhar: focar antes forçava refazer a página inteira na hora
    if (!abas().some(t => t[0] === tab)) tab = 'painel';
    $('#quem-av').textContent = iniciais(demo() ? eu.perfil : eu.nome); atualizarCabecalhoFoto(); carregarFotosEq();
    $('#quem-nome').textContent = demo() ? 'Demonstração' : eu.nome;
    $('#quem-papel').textContent = (R.NOME_PERFIL[eu.perfil] || eu.perfil) + (eu.orgao ? ' · ' + eu.orgao : '');
    $('#net').hidden = navigator.onLine !== false && !(api.offline);
  }

  /* ---------- formulário ---------- */
  /* corpo de um formulário: os campos vão em grupos; cada marcador de seção (tipo 'sec') fecha um grupo e abre outro com título.
     "quais" (opcional) limita aos campos indicados: é assim que o link de cadastro mostra só o que a pessoa pode preencher. */
  /* número digitado no padrão brasileiro: "120,50", "1.234,56" e "1.500" (mil e quinhentos). Texto que não é número vira NaN e a validação recusa. */
  const numCampo = x => { let t = String(x == null ? '' : x).trim().replace(/\s|R\$/g, ''); if (t === '') return '';
    if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.'); else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
    return /^\d+(\.\d+)?$/.test(t) ? +t : NaN; };
  const AUTO = { nome: 'autocomplete="name"', email: 'autocomplete="email"', telefone: 'autocomplete="tel"', cep: 'autocomplete="postal-code" inputmode="numeric"', logradouro: 'autocomplete="address-line1"',
    complemento: 'autocomplete="address-line2"', municipio: 'autocomplete="address-level2"', nascimento: 'autocomplete="bday"', pis: 'inputmode="numeric" autocomplete="off"', siape: 'inputmode="numeric" autocomplete="off"', numero: 'inputmode="numeric"' };
  const IC_PINO = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.800 12 21 12 21z"/><circle cx="12" cy="9.500" r="2.500"/></svg>';
  const textoLocal = r => `${(+r.lat).toFixed(5).replace('.', ',')}; ${(+r.lng).toFixed(5).replace('.', ',')}${r.precisao != null && r.precisao !== '' ? ` · precisão de ${num(+r.precisao)} m` : ''}`;
  /* GPS do celular: alta precisão, até 25 s; funciona sem internet. Precisão pior que 100 m é avisada (dentro de casa, céu fechado) */
  function pegarLocal(b) {
    const t = $('#f_geo_t'); if (!navigator.geolocation) { t.textContent = 'Este navegador não informa a localização.'; return; }
    b.disabled = true; t.textContent = 'Procurando o sinal do GPS… fique a céu aberto, se puder.';
    const dono = ed, aqui = () => ed === dono && b.isConnected;   // a resposta do GPS demora: se o formulário fechou ou mudou, ela é descartada (auditoria 14/10)
    navigator.geolocation.getCurrentPosition(p => {
      if (!aqui()) return; const t = $('#f_geo_t');
      b.disabled = false; const r = { lat: Math.round(p.coords.latitude * 1e6) / 1e6, lng: Math.round(p.coords.longitude * 1e6) / 1e6, precisao: Math.round(p.coords.accuracy) };
      $('#f_lat').value = r.lat; $('#f_lng').value = r.lng; $('#f_precisao').value = r.precisao; b.querySelector('span').textContent = 'Pegar de novo';
      t.textContent = textoLocal(r) + (r.precisao > 100 ? ' · precisão baixa: tente de novo fora de casa' : '');
      if (!$('[data-geolimpar]')) t.insertAdjacentHTML('afterend', '<button type="button" class="lk geo-x" data-geolimpar>Apagar</button>');
    }, e => { if (!aqui()) return; const t = $('#f_geo_t'); b.disabled = false; t.textContent = e.code === 1 ? 'O celular não deixou pegar a localização. Permita a localização para este site nas configurações do navegador e tente de novo.' : e.code === 3 ? 'O GPS demorou demais. Vá para um lugar aberto e tente de novo.' : 'Não foi possível pegar a localização agora. Tente de novo.'; },
    { enableHighAccuracy: true, timeout: 25000, maximumAge: 0 });
  }
  const OBR = ' <span class="obr" aria-hidden="true">*</span>';   // campo obrigatório (o navegador também anuncia pelo required)
  function corpoForm(M, r, id, quais) {
    const campo = ([k, l, t, req, o, filtro]) => {
      const v = r[k] == null ? '' : r[k], idc = 'f_' + k, Rq = req ? ' required' : '', L = l + (req ? OBR : '');
      if (t === 'checks') return `<div class="fld w"><fieldset><legend>${l}</legend>${D.CHECK.map(c => `<label><input type="checkbox" id="f_${c[0]}" ${r[c[0]] ? 'checked' : ''}>${c[1]}</label>`).join('')}</fieldset></div>`;
      if (t === 'check') return `<div class="fld"><span aria-hidden="true"></span><fieldset><label><input type="checkbox" id="${idc}" ${v ? 'checked' : ''}>${l}</label></fieldset></div>`;
      if (t === 'select') { const ops = typeof o === 'function' ? o() : o; return `<div class="fld"><label for="${idc}">${L}</label><select id="${idc}"${Rq}>${ops.map(x => `<option value="${esc(x[0])}" ${String(v) === String(x[0]) ? 'selected' : ''}>${esc(x[1]) || '—'}</option>`).join('')}</select></div>`; }
      if (t === 'ref') { const lista = db[o].filter(x => !filtro || filtro(x) || x.id === v); return `<div class="fld"><label for="${idc}">${L}</label><select id="${idc}"${Rq}><option value="">Escolha</option>${lista.map(x => `<option value="${esc(x.id)}" ${v === x.id ? 'selected' : ''}>${esc(rotulo[o](x))}</option>`).join('')}</select></div>`; }
      if (t === 'html') return `<div class="fld w fm-html">${o}</div>`;
      if (t === 'textarea') return `<div class="fld w"><label for="${idc}">${l}</label><textarea id="${idc}">${esc(v)}</textarea></div>`;
      if (t === 'geo') { const tem = r.lat != null && r.lat !== ''; return `<div class="fld w"><span class="geo-r" id="f_local_r">${l}</span><div class="geo" role="group" aria-labelledby="f_local_r"><input type="hidden" id="f_lat" value="${tem ? esc(r.lat) : ''}"><input type="hidden" id="f_lng" value="${tem ? esc(r.lng) : ''}"><input type="hidden" id="f_precisao" value="${tem && r.precisao != null ? esc(r.precisao) : ''}">
        <button type="button" class="b geo-b" data-geo>${IC_PINO}<span>${tem ? 'Pegar de novo' : 'Pegar a localização'}</span></button><span class="geo-t" id="f_geo_t" aria-live="polite">${tem ? textoLocal(r) : 'Ainda não registrada.'}</span>${tem ? '<button type="button" class="lk geo-x" data-geolimpar>Apagar</button>' : ''}</div></div>`; }
      return `<div class="fld${['nome', 'tema', 'titulo', 'descricao', 'email'].includes(k) ? ' w' : ''}"><label for="${idc}">${L}</label><input id="${idc}" type="${t === 'number' ? 'text' : t}" ${t === 'number' ? 'inputmode="decimal" autocomplete="off"' : (M === MOD.membros || M.membrosPub) && AUTO[k] ? AUTO[k] : ''} value="${esc(v === '' && t === 'date' && req && !id ? iso(hoje()) : t === 'number' && v !== '' ? String(v).replace('.', ',') : v)}"${Rq}></div>`;
    };
    let corpo = '', aberto = false; const dica = k => M.dicas && M.dicas[k] ? `<span class="fm-dica">${esc(M.dicas[k])}</span>` : '';
    /* cada seção é um grupo; o grupo pode aparecer só para algumas funções (so), sumir quando a pessoa já tem Arlo (semArlo),
       abrir com o questionário (socio) ou existir só na edição (edicao). Quem mostra e esconde é ajustarFormMembro. */
    let pend = null, pular = false;
    const atr = op => (op.so ? ` data-so="${op.so.join(' ')}"` : '') + (op.semArlo ? ' data-semarlo' : '') + (op.socio ? ' data-socio' : '');
    M.campos.forEach(c => {
      if (c[2] === 'sec') { pend = c; pular = !!(c[3] && c[3].edicao && !id); return; }
      if (pular || (quais && !quais.includes(c[0]) && c[2] !== 'html')) return;
      if (pend) { corpo += (aberto ? '</div></div>' : '') + `<div class="fm-g"${atr(pend[3] || {})}>${pend[1] ? `<h3 class="fm-sec">${pend[1]}</h3>` : ''}<div class="fields">`; aberto = true; pend = null; }
      if (!aberto) { corpo += '<div class="fm-g"><div class="fields">'; aberto = true; }
      corpo += campo(c).replace(/<\/div>$/, dica(c[0]) + '</div>');
    });
    if (aberto) corpo += '</div></div>';
    return corpo;
  }
  /* formulário da equipe: o que aparece depende da função, da resposta sobre o Arlo e do questionário */
  function ajustarFormMembro(root) {
    if (!root || !root.querySelector('.fm-g')) return;
    const fun = (root.querySelector('#f_funcao') || {}).value || (pub && pub.funcao) || '', arlo = (root.querySelector('#f_arlo') || {}).value, soc = !!(root.querySelector('#f_socio') || {}).checked;
    root.querySelectorAll('.fm-g[data-so]').forEach(g => { g.hidden = !g.dataset.so.split(' ').includes(fun); });
    root.querySelectorAll('.fm-g[data-semarlo]').forEach(g => { g.hidden = arlo === 'Sim'; });
    root.querySelectorAll('.fm-g[data-socio]').forEach(g => { g.hidden = !soc; });
    const faz = root.querySelector('#fm_faz'), F = FUNCOES.find(x => x[0] === fun);
    if (faz) { faz.hidden = !F; faz.innerHTML = F ? `<span>${esc(NOME_FUNCAO[fun])}</span><p>${esc(F[4])}</p>` : ''; }
  }
  /* CEP: com internet, preenche rua, bairro, município e estado (só o que estiver vazio). Vai para o ViaCEP apenas o CEP. */
  let cepUlt = '';
  async function buscarCep(root) {
    const el = root.querySelector('#f_cep'), c = R.soDigitos(el && el.value); if (c.length !== 8 || c === cepUlt) return; cepUlt = c;
    try {
      const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 5000);
      const r = await fetch(`https://viacep.com.br/ws/${c}/json/`, { signal: ctl.signal, referrerPolicy: 'no-referrer', credentials: 'omit' }); clearTimeout(t);
      const j = await r.json(); if (!j || j.erro) return;
      const por = (id, v) => { const x = root.querySelector('#' + id); if (x && !x.value && v) x.value = v; };
      por('f_logradouro', j.logradouro); por('f_bairro', j.bairro); por('f_complemento', j.complemento);
      por('f_municipio', j.localidade && j.uf ? `${j.localidade}/${j.uf}` : ''); por('f_uf', j.uf);
    } catch (e) { /* sem internet ou ViaCEP fora do ar: a pessoa digita */ }
  }
  /* ---------- link de cadastro da equipe ---------- */
  let convites, preMembro = null;   // convites: undefined = ainda não carregou; null = o banco não tem (falta o script 11); lista = carregado
  const NOME_FUNCAO = { coordenacao: 'Coordenação do projeto', auxiliar: 'Auxiliar administrativo', discente: 'Bolsista discente', formador: 'Formador(a)' };
  async function carregarConvites() { try { convites = await api.convites(); } catch (e) { convites = []; toast(e.message); } if (tab === 'equipe') render(); }
  function abrirEscolha(funcao) {
    ed = null; $('#frm').className = 'fm';
    $('#frm').innerHTML = `<div class="fm-cab"><div><span class="fm-eye">Cadastrar</span><h2>${NOME_FUNCAO[funcao]}</h2></div><button type="button" class="fm-x" data-fechar aria-label="Fechar">×</button></div>
     <div class="fm-corpo"><p class="aj-p">Como você quer fazer este cadastro?</p>
      <button type="button" class="esc" data-gerarlink="${funcao}"><span class="esc-r">Recomendado</span><b>Gerar link de cadastro</b><span>A pessoa preenche os próprios dados pelo celular e aceita o termo de uso dos dados. Você confere e aprova. Menos digitação e menos erro.</span></button>
      <button type="button" class="esc" data-digitar="${funcao}"><b>Digitar os dados agora</b><span>Você digita os dados. Use quando já tem tudo em mãos ou a pessoa não tem internet.</span></button></div>
     <div class="fm-pe"><div class="err" id="ferr" role="alert"></div><div class="frow"><button type="button" class="b" data-fechar>Cancelar</button></div></div>`;
    if (!$('#dlg').open) $('#dlg').showModal();
  }
  /* a janela já estava aberta e o conteúdo mudou: o foco vai ao primeiro campo (ou ao ×), não se perde na página */
  const focarDlg = () => { const f = $('#frm').querySelector('input:not([type=hidden]):not([disabled]),select,textarea,[autofocus]') || $('#frm .fm-x'); if (f) f.focus(); };
  function mostrarLink(funcao, token) {
    const link = location.origin + location.pathname + '#c=' + token, msg = `Olá! Para entrar na equipe do projeto Saberes que Cultivam (${NOME_FUNCAO[funcao]}), preencha o seu cadastro neste link. Ele vale 7 dias e serve uma vez só: ${link}`;
    $('#frm').innerHTML = `<div class="fm-cab"><div><span class="fm-eye">Link de cadastro</span><h2>${NOME_FUNCAO[funcao]}</h2></div><button type="button" class="fm-x" data-fechar aria-label="Fechar">×</button></div>
     <div class="fm-corpo"><div class="fm-oque"><span>Link gerado</span><p>Mande para a pessoa. Vale 7 dias e serve uma vez só. Depois que ela preencher, o cadastro aparece na aba Equipe para você conferir e aprovar.</p></div>
      <div class="fields"><div class="fld w"><label for="lk_txt">Link</label><input id="lk_txt" readonly value="${esc(link)}"><span class="fm-dica">Copie agora: por segurança o sistema não guarda o link e não consegue mostrá-lo de novo. Se perder, cancele este e gere outro.</span></div></div></div>
     <div class="fm-pe"><div class="err" id="ferr" role="status"></div><div class="frow"><button type="button" class="b" data-fechar>Fechar</button><a class="b" href="https://wa.me/?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener noreferrer">Mandar pelo WhatsApp</a><button type="button" class="b p" data-copiarlink>Copiar o link</button></div></div>`;
    focarDlg();
  }
  /* página do link: sem login. A pessoa só fala com duas funções do banco (ver se o link vale; enviar uma vez). */
  let pub = null;
  async function telaConvite(token) {
    $('#carregando').hidden = true; $('#auth').hidden = true; $('#app').hidden = true; const P = $('#pub'); P.hidden = false;
    const cab = '<div class="pub-m"><img src="assets/icon-192.png" alt="" width="48" height="48"><div><b>Saberes que Cultivam</b><span>Bioinsumos, agroecologia e agricultura familiar</span></div></div>';
    const aviso = (t, p) => { P.innerHTML = `<div class="pub">${cab}<div class="panel pub-c"><h1>${t}</h1><p>${p}</p></div></div>`; };
    if (!/^[0-9a-f]{64}$/.test(token)) return aviso('Este link está incompleto', 'Parte do endereço se perdeu ao copiar ou encaminhar. Abra o link inteiro, do jeito que a coordenação enviou, ou peça outro.');
    let funcao = null; try { funcao = await api.conviteVer(token); } catch (e) { return aviso('Não foi possível abrir o cadastro', 'Confira a sua internet e abra o link de novo.'); }
    if (!funcao) return aviso('Este link não vale mais', 'Ele já foi usado ou passou dos 7 dias. Peça outro à coordenação do projeto.');
    pub = { token, funcao }; try { history.replaceState(null, '', location.pathname); } catch (x) {}   // o código sai do endereço e do histórico enquanto a pessoa preenche (fica só na memória)
    const M = MOD.membros, rotLgpd = 'Autorizo o projeto Saberes que Cultivam (IFRN, MDA e FUNCERN) a usar estes dados só para a gestão do projeto e o pagamento da bolsa, conforme a Lei nº 13.709/2018 (LGPD).';
    const Mp = Object.assign({}, M, { membrosPub: true, campos: M.campos.map(c => c[0] === 'lgpd' ? ['lgpd', rotLgpd, 'check'] : c[0] === 'socio' ? ['socio', 'Quero responder. Só a coordenação do projeto vê estas respostas.', 'check'] : c[0] === 'arlo' ? ['arlo', 'Você já tem cadastro no sistema Arlo, da FUNCERN?', 'select', 0, c[4]] : c),
      dicas: Object.assign({}, M.dicas, { nome: '', vinculo: 'Exemplo: IFRN Campus Apodi, ou o seu curso.', cpf: 'Só a coordenação do projeto vê.', socio: '' }) });
    P.innerHTML = `<div class="pub">${cab}<form id="fpub" class="fm panel pub-c" novalidate><div class="fm-cab"><div><span class="fm-eye">Cadastro na equipe</span><h1>${NOME_FUNCAO[funcao]}</h1></div></div>
      <div class="fm-corpo"><ol class="pub-passos" aria-label="Etapas do cadastro"><li class="pp-at" aria-current="step"><b>1</b>Seus dados</li><li><b>2</b>A coordenação confere</li><li><b>3</b>Você cria a senha</li></ol>
       <div class="fm-faz" id="fm_faz" hidden></div>
       <div class="fm-oque"><span>Como funciona</span><p>Preencha e envie. A coordenação do projeto confere e confirma o seu cadastro; depois você recebe o aviso para criar a senha com este mesmo e-mail. O link serve uma vez só. O que você digitar fica guardado neste aparelho por 24 horas (sem CPF, documentos, endereço e questionário), caso a internet caia.</p></div>${corpoForm(Mp, rascunhoLer(funcao), null, R.CAMPOS_CONVITE)}</div>
      <div class="fm-pe"><div class="err" id="perr" role="alert"></div><div class="frow"><button class="b p" id="penviar">Enviar o meu cadastro</button></div></div></form></div>`;
    if (SQC.mascaras) SQC.mascaras.preparar($('#fpub')); ajustarFormMembro($('#fpub'));
  }
  /* rascunho do link: 24 h neste aparelho, sem os dados reservados (CPF, documentos, endereço, questionário) */
  const RASC = 'sqc-rascunho-cadastro', RASC_FORA = R.CAMPOS_RESERVADOS.concat(['lgpd']);
  function rascunhoLer(funcao) { try { const x = JSON.parse(localStorage.getItem(RASC) || 'null'); if (!x || x.funcao !== funcao || Date.now() - x.em > 864e5) { localStorage.removeItem(RASC); return {}; } return x.dados || {}; } catch (e) { return {}; } }
  function rascunhoGuardar() {
    if (!pub || !$('#fpub')) return; const d = {};
    R.CAMPOS_CONVITE.filter(k => !RASC_FORA.includes(k)).forEach(k => { const el = $('#f_' + k); if (el && el.type !== 'checkbox' && el.value) d[k] = el.value; });
    try { localStorage.setItem(RASC, JSON.stringify({ funcao: pub.funcao, em: Date.now(), dados: d })); } catch (e) { /* sem armazenamento: segue sem rascunho */ }
  }
  async function aoEnviarConvite(ev) {
    ev.preventDefault(); if (!pub) return; const r = {}, er = t => { $('#perr').textContent = t; };
    for (const [k, l, t] of MOD.membros.campos) { if (t === 'sec' || !R.CAMPOS_CONVITE.includes(k)) continue; const el = $('#f_' + k); if (!el) continue;
      r[k] = t === 'check' ? el.checked : t === 'number' ? numCampo(el.value) : el.value.trim(); }
    R.normalizarMembro(r); const msg = R.validarConvite(r, pub.funcao);
    if (msg) { const alvo = [['nome', 'nome'], ['CPF', 'cpf'], ['PIS', 'pis'], ['CEP', 'cep'], ['nascimento', 'nascimento'], ['e-mail', 'email'], ['telefone', 'telefone'], ['renda', 'renda'], ['Pessoas', 'pessoas_casa'], ['concorda', 'lgpd']].find(x => msg.includes(x[0])) || (/celular/.test(msg) ? [0, 'telefone'] : /Perfil no campo/.test(msg) ? [0, 'agricultor'] : null);
      const el = alvo && $('#f_' + alvo[1]); if (el) el.focus(); return er(msg); }
    Object.keys(r).forEach(k => { if (r[k] === '' || r[k] == null) delete r[k]; });
    const b = $('#penviar'); if (b.disabled) return; b.disabled = true; b.textContent = 'Enviando…'; er('');
    try { await api.conviteEnviar(pub.token, r); } catch (e) { b.disabled = false; b.textContent = 'Enviar o meu cadastro'; return er(e.message || 'Não foi possível enviar. Tente de novo.'); }
    pub = null; try { localStorage.removeItem(RASC); history.replaceState(null, '', location.pathname); } catch (x) {}
    $('#pub').querySelector('.pub-c').outerHTML = '<div class="panel pub-c"><h1>Cadastro enviado</h1><p>Obrigado. A coordenação do projeto vai conferir os seus dados e confirmar o cadastro. Pode fechar esta página.</p></div>'; scrollTo(0, 0);
  }

  /* ---------- lista de presença de uma atividade (script 13) ---------- */
  let prUlt = {};   // comunidade e município do último nome digitado: na mesma atividade quase sempre se repetem
  function abrirPresenca(evId, msg) {
    const e = by('eventos', evId); if (!e) return;
    ed = null; prEv = evId; const L = (db.presencas || []).filter(x => x.evento === evId).sort((a, b) => R.nrm(a.nome) < R.nrm(b.nome) ? -1 : 1), pode = R.podeGravar(eu, 'presencas'), mul = L.filter(x => x.mulher).length;
    const difere = L.length && (+e.part !== L.length || +e.mulheres !== mul);
    $('#frm').className = 'fm';
    $('#frm').innerHTML = `<div class="fm-cab"><div><span class="fm-eye">Lista de presença</span><h2>${esc(e.tema)}</h2></div><button type="button" class="fm-x" data-fechar aria-label="Fechar">×</button></div>
     <div class="fm-corpo"><p class="fm-sub">${esc(e.tipo)} · ${dt(e.data)}${e.lugar ? ' · ' + esc(e.lugar) : ''}</p>
      <div class="fm-oque"><span>Como fazer</span><p>Imprima a lista em branco, passe na atividade para as pessoas assinarem e digite aqui os nomes depois. A folha assinada é a evidência: fotografe e anexe em Fotos. Só a equipe do projeto vê os nomes; o SEAB/MDA vê só o total de participantes.</p></div>
      <p class="pr-t"><b>${L.length}</b> pessoa${L.length === 1 ? '' : 's'} na lista${L.length ? `, das quais ${mul} mulher${mul === 1 ? '' : 'es'}` : ''}.${difere ? ` Na atividade estão registrados ${R.vazio(e.part) ? 'sem número de' : num(e.part)} participantes${R.vazio(e.mulheres) ? '' : ` (${num(e.mulheres)} mulheres)`}.` : ''}</p>
      ${L.length ? `<ol class="pr-l">${L.map(x => `<li><span><b>${esc(x.nome)}</b>${x.mulher ? ' <span class="chip">mulher</span>' : ''}${x._pendente ? ' <span class="chip f">aguardando envio</span>' : ''}<small>${esc([x.comunidade, x.municipio].filter(Boolean).join(' · '))}</small></span>${R.podeExcluir(eu, 'presencas', x) && !x._pendente ? `<button type="button" class="ab d" title="Tirar da lista" data-prdel="${esc(x.id)}">${IC_LIXO}<span class="so">Tirar ${esc(x.nome)} da lista</span></button>` : ''}</li>`).join('')}</ol>` : ''}
      ${pode ? `<h3 class="fm-sec">Adicionar à lista</h3><div class="fields"><div class="fld w"><label for="pr_nome">Nome</label><input id="pr_nome" autocomplete="off"></div>
        <div class="fld"><label for="pr_com">Comunidade</label><input id="pr_com" value="${esc(prUlt.comunidade || '')}"></div><div class="fld"><label for="pr_mun">Município</label><input id="pr_mun" value="${esc(prUlt.municipio || e.municipio || '')}"></div>
        <div class="fld"><span aria-hidden="true"></span><fieldset><label><input type="checkbox" id="pr_mul">Mulher</label></fieldset></div></div>
        <div class="acts"><button type="button" class="b p" data-pradd="${esc(evId)}">Adicionar</button></div>` : ''}</div>
     <div class="fm-pe"><div class="err" id="ferr" role="alert"></div><div class="ok-msg" id="fok" role="status">${esc(msg || '')}</div><div class="frow"><button type="button" class="b" data-imprimirlista="${esc(evId)}">Imprimir lista em branco</button>${pode && difere ? `<button type="button" class="b" data-prcontar="${esc(evId)}">Usar o total da lista na atividade</button>` : ''}<button type="button" class="b" data-fechar>Fechar</button></div></div>`;
    if ($('#dlg').open) ($('#pr_nome') || $('#frm .fm-x')).focus(); else $('#dlg').showModal();
  }
  let prEv = null;
  let prOcupado = false;
  async function adicionarPresenca(evId) {
    if (prOcupado) return; prOcupado = true;
    try { await adicionarPresenca_(evId); } finally { prOcupado = false; }
  }
  async function adicionarPresenca_(evId) {
    const v = id => ($('#' + id) || {}).value || '', r = { id: SQC.novoId(), evento: evId, nome: v('pr_nome').trim(), comunidade: v('pr_com').trim(), municipio: v('pr_mun').trim(), mulher: !!($('#pr_mul') && $('#pr_mul').checked) };
    const msg = R.validar(db, 'presencas', r, null); if (msg) { $('#ferr').textContent = msg; $('#pr_nome').focus(); return; }
    if ((db.presencas || []).some(x => x.evento === evId && R.nrm(x.nome) === R.nrm(r.nome))) { $('#ferr').textContent = `${r.nome} já está nesta lista.`; $('#pr_nome').select(); return; }
    const res = await gravarRegistro('presencas', r, null);
    if (!res.ok) { $('#ferr').textContent = res.msg; return; }
    prUlt = { comunidade: r.comunidade, municipio: r.municipio };
    abrirPresenca(evId, res.fila ? `${r.nome}: guardado neste aparelho, envia quando o sinal voltar.` : `${r.nome} entrou na lista.`); $('#pr_nome').focus();
  }

  /* ---------- fotos de uma atividade ou visita (script 13) ---------- */
  const urlsFoto = {};   // id da foto → endereço da imagem já baixada nesta página
  function abrirFotos(t, id, msg) {
    const r = by(t, id); if (!r) return;
    ed = null; const F = (db.fotos || []).filter(f => f.tabela === t && f.registro === id).sort((a, b) => (a.criado_em || '') < (b.criado_em || '') ? -1 : 1), pode = R.podeGravar(eu, 'fotos');
    const titulo = t === 'eventos' ? esc(r.tema) : esc((by('agricultores', r.agricultor) || { nome: 'Visita' }).nome), dia = r.data;
    $('#frm').className = 'fm';
    $('#frm').innerHTML = `<div class="fm-cab"><div><span class="fm-eye">Fotos ${t === 'eventos' ? 'da atividade' : 'da visita'}</span><h2>${titulo}</h2></div><button type="button" class="fm-x" data-fechar aria-label="Fechar">×</button></div>
     <div class="fm-corpo"><p class="fm-sub">${t === 'eventos' ? esc(r.tipo) + ' · ' : ''}${dt(dia)}</p>
      <div class="fm-oque"><span>Regra da foto</span><p>Vale foto tirada no dia ${dt(dia)}. A data vem de dentro do arquivo, gravada pela câmera. Foto sem essa data (encaminhada pelo WhatsApp, captura de tela) entra marcada como “data não confirmada”. Só a equipe do projeto vê as fotos.</p></div>
      ${F.length ? `<ul class="ft-g">${F.map(f => `<li><div class="ft-i" data-ftimg="${esc(f.id)}" role="img" aria-label="${esc(f.legenda || 'Foto')}"><span class="small">carregando…</span></div>
        <div class="ft-d"><span>${f.tirada_em ? `<span class="chip ok">tirada em ${dt(f.tirada_em)}</span>` : '<span class="chip f">data não confirmada</span>'}</span>${f.legenda ? `<small>${esc(f.legenda)}</small>` : ''}
        ${R.podeExcluir(eu, 'fotos', f) ? `<button type="button" class="ab d" title="Excluir foto" data-fotodel="${esc(f.id)}">${IC_LIXO}<span class="so">Excluir foto</span></button>` : ''}</div></li>`).join('')}</ul>` : '<p class="small">Nenhuma foto ainda.</p>'}
      ${pode ? `<h3 class="fm-sec">Anexar foto</h3><div class="fields"><div class="fld w"><label for="ft_leg">Legenda (opcional)</label><input id="ft_leg" maxlength="300" placeholder="Ex.: lista de presença assinada; aplicação do biofertilizante"></div></div>
        <div class="acts"><button type="button" class="b p" data-fotocam="${t}:${esc(id)}">Tirar foto agora</button><label class="b imp-b">Escolher foto<input type="file" id="ft_arq" data-alvo="${t}:${esc(id)}" accept="image/jpeg,image/png,image/webp,image/heic" class="imp-f"></label></div>` : ''}</div>
     <div class="fm-pe"><div class="err" id="ferr" role="alert"></div><div class="ok-msg" id="fok" role="status">${esc(msg || '')}</div><div class="frow"><button type="button" class="b" data-fechar>Fechar</button></div></div>`;
    if ($('#dlg').open) $('#frm .fm-x').focus(); else $('#dlg').showModal();
    F.forEach(async f => { const el = document.querySelector(`[data-ftimg="${CSS.escape(f.id)}"]`); if (!el) return;
      try { if (!urlsFoto[f.id]) urlsFoto[f.id] = URL.createObjectURL(await api.arquivoFoto(f)); el.innerHTML = `<img src="${urlsFoto[f.id]}" alt="${esc(f.legenda || 'Foto')}" loading="lazy">`; }
      catch (e) { el.innerHTML = `<span class="small">${esc(e.semRede ? 'Sem internet: a foto aparece quando o sinal voltar.' : e.message)}</span>`; } });
  }
  async function anexarFoto(alvo, arquivo, daCamera) {
    const [t, id] = alvo.split(':'), r = by(t, id); if (!r || !arquivo) return;
    const er = m => { const e = $('#ferr'), o = $('#fok'); if (e) e.textContent = m; if (o) o.textContent = ''; };
    const andamento = m => { const e = $('#ferr'), o = $('#fok'); if (o) o.textContent = m; if (e) e.textContent = ''; };
    if (!demo() && navigator.onLine === false) return er('Foto precisa de internet para subir. Guarde a foto no celular e anexe quando o sinal voltar: a data dela continua valendo.');
    andamento('Conferindo a data da foto…');
    const m = daCamera ? { dia: SQC.fotodia.hoje(), hora: new Date().getHours() } : await SQC.fotodia.lerMomentoExif(arquivo);
    const erro = SQC.fotodia.conferir(m && m.dia, r.data, m && m.hora); if (erro) return er(erro);
    let blob; try { andamento('Preparando a foto…'); blob = await SQC.fotodia.reduzir(arquivo); } catch (e) { return er(e.message); }
    andamento('Enviando…');
    try { const f = await api.enviarFoto(t, id, blob, m && m.dia, (($('#ft_leg') || {}).value || '').trim()); if (!eu || !db) return;   // saiu da conta durante o envio
      db.fotos = (db.fotos || []).concat([f]); urlsFoto[f.id] = URL.createObjectURL(blob); if (api.guardarCopia) api.guardarCopia(db); render();
      if ($('#dlg').open && $(`#frm [data-fotocam="${t}:${CSS.escape(id)}"]`)) abrirFotos(t, id, m && m.dia ? 'Foto anexada.' : 'Foto anexada, marcada como “data não confirmada”.'); else toast('Foto anexada.'); }
    catch (e) { er(e.semRede ? 'Sem internet agora: a foto não subiu. Tente de novo quando o sinal voltar.' : e.message); }
  }

  /* ---------- imprimir em branco, para aplicar no papel (trazido do Mulheres & Quintais) ---------- */
  const IMPRIMIVEIS = ['agricultores', 'visitas', 'distribuicoes', 'eventos'];
  function imprimir(html) {
    let el = document.getElementById('impresso'); if (!el) { el = document.createElement('div'); el.id = 'impresso'; document.body.appendChild(el); }
    el.innerHTML = html; document.body.classList.add('imprimindo');
    // sem prazo para limpar: no iPhone o print() não espera a impressão e a folha saía em branco. Fora da impressão o #impresso já fica escondido.
    const fim = () => { document.body.classList.remove('imprimindo'); window.removeEventListener('afterprint', fim); };
    window.addEventListener('afterprint', fim);
    const img = el.querySelector('img'); Promise.race([img && img.decode ? img.decode().catch(() => {}) : null, new Promise(r => setTimeout(r, 800))]).then(() => window.print());
  }
  const cabImp = (titulo, sub) => `<header class="pf-cab"><img src="assets/icon-192.png" alt="" width="40" height="40"><div><b>Saberes que Cultivam</b><span>IFRN Campus Apodi · TED MDA</span></div><div class="pf-t"><h1>${esc(titulo)}</h1>${sub ? `<p>${sub}</p>` : ''}</div></header>`;
  function imprimirBranco(m) {
    const M = MOD[m], ln = '<span class="pf-ln"></span>', cx = t => `<span class="pf-op"><span class="pf-bx"></span>${esc(t)}</span>`;
    const campo = ([k, l, t, req, o]) => {
      if (t === 'sec') return `<h2>${esc(l)}</h2>`;
      if (t === 'checks') return `<div class="pf-i"><b>${esc(l)}</b><div class="pf-ops">${D.CHECK.map(c => cx(c[1])).join('')}</div></div>`;
      if (t === 'check') return `<div class="pf-i">${cx(l)}</div>`;
      if (t === 'select') { const ops = (typeof o === 'function' ? o() : o).filter(x => x[0] !== '' && x[1]); return `<div class="pf-i"><b>${esc(l)}${req ? ' *' : ''}</b><div class="pf-ops">${ops.map(x => cx(x[1])).join('')}</div></div>`; }
      if (t === 'ref') return `<div class="pf-i"><b>${esc(l)}${req ? ' *' : ''}</b>${ln}</div>`;
      if (t === 'textarea') return `<div class="pf-i w"><b>${esc(l)}</b>${ln.repeat(k === 'problemas' ? 4 : 5)}</div>`;
      if (t === 'geo') return `<div class="pf-i w"><b>${esc(l)} (GPS, se tiver)</b><span class="pf-dt">Lat. ______________ &nbsp; Long. ______________</span></div>`;
      if (t === 'date') return `<div class="pf-i"><b>${esc(l)}${req ? ' *' : ''}</b><span class="pf-dt">____ / ____ / ________</span></div>`;
      return `<div class="pf-i"><b>${esc(l)}${req ? ' *' : ''}</b>${ln}</div>`;
    };
    imprimir(`<section class="pf">${cabImp(M.um, `Aplicado por: ${esc(eu.nome)} &nbsp;·&nbsp; Data: ____ / ____ / ________`)}${M.oque ? `<p class="pf-o">${esc(M.oque)}</p>` : ''}<p class="pf-inst">Escreva com letra de forma. Nas opções, marque com <b>X</b> o quadrinho. Se faltar espaço, continue no verso indicando o nome do campo.</p><div class="pf-c">${M.campos.map(campo).join('')}</div><p class="pf-r">* obrigatório. Depois, digite no sistema: Saberes que Cultivam › ${esc(M.nome)}.</p></section>`);
  }
  function imprimirLista(evId) {
    const e = by('eventos', evId); if (!e) return;
    const linhas = Array.from({ length: 20 }, (_, i) => `<tr><td>${i + 1}</td><td></td><td></td><td></td><td></td><td></td></tr>`).join('');
    imprimir(`<section class="pf">${cabImp('Lista de presença', `${esc(e.tipo)} · ${esc(e.tema)} · ${dt(e.data)}${e.lugar ? ' · ' + esc(e.lugar) : ''}${e.municipio ? ' · ' + esc(e.municipio) : ''}`)}
      <p class="pf-o">Ao assinar, você concorda que seu nome conste nesta lista, usada só para comprovar a atividade ao financiador (Lei nº 13.709/2018).</p>
      <table class="pf-lp"><thead><tr><th>Nº</th><th>Nome completo</th><th>Comunidade</th><th>Município</th><th>Mulher? (S/N)</th><th>Assinatura</th></tr></thead><tbody>${linhas}</tbody></table>
      <p class="pf-r">Responsável: ${esc(eu.nome)} &nbsp;·&nbsp; Folha ____ de ____</p></section>`);
  }
  function abrir(m, id, pre) {
    const M = MOD[m], r = id ? (by(m, id) || {}) : (m === 'pessoas' ? (pre ? { ativo: true, perfil: 'Acompanhamento', orgao: pre === '-' ? '' : pre } : { ativo: true }) : pre ? (m === 'entregas' ? { etapa: pre } : m === 'membros' ? Object.assign({ funcao: pre, inicio: iso(hoje()) }, preMembro ? preMembro.dados : {}) : m === 'presencas' ? { evento: pre } : { agricultor: pre }) : {}); ed = { m, id, convite: m === 'membros' && !id && preMembro ? preMembro.convite : null }; preMembro = null;
    const corpo = corpoForm(M, r, id);
    $('#frm').innerHTML = `<div class="fm-cab"><div><span class="fm-eye">${id ? 'Editar cadastro' : 'Novo cadastro'}</span><h2>${esc(M.um || M.novo)}</h2></div><button type="button" class="fm-x" data-fechar aria-label="Fechar">×</button></div>
     ${!id && IMPRIMIVEIS.includes(m) ? `<div class="imp-barra"><span>Vai aplicar no papel?</span><button type="button" class="b s" data-imprimir="${m}">Imprimir em branco</button></div>` : ''}
     <div class="fm-corpo">${M.oque && !id ? `<div class="fm-oque"><span>O que é</span><p>${esc(M.oque)}</p></div>` : ''}${M.campos.some(c => c[3] && c[2] !== 'sec' && c[2] !== 'check') ? '<p class="fm-obr"><span class="obr" aria-hidden="true">*</span> obrigatório</p>' : ''}${m === 'membros' ? '<div class="fm-faz" id="fm_faz" hidden></div>' : ''}${m === 'membros' && !id && pre ? (() => { const u = R.equipePorFuncao(db, pre, iso(hoje())).antigos[0]; return u ? `<p class="fm-sub">Substitui <b>${esc(u.nome)}</b>, desligada(o) em ${dt(u.fim)}. O histórico liga as duas pessoas.</p>` : ''; })() : ''}${corpo}</div>
     <div class="fm-pe"><div class="err" id="ferr" role="alert"></div><div class="frow"><button type="button" class="b" data-fechar>Cancelar</button>${m === 'visitas' && R.podeGravar(eu, 'fotos') ? (id ? `<button type="button" class="b" data-fotos="visitas:${esc(id)}">Fotos (${(db.fotos || []).filter(f => f.tabela === 'visitas' && f.registro === id).length})</button>` : '<button type="button" class="b" data-salvarfotos>Salvar e anexar fotos</button>') : ''}<button class="b p" id="fsalvar">Salvar</button></div></div>`;
    $('#frm').className = 'fm'; if (SQC.mascaras) SQC.mascaras.preparar($('#frm'));   // formata CPF e celular ANTES do retrato, senão abrir já contaria como alteração
    if (m === 'membros') ajustarFormMembro($('#frm'));
    ed.foto = fotoForm(); ed.avisado = false;
    if ($('#dlg').open) focarDlg(); else $('#dlg').showModal();
  }
  /* retrato do formulário: se mudou e a pessoa tenta fechar, avisa antes de jogar fora o que foi digitado */
  const fotoForm = () => JSON.stringify([...document.querySelectorAll('#frm input,#frm select,#frm textarea')].map(x => x.type === 'checkbox' ? x.checked : x.value));
  const perderia = () => !!ed && ed.foto !== undefined && fotoForm() !== ed.foto && !ed.avisado;
  const avisarPerda = () => { ed.avisado = true; const e = $('#ferr'); if (e) e.textContent = 'Há alterações que ainda não foram salvas. Para descartar, feche de novo; para guardar, use Salvar.'; };
  /* guarda no aparelho quando não há internet (só o que a equipe lança em campo; despesas e acessos exigem conexão) */
  async function enfileirar(m, r, op) {
    // se o registro já estava na fila, vale a origem da primeira vez (continua sendo inclusão, ou edição sobre a mesma versão lida)
    const ja = pend.find(p => p.id === SQC.fila.chave(m, r.id));
    const it = { id: SQC.fila.chave(m, r.id), tabela: m, dados: r, op: ja && ja.op ? ja.op : op, dono: eu.id, erro: '', reenviar: true };
    await SQC.fila.salvar(it); pend = await SQC.fila.listar(eu.id); aplicarFila();
  }
  function aplicarFila() {
    pend.forEach(p => { const r = Object.assign({}, p.dados, { _pendente: true, _erro: p.erro || '' }); const i = db[p.tabela].findIndex(x => x.id === r.id); if (i >= 0) db[p.tabela][i] = Object.assign({}, db[p.tabela][i], r); else db[p.tabela].push(r); });
  }
  async function gravarRegistro(m, r, ant) {
    const limpo = Object.assign({}, r); delete limpo._pendente; delete limpo._erro;
    try {
      const naFila = pend.find(p => p.id === SQC.fila.chave(m, r.id));
      const op = naFila && naFila.op ? naFila.op : { novo: !ant, base: ant ? ant.atualizado_em || null : null };
      const salvo = await api.salvar(m, limpo, op);
      const i = db[m].findIndex(x => x.id === salvo.id); if (i >= 0) db[m][i] = salvo; else db[m].push(salvo);
      await SQC.fila.remover(SQC.fila.chave(m, salvo.id)); pend = pend.filter(p => p.id !== SQC.fila.chave(m, salvo.id));
      if (eu && salvo.id === eu.id) eu = salvo;
      if (api.guardarCopia) api.guardarCopia(db);
      return { ok: true };
    } catch (e) {
      if (e.semRede && !demo() && !R.RESTRITAS.includes(m)) { await enfileirar(m, limpo, { novo: !ant, base: ant ? ant.atualizado_em || null : null }); return { ok: true, fila: true }; }
      if (e.message === R.MSG_CONFLITO || e.message === R.MSG_EXCLUIDO) atualizarPorBaixo();   // busca como ficou, para a pessoa conferir ao fechar
      return { ok: false, msg: e.message };
    }
  }
  async function aoSalvar(ev) {
    ev.preventDefault(); if (!ed) return; const depoisFotos = ed.depoisFotos; ed.depoisFotos = false;   // vale só para este envio (um erro de validação não deixa o pedido ligado)
    const { m, id } = ed, M = MOD[m], ant = id ? Object.assign({}, by(m, id)) : null, r = id ? Object.assign({}, ant) : { id: SQC.novoId() };
    const er = t => { $('#ferr').textContent = t; };
    if (m === 'membros' && ant && ant._sr) return er('Os dados pessoais desta pessoa (CPF, endereço…) não foram carregados, porque o sistema abriu sem internet. Para não apagá-los, feche, espere a conexão voltar e abra o cadastro de novo.');
    for (const [k, l, t, req] of M.campos) {
      if (t === 'sec' || t === 'html') continue;
      if (t === 'checks') { D.CHECK.forEach(c => { r[c[0]] = $('#f_' + c[0]).checked; }); continue; }
      if (t === 'geo') { const la = $('#f_lat').value, lo = $('#f_lng').value, pr = $('#f_precisao').value; r.lat = la === '' ? null : +la; r.lng = lo === '' ? null : +lo; r.precisao = la === '' || pr === '' ? null : +pr; continue; }
      const el = $('#f_' + k); if (!el) continue;   // campo que só existe na edição (desligamento)
      r[k] = t === 'check' ? el.checked : t === 'number' ? numCampo(el.value) : el.value.trim();
      if (t === 'number' && el.value !== '' && !(r[k] >= 0)) { er(`“${l}” precisa ser um número positivo, como 120 ou 120,50.`); el.focus(); return; }
      // cadastro antigo da equipe, de antes de CPF, celular e e-mail serem obrigatórios: pode ser editado sem eles (R.obrigatoriosMembro decide)
      const antigo = m === 'membros' && ant && ['cpf', 'telefone', 'email'].includes(k) && !String(ant[k] == null ? '' : ant[k]).trim();
      if (req && !antigo && (r[k] === '' || r[k] == null)) { er(`Preencha “${l}”.`); el.focus(); return; }
    }
    if (m === 'lotes' && !r.dias && r.dias !== 0) r.dias = (D.TIPOS[r.tipo] || [0, 30])[1];
    if (m === 'pessoas') r.email = r.email.toLowerCase();
    if (m === 'membros') R.normalizarMembro(r);
    const conviteAberto = ed.convite;
    const msg = R.validar(db, m, r, ant); if (msg) return er(msg);
    const b = $('#fsalvar'); b.disabled = true; b.textContent = 'Salvando…';
    const res = await gravarRegistro(m, r, ant);
    b.disabled = false; b.textContent = 'Salvar';
    if (!res.ok) return er(res.msg);
    if (conviteAberto) { try { await api.conviteEncerrar(conviteAberto, 'aprovado'); } catch (e) { toast('Cadastro gravado, mas o convite não foi encerrado: ' + e.message); } convites = undefined; }
    let acesso = '';
    if (m === 'membros' && !id && !res.fila && coord() && r.email) acesso = await criarAcessoDaFuncao(r);
    $('#dlg').close(); ed = null; render();
    if (acesso) return toast(acesso);
    if (depoisFotos && !res.fila) return abrirFotos(m, r.id, 'Visita salva. Agora tire ou escolha as fotos.');
    if (depoisFotos && res.fila) return toast('Sem internet: a visita ficou guardada neste aparelho. As fotos precisam de internet: anexe depois, pelo botão Fotos da visita.');
    if (res.fila) toast('Sem internet: guardado neste aparelho. Envia sozinho quando o sinal voltar.');
    else if (m === 'pessoas' && !id && !demo()) toast('Acesso criado. Avise a pessoa para abrir o sistema e usar “Primeiro acesso”.');
    else toast(id ? 'Alterações salvas.' : 'Registro salvo.');
  }

  /* foto de perfil da equipe (24): avatar com a foto quando houver; a imagem chega depois (pasta privada), por carregarFotosEq */
  const avatar = (m, cls) => `<span class="${cls || 'pc-av'}${m.foto ? ' com-foto' : ''}"${m.foto ? ` data-fotoeq="${esc(m.foto)}"` : ''} aria-hidden="true">${esc(iniciais(m.nome))}</span>`;
  const podeFoto = m => !!m && (coord() || (eu && R.nrm(eu.email) === R.nrm(m.email)));
  const botoesFoto = m => `<div class="foto-acts"><button type="button" class="b s" data-fotoeqtrocar="${esc(m.id)}">${m.foto ? 'Trocar a foto' : 'Pôr uma foto'}</button>${m.foto ? `<button type="button" class="b s" data-fotoeqtirar="${esc(m.id)}">Tirar a foto</button>` : ''}<span class="small">A foto aparece só para a equipe do projeto.</span></div>`;
  function carregarFotosEq() {
    document.querySelectorAll('[data-fotoeq]:not([data-fotook])').forEach(async el => {
      el.dataset.fotook = '1';
      try { const u = await api.fotoEquipe(el.dataset.fotoeq); if (el.isConnected) el.innerHTML = `<img src="${esc(u)}" alt="" width="64" height="64" decoding="async">`; }
      catch (e) { /* sem internet ou foto apagada: ficam as iniciais */ }
    });
  }
  function escolherFotoEq(id, b) {
    const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.hidden = true; document.body.appendChild(i);
    i.addEventListener('change', async () => { const f = i.files && i.files[0]; i.remove(); if (!f) return;
      const err = $('#ferr'); b.disabled = true; b.textContent = 'Enviando…';
      try { const blob = await SQC.fotodia.quadrada(f); const caminho = await api.trocarFotoEquipe(id, blob); const m = by('membros', id); if (m) m.foto = caminho; depoisFotoEq(id, 'Foto atualizada.'); }
      catch (e) { b.disabled = false; b.textContent = 'Trocar a foto'; if (err) err.textContent = e.semRede ? 'Sem internet: a foto precisa de conexão. Tente quando o sinal voltar.' : e.message; }
    }, { once: true });
    i.click();
  }
  async function tirarFotoEq(id, b) {
    b.disabled = true; try { await api.tirarFotoEquipe(id); const m = by('membros', id); if (m) m.foto = null; depoisFotoEq(id, 'Foto retirada.'); }
    catch (e) { b.disabled = false; const err = $('#ferr'); if (err) err.textContent = e.message; }
  }
  // volta à janela de onde veio (Meus dados ou a ficha) e redesenha a aba
  function depoisFotoEq(id, msg) { const meus = !!$('#frm.md'); render(); if (meus) abrirMeusDados({ msg }); else { abrirFichaMembro(id); const ok = $('#fok'); if (ok) ok.textContent = msg; } atualizarCabecalhoFoto(); }
  function atualizarCabecalhoFoto() { const m = meuMembro(), el = $('#quem-av'); if (!el || !eu) return;
    el.removeAttribute('data-fotook'); if (m && m.foto) { el.dataset.fotoeq = m.foto; el.classList.add('com-foto'); } else { delete el.dataset.fotoeq; el.classList.remove('com-foto'); el.textContent = iniciais(demo() ? eu.perfil : eu.nome); } }
  /* habilitação na FUNCERN (Arlo e termo): a coordenação e o auxiliar administrativo acompanham e marcam */
  const cuidaHab = () => coord() || auxiliar();
  const seloHab = m => m.arlo === 'Sim' && m.termo_em ? '<span class="chip ok">Habilitado(a) na FUNCERN</span>' : m.arlo === 'Sim' ? '<span class="chip f">Falta o termo</span>' : '<span class="chip f">Falta o Arlo</span>';
  const fmtCpf = c => { const d = R.soDigitos(c); return d.length === 11 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : esc(c || ''); };
  /* ficha de uma pessoa da equipe: só leitura, com as ações ao pé (no formato do Mulheres & Quintais) */
  function abrirFichaMembro(id) {
    const m = by('membros', id); if (!m) return; const F = FUNCOES.find(f => f[0] === m.funcao), hj = iso(hoje()), ativo = !m.fim || m.fim >= hj, res = cuidaHab();
    const l = (t, v) => v ? `<div><dt>${t}</dt><dd>${v}</dd></div>` : '', bloco = (t, h) => h.trim() ? `<section class="fi-s"><h3 class="fm-sec">${t}</h3><dl class="fi-dl">${h}</dl></section>` : '';
    const end = [m.logradouro, m.numero, m.complemento, m.bairro].filter(Boolean).map(esc).join(', ') + (m.cep ? ` · CEP ${esc(m.cep)}` : '') + (m.uf ? ` · ${esc(m.uf)}` : '');
    const perf = [['agricultor', 'É agricultor(a)'], ['atua_af', 'Atua com agricultura familiar'], ['zona_rural', 'Mora na zona rural'], ['celular_internet', 'Celular com internet']].filter(([k]) => m[k]).map(([k, t]) => `${t}: ${esc(m[k])}`).join(' · ');
    ed = null; $('#frm').className = 'fm';
    $('#frm').innerHTML = `<div class="fm-cab"><div><span class="fm-eye">${esc(NOME_FUNCAO[m.funcao] || 'Equipe')}</span><h2>${esc(m.nome)}</h2></div><button type="button" class="fm-x" data-fechar aria-label="Fechar">×</button></div>
     <div class="fm-corpo fi"><div class="fi-top">${avatar(m)}<div><span class="chip ${ativo ? 'ok' : ''}">${ativo ? (m.fim ? 'Sai em ' + dt(m.fim) : 'Na equipe') : 'Desligado(a) em ' + dt(m.fim)}</span>${res ? seloHab(m) : ''}${F ? `<p class="small">${esc(F[4])}</p>` : ''}</div></div>
      ${podeFoto(m) ? botoesFoto(m) : ''}
      ${bloco('Contato', l('E-mail (login)', esc(m.email)) + l('Celular', esc(m.telefone)) + l('Município', esc(m.municipio)))}
      ${bloco('Vínculo', l('Nome social', esc(m.nome_social)) + l('Instituição ou curso', esc(m.vinculo)) + l('Organização', esc(m.organizacao)) + l('SIAPE', esc(m.siape)))}
      ${bloco('Bolsa', l('Início', dt(m.inicio)) + l('Desligamento', m.fim ? dt(m.fim) + (m.motivo ? ' · ' + esc(m.motivo) : '') : '') + l('Outra bolsa hoje', esc(m.outra_bolsa)))}
      ${res ? bloco('Habilitação na FUNCERN', l('Cadastro no Arlo', esc(m.arlo || 'não informado')) + l('Termo assinado em', m.termo_em ? dt(m.termo_em) : 'ainda não')) : ''}
      ${res ? bloco('Dados para o cadastro no Arlo (reservados)', l('CPF', m.cpf ? fmtCpf(m.cpf) : '') + l('PIS/NIS', esc(m.pis)) + l('Nascimento', m.nascimento ? dt(m.nascimento) : '') + l('Endereço', end)) : ''}
      ${['discente', 'formador'].includes(m.funcao) && perf ? bloco('Perfil no campo', l('Respostas', perf) + l('Experiência', esc(m.experiencia))) : ''}
      ${coord() ? bloco('Questionário socioeconômico', l('Respondeu', m.socio ? 'Sim (só a coordenação vê as respostas, no formulário de edição)' : 'Não')) : ''}</div>
     <div class="fm-pe"><div class="err" id="ferr" role="alert"></div><div class="ok-msg" id="fok" role="status"></div><div class="frow"><button type="button" class="b" data-fechar>Fechar</button>${res ? `<button type="button" class="b" data-habilitar="${esc(m.id)}">Marcar habilitação</button>` : ''}${R.podeGravar(eu, 'membros') ? `<button type="button" class="b p" data-edit="membros:${esc(m.id)}">Editar cadastro</button>` : ''}</div></div>`;
    if ($('#dlg').open) focarDlg(); else $('#dlg').showModal();
    carregarFotosEq();
  }
  function abrirHabilitacao(id, msg) {
    const m = by('membros', id); if (!m) return; ed = null; $('#frm').className = 'fm'; hab = { id, base: m.atualizado_em };
    $('#frm').innerHTML = `<div class="fm-cab"><div><span class="fm-eye">Habilitação na FUNCERN</span><h2>${esc(m.nome)}</h2></div><button type="button" class="fm-x" data-fechar aria-label="Fechar">×</button></div>
     <div class="fm-corpo"><div class="fm-oque"><span>O que marcar</span><p>Quando a FUNCERN confirmar o cadastro da pessoa no Arlo, marque “Sim”. Quando o termo de compromisso estiver assinado, informe a data. Só esses dois dados mudam aqui; o resto do cadastro é da coordenação.</p></div>
      <div class="fields"><div class="fld"><label for="h_arlo">Cadastro no Arlo</label><select id="h_arlo">${[['', '—'], ['Sim', 'Sim'], ['Não', 'Não']].map(o => `<option value="${o[0]}" ${String(m.arlo || '') === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select></div>
       <div class="fld"><label for="h_termo">Termo assinado em</label><input id="h_termo" type="date" value="${esc(m.termo_em || '')}"></div></div></div>
     <div class="fm-pe"><div class="err" id="ferr" role="alert">${msg ? esc(msg) : ''}</div><div class="frow"><button type="button" class="b" data-fichamembro="${esc(id)}">Voltar</button><button type="button" class="b p" data-habsalvar>Salvar</button></div></div>`;
    if ($('#dlg').open) focarDlg(); else $('#dlg').showModal();
  }
  let hab = null;
  async function salvarHabilitacao(b) {
    if (!hab) return; const arlo = $('#h_arlo').value, termo = $('#h_termo').value;
    if (termo && termo > iso(hoje())) return void ($('#ferr').textContent = 'A data do termo não pode ser no futuro.');
    b.disabled = true; b.textContent = 'Salvando…';
    try { const r = await api.habilitar(hab.id, arlo, termo, hab.base); const m = by('membros', hab.id); if (m) Object.assign(m, r); const id = hab.id; hab = null; abrirFichaMembro(id); render(); toast('Habilitação salva.'); }
    catch (e) { b.disabled = false; b.textContent = 'Salvar'; $('#ferr').textContent = e.message; }
  }
  /* acesso ao sistema de quem entra na equipe: o perfil vem da função (auxiliar e formador(a) têm perfil próprio) */
  const PERFIL_DA_FUNCAO = { coordenacao: 'Coordenação', auxiliar: 'Auxiliar', discente: 'Equipe', formador: 'Formador' };
  async function criarAcessoDaFuncao(r) {
    const email = String(r.email).trim().toLowerCase(), ja = db.pessoas.find(p => String(p.email || '').toLowerCase() === email);
    if (ja) return ja.perfil === PERFIL_DA_FUNCAO[r.funcao] ? 'Cadastro salvo. Esta pessoa já tinha acesso ao sistema.' : `Cadastro salvo. Esta pessoa já tem acesso como ${R.NOME_PERFIL[ja.perfil] || ja.perfil}: se precisar, mude o perfil em Dados › Pessoas com acesso.`;
    const p = { id: SQC.novoId(), nome: r.nome, email, perfil: PERFIL_DA_FUNCAO[r.funcao] || 'Equipe', ativo: true };
    const res = await gravarRegistro('pessoas', p, null);
    return res.ok ? `Cadastro salvo e acesso criado, com o perfil ${R.NOME_PERFIL[p.perfil]}. Avise a pessoa para abrir o sistema e usar “Primeiro acesso” com o e-mail ${email}.` : 'Cadastro salvo, mas o acesso não foi criado: ' + res.msg;
  }
  /* ---------- planilhas e cópia ---------- */
  function csv(m) {
    const M = MOD[m], cs = M.campos.filter(c => c[2] !== 'checks' && c[2] !== 'sec' && c[2] !== 'html'), q = s => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
    // texto que começa com = + - @ vira fórmula no Excel: um apóstrofo na frente desarma
    // (número negativo, como -5 ou -12,50, fica número)
    const seguro = v => typeof v === 'string' && /^[=+\-@\t\r\n]/.test(v) && !/^-\d+(,\d+)?$/.test(v) ? "'" + v : v;
    const val = (c, r) => c[2] === 'geo' ? (r.lat != null && r.lat !== '' ? `${r.lat}; ${r.lng}${r.precisao != null ? ' (±' + r.precisao + ' m)' : ''}` : '') : c[2] === 'ref' ? (by(c[4], r[c[0]]) ? rotulo[c[4]](by(c[4], r[c[0]])) : '') : c[2] === 'check' ? (r[c[0]] ? 'Sim' : 'Não') : c[0] === 'rubrica' ? nomeRubrica(r[c[0]]) : c[0] === 'item' && m === 'despesas' ? ((D.DESEMBOLSO.itens.find(i => i.id === r.item) || { nome: '' }).nome) : typeof r[c[0]] === 'number' ? String(r[c[0]]).replace('.', ',') : r[c[0]];
    const head = [...(m === 'lotes' ? ['Código'] : []), ...cs.map(c => c[1]), ...(m === 'unidades' ? D.CHECK.map(c => c[1]) : []), ...(m === 'lotes' ? ['Saldo'] : [])];
    const lin = db[m].filter(r => !r._pendente).map(r => [...(m === 'lotes' ? [r.codigo] : []), ...cs.map(c => val(c, r)), ...(m === 'unidades' ? D.CHECK.map(c => r[c[0]] ? 'Sim' : 'Não') : []), ...(m === 'lotes' ? [String(saldo(r)).replace('.', ',')] : [])].map(seguro).map(q).join(';'));
    return '﻿' + [head.map(q).join(';'), ...lin].join('\r\n');
  }
  function baixar(nome, txt, tipo) {
    try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type: tipo })); a.download = nome; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); toast('Arquivo gerado: ' + nome); }
    catch (e) { toast('Este navegador não deixou baixar o arquivo.'); }
  }

  /* ---------- entrada no sistema ---------- */
  const EXP = 'Sessão encerrada após 15 minutos sem uso. Entre de novo para continuar.';
  /* ---------- tela de entrada ---------- */
  const IC_OLHO = '<svg class="o1" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg><svg class="o2" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18M10.6 5.1A10.6 10.6 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6C3.7 8.5 2 12 2 12s3.6 7 10 7c1.7 0 3.2-.5 4.5-1.200M9.9 9.900a3 3 0 0 0 4.2 4.2"/></svg>';
  const IC_ERRO = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.500v.01"/></svg>';
  const IC_SETA = '<svg class="seta" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  /* campo da entrada: rótulo ligado ao campo, mensagem de erro própria (ligada por aria-describedby quando aparece) e, na senha, botão de mostrar */
  const campoA = (id, rotulo, tipo, ac) => `<div class="cp"><label for="${id}">${rotulo}</label><div class="cp-c">
    <input id="${id}" name="${id}" type="${tipo}" autocomplete="${ac}" required${tipo === 'email' ? ' inputmode="email" autocapitalize="none" spellcheck="false" placeholder="seu@email.com" maxlength="254"' : ''}>${tipo === 'password' ? `<button type="button" class="cp-olho" data-olho="${id}" aria-label="Mostrar senha" aria-pressed="false">${IC_OLHO}</button>` : ''}</div>
    <p class="cp-e" id="e_${id}" hidden></p></div>`;
  const avisoA = (msg, ok) => `<p class="ac-erro" id="aerr" role="alert"${msg ? '' : ' hidden'}>${msg ? IC_ERRO + '<span>' + esc(msg) + '</span>' : ''}</p><p class="ac-ok" id="aok" role="status"${ok ? '' : ' hidden'}>${esc(ok || '')}</p>`;
  function painelAcesso(msg, ok) {
    const esq = authModo === 'esqueci', pri = authModo === 'primeiro';
    const intro = pri ? '<p class="ent-p">Para quem a coordenação já cadastrou e ainda não tem senha. Informe o seu e-mail: você recebe um link, toca nele e cria a senha na tela que abrir.</p>' : '';
    const campos = pri ? campoA('a_email', 'Seu e-mail (o mesmo que a coordenação cadastrou)', 'email', 'username') : esq ? campoA('a_email', 'Seu e-mail', 'email', 'username') : campoA('a_email', 'E-mail', 'email', 'username') + campoA('a_senha', 'Senha', 'password', 'current-password');
    return `<form id="fauth" novalidate>${intro}${campos}${avisoA(msg, ok)}<button class="bt" id="abotao"><span>${pri ? 'Enviar o link' : esq ? 'Enviar o e-mail' : 'Entrar'}</span>${IC_SETA}</button></form>
     <div class="ent-links">${esq ? '<button type="button" class="lk" data-auth="entrar">Voltar para a entrada</button>' : '<button type="button" class="lk" data-auth="esqueci">Esqueci a senha</button>'}
      <button type="button" id="aj_entrada" class="ent-aj-b" data-ajudaentrada aria-haspopup="dialog"><i aria-hidden="true">?</i>Precisa de ajuda para entrar?</button></div>`;
  }
  /* painel "Como entrar no sistema" (14/10/2026, no formato da ajuda do Mulheres & Quintais, com o caminho deste sistema:
     o primeiro acesso e a senha esquecida chegam por LINK NO E-MAIL). O WhatsApp da coordenação só aparece se estiver
     em SQC.CONFIG.contato = { tel: '(84) 9 0000-0000', wa: '5584900000000' } (config.js): sem ele, o painel indica falar com a coordenação. */
  function abrirAjudaEntrada() {
    const c = (SQC.CONFIG && SQC.CONFIG.contato) || {}, wa = String(c.wa || '').replace(/\D/g, ''), tel = String(c.tel || '').trim();
    const tarefas = [
      ['Entrar pela primeira vez', ['Abra o endereço do sistema no <b>Chrome</b> (Android) ou no <b>Safari</b> (iPhone e iPad).', 'Toque em <b>Primeiro acesso</b>.', 'Digite o e-mail que a coordenação cadastrou e toque em <b>Enviar o link</b>.', 'Abra a mensagem que chegar no seu e-mail (confira também o spam e a aba Promoções) e toque no link.', 'Na tela que abrir, crie uma senha com pelo menos 8 caracteres, repita e toque em <b>Guardar a senha e entrar</b>.']],
      ['Entrar nas próximas vezes', ['Toque em <b>Já tenho senha</b>.', 'Digite o e-mail e a senha.', 'Toque em <b>Entrar</b>.']],
      ['Esqueci a senha', ['Toque em <b>Esqueci a senha</b>.', 'Digite o seu e-mail e toque em <b>Enviar o e-mail</b>.', 'Abra a mensagem, toque no link e crie outra senha. O que você já registrou no sistema não se perde.']]
    ];
    const antes = ['Abra o link do e-mail no mesmo aparelho em que vai usar o sistema. Se ele abrir dentro do aplicativo de e-mail, use o menu desse aplicativo para abrir no Chrome ou no Safari.', 'Para usar como aplicativo, no menu do navegador toque em <b>Adicionar à tela inicial</b>. Depois de entrar com internet, dá para registrar no campo sem sinal.', 'No sol forte, toque em <b>Modo sol</b>, no cartão de acesso: letra preta em fundo branco e maior.'];
    const duvidas = [
      ['O e-mail com o link não chegou.', 'Espere alguns minutos e confira o spam e a aba Promoções. Veja se o e-mail foi digitado exatamente como a coordenação cadastrou. Peça o link uma vez só: pedidos seguidos são bloqueados por alguns minutos. Se não chegar, fale com a coordenação.'],
      ['Aparece “O link que você abriu já foi usado ou venceu”.', 'Cada link vale uma vez só e por pouco tempo. Peça outro em Primeiro acesso (ou em Esqueci a senha, se você já tinha senha) e use o link mais recente.'],
      ['Aparece “Este e-mail não tem acesso ativo ao sistema”.', 'O e-mail não está cadastrado ou o acesso foi desligado. Fale com a coordenação do projeto.'],
      ['Aparece “E-mail ou senha incorretos”.', 'Confira o e-mail e a senha (letra maiúscula conta). Se não lembrar a senha, use Esqueci a senha.'],
      ['Aparece “Este e-mail já tem senha criada”.', 'Você já fez o primeiro acesso. Use Já tenho senha ou, se não lembrar, Esqueci a senha.'],
      ['Quero ver a senha que estou digitando.', 'Toque no olho, dentro do campo da senha. Toque de novo para esconder. Use quando ninguém estiver olhando a sua tela.'],
      ['O sistema saiu sozinho.', 'Depois de 15 minutos sem uso ele sai, para proteger os dados. Entre de novo: neste aparelho ele volta para a mesma aba em que você estava.'],
      ['Quero trocar a minha senha.', 'Depois de entrar, toque no seu nome, no alto da tela (Meus dados), e abra “Trocar minha senha”.']
    ];
    ed = null; $('#frm').className = 'fm aj-ent';
    $('#frm').innerHTML = `<div class="fm-cab"><div><span class="fm-eye">Ajuda</span><h2>Como entrar no sistema</h2></div><button type="button" class="fm-x" data-fechar aria-label="Fechar">×</button></div>
     <div class="fm-corpo"><p class="aj-intro">Só entra quem a coordenação do projeto cadastrou, com o e-mail que ela registrou. Na primeira vez, o sistema manda para esse e-mail um link: é por ele que você cria a sua senha.</p>
      <div class="aj-ct"><p>Não conseguiu entrar? Fale com a coordenação do projeto${wa && tel ? ':' : '.'}</p>${wa && tel ? `<a class="aj-wa" href="https://wa.me/${esc(wa)}" target="_blank" rel="noopener">WhatsApp ${esc(tel)}</a>` : ''}</div>
      <h3 class="fm-sec">Passo a passo</h3><div class="aj-dd">${tarefas.map(([t, l], i) => `<details${i === 0 ? ' open' : ''}><summary>${esc(t)}</summary><ol>${l.map(x => `<li>${x}</li>`).join('')}</ol></details>`).join('')}</div>
      <h3 class="fm-sec">Antes de entrar</h3><ul class="aj-ul">${antes.map(x => `<li>${x}</li>`).join('')}</ul>
      <h3 class="fm-sec">Dúvidas comuns</h3><div class="aj-dd">${duvidas.map(([q, r]) => `<details><summary>${esc(q)}</summary><p>${esc(r)}</p></details>`).join('')}</div></div>
     <div class="fm-pe"><div class="frow"><button type="button" class="b p" data-fechar>Entendi</button></div></div>`;
    if ($('#dlg').open) $('#frm .fm-x').focus(); else $('#dlg').showModal();
  }
  /* cabeçalho do cartão de acesso conforme o caminho (14/10/2026: "Esqueci a senha" ganhou título próprio, como no Mulheres & Quintais) */
  const CAB_ACESSO = { esqueci: ['Esqueci a senha', 'Criar uma senha nova', 'Digite o e-mail do seu cadastro. Chega uma mensagem com um link: toque nele e crie outra senha. O que você já registrou no sistema não se perde.'],
    nova: ['Senha nova', 'Crie a sua senha', 'E-mail confirmado. Agora crie a senha que você vai usar para entrar.'] };
  function cabAcesso() { const c = CAB_ACESSO[authModo] || ['Área de acesso', 'Que bom ver você', 'Entre com o e-mail cadastrado pela coordenação.']; $('#authey').textContent = c[0]; $('#autht').textContent = c[1]; $('#authsub').textContent = c[2]; }
  function telaAcesso(msg, ok) {
    $('#carregando').hidden = true; $('#app').hidden = true; $('#auth').hidden = false; if (!demo()) cabAcesso();
    if (demo()) {
      $('#authsub').textContent = 'Modo demonstração: os dados ficam só neste navegador e os registros marcados como “exemplo” são fictícios.';
      $('#authcorpo').innerHTML = `<p class="ent-p">Escolha com qual perfil quer ver o sistema.</p><div class="ent-demo"><button class="bt" data-demo="Coordenação"><span>Entrar como Coordenação</span>${IC_SETA}</button><button class="bt sec" data-demo="Equipe"><span>Entrar como Equipe (bolsistas)</span></button><button class="bt sec" data-demo="Auxiliar"><span>Entrar como Auxiliar administrativo</span></button><button class="bt sec" data-demo="Formador"><span>Entrar como Formador(a)</span></button><button class="bt sec" data-demo="Acompanhamento"><span>Entrar como SEAB/MDA</span></button></div>${avisoA(msg, ok)}`;
      return;
    }
    if (authModo === 'nova') {
      $('#authcorpo').innerHTML = `<form id="fauth" novalidate>${campoA('a_senha', 'Senha nova (mínimo 8 caracteres)', 'password', 'new-password')}${campoA('a_senha2', 'Repita a senha', 'password', 'new-password')}${avisoA(msg, ok)}<button class="bt" id="abotao"><span>Guardar a senha e entrar</span>${IC_SETA}</button></form>`;
      return;
    }
    /* "Já tenho senha | Primeiro acesso" troca o painel logo abaixo: é um conjunto de abas (Tab para nas duas opções; Enter, Espaço ou setas trocam) */
    const sel = authModo === 'primeiro' ? 1 : 0, aba = (m, i, t) => `<button type="button" role="tab" id="tab_${m}" aria-controls="painel_acesso" aria-selected="${sel === i}" data-auth="${m}">${t}</button>`;
    $('#authcorpo').innerHTML = `${authModo === 'esqueci' ? '' : `<div class="sg" role="tablist" aria-label="Forma de acesso" data-sel="${sel}">${aba('entrar', 0, 'Já tenho senha')}${aba('primeiro', 1, 'Primeiro acesso')}</div>`}
     <div id="painel_acesso"${authModo === 'esqueci' ? '' : ` role="tabpanel" aria-labelledby="tab_${authModo}"`}>${painelAcesso(msg, ok)}</div>`;
  }
  /* troca entre "Já tenho senha" e "Primeiro acesso" sem redesenhar o seletor (o destaque desliza e o foco fica onde estava) */
  function trocarModo(m, focar) {
    const sg = $('.sg');
    if (!sg || !['entrar', 'primeiro'].includes(m) || !['entrar', 'primeiro'].includes(authModo)) { authModo = m; telaAcesso(''); const alvo = m === 'esqueci' ? $('#a_email') : $('#tab_' + m); if (focar && alvo) alvo.focus(); return; }
    authModo = m; const sel = m === 'primeiro' ? 1 : 0; sg.dataset.sel = sel;
    sg.querySelectorAll('[role="tab"]').forEach((b, i) => { b.setAttribute('aria-selected', i === sel); });
    const pn = $('#painel_acesso'); pn.setAttribute('aria-labelledby', 'tab_' + m); pn.innerHTML = painelAcesso('');
    if (focar) $('#tab_' + m).focus();
  }
  function erroCampo(id, msg) {
    const el = $('#' + id), p = $('#e_' + id); if (!el || !p) return; el.setAttribute('aria-invalid', 'true'); el.setAttribute('aria-describedby', 'e_' + id);
    p.innerHTML = IC_ERRO + '<span>' + esc(msg) + '</span>'; p.hidden = false; el.closest('.cp').classList.add('erro');
  }
  function limparErros() {
    document.querySelectorAll('#fauth [aria-invalid]').forEach(el => { el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby'); });
    document.querySelectorAll('#fauth .cp').forEach(c => c.classList.remove('erro')); document.querySelectorAll('#fauth .cp-e').forEach(p => { p.hidden = true; p.textContent = ''; });
    const a = $('#aerr'); if (a) { a.hidden = true; a.textContent = ''; } const o = $('#aok'); if (o) { o.hidden = true; o.textContent = ''; }
  }
  async function aoEntrar(ev) {
    ev.preventDefault(); const g = id => ($('#' + id) || { value: '' }).value; limparErros();
    const email = g('a_email').trim().toLowerCase(), pw = g('a_senha'), b = $('#abotao'), rot = b.querySelector('span').textContent, erros = [];
    if (authModo !== 'nova' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) erros.push(['a_email', email ? 'Este e-mail não parece completo. Confira se tem @ e o final (por exemplo, .br).' : 'Informe o seu e-mail.']);
    if (authModo === 'nova') { if (pw.length < 8) erros.push(['a_senha', 'A senha precisa de pelo menos 8 caracteres.']); else if (pw !== g('a_senha2')) erros.push(['a_senha2', 'As duas senhas não são iguais.']); }
    if (authModo === 'entrar' && !pw) erros.push(['a_senha', 'Informe a senha.']);
    if (erros.length) { erros.forEach(e => erroCampo(e[0], e[1])); $('#' + erros[0][0]).focus(); return; }   // o foco vai para o primeiro campo com problema
    b.disabled = true; b.setAttribute('aria-busy', 'true'); b.querySelector('span').textContent = 'Aguarde…';
    try {
      if (authModo === 'entrar') { eu = await api.entrar(email, pw); return await aposEntrar(); }
      if (authModo === 'primeiro') {
        await api.primeiroAcesso(email);
        authModo = 'entrar'; telaAcesso('', 'Se esse e-mail foi cadastrado pela coordenação, o link já foi enviado. Abra a mensagem (confira o spam), toque no link e crie a sua senha.'); $('#tab_entrar').focus(); return;
      }
      if (authModo === 'esqueci') { await api.esqueci(email); authModo = 'entrar'; telaAcesso('', 'Se esse e-mail tem acesso, a mensagem com o link já foi enviada. Confira também a caixa de spam.'); $('#tab_entrar').focus(); return; }
      if (authModo === 'nova') { await api.trocarSenha(pw); authModo = 'entrar'; try { history.replaceState(null, '', location.pathname); } catch (x) {} eu = await api.eu(true); if (eu) return await aposEntrar(); await api.sair(); return telaAcesso('Este e-mail não tem acesso ativo ao sistema. Fale com a coordenação.'); }
    } catch (e) {
      // erro do servidor (e-mail ou senha incorretos, sem conexão): mensagem com ícone e texto, ligada ao campo, e o foco volta para ele
      b.disabled = false; b.removeAttribute('aria-busy'); b.querySelector('span').textContent = rot;
      const a = $('#aerr'); a.innerHTML = IC_ERRO + '<span>' + esc(e.message) + '</span>'; a.hidden = false;
      const alvo = $('#a_senha') || $('#a_email'); if (alvo) { alvo.setAttribute('aria-invalid', 'true'); alvo.setAttribute('aria-describedby', 'aerr'); alvo.focus(); if (alvo.select) alvo.select(); }
    }
  }
  /* sair e entrar de novo (trazido do Mulheres & Quintais, v261): ao sair (botão, 15 minutos sem uso ou fechar a página) guarda a aba e a
     altura da tela de QUEM saiu; se a MESMA pessoa entrar de novo neste aparelho em até 7 dias, volta para o mesmo lugar. Outra pessoa
     começa do início. Só o nome da aba e a altura: nenhum dado do projeto. */
  const CHAVE_VOLTAR = 'sqc-voltar';
  const guardarLugar = () => { try { if (eu && eu.id && !real) localStorage.setItem(CHAVE_VOLTAR, JSON.stringify({ quem: eu.id, aba: tab, y: Math.round(window.scrollY || 0), em: Date.now() })); } catch (e) { /* aparelho bloqueia */ } };
  function voltarAoLugar() {
    let v = null; try { v = JSON.parse(localStorage.getItem(CHAVE_VOLTAR) || 'null'); localStorage.removeItem(CHAVE_VOLTAR); } catch (e) { v = null; }
    if (!v || !eu || v.quem !== eu.id || !(Date.now() - v.em < 7 * 864e5) || !abas().some(t => t[0] === v.aba)) { if (v && eu && v.quem !== eu.id) tab = 'painel'; return 0; }   // outra pessoa: começa do início
    tab = v.aba; return +v.y > 0 ? +v.y : 0;
  }
  async function aposEntrar() {
    $('#auth').hidden = true; $('#carregando').hidden = false; $('#carregando-txt').textContent = 'Carregando os dados…';
    try { await recarregarDb(); }
    catch (e) { $('#carregando').hidden = true; eu = null; return telaAcesso(e.message); }
    D.TABELAS.forEach(t => { if (!Array.isArray(db[t])) db[t] = []; });
    pend = demo() ? [] : await SQC.fila.listar(eu.id); aplicarFila(); hist = null;
    $('#carregando').hidden = true; $('#app').hidden = false;
    const y = location.hash && TABS.some(x => x[0] === location.hash.slice(1)) ? 0 : voltarAoLugar();   // link com a aba no endereço vale mais
    if (!abas().some(t => t[0] === tab)) tab = 'painel';
    render(); if (y) requestAnimationFrame(() => window.scrollTo(0, y));
    if (!demo()) { SQC.sessao.tocar(true); SQC.sessao.iniciar({ ativo: () => !!eu, aoVencer: () => sair(EXP), temConexao: () => api.temConexao() }); sincronizar(); }
  }
  async function sair(msg) {
    guardarLugar();   // antes de esquecer a aba: a mesma pessoa volta para cá quando entrar de novo
    Object.keys(urlsFoto).forEach(k => { URL.revokeObjectURL(urlsFoto[k]); delete urlsFoto[k]; });
    if ($('#dlg').open) $('#dlg').close();
    try { await api.sair(); } catch (e) { /* segue */ }
    if (SQC.sessao) { SQC.sessao.parar(); SQC.sessao.esquecer(); }
    eu = null; db = null; real = null; hist = null; convites = undefined; filas = undefined; acessos = undefined; prUlt = {}; imp = null; tab = 'painel'; $('#view').innerHTML = ''; authModo = 'entrar'; telaAcesso(msg || '');   // a aba de quem saiu fica guardada à parte (guardarLugar)   // nada de quem saiu fica para a próxima pessoa
  }
  /* envia o que ficou guardado no aparelho e busca o que os outros lançaram */
  let sincronizando = false, espera = null;
  async function atualizarPorBaixo() { try { espera = { db: await api.carregar(), pend: demo() ? [] : await SQC.fila.listar(eu.id) }; } catch (e) { /* fica como está */ } }
  function aplicarEspera() { if (!espera || !eu) return; trocarDb(espera.db); pend = espera.pend; espera = null; aplicarFila(); render(); }
  /* "falta enviar" (script 14): com internet, o aparelho informa só a contagem do que guarda sem enviar. A coordenação vê na Visão geral. */
  const aparelho = () => { let a = ''; try { a = localStorage.getItem('sqc-aparelho') || ''; if (!a) { a = SQC.novoId(); localStorage.setItem('sqc-aparelho', a); } } catch (e) { a = a || 'sem-armazenamento'; } return a; };
  async function informarFila() {
    if (!eu || demo() || fora() || !api.informarFila || navigator.onLine === false) return;
    const desde = pend.length ? new Date(Math.min(...pend.map(p => p.criado || Date.now()))).toISOString() : null;
    try { await api.informarFila(aparelho(), pend.length, pend.filter(p => p.erro).length, desde); } catch (e) { /* é só aviso: não atrapalha */ }
  }
  let filas;   // undefined = ainda não carregou; null = o banco não tem (falta o script 14)
  async function carregarFilas() { try { filas = await api.listarFila(); } catch (e) { filas = []; } if (tab === 'painel') render(); }
  function faltaEnviar() {
    if (!coord() || real) return '';
    if (filas === undefined) { filas = []; carregarFilas(); return ''; }
    if (!filas || !filas.length) return '';
    const dias = d => Math.floor((Date.now() - new Date(d).getTime()) / 864e5);
    return `<section class="panel fe" aria-label="Lançamentos que ainda não foram enviados"><div class="fe-cab"><h2>Falta enviar</h2><p>Lançamentos feitos sem internet que ainda estão guardados no celular de alguém. O sistema sabe só quantos são, não o que são.</p></div>
      <ul class="fe-l">${filas.map(f => { const d = f.desde ? dias(f.desde) : 0, velho = d >= 2;
        return `<li class="${velho ? 'velho' : ''}"><b>${esc(f.nome)}</b>${f.ex ? exChip(f) : ''}<span>${f.quantos} lançamento${f.quantos === 1 ? '' : 's'} guardado${f.quantos === 1 ? '' : 's'}${f.recusados ? ` · <b>${f.recusados} recusado${f.recusados === 1 ? '' : 's'} pelo servidor</b>` : ''}</span>
          <small>${f.desde ? (d === 0 ? 'desde hoje' : `há ${d} dia${d === 1 ? '' : 's'}`) : ''}${velho ? ' · peça para a pessoa abrir o sistema com internet' : ''}</small></li>`; }).join('')}</ul></section>`;
  }
  async function sincronizar(avisar) {
    if (!eu || demo()) return;
    if (sincronizando) { if (avisar) toast('Já estou enviando. Aguarde.'); return; }
    if (navigator.onLine === false) { if (avisar) toast('Ainda sem internet.'); return; }
    document.querySelectorAll('[data-sinc]').forEach(b => { b.disabled = true; b.textContent = 'Enviando…'; });
    sincronizando = true;
    try {
      const r = await SQC.fila.sincronizar(api, eu.id);
      // só busca tudo de novo se algo foi enviado, se abriu com a cópia do aparelho ou se a pessoa pediu: logo depois de entrar
      // os dados acabaram de chegar, e baixar tudo outra vez dobrava o tempo e o consumo de internet (auditoria de 14/10)
      const precisa = r.enviados || r.erros || api.offline || avisar;
      const novo = precisa ? await api.carregar() : null; const fila = await SQC.fila.listar(eu.id);
      if (novo) { if ($('#dlg').open) { espera = { db: novo, pend: fila }; }   // não troca os dados por baixo de um formulário aberto: aplica quando ele fechar
        else { trocarDb(novo); pend = fila; aplicarFila(); render(); } }
      informarFila(); if (coord()) filas = undefined;   // a lista da coordenação busca de novo na próxima vez que o painel aparecer
      const resta = (await SQC.fila.listar(eu.id)).filter(p => !p.erro).length;
      if (r.enviados) toast(r.enviados + ' lançamento(s) enviado(s).' + (resta ? ` ${resta} continuam guardados: o servidor não respondeu a tempo.` : ''));
      else if (avisar) toast(resta ? `O servidor não respondeu: ${resta} lançamento(s) continuam guardados neste aparelho. Tento de novo sozinho.` : r.erros ? 'Há lançamento que o servidor não aceitou. Corrija ou descarte.' : 'Nada para enviar.');
    } catch (e) { if (avisar) toast(e.message); }
    finally { sincronizando = false; }
  }
  function pedirSenhaNova() { authModo = 'nova'; eu = null; $('#app').hidden = true; telaAcesso(''); }

  /* ---------- cliques ---------- */
  async function aoClicar(ev) {
    const t = ev.target.closest('button,label,g[data-mapamun]'); if (!t) return; const d = t.dataset;
    if (!t.closest('dialog')) { const k = chaveFoco(t); if (k) gatilho = k; }
    if (d.auth) trocarModo(d.auth, true);
    else if (d.olho) { const c = $('#' + d.olho), mostrar = c.type === 'password'; c.type = mostrar ? 'text' : 'password'; t.setAttribute('aria-pressed', mostrar); t.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha'); }
    else if (d.demo) { try { eu = await api.entrarDemo(d.demo); await aposEntrar(); } catch (e) { telaAcesso(e.message); } }
    else if (d.tab) { tab = d.tab; try { localStorage.setItem('sqc-aba', tab); } catch (e) {} render(); window.scrollTo(0, 0); }
    else if (d.sair !== undefined) { if (pend.length && !d.ok) { d.ok = 1; t.classList.add('conf'); toast(`Há ${pend.length} lançamento(s) guardado(s) neste aparelho ainda não enviado(s). Eles ficam guardados e sobem na sua próxima entrada com internet. Toque em sair de novo para confirmar.`); return; } delete d.ok; t.classList.remove('conf'); sair(''); }
    else if (d.ajuda !== undefined) abrirAjuda();
    else if (d.relatar !== undefined) abrirRelato();
    else if (d.relatook !== undefined) await gerarRelato(t);
    else if (d.mapa) { const y = window.scrollY; mapaUF = d.mapa; mapaMun = ''; render(); window.scrollTo(0, y); }
    else if (d.mapamun !== undefined) { const y = window.scrollY, antes = mapaMun; mapaMun = d.mapamun === mapaMun ? '' : d.mapamun; render(); window.scrollTo(0, y);
      // abriu: o foco vai para os dados do município; fechou: volta para o círculo de onde veio
      const alvo = mapaMun ? document.querySelector('.mp-det') : document.querySelector(`g[data-mapamun="${CSS.escape(antes)}"]`) || document.querySelector(`[data-mapamun="${CSS.escape(antes)}"]`);
      if (alvo) { if (mapaMun) alvo.setAttribute('tabindex', '-1'); alvo.focus({ preventScroll: true }); if (mapaMun && window.innerWidth < 720) alvo.scrollIntoView({ block: 'nearest' }); } }
    else if (d.expl) { const x = document.getElementById(d.expl); if (x) { const abre = x.hidden; x.hidden = !abre; t.setAttribute('aria-expanded', abre); t.classList.toggle('on', abre); } }
    else if (d.relp) { const h = hoje(), f = x => iso(x); let de_, ate_ = f(h);
      if (d.relp === 'mes') { de_ = f(new Date(h.getFullYear(), h.getMonth() - 1, 1)); ate_ = f(new Date(h.getFullYear(), h.getMonth(), 0)); }
      else if (d.relp === 'tri') de_ = f(new Date(h.getFullYear(), h.getMonth() - 3, h.getDate() + 1));
      else if (d.relp === 'ano') de_ = `${h.getFullYear()}-01-01`; else de_ = D.G0;
      if (de_ < D.G0) de_ = D.G0; rel = { de: de_, ate: ate_ }; render(); }
    else if (d.relmais) { const sc = t.closest('section'), abre = !sc.classList.contains('tudo'); sc.classList.toggle('tudo', abre); t.setAttribute('aria-expanded', abre); t.textContent = abre ? 'Mostrar só as 10 primeiras' : `Ver todas as ${d.relmais} linhas`; }
    else if (d.rel !== undefined) { const a = $('#rde').value, b = $('#rate').value; if (a && b && a <= b) { rel = { de: a, ate: b }; render(); } else toast('Confira as datas: a inicial não pode ser depois da final.'); }
    else if (d.print !== undefined) window.print();
    else if (d.ficha) abrirFicha(d.ficha);
    else if (d.new) abrir(d.new, null, d.pre);
    else if (d.fotoeqtrocar) escolherFotoEq(d.fotoeqtrocar, t);
    else if (d.fotoeqtirar) await tirarFotoEq(d.fotoeqtirar, t);
    else if (d.fichamembro) abrirFichaMembro(d.fichamembro);
    else if (d.habilitar) abrirHabilitacao(d.habilitar);
    else if (d.habsalvar !== undefined) await salvarHabilitacao(t);
    else if (d.edit) { const [m, id] = d.edit.split(':'); abrir(m, id); if (d.deslig !== undefined && $('#f_fim')) { if (!$('#f_fim').value) $('#f_fim').value = iso(hoje()); $('#f_fim').focus(); } }
    else if (d.cadeq) { if (convites === null) abrir('membros', null, d.cadeq); else abrirEscolha(d.cadeq); }
    else if (d.digitar) abrir('membros', null, d.digitar);
    else if (d.gerarlink) { t.disabled = true; try { const tk = await api.criarConvite(d.gerarlink); convites = undefined; mostrarLink(d.gerarlink, tk); render(); } catch (e) { t.disabled = false; $('#ferr').textContent = e.message; } }
    else if (d.copiarlink !== undefined) { const c = $('#lk_txt'); try { await navigator.clipboard.writeText(c.value); $('#ferr').textContent = 'Link copiado.'; } catch (e) { c.select(); $('#ferr').textContent = 'Selecionei o link: copie com Ctrl+C (ou segure o dedo e escolha Copiar).'; } }
    else if (d.cvaprovar) { const c = (convites || []).find(x => x.id === d.cvaprovar); if (c) { preMembro = { dados: c.dados || {}, convite: c.id }; abrir('membros', null, c.funcao); } }
    else if (d.cvfim) { const [id, st] = d.cvfim.split(':'); if (!d.ok) { d.ok = 1; t.textContent = st === 'recusado' ? 'Confirmar: recusar e apagar os dados' : 'Confirmar: cancelar o link'; return; } await api.conviteEncerrar(id, st); convites = undefined; render(); }
    else if (d.vercomo !== undefined) { if (coord() && !real) { real = { eu, db, tab }; db = semPessoal(db); eu = Object.assign({}, eu, { perfil: 'Acompanhamento', orgao: d.vercomo || 'SEAB/MDA' }); tab = 'painel'; nav(); render(); scrollTo(0, 0); } }
    else if (d.sairver !== undefined) { if (real) { eu = real.eu; db = real.db; tab = real.tab; real = null; nav(); render(); scrollTo(0, 0); } }
    else if (d.impok !== undefined) { if (imp) await confirmarImportacao(t); }
    else if (d.fechar !== undefined) { if (perderia()) return avisarPerda(); $('#dlg').close(); ed = null; }
    else if (d.pular !== undefined) { const v = $('#view'); v.setAttribute('tabindex', '-1'); v.focus(); }
    else if (d.ajudaentrada !== undefined) abrirAjudaEntrada();
    else if (d.geo !== undefined) pegarLocal(t);
    else if (d.geolimpar !== undefined) { ['f_lat', 'f_lng', 'f_precisao'].forEach(i => { $('#' + i).value = ''; }); $('#f_geo_t').textContent = 'Localização apagada.'; const g = $('[data-geo] span'); if (g) g.textContent = 'Pegar a localização'; t.remove(); }
    else if (d.salvarfotos !== undefined) { if (ed) { ed.depoisFotos = true; $('#frm').requestSubmit($('#fsalvar')); } }
    else if (d.aparencia !== undefined) { ed = null; $('#frm').className = 'fm'; $('#frm').innerHTML = SQC.aparencia.janela(); $('#dlg').classList.add('dlg-ap'); if ($('#dlg').open) $('#frm .fm-x').focus(); else $('#dlg').showModal(); }
    else if (d.apSol !== undefined) { SQC.aparencia.mudar('sol', !SQC.aparencia.ler().sol); $('#frm').innerHTML = SQC.aparencia.janela(); $('#frm [data-ap-sol]').focus(); }
    else if (d.apTema) { SQC.aparencia.mudar('tema', d.apTema); $('#frm').innerHTML = SQC.aparencia.janela(); $(`#frm [data-ap-tema="${d.apTema}"]`).focus(); }
    else if (d.presenca) abrirPresenca(d.presenca);
    else if (d.pradd) { t.disabled = true; try { await adicionarPresenca(d.pradd); } finally { t.disabled = false; } }
    else if (d.prdel) { if (!d.ok) { d.ok = 1; t.classList.add('conf'); t.title = 'Toque de novo para confirmar'; $('#ferr').textContent = 'Toque de novo na lixeira para tirar da lista.'; return; }
      try { await api.excluir('presencas', d.prdel); db.presencas = db.presencas.filter(x => x.id !== d.prdel); if (api.guardarCopia) api.guardarCopia(db); render(); abrirPresenca(prEv, 'Tirado da lista.'); } catch (e) { $('#ferr').textContent = e.semRede ? 'Sem internet: tente depois.' : e.message; } }
    else if (d.prcontar) { if (!d.ok) { d.ok = 1; t.textContent = 'Confirmar: trocar os participantes pelos da lista'; return; } const e = by('eventos', d.prcontar), L = db.presencas.filter(x => x.evento === d.prcontar), r = Object.assign({}, e, { part: L.length, mulheres: L.filter(x => x.mulher).length });
      const res = await gravarRegistro('eventos', r, e); render(); abrirPresenca(d.prcontar, res.ok ? 'Participantes da atividade atualizados pela lista.' : res.msg); }
    else if (d.imprimirlista) imprimirLista(d.imprimirlista);
    else if (d.imprimir) imprimirBranco(d.imprimir);
    else if (d.fotos) { if ($('#dlg').open && ed && perderia()) return avisarPerda(); const [tt, id] = d.fotos.split(':'); abrirFotos(tt, id); }
    else if (d.fotocam) { if (!demo() && navigator.onLine === false) { $('#ferr').textContent = 'Sem internet a foto não sobe, e a foto tirada por aqui não fica salva no celular. Tire com a câmera do próprio celular e anexe depois em “Escolher foto”: a data dela continua valendo.'; return; } const f = await SQC.fotodia.abrirCamera(m => { $('#ferr').textContent = m; }); if (f) await anexarFoto(d.fotocam, f, true); }
    else if (d.fotodel) { if (!d.ok) { d.ok = 1; t.classList.add('conf'); t.title = 'Toque de novo para confirmar'; $('#ferr').textContent = 'Toque de novo na lixeira para excluir a foto.'; return; }
      const f = db.fotos.find(x => x.id === d.fotodel); if (!f) return;
      try { await api.excluirFoto(f); db.fotos = db.fotos.filter(x => x.id !== f.id); if (urlsFoto[f.id]) { URL.revokeObjectURL(urlsFoto[f.id]); delete urlsFoto[f.id]; } if (api.guardarCopia) api.guardarCopia(db); render(); abrirFotos(f.tabela, f.registro, 'Foto excluída.'); } catch (e) { $('#ferr').textContent = e.semRede ? 'Sem internet: tente depois.' : e.message; } }
    else if (d.sinc !== undefined) sincronizar(true);
    else if (d.mais) { const y = window.scrollY; mostrando[d.mais] = (mostrando[d.mais] || PAGINA) + PAGINA; render(); window.scrollTo(0, y); }
    else if (d.rub) { const el = document.getElementById('rb-' + d.rub); if (el) { el.open = true; el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }
    else if (d.abrirRub !== undefined) { const todos = [...t.closest('.head').parentNode.querySelectorAll('details.rb')], abrir = todos.some(x => !x.open); todos.forEach(x => { x.open = abrir; }); t.textContent = abrir ? 'Fechar todas' : 'Abrir todas'; }
    else if (d.descartar) { if (!d.ok) { d.ok = 1; t.textContent = 'Confirmar: descartar'; return; } await SQC.fila.remover(d.descartar); await recarregarDb(); pend = await SQC.fila.listar(eu.id); aplicarFila(); render(); }
    else if (d.del) {
      const [m, id] = d.del.split(':');
      const uso = R.emUso(db, m, id).map(c => ({ presencas: 'lista de presença', fotos: 'fotos' })[c] || MOD[c].nome.toLowerCase());
      if (uso.length) { t.textContent = 'Em uso em ' + uso.join(', '); t.disabled = true; return; }
      if (!d.ok) { d.ok = 1; t.textContent = 'Confirmar exclusão'; return; }
      t.disabled = true;
      try { await api.excluir(m, id); db[m] = db[m].filter(x => x.id !== id); if (api.guardarCopia) api.guardarCopia(db); if (d.fechaapos !== undefined && $('#dlg').open) $('#dlg').close(); render(); }
      catch (e) { t.textContent = e.semRede ? 'Sem internet: tente depois' : e.message; }
    }
    else if (d.limpar !== undefined) { if (!d.ok) { d.ok = 1; t.textContent = 'Confirmar: apagar exemplos'; return; } await api.apagarExemplos(); await recarregarDb(); render(); }
    else if (d.zerar !== undefined) { if (!d.ok) { d.ok = 1; t.textContent = 'Confirmar: apagar tudo'; return; } await api.recomecar(); await recarregarDb(); render(); }
    else if (d.exp) { if (fora()) return; let qtd = 0;
      if (d.exp === 'json') { const c = {}; D.TABELAS.forEach(k => { c[k] = db[k].filter(r => !r._pendente); qtd += c[k].length; }); baixar('saberes-que-cultivam-' + iso(hoje()) + '.json', JSON.stringify(c, null, 1), 'application/json'); }
      else { qtd = db[d.exp].filter(r => !r._pendente).length; baixar(d.exp + '-' + iso(hoje()) + '.csv', csv(d.exp), 'text/csv;charset=utf-8'); }
      if (api.registrarDownload && !demo()) api.registrarDownload(d.exp, qtd);   // fica no histórico (script 21): quem baixou, quando e quantas linhas
    }
    else if (d.acessos !== undefined) { t.disabled = true; t.textContent = 'Carregando…'; try { acessos = await api.acessos(); } catch (e) { acessos = undefined; toast(e.message); } render(); }
    else if (d.hist !== undefined) { t.disabled = true; t.textContent = 'Carregando…'; try { hist = await api.auditoria(200); histFim = hist.length < 200; } catch (e) { hist = null; toast(e.message); } render(); }
    else if (d.histmais !== undefined && hist && hist.length) { t.disabled = true; t.textContent = 'Carregando…'; try { const mais = await api.auditoria(200, hist[hist.length - 1].em); hist = hist.concat(mais); histFim = mais.length < 200; } catch (e) { toast(e.message); } render(); }
    else if (d.meus !== undefined) abrirMeusDados();
    else if (d.meussalvar !== undefined) await salvarMeusContatos(t);
    else if (d.senha !== undefined && !demo()) abrirMeusDados({ senha: true });
    else if (d.senhaok !== undefined) {
      const a = $('#s1').value, b = $('#s2').value; if (a.length < 8) { $('#ferr').textContent = 'A senha precisa de pelo menos 8 caracteres.'; return; } if (a !== b) { $('#ferr').textContent = 'As duas senhas não são iguais.'; return; }
      t.disabled = true; try { await api.trocarSenha(a); $('#dlg').close(); toast('Senha trocada. Use a nova senha na próxima entrada.'); } catch (e) { $('#ferr').textContent = e.message; t.disabled = false; }
    }
  }

  /* ---------- "Meus dados" (14/10/2026, como no Mulheres & Quintais): o botão do perfil, no alto, abre os dados de quem entrou.
     Quem é da equipe muda o próprio celular e município (script 19); a coordenação também abre o cadastro completo.
     E-mail é o login: muda só pela coordenação, em Dados › acessos. ---------- */
  const meuMembro = () => { const e = R.nrm(eu && eu.email), hj = iso(hoje()); return e ? (db.membros || []).filter(m => R.nrm(m.email) === e).sort((a, b) => (!a.fim || a.fim >= hj ? 0 : 1) - (!b.fim || b.fim >= hj ? 0 : 1))[0] || null : null; };
  function abrirMeusDados(op) {
    op = op || {}; const m = fora() ? null : meuMembro(), hj = iso(hoje()), ativo = m && (!m.fim || m.fim >= hj);
    const linha = (k, v) => v ? `<dt>${k}</dt><dd>${esc(v)}</dd>` : '';
    ed = null; $('#frm').className = 'fm md';
    $('#frm').innerHTML = `<div class="fm-cab"><div><span class="fm-eye">${esc(demo() ? 'Demonstração · ' + (R.NOME_PERFIL[eu.perfil] || eu.perfil) : (R.NOME_PERFIL[eu.perfil] || eu.perfil) + (eu.orgao ? ' · ' + eu.orgao : ''))}</span><h2>Meus dados</h2></div><button type="button" class="fm-x" data-fechar aria-label="Fechar">×</button></div>
     <div class="fm-corpo">
      <section class="md-c" aria-label="Seus dados"><div class="md-t">${m && m.foto ? avatar(m, "md-av") : `<span class="md-av" aria-hidden="true">${esc(iniciais(demo() ? eu.perfil : eu.nome))}</span>`}<div><b>${esc(demo() ? eu.nome : (m && m.nome) || eu.nome)}</b><span>${esc(m ? NOME_FUNCAO[m.funcao] || '' : eu.perfil)}${m && !ativo ? ' · saiu em ' + dt(m.fim) : ''}</span></div></div>
       ${m && ativo && podeFoto(m) ? botoesFoto(m) : ''}
       <dl class="md-l">${linha('E-mail de acesso', eu.email)}${linha('Perfil no sistema', R.NOME_PERFIL[eu.perfil] || eu.perfil)}${linha('Órgão', eu.orgao)}${m ? linha('Celular', m.telefone) + linha('Município', m.municipio) + linha('Vínculo', m.vinculo) + linha('Na equipe desde', dt(m.inicio)) : ''}</dl></section>
      ${m && ativo ? `<section class="md-c" aria-labelledby="md-ed"><h3 class="fm-sec" id="md-ed">Atualizar meu celular e município</h3><div class="fields"><div class="fld"><label for="f_telefone">Celular (com DDD)</label><input id="f_telefone" autocomplete="tel" inputmode="tel" value="${esc(m.telefone || '')}"></div><div class="fld"><label for="md_mun">Município</label><input id="md_mun" autocomplete="address-level2" value="${esc(m.municipio || '')}"></div></div>
        <div class="acts"><button type="button" class="b p" data-meussalvar>Salvar meus dados</button>${coord() ? `<button type="button" class="b" data-edit="membros:${esc(m.id)}">Editar meu cadastro completo</button>` : ''}</div>
        <p class="note">Nome, função, e-mail e os dados da bolsa só a coordenação altera.</p></section>`
        : fora() ? '' : m ? `<p class="note">Seu cadastro na equipe está encerrado desde ${dt(m.fim)}. Para corrigir, fale com a coordenação.</p>` : formador() ? '<p class="note">Os dados do seu cadastro na equipe ficam com a coordenação. Para mudar celular ou município, fale com ela.</p>' : `<p class="note">Seu acesso ainda não está ligado a um cadastro da equipe (o e-mail do cadastro é diferente deste). Peça à coordenação para conferir o e-mail em Equipe.</p>`}
      ${demo() ? '<p class="note">A demonstração não usa senha.</p>' : `<details class="md-s"${op.senha ? ' open' : ''}><summary>Trocar minha senha</summary><div class="fields"><div class="fld"><label for="s1">Senha nova (mínimo 8 caracteres)</label><input id="s1" type="password" autocomplete="new-password"></div><div class="fld"><label for="s2">Repita a senha</label><input id="s2" type="password" autocomplete="new-password"></div></div><div class="acts"><button type="button" class="b p" data-senhaok>Trocar senha</button></div></details>`}
     </div>
     <div class="fm-pe"><div class="err" id="ferr" role="alert"></div><div class="ok-msg" id="fok" role="status">${esc(op.msg || '')}</div><div class="frow md-pe"><button type="button" class="b p" data-fechar>Voltar ao sistema</button><button type="button" class="b" data-sair>Sair do sistema</button></div></div>`;
    if (SQC.mascaras) SQC.mascaras.preparar($('#frm')); carregarFotosEq();
    if ($('#dlg').open) $('#frm .fm-x').focus(); else $('#dlg').showModal();
    if (op.senha) { const s1 = $('#s1'); if (s1) s1.focus(); }
  }
  async function salvarMeusContatos(b) {
    const tel = $('#f_telefone').value.trim(), mun = $('#md_mun').value.trim(), dg = R.soDigitos(tel).replace(/^55(?=\d{10,11}$)/, '');
    if (tel && !/^\d{10,11}$/.test(dg)) { $('#ferr').textContent = 'Confira o celular: DDD e número, como (84) 99999-0000.'; $('#f_telefone').focus(); return; }
    b.disabled = true; b.textContent = 'Salvando…'; $('#ferr').textContent = '';
    try { await api.atualizarMeusContatos(tel, mun); const m = meuMembro(); if (m) { m.telefone = tel || null; m.municipio = mun || null; } if (api.guardarCopia) api.guardarCopia(db); render(); abrirMeusDados({ msg: 'Dados atualizados.' }); }
    catch (e) { b.disabled = false; b.textContent = 'Salvar meus dados'; $('#ferr').textContent = e.semRede ? 'Sem internet: tente de novo quando o sinal voltar.' : e.message; }
  }

  /* ---------- partida ---------- */
  async function iniciar() {
    // dentro de moldura de outro site (clickjacking): não abre. O GitHub Pages não deixa mandar o cabeçalho que proíbe isso.
    try { if (window.top !== window.self) { document.body.textContent = 'Abra o sistema direto pelo endereço oficial.'; return; } } catch (e) { document.body.textContent = 'Abra o sistema direto pelo endereço oficial.'; return; }
    api = SQC.CONFIG && SQC.CONFIG.supabaseUrl ? SQC.apiSupabase : SQC.apiDemo; SQC.api = api;
    document.addEventListener('click', ev => { aoClicar(ev).catch(e => toast(e.message || 'Algo deu errado. Tente de novo.')); });
    document.addEventListener('submit', ev => { if (ev.target.id === 'frm') aoSalvar(ev).catch(e => { $('#ferr').textContent = e.message; }); else if (ev.target.id === 'fauth') aoEntrar(ev); else if (ev.target.id === 'fpub') aoEnviarConvite(ev).catch(e => { $('#perr').textContent = e.message; }); });
    let tBusca = null;
    document.addEventListener('input', ev => { if (!ev.target.matches || !ev.target.matches('[data-histbusca]')) return; clearTimeout(tBusca);
      tBusca = setTimeout(() => { histBusca = ev.target.value.trim(); render(); const b = $('#hbusca'); if (b) { b.focus({ preventScroll: true }); b.setSelectionRange(b.value.length, b.value.length); } }, 250); });
    document.addEventListener('change', ev => { if (ev.target.matches && ev.target.matches('[data-histfiltro]')) { histFiltro = ev.target.value; render(); } });
    document.addEventListener('change', ev => {
      const e = ev.target, de = e.dataset || {};
      if (e.id === 'imp_arq') { const a = e.files && e.files[0]; e.value = ''; aoEscolherPlanilha(a); return; }
      if (e.id === 'ft_arq') { const a = e.files && e.files[0]; e.value = ''; anexarFoto(de.alvo, a, false).catch(x => { $('#ferr').textContent = x.message; }); return; }
      if (imp && (de.impSt !== undefined || de.impEt !== undefined || de.impRb !== undefined)) {
        if (de.impSt !== undefined) { imp.escolhas.status[de.impSt] = e.value; try { localStorage.setItem(CH_ST, JSON.stringify(imp.escolhas.status)); } catch (x) {} }
        else if (de.impEt !== undefined) imp.escolhas.etapa[de.impEt] = e.value; else imp.escolhas.rubrica[de.impRb] = e.value;
        const foco = Object.keys(de).find(k => /^imp/.test(k)), val = de[foco]; desenharImportacao();
        const alvo = [...document.querySelectorAll('#frm select')].find(x => x.dataset[foco] === val); if (alvo) alvo.focus(); return;
      } if (ev.target.id === 'f_tipo' && ed && ed.m === 'lotes' && !ed.id) { const t = D.TIPOS[ev.target.value]; if (t) { $('#f_dias').value = t[1]; $('#f_med').value = t[2]; } } });
    // lista de presença: Enter em qualquer campo de "Adicionar à lista" adiciona (a janela não tem botão de enviar)
    document.addEventListener('keydown', ev => { if (ev.key === 'Enter' && ev.target && /^pr_(nome|com|mun|mul)$/.test(ev.target.id) && prEv) { ev.preventDefault(); adicionarPresenca(prEv).catch(e => { $('#ferr').textContent = e.message; }); } });
    $('#dlg').addEventListener('cancel', ev => { if (perderia()) { ev.preventDefault(); avisarPerda(); } });   // Esc ou "voltar" do Android
    $('#dlg').addEventListener('close', () => { ed = null; $('#dlg').classList.remove('dlg-ap'); aplicarEspera(); const g = gatilho; setTimeout(() => devolverFoco(g), 0); });
    // abas da entrada: setas, Home e End trocam a opção (e o foco acompanha)
    document.addEventListener('keydown', ev => { const t = ev.target; if (!t.matches || !t.matches('.sg [role="tab"]')) return; const ordem = ['entrar', 'primeiro'], i = ordem.indexOf(authModo);
      const n = ev.key === 'ArrowRight' || ev.key === 'ArrowDown' ? (i + 1) % 2 : ev.key === 'ArrowLeft' || ev.key === 'ArrowUp' ? (i + 1) % 2 : ev.key === 'Home' ? 0 : ev.key === 'End' ? 1 : -1; if (n < 0) return; ev.preventDefault(); if (n !== i) trocarModo(ordem[n], true); });
    // ao digitar num campo com erro, o erro daquele campo sai
    document.addEventListener('input', ev => { const c = ev.target.closest && ev.target.closest('#fauth .cp.erro'); if (!c) return; c.classList.remove('erro'); const e = c.querySelector('.cp-e'); e.hidden = true; e.textContent = ''; ev.target.removeAttribute('aria-invalid'); ev.target.removeAttribute('aria-describedby'); });
    document.addEventListener('pointermove', aoMoverGrafico); document.addEventListener('pointerdown', aoMoverGrafico);
    document.addEventListener('toggle', ev => { if (ev.target.open && ev.target.matches && ev.target.matches('details')) abrirTarde(ev.target); }, true);
    document.addEventListener('keydown', ev => { const t = ev.target; if ((ev.key === 'Enter' || ev.key === ' ') && t.matches && t.matches('g[data-mapamun]')) { ev.preventDefault(); t.dispatchEvent(new MouseEvent('click', { bubbles: true })); } });
    document.addEventListener('change', ev => { const t = ev.target, f = t.closest && t.closest('#frm, #fpub'); if (f && /^f_(funcao|arlo|socio)$/.test(t.id)) ajustarFormMembro(f); });
    document.addEventListener('input', ev => { const t = ev.target, f = t.closest && t.closest('#frm, #fpub'); if (!f) return; if (t.id === 'f_cep') buscarCep(f); if (f.id === 'fpub') rascunhoGuardar(); });
    document.addEventListener('keydown', teclaGrafico); document.addEventListener('focusout', ev => { if (ev.target.matches && ev.target.matches('[data-rg]')) { mesTeclado = -1; const d = document.querySelector('[data-dica]'), c = document.querySelector('[data-cr]'); if (d) d.hidden = true; if (c) c.setAttribute('hidden', ''); } });
    let rz = null, larg = window.innerWidth; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (!eu || !db) return; const cruzou = (larg < 720) !== (window.innerWidth < 720); larg = window.innerWidth; if (cruzou && !$('#dlg').open) render(); else escalaDesenhos(); }, 150); });
    ['online', 'offline'].forEach(e => window.addEventListener(e, () => { if (eu) { $('#net').hidden = navigator.onLine !== false && !api.offline; if (e === 'online') sincronizar(); } }));
    // sinal fraco que "parece conectado": tenta de novo a cada 2 minutos e quando a tela volta a aparecer, enquanto houver o que enviar
    const tentarDeNovo = () => { if (eu && !demo() && pend.some(p => !p.erro) && navigator.onLine !== false && document.visibilityState !== 'hidden') sincronizar(); };
    setInterval(tentarDeNovo, 120000); document.addEventListener('visibilitychange', tentarDeNovo);
    try { const t = localStorage.getItem('sqc-aba'); if (t && TABS.some(x => x[0] === t)) tab = t; } catch (e) {}
    if (location.hash && TABS.some(x => x[0] === location.hash.slice(1))) tab = location.hash.slice(1);
    window.addEventListener('pagehide', guardarLugar);
    $('#tabs').addEventListener('scroll', bordasMenu, { passive: true }); window.addEventListener('resize', bordasMenu);
    // celular: o campo em foco não fica escondido atrás do teclado nem do rodapé da janela
    document.addEventListener('focusin', ev => { const t = ev.target, tb = t && t.closest && t.closest('#tabs'); if (tb && t.matches('[data-tab]:focus-visible')) mostrarAba(t, tb); });   // só pelo teclado: no toque/clique, rolar a barra no meio do clique tirava o botão de baixo do dedo
    document.addEventListener('focusin', ev => { const el = ev.target; if (!el.closest || !el.closest('#frm .fm-corpo') || !el.matches('input,select,textarea') || window.innerHeight > 700) return;
      setTimeout(() => { try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {} }, 300); });
    // sem internet: o aviso aparece também dentro das janelas (ficam por cima de tudo)
    const marcarRede = () => document.documentElement.classList.toggle('sem-rede', navigator.onLine === false);
    marcarRede(); window.addEventListener('online', marcarRede); window.addEventListener('offline', marcarRede);   // fechou ou recarregou a página logado: volta ao mesmo lugar
    // abriu por um link de cadastro da equipe: mostra só o formulário público, sem entrar em conta nenhuma
    const mc = /^#c=(.*)$/.exec(location.hash || ''); if (mc) { if (api.preparar) api.preparar(); return telaConvite(mc[1]); }
    try {
      eu = await api.iniciar();
      if (api.recuperando) return pedirSenhaNova();
      if (api.linkVencido && !eu) { try { history.replaceState(null, '', location.pathname); } catch (x) {} return telaAcesso('O link que você abriu já foi usado ou venceu. Peça outro em “Primeiro acesso” ou “Esqueci a senha”.'); }
      // ficou mais de 15 minutos sem usar e fechou a página: pede a senha de novo
      if (eu && !demo() && navigator.onLine !== false && SQC.sessao.venceu(SQC.sessao.ultimo())) return sair(EXP);
      if (eu) await aposEntrar(); else telaAcesso('');
    } catch (e) { telaAcesso(e.message); }
    // funcionamento sem internet (só em endereço https ou no computador de quem desenvolve)
    try {
      if ('serviceWorker' in navigator && !(SQC.CONFIG && SQC.CONFIG.semServiceWorker) && (location.protocol === 'https:' || location.hostname === 'localhost')) {
        const tinha = !!navigator.serviceWorker.controller; let recarregou = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => { if (tinha && !recarregou && !$('#dlg').open) { recarregou = true; location.reload(); } });
        navigator.serviceWorker.register('sw.js').catch(() => {});
      }
    } catch (e) { /* sem service worker: o sistema funciona, só não abre sem internet */ }
  }

  SQC.app = { iniciar, pedirSenhaNova, MOD, TABS, csv, toast, AJUDA, AJUDA_FORA, abas, _estado: () => ({ eu, db, pend, tab }) };
  /* depois de recarregar por causa da troca de aparência (Safari): a janela de aparência volta aberta, como a pessoa deixou */
  async function partir() {
    await iniciar();
    let volta = false; try { volta = sessionStorage.getItem('sqc-aparencia-aberta') === '1'; sessionStorage.removeItem('sqc-aparencia-aberta'); } catch (e) {}
    if (volta) setTimeout(() => { const b = [...document.querySelectorAll('[data-aparencia]')].find(x => x.offsetParent); if (b) b.click(); }, 400);
  }
  if (typeof document !== 'undefined' && !SQC.SEM_PARTIDA) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', partir); else partir(); }
})();
;
