/* Explosive Peter — o relógio.
 *
 * Uma única fonte de tempo para o jogo inteiro (ARCHITECTURE.md §3, P3).
 * Nenhum setTimeout solto em lugar nenhum: agendar beat, congelar o
 * freeze-frame e pausar a aba escondida saem todos deste mesmo mecanismo.
 *
 * O tempo só avança em requestAnimationFrame, acumulando deltas de
 * performance.now(). Pausado, o relógio simplesmente não acumula — quem
 * agendou para os 1600ms continua disparando aos 1600ms de tempo de jogo.
 */

export function createClock() {
  let elapsed = 0;
  let lastFrame = 0;
  let running = false;
  let rafId = 0;
  /** @type {{at: number, fn: Function, id: number, cancelled: boolean}[]} */
  let queue = [];
  let nextId = 1;

  function frame(now) {
    if (!running) return;
    const delta = now - lastFrame;
    lastFrame = now;
    // Aba que volta do background pode entregar um delta gigante. Cap em
    // ~4 frames evita atropelar meia timeline de uma vez.
    elapsed += Math.min(delta, 64);
    fire();
    rafId = requestAnimationFrame(frame);
  }

  function fire() {
    // A fila fica ordenada por `at`; dispara tudo que já venceu.
    while (queue.length && queue[0].at <= elapsed) {
      const task = queue.shift();
      if (task.cancelled) continue;
      try {
        task.fn(elapsed);
      } catch (err) {
        // P5: erro nunca trava a rodada.
        console.error('[clock] beat falhou:', err);
      }
    }
  }

  return {
    /** Tempo de jogo decorrido, em ms. */
    now: () => elapsed,

    isRunning: () => running,

    /** Agenda `fn` para o instante absoluto `ms` do relógio. Devolve um cancelador. */
    at(ms, fn) {
      const task = { at: ms, fn, id: nextId++, cancelled: false };
      queue.push(task);
      queue.sort((a, b) => a.at - b.at || a.id - b.id);
      return () => {
        task.cancelled = true;
      };
    },

    /** Açúcar: agenda relativo ao agora. */
    after(ms, fn) {
      return this.at(elapsed + ms, fn);
    },

    start() {
      if (running) return;
      running = true;
      lastFrame = performance.now();
      rafId = requestAnimationFrame(frame);
    },

    pause() {
      if (!running) return;
      running = false;
      cancelAnimationFrame(rafId);
    },

    resume() {
      this.start();
    },

    /** Congela por `ms` de tempo real e retoma sozinho (freeze-frame do clímax). */
    freeze(ms) {
      if (!running) return;
      this.pause();
      setTimeout(() => this.resume(), ms);
    },

    /** Zera o relógio e joga fora tudo que estava agendado. */
    reset() {
      this.pause();
      elapsed = 0;
      queue = [];
    },
  };
}

/**
 * Liga o relógio ao ciclo de vida da aba: sai de vista, congela;
 * volta, continua de onde parou (GDD §10, risco de setTimeout em background).
 */
export function bindVisibility(clock, { onHide, onShow } = {}) {
  let wasRunning = false;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      wasRunning = clock.isRunning();
      clock.pause();
      onHide?.();
    } else if (wasRunning) {
      clock.resume();
      onShow?.();
    }
  });
}
