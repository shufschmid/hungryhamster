/* ============================================================
   HUNGRY HAMSTER – Die Strasse oben (und wie man hinkommt)
   ------------------------------------------------------------
   Ungefähr alle 1000 Punkte stehen im Kanal alte Sofas mit einer
   Sprungfeder. Wer auf das Sofa springt, über dem Licht von oben
   hereinfällt, wird durch das Loch hinauf auf die Strasse
   geschleudert. Über den dunklen Sofas ist die Decke zu – BONK!

   Oben auf der Strasse kann man nicht verunglücken. Wer aber in
   ein Loch fällt oder einen Fussgänger anrempelt, landet wieder
   unten im Kanal. Verhungern kann man oben trotzdem!
   ============================================================ */

/* ------------------------------------------------------------
   DIE SOFAS IM KANAL
   ------------------------------------------------------------ */
const Sofa = {
  name: 'sofa',
  allePunkte: 1000,     // Ungefähr alle 1000 Punkte kommen die Sofas
  schonzeit:    20,     // Nach dem Zurückfallen frühestens 20 Sekunden später wieder
  breite:      1.0,
  hoehe:      0.95,
  tiefe:       1.0
};

/* ------------------------------------------------------------
   DIE STRASSE
   ------------------------------------------------------------ */
const Strasse = {
  fussgaengerTempo:  1.3,   // Wie schnell die Leute über die Strasse gehen
  fussgaengerBreite: 0.68,  // So nah darf man ihnen kommen, ohne sie anzurempeln

  /* WAS KOMMT AUF DER STRASSE AUF EINEN ZU?
     Die Buchstaben a, b und c stehen für die drei Spuren. Welche
     Spur welcher Buchstabe ist, wird jedes Mal neu ausgewürfelt.
     'alle' bedeutet: über die ganze Strasse.

     Ein Loch ist so aufgeschrieben: [wo, von, bis, art]
       von, bis = wo es anfängt und aufhört (in Hamster-Längen)
       art      = 'gulli' (rundes Loch) oder 'grube' (Baugrube)
     Die Längen gelten für das Anfangstempo. Wenn der Hamster
     schneller rennt, springt er auch weiter – dann werden die
     Löcher automatisch mitgestreckt.

     pizza: [wo, wie weit vorne] – falls gerade Pizza fällig ist
     abSekunde: erst wenn man so lange oben ist */
  muster: [
    // Ein offener Gullideckel: drüberspringen oder ausweichen
    { name: 'gulli', gewicht: 3,
      loecher: [['a', 0, 1.6, 'gulli']],
      pizza: ['a', 0.8] },

    // Zwei offene Gullis nebeneinander
    { name: 'zweiGullis', gewicht: 2,
      loecher: [['a', 0, 1.6, 'gulli'], ['b', 0, 1.6, 'gulli']],
      pizza: ['b', 0.8] },

    // Eine Baugrube über die ganze Strasse: SPRINGEN!
    { name: 'grube', gewicht: 3,
      loecher: [['alle', 0, 2.6, 'grube']],
      pizza: ['a', 1.3] },

    // Ein langer Graben auf zwei Spuren – viel zu lang zum
    // Drüberspringen. Auf die freie Spur!
    { name: 'graben', gewicht: 2,
      loecher: [['a', 0, 12, 'grube'], ['b', 0, 12, 'grube']],
      pizza: ['c', 6] },

    // SPRINGEN UND IM SPRUNG DIE SPUR WECHSELN!
    // Zuerst ist Spur c kaputt, dann kommt eine Grube über die
    // ganze Strasse, und danach sind a und b kaputt. Man muss also
    // auf a oder b abspringen und in der Luft nach c wischen.
    { name: 'sprungWechsel', gewicht: 4, abSekunde: 5,
      loecher: [['c', 0, 9, 'grube'], ['alle', 9, 11.6, 'grube'],
                ['a', 11.6, 22, 'grube'], ['b', 11.6, 22, 'grube']],
      pizza: ['c', 10.3] },

    // ZICKZACK: zweimal springen und wechseln – für Profis!
    // Tipp: nach der ersten Landung sofort wieder springen.
    { name: 'zickzack', gewicht: 2, abSekunde: 15,
      loecher: [['a', 0, 7, 'grube'], ['c', 0, 7, 'grube'],
                ['b', 7, 16, 'grube'],
                ['a', 16, 23, 'grube'], ['c', 16, 23, 'grube']],
      pizza: ['a', 11.5] },

    // Ein Fussgängerstreifen mit Leuten drauf
    { name: 'zebra', gewicht: 3, fussgaenger: 1 },
    { name: 'zebraZwei', gewicht: 2, abSekunde: 8, fussgaenger: 2 }
  ],

  // Wer geht über die Strasse? (Farben für Mantel, Hose, Haare …)
  leute: [
    { mantel: '#c0392b', hose: '#2c3e50', haar: '#6b4326', tasche: '#2b2b2b' },                  // Frau mit Handtasche
    { mantel: '#5d6d7e', hose: '#34495e', haar: '#3a3a3a', hut: '#2c2c2c', tasche: '#7a4a1f' },  // Herr mit Hut und Koffer
    { mantel: '#8e5ea2', hose: '#4a4a4a', haar: '#d8d8d8', dutt: true, stock: true },            // Oma mit Stock
    { mantel: '#27ae60', hose: '#1f3a5f', haar: '#f0cf6a', muetze: '#e74c3c' }                   // Mann mit roter Mütze
  ]
};

