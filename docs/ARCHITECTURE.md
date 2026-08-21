# Explosive Peter — Arquitetura

> **Versão:** 2.0 (enxuta) · Complementa o [`GDD.md`](./GDD.md), que decide conteúdo, escopo e stack.
> Aqui só o necessário para começar a codar sem se pintar num canto.

---

## 1. Princípios

| # | Princípio | Por quê |
| --- | --- | --- |
| **P1** | `data/` é dado inerte — sem lógica, sem `if`, sem DOM | Cena nova = objeto JS (pilar 4 do GDD) |
| **P2** | `engine/` não toca no DOM. Só `actions.js` toca | Motor testável e substituível |
| **P3** | Uma fonte de tempo: o `Clock`. Nada de `setTimeout` solto | Freeze-frame e aba em background de graça |
| **P4** | Toda rodada remonta o palco do zero | Impossível vazar estado visual entre rodadas |
| **P5** | Erro nunca trava — loga e segue; no pior caso, explode o Pedro | O jogador nunca olha tela morta |

---

## 2. Módulos

```
src/
  main.js         # máquina de estados, sorteia a rodada, costura tudo
  config.js       # constantes de tuning (um lugar só)
  engine/
    clock.js      # relógio pausável (rAF + performance.now)
    director.js   # executa a timeline
    actions.js    # os verbos — única camada que toca o DOM
    picker.js     # sorteio ponderado + anti-repetição
    audio.js
  data/
    scenes.js     # TODO o conteúdo
    characters.js
    messages.js
    validate.js   # ~30 linhas, roda só em dev
  state/
    progress.js   # localStorage
  ui/
    stage.js      # monta/desmonta o palco
    countdown.js  hud.js  ending-card.js
  styles/
    base.css  chars.css  juice.css
index.html
.github/workflows/deploy.yml
```

**Regra de dependência:** `data/` não importa nada · `engine/` só importa `engine/` · `actions.js` e `ui/` podem tocar no DOM · `main.js` importa todo mundo.

**A única inversão que importa:** o `director` **não** importa `actions`. Recebe o mapa de verbos por parâmetro. É isso que mantém o motor sem DOM.

---

## 3. Dados

```js
// data/scenes.js
{
  id: 'vinicius-segura',
  character: 'vinicius',        // null em cenas sem personagem
  weight: 1,
  invadeAt: 4000,               // âncora: os `at` da cena contam a partir daqui
                                // (negativo = antes da invasão)
  climaxAt: undefined,          // opcional: pino absoluto do início do final.
                                // Default: último beat + JOIN_GAP.
                                // `bomba-impaciente` PRECISA disso (explode aos 4000)
  timeline: [
    { at: 0,    do: 'enter', who: 'vinicius', from: 'left' },
    { at: 700,  do: 'say',   who: 'vinicius', text: 'A dor é apenas opinião.' },
  ],
  endings: [
    { id: 'vin-contido',        // PERMANENTE — é chave de save. `title` é livre.
      title: 'CONTIDO PELO ESTOICISMO',
      weight: 3,
      survives: true,           // true | false | null (null = ambíguo — não mexe no contador)
      timeline: [ /* `at` conta a partir do clímax */ ] },
  ]
}
```

Três regras:

1. **`id` de final nunca muda** — o save do jogador depende dele.
2. **Cada timeline tem sua própria âncora.** Mexer no `invadeAt` não obriga a recalcular nada; mexer na cena não obriga a reescrever os 3 finais.
3. **Toda posição está em unidades de design** (§6), nunca em pixel.

---

## 4. Motor

**`clock.js`** — um loop `requestAnimationFrame` acumulando `performance.now()`.

```js
clock.now(); clock.at(1600, fn); clock.pause(); clock.resume(); clock.reset();
```

Serve a três coisas com um mecanismo: agendar beats, congelar o freeze-frame de 150 ms e pausar quando a aba some (`visibilitychange`).

**`director.js`** — `run(beats, ctx, verbos)`. Ordena por `at`, agenda no clock, e:

- verbo inexistente → `console.warn` e pula;
- verbo que lança → loga e segue;
- `ctx.signal` abortado → para tudo na hora.

Montagem da rodada:

```
beats = cena.timeline.map(b => b.at + invadeAt)
      ++ final.timeline.map(b => b.at + (climaxAt ?? últimoBeatDaCena + JOIN_GAP))
```

