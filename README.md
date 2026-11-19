# Céu de Ferro 3D

Jogo de combate em um único arquivo HTML (three.js), com duas épocas e partidas online. Você joga de avião, helicóptero, tanque, antiaérea, artilharia, transporte ou soldado, ao lado e contra uma IA que mantém a batalha dos dois lados. Cada lado tem um general, que produz as forças, cuida da economia e manobra pelo mapa: ele pode ser a IA, um jogador ou um modelo ligado por MCP.

## Como rodar

Precisa do Node.js 18 ou mais novo.

```
npm install
npm start
```

Abra `http://localhost:8080`. Para outra porta, `PORT=9000 npm start`. O jogo precisa do servidor: toda partida é numa sala, e quem entra sozinho joga contra a IA. Abrir `Céu de Ferro 3D.html` direto, sem servidor, mostra só o hangar e o aviso de como iniciar o servidor.

Depois de atualizar o jogo, reinicie o servidor: a página nova funciona com um servidor antigo, mas sem o que ele não conhece (conquista, requisição, rádios, drones, tripulação, obras, sapadores, minas, postos, lançadores de foguetes, economia, general, espectador).

## Três jeitos de entrar

No hangar há três botões:

- **Entrar na sala.** Você escolhe um veículo e joga a partida.
- **General.** Você entra como soldado no quartel-general e assume o comando do seu lado.
- **Assistir.** Você entra como espectador, sem veículo, e vê os dois generais. Se a sala estiver vazia, abre uma partida local de IA contra IA.

## O general

Cada lado tem um general. Sem ninguém na cadeira, a IA comanda. Tab abre a visão de general durante a partida: mapa tático, o que o seu lado sabe do inimigo, as ordens desenhadas, a postura com o motivo, e o diário de ordens.

**Jogar de general.** Com a cadeira assumida, você seleciona esquadras no mapa (clique, caixa, duplo clique para o mesmo tipo) e ordena com o botão direito ou pelas teclas: G mover, H defender, Q assalto planejado, E emboscada, R reconhecer, T fogo de artilharia, Y fumaça, K reserva, C contra-ataque, P ponto de reunião, M marcar objetivo para os pilotos, X devolver a seleção à IA, B construir, N aba de comando. Quatro botões (Economia, Ataque, Defesa, Apoio) dizem quais áreas a IA continua tocando por você. Ao devolver a cadeira, a IA reassume tudo.

**Economia.** O general gera tudo o que entra em campo. Usinas dão energia, minas dão metal (só em jazidas), e fábricas transformam os dois em veículos; o quartel-general dá um fio dos dois e abriga a infantaria e a aviação. As unidades vão para uma reserva, e os reforços saem dela. As instalações existem no mapa e podem ser destruídas: o general as esconde e defende, manda reconhecer as do inimigo e ataca as que encontra. Junto de cada base principal, na estrada para a frente, fica uma cidade-sede com lotes vazios para fábricas, usinas, depósito e antiaérea (num largo ou no teto de um prédio): o que se ergue num lote parece um prédio comum para o inimigo, que não o mira até identificá-lo de perto (a menos de 400 m) ou passando por cima com um drone de reconhecimento ou uma patrulha.

**Produção e despacho.** Nenhuma unidade da IA entra em campo sem uma ordem de despacho do general com uma missão. O plano de produção diz quantos de cada tipo o general quer em campo (tanques, antiaéreas, artilharia, caminhões, esquadras levadas pelas colunas, caças, aviões de ataque e, hoje, helicópteros). Ele sai da postura (ofensiva, equilíbrio ou defensiva) e do que o lado sabe do inimigo: aviação inimiga ativa pede mais antiaéreas e caças, blindados conhecidos pedem mais tanques, artilharia conhecida pede mais aviões de ataque. A economia produz o que falta em campo, além da reserva mínima, e o despacho manda cada unidade assim que fica pronta: aviões e helicópteros um a um, veículos em coluna (a primeira pronta espera até 12 s pelas outras, e as colunas de um lado saem com 20 s entre elas). Cada lado tem um teto de população: 120 soldados, 24 veículos e 8 aeronaves, menos 8, 2 e 1 por jogador humano no lado (até 3). O teto encolhe se a IA do anfitrião (sozinho, a sua máquina) passar do orçamento por quadro e volta quando ela folga. Se um lado ficar 3 minutos sem esquadra na reserva, sem nada em produção e com menos de 8 soldados em campo, o quartel-general manda uma esquadra defender a base. A visão de general mostra o plano (em campo / desejado) e o teto na Logística; o general humano ou o modelo fixa o número de um tipo (`pplan`), despacha da reserva com missão (`disp`) e dá missão a esquadras em campo (`mis`). Sem economia (servidor antigo) a IA entra pelos relógios de antes.

