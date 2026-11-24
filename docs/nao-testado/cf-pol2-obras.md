# cf-pol2-obras: o que não tem teste automático

Itens P13, P15, P16, P17 e P18 do quadro de polimento (fase 3a, obras). A parte da simulação tem teste em `tests/obras-barra.js`; o que é tela e teclado foi conferido só no navegador.

## P13 · barra numerada de obras (D2 = A)

- **Teclas no navegador:** o ouvinte de `keydown` em captura (1 a 7 e Shift+N com o modo obras aberto) fica na parte da página que o harness não carrega. Conferido no Chromium sem janela (1280×800 e 1920×1080): N, N, 3, 4, 7, 3 e Shift+N levaram a base, trincheira, sacos, posto AT, antena (página 2), terrapleno e muro de sacos.
- **A 7 em vez do sinalizador e a 6 em vez da visão noturna:** com o modo obras aberto, as teclas 1 a 7 são da barra. Fora dele, continuam como antes. Não testei com a visão noturna ligada.
- **Desenho da barra:** as abas são desenhadas uma vez num canvas próprio e redesenhadas só quando o texto muda. Não testei com `devicePixelRatio` 2.
- **Celular:** a barra não tem toque (D5 = C, não mexer no celular).
