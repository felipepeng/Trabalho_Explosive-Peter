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
      survives: true,           // true | false | null (null = ambíguo, ex. mal-censurado)
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

**`actions.js`** — os 13 verbos do GDD §7.1: `enter · exit · say · grab · shake · flash · explode · flood · portal · sfx · setTimer · hide · show`. Um objeto plano de funções `(ctx, beat) => void`.

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
- **I5.** **Fora de `ENDING`, todo input é engolido** — nenhum toque pula ou acelera a rodada. O único efeito permitido é destravar o áudio (§8). O listener de restart só existe durante o `ENDING`.

I5 é o pilar 1 do GDD ("o jogador é explicitamente impotente") escrito como código.

**Watchdog:** se a rodada passar de `MAX_ROUND_MS = 20000`, força o clímax e vai para `ENDING`. É rede de segurança para bug, não teto de ritmo — o teto de 15 s é vigiado em dev (§9).

---

## 6. Tela

**Espaço de design fixo: `1000 × 600` unidades**, escalado para caber na viewport.

```css
#stage {
  --design-w: 1000; --design-h: 600;
  aspect-ratio: var(--design-w) / var(--design-h);
  width: min(100vw, calc(100svh * var(--design-w) / var(--design-h)));
}
```

Toda posição em `data/` (`portal {x:620, y:180}`, `flood {height}`) está nessas unidades — nunca pixel, `vw` ou `%`. Sem isso, as timelines escritas no D7/D8 ficam presas ao tamanho da tela do autor, e o conserto é reescrever conteúdo. Custa 5 linhas de CSS agora.

**Quem mexe no DOM:** `stage.js` cria e destrói atores (clonando `<template>` do `index.html`); `actions.js` só modifica o que já existe.

**Âncoras do `index.html`:** `#stage #peter #bomb #timer #message #fx-layer #hud #ending-card`.

**Convenções:** `id` para singletons · `data-actor="michas"` para atores · classe `.is-*` para estado · custom property para parâmetro de animação (`--shake-amp`).

**JS não escreve `style.transform`** — escreve `--shake-amp` e o `@keyframes` em `juice.css` consome. Só `transform` e `opacity` são animados.

**O countdown visível é um componente, não beats.** `countdown.js` guarda `{from, rate, since}` e desenha a partir do clock; o verbo `setTimer` só reescreve esses números. A alternativa (um beat por segundo) multiplicaria por 10 o tamanho de toda timeline.

**`--juice`:** todo keyframe multiplica sua amplitude por `var(--juice, 1)`.

```css
@media (prefers-reduced-motion: reduce) { :root { --juice: .25; } }
```

Um knob serve a três coisas: acessibilidade, tuning de playtest e fallback num celular fraco. Mais um teto duro de **2 flashes por segundo** dentro do verbo `flash`, independente de configuração — luz piscando acima de ~3 Hz é gatilho fotossensível.

---

## 7. Estado e save

Duas coisas diferentes: **sessão** (histórico do anti-repetição — objeto solto no `main.js`, some ao recarregar) e **progresso** (`state/progress.js`, único módulo que conhece `localStorage`).

```js
// chave: 'explosive-peter:v1'
{ version: 1, seenEndings: [], deaths: 0, saves: 0, rounds: 0,
  lastDiscoveryRound: 0, firstRun: true }

progress.load()  // devolve estado válido SEMPRE (default se ausente/corrompido)
progress.record({ ending })
progress.hasSeen(id)
```

- `version` diferente → **reset silencioso**. Sem código de migração.
- `localStorage` indisponível (Safari privado, quota) → fallback em memória, mesma API. O jogo funciona, só não lembra. Nenhum `try/catch` de `localStorage` fora deste arquivo.
- `deaths`/`saves` só se movem quando `survives !== null`.
- ⚠️ **`lastDiscoveryRound` entra no schema no D4 mesmo sem uso.** Um número inutilizado custa zero; adicioná-lo depois custa `version: 2` e o reset do save de todos os playtesters.

**A coleção de finais mora dentro do ending card**, não numa tela separada: uma fileira de quadradinhos abaixo do `FINAL 3/14`, com `???` no que falta. Decorativa, não clicável — o card inteiro continua sendo o alvo de restart. Assim não há interação nova (GDD §4.2 proíbe), não há sexto estado, e o gancho de "falta um" aparece toda rodada em vez de ficar atrás de um botão.

---

## 8. Áudio

