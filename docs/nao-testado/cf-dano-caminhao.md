# cf-dano-caminhao: arma portátil não destrói mais caminhão nem carro

## Causa
O tiro de infantaria (fuzil, metralhadora leve, pistola: `b.sa`) atingia caminhão e carro com fator 1
(`ARMOR.truck.sa` e `ARMOR.car.sa` = 1). Cada tiro tirava 80% do dano da estrutura (`HIT[bullet].hull`).
Um Opel Blitz tem 25 hp e a pistola dá 7, então 4 ou 5 tiros acabavam com ele. Um pneu já furado
ainda repassava metade de cada tiro para a estrutura (`K.over`). E o veículo-rádio (half-track, M577,
MT-LBu) usava a blindagem de carro, então o fuzil também o feria.

## O que mudou
- `ARMOR.truck.saf = [.03, .25]` e `ARMOR.car.saf = [.03, .3]`: o tiro de arma portátil num veículo
  sem blindagem tira 3% da estrutura (depois do `HIT`) e 25–30% da peça atingida.
  - Pneu (`TYRE.sa = 1`): fura com 1 tiro de fuzil.
  - Tanque de combustível (`FUELTANK.sa = .12`): só é destruído (e tem 60% de chance de pegar fogo)
    depois de uns 9 tiros de fuzil nele.
  - Motor: para depois de uns 6 tiros nele.
  - Quem está dentro continua sendo ferido como antes (`paxHit` recebe o dano cheio).
- Pneu ou peça já destruída: o tiro de arma portátil repassa à estrutura só a fração de estrutura.
- `ARMOR.rad` (veículo-rádio, `def.rad`): placa que para fuzil e MG de calibre de fuzil
  (`pen: [.06, .06, .06, .03]`). A .50 (ap .08) e os canhões passam.
- A .50, a Kord, a DShK (`hmg`), os canhões automáticos e os projéteis não mudaram: uma rajada de .50
  continua destruindo caminhão e carro.
- Online: a marca `sa` vai junto com o acerto (`m.s = 1`, que o `server.js` deixa passar em `via`),
  para o anfitrião aplicar a mesma regra. Um servidor antigo descarta a marca, e aí o anfitrião
  aplica o dano cheio, como antes.
- Checagem focada: `tests/dano-caminhao.js`.

## O que NÃO foi testado
- Só rodei `node tests/dano-caminhao.js` (todas as checagens passaram) e a subida do `server.js`.
  Nenhuma outra suíte rodou.
- `tests/transport.js` (proteção por veículo e causa) pode ter expectativas antigas de fuzil ferindo
  caminhão e veículo-rádio.
- Não testei jogando: primeira pessoa (cf-arma-1p), IA atirando em caminhão, as duas épocas e o online
  com dois navegadores.
- A metralhadora coaxial e a MG de avião (calibre de fuzil, `ap 0`, mas não `b.sa`) continuam com o
  dano cheio em caminhão. O veículo-rádio agora ignora essas armas.
- AA (`ARMOR.aa`) e artilharia não mudaram.

## Riscos
- A IA de infantaria pode gastar munição atirando em caminhão sem destruí-lo.
- A balança de partida mudou: caminhões de reforço sobrevivem mais à infantaria.
- A morte do motorista por tiro em caminhão aberto (`open .08`) ainda pode encerrar o veículo
  (`gone` → `o.end`), com a explosão de `killUnit`.

## Como testar depois
- `node tests/dano-caminhao.js`
- `SUITES="transport damage damage-relay transport-relay transport-online" sh tests/all.sh`
- Jogando: em primeira pessoa, descarregue a pistola e um carregador de fuzil num caminhão. Os pneus
  devem furar e quem está dentro deve se ferir, mas o caminhão não deve explodir. Uma rajada de .50 de
  um jipe ou HMMWV deve destruí-lo. Fuzil no M3 ou no M577 não deve fazer nada.
- Online: o cliente atira num caminhão da IA do anfitrião, e o caminhão também deve resistir.
