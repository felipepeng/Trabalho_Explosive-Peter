# Explosive Peter — Game Design Document

> **Versão:** 1.0 · **Autor:** Peng · **Status:** escopo fechado, pronto para produção
> **Contexto:** trabalho de faculdade · solo · prazo de 1 a 2 semanas · critério livre

---

## 1. Conceito

**Pitch:** Um teatro de 10 segundos onde você não salva ninguém — assiste o Pedro ser explodido (ou milagrosamente salvo) de formas cada vez mais idiotas, e clica para ver o próximo desfecho.

O jogo não é sobre vencer. É sobre **colecionar absurdos**. Toda decisão de design abaixo deriva disso.

**Público-alvo:** quem abre um link no navegador entre uma aula e outra, ri três vezes e manda o link pra turma.

**USP:** o jogador é explicitamente impotente — a tela diz "Não tem como salvar ele" — e mesmo assim clica trinta vezes, porque cada rodada é uma piada nova e existe um contador de finais para completar.

---

## 2. Pilares de design

1. **Impotência cômica** — o jogador é plateia, e a piada é exatamente essa. "Não tem como salvar ele" é a tese do jogo, não um tutorial.
2. **Loop brutalmente curto** — do clique ao próximo final: **≤ 15 segundos**. Uma cena que passe disso está errada e deve ser cortada, não otimizada.
3. **Surpresa acima de fidelidade** — arte propositalmente tosca em SVG/CSS. O humor vem de *timing*, som e texto — nunca de sprite bonito.
4. **Conteúdo é dado, não código** — adicionar uma cena nova é escrever um objeto JavaScript. Se exigir mexer no motor, o motor está errado.

---

## 3. Core loop

```
BOOT → COUNTDOWN (10s) → SCENE (invasão do personagem) → CLIMAX → ENDING CARD → [clique] → COUNTDOWN
```

O jogo inicia sozinho ao carregar a página — sem menu, sem botão de start, sem tela de título. O primeiro contato do jogador com o jogo é um timer já correndo.

### 3.1 Cronometragem de uma rodada

| Momento | Duração | O que acontece |
| --- | --- | --- |
| `t = 0.0s` | — | Fade-in rápido (200ms). Pedro sorrindo, bomba com pavio aceso, timer em `10`, mensagem inferior |
| `0.0s → invasão` | 3 a 7s (varia por cena) | Só o timer correndo. Tensão e pavio queimando |
| Invasão → clímax | 3 a 6s | O personagem entra, age, fala |
| Clímax | ~0.8s | Explosão / salvamento. Flash, shake, freeze de 150ms |
| Pausa dramática | 0.6s | Tela parada no resultado antes do card |
| Ending card | até o clique | Título do final, contador `X/N`, botão de reinício |

**Total: 12 a 15 segundos por rodada.** Esse é o número que precisa ser defendido em todo o desenvolvimento.

### 3.2 Regras de ritmo (anti-tédio)

- **O timer é mentiroso.** Algumas cenas invadem aos 3s, outras aos 7s. Uma cena rara explode aos 4s sem aviso nenhum. Previsibilidade mata a piada na décima rodada.
- **A primeira rodada da vida do jogador é sempre a cena `ninguem-veio`** (ver §6.1), e ela não volta mais. Estabelece a regra — "realmente não tem como salvar ele" — para que todas as outras cenas funcionem como quebra de expectativa.
- **A mensagem inferior é dinâmica.** Começa em "Não tem como salvar ele" e depois muda por rodada ("Ele tentou.", "Isso foi pior.", "Pedro nº 38"). É a fonte de humor mais barata do projeto — aproveite.

---

## 4. Escopo fechado

### 4.1 Dentro do escopo (o que será entregue)

