SECUREME Backend API

Backend API für die SECUREME Anti-Betrugs App.
Dieses Backend stellt eine sichere Schnittstelle zwischen Frontend und Datenbank bereit und verwaltet Authentifizierung, Benutzer, Quizze, Trainingsmodule, Meldungen und Telefonnummernprüfungen.

Projektübersicht

Das Backend wurde mit Node.js und Express entwickelt und verwendet Supabase als Datenbank.
Die API ist in mehrere Routenbereiche aufgeteilt und unterstützt sowohl öffentliche als auch geschützte Endpunkte.
Für geschützte Funktionen werden JWT-Tokens und eine Rollenprüfung für Admins verwendet.

Architektur

Frontend → Backend API → Supabase Datenbank

Das Frontend kommuniziert nicht direkt mit der Datenbank, sondern sendet HTTP-Requests an die API.
Das Backend übernimmt dabei:

Authentifizierung
Validierung
Rollen- und Rechteprüfung
Datenbankzugriffe
Rückgabe strukturierter JSON-Antworten
Verwendete Technologien
Node.js
Express
Supabase
JWT (jsonwebtoken)
Passwort-Hashing mit bcryptjs
express-validator
helmet
cors
express-rate-limit
dotenv
Projektstruktur
config/
  supabase.js

middleware/
  auth.js

routes/
  auth.js
  numbers.js
  quiz.js
  reports.js
  training.js
  users.js

server.js
package.json
Bedeutung der Dateien
server.js
Einstiegspunkt des Backends. Initialisiert Express, Middleware, CORS, Rate-Limiting, Logging und registriert alle API-Routen.
config/supabase.js
Erstellt den Supabase-Client und optional einen Admin-Client für privilegierte Operationen.
middleware/auth.js
Enthält die JWT-Validierung, Admin-Prüfung und optionale Authentifizierung.
routes/auth.js
Registrierung, Login und Abruf des aktuell eingeloggten Benutzers.
routes/numbers.js
Prüfung gemeldeter Telefonnummern, Statistik und Admin-Verwaltung gemeldeter Nummern.
routes/quiz.js
Abruf, Erstellung, Bearbeitung und Löschung von Quizzen sowie Speicherung von Quiz-Ergebnissen.
routes/reports.js
Entgegennahme von Betrugsmeldungen sowie Admin-Zugriff auf Meldungen und Meldungsstatistiken.
routes/training.js
Verwaltung von Schulungs- und Lernmodulen.
routes/users.js
Admin-Verwaltung der Benutzer und ihrer Rollen sowie Einsicht in Quiz-Ergebnisse einzelner Benutzer.
Installation
1. Repository klonen
git clone <repository-url>
cd secureme-backend
2. Abhängigkeiten installieren
npm install

Die benötigten Pakete sind in package.json definiert.

3. Umgebungsvariablen anlegen

Erstelle eine .env Datei im Root-Verzeichnis:

PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5500

SUPABASE_URL=deine_supabase_url
SUPABASE_ANON_KEY=dein_supabase_anon_key
SUPABASE_SERVICE_KEY=dein_supabase_service_key

JWT_SECRET=dein_geheimes_jwt_secret
JWT_EXPIRES_IN=7d

Die Supabase-Konfiguration erwartet mindestens SUPABASE_URL und SUPABASE_ANON_KEY.
Ein SUPABASE_SERVICE_KEY kann zusätzlich für privilegierte Admin-Operationen verwendet werden.

4. Server starten

Entwicklungsmodus:

npm run dev

Produktionsmodus:

npm start

Die verfügbaren Scripts sind in package.json definiert.

Sicherheit

Das Backend enthält mehrere Sicherheitsmechanismen:

JWT-Authentifizierung für geschützte Endpunkte
Admin-Rollenprüfung für Verwaltungsfunktionen
Passwort-Hashing mit bcrypt
Helmet für Security-Header
CORS-Schutz
Rate Limiting für API-Anfragen
Auth-Middleware

Das Middleware-Modul bietet:

verifyToken → prüft das JWT
isAdmin → erlaubt nur Admin-Zugriff
optionalAuth → verarbeitet optional vorhandene Tokens
API-Endpunkte
1. Authentifizierung
POST /api/auth/register

