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
        existing = await session.scalar(select(QuizQuestion.id).limit(1))
        if existing is not None:
            print("quiz_questions já populada, pulando seed.")
            return

        session.add_all(QuizQuestion(**question) for question in DEFAULT_QUIZ_QUESTIONS)
        await session.commit()
        print(f"{len(DEFAULT_QUIZ_QUESTIONS)} perguntas de quiz inseridas.")


async def seed_all(session_factory: async_sessionmaker = async_session) -> None:
    await seed_checklist_items(session_factory)
    await seed_quiz_questions(session_factory)


if __name__ == "__main__":
    asyncio.run(seed_all())
