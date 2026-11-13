# Repo-analyse: actualbudget/actual

- URL: https://github.com/actualbudget/actual
- Sjekket: 13.11.2026 (siste commit samme dag, svært aktivt, stort community)
- Lisens: **MIT**. Vi *kan* gjenbruke kode, så lenge lisensteksten og copyright-merknaden følger med.
- Stack: TypeScript-monorepo. React-klient, Electron-desktop, SQLite lokalt, egen CRDT-synk-server (valgfri).
- Klon på Windows krever `git -c core.longpaths=true clone ...` (for lange filnavn i testbilder).

## Hva det er

Budsjettapp med fokus på **budsjettering** (ikke formue/lån). "Local-first": all data ligger i en SQLite-fil hos
brukeren; synk-serveren er valgfri. Importerer OFX/QIF/CAMT/CSV, YNAB, og har bank-sync (GoCardless, Enable Banking, SimpleFIN m.fl.).

## Hva vi kan lære

### 1. Local-first med SQLite
Én databasefil per budsjett, appen fungerer uten nett og uten server. Synk er et tillegg.
For en app som "bare er for meg nå, kanskje produkt senere" er dette et sterkt mønster:
personvern som standard, null driftskostnad, og mulighet for synk senere.

### 2. Beløp lagres som heltall (øre), ikke desimaltall (`loot-core/src/shared/util.ts`: `amountToInteger` / `integerToAmount`)
`12 345,67 kr` lagres som `1234567`. Unngår avrundingsfeil helt, og fungerer i SQLite og JavaScript (som ikke har Decimal).
Securo løser det samme med `Decimal`; begge er riktige. Valget avhenger av språk.

### 3. To budsjettmodeller (`loot-core/src/server/budget/envelope.ts` og `tracking.ts`)
- **Konvoluttbudsjett (envelope / nullbasert):** hver krone som kommer inn får en "jobb". Ubrukt beløp i en kategori
  føres over til neste måned (`carryover`). Kraftig, men krever disiplin.
- **Sporingsbudsjett (tracking):** sett et planlagt beløp per kategori, sammenlign med faktisk. Enklere.
Begge regnes ut som et regneark: hver måned har celler (`budget-X`, `leftover-X`) som avhenger av forrige måned.
Lærdom: start med **tracking** (plan vs. faktisk per måned). Det passer også vår manuelle månedlige registrering.

### 4. Planlagte/gjentakende hendelser (`server/schedules/`)
Lønn, husleie, strøm, abonnement som gjentar seg, med regel for **helg**: flytt til dagen før/etter.
For Norge: lønn som faller på helg/helligdag utbetales normalt *før*; regninger forfaller neste virkedag.
Vi trenger en **norsk helligdagskalender** (påske, Kr. himmelfart, pinse, 17. mai osv.).

### 5. Prognose (`server/forecast/`)
Fremtidig saldo = dagens saldo + kommende planlagte hendelser. Svarer på "har jeg nok på konto før lønn?".
Naturlig utvidelse når vi har faste inntekter/utgifter registrert.

### 6. Regelmotor for kategorisering (`server/rules/`)
Betingelse → handling ("hvis mottaker inneholder REMA → kategori Dagligvarer"). Relevant først hvis vi importerer transaksjoner.

### 7. Hver bank har særheter (`sync-server/src/app-gocardless/banks/norwegian_xx_norwnok1.ts`)
Bank Norwegian leverer f.eks. ikke saldo per transaksjon, og ventende transaksjoner har dato gjemt i en tekststreng.
Bekrefter at bankintegrasjon er mye vedlikehold, og at vår manuelle start er fornuftig.

## Hva Actual IKKE har (og vi trenger)
- Ingen lånemodell med nedbetalingsplan, rente eller avdrag. Lån er bare en konto med saldo.
- Ingen eiendeler med verdihistorikk utover "off-budget"-kontoer.
- Ingen norske skatteregler.

## Hva vi ikke bør kopiere
CRDT-synk, Electron, plugin-system, monorepo med 14 pakker. Altfor mye for start.

## Konklusjon
Actual er best på **budsjett og hverdagsøkonomi**; Securo er best på **lån og formue**.
Fra Actual tar vi med: local-first/SQLite, beløp i øre, tracking-budsjett per måned, gjentakende hendelser med norsk helligdagslogikk.
MIT-lisensen gjør at vi kan låne konkrete kodebiter hvis vi velger TypeScript.
