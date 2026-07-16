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
