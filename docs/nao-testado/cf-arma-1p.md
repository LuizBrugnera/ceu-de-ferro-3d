# Arma da infantaria em primeira pessoa com o modelo do pack (cf-arma-1p) — não testado

Pedido do capitão: "a visão em primeira pessoa da infantaria das armas é bem ruim, ele ainda não usa o modelo da arma". Antes, a arma em primeira pessoa era desenhada em 2D no vidro (`fpMan`: dois trapézios para coronha e cano e um tubo para os lançadores).

## O que mudou

- **Arma em 3D na primeira pessoa** (bloco "first person: the weapon in hand as a model", logo depois do bloco do pack em `Céu de Ferro 3D.html`): a pé, na visão de olho (`SEAT.inf`), a arma do kit é o modelo do pack (`VMW`: qual modelo e o comprimento de cada arma) com duas mãos e dois braços simples (caixas na cor do uniforme do lado; mãos com luva hoje, pele em 1944).
  - **Camada própria**: cena (`VM.sc`) e câmera (`VM.cam`, FOV fixo de 54°, `VM.fov`) só dela, desenhadas depois do mundo com só a profundidade limpa (`render3d` → `vmRender`). Não atravessa parede e o zoom da mira não a estica. A luz é a do mundo (céu e sol, com o sol girado para o referencial do olho).
  - **Quadril e mira (ADS)**: do quadril fica embaixo à direita; mirando (`camSt.ak`), o topo da arma sobe até logo abaixo da linha de visada, no centro, e as marcas de mira de antes (ponto vermelho com o tubo, alça e massa de 1944, janela do buscador do Javelin/Stinger/Igla, escada de distâncias do lançador de foguete) continuam desenhadas por cima, **sem mudança no visual** (o remake das miras é do cf-miras-visual). Lançadores ficam no ombro, ao lado do olho. Com a luneta do sniper (`scoped`), a arma some e fica a luneta de sempre.
  - **Movimento**: balanço ao andar (pela passada `P.step`), respiração parada, recuo (para trás e para cima; maior no lançador e na pistola), recarga (abaixa e gira enquanto `a.rl` corre), troca de arma (sobe de baixo durante `P.swT`), correr (arma atravessada no peito), arrasto ao girar a vista, clarão na boca do cano ao atirar (não nos lançadores; desligado com "reduzir movimento").
  - **Armas por kit**: Kar98k (k98, Garand, M1 Carbine), M4 (M4, M249), AK (AK-12, AKM, PKP, PKM), submetralhadora (MP 40, MP7, Vityaz, MG 42, BAR), bazuca (Bazooka, Panzerfaust), RPG (RPG-7 e PG-7V antiga), lançador de ombro (Javelin, Stinger, Igla, Strela, Malyutka, Kornet), **novos**: fuzil de precisão (M82, OSV-96, SVD) e pistola (P38, M1911, M17, MP-443, Makarov). Os snipers de 1944 (Kar98k ZF39, Springfield M1903A4) usam o Kar98k com uma luneta de cilindro por cima. Os mapeamentos de metralhadora seguem os que o capitão aprovou no pack (`PACK.arm`). Operador de rádio, de drone e sapador usam a arma pequena do kit (o drone em voo tem a câmera dele, sem arma).
  - **Morteiro**: o pack não tem; fica um tubo de caixas próprio (tubo inclinado e placa de base), sem modelo de licença externa.
