# Controle do avião: W/S arfam, motor só em Shift/Z (testado sem tela)

Testado (cf-pol-testes-a, `fly()` + `stepPlane()` sem tela, como `tests/flight-aim.js`, f22, a10 e spit a 60% da velocidade máxima, 1,5 s com a tecla): com a mira no mouse, W leva o bico 22-40° para baixo e S 11-30° para cima, `ctl.pitch` -1 e +1 enquanto a tecla está segura, e o motor não muda (0,000); com "inverter" o sentido troca; no clássico W/S arfam do mesmo jeito; Shift sobe o motor (+0,4 em 1 s, de 0,6 ao máximo) e Z baixa (-0,6) nos dois esquemas. O mapa de teclas (`KEYS`: W/↑ `up`, S/↓ `down`, Shift `thrUp`, Z `thrDown`) e a legenda do hangar (`LEGEND.plane`: "S levanta o nariz, W o abaixa", com "inverter" o contrário; "Shift / Z: Mais e menos motor") foram conferidos no código.

## O que falta (o navegador não rodou: máquina dividida, uma coisa pesada por vez para todos)

- No navegador: hangar, caça com "Mira com mouse", W/S e Shift/Z de verdade (teclado e barra de potência) e a legenda "Controles" na tela.
- O bombardeiro (só caça, ataque e o spit rodaram) e a sensação ao soltar a tecla na arfagem com mouse (o instrutor volta a mandar na hora seguinte: pode dar solavanco). Como: no jogo, bombardeiro com mira no mouse, segurar e soltar W/S em voo nivelado.
