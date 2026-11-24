# cf-pol2-fase2: combate e menus (P2 P3 P4 P5 P6 P22 P23) — o que não foi testado

## P3 — teclas de postura (X agacha, Z deita, Shift levanta)

Testado: `tests/postura.js` (as teclas pelo `walk`, o botão do controle segurado deita, o Shift na luneta prende o fôlego e não levanta, o olho da câmera suavizado no código) e no navegador (Chromium sem janela, GPU real): X agacha, Shift levanta, Z deita, Z de novo levanta.

Falta:
- Controle de verdade: o botão B (1) do perfil padrão agora agacha e, segurado 0,5 s, deita. Um perfil salvo com `thrDown` num botão continua deitando por ele. Sem controle físico aqui.
- Sensação da câmera descendo e subindo (pointer lock real e quadros por segundo de jogo normal): no navegador de teste o jogo roda a ~20 quadros por segundo.
- Um toque mais curto que um quadro do jogo se perde (a tecla desce e sobe antes do passo ler a entrada). Já era assim com o Z; a 20 quadros por segundo um toque de 200 ms às vezes se perdeu no teste.

## P4 — mirar a pé em primeira pessoa (D1)

Testado: `tests/mira-1p.js` (a regra `adsCam`: o botão direito leva à 1ª pessoa e soltar volta; a 1ª pessoa do C fica; a luneta igual; morto, a bordo e morteiro não; a troca vem antes de o quadro ler o assento) e no navegador (Chromium sem janela, GPU real): na 3ª pessoa o botão direito mostra a alça da arma em 1ª pessoa, e soltar volta à 3ª pessoa.

Falta:
- Sensação com o mouse de verdade (pointer lock real): a troca de câmera ao apertar e soltar rápido, várias vezes seguidas.
- Controle físico: o gatilho de mirar do perfil passa pela mesma `ctl.ads`, sem teste com controle aqui.
- Online: a câmera é só local; não testado numa partida em rede.

## P5 — recuo e dispersão

Testado: `tests/recuo.js` (numa rajada de 10 a dispersão abre de 6,0 para 11,0 mrad e volta em 1,5 s; a mira sobe 2,5° em pé e 1,0° deitado e mirando; a supressão multiplica por 2,4; a cruz e o tiro usam `manSpread`) e no navegador (Chromium sem janela, GPU real): a mira sobe na rajada (3,3° em 0,7 s) e a abertura `a.bl` chega a 0,86.

Falta:
- Sensação com o mouse de verdade (pointer lock real): quanto o jogador precisa puxar para baixo numa rajada longa. Os números ficam em `MAN.climb` e `MAN.bloom`.
- Equilíbrio: a abertura vale para todo soldado, inclusive os da IA (as rajadas longas da IA ficam menos precisas). O tempo para abater não foi medido em partidas IA × IA.
- Online: a subida da mira é só do jogador local; a abertura é calculada por quem simula o soldado (o anfitrião). Não testado numa partida em rede.
