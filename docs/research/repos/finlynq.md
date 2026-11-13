# Repo-analyse: finlynq/finlynq

- URL: https://github.com/finlynq/finlynq
- Sjekket: 13.11.2026 (siste commit 11.11.2026, aktivt)
- Lisens: **AGPL-3.0** (+ betalt kommersiell lisens, CLA for bidrag). Kun ideer, ikke kode.
- Stack: Next.js + TypeScript, Drizzle ORM + PostgreSQL, Docker. ~1 600 filer.
- Opphav: Nord-Amerika. Ingen norske regler.

## Hva det er

Personal finance med **egen MCP-server** (100+ verktøy) slik at Claude/ChatGPT kan lese og endre økonomidataene.
Import fra CSV/Excel/OFX/PDF, budsjett, portefølje, mål, lån, FIRE-kalkulator, Monte Carlo, "financial health score".
Sensitive felter krypteres med nøkkel avledet fra brukerens passord.

## Hva vi kan lære

### 1. Lån: overstyringer per termin (`src/lib/loan-calculator.ts`, `src/lib/loans/`)
Løser problemet "bankens tall avviker litt fra appens":
- **`interestOverrides`**: legg inn faktisk rente banken trakk for en gitt termin; resten av planen regnes videre fra det.
- **`paymentOverrides`**: faktisk innbetalt beløp for en termin (f.eks. ekstra nedbetaling).
- **Manuell plan via CSV-mal** (`loans/manual-schedule.ts`): last ned planen som CSV, rediger i Excel, last opp igjen.
  Kun `dato`, `betaling`, `rente` leses; `avdrag` og `restgjeld` regnes ut på nytt så de aldri kan motsi hverandre.
  → For oss: mulighet til å legge inn bankens egen nedbetalingsplan når du vil ha 100 % samsvar.
- Advarsel i koden: *alle* steder som viser en plan må bruke samme funksjon med overstyringene, ellers viser ulike sider ulike tall.
  → Lærdom: én eneste funksjon for "lånets plan", brukt overalt.

### 2. Nedbetalingsstrategi for flere gjeldsposter (`calculateDebtPayoff`)
- **Avalanche (skred):** ekstra penger til gjelden med høyest rente først. Billigst.
- **Snowball (snøball):** minste gjeld først. Raskere "seire", motiverende.
Gitt et ekstra månedlig beløp: viser rekkefølge, måned hver gjeld er borte, total rente. Svært relevant for kredittkort + forbrukslån.

### 3. "Hva om"-analyse for ekstra innbetaling (`calculateExtraPaymentImpact`)
For f.eks. 500 / 1 000 / 2 000 kr ekstra per måned: måneder spart, renter spart, ny nedbetalt-dato.

### 4. Økonomisk helsescore (`src/lib/financial-health.ts`)
Seks komponenter med faste vekter → 0–100 og karakter. Komponenter uten data utelates og vektene normaliseres.
→ Norsk variant kunne bruke norske mål: gjeldsgrad mot inntekt (utlånsforskriften: maks 5× brutto årsinntekt),
belåningsgrad bolig, bufferkonto (antall månedsutgifter), sparerate. Må verifiseres mot gjeldende regler.

### 5. MCP-server: la Claude snakke med økonomien din
Gjør det mulig å spørre "hvor mye betalte jeg i renter i år?" direkte i Claude.
Interessant for oss senere, siden du allerede bruker Claude. Med lokal SQLite er dette lite arbeid å legge til.

### 6. Import: maler + duplikatsjekk (`import-template-matcher.ts`, `import-hash.ts`)
- Gjenkjenner filformat (bank) ved å score kolonneoverskrifter mot lagrede maler.
- Hash av (dato, konto, beløp, mottaker) for å unngå duplikater ved gjentatt import.
Relevant hvis/ når vi legger til fil-import.

### 7. Kryptering av sensitive felter
Nøkkel avledet fra passordet (scrypt + AES-256-GCM). Først relevant hvis appen blir flerbruker/sky.

## Hva vi ikke bør kopiere
- Pengebeløp som flyttall (`Math.round(x * 100) / 100`). Securo (Decimal) og Actual (øre som heltall) gjør det riktigere.
- Omfanget: chat, e-postimport, Monte Carlo, mobilapp, OAuth, sky.

## Konklusjon
Finlynq har den mest gjennomarbeidede gjeldsdelen av de tre: overstyringer per termin, manuell plan fra CSV,
avalanche/snowball og ekstra-innbetaling-analyse. Dette passer rett inn i en gjeldsfokusert første versjon.
