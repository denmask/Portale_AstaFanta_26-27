window.__firebaseConfig = {
  apiKey: "AIzaSyALPeSK5YctcZsX8bNHhylpLPp1w9qUDIo",
  authDomain: "fantaasta2026-ead51.firebaseapp.com",
  projectId: "fantaasta2026-ead51",
  storageBucket: "fantaasta2026-ead51.firebasestorage.app",
  messagingSenderId: "183050862596",
  appId: "1:183050862596:web:2b91bcc926ab8e467d7551"
};

const ADMIN_PIN = "1926";

const FANTALLENATORI = [
  { nome: "Federico Burello",  fascia: "Fascia 1" },
  { nome: "Denis Mascherin",   fascia: "Fascia 1" },
  { nome: "Kevin Di Bernardo", fascia: "Fascia 1" },
  { nome: "Alex Beltrame",     fascia: "Fascia 1" },
  { nome: "Lorenzo Moro",      fascia: "Fascia 2" },
  { nome: "Cristian Tartaro",  fascia: "Fascia 2" },
  { nome: "Nicola Marano",     fascia: "Fascia 3" },
  { nome: "Aidan Conti",       fascia: "Fascia 3" }
];

const CLUBS = ["Inter", "Napoli", "Milan", "Juventus", "Roma", "Como", "Atalanta", "Lazio"];
const MAX_ASTA = 11;

let db = null;
let dataJson = {};
let assegnazioni = {};
let currentFanta = null;
let currentClub = null;
let listaAsta = [];
let unsubscribe = null;
let editingId = null;
let isAdmin = false;

const $ = id => document.getElementById(id);

function showToast(msg, tipo) {
  let t = document.querySelector(".toast");
  if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
  t.textContent = msg;
  t.className = "toast show" + (tipo === "err" ? " toast-err" : tipo === "ok" ? " toast-ok" : "");
  setTimeout(() => t.classList.remove("show"), 2800);
}

function isConfigured() {
  return window.__firebaseConfig.apiKey !== "INSERISCI_API_KEY";
}

async function loadDataJson() {
  const r = await fetch("data.json");
  dataJson = await r.json();
}

async function loadAssegnazioni() {
  const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
  const snap = await getDoc(doc(db, "config", "assegnazioni"));
  if (snap.exists()) assegnazioni = snap.data();
}

async function saveAssegnazioni() {
  const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
  await setDoc(doc(db, "config", "assegnazioni"), assegnazioni);
}

function populateSelect() {
  const sel = $("fantallenatore-select");
  sel.innerHTML = '<option value="">— Scegli —</option>';
  FANTALLENATORI.forEach(f => {
    const opt = document.createElement("option");
    opt.value = f.nome;
    opt.textContent = `${f.nome} (${f.fascia})`;
    sel.appendChild(opt);
  });
}

function renderDiritto(giocatori) {
  const grid = $("lista-diritto");
  grid.innerHTML = "";
  (giocatori || []).forEach(nome => {
    const card = document.createElement("div");
    card.className = "player-card";
    card.innerHTML = `<div class="player-info"><div class="player-name">${nome}</div></div>`;
    grid.appendChild(card);
  });
  $("count-diritto").textContent = (giocatori || []).length;
}

function renderAsta() {
  const grid = $("lista-asta");
  grid.innerHTML = "";
  listaAsta.forEach(p => {
    const ruoloClass = `ruolo-${(p.ruolo || "").toUpperCase()}`;
    const card = document.createElement("div");
    card.className = "player-card asta-card";
    card.innerHTML = `
      <div class="player-info">
        <div class="player-name">${p.nome}</div>
        <div class="player-meta">${p.crediti ? p.crediti + " cr." : ""}</div>
      </div>
      <span class="player-ruolo ${ruoloClass}">${p.ruolo || "—"}</span>
      <div class="btn-actions">
        <button class="btn-edit" data-id="${p.id}" title="Modifica">✏️</button>
        <button class="btn-del" data-id="${p.id}" title="Elimina">✕</button>
      </div>`;
    grid.appendChild(card);
  });
  const n = listaAsta.length;
  $("count-asta").textContent = `${n}/${MAX_ASTA}`;
  $("btn-add").disabled = n >= MAX_ASTA;
  updateStats();
}

