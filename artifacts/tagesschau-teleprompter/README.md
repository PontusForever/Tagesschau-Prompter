# Teleprompter

Ein schlanker Teleprompter für Nachrichtenmoderationen. Die Anwendung läuft vollständig im Browser und benötigt weder Datenbank noch Backend oder externe Dienste.

## Lokal starten

Im Projektstamm:

```sh
pnpm install
pnpm --filter @workspace/tagesschau-teleprompter run dev
```

## Bauen und selbst hosten

Im Projektstamm:

```sh
pnpm install
pnpm --filter @workspace/tagesschau-teleprompter run build
```

Die fertigen statischen Dateien liegen anschließend unter `artifacts/tagesschau-teleprompter/dist/public`. Diesen Ordner können Sie auf einen beliebigen Static-Hosting-Anbieter hochladen. Für einen Unterpfad setzen Sie vor dem Build `BASE_PATH`, zum Beispiel `/teleprompter/`.
