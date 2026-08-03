# 👑 ROYAL DROP

Jeu Plinko premium autonome pour lives TikTok — thème Royal, jackpots animés, classement en temps réel, joueurs virtuels (IA), et architecture prête pour une future connexion TikTok Live.

Fonctionne 100% hors ligne, installable en PWA sur iPhone, iPad, Android et PC.

---

## 📁 Structure du projet

```
royal-drop/
├── index.html          → Point d'entrée, canvas + UI overlay
├── style.css            → Styles globaux, HUD, responsive scale
├── manifest.json         → Config PWA
├── sw.js                  → Service worker (cache offline)
├── README.md               → Ce fichier
│
├── /assets
│   ├── /skins             → Skins de billes
│   └── /icons             → Icônes PWA
│
└── /js
    ├── config.js           → Toutes les valeurs modifiables
    ├── engine.js            → Boucle principale (game loop)
    ├── physics.js            → Simulation Euler + anti-blocage
    ├── renderer.js            → Dessin Canvas 2D
    ├── camera.js               → Zoom/suivi de bille
    ├── audio.js                 → Sons Web Audio API
    ├── particles.js              → Particules + textes flottants (pool)
    ├── board.js                   → Génération plateau + buckets
    ├── ball.js                     → Pool de billes recyclables
    ├── players.js                   → Joueurs réels, historique
    ├── leaderboard.js                → Classement "Top Gift"
    ├── events.js                      → EventBus + hooks TikTok
    ├── ui.js                           → HUD, debug, panneaux
    ├── storage.js                       → Sauvegarde localStorage
    ├── bots.js                           → IA joueurs virtuels
    └── game.js                            → Point d'entrée, init globale
```

---

## 🚀 Installation

### Sur PC
1. Ouvrir le dossier `royal-drop/` dans VS Code.
2. Lancer un serveur local (ex: extension "Live Server", ou `npx serve`).
3. Ouvrir l'URL locale dans Chrome/Edge/Firefox.

> ⚠️ Ouvrir `index.html` directement en `file://` fonctionne pour tester visuellement, mais le Service Worker (PWA/offline) nécessite un vrai serveur (local ou distant, en HTTPS ou localhost).

### Sur iPhone (via VS Code / Claude Code mobile)
1. Héberger le dossier sur Netlify, Vercel, ou tout hébergement statique HTTPS.
2. Ouvrir l'URL dans Safari.
3. Bouton Partager → **Sur l'écran d'accueil**.
4. L'app s'installe comme une app native, en plein écran, fonctionnelle hors ligne.

### Sur Android
1. Héberger sur HTTPS (Netlify/Vercel).
2. Ouvrir dans Chrome.
3. Menu → **Ajouter à l'écran d'accueil** / bannière d'installation automatique.

---

## 🛠️ Modifier le jeu

### Changer une valeur de jeu (gravité, prix, multiplicateurs...)
Tout se passe dans **`js/config.js`**. Aucune valeur importante n'est écrite ailleurs. Exemple :

```javascript
BUCKETS: {
    VALUES: [0.2, 1, 5, 5, 20, 5, 5, 1, 0.2], // modifier ici
}
```

### Ajouter un thème
1. Dans `config.js`, sous `THEMES.LIST`, chaque thème existe déjà (`royal`, `cyberpunk`, `egypte`, `pirate`) avec ses couleurs de base.
2. Pour l'activer visuellement, dessiner ses éléments graphiques propres dans `renderer.js` (actuellement seul `royal` est illustré).
3. Changer `CONFIG.THEMES.CURRENT = 'cyberpunk'` pour tester.

### Ajouter un skin de bille
1. Ajouter l'asset dans `/assets/skins/`.
2. Référencer le skin dans `ball.js` (`spawn(options)` accepte déjà un paramètre `skin`).
3. Ajouter l'option dans l'UI (`ui.js`) pour le rendre sélectionnable.

### Ajouter un son
Tous les sons sont **générés en code** via `audio.js` (Web Audio API, aucun fichier audio). Pour ajouter un nouveau son :
```javascript
AudioEngine.playTone(frequence, duree, type, volume);
```
Créer une nouvelle méthode dédiée dans `audio.js` en suivant le modèle de `playBucketWin()` ou `playJackpot()`.

---

## 🔌 Connexion TikTok Live (future)

L'architecture est **déjà prête** pour recevoir des événements TikTok Live sans refonte :

- `js/events.js` contient `TikTokAPI.onGift()`, `onLike()`, `onShare()`, `onComment()`, `spawnBall()`.
- Ces fonctions sont actuellement vides mais câblées à l'`EventBus` interne.
- Pour connecter une vraie source TikTok Live (ex: via une librairie tierce ou un backend qui écoute le live) :
  1. Créer un nouveau fichier `js/tiktok-bridge.js`.
  2. Appeler `TikTokAPI.onGift(data)`, `TikTokAPI.spawnBall(data)`, etc. depuis ce fichier à chaque événement reçu.
  3. Aucune autre partie du jeu n'a besoin d'être modifiée : `players.js`, `leaderboard.js` et `bots.js` écoutent déjà l'`EventBus`.

---

## 🐞 Mode Debug

Appuyer sur la touche **D** pour afficher/masquer le menu debug :
- FPS en temps réel
- Nombre de billes actives
- Gravité actuelle
- Collisions par frame
- Temps de calcul physique
- Cases à cocher : hitbox, vecteurs de vélocité, trajectoires

La préférence (activé/désactivé) est sauvegardée automatiquement.

---

## 🧪 Diagnostics & Tests

Depuis la console du navigateur (PC ou Safari distant sur iPhone) :

```javascript
runDiagnostics()
```

Vérifie : canvas, audio, stockage, FPS, service worker, compatibilité tactile, et lance `Physics.runPhysicsTest(300)` (300 lancers simulés) pour valider la stabilité physique — retourne temps moyen, collisions totales, blocages détectés, distribution des buckets.

Pour un test physique isolé avec un nombre de lancers personnalisé :
```javascript
Physics.runPhysicsTest(1000)
```

---

## 💾 Sauvegarde

Gérée entièrement par `js/storage.js` via `localStorage` :
- `Storage.saveGame(state)` — sauvegarde manuelle
- `Storage.loadGame()` — chargement (avec fusion défensive si structure ancienne)
- `Storage.resetSave()` — réinitialisation complète

Sauvegarde automatique toutes les **15 secondes** (configurable dans `config.js` → `STORAGE.AUTOSAVE_INTERVAL`), et à chaque mise en arrière-plan de l'app.

---

## 🌐 Déploiement

Compatible avec **Netlify** et **Vercel** (déploiement statique direct, aucun build nécessaire) :

1. Glisser-déposer le dossier `royal-drop/` sur Netlify, ou connecter le repo Git.
2. Aucune configuration de build requise (fichiers statiques purs).
3. Vérifier que `manifest.json` et `sw.js` sont bien servis à la racine du domaine.

---

## ⚙️ Compatibilité testée

| Plateforme | Navigateur | Statut |
|---|---|---|
| PC / Mac | Chrome, Edge, Firefox | ✅ |
| iPhone / iPad | Safari | ✅ |
| Android | Chrome | ✅ |

---

## 📌 Notes de version

**v2.0.0** — Architecture professionnelle complète, PWA, sauvegarde, debug, IA, EventBus TikTok-ready.
