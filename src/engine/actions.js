/* Explosive Peter — os verbos.
 *
 * Única camada do motor que toca o DOM (P2). Um objeto plano de funções
 * `(ctx, beat) => void`, onde `ctx` traz o palco, os efeitos e o clock da
 * rodada corrente.
 *
 * Três regras (ARCHITECTURE.md §4), que valem para todo verbo novo:
 *
 *   1. Nunca consulta `scene.id` nem `ending.id`. Deu vontade de escrever esse
 *      `if`? Parametrize pelo beat ou crie um verbo novo.
 *   2. Se `ctx.signal.aborted`, retorna sem fazer nada.
 *   3. Agenda com `ctx.clock`, nunca com `setTimeout`.
 *
 * E a regra da §6: JS não escreve `style.transform`. Liga uma classe `.is-*`
 * ou escreve uma custom property; o @keyframes consome. Assim toda amplitude
 * continua passando por `var(--juice)`.
 *
 * D3: enter · say · shake · explode.
 * D6: flood · portal — os dois que o Michas e o Pedro Maligno precisam.
 * D7: exit · grab · flash · pose — o que as primeiras timelines pediram.
 * D8: setTimer · hide · show · blackout — o Michas e o Pedro Maligno.
 * D9: sfx — e um som padrão em cada verbo que faz barulho por natureza.
 *
 * SOM: todo verbo aceita `sfx`. Onde faz sentido existe um padrão (entrar
 * faz whoosh, explodir faz boom), e o dado pode trocar (`sfx: 'drop'`) ou
 * calar (`sfx: null`). Assim a timeline não precisa de um beat de som ao
 * lado de cada beat de ação — seriam 30 beats a mais no catálogo.
 */

/** Duração da entrada, quando nem o beat nem o personagem dizem. */
const ENTER_MS = 700;

/**
 * Modos de entrada. Os quatro primeiros são geométricos: o ator vem da borda
 * REAL da janela daquele lado. `portal` não é uma direção — ele cresce no
 * lugar onde já está, para quem sai de uma fenda em vez de vir de fora.
 * Qualquer outro valor cai na esquerda.
 */
const MODES = new Set(['left', 'right', 'above', 'below', 'portal']);

/** `sfx` ausente toca o padrão do verbo; `sfx: null` cala. */
const soar = (ctx, beat, padrao) => {
  ctx.audio?.play(beat.sfx === undefined ? padrao : beat.sfx);
};

/**
 * Onde um beat acontece: em cima de um ator (`who`) ou numa marca crua
 * (`x`/`y`). Sempre em unidades de design, nunca em pixel.
 */
const ondeFica = (ctx, { who, x, y }) => {
  const ator = who ? ctx.stage.get(who) : null;
  // `Number('')` é 0, e 0 aqui significa "o ator não tem marca", não "canto da
  // tela" — por isso o `|| null` antes de cair no padrão.
  const marca = (prop) => Number(ator?.style.getPropertyValue(prop)) || null;
  return {
    x: x ?? marca('--x') ?? 500,
    y: y ?? marca('--y') ?? 470,
  };
};

/**
 * O PONTO DE MIRA de um ator: o meio do corpo dele, não os pés.
 *
 * `--y` é a base do ator (o transform é `translate(-50%, -100%)`), então um
 * raio ligado direto no `--y` de dois bonecos passaria rente ao chão em vez de
 * cruzar o peito. `lift` é a fração da altura a subir — 0,5 é a cintura/peito
 * de qualquer um, e serve tanto para a bomba quanto para um emblema flutuando.
 * Mesma conta que o `grab` já faz para reposicionar o que foi agarrado.
 */
const miraDe = (ctx, who, { x, y, lift = 0.5 } = {}) => {
  const el = who ? ctx.stage.get(who) : null;
  const num = (prop) => Number(el?.style.getPropertyValue(prop)) || null;
  const ay = y ?? num('--y') ?? 470;
  // `--h` do personagem é inline (rig.js escreve), mas o da bomba e o dos
  // emblemas de IA vem do CSS — daí a segunda tentativa no estilo computado.
  const ah = num('--h')
    ?? (el ? Number(getComputedStyle(el).getPropertyValue('--h')) || null : null)
    ?? 160;
  return {
    x: x ?? num('--x') ?? 500,
    // com `y` explícito o dado mandou a altura exata e o lift não se intromete
    y: y === undefined ? Math.round(ay - ah * lift) : y,
  };
};

