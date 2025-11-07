# MyManhuaList

Ce projet est un site web de gestion de bibliothèque de manhua, réalisé dans le cadre du module Bases du Web à l'ENSIIE.

## Fonctionnalités principales

- Catalogue de manhuas consultable et filtrable
- Ajout et gestion d'une bibliothèque personnelle
- Authentification (inscription, connexion, déconnexion)
- Interface administrateur pour la gestion des utilisateurs
- Traduction dynamique français/anglais
- Mode jour/nuit dynamique
- Statistiques sur les manhuas, utilisateurs, entrées

## Pages principales

- **Accueil** : stats, accès rapide au catalogue et à la bibliothèque, login/register
- **Catalogue** : liste des œuvres, recherche, filtres, ajout/retrait dans la bibliothèque
- **Bibliothèque** : gestion des œuvres suivies, édition/suppression
- **Admin** : création et gestion des utilisateurs (réservé aux admins)

## Fonctionnalités spéciales

- Changement de langue et de thème sans rechargement
- Affichage responsive et moderne
- Sécurité basique (sessions, rôles)

## Installation rapide

1. **Installer [pnpm](https://pnpm.io/)** (si ce n'est pas déjà fait) :
   ```sh
   npm install -g pnpm
   ```
2. **Installer les dépendances** :
   ```sh
   pnpm install
   ```
3. **Copier le fichier d'exemple d'environnement** :
   ```sh
   cp .env.example .env
   ```
   (définiser les 2 mots de passe des comptes par défaut)
4. **Lancer le serveur en mode développement** :
   ```sh
   pnpm run dev
   ```
5. **Accéder au site** :
   Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## Structure minimale

- Le projet fonctionne sans configuration complexe ni installation lourde.
- La base SQLite est créée automatiquement au premier lancement.
- Les images sont incluses dans le dossier `public/`.

## Fichier de base de données

- La création et le remplissage initial de la base sont gérés automatiquement.
- Aucun dump SQL manuel n'est nécessaire.

---

## Contrainte techniques et Technologies utilisées

- **Frontend** : Vue.js 3, Nuxt.js, Tailwind CSS
- **Backend** : Node.js avec Nuxt.js (API routes)
- **Base de données** : BetterSqlite3
- **Authentification** : Sessions avec cookies sécurisés

Je n'ai pas pu respecté la concrainte de 10 fichiers backends maximum à cause du fonctionnement des API routes de Nuxt.js. En faite la structure de l'api passe par la strucutre du dossier `pages/api/` et chaque route doit être dans un fichier séparé selon le fait qu'on utilise des paramètres dynamiques ou non.

## Utilisation de l'IA

Je me suis appuyé sur de l'IA pour la génération de certains commentaires et principalement au niveau des classes Tailwind CSS qui sont un vrai enfer à gérer.
Ça m'a aussi permis de réfactor certaines fonctions qui ont été modifié en cours de projet et qui étaient vraiment devenue brouillon.

## Conclusion

Ce projet a été l'occasion pour moi de vraiment mettre en application un projet fullstack entièrement seul, de la conception du backend à l'interface utilisateur, en passant par la gestion de la base de données et la sécurité. J'ai pu approfondir mes compétences en Vue.js, Nuxt.js, Tailwind CSS tout en respectant les bonnes pratiques de développement web.
Je sais que certains points auraient encore pu être améliorés, mais je suis satisfait du résultat que j'ai réussi à obtenir en y passant quelques weekends de mon temps libre.

## Contact

Pour toute question ou problème, contactez : thimote.bois@ensiie.eu
