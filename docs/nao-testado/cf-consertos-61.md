# cf-consertos-61: três consertos do general (testado em parte)

Testado (cf-pol-testes-a, sem tela, mapa v11, semente 1): (1) duas esquadras com `hold` num ponto que o lado não segura, 100 rodadas do gancho do líder: 0 `pel-forma` com o conserto, 200 sem ele; com o ponto do lado, 1 pelotão que fica. (2) Moderna, aos 90 s cada lado já tinha 1 base avançada ordenada, e `enpFobPick` acha lugar a 392 e 457 m dos pontos seguros; com a regra antiga (700 m também contra os pontos) não acha nenhum. (3) Construtores da base avançada mortos: em 4 s a ordem desiste ("sem construtores"), o lugar sai de `A.fobs`, entra em `A.fobNo`, e a próxima escolha fica a 5,98 km dele. O que falta:

- **Contagem numa partida inteira** de `S.cbN['pel-forma']` (antes ~11-14 mil, esperado dezenas) e quantas bases avançadas cada lado faz em 15 min. Não rodou por falta de máquina (uma partida longa por vez para todos). Como: partida IA × IA de 30 min, 1944, semente 1, contar `S.cbN['pel-forma']`; moderna 15 min, contar as ordens `fob` (`C.enp`) e as falas "Base avançada" do log `eng`.
- **Torneio curto** (`tools/balance.js --torneio`, 12 partidas Curtas, `--nobudget`) contra o main anterior: não rodou (mesmo motivo).
- Riscos que continuam sem medida: mais bases avançadas por partida gastando engenheiros e recursos, e a base que falha por falta de recurso tentada de novo em outro lugar a cada 30 s.
