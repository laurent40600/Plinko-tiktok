/* ============================================================
   ROYAL DROP — systems/communityManager.js
   ------------------------------------------------------------
   "Énergie du Coffre Royal" : objectif communautaire alimenté
   par l'engagement (commentaires, likes, partages, follows) et
   par la valeur en points de chaque cadeau. Paliers visuels à
   25/50/75/100% (voir /config/levels.json). Le coffre ne s'ouvre
   réellement (déverrouillage du Jackpot) que lorsque l'énergie
   (ou les clés) ET un minimum de billes jouées sont atteints —
   ça évite qu'un cycle s'ouvre après seulement quelques gros
   cadeaux, sans que le live ait vraiment "joué".
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
        this.minBallsToOpen = cfg.minBallsToOpen ?? 1000;
        this.ballsLanded = 0;
        this.chestOpen = false;
        this._energyReady = false;
        this.currentStageId = this._stageForPercent(this._percent());

        eventBus.on('tiktok:comment', () => this._addPoints(this._points('comment')));
        eventBus.on('tiktok:like', (data) => this._addPoints(((data?.count || 0) / 100) * this._points('likes_per_100')));
        eventBus.on('tiktok:share', () => this._addPoints(this._points('share')));
        eventBus.on('tiktok:follow', () => this._addPoints(this._points('new_follow')));
        eventBus.on('gift:processed', (data) => this._addPoints((data.gift?.points || 0) * (data.giftCount || 1)));
        eventBus.on('ball:landed', () => this._onBallLanded());
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

    _onBallLanded() {
        if (this.chestOpen) return;
        this.ballsLanded++;
        this._emitUpdate();
        this._tryOpenChest();
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

        if (percent >= 100) this._energyReady = true;

        this._emitUpdate();
        this._tryOpenChest();
    }

    _forceOpen() {
        this.energy = this.goal;
        this.currentStageId = this._stageForPercent(100);
        this._energyReady = true;
        this._emitUpdate();
        this._tryOpenChest();
    }

    /** N'ouvre le coffre que si l'énergie/les clés ET le minimum de billes sont réunis. */
    _tryOpenChest() {
        if (this.chestOpen || !this._energyReady) return;
        if (this.ballsLanded >= this.minBallsToOpen) this._openChest();
    }

    _openChest() {
        if (this.chestOpen) return;
        this.chestOpen = true;
        this.eventBus.emit('community:chestOpen', { energy: this.energy, goal: this.goal });
    }

    _resetCycle() {
        this.chestOpen = false;
        this.energy = 0;
        this.ballsLanded = 0;
        this._energyReady = false;
        this.currentStageId = this._stageForPercent(0);
        this._emitUpdate();
    }

    _emitUpdate() {
        this.eventBus.emit('community:updated', {
            energy: Math.round(this.energy),
            goal: this.goal,
            percent: this._percent(),
            stageId: this.currentStageId,
            chestOpen: this.chestOpen,
            ballsLanded: this.ballsLanded,
            minBallsToOpen: this.minBallsToOpen,
            energyReady: this._energyReady
        });
    }

    getState() {
        return {
            energy: Math.round(this.energy),
            goal: this.goal,
            percent: this._percent(),
            stageId: this.currentStageId,
            chestOpen: this.chestOpen,
            ballsLanded: this.ballsLanded,
            minBallsToOpen: this.minBallsToOpen
        };
    }
}
