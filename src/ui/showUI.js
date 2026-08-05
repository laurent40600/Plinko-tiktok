/* ============================================================
   ROYAL DROP — ui/showUI.js
   ------------------------------------------------------------
   Habillage "émission TV" : panneaux compacts toujours visibles
   (Coffre Royal, Jackpot Progressif) et panneaux/scènes 100%
   dynamiques qui n'apparaissent que le temps d'un moment fort
   (bannière viewer, événement spécial, boss, combo, Roue Royale,
   Couronnement). Règle 80% spectacle / 20% info : rien ne reste
   affiché plus longtemps que nécessaire.
   ============================================================ */

import { CONFIG } from '../core/config.js';

const GIFT_ICONS = { rose: '🌹', fingerHeart: '🫰', garland: '👑', galaxy: '🌌', lion: '🦁' };

export class ShowUI {
    /** @param {object} deps @param {import('../core/events.js').eventBus} deps.eventBus */
    constructor({ eventBus }) {
        this.eventBus = eventBus;
        this._cacheElements();
        this._bindEvents();
        this._wheelSpinning = false;
    }

    _cacheElements() {
        this.els = {
            root: document.getElementById('game-root'),
            flash: document.getElementById('ui-screen-flash'),

            viewerBanner: document.getElementById('ui-viewer-banner'),
            viewerBannerText: document.getElementById('viewer-banner-text'),

            chestPanel: document.getElementById('ui-chest'),
            chestIcon: document.getElementById('chest-icon'),
            chestFill: document.getElementById('chest-fill'),
            chestValue: document.getElementById('chest-value'),
            chestStage: document.getElementById('chest-stage'),
            keysValue: document.getElementById('keys-value'),

            jackpotPanel: document.getElementById('ui-jackpot'),
            jackpotValue: document.getElementById('jackpot-value'),
            jackpotMultiplier: document.getElementById('jackpot-multiplier'),
            jackpotLock: document.getElementById('jackpot-lock'),

            eventPanel: document.getElementById('ui-event'),
            eventIconLabel: document.getElementById('event-icon-label'),
            eventDescription: document.getElementById('event-description'),

            bossPanel: document.getElementById('ui-boss'),
            bossFill: document.getElementById('boss-fill'),
            bossHp: document.getElementById('boss-hp'),

            combo: document.getElementById('ui-combo'),
            comboCount: document.getElementById('combo-count'),

            queuePanel: document.getElementById('ui-queue'),
            queueList: document.getElementById('queue-list'),
            queueMore: document.getElementById('queue-more'),
            queueMoreText: document.getElementById('queue-more-text'),

            wheelScene: document.getElementById('ui-wheel-scene'),
            wheelDial: document.getElementById('wheel-dial'),
            wheelResultLabel: document.getElementById('wheel-result-label'),

            coronationScene: document.getElementById('ui-coronation-scene'),
            coronationName: document.getElementById('coronation-name'),
            coronationAmount: document.getElementById('coronation-amount')
        };
    }

    _bindEvents() {
        const bus = this.eventBus;

        bus.on('gift:processed', (data) => this._onGift(data));
        bus.on('ball:landed', (data) => this._onBallLanded(data));

        bus.on('community:updated', (data) => this._onCommunityUpdated(data));
        bus.on('community:stageChanged', () => this._pulse(this.els.chestPanel));
        bus.on('community:chestOpen', () => { this._pulse(this.els.chestPanel); this._flash(); this._shake(); });
        bus.on('keys:updated', (data) => this._onKeysUpdated(data));

        bus.on('jackpot:poolUpdated', (data) => this._onJackpotUpdated(data));
        bus.on('jackpot:unlocked', () => this._pulse(this.els.jackpotPanel));

        bus.on('event:triggered', (cfg) => this._showEvent(`${cfg.icon || '⭐'} ${cfg.label}`, cfg.description, cfg.durationSec));
        bus.on('event:specialMoment', (cfg) => this._showEvent(`✨ ${cfg.label}`, cfg.description, cfg.durationSec));

        bus.on('boss:spawned', (data) => this._onBossSpawned(data));
        bus.on('boss:damaged', (data) => this._onBossDamaged(data));
        bus.on('boss:defeated', () => this._onBossDefeated());

        bus.on('combo:updated', (data) => this._onComboUpdated(data));

        bus.on('queue:updated', (data) => this._onQueueUpdated(data));

        bus.on('jackpot:wheelStart', (data) => this._startWheel(data));
        bus.on('jackpot:wheelResult', (data) => this._resolveWheel(data));

        bus.on('jackpot:coronation', (data) => this._showCoronation(data));
    }