| # | Item | Detalhe |
| --- | --- | --- |
| 1 | Loop completo auto-iniciável | Countdown → cena → final → clique → repete |
| 2 | Motor de cenas data-driven | `SceneDirector` executando timeline declarativa em milissegundos |
| 3 | Sorteio com anti-repetição | Cooldown de histórico + peso + bônus de novidade |
| 4 | **5 personagens** | Pedro (vítima) + Vinicius + Michas + Pedro Maligno + JP |
| 5 | **6 cenas / 14 finais** | Catálogo completo em §6 |
| 6 | Meta-progressão | localStorage: finais vistos, contador `X/N`, "Pedros perdidos" |
| 7 | Galeria de finais | Grade com finais descobertos; os não vistos aparecem como `???` |
| 8 | Arte SVG/CSS com rig compartilhado | Sem emoji nos sprites (emoji permitido em texto) |
| 9 | Juice | Shake, flash, freeze-frame, balões de fala, tipografia cartunesca |
| 10 | Áudio | ~8 SFX curtos (tique, explosão, whoosh de entrada, fanfarra de final) |
| 11 | Deploy público | GitHub Pages ou Vercel, link compartilhável |
| 12 | README acadêmico | Como rodar, decisões de arquitetura, créditos |

### 4.2 Fora do escopo (não-objetivos declarados)

Estes itens estão **cortados por decisão**, não por esquecimento. Se sobrar tempo, viram v2 — nunca invadem o prazo.

- ❌ **Qualquer interação além do clique de reinício.** Inclusive o QTE falso. É a primeira coisa a cortar e já está cortada.
- ❌ Crossover entre personagens numa mesma cena (dois personagens invadindo juntos).
- ❌ Música de fundo original — só SFX.
- ❌ Backend, contas, ranking online, compartilhamento de score.
- ❌ Animação frame-a-frame; tudo é `transform` e `@keyframes`.
- ❌ Localização/i18n. O jogo é em português e ponto.
- ❌ Suporte a navegador antigo. Chrome/Firefox/Safari atuais, em desktop.
- ❌ **Suporte a mobile.** O jogo é explicitamente WEB de desktop: mouse, teclado e janela larga. Nada de layout em retrato, gesto de toque ou tuning para tela pequena.

### 4.3 Critérios de aceite ("está pronto quando…")

- [ ] Abrir a URL e, sem clicar em nada, ver uma rodada completa terminar em ≤ 15s.
- [ ] 30 cliques seguidos sem ver a mesma cena duas vezes em sequência.
- [ ] Fechar o navegador, reabrir, e o contador `X/N` continuar de onde parou.
- [ ] Funciona de 1280×720 a 4K sem quebrar layout, e sobrevive a redimensionar a janela no meio da rodada.
- [ ] Três pessoas jogam sem instrução e riem pelo menos uma vez.

---

## 5. Personagens

Todos usam o **mesmo rig SVG** (`<g>` nomeados: `head`, `body`, `arm-l`, `arm-r`, `leg-l`, `leg-r`), variando apenas cor, proporção e um acessório. Escrever o quinto personagem deve custar 15 minutos, não 2 horas.

| Personagem | Papel | Características | Assinatura visual | Entrada |
| --- | --- | --- | --- | --- |
| **Pedro** | Vítima | Sorridente, indefeso, imóvel. Nunca reage | Corpo branco, sorriso enorme e fixo | Já está em cena (centro) |
| **Vinicius, o Estoico** | Salvador filosófico | Calmíssimo diante do perigo. SEMPRE solta frase de efeito | Túnica cinza, barba, olhos semicerrados | Entra andando devagar pela esquerda |
| **Michas dos Mares** | Salvador caótico | Referência a Minecraft, comanda os mares com tridente | Tridente, tom esverdeado, formato blocado | Emerge de uma onda que inunda a base da tela |
| **Pedro Maligno** | Antagonista | Pedro de universo paralelo, aparência maligna | Cópia do Pedro em roxo escuro, sorriso invertido, olhos vermelhos | Sai de uma fenda/portal atrás do Pedro |
| **JP from the South** | Salvador raivoso | Anão bravo, muito baixo, muito irritado | Baixinho e largo, boné, cara vermelha | **Sempre sobe de baixo da tela** |

**Regra de rig:** `transform-origin` no ombro para `arm-*` e no quadril para `leg-*`. Isso entrega braço levantando, chute e queda com uma linha de CSS cada.

---

## 6. Catálogo de cenas e finais

Formato: cada **cena** pertence a um personagem e sorteia um entre seus **finais**. Total: **6 cenas, 14 finais.**

> **Regra de ouro dos IDs:** o `id` de um final é permanente — o progresso salvo do jogador depende dele. O `title` pode ser reescrito à vontade.

> O valor de `survives` de cada um dos 14 finais já está decidido em [`ARCHITECTURE.md` §7.1](./ARCHITECTURE.md) — ao escrever as timelines, é só transcrever.

