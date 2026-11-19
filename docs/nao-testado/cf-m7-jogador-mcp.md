# M7 Jogador e MCP: o que mudou e o que não foi testado

Tarefa `cf-m7-jogador-mcp`, pacote M7 da proposta de manobra do general (§13, §15, §17; decisões D1-D12 = A).
Pela regra de entrega do capitão ("implemente tudo sem testes e documente o que não foi testado"), **nada disto foi testado**. Rodou só a checagem de fumaça: o servidor sobe e a página carrega no Chrome sem erro lançado (os seis tipos novos e a camada nova aparecem registrados).

## O que mudou

- **Seis manobras novas no funil único** (`genCmd` → `man` → `opNew`), para o jogador e o MCP. O código fica no `Céu de Ferro 3D.html`, no bloco "M7", logo depois das abordagens do M2. Todas usam as abordagens do M2 (`apNow`, `apWalk`) e só o que o lado sabe.
  - `fixflank` (`ffk`, P1): 1 esquadra fixa o objetivo pela abordagem mais perto do eixo (cobertura a ~400 m). `n` esquadras (1-3) vão em silêncio pela abordagem `ap` (0-2) ou pela rota `rt` até a posição de assalto. A hora H é a chegada delas (ou o atraso: 1,3× a caminhada + 60 s; nunca antes de `H` s). Na hora H sai o fogo de morteiro ou bateria, se alcançar, e 20 s depois o flanco assalta. Acaba quando o ponto é tomado, quando a manobra perde metade antes de H ou quando o assalto fica sem ninguém.
  - `envelop` (`env`, P2): o mesmo, com duas manobras (`ap` e `ap2`).
  - `turn` (`trn`, P3): `n` esquadras (padrão 2) vão pelo caminho mais seguro até o entroncamento ou cabeceira de ponte mais perto (até 800 m) e se entrincheiram ali. Recuam quando o inimigo conhecido ali tem mais que o dobro.
  - `penet` (`pen`, P5): `n` esquadras (padrão 3, mínimo 2) assaltam juntas um trecho da frente. Depois de entrar, seguem até o gargalo mais forte (camada `k`) a 0,3-1,5 km além, rumo à base inimiga, e seguram 60 s. São canceladas se a brecha fecha antes de entrarem.
  - `ambush` (`pam`, P7): emboscada em qualquer estrada (perto de x,z, até 400 m, ou na aresta `e` da rede). Fica no lado da estrada com mais ocultação e menos vigilância inimiga. Forma `f`: `lin` ou `l` (a última esquadra fecha a saída). Silêncio e disparo como as emboscadas do comandante (`cmdSquad`, `cmdSpring`). Depois do disparo, recua 250 m para longe da estrada. A janela é `H` (a vida da operação, padrão 600 s). No máximo 2 por lado.
  - `guard` (`grd`, P8): uma esquadra se entrincheira no entroncamento ou ponte do nosso flanco. Com `f=mine`, também manda um campo minado anticarro ali (ordem `fort`).
- **Chaves novas do `man`**: `ap`, `ap2`, `f`, `e` e `ids`. Para `fixflank`, `envelop` e `penet`, `H` é a hora H; para `ambush`, `turn` e `guard`, é a vida.
- **Relay** (`server.js`): `GK` aceita `ap`, `ap2`, `f`, `e`, e o `welcome` traz `man2: 1`. Com um servidor antigo, a página recusa as manobras novas antes de enviar (`Net.man2`).
- **MCP** (`mcp-general.js`, versão 2.1.0): 5 ferramentas novas: `get_tactical_map`, `plan_approaches`, `order_maneuver`, `plan_ambush` e `guard_route`. `GK` foi espelhado, e o texto do `send_command` e as instruções foram atualizados. O `MCP.md` também foi atualizado.
- **Visão de General**, aba Campanha > Manobras:
  - os 6 botões novos;
  - a escolha da abordagem (Auto, A1-A3), da forma da emboscada (Linear, Em L) e da guarda (Posto, Minas);
  - 3 chips de camada: Vigilância, Tráfego inimigo, Gargalos;
  - "Ver abordagens": clique num ponto inimigo (pergunta `gask ap`). Em cada abordagem aparece "Fixar e flanquear por An" (um clique) e "Envolver".
- **Mapa**: camada nova "Abordagens e manobras" (`gAp`). Desenha as 3 abordagens em cores, com minutos, % à vista e ângulo, mais o caminho e o alvo das manobras novas em curso (`genManOp` ganhou `path`/`to` para elas).
- As esquadras selecionadas vão junto (`ids`). Sem seleção, vão as livres mais perto, até 4,5 km.

## O que NÃO foi testado (tudo)

