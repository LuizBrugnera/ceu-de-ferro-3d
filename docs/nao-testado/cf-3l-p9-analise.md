# cf-3l-p9-analise: análise, revisão pós-batalha e torneios com N lados (P9 do plano de 3 lados)

## O que mudou

- **Analytics (ANA), `ANA.v` 2.** O cabeçalho `hdr` leva `n` (o número de lados, `S.N`; 2 quando a página ainda não tem `S.N`). Todo vetor por lado (`fac`, `doc`, `per`, `dif`, `pt`, `pop`, `inf`, `bl`, `cn`, `dr`, o tráfego `tr`) tem `n` entradas. Uma partida v1 (sem `n`) é lida como 2 lados.
- **Sangria por lado:** cada lado perde pelo atraso em pontos em relação ao melhor dos outros (com 2 lados, a regra de hoje).
- **Eliminação:** evento novo `el { s, why: 'tk' | 'base' }` quando, com N > 2, um lado fica sem tíquetes ou perde o ponto da base principal (ou `S.cq.out[s]` / `S.cq.el[s]`, se a P2 usar um desses nomes). O servidor aceita o tipo `el` (`server.js`, `ANA.kinds`).
- **Fim:** `end` leva `pl`, a colocação (do 1º ao último). Usa o terceiro argumento de `cqEnd` ou `S.cq.pl` se a P2 der um; senão calcula (vencedor, vivos, pontos, tíquetes, eliminados por último).
- **`anaReport`:** `ns` (lados), `place`, `rank`, `out` (eliminados), curva `[t, tk0..tkN-1, pt0..ptN-1]` (com 2 lados, igual a antes), margem das decisões contra o melhor dos outros lados (com 2 lados, igual), visão de um lado esconde os outros N-1. `ns` e não `n`, porque `R.n` já é o número de eventos.
- **Revisão pós-batalha (#aar):** tabela de colocação com quem foi eliminado e quando (só com 3 lados), uma linha por lado no gráfico, traço vertical na eliminação, cor dos Insurgentes (`#d8a84a`, classe `.i`), todas as tabelas por lado com N lados.
- **Conserto de algo que já estava quebrado na main:** o envoltório de `aarShow` das estratégias do general (STG) estava na parte da simulação, antes de `aarShow` existir; `tests/harness.js` não carregava a página (`ReferenceError: aarShow is not defined`). Movido para depois do `aarShow` da revisão.
- **`tools/balance.js`:** `--lados 2|3` (3 só na Frente atual), trios de doutrinas/personalidades (`tuples`), `--dif` com até 3 valores, vitórias por lado com N lados, colocação 1º/2º/3º por lado e média, colocação média por doutrina e personalidade, lados eliminados por partida, alerta a 0,45 com 3 lados (0,6 com 2).
- **`tests/harness.js`:** `watch(era, { n })` passa `n`/`N` a `newState`. O torneio falha com erro claro se a página não montar 3 lados.

## O que NÃO foi testado

- Nenhuma suíte (`tests/all.sh`, `tests/ana.js`, `ana-online.js`, `ana-man.js`, `mcp-general.js`) e nenhum torneio rodaram.
- Nada com 3 lados de verdade: a fundação (P0) e a conquista (P2) não estavam na main; o código usa `S.N` e nomes adivinhados (`S.cq.out`, `S.cq.el`, `S.cq.pl`, `cqEnd(win, why, pl)`). Só um `anaReport` sobre eventos de 3 lados escritos à mão.
- A página no navegador: a carga pelo chrome-devtools-axi estourou o tempo duas vezes. Rodou só: sintaxe do script inteiro (`node --check`), a simulação carregada pelo harness com uma partida IA × IA de 20 s (relatório com 2 lados igual ao formato de antes) e o servidor subindo.
- A tela da revisão (#aar) não foi aberta.

## Riscos

- Se a P2 marcar a eliminação com outro nome, o `el` só sai por tíquetes ≤ 0 ou pela base tomada; se a base virar neutra (`hold = -1`) antes de ter outro dono, a eliminação por base sai mais tarde ou não sai.
- Se a P0 usar outra opção em `newState` para o número de lados (não `n` nem `N`), `--lados 3` para com erro (de propósito).
- Leitores de fora que contem com `curve` de 5 colunas quebram com 3 lados (o MCP só repassa a curva).
- Um servidor antigo (sem `el` em `ANA.kinds`) recusa o lote inteiro que tiver um `el`.

## Como testar depois

1. Regressão com 2 lados: `node tests/ana.js && node tests/ana-man.js && node tests/ana-online.js && node tests/mcp-general.js` (e `tests/all.sh`).
2. Torneio de 2 lados igual a antes: `node tools/balance.js --torneio 6 --era modern --min 5 --nobudget --save /tmp/t2`; o relatório deve ter "Lado 0 … lado 1 …" sem a tabela de colocação.
3. Depois de P0+P2+P4 na main: `node tools/balance.js --torneio 6 --lados 3 --min 10 --nobudget --save /tmp/t3`. Conferir: 6 trios, tabela "Colocação por lado", "Lados eliminados por partida", alerta a 45%.
4. Na página: Frente atual com 3 lados, assistir uma partida curta até um lado ser eliminado; no fim abrir "Revisão": colocação com o eliminado e o horário, 3 linhas no gráfico (a terceira em ocre), traço vertical na eliminação; abrir "Partidas anteriores" e a mesma partida pelo servidor (`GET /ana/m/...`).
5. MCP: `get_match_report` com `CEU_SIDE=2` durante a partida (só o lado 2) e depois do fim (todos).
