# cf-insurgentes-conteudo: a facção Insurgentes (conteúdo), homem-bomba e carro-bomba (o que ainda falta testar)

Testado (cf-pol-testes-a, no harness, numa partida de 3 lados esvaziada; script em `/home/luiz/secondmate/data/cf-pol-testes-a/ag4/proof/content.js`):
- **Montagem**: no lado 2 montam sem erro os 16 veículos (técnicas, moto, carros, carro-bomba, ZIL-131, BTR-70 e as antiaéreas antigas), o T-55, o T-62, a técnica de 107 mm e os 14 kits.
- **`server.js`**: conhece todos os ids. O `node tests/gen-loads.js` não muda nada nele.
- **Homem-bomba da IA** (`aiMan`): corre 150 m até um fuzileiro inimigo e explode a 8 m dele, aos 27 s. O fuzileiro morre.
- **Carro-bomba da IA** (`AI.car`): tinha um bug, consertado.
  - O carro posto na estrada (no trilho, `u.rail`) com um T-72 a 600 m, dentro do `seek`, não andava. O `driveTo` não move um veículo no trilho.
  - O embrulho do general (`insGo`) já tirava o carro do trilho, mas só enquanto não havia alvo no `seek`. O carro despachado com o inimigo já perto da base (base atacada) ficava parado.
  - Agora o `AI.car` do BOMB tira o carro do trilho antes de dirigir.
  - Teste: `tests/bomba-ia.js` (o homem-bomba e o carro-bomba). Falha antes do conserto e passa depois.

## O que ainda não foi testado
- **Navegador**: os modelos 3D (técnicas, moto, carro-bomba, BTR-70, T-55/T-62, técnica de 107 mm, bandeira), de dia e de noite. Não abri a página: o navegador só podia rodar sob a trava pesada, e a fila não deixou.
- **Regras de engajamento**: o homem-bomba e o carro-bomba segurando com civis perto (`roeHeld`). O homem-bomba armado morto por tiro, que às vezes explode (`BOMB.kill`, sorteio).
- **Online**: a explosão só no anfitrião e o convidado vendo o dano.
- **Jogador** como homem-bomba ou no carro-bomba; a moto, as técnicas e o BTR-70 dirigidos pelo jogador; o assento `gunnerM` do BTR-70.
- **Armas**: SPG-9 num carro, morteiro de 82 mm, Malyutka/Kornet, Strela, drones comerciais, sapador com IED.
- **Suítes**: `drone.js`, `damage.js`, `infantry.js`, `civ.js`, `sappers.js`, `frame-budget.js` não rodaram aqui. Comparar com a linha de base do `main`.
