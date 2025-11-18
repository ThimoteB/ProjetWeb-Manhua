# Rapport de projet – MyManhuaList

## 1. Technologies utilisées

- **Frontend** : Vue.js 3, Nuxt.js, Tailwind CSS
- **Backend** : Node.js avec Nuxt.js (API routes)
- **Base de données** : BetterSqlite3 (SQLite), 3 tables : users, works, library_entries
- **Authentification** : Sessions avec cookies sécurisés

> **Justification du dépassement du nombre de fichiers backend** :
> Nuxt.js impose une structure où chaque route API correspond à un fichier distinct (notamment pour la gestion des paramètres dynamiques). Il n’est donc pas possible de regrouper toutes les routes dans moins de 10 fichiers dans mon cas avec juste 3 tables (works, users, library_entries).

## 2. Manuel d’utilisation du site

- **Accueil** : Page d'accueil du site avec une vue d'ensemble, des statistiques, les dernières oeuvres ajoutées, la posibilité de se connecter ou s'inscrire et d'accéder rapidement au catalogue et à notre bibliothèque.
- **Catalogue** : Sur cette page, on peut parcourir la liste des manhuas disponibles, effectuer des recherches, appliquer des filtres par statut (en cours, terminé, en pause), et ajouter ou retirer des oeuvres de sa bibliothèque personnelle si l'on est connecté mais aussi rajouter des oeuvres pour tous les autres utilisateurs si elles ne sont pas encore présentes.
- **Bibliothèque** : Page ou l'on peut gérer les oeuvres que l'on suit, modifier ou supprimer des entrées, ajouter des notes et des avis.
- **Admin** : Page d'administration permettant aux admins de créer des nouveaux utilisateurs, et ce consulter les comptes effectuer
- **Fonctionnalités spéciales** :
  - Changement de langue (français/anglais) et de thème (jour/nuit) sans rechargement de page.
  - Interface responsive adaptée à tous les écrans.
  - Sécurité basique (sessions, rôles).

### Manipulation

- S'authentifier ou s'inscrire via la page d'accueil.
- Naviguer via le menu principal.
- Changer de langue ou de thème via les boutons en haut à droite.
- Ajouter/retirer des oeuvres à sa bibliothèque depuis le catalogue.
- Depuis sa collection, modifier une entrée (note, avis, statut).
- Accéder à la gestion admin si connecté en tant qu’admin.

## 3. Détails techniques et difficultés rencontrées

- **Gestion des sessions** :
  - Utilisation de cookies pour stocker le token de session.
  - Vérification automatique de l’authentification sur chaque route sensible.
- **Structure des routes API** :
  - Obligation de séparer chaque endpoint dans un fichier distinct à cause de Nuxt/Nitro.
- **Difficulté rencontrée** :
  - La gestion des classes Tailwind CSS ont été un vrai enfer, j'ai passé pas mal de temps à galérer pour obtenir un rendu correct et cohérent sur toutes les pages.

## 4. Captures d’écran

Pour éviter d'avoir trop d'images, j'ai fait pour chaque fenêtre deux captures : une en français avec thème jour, une en anglais avec thème nuit.

> - Accueil (français/anglais, jour/nuit)

![Accueil - Français - Jour](img/home_j_fr.png) ![Accueil - Anglais - Nuit](img/home_n_en.png)

> - Catalogue (français/anglais, jour/nuit)

![Catalogue - Français - Jour](img/work_j_fr.png) ![Catalogue - Anglais - Nuit](img/work_n_en.png)

> - Bibliothèque (français/anglais, jour/nuit)

![Bibliothèque - Français - Jour](img/library_j_fr.png) ![Bibliothèque - Anglais - Nuit](img/library_n_en.png)

> - Admin (français/anglais, jour/nuit)

## ![Admin - Français - Jour](img/admin_j_fr.png) ![Admin - Anglais - Nuit](img/admin_n_en.png)

_Rapport rédigé par Thimoté Bois – thimote.bois@ensiie.eu_
