import { User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { LogOut, History, Bell, Navigation, Settings, HelpCircle, Shield, ChevronRight, Bus, Award, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { startDriverTracking, stopDriverTracking, trackingEngine } from '../lib/driverTracking';

export function ProfileScreen({ user, onNavigate }: { user: User, onNavigate?: (tab: string) => void }) {
  const [isDriving, setIsDriving] = useState(trackingEngine.isTracking);
  const [busId, setBusId] = useState(trackingEngine.activeBusId);
  const [routeNum, setRouteNum] = useState(trackingEngine.activeRouteNumber);
  const [routeName, setRouteName] = useState(trackingEngine.activeRouteName);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsub = trackingEngine.subscribe(() => {
      setIsDriving(trackingEngine.isTracking);
      if (trackingEngine.isTracking) {
        setBusId(trackingEngine.activeBusId);
        setRouteNum(trackingEngine.activeRouteNumber);
        setRouteName(trackingEngine.activeRouteName);
      }
    });
    return unsub;
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('keralaconnect_guest_user');
    auth.signOut().catch(console.error);
    window.location.reload();
  };

  const toggleDriverMode = async () => {
    if (isDriving) {
      stopDriverTracking(busId || `drvr-${user.uid.substring(0, 5)}`);
      setIsDriving(false);
      setErrorMsg(null);
    } else {
      if (!busId || !routeNum || !routeName) {
        setErrorMsg("Please enter Vehicle ID, Route Number, and Route Name to start broadcasting.");
        return;
      }
      setErrorMsg(null);
      await startDriverTracking(busId, routeName, routeNum);
      setIsDriving(true);
    }
  };

  const menuItems = [
    { id: 'rewards', icon: Award, label: 'Achievements & Details', accent: 'text-brand-orange', bg: 'bg-brand-orange/10' },
    { id: 'history', icon: History, label: 'Travel History', accent: 'text-brand-blue', bg: 'bg-brand-blue/10' },
    { id: 'notifications', icon: Bell, label: 'Notification Settings', accent: 'text-slate-300', bg: 'bg-slate-800' },
    { id: 'privacy', icon: Shield, label: 'Privacy & Security', accent: 'text-slate-300', bg: 'bg-slate-800' },
    { id: 'help', icon: HelpCircle, label: 'Help & Support', accent: 'text-slate-300', bg: 'bg-slate-800' },
  ];

  return (
    <div className="pt-16 px-6 pb-32 h-full overflow-y-auto relative scroll-smooth font-sans">
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-brand-blue/10 via-brand-green/5 to-transparent pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold tracking-tight mb-2 font-display text-white">Profile</h1>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
        className="flex items-center gap-5 mb-10 glass-panel p-6 shadow-xl"
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt="Profile" className="w-24 h-24 rounded-full border-4 border-slate-800 shadow-[0_0_20px_rgba(14,165,233,0.3)] object-cover" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center text-4xl shadow-lg shadow-[0_0_20px_rgba(16,185,129,0.3)]">👤</div>
        )}
        <div>
          <h2 className="text-2xl font-bold mb-1 font-display text-white">{user.displayName || "Explorer"}</h2>
          <p className="text-sm text-slate-400 font-medium mb-3">{user.email}</p>
          <div className="text-xs font-bold font-mono bg-brand-green/20 text-brand-green px-3 py-1.5 rounded-lg inline-block border border-brand-green/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
            Verified User
          </div>
        </div>
      </motion.div>

      {/* Driver Mode Section */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className={`mb-10 p-6 rounded-[32px] border backdrop-blur-3xl transition-all duration-500 shadow-xl relative overflow-hidden ${isDriving ? 'bg-brand-blue/10 border-brand-blue/40 shadow-[0_0_30px_rgba(14,165,233,0.15)]' : 'glass-card'}`}
      >
        {isDriving && <div className="absolute top-0 right-0 w-48 h-48 bg-brand-blue/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>}

        <div className="flex items-center gap-4 mb-5 relative z-10">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${isDriving ? 'bg-brand-blue text-[#020617] shadow-[0_0_20px_rgba(14,165,233,0.5)]' : 'bg-slate-800 text-slate-400 shadow-inner'}`}>
            <Bus className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl font-bold font-display text-white">Driver Mode</h3>
            <p className="text-sm text-slate-400 font-medium">{isDriving ? 'Actively sharing live location' : 'Broadcast your location to passengers'}</p>
          </div>
        </div>

        <AnimatePresence>
          {!isDriving && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-3 mb-6 overflow-hidden relative z-10">
              <input 
                type="text" placeholder="Vehicle ID (e.g. KL-07-AW-1234)" value={busId} onChange={e => setBusId(e.target.value)}
                className="w-full glass-card border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-blue/60 focus:bg-slate-800/80 transition-all font-medium"
              />
              <input 
                type="text" placeholder="Route Number (e.g. KSRTC-01)" value={routeNum} onChange={e => setRouteNum(e.target.value)}
                className="w-full glass-card border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-blue/60 focus:bg-slate-800/80 transition-all font-medium"
              />
              <input 
                type="text" placeholder="Route Name (e.g. Aluva - Vyttila)" value={routeName} onChange={e => setRouteName(e.target.value)}
                className="w-full glass-card border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-blue/60 focus:bg-slate-800/80 transition-all font-medium"
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-500/15 border border-red-500/30 text-red-400 p-4 rounded-xl text-xs font-bold mb-4 relative z-10"
            >
              ⚠️ {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={toggleDriverMode}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition-all active:scale-[0.98] relative z-10 ${isDriving ? 'bg-red-500 hover:bg-red-400 text-[#020617] shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-brand-blue hover:bg-brand-blue/90 text-[#020617] shadow-[0_0_20px_rgba(14,165,233,0.4)]'}`}
        >
          {isDriving ? 'STOP TRIP & TRACKING' : 'START LIVE TRIP'}
        </button>
      </motion.div>
      
      <div className="space-y-4 relative z-10">
        <h3 className="text-xl font-bold text-white mb-5 px-1 font-display">Account</h3>
        {menuItems.map((item, index) => (
          <motion.div 
            key={item.label}
            onClick={() => {
              if (item.id === 'rewards' && onNavigate) onNavigate('rewards');
            }}
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + (index * 0.05) }}
            className="glass-card rounded-[24px] p-4 flex justify-between items-center cursor-pointer hover:bg-slate-800/80 transition-all group shadow-sm"
          >
             <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl ${item.bg} flex items-center justify-center transition-colors shadow-inner`}>
                  <item.icon className={`w-5 h-5 ${item.accent}`} />
                </div>
                <span className="font-bold text-slate-200 group-hover:text-white transition-colors">{item.label}</span>
             </div>
             <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-brand-blue transition-colors" />
          </motion.div>
        ))}
      </div>

      <motion.button 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        onClick={handleLogout} 
        className="mt-12 flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-red-500/10 text-red-500 font-bold text-lg border border-red-500/20 active:scale-[0.98] hover:bg-red-500/20 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] transition-all group"
      >
        <LogOut className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
        Log Out
      </motion.button>
    </div>
  );
}
