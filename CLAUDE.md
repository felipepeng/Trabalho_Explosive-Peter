# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O projeto

**Explosive Peter** — jogo de navegador em HTML/CSS/JS vanilla (Vite só como build, zero dependência de runtime). Uma rodada dura ≤ 15 s: o timer corre, alguém invade a cena, o Pedro normalmente explode, aparece o card de final. A única interação do jogo é o botão de reiniciar.

Catálogo atual (fonte da verdade é `src/data/scenes.js`): **8 cenas, 18 finais, 10 personagens**. Sete usam o rig humano; o FIESTA tem rig próprio (`#tpl-fiesta`) e as três IAs — Claude, ChatGPT e Gemini — dividem um segundo rig próprio (`#tpl-ia`), em que a logo é o `accessory` e o nome é a plaquinha de nick de sempre.

Idioma: **português em tudo** — código, comentários, commits, conteúdo do jogo e também a conversa com o usuário.
Responda e faça perguntas sempre em português; termos técnicos consagrados (commit, build, branch, beat, timeline) ficam em inglês dentro da frase.

## Comandos

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/
npm run preview  # serve o dist/
```

**Não há suíte de testes automatizados** — é uma ausência deliberada (`docs/ARCHITECTURE.md` §11). O que faz o papel de teste:

- **Validador de conteúdo** (`src/data/validate.js`): roda no boot **só em dev** e imprime no console. Reprova verbo/som/tema inexistente, `id` de final duplicado, posição fora do espaço de design, emoji em fala de personagem (`say` e `line`), final sem `line` ou sem `cast.who`, `cast.who` que não existe em `characters.js`, `climaxAt` antes do último beat da cena e — o principal — qualquer combinação cena × final que passe de **15 s**. Depois de mexer em `src/data/`, rode `npm run dev` e confira o `[validate] ok — …` no console.
- **Bancada de verbos**: em dev, `main.js` expõe `clock`, `stage`, `fx`, `audio`, `actions`, `scenes`, `progress`, `session`, `phase`, `round` e um helper `beat()` no `window`. Para testar um verbo isolado no console: `beat({ do: 'shake', intensity: 10 })`.
  ⚠️ `window.phase` e `window.round` são **cópias do boot, não getters vivos** — o `Object.assign` executa o getter na hora e guarda o valor. Para saber a fase de verdade, leia `document.body.className` (`state-countdown`, `state-ending`, …).
- Para resetar o save: `localStorage.removeItem('explosive-peter:v1')`.

Branch de trabalho: `dev`. `push` na `main` dispara o deploy no GitHub Pages (`.github/workflows/deploy.yml`).

## Arquitetura

Leitura obrigatória antes de mudar qualquer coisa estrutural: `docs/ARCHITECTURE.md` (módulos, decisões e o porquê de cada uma) e `docs/GDD.md` (conceito, escopo fechado, catálogo).

### A ideia central: conteúdo é dado, não código

Uma cena é um objeto em `src/data/scenes.js` com uma lista de beats `{ at, do, ...params }`. Escrever as 8 cenas e os 18 finais mexeu no motor uma vez só (o verbo `beam`, do laser do Pedro Professor) e não mudou uma linha de `director.js`, `picker.js`, `clock.js` nem da máquina de estados. **Se adicionar conteúdo exigir tocar no motor, o motor está errado.**

### Regra de dependência

```
data/     não importa NADA (nem engine/, nem config)
engine/   só importa engine/ — e apenas actions.js toca no DOM
ui/       toca no DOM livremente
main.js   importa todo mundo e costura
```

A inversão que sustenta isso: **`director.js` não importa `actions.js`** — recebe o mapa de verbos por parâmetro. É o que mantém o motor sem uma linha de DOM. O validador, pelo mesmo motivo, recebe verbos/temas/constantes por parâmetro.

### Montagem de uma rodada

`buildRound(scene, ending)` (em `engine/director.js`) achata duas timelines com **âncoras separadas** em uma lista de beats em tempo absoluto:

```
beats = cena.timeline  deslocados por `invadeAt`
     ++ final.timeline deslocados por `climaxAt ?? últimoBeatDaCena + JOIN_GAP`
