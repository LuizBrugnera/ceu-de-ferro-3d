# Controle do avião: W/S arfam, motor só em Shift/Z (não testado)

## O que mudou
- Com a mira no mouse (padrão), W/S deixaram de ser acelerador: agora sobem/descem o bico (S levanta o nariz, W abaixa; com "inverter" é o contrário), como no manche clássico. Segurada, a tecla toma o eixo de arfagem do mouse (igual A/D e Q/E já faziam).
- O motor é só Shift (acelera) e Z (desacelera), nos dois esquemas. No clássico W/S já só arfavam.
- Ajuda do hangar (legenda do avião) e README atualizados. Helicóptero, online e IA não mudaram.

## O que NÃO foi testado
Tudo. Só foi conferido por leitura (`fly()` em `Céu de Ferro 3D.html`). Teste de fumaça só de carregar a página.

## Riscos
- Em arfagem com mouse, a tecla sobrescreve `c.pitch` cru depois do instrutor: pode dar solavanco ao soltar (o instrutor volta a mandar na hora seguinte).
- O sentido (W = nariz para baixo) segue o clássico; conferir com `inverter` ligado.
- Shift e Z a pé não mudaram; no avião os dois só mexem no motor.
- Botões de toque (+/−) continuam como estavam.

## Como testar depois
1. Hangar → caça, "Mira com mouse": segure W e S e veja o nariz descer/subir; confira que o motor não muda ao apertar W/S.
2. Shift/Z mudam o motor (barra de potência); em bombardeiro e ataque também.
3. Clássico e com "inverter" ligado: sentido de W/S.
4. Conferir a legenda "Controles" do avião.
