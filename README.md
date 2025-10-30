# Manhua Library – Documentation ultra détaillée

---

## 1. Vue d’ensemble

Ce projet est une application Nuxt 4 fullstack pour gérer un catalogue de manhua, une bibliothèque personnelle et un espace d’administration. Il intègre :

- Authentification par session (cookie sécurisé, backend custom)
- Gestion des rôles (lecteur/admin)
- Thème clair/sombre et multilingue (fr/en)
- Backend SQLite via better-sqlite3
- API REST custom
- UI responsive avec Tailwind CSS

---

## 2. Architecture technique

### 2.1. Frontend

- **Nuxt 4** : framework Vue fullstack, SSR, API intégrée
- **Vue 3** : réactivité, composants, composables
- **Tailwind CSS** : design utilitaire, responsive
- **@nuxtjs/i18n** : gestion multilingue
- **@nuxtjs/color-mode** : gestion du thème
- **Composables** : logique réutilisable (session, thème, langue)

### 2.2. Backend

- **API Nuxt server** : endpoints personnalisés dans `/server/api/`
- **SQLite** : base de données locale, requêtes via better-sqlite3
- **Gestion des sessions** : token stocké en cookie HTTP-only
- **Vérification des rôles** : middleware sur les endpoints critiques

---

## 3. Fonctionnement global

### 3.1. Cycle utilisateur

1. L’utilisateur arrive sur le site : le layout charge la session (cookie).
2. La navigation s’adapte selon le rôle (admin/lecteur/invité).
3. Les pages protégées vérifient la session et le rôle avant d’afficher ou d’autoriser les actions.
4. Les actions (ajout/suppression/modification) passent par l’API, qui valide la session et le rôle.
5. Les préférences (thème/langue) sont mémorisées localement (localStorage/cookie).

### 3.2. Layout principal

- Fichier : `layouts/default.vue`
- Structure : header (navigation, toggles, user), slot (page courante), footer (crédits/contact)
- Navigation dynamique : liens filtrés selon le rôle via `visibleLinks`
- Composants intégrés : `ThemeToggle`, `LanguageToggle`
- Session : chargée au démarrage via le composable `useAppSession`

  **Détail technique :**Synchronise l’UI

Toute l’interface (navigation, pages, actions) observe la propriété user : si elle change, l’UI s’adapte automatiquement (affichage des liens, accès aux pages, etc.).

- `onMounted` est un hook Vue qui exécute une fonction dès que le composant est monté dans le DOM (côté client). Il permet d'initialiser des données, lancer des requêtes, ou synchroniser l'état dès l'affichage.
- Ici, dans le layout principal, on utilise `onMounted(() => { session.refresh() })` pour déclencher le chargement de la session dès le démarrage.
- La méthode `refresh()` du composable `useAppSession` :
  - Envoie une requête à l'API `/api/auth/session` pour récupérer l'utilisateur courant (via le cookie HTTP-only).
  - Met à jour l'état réactif du composable (`user`, `loading`, `error`).
  - Permet à toute l'UI d'afficher la navigation, les pages et les actions selon le rôle et l'état de connexion.
  - Si la session est absente ou invalide, l'utilisateur est considéré comme invité.

---

## 4. Pages et composants

### 4.1. Pages principales

- **Home (`/`)** : catalogue, stats, derniers ajouts, login/register si non connecté
- **Catalogue (`/works`)** : liste paginée, filtre, ajout de titres (tous membres), suppression/modération (admin)
- **Bibliothèque (`/library`)** : liste personnelle, CRUD, accès réservé aux membres
- **Admin (`/admin`)** : gestion des utilisateurs, accès admin
- **About/Contact** : pages statiques

### 4.2. Composants clés

- **ThemeToggle** : bascule clair/sombre, mémorisation locale
- **LanguageToggle** : bascule fr/en, mémorisation locale
- **useAppSession** : centralise l’état de session, méthodes login/register/logout/refresh

---

## 5. Fonctionnement du backend

### 5.1. Endpoints principaux