// Eine Liste zufällig durcheinanderwürfeln
function mischen(liste) {
  const l = liste.slice();
  for (let i = l.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [l[i], l[j]] = [l[j], l[i]];
  }
  return l;
}

// So weit fliegt der Hamster bei einem Sprung (jetzt und am Anfang)
function sprungweite()         { return Spiel.tempo * flugzeit(); }
function sprungweiteAmAnfang() { return Einstellung.startTempo * 2 * Einstellung.sprungKraft / Einstellung.schwerkraft; }


/* ============================================================
   UNTEN IM KANAL: DIE SOFAS
   ============================================================ */
function sofaReiheErzeugen() {
  // Drei Spuren: ein Sofa mit Licht, ein dunkles Sofa – und eine
  // Spur bleibt frei für alle, die lieber unten bleiben wollen.
  const [hell, dunkel, frei] = mischen([-1, 0, 1]);
  Spiel.hindernisse.push({
    typ: Sofa, z: 34, frei: frei, gemeldet: false,
    sofas: [
      { spur: hell,   licht: true,  benutzt: false },
      { spur: dunkel, licht: false, benutzt: false }
    ]
  });
  // Das nächste Mal bei den nächsten vollen 1000 Punkten
  Spiel.naechstesSofaBei = (Math.floor(Spiel.punkte / Sofa.allePunkte) + 1) * Sofa.allePunkte;
}

/* --- Auf das helle Sofa gesprungen: ab nach oben! --- */
function federHoch(sofa) {
  sofa.benutzt = true;
  Spiel.wechsel = { art: 'hoch', zeit: 0, startY: Spiel.hamsterY };
  Spiel.zielX = sofa.spur * Einstellung.spurX;
  Spiel.amBoden = false;
  Spiel.sprungPuffer = 0;
  Audio2.feder();
}

/* --- Auf ein dunkles Sofa gesprungen: an die Decke! --- */
function federDecke(sofa) {
  sofa.benutzt = true;
  Spiel.wechsel = { art: 'decke', zeit: 0, startY: Spiel.hamsterY };
  Spiel.zielX = sofa.spur * Einstellung.spurX;
  // So hoch fliegt er: bis sein Kopf an die Decke stösst
  Spiel.deckenY = Grafik.deckenHoehe(Spiel.zielX) - Einstellung.hamsterHoehe;
  Spiel.amBoden = false;
  Spiel.sprungPuffer = 0;
  Audio2.feder();
}


/* ============================================================
   DIE ÜBERGÄNGE zwischen Kanal und Strasse
   Solange ein Übergang läuft, steht die Welt still und man
   kann nicht steuern.
   ============================================================ */
