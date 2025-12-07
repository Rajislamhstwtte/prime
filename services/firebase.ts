
import { initializeApp, FirebaseApp } from "firebase/app";
import { 
    getAuth, 
    Auth, 
    GoogleAuthProvider, 
    FacebookAuthProvider, 
    signInWithEmailAndPassword, 
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    User as FirebaseUser,
    NextOrObserver
} from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD6UtnFr763yJNxwOiSuVp1YLs4lfwszH0",
  authDomain: "stream-ea4c7.firebaseapp.com",
  projectId: "stream-ea4c7",
  storageBucket: "stream-ea4c7.appspot.com",
  messagingSenderId: "839497270782",
  appId: "1:839497270782:web:33bbafd9c5ad6019ddecaf"
};

// Initialize Firebase
const app: FirebaseApp = initializeApp(firebaseConfig);

// Export Auth and Firestore services
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

// Export Auth providers
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

// Add your app's domain for production
googleProvider.setCustomParameters({
  'hd': 'cineflix.dpdns.org'
});


/**
 * Translates Firebase error codes into user-friendly messages.
 * @param error - The FirebaseError object.
 * @returns A friendly error string.
 */
export const getFirebaseErrorMessage = (error: any): string => {
  if (error && error.code) {
    switch (error.code) {
      case 'auth/invalid-email':
        return 'The email address is not valid.';
      case 'auth/user-disabled':
        return 'This user account has been disabled.';
      case 'auth/user-not-found':
        return 'No user found with this email.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/email-already-in-use':
        return 'This email is already in use by another account.';
      case 'auth/weak-password':
        return 'The password is too weak.';
      case 'auth/popup-closed-by-user':
        return 'The sign-in window was closed. Please try again.';
      case 'auth/cancelled-popup-request':
          return 'Multiple sign-in windows were opened. Please try again.';
      default:
        return 'An unknown error occurred. Please try again later.';
    }
  }
  return 'An unexpected error occurred.';
};

// Wrapper for onAuthStateChanged to simplify usage in React components
export const onAuthChange = (callback: NextOrObserver<FirebaseUser | null>) => {
    return onAuthStateChanged(auth, callback);
};

export { 
    signInWithEmailAndPassword, 
    signInWithPopup, 
    signOut,
    type FirebaseUser
};