### 6.1 `ninguem-veio` — sem personagem *(cena de fundação)*

O timer chega a zero. Nada acontece. Pedro explode.

| ID | Título do final | Peso | Descrição |
| --- | --- | --- | --- |
| `ninguem-veio` | **NINGUÉM VEIO** | 1 | Explosão seca, sem música, sem graça. É o ponto de referência de todo o humor do jogo |

**Só aparece na primeira rodada de um jogador novo, e nunca mais.** Peso `0`: o `main.js` a força enquanto `firstRun` for verdadeiro e o picker nunca mais a devolve. A explosão seca estabelece a regra do jogo uma vez — repeti-la depois que o jogador já entendeu não é a piada, é o tédio que a piada existe para evitar.

### 6.2 `vinicius-segura` — Vinicius, o Estoico

Entra andando devagar aos ~4s, agarra a bomba com as duas mãos.

| ID | Título do final | Peso | Descrição |
| --- | --- | --- | --- |
| `vin-contido` | **CONTIDO PELO ESTOICISMO** | 3 | Segura a explosão entre as mãos. *"A bomba explode. Eu não."* Pedro sobrevive |
| `vin-memento` | **MEMENTO MORI** | 3 | Abraça a bomba, caminha para fora da tela e explode sozinho. *"Amor fati."* Pedro sobrevive |
| `vin-dicotomia` | **A DICOTOMIA DO CONTROLE** | 2 | Analisa a situação com calma demais, o tempo acaba, os dois explodem. *"Não estava sob meu controle."* |

### 6.3 `michas-mar` — Michas dos Mares

A base da tela inunda aos ~3s, ele emerge com o tridente.

| ID | Título do final | Peso | Descrição |
| --- | --- | --- | --- |
| `mic-correnteza` | **ENCANTAMENTO NÍVEL III** | 3 | Arremessa a bomba ao céu com o tridente; explode como fogo de artifício. Pedro sobrevive |
| `mic-afogado` | **NÃO ERA ESSE TIPO DE SALVAMENTO** | 3 | O mar apaga o pavio, mas afoga o Pedro. Bomba desarmada, Pedro morto |
| `mic-subaquatica` | **À PROVA D'ÁGUA** | 2 | A bomba não liga para a água. Explosão subaquática em câmera lenta |
| `mic-drop` | **DROP RARO** ⭐ | 1 (raro) | A bomba vira item flutuante, Michas cata e sai andando. Pedro sobrevive, confuso |

### 6.4 `maligno-portal` — Pedro Maligno

Uma fenda roxa se abre atrás do Pedro aos ~5s.

| ID | Título do final | Peso | Descrição |
| --- | --- | --- | --- |
| `mal-paradoxo` | **PARADOXO** | 3 | Acelera o timer de 6 para 0. Explosão dupla, os dois morrem |
| `mal-troca` | **TROCA DE UNIVERSOS** | 3 | Troca de lugar com o Pedro. O bom é salvo, o maligno explode rindo |
| `mal-censurado` | **[DADOS CORROMPIDOS]** | 2 | Desarma a bomba só para fazer algo pior. Corte para tela preta. Pedro tecnicamente não explodiu |

### 6.5 `jp-de-baixo` — JP from the South

Sobe de baixo da tela aos ~3s, já gritando.

| ID | Título do final | Peso | Descrição |
| --- | --- | --- | --- |
| `jp-alcance` | **BAIXO IMPACTO** | 3 | Não alcança a bomba. Pula, xinga, tenta de novo, o timer zera |
| `jp-fio-errado` | **CORTOU O FIO ERRADO** | 3 | Corta o pavio com tesoura. Era o fio errado. Explode na hora |
| `jp-arremesso` | **ARREMESSO DE PEDRO** | 2 | Usa o próprio Pedro como projétil para longe da bomba. Pedro sobrevive, machucado |

### 6.6 `bomba-impaciente` — sem personagem *(cena curta rara)*

| ID | Título do final | Peso | Descrição |
| --- | --- | --- | --- |
| `bomb-cedo` | **ELA NÃO ESPEROU** ⭐ | 1 (raro) | A bomba explode aos 4s, no meio do countdown. Rodada de 6 segundos |

