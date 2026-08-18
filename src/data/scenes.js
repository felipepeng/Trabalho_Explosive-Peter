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
 * Toda posição está em unidades de design (1000 × 600), nunca em pixel.
 *
 * `id` de final é PERMANENTE — é chave do save do jogador. `title` é livre.
 */

export const scenes = [
  /* ---------------------------------------------------------------- *
   * §6.1 — a cena de fundação. O timer chega a zero. Nada acontece.
   * Pedro explode. É o ponto de referência de todo o humor do jogo:
   * a timeline vazia é a piada, não um TODO.
   * ---------------------------------------------------------------- */
  {
    id: 'ninguem-veio',
    character: null,
    weight: 1,
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
];
