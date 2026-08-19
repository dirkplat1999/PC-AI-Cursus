# PC & AI Cursus

Lokale webserver, bereikbaar op het LAN-netwerk, als interactieve lesomgeving voor een AI- en computercursus.

## Starten

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
3. Je komt in het beheerdersdashboard. Ga naar **Cursisten** om cursistenaccounts aan te maken en modules toe te wijzen.
4. Cursisten loggen in via dezelfde URL, met de tab "Cursisten" op het inlogscherm.

## Projectstructuur

- `server.js` — opstartpunt van de applicatie (Express + Socket.IO).
- `db/` — SQLite-database en schema (`data/pcai.sqlite`, wordt automatisch aangemaakt, niet in git).
- `routes/` — serverlogica voor login/setup, beheerder en cursist.
- `views/` — EJS-templates (pagina's).
- `public/` — CSS, client-side JavaScript, service worker (offline-ondersteuning).
- `content/modules.json` — de 5 cursusmodules (titel/omschrijving in NL/EN/DE).
- `content/lessons/<module>/<taal>.json` — lesinhoud per module en taal. Alle 5 modules zijn volledig uitgewerkt in het Nederlands, Engels en Duits.
- `content/glossary/<taal>.json` — digitale woordenlijst per taal.
- `content/ui/<taal>.json` — vertaling van de interface-teksten (knoppen, labels).

### Lesinhoud uitbreiden

Elk lesbestand (`content/lessons/<module>/<taal>.json`) heeft dit formaat:

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

Een `practiceUrl` bij een stap toont automatisch een knop "Open oefensite" die de site binnen de ingebouwde oefenomgeving (iframe) opent, met een knop om terug te gaan naar de les.

> Let op: sommige sites (Gmail, WhatsApp Web, banken, DigiD) staan insluiten in een iframe niet toe. De oefenomgeving biedt dan automatisch een "Nieuw tabblad"-link als alternatief.

## Toegankelijkheid

- Voorleesfunctie (Text-to-Speech) via de knop "Voorlezen" op elke lesstap.
- Lettergrootte aanpassen (A- / A+) en hoog-contrastmodus via de knoppen rechtsboven.
- Digitale woordenlijst, beschikbaar op het cursistendashboard en bij elke les.
- Basis offline-toegang: eerder bezochte pagina's blijven beschikbaar zonder internet/LAN-verbinding, dankzij een service worker.

## Updates & wijzigingslog

Ga als beheerder naar **Wijzigingslog & updates** om:
- de huidige versie en `CHANGELOG.md` te bekijken;
- te controleren op updates vanaf de GitHub-repository (`git fetch`);
- bij te werken naar de laatste versie (`git pull`). Herstart daarna de server handmatig om de wijzigingen te laden.

Dit vereist dat de map als git-repository is geïnitialiseerd met een geconfigureerde remote (zie hieronder) en netwerktoegang tot GitHub.

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
