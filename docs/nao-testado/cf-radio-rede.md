# cf-radio-rede: antenas de rádio e brechas na rede de comando (não testado)

## Testado em c397126 (cf-pol-testes-b, 2026-11-21): ok (parte)
- Navegador, Assistir em Hoje (3 lados): a IA do lado 0 ergueu sozinha uma antena aos 147 s ("Antena de rádio pronta junto a E · Vila das Oliveiras: a rede cobre 4,4 km em volta"). Na cena, o mastro treliçado com o rádio no pé; na Visão de General, a antena no mapa. Nenhum erro no console.
- Achado: na Visão de General, perto de um ponto com muitas esquadras e obras (Vila das Oliveiras), os rótulos das unidades se amontoam num nó ilegível.
- `tests/radio.js`: 55 ok e 3 falhas (2 de custo com a máquina cheia; a da mensagem da Visão de General acima do limite, consertada: veja `cf-radio-general.md`). `tests/comms.js`: as seções medidas passaram.
- **Continua sem teste:** o convidado de infantaria construindo a antena com N, o servidor antigo recusando, o anel de brecha e o botão Rádio vistos de perto.

Pedido do capitão: "muitas vezes o general fica com muitas areas do mapa sem rede, deve ser possivel construir radios e andar com carros ou tropas de radio tambem deve resolver esse problema e expandir a zona do radio".

## O que mudou

- **Antena de rádio** (obra de tipo 8, `FORT.rel`, bloco `CNR` em `Céu de Ferro 3D.html`, logo antes da seção de analytics). Soldado constrói com N (depois da cúpula); o general com Fortificar → antena de rádio (`fort` `k: radio`). Custo 30 energia / 40 metal com economia, 60 s, até 3 por lado, fora do limite de 6 obras de campanha (`FORT.ai.cap`). Pronta, vira nó da rede (`CN`, `k` 4) com alcance `CN.rel.r` = 0,2 da largura do mapa (2,8 km). Bloqueador a corta, radiogoniometria a localiza (`f.kn`), explosão a derruba (`OBJ.mast`), o inimigo que a vê a marca e a artilharia dele a mira (`fortTargets`, valor de rádio). Desenho: mastro treliçado em `postBoxes`.
- **Cobertura móvel**: veículo-rádio e operador já eram nós em movimento. Novo pedido de apoio **Rádio** (`req` `k: radio`, botão em Missões → Pedidos de apoio): manda o veículo-rádio livre da IA até o lugar pela rede de estradas (`tripTo`) e o segura 240 s ali (`u.cnG`, que `atLimit` respeita; a antena sobe quando ele para); sem veículo (ou com `ids`), uma esquadra com operador de rádio vai e segura. Recusa `nrad`.
- **Brechas** (`cnGaps`): esquadras fora da rede (não as bloqueadas) e lugares de ordem/missão fora de qualquer nó, agrupados. O general da IA (área Apoio, a cada 5 s, até 2 reforços a caminho) fecha a maior: antena no ponto mais recuado que ainda cobre a brecha, fora da camada de vigilância do mapa tático (`v` ≤ 0,35) e a mais de 900 m de inimigo conhecido (`cnSite`); sem construtor/limite/custo, manda o veículo-rádio ou operador. Devolve os construtores quando a antena fica pronta; desiste em 420 s.
- **Visão de General**: antena com ícone e rótulo ANTENA, anel âmbar "BRECHA NA REDE · N ESQ." com o reforço a caminho, contagem no painel (`gNetMore`). `genState.cn.gaps` para o MCP.
- **Servidor**: `FKINDS = 8`, welcome `crl: 1`. Página com servidor antigo recusa a antena (`crl` / HUD "servidor antigo").
- **MCP**: `build_defence` e `request_support` aceitam `radio`; textos novos `rcap`, `nrad`, `crl` na tabela PT.
- Docs: README (parágrafo "Antenas de rádio e brechas na rede", ciclo do N) e MCP.md.

## Testado em bbd5085: ok (tarefa cf-testar-mundo)

