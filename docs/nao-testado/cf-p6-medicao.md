# cf-p6-medicao: a medição do cérebro (P6 de cf-cerebro-pesquisa)

## Testado em e91a33a (cf-pol-testes-b, 2026-11-21): parte
- Navegador, Assistir em Hoje (3 lados), 3 min: os eventos `cb` do cérebro chegam à analytics (994 `acao`, 940 `ordem`, 470 `fala`, 358 `relato`, 288 `tec`, os do pelotão e do líder) e `anaReport(ANA.ev, 0).brain` vem preenchido para a seção Cérebro da revisão.
- `tests/brain-drills.js`: rodando nesta tarefa; o resultado vai no próximo lote do RESULTADO-B. A parte das granadas já passou (100% dos ameaçados escapam, meta ≥ 70%).
- **Continua sem teste:** a seção Cérebro desenhada no fim de uma partida, o online, o custo do medidor e o A×B sobre o main de hoje.

Pedido do capitão: soldados que pensam de verdade, com líder em cada esquadra e camadas de liderança, como no Defilade, feito do jeito certo e sem gambiarra. A pesquisa dividiu o trabalho nos pacotes P0 a P8. Este é o P6, a régua: os números que dizem se o cérebro novo (P1, P2, P3, P5...) deixou os soldados mais "gente", com o mesmo instrumento ligado e desligado.

## O que mudou

