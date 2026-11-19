# cf-mapa-artilharia — mapa de tiro mostra os inimigos como o de avião (não testado)

## O que mudou
- `Céu de Ferro 3D.html`, `fpMap` (mapa de tiro M da artilharia/morteiro): os inimigos avistados agora aparecem pelo degrau da escada de percepção do lado (`sideLadder`, lê o `pm` das unidades do lado; o SHARE já repassa a classe):
  `?` = detectado, sigla da classe (CC, BL, AA, AR, CM...) = reconhecido, sigla + nome da classe = identificado.
- Posição do inimigo = última posição vista pelo lado (`sX/sZ`, por lado com 3 lados), e não a posição real; some aos poucos (alfa) e mostra "N s" quando o contato tem mais de 4 s.
- Amigos continuam desenhados (quadrados verdes) para não atirar neles.

## NÃO testado
- Nada rodou em partida; só checagem de sintaxe do script.
- Mapa de visão do General (ferramenta FOGO) NÃO foi alterado; mini-mapa do canto e mapa do drone também não.
- Aviões inimigos no mapa de tiro continuam desenhados como antes (não filtrados por avistamento).

## Riscos
- `sideLadder` percorre `pm` de todas as unidades do lado, uma vez por tick: custo em partidas grandes.
- `sX/sZ` indefinidos em algum caso (caí em `g.x/g.z`); `sees(P, g)` com P sem olhos válidos.
- Rótulos podem poluir com zoom ×1 e muitos contatos.

## Como testar depois
1. Abrir uma partida moderna como Grad/obuseiro (ou morteiro), apertar M.
2. Conferir: contatos distantes `?`, mais perto com sigla, identificados com nome; marcador esmaece e mostra segundos.
3. Partida com 3 lados: um lado não vê o que só o outro avistou.
4. Console sem erros; FPS estável com muitas unidades.
