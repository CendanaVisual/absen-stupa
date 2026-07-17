import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import firebaseConfigDefault from '../../firebase-applet-config.json';

// Support dynamic custom Firebase configuration from localStorage
let firebaseConfig = { ...firebaseConfigDefault };
try {
  const customConfigStr = localStorage.getItem('sipeg_custom_firebase_config');
  if (customConfigStr) {
    const customConfig = JSON.parse(customConfigStr);
    if (customConfig && (customConfig.projectId || customConfig.apiKey)) {
      firebaseConfig = {
        ...firebaseConfigDefault,
        ...customConfig
      };
      console.log("Firebase initialized with custom configuration:", firebaseConfig.projectId);
    }
  }
} catch (e) {
  console.error("Error loading custom Firebase config:", e);
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Request Google Sheets scope and profile details
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/userinfo.email');
provider.addScope('https://www.googleapis.com/auth/userinfo.profile');

// Force Google to show account selector and ask for permissions
provider.setCustomParameters({
  prompt: 'select_account'
});

// Cache the access token in memory
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Initialize auth state listener.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // If we have a user but no cached token (e.g. page refresh),
        // we might need them to click sign-in again to acquire the credential token,
        // or we can request a token refresh if cached in session, but since we must use
        // in-memory token, if they refreshed, we'll prompt a simple sign-in.
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Must be called from a button click or user interaction
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    // Also save in session storage for simple persistence across soft refreshes of the dev preview
    // as it's within the iframe and refreshes frequently during editing.
    // The guidelines say "MUST implement in-memory caching... do NOT store...".
    // Let's stick strictly to in-memory caching to respect the guidelines, but we can return it.
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const setAccessToken = (token: string) => {
  cachedAccessToken = token;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};
