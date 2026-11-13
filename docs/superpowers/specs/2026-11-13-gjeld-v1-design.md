# Design: Personlig økonomi-app, versjon 1 (gjeld)

- Dato: 13.11.2026
- Status: Til godkjenning
- Research: `docs/research/2026-11-13-oppstart.md`, `docs/research/repos/{securo,actual,finlynq}.md`

## 1. Formål og rammer

**Mål:** En personlig økonomi-app tilpasset Norge, brukt på eierens Android-telefon. Første versjon gir full
oversikt over gjeld: når den er nedbetalt, hva den koster, og hva som skjer ved ekstra innbetalinger.

**Rammer (bestemt):**
- Kun Norge: norsk språk, NOK, norske formater og regler.
- Én bruker, én enhet (Android-telefon). Ingen server, ingen innlogging, ingen bankintegrasjon.
- All data registreres manuelt. Data forlater aldri telefonen, bortsett fra backup-filer brukeren selv eksporterer.
- Kan bli et produkt senere. Arkitekturen skal ikke stenge for synk, flere brukere eller en native app, men vi bygger ikke for det nå.
- Ingen kode kopieres fra AGPL-lisensierte prosjekter (Securo, Finlynq). Kode fra Actual (MIT) kan gjenbrukes med lisensmerknad.

**Veikart:**
1. **Gjeld** (denne spesifikasjonen)
2. Nettoformue (eiendeler + verdihistorikk, minus gjeld)
3. Budsjett (plan vs. faktisk per kategori og måned)

**Suksesskriterier for v1:**
- Eieren har lagt inn alle sine lån og all kreditt, og ser samlet gjeld, månedlig kostnad og gjeldfri-dato.
- Nedbetalingsplanen for et annuitetslån avviker maks noen kroner per termin fra bankens kalkulator ved samme input.
- Månedlig oppdatering av alle lån tar under 2 minutter på telefonen.
- Appen er installert på hjemskjermen og fungerer uten nett.

## 2. Funksjoner i v1

### 2.1 Gjeldstyper

| Type | Eksempler | Beregning |
|---|---|---|
| `annuitet` | Boliglån, billån, studielån, forbrukslån | Fast terminbeløp; plan beregnes |
| `serie` | Boliglån | Fast avdrag, synkende rente; plan beregnes |
| `kreditt` | Kredittkort, rammekreditt | Ingen fast plan; nedbetalingstid beregnes fra valgt månedlig innbetaling |

### 2.2 Registrering
- **Lån:** navn, bank, type, restgjeld og dato for den, nominell rente, gjenværende løpetid (måneder), termingebyr, forfallsdag.
- **Kreditt:** navn, bank, saldo og dato, nominell rente, kredittgrense, planlagt månedlig innbetaling.
- **Renteendring:** ny nominell rente + dato den gjelder fra. Lagres som historikk.
- **Månedlig oppdatering:** én skjerm som lister alle aktive lån; brukeren fyller inn faktisk restgjeld for måneden.
  Valgfritt per lån: faktisk rente trukket, ekstra innbetalt, notat.
- **Lukke lån:** lån som er nedbetalt markeres som lukket og skjules fra aktive lister.

### 2.3 Visninger
1. **Oversikt:** total gjeld, samlet månedlig kostnad (terminbeløp + gebyr + kredittinnbetalinger), renter hittil i år, gjeldfri-dato (siste lån nedbetalt).
2. **Lån-detalj:** nedbetalingsplan (termin, dato, betaling, rente, avdrag, gebyr, restgjeld) og plan vs. faktisk
   (foran/bak plan i kroner, forventet nedbetalt-dato).
3. **Hva om:** ekstra månedlig innbetaling (forhåndsvalg 500 / 1 000 / 2 000 kr + valgfritt beløp) → måneder spart, renter spart, ny nedbetalt-dato.
4. **Gjeldfri-plan:** et ekstra månedlig beløp fordeles på tvers av alle lån etter **skred** (høyest rente først) eller **snøball**
   (lavest restgjeld først). Når et lån er nedbetalt, overføres dets terminbeløp til neste. Viser rekkefølge, måned hvert lån er borte, total rente, og sammenligning mellom de to strategiene.
