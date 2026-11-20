# O general da IA ergue a cúpula antifoguete (cf-cupula-general)

Bug relatado pelo capitão: "generais não estão construindo nunca os iron domes".

## A causa

A cúpula antifoguete da IA só nascia em `aidDome`, e `aidDome` só a começava com o estoque do lado já em 300 + 120 de energia e 400 + 120 de metal (o custo mais a reserva da economia, `aidPay`). Nada poupava para ela. A economia da IA gasta o metal assim que ele entra: numa partida headless de 10 min (IA × IA, época de hoje, mapa v8, semente 3) o metal de cada lado ficou entre 40 e 210 o tempo todo. O gatilho estava satisfeito: até 82 granadas e foguetes inimigos caíram a menos de 2 km da base do lado 0 em 4 min. Mesmo assim, nenhuma cúpula foi pedida, nenhuma ordem saiu e nada apareceu no diário.

Dois detalhes teriam impedido a cúpula mesmo com metal:
- o orçamento de obras do minuto (`bmrPay`, BMR: 60% da renda por minuto, no mínimo 100/160) nunca comporta 300/400 de uma vez;
- o gatilho era só reativo (granadas já caídas ou lançador conhecido ao alcance). Não havia doutrina.

## O que mudou

- A cúpula entrou no **plano de fortificação do general** (AFP), que já escolhe o construtor, manda a ordem pelo funil (`genCmd fort`), poupa para obras pagas e registra cada decisão no diário. Não há caminho paralelo: a ordem é a mesma "Fortificar" do jogador (`W21.fort.dome`, `W21.dig.dome`), e quem constrói é a esquadra que o `afpBuilder` escolhe, como nas outras obras do plano.
- **Onde e por quê** (`afpWant`, seção AFD da página):
  - sob fogo: seis ou mais granadas e foguetes inimigos caíram a menos de 2 km do lugar nos últimos 4 min, ou o lado conhece uma artilharia, um lançador de foguetes ou um morteiro inimigo que alcança o lugar. Os lugares são a cidade-sede ou a fábrica, a base principal, os pontos tomados e as bases de suprimento do plano. Esse pedido vem antes das outras obras do plano;
  - por doutrina: sobre a cidade-sede (ou a fábrica) e a base principal, quando algum lado inimigo tem artilharia ou foguetes, a partir do nível 1 da economia ou dos 7 min. Esse pedido vem depois das outras obras. Enquanto a economia poupa para uma cúpula, as cúpulas vão para o início da lista, e uma cúpula que não pode sair num lugar (sem construtor, sem lugar) não gasta as 3 tentativas do ciclo: o plano tenta o próximo lugar na mesma hora.
  - Até 2 por lado, uma em obra de cada vez, nenhuma a menos de 1,6 km de outra do lado. O lugar escolhido é terreno aberto atrás do lugar protegido, longe do inimigo e das casas.
- **Economia**: o plano poupa para a cúpula até 420 s (as outras obras poupam 90 s). A meta é o custo, 300/400, sem a reserva de 120 por cima. Segurar só os pedidos novos de produção não bastava: a fila já paga continuava comendo a renda inteira de metal (~120/min), e o estoque não subia. Por isso a poupança da cúpula agora é um fundo (`d.afd`). Ele guarda o estoque do momento e 75% da renda dali em diante, e o passo da economia (produção, logística, recuperação) não o enxerga. Enquanto o fundo existe, as outras obras pagas da IA esperam (`aidPay`). O fundo continua guardado enquanto os construtores caminham, porque a obra só é paga quando começa (`fortStart`), e volta para a economia quando a obra começa ou quando o plano desiste dela. Uma poupança de obra pequena cede a vez à cúpula. Com o fundo cheio, as outras obras pagas do plano esperam e não tomam os construtores; antes, um ninho barato levava a esquadra de base que ergueria a cúpula. Se ainda falta construtor quando a poupança vence, ela ganha mais 240 s (`AFD.hold`), uma vez. O que foi poupado para uma cúpula vai para a cúpula pedida agora, mesmo que o lugar sob fogo tenha mudado. A cúpula fica fora do orçamento de obras do minuto (`it.big`), porque 400 de metal nunca caberiam nele, e continua lançada no livro de obras.
- **Construtor e lugar**: o construtor é o do plano: a esquadra livre mais perto, a até 2,5 km, com a engenharia na frente. Sem nenhuma, o plano tenta de novo em 90 s. A cúpula cobre 2 km, então não precisa ficar no meio do lugar. O plano tenta primeiro terreno aberto até 800 m do lugar, na direção desse construtor (a caminhada encurta), sem chegar mais perto do inimigo que o próprio lugar. Depois tenta uma área de 60 a 480 m atrás do lugar e até 220 m para os lados. Fica sempre fora de estradas, casas e obras. Na primeira versão a busca era pequena demais, e a cidade-sede do lado 0 não tinha lugar livre.
- **Insurgentes**: não erguem cúpula (doutrina: sem radar nem interceptores). O general deles diz isso uma vez no diário.
- `aidDome` só roda onde o plano não roda (mapas antigos e o sandbox dos testes). O teste antigo de `tests/aid.js` continua no mesmo caminho.
- **Visível**: o diário mostra "Plano de fortificação: cúpula antifoguete sobre ...: a economia poupa ...", "ordenado (... a N m)" e "pronto". A linha de obras da Visão de General (`bmrLine`, também nas linhas da economia) mostra "cúpulas antifoguete n/2" e a última palavra do plano sobre elas (o que quer e por quê, poupando, em obra ou sem ameaça).
- O general jogador e o MCP (`build_defence` com `kind: dome`, `send_command fort k dome`) também podem ordenar a cúpula. Em 1944 o menu Fortificar não a oferece.