function wechselAktualisieren(dt) {
  const w = Spiel.wechsel;
  w.zeit += dt;
  const t = w.zeit;
  nebensachenAktualisieren(dt);

  // Er gleitet weiter zu seiner Spur
  if (w.art !== 'gepackt') {
    Spiel.hamsterX += (Spiel.zielX - Spiel.hamsterX) * Math.min(1, dt * 10);
  }

  if (w.art === 'hoch') {
    // Kurz in die Feder einsinken ...
    const sitz = Sofa.hoehe * 0.45;
    if (t < 0.12) {
      Spiel.hamsterY = w.startY + (sitz - w.startY) * (t / 0.12);
    } else {
      // ... und dann WUSCH durch das Loch nach oben
      const f = t - 0.12;
      Spiel.hamsterY = sitz + f * 7 + f * f * 16;
    }
    if (t >= 0.85) strasseBetreten();

  } else if (w.art === 'decke') {
    // Hoch zur Decke ...
    const a = Math.min(1, t / 0.22);
    Spiel.hamsterY = w.startY + (Spiel.deckenY - w.startY) * (1 - (1 - a) * (1 - a));
    if (t >= 0.22) {
      // ... BONK!
      Spiel.hamsterY = Spiel.deckenY;
      Spiel.wechsel = null;
      Spiel.wackeln = 1;
      Spiel.blitz = 0.6;
      Spiel.zustand = 'CRASH';
      Spiel.crashZeit = 0;
      Spiel.grund = 'decke';
      Audio2.musikStopp();
      Audio2.bonk();
    }

  } else if (w.art === 'runter') {
    // Er versinkt im Loch ...
    Spiel.hamsterY = -3.5 * t * t;
    if (t >= 0.7) kanalBetreten();

  } else if (w.art === 'gepackt') {
    gepacktAktualisieren(w, t, dt);
  }
}

/* --- Weiss (nach oben) oder schwarz (nach unten) überblenden --- */
function uebergangZeichnen() {
  const klemme = (v) => Math.max(0, Math.min(1, v));
  let weiss = 0, schwarz = 0;
  const w = Spiel.wechsel;
  if (w && w.art === 'hoch')    weiss   = klemme((w.zeit - 0.35) / 0.45);
  if (w && w.art === 'runter')  schwarz = klemme((w.zeit - 0.30) / 0.35);
  if (w && w.art === 'gepackt') schwarz = klemme((w.zeit - 1.25) / 0.40);
  const e = Spiel.einblenden;
  if (e) {
    const a = klemme(e.rest / e.dauer);
    if (e.farbe === 'weiss') weiss = Math.max(weiss, a);
    else                     schwarz = Math.max(schwarz, a);
  }
  if (weiss > 0) {
    g.fillStyle = `rgba(255, 252, 235, ${weiss})`;
    g.fillRect(-B, -H, B * 3, H * 3);
  }
  if (schwarz > 0) {
    g.fillStyle = `rgba(0, 0, 0, ${schwarz})`;
    g.fillRect(-B, -H, B * 3, H * 3);
  }
}

/* --- Wenn eine Pizza noch vor dem Hamster hing, kommt bald eine neue.
       Sonst würde man beim Wechseln ungerecht verhungern. --- */
function pizzaRetten() {
  const nochDa = Spiel.bonusse.some(b => !b.gefangen && b.z > Einstellung.hamsterZ);
  if (nochDa) Spiel.naechstePizza = Math.min(Spiel.naechstePizza, Spiel.zeit + 1.5);
}

/* --- Oben auf der Strasse ankommen --- */
function strasseBetreten() {
  pizzaRetten();
  Spiel.wechsel = null;
  Spiel.ebene = 'strasse';
  Spiel.strassenZeit = 0;
  // Alles vom Kanal wegräumen
  Spiel.hindernisse = [];
  Spiel.kabel = [];
  Spiel.schaetze = [];
  Spiel.bonusse = [];
  Spiel.kotze = [];
  Spiel.loecher = [];
  Spiel.zebras = [];
  Spiel.letztesMuster = '';
  // Oben scheint die Sonne – da gibt es keinen Stromausfall
  Spiel.stromRest = 0;
  Spiel.zuckRest = 0;
  Spiel.licht = 1;
  // Er hüpft aus dem Gulliloch auf die Strasse
  Spiel.hamsterY = 2.4;
  Spiel.hamsterTempoY = 2;
  Spiel.amBoden = false;
  Spiel.wurfZ = 0;
  Spiel.naechsterSpawn = Spiel.strecke + Spiel.tempo * 2.2;
  Spiel.einblenden = { farbe: 'weiss', rest: 0.5, dauer: 0.5 };
  Spiel.effekte.push({ text: '☀️ OBEN AUF DER STRASSE!', leben: 2.2, maxLeben: 2.2, art: 'strasse' });
  Audio2.oben();
}