**Manobras.** Além dos assaltos pelos eixos, o general usa a rede de estradas: flanco por estrada secundária, infiltração a pé, incursão na retaguarda, bloqueio de estrada de suprimento, cerco, finta antes do assalto, reserva móvel num cruzamento, defesa em profundidade e fustigamento. As rotas evitam trechos onde houve baixas.

**Modelo como general (MCP).** `mcp-general.js` liga um modelo de linguagem à cadeira de general. Veja `MCP.md`.

**Fogo amigo.** Ligado por padrão; o botão fica no topo do hangar e, numa sala, vale a escolha do anfitrião.

## A partida: conquista

Toda partida é de conquista. Os dois lados disputam uma cadeia de pontos entre as duas bases principais, cada lado com tíquetes, e o relógio é escolhido no hangar: Curta (30 min, 480 tíquetes), Padrão (45 min, 720) ou Longa (60 min, 960). Na Frente atual, que é maior, os tíquetes valem uma vez e meia isso.

**Pontos.** São os mesmos para todos. O mapa tem três eixos e estradas secundárias, e além dos pontos da cadeia principal há três vilas fora dela: Poço Fundo, Cruzeiro (começa neutra) e Três Pinheiros, o que dá dez pontos em 1944 e doze hoje, com tíquetes maiores na mesma proporção. Na cadeia principal, em 1944 são sete: A Base, B Encruzilhada, C Vila das Oliveiras, D Travessia, E Vila do Moinho, F Curva do Bosque, G Base. Hoje são nove: A Base, B Encruzilhada, C Colina, D Vila das Oliveiras, E Travessia, F Vila do Moinho, G Entroncamento, H Curva do Bosque, I Base. Cada lado começa com a sua metade e a Travessia começa neutra. Na Frente atual a Travessia fica na ponte do rio, no fundo do vale, à mesma distância do ponto avançado de cada lado.

**Capturar.** Conta quem está dentro do raio (170 m; 230 m nas vilas; 260 m nas bases): soldado a pé 1, tanque e blindado sobre rodas 1,5, antiaérea 0,75, carro e caminhão 0,5. Aeronaves, artilharia, veículos vazios e quem está embarcado não contam. Com um de vantagem um ponto neutro leva 60 s; a vantagem conta até 4. Só se toma um ponto ligado a outro que já é seu. Vazio, o ponto volta devagar ao dono; cortado da base, fica neutro depois de 5 min.

**Tíquetes.** Com a economia, são o moral do lado. Perder uma unidade não custa tíquete: quem paga a perda é a economia, que gastou para fazer a unidade. Perder uma instalação custa: fábrica 15, usina ou mina 8; uma base de suprimento pronta custa 5 e uma cúpula antifoguete 10. Sem a economia (a demonstração, um servidor antigo), cada perda custa como antes: soldado 1, carro ou caminhão 2, blindado sobre rodas, antiaérea ou artilharia 4, veículo-rádio 5, tanque 6, helicóptero 8, avião 10; bases de suprimento e cúpulas não custam tíquetes. Quem tem menos pontos perde 2, 4, 7 ou 10 tíquetes por minuto conforme a diferença. Perder um ponto custa 10 e tomar um devolve 4. Perde quem ficar sem tíquetes ou sem a base principal; no fim do relógio vence quem tem mais pontos e, no empate, mais tíquetes.

**Voltar depois de perder.** A volta é sempre possível. A espera é de 4 s (até 10 s com os tíquetes do lado abaixo de um quarto), e o modelo perdido fica em contagem antes de sair de novo:

| Perdido | Contagem (Padrão) |
| --- | --- |
| Soldado | 10 s |
| Carro, caminhão | 20 s |
| Blindado sobre rodas | 45 s |
| Antiaérea | 50 s |
| Artilharia, helicóptero de transporte | 60 s |
| Tanque, caça, veículo-rádio | 90 s |
| Avião de ataque, helicóptero de ataque | 120 s |

Na Curta vale 0,75 disso e na Longa 1,25. A contagem é do modelo e não do jogador: perdido o tanque, dá para entrar logo de soldado ou em outro modelo. Não há ondas: com a economia a IA dos dois lados entra pelo despacho do general (veja Produção e despacho); sem ela, é reposta por tempo, com as mesmas esperas.

**Onde entrar.** Aviões entram voando perto da base e helicópteros pousados ao lado da pista. As classes de solo escolhem na lista "onde entrar" (tecla H, ou na espera depois de uma perda): a base principal (na estrada, a pouco mais de um quilômetro da pista), uma base de suprimento pronta do lado, um ponto seu sem disputa e sem inimigo a menos de 300 m e, para soldados, um rádio do lado.

