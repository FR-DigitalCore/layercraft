# Spec — Site impression 3D (service local)

## Vision produit

Site vitrine + devis en ligne pour un service d'impression 3D local (région Bourg-en-Bresse / Ain).
Cible : particuliers et TPE qui ont besoin d'une pièce imprimée sans savoir modéliser.
Différenciation : réactivité, conseil technique, conception + impression sur mesure.

---

## Stack technique

| Couche | Techno | Notes |
|---|---|---|
| Front | Next.js 15 App Router + TypeScript | SSR pour SEO, Tailwind CSS v4 |
| API | Route handlers Next.js | Mono-repo, pas de backend séparé phase 1 |
| Auth | NextAuth v5 (admin only) | Panneau d'admin pour gérer les commandes |
| DB | PostgreSQL via Prisma ORM | Schéma ci-dessous |
| Fichiers | MinIO (S3-compatible) self-hébergé | STL uploadés, photos galerie |
| Email | Resend SDK | Confirmation devis, notif admin |
| Preview STL | Three.js (client-only) | Chargé dynamiquement, pas de SSR |
| Infra | VPS dédié, Docker Compose, Nginx reverse proxy | Certbot TLS |

---

## Structure du projet

```
/
├── app/
│   ├── (site)/
│   │   ├── page.tsx              # Home
│   │   ├── galerie/page.tsx      # Galerie réalisations
│   │   ├── devis/page.tsx        # Configurateur devis
│   │   ├── suivi/[token]/page.tsx# Suivi commande public
│   │   └── layout.tsx
│   ├── admin/
│   │   ├── page.tsx              # Dashboard commandes
│   │   ├── commandes/[id]/page.tsx
│   │   └── layout.tsx            # Auth guard
│   └── api/
│       ├── devis/route.ts        # POST → créer devis
│       ├── upload/route.ts       # POST → upload STL vers MinIO
│       ├── commandes/route.ts    # GET/PATCH (admin)
│       └── auth/[...nextauth]/route.ts
├── components/
│   ├── ui/                       # Boutons, inputs, badges (shadcn/ui ou custom)
│   ├── StlViewer.tsx             # Three.js, import dynamique
│   ├── DevisForm.tsx             # Formulaire configurateur
│   ├── GalerieGrid.tsx
│   └── CommandeStatus.tsx
├── lib/
│   ├── prisma.ts                 # Singleton client Prisma
│   ├── minio.ts                  # Client MinIO
│   ├── resend.ts                 # Client Resend
│   ├── prix.ts                   # Calcul estimatif prix impression
│   └── tokens.ts                 # Génération token suivi
├── prisma/
│   └── schema.prisma
├── public/
│   └── galerie/                  # Images statiques backup
├── docker-compose.yml
├── .env.example
└── next.config.ts
```

---

## Schéma Prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Devis {
  id          String   @id @default(cuid())
  token       String   @unique @default(cuid()) // pour URL suivi public
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Contact
  nom         String
  email       String
  telephone   String?
  message     String?

  // Config impression
  matiere     String   // PLA, PETG, ASA, TPU
  couleur     String?
  qualite     String   // draft | standard | fine
  quantite    Int      @default(1)

  // Fichier
  stlKey      String?  // clé MinIO
  stlNom      String?

  // Suivi
  statut      Statut   @default(RECU)
  prixEstime  Float?
  prixFinal   Float?
  noteAdmin   String?

  @@index([email])
  @@index([statut])
}

enum Statut {
  RECU
  EN_ETUDE
  ACCEPTE
  EN_IMPRESSION
  TERMINE
  EXPEDIE
  ANNULE
}

model Realisation {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  titre       String
  description String?
  imageKey    String   // clé MinIO
  matiere     String?
  tags        String[] // ex: ["pièce technique", "PETG"]
  visible     Boolean  @default(true)
  ordre       Int      @default(0)
}
```

---

## Variables d'environnement (.env.example)

```env
# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/impression3d"

