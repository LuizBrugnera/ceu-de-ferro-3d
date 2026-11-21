# cf-construir-mais: generais e unidades constroem mais, toda obra custa (testado em parte)

O bloco `BMR` de `Céu de Ferro 3D.html` (limites que crescem com os pontos e a economia, toda obra paga, orçamento de obras da IA `bmrPay`, livro de obras `d.wl`/`wt`/`wn`, bases atrás dos pontos, AFP mais agressivo, `bmrKitSup`, a linha "Obras" e o HUD "GENERAL · SUPRIMENTOS"), mais `server.js` (`wk`) e `mcp-general.js` (`economy.construction`).

Testado (cf-pol-testes-a, exercício sem tela, moderna, mapa v11, semente 5, economia ligada, 150 s): `supCap` dá 3 + pontos/2 + níveis, no máximo 8, nas 9 combinações de 0/2/6 pontos e 0/3/6 instalações; um lugar livre para base de suprimento responde `cost` com 10/10 no estoque, e `fort mineat` também; `bmrPay` verdadeiro sem gasto e falso com 2000 de metal de obras no minuto; com o minuto estourado o plano diz "aguarda o orçamento de obras (60% da renda por minuto)"; o lado sem dinheiro não começa nenhuma obra paga em 150 s, e o outro lança no livro (`wn` sup 1, field 14, post 2); `ecsOf(t).wk` tem 9 números, `ecoView(t).works` e `bmrLine` respondem. O risco "limites logo no começo" é real: aos 5 s o lado já segura 4 pontos e está no nível 1 (as 3 instalações iniciais), `supCap` 6 e fator 1,75.

## O que falta (não rodou: máquina dividida, uma partida longa por vez para todos)

- Medição antes/depois de 15 min (quanto mais se constrói) e as suítes `bases`, `forts`, `posts`, `aid`, `sappers`, `production`, `eco`, `eco-war`, `logistics`, `w13`, `orders`, `relay`, `bases-online`, `forts-online`.
- Não visto numa partida: a base atrás de um ponto tomado (`bmrSupTries`), a esquadra que usa o kit (`bmrKitSup`), ninho e posto nos pontos e bases, o campo minado na entrada avançada, a esquadra que cava 40 s depois de parar, a engenharia que ergue posto em emboscada ou guarda, os comboios extras.
- Online: o convidado recebendo `wk`, o servidor antigo descartando, o `get_state` do MCP com `construction`.
- O custo por quadro de `afpPlaces`, `bmrKitSup` e `bmrView`.
- Na tela: o bloco "GENERAL · SUPRIMENTOS" do HUD de jogador nos dois lados e a recusa "Seu lado não tem a energia e o metal desta obra" com N (a linha de obras da Visão de General só foi vista na fumaça da entrega).

## Como testar

1. As suítes acima (`SECS=240` no `aid`).
2. IA × IA por época, mapa v6, `eco: true`, 15 min, 3 sementes, contra a página de `main` (`H.load({ seed, mapv: 6, eco: true, page })`): por lado, os ids novos de `S.forts` sem `pre` por `k`, `S.sup`, `S.mines`, `S.eco.d[t].wn`/`wt` e o estoque no fim.
3. Cenários que faltam (`tests/bmr.js`): esquadra `eng` com kit parada num ponto tomado (o kit diminui e a base sai); esquadra com `move` cumprido há 40 s cava a trincheira e depois o parapeito.
4. Online com o servidor novo: o convidado vê a linha de obras e o HUD com caixas; MCP `get_state` mostra `economy.construction` e `ask_view` mostra `economy.works`.
