# MyMír - Migration vers React

## 📦 Structure du Projet

```
MYMIR/
├── src/                      # Code source React
│   ├── components/          # Composants réutilisables
│   │   └── ProtectedRoute.jsx
│   ├── pages/               # Pages de l'application
│   │   ├── Home.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── ForgotPassword.jsx
│   │   ├── Dashboard.jsx
│   │   └── Admin.jsx
│   ├── services/            # Services API
│   │   └── api.js
│   ├── context/             # Contextes React
│   │   └── AuthContext.js
│   ├── styles/              # Fichiers CSS
│   │   ├── index.css
│   │   ├── Home.css
│   │   ├── Login.css
│   │   ├── Register.css
│   │   ├── Dashboard.css
│   │   └── Admin.css
│   ├── App.js               # Composant principal avec routes
│   └── index.js             # Point d'entrée
│
├── public/                   # Fichiers publics (assets, images, etc.)
│   ├── assets/
│   ├── css/                 # Anciens CSS (HTML vanilla)
│   ├── js/                  # Anciens JS (HTML vanilla)
│   └── index-react.html     # Template HTML pour React
│
├── backend/                  # Code backend (inchangé)
│   ├── routes/
│   ├── ai/
│   └── pdf/
│
├── build/                    # Fichiers buildés (généré par webpack)
├── server.js                 # Serveur Express
├── webpack.config.js         # Configuration Webpack
├── package.json
└── .env                      # Variables d'environnement

```

## 🚀 Installation et Démarrage

### 1. Installation des dépendances

```bash
npm install
```

### 2. Configuration de l'environnement

Copier `.env.example` vers `.env` et configurer les variables :

```bash
cp .env.example .env
```

Éditer `.env` avec vos valeurs :
- `DATABASE_URL` : URL de votre base PostgreSQL
- `JWT_SECRET` : Clé secrète pour JWT
- `OPENAI_API_KEY` : Clé API OpenAI
- `REACT_APP_API_URL` : URL de l'API (local ou production)

### 3. Modes de développement

#### A. Mode développement fullstack (recommandé)

Lance simultanément le serveur backend et le serveur de développement React :

```bash
npm run dev:fullstack
```

- Backend : http://localhost:3000
- Frontend React : http://localhost:3000 (webpack dev server avec hot reload)

#### B. Mode backend seul

Lance uniquement le serveur Express avec les anciens fichiers HTML :

```bash
npm run dev
```

#### C. Mode frontend seul

Lance uniquement le serveur de développement React :

```bash
npm run client
```

### 4. Build pour production

Créer le build optimisé de l'application React :

```bash
npm run build
```

Les fichiers optimisés seront générés dans le dossier `build/`.

### 5. Lancer en production

```bash
NODE_ENV=production npm start
```

Le serveur servira automatiquement les fichiers du dossier `build/`.

## 🔑 Fonctionnalités React Implémentées

### Pages

- ✅ **Home** (`/`) : Page d'accueil
- ✅ **Login** (`/login`) : Connexion
- ✅ **Register** (`/register`) : Inscription
- ✅ **Forgot Password** (`/forgot`) : Récupération mot de passe
- ✅ **Dashboard** (`/app`) : Tableau de bord principal (protégé)
- ✅ **Admin** (`/admin`) : Panel administrateur (protégé)

### Services

- ✅ **API Service** : Gestion centralisée des appels API avec Axios
  - Intercepteurs pour ajouter le token JWT
  - Gestion automatique des erreurs 401 (redirection login)
  - Configuration de l'URL de base via variable d'environnement

### Contexte d'authentification

- ✅ **AuthContext** : Gestion globale de l'authentification
  - État utilisateur
  - Fonctions login/register/logout
  - Persistance du token dans localStorage
  - Protection des routes

### Composants

- ✅ **ProtectedRoute** : Composant HOC pour protéger les routes authentifiées

## 📝 Scripts npm disponibles

| Script | Description |
|--------|-------------|
| `npm start` | Lance le serveur backend (production ou développement) |
| `npm run dev` | Lance le serveur backend avec nodemon (rechargement auto) |
| `npm run client` | Lance le serveur de développement React (webpack-dev-server) |
| `npm run dev:fullstack` | Lance backend + frontend en parallèle |
| `npm run build` | Crée le build de production React |
| `npm run dbcheck` | Vérifie la connexion à la base de données |

## 🔄 Différences entre HTML et React

### Avant (HTML Vanilla)

- Fichiers HTML séparés (index.html, login.html, etc.)
- Navigation par rechargement de page
- JavaScript vanilla dans le dossier `public/js/`
- CSS dans le dossier `public/css/`

### Après (React)

- Application monopage (SPA)
- Navigation côté client avec React Router
- Composants React modulaires
- Gestion d'état avec Context API
- Hot Module Replacement en développement
- Build optimisé pour production

## 🌐 Déploiement

### Sur Render.com

1. Connecter le repository GitHub
2. Configurer les variables d'environnement :
   - `NODE_ENV=production`
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `OPENAI_API_KEY`
3. Build command : `npm run build`
4. Start command : `npm start`

Le serveur détectera automatiquement le mode production et servira les fichiers du dossier `build/`.

## 🐛 Dépannage

### Le serveur ne sert pas l'application React

Vérifier que :
1. `npm run build` a été exécuté
2. Le dossier `build/` existe
3. `NODE_ENV=production` est défini
4. Le fichier `build/index.html` existe

### Erreurs CORS en développement

En mode développement fullstack, le frontend React (port 3000 webpack) communique avec le backend (port différent).

Solution : Le serveur backend est déjà configuré avec CORS. Vérifier l'URL dans `src/services/api.js`.

### Les routes React retournent 404

Le serveur Express a une route fallback qui gère toutes les routes non-API. Si cela ne fonctionne pas :
1. Vérifier que le serveur sert bien le bon répertoire (`build/` en production)
2. Vérifier que le fichier `index.html` existe

## 📚 Technologies utilisées

- **React 19** : Bibliothèque UI
- **React Router 7** : Routing côté client
- **Axios** : Client HTTP
- **Webpack 5** : Bundler et build
- **Babel** : Transpilation JSX/ES6+
- **Express** : Serveur backend
- **PostgreSQL** : Base de données
- **JWT** : Authentification

## ✨ Prochaines étapes

- [ ] Ajouter des tests unitaires (Jest + React Testing Library)
- [ ] Implémenter le TypeScript
- [ ] Ajouter un state management plus robuste (Redux ou Zustand)
- [ ] Optimiser les performances (lazy loading, code splitting)
- [ ] Ajouter PWA support
- [ ] Implémenter les fonctionnalités de récupération de mot de passe
- [ ] Compléter la page Admin avec gestion des utilisateurs

## 🤝 Support

Pour toute question ou problème, créer une issue sur le repository GitHub.
