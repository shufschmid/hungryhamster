/* ============================================================
   HUNGRY HAMSTER – Das Hauptspiel
   ------------------------------------------------------------
   Hier läuft alles zusammen: der Hamster rennt, springt,
   weicht aus, sammelt Pizza – und es wird immer schneller.
   ============================================================ */

// --- Die Leinwand, auf die wir malen ---
const leinwand = document.getElementById('leinwand');
const g = leinwand.getContext('2d');
let B = 0, H = 0;      // Breite und Höhe des Bildschirms

/* ------------------------------------------------------------
   DIE EINSTELLUNGEN DES SPIELS
   Hier könnt ihr herumspielen und das Spiel verändern!
   ------------------------------------------------------------ */
const Einstellung = {
  startTempo:     8.5,    // Wie schnell der Hamster am Anfang rennt
  tempoFaktor:    1.16,   // Wie viel schneller er alle 30 Sekunden wird
  tempoIntervall: 30,     // Alle 30 Sekunden wird es schneller
  maxTempo:       30,     // Schneller als das wird es nicht (nach ~4,5 Min.)
  punkteIntervall: 10,    // Alle 10 Sekunden ...
  punkteProMal:   100,    // ... gibt es 100 Punkte
  sprungKraft:    7.0,    // Wie kräftig der Hamster abspringt
  schwerkraft:    16,     // Wie schnell er wieder herunterfällt
  sprungKuerzung: 0.75,   // Je schneller er rennt, desto KÜRZER der Sprung
                          // (0 = Sprung bleibt gleich, 1 = gleich weite Sprünge)
  hamsterZ:       0.8,    // Wo der Hamster im Tunnel steht
  hamsterHoehe:   0.9,    // Wie gross der Hamster ist
  spurX:          1.15,   // Wie weit er zur Seite ausweichen kann
  spurTempo:       7.0,   // Wie flink er zur Seite wechselt
  sicherAbstand:  0.83    // So nah darf man einer Sperre kommen, ohne
                          // sie zu berühren (= etwa eine halbe Spur)
};

/* ------------------------------------------------------------
   DIE HINDERNISSE
   hoehe  = wie hoch man springen muss (in Hamster-Grössen)
   breite = wie breit das Hindernis ist – alle sperren den ganzen
            Weg, damit Ausweichen hier nicht hilft: springen!
   ------------------------------------------------------------ */
const Hindernisse = [
  { name: 'kiste',   hoehe: 0.72, breite: 3.20, tiefe: 1.2 },
  { name: 'pfuetze', hoehe: 0.34, breite: 3.50, tiefe: 1.0 },
  { name: 'roehren', hoehe: 0.95, breite: 2.95, tiefe: 1.3 }
];

/* ------------------------------------------------------------
   DIE SPERREN – da kommt man nicht drüber!
   Aymo, Leyan, Louise und Sophie stellen sich in den Weg.
   Über sie kann man NICHT springen – man muss auf eine freie
   Spur wischen. Es gibt drei Spuren: links, Mitte, rechts.
   ------------------------------------------------------------ */
const Sperre = {
  name: 'sperre',
  hoehe: 3.0,          // viel zu hoch – Springen bringt gar nichts
  breite: 1.0,
  tiefe: 1.1,
  abSekunde: 16,       // Erst nach 16 Sekunden tauchen sie auf
  haeufigkeit: 0.26,   // So oft kommen sie statt eines Sprung-Hindernisses

  /* Welche Spuren werden gesperrt? -1 = links, 0 = Mitte, 1 = rechts.
     Eine Spur bleibt immer frei – sonst käme man ja nicht durch! */
  muster: [
    { spuren: [0],      gewicht: 3 },   // Mitte zu  -> nach links ODER rechts
    { spuren: [-1],     gewicht: 2 },   // links zu  -> Mitte oder rechts
    { spuren: [1],      gewicht: 2 },   // rechts zu -> Mitte oder links
    { spuren: [-1, 0],  gewicht: 3 },   // nur rechts ist frei
    { spuren: [0, 1],   gewicht: 3 },   // nur links ist frei
    { spuren: [-1, 1],  gewicht: 3 }    // aussen zu -> zurück in die MITTE!
  ],

  /* Wer stellt sich in den Weg?
     einzeln = true bedeutet: die Figur kommt immer allein und
     bringt ihr eigenes Muster mit (Götti Mu und Marianne). */
  figuren: [
    { wer: 'isa',          gewicht: 3, hoehe: 1.90, breite: 0.85 },
    { wer: 'anja',         gewicht: 3, hoehe: 1.90, breite: 0.85 },
    { wer: 'aymo',         gewicht: 3, hoehe: 1.75, breite: 0.95 },
    { wer: 'louise',       gewicht: 3, hoehe: 1.45, breite: 0.80 },
    { wer: 'sophie',       gewicht: 3, hoehe: 1.70, breite: 0.95 },
    { wer: 'leyan',        gewicht: 3, hoehe: 1.80, breite: 0.95 }
  ]
};

/* ------------------------------------------------------------
   GÖTTI MU – der Jogger. Er läuft zwischen den Spuren hin und
   her, während er auf einen zukommt. Man muss dorthin, wo er
   GERADE NICHT ist. Springen hilft nicht.
   ------------------------------------------------------------ */
const GoettiMu = {
  name: 'goetti',
  hoehe: 3.0,
  breite: 1.0,
  tiefe: 1.1,
  abSekunde: 40,        // Er kommt erst später dazu
  haeufigkeit: 0.16,    // So oft statt einer normalen Sperre
  tempo: 1.9,           // Wie schnell er hin und her rennt
  kappiFarben: ['#3f6fb5', '#8a9099', '#f2f2f2']   // blau, grau, weiss
};

/* ------------------------------------------------------------
   MARIANNE mit dem Besen. Sie selbst steht fest auf einer Spur
   (da kommt man nicht durch), aber ihr BESEN wischt über die
   Nachbarspuren – über den Besen kann man SPRINGEN.
   ------------------------------------------------------------ */
const Marianne = {
  name: 'marianne',
  hoehe: 3.0,
  breite: 1.0,
  tiefe: 1.1,
  abSekunde: 30,
  haeufigkeit: 0.16,
  besenHoehe: 0.45,     // So hoch muss man springen, um über den Besen zu kommen
  tempo: 1.5            // Wie schnell sie wischt
};

/* ------------------------------------------------------------
   DIE DOPPELKISTE – zwei Kisten übereinander, auf zwei Spuren.
   Zu hoch zum Springen, man muss auf die freie Spur.
   ------------------------------------------------------------ */
const Doppelkiste = {
  name: 'doppelkiste',
  hoehe: 3.0,           // unüberspringbar
  breite: 1.0,
  tiefe: 1.2,
  abSekunde: 22,
  haeufigkeit: 0.10,
  bauhoehe: 1.55        // wie hoch der Stapel gezeichnet wird
};

/* ------------------------------------------------------------
   STROMKABEL, die aus der Wand hängen. Wer eines erwischt,
   wird 2,5 Sekunden elektrisiert und kann nicht steuern!
   Beim Stromausfall sind sie harmlos.
   ------------------------------------------------------------ */
const Kabel = {
  name: 'kabel',
  tiefe: 0.6,
  abSekunde: 26,
  ersteNachSek: 26,
  abstandMin: 16,       // in Sekunden
  abstandExtra: 22,
  schockDauer: 2.5,     // So lange ist der Hamster ausser Kontrolle
  freiRaum: 5
};

// Eine Möglichkeit nach Gewicht auswürfeln
function auswuerfeln(liste) {
  let summe = 0;
  for (const e of liste) summe += e.gewicht;
  let wurf = Math.random() * summe;
  for (const e of liste) {
    wurf -= e.gewicht;
    if (wurf <= 0) return e;
  }
  return liste[liste.length - 1];
}

/* ------------------------------------------------------------
   DIE PIZZA ZUM EINSAMMELN
   Ganze Pizza = 100 Punkte, ein Stück = 50 Punkte.
   Sie hängen über einem Hindernis – wer gut springt, kriegt sie.
   ------------------------------------------------------------ */
const Bonus = {
  // Pizza gibt keine PUNKTE mehr – sie ist das ESSEN des Hamsters!
  ganzEnergie:    4,             // eine ganze Pizza füllt den ganzen Kreis
  stueckEnergie:  1,             // ein Stück füllt ein Viertel
  ganzHoehe:    1.65,
  stueckHoehe:  1.62,
  bogen: [                       // drei Stücke im Sprungbogen (selten!)
    { dz: -1.3, hoehe: 1.45 },
    { dz:  0.0, hoehe: 1.78 },
    { dz:  1.3, hoehe: 1.45 }
  ],
  // Der Hamster MUSS regelmässig etwas finden, sonst verhungert er.
  // Darum kommt jetzt viel häufiger Pizza als früher.
  chanceStueck:  0.60,           // ein einzelnes Pizzastück
  chanceBogen:   0.06,           // drei Stücke im Bogen
  chanceGanz:    0.10            // eine ganze Pizza
};

/* ------------------------------------------------------------
   DIE ENERGIE – der Hamster hat Hunger!
   Der Kreis oben hat vier Viertel. Er startet mit EINEM Viertel,
   muss also schnell die erste Pizza erwischen. Ist der Kreis
   leer, ist das Spiel vorbei.
   ------------------------------------------------------------ */
const Energie = {
  maximum:        4,     // vier Viertel
  start:          1,     // hungrig starten!
  proSekunde:  0.085,    // so schnell wird der Hunger grösser
  warnungAb:      1      // ab hier blinkt der Kreis rot
};

/* ------------------------------------------------------------
   🤫 Etwas, das durch ein Gullirost von der Strasse gefallen ist
   ------------------------------------------------------------ */
