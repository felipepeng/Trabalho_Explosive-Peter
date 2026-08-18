/* Explosive Peter — os personagens.
 *
 * Dado inerte (P1). TODOS usam o mesmo rig — o `<template id="tpl-actor">` do
 * index.html — variando só cor, proporção, rosto e um acessório (GDD §5).
 * Escrever o quinto personagem tem que custar 15 minutos, não 2 horas: é por
 * isso que não existe um template por personagem.
 *
 * Campos:
 *   h          altura total em unidades de design (1000 × 600)
 *   build      escala horizontal do corpo — 1 é normal, 1.35 é atarracado
 *   z          camada; a vítima fica na frente da bomba
 *   mark       posição padrão em cena, em unidades de design
 *   idle       animação de parado, em chars.css: breathe | sway | seethe
 *   enter      como ele entra em cena: { from, ms, gait }. É característica do
 *              PERSONAGEM, não da cena — o JP sempre sobe de baixo da tela
 *              (GDD §5), então nenhuma timeline precisa repetir isso. Um beat
 *              de `enter` ainda pode passar por cima, se a cena quiser
 *   colors     --skin (corpo), --outline (contorno), --accent (o acessório)
 *   face       fragmento SVG do rosto, dentro do <g class="face"> do rig
 *   accessory  fragmento SVG por cima de tudo (túnica, barba, boné, tridente)
 *
 * Os fragmentos SVG usam duas classes utilitárias definidas em chars.css:
 *   .ink   forma preenchida com contorno grosso — `style="--part:#cor"` troca o
 *          preenchimento; sem isso ela usa a cor de acento do personagem
 *   .line  traço sem preenchimento (sobrancelha, boca, olho semicerrado)
 *
 * O rig tem 120 × 180 de viewBox: cabeça em (60, 34) r 32, ombros em y ≈ 70,
 * quadril em y ≈ 124. Todo rosto e acessório é escrito nessas coordenadas.
 */

export const characters = {
  /* -------------------------------------------------------------- *
   * Pedro — a vítima. Sorridente, indefeso, imóvel. Nunca reage.
   * -------------------------------------------------------------- */
  peter: {
    id: 'peter',
    name: 'Pedro',
    h: 190,
    build: 1,
    z: 2,
    mark: { x: 470, y: 470 },
    idle: 'breathe',
    colors: { skin: '#f7f4ea', outline: '#12141c', accent: '#e0d8c2' },
    // O sorriso enorme e fixo é a assinatura dele — nunca muda, aconteça o que acontecer.
    face: `
      <circle class="eye" cx="48" cy="28" r="4.5" />
      <circle class="eye" cx="72" cy="28" r="4.5" />
      <path class="line" d="M38 40 Q60 62 82 40" />
    `,
    accessory: '',
  },

  /* -------------------------------------------------------------- *
   * Vinicius, o Estoico — salvador filosófico. Calmíssimo diante do
   * perigo. Túnica cinza, barba, olhos semicerrados.
   * -------------------------------------------------------------- */
  vinicius: {
    id: 'vinicius',
    name: 'Vinicius, o Estoico',
    h: 195,
    build: 1,
    z: 3,
    mark: { x: 300, y: 470 },
    idle: 'sway',
    // "Entra andando devagar pela esquerda" — devagar é o traço, não o acaso.
    enter: { from: 'left', ms: 1500, gait: 'walk' },
    colors: { skin: '#ece7d8', outline: '#12141c', accent: '#8d8b93' },
    // Olhos semicerrados: dois traços, não dois pontos. Boca reta — ele não ri.
    face: `
      <path class="line" d="M40 29 H56" />
      <path class="line" d="M64 29 H80" />
      <path class="line" d="M48 45 H72" />
    `,
    // Túnica cobrindo tronco e pernas, e a barba caindo do queixo.
    accessory: `
      <path class="ink" d="M30 62 H90 L98 154 H22 Z" />
      <path class="ink" style="--part:#d5d1c4" d="M37 38 Q40 78 60 84 Q80 78 83 38 Q60 56 37 38 Z" />
    `,
  },

  /* -------------------------------------------------------------- *
   * JP from the South — salvador raivoso. Anão bravo, muito baixo,
   * muito irritado. Boné, cara vermelha. Sempre sobe de baixo da tela.
   * -------------------------------------------------------------- */
  jp: {
    id: 'jp',
    name: 'JP from the South',
    h: 112, // muito baixo: pouco mais da metade do Pedro
    build: 1.4, // e muito largo
    z: 3,
    mark: { x: 340, y: 470 },
    idle: 'seethe',
    // "SEMPRE sobe de baixo da tela", e já gritando.
    enter: { from: 'below', ms: 550, gait: 'hop' },
    colors: { skin: '#e2705c', outline: '#12141c', accent: '#2f4a86' },
    // Sobrancelhas em V, olhos apertados e a boca sempre aberta gritando.
    face: `
      <path class="line" d="M38 19 L56 28" />
      <path class="line" d="M82 19 L64 28" />
      <circle class="eye" cx="47" cy="33" r="4" />
      <circle class="eye" cx="73" cy="33" r="4" />
      <ellipse class="ink" style="--part:#3d1620" cx="60" cy="50" rx="15" ry="11" />
    `,
    // Boné: calota sobre o alto da cabeça + aba saindo para a direita.
    accessory: `
      <path class="ink" d="M28 30 A32 32 0 0 1 92 30 Z" />
      <path class="ink" d="M86 26 H114 A5 5 0 0 1 114 34 H86 Z" />
    `,
  },
};

/** Ordem de referência do elenco. O picker nunca lê isto — é só documentação viva. */
export const CAST = ['peter', 'vinicius', 'jp'];