O final é sorteado **junto com a cena**, no início da rodada.

**`actions.js`** — os verbos do GDD §7.1, mais o `pose`. Um objeto plano de funções `(ctx, beat) => void`.

Escritos: `enter · exit · say · grab · shake · flash · explode · pose · setTimer · hide · show · blackout · flood · portal`. Dos 13 do GDD só falta `sfx` (D9).

Depois do D11 entraram `sfx`, `burst`, `prop` e `beam`. O `beam` (raio de A até B) é o único verbo que nasceu de uma cena e não do GDD: o Pedro Professor precisa de um laser para partir a bomba, e o mesmo efeito serve os três raios das IAs no clímax. Um verbo que serve a dois momentos diferentes da mesma cena é o teste de que ele foi parametrizado, e não escrito para um id.

**`pose`** não estava na lista original e substitui uma família inteira: `{ do:'pose', who:'jp', as:'jump' }` liga a classe `pose-jump` e o gesto mora num `@keyframes`. Sem ele, cada gesto novo (pular, esticar, arremessar, cortar o pavio) viraria um verbo, e o vocabulário cresceria com o conteúdo em vez de ficar estável.

**`blackout`** também é novo, e pela mesma lógica do `pose`: um flash preto que não volta não é um `flash` (que tem teto de frequência e sempre desaparece). São 8 linhas, e é o corte para tela preta que um final ambíguo pediria.

⚠️ **`setTimer` mexe no MOSTRADOR, não no relógio.** Quem decide quando a rodada estoura é o `climaxAt` da cena. Em `maligno-portal` os dois números foram calculados na mão para bater (o mostrador zera em 7700 ms, o clímax é 7800 ms) — e o validador **não** consegue conferir isso, porque teria que simular o countdown. É o único acoplamento manual do conteúdo.

**`grab` reparenta.** O alvo vira filho de quem pegou. Não é detalhe de implementação: é o que faz um `exit` seguinte levar a bomba junto sem nenhum verbo saber disso — `vin-memento` ("abraça a bomba, sai de cena e explode sozinho") custa dois beats por causa disso.

Três regras de verbo:

- Nunca consulta `scene.id` nem `ending.id`. Deu vontade de escrever esse `if`? Parametrize ou crie um verbo novo.
- Se `ctx.signal.aborted`, retorna sem fazer nada.
- Agenda com `ctx.clock`, nunca com `setTimeout`.
- **Um balão por ator:** um `say` novo substitui o anterior. Sem fila — fila atrasa a fala e estoura os 15 s.

**`picker.js`** — o algoritmo do GDD §7.3, puro (recebe estado, devolve escolha; não lê `localStorage`). Com três ajustes:

```js
K        = Math.min(3, nCenas - 2)     // cooldown que sobrevive à ordem de corte do GDD §9.1
chave    = scene.character ?? 'sem-personagem'   // bloqueia 2 cenas sem personagem seguidas
multCena = 1 + 2 * (finaisNaoVistos / totalDeFinais)   // intocada ×3 … esgotada ×1
```

O terceiro é o que importa: no GDD o bônus de novidade é ligado/desligado por cena vista, então uma cena vista **uma vez** perde o ×3 para sempre, mesmo escondendo 3 de 4 finais — e o jogador que quer fechar o `X/14` fica sendo mandado para conteúdo esgotado. A versão contínua preserva os números do GDD nos extremos e resolve a cauda.

Também: `session.lastEndingByScene[id]` fica inelegível (ver o mesmo final 2× seguidas na mesma cena é a repetição mais visível do jogo).

O sorteio de mensagens da barra inferior usa **esse mesmo picker**, com as frases marcadas por tag (`boot`, `after-death`, `after-save`, `milestone`) e interpolação de `{rounds}` feita pelo HUD.

**O forçamento de `ninguem-veio` (GDD §3.2) fica no `main.js`, não no picker:**

```js
const scene = progress.firstRun ? byId(FIRST_RUN_SCENE) : picker.pickScene(...);
```

Senão o motor passa a conhecer o catálogo.

---

## 5. Máquina de estados

```
BOOT → COUNTDOWN → SCENE → CLIMAX → ENDING ──[clique]──► COUNTDOWN
                 └──── cena sem personagem ────┘
```

