# cf-pol-armas: a explosão perto ensurdece; o canhão antiaéreo e os flares ouvidos (testado por suíte e no navegador, não de ouvido)

## O que mudou

- **Surdez:** uma explosão perto do jogador (`blastFx` avisa `fx.boom` que é uma explosão; a boca de uma arma não avisa) ensurdece por um momento (`sndDeaf`, `SND.deaf`). O som do mundo cai num passa-baixa, a 650 Hz na força toda, e reabre em até 2,6 s. Por cima, um zumbido de 3700 Hz na cabeça (depois do filtro) some junto.
  - A força cresce quanto mais perto, dentro de 1,6 raio da explosão, e quanto maior ela for (até 30 m de raio, com mínimo de 0,35).
  - Dentro de um veículo blindado, vale 0,4 disso.
  - Explosão de menos de 5 m de raio não ensurdece.
  - Uma mais forte no meio da surdez ensurdece de novo.
  - O tiro do próprio jogador (tanque, artilharia, morteiro) nunca o ensurdece: é a boca, não uma explosão.
- **Canhão antiaéreo:** o tiro dele não tinha som, só a explosão no ar. Agora tem a voz de canhão.
- **Flares:** soltar flares não tinha som. Agora tem o chiado dos cartuchos.

O som passa por um filtro novo, `A.ear`, entre o volume geral e o compressor. Aberto em 20 kHz, ele não muda nada.

## Testado

- `tests/som.js`, a parte "a burst close by deafens":
  - um projétil explodindo a 8 m do soldado: o passa-baixa a 1367 Hz, reabrindo, e o zumbido depois do filtro;
  - o mesmo estrondo vindo da boca de uma arma não ensurdece;
  - a 300 m, nada; uma pequena, nada; dentro do tanque, menos (8281 Hz);
  - o canhão antiaéreo e os flares chamam o som;
  - `blastFx` avisa que é uma explosão.
- Navegador: veja o PR.

## Não testado

- De ouvido: quanto a surdez incomoda numa barragem de artilharia, e se o zumbido é alto demais.
- O antiaéreo e os flares dentro de uma batalha (só pelas suítes).

## Como testar

`npm start`, entrar a pé e jogar uma granada perto, ou ficar perto de onde a artilharia cai: o som abafa e volta, com o zumbido. Atirar com o tanque: nada de surdez. Entrar de antiaérea pesada e atirar. Entrar de avião e soltar flares (tecla de flare).
