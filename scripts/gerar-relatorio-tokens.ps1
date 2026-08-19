<#
.SYNOPSIS
  Gera um relatorio .md com o consumo de tokens por prompt, lendo os transcripts
  (.jsonl) que o Claude Code grava em ~/.claude/projects/<projeto>/.

.EXEMPLO
  powershell -ExecutionPolicy Bypass -File scripts\gerar-relatorio-tokens.ps1

.EXEMPLO
  # so uma sessao (um chat), com titulo proprio:
  #   ... -Session 5896cca9 -OutFile docs\relatorio_curadoria_01.md -Titulo 'Curadoria 01'
#>
param(
  [string]$ProjectDir  = "$env:USERPROFILE\.claude\projects\G--Peng-Repositorys-Trabalho-Explosive-Peter",
  [string]$OutFile     = "docs\relatorio-tokens.md",
  [double]$PrecoInput  = 5.0,    # USD por 1M tokens de entrada  (Claude Opus 5)
  [double]$PrecoOutput = 25.0,   # USD por 1M tokens de saida    (Claude Opus 5)
  [double]$MultCacheW  = 2.0,    # escrita de cache: 2x (TTL 1h) ou 1.25x (TTL 5min)
  [double]$MultCacheR  = 0.10,   # leitura de cache: 10% do preco de entrada
  [int]$MaxPromptChars = 160,
  # Prefixo do id da sessao (o nome do .jsonl). Vazio = todas as sessoes.
  [string]$Session     = '',
  [string]$Titulo      = 'Relatorio de Tokens - Explosive Peter'
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $ProjectDir)) { throw "Pasta de transcripts nao encontrada: $ProjectDir" }

$files = Get-ChildItem -Path $ProjectDir -Filter *.jsonl -File | Sort-Object LastWriteTime
if (-not $files) { throw "Nenhum arquivo .jsonl em $ProjectDir" }

# Um transcript por sessao: filtrar pelo NOME DO ARQUIVO e o mesmo que filtrar
# pelo sessionId, e evita ler megabytes de chat que nao entram no relatorio.
if ($Session) {
  $files = @($files | Where-Object { $_.BaseName -like "$Session*" })
  if (-not $files) { throw "Nenhuma sessao comecando com '$Session' em $ProjectDir" }
}

function New-Entry($sid, $text, $ts) {
  [pscustomobject]@{
    Session = $sid; Prompt = $text; Timestamp = $ts
    In = [int64]0; Out = [int64]0; CacheW = [int64]0; CacheR = [int64]0; Calls = 0
  }
}

$entries = New-Object System.Collections.ArrayList
$current = $null

foreach ($f in $files) {
  foreach ($line in [System.IO.File]::ReadLines($f.FullName, [System.Text.Encoding]::UTF8)) {
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    try { $o = $line | ConvertFrom-Json } catch { continue }

    if ($o.type -eq 'user') {
      if ($o.isSidechain -or $o.isMeta) { continue }
      $c = $o.message.content
      if ($c -isnot [string]) { continue }           # tool_result vem como array -> ignora
      $txt = ($c -replace '\s+', ' ').Trim()
      if (-not $txt) { continue }
      # slash commands e saida local nao sao prompts enviados ao modelo
      if ($txt -match '^<(command-name|command-message|command-args|local-command-stdout|local-command-stderr)>') { continue }
      $current = New-Entry $o.sessionId $txt $o.timestamp
      [void]$entries.Add($current)
    }
    elseif ($o.type -eq 'assistant' -and $o.message.usage) {
      if (-not $current) {
        $current = New-Entry $o.sessionId '(chamadas antes do primeiro prompt)' $o.timestamp
        [void]$entries.Add($current)
      }
      $u = $o.message.usage
      $current.In     += [int64]$u.input_tokens
      $current.Out    += [int64]$u.output_tokens
      $current.CacheW += [int64]$u.cache_creation_input_tokens
      $current.CacheR += [int64]$u.cache_read_input_tokens
      $current.Calls++
    }
  }
}

function Esc($s, $max) {
  $s = $s -replace '\|', '\|' -replace '`', "'"
  if ($s.Length -gt $max) { $s = $s.Substring(0, $max) + '...' }
  return $s
}
function N($v)   { '{0:N0}' -f $v }
function USD($v) { '{0:N2}' -f $v }