5. **Rentefradrag:** renter hittil i år og prognose for året, brutto og netto etter fradrag (22 % for 2026, sats lagret per år).

### 2.4 Utenfor v1
Import av bankens nedbetalingsplan fra fil, avdragsfrihet, studielånets særregler (rentefritak, ettergivelse),
økonomisk helsescore, MCP-server, synk, flere brukere, bankintegrasjon, nettoformue, budsjett.

## 3. Teknisk løsning

### 3.1 Valg
- **Plattform:** installerbar webapp (PWA), brukt i Chrome på Android.
- **Språk/rammeverk:** TypeScript, React, Vite.
- **PWA:** `vite-plugin-pwa` (service worker, manifest, offline).
- **Lagring:** IndexedDB via Dexie. `navigator.storage.persist()` ved oppstart.
- **Testing:** Vitest + React Testing Library.
- **Hosting:** Cloudflare Pages (statiske filer, gratis, fungerer med privat repo). Kun appens kode hostes; brukerdata ligger kun på telefonen.

### 3.2 Struktur

```
src/
  domain/              Ren logikk. Ingen React, ingen database. Fullt testet.
    money.ts             øre-heltall, avrunding, parse/format i norsk format
    month.ts             årmåned ("2026-11"), terminer, datoaritmetikk
    loan-schedule.ts     plan for annuitet og serie, med renteendringer og gebyr
    credit.ts            nedbetalingstid for kreditt
    what-if.ts           effekt av ekstra innbetaling
    payoff-strategy.ts   skred og snøball på tvers av lån
    tax.ts               rentefradrag, satser per år
  data/                Dexie-database, repositories, backup (eksport/import)
  ui/                  React-skjermer og komponenter, norsk tekst
  config/satser/       skattesatser per år (2026.ts, ...)
```

Regel: `domain/` importerer aldri fra `data/` eller `ui/`. All visning av en nedbetalingsplan går gjennom
**én** funksjon i `loan-schedule.ts`, så ingen skjerm kan vise andre tall enn en annen.

### 3.3 Datamodell

Alle beløp er heltall i øre. Renter er heltall i hundredels prosent (5,20 % = `520`). Måneder er strenger `"ÅÅÅÅ-MM"`, datoer `"ÅÅÅÅ-MM-DD"`.

**`loans`**
| Felt | Type | Merknad |
|---|---|---|
| `id` | string (UUID) | |
| `name` | string | f.eks. "Boliglån" |
| `lender` | string | f.eks. "DNB" |
| `kind` | `"annuitet" \| "serie" \| "kreditt"` | |
| `startBalance` | øre | restgjeld/saldo på `startDate` |
| `startDate` | dato | |
| `termMonths` | number \| null | gjenværende løpetid fra `startDate`; `null` for kreditt |
| `feePerTerm` | øre | termingebyr; 0 for kreditt |
| `dueDay` | number (1–31) | forfallsdag i måneden |
| `creditLimit` | øre \| null | kun kreditt |
| `monthlyPayment` | øre \| null | kun kreditt: planlagt innbetaling |
| `closedAt` | dato \| null | |

**`rateChanges`**: `id`, `loanId`, `validFrom` (dato), `nominalRate` (hundredels prosent). Hvert lån har minst én (startrenten, `validFrom = startDate`).

**`monthlyEntries`**: `id`, `loanId`, `month` ("ÅÅÅÅ-MM"), `actualBalance` (øre), `actualInterest` (øre | null),
`extraPayment` (øre | null), `note` (string | null). Unik på (`loanId`, `month`).

**`settings`**: nøkkel/verdi: `schemaVersion`, `lastBackupAt`.

Fremtidige tabeller (ikke i v1): `assets`, `assetValues`, budsjett-tabeller.

### 3.4 Beregningsregler
- **Månedsrente** = nominell årsrente / 12, anvendt på restgjeld ved termin. (Banker bruker dagrente; avviket korrigeres av månedlig oppdatering.)
- **Annuitet:** terminbeløp (ekskl. gebyr) = `R · r / (1 − (1 + r)^−n)` der R = restgjeld, r = månedsrente, n = gjenværende terminer.
  Beregnes på nytt ved hver renteendring med gjenværende restgjeld og terminer. Ved r = 0: R / n.
