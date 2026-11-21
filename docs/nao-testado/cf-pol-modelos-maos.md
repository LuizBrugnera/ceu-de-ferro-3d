# cf-pol-modelos: as duas mãos na arma do soldado do pack (testado em parte)

## O que mudou

O soldado animado do pack (o SWAT do Quaternius) mira como com pistola: o braço direito estendido e o esquerdo caído do lado. Por isso o fuzil, a metralhadora e o lançador pareciam pendurados numa mão só, ou boiando no peito com os braços longe dele.

Agora (`PIK`, `packReach`, `packHands`), depois do clipe, cada braço é dobrado por um alcance de dois ossos:

- o braço de cima vira para o cotovelo cair onde os dois comprimentos se encontram, puxado para baixo e para fora;
- o antebraço vira para o alvo;
- a mão direita vai à empunhadura da arma (o pivô dela no pack);
- a mão esquerda vai ao guarda-mão (`PIK.fore` do comprimento à frente da empunhadura).

Vale em pé, agachado, andando, correndo e atirando, na partida (`packPose`) e no cartão do hangar (`manModel`). Deitado, morto, civil ou sem arma, nada muda.

Na partida, só para o soldado a até 70 m do olho (`PIK.far`); mais longe as mãos não se veem. Só a cadeia do braço é recalculada (os ossos acima dele e os três do braço), nunca o esqueleto inteiro.

Custo medido na página com GPU: 0,75 ms por quadro com 48 soldados forçados a perto. É o pior caso, o máximo do Alta. Uma primeira versão, que recalculava o esqueleto inteiro, custava 4 ms; reescrevi.

O lançador de ombro (`w_launcher`: Javelin, Stinger, Igla, Strela, Malyutka, Kornet) era verde-menta e verde-vivo, cores da fonte. Agora é verde-oliva, com a faixa de aviso apagada (`PACK.fix`, coberto por `tests/pack-colors.js`); vale também na 1ª pessoa.

## O que foi testado

- No navegador, com GPU, o soldado do pack posto pelas mesmas funções da partida, de perfil, antes × depois (imagem na PR):
  - fuzileiro em pé, agachado e correndo com o M4;
  - Schütze com o Kar98k;
  - operador de Javelin.
- Os cartões do hangar de seis soldados.
- `tests/pack-colors.js` com a regra nova.

## O que NÃO foi testado

- Um soldado do pack numa partida visto de perto com as mãos (na batalha da demonstração eles ficaram atrás de sacos de areia e barracas).
- A recarga, a granada e a troca de arma.