# Custo real de um prompt, com os multiplicadores de cache aplicados
function Custo($e) {
  (($e.In     / 1e6) * $PrecoInput) +
  (($e.CacheW / 1e6) * $PrecoInput * $MultCacheW) +
  (($e.CacheR / 1e6) * $PrecoInput * $MultCacheR) +
  (($e.Out    / 1e6) * $PrecoOutput)
}

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine("# $Titulo")
[void]$sb.AppendLine()
[void]$sb.AppendLine("Gerado em: $(Get-Date -Format 'yyyy-MM-dd HH:mm')  ")
[void]$sb.AppendLine("Fonte: transcripts do Claude Code em ``$ProjectDir``  ")
[void]$sb.AppendLine("Modelo: **Claude Opus 5** - `$$PrecoInput /1M input, `$$PrecoOutput /1M output")
[void]$sb.AppendLine()
if ($Session) {
  [void]$sb.AppendLine("Escopo: **somente a sessao ``$Session``** - um unico chat  ")
  [void]$sb.AppendLine()
}
[void]$sb.AppendLine('> **Input** = `input_tokens` + `cache_creation_input_tokens` + `cache_read_input_tokens`.')
[void]$sb.AppendLine("> O custo aplica os multiplicadores de cache: escrita ${MultCacheW}x, leitura ${MultCacheR}x do preco de entrada.")
[void]$sb.AppendLine('> Os tokens de cada resposta sao atribuidos ao prompt que a originou.')
[void]$sb.AppendLine('> Linhas com 0 tokens sao prompts enfileirados: foram enviados junto com o prompt seguinte, que carrega o custo dos dois.')
if ($Session) {
  [void]$sb.AppendLine('> Rodando DENTRO da sessao relatada, o ultimo prompt fica subestimado: as chamadas da resposta que gera este arquivo ainda nao foram gravadas no transcript.')
}
[void]$sb.AppendLine()
[void]$sb.AppendLine('## Prompts')
[void]$sb.AppendLine()
[void]$sb.AppendLine('| # | Sessao | Data/Hora | Prompt | Chamadas | Input | Output | Total | Custo (USD) |')
[void]$sb.AppendLine('|---|--------|-----------|--------|---------:|------:|-------:|------:|------------:|')

$i = 0
foreach ($e in $entries) {
  $i++
  $inTot = $e.In + $e.CacheW + $e.CacheR
  $sid   = if ($e.Session) { $e.Session.Substring(0,8) } else { '-' }
  $when  = if ($e.Timestamp) { ([datetime]$e.Timestamp).ToLocalTime().ToString('dd/MM HH:mm') } else { '-' }
  [void]$sb.AppendLine("| $i | ``$sid`` | $when | $(Esc $e.Prompt $MaxPromptChars) | $($e.Calls) | $(N $inTot) | $(N $e.Out) | $(N ($inTot + $e.Out)) | `$$(USD (Custo $e)) |")
}

$fresh  = ($entries | Measure-Object In     -Sum).Sum
$cw     = ($entries | Measure-Object CacheW -Sum).Sum
$cr     = ($entries | Measure-Object CacheR -Sum).Sum
$totOut = ($entries | Measure-Object Out    -Sum).Sum
$calls  = ($entries | Measure-Object Calls  -Sum).Sum
$totIn  = $fresh + $cw + $cr

# NOTA: PowerShell nao diferencia maiusculas em nomes de variavel.
# Os nomes de custo precisam ser distintos de $cw / $cr (tokens).
$custoFresh = ($fresh  / 1e6) * $PrecoInput
$custoW     = ($cw     / 1e6) * $PrecoInput * $MultCacheW
$custoR     = ($cr     / 1e6) * $PrecoInput * $MultCacheR
$custoOut   = ($totOut / 1e6) * $PrecoOutput
$custoIn    = $custoFresh + $custoW + $custoR
$custoTot   = $custoIn + $custoOut

$naiveIn  = ($totIn / 1e6) * $PrecoInput
$naiveOut = $custoOut
$naiveTot = $naiveIn + $naiveOut
$pctCache = if ($totIn -gt 0) { [int](100 * $cr / $totIn) } else { 0 }

