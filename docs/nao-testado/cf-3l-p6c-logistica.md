# cf-3l-p6c-logistica: logística, economia, rádio e apoio com N lados (P6c) — testado em parte

Testado (cf-pol-testes-a, `tests/sides3.js`, partida de 3 lados com economia e logística): `S.eco.d` tem 3 lados e o lado 2 tem instalações; os pontos de busca do lado 2 (`ecoLook(2, i)`) caem todos dentro do mapa; o lado 2 mede a profundidade nas suas estradas (`lsRail` dá a estrada 3 ou 4); com 0 e 1 aliados, `lsFoes(0)` é `[2]`. A partida roda sem exceção nem NaN. Numa partida de 3 lados com economia e logística (56 s de jogo), cada lado mandou comboios pelas próprias rotas (EUA pelas rotas 1 e 3, Rússia pela 1, Insurgentes pelas 4 e 5), e os três lados ergueram as mesmas instalações (mina, usina, fábrica e uma segunda mina cada).

## O que falta

- Com 2 lados, as suítes `eco`, `eco-prod`, `eco-war`, `logistics`, `rec`, `radio`, `comms`, `aid`, `seat`, `sappers`, `general`, `gen-cmd` e as de rede `eco-online`, `eco-war-online`, `logistics-online`, `rec-online`, `gen-online` (não rodaram: a máquina estava dividida, um processo pesado por vez; `logistics-relay`, `rec-relay`, `comms-relay` e `resume-relay` passaram).
- Testado na rodada 5 (`tests/sides3.js`): um comboio dos EUA destruído pela Rússia sai como perdido no diário dos EUA, destruído no da Rússia e nada no dos Insurgentes (`lgLost`); a carga de um caminhão dos EUA tomada por um insurgente é dos Insurgentes ('Tomamos 40 caixas…'), nada no diário da Rússia (`lgGrab`). Falta: um transmissor do lado 1 ouvido só pela rede do lado 2 sobe `S.cn.st[2].df`.
- Partida de 20 a 30 min com economia: cada general manda comboios só pelas próprias estradas e o diário de logística de cada lado só fala do que ele viu ou fez.