**Na tela.** No alto ficam os tíquetes dos dois lados, os pontos na ordem da cadeia e o relógio. Dentro de um ponto aparecem o nome, a barra de captura e o peso de cada lado. No fim sai o resultado com o motivo e o placar; no PvP a sala começa outra partida sozinha depois de 25 s.

## Classes

Na Frente de 1944 jogam a Luftwaffe e os Aliados; na Frente atual, a Força Azul e a Força Vermelha. O lado do veículo define o time.

- **Avião.** Caça e avião de ataque por lado. Cada tiro acerta uma peça (asas, cauda, motor, combustível, piloto). Rearma e repara sobrevoando a própria pista, baixo e perto. A carga é escolhida na ficha do hangar (veja "Cargas").
- **Helicóptero** (só hoje). AH-64D e UH-60M pela Azul, Mi-28N e Mi-8AMTSh pela Vermelha. Paira, sobe e desce na vertical, voa de lado e de ré; sem tecla ele se estabiliza. O de ataque tem canhão em torre que segue a mira, foguetes e míssil guiado; o de transporte leva um pelotão (G embarca e desembarca, pousado) e tem metralhadoras nas portas. O rotor não pode encostar em nada. Pouse devagar: o mundo passa uma vez e meia mais depressa do que o velocímetro indica, então comece o arredondamento mais alto. Pousado e parado ao lado da pista, rearma e repara.
- **Tanque.** Dois por lado. Canhão com projétil de verdade, perfurante ou explosivo (tecla V; cada um com a sua munição), e metralhadora. O perfurante é para blindados; o explosivo, mais lento e com mais queda, estilhaça soldados a céu aberto, caminhões, carros, casas, trincheiras e sacos de areia, e quase não fere a blindagem de um tanque, só nas lagartas, miras e peças expostas. A IA escolhe a carga pelo alvo. Online, exige o servidor novo (sem ele, só perfurante). A blindagem vale pela face: frente grossa, lados mais finos, traseira e teto finos.
- **Antiaérea.** Em 1944, canhão automático e granada de tempo. Hoje, míssil guiado e canhão de 30 mm, que também derrubam mísseis ar-solo.
- **Artilharia.** Obuseiro autopropulsado: tiro direto pela luneta ou indireto pelo mapa de tiro (M), por cima dos morros, até 6 km em 1944 e 12 km hoje. Só atira parado, a granada leva de 10 s a quase um minuto para cair, e no mapa só aparecem os inimigos que alguém do seu lado está vendo. Cada lado tem também um lançador de foguetes: Panzerwerfer 42 e BM-13 Katyusha em 1944, M270 MLRS e BM-21 Grad hoje. Segurando o gatilho ele dispara a salva inteira (de 10 a 40 foguetes, espalhados), e depois leva 60 s para carregar os tubos, menos com um caminhão do lado por perto.
- **Transporte.** Carro leve, caminhão, veículo-rádio e, hoje, blindado sobre rodas (anfíbio, com canhão automático). Quem entra de Transporte é um soldado ao volante: E desce e o veículo fica estacionado para qualquer soldado do lado, com o dano e a munição que tinha. Ao volante, F chama a bordo os pelotões aliados próximos ou manda descer. O caminhão remunicia soldados ao lado e acelera a obra de uma base.
- **Infantaria.** Um cartão por kit: fuzileiro, metralhador, anticarro, antiaéreo (hoje), atirador de elite, morteiro, operador de rádio, operador de drone (hoje) e sapador. Todos levam granadas de mão e de fumaça e constroem (N). Com E o soldado entra em carro, caminhão ou blindado aliado estacionado: motorista, senão atirador, senão passageiro.

**Kits.** Fuzil e metralhadora não fazem nada na blindagem de um tanque. Panzerfaust, Bazooka e RPG são cargas ocas sem guia, melhores pelo flanco e pela traseira; o Javelin trava no alvo e cai no teto; Stinger e Igla buscam o calor e são enganados por flares. O atirador de elite tem luneta com queda do projétil, prende o fôlego com Shift e, hoje, fere veículos leves com o .50. O morteiro (Q pega, M abre o mapa, V troca entre explosiva e fumaça) atira de 150 m a 3 km.

**Trocar no meio da partida.** H (ou o botão "Trocar veículo") abre o quadro com as classes e os modelos do seu lado. Abandonar um veículo inteiro conta como uma perda (sem a economia, custa os tíquetes de uma perda) e põe o modelo em contagem; descer de um transporte não. No quadro, os números escolhem a classe, as setas o modelo e onde entrar, Enter confirma.

