import { useState, useEffect } from 'react';
import { BottomNav } from './components/BottomNav';
import { Home } from './screens/Home';
import { LiveMapScreen } from './screens/LiveMapScreen';
import { RoutesScreen } from './screens/RoutesScreen';
import { CommunityScreen } from './screens/CommunityScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { RewardsScreen } from './screens/RewardsScreen';
import { LoginScreen } from './screens/LoginScreen';
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User, signInAnonymously } from 'firebase/auth';
import { auth } from './lib/firebase';
import { seedDatabase } from './lib/seed';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // We do NOT set isAuthReady immediately here anymore, to avoid Firestore queries running before Firebase Auth initializes.

    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        if (u.isAnonymous) {
          // It's a guest user, try to load from localStorage if we didn't just set it manually
          const currentSavedGuest = localStorage.getItem('keralaconnect_guest_user');
          if (currentSavedGuest) {
             try {
               setUser({ ...JSON.parse(currentSavedGuest), uid: u.uid }); // Ensure we use the actual Firebase anonymous UID
             } catch (e) {
               setUser(u);
             }
          } else {
             setUser(u);
          }
        } else {
          setUser(u);
          // Clear local storage guest session if real user is active
          localStorage.removeItem('keralaconnect_guest_user');
        }
        setIsAuthReady(true);
        seedDatabase().catch(console.error);
      } else {
        // Not signed in to Firebase.
        setUser(null);
        setIsAuthReady(true);
      }
    });

    return () => unsub();
  }, []);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.warn("Google Sign-In popup failed or blocked. Activating Guest Bypass Mode:", error);
      // Fallback: seamless guest sign-in
      handleGuestLogin('Passenger');
    }
  };

  const handleGuestLogin = async (role: 'Passenger' | 'Driver', emailInput?: string) => {
    try {
      const cred = await signInAnonymously(auth);
      const isDriver = role === 'Driver';
      const guestUser = {
        uid: cred.user.uid,
        displayName: isDriver ? (emailInput ? emailInput.split('@')[0] : "KSRTC Driver") : "Munnar Explorer",
        email: emailInput || (isDriver ? "ksrtc-driver@keralaconnect.local" : "explorer@keralaconnect.local"),
        photoURL: isDriver 
          ? "https://images.unsplash.com/photo-1542156822-6924d1a71aba?auto=format&fit=crop&q=80&w=200"
          : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
      };
      localStorage.setItem('keralaconnect_guest_user', JSON.stringify(guestUser));
      setUser(guestUser);
      seedDatabase().catch(console.error);
    } catch (e) {
      console.error("Failed to sign in anonymously", e);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="flex bg-[#f8fafc] h-screen w-screen items-center justify-center">
         <Loader2 className="w-10 h-10 animate-spin text-brand-blue" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} onGuestLogin={handleGuestLogin} />;
  }

  return (
    <div className="bg-[#f8fafc] w-full h-full text-slate-900 relative overflow-hidden flex flex-col font-sans">
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div key="home" className="absolute inset-0" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: 0.2 }}>
              <Home onNavigate={setActiveTab} />
            </motion.div>
          )}
          {activeTab === 'map' && (
            <motion.div key="map" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <LiveMapScreen />
            </motion.div>
          )}
          {activeTab === 'routes' && (
            <motion.div key="routes" className="absolute inset-0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <RoutesScreen onNavigate={setActiveTab} />
            </motion.div>
          )}
          {activeTab === 'alerts' && (
            <motion.div key="alerts" className="absolute inset-0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <CommunityScreen />
            </motion.div>
          )}
          {activeTab === 'profile' && (
            <motion.div key="profile" className="absolute inset-0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <ProfileScreen user={user} onNavigate={setActiveTab} />
            </motion.div>
          )}
          {activeTab === 'rewards' && (
            <motion.div key="rewards" className="absolute inset-0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <RewardsScreen onNavigate={setActiveTab} user={user} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
    </div>
  );
}
