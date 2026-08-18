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
 * D3 entrega os quatro primeiros: enter · say · shake · explode.
 * Os outros nove chegam quando a primeira cena precisar deles.
 */

/** Duração da entrada, quando nem o beat nem o personagem dizem. */
const ENTER_MS = 700;

/** Lados válidos de entrada. Qualquer outro cai na esquerda. */
const SIDES = new Set(['left', 'right', 'above', 'below']);

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
    const side = SIDES.has(wanted) ? wanted : 'left';
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
};
