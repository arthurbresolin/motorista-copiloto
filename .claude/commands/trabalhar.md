---
description: Executa o PLANO.md de forma autônoma, pedindo todas as permissões antes de começar
---

Execute o `PLANO.md` deste projeto de forma autônoma.

O usuário não estará presente durante a execução. Ele vai abrir esta sessão,
aprovar as permissões, sair, e conferir o resultado depois. Isso muda o que se
espera de você: nada de perguntas no meio do caminho, e nenhuma decisão
irreversível tomada sozinho.

## Passo 1 — Levantar o estado, antes de qualquer coisa

Sem escrever código ainda:

1. Leia `COMECE-AQUI.md`, `PLANO.md`, `PROGRESSO.md` e `CLAUDE.md`.
2. `git status` e `git log --oneline -10`.
3. Confirme o baseline. Compare com o último registro de `PROGRESSO.md`, não com
   um número fixo. Se não bater, **pare aqui** e reporte.

## Passo 2 — Pedir tudo de uma vez

Monte a lista das tarefas que pretende executar, na ordem do `PLANO.md`, e a
lista de permissões que elas vão exigir. Apresente as duas ao usuário **numa
única mensagem** e espere a aprovação.

Peça permissão explícita para instalar dependências, alterar arquivos de
manifesto, fazer push, ou qualquer coisa fora do que o `PLANO.md` já prevê.

Se algo exigir decisão de produto ou acesso que você não tem, diga isso **agora**,
não depois. O usuário precisa saber, ao sair, o que não vai avançar.

Depois da aprovação, não volte a perguntar. Trabalhe.

## Passo 3 — Executar

Uma tarefa por vez, na ordem. Para cada uma:

1. Anuncie qual tarefa começou.
2. Se for correção de bug, **escreva o teste que falha primeiro** e mostre-o
   falhando. Teste que já nasce verde não prova nada.
3. Implemente.
4. Rode a suíte inteira, nunca só o teste do arquivo.
5. Verifique o "Pronto quando". Não atendido, não está pronta.
6. Commit próprio, sem `Co-Authored-By`.
7. Anote em `PROGRESSO.md`.

Trabalhe em branch. Nunca na principal.

## Passo 4 — Quando travar

Três tentativas sem resolver e você para. Não tenta a quarta.

1. `git reset --hard HEAD` para voltar ao último commit verde.
2. Registre em `PROGRESSO.md`: o que tentou, o que observou, qual sua hipótese.
3. Passe para a próxima tarefa **independente**.

Uma tarefa travada não pode contaminar as outras. Se a próxima depende da
travada, pule a dependente também e diga isso.

Prefira entregar poucas tarefas bem fechadas a começar muitas.

## Passo 5 — Fechar a sessão

Escreva em `PROGRESSO.md` um bloco com a data e:

- tarefas concluídas, com o hash do commit
- o que **mediu** em cada uma (números e saída de comando, não adjetivos)
- o que ficou travado e por quê
- o que precisa de decisão ou de acesso do usuário
- qual é a próxima tarefa

Faça push da branch. Não abra PR nem mergeie na principal — isso é do usuário.

## Proibido, sem exceção

- Alterar, afrouxar ou desativar um teste para fazê-lo passar. Se o teste falhou,
  o comportamento regrediu. Se ficou obsoleto de verdade, pare e registre.
- `--no-verify` em qualquer comando git.
- Commitar ou fazer push na branch principal.
- Tocar em `.env`.
- Dar tarefa como concluída sem o "Pronto quando" atendido.
- Ir além do escopo da tarefa. Achou outro problema? Anote e siga.

Os hooks bloqueiam a maior parte disso automaticamente. A lista está aqui para
você não precisar descobrir batendo na trava.
