# Démarrage

Le `README.md` à la racine est la spec produit. Ce document décrit comment faire
tourner le code réellement présent dans le dépôt.

## Prérequis

- Node.js 22+
- Docker et Docker Compose (Postgres + MinIO)

## Installation locale

```bash
npm install                      # `postinstall` lance prisma generate
cp .env.example .env

# Secret NextAuth
openssl rand -base64 32          # → NEXTAUTH_SECRET

# Mot de passe admin
npm run hash-password -- "un-mot-de-passe-solide"   # → ADMIN_PASSWORD_HASH
```

Renseignez au minimum `NEXTAUTH_SECRET`, `ADMIN_EMAIL` et `ADMIN_PASSWORD_HASH`
dans `.env`. Sans `RESEND_API_KEY`, les emails ne sont pas envoyés mais loggés
en console — pratique en développement.

```bash
docker compose up -d postgres minio
npm run db:deploy                # applique prisma/migrations
npm run db:seed                  # jeu de données de démonstration (optionnel)
npm run dev
```

- Site : http://localhost:3000
- Admin : http://localhost:3000/admin
- Console MinIO : http://localhost:9001 (`minioadmin` / `minioadmin`)

Les buckets `stl-files` et `galerie` sont créés automatiquement au premier
upload. Ils restent privés : toute lecture passe par une presigned URL d'une heure.

Le seed insère des réalisations dont les images n'existent pas dans MinIO — la
galerie affiche alors le visuel de repli. Téléversez de vraies photos depuis
`/admin/realisations`.

## Scripts

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement (Turbopack) |
| `npm run build` / `npm start` | Build et exécution en production |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Nouvelle migration en dev (`prisma migrate dev`) |
| `npm run db:deploy` | Applique les migrations (prod) |
| `npm run db:seed` | Données de démonstration |
| `npm run db:studio` | Prisma Studio |
| `npm run hash-password -- "…"` | Hash bcrypt pour `ADMIN_PASSWORD_HASH` |

## Déploiement VPS

```bash
# Sur le serveur, dans le dossier du projet
cp .env.example .env             # puis renseigner les valeurs de production
#   NEXTAUTH_URL et NEXT_PUBLIC_SITE_URL doivent pointer sur le domaine public
#   MINIO_ENDPOINT est surchargé à "minio" par docker-compose

docker compose build
docker compose run --rm migrate  # applique les migrations
docker compose up -d
```

Puis le reverse proxy : voir `deploy/nginx.conf.example` (inclut
`client_max_body_size 60M` pour les STL) et `certbot --nginx` pour TLS.

Points à durcir avant la mise en ligne :

- changer `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` et `POSTGRES_PASSWORD` ;
- ne pas publier les ports 5432, 9000 et 9001 sur l'extérieur (retirer les
  `ports:` correspondants de `docker-compose.yml`, y accéder par tunnel SSH) ;
- compléter `app/(site)/mentions-legales` et `app/(site)/confidentialite` avec
  les informations réelles (éditeur, hébergeur, SIRET, durées de conservation) ;
- ajuster les coordonnées dans `lib/site.ts`.

## Tarifs

La grille tarifaire se modifie depuis `/admin/tarifs` : prix de base par matière,
coefficient par qualité et paliers de remise quantité. La page affiche une
simulation recalculée en direct pendant la saisie.

Les valeurs vivent en base (`TarifMatiere`, `TarifQualite`, `RemiseQuantite`).
Tant qu'une valeur n'a pas été saisie, c'est `GRILLE_DEFAUT` de `lib/prix.ts` qui
s'applique — le site fonctionne donc sans configuration préalable, et la base
reste facultative pour l'affichage.

Le prix estimé est toujours recalculé côté serveur à la création du devis : la
valeur affichée dans le configurateur n'est jamais reprise telle quelle. Modifier
la grille n'a aucun effet sur les devis déjà enregistrés.

## Ce qui reste à faire

- Vérification de bout en bout avec Postgres et MinIO réels (l'environnement de
  développement utilisé pour l'implémentation initiale n'avait pas accès au
  registre Docker).
- Sauvegardes : dump Postgres + réplication du volume MinIO.
- Éventuel calcul de prix au volume réel (parsing du STL) plutôt qu'au forfait.
