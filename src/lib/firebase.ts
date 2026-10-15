import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import config from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(config) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

let firestoreDb;
try {
  firestoreDb = config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)'
    ? initializeFirestore(app, { ignoreUndefinedProperties: true }, config.firestoreDatabaseId)
    : initializeFirestore(app, { ignoreUndefinedProperties: true });
} catch {
  firestoreDb = config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)'
    ? getFirestore(app, config.firestoreDatabaseId)
    : getFirestore(app);
}

export const db = firestoreDb;

export default app;
