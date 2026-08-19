/* Explosive Peter — o construtor do rig compartilhado.
 *
 * Um único `<template id="tpl-actor">` vestido com os dados de
 * `data/characters.js`: cor em custom property, proporção em `--h`/`--build`,
 * e o rosto, o cabelo e o acessório injetados nos slots `<g class="face">`,
 * `<g class="hair-back">`, `<g class="hair">` e `<g class="accessory">` (ARCHITECTURE.md §6).
 *
 * Mora aqui, e não em `stage.js`, porque tem DOIS clientes: o palco, que monta
 * o elenco da rodada, e o ending card, que põe o personagem posando ao lado do
 * título. Duplicar a montagem em dois lugares é a receita para o card ficar
 * desatualizado quando o rig mudar.
 *
 * Um personagem pode trazer o PRÓPRIO template pelo campo `rig` — é assim que
 * o FIESTA entra no elenco sem virar um boneco humano com rodas. Lá os slots de
 * rosto e cabelo não existem, e por isso toda injeção abaixo usa `?.`: campo
 * que não tem onde entrar é ignorado, não derruba a montagem (P5).
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
 * @param {boolean} [opts.tag]   pendura a plaquinha de nick acima da cabeça
 */
export function buildActor(id, { idle = true, anchor = true, tag = true } = {}) {
  const character = characters[id];
  if (!character) return null;

  // Quase todo mundo veste o rig humano. Quem declara `rig` traz o PRÓPRIO
  // template (o FIESTA, que não tem braço nem perna) e continua sendo
  // personagem para todo o resto do jogo: nick, entrada, marca e card de final.
  const tplId = character.rig ? `tpl-${character.rig}` : 'tpl-actor';
  const tpl = document.getElementById(tplId);
  if (!tpl) {
    console.warn(`[rig] falta o #${tplId} no index.html`);
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
  // Roupa e calça são opcionais: sem elas o CSS cai na cor da pele, e o
  // personagem continua sendo aquele boneco de uma cor só.
  if (character.colors?.cloth) el.style.setProperty('--cloth', character.colors.cloth);
  if (character.colors?.pants) el.style.setProperty('--pants', character.colors.pants);
  if (character.colors?.eye) el.style.setProperty('--eye', character.colors.eye);
  if (character.shape) el.classList.add(`shape-${character.shape}`);

  if (character.face) el.querySelector('.face')?.insertAdjacentHTML('afterbegin', character.face);
  // O cabelo das COSTAS entra antes de todo mundo, no primeiro filho do
  // .frame — `hairBack` cai atrás do corpo e dos braços. Ele não pode ser filho
  // da cabeça (SVG não tem z-index: quem desenha depois cobre), então a
  // sincronia com a respiração é feita no CSS, aplicando a MESMA animação com
  // a mesma duração e o mesmo atraso do `.head`.
  if (character.hairBack) {
    el.querySelector('.hair-back')?.insertAdjacentHTML('afterbegin', character.hairBack);
  }
  // O cabelo da frente entra DENTRO da cabeça, não na camada de acessório: é o
  // que o faz acompanhar o `idle-breathe` (que anima .head) sem descolar do crânio.
  if (character.hair) el.querySelector('.hair')?.insertAdjacentHTML('afterbegin', character.hair);
  if (character.accessory) {
    el.querySelector('.accessory')?.insertAdjacentHTML('afterbegin', character.accessory);
  }
  // `hand` entra DENTRO do braco esquerdo, e nao na camada de acessorio: assim
  // a taca do Vinicius gira junto com o gesto em vez de flutuar parada ao lado
  // de um braco levantado.
  if (character.hand) {
    el.querySelector('.arm-l')?.insertAdjacentHTML('beforeend', character.hand);
  }
  if (idle && character.idle) el.classList.add(`idle-${character.idle}`);

  // A PLAQUINHA DE NICK (estilo Minecraft). Filha do ator, então acompanha
  // entrada, tremida, saída e vaporização de graça — mesma razão do balão.
  //
  // `has-tag` publica no CSS que existe uma plaquinha aqui: é o que faz o
  // balão de fala subir para CIMA do nick em vez de cobri-lo. Ator sem nick
  // (a bomba) não ganha a classe, e o balão dele fica na altura de sempre.
  //
  // `textContent`, nunca insertAdjacentHTML: nick é texto, não fragmento SVG.
  if (tag && character.nick) {
    const plaquinha = document.createElement('span');
    plaquinha.className = 'nametag';
    plaquinha.textContent = character.nick;
    // O leitor de tela já recebe o nome pelo aria-label do rig; a plaquinha
    // seria o mesmo nome duas vezes.
    plaquinha.setAttribute('aria-hidden', 'true');
    el.appendChild(plaquinha);
    el.classList.add('has-tag');
  }

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