/* --- Zurück in den Kanal plumpsen --- */
function kanalBetreten() {
  pizzaRetten();
  const sX = Einstellung.spurX;
  Spiel.wechsel = null;
  Spiel.ebene = 'kanal';
  Spiel.loecher = [];
  Spiel.zebras = [];
  Spiel.bonusse = [];
  Spiel.kotze = [];
  Spiel.hindernisse = [];
  Spiel.kabel = [];
  Spiel.schaetze = [];
  Spiel.wurfZ = 0;
  // Er fällt von oben ins Wasser – PLATSCH (siehe spielAktualisieren)
  Spiel.hamsterY = 3.0;
  Spiel.hamsterTempoY = 0;
  Spiel.amBoden = false;
  Spiel.landeTon = true;
  Spiel.hamsterX = Math.max(-sX, Math.min(sX, Spiel.hamsterX));
  Spiel.zielX = Math.max(-1, Math.min(1, Math.round(Spiel.hamsterX / sX))) * sX;
  // Ein bisschen Zeit zum Ankommen, bevor wieder etwas kommt
  Spiel.naechsterSpawn  = Spiel.strecke + Spiel.tempo * 2.0;
  Spiel.naechstesKabel  = Math.max(Spiel.naechstesKabel, Spiel.strecke + Spiel.tempo * 8);
  Spiel.naechsterSchatz = Math.max(Spiel.naechsterSchatz, Spiel.strecke + Spiel.tempo * 6);
  Spiel.naechsterStrom  = Math.max(Spiel.naechsterStrom, Spiel.zeit + 15);
  Spiel.letzteWarSperre = false;
  // Das nächste Sofa: bei den nächsten vollen 1000 Punkten – aber nicht sofort
  Spiel.naechstesSofaBei = (Math.floor(Spiel.punkte / Sofa.allePunkte) + 1) * Sofa.allePunkte;
  Spiel.sofaFruehestens = Spiel.zeit + Sofa.schonzeit;
  Spiel.einblenden = { farbe: 'schwarz', rest: 0.5, dauer: 0.5 };
  Spiel.effekte.push({ text: '💦 PLUMPS! Zurück im Kanal', leben: 2.0, maxLeben: 2.0, art: 'kanal' });
}


/* ============================================================
   OBEN AUF DER STRASSE
   ============================================================ */
function strasseAktualisieren(dt, weg) {
  Spiel.strassenZeit += dt;

  /* --- Neue Löcher und Fussgängerstreifen --- */
  if (Spiel.strecke >= Spiel.naechsterSpawn) strassenMusterErzeugen();

  /* --- Alles kommt auf uns zu --- */
  for (const l of Spiel.loecher) { l.von -= weg; l.bis -= weg; }
  for (const zb of Spiel.zebras) zb.z -= weg;
  Spiel.loecher = Spiel.loecher.filter(l => l.bis > -4);
  Spiel.zebras = Spiel.zebras.filter(zb => zb.z + zb.laenge > -5);

  /* --- Die Leute gehen über die Strasse --- */
  for (const zb of Spiel.zebras) {
    for (const p of zb.leute) fussgaengerBewegen(zb, p);
  }

  const hz = Einstellung.hamsterZ;

  /* --- Fällt der Hamster in ein Loch? ---
     Nur wenn er am Boden ist – wer springt, fliegt drüber.
     "+ weg": auch wenn er in diesem Bild-Schritt ganz schnell
     über ein kurzes Loch gerannt ist, merken wir es. */
  if (Spiel.amBoden) {
    for (const l of Spiel.loecher) {
      if (l.nurDeko) continue;
      const randX = (l.art === 'gulli') ? 0.10 : 0.22;
      const drueber = hz >= l.von + 0.2 && hz <= l.bis - 0.2 + weg;
      if (drueber && Spiel.hamsterX > l.links + randX && Spiel.hamsterX < l.rechts - randX) {
        insLochGefallen(l);
        return;
      }
    }
  }

  /* --- Rempelt er einen Fussgänger an? --- */
  for (const zb of Spiel.zebras) {
    const mitte = zb.z + zb.laenge / 2;
    if (!(hz >= mitte - 0.4 && hz <= mitte + 0.4 + weg)) continue;
    for (const p of zb.leute) {
      if (Math.abs(Spiel.hamsterX - p.x) < Strasse.fussgaengerBreite) {
        gepackt(p);
        return;
      }
    }
  }
}

