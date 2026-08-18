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

export function createFx({ stage, layer }) {
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
    stage.addEventListener(
      'animationend',
      () => stage.classList.remove('is-shaking'),
      { once: true },
    );
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

  return { flash, shake, explode };
}
