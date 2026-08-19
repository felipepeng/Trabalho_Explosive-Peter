# Relatório de Tokens - Explosive Peter

Gerado em: 2026-08-19 13:39 UTC  
Fonte: transcripts do Claude Code em `C:\Users\sg\.claude\projects\c--github-explosive-peter`  
Modelo: **Claude Opus 5** - $5 /1M input, $25 /1M output
> **Input** = `input_tokens` + `cache_creation_input_tokens` + `cache_read_input_tokens`.
> O custo aplica os multiplicadores de cache: escrita 2x, leitura 0.1x do preço de entrada.
> Os tokens de cada resposta são atribuídos ao prompt que a originou.
> Linhas com 0 tokens são prompts sem chamada de modelo atribuída (interrompidos ou processados junto com o próximo).

## Prompts

| #  | Sessão     | Data/Hora   | Prompt | Chamadas | Input | Output | Total | Custo (USD) |
| -- | ---------- | ----------- | ------ | -------- | ----- | ------ | ----- | ----------- |
| 1 | `576edac3` | 17/08 15:58 | [PAPEL] Você é um engenheiro de software sênior especializado em jogos web estáticos. Sua tarefa é produzir um arquivo PLANO.md com o plano de execuçã... | 3 | 105.372 | 20.364 | 125.736 | $0,84 |
| 2 | `576edac3` | 17/08 16:08 | implemente no plan isto aqui: -Sorteio: troque random uniforme por sacola embaralhada    (Fisher-Yates, repõe ao esvaziar, nunca repete a última cena... | 22 | 1.243.248 | 10.650 | 1.253.898 | $1,03 |
| 3 | `576edac3` | 17/08 16:12 | Implemente | 93 | 12.406.009 | 98.598 | 12.504.607 | $9,82 |
| 4 | `576edac3` | 17/08 16:52 | deu isso aqui ao tentar abrir o index.html  Requisição cross-origin bloqueada: A diretiva Same Origin (mesma origem) não permite a leitura do recurso... | 7 | 1.322.880 | 5.026 | 1.327.906 | $0,85 |
| 5 | `610d62aa` | 17/08 15:53 | [PAPEL] Você é um engenheiro de software sênior especializado em jogos web estáticos. Sua tarefa é produzir um arquivo PLANO.md com o plano de execuçã... | 2 | 60.983 | 825 | 61.808 | $0,16 |
| 6 | `610d62aa` | 17/08 15:53 | [Request interrupted by user] | 0 | 0 | 0 | 0 | $0,00 |
| 7 | `18e3aa7d` | 17/08 17:14 | [PAPEL] Você é engenheiro de software sênior especializado em jogos web estáticos. Produza um arquivo PLANO.md com o plano de execução de um MVP.  [IM... | 6 | 317.014 | 36.491 | 353.505 | $1,69 |
| 8 | `18e3aa7d` | 17/08 17:28 | Antes de executar, 3 coisas.  PRIMEIRO — nada de escrita até isso ser resolvido. Rode `git status` e `git log --oneline -5` e me mostre a saída comple... | 11 | 998.238 | 9.573 | 1.007.811 | $0,84 |
| 9 | `18e3aa7d` | 17/08 17:36 | Antes de executar, 3 coisas.  PRIMEIRO — nada de escrita até isso ser resolvido. Rode `git status` e `git log --oneline -5` e me mostre a saída comple... | 3 | 295.024 | 1.962 | 296.986 | $0,23 |
| 10 | `18e3aa7d` | 17/08 17:43 | Correções finais, depois pode executar.  0. Bloqueador encerrado: diretório novo, só com PLANO.md, e eu cuido do    git manualmente. Você NÃO roda git... | 33 | 3.831.311 | 29.707 | 3.861.018 | $3,74 |

## Relatório Final

Prompts catalogados: **10**  
Sessões: **3**  
Chamadas ao modelo: **180** (cada prompt gera várias chamadas: leitura de arquivo, comando, raciocínio)

### Total de tokens

| Tipo      | Tokens |
| --------- | ------ |
| Input     | 20.580.079 |
| Output    | 213.196 |
| **Total** | **20.793.275** |

### Custo Real

Cada categoria de token tem um preço diferente. O input se divide em três:

| Categoria               | Tokens | Preço efetivo /1M | Custo (USD) |
| ----------------------- | ------ | ------------------ | ----------- |
| Input sem cache         | 409 | $5,00  | $0,00 |
| Escrita de cache (2x)   | 377.756 | $10,00 | $3,78 |
| Leitura de cache (0.1x) | 20.201.914 | $0,50  | $10,10 |
| **Input (subtotal)**    | **20.580.079** | - | **$13,88** |
| Output                  | 213.196 | $25,00 | $5,33 |
| **TOTAL**               | **20.793.275** | - | **$19,21** |

### Referência: custo pela fórmula simples

Fórmula: `(tokens_input / 1.000.000) * preço_input + (tokens_output / 1.000.000) * preço_output`

| Tipo      | Tokens | Preço /1M | Custo (USD) |
| --------- | ------ | --------- | ----------- |
| Input     | 20.580.079 | $5,00  | $102,90 |
| Output    | 213.196 | $25,00 | $5,33 |
| **Total** | **20.793.275** | - | **$108,23** |

Essa fórmula cobra todo o input pelo preço cheio, ignorando o cache. Como 98% do input é leitura de cache (a 10% do preço), ela superestima o gasto em cerca de $89,02.
> Valores em equivalente de API. Em assinatura (Pro/Max) o uso não é cobrado por token - veja `/usage`.
