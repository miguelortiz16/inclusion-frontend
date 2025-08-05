import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail as _sendPasswordResetEmail,
  sendEmailVerification
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCwFS17kdAKLuis0V5pnlahKf8C5VMB23w",
  authDomain: "inclusion-planner.firebaseapp.com",
  projectId: "inclusion-planner",
  storageBucket: "inclusion-planner.firebasestorage.app",
  messagingSenderId: "914122247934",
  appId: "1:914122247934:web:482c5d145b1ea17edc1faf"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Configurar el proveedor de Google
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Configurar el proveedor de Facebook
const facebookProvider = new FacebookAuthProvider();
facebookProvider.addScope('email');
facebookProvider.addScope('public_profile');

// Configurar el dominio autorizado
if (typeof window !== 'undefined') {
  const domain = window.location.origin;
  googleProvider.addScope('email');
  googleProvider.addScope('profile');
}

export {
  auth,
  googleProvider,
  facebookProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  _sendPasswordResetEmail as sendPasswordResetEmail,
  sendEmailVerification
}; 