const Geheimnis = {
  punkte:       75,
  ersteNachSek: 24,
  abstandMin:   34,
  abstandExtra: 38,
  freiRaum:      7      // So viel Platz braucht es zum nächsten Hindernis
};

/* ------------------------------------------------------------
   DER STROMAUSFALL
   Ab und zu fällt im Kanal das Licht aus. Die Lampen zucken nur
   noch – man sieht die Hindernisse viel schlechter!
   ------------------------------------------------------------ */
const Strom = {
  ersteNachSek: 42,     // Der erste Ausfall kommt nach ~42 Sekunden
  pauseMin:     38,     // Danach frühestens nach 38 Sekunden wieder
  pauseExtra:   34,
  dauerMin:      6,     // So lange bleibt es dunkel
  dauerExtra:    4,
  dunkelheit:  0.22     // Wie dunkel es wird (0 = stockdunkel, 1 = normal)
};

/* ------------------------------------------------------------
   DER ZUSTAND DES SPIELS
   ------------------------------------------------------------ */
const Spiel = {
  zustand: 'START',      // START | INTRO | SPIEL | CRASH | NAME | GAMEOVER
  zeit: 0,
  gesamtZeit: 0,
  punkte: 0,
  tempo: Einstellung.startTempo,
  tempoStufe: 1,
  strecke: 0,
  naechstePunkte: Einstellung.punkteIntervall,
  naechstesTempo: Einstellung.tempoIntervall,

  hamsterY: 0,           // Höhe über dem Boden
  hamsterTempoY: 0,
  amBoden: true,
  hamsterX: 0,           // Wo er gerade steht (links/mitte/rechts)
  zielX: 0,              // Wohin er möchte
  laufPhase: 0,
  sprungPuffer: 0,
  ausweichPuffer: 0,     // Wischen kurz vor der Landung merken

  hindernisse: [],
  naechsterSpawn: 16,
  letzteWarSperre: false,

  bonusse: [],           // Pizzas und Pizzastücke
  schaetze: [],          // 🤫
  naechsterSchatz: 0,
  pizzaZaehler: 0,
  herzen: [],
  goldGlanz: 0,

  // Die Energie (der Hunger des Hamsters)
  energie: Energie.start,

  // Die Stromkabel an der Wand
  kabel: [],
  naechstesKabel: 0,
  schockRest: 0,         // So lange ist er noch elektrisiert
  schockRichtung: 0,     // Wohin es ihn dabei zieht

  // Louises Drehung: unverwundbar, aber Punkte weg
  sternRest: 0,          // So lange ist er unverwundbar (wie mit Stern)
  drehung: 0,            // Wie weit er sich gerade gedreht hat

  // Leyans Giftwolke
  giftRest: 0,           // So lange sieht man fast nichts

  // Der Stromausfall
  stromRest: 0,          // Wie lange es noch dunkel bleibt
  naechsterStrom: 0,     // Wann das Licht das nächste Mal ausgeht
  licht: 1,              // 1 = hell, 0.2 = fast dunkel (weich überblendet)

  effekte: [],
  blitz: 0,
  crashZeit: 0,
  neuerPlatz: -1,        // Auf welchem Platz der Bestenliste man gelandet ist
  neuerName: ''          // Mit welchem Namen man sich eingetragen hat
};

/* ------------------------------------------------------------
   DIE SPRUNG-PHYSIK
   Je schneller der Hamster rennt, desto KÜRZER wird sein Sprung.
   Trick: Wir machen den Absprung stärker (× a) und die
   Schwerkraft viel stärker (× a × a). Dann bleibt die Sprung-
   HÖHE gleich, aber er ist schneller wieder unten – dadurch
   fliegt er nicht mehr so weit und das Spiel wird schwieriger.
   ------------------------------------------------------------ */
function sprungA() {
  const verhaeltnis = Spiel.tempo / Einstellung.startTempo;
  return Math.pow(verhaeltnis, Einstellung.sprungKuerzung);
}
function sprungKraftJetzt()   { return Einstellung.sprungKraft * sprungA(); }
function schwerkraftJetzt()   { const a = sprungA(); return Einstellung.schwerkraft * a * a; }
function flugzeit()           { return 2 * sprungKraftJetzt() / schwerkraftJetzt(); }

/* ------------------------------------------------------------
   BILDSCHIRMGRÖSSE EINSTELLEN (auch beim Drehen des Tablets)
   ------------------------------------------------------------ */
function groesseAnpassen() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  B = leinwand.clientWidth || window.innerWidth;
  H = leinwand.clientHeight || window.innerHeight;
  leinwand.width = Math.round(B * dpr);
  leinwand.height = Math.round(H * dpr);
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  Kamera.hamsterZ = Einstellung.hamsterZ;
  Kamera.neuBerechnen(B, H);
}
window.addEventListener('resize', groesseAnpassen);
window.addEventListener('orientationchange', () => setTimeout(groesseAnpassen, 250));

/* ------------------------------------------------------------
   EINE NEUE RUNDE STARTEN
   ------------------------------------------------------------ */
function rundeStarten() {
  Spiel.zeit = 0;
  Spiel.punkte = 0;
  Spiel.tempo = Einstellung.startTempo;
  Spiel.tempoStufe = 1;
  Spiel.strecke = 0;
  Spiel.naechstePunkte = Einstellung.punkteIntervall;
  Spiel.naechstesTempo = Einstellung.tempoIntervall;
  Spiel.hamsterY = 0;
  Spiel.hamsterTempoY = 0;
  Spiel.amBoden = true;
  Spiel.hamsterX = 0;
  Spiel.zielX = 0;
  Spiel.laufPhase = 0;
  Spiel.sprungPuffer = 0;
  Spiel.ausweichPuffer = 0;
  Spiel.hindernisse = [];
  Spiel.naechsterSpawn = 18;
  Spiel.letzteWarSperre = false;
  Spiel.bonusse = [];
  Spiel.schaetze = [];
  Spiel.naechsterSchatz = Einstellung.startTempo * Geheimnis.ersteNachSek;
  Spiel.energie = Energie.start;
  Spiel.kabel = [];
  Spiel.naechstesKabel = Einstellung.startTempo * Kabel.ersteNachSek;
  Spiel.schockRest = 0;
  Spiel.schockRichtung = 0;
  Spiel.sternRest = 0;
  Spiel.drehung = 0;
  Spiel.giftRest = 0;
  Spiel.stromRest = 0;
  Spiel.naechsterStrom = Strom.ersteNachSek;
  Spiel.licht = 1;
  Spiel.pizzaZaehler = 0;
  Spiel.herzen = [];
  Spiel.goldGlanz = 0;
  Spiel.effekte = [];
  Spiel.blitz = 0;
  Spiel.crashZeit = 0;
  Spiel.neuerPlatz = -1;
  Spiel.neuerName = '';
  Spiel.verhungert = false;
  Spiel.zustand = 'SPIEL';

  Audio2.tempo = 1;
  Audio2.musikStart();
}

/* ------------------------------------------------------------
   SPRINGEN UND AUSWEICHEN
   ------------------------------------------------------------ */
function springen() {
  if (Spiel.amBoden) {
    Spiel.hamsterTempoY = sprungKraftJetzt();
    Spiel.amBoden = false;
    Audio2.sprung();
  } else {
    Spiel.sprungPuffer = 0.13;   // kurz vor der Landung getippt? Gemerkt!
  }
}

// richtung: -1 = nach links, +1 = nach rechts
function ausweichen(richtung) {
  const neu = Math.max(-1, Math.min(1, Math.round(Spiel.zielX / Einstellung.spurX) + richtung));
  const zielNeu = neu * Einstellung.spurX;
  if (zielNeu !== Spiel.zielX) {
    Spiel.zielX = zielNeu;
    Audio2.ausweichen();
  }
}

/* ------------------------------------------------------------
   EIN NEUES HINDERNIS ERSCHAFFEN
   ------------------------------------------------------------ */
function hindernisErzeugen() {
  const z = 34;
  // --- Was kommt als Nächstes? ---
  const darfSperre = Spiel.zeit > Sperre.abSekunde && !Spiel.letzteWarSperre;
  const wieOft = Math.min(0.36, Sperre.haeufigkeit + (Spiel.tempoStufe - 1) * 0.022);

  if (darfSperre && Math.random() < wieOft) {
    Spiel.letzteWarSperre = true;

    /* Wer kommt? Wir sammeln alles, was jetzt schon erlaubt ist, und
       würfeln dann GEWICHTET aus. (Früher hing die Häufigkeit davon
       ab, was gerade freigeschaltet war – dadurch kam die Doppelkiste
       am Anfang viel zu oft.) */
    const moeglich = [];
    if (Spiel.zeit > GoettiMu.abSekunde)
      moeglich.push({ art: 'goetti', gewicht: GoettiMu.haeufigkeit });
    if (Spiel.zeit > Marianne.abSekunde)
      moeglich.push({ art: 'marianne', gewicht: Marianne.haeufigkeit });
    if (Spiel.zeit > Doppelkiste.abSekunde)
      moeglich.push({ art: 'doppelkiste', gewicht: Doppelkiste.haeufigkeit });
    // Der ganze Rest sind die Figuren (Isa, Anja, Aymo, Louise, Sophie, Leyan)
    let vergeben = 0;
    for (const m of moeglich) vergeben += m.gewicht;
    moeglich.push({ art: 'figuren', gewicht: Math.max(0.1, 1 - vergeben) });

    const wahl = auswuerfeln(moeglich).art;

    if (wahl === 'goetti') {
      const farbe = GoettiMu.kappiFarben[Math.floor(Math.random() * GoettiMu.kappiFarben.length)];
      Spiel.hindernisse.push({
        typ: GoettiMu, z: z, kappi: farbe,
        phase: Math.random() * Math.PI * 2, spurJetzt: 0, gemeldet: false
      });
    } else if (wahl === 'marianne') {
      const steht = [-1, 0, 1][Math.floor(Math.random() * 3)];
      Spiel.hindernisse.push({
        typ: Marianne, z: z, steht: steht,
        phase: Math.random() * Math.PI * 2, besenSpur: steht, gemeldet: false
      });
    } else if (wahl === 'doppelkiste') {
      // Die Doppelkiste steht immer auf ZWEI nebeneinanderliegenden Spuren
      const paare = [[-1, 0], [0, 1]];
      const paar = paare[Math.floor(Math.random() * paare.length)];
      Spiel.hindernisse.push({ typ: Doppelkiste, z: z, gesperrt: paar, gemeldet: false });
    } else {
      sperreErzeugen();
    }
  } else {
    Spiel.letzteWarSperre = false;
    const typ = Hindernisse[Math.floor(Math.random() * Hindernisse.length)];
    Spiel.hindernisse.push({ typ: typ, z: z });
    bonusVerteilen(typ);
  }

  /* --- Wann kommt das nächste? ---
     Nach der Landung braucht man noch Zeit zum Reagieren. Je
     schneller es wird, desto knapper wird diese Zeit.
     Und: mal kommt gleich das nächste, mal ist längere Pause –
     so wird der Rhythmus schön unregelmässig. */
  const reaktion = Math.max(0.34, 0.60 - (Spiel.tempoStufe - 1) * 0.035);
  const mindestAbstand = Spiel.tempo * (flugzeit() + reaktion);

  const wuerfel = Math.random();
  let extraSek;
  if (wuerfel < 0.20)      extraSek = Math.random() * 0.14;          // dicht hintereinander
  else if (wuerfel < 0.70) extraSek = 0.28 + Math.random() * 0.50;   // normal
  else                     extraSek = 0.85 + Math.random() * 1.10;   // Verschnaufpause

  Spiel.naechsterSpawn = Spiel.strecke + mindestAbstand + Spiel.tempo * extraSek;
}

