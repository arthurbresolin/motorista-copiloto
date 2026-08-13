export type SkillKey =
  | 'checklist'
  | 'postura-ao-dirigir'
  | 'pedais-e-embreagem'
  | 'ponto-de-embreagem'
  | 'ligar-e-desligar'
  | 'trocar-marchas'
  | 'controle-baixa-velocidade'
  | 'placas-e-sinalizacao'
  | 'semaforos-e-prioridade'
  | 'distancia-e-espelhos'
  | 'mudanca-de-faixa'
  | 'direcao-defensiva'
  | 'baliza'
  | 'rotatoria'
  | 'estacionamento'
  | 'rodovia'
  | 'curva'
  | 'marcha-re'
  | 'direcao-suave';

export type SkillDifficulty = 'iniciante' | 'intermediario' | 'avancado';

export type Skill = {
  key: SkillKey;
  label: string;
  maneuver?: string;
  difficulty: SkillDifficulty;
  description: string;
  tips: string[];
  // Manobras cujo resultado é uma posição final (estacionar) se beneficiam
  // de uma foto avaliada pela IA no fim do Modo Copiloto — não faz sentido
  // pra manobras de trajeto (curva, rotatória) sem posição final clara.
  supportsPhotoFeedback?: boolean;
};

export const SKILLS: Skill[] = [
  {
    key: 'checklist',
    label: 'Checklist',
    difficulty: 'iniciante',
    description: 'Conferir o carro antes de sair — espelhos, cinto, banco, combustível.',
    tips: [
      'Ajuste os espelhos antes de ligar o carro.',
      'Verifique o cinto de segurança de todos os ocupantes.',
      'Confirme o freio de mão antes de engatar a marcha.',
    ],
  },
  {
    key: 'postura-ao-dirigir',
    label: 'Postura ao Dirigir',
    maneuver: 'Postura ao Dirigir',
    difficulty: 'iniciante',
    description: 'Manter a postura do corpo e a posição das mãos corretas no volante durante toda a condução.',
    tips: [
      'Sente-se com as costas retas, encostado no banco, sem se inclinar pra frente.',
      'Segure o volante nas posições 9 e 3 horas, como um relógio.',
      'Mantenha os braços levemente flexionados, nunca esticados.',
      'Solte o volante suavemente depois de cada curva, sem tirar as mãos.',
      'A cada poucos segundos, dê uma olhada nos espelhos sem tirar o foco da via.',
    ],
  },
  {
    key: 'pedais-e-embreagem',
    label: 'Pedais e Embreagem',
    maneuver: 'Pedais e Embreagem',
    difficulty: 'iniciante',
    description: 'Reconhecer os três pedais e praticar o uso coordenado da embreagem, acelerador e freio.',
    tips: [
      'Identifique os pedais com o carro desligado: embreagem à esquerda, freio no meio, acelerador à direita.',
      'Pise na embreagem sempre com o pé esquerdo, nunca com o direito.',
      'Pise no acelerador e no freio sempre com o pé direito, nunca os dois ao mesmo tempo.',
      'Pratique pisar e soltar a embreagem devagar, sem olhar pro pedal.',
      'Sinta a diferença entre pisar fundo e pisar de leve no acelerador.',
    ],
  },
  {
    key: 'ponto-de-embreagem',
    label: 'Ponto de Embreagem',
    maneuver: 'Ponto de Embreagem',
    difficulty: 'iniciante',
    description: 'Encontrar e sentir o ponto de embreagem — o momento exato em que o carro começa a se mover.',
    tips: [
      'Com o carro ligado e em primeira marcha, solte a embreagem bem devagar.',
      'Pare de soltar assim que sentir o carro puxar um pouco pra frente — esse é o ponto de embreagem.',
      'Segure a embreagem nesse ponto por alguns segundos antes de soltar o resto.',
      'Repita esse movimento parado, sem acelerar, até sentir confiança.',
      'Depois de dominar parado, tente arrancar com uma leve aceleração junto.',
    ],
  },
  {
    key: 'ligar-e-desligar',
    label: 'Ligar e Desligar o Carro',
    maneuver: 'Ligar e Desligar',
    difficulty: 'iniciante',
    description: 'Praticar a sequência de ligar e desligar o carro sem calar o motor.',
    tips: [
      'Confira se o câmbio está em ponto morto antes de ligar.',
      'Pise na embreagem até o fim antes de dar a partida.',
      'Solte a chave assim que o motor pegar, sem segurar demais.',
      'Pra desligar, engate o freio de mão antes de tirar o pé da embreagem.',
      'Deixe o carro em ponto morto antes de desligar o motor.',
    ],
  },
  {
    key: 'trocar-marchas',
    label: 'Trocar Marchas',
    maneuver: 'Trocar Marchas',
    difficulty: 'intermediario',
    description: 'Praticar a troca de marchas em movimento, sem trancos e sem calar o motor.',
    tips: [
      'Tire o pé do acelerador antes de pisar na embreagem pra trocar de marcha.',
      'Pise na embreagem até o fim, troque a marcha e solte aos poucos.',
      'Suba de marcha quando o motor estiver acelerando demais pro seu ouvido.',
      'Desça de marcha antes de perder força, principalmente em subidas.',
      'Nunca tire os olhos da via só pra olhar a alavanca de câmbio.',
    ],
  },
  {
    key: 'controle-baixa-velocidade',
    label: 'Controle em Baixa Velocidade',
    maneuver: 'Controle em Baixa Velocidade',
    difficulty: 'intermediario',
    description: 'Manter o carro em movimento controlado e constante em velocidade bem baixa, essencial pra manobras.',
    tips: [
      'Use só a embreagem, no ponto de embreagem, sem acelerar, pra manter velocidade baixa.',
      'Mantenha os dois pés prontos — um na embreagem, outro perto do freio.',
      'Pratique andar bem devagar em linha reta antes de tentar em curva.',
      'Se o carro acelerar demais, pise um pouco mais na embreagem em vez de frear.',
      'Use essa técnica sempre que for manobrar em espaço apertado.',
    ],
  },
  {
    key: 'placas-e-sinalizacao',
    label: 'Placas e Sinalização',
    maneuver: 'Placas e Sinalização',
    difficulty: 'iniciante',
    description: 'Reconhecer e respeitar as placas de sinalização e marcações da via durante a condução.',
    tips: [
      'Observe as placas de velocidade máxima em cada trecho da via.',
      'Placas amarelas em formato de losango, com borda preta, são de advertência — indicam perigo à frente.',
      'Placas brancas circulares com borda vermelha são de regulamentação — proibição ou obrigação, nunca ignore.',
      'Preste atenção nas faixas pintadas no chão, elas também são sinalização.',
      'Se não tiver certeza do significado de uma placa, reduza a velocidade.',
    ],
  },
  {
    key: 'semaforos-e-prioridade',
    label: 'Semáforos e Prioridade',
    maneuver: 'Semáforos e Prioridade',
    difficulty: 'intermediario',
    description: 'Praticar a leitura de semáforos e as regras de prioridade em cruzamentos.',
    tips: [
      'No amarelo, avalie se dá tempo de parar com segurança antes de decidir passar.',
      'Em cruzamento sem sinalização, dê preferência a quem vem pela sua direita.',
      'Antes de avançar num cruzamento, olhe pros dois lados mesmo com o sinal verde.',
      'Nunca pare em cima da faixa de pedestres esperando o sinal abrir.',
      'Em rotatória, quem já está circulando tem preferência sobre quem está entrando.',
    ],
  },
  {
    key: 'distancia-e-espelhos',
    label: 'Distância e Espelhos',
    maneuver: 'Distância e Espelhos',
    difficulty: 'intermediario',
    description: 'Manter distância segura do carro da frente e criar o hábito de checar os espelhos com frequência.',
    tips: [
      'Use a regra dos 2 segundos: conte 2 segundos entre o carro da frente passar por um ponto e você passar pelo mesmo ponto.',
      'Aumente essa distância em dia de chuva ou pista molhada.',
      'Cheque o retrovisor interno a cada 5 a 8 segundos, sem exagerar.',
      'Olhe os retrovisores externos antes de qualquer freada mais forte.',
      'Nunca cole no carro da frente só porque ele está andando devagar.',
    ],
  },
  {
    key: 'mudanca-de-faixa',
    label: 'Mudança de Faixa',
    maneuver: 'Mudança de Faixa',
    difficulty: 'avancado',
    description: 'Praticar a troca de faixa com segurança: sinalização, checagem de espelhos e ponto cego.',
    tips: [
      'Ligue a seta antes de começar a se mexer, não durante.',
      'Olhe o retrovisor interno e o externo do lado pra onde vai mudar.',
      'Vire rapidamente a cabeça pra checar o ponto cego antes de mudar de fato.',
      'Mude de faixa em movimento suave, sem virar o volante bruscamente.',
      'Desligue a seta assim que terminar a manobra.',
    ],
  },
  {
    key: 'direcao-defensiva',
    label: 'Direção Defensiva',
    maneuver: 'Direção Defensiva',
    difficulty: 'avancado',
    description: 'Antecipar riscos no trânsito e manter atenção redobrada com pedestres e ciclistas.',
    tips: [
      'Reduza a velocidade ao passar perto de escolas, pontos de ônibus e faixas de pedestre.',
      'Nunca presuma que o pedestre viu seu carro — desacelere de qualquer forma.',
      'Mantenha distância extra ao ultrapassar ciclistas, pelo menos 1,5 metro.',
      'Observe os retrovisores de motos e bicicletas — elas também têm pontos cegos.',
      'Se perceber um comportamento imprevisível de outro condutor, mantenha distância e reduza a velocidade.',
    ],
  },
  {
    key: 'baliza',
    label: 'Baliza',
    maneuver: 'Baliza',
    difficulty: 'avancado',
    description: 'Estacionar em vaga entre dois carros, com controle e poucas manobras.',
    tips: [
      'Alinhe seu carro paralelo ao carro da frente, mantendo cerca de 1 metro de distância.',
      'Espere o meio do seu carro passar do para-choque traseiro do carro da frente.',
      'Vire o volante todo pra direita e engate a marcha à ré.',
      'Solte a embreagem devagar, no ponto de embreagem, observando os retrovisores.',
      'Quando o carro entrar na vaga em diagonal, endireite o volante.',
      'Ajuste a posição final checando a distância dos dois lados pelos espelhos.',
    ],
    supportsPhotoFeedback: true,
  },
  {
    key: 'rotatoria',
    label: 'Rotatória',
    maneuver: 'Rotatória',
    difficulty: 'intermediario',
    description: 'Entrar e sair de rotatórias respeitando quem já está circulando.',
    tips: [
      'Reduza a velocidade antes de entrar na rotatória.',
      'Observe quem já está circulando dentro dela.',
      'Espere um espaço seguro antes de entrar — quem já está dentro tem preferência.',
      'Entre na rotatória mantendo a faixa correta pro seu destino.',
      'Ligue a seta antes da saída que você vai pegar.',
      'Saia da rotatória olhando o retrovisor e o ponto cego.',
    ],
  },
  {
    key: 'estacionamento',
    label: 'Estacionamento',
    maneuver: 'Estacionamento',
    difficulty: 'intermediario',
    description: 'Estacionar em vaga livre, alinhado e sem sustos.',
    tips: [
      'Escolha uma vaga compatível com o tamanho do seu carro.',
      'Sinalize e reduza a velocidade ao se aproximar da vaga.',
      'Use os retrovisores e o espelho interno pra calcular a distância dos carros vizinhos.',
      'Gire o volante gradualmente enquanto entra na vaga.',
      'Corrija a direção aos poucos, sem virar o volante de uma vez.',
      'Pare e cheque se está alinhado e a uma distância segura dos dois lados.',
    ],
    supportsPhotoFeedback: true,
  },
  {
    key: 'rodovia',
    label: 'Rodovia',
    maneuver: 'Rodovia',
    difficulty: 'avancado',
    description: 'Dirigir em vias rápidas, com conversões e ultrapassagens seguras.',
    tips: [
      'Mantenha distância segura do carro da frente (regra dos 2 segundos).',
      'Use a seta com antecedência antes de qualquer mudança de faixa.',
      'Olhe os espelhos e o ponto cego antes de se mexer.',
      'Ultrapasse apenas em trechos permitidos e com visibilidade total.',
      'Volte pra faixa da direita assim que concluir a ultrapassagem com segurança.',
      'Mantenha velocidade constante, evitando acelerações e frenagens bruscas.',
    ],
  },
  {
    key: 'curva',
    label: 'Curva',
    maneuver: 'Curva',
    difficulty: 'intermediario',
    description: 'Fazer curvas fechadas mantendo a velocidade sob controle.',
    tips: [
      'Reduza a velocidade antes de entrar na curva, não durante.',
      'Posicione o carro na faixa antes de começar a virar.',
      'Olhe para o ponto de saída da curva, não para o acostamento.',
      'Gire o volante de forma suave e contínua, sem tranco.',
      'Mantenha as duas mãos no volante durante toda a manobra.',
      'Acelere levemente só depois de já estar alinhado na saída da curva.',
    ],
  },
  {
    key: 'marcha-re',
    label: 'Marcha à ré',
    maneuver: 'Marcha à ré',
    difficulty: 'avancado',
    description: 'Manobrar de ré olhando pelos espelhos e pela janela traseira.',
    tips: [
      'Olhe por cima do ombro, não só pelos espelhos.',
      'Engate a marcha à ré e solte a embreagem bem devagar.',
      'Faça movimentos lentos e pequenos no volante.',
      'Ande em velocidade bem baixa, controlando com a embreagem.',
      'Pare e reavalie se perder a referência do espaço.',
      'Corrija a trajetória aos poucos, sem virar o volante bruscamente.',
    ],
  },
  {
    key: 'direcao-suave',
    label: 'Direção suave',
    difficulty: 'avancado',
    description: 'Uma sessão do Monitor sem nenhuma freada ou aceleração brusca.',
    tips: [
      'Acelere e freie de forma gradual, sem solavancos.',
      'Antecipe sinais de trânsito pra não precisar frear bruscamente.',
      'Mantenha uma velocidade constante sempre que possível.',
    ],
  },
];

// Quantas vezes uma habilidade precisa ser praticada pra virar "feita" na trilha.
//
// Uma aula é quiz + Modo Copiloto, então uma prática guiada basta. Era 2, sem
// nada na tela dizendo isso — depois da primeira prática a habilidade continuava
// travada e parecia bug. Só prática guiada conta; registro manual é diário de
// bordo (ver `guided` em PracticeSession, no backend).
export const MANEUVER_DONE_THRESHOLD = 1;

// Duração mínima (segundos) pra uma sessão do Monitor contar como "direção suave" —
// evita que uma sessão de poucos segundos destrave o nó sem prática de verdade.
export const SMOOTH_DRIVING_MIN_DURATION_SECONDS = 120;
