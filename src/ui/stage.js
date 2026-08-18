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
 *   personagem → o rig compartilhado (#tpl-actor) vestido com os dados de
 *                data/characters.js
 *   o resto    → um <template> próprio (#tpl-bomb), porque uma bomba não tem
 *                braço nem perna e não ganharia nada em usar o rig
 */

import { characters } from '../data/characters.js';

/** Posição padrão de quem não é personagem (personagem traz a sua em `mark`). */
const MARKS = {
  bomb: { x: 620, y: 470 },
};

/** Último recurso: em pé no chão, no meio do palco. */
const DEFAULT_MARK = { x: 500, y: 470 };

/**
 * Veste o rig compartilhado com os dados do personagem.
 *
 * `insertAdjacentHTML` com conteúdo de `data/` é seguro aqui e só aqui: são
 * fragmentos SVG escritos por nós no repositório, nunca entrada do jogador.
 * O jogo não tem campo de texto, servidor nem URL com parâmetro.
 */
function dressRig(character) {
  const tpl = document.getElementById('tpl-actor');
  if (!tpl) {
    console.warn('[stage] falta o #tpl-actor no index.html');
    return null;
  }

  const el = tpl.content.firstElementChild.cloneNode(true);
  el.id = character.id;
  el.dataset.actor = character.id;

  const rig = el.querySelector('.rig');
  rig.setAttribute('aria-label', character.name ?? character.id);

  el.style.setProperty('--h', character.h ?? 160);
  el.style.setProperty('--build', character.build ?? 1);
  el.style.setProperty('--z', character.z ?? 2);
  el.style.setProperty('--skin', character.colors?.skin ?? '#f5f1e6');
  el.style.setProperty('--outline', character.colors?.outline ?? '#12141c');
  el.style.setProperty('--accent', character.colors?.accent ?? '#cfc6ad');

  if (character.face) el.querySelector('.face').insertAdjacentHTML('afterbegin', character.face);
  if (character.accessory) {
    el.querySelector('.accessory').insertAdjacentHTML('afterbegin', character.accessory);
  }
  if (character.idle) el.classList.add(`idle-${character.idle}`);

  // O verbo `enter` é do engine/ e não pode importar data/. Então o padrão de
  // entrada do personagem viaja no próprio nó, e o beat continua podendo
  // sobrescrever. É o que mantém "o JP sempre sobe de baixo" fora do motor.
  if (character.enter?.from) el.dataset.enterFrom = character.enter.from;
  if (character.enter?.ms) el.dataset.enterMs = character.enter.ms;
  if (character.enter?.gait) el.dataset.enterGait = character.enter.gait;

  return el;
}

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

export function createStage({ cast, fx }) {
  /** @type {Map<string, HTMLElement>} */
  const actors = new Map();

  /** `mark` parcial é bem-vindo: `{ x: 320 }` mantém o y padrão do ator. */
  function spawn(name, mark) {
    const character = characters[name];

    const at = { ...DEFAULT_MARK, ...(character?.mark ?? MARKS[name] ?? {}) };
    if (mark?.x !== undefined) at.x = mark.x;
    if (mark?.y !== undefined) at.y = mark.y;

    const el = character ? dressRig(character) : cloneTemplate(name);
    if (!el) return null;

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