    /* ---------------- Bannière viewer ---------------- */

    _onGift({ username, gift, totalBalls }) {
        const icon = GIFT_ICONS[gift.ballType] || gift.icon || '👑';
        const text = totalBalls > 1
            ? `${icon} @${username} invoque ${totalBalls} billes ${gift.name} !`
            : `${icon} @${username} invoque une bille ${gift.name} !`;
        this._showBanner(text);
    }

    /** Réservé aux gains marquants (jackpot / gros multiplicateur) pour ne pas spammer la bannière. */
    _onBallLanded({ ball, winAmount, multiplier, isJackpot, bonusApplied }) {
        if (!ball.playerName) return;
        if (!isJackpot && multiplier < 3 && !bonusApplied) return;
        const label = isJackpot ? `🎉 @${ball.playerName} touche le JACKPOT !` : `🎉 @${ball.playerName} gagne x${multiplier} !`;
        this._showBanner(label);
    }

    _showBanner(text) {
        this.els.viewerBannerText.textContent = text;
        this._show(this.els.viewerBanner, CONFIG.SHOW_ANIMATIONS?.banner?.holdMs || 3200);
    }

    /* ---------------- Coffre Royal / Clés ---------------- */

    _onCommunityUpdated({ energy, goal, percent, stageId, chestOpen }) {
        this.els.chestFill.style.width = `${percent}%`;
        this.els.chestValue.textContent = `${energy} / ${goal}`;
        this.els.chestStage.textContent = chestOpen ? 'Ouvert !' : this._stageLabel(stageId);

        const iconStage = chestOpen ? 'open' : (stageId || 'locked');
        this.els.chestIcon.setAttribute('class', `chest-icon stage-${iconStage}`);
    }

    _stageLabel(stageId) {
        const stage = (CONFIG.LEVELS?.community?.stages || []).find(s => s.id === stageId);
        return stage?.label || 'Verrouillé';
    }

    _onKeysUpdated({ keys, goal }) {
        this.els.keysValue.textContent = `${keys} / ${goal}`;
    }

    /* ---------------- Jackpot progressif ---------------- */

    _onJackpotUpdated({ pool, displayMultiplier, locked }) {
        this.els.jackpotValue.textContent = pool.toLocaleString('fr-FR');
        this.els.jackpotMultiplier.textContent = `x${displayMultiplier}`;
        this.els.jackpotLock.textContent = locked ? '🔒 Verrouillé' : '🔓 Déverrouillé !';
    }

    /* ---------------- Événements spéciaux ---------------- */

    _showEvent(labelText, description, durationSec) {
        this.els.eventIconLabel.textContent = labelText;
        this.els.eventDescription.textContent = description || '';
        const holdMs = durationSec > 0 ? durationSec * 1000 : (CONFIG.SHOW_ANIMATIONS?.panelPulse?.holdMs || 4500);
        this._show(this.els.eventPanel, holdMs);
    }

    /* ---------------- Boss ---------------- */

    _onBossSpawned({ maxHp }) {
        this.els.bossHp.textContent = `${maxHp} / ${maxHp}`;
        this.els.bossFill.style.width = '100%';
        this.els.bossPanel.classList.add('visible');
    }

    _onBossDamaged({ hp, maxHp, percent }) {
        this.els.bossHp.textContent = `${Math.round(hp)} / ${maxHp}`;
        this.els.bossFill.style.width = `${Math.max(0, percent)}%`;
    }

    _onBossDefeated() {
        this.els.bossHp.textContent = 'VAINCU !';
        setTimeout(() => this.els.bossPanel.classList.remove('visible'), 1800);
    }

    /* ---------------- Combo ---------------- */

    _onComboUpdated({ count }) {
        if (count < 2) {
            this.els.combo.classList.remove('visible');
            return;
        }
        this.els.comboCount.textContent = `x${count}`;
        this._show(this.els.combo, CONFIG.SHOW_ANIMATIONS?.combo?.holdMs || 1400);
    }

    /* ---------------- Prochains joueurs (file d'attente) ---------------- */

    _onQueueUpdated({ pending, totalPending }) {
        if (!totalPending) {
            this.els.queuePanel.classList.remove('visible');
            return;
        }

        this.els.queueList.innerHTML = pending.map((p) => {
            const icon = p.symbol || GIFT_ICONS[p.ballType] || '👑';
            return `<li><span class="queue-symbol">${icon}</span><span class="queue-name">@${p.playerName}</span></li>`;
        }).join('');

        const remaining = totalPending - pending.length;
        if (remaining > 0) {
            this.els.queueMoreText.textContent = `+ ${remaining} en attente...`;
            this.els.queueMore.classList.remove('hidden');
        } else {
            this.els.queueMore.classList.add('hidden');
        }

        this.els.queuePanel.classList.add('visible');
    }

