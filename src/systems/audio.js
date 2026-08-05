/* ============================================================
   ROYAL DROP — systems/audio.js
   ------------------------------------------------------------
   Tous les sons sont générés en direct via Web Audio API,
   aucun fichier audio externe. Limite le nombre de rebonds
   simultanés pour éviter la saturation quand beaucoup de
   billes sont en jeu en même temps.
   ============================================================ */

import { CONFIG } from '../core/config.js';

export class AudioEngine {
    ctx = null;
    masterGain = null;
    activeBounceCount = 0;
    #unlocked = false;

    /** À appeler après une interaction utilisateur (obligatoire sur iOS/Safari). */
    init() {
        if (this.ctx) return;

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContextClass();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = CONFIG.AUDIO.MASTER_VOLUME;
        this.masterGain.connect(this.ctx.destination);
    }

    /** Débloque l'audio sur iOS/Safari via un son silencieux au premier tap. */
    unlock() {
        if (this.#unlocked || !this.ctx) return;
        const buffer = this.ctx.createBuffer(1, 1, 22050);
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.ctx.destination);
        source.start(0);
        this.#unlocked = true;

        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    setVolume(value) {
        if (!this.masterGain) return;
        this.masterGain.gain.value = Math.max(0, Math.min(1, value));
    }

    playTone(frequency, duration = 0.1, type = 'sine', volumeMultiplier = 1) {
        if (!this.ctx) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.value = frequency;

        const now = this.ctx.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.6 * volumeMultiplier, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start(now);
        osc.stop(now + duration);
    }

    /** Son de rebond sur un picot. intensity (0-1) module fréquence/volume. */
    playPegHit(intensity = 1) {
        if (this.activeBounceCount >= CONFIG.AUDIO.MAX_SIMULTANEOUS_BOUNCES) {
            return; // évite la saturation quand beaucoup de billes rebondissent
        }

        this.activeBounceCount++;
        const freq = CONFIG.AUDIO.PEG_HIT_FREQ * (0.9 + intensity * 0.2);
        this.playTone(freq, 0.08, 'triangle', 0.5 * intensity);

        setTimeout(() => {
            this.activeBounceCount = Math.max(0, this.activeBounceCount - 1);
        }, 60);
    }

    playBucketWin(multiplier) {
        const freq = CONFIG.AUDIO.BUCKET_WIN_FREQ + (multiplier * 15);
        this.playTone(freq, 0.25, 'sine', 0.8);
    }

    /** Fanfare (notes ascendantes) jouée sur le bucket jackpot. */
    playJackpot() {
        const notes = [220, 277, 330, 440, 554];
        notes.forEach((freq, i) => {
            setTimeout(() => this.playTone(freq, 0.3, 'sawtooth', 0.7), i * 90);
        });
    }

    playLaunch() {
        this.playTone(660, 0.12, 'square', 0.4);
    }

    playUIClick() {
        this.playTone(1000, 0.05, 'square', 0.3);
    }

    /** Joue un son nommé défini dans /config/sounds.json (séquence de tons synthétisés). */
    playNamed(soundId) {
        if (!soundId || !this.ctx) return;
        const sound = CONFIG.SOUNDS?.[soundId];
        if (!sound || !Array.isArray(sound.notes)) return;

        let offsetMs = 0;
        for (const note of sound.notes) {
            setTimeout(() => this.playTone(note.freq, note.dur, note.type, note.vol), offsetMs);
            offsetMs += note.dur * 600; // léger chevauchement entre notes pour un rendu plus riche
        }
    }

    isAvailable() {
        return !!(window.AudioContext || window.webkitAudioContext);
    }
}
