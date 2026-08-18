/* Explosive Peter — o palco.
 *
 * P4: toda rodada remonta o palco do zero. Não existe "resetar classes" —
 * os atores são destruídos e clonados de novo a partir dos <template> do
 * index.html. É por isso que é impossível vazar estado visual (uma classe
 * .is-exploded esquecida, um balão de fala pendurado) de uma rodada para a
 * seguinte, e o custo disso é clonar meia dúzia de nós.
 *
 * Este módulo CRIA e DESTRÓI atores. Quem só modifica ator que já existe é
 * o actions.js (D3) — ver ARCHITECTURE.md §6.
 */

/** Posições iniciais, em unidades de design. Onde a cena sempre começa. */
const MARKS = {
  peter: { x: 470, y: 470 },
  bomb: { x: 620, y: 470 },
};

/** Marca de quem ainda não tem uma: em pé no chão, no meio do palco. */
const DEFAULT_MARK = { x: 500, y: 470 };

export function createStage({ cast, fx }) {
  /** @type {Map<string, HTMLElement>} */
  const actors = new Map();

  /** `mark` parcial é bem-vindo: `{ x: 320 }` mantém o y da marca padrão. */
  function spawn(name, mark) {
    const at = { ...(MARKS[name] ?? DEFAULT_MARK) };
    if (mark?.x !== undefined) at.x = mark.x;
    if (mark?.y !== undefined) at.y = mark.y;

    const tpl = document.getElementById(`tpl-${name}`);
    if (!tpl) {
      // P5: ator que falta não derruba a rodada.
      console.warn(`[stage] sem template para "${name}"`);
      return null;
    }
    const el = tpl.content.firstElementChild.cloneNode(true);
    el.style.setProperty('--x', at.x);
    el.style.setProperty('--y', at.y);
    cast.appendChild(el);
    actors.set(name, el);
    return el;
  }

  return {
    /** Limpa o palco inteiro: atores e efeitos. Chamado ao entrar em COUNTDOWN. */
    clear() {
      cast.replaceChildren();
      fx.replaceChildren();
      actors.clear();
    },

    spawn,

    /** O elenco fixo de toda rodada: a vítima e a bomba. */
    setUpRound() {
      this.clear();
      spawn('peter');
      spawn('bomb');
    },

    get: (name) => actors.get(name) ?? null,

    has: (name) => actors.has(name),
  };
}