- `/api/auth/session` : récupère la session courante
- `/api/auth/login` : connecte l’utilisateur
- `/api/auth/register` : crée un compte
- `/api/auth/logout` : déconnecte l’utilisateur
- `/api/works` : liste, ajoute des titres
- `/api/works/[id]` : détail, modifie, supprime un titre
- `/api/library` : gère la bibliothèque personnelle
- `/api/users` : gère les membres (admin)

### 5.2. Authentification/session

- À la connexion, le backend génère un token de session stocké dans un cookie HTTP-only (`manhua_session`)
- À chaque requête, le backend lit le cookie pour identifier l’utilisateur
- Les rôles sont vérifiés côté serveur (admin/lecteur)
- Les endpoints critiques exigent le rôle admin

### 5.3. Sécurité

- Cookies sécurisés (`httpOnly`, `secure` en prod, `sameSite`)
- Mots de passe hashés (bcryptjs)
- Requêtes API vérifiées systématiquement

---

## 6. Gestion des rôles et navigation

- La session est chargée au démarrage (SSR + client)
- Le layout filtre les liens selon le rôle :
  - Invité : accès limité (Home, Catalogue, Contact, About)
  - Lecteur : accès à la bibliothèque, ajout de titres
  - Admin : accès à l’administration, modération du catalogue
- Les pages et actions critiques vérifient la session côté front ET côté back

---

## 7. Explications techniques détaillées

### 7.1. Nuxt et Vue

- **Nuxt** : framework fullstack, SSR, API, build, routing automatique
- **Vue** : réactivité, composants, `Ref` (valeur réactive), `computed`, `watch`
- **Ref** : objet réactif, toute modification de `.value` déclenche un rendu
- **Composables** : fonctions réutilisables pour centraliser la logique (ex : session, thème, langue)

### 7.2. i18n et color-mode

- **i18n** : gère la traduction, mémorise la langue dans le localStorage/cookie
- **color-mode** : gère le thème, mémorise la préférence dans le localStorage/cookie

### 7.3. Authentification

- **Login/register** : POST vers l’API, le backend vérifie et crée la session
- **Session** : cookie HTTP-only, lu côté serveur à chaque requête
- **Vérification** : chaque action critique vérifie la session et le rôle côté back

### 7.4. Navigation dynamique

- **visibleLinks** : tableau filtré selon le rôle, mis à jour automatiquement
- **ClientOnly** : composant Nuxt pour afficher des éléments uniquement côté client (utile pour session, toggles)

### 7.5. Backend et base de données

- **better-sqlite3** : requêtes SQL synchrones, rapidité et simplicité
- **Tables principales** :
  - `users` : id, username, email, is_admin, mot de passe hashé, session_token
  - `works` : catalogue des manhua
  - `library_entries` : entrées de bibliothèque par utilisateur
- **Requêtes** : toutes les actions CRUD passent par des statements préparés

### 7.6. Sécurité et bonnes pratiques

- **Cookies** : jamais accessibles en JS, uniquement transmis par le navigateur
- **Endpoints** : vérification du rôle et de la session à chaque requête
- **Mot de passe** : jamais stocké en clair, hashé avec bcryptjs
- **Données sensibles** : jamais exposées côté front

---

## 8. FAQ technique

**Q : Comment la session est-elle gérée ?**  
R : Par cookie HTTP-only, lu côté serveur et client, centralisé dans le composable `useAppSession`.

**Q : Comment le site sait qui est admin ?**  
R : Le backend stocke le rôle dans la session, le front adapte l’UI selon `user.is_admin`.

**Q : Pourquoi certains liens n’apparaissent pas ?**  
R : Le layout filtre les liens selon le rôle courant (admin/lecteur/invité).

**Q : Comment fonctionne la réactivité ?**  
R : Les états sont des `Ref` : toute modification met à jour l’UI instantanément.

**Q : Comment sont mémorisées la langue et le thème ?**  
R : Dans le localStorage ou un cookie, géré par Nuxt i18n et color-mode.

**Q : Que se passe-t-il si je modifie le code du composable session ?**  
R : Toute la gestion de session (login, logout, refresh) sera impactée : c’est le cœur de l’authentification.