As fases são marcadores de **uma timeline contínua** (é por isso que o timer segue correndo durante a invasão), não três processadores. `main.js` só reage: troca uma classe no `<body>`.

**Invariantes:**

- **I1.** Uma rodada por vez. Clique duplo no restart é ignorado.
- **I2.** Só se sai de `ENDING` por clique. Nada com temporizador.
- **I3.** Entrar em `COUNTDOWN` = desmontar o palco e remontar (P4).
- **I4.** O progresso é gravado **uma vez**, na entrada de `ENDING`. Rodada abortada não conta.
- **I5.** **Fora de `ENDING`, todo input é engolido** — nenhum clique nem tecla pula ou acelera a rodada. O único efeito permitido é destravar o áudio (§8). O listener de restart só existe durante o `ENDING`.

I5 é o pilar 1 do GDD ("o jogador é explicitamente impotente") escrito como código.

**Watchdog:** se a rodada passar de `MAX_ROUND_MS = 20000`, força o clímax e vai para `ENDING`. É rede de segurança para bug, não teto de ritmo — o teto de 15 s é vigiado em dev (§9).

---

## 6. Tela

**O palco ocupa a janela inteira — sem moldura, sem letterbox.** Céu e chão sangram até as bordas reais da janela, em qualquer proporção.

Isso convive com um **espaço de design fixo de `1000 × 600` unidades** através de três custom properties:

```css
:root {
  --design-w: 1000; --design-h: 600;

  /* 1 unidade de design, em pixels — escalada para que as 1000×600 SEMPRE caibam */
  --u:  min(calc(100vw / var(--design-w)), calc(100vh / var(--design-h)));

  /* canto superior esquerdo da área segura, centralizada na janela */
  --ox: calc((100vw - var(--design-w) * var(--u)) / 2);
  --oy: calc((100vh - var(--design-h) * var(--u)) / 2);
}

#stage { position: fixed; inset: 0; }                    /* a janela inteira */
.actor { left: calc(var(--ox) + var(--x) * var(--u));
         top:  calc(var(--oy) + var(--y) * var(--u)); }  /* dentro da área segura */
#ground { top: calc(var(--oy) + var(--ground-y) * var(--u)); bottom: 0; }
```

As 1000 × 600 unidades viram uma **área segura centralizada**: é onde a encenação acontece e onde todo o conteúdo de `data/` é escrito. Numa janela mais larga que 5:3 sobra espaço nas laterais — e essa sobra é **cenário**, não barra preta. Elementos de tela cheia (`#ground`, `#fx-layer`, o flash) se estendem até a borda real; atores e HUD ficam na área segura.

Toda posição em `data/` (`portal {x:620, y:180}`, `flood {height}`) está nessas unidades — nunca pixel, `vw` ou `%`. Sem isso, as timelines escritas no D7/D8 ficam presas ao tamanho da tela do autor, e o conserto é reescrever conteúdo.

Duas consequências que valem virar regra:

- **Medida em CSS é `calc(N * var(--u))`, nunca `em`.** `em` parece equivalente e não é: dentro de um elemento que mudou o próprio `font-size` (o `#timer`, por exemplo), `em` passa a valer aquele novo tamanho e a medida sai multiplicada por 100.
- **Fora-de-tela se ancora na borda real da janela**, não na área segura (classes `.is-off-left/right/above/below`). Um ator escondido em `x: -200` apareceria parado na sobra lateral de uma janela larga.

Entrada em cena é a mesma ideia: cada ator publica `--from-left/right/above/below` — a distância entre a marca dele e a borda real da janela — e o verbo `enter` só liga `.is-enter-<lado>`. A animação é `transform` puro, e a distância se recalcula sozinha quando a janela muda de tamanho.

⚠️ **`animationend` borbulha.** O palco tem descendentes animados (flash, tique do timer, respiração do Pedro); quem usa o evento para desligar a própria classe precisa filtrar por `ev.target`. Sem isso, o flash de 260 ms corta a tremida de 320 ms.

