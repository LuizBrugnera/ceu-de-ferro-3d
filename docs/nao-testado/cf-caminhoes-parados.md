# Caminhões parados na base: o que mudou e o que não foi testado

Tarefa `cf-caminhoes-parados`. O capitão viu "muitos caminhões parados e bugados na base".
Pela regra de entrega do capitão, só rodou o script focado do bug (`tests/trucks-base.js`) e o smoke de ~1 min. Nenhuma outra suíte, linha de base ou partida A/B.

## A causa (com evidência)

Uma partida IA × IA com economia, logística e recuperação (mapa v6, semente 7, 1944 e hoje) foi sondada a cada 60 s, contando os caminhões e carros de cada lado perto da base principal e os parados há mais de 60 s. Os parados na base eram sempre os veículos estacionados do **pool** (`POOL`, missão "reserve: veículos para quem os tomar"): um carro e um caminhão vazios onde os soldados de um lado entram, para quem quiser dirigir. Eles se acumulavam por dois caminhos:

1. **A carona leva o caminhão e outro é posto no lugar.** A carona da manobra (`MAN.ride`, `rideFind`) aceita um veículo estacionado. O caminhão do pool sai numa viagem e o planejador (`trnPlan`) não vê mais nenhum no lugar; 60 s depois põe outro, tirado da reserva. Na volta, a viagem leva o primeiro de novo ao mesmo ponto e à mesma faixa: dois caminhões um dentro do outro (o "bugado"). Na sonda, o lado 1 de 1944 ficou com dois no mesmo `s 1436`, um deles com a esquadra da carona (`sq: road`).
2. **A frente muda de estrada.** O pool fica na estrada da frente (`frontR`). Quando ela muda, um par novo é posto na estrada nova, e o par velho fica estacionado para sempre (o pool não tem `left`, então a limpeza dos veículos largados, `trnSlow`, não o vê). Na sonda, o lado 0 de 1944 ficou com dois pares, um na rota 1 e outro na rota 3.

A checagem do pool também não olhava a estrada (`u.ri`), só a distância `s`.

Achado junto: o veículo da carona esperava a esquadra no ponto de encontro até o fim da viagem inteira (`R.T`, que numa viagem de 23 km passa de 20 min). Na sonda, um caminhão de coluna ficou parado com o acelerador no máximo a 7,7 km da base esperando passageiros.

Achado de testabilidade: a seção do M5 (`m5Lg` e o resto) estava depois de `/* ---------- 3D scene`, fora da parte que o `tests/harness.js` carrega. Toda partida do harness com logística (`load({ lg: 1 })`) quebrava com `ReferenceError: m5Lg is not defined`, e o M5 nunca rodava nos testes.

## O que mudou

Tudo no `Céu de Ferro 3D.html`, mais o script `tests/trucks-base.js` e uma linha no `tests/README.md`.

- **`poolTrim(t, k, at)`**, chamado pelo `trnPlan` a cada vez, por tipo (carro e caminhão). Fica um só veículo do pool de cada tipo no lugar atual (estrada da frente, até `POOL.near` = 120 m de onde os soldados entram). Qualquer outro do pool estacionado, vazio, fora de viagem e sem ninguém nosso a menos de `BODY.keep.near` (300 m) volta para a reserva (`ecoBack`): o segundo no mesmo lugar, o da estrada que era a frente e o largado longe quando uma carona desistiu.
- O veículo do pool agora tem `u.pool = 1`. Enquanto um deles está fora numa viagem (carona), o planejador não põe outro: ele volta para o lugar.
- A checagem de "já tem um no lugar" olha também a estrada (`u.ri === ri`).
- **Carona com espera limitada.** `rideGo` guarda `R.eta`, a hora em que o veículo e a esquadra deviam se encontrar. No ponto de encontro (`rideEv`, `pick`), o veículo espera até `MAN.ride.wait` (120 s) depois disso. Passou disso, a carona acaba (`manRideEnd`): a esquadra segue a pé e o veículo volta para casa. O motivo conta em `mrd().why.late`.
- **A seção do M5 mudou de lugar**, sem mudar uma linha: agora fica logo antes de `/* ---------- 3D scene`, dentro da parte da simulação. No navegador o efeito é o mesmo: tudo o que ela embrulha (`tripTo`, `tankAmb`, `atkOpen`, `OPS.atk`, `AI.tank`) é definido antes, e nada entre o lugar novo e o velho embrulha essas funções de novo.

- `tests/README.md`: a linha do script novo, e os marcadores de conflito (`<<<<<<<`, `=======`, `>>>>>>>`) que tinham ficado no main em volta das linhas do `ambush.js` e do `approaches.js` saíram, com as duas linhas mantidas.

## O que rodou

- `node tests/trucks-base.js`: tudo passa (17 checagens). Com a página de antes (`PAGE=<página do main com só o M5 movido>`), 10 falham: três caminhões do pool empilhados na estrada velha, o segundo nunca volta para a reserva e a carona espera para sempre.
- Smoke: o servidor sobe em 127.0.0.1 e a página carrega no Chrome. A demonstração roda sem erro no console (só o 404 de sempre).

## O que NÃO foi testado

- Nenhuma partida longa depois da correção, nas duas épocas, nem online (anfitrião e convidado).
- Se a reserva fica certa: o veículo do pool aposentado volta com `ecoBack` só com o portão da economia ligado e fora da abertura (`E.open`), como o resto do código faz.
- Se a carona desiste cedo demais: 120 s depois do encontro previsto pode ser pouco para uma esquadra que atravessa mato. Se as caronas caírem muito, aumente `MAN.ride.wait` ou use outro limite.
- O jogador que anda até um veículo do pool que está numa estrada velha: com ele a menos de 300 m, o veículo fica. Longe disso, some (volta para a reserva).
- As suítes que usam a logística no harness (`logistics.js`, `rec.js`, `eco*.js` e outras) agora carregam o M5 também. Elas podem mudar de resultado porque o M5 passa a rodar nelas.

## Riscos

- A seção do M5 movida pode entrar em conflito com outra tarefa que mexa no fim do arquivo. Em conflito, mantenha os dois lados e confira se a seção ficou uma vez só, antes do `3D scene`.
- O pool aposentado some de vista (como os veículos largados de hoje). Quem estiver olhando de longe pela câmera do general pode ver o par sumir quando a frente muda.

## Como testar depois

```
node tests/trucks-base.js
node tests/logistics.js && node tests/rec.js && node tests/transport.js
```

Numa partida IA × IA de 10 a 15 min por época com economia, conte os caminhões parados perto de cada base. O esperado é no máximo um caminhão e um carro do pool por lado:

```js
const H = require('./tests/harness'), C = H.load({ seed: 7, eco: 1, lg: 1, rec: 1, mapv: 6 }), S = C.watch('ww2', { len: 0 });
for (let m = 1; m <= 12; m++) { C.run(60); for (const t of [0, 1]) console.log(m, t, S.units.filter(u => !u.dead && u.team === t && u.kind === 'truck' && Math.hypot(u.x - S.base[t].x, u.z - S.base[t].z) < 1700 && S.t - u.moveT > 60).length); }
```

No jogo: comece uma conquista com economia, espere a frente mudar de estrada (ou uma manobra com carona), e olhe a entrada da base no mapa do general. Deve haver só um caminhão e um carro estacionados na estrada da frente.