## Requisitar veículos

Um soldado a pé dentro de um depósito troca de lugar com um veículo ali mesmo, sem contar como perda: tecla U. Depósito é a base principal, uma base de suprimento pronta do lado ou um ponto seu sem disputa com uma base de suprimento dentro. Aeronaves só saem da base principal. Custa tíquetes (carro ou caminhão 1, blindado, antiaérea ou artilharia 2, tanque e veículo-rádio 3, helicóptero 4, avião 5), cada jogador espera 60 s entre duas, cada depósito tem 3 veículos e recebe mais um a cada 90 s, e um modelo em contagem não sai. Devolver um transporte requisitado inteiro num depósito devolve metade do custo.

## Rádios

Dois modos de levar a entrada da infantaria para perto da luta. Valem só para soldados e aparecem na lista "onde entrar".

- **Operador de rádio.** Enquanto está vivo e a pé, os soldados do lado entram a 6 m dele. O pousa o rádio no chão, que vale enquanto o operador estiver a menos de 250 m; O de novo, a menos de 4 m, recolhe.
- **Veículo-rádio.** Sobre lagartas, com blindagem leve e uma metralhadora (Sd.Kfz. 251/3, M3 Half-track, M577, MT-LBu). Parado, O levanta a antena em 6 s: ele vira ponto de entrada, reabastece quem está ao lado e não anda até recolher a antena.

| | Operador | Rádio pousado | Veículo-rádio |
| --- | --- | --- | --- |
| Entradas antes de voltar a um depósito | 6 | as do operador | 16 |
| Leva de entrada | 20 s | 20 s | 15 s |
| Tíquetes para o inimigo quando destruído | 2 | nada | 8 |

A entrada é recusada com inimigo a menos de 150 m, com o rádio atingido nos últimos 6 s, com o operador pregado no chão ou longe do rádio, ou sem entradas. O rádio pousado some se um inimigo chega a 10 m dele ou se uma explosão o destrói. O seu lado vê os próprios rádios nos mapas (quadrado branco) e na tela; um rádio inimigo avistado aparece em vermelho, e a IA o trata como alvo de valor: artilharia e morteiros batem o rádio pousado, e tanques, aviões de ataque, helicópteros e operadores de FPV dão preferência ao veículo-rádio. O comandante da IA mantém um veículo-rádio por lado, atrás do ponto que ataca, com um pelotão de guarda.

## Obras: bases, trincheiras, sacos de areia e postos

De soldado, N mostra o contorno da obra à frente, verde onde pode e vermelho com o motivo onde não pode. Cada toque em N passa para a próxima obra (base de suprimento, trincheira, sacos de areia, posto anticarro, ninho de metralhadora, torre de sniper, cúpula antifoguete; o sapador segue para a mina anticarro e a antipessoal) e depois fecha; o clique começa e o botão direito cancela. Para construir, fique parado junto da obra; outros soldados ao lado aceleram e um tiro recebido interrompe.

- **Base de suprimento.** Gasta o kit de construção (um por soldado, reposto numa base). Três por lado. Leva 70 s sozinho. Pronta, remunicia e repara por inteiro soldados e veículos de solo do lado a até 70 m, é ponto de entrada e depósito de requisição. Tem 230 pontos: canhão, foguete, bomba e obuseiro a destroem, e encostado nela N arma a carga de demolição (duas bastam).
- **Trincheira** (40 s). Em pé, só a cabeça aparece; agachado ou deitado o soldado some. Explosão fora quase não fere, granada dentro mata. Tanque cruza devagar, veículo de rodas só pelas pranchas.
- **Sacos de areia** (12 s). Protegem do lado em que estão; tanque passa por cima.
- **Carga na parede.** De frente para a parede de um prédio, N arma a carga que abre um buraco.
- **Posto anticarro** (45 s; até 3 por lado) e **ninho de metralhadora** (25 s; até 4). Sacos de areia com uma arma de reparo: PaK 40 ou canhão de 57 mm em 1944 e TOW-2 ou Kornet hoje no posto anticarro; MG 42 ou M1919 e M2 .50 ou Kord no ninho. Pronto, ganha uma guarnição de dois soldados da IA. Quem do lado estiver no posto opera a arma no lugar da sua (o jogador antes da IA), com a munição do posto, e ao sair tem a sua de volta.
- **Torre de sniper** (40 s; até 2). Quem do lado chega ao pé dela sobe à plataforma, com o olho a uns 11 m, e desce ao sair dela. Pronta, ganha um atirador de elite da IA.
- **Cúpula antifoguete** (só hoje; 150 s; até 2). Radar e interceptores: derruba granadas de obuseiro e de morteiro, foguetes dos lançadores e mísseis guiados contra alvos no solo que vão cair a até 2 km dela, um a cada 0,25 s, de um carregador de 20 que se recarrega devagar. Uma salva grande a satura. Com a economia ligada, custa 300 de energia e 400 de metal, e cada interceptor gasta 15 de metal; os postos também custam (40/60, 15/25 e 20/30). O radar mostra ao lado dela quem atirou.