- Nenhuma manobra nova foi executada numa partida: nem a abertura, nem as fases (`go`/`fire`/`hit`, `exp`, `set`/`fire`/`back`), nem o fim.
- A posição de cada esquadra, os caminhos (`apWalk`, `footPath`, `gWay`) e o efeito do `quiet`/`fast` nas ordens `overwatch`, `hold` e `ambush`.
- O disparo da emboscada planejada por `cmdSpring` (ela usa `op.site` com `dx`, `dz` e `ri`, como as do comandante).
- O campo minado da guarda (`genCmd` `fort` aninhado dentro de outro `genCmd`).
- O relay com as chaves novas, o `man2` no `welcome` e um convidado mandando as manobras pela rede.
- As 5 ferramentas MCP contra um anfitrião real.
- O painel e a camada no navegador: botões, cliques no mapa, desenho, largura em 1280 e 1920 px e telefone.
- O custo por quadro (`apNow` é síncrono na ordem do jogador, como o `gask ap` do M2).
- Os testes existentes (`tests/*`) não foram rodados.

## Riscos que vejo

- **Hora H**: se a manobra nunca chega (`q.at` falso), a hora H só vem pelo atraso de 1,3× + 60 s. Uma caminhada calculada errada pode atrasar demais.
- **Fixação**: com só uma abordagem, ou com a escolhida igual à mais perto do eixo, a fixação vai para o lugar de reunião do eixo (`pl.f`), que pode estar longe ou exposto.
- **Esquadras do jogador**: o "pool" pega postos de linha, mata, estrada, guarnição, assalto e emboscada fora de operação. Isso pode desguarnecer um ponto, porque não tem o piso de defesa do `apFloor`.
- **Emboscada em L**: a posição da última esquadra é aproximada (60 m além da zona, 20 m da estrada) e pode cair em cima da estrada.
- **`penet`**: o ponto-chave escolhido pela camada `k` estática pode estar atrás de um rio.
- **`guard` com minas**: o `fort` pode recusar ("em cima da estrada"). O log diz, mas o posto segue sem minas.
- **Limites**: `manMax` (o limite de manobras simultâneas por doutrina) e o tempo de espera de 20 s também valem para o jogador. Ele pode receber `max` cedo.
- **Partida em rede**: um relay antigo sem `man2` faz a página recusar as manobras novas. Um relay novo com uma página antiga: a página antiga ignora as chaves.

## Como testar depois

1. Servidor e página: `npm start` (ou `PORT=8080 node server.js`) e abra `http://localhost:8080/`. Partida no mapa de 1944 (versão de mapa ≥ 4), aba General, sente no comando do lado.
2. Abordagens: Campanha > Manobras > "Ver abordagens", clique num ponto inimigo. Espere 3 linhas coloridas no mapa e 3 itens na lista (com ângulo, km, min e % à vista).
3. Fixar e flanquear: clique "Fixar e flanquear por A2". O log deve dizer "Fixar e flanquear contra …: fixação a X° do eixo, manobra por Y°…". Acompanhe:
   - a fixação para a ~400 m;
   - a manobra vai pela linha da A2;
   - a hora H ("manobra em posição" ou "atrasada"), o fogo, o "assalto pelo flanco" e o "tomado".
4. Envolver: o mesmo, com o botão "Envolver" (precisa de 3 abordagens e 3 esquadras livres).
5. Desbordamento, penetração e guarda: escolha o botão e clique perto de um entroncamento ou ponte (`turn`, `guard`) ou num trecho da frente (`penet`). Confira:
   - o log "em posição";
   - as trincheiras;
   - em `penet`, "explora até o ponto-chave".
6. Emboscada: chip "Tráfego inimigo", escolha uma estrada quente, botão "Emboscada planejada" (Linear e Em L). Espere um veículo inimigo passar: "Emboscada disparada", depois "recua 250 m".
7. Recusas: ponto próprio (`own`), longe de estrada (`amb`), sem esquadra (`sq`), terceira emboscada (`max`).
8. MCP: `CEU_URL=ws://localhost:8080 node mcp-general.js` (veja `MCP.md`) e chame, nesta ordem:
   - `get_tactical_map {layer:"v"}`;
   - `plan_approaches {x,z}`;
   - `order_maneuver {kind:"fixflank", point:i, approach:1}`;
   - `plan_ambush {x,z, form:"l"}`;
   - `guard_route {x,z, with:"mine"}`.
9. Relay: um convidado (segunda aba) manda as manobras. Com um `server.js` antigo, a página deve dizer "O servidor desta sala é antigo: sem as manobras novas".
10. Rode `tests/approaches.js`, `tests/approaches-relay.js` e `tests/tmap.js` para ver que o M1 e o M2 seguem bons. Depois escreva um `tests/m7.js` que abra cada manobra com `genCmd(t, {c:'man', k, …}, 'sys')` numa batalha semeada e confira as fases.
11. Largura: Visão de General em 1280 e 1920 px. A linha nova de botões (`#gcM7`) não pode estourar a coluna.
