# Linha de base do cérebro (P6)

`cerebro-base.json` é a IA de hoje com o cérebro novo **desligado** (`BRAIN.on = 0`), medida pela seção `CEREBRO: medicao` da página. Cada pacote do cérebro (P1 soldado, P2 posição, P3 líder, P5 falas, P7 honestidade) compara o seu A×B com ela:

```
nice node tools/balance.js --torneio N --brain ab --min 10 --nobudget --jobs 4 --save <pasta> --json <arquivo>
nice node tools/balance.js <pasta> --ref tools/ref/cerebro-base.json
```

O arquivo é o `--json` de um `--brain ab`. Com `--ref`, vale a metade `a` (desligado).

## Como foi jogado

- 2026-11-20, no branch `fm/cf-p6-medicao` sobre o main `2ed8052`, nesta máquina com `nice` (não no elrei).
- `node tools/balance.js --torneio 2 --docs balanced --brain ab --min 10 --nobudget --jobs 4`: 2 partidas IA × IA por braço, uma em 1944 (semente 1) e uma na época moderna (semente 2), balanced × balanced, 10 min de relógio. Levou 14 min e 45 s de relógio, com 4 núcleos.
- Rodado uma vez e curto, pela regra do capitão. É pouco para conclusões de balanceamento. Serve de régua: os números de cada medida e a prova de que o instrumento é estável.

## O que deu

**Os 2 pares jogaram exatamente a mesma partida.** Nenhum código lê `BRAIN` ainda, e a medição não muda a batalha (`tests/brain-drills.js` também confere isso). As duas colunas são iguais. Os dois lados estão somados.

| Medida | Meta | Cérebro desligado |
| --- | --- | --- |
| Vitórias do lado 0 (das decididas); empates; duração | sem regressão | 50%; 0; 10 min |
| Eficiência de tíquetes (destruído / pago); tíquetes em perdas | sem regressão | 0,8; 91% |
| Tempo exposto sob fogo: soldado-min no aberto com inimigo conhecido a ≤ 400 m (do tempo em contato) | −50% | 4,4 (49%) |
| "Bot no meio do nada": soldado-min parado no aberto, sem tarefa, inimigo conhecido perto | ~0 | 1,1 (12%) |
| Tiros recebidos: de um lado protegido; ameaça desconhecida; conhecida e ignorada | protegido sobe; conhecida e ignorada perto de 0 | 1%; 10%; 89% (199) |
| Reação ao 1º tiro: mediana até o abrigo; até atirar de volta (reações; já abrigados) | 0,3–1,5 s; ≤ 2 s | > 8 s; > 8 s (12; 8%) |
| Fogo e movimento: movimento em contato com a outra equipe atirando | ≥ 70% | 6% |
| Lances sob fogo: mediana da duração | 3–6 s | 3,8 s (13) |
| Dispersão: vizinho mais perto em contato (média; ≥ 5 m); explosões com 2 ou mais baixas | ≥ 5 m; menos | 8,3 m; 48%; 15 de 33 |
| Granadas: ameaçados que escaparam | ≥ 70% | — (nenhuma granada de mão nestas partidas) |
| Feridos: socorridos; socorristas mortos por socorro | sobe; ≤ 0,3 | 63%; 0 (16 caídos) |
| Liderança: sucessão; esquadras na missão 60 s depois | ≤ 4 s; ≥ 60% | 0 s; 78% (13 líderes perdidos) |
| Moral por partida: debandadas; rendições; prisioneiros | > 0 e plausível | 3; 0; 0 |
| Falas por minuto por esquadra em contato | 2–6 | — (anulado, ver abaixo) |
| Custo da IA por quadro | ≤ 4 / 8 ms | — (`--nobudget`: medir numa rodada curta à parte, sem ele) |

## Atenção

- **Falas anuladas.** Na rodada, o contador somava as falas de todas as esquadras e dividia só pelo tempo das que estavam em contato, o que deu 87 por minuto. O erro foi corrigido depois, sem refazer o torneio (regra: uma vez, curto). No JSON, `sum.fl` e `raw.fl[0]` estão anulados, e a coluna de referência mostra "—".
- **Pouco contato.** 9 soldado-min em contato em 4 partidas de 10 min: o relógio curto corta a partida perto do primeiro choque. Um torneio de partidas Curta (30 min) mede mais contato. Recomendo regravar com mais partidas quando houver máquina livre, fora do elrei.
- **"Sucessão 0 s" é a regra de hoje.** Quem lidera é o primeiro homem de pé, que assume na hora. Isso não mede uma sucessão de verdade; o P3 (`q.lid`) muda isso.
- Se o P2 trocar `medProt` (o que conta como "no aberto"), as medidas de exposição mudam de definição, e esta referência precisa ser gravada de novo.
