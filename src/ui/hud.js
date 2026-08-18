/* Explosive Peter — o HUD fora do timer.
 *
 * Por ora só o "Pedros perdidos" do canto (GDD §7.4). Fica escondido enquanto
 * o contador é zero: na primeira rodada da vida do jogador ainda não há piada
 * nenhuma em "Pedros perdidos: 0".
 */

export function createHud({ deaths }) {
  return {
    setDeaths(n) {
      if (!deaths) return;
      deaths.hidden = !n;
      deaths.textContent = `Pedros perdidos: ${n}`;
    },
  };
}
