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
 *   - `unlock()` em gesto qualquer do documento, em captura. NÃO é `once`:
 *     a escuta só é desligada quando o contexto está `running` DE VERDADE, e
 *     volta se ele travar de novo. `resume()` é assíncrono e pode não pegar
 *     (aba que voltou do background, gesto que o navegador não aceitou como
 *     ativação) — com `once` um único gesto perdido deixava o jogo mudo para
 *     sempre, que era o bug de "às vezes tem som, às vezes não";
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

    // a buzina do FIESTA: dois toques curtos, cada um com duas vozes em terça
    // maior. É "bi-bi", não uma nota — o gag da cena depende de soar como
    // buzina de carro popular, e nenhum dos outros onze sons chega perto.
    buzina: () => {
      [0, 0.2].forEach((atraso) => {
        tom({ freq: 440, dur: 0.15, type: 'square', gain: 0.34, delay: atraso });
        tom({ freq: 554, dur: 0.15, type: 'square', gain: 0.26, delay: atraso + 0.004 });
      });
    },

    // registro corrompido: ruído seco e uma nota errada
    glitch: () => {
      chiado({ dur: 0.16, gain: 0.4, type: 'bandpass', freq: 1400, q: 6 });
      tom({ freq: 140, to: 132, dur: 0.5, type: 'square', gain: 0.22, delay: 0.05 });
    },
  };

  /** Avisado toda vez que se sabe se o contexto está rodando ou não.
   *  É por aqui que `bindUnlock` liga e desliga a escuta de gesto. */
  let aoSaber = null;
  /** Um `resume()` de cada vez: sem isto, um tique por segundo com a aba
   *  suspensa viraria uma fila de promessas pendentes. */
  let tentando = false;

  /** Nasce no primeiro gesto — antes disso o contexto não existe (§8). */
  function criar() {
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
    } catch (err) {
      console.warn('[audio] sem áudio nesta máquina:', err);
      ctx = null;
    }
  }

  /**
   * Tenta pôr o contexto para rodar e AVISA o resultado.
   *
   * O detalhe que importa: `resume()` devolve uma promessa, e o estado só é
   * confiável depois que ela resolve. Perguntar `ctx.state` na linha seguinte
   * responde "suspended" mesmo quando vai destravar — foi o que fazia o som
   * sumir logo depois de um gesto válido.
   */
  function confirmar() {
    if (!ctx || tentando) return;
    if (ctx.state === 'running') {
      aoSaber?.(true);
      return;
    }
    tentando = true;
    const fim = () => {
      tentando = false;
      aoSaber?.(ctx?.state === 'running');
    };
    // `then(fim, fim)`: promessa rejeitada é resposta como qualquer outra —
    // significa "continua travado", e quem escuta gesto precisa saber disso.
    ctx.resume().then(fim, fim);
  }

  return {
    /** Toca, se houver som. Silêncio nunca é erro. */
    play(name) {
      if (!name) return;
      if (!ctx || ctx.state !== 'running') {
        // Continua no-op silencioso — mas aproveita para tentar destravar, em
        // vez de só desistir. O próximo som já sai.
        confirmar();
        return;
      }

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

    /** Chamado a cada gesto ENQUANTO não há som. Idempotente de propósito:
     *  criar o contexto acontece uma vez, tentar destravar acontece sempre. */
    unlock() {
      if (!ctx) criar();
      confirmar();
    },

    suspend() {
      if (ctx?.state === 'running') ctx.suspend();
    },

    /** A aba voltou. Se o navegador não devolver o som sem um gesto novo,
     *  `confirmar` avisa e a escuta de gesto volta sozinha. */
    resume() {
      confirmar();
    },

    /** `fn(rodando)` a cada vez que se descobre o estado real do contexto.
     *  Um ouvinte só: quem usa isto é o `bindUnlock`. */
    onSaber(fn) {
      aoSaber = fn;
      if (ctx?.state === 'running') fn(true);
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
 * Destrava em gesto qualquer do documento. Não é interação nova (o GDD §4.2
 * proíbe): não há botão, não há consequência de jogo, e o clique de restart
 * que o jogador já ia dar serve. É o ÚNICO efeito que um gesto pode ter fora
 * de ENDING (invariante I5).
 *
 * A escuta fica de pé enquanto não houver som e cai assim que houver — e
 * volta se o contexto travar de novo, que é o caso da aba que passou tempo
 * escondida. Era aqui que morava o "às vezes tem som, às vezes não": com
 * `once`, o primeiro gesto gastava a única chance, mesmo quando o navegador
 * não destravava nada com ele.
 *
 * Cinco eventos porque nem todo clique passa pelos mesmos: `pointerdown` é o
 * caso normal, `click` cobre o botão acionado pelo teclado, `touchend` cobre
 * navegador de toque que só considera o toque terminado como ativação.
 */
export function bindUnlock(audio) {
  const EVENTOS = ['pointerdown', 'pointerup', 'click', 'touchend', 'keydown'];
  const opts = { capture: true, passive: true };
  const destravar = () => audio.unlock();

  // Registrar o MESMO par (função, opções) duas vezes é no-op por
  // especificação, então ligar de novo enquanto já está ligado não empilha.
  const ligar = () => EVENTOS.forEach((e) => document.addEventListener(e, destravar, opts));
  const desligar = () => EVENTOS.forEach((e) => document.removeEventListener(e, destravar, opts));

  audio.onSaber((rodando) => (rodando ? desligar() : ligar()));
  ligar();
}
