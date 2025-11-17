# MyManhuaList

Ce projet est un site web de gestion de bibliothèque de manhua, réalisé dans le cadre du module Bases du Web à l'ENSIIE.

**Toutes les étapes d'installation et de lancement sont détaillées ci-dessous.**

## Prérequis

- **Node.js** (version 22 ou supérieure recommandée)
- npm (inclus avec Node.js)

## Installation et lancement

1. **Installer Node.js :**

   Télécharger depuis [nodejs.org](https://nodejs.org/) ou utiliser [nvm](https://github.com/nvm-sh/nvm) :

   ```sh
   # Avec nvm (optionnel)
   nvm install 22
   nvm use 22
   ```

2. Installer les dépendances :
   ```sh
   npm install
   ```
3. Copier le fichier d'exemple d'environnement :

   ```sh
   cp .env.example .env
   ```

   Comptes par défaut :

   - Admin : admin / admin123
   - Reader : reader / reader123

4. Lancer le serveur en mode développement :
   ```sh
   npm run dev
   ```
5. Accéder au site :
   Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur.

**La base de données SQLite est créée et remplie automatiquement au premier lancement.**
**Aucun dump SQL ou manipulation manuelle n'est nécessaire.**

## Migration depuis pnpm/better-sqlite3

Si vous aviez une ancienne version du projet avec pnpm et better-sqlite3 :

```sh
# Supprimer les anciens fichiers
rm -rf node_modules pnpm-lock.yaml pnpm-workspace.yaml

# Installer avec npm
npm install

# Relancer le projet
npm run dev
```

**Note :** Le projet a été migré de `better-sqlite3` vers `sqlite3` et de `pnpm` vers `npm` pour résoudre les problèmes de compatibilité.

---

Une version du site web est hébergée sur mon serveur personnel : [https://manhua.thimotebois.ovh](https://manhua.thimotebois.ovh)
Un compte admin est à dispotion :

- Username : corrrection - (3r)
- Password : correction - (2r)

## Rapport

Le rapport détaillé (avec captures d'écran et explications techniques) est disponible dans le fichier `rapport.pdf` à la racine du projet.
