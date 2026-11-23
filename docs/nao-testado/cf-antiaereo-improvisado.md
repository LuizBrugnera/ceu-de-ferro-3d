# cf-antiaereo-improvisado: RPG e .50 contra o helicóptero que combate perto

Pedido do capitão: "os insurgentes com bazuca e essas explosivas... veiculos com .50 devem tentar atirar nos helicopteros q vem perto e estão em combate com eles".

## O que mudou (`Céu de Ferro 3D.html`)
- **Soldado com lança-rojão** (`k: 'heat'`: RPG-7, RPG-7V, bazuca, Panzerfaust), de qualquer lado, com munição: um `manThink` novo (o último, antes da cena 3D) dá a ele como alvo o helicóptero inimigo mais perto que (`heliAt`, `helEng`, tabela `HELAT`):
  - está a até 1,6× o alcance da arma (RPG-7 400 m, RPG-7V 352 m) e a até 300 m do chão, e o soldado o percebe (`known`);
  - está em combate com ele ou com a área dele: a até 150 m na horizontal, ou o alvo da IA do helicóptero a até 300 m dele, ou o helicóptero atirou com o canhão (`shotT`) nos últimos 10 s com o nariz para ele, ou acertou ele ou alguém da esquadra nos últimos 20 s.
  - Isso vem antes de qualquer alvo no chão. Ele para, se ajoelha e atira logo, sem esperar o flanco do blindado. Não vale para esquadra em fuga, com ordem de não atirar ou em deslocamento por ordem do comandante.
- **A pontaria** (`helErr`): o aiMan calcula a antecipação, e o erro de julgamento dela entra por cima: 0,075 rad pairando e até 0,225 rad a 40 m/s ou mais, sorteado de novo a cada foguete. Dano, raio, velocidade e alcance do foguete não mudaram, nem os mísseis antiaéreos (`k: 'sam'`).
- **Veículo com .50** (técnica DShK, HMMWV, Tigr, metralhadora de teto do tanque): esse comportamento já estava no main e não mudou. O `gunner` (carros) e o `aiTank` (metralhadora de teto) já miram primeiro na aeronave baixa de `lowPlane` (até 1000 m de distância e 600 m de altura), antes de soldado ou veículo. O teste novo agora cobre isso.

## Testado
- `tests/antiaereo-improvisado.js` (novo, passa; com 6 tentativas por cenário): esquadra insurgente (2 RPG-7V e 2 fuzis) contra um AH-64 sem IA.
  - Pairando a 200 m, 30 m de altura e atirando nela: 22 foguetes, 5 acertos, 5 de 6 derrubados. No main: 0 foguetes.
  - Passada a 45 m/s, 40 m de altura e 120 m de lado: 12 foguetes, 1 acerto.
  - Pairando a 300 m com o nariz para longe e sem atirar: nenhum foguete enquanto estava a mais de 150 m deles.
  - A 600 m: nenhum foguete.
  - Técnica com DShK a 400 m: acerta e derruba nas 6 tentativas.
- Sondas fora do repositório (`close.js`, `battle.js`, `probe.js`), comparadas com o main: pairando a 150 m e atirando, 22 foguetes, 9 acertos e 7 de 8 derrubados (main: 0 foguetes). Um AH-64 com a IA de ataque contra a mesma posição fica a uns 3 km (máscara e subida): não entra no alcance do RPG e não leva foguete nem no main nem aqui.
- `heli-ai.js` passa.
- `infantry.js`, `sim-split.js` e `urbano.js`: cada um tem 1 falha, que também acontece no main ("small arms hurt soldiers, trucks and AA"; `rtsS`/`rtsBrain` na parte da simulação; "the sniper takes a post of his own").

## Não testado
- No navegador e jogando: o jogador de helicóptero levando RPG de perto. Como o canhão do jogador também marca `shotT`, ele também conta como "em combate".
- Online: soldados remotos (`m.net`) ficam de fora. A regra só roda no anfitrião.
