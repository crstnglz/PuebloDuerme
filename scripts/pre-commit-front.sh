#!/usr/bin/env bash
set -e

echo "🔎 Ejecutando linter del front..."

docker-compose exec -T client sh -c "npm ci --silent && npm run lint" || {
  echo '✖ Linter falló.'
  exit 1
}

echo "✅ Linter OK. Commit permitido."
