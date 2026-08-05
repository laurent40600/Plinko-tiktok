# 👑 ROYAL PLINKO LIVE

Émission TV interactive Royal Plinko pour lives TikTok — le même plateau Plinko (picots,
multiplicateurs, physique) qu'avant, habillé en spectacle complet : cadeaux TikTok -> billes,
Coffre Royal, Jackpot progressif + Roue Royale, boss communautaire, couronnement du gagnant,
réactions vocales, et architecture prête pour une connexion TikTok Live réelle.

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

## 👑 ROYAL PLINKO LIVE — couche "émission TV" (architecture v3, `src/`)

Le plateau, la physique et les buckets (`src/entities/board.js`, `src/systems/physics.js`,
`CONFIG.BOARD` / `CONFIG.BUCKETS`) restent **strictement identiques** à Royal Drop —
aucune valeur de jeu n'a changé. Par-dessus, une couche "émission TV interactive"
traduit les cadeaux TikTok Live en billes et pilote tout le spectacle autour :

| Module | Rôle |
|---|---|
| `src/core/configManager.js` | Charge `/config/*.json` au démarrage dans `CONFIG` |
| `src/systems/tiktokManager.js` | Point d'entrée du flux TikTok Live (+ simulateur de démo) |
| `src/systems/giftManager.js` | Cadeau -> N billes (skin/couleur/priorité selon le cadeau) |
| `src/systems/ballQueueManager.js` | Ne laisse jamais plus de 5 billes visibles à la fois |
| `src/systems/communityManager.js` / `keysManager.js` | Coffre Royal (énergie + clés) |
| `src/systems/jackpotManager.js` | Jackpot progressif, verrouillage, mode cinématique, Roue Royale |
| `src/systems/eventManager.js` | Double Gains, Pluie de Billes, Case Bonus, Billes Dorées, Royal Drop... |
| `src/systems/bossManager.js` / `comboManager.js` | Boss communautaire + jauge de combo |
| `src/systems/effectsManager.js` | Ralenti, caméra cinématique, spotlight, particules |
| `src/systems/voiceManager.js` | Réactions vocales humaines (Web Speech API) |
| `src/ui/showUI.js` | Panneaux dynamiques (80% spectacle / 20% info) |

### Contenu éditorial (`/config/*.json`)

Tout ce qui définit les cadeaux, événements, jackpot, boss, sons et niveaux se modifie
**sans toucher au code** : `gifts.json`, `events.json`, `jackpot.json`, `boss.json`,
`sounds.json`, `animations.json`, `levels.json`.

### Connexion TikTok Live réelle

`src/core/events.js` expose `TikTokBridge.onGift/onLike/onShare/onComment/onFollow(data)`,
câblés à l'`EventBus` interne — c'est le seul point d'entrée dont un vrai backend a besoin :

1. Mettre `CONFIG.TIKTOK.SIMULATOR_ENABLED = false` dans `src/core/config.js` (ou appeler
   `tiktokManager.connect()`, qui coupe le simulateur automatiquement).
2. Depuis le backend qui écoute le live (ex: une librairie tierce côté serveur + WebSocket),
   appeler `TikTokBridge.onGift({ username, avatar, giftId, giftCount })` à chaque cadeau reçu
   (`giftId` doit correspondre à un `id` de `config/gifts.json`).
3. Rien d'autre n'a besoin d'être modifié : `GiftManager`, `CommunityManager`, `KeysManager`,
   `BossManager`, `ComboManager` et le classement écoutent déjà l'`EventBus`.

En attendant un vrai flux, `src/systems/tiktokManager.js` simule des viewers qui envoient des
cadeaux, et `src/systems/bots.js` simule des viewers d'ambiance (eux aussi via de vrais cadeaux
simulés) — le jeu tourne donc seul dès l'ouverture, sans aucun bouton de lancer manuel.

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