    /* ---------------- Roue Royale ---------------- */

    _startWheel({ segments, spinDurationMs, spinTurns, chosenId }) {
        this._wheelSpinning = true;
        this.els.wheelResultLabel.textContent = '';
        this.els.wheelScene.classList.add('visible');
        this.els.wheelScene.classList.remove('hidden');

        // Animation pilotée en JS (pas une transition CSS) : une vraie roue de
        // jeu part vite puis ralentit longuement et progressivement jusqu'à
        // l'arrêt, sans jamais dépasser sa cible ni revenir en arrière.
        if (this._wheelAnimFrame) cancelAnimationFrame(this._wheelAnimFrame);
        this.els.wheelDial.style.transition = 'none';
        this.els.wheelDial.style.transform = 'rotate(0deg)';

        const index = Math.max(0, segments.indexOf(chosenId));
        const sliceDeg = 360 / segments.length;
        // Petit aléa dans le segment gagnant (jamais assez pour chevaucher un
        // voisin) : la roue s'arrête à un point légèrement différent à chaque
        // fois, pas toujours pile au centre — plus crédible qu'une vraie roue.
        const jitter = (Math.random() - 0.5) * sliceDeg * 0.5;
        const turns = spinTurns || 8;
        const targetDeg = 360 * turns + index * sliceDeg + sliceDeg / 2 + jitter;

        const duration = spinDurationMs || 5400;
        const startTime = performance.now();
        const dial = this.els.wheelDial;

        const step = (now) => {
            const t = Math.min(1, (now - startTime) / duration);
            // Ease-out quartique : vitesse maximale au départ, décélération
            // longue et lisse, se pose exactement sur la cible à t=1.
            const eased = 1 - Math.pow(1 - t, 4);
            dial.style.transform = `rotate(${targetDeg * eased}deg)`;
            if (t < 1) {
                this._wheelAnimFrame = requestAnimationFrame(step);
            } else {
                this._wheelAnimFrame = null;
            }
        };
        this._wheelAnimFrame = requestAnimationFrame(step);
    }

    _resolveWheel({ eventId }) {
        const cfg = (CONFIG.EVENTS?.events || []).find(e => e.id === eventId);
        this.els.wheelResultLabel.textContent = cfg ? `${cfg.icon} ${cfg.label} !` : '';
        this._wheelSpinning = false;

        setTimeout(() => {
            this.els.wheelScene.classList.remove('visible');
            setTimeout(() => this.els.wheelScene.classList.add('hidden'), 400);
        }, 1600);
    }

    /* ---------------- Couronnement ---------------- */

    _showCoronation({ playerName, poolValue }) {
        this.els.coronationName.textContent = `@${playerName}`;
        this.els.coronationAmount.textContent = `+ ${poolValue.toLocaleString('fr-FR')} 🪙`;
        this.els.coronationScene.classList.remove('hidden');
        this.els.coronationScene.classList.add('visible');
        this._flash();
        this._shake();

        const anim = CONFIG.SHOW_ANIMATIONS?.coronation || {};
        const totalMs = (anim.fadeInMs || 500) + (anim.crownDropMs || 900) + (anim.coinRainMs || 2500) + (anim.fadeOutMs || 600);
        setTimeout(() => {
            this.els.coronationScene.classList.remove('visible');
            setTimeout(() => this.els.coronationScene.classList.add('hidden'), 500);
        }, totalMs);
    }

    /* ---------------- Utilitaires ---------------- */

    _show(el, holdMs) {
        if (!el) return;
        el.classList.add('visible');
        clearTimeout(el._hideTimeoutId);
        el._hideTimeoutId = setTimeout(() => el.classList.remove('visible'), holdMs);
    }

    _pulse(el) {
        if (!el) return;
        el.classList.remove('panel-pulse');
        void el.offsetWidth;
        el.classList.add('panel-pulse');
    }

    _flash() {
        this.els.flash.classList.remove('flash');
        void this.els.flash.offsetWidth;
        this.els.flash.classList.add('flash');
    }

    _shake() {
        this.els.root.classList.remove('shake');
        void this.els.root.offsetWidth;
        this.els.root.classList.add('shake');
    }
}
