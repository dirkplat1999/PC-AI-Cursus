# PC & AI Cursus

Lokale webserver, bereikbaar op het LAN-netwerk, als interactieve lesomgeving voor een AI- en computercursus.

## Starten

**Snelste manier (Windows):** dubbelklik op `Start PC en AI Cursus.bat` in de projectmap. Als Node.js nog niet op de computer staat, wordt dat bij de eerste keer automatisch gedownload (geen installatie of admin-rechten nodig — het komt in een map `node-portable` naast het project te staan). Daarna worden de benodigde bestanden geïnstalleerd, start de server en opent na een paar seconden automatisch de browser. Laat het zwarte venster openstaan zolang de cursus gebruikt wordt; sluit het venster om de server te stoppen.

**Handmatig (alle platforms):**

```bash
npm install
npm start
```

De server print bij het opstarten een lokaal adres en een netwerkadres (LAN), bijvoorbeeld:

```
Lokaal:   http://localhost:3000
Netwerk:  http://10.0.3.152:3000
```

Cursisten op hetzelfde WiFi/LAN-netwerk kunnen het netwerkadres in hun browser (pc, tablet of smartphone) openen. Zorg dat de Windows-firewall inkomend verkeer op de gebruikte poort (standaard 3000) toestaat op je lokale netwerk.

Wil je een andere poort? Start dan met:

```bash
PORT=8080 npm start
```

(Op Windows PowerShell: `$env:PORT=8080; npm start`)

## Eerste gebruik

1. Open de server-URL in de browser. Je krijgt automatisch de installatiepagina te zien.
2. Stel eenmalig een beheerderswachtwoord in.
3. Je komt in het beheerdersdashboard. Ga naar **Cursisten** om cursistenaccounts aan te maken, een leeftijdscategorie (50+ of jonger dan 50) in te stellen, en modules toe te wijzen — de knop "Aanbevolen modules voor deze leeftijdsgroep" vinkt in één klik een passende selectie aan.
4. Cursisten loggen in via dezelfde URL, met de tab "Cursisten" op het inlogscherm.

## Inloggegevens per e-mail versturen

Ga als beheerder naar **Instellingen** om eenmalig de SMTP-gegevens van je e-mailprovider in te vullen (server, poort, gebruikersnaam/wachtwoord, afzender, en optioneel een vast cursus-adres). Test de instellingen met de knop "Testmail versturen".

Zodra dit is ingesteld, verschijnt bij elke cursist met een e-mailadres (in te vullen bij het aanmaken of bewerken van een cursist) de knop **"Verstuur inloggegevens"** op de Cursisten-pagina. Dit genereert een nieuw wachtwoord voor die cursist en mailt de gebruikersnaam, het nieuwe wachtwoord en de cursus-URL — handig bij het aanmaken van een account, of als iemand het wachtwoord kwijt is (dit vervangt altijd het wachtwoord, ook bij een cursist die al eerder inlogde).

### Provider-specifieke tips in de les

Heeft een cursist een e-mailadres bij een herkende provider (Gmail, Outlook/Hotmail, KPN Mail, iCloud, Yahoo) ingevuld, dan tonen de e-maillessen in module 1 automatisch een tip die precies bij die provider past (bijvoorbeeld waar het paperclip-icoon staat, of hoe je inlogt), inclusief een knop die direct naar de juiste inlogpagina van die provider gaat. Geen (herkend) e-mailadres ingevuld? Dan blijft de les gewoon generiek werken.

## Projectstructuur

