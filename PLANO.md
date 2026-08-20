# Plano — <NOME DO PROJETO>

Documento de execução. O Claude Code trabalha este plano **uma tarefa por vez** e
registra o que fez em `PROGRESSO.md`.

Este arquivo contém **o que falta**. O histórico do que já foi feito, com o que
foi medido, fica em `PROGRESSO.md`.

Cada tarefa tem um título que diz o que ela é. **Não use códigos nem siglas**
(`1.1`, `2.3`, `F2.a`): eles não significam nada quando alguém abre o arquivo
três dias depois, e já causaram dúvida em sessão de trabalho real. Se precisar
citar uma tarefa, cite pelo título.

Não existe prazo. Existe ordem.

---

## Como executar

Cada tarefa tem **Objetivo**, **Passos** e **Pronto quando**. "Pronto quando" é
critério verificável por comando, não por opinião.

Ao final de cada tarefa: commit próprio, com a suíte verde. Nunca agrupe duas
tarefas num commit.

Se uma tarefa travar, três strikes: registre o impedimento em `PROGRESSO.md`,
deixe a árvore limpa e passe para a próxima tarefa independente.

---

## Confirmar o baseline antes de começar

Sempre, no início de uma sessão nova.

**Passos**

1. <subir o ambiente>
2. <instalar dependências>
3. <rodar a suíte>

**Pronto quando** a suíte passa, sem nenhum teste a menos que o último registro
de `PROGRESSO.md`.

Compare com o registro, não com um número fixo — o baseline cresce a cada sessão.
Se não bater, **pare** e registre a divergência.

---

## <Nome do primeiro grupo de tarefas>

### <Título que descreve a tarefa>

<O problema, com evidência: arquivo, linha, comando que demonstra. Se você não
consegue mostrar o problema com um comando, provavelmente ainda não entendeu o
problema.>

**Passos**

1. Escrever o teste que falha primeiro.
2. <corrigir>

**Pronto quando**

- <comando verificável>
- o teste novo falha ao reverter a correção (verifique de fato)

---

## Dívida estrutural — contínua, nunca em mutirão

Nada aqui vira força-tarefa. Tudo se aplica ao trecho que a tarefa do dia já
exige tocar. Refatoração ampla em código sem cobertura é o que produz as noites
perdidas.

---

## Pendências do usuário — conferir depois

O Claude **não** avança nestes itens sozinho; deixa registrado e segue o resto.

---

## Ordem de execução autônoma

```
Confirmar o baseline

<Grupo>
  1. <Título da tarefa>
  2. <Título da tarefa>
```
