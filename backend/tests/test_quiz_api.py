from app.models import QuizQuestion


async def _seed_question(session_factory, **overrides):
    payload = {
        "prompt": "Pergunta de teste?",
        "options": ["A", "B", "C", "D"],
        "correct_index": 1,
        "category": None,
        **overrides,
    }
    async with session_factory() as session:
        question = QuizQuestion(**payload)
        session.add(question)
        await session.commit()
        await session.refresh(question)
        return question


async def test_list_quiz_questions_hides_correct_index(client, session_factory, auth_headers):
    await _seed_question(session_factory)

    response = await client.get("/quiz/questions", headers=auth_headers)

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["prompt"] == "Pergunta de teste?"
    assert body[0]["options"] == ["A", "B", "C", "D"]
    assert "correct_index" not in body[0]


async def test_list_quiz_questions_requires_auth(client, session_factory):
    await _seed_question(session_factory)

    response = await client.get("/quiz/questions")

    assert response.status_code == 401


async def test_create_quiz_session_scores_correct_answers(client, session_factory, auth_headers):
    q1 = await _seed_question(session_factory, prompt="P1", correct_index=1)
    q2 = await _seed_question(session_factory, prompt="P2", correct_index=2)

    response = await client.post(
        "/quiz/sessions",
        json={
            "answers": [
                {"question_id": q1.id, "selected_index": 1},
                {"question_id": q2.id, "selected_index": 0},
            ]
        },
        headers=auth_headers,
    )

    assert response.status_code == 201
    body = response.json()
    assert body["score"] == 1
    assert body["total_questions"] == 2


async def test_create_quiz_session_ignores_unknown_question_id(client, session_factory, auth_headers):
    response = await client.post(
        "/quiz/sessions",
        json={"answers": [{"question_id": 999, "selected_index": 0}]},
        headers=auth_headers,
    )

    assert response.status_code == 201
    body = response.json()
    assert body["score"] == 0
    assert body["total_questions"] == 1


async def test_list_quiz_sessions_most_recent_first(client, session_factory, auth_headers):
    q1 = await _seed_question(session_factory, correct_index=0)

    await client.post(
        "/quiz/sessions",
        json={"answers": [{"question_id": q1.id, "selected_index": 0}]},
        headers=auth_headers,
    )
    await client.post(
        "/quiz/sessions",
        json={"answers": [{"question_id": q1.id, "selected_index": 1}]},
        headers=auth_headers,
    )

    response = await client.get("/quiz/sessions", headers=auth_headers)

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 2
    assert body[0]["score"] == 0
    assert body[1]["score"] == 1


async def test_list_quiz_phases_only_first_unlocked_with_no_sessions(
    client, session_factory, auth_headers
):
    await _seed_question(session_factory, category=None)
    await _seed_question(session_factory, category="checklist")

    response = await client.get("/quiz/phases", headers=auth_headers)

    assert response.status_code == 200
    body = response.json()
    assert [phase["category"] for phase in body] == [None, "checklist"]
    assert body[0]["unlocked"] is True
    assert body[1]["unlocked"] is False


async def test_passing_phase_with_70_percent_unlocks_next(client, session_factory, auth_headers):
    q_geral = await _seed_question(session_factory, category=None, correct_index=0)
    await _seed_question(session_factory, category="checklist")

    response = await client.post(
        "/quiz/sessions",
        json={
            "answers": [{"question_id": q_geral.id, "selected_index": 0}],
            "category": "geral",
        },
        headers=auth_headers,
    )
    assert response.status_code == 201

    phases = (await client.get("/quiz/phases", headers=auth_headers)).json()
    checklist_phase = next(phase for phase in phases if phase["category"] == "checklist")
    assert checklist_phase["unlocked"] is True


async def test_failing_phase_keeps_next_locked(client, session_factory, auth_headers):
    q_geral = await _seed_question(session_factory, category=None, correct_index=0)
    await _seed_question(session_factory, category="checklist")

    response = await client.post(
        "/quiz/sessions",
        json={
            "answers": [{"question_id": q_geral.id, "selected_index": 1}],
            "category": "geral",
        },
        headers=auth_headers,
    )
    assert response.status_code == 201

    phases = (await client.get("/quiz/phases", headers=auth_headers)).json()
    checklist_phase = next(phase for phase in phases if phase["category"] == "checklist")
    assert checklist_phase["unlocked"] is False


async def test_get_questions_for_locked_category_is_rejected(client, session_factory, auth_headers):
    await _seed_question(session_factory, category=None)
    await _seed_question(session_factory, category="checklist")

    response = await client.get(
        "/quiz/questions", params={"category": "checklist"}, headers=auth_headers
    )

    assert response.status_code == 403


async def test_create_session_for_locked_category_is_rejected(client, session_factory, auth_headers):
    await _seed_question(session_factory, category=None)
    q_checklist = await _seed_question(session_factory, category="checklist")

    response = await client.post(
        "/quiz/sessions",
        json={
            "answers": [{"question_id": q_checklist.id, "selected_index": 0}],
            "category": "checklist",
        },
        headers=auth_headers,
    )

    assert response.status_code == 403
