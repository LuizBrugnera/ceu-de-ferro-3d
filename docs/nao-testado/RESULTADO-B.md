# RESULTADO-B: teste de verdade da metade B de docs/nao-testado (cf-pol-testes-b)

Tarefa `cf-pol-testes-b` (2026-11-20/21). A metade B vai de `cf-m0-medicao.md` até o último arquivo em ordem alfabética. Para cada
documento rodei o que ele dizia que faltava: no navegador, em exercício sem tela ou com `tests/`. Anotei se passou ou falhou, consertei o que
falhou fora das seções do general e do cérebro (outra frente as reescreve), e encurtei o documento.

## Condições da máquina

- A conta inteira tem 12 núcleos (`cpu.max` do `user-1002.slice`) e 24 GB. Outras frentes rodavam torneios ao mesmo tempo, e o kernel
  matou processos por falta de memória. Por isso eu rodei no máximo 2 processos pesados por vez. Uma suíte levou de 2 a 70 min. Os
  torneios de 8 a 40 partidas que alguns documentos pedem não couberam.
- No Chrome headless, o `requestAnimationFrame` corria a 1–10 quadros por segundo. Os testes no navegador andam a partida à mão: chamam
  `step()` e depois as funções da cena (`updateCamera`, `syncScene`, `render3d`, `drawHud`, `genFrame`) por um `eval` do DevTools. O custo de
  quadro está em ms por quadro numa cena fixa, antes × depois na mesma cena (a função nova trocada no lugar).

## Lote 1 (cf-m0-medicao … cf-mapa-artilharia)

| Documento | Resultado |
| --- | --- |
| cf-m0-medicao | ok (parte). `ana-man` 25/26 (só a checagem de tempo, com a máquina cheia), `ana-mano-net` ok, `ana-parado` (novo, o "parado primeiro") ok. O torneio do custo do general não rodou. |
| cf-m2-abordagens | **falha**: `approaches` com 7 falhas: hora H (pelotão P8, provável drift do teste), substituição na reunião (4), nenhum assalto na partida de 180 s, custo sob carga. O planejador em si passa. No navegador o `gask ap` funciona. |
| cf-m3-procedimentos | **falha**: `procedures` 32 ok e 1 falha (hora H, pelotão P8). `man-c` cai com TypeError no cenário `cut`. |
| cf-m4-emboscada | ok (parte), no navegador: a guarda pedida pelo general abre e é desenhada (GRD); a IA abriu guarda e emboscada sozinha. |
| cf-m5-veiculos-trilho | parte: em 9 min no navegador nenhum tanque fora do trilho. Nada do M5 foi visto agindo. |
| cf-m6-memoria | parte: `mmView` com memória de manobra e de comboios perdidos numa partida de verdade. |
| cf-m7-jogador-mcp | ok (parte), no navegador: abordagens, painel em 1280 e 1920 px, "Fixar e flanquear por A2" abre a manobra, que embarca, desembarca e anda. A hora H não chegou em 540 s. |
| cf-m8-estrategias | ok (parte), no navegador: estratégias por frente e a geral no diário, efeitos (fogo e foco aéreo), `genState().stg`, `R.stg` do AAR. |
| cf-manobra-reuniao | parte: pool e prazo novos passam no `approaches`; falham a substituição e o "segue com 2 de 2" (veja M2). `ana-mano-net` ok. |
| cf-mapa-artilharia | **2 consertos**: rótulos empilhados no mapa de tiro (agora "CC ×3 · CM") e aviões inimigos não vistos aparecendo. `tests/map-tags.js`. |

### Achados para a frente do general (não consertados aqui)
- `tests/approaches.js` e `tests/procedures.js` estão vermelhos no main (ffff56d). A hora H provavelmente é o portão do pelotão (P8): o teste
  ainda espera o assalto na mesma chamada. O ajuste do teste vai no próximo PR, depois de uma rodada que confirme. A substituição na reunião e o "segue com 2 de 2" não
  têm explicação ainda, e em 9f2a313 passavam.
- `tests/man-c.js` cai com TypeError (`c.spec` de um candidato `cut` que não existe).
- O diário do plano de fortificação diz "Perímetro em a base avançada junto a C" (deveria ser "na base avançada").
