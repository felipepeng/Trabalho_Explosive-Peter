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
      // 2,2s para atravessar: devagar é o traço dele, não sobra de tempo
      { at: 0, do: 'enter', who: 'vinicius', x: 700, ms: 2200 },
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
        line: 'A explosão também é indiferente.',
        kicker: 'A BOMBA PERDEU O DEBATE 🗿',
        button: 'FILOSOFAR MAIS UMA VEZ 🧘',
        timeline: [
          { at: 0, do: 'say', who: 'vinicius', text: 'A bomba explode. Eu não.', ms: 3000 },
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
        cast: { who: 'vinicius', pose: 'wave', at: 'right' },
        line: 'Alguém tinha que ir. Não precisava ser você.',
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
        cast: { who: 'peter', pose: 'burnt', at: 'left' },
        line: 'Ele analisou muito bem. Enquanto eu explodia.',
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
   * §6.4 — Pedro Maligno.
   * Uma fenda roxa se abre atrás do Pedro aos 5s e ele sai dela. É a
   * cena RÁPIDA do jogo: ele mexe no relógio assim que chega, então o
   * clímax vem aos 7,8s em vez dos 10s de todas as outras. O timer é
   * mentiroso (GDD §3.2) e esta é a cena que prova.
   * ================================================================ */
  {
    id: 'maligno-portal',
    character: 'maligno',
    weight: 3,
    invadeAt: 5000,
    // O mostrador zera em 10067ms por causa do setTimer abaixo (8400 + 5/3 s).
    // Os dois números precisam bater NA MÃO: o validador não confere isso.
    climaxAt: 10200,
    timeline: [
      { at: 0, do: 'portal', x: 380, y: 320, w: 150, h: 240 },
      // a fenda abrindo cospe o que tem dentro
      {
        at: 120, do: 'burst', x: 380, y: 320,
        emojis: ['🌀'], count: 9, power: 150, gravity: 0, size: 28, ms: 1300,
      },
      { at: 300, do: 'enter', who: 'maligno', x: 380 },
      { at: 900, do: 'say', who: 'maligno', text: 'Oi, eu.', ms: 2200 },
      { at: 2600, do: 'say', who: 'maligno', text: 'Vim ver de perto.', ms: 2400 },
      // de ~1,6 para 5, correndo 3× mais rápido: zera aos 10067ms
      { at: 3400, do: 'setTimer', to: 5, rate: 3 },
      { at: 3500, do: 'shake', intensity: 3 },
    ],
    endings: [
      {
        // Acelera o timer de 6 para 0. Explosão dupla, os dois morrem.
        id: 'mal-paradoxo',
        title: 'PARADOXO',
        weight: 3,
        survives: false,
        icon: '🌀',
        theme: 'fenda',
        colors: { top: '#3f1266', bot: '#0c0219', ink: '#f3e2ff', accent: '#b96cf5' },
        cast: { who: 'peter', pose: 'burnt', at: 'left' },
        line: 'Explodimos os dois. Nem isso ele fez sozinho.',
        kicker: 'ELE SE EXPLODIU JUNTO 🌀',
        button: 'RODAR O PARADOXO 🌀',
        timeline: [
          { at: 0, do: 'explode', target: 'bomb', intensity: 9, vaporize: ['peter', 'bomb'] },
          {
            at: 40, do: 'burst', who: 'bomb',
            emojis: ['💥', '🔥'], count: 13, power: 260, size: 32,
          },
          { at: 900, do: 'explode', x: 380, y: 400, intensity: 7, vaporize: ['maligno'] },
          {
            at: 940, do: 'burst', x: 380, y: 400,
            emojis: ['💥', '🌀'], count: 12, power: 240, size: 30,
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
        // Desarma a bomba só para fazer algo pior. Corte para tela preta.
        // Pedro tecnicamente não explodiu — por isso `survives: null`, e o
        // contador de mortes e de salvamentos não se mexe. É a piada.
        id: 'mal-censurado',
        title: '[DADOS CORROMPIDOS]',
        weight: 2,
        survives: null,
        icon: '🚫',
        theme: 'corrompido',
        colors: { top: '#04160b', bot: '#000000', ink: '#7dff9a', accent: '#7dff9a' },
        cast: { who: 'maligno', pose: 'glitch', at: 'top-right' },
        line: 'Você não viu nada. Nem eu.',
        kicker: 'MELHOR VOCÊ NÃO SABER 🚫',
        button: '[ REINICIAR SESSÃO ] ⏵',
        timeline: [
          { at: 0, do: 'pose', who: 'bomb', as: 'cut' },
          {
            at: 40, do: 'burst', who: 'bomb',
            emojis: ['✂️'], count: 3, power: 80, spread: 120, size: 20, ms: 700, sfx: 'corte',
          },
          { at: 300, do: 'say', who: 'maligno', text: 'Isso seria rápido demais.', ms: 2600 },
          {
            at: 2200, do: 'burst', who: 'maligno',
            emojis: ['🚫', '📼'], count: 8, power: 160, gravity: 0, size: 26,
            ms: 900, sfx: 'glitch',
          },
          { at: 2400, do: 'blackout', ms: 260 },
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
   * §6.7 — Pedro Professor.
   *
   * A única cena em que a bomba NÃO é o problema: o professor chega,
   * parte a bomba ao meio com um laser — e aí resolve demonstrar a
   * ferramenta. Invoca as três IAs, elas se oferecem para ajudar em
   * coro, e pulverizam o aluno. A bomba fica no chão, aberta, inútil,
   * até o fim da rodada: é ela quem conta a piada.
   *
   * Geografia: o professor entra pela DIREITA e para em x 810, do lado
   * oposto ao Pedro (x 500) — assim o laser cruza até a bomba (x 620)
   * sem passar por cima da vítima. As três IAs ficam em 340 / 500 / 660,
   * simétricas em torno do eixo do Pedro, bem acima da cabeça dele.
   *
   * FINAL ÚNICO, por decisão: a cena inteira é uma demonstração levada
   * até o fim, e ramificar no meio dela ("as IAs erram", "as IAs se
   * recusam") quebraria a lógica de quem já viu o professor mirar.
   * ================================================================ */
  {
    id: 'professor-ia',
    character: 'professor',
    weight: 3,
    invadeAt: 3000,
    // 11,6s: o mostrador zera aos 10s e as três IAs ainda estão carregando.
    // O timer é mentiroso (GDD §3.2), e aqui ele é mentiroso de novo.
    climaxAt: 11600,
    timeline: [
      { at: 0, do: 'enter', who: 'professor', x: 810 },
      { at: 900, do: 'say', who: 'professor', text: 'Chegou a hora da avaliação prática.', ms: 2600 },

      // O LASER. A pose levanta o braço com o ponteiro; o raio sai de lá.
      //
      // A origem é a PONTA DO GESTO, não o centro do boneco, e por isso vem
      // escrita à mão: com o braço em 102° (chars.css) o ponteiro para em
      // ~(712, 338) no espaço de design, com ele marcado em x 810. Mexeu no
      // ângulo da pose ou na marca dele? estes dois números mudam junto.
      { at: 3000, do: 'pose', who: 'professor', as: 'laser', sfx: null },
      {
        at: 3200, do: 'beam', from: 'professor', to: 'bomb',
        x: 712, y: 338, color: '#ff5a3c', width: 12, ms: 480, sfx: 'laser',
      },
      { at: 3520, do: 'pose', who: 'bomb', as: 'split', sfx: 'corte' },
      {
        at: 3560, do: 'burst', who: 'bomb',
        emojis: ['⚙️', '💥'], count: 7, power: 150, spread: 140, size: 22, ms: 900,
      },
      { at: 3900, do: 'shake', intensity: 4 },
      { at: 4000, do: 'pose', who: 'professor', as: 'laser', off: true },

      { at: 4200, do: 'say', who: 'professor', text: 'Vou te mostrar como usar a IA de verdade!', ms: 2900 },

      // A INVOCAÇÃO, uma por vez. `from: 'portal'` faz cada emblema crescer
      // no lugar em vez de vir da borda — é o que "ser invocado" parece.
      { at: 6500, do: 'enter', who: 'claude', from: 'portal', x: 340, y: 190, ms: 520, sfx: 'invocar' },
      { at: 7150, do: 'enter', who: 'gpt', from: 'portal', x: 500, y: 176, ms: 520, sfx: 'invocar' },
      { at: 7800, do: 'enter', who: 'gemini', from: 'portal', x: 660, y: 190, ms: 520, sfx: 'invocar' },

      // CANALIZANDO: as três pulsam juntas. É o aviso de que vem coisa.
      { at: 8500, do: 'pose', who: 'claude', as: 'canalizar', sfx: null },
      { at: 8500, do: 'pose', who: 'gpt', as: 'canalizar', sfx: null },
      { at: 8500, do: 'pose', who: 'gemini', as: 'canalizar', sfx: null },
    ],
    endings: [
      {
        // Os três raios convergem no Pedro ao mesmo tempo. Não sobra nada —
        // e a bomba continua caída ali, partida, sem ter feito nada.
        id: 'prof-pulverizado',
        title: 'AULA PRÁTICA',
        weight: 1,
        survives: false,
        icon: '🎓',
        theme: 'neural',
        colors: { top: '#1a2352', bot: '#05070f', ink: '#e6eeff', accent: '#8fb0ff' },
        cast: { who: 'professor', pose: 'shrug', at: 'right' },
        line: 'Eu só demonstrei a ferramenta.',
        kicker: 'A FERRAMENTA FUNCIONOU 🎓',
        button: 'REPETIR A DEMONSTRAÇÃO 🎓',
        timeline: [
          // As três falam ao mesmo tempo, no tom de assistente prestativo.
          // É a última coisa que o Pedro ouve.
          { at: 0, do: 'say', who: 'claude', text: 'Claro, posso ajudar.', ms: 1700 },
          { at: 0, do: 'say', who: 'gpt', text: 'Ótima pergunta!', ms: 1700 },
          { at: 0, do: 'say', who: 'gemini', text: 'Deixa comigo.', ms: 1700 },

          // OS TRÊS RAIOS, no mesmo milissegundo. Cada um com a cor da IA.
          { at: 1500, do: 'beam', from: 'claude', to: 'peter', color: '#d97757', width: 16, ms: 620 },
          { at: 1500, do: 'beam', from: 'gpt', to: 'peter', color: '#f2f2f2', width: 16, ms: 620, sfx: null },
          { at: 1500, do: 'beam', from: 'gemini', to: 'peter', color: '#6f9cf5', width: 16, ms: 620, sfx: null },

          // PULVERIZADO: some o Pedro, fica o professor e a bomba aberta.
          // O ponto é o PEITO dele (y 375), não os pés — é onde os três
          // raios se encontram, e uma explosão no chão não leria como isso.
          { at: 1780, do: 'explode', x: 500, y: 375, intensity: 9, vaporize: ['peter'] },
          {
            at: 1820, do: 'burst', x: 500, y: 375,
            emojis: ['✨', '💀', '🤖'], count: 15, power: 280, size: 32,
          },
        ],
      },
    ],
  },
];
