# Sjekkliste: test på Android før hver versjon

Bruk Chrome på telefonen.

## Utrulling (første gang)

1. Logg inn på [Cloudflare](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
2. Velg repoet `Christian-Skilar/personal_finance`, branch `main`.
3. Build-innstillinger: Framework preset **None**, build command `npm run build`, output directory `dist`.
   Under *Environment variables* settes `NODE_VERSION` = `22` (eller nyere).
4. Lagre og deploy. Adressen blir `https://<prosjektnavn>.pages.dev`.

Senere oppdateringer rulles ut automatisk ved push til `main`.

## Installasjon

- [ ] Åpne adressen i Chrome på telefonen.
- [ ] Chrome-menyen (⋮) → **Installer app** / **Legg til på startsiden**.
- [ ] Appen «Gjeld» ligger på hjemskjermen med grønt ikon og åpnes i fullskjerm uten adresselinje.

## Bruk uten nett

- [ ] Åpne appen én gang med nett, lukk den.
- [ ] Slå på flymodus og åpne appen igjen: den starter og viser dataene.

## Funksjoner

- [ ] Legg inn et lån (annuitet) og et kredittkort. Oversikten viser total gjeld, månedlig kostnad og gjeldfri-dato.
- [ ] Åpne lånet: nedbetalingsplanen vises, «Vis alle terminer» fungerer.
- [ ] Registrer en renteendring: planen endres.
- [ ] Månedlig oppdatering: felt er forhåndsutfylt; et beløp > 5 % fra planen gir varsel; lagring fungerer.
- [ ] «Hva om»: knappene 500 / 1 000 / 2 000 / Annet endrer resultatet.
- [ ] Gjeldfri-plan: bytt mellom Skred og Snøball.
- [ ] Tall og datoer vises på norsk (`12 345 kr`, `13.11.2026`, `nov. 2048`).
- [ ] Tastaturet viser talltastatur i beløpsfelt.

## Backup

- [ ] Innstillinger (tannhjulet) → **Eksporter backup** → delingsmenyen åpnes → lagre i Google Drive.
- [ ] Android-innstillinger → Apper → Chrome → Lagring → slett data for nettstedet (eller avinstaller appen og installer på nytt).
- [ ] Appen er tom. **Importer backup** → velg filen → **Erstatt data** → alt er tilbake.
