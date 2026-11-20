# Ponte nova em qualquer ponto do rio (cf-pontes-qualquer-lugar)

Pedido do capitão: "a ponte pode ser feita em qualquer lugar tambem".

## O que mudou
- Obra tipo 10, "Ponte nova" (`FORT.nbr`). Usa os mesmos trechos do pontão fora das pontes (`brSite`): até 280 m de água, margens baixas, a 300 m ou mais de uma ponte, com estrada ao alcance.
- Leva 12 min com um construtor e menos de 5 min com até 4 construtores. Custa 20 de energia e 100 de metal com a economia ligada.
- É mais resistente que o pontão (`OBJ.nbridge`: 1500 de vida, tiro de fuzil não faz nada).
- Pronta, o vão entra na rede de estradas com custo de estrada (o pontão é mais lento). Destruída, fecha o rio e pode ser construída de novo no mesmo trecho.
- Conta no limite de 3 por lado junto com os pontões fora das pontes, e só cabe uma obra por trecho.
- Jogador: sapador, N até PONTE NOVA. General e modelo: `man` `bridge`, e no MCP a ferramenta `build_bridge`.
- A IA usa a manobra `nbr` (pontuação 0,7) quando o inimigo segura a cabeceira de uma ponte caída do seu eixo e ela tem como pagar.
- Servidor: `FKINDS` 10 e `bnb: 1` no welcome.

## Testado em bbd5085: ok (tarefa cf-testar-mundo)

Seções novas em `tests/bridges-build.js`, `bridges-online.js`, `bridges-relay.js` e `mcp-general.js` (https://github.com/LuizBrugnera/ceu-de-ferro-3d/pull/113):
- Construir: só num trecho (`brSite`), não na cabeceira de uma ponte caída. Um sapador leva 720 s e quatro, 288 s. Só uma obra por trecho (`pont` para pontão e para outra ponte).
- Terminar e rotear: pronta, o vão custa 1 (estrada; o pontão custa 1,6). Com todas as pontes caídas, `tripOf` de base a base passa por ela.
- Destruir e refazer: 1500 de vida e o fuzil não faz nada. `hitObj` fecha o rio e mata quem estava em cima; um `fortStart(10)` novo no mesmo trecho funciona.
- Limite: pontões e pontes novas contam juntos no limite de 3 por lado (`pcap`). Custo: recusa `cost` com 99 de metal e cobra 20 de energia e 100 de metal.
- General: `man bridge` abre a op `nbr`, a esquadra constrói, `brg` lista a ponte (própria, aberta), e uma segunda no mesmo trecho é recusada (`pont`). `MANG.nbr` vira candidata (0,7) quando o inimigo segura as cabeceiras das pontes caídas, e não vira com elas livres.
- Online, pelo servidor de verdade: `bnb: 1`; o pedido do convidado (`fbuild` k 10) faz o anfitrião começar a ponte, que todos têm sob o mesmo id; pronta, ela carrega como estrada em todos; quem entra depois a recebe; destruída, some em todos. Nos relays, `fort`/`fbuild` k 10 passam, k 11 é recusado e `gcmd man bridge` chega.
- MCP `build_bridge` vira `man {k: bridge, x, z}`. `forts-relay`, `sappers-relay` e `posts` ajustados para o tipo 10.

## O que NÃO foi testado

- O desenho 3D (tabuleiro de pedra, parapeitos, pilares) e o traço contínuo no mapa 2D, no navegador.
- A IA escolhendo `nbr` numa partida longa por conta própria (só a candidata, com uma esquadra livre posta no lugar).

## Riscos
- Uma ponte nova e um pontão disputam o mesmo trecho: só cabe um.
- A IA pode gastar 100 de metal numa ponte que o inimigo derruba logo.
- O custo de estrada no vão pode puxar muito tráfego para o trecho novo.

## Como testar depois
- Num sandbox (`H.load({ mapv: 5 })`, `sandbox('ww2')`): pegue `s = brSites()[k]`.
  - `fortWhy(10, 0, s.ends[0].x, s.ends[0].z, 0) === ''`, depois `fortStart(10, ...)`.
  - Com sapadores ao lado, a obra completa em cerca de 720 s com um construtor.
  - `S.bre[S.pe[0].E] === 1` e `tripOf` de base a base passa pelo vão com todas as pontes caídas.
  - `hitObj(f.o, 1e4)` fecha o rio; um `fortStart(10, ...)` novo no mesmo trecho funciona.
- General: `genCmd(0, { c: 'man', k: 'bridge', x: s.x, z: s.z }, 'sys')` abre a op `nbr`; acompanhar até a ponte ficar pronta.
- Online: copiar a seção do pontão livre de `tests/bridges-online.js` com `k: 10`.
- Relays: `fbuild k 10` passa e `k 11` é recusado; ajustar `forts-relay`, `sappers-relay` e `posts`.
