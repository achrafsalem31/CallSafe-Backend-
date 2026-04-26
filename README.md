CallSafe Backend API

Backend API für die CallSafe Anti-Betrugs App.
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




Beim Speichern einer Meldung wird zusätzlich die Tabelle numbers aktualisiert und ein neuer Eintrag im Tabelle Reports erstellt.
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





Backend für das Studienprojekt CallSafe / Anti-Betrugs App.
