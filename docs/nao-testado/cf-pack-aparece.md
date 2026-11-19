# Pack de modelos aparecendo (cf-pack-aparece) — não testado

Depois do #101 o capitão via ainda os modelos velhos: tanques modernos (Abrams, T-72/T-90, Leopard), soldados e o hangar.

## Causas e o que mudou (só `Céu de Ferro 3D.html`, bloco do pack)

1. **Tanques nunca recebiam o pack.** As definições de `TANKS` não têm `id` (as de `TRNS` têm; por isso carros e caminhões já apareciam), então `PACK.tank[d.id]` era sempre `PACK.tank[undefined]`. Agora `packTid(d)` acha a chave pelo próprio objeto (`PACK_TID`, ou o protótipo de uma cópia). Nenhum campo novo em `TANKS`.
2. **Hangar guardava o modelo velho.** O carrossel (`#planes`, `#swapList`) monta cada modelo na primeira vez que o desenha, quase sempre antes de o pack chegar (~1,5 s depois de abrir), e nunca refaz. Agora `packHangar()` (chamado quando um GLB chega, com espera de 250 ms para juntar a rajada) descarta o que o carrossel guardou e redesenha.
3. **Soldado do hangar** (cartões de infantaria) era sempre a figura de caixas (`manModel`). Agora é o soldado do pack, parado mirando, com a arma e a cor do lado; sem o pack ou com nível 0, a figura de antes.
4. **Soldados na partida quase nunca apareciam na qualidade Baixa**: o nível 1 só animava quem estava a 40 m. Agora `PACK.near = [0, 90, 120, 160]` e `PACK.max = [0, 16, 28, 48]` (o nível 0, desligado, continua sem pack).

## O que foi visto (navegador headless, uma vez, sem suítes)

- Na prévia antiga: todos os 29 GLBs carregam (st 1), mas só 2 de 16 unidades com pack (carros); 0 tanques.
- Com a mudança: 6 de 6 tanques da demonstração do hangar com pack; cartão M1A2 Abrams e Fuzileiro (EUA) com os modelos do pack; partida online padrão de 3 lados começa e o relógio anda (44:59), com o soldado do jogador e 7 próximos animados.
- Capturas em `/home/luiz/firstmate/data/cf-pack-aparece/` (before-*.png, after-*.png).

## O que NÃO foi testado

- Nenhuma suíte (`tests/*.js`), nenhuma partida longa, nenhum A/B.
- Ajuste visual de cada tanque (torre e canhão no lugar certo, escala, giro da torre, recuo) em todos os modelos: só o Abrams foi olhado de perto.
- Danos (`damageLook`) e carcaças de tanque com o pack (o escurecimento por parte, torre arrancada `w.det`, destroços).
- Primeira pessoa dentro do tanque com o casco do pack (o casco pode tapar a vista ou a mira).
- Custo por quadro com até 16 soldados animados a 90 m na qualidade Baixa (máquina fraca).
- Soldado do hangar para 1944, Rússia e Insurgentes (cor de `MCOL`; Insurgentes caem num cinza padrão), e lançadores (arma do pack).
- Convidado online (os modelos são só visuais, mas não foi visto).

## Riscos

- Torre/canhão de algum tanque desalinhados com a mira do jogo (o tiro sai de onde a simulação diz, não do cano desenhado).
- Queda de FPS na Baixa por mais soldados animados; se acontecer, baixar `PACK.near[1]`/`PACK.max[1]`.
- Ao chegar cada GLB, os modelos do carrossel são refeitos (uma vez por rajada): um piscar curto no hangar.

## Como testar depois

```
node server.js            # ou a prévia em http://127.0.0.1:8090/
```

1. Abrir a página, esperar ~5 s. No console: `S.units.filter(u => u.kind === 'tank').map(u => !!(u.m && u.m.userData.pack))` → todos `true`.
2. Hangar, aba Tanque, era Hoje e 1944: passar por todos os tanques (Abrams, Leopard 2, T-90, T-72, Tiger, Panzer IV, Sherman, T-34) e conferir que são os modelos do pack.
3. Aba Infantaria: o soldado é o do pack (capacete, colete), com arma; trocar de lado e de era.
4. Entrar numa partida de tanque: dirigir, girar a torre, atirar, levar dano, morrer (carcaça); olhar em primeira e terceira pessoa.
5. Entrar como infantaria na qualidade Baixa: soldados a até ~90 m animados; medir o FPS.
6. `?pack=0` e `?packq=0`: tudo volta aos modelos de antes.
7. Rodar as suítes de sempre (`tests/all.sh`) para ver que nada da simulação mudou.