function updateStats() {
  const diritto = (dataJson[currentClub] || []).length;
  const totale = diritto + listaAsta.length;
  const crediti = listaAsta.reduce((s, p) => s + (parseInt(p.crediti) || 0), 0);
  const liberi = MAX_ASTA - listaAsta.length;
  $("stat-totale").textContent = totale;
  $("stat-crediti").textContent = crediti;
  $("stat-slot").textContent = liberi;
}

async function subscribeAsta(fantallenatore) {
  if (unsubscribe) unsubscribe();
  const { collection, query, where, onSnapshot, orderBy } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
  const q = query(collection(db, "asta"), where("fantallenatore", "==", fantallenatore), orderBy("ts", "asc"));
  unsubscribe = onSnapshot(q, snap => {
    listaAsta = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderAsta();
  });
}

async function addGiocatore() {
  const nome = $("input-nome").value.trim();
  const ruolo = $("input-ruolo").value.trim().toUpperCase();
  const crediti = parseInt($("input-crediti").value) || 0;
  if (!nome) { showToast("Inserisci il nome del giocatore", "err"); return; }
  if (listaAsta.length >= MAX_ASTA) { showToast("Slot asta esauriti (max 11)", "err"); return; }
  const { collection, addDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
  await addDoc(collection(db, "asta"), { fantallenatore: currentFanta, club: currentClub, nome, ruolo, crediti, ts: Date.now() });
  $("input-nome").value = "";
  $("input-ruolo").value = "";
  $("input-crediti").value = "";
  $("input-nome").focus();
  showToast(`${nome} aggiunto!`, "ok");
}

async function deleteGiocatore(id) {
  const { doc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
  await deleteDoc(doc(db, "asta", id));
  showToast("Giocatore rimosso");
}

function openEditModal(id) {
  const p = listaAsta.find(x => x.id === id);
  if (!p) return;
  editingId = id;
  $("edit-nome").value = p.nome;
  $("edit-ruolo").value = p.ruolo || "";
  $("edit-crediti").value = p.crediti || "";
  $("modal-edit").classList.remove("hidden");
}

async function saveEdit() {
  const nome = $("edit-nome").value.trim();
  const ruolo = $("edit-ruolo").value.trim().toUpperCase();
  const crediti = parseInt($("edit-crediti").value) || 0;
  if (!nome) { showToast("Nome obbligatorio", "err"); return; }
  const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");
  await updateDoc(doc(db, "asta", editingId), { nome, ruolo, crediti });
  $("modal-edit").classList.add("hidden");
  editingId = null;
  showToast("Modificato!", "ok");
}

async function onFantallenatoreChange(nome) {
  if (!nome) {
    currentFanta = null;
    currentClub = null;
    $("content-area").classList.add("hidden");
    $("squadra-assegnata").classList.add("hidden");
    if (unsubscribe) unsubscribe();
    return;
  }
  currentFanta = nome;
  $("loading-overlay").classList.remove("hidden");
  $("content-area").classList.add("hidden");

  await loadAssegnazioni();
  currentClub = assegnazioni[nome] || null;

  const fascia = FANTALLENATORI.find(f => f.nome === nome)?.fascia || "";
  $("badge-fascia").textContent = fascia;
  $("badge-club").textContent = currentClub ? `🏟 ${currentClub}` : "⏳ In attesa del sorteggio";
  $("squadra-assegnata").classList.remove("hidden");

  if (currentClub && dataJson[currentClub]) {
    renderDiritto(dataJson[currentClub]);
  } else {
    renderDiritto([]);
  }

  await subscribeAsta(nome);
  $("loading-overlay").classList.add("hidden");
  $("content-area").classList.remove("hidden");
}

function renderAdminPanel() {
  const grid = $("admin-assegnazioni-grid");
  grid.innerHTML = "";
  FANTALLENATORI.forEach(f => {
    const clubsUsati = Object.entries(assegnazioni)
      .filter(([k]) => k !== f.nome)
      .map(([, v]) => v);
    const options = CLUBS.map(c => {
      const usato = clubsUsati.includes(c) ? " ⚠️" : "";
      const sel = assegnazioni[f.nome] === c ? "selected" : "";
      return `<option value="${c}" ${sel}>${c}${usato}</option>`;
    }).join("");
    const row = document.createElement("div");
    row.className = "admin-row";
    row.innerHTML = `
      <div class="admin-fanta">
        <span class="admin-fascia-badge">${f.fascia}</span>
        <span class="admin-fanta-nome">${f.nome}</span>
      </div>
      <select class="admin-club-select" data-fanta="${f.nome}">
        <option value="">— Nessuna —</option>
        ${options}
      </select>`;
    grid.appendChild(row);
  });
}

async function saveAdminAssegnazioni() {
  const selects = document.querySelectorAll(".admin-club-select");
  const nuove = {};
  selects.forEach(s => { if (s.value) nuove[s.dataset.fanta] = s.value; });
  const clubs = Object.values(nuove);
  const duplicati = clubs.filter((c, i) => clubs.indexOf(c) !== i);
  if (duplicati.length > 0) {
    showToast(`❌ ${duplicati[0]} è assegnato a due fantallenatori!`, "err");
    return;
  }
  assegnazioni = { ...nuove };
  await saveAssegnazioni();
  showToast("✅ Abbinamenti salvati!", "ok");
  $("modal-admin").classList.add("hidden");
  if (currentFanta) onFantallenatoreChange(currentFanta);
}

function openAdminPanel() {
  if (!isAdmin) {
    const pin = prompt("🔐 PIN Admin:");
    if (pin === null) return;
    if (pin !== ADMIN_PIN) { showToast("PIN errato!", "err"); return; }
    isAdmin = true;
  }
  loadAssegnazioni().then(() => {
    renderAdminPanel();
    $("modal-admin").classList.remove("hidden");
  });
}

function attachListeners() {
  $("fantallenatore-select").addEventListener("change", e => onFantallenatoreChange(e.target.value));
  $("btn-add").addEventListener("click", addGiocatore);
  $("input-nome").addEventListener("keydown", e => { if (e.key === "Enter") addGiocatore(); });
  $("lista-asta").addEventListener("click", e => {
    const del = e.target.closest(".btn-del");
    const edit = e.target.closest(".btn-edit");
    if (del) deleteGiocatore(del.dataset.id);
    if (edit) openEditModal(edit.dataset.id);
  });
  $("btn-modal-save").addEventListener("click", saveEdit);
  $("btn-modal-cancel").addEventListener("click", () => { $("modal-edit").classList.add("hidden"); editingId = null; });
  $("modal-edit").addEventListener("click", e => { if (e.target === $("modal-edit")) { $("modal-edit").classList.add("hidden"); editingId = null; } });
  $("btn-admin").addEventListener("click", openAdminPanel);
  $("btn-admin-save").addEventListener("click", saveAdminAssegnazioni);
  $("btn-admin-cancel").addEventListener("click", () => $("modal-admin").classList.add("hidden"));
  $("modal-admin").addEventListener("click", e => { if (e.target === $("modal-admin")) $("modal-admin").classList.add("hidden"); });
}

async function start() {
  if (!isConfigured()) { $("setup-msg").style.display = "block"; return; }
  $("setup-msg").style.display = "none";
  db = window.__db;
  await loadDataJson();
  populateSelect();
  attachListeners();
}

document.addEventListener("DOMContentLoaded", () => {
  if (window.__db) { start(); } else { window.addEventListener("firebase-ready", start); }
});