# Casas, paredes grossas, calibre, granadas e abrigo (cf-casas-paredes): testado em parte

O que é (no main): paredes com espessura (`CITY.mat` `th`, `pen`; `bRay`, `bldWalk`), calibre contra parede (`CITY.pen`, `bPow`, `bRes`, `bThru`, `bOut`), celeiro de madeira, granada com espoleta que quica e rola (`GRN`, `nadeStep`), a API de abrigo `bldCover`/`covBld` e o desenho novo das casas (`cityScene`, `CLOOK`).

## Testado (cf-pol-testes-a)

Sem navegador, mapa v6, nas duas épocas, um tiro em ângulo reto numa parede cega do térreo com um soldado logo atrás, cada tiro numa parede própria (`tests/walls-pen.js`, novo):
- fuzil de soldado para no reboco e atravessa a madeira do celeiro e a chapa do galpão;
- .50 do avião (P-47) atravessa tijolo e para na pedra da igreja; 20 mm atravessa a pedra;
- perfurante do Sherman e do Abrams atravessa a parede da casa e mata quem está atrás.
- **Falhou:** a .50 dos veículos não atravessava nem reboco: a M2 do Sherman, a Kord do T-90, a NSVT e a DShK (`mg` sem `ap`, força 1) e a quádrupla do M16 (dano 2,6 por bala, cortado pela cadência: força 1,6) paravam no tijolo, contra o que a doc pedia (".50 atravessa reboco e tijolo"). **Consertado** em `bPow`: a bala tem pelo menos a força do seu calibre (`CITY.pen.cal`: 12,7 mm 2,3; 14,5 mm 2,8; 20 mm 4; 30 mm 6; `b.cal` que a arma já põe na bala). Antes: as 5 checagens de .50 de veículo falham; depois: passa. Efeito no jogo: a metralhadora .50 do tanque e do M16 agora fere quem está atrás de reboco e tijolo (não de pedra nem concreto). O fuzil de soldado (inclusive o .50 do atirador) continua com força 1.
- Granada: estoura em 3,6 s; jogada contra a parede de 6 m volta e estoura do lado de quem jogou; no chão aberto quica 2 vezes, toca o chão a 8,5 m e para rolando a 12 m.
- `covBld` com o inimigo a 40 m de uma parede: os lugares de dentro dão para o inimigo e os de fora ficam do lado oposto; a ordem pesa a distância (uma parede cega a 2 m vem antes de uma janela a 28 m).

No navegador (Chromium sem tela, WebGL por software, qualidade Média, imagens em `/home/luiz/secondmate/data/cf-pol-testes-a/ag1/proof/web/`): `house-out.png`, uma casa de reboco a 9 m: janela com vão fundo (moldura, peitoril, o lado de dentro visível), beiral, rodapé escuro no térreo, sem buraco nem piscar; `house-in.png`, de dentro: parede rebocada clara, teto, a janela com espessura e peitoril. Sem erro novo no console.

## Não testado

- O resto da aparência: Alta, venezianas, chaminé, cornija, as cores por região e época, o buraco de carga e de canhão; soldado andando dentro da casa com a parede grossa (portas, escada, andar de cima); a granada entrando por janela (ver `cf-cerebro-soldado.md`: a da IA atravessou a casa) e parando em laje; online com convidado.
- As suítes `infantry.js`, `perception.js`, `drills.js`, `city.js` e o custo (`frame-budget.js`, `clock.js`): a fila de memória da máquina não deixou.
- Balanço: tanques e M16 agora matam através de reboco e tijolo; prédios podem virar armadilha.

## Como testar

- `node tests/walls-pen.js`, `node tests/world.js`, `node tests/ram.js`, `node tests/infantry.js`, `node tests/perception.js`.
- No jogo: entrar numa casa, atirar de dentro na parede (a poeira sai na face de dentro); quebrar uma parede com carga e com canhão (vão, peitoril e venezianas somem com o buraco); granada pela janela; online, a granada de um aparece igual no outro.