/* --- Eine Sperre aufstellen: wer stellt sich auf welche Spur? --- */
function sperreErzeugen() {
  const muster = auswuerfeln(Sperre.muster);
  const figuren = muster.spuren.map((spur) => {
    const f = auswuerfeln(Sperre.figuren);
    return {
      wer: f.wer,
      spur: spur,
      hoehe: f.hoehe,
      breite: f.breite,
      // Sophie macht ab und zu ein Selfie
      selfie: (f.wer === 'sophie') && Math.random() < 0.45,
      // Leyan sprüht sein Gift auf eine Nachbarspur
      spruehZu: (f.wer === 'leyan')
        ? (spur === 1 ? -1 : spur === -1 ? 1 : (Math.random() < 0.5 ? -1 : 1))
        : 0
    };
  });

  // Louise ist keine tödliche Sperre – in sie kann man hineinlaufen!
  // Darum zählt ihre Spur nicht als gesperrt.
  const toedlich = figuren.filter(f => f.wer !== 'louise').map(f => f.spur);

  Spiel.hindernisse.push({
    typ: Sperre,
    z: 34,
    gesperrt: toedlich,
    figuren: figuren,
    gemeldet: false
  });
}

/* --- Manchmal hängt Pizza über einem Hindernis --- */
function bonusVerteilen(typ) {
  let wuerfel = Math.random();
  const mitte = 34 + typ.tiefe / 2;
  // Die Pizza hängt über einer ZUFÄLLIGEN Spur – nicht mehr immer
  // in der Mitte. Man muss also hinlenken!
  const spur = [-1, 0, 1][Math.floor(Math.random() * 3)];

  if (wuerfel < Bonus.chanceStueck) {
    Spiel.bonusse.push({ art: 'stueck', z: mitte, spur: spur,
                         hoehe: Bonus.stueckHoehe, gefangen: false });
    return;
  }
  wuerfel -= Bonus.chanceStueck;

  if (wuerfel < Bonus.chanceBogen) {
    // Selten: drei Stücke im Bogen – alle auf derselben Spur
    for (const b of Bonus.bogen) {
      Spiel.bonusse.push({ art: 'stueck', z: mitte + b.dz, spur: spur,
                           hoehe: b.hoehe, gefangen: false });
    }
    return;
  }
  wuerfel -= Bonus.chanceBogen;

  if (wuerfel < Bonus.chanceGanz) {
    Spiel.bonusse.push({ art: 'ganz', z: mitte, spur: spur,
                         hoehe: Bonus.ganzHoehe, gefangen: false });
  }
}

/* ------------------------------------------------------------
   DAS SPIEL WEITERRECHNEN (jeden Bild-Schritt)
   ------------------------------------------------------------ */
function spielAktualisieren(dt) {
  Spiel.zeit += dt;
  Spiel.strecke += Spiel.tempo * dt;
  Spiel.laufPhase += dt * Spiel.tempo * 2.4;
  if (Spiel.blitz > 0) Spiel.blitz -= dt * 2;

  /* --- DER HUNGER: die Energie wird langsam weniger --- */
  Spiel.energie -= Energie.proSekunde * dt;
  if (Spiel.energie <= 0) { Spiel.energie = 0; verhungert(); return; }

  /* --- Die Zeitgeber für Schock, Stern und Gift --- */
  if (Spiel.schockRest > 0) Spiel.schockRest -= dt;
  if (Spiel.giftRest > 0)   Spiel.giftRest -= dt;
  if (Spiel.sternRest > 0) {
    Spiel.sternRest -= dt;
    Spiel.drehung += dt * 12;         // er wirbelt mehrmals herum
    if (Spiel.sternRest <= 0) Spiel.drehung = 0;
  }

  /* --- SEITWÄRTS: er gleitet weich zur gewünschten Spur --- */
  if (Spiel.schockRest > 0) {
    // Elektrisiert! Er zappelt unkontrolliert hin und her.
    Spiel.hamsterX += Math.sin(Spiel.zeit * 26) * Spiel.schockRichtung * dt * 3.4;
    Spiel.hamsterX = Math.max(-Einstellung.spurX * 1.35,
                     Math.min(Einstellung.spurX * 1.35, Spiel.hamsterX));
    Spiel.zielX = Spiel.hamsterX;
  } else {
    const unterschied = Spiel.zielX - Spiel.hamsterX;
    Spiel.hamsterX += unterschied * Math.min(1, dt * Einstellung.spurTempo * 2.2);
    if (Math.abs(unterschied) < 0.002) Spiel.hamsterX = Spiel.zielX;
  }

  /* --- SPRINGEN --- */
  if (!Spiel.amBoden) {
    Spiel.hamsterTempoY -= schwerkraftJetzt() * dt;
    Spiel.hamsterY += Spiel.hamsterTempoY * dt;
    if (Spiel.hamsterY <= 0) {
      Spiel.hamsterY = 0;
      Spiel.hamsterTempoY = 0;
      Spiel.amBoden = true;
      if (Spiel.sprungPuffer > 0) { Spiel.sprungPuffer = 0; springen(); }
    }
  }
  if (Spiel.sprungPuffer > 0) Spiel.sprungPuffer -= dt;

  /* --- PUNKTE: alle 10 Sekunden gibt es 100 Punkte --- */
  if (Spiel.zeit >= Spiel.naechstePunkte) {
    Spiel.punkte += Einstellung.punkteProMal;
    Spiel.naechstePunkte += Einstellung.punkteIntervall;
    Spiel.effekte.push({ text: '+' + Einstellung.punkteProMal, leben: 1.4, maxLeben: 1.4, art: 'punkte' });
    Audio2.punkte();
  }

  /* --- TEMPO: alle 30 Sekunden wird der Hamster schneller --- */
  if (Spiel.zeit >= Spiel.naechstesTempo) {
    Spiel.tempo = Math.min(Einstellung.maxTempo, Spiel.tempo * Einstellung.tempoFaktor);
    Spiel.tempoStufe++;
    Spiel.naechstesTempo += Einstellung.tempoIntervall;
    Spiel.effekte.push({ text: 'SCHNELLER! 💨', leben: 1.8, maxLeben: 1.8, art: 'tempo' });
    Spiel.blitz = 1;
    Audio2.tempo = Math.min(2.2, Spiel.tempo / Einstellung.startTempo);
    Audio2.schneller();
  }

  /* --- NEUE HINDERNISSE --- */
  if (Spiel.strecke >= Spiel.naechsterSpawn) hindernisErzeugen();

  /* --- DER STROMAUSFALL --- */
  stromAktualisieren(dt);

  /* --- ALLES KOMMT AUF UNS ZU --- */
  const weg = Spiel.tempo * dt;
  for (const h of Spiel.hindernisse) h.z -= weg;
  for (const b of Spiel.bonusse) b.z -= weg;
  for (const sch of Spiel.schaetze) sch.z -= weg;
  for (const k of Spiel.kabel) k.z -= weg;
  Spiel.hindernisse = Spiel.hindernisse.filter(h => h.z > -4);
  Spiel.kabel = Spiel.kabel.filter(k => k.z > -2);

  /* --- Die beweglichen Figuren bewegen sich --- */
  for (const h of Spiel.hindernisse) {
    if (h.typ.name === 'goetti') {
      // Götti Mu joggt zwischen links und rechts hin und her.
      // Wichtig: Er hält sich fast immer AUF einer Spur auf und
      // wechselt zügig – sonst würde er zwischendurch zwei Spuren
      // gleichzeitig blockieren, und das wäre nicht zu schaffen.
      const welle = Math.sin(Spiel.gesamtZeit * GoettiMu.tempo + h.phase);
      h.spurJetzt = Math.sign(welle) * Math.pow(Math.abs(welle), 0.30);
    } else if (h.typ.name === 'marianne') {
      // Marianne wischt: in der Mitte von links bis rechts,
      // am Rand nur bis zur Mitte.
      const schwung = Math.sin(Spiel.gesamtZeit * Marianne.tempo + h.phase);
      h.besenSpur = (h.steht === 0) ? schwung : h.steht + (-h.steht) * (schwung * 0.5 + 0.5);
    }
  }

  /* --- Die Sperren machen auf sich aufmerksam, sobald man sie sieht --- */
  for (const h of Spiel.hindernisse) {
    if (!h.gemeldet && h.z < 22) {
      h.gemeldet = true;
      if (h.typ.name === 'sperre') {
        if (h.figuren.some(f => f.wer === 'isa' || f.wer === 'anja')) Audio2.pfiff();
        else if (h.figuren.some(f => f.selfie)) Audio2.selfie();
        else if (h.figuren.some(f => f.wer === 'leyan')) Audio2.zischen();
      } else if (h.typ.name === 'goetti') {
        Audio2.keuchen();
      } else if (h.typ.name === 'marianne') {
        Audio2.wischen();
      }
    }
  }

  /* --- NEUE STROMKABEL --- */
  kabelAktualisieren(dt);

  /* --- ZUSAMMENSTOSS PRÜFEN --- */
  const hz = Einstellung.hamsterZ;
  const sX = Einstellung.spurX;
  const sicher = Einstellung.sicherAbstand;

  for (const h of Spiel.hindernisse) {
    const beruehrt = (h.z + h.typ.tiefe > hz - 0.30) && (h.z < hz + 0.30);
    if (!beruehrt) continue;

    if (h.typ.name === 'sperre' || h.typ.name === 'doppelkiste') {
      // Springen hilft nicht – nur auf eine freie Spur ausweichen!
      for (const spur of h.gesperrt) {
        if (Math.abs(Spiel.hamsterX - spur * sX) < sicher) { treffer(h); return; }
      }
      // Louise dreht einen durch – aber sie ist nicht tödlich
      if (h.typ.name === 'sperre' && !h.louiseGenutzt) {
        for (const f of h.figuren) {
          if (f.wer === 'louise' && Math.abs(Spiel.hamsterX - f.spur * sX) < sicher) {
            h.louiseGenutzt = true;
            louiseDreht();
          }
        }
      }
      // Leyans Giftwolke liegt auf der Nachbarspur
      if (h.typ.name === 'sperre') {
        for (const f of h.figuren) {
          if (f.wer === 'leyan') {
            const giftSpur = f.spur + f.spruehZu;
            if (Math.abs(Spiel.hamsterX - giftSpur * sX) < sicher && Spiel.giftRest <= 0) {
              vergiftet();
            }
          }
        }
      }
    } else if (h.typ.name === 'goetti') {
      // Er ist genau dort, wo er gerade joggt
      const seinX = h.spurJetzt * sX;
      if (Math.abs(Spiel.hamsterX - seinX) < sicher * 0.80) { treffer(h); return; }
    } else if (h.typ.name === 'marianne') {
      // Marianne selbst: tödlich. Ihr Besen: drüberspringen!
      if (Math.abs(Spiel.hamsterX - h.steht * sX) < sicher) { treffer(h); return; }
      const besenX = h.besenSpur * sX;
      if (Math.abs(Spiel.hamsterX - besenX) < sicher &&
          Spiel.hamsterY < Marianne.besenHoehe - 0.06) { treffer(h); return; }
    } else {
      if (Spiel.hamsterY < h.typ.hoehe - 0.06) { treffer(h); return; }
    }
  }

  bonusAktualisieren(dt);

  /* --- SCHWEBENDE TEXTE --- */
  for (const e of Spiel.effekte) e.leben -= dt;
  Spiel.effekte = Spiel.effekte.filter(e => e.leben > 0);
}