export const actions = {
  /**
   * Põe um ator em cena vindo de fora da janela.
   * `{ do:'enter', who:'vinicius', from:'left', x:320, y:470, ms:700 }`
   */
  enter(ctx, beat) {
    const { who, from, x, y, ms } = beat;
    if (ctx.signal?.aborted || !who) return;

    const el = ctx.stage.spawn(who, { x, y });
    if (!el) return; // stage já avisou que falta o template (P5)

    // Precedência: o que o beat pediu > o jeito do personagem > o genérico.
    const wanted = from ?? el.dataset.enterFrom;
    const side = MODES.has(wanted) ? wanted : 'left';
    const gait = el.dataset.enterGait;
    const dur = ms ?? (Number(el.dataset.enterMs) || ENTER_MS);

    el.style.setProperty('--enter-ms', `${dur}ms`);
    el.classList.add(`is-enter-${side}`);
    if (gait) el.classList.add(`gait-${gait}`);
    soar(ctx, beat, 'whoosh');
    // A própria animação avisa quando acabou — nada de setTimeout (P3).
    // `animationend` borbulha, então filtra o evento dos filhos (a respiração
    // do Pedro, a faísca do pavio) — senão a entrada é cortada no meio.
    el.addEventListener('animationend', function done(ev) {
      if (ev.target !== el) return;
      el.removeEventListener('animationend', done);
      el.classList.remove(`is-enter-${side}`);
      if (gait) el.classList.remove(`gait-${gait}`);
    });
  },

  /**
   * Balão de fala. UM BALÃO POR ATOR: um `say` novo substitui o anterior, sem
   * fila — fila atrasa a fala e estoura os 15s do GDD.
   * `{ do:'say', who:'vinicius', text:'Amor fati.', ms:1800 }`
   */
  say(ctx, { who, text, ms }) {
    if (ctx.signal?.aborted || !who || !text) return;

    const actor = ctx.stage.get(who);
    if (!actor) {
      console.warn(`[actions] say sem ator em cena: "${who}"`);
      return;
    }

    actor.querySelector('.balloon')?.remove();

    const balloon = document.createElement('p');
    balloon.className = 'balloon';
    balloon.textContent = text;
    actor.appendChild(balloon);

    if (ms) {
      ctx.clock.after(ms, () => {
        if (ctx.signal?.aborted) return;
        balloon.remove();
      });
    }
  },

  /** `{ do:'shake', intensity:4 }` — a tela inteira treme. */
  shake(ctx, { intensity = 6 }) {
    if (ctx.signal?.aborted) return;
    ctx.fx.shake({ intensity });
  },

  /**
   * `{ do:'explode', target:'bomb', intensity:8, vaporize:['peter','bomb'] }`
   * `vaporize` é declarativo de propósito: é o dado que decide quem some, não
   * um `if (ending.survives)` escondido aqui dentro (regra 1).
   */
  explode(ctx, beat) {
    const { target = 'bomb', intensity = 8, vaporize = [], x, y, ms } = beat;
    if (ctx.signal?.aborted) return;

    for (const name of vaporize) {
      ctx.stage.get(name)?.classList.add('is-vaporized');
    }

    ctx.fx.explode(ctx.stage.get(target), { intensity, x, y, ms });
    soar(ctx, beat, 'boom');
  },

  /**
   * `{ do:'setTimer', to:6, rate:4 }` — reescreve o mostrador.
   *
   * O countdown é um componente, não uma sequência de beats: este verbo só
   * troca os três números que ele desenha. É assim que `mal-paradoxo`
   * acelera de 6 para 0 sem inventar dez beats (ARCHITECTURE.md §6).
   *
   * ATENÇÃO: isto é o MOSTRADOR, não o relógio. Quem decide quando a rodada
   * estoura é o `climaxAt` da cena — os dois precisam bater, e o validador
   * não tem como conferir isso.
   */
  setTimer(ctx, { to, rate }) {
    if (ctx.signal?.aborted) return;
    ctx.countdown.set({ to, rate });
  },

  /** `{ do:'hide', who:'peter' }` — some na hora, sem transição. */
  hide(ctx, { who }) {
    if (ctx.signal?.aborted || !who) return;
    ctx.stage.get(who)?.classList.add('is-hidden');
  },

  /**
   * `{ do:'show', who:'peter', x:380 }` — reaparece, opcionalmente em outro
   * lugar. `hide` + `show` com x trocado é uma troca de posições instantânea,
   * que é o que `mal-troca` precisa.
   */
  show(ctx, { who, x, y }) {
    if (ctx.signal?.aborted || !who) return;

    const el = ctx.stage.get(who);
    if (!el) return;
    if (x !== undefined) el.style.setProperty('--x', x);
    if (y !== undefined) el.style.setProperty('--y', y);
    el.classList.remove('is-hidden');
  },

  /** `{ do:'blackout', ms:400 }` — corte para tela preta, e fica preto. */
  blackout(ctx, beat = {}) {
    if (ctx.signal?.aborted) return;
    ctx.fx.blackout({ ms: beat.ms });
    soar(ctx, beat, 'glitch');
  },

  /** `{ do:'sfx', name:'fanfarra' }` — som avulso, sem nada acontecendo na tela. */
  sfx(ctx, { name }) {
    if (ctx.signal?.aborted) return;
    ctx.audio?.play(name);
  },

  /**
   * `{ do:'exit', who:'vinicius', to:'right', ms:1500, gait:'walk' }`
   * Sai de cena pela borda REAL da janela e FICA fora: a animação usa
   * fill both, então ninguém reaparece por descuido.
   */
  exit(ctx, { who, to = 'right', ms = 900, gait }) {
    if (ctx.signal?.aborted || !who) return;

    const el = ctx.stage.get(who);
    if (!el) {
      console.warn(`[actions] exit sem ator em cena: "${who}"`);
      return;
    }

    const side = MODES.has(to) && to !== 'portal' ? to : 'right';
    el.style.setProperty('--enter-ms', `${ms}ms`); // mesma duração dos dois lados
    el.classList.add(`is-exit-${side}`);
    if (gait) el.classList.add(`gait-${gait}`);
  },

  /**
   * `{ do:'grab', who:'vinicius', target:'bomb' }`
   *
   * O alvo vira FILHO de quem pegou. Isso não é detalhe de implementação: é
   * o que faz o `exit` seguinte levar a bomba junto sem nenhum verbo saber
   * disso, e é o que permite escrever `vin-memento` ("abraça a bomba, sai de
   * cena e explode sozinho") com dois beats.
   */
  grab(ctx, { who, target = 'bomb' }) {
    if (ctx.signal?.aborted || !who) return;

    const holder = ctx.stage.get(who);
    const item = ctx.stage.get(target);
    if (!holder || !item) {
      console.warn(`[actions] grab impossível: "${who}" pegando "${target}"`);
      return;
    }

    // A posição em unidades de design acompanha o objeto, senão a explosão
    // seguinte estouraria no chão, onde a bomba ESTAVA.
    const hx = Number(holder.style.getPropertyValue('--x'));
    const hy = Number(holder.style.getPropertyValue('--y'));
    const hh = Number(holder.style.getPropertyValue('--h')) || 160;
    if (Number.isFinite(hx)) item.style.setProperty('--x', hx);
    if (Number.isFinite(hy)) item.style.setProperty('--y', Math.round(hy - hh * 0.47));

    holder.classList.add('is-grabbing');
    item.classList.add('is-held');
    holder.appendChild(item);
  },

  /**
   * `{ do:'beam', from:'professor', to:'bomb', color:'#ff4d4d', ms:520 }`
   *
   * Um RAIO de um ponto a outro. Nasceu com a cena do Pedro Professor e serve
   * os DOIS momentos dela: o laser que sai da mão dele e parte a bomba, e os
   * três raios que as IAs disparam ao mesmo tempo no Pedro. Um verbo, dois
   * usos — a alternativa era um `laser` e um `raio` fazendo a mesma conta.
   *
   * `from`/`to` são atores em cena e o raio liga o PEITO de um ao do outro
   * (ver `miraDe`). `x`/`y` passam por cima da origem e `tx`/`ty` do alvo,
   * para quando o dado quiser um ponto cru — a mão levantada, o céu.
   */
  beam(ctx, beat) {
    const { from, to, x, y, tx, ty, lift, color, width, ms } = beat;
    if (ctx.signal?.aborted) return;

    const origem = miraDe(ctx, from, { x, y, lift });
    const alvo = miraDe(ctx, to, { x: tx, y: ty, lift });
    ctx.fx.beam({ ...origem, tx: alvo.x, ty: alvo.y, color, width, ms });
    soar(ctx, beat, 'raio');
  },

  /** `{ do:'flash', ms:260 }` — clarão de tela cheia, com teto de 2 por segundo. */
  flash(ctx, { ms } = {}) {
    if (ctx.signal?.aborted) return;
    ctx.fx.flash({ ms });
  },

  /**
   * `{ do:'pose', who:'jp', as:'jump' }` — liga uma pose declarada em CSS.
   *
   * Um verbo em vez de um por gesto (pular, esticar, arremessar, cortar).
   * A regra continua valendo: o verbo não sabe QUAL pose está ligando, e
   * pose nova é um @keyframes, não uma linha de JavaScript.
   * `off: true` desliga.
   */
  pose(ctx, beat) {
    const { who, as, off = false } = beat;
    if (ctx.signal?.aborted || !who || !as) return;

    const el = ctx.stage.get(who);
    if (!el) {
      console.warn(`[actions] pose sem ator em cena: "${who}"`);
      return;
    }
    el.classList.toggle(`pose-${as}`, !off);
    if (!off) soar(ctx, beat);
  },

  /**
   * `{ do:'flood', height:140, ms:900 }` — a base da tela inunda.
   * `height` em unidades de design, contado da linha do chão para cima.
   */
  /**
   * `{ do:'burst', who:'bomb', emojis:['X'], count:14, power:220, dir:0 }`
   *
   * Partículas num MOMENTO-CHAVE: a bomba estourando, o soco, a onda batendo,
   * o respingo. Não é enfeite de fundo — se estiver ligado o tempo todo, some
   * o impacto de quando importa.
   *
   * Sem `emojis` sai estilhaço geométrico; com `emojis` sai emoji voando.
   * `gravity: -1` faz o pedaço SUBIR, que é como bolha vira bolha.
   */
  burst(ctx, beat) {
    if (ctx.signal?.aborted) return;
    ctx.fx.burst({ ...beat, ...ondeFica(ctx, beat) });
    soar(ctx, beat, null); // mudo por padrão: quem faz barulho é a ação, não o confete
  },

  /**
   * `{ do:'prop', emoji:'X', x:120, y:470, size:90 }` — cenário parado.
   *
   * O oposto do `burst`: entra, fica e não voa. Nasceu para a estátua que
   * assiste à cena do Vinicius sem mover um músculo. `front: true` traz para a
   * frente do elenco; o padrão é atrás, porque cenário não tapa ator.
   */
  prop(ctx, beat) {
    if (ctx.signal?.aborted) return;
    ctx.fx.prop(beat);
    soar(ctx, beat, null);
  },

  flood(ctx, beat = {}) {
    if (ctx.signal?.aborted) return;
    const altura = beat.height ?? 140;
    ctx.fx.flood({ height: altura, ms: beat.ms });

    // A água CHEGANDO é momento-chave: respingo na linha da água, subindo.
    // `drops: false` desliga, porque a mesma água pode subir de novo depois e
    // dois respingos seguidos viram enfeite.
    if (beat.drops !== false) {
      ctx.fx.burst({
        x: beat.x ?? 500,
        y: 450 - altura,
        emojis: Array.isArray(beat.drops) ? beat.drops : ['💧', '🫧'],
        count: 14,
        power: 150,
        spread: 150,
        dir: 0,
        gravity: 1,
        size: 22,
        ms: 850,
      });
    }
    soar(ctx, beat, 'splash');
  },

  /**
   * `{ do:'portal', x:620, y:320, w:150, h:230 }` — abre uma fenda.
   * Posição e tamanho em unidades de design, como tudo em `data/`.
   */
  portal(ctx, beat = {}) {
    if (ctx.signal?.aborted) return;
    ctx.fx.portal({ x: beat.x, y: beat.y, w: beat.w, h: beat.h, ms: beat.ms });
    soar(ctx, beat, 'portal');
  },
};
