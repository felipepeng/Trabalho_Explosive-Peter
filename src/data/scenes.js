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
 * de reinício) e `icon` (o emoji da célula dele na galeria).
 *
 * ⚠️ EMOJI: pode em kicker, botão e em qualquer texto de interface. NUNCA no
 * `text` de um beat `say` — fala de personagem é sem emoji, senão o Vinicius
 * estoico deixa de soar estoico.
 *
 * Orçamento: clímax + último beat do final + 600ms de pausa dramática tem que
 * caber em 15s (GDD, pilar 2). As sete combinações abaixo ficam entre 10,6s e
 * 13,0s.
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
    climaxAt: 10000, // = COUNTDOWN_MS: o clímax é o timer zerar
    timeline: [],
    endings: [
      {
        id: 'ninguem-veio',
        title: 'NINGUÉM VEIO',
        weight: 1,
        survives: false,
        icon: '💥',
        theme: 'fogo',
        kicker: 'SEM SALVAÇÃO 💥',
        button: 'DE NOVO 🔁',
        timeline: [
          { at: 0, do: 'explode', target: 'bomb', intensity: 8, vaporize: ['peter', 'bomb'] },
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
    climaxAt: 10000, // ele segura até o fim; o clímax é o timer zerar
    timeline: [
      // 2,2s para atravessar: devagar é o traço dele, não sobra de tempo
      { at: 0, do: 'enter', who: 'vinicius', x: 700, ms: 2200 },
      { at: 2600, do: 'say', who: 'vinicius', text: 'A dor é apenas opinião.', ms: 2200 },
      { at: 4200, do: 'grab', who: 'vinicius', target: 'bomb' },
      { at: 5000, do: 'say', who: 'vinicius', text: 'Está tudo sob controle.', ms: 1400 },
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
        kicker: 'PEDRO SOBREVIVEU 🧘',
        button: 'MAIS UMA 🔁',
        timeline: [
          { at: 0, do: 'say', who: 'vinicius', text: 'A bomba explode. Eu não.', ms: 2600 },
          { at: 900, do: 'explode', target: 'bomb', intensity: 4, vaporize: ['bomb'] },
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
        kicker: 'SACRIFÍCIO ESTOICO 🕯️',
        button: 'MAIS UMA 🔁',
        timeline: [
          { at: 0, do: 'say', who: 'vinicius', text: 'Amor fati.', ms: 1600 },
          { at: 800, do: 'exit', who: 'vinicius', to: 'right', ms: 1500, gait: 'walk' },
          { at: 2300, do: 'flash' },
          { at: 2350, do: 'shake', intensity: 7 },
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
        kicker: 'PEDRO PERDIDO 💥',
        button: 'DE NOVO 🔁',
        timeline: [
          { at: 0, do: 'say', who: 'vinicius', text: 'Não estava sob meu controle.', ms: 2400 },
          {
            at: 1100,
            do: 'explode',
            target: 'bomb',
            intensity: 9,
            vaporize: ['peter', 'bomb', 'vinicius'],
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
    climaxAt: 10000,
    timeline: [
      { at: 0, do: 'enter', who: 'jp', x: 730 },
      { at: 350, do: 'say', who: 'jp', text: 'EU RESOLVO ISSO!', ms: 1600 },
      { at: 1200, do: 'pose', who: 'jp', as: 'jump' },
      { at: 2600, do: 'say', who: 'jp', text: 'CADÊ QUE EU ALCANÇO?!', ms: 1800 },
      { at: 5200, do: 'say', who: 'jp', text: 'TÔ QUASE!', ms: 1600 },
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
        kicker: 'PEDRO PERDIDO 💥',
        button: 'DE NOVO 🔁',
        timeline: [
          { at: 0, do: 'say', who: 'jp', text: 'PERA—', ms: 900 },
          {
            at: 600,
            do: 'explode',
            target: 'bomb',
            intensity: 9,
            vaporize: ['peter', 'bomb', 'jp'],
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
        kicker: 'PEDRO PERDIDO ✂️',
        button: 'DE NOVO 🔁',
        timeline: [
          { at: 0, do: 'pose', who: 'jp', as: 'jump', off: true },
          { at: 0, do: 'pose', who: 'jp', as: 'reach' },
          { at: 450, do: 'pose', who: 'bomb', as: 'cut' },
          { at: 700, do: 'say', who: 'jp', text: 'PRONTO. RESOLVIDO.', ms: 1800 },
          {
            at: 1500,
            do: 'explode',
            target: 'bomb',
            intensity: 9,
            vaporize: ['peter', 'bomb', 'jp'],
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
        kicker: 'PEDRO SOBREVIVEU 🥏',
        button: 'MAIS UMA 🔁',
        timeline: [
          { at: 0, do: 'pose', who: 'jp', as: 'jump', off: true },
          { at: 0, do: 'say', who: 'jp', text: 'VEM CÁ!', ms: 1200 },
          { at: 300, do: 'pose', who: 'jp', as: 'throw' },
          { at: 450, do: 'exit', who: 'peter', to: 'left', ms: 650 },
          { at: 1200, do: 'explode', target: 'bomb', intensity: 9, vaporize: ['bomb', 'jp'] },
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
    climaxAt: 10000,
    timeline: [
      { at: 0, do: 'flood', height: 140, ms: 1100 },
      { at: 500, do: 'enter', who: 'michas', x: 760 },
      { at: 1200, do: 'say', who: 'michas', text: 'O MAR OBEDECE.', ms: 1800 },
      { at: 4400, do: 'grab', who: 'michas', target: 'bomb' },
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
        kicker: 'PEDRO SOBREVIVEU 🎆',
        button: 'MAIS UMA 🌊',
        timeline: [
          { at: 0, do: 'pose', who: 'michas', as: 'throw' },
          { at: 250, do: 'exit', who: 'bomb', to: 'above', ms: 600 },
          { at: 1000, do: 'explode', x: 640, y: 120, intensity: 3, vaporize: ['bomb'] },
          { at: 1300, do: 'explode', x: 480, y: 175, intensity: 2 },
          { at: 1650, do: 'explode', x: 790, y: 140, intensity: 2 },
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
        kicker: 'PEDRO AFOGADO 🌊',
        button: 'DE NOVO 🔁',
        timeline: [
          { at: 0, do: 'flood', height: 210, ms: 900 },
          { at: 700, do: 'pose', who: 'bomb', as: 'cut' },
          { at: 900, do: 'say', who: 'michas', text: 'PAVIO APAGADO.', ms: 2000 },
          { at: 1500, do: 'exit', who: 'peter', to: 'below', ms: 900 },
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
        kicker: 'PEDRO PERDIDO 🫧',
        button: 'DE NOVO 🔁',
        timeline: [
          { at: 0, do: 'flood', height: 210, ms: 900 },
          { at: 900, do: 'say', who: 'michas', text: 'ISSO NÃO DEVERIA—', ms: 1600 },
          {
            at: 1400,
            do: 'explode',
            target: 'bomb',
            intensity: 6,
            ms: 2200, // câmera lenta: a bola de fogo abre em 2,2s em vez de 0,7s
            vaporize: ['peter', 'bomb', 'michas'],
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
        kicker: 'DROP RARO ⭐',
        button: 'FARMAR MAIS ⛏️',
        timeline: [
          { at: 0, do: 'pose', who: 'bomb', as: 'item' },
          { at: 500, do: 'say', who: 'michas', text: 'DROPOU.', ms: 1800 },
          { at: 1400, do: 'exit', who: 'michas', to: 'right', ms: 1200 },
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
    // O mostrador zera em 7700ms por causa do setTimer abaixo. Os dois números
    // precisam bater na mão: o validador não tem como conferir isso.
    climaxAt: 7800,
    timeline: [
      { at: 0, do: 'portal', x: 380, y: 320, w: 150, h: 240 },
      { at: 300, do: 'enter', who: 'maligno', x: 380 },
      { at: 900, do: 'say', who: 'maligno', text: 'Oi, eu.', ms: 1600 },
      // de ~3,8 para 6, correndo 4× mais rápido: zera aos 7700ms
      { at: 1200, do: 'setTimer', to: 6, rate: 4 },
      { at: 1300, do: 'shake', intensity: 3 },
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
        kicker: 'OS DOIS PERDIDOS 💥',
        button: 'DE NOVO 🔁',
        timeline: [
          { at: 0, do: 'explode', target: 'bomb', intensity: 9, vaporize: ['peter', 'bomb'] },
          { at: 700, do: 'explode', x: 380, y: 400, intensity: 7, vaporize: ['maligno'] },
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
        kicker: 'PEDRO SOBREVIVEU 🔮',
        button: 'MAIS UMA 🔁',
        timeline: [
          { at: 0, do: 'flash', ms: 200 },
          { at: 60, do: 'hide', who: 'peter' },
          { at: 60, do: 'hide', who: 'maligno' },
          { at: 200, do: 'show', who: 'peter', x: 180 },
          { at: 200, do: 'show', who: 'maligno', x: 470 },
          { at: 500, do: 'say', who: 'maligno', text: 'HAHAHA— ah.', ms: 1600 },
          {
            at: 1400,
            do: 'explode',
            target: 'bomb',
            intensity: 9,
            vaporize: ['bomb', 'maligno'],
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
        kicker: 'REGISTRO PERDIDO 🚫',
        button: '[ REINICIAR ] ⏵',
        timeline: [
          { at: 0, do: 'pose', who: 'bomb', as: 'cut' },
          { at: 300, do: 'say', who: 'maligno', text: 'Isso seria rápido demais.', ms: 1800 },
          { at: 1500, do: 'blackout', ms: 260 },
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
        kicker: 'SEM AVISO ⏱️',
        button: 'DE NOVO 🔁',
        timeline: [
          { at: 0, do: 'explode', target: 'bomb', intensity: 10, vaporize: ['peter', 'bomb'] },
        ],
      },
    ],
  },
];
