# MyManhuaList

Ce projet est un site web de gestion de bibliothèque de manhua, réalisé dans le cadre du module Bases du Web à l'ENSIIE.

**Toutes les étapes d'installation et de lancement sont détaillées ci-dessous.**

## Minimales requises

- Node.js v18 ou supérieure

## Installation et lancement

1. Installer [pnpm](https://pnpm.io/) si besoin :
   ```sh
   npm install -g pnpm
   ```
2. Installer les dépendances :
   ```sh
   pnpm install
   ```
3. Copier le fichier d'exemple d'environnement :

   ```sh
   cp .env.example .env
   ```

   (Définir les mots de passe des comptes par défaut si besoin)
   (Par défaut :

   - Admin : admin / admin123
   - Reader : reader / reader123
     )

4. Lancer le serveur en mode développement :
   ```sh
   pnpm run dev
   ```
5. Accéder au site :
   Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur.

**La base de données SQLite est créée et remplie automatiquement au premier lancement.**
**Aucun dump SQL ou manipulation manuelle n'est nécessaire.**

---

Une version du site web est hébergée sur mon serveur personnel : [https://manhua.thimotebois.ovh](https://manhua.thimotebois.ovh)
Un compte admin est à dispotion :

- Username : correction
- Password : correction

## Rapport

Le rapport détaillé (avec captures d'écran et explications techniques) est disponible dans le fichier `rapport.pdf` à la racine du projet.
