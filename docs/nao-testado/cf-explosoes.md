# cf-explosoes — explosões pelo tamanho, cogumelo nas bombas grandes, marcas no solo (não testado)

## O que mudou
- Só visual. Dano, física, cobertura da IA (`S.craters` continua só do #93) e as cortinas de fumaça (`SMOKE`) não mudaram.
- `blastFx` (simulação) chama `fx.blast(x, y, z, r)`. Na página, o novo módulo `XFX` (parte da visão, logo depois do `stkScene`) desenha a explosão e devolve `true`; sem visão (harness, ferramentas headless) o stub devolve `false` e ficam os puffs antigos. Tremor e som (`S.shake`, `fx.boom`) continuam como antes.
- Classe pelo raio (`XFX.cut` = 12/26/55/100 m): 0 granada, 1 foguete/morteiro/tiro leve, 2 obuseiro/Grad/bomba leve, 3 bomba pesada/shahed, 4 GBU-31/caminhão-bomba.
- Cada classe: clarão (sprite + `PointLight` em Média/Alta), bola de fogo, brasas, terra que sobe e cai, coluna de terra, anel de poeira que corre no chão, onda de choque (esfera fresnel, classe 2+), coluna de fumaça que sobe e vai com o vento (`S.wx`), marca no solo (queimado + cratera por textura, todos os tamanhos), fogo que fica na cratera (classe 3+) e **cogumelo** (classe 3+): sobe, abre o chapéu, fica 70–130 s, visível de longe, desenhado pela idade (sem partículas). Na água: coluna de spray, sem marca. No ar: sem terra, anel nem marca.
- Atingidos: veículo abaixo de 50% do casco solta fumaça cinza, abaixo de 25% fumaça preta e chamas (se já não estiver queimando pela simulação); destroço queima nos primeiros ~23 s; prédio danificado pega fogo por 45 s depois do último impacto.
- Desempenho: pools fixos criados com a cena, pelo nível gráfico do hangar (`XFX.n` 900/1700/2600 partículas, `marks` 40/90/160, `mush` 2/4/6, `lights` 0/1/2). Salva e tapete sobrescrevem as partículas mais velhas; marcas reaproveitam o slot com menos tempo; bombas de um mesmo tapete engordam o cogumelo jovem em vez de criar outro. Longe (>6 km) só cogumelo/marca; a distância reduz as contagens. Tempo da batalha (`S.t`): pausa congela.
- Online: o convidado desenha a partir dos mesmos `blastFx` que já recebe (rodadas e eventos), nada novo na rede.

## Não testado
Só: sintaxe do script, servidor subindo, página carregando com `XFX` iniciado e um `blastFx` de 11/36/135 m no menu sem erro (`XFX.err === 0`). **Nenhuma captura visual foi conferida** (a câmera do menu estava no hangar), nem 1280/1920, dia/noite/neblina, nem partida real, salva de Grad, tapete de bombas, online ou relógio (#118).

## Riscos
- Aparência inteira sem ver: tamanhos, cores e alfas podem estar exagerados ou fracos (constantes em `XFX`).
- `PointLight` novas (1 em Média, 2 em Alta) entram em todos os shaders iluminados: custo de fragmento e recompilação ao montar a cena; o shader do terreno (`envTerrainHook`) não foi visto com luz pontual.
- Marca grande (>8 m) chama `hgt` 81 vezes; uma salva grande de marcas num quadro pode dar um pico.
- Sprites grandes perto da câmera (dentro do cogumelo) são limitados a 640 px; em GPU com limite menor de `gl_PointSize` ficam menores.
- Partículas sem ordenação: cruzamento de fumaça com fogo pode piscar.
- Marcas planas (decal) podem sumir sob estradas/prédios ou flutuar em encosta forte; não seguem a cratera do #93 (essas continuam as malhas do `stkScene`).
- `XFX.on = 0` volta aos puffs antigos se algo der muito errado.

## Como testar depois
1. `PORT=8080 node server.js`, abrir a página, iniciar uma partida (Hoje, tanque ou infantaria) e no console:
   `(()=>{const c=camera.position,f=new THREE.Vector3();camera.getWorldDirection(f);const at=(k,dx)=>{const x=c.x+f.x*k+f.z*dx,z=c.z+f.z*k-f.x*dx;return [x,hgt(x,z)+.5,z]};for(const [k,dx,r] of [[150,-60,11],[400,0,36],[1200,150,135]]){const a=at(k,dx);blastFx(a[0],a[1],a[2],r)}})()`
   Ver granada, obuseiro e bomba grande; repetir a 1280 e 1920 de largura, de dia, de noite e com neblina (partida com céu/tempo escolhidos). Conferir o cogumelo de longe (2–6 km) e a marca no chão depois que a fumaça passa.
2. Salva de Grad (artilharia BM-21) e tapete de bombardeiro estratégico (General → bombardeio): o relógio da batalha não deve cair (#118); ver `XFX.A.n`/`XFX.B.n` e o FPS.
3. Mudar a qualidade no hangar (Baixa/Média/Alta) e repetir: pool menor e sem luz em Baixa.
4. Online (dois navegadores): o convidado vê as mesmas explosões, marcas e cogumelos.
5. Veículo danificado (<50% e <25%), destroço e prédio atingido: fumaça e fogo.
6. Explosão na água (rio): spray, sem marca. Míssil/avião abatido no ar: sem marca nem anel.
7. Console sem `XFX` warnings (`XFX.err === 0`).
