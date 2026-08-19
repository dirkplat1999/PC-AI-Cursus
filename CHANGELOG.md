# Wijzigingslog

Alle belangrijke wijzigingen aan de PC & AI Cursus-omgeving worden hier bijgehouden.

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