## Testado

Só `tests/cupula-general.js`: uma partida IA × IA de hoje, 2 lados, mapa v8, semente 3, com economia. Cada lado tem de ordenar uma cúpula pelo plano em até 12 min, e pelo menos um lado tem de começá-la em até 20 min. Antes da correção, nenhum lado pediu cúpula e o teste falhou. Depois, o lado 0 (EUA) poupou a partir dos 128 s, ordenou aos 392 s (engenharia a 387 m), começou aos 512 s e terminou aos 620 s, e então passou a poupar para a segunda, sobre a base. O lado 1 (Rússia) ordenou aos 450 s, mas mandou a reserva, que estava a 1,9 km e em combate, e ela não tinha começado aos 20 min. A última edição das asserções (o começo do lado 1 passou a ser só impresso) não foi rodada de novo; os números são da rodada anterior, com o mesmo código do jogo. Num smoke de 3 lados (mapa v9, 14 min), a Rússia começou a sua aos 802 s, os EUA estavam com os construtores a caminho aos 840 s, e os Insurgentes disseram que não têm cúpula.

## Não testado

- A partida de 3 lados além do smoke: Insurgentes sem cúpula, os outros dois lados com ela, e o `aidSee` contando granadas para o lado certo.
- Online (anfitrião e convidado). O convidado não vê a última palavra do plano na linha de obras, porque `A.dmw` não vai pela rede, mas vê o número de cúpulas.
- O equilíbrio: poupar até 7 min (mais a caminhada dos construtores) segura 75% da renda, a produção e as obras pagas. Isso pode atrasar reforços e postos. O nível 1 da economia ou os 7 min (`AFD.doc`) podem ser cedo ou tarde demais.
- O ataque estratégico (`stkStep`) roda fora do passo da economia que o fundo envolve, então enxerga o estoque inteiro.
- Se o construtor chega e termina a obra em todos os mapas (v5 a v10). Terreno sem lugar aberto atrás da cidade-sede faz o plano dizer "nenhum lugar livre ali" e tentar de novo em 90 s.
- Mísseis: o gatilho conta granadas e foguetes que caíram (`he`) e atiradores conhecidos (artilharia, lançador, morteiro). Mísseis guiados ou o ataque estratégico inimigo não contam sozinhos.
- Visto no rastreio, fora do escopo deste PR: a esquadra de engenharia do lado 1 (semente 3) ficou "em carona" (`aidRide`) dos 330 s aos 498 s sem andar, o que a tira de toda obra. Pode ser um veículo que nunca chega.
- O menu Fortificar do general jogador com a cúpula (só na época de hoje) e a ordem dada por ele.

## Riscos

- O construtor é o ponto fraco: o plano só manda esquadras livres a até 2,5 km, e a IA ocupa quase todas. O dinheiro pode ficar pronto e a obra esperar minutos (lado 1, semente 3). Para a cúpula, o plano prefere uma esquadra sem inimigo perto. Mesmo assim, a escolhida pode cair em combate no caminho. Uma carona (EMB) para o construtor longe não foi feita.

- O fundo esconde parte do estoque do passo da economia. Algo que leia `d.en`/`d.mt` dentro desse passo vê menos do que o painel mostra.
- `aidPay` agora recusa as obras pagas da IA enquanto o plano poupa para a cúpula. Postos, trincheiras do `fortPlan` e as minas ordenadas esperam até a cúpula sair ou a poupança vencer (420 s, mais 240 s com o dinheiro pronto, depois 120 s livres).
- Uma cúpula a mais por lado gasta 15 de metal por interceptor. Contra muita artilharia, isso come o metal da produção.

## Como testar

- `node tests/cupula-general.js` (alguns minutos; `MIN=` muda a duração).
- No jogo: Assistir, época de hoje, economia ligada. Abra a Visão de General, olhe a linha de obras (cúpulas) e o diário (ENG, "Plano de fortificação: cúpula antifoguete"). A cúpula deve subir atrás da cidade-sede ou da base quando a artilharia inimiga começar a cair, ou por volta dos 7 min.
- Com 3 lados: os Insurgentes dizem que não têm cúpula, e os outros dois erguem a sua.
