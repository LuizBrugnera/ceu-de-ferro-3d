# cf-folego: fôlego infinito (não testado)

Pedido do capitão: "o fôlego dos soldados deve ser infinito".

## O que mudou (`Céu de Ferro 3D.html`)
- Corrida (sprint): `m.stam` fica sempre 1 e `m.wind` sempre falso (jogador e IA); a corrida não cansa nem trava.
- Fôlego preso do atirador (Shift na luneta): não gasta (`W.br` fixo), não existe mais "sem fôlego" nem tremedeira de castigo; segura enquanto a tecla estiver apertada (ainda solta se andar ou estiver dentro de veículo/prédio, como antes).
- HUD: removida a barra FÔLEGO e a barra do fôlego na luneta; ficou só o texto "FÔLEGO PRESO / SHIFT: PRENDER O FÔLEGO".
- Ajuda: textos das teclas Shift atualizados.
- Não existe nado nem escalada com fôlego no código; a respiração/balanço (#131) não depende de cansaço. Supressão/medo (m.mo, #145) intocados.
- Mecânica central afetada: prender o fôlego deixou de ser limitado no tempo (o equilíbrio do atirador muda); pedido aplicado mesmo assim.

## NÃO testado
Nada rodou além do carregamento da página.

## Riscos
- Atirador de elite IA com `c.hb` por tempo (`A.wT`) agora mira firme sempre que tiver a janela: pode ficar mais letal.
- Variáveis `k`/`out` na luneta ficaram sem uso (inofensivo). `MAN.stam/rest/wind` e `SNIPE.hold.t/rest/out` seguem definidos, só não gastam.

## Como testar depois
1. Abrir o jogo, soldado a pé, segurar Shift+W por 30 s: velocidade constante, HUD sem barra de fôlego.
2. Sniper com luneta: segurar Shift por 20 s: mira firme o tempo todo, sem "SEM FÔLEGO".
3. IA de infantaria em marcha longa: não para de correr (observar `m.wind` no console).
