# Comece aqui

Você é o Claude Code deste projeto. Leia este arquivo inteiro antes de qualquer
outra coisa. Ele é o briefing; os detalhes estão nos arquivos que ele aponta.

---

## Por que este projeto tem travas

<Preencha com o diagnóstico REAL do seu projeto. Sem isto, o resto vira ritual e
a primeira trava inconveniente é desligada. Rode os comandos abaixo e cole os
números.>

```bash
# proporção de commits que são correção
git log --oneline | grep -ciE "^\w+ (fix|correc|corrig)" ; git rev-list --count HEAD

# arquivos que mais mudam (onde a dor mora)
git log --format= --name-only | grep -v '^$' | sort | uniq -c | sort -rn | head -10

# quantidade de mock na suíte
grep -rhoE "patch\(|MagicMock|jest\.mock|vi\.mock|Mockito" <dir de testes> | sort | uniq -c
```

<Exemplo de como fica preenchido, tirado de um projeto real:>

> 82 dos 171 commits eram correção — 48%. Quase uma correção por funcionalidade.
> A suíte tinha 748 mocks, que verificam que o código chamou o mock e não que o
> resultado está certo: passava verde enquanto o comportamento regredia. Não
> havia CI. O frontend não tinha teste nem verificação de tipos. E nada obrigava
> a verificar — tudo dependia de alguém lembrar, às duas da manhã, na décima
> tentativa.

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
