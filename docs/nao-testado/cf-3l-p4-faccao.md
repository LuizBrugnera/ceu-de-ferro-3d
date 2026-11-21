# cf-3l-p4-faccao: a facção Insurgentes como lado 3 (P4) — testado em parte

Testado (cf-pol-testes-a):
- `tests/sides3.js`: os lados se chamam EUA, Rússia e Insurgentes; `leo2` é o M1A1 Abrams e `pzh` o M109A7 Paladin; os Insurgentes não têm aviação (`sideLacks`), o teto deles é 194 soldados, 28 veículos e 0 aeronaves, nenhuma aeronave insurgente nasce, e a antiaérea deles são as armas antigas sobre técnicas (`aaOld`, cf-insurg-antiaerea), nunca um veículo antiaéreo.
- `tests/sides3-online.js`: um jogador entra como Insurgente de T-55 numa sala de 3 lados (`ns` 3) e fica no lado 2; uma página que pede "Dois" numa sala de 3 é recusada (`sides`).
- No navegador (Chromium sem janela, 1280 e 1920 px): a fileira EUA / Rússia / Insurgentes aparece na Frente atual; com Insurgentes as classes são Tanque, Artilharia, Infantaria e Transporte (sem Avião, Helicóptero nem Antiaérea) e o primeiro cartão é o T-55A (capturado); o lado fica guardado ao recarregar (`ceu-de-ferro-3d-lado`); "Dois" no painel Partida esconde os Insurgentes e volta aos EUA, "Três" os traz de volta; sem rolagem horizontal e sem erro na página.

**Conserto (cf-pol-testes-a):** o texto da missão dizia "Você entra pela Insurgentes", "decola pela EUA": agora "pelos Insurgentes", "pelos EUA", "pela Rússia", "pela Luftwaffe", "pelos Aliados" (`pelaDe`).

## O que falta

- Jogar como insurgente: técnicas, moto e BTR-70 dirigidos pelo jogador, troca de veículo (H), requisição (U), rádio sem veículo de rádio, o drone "Drone improvisado".
- Capturar uma técnica insurgente com um russo online (`cs`).
- O general insurgente sem aviação na economia (ponte aérea e evacuação negadas por `ecoUse`).
- O balanço do M1A1 e do M109A7 em jogo; a tela de toque e o celular.
- Visto no hangar: a técnica com Type 63 (107 mm) aparece como blocos sem rodas no cartão (modelo de artilharia genérico): caso para quem cuida dos modelos.
