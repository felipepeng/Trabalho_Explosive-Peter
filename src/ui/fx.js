/* Explosive Peter — efeitos de tela.
 *
 * Helpers de DOM para o juice: flash, shake, explosão. Os verbos do
 * actions.js (D3) são uma casca fina por cima destes — quem sabe escrever
 * uma <div> na #fx-layer é aqui, e só aqui.
 *
 * Regra da ARCHITECTURE.md §6: JS não escreve style.transform. JS liga uma
 * classe .is-* ou escreve uma custom property; o @keyframes do juice.css faz
 * o resto. Isso mantém toda amplitude passando por var(--juice).
 */

/** Teto duro: no máximo 2 flashes por segundo, independente de configuração.
 *  Luz piscando acima de ~3 Hz é gatilho fotossensível (ARCHITECTURE.md §6). */
const FLASH_MIN_GAP_MS = 500;

export function createFx({ stage, layer, back }) {
  let lastFlash = -Infinity;

  function flash({ ms = 260 } = {}) {
    const now = performance.now();
    if (now - lastFlash < FLASH_MIN_GAP_MS) return;
    lastFlash = now;

    const el = document.createElement('div');
    el.className = 'flash';
    el.style.setProperty('--flash-ms', `${ms}ms`);
    el.addEventListener('animationend', () => el.remove(), { once: true });
    layer.appendChild(el);
  }

  function shake({ intensity = 6 } = {}) {
    stage.style.setProperty('--shake-amp', intensity);
    stage.classList.remove('is-shaking');
    void stage.offsetWidth; // reinicia a animação mesmo se já estava sacudindo
    stage.classList.add('is-shaking');

    // Sem setTimeout: a própria animação avisa quando acabou (P3).
    // `animationend` BORBULHA: o flash, o tique do timer e a bola de fogo são
    // todos descendentes do palco e terminariam a tremida antes da hora. Só o
    // evento do próprio #stage conta.
    stage.addEventListener('animationend', function done(ev) {
      if (ev.target !== stage) return;
      stage.removeEventListener('animationend', done);
      stage.classList.remove('is-shaking');
    });
  }

  /**
   * Explosão: sete camadas de efeito, e a tremida nunca é opcional.
   *
   * A posição sai do alvo, mas `x`/`y` passam por cima — é o que permite
   * escrever fogo de artifício no céu sem inventar um verbo novo.
   * `ms` estica a bola de fogo (a explosão subaquática em câmera lenta).
   */
  function explode(target, { intensity = 8, x, y, ms } = {}) {
    const at = {
      x: x ?? target?.style.getPropertyValue('--x') ?? 500,
      y: y ?? target?.style.getPropertyValue('--y') ?? 470,
    };
    const px = at.x || 500;
    const py = at.y || 470;

    // Toda peça nasce igual: posicionada na explosão e removida quando a
    // própria animação acaba. `ev.target === el` porque animationend BORBULHA.
    const peca = (cls, camada, vars = {}) => {
      const el = document.createElement('div');
      el.className = cls;
      el.style.setProperty('--x', px);
      el.style.setProperty('--y', py);
      if (ms) el.style.setProperty('--boom-ms', `${ms}ms`);
      for (const [nome, valor] of Object.entries(vars)) el.style.setProperty(nome, valor);
      el.addEventListener('animationend', (ev) => {
        if (ev.target === el) el.remove();
      }, { once: true });
      camada.appendChild(el);
      return el;
    };

    const boom = peca('boom', layer);      // a bola de fogo
    peca('boom-core', layer);              // clarão branco no miolo, mais rápido
    peca('rays', layer);                   // raios varrendo para fora
    peca('shock', layer);                  // onda de choque
    // A segunda onda sai atrasada: explosão de verdade não empurra uma vez só.
    peca('shock', layer, { '--shock-delay': '120ms' });
    peca('shock', layer, { '--shock-delay': '260ms' });
    // Anel RASTEIRO: achatado, correndo pelo chão. O anel redondo diz que
    // empurrou o ar; este diz que empurrou o mundo.
    peca('shock-ground', layer);
    // SEGUNDA DETONAÇÃO, fora do centro e atrasada. Uma bola de fogo só lê
    // como "acendeu"; duas leem como "está explodindo ainda".
    peca('boom', layer, {
      '--boom-delay': '180ms',
      '--x': px + 38,
      '--y': py - 26,
    });

    // Fumaça no #fx-back para passar POR TRÁS do elenco — um filho de
    // #fx-layer não consegue, e fumaça na frente do Pedro esconderia a piada.
    const baforadas = 7 + intensity;
    for (let i = 0; i < baforadas; i += 1) {
      peca('smoke', back ?? layer, {
        '--dx': `${Math.round(-60 + Math.random() * 120)}`,
        '--dy': `${Math.round(-40 - Math.random() * (40 + intensity * 6))}`,
        '--smoke-size': `${Math.round(46 + Math.random() * 44)}`,
        '--smoke-ms': `${Math.round(900 + Math.random() * 600)}ms`,
        '--smoke-delay': `${Math.round(Math.random() * 220)}ms`,
      });
    }

    // Estilhaços: pedaços geométricos, não emoji. Emoji na explosão é escolha
    // do DADO, num beat de `burst`.
    burst({
      x: px, y: py,
      count: Math.round(20 + intensity * 3.5),
      power: 230 + intensity * 30,
      spread: 360, gravity: 1.1, ms: 1100, size: 24,
    });
    // Segunda leva, miúda e rápida: é o que faz a explosão parecer densa em
    // vez de meia dúzia de quadrados voando.
    burst({
      x: px, y: py,
      count: Math.round(24 + intensity * 4),
      power: 320 + intensity * 40,
      spread: 360, gravity: 0.7, ms: 750, size: 9,
    });
    // Terceira leva: BRASAS. Fracas, pesadas e lentas — continuam caindo
    // depois que o clarão acabou, e é isso que faz a explosão ter rastro em
    // vez de simplesmente terminar.
    burst({
      x: px, y: py,
      count: Math.round(10 + intensity * 2),
      power: 120 + intensity * 16,
      spread: 360, gravity: 2.2, ms: 1600, size: 6, tone: 'ember',
    });

    flash();
    // A TREMIDA NUNCA É OPCIONAL, e o piso é o que garante isso: mesmo uma
    // explosão de intensidade 1 sacode a tela de verdade. O zoom que cobre a
    // fresta preta na borda é proporcional à amplitude, no juice.css.
    // Teto de 24 junto com o piso de 12: acima disso o zoom que cobre a
    // borda passa de 26% e a tela vira um soco no olho que ESCONDE a
    // explosão em vez de vendê-la. É o botão para girar se quiser mais.
    shake({ intensity: Math.min(24, Math.max(12, intensity * 1.9 + 5)) });
    return boom;
  }

  /**
   * PARTÍCULAS — o motor dos momentos-chave: explosão, batida, respingo, onda
   * chegando. Cada pedaço é um <span> que sai do ponto em linha reta e cai; com
   * `gravity` negativa ele sobe, e é assim que pedaço vira bolha.
   *
   * A física mora no @keyframes. Aqui só sorteamos ângulo e distância e
   * escrevemos custom properties, porque JS não escreve `style.transform`
   * (ARCHITECTURE.md §6) — é o que mantém tudo passando por `var(--juice)`.
   *
   * `emojis` vazio dá estilhaço geométrico; `emojis: ['X']` dá emoji voando.
   *
   * @param {object} o
   * @param {number} [o.x] @param {number} [o.y]  origem, em unidades de design
   * @param {string[]} [o.emojis]  símbolos, sorteados por pedaço
   * @param {number} [o.count]     quantos pedaços
   * @param {number} [o.power]     distância percorrida, em unidades de design
   * @param {number} [o.spread]    abertura do leque, em graus (360 = tudo)
   * @param {number} [o.dir]       centro do leque, em graus (0 = para cima)
   * @param {number} [o.gravity]   1 cai, 0 segue reto, -1 sobe (bolha)
   * @param {number} [o.size]      tamanho, em unidades de design
   */
  function burst({
    x = 500, y = 470, emojis = [], count = 10, power = 160,
    spread = 360, dir = 0, gravity = 1, ms = 900, size = 26, tone = '',
  } = {}) {
    const pedacos = document.createDocumentFragment();

    for (let i = 0; i < count; i += 1) {
      const bit = document.createElement('span');
      // `tone` só troca a PELE do pedaço (cor, brilho, formato) — a física é
      // a mesma para estilhaço, brasa e gota. É o que evita um segundo motor
      // de partículas só porque a água não é laranja.
      bit.className = `bit${emojis.length ? ' is-emoji' : ''}${tone ? ` is-${tone}` : ''}`;
      if (emojis.length) bit.textContent = emojis[Math.floor(Math.random() * emojis.length)];

      // ângulo dentro do leque, medido a partir de "para cima"
      const ang = (dir - spread / 2 + Math.random() * spread) * (Math.PI / 180);
      const forca = power * (0.55 + Math.random() * 0.65);

      bit.style.setProperty('--x', x);
      bit.style.setProperty('--y', y);
      bit.style.setProperty('--dx', `${Math.sin(ang) * forca}`);
      bit.style.setProperty('--dy', `${-Math.cos(ang) * forca}`);
      bit.style.setProperty('--drop', `${gravity * (90 + Math.random() * 120)}`);
      bit.style.setProperty('--spin', `${Math.round(-220 + Math.random() * 440)}deg`);
      bit.style.setProperty('--bit-ms', `${Math.round(ms * (0.75 + Math.random() * 0.5))}ms`);
      bit.style.setProperty('--bit-size', size);

      bit.addEventListener('animationend', () => bit.remove(), { once: true });
      pedacos.appendChild(bit);
    }

    layer.appendChild(pedacos);
  }

  /**
   * Cenário: um emoji PARADO no palco, em unidades de design. É o oposto do
   * `burst` — nada aqui voa. Nasce para a estátua que assiste à cena do
   * Vinicius sem se mexer.
   *
   * Vai na camada de TRÁS por padrão: cenário não passa na frente do elenco.
   */
  function prop({ emoji = '?', x = 500, y = 470, size = 60, sway = false, front = false } = {}) {
    const el = document.createElement('span');
    el.className = sway ? 'prop-cena is-sway' : 'prop-cena';
    el.textContent = emoji;
    el.style.setProperty('--x', x);
    el.style.setProperty('--y', y);
    el.style.setProperty('--prop-size', size);
    (front ? layer : back ?? layer).appendChild(el);
    return el;
  }

  /**
   * Corte para tela preta, e FICA preto — o card do final aparece por cima.
   * Não é um flash escuro: não tem teto de frequência nem volta sozinho.
   */
  function blackout({ ms = 400 } = {}) {
    const el = document.createElement('div');
    el.className = 'blackout';
    el.style.setProperty('--blackout-ms', `${ms}ms`);
    layer.appendChild(el);
    return el;
  }

  /**
   * A base da tela inunda. `height` é a altura da água em unidades de design,
   * medida a partir da LINHA DO CHÃO para cima — 140 dá água no peito do
   * Pedro. A água sangra até a borda real da janela, como o chão.
   */
  /* A ONDA. A SUBIDA da água é encenação e por isso não multiplica por
   * --juice (sem ela ninguém entende que o mar chegou). Tudo que vem depois
   * — vagas cruzando, respingo, espuma, tremida — é juice puro: existe só
   * para a chegada ser um acontecimento, e some junto em reduced-motion.
   */
  function flood({ height = 140, ms = 900 } = {}) {
    const el = document.createElement('div');
    el.className = 'flood';
    el.style.setProperty('--flood-h', height);
    el.style.setProperty('--flood-ms', `${ms}ms`);
    layer.appendChild(el);

    // A linha d'água em unidades de design: é de onde sai todo o respingo.
    const linha = 450 - height;

    // DUAS VAGAS cruzando a tela em sentidos opostos, a segunda atrasada.
    for (const [de, dx, atraso] of [[-620, 1750, 0], [1180, -1800, 220]]) {
      const vaga = document.createElement('div');
      vaga.className = 'wave-sweep';
      vaga.style.setProperty('--flood-h', height);
      vaga.style.setProperty('--wave-from', de);
      vaga.style.setProperty('--wave-dx', dx);
      vaga.style.setProperty('--wave-ms', `${ms + 500}ms`);
      vaga.style.setProperty('--wave-delay', `${atraso}ms`);
      vaga.addEventListener('animationend', (ev) => {
        if (ev.target === vaga) vaga.remove();
      }, { once: true });
      layer.appendChild(vaga);
    }

    // RESPINGO em cinco pontos da linha d'água, para cima e em leque. Cinco
    // origens em vez de uma: um respingo central só lê como explosão de água.
    for (let i = 0; i < 5; i += 1) {
      burst({
        x: 120 + i * 190,
        y: linha,
        count: 14,
        power: 190 + Math.random() * 90,
        spread: 90,
        gravity: 1.4,
        ms: 1200,
        size: 12,
        tone: 'water',
      });
    }
    // ESPUMA: gotas miúdas, muitas, subindo devagar e ficando no ar.
    burst({
      x: 500, y: linha, count: 34, power: 260,
      spread: 170, gravity: 0.5, ms: 1500, size: 6, tone: 'water',
    });

    // O mar chegando sacode a tela. Menos que uma explosão, mas sacode.
    shake({ intensity: 8 });
    return el;
  }


  /**
   * Abre uma fenda. Vai na camada de TRÁS: quem sai dela precisa aparecer
   * na frente dela, e o portal atrás do Pedro precisa ficar atrás do Pedro.
   */
  function portal({ x = 620, y = 320, w = 150, h = 230, ms = 520 } = {}) {
    const el = document.createElement('div');
    el.className = 'portal';
    el.style.setProperty('--x', x);
    el.style.setProperty('--y', y);
    el.style.setProperty('--w', w);
    el.style.setProperty('--h', h);
    el.style.setProperty('--portal-ms', `${ms}ms`);
    (back ?? layer).appendChild(el);
    return el;
  }

  /**
   * RAIO de A até B. Nasce para o laser que o Pedro Professor dispara da mão,
   * e o mesmo efeito serve os três raios das IAs no clímax — um efeito, dois
   * usos, que é o teste de um verbo bem parametrizado.
   *
   * A única conta de geometria do arquivo está aqui: comprimento e ângulo
   * entre dois pontos. Ela sai como --len e --beam-rot, e quem gira, estica e
   * apaga é o @keyframes (ARCHITECTURE.md §6).
   *
   * `sparks: false` desliga a faísca de impacto — que é o que faz o raio
   * bater em alguma coisa em vez de atravessar o vazio.
   */
  function beam({
    x = 500, y = 400, toX = 500, toY = 400,
    ms = 520, width = 11, color = '#8ee9ff', sparks = true,
  } = {}) {
    const dx = toX - x;
    const dy = toY - y;
    const len = Math.hypot(dx, dy);

    const el = document.createElement('div');
    el.className = 'beam';
    el.style.setProperty('--x', x);
    el.style.setProperty('--y', y);
    el.style.setProperty('--len', Math.round(len));
    el.style.setProperty('--beam-rot', `${(Math.atan2(dy, dx) * 180) / Math.PI}deg`);
    el.style.setProperty('--beam-w', width);
    el.style.setProperty('--beam-color', color);
    el.style.setProperty('--beam-ms', `${ms}ms`);
    el.addEventListener('animationend', (ev) => {
      if (ev.target === el) el.remove();
    }, { once: true });
    layer.appendChild(el);

    // Faísca no PONTO DE IMPACTO, jogada de volta na direção de onde o raio
    // veio: é o que separa "acertou" de "passou por perto".
    if (sparks) {
      burst({
        x: toX, y: toY,
        count: 12,
        power: 210,
        // o leque do burst mede o ângulo a partir de PARA CIMA, no sentido
        // horário — daí o atan2 trocado em vez do de sempre
        dir: (Math.atan2(-dx, dy) * 180) / Math.PI,
        spread: 110,
        gravity: 0.2,
        ms: 620,
        size: 14,
      });
    }
    return el;
  }

  return { flash, shake, explode, blackout, flood, portal, burst, prop, beam };
}