**Um rig para todos os personagens.** O `index.html` tem UM `<template id="tpl-actor">` com o esqueleto (`head/body/arm-l/arm-r/leg-l/leg-r`). `stage.js` o clona e o veste com o que vem de `data/characters.js`: cor em custom property (`--skin`, `--outline`, `--accent`), proporção em `--h` e `--build`, e quatro fragmentos SVG injetados nos slots `<g class="hair-back">`, `<g class="face">`, `<g class="hair">` e `<g class="accessory">`. O slot do cabelo da frente mora DENTRO do `<g class="head">`: é o que faz cabelo e chapéu acompanharem o `idle-breathe` (que anima `.head`) em vez de ficarem flutuando parados ao lado do crânio. O `hair-back` é o oposto — para o cabelo cair ATRÁS do corpo ele precisa ser desenhado antes dele (SVG não tem z-index), então é o primeiro filho do `.frame` e a sincronia com a respiração vem de o CSS aplicar a mesma animação, com o mesmo atraso, nos dois. O que é do corpo — túnica, barba, tridente — continua no `accessory`, que não respira junto.

O vocabulário desses fragmentos são duas classes de `chars.css` — `.ink` (forma com contorno grosso, cor por `--part`) e `.line` (traço puro). Túnica, barba, boné, sobrancelha e boca saem das duas. Um personagem novo é um objeto em `characters.js`; nenhum arquivo de CSS ou HTML precisa ser tocado — é o teste do "15 minutos" do GDD §5.

O `insertAdjacentHTML` usado aí é seguro porque o jogo não tem campo de texto, servidor nem parâmetro de URL: o único HTML injetado é o que está escrito no repositório.

**Entrada é característica do personagem, não da cena.** `characters.js` traz `enter: { from, ms, gait }`, que `stage.js` publica em `dataset` no próprio nó; o verbo `enter` lê dali quando o beat não manda nada. É assim que "o JP SEMPRE sobe de baixo da tela" vale sem o motor importar `data/` e sem as timelines repetirem `from: 'below'` treze vezes.

**Quem mexe no DOM:** `stage.js` cria e destrói atores; `actions.js` só modifica o que já existe.

**Duas camadas de efeito.** `#fx-back` fica antes de `#cast` e `#fx-layer` depois. A fenda do Pedro Maligno se abre *atrás* do Pedro e a água do Michas cobre as pernas de quem está em cena — um filho de `#fx-layer` não consegue passar para trás de `#cast`, então a camada de trás não é luxo, é a única forma. `stage.clear()` esvazia as duas.

**A explosão é dez camadas.** `fx.explode()` monta, em ordem: `boom-core` (clarão branco no miolo, o mais rápido), `boom` (a bola de fogo) e uma **segunda detonação** fora do centro, atrasada em 180ms — uma bola só lê como "acendeu", duas leem como "ainda está explodindo"; `rays` (cunhas de luz num único `conic-gradient`, com máscara radial vazando o centro); **três** `shock` escalonadas em 0/120/260ms mais uma `shock-ground` achatada, que corre pelo chão em vez do ar; `smoke` no `#fx-back` para a fumaça passar atrás do elenco; e **três** `burst` — estilhaços, fagulhas miúdas e brasas lentas, que ainda estão caindo quando o clarão acabou e são o que dá rastro à explosão. Toda peça se remove no próprio `animationend` (filtrando por `ev.target`, que o evento borbulha).

**`burst` tem `tone`, não um segundo motor.** A física de partícula é uma só: `tone: 'ember'` e `tone: 'water'` trocam apenas a PELE do pedaço (cor, brilho, formato) via `.bit.is-*`. Foi o que permitiu a onda cuspir gota sem duplicar `burst`.

**A onda do Michas é chegada, não subida.** `fx.flood()` continua subindo a água sem multiplicar por `--juice` (encenação: sem ela ninguém entende que o mar chegou). O que foi acrescentado em volta é juice puro e some em `prefers-reduced-motion`: duas `wave-sweep` cruzando a tela em sentidos opostos, a segunda atrasada em 220ms; respingo em **cinco** pontos da linha d'água em vez de um só — um respingo central lê como explosão de água, não como maré; uma leva de espuma miúda; e uma tremida. O percurso horizontal das vagas é a exceção que confirma a regra: ele não multiplica por `--juice`, senão a vaga para visível no meio da tela em vez de atravessar.

**A tremida tem piso E teto.** `explode` chama `shake` com `min(24, max(12, intensity * 1.9 + 5))`. O piso garante que não existe explosão sem tela sacudindo; o teto existe porque o zoom que esconde a borda é proporcional à amplitude, e acima de 24 ele passa de 26% — a essa altura a tela vira um soco que ESCONDE a explosão em vez de vendê-la.

