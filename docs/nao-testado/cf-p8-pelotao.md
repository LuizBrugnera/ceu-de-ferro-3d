# cf-p8-pelotao: o pelotão (não testado além de um exercício curto)

Pedido do capitão: "um líder em cada unidade, que direciona também os NPCs e pensa também, as camadas de liderança". Arquitetura: cf-cerebro-pesquisa, pacote P8 (camada Pelotão, seção 2.2). Construído sobre o contrato P0 (#139), o líder de esquadra P3 (#143) e os procedimentos de assalto que já existiam (`PR`, `prPick`, `prGo`, `prH`, `prWay`, `prFlankOk`).

## O que mudou

Tudo no `Céu de Ferro 3D.html`, numa seção nova, `CEREBRO: pelotao (P8)`, logo antes da cena 3D. `PEL.on = 0` desliga e deixa tudo como antes.

- **O pelotão é uma entidade.** Todo assalto (`op.k = 'atk'`) com 2 esquadras ou mais ganha um `op.pel`. Os postos que seguram o mesmo ponto (2 ou mais) também, com a reserva quando ela está perto.
- **O líder é um soldado.** É o líder da esquadra da base de fogo, porque ele vê o objetivo e ouve a base. Se não houver, é o líder mais veterano. Aparece como "Ten. Nogueira" ("Cmt." nos Insurgentes).
- **Sucessão.** Quando o tenente cai, ou quando a esquadra dele sai da operação, o próximo líder de esquadra assume.
  - Leva de 2,5 a 5 s, 1,5× mais se ele não ouviu, não viu e não tem rádio. O teto é 8 s.
  - Ele fala "O tenente caiu! Eu assumo o pelotão!", e o diário e o general (pelo rádio) ficam sabendo.
  - Sem comandante, o pelotão não toma decisão nova.
- **Quadro do pelotão (honesto).** O pelotão só sabe o que os líderes de esquadra sabem (o `q.bb.cont` do P3). Isso chega pela voz, pelo sinal ou pelo rádio, com o atraso do canal.
- **Métodos como tarefas que esperam umas pelas outras** (van der Sterren). Cada tarefa também vira uma ordem do contrato (`brainOrd`) no quadro da esquadra.
  - **Fixar e flanquear** (PR p1 e p2): o general escolhe o procedimento e a hora H, como antes. Na hora H a manobra **não sai na hora**: segura onde está até o tenente **ouvir a base atirando** (um tiro da base nos últimos 6 s, a até 1.500 m dele). Aí ele grita "Base atirando! Assalto, vai!" e o pelotão dá a ordem de assalto que o PR tinha dado. Quando o assalto chega a 120 m do objetivo, a base desloca o fogo.
  - **Apoio pelo fogo + assalto** (todo outro assalto: p5, p6 e o assalto antigo): é a mesma trava. Com só 2 esquadras, onde o código antigo mandava as duas assaltarem, a última vira a base de fogo.
  - **Prazo da trava**: depois de 45 s sem fogo da base, o assalto sai assim mesmo. Isso é falado ("Sem fogo da base!"), registrado no diário e contado no evento `pel-assalto` com `apoio: 0`. Enquanto o assalto espera, o relógio de "sem progresso" do assalto fica parado, e o relógio do assalto só começa quando ele sai.
  - **Defesa com reserva**: os postos seguram e a reserva espera o sinal "inimigo fixado".
    - O inimigo está fixado quando há 2 contatos ou mais a até 350 m do ponto e os postos estão atirando.
    - Passados 20 s, se os homens dos postos e da reserva forem pelo menos 1,2× o número de contatos, o pelotão **pede ao general** o contra-ataque da reserva (`genCmd ctr`).
    - O general recusa quando a defesa não é da IA ou a reserva está ocupada.
    - O pedido se repete no máximo uma vez a cada 90 s.
- **Relato para cima**: cada passo vai ao general pelo rádio (`rep` do tipo `'pel'`, com o atraso da rede de comando) e para o diário.
- **O que se vê**: o cartão da unidade (`genCard`, também pelo MCP) e a câmera de comandante (`rtsBrain`) mostram o pelotão, o tenente, o método, o passo e a tarefa de cada esquadra.
- **Falas novas**: `pel-assumo`, `pel-base`, `pel-espera`, `pel-vai`, `pel-sem-apoio`, `pel-cessar` e `pel-ctr`.
- **Eventos `cb`** (a revisão conta por tipo): `pel-forma`, `pel-lider-caiu`, `pel-assume`, `pel-espera`, `pel-assalto` (com `apoio`, `ang`, que é o ângulo de flanco no objetivo entre a base e o assalto em graus, e `dt`, a espera), `pel-desloca`, `pel-fixado` e `pel-ctr`.
- **Ganchos usados**: `OPS.atk` (o mais externo), `killMan`, `manDown`, `genCard`, `rtsBrain` e `brainHook('lid')`. A seção não lê `S.men`, `S.units`, `S.bombs` nem `S.planes` (P7).
- **Teste novo**: `tests/brain-pelotao.js`, um exercício curto no sandbox, entrou no `tests/all.sh`.

## O que foi testado

Só o exercício curto `tests/brain-pelotao.js` (semente 9). Ele montou à mão um assalto p1 com 2 esquadras na hora H contra uma esquadra numa vila e verificou:

- o pelotão forma com o tenente;
- na hora H a manobra segura;
- o assalto nunca sai durante a espera;
- o assalto saiu com a base atirando, com flanco a 98°;
- o evento `pel-assalto` foi registrado;
- o cartão mostra o pelotão;
- o tenente morto: vaga, e o Cb. Moreira assume em 4,5 s, com linha no diário.

Fora isso, só o teste rápido: o servidor sobe e a página carrega no Chrome sem erro novo.

## O que NÃO foi testado

- A suíte `tests/all.sh`, torneios e partidas A×B. Em particular, `tests/brain.js` (o `BRAIN.on = 0` idêntico bit a bit) e `tests/brain-honesty.js` não foram rodados. A busca por `S.men|S.units|S.bombs|S.planes` na seção deu zero.
- **Um assalto de verdade numa partida**, com o general escolhendo o PR, a hora H vindo do `OPS.atk`, a rede de comando (CN) ligada e a ordem viajando pelo rádio (`q.cnP`).
- O **prazo de 45 s** (a base que não consegue atirar), o método **apoio** com 2 esquadras e o caminho em que a base morre durante a espera.
- A **defesa com reserva** inteira: a formação nos postos de um ponto, o "fixado" e o pedido de contra-ataque ao general.
- O custo no `AIB` (o pelotão pensa a 0,5–1 Hz, junto com os líderes).
- O jogo online: o convidado não roda o cérebro (`brainSim`), mas isso não foi verificado.

## Riscos que vejo

1. **Assaltos mais lentos.** Toda manobra agora espera a base atirar, até 45 s. Se a base raramente tem o que atirar (a posição dela longe demais para o fogo de área do `cmdArea`, que vai até `CMD.ow.rng`), os assaltos atrasam e chegam depois da fumaça. Ajuste por `PEL.fogo.max`.
2. **2 esquadras em assalto frontal**: uma delas agora fica na base em vez de assaltar. Isso dá menos peso no objetivo e pode mudar o placar dos torneios.
3. **CN**: quando a ordem de "segurar" ainda está no rádio, a liberação troca a ordem em trânsito pela de assalto (`q.cnP.O`). Se o CN tratar isso de outro jeito, a esquadra pode ficar parada até o prazo.
4. **Contra-ataque pedido pelo pelotão** pode sair mais cedo do que o general antigo faria, e gastar a reserva.
5. **O relógio do assalto** (`op.T += espera`) muda quando o assalto passa a "combate no objetivo" (o `age > 200`).

## Como testar depois

```sh
nice node tests/brain-pelotao.js                  # o exercício curto (SEED=… para outras sementes)
nice node tests/brain.js && nice node tests/brain-honesty.js && nice node tests/brain-lider.js
nice node tests/approaches.js && nice node tests/procedures.js   # os assaltos do PR com o pelotão no meio
nice bash tests/all.sh
# torneio A×B (fora do elrei): PEL.on 1 × 0 com as mesmas sementes; comparar vitórias, eficiência de tickets,
# eventos pel-assalto (apoio 1 × 0, ang, dt) e "fogo e movimento" (MED.mv) na seção Cérebro do AAR
```

Cenários para olhar na tela (câmera de comandante): um assalto p1. A manobra chega à posição de assalto e espera. Ouve-se "Base atirando! Assalto, vai!", e o cartão mostra "Pelotão: assalto com a base atirando (flanco a N°)". Depois, matar o tenente e ver "Eu assumo o pelotão!". Por fim, uma defesa de ponto com 2 postos e a reserva perto: deve aparecer "inimigo fixado nos postos" e depois o contra-ataque.
