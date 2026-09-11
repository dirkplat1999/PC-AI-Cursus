# Wijzigingslog

Alle belangrijke wijzigingen aan de PC & AI Cursus-omgeving worden hier bijgehouden.

## [3.6.4] - 2026-09-11

### Opgelost
- De echte oorzaak van de crash-loop op Dokploy gevonden door handmatig in een draaiende container in te loggen: `better-sqlite3`'s meegeleverde prebuilt binary crasht met een segmentation fault zodra de database daadwerkelijk geopend wordt (het inladen van de module zelf ging wel goed) — een ABI-mismatch met deze exacte Node-build, niet gerelateerd aan Alpine/Debian of CPU-architectuur (beide al uitgesloten). De Docker-build compileert `better-sqlite3` nu vanaf broncode (met een compiler in de build-stage), gegarandeerd passend bij de exacte runtime, terwijl lokale Windows-installaties de prebuilt binary blijven gebruiken (die daar wel prima werkt).

## [3.6.3] - 2026-09-11

### Opgelost
- De container crashte direct na het opstarten op de eerste echte Dokploy-deploy (crash-loop, geen logs zichtbaar). Vermoedelijke oorzaak: `better-sqlite3`'s musl/Alpine-binary faalt soms stil bij het laden op een minimale Alpine-image, ook al matcht het bestand zelf het platform. De `Dockerfile` gebruikt nu `node:20-bookworm-slim` (Debian/glibc) in plaats van `node:20-alpine` — een veel vaker geteste combinatie voor native Node-modules.

## [3.6.2] - 2026-09-11

### Opgelost
- De Dockerfile kopieerde `.npmrc` niet mee naar de build-stage, waardoor `npm ci` daar alsnog de standaard node-gyp-compilatie van `better-sqlite3` probeerde (er is geen compiler in de Alpine-image) — dezelfde soort bug als eerder opgelost voor lokale Windows-installaties (v3.4.0), nu ontdekt bij de eerste echte Dokploy-deploy.

## [3.6.1] - 2026-09-09

### Opgelost
- De automatische `npm install` na een download-update (zonder git) faalde op Windows: `npm.cmd` is een batchbestand en kan niet rechtstreeks gestart worden zonder shell, en shell-uitvoering met een pad met spaties (het standaard `C:\Program Files\nodejs`) gaf op zijn beurt weer een fout. Lost dit op door in plaats daarvan `node.exe` rechtstreeks aan te roepen met `npm-cli.js` als argument — een normaal programma, geen shell nodig, werkt ook automatisch met de portable Node.js-installatie.
- Het versienummer in het bevestigingsbericht na een download-update kon een paar minuten achterlopen (kwam van een cachende GitHub-CDN). Toont nu het versienummer uit het zojuist gekopieerde `package.json` op de eigen schijf.

## [3.6.0] - 2026-09-09

### Toegevoegd
- **Bijwerken werkt nu ook zonder git**: "Controleren op updates" en "Bijwerken" in het beheerdersdashboard gebruiken git (fetch/pull) als dat beschikbaar is, en vallen er automatisch op terug als dat niet zo is (bijvoorbeeld na het downloaden van de ZIP van GitHub in plaats van een `git clone`, of in een gehoste omgeving zonder `.git`-map) — dan wordt de nieuwste broncode gewoon als `.zip` gedownload via een gewone HTTPS-verbinding en over de huidige installatie heen gekopieerd, met automatische installatie van eventueel nieuwe benodigde bestanden. Cursistengegevens, voortgang en instellingen blijven bij beide methodes altijd staan. Zie `lib/updater.js`.

### Opgelost
- `multer` bijgewerkt naar 2.3.0 (loste een ernstige kwetsbaarheid op qua denial-of-service bij bestandsuploads op — gevonden tijdens het toevoegen van `adm-zip`, losstaand van de update-functie zelf).

## [3.5.0] - 2026-09-08

### Toegevoegd
- **E-mail (SMTP) vanuit het beheerdersdashboard**: nieuwe pagina **Instellingen** om SMTP-gegevens (server, poort, gebruikersnaam/wachtwoord, afzender) en een vast cursus-adres in te vullen, met een testmail-knop. Gebruikt `nodemailer` (geen native afhankelijkheden, dus geen compiler-risico zoals bij `better-sqlite3`).
- **Inloggegevens per e-mail versturen**: cursisten krijgen nu een optioneel e-mailadres-veld. Zodra dat en de SMTP-instellingen zijn ingevuld, verschijnt een knop **"Verstuur inloggegevens"** per cursist op de Cursisten-pagina — genereert een nieuw wachtwoord en mailt gebruikersnaam, wachtwoord en de cursus-URL. Werkt zowel voor het eerste account als om een vergeten wachtwoord te herstellen.
- **Provider-specifieke tips in de e-mailles** (module 1): op basis van het e-maildomein van de cursist (Gmail, Outlook/Hotmail/Live, KPN Mail, iCloud, Yahoo) tonen de lesstappen over het postvak openen, bijlagen toevoegen en (bij de jongere leeftijdsgroep) tweestapsverificatie een passende tip mét een knop die direct naar de juiste inlogpagina van die provider gaat, in plaats van standaard Gmail. Geen herkende provider? Dan valt de les terug op een generieke tip. Beschikbaar in NL/EN/DE, voor beide leeftijdsgroepen.

