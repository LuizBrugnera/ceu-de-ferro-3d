# cf-pol-armas: o som das armas (testado por suíte e no navegador, não de ouvido)

## Testado em 8bc0243 (cf-pol-testes-b, 2026-11-21): parte
- `tests/som.js`: passa (52 ok). O que este documento diz que falta é de ouvido ou de veículo, online ou com outra arma, e não coube antes do prazo da tarefa (09:00Z).

## O que mudou

Tudo na seção `sound` da página (`SND`), sem arquivos de som:

- **Cada arma a sua voz** (`shotVoice`): pistola, submetralhadora, fuzil, fuzil de ferrolho ou de batalha (Kar 98k, Garand), metralhadora, fuzil de precisão, metralhadora pesada (.50, 14,5 mm) e canhão (20 mm ou mais), pelo calibre (`calOf`) e pelo tipo. Antes todo tiro era o mesmo chiado de 70 ms. As pesadas ganham uma batida grave por baixo (`thump`).
- **Distância:** o tiro longe fica mais baixo (metade a 80 m), mais abafado (o corte cai pela metade a 700 m: o ar leva os agudos) e chega atrasado pela velocidade do som (d / 343 s: um tiro a 1 km se ouve 2,9 s depois do clarão). As explosões também chegam atrasadas e abafadas, com o mesmo volume de antes. O lançamento de foguete ou míssil de outro cai com a distância: antes soava igual do outro lado do mapa e ao lado.
- **Bug:** o tiro do próprio jogador dividia a trava de 55 a 90 ms com o tiro de todos. Um tiro da IA logo antes calava o dele: com fogo da IA a cada 20 ms, 1 de 5 tiros da M4 do jogador era ouvido. Agora o do jogador tem a sua trava (30 ms) e, se dois caem no mesmo quadro lento, o segundo toca 30 ms depois em vez de sumir.
- **Compressor** no volume geral: muitas explosões e tiros juntos não estouram.
- **Mãos do soldado:** carregador saindo e entrando no recarregar, o ferrolho depois do tiro de um fuzil de ferrolho, o clique da arma vazia sem nada para recarregar, a troca de arma, o lançador recarregado.
- **O estalo da bala inimiga** que passa a menos de 6 m da cabeça do soldado (um zumbido para a bala lenta, abaixo de 340 m/s). Bala amiga e a própria não estalam.

## Testado

- `tests/som.js` (sem navegador, sobre um AudioContext que grava): todos os itens acima. Contra a página do main, a parte do bug falha ("1 de 5"), o compressor também.
- Navegador (Chromium headless, swiftshader, 800 × 500, partida moderna como Fuzileiro, 40 s com o gatilho apertado): o AudioContext roda (`running`), o compressor está no lugar, nenhum erro no console. Na primeira rodada, 11 tiros da M4 deram 9 sons: a 0,2 quadro/s dois tiros caíam no mesmo quadro e o segundo era descartado. Depois da mudança (o segundo toca 30 ms depois), 12 tiros deram os 12 sons.
- Custo: a varredura das balas perto da cabeça leva cerca de 14 µs por quadro com 400 balas no ar (Node, máquina cheia).

## Não testado

- **De ouvido.** Ninguém escutou: o volume de cada voz, o equilíbrio entre o tiro do jogador, o da IA e as explosões, o compressor numa batalha cheia e se o estalo da bala incomoda numa metralhadora inimiga contínua.
- O helicóptero, o drone, o motor e o alarme de míssil não mudaram.
- Online (os tiros dos fantasmas passam pelas mesmas funções, mas não foi rodado com dois navegadores).

## Como testar

`npm start`, entrar como Fuzileiro (M4), Atirador de M249, Schütze (Kar 98k) e Atirador de elite. Atirar perto e ouvir a IA atirando longe (o som chega depois do clarão), recarregar, trocar de arma, gastar toda a munição e apertar o gatilho. Ficar sob fogo de uma metralhadora inimiga e ouvir o estalo. Entrar num tanque e num avião e conferir o canhão e a metralhadora.
