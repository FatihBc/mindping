import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  deleteUser,
  updateProfile,
  onAuthStateChanged,
  signOut,
  reload,
  type User as FirebaseUser
} from 'firebase/auth';
import { auth } from './firebase';

// Register new user
export async function registerUser(email: string, password: string, displayName: string) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update profile with display name
    await updateProfile(user, { displayName });
    
    // Send email verification
    await sendEmailVerification(user);
    
    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.message, code: error.code };
  }
}

// Login existing user
export async function loginUser(email: string, password: string) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Check if email is verified
    if (!user.emailVerified) {
      return { 
        success: false, 
        error: 'Email not verified. Please check your inbox and verify your email.',
        needsVerification: true 
      };
    }
    
    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.message, code: error.code };
  }
}

// Resend email verification
export async function resendEmailVerification(user: FirebaseUser) {
  try {
    await sendEmailVerification(user);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Check email verification status
export async function checkEmailVerification(user: FirebaseUser) {
  try {
    await reload(user);
    return { verified: user.emailVerified };
  } catch (error: any) {
    return { verified: false, error: error.message };
  }
}

// Delete user account
export async function deleteUserAccount(user: FirebaseUser) {
  try {
    await deleteUser(user);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Logout
export async function logoutUser() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Auth state listener
export function onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// Get current user
export function getCurrentAuthUser() {
  return auth.currentUser;
}