## [3.4.0] - 2026-09-07

### Toegevoegd
- `Start PC en AI Cursus.bat` installeert nu ook Node.js zelf als dat nog niet op de computer staat: `scripts/ensure-node.ps1` detecteert of Node.js al aanwezig is, en downloadt anders automatisch de nieuwste LTS-versie als portable (zip-)installatie naar `node-portable\` — zonder installatie, zonder admin-rechten. Python is bewust niet toegevoegd: de cursus-app zelf heeft daar niets aan (puur Node.js), Python werd alleen incidenteel gebruikt voor marketingmateriaal buiten de app om.

### Opgelost
- De eigenlijke oorzaak van de eerdere "Cannot find module 'express'"-fout gevonden en opgelost: `better-sqlite3` heeft geen eigen `install`-script, waardoor npm daar standaard `node-gyp rebuild` (compileren vanaf broncode) voor probeert — terwijl het pakket al kant-en-klare binaries meelevert voor elk platform. Op computers zonder Visual Studio Build Tools/Python (zoals de meeste niet-ontwikkelaars-pc's) liet dat de hele installatie mislukken. Een nieuwe `.npmrc` (`ignore-scripts=true`) schakelt dat compileerstapje project-breed uit; niets anders in de dependency-boom heeft een install-script nodig, dus dit is veilig.
- `title PC & AI Cursus - Server` in het startscript liet Windows de `&` verkeerd interpreteren (als commandoscheiding), wat een onschuldige maar verwarrende `'AI' is not recognized...`-foutmelding gaf voordat de rest gewoon doorging. De `&` wordt nu correct ge-escaped.

## [3.3.1] - 2026-09-04

### Opgelost
- `Start PC en AI Cursus.bat` controleerde alleen of de map `node_modules` bestond, niet of de installatie ook echt volledig gelukt was. Na een eerdere onderbroken/mislukte installatie (bijvoorbeeld door een tijdelijk netwerkprobleem) bleef die lege of onvolledige map staan, waardoor het script de installatiestap oversloeg en de server meteen crashte met `Cannot find module 'express'`. Het script controleert nu specifiek op een daadwerkelijk geïnstalleerd pakket (`node_modules\express\package.json`) en herhaalt de installatie automatisch als die eerder niet volledig gelukt is.

> Ter verduidelijking: dit stond los van de Dockerfile/Dokploy-toevoeging uit v3.3.0 — die bestanden hebben geen enkel effect op de lokale Windows-installatie. Eén repository ondersteunt beide manieren van draaien (lokaal via het `.bat`-bestand, gehost via Dokploy met de `Dockerfile`) zonder dat ze elkaar in de weg zitten.

## [3.3.0] - 2026-09-04

### Toegevoegd
- `Dockerfile` en `.dockerignore` om de cursus als container te hosten (bv. via Dokploy), met een `README.md`-sectie "Hosten via Dokploy" die stap voor stap uitlegt hoe je de app koppelt, de persistente datamap (`/app/data`) instelt, en updates met één klik ("Deploy") vanuit de webinterface uitrolt.
- `/health`-endpoint: lichte, database-loze statuscheck voor Dokploy's health check.
- `app.set('trust proxy', 1)` zodat het client-IP en protocol correct blijven achter een reverse proxy (Traefik/Dokploy).

### Opgemerkt
- De bestaande "Wijzigingslog & updates"-pagina in het beheerdersdashboard (git fetch/pull) blijft de update-methode voor de lokale/LAN-installatie; in een Dokploy-omgeving gebruik je in plaats daarvan de "Deploy"-knop van Dokploy zelf.

## [3.2.1] - 2026-09-03

### Opgelost
- De woordenlijst-tooltips uit v3.2.0 werkten niet bij iedereen: de nieuwe cache-headers op statische bestanden (`/js/main.js`, `/css/style.css`) zorgden ervoor dat browsers en de service worker die de app al eerder bezocht hadden, bleven een oudere, gecachete versie van `main.js` gebruiken — zonder de tooltip-code. `main.js` en `style.css` worden nu geladen met een versie-parameter (`?v=<versienummer>`) die bij elke release automatisch verandert, zodat elke update altijd meteen bij iedereen doorkomt zonder handmatig verversen. De service worker-cachenaam is ook opgehoogd, zodat eerder gecachete bestanden bij iedereen worden ververst.

## [3.2.0] - 2026-09-03

### Toegevoegd
- Woordenlijst-tooltips: moeilijke woorden krijgen automatisch een gestippelde onderstreping in lesteksten én in de woordenlijst zelf (ook kruisverwijzingen tussen woordenlijsttermen onderling). Hover toont de uitleg direct; op tablet/telefoon werkt een tik. Volledig toetsenbord- en schermlezer-toegankelijk (focus, Escape, hoog-contrastmodus).

### Verbeterd — prestaties bij gelijktijdig gebruik
- Les-, module- en woordenlijstinhoud wordt nu één keer in het geheugen gecached in plaats van bij elk verzoek opnieuw van schijf gelezen en geparsed te worden.
- Reacties (HTML/CSS/JS) worden nu gecomprimeerd verstuurd (`compression`), belangrijk op een gedeeld WiFi-netwerk met veel tegelijk verbonden apparaten.
- Statische bestanden (CSS/JS/iconen) krijgen nu een cache-header, zodat browsers ze niet bij elke paginawissel opnieuw hoeven op te vragen.
- SQLite-schrijfmodus afgestemd op WAL (`synchronous = NORMAL`) voor snellere voortgang-updates bij veel gelijktijdige cursisten.
- Belast getest met een gesimuleerde klas van 50 gelijktijdige cursisten (autocannon, 50 verbindingen): gemiddelde reactietijd daalde van 408 ms naar 220 ms en de verwerkingscapaciteit verdubbelde nagenoeg (121 → 227 verzoeken/seconde), zonder fouten of timeouts.

## [3.1.0] - 2026-09-03

### Toegevoegd
- Woordenlijst uitgebreid van 38 naar 54 termen (NL/EN/DE), met begrippen uit de vier nieuwe modules 6-9: o.a. abonnementval, achteraf betalen, bedenktijd, desinformatie, factcheck, filterbubbel, KVK-nummer, lateraal lezen, omgekeerde beeldzoekopdracht, reviewfraude, spraakassistent, Thuiswinkel Waarborg, track & trace, wettelijke garantie en widget.
- `marketing/flyer.html`: de flyer toont nu beide cursusavonden — "Avond 1 — vijf haltes" (modules 1-5) én een nieuwe sectie "Avond 2 — het vervolg" met de vier nieuwe modules, plus een bijgewerkte praktische-infobalk (Waar / Deel 1 / Deel 2).
- `marketing/opening-presentatie.pptx`: dia 5 heet nu "Avond 1: vijf onderwerpen"; een nieuwe dia 6 "Avond 2: het vervolg" toont de vier nieuwe modules in dezelfde kaartstijl (11 dia's in totaal); de praktische-afsprakendia vermeldt nu welke modules bij welke datum horen.

## [3.0.0] - 2026-08-19

### Toegevoegd
- Vier nieuwe modules (6 t/m 9), bedoeld als vervolgavond op de eerste vijf modules — de cursus omvat nu 9 modules in totaal, elk volledig uitgewerkt voor beide leeftijdsgroepen in NL/EN/DE (24 nieuwe lesbestanden):
  - **Foto's & Video's** — foto's maken en bewerken, een album maken, delen met familie (senior); camera-vaardigheden, snel bewerken, video's monteren, slim delen en back-uppen (jong).
  - **Veilig Online Winkelen** — een webshop vertrouwen, bestellen en betalen, bezorging en retourneren, reviews en oplichting herkennen (senior); slim vergelijken, achteraf-betalen-risico's en abonnementvallen, garantie, nepwebshops en reviewfraude (jong).
  - **Slimme Telefoon & AI** — instellingen, apps, een spraakassistent gebruiken, en AI op je telefoon voor dagelijkse vragen (senior); tijdbesparende instellingen, apps combineren, AI voor dagelijkse taken, en de grenzen van AI op je telefoon (jong).
  - **Nepnieuws & Betrouwbare Bronnen** — wat is nepnieuws, signalen van een onbetrouwbaar bericht, een bron checken, voordat je iets deelt (senior); filterbubbels, AI-gegenereerde nepcontent, feitencheck-technieken, verantwoord delen (jong).
- Vier nieuwe iconen (camera, shopping-bag, sparkles, search) in de zelfgebouwde SVG-iconenset.

### Opgemerkt
- De "Aanbevolen modules"-knop blijft gericht op de oorspronkelijke 5 modules (avond 1); de nieuwe modules 6-9 wijs je bewust apart toe als vervolg.

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