/* ------------------------------------------------------------
   WAS PASSIERT BEI EINEM TREFFER?
   Wer gerade von Louise gedreht wurde, ist unverwundbar.
   ------------------------------------------------------------ */
function treffer(hindernis) {
  if (Spiel.sternRest > 0) return;     // Wie mit einem Stern bei Mario!
  absturz();
}

/* --- Louise dreht den Hamster: 5 s unverwundbar, aber 50 Punkte weg --- */
function louiseDreht() {
  Spiel.sternRest = 5;
  Spiel.drehung = 0;
  Spiel.punkte = Math.max(0, Spiel.punkte - 50);
  Spiel.effekte.push({ text: '💫 GEDREHT!  -50', leben: 1.8, maxLeben: 1.8, art: 'louise' });
  Audio2.wirbel();
}

/* --- Leyans Gift: 5 Sekunden sieht man fast nichts --- */
function vergiftet() {
  Spiel.giftRest = 5;
  Spiel.effekte.push({ text: '☠ VERGIFTET!', leben: 1.8, maxLeben: 1.8, art: 'gift' });
  Audio2.husten();
}

/* --- Der Hamster hat nichts mehr zu essen --- */
function verhungert() {
  Spiel.zustand = 'CRASH';
  Spiel.crashZeit = 0;
  Spiel.verhungert = true;
  Audio2.musikStopp();
  Audio2.magenknurren();
}

/* ------------------------------------------------------------
   DER STROMAUSFALL
   Die Lampen zucken nur noch ganz kurz auf – es wird richtig
   dunkel. Dafür haben die Kabel dann keinen Strom mehr.
   ------------------------------------------------------------ */
function stromAktualisieren(dt) {
  if (Spiel.stromRest > 0) {
    Spiel.stromRest -= dt;
    if (Spiel.stromRest <= 0) {
      Spiel.stromRest = 0;
      Spiel.naechsterStrom = Spiel.zeit + Strom.pauseMin + Math.random() * Strom.pauseExtra;
      Spiel.effekte.push({ text: '💡 Licht wieder da!', leben: 1.4, maxLeben: 1.4, art: 'strom' });
      Audio2.stromAn();
    }
  } else if (Spiel.zeit >= Spiel.naechsterStrom) {
    Spiel.stromRest = Strom.dauerMin + Math.random() * Strom.dauerExtra;
    Spiel.effekte.push({ text: '⚡ STROMAUSFALL!', leben: 2.0, maxLeben: 2.0, art: 'strom' });
    Audio2.stromAus();
  }

  // Das Licht geht weich aus und wieder an (nicht ruckartig)
  const ziel = Spiel.stromRest > 0 ? Strom.dunkelheit : 1;
  Spiel.licht += (ziel - Spiel.licht) * Math.min(1, dt * 4.5);
}

/* ------------------------------------------------------------
   DIE STROMKABEL AN DER WAND
   ------------------------------------------------------------ */
function kabelAktualisieren(dt) {
  if (Spiel.zeit > Kabel.abSekunde && Spiel.strecke >= Spiel.naechstesKabel) {
    const platzFrei = Spiel.hindernisse.every(h => Math.abs(h.z - 34) > Kabel.freiRaum);
    if (platzFrei) {
      // Das Kabel hängt über einer der drei Spuren von der Decke
      const spur = [-1, 0, 1][Math.floor(Math.random() * 3)];
      Spiel.kabel.push({ z: 34, spur: spur, benutzt: false });
      Spiel.naechstesKabel = Spiel.strecke + Spiel.tempo *
        (Kabel.abstandMin + Math.random() * Kabel.abstandExtra);
    } else {
      Spiel.naechstesKabel = Spiel.strecke + 2;
    }
  }

  // Berührt der Hamster ein Kabel? Beim Stromausfall ist es harmlos!
  const hz = Einstellung.hamsterZ;
  const hatStrom = Spiel.stromRest <= 0;
  for (const k of Spiel.kabel) {
    if (k.benutzt || !hatStrom) continue;
    const nah = Math.abs(k.z - hz) < 0.7;
    const aufSpur = Math.abs(Spiel.hamsterX - k.spur * Einstellung.spurX) < Einstellung.sicherAbstand;
    // Das Kabelende hängt tief – auch beim Springen erwischt es einen
    if (nah && aufSpur && Spiel.sternRest <= 0) {
      k.benutzt = true;
      Spiel.schockRest = Kabel.schockDauer;
      Spiel.schockRichtung = Math.random() < 0.5 ? -1 : 1;
      Spiel.effekte.push({ text: '⚡ STROMSCHLAG!', leben: 1.8, maxLeben: 1.8, art: 'schock' });
      Audio2.stromschlag();
    }
  }
}

/* ------------------------------------------------------------
   PIZZA UND ÜBERRASCHUNG EINSAMMELN
   ------------------------------------------------------------ */
