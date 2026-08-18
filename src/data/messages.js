/* Explosive Peter — as frases da barra inferior.
 *
 * ⚠️  FORA DO AR DESDE O D11, DE PROPÓSITO. Ninguém importa este arquivo.
 *
 * A barra inferior virou slogan fixo ("Não tem como salvar Ele.", escrito
 * direto no index.html) e a linha de cima do HUD também é estática. A decisão
 * troca variação por identidade: a mesma tese repetida em toda rodada, e nada
 * na tela dizendo qual cena está rodando antes do Pedro morrer.
 *
 * O arquivo fica aqui inteiro porque o custo de guardá-lo é zero e o de
 * reescrevê-lo não é: para religar a barra dinâmica basta devolver ao main.js
 * o `pickMessage` (histórico em `git log`) e um `hud.setMessage`.
 *
 * O que está abaixo descreve como ele FUNCIONAVA:
 *
 * Dado inerte (P1). É a fonte de humor mais barata do projeto (GDD §3.2), e a
 * única que muda toda rodada sem custar um beat.
 *
 * Cada frase tem uma `tag` que diz QUANDO ela pode aparecer, e o mesmo picker
 * ponderado das cenas escolhe entre as elegíveis (ARCHITECTURE.md §4):
 *
 *   boot         a primeiríssima rodada, antes de qualquer final
 *   after-death  a rodada anterior matou o Pedro
 *   after-save   a rodada anterior salvou o Pedro
 *   after-null   a rodada anterior não deu nem uma coisa nem outra
 *   milestone    o jogador chegou a um número redondo de rodadas
 *   complete     o jogador já viu TODOS os finais
 *
 * As tags elegíveis se somam: na décima rodada depois de uma morte, valem as
 * de `after-death` E as de `milestone`.
 *
 * Interpolação disponível: {rounds} {deaths} {saves} {seen} {total}.
 * Quem substitui é o HUD, não este arquivo.
 *
 * ⚠️ EMOJI: pode aqui — é texto de interface, não fala de personagem.
 */

export const messages = [
  /* ---- a tese do jogo. Só na primeira rodada da vida do jogador ---- */
  { tag: 'boot', weight: 1, text: 'Não tem como salvar ele.' },

  /* ---- depois de uma morte ---- */
  { tag: 'after-death', weight: 3, text: 'Ele tentou. 💀' },
  { tag: 'after-death', weight: 3, text: 'Isso foi pior. 💀' },
  { tag: 'after-death', weight: 3, text: 'Ninguém podia prever isso. Ninguém.' },
  { tag: 'after-death', weight: 3, text: 'Pedro nº {rounds}. 💀' },
  { tag: 'after-death', weight: 2, text: 'Talvez desta vez. 🤞' },
  { tag: 'after-death', weight: 2, text: 'A bomba está aprendendo. 💣' },
  { tag: 'after-death', weight: 2, text: 'Continua não tendo como salvar ele.' },
  { tag: 'after-death', weight: 1, text: '{deaths} Pedros e contando. ⚰️' },

  /* ---- depois de um salvamento ---- */
  { tag: 'after-save', weight: 3, text: 'Esse deu certo. Não se acostume. ✨' },
  { tag: 'after-save', weight: 3, text: 'Alguém veio. 🎉' },
  { tag: 'after-save', weight: 3, text: 'Ainda assim, não tem como salvar ele.' },
  { tag: 'after-save', weight: 2, text: '{saves} salvos, {deaths} perdidos. ⚖️' },
  { tag: 'after-save', weight: 2, text: 'O Pedro não entendeu o que aconteceu.' },
  { tag: 'after-save', weight: 1, text: 'Isso não vai se repetir. 🍀' },

  /* ---- depois do final ambíguo ---- */
  { tag: 'after-null', weight: 3, text: 'Melhor não perguntar. 🚫' },
  { tag: 'after-null', weight: 3, text: 'Esse não conta. ❓' },
  { tag: 'after-null', weight: 2, text: 'O registro se perdeu. 📼' },

  /* ---- marcos ---- */
  { tag: 'milestone', weight: 3, text: '{rounds} rodadas. Ele não melhorou. 📈' },
  { tag: 'milestone', weight: 3, text: '{seen} de {total} finais. Falta pouco. 🔎' },
  { tag: 'milestone', weight: 2, text: 'Você já podia ter parado. 🕰️' },

  /* ---- coleção fechada ---- */
  { tag: 'complete', weight: 3, text: 'Todos os {total} finais. Acabou. 🏆' },
  { tag: 'complete', weight: 2, text: 'Não sobrou nenhum. E ele continua ali. 🏆' },
  { tag: 'complete', weight: 1, text: 'Você viu tudo. Ele não. 💀' },
];