# Auth admin
NEXTAUTH_SECRET="changeme"
NEXTAUTH_URL="https://votredomaine.fr"
ADMIN_EMAIL="admin@votredomaine.fr"
ADMIN_PASSWORD_HASH="bcrypt_hash_ici"

# MinIO
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET_STL="stl-files"
MINIO_BUCKET_GALERIE="galerie"
MINIO_USE_SSL="false"

# Resend
RESEND_API_KEY="re_..."
RESEND_FROM="devis@votredomaine.fr"
ADMIN_NOTIF_EMAIL="admin@votredomaine.fr"
```

---

## Docker Compose (VPS)

```yaml
version: "3.9"

services:
  app:
    build: .
    restart: unless-stopped
    env_file: .env
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - minio

  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: impression3d
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    volumes:
      - pgdata:/var/lib/postgresql/data

  minio:
    image: minio/minio
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - miniodata:/data
    ports:
      - "9000:9000"
      - "9001:9001"

volumes:
  pgdata:
  miniodata:
```

---

## Pages et fonctionnalités détaillées

### `/` — Home

- Hero : accroche courte + CTA "Demander un devis" + "Voir les réalisations"
- Section "Comment ça marche" : 3 étapes (upload / devis / réception)
- Aperçu galerie (4 dernières réalisations)
- Section matières disponibles (PLA, PETG, ASA, TPU) avec carte par matière
- Footer : coordonnées, zone de livraison, lien Google Maps

### `/galerie` — Galerie

- Grid responsive des réalisations (photos MinIO)
- Filtre par tag (côté client, pas de rechargement)
- Chaque carte : image, titre, matière, bouton "Commander ce type de pièce"

### `/devis` — Configurateur

Formulaire multi-étapes (3 étapes) :

**Étape 1 — Votre fichier**
- Upload STL (drag & drop) → POST `/api/upload` → retourne `stlKey`
- Preview STL 3D via Three.js (STLLoader) après upload
- OU champ texte "Je n'ai pas de fichier, je décris ma pièce"

**Étape 2 — Configuration**
- Matière : radio cards (PLA / PETG / ASA / TPU) avec description courte de chaque
- Qualité : draft (0.3mm) / standard (0.2mm) / fine (0.1mm) — avec temps estimé indicatif
- Couleur : champ texte libre
- Quantité : stepper numérique

**Étape 3 — Contact**
- Nom, email, téléphone (optionnel), message libre
- Récapitulatif + estimation de prix (calcul local via `lib/prix.ts`)
- Bouton "Envoyer ma demande" → POST `/api/devis`

Après soumission :
- Email de confirmation au client (template Resend)
- Email de notification à l'admin
- Redirect vers `/suivi/[token]`

### `/suivi/[token]` — Suivi commande

- Récupère le devis via token (public, pas d'auth)
- Timeline des statuts avec date de chaque changement
- Prix estimé / final si renseigné
- Message de l'admin si renseigné

### `/admin` — Dashboard (auth requis)

- Liste des devis avec filtres par statut
- Vue détail : infos contact, fichier STL téléchargeable, config choisie
- Actions : changer le statut, saisir le prix, ajouter une note
- Section réalisations : CRUD (upload photo, titre, tags, ordre)

---

## Calcul de prix estimatif (`lib/prix.ts`)

Estimation indicative affichée avant soumission (non contractuelle) :

```typescript
export function estimerPrix(config: {
  matiere: 'PLA' | 'PETG' | 'ASA' | 'TPU'
  qualite: 'draft' | 'standard' | 'fine'
  quantite: number
}): number {
  const BASE = { PLA: 8, PETG: 10, ASA: 12, TPU: 14 }
  const QUALITE_MULT = { draft: 0.8, standard: 1, fine: 1.4 }
  const base = BASE[config.matiere] * QUALITE_MULT[config.qualite]
  const remise = config.quantite >= 5 ? 0.85 : config.quantite >= 3 ? 0.92 : 1
  return Math.round(base * config.quantite * remise * 100) / 100
}
```

Prix en euros HTC, à ajuster selon les coûts réels.

---

## API routes

### `POST /api/upload`

- Auth : aucune (public)
- Body : `multipart/form-data` avec champ `file` (.stl, max 50 MB)
- Actions : valide extension, upload vers MinIO bucket `stl-files`, retourne `{ key, url }`
- Erreurs : 400 si mauvais type, 413 si trop lourd

### `POST /api/devis`

- Auth : aucune (public)
- Body : JSON avec tous les champs du formulaire + `stlKey` optionnel
- Actions : validation Zod, insert en DB, envoi emails via Resend, retourne `{ token }`

### `GET /api/commandes` (admin)

- Auth : session NextAuth requise
- Query params : `statut`, `page`, `limit`
- Retourne liste paginée des devis

### `PATCH /api/commandes/[id]` (admin)

- Auth : session NextAuth requise
- Body : `{ statut?, prixFinal?, noteAdmin? }`
- Actions : mise à jour DB, si statut change → email notif au client

---

## Design system

Palette sobre, technique, crédible :

```css
--color-bg: #0f0f0f;          /* fond sombre */
--color-surface: #1a1a1a;
--color-border: #2a2a2a;
--color-accent: #ff6b2b;      /* orange filament impression */
--color-text: #f0f0f0;
--color-muted: #888;
```

Variante light mode : blanc cassé `#f8f7f5`, texte `#1a1a1a`, accent identique.