O jogo começa sem clique, e navegador bloqueia áudio antes de um gesto. Então:

- `AudioContext` nasce `suspended`; os buffers são decodificados durante o countdown.
- `audio.play()` é **no-op silencioso** enquanto suspenso — nunca lança, nunca dispara atrasado na rodada seguinte.
- `unlock()` no **primeiro gesto qualquer** do documento (`pointerdown`/`touchstart`/`keydown`, listener em captura, `{once:true}`). No celular a pessoa tapeia a tela por reflexo, então a maioria ouve a explosão já na primeira rodada. Não é interação nova: não há botão nem consequência de jogo.
- `visibilitychange` suspende o contexto junto com o clock.

Se ninguém encostar na tela, a primeira rodada sai muda — e em `ninguem-veio` ("explosão seca, sem graça") isso até ajuda a piada.

---

## 9. Validador

`data/validate.js`, ~30 linhas, roda no boot só em `dev`. Reprova: `id` de final duplicado, verbo inexistente, `weight`/`survives` faltando, `climaxAt` antes do último beat da cena, posição fora do espaço de design.

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
| Espaço de design 1000×600 | Pixels | Conteúdo escrito 1× serve de celular a 4K |
| Countdown é componente | Beats de `setTimer` | Comportamento normal custa zero beats |
| `K = min(3, n-2)` | `K` fixo em 3 | Anti-repetição sobrevive à ordem de corte |
| Novidade contínua | Bônus booleano visto/não visto | Cena meio explorada continua sendo oferecida |
| Coleção dentro do ending card | Galeria como tela | Sem interação nova, sem sexto estado, mais barato |
| `survives: true/false/null` | `outcome` de 3 valores | `null` deixa `mal-censurado` não mexer no contador — que é a piada |
| Forçar `ninguem-veio` no `main.js` | `if` de `id` no picker | Motor não conhece o catálogo |
| Teto de 15 s no validador | Cronometrar à mão | O número mais importante do GDD vira erro em dev |
| Input engolido fora de `ENDING` | Handler global "esperto" | Pilar 1 virando código |
| `base: './'` | `base` com nome do repo | Some o 404 de asset só-em-produção |
| `--juice` como escalar | Media query reescrevendo keyframes | Acessibilidade + tuning + performance num knob |

**O que deliberadamente NÃO existe:** TypeScript, testes automatizados obrigatórios, camada de eventos/pubsub, sistema de cena genérico, ECS, injeção de dependência formal, i18n, roteamento. Se a resposta para um problema for "instalar uma lib" ou "criar um sistema", reconsidere.

---

## 12. Falta decidir (não bloqueia o D1)

| O quê | Quando | Nota |
| --- | --- | --- |
| Classificar os 14 finais em `survives` | **D4** | 14 linhas. O único controverso é `mal-censurado` — provavelmente `null` |
| Confirmar `lastDiscoveryRound` no schema | **D4** | Sem ele, ativar um sistema de "pity" depois reseta o save de todo mundo |
| Grade de finais no ending card | D10 | 14 células precisam caber em retrato sem empurrar o título. Se pesar, corta a grade e fica só o `X/14` |
| `prefers-reduced-motion` | D9 | Escopo que o GDD não previu. ~20 min, melhor retorno por minuto da lista |

---

## 13. Checklist do D1

- [ ] `npm create vite@latest . -- --template vanilla`, boilerplate limpo
- [ ] `vite.config.js` com `base: './'`
- [ ] Workflow do Pages + *Settings → Pages: GitHub Actions* → **página em branco publicada e aberta no celular**
- [ ] `index.html` com as âncoras (§6)
- [ ] `base.css` com o palco 1000×600 — testar em retrato **antes** de desenhar qualquer coisa
- [ ] `config.js`: `MAX_ROUND_MS`, `MAX_ROUND_MS_DESIGN`, `JOIN_GAP`, `K`, `FIRST_RUN_SCENE`
- [ ] `engine/clock.js` + `visibilitychange`
- [ ] `ui/countdown.js` desenhando 10 → 0 a partir do clock
- [ ] Pedro e bomba em SVG, parados no palco

Fim do D1 = GDD §11 cumprido ("timer de 10 s puramente visual, só para calibrar a sensação").

---

**O sinal de que a arquitetura funcionou:** nos dias D7 e D8, escrever 13 finais não deve exigir tocar em uma linha fora de `src/data/`. Se exigir, o problema é o motor — pare e conserte antes de escrever a próxima cena.