Registriert einen neuen Benutzer.

Body:

{
  "email": "user@example.com",
  "password": "123456",
  "name": "Max Mustermann"
}
POST /api/auth/login

Meldet einen Benutzer an und gibt ein JWT zurück.

Body:

{
  "email": "user@example.com",
  "password": "123456"
}
GET /api/auth/me

Gibt den aktuell eingeloggten Benutzer zurück.
Benötigt ein gültiges JWT im Header.

2. Quiz API
Öffentliche Endpunkte
GET /api/quiz → Alle veröffentlichten Quizze abrufen
GET /api/quiz/:id → Einzelnes Quiz abrufen
Geschützte Endpunkte
POST /api/quiz → Neues Quiz erstellen (Admin)
PUT /api/quiz/:id → Quiz bearbeiten (Admin)
DELETE /api/quiz/:id → Quiz löschen (Admin)
POST /api/quiz/:id/result → Quiz-Ergebnis speichern (eingeloggte Benutzer)
GET /api/quiz/:id/results → Quiz-Ergebnisse abrufen (Admin)
3. Training API
Öffentliche Endpunkte
GET /api/training → Alle veröffentlichten Trainingsmodule abrufen
GET /api/training/:id → Einzelnes Modul abrufen
Geschützte Endpunkte
POST /api/training → Neues Trainingsmodul erstellen (Admin)
PUT /api/training/:id → Trainingsmodul aktualisieren (Admin)
DELETE /api/training/:id → Trainingsmodul löschen (Admin)
4. Reports API
Öffentliche Endpunkte
POST /api/reports → Neue Betrugsmeldung speichern

Beim Speichern einer Meldung wird zusätzlich die Tabelle numbers aktualisiert oder ein neuer Eintrag erstellt.
Dadurch wird die gemeldete Telefonnummer automatisch in der Nummernübersicht gepflegt.

Geschützte Endpunkte
GET /api/reports → Alle Meldungen abrufen (Admin)
GET /api/reports/stats → Statistik der Meldungen abrufen (Admin)
DELETE /api/reports/:id → Meldung löschen (Admin)
5. Numbers API
Öffentliche Endpunkte
GET /api/numbers/check/:phone → Telefonnummer auf Meldungen prüfen
GET /api/numbers/stats → Statistiken zu gemeldeten Nummern abrufen
Geschützte Endpunkte
GET /api/numbers → Alle gemeldeten Nummern abrufen (Admin)
DELETE /api/numbers/:phone → Nummer löschen (Admin)
6. Users API
Geschützte Endpunkte

Alle Benutzer-Endpunkte sind nur für Admins zugänglich:

GET /api/users → Alle Benutzer abrufen
GET /api/users/:id → Einzelnen Benutzer abrufen
GET /api/users/:id/results → Quiz-Ergebnisse eines Benutzers abrufen
PUT /api/users/:id/role → Rolle eines Benutzers ändern
DELETE /api/users/:id → Benutzer löschen
Datenbanktabellen

Basierend auf den vorhandenen Routen verwendet das Backend mindestens folgende Tabellen in Supabase:

users
quizzes
questions
quiz_results
training_modules
reports
numbers
Beispiel für Authentifizierung im Frontend

Nach erfolgreichem Login liefert die API ein JWT zurück.
Dieses Token muss bei geschützten Requests im Header mitgesendet werden:

const response = await fetch('http://localhost:3000/api/users', {
  method: 'GET',
  headers: {
    'Authorization': Bearer ${token}
  }
});

Die Prüfung erfolgt im Backend über verifyToken.

Health Check
GET /

Einfacher Test-Endpunkt, um zu prüfen, ob der Server läuft.

Beispielantwort:

{
  "message": "SECUREME API Server",
  "version": "1.0.0",
  "status": "running"
}




Hinweise
Die API verwendet JSON als Datenformat.
Einige Routen sind öffentlich, andere nur für eingeloggte Benutzer oder Admins verfügbar.
Für produktive Nutzung sollten JWT-Secret und Supabase-Keys sicher in .env gespeichert werden.
Entwickler

Backend für das Studienprojekt SECUREME / Anti-Betrugs App.
