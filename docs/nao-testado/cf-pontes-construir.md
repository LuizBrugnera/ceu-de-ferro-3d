# Pontes: reconstruir e pontão fora das pontes (cf-pontes-construir)

## O que mudou
- **Reconstruir ponte caída** (obra tipo 9, "Ponte"; o tipo 8 ficou com a antena de rádio do main): na cabeceira, por sapadores ou qualquer soldado. 5 min com um construtor, 2 min no mínimo (até 4). Custa 40 de metal com a economia ligada, de graça sem ela. Pronta, a ponte volta inteira, a estrada volta a passar e o pontão dela é recolhido. Online: `obj` com estágio 0 e `fort` tipo 9 (servidor diz `brb: 1`; `FKINDS` 9).
- **Pontão em outro ponto do rio**: trecho com até 280 m de água, margens baixas, a 300 m ou mais de uma ponte e com estrada ao alcance das duas margens. Abre uma travessia nova na rede de estradas (vão + ligações), que as rotas usam. Destruído, fecha de novo. Até 3 por lado.
- **Construtor inteiro**: no pontão e na reconstrução, um soldado conta inteiro (e não meio) se a esquadra dele tem um sapador vivo ou se há um caminhão do lado a até 80 m da obra.
- **General não trava** (`brUrgent`): a cada 15 s, para cada ponte caída que corta um eixo seu ou segura viaturas suas, o general da IA age já (acima do limite e da espera das manobras). Reconstrói se a cabeceira dele está livre de inimigo a 250 m e há metal; senão lança pontão na ponte; senão no trecho estreito mais perto. Viaturas paradas na margem procuram outro caminho a cada 8 s (antes 20 s).
- General/MCP: manobra `rebuild` (`rebuild_bridge`), `cross`/`lay_pontoon` aceita um ponto do rio, `brg` traz reconstruções, pontões fora das pontes e trechos.

## Testado antes da regra nova
Commits até `20b840d` passaram: `tests/bridges.js`, `tests/bridges-build.js`, `tests/bridges-online.js`, `tests/bridges-relay.js`, `tests/mcp-general.js`, `forts`, `sappers`, `posts` e os relays (custo de 120, tempo de 10 min, sem `brUrgent`).

## Testado em bbd5085: ok (tarefa cf-testar-mundo)

- Custo 40 de metal / 300 s: `tests/bridges-build.js` com os textos e valores de agora (https://github.com/LuizBrugnera/ceu-de-ferro-3d/pull/113).
- Construtor inteiro (`brWhole`): um fuzileiro sozinho conta 0,5 (400 s); com um caminhão do lado a até 80 m, ou um sapador vivo na esquadra, conta inteiro (300 s); o caminhão além de 80 m ou o sapador morto, meio de novo (seção nova em `bridges-build.js`).
- `brUrgent`: regressão nova em `bridges-build.js`. Ponte do eixo caída e cabeceira livre: o general abre a reconstrução na hora, acima do limite de manobras, e o diário diz "o general age já". As viaturas paradas procuram caminho na hora, e não abre uma segunda operação 15 s depois. Com o inimigo na cabeceira: pontão num outro trecho do rio.
- Partida IA × IA (semente 11, 1944, ponte do eixo do lado 0 derrubada aos 60 s): op `tra` aberta no mesmo segundo; o pontão abriu ~9 min depois (a esquadra veio de 2,6 km) e o general reconstruiu a ponte em seguida. Sem NaN.
- `BR.hold` 8 s: a viatura parada na margem procura caminho a cada ~8 s (`tests/bridges.js`).
- `bridges`, `bridges-build`, `bridges-online`, `bridges-relay`, `mcp-general`, `forts-relay`, `sappers-relay`, `posts` passam.
- Bug achado e corrigido: a carona do planejador (`fetch`) tirava da manobra a esquadra que a manobra tinha pegado no meio do caminho (pontão abandonado). Corrigido em https://github.com/LuizBrugnera/ceu-de-ferro-3d/pull/113, com regressão em `tests/trucks-base.js`.

## O que NÃO foi testado

- No navegador: sapador, N até PONTE numa cabeceira caída e N até PONTÃO num trecho estreito; o desenho 3D e o tracejado no mapa 2D.
- O assalto do lado 0 chegando ao objetivo depois da travessia, numa partida inteira.

## Riscos
- `brUrgent` passa por cima do limite de manobras: pode puxar esquadras de outras tarefas, ou repetir pontões quando a cabeceira está quente (até o limite de 3).
- Reconstruir sob fogo: só olha a cabeceira do próprio lado. O inimigo pode usar a ponte refeita.
- Testes velhos que esperam 600 s / 120 de metal podem falhar só por texto ou tolerância.

## Como testar depois
- `node tests/bridges-build.js` (ajustar os textos de 10/4 min para 5/2 min).
- `node tests/bridges.js`, `PORT_T=8120 node tests/bridges-online.js`, `PORT_T=8121 node tests/bridges-relay.js`, `node tests/mcp-general.js`.
- Regressão do general: `H.load({ mapv: 5, seed: 11 })`, `watch('ww2')`, rodar 60 s, derrubar a ponte do eixo em que o lado 0 ataca (`hitObj(b.o, 1e5)`). Em 15 s deve haver uma op `reb` ou `tra` no `C.ops` e a mensagem "o general age já" no diário. Em até ~8 min a ponte deve estar de pé ou um pontão aberto (`brOpen` ou `S.pg`), e um assalto do lado 0 deve chegar ao objetivo.
- Construtor inteiro: soldado comum ao lado de um caminhão do lado constrói a 1/300 por segundo (e não a metade disso).
- No navegador: sapador, N até PONTE numa cabeceira caída; N até PONTÃO na margem de um trecho estreito. Conferir o desenho 3D e o mapa 2D (tracejado).
