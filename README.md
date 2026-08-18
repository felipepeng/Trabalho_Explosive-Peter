# Explosive Peter
É o vibe e o codas né.
<img width="806" height="722" alt="image" src="https://github.com/user-attachments/assets/03658328-9971-40fb-998c-1013ac59ab78" />

Um teatro de 10 segundos onde você não salva ninguém — assiste.

> **Não tem como salvar ele.**

## Rodar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera dist/
npm run preview  # serve o dist/
```

Sem dependências de runtime: HTML/CSS/JS vanilla + Vite só como build.

**Plataforma: web de desktop.** Chrome/Firefox/Safari atuais, mouse e teclado. Mobile está fora de escopo por decisão (ver GDD §4.2).

## Documentação

- [`docs/GDD.md`](docs/GDD.md) — conceito, escopo, catálogo de cenas e finais, cronograma
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — módulos, motor, máquina de estados, decisões

## Status

**D5 concluído.** Palco em tela cheia com área segura 1000×600, clock em rAF, countdown de 10s, máquina de estados de 5 fases, ending card e restart. A rodada é montada pelo `director` a partir de `src/data/scenes.js` (verbos `enter`, `say`, `shake`, `explode`), sorteada pelo `picker` com anti-repetição, e o progresso persiste em `localStorage` com o contador `X/N` no card.

O rig SVG é compartilhado: Pedro, Vinicius e JP saem do mesmo `<template>`, vestidos por `src/data/characters.js`.

Falta o conteúdo: 1 cena das 6, 1 final dos 14, e 2 personagens dos 5 (D6 a D8).



