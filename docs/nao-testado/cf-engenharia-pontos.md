# cf-engenharia-pontos: muros HESCO, engenharia de fortificação e bases avançadas (parte testada)

O que é: obras 11-13 de `FORT.K` (HESCO alta, HESCO baixa, T-wall; em 1944 muro alto de sacos, terrapleno com troncos, paliçada), a unidade `fen` e as ordens `perim`/`fob`, seção `ENGENHARIA DOS PONTOS (ENP)` do `Céu de Ferro 3D.html`.

## Testado em cf-pol-testes-a
- Os muros, no harness (sandbox, obra pronta de frente para +x, um soldado agachado 1,8 m atrás): nomes por época certos; `walled()` corta abaixo do topo e passa acima (HESCO 1,3 m sim / 2,7 m não; baixa 0,7 / 1,8; T-wall 2,0 / 4,0); 30 tiros de fuzil e 30 de .50 no peito dele: 0 acertos com o muro, 30/30 sem o muro; o muro quase não sente (HESCO 520 → 518,9 com os 30 de .50); explosivos derrubam: HESCO com 21 explosões de r 10/dano 60 a 2 m, baixa com 12; a T-wall (800) ainda tinha 94 depois de 40 (precisa de ~45: é a mais dura, de propósito); explosão 4 m à frente do muro: quem está atrás leva 1,2 contra 33 sem muro; nenhum dos três tem `crush`.
- O servidor aceita os tipos 11-13 (`FKINDS` 13): `tests/forts-relay.js` só falhava no main porque usava 11 como "tipo que não existe"; o líder trocou para 14.
- Partida IA × IA no harness (Hoje, mapa 6, economia, logística e resgate ligados, semente 5, 380 s, sem exceção nem NaN): os generais mandam a engenharia aos 41-52 s (base avançada a ~3 km de cada lado, 7-8 peças; perímetro nos pontos E e H a ~400 m, 7-8 peças); as duas esquadras `fen` de cada lado ficam com operação o tempo todo.

## Falhou / ainda não testado
- **A engenharia quase não constrói nos primeiros 6 min**: de 128 s a 355 s os perímetros ficam em "aguarda energia e metal" (o diário repete a cada ~45 s); aos 380 s há 4 peças começadas e 2 de pé no mapa todo (1 por lado). O esperado ("ponto tomado há mais de 3 min com ≥ 6 peças") não aconteceu. Suspeita: com a logística ligada a economia do começo fica abaixo do custo + `ENP.keep` (T-wall precisa de 30 de energia e 54 de metal), e o plano de fortificação (AFP) e a cúpula poupam ao mesmo tempo ("a economia poupa 300 de energia e 400 de metal" aos 287 s). Não corrigido: medir antes a economia por lado (`S.eco.d[t].en/mt`) a cada 10 s numa partida de 10 min, com e sem `LG.on`, e ver se `enpPay` está sempre abaixo; se estiver, baixar `ENP.keep`/custos ou dar à engenharia a vez sobre a poupança do AFP. Roteiro: `PART=2 ERA=modern MIN=10 node p-enp.js` (em `ag3/proof` da tarefa cf-pol-testes-a; usa `H.load({ seed, mapv: 6, eco: true, lg: 1, rec: 1 })`).
- 1944, outras sementes, 10 min; base avançada pronta (guarda, base de suprimento, antena); o "desiste" em série; reparo de perímetro depois de `ENP.redo`.
- O escudo `ENP.shield` (15%) só vale para quem está numa vaga do muro baixo (`fortHit`, `m.fc`); o teste mediu um soldado solto atrás da HESCO (protegido pela regra geral `OBJS.shield`).
- As ordens da pessoa e do MCP (`genCmd(t, { c: 'fort', k: 'perim' | 'fob' | 'hesco' }, 'person')`), as recusas `hsc`, `done`, `sq`; jogando de soldado (N até "Barreira HESCO"); soldados entrando e saindo do anel (podem enroscar) e a IA perdendo alvos atrás da HESCO baixa.
- Na tela já visto (navegador headless, `ag3/proof` da tarefa): as seis peças de perto nas duas épocas, assentadas no chão (`vis-walls-near.png`: cestos HESCO, HESCO baixa, placas de T-wall; `era-3-ww2-watch-walls.png`: muro de sacos, terrapleno com troncos, paliçada). Falta: o LOD a mais de 160 m, a camada Engenharia e os chips da Visão de General, o fantasma do N para peças de 12 m.
- Online (anfitrião e convidado; `V.enp` não vai ao convidado) e o custo do embrulho do `ray` e do `enpLayout` (`tests/frame-budget.js`).
- As suítes da lista (`forts`, `posts`, `bases`, `tps`, `field`, `pop-push`, `w13`, `orders`, `afp`, `sim-split`, `forts-online`): ver a linha de base da tarefa (`logs-base/_summary.txt`).

## Riscos (seguem valendo)
- Pathing: muro alto sem `dug` empurra soldados e bloqueia veículos; esquadras presas do lado errado do anel.
- `FORT.slots` 320 muda as ids dos prédios; página velha contra nova online não combina.
- Com o `cf-defesa-posicoes` (DFP): os postos do DFP podem cair fora do anel ou ter a visada tapada por um muro.
