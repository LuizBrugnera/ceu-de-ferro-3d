# Mãos no lugar da arma em 1ª pessoa (cf-armas-fp): testado em parte

## O que mudou

Na arma em 1ª pessoa (`vmBuild`, `vmRender`):

- **As mãos ficam onde cada modelo é segurado** (`VMH`, por modelo do pack, em metros do `.glb`). A direita fica no punho (no Kar98, no delgado da coronha). A esquerda fica no lado esquerdo do guarda-mão (`u`), na empunhadura frontal (`v`, MP40/MG 42/BAR/MP7/Vityaz) ou envolvendo a direita (`c`, pistola). Antes, as mãos eram postas pela caixa do modelo (a direita no pivô do pack, a esquerda sob o meio da caixa) e boiavam embaixo das armas. Um modelo sem entrada (morteiro, granada, mina) fica como era.
- **Os braços saem dos ombros** (`VMS`, fixos no quadro do olho) e chegam às mãos com dois ossos (`vmElbow`, o cotovelo para baixo e para fora). Eles acompanham a arma ao andar, correr, mirar e trocar de arma. Fora do alcance, o braço fica reto e esticado. Antes, eram dois cilindros fixos, pendurados na arma.
- **Recarga** (`vmHandPose`, `VMR`): a arma sobe, vira para dentro e gira o carregador para o olho, e a mão esquerda vai ao carregador, tira o velho e põe o novo. No Kar98, a mão vai ao pente, por cima da culatra. Nos lançadores, a mão desce para o próximo foguete e volta, e o tubo só abaixa um pouco. Antes, a recarga baixava a arma 13 cm, para fora da tela.
- **Ferrolho**: depois de cada tiro de um fuzil de ferrolho (`vmEjectAt` = `VMC.bolt`), a mão direita vai à bola do ferrolho, puxa e volta ao punho.
- **Na cintura**, a mão direita fica no mesmo lugar em qualquer modelo (`VMPOS`), mais baixa e mais longe do olho do que antes (antes a arma tomava o quarto inferior direito da tela). Escolha do capitão no quadro (opção "baixa e afastada"). Mirando, a arma vai para o meio dela mesma, sob o olho (o Kar98 estava 3,4 cm fora).
- **RPG-7 e bazuca**: o modelo `w_bazooka` é o RPG-7 e vinha com a ogiva para trás e os punhos de lado. Agora ele é virado (`rot`) e o RPG-7 usa esse modelo. A bazuca M1 usa o tubo liso com miras (`w_rpg`).
- **Luva de hoje** em cor coiote. Antes era quase preta e, numa arma preta, não dava para ver onde a mão segurava.

## Testado

- `tests/arma-maos.js` (no `all.sh`): toda arma de `VMW` tem os pontos do seu modelo, e cada ponto está no `.glb` de verdade (punho a menos de 2,5 cm, apoio a menos de 3,5 cm, carregador e ferrolho). Também confere o cotovelo e os caminhos das mãos na recarga e no ferrolho.
- No navegador (Chromium sem GPU, 1280 × 800 e 1920 × 1080, sala PvP como Fuzileiro dos EUA, arma trocada no lugar), na cintura e mirando: M4, AK, Kar98, MP40, M82, M1911, RPG-7, Javelin, bazuca e MG 42. Na recarga: M4, Kar98, M1911, MP40 e RPG-7. As mãos aparecem no punho e no guarda-mão.
- Custo: mãos e braços levam cerca de 0,014 ms por quadro. O número de malhas é o mesmo de antes (2 punhos, 4 segmentos de braço).

## Não testado

- O ferrolho visto no jogo (só no teste), a corrida e a troca em movimento, o morteiro, a granada e a mina dos compartimentos (estes ficam como eram).
- Os kits de 1944 e dos Insurgentes com as cores de manga de cada lado, noite e neblina, online.
- Ao mirar com o Kar98, a mão direita no delgado da coronha fica logo abaixo da linha de visada: é assim que ele é segurado.

## Como testar

`node server.js`, Infantaria, Entrar na sala e **C** até a visão de olho. Troque de kit no hangar, ande, mire (botão direito), recarregue (R) e atire com o Kar98 de 1944.
