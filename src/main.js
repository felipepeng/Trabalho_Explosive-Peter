/* Explosive Peter — máquina de estados e costura da rodada.
 *
 *   BOOT → COUNTDOWN → SCENE → CLIMAX → ENDING ──[clique]──► COUNTDOWN
 *                    └──── cena sem personagem ────┘
 *
 * As fases são marcadores de UMA timeline contínua (é por isso que o timer
 * segue correndo durante a invasão), não três processadores. Este arquivo só
 * reage: troca a classe do <body> e agenda a transição seguinte no clock.
 *
 * D3: o conteúdo saiu daqui. A rodada agora é `data/scenes.js` costurado pelo
 * `buildRound` e executado pelo director. Este arquivo não deve crescer por
 * causa de cena nova — só por causa de fase nova, e não há fase nova prevista.
 *
 * D4: o picker escolhe a rodada e o progresso é gravado na entrada de ENDING.
 * O forçamento de `ninguem-veio` na primeira rodada mora AQUI de propósito
 * (ARCHITECTURE.md §4): é a única regra do jogo que conhece um id de cena, e
 * deixá-la no picker faria o motor conhecer o catálogo.
 */

import {
  COUNTDOWN_MS,
  MAX_ROUND_MS,
  MAX_ROUND_MS_DESIGN,
  FREEZE_MS,
  DRAMATIC_PAUSE_MS,
  JOIN_GAP,
  FIRST_RUN_SCENE,
} from './config.js';
import { createClock, bindVisibility } from './engine/clock.js';
import { createDirector, buildRound } from './engine/director.js';
import { actions } from './engine/actions.js';
import { pickScene, pickEnding } from './engine/picker.js';
import { scenes } from './data/scenes.js';
import { validate } from './data/validate.js';
import * as progress from './state/progress.js';
import { createCountdown } from './ui/countdown.js';
import { createStage } from './ui/stage.js';
import { createFx } from './ui/fx.js';
import { createHud } from './ui/hud.js';
import { createEndingCard } from './ui/ending-card.js';

/* ------------------------------------------------------------------ *
 * Fases
 * ------------------------------------------------------------------ */

const PHASE = {
  BOOT: 'boot',
  COUNTDOWN: 'countdown',
  SCENE: 'scene',
  CLIMAX: 'climax',
  ENDING: 'ending',
};

/** Ordem das fases. A transição só anda para frente dentro de uma rodada. */
const ORDER = [PHASE.BOOT, PHASE.COUNTDOWN, PHASE.SCENE, PHASE.CLIMAX, PHASE.ENDING];

/* ------------------------------------------------------------------ *
 * Montagem
 * ------------------------------------------------------------------ */

const el = {
  body: document.body,
  stage: document.getElementById('stage'),
  cast: document.getElementById('cast'),
  fx: document.getElementById('fx-layer'),
  fxBack: document.getElementById('fx-back'),
  timer: document.getElementById('timer'),
  message: document.getElementById('message'),
  deaths: document.getElementById('hud-deaths'),
  card: document.getElementById('ending-card'),
};

const clock = createClock();
const director = createDirector({ clock });
const countdown = createCountdown(el.timer, clock);
const stage = createStage({ cast: el.cast, layers: [el.fx, el.fxBack] });
const fx = createFx({ stage: el.stage, layer: el.fx, back: el.fxBack });
const hud = createHud({ deaths: el.deaths });
const endingCard = createEndingCard(el.card, { onRestart: startRound });

let phase = PHASE.BOOT;

/** Identidade da rodada em curso. Callback de rodada velha se reconhece
 *  desatualizado e desiste — é o que sustenta I1 e o watchdog. */
let roundId = 0;

/** A rodada corrente: { scene, ending, climaxAt, endsAt, signal }. */
let round = null;

/** Aborta os beats da rodada anterior. Trocado a cada `startRound`. */
let roundAbort = null;

/** Sessão: o histórico do anti-repetição. Some ao recarregar a página, de
 *  propósito — é memória de ritmo, não progresso (ARCHITECTURE.md §7). */
const session = {
  /** ids das cenas jogadas, em ordem */
  history: [],
  /** último final visto em cada cena, para não repetir o desfecho */
  lastEndingByScene: Object.create(null),
};

/** Denominador do contador `X/N`: sai do catálogo, não de uma constante — o
 *  número cresce sozinho conforme o D7 e o D8 escrevem os finais. */
const TOTAL_ENDINGS = scenes.reduce((n, s) => n + (s.endings?.length ?? 0), 0);

bindVisibility(clock, {
  onHide: () => el.body.classList.add('is-tab-hidden'),
  onShow: () => el.body.classList.remove('is-tab-hidden'),
});

/* ------------------------------------------------------------------ *
 * Escolha da rodada
 * ------------------------------------------------------------------ */

const byId = (id) => scenes.find((s) => s.id === id);

function fallbackEnding(scene) {
  console.warn(`[main] cena "${scene?.id}" não tem final sorteável`);
  // `synthetic` mantém esse final de emergência fora do save: ele não é
  // conteúdo, e contaminaria o X/N com um id que não existe no catálogo.
  return { id: `${scene?.id}:sem-final`, title: 'FIM', survives: null, timeline: [], synthetic: true };
}

/** A cena e o final são sorteados JUNTOS, no início da rodada — o final
 *  precisa estar decidido antes do primeiro beat da cena rodar. */
