# SMTP Tester — UI Spezifikation

## Design-Prinzipien
- Modernes, informatives Layout mit dunklem Theme
- Tailwind CSS fuer Styling (keine externe UI-Bibliothek)
- Responsive innerhalb des Fensters (min. 900x650px)
- Monospace-Font fuer Log/Trace-Bereiche

## Layout-Uebersicht

```
+------------------------------------------------------+
|  SMTP Tester                          [DE | EN]      |  <- Header
+------------------------------------------------------+
|                                                      |
|  E-Mail        [user@example.com               ]     |
|  Benutzername  [user@example.com               ]     |  <- auto-prefill
|  Passwort      [********************           ] 👁  |  <- show/hide Toggle
|  SMTP-Server   [mail.example.com               ]     |  <- auto-detect
|                                                      |
|  [ ] Test-Mail senden an: [empfaenger@example.com]   |
|                                                      |
|              [ Testen ]                              |
+------------------------------------------------------+
|  LOG OUTPUT                     [ ] Trace anzeigen   |
|  +--------------------------------------------------+ |
|  | 22:04:01 INFO  Starte Tests fuer example.com...  | |
|  | 22:04:01 TRACE >>> EHLO smtp-tester              | |
|  | 22:04:01 TRACE <<< 250-mail.example.com Hello    | |
|  | 22:04:02 OK    Port 587 STARTTLS -- 342ms        | |
|  | 22:04:02 ERROR Port 465 -- Connection refused    | |
|  +--------------------------------------------------+ |
+------------------------------------------------------+
|  ERGEBNISSE                         [ Exportieren ]  |  <- erscheint nach Test
|  +----------+ +----------+ +----------+ +--------+   |
|  | Port 587 | | Port 465 | | Port 25  | | Port   |   |
|  | STARTTLS | | SSL/TLS  | | STARTTLS | | 2525   |   |
|  | OK 342ms | | refused  | | geblockt | | timeout|   |
|  +----------+ +----------+ +----------+ +--------+   |
|                                                      |
|  Empfehlung: Port 587 mit STARTTLS verwenden         |
+------------------------------------------------------+
```

## Komponenten

### `ConnectionForm.tsx`
- Felder: `email`, `username`, `password`, `smtpServer`
- `onEmailChange`: extrahiert Domain -> setzt smtpServer auf `mail.<domain>` wenn das Feld noch leer ist
- `onEmailChange`: setzt `username` auf `email`-Wert wenn `username` noch unveraendert
- Passwort-Feld: Toggle show/hide per Auge-Icon
- Checkbox "Test-Mail senden": zeigt zusaetzliches Empfaenger-Eingabefeld
- Submit-Button: `disabled` waehrend Test laeuft, zeigt Spinner-Icon

### `LogViewer.tsx`
- Scrollbare Liste von `LogEntry`-Objekten
- Farbcodierung:
  - `TRACE`: `text-gray-400` (nur sichtbar wenn Toggle aktiv)
  - `INFO`:  `text-blue-300`
  - `OK`:    `text-green-400`
  - `WARN`:  `text-yellow-400`
  - `ERROR`: `text-red-400`
- Toggle "Trace anzeigen" -- filtert TRACE-Eintraege ein/aus ohne sie zu verwerfen
- Auto-Scroll ans Ende bei neuen Eintraegen
- Monospace-Font fuer alle Trace-Zeilen (`font-mono`)
- `>>>` und `<<<` Direction-Marker farblich von Inhalt abgesetzt

### `ResultPanel.tsx`
- Erscheint erst wenn `results.length > 0`
- 4 Karten nebeneinander (eine pro Port aus TestMatrix)
- Karteninhalt: Port-Nummer, Label, Status-Icon, Latenz oder Fehlertext
- Erfolgreiche Karte: gruener Border (`border-green-500`), TLS-Version, Zertifikat-Ablauf
- Fehlgeschlagene Karte: roter Border (`border-red-500`), Fehlertyp kurz zusammengefasst
- Empfehlungszeile unter den Karten: hebt den besten (ersten erfolgreichen) Port hervor
- Export-Button neben dem Titel "ERGEBNISSE"

### `LanguageToggle.tsx`
- Button `DE | EN` oben rechts im Header
- Nutzt `i18next.changeLanguage()`
- Aktive Sprache: `font-bold`, inaktive: `text-gray-400`

## Wails Events (React-Seite)

```typescript
// hooks/useSmtpTest.ts
EventsOn("smtp:log", (entry: LogEntry) => {
    setLogs(prev => [...prev, entry])
})

// Test starten
const results = await RunTest(config)  // Wails Binding aus wailsjs/go/main/App
setResults(results)
```

## i18n Schluessel

```json
// de.json
{
  "form.email": "E-Mail",
  "form.username": "Benutzername",
  "form.password": "Passwort",
  "form.smtpServer": "SMTP-Server",
  "form.sendTestMail": "Test-Mail senden an",
  "form.startTest": "Testen",
  "log.title": "Log-Ausgabe",
  "log.showTrace": "Trace anzeigen",
  "results.title": "Ergebnisse",
  "results.recommendation": "Empfehlung",
  "results.export": "Exportieren",
  "results.latency": "Latenz",
  "results.certExpiry": "Zertifikat gueltig bis"
}
```
