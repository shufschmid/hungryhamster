/* ============================================================
   HUNGRY HAMSTER – Alles zum Zeichnen
   ------------------------------------------------------------
   Hier wird alles gemalt: der Hamster, der Kanalisations-Tunnel,
   die Hindernisse, die Pizza und das Gulliloch.
   Es gibt KEINE Bilder-Dateien – alles ist mit Code gezeichnet!
   ============================================================ */

/* ------------------------------------------------------------
   DIE KAMERA
   Sie rechnet aus, wo ein Ding auf dem Bildschirm landet.
   Wir tun so, als würden wir mit einer echten Kamera in den
   Tunnel schauen: Was weit weg ist, ist klein. Was nah ist,
   ist gross. Das nennt man "Perspektive".

   xw = links/rechts in der Spielwelt (0 = Mitte)
   yw = Höhe über dem Boden (0 = Boden)
   z  = wie weit weg (0 = direkt bei uns, 30 = ganz hinten)
   ------------------------------------------------------------ */
const Kamera = {
  B: 0, H: 0,        // Breite und Höhe des Bildschirms
  cx: 0, cy: 0,      // Der Fluchtpunkt (wo der Tunnel endet)
  f: 0,              // "Brennweite" – wie stark die Perspektive ist
  nah: 5.5,          // Abstand der Kamera zum Hamster
  hoehe: 2.1,        // Wie hoch die Kamera über dem Boden schwebt.
                     // Höher = man schaut mehr von oben und sieht
                     // mehr vom Weg vor sich (wie bei Subway Surfers).
  hamsterZ: 0.8,     // Wie weit der Hamster vor der Kamera läuft
  einheit: 0,        // Wie gross 1 Hamster beim Hamster auf dem Schirm ist
  camX: 0,           // Die Kamera schwenkt mit, wenn der Hamster ausweicht –
                     // sonst würde er auf schmalen Handys aus dem Bild laufen

  neuBerechnen(B, H) {
    this.B = B;
    this.H = H;
    this.cx = B / 2;

    // WICHTIG: Der Hamster soll auf JEDEM Gerät gleich gross wirken –
    // auf dem schmalen Handy (hochkant) genauso wie auf dem breiten
    // Tablet (quer). Darum schauen wir uns Breite UND Höhe an und
    // nehmen die kleinere von beiden als Massstab.
    this.einheit = Math.min(B * 0.32, H * 0.28);

    this.f = this.einheit * (this.hamsterZ + this.nah);
    // Der Fluchtpunkt wird so gelegt, dass der Hamster immer bei
    // 86 % der Bildhöhe steht – also schön weit unten.
    this.cy = H * 0.86 - this.hoehe * this.einheit;
  },

  // Rechnet einen Punkt der Spielwelt in einen Bildschirm-Punkt um
  punkt(xw, yw, z) {
    const s = this.f / (z + this.nah);
    return {
      x: this.cx + (xw - this.camX) * s,
      y: this.cy - (yw - this.hoehe) * s,
      s: s                            // s = wie gross alles bei dieser Tiefe ist
    };
  },

  // Wo liegt die Tunnelmitte bei dieser Tiefe auf dem Bildschirm?
  mitte(z) { return this.cx - this.camX * this.groesse(z); },

  // Nur der Grössen-Faktor bei einer bestimmten Tiefe
  groesse(z) { return this.f / (z + this.nah); }
};


/* ------------------------------------------------------------
   KLEINE HELFER
   ------------------------------------------------------------ */

// Ein Rechteck mit runden Ecken
function rundesRechteck(g, x, y, b, h, r) {
  r = Math.min(r, Math.abs(b) / 2, Math.abs(h) / 2);
  g.beginPath();
  g.moveTo(x + r, y);
  g.lineTo(x + b - r, y);
  g.quadraticCurveTo(x + b, y, x + b, y + r);
  g.lineTo(x + b, y + h - r);
  g.quadraticCurveTo(x + b, y + h, x + b - r, y + h);
  g.lineTo(x + r, y + h);
  g.quadraticCurveTo(x, y + h, x, y + h - r);
  g.lineTo(x, y + r);
  g.quadraticCurveTo(x, y, x + r, y);
  g.closePath();
}

// Ein Stern (für "Aua!" beim Zusammenstoss)
function stern(g, x, y, r, zacken = 5) {
  g.beginPath();
  for (let i = 0; i < zacken * 2; i++) {
    const radius = (i % 2 === 0) ? r : r * 0.45;
    const winkel = (Math.PI / zacken) * i - Math.PI / 2;
    const px = x + Math.cos(winkel) * radius;
    const py = y + Math.sin(winkel) * radius;
    if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
  }
  g.closePath();
}

// Ein Herzchen (für "Mmmh, Pizza!")
function herzForm(g, x, y, r) {
  g.beginPath();
  g.moveTo(x, y + r * 0.75);
  g.bezierCurveTo(x - r * 1.3, y - r * 0.4, x - r * 0.4, y - r * 1.1, x, y - r * 0.35);
  g.bezierCurveTo(x + r * 0.4, y - r * 1.1, x + r * 1.3, y - r * 0.4, x, y + r * 0.75);
  g.closePath();
}


/* ------------------------------------------------------------
   TEXT, DER IMMER AUF DEN BILDSCHIRM PASST
   Auf einem schmalen Handy ist weniger Platz als auf einem
   Tablet. Darum messen wir den Text und machen die Schrift
   kleiner, wenn er sonst über den Rand hinausragen würde.
   ------------------------------------------------------------ */
function schriftPassend(g, txt, groesse, maxBreite, fett = true, familie = 'Arial, sans-serif') {
  const setzen = (s) => { g.font = `${fett ? 'bold ' : ''}${Math.max(6, s)}px ${familie}`; };
  setzen(groesse);
  const breite = g.measureText(txt).width;
  if (breite > maxBreite && breite > 0) {
    groesse = groesse * maxBreite / breite;
    setzen(groesse);
  }
  return groesse;
}

// Text mit dunklem Rand – so kann man ihn auf jedem Hintergrund lesen
function textMitRand(g, txt, x, y, groesse, maxBreite, farbe = '#ffffff', fett = true, familie) {
  const s = schriftPassend(g, txt, groesse, maxBreite, fett, familie);
  g.lineWidth = Math.max(2, s * 0.16);
  g.lineJoin = 'round';
  g.strokeStyle = 'rgba(0,0,0,0.75)';
  g.strokeText(txt, x, y);
  g.fillStyle = farbe;
  g.fillText(txt, x, y);
  return s;
}

/* ------------------------------------------------------------
   DIE FARBEN DES HAMSTERS
   ------------------------------------------------------------ */
const HamsterFarben = {
  fellHell: '#e8b862',
  fell:     '#d59b3f',
  fellDunkel: '#b47d2a',
  bauch:    '#fdf3dc',
  ohrInnen: '#f2a9b4',
  nase:     '#e8899a',
  auge:     '#241a12',
  halstuch: '#d4342e',
  halstuchDunkel: '#a3231e'
};


