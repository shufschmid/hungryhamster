/* ============================================================
   HUNGRY HAMSTER – Die Bestenliste
   ------------------------------------------------------------
   Hier werden die besten fünf Ergebnisse gespeichert – mit Namen!
   Der Browser merkt sie sich, auch wenn man das Spiel schliesst.
   ============================================================ */

const Bestenliste = {

  SCHLUESSEL: 'hungryHamsterBestenliste',
  ADRESSE: '/api/bestenliste',   // Die gemeinsame Liste (nur auf Netlify)
  PLAETZE: 5,              // So viele Namen stehen auf der Liste
  eintraege: [],           // [{ name: 'Sophie', punkte: 1200 }, ...]

  /* Gibt es eine gemeinsame Liste im Netz?
     null = wissen wir noch nicht, true = ja, false = nein (dann
     merkt sich nur dieses Gerät die Punkte). */
  gemeinsam: null,
  laedt: false,            // Holen wir gerade etwas vom Netz?

  /* --- Eine Liste sauber machen: nur gültige Einträge,
         sortiert und auf fünf Plätze gekürzt --- */
  pruefen(liste) {
    if (!Array.isArray(liste)) return [];
    return liste
      .filter(e => e && typeof e.name === 'string' && isFinite(e.punkte))
      .map(e => ({ name: String(e.name).slice(0, 12), punkte: Math.floor(e.punkte) }))
      .sort((a, b) => b.punkte - a.punkte)
      .slice(0, this.PLAETZE);
  },

  /* --- Die Liste aus dem Browser laden (das geht sofort) und
         danach im Hintergrund die gemeinsame Liste holen --- */
  laden() {
    this.eintraege = [];
    try {
      const roh = localStorage.getItem(this.SCHLUESSEL);
      if (roh) this.eintraege = this.pruefen(JSON.parse(roh));
    } catch (e) {
      this.eintraege = [];        // kaputte Daten? Dann eben leer.
    }
    // Jetzt nachschauen, ob es eine gemeinsame Liste gibt.
    // Das dauert einen Moment – das Spiel läuft dabei weiter,
    // und sobald die Liste da ist, wird sie angezeigt.
    if (typeof fetch === 'function') this.vomNetzLaden();
  },

  /* --- Die Liste im Browser speichern --- */
  speichern() {
    try {
      localStorage.setItem(this.SCHLUESSEL, JSON.stringify(this.eintraege));
    } catch (e) { /* nicht schlimm, dann eben nur für diese Runde */ }
  },

  /* ==========================================================
     DIE GEMEINSAME LISTE IM NETZ
     Auf Netlify gibt es eine Liste, die ALLE Geräte sehen.
     Läuft das Spiel ohne Netlify (z. B. direkt von der
     Festplatte), merkt sich eben jedes Gerät seine eigene.
     ========================================================== */

  /* Die Liste aus dem Netz holen. Klappt das nicht, bleibt
     einfach die lokale Liste stehen – das Spiel läuft weiter. */
  async vomNetzLaden() {
    if (this.laedt) return;
    this.laedt = true;
    try {
      const antwort = await fetch(this.ADRESSE, { cache: 'no-store' });
      if (!antwort.ok) throw new Error('Antwort ' + antwort.status);
      const daten = await antwort.json();
      if (!daten || !Array.isArray(daten.eintraege)) throw new Error('Unerwartete Antwort');
      this.eintraege = this.pruefen(daten.eintraege);
      this.gemeinsam = true;
      this.speichern();          // auch lokal sichern, für den Notfall
    } catch (e) {
      // Kein Server da (oder kein Internet) – dann eben lokal.
      this.gemeinsam = false;
    } finally {
      this.laedt = false;
    }
  },

  /* Ein Ergebnis ins Netz schicken. Die Antwort ist gleich die
     neue, vollständige Liste – die übernehmen wir direkt. */
  async zumNetzSenden(name, punkte) {
    if (this.gemeinsam === false) return;    // gibt es hier nicht
    try {
      const antwort = await fetch(this.ADRESSE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, punkte: punkte })
      });
      if (!antwort.ok) throw new Error('Antwort ' + antwort.status);
      const daten = await antwort.json();
      if (daten && Array.isArray(daten.eintraege)) {
        this.eintraege = this.pruefen(daten.eintraege);
        this.gemeinsam = true;
        this.speichern();
      }
    } catch (e) {
      this.gemeinsam = false;    // dann bleibt es beim lokalen Eintrag
    }
  },

  /* --- Der beste Punktestand überhaupt --- */
  rekord() {
    return this.eintraege.length ? this.eintraege[0].punkte : 0;
  },

  /* --- Reicht diese Punktzahl für die Bestenliste? --- */
  schafftEsRein(punkte) {
    if (punkte <= 0) return false;
    if (this.eintraege.length < this.PLAETZE) return true;
    return punkte > this.eintraege[this.eintraege.length - 1].punkte;
  },

  /* --- Ist das sogar der allerbeste Punktestand? --- */
  istNeuerRekord(punkte) {
    return punkte > 0 && punkte > this.rekord();
  },

  /* --- Einen neuen Eintrag hinzufügen. Gibt den Platz zurück (1 = Sieger) --- */
  eintragen(name, punkte) {
    name = String(name || '').trim().slice(0, 12) || 'Hamster';
    const neu = { name: name, punkte: Math.floor(punkte) };
    this.eintraege.push(neu);
    this.eintraege.sort((a, b) => b.punkte - a.punkte);
    this.eintraege = this.eintraege.slice(0, this.PLAETZE);
    this.speichern();
    const platz = this.eintraege.indexOf(neu) + 1;   // 0, falls rausgefallen

    // Und ab ins Netz, damit alle anderen Geräte es auch sehen.
    // Das passiert im Hintergrund – wir warten nicht darauf.
    if (typeof fetch === 'function') this.zumNetzSenden(name, punkte);

    return platz;
  },

  /* --- Auf welchem Platz steht dieser Eintrag gerade?
         (0 = steht nicht auf der Liste)
         Wichtig für die gemeinsame Liste: Die kann sich noch
         ändern, während der Game-Over-Bildschirm zu sehen ist. --- */
  platzVon(name, punkte) {
    const p = Math.floor(punkte);
    for (let i = 0; i < this.eintraege.length; i++) {
      if (this.eintraege[i].name === name && this.eintraege[i].punkte === p) return i + 1;
    }
    return 0;
  },

  /* --- Den zuletzt benutzten Namen merken (praktisch beim Wiederspielen) --- */
  letzterName() {
    try { return localStorage.getItem('hungryHamsterName') || ''; }
    catch (e) { return ''; }
  },
  nameMerken(name) {
    try { localStorage.setItem('hungryHamsterName', name); } catch (e) { /* egal */ }
  },

  /* ==========================================================
     Die Liste auf den Bildschirm zeichnen
     x, y   = oben in der Mitte
     breite = wie breit die Liste sein darf
     ========================================================== */
  zeichnen(g, x, y, breite, zeilenHoehe, hervorheben) {
    const s = zeilenHoehe * 0.62;

    g.textBaseline = 'middle';
    g.textAlign = 'center';
    // Ist es die gemeinsame Liste (alle Geräte) oder nur diese hier?
    const titel = this.gemeinsam === true
      ? '🏆 BESTENLISTE 🌍'
      : '🏆 BESTENLISTE';
    schriftPassend(g, titel, s * 1.05, breite);
    g.fillStyle = '#ffd24a';
    g.fillText(titel, x, y);

    if (this.eintraege.length === 0) {
      schriftPassend(g, 'Noch niemand – sei die Erste!', s * 0.80, breite, false);
      g.fillStyle = 'rgba(255,255,255,0.55)';
      g.fillText('Noch niemand – sei die Erste!', x, y + zeilenHoehe * 1.25);
      return;
    }

    const links = x - breite / 2;
    const rechts = x + breite / 2;

    for (let i = 0; i < this.eintraege.length; i++) {
      const e = this.eintraege[i];
      const zy = y + zeilenHoehe * (1.30 + i);
      const neu = (hervorheben !== undefined && hervorheben === i);

      // Die gerade eben erspielte Zeile wird hervorgehoben
      if (neu) {
        g.fillStyle = 'rgba(255, 210, 74, 0.18)';
        rundesRechteck(g, links - zeilenHoehe * 0.2, zy - zeilenHoehe * 0.42,
                       breite + zeilenHoehe * 0.4, zeilenHoehe * 0.84, zeilenHoehe * 0.2);
        g.fill();
      }

      const farbe = neu ? '#ffe27a' : (i === 0 ? '#ffd24a' : 'rgba(255,255,255,0.85)');
      g.font = `bold ${s}px Arial, sans-serif`;
      g.fillStyle = farbe;

      // Platz und Name links
      g.textAlign = 'left';
      const platz = ['🥇', '🥈', '🥉', '4.', '5.'][i] || (i + 1) + '.';
      g.fillText(platz, links, zy);
      // Der Name darf nicht in die Punktzahl hineinlaufen
      const punkteText = String(e.punkte);
      g.font = `bold ${s}px Arial, sans-serif`;
      const punkteBreite = g.measureText(punkteText).width;
      const namePlatz = breite - zeilenHoehe * 1.5 - punkteBreite;
      schriftPassend(g, e.name, s, namePlatz);
      g.fillStyle = farbe;
      g.fillText(e.name, links + zeilenHoehe * 1.3, zy);

      // Punkte rechts
      g.textAlign = 'right';
      g.font = `bold ${s}px Arial, sans-serif`;
      g.fillStyle = farbe;
      g.fillText(punkteText, rechts, zy);
    }
    g.textAlign = 'center';
  }
};
