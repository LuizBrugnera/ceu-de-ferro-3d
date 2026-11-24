# cf-pol2-obras: o que não tem teste automático

Itens P13, P15, P16, P17 e P18 do quadro de polimento (fase 3a, obras). A parte da simulação tem teste em `tests/obras-barra.js`; o que é tela e teclado foi conferido só no navegador.

## P13 · barra numerada de obras (D2 = A)

- **Teclas no navegador:** o ouvinte de `keydown` em captura (1 a 7 e Shift+N com o modo obras aberto) fica na parte da página que o harness não carrega. Conferido no Chromium sem janela (1280×800 e 1920×1080): N, N, 3, 4, 7, 3 e Shift+N levaram a base, trincheira, sacos, posto AT, antena (página 2), terrapleno e muro de sacos.
- **A 7 em vez do sinalizador e a 6 em vez da visão noturna:** com o modo obras aberto, as teclas 1 a 7 são da barra. Fora dele, continuam como antes. Não testei com a visão noturna ligada.
- **Desenho da barra:** as abas são desenhadas uma vez num canvas próprio e redesenhadas só quando o texto muda. Não testei com `devicePixelRatio` 2.
- **Celular:** a barra não tem toque (D5 = C, não mexer no celular).

## P15 e P16 · girar a obra e o contorno no chão

- **Teclas `[` `]` e roda do mouse:** ouvintes em captura, só com o modo obras aberto e a pé. Antes do zoom da roda, que fica parado enquanto o modo está aberto. Conferido no navegador: `]` duas vezes girou a base em +30°, e o giro passou para a trincheira depois do N. A roda não foi testada no navegador sem janela, só as teclas.
- **O contorno no chão (`footSet`):** malha de 8 × 8 que segue o relevo, faixa baixa na borda e quatro postes finos (no máximo 2,5 m). Conferido a 1280 e 1920, com base, trincheira girada, sacos, posto AT e pontão junto de uma ponte. O pontão ficou deitado ao longo da ponte, não mais numa caixa de 80 m na mira.
- **Canto na água em vermelho:** não vi no navegador, porque não pus um canto na água.
- **Pontão num trecho estreito do rio, longe das pontes:** coberto só pelo teste (`obrSpan` igual ao lugar onde `fortAdd` deita o pontão). No navegador, só junto de uma ponte.
- **Convidado online:** o ângulo girado vai no `fbuild`/`build` que já existia (`a`). Não testado numa partida com convidado.

## P17 · obra parada e desmontar

- **O aviso OBRA PARADA e a barra DESMONTANDO:** desenhados no HUD do soldado, fora do harness. Conferido no navegador a 1280: uma trincheira deixada a 12 m disse "chegue a até 8 m dela" e quando começa a se desfazer; segurar V 3 s junto dela a desmontou. O caso "sob fogo: espere N s" só no teste.
- **Rede de camuflagem por cima de outra obra:** a rede (P31) fica sobre a obra, e as duas têm a pegada no mesmo lugar. Segurar V ali desmonta a que vier primeiro na lista das obras, não necessariamente a de baixo. Não testado no navegador.
- **Convidado online:** coberto por `tests/obras-online.js` (servidor de verdade, sem navegador). Um servidor antigo, sem `fnd`, faz o convidado ver "O servidor desta sala é antigo" em vez de desmontar; isso não foi visto numa sala real.

## P18 · prévia no Fortificar do general

- **O contorno sob o cursor e `[` `]`:** desenhados no mapa do general (`gorFortGhost`), fora do harness. Conferido no navegador a 1280: verde onde pode, vermelho com o motivo onde não, e `]` girou 15°. Não conferido a 1920.
- **Campos minados, posição antiaérea e anéis dos engenheiros:** não têm pegada própria, então não mostram contorno; só o texto de sempre.
