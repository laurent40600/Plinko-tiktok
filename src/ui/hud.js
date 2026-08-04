/* ============================================================
   ROYAL DROP — ui/hud.js
   ------------------------------------------------------------
   Toute l'interface HTML superposée au canvas : panneaux (Top
   Gift, Derniers Lancers), menu debug (touche D). Il n'y a plus
   de bouton de lancer manuel : les billes sont déclenchées par
   les cadeaux des spectateurs (TikTokBridge) et par les bots
   (voir systems/bots.js) — ce module ne fait que refléter l'état
   du jeu, il ne déclenche plus jamais de lancer lui-même.
   ============================================================ */

import { CONFIG } from '../core/config.js';

export class HUD {
    debugEnabled = false;
    debugFlags = { hitbox: false, vectors: false, trajectory: false };

    /**
     * @param {object} deps
     * @param {import('../core/events.js').eventBus} deps.eventBus
     * @param {import('../systems/audio.js').AudioEngine} deps.audio
     * @param {boolean} deps.debugEnabled - restauré depuis la sauvegarde
     * @param {(enabled: boolean) => void} deps.onDebugToggle
     */
    constructor({ eventBus, audio, debugEnabled = false, onDebugToggle = () => {} }) {
        this.eventBus = eventBus;
        this.audio = audio;
        this.debugEnabled = debugEnabled;
        this.onDebugToggle = onDebugToggle;

        this._cacheElements();
        this._bindUIEvents();
        this._bindGameEvents();

        this.els.debugPanel?.classList.toggle('hidden', !this.debugEnabled);
    }

    _cacheElements() {
        this.els = {
            topGiftList: document.getElementById('topgift-list'),
            lastDropsList: document.getElementById('lastdrops-list'),
            closeBtn: document.getElementById('close-btn'),
            followBtn: document.getElementById('follow-btn'),

            debugPanel: document.getElementById('ui-debug'),
            dbgFps: document.getElementById('dbg-fps'),
            dbgBalls: document.getElementById('dbg-balls'),
            dbgGravity: document.getElementById('dbg-gravity'),
            dbgCollisions: document.getElementById('dbg-collisions'),
            dbgPhysTime: document.getElementById('dbg-phystime'),
            dbgHitbox: document.getElementById('dbg-hitbox'),
            dbgVectors: document.getElementById('dbg-vectors'),
            dbgTrajectory: document.getElementById('dbg-trajectory')
        };
    }

    _bindUIEvents() {
        this.els.closeBtn?.addEventListener('click', () => this._onCloseClick());
        this.els.followBtn?.addEventListener('click', () => this.audio.playUIClick());

        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === CONFIG.DEBUG.TOGGLE_KEY) {
                this.toggleDebug();
            }
        });

        this.els.dbgHitbox?.addEventListener('change', (e) => { this.debugFlags.hitbox = e.target.checked; });
        this.els.dbgVectors?.addEventListener('change', (e) => { this.debugFlags.vectors = e.target.checked; });
        this.els.dbgTrajectory?.addEventListener('change', (e) => { this.debugFlags.trajectory = e.target.checked; });
    }

    _bindGameEvents() {
        this.eventBus.on('leaderboard:updated', (entries) => this.renderTopGift(entries));
        this.eventBus.on('players:dropRegistered', (drops) => this.renderRecentDrops(drops));
    }

    _onCloseClick() {
        this.audio.playUIClick();
        console.log('[UI] Bouton fermeture cliqué (comportement à définir selon le contexte d\'intégration finale).');
    }

    renderTopGift(entries) {
        const list = this.els.topGiftList;
        if (!list) return;
        list.innerHTML = '';

        entries.forEach((entry, i) => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${i + 1}. ${entry.name}</span><span>💎 ${entry.totalValue}</span>`;
            list.appendChild(li);
        });
    }

    renderRecentDrops(drops) {
        const list = this.els.lastDropsList;
        if (!list) return;
        list.innerHTML = '';

        drops.forEach((drop) => {
            const secondsAgo = Math.max(0, Math.round((Date.now() - drop.timestamp) / 1000));
            const li = document.createElement('li');
            li.innerHTML = `<span>${drop.playerName}<br><small>${secondsAgo}s</small></span><span style="color:${drop.isJackpot ? '#ffd76a' : '#fff'}">${drop.amount}</span>`;
            list.appendChild(li);
        });
    }

    toggleDebug() {
        this.debugEnabled = !this.debugEnabled;
        this.els.debugPanel?.classList.toggle('hidden', !this.debugEnabled);
        this.onDebugToggle(this.debugEnabled);
    }

    /** @param {object} stats - { fps, ballCount, collisions, physTime } — appelé chaque frame si debug actif. */
    updateDebugPanel(stats) {
        if (!this.debugEnabled) return;
        if (this.els.dbgFps) this.els.dbgFps.textContent = stats.fps;
        if (this.els.dbgBalls) this.els.dbgBalls.textContent = stats.ballCount;
        if (this.els.dbgGravity) this.els.dbgGravity.textContent = CONFIG.PHYSICS.GRAVITY;
        if (this.els.dbgCollisions) this.els.dbgCollisions.textContent = stats.collisions;
        if (this.els.dbgPhysTime) this.els.dbgPhysTime.textContent = stats.physTime.toFixed(2);
    }
}
