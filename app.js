// =====================================================================
// app.js — Firebase Modular v9 + Lógica completa del torneo Dota 2
//
// CORRECCIONES APLICADAS vs versión antigua (compat):
// ✅ Usa import desde CDN (esm.sh) — NO firebase-app-compat
// ✅ initializeApp en lugar de firebase.initializeApp()
// ✅ getFirestore() en lugar de firebase.firestore()
// ✅ collection(), addDoc(), getDocs(), query(), where(), orderBy(),
//    onSnapshot(), serverTimestamp() importados individualmente
// ✅ Sin variables globales de Firebase — todo encapsulado en módulo
// ✅ resetForm() expuesta en window para que el HTML pueda llamarla
// ✅ Partículas separadas e iniciadas al cargar el DOM
// =====================================================================

// ─── 1. IMPORTS — Firebase modular v9 desde CDN ───────────────────────────
import { initializeApp }                    from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getCountFromServer
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ─── 2. CONFIGURACIÓN FIREBASE ────────────────────────────────────────────
// ⚠️  REEMPLAZA estos valores con los de TU proyecto en Firebase Console
//     https://console.firebase.google.com/ → Tu proyecto → Configuración → Web
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



// ─── 4. CONSTANTES ────────────────────────────────────────────────────────
const COLLECTION   = "equipos";   // Nombre de la colección Firestore
const MAX_TEAMS    = 16;
const WHATSAPP_URL = "https://chat.whatsapp.com/EDLgOCOg7dACXYFtHRhDIu?mode=gi_t";

// ─── 5. PARTICLES BACKGROUND ──────────────────────────────────────────────
function initParticles() {
  const canvas = document.getElementById("particles");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const COLORS = [
    "rgba(184,24,26,0.6)",
    "rgba(212,160,23,0.5)",
    "rgba(240,192,64,0.3)"
  ];

  let particles = [];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  // Crear 55 partículas aleatorias
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
      p.x += p.vx;
      p.y += p.vy;
      // Rebotar en bordes
      if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
    });
    requestAnimationFrame(draw);
  }
  draw();
}

// ─── 6. NAVBAR — efecto sombra al hacer scroll ────────────────────────────
function initNavbar() {
  const nav = document.querySelector(".navbar");
  if (!nav) return;
  window.addEventListener("scroll", () => {
    nav.style.boxShadow = window.scrollY > 50
      ? "0 4px 24px rgba(0,0,0,0.7)"
      : "none";
  });
}

// ─── 7. ACTUALIZAR CONTADORES en el Hero ──────────────────────────────────
function updateStats(count) {
  const totalEl = document.getElementById("totalEquipos");
  const libresEl = document.getElementById("cuposLibres");
  if (totalEl)  totalEl.textContent  = count;
  if (libresEl) libresEl.textContent = Math.max(0, MAX_TEAMS - count);
}

