/* Explosive Peter — efeitos de tela.
 *
 * Helpers de DOM para o juice: flash, shake, explosão. Os verbos do
 * actions.js (D3) são uma casca fina por cima destes — quem sabe escrever
 * uma <div> na #fx-layer é aqui, e só aqui.
 *
 * Regra da ARCHITECTURE.md §6: JS não escreve style.transform. JS liga uma
 * classe .is-* ou escreve uma custom property; o @keyframes do juice.css faz
 * o resto. Isso mantém toda amplitude passando por var(--juice).
 */

/** Teto duro: no máximo 2 flashes por segundo, independente de configuração.
 *  Luz piscando acima de ~3 Hz é gatilho fotossensível (ARCHITECTURE.md §6). */
const FLASH_MIN_GAP_MS = 500;

export function createFx({ stage, layer, back }) {
  let lastFlash = -Infinity;

  function flash({ ms = 260 } = {}) {
    const now = performance.now();
    if (now - lastFlash < FLASH_MIN_GAP_MS) return;
    lastFlash = now;

    const el = document.createElement('div');
    el.className = 'flash';
    el.style.setProperty('--flash-ms', `${ms}ms`);
    el.addEventListener('animationend', () => el.remove(), { once: true });
    layer.appendChild(el);
  }

  function shake({ intensity = 6 } = {}) {
    stage.style.setProperty('--shake-amp', intensity);
    stage.classList.remove('is-shaking');
    void stage.offsetWidth; // reinicia a animação mesmo se já estava sacudindo
    stage.classList.add('is-shaking');

    // Sem setTimeout: a própria animação avisa quando acabou (P3).
    // `animationend` BORBULHA: o flash, o tique do timer e a bola de fogo são
    // todos descendentes do palco e terminariam a tremida antes da hora. Só o
    // evento do próprio #stage conta.
    stage.addEventListener('animationend', function done(ev) {
      if (ev.target !== stage) return;
      stage.removeEventListener('animationend', done);
      stage.classList.remove('is-shaking');
    });
  }

  /** Explosão: bola de fogo na posição do alvo + flash + shake.
   *  Placeholder do D1, e o que a cena `ninguem-veio` usa de verdade. */
  function explode(target, { intensity = 8 } = {}) {
    const boom = document.createElement('div');
    boom.className = 'boom';
    if (target) {
      // Herda a posição do alvo nas mesmas unidades de design.
      boom.style.setProperty('--x', target.style.getPropertyValue('--x') || 500);
      boom.style.setProperty('--y', target.style.getPropertyValue('--y') || 470);
    }
    layer.appendChild(boom);
    flash();
    shake({ intensity });
    return boom;
  }

  /**
   * A base da tela inunda. `height` é a altura da água em unidades de design,
   * medida a partir da LINHA DO CHÃO para cima — 140 dá água no peito do
   * Pedro. A água sangra até a borda real da janela, como o chão.
   */
  function flood({ height = 140, ms = 900 } = {}) {
    const el = document.createElement('div');
    el.className = 'flood';
    el.style.setProperty('--flood-h', height);
    el.style.setProperty('--flood-ms', `${ms}ms`);
    layer.appendChild(el);
    return el;
  }

  /**
   * Abre uma fenda. Vai na camada de TRÁS: quem sai dela precisa aparecer
   * na frente dela, e o portal atrás do Pedro precisa ficar atrás do Pedro.
   */
  function portal({ x = 620, y = 320, w = 150, h = 230, ms = 520 } = {}) {
    const el = document.createElement('div');
    el.className = 'portal';
    el.style.setProperty('--x', x);
    el.style.setProperty('--y', y);
    el.style.setProperty('--w', w);
    el.style.setProperty('--h', h);
    el.style.setProperty('--portal-ms', `${ms}ms`);
    (back ?? layer).appendChild(el);
    return el;
  }

  return { flash, shake, explode, flood, portal };
}