```

Mexer no `invadeAt` da cena não obriga a recalcular os `at` dos finais dela. Cena e final são sorteados **juntos**, no início da rodada.

### Máquina de estados (`main.js`)

```
BOOT → COUNTDOWN → SCENE → CLIMAX → ENDING ──[clique]──► COUNTDOWN
                 └──── cena sem personagem ────┘
```

São marcadores de **uma timeline contínua**, não três processadores; `main.js` só troca a classe do `<body>`. Invariantes que não podem ser quebradas:

- **I1** uma rodada por vez (`roundId` + `AbortController`; clique duplo é ignorado).
- **I2** só se sai de `ENDING` por clique — nada com temporizador.
- **I3** entrar em `COUNTDOWN` desmonta e remonta o palco inteiro (zero estado visual residual).
- **I4** o progresso é gravado **uma vez**, na entrada de `ENDING`. Rodada abortada não conta.
- **I5** fora de `ENDING`, **todo input é engolido**. O jogador é impotente por design (pilar 1 do GDD); o único efeito permitido de um gesto é destravar o áudio.

Um watchdog em `MAX_ROUND_MS = 20000` força o clímax se a rodada travar — rede de segurança para bug, não teto de ritmo.

### Tempo

**Uma fonte só**: `engine/clock.js`, um `requestAnimationFrame` acumulando `performance.now()`. Serve para agendar beats, congelar o freeze-frame de 150 ms e pausar quando a aba some. **Não existe `setTimeout` solto em lugar nenhum — não introduza um.** Verbo agenda com `ctx.clock`.

### Sorteio (`engine/picker.js`)

Puro: recebe estado, devolve escolha; não lê `localStorage` nem conhece o catálogo. Anti-repetição com `K = min(3, nCenas - 2)`, bloqueio do último personagem e do último final visto naquela cena; bônus de novidade **contínuo** (`1 + 2 * naoVistos/total`). O forçamento de `ninguem-veio` na primeira rodada mora no `main.js` de propósito — no picker, o motor passaria a conhecer o conteúdo. `weight: 0` significa "nunca sorteável".

### Tela: espaço de design 1000 × 600

O palco ocupa a janela inteira (sem letterbox); as 1000 × 600 unidades são uma **área segura centralizada** escalada pela custom property `--u`. Consequências que viram regra:

- Toda posição em `data/` está em unidades de design — nunca pixel, `vw` ou `%`. Quem está "de pé" tem `y: 470`.
- **Não existe chão.** O `#ground` foi removido: o Pedro flutua no vazio, de propósito. O token `--ground-y: 450` sobreviveu como **linha d'água** (até onde o `flood` sobe), não como piso — não o use para apoiar ninguém.
- Medida em CSS é `calc(N * var(--u))`, **nunca `em`** (dentro de um elemento que mudou o próprio `font-size`, como o `#timer`, `em` sai multiplicado).
- Fora-de-tela se ancora na borda **real** da janela (`.is-off-left/right/...`), não na área segura.
- **JS não escreve `style.transform`** — liga uma classe `.is-*` ou escreve uma custom property, e o `@keyframes` em `juice.css` consome. Só `transform` e `opacity` são animados.
- ⚠️ `animationend` borbulha: quem usa o evento para desligar a própria classe precisa filtrar por `ev.target`.

