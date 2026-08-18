/* Explosive Peter — o HUD fora do timer.
 *
 * O "Pedros perdidos" do canto e a barra inferior (GDD §7.4 e §3.2).
 *
 * A interpolação das frases mora aqui de propósito (ARCHITECTURE.md §4):
 * `data/messages.js` guarda o texto com `{rounds}` cru, e quem sabe os números
 * da rodada é o HUD. Assim o dado continua inerte.
 */

export function createHud({ deaths, message }) {
  return {
    setDeaths(n) {
      if (!deaths) return;
      // Escondido enquanto é zero: não há piada em "Pedros perdidos: 0".
      deaths.hidden = !n;
      deaths.textContent = `💀 Pedros perdidos: ${n}`;
    },

    /** `setMessage('Pedro nº {rounds}.', { rounds: 12 })` */
    setMessage(text, vars = {}) {
      if (!message || !text) return;
      message.textContent = String(text).replace(
        /\{(\w+)\}/g,
        (cru, chave) => (chave in vars ? vars[chave] : cru),
      );
    },
  };
}
