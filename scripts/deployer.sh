#!/usr/bin/env bash
# Déploie la version courante de la branche sur la machine où il tourne.
#
# À lancer depuis le dossier du projet :
#   bash scripts/deployer.sh
#
# La CI le dépose d'abord sur le serveur par scp, puis l'exécute de la même
# façon : c'est le script du commit déployé qui tourne, et non la copie du
# serveur, qui date par construction d'avant la mise à jour.
set -euo pipefail

if [ ! -f docker-compose.yml ]; then
  echo "✗ à lancer depuis le dossier du projet (docker-compose.yml introuvable)" >&2
  exit 1
fi

BRANCHE="${BRANCHE:-main}"
CONTENEUR="${CONTENEUR:-layercraft-app}"

echo "→ Récupération de origin/$BRANCHE"
git fetch --prune origin "$BRANCHE"
# checkout -f -B plutôt qu'un pull : la copie du serveur n'est jamais
# modifiée à la main, et cette forme fonctionne quelle que soit la branche
# sur laquelle elle se trouvait. Le .env n'étant pas suivi, il est intact.
git checkout -f -B "$BRANCHE" "origin/$BRANCHE"

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
