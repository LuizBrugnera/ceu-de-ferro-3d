# Colisão entre veículos (cf-colisao-veiculos): testado em parte

Seção `VCOL` do `Céu de Ferro 3D.html` (`vehCol`, `vcolPair`, `vcolHit`): cada veículo de chão é uma cápsula; dois que se encostam são empurrados pelo peso, e batendo a 2,5 m/s ou mais cada um perde `0,25 × hp × golpe²`. `VCOL.on = 0` desliga.

## Testado (cf-pol-testes-a)

Sem navegador, chão plano, nas duas épocas (velocidade de mapa, que é 2,3 × a do mostrador, `GSPD`):
- tanque a toda contra carro que vem de frente: o carro morre, o tanque perde 15 a 16%;
- carro a toda contra tanque parado: o carro morre, o tanque perde 7%;
- carro contra carro de frente, a toda: os dois morrem;
- tanque contra caminhão parado de lado (o tanque acelerando 25 m): o caminhão anda 3,4 m e perde 65 a 72%;
- tanque e carro sobrepostos parados: separados sem dano (o carro anda 0,5 a 1,8 m).

Partida IA × IA (1944, semente 7, mapa v6): **falhou**. Nos primeiros 60 s houve 26 batidas e **6 veículos da IA destruídos pelo próprio lado** (caminhões, obuseiros, lança-foguetes, antiaérea), todos no trilho, nas colunas saindo da base (fechando a 15 a 51 m/s). O motorista da IA no trilho só vê o veículo da mesma faixa da mesma estrada (`scan`), e antes da colisão eles se atravessavam. **Consertado** em `vcolPair`: dois veículos do mesmo lado dirigidos pela IA só se empurram e seguram, sem golpe. O dirigido por uma pessoa e o do inimigo continuam levando o golpe. Regressão: `tests/vcol.js` (antes: 5 falhas, inclusive 2 caminhões destruídos pelo próprio lado nos primeiros 20 s; depois: passa). Em 10 s por época, `vehCol` custou ~1% do tempo do passo, o maior desvio `cox` foi 0,05 m e nenhum veículo foi parar na água.

## Não testado

- **Calibragem**: os números são de velocidade de mapa. Dois tanques de frente, acelerando de 40 m um contra o outro, morrem os dois (perderam 104 a 120%), e pela conta um tanque a toda contra um tanque parado perde cerca de 48%: não é o "amassa de leve" do pedido. Se o capitão quiser, dividir a velocidade de fechamento por `GSPD` antes do golpe (fica: tanque contra tanque a toda ~36% cada, tanque contra parado ~9%).
- Inimigos da IA que se cruzam ainda se batem com dano (não medido numa partida longa).
- Nada na tela nem com o jogador dirigindo; online (anfitrião e convidado) nunca rodou.
- A/B com `VCOL.on` 0 e 1 em partidas longas (tempo de chegada, veículos caindo da estrada pelo `cox`), e as suítes de tempo de veículo (`logistics*.js`, `approaches.js`, `ambush.js`, `campaign.js`).

## Como testar

- `node tests/vcol.js`
- No jogo: tanque a toda contra carro, contra caminhão parado e contra tanque; online, dois jogadores batendo um no outro.
- Partida IA × IA de 5 min: `S.units.filter(u => u.cox).map(u => [u.kind, u.cox, u.coxW])` e veículos perdidos sem tiro.
