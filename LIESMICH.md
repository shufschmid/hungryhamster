# 🐹 Hungry Hamster

Ein Spiel von **Sophie & Louise**.

Ein hungriger Hamster riecht eine Pizza, rennt los – und fällt in ein Gulliloch!
Jetzt muss er durch die Kanalisation rennen, über Hindernisse springen und
allen ausweichen, die sich ihm in den Weg stellen.

## Wie man spielt

| Was du tust | Was passiert |
|---|---|
| **Kurz tippen** (oder Leertaste) | Der Hamster **springt** |
| **Nach links/rechts wischen** (oder Pfeiltasten) | Der Hamster **wechselt die Spur** |

Beim Wischen springt er **nicht** mehr – wischen ist nur zum Ausweichen da.

Es gibt **drei Spuren**: links, Mitte, rechts.

- Alle **10 Sekunden** gibt es **100 Punkte**
- Alle **30 Sekunden** rennt der Hamster **schneller** – und die Musik auch!
- Je schneller er rennt, desto **kürzer** wird sein Sprung. Er springt gleich
  hoch, ist aber schneller wieder unten. Das macht es schwerer!
- Wer es in die **Bestenliste** schafft, darf seinen Namen eintragen.
  Die Liste steht auf dem Startbildschirm und bleibt gespeichert –
  auch wenn ihr das Spiel ganz schliesst und später neu öffnet.
- Jedes Spiel beginnt mit dem **Intro**. Wer es schon kennt, tippt einfach
  drauf und überspringt es.

### Zum Springen 🦘

Diese Hindernisse sperren den ganzen Tunnel – da hilft nur springen:

| Hindernis | Wie hoch? |
|---|---|
| 🪵 Modrige Kiste mit „ACHTUNG GEFAHR" | mittel |
| 🟢 Grüne Giftpfütze | flach – ein kleiner Hüpfer reicht |
| ⚫ Röhrenstapel | das höchste Hindernis! |

### Zum Ausweichen ↔️

Über diese kommt man **nicht** drüber – man muss auf eine freie Spur wischen:

| Wer | Was macht er/sie? |
|---|---|
| 👮 **Isa** | Polizistin mit braunen Haaren und Sonnenbrille |
| 👮 **Anja** | Polizistin, blond – und sie hat eine Knarre dabei |
| 🐈 **Aymo** | Ein Junge, der auf einer Katze mit Sattel reitet |
| 🐀 **Sophie** | Blond, reitet auf einer ekligen Kanalratte, macht manchmal ein Selfie |
| 🐔 **Leyan** | Kammerjäger auf einem braunen Huhn. Aus seinem Schlauch sprüht er **grünes Gift** auf eine Nachbarspur |
| 🏃 **Götti Mu** | Ein Jogger! Er rennt zwischen den Spuren **hin und her** – man muss dorthin, wo er gerade nicht ist. Sein Käppi ist mal blau, mal grau, mal weiss, und „MU" steht drauf |
| 🧹 **Marianne** | Sie steht auf einer Spur und **wischt mit dem Besen** über die Nachbarspuren |
| 📦📦 **Doppelkiste** | Zwei Kisten übereinander auf zwei Spuren – viel zu hoch zum Springen |

Sie kommen **einzeln oder zu zweit**. Schaut genau hin, welche Spur frei ist!
Manchmal stehen zwei aussen – dann müsst ihr zurück in die **Mitte**.

> ⚠️ **Wer zwischen zwei Spuren hängen bleibt, wird von beiden erwischt.**
> Immer ganz auf eine Spur wechseln!

**Zwei Ausnahmen:**

- 🧹 Über **Mariannes Besen** kann man **springen** – über Marianne selbst nicht!
- ☠️ **Leyans Giftwolke** ist nicht tödlich. Aber wer sie einatmet, sieht
  **5 Sekunden lang fast nichts** – der Bildschirm wird ganz grün.

### 💫 Louise – die Ausnahme

**Louise** ist ein kleines Mädchen mit zwei blonden Zöpfen, das sich im Kreis dreht.
In sie darf man hineinlaufen! Dann passiert Folgendes:

- Der Hamster wirbelt **5 Sekunden lang** herum und **blinkt** (wie bei Super Mario mit einem Stern)
- In dieser Zeit kann ihm **gar nichts** passieren – er rennt durch alles hindurch!
- Dafür gibt es **50 Punkte Abzug**

### ⚡ Stromkabel

Aus der Decke hängen manchmal **Stromkabel** heraus. Sie funkeln und leuchten
warnend. Wer eines berührt, wird **2,5 Sekunden elektrisiert** und kann
**gar nicht mehr steuern**! Wenn dann zufällig nichts im Weg ist, hat man Glück –
sonst ist das Spiel vorbei.