**Total: 14 finais**, sendo 2 raros. Meta de conteúdo mínima para a entrega: **10 finais**. Os quatro últimos (`vin-dicotomia`, `mic-drop`, `mal-censurado`, `bomb-cedo`) são o colchão sacrificável se o prazo apertar.

---

## 7. Sistemas

### 7.1 Modelo de dados

```js
// src/data/scenes.js — todo o conteúdo do jogo vive aqui
{
  id: 'vinicius-segura',
  character: 'vinicius',
  weight: 1,
  invadeAt: 4000,                                  // quando o personagem entra (ms)
  timeline: [                                      // ms relativos ao início da cena
    { at: 0,    do: 'enter', who: 'vinicius', from: 'left' },
    { at: 700,  do: 'say',   who: 'vinicius', text: 'A dor é apenas opinião.' },
    { at: 1600, do: 'grab',  target: 'bomb' },
    { at: 2200, do: 'shake', intensity: 2 },
  ],
  endings: [
    { id: 'vin-contido',  title: 'CONTIDO PELO ESTOICISMO', weight: 3, timeline: [...] },
    { id: 'vin-memento',  title: 'MEMENTO MORI',            weight: 3, timeline: [...] },
    { id: 'vin-dicotomia',title: 'A DICOTOMIA DO CONTROLE', weight: 2, timeline: [...] },
  ]
}
```

**Verbos disponíveis** (o vocabulário do `actions.js`): `enter`, `exit`, `say`, `grab`, `shake`, `flash`, `explode`, `flood`, `portal`, `sfx`, `setTimer`, `hide`, `show`.

Se uma cena nova precisar de um verbo novo, tudo bem — o custo é escrever uma função de ~10 linhas. Se precisar de um `if`, está errada.

### 7.2 Máquina de estados

```
BOOT ──► COUNTDOWN ──► SCENE ──► CLIMAX ──► ENDING ──[clique]──► COUNTDOWN
                    └────────── (cena sem personagem) ──────┘
```

Cinco estados, transição só para frente, sem estado paralelo. Um `switch` resolve.

### 7.3 Sorteio e anti-repetição

Três camadas, todas triviais:

1. **Cooldown de histórico** — as últimas `K = 3` cenas ficam inelegíveis. Adicionalmente, o personagem da rodada anterior nunca repete.
2. **Sorteio ponderado** entre as cenas elegíveis, usando `weight`.
3. **Bônus de novidade** — cena ou final ainda não visto recebe peso `× 3`. O jogador descobre conteúdo novo rápido no início, e o pool se achata naturalmente depois.

```js
// src/engine/picker.js (pseudocódigo)
function pickScene(scenes, history, seen) {
  const pool = scenes.filter(s =>
    !history.slice(-3).includes(s.id) &&
    s.character !== history.lastCharacter
  );
  const candidates = pool.length ? pool : scenes;    // fallback: pool nunca vazio
  return weightedRandom(candidates, s => s.weight * (seen.has(s.id) ? 1 : 3));
}
```

O mesmo algoritmo, sem a camada de histórico, escolhe o final dentro da cena.

### 7.4 Meta-progressão (localStorage)

```js
{
  version: 1,
  seenEndings: ['vin-contido', 'jp-fio-errado'],
  deaths: 37,          // quantas vezes o Pedro explodiu
  saves: 12,           // quantas vezes ele sobreviveu
  rounds: 49,
  firstRun: false      // controla o forçamento de `ninguem-veio`
}
```

Exposto ao jogador como: contador `FINAL 3/14` no ending card, "Pedros perdidos: 37" no canto e a galeria (finais não descobertos aparecem como `???`).

**Campo `version`:** se o formato mudar, o jogo reseta o save em vez de quebrar.

---

## 8. Tecnologia

**Stack:** HTML/CSS/JS vanilla + **Vite**. Animação em DOM/CSS (`transform`, `@keyframes`), sem canvas.

**Justificativa:** as cenas são teatro 2D — três ou quatro elementos entram, falam, sacodem e somem. DOM + CSS faz isso com menos código que qualquer engine, e entrega o juice (shake, flash, zoom, balão de fala) de graça. Não há física, colisão nem loop de render que justifique Phaser ou Pixi. Bônus decisivo: o bundle carrega instantaneamente, o que é requisito para um jogo cuja premissa é "abriu o site, já começou".

