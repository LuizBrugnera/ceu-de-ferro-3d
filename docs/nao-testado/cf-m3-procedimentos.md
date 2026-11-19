# M3 Procedimentos de manobra: o que mudou e o que não foi testado

Tarefa `cf-m3-procedimentos`, pacote M3 da proposta de manobra do general (D1-D12 = A). Fica em cima das abordagens do M2 (`AP`, `atkAp`).
Pela regra do capitão ("implemente tudo sem testes e documente o que não foi testado"), **nada disto foi testado em partida**.

## O que mudou (`Céu de Ferro 3D.html`, bloco `PR` logo depois do M2)

- **Escolha do procedimento** (`prPick`). Roda quando a IA abre um assalto pelas abordagens (`atkAp`) e não é uma simples ocupação de ponto vazio (`walk`).
  - Nota = valor do objetivo × chance (razão, exposição, ângulo) − custo (minutos da maior caminhada, perdas esperadas pela exposição).
  - A nota é multiplicada pelo gosto do lado (`PR.pw`: o `w` da personalidade, o `MANW` da doutrina e o `taste` da partida).
  - Sorteio entre os 3 melhores, com peso no quadrado da nota. O diário registra "Procedimento do assalto a X: ... (nota; também avaliados ...)". `C.prEv` guarda a última avaliação.
- **P1 Fixar e flanquear (padrão)**. Exige 2 ou mais esquadras e uma abordagem a ≥ 45° do eixo, com exposição ≤ 0,8 × a do eixo + 15 pontos e comprimento ≤ 2,2× (`prFlankOk`; eram 60°, 0,6 × + 10 e 1,8× até o cf-manobra-fix).
  - A fixação vai para a reunião do eixo; a manobra (1 esquadra, ou 2 com 4 ou mais) vai para a do flanco.
  - Reunidas, a manobra anda em silêncio até a posição de assalto e a fixação ocupa em silêncio a base de fogo, a 300-450 m (estado novo `mv`).
  - A hora H é a chegada da manobra. Na hora H há fogo e fumaça, com a cortina virada para o lado da manobra. A manobra assalta e a fixação atira da base (`overwatch`). A fixação entra quando o combate chega ao objetivo.
  - O P1 é abandonado se a manobra perder mais de 50% ou atrasar mais de 90 s além da caminhada prevista. Nesse caso, ataque frontal com razão ≥ 3; senão, o assalto é cancelado.
- **P2 Envolvimento**: razão ≥ 1,6, 3 ou mais esquadras e dois flancos a ≥ 120° entre si. Leva duas manobras e a fixação. Com 4 ou mais esquadras, uma fica de segurança na rota de fuga, a 600 m atrás do objetivo. Se uma manobra atrasar, segue como P1.
- **P5 Penetração**: razão ≥ 2, 3 ou mais esquadras e uma abordagem com ≤ 25% à vista e força inimiga média ≤ 0,5. Todas as esquadras vão por ela.
  - É cancelada se a brecha fechar antes da hora H: a exposição de agora fica 25 pontos acima da do plano.
  - Tomado o ponto, uma esquadra explora até o gargalo mais forte (camada K), de 400 a 1.500 m além dele.
- **P6 Frontal (regra)**: só entra com razão ≥ 3 ou quando nada mais serve. Todas as esquadras vão pela abordagem do eixo.
- **P12 Reconhecimento que puxa**: em assalto grande (4 ou mais esquadras) ou contra ponto forte (6 ou mais conhecidos).
  - Duas esquadras vão às posições de assalto do eixo e de outra abordagem (estado `rec`); o resto espera na reunião do eixo.
  - Uma abordagem conta como defendida quando a esquadra levou tiro, há inimigo conhecido a 350 m ou ele está a menos de 250 m.
  - Depois: P1 pelo flanco livre; senão, frontal se o eixo estiver livre ou com razão ≥ 3; senão, o assalto é adiado.
- **P10 Finta**: junto do P1, do P2 e do P5, se houver fumaça disponível. No preparo, fumaça e uma missão de fogo na abordagem que o assalto não usa.
- **P3 Desbordamento**: manobra nova `trn`, pelo `genCmd` (`man k=turn`, também na descrição do MCP).
  - Gatilho: ponto inimigo forte (razão < 1,2) cuja ligação a pé à base inimiga passa por um gargalo (K ≥ 0,5) com pouca força conhecida (f ≤ 1), de 0,5 a 3,5 km do ponto.
  - 2 esquadras vão até lá correndo e em silêncio. A carona de caminhão (`MAN.ride`) vem sozinha quando a caminhada é longa.
  - Elas seguram o gargalo, e o ponto passa a ser o primeiro do `cmdAttack` (`C.pref`).
  - Acaba quando o ponto é tomado ou muda de mãos, ou quando o inimigo no gargalo é mais que o dobro.
