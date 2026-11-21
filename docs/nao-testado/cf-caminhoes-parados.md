# Caminhões parados na base (cf-caminhoes-parados): testado em parte

O que é (no main): o pool de veículos estacionados onde os soldados de um lado entram (`POOL`) se empilhava na base. `poolTrim(t, k, at)` (chamado pelo `trnPlan`) deixa um carro e um caminhão do pool por lado na estrada da frente e devolve os outros à reserva (`ecoBack`); o veículo do pool tem `u.pool = 1` e não é trocado enquanto está fora numa carona; a checagem olha também a estrada (`u.ri`); a carona espera a esquadra no máximo `MAN.ride.wait` (120 s) depois do encontro previsto (`R.eta`, `manRideEnd`, `mrd().why.late`).

## Testado (cf-pol-testes-a)

`node tests/trucks-base.js` no main atual: passa (18 checagens: um caminhão e um carro no lugar; o que sai numa carona não é trocado e volta sozinho; o segundo no lugar volta à reserva; o par da estrada que era a frente some e um par novo vem da reserva; o largado a 3 km volta, mas não com um jogador a 300 m; a carona desiste 120 s depois do previsto; a carona do planejador volta para casa quando a esquadra entrou numa manobra; sem NaN). As três funções que faltavam no main na época (`dsOf`, `myRoutes`, `foeOn`) já existem: a página carrega sem erro.

## Não testado

- A contagem longa da doc (partida IA × IA de 10 a 15 min por época com economia, logística e recuperação, caminhões parados perto de cada base): não coube, porque a máquina ficou com uma fila de memória que só deixa rodar uma coisa por vez, por no máximo 5 min.
- Se a reserva fica certa com o portão da economia e a abertura (`E.open`); se 120 s de espera é pouco para uma esquadra que atravessa mato; o lado dos Insurgentes com pool; online.
- `logistics.js`, `rec.js`, `transport.js`.

## Como testar

```
node tests/trucks-base.js
node tests/logistics.js && node tests/rec.js && node tests/transport.js
```

Partida IA × IA longa: `node /home/luiz/secondmate/data/cf-pol-testes-a/ag1/proof/trucks/probe.js` com `REPO=<cópia> MIN=12` conta, minuto a minuto e por lado, os caminhões e carros parados há mais de 60 s a até 1,7 km da base e os do pool; o esperado é no máximo um caminhão e um carro do pool por lado.
