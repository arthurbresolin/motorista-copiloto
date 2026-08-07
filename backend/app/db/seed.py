import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker

from app.db.session import async_session
from app.models import ChecklistItem, QuizQuestion

DEFAULT_CHECKLIST_ITEMS = [
    "Ajustar espelhos",
    "Colocar cinto de segurança",
    "Ajustar banco",
    "Ajustar volante",
    "Soltar freio de mão",
    "Verificar combustível",
    "Verificar pneus",
    "Verificar retrovisor",
]

# Perguntas baseadas em regras bem estabelecidas do Código de Trânsito
# Brasileiro (CTB) - evitando questões controversas ou muito específicas
# (ex: pontuação exata da CNH, que muda com frequência).
DEFAULT_QUIZ_QUESTIONS = [
    {
        "prompt": "O que o motorista deve fazer ao encontrar uma placa de PARE?",
        "options": [
            "Reduzir a velocidade e seguir se a via estiver livre",
            "Parar completamente o veículo, mesmo que a via esteja livre",
            "Buzinar antes de passar",
            "Só parar se houver outro veículo se aproximando",
        ],
        "correct_index": 1,
        "category": None,
    },
    {
        "prompt": "Em um cruzamento sem sinalização, quem tem preferência de passagem?",
        "options": [
            "Quem chegar primeiro",
            "Quem vem pela direita",
            "O veículo maior",
            "Quem estiver em maior velocidade",
        ],
        "correct_index": 1,
        "category": None,
    },
    {
        "prompt": "O uso do cinto de segurança é obrigatório para...",
        "options": [
            "Somente o motorista",
            "Motorista e passageiro da frente",
            "Todos os ocupantes do veículo",
            "Apenas em rodovias",
        ],
        "correct_index": 2,
        "category": None,
    },
    {
        "prompt": "Qual é a velocidade máxima padrão em vias locais urbanas, salvo sinalização diferente?",
        "options": ["30 km/h", "40 km/h", "60 km/h", "80 km/h"],
        "correct_index": 0,
        "category": None,
    },
    {
        "prompt": "Qual é a tolerância de álcool no sangue permitida para dirigir no Brasil?",
        "options": ["0,6 g/L", "0,3 g/L", "Tolerância zero — qualquer quantidade é infração", "0,8 g/L"],
        "correct_index": 2,
        "category": None,
    },
    {
        "prompt": "Ao se aproximar de uma faixa de pedestres com pessoas querendo atravessar, o motorista deve...",
        "options": [
            "Buzinar para avisar",
            "Parar e dar passagem ao pedestre",
            "Acelerar para passar antes",
            "Ignorar se não houver semáforo",
        ],
        "correct_index": 1,
        "category": None,
    },
    {
        "prompt": "Ao entrar em uma rotatória, quem tem preferência de passagem?",
        "options": [
            "Quem está entrando",
            "Quem já está circulando dentro da rotatória",
            "O veículo mais rápido",
            "Depende do tamanho do veículo",
        ],
        "correct_index": 1,
        "category": "rotatoria",
    },
    {
        "prompt": "Durante a manobra de baliza, o correto é...",
        "options": [
            "Usar apenas o retrovisor esquerdo",
            "Olhar por cima do ombro e usar os espelhos disponíveis",
            "Fazer a manobra sem checar os espelhos",
            "Sempre pedir ajuda de outra pessoa",
        ],
        "correct_index": 1,
        "category": "baliza",
    },
    {
        "prompt": "É proibido ultrapassar em qual situação?",
        "options": [
            "Em reta com boa visibilidade",
            "Em curvas e aclives sem visibilidade suficiente",
            "Em vias com mais de uma faixa",
            "Durante o dia",
        ],
        "correct_index": 1,
        "category": "rodovia",
    },
    {
        "prompt": "Ao fazer marcha à ré, o motorista deve...",
        "options": [
            "Confiar apenas na câmera de ré",
            "Olhar para trás e usar os espelhos, com atenção total",
            "Acelerar rapidamente para terminar logo",
            "Só se preocupar se houver pedestres visíveis",
        ],
        "correct_index": 1,
        "category": "marcha-re",
    },
    {
        "prompt": "Ao se aproximar de uma curva fechada, o ideal é...",
        "options": [
            "Acelerar durante a curva",
            "Reduzir a velocidade antes da curva",
            "Frear bruscamente durante a curva",
            "Manter a mesma velocidade da reta",
        ],
        "correct_index": 1,
        "category": "curva",
    },
    {
        "prompt": "Antes de sair para dirigir, é importante conferir...",
        "options": [
            "Somente o nível de combustível",
            "Espelhos, cinto, banco e freio de mão",
            "Apenas a pressão dos pneus",
            "Nada, basta ligar o carro",
        ],
        "correct_index": 1,
        "category": "checklist",
    },
    {
        "prompt": "Manter distância segura do veículo à frente ajuda a...",
        "options": [
            "Andar mais rápido",
            "Evitar frenagens bruscas e colisões",
            "Economizar combustível apenas",
            "Não traz nenhuma vantagem",
        ],
        "correct_index": 1,
        "category": "direcao-suave",
    },
    {
        "prompt": "Ao estacionar em uma subida, o motorista deve...",
        "options": [
            "Deixar o câmbio em ponto morto sempre",
            "Virar as rodas adequadamente e usar o freio de mão",
            "Deixar o carro solto com as rodas retas",
            "Não é necessário nenhum cuidado especial",
        ],
        "correct_index": 1,
        "category": "estacionamento",
    },
    {
        "prompt": "O que significa uma placa triangular amarela com borda vermelha?",
        "options": [
            "Regulamentação (proibições ou obrigações)",
            "Advertência (alerta de perigo à frente)",
            "Indicação de serviços",
            "Informação turística",
        ],
        "correct_index": 1,
        "category": None,
    },
    {
        "prompt": "É correto usar farol alto quando...",
        "options": [
            "Há outros veículos se aproximando",
            "Não há veículos à frente ou em sentido contrário, em local sem iluminação",
            "Sempre, para melhor visibilidade",
            "Apenas dentro de túneis",
        ],
        "correct_index": 1,
        "category": None,
    },
    {
        "prompt": "O uso de dispositivo de retenção (cadeirinha) para crianças pequenas é...",
        "options": [
            "Recomendação, não obrigatório",
            "Obrigatório por lei",
            "Só necessário em rodovias",
            "Opcional, a critério dos pais",
        ],
        "correct_index": 1,
        "category": None,
    },
    # --- checklist ---
    {
        "prompt": "Antes de dirigir, quais documentos o motorista deve portar?",
        "options": [
            "Apenas a CNH",
            "CNH e CRLV (ou suas versões digitais)",
            "Apenas o CRLV",
            "Nenhum documento é obrigatório",
        ],
        "correct_index": 1,
        "category": "checklist",
    },
    {
        "prompt": "O que fazer com objetos soltos dentro do carro antes de sair?",
        "options": [
            "Deixar como estão",
            "Guardá-los, pois podem virar projéteis em freadas bruscas",
            "Só importa se forem pesados",
            "Colocar no banco de trás sem fixação",
        ],
        "correct_index": 1,
        "category": "checklist",
    },
    {
        "prompt": "O espelho retrovisor interno deve ser ajustado para...",
        "options": [
            "Ver apenas o banco de trás",
            "Enquadrar toda a extensão do vidro traseiro",
            "Ver o próprio rosto",
            "Não precisa de ajuste",
        ],
        "correct_index": 1,
        "category": "checklist",
    },
    {
        "prompt": "Item de segurança que deve estar disponível no veículo em caso de pane é...",
        "options": [
            "Extintor de incêndio, sempre obrigatório",
            "Triângulo de sinalização",
            "Estepe cheio de combustível",
            "Nenhum item é exigido",
        ],
        "correct_index": 1,
        "category": "checklist",
    },
    {
        "prompt": "Ajustar o banco do motorista antes de dirigir serve para...",
        "options": [
            "Só conforto, sem importância técnica",
            "Garantir alcance correto aos pedais e volante, com boa postura",
            "É necessário só para pessoas altas",
            "Não influencia a condução segura",
        ],
        "correct_index": 1,
        "category": "checklist",
    },
    # --- baliza ---
    {
        "prompt": "Baliza é a manobra de...",
        "options": [
            "Estacionar em vaga na fila, entre dois veículos",
            "Fazer retorno em via de mão dupla",
            "Ultrapassar em rodovia",
            "Subir uma ladeira",
        ],
        "correct_index": 0,
        "category": "baliza",
    },
    {
        "prompt": "Antes de iniciar a baliza, o motorista deve...",
        "options": [
            "Acelerar para entrar rápido na vaga",
            "Sinalizar com a seta e parar alinhado ao carro da frente da vaga",
            "Buzinar para os pedestres saírem",
            "Desligar o carro",
        ],
        "correct_index": 1,
        "category": "baliza",
    },
    {
        "prompt": "A velocidade ideal durante a manobra de baliza é...",
        "options": [
            "A mais alta possível",
            "Bem baixa, quase em marcha lenta",
            "Igual à de uma via urbana comum",
            "Não importa, desde que termine rápido",
        ],
        "correct_index": 1,
        "category": "baliza",
    },
    {
        "prompt": "Se o carro ficar desalinhado durante a baliza, o correto é...",
        "options": [
            "Continuar do jeito que está",
            "Corrigir com pequenos movimentos de volante, avançando e recuando se preciso",
            "Sair e procurar outra vaga",
            "Acelerar para forçar o alinhamento",
        ],
        "correct_index": 1,
        "category": "baliza",
    },
    {
        "prompt": "Ao concluir a baliza, o motorista deve verificar...",
        "options": [
            "Se o rádio está ligado",
            "Se o carro está alinhado e a uma distância segura dos veículos vizinhos",
            "Apenas o nível de combustível",
            "Nada, a manobra termina quando o carro para",
        ],
        "correct_index": 1,
        "category": "baliza",
    },
    # --- rotatoria ---
    {
        "prompt": "Rotatórias existem principalmente para...",
        "options": [
            "Organizar o fluxo em cruzamentos sem precisar de semáforo",
            "Servir de estacionamento temporário",
            "Aumentar a velocidade permitida na via",
            "Substituir faixas de pedestres",
        ],
        "correct_index": 0,
        "category": "rotatoria",
    },
    {
        "prompt": "Ao se aproximar de uma rotatória, o motorista deve...",
        "options": [
            "Acelerar para entrar antes dos outros",
            "Reduzir a velocidade e observar quem já está circulando",
            "Buzinar antes de entrar",
            "Parar completamente sempre, mesmo com a via livre",
        ],
        "correct_index": 1,
        "category": "rotatoria",
    },
    {
        "prompt": "Para sair de uma rotatória, o correto é...",
        "options": [
            "Sair sem sinalizar",
            "Sinalizar com a seta direita antes da saída desejada",
            "Sinalizar com a seta esquerda",
            "Parar dentro da rotatória para decidir a saída",
        ],
        "correct_index": 1,
        "category": "rotatoria",
    },
    {
        "prompt": "É permitido ultrapassar outro veículo dentro de uma rotatória?",
        "options": [
            "Sim, sempre que houver espaço",
            "Não, deve-se manter a faixa até a saída",
            "Sim, apenas pela direita",
            "Depende do tamanho da rotatória",
        ],
        "correct_index": 1,
        "category": "rotatoria",
    },
    {
        "prompt": "Em uma rotatória com mais de uma faixa, o motorista deve...",
        "options": [
            "Escolher qualquer faixa, sem relação com o destino",
            "Escolher a faixa correspondente ao destino antes de entrar",
            "Sempre usar a faixa mais à esquerda",
            "Trocar de faixa livremente dentro da rotatória",
        ],
        "correct_index": 1,
        "category": "rotatoria",
    },
    # --- estacionamento ---
    {
        "prompt": "Ao estacionar em uma subida sem meio-fio, as rodas dianteiras devem ficar...",
        "options": [
            "Retas",
            "Viradas para a direita, afastando do centro da via",
            "Viradas para a esquerda",
            "Não importa a posição",
        ],
        "correct_index": 1,
        "category": "estacionamento",
    },
    {
        "prompt": "Ao estacionar em uma descida, as rodas dianteiras devem ficar...",
        "options": [
            "Retas",
            "Viradas para a esquerda, em direção ao meio-fio",
            "Viradas para a direita",
            "Não importa a posição",
        ],
        "correct_index": 1,
        "category": "estacionamento",
    },
    {
        "prompt": "É proibido estacionar...",
        "options": [
            "Em qualquer rua residencial",
            "A menos de 5 metros de esquinas e em frente a hidrantes",
            "Em vagas demarcadas",
            "Perto de outros carros",
        ],
        "correct_index": 1,
        "category": "estacionamento",
    },
    {
        "prompt": "Antes de estacionar em vaga paralela, o motorista deve...",
        "options": [
            "Acelerar para entrar rápido",
            "Sinalizar e verificar espelhos e ponto cego",
            "Buzinar para os carros ao redor saírem",
            "Desligar o carro antes de manobrar",
        ],
        "correct_index": 1,
        "category": "estacionamento",
    },
    {
        "prompt": "Ao sair de uma vaga estacionada, o motorista deve...",
        "options": [
            "Sair sem verificar, o trânsito deve dar passagem",
            "Sinalizar e verificar o tráfego antes de retornar à via",
            "Buzinar e sair imediatamente",
            "Não é necessário sinalizar",
        ],
        "correct_index": 1,
        "category": "estacionamento",
    },
    # --- curva ---
    {
        "prompt": "Antes de entrar em uma curva, o motorista deve...",
        "options": [
            "Acelerar para ganhar tempo",
            "Reduzir a velocidade antes de entrar na curva, não durante",
            "Frear bruscamente já na curva",
            "Manter a mesma velocidade da reta",
        ],
        "correct_index": 1,
        "category": "curva",
    },
    {
        "prompt": "Durante uma curva, as mãos do motorista devem...",
        "options": [
            "Permanecer ambas no volante, em posição segura",
            "Uma mão pode soltar para trocar de marcha sem problema",
            "Não importa a posição",
            "Ficar apenas na parte inferior do volante",
        ],
        "correct_index": 0,
        "category": "curva",
    },
    {
        "prompt": "Acelerar bruscamente dentro de uma curva pode causar...",
        "options": [
            "Melhor estabilidade",
            "Perda de aderência e derrapagem",
            "Economia de combustível",
            "Nenhum efeito relevante",
        ],
        "correct_index": 1,
        "category": "curva",
    },
    {
        "prompt": "Em curvas com pista molhada, o motorista deve...",
        "options": [
            "Manter a mesma velocidade de sempre",
            "Reduzir ainda mais a velocidade, já que a aderência diminui",
            "Acelerar para atravessar mais rápido",
            "Não há diferença em relação à pista seca",
        ],
        "correct_index": 1,
        "category": "curva",
    },
    {
        "prompt": "Reduzir a velocidade só dentro da curva, em vez de antes dela, aumenta o risco de...",
        "options": [
            "Economizar combustível",
            "Derrapagem e perda de controle do veículo",
            "Nada, é indiferente",
            "Melhorar a curva",
        ],
        "correct_index": 1,
        "category": "curva",
    },
    # --- marcha-re ---
    {
        "prompt": "Ao fazer marcha à ré, além dos espelhos, o motorista deve...",
        "options": [
            "Olhar por cima do ombro e pela janela traseira",
            "Confiar apenas na câmera de ré",
            "Fechar os olhos e seguir devagar",
            "Não precisa olhar para trás",
        ],
        "correct_index": 0,
        "category": "marcha-re",
    },
    {
        "prompt": "A velocidade ideal para fazer marcha à ré é...",
        "options": [
            "A mais alta possível, para terminar rápido",
            "Bem baixa, controlada e constante",
            "Igual à de uma via urbana comum",
            "Não importa",
        ],
        "correct_index": 1,
        "category": "marcha-re",
    },
    {
        "prompt": "Se o motorista perde a referência do espaço durante a marcha à ré, o correto é...",
        "options": [
            "Continuar mesmo assim",
            "Parar o carro e reavaliar antes de continuar",
            "Acelerar para sair da situação",
            "Buzinar até alguém ajudar",
        ],
        "correct_index": 1,
        "category": "marcha-re",
    },
    {
        "prompt": "Usar apenas a câmera de ré, sem olhar fisicamente para trás, é...",
        "options": [
            "Totalmente seguro",
            "Desaconselhado, pois câmeras têm pontos cegos",
            "Obrigatório em todos os carros",
            "Mais seguro que olhar pela janela",
        ],
        "correct_index": 1,
        "category": "marcha-re",
    },
    {
        "prompt": "Ao sair de marcha à ré de uma vaga entre dois carros, o motorista deve...",
        "options": [
            "Sair rapidamente sem verificar",
            "Observar o tráfego que se aproxima antes de sair",
            "Buzinar e sair imediatamente",
            "Não é necessário verificar, os outros carros devem parar",
        ],
        "correct_index": 1,
        "category": "marcha-re",
    },
    # --- rodovia ---
    {
        "prompt": "A distância segura em relação ao veículo da frente pode ser calculada pela...",
        "options": [
            "Regra dos 2 segundos",
            "Regra do metro",
            "Não existe forma de calcular",
            "Distância de um carro apenas, sempre",
        ],
        "correct_index": 0,
        "category": "rodovia",
    },
    {
        "prompt": "Em rodovias de pista dupla, a faixa da esquerda deve ser usada...",
        "options": [
            "Para trafegar o tempo todo",
            "Apenas para ultrapassagens, retornando à direita em seguida",
            "Somente por veículos mais rápidos",
            "Para estacionar em emergências",
        ],
        "correct_index": 1,
        "category": "rodovia",
    },
    {
        "prompt": "Ao entrar em uma rodovia pela via de acesso, o motorista deve...",
        "options": [
            "Entrar devagar, sem se preocupar com o fluxo",
            "Acelerar para se ajustar à velocidade do fluxo antes de se inserir",
            "Parar na via de acesso e esperar",
            "Buzinar para os carros da rodovia pararem",
        ],
        "correct_index": 1,
        "category": "rodovia",
    },
    {
        "prompt": "Em caso de pane na rodovia, o motorista deve...",
        "options": [
            "Parar na faixa e ligar o pisca-alerta apenas",
            "Sinalizar com o triângulo, ligar o pisca-alerta e sair do veículo com segurança",
            "Deixar o carro parado sem sinalização",
            "Continuar dirigindo até encontrar um posto",
        ],
        "correct_index": 1,
        "category": "rodovia",
    },
    {
        "prompt": "Dirigir por longos períodos em rodovia sem pausas aumenta o risco de...",
        "options": [
            "Economia de combustível",
            "Fadiga e microssonos",
            "Melhor concentração",
            "Nenhum risco adicional",
        ],
        "correct_index": 1,
        "category": "rodovia",
    },
    # --- direcao-suave ---
    {
        "prompt": "Direção suave (econômica e segura) se caracteriza por...",
        "options": [
            "Acelerações e frenagens bruscas",
            "Acelerações e frenagens graduais, sem solavancos",
            "Velocidade sempre no limite máximo",
            "Trocas de marcha em alta rotação",
        ],
        "correct_index": 1,
        "category": "direcao-suave",
    },
    {
        "prompt": "Antecipar o trânsito à frente ajuda a...",
        "options": [
            "Aumentar o consumo de combustível",
            "Reduzir frenagens bruscas e economizar combustível",
            "Não traz nenhum benefício",
            "Aumentar o desgaste dos freios",
        ],
        "correct_index": 1,
        "category": "direcao-suave",
    },
    {
        "prompt": "Manter velocidade constante em vias de fluxo livre...",
        "options": [
            "Aumenta o consumo de combustível",
            "Reduz o consumo de combustível e o desgaste dos freios",
            "Não influencia em nada",
            "É proibido por lei",
        ],
        "correct_index": 1,
        "category": "direcao-suave",
    },
    {
        "prompt": "Frenagens bruscas frequentes aumentam...",
        "options": [
            "A vida útil dos freios",
            "O desgaste dos freios e o risco de perda de controle",
            "A economia de combustível",
            "Nenhum risco",
        ],
        "correct_index": 1,
        "category": "direcao-suave",
    },
    {
        "prompt": "Uma direção suave contribui para...",
        "options": [
            "Maior desconforto dos passageiros",
            "Maior conforto dos passageiros e menor risco de acidentes",
            "Nenhuma diferença perceptível",
            "Maior consumo de combustível",
        ],
        "correct_index": 1,
        "category": "direcao-suave",
    },
    # --- postura-ao-dirigir ---
    {
        "prompt": "Qual é a posição recomendada das mãos no volante para a maioria dos veículos modernos?",
        "options": ["9 horas e 3 horas", "12 horas apenas", "6 horas", "Uma mão embaixo do queixo"],
        "correct_index": 0,
        "category": "postura-ao-dirigir",
    },
    {
        "prompt": "Qual é a postura correta do motorista ao dirigir?",
        "options": [
            "Reclinado bem para trás, relaxado",
            "Encostado no banco, com as costas retas",
            "Inclinado bem para frente, perto do volante",
            "Não existe postura ideal",
        ],
        "correct_index": 1,
        "category": "postura-ao-dirigir",
    },
    {
        "prompt": "Depois de fazer uma curva, o que o motorista deve fazer com o volante?",
        "options": [
            "Tirar as mãos e deixar ele voltar sozinho",
            "Soltar suavemente sem tirar as mãos",
            "Segurar travado até parar",
            "Girar rapidamente para o lado oposto",
        ],
        "correct_index": 1,
        "category": "postura-ao-dirigir",
    },
    {
        "prompt": "Por que dirigir com os braços totalmente esticados não é recomendado?",
        "options": [
            "Porque cansa mais e reduz o controle em manobras rápidas",
            "Porque é proibido por lei",
            "Porque desliga o airbag",
            "Não há problema nenhum",
        ],
        "correct_index": 0,
        "category": "postura-ao-dirigir",
    },
    {
        "prompt": "Com que frequência é recomendado observar os espelhos enquanto dirige?",
        "options": [
            "Só antes de manobras",
            "Continuamente, a cada poucos segundos",
            "Apenas no início do trajeto",
            "Nunca, atrapalha a atenção na via",
        ],
        "correct_index": 1,
        "category": "postura-ao-dirigir",
    },
    {
        "prompt": "Qual a principal vantagem de manter a postura correta ao dirigir?",
        "options": [
            "Só estética",
            "Melhor controle do carro e menos cansaço e lesões",
            "Não tem vantagem real",
            "Só importa em viagens muito longas",
        ],
        "correct_index": 1,
        "category": "postura-ao-dirigir",
    },
    # --- pedais-e-embreagem ---
    {
        "prompt": "Em um carro com câmbio manual, quantos pedais existem e qual a ordem da esquerda para a direita?",
        "options": [
            "Dois: freio e acelerador",
            "Três: embreagem, freio e acelerador",
            "Três: acelerador, freio e embreagem",
            "Quatro: embreagem, freio, acelerador e marcha",
        ],
        "correct_index": 1,
        "category": "pedais-e-embreagem",
    },
    {
        "prompt": "Qual pé deve ser usado para pisar na embreagem?",
        "options": ["O direito", "O esquerdo", "Qualquer um dos dois", "Os dois ao mesmo tempo"],
        "correct_index": 1,
        "category": "pedais-e-embreagem",
    },
    {
        "prompt": "Qual pé deve ser usado para o acelerador e o freio?",
        "options": [
            "O esquerdo para os dois",
            "O direito para os dois, nunca ao mesmo tempo",
            "O direito no acelerador e o esquerdo no freio",
            "Não importa",
        ],
        "correct_index": 1,
        "category": "pedais-e-embreagem",
    },
    {
        "prompt": "O que pode acontecer se o motorista pisar no freio e no acelerador ao mesmo tempo?",
        "options": [
            "Nada, é uma prática recomendada",
            "Perda de controle e desgaste desnecessário do veículo",
            "O carro anda mais rápido com segurança",
            "É a forma correta de frear em emergência",
        ],
        "correct_index": 1,
        "category": "pedais-e-embreagem",
    },
    {
        "prompt": "Pisar fundo no acelerador de forma brusca costuma causar...",
        "options": [
            "Economia de combustível",
            "Aceleração descontrolada e desconforto aos passageiros",
            "Redução do consumo de combustível",
            "Maior durabilidade do motor",
        ],
        "correct_index": 1,
        "category": "pedais-e-embreagem",
    },
    {
        "prompt": "Antes de aprender a dirigir em movimento, é importante...",
        "options": [
            "Pular direto para a estrada",
            "Reconhecer bem a posição e o funcionamento de cada pedal com o carro parado",
            "Aprender só com o carro desligado, sem nunca ligá-lo",
            "Ignorar os pedais e focar só no volante",
        ],
        "correct_index": 1,
        "category": "pedais-e-embreagem",
    },
    # --- ponto-de-embreagem ---
    {
        "prompt": "O que é o 'ponto de embreagem'?",
        "options": [
            "O momento em que o motor desliga",
            "O ponto em que o carro começa a se mover ao soltar a embreagem",
            "A posição da embreagem totalmente pisada",
            "Um ajuste do banco do motorista",
        ],
        "correct_index": 1,
        "category": "ponto-de-embreagem",
    },
    {
        "prompt": "Como encontrar o ponto de embreagem?",
        "options": [
            "Soltando a embreagem de uma vez, rapidamente",
            "Soltando a embreagem devagar até sentir o carro puxar para frente",
            "Pisando fundo no acelerador antes de soltar a embreagem",
            "Sem soltar a embreagem em nenhum momento",
        ],
        "correct_index": 1,
        "category": "ponto-de-embreagem",
    },
    {
        "prompt": "O que costuma acontecer se o motorista soltar a embreagem rápido demais sem acelerar?",
        "options": ["O carro acelera suavemente", "O motor morre (cala)", "O carro anda de ré", "Nada acontece"],
        "correct_index": 1,
        "category": "ponto-de-embreagem",
    },
    {
        "prompt": "Praticar o ponto de embreagem parado, sem acelerar, serve para...",
        "options": [
            "Ganhar velocidade rapidamente",
            "Sentir com precisão o momento exato em que o carro reage",
            "Economizar combustível",
            "Não tem nenhuma utilidade",
        ],
        "correct_index": 1,
        "category": "ponto-de-embreagem",
    },
    {
        "prompt": "Depois de dominar o ponto de embreagem parado, o próximo passo é...",
        "options": [
            "Tentar arrancar com uma leve aceleração junto",
            "Arrancar em segunda marcha direto",
            "Nunca mais usar a embreagem",
            "Soltar a embreagem de uma vez em alta velocidade",
        ],
        "correct_index": 0,
        "category": "ponto-de-embreagem",
    },
    {
        "prompt": "Dominar bem o ponto de embreagem ajuda especialmente em...",
        "options": [
            "Ultrapassagens em rodovia",
            "Arrancadas suaves e manobras em baixa velocidade",
            "Uso do farol alto",
            "Estacionamento em local plano com o carro desligado",
        ],
        "correct_index": 1,
        "category": "ponto-de-embreagem",
    },
    # --- ligar-e-desligar ---
    {
        "prompt": "Antes de dar a partida no carro com câmbio manual, o motorista deve...",
        "options": [
            "Deixar o carro engatado em uma marcha",
            "Confirmar que o câmbio está em ponto morto e pisar na embreagem",
            "Acelerar fundo",
            "Soltar o freio de mão antes de ligar",
        ],
        "correct_index": 1,
        "category": "ligar-e-desligar",
    },
    {
        "prompt": "Ao dar a partida, o que se deve fazer assim que o motor pega?",
        "options": [
            "Segurar a chave na posição de partida por mais alguns segundos",
            "Soltar a chave imediatamente",
            "Acelerar fundo",
            "Pisar no freio com força",
        ],
        "correct_index": 1,
        "category": "ligar-e-desligar",
    },
    {
        "prompt": "Antes de desligar o carro, o que é recomendado fazer primeiro?",
        "options": ["Tirar o pé da embreagem", "Engatar o freio de mão", "Acelerar uma última vez", "Abrir a porta"],
        "correct_index": 1,
        "category": "ligar-e-desligar",
    },
    {
        "prompt": "Em qual marcha o carro deve estar antes de desligar o motor?",
        "options": ["Em qualquer marcha engatada", "Em ponto morto", "Na marcha à ré", "Na marcha mais alta"],
        "correct_index": 1,
        "category": "ligar-e-desligar",
    },
    {
        "prompt": "O que pode acontecer se o motorista tentar dar partida com o carro engatado e sem pisar na embreagem?",
        "options": [
            "Nada, é seguro",
            "O carro pode dar um solavanco e se mover de forma inesperada",
            "O motor liga mais rápido",
            "A bateria dura mais",
        ],
        "correct_index": 1,
        "category": "ligar-e-desligar",
    },
    {
        "prompt": "Repetir a sequência correta de ligar e desligar o carro ajuda a evitar...",
        "options": [
            "Furos no pneu",
            "Calar o motor sem querer e desgaste desnecessário",
            "Multas de trânsito",
            "Consumo de combustível",
        ],
        "correct_index": 1,
        "category": "ligar-e-desligar",
    },
    # --- trocar-marchas ---
    {
        "prompt": "Antes de trocar de marcha em movimento, o motorista deve...",
        "options": [
            "Acelerar fundo e depois pisar na embreagem",
            "Tirar o pé do acelerador e pisar na embreagem até o fim",
            "Soltar o volante",
            "Frear bruscamente",
        ],
        "correct_index": 1,
        "category": "trocar-marchas",
    },
    {
        "prompt": "Quando é indicado subir de marcha?",
        "options": [
            "Quando o motor está com rotação baixa demais",
            "Quando o motor está acelerando demais para a velocidade atual",
            "Nunca, deve-se ficar sempre na mesma marcha",
            "Só em descidas",
        ],
        "correct_index": 1,
        "category": "trocar-marchas",
    },
    {
        "prompt": "Quando é indicado descer de marcha?",
        "options": [
            "Antes de perder força, como em subidas",
            "Ao entrar em uma rodovia reta e plana",
            "Assim que o carro liga",
            "Nunca é necessário descer de marcha",
        ],
        "correct_index": 0,
        "category": "trocar-marchas",
    },
    {
        "prompt": "Trocar de marcha sem pisar totalmente na embreagem costuma causar...",
        "options": [
            "Troca mais suave",
            "Ruído e desgaste na caixa de câmbio",
            "Economia de combustível",
            "Nenhum efeito perceptível",
        ],
        "correct_index": 1,
        "category": "trocar-marchas",
    },
    {
        "prompt": "Durante a troca de marchas, o que o motorista NÃO deve fazer?",
        "options": [
            "Manter a atenção na via",
            "Tirar os olhos da via para olhar a alavanca de câmbio",
            "Pisar na embreagem até o fim",
            "Soltar a embreagem aos poucos",
        ],
        "correct_index": 1,
        "category": "trocar-marchas",
    },
    {
        "prompt": "Andar em uma marcha muito alta para a velocidade do carro pode causar...",
        "options": [
            "Aceleração descontrolada",
            "Perda de força e o carro 'engasgar'",
            "Economia extra de combustível sem nenhuma desvantagem",
            "Maior velocidade máxima",
        ],
        "correct_index": 1,
        "category": "trocar-marchas",
    },
    # --- controle-baixa-velocidade ---
    {
        "prompt": "Para manter o carro em velocidade bem baixa e controlada, o motorista deve usar principalmente...",
        "options": [
            "O freio de mão",
            "O ponto de embreagem, sem acelerar",
            "O acelerador no máximo",
            "A marcha à ré mesmo indo para frente",
        ],
        "correct_index": 1,
        "category": "controle-baixa-velocidade",
    },
    {
        "prompt": "Ao praticar controle em baixa velocidade, os dois pés do motorista devem ficar...",
        "options": [
            "Ambos no acelerador",
            "Um na embreagem e outro perto do freio, prontos para agir",
            "Ambos fora dos pedais",
            "Um no freio de mão e outro no acelerador",
        ],
        "correct_index": 1,
        "category": "controle-baixa-velocidade",
    },
    {
        "prompt": "Se o carro acelerar mais do que o desejado durante uma manobra lenta, o que fazer?",
        "options": [
            "Pisar fundo no acelerador para compensar",
            "Pisar um pouco mais na embreagem em vez de frear bruscamente",
            "Soltar o volante",
            "Desligar o carro imediatamente",
        ],
        "correct_index": 1,
        "category": "controle-baixa-velocidade",
    },
    {
        "prompt": "Controle em baixa velocidade é uma habilidade especialmente importante para...",
        "options": [
            "Ultrapassagens em rodovia",
            "Manobras em espaços apertados, como baliza e estacionamento",
            "Dirigir em alta velocidade",
            "Uso do farol de neblina",
        ],
        "correct_index": 1,
        "category": "controle-baixa-velocidade",
    },
    {
        "prompt": "Antes de praticar controle em baixa velocidade em curva, é recomendado praticar primeiro...",
        "options": ["Em alta velocidade", "Em linha reta", "Somente de marcha à ré", "Com os olhos fechados"],
        "correct_index": 1,
        "category": "controle-baixa-velocidade",
    },
    {
        "prompt": "Qual erro comum atrapalha o controle em baixa velocidade?",
        "options": [
            "Manter os pés prontos na embreagem e no freio",
            "Acelerar em vez de usar o ponto de embreagem",
            "Reduzir a velocidade gradualmente",
            "Observar os retrovisores",
        ],
        "correct_index": 1,
        "category": "controle-baixa-velocidade",
    },
    # --- placas-e-sinalizacao ---
    {
        "prompt": "Placas de sinalização com fundo branco e borda vermelha, formato circular, geralmente indicam...",
        "options": [
            "Uma advertência",
            "Uma proibição",
            "Uma informação de serviço",
            "Uma indicação de destino",
        ],
        "correct_index": 1,
        "category": "placas-e-sinalizacao",
    },
    {
        "prompt": "Placas triangulares com borda vermelha são do tipo...",
        "options": ["Regulamentação", "Advertência", "Indicação", "Serviços auxiliares"],
        "correct_index": 1,
        "category": "placas-e-sinalizacao",
    },
    {
        "prompt": "Ao encontrar uma placa cujo significado o motorista não reconhece, o mais indicado é...",
        "options": [
            "Ignorar e manter a velocidade",
            "Reduzir a velocidade e redobrar a atenção",
            "Acelerar para passar rápido",
            "Parar no meio da via",
        ],
        "correct_index": 1,
        "category": "placas-e-sinalizacao",
    },
    {
        "prompt": "As faixas pintadas no chão da via são consideradas...",
        "options": [
            "Decoração, sem valor legal",
            "Sinalização, com o mesmo valor das placas",
            "Apenas orientação para pedestres",
            "Válidas somente à noite",
        ],
        "correct_index": 1,
        "category": "placas-e-sinalizacao",
    },
    {
        "prompt": "Uma placa de velocidade máxima indica...",
        "options": [
            "A velocidade mínima obrigatória",
            "O limite de velocidade permitido naquele trecho",
            "Uma sugestão que pode ser ignorada",
            "A velocidade ideal para economizar combustível",
        ],
        "correct_index": 1,
        "category": "placas-e-sinalizacao",
    },
    {
        "prompt": "Placas azuis e retangulares costumam indicar...",
        "options": [
            "Proibições",
            "Informações e serviços (ex: estacionamento, hospital)",
            "Perigo iminente",
            "Fim de pista",
        ],
        "correct_index": 1,
        "category": "placas-e-sinalizacao",
    },
    # --- semaforos-e-prioridade ---
    {
        "prompt": "Ao ver o sinal amarelo, o motorista deve...",
        "options": [
            "Acelerar para passar antes do vermelho",
            "Avaliar se dá tempo de parar com segurança e, se não, seguir com cautela",
            "Ignorar, pois vale como verde",
            "Parar bruscamente sempre",
        ],
        "correct_index": 1,
        "category": "semaforos-e-prioridade",
    },
    {
        "prompt": "Em um cruzamento sem sinalização, quem tem preferência?",
        "options": ["Quem chegar primeiro", "Quem vem pela direita", "O veículo mais rápido", "O veículo mais largo"],
        "correct_index": 1,
        "category": "semaforos-e-prioridade",
    },
    {
        "prompt": "Mesmo com o sinal verde, antes de avançar em um cruzamento o motorista deve...",
        "options": [
            "Acelerar sem olhar, já que tem prioridade",
            "Observar os dois lados antes de seguir",
            "Fechar os olhos e confiar no sinal",
            "Buzinar continuamente",
        ],
        "correct_index": 1,
        "category": "semaforos-e-prioridade",
    },
    {
        "prompt": "É permitido parar sobre a faixa de pedestres esperando o sinal abrir?",
        "options": [
            "Sim, sempre que houver fila",
            "Não, deve-se parar antes da faixa",
            "Sim, apenas à noite",
            "Sim, se não houver pedestres por perto",
        ],
        "correct_index": 1,
        "category": "semaforos-e-prioridade",
    },
    {
        "prompt": "Em uma rotatória, quem tem preferência de passagem?",
        "options": [
            "Quem está entrando na rotatória",
            "Quem já está circulando dentro dela",
            "O veículo mais próximo à saída",
            "Não existe prioridade definida",
        ],
        "correct_index": 1,
        "category": "semaforos-e-prioridade",
    },
    {
        "prompt": "O sinal vermelho piscante em um semáforo geralmente equivale a...",
        "options": [
            "Sinal verde",
            "Uma placa de PARE",
            "Sinalização apagada, sem significado",
            "Permissão para acelerar",
        ],
        "correct_index": 1,
        "category": "semaforos-e-prioridade",
    },
    # --- distancia-e-espelhos ---
    {
        "prompt": "A 'regra dos 2 segundos' serve para...",
        "options": [
            "Calcular o tempo de uma ultrapassagem",
            "Manter uma distância segura do carro da frente",
            "Definir o tempo de sinal verde",
            "Medir a velocidade do vento",
        ],
        "correct_index": 1,
        "category": "distancia-e-espelhos",
    },
    {
        "prompt": "Em dias de chuva, a distância de segurança em relação ao carro da frente deve ser...",
        "options": ["Reduzida", "Aumentada", "Igual, não muda nada", "Zero, para não perder o carro de vista"],
        "correct_index": 1,
        "category": "distancia-e-espelhos",
    },
    {
        "prompt": "Com que frequência é recomendado checar o retrovisor interno durante a condução?",
        "options": [
            "Nunca, é perigoso desviar o olhar",
            "A cada 5 a 8 segundos",
            "Apenas uma vez por viagem",
            "Só antes de estacionar",
        ],
        "correct_index": 1,
        "category": "distancia-e-espelhos",
    },
    {
        "prompt": "Antes de uma freada mais forte, o motorista deve, se possível...",
        "options": [
            "Ignorar os espelhos e focar só no freio",
            "Checar os retrovisores para saber quem vem atrás",
            "Acelerar antes de frear",
            "Buzinar continuamente",
        ],
        "correct_index": 1,
        "category": "distancia-e-espelhos",
    },
    {
        "prompt": "Seguir muito próximo do carro da frente porque ele está andando devagar é...",
        "options": [
            "Uma prática segura",
            "Perigoso, pois reduz o tempo de reação em caso de frenagem",
            "Recomendado em vias urbanas",
            "Obrigatório em rodovias",
        ],
        "correct_index": 1,
        "category": "distancia-e-espelhos",
    },
    {
        "prompt": "Manter distância segura do carro da frente ajuda principalmente a...",
        "options": [
            "Economizar combustível",
            "Ter tempo de reação suficiente em caso de frenagem brusca",
            "Chegar mais rápido ao destino",
            "Evitar multas de excesso de velocidade",
        ],
        "correct_index": 1,
        "category": "distancia-e-espelhos",
    },
    # --- mudanca-de-faixa ---
    {
        "prompt": "Antes de mudar de faixa, a seta deve ser ligada...",
        "options": [
            "Durante a manobra",
            "Antes de começar a se mexer",
            "Depois de já estar na outra faixa",
            "Não é necessário usar a seta",
        ],
        "correct_index": 1,
        "category": "mudanca-de-faixa",
    },
    {
        "prompt": "O 'ponto cego' é...",
        "options": [
            "A área bem à frente do carro",
            "A área ao lado ou atrás do carro que não aparece nos espelhos",
            "O painel do carro",
            "A luz de freio traseira",
        ],
        "correct_index": 1,
        "category": "mudanca-de-faixa",
    },
    {
        "prompt": "Antes de mudar de faixa, além dos espelhos, o motorista deve...",
        "options": [
            "Fechar os olhos por um instante",
            "Virar rapidamente a cabeça para checar o ponto cego",
            "Acelerar ao máximo",
            "Buzinar para avisar",
        ],
        "correct_index": 1,
        "category": "mudanca-de-faixa",
    },
    {
        "prompt": "Como deve ser o movimento do volante ao mudar de faixa?",
        "options": [
            "Brusco e rápido",
            "Suave e gradual",
            "Não importa, desde que seja rápido",
            "Deve-se soltar o volante",
        ],
        "correct_index": 1,
        "category": "mudanca-de-faixa",
    },
    {
        "prompt": "Depois de completar a mudança de faixa, o motorista deve...",
        "options": [
            "Manter a seta ligada por mais alguns minutos",
            "Desligar a seta assim que terminar a manobra",
            "Acelerar fortemente",
            "Voltar imediatamente para a faixa anterior",
        ],
        "correct_index": 1,
        "category": "mudanca-de-faixa",
    },
    {
        "prompt": "Mudar de faixa sem sinalizar e sem checar o ponto cego aumenta o risco de...",
        "options": [
            "Economizar combustível",
            "Colisão com um veículo que estava fora do campo de visão dos espelhos",
            "Chegar mais rápido ao destino",
            "Nenhum risco adicional",
        ],
        "correct_index": 1,
        "category": "mudanca-de-faixa",
    },
    # --- direcao-defensiva ---
    {
        "prompt": "Direção defensiva significa principalmente...",
        "options": [
            "Dirigir o mais rápido possível para sair logo do perigo",
            "Antecipar riscos e agir para evitar acidentes, mesmo que o erro seja de outro",
            "Nunca usar os freios",
            "Ignorar os outros veículos",
        ],
        "correct_index": 1,
        "category": "direcao-defensiva",
    },
    {
        "prompt": "Ao passar perto de escolas ou pontos de ônibus, o motorista deve...",
        "options": [
            "Manter a velocidade normal",
            "Reduzir a velocidade e redobrar a atenção",
            "Acelerar para passar rápido",
            "Buzinar continuamente",
        ],
        "correct_index": 1,
        "category": "direcao-defensiva",
    },
    {
        "prompt": "Antes de passar perto de um pedestre na calçada, o motorista deve...",
        "options": [
            "Presumir que o pedestre já viu o carro",
            "Reduzir a velocidade, mesmo que o pedestre pareça ter visto o carro",
            "Acelerar para passar antes dele se mexer",
            "Buzinar sem necessidade",
        ],
        "correct_index": 1,
        "category": "direcao-defensiva",
    },
    {
        "prompt": "Ao ultrapassar um ciclista, a distância lateral mínima recomendada é de aproximadamente...",
        "options": ["30 centímetros", "1,5 metro", "10 centímetros", "Não há necessidade de distância extra"],
        "correct_index": 1,
        "category": "direcao-defensiva",
    },
    {
        "prompt": "Motociclistas e ciclistas, em relação aos pontos cegos, geralmente...",
        "options": [
            "Não têm pontos cegos",
            "Também têm pontos cegos e podem não ver o carro",
            "São sempre visíveis em qualquer espelho",
            "Só têm ponto cego à noite",
        ],
        "correct_index": 1,
        "category": "direcao-defensiva",
    },
    {
        "prompt": "Ao perceber um comportamento imprevisível de outro condutor, o mais indicado é...",
        "options": [
            "Acelerar para se afastar rapidamente",
            "Manter distância e reduzir a velocidade",
            "Buzinar e seguir sem alterar nada",
            "Fechar o carro do outro condutor",
        ],
        "correct_index": 1,
        "category": "direcao-defensiva",
    },
]


