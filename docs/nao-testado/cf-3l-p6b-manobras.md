# cf-3l-p6b-manobras: manobras do general com N lados (P6b) — testado em parte

Testado (cf-pol-testes-a, `tests/sides3.js`): `mnFoes(0)` é `[1, 2]` e, com 0 e 1 aliados em `S.rel`, `[2]`; `mnBase(t, x, z)` dá a base inimiga mais perto do lugar; `mnLead(0)` é o lado 1 enquanto ele tem mais pontos e passa ao lado 2 quando ele o ultrapassa.

## O que falta

- Uma partida IA × IA de 3 lados longa (`SECS=600`): `cut`, `fnt` e `trn` contra pontos dos Insurgentes e da Rússia com `op.e` = dono do ponto; `blk` e `itd` nas estradas de suprimento dos dois inimigos; `gue` contra o líder com o texto certo; nenhuma manobra com posto, mina ou recuo virado para a própria base. Não rodou: a máquina estava dividida (um processo pesado por vez), e as manobras são da frente que reescreve o general.
- A regressão com 2 lados: `man-a`, `man-b`, `man-c`, `ambush`, `approaches`, `campaign`, `personality`, `tmap` (só `approaches-relay` e `personality-relay` rodaram e passaram).
