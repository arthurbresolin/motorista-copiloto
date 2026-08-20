#!/usr/bin/env bash
# SessionStart — o que sai daqui entra no contexto do Claude no início da sessão.
# Serve para ele nunca começar sem saber onde o trabalho parou.
set -uo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/_comum.sh"
cd "$RAIZ" || exit 0

echo "## Estado do projeto"
echo
echo "Branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'sem git')"

SUJO="$(git status --porcelain 2>/dev/null | wc -l)"
if [ "$SUJO" -gt 0 ]; then
  echo "Árvore SUJA — $SUJO arquivo(s) sem commit:"
  git status --porcelain | head -15
  echo
  echo "Antes de começar tarefa nova, resolva o pendente: commitar se está verde,"
  echo "ou reverter se foi tentativa abandonada."
else
  echo "Árvore limpa."
fi

echo
echo "Últimos commits:"
git log --oneline -5 2>/dev/null || echo "(sem histórico)"

echo
echo "Projetos detectados e como testar:"
while IFS='|' read -r dir tipo; do
  [ -n "$dir" ] || continue
  CMD="$(comando_teste "$dir" "$tipo")"
  echo "  $dir ($tipo): ${CMD:-sem comando de teste detectado}"
done < <(projetos_detectados)

if [ -f "$RAIZ/PROGRESSO.md" ]; then
  echo
  echo "## Onde o trabalho parou"
  echo
  tail -25 "$RAIZ/PROGRESSO.md"
fi

echo
echo "## Antes de qualquer código"
echo
[ -f "$RAIZ/COMECE-AQUI.md" ] && echo "1. Leia COMECE-AQUI.md — explica por que as travas deste projeto existem."
[ -f "$RAIZ/PLANO.md" ] && echo "2. Leia PLANO.md e identifique a próxima tarefa não concluída."
echo "3. Uma tarefa por vez, um commit por tarefa, critério de pronto atendido."
echo "4. Registre em PROGRESSO.md o que fez, o que mediu e o que ficou pendente."
