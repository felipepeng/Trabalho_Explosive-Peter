/* Explosive Peter — os SFX.
 *
 * Web Audio API direta, sem arquivo nenhum: cada som é SINTETIZADO na hora a
 * partir de osciladores e ruído. A decisão é deliberada (ARCHITECTURE.md §11):
 *
 *   - zero bytes de asset num jogo cuja premissa é "abriu o site, já começou";
 *   - some o único problema de caminho de asset do §10 (`new URL(...)` que
 *     funciona no dev e quebra no Pages), porque não existe caminho;
 *   - som tosco combina com arte tosca. É a estética oficial do projeto.
 *
 * O contrato do §8, este arquivo cumpre inteiro:
 *
 *   - o `AudioContext` só nasce no primeiro gesto — antes disso não existe;
 *   - `play()` é NO-OP SILENCIOSO enquanto não houver contexto rodando. Nunca
 *     lança, nunca dispara atrasado na rodada seguinte;
 *   - `unlock()` no primeiro gesto qualquer do documento, em captura e `once`.
 *     Basta o primeiro clique de restart: da segunda rodada em diante tem som;
 *   - `suspend`/`resume` junto com o clock, no `visibilitychange`.
 *
 * Se ninguém encostar na tela, a primeira rodada sai muda — e em `ninguem-veio`
 * ("explosão seca, sem música, sem graça") isso ajuda a piada.
 */

/** Volume geral. Baixo de propósito: é um jogo que abre sozinho num navegador. */
const MASTER = 0.28;

export function createAudio() {
  /** @type {AudioContext|null} */
  let ctx = null;
  let master = null;
  let ruido = null; // buffer de ruído branco, reaproveitado

  function envelope(dur, pico = 1, ataque = 0.005) {
    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(pico, t + ataque);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(master);
    return g;
  }

  /** Nota: onda simples com queda exponencial, opcionalmente varrendo a altura. */
  function tom({ freq, dur = 0.18, type = 'square', gain = 0.5, to, delay = 0 }) {
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(master);

    osc.connect(g);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  /** Ruído filtrado: explosão, whoosh, água, corte. */
  function chiado({ dur = 0.4, gain = 0.5, type = 'lowpass', freq = 900, to, q = 1 }) {
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = ruido;
    src.loop = true;

    const filtro = ctx.createBiquadFilter();
    filtro.type = type;
    filtro.Q.value = q;
    filtro.frequency.setValueAtTime(freq, t);
    if (to) filtro.frequency.exponentialRampToValueAtTime(to, t + dur);

    const g = envelope(dur, gain, 0.008);
    src.connect(filtro).connect(g);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  /* ---------------------------------------------------------------- *
   * O catálogo. Cada som é uma função de ~2 linhas.
   * ---------------------------------------------------------------- */
  const SONS = {
    tick: () => tom({ freq: 880, dur: 0.05, type: 'square', gain: 0.16 }),
    'tick-urgente': () => tom({ freq: 1320, dur: 0.07, type: 'square', gain: 0.3 }),

    boom: () => {
      chiado({ dur: 0.7, gain: 0.85, type: 'lowpass', freq: 1800, to: 90 });
      tom({ freq: 120, to: 28, dur: 0.6, type: 'sine', gain: 0.9 });
    },

    whoosh: () => chiado({ dur: 0.34, gain: 0.35, type: 'bandpass', freq: 300, to: 2200, q: 1.4 }),

    splash: () => {
      chiado({ dur: 0.6, gain: 0.5, type: 'highpass', freq: 300, to: 2600 });
      tom({ freq: 300, to: 90, dur: 0.35, type: 'sine', gain: 0.35 });
    },

    portal: () => {
      tom({ freq: 90, to: 700, dur: 0.5, type: 'sawtooth', gain: 0.3 });
      tom({ freq: 95, to: 690, dur: 0.5, type: 'sawtooth', gain: 0.25, delay: 0.03 });
    },

    corte: () => chiado({ dur: 0.09, gain: 0.45, type: 'highpass', freq: 3000, q: 2 }),

    // salvamento: três notas subindo
    fanfarra: () => {
      [523, 659, 880].forEach((f, i) => tom({ freq: f, dur: 0.22, gain: 0.4, delay: i * 0.1 }));
    },

    // morte: duas notas descendo, sem esperança
    fracasso: () => {
      [300, 190].forEach((f, i) => tom({ freq: f, dur: 0.3, type: 'sawtooth', gain: 0.3, delay: i * 0.14 }));
    },

    // o drop raro: dois "pling" de item
    drop: () => {
      [988, 1318].forEach((f, i) => tom({ freq: f, dur: 0.3, type: 'sine', gain: 0.4, delay: i * 0.11 }));
    },

    // registro corrompido: ruído seco e uma nota errada
    glitch: () => {
      chiado({ dur: 0.16, gain: 0.4, type: 'bandpass', freq: 1400, q: 6 });
      tom({ freq: 140, to: 132, dur: 0.5, type: 'square', gain: 0.22, delay: 0.05 });
    },
  };

  return {
    /** Toca, se houver som. Silêncio nunca é erro. */
    play(name) {
      if (!ctx || ctx.state !== 'running' || !name) return;

      const som = SONS[name];
      if (!som) {
        console.warn(`[audio] som inexistente: "${name}"`);
        return;
      }
      try {
        som();
      } catch (err) {
        // P5: som que falha não derruba a rodada.
        console.error(`[audio] "${name}" falhou:`, err);
      }
    },

    /** Chamado no primeiro gesto. Depois disso o jogo tem som. */
    unlock() {
      if (ctx) {
        if (ctx.state === 'suspended') ctx.resume();
        return;
      }
      const AC = window.AudioContext ?? window.webkitAudioContext;
      if (!AC) return; // navegador sem Web Audio: o jogo segue mudo

      try {
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = MASTER;
        master.connect(ctx.destination);

        // 1s de ruído branco serve a explosão, água, whoosh e corte
        ruido = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const dados = ruido.getChannelData(0);
        for (let i = 0; i < dados.length; i += 1) dados[i] = Math.random() * 2 - 1;

        ctx.resume();
      } catch (err) {
        console.warn('[audio] sem áudio nesta máquina:', err);
        ctx = null;
      }
    },

    suspend() {
      if (ctx?.state === 'running') ctx.suspend();
    },

    resume() {
      if (ctx?.state === 'suspended') ctx.resume();
    },

    get pronto() {
      return ctx?.state === 'running';
    },

    /** Lista para o validador conferir os nomes usados em `data/`. */
    get nomes() {
      return Object.keys(SONS);
    },
  };
}

/**
 * Destrava no PRIMEIRO gesto qualquer do documento. Não é interação nova (o
 * GDD §4.2 proíbe): não há botão, não há consequência de jogo, e o clique de
 * restart que o jogador já ia dar serve.
 */
export function bindUnlock(audio) {
  const destravar = () => audio.unlock();
  const opts = { once: true, capture: true, passive: true };
  document.addEventListener('pointerdown', destravar, opts);
  document.addEventListener('keydown', destravar, opts);
}
