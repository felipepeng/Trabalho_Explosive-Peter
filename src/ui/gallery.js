/* Explosive Peter — a coleção de finais.
 *
 * Mora DENTRO do ending card, não numa tela separada (ARCHITECTURE.md §7):
 * uma fileira de quadradinhos abaixo do `X/N`, com `?` no que falta. Assim não
 * há interação nova (o GDD §4.2 proíbe), não há sexto estado, e o gancho de
 * "falta um" aparece toda rodada em vez de ficar atrás de um botão.
 *
 * Decorativa e NÃO CLICÁVEL. O único alvo de clique do jogo é o botão de
 * restart, e o `pointer-events: none` do CSS garante que a fileira nunca vire
 * um segundo alvo por acidente.
 *
 * A ordem é a do catálogo e é ESTÁVEL: a mesma célula é sempre o mesmo final,
 * então o jogador aprende "falta aquele ali no canto" — o que não funcionaria
 * se a grade se reordenasse conforme a descoberta.
 */

export function createGallery(el) {
  if (!el) return { render() {} };

  /** @type {Map<string, HTMLElement>} */
  const celulas = new Map();

  /** Monta as células uma vez só; depois é só trocar classe e texto. */
  function build(endings) {
    el.replaceChildren();
    celulas.clear();

    for (const ending of endings) {
      const li = document.createElement('li');
      li.className = 'cell';
      li.dataset.theme = ending.theme ?? 'fogo';
      el.appendChild(li);
      celulas.set(ending.id, li);
    }
  }

  return {
    /**
     * @param {object[]} endings   catálogo inteiro, em ordem estável
     * @param {Set<string>} seen   ids já descobertos
     * @param {string} currentId   o final desta rodada, para destacar
     */
    render({ endings, seen, currentId }) {
      if (celulas.size !== endings.length) build(endings);

      for (const ending of endings) {
        const li = celulas.get(ending.id);
        if (!li) continue;

        const descoberto = seen.has(ending.id);
        li.classList.toggle('is-seen', descoberto);
        li.classList.toggle('is-current', ending.id === currentId);
        li.textContent = descoberto ? (ending.icon ?? '•') : '?';
        // Não é interação: é o mesmo texto que o leitor de tela já anuncia.
        li.title = descoberto ? ending.title : 'Final não descoberto';
      }
    },
  };
}
