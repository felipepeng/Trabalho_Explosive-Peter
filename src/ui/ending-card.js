/* Explosive Peter — o card de final.
 *
 * I2: daqui só se sai por clique. O card em si NÃO é clicável — o único alvo
 * de clique do jogo inteiro é o botão, e sendo um `<button>` de verdade, foco,
 * Enter e Espaço vêm do navegador (ARCHITECTURE.md §7).
 *
 * Cada final traz a própria tela: `theme` escolhe a paleta declarada em
 * base.css, `kicker` e `button` trocam o texto. Nada de cor ou de frase mora
 * aqui — este arquivo só sabe ONDE escrever, nunca O QUE.
 *
 * D11: a manchete virou GENTE. Quem matou (ou salvou) o Pedro — o `cast.who`
 * do final — aparece posando e diz a `line` num balão, o mesmo balão do verbo
 * `say`. O `title` continua na tela, mas como legenda pequena embaixo.
 *
 * O balão é filho do ator (e não do card) de propósito: assim ele herda o
 * empurrão que a plaquinha de nick dá nele em chars.css, sem este arquivo
 * precisar saber que plaquinha existe.
 */

import { createGallery } from './gallery.js';
import { buildActor } from './rig.js';

/** Quando o final não declara `kicker`, o veredito sai do `survives`. */
const KICKER_PADRAO = {
  true: 'PEDRO SOBREVIVEU 🎉',
  false: 'PEDRO PERDIDO 💥',
  null: 'INDEFINIDO ❓',
};

const BOTAO_PADRAO = 'DE NOVO 🔁';
const TEMA_PADRAO = 'fogo';

/**
 * @param {HTMLElement} el
 * @param {object} o
 * @param {(endingId?: string) => void} o.onRestart  começa a rodada seguinte.
 *   Recebe um id quando o modo dev escolheu o final na coleção.
 * @param {object[]} o.endings
 * @param {boolean} [o.dev]  modo dev: destrava o clique na coleção.
 */
export function createEndingCard(el, { onRestart, endings = [], dev = false }) {
  const kicker = el.querySelector('#ending-kicker');
  const title = el.querySelector('#ending-title');
  const count = el.querySelector('#ending-count');
  const button = el.querySelector('#ending-restart');
  const cast = el.querySelector('#ending-cast');
  // Escolher um final é reiniciar com destino: passa pelo MESMO `armed` do
  // botão, então clique duplo e clique em rodada velha morrem igual (I1).
  const gallery = createGallery(el.querySelector('#ending-gallery'), {
    onPick: dev ? (id) => fire(id) : null,
  });

  let armed = false;

  /**
   * Põe o culpado em cena e coloca a fala na boca dele.
   *
   * Reusa o `buildActor` do palco em vez de desenhar um ator de card: é por
   * isso que o rig mora em `ui/rig.js` e não dentro do `stage.js`. Personagem
   * novo aparece aqui sem ninguém tocar neste arquivo.
   *
   * Sem `cast` no dado, a área fica vazia e o card cai no layout de sempre —
   * P5: final mal escrito é uma tela feia, nunca uma tela morta.
   */
  function dressCast(ending) {
    cast.replaceChildren();

    // A célula da grade onde ele posa. É dado do final (`cast.at`), não regra
    // deste arquivo: quem voou pede 'top', quem entrou pela esquerda pede
    // 'left'. Sem `at`, cai na direita.
    el.dataset.castAt = ending.cast?.at ?? 'right';

    const who = ending.cast?.who;
    if (!who) return;

    // `idle: false` — o card é uma foto parada; respiração aqui vira ruído.
    // `anchor: false` — ninguém entra em cena a partir do card.
    const actor = buildActor(who, { idle: false, anchor: false });
    if (!actor) return;

    if (ending.cast.pose) actor.classList.add(`pose-${ending.cast.pose}`);

    if (ending.line) {
      const balloon = document.createElement('p');
      balloon.className = 'balloon';
      balloon.textContent = ending.line;
      actor.appendChild(balloon);
    }

    cast.appendChild(actor);
  }

  /** @param {string} [endingId] final forçado pelo modo dev, se houver. */
  function fire(endingId) {
    if (!armed) return; // I1: engole o 2º clique de um duplo
    armed = false;
    button.disabled = true;
    onRestart(typeof endingId === 'string' ? endingId : undefined);
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

      dressCast(ending);

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
      cast.replaceChildren();
      button.removeEventListener('click', fire);
      button.blur();
      el.hidden = true;
      el.classList.remove('is-new', 'is-complete');
    },
  };
}
