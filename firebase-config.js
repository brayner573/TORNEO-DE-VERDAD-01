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
  apiKey: "AIzaSyCK689qDC94UAo2fCqkeWU-z_Q3HD_yKEY",
  authDomain: "torneo-de-dotita.firebaseapp.com",
  projectId: "torneo-de-dotita",
  storageBucket: "torneo-de-dotita.firebasestorage.app",
  messagingSenderId: "958554768082",
  appId: "1:958554768082:web:fb613bce7b756bdd7da30b",
  measurementId: "G-RTVLG14J1Q"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Exportar referencia a Firestore
const db = firebase.firestore();
