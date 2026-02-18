import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User, 
  onAuthStateChanged,
  Auth
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  query, 
  orderBy, 
  limit, 
  getDocs,
  addDoc,
  updateDoc,
  increment,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  Firestore
} from 'firebase/firestore';
import { UserProfile, Scenario } from '../types';

// Configuration
// In a real app, these would come from process.env
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

// Initialize conditionally
const isFirebaseConfigured = !!firebaseConfig.apiKey;

if (isFirebaseConfigured && getApps().length === 0) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (e) {
    console.error("Firebase Initialization Error:", e);
  }
}

// --- Auth Services ---

export const loginWithGoogle = async (): Promise<User | null> => {
  if (!auth) throw new Error("Firebase not configured");
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Login failed", error);
    throw error;
  }
};

export const logoutUser = async () => {
  if (!auth) return;
  await signOut(auth);
};

export const subscribeToAuth = (callback: (user: User | null) => void) => {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

// --- Firestore Services ---

// 1. User Profile Sync
export const syncProfileToCloud = async (user: User, profile: UserProfile) => {
  if (!db) return;
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      ...profile,
      displayName: user.displayName,
      photoURL: user.photoURL,
      lastActive: serverTimestamp()
    }, { merge: true });
  } catch (e) {
    console.error("Failed to sync profile", e);
  }
};

export const getProfileFromCloud = async (uid: string): Promise<UserProfile | null> => {
  if (!db) return null;
  try {
    const docRef = doc(db, 'users', uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
  } catch (e) {
    console.error("Failed to fetch profile", e);
  }
  return null;
};

// 2. Leaderboard
export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  photoURL: string;
  xp: number;
  level: number;
  title: string;
  battlesWon: number;
}

export const getGlobalLeaderboard = async (limitCount = 50): Promise<LeaderboardEntry[]> => {
  if (!db) return []; // Fallback for no config
  
  // Mock data if no DB connected in dev but requested
  if (!isFirebaseConfigured) return []; 

  try {
    const q = query(
      collection(db, 'users'), 
      orderBy('xp', 'desc'), 
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({
      uid: d.id,
      ...d.data()
    } as LeaderboardEntry));
  } catch (e) {
    console.error("Leaderboard fetch failed", e);
    return [];
  }
};

// 3. Community Scenarios
export interface CommunityScenario extends Scenario {
  authorId: string;
  authorName: string;
  createdAt: any;
  downloads: number;
  likes: number;
  likedBy?: string[]; // Array of UIDs
}

export const shareScenarioToCommunity = async (user: User, scenario: Scenario) => {
  if (!db) throw new Error("Offline Mode");
  
  await addDoc(collection(db, 'community_scenarios'), {
    ...scenario,
    authorId: user.uid,
    authorName: user.displayName,
    createdAt: serverTimestamp(),
    downloads: 0,
    likes: 0,
    likedBy: []
  });
};

export const getCommunityScenarios = async (limitCount = 20): Promise<CommunityScenario[]> => {
  if (!db) return [];
  
  try {
    const q = query(
      collection(db, 'community_scenarios'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as CommunityScenario));
  } catch (e) {
    console.error("Failed to fetch community scenarios", e);
    return [];
  }
};

// Toggle Like (Transaction-safe ideally, but simple update here for MVP)
export const toggleScenarioLike = async (user: User, scenarioId: string, isLiked: boolean) => {
  if (!db) return;
  
  const scenarioRef = doc(db, 'community_scenarios', scenarioId);
  
  try {
    await updateDoc(scenarioRef, {
      likes: increment(isLiked ? -1 : 1),
      likedBy: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
    });
  } catch (e) {
    console.error("Failed to toggle like", e);
    throw e;
  }
};

export const incrementScenarioDownload = async (scenarioId: string) => {
   if (!db) return;
   try {
     const scenarioRef = doc(db, 'community_scenarios', scenarioId);
     await updateDoc(scenarioRef, {
       downloads: increment(1)
     });
   } catch(e) {
     console.error("Failed to increment download", e);
   }
}

export { auth, db, isFirebaseConfigured };