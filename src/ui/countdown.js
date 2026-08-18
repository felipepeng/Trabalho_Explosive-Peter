/* Explosive Peter — o countdown visível.
 *
 * É um componente, não uma sequência de beats (ARCHITECTURE.md §6):
 * guarda {from, rate, since} e desenha a partir do clock a cada frame.
 * O verbo `setTimer` só reescreve esses três números — é assim que
 * `mal-paradoxo` acelera de 6 para 0 sem inventar dez beats.
 */

import { COUNTDOWN_MS, URGENT_AT } from '../config.js';

export function createCountdown(el, clock) {
  let from = COUNTDOWN_MS / 1000; // segundos no início
  let rate = 1; // segundos de timer por segundo de jogo
  let since = 0; // instante do clock em que essa configuração começou
  let frozenAt = null; // trava o mostrador (ex.: bomba desarmada)
  let lastShown = null;
  let rafId = 0;
  let onZero = null;
  let onTick = null;
  let zeroFired = false;

  function value() {
    if (frozenAt !== null) return frozenAt;
    const dt = (clock.now() - since) / 1000;
    return Math.max(0, from - dt * rate);
  }

  function draw() {
    const secs = Math.ceil(value() - 1e-6);
    if (secs !== lastShown) {
      lastShown = secs;
      el.textContent = String(secs);
      el.classList.toggle('is-urgent', secs <= URGENT_AT);
      // reinicia a animação de tique
      el.classList.remove('is-tick');
      void el.offsetWidth;
      el.classList.add('is-tick');
      // O tique é do componente, não da timeline: um beat por segundo
      // multiplicaria por 10 o tamanho de toda cena (ARCHITECTURE.md §6).
      if (secs > 0) onTick?.(secs);
    }
    if (!zeroFired && value() <= 0) {
      zeroFired = true;
      onZero?.();
    }
    rafId = requestAnimationFrame(draw);
  }

  return {
    /** (Re)inicia o mostrador. `seconds` default = o countdown padrão do jogo. */
    reset(seconds = COUNTDOWN_MS / 1000) {
      from = seconds;
      rate = 1;
      since = clock.now();
      frozenAt = null;
      lastShown = null;
      zeroFired = false;
    },

    /** O verbo `setTimer` cai aqui: novo valor e/ou nova velocidade. */
    set({ to, rate: newRate } = {}) {
      from = to ?? value();
      since = clock.now();
      if (newRate !== undefined) rate = newRate;
      frozenAt = null;
      zeroFired = false;
    },

    /** Trava o mostrador no valor atual (bomba desarmada, cena congelada). */
    hold() {
      frozenAt = value();
    },

    /** Callback disparado uma vez, quando o mostrador cruza o zero. */
    onZero(fn) {
      onZero = fn;
    },

    /** Callback a cada virada de segundo visível. Recebe o segundo mostrado. */
    onTick(fn) {
      onTick = fn;
    },

    get seconds() {
      return value();
    },

    mount() {
      if (!rafId) rafId = requestAnimationFrame(draw);
    },

    unmount() {
      cancelAnimationFrame(rafId);
      rafId = 0;
    },
  };
}
