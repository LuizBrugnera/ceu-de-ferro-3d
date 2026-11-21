# cf-pol-armas: o acerto no jogador, ouvido (testado por suíte, não de ouvido)

## O que mudou

Quando uma bala ou um projétil acertava o tanque, o avião ou o soldado do jogador, só a vista tremia. Agora ele ouve onde foi acertado (`fx.hurt`, `HURT`):

- **A blindagem segura** (`res` 1) **ou o projétil ricocheteia:** a placa toca, um tom caindo de 2600 a 1500 Hz com um clangor. O ricochete voltava `null` de `strike` e não passava pelo dano; agora chama `fx.hurt` ali mesmo.
- **Entra** (`res` 0 ou 2): um baque grave sob um estalo áspero, mais alto quanto maior o dano.
- **Placa reativa** (`res` 3): um estouro.
- **Explosão perto:** um baque.
- **Bala na pele da aeronave, do caminhão ou na placa do tanque:** um tique.
- **O soldado do jogador atingido:** um baque surdo no corpo.

Um som a cada 50 ms no máximo. Fora da partida, nada. Online, toca quando o dano é dele: quando o acerto calculado pelo atirador chega (`rx`), não antes.

## Testado

- `tests/hurt.js`:
  - quem chama `fx.hurt`: o tanque do jogador, o soldado dele, e não um tanque do lado dele;
  - online, só com o `rx`;
  - 2000 projéteis de todo lado e de cima no tanque do jogador: 45 ricochetearam, e os 45 foram ouvidos;
  - cada som e o limite de um por vez.
- No navegador: veja o PR.

## Não testado

- De ouvido: o volume contra o tiro do próprio tanque e as explosões, e se o tique da metralhadora inimiga no casco cansa.
- Online com dois navegadores.

## Como testar

`npm start`, entrar de tanque e deixar um tanque inimigo atirar de frente (ricochete e o que segura) e de lado (o que entra). Entrar de avião e passar por uma antiaérea. Entrar a pé e ficar sob fogo.
