
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { User } from "../types";

/**
 * Creates a user profile document in Firestore if it doesn't already exist.
 * This is typically called after a user signs up or logs in for the first time.
 * @param user - The user object from Firebase Auth.
 */
export const createUserProfile = async (user: User): Promise<void> => {
  const userRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    // User profile doesn't exist, so create it
    try {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Guest',
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
        xp: 0, // Initialize XP tracking
        level: 1,
      });
      console.log("User profile created in Firestore for:", user.uid);
    } catch (error) {
      console.error("Error creating user profile in Firestore:", error);
    }
  }
};