**O envelope da tremida decai.** O envelope decai ao longo de 520ms — pancada nos primeiros 100ms e o resto é a tela se acalmando; amplitude constante lê como bug, não como impacto. E o `scale` que esconde a fresta preta na borda é **proporcional** à amplitude (`1 + 0.011 * --shake-amp * --juice`), não os 5% fixos de antes: como o deslocamento máximo é `4 * --shake-d`, o zoom precisa de pelo menos `0,008 * amp` para cobri-lo, e era isso que limitava a tremida a amplitude ~6.

**Âncoras do `index.html`:** `#stage #cast #fx-back #fx-layer #hud #timer #hud-deaths #message #ending-card #ending-restart`, mais os moldes `#tpl-actor` e `#tpl-bomb`. Ator não é âncora: `#peter` só existe depois que a rodada monta o palco.

**Convenções:** `id` para singletons · `data-actor="michas"` para atores · classe `.is-*` para estado · custom property para parâmetro de animação (`--shake-amp`).

**JS não escreve `style.transform`** — escreve `--shake-amp` e o `@keyframes` em `juice.css` consome. Só `transform` e `opacity` são animados.

**O countdown visível é um componente, não beats.** `countdown.js` guarda `{from, rate, since}` e desenha a partir do clock; o verbo `setTimer` só reescreve esses números. A alternativa (um beat por segundo) multiplicaria por 10 o tamanho de toda timeline.

**`--juice`:** todo keyframe de JUICE multiplica sua amplitude por `var(--juice, 1)`.

A exceção importa: **encenação não é juice.** Entrada, saída, subida da água e a aparição do card NÃO multiplicam — um ator a 25% da distância pararia visível dentro da tela em vez de "fora de cena", e um card que não aparece é jogo quebrado. `--juice` corta amplitude (tremida, clarão, bola de fogo), não a leitura da cena.

```css
@media (prefers-reduced-motion: reduce) { :root { --juice: .25; } }
```

E mais: o que realmente incomoda quem pede menos movimento são os laços **infinitos**. Respiração, faísca do pavio, pulo do JP, brilho da água e o balanço do Vinicius ganham `animation: none` na mesma media query. Entradas e saídas ficam.

Um knob serve a três coisas: acessibilidade, tuning de playtest e fallback numa máquina fraca. Mais um teto duro de **2 flashes por segundo** dentro do verbo `flash`, independente de configuração — luz piscando acima de ~3 Hz é gatilho fotossensível.

---

## 7. Estado e save

Duas coisas diferentes: **sessão** (histórico do anti-repetição — objeto solto no `main.js`, some ao recarregar) e **progresso** (`state/progress.js`, único módulo que conhece `localStorage`).

```js
// chave: 'explosive-peter:v1'
{ version: 1, seenEndings: [], deaths: 0, saves: 0, rounds: 0,
  lastDiscoveryRound: 0, firstRun: true }

progress.load()             // devolve estado válido SEMPRE (default se ausente/corrompido)
progress.get()              // cópia rasa; ninguém escreve no estado por fora
progress.record({ ending }) // I4: uma vez por rodada, na entrada de ENDING
progress.hasSeen(id)
progress.seenSet()          // Set pronto para o picker
```

- `version` diferente → **reset silencioso**. Sem código de migração.
- `localStorage` indisponível (Safari privado, quota) → fallback em memória, mesma API. O jogo funciona, só não lembra. Nenhum `try/catch` de `localStorage` fora deste arquivo.
- `deaths`/`saves` só se movem quando `survives !== null`.
- ⚠️ **`lastDiscoveryRound` entra no schema no D4 mesmo sem uso.** Um número inutilizado custa zero; adicioná-lo depois custa `version: 2` e o reset do save de todos os playtesters.

**A coleção de finais mora dentro do ending card**, não numa tela separada: uma fileira de quadradinhos abaixo do `X/N`, com `?` no que falta. Decorativa e não clicável (`pointer-events: none`). Assim não há interação nova (GDD §4.2 proíbe), não há sexto estado, e o gancho de "falta um" aparece toda rodada em vez de ficar atrás de um botão.

Cada célula descoberta mostra o `icon` do final e ganha a cor do `theme` dele, então a fileira vira um mapa do catálogo. **A ordem é a do catálogo e é estável**: a mesma célula é sempre o mesmo final, e o jogador aprende "falta aquele ali no canto" — o que não funcionaria se a grade se reordenasse conforme a descoberta. Com `flex-wrap`, um catálogo maior quebra em duas linhas em vez de empurrar o título para fora da tela.

