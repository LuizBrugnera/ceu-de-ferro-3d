# M6 Memória e imprevisibilidade: o que mudou e o que não foi testado

Tarefa `cf-m6-memoria`, pacote M6 da proposta de manobra do general (D8 = A: sorteio com temperatura pela personalidade e dificuldade + memória de abordagens). Fica em cima do M2 (abordagens), M3 (procedimentos), M4 e M5.
Pela regra do capitão ("implemente tudo sem testes e documente o que não foi testado"), **nada disto foi testado em partida**.

## O que mudou (`Céu de Ferro 3D.html`)

Seção nova `MM` logo antes de `function boot()`, e poucas linhas trocadas em `prPick`, `cmdManJob` e `m5Lg`.

- **Memória das abordagens** (`S.gmem[t].a`). Chave: objetivo (posição) e setor do anel (o `s` da abordagem, 8 setores).
  - Assalto que falhou: −0,3. Objetivo tomado (ou `cons`): +0,15. Meia-vida de 10 min. Guarda usos, sucessos, falhas e baixas.
  - O `prPick` multiplica a nota de cada procedimento por 1 + esse valor (média das abordagens que o assalto usa), entre 0,25 e 1,4. O diário mostra "memória: falhou por ali (×0,7)".
  - O reconhecimento (P12) que achou uma abordagem defendida dá −0,15 a ela.
  - Um P1 abandonado (`prFail`) conta falha do flanco na hora. Se virar frontal, o resultado final vai para o eixo.
  - Ao fim de cada assalto o diário diz "Memória: o assalto a X pela abordagem a N° deu certo/falhou".
- **Sem repetir** (`S.gmem[t].h`, `mmBan`). A mesma abordagem não sai pela terceira vez seguida para o mesmo objetivo, salvo se uma das duas últimas deu certo.
  - Os procedimentos por ela ficam com nota 0.
  - O frontal (P6) vai pela abordagem mais barata que não esteja vetada (`mmP6`).
  - Se tudo estiver vetado, vale a nota de antes.
- **Temperatura no sorteio** (`mmW`). O peso deixa de ser nota² e passa a ser nota^(2/τ).
  - τ vem da personalidade: Blitz 1,6 e Guerrilheiro 1,7 variam mais; Retranqueiro 0,6 e Artilheiro 0,7 variam menos; Logístico e sem personalidade: 1 (igual a antes).
  - Vale no `prPick` (M3) e no `cmdManJob`.
- **Dificuldade** (`mmApN`). O `prPick` avalia 1 abordagem no Fácil, 2 no Moderado e todas (3) no Normal e no Difícil. A informação é a mesma (D9). A leitura dos hábitos já vinha do W17 (`DIF.look`).
- **Memória das manobras** (`S.gmem[t].m`, `mmMan`). Por tipo (`flk`, `inf`, `cut`...) e lugar (350 m). A manobra que não tomou o ponto: −0,25; que tomou: +0,1. A nota no `cmdManJob` é multiplicada por 1 + valor.
- **Logística** (`mmLgK`, `lgLost`, `m5Edge`).
  - Cada comboio guarda o eixo por onde foi (`c.mmRi`).
  - Comboio perdido: o eixo para aquele nó fica mais caro no `m5Lg` (×(1 + 0,6 × perdas)).
  - O trecho da rede onde caiu também fica mais caro no custo tático do M5 (×(1 + 1,5 × perdas)).
  - Meia-vida de 15 min. O sorteio de até +15% entre eixos parecidos já vinha do M5.
- **Engano** (finta no eixo, fumaça, reconhecimento em duas abordagens): já existia no M3 (P10, P12). Não mudou.
- **Backup do anfitrião**: `ecoPack` leva `mm` (idades, não horas). Se o pacote passar de 15.000 caracteres, vai sem a memória, porque o relay limita o `keep` a 16 KB. O `ecoUnpack` lê sem quebrar o resto: uma memória inválida é descartada.
- **Para outras camadas** (a de estratégia, testes): `mmView(t)` devolve a memória como objeto. O `gask ap` ganhou, em cada abordagem, `mm` (o valor) e `rep: 1` quando ela está vetada.
- `MM.on = 0` desliga tudo e volta ao sorteio por nota² (controle do A/B).

