/* Explosive Peter — o palco.
 *
 * P4: toda rodada remonta o palco do zero. Não existe "resetar classes" — os
 * atores são destruídos e construídos de novo. É por isso que é impossível
 * vazar estado visual (uma classe .is-exploded esquecida, um balão de fala
 * pendurado) de uma rodada para a seguinte, e o custo disso é clonar meia
 * dúzia de nós.
 *
 * Este módulo CRIA e DESTRÓI atores. Quem só modifica ator que já existe é o
 * actions.js — ver ARCHITECTURE.md §6.
 *
 * Dois caminhos de criação:
 *   personagem → o rig compartilhado, montado por ui/rig.js
 *   o resto    → um <template> próprio (#tpl-bomb), porque uma bomba não tem
 *                braço nem perna e não ganharia nada em usar o rig
 */

import { characters } from '../data/characters.js';
import { buildActor } from './rig.js';

/** Posição padrão de quem não é personagem (personagem traz a sua em `mark`). */
const MARKS = {
  bomb: { x: 620, y: 470 },
};

/** Último recurso: em pé no chão, no meio do palco. */
const DEFAULT_MARK = { x: 500, y: 470 };

/** Atores sem rig (a bomba, e o que o D6 inventar) vêm do próprio template. */
function cloneTemplate(name) {
  const tpl = document.getElementById(`tpl-${name}`);
  if (!tpl) {
    // P5: ator que falta não derruba a rodada.
    console.warn(`[stage] sem template para "${name}"`);
    return null;
  }
  return tpl.content.firstElementChild.cloneNode(true);
}

export function createStage({ cast, layers = [] }) {
  /** @type {Map<string, HTMLElement>} */
  const actors = new Map();

  /** `mark` parcial é bem-vindo: `{ x: 320 }` mantém o y padrão do ator. */
  function spawn(name, mark) {
    const character = characters[name];

    const at = { ...DEFAULT_MARK, ...(character?.mark ?? MARKS[name] ?? {}) };
    if (mark?.x !== undefined) at.x = mark.x;
    if (mark?.y !== undefined) at.y = mark.y;

    const el = character ? buildActor(name) : cloneTemplate(name);
    if (character && el) el.id = character.id;
    if (!el) return null;

    el.style.setProperty('--x', at.x);
    el.style.setProperty('--y', at.y);
    cast.appendChild(el);
    actors.set(name, el);
    return el;
  }

  return {
    /** Limpa o palco inteiro: atores e TODAS as camadas de efeito.
     *  Chamado ao entrar em COUNTDOWN — é o que sustenta P4/I3. */
    clear() {
      cast.replaceChildren();
      layers.forEach((layer) => layer?.replaceChildren());
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