function pickRound() {
  const seen = progress.seenSet();

  // GDD §3.2: a primeira rodada da vida do jogador é sempre `ninguem-veio`.
  // Ela estabelece a regra para que todas as outras funcionem como quebra.
  const scene = progress.get().firstRun
    ? byId(FIRST_RUN_SCENE) ?? scenes[0]
    : pickScene(scenes, { history: session.history, seen });

  // P5: cena sem final é bug de dado (o validador do D9 reprova), mas aqui
  // ela vira uma rodada feia em vez de uma tela morta.
  const ending = pickEnding(scene, {
    seen,
    lastEndingId: session.lastEndingByScene[scene.id] ?? null,
  }) ?? fallbackEnding(scene);

  session.history.push(scene.id);
  session.lastEndingByScene[scene.id] = ending?.id ?? null;

  return { scene, ending };
}

/* ------------------------------------------------------------------ *
 * Transições
 * ------------------------------------------------------------------ */

function setPhase(next) {
  if (ORDER.indexOf(next) <= ORDER.indexOf(phase) && next !== PHASE.COUNTDOWN) return;
  el.body.classList.remove(`state-${phase}`);
  phase = next;
  el.body.classList.add(`state-${phase}`);
}

/** COUNTDOWN. I3: desmonta o palco e remonta — zero estado residual (P4). */
function startRound() {
  const id = ++roundId;

  // Beat de rodada velha que já estava na fila do frame corrente morre aqui.
  roundAbort?.abort();
  roundAbort = new AbortController();

  endingCard.hide();
  clock.reset();
  stage.setUpRound();
  countdown.reset(COUNTDOWN_MS / 1000);
  countdown.mount();
  el.message.textContent = 'Não tem como salvar ele.';

  const { scene, ending } = pickRound();
  const { beats, invadeAt, climaxAt, endsAt } = buildRound(scene, ending, { joinGap: JOIN_GAP });
  round = { scene, ending, climaxAt, endsAt, signal: roundAbort.signal };

  setPhase(PHASE.COUNTDOWN);

  // Os verbos chegam ao director por parâmetro — ele não conhece `actions`.
  director.run(beats, { clock, stage, fx, countdown, signal: round.signal }, actions);

  // Cena com personagem entra em SCENE quando ele invade. Cena sem personagem
  // vai de COUNTDOWN direto ao CLIMAX (o desvio do diagrama da §5).
  if (scene.character) clock.at(invadeAt, () => setPhase(PHASE.SCENE));

  clock.at(climaxAt, () => toClimax(id));
  clock.at(endsAt + DRAMATIC_PAUSE_MS, () => toEnding(id));

  // Watchdog (ARCHITECTURE.md §5): rede de segurança para bug, não teto de
  // ritmo. Se a rodada travar, o jogador vê uma explosão, não uma tela morta.
  clock.at(MAX_ROUND_MS, () => {
    if (id !== roundId || phase === PHASE.ENDING) return;
    console.warn('[main] watchdog: rodada passou de', MAX_ROUND_MS, 'ms');
    // P5: no pior caso, explode o Pedro. O jogador nunca olha tela morta.
    toClimax(id);
    actions.explode({ clock, stage, fx, countdown, signal: round.signal }, { vaporize: ['peter', 'bomb'] });
    clock.after(DRAMATIC_PAUSE_MS, () => toEnding(id));
  });

  clock.start();
}

/** CLIMAX: o final já está rodando em beats. Aqui só o freeze-frame e o timer. */
function toClimax(id) {
  if (id !== roundId || phase === PHASE.CLIMAX || phase === PHASE.ENDING) return;
  setPhase(PHASE.CLIMAX);

  countdown.hold();

  // Freeze-frame de 150ms em tempo real; a pausa dramática de 600ms já está
  // agendada em tempo de jogo e só volta a correr quando o clock destrava.
  clock.freeze(FREEZE_MS);
  el.body.classList.add('is-frozen');
  clock.after(0, () => el.body.classList.remove('is-frozen'));
}

/** ENDING. I2: daqui só se sai por clique. */
function toEnding(id) {
  if (id !== roundId || phase === PHASE.ENDING) return;
  setPhase(PHASE.ENDING);

  clock.pause();
  countdown.unmount();

  // I4: o progresso é gravado UMA vez, exatamente aqui. Rodada abortada
  // (recarregou a página, clicou no restart antes do fim) não conta.
  if (!round.ending.synthetic) progress.record({ ending: round.ending });
  const saved = progress.get();
  hud.setDeaths(saved.deaths);

  endingCard.show({
    title: round.ending.title,
    counter: `${saved.seenEndings.length} / ${TOTAL_ENDINGS}`,
  });
}

/* ------------------------------------------------------------------ *
 * Boot
 * ------------------------------------------------------------------ */

progress.load();
hud.setDeaths(progress.get().deaths);

// Só em dev: o orçamento de 15s e o vocabulário de verbos viram erro de
// console enquanto o conteúdo está sendo escrito, não playtest no D10.
if (import.meta.env?.DEV) {
  validate(scenes, {
    verbs: Object.keys(actions),
    maxRoundMs: MAX_ROUND_MS_DESIGN,
    dramaticPauseMs: DRAMATIC_PAUSE_MS,
    joinGap: JOIN_GAP,
  });
}

// O jogo começa sozinho: sem menu, sem botão de start, sem tela de título.
startRound();

if (import.meta.env?.DEV) {
  // Bancada de teste dos verbos enquanto não há cena com personagem:
  //   beat({ do: 'shake', intensity: 10 })
  //   beat({ do: 'say', who: 'peter', text: 'oi', ms: 1500 })
  const beat = (b) => actions[b.do]?.({ clock, stage, fx, countdown, signal: round?.signal }, b);
  Object.assign(window, {
    clock, countdown, stage, fx, director, actions, scenes, beat, progress, session,
    get phase() { return phase; },
    get round() { return round; },
  });
}
