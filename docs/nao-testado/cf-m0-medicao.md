# cf-m0-medicao: medição da manobra do general, pacote M0 (testado em parte)

## Testado em 806508d: ok (parte)
- `tests/ana-man.js`: **all passed** (bfbba9e, depois de #75; antes ele morria com `ReferenceError: m5Tank`). `tests/ana-online.js`: **all passed** (depois do #96; a página-anfitriã era derrubada pelo heartbeat do relay nesta máquina carregada).
- **Continua sem teste:** os casos novos de "parado primeiro" e do custo no `ana-man.js`, o custo do general no `balance.js` e a referência `tools/ref/manobra-base.json` refeita. O torneio de cerca de 75 min não rodou: o node estava saturado por outro torneio.

Pedido do capitão: "ele nunca flanqueiam, ou tentam dominar ruas alternativas, tipo, dar a volta para emboscar uma rua movimentada". Este é o
pacote M0 da proposta de manobra (todas as decisões D1–D12 na opção A): medir a manobra para que cada pacote seguinte prove que melhorou o
general.

## O que mudou

- **Analytics (página, bloco "the general's manoeuvre in the analytics (M0)", logo antes de "day, night and weather")**: eventos novos
  `mv` (manobra aberta e terminada; flanco por estrada recusado, com o motivo), `ap` (como cada assalto ou ocupação chegou ao objetivo:
  amostras por ângulo ao eixo, a mais de 120 m da rota-eixo, até onde foi, se tomou), `ab` (emboscada ou bloqueio armado, disparado, fim com
  veículos tomados e homens perdidos) e `tr` (tráfego de cada lado por trecho da rede de estradas a cada 60 s, e o estado dos veículos:
  trilho, viagem, fora, parado). O cabeçalho ganha `net` (os trechos, quais são eixo). A revisão ganha `mano` por lado. Só lê a batalha.
- **Servidor**: aceita os tipos `mv`, `ap`, `ab`, `tr` (sem isso o lote inteiro do anfitrião era recusado).
- **tools/balance.js**: seção "Manobra do general" com a meta da proposta ao lado, `--ref <json>` para a coluna de referência, `--lg`,
  `--rec`, `--nobudget` nos torneios, e o custo do general por quadro (só sem `--nobudget`).
- **tools/ref/manobra-base.{json,md}**: o torneio de referência de 12 partidas (a refazer, veja abaixo).
- **Testes**: `tests/ana-man.js` (novo) e `tests/ana-online.js` (os tipos novos no servidor).

## O que foi testado (antes da regra nova)

Sobre `6002d18`, antes do merge com o `main` de agora: `tests/ana-man.js` (25 verificações), `ana`, `ana-online`, `relay`,
`frame-budget`, `man-b`, `campaign`, `personality` passaram; `general`, `man-a` e `man-c` falharam igual no `main` daquela hora. A batalha
termina igual, até o último dígito e o sorteio, com a coleta ligada e desligada. Uma olhada custava 0,3–0,4 ms a cada 2 s de partida.

## O que NÃO foi testado

- O merge com o `main` atual (#36 procedimentos de combate, #38 mapa tático M1, #42 e #43): nenhuma suíte rodou depois. Só o smoke (a
  página carrega, 25 s de uma partida IA × IA no mapa 6 sem erro e com os eventos novos, o servidor sobe).
- A correção "parado primeiro" na contagem de veículos (`anaMvLook`): um veículo parado há 5 s ou mais conta como parado mesmo com
  `u.rail`/`u.trip`, e não soma tráfego. Sem teste.
- O custo do general por quadro no `balance.js` (`tour.aib` no cabeçalho, linha "Custo do general"): só conferido com números inventados.
  Nenhuma partida de torneio sem `--nobudget` rodou com ele.
- A referência `tools/ref/manobra-base.json` é de `6002d18`, antes do #36, do #38 e da correção acima: não foi refeita.
- O `tests/ana-man.js` não ganhou os casos de "parado primeiro" nem de custo.

## Riscos

- "No trilho" (84%) e a parte dos eixos no tráfego da referência estão inflados pelo erro corrigido; comparar um pacote novo com ela
  exagera a melhora nessas duas linhas.
- O #36 e o #38 mudam o general: a referência antiga mistura o efeito deles com o do pacote testado.
- O custo do general é tempo de relógio do Node: numa máquina carregada mede mais.
- Uma página nova com um servidor antigo perde lotes de analytics inteiros (os tipos novos são recusados).

## Como testar depois

```sh
node tests/ana-man.js                       # ~3 min; acrescentar: veículo parado com u.rail conta como parado e não soma tráfego
HOST=127.0.0.1 node tests/ana-online.js     # ~1 min
sh tests/all.sh                             # ou SUITES="ana ana-man ana-online man-a man-b man-c general campaign personality"
# refazer a referência na base atual (~75 min com 8 núcleos):
node tools/balance.js --torneio 12 --era all --len 0 --eco --lg --rec --nobudget --mapv 6 --seed 1 --jobs 8 --save <pasta>/matches --json <pasta>/agg.json
# o custo do general, à parte, com o medidor ligado (máquina pouco carregada):
node tools/balance.js --torneio 2 --era all --docs balanced --min 10 --eco --lg --rec --mapv 6 --seed 1 --jobs 2 --save <pasta2>/matches --json <pasta2>/agg.json
```

Depois, gerar `tools/ref/manobra-base.json` a partir de `agg.json` sem os caminhos locais (`ref.matches` com os nomes, `ref.commit` com o
commit da base, `cost` da segunda rodada) e reescrever a tabela e a leitura em `tools/ref/manobra-base.md`. Conferir com
`node tools/balance.js <pasta>/matches --ref tools/ref/manobra-base.json` (as duas colunas iguais).