- `server.js` — opstartpunt van de applicatie (Express + Socket.IO).
- `db/` — SQLite-database en schema (`data/pcai.sqlite`, wordt automatisch aangemaakt, niet in git).
- `routes/` — serverlogica voor login/setup, beheerder en cursist.
- `views/` — EJS-templates (pagina's).
- `public/` — CSS, client-side JavaScript, service worker (offline-ondersteuning).
- `content/modules.json` — de 9 cursusmodules (titel/omschrijving in NL/EN/DE): modules 1-5 vormen avond 1, modules 6-9 een optionele vervolgavond.
- `content/lessons/<module>/<taal>/<leeftijdsgroep>.json` — lesinhoud per module, taal én leeftijdsgroep (`senior` = 50+, `young` = jonger dan 50). Alle 9 modules zijn volledig uitgewerkt voor beide leeftijdsgroepen, in het Nederlands, Engels en Duits (54 bestanden).
- `content/glossary/<taal>.json` — digitale woordenlijst per taal.
- `content/ui/<taal>.json` — vertaling van de interface-teksten (knoppen, labels).

### Lesinhoud uitbreiden

Elk lesbestand (`content/lessons/<module>/<taal>/<leeftijdsgroep>.json`) heeft dit formaat:

```json
{
  "lessons": [
    {
      "id": "unieke-id",
      "title": "Titel van de les",
      "steps": [
        { "title": "Staptitel", "body": "<p>HTML-tekst van deze stap</p>" },
        { "title": "Oefenstap", "body": "<p>...</p>", "practiceUrl": "https://voorbeeld.nl" }
      ]
    }
  ]
}
```

Een `practiceUrl` bij een stap toont automatisch een knop "Open oefensite". Die opent een tussenpagina die de site in een **nieuw tabblad** opent en expliciet uitlegt hoe de cursist terugkomt naar de les (via het tabblad bovenin, of door het nieuwe tabblad te sluiten).

> Waarom geen ingebouwde iframe-weergave? De meeste websites (Gmail, WhatsApp Web, banken, DigiD, Google Maps, YouTube, enz.) blokkeren zelf het tonen binnen een iframe, om veiligheidsredenen (X-Frame-Options/CSP). Een poging tot inline weergave resulteert dan in een lege of geweigerde pagina, wat verwarrend is — vandaar de duidelijke "open in nieuw tabblad"-aanpak met terugkeer-instructies.

## Toegankelijkheid

- Voorleesfunctie (Text-to-Speech) via de knop "Voorlezen" op elke lesstap.
- Lettergrootte aanpassen (A- / A+) en hoog-contrastmodus via de knoppen rechtsboven.
- Digitale woordenlijst, beschikbaar op het cursistendashboard en bij elke les. Moeilijke woorden krijgen automatisch een gestippelde onderstreping in de lesteksten en in de woordenlijst zelf; hover (of tik op tablet/telefoon) toont direct de uitleg, zonder de les te verlaten.
- Basis offline-toegang: eerder bezochte pagina's blijven beschikbaar zonder internet/LAN-verbinding, dankzij een service worker.

## Back-up & herstel

Ga als beheerder naar **Back-up & herstel** om:
- een back-upbestand (`.sqlite`) te downloaden met alle cursistengegevens: accounts, wachtwoorden, moduletoewijzingen en voortgang;
- een eerder gedownload back-upbestand terug te zetten. Dit overschrijft alle huidige gegevens; er wordt automatisch een veiligheidskopie van de huidige gegevens bewaard in `data/backups/` voordat dit gebeurt.

> Belangrijk: na het terugzetten van een back-up moet de server **handmatig opnieuw gestart** worden (zelfde als na een update) voordat de omgeving weer gebruikt kan worden, en wordt de beheerder automatisch uitgelogd.

De lesinhoud zelf (modules, teksten, vertalingen) zit niet in deze back-up — die staat in de `content/`-map en wordt via git/GitHub beheerd, niet via de database.

## Updates & wijzigingslog

Ga als beheerder naar **Wijzigingslog & updates** om:
- de huidige versie en `CHANGELOG.md` te bekijken;
- te controleren op updates vanaf de GitHub-repository (`git fetch`);
- bij te werken naar de laatste versie (`git pull`). Herstart daarna de server handmatig om de wijzigingen te laden.

Dit vereist dat de map als git-repository is geïnitialiseerd met een geconfigureerde remote (zie hieronder) en netwerktoegang tot GitHub.

> Dit is de update-methode voor de lokale/LAN-installatie (`Start PC en AI Cursus.bat`). Draai je de cursus via Dokploy (zie hieronder), gebruik dan de "Deploy"-knop in het Dokploy-dashboard in plaats van deze pagina — daar staat in een gehost/Docker-omgeving geen `.git`-map, dus deze knop toont dan netjes "kon niet verbinden" in plaats van iets te doen.

## Hosten via Dokploy

De cursus kan ook gehost worden als Docker-container via [Dokploy](https://dokploy.com), zodat je updates met één klik vanuit een webinterface kunt uitrollen in plaats van via SSH/`.bat`-bestand. De repository bevat hiervoor een `Dockerfile`.

**Eenmalig instellen:**
1. Maak in Dokploy een nieuwe **Application** aan en koppel 'm aan `dirkplat1999/PC-AI-Cursus` (branch `main`).
2. Kies build-type **Dockerfile** (wordt automatisch gevonden in de root van de repository).
3. Zet de poort op **3000** (dit is de poort die de container intern gebruikt; Dokploy regelt zelf de buitenkant/domein/HTTPS).
4. **Belangrijk — voeg een Volume/Mount toe:** container-pad `/app/data`. Hier staan de SQLite-database, het sessiegeheim en back-ups. Zonder deze mount ben je bij elke update al je cursisten, voortgang en het beheerderswachtwoord kwijt, omdat de container zelf bij elke deploy vervangen wordt.
5. (Optioneel) Stel bij "Health Check" het pad `/health` in, zodat Dokploy zelf detecteert of de container gezond opstart.
6. Klik op **Deploy**. Bij de allereerste keer is de `data`-map nog leeg, dus je krijgt automatisch het installatiescherm (`/setup`) te zien om het beheerderswachtwoord in te stellen — net als bij een lokale installatie.

**Updaten vanuit de webinterface:** zodra er nieuwe wijzigingen op GitHub staan (bijvoorbeeld na een sessie met Claude), open je de Application in Dokploy en klik je op **Deploy** (of **Redeploy**). Dokploy haalt de laatste commit op, bouwt een nieuwe image en vervangt de draaiende container — je cursistengegevens blijven staan dankzij de volume-mount uit stap 4. Wil je dit automatisch laten gebeuren bij elke `git push`? Dokploy kan ook een webhook-URL genereren die je als GitHub-webhook instelt, zodat een deploy vanzelf start; dat is niet nodig als je liever zelf op de knop drukt.

## Git & GitHub

Dit project is gekoppeld aan `git@github.com:dirkplat1999/PC-AI-Cursus.git`. Om te pushen vanaf een nieuwe machine:

```bash
git remote -v          # controleer of de remote klopt
git push -u origin main
```

Dit vereist een geldige SSH-sleutel die gekoppeld is aan het GitHub-account.

## Techniek

- Node.js + Express 5
- SQLite (via `better-sqlite3`) — lichte, bestandsgebaseerde database, geen aparte databaseserver nodig
- Socket.IO — realtime hulpvraag-meldingen
- EJS — server-side templates
- Geen build-stap nodig; puur server-side gerenderd voor eenvoud en brede compatibiliteit op oudere apparaten
- Lesinhoud wordt in het geheugen gecached (niet bij elk verzoek opnieuw van schijf gelezen), reacties worden gecomprimeerd, en SQLite draait in WAL-modus — samen goed voor vlot gebruik door een volledige klas (getest tot 50 gelijktijdige cursisten, zie `CHANGELOG.md`)
- `Dockerfile` aanwezig voor containerhosting (bv. via Dokploy, zie hierboven); `better-sqlite3` gebruikt hierbij meegeleverde prebuilt binaries, dus geen compiler nodig in de image