**Cada final se veste com o próprio tema.** O final traz `theme`, `kicker` e `button` em `data/scenes.js`; o card só declara TOKENS (`--card-top/bot/ink/accent/btn-ink/font`) e `[data-theme]` os reescreve. Nenhum seletor de CSS conhece um id de final: **oito paletas** — `fogo · pedra · festa · mar · drop · fenda · corrompido · aula` — cobrem os dezoito.

A tela é **translúcida** de propósito: o resultado congelado continua aparecendo por trás do tema, que é a "tela parada" do GDD §3.1.

Quando o final não declara `kicker`, o veredito sai do `survives` (`PEDRO SOBREVIVEU 🎉` / `PEDRO PERDIDO 💥` / `INDEFINIDO ❓`) — um final novo funciona sem configurar nada.

**Emoji:** permitido em kicker, botão, contador, HUD e mensagens. **Proibido no `text` de um beat `say`** — fala de personagem é sem emoji, senão o Vinicius estoico deixa de soar estoico. O validador reprova.

**O restart é um `<button>` dedicado dentro do card**, não o card inteiro. O card é superfície de leitura; o único alvo de clique do jogo é o botão. Sendo um `<button>` de verdade, foco, Enter e Espaço vêm do navegador — nada de `role`, `tabindex` ou `keydown` escritos à mão. E a coleção de finais poder encostar no card sem virar alvo de clique deixa de ser um cuidado: ela nunca foi alvo.

### 7.1 Classificação de `survives` *(decidida no D4)*

Os 18 finais do catálogo (`src/data/scenes.js`), já classificados — o D7 e o D8 só transcrevem.

| Final | `survives` | Por quê |
| --- | --- | --- |
| `ninguem-veio` | `false` | Explode. É a referência de todo o resto |
| `vin-contido` | `true` | Vinicius segura a explosão; Pedro sobrevive |
| `vin-memento` | `true` | Vinicius leva a bomba embora e explode sozinho |
| `vin-dicotomia` | `false` | O tempo acaba, os dois explodem |
| `jp-alcance` | `false` | JP não alcança, o timer zera |
| `jp-fio-errado` | `false` | Cortou o fio errado |
| `jp-arremesso` | `true` | Pedro vira projétil, mas sobrevive machucado |
| `mic-correnteza` | `true` | A bomba explode no céu; Pedro sobrevive |
| `mic-afogado` | `false` | Bomba desarmada, Pedro afogado. Morto é morto |
| `mic-subaquatica` | `false` | Explosão subaquática em câmera lenta |
| `mic-drop` | `true` | A bomba vira item; Pedro sobrevive confuso |
| `mal-paradoxo` | `false` | Explosão dupla, os dois morrem |
| `mal-troca` | `true` | O Pedro bom é salvo; quem explode é o maligno |
| `mal-arremesso-peter` | `false` | O maligno arremessa e é o Pedro bom quem explode |
| `mal-arremesso-maligno` | `true` | O maligno arremessa e explode ele mesmo |
| `bomb-cedo` | `false` | A bomba estoura antes de qualquer salvador agir |
| `fiesta-bibi` | `false` | O FIESTA atropela a cena; ninguém salva ninguém |
| `prof-orquestra` | `false` | A bomba é desarmada e o Pedro é pulverizado pelas três IAs |

**Nota sobre `mic-afogado`:** o final é uma quebra de expectativa (a bomba foi
desarmada e mesmo assim o Pedro morreu), mas `survives` não mede se a bomba
explodiu — mede se o Pedro sobreviveu. `false`.

---

## 8. Áudio

O jogo começa sem clique, e navegador bloqueia áudio antes de um gesto. Então:

**Não existe arquivo de áudio.** Os ~10 SFX são SINTETIZADOS na hora com osciladores e ruído branco (`engine/audio.js`). Zero bytes de asset num jogo cuja premissa é "abriu o site, já começou", e some o único problema de caminho de asset do §10 — não há caminho. Som tosco combina com arte tosca.

