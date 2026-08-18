/* Explosive Peter — o HUD fora do timer.
 *
 * Sobrou pouco: o "Pedros perdidos" do canto (GDD §7.4).
 *
 * D11: a barra inferior saiu daqui. Ela virou SLOGAN FIXO escrito no
 * index.html — "Não tem como salvar Ele." em toda rodada, sem exceção — e a
 * linha de cima do HUD ("O Pedro não tem muito tempo") também é estática.
 * Nenhuma das duas comenta a rodada, e nenhuma revela QUAL cena está rodando:
 * o nome do final só aparece depois que o Pedro morre, no card.
 *
 * O preço dessa decisão está anotado no cabeçalho de `data/messages.js`.
 */

export function createHud({ deaths }) {
  return {
    setDeaths(n) {
      if (!deaths) return;
      // Escondido enquanto é zero: não há piada em "Pedros perdidos: 0".
      deaths.hidden = !n;
      deaths.textContent = `💀 Pedros perdidos: ${n}`;
    },
  };
}