/* --- Das nächste Muster auf der Strasse auswählen und aufbauen --- */
function strassenMusterErzeugen() {
  const z0 = 34;
  const sX = Einstellung.spurX;
  // Nicht zweimal hintereinander dasselbe, und schwere erst später
  const moeglich = Strasse.muster.filter(m =>
    Spiel.strassenZeit >= (m.abSekunde || 0) && m.name !== Spiel.letztesMuster);
  const m = auswuerfeln(moeglich);
  Spiel.letztesMuster = m.name;

  // Welche Spur ist a, b und c?
  const [a, b, c] = mischen([-1, 0, 1]);
  const spuren = { a: a, b: b, c: c };
  // Wer schneller rennt, springt weiter – darum werden die Löcher mitgestreckt
  const dehnung = sprungweite() / sprungweiteAmAnfang();
  let ende = 0;

  /* --- Die Löcher --- */
  if (m.loecher) {
    // Löcher, die gleich lang sind, sammeln wir zusammen
    const gruppen = new Map();
    for (const [wo, von, bis, art] of m.loecher) {
      const schluessel = von + '|' + bis + '|' + art;
      if (!gruppen.has(schluessel)) gruppen.set(schluessel, { von: von, bis: bis, art: art, spuren: [] });
      const gruppe = gruppen.get(schluessel);
      if (wo === 'alle') gruppe.spuren.push(-1, 0, 1);
      else               gruppe.spuren.push(spuren[wo]);
    }
    for (const gruppe of gruppen.values()) {
      const liste = [...new Set(gruppe.spuren)].sort((x, y) => x - y);
      if (gruppe.art === 'gulli') {
        // Gullis bleiben einzelne runde Löcher
        for (const s of liste) lochAnlegen(s, s, gruppe, z0, dehnung);
      } else {
        // Gruben auf Nachbarspuren werden EINE grosse Grube. Sonst
        // könnte man genau zwischen zwei Gruben hindurchrennen.
        let start = liste[0];
        for (let i = 1; i <= liste.length; i++) {
          if (i < liste.length && liste[i] === liste[i - 1] + 1) continue;
          lochAnlegen(start, liste[i - 1], gruppe, z0, dehnung);
          start = liste[i];
        }
      }
      ende = Math.max(ende, gruppe.bis * dehnung);
    }
  }

  /* --- Der Fussgängerstreifen --- */
  if (m.fussgaenger) {
    const laenge = 2.4;
    // Jeder kommt auf einer anderen Spur an – eine bleibt immer frei
    const ziele = mischen([-1, 0, 1]).slice(0, m.fussgaenger);
    const richtung = Math.random() < 0.5 ? -1 : 1;
    const zebra = { z: z0, laenge: laenge, leute: [] };
    ziele.forEach((spur, i) => {
      zebra.leute.push({
        zielX: spur * sX + (Math.random() - 0.5) * 0.3,
        richtung: i === 0 ? richtung : -richtung,      // der zweite kommt von der anderen Seite
        art: Strasse.leute[Math.floor(Math.random() * Strasse.leute.length)],
        x: 0, geht: false, packt: false
      });
    });
    for (const p of zebra.leute) fussgaengerBewegen(zebra, p);
    Spiel.zebras.push(zebra);
    ende = Math.max(ende, laenge);
  }

  /* --- Pizza (falls gerade eine fällig ist) --- */
  if (m.pizza && Spiel.zeit >= Spiel.naechstePizza) {
    const [wo, dz] = m.pizza;
    pizzaAufhaengen(z0 + dz * dehnung, spuren[wo]);
  }

  /* --- Wann kommt das nächste? --- */
  const reaktion = Math.max(0.34, 0.60 - (Spiel.tempoStufe - 1) * 0.035);
  const wuerfel = Math.random();
  let extraSek;
  if (wuerfel < 0.25)      extraSek = Math.random() * 0.2;
  else if (wuerfel < 0.75) extraSek = 0.3 + Math.random() * 0.5;
  else                     extraSek = 0.9 + Math.random() * 1.0;
  Spiel.naechsterSpawn = Spiel.strecke + ende +
    Spiel.tempo * (flugzeit() * 0.6 + reaktion + extraSek);
}

