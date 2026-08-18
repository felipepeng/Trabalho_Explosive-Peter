/* Explosive Peter — o ending card.
 *
 * O card mostra o resultado; quem reinicia é o BOTÃO, e só ele. Clicar em
 * qualquer outro ponto do card não faz nada.
 *
 * I2: só se sai do ENDING por clique — nada de temporizador aqui dentro.
 * I5: o listener de restart só existe enquanto o card está visível. Fora do
 *     ENDING não há handler de input nenhum no documento.
 *
 * O botão é um <button> de verdade: foco, Enter e Espaço vêm de graça do
 * navegador, sem role/tabindex/keydown escritos à mão.
 */

export function createEndingCard(el, { onRestart }) {
  const title = el.querySelector('#ending-title');
  const count = el.querySelector('#ending-count');
  const button = el.querySelector('#ending-restart');

  let armed = false;

  function fire() {
    // I1: uma rodada por vez. O segundo clique de um clique duplo cai aqui
    // com `armed` já falso e é engolido.
    if (!armed) return;
    armed = false;
    button.disabled = true;
    onRestart();
  }

  return {
    /** Entra em ENDING: mostra o card e arma o botão. */
    show({ title: text, counter = '' }) {
      title.textContent = text;
      count.textContent = counter;
      count.hidden = !counter;
      el.hidden = false;
      armed = true;
      button.disabled = false;
      button.addEventListener('click', fire);
      button.focus({ preventScroll: true });
    },

    /** Sai do ENDING: some e deixa de escutar qualquer coisa. */
    hide() {
      armed = false;
      button.removeEventListener('click', fire);
      button.blur();
      el.hidden = true;
    },
  };
}