Beim **Stromausfall** haben die Kabel keinen Strom und sind harmlos.

### ⚡ Stromausfall

Ab und zu fällt im Kanal das Licht aus. Dann wird es **richtig dunkel** –
die Lampen zucken nur noch ganz kurz auf, und man sieht die Hindernisse kaum.
Nach 6 bis 10 Sekunden kommt das Licht zurück. Das ist der schwierigste
Teil des Spiels!

### 🍕 Der Energie-Kreis – der Hamster hat HUNGER!

Oben links ist ein **Kreis mit vier Stücken**. Das ist die Energie des Hamsters.

- Der Hamster startet **hungrig**: nur **ein Viertel** ist voll!
- Die Energie wird die ganze Zeit langsam weniger
- **Ist der Kreis leer, ist das Spiel zu Ende** (er ist verhungert)
- Ihr müsst also **unbedingt die erste Pizza erwischen**!

So füllt ihr den Kreis wieder:

| Essen | Energie |
|---|---|
| 🍕 **Ein Pizzastück** | ein Viertel |
| 🍕 **Eine ganze Pizza** | der ganze Kreis! |

> **Wichtig:** Pizza gibt **keine Punkte** mehr – sie ist das Essen!
> Und ihr bekommt sie nur, wenn ihr auf der **richtigen Spur** seid.
> Die Pizza hängt mal links, mal in der Mitte, mal rechts.

Wer aufmerksam durch den Kanal rennt, entdeckt vielleicht noch etwas
anderes … achtet mal darauf, ob irgendwo Licht von oben hereinfällt. 🤫

## Wie man es startet

**Am Computer:** Doppelklick auf `index.html`. Fertig!

**Auf dem Tablet oder Handy:** Beide Geräte müssen im selben WLAN sein.

1. Im Projektordner ein Terminal öffnen und eingeben:
   ```
   npx serve .
   ```