const Grafik = {

  /* ==========================================================
     DER KANALISATIONS-TUNNEL
     Wir zeichnen viele Tunnel-Ringe hintereinander – vom
     grössten (ganz nah) bis zum kleinsten (ganz hinten).
     Weil sie sich zur Mitte hin verkleinern, sieht es aus wie
     ein echter Tunnel. Und weil sie sich bewegen, sieht es
     aus, als würde man rennen!
     ========================================================== */
  // licht: 1 = alle Lampen brennen, 0.25 = Stromausfall
  tunnel(g, strecke, zeit, licht = 1) {
    const B = Kamera.B, H = Kamera.H;

    // Hintergrund: ganz dunkel, im Fluchtpunkt fast schwarz
    const hg = g.createRadialGradient(Kamera.cx, Kamera.cy, 0, Kamera.cx, Kamera.cy, Math.max(B, H) * 0.8);
    hg.addColorStop(0, '#05090b');
    hg.addColorStop(1, '#14211d');
    g.fillStyle = hg;
    g.fillRect(0, 0, B, H);

    const ringAbstand = 1.6;          // Abstand zwischen zwei Ringen
    const anzahl = 26;                // So viele Ringe zeichnen wir
    const start = -3.2;               // Der erste Ring ist schon hinter uns –
                                      // so füllt der Tunnel den ganzen Bildschirm

    // WICHTIG: Die Ringe stehen FEST im Tunnel – der Hamster rennt an
    // ihnen vorbei. Darum rechnen wir für jeden Ring aus, wie weit er
    // gerade noch vor uns liegt: je weiter der Hamster gerannt ist
    // (strecke), desto KLEINER wird z – der Ring kommt also näher.
    const ersterRing = Math.ceil((strecke + start) / ringAbstand);

    // Von NAH nach FERN zeichnen: der jeweils kleinere Ring wird über
    // den grösseren gemalt – so entstehen die Streifen.
    for (let i = 0; i < anzahl; i++) {
      const nummer = ersterRing + i;
      const z = nummer * ringAbstand - strecke;

      // Weiter weg = dunkler
      const tiefe = Math.max(0, 1 - z / (anzahl * ringAbstand));
      const hell = 0.25 + tiefe * 0.75;
      const wechsel = (nummer % 2 === 0) ? 1 : 0.82;
      const rot = Math.floor(46 * hell * wechsel);
      const gruen = Math.floor(62 * hell * wechsel);
      const blau = Math.floor(55 * hell * wechsel);

      g.fillStyle = `rgb(${rot},${gruen},${blau})`;
      this.tunnelRing(g, z);
    }

    // Die Wasserrinne am Boden
    this.wasserRinne(g, strecke, zeit);

    // Lampen an der Wand
    this.lampen(g, strecke, zeit, licht);

    // Rohre, die an den Wänden entlanglaufen
    this.wandRohre(g, strecke);
  },

  // Ein einzelner Tunnel-Ring: unten flach, oben rund (wie ein Rohr)
  tunnelRing(g, z) {
    const hw = 2.6;          // halbe Breite des Tunnels
    const schulter = 1.7;    // ab hier wird der Tunnel rund
    const s = Kamera.groesse(z);
    const mx = Kamera.mitte(z);                // schwenkt mit der Kamera mit
    const my = Kamera.cy + Kamera.hoehe * s;   // Boden-Höhe bei dieser Tiefe

    g.beginPath();
    g.moveTo(mx - hw * s, my);
    g.lineTo(mx - hw * s, my - schulter * s);
    // Der runde Tunnel-Bogen oben
    for (let a = 180; a >= 0; a -= 10) {
      const bog = a * Math.PI / 180;
      g.lineTo(mx + Math.cos(bog) * hw * s, my - schulter * s - Math.sin(bog) * hw * s);
    }
    g.lineTo(mx + hw * s, my);
    g.closePath();
    g.fill();
  },

  // Grünes, trübes Wasser in der Mitte des Bodens
  wasserRinne(g, strecke, zeit) {
    const nah = Kamera.punkt(0, 0, -3.2);
    const fern = Kamera.punkt(0, 0, 34);
    const bNah = 1.0 * Kamera.groesse(-3.2);
    const bFern = 1.0 * Kamera.groesse(34);

    const gr = g.createLinearGradient(0, fern.y, 0, nah.y);
    gr.addColorStop(0, '#16241c');
    gr.addColorStop(1, '#2f5a35');
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(nah.x - bNah, nah.y);
    g.lineTo(fern.x - bFern, fern.y);
    g.lineTo(fern.x + bFern, fern.y);
    g.lineTo(nah.x + bNah, nah.y);
    g.closePath();
    g.fill();

    // Glitzernde Wellen auf dem Wasser (kommen uns entgegen)
    g.fillStyle = 'rgba(150, 220, 160, 0.28)';
    for (let i = 0; i < 12; i++) {
      const z = ((i * 2.5 - strecke) % 30 + 30) % 30;
      const p = Kamera.punkt(Math.sin(i * 5.1 + z * 0.4) * 0.7, 0.02, z);
      const gr2 = Kamera.groesse(z);
      g.beginPath();
      g.ellipse(p.x, p.y, gr2 * 0.28, gr2 * 0.05, 0, 0, Math.PI * 2);
      g.fill();
    }
  },

  // Warme Lampen an den Tunnelwänden – die einzige Lichtquelle hier unten
  lampen(g, strecke, zeit, licht = 1) {
    const abstand = 7;
    // Auch die Lampen hängen fest an der Wand – wir fahren an ihnen vorbei
    const ersteLampe = Math.ceil((strecke + 0.5) / abstand);
    for (let i = 5; i >= 0; i--) {          // von hinten nach vorne zeichnen
      const z = (ersteLampe + i) * abstand - strecke;
      if (z < 0.4) continue;
      const s = Kamera.groesse(z);
      for (const seite of [-1, 1]) {
        const p = Kamera.punkt(seite * 2.25, 2.5, z);
        let flackern = 0.75 + Math.sin(zeit * 6 + i * 2 + seite) * 0.12;
        // Beim Stromausfall zucken sie nur noch ganz kurz auf
        if (licht < 1) {
          const zuck = Math.sin(zeit * 17 + i * 3.7 + seite * 1.9);
          flackern *= licht * (zuck > 0.86 ? 3.2 : 0.55);
        }

        // Der Lichtschein rundherum
        const schein = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, s * 1.5);
        schein.addColorStop(0, `rgba(255, 214, 130, ${0.42 * flackern})`);
        schein.addColorStop(1, 'rgba(255, 200, 110, 0)');
        g.fillStyle = schein;
        g.beginPath();
        g.arc(p.x, p.y, s * 1.5, 0, Math.PI * 2);
        g.fill();

        // Die Lampe selbst
        g.fillStyle = `rgba(255, 235, 170, ${flackern})`;
        g.beginPath();
        g.ellipse(p.x, p.y, s * 0.11, s * 0.16, 0, 0, Math.PI * 2);
        g.fill();
      }
    }
  },

  // Dicke Rohre, die links und rechts an der Wand entlangführen
  wandRohre(g, strecke) {
    for (const seite of [-1, 1]) {
      g.strokeStyle = 'rgba(90, 105, 95, 0.55)';
      const nah = Kamera.punkt(seite * 2.45, 1.25, 0.3);
      const fern = Kamera.punkt(seite * 2.45, 1.25, 30);
      g.lineWidth = Math.max(1, Kamera.groesse(0.3) * 0.12);
      g.beginPath();
      g.moveTo(nah.x, nah.y);
      g.lineTo(fern.x, fern.y);
      g.stroke();

      // Halterungen am Rohr, die vorbeiziehen
      const abstand = 3.5;
      const erste = Math.ceil((strecke + 0.3) / abstand);
      for (let i = 8; i >= 0; i--) {
        const z = (erste + i) * abstand - strecke;
        if (z < 0.3) continue;
        const p = Kamera.punkt(seite * 2.45, 1.25, z);
        const s = Kamera.groesse(z);
        g.fillStyle = 'rgba(70, 84, 76, 0.8)';
        g.fillRect(p.x - s * 0.09, p.y - s * 0.14, s * 0.18, s * 0.28);
      }
    }
  },


  /* ==========================================================
     DER HAMSTER VON HINTEN (im Spiel)
     x, y  = Mittelpunkt unten (die Füsse)
     h     = wie hoch der Hamster auf dem Bildschirm ist
     phase = für die Lauf-Animation (Füsschen wackeln)
     ========================================================== */
  hamsterHinten(g, x, y, h, phase, springt, zeit) {
    const b = h * 0.80;                                  // Breite des Hamsters
    const wackel = springt ? 0 : Math.sin(phase * 2) * h * 0.028;
    const schritt = springt ? 0 : Math.sin(phase);       // -1 … 1, für die Beine

    g.save();
    g.translate(x, y + wackel);

    const umriss = 'rgba(74, 46, 14, 0.5)';              // weicher dunkler Rand
    const randDicke = Math.max(1, h * 0.020);

    // --- Füsschen (treten beim Rennen abwechselnd) ---
    g.fillStyle = HamsterFarben.ohrInnen;
    for (const seite of [-1, 1]) {
      const hoch = springt ? h * 0.07 : Math.max(0, seite * schritt) * h * 0.085;
      g.beginPath();
      g.ellipse(seite * b * 0.27, -hoch - h * 0.035, b * 0.145, h * 0.055, 0, 0, Math.PI * 2);
      g.fill();
    }

    // --- DIE FLATTERNDEN ENDEN DES HALSTUCHS (ganz hinten) ---
    // Sie wehen im Fahrtwind seitlich nach hinten weg – das eine
    // Ende etwas anders als das andere, damit es lebendig wirkt.
    const wind = springt ? 1.3 : 1;
    for (const seite of [-1, 1]) {
      const f = Math.sin(zeit * 8 + (seite > 0 ? 1.2 : 0)) * 0.5 + 0.5;   // 0 … 1
      const laenge = b * (0.34 + f * 0.16) * wind;
      const senken = h * (0.04 + f * 0.09);
      g.fillStyle = seite < 0 ? HamsterFarben.halstuch : HamsterFarben.halstuchDunkel;
      g.beginPath();
      g.moveTo(seite * b * 0.20, -h * 0.69);
      // nach aussen und leicht nach unten wehen
      g.quadraticCurveTo(
        seite * (b * 0.28 + laenge * 0.55), -h * 0.68 + senken * 0.3,
        seite * (b * 0.22 + laenge),        -h * 0.66 + senken
      );
      g.quadraticCurveTo(
        seite * (b * 0.30 + laenge * 0.5),  -h * 0.60 + senken * 0.6,
        seite * b * 0.20,                   -h * 0.59
      );
      g.closePath();
      g.fill();
    }

    // --- Die Hinterbeinchen (Oberschenkel), sie arbeiten beim Rennen ---
    g.fillStyle = HamsterFarben.fellDunkel;
    for (const seite of [-1, 1]) {
      const hoch = springt ? h * 0.03 : Math.max(0, seite * schritt) * h * 0.045;
      g.beginPath();
      g.ellipse(seite * b * 0.34, -h * 0.20 - hoch, b * 0.19, h * 0.16, 0, 0, Math.PI * 2);
      g.fill();
    }

    // --- Der Körper (der dicke Hamster-Po von hinten) ---
    // Das Licht kommt von den Lampen oben – darum ist er oben hell
    // und unten dunkel.
    const koerper = g.createLinearGradient(0, -h * 0.72, 0, -h * 0.02);
    koerper.addColorStop(0, HamsterFarben.fellHell);
    koerper.addColorStop(0.45, HamsterFarben.fell);
    koerper.addColorStop(1, HamsterFarben.fellDunkel);
    g.fillStyle = koerper;
    g.strokeStyle = umriss;
    g.lineWidth = randDicke;
    g.beginPath();
    g.ellipse(0, -h * 0.37, b * 0.50, h * 0.35, 0, 0, Math.PI * 2);
    g.fill();
    g.stroke();

    // --- Heller Fleck: der cremefarbene Bauch schaut unten hervor ---
    g.fillStyle = HamsterFarben.bauch;
    g.globalAlpha = 0.85;
    g.beginPath();
    g.ellipse(0, -h * 0.15, b * 0.23, h * 0.11, 0, 0, Math.PI * 2);
    g.fill();
    g.globalAlpha = 1;

    // --- Kleines Schwänzchen ---
    g.fillStyle = HamsterFarben.ohrInnen;
    g.beginPath();
    g.ellipse(0, -h * 0.30, b * 0.065, h * 0.05, 0, 0, Math.PI * 2);
    g.fill();

    // --- DAS ROTE HALSTUCH um den Hals (schmales Band) ---
    g.fillStyle = HamsterFarben.halstuch;
    g.beginPath();
    g.ellipse(0, -h * 0.655, b * 0.29, h * 0.055, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = HamsterFarben.halstuchDunkel;
    g.beginPath();
    g.ellipse(0, -h * 0.665, b * 0.095, h * 0.040, 0, 0, Math.PI * 2);
    g.fill();

    // --- Ohren (hinter dem Kopf, damit sie oben herausschauen) ---
    // Sie wippen beim Rennen ein bisschen mit.
    for (const seite of [-1, 1]) {
      const wippe = springt ? 0 : Math.sin(phase * 2 + seite) * h * 0.012;
      g.fillStyle = HamsterFarben.fellDunkel;
      g.strokeStyle = umriss;
      g.lineWidth = randDicke;
      g.beginPath();
      g.ellipse(seite * b * 0.235, -h * 0.945 + wippe, b * 0.135, h * 0.115,
                seite * 0.30, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      g.fillStyle = HamsterFarben.ohrInnen;
      g.beginPath();
      g.ellipse(seite * b * 0.235, -h * 0.935 + wippe, b * 0.072, h * 0.062,
                seite * 0.30, 0, Math.PI * 2);
      g.fill();
    }

    // --- Der Kopf (schaut über den Körper hinweg nach vorn) ---
    const kopf = g.createLinearGradient(0, -h * 0.97, 0, -h * 0.63);
    kopf.addColorStop(0, HamsterFarben.fellHell);
    kopf.addColorStop(1, HamsterFarben.fell);
    g.fillStyle = kopf;
    g.strokeStyle = umriss;
    g.lineWidth = randDicke;
    g.beginPath();
    g.ellipse(0, -h * 0.80, b * 0.30, h * 0.165, 0, 0, Math.PI * 2);
    g.fill();
    g.stroke();

    // --- Die dicken Hamsterbacken gucken links und rechts hervor ---
    g.fillStyle = HamsterFarben.fellHell;
    g.strokeStyle = umriss;
    g.lineWidth = randDicke;
    for (const seite of [-1, 1]) {
      g.beginPath();
      g.ellipse(seite * b * 0.27, -h * 0.755, b * 0.115, h * 0.090, 0, 0, Math.PI * 2);
      g.fill();
      g.stroke();
    }

    // --- Die Spitzen der Schnurrhaare schauen seitlich hervor ---
    g.strokeStyle = 'rgba(255, 255, 255, 0.38)';
    g.lineWidth = Math.max(1, h * 0.009);
    g.lineCap = 'round';
    for (const seite of [-1, 1]) {
      for (const i of [-0.5, 0.5]) {
        g.beginPath();
        g.moveTo(seite * b * 0.35, -h * 0.760);
        g.lineTo(seite * b * 0.44, -h * (0.760 + i * 0.050));
        g.stroke();
      }
    }

    // --- Glanzlicht oben auf dem Kopf (Licht der Tunnellampen) ---
    g.strokeStyle = 'rgba(255, 240, 200, 0.45)';
    g.lineWidth = Math.max(1, h * 0.030);
    g.beginPath();
    g.ellipse(0, -h * 0.80, b * 0.24, h * 0.130, 0, Math.PI * 1.18, Math.PI * 1.82);
    g.stroke();

    g.restore();
  },


  /* ==========================================================
     DER HAMSTER VON DER SEITE (im Intro)
     blick: 1 = schaut nach rechts, -1 = nach links
     ========================================================== */
  hamsterSeite(g, x, y, h, phase, rennt, zeit, drehung = 0) {
    const b = h * 1.25;

    g.save();
    g.translate(x, y);
    // Beim Purzeln dreht er sich um seine MITTE (nicht um die Füsse),
    // sonst würde er beim Drehen weit zur Seite schwingen.
    if (drehung) {
      g.translate(0, -h * 0.42);
      g.rotate(drehung);
      g.translate(0, h * 0.42);
    }
    const hopser = rennt ? Math.abs(Math.sin(phase)) * h * 0.07 : 0;
    g.translate(0, -hopser);

    // --- Das flatternde Halstuch (weht hinter ihm her, also links) ---
    const flatter = Math.sin(zeit * 10) * 0.5 + 0.5;      // 0 … 1
    const wehe = h * (0.05 + flatter * 0.13);             // wie stark es weht
    g.fillStyle = HamsterFarben.halstuchDunkel;
    g.beginPath();
    g.moveTo(b * 0.06, -h * 0.66);
    g.quadraticCurveTo(-b * 0.30, -h * 0.74 - wehe * 0.4,
                       -b * 0.78, -h * 0.66 - wehe);
    g.lineTo(-b * 0.80, -h * 0.50 - wehe);                // das abgeschnittene Ende
    g.quadraticCurveTo(-b * 0.30, -h * 0.58 - wehe * 0.3,
                       b * 0.06, -h * 0.50);
    g.closePath();
    g.fill();

    // --- Hinterbein ---
    const beinA = rennt ? Math.sin(phase) * h * 0.16 : 0;
    g.fillStyle = HamsterFarben.fellDunkel;
    g.beginPath();
    g.ellipse(-b * 0.22 + beinA, -h * 0.10, b * 0.10, h * 0.11, 0, 0, Math.PI * 2);
    g.fill();

    // --- Vorderbein ---
    const beinB = rennt ? Math.sin(phase + Math.PI) * h * 0.16 : 0;
    g.beginPath();
    g.ellipse(b * 0.20 + beinB, -h * 0.10, b * 0.09, h * 0.10, 0, 0, Math.PI * 2);
    g.fill();

    // --- Schwänzchen ---
    g.fillStyle = HamsterFarben.ohrInnen;
    g.beginPath();
    g.ellipse(-b * 0.44, -h * 0.42, b * 0.06, h * 0.07, 0.4, 0, Math.PI * 2);
    g.fill();

    // --- Der Körper ---
    const koerper = g.createLinearGradient(0, -h, 0, 0);
    koerper.addColorStop(0, HamsterFarben.fellHell);
    koerper.addColorStop(1, HamsterFarben.fell);
    g.fillStyle = koerper;
    g.beginPath();
    g.ellipse(-b * 0.08, -h * 0.42, b * 0.40, h * 0.38, 0, 0, Math.PI * 2);
    g.fill();

    // --- Heller Bauch ---
    g.fillStyle = HamsterFarben.bauch;
    g.beginPath();
    g.ellipse(-b * 0.04, -h * 0.24, b * 0.28, h * 0.18, 0, 0, Math.PI * 2);
    g.fill();

    // --- Der Kopf ---
    g.fillStyle = HamsterFarben.fell;
    g.beginPath();
    g.ellipse(b * 0.30, -h * 0.55, b * 0.25, h * 0.27, 0, 0, Math.PI * 2);
    g.fill();

    // --- Dicke Hamsterbacke ---
    g.fillStyle = HamsterFarben.fellHell;
    g.beginPath();
    g.ellipse(b * 0.30, -h * 0.44, b * 0.19, h * 0.16, 0, 0, Math.PI * 2);
    g.fill();

    // --- Ohr ---
    g.fillStyle = HamsterFarben.fellDunkel;
    g.beginPath();
    g.ellipse(b * 0.20, -h * 0.80, b * 0.09, h * 0.10, -0.2, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = HamsterFarben.ohrInnen;
    g.beginPath();
    g.ellipse(b * 0.21, -h * 0.79, b * 0.05, h * 0.055, -0.2, 0, Math.PI * 2);
    g.fill();

    // --- Näschen (wackelt beim Schnüffeln) ---
    const schnueffel = rennt ? 0 : Math.sin(zeit * 14) * b * 0.012;
    g.fillStyle = HamsterFarben.nase;
    g.beginPath();
    g.ellipse(b * 0.52 + schnueffel, -h * 0.52, b * 0.045, h * 0.035, 0, 0, Math.PI * 2);
    g.fill();

    // --- Schnurrhaare ---
    g.strokeStyle = 'rgba(255,255,255,0.6)';
    g.lineWidth = Math.max(1, h * 0.012);
    for (let i = -1; i <= 1; i++) {
      g.beginPath();
      g.moveTo(b * 0.50, -h * 0.52);
      g.lineTo(b * 0.72, -h * (0.52 + i * 0.07) + schnueffel);
      g.stroke();
    }

    // --- Auge ---
    g.fillStyle = HamsterFarben.auge;
    g.beginPath();
    g.ellipse(b * 0.36, -h * 0.62, b * 0.045, h * 0.05, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.ellipse(b * 0.375, -h * 0.64, b * 0.017, h * 0.018, 0, 0, Math.PI * 2);
    g.fill();

    // --- Das Halstuch legt sich um den Hals (unter dem Kopf herum) ---
    g.strokeStyle = HamsterFarben.halstuch;
    g.lineWidth = h * 0.12;
    g.lineCap = 'round';
    g.beginPath();
    g.ellipse(b * 0.30, -h * 0.55, b * 0.27, h * 0.29, 0, Math.PI * 0.42, Math.PI * 1.20);
    g.stroke();
    // Der Knoten am Hals
    g.fillStyle = HamsterFarben.halstuchDunkel;
    g.beginPath();
    g.ellipse(b * 0.09, -h * 0.47, b * 0.055, h * 0.055, 0, 0, Math.PI * 2);
    g.fill();

    g.restore();
  },


  /* ==========================================================
     HINDERNIS 1: DIE MODRIGE KISTE
     "ACHTUNG GEFAHR" steht drauf!
     ========================================================== */
  kiste(g, x, yBoden, b, h) {
    const links = x - b / 2;
    const oben = yBoden - h;

    // Die Holzkiste
    const holz = g.createLinearGradient(links, oben, links + b, yBoden);
    holz.addColorStop(0, '#8a6236');
    holz.addColorStop(0.5, '#6d4b28');
    holz.addColorStop(1, '#4e341b');
    g.fillStyle = holz;
    g.fillRect(links, oben, b, h);

    // Die einzelnen Holzbretter
    g.strokeStyle = 'rgba(40, 26, 12, 0.7)';
    g.lineWidth = Math.max(1, h * 0.025);
    for (let i = 1; i < 4; i++) {
      const yy = oben + (h / 4) * i;
      g.beginPath(); g.moveTo(links, yy); g.lineTo(links + b, yy); g.stroke();
    }
    // Senkrechte Trennungen – die Kiste ist so breit wie der Tunnel
    const felder = Math.max(1, Math.round(b / Math.max(1, h)));
    for (let i = 1; i < felder; i++) {
      const xx = links + (b / felder) * i;
      g.beginPath(); g.moveTo(xx, oben); g.lineTo(xx, yBoden); g.stroke();
    }

    // Grüne Moos-Flecken (weil die Kiste modrig ist)
    g.fillStyle = 'rgba(88, 132, 62, 0.62)';
    const flecken = [[0.12, 0.15, 0.13], [0.82, 0.35, 0.16], [0.30, 0.86, 0.15], [0.65, 0.72, 0.11]];
    for (const [fx, fy, fr] of flecken) {
      g.beginPath();
      g.ellipse(links + b * fx, oben + h * fy, b * fr, h * fr * 0.9, 0, 0, Math.PI * 2);
      g.fill();
    }

    // Das Warnschild (es bleibt lesbar gross, auch wenn die Kiste
    // sehr breit ist – darum richtet es sich nach der HÖHE)
    const sb = Math.min(b * 0.78, h * 1.7), sh = h * 0.44;
    const sx = x - sb / 2, sy = oben + h * 0.26;
    g.fillStyle = '#e8c53c';
    rundesRechteck(g, sx, sy, sb, sh, sh * 0.14);
    g.fill();
    g.strokeStyle = '#2a1d08';
    g.lineWidth = Math.max(1, sh * 0.07);
    g.stroke();

    // Die Schrift "ACHTUNG GEFAHR"
    g.fillStyle = '#2a1d08';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `bold ${Math.max(4, sh * 0.34)}px Arial, sans-serif`;
    g.fillText('ACHTUNG', x, sy + sh * 0.30);
    g.fillText('GEFAHR', x, sy + sh * 0.70);

    // Dunkler Rand aussen herum
    g.strokeStyle = 'rgba(25, 15, 6, 0.85)';
    g.lineWidth = Math.max(1, h * 0.035);
    g.strokeRect(links, oben, b, h);
  },


  /* ==========================================================
     HINDERNIS 2: DIE GRÜNE GIFTPFÜTZE
     Sie blubbert und leuchtet gefährlich!
     ========================================================== */
  pfuetze(g, x, yBoden, b, h, zeit) {
    // Eine Pfütze liegt flach auf dem Boden – darum ist sie viel
    // breiter als hoch.
    const rx = b / 2;
    // Flach halten: die Pfütze darf nicht höher aussehen, als sie
    // wirklich ist – sonst denkt man, man wäre dagegengesprungen.
    const ry = Math.max(2, Math.min(rx * 0.30, h * 0.95));
    const my = yBoden - ry * 0.55;          // Mittelpunkt der Pfütze

    // Giftgrünes Leuchten rundherum
    const schein = g.createRadialGradient(x, my, 0, x, my, rx * 1.4);
    schein.addColorStop(0, 'rgba(140, 255, 90, 0.38)');
    schein.addColorStop(1, 'rgba(140, 255, 90, 0)');
    g.fillStyle = schein;
    g.beginPath();
    g.ellipse(x, my, rx * 1.4, ry * 2.0, 0, 0, Math.PI * 2);
    g.fill();

    // Die Pfütze selbst
    const gift = g.createRadialGradient(x, my, 0, x, my, rx);
    gift.addColorStop(0, '#c4ff5c');
    gift.addColorStop(0.55, '#79d42b');
    gift.addColorStop(1, '#3d7a15');
    g.fillStyle = gift;
    g.beginPath();
    g.ellipse(x, my, rx, ry, 0, 0, Math.PI * 2);
    g.fill();

    // Blubberblasen, die aufsteigen
    g.fillStyle = 'rgba(216, 255, 160, 0.85)';
    for (let i = 0; i < 6; i++) {
      const t = (zeit * 0.9 + i * 0.37) % 1;
      const bx = x + Math.sin(i * 2.3) * rx * 0.55;
      const by = my - t * h * 1.8;
      const br = rx * 0.08 * (1 - t * 0.5);
      g.globalAlpha = 1 - t;
      g.beginPath();
      g.arc(bx, by, Math.max(0.5, br), 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;

    // Ein Totenkopf-Symbol als Warnung
    if (rx > 22) {
      g.fillStyle = 'rgba(20, 45, 8, 0.55)';
      g.beginPath();
      g.ellipse(x, my, rx * 0.15, ry * 0.42, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = 'rgba(210, 255, 170, 0.9)';
      g.beginPath();
      g.arc(x - rx * 0.055, my - ry * 0.10, rx * 0.035, 0, Math.PI * 2);
      g.arc(x + rx * 0.055, my - ry * 0.10, rx * 0.035, 0, Math.PI * 2);
      g.fill();
    }
  },


  /* ==========================================================
     HINDERNIS 3: GESTAPELTE KANALISATIONSRÖHREN
     Zwei unten, eine oben – das höchste Hindernis!
     ========================================================== */
  roehren(g, x, yBoden, b, h) {
    // WICHTIG: Der Radius kommt aus der HÖHE, nicht aus der Breite.
    // Nur so ist der Stapel genau so hoch, wie man springen muss –
    // sonst sieht er höher aus, als er wirklich ist, und das wäre
    // unfair. Der Stapel ist 3,7 Radien hoch (unten 1, oben 2,7).
    const r = h / 3.7;            // Radius einer Röhre
    const zeichneRohr = (rx, ry) => {
      // Der Beton-Ring
      const beton = g.createRadialGradient(rx - r * 0.4, ry - r * 0.4, r * 0.1, rx, ry, r);
      beton.addColorStop(0, '#a9aeaa');
      beton.addColorStop(0.7, '#7c827d');
      beton.addColorStop(1, '#565b57');
      g.fillStyle = beton;
      g.beginPath();
      g.arc(rx, ry, r, 0, Math.PI * 2);
      g.fill();

      // Das dunkle Loch in der Mitte
      const loch = g.createRadialGradient(rx, ry, 0, rx, ry, r * 0.6);
      loch.addColorStop(0, '#050807');
      loch.addColorStop(1, '#1d2320');
      g.fillStyle = loch;
      g.beginPath();
      g.arc(rx, ry, r * 0.6, 0, Math.PI * 2);
      g.fill();

      // Rand
      g.strokeStyle = 'rgba(35, 40, 36, 0.8)';
      g.lineWidth = Math.max(1, r * 0.08);
      g.beginPath();
      g.arc(rx, ry, r, 0, Math.PI * 2);
      g.stroke();

      // Ein bisschen Moos unten am Rohr
      g.fillStyle = 'rgba(96, 138, 70, 0.5)';
      g.beginPath();
      g.ellipse(rx - r * 0.4, ry + r * 0.7, r * 0.35, r * 0.18, 0, 0, Math.PI * 2);
      g.fill();
    };

    // Sechs Röhren unten – der Stapel sperrt den ganzen Weg,
    // damit man nicht einfach seitlich vorbeilaufen kann
    for (const versatz of [-4.75, -2.85, -0.95, 0.95, 2.85, 4.75]) {
      zeichneRohr(x + r * versatz, yBoden - r);
    }
    // Fünf Röhren obendrauf
    for (const versatz of [-3.8, -1.9, 0, 1.9, 3.8]) {
      zeichneRohr(x + r * versatz, yBoden - r * 2.7);
    }
  },


  /* ==========================================================
     DINGE FÜR DAS INTRO
     ========================================================== */

  // Eine leckere Pizza mit Dampf
  pizza(g, x, y, groesse, zeit) {
    const r = groesse;

    // Duft-Dampf, der nach oben steigt
    g.strokeStyle = 'rgba(255, 255, 255, 0.28)';
    g.lineWidth = Math.max(1.5, r * 0.07);
    for (let i = 0; i < 3; i++) {
      const versatz = (zeit * 0.6 + i * 0.33) % 1;
      g.globalAlpha = (1 - versatz) * 0.7;
      g.beginPath();
      const bx = x + (i - 1) * r * 0.45;
      const by = y - r * 0.4 - versatz * r * 1.8;
      g.moveTo(bx, by);
      g.quadraticCurveTo(bx + r * 0.25, by - r * 0.3, bx, by - r * 0.6);
      g.quadraticCurveTo(bx - r * 0.25, by - r * 0.9, bx, by - r * 1.2);
      g.stroke();
    }
    g.globalAlpha = 1;

    // Der Teller
    g.fillStyle = '#e6e6ea';
    g.beginPath();
    g.ellipse(x, y, r * 1.25, r * 0.42, 0, 0, Math.PI * 2);
    g.fill();

    // Der Pizzaboden
    g.fillStyle = '#d9a04a';
    g.beginPath();
    g.ellipse(x, y - r * 0.12, r, r * 0.34, 0, 0, Math.PI * 2);
    g.fill();

    // Der Käse
    g.fillStyle = '#f2c94c';
    g.beginPath();
    g.ellipse(x, y - r * 0.16, r * 0.86, r * 0.28, 0, 0, Math.PI * 2);
    g.fill();

    // Die Salami
    g.fillStyle = '#c0392b';
    const salami = [[-0.45, -0.1], [0.1, -0.4], [0.5, 0.0], [-0.1, 0.25], [0.35, 0.35], [-0.5, 0.3]];
    for (const [sx, sy] of salami) {
      g.beginPath();
      g.ellipse(x + sx * r * 0.8, y - r * 0.16 + sy * r * 0.22, r * 0.14, r * 0.055, 0, 0, Math.PI * 2);
      g.fill();
    }

    // Grüne Kräuter
    g.fillStyle = '#4a8b3a';
    for (let i = 0; i < 7; i++) {
      const a = i * 2.1;
      g.beginPath();
      g.ellipse(x + Math.cos(a) * r * 0.55, y - r * 0.16 + Math.sin(a) * r * 0.15, r * 0.035, r * 0.02, a, 0, Math.PI * 2);
      g.fill();
    }
  },

  /* ==========================================================
     DIE POLIZISTINNEN Isa und Anja
     Viel zu gross zum Drüberspringen! Man muss seitlich an
     ihnen vorbei. haarFarbe: Isa braun, Anja blond.
     Anja trägt zusätzlich eine Knarre.
     ========================================================== */
  polizistin(g, x, yBoden, b, h, name, haarFarbe, mitKnarre) {
    const kopfR = b * 0.30;                    // Grösse des Kopfes
    const kopfY = yBoden - h * 0.80;
    const schulterY = yBoden - h * 0.62;

    // --- Beine (dunkle Uniformhose) ---
    g.fillStyle = '#1d2740';
    for (const seite of [-1, 1]) {
      rundesRechteck(g, x + seite * b * 0.28 - b * 0.16, yBoden - h * 0.44,
                     b * 0.32, h * 0.44, b * 0.09);
      g.fill();
    }
    // --- Schuhe ---
    g.fillStyle = '#0d1018';
    for (const seite of [-1, 1]) {
      rundesRechteck(g, x + seite * b * 0.28 - b * 0.20, yBoden - h * 0.06,
                     b * 0.40, h * 0.06, h * 0.02);
      g.fill();
    }

    // --- Der Oberkörper ---
    const uniform = g.createLinearGradient(x, schulterY, x, yBoden - h * 0.40);
    uniform.addColorStop(0, '#2f4370');
    uniform.addColorStop(1, '#1b2749');
    g.fillStyle = uniform;
    rundesRechteck(g, x - b * 0.46, schulterY, b * 0.92, h * 0.26, b * 0.14);
    g.fill();

    // --- Der Gürtel ---
    g.fillStyle = '#12161f';
    g.fillRect(x - b * 0.46, yBoden - h * 0.42, b * 0.92, h * 0.05);
    g.fillStyle = '#d9c15a';
    g.fillRect(x - b * 0.07, yBoden - h * 0.425, b * 0.14, h * 0.06);

    // --- Die verschränkten Arme (das macht sie so grimmig) ---
    g.fillStyle = '#25335c';
    rundesRechteck(g, x - b * 0.50, schulterY + h * 0.07, b * 1.00, h * 0.10, h * 0.045);
    g.fill();
    // Die Hände, die auf den Oberarmen liegen
    g.fillStyle = '#e8b48c';
    for (const seite of [-1, 1]) {
      g.beginPath();
      g.ellipse(x + seite * b * 0.40, schulterY + h * 0.12, b * 0.10, h * 0.038, 0, 0, Math.PI * 2);
      g.fill();
    }

    // --- Das Namensschild auf der Brust ---
    if (b > 40) {
      g.fillStyle = '#e6e8ec';
      rundesRechteck(g, x - b * 0.24, schulterY + h * 0.005, b * 0.48, h * 0.055, h * 0.012);
      g.fill();
      g.fillStyle = '#16203a';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.font = `bold ${Math.max(4, h * 0.042)}px Arial, sans-serif`;
      g.fillText(name.toUpperCase(), x, schulterY + h * 0.033);
    }

    // --- Der Hals ---
    g.fillStyle = '#d9a279';
    g.fillRect(x - b * 0.11, kopfY + kopfR * 0.55, b * 0.22, h * 0.06);

    // --- Die langen Haare (schauen unter der Mütze hervor) ---
    g.fillStyle = haarFarbe || '#6b4326';
    for (const seite of [-1, 1]) {
      g.beginPath();
      g.ellipse(x + seite * kopfR * 0.92, kopfY + kopfR * 0.55,
                kopfR * 0.34, kopfR * 1.05, seite * 0.14, 0, Math.PI * 2);
      g.fill();
    }

    // --- Der Kopf ---
    g.fillStyle = '#e8b48c';
    g.beginPath();
    g.arc(x, kopfY, kopfR, 0, Math.PI * 2);
    g.fill();

    // --- Grimmiger Mund ---
    g.strokeStyle = '#8a5236';
    g.lineWidth = Math.max(1, kopfR * 0.13);
    g.lineCap = 'round';
    g.beginPath();
    g.arc(x, kopfY + kopfR * 0.75, kopfR * 0.40, Math.PI * 1.15, Math.PI * 1.85);
    g.stroke();

    // --- DIE SONNENBRILLE ---
    g.fillStyle = '#0a0c10';
    rundesRechteck(g, x - kopfR * 0.92, kopfY - kopfR * 0.30,
                   kopfR * 1.84, kopfR * 0.52, kopfR * 0.16);
    g.fill();
    // Ein Glanzstreifen auf den Gläsern
    g.fillStyle = 'rgba(255,255,255,0.30)';
    g.beginPath();
    g.moveTo(x - kopfR * 0.78, kopfY - kopfR * 0.20);
    g.lineTo(x - kopfR * 0.44, kopfY - kopfR * 0.20);
    g.lineTo(x - kopfR * 0.62, kopfY + kopfR * 0.12);
    g.lineTo(x - kopfR * 0.90, kopfY + kopfR * 0.12);
    g.closePath();
    g.fill();

    // --- Die Polizeimütze ---
    g.fillStyle = '#1b2749';
    g.beginPath();
    g.ellipse(x, kopfY - kopfR * 0.72, kopfR * 1.06, kopfR * 0.52, 0, Math.PI, Math.PI * 2);
    g.fill();
    g.fillRect(x - kopfR * 1.06, kopfY - kopfR * 0.74, kopfR * 2.12, kopfR * 0.26);
    // Der Schirm
    g.fillStyle = '#0d1220';
    g.beginPath();
    g.ellipse(x, kopfY - kopfR * 0.46, kopfR * 1.24, kopfR * 0.20, 0, 0, Math.PI * 2);
    g.fill();
    // Das goldene Abzeichen
    g.fillStyle = '#ecc94b';
    stern(g, x, kopfY - kopfR * 0.94, kopfR * 0.22, 5);
    g.fill();

    // --- DIE KNARRE (nur Anja): liegt quer in der rechten Hand ---
    if (mitKnarre) {
      const hx = x + b * 0.40, hy = schulterY + h * 0.115;
      g.fillStyle = '#23272e';
      // Der Lauf
      rundesRechteck(g, hx - b * 0.06, hy - h * 0.055, b * 0.34, h * 0.035, h * 0.012);
      g.fill();
      // Der Griff
      rundesRechteck(g, hx - b * 0.045, hy - h * 0.030, b * 0.10, h * 0.055, h * 0.012);
      g.fill();
      // Ein kleiner Glanzpunkt
      g.fillStyle = 'rgba(255,255,255,0.35)';
      g.fillRect(hx + b * 0.06, hy - h * 0.049, b * 0.16, h * 0.008);
    }
  },

  /* ==========================================================
     AYMO – ein Junge, der auf einer Katze reitet.
     Die Katze trägt einen richtigen Sattel!
     ========================================================== */
  jungeAufKatze(g, x, yBoden, b, h, zeit) {
    const wackel = Math.sin(zeit * 6) * h * 0.015;
    g.save();
    g.translate(x, yBoden + wackel);

    /* ---------- DIE KATZE (rot getigert) ---------- */
    const kH = h * 0.42;
    // Der Schwanz schwingt hoch hinauf
    g.strokeStyle = '#d98c3f';
    g.lineWidth = Math.max(2, b * 0.09);
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(-b * 0.44, -kH * 0.60);
    g.quadraticCurveTo(-b * 0.80, -kH * 0.80 + Math.sin(zeit * 4) * kH * 0.15,
                       -b * 0.72, -kH * 1.45);
    g.stroke();
    // Beine
    g.fillStyle = '#c97a2f';
    for (const vx of [-0.30, -0.08, 0.18, 0.40]) {
      rundesRechteck(g, b * vx - b * 0.05, -kH * 0.35, b * 0.10, kH * 0.35, b * 0.04);
      g.fill();
    }
    // Der Körper
    const fell = g.createLinearGradient(0, -kH, 0, 0);
    fell.addColorStop(0, '#e89a4a');
    fell.addColorStop(1, '#c9782e');
    g.fillStyle = fell;
    g.beginPath();
    g.ellipse(0, -kH * 0.62, b * 0.50, kH * 0.40, 0, 0, Math.PI * 2);
    g.fill();
    // Tigerstreifen
    g.strokeStyle = 'rgba(140, 74, 20, 0.55)';
    g.lineWidth = Math.max(1, b * 0.045);
    for (const sx of [-0.28, -0.05, 0.18]) {
      g.beginPath();
      g.moveTo(b * sx, -kH * 0.95);
      g.quadraticCurveTo(b * (sx + 0.05), -kH * 0.62, b * sx, -kH * 0.35);
      g.stroke();
    }
    // Der Kopf mit spitzen Ohren
    g.fillStyle = '#e89a4a';
    g.beginPath();
    g.arc(b * 0.48, -kH * 0.85, b * 0.22, 0, Math.PI * 2);
    g.fill();
    for (const seite of [-1, 1]) {
      g.beginPath();
      g.moveTo(b * (0.48 + seite * 0.06), -kH * 1.06);
      g.lineTo(b * (0.48 + seite * 0.20), -kH * 1.32);
      g.lineTo(b * (0.48 + seite * 0.19), -kH * 1.00);
      g.closePath();
      g.fill();
    }
    // Gesicht der Katze
    g.fillStyle = '#2a1d10';
    g.beginPath();
    g.arc(b * 0.44, -kH * 0.90, b * 0.028, 0, Math.PI * 2);
    g.arc(b * 0.56, -kH * 0.90, b * 0.028, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#e08a9a';
    g.beginPath();
    g.moveTo(b * 0.50, -kH * 0.80);
    g.lineTo(b * 0.46, -kH * 0.74);
    g.lineTo(b * 0.54, -kH * 0.74);
    g.closePath();
    g.fill();
    // Schnurrhaare
    g.strokeStyle = 'rgba(255,255,255,0.6)';
    g.lineWidth = Math.max(1, b * 0.015);
    for (let i = -1; i <= 1; i++) {
      g.beginPath();
      g.moveTo(b * 0.58, -kH * 0.78);
      g.lineTo(b * 0.76, -kH * (0.78 + i * 0.10));
      g.stroke();
    }

    // --- DER SATTEL (braun, mit Gurt und Steigbügel) ---
    g.fillStyle = '#6e3f1d';
    g.beginPath();
    g.ellipse(-b * 0.02, -kH * 0.95, b * 0.26, kH * 0.14, 0, Math.PI, Math.PI * 2);
    g.fill();
    g.fillRect(-b * 0.28, -kH * 0.98, b * 0.52, kH * 0.10);
    // Der Sattelgurt um den Bauch
    g.strokeStyle = '#54301a';
    g.lineWidth = Math.max(2, b * 0.05);
    g.beginPath();
    g.moveTo(-b * 0.02, -kH * 0.90);
    g.lineTo(-b * 0.02, -kH * 0.24);
    g.stroke();
    // Steigbügel
    g.strokeStyle = '#c9c9c9';
    g.lineWidth = Math.max(1, b * 0.03);
    g.beginPath();
    g.arc(b * 0.16, -kH * 0.30, b * 0.06, 0, Math.PI * 2);
    g.stroke();

    /* ---------- AYMO OBENDRAUF ---------- */
    const sY = -kH * 1.02;
    const sH = h - kH * 1.02;
    // Bein
    g.strokeStyle = '#3f6fb5';
    g.lineWidth = Math.max(2, b * 0.10);
    g.beginPath();
    g.moveTo(-b * 0.02, sY - sH * 0.12);
    g.lineTo(b * 0.14, sY + kH * 0.32);
    g.stroke();
    g.fillStyle = '#2c3e50';
    g.beginPath();
    g.ellipse(b * 0.16, sY + kH * 0.36, b * 0.10, kH * 0.08, 0, 0, Math.PI * 2);
    g.fill();
    // Oberkörper (rotes T-Shirt)
    const shirt = g.createLinearGradient(0, sY - sH * 0.50, 0, sY);
    shirt.addColorStop(0, '#e05a4e');
    shirt.addColorStop(1, '#b03a30');
    g.fillStyle = shirt;
    rundesRechteck(g, -b * 0.19, sY - sH * 0.46, b * 0.38, sH * 0.46, b * 0.10);
    g.fill();
    // Arme: einer hält die Zügel, einer winkt frech
    g.strokeStyle = '#f2c9a0';
    g.lineWidth = Math.max(2, b * 0.09);
    g.beginPath();
    g.moveTo(b * 0.12, sY - sH * 0.34);
    g.lineTo(b * 0.38, sY - sH * 0.12);
    g.moveTo(-b * 0.12, sY - sH * 0.34);
    g.lineTo(-b * 0.34, sY - sH * (0.52 + Math.sin(zeit * 3) * 0.06));
    g.stroke();
    // Zügel zur Katze
    g.strokeStyle = '#54301a';
    g.lineWidth = Math.max(1, b * 0.03);
    g.beginPath();
    g.moveTo(b * 0.38, sY - sH * 0.12);
    g.quadraticCurveTo(b * 0.50, sY - sH * 0.02, b * 0.52, -kH * 0.90);
    g.stroke();
    // Kopf mit braunen kurzen Haaren
    g.fillStyle = '#f7d5ad';
    g.beginPath();
    g.arc(0, sY - sH * 0.66, b * 0.20, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#6b4326';
    g.beginPath();
    g.arc(0, sY - sH * 0.70, b * 0.21, Math.PI * 0.95, Math.PI * 2.05);
    g.fill();
    // Augen und Grinsen
    if (b > 26) {
      g.fillStyle = '#3a2a18';
      g.beginPath();
      g.arc(-b * 0.07, sY - sH * 0.66, b * 0.030, 0, Math.PI * 2);
      g.arc(b * 0.07, sY - sH * 0.66, b * 0.030, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = '#a9573f';
      g.lineWidth = Math.max(1, b * 0.03);
      g.beginPath();
      g.arc(0, sY - sH * 0.62, b * 0.09, 0.2 * Math.PI, 0.8 * Math.PI);
      g.stroke();
    }
    g.restore();
  },

  /* ==========================================================
     GÖTTI MU – der Jogger. Er rennt zwischen den Spuren hin
     und her. Sein Käppi wechselt die Farbe (blau/grau/weiss)
     und darauf steht sein Name: MU.
     ========================================================== */
  goettiMu(g, x, yBoden, b, h, zeit, kappiFarbe) {
    const schritt = Math.sin(zeit * 11);
    const hopser = Math.abs(Math.cos(zeit * 11)) * h * 0.03;
    g.save();
    g.translate(x, yBoden - hopser);

    // --- Joggende Beine ---
    g.strokeStyle = '#f2c9a0';
    g.lineWidth = Math.max(2, b * 0.11);
    g.lineCap = 'round';
    for (const seite of [-1, 1]) {
      const knick = seite * schritt;
      g.beginPath();
      g.moveTo(seite * b * 0.10, -h * 0.42);
      g.lineTo(seite * b * 0.10 + knick * b * 0.16, -h * 0.22);
      g.lineTo(seite * b * 0.10 + knick * b * 0.28, -h * (0.04 - Math.max(0, knick) * 0.06));
      g.stroke();
    }
    // Turnschuhe
    g.fillStyle = '#e8e8e8';
    for (const seite of [-1, 1]) {
      const knick = seite * schritt;
      g.beginPath();
      g.ellipse(seite * b * 0.10 + knick * b * 0.30,
                -h * (0.035 - Math.max(0, knick) * 0.06),
                b * 0.13, h * 0.035, 0, 0, Math.PI * 2);
      g.fill();
    }
    // Sporthose
    g.fillStyle = '#2f5d3a';
    rundesRechteck(g, -b * 0.22, -h * 0.52, b * 0.44, h * 0.14, b * 0.05);
    g.fill();

    // --- Das Sportshirt ---
    const shirt = g.createLinearGradient(0, -h * 0.80, 0, -h * 0.50);
    shirt.addColorStop(0, '#f5f0e6');
    shirt.addColorStop(1, '#d8d2c4');
    g.fillStyle = shirt;
    rundesRechteck(g, -b * 0.24, -h * 0.80, b * 0.48, h * 0.30, b * 0.08);
    g.fill();

    // --- Pumpende Jogger-Arme (angewinkelt) ---
    g.strokeStyle = '#f2c9a0';
    g.lineWidth = Math.max(2, b * 0.10);
    for (const seite of [-1, 1]) {
      const schwungArm = -seite * schritt;
      g.beginPath();
      g.moveTo(seite * b * 0.22, -h * 0.74);
      g.lineTo(seite * b * 0.34, -h * 0.62);
      g.lineTo(seite * b * (0.20 + schwungArm * 0.10), -h * (0.62 + schwungArm * 0.07));
      g.stroke();
    }

    // --- Der Kopf ---
    g.fillStyle = '#f2c9a0';
    g.beginPath();
    g.arc(0, -h * 0.885, b * 0.185, 0, Math.PI * 2);
    g.fill();
    // Schweisstropfen
    g.fillStyle = 'rgba(140, 210, 255, 0.85)';
    g.beginPath();
    g.arc(b * 0.24, -h * 0.94 + (zeit * h * 0.4) % (h * 0.12), b * 0.030, 0, Math.PI * 2);
    g.fill();
    // Gesicht: konzentriert
    if (b > 26) {
      g.fillStyle = '#3a2a18';
      g.beginPath();
      g.arc(-b * 0.06, -h * 0.885, b * 0.026, 0, Math.PI * 2);
      g.arc(b * 0.06, -h * 0.885, b * 0.026, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = '#a9573f';
      g.lineWidth = Math.max(1, b * 0.025);
      g.beginPath();
      g.moveTo(-b * 0.05, -h * 0.835);
      g.lineTo(b * 0.05, -h * 0.835);
      g.stroke();
    }

    // --- DAS KÄPPI mit seinem Namen ---
    g.fillStyle = kappiFarbe;
    g.beginPath();
    g.arc(0, -h * 0.94, b * 0.19, Math.PI, Math.PI * 2);
    g.fill();
    g.fillRect(-b * 0.19, -h * 0.945, b * 0.38, h * 0.028);
    // Der Schirm nach vorn
    g.beginPath();
    g.ellipse(b * 0.10, -h * 0.918, b * 0.20, h * 0.022, 0.12, 0, Math.PI * 2);
    g.fill();
    // "MU" auf dem Käppi
    if (b > 30) {
      g.fillStyle = (kappiFarbe === '#f2f2f2') ? '#333a45' : '#f2f2f2';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.font = 'bold ' + Math.max(4, h * 0.055) + 'px Arial, sans-serif';
      g.fillText('MU', 0, -h * 0.975);
    }

    // --- Kleine Tempo-Striche hinter ihm ---
    g.strokeStyle = 'rgba(255,255,255,0.35)';
    g.lineWidth = Math.max(1, b * 0.03);
    for (let i = 0; i < 3; i++) {
      const versatz = ((zeit * 3 + i * 0.33) % 1);
      g.globalAlpha = 1 - versatz;
      g.beginPath();
      g.moveTo(-b * (0.45 + versatz * 0.35), -h * (0.35 + i * 0.18));
      g.lineTo(-b * (0.62 + versatz * 0.35), -h * (0.35 + i * 0.18));
      g.stroke();
    }
    g.globalAlpha = 1;
    g.restore();
  },

  /* ==========================================================
     MARIANNE – sie steht auf einer Spur und wischt mit einem
     grossen Besen die Nachbarspuren. Über den BESEN kann man
     springen, über Marianne nicht!
     besenDX = wie weit der Besenkopf gerade zur Seite ist
     ========================================================== */
  marianne(g, x, yBoden, b, h, zeit, besenDX) {
    g.save();
    g.translate(x, yBoden);

    // --- DER BESEN zuerst (er liegt vor ihr am Boden) ---
    const griffX = besenDX * 0.42;
    g.strokeStyle = '#8a6234';
    g.lineWidth = Math.max(2, b * 0.055);
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(griffX * 0.3, -h * 0.52);
    g.lineTo(besenDX, -h * 0.10);
    g.stroke();
    // Der Besenkopf mit Borsten
    g.save();
    g.translate(besenDX, -h * 0.065);
    g.fillStyle = '#a8823f';
    rundesRechteck(g, -b * 0.28, -h * 0.045, b * 0.56, h * 0.05, h * 0.015);
    g.fill();
    g.strokeStyle = '#d9b465';
    g.lineWidth = Math.max(1, b * 0.028);
    for (let i = -4; i <= 4; i++) {
      g.beginPath();
      g.moveTo(i * b * 0.06, h * 0.005);
      g.lineTo(i * b * 0.06 + Math.sin(zeit * 9) * b * 0.02, h * 0.065);
      g.stroke();
    }
    g.restore();
    // Staubwölkchen am Besenkopf
    g.fillStyle = 'rgba(200, 195, 180, 0.35)';
    for (let i = 0; i < 3; i++) {
      const w = (zeit * 2 + i * 0.4) % 1;
      g.beginPath();
      g.arc(besenDX - b * 0.2 + i * b * 0.2, -h * (0.06 + w * 0.10),
            b * (0.05 + w * 0.05), 0, Math.PI * 2);
      g.fill();
    }

    // --- Der Rock ---
    const rock = g.createLinearGradient(0, -h * 0.60, 0, -h * 0.06);
    rock.addColorStop(0, '#8a5f9e');
    rock.addColorStop(1, '#5e3d70');
    g.fillStyle = rock;
    g.beginPath();
    g.moveTo(-b * 0.20, -h * 0.60);
    g.lineTo(b * 0.20, -h * 0.60);
    g.lineTo(b * 0.36, -h * 0.06);
    g.lineTo(-b * 0.36, -h * 0.06);
    g.closePath();
    g.fill();
    // Schürze darüber
    g.fillStyle = '#f0e8d8';
    g.beginPath();
    g.moveTo(-b * 0.13, -h * 0.56);
    g.lineTo(b * 0.13, -h * 0.56);
    g.lineTo(b * 0.20, -h * 0.10);
    g.lineTo(-b * 0.20, -h * 0.10);
    g.closePath();
    g.fill();
    // Schuhe
    g.fillStyle = '#4a3626';
    for (const seite of [-1, 1]) {
      g.beginPath();
      g.ellipse(seite * b * 0.14, -h * 0.03, b * 0.11, h * 0.032, 0, 0, Math.PI * 2);
      g.fill();
    }

    // --- Oberkörper (Bluse) ---
    g.fillStyle = '#c9769c';
    rundesRechteck(g, -b * 0.20, -h * 0.82, b * 0.40, h * 0.24, b * 0.08);
    g.fill();

    // --- Beide Arme halten den Besenstiel ---
    g.strokeStyle = '#f2c9a0';
    g.lineWidth = Math.max(2, b * 0.09);
    g.beginPath();
    g.moveTo(-b * 0.16, -h * 0.72);
    g.lineTo(griffX * 0.30, -h * 0.52);
    g.moveTo(b * 0.16, -h * 0.72);
    g.lineTo(griffX * 0.36 + b * 0.05, -h * 0.46);
    g.stroke();

    // --- Der Kopf mit grauem Haarknoten (Dutt) ---
    g.fillStyle = '#f7d5ad';
    g.beginPath();
    g.arc(0, -h * 0.90, b * 0.175, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#b9b3ab';
    g.beginPath();
    g.arc(0, -h * 0.935, b * 0.18, Math.PI * 0.95, Math.PI * 2.05);
    g.fill();
    g.beginPath();
    g.arc(0, -h * 1.045, b * 0.085, 0, Math.PI * 2);
    g.fill();
    // Freundlich-strenges Gesicht
    if (b > 26) {
      g.fillStyle = '#3a2a18';
      g.beginPath();
      g.arc(-b * 0.06, -h * 0.90, b * 0.024, 0, Math.PI * 2);
      g.arc(b * 0.06, -h * 0.90, b * 0.024, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = '#a9573f';
      g.lineWidth = Math.max(1, b * 0.025);
      g.beginPath();
      g.moveTo(-b * 0.05, -h * 0.845);
      g.lineTo(b * 0.05, -h * 0.85);
      g.stroke();
    }
    g.restore();
  },

  /* ==========================================================
     LEYAN – der Kammerjäger auf seinem braunen Huhn. Aus dem
     Schlauch in seiner Hand sprüht er eine grüne Giftwolke.
     ========================================================== */
  kammerjaegerAufHuhn(g, x, yBoden, b, h, zeit, spruehRichtung) {
    const wackel = Math.sin(zeit * 9) * h * 0.018;
    g.save();
    g.translate(x, yBoden + wackel);

    /* ---------- DAS BRAUNE HUHN ---------- */
    const hH = h * 0.40;
    // Beine
    g.strokeStyle = '#d9a23f';
    g.lineWidth = Math.max(2, b * 0.045);
    g.lineCap = 'round';
    for (const seite of [-1, 1]) {
      const tritt = Math.max(0, seite * Math.sin(zeit * 10)) * hH * 0.14;
      g.beginPath();
      g.moveTo(seite * b * 0.12, -hH * 0.30);
      g.lineTo(seite * b * 0.14, -tritt - hH * 0.02);
      g.moveTo(seite * b * 0.14, -tritt - hH * 0.02);
      g.lineTo(seite * b * 0.24, -tritt - hH * 0.02);
      g.stroke();
    }
    // Der Körper
    const feder = g.createLinearGradient(0, -hH, 0, 0);
    feder.addColorStop(0, '#9a6b3d');
    feder.addColorStop(1, '#6e4a26');
    g.fillStyle = feder;
    g.beginPath();
    g.ellipse(0, -hH * 0.62, b * 0.46, hH * 0.42, 0, 0, Math.PI * 2);
    g.fill();
    // Der Flügel
    g.fillStyle = '#7d5530';
    g.beginPath();
    g.ellipse(-b * 0.06, -hH * 0.60, b * 0.24, hH * 0.22, -0.25, 0, Math.PI * 2);
    g.fill();
    // Schwanzfedern
    g.fillStyle = '#5c3d1f';
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.ellipse(-b * 0.46, -hH * (0.78 + i * 0.12), b * 0.16, hH * 0.07,
                -0.6 - i * 0.2, 0, Math.PI * 2);
      g.fill();
    }
    // Hals und Kopf
    g.fillStyle = '#8a5e33';
    rundesRechteck(g, b * 0.32, -hH * 1.15, b * 0.14, hH * 0.55, b * 0.06);
    g.fill();
    g.beginPath();
    g.arc(b * 0.40, -hH * 1.18, b * 0.135, 0, Math.PI * 2);
    g.fill();
    // Roter Kamm
    g.fillStyle = '#d43a2f';
    for (const dx of [-0.04, 0.02, 0.08]) {
      g.beginPath();
      g.arc(b * (0.38 + dx), -hH * 1.32, b * 0.045, 0, Math.PI * 2);
      g.fill();
    }
    // Schnabel und Auge
    g.fillStyle = '#f2b53a';
    g.beginPath();
    g.moveTo(b * 0.52, -hH * 1.20);
    g.lineTo(b * 0.66, -hH * 1.14);
    g.lineTo(b * 0.52, -hH * 1.10);
    g.closePath();
    g.fill();
    g.fillStyle = '#20160a';
    g.beginPath();
    g.arc(b * 0.43, -hH * 1.21, b * 0.028, 0, Math.PI * 2);
    g.fill();

    /* ---------- LEYAN OBENDRAUF (mit Gifttank) ---------- */
    const sY = -hH * 0.98;
    const sH = h - hH * 0.98;
    // Bein
    g.strokeStyle = '#d8d2c4';
    g.lineWidth = Math.max(2, b * 0.10);
    g.beginPath();
    g.moveTo(-b * 0.02, sY - sH * 0.12);
    g.lineTo(b * 0.13, sY + hH * 0.30);
    g.stroke();
    // Der GIFTTANK auf dem Rücken
    g.fillStyle = '#5f8f4a';
    rundesRechteck(g, -b * 0.40, sY - sH * 0.52, b * 0.17, sH * 0.40, b * 0.06);
    g.fill();
    g.fillStyle = '#446b33';
    g.fillRect(-b * 0.375, sY - sH * 0.56, b * 0.10, sH * 0.05);
    // Warnzeichen auf dem Tank
    if (b > 30) {
      g.fillStyle = '#f2d13a';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.font = 'bold ' + Math.max(4, sH * 0.16) + 'px Arial, sans-serif';
      g.fillText('☠', -b * 0.315, sY - sH * 0.32);
    }
    // Overall (Schutzanzug, hell)
    const anzug = g.createLinearGradient(0, sY - sH * 0.50, 0, sY);
    anzug.addColorStop(0, '#e8e2d2');
    anzug.addColorStop(1, '#c4bda9');
    g.fillStyle = anzug;
    rundesRechteck(g, -b * 0.19, sY - sH * 0.46, b * 0.38, sH * 0.46, b * 0.10);
    g.fill();
    // DER SCHLAUCH: vom Tank in seine Hand, dann Sprührohr zur Seite
    const handX = spruehRichtung * b * 0.42;
    const handY = sY - sH * 0.20;
    g.strokeStyle = '#3d4a3a';
    g.lineWidth = Math.max(2, b * 0.045);
    g.beginPath();
    g.moveTo(-b * 0.32, sY - sH * 0.24);
    g.quadraticCurveTo(-b * 0.20, sY + sH * 0.02, handX * 0.6, handY + sH * 0.06);
    g.lineTo(handX, handY);
    g.stroke();
    // Das Sprührohr mit Düse
    g.strokeStyle = '#8a929e';
    g.lineWidth = Math.max(2, b * 0.055);
    g.beginPath();
    g.moveTo(handX, handY);
    g.lineTo(handX + spruehRichtung * b * 0.28, handY - sH * 0.02);
    g.stroke();
    // Arm zur Düse
    g.strokeStyle = '#e8e2d2';
    g.lineWidth = Math.max(2, b * 0.09);
    g.beginPath();
    g.moveTo(spruehRichtung * b * 0.12, sY - sH * 0.34);
    g.lineTo(handX, handY);
    g.stroke();
    // Kopf mit Schutzmaske
    g.fillStyle = '#f7d5ad';
    g.beginPath();
    g.arc(0, sY - sH * 0.66, b * 0.20, 0, Math.PI * 2);
    g.fill();
    // Weisse Maske über Mund und Nase
    g.fillStyle = '#f2f2f2';
    g.beginPath();
    g.ellipse(b * 0.03, sY - sH * 0.62, b * 0.13, b * 0.10, 0, 0, Math.PI * 2);
    g.fill();
    // Schutzbrille
    g.fillStyle = '#3d4a3a';
    rundesRechteck(g, -b * 0.14, sY - sH * 0.745, b * 0.30, sH * 0.075, b * 0.03);
    g.fill();
    g.fillStyle = 'rgba(160, 220, 170, 0.6)';
    rundesRechteck(g, -b * 0.115, sY - sH * 0.735, b * 0.11, sH * 0.055, b * 0.02);
    g.fill();
    // Kurze schwarze Haare
    g.fillStyle = '#2a2a2a';
    g.beginPath();
    g.arc(0, sY - sH * 0.72, b * 0.205, Math.PI * 1.02, Math.PI * 1.98);
    g.fill();
    g.restore();
  },

  /* ==========================================================
     Die grüne GIFTWOLKE, die Leyan versprüht
     ========================================================== */
  giftwolke(g, x, yBoden, b, zeit) {
    // Eine dichte Wolke aus vielen Schwaden – man muss sie schon
    // von Weitem deutlich sehen, um rechtzeitig auszuweichen.
    for (let i = 0; i < 9; i++) {
      const w = (zeit * 0.7 + i * 0.13) % 1;
      const wx = x + Math.sin(i * 2.1 + zeit * 1.6) * b * 0.42;
      const wy = yBoden - b * (0.20 + w * 0.95) - i * b * 0.05;
      const wr = b * (0.42 + w * 0.28 + i * 0.03);
      const puff = g.createRadialGradient(wx, wy, 0, wx, wy, wr);
      puff.addColorStop(0, 'rgba(150, 235, 95, ' + (0.62 * (1 - w * 0.45)) + ')');
      puff.addColorStop(0.55, 'rgba(120, 205, 75, ' + (0.30 * (1 - w * 0.5)) + ')');
      puff.addColorStop(1, 'rgba(110, 190, 70, 0)');
      g.fillStyle = puff;
      g.beginPath();
      g.arc(wx, wy, wr, 0, Math.PI * 2);
      g.fill();
    }
    // Kleine Blubberblasen darin
    g.fillStyle = 'rgba(205, 250, 155, 0.65)';
    for (let i = 0; i < 6; i++) {
      const w = (zeit * 1.4 + i * 0.17) % 1;
      g.beginPath();
      g.arc(x + Math.sin(i * 3 + zeit * 2) * b * 0.35, yBoden - b * (0.2 + w * 0.95),
            b * 0.055 * (1 - w * 0.7), 0, Math.PI * 2);
      g.fill();
    }
    // Ein Totenkopf schwebt in der Wolke – Warnung!
    if (b > 45) {
      g.globalAlpha *= 0.55 + Math.sin(zeit * 3) * 0.25;
      g.fillStyle = '#dfffcc';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.font = (b * 0.42) + 'px Arial, sans-serif';
      g.fillText('☠', x, yBoden - b * 0.72);
      g.globalAlpha = 1;
    }
  },

  /* ==========================================================
     Ein STROMKABEL, das aus der Wand hängt. Am Ende sprüht es
     Funken – ausser beim Stromausfall, dann ist es harmlos.
     ========================================================== */
  stromkabel(g, xOben, yOben, xUnten, yUnten, dicke, zeit, hatStrom) {
    const schwung = Math.sin(zeit * 1.8 + xOben * 0.01) * dicke * 2.5;
    g.strokeStyle = '#1a1d22';
    g.lineWidth = Math.max(2, dicke);
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(xOben, yOben);
    g.quadraticCurveTo((xOben + xUnten) / 2 + schwung, (yOben + yUnten) / 2,
                       xUnten, yUnten);
    g.stroke();
    // Die Halterung an der Wand
    g.fillStyle = '#3a3f47';
    g.beginPath();
    g.arc(xOben, yOben, dicke * 1.4, 0, Math.PI * 2);
    g.fill();
    if (hatStrom) {
      // Ein warnendes Leuchten am ganzen Kabel – man muss es sehen!
      g.strokeStyle = 'rgba(255, 225, 120, 0.55)';
      g.lineWidth = Math.max(4, dicke * 2.6);
      g.beginPath();
      g.moveTo(xOben, yOben);
      g.quadraticCurveTo((xOben + xUnten) / 2 + schwung, (yOben + yUnten) / 2,
                         xUnten, yUnten);
      g.stroke();
      // und das dunkle Kabel nochmal obendrauf
      g.strokeStyle = '#1a1d22';
      g.lineWidth = Math.max(2, dicke);
      g.beginPath();
      g.moveTo(xOben, yOben);
      g.quadraticCurveTo((xOben + xUnten) / 2 + schwung, (yOben + yUnten) / 2,
                         xUnten, yUnten);
      g.stroke();
    }

    // Das abisolierte Ende (kupferfarben)
    g.strokeStyle = '#c9813a';
    g.lineWidth = Math.max(1.5, dicke * 0.7);
    g.beginPath();
    g.moveTo(xUnten, yUnten);
    g.lineTo(xUnten + schwung * 0.3, yUnten + dicke * 2.2);
    g.stroke();

    if (hatStrom) {
      // FUNKEN! Zufällig aufblitzende gelbe Sterne
      const blitzPhase = Math.sin(zeit * 23 + xOben);
      if (blitzPhase > -0.45) {
        g.fillStyle = 'rgba(255, 235, 120, ' + (0.5 + blitzPhase * 0.5) + ')';
        for (let i = 0; i < 3; i++) {
          const fw = zeit * 31 + i * 2.1;
          stern(g, xUnten + Math.cos(fw) * dicke * 3,
                   yUnten + dicke * 2 + Math.sin(fw * 1.3) * dicke * 2.5,
                   dicke * (1.0 + Math.sin(fw * 2) * 0.5), 4);
          g.fill();
        }
        // Ein heller Schein drumherum
        const schein = g.createRadialGradient(xUnten, yUnten + dicke * 2, 0,
                                              xUnten, yUnten + dicke * 2, dicke * 9);
        schein.addColorStop(0, 'rgba(255, 240, 150, 0.35)');
        schein.addColorStop(1, 'rgba(255, 240, 150, 0)');
        g.fillStyle = schein;
        g.beginPath();
        g.arc(xUnten, yUnten + dicke * 2, dicke * 9, 0, Math.PI * 2);
        g.fill();
      }
    }
  },

  /* ==========================================================
     DIE DOPPELKISTE – zwei Kisten übereinander auf zwei
     Spuren. Viel zu hoch zum Drüberspringen!
     ========================================================== */
  doppelkiste(g, x, yBoden, b, h) {
    // Zwei Kisten übereinander stapeln
    for (const etage of [0, 1]) {
      const y = yBoden - etage * h * 0.5;
      this.kiste(g, x, y, b, h * 0.5);
    }
    // Ein Warnband quer über den ganzen Stapel
    g.save();
    g.fillStyle = '#f2d13a';
    g.globalAlpha = 0.9;
    g.fillRect(x - b / 2, yBoden - h * 0.56, b, h * 0.10);
    g.fillStyle = '#22262c';
    for (let i = 0; i * (h * 0.14) < b + h * 0.14; i++) {
      g.beginPath();
      g.moveTo(x - b / 2 + i * h * 0.14, yBoden - h * 0.46);
      g.lineTo(x - b / 2 + i * h * 0.14 + h * 0.07, yBoden - h * 0.46);
      g.lineTo(x - b / 2 + i * h * 0.14 + h * 0.14, yBoden - h * 0.56);
      g.lineTo(x - b / 2 + i * h * 0.14 + h * 0.07, yBoden - h * 0.56);
      g.closePath();
      g.fill();
    }
    g.restore();
  },

  /* ==========================================================
     LOUISE – ein kleines Mädchen mit zwei blonden Zöpfen.
     Sie dreht sich unentwegt im Kreis. Drüberspringen geht
     nicht, man muss seitlich an ihr vorbei.
     ========================================================== */
  louise(g, x, yBoden, b, h, zeit) {
    const dreh = zeit * 3.6;
    // So tun, als würde sie sich um die eigene Achse drehen:
    // Wir drücken sie beim Drehen schmaler zusammen.
    const schmal = Math.abs(Math.cos(dreh)) * 0.62 + 0.38;
    const schwung = Math.sin(dreh);           // -1 … 1, für die Zöpfe

    g.save();
    g.translate(x, yBoden);

    // --- Die Zöpfe: sie sitzen am KOPF und fliegen beim Drehen
    //     schräg nach aussen und unten (nicht waagrecht wie Flügel) ---
    const zopfLang = b * 0.34;
    g.lineCap = 'round';
    for (const seite of [-1, 1]) {
      const start = { x: seite * b * 0.23 * schmal, y: -h * 0.845 };
      const ende  = { x: seite * (b * 0.30 * schmal + zopfLang),
                      y: -h * (0.60 + seite * schwung * 0.04) };
      // etwas dunkler unterlegt, damit man den Zopf vom Arm unterscheidet
      g.strokeStyle = '#d9b348';
      g.lineWidth = Math.max(2, b * 0.13);
      g.beginPath();
      g.moveTo(start.x, start.y);
      g.quadraticCurveTo(seite * (b * 0.40 * schmal + zopfLang * 0.4),
                         start.y - h * 0.02, ende.x, ende.y);
      g.stroke();
      g.strokeStyle = '#f5da7d';
      g.lineWidth = Math.max(1, b * 0.075);
      g.beginPath();
      g.moveTo(start.x, start.y);
      g.quadraticCurveTo(seite * (b * 0.40 * schmal + zopfLang * 0.4),
                         start.y - h * 0.02, ende.x, ende.y);
      g.stroke();
      // Das Haargummi am Ende
      g.fillStyle = '#e8557a';
      g.beginPath();
      g.arc(ende.x, ende.y, b * 0.070, 0, Math.PI * 2);
      g.fill();
    }

    g.scale(schmal, 1);      // ab hier wird sie beim Drehen schmaler

    // --- Beinchen ---
    g.fillStyle = '#f2c9a0';
    for (const seite of [-1, 1]) {
      rundesRechteck(g, seite * b * 0.22 - b * 0.08, -h * 0.30, b * 0.16, h * 0.28, b * 0.07);
      g.fill();
    }
    // --- Schuhe ---
    g.fillStyle = '#d8456a';
    for (const seite of [-1, 1]) {
      g.beginPath();
      g.ellipse(seite * b * 0.22, -h * 0.03, b * 0.14, h * 0.035, 0, 0, Math.PI * 2);
      g.fill();
    }

    // --- Das Kleid (dreht sich mit und schwingt aus) ---
    const rock = b * (0.52 + Math.abs(schwung) * 0.10);
    const kleid = g.createLinearGradient(0, -h * 0.66, 0, -h * 0.26);
    kleid.addColorStop(0, '#7fb7e8');
    kleid.addColorStop(1, '#3f7fc4');
    g.fillStyle = kleid;
    g.beginPath();
    g.moveTo(-b * 0.24, -h * 0.66);
    g.lineTo(b * 0.24, -h * 0.66);
    g.lineTo(rock, -h * 0.26);
    g.lineTo(-rock, -h * 0.26);
    g.closePath();
    g.fill();

    // --- Die ausgestreckten Arme (typisch beim Kreiseln) ---
    g.strokeStyle = '#f2c9a0';
    g.lineWidth = Math.max(2, b * 0.11);
    g.beginPath();
    g.moveTo(-b * 0.20, -h * 0.60);
    g.lineTo(-b * 0.62, -h * (0.66 + schwung * 0.05));
    g.moveTo(b * 0.20, -h * 0.60);
    g.lineTo(b * 0.62, -h * (0.66 - schwung * 0.05));
    g.stroke();

    // --- Der Kopf ---
    g.fillStyle = '#f7d5ad';
    g.beginPath();
    g.arc(0, -h * 0.80, b * 0.26, 0, Math.PI * 2);
    g.fill();

    // --- Die blonden Haare oben ---
    g.fillStyle = '#f0cf6a';
    g.beginPath();
    g.arc(0, -h * 0.82, b * 0.27, Math.PI, Math.PI * 2);
    g.fill();
    g.fillRect(-b * 0.27, -h * 0.83, b * 0.54, h * 0.05);

    // --- Fröhliches Gesicht ---
    if (b > 26) {
      g.fillStyle = '#3a2a18';
      g.beginPath();
      g.arc(-b * 0.10, -h * 0.81, b * 0.035, 0, Math.PI * 2);
      g.arc(b * 0.10, -h * 0.81, b * 0.035, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = '#a9573f';
      g.lineWidth = Math.max(1, b * 0.035);
      g.beginPath();
      g.arc(0, -h * 0.77, b * 0.10, 0.25 * Math.PI, 0.75 * Math.PI);
      g.stroke();
    }
    g.restore();
  },

  /* ==========================================================
     SOPHIE – etwas grösser, blond, und sie reitet auf einer
     ekligen Kanalratte. Manchmal macht sie ein Selfie!
     ========================================================== */
  sophieAufRatte(g, x, yBoden, b, h, zeit, selfie) {
    const wackel = Math.sin(zeit * 7) * h * 0.02;

    g.save();
    g.translate(x, yBoden + wackel);

    /* ---------- DIE EKLIGE KANALRATTE ---------- */
    const rH = h * 0.40;                       // Höhe der Ratte
    // Der lange nackte Schwanz
    g.strokeStyle = '#c98a94';
    g.lineWidth = Math.max(2, b * 0.06);
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(-b * 0.42, -rH * 0.55);
    g.quadraticCurveTo(-b * 0.85, -rH * 0.30 + Math.sin(zeit * 5) * rH * 0.2,
                       -b * 0.95, -rH * 0.95);
    g.stroke();

    // Pfoten
    g.fillStyle = '#5d5a52';
    for (const vx of [-0.28, -0.05, 0.20, 0.42]) {
      g.beginPath();
      g.ellipse(b * vx, -rH * 0.06, b * 0.09, rH * 0.10, 0, 0, Math.PI * 2);
      g.fill();
    }

    // Der struppige Körper
    const fell = g.createLinearGradient(0, -rH, 0, 0);
    fell.addColorStop(0, '#7d7a6e');
    fell.addColorStop(1, '#4b4940');
    g.fillStyle = fell;
    g.beginPath();
    g.ellipse(0, -rH * 0.50, b * 0.50, rH * 0.46, 0, 0, Math.PI * 2);
    g.fill();

    // Der Kopf mit spitzer Schnauze
    g.beginPath();
    g.ellipse(b * 0.46, -rH * 0.62, b * 0.24, rH * 0.32, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(b * 0.60, -rH * 0.75);
    g.lineTo(b * 0.86, -rH * 0.52);
    g.lineTo(b * 0.60, -rH * 0.42);
    g.closePath();
    g.fill();
    // Rosa Nase
    g.fillStyle = '#e08a9a';
    g.beginPath();
    g.arc(b * 0.85, -rH * 0.52, b * 0.045, 0, Math.PI * 2);
    g.fill();
    // Ohren
    g.fillStyle = '#6a6659';
    for (const oy of [-0.95, -0.80]) {
      g.beginPath();
      g.ellipse(b * 0.34, rH * oy, b * 0.11, rH * 0.14, 0.3, 0, Math.PI * 2);
      g.fill();
    }
    // Böse rote Augen
    g.fillStyle = '#d43a2f';
    g.beginPath();
    g.arc(b * 0.55, -rH * 0.70, b * 0.045, 0, Math.PI * 2);
    g.fill();
    // Schnurrhaare
    g.strokeStyle = 'rgba(230,230,230,0.6)';
    g.lineWidth = Math.max(1, b * 0.015);
    for (let i = -1; i <= 1; i++) {
      g.beginPath();
      g.moveTo(b * 0.80, -rH * 0.54);
      g.lineTo(b * 1.05, -rH * (0.54 + i * 0.18));
      g.stroke();
    }

    /* ---------- SOPHIE OBENDRAUF ---------- */
    const sY = -rH * 0.90;                     // wo sie sitzt
    const sH = h - rH * 0.90;                  // wie gross sie ist

    // Beine seitlich an der Ratte
    g.strokeStyle = '#f2c9a0';
    g.lineWidth = Math.max(2, b * 0.10);
    g.beginPath();
    g.moveTo(-b * 0.02, sY - sH * 0.14);
    g.lineTo(b * 0.14, sY + rH * 0.30);
    g.stroke();
    g.fillStyle = '#d8456a';
    g.beginPath();
    g.ellipse(b * 0.16, sY + rH * 0.34, b * 0.10, rH * 0.09, 0, 0, Math.PI * 2);
    g.fill();

    // Oberkörper
    const shirt = g.createLinearGradient(0, sY - sH * 0.50, 0, sY);
    shirt.addColorStop(0, '#8fd08a');
    shirt.addColorStop(1, '#4f9a54');
    g.fillStyle = shirt;
    rundesRechteck(g, -b * 0.19, sY - sH * 0.46, b * 0.38, sH * 0.46, b * 0.10);
    g.fill();

    // Der Arm mit den Zügeln
    g.strokeStyle = '#f2c9a0';
    g.lineWidth = Math.max(2, b * 0.09);
    g.beginPath();
    g.moveTo(b * 0.12, sY - sH * 0.34);
    g.lineTo(b * 0.40, sY - sH * 0.10);
    g.stroke();

    // Der zweite Arm: beim Selfie hoch mit dem Handy
    g.beginPath();
    g.moveTo(-b * 0.12, sY - sH * 0.34);
    if (selfie) g.lineTo(-b * 0.36, sY - sH * 0.86);
    else        g.lineTo(-b * 0.34, sY - sH * 0.06);
    g.stroke();

    // Der Kopf
    g.fillStyle = '#f7d5ad';
    g.beginPath();
    g.arc(0, sY - sH * 0.66, b * 0.20, 0, Math.PI * 2);
    g.fill();
    // Blonde Haare mit Pferdeschwanz
    g.fillStyle = '#f0cf6a';
    g.beginPath();
    g.arc(0, sY - sH * 0.69, b * 0.215, Math.PI, Math.PI * 2);
    g.fill();
    g.fillRect(-b * 0.215, sY - sH * 0.70, b * 0.43, sH * 0.10);
    g.strokeStyle = '#f0cf6a';
    g.lineWidth = Math.max(2, b * 0.09);
    g.beginPath();
    g.moveTo(-b * 0.17, sY - sH * 0.68);
    g.quadraticCurveTo(-b * 0.46, sY - sH * 0.62, -b * 0.40, sY - sH * 0.30);
    g.stroke();
    // Augen
    if (b > 26) {
      g.fillStyle = '#3a2a18';
      g.beginPath();
      g.arc(-b * 0.07, sY - sH * 0.66, b * 0.030, 0, Math.PI * 2);
      g.arc(b * 0.07, sY - sH * 0.66, b * 0.030, 0, Math.PI * 2);
      g.fill();
    }

    // --- DAS SELFIE ---
    if (selfie) {
      g.fillStyle = '#22262c';
      rundesRechteck(g, -b * 0.46, sY - sH * 1.02, b * 0.20, sH * 0.28, b * 0.03);
      g.fill();
      g.fillStyle = '#9fd8ff';
      rundesRechteck(g, -b * 0.435, sY - sH * 0.99, b * 0.15, sH * 0.22, b * 0.02);
      g.fill();
      // Der Blitz!
      const blitz = Math.abs(Math.sin(zeit * 4));
      if (blitz > 0.82) {
        const bl = g.createRadialGradient(-b * 0.36, sY - sH * 0.88, 0,
                                          -b * 0.36, sY - sH * 0.88, b * 1.3);
        bl.addColorStop(0, 'rgba(255,255,255,0.95)');
        bl.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = bl;
        g.beginPath();
        g.arc(-b * 0.36, sY - sH * 0.88, b * 1.3, 0, Math.PI * 2);
        g.fill();
      }
    }
    g.restore();
  },

  /* ==========================================================
     🤫 Münzen, die von oben durch ein Gullirost gefallen sind –
     im Lichtstrahl von der Strasse funkeln sie.
     ========================================================== */
  muenzschatz(g, x, yBoden, r, hoeheOben, zeit, weg) {
    g.save();
    if (weg > 0) g.globalAlpha *= weg;

    // Der Lichtstrahl von oben (das Beste an der Sache!)
    const strahl = g.createLinearGradient(x, yBoden - hoeheOben, x, yBoden);
    strahl.addColorStop(0, 'rgba(255, 244, 200, 0.30)');
    strahl.addColorStop(1, 'rgba(255, 236, 170, 0.04)');
    g.fillStyle = strahl;
    g.beginPath();
    g.moveTo(x - r * 0.8, yBoden - hoeheOben);
    g.lineTo(x + r * 0.8, yBoden - hoeheOben);
    g.lineTo(x + r * 2.2, yBoden);
    g.lineTo(x - r * 2.2, yBoden);
    g.closePath();
    g.fill();

    // Das Gullirost ganz oben
    g.fillStyle = 'rgba(20, 26, 24, 0.85)';
    g.fillRect(x - r * 0.95, yBoden - hoeheOben - r * 0.2, r * 1.9, r * 0.34);
    g.strokeStyle = 'rgba(255, 244, 200, 0.45)';
    g.lineWidth = Math.max(1, r * 0.07);
    for (let i = -1; i <= 1; i++) {
      g.beginPath();
      g.moveTo(x + i * r * 0.42, yBoden - hoeheOben - r * 0.2);
      g.lineTo(x + i * r * 0.42, yBoden - hoeheOben + r * 0.14);
      g.stroke();
    }

    // Der leuchtende Haufen am Boden
    const schein = g.createRadialGradient(x, yBoden - r * 0.2, 0, x, yBoden - r * 0.2, r * 2.0);
    schein.addColorStop(0, 'rgba(255, 214, 90, 0.55)');
    schein.addColorStop(1, 'rgba(255, 214, 90, 0)');
    g.fillStyle = schein;
    g.beginPath();
    g.ellipse(x, yBoden - r * 0.2, r * 2.0, r * 0.9, 0, 0, Math.PI * 2);
    g.fill();

    // Die Münzen selbst
    const muenzen = [[-0.62, 0.02, 0.9], [0.58, 0.04, 0.85], [-0.20, -0.10, 1],
                     [0.22, -0.14, 0.95], [0, -0.34, 0.8], [-0.44, -0.30, 0.7]];
    for (let i = 0; i < muenzen.length; i++) {
      const [mx, my, gr] = muenzen[i];
      const hopser = weg > 0 ? (1 - weg) * r * (2 + i) : 0;
      const mr = r * 0.30 * gr;
      g.fillStyle = '#e8b430';
      g.beginPath();
      g.ellipse(x + mx * r, yBoden + my * r - hopser, mr, mr * 0.62, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#ffe27a';
      g.beginPath();
      g.ellipse(x + mx * r, yBoden + my * r - hopser - mr * 0.14, mr * 0.72, mr * 0.42, 0, 0, Math.PI * 2);
      g.fill();
    }

    // Funkeln
    g.fillStyle = 'rgba(255, 252, 220, 0.95)';
    for (let i = 0; i < 3; i++) {
      const t = (zeit * 1.6 + i * 0.4) % 1;
      const fr = r * 0.22 * Math.sin(t * Math.PI);
      if (fr > 0.4) {
        stern(g, x + Math.cos(i * 2.4 + zeit) * r * 0.8,
                 yBoden - r * (0.2 + i * 0.22), fr, 4);
        g.fill();
      }
    }
    g.restore();
  },

  /* ==========================================================
     Ein einzelnes Pizzastück (Dreieck) – schwebt und dreht sich
     ========================================================== */
  pizzaStueck(g, x, y, r, zeit) {
    const schein = g.createRadialGradient(x, y, 0, x, y, r * 2.0);
    schein.addColorStop(0, 'rgba(255, 214, 110, 0.42)');
    schein.addColorStop(1, 'rgba(255, 190, 70, 0)');
    g.fillStyle = schein;
    g.beginPath();
    g.arc(x, y, r * 2.0, 0, Math.PI * 2);
    g.fill();

    g.save();
    g.translate(x, y);
    g.rotate(Math.sin(zeit * 2) * 0.35);       // es wippt hin und her

    // Das Dreieck mit runder Kruste
    g.beginPath();
    g.moveTo(0, r * 0.85);
    g.lineTo(-r * 0.72, -r * 0.55);
    g.arc(0, 0, r, Math.PI * 1.24, Math.PI * 1.76);
    g.closePath();
    g.fillStyle = '#f2c94c';
    g.fill();
    g.strokeStyle = '#c98f33';
    g.lineWidth = Math.max(1, r * 0.10);
    g.stroke();

    // Die Kruste am oberen Rand
    g.strokeStyle = '#d9a04a';
    g.lineWidth = Math.max(1.5, r * 0.26);
    g.beginPath();
    g.arc(0, 0, r * 0.90, Math.PI * 1.26, Math.PI * 1.74);
    g.stroke();

    // Zwei Salamis
    g.fillStyle = '#c0392b';
    g.beginPath();
    g.arc(-r * 0.20, -r * 0.20, r * 0.16, 0, Math.PI * 2);
    g.arc(r * 0.22, -r * 0.26, r * 0.13, 0, Math.PI * 2);
    g.fill();
    g.restore();
  },


  /* ==========================================================
     Eine Pizza, die im Tunnel schwebt – von vorne gesehen.
     Sie dreht sich langsam und leuchtet golden.
     ========================================================== */
  schwebePizza(g, x, y, r, zeit) {
    // Goldener Schein rundherum, damit man sie schon von Weitem sieht
    const schein = g.createRadialGradient(x, y, 0, x, y, r * 2.4);
    schein.addColorStop(0, 'rgba(255, 214, 110, 0.55)');
    schein.addColorStop(0.5, 'rgba(255, 190, 70, 0.22)');
    schein.addColorStop(1, 'rgba(255, 190, 70, 0)');
    g.fillStyle = schein;
    g.beginPath();
    g.arc(x, y, r * 2.4, 0, Math.PI * 2);
    g.fill();

    g.save();
    g.translate(x, y);
    g.rotate(zeit * 1.1);                    // sie dreht sich langsam

    // Der Rand (Teigkruste)
    g.fillStyle = '#d9a04a';
    g.beginPath();
    g.arc(0, 0, r, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#a8752e';
    g.lineWidth = Math.max(1, r * 0.09);
    g.stroke();

    // Der Käse
    g.fillStyle = '#f2c94c';
    g.beginPath();
    g.arc(0, 0, r * 0.80, 0, Math.PI * 2);
    g.fill();

    // Salami
    g.fillStyle = '#c0392b';
    for (let i = 0; i < 5; i++) {
      const w = i * (Math.PI * 2 / 5);
      g.beginPath();
      g.arc(Math.cos(w) * r * 0.44, Math.sin(w) * r * 0.44, r * 0.16, 0, Math.PI * 2);
      g.fill();
    }
    // Kräuter
    g.fillStyle = '#4a8b3a';
    for (let i = 0; i < 6; i++) {
      const w = i * 1.9 + 0.6;
      g.beginPath();
      g.ellipse(Math.cos(w) * r * 0.62, Math.sin(w) * r * 0.62, r * 0.07, r * 0.04, w, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();

    // Funkelnde Sternchen drumherum
    g.fillStyle = 'rgba(255, 250, 210, 0.9)';
    for (let i = 0; i < 4; i++) {
      const w = zeit * 2.2 + i * Math.PI / 2;
      const fr = r * (0.20 + Math.abs(Math.sin(zeit * 3 + i)) * 0.14);
      stern(g, x + Math.cos(w) * r * 1.55, y + Math.sin(w) * r * 1.55, fr, 4);
      g.fill();
    }
  },

  // Duftwellen, die von der Pizza zum Hamster ziehen
  duftwellen(g, vonX, vonY, nachX, nachY, zeit, basis = 400) {
    g.strokeStyle = 'rgba(255, 220, 140, 0.75)';
    for (let i = 0; i < 4; i++) {
      const t = ((zeit * 0.75 + i * 0.25) % 1);
      const px = vonX + (nachX - vonX) * t;
      const py = vonY + (nachY - vonY) * t - Math.sin(t * Math.PI) * basis * 0.07;
      const r = basis * (0.015 + t * 0.042);
      g.globalAlpha = Math.sin(t * Math.PI) * 0.85;
      g.lineWidth = Math.max(1.5, basis * 0.007);
      g.beginPath();
      g.arc(px, py, r, Math.PI * 0.15, Math.PI * 0.85);
      g.stroke();
      g.beginPath();
      g.arc(px, py, r * 0.6, Math.PI * 0.15, Math.PI * 0.85);
      g.stroke();
    }
    g.globalAlpha = 1;
  },

  // Der geschlossene Gulli-Deckel (der offene ist das Loch!)
  gulliLoch(g, x, y, b, offen) {
    const h = b * 0.34;
    if (offen) {
      // Ein schwarzes Loch in der Strasse
      g.fillStyle = '#0a0c0b';
      g.beginPath();
      g.ellipse(x, y, b / 2, h / 2, 0, 0, Math.PI * 2);
      g.fill();
      // Rand des Lochs
      g.strokeStyle = '#4b4f4c';
      g.lineWidth = Math.max(2, b * 0.05);
      g.stroke();
      // Der Deckel liegt daneben (links, damit er nicht die Pizza verdeckt)
      g.fillStyle = '#5c605d';
      g.beginPath();
      g.ellipse(x - b * 0.85, y + h * 0.1, b * 0.44, h * 0.42, 0.15, 0, Math.PI * 2);
      g.fill();
    } else {
      g.fillStyle = '#5c605d';
      g.beginPath();
      g.ellipse(x, y, b / 2, h / 2, 0, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = '#3d403e';
      g.lineWidth = Math.max(1.5, b * 0.03);
      for (let i = -2; i <= 2; i++) {
        g.beginPath();
        g.moveTo(x - b * 0.38, y + i * h * 0.16);
        g.lineTo(x + b * 0.38, y + i * h * 0.16);
        g.stroke();
      }
    }
  },

  /* ==========================================================
     SCHATTEN unter dem Hamster
     ========================================================== */
  schatten(g, x, y, breite, staerke) {
    g.fillStyle = `rgba(0, 0, 0, ${0.45 * staerke})`;
    g.beginPath();
    g.ellipse(x, y, breite, breite * 0.25, 0, 0, Math.PI * 2);
    g.fill();
  }
};
