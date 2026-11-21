# cf-3l-p2-conquista: conquista com N lados (P2) — testado em parte

Testado (cf-pol-testes-a):
- `tests/sides3.js`: num ponto com pesos 2 / 5 / 4, o lado 1 começa a tomá-lo, no ritmo da margem sobre o segundo (margem 2 vai duas vezes mais rápido que margem 1); um lado sem tíquetes sai (`out` 1), a partida segue, os pontos dele ficam neutros, o diretor dele para, o aviso "foi eliminado" sai e `cqFree` fica falso; a base principal tomada tira o lado (`out` 3) e o último de pé vence; a colocação é o vencedor, o último a sair e o primeiro a sair.
- `tests/sides3-online.js` (servidor de verdade, anfitrião EUA e convidados Rússia e Insurgentes): `cq` v2 leva os pontos e os 3 tíquetes aos convidados; eles deduzem a eliminação (com o aviso "Seu lado foi eliminado" para o insurgente); o fim tem a mesma colocação em todos, com "Vitória", "Derrota · 2º lugar" e "Derrota · 3º lugar".

## O que falta

- Na tela: a faixa de pontos com 3 cores, os tíquetes dos dois inimigos (✕ do eliminado), as marquinhas por lado, a barra na cor de quem toma e a Visão de General com o `cap`.
- A perda de tíquetes pelo líder numa partida inteira, e se `ANA` (P9) a recalcula igual.
- Equivalência exata com 2 lados ao cruzar 0 (não medida); o jogador eliminado fica sem câmera de espectador própria.