- **P4 Infiltração pelas abordagens**: o `MANG.inf` usa a abordagem menos vista do ponto (≤ 30%) quando o plano já existe. Na primeira vez ele só pede o plano; sem plano, usa o `footPath` de antes.
- O evento `ap` da medição (M0) ganhou o campo `pr`, com o procedimento escolhido.
- `PR.on = 0` volta ao assalto do M2, para o A/B.

## O que NÃO foi testado

- Nada rodou em partida: nem um assalto com procedimento, nem o desbordamento, nem a infiltração pelas abordagens. Não sei se algum P1 chega à hora H.
- Nenhuma suíte foi rodada (`approaches`, `campaign`, `man-a/b/c`, `general`, `drills`, `personality`, `field` ...), nem o A/B, nem custo por quadro.
- Só se verificou que o script principal compila (`node --check`) e que a página abre no Chrome sem erro de JavaScript (com o servidor em 127.0.0.1).
- Online: os estados novos (`mv`, `rec`) e o `trn` só rodam no anfitrião. O convidado não foi testado. As chaves novas do relay (`ap`, `ap2`) são do M7 e não entraram.

## Riscos

- **Tempo**: P1 e P2 somam a fase `mv` à reunião. Se a caminhada for longa, o assalto pode ficar minutos parado, e a regra dos 90 s pode cancelar muitos.
- **Campanhas**: o `campTick` espera frentes em `form`, não em `mv`/`rec`. Uma frente secundária também pode sortear um P1 quando só precisava fixar.
- **Base de fogo**: é a célula da abordagem do eixo mais perto de 375 m. Pode cair em lugar sem visada; a fixação atira do que vê.
- **Segurança do P2**: a 600 m atrás do objetivo, em linha reta. Pode cair perto de outro ponto inimigo.
- **P12**: a esquadra de reconhecimento que achou resistência fica como fixação onde está, possivelmente sob fogo.
- **P5**: a esquadra da exploração sai da operação e fica parada no gargalo até ser chamada de novo.
- **P3**: o `netPath` a pé e o gargalo usam só o mapa do lado. As duas esquadras saem dos postos (`manFree`), e a linha afina.
- **M5 (blindados fora do trilho)**: o `m5Atk` só chama blindados nos estados `form`, `prep` e `screen`. Nos estados novos (`mv`, `rec`) não chama, e o apoio pode chegar tarde. O M4 e o M5 entraram no `main` junto com este pacote, e a combinação não foi vista em partida.
- **Sorteio**: `Math.random`, como o `cmdManJob`. Repetição e memória são do M6.

## Como testar depois

```sh
node tests/approaches.js; node tests/campaign.js; node tests/man-a.js; node tests/man-b.js; node tests/man-c.js
node tests/drills.js; node tests/personality.js; node tests/field.js; node tests/general.js; node tests/gen-cmd.js
```

Partidas IA × IA de 12 min ou mais nas duas épocas, com `PR.on` 1 e 0 (os scripts do M2 em `~/firstmate/data/cf-m2-abordagens/probe/`). Conferir:

- no diário, "Procedimento do assalto a ..." e a distribuição entre P1/P2/P5/P6/P12 (`C.prEv`);
- se o P1 passa por `mv` → `prep` → `go` e a manobra chega a ≥ 60° do eixo (metas da proposta: flanco ≥ 35%, assaltos com manobra ≥ 50%);
- quantos P1 são abandonados por atraso ou perdas (`PR.late`, `PR.lost`);
- se o `trn` aparece (`man` no diário: "Desbordamento") e se a carona funciona;
- `AIB.stat()` e `APB.stat()`.

Teste de cenário sugerido (`tests/procedures.js`): uma vila com rua paralela, que deve dar P1 com chegada ≥ 60°; a manobra derrubada no meio, que deve virar frontal ou cancelar; razão 3:1 sem flanco, que deve dar P6; um ponto forte com gargalo fraco atrás, que deve dar `trn`.

## Junção com o M7 (merge do `main`, não testado)

O M7 (ferramentas de manobra para o jogador e o MCP) também define o `trn` ("Desbordamento", `man k=turn`). Na junção ficaram os dois:

- a escolha da própria IA (`MANG.trn`, com `R.res.ch`) abre o `trn` do M3 (`MANO.trn` do M3, op com `op.Q`, tick `OPS.trn` do M3);
- uma ordem de uma pessoa, do MCP ou do `send_command` abre o `trn` do M7 (`m7Hold`, `m7HoldOps`: cavar no entroncamento ou cabeceira de ponte);
- `MANT.trn` fica o do M3 (`w` .9, `cd` 180, `ratio`, `k`, `f`, `d`...): o M7 não o sobrescreve mais. Efeito: depois de um `trn`, uma ordem de `turn` espera 180 s em vez de 20 s.

Conferir: o AI abre `trn` pelo caminho do M3; `order_maneuver` com `turn` abre pelo do M7; os dois encerram pelo tick certo. O `mcp-general.js` também tinha marcadores de conflito já commitados no branch do PR; ficou a linha do `main` (que já lista `turn`).