## O que rodou (smoke de ~1 min)

- `node --check` no script da página: ok.
- Servidor em 127.0.0.1, página no Chrome: nenhum erro novo no console (só o 404 que já existia).
- No console da demonstração: `mmMove`, `mmBan`, `mmView`, `mmPack`/`mmUnpack` (ida e volta), `mmLgK` e `m5Edge` responderam sem erro. O `ecoPack` dá erro na demonstração porque ela não tem economia (`S.eco` nulo). Isso já acontece no `main`, não é deste pacote.

## O que NÃO foi testado

- Nenhuma suíte, nenhuma partida, nenhum A/B e nenhuma medição de custo.
- Não foi verificado se:
  - um assalto de verdade grava a memória ao terminar;
  - o veto da terceira vez aparece e o P6 muda de abordagem;
  - a temperatura muda a diversidade (meta da proposta: +1 bit de entropia e repetição pela metade);
  - o comboio perdido muda o eixo do próximo;
  - o `keep` com a memória passa no relay e volta no anfitrião novo.
- A chave do objetivo é a posição arredondada. Um objetivo que não é ponto pode cair em chaves diferentes a cada assalto.
- O "trecho" da proposta ((objetivo, setor e trechos)) ficou só setor: duas abordagens do mesmo setor por caminhos diferentes contam como a mesma.
- Na memória de manobras, `op.k` foi tratado como igual ao `c.k` do candidato, e o lugar é o ponto da op (`P`, `Q` ou `P2`). Manobras sem ponto (emboscada, bloqueio) não entram.
- Online: só o anfitrião grava (`!S.net || S.host`). O convidado não foi testado.

## Riscos

- **Fácil com 1 abordagem**: quase sempre frontal (P6) ou penetração. Pode ficar mais fácil que antes.
- **Temperatura alta (Blitz, Guerrilheiro)**: escolhe mais vezes a 2ª ou 3ª melhor, que pode ser bem pior.
- **Veto**: com só uma abordagem boa, o terceiro assalto pode ir por uma bem pior. Nesse caso o frontal vai pela mais barata das outras.
- **Logística**: o eixo com perdas pode ficar caro demais e o comboio dar volta muito maior. Só se escolhe entre eixos de até +15% no `m5Lg`, mas o `m5Edge` vale para toda viagem tática dos veículos da IA.
- **Tamanho do `keep`**: o limite de 15.000 caracteres foi escolhido sem medir o pacote real de uma partida longa.
- **Testes antigos** que conferem o sorteio exato do `prPick` ou do `cmdManJob` podem mudar com a temperatura, se a partida sortear personalidade.

## Como testar depois

```sh
node tests/approaches.js; node tests/campaign.js; node tests/man-a.js; node tests/man-b.js; node tests/man-c.js
node tests/personality.js; node tests/general.js; node tests/gen-cmd.js; node tests/eco.js; HOST=127.0.0.1 node tests/eco-online.js
```

Partidas IA × IA de 20 min ou mais, nas duas épocas, com `MM.on` 1 e 0 (scripts do M2 em `~/firstmate/data/cf-m2-abordagens/probe/`). Conferir:

- no diário, "Memória: o assalto a ..." e "memória: falhou por ali";
- `mmView(0)` e `mmView(1)` no fim: usos, falhas e veto por objetivo;
- entropia das abordagens por objetivo (eventos `ap` do M0) e repetição de (objetivo, setor), com e sem memória;
- com personalidades Blitz × Retranqueiro: a Blitz deve variar mais de procedimento (`C.prEv` e o diário);
- comboio perdido: o próximo para o mesmo nó vai por outro eixo, quando houver;
- online: anfitrião sai no meio da partida e o novo continua com a memória (`S.gmem` igual depois do `ecoUnpack`).

Teste de cenário sugerido (`tests/memoria.js`): dois assaltos seguidos que falham pelo mesmo flanco → o terceiro não usa esse setor; um sucesso no meio → pode repetir; `MM.on = 0` → igual ao M3.
