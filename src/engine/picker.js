/* Explosive Peter — sorteio ponderado e anti-repetição.
 *
 * Puro: recebe estado, devolve escolha. Não lê `localStorage`, não toca no
 * DOM, não conhece o catálogo (ARCHITECTURE.md §4). É por isso que o
 * forçamento de `ninguem-veio` na primeira rodada mora no `main.js` — se um
 * `if (scene.id === 'ninguem-veio')` aparecer aqui, o motor passou a conhecer
 * o conteúdo e a arquitetura vazou.
 *
 * `random` entra por parâmetro para o sorteio ser testável sem sorte.
 */

/** Chave de agrupamento: duas cenas sem personagem seguidas também repetem. */
const keyOf = (scene) => scene.character ?? 'sem-personagem';

/**
 * Sorteio ponderado clássico. Peso ≤ 0 é tratado como 0 (item inelegível);
 * se TODOS forem 0, cai num sorteio uniforme em vez de devolver `undefined`.
 */
export function weightedPick(items, weightOf, random = Math.random) {
  if (!items.length) return null;

  const weights = items.map((item) => Math.max(0, weightOf(item) || 0));
  const total = weights.reduce((sum, w) => sum + w, 0);

  if (total <= 0) return items[Math.floor(random() * items.length)] ?? items[0];

  let roll = random() * total;
  for (let i = 0; i < items.length; i += 1) {
    roll -= weights[i];
    if (roll < 0) return items[i];
  }
  return items[items.length - 1];
}

/**
 * Bônus de novidade CONTÍNUO (ARCHITECTURE.md §4): intocada ×3, esgotada ×1.
 *
 * O GDD liga/desliga o ×3 por "cena vista", então uma cena vista UMA vez
 * perderia o bônus para sempre mesmo escondendo 3 de 4 finais — e o jogador
 * que quer fechar o X/N ficaria sendo mandado para conteúdo esgotado.
 */
export function noveltyMultiplier(scene, seen) {
  const endings = scene.endings ?? [];
  if (!endings.length) return 1;
  const unseen = endings.filter((e) => !seen.has(e.id)).length;
  return 1 + 2 * (unseen / endings.length);
}

/**
 * Escolhe a cena da próxima rodada.
 *
 * @param {object[]} scenes    catálogo inteiro
 * @param {object}   session
 * @param {string[]} session.history  ids das cenas já jogadas, em ordem
 * @param {Set<string>} seen   ids de finais já vistos pelo jogador
 */
export function pickScene(scenes, { history = [], seen = new Set(), random } = {}) {
  if (!scenes.length) return null;

  // K = min(3, n-2): o cooldown sobrevive à ordem de corte do GDD §9.1, que
  // pode encolher o catálogo. Com poucas cenas, um K fixo em 3 esvaziaria o
  // pool toda rodada e o anti-repetição viraria decoração.
  const k = Math.max(0, Math.min(3, scenes.length - 2));

  const recent = k ? history.slice(-k) : [];
  const lastScene = scenes.find((s) => s.id === history[history.length - 1]);
  const lastKey = lastScene ? keyOf(lastScene) : null;

  const pool = scenes.filter((s) => !recent.includes(s.id) && keyOf(s) !== lastKey);
  const candidates = pool.length ? pool : scenes; // o pool nunca fica vazio

  return weightedPick(
    candidates,
    (s) => (s.weight ?? 1) * noveltyMultiplier(s, seen),
    random,
  );
}

/**
 * Escolhe o final dentro da cena. Mesmo algoritmo, sem a camada de histórico —
 * só o veto ao último final visto NESTA cena, que é a repetição mais visível
 * do jogo (ver o mesmo desfecho duas vezes seguidas na mesma cena).
 */
export function pickEnding(scene, { seen = new Set(), lastEndingId = null, random } = {}) {
  const endings = scene?.endings ?? [];
  if (!endings.length) return null;

  const pool = endings.filter((e) => e.id !== lastEndingId);
  const candidates = pool.length ? pool : endings;

  return weightedPick(
    candidates,
    (e) => (e.weight ?? 1) * (seen.has(e.id) ? 1 : 3),
    random,
  );
}
