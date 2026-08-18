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
 * A classificação de `survives` dos 14 finais está em ARCHITECTURE.md §7.1.
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
];
