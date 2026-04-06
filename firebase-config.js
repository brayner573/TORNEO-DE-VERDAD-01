// =====================================================
// firebase-config.js — Configura tu proyecto Firebase
// =====================================================
// INSTRUCCIONES:
// 1. Ve a https://console.firebase.google.com/
// 2. Crea un proyecto nuevo (ej: "dota2-torneo")
// 3. Haz clic en "Web" (</>), registra la app
// 4. Copia tu firebaseConfig y reemplaza los valores de abajo
// 5. En Firebase Console → Firestore Database → Crear base de datos
//    Elige "Modo de prueba" para empezar fácilmente
// =====================================================

const firebaseConfig = {
  apiKey:            "TU_API_KEY_AQUI",
  authDomain:        "TU_PROYECTO.firebaseapp.com",
  projectId:         "TU_PROYECTO_ID",
  storageBucket:     "TU_PROYECTO.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId:             "TU_APP_ID"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Exportar referencia a Firestore
const db = firebase.firestore();
