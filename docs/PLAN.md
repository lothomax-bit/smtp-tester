# SMTP Tester — Projektplan

## Ziel
Ein Windows-Desktop-Tool (.exe) zum Testen von SMTP-Zugängen. Der Nutzer gibt minimale Daten ein, das Tool testet automatisch alle gängigen Port/TLS-Kombinationen parallel und zeigt detaillierte Ergebnisse inkl. SMTP-Pakettrace bei Fehlern.

## Tech-Stack

| Schicht | Technologie |
|---|---|
| GUI-Framework | [Wails v2](https://wails.io) |
| Frontend | React + TypeScript |
| Backend | Go 1.22+ |
| SMTP-Protokoll | `net/smtp` + custom TracingConn |
| Styling | Tailwind CSS |
| i18n | i18next (DE/EN, wechselbar per Toggle) |
| Build-Output | Einzelne `.exe` für Windows |

## Feature-Liste

### Pflicht (MVP)
- [ ] Eingabeformular: E-Mail, Benutzername, Passwort, SMTP-Server
- [ ] Auto-Detect SMTP-Server aus E-Mail-Domain (`mail.<domain>`)
- [ ] Auto-Prefill Benutzername = E-Mail
- [ ] Paralleler Test aller Port/TLS-Kombinationen (goroutines)
- [ ] Echtzeit-Log-Ausgabe via Wails Events
- [ ] SMTP Packet Trace bei fehlgeschlagenen Tests
- [ ] Passwort-Redaction im Trace (`[REDACTED]`)
- [ ] Ergebnis-Panel mit Status pro Port (erscheint nach Test)
- [ ] Export als `.json` und `.txt` (Export-Button erscheint nach erstem Test)
- [ ] Sprache DE/EN per Toggle

### Optional (Post-MVP)
- [ ] Test-Mail senden (Checkbox, nur nach erfolgreichem Connect)
- [ ] Verbose Export Toggle (Trace auch bei Erfolg exportieren)
- [ ] TLS-Zertifikat-Ablaufdatum anzeigen
- [ ] Batch-Test mehrerer Server

## Nicht enthalten
- Kein Speichern von Profilen / Credentials (jede Session frisch)
- Keine Datenbank
- Keine Cloud-Anbindung
- Keine Installation erforderlich (portable .exe)