- **Dois modelos novos no pack** (pelo mesmo `tools/pack/build.js`, licença registrada em `models/LICENSES.md` e em `tools/pack/config.js`): `w_sniper.glb` ([Sniper Rifle](https://poly.pizza/m/i65hEldsw6), Quaternius, CC0 1.0) e `w_pistol.glb` ([Pistol](https://poly.pizza/m/52kQzphmeF), Quaternius, CC0 1.0). Os dois vieram da lista de candidatos do cf-pack-modelos. Os soldados vistos em terceira pessoa **não** mudaram (continuam com `PACK.arm`).
- **Fallback** (a arma 2D de antes, igual era): pack desligado (`?pack=0`, `localStorage cf-pack 0`, página aberta de `file://`, servidor sem a rota do pack, nível `?packq=0`), `?vm=0` ou `localStorage cf-vm 0`, dentro de veículo, e enquanto o GLB da arma ainda não chegou (o da outra arma do kit é pedido junto, para a troca achar o modelo).
- Hitbox, balística, mira, IA e rede não mudam: só o desenho.

## O que NÃO foi testado

Nada de suítes, partidas nem A/B (regra do capitão). Só: sintaxe da página, do servidor e do `config.js`; o servidor sobe e entrega `w_sniper.glb`/`w_pistol.glb` (200); a página abre sem erro novo no console; e, no console da página, `vmGet` monta o modelo de primeira pessoa de **todas** as armas de `SARMS` sem exceção (posições de mira calculadas).

**Nenhuma arma foi vista em primeira pessoa numa partida.** Não visto:

- Se a arma aparece no lugar certo (quadril e mira), no tamanho certo e virada para a frente (o cano para +x do modelo foi conferido só pelos números da malha de `w_sniper` e `w_pistol`).
- Se as mãos e os braços encostam na arma ou ficam flutuando/atravessando (posições escritas à mão, iguais para todas as armas de cada tipo).
- Se o topo da arma fica logo abaixo do ponto vermelho / da alça e massa ao mirar, sem tapar o alvo.
- Recuo, balanço, recarga, troca, correr e o clarão em movimento.
- Luz (noite, neblina) e a cor das mangas para cada lado (EUA, Rússia, Insurgentes, Luftwaffe, Aliados).
- Desempenho (um modelo só, perto da câmera; não medido) e em telas largas (1280 e 1920 px) ou estreitas.
- Online como convidado, espectador, modo general.

## Riscos

1. **Encaixe**: arma alta ou baixa demais na mira (o "topo" é a caixa da malha: na M4, a alça de transporte; numa arma com carregador alto, a arma escalada pode ficar muito baixa — MG 42/BAR usam a submetralhadora esticada). Ajuste em `VMP` (posições) e `VMW` (comprimentos).
2. **Braços**: o mesmo desenho para todas as armas; podem cruzar a arma ou aparecer na borda da tela de jeitos estranhos, principalmente com lançadores e morteiro.
3. **Lançadores no ombro**: o tubo pode tapar parte da vista ao mirar (fica 5 cm à direita do olho, pelo tamanho da caixa).
4. **Luz**: a luz copiada do mundo é a primeira hemisférica e a primeira direcional da cena; se a cena tiver outra luz antes (efeito), a arma pode ficar escura ou clara demais.
5. **Morteiro**: tubo de caixas simples, sem animação de montagem.
6. As marcas de mira 2D aparecem só com a mira acima da metade (`camSt.ak > .5`), num fade; na transição a arma 3D anda e as marcas entram.

## Como testar depois

```
node server.js            # http://localhost:8080
```

1. Hangar, aba Infantaria, era Hoje, lado EUA: entrar como Fuzileiro, apertar **C** até a visão de olho. Ver a M4 embaixo à direita com as mãos; andar, correr (Shift), atirar (recuo e clarão), recarregar (R), mirar (botão direito): o topo da M4 logo abaixo do ponto vermelho.
2. Repetir com cada kit: Atirador de M249, Javelin (mira: janela do buscador), Stinger, Rússia (AK, PKP, RPG, Igla), Insurgentes (AKM, PKM, RPG-7, SVD, Malyutka, Kornet, Strela, morteiro, homem-bomba com Makarov), 1944 Luftwaffe e Aliados (Kar98k, MG 42, Panzerfaust, Garand, BAR, Bazooka), sniper (luneta: a arma some) e a pistola do sniper (trocar de arma: a arma sobe de baixo), morteiro (tubo), sapador, rádio e drone.
3. Encostar numa parede e mirar: a arma não entra na parede.
4. Noite e neblina (opções da partida): a arma acompanha a luz.
5. `?vm=0` e `?pack=0`: volta a arma 2D de antes, igual era. `?packq=0` também.
6. FPS: partida de infantaria, 2 min em primeira pessoa com e sem `?vm=0`.
7. Telas 1280 e 1920 px de largura e uma estreita: a arma na mesma posição relativa.
8. Refazer os dois modelos novos: `PACK_SRC=/tmp/pack-src node tools/pack/build.js --fetch w_sniper w_pistol` (rede e ffmpeg).

## Arquivos

`Céu de Ferro 3D.html` (bloco novo depois do pack, `render3d` chama `vmRender`, `fpMan` só desenha as marcas quando a arma é 3D), `tools/pack/config.js` (2 fontes e 2 modelos), `models/pack/w_sniper.glb`, `models/pack/w_pistol.glb`, `models/LICENSES.md`.
