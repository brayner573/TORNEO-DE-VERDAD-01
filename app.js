// =====================================================
// app.js — Lógica principal del torneo Dota 2 con Firebase Modular
// =====================================================

// Importaciones de Firebase Modular (CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, getDocs, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// Tu configuración de Firebase proporcionada
// CONFIG FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyCK689qDC94UAo2fCqkeWU-z_Q3HD_yKEY",
  authDomain: "torneo-de-dotita.firebaseapp.com",
  projectId: "torneo-de-dotita",
  storageBucket: "torneo-de-dotita.appspot.com",
  messagingSenderId: "958554768082",
  appId: "1:958554768082:web:fb613bce7b756bdd7da30b"
};

// INICIALIZAR FIREBASE
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

const WHATSAPP_URL = "https://chat.whatsapp.com/EDLgOCOg7dACXYFtHRhDIu?mode=gi_t";
const MAX_TEAMS = 16;
const COLLECTION_NAME = "equipos"; // Nombre de la colección en Firestore


// ─── PARTICLES BACKGROUND ─────────────────────────────────────────────────────
(function initParticles() {
  const canvas = document.getElementById("particles");
  const ctx    = canvas.getContext("2d");
  if (!canvas) return; // Seguridad

  let particles = [];
  const COLORS  = ["rgba(184,24,26,0.6)", "rgba(212,160,23,0.5)", "rgba(240,192,64,0.3)"];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  // Crear partículas iniciales
  for (let i = 0; i < 55; i++) {
    particles.push({
      x:     Math.random() * canvas.width,
      y:     Math.random() * canvas.height,
      r:     Math.random() * 1.8 + 0.4,
      vx:    (Math.random() - 0.5) * 0.25,
      vy:    (Math.random() - 0.5) * 0.25,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();

      // Mover partícula
      p.x += p.vx;
      p.y += p.vy;

      // Rebotar en bordes
      if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
    });
    requestAnimationFrame(draw);
  }
  draw();
})();


// ─── NAVBAR SCROLL EFFECT ─────────────────────────────────────────────────────
window.addEventListener("scroll", () => {
  const nav = document.querySelector(".navbar");
  if (!nav) return;
  nav.style.boxShadow = window.scrollY > 50
    ? "0 4px 24px rgba(0,0,0,0.7)"
    : "none";
});


// ─── CONTADOR DE EQUIPOS (Actualizar UI) ──────────────────────────────────────
function updateStats(count) {
  const libre = Math.max(0, MAX_TEAMS - count);
  const totalEl = document.getElementById("totalEquipos");
  const libreEl = document.getElementById("cuposLibres");
  if (totalEl) totalEl.textContent = count;
  if (libreEl) libreEl.textContent = libre;
}


// ─── CARGAR EQUIPOS (Escucha en tiempo real modular) ─────────────────────────
function loadTeams() {
  const container = document.getElementById("teamsContainer");
  if (!container) return;

  const teamsRef = collection(db, COLLECTION_NAME);
  // Consulta ordenada por timestamp ascendente
  const q = query(teamsRef, orderBy("timestamp", "asc"));

  // Escuchar en tiempo real
  onSnapshot(q, (snapshot) => {
    updateStats(snapshot.size);

    if (snapshot.empty) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">⚔</span>
          <p>Aún no hay equipos inscritos.</p>
          <p>¡Sé el primero en registrarte!</p>
        </div>`;
      return;
    }

    container.innerHTML = "";
    let idx = 1;
    snapshot.forEach((doc) => {
      const d = doc.data();
      container.appendChild(createTeamCard(d, idx++));
    });
  }, (err) => {
    console.error("Error cargando equipos:", err);
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">⚠️</span>
        <p>Error al cargar equipos. Revisa la configuración y reglas de Firestore en la consola de Firebase.</p>
        <p style="font-size:0.8rem;color:red;">Detalle: ${err.message}</p>
      </div>`;
  });
}


// ─── CREAR TARJETA DE EQUIPO ──────────────────────────────────────────────────
function createTeamCard(data, num) {
  const card    = document.createElement("div");
  card.className = "team-card";
  card.style.animationDelay = `${(num - 1) * 0.07}s`;

  const initials = data.teamName
    ? data.teamName.substring(0, 2).toUpperCase()
    : "??";

  // Jugadores como tags (seguridad ante nulos)
  const playersArray = Array.isArray(data.players) ? data.players : [];
  const playerTags = playersArray
    .map(p => `<span class="player-tag">⚔ ${escapeHtml(p)}</span>`)
    .join("");

  card.innerHTML = `
    <span class="team-num">#${String(num).padStart(2,"0")}</span>
    <div class="team-card-header">
      <div class="team-avatar">${escapeHtml(initials)}</div>
      <div>
        <div class="team-name">${escapeHtml(data.teamName)}</div>
        <div class="team-captain">👑 ${escapeHtml(data.captain)}</div>
      </div>
    </div>
    <div class="team-players">${playerTags}</div>`;
  return card;
}


// ─── VALIDAR FORMULARIO ────────────────────────────────────────────────────────
function clearErrors() {
  document.querySelectorAll(".error-msg").forEach(el => el.textContent = "");
  document.querySelectorAll(".error-field").forEach(el => el.classList.remove("error-field"));
  const formError = document.getElementById("formError");
  if (formError) formError.style.display = "none";
}