2. `serve` schreibt danach selbst hin, unter welcher Adresse das Spiel läuft –
   sowohl für den Computer als auch fürs Tablet („On Your Network").
   Diese Adresse auf dem Tablet im Browser öffnen.

> **Achtung:** Auf diesem Computer läuft oft schon ein anderes Projekt auf
> Port 3000 (der Next.js-Server von `data_to_hyperlocal`). Dann sucht sich
> `serve` automatisch eine andere Nummer – einfach die Adresse nehmen,
> die im Terminal steht.

## Ins Internet stellen (Netlify)

Auf Netlify bekommt das Spiel eine eigene Adresse – und alle Geräte sehen
**dieselbe Bestenliste**. Dafür sorgt eine kleine Datei, die auf Netlify läuft:
`netlify/functions/bestenliste.mjs`.

### Warum braucht es das überhaupt?

Ohne Netlify merkt sich **jedes Gerät seine eigene** Bestenliste. Der Browser
speichert sie nämlich bei sich (`localStorage`), nicht auf dem Server. Darum
haben Tablet und Computer verschiedene Listen – sogar dann, wenn ihr im
gleichen WLAN spielt. Selbst auf **einem** Gerät sind es zwei Listen, wenn ihr
mal über `localhost` und mal über die IP-Adresse spielt: Für den Browser sind
das zwei verschiedene Seiten.

Auf Netlify liegt die Liste dagegen zentral. Am Titel erkennt man das:

| Anzeige | Bedeutung |
|---|---|
| 🏆 BESTENLISTE 🌍 | die gemeinsame Liste – alle Geräte sehen dasselbe |
| 🏆 BESTENLISTE | nur dieses Gerät |

### So stellt man es online

**Am einfachsten über GitHub** (dann wird bei jeder Änderung automatisch neu
veröffentlicht):

1. Alles zu GitHub schicken:
   ```
   git add .
   git commit -m "Hungry Hamster"
   git push -u origin main
   ```
2. Auf [app.netlify.com](https://app.netlify.com) anmelden → **Add new site** →
   **Import an existing project** → GitHub → `hungryhamster` auswählen
3. Die Einstellungen einfach bestätigen – Netlify liest sie aus `netlify.toml`
4. Fertig. Netlify nennt euch die Adresse, z. B. `hungry-hamster.netlify.app`

**Oder direkt vom Computer** (die Netlify-CLI ist hier schon installiert):

```
netlify deploy --build --prod
```

> **Wichtig:** Beide Wege lassen Netlify vorher `npm install` laufen. Das muss
> sein, weil die Bestenliste das Paket `@netlify/blobs` braucht. Die Variante
> „Ordner ins Browserfenster ziehen" funktioniert **nicht** – dabei wird nichts
> installiert, und die gemeinsame Liste bliebe leer.

### Zu Hause ausprobieren

So könnt ihr die gemeinsame Liste testen, bevor ihr sie online stellt:

```
npm install
npm start
```

`npm start` startet `netlify dev`. Das liefert das Spiel **und** die Bestenliste
auf eurem Computer aus, so wie später im Internet.

### Was ist mit offline?

Das Spiel funktioniert weiterhin ohne alles. Wenn keine gemeinsame Liste
erreichbar ist – zum Beispiel wenn ihr `index.html` einfach doppelklickt –
merkt sich jedes Gerät die Punkte wieder selbst. Das Spiel probiert es kurz,
merkt es und spielt normal weiter.

> Ein Hinweis für die Eltern: Eine Netlify-Seite ist **öffentlich**. Jeder, der
> die Adresse kennt, kann spielen und Namen in die Bestenliste schreiben. Für
> ein Familienspiel ist das in Ordnung; es sollten dort nur keine echten
> Nachnamen oder andere persönlichen Angaben stehen.

## Was man selbst verändern kann

Fast alle wichtigen Zahlen stehen ganz oben in **`js/spiel.js`** im Block
`Einstellung`. Probiert einfach mal aus:

| Was | Was passiert |
|---|---|
| `startTempo: 8.5` | Grösser = der Hamster rennt von Anfang an schneller |
| `sprungKraft: 7.0` | Grösser = er springt höher |
| `sprungKuerzung: 0.75` | Wie stark der Sprung kürzer wird, wenn es schneller wird. `0` = der Sprung bleibt immer gleich weit (leichter), `1` = die Sprungweite bleibt konstant (schwerer) |
| `spurX: 1.15` | Wie weit die Spuren auseinanderliegen |
| `spurTempo: 7.0` | Wie flink der Hamster die Spur wechselt |
| `punkteProMal: 100` | Wie viele Punkte es alle 10 Sekunden gibt |

Weiter unten in derselben Datei:

- `Energie` – wie hungrig der Hamster startet (`start`) und wie schnell
  die Energie weniger wird (`proSekunde`)
- `Sperre` – wie oft Isa, Anja, Aymo, Louise, Sophie und Leyan kommen
  (`haeufigkeit`), ab wann (`abSekunde`), welche Spuren sie sperren
  (`muster`) und wer wie oft auftritt (`figuren` – die Zahl bei `gewicht`)
- `GoettiMu` – wie schnell er hin und her joggt (`tempo`) und welche
  Käppi-Farben er hat (`kappiFarben`)
- `Marianne` – wie schnell sie wischt (`tempo`) und wie hoch man über
  den Besen springen muss (`besenHoehe`)
- `Doppelkiste` – wie oft sie kommt
- `Kabel` – wie oft Stromkabel hängen und wie lange der Schock dauert
  (`schockDauer`)
- `Strom` – wie oft und wie lange der Strom ausfällt, und wie dunkel es wird
- `Bonus` – wie viel die Pizza wert ist und wie oft sie auftaucht
- `Hindernisse` – wie hoch und breit die drei Sprung-Hindernisse sind

Die **Farben des Hamsters** stehen in `js/grafik.js` bei `HamsterFarben` –
dort könnt ihr ihm zum Beispiel ein blaues Halstuch geben.
Louises Kleid und Sophies T-Shirt findet ihr in denselben Zeichenfunktionen
(`louise` und `sophieAufRatte`).
Die **Melodie** steht in `js/audio.js` bei `melodie`: grosse Zahl = hoher Ton, `0` = Pause.

Nach jeder Änderung: Datei speichern und die Seite im Browser neu laden.

## Wie das Spiel aufgebaut ist

| Datei | Was drin ist |
|---|---|
| `index.html` | Die Seite mit der Zeichenfläche und dem Namensfeld |
| `style.css` | Vollbild und das Aussehen des Namensfelds |
| `js/audio.js` | Musik und Töne (der Computer erzeugt sie selbst!) |
| `js/grafik.js` | Alles Zeichnen: Hamster, Tunnel, Hindernisse und alle Figuren |
| `js/bestenliste.js` | Die Bestenliste mit den Namen |
| `js/intro.js` | Die Geschichte am Anfang |
| `js/spiel.js` | Das Spiel selbst: springen, ausweichen, Energie, Punkte, Tempo, Stromausfall |
| `netlify/functions/bestenliste.mjs` | Die gemeinsame Bestenliste (läuft auf Netlify) |
| `netlify.toml` | Einstellungen für Netlify |
| `package.json` | Sagt Netlify, welches Paket die Bestenliste braucht |

Es werden **keine Bilder und keine Musikdateien** gebraucht – alles wird
vom Code selbst gemalt und gespielt. Darum funktioniert das Spiel überall,
auch ohne Internet. Nur die gemeinsame Bestenliste braucht Netlify.
