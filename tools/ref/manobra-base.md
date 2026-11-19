# Referência da manobra do general (M0)

`manobra-base.json` é o general de hoje, antes dos pacotes de manobra (M1–M7): cada pacote compara o seu torneio com ele
(`node tools/balance.js --torneio ... --ref tools/ref/manobra-base.json`, ou `node tools/balance.js <pasta> --ref tools/ref/manobra-base.json`).
O critério de entrada (decisão D10 A da proposta de manobra) é um torneio A/B com 40 partidas decididas ou mais, flanco de 35% ou mais,
entropia das chegadas maior que a desta referência, vitória do general novo em 55% ou mais e o general dentro do orçamento.

## Como foi jogado

Em 2026-11-19, sobre o `main` em `6002d18` com a medição deste pacote (que não muda a batalha), no Node:

    node tools/balance.js --torneio 12 --era all --len 0 --eco --lg --rec --nobudget --mapv 6 --seed 1 --jobs 8 --json <arquivo>

12 partidas Curtas (relógio de 30 min), 6 por época, cada par das três doutrinas dos dois lados, sementes 1 a 12, o mapa de hoje (v6) com
economia, logística física e recuperação. `--nobudget` desliga o corte do teto de população pelo medidor de quadros (W2), que no Node
depende da carga da máquina: assim a mesma semente dá a mesma partida em qualquer lugar. Cada partida levou de 33 a 45 min de um núcleo.
O JSON é a saída de `--json` sem os caminhos locais (`ref.matches` guarda o nome de cada partida).

## O que deu

12 terminadas (11 pelo tempo, 1 pela base principal), lado 0 venceu 9.

| Métrica | Valor | Meta |
| --- | --- | --- |
| Assaltos por partida (chegaram à hora H, tomaram o ponto, recuaram) | 1,1 (0, 0,1, 0,1) | — |
| Ocupações de ponto vazio por partida (tomadas) | 3,5 (2,1) | — |
| Taxa de flanco: amostras de chegada a 70° ou mais do eixo (só assaltos) | 0% (—) | ≥ 35% |
| Chegada de frente (menos de 35° do eixo); oblíqua (35° a 70°) | 100%; 0% | — |
| Fora do eixo: amostras a mais de 120 m da rota-eixo | 0% | ≥ 40% |
| Assaltos com manobra (flanco, cerco ou finta) | 15% | ≥ 50% |
| Emboscadas e bloqueios por partida: armados, disparados | 6,4, 2,8 | ≥ 2 disparados |
| Emboscadas boas: 1 veículo ou mais, no máximo 1 esquadra perdida | 18% | ≥ 40% |
| Tráfego nas ruas fora dos eixos (fora de toda estrada) | 2% (15%) | ≥ 20% |
| Veículos em movimento: no trilho, em viagem pela rede, fora | 84%, 3%, 13% | — |
| "Sem força para atacar" por partida | 62,4 | — |
| Entropia das chegadas (bits) | 0 | +1 bit sobre a referência |
| Repetição: mesmo objetivo, eixo e lado de chegada do assalto anterior | — | metade da referência |
| Manobras abertas por partida (por tipo) | 11,4 (dep 2,9, inf 2,7, blk 2,4, mres 1, gue 0,8, cut 0,7, raid 0,6, tra 0,3, fnt 0,2) | — |
| Flanco por estrada: avaliado, aberto, recusado por motivo | 55, 0, long 4, node 50, sq 1 | — |

Leitura: o general quase não ataca (1,1 assalto por partida, nenhum chegou à hora H) e diz "sem força para atacar" 62 vezes por partida;
o que ele toma são pontos vazios, sempre pela frente e sobre a rota-eixo. O flanco por estrada foi avaliado 55 vezes e nunca saiu
(`node` 50: nenhum nó da rede perto de um ponto nosso ou perto do alvo). 98% do tráfego nas estradas fica nos eixos e os veículos
andam 84% do tempo no trilho. O mesmo quadro que a proposta mediu com o script do scout.
