# Defesa por posições (cf-defesa-posicoes; testado só no sandbox)

O plano de defesa por ponto (`S.dfp`, `dfpPlan`, seção `CEREBRO: defesa (DFP ...)`): entradas pelas estradas, postos em fogo cruzado, vigia, reserva, carros em posição desenfiada com alternativa, `genCmd dpos`, a aba Defesa, a camada do mapa e o MCP (`get_defence_plan`, `set_defence_positions`). `DFP.on = 0` volta ao jeito antigo.

Testado (cf-pol-testes-a): `node tests/dfp.js` rodou pela primeira vez. O teste criava os carros sem modelo (`addUnit('tank', ..., null, ...)`, `TypeError` em `addVehicle`); com o primeiro carro do lado, passa nos mapas 10, 4 e 11: 12 lugares, os dois mais perto a 5,0 m; as esquadras em postos a 90 m, setores cruzando a 27° na mesma zona de morte; ninguém fora do círculo menos a vigia; 2 carros a 81 m um do outro, o mais perto do meio a 93 m, as duas torres vendo a zona de morte. Nos três mapas nenhum lugar de carro saiu desenfiado (`hd` falso): o plano ficou com o melhor lugar com visada.

## O que falta (não rodou: máquina dividida, uma partida longa por vez para todos)

- Nenhuma partida, torneio, navegador ou online. Riscos: a defesa de toda partida muda (homens mais espalhados, uma esquadra na reserva com 3, a vigia morre primeiro e não conta para a captura); replanejar a cada 35° move todo mundo.
- O carro indo até o lugar fora da estrada (`m5Go` e depois `driveTo` pelo campo; pode encalhar em casa, mata ou declive), um lugar desenfiado de verdade e o "atira e muda" (o "atirou" é o `fire[0]` do controle). A antiaérea fora do trilho (`u.rail = false`).
- O custo (~70 linhas de visada por ponto e ~150 para os carros a cada plano).

## Como testar

1. Suítes que o `ptPts` e os carros afetam, contra o main de antes (`PAGE=<página antiga>`): `infantry`, `squads`, `city`, `forts`, `cover`, `field`, `brain-pelotao`, `tps`, `capture`, `campaign`, `frame-budget`.
2. Torneio A×B com `DFP.on` 1 × 0 nas mesmas sementes (com `nice`): vitória, tíquetes e pontos perdidos na defesa.
3. Navegador, IA × IA moderna: Tab, camada "Posições de defesa", um ponto com 2-3 esquadras (setores nas entradas, lados diferentes, vigia à frente, reserva atrás); câmera de comandante: "Defesa: posto em fogo cruzado..."; diário: "Carro de combate toma posição desenfiada em ...", e seguir o carro (sai da estrada, para atrás de crista ou prédio, atira e troca).
4. Aba Defesa: Refazer, Desligar, Carros +, Soltar carros, Marcar posto. MCP: `get_defence_plan`, `set_defence_positions {point, mode: "tank", count: 2}` e `{point, squad, x, z}`.
5. Online: o convidado vê a camada e a seção, e as ordens `dpos` dele valem no anfitrião.
6. Custo: `AIB` com e sem `DFP.on` numa partida grande.
