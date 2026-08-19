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
 *   emojiNaFala  libera emoji na fala DESTE personagem — no `say` e na `line`
 *              do card. Sem o campo vale a regra do projeto: emoji é
 *              interface, nunca boca. Hoje só o Vinicius tem
 *   shape      'blocky' tira o arredondamento dos membros (o Michas é do Minecraft)
 *   rig        troca o rig humano pelo <template id="tpl-SEUVALOR"> do index.html.
 *              É a saída para quem não tem braço nem perna (o FIESTA) sem
 *              deixar de ser personagem: nick, marca, entrada e card continuam
 *              funcionando. Quem usa isso não tem face/hair/accessory — o
 *              desenho inteiro mora no template
 *   colors     --skin (cabeça e braços), --cloth (o tronco), --pants (as pernas),
 *              --outline (contorno), --accent (o acessório) e --eye opcional
 *              (os olhos vermelhos do Pedro Maligno). TODO MUNDO É HUMANO: pele
 *              é pele, roupa é roupa. `cloth` e `pants` são opcionais e caem na
 *              cor da pele quando ausentes
 *   face       fragmento SVG do rosto, dentro do <g class="face"> do rig
 *   hairBack   fragmento SVG do cabelo que cai para as COSTAS. Vai no primeiro
 *              filho do <g class="frame">, então é desenhado antes do corpo e
 *              dos braços e passa por trás deles. Como não é filho da cabeça,
 *              quem o mantém em fase com a respiração é o CSS (chars.css)
 *   hair       fragmento SVG do cabelo da FRENTE ou do chapéu. Entra DENTRO do
 *              <g class="head">, então acompanha a respiração e qualquer
 *              transform da cabeça — cabelo é parte da cabeça, não uma
 *              decalcomania flutuando ao lado dela
 *   accessory  fragmento SVG de CORPO, por cima de tudo (túnica, barba,
 *              tridente). Não é filho da cabeça: não respira junto
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
    // Centro exato do espaço de design (1000 × 600): ele fica no MESMO eixo
    // do timer e da tagline, que o #hud centraliza na janela. Mexeu aqui? o
    // `show maligno x` do final `maligno-troca` copia esta marca à mão.
    mark: { x: 500, y: 470 },
    idle: 'breathe',
    colors: {
      skin: '#f3c9a2', cloth: '#4fa8d8', pants: '#3a4668',
      outline: '#12141c', accent: '#4a3120',
    },
    // O sorriso enorme e fixo é a assinatura dele — nunca muda, aconteça o que acontecer.
    //
    // NÃO TEM BIGODE, e isso é decisão, não esquecimento: entre o olho (que
    // termina em y 39) e o traço da boca (que começa em y 43,5) existem 4,5
    // un. de pele. Cabe um traço fino, mas ele some no tamanho em que o Pedro
    // aparece em cena. Quem quiser um bigode de verdade precisa antes descer a
    // boca uns 4 un. — e aí a barba afina no queixo junto.
    //
    // A barba curta encosta em dois números:
    //   a borda de dentro passa por y 58-60, abaixo dos 55,5 em que o traço da
    //   boca termina. E ela é declarada ANTES da boca no fragmento, então a
    //   boca desenha por cima e o canto dela morre dentro da barba em vez de
    //   ficar boiando — o que importa no Maligno, cuja careta desce até y 59,5.
    // A borda de fora usa os mesmos cachos do cabelo (arcos r 7), e os cantos
    // de cima batem com as pontas da calota em (29,45) e (91,45): é o que faz
    // barba e costeleta parecerem a mesma peça.
    face: `
      <ellipse class="ink slim" style="--part:#ffffff" cx="48" cy="28" rx="8.5" ry="9.5" />
      <ellipse class="ink slim" style="--part:#ffffff" cx="72" cy="28" rx="8.5" ry="9.5" />
      <circle class="eye" cx="49" cy="29" r="4" />
      <circle class="eye" cx="73" cy="29" r="4" />
      <path class="ink" style="--part:#4a3120"
            d="M29 45 A7 7 0 0 0 33 53 A7 7 0 0 0 41 61 A7 7 0 0 0 52 66
               A7 7 0 0 0 60 67 A7 7 0 0 0 68 66 A7 7 0 0 0 79 61
               A7 7 0 0 0 87 53 A7 7 0 0 0 91 45
               C86 52 80 57 72 58 Q60 60 48 58 C40 57 34 52 29 45 Z" />
      <path class="line" d="M44 46 Q60 60 76 46" />
    `,
    // Cabelo longo e encaracolado, em DUAS peças: a massa que cai para as
    // costas (`hairBack`, desenhada antes do corpo) e a calota com a franja
    // (`hair`, dentro da cabeça). O cacho é a própria silhueta — cada trecho
    // do contorno é um arco `A` de raio pequeno estufando para fora da massa.
    //
    // Duas regras seguram o desenho:
    //   testa livre  nenhum cacho da franja desce de y 15 e a lateral da
    //                calota para em x 29/91, porque os olhos ocupam
    //                x 39,5–80,5 na faixa y 18,5–37,5. Encostar ali é o que
    //                fazia a franja antiga comer o olho
    //   volume       a calota sobe até y -4, ACIMA do viewBox de 180 — funciona
    //                porque `.actor > .rig` é overflow: visible (base.css)
    hairBack: `
      <path class="ink" style="--part:#4a3120"
            d="M38 14 A13 13 0 0 1 60 10 A13 13 0 0 1 82 14 A13 13 0 0 1 98 28
               A13 13 0 0 1 108 48 A13 13 0 0 1 112 70 A13 13 0 0 1 108 92
               A12 12 0 0 1 98 108 A12 12 0 0 1 80 116 A12 12 0 0 1 60 118
               A12 12 0 0 1 40 116 A12 12 0 0 1 22 108 A12 12 0 0 1 12 92
               A13 13 0 0 1 8 70 A13 13 0 0 1 12 48 A13 13 0 0 1 22 28
               A13 13 0 0 1 38 14 Z" />
    `,
    hair: `
      <path class="ink" style="--part:#4a3120"
            d="M60 11 A5 5 0 0 1 51 10 A5 5 0 0 1 42 10 A5 5 0 0 1 34 12
               C30 20 30 30 29 44 A6 6 0 0 1 22 47 A9 9 0 0 1 24 40
               A11 11 0 0 1 27 23 A11 11 0 0 1 34 9 A11 11 0 0 1 46 -1
               A11 11 0 0 1 60 -4 A11 11 0 0 1 74 -1 A11 11 0 0 1 86 9
               A11 11 0 0 1 93 23 A11 11 0 0 1 96 40
               A9 9 0 0 1 98 47 A6 6 0 0 1 91 44 C90 30 90 20 86 12
               A5 5 0 0 1 78 10 A5 5 0 0 1 69 10 A5 5 0 0 1 60 11 Z" />
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
    // A ÚNICA boca do jogo que pode usar emoji. A regra geral do projeto é
    // emoji em interface, nunca em fala — e ela continua valendo para todo o
    // resto do elenco. Ele é a exceção porque fecha frase de efeito com um,
    // e o validador lê ESTE campo em vez de conhecer o nome dele.
    emojiNaFala: true,
    // "Entra andando devagar pela esquerda" — devagar é o traço, não o acaso.
    enter: { from: 'left', ms: 1500, gait: 'walk' },
    colors: {
      skin: '#e8b98d', cloth: '#9b9aa6', pants: '#7f7e8a',
      outline: '#12141c', accent: '#8a6a4a',
    },
    // Olhos semicerrados: dois traços, não dois pontos. Boca reta — ele não ri.
    face: `
      <path class="line" style="stroke-width:4" d="M36 18 Q47 14 56 20" />
      <path class="line" style="stroke-width:4" d="M84 18 Q73 14 64 20" />
      <path class="line" d="M40 28 H56" />
      <path class="line" d="M64 28 H80" />
      <path class="line" style="stroke-width:4" d="M60 33 V40 H65" />
    `,
    // O cabelo sobe para a cabeça; túnica e barba são corpo e ficam no accessory.
    hair: `
      <path class="ink" style="--part:#33302b" d="M28 30 A32 32 0 0 1 92 30 Q60 17 28 30 Z" />
    `,
    accessory: `
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
    hair: `
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
      skin: '#9c6846', cloth: '#00847a', pants: '#4040a0',
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
    // Cabelo blocado (ele é do Minecraft) na cabeça; o tridente é do corpo.
    hair: `
      <rect class="ink" style="--part:#2b1d12" x="28" y="2" width="64" height="13" />
    `,
    accessory: `
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
    // O MESMO rosto do Pedro, barba inclusive, com o sorriso invertido e os
    // olhos vermelhos. A careta dele desce nas pontas até y 59,5 e cruza a
    // borda da barba: como a boca é declarada depois, o canto some dentro dela.
    face: `
      <ellipse class="ink slim" style="--part:#f2e8f7" cx="48" cy="28" rx="8.5" ry="9.5" />
      <ellipse class="ink slim" style="--part:#f2e8f7" cx="72" cy="28" rx="8.5" ry="9.5" />
      <circle class="eye" cx="49" cy="29" r="4" />
      <circle class="eye" cx="73" cy="29" r="4" />
      <path class="ink" style="--part:#160b22"
            d="M29 45 A7 7 0 0 0 33 53 A7 7 0 0 0 41 61 A7 7 0 0 0 52 66
               A7 7 0 0 0 60 67 A7 7 0 0 0 68 66 A7 7 0 0 0 79 61
               A7 7 0 0 0 87 53 A7 7 0 0 0 91 45
               C86 52 80 57 72 58 Q60 60 48 58 C40 57 34 52 29 45 Z" />
      <path class="line" d="M44 57 Q60 41 76 57" />
    `,
    // O MESMO cabelo do Pedro, preto — mesmos dois `d`, outra cor. A piada
    // depende de a silhueta ser idêntica: mexeu num, copie para o outro.
    hairBack: `
      <path class="ink" style="--part:#160b22"
            d="M38 14 A13 13 0 0 1 60 10 A13 13 0 0 1 82 14 A13 13 0 0 1 98 28
               A13 13 0 0 1 108 48 A13 13 0 0 1 112 70 A13 13 0 0 1 108 92
               A12 12 0 0 1 98 108 A12 12 0 0 1 80 116 A12 12 0 0 1 60 118
               A12 12 0 0 1 40 116 A12 12 0 0 1 22 108 A12 12 0 0 1 12 92
               A13 13 0 0 1 8 70 A13 13 0 0 1 12 48 A13 13 0 0 1 22 28
               A13 13 0 0 1 38 14 Z" />
    `,
    hair: `
      <path class="ink" style="--part:#160b22"
            d="M60 11 A5 5 0 0 1 51 10 A5 5 0 0 1 42 10 A5 5 0 0 1 34 12
               C30 20 30 30 29 44 A6 6 0 0 1 22 47 A9 9 0 0 1 24 40
               A11 11 0 0 1 27 23 A11 11 0 0 1 34 9 A11 11 0 0 1 46 -1
               A11 11 0 0 1 60 -4 A11 11 0 0 1 74 -1 A11 11 0 0 1 86 9
               A11 11 0 0 1 93 23 A11 11 0 0 1 96 40
               A9 9 0 0 1 98 47 A6 6 0 0 1 91 44 C90 30 90 20 86 12
               A5 5 0 0 1 78 10 A5 5 0 0 1 69 10 A5 5 0 0 1 60 11 Z" />
    `,
    // A ARMA. Mesmo mecanismo da 🍷 do Vinicius: emoji COMO DESENHO, dentro
    // do braço esquerdo, então gira junto no `pose-throw` — é o "mirar".
    hand: `<text class="prop" x="16" y="126">🔫</text>`,
  },

  /* -------------------------------------------------------------- *
   * FIESTA — o carro. Não é salvador nem antagonista: é um objeto de
   * 900 kg que aparece por acaso, no pior momento possível, e vai
   * embora sem explicar nada.
   *
   * Único do elenco com rig próprio (`rig: 'fiesta'`): um boneco
   * humano pintado de carro seria outra piada, e pior.
   * -------------------------------------------------------------- */
  fiesta: {
    id: 'fiesta',
    name: 'Fiesta',
    nick: 'FIESTA',
    rig: 'fiesta',
    // 130 de altura contra os 190 do Pedro — o carro é mais BAIXO que ele e
    // muito mais largo (o viewBox é 200 × 112, então isso dá ~232 de largura).
    h: 130,
    build: 1,
    // Na frente de todo mundo: ele cai POR CIMA da cena, não dentro dela.
    z: 4,
    // À direita do Pedro (que está em x 500) e sem cobrir a bomba (x 620).
    mark: { x: 760, y: 470 },
    // Carro parado balança na suspensão. É o mesmo `sway` do Vinicius — não
    // existe animação de parado por personagem, e nem deveria.
    idle: 'sway',
    // Ele SEMPRE cai do céu, e cai acelerando: o `gait` de queda troca a
    // desaceleração padrão da entrada por gravidade (juice.css).
    enter: { from: 'above', ms: 620, gait: 'queda' },
    // A buzina é a fala dele, e "BIBI 🚗" é a fala inteira. A permissão é do
    // PERSONAGEM, como a do Vinicius: um carro não tem boca humana, e o emoji
    // aqui é o próprio som saindo do capô.
    emojiNaFala: true,
    // Azul de carro popular; o acento é o cromado do para-choque.
    colors: {
      skin: '#2f7fd0', cloth: '#1f5da0', outline: '#12141c', accent: '#cfd6e2',
    },
  },
};