async def seed_checklist_items(
    session_factory: async_sessionmaker = async_session,
) -> None:
    async with session_factory() as session:
        existing = await session.scalar(select(ChecklistItem.id).limit(1))
        if existing is not None:
            print("checklist_items já populada, pulando seed.")
            return

        session.add_all(
            ChecklistItem(title=title, order=order)
            for order, title in enumerate(DEFAULT_CHECKLIST_ITEMS, start=1)
        )
        await session.commit()
        print(f"{len(DEFAULT_CHECKLIST_ITEMS)} itens de checklist inseridos.")


async def seed_quiz_questions(
    session_factory: async_sessionmaker = async_session,
) -> None:
    async with session_factory() as session:
        # Idempotente por categoria (não pela tabela inteira) — assim, quando
        # novas categorias são adicionadas a DEFAULT_QUIZ_QUESTIONS depois que
        # o banco já foi semeado uma vez, rodar o seed de novo insere só as
        # categorias que ainda não existem, sem duplicar as que já existem.
        existing_result = await session.execute(select(QuizQuestion.category).distinct())
        existing_categories = {category for (category,) in existing_result.all()}

        new_questions = [
            question for question in DEFAULT_QUIZ_QUESTIONS if question["category"] not in existing_categories
        ]
        if not new_questions:
            print("quiz_questions já populada, pulando seed.")
            return

        session.add_all(QuizQuestion(**question) for question in new_questions)
        await session.commit()
        print(f"{len(new_questions)} perguntas de quiz inseridas.")


async def seed_all(session_factory: async_sessionmaker = async_session) -> None:
    await seed_checklist_items(session_factory)
    await seed_quiz_questions(session_factory)


if __name__ == "__main__":
    asyncio.run(seed_all())
