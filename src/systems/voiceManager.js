/* ============================================================
   ROYAL DROP — systems/voiceManager.js
   ------------------------------------------------------------
   Réactions vocales humaines façon émission TV, via l'API Web
   Speech (SpeechSynthesis) — aucun fichier audio, dans le même
   esprit que systems/audio.js (tout est généré en direct). Ne
   parle QUE sur les grands moments (jamais en continu), avec un
   délai anti-spam entre deux répliques.
   ============================================================ */

const LINES = {
    suspense: ['Oh...', 'Attention...', 'Ça approche...'],
    nearMiss: ['OHHHH !', "C'était presque !", 'Non !', 'Oh dommage...', 'À quelques millimètres !'],
    jackpotWin: ['WOW !', 'INCROYABLE !', 'BRAVO !', 'QUEL COUP !'],
    chestOpen: ['Le coffre s\'ouvre !', 'Regardez ça !'],
    bossDefeated: ['Le boss est vaincu !', 'Quelle victoire !']
};

const MIN_GAP_MS = 3000;

export class VoiceManager {
    /** @param {object} deps @param {import('../core/events.js').eventBus} deps.eventBus */
    constructor({ eventBus }) {
        this.eventBus = eventBus;
        this.enabled = typeof window !== 'undefined' && 'speechSynthesis' in window;
        this._voice = null;
        this._lastSpokenAt = 0;
        this._unlocked = false;

        if (this.enabled) {
            this._pickVoice();
            window.speechSynthesis.addEventListener?.('voiceschanged', () => this._pickVoice());
        }

        eventBus.on('jackpot:approach', () => this.say('suspense'));
        eventBus.on('jackpot:nearMiss', () => this.say('nearMiss'));
        eventBus.on('jackpot:coronation', () => this.say('jackpotWin'));
        eventBus.on('community:chestOpen', () => this.say('chestOpen'));
        eventBus.on('boss:defeated', () => this.say('bossDefeated'));
    }

    /** Débloque la synthèse vocale après une interaction utilisateur (comme l'audio Web Audio). */
    unlock() {
        this._unlocked = true;
    }

    _pickVoice() {
        const voices = window.speechSynthesis.getVoices();
        this._voice = voices.find(v => v.lang?.startsWith('fr')) || voices[0] || null;
    }

    say(category) {
        if (!this.enabled || !this._unlocked) return;

        const now = Date.now();
        if (now - this._lastSpokenAt < MIN_GAP_MS) return;

        const lines = LINES[category];
        if (!lines?.length) return;
        const text = lines[Math.floor(Math.random() * lines.length)];

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'fr-FR';
        if (this._voice) utterance.voice = this._voice;
        utterance.rate = 1.05;
        utterance.pitch = 1.1;
        utterance.volume = 0.9;

        window.speechSynthesis.speak(utterance);
        this._lastSpokenAt = now;
    }
}
