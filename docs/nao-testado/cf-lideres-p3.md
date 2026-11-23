# cf-lideres P3: o líder da esquadra (o que ainda falta testar)

O P3 é a seção `CEREBRO: lider (P3, cf-lideres)`: patente e nome, sucessão, quadro-negro honesto, confiança e frente, técnica de movimento, o procedimento `reagir` (flanco com base de fogo), os casos de blindado, o cartão e o MCP, e o conserto do `K.first`.

Testado:
- **Pelo autor**: `tests/brain-lider.js`, `brain.js`, `brain-falas.js`, `brain-honesty.js` e `brain-drills.js` (ww2).
- **Em cf-pol-testes-a** (exercício no sandbox, `/home/luiz/secondmate/data/cf-pol-testes-a/ag4/proof/lider.js`), a meta **"a esquadra segue a missão 60 s depois de perder o líder"**, numa esquadra que sobrevive:
  - uma esquadra a pé com ordem `move` a 450 m perde o sargento 12 s depois de sair (`killMan`);
  - o cabo assume em 2 s ("Cb. Moreira");
  - em 60 s a esquadra anda 215 m (ww2) e 220 m (moderno). A mesma esquadra sem perder o líder anda 223 m;
  - a ordem continua a mesma.

## O que ainda não foi testado
- **Num assalto**: a esquadra em `assault` contra um soldado parado a 450 m quase não andou nos 60 s depois da sucessão (4 m). Esse exercício não teve o controle sem matar o líder, então não se sabe se a parada é do líder ou do assalto. Rodar `lider.js` com `['ww2', 'assault', 3, 1]` (sem matar) e comparar.
- **Partidas inteiras, torneios, a suíte toda e online.** O convidado não roda o líder, e o cartão do convidado vem do anfitrião.
- **"Todos abrigados e atirando em ≤ 2 s"**: é do P1 (soldado), e não chega lá hoje.
- **O custo por quadro** com muitas esquadras em contato (relatos a 2 Hz por homem, filtro das crenças a cada pensamento). Uma medida suja: 60 s de uma partida de 3 lados com 90 esquadras, numa máquina com carga ~40 e o processo em `nice`. O `AIB.stat()` deu `brain` 2,65 ms de média por passo (máximo 43), com a IA toda em 105 ms. É muito mais que os 0,03 ms do P0 no navegador, mas a carga torna o número inútil para o orçamento. Medir com `node tests/frame-budget.js` numa máquina livre.
- **O lado do flanco** pela grade de exposição do P2 quando ela não existe (vale 0,5) ou é antiga.
- **Insurgentes**: os nomes e as patentes aparecem, mas o comportamento deles não foi olhado.
- **Suítes que falham no `main`** (cf-pol-testes-a rodou com a página do `main` e com a cópia, o mesmo resultado nas duas):
  - `tests/brain-lider.js`: 16 ok e 1 FAIL, "the unit card: —". O cartão perdeu a linha do líder. Suspeito do embrulho de `rtsBrain`/`genCard` da seção `CEREBRO: pelotao` (P8); `tests/sim-split.js` também reclama de `rtsS`/`rtsBrain` ali.
  - `tests/inf-drills.js`: 4 FAIL.
    - Ferido buscado volta com 14,3 de hp.
    - No ponto guardado, só 1 de 5 (ww2) e 2 de 6 (moderno) ficam em prédio ou obra, sem reserva.
    - Nos lances, a equipe de cobertura fica parada só 47% do tempo.
    - Pode ser o `K.first` (risco previsto acima); não investigado.
- **Outras suítes que podem mudar com o `K.first`**: `drills.js`, `help.js`, `w13.js`, `ambush.js` e `procedures.js` não rodaram.