| Camada | Escolha |
| --- | --- |
| Build | Vite |
| Arte | SVG inline + CSS (sem emoji nos sprites) |
| Áudio | Web Audio API direta (~8 SFX curtos); Howler.js só se der dor de cabeça |
| Persistência | `localStorage` |
| Deploy | GitHub Pages via Vite `base` (ou Vercel) |
| Fontes | Uma display cartunesca para títulos + system font no resto |

**Sem dependências de runtime.** Se em algum momento a resposta for "instalar uma lib", reconsidere.

### 8.1 Estrutura de projeto

```
src/
  main.js              # bootstrap + máquina de estados
  engine/
    director.js        # executa a timeline de beats
    picker.js          # sorteio ponderado + anti-repetição
    actions.js         # os verbos (enter/say/shake/explode/...)
    audio.js
  data/
    characters.js      # rigs SVG e cores
    scenes.js          # TODO o conteúdo do jogo
    messages.js        # frases da barra inferior
  state/
    progress.js        # localStorage
  ui/
    countdown.js  ending-card.js  gallery.js  hud.js
  styles/
    base.css  chars.css  juice.css
docs/
  GDD.md
index.html
```

---

## 9. Cronograma — 10 dias úteis, solo, ~2-3h/dia

| Dia | Entrega | Marco |
| --- | --- | --- |
| **D1** | Setup Vite, layout da tela, timer de 10s, Pedro e bomba em SVG, explosão placeholder | M0 |
| **D2** | Máquina de estados, ending card, botão de restart, cena `ninguem-veio`. **Loop fechado** | M0 ✅ |
| **D3** | `director.js` + timeline + primeiros verbos (`enter`, `say`, `shake`, `explode`) | M1 |
| **D4** | `picker.js` + `progress.js` + contador `X/N` no card | M1 ✅ |
| **D5** | Rig SVG compartilhado + Vinicius e JP | M2 |
| **D6** | Michas e Pedro Maligno (+ verbos `flood` e `portal`) | M2 |
| **D7** | Escrever as timelines de `vinicius-segura` e `jp-de-baixo` (6 finais) | M2 |
| **D8** | Escrever `michas-mar` e `maligno-portal` (7 finais) | M2 ✅ |
| **D9** | Juice: shake, flash, freeze-frame, tipografia, SFX, mensagens dinâmicas | M3 |
| **D10** | Galeria, deploy, README, playtest com 3 pessoas | M3 ✅ |

**Buffer: 2 a 4 dias** dentro da janela de 2 semanas — reservados para playtest e imprevistos, não para escopo novo.

### 9.1 Ordem de corte (se o prazo apertar)

Corte de cima para baixo, sem negociar:

1. Galeria visual (mantém só o contador `X/N`)
2. Os 4 finais do colchão (§6.6 e os de peso 2)
3. SFX (o jogo funciona mudo, só fica menos engraçado)
4. Pedro Maligno como personagem inteiro (é o de arte mais cara)

**Nunca corte:** o loop, o anti-repetição, o `ninguem-veio` na primeira rodada.

---

## 10. Riscos

| Risco | Probabilidade | Mitigação |
| --- | --- | --- |
| **Conteúdo é o gargalo real** — escrever 14 finais engraçados custa mais que codar o motor | Alta | Catálogo já escrito neste GDD (§6). D7 e D8 são só transcrever para timeline |
| Perfeccionismo na arte SVG | Alta | Rig congelado no D5. Feio é a estética oficial |
| Cena longa demais mata o loop | Média | Teto rígido de 15s por rodada nos critérios de aceite (§4.3) |
| Feature creep de interatividade | Média | Já declarado fora de escopo em §4.2 |
| Timing de `setTimeout` inconsistente em background tab | Baixa | Pausar a rodada em `visibilitychange` |

---

## 11. Próximos passos imediatos

1. `npm create vite@latest . -- --template vanilla` e limpar o boilerplate.
2. Montar `index.html` com o palco: `#stage`, `#peter`, `#bomb`, `#timer`, `#message`.
3. Timer de 10s puramente visual, sem lógica de jogo — só para calibrar a sensação do countdown.
4. Cena `ninguem-veio` hardcoded + ending card + restart. **Fim do D2 = jogo tecnicamente completo com um final.**