/* --- Ein Loch in die Strasse machen (von Spur ... bis Spur) --- */
function lochAnlegen(vonSpur, bisSpur, gruppe, z0, dehnung) {
  const sX = Einstellung.spurX;
  const rand = Grafik.strassenBreite;
  let links, rechts;
  if (gruppe.art === 'gulli') {
    links = vonSpur * sX - 0.5;
    rechts = vonSpur * sX + 0.5;
  } else {
    // Aussen geht die Grube bis zum Randstein
    links  = (vonSpur === -1) ? -rand : vonSpur * sX - sX / 2;
    rechts = (bisSpur ===  1) ?  rand : bisSpur * sX + sX / 2;
  }
  Spiel.loecher.push({
    links: links, rechts: rechts, art: gruppe.art,
    von: z0 + gruppe.von * dehnung, bis: z0 + gruppe.bis * dehnung
  });
}

/* --- Wo ist ein Fussgänger gerade? ---
   Wir rechnen rückwärts: Er soll genau dann bei "zielX" sein,
   wenn der Streifen beim Hamster ankommt. Vorher wartet er am
   Trottoir, danach geht er weiter auf die andere Seite. */
function fussgaengerBewegen(zebra, p) {
  const mitte = zebra.z + zebra.laenge / 2;
  const geschwindigkeit = Strasse.fussgaengerTempo * Math.sqrt(Spiel.tempo / Einstellung.startTempo);
  const nochSek = (mitte - Einstellung.hamsterZ) / Spiel.tempo;
  const x = p.zielX - p.richtung * geschwindigkeit * nochSek;
  const trottoir = 2.95;
  p.geht = Math.abs(x) < trottoir;
  p.x = Math.max(-trottoir, Math.min(trottoir, x));
}

/* --- In ein Loch gefallen: zurück in den Kanal! --- */
function insLochGefallen(loch) {
  Spiel.wechsel = { art: 'runter', zeit: 0 };
  Spiel.hamsterTempoY = 0;
  Spiel.sprungPuffer = 0;
  // In einen Gulli rutscht er genau in die Mitte
  if (loch.art === 'gulli') Spiel.zielX = (loch.links + loch.rechts) / 2;
  else                      Spiel.zielX = Spiel.hamsterX;
  Spiel.effekte.push({ text: '🕳️ RUNTERGEFALLEN!', leben: 1.6, maxLeben: 1.6, art: 'kanal' });
  Audio2.fallen();
}

/* --- Einen Fussgänger angerempelt: er packt den Hamster und
       wirft ihn ins nächste Gulliloch! --- */
function gepackt(wer) {
  const sX = Einstellung.spurX, hz = Einstellung.hamsterZ;
  wer.packt = true;
  const spur = Math.max(-1, Math.min(1, Math.round(wer.x / sX)));
  // Das nächste Gulliloch ist gleich da vorne
  Spiel.loecher.push({ links: spur * sX - 0.5, rechts: spur * sX + 0.5,
                       von: hz + 3.5, bis: hz + 4.9, art: 'gulli', nurDeko: true });
  Spiel.wechsel = { art: 'gepackt', zeit: 0, wer: wer,
                    startX: Spiel.hamsterX, startY: Math.max(0, Spiel.hamsterY),
                    zielX: spur * sX };
  Spiel.amBoden = false;
  Spiel.sprungPuffer = 0;
  Spiel.effekte.push({ text: '😠 GEPACKT!', leben: 1.8, maxLeben: 1.8, art: 'gepackt' });
  Audio2.hey();
}