Cada lado já começa com trincheiras nos postos de linha e na frente das vilas, e a IA ergue uma base avançada no primeiro minuto.

## Sapadores e minas

O sapador (Pionier e Combat Engineer em 1944, Sapador Azul e Sapyor Vermelho hoje) leva submetralhadora, 3 cargas de demolição e minas: 3 anticarro e 5 antipessoal (Tellermine 43 e S-Mine 35, M1A1 e M2, M15 e M18A1 Claymore, TM-62 e MON-50). N passa pelas obras até as minas, e o clique arma uma 2 m à frente, pronta em 3 s. Não se arma mina na estrada perto da própria base, a menos de 3 m de outra, nem com inimigo a 25 m. Cada lado tem até 30 minas no chão.

- **A mina anticarro** explode com veículo inimigo em cima: quebra a lagarta ou as rodas daquele lado e fere o casco. **A antipessoal** explode com soldado inimigo a pé.
- **Só o seu lado vê as suas minas.** O inimigo as vê quando um sapador dele, a pé e sem correr, chega a 25 m (o detector) ou quando uma explode; o lugar de cada explosão fica como campo suspeito para quem caiu nela.
- **V**, parado ao lado de uma mina que o seu lado conhece, a desarma em 4 s; uma do seu lado volta para a bolsa.
- **Sabotagem.** Além de bases e instalações, a carga do sapador derruba um veículo inimigo parado, uma antiaérea fixa ou um rádio pousado.
- Cargas e minas voltam num depósito.
- Online, quando o anfitrião sai, o servidor passa só ao novo anfitrião a lista inteira de minas: nenhuma se perde, nem as escondidas do outro lado.

O uso dos sapadores, dos postos e do Grad pelo general da IA ainda não existe.

## Dano, reparo e fumaça

Cada veículo é feito de peças, e o tiro vale pelo lugar onde acerta: lagartas ou rodas, motor, canhão, torre, munição e tripulação no chão; asas, cauda, motor, combustível e piloto no ar. Uma granada perfurante que chega de raspão ricocheteia, e a que não vence a placa não entra. A carga oca do FPV de ataque não passa a frente de um tanque: mata pelo teto e pela traseira, e muitas vezes pelo lado. O painel de danos, embaixo à esquerda, mostra cada peça, o fogo e o reparo.

**Reparo de campo.** Em veículo de solo, segure T parado: a tripulação apaga o fogo e conserta uma peça por vez, até a metade. I troca a prioridade entre motor e rodagem ou armamento. Um tiro recebido interrompe. O conserto completo é perto da pista ou de uma base de suprimento.

**Fumaça.** G solta uma cortina em volta do veículo por uns 20 s (o soldado joga uma granada de fumaça). A regra é uma só: linha de visada que atravessa a cortina está cortada, para os dois lados, para a IA e para a trava dos mísseis.

## O mundo

Casas, hangares, árvores e carcaças têm volume: param tiro, estilhaço e linha de visão, e podem ser destruídos. Nas vilas dá para entrar nos prédios pelas portas, janelas do térreo e buracos, subir pela escada e atirar das janelas; sem apoio as lajes caem. A mata densa esconde o soldado pela metade da distância; tanque e obuseiro derrubam árvores, veículo de rodas passa pelos vãos. Nenhum veículo de solo entra na água, a não ser o blindado anfíbio.

## Dia, noite e clima

O hangar escolhe também a hora e o tempo da partida. A hora é um relógio de luz que anda dez minutos de jogo por hora do dia: Dia começa às 9 h, Entardecer às 17 h (anoitece por volta da meia hora), Noite às 23 h, e Ciclo passa um dia inteiro em uma hora. O tempo é Limpo (calmo), Chuva (com vento), Neblina (baixa, rente ao chão) ou Variável (muda durante a partida). Online, vale a escolha do anfitrião.