Acima da cabeça de cada ator há uma **pilha de três andares**, e a ordem é regra: balão de fala → plaquinha de nick → cabeça. Quem sustenta isso é o token `--tag-h` em `chars.css`: `.actor` declara `0px`, `.actor.has-tag` declara a altura real da plaquinha, e o `.balloon` soma esse valor no próprio `bottom`. **Mexeu no padding ou no line-height da `.nametag`? Ajuste o `--tag-h` junto**, senão o balão volta a cobrir o nick. A classe `has-tag` é escrita por `ui/rig.js`, que só pendura a plaquinha em quem tem `nick` (a bomba não tem).

Quase todo personagem usa **um único rig SVG** (`#tpl-actor` no `index.html`, montado por `ui/rig.js`) vestido por `data/characters.js` — cor, proporção (`--h`/`--build`), `nick` e fragmentos SVG de rosto/acessório. Personagem novo é um objeto; nenhum HTML ou CSS por personagem. A exceção é quem não tem corpo humano: o campo `rig: 'fiesta'` manda o `buildActor` clonar `#tpl-fiesta` no lugar do `#tpl-actor`, e o resto (nick, marca, entrada, card de final) continua igual para todo mundo. Rig próprio não tem os slots de rosto e cabelo — as injeções usam `?.` e ignoram esses campos em silêncio. `ui/stage.js` cria e destrói atores; `engine/actions.js` só modifica o que já existe.

Duas camadas de efeito: `#fx-back` (antes de `#cast`) e `#fx-layer` (depois) — um filho de `#fx-layer` não consegue passar para trás do elenco.

### Texto de tela: duas frases fixas, e o título só depois da morte

Durante a rodada existem exatamente duas frases, as duas **estáticas e escritas no `index.html`**: `#hud-tagline` ("O Pedro não tem muito tempo", acima do timer) e `#message` ("Não tem como salvar Ele.", no rodapé). Nenhuma das duas é reescrita por JS, e **nada na tela revela qual cena está rodando** — o nome do final só aparece depois que o Pedro morre, no card.

Consequência: `src/data/messages.js` está **fora do ar** (ninguém importa o arquivo) e `createHud` só cuida do contador de mortes. O cabeçalho de `messages.js` explica como religar a barra dinâmica.

### O card de final é uma pessoa falando

`ui/ending-card.js` monta o `cast.who` do final com o **mesmo `buildActor`** do palco (por isso o rig mora em `ui/rig.js`, e não dentro do `stage.js`), liga a classe `pose-<cast.pose>` e põe a `line` do final num `.balloon` — o mesmo balão do verbo `say`, filho do ator, que por isso já sobe acima da plaquinha sem o card saber que plaquinha existe.

O `title` continua na tela, mas como **legenda pequena** embaixo do personagem: ele é o nome que a coleção usa, não a manchete. Quem fala com o jogador é o personagem.

Poses disponíveis em `chars.css` (`cast.pose` e o verbo `pose` usam a mesma lista): `jump · reach · throw · item · cut · split · burnt · dead · zen · wave · shrug · celebrate · scared · glitch · channel`.

Duas delas não são de personagem: `split` parte a BOMBA ao meio (as duas metades já existem recortadas no `#tpl-bomb`, e o laser do Pedro Professor só liga a classe) e `channel` é o pulsar das IAs antes de atirar.

### `--juice` e acessibilidade

Todo keyframe de JUICE multiplica a amplitude por `var(--juice, 1)`; `prefers-reduced-motion` põe `.25` e desliga os laços infinitos. **Encenação não é juice**: entrada, saída, subida da água e aparição do card **não** multiplicam. O verbo `flash` tem teto duro de **2 flashes/segundo**, independente de configuração.

### Áudio (`engine/audio.js`)

Não existe arquivo de áudio: os 12 SFX (`tick`, `tick-urgente`, `boom`, `whoosh`, `splash`, `portal`, `corte`, `fanfarra`, `fracasso`, `drop`, `buzina`, `glitch`) são sintetizados na hora com osciladores e ruído. O `AudioContext` só nasce no primeiro gesto; `play()` é no-op silencioso antes disso. Cada verbo que faz barulho tem um som padrão — o beat pode trocar (`sfx: 'drop'`) ou calar (`sfx: null`).

