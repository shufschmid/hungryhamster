/* ============================================================
   HUNGRY HAMSTER – Die gemeinsame Bestenliste
   ------------------------------------------------------------
   Das hier läuft NICHT im Browser, sondern auf Netlify.
   Darum können alle Geräte dieselbe Liste sehen: Tablet,
   Handy und Computer fragen alle hier nach.

   GET  /api/bestenliste   -> gibt die Liste zurück
   POST /api/bestenliste   -> trägt ein neues Ergebnis ein
                              { "name": "Louise", "punkte": 3400 }
   ============================================================ */

import { getStore } from '@netlify/blobs';

const SPEICHER   = 'hungry-hamster';   // Name der Schublade
const SCHLUESSEL = 'bestenliste';      // Name des Zettels darin
const PLAETZE    = 5;                  // So viele Namen stehen drauf
const MAX_NAME   = 12;
const MAX_PUNKTE = 10000000;           // Schutz gegen Unsinn
const VERSUCHE   = 5;

/* Die Liste aufräumen: nur saubere Einträge, sortiert, gekürzt.
   Das machen wir immer – man kann ja nie wissen, was ankommt. */
function sauber(liste) {
  if (!Array.isArray(liste)) return [];
  return liste
    .filter(e => e && typeof e.name === 'string' && Number.isFinite(Number(e.punkte)))
    .map(e => ({
      name: String(e.name).trim().slice(0, MAX_NAME) || 'Hamster',
      punkte: Math.floor(Number(e.punkte))
    }))
    .filter(e => e.punkte > 0 && e.punkte <= MAX_PUNKTE)
    .sort((a, b) => b.punkte - a.punkte)
    .slice(0, PLAETZE);
}

function antwort(eintraege, status = 200) {
  return Response.json({ eintraege }, {
    status,
    // Nie zwischenspeichern – wir wollen immer den neuesten Stand
    headers: { 'Cache-Control': 'no-store' }
  });
}

function fehler(text, status = 400) {
  return Response.json({ fehler: text }, {
    status,
    headers: { 'Cache-Control': 'no-store' }
  });
}

export default async (req) => {
  const laden = getStore(SPEICHER);

  /* --- Die Liste holen --- */
  if (req.method === 'GET') {
    const daten = await laden.get(SCHLUESSEL, { type: 'json' });
    return antwort(sauber(daten));
  }

  /* --- Ein neues Ergebnis eintragen --- */
  if (req.method === 'POST') {
    let neu;
    try {
      neu = await req.json();
    } catch (e) {
      return fehler('Das war kein gültiges JSON.');
    }

    const name = String(neu && neu.name || '').trim().slice(0, MAX_NAME) || 'Hamster';
    const punkte = Math.floor(Number(neu && neu.punkte));
    if (!Number.isFinite(punkte) || punkte <= 0 || punkte > MAX_PUNKTE) {
      return fehler('Diese Punktzahl passt nicht.');
    }

    /* Es können zwei Kinder GLEICHZEITIG fertig werden. Damit dabei
       kein Eintrag verloren geht, schreiben wir nur, wenn sich die
       Liste zwischendurch nicht verändert hat (das prüft Netlify für
       uns mit dem "ETag"). Sonst versuchen wir es noch einmal. */
    for (let versuch = 0; versuch < VERSUCHE; versuch++) {
      const vorher = await laden.getWithMetadata(SCHLUESSEL, { type: 'json' });
      const liste = sauber(vorher && vorher.data);
      liste.push({ name, punkte });
      const neueListe = sauber(liste);

      // Gibt es die Liste schon? Dann nur schreiben, wenn sie
      // unverändert ist. Gibt es sie noch nicht? Dann nur, wenn sie
      // wirklich noch nicht existiert.
      const bedingung = (vorher && vorher.etag)
        ? { onlyIfMatch: vorher.etag }
        : { onlyIfNew: true };

      const { modified } = await laden.setJSON(SCHLUESSEL, neueListe, bedingung);
      if (modified) return antwort(neueListe);
      // Jemand war schneller – nochmal von vorn.
    }

    return fehler('Gerade waren zu viele gleichzeitig dran. Bitte nochmal!', 409);
  }

  return fehler('Hier gibt es nur GET und POST.', 405);
};

export const config = {
  path: '/api/bestenliste',
  method: ['GET', 'POST']
};
