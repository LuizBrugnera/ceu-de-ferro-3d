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

## P6 — granada com arco, cozinhar e gesto

Testado: `tests/granada.js` (toque de F lança com o pavio inteiro; F segurado cozinha, mostra a granada na mão e o pavio que resta, e lança ao soltar com o pavio menos o tempo segurado; o arco desenhado cai a menos de 1 m de onde a granada toca o chão; no fim do pavio, menos `MAN.nade.safe`, ela sai sozinha uma vez; G segura e lança a fumaça; o braço direito do boneco vai pela IK a `NTH.hand`) e no navegador (Chromium sem janela, GPU real): F segurado mostra o arco, o anel onde cai e "GRANADA COZINHANDO · 2,1 s · SOLTE F PARA LANÇAR"; o braço direito sobe por trás do ombro; soltar lança.

Falta:
- O movimento do braço ao soltar (0,4 s, do alto para a frente) só foi visto parado em quadros; a sensação do gesto não foi avaliada.
- Online: o gesto do jogador remoto não foi testado. `m.nk` (segurando) é só local, então os outros não veem o braço erguido enquanto ele segura; o cozinhar vai no lançamento (`P.nCook`, como o da IA já ia).
- Controle físico: o botão de granada do perfil segurado; sem controle aqui.
- O arco ignora prédios e árvores (para no chão), como a granada antes de quicar.
