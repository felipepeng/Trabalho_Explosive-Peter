/* Explosive Peter — o construtor do rig compartilhado.
 *
 * Um único `<template id="tpl-actor">` vestido com os dados de
 * `data/characters.js`: cor em custom property, proporção em `--h`/`--build`,
 * e o rosto e o acessório injetados nos slots `<g class="face">` e
 * `<g class="accessory">` (ARCHITECTURE.md §6).
 *
 * Mora aqui, e não em `stage.js`, porque tem DOIS clientes: o palco, que monta
 * o elenco da rodada, e o ending card, que põe o personagem posando ao lado do
 * título. Duplicar a montagem em dois lugares é a receita para o card ficar
 * desatualizado quando o rig mudar.
 *
 * `insertAdjacentHTML` com conteúdo de `data/` é seguro aqui e só aqui: são
 * fragmentos SVG escritos por nós no repositório, nunca entrada do jogador.
 * O jogo não tem campo de texto, servidor nem URL com parâmetro.
 */

import { characters } from '../data/characters.js';

/**
 * @param {string} id            id do personagem em data/characters.js
 * @param {object} [opts]
 * @param {boolean} [opts.idle]  liga a pose de parado (o palco quer; o card não)
 * @param {boolean} [opts.anchor] escreve os padrões de entrada no dataset
 */
export function buildActor(id, { idle = true, anchor = true } = {}) {
  const character = characters[id];
  if (!character) return null;

  const tpl = document.getElementById('tpl-actor');
  if (!tpl) {
    console.warn('[rig] falta o #tpl-actor no index.html');
    return null;
  }

  const el = tpl.content.firstElementChild.cloneNode(true);
  el.dataset.actor = character.id;

  const rig = el.querySelector('.rig');
  rig.setAttribute('aria-label', character.name ?? character.id);

  el.style.setProperty('--h', character.h ?? 160);
  el.style.setProperty('--build', character.build ?? 1);
  el.style.setProperty('--z', character.z ?? 2);
  el.style.setProperty('--skin', character.colors?.skin ?? '#f5f1e6');
  el.style.setProperty('--outline', character.colors?.outline ?? '#12141c');
  el.style.setProperty('--accent', character.colors?.accent ?? '#cfc6ad');
  if (character.colors?.eye) el.style.setProperty('--eye', character.colors.eye);
  if (character.shape) el.classList.add(`shape-${character.shape}`);

  if (character.face) el.querySelector('.face').insertAdjacentHTML('afterbegin', character.face);
  if (character.accessory) {
    el.querySelector('.accessory').insertAdjacentHTML('afterbegin', character.accessory);
  }
  if (idle && character.idle) el.classList.add(`idle-${character.idle}`);

  // O verbo `enter` é do engine/ e não pode importar data/. Então o padrão de
  // entrada do personagem viaja no próprio nó, e o beat continua podendo
  // sobrescrever. É o que mantém "o JP sempre sobe de baixo" fora do motor.
  if (anchor) {
    if (character.enter?.from) el.dataset.enterFrom = character.enter.from;
    if (character.enter?.ms) el.dataset.enterMs = character.enter.ms;
    if (character.enter?.gait) el.dataset.enterGait = character.enter.gait;
  }

  return el;
}

/** Marca padrão do personagem, em unidades de design. */
export function markOf(id) {
  return characters[id]?.mark ?? null;
}
