# Infantaria sob fogo de longe, e mais prédios como abrigo (o que ainda falta testar)

Testado (cf-pol-testes-a, `tests/fogo-distante.js`, no sandbox ww2): tiros de um fuzileiro a 600 m passam raspando uma esquadra em `hold` numa estrada, 2,5 por segundo.
- **No aberto** (o chão em volta 98% à vista do atirador):
  - o drill `fogo-distante` começa 2 a 5 s depois do primeiro tiro;
  - 3 fumaças caem 25 a 28 m para o lado do atirador;
  - os sacos de areia começam 3 m para o lado do fogo. O diário diz "Esquadra sob fogo de longe sem abrigo: cavando trincheira e sacos de areia";
  - com o fogo parado, a parede de sacos fica pronta (em 120 s);
  - a trincheira começa 9 m ao lado (no centro o chão recusa), mas sai da lista de obras antes do fim. Provavelmente decaiu, largada enquanto os homens faziam os sacos (`BLD.decay`); não investigado.
- **Junto de uma casa** (a 29 m): os 5 homens ganham lugar na casa e nada é cavado. 3 estão dentro aos 60 s.
- **Num assalto**, 5 tiros em 8 s não disparam o drill.

**Bug achado e consertado**: os sacos de areia nunca saíam. `drFarPlace` lê `DRILL.inf.far.bags` (a distância da parede, 3 m pelo doc), mas a chave não existia. A posição virava `NaN` e o `fortStart` recusava (`map`). A chave entrou em `DRILL.inf.far` (`bags: 3`). O teste falha antes do conserto (nenhuma parede de sacos) e passa depois.

## O que ainda não foi testado
- **Partida inteira**: quantas vezes o drill dispara e quantas obras ele gasta (o `tcap`/`bcap` do lado), e se esquadras em `hold`/`move` ficam paradas cavando demais. Contar `fogo-distante` no AAR (`drills`) numa partida IA × IA de 20 min.
- **Atirador muito longe ou muito perto sem tiro ouvido**: a estimativa de 350 m para trás (`drIncAt`).
- **Prédios fora de cidade (`bldPts`)**: o `perimetro` indo para as janelas de uma casa (`q.drPer.p` com `b`), a ordem `move` do general (raio 12) ocupando a casa, e o prédio bombardeado sendo recusado (`drBldOk`).
- **Online**: a obra começada pelo drill, vista pelo convidado.
- **Suítes**: `tests/inf-drills.js`, `tests/drills.js` e `tests/infantry.js` não rodaram de novo aqui. Comparar com a linha de base do `main`.
