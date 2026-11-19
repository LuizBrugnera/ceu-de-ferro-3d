# cf-radio-rede: antenas de rádio e brechas na rede de comando (não testado)

Pedido do capitão: "muitas vezes o general fica com muitas areas do mapa sem rede, deve ser possivel construir radios e andar com carros ou tropas de radio tambem deve resolver esse problema e expandir a zona do radio".

## O que mudou

- **Antena de rádio** (obra de tipo 8, `FORT.rel`, bloco `CNR` em `Céu de Ferro 3D.html`, logo antes da seção de analytics). Soldado constrói com N (depois da cúpula); o general com Fortificar → antena de rádio (`fort` `k: radio`). Custo 30 energia / 40 metal com economia, 60 s, até 3 por lado, fora do limite de 6 obras de campanha (`FORT.ai.cap`). Pronta, vira nó da rede (`CN`, `k` 4) com alcance `CN.rel.r` = 0,2 da largura do mapa (2,8 km). Bloqueador a corta, radiogoniometria a localiza (`f.kn`), explosão a derruba (`OBJ.mast`), o inimigo que a vê a marca e a artilharia dele a mira (`fortTargets`, valor de rádio). Desenho: mastro treliçado em `postBoxes`.
- **Cobertura móvel**: veículo-rádio e operador já eram nós em movimento. Novo pedido de apoio **Rádio** (`req` `k: radio`, botão em Missões → Pedidos de apoio): manda o veículo-rádio livre da IA até o lugar pela rede de estradas (`tripTo`) e o segura 240 s ali (`u.cnG`, que `atLimit` respeita; a antena sobe quando ele para); sem veículo (ou com `ids`), uma esquadra com operador de rádio vai e segura. Recusa `nrad`.
- **Brechas** (`cnGaps`): esquadras fora da rede (não as bloqueadas) e lugares de ordem/missão fora de qualquer nó, agrupados. O general da IA (área Apoio, a cada 5 s, até 2 reforços a caminho) fecha a maior: antena no ponto mais recuado que ainda cobre a brecha, fora da camada de vigilância do mapa tático (`v` ≤ 0,35) e a mais de 900 m de inimigo conhecido (`cnSite`); sem construtor/limite/custo, manda o veículo-rádio ou operador. Devolve os construtores quando a antena fica pronta; desiste em 420 s.
- **Visão de General**: antena com ícone e rótulo ANTENA, anel âmbar "BRECHA NA REDE · N ESQ." com o reforço a caminho, contagem no painel (`gNetMore`). `genState.cn.gaps` para o MCP.
- **Servidor**: `FKINDS = 8`, welcome `crl: 1`. Página com servidor antigo recusa a antena (`crl` / HUD "servidor antigo").
- **MCP**: `build_defence` e `request_support` aceitam `radio`; textos novos `rcap`, `nrad`, `crl` na tabela PT.
- Docs: README (parágrafo "Antenas de rádio e brechas na rede", ciclo do N) e MCP.md.

## O que NÃO foi testado

Nada disso passou por suíte de testes, pipeline ou partida A/B (regra do capitão). Só o smoke: o script da página faz parse, duas partidas IA × IA de 25 s (moderna e 1944, economia ligada) rodam sem erro e sem NaN, uma antena é iniciada no sandbox e o servidor sobe. Custo medido nesse smoke: olhar da rede ~0,7–1 ms por chamada (1 por segundo, inclui o `cnLook` que já existia), planejador de brechas ~1,1 ms por chamada (a cada 5 s por lado), pior caso 9 ms.

Em especial, sem verificação:
- a antena realmente fica pronta pelo caminho do general (fortPlan com `O.dig.k = 8`) e os construtores são devolvidos;
- o veículo-rádio chega, segura e não volta para a frente; o que acontece se a viagem é interrompida (`CNR.near` = 1200 m);
- o general da IA fecha uma brecha em tempo razoável e não fica espalhando antenas pelo mapa (pode querer cobrir missões de ataque no fundo do inimigo);
- artilharia inimiga atirando na antena e a explosão derrubando-a;
- online: linha `fort` de tipo 8 para convidados e para quem entra depois, `fbuild` de tipo 8 de um convidado, servidor antigo recusando;
- desenho do mastro, rótulos e anel de brecha na Visão de General, botão Rádio, HUD do N;
- MCP com `radio`;
- `tests/comms.js` passou uma vez antes da regra nova (SECS=60), já com a mudança no `cnLook`; o resto da linha de base não foi rodado.

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
