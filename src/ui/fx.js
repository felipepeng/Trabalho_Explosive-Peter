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
   * Explosão: bola de fogo + flash + shake.
   *
   * A posição sai do alvo, mas `x`/`y` passam por cima — é o que permite
   * escrever fogo de artifício no céu sem inventar um verbo novo.
   * `ms` estica a bola de fogo (a explosão subaquática em câmera lenta).
   */
  function explode(target, { intensity = 8, x, y, ms } = {}) {
    const boom = document.createElement('div');
    boom.className = 'boom';

    const at = {
      x: x ?? target?.style.getPropertyValue('--x') ?? 500,
      y: y ?? target?.style.getPropertyValue('--y') ?? 470,
    };
    boom.style.setProperty('--x', at.x || 500);
    boom.style.setProperty('--y', at.y || 470);
    if (ms) boom.style.setProperty('--boom-ms', `${ms}ms`);

    layer.appendChild(boom);

    // Onda de choque: um anel fino que corre para fora. Custa um <div> e é o
    // que faz a explosão parecer TER FORÇA, em vez de só acender.
    const onda = document.createElement('div');
    onda.className = 'shock';
    onda.style.setProperty('--x', at.x || 500);
    onda.style.setProperty('--y', at.y || 470);
    if (ms) onda.style.setProperty('--boom-ms', `${ms}ms`);
    onda.addEventListener('animationend', () => onda.remove(), { once: true });
    layer.appendChild(onda);

    // Estilhaços saindo em leque. São pedaços geométricos, não emoji: emoji na
    // explosão é escolha do DADO, num beat de `burst`.
    burst({
      x: at.x || 500,
      y: at.y || 470,
      count: Math.round(6 + intensity),
      power: 120 + intensity * 14,
      spread: 360,
      gravity: 1,
      ms: 900,
    });

    flash();
    shake({ intensity });
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
    spread = 360, dir = 0, gravity = 1, ms = 900, size = 26,
  } = {}) {
    const pedacos = document.createDocumentFragment();

    for (let i = 0; i < count; i += 1) {
      const bit = document.createElement('span');
      bit.className = emojis.length ? 'bit is-emoji' : 'bit';
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
  function flood({ height = 140, ms = 900 } = {}) {
    const el = document.createElement('div');
    el.className = 'flood';
    el.style.setProperty('--flood-h', height);
    el.style.setProperty('--flood-ms', `${ms}ms`);
    layer.appendChild(el);
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

  return { flash, shake, explode, blackout, flood, portal, burst, prop };
}
