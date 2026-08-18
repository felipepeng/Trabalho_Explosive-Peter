# Explosive Peter

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

**D2 concluído — loop fechado (marco M0).** Palco em tela cheia com área segura 1000×600, clock em rAF, countdown de 10s, máquina de estados de 5 fases, cena `ninguem-veio`, ending card e restart.