[void]$sb.AppendLine()
[void]$sb.AppendLine('## Relatorio Final')
[void]$sb.AppendLine()
[void]$sb.AppendLine("Prompts catalogados: **$($entries.Count)**  ")
[void]$sb.AppendLine("Sessoes: **$(($entries | Select-Object -ExpandProperty Session -Unique).Count)**  ")
[void]$sb.AppendLine("Chamadas ao modelo: **$(N $calls)** (cada prompt gera varias chamadas: leitura de arquivo, comando, raciocinio)")
[void]$sb.AppendLine()
[void]$sb.AppendLine('### Total de tokens')
[void]$sb.AppendLine()
[void]$sb.AppendLine('| Tipo | Tokens |')
[void]$sb.AppendLine('|------|-------:|')
[void]$sb.AppendLine("| Input | $(N $totIn) |")
[void]$sb.AppendLine("| Output | $(N $totOut) |")
[void]$sb.AppendLine("| **Total** | **$(N ($totIn + $totOut))** |")
[void]$sb.AppendLine()
[void]$sb.AppendLine('### Custo')
[void]$sb.AppendLine()
[void]$sb.AppendLine('Cada categoria de token tem um preco diferente. O input se divide em tres:')
[void]$sb.AppendLine()
[void]$sb.AppendLine('| Categoria | Tokens | Preco efetivo /1M | Custo (USD) |')
[void]$sb.AppendLine('|-----------|-------:|------------------:|------------:|')
[void]$sb.AppendLine("| Input sem cache | $(N $fresh) | `$$(USD $PrecoInput) | `$$(USD $custoFresh) |")
[void]$sb.AppendLine("| Escrita de cache (${MultCacheW}x) | $(N $cw) | `$$(USD ($PrecoInput * $MultCacheW)) | `$$(USD $custoW) |")
[void]$sb.AppendLine("| Leitura de cache (${MultCacheR}x) | $(N $cr) | `$$(USD ($PrecoInput * $MultCacheR)) | `$$(USD $custoR) |")
[void]$sb.AppendLine("| **Input (subtotal)** | **$(N $totIn)** | - | **`$$(USD $custoIn)** |")
[void]$sb.AppendLine("| Output | $(N $totOut) | `$$(USD $PrecoOutput) | `$$(USD $custoOut) |")
[void]$sb.AppendLine("| **TOTAL** | **$(N ($totIn + $totOut))** | - | **`$$(USD $custoTot)** |")
[void]$sb.AppendLine()
[void]$sb.AppendLine('### Referencia: custo pela formula simples')
[void]$sb.AppendLine()
[void]$sb.AppendLine('Formula: `(tokens_input / 1.000.000) * preco_input + (tokens_output / 1.000.000) * preco_output`')
[void]$sb.AppendLine()
[void]$sb.AppendLine('| Tipo | Tokens | Preco /1M | Custo (USD) |')
[void]$sb.AppendLine('|------|-------:|----------:|------------:|')
[void]$sb.AppendLine("| Input | $(N $totIn) | `$$(USD $PrecoInput) | `$$(USD $naiveIn) |")
[void]$sb.AppendLine("| Output | $(N $totOut) | `$$(USD $PrecoOutput) | `$$(USD $naiveOut) |")
[void]$sb.AppendLine("| **Total** | **$(N ($totIn + $totOut))** | - | **`$$(USD $naiveTot)** |")
[void]$sb.AppendLine()
[void]$sb.AppendLine("Essa formula cobra todo o input pelo preco cheio, ignorando o cache. Como $pctCache% do input e leitura de cache (a $($MultCacheR * 100)% do preco), ela superestima o gasto em cerca de `$$(USD ($naiveTot - $custoTot)).")
[void]$sb.AppendLine()
[void]$sb.AppendLine('> Valores em equivalente de API. Em assinatura (Pro/Max) o uso nao e cobrado por token - veja `/usage`.')

$dir = Split-Path -Parent $OutFile
if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Force $dir | Out-Null }
$sb.ToString() | Out-File -FilePath $OutFile -Encoding utf8

Write-Host "OK: $OutFile - $($entries.Count) prompts, $(N $calls) chamadas, $(N ($totIn + $totOut)) tokens, `$$(USD $custoTot)"
