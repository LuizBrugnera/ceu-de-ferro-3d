# Granada quebra as casas (cf-granada-casas)

Regra do capitão: implementado sem testes. Só o smoke: o servidor sobe e a página abre sem erro no console (Chromium headless), e uma conta rápida no harness (3 granadas no meio de um cômodo de reboco quebram os vidros, abrem a porta da divisória e deixam a parede com ~40% da vida).

## O que mudou

**`cityCharge(x, y, z, kg, by, own)` / `bCharge`** (logo antes de `bDmg`): o estouro de uma carga pequena entre os prédios, pela carga em kg de TNT. Tudo passa por `bDmg`, o mesmo dano por elemento que o canhão e a carga na parede já usam.
- Vidro: janelas a até `glass × ∛kg` m (granada ~4 m, morteiro ~7 m) quebram (estado 1, como o tiro de fuzil).
- Porta: a até `door × ∛kg` m (granada ~1,5 m) vira buraco.
- Parede: a até `wall × ∛kg` m leva `dmg × kg^(2/3)` caindo com o quadrado da distância; parede fina (madeira, chapa: `th < 0,15`) e divisória 2,5×; parede com janela, porta ou portão 2×. Granada encostada: reboco precisa de ~4 (lasca com 2), tijolo ~5, pedra ~7; celeiro de madeira e galpão de chapa abrem com uma.
- Cômodo fechado (o vão em que estoura, com 3 ou mais das 4 paredes e o forro de pé, vidro inteiro): as paredes dele levam até 2,5× e a distância conta pela metade; com carga de 1 kg ou mais, o forro (laje de cima / telhado) leva também e pode cair (`bldFell`).
- `own`: a explosão que já tem `cityBlast` grande (morteiro, artilharia, sabotagem, colete, carro-bomba: `ob > CITY.chg.cut`) só ganha vidro, porta e o extra do cômodo; as outras (granada, foguete, mina, IED de comando e de estrada) levam a parede inteira por aqui.
- Configuração: `CITY.chg` (comentada no código).

**`explode(..., ob, kg)`**: 10º argumento, a carga. Os 6 embrulhos de `explode` repassam o `kg`. Quem passa: granada (`CITY.chg.nade` 0,2 kg), projétil `he` que não é do tanque (dano/60: morteiro 81 mm 1 kg), foguete `heat` (dano/250), drones (FPV, munição vagante), minas (AT e de comando dano/40; AP 0,25), IED do insurgente e da guerrilha (dano/40), colete e carro-bomba (dano/40), sabotagem (3 kg). Tanque (perfurante e HE) e bomba de avião continuam como eram (sem `kg`).

**Carga na parede (`bldStep`)**: além dos 150 na parede, quebra vidros e portas em volta e faz o extra do cômodo atrás dela (as paredes vizinhas não levam mais nada).

**Abrigo e entradas**: nada novo; o buraco passa por `bSet`, que já marca as células sujas do registro do P2 (`tpsDirty`), soma `B.rev` (o cache de `bldCover`) e muda `bldEnts`/`tpsEnts` (entradas que o líder P3 e limpar prédio leem).

**Online**: `bDmg` sem `rx`: o convidado manda o dano da própria granada ao anfitrião (`Net.yh`), o anfitrião aplica e manda o estado (`Net.yq`). Nenhuma mensagem nova.

**Visual**: só o que já existia (poeira de `bSet`, pedaço de `S.debris` 'chunk' pequeno quando a porta voa). Não mexi em `blastFx` (cf-explosoes).

**Textos**: ajuda do soldado (prédios) e README.

## O que NÃO foi testado

Nada além do smoke. Em especial: granada de verdade numa partida (jogador e IA); morteiro, foguete, mina, IED, colete e carro-bomba perto de casa; a laje/telhado caindo com carga grande num cômodo; a IA (P1/P2/P3) usando o buraco novo como entrada e abrigo; online com convidado; desempenho com muitas granadas numa vila.

## Riscos
- **Balanço**: a IA joga granada para limpar prédio (`CITY.ai.nade`): casas podem ficar cheias de buracos e lajes caírem mais vezes; celeiro e galpão abrem com uma granada. Ajuste em `CITY.chg` (`dmg`, `wall`, `conf`, `thin`).
- **Mina/IED de estrada** perto de casa agora lasca e fura parede (antes `ob 0`: nada).
- **Morteiro dentro de cômodo** ficou mais forte (cityBlast + extra do cômodo).
- **Online**: muitos `bDmg` do convidado num quadro (vidros) vão no `Net.yh`; vidro e dano no mesmo elemento no mesmo quadro: o vidro some do pacote (o dano ganha).
- **Detecção de cômodo**: pelo vão (bay) em que o ponto cai; a granada encostada na face de dentro de uma parede externa pode contar como fora (ou o contrário) por causa da espessura.
- **Carga na parede**: o ponto do cômodo atrás é 0,3 m para dentro do eixo da parede; em parede interna pode pegar o vão errado.

## Como testar depois
1. `npm start` (ou `HOST=127.0.0.1 PORT=8080 node server.js`), `http://localhost:8080`, entrar como soldado (1944 e Hoje).
   - Granada (F) a ~1 m de uma casa de reboco: vidros perto quebram; 2 granadas lascam, 4 abrem buraco. Num celeiro: uma abre buraco.
   - Granada pela janela, dentro do cômodo: vidros do cômodo todos quebram, porta vira buraco, parede lasca; 2 abrem buraco.
   - Carga na parede (N): vidros em volta quebram; nada a mais nas paredes vizinhas.
   - Sapador com mina/IED perto de casa: a parede mais perto lasca ou fura.
2. Console: `cityCharge(S.my.x, S.my.y + 1, S.my.z, 3, S.my, true)` dentro de um sobrado: o forro cai.
3. Online (dois navegadores): granada do convidado na casa: o buraco aparece nos dois.
4. IA: uma esquadra limpando prédio (líder P3) entra pelo buraco novo; `covBld` lista o buraco como `win`.
5. Suítes: `node tests/city.js`, `node tests/city-online.js`, `node tests/infantry.js`, `node tests/brain-soldado.js`, `node tests/world.js` (comparar com o main).
6. Conta rápida usada no smoke: `/home/luiz/firstmate/data/cf-granada-casas/smoke.js` (ajustar o caminho do harness).
