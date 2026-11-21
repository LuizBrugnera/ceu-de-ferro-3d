# cf-general-constroi: o general da IA fortifica a economia e a cidade-sede (parte testada)

O que é: `fortPlan` com limite só para trincheiras/parapeitos (`FORT.ai.cap`), `GC.fort` com `postcap`, obra ordenada sem inimigo a 150 m (`FORT.ai.oq`) e o plano de fortificação (`AFP`, a cada 10 s a partir de 90 s): antiaérea fixa sobre a sede e a base, ninho/posto anticarro/campo minado nas entradas, torre e minas pelo tráfego (nível 1), ninho no gargalo (nível 2), poupança da economia (`aidPay`, `ecoAI`), reconstrução de obra perdida.

## Testado
- Em 9f2a313 (cf-testar-ia): `tests/afp.js` (limites `fcap`/`postcap`, primeira ordem aos ~100 s pelo `genCmd`, obra pronta, ordem fechada); `aid`, `tmap`, `sappers`, `eco-war`, `w13`, `squads`, `forts-online`, `sappers-online`, `orders-online`; partidas de 12-15 min no harness com ninho e posto anticarro na sede.
- Em cf-pol-testes-a, uma partida IA × IA (Hoje, mapa 6, economia, logística e resgate ligados, semente 5, 380 s, sem exceção): nível 1 aos ~120 s nos dois lados; antiaérea fixa por lado 1 → 2 (60 s) → 3 (120 s); ninhos prontos 1 por lado aos 20 s (antes do plano começar), 2 no lado 1 aos ~240 s e no lado 0 aos ~370 s; minas 14 e 7 aos 300 s; nenhum posto anticarro; a poupança aparece no diário ("a economia poupa 40 de energia e 60 de metal", "15 e 25", e "300 e 400" para a cúpula aos 287 s). Não dá para separar o que é do AFP do que é dos sapadores/postos próprios só por essas contagens.

## Ainda não testado
- A medição antes/depois (página de `main` antes do PR contra esta) por minuto e por lado em 15 min ou mais, nas duas épocas. Roteiro: `measure.js` do histórico da tarefa, ou `PART=2` de `p-enp.js` (pasta `ag3/proof` de cf-pol-testes-a), que já conta obras k 3-6, minas, antiaéreas fixas e o `C.afp.fl`.
- A reconstrução de obra perdida: o roteiro derruba aos 300 s as obras do tipo de um item que o AFP marcou como feito (`A.have`) e espera o "perdido; refazer" e a nova ordem `AFP.redo` (120 s) depois; na partida medida nenhum item estava em `A.have` aos 300 s, então nada foi derrubado. Precisa de partida mais longa (8-10 min) ou de um cenário no `field` (sugestão em `tests/afp.js`).
- A antiaérea fixa saindo da reserva depois de `d.miss.aaf`, os campos minados pelas células de tráfego (M1 `t`), o ninho no gargalo (nível 2), o efeito da poupança na produção (o `ecoAI` segurando `make`).
- Online com o anfitrião num navegador, e o custo por quadro do plano.
- Por causa da trava de memória da tarefa (um processo pesado por vez, 5 min cada) não deu para rodar de novo as suítes listadas abaixo; ver a linha de base (`logs-base/_summary.txt` da tarefa).

## Como testar depois
```
SECS=240 node tests/aid.js
node tests/afp.js
node tests/orders.js
node tests/w13.js
SECS=60 node tests/tmap.js
node tests/forts.js
node tests/posts.js
node tests/sappers.js
node tests/production.js
SECS=300 node tests/campaign.js
node tests/eco-war.js
```
No jogo: "Assistir", Tab, diário do general: "Plano de fortificação" e as obras perto da cidade-sede.

## Riscos
- Tirar esquadras de linha ou de guarda por até 8 min pode enfraquecer a defesa dos pontos; a poupança pode atrasar a reserva e, junto com a da cúpula, deixar a engenharia de fortificação (ENP) sem dinheiro no começo da partida (ver `cf-engenharia-pontos.md`).
- `fcap` vale só para trincheiras e parapeitos: um teste que esperava `fcap` para um posto recebe `postcap` ou `ok`.
- Um campo minado não fica na estrada a menos de 1350 m da própria base (`SAP.base`).
