/* Explosive Peter — máquina de estados e costura da rodada.
 *
 *   BOOT → COUNTDOWN → SCENE → CLIMAX → ENDING ──[clique]──► COUNTDOWN
 *                    └──── cena sem personagem ────┘
 *
 * As fases são marcadores de UMA timeline contínua (é por isso que o timer
 * segue correndo durante a invasão), não três processadores. Este arquivo só
 * reage: troca a classe do <body> e agenda a transição seguinte no clock.
 *
 * D2: a cena `ninguem-veio` está hardcoded logo abaixo, como manda o GDD §11.
 * No D3 ela vira dado em `data/scenes.js` e quem a executa é o director —
 * este arquivo não deve crescer por causa de conteúdo novo.
 */

import {
  COUNTDOWN_MS,
  MAX_ROUND_MS,
  FREEZE_MS,
  DRAMATIC_PAUSE_MS,
} from './config.js';
import { createClock, bindVisibility } from './engine/clock.js';
import { createCountdown } from './ui/countdown.js';
import { createStage } from './ui/stage.js';
import { createFx } from './ui/fx.js';
import { createEndingCard } from './ui/ending-card.js';

/* ------------------------------------------------------------------ *
 * A cena de fundação (GDD §6.1)
 * ------------------------------------------------------------------ */

const NINGUEM_VEIO = {
  id: 'ninguem-veio',
  character: null, // ninguém invade: COUNTDOWN vai direto ao CLIMAX
  ending: {
    id: 'ninguem-veio',
    title: 'NINGUÉM VEIO',
    survives: false,
  },
};

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
  timer: document.getElementById('timer'),
  message: document.getElementById('message'),
  card: document.getElementById('ending-card'),
};

const clock = createClock();
const countdown = createCountdown(el.timer, clock);
const stage = createStage({ cast: el.cast, fx: el.fx });
const fx = createFx({ stage: el.stage, layer: el.fx });
const endingCard = createEndingCard(el.card, { onRestart: startRound });

let phase = PHASE.BOOT;

/** Identidade da rodada em curso. Callback de rodada velha se reconhece
 *  desatualizado e desiste — é o que sustenta I1 e o watchdog. */
let roundId = 0;

/** A rodada corrente. No D4 passa a vir do picker. */
let round = null;

bindVisibility(clock, {
  onHide: () => el.body.classList.add('is-tab-hidden'),
  onShow: () => el.body.classList.remove('is-tab-hidden'),
});

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

  endingCard.hide();
  clock.reset();
  stage.setUpRound();
  countdown.reset(COUNTDOWN_MS / 1000);
  countdown.mount();
  el.message.textContent = 'Não tem como salvar ele.';

  round = NINGUEM_VEIO; // D4: aqui entra o picker
  setPhase(PHASE.COUNTDOWN);

  // `ninguem-veio` não tem personagem: o timer zerar É o clímax.
  countdown.onZero(() => toClimax(id));

  // Watchdog (ARCHITECTURE.md §5): rede de segurança para bug, não teto de
  // ritmo. Se a rodada travar, o jogador vê uma explosão, não uma tela morta.
  clock.at(MAX_ROUND_MS, () => {
    if (id !== roundId || phase === PHASE.ENDING) return;
    console.warn('[main] watchdog: rodada passou de', MAX_ROUND_MS, 'ms');
    toClimax(id);
  });

  clock.start();
}

/** CLIMAX: explosão, freeze-frame, pausa dramática. */
function toClimax(id) {
  if (id !== roundId || phase === PHASE.CLIMAX || phase === PHASE.ENDING) return;
  setPhase(PHASE.CLIMAX);

  countdown.hold();

  const survives = round.ending.survives === true;
  if (!survives) {
    stage.get('peter')?.classList.add('is-vaporized');
    stage.get('bomb')?.classList.add('is-vaporized');
    fx.explode(stage.get('bomb'), { intensity: 8 });
  }

  // Freeze-frame de 150ms em tempo real, e só depois a pausa dramática de
  // 600ms em tempo de jogo. Os dois saem do mesmo clock (P3).
  clock.freeze(FREEZE_MS);
  el.body.classList.add('is-frozen');
  clock.after(0, () => el.body.classList.remove('is-frozen'));

  clock.after(DRAMATIC_PAUSE_MS, () => toEnding(id));
}

/** ENDING. I2: daqui só se sai por clique. */
function toEnding(id) {
  if (id !== roundId || phase === PHASE.ENDING) return;
  setPhase(PHASE.ENDING);

  clock.pause();
  countdown.unmount();

  // I4: o progresso é gravado uma vez, exatamente aqui. Entra no D4.

  endingCard.show({ title: round.ending.title });
}

/* ------------------------------------------------------------------ *
 * Boot
 * ------------------------------------------------------------------ */

// O jogo começa sozinho: sem menu, sem botão de start, sem tela de título.
startRound();

if (import.meta.env?.DEV) {
  Object.assign(window, { clock, countdown, stage, fx, get phase() { return phase; } });
}
