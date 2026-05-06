======================================
  PORTALE ASTA FANTA 26/27 - README
======================================

FILE DEL PROGETTO
-----------------
index.html   → Struttura HTML dell'app
style.css    → Stile (tema bianco, mobile-first)
script.js    → Logica Firebase + gestione liste
data.json    → 14 giocatori di diritto per ogni club
readme.txt   → Questo file


SETUP FIREBASE (passo dopo passo)
----------------------------------

1. Vai su https://console.firebase.google.com
2. Crea un nuovo progetto → chiamalo "FantaAsta2026"
   - Disabilita Google Analytics → clicca Crea

3. Nel menu a sinistra: Build > Firestore Database
   - Crea database
   - Scegli "Avvia in modalità test"
   - Regione: eur3 (Europa) → Abilita

4. Registra la Web App:
   - Icona ⚙️ > Impostazioni progetto
   - Scorri in basso → icona </> (Web App)
   - Nome: "PortaleAsta" → Registra
   - Copia l'oggetto firebaseConfig che appare

5. Incolla i valori in script.js sostituendo le stringhe
   "INSERISCI_..." con i tuoi valori reali. Esempio:
   
   window.__firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "fantaasta2026.firebaseapp.com",
     projectId: "fantaasta2026",
     ...
   };


STRUTTURA FIRESTORE (collezioni)
---------------------------------

Collezione: config
  Documento ID: assegnazioni
  Campi (aggiungi uno per fantallenatore DOPO il sorteggio):
    Nome campo → valore (nome esatto del club come in data.json)
  
  Esempio dopo sorteggio del 01-02 Giugno 2026:
    "Denis Mascherin"    → "Milan"
    "Federico Burello"   → "Inter"
    "Kevin Di Bernardo"  → "Juventus"
    "Alex Beltrame"      → "Napoli"
    "Lorenzo Moro"       → "Roma"
    "Cristian Tartaro"   → "Como"
    "Nicola Marano"      → "Atalanta"
    "Aidan Conti"        → "Lazio"
  
  IMPORTANTE: I nomi dei club devono essere identici
  a quelli del file data.json (maiuscola iniziale).
  Esempio CORRETTO: "Milan", "Inter", "Como"
  Esempio SBAGLIATO: "milan", "INTER", "A.C. Milan"

Collezione: asta
  Non serve crearla manualmente.
  L'app la crea automaticamente al primo "Aggiungi".


COME USARE DURANTE L'ASTA
---------------------------

1. Apri index.html su PC o smartphone (connessione internet)
2. Seleziona il Fantallenatore dal menu
3. Vedi i 14 giocatori di diritto in alto
4. Per ogni acquisto all'asta:
   - Scrivi il nome del giocatore
   - Inserisci il ruolo (P / D / C / A)
   - Inserisci i crediti spesi
   - Premi "Aggiungi" o invio
5. Puoi modificare (✏️) o eliminare (✕) ogni acquisto
6. Tutte le modifiche sono in tempo reale su tutti i device


LIMITI
-------
- Max 11 acquisti all'asta per fantallenatore
- 14 giocatori di diritto (non modificabili, fissi da data.json)
- Rosa totale massima: 25 giocatori


RUOLI VALIDI
-------------
P  → Portiere
D  → Difensore
C  → Centrocampista
A  → Attaccante


FANTALLENATORI STAGIONE 26/27
-------------------------------
Fascia 1: Federico Burello, Denis Mascherin (SuperAdmin),
          Kevin Di Bernardo (ViceAdmin), Alex Beltrame
Fascia 2: Lorenzo Moro, Cristian Tartaro
Fascia 3: Nicola Marano, Aidan Conti

======================================
  Buona asta! ⚽
======================================