# Trabalho Prático: Tecnologias Emergentes.

## 1. Sobre o Projeto
**Opção escolhida:** Projeto de livre escolha.

## Explosive Peter
Um jogo de navegador que começa sozinho: você abre o link e já tem um timer correndo, o Pedro sorrindo e uma bomba com o pavio aceso. Alguém pode invadir a cena para salvá-lo. Normalmente piora tudo.
O jogo não é sobre vencer, é sobre colecionar absurdos. O jogador é explicitamente impotente, e a piada é exatamente essa: a tela diz "não tem como salvar ele", e mesmo assim você clica trinta vezes, porque cada rodada é uma piada nova e existe um contador de finais para completar.

---

## 2. System Prompts Utilizados

Nossa abordagem não utilizou apenas um system prompt global, mas sim uma estrutura segmentada para direcionar o agente de forma eficiente. 

### System Prompt 1: Engenheiro de Prompt
Este prompt foi utilizado para estruturar a forma como o jogo deveria ser concebido antes da geração do código.
> 📄 **Arquivo:** [`engenheiro-de-prompt.md`](roles/engenheiro-de-prompt.md)
### System Prompt 2: Game-Designer
Este agente foi o responsável por receber as diretrizes de design e gerar tanto a narrativa (personagens/finais) quanto o código final da aplicação.
> 📄 **Arquivo:** [`game-designer.md`](roles/game-designer.md)


**Evidência dos Agentes:**
> **[Print dos agentes abertos no claudo ]**

---

## 3. Técnica de Prompt Engineering: Few-Shot

**Justificativa:** 
Aplicamos a técnica de **Few-Shot** na comunicação com o `game-designer` para garantir a consistência da estrutura do jogo. Como o jogo depende de um formato específico de saída `{personagem, cena, final}`, fornecer exemplos prévios evitou que a IA gerasse os dados e o código de forma despadronizada a cada tentativa, facilitando a estabilidade da aplicação final.
 
### Exemplos e Estruturas

Para guiar a geração do conteúdo, padronizamos as cenas e características dos personagens com a seguinte estrutura de dados:

**Cenas e Finais Possíveis:**

```json
[
  {
    "personagem": "Vinicius - O Estoico",
    "cena": "Antes da bomba explodir, Vinicius chega e segura a bomba de maneira estoica.",
    "final": "Vinícius diz frases de efeito e impede a explosão com as mãos."
  },
  {
    "personagem": "Vinicius - O Estoico",
    "cena": "Antes da bomba explodir, Vinicius chega e segura a bomba de maneira estoica.",
    "final": "Percebe que não conseguirá impedir a explosão, se sacrificando pelo Pedro, dizendo frases de efeito."
  }

[
  {	
    "personagem": "Michas dos Mares", 
    "caracteristicas": "Referência a Minecraft, comanda os mares com um tridente."
  },
  {	
    "personagem": "Vinicius - O Estoico", 
    "caracteristicas": "Extremamente estoico, calmo diante do perigo, SEMPRE solta frases de efeito."
  },
  {	
    "personagem": "Pedro Maligno", 
    "caracteristicas": "O Pedro de um universo paralelo, com aparência maligna."
  },
  {	
    "personagem": "JP from the South", 
    "caracteristicas": "Anão bravo, sempre vem debaixo da tela até o Pedro."
  }
]

]
```

Falta os prints 

---

## 4. Teste de Curadoria de Contexto

Para testar o consumo de tokens com diferentes tamanhos de contexto, solicitamos à IA uma alteração específica (ex: adicionar a implementação de uma segunda cena/personagem) de duas formas diferentes:

*   **Versão A (Contexto Cheio):**   
*   **Versão B (Contexto Curado):**

**Comparação de Consumo:**
*   **Tokens Versão A:** [PREENCHER NÚMERO DE TOKENS IN/OUT]
*   **Tokens Versão B:** [PREENCHER NÚMERO DE TOKENS IN/OUT]

**Evidência do Teste:**
> **[Print dos prompts enviados e o consumo lado a lado]**

---

## 5. Tabela de Chamadas e Custos

*Ferramenta utilizada:* Claude Code

*Fórmula utilizada:* `(tokens_input / 1_000_000) * preco_input + (tokens_output / 1_000_000) * preco_output`

**[Relatório de custo](/docs/relatorio-tokens.md)**

---

## 6. Evidências de Consumo (Dashboard/Logs)

Abaixo estão os registros do terminal (`/cost`) e dos logs locais de *transcript* comprovando os números apresentados na tabela acima.

> **[Print da /cost]**

---

## 7. URL Publicada

O projeto foi publicado via GitHub Pages e está funcional no link abaixo:

🔗 [▶ Jogar](https://felipepeng.github.io/Trabalho_Explosive-Peter/)

---

## 8. Integrantes do Grupo

*   **Pedro Alvaro Mantuani Silva** - RA: 23079477-2 
*   **Felipe Barreto Cortes** - RA: 23069437-2 
*   **Vinicius Reginaldo Ferrarini** - RA: 23159293-2 

