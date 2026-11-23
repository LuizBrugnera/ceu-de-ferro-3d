# cf-lideres P0: o contrato do cérebro (o que ainda falta testar)

O P0 é a seção `CEREBRO: contrato (P0, cf-lideres)`: `BRAIN`, `ord`/`rel`, `brainOrd`, `brainRel`, as estruturas `q.bb`, `q.lid`, `q.eq`, `m.rf`, `m.mo` e `m.tar`, `brainHook`, `brainTick` e `brainEv`.

Testado:
- **Pelo autor**: `tests/brain.js`, que é o "pronto quando", e `tests/brain-falas.js`, os dois ok.
- **Na linha de base do `main`** (cf-pol-testes-a): `brain-falas` passou.
- **Em cf-pol-testes-a**: nada a mais rodou para o P0.
  - A trava pesada compartilhada por 4 agentes deixou poucas rodadas, e o P0 é seção `CEREBRO`, que esta rodada não podia mexer.
  - O exercício online foi escrito e não rodou: `/home/luiz/secondmate/data/cf-pol-testes-a/ag4/proof/p0-online.js`, anfitrião e convidado pelo servidor de verdade, `PORT_T`.

**Nota (do líder de cf-pol-testes-a)**: o evento `pel-forma` saía com `k` igual ao tipo do pelotão. `brainEv`, `medCb` e `flCb` montam o evento de análise com `Object.assign({ k: 'cb', ... }, d)`, então o `d.k` (`def`, ou `veiculo` de uma cobertura) apagava o tipo `cb`. O servidor recusava o lote inteiro: a partida online perdia o fim e o resumo, e `tests/ana-online.js` falhava no `main`. Foi consertado na entrada da análise (`anaPush`, fora do CEREBRO), no PR de 3 lados. A origem em `brainEv` continua.

## O que ainda não foi testado
- **A suíte inteira** (`tests/all.sh`), torneios e partidas longas.
- **Online**: o convidado não roda nada disso (`brainSim`). Conferir que o console fica limpo e que `S.squads.every(q => !q.eq)` no convidado. Rodar `PORT_T=<porta> node /home/luiz/secondmate/data/cf-pol-testes-a/ag4/proof/p0-online.js`.
- **`BRAIN.on` 0 contra 1 numa partida**: muda a partida, e isso é esperado. Falta o A/B em torneio (`tools/balance.js --brain ab`) e a comparação com a partida de antes de todos os pacotes do cérebro.
- **Custo**: o custo medido dentro da partida numa máquina carregada (o teste mede só o laço, melhor de 5).
