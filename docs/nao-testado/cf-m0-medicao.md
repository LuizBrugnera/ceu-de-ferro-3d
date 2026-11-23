# cf-m0-medicao: medição da manobra do general, pacote M0 (testado em parte)

## Testado em ffff56d (cf-pol-testes-b, 2026-11-20): ok (parte)
- `tests/ana-man.js`: 25 de 26. A única falha é a checagem de tempo ("uma olhada a cada 2 s custa 6,08 ms", limite 5 ms), com a conta inteira presa a 12 núcleos e torneios de outras frentes rodando. Antes ela dava 0,3–0,4 ms numa máquina folgada. Não é defeito do código.
- `tests/ana-mano-net.js`: passou.
- **"Parado primeiro" (`anaMvLook`), agora com teste**: `tests/ana-parado.js` (novo, no `all.sh`) passou. Um veículo parado há 10 s conta como parado mesmo no trilho ou em viagem, e não soma tráfego. Em movimento, conta como trilho, viagem ou fora, e soma. Parado há 4,5 s (menos que `MVA.park`) ainda conta como em movimento.
- **Continua sem teste:** o custo do general no `balance.js` (nenhum torneio sem `--nobudget` rodou) e a referência `tools/ref/manobra-base.json` refeita. Os torneios não couberam: a conta tem 12 núcleos para todas as frentes.

## Testado em 806508d: ok (parte)
- `tests/ana-man.js`: **all passed** (bfbba9e, depois de #75; antes ele morria com `ReferenceError: m5Tank`). `tests/ana-online.js`: **all passed** (depois do #96; a página-anfitriã era derrubada pelo heartbeat do relay nesta máquina carregada).

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

- O custo do general por quadro no `balance.js` (`tour.aib` no cabeçalho, linha "Custo do general"): só conferido com números inventados.
  Nenhuma partida de torneio sem `--nobudget` rodou com ele.
- A referência `tools/ref/manobra-base.json` é de `6002d18`, antes do #36, do #38 e da correção acima: não foi refeita.
- O `tests/ana-man.js` não ganhou o caso do custo (o "parado primeiro" está em `tests/ana-parado.js`).

## Riscos

- "No trilho" (84%) e a parte dos eixos no tráfego da referência estão inflados pelo erro corrigido; comparar um pacote novo com ela
  exagera a melhora nessas duas linhas.
- O #36 e o #38 mudam o general: a referência antiga mistura o efeito deles com o do pacote testado.
- O custo do general é tempo de relógio do Node: numa máquina carregada mede mais.
- Uma página nova com um servidor antigo perde lotes de analytics inteiros (os tipos novos são recusados).

## Como testar depois

```sh
node tests/ana-man.js                       # ~3 min (15–50 min com a máquina cheia)
node tests/ana-parado.js                    # o "parado primeiro"
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
