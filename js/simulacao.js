/* Saberes que Cultivam — SIMULAÇÃO: o sistema inteiro povoado com dados FICTÍCIOS, para ver como fica com o projeto andando.
   Abre com  ?simulacao  no endereço (data simulada: fim do projeto, 31/07/2027) ou  ?simulacao=AAAA-MM-DD  (qualquer dia da vigência).
   Na simulação: nada fala com o Supabase (vira modo demonstração), os dados ficam só neste navegador, o relógio do sistema
   passa a marcar a data escolhida e uma faixa no alto avisa que tudo é fictício. Sem  ?simulacao  este arquivo não faz nada.
   Nomes, comunidades e valores são inventados (sorteio com semente fixa: a mesma data gera sempre os mesmos dados). */
(function () {
  const G = window,
    SQC = (G.SQC = G.SQC || {});
  const q = new URLSearchParams(location.search);
  if (!q.has('simulacao')) return;
  const pedido = q.get('simulacao') || '';
  const valida = x => {
    const d = new Date(x + 'T12:00:00Z');
    return !isNaN(d) && d.toISOString().slice(0, 10) === x;
  }; /* ataque de 28/10/2026: 2026-13-01 deixava NaN na tela */
  const dia =
    /^\d{4}-\d{2}-\d{2}$/.test(pedido) && valida(pedido) && pedido >= '2026-08-01' && pedido <= '2027-07-31' ? pedido : '2027-07-31';
  SQC.SIMULACAO = { dia };
  SQC.CONFIG = Object.assign({}, SQC.CONFIG || {}, { supabaseUrl: '', supabaseAnonKey: '', semServiceWorker: true }); // nunca o banco de verdade

  /* relógio: o dia escolhido, na hora atual (o tempo continua passando, para a sessão e os avisos funcionarem) */
  const RD = Date,
    meiaNoite = new RD();
  meiaNoite.setHours(0, 0, 0, 0);
  const desloc = new RD(dia + 'T00:00:00').getTime() - meiaNoite.getTime();
  class DataSimulada extends RD {
    constructor(...a) {
      if (a.length) super(...a);
      else super(RD.now() + desloc);
    }
    static now() {
      return RD.now() + desloc;
    }
  }
  G.Date = DataSimulada;

  /* faixa de aviso, sempre visível */
  const br = s => s.split('-').reverse().join('/');
  const faixa = () => {
    if (document.getElementById('sim-faixa')) return;
    const d = document.createElement('div');
    d.id = 'sim-faixa';
    d.setAttribute('role', 'note');
    const ir = x => `?simulacao=${x}`;
    d.innerHTML =
      `<b>Simulação com dados fictícios</b><span>Data simulada: ${br(dia)}. Nada aqui vai para o banco do projeto.</span>` +
      `<span class="sim-ir">Ver em: <a href="${ir('2026-10-31')}">out/2026</a> · <a href="${ir('2027-01-31')}">jan/2027</a> · <a href="${ir('2027-04-30')}">abr/2027</a> · <a href="${ir('2027-07-31')}">fim do projeto</a> · <a href="${location.pathname}">sair da simulação</a></span>`;
    document.body.prepend(d);
    /* 28/10/2026 (telas diversas): a faixa presa no alto cobria o menu ao rolar (dobrável, smart TV). O menu desce a altura da faixa
       enquanto ela está presa; em tela baixa ou estreita a faixa rola junto com a página (CSS) e o menu volta ao topo. */
    const ajusta = () =>
      document.documentElement.style.setProperty('--sim-h', getComputedStyle(d).position === 'sticky' ? d.offsetHeight + 'px' : '0px');
    ajusta();
    try {
      new ResizeObserver(ajusta).observe(d);
    } catch (e) {}
    addEventListener('resize', ajusta);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', faixa);
  else faixa();

  /* 06/11/2026 (velocidade): o gerador dos dados fictícios (SQC.simular, SQC.simularPlano) fica em js/simulacao_dados.js e só é
     baixado quando a demonstração ou a simulação abre (o iniciar() o carrega junto com o js/api-demo.js); quem usa o sistema de
     verdade não baixa nada disso. Aqui fica só o que precisa valer ANTES do resto: o relógio, a configuração e a faixa. */
  SQC.SIMULACAO.DataReal = RD;
})();
