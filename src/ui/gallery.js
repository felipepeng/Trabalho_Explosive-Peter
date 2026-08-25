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
 * A ÚNICA exceção é o modo dev (`src/dev.js`, ligado por `?dev=1`): quando
 * `onPick` chega, a fileira ganha a classe `is-dev`, o CSS devolve o
 * `pointer-events` e clicar numa célula roda aquele final. Sem `onPick` este
 * arquivo se comporta exatamente como antes — não existe um `if (dev)` aqui
 * dentro: o modo entra por parâmetro, como todo o resto do motor.
 *
 * A COR de cada célula é a do PERSONAGEM que invade aquela cena, não a do
 * tema do card (`ui/rig.js` importa `data/characters.js` pelo mesmo motivo:
 * quem desenha personagem precisa saber a cor dele). Assim a fileira vira um
 * mapa de QUEM, enquanto o card continua sendo o clima — duas leituras que
 * antes disputavam a mesma cor. Cena sem invasor cai no Pedro: quem está em
 * cena é ele.
 *
 * A ordem é a do catálogo e é ESTÁVEL: a mesma célula é sempre o mesmo final,
 * então o jogador aprende "falta aquele ali no canto" — o que não funcionaria
 * se a grade se reordenasse conforme a descoberta.
 */

import { characters } from '../data/characters.js';

/** A cor de um personagem na fileira: o campo `cell`, e sem ele a roupa —
 *  que é o que identifica alguém de longe. Sem roupa, a pele. */
function corDe(id) {
  const c = characters[id] ?? characters.peter;
  return c?.cell ?? c?.colors?.cloth ?? c?.colors?.skin ?? null;
}

/**
 * @param {HTMLElement} el
 * @param {object} [o]
 * @param {(id: string) => void} [o.onPick]  modo dev: célula clicada roda
 *   aquele final. Ausente = fileira decorativa, o comportamento normal.
 * @param {Map<string, string|null>} [o.charOf]  de qual personagem é cada
 *   final. Chega de fora porque quem sabe casar cena e final é o main.js —
 *   o final não repete no dado uma coisa que a cena dele já diz.
 */
export function createGallery(el, { onPick = null, charOf = null } = {}) {
  if (!el) return { render() {} };

  /** @type {Map<string, HTMLElement>} */
  const celulas = new Map();

  if (onPick) {
    el.classList.add('is-dev');
    // Delegado: uma escuta só, que sobrevive a qualquer remontagem das células.
    el.addEventListener('click', (ev) => {
      const id = ev.target.closest?.('.cell')?.dataset.ending;
      if (id) onPick(id);
    });
  }

  /** Monta as células uma vez só; depois é só trocar classe e texto. */
  function build(endings) {
    el.replaceChildren();
    celulas.clear();

    for (const ending of endings) {
      const li = document.createElement('li');
      li.className = 'cell';
      li.dataset.ending = ending.id;
      // `peter` quando a cena não tem invasor (`ninguem-veio`,
      // `bomba-impaciente`): quem está em cena nessas duas é o próprio Pedro.
      const cor = corDe(charOf?.get(ending.id) ?? 'peter');
      if (cor) li.style.setProperty('--cell', cor);
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
        // Em modo dev o título aparece mesmo no que ainda falta — o spoiler é
        // o ponto: sem ele não dá para escolher o final que se quer testar.
        li.title = onPick
          ? `${ending.title} — clique para rodar`
          : descoberto
            ? ending.title
            : 'Final não descoberto';
      }
    },
  };
}
