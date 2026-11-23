# Cérebro do soldado (P1) e parte 1: corpo e voz (testado em parte)

Tarefa `cf-cerebro-soldado`. Parte 1 (bloco "the soldier's body and voice"): granada que cai no fundo da trincheira (`nadeFloor`), mira de arremesso da IA (`nadeAt`, `nadeAim`, o `toss` embrulhado), dobra do terreno (`nadeFold`), devolver (`nadeBack`), abrigo lido do chão (`CVR`, `cvPick`), balões de fala (`SAY`), empurrão e atordoamento (`STUN`). Parte 2 (seções `the soldier's stimuli (P1)`/`STIM` e `CEREBRO: soldado (P1)`/`SOLB`): reflexos, utilidade, supressão e moral, rendição, contra blindado. A descrição completa está no histórico do git deste arquivo.

## Testado (cf-pol-testes-a)

Sondagem sem navegador da parte 1, moderno, 3 sementes:
- Granada da IA mirada num homem no chão plano: estoura em 3,60 a 3,62 s (espoleta 3,6). A 18 e 28 m estoura a 2,7 a 2,8 m do alvo; **a 8 e 10 m estoura a 6,9 e 5,6 m dele** (o arremesso é sempre a 17 m/s em arco baixo, e a granada quica e rola longe).
- Homem numa trincheira a 15 m: arco alto, estoura a 0,4 m dele e 2,05 m abaixo do chão (a trincheira tem 2,35 m): cai no fundo.
- **Homem dentro de uma casa atrás de uma janela, quem joga a 14 m: mira a janela (`win`), mas a granada atravessa a casa e estoura do outro lado, a 31 m de quem jogou** (uma amostra). Mesmo motivo: chega rápida demais.
- `nadeFold`: uma crista de 1,5 m entre a granada e um homem agachado a 6 m corta o dano de 7,6 para 2,7 (0,35, como pedido).
- `cvPick`: no aberto fica onde está (`aqui`); com um tanque parado a 9 m vai para a sombra dele (`veiculo`, 5,1 m); com uma trincheira do lado a 8 m, `trincheira`.
- Morteiro (8 cm) a 5 m de um soldado da IA em pé: empurrado 1,79 m e atordoado 2,86 s.

Não consertei a mira da granada: a correção certa (força do arremesso pela distância, ou um ponto logo depois do peitoril, por dentro) muda o arremesso de todos e pede partidas para conferir.

## Não testado

- Parte 2 (CEREBRO, que outra equipe está reescrevendo): `tests/brain-soldado.js`, `brain.js`, `brain-honesty.js`, `brain-lider.js`, `brain-drills.js` não rodaram aqui por causa da fila de memória da máquina; `brain-falas.js` passou na linha de base do main. Nenhum torneio A×B (`BRAIN.on` 1 × 0), nenhuma partida no navegador nem online.
- Suítes antigas que o P1 pode mudar (`m.sup` agora precisa de ~3 tiros): `drills.js`, `inf-drills.js`, `infantry.js`, `squads.js`, `help.js`, `rec.js`.
- Balões de fala, "RENDIDO"/"PRISIONEIRO" e o ferido rastejando na tela; o cartão da unidade com "homens atordoados".
- Granada em ladeira e devolvida (`nadeBack`); online (`fl`, `rb`).

## Riscos

- A granada da IA de perto (8 a 10 m) e na janela chega longe do alvo (medido acima).
- Rendição, prisioneiro, arma do caído, corrida contra blindado e o custo do cérebro: como na doc anterior (histórico do git).

## Como testar

1. `N=10 nice node tests/brain-soldado.js`, `node tests/brain.js`, `node tests/brain-honesty.js`, `node tests/brain-falas.js`, `node tests/brain-lider.js`, `node tests/brain-drills.js`, e `drills.js`, `inf-drills.js`, `infantry.js`, `squads.js`, `help.js`, `rec.js` contra o main de antes (`PAGE=<página antiga>`).
2. Granada: no harness, `sandbox('modern')`, um soldado da IA e um alvo a 8, 10, 18 e 28 m; `m.nAt = nadeAt(m, alvo); toss(m, 1)`; ver onde estoura. Um alvo dentro de casa atrás da janela: deve estourar dentro.
3. Torneio A×B com `BRAIN.on` 1 × 0 (`node tools/balance.js --torneio N --brain ab`).
4. No navegador, IA × IA numa vila: balões, rendição, ferido rastejando; online, o convidado vê os balões.
