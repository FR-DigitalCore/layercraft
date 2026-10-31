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
| `STRIPE_SECRET_KEY` | clé secrète live du tableau de bord Stripe |
| `STRIPE_WEBHOOK_SECRET` | donné à la création du webhook, voir ci-dessous |
| `NEXT_PUBLIC_UMAMI_URL`, `NEXT_PUBLIC_UMAMI_WEBSITE_ID` | si vous activez la mesure d'audience |

Les variables `NEXT_PUBLIC_*` sont figées dans le bundle au moment du build :
renseignez-les **avant** `docker compose build`, sinon elles resteront vides
dans les pages servies.

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

### Reverse proxy

Deux hôtes à publier, quel que soit le proxy :

| Domaine | Destination | Pourquoi |
|---|---|---|
| `votredomaine.fr` | l'application, port 3000 | le site |
| `fichiers.votredomaine.fr` | MinIO, port 9000 | les fichiers, servis par liens signés |

Le second n'est pas optionnel : les liens vers les fichiers sont signés sur
le domaine public et la signature couvre l'en-tête `Host`. Sans ce
sous-domaine, ni les aperçus STL ni les images de la galerie ne se chargent.

#### Avec un reverse proxy déjà en place (recommandé)

`app` et `minio` rejoignent le réseau du proxy ; Postgres reste sur le
réseau interne. Repérez le nom du réseau :

```bash
docker network ls          # ex. npm_default
```

et reportez-le en bas de `docker-compose.yml`, dans `networks.proxy.name`.
Puis `docker compose up -d` comme d'habitude. Créez ensuite deux
*Proxy Hosts* :

- `votredomaine.fr` → Forward Hostname `layercraft-app`, Port `3000`,
  schéma `http`, *Websockets Support* activé.
- `fichiers.votredomaine.fr` → Forward Hostname `layercraft-minio`,
  Port `9000`.

Sur l'hôte de l'application, onglet **Advanced** :

```nginx
client_max_body_size 60M;
proxy_read_timeout 300s;
proxy_send_timeout 300s;
```

Sans la première ligne, les envois de STL se heurtent à la limite par défaut
du proxy et échouent sans message clair.

Un point à ne pas modifier : le proxy doit transmettre l'en-tête `Host` tel
quel sur l'hôte `fichiers.*`. La signature des liens MinIO le couvre, et une
réécriture invaliderait toutes les URL de fichiers.

Les certificats se demandent depuis l'onglet SSL de chaque hôte.

#### Avec Nginx installé sur la machine

`deploy/nginx.conf.example` contient les deux vhosts prêts à l'emploi, puis
`certbot --nginx -d votredomaine.fr -d www.votredomaine.fr -d fichiers.votredomaine.fr`.
Dans ce cas les services sont joints par les ports publiés sur `127.0.0.1`.

### Déclarer le webhook Stripe

Sans cette étape, le client paie mais la commande reste « à régler » : rien
ne le signale, ni côté client ni côté atelier. C'est l'oubli le plus coûteux
de la mise en production.

Dans le tableau de bord Stripe, section Développeurs → Webhooks, ajoutez un
point de terminaison :

- URL : `https://votredomaine.fr/api/stripe/webhook`
- Évènement à écouter : `checkout.session.completed`

Stripe affiche alors un secret de signature `whsec_…` : c'est lui qui va dans
`STRIPE_WEBHOOK_SECRET`. Redémarrez l'application après l'avoir renseigné.

Vérifiez avec un paiement de test avant d'ouvrir : la commande doit passer en
« Paiement reçu » et le client recevoir l'email correspondant.

### Checklist avant d'ouvrir au public

- [ ] `lib/entreprise.ts` rempli — le bandeau d'avertissement des pages
      légales doit avoir disparu
- [ ] `lib/site.ts` : nom commercial, email, téléphone, adresse réels
- [ ] Tarifs d'impression recalés dans `/admin/tarifs`
- [ ] Grille de port recalée dans `/admin/livraison`
- [ ] Transporteurs activés en fonction des contrats obtenus
- [ ] Webhook Stripe déclaré et testé par un paiement réel
- [ ] Domaine vérifié chez Resend, sans quoi les emails partent en indésirables
- [ ] Mot de passe administrateur changé, `NEXTAUTH_SECRET` propre à la prod
- [ ] Identifiants MinIO et Postgres changés
- [ ] Sauvegardes en place (voir ci-dessous)
- [ ] Textes légaux relus par quelqu'un de compétent

### Sauvegardes

Rien n'est sauvegardé par défaut. Deux choses à préserver : la base, qui
contient les commandes et les comptes, et le volume MinIO, qui contient les
fichiers 3D des clients.

```bash
# Base, à planifier quotidiennement
docker compose exec -T postgres pg_dump -U user impression3d | gzip > sauvegarde-$(date +%F).sql.gz

# Fichiers
docker run --rm -v layercraft_miniodata:/data -v "$PWD":/sauvegarde alpine \
  tar czf /sauvegarde/minio-$(date +%F).tar.gz -C /data .
```

Pensez à copier ces archives **hors du VPS** : une sauvegarde sur la machine
qu'elle protège ne protège de rien.

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

Automatique : tout `push` sur `main` déclenche le workflow
`.github/workflows/deploiement.yml`, qui vérifie (lint, types, build) puis,
si tout passe, se connecte au serveur en SSH et y lance
`scripts/deployer.sh`. Une pull request ne déclenche que la vérification.

À la main, c'est le même script :

```bash
bash scripts/deployer.sh
```

Il récupère `origin/main`, reconstruit l'image, joue les migrations,
redémarre, puis attend que le conteneur repasse *healthy* — et affiche les
journaux en échouant si ce n'est pas le cas au bout de trois minutes.

