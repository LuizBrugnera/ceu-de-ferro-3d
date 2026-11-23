# Veículo bate na casa e quebra (cf-tanque-casa)

## Testado em c397126 (cf-pol-testes-b, 2026-11-21): ok (parte)
- Navegador, Tiger I a 25 m de uma casa, acelerando: ele entra na casa a ~4 m/s, a casa passa ao estágio 1 (furada de lado a lado), o tanque perde 6 de 130 de casco e segue, e entra na casa seguinte. Como o documento diz, a casa não desaba. Sem erro no console.
- `tests/ram.js`: não rodou nesta tarefa (faltou tempo com a máquina cheia).
- **Continua sem teste:** o online e os caminhões da IA batendo em paredes.

## O que mudou
- **`RAM`** (perto de `bump`): cada veículo tem um peso por tipo (tanque 1, artilharia 0,8, antiaérea 0,6, blindado sobre rodas 0,45, caminhão 0,3, carro 0,15, veículo-rádio sobre lagartas 0,35; uma def pode ter `ram` próprio). O golpe é `peso × velocidade de fechamento / 20 m/s`; abaixo de 2,5 m/s não conta. Um golpe por veículo a cada 0,6 s.
- **`ramHit`**: o golpe de um casco contra o que está de pé.
  - Pesado (peso ≥ 0,6: tanques, artilharia, antiaérea): quebra as paredes de **qualquer** prédio da cidade (uma explosão de 45 × golpe, raio de 3,5 a 7 m, pelo `cityBlast`), derruba objetos antigos que desabam (`OBJ` house, tower, hangar, ctl: 70 × golpe pelo `hitObj`), perde velocidade e leva 1,5% do hp por golpe.
  - Leve (carro, caminhão, blindado sobre rodas): só quebra o que é leve (prédio tipo `barn`, agora `shed: 1`, e postes, agora `lite: 1`, que qualquer veículo derruba como o tanque derruba árvore). Contra o resto ele **bate**: volta para trás e leva `0,25 × hp × (v/20)²` (só 0,3 disso quando quebra algo leve).
  - Soldados no térreo do prédio, a até 4 m do golpe, levam até 30 de dano. O desabamento continua pelas regras que já existem (`bldSettle`, `bldFell`, `fallen`), e o entulho continua como cobertura.
- **`bldBump`**: o pesado atravessa uma casa de tipo `ram` (`house`, `barn`) depois que ela já está danificada (o primeiro golpe forte já faz isso). Ele anda a 40% da velocidade máxima, e o nariz quebra o que estiver na frente a cada 0,6 s até a casa desabar. Saiu `CITY.dmg.ram` (o golpe fixo de 30 só para tanque e artilharia).
- **Online**: sem mensagem nova. O golpe de um convidado vai ao host pelo `cityBlast`/`hitObj` (`Net.yb`, `Net.ohit`), como um tiro. O dano no próprio veículo é local (`rx`).
- Pathing: nada novo. Uma casa caída já sai da navegação (`navMark`).

## Testado em bbd5085: corrigido (tarefa cf-testar-mundo)

`tests/ram.js` (novo, no `tests/all.sh`), https://github.com/LuizBrugnera/ceu-de-ferro-3d/pull/115:
- Tanque a toda velocidade numa casa: a parede abre e ele atravessa a ~40% da velocidade, perdendo ~4% do hp. Abaixo de 2,5 m/s não há golpe.
- Prédio grande (`block`): ganha buraco e não é atravessado. O soldado no térreo junto ao golpe se fere.
- Carro na casa: bate, volta e perde hp, e a parede fica de pé. O carro e o caminhão abrem a parede do celeiro, e o carro derruba o poste da base.
- **Bugs corrigidos:**
  - O golpe só ia pela explosão (`cityBlast`), cujo dano cai do meio de cada vão: o carro a 28 m/s no celeiro, o caminhão, e até o Tiger num `block` não quebravam nada. Agora o vão atingido (`ramWall`) leva o golpe inteiro, vezes `RAM.shed` (3) para o casco leve contra galpão.
  - `RAM.crash` 0,25 → 0,1: nos passeios por cidade de `tests/world.js`, caminhões morriam só de bater em parede. Hoje um caminhão aguenta quatro batidas a toda velocidade.
- Partida IA × IA (1944, mapa 5, 300 s): 14 golpes de tanque (7 de hp no total), nenhuma batida de caminhão ou carro, nenhum veículo morto por batida.
- `tests/world.js`: com o RAM, o tanque derruba a casa antiga (`OBJ house`) e passa; o teste passou a começar cada direção do estágio testado. `city` passa.

## O que NÃO foi testado

- A casa **não desaba** depois que o tanque atravessa: fica no estágio 1, com o buraco de lado a lado. O esperado do doc era "desaba em alguns segundos". Se uma casa arrombada deve cair é escolha de desenho (o modelo de apoio do `bldSettle`), e ficou como está.
- Online (anfitrião e convidado batendo na mesma casa) e a cena no navegador.
- `tests/world.js` ainda falha "town N: nobody stuck" também no main: os veículos parados ali morrem de colisão entre veículos (`cf-colisao-veiculos`), não de batida em parede.

## Riscos
- Caminhão ou carro da IA andando rápido numa cidade e se destruindo nas paredes (`RAM.crash` alto demais).
- Tanque "dentro" de uma casa que, no convidado, ainda não recebeu do host o estágio danificado: ele bate e volta até a mensagem chegar.
- Um tanque devagar (abaixo de 2,5 m/s) numa casa já danificada pode atravessá-la sem quebrar nada, com o telhado ainda de pé por cima.
- A antiaérea (peso 0,6) agora conta como pesada para prédios, mas não derruba árvore (isso continua só para tanque e artilharia).
- Prédios grandes (`apart`, `block`) só ganham buracos, não são atravessados: é o esperado, mas confirme.

## Como testar depois
- `npm start` e abrir `http://localhost:8080`. Partida solo, era ww2, num tanque (Tiger ou Sherman): ir até uma vila e bater de frente numa casa a toda velocidade. Esperado: a parede abre, o tanque entra devagar, a casa desaba em alguns segundos e sobra entulho. Bater devagar deve só rachar.
- Repetir com um prédio grande (`row`/`block`): deve abrir buracos, sem atravessar.
- Num carro e num caminhão: bater numa casa. Esperado: volta para trás e perde hp (o carro a toda velocidade pode morrer). Bater num celeiro (`barn`) abre a parede. Passar por cima de um poste derruba o poste.
- Soldado dentro de uma casa (térreo) quando o tanque bate: perde hp, e morre se a laje cair em cima.
- Online: host e convidado, cada um num tanque, batendo na mesma casa. Os dois devem ver as paredes caírem igual.
- Partida IA × IA (`watch`) de 5 min numa cidade: comparar quantos caminhões da IA morrem sem ter sido atingidos, antes e depois. Se forem muitos, baixar `RAM.crash`.
