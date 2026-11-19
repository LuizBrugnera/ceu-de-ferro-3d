# Veículo bate na casa e quebra (cf-tanque-casa)

## O que mudou
- **`RAM`** (perto de `bump`): cada veículo tem um peso por tipo (tanque 1, artilharia 0,8, antiaérea 0,6, blindado sobre rodas 0,45, caminhão 0,3, carro 0,15, veículo-rádio sobre lagartas 0,35; uma def pode ter `ram` próprio). O golpe é `peso × velocidade de fechamento / 20 m/s`; abaixo de 2,5 m/s não conta. Um golpe por veículo a cada 0,6 s.
- **`ramHit`**: o golpe de um casco contra o que está de pé.
  - Pesado (peso ≥ 0,6: tanques, artilharia, antiaérea): quebra as paredes de **qualquer** prédio da cidade (uma explosão de 45 × golpe, raio de 3,5 a 7 m, pelo `cityBlast`), derruba objetos antigos que desabam (`OBJ` house, tower, hangar, ctl: 70 × golpe pelo `hitObj`), perde velocidade e leva 1,5% do hp por golpe.
  - Leve (carro, caminhão, blindado sobre rodas): só quebra o que é leve (prédio tipo `barn`, agora `shed: 1`, e postes, agora `lite: 1`, que qualquer veículo derruba como o tanque derruba árvore). Contra o resto ele **bate**: volta para trás e leva `0,25 × hp × (v/20)²` (só 0,3 disso quando quebra algo leve).
  - Soldados no térreo do prédio, a até 4 m do golpe, levam até 30 de dano. O desabamento continua pelas regras que já existem (`bldSettle`, `bldFell`, `fallen`), e o entulho continua como cobertura.
- **`bldBump`**: o pesado atravessa uma casa de tipo `ram` (`house`, `barn`) depois que ela já está danificada (o primeiro golpe forte já faz isso). Ele anda a 40% da velocidade máxima, e o nariz quebra o que estiver na frente a cada 0,6 s até a casa desabar. Saiu `CITY.dmg.ram` (o golpe fixo de 30 só para tanque e artilharia).
- **Online**: sem mensagem nova. O golpe de um convidado vai ao host pelo `cityBlast`/`hitObj` (`Net.yb`, `Net.ohit`), como um tiro. O dano no próprio veículo é local (`rx`).
- Pathing: nada novo. Uma casa caída já sai da navegação (`navMark`).

## NÃO testado
Nada foi rodado além disto: sintaxe do script da página (`node --check`), o servidor sobe e a página abre sem erro de script.
- Nenhum teste de jogo: não vi um tanque atravessar uma casa, nem um caminhão bater.
- Os valores (45, 70, 2,5 m/s, 0,25 de batida, 40% de velocidade) não foram calibrados.
- Online (host e convidado) não foi testado.
- IA: veículos da IA fora da estrada que roçam paredes podem agora levar dano de batida.

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
