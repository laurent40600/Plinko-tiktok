/* ============================================================
   ROYAL DROP — systems/communityManager.js
   ------------------------------------------------------------
   "Énergie du Coffre Royal" : objectif communautaire alimenté
   par l'engagement (commentaires, likes, partages, follows) et
   par la valeur en points de chaque cadeau. Paliers visuels à
   25/50/75/100% (voir /config/levels.json). À 100%, le coffre
   s'ouvre : JackpotManager écoute 'community:chestOpen' pour
   déverrouiller la case JACKPOT pour une fenêtre de temps.
   ============================================================ */

import { CONFIG } from '../core/config.js';

export class CommunityManager {
    /** @param {object} deps @param {import('../core/events.js').eventBus} deps.eventBus */
    constructor({ eventBus }) {
        this.eventBus = eventBus;

        const cfg = CONFIG.LEVELS?.community || {};
        this.goal = cfg.energyGoal || 1000;
        this.energy = cfg.startingEnergy || 0;
        this.stages = cfg.stages || [];
        this.chestOpen = false;
        this.currentStageId = this._stageForPercent(this._percent());

        eventBus.on('tiktok:comment', () => this._addPoints(this._points('comment')));
        eventBus.on('tiktok:like', (data) => this._addPoints(((data?.count || 0) / 100) * this._points('likes_per_100')));
        eventBus.on('tiktok:share', () => this._addPoints(this._points('share')));
        eventBus.on('tiktok:follow', () => this._addPoints(this._points('new_follow')));
        eventBus.on('gift:processed', (data) => this._addPoints((data.gift?.points || 0) * (data.giftCount || 1)));
        eventBus.on('keys:goalReached', () => this._forceOpen());
        eventBus.on('jackpot:relocked', () => this._resetCycle());

        this._emitUpdate();
    }

    _points(key) {
        return CONFIG.LEVELS?.engagementPoints?.[key] || 0;
    }

    _percent() {
        return Math.min(100, (this.energy / this.goal) * 100);
    }

    _stageForPercent(percent) {
        let current = null;
        for (const stage of this.stages) {
            if (percent >= stage.atPercent) current = stage;
        }
        return current?.id || null;
    }

    _addPoints(amount) {
        if (!amount || this.chestOpen) return;

        this.energy = Math.min(this.goal, this.energy + amount);
        const percent = this._percent();
        const newStage = this._stageForPercent(percent);

        if (newStage !== this.currentStageId) {
            this.currentStageId = newStage;
            this.eventBus.emit('community:stageChanged', { stageId: newStage, percent });
        }

        this._emitUpdate();

        if (percent >= 100) this._openChest();
    }

    _forceOpen() {
        this.energy = this.goal;
        this.currentStageId = this._stageForPercent(100);
        this._emitUpdate();
        this._openChest();
    }

    _openChest() {
        if (this.chestOpen) return;
        this.chestOpen = true;
        this.eventBus.emit('community:chestOpen', { energy: this.energy, goal: this.goal });
    }

    _resetCycle() {
        this.chestOpen = false;
        this.energy = 0;
        this.currentStageId = this._stageForPercent(0);
        this._emitUpdate();
    }

    _emitUpdate() {
        this.eventBus.emit('community:updated', {
            energy: Math.round(this.energy),
            goal: this.goal,
            percent: this._percent(),
            stageId: this.currentStageId,
            chestOpen: this.chestOpen
        });
    }

    getState() {
        return { energy: Math.round(this.energy), goal: this.goal, percent: this._percent(), stageId: this.currentStageId, chestOpen: this.chestOpen };
    }
}
