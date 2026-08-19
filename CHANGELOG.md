# Wijzigingslog

Alle belangrijke wijzigingen aan de PC & AI Cursus-omgeving worden hier bijgehouden.

## [2.2.0] - 2026-08-19

### Toegevoegd
- Woordenlijst uitgebreid van 10 naar 38 termen (NL/EN/DE): o.a. spear-phishing, social engineering, deepfake, datalek, CEO-fraude, romancefraude, sim-swapping, passkey, authenticator-app, bias, algoritme, cookies, en diverse app-specifieke begrippen (WOZ-waarde, erfpacht, energielabel, berichtenbox).
- `marketing/flyer.html`: printbare wervingsflyer (A4) voor de cursus, met de vijf modules, hoe het platform werkt, en praktische info (locatie, data, meenemen).
- `marketing/opening-presentatie.pptx`: 10-dia PowerPoint-presentatie voor de openingsbijeenkomst — programma, waarom de cursus, de vijf onderwerpen, hoe een les werkt, hulp & toegankelijkheid, praktische afspraken en een startslide om samen in te loggen.

## [2.1.0] - 2026-08-19

### Toegevoegd
- Nieuwe les "Check of jouw gegevens al eens gelekt zijn" in module 3 (Overheid & Veiligheid), voor beide leeftijdsgroepen en alle 3 talen: legt uit wat datalekken zijn en linkt (via de bestaande "open in nieuw tabblad"-pagina, niet ingebed) naar <strong>haveibeenpwned.com</strong> om het eigen e-mailadres te checken, met <strong>Check Je Hack van de politie</strong> als optionele tweede, officiële check.
- Expliciete waarschuwing: komt een e-mailadres voor in een van beide lijsten, dan is de kans groter op phishing- en oplichtingsberichten via e-mail, sms én WhatsApp — met concrete vervolgstappen (wachtwoord wijzigen, 2FA aanzetten, extra alert zijn).

## [2.0.0] - 2026-08-19

### Toegevoegd
- **Leeftijdscategorie per cursist** (50+ / jonger dan 50), instelbaar bij het aanmaken of bewerken van een cursist. Elke van de 5 modules heeft nu een volledig aparte lesvariant per leeftijdsgroep, in alle 3 talen (30 lesbestanden in totaal):
  - **50+**: het bestaande, patiënte, stap-voor-stap tempo — met een lichte kwaliteitsslag deze ronde (o.a. nieuwe stappen over de spamfolder, een ontvangen bijlage openen/bewaren, en een website als favoriet bewaren in module 1).
  - **Jonger dan 50**: hoger tempo, minder uitleg van basisbegrippen, en merkbaar meer nadruk op veiligheid — met verdiepende onderwerpen als spear-phishing, investerings- en romance-fraude, CEO-fraude, passkeys en identiteitsdiefstal (module 3), en een werkgerichte insteek voor AI-gebruik (module 4) en cloud-samenwerken (module 5).
- Nieuwe "Aanbevolen modules"-knop in het cursistenformulier: vinkt op basis van de gekozen leeftijdscategorie direct een passende moduleselectie aan (jonger: nadruk op Veiligheid + AI; 50+: Computerbasis + Apps + Veiligheid + Digitale Handigheidjes).
- Tweede, thematisch andere phishing-oefening in de jongere variant van module 3 (pakketbezorging-scam i.p.v. bank-scam), met dezelfde interactieve open/verwijder/klik-mechaniek.
- Leeftijdscategorie is nu zichtbaar als kolom op het beheerdersdashboard.

### Technisch
- Database-migratie: nieuwe kolom `age_group` op de cursistentabel (automatisch toegevoegd aan bestaande installaties bij de eerstvolgende start).
- Lesinhoud is verplaatst van `content/lessons/<module>/<taal>.json` naar `content/lessons/<module>/<taal>/<leeftijdsgroep>.json`.

## [1.6.0] - 2026-08-19

### Toegevoegd
- De phishing-oefening (module 3) heeft nu een menu (⋮) op de nepmail met een "Verwijderen"-knop — de juíste actie. Kiest een cursist dit i.p.v. op de phishing-knop te klikken, dan verschijnt een positief leermoment ("Goed gedaan!") in plaats van de waarschuwing.
- Klikt een cursist tóch op de nep-knop in de phishing-oefening, dan verschijnt er nu automatisch een live melding op het beheerdersdashboard (hergebruikt het bestaande "Hulpvragen"-systeem: rode pulserende stip, meteen zichtbaar in de lijst, met een "Afgehandeld"-knop), zodat de docent weet wie extra aandacht nodig heeft.

## [1.5.0] - 2026-08-19

### Toegevoegd
- Interactieve phishing-oefening in de les "Phishing herkennen" (module 3): een nagebouwd nep-postvak met een phishing-mail die je moet openen om het (verdachte) afzenderadres te zien, en een echt aanklikbare knop. Na het klikken volgt direct een leermoment: dit is precies wat je niet moet doen, met uitleg van de signalen die je had kunnen herkennen. Werkt volledig clientside — er wordt nergens echt iets verzonden of geopend.

### Gewijzigd
- Lesinhoud die adviseerde om bij twijfel "de docent" te vragen (module 1, 2 en 3) is aangepast: dat advies is bedoeld om ook na de cursus, thuis, bruikbaar te blijven, dus daar staat nu "vraag het aan familie". De live Help-knop (die tijdens de les echt een melding naar de docent stuurt) is hierbij ongewijzigd gebleven — dat blijft een aparte, accurate functie.

### Opgelost
- Een cursist die (bijvoorbeeld via een verouderde link) naar een module navigeert die niet aan hem/haar is toegewezen, kreeg een serverfout te zien in plaats van een nette 404-pagina, omdat de woordenlijst-data ontbrak bij het renderen van die pagina.

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
