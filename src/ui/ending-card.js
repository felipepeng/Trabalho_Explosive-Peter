/* Explosive Peter — o card de final.
 *
 * I2: daqui só se sai por clique. O card em si NÃO é clicável — o único alvo
 * de clique do jogo inteiro é o botão, e sendo um `<button>` de verdade, foco,
 * Enter e Espaço vêm do navegador (ARCHITECTURE.md §7).
 *
 * Cada final traz a própria tela: `theme` escolhe a paleta declarada em
 * base.css, `kicker` e `button` trocam o texto. Nada de cor ou de frase mora
 * aqui — este arquivo só sabe ONDE escrever, nunca O QUE.
 */

import { createGallery } from './gallery.js';

/** Quando o final não declara `kicker`, o veredito sai do `survives`. */
const KICKER_PADRAO = {
  true: 'PEDRO SOBREVIVEU 🎉',
  false: 'PEDRO PERDIDO 💥',
  null: 'INDEFINIDO ❓',
};

const BOTAO_PADRAO = 'DE NOVO 🔁';
const TEMA_PADRAO = 'fogo';

export function createEndingCard(el, { onRestart, endings = [] }) {
  const kicker = el.querySelector('#ending-kicker');
  const title = el.querySelector('#ending-title');
  const count = el.querySelector('#ending-count');
  const button = el.querySelector('#ending-restart');
  const gallery = createGallery(el.querySelector('#ending-gallery'));

  let armed = false;

  function fire() {
    if (!armed) return; // I1: engole o 2º clique de um duplo
    armed = false;
    button.disabled = true;
    onRestart();
  }

  return {
    /**
     * @param {object} o
     * @param {object} o.ending    o final da rodada, vindo de data/scenes.js
     * @param {number} o.seen      quantos finais o jogador já descobriu
     * @param {number} o.total     quantos existem no catálogo
     * @param {boolean} o.isNew    este final foi descoberto AGORA
     * @param {Set<string>} o.seenIds ids descobertos, para a coleção
     */
    show({ ending, seen = 0, total = 0, isNew = false, seenIds = new Set() }) {
      el.dataset.theme = ending.theme ?? TEMA_PADRAO;

      kicker.textContent = ending.kicker ?? KICKER_PADRAO[String(ending.survives)];
      title.textContent = ending.title ?? '';
      button.textContent = ending.button ?? BOTAO_PADRAO;

      const completo = total > 0 && seen >= total;
      count.textContent = `${completo ? '🏆 ' : ''}${seen} / ${total}`;
      count.hidden = !total;

      // A descoberta é o gancho do jogo: ela merece aparecer, mas numa linha
      // que já existe — sem elemento novo e sem empurrar o título.
      el.classList.toggle('is-new', isNew);
      el.classList.toggle('is-complete', completo);
      if (isNew) count.textContent = `✨ NOVO · ${count.textContent}`;

      gallery.render({ endings, seen: seenIds, currentId: ending.id });

      el.hidden = false;
      armed = true;
      button.disabled = false;
      button.addEventListener('click', fire);
      button.focus({ preventScroll: true });
    },

    hide() {
      armed = false;
      button.removeEventListener('click', fire);
      button.blur();
      el.hidden = true;
      el.classList.remove('is-new', 'is-complete');
    },
  };
}
