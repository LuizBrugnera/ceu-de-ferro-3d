# cf-3l-p5-servidor: servidor, MCP e documentação para 3 lados (P5) — testado em parte

Testado (cf-pol-testes-a):
- `tests/sides3-online.js`: sala de 3 lados com páginas de verdade (anfitrião EUA de Abrams, convidados Rússia de T-90 e Insurgentes de T-55): o `welcome` diz `ns` 3 e cada página monta 3 lados no lado do seu modelo; uma página que pede 2 lados é recusada (`sides`); `cq` v2 com colocação; com a sala vazia, um modelo insurgente numa sala de 2 lados é recusado (`side`).
- Com 2 lados, as suítes do servidor passam: `relay`, `help-relay`, `resume-relay`, `logistics-relay`, `comms-relay`, `rec-relay`, `personality-relay`, `capture-online`, `spec-online`. `gen-relay`, `sappers-relay` e `forts-relay` usavam o lado 2 (agora válido numa sala de 3), a mina de tipo 2 (agora o IED de comando) e a obra 11 (agora um muro) como inválidos: os testes foram atualizados (lado 3, tipo 3, obra 14) e o lado 2 numa sala de 2 lados agora é conferido como `sides`.

## O que falta

- A ponte MCP do lado 2 numa partida de 3 lados de verdade ficou testada na rodada 4 (`tests/mcp-sides3.js`: `link` com Insurgents, 3 lados e os inimigos EUA e Rússia, `map.tickets` por facção, os pontos pelo nome do dono, a cadeira). **Conserto:** o `state` que ela pede passava de 23 KB para os Insurgentes (os blocos `icv` e `grl`, que a ponte nem lê) e o servidor só repassa `gres` até 16 KB: o general MCP dos Insurgentes nunca recebia o mapa. O `genAnswer` agora tira esses blocos (marcando `drop`) e, se ainda for grande, metade das esquadras, até caber. Falta `mcp-live.js` com uma passada do lado 2 (ele já falha em 7 pontos no `main`, com 2 lados).
- Com 3 lados: o `cmd` de cada lado só para o próprio lado, a captura com `cs`, minas e `hlp` do lado 2, e suspender e retomar a partida de 3 lados.
