# cf-pol-modelos: esteiras nos veículos sobre lagartas feitos à mão (testado em parte)

## Testado em 01a2c7d (cf-pol-testes-b, 2026-11-21): parte
- Na mesma medição do `cf-pol-modelos-rodas.md`, as rodas de rodagem do tanque giram (39 m, giro 5,9); a esteira não corre, como o documento diz.
- **Continua sem teste:** o destroço e o dano escurecendo a esteira.

## O que mudou

Os veículos sobre lagartas que o `buildTrn` desenha à mão eram uma fila de rodas pretas com uma caixa preta chata embaixo, no lugar da esteira. São eles:

- os veículos-rádio Sd.Kfz. 251 e M3 Half-track;
- os postos de comando M577 e MT-LBu;
- os de socorro Bergepanther, M32, M88A2 e BREM-1.

Agora, no mesmo embrulho dos cubos (`TBELT`):

- a caixa sai;
- cada lado ganha uma esteira em volta da fila de rodas: o trilho de cima, o de baixo e as voltas das pontas, abertas, para os cubos das rodas da ponta aparecerem;
- a roda dianteira de esterço da meia-lagarta (a mais de 1,4 m da seguinte) fica de fora, como na de verdade;
- as esteiras de um veículo são uma malha só, que escurece com o dano das rodas (`pm`).

Custa uma chamada de desenho a menos por veículo do que as duas caixas.

## O que foi testado

No navegador, a galeria dos oito veículos de frente e de trás (imagem na PR).

## O que NÃO foi testado

- Numa partida: andando, os cubos rodam, mas a esteira não corre.
- O destroço: fica com as caixas de antes (o embrulho não age no destroço).
- O dano escurecendo a esteira junto com as rodas.
