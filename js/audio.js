/* ============================================================
   HUNGRY HAMSTER – Musik & Soundeffekte
   ------------------------------------------------------------
   Hier wird ALLE Musik direkt vom Computer erzeugt (mit der
   "Web Audio API"). Wir brauchen also keine Musik-Dateien!
   Der Computer erzeugt Töne wie ein kleines Keyboard.
   ============================================================ */

const Audio2 = {

  ctx: null,          // Der "Ton-Motor" des Browsers
  hauptRegler: null,  // Lautstärke für alles
  musikRegler: null,  // Lautstärke nur für die Musik
  laeuft: false,      // Läuft die Musik gerade?
  tempo: 1,           // 1 = normal, 1.2 = 20% schneller ...
  naechsterTon: 0,    // Wann soll der nächste Ton gespielt werden?
  schritt: 0,         // Der wievielte Ton der Melodie ist dran?
  timer: null,        // Der Taktgeber der Musik
  stumm: false,       // Ton an oder aus?

  /* --- Den Ton-Motor starten ---------------------------------
     Browser erlauben Musik erst, NACHDEM man einmal getippt hat.
     Darum rufen wir das beim ersten Fingertipp auf. */
  start() {
    if (this.ctx) {
      // Falls der Browser den Ton pausiert hat: wieder aufwecken
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AudioKlasse = window.AudioContext || window.webkitAudioContext;
    if (!AudioKlasse) return;   // ganz alter Browser: dann eben ohne Ton

    this.ctx = new AudioKlasse();

    this.hauptRegler = this.ctx.createGain();
    this.hauptRegler.gain.value = 0.55;
    this.hauptRegler.connect(this.ctx.destination);

    this.musikRegler = this.ctx.createGain();
    this.musikRegler.gain.value = 0.30;
    this.musikRegler.connect(this.hauptRegler);
  },

  /* --- Ein einzelner Ton --------------------------------------
     hz     = Tonhöhe (hohe Zahl = hoher Ton)
     start  = wann der Ton beginnt
     dauer  = wie lange er klingt
     form   = 'square' klingt nach Game Boy, 'sine' ist weich
     laut   = Lautstärke
     ziel   = wo der Ton hingeht (Musik oder Effekte)          */
  ton(hz, start, dauer, form = 'square', laut = 0.3, ziel = null) {
    if (!this.ctx || this.stumm) return;
    const t = start;
    const osz = this.ctx.createOscillator();
    const reg = this.ctx.createGain();

    osz.type = form;
    osz.frequency.setValueAtTime(hz, t);

    // Der Ton wird schnell laut und dann langsam wieder leise
    reg.gain.setValueAtTime(0, t);
    reg.gain.linearRampToValueAtTime(laut, t + 0.012);
    reg.gain.exponentialRampToValueAtTime(0.0001, t + dauer);

    osz.connect(reg);
    reg.connect(ziel || this.hauptRegler);
    osz.start(t);
    osz.stop(t + dauer + 0.05);
  },

  /* --- Ein Ton, der von einer Höhe zur anderen gleitet -------- */
  gleitTon(vonHz, nachHz, dauer, form = 'square', laut = 0.3) {
    if (!this.ctx || this.stumm) return;
    const t = this.ctx.currentTime;
    const osz = this.ctx.createOscillator();
    const reg = this.ctx.createGain();

    osz.type = form;
    osz.frequency.setValueAtTime(vonHz, t);
    osz.frequency.exponentialRampToValueAtTime(Math.max(20, nachHz), t + dauer);

    reg.gain.setValueAtTime(laut, t);
    reg.gain.exponentialRampToValueAtTime(0.0001, t + dauer);

    osz.connect(reg);
    reg.connect(this.hauptRegler);
    osz.start(t);
    osz.stop(t + dauer + 0.05);
  },

  /* --- Rauschen (für Trommel, Platsch, Krach) ----------------- */
  rauschen(dauer, laut = 0.3, filterHz = 1000) {
    if (!this.ctx || this.stumm) return;
    const t = this.ctx.currentTime;
    const anzahl = Math.floor(this.ctx.sampleRate * dauer);
    const puffer = this.ctx.createBuffer(1, anzahl, this.ctx.sampleRate);
    const daten = puffer.getChannelData(0);
    for (let i = 0; i < anzahl; i++) daten[i] = Math.random() * 2 - 1;

    const quelle = this.ctx.createBufferSource();
    quelle.buffer = puffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterHz;

    const reg = this.ctx.createGain();
    reg.gain.setValueAtTime(laut, t);
    reg.gain.exponentialRampToValueAtTime(0.0001, t + dauer);

    quelle.connect(filter);
    filter.connect(reg);
    reg.connect(this.hauptRegler);
    quelle.start(t);
  },

  /* ==========================================================
     DIE SOUNDEFFEKTE
     ========================================================== */

  // Sprung: "Boing!" – der Ton geht nach oben
  sprung() { this.gleitTon(300, 780, 0.16, 'square', 0.28); },

  // Punkte: fröhliches "Pling-Pling"
  punkte() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.ton(880, t, 0.10, 'square', 0.25);
    this.ton(1320, t + 0.09, 0.16, 'square', 0.25);
  },

  // Schneller: kleine aufsteigende Fanfare
  schneller() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [523, 659, 784, 1047].forEach((hz, i) => {
      this.ton(hz, t + i * 0.08, 0.14, 'square', 0.26);
    });
  },

  // Ganze Pizza gefangen! Eine kleine Jubel-Fanfare
  pizzaFanfare() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [523, 659, 784, 1047].forEach((hz, i) => {
      this.ton(hz, t + i * 0.06, 0.20, 'square', 0.26);
      this.ton(hz * 2, t + i * 0.06, 0.14, 'triangle', 0.12);
    });
    this.ton(1319, t + 0.26, 0.28, 'sine', 0.22);
  },

  // Ein Pizzastück eingesammelt – kurzes helles "Ting"
  stueck() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.ton(1047, t, 0.07, 'square', 0.22);
    this.ton(1568, t + 0.06, 0.12, 'square', 0.18);
  },

  // Zur Seite ausweichen – ein kurzes "Wusch"
  ausweichen() { this.rauschen(0.16, 0.20, 2600); },

  // Die Polizisten pfeifen, wenn sie auftauchen
  pfiff() {
    if (!this.ctx || this.stumm) return;
    const t = this.ctx.currentTime;
    const osz = this.ctx.createOscillator();
    const reg = this.ctx.createGain();
    osz.type = 'sine';
    osz.frequency.setValueAtTime(2000, t);
    osz.frequency.linearRampToValueAtTime(2450, t + 0.10);
    osz.frequency.linearRampToValueAtTime(2000, t + 0.20);
    osz.frequency.linearRampToValueAtTime(2450, t + 0.30);
    reg.gain.setValueAtTime(0, t);
    reg.gain.linearRampToValueAtTime(0.14, t + 0.02);
    reg.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);
    osz.connect(reg); reg.connect(this.hauptRegler);
    osz.start(t); osz.stop(t + 0.45);
  },

  // Leyans Giftspray zischt
  zischen() { this.rauschen(0.45, 0.16, 4200); },

  // Götti Mu keucht beim Joggen
  keuchen() {
    if (!this.ctx) return;
    this.rauschen(0.18, 0.12, 900);
    setTimeout(() => this.rauschen(0.14, 0.10, 700), 260);
  },

  // Mariannes Besen schrubbt über den Boden
  wischen() {
    if (!this.ctx) return;
    this.rauschen(0.30, 0.13, 2200);
    setTimeout(() => this.rauschen(0.30, 0.11, 1800), 340);
  },

  // Louise wirbelt einen herum – ein aufsteigendes Drehen
  wirbel() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    for (let i = 0; i < 6; i++) {
      this.ton(440 * Math.pow(1.26, i), t + i * 0.075, 0.14, 'triangle', 0.20);
    }
    this.gleitTon(880, 1760, 0.5, 'sine', 0.14);
  },

  // Husten, wenn man Gift eingeatmet hat
  husten() {
    if (!this.ctx) return;
    this.rauschen(0.14, 0.22, 600);
    setTimeout(() => this.rauschen(0.12, 0.20, 520), 230);
    setTimeout(() => this.rauschen(0.16, 0.18, 460), 470);
  },

  // Der Magen knurrt – der Hamster ist verhungert
  magenknurren() {
    if (!this.ctx) return;
    this.gleitTon(150, 55, 0.9, 'sawtooth', 0.26);
    setTimeout(() => this.gleitTon(120, 45, 1.1, 'sawtooth', 0.22), 500);
  },

  // Stromschlag: knatterndes Zappen
  stromschlag() {
    if (!this.ctx || this.stumm) return;
    const t = this.ctx.currentTime;
    for (let i = 0; i < 9; i++) {
      this.ton(90 + Math.random() * 2400, t + i * 0.055, 0.05, 'square', 0.16);
    }
    this.rauschen(0.55, 0.14, 3200);
  },

  // 🤫 Münzen klimpern
  klimpern() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const toene = [1319, 1568, 1976, 1568, 2093];
    toene.forEach((hz, i) => this.ton(hz, t + i * 0.055, 0.16, 'triangle', 0.20));
    this.ton(2637, t + 0.30, 0.34, 'sine', 0.16);
  },

  // Sophies Selfie – ein Kamera-Klick
  selfie() {
    if (!this.ctx) return;
    this.rauschen(0.05, 0.16, 6000);
    this.ton(2600, this.ctx.currentTime + 0.04, 0.05, 'square', 0.10);
  },

  // Das Licht geht aus: ein tiefes Knacken und Absacken
  stromAus() {
    if (!this.ctx) return;
    this.rauschen(0.12, 0.28, 700);
    this.gleitTon(520, 55, 0.75, 'sawtooth', 0.22);
  },

  // Das Licht kommt zurück: ein Summen, das hochfährt
  stromAn() {
    if (!this.ctx) return;
    this.gleitTon(90, 640, 0.45, 'triangle', 0.18);
    this.ton(1319, this.ctx.currentTime + 0.42, 0.20, 'square', 0.16);
  },

  // Crash: es kracht und brummt
  crash() {
    if (!this.ctx) return;
    this.rauschen(0.45, 0.45, 900);
    this.gleitTon(400, 60, 0.55, 'sawtooth', 0.32);
  },

  // Schnüffeln am Pizzaduft
  schnueffeln() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.ton(1200, t, 0.05, 'sine', 0.12);
    this.ton(1500, t + 0.10, 0.05, 'sine', 0.12);
  },

  // Der Fall ins Gulliloch: langer Pfeifton nach unten
  fallen() { this.gleitTon(900, 90, 1.0, 'sine', 0.30); },

  // Platsch! Unten in der Kanalisation angekommen
  platsch() {
    this.rauschen(0.30, 0.35, 2200);
    this.gleitTon(200, 80, 0.25, 'sine', 0.22);
  },

  // "Mmmh, Pizza!" – Herzchen-Ton im Intro
  lecker() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.ton(659, t, 0.12, 'sine', 0.22);
    this.ton(880, t + 0.12, 0.20, 'sine', 0.22);
  },

  /* ==========================================================
     DIE MUSIK
     Eine fröhliche Melodie, die immer wieder von vorn läuft.
     Wenn der Hamster schneller rennt, wird auch die Musik
     schneller (dafür sorgt "tempo").
     ========================================================== */

  // Die Melodie in Tonhöhen (Hz). 0 bedeutet: Pause.
  melodie: [
    523, 659, 784, 659,  523, 659, 784, 880,
    784, 659, 523, 587,  659,   0, 587, 523,
    587, 698, 880, 698,  587, 698, 880, 988,
    880, 784, 659, 587,  523,   0, 523,   0
  ],

  // Die Bass-Töne darunter (tiefer, brummiger)
  bass: [
    131, 0, 131, 0,  165, 0, 165, 0,
    196, 0, 196, 0,  165, 0, 147, 0,
    131, 0, 131, 0,  175, 0, 175, 0,
    196, 0, 196, 0,  131, 0, 131, 0
  ],

  musikStart() {
    if (!this.ctx || this.laeuft) return;
    this.laeuft = true;
    this.schritt = 0;
    this.naechsterTon = this.ctx.currentTime + 0.1;
    // Alle 40 Millisekunden nachschauen, ob ein neuer Ton dran ist
    this.timer = setInterval(() => this.planer(), 40);
  },

  musikStopp() {
    this.laeuft = false;
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  },

  // Der Taktgeber: legt die nächsten Töne im Voraus fest
  planer() {
    if (!this.ctx || !this.laeuft) return;
    // Grundtempo: eine Achtelnote dauert 0.20 Sekunden.
    // Je grösser "tempo", desto kürzer -> die Musik wird schneller.
    const notenLaenge = 0.20 / this.tempo;

    // Wir planen immer 0.2 Sekunden in die Zukunft
    while (this.naechsterTon < this.ctx.currentTime + 0.2) {
      const t = this.naechsterTon;
      const i = this.schritt % this.melodie.length;

      // Melodie
      const m = this.melodie[i];
      if (m > 0) this.ton(m, t, notenLaenge * 0.9, 'square', 0.16, this.musikRegler);

      // Bass
      const b = this.bass[i];
      if (b > 0) this.ton(b, t, notenLaenge * 1.6, 'triangle', 0.20, this.musikRegler);

      // Trommel auf jedem 4. Schlag
      if (i % 4 === 0) this.trommel(t, 0.16);
      if (i % 4 === 2) this.trommel(t, 0.09);

      this.naechsterTon += notenLaenge;
      this.schritt++;
    }
  },

  // Eine kurze Trommel für den Rhythmus
  trommel(t, laut) {
    if (!this.ctx || this.stumm) return;
    const osz = this.ctx.createOscillator();
    const reg = this.ctx.createGain();
    osz.type = 'sine';
    osz.frequency.setValueAtTime(160, t);
    osz.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    reg.gain.setValueAtTime(laut, t);
    reg.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
    osz.connect(reg);
    reg.connect(this.musikRegler);
    osz.start(t);
    osz.stop(t + 0.2);
  },

  // Ton an/aus schalten (der Lautsprecher-Knopf oben rechts)
  stummSchalten() {
    this.stumm = !this.stumm;
    if (this.hauptRegler) {
      this.hauptRegler.gain.value = this.stumm ? 0 : 0.55;
    }
    return this.stumm;
  }
};