- **Serie:** avdrag = R / n fast; rente = restgjeld · r.
- **Gebyr** legges til hver termin og regnes som kostnad, ikke avdrag.
- **Avrunding:** hver terminverdi avrundes til hele øre (halv opp). Siste termin tar resten slik at restgjeld blir nøyaktig 0.
- **Opprinnelig plan:** beregnes fra `startBalance`, `startDate`, `termMonths` og rentehistorikken.
- **Prognose:** starter fra siste `monthlyEntries.actualBalance` og regner fremover med gjeldende rente og samme sluttdato (annuitetsbeløpet beregnes på nytt).
  Uten registreringer er prognosen lik planen.
- **Foran/bak plan** = planlagt restgjeld − faktisk restgjeld for siste registrerte måned (positivt = foran).
- **Ekstra innbetaling (hva om):** går til avdrag; løpetiden forkortes, terminbeløpet holdes likt.
- **Kreditt:** saldo + rente − innbetaling per måned til saldo ≤ 0. Hvis innbetaling ≤ månedsrente: resultat = "blir aldri nedbetalt".
- **Gjeldfri-plan:** minimumsbetaling på alle lån (terminbeløp / kreditt-innbetaling); ekstra beløp til første lån i prioritert rekkefølge;
  frigjort terminbeløp fra nedbetalte lån legges til ekstra beløp. Maks 600 måneder.
- **Renter hittil i år:** per lån og måned brukes `actualInterest` hvis registrert, ellers planens rente for terminen.
  Resten av året (prognose) bruker prognosens rente.
- **Rentefradrag** = sum renter i kalenderåret · fradragssats for året (2026: 22 %). Mangler sats for et år, brukes siste kjente og det vises en merknad.

## 4. Formatering og språk
- All tekst på norsk (bokmål).
- Beløp: `Intl.NumberFormat('nb-NO', { style: 'currency', currency: 'NOK' })` → `12 345,67 kr`. Oversikter viser hele kroner.
- Prosent: `5,20 %`. Dato: `13.11.2026`. Måned: `november 2026`.
- Input godtar komma som desimaltegn og mellomrom som tusenskille (`2 450 000,50`).

## 5. Feilhåndtering

| Situasjon | Oppførsel |
|---|---|
| Ugyldig input | Feilmelding ved feltet på norsk; skjemaet lagres ikke |
| Kreditt-innbetaling dekker ikke renta | Tydelig advarsel: "blir aldri nedbetalt med dette beløpet" |
| Faktisk restgjeld avviker > 5 % fra plan | Varsel med forslag om å registrere renteendring eller ekstra innbetaling |
| `storage.persist()` avslått eller lagring feiler | Varsel om risiko for tap av data + oppfordring til backup |
| Over 30 dager siden siste backup | Påminnelse på oversikten |
| Ugyldig backup-fil eller nyere skjemaversjon | Avvises med forklaring; eksisterende data endres ikke før hele filen er validert |
| Uventet feil i en skjerm | Error boundary: "Noe gikk galt" + last på nytt; data påvirkes ikke |

## 6. Backup
- Eksport: én JSON-fil `okonomi-backup-ÅÅÅÅ-MM-DD.json` med `schemaVersion` og alle tabeller. Deles via Web Share API (Drive, e-post) eller lastes ned.
- Import: validerer hele filen først, viser hva som vil bli importert, og erstatter deretter alle data i én transaksjon.

## 7. Testing
- **Domain (Vitest), grundigst:** annuitet og serie mot fasit fra bankkalkulator/Excel; renteendring midt i løpetiden;
  gebyr; avrundingsrest i siste termin; rente 0 %; prognose fra faktisk restgjeld; foran/bak plan; ekstra innbetaling;
  kreditt inkl. "aldri nedbetalt"; skred vs. snøball; rentefradrag inkl. manglende sats.
- **Formatering:** format og parse av beløp, prosent og datoer i norsk format.
- **Data:** backup eksport → import gir identiske data; avvisning av ugyldig fil og nyere skjemaversjon.
- **UI (React Testing Library):** registrere et lån → se plan; registrere en måned → se plan vs. faktisk.
- **Manuelt på Android/Chrome** før hver versjon: installer på hjemskjerm, bruk uten nett, eksporter og importer backup.
- Utvikling skjer testdrevet (test først).
