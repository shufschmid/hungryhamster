/* ============================================================
   HUNGRY HAMSTER – Das Intro
   ------------------------------------------------------------
   Die kleine Geschichte am Anfang, von der Seite gesehen:
   1. Der Hamster riecht eine leckere Pizza
   2. Er rennt los
   3. Vor der Pizza ist ein Gulliloch – PLUMPS!
   4. Er landet in der Kanalisation, das Spiel beginnt
   ============================================================ */

const Intro = {

  zeit: 0,          // Wie lange läuft das Intro schon?
  fertig: false,
  phase: 0,         // Für die Lauf-Animation
  soundGespielt: {},// Damit jeder Ton nur einmal kommt

  // Die Zeitpunkte der Geschichte (in Sekunden)
  T_SCHNUEFFELN: 2.6,   // bis dahin schnüffelt er
  T_RENNEN:      5.0,   // bis dahin rennt er
  T_FALLEN:      6.4,   // bis dahin fällt er
  T_ENDE:        7.6,   // dann startet das Spiel

  neuStarten() {
    this.zeit = 0;
    this.fertig = false;
    this.phase = 0;
    this.soundGespielt = {};
  },

  // Spielt einen Sound genau einmal ab
  einmal(name, funktion) {
    if (!this.soundGespielt[name]) {
      this.soundGespielt[name] = true;
      funktion();
    }
  },

  aktualisieren(dt) {
    this.zeit += dt;
    this.phase += dt * 16;
    if (this.zeit >= this.T_ENDE) this.fertig = true;
  },

  zeichnen(g, B, H) {
    const t = this.zeit;

    // --- Der Himmel über der Strasse ---
    const himmel = g.createLinearGradient(0, 0, 0, H);
    himmel.addColorStop(0, '#2b4a6b');
    himmel.addColorStop(0.55, '#5f7f9c');
    himmel.addColorStop(1, '#8fa6b5');
    g.fillStyle = himmel;
    g.fillRect(0, 0, B, H);

    // --- Ein paar Häuser im Hintergrund ---
    g.fillStyle = 'rgba(30, 45, 60, 0.85)';
    const hausBasis = H * 0.62;
    for (let i = 0; i < 7; i++) {
      const hx = (i * B) / 6.2 - B * 0.05;
      const hb = B * 0.14;
      const hh = H * (0.14 + ((i * 37) % 11) / 55);
      g.fillRect(hx, hausBasis - hh, hb, hh);
      // Beleuchtete Fenster
      g.fillStyle = 'rgba(255, 220, 140, 0.55)';
      for (let fy = 0; fy < 3; fy++) {
        for (let fx = 0; fx < 2; fx++) {
          if ((i + fx + fy) % 3 === 0) continue;
          g.fillRect(hx + hb * (0.2 + fx * 0.42), hausBasis - hh + hh * (0.15 + fy * 0.26), hb * 0.2, hh * 0.14);
        }
      }
      g.fillStyle = 'rgba(30, 45, 60, 0.85)';
    }

    // --- Die Strasse ---
    const strasseY = H * 0.62;
    g.fillStyle = '#41474a';
    g.fillRect(0, strasseY, B, H - strasseY);
    // Bordsteinkante
    g.fillStyle = '#5a6165';
    g.fillRect(0, strasseY, B, H * 0.025);
    // Mittelstreifen
    g.fillStyle = 'rgba(230, 225, 190, 0.5)';
    for (let i = 0; i < 9; i++) {
      g.fillRect(B * (0.02 + i * 0.115), H * 0.90, B * 0.06, H * 0.012);
    }

    // --- Wichtige Positionen auf dem Bild ---
    // Alle Grössen richten sich nach der KLEINEREN Bildschirmseite,
    // damit auf dem schmalen Handy nichts über den Rand ragt.
    const basis = Math.min(B, H);
    const bodenY = H * 0.80;                  // Hier stehen die Füsse
    const hamsterHoehe = basis * 0.17;
    const pizzaGroesse = basis * 0.085;
    const startX = B * 0.15;                  // Wo der Hamster startet
    const pizzaX = B - pizzaGroesse * 1.4;    // Die Pizza ganz rechts
    const gulliX = startX + (pizzaX - startX) * 0.62;   // Das Loch davor

    // --- Das Gulliloch (macht sich erst auf, wenn er losrennt) ---
    const gulliOffen = t > this.T_SCHNUEFFELN - 0.4;
    Grafik.gulliLoch(g, gulliX, bodenY + H * 0.012, basis * 0.20, gulliOffen);

    // --- Die Pizza ---
    Grafik.pizza(g, pizzaX, bodenY, pizzaGroesse, t);

    /* ==========================================================
       PHASE 1: DER HAMSTER SCHNÜFFELT
       ========================================================== */
    if (t < this.T_SCHNUEFFELN) {
      this.einmal('schnueffel1', () => Audio2.schnueffeln());
      if (t > 0.8) this.einmal('schnueffel2', () => Audio2.schnueffeln());
      if (t > 1.5) this.einmal('lecker', () => Audio2.lecker());

      // Duftwellen ziehen von der Pizza zum Hamster
      Grafik.duftwellen(g, pizzaX - pizzaGroesse, bodenY - hamsterHoehe * 0.4,
                           startX + hamsterHoehe * 0.7, bodenY - hamsterHoehe * 0.6, t, basis);

      Grafik.schatten(g, startX, bodenY + 2, hamsterHoehe * 0.55, 1);
      Grafik.hamsterSeite(g, startX, bodenY, hamsterHoehe, 0, false, t);

      // Herzchen über dem Kopf – er hat riesigen Hunger!
      if (t > 1.4) {
        for (let i = 0; i < 3; i++) {
          const ht = ((t - 1.4) * 0.7 + i * 0.33) % 1;
          g.fillStyle = `rgba(240, 90, 110, ${(1 - ht) * 0.9})`;
          herzForm(g, startX + hamsterHoehe * 0.45 + Math.sin(ht * 6 + i) * basis * 0.03,
                  bodenY - hamsterHoehe * 1.15 - ht * basis * 0.16,
                  basis * 0.030 * (0.6 + ht * 0.5));
          g.fill();
        }
      }

      this.text(g, B, H, 'Mmmh… eine Pizza! 🍕', H * 0.13);
    }

    /* ==========================================================
       PHASE 2: DER HAMSTER RENNT ZUR PIZZA
       ========================================================== */
    else if (t < this.T_RENNEN) {
      const fortschritt = (t - this.T_SCHNUEFFELN) / (this.T_RENNEN - this.T_SCHNUEFFELN);
      const hx = startX + (gulliX - startX) * fortschritt;

      Grafik.duftwellen(g, pizzaX - pizzaGroesse, bodenY - hamsterHoehe * 0.4,
                           hx + hamsterHoehe * 0.7, bodenY - hamsterHoehe * 0.6, t, basis);

      Grafik.schatten(g, hx, bodenY + 2, hamsterHoehe * 0.5, 1);
      Grafik.hamsterSeite(g, hx, bodenY, hamsterHoehe, this.phase, true, t);

      this.text(g, B, H, 'Die will ich haben!', H * 0.13);
    }

    /* ==========================================================
       PHASE 3: PLUMPS – ER FÄLLT INS GULLILOCH!
       ========================================================== */
    else if (t < this.T_FALLEN) {
      this.einmal('fallen', () => Audio2.fallen());

      const fortschritt = (t - this.T_RENNEN) / (this.T_FALLEN - this.T_RENNEN);
      // Er sinkt ins Loch und dreht sich dabei. Er wird kleiner,
      // weil er immer tiefer in die dunkle Kanalisation rutscht.
      const sinken = Math.pow(fortschritt, 1.5);
      const hy = bodenY + sinken * hamsterHoehe * 1.15;
      const drehung = fortschritt * Math.PI * 1.5;
      const kleiner = 1 - fortschritt * 0.45;

      g.save();
      // Alles unterhalb der Strasse wird abgeschnitten – so sieht es
      // aus, als würde er im Loch verschwinden.
      g.beginPath();
      g.rect(0, 0, B, bodenY + H * 0.012 + basis * 0.030);
      g.clip();
      Grafik.hamsterSeite(g, gulliX, hy, hamsterHoehe * kleiner, this.phase * 2, true, t, drehung);
      g.restore();

      this.text(g, B, H, 'Oh nein… ein Gulliloch! 😱', H * 0.13);
    }

    /* ==========================================================
       PHASE 4: ÜBERBLENDUNG IN DIE KANALISATION
       ========================================================== */
    else {
      const fortschritt = (t - this.T_FALLEN) / (this.T_ENDE - this.T_FALLEN);
      this.einmal('platsch', () => Audio2.platsch());

      g.fillStyle = `rgba(0, 0, 0, ${Math.min(1, fortschritt * 1.6)})`;
      g.fillRect(0, 0, B, H);

      if (fortschritt > 0.35) {
        g.globalAlpha = Math.min(1, (fortschritt - 0.35) * 3);
        this.text(g, B, H, 'LOS GEHT\'S! 🐹', H * 0.48, basis * 0.11);
        g.globalAlpha = 1;
      }
    }

    // --- Hinweis zum Überspringen ---
    if (t < this.T_FALLEN) {
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      schriftPassend(g, 'Tippe, um das Intro zu überspringen', basis * 0.034, B * 0.88, false);
      g.fillStyle = 'rgba(255,255,255,0.6)';
      g.fillText('Tippe, um das Intro zu überspringen', B / 2, H * 0.955);
    }
  },

  // Zeigt einen Text mit schwarzem Rand (damit man ihn gut lesen kann)
  text(g, B, H, txt, y, groesse) {
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    textMitRand(g, txt, B / 2, y, groesse || Math.min(B, H) * 0.065, B * 0.88);
  }
};