// ─── 8. CARGAR EQUIPOS en tiempo real (onSnapshot) ────────────────────────
function loadTeams() {
  const container = document.getElementById("teamsContainer");
  if (!container) return;

  // Consulta ordenada por fecha de creación
  const q = query(
    collection(db, COLLECTION),
    orderBy("timestamp", "asc")
  );

  // onSnapshot escucha cambios en tiempo real
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
    snapshot.forEach(doc => {
      container.appendChild(createTeamCard(doc.data(), idx++));
    });

  }, (error) => {
    console.error("Error al cargar equipos:", error);
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">⚠️</span>
        <p>Error al cargar equipos.</p>
        <p>Verifica tu configuración de Firebase.</p>
      </div>`;
  });
}

// ─── 9. CREAR TARJETA DE EQUIPO ───────────────────────────────────────────
function createTeamCard(data, num) {
  const card = document.createElement("div");
  card.className = "team-card";
  card.style.animationDelay = `${(num - 1) * 0.07}s`;

  const initials = data.teamName
    ? data.teamName.substring(0, 2).toUpperCase()
    : "??";

  const playerTags = (data.players || [])
    .map(p => `<span class="player-tag">⚔ ${escapeHtml(p)}</span>`)
    .join("");

  card.innerHTML = `
    <span class="team-num">#${String(num).padStart(2, "0")}</span>
    <div class="team-card-header">
      <div class="team-avatar">${escapeHtml(initials)}</div>
      <div>
        <div class="team-name">${escapeHtml(data.teamName || "")}</div>
        <div class="team-captain">👑 ${escapeHtml(data.captain || "")}</div>
      </div>
    </div>
    <div class="team-players">${playerTags}</div>`;

  return card;
}

// ─── 10. VALIDACIÓN DEL FORMULARIO ────────────────────────────────────────
function clearErrors() {
  document.querySelectorAll(".error-msg").forEach(el => (el.textContent = ""));
  document.querySelectorAll(".error-field").forEach(el => el.classList.remove("error-field"));
  const formError = document.getElementById("formError");
  if (formError) formError.style.display = "none";
}

function setFieldError(inputId, errId, msg) {
  const field = document.getElementById(inputId);
  const err   = document.getElementById(errId);
  if (field) field.classList.add("error-field");
  if (err)   err.textContent = msg;
}

function validateForm() {
  clearErrors();
  let valid = true;

  const teamName = document.getElementById("teamName")?.value.trim() || "";
  const captain  = document.getElementById("captain")?.value.trim()  || "";
  const contact  = document.getElementById("contact")?.value.trim()  || "";
  const playerInputs = Array.from(document.querySelectorAll(".player-input"));
  const players = playerInputs.map(i => i.value.trim());

  if (!teamName) {
    setFieldError("teamName", "err-teamName", "El nombre del equipo es obligatorio.");
    valid = false;
  } else if (teamName.length < 2) {
    setFieldError("teamName", "err-teamName", "El nombre debe tener al menos 2 caracteres.");
    valid = false;
  }

  if (!captain) {
    setFieldError("captain", "err-captain", "El nombre del capitán es obligatorio.");
    valid = false;
  }

  if (!contact) {
    setFieldError("contact", "err-contact", "El WhatsApp del capitán es obligatorio.");
    valid = false;
  } else if (!/^[\+]?[\d\s\-\(\)]{7,20}$/.test(contact)) {
    setFieldError("contact", "err-contact", "Ingresa un número de teléfono válido.");
    valid = false;
  }

  // Validar los 5 jugadores
  players.forEach((p, i) => {
    if (!p) {
      playerInputs[i].classList.add("error-field");
      const errEl = document.getElementById(`err-p${i}`);
      if (errEl) errEl.textContent = "Este jugador es obligatorio.";
      valid = false;
    }
  });

  if (!valid) return null;
  return { teamName, captain, contact, players };
}

// ─── 11. MOSTRAR / OCULTAR LOADER DEL BOTÓN ───────────────────────────────
function setLoading(isLoading) {
  const btn    = document.getElementById("submitBtn");
  const text   = document.getElementById("btnText");
  const loader = document.getElementById("btnLoader");
  if (!btn || !text || !loader) return;
  btn.disabled          = isLoading;
  text.style.display    = isLoading ? "none"   : "inline";
  loader.style.display  = isLoading ? "inline" : "none";
}

// ─── 12. MOSTRAR MENSAJE DE ERROR GENERAL ─────────────────────────────────
function showFormError(msg) {
  const el = document.getElementById("formError");
  if (!el) return;
  el.textContent    = msg;
  el.style.display  = "block";
}

// ─── 13. SUBMIT DEL FORMULARIO ────────────────────────────────────────────
async function handleSubmit(e) {
  e.preventDefault();

  // Paso 1: validar campos
  const data = validateForm();
  if (!data) return;

  setLoading(true);

  try {
    const ref = collection(db, COLLECTION);

    // Paso 2: verificar cupos disponibles
    const countSnap = await getCountFromServer(ref);
    const total = countSnap.data().count;

    if (total >= MAX_TEAMS) {
      showFormError("⚠️ Lo sentimos, todos los cupos están llenos.");
      setLoading(false);
      return;
    }

    // Paso 3: verificar nombre duplicado
    const dupQuery = query(ref, where("teamName", "==", data.teamName));
    const dupSnap  = await getDocs(dupQuery);

    if (!dupSnap.empty) {
      setFieldError("teamName", "err-teamName", "Ya existe un equipo con ese nombre.");
      setLoading(false);
      return;
    }

    // Paso 4: recolectar suplentes (opcionales)
    const subs = Array.from(document.querySelectorAll(".sub-input"))
      .map(i => i.value.trim())
      .filter(Boolean);

    // Paso 5: guardar en Firestore con addDoc
    await addDoc(ref, {
      teamName:  data.teamName,
      captain:   data.captain,
      contact:   data.contact,
      players:   data.players,
      subs:      subs,
      timestamp: serverTimestamp()   // ← serverTimestamp() importado modular
    });

    // Paso 6: mostrar pantalla de éxito
    const form    = document.getElementById("registroForm");
    const success = document.getElementById("formSuccess");
    if (form)    form.style.display    = "none";
    if (success) success.style.display = "block";

  } catch (err) {
    console.error("Error al guardar el equipo:", err);
    showFormError("❌ Error al guardar. Verifica tu configuración de Firebase.");
  } finally {
    setLoading(false);
  }
}

// ─── 14. RESETEAR FORMULARIO ──────────────────────────────────────────────
// Expuesta en window para que el botón "onclick" del HTML pueda llamarla
function resetForm() {
  const form    = document.getElementById("registroForm");
  const success = document.getElementById("formSuccess");
  if (form) {
    form.reset();
    form.style.display = "block";
  }
  if (success) success.style.display = "none";
  clearErrors();
}
window.resetForm = resetForm; // ← necesario porque app.js es type="module"

// ─── 15. UTILIDAD: escapar HTML para prevenir XSS ─────────────────────────
function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;")
    .replace(/'/g,  "&#039;");
}

// ─── 16. INICIALIZACIÓN AL CARGAR EL DOM ──────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  initParticles();
  initNavbar();
  loadTeams();

  const form = document.getElementById("registroForm");
  if (form) form.addEventListener("submit", handleSubmit);
});
