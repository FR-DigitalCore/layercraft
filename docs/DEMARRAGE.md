# Démarrage

Le `README.md` à la racine est la spec produit. Ce document décrit comment faire
tourner le code réellement présent dans le dépôt.

## En une commande

```bash
./scripts/demarrer.sh            # ajoutez --avec-demo pour des données d'exemple
```

Le script crée le `.env`, génère le secret de session et un mot de passe
administrateur, construit l'image, lance Postgres et MinIO, applique les
migrations et démarre l'application. Il est relançable sans risque : rien
n'est régénéré si c'est déjà en place. Les identifiants administrateur ne
s'affichent qu'à la création — notez-les.

Reste à renseigner à la main dans `.env`, selon vos besoins :

| Variable | Sans elle |
|---|---|
| `ADMIN_EMAIL` | pas de connexion à l'administration |
| `RESEND_API_KEY` | les emails sont loggés en console au lieu d'être envoyés |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | pas de paiement en ligne, encaissement hors ligne |
| `MONDIAL_RELAY_ENSEIGNE`, `MONDIAL_RELAY_CLE_PRIVEE` | le client saisit son numéro de point relais au lieu de le choisir dans une liste |

Tout le reste a des valeurs par défaut utilisables.

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

### Ports déjà pris

Si un Postgres ou un MinIO tourne déjà sur votre poste, changez les ports
**publiés** dans `.env`, jamais les chaînes de connexion :

```env
POSTGRES_HOST_PORT="5433"
MINIO_HOST_PORT="9003"
MINIO_CONSOLE_HOST_PORT="9004"
```

Ces variables n'agissent que sur la machine hôte. Dans le réseau Docker, les
conteneurs s'écoutent toujours sur leurs ports internes : l'app joint
`postgres:5432` et `minio:9000` quoi qu'il arrive. Modifier `DATABASE_URL` ou
`MINIO_PORT` pour y mettre un port publié donne un `ECONNREFUSED`.

`docker-compose.yml` aligne tout seul `MINIO_PUBLIC_PORT` sur `MINIO_HOST_PORT`,
pour que les presigned URLs restent joignables depuis le navigateur.

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

Deux domaines sont nécessaires : l'application et un sous-domaine pour les
fichiers. Les presigned URLs sont signées sur le domaine public et la signature
couvre l'en-tête `Host` — sans ce sous-domaine, les aperçus STL et les images
de la galerie ne se chargent pas.

```bash
# Sur le serveur, dans le dossier du projet
cp .env.example .env
```

À renseigner impérativement dans `.env` :

| Variable | Valeur |
|---|---|
| `NEXTAUTH_URL`, `NEXT_PUBLIC_SITE_URL` | `https://votredomaine.fr` |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` | `npm run hash-password -- "…"` |
| `POSTGRES_PASSWORD` | mot de passe fort |
| `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` | identifiants forts |
| `MINIO_PUBLIC_ENDPOINT` | `fichiers.votredomaine.fr` |
| `MINIO_PUBLIC_PORT` / `MINIO_PUBLIC_USE_SSL` | `443` / `true` |
| `RESEND_API_KEY`, `RESEND_FROM`, `ADMIN_NOTIF_EMAIL` | compte Resend |

`MINIO_ENDPOINT`, `MINIO_PORT` et `DATABASE_URL` sont surchargés par
`docker-compose.yml` avec les noms de service internes : pas la peine d'y
toucher.

```bash
docker compose build            # NEXT_PUBLIC_SITE_URL est lu au build
docker compose up -d postgres minio
docker compose run --rm migrate # applique prisma/migrations
docker compose up -d
docker compose ps               # app doit passer "healthy"
```

Le service `migrate` est construit depuis une étape d'image dédiée
(`target: migrator`) qui conserve `node_modules` en entier : le CLI Prisma a
besoin de ses dépendances transitives. L'image applicative, elle, n'embarque
que le client généré et son moteur.

Pour insérer le jeu de démonstration, depuis la même image :

```bash
docker compose run --rm migrate node prisma/seed.mjs
```

Puis le reverse proxy : `deploy/nginx.conf.example` contient les deux vhosts
(app + fichiers), avec `client_max_body_size 60M` pour les uploads STL. Ensuite
`certbot --nginx -d votredomaine.fr -d www.votredomaine.fr -d fichiers.votredomaine.fr`.

### Ce qui n'est pas exposé

Postgres (5432), l'API MinIO (9000), la console MinIO (9001) et l'app (3000)
n'écoutent que sur `127.0.0.1`. Seul Nginx les joint. Pour la console MinIO :

```bash
ssh -L 9001:127.0.0.1:9001 user@vps   # puis http://localhost:9001
```

### Si le service `migrate` échoue

Le CLI Prisma est embarqué dans l'image, mais en cas de souci vous pouvez
migrer depuis l'hôte, Postgres étant publié sur la boucle locale :

```bash
DATABASE_URL="postgresql://user:MOTDEPASSE@127.0.0.1:5432/impression3d" \
  npx prisma migrate deploy