function bonusAktualisieren(dt) {
  const hz = Einstellung.hamsterZ;

  // --- Pizza einsammeln: NUR auf der richtigen Spur! ---
  for (const b of Spiel.bonusse) {
    if (b.gefangen) continue;
    const nah = Math.abs(b.z - hz) < 0.80;
    const aufSpur = Math.abs(Spiel.hamsterX - b.spur * Einstellung.spurX) < 0.75;
    const hoch = (Spiel.hamsterY + Einstellung.hamsterHoehe > b.hoehe - 0.30)
              && (Spiel.hamsterY < b.hoehe + 0.60);
    if (nah && aufSpur && hoch) bonusGefangen(b);
  }
  Spiel.bonusse = Spiel.bonusse.filter(b => b.z > -1.5 && !b.gefangen);

  // --- 🤫 Die Überraschung ---
  if (Spiel.strecke >= Spiel.naechsterSchatz) {
    const platzFrei = Spiel.hindernisse.every(h => Math.abs(h.z - 34) > Geheimnis.freiRaum);
    if (platzFrei) {
      const spur = [-1, 0, 1][Math.floor(Math.random() * 3)];
      Spiel.schaetze.push({ z: 34, spur: spur, gefangen: false, weg: 0 });
      Spiel.naechsterSchatz = Spiel.strecke + Spiel.tempo *
        (Geheimnis.abstandMin + Math.random() * Geheimnis.abstandExtra);
    } else {
      Spiel.naechsterSchatz = Spiel.strecke + 2;
    }
  }
  for (const sch of Spiel.schaetze) {
    if (!sch.gefangen && Math.abs(sch.z - hz) < 0.85
        && Math.abs(Spiel.hamsterX - sch.spur * Einstellung.spurX) < 0.85) {
      sch.gefangen = true;
      sch.weg = 1;
      Spiel.punkte += Geheimnis.punkte;
      Audio2.klimpern();
      Spiel.effekte.push({ text: '✨ SCHATZ! +' + Geheimnis.punkte,
                           leben: 1.6, maxLeben: 1.6, art: 'schatz' });
      herzchenSpruehen(6);
    }
    if (sch.weg > 0) sch.weg -= dt * 1.1;
  }
  Spiel.schaetze = Spiel.schaetze.filter(sch => sch.z > -2 && !(sch.gefangen && sch.weg <= 0));

  // --- Herzchen und Glanz ausblenden ---
  for (const herz of Spiel.herzen) {
    herz.leben -= dt;
    herz.x += herz.vx * dt;
    herz.y += herz.vy * dt;
    herz.vy += 40 * dt;
  }
  Spiel.herzen = Spiel.herzen.filter(herz => herz.leben > 0);
  if (Spiel.goldGlanz > 0) Spiel.goldGlanz -= dt * 1.6;
}

function bonusGefangen(b) {
  b.gefangen = true;
  const ganz = (b.art === 'ganz');
  // Pizza gibt ENERGIE statt Punkte – der Hamster hat ja Hunger!
  const futter = ganz ? Bonus.ganzEnergie : Bonus.stueckEnergie;
  const vorher = Spiel.energie;
  Spiel.energie = Math.min(Energie.maximum, Spiel.energie + futter);
  const gewonnen = Spiel.energie - vorher;
  if (ganz) Spiel.pizzaZaehler++;

  if (ganz) {
    Spiel.goldGlanz = 1;
    Audio2.pizzaFanfare();
    Spiel.effekte.push({ text: '🍕 GANZE PIZZA! ', leben: 1.7, maxLeben: 1.7, art: 'pizza' });
    herzchenSpruehen(12);
  } else {
    Audio2.stueck();
    Spiel.effekte.push({ text: '🍕 mmh!', leben: 0.85, maxLeben: 0.85, art: 'pizza' });
    herzchenSpruehen(3);
  }
}

// Ein Schwarm Herzchen fliegt vom Hamster weg (dort, wo er GERADE ist)
function herzchenSpruehen(anzahl) {
  const skala = Kamera.groesse(Einstellung.hamsterZ);
  const boden = Kamera.punkt(Spiel.hamsterX, 0, Einstellung.hamsterZ);
  const hoch = Einstellung.hamsterHoehe * skala;
  const kopfY = boden.y - Spiel.hamsterY * skala - hoch * 0.85;
  for (let i = 0; i < anzahl; i++) {
    const winkel = -Math.PI / 2 + (Math.random() - 0.5) * 2.6;
    const tempo = (110 + Math.random() * 210) * (H / 800);
    Spiel.herzen.push({
      x: boden.x + (Math.random() - 0.5) * hoch * 0.9,
      y: kopfY + (Math.random() - 0.5) * hoch * 0.5,
      vx: Math.cos(winkel) * tempo,
      vy: Math.sin(winkel) * tempo,
      groesse: H * (0.013 + Math.random() * 0.013),
      leben: 0.8 + Math.random() * 0.6
    });
  }
}

/* ------------------------------------------------------------
   ZUSAMMENSTOSS! GAME OVER
   ------------------------------------------------------------ */
function absturz() {
  Spiel.zustand = 'CRASH';
  Spiel.crashZeit = 0;
  Audio2.musikStopp();
  Audio2.crash();
}

// Nach der Crash-Animation: Name eingeben oder direkt Game Over
function nachDemCrash() {
  if (Bestenliste.schafftEsRein(Spiel.punkte)) {
    namensfeldZeigen();
  } else {
    Spiel.zustand = 'GAMEOVER';
  }
}

/* ============================================================
   ZEICHNEN
   ============================================================ */

let knopfBereich = null;
let tonKnopfBereich = null;

function spielZeichnen() {
  // Die Kamera schwenkt ein Stück mit, wenn der Hamster ausweicht.
  // Nicht ganz – so sieht man, dass er sich zur Seite bewegt hat.
  Kamera.camX = Spiel.hamsterX * 0.55;

  // 1. Der Tunnel (beim Stromausfall viel dunkler)
  Grafik.tunnel(g, Spiel.strecke, Spiel.gesamtZeit, Spiel.licht);

  const hz = Einstellung.hamsterZ;

  // 2. Alles, was auf uns zukommt – von weit hinten nach vorne
  const dinge = [];
  for (const h of Spiel.hindernisse) dinge.push({ z: h.z, was: 'hindernis', d: h });
  for (const b of Spiel.bonusse)     dinge.push({ z: b.z, was: 'bonus',     d: b });
  for (const s of Spiel.schaetze)    dinge.push({ z: s.z, was: 'schatz',    d: s });
  for (const k of Spiel.kabel)       dinge.push({ z: k.z, was: 'kabel',     d: k });
  dinge.sort((a, b) => b.z - a.z);

  for (const ding of dinge) {
    if (ding.z < -0.6) continue;
    // Ganz weit hinten einblenden, beim Vorbeiziehen ausblenden
    g.globalAlpha = Math.max(0, Math.min(1,
      ding.z > 26 ? (34 - ding.z) / 8 : (ding.z < 0.2 ? (ding.z + 0.6) / 0.8 : 1)));
    if (ding.was === 'hindernis')  hindernisZeichnen(ding.d);
    else if (ding.was === 'bonus') bonusZeichnen(ding.d);
    else if (ding.was === 'kabel') kabelZeichnen(ding.d);
    else                           schatzZeichnen(ding.d);
    g.globalAlpha = 1;
  }

  // 3. Der Hamster
  const skala = Kamera.groesse(hz);
  const boden = Kamera.punkt(Spiel.hamsterX, 0, hz);
  const hoeheAufSchirm = Einstellung.hamsterHoehe * skala;
  const yVersatz = Spiel.hamsterY * skala;

  // Schatten: kleiner und blasser, je höher er springt
  const hoehenAnteil = Math.min(1, Spiel.hamsterY / 1.4);
  Grafik.schatten(g, boden.x, boden.y,
                  hoeheAufSchirm * 0.42 * (1 - hoehenAnteil * 0.45),
                  1 - hoehenAnteil * 0.6);

  if (Spiel.zustand === 'CRASH') {
    const w = Math.sin(Spiel.crashZeit * 22) * 0.28;
    g.save();
    g.translate(boden.x, boden.y);
    g.rotate(w);
    g.translate(-boden.x, -boden.y);
    Grafik.hamsterHinten(g, boden.x, boden.y, hoeheAufSchirm, 0, true, Spiel.gesamtZeit);
    g.restore();
    for (let i = 0; i < 4; i++) {
      const a = Spiel.crashZeit * 5 + i * Math.PI / 2;
      g.fillStyle = '#ffd84d';
      stern(g, boden.x + Math.cos(a) * hoeheAufSchirm * 0.45,
               boden.y - hoeheAufSchirm * 1.20 + Math.sin(a) * hoeheAufSchirm * 0.14,
               hoeheAufSchirm * 0.10);
      g.fill();
    }
  } else {
    // Beim Ausweichen legt er sich leicht in die Kurve
    let neigung = Math.max(-0.9, Math.min(0.9, (Spiel.zielX - Spiel.hamsterX))) * 0.30;
    // Louise hat ihn gedreht: er wirbelt mehrmals herum
    if (Spiel.sternRest > 0) neigung += Spiel.drehung;
    // Elektrisiert: er zittert
    if (Spiel.schockRest > 0) neigung += Math.sin(Spiel.gesamtZeit * 40) * 0.22;

    // Wie bei Mario mit dem Stern: er blinkt, solange er unverwundbar ist
    if (Spiel.sternRest > 0) {
      g.globalAlpha = (Math.sin(Spiel.gesamtZeit * 22) > -0.2) ? 1 : 0.30;
    }
    // Beim Wirbeln dreht er sich um seine MITTE (sonst würde er
    // um die Füsse schwingen und aus dem Bild rutschen)
    const drehPunktY = boden.y - yVersatz
                     - (Spiel.sternRest > 0 ? hoeheAufSchirm * 0.5 : 0);
    g.save();
    g.translate(boden.x, drehPunktY);
    g.rotate(neigung);
    g.translate(-boden.x, -drehPunktY);
    Grafik.hamsterHinten(g, boden.x, boden.y - yVersatz,
                         hoeheAufSchirm, Spiel.laufPhase, !Spiel.amBoden, Spiel.gesamtZeit);
    g.restore();
    g.globalAlpha = 1;

    // Beim Stromschlag zucken Blitze um ihn herum
    if (Spiel.schockRest > 0) {
      g.strokeStyle = 'rgba(255, 240, 120, 0.9)';
      g.lineWidth = Math.max(2, hoeheAufSchirm * 0.035);
      g.lineCap = 'round';
      for (let i = 0; i < 5; i++) {
        const w = Spiel.gesamtZeit * 18 + i * 1.26;
        const r1 = hoeheAufSchirm * 0.55, r2 = hoeheAufSchirm * 0.85;
        g.beginPath();
        g.moveTo(boden.x + Math.cos(w) * r1,
                 boden.y - yVersatz - hoeheAufSchirm * 0.5 + Math.sin(w) * r1 * 0.7);
        g.lineTo(boden.x + Math.cos(w + 0.4) * r2,
                 boden.y - yVersatz - hoeheAufSchirm * 0.5 + Math.sin(w + 0.4) * r2 * 0.7);
        g.stroke();
      }
    }

    // Solange er sich dreht, wirbeln Sternchen um ihn
    if (Spiel.sternRest > 0) {
      g.fillStyle = '#ffe27a';
      for (let i = 0; i < 4; i++) {
        const w = Spiel.gesamtZeit * 7 + i * Math.PI / 2;
        stern(g, boden.x + Math.cos(w) * hoeheAufSchirm * 0.75,
                 boden.y - yVersatz - hoeheAufSchirm * 0.55 + Math.sin(w) * hoeheAufSchirm * 0.25,
                 hoeheAufSchirm * 0.11);
        g.fill();
      }
    }
  }

  // 3b. Herzchen
  for (const herz of Spiel.herzen) {
    g.globalAlpha = Math.min(1, herz.leben * 1.6);
    g.fillStyle = '#ff5a72';
    herzForm(g, herz.x, herz.y, herz.groesse);
    g.fill();
  }
  g.globalAlpha = 1;

  // 3b2. VERGIFTET: der Bildschirm wird grün und verschwommen
  //      (wie bei Minecraft, wenn man Gift abbekommen hat)
  if (Spiel.giftRest > 0) {
    const staerke = Math.min(1, Spiel.giftRest / 5) * 0.78;
    const wabern = Math.sin(Spiel.gesamtZeit * 3) * 0.06;
    const gift = g.createRadialGradient(B / 2, H / 2, 0, B / 2, H / 2, Math.max(B, H) * 0.75);
    gift.addColorStop(0, 'rgba(90, 170, 60, ' + (staerke * (0.45 + wabern)) + ')');
    gift.addColorStop(1, 'rgba(50, 120, 35, ' + (staerke * 0.95) + ')');
    g.fillStyle = gift;
    g.fillRect(0, 0, B, H);
    // Grüne Schwaden, die durchs Bild ziehen
    g.fillStyle = 'rgba(150, 220, 110, ' + (staerke * 0.20) + ')';
    for (let i = 0; i < 5; i++) {
      const wy = ((Spiel.gesamtZeit * 40 + i * H / 5) % (H + 200)) - 100;
      g.beginPath();
      g.ellipse(B / 2 + Math.sin(Spiel.gesamtZeit + i) * B * 0.3, wy,
                B * 0.42, H * 0.10, 0, 0, Math.PI * 2);
      g.fill();
    }
  }

  // 3c. STROMAUSFALL: alles wird dunkel. Ein bisschen Restlicht bleibt
  //     um den Hamster herum, damit man ihn noch findet.
  if (Spiel.licht < 0.99) {
    const dunkel = (1 - Spiel.licht) * 0.88;
    const loch = g.createRadialGradient(boden.x, boden.y - hoeheAufSchirm * 0.5, 0,
                                        boden.x, boden.y - hoeheAufSchirm * 0.5,
                                        hoeheAufSchirm * 4.5);
    loch.addColorStop(0, `rgba(2, 5, 4, ${dunkel * 0.35})`);
    loch.addColorStop(1, `rgba(2, 5, 4, ${dunkel})`);
    g.fillStyle = loch;
    g.fillRect(0, 0, B, H);
  }

  // 4. Aufblitzen
  if (Spiel.blitz > 0) {
    g.fillStyle = `rgba(255, 250, 200, ${Spiel.blitz * 0.28})`;
    g.fillRect(0, 0, B, H);
  }
  if (Spiel.goldGlanz > 0) {
    g.fillStyle = `rgba(255, 205, 90, ${Spiel.goldGlanz * 0.26})`;
    g.fillRect(0, 0, B, H);
  }

  // 5. Die Anzeige oben
  anzeigeZeichnen();
}

