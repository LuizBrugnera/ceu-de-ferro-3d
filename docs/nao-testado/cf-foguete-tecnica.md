# cf-foguete-tecnica: foguetes das técnicas insurgentes que não explodiam

**Causa:** as armas `s5` e `s8` das picapes `tecS5`/`tecS8` (#109, antiaérea antiga) eram `k: 'gun'`: balas comuns (dano 15/28 só em acerto direto), que no chão só levantavam poeira. Nada de explosão, nada de dano em quem estava perto.

**O que mudou** (`Céu de Ferro 3D.html`):
- Tipo de arma novo `rkt` em `ARMK`: lança o mesmo foguete dos aviões e helicópteros (`S.bombs`, `k: 'rocket'`): voa com rastro de fumaça, explode no impacto (chão, prédio, veículo, soldado, civil) e perto de avião (9 m).
- `ARMS.s5`: `rkt`, ogiva `dmg 55`, raio `r 12` (57 mm, ogiva pequena). `ARMS.s8`: `rkt`, `dmg 95`, `r 20` (igual ao S-8 dos aviões). Mesma cadência, munição, alcance e espalhamento de antes.
- Visual: o corpo do foguete usa `vis` (raio, comprimento) da arma: S-5 menor que o S-8; a explosão (`blastFx`) já é proporcional ao raio.
- IA: `ffHeld` (amigo na linha) vale para `rkt`; HUD do jogador mostra o círculo de avanço para `rkt`; cartão do hangar mostra ícone de foguete e "foguetes não guiados, explodem no impacto".
- Os foguetes deixam de servir para abater mísseis (#150): só armas `gun` de calibre pesado fazem isso, e o nome "Casulos" já dava calibre 0.

**Outros foguetes (conferido, sem mudança):** foguetes de avião/helicóptero (S-8, S-13, Hydra, HVAR) já usam o caminho `S.bombs` rocket e explodem. RPG e similares de soldado usam `heat` (acerto direto + estilhaço pequeno). Katyusha/Grad/MLRS/Panzerwerfer e a técnica `tec107` (Type 63 107 mm, dano 45, raio 18) usam `how` (arco de obuseiro, explode no chão): funcionam.

**Testado:** só `node tests/foguete-tecnica.js` (foguete S-5 e S-8 no chão ao lado de um caminhão e 3 soldados: na versão antiga os soldados não perdem vida; agora perdem, e o caminhão também); o script inteiro da página passa no `node --check`; o servidor sobe e entrega a página. Não abri no navegador (o navegador do agente não alcançou o servidor local).

**Não testado:**
- Visual no jogo: tamanho do corpo, rastro, explosão.
- IA das técnicas atirando em avião/helicóptero: o avanço da mira (`lead`) usa a gravidade de bala (0,5 g); o foguete cai com 0,25 g, então a IA mira um pouco alto a longa distância.
- Balanço antiaéreo: um foguete a menos de 9 m de um avião agora faz 55/95 de dano (antes 15/28 só em acerto direto), e a explosão no ar no fim da vida (3,4/3,6 s) pode ferir aviões dentro de 0,7 r. Pode ficar forte demais contra helicópteros baixos.
- Online: a arma não tem `relay` (como a `gun`); cada cliente simula os foguetes do fantasma pelo controle dele, como já fazia com as balas.
- Dano em prédios (#154): a explosão usa `OBJD.rocket.blast` sem carga de cidade (`kg`), como o foguete de avião.

**Como testar depois:**
- `node tests/foguete-tecnica.js`.
- Hangar: Insurgentes, Técnica com foguetes S-5 e S-8: atirar no chão perto de soldados e de um caminhão; ver rastro, explosão e dano; atirar num helicóptero de treino.
- Partida de 3 lados IA × IA com técnicas S-5/S-8: ver se engajam aviões e se o balanço antiaéreo ficou razoável; `node tests/damage.js` e `node tests/frame-budget.js`.
