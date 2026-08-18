# Explosive Peter

É o vibe e o codas né.
<img width="806" height="722" alt="image" src="https://github.com/user-attachments/assets/03658328-9971-40fb-998c-1013ac59ab78" />

Um teatro de 10 segundos onde você não salva ninguém — assiste.

> **Não tem como salvar ele.**

**▶ [Jogar](https://felipepeng.github.io/Trabalho_Explosive-Peter/)** — abre e já começou.

---

## O que é

Um jogo de navegador que começa sozinho: você abre o link e já tem um timer correndo, o Pedro sorrindo e uma bomba com o pavio aceso. Alguém pode invadir a cena para salvá-lo. Normalmente piora tudo.

O jogo **não é sobre vencer** — é sobre colecionar absurdos. O jogador é explicitamente impotente, e a piada é exatamente essa: a tela diz "não tem como salvar ele", e mesmo assim você clica trinta vezes, porque cada rodada é uma piada nova e existe um contador de finais para completar.

- **6 cenas, 15 finais, 5 personagens**
- **Rodadas de 4,6 a 13 segundos** — o teto de 15s é vigiado por um validador automático
- **Uma única interação**: o botão de reiniciar

## Como rodar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/
npm run preview  # serve o dist/
```

Sem dependências de runtime: HTML/CSS/JS vanilla, com o Vite só como build. O `dist/` gerado abre até direto do disco.

**Plataforma: web de desktop.** Chrome, Firefox e Safari atuais, mouse e teclado. Mobile está fora de escopo por decisão, não por esquecimento (GDD §4.2).

## Como jogar

Não tem menu, não tem tela de título, não tem tutorial. A página carrega e a rodada já começou. Quando o final aparece, o botão reinicia.

A primeira rodada da vida de um jogador é sempre a cena `ninguem-veio` — o timer chega a zero, ninguém aparece, o Pedro explode. Ela existe para estabelecer a regra, e **nunca mais volta**: todas as outras cenas funcionam como quebra dessa expectativa.

Abaixo do título do final há uma fileira de quadradinhos: a coleção. O que falta aparece como `?`.

---

## Estrutura

```
src/
  main.js         # máquina de estados, sorteia a rodada, costura tudo
  config.js       # constantes de tuning, num lugar só
  engine/
    clock.js      # relógio pausável (rAF + performance.now)
    director.js   # executa a timeline de beats
    actions.js    # os verbos — única camada do motor que toca o DOM
    picker.js     # sorteio ponderado + anti-repetição
    audio.js      # SFX sintetizados na hora
  data/
    scenes.js     # TODO o conteúdo do jogo
    characters.js # cores, proporções, rostos e acessórios
    messages.js   # frases da barra inferior
    validate.js   # roda no boot, só em dev
  state/
    progress.js   # o único módulo que conhece localStorage
  ui/
    stage.js countdown.js hud.js ending-card.js gallery.js fx.js
  styles/
    base.css chars.css juice.css
```

## Decisões de arquitetura

As escolhas que definiram o projeto, e o porquê de cada uma. A lista completa está em [`docs/ARCHITECTURE.md` §11](docs/ARCHITECTURE.md).

**DOM e CSS em vez de canvas.** As cenas são teatro 2D: três ou quatro elementos entram, falam, sacodem e somem. Não há física, colisão nem loop de render que justifique uma engine. DOM + CSS entrega shake, flash, freeze-frame e balão de fala de graça — e o bundle carrega instantaneamente, que é requisito para um jogo cuja premissa é "abriu o site, já começou".

**Conteúdo é dado, não código.** Uma cena é um objeto em `src/data/scenes.js` com uma lista de beats `{ at, do, ... }`. Adicionar conteúdo não deve exigir tocar no motor — e não exigiu: escrever as 6 cenas e os 15 finais não mudou uma linha de `director.js`, `picker.js`, `clock.js` ou da máquina de estados.

**O director não importa os verbos, recebe.** É a única inversão de dependência do projeto, e é o que mantém o motor sem uma linha de DOM.

**Uma fonte de tempo só.** Um `requestAnimationFrame` acumulando `performance.now()` serve a três coisas com um mecanismo: agendar beats, congelar o freeze-frame de 150 ms do clímax e pausar quando a aba some. Não existe `setTimeout` solto em lugar nenhum.

**Espaço de design de 1000 × 600 unidades, em tela cheia.** Uma custom property `--u` escala a unidade para que a área segura sempre caiba; céu e chão sangram até a borda real da janela. Nada de moldura preta, e o conteúdo escrito uma vez serve de 1280×720 a 4K. Toda medida em CSS é `calc(N * var(--u))` — nunca `em`, que quebra dentro de um elemento que muda o próprio `font-size`.

**Um rig SVG para os cinco personagens.** Um único `<template>` vestido por `data/characters.js`: cor em custom property, proporção em `--h`/`--build`, e o rosto e o acessório injetados como fragmentos SVG. Personagem novo é um objeto — nenhum HTML ou CSS por personagem.

**SFX sintetizados, sem arquivo nenhum.** Os 11 sons nascem de osciladores e ruído branco na hora de tocar. Zero bytes de asset, e some o único problema de caminho de asset que o deploy teria.

**O erro nunca trava.** Verbo inexistente vira aviso e é pulado; verbo que lança é logado e a rodada segue; um watchdog de 20 segundos força o final se algo emperrar. No pior caso o jogador vê uma explosão, nunca uma tela morta.

**Um validador roda no boot em dev.** Reprova verbo ou som inexistente, `id` de final repetido, tema inválido, posição fora do espaço de design, emoji em fala de personagem e — o que mais importa — qualquer combinação cena × final que passe de **15 segundos**. Esse é o número mais importante do design; defendê-lo à mão significaria cronometrar 15 combinações a olho na véspera da entrega.

## Como adicionar uma cena

Escreva um objeto em `src/data/scenes.js`:

```js
{
  id: 'minha-cena',
  character: 'vinicius',
  weight: 3,
  invadeAt: 4000,          // quando o personagem entra
  timeline: [              // `at` relativo a invadeAt
    { at: 0,    do: 'enter', who: 'vinicius', x: 700 },
    { at: 2600, do: 'say',   who: 'vinicius', text: 'A dor é apenas opinião.' },
  ],
  endings: [
    { id: 'meu-final', title: 'UM FINAL', weight: 3, survives: true,
      theme: 'pedra', icon: '🧘', kicker: 'PEDRO SOBREVIVEU 🧘', button: 'MAIS UMA 🔁',
      timeline: [ /* `at` relativo ao clímax */ ] },
  ],
}
```

Só isso. O `id` de um final é permanente — é a chave do save do jogador. Emoji pode em kicker, botão e ícone; **nunca** na fala de um personagem.

## Acessibilidade

`prefers-reduced-motion` reduz a amplitude de todo o juice a 25% e desliga os laços infinitos (respiração, faísca do pavio, brilho da água). Entradas e saídas ficam: sem elas não dá para entender que alguém chegou.

O flash tem teto duro de **2 por segundo**, independente de configuração — luz piscando acima de ~3 Hz é gatilho fotossensível.

O restart é um `<button>` de verdade, então foco, Enter e Espaço vêm do navegador.

## Deploy

GitHub Pages via GitHub Actions: `push` na `main` → `npm ci` → `npm run build` → publica o `dist/`. O `vite.config.js` usa `base: './'`, então o mesmo build roda no Pages, na Vercel, em subpasta ou aberto do disco.

Em *Settings → Pages*, **Source: GitHub Actions**.

## Documentação

- [`docs/GDD.md`](docs/GDD.md) — conceito, escopo, catálogo de cenas e finais, cronograma
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — módulos, motor, máquina de estados, decisões

## Créditos

**Peng** — conceito, design, código e arte.

Personagens inspirados em pessoas reais, que não autorizaram nada disso.

Stack: HTML, CSS e JavaScript sem framework; [Vite](https://vite.dev) como build; Web Audio API para os SFX. Nenhuma dependência de runtime.