function gepacktAktualisieren(w, t, dt) {
  const halteY = 1.55;                     // so hoch hält er den Hamster
  if (t < 0.5) {
    // Er hebt ihn hoch ...
    const a = t / 0.5, weich = 1 - (1 - a) * (1 - a);
    Spiel.hamsterX = w.startX + (w.wer.x - w.startX) * weich;
    Spiel.hamsterY = w.startY + (halteY - w.startY) * weich;
  } else if (t < 1.2) {
    // ... und wirft ihn in hohem Bogen nach vorne ...
    if (!w.geworfen) { w.geworfen = true; w.wer.packt = false; Audio2.wurf(); }
    const a = (t - 0.5) / 0.7;
    Spiel.wurfZ = 4.2 * a;
    Spiel.hamsterX = w.wer.x + (w.zielX - w.wer.x) * a;
    Spiel.hamsterY = halteY + 2.4 * a - (halteY + 2.8) * a * a;
  } else {
    // ... mitten ins Gulliloch!
    if (!w.gefallen) { w.gefallen = true; Audio2.fallen(); }
    Spiel.hamsterY -= dt * 5;
  }
  if (t >= 1.7) kanalBetreten();
}


/* ============================================================
   DIE STRASSE ZEICHNEN
   ============================================================ */
// Was auf der Strasse liegt und steht, kommt in die Liste "dinge"
// (spielZeichnen sortiert sie dann von hinten nach vorne)
function strassenDingeSammeln(dinge) {
  if (Spiel.loecher.length) dinge.push({ z: 20, was: 'loecher', boden: true, lang: true });
  for (const zb of Spiel.zebras) {
    dinge.push({ z: zb.z, was: 'zebra', d: zb, boden: true });
    dinge.push({ z: zb.z - 0.2, was: 'schild', d: zb });
    const mitte = zb.z + zb.laenge / 2;
    for (const p of zb.leute) dinge.push({ z: mitte, was: 'fussgaenger', d: p });
  }
}

function strassenDingZeichnen(ding) {
  const d = ding.d;
  if (ding.was === 'loecher') {
    loecherZeichnen();
  } else if (ding.was === 'zebra') {
    Grafik.zebrastreifen(g, d.z, d.z + d.laenge);
  } else if (ding.was === 'schild') {
    for (const seite of [-1, 1]) {
      const fuss = Kamera.punkt(seite * 2.6, 0, ding.z);
      const oben = Kamera.punkt(seite * 2.6, 2.4, ding.z);
      Grafik.fussgaengerSchild(g, fuss.x, fuss.y, oben.x, oben.y, fuss.s);
    }
  } else if (ding.was === 'fussgaenger') {
    const p = Kamera.punkt(d.x, 0, ding.z);
    const s = p.s;
    g.fillStyle = 'rgba(0, 0, 0, 0.28)';
    g.beginPath();
    g.ellipse(p.x, p.y, 0.40 * s, 0.10 * s, 0, 0, Math.PI * 2);
    g.fill();
    Grafik.fussgaenger(g, p.x, p.y, 0.8 * s, 2.0 * s, Spiel.gesamtZeit + d.zielX,
                       d.art, d.richtung, d.geht, d.packt);
  }
}

/* --- Alle Löcher: zuerst die rot-weissen Ränder, dann die Löcher
       selbst. So malt kein Rand über ein benachbartes Loch. --- */
function loecherZeichnen() {
  const einblenden = (z) => Math.max(0, Math.min(1, z > 26 ? (34 - z) / 8 : 1));
  const sortiert = Spiel.loecher.slice().sort((a, b) => b.von - a.von);
  for (const l of sortiert) {
    g.globalAlpha = einblenden(l.von);
    Grafik.strassenLochRand(g, l.links, l.rechts, l.von, l.bis, l.art);
  }
  for (const l of sortiert) {
    g.globalAlpha = einblenden(l.von);
    Grafik.strassenLoch(g, l.links, l.rechts, l.von, l.bis, l.art);
  }
  g.globalAlpha = 1;
}