**Q : Comment sont sécurisées les requêtes ?**  
R : Les cookies sont sécurisés, les mots de passe hashés, les rôles vérifiés côté serveur.

**Q : Peut-on ajouter des titres sans être admin ?**  
R : Oui, tout membre connecté peut proposer un titre ; seuls les admins peuvent supprimer/modérer.

**Q : Comment fonctionne le SSR ?**  
R : Nuxt hydrate la session côté serveur, puis synchronise côté client pour une expérience fluide.

**Q : Comment fonctionne le composable `useAppSession` ?**  
R : Il expose l’état réactif de la session et les méthodes pour login/register/logout/refresh, tout est centralisé et réactif.

**Q : Comment sont gérés les formulaires et les erreurs ?**  
R : Les erreurs sont capturées, normalisées et affichées via l’état réactif du composable.

**Q : Comment fonctionne la navigation dynamique ?**  
R : Les liens sont filtrés selon le rôle, l’UI s’adapte automatiquement.

---

## 9. Détail complet de chaque fichier du projet

### Fichiers racine

- **`app.vue`**

  - Syntaxe Vue SFC (Single File Component).
  - `<NuxtLayout>` : composant Nuxt qui gère le layout global (header/footer/navigation).
  - `<NuxtPage />` : composant Nuxt qui affiche la page courante selon le routing.
  - `import "~/assets/css/main.css";` : importe le CSS global (utilitaire Tailwind + styles custom).

- **`nuxt.config.ts`**

  - Fichier de configuration Nuxt (TypeScript).
  - `modules` : liste des modules utilisés (Tailwind, i18n, color-mode).
  - `i18n` : configuration des langues, détection automatique, cookie de langue.
  - `colorMode` : configuration du thème (préférence système, fallback light).
  - `typescript` : options strictes pour la sécurité des types.

- **`tsconfig.json`**

  - Configuration TypeScript, références vers les configs Nuxt générées automatiquement.

- **`package.json`**
  - Dépendances du projet (Nuxt, Vue, Tailwind, i18n, color-mode, better-sqlite3, bcryptjs).
  - Scripts pour lancer/dev/build/générer le projet.
  - Gestion du workspace pnpm.

---

### Dossier `assets/`

- **`css/main.css`**
  - Fichier principal Tailwind.
  - `@tailwind base/components/utilities` : import des styles de base.
  - `@layer base` : styles globaux (fond, couleur, transition).
  - `@layer components` : classes custom pour boutons, navigation, etc.

---

### Dossier `components/`

- **`LanguageToggle.vue`**

  - Bouton pour changer la langue (fr/en).
  - Utilise le composable `useI18n` pour lire/modifier la langue courante.
  - Affiche le drapeau correspondant, mémorise la langue dans le localStorage/cookie.
  - Syntaxe : `<button @click="switchLanguage">` + `<img :src=... />`.

- **`ThemeToggle.vue`**
  - Bouton pour changer le thème (clair/sombre).
  - Utilise le composable `useColorMode` pour lire/modifier le thème.
  - Affiche une icône soleil/lune, mémorise la préférence dans le localStorage/cookie.
  - Syntaxe : `<button @click="toggleColorMode">` + `<svg ... />`.

---

### Dossier `composables/`

- **`useAppSession.ts`**

  - Composable central pour la gestion de session.
  - Définit le type `SessionUser` (structure d’un utilisateur connecté).
  - État réactif : `user`, `loading`, `error`, `initialized` (tous des `Ref`).
  - Méthodes asynchrones : `refresh`, `login`, `register`, `logout`, `clearError`.
  - Utilise `fetchWithSession` pour inclure les cookies dans les requêtes API.
  - Syntaxe TypeScript, usage intensif de `async/await`, gestion des erreurs.

- **`useSession.ts`**
  - Alias pour simplifier l’import de `useAppSession`.
  - Syntaxe : `export { useAppSession as useSession } from "./useAppSession";`

---

### Dossier `i18n/locales/`

- **`fr.json` / `en.json`**
  - Fichiers de traduction pour toutes les chaînes du site.
  - Syntaxe JSON : clé/valeur, organisation par section (nav, home, works, etc.).

