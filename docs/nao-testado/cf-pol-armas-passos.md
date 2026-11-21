# cf-pol-armas: os passos do soldado e a granada lançada (ramo sem PR: passou do prazo de 08:30Z)

- `sndSteps` e `SND.foot`: um passo a cada π/2,3 m de `P.step` (o pé do balanço da vista), mais alto correndo, mais baixo agachado e deitado; nenhum parado ou embarcado.
- `sndHands`: o lançar de uma granada ou de uma granada de fumaça (`SND.hand.toss`).
- Testado: `tests/som.js` ("the soldier's footfalls"): 7 passos em 10 m, correr mais alto, deitado mais baixo, nada parado ou embarcado, a granada e a fumaça. Navegador: 4,3 m andados, 3 passos (o esperado), a granada ouvida, sem erro no console.
- Não testado: de ouvido.
