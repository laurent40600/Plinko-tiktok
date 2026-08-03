/* ============================================================
   ROYAL DROP — audio.js
   ------------------------------------------------------------
   Tous les sons sont générés en direct via Web Audio API.
   Aucun fichier audio externe n'est utilisé.
   Limite automatiquement le nombre de rebonds simultanés
   pour éviter la saturation sonore quand beaucoup de billes
   sont en jeu en même temps.
   ============================================================ */

const AudioEngine = {

    ctx: null,
    masterGain: null,
    activeBounceCount: 0,
    _unlocked: false,

    /* --------------------------------------------------------
       init()
       Crée le contexte audio et le gain master.
       Doit être appelé après une interaction utilisateur
       (obligatoire sur iPhone/Safari pour débloquer l'audio).
       -------------------------------------------------------- */
    init() {
        if (this.ctx) return;

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContextClass();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = CONFIG.AUDIO.MASTER_VOLUME;
        this.masterGain.connect(this.ctx.destination);
    },

    /* --------------------------------------------------------
       unlock()
       Débloque l'audio sur iOS/Safari via un son silencieux
       joué lors du premier tap de l'utilisateur.
       -------------------------------------------------------- */
    unlock() {
        if (this._unlocked || !this.ctx) return;
        const buffer = this.ctx.createBuffer(1, 1, 22050);
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.ctx.destination);
        source.start(0);
        this._unlocked = true;

        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },

    /* --------------------------------------------------------
       setVolume(value)
       Modifie le volume général (0 à 1), utilisé par ui.js
       et sauvegardé via storage.js.
       -------------------------------------------------------- */
    setVolume(value) {
        if (!this.masterGain) return;
        this.masterGain.gain.value = Math.max(0, Math.min(1, value));
    },

    /* --------------------------------------------------------
       playTone(frequency, duration, type, volumeMultiplier)
       Génère un son simple (oscillateur) avec enveloppe
       d'amplitude pour éviter les clics audio.
       -------------------------------------------------------- */
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
    },

    /* --------------------------------------------------------
       playPegHit(intensity)
       Son de rebond sur un picot. Limite automatiquement le
       nombre de rebonds joués simultanément (config.js).
       intensity (0-1) module légèrement la fréquence/volume.
       -------------------------------------------------------- */
    playPegHit(intensity = 1) {
        if (this.activeBounceCount >= CONFIG.AUDIO.MAX_SIMULTANEOUS_BOUNCES) {
            return; // on ignore ce rebond pour éviter la saturation
        }

        this.activeBounceCount++;
        const freq = CONFIG.AUDIO.PEG_HIT_FREQ * (0.9 + intensity * 0.2);
        this.playTone(freq, 0.08, 'triangle', 0.5 * intensity);

        // Libère le compteur peu après le son
        setTimeout(() => {
            this.activeBounceCount = Math.max(0, this.activeBounceCount - 1);
        }, 60);
    },

    /* --------------------------------------------------------
       playBucketWin(multiplier)
       Son joué quand une bille tombe dans un bucket.
       Plus le multiplicateur est élevé, plus le son monte.
       -------------------------------------------------------- */
    playBucketWin(multiplier) {
        const freq = CONFIG.AUDIO.BUCKET_WIN_FREQ + (multiplier * 15);
        this.playTone(freq, 0.25, 'sine', 0.8);
    },

    /* --------------------------------------------------------
       playJackpot()
       Fanfare simple jouée lors d'un jackpot (bucket central).
       Enchaîne plusieurs notes ascendantes.
       -------------------------------------------------------- */
    playJackpot() {
        const notes = [220, 277, 330, 440, 554];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.playTone(freq, 0.3, 'sawtooth', 0.7);
            }, i * 90);
        });
    },

    /* --------------------------------------------------------
       playLaunch()
       Son joué au lancement d'une bille.
       -------------------------------------------------------- */
    playLaunch() {
        this.playTone(660, 0.12, 'square', 0.4);
    },

    /* --------------------------------------------------------
       playUIClick()
       Petit son pour les interactions d'interface (boutons).
       -------------------------------------------------------- */
    playUIClick() {
        this.playTone(1000, 0.05, 'square', 0.3);
    },

    /* --------------------------------------------------------
       isAvailable()
       Vérifie que l'API Web Audio est bien supportée.
       Utilisé par runDiagnostics() dans game.js.
       -------------------------------------------------------- */
    isAvailable() {
        return !!(window.AudioContext || window.webkitAudioContext);
    }
};
