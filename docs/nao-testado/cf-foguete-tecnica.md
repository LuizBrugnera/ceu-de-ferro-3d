# cf-foguete-tecnica: foguetes das técnicas insurgentes que não explodiam (parte testada)

O que é: as armas `s5`/`s8` das picapes `tecS5`/`tecS8` viraram `rkt` (o foguete de avião em `S.bombs`, que explode no impacto: S-5 dano 55 raio 12, S-8 dano 95 raio 20); `ffHeld`, a HUD e o cartão do hangar sabem de `rkt`; foguetes não abatem mais mísseis.

## Testado
- `node tests/foguete-tecnica.js` de novo em cf-pol-testes-a: all passed (S-5: caminhão 32 → 3,1, soldados 66 → 50,9; S-8: caminhão destruído, soldados 66 → 4,6).

## Ainda não testado
- Na tela: corpo do foguete (S-5 menor que S-8), rastro e explosão. Tentado no navegador headless (um S-8 disparado na frente da câmera), mas o foguete já tinha explodido quando a captura saiu. Como: hangar, Insurgentes, "Técnica com foguetes S-8", atirar no chão perto de um caminhão.
- IA das técnicas contra avião e helicóptero: o avanço da mira usa a queda de bala (0,5 g) e o foguete cai 0,25 g, então a IA deve mirar um pouco alto de longe; e o balanço antiaéreo (55/95 de dano a menos de 9 m, explosão no fim da vida). Precisa de duelo técnica × helicóptero ou partida de 3 lados; não coube na trava de memória da tarefa (um processo pesado por vez). Como: no harness, `addUnit` de uma `tecS8` com IA e um `heliAir` inimigo parado a 600-1000 m, contar foguetes, acertos e dano em 60 s.
- Online (sem `relay`, cada cliente simula os foguetes do fantasma), dano em prédios (`OBJD.rocket.blast` sem `kg`), `tests/damage.js` e `tests/frame-budget.js` (não rodados de novo; ver a linha de base da tarefa).