À noite cada um vê pela óptica que tem: a olho nu a 30% do alcance de dia, com visão noturna a 60%, com mira térmica (blindados, aeronaves e a luneta do atirador de hoje) a 80%; o radar das antiaéreas não perde nada. Em 1944 não há visão noturna: a luz vem de sinalizadores, das granadas iluminativas da artilharia e dos holofotes das antiaéreas, que seguem o cano. O clarão do tiro revela quem atira. A chuva tira visão e audição, a neblina baixa esconde o que está dentro dela (a térmica vê mais longe nela) e o vento leva fumaça e sinalizadores. A regra é a mesma para a IA e para o jogador: o que você mesmo vê só entra no mapa do seu lado dentro desse alcance. À noite a IA lança sinalizadores e iluminativas sobre o que ouve.

## A IA

Cada lado tem um comandante que joga pelos pontos: reúne os pelotões a 720 m do objetivo, pede fumaça e fogo de morteiro e artilharia, e ataca com os blindados da estrada. Mantém guarnições nas vilas, guarda nas bases de suprimento e no veículo-rádio, emboscadas junto das estradas e uma equipe de morteiro. Uma linha sob o mapa e marcas nele mostram o que o comando do seu lado pretende: X o objetivo, círculo cinza a fumaça, círculo laranja o fogo, triângulo verde uma emboscada à espera. A IA não enxerga através de fumaça nem de paredes, conserta os veículos quando ninguém atira neles e usa drones (hoje).

Cada soldado, esquadra, veículo e aeronave da IA decide sozinho dentro da sua missão: guarda o que a própria percepção já viu (só o que viu, no degrau a que chegou: algo ali, a classe, o modelo), pontua as opções (cumprir a missão, recuar abaixo da força de recuo, atender um pedido) e escolhe a melhor. As regras de engajamento da missão valem para todos (segurar o fogo, só responder a quem atirou, fogo livre), e com latitude 0 um blindado não sai da estrada nem atende pedidos.

**Pedidos de ajuda.** As unidades pedem ajuda umas às outras pelo rádio, e responde quem estiver perto e puder, pela utilidade (a prioridade do pedido, a distância e o que custa à própria missão): esquadra pregada pede fogo HE a um tanque ou blindado a até 600 m; tanque numa vila pede uma esquadra a até 400 m para limpar o anticarro; veículo avariado ou sem munição chama um caminhão ou vai à base de suprimento; quem está sob ataque aéreo chama a antiaérea ou uma esquadra com míssil a até 1,5 km; observador ou atirador com alvo chama morteiro ou artilharia; esquadra a pé longe do posto pede carona a um caminhão. Um pedido aberto por unidade, por 60 s; recusado ou sem ninguém, sobe ao general, que anota tudo no diário (AJUDA) e pode vetar. Quem ajudou volta à missão. Os pedidos do seu lado aparecem no rádio e no mapa (losango amarelo): **8** atende o mais perto, **9** pede ajuda (a pé, fogo onde você mira; num veículo, reparo se avariado, senão infantaria).

**Comando, comunicação e guerra eletrônica.** As ordens do general e os relatórios das tropas vão pelo rádio. A rede de comando de cada lado é o QG (a torre de controle da base principal), os veículos-rádio (alcance maior com a antena levantada) e os operadores de rádio, com os rádios que eles pousam. Dentro da rede a ordem chega em 2 a 5 s; fora dela, em 20 a 60 s; cortada, não chega, e a ordem esquecida por 90 s se perde. Enquanto a ordem não chega, a esquadra segue a última missão. Os relatórios e os avistamentos de quem está fora da rede também atrasam: o inimigo aparece no mapa do general com a hora e o lugar em que foi visto, e as próprias esquadras fora da rede aparecem onde estavam na última notícia. O bloqueador (HMMWV, Tigr) corta a ligação perto dele e atrasa até 650 m. Quem transmite muito perto de um nó inimigo se revela por radiogoniometria e aparece no mapa do outro lado. Sem a torre o comando planeja a cada 9 s em vez de 3, até montar um QG reserva na base, 2 min depois, de alcance menor. A Visão de General mostra o alcance da rede, os bloqueadores, as esquadras sem rede ou cortadas e as ordens a caminho; o diário anota em RÁDIO o QG perdido, as ordens perdidas e os transmissores localizados, e a revisão pós-batalha soma ordens enviadas, atrasadas e perdidas, a demora média, o tempo sem QG e as localizações.

## Cargas dos aviões

Na ficha do hangar cada avião tem cargas prontas (Padrão, Bombardeio, Ataque ao solo, Superioridade aérea, Mista) e um editor por grupo de pontos de fixação. Há bombas de queda livre, de cacho e guiadas, mísseis ar-solo, foguetes, mísseis ar-ar de curto e médio alcance e munição extra. O peso conta: carregado, o avião acelera, sobe e curva pior, e melhora conforme solta. B e V disparam os dois primeiros armamentos e G passa a lista. A carga escolhida vale na decolagem e ao rearmar sobre a pista. No PvP o servidor confere a carga; uma recusada vira a padrão.

