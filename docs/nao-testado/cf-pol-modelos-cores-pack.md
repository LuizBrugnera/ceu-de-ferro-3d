# cf-pol-modelos: cores do pack consertadas na chegada (testado em parte)

## O problema

Os modelos do pack (`models/pack/*.glb`) têm duas cores por peça: a "pintura" (tons de cinza que a página tinge com a cor do lado) e a "fixa" (a cor que veio da fonte). Algumas cores fixas eram de brinquedo ou de outro exército:

- **Sherman**: lagartas e rodas azul-claro; extintores vermelhos e brancos atrás; uma caixa verde-vivo na torre.
- **M1A1** (`tk_leo`): rodas-guia azul-marinho; a saia do casco e partes da torre verde-oliva sobre o casco cor de areia.
- **T-72/T-90**: refletores amarelos.
- **Jeep e Kübelwagen**: pneus azul-marinho; para-brisa ciano-claro.
- **Tigr**: portas grená; para-brisa quase branco.
- **Técnicas e picape-bomba**: carroceria azul-céu.
- **Tiger e Panzer IV**: rodas, a faixa do casco e o cano numa cor fixa marrom ou malva. O Tiger saía marrom-avermelhado de qualquer lado.
- **Soldado** (SWAT do Quaternius): colete, capacete, joelheiras e botas pretos; um alemão de 1944 e um russo de hoje pareciam policiais.

## O que mudou

`packFix(id, P)` roda uma vez, quando cada modelo chega (`packGet`), com as regras de `PACK.fix[id][peça]`. Cada regra é `[cores, destino]`; vale a primeira que casa com a cor do vértice (tolerância `PACKFIX.tol`):

- **uma cor**: troca por ela;
- **'steel'**: o aço escuro de lagartas e pneus, mantendo o claro e o escuro do modelo;
- **um tom de 0 a 1**: o triângulo passa para a pintura e pega a cor do lado. Ele entra na pintura que a peça já tem (sem chamada de desenho a mais); só a peça sem pintura ganha uma.

O resultado:

- lagartas e pneus num aço escuro neutro;
- rodas, faixa e cano do Tiger e do Panzer IV, saia do M1A1, portas do Tigr e carroceria das picapes na cor do lado;
- os extintores e refletores escuros;
- os para-brisas num vidro escuro;
- o equipamento do soldado (colete, capacete, joelheiras, botas) na cor do uniforme do lado, mais escura (o corpo do soldado tem esqueleto: a regra vale para o nó `body`).

Os arquivos `.glb` não mudam (não precisa baixar as fontes de novo). Os triângulos não mudam. O que vira pintura entra na pintura que a peça já tinha. Só o cano do Panzer IV e a carroceria da picape não tinham pintura e ganham uma: uma chamada de desenho a mais em cada um desses veículos.

## O que foi testado

- `node tests/pack-colors.js` (novo): roda `packFix` nos `.glb` de verdade e confere quatro coisas:
  - todo triângulo que vira pintura sai da cor fixa;
  - lagartas e pneus ficam escuros e neutros;
  - as cores trocadas somem;
  - nenhum triângulo se perde.
- O teste nasceu de um erro meu nesta mesma rodada: recolorir o vértice antes de decidir o triângulo deixava 7 mil triângulos do Tiger brancos na cor fixa.
- No navegador:
  - a galeria do hangar dos tanques, de seis veículos (Kübelwagen, Jeep, Tigr, técnicas, picape-bomba, HMMWV) e dos soldados de cada lado, antes e depois;
  - a partida no Tiger e num fuzileiro russo, antes e depois.

## O que NÃO foi testado

- Civis, armas e objetos do pack não foram revistos (as cores deles não pareciam erradas na galeria).
- A arma em 1ª pessoa e o soldado no hangar usam o mesmo modelo e pegam o mesmo equipamento; a 1ª pessoa não mostra o corpo.
- Não vi os tanques consertados numa partida, nem o destroço deles (o destroço escurece pintura e cor fixa como antes).
- As picapes dos Insurgentes agora pegam a cor do lado deles. A picape-bomba disfarçada também pega: ela já era a picape azul de todo civil, e agora fica da cor dos Insurgentes.
