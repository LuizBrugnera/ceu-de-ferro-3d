# cf-mapa-artilharia — mapa de tiro mostra os inimigos como o de avião

## O que mudou
- `Céu de Ferro 3D.html`, `fpMap` (mapa de tiro M da artilharia/morteiro): os inimigos avistados aparecem pelo degrau da escada de percepção do lado (`sideLadder`): `?` = detectado, sigla da classe (CC, BL, AA, AR, CM...) = reconhecido, sigla + nome da classe = identificado.
- Posição do inimigo = última posição vista pelo lado (`sX/sZ`), não a real; some aos poucos (alfa) e mostra "N s" quando o contato tem mais de 4 s.
- Amigos continuam desenhados (quadrados verdes) para não atirar neles.

## Testado em e15c7b5 (cf-pol-testes-b, 2026-11-20): ok, com dois consertos
- Navegador (Chrome headless, servidor em 127.0.0.1, sala Hoje de 3 lados, M109A7 Paladin, M para o mapa de tiro), em 1280 e 1920 px. Aos 116 s havia 20 contatos nos três degraus (`?`, sigla, sigla + nome), cada um na última posição vista (5 a 115 m da real), e os de mais de 4 s com "N s". Três inimigos vistos só pelo terceiro lado não foram desenhados. Nenhum erro no console.
- **Conserto 1, rótulos empilhados.** Com o zoom ×1, uma coluna de blindados virava uma mancha: as siglas e os nomes ficavam escritos uns sobre os outros. Agora os contatos a menos de 22 px dividem um rótulo, como "CC ×3 · CM · BL" ou "? ×3 · CM · AA". O nome da classe só aparece quando o grupo é todo de uma classe identificada, e a idade mostrada é a do contato mais recente. O mapa da batalha (M fora da artilharia) usa o mesmo agrupamento. Com 3 lados, cada lado inimigo aparece na sua cor (`foeCol`), como no mapa da batalha.
- **Conserto 2, aviões.** O mapa de tiro desenhava todo avião inimigo, visto ou não. Agora mostra só os que o lado avistou, esmaecendo como os contatos de terra (igual ao mapa da batalha). Na tela (2026-11-21, Paladin, 2 min de partida): 4 aviões inimigos no ar, nenhum avistado pelo lado, e o mapa de tiro não desenha nenhum (a página anterior desenhava os 4).
- Teste focado: `tests/map-tags.js` (no `all.sh`). Ele falha na página anterior.
- Custo: `drawHud` com o mapa de tiro aberto e 17 contatos, mediana de 6 rodadas alternadas na mesma cena: 16 ms antes e 11 ms depois. A máquina estava carregada, então o número só mostra que não piorou.

## Continua sem teste
- Morteiro a pé (M), a época de 1944 e o mapa do drone.
- O nome de um contato identificado sozinho ainda pode cruzar o rótulo de um ponto ou de uma missão de fogo perto ("FOGO").
- Custo do `sideLadder` numa partida grande (percorre o `pm` de todas as unidades do lado, uma vez por quadro).