## Drones (só hoje)

O operador de drone leva o fuzil e quatro tipos. Y escolhe e L lança e põe os óculos; L de novo tira.

| Drone | O que faz | Sem sinal |
| --- | --- | --- |
| FPV de ataque (3) | Carga oca que detona ao bater, armada a 12 m do operador. Fraca na frente de um tanque, mortal no teto, na traseira, em veículos leves e em trincheira | cai |
| FPV bombardeiro (2) | Solta duas granadas de 60 mm e volta | volta sozinho |
| Reconhecimento (2) | Zoom, e o que ele vê aparece para a artilharia, os morteiros e o comando do lado | volta sozinho |
| Munição vagante (1) | L abre o mapa e Espaço lança do trilho junto da base; orbita e mergulha num alvo parado, ou você guia o mergulho | segue sozinha |

Voando, o soldado fica parado e indefeso, e um tiro recebido arranca os óculos. No modo assistido o drone voa para onde a mira olha (W avança, Shift e Z sobem e descem); X passa ao modo acro. O sinal cai com a distância, atrás de morros e casas e perto de um bloqueador (HMMWV e Tigr). Fuzil, metralhadora, antiaérea e estilhaço derrubam drones.

## Controles

"Controles", no hangar, mostra as teclas do veículo escolhido e o resumo da missão. Em todas as classes: C troca a câmera, H troca de veículo, Tab abre a visão de general, Esc solta o mouse, M abre o mapa de tiro onde ele existe.

**Avião.** Dois esquemas: "Clássico" (manche no teclado) e "Mira com mouse" (você aponta e o avião voa até a mira).

| Tecla | Ação |
| --- | --- |
| W / S, A / D | Manche (no clássico); com o mouse, A / D rolam à mão e W / S são o motor |
| Q / E | Leme |
| Shift / Z | Mais e menos motor |
| Espaço ou botão esquerdo | Canhão |
| B (ou botão direito), V | Primeiro e segundo armamento |
| G | Próximo armamento da lista |
| F | Flares e chaff |
| X | Freio aerodinâmico ou de mergulho |
| R ou roda do mouse | Zoom |
| 1 / 3 / 2 / 4 | Na cabine: olhar para a esquerda, a direita, para trás e para cima |

**Helicóptero.** W / S e A / D são o cíclico, Q / E os pedais, Shift / Z o coletivo, X liga o pairado automático. Espaço canhão, B foguetes, V míssil guiado, L guia o míssil à mão, Y trava o canhão num alvo, F flares, G pelotão (transporte), R zoom. Com a mira no mouse o nariz e a torre seguem a mira.

**Tanque, antiaérea, artilharia e transporte.**

| Tecla | Ação |
| --- | --- |
| Mouse | Apontar: a torre gira até a mira, e a cruz mostra para onde o cano aponta |
| W / S, A / D | Andar e girar o casco |
| Botão esquerdo ou Espaço, botão direito | Arma principal e secundária |
| G | Fumaça |
| V | Tanque: troca a carga do canhão, perfurante ou explosiva (custa uma recarga) |
| X | Freio |
| T | Segurar, parado: reparo de campo |
| I | Prioridade do reparo: motor e rodagem ou armamento |
| O | Veículo-rádio: levantar e recolher a antena |
| E / Q | Transporte: descer, e trocar de assento parado |
| F | Transporte, ao volante: chamar o pelotão a bordo ou mandar descer |
| R ou roda do mouse | Zoom da luneta, do rastreador ou do mapa de tiro |

**Infantaria.**

| Tecla | Ação |
| --- | --- |
| Mouse, W / S / A / D | Apontar e andar |
| Shift, Z | Correr; postura (em pé, agachado, deitado) |
| Botão esquerdo ou Espaço, botão direito | Atirar; mirar pela alça ou pela luneta |
| Q, R | Trocar de arma; recarregar |
| F, G | Granada de mão; granada de fumaça |
| E | Entrar no transporte aliado ao lado; a bordo, descer |
| N | Obras e cargas (veja "Obras") |
| O | Operador de rádio: pousar e recolher o rádio |
| U | Requisitar um veículo, dentro de um depósito |
| Y, L | Operador de drone: escolher e lançar |
| V | Morteiro: explosiva ou fumaça |
| 7 | Sinalizador (também nos veículos de solo): ilumina uns 260 m à frente por 28 s, seis por vida |
| 6 | Visão noturna (só hoje), em qualquer classe |
| 8, 9 | Rádio: atender o pedido de ajuda aberto mais perto; pedir ajuda aos NPCs perto (em qualquer classe de solo) |