#### Mettre en place le déploiement automatique

Sur le serveur, créer une clé dédiée au déploiement et l'autoriser :

```bash
ssh-keygen -t ed25519 -f ~/.ssh/layercraft-deploy -N "" -C "github-actions"
cat ~/.ssh/layercraft-deploy.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/layercraft-deploy        # la clé privée, à copier dans le secret
```

Puis l'empreinte du serveur. **Préciser le port si SSH n'écoute pas sur
22** : sans `-p`, `ssh-keyscan` interroge le port par défaut et ne renvoie
rien du tout.

```bash
ssh-keyscan -p <port> -H <ip-ou-domaine>
```

La sortie commence alors par `|1|…` suivi de la clé ; pour un port non
standard, l'hôte y est noté `[hôte]:port`, forme qu'attend `known_hosts` —
d'où l'intérêt de laisser `ssh-keyscan` l'écrire plutôt que de la composer
à la main. Reporter toutes les lignes renvoyées.

Enfin, dans *Settings → Secrets and variables → Actions* du dépôt :

| Secret | Valeur |
|---|---|
| `VPS_HOST` | l'IP ou le domaine du serveur |
| `VPS_PORT` | le port SSH — à renseigner s'il n'est pas `22` |
| `VPS_USER` | l'utilisateur SSH |
| `VPS_SSH_KEY` | le contenu de la clé **privée** |
| `VPS_HOST_KEY` | la sortie de `ssh-keyscan` |
| `VPS_PATH` | facultatif, `/opt/layercraft` par défaut |

Le port doit être le même dans `VPS_PORT` et dans l'empreinte : une entrée
`known_hosts` relevée sur le 22 ne vaut pas pour une connexion sur un autre
port, et la CI échouerait sur un hôte inconnu.

`VPS_HOST_KEY` n'est pas décoratif : sans empreinte connue, la CI
accepterait n'importe quelle machine répondant à cette adresse et lui
livrerait sa clé privée.

Le serveur doit pouvoir faire `git fetch` tout seul — c'est déjà le cas si
le dépôt y a été cloné avec un accès en lecture.

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
consentement à afficher. **L'application n'héberge pas Umami** : elle se
branche sur une instance existante. Deux variables suffisent :

```env
NEXT_PUBLIC_UMAMI_URL="https://umami.votredomaine.fr"
NEXT_PUBLIC_UMAMI_WEBSITE_ID="<identifiant du site créé dans Umami>"
```

Créez le site dans votre tableau de bord Umami pour obtenir l'identifiant.
Sans ces deux valeurs, aucun script n'est chargé.

Ce sont des variables `NEXT_PUBLIC_*` : elles sont figées dans le bundle au
build, donc `docker compose build` est nécessaire après les avoir
renseignées.

### Ce qui n'est pas mesuré

Le suivi automatique d'Umami est désactivé et les vues sont envoyées à la
main, car les URL de suivi contiennent le jeton de commande : les laisser
partir reviendrait à recopier un secret dans les statistiques. Sont exclus
`/suivi`, `/mon-compte`, `/connexion`, `/admin` et `/api`. Le script n'est
d'ailleurs chargé que sur les pages publiques.

## Transporteurs

Chaque transporteur s'active ou se masque depuis `/admin/livraison`. Un
transporteur masqué disparaît du configurateur, du pied de page, et est refusé
côté serveur si quelqu'un tente de le soumettre directement. Le retrait sur
place ne peut pas être désactivé : il sert de filet pour qu'une commande reste
toujours possible.

**Mondial Relay est désactivé par défaut**, parce qu'il exige des identifiants
obtenus au contrat. Activez-le une fois ceux-ci renseignés et vérifiés.

## Mondial Relay

L'API officielle est gratuite : elle vient avec le compte professionnel, vous
ne payez que les colis. Il faut en revanche ouvrir ce compte pour obtenir la
« fiche de paramètres de sécurité » qui contient les deux valeurs attendues :

```env
MONDIAL_RELAY_ENSEIGNE="XXXXXXXX"   # 8 caractères
MONDIAL_RELAY_CLE_PRIVEE="........"
```

Avant de les mettre en production, vérifiez-les en isolation :

```bash
npm run test:mondial-relay -- 75001
```

Le script affiche la chaîne signée (clé masquée), le MD5 obtenu, le code STAT
renvoyé et la liste des points relais trouvés. Il n'utilise pas
l'application : s'il passe, l'intégration passera.

### Le piège de la signature

L'authentification repose sur un MD5 de tous les paramètres concaténés **dans
l'ordre exact de la documentation**, champs vides compris, suivis de la clé
privée :

```
[Enseigne][Pays][NumPointRelais][Ville][CP][Latitude][Longitude]
[Taille][Poids][Action][DelaiEnvoi][RayonRecherche][TypeActivite]
[NombreResultats][CLÉ PRIVÉE]
```

Un champ oublié décale tout le reste et la requête est rejetée avec un
`STAT 8`, sans autre explication. La liste est définie une seule fois dans
`lib/transporteurs/mondial-relay.ts` et sert à la fois à la signature et à
l'ordre des éléments du corps SOAP, pour que les deux ne puissent pas
diverger. Référence : documentation « Solution Web Service » V-5.14.

## Ce qui reste à faire

- Vérification de bout en bout avec Postgres et MinIO réels, **y compris
  `docker compose build`** : l'environnement de développement utilisé pour
  l'implémentation n'avait pas accès au registre Docker, aucune image n'a donc
  pu être construite ni lancée.
- Sauvegardes : dump Postgres + réplication du volume MinIO.
- Éventuel calcul de prix au volume réel (parsing du STL) plutôt qu'au forfait.