- `AudioContext` só nasce no primeiro gesto; antes disso não existe.
- `audio.play()` é **no-op silencioso** enquanto suspenso — nunca lança, nunca dispara atrasado na rodada seguinte.
- `unlock()` no **primeiro gesto qualquer** do documento (`pointerdown`/`keydown`, listener em captura, `{once:true}`). Basta o primeiro clique de restart: da segunda rodada em diante o jogo tem som. Não é interação nova — não há botão nem consequência de jogo.
- `visibilitychange` suspende o contexto junto com o clock.

Se ninguém encostar na tela, a primeira rodada sai muda — e em `ninguem-veio` ("explosão seca, sem graça") isso até ajuda a piada.

---

## 9. Validador

`data/validate.js` roda no boot só em `dev`. Recebe a lista de verbos, os temas e as constantes por parâmetro — `data/` não pode importar `engine/`. Reprova: `id` de final duplicado, verbo inexistente, `weight`/`survives` faltando, `climaxAt` antes do último beat da cena, posição fora do espaço de design, `theme` que não existe em `base.css` (degradaria em silêncio para a paleta padrão) e emoji em fala de personagem.

E o principal — **o orçamento de 15 segundos**. Para cada combinação cena × final, soma a duração total e falha acima de `MAX_ROUND_MS_DESIGN = 15000`:

```
✗ michas-mar + mic-subaquatica: 16.4s (teto 15s)
```

O GDD chama esse número de "o que precisa ser defendido em todo o desenvolvimento". Defender à mão = cronometrar 14 combinações a olho no D10. São 5 linhas para o computador vigiar desde o primeiro final escrito, e o momento certo de descobrir que a cena está longa é enquanto ela está sendo escrita.

---

## 10. Deploy — GitHub Pages

```js
// vite.config.js
export default { base: './' }
```

`'./'` em vez de `'/Trabalho_Explosive-Peter/'`: o mesmo `dist/` roda no Pages, na Vercel, em subpasta ou aberto do disco, e o repositório pode ser renomeado. Vale porque não há roteamento client-side.

- Assets buscados em runtime (SFX) usam `new URL('./assets/tick.mp3', import.meta.url)`. Uma string `'/assets/…'` funciona no dev e quebra no Pages — o `base` relativo não protege disso.
- Workflow: `push` na `main` → `npm ci` → `npm run build` → `upload-pages-artifact (dist)` → `deploy-pages`. Em *Settings → Pages*, **Source: GitHub Actions**.
- **Publicar uma página em branco no D1.** O pipeline passa a ser testado por 10 dias em vez de estreado na véspera da entrega.

---

## 11. Decisões, em uma tabela