Typo : `Inter` (body) + `Space Grotesk` (titres). Google Fonts.

Composants à construire avec Tailwind, pas de dépendance UI externe lourde. Radix UI primitives si besoin d'accessibilité (dialog, select, etc.).

---

## SEO

- `metadata` Next.js sur chaque page
- Page home : title "Impression 3D Ain – Devis en ligne – [Nom service]"
- `sitemap.ts` généré dynamiquement
- `robots.ts` : bloquer `/admin`
- Balises Open Graph pour partage réseaux
- Schema.org `LocalBusiness` en JSON-LD sur la home

---

## Ordre de build recommandé

1. Init projet Next.js 15 + TypeScript + Tailwind + Prisma
2. Docker Compose local (Postgres + MinIO)
3. Schéma Prisma + migration initiale
4. Layout site + home page statique
5. Page galerie (données mockées d'abord)
6. Formulaire devis étapes 1-2 (sans upload STL)
7. API `/api/devis` + emails Resend
8. Page suivi `/suivi/[token]`
9. Upload STL + MinIO (`/api/upload`)
10. Preview STL Three.js
11. Admin dashboard (auth + liste + actions)
12. Admin CRUD réalisations
13. SEO (metadata, sitemap, schema.org)
14. Dockerfile + déploiement VPS

---

## Commandes de démarrage

```bash
# Init projet
npx create-next-app@latest impression3d --typescript --tailwind --app --src-dir=no
cd impression3d

# Dépendances
npm install prisma @prisma/client next-auth@beta resend minio three @types/three zod
npm install -D @types/node

# Init Prisma
npx prisma init

# Lancer en dev (avec docker-compose pour Postgres + MinIO)
docker compose up -d postgres minio
npx prisma migrate dev --name init
npm run dev
```

---

## Points de vigilance

- Upload STL : valider côté serveur que c'est bien un STL (magic bytes ou extension stricte), pas seulement côté client
- Preview Three.js : `import dynamic from 'next/dynamic'` avec `ssr: false` obligatoire
- MinIO URLs : générer des presigned URLs pour accès aux fichiers STL (pas de bucket public)
- Admin auth : protéger toutes les routes `/admin/*` et `/api/commandes/*` avec middleware NextAuth
- Emails : tester en dev avec Resend sandbox ou Mailtrap
- RGPD : mentions légales + politique de confidentialité requises (formulaire collecte données perso)
