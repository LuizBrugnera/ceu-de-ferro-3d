# Céu de Ferro 3D Strategy

## Vision

<!-- vision: author-approved 2026-11-20 -->

`ceu-de-ferro-3d` existe para que uma pessoa entre numa batalha combinada de verdade - ar, solo, artilharia, logística e comando - que acontece com ou sem ela.
Ela serve a quem quer jogar de piloto, tanquista, soldado ou general, sozinho contra a IA ou numa sala online, e a quem quer pôr um modelo de linguagem para comandar um lado.
Ela transforma a escolha de uma época, um lado e um papel numa partida onde cada lado tem um general que produz, abastece e manobra.
Ela é dona de exatamente uma coisa: a simulação dessa batalha, jogada no navegador.

### A batalha existe sem o jogador

A IA mantém a guerra de todos os lados; o jogador é uma unidade dentro dela ou o general de um lado, nunca o motor dela.
Um modo RTS, com câmera de comandante, cabe como mais um jeito opcional de jogar, nunca como o principal.
Toda unidade da IA entra em campo por uma ordem de despacho do general, com uma missão, e paga pela economia.
A economia e a logística física ficam sempre ligadas, em todo modo: o que chega à frente foi produzido e levado até lá.
Não há tíquetes: perder uma unidade custa à economia, não ao placar, e o placar são os pontos de captura, que também dão a renda.
Um modo que tira a economia, os despachos ou a logística para "simplificar" vai contra o jogo.
Campanhas com história, missões e eventos roteirizados são bem-vindas, desde que aconteçam dentro dessa batalha simulada e não no lugar dela.

### A IA joga limpo na partida

A IA só age sobre o que o lado dela percebe: detectar, reconhecer e identificar, com erro e tempo, e linha de visada para travar um míssil.
O desafio vem de planejar melhor: a dificuldade muda a cadência e a profundidade do plano do general.
Um nível de dificuldade pode dar recursos a mais ao general, às claras e com nome, mas nunca visão ou informação que o lado não tem.
Cada soldado tem um cérebro que se vê agir: escolhe abrigo real pelo terreno, resgata o colega ferido, foge ou devolve a granada, se rende, e o prisioneiro dá ao lado que o pegou o que ele sabia.
A profundidade desse cérebro vale mais que a câmera que o mostra.
Uma IA que trapaceia na percepção é um defeito, e uma IA burra também; as duas se corrigem na causa.
O general da IA, o jogador e o modelo por MCP mandam pelo mesmo funil de ordens, com as mesmas recusas e os mesmos motivos em português.
Nada que o general da IA pode fazer fica fora do alcance do jogador e do MCP.
Fora da partida normal, o MCP pode ver o estado inteiro como ferramenta de laboratório, para o modelo achar bugs, vícios e melhorias do próprio jogo; numa partida, ele comanda só com o que o lado sabe.

### Cada época luta como a sua guerra

O comportamento das unidades e dos generais segue procedimentos reais: exercícios de infantaria, fixar e flanquear, emboscada, armas combinadas, guerrilha, e as leis da guerra com os civis.
Cada lado e cada época têm doutrina, armas e táticas próprias, e um lado irregular luta como irregular.
Uma época nova é bem-vinda quando traz o que é só dela, como o napalm e os túneis no Vietnã, e não uma troca de modelos sobre as mesmas regras.
As épocas que já existem ganham o que é datado delas, para que 1944 e "hoje" se sintam como guerras diferentes.
Conflitos e lugares reais, com nomes reais, cabem no jogo.

### Medido, e o main sempre jogável

Uma mudança de comportamento da IA se mede em partidas IA contra IA, com os eventos da partida e a revisão pós-batalha, e o número vence a impressão.
Um comportamento que não aparece na partida medida ainda não existe, mesmo que o código esteja lá.
A suíte de testes que já existe passa antes do merge; um bug que chegou ao jogador ganha uma checagem que o reproduz.
O que não foi provado fica escrito em `docs/nao-testado/`, com o risco e como testar.
A versão no main é jogável a cada merge: o capitão joga enquanto ela melhora.

### Roda numa máquina comum

O jogo roda no navegador com three.js, e a pessoa abre um link para jogar.
O código pode ser dividido em módulos com uma etapa de build, desde que o resultado continue sendo uma página que se serve sem instalação.
A simulação pode sair da página do anfitrião para o servidor quando isso tirar a confiança no anfitrião ou permitir salas sem ninguém hospedando.
O relógio da batalha não depende do quadro por segundo, e a qualidade gráfica se ajusta à máquina.
Modelos e recursos externos são livres, com a licença registrada, e a página funciona sem eles.

### Scope

Não é um jogo de estratégia em turnos nem um simulador de voo de estudo: tudo acontece em tempo real, na mesma batalha.
Não é um jogo de celular: joga-se no computador, com teclado e mouse, e o toque não guia nenhuma decisão.
Não tem contas de jogador; a sala é o lugar de encontro, e o servidor guarda as partidas para a análise.
A interface, as recusas e os documentos falam português do Brasil.

Uma mudança se alinha quando aprofunda a batalha que existe sem o jogador, mantém a percepção da IA honesta e o funil de ordens igual para IA, jogador e MCP, dá a cada época o que é dela, roda no navegador numa máquina comum, e chega medida ou com o rastro do que não foi testado.
Uma mudança deve ser resistida quando dá à IA, numa partida, informação que o lado não tem, abre um caminho de ordens só para um tipo de comandante, desliga a economia ou a logística para simplificar, troca a batalha simulada por roteiro, ou entra no main quebrando a suíte.
