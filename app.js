// =====================================================
// app.js — Lógica principal del torneo Dota 2
// =====================================================

const WHATSAPP_URL = "https://chat.whatsapp.com/EDLgOCOg7dACXYFtHRhDIu?mode=gi_t";
const MAX_TEAMS = 16;
const COLLECTION = "equipos"; // Nombre de la colección en Firestore

// ─── PARTICLES BACKGROUND ─────────────────────────────────────────────────────
(function initParticles() {
  const canvas = document.getElementById("particles");
  const ctx    = canvas.getContext("2d");
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
  nav.style.boxShadow = window.scrollY > 50
    ? "0 4px 24px rgba(0,0,0,0.7)"
    : "none";
});


// ─── CONTADOR DE EQUIPOS (Firestore en tiempo real) ──────────────────────────
function updateStats(count) {
  const libre = Math.max(0, MAX_TEAMS - count);
  document.getElementById("totalEquipos").textContent = count;
  document.getElementById("cuposLibres").textContent  = libre;
}


// ─── CARGAR EQUIPOS ───────────────────────────────────────────────────────────
function loadTeams() {
  const container = document.getElementById("teamsContainer");

  // Escuchar en tiempo real
  db.collection(COLLECTION)
    .orderBy("timestamp", "asc")
    .onSnapshot(snapshot => {
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
        const d = doc.data();
        container.appendChild(createTeamCard(d, idx++));
      });
    }, err => {
      console.error("Error cargando equipos:", err);
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">⚠️</span>
          <p>Error al cargar equipos. Revisa la configuración de Firebase.</p>
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

  // Jugadores como tags
  const playerTags = (data.players || [])
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
  document.getElementById("formError").style.display = "none";
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

  const teamName = document.getElementById("teamName").value.trim();
  const captain  = document.getElementById("captain").value.trim();
  const contact  = document.getElementById("contact").value.trim();
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
  players.forEach((p, i) => {
    if (!p) {
      const playerInputs = document.querySelectorAll(".player-input");
      playerInputs[i].classList.add("error-field");
      document.getElementById(`err-p${i}`).textContent = "Campo requerido.";
      valid = false;
    }
  });

  return valid
    ? { teamName, captain, contact, players }
    : null;
}


// ─── SUBMIT FORMULARIO ────────────────────────────────────────────────────────
document.getElementById("registroForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = validateForm();
  if (!data) return;

  // Verificar cupos disponibles
  const snap = await db.collection(COLLECTION).get();
  if (snap.size >= MAX_TEAMS) {
    const errEl = document.getElementById("formError");
    errEl.textContent = "⚠ Lo sentimos, todos los cupos están llenos.";
    errEl.style.display = "block";
    return;
  }

  // Verificar que el nombre no esté repetido
  const dup = await db.collection(COLLECTION)
    .where("teamName", "==", data.teamName)
    .get();
  if (!dup.empty) {
    setError("teamName", "err-teamName", "Ya existe un equipo con ese nombre.");
    return;
  }

  // Mostrar loader
  document.getElementById("btnText").style.display   = "none";
  document.getElementById("btnLoader").style.display = "inline";
  document.getElementById("submitBtn").disabled      = true;

  // Suplentes
  const subs = Array.from(document.querySelectorAll(".sub-input"))
                    .map(i => i.value.trim())
                    .filter(Boolean);

  try {
    await db.collection(COLLECTION).add({
      teamName:  data.teamName,
      captain:   data.captain,
      contact:   data.contact,
      players:   data.players,
      subs:      subs,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Mostrar éxito
    document.getElementById("registroForm").style.display = "none";
    document.getElementById("formSuccess").style.display  = "block";

  } catch (err) {
    console.error("Error al guardar:", err);
    const errEl = document.getElementById("formError");
    errEl.textContent = "❌ Error al guardar. Revisa la conexión y la configuración de Firebase.";
    errEl.style.display = "block";
  } finally {
    document.getElementById("btnText").style.display   = "inline";
    document.getElementById("btnLoader").style.display = "none";
    document.getElementById("submitBtn").disabled      = false;
  }
});


// ─── RESETEAR FORMULARIO ──────────────────────────────────────────────────────
function resetForm() {
  document.getElementById("registroForm").reset();
  document.getElementById("registroForm").style.display = "block";
  document.getElementById("formSuccess").style.display  = "none";
  clearErrors();
}


// ─── UTILIDADES ───────────────────────────────────────────────────────────────
function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}


// ─── INICIALIZAR ──────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  loadTeams();
});