function hindernisZeichnen(h) {
  const z = h.z;
  const s = Kamera.groesse(z);
  const sX = Einstellung.spurX;

  // Ein kleiner Schatten unter jeder Figur
  function figurSchatten(px, py, breite) {
    g.fillStyle = 'rgba(0,0,0,0.45)';
    g.beginPath();
    g.ellipse(px, py, breite * 0.60, breite * 0.15, 0, 0, Math.PI * 2);
    g.fill();
  }

  /* --- GÖTTI MU: joggt zwischen den Spuren hin und her --- */
  if (h.typ.name === 'goetti') {
    const p = Kamera.punkt(h.spurJetzt * sX, 0, z);
    const fb = 0.85 * s, fh = 1.75 * s;
    figurSchatten(p.x, p.y, fb);
    Grafik.goettiMu(g, p.x, p.y, fb, fh, Spiel.gesamtZeit, h.kappi);
    return;
  }

  /* --- MARIANNE mit dem wischenden Besen --- */
  if (h.typ.name === 'marianne') {
    const p = Kamera.punkt(h.steht * sX, 0, z);
    const besenP = Kamera.punkt(h.besenSpur * sX, 0, z);
    const fb = 0.85 * s, fh = 1.70 * s;
    figurSchatten(p.x, p.y, fb);
    Grafik.marianne(g, p.x, p.y, fb, fh, Spiel.gesamtZeit, besenP.x - p.x);
    return;
  }

  /* --- DIE DOPPELKISTE auf zwei Spuren --- */
  if (h.typ.name === 'doppelkiste') {
    // Eine breite Kiste über beide gesperrten Spuren
    const mitteSpur = (h.gesperrt[0] + h.gesperrt[1]) / 2;
    const p = Kamera.punkt(mitteSpur * sX, 0, z);
    const breite = (Math.abs(h.gesperrt[1] - h.gesperrt[0]) * sX + 1.5) * s;
    g.fillStyle = 'rgba(0,0,0,0.4)';
    g.beginPath();
    g.ellipse(p.x, p.y, breite * 0.50, breite * 0.07, 0, 0, Math.PI * 2);
    g.fill();
    Grafik.doppelkiste(g, p.x, p.y, breite, Doppelkiste.bauhoehe * s);
    return;
  }

  /* --- DIE SPERREN: Isa, Anja, Aymo, Louise, Sophie, Leyan --- */
  if (h.typ.name === 'sperre') {
    // Erst die Giftwolken (sie liegen hinter den Figuren)
    for (const f of h.figuren) {
      if (f.wer === 'leyan') {
        const gp = Kamera.punkt((f.spur + f.spruehZu) * sX, 0, z);
        Grafik.giftwolke(g, gp.x, gp.y, 0.95 * s, Spiel.gesamtZeit);
      }
    }
    for (const f of h.figuren) {
      const p = Kamera.punkt(f.spur * sX, 0, z);
      const fb = f.breite * s, fh = f.hoehe * s;
      figurSchatten(p.x, p.y, fb);
      switch (f.wer) {
        case 'isa':
          Grafik.polizistin(g, p.x, p.y, fb, fh, 'Isa', '#6b4326', false); break;
        case 'anja':
          Grafik.polizistin(g, p.x, p.y, fb, fh, 'Anja', '#f0cf6a', true); break;
        case 'aymo':
          Grafik.jungeAufKatze(g, p.x, p.y, fb, fh, Spiel.gesamtZeit); break;
        case 'louise':
          Grafik.louise(g, p.x, p.y, fb, fh, Spiel.gesamtZeit); break;
        case 'sophie':
          Grafik.sophieAufRatte(g, p.x, p.y, fb, fh, Spiel.gesamtZeit, f.selfie); break;
        case 'leyan':
          Grafik.kammerjaegerAufHuhn(g, p.x, p.y, fb, fh, Spiel.gesamtZeit, f.spruehZu); break;
      }
    }
    return;
  }

  /* --- DIE SPRUNG-HINDERNISSE --- */
  const boden = Kamera.punkt(0, 0, z);
  const hoehe = h.typ.hoehe * s;
  const breite = h.typ.breite * s;
  if (h.typ.name !== 'pfuetze') {
    g.fillStyle = 'rgba(0,0,0,0.4)';
    g.beginPath();
    g.ellipse(boden.x, boden.y, breite * 0.50, breite * 0.08, 0, 0, Math.PI * 2);
    g.fill();
  }
  if (h.typ.name === 'kiste')        Grafik.kiste(g, boden.x, boden.y, breite, hoehe);
  else if (h.typ.name === 'pfuetze') Grafik.pfuetze(g, boden.x, boden.y, breite, hoehe, Spiel.gesamtZeit);
  else                               Grafik.roehren(g, boden.x, boden.y, breite, hoehe);
}

/* --- Ein Stromkabel, das von der Decke hängt --- */
function kabelZeichnen(k) {
  const s = Kamera.groesse(k.z);
  const oben  = Kamera.punkt(k.spur * Einstellung.spurX, 3.3, k.z);
  const unten = Kamera.punkt(k.spur * Einstellung.spurX, 0.55, k.z);
  const hatStrom = Spiel.stromRest <= 0 && !k.benutzt;
  Grafik.stromkabel(g, oben.x, oben.y, unten.x, unten.y,
                    Math.max(2.5, s * 0.055), Spiel.gesamtZeit, hatStrom);
}

function bonusZeichnen(b) {
  const s = Kamera.groesse(b.z);
  const p = Kamera.punkt(b.spur * Einstellung.spurX, b.hoehe, b.z);
  const wippen = Math.sin(Spiel.gesamtZeit * 2.5 + b.z * 0.3) * s * 0.05;
  if (b.art === 'ganz') Grafik.schwebePizza(g, p.x, p.y + wippen, s * 0.34, Spiel.gesamtZeit);
  else                  Grafik.pizzaStueck(g, p.x, p.y + wippen, s * 0.22, Spiel.gesamtZeit);
}