### Save (`state/progress.js`)

Único módulo que conhece `localStorage` (chave `explosive-peter:v1`); nenhum `try/catch` de storage fora dele — sem storage, cai em memória com a mesma API. `version` diferente = reset silencioso, sem migração. `deaths`/`saves` só se movem quando `survives !== null`.

## Regras que quebram o jogo se ignoradas

- **`id` de final é permanente** — é chave do save do jogador. `title` é livre.
- **Emoji**: pode em `kicker`, `button`, `icon`, HUD e mensagens. **Proibido em fala de personagem** — tanto no `text` de um beat `say` quanto na `line` do final. O validador reprova os dois. **Uma exceção**: quem declara `emojiNaFala: true` em `characters.js` pode usar emoji na fala. Hoje só o Vinicius, o Estoico, que fecha frase de efeito com um. A permissão é do PERSONAGEM, não da cena — o validador recebe a lista por parâmetro e não conhece ninguém pelo nome.
- **Verbo nunca consulta `scene.id` nem `ending.id`.** Deu vontade de escrever esse `if`? Parametrize pelo beat ou crie um verbo novo. Verbo também retorna sem fazer nada se `ctx.signal.aborted`.
- **Nenhum seletor de CSS conhece um id de final.** O card declara tokens e `[data-theme]` os reescreve; as paletas válidas estão em `config.js` (`CARD_THEMES`) e em `base.css` — as duas listas precisam bater.
- **`setTimer` mexe no mostrador, não no relógio.** Quem decide quando a rodada estoura é o `climaxAt`. Em `maligno-portal` os dois números foram casados à mão (mostrador zera em 7700 ms, clímax em 7800 ms) e o validador **não** consegue conferir isso. `{ do: 'setTimer', cut: true }` parte o mostrador ao meio e o apaga — em `professor-aula` ele nunca chega a zero, e a rodada segue normalmente porque quem manda continua sendo o `climaxAt`.
- **`grab` reparenta** o alvo em quem pegou — é o que faz um `exit` seguinte levar a bomba junto sem nenhum verbo saber disso.
- **Erro nunca trava**: verbo inexistente vira `console.warn` e é pulado, verbo que lança é logado e a rodada segue. No pior caso o jogador vê uma explosão, nunca uma tela morta.
- **Fora de escopo por decisão** (GDD §4.2), não por esquecimento: qualquer interação além do clique de reinício, mobile, i18n, música de fundo, backend, dois personagens na mesma cena — **um invasor por cena** continua valendo, e as três IAs de `professor-aula` não são a exceção que o parágrafo proíbe: elas são o equipamento do invasor (não decidem nada, não escolhem o final e nunca aparecem sem ele). E, do §11 da arquitetura: TypeScript, pubsub, ECS, roteamento. Se a resposta para um problema for "instalar uma lib" ou "criar um sistema", reconsidere.

## Adicionar conteúdo

Cena nova = um objeto em `src/data/scenes.js` (o cabeçalho do arquivo documenta o contrato completo de beat, `climaxAt`, tema, `cast` e `line` do card). Final novo precisa de `cast.who` **e** `line` — sem os dois o card fica mudo, e o validador reclama. Verbos disponíveis: `enter · exit · say · grab · shake · flash · explode · pose · setTimer · hide · show · blackout · flood · portal · sfx · burst · prop · beam`. Gesto novo é um `@keyframes` + `{ do: 'pose', as: '...' }`, não um verbo novo.

Constantes de tuning ficam todas em `src/config.js`.

## Observações sobre a documentação

- `roles/` são prompts de subagente do trabalho acadêmico, não guia de implementação. `roles/dev-frontend.md` descreve uma stack antiga (arquivo único, Canvas 2D, sem build) que **não** corresponde ao projeto atual — não siga.
