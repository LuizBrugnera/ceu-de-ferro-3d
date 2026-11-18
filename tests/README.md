# Testes

Rodam no Node, sem navegador. `harness.js` carrega a parte da página que não usa DOM (tabelas, simulação e rede) num contexto isolado.

```
node tests/smoke-sight.js   # a IA e a fumaça: tiros no alvo escondido, memória, retomada (TRIALS=12)
node tests/infantry.js      # soldado: posturas, cobertura (mata e quina de parede), cada arma contra cada alvo, atropelamento
node tests/squads.js        # pelotões: caminhão, desembarque, comportamento, reação da outra IA
node tests/field.js         # infantaria de campo: quem começa onde, ordens (guardar, patrulhar, assaltar, escoltar), reforços do planejador, caminhão sob ameaça, conquista: reforços do diretor, tíquetes, captura, ligação, relógio (SECS=240)
node tests/bases.js         # bases de suprimento: onde pode, construção, kit e limite, reabastecimento por classe, entrada, tiros para destruir por arma, carga, IA que constrói, guarda, refaz, recua e ataca
node tests/world.js         # casas, árvores, base e carcaças: o que para na parede, tabela de dano, estágios, colisão, visão, IA nas vilas (DRIVE=300)
node tests/soak.js          # 10 min solo por época e classe (helicóptero com mouse e clássico), e batalha só de IA com o placar de quem matou quem (SECS=600; ERA=<época> roda só uma)
node tests/relay.js         # servidor: cada mensagem nova ou alterada, incluídas as da conquista (cq), da requisição (req, reqa) e dos rádios (rad, rsp, rbe)
node tests/resume-relay.js  resume-online.js   # partidas suspensas: o servidor guarda a última palavra do anfitrião, sala vazia suspende, quem volta retoma (Continuar) ou começa outra (Nova partida), GET /partidas, SUSPEND
node tests/online.js        # anfitrião e dois convidados pelo servidor de verdade, numa porta própria (8093)
node tests/world-online.js   # objetos do mundo pelo servidor de verdade: dano do convidado, quem entra depois, troca de anfitrião; com SERVER=<servidor antigo>, nada é danificado
node tests/bases-online.js  # bases pelo servidor de verdade: pedido do convidado, estágios em todos, quem entra depois, entrada na base, carga do convidado, troca de anfitrião no meio da obra; BW=1 só mede o que o anfitrião envia numa batalha cheia
node tests/heli.js           # helicóptero, voo: pairado, subida, descida, velocidades, curva, limites de pouso, rotor contra o mundo, autorrotação (alturas na escala do mundo, ASPD), perda de cada peça, lei do mouse
node tests/heli-arms.js      # torre fora do nariz, foguetes, míssil guiado e fumaça, flares (TRIALS=30), metralhadoras de porta, pelotão embarca e desembarca
node tests/heli-ai.js        # IA: esconde, sobe, atira e desce (tempo exposto), volta ferido, transporte entrega, o que a outra IA faz com um helicóptero (TRIALS=10, SECS=420)
node tests/heli-relay.js     # servidor: classe, hstate, lift, linhas da IA, troca
node tests/heli-online.js    # anfitrião e dois convidados de helicóptero pelo servidor de verdade
node tests/heli-oldserver.js # SERVER=<server.js antigo>: sem helicópteros; com o servidor novo, o diretor põe os dele em campo
node tests/loadout.js       # cargas dos aviões: tabelas e a cópia do servidor, peso e arrasto (aceleração, subida, curva), cada armamento em cada alvo, teclas B, V e G, rearmar, IA por papel e alvo (SEED=11; TRIALS=5 lançamentos na média da bomba de cacho)
node tests/loadout-online.js # cargas pelo servidor de verdade: o que cada um voa e os outros veem, tanque de jogador morto por bomba de queda livre, troca de avião, perda, rearmar, IA do anfitrião, cargas recusadas; com SERVER=<servidor antigo>, todos na carga padrão
node tests/gen-loads.js     # escreve em server.js a cópia das tabelas de carga (LOADS, STW) a partir da página; loadout.js falha se as duas diferirem
LOADS=1 node tests/soak.js  # 10 min solo por avião com cada carga pronta
sh tests/all.sh             # as suites rápidas em sequência contra o par publicado (ou PAGE/SERVER), uma linha por suite e os logs em tests/logs/; SUITES="relay online" escolhe algumas. Ficam de fora soak, transport-battle e as *-oldserver
node tests/crew.js  crew-relay.js  crew-online.js        # tripulação: descer, entrar, veículo estacionado, troca de dono pelo servidor
node tests/transport.js  transport-relay.js  transport-online.js   # transporte e atirador de elite
node tests/forts.js  forts-relay.js  forts-online.js     # trincheiras e sacos de areia
node tests/sappers.js  posts.js  sappers-relay.js  sappers-online.js   # sapadores e minas, sabotagem, postos guarnecidos, torre, cúpula antifoguete e lançadores de foguetes
node tests/city.js  city-online.js  woods.js             # prédios das vilas e matas
node tests/seat.js          # mapa v5: a cidade-sede junto de cada base, os lotes, as instalações neles e o disfarce até serem identificadas
node tests/damage.js  damage-relay.js  missiles.js       # dano por peças, blindagem e o modelo dos mísseis
node tests/drone.js  drone-relay.js  drone-online.js  pad.js   # drones (o FPV na frente e no teto de um tanque) e controles
node tests/ana.js          # analytics e revisão pós-batalha: a batalha igual com a coleta ligada, os eventos de uma partida IA × IA (MIN=2), tíquetes, sangria, a revisão de um lado, tools/balance.js
node tests/ana-online.js   # analytics pelo servidor de verdade: lotes do anfitrião, recusas, arquivo por partida, resumo, HTTP, POST, 90 dias, ANALYTICS=0 e uma página anfitriã de verdade
node tests/oldserver.js     # a página nova contra um servidor antigo, SERVER=<server.js antigo>. Sem infantaria: sem pelotões. Sem bases: ninguém constrói e a entrada continua na estrada do meio
```

Variáveis: `PAGE=<arquivo>` testa outra cópia da página (padrão: a publicada), `SERVER=<arquivo>` outro servidor, `PORT_T` a porta dos testes online.
`smoke-sight.js` contra uma página anterior à correção só imprime os números de antes.
