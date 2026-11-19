# Colisão entre veículos (cf-colisao-veiculos), não testado

Pedido do capitão: "adicione colisão entre os veículos também" (depois do PR #52, tanque quebra casa).
Pela regra de entrega, nenhuma suíte, baseline ou partida A/B foi rodada. Só o smoke do fim.

## O que mudou
Tudo no `Céu de Ferro 3D.html`, numa seção nova `VCOL`, logo depois do `bump`. `VCOL.on = 0` desliga tudo.
- **`vehCol(dt)`**: roda uma vez por passo, depois que todos os veículos se moveram (no `step`, logo após o `stepUnit`). Cada veículo de chão é uma cápsula: o segmento entre os círculos da frente e de trás, com a meia largura (`env[5]`). A fase larga é uma grade de 16 m (ou mais, se houver veículo comprido), e só se testam as 3 × 3 células em volta.
- **Empurrão por peso** (`ramW`, o mesmo peso do `RAM`; 0,3 para quem não tem): o mais leve é empurrado mais. Tanque empurra carro, carro mal empurra tanque. Veículo `fixed` (posto fixo) não se mexe. Veículo de outro cliente (`u.net`) não se mexe aqui: o cliente dele faz a parte dele.
  - Fora do trilho: empurrado no mundo (nunca para dentro d'água nem para fora do mapa).
  - No trilho (estrada ou viagem): empurrado ao longo do trilho (`u.s` / `trip.s`) e de lado por um afastamento novo, `u.cox`, que o `place` e o `tripMove` somam à faixa e que volta a 0 devagar (0,5 m/s).
- **Batida** (fechando a 2,5 m/s ou mais): a velocidade ao longo da normal vira um choque inelástico (devolve 20%); quem está fora do trilho perde ou inverte a velocidade. Cada um perde `0,25 × hp × golpe²`, com `golpe = 2 × (parte do peso do outro) × velocidade de fechamento / 20 m/s`. Carro de frente num tanque a 20 m/s morre; tanque contra tanque amassa os dois de leve. Um golpe por veículo a cada 0,6 s. Crédito do abate só se for inimigo (aliado não conta como fogo amigo).
- **Esmagar**: tanque andando a 2 m/s ou mais sobre um veículo de peso até 0,2 (carro; não o veículo-rádio), fechando a 4 m/s ou mais: o carro leva mais 50% do hp e o tanque perde 30% da velocidade.
- **IA**: o veículo no trilho com outro encostado na frente freia (`ai.rest` por 0,6 s). Preso por 2 s seguidos, ele desvia 4,5 m para o lado em que já está (`coxW`) e volta à faixa depois que passa. Fora do trilho, o `jammed` que já existia continua desencalhando. A direção (ultrapassagem, espaçamento do comboio) segue com o `ORG` do cf-movimento-organico; aqui só a física.
- **Online**: sem mensagem nova. Cada cliente empurra e dá dano só nos veículos dele (`rx`, como o `RAM`). O anfitrião faz a IA; o convidado faz o próprio veículo; as posições vão pela rede como antes.
- Infantaria: nada mudou.

## O que rodou (smoke de ~1 min)
- `node --check` no script da página: ok.
- O servidor sobe em 127.0.0.1 e a página abre no Chrome.
- No console: um tanque e um carro sobrepostos de lado foram separados (tanque andou 0,6 m, carro 3,9 m). De frente, a 10 m/s cada: o carro morreu, o tanque perdeu ~2% do hp e os dois voltaram para trás.
- Achado que já existia no main (não é desta mudança): na tela inicial a demonstração IA × IA dá `TypeError ... reading 'hp'` em `addHeli`, e o `step` para ali. Por isso não rodei uma partida pelo console.

## O que NÃO foi testado
- Nenhuma suíte (`tests/*.js`), nenhuma partida, nenhum A/B, nenhuma medição de custo por quadro.
- Não foi visto na tela, nem com o jogador dirigindo.
- Online (anfitrião e convidado) não foi testado.
- Valores (0,25, 2,5 m/s, 20% de devolução, esmagar 50%, desvio de 4,5 m) não foram calibrados.

## Riscos
- **Comboio no começo da partida**: veículos que nascem um em cima do outro agora se empurram (sem dano, porque não fecham velocidade). Pode espalhar a coluna nos primeiros segundos.
- **Cruzamentos de rotas**: veículos de rotas diferentes que se cruzam agora se travam e um espera o outro; pode atrasar a chegada da IA.
- **Fila na estrada**: o desvio (`cox`) pode jogar um veículo para fora da estrada, num barranco ou na água (o trilho não confere isso, só o veículo fora do trilho confere).
- **Online**: os dois lados empurram a sua parte; um convidado com atraso pode ver o tanque "quicar" contra a IA. Dano no veículo do convidado é dado pelo cliente do convidado.
- **Ponte**: veículos a mais de 4 m de altura um do outro não colidem (para a ponte e a estrada debaixo); um veículo numa rampa pode deixar passar outro.
- **Custo**: com população dobrada, `vehCol` é O(n) com a grade, mas o tamanho da célula sobe com o veículo mais comprido.

## Como testar depois
1. `HOST=127.0.0.1 node server.js`, abrir `http://localhost:8080`. Partida solo nas duas eras, num tanque: bater de frente num carro inimigo a toda velocidade (carro deve morrer ou parar, tanque quase nada), empurrar um caminhão parado (ele anda de lado), bater de frente num tanque (os dois perdem pouco hp e param).
2. Num carro: bater num tanque (o carro volta para trás e perde muito hp) e num carro (os dois perdem).
3. Partida IA × IA (`watch`) de 5 min: procurar veículos atravessando um ao outro, filas travadas em cruzamento e veículos caindo da estrada pelo desvio. No console: `S.units.filter(u => u.cox).map(u => [u.kind, u.cox, u.coxW])`.
4. A/B com `VCOL.on = 0` contra `1`: tempo de chegada da IA, veículos perdidos sem tiro e custo (`AIB.stat()`).
5. Online: anfitrião e convidado, cada um num veículo, batendo um no outro e na IA. Os dois devem ver o mesmo resultado, sem tremer.
6. Suítes que medem tempo de veículo: `tests/logistics*.js`, `tests/approaches.js`, `tests/ambush.js`, `tests/campaign.js`.
