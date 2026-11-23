# cf-mouse-padrao: mouse como controle padrão

**O que mudou:** `ctrl` começa em `'mouse'` (antes `'classic'`); só uma escolha salva `'classic'` no localStorage (`ceu-de-ferro-3d-controle`) volta ao clássico; a aba "Mira com mouse" vem selecionada no HTML do hangar; README atualizado.

## Testado em 8624d47 (cf-pol-testes-b, 2026-11-21): ok
- Navegador (Chrome headless, servidor em 127.0.0.1), perfil sem escolha salva: `ctrl` é `'mouse'` e `mouseAim()` é verdadeiro. A partida nasce com `S.mouse` e `S.pref`.
- **Helicóptero seguindo o mouse** (AH-64D, Hoje): com a mira do mouse (`S.aim.h`) 1 rad ao lado do nariz, o rumo vira 0,86 rad em 1 s e alinha em 2 s (`flyHeli`; `c.hold` desligado).
- **Jato seguindo o mouse** (F-22): com a mira 0,8 rad ao lado, o rumo vira 0,30, 0,59, 0,74 e 0,77 rad em 1 a 4 s, subindo de 595 para 695 m.
- Já testado em 1cedd86: a escolha Clássico grava `classic` e continua depois de recarregar; `tests/flight-aim.js` passa.

## Continua sem teste
- Tela de toque (`coarse`): `mouseAim()` segue falso, como antes.
- O movimento físico do mouse com o ponteiro preso (o teste mexeu na mira por `S.aim`, não por eventos de mouse).
