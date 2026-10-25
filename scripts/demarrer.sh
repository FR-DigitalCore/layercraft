#!/usr/bin/env bash
# Démarrage en une commande : ./scripts/demarrer.sh
#
# Crée le .env s'il manque, génère les secrets, lance la stack, applique les
# migrations et propose le jeu de démonstration. Relançable sans risque : rien
# n'est écrasé si c'est déjà en place.
set -euo pipefail

cd "$(dirname "$0")/.."

vert() { printf '\033[32m%s\033[0m\n' "$1"; }
jaune() { printf '\033[33m%s\033[0m\n' "$1"; }
rouge() { printf '\033[31m%s\033[0m\n' "$1"; }

# --- Prérequis -----------------------------------------------------------
for outil in docker node; do
  if ! command -v "$outil" >/dev/null 2>&1; then
    rouge "Il manque $outil. Installez-le puis relancez."
    exit 1
  fi
done

if ! docker compose version >/dev/null 2>&1; then
  rouge "Docker Compose v2 est requis (commande « docker compose »)."
  exit 1
fi

# --- .env ----------------------------------------------------------------
if [ ! -f .env ]; then
  cp .env.example .env
  vert "✓ .env créé depuis .env.example"
fi

# Remplace une valeur seulement si elle est vide ou restée à la valeur d'exemple.
definir_si_absent() {
  local cle="$1" valeur="$2" actuel
  actuel=$(grep -E "^${cle}=" .env | head -1 | cut -d= -f2- | tr -d '"' || true)
  if [ -z "$actuel" ] || [ "$actuel" = "changeme" ] || [ "$actuel" = "bcrypt_hash_ici" ]; then
    # Le séparateur | évite d'avoir à échapper les / des hash bcrypt.
    if grep -qE "^${cle}=" .env; then
      sed -i.bak "s|^${cle}=.*|${cle}=\"${valeur}\"|" .env && rm -f .env.bak
    else
      printf '%s="%s"\n' "$cle" "$valeur" >> .env
    fi
    return 0
  fi
  return 1
}

if definir_si_absent NEXTAUTH_SECRET "$(openssl rand -base64 32)"; then
  vert "✓ NEXTAUTH_SECRET généré"
fi

MDP_ADMIN=""
if ! grep -qE '^ADMIN_PASSWORD_HASH="\$2[aby]\$' .env; then
  MDP_ADMIN=$(openssl rand -base64 18 | tr -d '/+=' | cut -c1-16)
  HASH=$(node scripts/hash-password.mjs "$MDP_ADMIN")
  definir_si_absent ADMIN_PASSWORD_HASH "$HASH" || \
    sed -i.bak "s|^ADMIN_PASSWORD_HASH=.*|ADMIN_PASSWORD_HASH=\"${HASH}\"|" .env
  rm -f .env.bak
  vert "✓ Mot de passe administrateur généré"
fi

# --- Stack ---------------------------------------------------------------
jaune "→ Démarrage de Postgres et MinIO…"
docker compose up -d postgres minio

jaune "→ Construction de l'image applicative (peut prendre quelques minutes)…"
docker compose build

jaune "→ Application des migrations…"
docker compose run --rm migrate

if [ "${1:-}" = "--avec-demo" ]; then
  jaune "→ Jeu de démonstration…"
  docker compose run --rm migrate node prisma/seed.mjs
fi

jaune "→ Lancement de l'application…"
docker compose up -d

# --- Récapitulatif -------------------------------------------------------
PORT=$(grep -E '^APP_HOST_PORT=' .env | cut -d= -f2- | tr -d '"' || true)
PORT=${PORT:-3000}
EMAIL=$(grep -E '^ADMIN_EMAIL=' .env | cut -d= -f2- | tr -d '"' || true)

echo
vert "C'est prêt."
echo "  Site  : http://localhost:${PORT}"
echo "  Admin : http://localhost:${PORT}/admin"
if [ -n "$MDP_ADMIN" ]; then
  echo
  jaune "Identifiants administrateur — notez-les, ils ne seront plus affichés :"
  echo "  email        : ${EMAIL:-à renseigner dans .env}"
  echo "  mot de passe : ${MDP_ADMIN}"
fi
echo
echo "Suivre les logs : docker compose logs -f app"
echo "Tout arrêter    : docker compose down"
