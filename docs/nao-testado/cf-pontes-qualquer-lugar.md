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

## O que NÃO foi testado (nada além do smoke)
- Construir, terminar, rotear pelo vão, destruir e construir de novo.
- Sincronização online (linha `fort` tipo 10), incluindo quem entra depois.
- Escolha da IA (`MANG.nbr`), a manobra (`OPS.nbr`, `brSiteTick` com tipo 10) e as recusas (`cost`, `pcap`, `pont`, `site`).
- Desenho 3D (tabuleiro de pedra com parapeitos e pilares) e o traço contínuo no mapa 2D.
- MCP `build_bridge`.
- Os testes antigos que esperam que o tipo 10 seja inválido (`forts-relay`, `sappers-relay`) e o `FORT.K.length` em `tests/posts.js` vão precisar de ajuste.
- Só rodou: sintaxe da página, do servidor e do MCP; 40 s de uma partida IA × IA sem NaN; o servidor sobe.

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
