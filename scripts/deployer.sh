#!/usr/bin/env bash
# Déploie la version courante de la branche sur la machine où il tourne.
# Appelé par la CI en SSH, ou à la main depuis le dossier du projet :
#   bash scripts/deployer.sh
set -euo pipefail

cd "$(dirname "$0")/.."

BRANCHE="${BRANCHE:-main}"
CONTENEUR="${CONTENEUR:-layercraft-app}"

echo "→ Récupération de origin/$BRANCHE"
git fetch --prune origin "$BRANCHE"
# reset plutôt que pull : la copie du serveur n'est jamais modifiée à la
# main, et un pull échouerait sur le moindre fichier divergent. Le .env
# n'est pas suivi, il n'est donc pas touché.
git reset --hard "origin/$BRANCHE"

echo "→ Construction de l'image"
docker compose build

echo "→ Migrations"
docker compose run --rm migrate

echo "→ Redémarrage"
docker compose up -d --remove-orphans

echo "→ Attente de l'état healthy"
for _ in $(seq 1 36); do
  etat=$(docker inspect -f '{{.State.Health.Status}}' "$CONTENEUR" 2>/dev/null || echo absent)
  if [ "$etat" = healthy ]; then
    echo "✓ en ligne"
    # Les images intermédiaires s'accumulent vite sur un petit disque.
    docker image prune -f >/dev/null
    exit 0
  fi
  sleep 5
done

echo "✗ l'application n'est pas devenue saine en 3 minutes :"
docker compose logs --tail=80 app
exit 1
