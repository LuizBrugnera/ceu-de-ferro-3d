# General 2, G4: a operação (alocador, cronograma, reunião e portões)

Tarefa `cf-g2-g4-operacao`. Decisão do capitão de 2026-11-20 ("1A, 2A, 3C"): adotar o General 2 da pesquisa de IAs abertas (`/home/luiz/firstmate/data/cf-ia-opensource/report.md`, §5.1 item 2 e a linha G4 da §6). Este pacote é a camada de **operação**: entre o que o lado vai atacar (o G3 ainda não existe; por enquanto os alvos de hoje, `cqAim`, e a sede do #167) e as esquadras que fazem.

Tudo numa seção nova do HTML, `/* ---------- GENERAL 2: operacao (G4 ...) */`, logo antes da cena 3D. O código antigo só é tocado por ganchos. `G4.on = 0` volta exatamente ao general de antes.

## O que mudou

- **Alocador único em dois passes** (`g4Pool`, por baixo do `apPool`: o pool do assalto, o da sede e o da reposição).
  - Passe 1, a defesa primeiro (`g4Keep`): em cada ponto que o lado segura e na base, ficam as esquadras que o seguram, até o perigo dele (1 esquadra, mais 1 para cada `G4.def.sq` = 8 de força inimiga conhecida a até `G4.def.r` = 900 m); e fica todo posto em contato (inimigo conhecido a até 600 m).
  - Passe 2, o plano com as sobras: toda outra esquadra que combate (`G4.jobs`: assalto, ocupação, patrulha e os postos de linha, guarnição, observação, guarda de instalação, milícia; nunca engenharia, guarnições, morteiro, emboscada, guarda da base, guarnição da sede), inteira o bastante, pela hora de chegada à reunião do assalto (ETA: a caminhada a `G4.run` = 3,5 m/s, `G4.wind` = 1,35 vez a linha reta; um posto paga `G4.lend` = 90 s pelo que deixa), até `G4.eta` = 900 s, a mais cedo primeiro. Pega quantas a razão da doutrina pede contra o que o lado acredita que está lá, mais 15%: no mínimo 2, no máximo `G4.max` = 5.
  - Antes eram os predicados `FREE` (só assalto, ocupação e patrulha), e os postos só emprestavam depois de 180 s quietos, e o pool levava **todas** as livres ao alcance para um assalto só. Agora é uma regra só para o plano (PurpleWave: defende primeiro e ataca com o resto; FreeOrion: a escada).
- **A crença do lado no objetivo** (`g4Foe`): o que ele sabe a até 500 m agora, a memória do que já viu ali (cai a 0,9 de si a cada minuto, como a memória da ameaça do FreeOrion) e, num ponto inimigo onde ninguém olhou, o palpite de antes (`CMD.guess`). Nunca a verdade: a seção não lê `S.men` nem `S.units` (o teste `tests/brain-honesty.js` passou a varrer as seções `GENERAL 2:`).
- **Cronograma** (`g4Sched`, depois do `atkAp`): cada esquadra do assalto tem a sua ETA até a reunião, pelo caminho dela. Quem tem 1,5 km ou mais de caminhada pede carona na hora ao `EMB` (#160). A hora esperada da reunião é a ETA do mais lento, e o prazo (`op.formT`) é `G4.grace` = 90 s depois dela, entre 150 e 1.200 s. Antes, o prazo era a caminhada do mais longe a 4 m/s + 60 s, até 900 s.
- **Portões com histerese** (`g4Gate`, antes do `form` do `OPS.atk`):
  - **lança por força**: com 65% da força na reunião (e 2 esquadras pelo menos), o assalto segue (CircuitAI e Petra reúnem por força, não pelo relógio);
  - **no prazo**, segue com 50% da força;
  - **senão**, enquanto as atrasadas ainda se aproximam (60 m nos últimos 45 s), o prazo passa para a nova ETA delas, até 2 vezes;
  - **reunião sob fogo** (uma esquadra lá atingida nos últimos 20 s, com inimigo conhecido a até 350 m): recua 350 m pela abordagem, uma vez (BoneCrusher); na segunda, o assalto é cancelado.
- **Último ponto seguro** (`g4Rally`, depois do `apBuild`): a reunião de uma abordagem onde o mapa tático do lado diz que o inimigo vê (`v` > 0,3) ou está (`f` > 0,3), ou com inimigo conhecido a até 450 m, recua pelo caminho até a primeira célula que não é nada disso, até 1,7 km do objetivo (o `setRallyPoint` do Petra). Uma reunião segura fica onde o M2 pôs.
- **Esforço principal pelo flanco** (`g4Div`, depois do `prPick`): em fixar e flanquear, fica 1 esquadra fixando pelo eixo (a mais perto da reunião do eixo) e a manobra leva o resto; no envolvimento, 1 fixando e o resto dividido entre as duas manobras. Antes eram 1 (2 com 4 ou mais) na manobra e o resto fixando: o flanco era o elemento menor.
- **As frentes de uma campanha não dividem esquadra** (`campAI` recebia os pools de cada frente da mesma lista).
- **Medição**: o diário diz cada decisão ("Cronograma do assalto a X", "N% da força na reunião, segue", "prazo estendido", "sob fogo: recua"). O evento `ap` da análise ganha `g4` [hora esperada da reunião em s desde a abertura, extensões, recuos, caronas pedidas, fração da força na reunião ao sair].
- **Interruptor**: `G4.on = 0`; no torneio, `node tools/balance.js --torneio N ... --g4 0|1`.

## Ganchos usados

`apPool`, `apBuild`, `prPick`, `atkAp`, `OPS.atk`, `campAI`, `anaMvEnd`, `anaPush`. Nenhuma linha antiga mudou. `tools/balance.js` ganhou `--g4 0|1`. `tests/brain-honesty.js` passou a varrer também as seções `GENERAL 2:`.

## O número (medido)

(preencher com o torneio)

## O que o número NÃO cobre

(preencher)

## Como testar de novo

```sh
# torneio antes × depois (mesmas sementes), com nice, nunca no elrei
nice -n 10 node tools/balance.js --torneio 12 --era all --len 0 --eco --lg --rec --nobudget --mapv 11 --seed 1 --jobs 12 --save <dir> --json <json>
# A×B na mesma árvore: --g4 0 e --g4 1
```
