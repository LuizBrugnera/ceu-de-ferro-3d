# M7 Jogador e MCP: o que mudou e o que não foi testado

## Testado em 806508d e 1cedd86 (parte)
- MCP: `tests/mcp-general.js` **all passed** depois do #94. As recusas `ap` e `man2` do M7 (e `nofix`) não tinham o texto em português na ponte, e o teste esperava a versão 2.0.0 e não as ferramentas do M7.
- `tests/approaches-relay.js`, `tests/ambush.js` (M4), `tests/tmap.js` e `tests/sim-split.js`: passam. `tests/gen-cmd.js`: a única falha era a checagem "sem aleatório", que lia blocos que não são comandos, corrigida no #107. A rodada inteira depois do conserto foi cortada pelo tempo limite no node carregado; os blocos que chegaram a rodar passaram.
- `tests/approaches.js`: **falha em 2 checagens do M2** (fica para o teste do M2): uma reunião à vista (`v 0.87`) e o tempo de um pedaço da busca (34–45 ms, medido num node muito carregado).
- Execução headless (1cedd86, 1944, semente 9): `genCmd(0, {c:'man', k:'fixflank', pi})` abre a manobra. O log diz "Fixar e flanquear contra G · Vila do Moinho: fixação a 16° do eixo, manobra por 52° (1,6 km, 24% à vista), 2 esquadras". As esquadras saem (`go`), embarcam e desembarcam do caminhão como previsto. Em 480 s de partida a hora H ainda não tinha chegado (a caminhada é longa). As fases seguintes não foram vistas.
- Navegador (1cedd86), Visão de General com o comando assumido: a linha de manobras (`#gcM7`) cabe na coluna em 1280 e 1920 px (`scrollWidth === clientWidth`, nenhum botão fora). A abordagem (Auto, A1-A3), a guarda (Posto, Minas) e os chips de camada aparecem. `gask ap` sobre Vila do Moinho volta com 3 abordagens (87° 8,8 min 11% à vista; 6° 6,3 min 21%; 76° 10,9 min 9%).
- **Continua sem teste:** o desenho das abordagens no mapa e os botões "Fixar e flanquear por An" e "Envolver"; a hora H, o fogo, o assalto e "tomado"; `envelop`, `turn`, `penet` e a guarda com minas numa partida; o relay com convidado mandando as manobras e com servidor antigo; as 5 ferramentas MCP contra um anfitrião real; o `tests/m7.js` sugerido abaixo.

Tarefa `cf-m7-jogador-mcp`, pacote M7 da proposta de manobra do general (§13, §15, §17; decisões D1-D12 = A).
Pela regra de entrega do capitão ("implemente tudo sem testes e documente o que não foi testado"), **nada disto foi testado**. Rodou só a checagem de fumaça: o servidor sobe e a página carrega no Chrome sem erro lançado (os seis tipos novos e a camada nova aparecem registrados).

## O que mudou

