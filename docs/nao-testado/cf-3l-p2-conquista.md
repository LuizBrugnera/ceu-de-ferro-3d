# cf-3l-p2-conquista: conquista com N lados (P2 do plano de 3 lados)

## O que mudou (`Céu de Ferro 3D.html`)
- **Captura por dono + progresso.** Cada ponto tem `hold` (dono ou −1), `cap` (quem está tomando um ponto neutro ou −1), `c` (progresso de 0 a 1) e `w[N]`. O lado com mais peso (L) avança pela margem sobre o segundo maior peso. Ponto de outro dono: `c` desce até 0 e fica neutro, com `cap = L`; ponto neutro: `c` sobe até 1 e o ponto vira de `cap`; se outro lado passa a liderar, `c` desce primeiro e só então `cap` troca. Vazio: volta ao dono se ligado à base (`idle`) ou fica neutro (`cut`). Com 2 lados equivale à barra com sinal de antes (`c_antigo = lado ? c : -c`).
- **Perda de tíquetes pelo líder:** cada lado vivo perde `CQ.bleed[min(atraso, 4)]` por minuto, em que o atraso é a diferença de pontos para o lado vivo com mais pontos. Com 2 lados, é a regra de antes.
- **Eliminação** (`cqOust`): um lado sem tíquetes, ou cuja base principal foi tomada, sai. Os pontos dele ficam neutros, o diretor dele para (`cqFree` falso), `S.cmd[t].out = 1` e o jogador desse lado não volta mais (fica olhando). A partida segue até sobrar um lado (D2a).
- **Colocação** (`cqRank`): primeiro os lados vivos, por pontos e depois por tíquetes; depois os eliminados, do último a sair para o primeiro. `Q.place` guarda a colocação; só o 1º vê "Vitória", e os outros veem "Derrota · 2º lugar" etc. A tela final lista 1º, 2º e 3º.
- **Mensagem `cq` v2** (só com 3 lados; com 2 lados continua a v1): `v: 2`; cada ponto é `[hold, c*100, cap, w0*10 … w(N-1)*10]`; `k` com N tíquetes; `l` com 3·N perdas; `r = [vencedor, motivo, [colocação]]`, como o P5 (`cqv2`/`cqr` em `server.js`) já aceita. O servidor não repassa uma lista de eliminados, então o convidado deduz a eliminação: tíquetes ≤ 0 ou base principal tomada.
- **HUD:** faixa de pontos (com 3 lados: os meus por distância à minha base, depois os outros), tíquetes de cada inimigo na cor dele (✕ quando eliminado), marquinhas de presença por lado, barra de captura na cor de quem segura ou toma, marcas no mapa. Cores por facção para inimigos com 3 lados (`FOEC`/`foeCol`: EUA violeta-azulado, Rússia vermelho, Insurgentes ocre); com 2 lados fica o `FOE` de sempre. A Visão de General (`gCol`, pontos) usa as mesmas cores e o `cap`.
- Ajudantes: o P0 (`SIDES()`/`S.N`) ainda não estava no main; usei os do P3, que já estão lá: `sdsOf()` e `NSD()`.
- Pequenos ajustes fora do trecho, porque o significado de `p.c` mudou: `thbSense` (ponto "sendo tomado" = `c` descendo), `genVM`/visão para o MCP (`cap`, `w` com N), gráfico de tíquetes `S.gtk` com N colunas, bônus do rádio vai para o lado de quem matou (`o.lastBy`), `Net.adopt` com N; no MCP (`mcp-general.js`), cada ponto ganha `taker` (quem está tomando), e `capture` passa a ser o progresso de 0 a 1.

## NÃO testado
Nada foi rodado: nenhuma suíte, nenhuma partida, nenhum navegador (regra do capitão). Só a sintaxe do script foi conferida com `new Function`.

## Riscos
- Quando o P0 entrar, se ele definir `SIDES()`, troque `sdsOf()` por `SIDES()` (dá o mesmo resultado). No main, `SIDES = [-1, 1]` ainda é uma constante do HUD.
- Com 3 lados e sem o P1, nenhum ponto é base do lado 2 (`cqTied(2)` vazio); com o P1 isso se resolve.
- Leitores antigos de `p.c` com sinal que eu não achei (o grep pegou `thbSense` e a Visão de General). Testes que conferem `c` negativo vão falhar (`tests/` com o lado 0 em `c = -1`).
- `ANA` (P9, já no main) recalcula a perda de tíquetes por conta própria: conferir se bate com a regra do líder.
- O jogador eliminado fica morto esperando, sem câmera de espectador própria.
- Equivalência com 2 lados: o arredondamento ao cruzar 0 (o excesso passa para o outro lado) é o mesmo de antes, mas não foi medido.

## Como testar depois
1. `node server.js`, abrir a página, partida solo na Frente atual com 2 lados: tomar um ponto, perder um ponto, ver a barra, a faixa, o fim por tíquetes, por tempo e por base. Deve ser igual a antes.
2. `npm test` (ou os testes de simulação de conquista em `tests/`) com N = 2: ajustar os que leem `c` com sinal.
3. Com P0 + P1 + P4 no main: partida solo com 3 lados. Conferir: faixa com 3 cores, tíquetes dos dois inimigos, um ponto disputado por 3 lados (o maior peso leva, pela margem sobre o segundo), eliminação por tíquetes (pontos do eliminado ficam neutros, aviso "foi eliminado"), eliminação por base, fim com o último de pé, tela final com 1º/2º/3º.
4. Online com 3 lados (o P5 já está no main): o convidado vê os mesmos pontos, tíquetes e eliminações do anfitrião (`cq` v2), e o resultado com a colocação.
5. `tools/balance.js` (P9) para conferir que a perda pelo líder não desequilibra.