function schatzZeichnen(sch) {
  const s = Kamera.groesse(sch.z);
  const p = Kamera.punkt(sch.spur * Einstellung.spurX, 0, sch.z);
  // Der Lichtstrahl fällt von der Tunneldecke (3,4 Hamster hoch) herunter
  const hoeheOben = 3.4 * s;
  Grafik.muenzschatz(g, p.x, p.y, s * 0.46, hoeheOben,
                     Spiel.gesamtZeit, sch.gefangen ? Math.max(0, sch.weg) : 0);
}

/* ------------------------------------------------------------
   DIE ANZEIGE: Punkte, Tempo, Rekord
   ------------------------------------------------------------ */
function anzeigeZeichnen() {
  const basis = Math.min(B, H);
  const gross = Math.max(20, basis * 0.075);
  const klein = Math.max(11, basis * 0.036);
  const rand = Math.max(12, B * 0.035);
  const kb = Math.max(38, basis * 0.10);
  const platz = B - rand * 2 - kb - rand;

  g.textAlign = 'left';
  g.textBaseline = 'top';

  textMitRand(g, String(Spiel.punkte), rand, rand, gross, platz, '#ffe27a');
  textMitRand(g, `Tempo ${Spiel.tempoStufe}  ·  Rekord ${Bestenliste.rekord()}`,
              rand, rand + gross * 1.15, klein, platz, 'rgba(255,255,255,0.92)');

  // --- DIE ENERGIE-ANZEIGE: ein Kreis mit vier Stücken ---
  energieKreisZeichnen(rand + gross * 0.05, rand + gross * 1.15 + klein * 1.9,
                       Math.max(20, basis * 0.062));

  // Der Lautsprecher-Knopf oben rechts
  tonKnopfBereich = { x: B - rand - kb, y: rand, b: kb, h: kb };
  g.fillStyle = 'rgba(0, 0, 0, 0.35)';
  rundesRechteck(g, tonKnopfBereich.x, tonKnopfBereich.y, kb, kb, kb * 0.28);
  g.fill();
  g.font = `${kb * 0.5}px Arial, sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = '#ffffff';
  g.fillText(Audio2.stumm ? '🔇' : '🔊', tonKnopfBereich.x + kb / 2, tonKnopfBereich.y + kb / 2);

  // Die schwebenden Texte
  const farben = { tempo: '#ff9b3d', pizza: '#ffd24a', schatz: '#ffe27a',
                   strom: '#7fc8ff', punkte: '#8dff7a', louise: '#ff9be0',
                   gift: '#8cdc5a', schock: '#ffe27a' };
  g.textAlign = 'center';
  for (const e of Spiel.effekte) {
    const anteil = e.leben / e.maxLeben;
    const s = basis * (e.art === 'punkte' ? 0.062 : 0.070);
    g.globalAlpha = Math.min(1, anteil * 2.2);
    const y = H * 0.30 - (1 - anteil) * H * 0.10;
    textMitRand(g, e.text, B / 2, y, s, B * 0.9, farben[e.art] || '#ffffff');
  }
  g.globalAlpha = 1;
}

/* ------------------------------------------------------------
   DIE ENERGIE-ANZEIGE
   Ein Kreis mit vier Stücken. Voll = satt, leer = verhungert.
   ------------------------------------------------------------ */
function energieKreisZeichnen(mx, my, r) {
  const anteil = Spiel.energie / Energie.maximum;
  const knapp = Spiel.energie <= Energie.warnungAb;
  // Bei wenig Energie blinkt der Kreis warnend
  const puls = knapp ? 0.55 + Math.abs(Math.sin(Spiel.gesamtZeit * 5)) * 0.45 : 1;

  mx += r; my += r;

  // Der dunkle Hintergrund des Kreises
  g.fillStyle = 'rgba(0, 0, 0, 0.45)';
  g.beginPath();
  g.arc(mx, my, r * 1.06, 0, Math.PI * 2);
  g.fill();

  // Die vier Viertel
  for (let i = 0; i < Energie.maximum; i++) {
    const von = -Math.PI / 2 + i * (Math.PI * 2 / Energie.maximum);
    const bis = von + (Math.PI * 2 / Energie.maximum);
    // Wie voll ist genau dieses Viertel? (0 = leer, 1 = ganz)
    const voll = Math.max(0, Math.min(1, Spiel.energie - i));

    // Leeres Viertel: nur dunkel angedeutet
    g.fillStyle = 'rgba(255, 255, 255, 0.10)';
    g.beginPath();
    g.moveTo(mx, my);
    g.arc(mx, my, r * 0.86, von + 0.05, bis - 0.05);
    g.closePath();
    g.fill();

    if (voll > 0) {
      // Gefülltes Viertel: von grün (satt) nach rot (hungrig)
      g.save();
      g.globalAlpha = puls;
      g.fillStyle = anteil > 0.55 ? '#7fd45a' : (anteil > 0.28 ? '#f0b445' : '#e8553f');
      g.beginPath();
      g.moveTo(mx, my);
      // Ein angebrochenes Viertel wird nur teilweise gefüllt
      g.arc(mx, my, r * 0.86, von + 0.05, von + 0.05 + (bis - von - 0.10) * voll);
      g.closePath();
      g.fill();
      g.restore();
    }
  }

  // Der Rand
  g.strokeStyle = 'rgba(255, 255, 255, 0.75)';
  g.lineWidth = Math.max(2, r * 0.09);
  g.beginPath();
  g.arc(mx, my, r * 0.90, 0, Math.PI * 2);
  g.stroke();

  // Das Pizza-Symbol in der Mitte
  g.fillStyle = 'rgba(0, 0, 0, 0.55)';
  g.beginPath();
  g.arc(mx, my, r * 0.34, 0, Math.PI * 2);
  g.fill();
  g.font = r * 0.44 + 'px Arial, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('🍕', mx, my + r * 0.02);

  // Warnung, wenn es knapp wird
  if (knapp && Spiel.zustand === 'SPIEL') {
    g.globalAlpha = puls;
    schriftPassend(g, 'HUNGER!', r * 0.42, r * 3.4, false);
    g.fillStyle = '#ff8a7a';
    g.textAlign = 'left';
    g.fillText('HUNGER!', mx + r * 1.25, my);
    g.globalAlpha = 1;
  }
  g.textAlign = 'left';
  g.textBaseline = 'top';
}

/* ------------------------------------------------------------
   DER STARTBILDSCHIRM (mit Bestenliste)
   ------------------------------------------------------------ */
function startZeichnen() {
  const hg = g.createLinearGradient(0, 0, 0, H);
  hg.addColorStop(0, '#1c2f28');
  hg.addColorStop(1, '#0a1310');
  g.fillStyle = hg;
  g.fillRect(0, 0, B, H);

  const basis = Math.min(B, H);
  const platz = B * 0.88;

  // Der Titel
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const titel = Math.min(H * 0.095, B * 0.16);
  const t1 = schriftPassend(g, 'HAMSTER', titel, platz, true, 'Arial Black, Arial, sans-serif');
  g.lineWidth = t1 * 0.18;
  g.lineJoin = 'round';
  g.strokeStyle = '#3a2408';
  g.fillStyle = '#f0b445';
  for (const [txt, y] of [['HUNGRY', H * 0.11], ['HAMSTER', H * 0.11 + t1 * 1.02]]) {
    g.strokeText(txt, B / 2, y);
    g.fillText(txt, B / 2, y);
  }

  // Ein hüpfender Hamster
  const hoehe = Math.min(H * 0.16, B * 0.20);
  const hopser = Math.abs(Math.sin(Spiel.gesamtZeit * 2.4)) * hoehe * 0.18;
  const boden = H * 0.44;
  Grafik.schatten(g, B / 2, boden, hoehe * 0.42, 1 - hopser / (hoehe * 0.22) * 0.4);
  Grafik.hamsterSeite(g, B / 2 - hoehe * 0.18, boden - hopser, hoehe,
                      Spiel.gesamtZeit * 8, true, Spiel.gesamtZeit);

  // DIE BESTENLISTE
  // Im Querformat ist weniger Platz nach unten – darum rechnen wir
  // aus, wo die Liste endet, und schieben den Rest darunter.
  const zh = Math.min(basis * 0.050, H * 0.044);
  const listeY = H * 0.50;
  Bestenliste.zeichnen(g, B / 2, listeY, Math.min(B * 0.80, basis * 0.95),
                       zh, Spiel.neuerPlatz - 1);
  const listeEnde = listeY + zh * (1.30 + Math.max(1, Bestenliste.eintraege.length));

  // "Tippe zum Starten" – blinkt langsam
  const tippeY = Math.max(H * 0.78, Math.min(H * 0.86, listeEnde + zh * 1.6));
  g.textAlign = 'center';
  g.globalAlpha = 0.6 + Math.sin(Spiel.gesamtZeit * 3) * 0.4;
  textMitRand(g, '👆 Tippe zum Starten', B / 2, tippeY, basis * 0.058, platz);
  g.globalAlpha = 1;

  // Kurze Anleitung
  const k = Math.max(11, basis * 0.031);
  const hinweis = 'Tippen = springen   ·   Wischen = ausweichen';
  schriftPassend(g, hinweis, k, platz, false);
  g.fillStyle = 'rgba(255,255,255,0.75)';
  g.fillText(hinweis, B / 2, H * 0.925);

  schriftPassend(g, 'ein Spiel von Sophie & Louise', basis * 0.026, platz, false);
  g.fillStyle = 'rgba(255,255,255,0.4)';
  g.fillText('ein Spiel von Sophie & Louise', B / 2, H * 0.978);
}

/* ------------------------------------------------------------
   DER GAME-OVER-BILDSCHIRM
   ------------------------------------------------------------ */
function gameOverZeichnen() {
  // Bei der gemeinsamen Bestenliste kann noch eine Antwort aus dem
  // Netz eintreffen, während dieser Bildschirm zu sehen ist. Darum
  // schauen wir jedes Bild neu nach, auf welchem Platz wir stehen.
  if (Spiel.neuerName) {
    Spiel.neuerPlatz = Bestenliste.platzVon(Spiel.neuerName, Spiel.punkte);
  }

  spielZeichnen();
  g.fillStyle = 'rgba(0, 0, 0, 0.72)';
  g.fillRect(0, 0, B, H);

  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const basis = Math.min(B, H);
  const platz = B * 0.88;

  // Ist er verhungert oder zusammengestossen?
  const titel = Spiel.verhungert ? 'VERHUNGERT! 🍕' : 'AUTSCH! 💥';
  const t = schriftPassend(g, titel, Math.min(H * 0.09, B * 0.15), platz,
                           true, 'Arial Black, Arial, sans-serif');
  g.lineWidth = t * 0.16;
  g.lineJoin = 'round';
  g.strokeStyle = '#3d0d0a';
  g.strokeText(titel, B / 2, H * 0.13);
  g.fillStyle = Spiel.verhungert ? '#ffb45e' : '#ff6b5e';
  g.fillText(titel, B / 2, H * 0.13);

  // Die Punktzahl
  const p = schriftPassend(g, String(Spiel.punkte), Math.min(H * 0.11, B * 0.19), platz);
  g.fillStyle = '#ffe27a';
  g.fillText(String(Spiel.punkte), B / 2, H * 0.28);
  schriftPassend(g, 'PUNKTE', basis * 0.038, platz, false);
  g.fillStyle = 'rgba(255,255,255,0.8)';
  g.fillText('PUNKTE', B / 2, H * 0.28 + p * 0.62);

  // Auf welchem Platz ist man gelandet?
  if (Spiel.neuerPlatz >= 1) {
    const txt = Spiel.neuerPlatz === 1 ? '🎉 NEUER REKORD! 🎉' : '🏆 Platz ' + Spiel.neuerPlatz + '!';
    g.globalAlpha = 0.7 + Math.sin(Spiel.gesamtZeit * 6) * 0.3;
    schriftPassend(g, txt, basis * 0.046, platz);
    g.fillStyle = '#8dff7a';
    g.fillText(txt, B / 2, H * 0.41);
    g.globalAlpha = 1;
  }

  // Die Bestenliste
  Bestenliste.zeichnen(g, B / 2, H * 0.475, Math.min(B * 0.80, basis * 0.95),
                       Math.min(basis * 0.046, H * 0.042), Spiel.neuerPlatz - 1);

  // Der Knopf "Nochmal spielen"
  const kb = Math.min(B * 0.82, basis * 1.1);
  const kh = Math.max(50, Math.min(basis * 0.115, H * 0.10));
  const kx = B / 2 - kb / 2;
  const ky = H - kh - Math.max(14, H * 0.045);
  knopfBereich = { x: kx, y: ky, b: kb, h: kh };

  const kg = g.createLinearGradient(0, ky, 0, ky + kh);
  kg.addColorStop(0, '#f0b445');
  kg.addColorStop(1, '#c9862a');
  g.fillStyle = kg;
  rundesRechteck(g, kx, ky, kb, kh, kh * 0.28);
  g.fill();
  g.strokeStyle = '#5c3a0d';
  g.lineWidth = Math.max(2, kh * 0.055);
  g.stroke();

  schriftPassend(g, 'Nochmal spielen 🐹', kh * 0.42, kb * 0.86);
  g.fillStyle = '#3a2408';
  g.textAlign = 'center';
  g.fillText('Nochmal spielen 🐹', B / 2, ky + kh / 2);
}

/* ============================================================
   DAS NAMENSFELD FÜR DIE BESTENLISTE
   ============================================================ */
const namensfeld = document.getElementById('namensfeld');
const nameEingabe = document.getElementById('nameEingabe');
const nameOk = document.getElementById('nameOk');
const namensPunkte = document.getElementById('namensPunkte');

function namensfeldZeigen() {
  Spiel.zustand = 'NAME';
  namensPunkte.textContent = Spiel.punkte + ' Punkte';
  nameEingabe.value = Bestenliste.letzterName();
  namensfeld.hidden = false;
  // Kurz warten, damit das Feld sicher sichtbar ist, dann Tastatur öffnen
  setTimeout(() => { try { nameEingabe.focus(); nameEingabe.select(); } catch (e) {} }, 60);
}

function namenSpeichern() {
  const name = (nameEingabe.value || '').trim() || 'Hamster';
  Bestenliste.nameMerken(name);
  Spiel.neuerName = name;
  Spiel.neuerPlatz = Bestenliste.eintragen(name, Spiel.punkte);
  namensfeld.hidden = true;
  Spiel.zustand = 'GAMEOVER';
}

nameOk.addEventListener('click', namenSpeichern);
nameEingabe.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); namenSpeichern(); }
});

/* ============================================================
   DIE HAUPTSCHLEIFE
   ============================================================ */
let letzteZeit = 0;

function schleife(jetzt) {
  requestAnimationFrame(schleife);

  let dt = (jetzt - letzteZeit) / 1000;
  letzteZeit = jetzt;
  if (!isFinite(dt) || dt < 0) dt = 0;
  dt = Math.min(dt, 0.05);

  Spiel.gesamtZeit += dt;

  switch (Spiel.zustand) {
    case 'START':
      startZeichnen();
      break;

    case 'INTRO':
      Intro.aktualisieren(dt);
      Intro.zeichnen(g, B, H);
      if (Intro.fertig) rundeStarten();
      break;

    case 'SPIEL':
      spielAktualisieren(dt);
      spielZeichnen();
      break;

    case 'CRASH':
      Spiel.crashZeit += dt;
      spielZeichnen();
      if (Spiel.crashZeit > 1.1) nachDemCrash();
      break;

    case 'NAME':
      spielZeichnen();
      g.fillStyle = 'rgba(0, 0, 0, 0.55)';
      g.fillRect(0, 0, B, H);
      break;

    case 'GAMEOVER':
      gameOverZeichnen();
      break;
  }
}

/* ============================================================
   DIE STEUERUNG
   Tippen = springen. Wischen nach links/rechts = ausweichen.
   ============================================================ */
function istImBereich(x, y, bereich) {
  return bereich && x >= bereich.x && x <= bereich.x + bereich.b
                 && y >= bereich.y && y <= bereich.y + bereich.h;
}

function tippen(x, y) {
  Audio2.start();   // Der Ton muss beim allerersten Tippen eingeschaltet werden

  if ((Spiel.zustand === 'SPIEL' || Spiel.zustand === 'CRASH' || Spiel.zustand === 'GAMEOVER')
      && istImBereich(x, y, tonKnopfBereich)) {
    Audio2.stummSchalten();
    return;
  }

  switch (Spiel.zustand) {
    case 'START':
      Intro.neuStarten();
      Spiel.zustand = 'INTRO';
      break;
    case 'INTRO':
      rundeStarten();
      break;
    case 'SPIEL':
      springen();
      break;
    case 'GAMEOVER':
      if (istImBereich(x, y, knopfBereich)) {
        // Jedes Spiel beginnt wieder mit dem Intro
        Intro.neuStarten();
        Spiel.zustand = 'INTRO';
      }
      break;
  }
}

// Wir merken uns, wo der Finger aufgesetzt hat – für das Wischen
let finger = null;

leinwand.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  const kasten = leinwand.getBoundingClientRect();
  finger = { x: e.clientX - kasten.left, y: e.clientY - kasten.top, gewischt: false };
  // Ausserhalb des Spiels (Startbildschirm, Knöpfe) reagieren wir sofort.
  // Im Spiel warten wir ab: erst beim Loslassen wissen wir, ob es ein
  // Tippen (= springen) oder ein Wischen (= ausweichen) war.
  if (Spiel.zustand !== 'SPIEL') tippen(finger.x, finger.y);
  else Audio2.start();
});

leinwand.addEventListener('pointermove', (e) => {
  if (!finger || finger.gewischt || Spiel.zustand !== 'SPIEL') return;
  const kasten = leinwand.getBoundingClientRect();
  const dx = (e.clientX - kasten.left) - finger.x;
  const dy = (e.clientY - kasten.top) - finger.y;
  const schwelle = Math.max(20, B * 0.045);
  if (Math.abs(dx) > schwelle && Math.abs(dx) > Math.abs(dy)) {
    finger.gewischt = true;      // Es ist ein Wischen – also NICHT springen
    ausweichen(dx > 0 ? 1 : -1);
  }
});

leinwand.addEventListener('pointerup', () => {
  // Nur springen, wenn nicht gewischt wurde
  if (finger && !finger.gewischt && Spiel.zustand === 'SPIEL') tippen(finger.x, finger.y);
  finger = null;
});
leinwand.addEventListener('pointercancel', () => { finger = null; });

// Am Computer: Leertaste springt, Pfeiltasten weichen aus
window.addEventListener('keydown', (e) => {
  if (Spiel.zustand === 'NAME') return;          // dann tippt man ja den Namen
  if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'Enter') {
    e.preventDefault();
    tippen(-1, -1);
  } else if (e.code === 'ArrowLeft') {
    e.preventDefault();
    if (Spiel.zustand === 'SPIEL') ausweichen(-1);
  } else if (e.code === 'ArrowRight') {
    e.preventDefault();
    if (Spiel.zustand === 'SPIEL') ausweichen(1);
  }
});

document.addEventListener('gesturestart', (e) => e.preventDefault());
leinwand.addEventListener('contextmenu', (e) => e.preventDefault());

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    Audio2.musikStopp();
  } else if (Spiel.zustand === 'SPIEL') {
    Audio2.musikStart();
  }
});

/* ============================================================
   LOS GEHT'S!
   ============================================================ */
groesseAnpassen();
Bestenliste.laden();
requestAnimationFrame((t) => { letzteZeit = t; schleife(t); });
