/* Explosive Peter — progresso do jogador.
 *
 * O ÚNICO módulo que conhece `localStorage` (ARCHITECTURE.md §7). Nenhum
 * try/catch de storage existe fora daqui: se o navegador negar (Safari
 * privado, quota cheia), este arquivo cai num objeto em memória e expõe
 * exatamente a mesma API. O jogo funciona igual, só não lembra.
 *
 * `version` diferente → reset silencioso. Sem código de migração: o save é um
 * placar de piadas, não um documento.
 */

const KEY = 'explosive-peter:v1';
const VERSION = 1;

function defaults() {
  return {
    version: VERSION,
    seenEndings: [],
    deaths: 0, // quantas vezes o Pedro explodiu
    saves: 0, // quantas vezes ele sobreviveu
    rounds: 0,
    // Entra no schema já no D4 mesmo sem uso: um número inutilizado custa
    // zero, e adicioná-lo depois custaria `version: 2` e o reset do save de
    // todos os playtesters (ARCHITECTURE.md §7).
    lastDiscoveryRound: 0,
    firstRun: true,
  };
}

/** Storage real, ou um de mentira que se comporta igual. */
const store = (() => {
  try {
    const probe = '__ep__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    console.warn('[progress] localStorage indisponível — progresso só nesta sessão');
    const mem = new Map();
    return {
      getItem: (k) => (mem.has(k) ? mem.get(k) : null),
      setItem: (k, v) => mem.set(k, String(v)),
      removeItem: (k) => mem.delete(k),
    };
  }
})();

/** @type {ReturnType<typeof defaults>} */
let state = defaults();

function write() {
  try {
    store.setItem(KEY, JSON.stringify(state));
  } catch {
    // Quota estourou no meio do jogo. Segue jogando (P5).
  }
}

/** Devolve estado válido SEMPRE: ausente, corrompido ou de outra versão vira o default. */
export function load() {
  let parsed = null;
  try {
    parsed = JSON.parse(store.getItem(KEY) ?? 'null');
  } catch {
    parsed = null;
  }

  const ok = parsed
    && typeof parsed === 'object'
    && parsed.version === VERSION
    && Array.isArray(parsed.seenEndings);

  state = ok ? { ...defaults(), ...parsed } : defaults();
  return get();
}

/** Cópia rasa — ninguém de fora escreve no estado sem passar por `record`. */
export function get() {
  return { ...state, seenEndings: [...state.seenEndings] };
}

export function hasSeen(id) {
  return state.seenEndings.includes(id);
}

/** Set pronto para o picker, que só precisa consultar. */
export function seenSet() {
  return new Set(state.seenEndings);
}

/**
 * I4: chamado UMA vez por rodada, na entrada de ENDING. Rodada abortada não conta.
 * Devolve `{ isNew }` para quem quiser dar destaque à descoberta.
 */
export function record({ ending }) {
  if (!ending) return { isNew: false };

  state.rounds += 1;

  // `survives: null` (final ambíguo) não mexe nos contadores — que é a piada.
  if (ending.survives === true) state.saves += 1;
  else if (ending.survives === false) state.deaths += 1;

  const isNew = !state.seenEndings.includes(ending.id);
  if (isNew) {
    state.seenEndings.push(ending.id);
    state.lastDiscoveryRound = state.rounds;
  }

  state.firstRun = false;
  write();

  return { isNew };
}

/** Só para o console de dev. */
export function reset() {
  state = defaults();
  write();
  return get();
}
