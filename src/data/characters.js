/* Explosive Peter — os personagens.
 *
 * Dado inerte (P1). TODOS usam o mesmo rig — o `<template id="tpl-actor">` do
 * index.html — variando só cor, proporção, rosto e um acessório (GDD §5).
 * Escrever o quinto personagem tem que custar 15 minutos, não 2 horas: é por
 * isso que não existe um template por personagem.
 *
 * Campos:
 *   nick       a plaquinha que flutua acima da cabeça, estilo Minecraft. Curta
 *              de propósito: é tag de jogador, não nome de crachá. Sem ela o
 *              ator entra em cena sem plaquinha (a bomba, por exemplo)
 *   h          altura total em unidades de design (1000 × 600)
 *   build      escala horizontal do corpo — 1 é normal, 1.35 é atarracado
 *   z          camada; a vítima fica na frente da bomba
 *   mark       posição padrão em cena, em unidades de design
 *   idle       animação de parado, em chars.css: breathe | sway | seethe
 *   enter      como ele entra em cena: { from, ms, gait }. É característica do
 *              PERSONAGEM, não da cena — o JP sempre sobe de baixo da tela
 *              (GDD §5), então nenhuma timeline precisa repetir isso. Um beat
 *              de `enter` ainda pode passar por cima, se a cena quiser
 *   shape      'blocky' tira o arredondamento dos membros (o Michas é do Minecraft)
 *   colors     --skin (cabeça e braços), --cloth (o tronco), --pants (as pernas),
 *              --outline (contorno), --accent (o acessório) e --eye opcional
 *              (os olhos vermelhos do Pedro Maligno). TODO MUNDO É HUMANO: pele
 *              é pele, roupa é roupa. `cloth` e `pants` são opcionais e caem na
 *              cor da pele quando ausentes
 *   face       fragmento SVG do rosto, dentro do <g class="face"> do rig
 *   accessory  fragmento SVG por cima de tudo (cabelo, túnica, barba, boné)
 *   hand       fragmento SVG injetado DENTRO do braço esquerdo, então ele gira
 *              junto com o gesto. É onde mora a taça do Vinicius
 *
 * Os fragmentos SVG usam três classes utilitárias definidas em chars.css:
 *   .ink   forma preenchida com contorno grosso — `style="--part:#cor"` troca o
 *          preenchimento; sem isso ela usa a cor de acento do personagem
 *   .line  traço sem preenchimento (sobrancelha, boca, olho semicerrado)
 *   .prop  <text> com emoji dentro do rig — escala, gira e sai de cena junto
 *          com o personagem. É emoji COMO DESENHO, o oposto do verbo `burst`
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
    nick: 'Pedro',
    h: 190,
    build: 1,
    z: 2,
    mark: { x: 470, y: 470 },
    idle: 'breathe',
    colors: {
      skin: '#f3c9a2', cloth: '#4fa8d8', pants: '#3a4668',
      outline: '#12141c', accent: '#4a3120',
    },
    // O sorriso enorme e fixo é a assinatura dele — nunca muda, aconteça o que acontecer.
    face: `
      <ellipse class="ink slim" style="--part:#ffffff" cx="48" cy="28" rx="8.5" ry="9.5" />
      <ellipse class="ink slim" style="--part:#ffffff" cx="72" cy="28" rx="8.5" ry="9.5" />
      <circle class="eye" cx="49" cy="29" r="4" />
      <circle class="eye" cx="73" cy="29" r="4" />
      <path class="line" style="stroke-width:4" d="M60 34 V41 H65" />
      <path class="line" d="M40 45 Q60 62 80 45" />
    `,
    // Cabelo: a mesma calota do boné do JP, com a franja recortada embaixo.
    accessory: `
      <path class="ink" style="--part:#4a3120"
            d="M28 32 A32 32 0 0 1 92 32 Q78 22 66 28 Q52 33 40 26 Q33 25 28 32 Z" />
    `,
  },

  /* -------------------------------------------------------------- *
   * Vinicius, o Estoico — salvador filosófico. Calmíssimo diante do
   * perigo. Túnica cinza, barba, olhos semicerrados — e a taça.
   * -------------------------------------------------------------- */
  vinicius: {
    id: 'vinicius',
    name: 'Vinicius, o Estoico',
    nick: 'Vinicius_oEstoico',
    h: 195,
    build: 1,
    z: 3,
    mark: { x: 300, y: 470 },
    idle: 'sway',
    // "Entra andando devagar pela esquerda" — devagar é o traço, não o acaso.
    enter: { from: 'left', ms: 1500, gait: 'walk' },
    colors: {
      skin: '#e8b98d', cloth: '#9b9aa6', pants: '#7f7e8a',
      outline: '#12141c', accent: '#a9a7b3',
    },
    // Olhos semicerrados: dois traços, não dois pontos. Boca reta — ele não ri.
    face: `
      <path class="line" style="stroke-width:4" d="M36 18 Q47 14 56 20" />
      <path class="line" style="stroke-width:4" d="M84 18 Q73 14 64 20" />
      <path class="line" d="M40 28 H56" />
      <path class="line" d="M64 28 H80" />
      <path class="line" style="stroke-width:4" d="M60 33 V40 H65" />
    `,
    // Cabelo, túnica cobrindo tronco e pernas, e a barba caindo do queixo.
    accessory: `
      <path class="ink" style="--part:#33302b" d="M28 30 A32 32 0 0 1 92 30 Q60 17 28 30 Z" />
      <path class="ink" d="M30 62 H90 L98 154 H22 Z" />
      <path class="ink" style="--part:#d5d1c4" d="M37 38 Q40 78 60 84 Q80 78 83 38 Q60 56 37 38 Z" />
    `,
    // A TAÇA. Dentro do braço esquerdo, então acompanha o gesto: no `zen` ela
    // inclina junto, no `wave` ela sobe junto. Emoji como DESENHO — nada aqui
    // voa pela tela.
    hand: `<text class="prop" x="16" y="126">🍷</text>`,
  },

  /* -------------------------------------------------------------- *
   * JP from the South — salvador raivoso. Anão bravo, muito baixo,
   * muito irritado. Boné, cara vermelha. Sempre sobe de baixo da tela.
   * -------------------------------------------------------------- */
  jp: {
    id: 'jp',
    name: 'JP from the South',
    nick: 'JPfromTheSouth',
    h: 112, // muito baixo: pouco mais da metade do Pedro
    build: 1.4, // e muito largo
    z: 3,
    mark: { x: 340, y: 470 },
    idle: 'seethe',
    // "SEMPRE sobe de baixo da tela", e já gritando.
    enter: { from: 'below', ms: 550, gait: 'hop' },
    colors: {
      skin: '#dd8f66', cloth: '#2f4a86', pants: '#2a2f3d',
      outline: '#12141c', accent: '#2f4a86',
    },
    // Sobrancelhas em V, olhos apertados, boca aberta gritando — e a "cara
    // vermelha" do GDD virou bochecha, não pele inteira: humano fica humano.
    face: `
      <path class="line" d="M36 17 L56 27" />
      <path class="line" d="M84 17 L64 27" />
      <ellipse class="ink slim" style="--part:#ffffff" cx="47" cy="33" rx="7" ry="7.5" />
      <ellipse class="ink slim" style="--part:#ffffff" cx="73" cy="33" rx="7" ry="7.5" />
      <circle class="eye" cx="48" cy="34" r="3.5" />
      <circle class="eye" cx="74" cy="34" r="3.5" />
      <circle class="ink slim" style="--part:#e2705c" cx="36" cy="42" r="5" />
      <circle class="ink slim" style="--part:#e2705c" cx="84" cy="42" r="5" />
      <ellipse class="ink" style="--part:#3d1620" cx="60" cy="52" rx="15" ry="10" />
    `,
    // Boné: calota sobre o alto da cabeça + aba saindo para a direita.
    accessory: `
      <path class="ink" d="M28 30 A32 32 0 0 1 92 30 Z" />
      <path class="ink" d="M86 26 H114 A5 5 0 0 1 114 34 H86 Z" />
    `,
  },

  /* -------------------------------------------------------------- *
   * Michas dos Mares — salvador caótico. Comanda os mares com o
   * tridente. Referência a Minecraft: tudo nele é blocado.
   * -------------------------------------------------------------- */
  michas: {
    id: 'michas',
    name: 'Michas dos Mares',
    nick: 'MichasDosMares',
    h: 200,
    build: 1.15,
    z: 3,
    mark: { x: 660, y: 470 },
    idle: 'breathe',
    shape: 'blocky', // tira o arredondamento de TODOS os membros de uma vez
    // "Emerge de uma onda que inunda a base da tela": a onda é o verbo `flood`,
    // na timeline; o que é dele é subir junto com ela.
    enter: { from: 'below', ms: 900 },
    colors: {
      skin: '#c98a5f', cloth: '#1f5580', pants: '#173a5c',
      outline: '#12141c', accent: '#9fb0c4', eye: '#132a3a',
    },
    // Cara de bloco: olhos quadrados e boca reta. Nada de curva.
    face: `
      <rect class="ink slim" style="--part:#ffffff" x="40" y="22" width="14" height="12" />
      <rect class="ink slim" style="--part:#ffffff" x="66" y="22" width="14" height="12" />
      <rect class="eye" x="44" y="25" width="7" height="7" />
      <rect class="eye" x="70" y="25" width="7" height="7" />
      <path class="line" d="M46 50 H74" />
    `,
    // Cabelo blocado (ele é do Minecraft) e o tridente na mão direita.
    accessory: `
      <rect class="ink" style="--part:#2b1d12" x="28" y="2" width="64" height="13" />
      <path class="ink slim" style="--part:#9fb0c4"
            d="M101 130 V26 H94 V2 H100 V18 H101 V0 H107 V18 H108 V2 H114 V26 H107 V130 Z" />
    `,
  },

  /* -------------------------------------------------------------- *
   * Pedro Maligno — o antagonista. Pedro de um universo paralelo.
   * Mesma silhueta, mesma respiração idiota. Só a cor, o sorriso e
   * os olhos mudam — e é exatamente isso que faz a piada funcionar.
   * -------------------------------------------------------------- */
  maligno: {
    id: 'maligno',
    name: 'Pedro Maligno',
    nick: 'Pedro_Maligno',
    h: 190, // idêntico ao Pedro. É uma cópia, não uma versão maior
    build: 1,
    z: 3,
    mark: { x: 620, y: 470 },
    idle: 'breathe', // a MESMA respiração do Pedro, o que piora tudo
    // Sai de uma fenda atrás do Pedro: cresce no lugar, não vem da borda.
    enter: { from: 'portal', ms: 620 },
    colors: {
      skin: '#cfa78e', cloth: '#3a1f5c', pants: '#241238',
      outline: '#0b0510', accent: '#8b2fd6', eye: '#ff2d2d',
    },
    // O MESMO rosto do Pedro, com o sorriso invertido e os olhos vermelhos.
    face: `
      <ellipse class="ink slim" style="--part:#f2e8f7" cx="48" cy="28" rx="8.5" ry="9.5" />
      <ellipse class="ink slim" style="--part:#f2e8f7" cx="72" cy="28" rx="8.5" ry="9.5" />
      <circle class="eye" cx="49" cy="29" r="4" />
      <circle class="eye" cx="73" cy="29" r="4" />
      <path class="line" style="stroke-width:4" d="M60 34 V41 H65" />
      <path class="line" d="M40 58 Q60 40 80 58" />
    `,
    // O mesmo cabelo do Pedro, preto.
    accessory: `
      <path class="ink" style="--part:#160b22"
            d="M28 32 A32 32 0 0 1 92 32 Q78 22 66 28 Q52 33 40 26 Q33 25 28 32 Z" />
    `,
  },
};