---

### Dossier `layouts/`

- **`default.vue`**
  - Layout principal du site.
  - Header : navigation dynamique selon le rôle, boutons thème/langue, affichage utilisateur, logout.
  - Slot : `<slot />` pour afficher la page courante.
  - Footer : crédits, contact, droits.
  - Utilise `computed`, `onMounted`, `ref`, `useAppSession`, `useI18n`.
  - Filtrage des liens via `visibleLinks` (tableau filtré selon le rôle).

---

### Dossier `pages/`

- **`index.vue`**

  - Page d’accueil.
  - Affiche le catalogue, les stats, les derniers ajouts.
  - Formulaires de login/register si non connecté.
  - Utilise le composable session pour afficher l’état utilisateur.
  - Syntaxe Vue SFC, usage de `ref`, `reactive`, `computed`, `watch`, `onMounted`.

- **`works.vue`**

  - Catalogue des manhua.
  - Liste paginée, filtre par statut/recherche.
  - Ajout de titres (tous membres), suppression/modération (admin).
  - Utilise l’API `/api/works`.
  - Syntaxe Vue SFC, usage de `ref`, `reactive`, `computed`, `ClientOnly`.

- **`library.vue`**

  - Bibliothèque personnelle.
  - Liste des lectures, CRUD sur les entrées.
  - Accès réservé aux membres connectés.
  - Utilise l’API `/api/library`.
  - Syntaxe Vue SFC, usage de `ref`, `reactive`, `computed`, `ClientOnly`.

- **`admin.vue`**
  - Espace d’administration.
  - Liste des utilisateurs, création/suppression/modification.
  - Accès réservé aux admins.
  - Utilise l’API `/api/users`.
  - Syntaxe Vue SFC, usage de `ref`, `reactive`, `computed`, `ClientOnly`.

---

### Dossier `public/`

- **`flags/`**

  - Drapeaux pour le composant langue (français, anglais).
  - Syntaxe SVG, usage dans `LanguageToggle.vue`.

- **`icons/`**

  - Icônes pour le composant thème (lune, soleil).
  - Syntaxe SVG, usage dans `ThemeToggle.vue`.

- **`favicon.ico` / `robots.txt`**
  - Fichiers statiques pour le navigateur et le SEO.

---

### Dossier `server/api/`

- **`auth/`**

  - `login.post.ts` : endpoint POST pour connecter un utilisateur.
    - Vérifie l’identifiant/mot de passe, crée une session, renvoie l’utilisateur.
  - `logout.post.ts` : endpoint POST pour déconnecter.
    - Détruit la session côté serveur, supprime le cookie.
  - `register.post.ts` : endpoint POST pour créer un compte.
    - Vérifie les champs, hash le mot de passe, crée l’utilisateur, connecte automatiquement.
  - `session.get.ts` : endpoint GET pour récupérer la session courante.
    - Lit le cookie, renvoie l’utilisateur ou null.

- **`library/`**

  - `[id].ts` : endpoint pour gérer une entrée de bibliothèque (GET, PATCH, DELETE).
    - Vérifie la session, autorise l’accès/modification/suppression selon l’utilisateur ou l’admin.
  - `index.ts` : endpoint pour lister/ajouter des entrées de bibliothèque.
    - Vérifie la session, permet d’ajouter une entrée, liste toutes les entrées de l’utilisateur.

- **`users/`**

  - `[id].ts` : endpoint pour gérer un utilisateur (GET, PATCH, DELETE).
    - Accès réservé à l’admin, permet de modifier/supprimer un utilisateur.
  - `index.ts` : endpoint pour lister/créer des utilisateurs (admin).
    - Liste paginée, création de nouveaux membres.

- **`works/`**
  - `[id].ts` : endpoint pour gérer un titre (GET, PATCH, DELETE).
    - Accès lecture pour tous, modification/suppression réservée à l’admin.
  - `index.ts` : endpoint pour lister/ajouter des titres.
    - Liste paginée, ajout de titres par tout membre connecté, suppression/modération par l’admin.

---

### Dossier `server/utils/`

