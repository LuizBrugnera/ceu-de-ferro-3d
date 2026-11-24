# cf-pol2-fase2: combate e menus (P2 P3 P4 P5 P6 P22 P23) — o que não foi testado

## P3 — teclas de postura (X agacha, Z deita, Shift levanta)

Testado: `tests/postura.js` (as teclas pelo `walk`, o botão do controle segurado deita, o Shift na luneta prende o fôlego e não levanta, o olho da câmera suavizado no código) e no navegador (Chromium sem janela, GPU real): X agacha, Shift levanta, Z deita, Z de novo levanta.

Falta:
- Controle de verdade: o botão B (1) do perfil padrão agora agacha e, segurado 0,5 s, deita. Um perfil salvo com `thrDown` num botão continua deitando por ele. Sem controle físico aqui.
- Sensação da câmera descendo e subindo (pointer lock real e quadros por segundo de jogo normal): no navegador de teste o jogo roda a ~20 quadros por segundo.
- Um toque mais curto que um quadro do jogo se perde (a tecla desce e sobe antes do passo ler a entrada). Já era assim com o Z; a 20 quadros por segundo um toque de 200 ms às vezes se perdeu no teste.
