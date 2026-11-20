# cf-lideres P0: o contrato do cérebro (não testado além de `tests/brain.js`)

Este é o pacote P0 da arquitetura de cf-cerebro-pesquisa (seção 2.5): os objetos e o relógio que as camadas do cérebro compartilham.
Nenhuma decisão é tomada aqui. O líder que pensa (P3) vem num PR separado.

## O que mudou

Tudo no `Céu de Ferro 3D.html`, numa seção só, `CEREBRO: contrato (P0, cf-lideres)`, logo antes de `CEREBRO: trincheiras-tuneis`.

- **Uma só cópia do contrato.** A cópia que o P5 (#130) trouxe foi tirada, e ficou esta.
  - `fala` chama o `brainSay` do P5.
  - O evento `cb` usa o formato do P5 (`st` é o subtipo).
  - A chave de contato no quadro-negro é a do P5 (`flId` do contato).
  - Se a fala do P5 cria `q.bb` antes (`flBB`), o P0 só completa o que falta.
- **`BRAIN`**: liga e desliga (`on`), o alcance da voz e do sinal, o atraso de sucessão e as cadências por camada:
  - líder: 1 Hz;
  - equipe: 2 Hz;
  - soldado por nível de detalhe (`[5, 2, 0, 0]` Hz para L0 a L3);
  - também os tempos de relato por voz, sinal e rádio, e o limite de eventos `cb` por partida.
- **`ord`, `rel`** como na pesquisa. `rel` ganhou `o`: o contato de que o relato fala, quando o soldado sabe qual é. É a chave do quadro-negro.
- **`brainOrd(destino, ordem)`**: entrega a ordem a uma esquadra (`q.bb.ord`), a uma equipe ou a um soldado (`.tar`). É uma ordem por destino, e a nova substitui a antiga.
- **`brainRel(q, relato)`**: o relato chega ao líder pelo canal que existir.
  - Pela voz até 45 m, depois de 0,6 s.
  - Pelo sinal até 120 m com visada, depois de 1,2 s.
  - Pelo rádio se a esquadra está na rede de comando, depois de 3 s.
  - Sem canal, o relato se perde.
  - Um contato que chega entra em `q.bb.cont`.
- **Estruturas criadas onde a batalha é simulada**, por embrulho de `addSquad` e `addMan`, e pelo `brainTick` para qualquer esquadra sem elas:
  - `q.bb`, `q.lid` (o primeiro homem de pé) e `q.eq`: A é os números pares depois do líder e B os ímpares, a mesma divisão dos procedimentos;
  - `q.tec`;
  - `m.rf`, `m.mo`, `m.tar`.
  - Quando outra parte do jogo muda os homens da esquadra (sapador tirado, guarnição dividida, homem trocado), as equipes são refeitas (`brainRoll`/`brainTeams`). O líder fica enquanto for da esquadra. A sucessão de um líder caído é do P3.
- **`brainHook(camada, f)`**: as camadas são `lid`, `eq`, `sold` e `rel`, e o hook roda na cadência da camada.
  - O líder também pensa na hora quando chega um evento (`q.bb.ev`).
  - O nível de detalhe do soldado só é olhado quando chega a vez dele.
- **`brainTick`** roda no `step`, só no anfitrião ou no solo.
  - O tempo dele entra no medidor da IA (`AIB.u`).
  - Ele também tem um medidor próprio: `AIB.stat()` traz `brain`, `brainNow` e `brainMax`.
  - O laço não aloca nada, para que nenhuma coleta de lixo caia dentro dele.
- **`brainEv(k, lado, dados)`**: evento `cb` de um lado sem soldado próprio (ordem dada, relato enviado). A decisão de um soldado continua sendo o `flCb` do P5.
- Ganchos no código antigo (todos por embrulho): `addSquad`, `addMan`, `step` e `AIB.stat`.
- `tests/brain.js` é novo e está na lista do `tests/all.sh`.

## O que rodou

- `tests/brain.js`, que é o "pronto quando" do P0, com 40 s de IA × IA nas duas eras: tudo ok.
  - Com `BRAIN.on = 0`, nada é criado e ganchos vazios não mudam a partida, até o último dígito e o sorteio.
  - Com `BRAIN.on = 1`, ganchos vazios também não mudam nada.
  - Todas as esquadras têm quadro-negro, líder e duas equipes.
  - A ordem, o relato por voz (com atraso), o relato fora de alcance (precisa do rádio) e a fala (só depois de uma decisão, regra do P5) funcionam.
  - Custo do `brainTick`: 0,002–0,006 ms por passo com 35 esquadras.
- `tests/brain-falas.js` (o do P5) com o contrato unificado: tudo ok.
- Smoke no navegador: o servidor sobe, a página carrega e a demonstração IA × IA roda. As 30 esquadras têm líder e equipes. No console só aparece o 404 que já existia. O cérebro mede 0,03 ms por quadro.

## O que NÃO foi testado

- A suíte inteira (`tests/all.sh`), torneios e partidas longas.
- Online: o convidado não roda nada disso (`brainSim`). Não foi conferido se nada quebra num convidado.
- **`BRAIN.on = 1` contra `0` muda a partida, e isso é esperado.** O P5 (falas ouvidas) e o movimento por equipe (#129) usam as estruturas quando elas existem. Por isso o teste prova a partida igual só dentro de cada valor de `BRAIN.on`. A comparação com a partida de antes de todos os pacotes do cérebro não foi feita.
- A média medida dentro da partida passa de 0,1 ms nesta máquina (load average ~50, com picos de coleta de lixo). O teste confere o custo do próprio laço (melhor de 5 rodadas), não o da partida.

## Riscos

- O tempo do cérebro agora entra no `AIB`, e o medidor de população (`gpMeter`) lê o `AIB`. Numa máquina no limite, isso pode cortar a população um pouco antes. Pouco provável, porque são poucos µs.
- `brainRoll` refaz as equipes quando a lista de homens muda. Uma regra que mude `q.men` sem mudar o tamanho nem os homens não é vista. Hoje não há nenhuma assim.
- `rel.o` é uma extensão do contrato da pesquisa. Os outros pacotes podem ignorá-la.

## Como testar depois

1. `node tests/brain.js` (2–4 min; `SECS=20` encurta).
2. `node tests/brain-falas.js` e as suítes que leem `q.eq`: o movimento por equipe e as dos procedimentos (`tests/drills.js`, `tests/inf-drills.js`).
3. Online: um convidado numa sala com IA. Conferir que o console fica limpo e que `S.squads.every(q => !q.eq)` no convidado.
4. A/B: `BRAIN.on = 0` contra `1` em torneio (`tools/balance.js`) quando o P6 trouxer `--brain`.
