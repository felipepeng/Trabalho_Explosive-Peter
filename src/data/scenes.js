/* Explosive Peter — TODO o conteúdo do jogo.
 *
 * Dado inerte (P1): sem lógica, sem `if`, sem DOM, sem import. Adicionar uma
 * cena é escrever um objeto aqui — se exigir tocar em qualquer arquivo fora de
 * `src/data/`, o motor está errado (GDD, pilar 4).
 *
 * Contrato de um beat: `{ at, do, ...parâmetros }`, com `at` em ms RELATIVO à
 * âncora da própria timeline:
 *
 *   - timeline da cena  → conta a partir de `invadeAt`
 *   - timeline do final → conta a partir do clímax
 *
 * `climaxAt` é ABSOLUTO na rodada. Sem ele, o clímax é o último beat da cena
 * mais o JOIN_GAP.
 *
 * Toda posição está em unidades de design (1000 × 600), nunca em pixel. O chão
 * está em y 450; quem está de pé no palco tem y 470.
 *
 * `id` de final é PERMANENTE — é chave do save do jogador. `title` é livre.
 * A classificação de `survives` dos 15 finais está em ARCHITECTURE.md §7.1.
 *
 * Cada final também traz a PRÓPRIA TELA: `theme` (uma das paletas declaradas
 * em base.css), `kicker` (a linha acima do título), `button` (o texto do botão
 * de reinício), `icon` (o emoji da célula dele na galeria), `colors` (a
 * paleta só dele, que sobrescreve a do tema), `cast` (quem aparece posando
 * no card, em que pose e em que CANTO da tela) e `line` (o que ele FALA lá).

 * `cast.at` posiciona o personagem no card sem mexer no texto, que fica sempre
 * centralizado: `left · right · top · top-left · top-right · bottom-left ·
 * bottom-right`. A escolha segue a CENA — quem voou aparece no alto, quem
 * entrou pela esquerda aparece na esquerda.
 *
 * `line` é a manchete do final dita em primeira pessoa: quem matou (ou salvou)
 * o Pedro aparece na tela de reinício e fala. O `title` continua existindo,
 * mas como legenda pequena embaixo — a atração da tela é o personagem.
 * Vale a MESMA regra de emoji do `say`: `line` é fala, não é interface.
 *
 * `theme` continua mandando na ESTRUTURA (fonte, linhas de varredura);
 * `colors` manda na COR. É o que permite quinze cards diferentes sem quinze
 * blocos de CSS e sem o CSS conhecer um id de final.
 *
 * ⚠️ EMOJI: pode em kicker, botão e em qualquer texto de interface. NUNCA no
 * `text` de um beat `say` — fala de personagem é sem emoji, senão o Vinicius
 * estoico deixa de soar estoico.
 *
 * Orçamento: clímax + último beat do final + 600ms de pausa dramática tem que
 * caber em `MAX_ROUND_MS_DESIGN` — 20s, e não mais os 15s originais do GDD.
 * O motivo do aumento é legibilidade: as falas passavam rápido demais para
 * serem lidas, e o clímax agora cai DEPOIS do mostrador zerar, de propósito.
 * O teto continua sendo vigiado pelo validador em toda combinação cena × final.
 */