`tests/radio.js` roda inteiro, com as batalhas IA × IA de 240 s nas duas épocas, e entrou no `tests/all.sh` (https://github.com/LuizBrugnera/ceu-de-ferro-3d/pull/119). As falhas eram do teste:
- a economia só existe numa partida (conquista solo esvaziada, como `posts.js`);
- o limite de obras agora vem de `fortCap`;
- o custo da antena é cobrado na ordem;
- a meta de 300 s era mais curta que a caminhada de 1 km dos engenheiros (o general fecha a brecha em ~330 s);
- o anel da brecha na vista é a lista do planejador, a cada 5 s.

Verificado:
- a antena pelo caminho do general fica pronta, é paga (30 de energia, 40 de metal) e devolve os construtores;
- o veículo-rádio e o operador como nós;
- `req radio` (veículo, operador, `nrad`) e `fort radio` (`rcap`, `crl`);
- a brecha fechada pelo general da IA, com a antena longe da vigilância e do inimigo;
- a radiogoniometria e o alvo da artilharia;
- o atraso das ordens pela antena;
- o custo: olhar da rede ~0,43 ms por chamada e planejador de brechas ~0,16 ms (pior 2 e 4 ms).

`comms`, `comms-relay`, `forts-online`, `mcp-general` e `frame-budget` passam. Em `tests/forts.js`, o N de 1944 agora vai 3, 4, 5, a antena (8) e fecha.

## O que NÃO foi testado

- Online à mão: o convidado de infantaria construindo a antena com N, quem entra depois, e o servidor antigo recusando, em dois navegadores.
- O desenho do mastro, os rótulos, o anel de brecha na Visão de General, o botão Rádio e o HUD do N, no navegador.
- Uma partida longa vendo se a IA espalha antenas pelo mapa (nas batalhas de 240 s: no máximo 1 brecha e nenhuma antena começada).
- `tests/orders.js` e as outras falhas de `forts.js` (limites de trincheira e muro, esquadras da IA cavando) falham também no main e não são da antena.

## Riscos

- `atLimit` agora considera `u.cnG`: um veículo preso em `cnG` não avança com a frente durante 240 s.
- Mudanças no `fortPlan` e no `GC.fort` tiram a antena do limite de obras: se `F.cn` faltar em algum caminho, o limite pode contar errado.
- `cnKeep` percorre todos os soldados e veículos para cada antena a cada segundo (barato com 6 antenas, mas não medido em partida longa).
- A IA pode mandar o único veículo-rádio do diretor para longe do ponto atacado.
- Construtores do general ficam presos numa operação `usr` até a antena ficar pronta ou 420 s.

## Como testar depois

- `node tests/radio.js` (escrito, **nunca executado**, fora do `tests/all.sh`): antena como nó, meio construída não, bloqueador, destruição, radiogoniometria e alvo de artilharia, veículo-rádio em movimento e operador, `req radio` (veículo, operador, `nrad`), `fort radio` (custo, `fcap` à parte, `rcap`, `crl`), brechas e `cnSite` fugindo da vigilância e do inimigo conhecido, o general da IA fechando a brecha (meta ≤ 300 s), atraso das ordens pela antena, partidas IA × IA de `SECS` s com o custo (`CNB.stat()`). Corrigir o que falhar e então colocá-lo no `tests/all.sh` e no `tests/README.md`.
- `node tests/comms.js`, `node tests/comms-relay.js`, `node tests/forts.js`, `node tests/forts-online.js`, `node tests/orders.js`, `node tests/mcp-general.js` (a tabela PT tem os códigos novos), `node tests/frame-budget.js`.
- Online à mão: `npm start`, dois navegadores; convidado de infantaria aperta N até ANTENA DE RÁDIO e clica; a antena aparece para todos, inclusive para quem entra depois; na Visão de General do lado, o disco da antena e as brechas.
- Partida assistida: ver no diário (RÁDIO) "Brecha na rede … antena de rádio ordenada", "Antena de rádio pronta", "Veículo-rádio a caminho".
