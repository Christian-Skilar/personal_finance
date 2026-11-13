# Repo-analyse: securo-finance/securo

- URL: https://github.com/securo-finance/securo
- Sjekket: 13.11.2026 (siste commit 12.11.2026, svært aktivt)
- Lisens: **AGPL-3.0**. Vi kopierer ikke kode, kun ideer og mønstre.
- Opphav: Brasil. Ingen norsk språkfil, ingen norske skatteregler (`fiscal/jurisdictions/no.toml` dekker bare org.nr for fakturaer).

## Hva det er

Selvhostet, fullverdig personal finance-app: kontoer, transaksjoner, import (OFX/QIF/CAMT/CSV),
regelbasert kategorisering, budsjetter, lån, mål, eiendeler, nettoformue-rapporter, flervaluta,
flerbruker, bank-sync (Enable Banking m.fl.), AI-agenter.

Stack: Python/FastAPI + SQLAlchemy + Alembic + PostgreSQL, Celery + Redis, React + Vite + TypeScript, Docker Compose.

## Hva vi kan lære

### 1. Lån: plan regnes ut ved lesing, lagres ikke (`backend/app/services/loan_schedule.py`)
Bekrefter tilnærmingen vi diskuterte:
- Lånet lagrer bare **avtalevilkårene**: opprinnelig beløp, rente, renteperiode, løpetid, første forfall, metode.
- Planen beregnes hver gang den vises (ren funksjon, ingen database). Lett å teste.
- **Plan vs. faktisk:** sammenligner planlagt restgjeld med faktisk saldo → "foran/bak plan" og
  "forventet nedbetalt dato" basert på faktisk restgjeld.
- To metoder: `price` (= annuitet) og `sac` (= serielån). Akkurat de to vi har i Norge.
- Bruker `Decimal`, avrunder til øre, og lar siste termin ta avrundingsrestene.
- Fanger opp "betalingen dekker ikke engang renta".

Mangler for norsk bruk (som vi må legge til):
- **Termingebyr** per termin.
- **Renteendringer over tid.** Securo har én fast rente per lån. Norske lån har flytende rente som banken endrer;
  vi trenger en historikk (`gyldig fra`-dato + rente) og regne planen på nytt fra hver endring.
- **Effektiv vs. nominell rente.** Norske banker oppgir nominell årsrente (beregnes /12). Effektiv rente bør vises, ikke brukes i utregning.
- **Avdragsfrihet** (perioder med bare renter).

### 2. Eiendeler med verdihistorikk (`models/asset.py`, `models/asset_value.py`)
- Eiendel (bolig, bil, fond …) + en tabell med **verdi per dato**. Nettoformue over tid = sum eiendeler − sum gjeld per dato.
- Verdsetting: `manual` eller `growth_rule` (f.eks. +3 % per år). Nyttig for bolig.
- Lån kan kobles til eiendelen det er sikret i (`secured_asset_id`), f.eks. boliglån → bolig. Gir belåningsgrad.

Dette passer perfekt med vår idé om **månedlige snapshots**: én verdi per konto/eiendel/lån per måned.

### 3. Penger som `Decimal`/`Numeric(15,2)`, aldri float
Standard, men viktig. Vi gjør det samme.

### 4. Landregler som datafiler (`backend/app/fiscal/`)
Hvert land er en TOML-fil, logikken i kode. Samme prinsipp for oss: **skattesatser per år som datafiler**
(`satser/2026.toml`, `satser/2027.toml`), ikke hardkodet.

### 5. Kredittkort
Konto-modellen har `credit_limit`, `minimum_payment`, `statement_close_day`, `payment_due_day`.
Nyttige felter å ha med for kredittkort/rammekreditt.

## Hva vi IKKE bør kopiere
- Omfanget. Flerbruker, workspaces, passkeys, OIDC, fakturering, AI-agenter, Celery/Redis, bank-sync: alt dette er
  langt mer enn vi trenger for start. Det er hovedgrunnen til at kodebasen er stor (~1200 filer).
- Postgres + Redis + Docker som krav fra dag én. For én bruker holder SQLite.

## Konklusjon
Mest verdifullt: lånemodellen (vilkår lagres → plan beregnes → plan vs. faktisk) og eiendel + verdihistorikk for nettoformue.
Begge passer direkte til vår manuelle, månedlige tilnærming.