function setError(fieldId, errId, msg) {
  const field = document.getElementById(fieldId);
  const err   = document.getElementById(errId);
  if (field) field.classList.add("error-field");
  if (err)   err.textContent = msg;
}

function validateForm() {
  clearErrors();
  let valid = true;

  const teamNameInput = document.getElementById("teamName");
  const captainInput = document.getElementById("captain");
  const contactInput = document.getElementById("contact");
  if (!teamNameInput || !captainInput || !contactInput) return null; // Error fatal de estructura

  const teamName = teamNameInput.value.trim();
  const captain  = captainInput.value.trim();
  const contact  = contactInput.value.trim();
  const players  = Array.from(document.querySelectorAll(".player-input"))
                        .map(i => i.value.trim());

  if (!teamName) {
    setError("teamName", "err-teamName", "El nombre del equipo es obligatorio.");
    valid = false;
  }
  if (!captain) {
    setError("captain", "err-captain", "El nombre del capitán es obligatorio.");
    valid = false;
  }
  if (!contact) {
    setError("contact", "err-contact", "El contacto de WhatsApp es obligatorio.");
    valid = false;
  } else if (!/^[\+]?[\d\s\-\(\)]{7,20}$/.test(contact)) {
    setError("contact", "err-contact", "Ingresa un número de teléfono válido.");
    valid = false;
  }

  // Validar los 5 jugadores
  const playerInputs = document.querySelectorAll(".player-input");
  players.forEach((p, i) => {
    if (!p) {
      if (playerInputs[i]) playerInputs[i].classList.add("error-field");
      const errP = document.getElementById(`err-p${i}`);
      if (errP) errP.textContent = "Campo requerido.";
      valid = false;
    }
  });

  return valid
    ? { teamName, captain, contact, players }
    : null;
}


// ─── SUBMIT FORMULARIO (Sintaxis Modular) ─────────────────────────────────────
const registroForm = document.getElementById("registroForm");
if (registroForm) {
  registroForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = validateForm();
    if (!data) return;

    // Referencias de UI
    const btnText = document.getElementById("btnText");
    const btnLoader = document.getElementById("btnLoader");
    const submitBtn = document.getElementById("submitBtn");
    const formErrorEl = document.getElementById("formError");

    // Verificar cupos disponibles (consulta rapida)
    const teamsRef = collection(db, COLLECTION_NAME);
    let totalInscritos = 0;
    try {
      const snapTotal = await getDocs(teamsRef);
      totalInscritos = snapTotal.size;
    } catch (e) {
      console.error("Error verificando cupos:", e);
    }

    if (totalInscritos >= MAX_TEAMS) {
      if (formErrorEl) {
        formErrorEl.textContent = "⚠ Lo sentimos, todos los cupos están llenos.";
        formErrorEl.style.display = "block";
      }
      return;
    }

    // Verificar que el nombre no esté repetido
    const qDup = query(teamsRef, where("teamName", "==", data.teamName));
    try {
      const dupSnap = await getDocs(qDup);
      if (!dupSnap.empty) {
        setError("teamName", "err-teamName", "Ya existe un equipo con ese nombre.");
        return;
      }
    } catch (e) {
      console.error("Error verificando duplicados:", e);
    }

    // Mostrar loader
    if (btnText) btnText.style.display   = "none";
    if (btnLoader) btnLoader.style.display = "inline";
    if (submitBtn) submitBtn.disabled      = true;

    // Suplentes
    const subs = Array.from(document.querySelectorAll(".sub-input"))
                      .map(i => i.value.trim())
                      .filter(Boolean);

    try {
      // Guardar en Firestore Modular
      await addDoc(teamsRef, {
        teamName:  data.teamName,
        captain:   data.captain,
        contact:   data.contact,
        players:   data.players,
        subs:      subs,
        timestamp: serverTimestamp() // Tiempo del servidor
      });

      // Mostrar éxito
      if (registroForm) registroForm.style.display = "none";
      const formSuccess = document.getElementById("formSuccess");
      if (formSuccess) formSuccess.style.display  = "block";

    } catch (err) {
      console.error("Error al guardar:", err);
      if (formErrorEl) {
        formErrorEl.innerHTML = `❌ Error al guardar. Revisa la conexión y la configuración/reglas de Firestore.<br><span style="font-size:0.8rem">Detalle: ${err.message}</span>`;
        formErrorEl.style.display = "block";
      }
    } finally {
      if (btnText) btnText.style.display   = "inline";
      if (btnLoader) btnLoader.style.display = "none";
      if (submitBtn) submitBtn.disabled      = false;
    }
  });
}

// Exponer resetForm globalmente porque se llama desde un onclick HTML
window.resetForm = function resetForm() {
  const registroForm = document.getElementById("registroForm");
  const formSuccess = document.getElementById("formSuccess");
  if (registroForm) {
    registroForm.reset();
    registroForm.style.display = "block";
  }
  if (formSuccess) formSuccess.style.display  = "none";
  clearErrors();
}


// ─── UTILIDADES ───────────────────────────────────────────────────────────────
function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;"); // Tambien escapar comillas simples
}


// ─── INICIALIZAR ──────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  loadTeams();
});
