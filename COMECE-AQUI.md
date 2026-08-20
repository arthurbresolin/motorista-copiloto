# Comece aqui

Você é o Claude Code deste projeto. Leia este arquivo inteiro antes de qualquer
outra coisa. Ele é o briefing; os detalhes estão nos arquivos que ele aponta.

---

## Por que este projeto tem travas

Diagnóstico real deste projeto (Expo/React Native + backend FastAPI para
checklist do motorista), levantado em 20/08/2026:

```bash
git log --oneline | grep -ciE "^\w+ (fix|correc|corrig)" ; git rev-list --count HEAD
# 0 correções em 8 commits — histórico recém-começado

grep -rhoE "patch\(|MagicMock" backend/tests | sort | uniq -c
# nenhum resultado — 0 mocks em 5 arquivos de teste
```

> Projeto muito novo (8 commits, 0 de correção) — não há padrão de dor
> estabelecido ainda. Os arquivos que mais mudam são os modelos e o `main.py`
> do backend (`backend/app/models/__init__.py`, `backend/app/main.py`,
> `backend/app/models/checklist.py`) — é onde o domínio de checklist está
> sendo desenhado agora. O sinal bom: a suíte do backend não usa mock nenhum
> (0 ocorrências de `patch`/`MagicMock` em 5 arquivos) — os testes rodam
> contra SQLite real via `aiosqlite`, não contra dublês. Mantenha esse padrão
> conforme o projeto cresce. O app Expo (frontend) ainda não tem teste
> nenhum — só o backend tem suíte hoje.

O ponto que importa para você: **isso foi resolvido com infraestrutura, não com
boa vontade.** Existem hooks que rodam tenha ou não alguém prestando atenção.
Não tente contorná-los; eles são o motivo de o projeto ter parado de regredir.

---

## O que fazer agora

Nesta ordem:

1. **`PLANO.md`** — o que falta, com critério de pronto verificável por comando.
2. **`PROGRESSO.md`** — onde a última sessão parou e o que já foi medido.
3. **`CLAUDE.md`** — comandos, regras invioláveis e quais arquivos são frágeis.

Depois, confirme o baseline: rode a suíte e compare com o último registro de
`PROGRESSO.md`. Se não bater, **pare e reporte** — baseline errado contamina tudo
o que vem depois.

Para uma sessão de trabalho autônoma, use `/trabalhar`.

---

## Como você trabalha aqui

**Uma tarefa por vez.** Um commit por tarefa. Nunca agrupe duas.

**Bug tem teste que falha primeiro.** Teste que já nasce verde não prova que
houve correção.

**Suíte inteira, nunca só o teste do arquivo.** Regressão mora fora do arquivo
que você tocou.

**Critério de pronto atendido, senão não está pronto** — mesmo que o código
pareça certo.

**Teste que falha é bug no código, nunca no teste.** Se parecer genuinamente
obsoleto, pare e registre para o usuário decidir. Não decida sozinho.

**Três strikes e para.** `git reset --hard HEAD`, registre o impedimento, e passe
para a próxima tarefa independente. Não tente a quarta.

**Escopo é escopo.** Achou outro problema? Anote e siga. Não conserte de
passagem.

**Nunca na branch principal.** Branch por assunto.

---

## O que os hooks bloqueiam

Você vai bater nisto se tentar:

| Tentativa | Por que é bloqueada |
|---|---|
| `skip` / `xfail` / `it.skip` / `t.Skip` em teste | é o jeito clássico de "fazer passar" sem corrigir |
| `--no-verify` | pula exatamente o gate que protege o projeto |
| `push` na `main`/`master`, ou `--force` | o trabalho tem de continuar revisável |
| `-k "not ..."`, `--deselect`, `--passWithNoTests` | esconde o teste que denuncia a regressão |
| editar `.env` | é local e nunca se toca |
| `git commit` estando na branch principal | força branch |
| `Co-Authored-By` na mensagem | convenção deste projeto |

Além disso: a cada edição roda verificação de sintaxe e de tipos; ao concluir, a
suíte inteira roda e **bloqueia a conclusão se estiver vermelha**.

Se um hook te bloquear, ele está certo. Resolva a causa, não o hook.

---

## O que não é seu

Não avance nestes itens sozinho. Registre e siga:

- decisões de produto
- major bump de dependência
- teste que pareça obsoleto
- merge na branch principal e abertura de PR

---

## Ao terminar

Escreva em `PROGRESSO.md`, com a data:

- tarefas concluídas, com o hash do commit
- **o que mediu** em cada uma — número de testes, saída dos comandos. "Corrigi o
  extrator" não é registro; "120 → 123 testes, e o novo caso falha ao reverter o
  commit" é
- o que travou, o que tentou, qual sua hipótese
- o que precisa de decisão do usuário
- qual é a próxima tarefa

Push da branch. Sem PR, sem merge.