| Decisão | Em vez de | Por quê |
| --- | --- | --- |
| Director recebe os verbos por parâmetro | Importar `actions` | Motor sem DOM, testável |
| Clock único em rAF | `setTimeout` encadeado | Freeze-frame + aba escondida no mesmo mecanismo |
| Cena e final com âncoras separadas | Timeline única por final | Cena escrita 1×, servindo aos 3 finais |
| `climaxAt` opcional | Só "último beat + gap" | `bomba-impaciente` precisa explodir aos 4000 exatos |
| Palco remontado toda rodada | Resetar classes | Zero estado residual, custo desprezível |
| Palco em tela cheia, área segura centralizada | Letterbox com `aspect-ratio` | Sem moldura preta; a sobra vira cenário |
| Espaço de design 1000×600 em `--u` | Pixels, ou `em` no palco | Conteúdo escrito 1× serve de janela pequena a 4K, sem quebrar dentro de quem muda `font-size` |
| Countdown é componente | Beats de `setTimer` | Comportamento normal custa zero beats |
| `K = min(3, n-2)` | `K` fixo em 3 | Anti-repetição sobrevive à ordem de corte |
| Novidade contínua | Bônus booleano visto/não visto | Cena meio explorada continua sendo oferecida |
| Um rig + `data/characters.js` | Um `<template>` por personagem | Personagem novo é um objeto; nada de HTML/CSS por personagem |
| Cabeça é `<rect>` com `rx` = metade | `<circle>` | Desenha o mesmo círculo, e `rx: 0` entrega a cabeça blocada do Michas de graça |
| `#fx-back` além de `#fx-layer` | `z-index` dentro de uma camada só | Filho não escapa da camada do pai; a fenda precisa ficar atrás do elenco |
| `enter` com modo `portal` | Um verbo `spawn` separado | Quem sai da fenda cresce no lugar; continua sendo uma entrada |
| Um verbo `pose` genérico | `jump`, `throw`, `reach`, `cut`… | Gesto novo é um `@keyframes`, não JavaScript; o vocabulário para de crescer |
| `grab` vira o alvo em filho | Mover o alvo a cada beat | Saída, tremida e pose carregam o objeto junto, de graça |
| `enter` padrão no personagem | Repetir `from` em toda timeline | "JP sempre sobe de baixo" é traço dele, e o motor segue sem importar `data/` |
| Coleção dentro do ending card | Galeria como tela | Sem interação nova, sem sexto estado, mais barato |
| Restart num `<button>` dentro do card | Card inteiro clicável | Alvo explícito; teclado e foco de graça; o card fica só como leitura |
| 7 paletas por MOOD, escolhidas pelo dado | Uma cor por final, ou um seletor por id | Final novo escolhe um tema existente; o CSS não cresce com o catálogo |
| Kicker cai para o `survives` quando ausente | Todo final declarar tudo | Final novo funciona sem configurar nada |
| `explode` recebe `vaporize: [...]` | O verbo consultar `ending.survives` | Quem some é dado da timeline; o verbo continua sem saber que final está rodando |
| `survives: true/false/null` | `outcome` de 3 valores | `null` deixa o final não mexer no contador, para quem for ambíguo |
| Forçar `ninguem-veio` no `main.js` | `if` de `id` no picker | Motor não conhece o catálogo |
| `weight: 0` = nunca sorteável | Um campo `firstRunOnly` filtrado no `main.js` | "Aparece só na primeira rodada" vira dado puro; o picker segue sem conhecer o catálogo |
| Teto de 15 s no validador | Cronometrar à mão | O número mais importante do GDD vira erro em dev |
| Input engolido fora de `ENDING` | Handler global "esperto" | Pilar 1 virando código |
| `base: './'` | `base` com nome do repo | Some o 404 de asset só-em-produção |
| `--juice` como escalar | Media query reescrevendo keyframes | Acessibilidade + tuning + performance num knob |
| SFX sintetizados na hora | ~8 arquivos de áudio | Zero asset, zero caminho para quebrar no Pages, e o som fica tão tosco quanto a arte |
| Som padrão por VERBO (`sfx: null` cala) | Um beat de `sfx` ao lado de cada ação | Economiza ~30 beats no catálogo sem tirar o controle do dado |
| Tique do countdown por callback do componente | Beats de `sfx` por segundo | O countdown já era componente; um beat por segundo multiplicaria a timeline por 10 |

**O que deliberadamente NÃO existe:** TypeScript, testes automatizados obrigatórios, camada de eventos/pubsub, sistema de cena genérico, ECS, injeção de dependência formal, i18n, roteamento. Se a resposta para um problema for "instalar uma lib" ou "criar um sistema", reconsidere.

---

## 12. Falta decidir (não bloqueia o D1)

| O quê | Quando | Nota |
| --- | --- | --- |
| — | — | Nada pendente: os quatro itens desta lista foram decididos no D4, no D9 e no D10 |

---

## 13. Checklist do D1

- [ ] `npm create vite@latest . -- --template vanilla`, boilerplate limpo
- [ ] `vite.config.js` com `base: './'`
- [ ] Workflow do Pages + *Settings → Pages: GitHub Actions* → **página em branco publicada e aberta no navegador**
- [ ] `index.html` com as âncoras (§6)
- [ ] `base.css` com o palco em tela cheia + área segura 1000×600 — testar redimensionando a janela **antes** de desenhar qualquer coisa
- [ ] `config.js`: `MAX_ROUND_MS`, `MAX_ROUND_MS_DESIGN`, `JOIN_GAP`, `K`, `FIRST_RUN_SCENE`
- [ ] `engine/clock.js` + `visibilitychange`
- [ ] `ui/countdown.js` desenhando 10 → 0 a partir do clock
- [ ] Pedro e bomba em SVG, parados no palco

Fim do D1 = GDD §11 cumprido ("timer de 10 s puramente visual, só para calibrar a sensação").

---

**O sinal de que a arquitetura funcionou:** nos dias D7 e D8, escrever 13 finais não deve exigir tocar em uma linha fora de `src/data/`. Se exigir, o problema é o motor — pare e conserte antes de escrever a próxima cena.