```

### Mise à jour

```bash
git pull
docker compose build
docker compose run --rm migrate
docker compose up -d
```

### Reste à faire avant la mise en ligne

- compléter `app/(site)/mentions-legales` et `app/(site)/confidentialite` avec
  les informations réelles (éditeur, hébergeur, SIRET, durées de conservation) ;
- ajuster les coordonnées dans `lib/site.ts` ;
- recaler la grille tarifaire depuis `/admin/tarifs` ;
- mettre en place les sauvegardes : `pg_dump` planifié et copie du volume
  `miniodata`.

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


## Pages légales

`lib/entreprise.ts` centralise toutes les informations légales. Tant qu'un
champ garde sa valeur `[À COMPLÉTER …]`, un bandeau d'avertissement s'affiche
en haut des pages légales et liste ce qui manque. Il disparaît de lui-même une
fois le fichier rempli — rien d'autre à toucher.

Trois pages sont servies : `/mentions-legales`, `/confidentialite` et `/cgv`.
Les CGV sont obligatoires dès lors que le site encaisse des paiements ; elles
couvrent notamment l'exclusion du droit de rétractation pour les pièces
fabriquées sur mesure (art. L.221-28 3° du code de la consommation).

**Ces textes sont une base sérieuse, pas un avis juridique.** Faites-les relire
avant l'ouverture, en particulier les durées de conservation et les clauses de
garantie, qui dépendent de votre activité réelle.

## Mesure d'audience

Umami, sans cookie ni identifiant persistant, donc sans bandeau de
consentement à afficher. Deux variables suffisent à l'activer :

```env
NEXT_PUBLIC_UMAMI_URL="https://umami.votredomaine.fr"
NEXT_PUBLIC_UMAMI_WEBSITE_ID="<identifiant donné par Umami>"
```

Sans elles, aucun script n'est chargé. Ce sont des variables `NEXT_PUBLIC_*` :
elles sont figées dans le bundle au build, donc `docker compose build` est
nécessaire après les avoir renseignées.

Pour héberger Umami vous-même, à côté de l'application :

```bash
docker compose --profile mesure up -d umami   # écoute sur 127.0.0.1:3001
```

Sa base `umami` est créée au premier démarrage du volume Postgres. Sur une
installation déjà en place, créez-la à la main :

```bash
docker compose exec postgres psql -U user -c 'CREATE DATABASE umami;'
```

Identifiants Umami par défaut : `admin` / `umami` — à changer immédiatement.

### Ce qui n'est pas mesuré

Le suivi automatique d'Umami est désactivé et les vues sont envoyées à la
main, car les URL de suivi contiennent le jeton de commande : les laisser
partir reviendrait à recopier un secret dans les statistiques. Sont exclus
`/suivi`, `/mon-compte`, `/connexion`, `/admin` et `/api`. Le script n'est
d'ailleurs chargé que sur les pages publiques.

## Ce qui reste à faire

- Vérification de bout en bout avec Postgres et MinIO réels, **y compris
  `docker compose build`** : l'environnement de développement utilisé pour
  l'implémentation n'avait pas accès au registre Docker, aucune image n'a donc
  pu être construite ni lancée.
- Sauvegardes : dump Postgres + réplication du volume MinIO.
- Éventuel calcul de prix au volume réel (parsing du STL) plutôt qu'au forfait.
