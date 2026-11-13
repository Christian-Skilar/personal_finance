# Personal Finance (Gjeld)

En personlig økonomi-app for Norge. Første versjon handler om gjeld: lån og kreditt, nedbetalingsplaner,
plan mot faktisk, «hva om»-beregninger og plan for å bli gjeldfri. Appen er en installerbar webapp (PWA)
for Android, og alle data lagres lokalt på telefonen.

## Kom i gang

Krever Node.js (LTS).

```bash
npm install
npm run dev      # utviklingsserver
npm test         # tester
npm run build    # produksjonsbygg i dist/
```

## Personvern

Ekte økonomiske data (kontoutskrifter, eksporter fra banken, backup-filer, nøkler og passord) skal **aldri** committes.
Legg slike filer i `data/` eller `private/`, som er utelatt via `.gitignore`.