- **Seis manobras novas no funil único** (`genCmd` → `man` → `opNew`), para o jogador e o MCP. O código fica no `Céu de Ferro 3D.html`, no bloco "M7", logo depois das abordagens do M2. Todas usam as abordagens do M2 (`apNow`, `apWalk`) e só o que o lado sabe.
  - `fixflank` (`ffk`, P1): 1 esquadra fixa o objetivo pela abordagem mais perto do eixo (cobertura a ~400 m). `n` esquadras (1-3) vão em silêncio pela abordagem `ap` (0-2) ou pela rota `rt` até a posição de assalto. A hora H é a chegada delas (ou o atraso: 1,3× a caminhada + 60 s; nunca antes de `H` s). Na hora H sai o fogo de morteiro ou bateria, se alcançar, e 20 s depois o flanco assalta. Acaba quando o ponto é tomado, quando a manobra perde metade antes de H ou quando o assalto fica sem ninguém.
  - `envelop` (`env`, P2): o mesmo, com duas manobras (`ap` e `ap2`).
  - `turn` (`trn`, P3): `n` esquadras (padrão 2) vão pelo caminho mais seguro até o entroncamento ou cabeceira de ponte mais perto (até 800 m) e se entrincheiram ali. Recuam quando o inimigo conhecido ali tem mais que o dobro.
  - `penet` (`pen`, P5): `n` esquadras (padrão 3, mínimo 2) assaltam juntas um trecho da frente. Depois de entrar, seguem até o gargalo mais forte (camada `k`) a 0,3-1,5 km além, rumo à base inimiga, e seguram 60 s. São canceladas se a brecha fecha antes de entrarem.
  - `ambush` e `guard` são as manobras do **M4** (`emb` e `grd`, PR #49): o M7 não tem implementação própria delas. Ele só liga a elas o que o jogador e o MCP pedem:
    - `ambush` com `e` (uma aresta da rede de estradas): vira o meio da aresta, e o M4 escolhe o sítio, a forma (linear ou em L) e as esquadras;
    - `guard` com `f=mine`: depois que o M4 abre a guarda, sai também um campo minado anticarro ali (ordem `fort`);
    - `H` é a vida das duas.
    (Antes do M4 chegar, o M7 tinha uma emboscada `pam` e uma guarda própria; foram tiradas no merge para não sobrescrever as do M4.)
- **Chaves novas do `man`**: `ap`, `ap2`, `f`, `e` e `ids` (`ids` vale para `fixflank`, `envelop`, `turn` e `penet`; o M4 escolhe as esquadras dele sozinho). Para `fixflank`, `envelop` e `penet`, `H` é a hora H; para `ambush`, `turn` e `guard`, é a vida.
- **Relay** (`server.js`): `GK` aceita `ap`, `ap2`, `f`, `e`, e o `welcome` traz `man2: 1`. Com um servidor antigo, a página recusa as manobras novas antes de enviar (`Net.man2`).
- **MCP** (`mcp-general.js`, versão 2.1.0): 5 ferramentas novas: `get_tactical_map`, `plan_approaches`, `order_maneuver`, `plan_ambush` e `guard_route`. `GK` foi espelhado, e o texto do `send_command` e as instruções foram atualizados. O `MCP.md` também foi atualizado.
- **Visão de General**, aba Campanha > Manobras:
  - os 6 botões novos;
  - a escolha da abordagem (Auto, A1-A3) e da guarda (Posto, Minas) (os botões de emboscada e guarda já eram do M4);
  - 3 chips de camada: Vigilância, Tráfego inimigo, Gargalos;
  - "Ver abordagens": clique num ponto inimigo (pergunta `gask ap`). Em cada abordagem aparece "Fixar e flanquear por An" (um clique) e "Envolver".
- **Mapa**: camada nova "Abordagens e manobras" (`gAp`). Desenha as 3 abordagens em cores, com minutos, % à vista e ângulo, mais o caminho e o alvo das manobras novas em curso (`genManOp` ganhou `path`/`to` para elas).
- As esquadras selecionadas vão junto (`ids`). Sem seleção, vão as livres mais perto, até 4,5 km.

## O que NÃO foi testado (tudo)

- Nenhuma manobra nova foi executada numa partida: nem a abertura, nem as fases (`go`/`fire`/`hit`, `exp`, `set`/`fire`/`back`), nem o fim.
- A posição de cada esquadra, os caminhos (`apWalk`, `footPath`, `gWay`) e o efeito do `quiet`/`fast` nas ordens `overwatch`, `hold` e `ambush`.
- A ponte com o M4: `ambush` com `e` (meio da aresta) e `guard` com minas (`genCmd` `fort` logo depois da guarda aberta).
- O campo minado da guarda (`genCmd` `fort` aninhado dentro de outro `genCmd`).
- O M2, o M4 e o M7 juntos numa partida (os três disputam as esquadras livres).
- O relay com as chaves novas, o `man2` no `welcome` e um convidado mandando as manobras pela rede.
- As 5 ferramentas MCP contra um anfitrião real.
- O painel e a camada no navegador: botões, cliques no mapa, desenho, largura em 1280 e 1920 px e telefone.
- O custo por quadro (`apNow` é síncrono na ordem do jogador, como o `gask ap` do M2).
- Os testes existentes (`tests/*`) não foram rodados.

## Riscos que vejo

- **Hora H**: se a manobra nunca chega (`q.at` falso), a hora H só vem pelo atraso de 1,3× + 60 s. Uma caminhada calculada errada pode atrasar demais.
- **Fixação**: com só uma abordagem, ou com a escolhida igual à mais perto do eixo, a fixação vai para o lugar de reunião do eixo (`pl.f`), que pode estar longe ou exposto.
- **Esquadras do jogador**: o "pool" pega postos de linha, mata, estrada, guarnição, assalto e emboscada fora de operação. Isso pode desguarnecer um ponto, porque não tem o piso de defesa do `apFloor`.
- **Esquadras disputadas**: o M7 e o M4 usam regras diferentes para escolher esquadras livres. Uma ordem do jogador pode tirar esquadras de uma emboscada ou guarda que o M4 ainda vai armar.
- **`penet`**: o ponto-chave escolhido pela camada `k` estática pode estar atrás de um rio.
- **`guard` com minas**: o `fort` pode recusar ("em cima da estrada"). O log diz, mas a guarda segue sem minas.
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
6. Emboscada (M4) pelo M7: chip "Tráfego inimigo", escolha uma estrada quente e mande `plan_ambush {edge}` pelo MCP. O log do M4 deve mostrar "Emboscada planejada … na estrada …". Guarda com minas: botão Minas + "Guarda da rua alternativa". Espere a guarda e um campo minado (ou a linha "minas recusadas").
7. Recusas: ponto próprio (`own`), longe de estrada (`amb`), sem esquadra (`sq`), terceira emboscada (`max`).
8. MCP: `CEU_URL=ws://localhost:8080 node mcp-general.js` (veja `MCP.md`) e chame, nesta ordem:
   - `get_tactical_map {layer:"v"}`;
   - `plan_approaches {x,z}`;
   - `order_maneuver {kind:"fixflank", point:i, approach:1}`;
   - `plan_ambush {edge}`;
   - `guard_route {x,z, with:"mine"}`.
9. Relay: um convidado (segunda aba) manda as manobras. Com um `server.js` antigo, a página deve dizer "O servidor desta sala é antigo: sem as manobras novas".
10. Rode `tests/approaches.js`, `tests/approaches-relay.js`, `tests/ambush.js` (M4) e `tests/tmap.js` para ver que o M1 e o M2 seguem bons. Depois escreva um `tests/m7.js` que abra cada manobra com `genCmd(t, {c:'man', k, …}, 'sys')` numa batalha semeada e confira as fases.
11. Largura: Visão de General em 1280 e 1920 px. A linha nova de botões (`#gcM7`) não pode estourar a coluna.
