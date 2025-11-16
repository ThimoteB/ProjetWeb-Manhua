# MyManhuaList

Ce projet est un site web de gestion de bibliothèque de manhua, réalisé dans le cadre du module Bases du Web à l'ENSIIE.

**Toutes les étapes d'installation et de lancement sont détaillées ci-dessous.**

## Minimales requises

- **Node.js v22** (requis - incompatibilités connues avec v25 et autres versions)
- pnpm (gestionnaire de paquets)

## Installation et lancement

1. **Installer Node.js v22 :**

   Il est recommandé d'utiliser [nvm](https://github.com/nvm-sh/nvm) pour gérer les versions de Node.js :

   ```sh
   # Installer nvm (si pas déjà installé)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

   # Installer et utiliser Node.js v22
   nvm install 22
   nvm use 22

   # Vérifier la version
   node -v  # Doit afficher v22.x.x
   ```

   Alternative sans nvm : télécharger depuis [nodejs.org](https://nodejs.org/) (version 22.x LTS)

2. Installer [pnpm](https://pnpm.io/) si besoin :
   ```sh
   npm install -g pnpm
   ```
3. Installer les dépendances :
   ```sh
   pnpm install
   ```
4. Copier le fichier d'exemple d'environnement :

   ```sh
   cp .env.example .env
   ```

   (Définir les mots de passe des comptes par défaut si besoin)
   (Par défaut :

   - Admin : admin / admin123
   - Reader : reader / reader123
     )

5. Lancer le serveur en mode développement :
   ```sh
   pnpm run dev
   ```
6. Accéder au site :
   Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur.

**La base de données SQLite est créée et remplie automatiquement au premier lancement.**
**Aucun dump SQL ou manipulation manuelle n'est nécessaire.**

## Problèmes courants

### ⚠️ Erreurs avec Node.js v25 ou autres versions

Ce projet nécessite **Node.js v22** en raison de problèmes de compatibilité avec `better-sqlite3` et d'autres dépendances natives.

**Symptômes :**

- Erreurs lors de `pnpm install`
- Échec de compilation de `better-sqlite3`
- Erreurs `node-gyp`

**Solution :**

```sh
# Vérifier votre version Node.js
node -v

# Si ce n'est pas v22.x.x, installer Node.js v22 avec nvm
nvm install 22
nvm use 22

# Nettoyer et réinstaller
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

Une version du site web est hébergée sur mon serveur personnel : [https://manhua.thimotebois.ovh](https://manhua.thimotebois.ovh)
Un compte admin est à dispotion :

- Username : corrrection - (3r)
- Password : correction - (2r)

## Rapport

Le rapport détaillé (avec captures d'écran et explications techniques) est disponible dans le fichier `rapport.pdf` à la racine du projet.
