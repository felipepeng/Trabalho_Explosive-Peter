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

export const actions = {
  /**
   * Põe um ator em cena vindo de fora da janela.
   * `{ do:'enter', who:'vinicius', from:'left', x:320, y:470, ms:700 }`
   */
  enter(ctx, { who, from, x, y, ms }) {
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
  explode(ctx, { target = 'bomb', intensity = 8, vaporize = [] }) {
    if (ctx.signal?.aborted) return;

    for (const name of vaporize) {
      ctx.stage.get(name)?.classList.add('is-vaporized');
    }

    ctx.fx.explode(ctx.stage.get(target), { intensity });
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
  pose(ctx, { who, as, off = false }) {
    if (ctx.signal?.aborted || !who || !as) return;

    const el = ctx.stage.get(who);
    if (!el) {
      console.warn(`[actions] pose sem ator em cena: "${who}"`);
      return;
    }
    el.classList.toggle(`pose-${as}`, !off);
  },

  /**
   * `{ do:'flood', height:140, ms:900 }` — a base da tela inunda.
   * `height` em unidades de design, contado da linha do chão para cima.
   */
  flood(ctx, { height, ms } = {}) {
    if (ctx.signal?.aborted) return;
    ctx.fx.flood({ height, ms });
  },

  /**
   * `{ do:'portal', x:620, y:320, w:150, h:230 }` — abre uma fenda.
   * Posição e tamanho em unidades de design, como tudo em `data/`.
   */
  portal(ctx, { x, y, w, h, ms } = {}) {
    if (ctx.signal?.aborted) return;
    ctx.fx.portal({ x, y, w, h, ms });
  },
};
