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

Tout se règle depuis `/admin/tarifs`, y compris le **modèle de calcul** :

| Mode | Formule | Volume du STL |
|---|---|---|
| `FORFAIT` | prix de base × coef. qualité × quantité × remise | non utilisé |
| `MATIERE` | (mise en route + masse × prix/g × coef. qualité) × quantité × remise | requis |
| `MATIERE_TEMPS` | (mise en route + masse × prix/g + heures × prix horaire) × quantité × remise | requis |

Le simulateur affiche les trois modèles côte à côte sur une même pièce
(matière, qualité, volume, quantité réglables) et se recalcule en direct.
Rien n'est appliqué tant que « Enregistrer la grille » n'a pas été cliqué.

Les valeurs vivent en base (`TarifMatiere`, `TarifQualite`, `RemiseQuantite`,
`ParametresTarification`). Tant qu'une valeur n'a pas été saisie, c'est
`GRILLE_DEFAUT` de `lib/prix.ts` qui s'applique, champ par champ — le site
fonctionne donc sans configuration préalable.

**Les chiffres par défaut sont des placeholders**, à recaler sur les coûts réels
(prix au gramme, densités, prix horaire machine, mise en route).

### Volume et masse

Le volume est mesuré sur le maillage à l'upload (somme des volumes signés des
tétraèdres) et **recalculé côté serveur** à la création du devis : la valeur
envoyée par le navigateur n'est jamais reprise en base.

Deux limites à connaître :

- seuls les **STL binaires** sont mesurés ; un STL ASCII renvoie un volume nul
  et retombe sur `volumeParDefaut` ;
- la masse part du volume brut × taux de remplissage, avec un plancher à 35 %
  (parois et couches pleines consomment de la matière quel que soit l'infill).
  Ce n'est pas un slicer : comptez un écart de l'ordre de 10 à 20 %.

Le temps machine du mode `MATIERE_TEMPS` est déduit du débit en cm³/h réglé par
qualité — approximation volontairement simple, à calibrer sur vos temps réels.

Modifier la grille n'a aucun effet sur les devis déjà enregistrés.

## Ce qui reste à faire

- Vérification de bout en bout avec Postgres et MinIO réels (l'environnement de
  développement utilisé pour l'implémentation initiale n'avait pas accès au
  registre Docker).
- Sauvegardes : dump Postgres + réplication du volume MinIO.
- Éventuel calcul de prix au volume réel (parsing du STL) plutôt qu'au forfait.