export const scenes = [
  /* ================================================================ *
   * §6.1 — a cena de fundação. O timer chega a zero. Nada acontece.
   * Pedro explode. É o ponto de referência de todo o humor do jogo:
   * a timeline vazia é a piada, não um TODO.
   *
   * SÓ APARECE NA PRIMEIRA RODADA DA VIDA DO JOGADOR. O `main.js` a força
   * enquanto `progress.firstRun`; o `weight: 0` garante que o picker nunca
   * mais a devolva depois disso. A piada só funciona uma vez — repetir a
   * explosão seca depois que o jogador já conhece a regra é só tédio.
   * ================================================================ */
  {
    id: 'ninguem-veio',
    character: null,
    weight: 0, // nunca sorteável: só entra pelo forçamento da primeira rodada
    invadeAt: 0,
    // 2s de silêncio DEPOIS do mostrador zerar. O timer chegar a zero e nada
    // acontecer é a piada inteira desta cena — agora ela tem tempo de doer.
    climaxAt: 12000,
    timeline: [],
    endings: [
      {
        id: 'ninguem-veio',
        title: 'NINGUÉM VEIO',
        weight: 1,
        survives: false,
        icon: '💥',
        theme: 'fogo',
        colors: { top: '#5a1d05', bot: '#100407', ink: '#ffe4cf', accent: '#ff7a3c' },
        cast: { who: 'peter', pose: 'burnt', at: 'left' },
        line: 'Eu esperei alguém vir. Ninguém veio.',
        kicker: 'AVISARAM QUE NÃO TINHA JEITO 💥',
        button: 'TENTAR OUTRA VEZ (INÚTIL) 🔁',
        timeline: [
          { at: 0, do: 'explode', target: 'bomb', intensity: 8, vaporize: ['peter', 'bomb'] },
          {
            at: 40, do: 'burst', who: 'bomb',
            emojis: ['💥', '🔥', '💀'], count: 14, power: 260, size: 34,
          },
        ],
      },
    ],
  },

  /* ================================================================ *
   * §6.2 — Vinicius, o Estoico.
   * Entra andando devagar aos 4s, atravessa o palco inteiro sem
   * pressa nenhuma e agarra a bomba com as duas mãos.
   * ================================================================ */
  {
    id: 'vinicius-segura',
    character: 'vinicius',
    weight: 3,
    invadeAt: 4000,
    // Ele segura até DEPOIS do fim: o mostrador zera aos 10s e ele continua
    // falando. Quem decide quando a rodada estoura é este número, não o timer.
    climaxAt: 12800,
    timeline: [
      // A 🍷 do Vinicius é FIGURINO: mora na mão dele, no rig. A 🗿 já foi
      // cenário aqui, solta no canto da tela — saiu de cena e virou o emoji
      // do `kicker` dos três finais desta cena, que é texto de interface.
      // 2,2s para atravessar: devagar é o traço dele, não sobra de tempo.
      // Marca a 560, colado no Pedro (500): ele pega a bomba JUNTO da
      // vítima, não num canto isolado — é o que os três finais precisam.
      { at: 0, do: 'enter', who: 'vinicius', x: 560, ms: 2200 },
      { at: 2600, do: 'say', who: 'vinicius', text: 'A dor é apenas opinião.', ms: 3000 },
      { at: 5200, do: 'grab', who: 'vinicius', target: 'bomb' },
      { at: 6200, do: 'say', who: 'vinicius', text: 'Está tudo sob controle. 👌', ms: 2600 },
    ],
    endings: [
      {
        // Segura a explosão entre as mãos. Pedro sobrevive.
        id: 'vin-contido',
        title: 'CONTIDO PELO ESTOICISMO',
        weight: 3,
        survives: true,
        icon: '🧘',
        theme: 'pedra',
        colors: { top: '#3b3d46', bot: '#121317', ink: '#f2efe4', accent: '#d8d0b6' },
        cast: { who: 'vinicius', pose: 'zen', at: 'right' },
        line: 'O que é externo não me toca🍷',
        kicker: 'A BOMBA PERDEU O DEBATE 🗿',
        button: 'FILOSOFAR MAIS UMA VEZ 🧘',
        timeline: [
          { at: 0, do: 'say', who: 'vinicius', text: 'Vou tentar conter a explosão🗿', ms: 3000 },
          { at: 900, do: 'explode', target: 'bomb', intensity: 4, vaporize: ['bomb'] },
          // a explosão que ele contém escapa entre os dedos
          {
            at: 950, do: 'burst', who: 'vinicius',
            emojis: ['💥'], count: 8, power: 140, size: 26,
          },
          { at: 1300, do: 'shake', intensity: 2 },
        ],
      },
      {
        // Abraça a bomba, caminha para fora da tela e explode sozinho.
        // A bomba vai junto de graça: depois do grab ela é filha dele.
        id: 'vin-memento',
        title: 'MEMENTO MORI',
        weight: 3,
        survives: true,
        icon: '🕯️',
        theme: 'pedra',
        colors: { top: '#4a3a26', bot: '#14100b', ink: '#fdf1de', accent: '#f0c987' },
        cast: { who: 'vinicius', pose: 'burnt', at: 'right' },
        line: 'O fim é o que dá sentido a jornada🗿',
        kicker: 'ELE PEDIU LICENÇA ANTES 🗿',
        button: 'ACENDER OUTRA VELA 🕯️',
        timeline: [
          { at: 0, do: 'say', who: 'vinicius', text: 'Amor fati.', ms: 2200 },
          { at: 1000, do: 'exit', who: 'vinicius', to: 'right', ms: 1800, gait: 'walk' },
          { at: 2900, do: 'flash' },
          { at: 2950, do: 'shake', intensity: 7 },
          // a explosão é fora de cena: o que se vê é o que volta voando de lá
          {
            at: 2950, do: 'burst', x: 950, y: 430,
            emojis: ['💥', '🔥'], count: 11, power: 260, dir: -65, spread: 80, size: 30,
          },
        ],
      },
      {
        // Analisa a situação com calma demais. Os dois explodem.
        id: 'vin-dicotomia',
        title: 'A DICOTOMIA DO CONTROLE',
        weight: 2,
        survives: false,
        icon: '⏳',
        theme: 'fogo',
        colors: { top: '#57330a', bot: '#140a06', ink: '#ffeed8', accent: '#ffa63c' },
        cast: { who: 'vinicius', pose: 'burnt', at: 'right' },
        line: 'Reclamar do fim é não ter entendido o começo. 🗿',
        kicker: 'ANALISOU ATÉ EXPLODIR 🗿',
        button: 'PENSAR UM POUCO MENOS ⏳',
        timeline: [
          { at: 0, do: 'say', who: 'vinicius', text: 'Não estava sob meu controle.', ms: 2800 },
          {
            at: 1600,
            do: 'explode',
            target: 'bomb',
            intensity: 9,
            vaporize: ['peter', 'bomb', 'vinicius'],
          },
          {
            at: 1640, do: 'burst', who: 'bomb',
            emojis: ['💥', '🔥', '💀'], count: 14, power: 270, size: 32,
          },
        ],
      },
    ],
  },

  /* ================================================================ *
   * §6.5 — JP from the South.
   * Sobe de baixo da tela aos 3s, já gritando. Fica ao lado da bomba
   * berrando o tempo todo — o que ele consegue fazer com isso é que
   * muda de final para final.
   * ================================================================ */
  {
    id: 'jp-de-baixo',
    character: 'jp',
    weight: 3,
    invadeAt: 3000,
    // O mostrador zera aos 10s e ele continua pulando. O timer é mentiroso
    // (GDD §3.2) — e agora dá tempo de ler os três berros.
    climaxAt: 12000,
    timeline: [
      { at: 0, do: 'enter', who: 'jp', x: 730 },
      { at: 350, do: 'say', who: 'jp', text: 'EU RESOLVO ISSO!', ms: 2200 },
      { at: 1200, do: 'pose', who: 'jp', as: 'jump' },
      { at: 2800, do: 'say', who: 'jp', text: 'CADÊ QUE EU ALCANÇO?!', ms: 2600 },
      // cada tentativa frustrada solta raiva. Momento-chave, não enfeite de fundo
      {
        at: 4200, do: 'burst', who: 'jp',
        emojis: ['💢'], count: 5, power: 110, spread: 70, size: 22, ms: 700,
      },
      { at: 6400, do: 'say', who: 'jp', text: 'TÔ QUASE!', ms: 2600 },
      {
        at: 8200, do: 'burst', who: 'jp',
        emojis: ['💢', '😤'], count: 6, power: 120, spread: 80, size: 22, ms: 700,
      },
    ],
    endings: [
      {
        // Não alcança a bomba. Pula, xinga, tenta de novo, o timer zera.
        id: 'jp-alcance',
        title: 'BAIXO IMPACTO',
        weight: 3,
        survives: false,
        icon: '📏',
        theme: 'fogo',
        colors: { top: '#5c2a0a', bot: '#150705', ink: '#ffe8d4', accent: '#ff8a3c' },
        cast: { who: 'jp', pose: 'reach', at: 'bottom-right' },
        line: 'Faltou tão pouco. Você viu?',
        kicker: 'FALTARAM UNS 30 CENTÍMETROS 📏',
        button: 'CRESCER E VOLTAR 📏',
        timeline: [
          { at: 0, do: 'say', who: 'jp', text: 'PERA—', ms: 1200 },
          {
            at: 800,
            do: 'explode',
            target: 'bomb',
            intensity: 9,
            vaporize: ['peter', 'bomb', 'jp'],
          },
          {
            at: 840, do: 'burst', who: 'bomb',
            emojis: ['💥', '🔥', '📏'], count: 14, power: 270, size: 32,
          },
        ],
      },
      {
        // Corta o pavio com tesoura. Era o fio errado.
        id: 'jp-fio-errado',
        title: 'CORTOU O FIO ERRADO',
        weight: 3,
        survives: false,
        icon: '✂️',
        theme: 'fogo',
        colors: { top: '#5e1a12', bot: '#140404', ink: '#ffe1da', accent: '#ff5f4d' },
        cast: { who: 'jp', pose: 'shrug', at: 'bottom-left' },
        line: 'Era o azul. Eu tinha certeza.',
        kicker: 'ERA O OUTRO FIO ✂️',
        button: 'CORTAR UM FIO DIFERENTE ✂️',
        timeline: [
          { at: 0, do: 'pose', who: 'jp', as: 'jump', off: true },
          { at: 0, do: 'pose', who: 'jp', as: 'reach' },
          { at: 450, do: 'pose', who: 'bomb', as: 'cut' },
          // o corte é um momento-chave: três lascas de pavio e nada mais
          {
            at: 470, do: 'burst', who: 'bomb',
            emojis: ['✂️'], count: 3, power: 90, spread: 120, size: 22, ms: 700, sfx: 'corte',
          },
          { at: 700, do: 'say', who: 'jp', text: 'PRONTO. RESOLVIDO.', ms: 2400 },
          {
            at: 2400,
            do: 'explode',
            target: 'bomb',
            intensity: 9,
            vaporize: ['peter', 'bomb', 'jp'],
          },
          {
            at: 2440, do: 'burst', who: 'bomb',
            emojis: ['💥', '🔥'], count: 13, power: 260, size: 32,
          },
        ],
      },
      {
        // Usa o próprio Pedro como projétil. Pedro sobrevive, machucado.
        id: 'jp-arremesso',
        title: 'ARREMESSO DE PEDRO',
        weight: 2,
        survives: true,
        icon: '🥏',
        theme: 'festa',
        colors: { top: '#4f3f08', bot: '#15110a', ink: '#fff5d4', accent: '#ffcf47' },
        cast: { who: 'jp', pose: 'throw', at: 'right' },
        line: 'Te joguei longe. De nada.',
        kicker: 'VOOU, MAS VOOU VIVO 🥏',
        button: 'ARREMESSAR MAIS LONGE 🥏',
        timeline: [
          { at: 0, do: 'pose', who: 'jp', as: 'jump', off: true },
          { at: 0, do: 'say', who: 'jp', text: 'VEM CÁ!', ms: 1600 },
          { at: 300, do: 'pose', who: 'jp', as: 'throw' },
          { at: 450, do: 'exit', who: 'peter', to: 'left', ms: 650 },
          // o rastro do arremesso: leque estreito apontado para a esquerda
          {
            at: 470, do: 'burst', who: 'peter',
            emojis: ['💨'], count: 6, power: 200, dir: -80, spread: 40, gravity: 0,
            size: 26, ms: 800, sfx: 'whoosh',
          },
          { at: 1600, do: 'explode', target: 'bomb', intensity: 9, vaporize: ['bomb', 'jp'] },
          {
            at: 1640, do: 'burst', who: 'bomb',
            emojis: ['💥', '🔥'], count: 13, power: 260, size: 32,
          },
        ],
      },
    ],
  },

  /* ================================================================ *
   * §6.3 — Michas dos Mares.
   * A base da tela inunda aos 3s e ele emerge com o tridente. É a
   * cena com mais finais (4), e a única com um raro.
   * ================================================================ */
  {
    id: 'michas-mar',
    character: 'michas',
    weight: 3,
    invadeAt: 3000,
    climaxAt: 13000,
    timeline: [
      { at: 0, do: 'flood', height: 140, ms: 1100 },
      { at: 500, do: 'enter', who: 'michas', x: 760 },
      { at: 1200, do: 'say', who: 'michas', text: 'O MAR OBEDECE.', ms: 2600 },
      // bolhas: `gravity: -1` é o que faz partícula subir em vez de cair
      {
        at: 2400, do: 'burst', x: 560, y: 330,
        emojis: ['🫧'], count: 9, power: 100, spread: 60, gravity: -1, size: 24, ms: 1800,
      },
      { at: 5200, do: 'grab', who: 'michas', target: 'bomb' },
      { at: 7200, do: 'say', who: 'michas', text: 'AGORA SEGURA.', ms: 2800 },
      {
        at: 9000, do: 'burst', x: 720, y: 330,
        emojis: ['🫧', '💧'], count: 8, power: 90, spread: 70, gravity: -1, size: 22, ms: 1800,
      },
    ],
    endings: [
      {
        // Arremessa a bomba ao céu com o tridente. Fogo de artifício.
        // Três estouros seguidos em posições diferentes do céu — a piada é
        // de ritmo, não de efeito novo.
        id: 'mic-correnteza',
        title: 'ENCANTAMENTO NÍVEL III',
        weight: 3,
        survives: true,
        icon: '🎆',
        theme: 'festa',
        colors: { top: '#5a4106', bot: '#171109', ink: '#fff6d8', accent: '#ffd23d' },
        cast: { who: 'michas', pose: 'celebrate', at: 'right' },
        line: 'A água levou a bomba. A água sempre leva.',
        kicker: 'ISSO VIROU RÉVEILLON 🎆',
        button: 'SOLTAR OUTRO FOGUETE 🎆',
        timeline: [
          { at: 0, do: 'pose', who: 'michas', as: 'throw' },
          { at: 250, do: 'exit', who: 'bomb', to: 'above', ms: 600 },
          { at: 1000, do: 'explode', x: 640, y: 120, intensity: 3, vaporize: ['bomb'] },
          {
            at: 1040, do: 'burst', x: 640, y: 120,
            emojis: ['🎆', '✨'], count: 12, power: 230, size: 30, ms: 1200,
          },
          { at: 1600, do: 'explode', x: 480, y: 175, intensity: 2 },
          {
            at: 1640, do: 'burst', x: 480, y: 175,
            emojis: ['🎇', '✨'], count: 10, power: 200, size: 28, ms: 1200,
          },
          { at: 2200, do: 'explode', x: 790, y: 140, intensity: 2 },
          {
            at: 2240, do: 'burst', x: 790, y: 140,
            emojis: ['🎆', '⭐'], count: 10, power: 210, size: 28, ms: 1200,
          },
        ],
      },
      {
        // O mar apaga o pavio, mas afoga o Pedro. Bomba desarmada, Pedro morto.
        id: 'mic-afogado',
        title: 'NÃO ERA ESSE TIPO DE SALVAMENTO',
        weight: 3,
        survives: false,
        icon: '🌊',
        theme: 'mar',
        colors: { top: '#084a6d', bot: '#02131e', ink: '#dbf3ff', accent: '#54c6f0' },
        cast: { who: 'michas', pose: 'shrug', at: 'left' },
        line: 'A bomba eu desarmei.',
        kicker: 'TECNICAMENTE, DESARMOU 🌊',
        button: 'SALVAR UM POUCO MENOS 🌊',
        timeline: [
          { at: 0, do: 'flood', height: 210, ms: 900 },
          { at: 700, do: 'pose', who: 'bomb', as: 'cut' },
          { at: 900, do: 'say', who: 'michas', text: 'PAVIO APAGADO.', ms: 2600 },
          { at: 1800, do: 'exit', who: 'peter', to: 'below', ms: 900 },
          // o Pedro afundando: as bolhas são a última coisa que sobe dele
          {
            at: 2100, do: 'burst', who: 'peter',
            emojis: ['🫧', '💧'], count: 10, power: 120, spread: 60, gravity: -1,
            size: 24, ms: 1800,
          },
        ],
      },
      {
        // A bomba não liga para a água. Explosão subaquática em câmera lenta.
        id: 'mic-subaquatica',
        title: "À PROVA D'ÁGUA",
        weight: 2,
        survives: false,
        icon: '🫧',
        theme: 'mar',
        colors: { top: '#0a2f4a', bot: '#010a12', ink: '#d2ecf5', accent: '#6fd3e8' },
        cast: { who: 'peter', pose: 'dead', at: 'bottom-left' },
        line: 'A bomba nadava melhor que eu.',
        kicker: 'A BOMBA APRENDEU A NADAR 🫧',
        button: 'MOLHAR OUTRO PEDRO 🫧',
        timeline: [
          { at: 0, do: 'flood', height: 210, ms: 900 },
          { at: 900, do: 'say', who: 'michas', text: 'ISSO NÃO DEVERIA—', ms: 2200 },
          {
            at: 1800,
            do: 'explode',
            target: 'bomb',
            intensity: 6,
            ms: 2200, // câmera lenta: a bola de fogo abre em 2,2s em vez de 0,7s
            vaporize: ['peter', 'bomb', 'michas'],
          },
          // debaixo d'água até o estilhaço sobe devagar: bolha, não fogo
          {
            at: 1850, do: 'burst', who: 'bomb',
            emojis: ['🫧', '💥', '💧'], count: 14, power: 170, spread: 300,
            gravity: -1, size: 28, ms: 2400,
          },
        ],
      },
      {
        // RARO. A bomba vira item flutuante, Michas cata e sai andando.
        id: 'mic-drop',
        title: 'DROP RARO',
        weight: 1,
        survives: true,
        icon: '⭐',
        theme: 'drop',
        colors: { top: '#0e5231', bot: '#03170e', ink: '#dcffec', accent: '#4dee95' },
        cast: { who: 'michas', pose: 'celebrate', at: 'right' },
        line: 'Dropou. Isso não acontece nunca.',
        kicker: 'DROP DE 1%. NINGUÉM VIU ⭐',
        button: 'FARMAR MAIS UM POUCO ⛏️',
        timeline: [
          { at: 0, do: 'pose', who: 'bomb', as: 'item' },
          // o brilho de item lendário: sobe devagar e fica pouco
          {
            at: 60, do: 'burst', who: 'bomb',
            emojis: ['⭐', '✨'], count: 10, power: 120, spread: 90, gravity: -1,
            size: 26, ms: 1600, sfx: 'drop',
          },
          { at: 500, do: 'say', who: 'michas', text: 'DROPOU.', ms: 2600 },
          { at: 2200, do: 'exit', who: 'michas', to: 'right', ms: 1200 },
        ],
      },
    ],
  },

  /* ================================================================ *
   * §6.4 — Pedro Maligno, o rival.
   *
   * A bomba falha, tudo parece tranquilo — e é exatamente aí que a fenda
   * roxa se abre atrás do Pedro. O Maligno não vem desarmar nada: ele é o
   * perigo de verdade desta cena, e chega dizendo isso. É a cena RÁPIDA do
   * jogo: ele mexe no relógio assim que chega, então o clímax vem bem antes
   * dos 10s de todas as outras. O timer é mentiroso (GDD §3.2) e esta é a
   * cena que prova.
   * ================================================================ */
  {
    id: 'maligno-portal',
    character: 'maligno',
    weight: 3,
    invadeAt: 5000,
    // O mostrador zera em 11167ms por causa do setTimer abaixo (9500 + 5/3 s).
    // Os dois números precisam bater NA MÃO: o validador não confere isso.
    climaxAt: 11300,
    timeline: [
      // A bomba falha primeiro — mesmo padrão visual de "isso deu certo" que
      // `fiesta-do-ceu` usa (pose de pavio cortado + som de fracasso). É o
      // que faz o portal seguinte doer: o jogador já tinha relaxado.
      { at: 0, do: 'pose', who: 'bomb', as: 'cut', sfx: 'fracasso' },
      { at: 900, do: 'portal', x: 380, y: 320, w: 150, h: 240 },
      // a fenda abrindo cospe o que tem dentro
      {
        at: 1020, do: 'burst', x: 380, y: 320,
        emojis: ['🌀'], count: 9, power: 150, gravity: 0, size: 28, ms: 1300,
      },
      { at: 1200, do: 'enter', who: 'maligno', x: 380 },
      // Uma fala só: ele não veio "ver de perto", veio disputar.
      {
        at: 1800, do: 'say', who: 'maligno',
        text: 'Finalmente encontrei um oponente digno.', ms: 2600,
      },
      // de ~0,5 para 5, correndo 3× mais rápido: zera aos 11167ms
      { at: 4500, do: 'setTimer', to: 5, rate: 3 },
      { at: 4600, do: 'shake', intensity: 3 },
    ],
    endings: [
      {
        // LOOP TEMPORAL. O Maligno atira primeiro — mas quem "morreu" no
        // outro universo sempre volta pra revidar. `hide`/`show` no MESMO
        // ator peter (nunca dois Pedros em cena — o palco só guarda um ator
        // por nome): o corte de universo é o `flash`, o mesmo mecanismo que
        // `mal-troca` usa pra teletransportar.
        id: 'mal-paradoxo',
        title: 'PARADOXO',
        weight: 3,
        survives: false,
        icon: '🌀',
        theme: 'fenda',
        colors: { top: '#3f1266', bot: '#0c0219', ink: '#f3e2ff', accent: '#b96cf5' },
        // Quem disparou por último foi o Pedro — é ele quem fala no card,
        // na MESMA pose do rival: a piada é que os dois viraram espelho.
        cast: { who: 'peter', pose: 'throw', at: 'left' },
        line: 'Eu sempre volto.',
        kicker: 'NINGUÉM FICA DO OUTRO LADO 🌀',
        button: 'RODAR O PARADOXO 🌀',
        timeline: [
          { at: 0, do: 'pose', who: 'maligno', as: 'throw' },
          {
            at: 60, do: 'burst', who: 'maligno',
            emojis: ['🔫', '💥'], count: 6, power: 200, dir: -75, spread: 40,
            gravity: 0, size: 24, ms: 500,
          },
          // o Pedro "morre" com um hide, não um vaporize: ele volta depois,
          // e vaporize não tem como ser desfeito (ARCHITECTURE.md §6)
          { at: 180, do: 'hide', who: 'peter' },
          { at: 220, do: 'pose', who: 'maligno', as: 'throw', off: true },
          {
            at: 700, do: 'say', who: 'maligno',
            text: 'Vou voltar pro meu universo.', ms: 2000,
          },
          // o corte de universo: o mesmo flash que a troca de universos usa
          { at: 2900, do: 'flash', ms: 200 },
          { at: 2960, do: 'show', who: 'peter' },
          { at: 2960, do: 'pose', who: 'peter', as: 'throw' },
          {
            at: 3060, do: 'burst', who: 'peter',
            emojis: ['🔫', '💥'], count: 6, power: 200, dir: -105, spread: 40,
            gravity: 0, size: 24, ms: 500,
          },
          {
            at: 3200, do: 'explode', x: 380, y: 400, intensity: 7,
            vaporize: ['maligno'],
          },
          {
            at: 3240, do: 'burst', x: 380, y: 400,
            emojis: ['💥', '🌀'], count: 12, power: 240, size: 30,
          },
          {
            at: 3300, do: 'say', who: 'peter',
            text: 'Vou voltar pro meu universo.', ms: 2200,
          },
        ],
      },
      {
        // Troca de lugar com o Pedro. O bom é salvo, o maligno explode rindo.
        id: 'mal-troca',
        title: 'TROCA DE UNIVERSOS',
        weight: 3,
        survives: true,
        icon: '🔮',
        theme: 'fenda',
        colors: { top: '#2b1560', bot: '#08021a', ink: '#e9e4ff', accent: '#8f7bff' },
        cast: { who: 'peter', pose: 'shrug', at: 'left' },
        line: 'Explodiu o outro. Eu não vou perguntar.',
        kicker: 'EXPLODIU O PEDRO ERRADO 🔮',
        button: 'TROCAR DE UNIVERSO 🔮',
        timeline: [
          { at: 0, do: 'flash', ms: 200 },
          { at: 60, do: 'hide', who: 'peter' },
          { at: 60, do: 'hide', who: 'maligno' },
          { at: 200, do: 'show', who: 'peter', x: 180 },
          { at: 200, do: 'show', who: 'maligno', x: 500 },
          // a troca de lugar é o momento-chave: os dois universos se cruzando
          {
            at: 220, do: 'burst', x: 325, y: 380,
            emojis: ['🌀', '🔮'], count: 10, power: 190, gravity: 0, size: 28,
            ms: 1100, sfx: 'portal',
          },
          { at: 500, do: 'say', who: 'maligno', text: 'HAHAHA— ah.', ms: 2400 },
          {
            at: 1800,
            do: 'explode',
            target: 'bomb',
            intensity: 9,
            vaporize: ['bomb', 'maligno'],
          },
          {
            at: 1840, do: 'burst', who: 'bomb',
            emojis: ['💥', '🔥'], count: 13, power: 260, size: 32,
          },
        ],
      },
      {
        // O Maligno agarra a bomba desarmada e a joga de volta pro Pedro —
        // não é mais desarme, é ataque direto. Ela reativa no ar. Metade
        // das vezes ele acerta o Pedro; a outra metade o Pedro devolve o
        // saque e acerta ELE. Dois finais, mesmo peso, moeda no ar.
        id: 'mal-arremesso-peter',
        title: 'DEVOLUTIVA NEGADA',
        weight: 2,
        survives: false,
        icon: '🎯',
        theme: 'fogo',
        colors: { top: '#5c0f1a', bot: '#120306', ink: '#ffe0e6', accent: '#ff3d5c' },
        cast: { who: 'maligno', pose: 'celebrate', at: 'right' },
        line: 'Bomba dele. Pontaria minha.',
        kicker: 'REATIVOU NO AR 🎯',
        button: 'JOGAR DE NOVO 🎯',
        timeline: [
          { at: 0, do: 'grab', who: 'maligno', target: 'bomb' },
          { at: 300, do: 'pose', who: 'maligno', as: 'throw' },
          // a bomba viaja até o Pedro: some da mão dele e reaparece lá,
          // o mesmo corte instantâneo que `mal-troca` usa pra teletransportar
          { at: 500, do: 'hide', who: 'bomb' },
          {
            at: 520, do: 'burst', x: 480, y: 350,
            emojis: ['💨'], count: 8, power: 240, dir: 80, spread: 30,
            gravity: 0, size: 26, ms: 400, sfx: 'whoosh',
          },
          { at: 900, do: 'show', who: 'bomb', x: 500 },
          { at: 940, do: 'pose', who: 'maligno', as: 'throw', off: true },
          {
            at: 1000, do: 'explode', target: 'peter', intensity: 10,
            vaporize: ['peter', 'bomb'],
          },
          // exagerado de propósito: é o final "ela acertou", tem que doer
          {
            at: 1040, do: 'burst', who: 'peter',
            emojis: ['💥', '🔥', '💀', '🎯'], count: 20, power: 300, size: 36,
          },
          { at: 1060, do: 'shake', intensity: 10 },
          { at: 1400, do: 'say', who: 'maligno', text: 'De nada.', ms: 2200 },
        ],
      },
      {
        id: 'mal-arremesso-maligno',
        title: 'O SAQUE VOLTOU',
        weight: 2,
        survives: true,
        icon: '🏐',
        theme: 'fenda',
        colors: { top: '#2b1560', bot: '#08021a', ink: '#e9e4ff', accent: '#8f7bff' },
        cast: { who: 'peter', pose: 'celebrate', at: 'left' },
        line: 'Devolvi o presente.',
        kicker: 'ELE NÃO ESPERAVA REVIDE 🏐',
        button: 'DEVOLVER DE NOVO 🏐',
        timeline: [
          { at: 0, do: 'grab', who: 'maligno', target: 'bomb' },
          { at: 300, do: 'pose', who: 'maligno', as: 'throw' },
          // a bomba viaja até o Pedro — mesmo corte instantâneo do outro final
          { at: 500, do: 'hide', who: 'bomb' },
          {
            at: 520, do: 'burst', x: 480, y: 350,
            emojis: ['💨'], count: 8, power: 240, dir: 80, spread: 30,
            gravity: 0, size: 26, ms: 400, sfx: 'whoosh',
          },
          { at: 900, do: 'show', who: 'bomb', x: 500 },
          { at: 940, do: 'pose', who: 'maligno', as: 'throw', off: true },
          // o Pedro pega no ar e devolve — mesma trajetória, sentido oposto
          { at: 950, do: 'pose', who: 'peter', as: 'throw' },
          { at: 1100, do: 'hide', who: 'bomb' },
          {
            at: 1120, do: 'burst', x: 480, y: 350,
            emojis: ['💨'], count: 8, power: 260, dir: -80, spread: 30,
            gravity: 0, size: 26, ms: 400, sfx: 'whoosh',
          },
          { at: 1450, do: 'show', who: 'bomb', x: 380 },
          {
            at: 1500, do: 'explode', target: 'maligno', intensity: 10,
            vaporize: ['maligno', 'bomb'],
          },
          // exagerado de propósito: é o final "ele levou o próprio troco"
          {
            at: 1540, do: 'burst', who: 'maligno',
            emojis: ['💥', '🔥', '🌀', '🏐'], count: 20, power: 300, size: 36,
          },
          { at: 1560, do: 'shake', intensity: 10 },
        ],
      },
    ],
  },

  /* ================================================================ *
   * §6.6 — a bomba impaciente. RARA e curta.
   *
   * Não tem personagem, não tem timeline e não tem aviso: a bomba
   * explode aos 4s, no meio do countdown. A rodada inteira dura 4,6s
   * contra os 10 a 13s de todas as outras — é a quebra de ritmo que o
   * GDD §3.2 pede ("previsibilidade mata a piada na décima rodada").
   *
   * Peso 1 contra 3 das cenas de personagem: aparece em ~8% das
   * rodadas, que é o suficiente para nunca ser esperada.
   * ================================================================ */
  {
    id: 'bomba-impaciente',
    character: null,
    weight: 1,
    invadeAt: 0,
    climaxAt: 4000, // sem aviso nenhum, no meio do countdown
    timeline: [],
    endings: [
      {
        id: 'bomb-cedo',
        title: 'ELA NÃO ESPEROU',
        weight: 1,
        survives: false,
        icon: '⏱️',
        theme: 'fogo',
        colors: { top: '#631a10', bot: '#160504', ink: '#ffe0d8', accent: '#ff6b4a' },
        cast: { who: 'peter', pose: 'burnt', at: 'top' },
        line: 'Ainda faltavam seis segundos.',
        kicker: 'NEM DEU TEMPO DA PIADA ⏱️',
        button: 'ESPERAR SENTADO ⏱️',
        timeline: [
          { at: 0, do: 'explode', target: 'bomb', intensity: 10, vaporize: ['peter', 'bomb'] },
          // a maior de todas: ela não esperou e não economizou
          {
            at: 40, do: 'burst', who: 'bomb',
            emojis: ['💥', '🔥', '💀', '⏱️'], count: 18, power: 300, size: 36,
          },
        ],
      },
    ],
  },

  /* ================================================================ *
   * §6.7 — o FIESTA que cai do céu.
   *
   * A única cena do catálogo que PROMETE que dessa vez vai dar certo:
   * o mostrador zera, o pavio morre e o Pedro comemora — a bomba
   * falhou. Ele tem quatro segundos de vida feliz.
   *
   * Duas decisões de ritmo sustentam a piada:
   *   1. a comemoração precisa durar tempo demais. Corta em 1,5s e o
   *      jogador entende que era pegadinha antes de acreditar;
   *   2. entre o carro bater no chão e o "BIBI" há 1,5s de silêncio.
   *      É a única pausa longa do jogo, e é ela que faz a buzina doer.
   *
   * É também a primeira vez que o Pedro REAGE a alguma coisa (a pose
   * `scared`, em chars.css). Ele reage, e morre assim mesmo.
   * ================================================================ */
  {
    id: 'fiesta-do-ceu',
    character: 'fiesta',
    // Peso 2 contra 3 das cenas de personagem: o setup é longo e a graça é o
    // susto, que enfraquece na terceira vez. Rara, não rara demais.
    weight: 2,
    // A cena começa QUANDO O MOSTRADOR ZERA — nada acontece antes disso, de
    // propósito: os 10s de countdown são o setup inteiro.
    invadeAt: 10000,
    // 5,5s depois do fim do countdown, e no meio do "BIBI": a explosão corta
    // a fala do carro em vez de esperar educadamente por ela.
    climaxAt: 15500,
    timeline: [
      // O pavio morre. `pose-cut` some com pavio e faísca — a mesma pose que o
      // JP usa quando corta o fio, aqui sem ninguém para cortar nada.
      { at: 0, do: 'pose', who: 'bomb', as: 'cut', sfx: 'fracasso' },
      { at: 500, do: 'pose', who: 'peter', as: 'celebrate', sfx: 'fanfarra' },
      // 1,7s de comemoração antes de qualquer coisa aparecer no céu.
      { at: 2200, do: 'enter', who: 'fiesta' },
      // O impacto: a entrada dura 620ms, então isto cai exatamente no chão.
      { at: 2820, do: 'shake', intensity: 9 },
      { at: 2820, do: 'sfx', name: 'boom' },
      {
        at: 2820, do: 'burst', who: 'fiesta',
        emojis: ['💨'], count: 9, power: 130, dir: 0, spread: 170, size: 26,
      },
      { at: 3300, do: 'pose', who: 'peter', as: 'celebrate', off: true },
      { at: 3350, do: 'pose', who: 'peter', as: 'scared' },
      // Silêncio de 1s. Depois a buzina.
      { at: 4300, do: 'say', who: 'fiesta', text: 'BIBI 🚗', ms: 1500 },
      { at: 4300, do: 'sfx', name: 'buzina' },
    ],
    endings: [
      {
        // O carro explode com o Pedro junto e SOBRA em cena, pegando fogo:
        // ele não está na lista de `vaporize`. Quem some é a vítima.
        id: 'fiesta-bibi',
        title: 'ELE VEIO DE FIESTA',
        weight: 1,
        survives: false,
        icon: '🚗',
        theme: 'fogo',
        // Fogo no fundo, azul de lataria no acento: a única cor fria de um
        // card de morte, porque é a cor do assassino.
        colors: { top: '#4a2a12', bot: '#0f0704', ink: '#ffe9d6', accent: '#5aa6e8' },
        // Quem voou aparece no alto. E quem matou é quem fala.
        cast: { who: 'fiesta', pose: 'burnt', at: 'top' },
        line: 'BIBI. 🚗',
        kicker: 'A BOMBA FALHOU. O CÉU NÃO 🚗',
        button: 'DAR A PARTIDA DE NOVO 🔑',
        timeline: [
          // A explosão nasce no CARRO, não na bomba: a bomba já tinha falhado.
          { at: 0, do: 'explode', target: 'fiesta', intensity: 9, vaporize: ['peter', 'bomb'] },
          {
            at: 40, do: 'burst', who: 'fiesta',
            emojis: ['💥', '🔥', '💀'], count: 15, power: 270, size: 32,
          },
          // A lataria carbonizada fica. `gravity: -1` faz a chama SUBIR.
          { at: 620, do: 'pose', who: 'fiesta', as: 'burnt' },
          {
            at: 700, do: 'burst', who: 'fiesta',
            emojis: ['🔥'], count: 9, power: 110, dir: 0, spread: 130, size: 26, gravity: -1,
          },
          {
            at: 1250, do: 'burst', who: 'fiesta',
            emojis: ['🔥', '💨'], count: 6, power: 90, dir: 0, spread: 110, size: 22, gravity: -1,
          },
        ],
      },
    ],
  },
];
