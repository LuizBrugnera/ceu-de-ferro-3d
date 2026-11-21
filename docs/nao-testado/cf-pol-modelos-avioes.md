# cf-pol-modelos: hélices que giram e insígnias nos aviões e helicópteros (testado em parte)

## O que mudou

Nos aviões feitos pelos números (todos menos o F-22 e o A-10, que têm modelo com textura), bloco depois do da antiaérea:

- **Pás das hélices** (`PROP`): o Stuka, o Bf 109, o Spitfire, o P-47, o He 177 e o B-17 ganham pás de verdade, uma malha por hélice:
  - 3 ou 4 pás por modelo;
  - no nariz e em cada nacele dos bombardeiros.
  - Elas giram com o motor: mais rápido com mais manete, e param devagar quando o avião é abatido.
  - Quanto mais rápido, mais elas somem no disco translúcido que já existia, que aparece mais; no hangar ficam paradas e nítidas.
- **Insígnias** (`INSIG`), desenhadas uma vez num canvas:
  - a Balkenkreuz no Stuka, no Bf 109 e no He 177;
  - o cocar da RAF no Spitfire;
  - a estrela com barras no P-47 e no B-17;
  - a estrela vermelha no Su-57, no Su-25 e no Tu-160.
  - Elas vão em cima e embaixo da asa principal, filhas da malha da asa: somem com a asa perdida e encurtam com a asa cortada. Vão também dos dois lados da fuselagem (menos nas fuselagens achatadas, como a do Su-57).
  - O B-2 não leva nenhuma.
  - Os helicópteros levam a sua dos dois lados do cone de cauda, perto da raiz: a estrela no Apache e no Black Hawk, a estrela vermelha no Mi-28 e no Mi-8. Isso vale no carrossel do hangar e na partida.
  - O avião queimado escurece as insígnias e as pás como o resto.
- Só o visual: física, caixas de acerto, peças de dano e rede não mudam.

## O que foi testado

- `node tests/plane-looks.js` (novo) confere as tabelas:
  - todo avião com hélice tem as pás contadas;
  - todo helicóptero tem insígnia;
  - nenhum avião com textura está nas tabelas;
  - toda insígnia é uma que a página desenha;
  - cada lado usa a sua.
- No navegador:
  - a galeria do hangar de todos os aviões e helicópteros, antes e depois;
  - numa partida de verdade no Bf 109: a hélice girou 10 rad em 0,32 s de jogo com a manete toda, as pás em 0,18 de opacidade e o disco em 0,30; a insígnia aparece na asa em voo (imagem na PR).
- Custo: cena com 27 aviões (3 de cada um dos nove), medido antes e depois (números na PR). Cada helicóptero ganha 4 triângulos e uma chamada de desenho.

## O que NÃO foi testado

- O avião abatido: as pás parando devagar e as insígnias escurecendo no destroço que cai.
- A asa cortada pela metade com a insígnia (ela é filha da asa e encolhe junto, mas não foi vista).
- A cabine (visão de dentro): as pás girando na frente do piloto.
- O destroço de asa que voa (`debrisMesh`) sai sem a insígnia.

## Como testar depois

1. `npm start`, hangar, aba Avião nas duas épocas: pás e insígnias em todos os aviões feitos pelos números.
2. Partida num caça a hélice: subir e baixar a manete (Shift/Z) e ver as pás borrando no disco; olhar pela cabine.
3. Derrubar um avião inimigo e ver a hélice parando; arrancar a ponta de uma asa e ver a insígnia.
