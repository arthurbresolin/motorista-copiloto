#!/usr/bin/env bash
# Stop — portão de conclusão. Nenhuma tarefa termina com a suíte vermelha.
#
# Este é o hook mais importante do kit. Sem ele, rodar os testes depende de o
# modelo lembrar; com ele, é infraestrutura.
#
# Roda apenas os projetos com alteração desde o último commit. Árvore limpa,
# sai na hora.
set -uo pipefail

source "$(dirname "${BASH_SOURCE[0]}")/_comum.sh"

ENTRADA="$(cat)"

# O hook já bloqueou uma vez nesta parada: não bloquear de novo.
[ "$(campo_json 'stop_hook_active' "$ENTRADA")" = "True" ] && exit 0

cd "$RAIZ" || exit 0
ALTERADOS="$(git status --porcelain 2>/dev/null)"
[ -n "$ALTERADOS" ] || exit 0

FALHAS=""

while IFS='|' read -r dir tipo; do
  [ -n "$dir" ] || continue

  # O projeto foi tocado? Na raiz, qualquer alteração conta.
  if [ "$dir" = "." ]; then
    TOCADO=1
  else
    TOCADO=$(printf '%s' "$ALTERADOS" | grep -c " $dir/" || true)
  fi
  [ "${TOCADO:-0}" -gt 0 ] || continue

  CMD="$(comando_teste "$dir" "$tipo")"
  [ -n "$CMD" ] || continue

  SAIDA="$(cd "$RAIZ/$dir" && eval "$CMD" 2>&1)" || FALHAS="$FALHAS

--- $dir ($CMD) ---
$(printf '%s' "$SAIDA" | tail -30)"
done < <(projetos_detectados)

[ -n "$FALHAS" ] && bloquear "A suíte está vermelha — a tarefa não está concluída.
$FALHAS

Corrija o que quebrou. Não altere o teste para fazê-lo passar: se o teste
falhou, o comportamento regrediu."

exit 0
