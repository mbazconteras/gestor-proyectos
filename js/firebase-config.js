// Firebase principal: Usuarios + Registros
const firebaseConfig = {
  apiKey: "AIzaSyBoJkBH9a4ErOR4dxH46TBMRlyqa60qBpY",
  authDomain: "planingtable.firebaseapp.com",
  databaseURL: "https://planingtable-default-rtdb.firebaseio.com",
  projectId: "planingtable",
  storageBucket: "planingtable.firebasestorage.app",
  messagingSenderId: "798160298440",
  appId: "1:798160298440:web:4ce04d553eef9fb0b2e0fd"
};

// Firebase secundario: catálogo QEHSClients
const firebaseConfigClientes = {
  apiKey: "AIzaSyD1c8rpNJ3ZcOhSA3PqmFazcMbPEl-spxQ",
  authDomain: "qehs-fa6c4.firebaseapp.com",
  databaseURL: "https://qehs-fa6c4-default-rtdb.firebaseio.com",
  projectId: "qehs-fa6c4",
  storageBucket: "qehs-fa6c4.firebasestorage.app",
  messagingSenderId: "615078736242",
  appId: "1:615078736242:web:2cff995e64f74093b36deb"
};

// App principal
firebase.initializeApp(firebaseConfig);
window.database = firebase.database();

// App secundaria con nombre
const clientesApp = firebase.initializeApp(firebaseConfigClientes, "clientesApp");
window.databaseClientes = clientesApp.database();