**Controle e rádio de FPV.** O jogo lê qualquer controle pela Gamepad API: ligue, aperte um botão e ele aparece em Controles, com sensibilidade, zona morta e o botão de cada ação por classe. Um rádio de FPV em modo joystick USB voa os drones em acro; o assistente de mapeamento descobre os canais.

**Telas de toque.** O hangar oferece só os aviões, porque as classes de solo pedem mira com mouse. Os botões na tela são o manche, motor, fogo, os dois armamentos, ARMA (próximo armamento), FLARE, FREIO e ZOOM; os botões das outras classes (entrar e sair, obra, rádio, fumaça, requisitar) aparecem conforme o que você está usando.

## Revisão pós-batalha e dados das partidas

No fim de cada partida de conquista, "Revisão pós-batalha" mostra a curva de tíquetes dos dois lados com os pontos tomados e as perdas caras marcados, para onde foram os tíquetes (perdas, sangria, pontos e o resto, como requisições), as decisões do general que mais mexeram na margem nos 2 minutos seguintes, a custo-efetividade e a vida média de cada tipo de unidade e o custo da simulação. "Partidas anteriores", no hangar, lista as últimas 12 deste computador e as terminadas que o servidor guarda.

Quem simula a partida (o anfitrião, ou a página numa partida IA × IA local) registra os eventos e uma foto a cada 10 s e os manda ao servidor em lotes. O servidor grava um arquivo por partida em `data/matches/<época>/<data>-<id>.ndjson.gz` (uns 30 KB por 45 min), com um id sorteado e nenhum nome de jogador, e apaga o que tiver mais de 90 dias. Nada vai para fora do servidor.

- `ANALYTICS=0 npm start` desliga a gravação; `ANA_DIR=<pasta>` grava em outra pasta; `ANA_DAYS=<n>` muda a retenção; `ANA_DAY_MB=<n>` limita os MB gravados por dia (512); `HOST=127.0.0.1` deixa o servidor só neste computador.
- `node tools/balance.js` junta as partidas guardadas e imprime vitória por lado (um lado acima de 60% em 40 partidas é alerta), por doutrina, como e quando as partidas acabam, para onde foram os tíquetes e a custo-efetividade por tipo.
- `node tools/balance.js --torneio 40` joga 40 partidas IA × IA sem tela na simulação de verdade, cada par de doutrinas dos dois lados, grava como o servidor grava e mostra os mesmos números. `--era`, `--docs`, `--min` (relógio curto), `--eco`, `--jobs` e `--save` ajustam; `--help` explica. Uma partida Curta leva uns 6 min de um núcleo.
- O MCP do general tem `get_match_report` (§ `MCP.md`).

## PvP online

No hangar, escolha "PvP online", um nome, a época, a classe e o veículo, e entre na sala. Cada época é uma sala e o lado do veículo é o time. A IA mantém a batalha dos dois lados, e quanto mais gente entra num lado, menos IA ele recebe. Quem simula a IA, os pontos e os tíquetes é o navegador do jogador mais antigo (o anfitrião); se ele sai, o seguinte continua a mesma batalha. Quem sai da sala ao volante deixa o veículo estacionado.

Quando o último jogador sai (um F5, por exemplo), a partida fica suspensa, com o relógio parado, por 15 minutos (`SUSPEND=900`, em segundos; `SUSPEND=0` encerra a partida como antes). O hangar mostra então "Continuar", que retoma a partida de onde parou, e "Nova partida", que a descarta. A partida suspensa fica só na memória do servidor: reiniciá-lo a perde.

- Na rede local: o servidor imprime os endereços `http://IP:8080` ao iniciar.
- Pela internet: exponha a porta 8080 ou use um túnel, como `cloudflared` ou `ngrok`.

## Testes

Rodam no Node, sem navegador, contra a página e o servidor publicados (`PAGE=`, `SERVER=` e `PORT_T=` trocam). A lista completa, com o que cada suíte cobre, está em `tests/README.md`.

```
sh tests/all.sh                 # as suítes principais em sequência, uma linha por suíte e os logs em tests/logs/
node tests/heli.js              # uma suíte só
SUITES="relay online" sh tests/all.sh
```

Há suítes de simulação (`infantry`, `squads`, `field`, `bases`, `world`, `forts`, `city`, `transport`, `crew`, `damage`, `missiles`, `heli`, `heli-arms`, `heli-ai`, `loadout`, `drone`, `pad`), do servidor (`relay` e as `*-relay`), de ponta a ponta pelo servidor de verdade (`online` e as `*-online`) e contra um servidor antigo (`*-oldserver`, com `SERVER=<server.js antigo>`). `soak.js` e `transport-battle.js` são longas.
