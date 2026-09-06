import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export const isFirebaseConfigured = Boolean(
  firebaseConfig && 
  firebaseConfig.projectId && 
  firebaseConfig.apiKey && 
  firebaseConfig.projectId !== ''
);

let app: any = null;
let auth: any = null;
let db: Firestore | null = null;
const googleProvider = new GoogleAuthProvider();

if (isFirebaseConfigured) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    const firestoreDbId = (firebaseConfig as any).firestoreDatabaseId;
    db = firestoreDbId && firestoreDbId !== '(default)'
      ? getFirestore(app, firestoreDbId)
      : getFirestore(app);
  } catch (err) {
    console.error('Firebase initialization error:', err);
  }
}

export { app, auth, db };

export function getOrCreateLocalUserId(): string {
  if (typeof window === 'undefined') return 'server_user';
  try {
    let id = localStorage.getItem('gifttogether_client_uid');
    if (!id) {
      id = 'u_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      localStorage.setItem('gifttogether_client_uid', id);
    }
    return id;
  } catch {
    return 'u_' + Math.random().toString(36).substring(2, 11);
  }
}

export function getCurrentUserId(): string {
  return auth?.currentUser?.uid || getOrCreateLocalUserId();
}

export async function signInWithGoogle(): Promise<User | null> {
  if (!auth) return null;
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err: any) {
    if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
      return null;
    }
    if (err.code === 'auth/unauthorized-domain') {
      console.warn(
        `Firebase Auth: Hostname "${typeof window !== 'undefined' ? window.location.hostname : ''}" is not authorized in Firebase Console -> Authentication -> Settings -> Authorized Domains. Seamlessly continuing in Guest/Organizer mode.`
      );
      return null;
    }
    console.warn('Google sign-in:', err?.message || err);
    return null;
  }
}

export async function logOut(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}

export async function ensureAnonymousAuth(): Promise<User | null> {
  if (!auth) return null;
  if (auth.currentUser) return auth.currentUser;
  
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (user) {
        resolve(user);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          resolve(cred.user);
        } catch (err: any) {
          // If anonymous authentication is disabled in Firebase console (auth/admin-restricted-operation),
          // handle gracefully without throwing or polluting console with errors.
          if (err?.code === 'auth/admin-restricted-operation') {
            resolve(null);
          } else {
            console.warn('Anonymous sign-in unavailable:', err?.message || err);
            resolve(null);
          }
        }
      }
    });
  });
}

