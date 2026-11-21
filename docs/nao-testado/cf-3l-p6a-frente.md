# cf-3l-p6a-frente: frente e general com N lados (P6a) — testado em parte

Testado (cf-pol-testes-a, `tests/sides3.js`, partida IA × IA × IA): os três generais planejam em rodízio (`planK` gira 0 → 1 → 2); os tetos de população são EUA 143/34/7, Rússia 143/34/7 e Insurgentes 194/28/0; nenhuma aeronave insurgente; todo veículo da IA que sai em 20 s sai numa estrada do próprio lado, virado para a outra ponta.

**Conserto (cf-pol-testes-a):** os veículos estacionados da base (`trnPlan`, o pool de carro e caminhão onde os soldados embarcam) ainda usavam a frente global e o sentido de 2 lados (`frontR()`, `t ? 1 : -1`). Com 3 lados o caminhão ZIL-131 insurgente nascia na estrada 0, na base dos EUA; e um lado que não é ponta da estrada da frente estacionava fora das suas estradas. Agora é `frontR(t)` e `dsOf(t, ri)`. Teste: `tests/sides3.js` ("every AI vehicle that set out...") falhava com "zil131 side 2 road 0" e passa.

## O que falta

- A escolha do inimigo com 3 lados (`cqAim`, `tkLeader`, `LEAD`): dar mais tíquetes a um lado e ver os outros dois mirarem os pontos dele ("Assalto planejado contra").
- O jogador num lado de 3: nasce na estrada da frente do seu lado, virado para a base inimiga mais perto.
- Partida de 10 min de 3 lados olhando o diário: colunas "pela rota N" só nas estradas do lado, emboscadas só nelas.
- Os lugares que o documento original listava como ainda de 2 lados (`u.ds` ao reassumir ou capturar, `heliHold`/`heliLift`, `postDisp`, `aiSite`, o atirador, a ordem de ataque do general, `manAt`): não foram revistos.
- O custo por quadro do anfitrião com 480 soldados e 96 veículos em 3 lados. Numa partida de 3 lados com economia na máquina dividida, o medidor (`AIB`) mediu 137 ms por quadro em média (pior quadro 843 ms) e cortou o teto para 90%; número inflado pela carga da máquina (a partida andou a 0,24 × o tempo real com `nice`), mas é preciso medir numa máquina livre.
