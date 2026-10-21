// Live sharing runs on Firebase Cloud Firestore. It is switched on only when
// the build has a Firebase config (see README → "Live sharing setup").

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

/** "host:port" of a local Firestore emulator, for tests. */
export const emulatorHost = import.meta.env.VITE_FIRESTORE_EMULATOR as string | undefined;

export const cloudEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
