import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDMD92-W9ZOnLKbXiCiCeO4mTyFxGbTtNw",
  authDomain: "badriyya-school-erp.firebaseapp.com",
  projectId: "badriyya-school-erp",
  storageBucket: "badriyya-school-erp.firebasestorage.app",
  messagingSenderId: "25948473103",
  appId: "1:25948473103:web:9510fb2444924fac6ba07a",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);