### `Céu de Ferro 3D.html`, seção `/* ---------- CEREBRO: medicao (P6) */` (na parte da simulação, depois da analytics da rede de comando)
- **Contrato (2.5).** A seção não declara nada do contrato. O `const BRAIN` está na seção `CEREBRO: contrato (P0)`, que o P5 copiou (#130). Um segundo `const BRAIN` seria um SyntaxError e derrubaria a página inteira. A seção só **lê** o que existir: `BRAIN.on`, `m.tar` (tarefa do soldado), `q.lid` (líder), `q.eq` (equipes).
- **Medidores da seção 4 (`MED`, por lado em `S.medD[s]`).** Contam enquanto a analytics roda a partida (`anaLive`) ou com `S.med = 1` (os exercícios). Um soldado da IA está **em contato** quando há um inimigo a até 400 m em que a esquadra acredita (`q.bel`, visto nos últimos 10 s) ou quando tem um alvo próprio. Ele está **no aberto** quando `medProt` diz que nada o protege do lado desse inimigo: não está em prédio, obra ou trincheira, e o abrigo do chão (`coverAt`, a regra do `manHit`) não fica do lado dele.
  - tempo exposto e "bot no meio do nada" (parado no aberto, sem tarefa: sem `m.tar`, sem atirar há 3 s, sem alvo, sem ir buscar ferido);
  - tiros recebidos (`drInc`: quase-acertos e acertos), separados em: de um lado protegido, ameaça desconhecida, ou conhecida e ignorada (o atirador estava em `m.pm` ou `q.bel`);
  - reação ao 1º tiro depois de 30 s de calma: tempo até o abrigo daquele lado e até atirar de volta (histogramas de 0,1 s; "nunca" depois de 8 s);
  - fogo e movimento (movimento em contato com um homem da outra equipe atirando nos últimos 1,5 s) e duração dos lances sob fogo;
  - dispersão (distância ao vizinho mais perto em contato) e explosões com 2 ou mais baixas;
  - granadas: homens dos outros lados que chegaram a 8 m de uma granada de mão entre a queda e a explosão, e quantos saíram sem morrer nem cair;
  - feridos: caídos, socorridos, mortos caídos, socorristas mortos durante o socorro;
  - liderança: tempo de sucessão e esquadras que seguem na missão 60 s depois de perder o líder (uma esquadra exterminada conta como "não seguiu");
  - debandadas, falas por minuto de esquadra em contato e custo da IA por quadro (`AIB.stat`). Fala é balão que subiu, pelo `say` antigo ou pelo `brainSay` do P5. Com `BRAIN.on`, o P5 manda as chamadas antigas para o `brainSay` sem passar pelo `say`, por isso os dois são embrulhados.
- **Evento `cb` na analytics**, com o subtipo em `st`, como as outras seções do cérebro escrevem. `st: 'med'` traz os contadores do lado desde o início da partida, a cada 60 s e no fim, antes do `end`. Esse evento entra mesmo com a analytics no teto `ANA.max`, como `sn` e `end`, porque as decisões do P5 podem enchê-la. Qualquer outro `st` é evento de um pacote do cérebro: as decisões e falas do P5 (`flCb`), ou os eventos emitidos com `medCb(st, s, dados)`, como `'rend'` (rendição), `'pris'` (prisioneiro) e `'nb'` (granada devolvida). A revisão conta esses eventos por lado e tipo. O cabeçalho (`hdr`) leva `brain`, o `BRAIN.on` do começo da partida.
- **`anaReport` → `R.brain`**: `{ on, side: [{ raw, ev, sum }] }`. Usa o último `cb m` de cada lado. A visão de um lado numa partida em andamento esconde o outro. Partidas antigas dão `R.brain = null`. `medSum` calcula as medidas e `medRows` monta as linhas "medida, valor, meta", as mesmas para a revisão e para o torneio.
- **Observador, como a analytics.** Lê a verdade (`S.men`, `S.squads`), não sorteia nada e não muda nada que a batalha lê. O abrigo é lido com `coverAt` num objeto próprio, nunca pelo cache do soldado (`cover(m)` mudaria o momento do recálculo). Os campos próprios em soldados e esquadras começam com `med`. Ela mede o cérebro; não é o cérebro.

### `Céu de Ferro 3D.html`, seção `/* ---------- CEREBRO: medicao, a revisão */` (parte da cena)
- A revisão pós-batalha ganha a seção **Cérebro**: uma tabela com as medidas por lado e a meta de cada uma, e a linha "cérebro novo ligado/desligado nesta partida".

### `tools/balance.js`
- `--brain 0|1`: joga o torneio com `BRAIN.on` assim. O valor vai em `hdr.tour.brain`.
- `--brain ab`: joga as **mesmas** partidas (sementes e doutrinas) duas vezes, desligado e ligado, e imprime o A×B: o resultado (vitórias do lado 0, empates, duração, eficiência de tíquetes, tíquetes em perdas), as medidas da seção 4 lado a lado, e quantos pares jogaram exatamente a mesma partida. `--json` grava `{ ab, a, b }`.
- Todo relatório com partidas medidas ganha a seção `## Cérebro`. `--ref` aceita o `--json` de antes (de um A×B, usa a metade desligada).
- Com `--nobudget`, o custo aparece como "—" (o relógio do medidor de quadro fica parado).

### `tests/brain-honesty.js` (do P7)
- `OBSERVERS`: as seções `CEREBRO:` que só medem ficam fora da varredura de `S.men`/`S.units`/`S.bombs`/`S.planes`, cada uma com o nome e o motivo, como o teste pede para as exceções. Hoje só `medicao`. O Proxy da parte 2 não muda: ele conta só dentro das funções `hon*`. Que a medição não muda a batalha, quem confere é o `tests/brain-drills.js`.

### `tests/brain-drills.js` (novo; também em `tests/all.sh` e em `tests/README.md`)
Exercícios sem tela no `sandbox()`, uma esquadra contra outra, nas duas épocas:
- contato em campo aberto a 220 m (90 s);
- assalto contra uma esquadra parada (80 s);
- granada no meio da esquadra;
- o líder que cai no meio do contato (90 s);
- um ferido socorrido.

`ok` testa o instrumento e é sempre cobrado. Os exercícios contam. Mesma semente dá os mesmos números. Com `MED.on = 0`, a batalha é a mesma (posições, vida e baixas iguais). A revisão lê os eventos, a visão de um lado esconde o outro e uma partida antiga não tem a seção. Numa partida IA × IA com analytics, o `hdr.brain` e os `cb med` saem, e o `medCb` entra na analytics. Uma linha `info` diz se `BRAIN.on` 0 e 1 jogam a mesma batalha (no main de hoje não: o P5 age).

`meta` são os alvos da seção 4, que dizem quando cada pacote está pronto. Saem como informação ("meta" quando o alvo foi atingido, "falta" quando não). Com `METAS=1`, viram cobrança. `BRAIN=0|1` e `ERA=ww2|modern` escolhem o caso.

### `tools/ref/cerebro-base.json` e `tools/ref/cerebro-base.md`
- A linha de base com `BRAIN.on = 0`: o A×B curto rodado uma vez (ver abaixo).

## Ganchos (o código antigo só por embrulho)
Parte da simulação: `step` (o amostrador, a 2 Hz; reações a 10 Hz), `drInc`, `nadeStep`, `explode`, `manDown`, `rescue`, `killMan`, `say`, `brainSay` (do P5), `anaBegin`, `cqEnd`, `anaReport`. Parte da cena: `aarShow`.

Pontos de troca para os outros pacotes (declarados com `let`): `medProt(m, x, z)` (o P2 troca pelo serviço de posição) e `medTask(m)` (o P1, se `m.tar` não bastar).

## O que foi rodado (medição, não a suíte)
- `node tests/brain-drills.js` (as duas épocas, cerca de 3,5 min com nice): todos os `ok` passam. As metas, com o cérebro de hoje, ficam assim nos exercícios: exposto 100% do tempo em contato em campo aberto; "meio do nada" de 3 a 25%; abrigo depois do 1º tiro nunca em 8 s, mas fogo de volta em 0,3 a 0,7 s; tiros de ameaça conhecida e ignorada perto de 100%; fogo e movimento de 47 a 64%; lances de 1,3 a 3,8 s; sucessão do líder em 0 s (a regra de hoje, o primeiro homem de pé assume na hora); granada, 100% dos ameaçados escapam.
- Depois do merge com o main (P5 #130, P7 #132, movimento #129, trincheiras #128): `tests/brain-drills.js` passa (a linha `info` agora diz que `BRAIN.on` 0 e 1 jogam batalhas diferentes) e `tests/brain-honesty.js` passa com a isenção.
- `node tests/sim-split.js` (antes do merge): passou.
- `tools/balance.js --torneio 1 --brain ab --era ww2 --min 1 --nobudget`: o caminho inteiro (torneio, eventos, revisão, A×B) funciona e o par jogou a mesma partida.
- **Linha de base** (`tools/ref/cerebro-base.json` e `.md`): `--torneio 2 --docs balanced --brain ab --min 10 --nobudget --jobs 4`, uma partida em 1944 e uma na época moderna por braço, 14 min e 45 s de relógio. Os 2 pares jogaram exatamente a mesma partida.

  Com o cérebro desligado:
  - 49% do tempo em contato no aberto;
  - 12% "no meio do nada";
  - 89% dos tiros vieram de ameaça conhecida e ignorada;
  - reação nunca dentro de 8 s;
  - fogo e movimento em 6%;
  - lances de 3,8 s;
  - vizinho a 8,3 m;
  - 63% dos caídos socorridos;
  - sucessão em 0 s e 78% das esquadras na missão;
  - 3 debandadas por partida.

  A linha das falas foi anulada: o contador estava errado na rodada (87 por minuto) e foi corrigido depois, sem refazer o torneio. `tools/balance.js <pasta> --ref tools/ref/cerebro-base.json` leu as 4 partidas e mostrou a coluna de referência.

## O que NÃO foi testado
- A seção Cérebro na revisão do navegador (só a parte sem tela foi rodada).
- Online: um convidado não mede (`S.net && !S.host`), e o anfitrião mede como a analytics. Nada foi rodado pelo servidor.
- O custo do próprio medidor numa batalha cheia. Ele fica fora do `AIB` de propósito, mas não foi cronometrado.
- A suíte inteira (regra do capitão). Rodaram só os exercícios do pacote, `brain-honesty`, `sim-split` e o torneio curto.
- A linha de base é de antes do P5, do P7 e do movimento-líder (main `2ed8052`). O A×B não foi rodado de novo sobre o main de hoje (regra: uma vez, curto).

## Riscos
- **"Em contato" depende das crenças (`q.bel`).** Se o P7 ou o P1 mudarem como a esquadra acredita, o tempo em contato muda junto. Por isso a comparação vale nas mesmas sementes (A×B), não contra números absolutos de outra versão.
- **"No aberto" é uma aproximação até o P2.** Saco de areia conta como protegido de todos os lados, e moita não conta (esconde, não para tiro). Quando o P2 entrar, trocar `medProt` muda as medidas de exposição, e a linha de base precisa ser gravada de novo.
- **Reação.** Com resolução de 0,1 s e uma janela de 8 s, quem já estava abrigado no 1º tiro conta 0 s para o abrigo (a coluna "já abrigados" mostra quantos).
- **Tamanho dos eventos.** Cada `cb m` leva os histogramas, 2 a 3 eventos por minuto de partida: de 60 a 90 numa partida curta, longe do teto `ANA.max`.

## Como testar depois
- `nice node tests/brain-drills.js`, e `METAS=1 nice node tests/brain-drills.js` quando um pacote afirmar que bateu a meta.
- `nice node tools/balance.js --torneio N --brain ab --min 10 --nobudget --jobs 4 --save <pasta> --json <arquivo>`: o A×B numa linha de comando. Rode fora do elrei (no bartolomeu ou aqui com nice).
- `node tools/balance.js <pasta> --ref tools/ref/cerebro-base.json`: compara partidas novas com a linha de base.
- No navegador: assistir a uma partida IA × IA até o fim e abrir a revisão (seção Cérebro).
