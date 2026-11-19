# cf-gbu-lock — lock da GBU no alvo mais perto do alcance (não testado)

## O que mudou
- Novo `LO.lockBomb(p, o)`: para bombas guiadas (`gd`: GBU-12/GBU-32/GBU-39), o lock escolhe o alvo **mais perto (distância horizontal)** entre os que estão no cone (.8 rad), com linha de visada (`hid` + `seekLine`, regra do PR #33) e **dentro de `LO.reach`** (alcance de planeio por altura, velocidade e limite das aletas).
- Alvo visível mas além do alcance nunca é travado: `LOCK.far` / `S.farGnd` mostra "FORA DE ALCANCE" (colchete tracejado) na HUD.
- Jogador (`LO.seek`) e IA (`LO.aim`) usam o mesmo lock. A IA só mantém `p.tgt` se estiver no alcance; senão trava o mais perto ou cai no ponto sob o nariz.
- AGM-65/Hellfire e demais mísseis seguem com `lockOn` (mais perto do eixo), sem mudança.
- Ciclar alvo: não foi mexido (o lock é recalculado a cada quadro; "próximo alvo" dentro da pegada não foi adicionado).

## Não testado
Nada além de: sintaxe do script e servidor subindo (`node server.js`).

## Riscos
- `LO.reach` é caro (loop de planeio) e agora roda a cada quadro no lock da GBU.
- Se `reach` for 0 (muito baixo/lento) nunca trava; cai no ponto sob o nariz.
- IA com `p.ord` esgotado escolhe a primeira bomba `gd` mesmo sem munição (só afeta o alcance).
- Cone de .8 rad pelo nariz: alvo muito abaixo do nariz continua fora do cone (comportamento anterior).

## Como testar depois
1. A-10 com GBU-12 (ou F-22 com GBU-32): voe a ~1500 m com vários veículos inimigos a distâncias diferentes: o colchete deve ir ao mais perto dentro do alcance.
2. Alvo só além do alcance: deve aparecer "FORA DE ALCANCE" e nenhum lock; baixar/acelerar/ganhar altura muda isso.
3. Fumaça/morro entre avião e alvo: "SEM LINHA DE VISADA" continua.
4. Partida com IA de CAS (A-10 com gbu12): ver que solta nos alvos próximos, sem erro no console.
