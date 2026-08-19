# Wijzigingslog

Alle belangrijke wijzigingen aan de PC & AI Cursus-omgeving worden hier bijgehouden.

## [1.4.0] - 2026-08-19

### Toegevoegd
- Nieuwe beheerderspagina **Back-up & herstel**:
  - Back-up downloaden: een consistente `.sqlite`-momentopname van alle cursistengegevens (accounts, wachtwoorden, moduletoewijzingen, voortgang), gemaakt via SQLite's online backup-API (veilig, ook terwijl de app in gebruik is).
  - Back-up terugzetten: upload van een eerder gedownload back-upbestand, met bestandsvalidatie (moet de verwachte tabellen bevatten) en een verplichte bevestiging. Vóór het terugzetten wordt automatisch een veiligheidskopie van de huidige gegevens bewaard in `data/backups/`.
  - Na een restore is een handmatige herstart van de server nodig (zelfde patroon als bij "Nu bijwerken"), en wordt de beheerder automatisch uitgelogd.

### Opgelost
- De automatische veiligheidskopie vóór een restore gebruikte aanvankelijk een ruwe bestandskopie, wat in WAL-modus recente, nog niet weggeschreven wijzigingen kon missen. Nu gebruikt ook de veiligheidskopie de online backup-API.

## [1.3.1] - 2026-08-19

### Toegevoegd
- De "terug naar de les"-instructies op de oefensite-pagina zijn nu apparaatspecifiek: op basis van de browser-user-agent wordt automatisch onderscheid gemaakt tussen Android (waar de standaard terugknop/-gebaar meestal vanzelf terugbrengt), Apple/iOS (tik op het tabbladen-icoon in Safari) en desktop (tabblad bovenin de browser).

## [1.3.0] - 2026-08-19

### Gewijzigd
- De ingebouwde iframe-oefenomgeving is vervangen door een duidelijke tussenpagina: de meeste sites (Gmail, Google Maps, YouTube, banken, DigiD, enz.) weigerden sowieso getoond te worden in een iframe, wat een lege/geweigerde pagina opleverde. De "Open oefensite"-knop opent de site nu altijd in een nieuw tabblad, met expliciete stap-voor-stap uitleg hoe de cursist terugkeert naar de les.

## [1.2.1] - 2026-08-19

### Opgelost
- Help-knop overlapte op mobiele schermen de "Volgende"-knop van de lesnavigatie. De zwevende (fixed) knop is verplaatst naar de vaste header (naast Uitloggen), waar hij niet meer met paginacontent kan botsen, op geen enkele schermgrootte.
- Het beheerdersoverzicht ("Cursisten — Voortgang") toonde ruwe interne modulesleutels (module1, module2, ...) i.p.v. de leesbare modulenamen.

## [1.2.0] - 2026-08-19

### Toegevoegd
- Zelfgebouwde, consistente SVG-iconenset (`lib/icons.js`, Phosphor-stijl outline, `currentColor`) ter vervanging van alle functionele emoji-iconen (logo, moduleiconen, help-knop, voorlezen, woordenlijst, oefensite, vorige/volgende, afronden, nieuw tabblad, contrastknop). Geen externe icoonbibliotheek of internetverbinding nodig — past bij een offline-capable LAN-app.
- De voorlees-knop wisselt nu tussen een luidspreker- en stopicoon i.p.v. tekst opnieuw op te bouwen.

### Opgelost
- Voortgangspercentage op het cursistendashboard toonde bij een afgeronde module soms net geen 100% (bijv. 94%) door een telfout; toont nu altijd 100% zodra een module is afgerond.

## [1.1.0] - 2026-08-19

### Toegevoegd
- Volledige lesinhoud (in het Nederlands, Engels en Duits) voor de modules Praktische Apps, Overheid & Veiligheid, AI-gebruik & Ethiek en Digitale Handigheidjes — voorheen alleen een placeholder-structuur. Alle 5 modules zijn nu een kant-en-klaar lespakket.

## [1.0.0] - 2026-08-19

### Toegevoegd
- Eerste installatie: eenmalig beheerderswachtwoord instellen bij de eerste start.
- Login met rollen: beheerder en cursist.
- Beheerdersdashboard: overzicht van cursisten, voortgang en openstaande hulpvragen.
- Cursistenbeheer: aanmaken, bewerken, verwijderen, modules toewijzen per cursist, taal per cursist instellen.
- Live "Help"-knop voor cursisten met realtime pop-upmelding op het beheerdersdashboard (via Socket.IO).
- Stapsgewijze lesweergave met 'Volgende'/'Vorige'-knoppen en voortgangsregistratie per module.
- Ingebouwde oefenomgeving (iframe-browser) binnen het platform, met behoud van navigatie.
- 5 cursusmodules: Computer- & Internetbasis, Praktische Apps, Overheid & Veiligheid, AI-gebruik & Ethiek, Digitale Handigheidjes.
- Meertalige ondersteuning: Nederlands, Engels, Duits (interface, lesstof, woordenlijst).
- Toegankelijkheid: voorleesfunctie (Text-to-Speech), aanpasbare lettergrootte, hoog-contrastmodus, digitale woordenlijst.
- Basis offline-toegang via een service worker (cachet bezochte pagina's en basisbestanden).
- Wijzigingslog- en updatefunctie in het beheerdersdashboard (git fetch/pull-integratie met GitHub).
- Server bereikbaar op het LAN-netwerk (luistert op 0.0.0.0), toont netwerk-IP bij opstarten.

### Bekend aandachtspunt
- Sommige externe oefensites (bijv. Gmail, WhatsApp Web, banken) staan insluiten in een iframe niet toe vanwege hun eigen beveiligingsinstellingen (X-Frame-Options). De oefenomgeving biedt in dat geval een "Nieuw tabblad"-knop als alternatief.