- **`auth.ts`**

  - Fonctions utilitaires pour la gestion de session.
  - `getCurrentUser(event)` : lit le cookie, renvoie l’utilisateur ou null.
  - `requireUser(event)` : lève une erreur si pas connecté.
  - `requireAdmin(event)` : lève une erreur si pas admin.
  - `createSession(event, userId)` : crée un token, le stocke en base, le met en cookie.
  - `destroySession(event, userId?)` : supprime le token en base et le cookie.

- **`db.ts`**
  - Initialisation et accès à la base SQLite via better-sqlite3.
  - Syntaxe TypeScript, export du client DB.

---

## 10. Explications syntaxiques et techniques

- **Vue SFC** : chaque fichier `.vue` contient `<template>`, `<script setup>`, `<style>`.
- **`ref`** : crée une donnée réactive, modifiable via `.value`.
- **`reactive`** : crée un objet réactif (plusieurs propriétés).
- **`computed`** : crée une propriété calculée, mise à jour automatiquement.
- **`watch`** : observe une donnée et exécute une fonction à chaque changement.
- **`onMounted`** : exécute une fonction au montage du composant.
- **`ClientOnly`** : composant Nuxt pour afficher du contenu uniquement côté client (utile pour session, toggles).
- **`async/await`** : syntaxe pour gérer les fonctions asynchrones (API, session).
- **`fetchWithSession`** : utilitaire pour inclure les cookies dans les requêtes API.
- **Endpoints API** : chaque fichier `.ts` dans `server/api/` exporte une fonction qui gère la requête (GET, POST, PATCH, DELETE).
- **Vérification des rôles** : chaque endpoint critique appelle `requireUser` ou `requireAdmin` pour sécuriser l’accès.
- **Gestion des erreurs** : les erreurs sont capturées, normalisées et renvoyées au front pour affichage.

---

## 11. FAQ ultra détaillée

- **Comment chaque page vérifie l’authentification ?**
  - Par le composable session côté front, et par vérification du cookie côté back à chaque requête API.
- **Comment sont filtrés les liens du menu ?**
  - Par le layout, qui observe l’état de session et le rôle (`is_admin`).
- **Comment fonctionne la réactivité Vue ?**
  - Les états sont des `Ref` : toute modification de `.value` met à jour l’UI instantanément.
- **Comment sont gérés les rôles ?**
  - Le backend stocke le rôle dans la session, le front adapte l’UI et les permissions selon `user.is_admin`.
- **Comment sont sécurisées les données ?**
  - Cookies HTTP-only, mots de passe hashés, endpoints protégés par vérification du rôle.
- **Comment fonctionne le SSR Nuxt ?**
  - La session est hydratée côté serveur, puis synchronisée côté client pour une expérience fluide.
- **Comment sont gérés les formulaires et les erreurs ?**
  - Les erreurs sont capturées, normalisées et affichées via l’état réactif du composable session.
- **Comment fonctionne la navigation dynamique ?**
  - Les liens sont filtrés selon le rôle, l’UI s’adapte automatiquement.
- **Comment sont mémorisées la langue et le thème ?**
  - Dans le localStorage ou un cookie, géré par Nuxt i18n et color-mode.
- **Comment fonctionne chaque endpoint API ?**
  - Chaque endpoint lit la requête, vérifie la session/le rôle, exécute la requête SQL, renvoie le résultat ou une erreur.
- **Comment fonctionne la gestion des sessions côté serveur ?**
  - Création/suppression de token, stockage en base, cookie HTTP-only, vérification à chaque requête.
- **Comment fonctionne la gestion des permissions ?**
  - Les fonctions utilitaires (`requireUser`, `requireAdmin`) lèvent une erreur si l’utilisateur n’a pas le droit.
- **Comment fonctionne la synchronisation SSR/client ?**
  - Le front attend la session côté serveur, puis la synchronise côté client pour éviter les flashs ou incohérences.

---

Ce README te donne une vision totale, fichier par fichier, syntaxe par syntaxe, du fonctionnement du projet. Si tu veux encore plus de détails sur un fichier précis ou une fonction, demande-le !
