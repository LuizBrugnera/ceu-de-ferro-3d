# cf-dano-caminhao: arma portátil não destrói mais caminhão nem carro (testado em parte)

`ARMOR.truck.saf`/`ARMOR.car.saf` (o tiro de fuzil, metralhadora leve ou pistola, `b.sa`, tira 3% da estrutura e 25-30% da peça), `ARMOR.rad` para o veículo-rádio, a marca `sa` online (`m.s = 1`). Teste: `tests/dano-caminhao.js`.

Testado (cf-pol-testes-a): `node tests/dano-caminhao.js` passa (22 checagens): 8 tiros de pistola e 30 de fuzil deixam de pé os quatro caminhões (HEMTT 20,8 de 32 hp) e os quatro carros (Kübelwagen 3,9 de 16 hp, Jeep 3,6 de 16), uma rajada de .50 destrói todos, e o veículo-rádio não perde nada para o fuzil. Nota: um carro leve aguenta um carregador de fuzil, mas não uns 45 tiros.

## O que falta (não rodou: máquina dividida, uma partida longa por vez para todos)

- `tests/transport.js`, `damage.js`, `damage-relay.js`, `transport-relay.js` e `transport-online.js` (expectativas antigas de fuzil em caminhão e veículo-rádio podem ter mudado).
- Jogando: primeira pessoa, IA atirando em caminhão, as duas épocas, online com dois navegadores (o cliente atira num caminhão da IA do anfitrião e ele resiste).
- A coaxial e a MG de avião (calibre de fuzil, sem `b.sa`) continuam com dano cheio em caminhão; o veículo-rádio as ignora. A morte do motorista em caminhão aberto ainda pode encerrar o veículo.

## Como testar

- `SUITES="transport damage damage-relay transport-relay transport-online" sh tests/all.sh`
- Jogando: pistola e um carregador de fuzil num caminhão (pneus furam, quem está dentro se fere, não explode); rajada de .50 de um jipe destrói; fuzil no M3 ou no M577 não faz nada.
