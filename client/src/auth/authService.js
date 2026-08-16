import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from './firebase';

// Mock session state for developer mode bypass
let devUser = null;
let devCallback = null;

export const loginWithGoogle = () => {
  if (!isFirebaseConfigured) {
    devUser = { email: 'dev-bypass@codescope.local', displayName: 'Developer (Bypass)' };
    if (devCallback) devCallback(devUser);
    return Promise.resolve(devUser);
  }
  return signInWithPopup(auth, googleProvider);
};

export const loginWithEmail = (email, password) => {
  if (!isFirebaseConfigured) {
    devUser = { email, displayName: 'Developer (Bypass)' };
    if (devCallback) devCallback(devUser);
    return Promise.resolve(devUser);
  }
  return signInWithEmailAndPassword(auth, email, password);
};

export const registerWithEmail = (email, password) => {
  if (!isFirebaseConfigured) {
    devUser = { email, displayName: 'Developer (Bypass)' };
    if (devCallback) devCallback(devUser);
    return Promise.resolve(devUser);
  }
  return createUserWithEmailAndPassword(auth, email, password);
};

export const logout = () => {
  if (!isFirebaseConfigured) {
    devUser = null;
    if (devCallback) devCallback(null);
    return Promise.resolve();
  }
  return signOut(auth);
};

export const subscribeToAuthChanges = (callback) => {
  if (!isFirebaseConfigured) {
    devCallback = callback;
    // Trigger immediately in next tick to avoid React render cycles
    setTimeout(() => callback(devUser), 0);
    return () => { devCallback = null; };
  }
  return onAuthStateChanged(auth, callback);
};
export { isFirebaseConfigured };
