import { useState } from 'react';
import { motion } from 'motion/react';
import { Bus, Ship, Navigation, CloudRain, MapPin } from 'lucide-react';
import { DriverLoginScreen } from './DriverLoginScreen';

interface LoginScreenProps {
  onLogin: () => void;
  onGuestLogin: (role: 'Passenger' | 'Driver', emailInput?: string) => void;
}

export function LoginScreen({ onLogin, onGuestLogin }: LoginScreenProps) {
  const [showDriverLogin, setShowDriverLogin] = useState(false);

  if (showDriverLogin) {
    return <DriverLoginScreen onGuestLogin={onGuestLogin} onBack={() => setShowDriverLogin(false)} />;
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-[#020617] overflow-hidden px-6 font-sans">
      {/* Background cinematic elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-full h-[500px] bg-gradient-to-bl from-brand-orange/20 via-brand-green/10 to-transparent blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-blue/10 rounded-full blur-[100px]" />
        {/* Simulating moving map elements in background */}
        <motion.div 
          animate={{ x: [0, -20, 0], y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
          className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_#ffffff_1px,_transparent_1.5px)] bg-[length:32px_32px]"
        />
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", type: 'spring', stiffness: 200 }}
          className="w-28 h-28 glass-panel rounded-[32px] flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.2)] mb-8 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-brand-orange/20 to-brand-green/20" />
          <MapPin className="w-12 h-12 text-white relative z-10 drop-shadow-lg" />
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl font-bold text-center tracking-tight text-white mb-4 font-display"
        >
          Kerala<span className="text-brand-orange">Connect</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-center text-slate-400 mb-14 font-medium px-4 text-lg"
        >
          Discover places, track live transit, and connect with the community.
        </motion.p>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          onClick={onLogin}
          className="relative group w-full py-4 rounded-full bg-white text-[#020617] font-bold text-lg overflow-hidden transition-all active:scale-[0.98] mb-4 shadow-xl hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
        >
          <span className="relative z-10 flex items-center justify-center gap-3">
            <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </span>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45 }}
          onClick={() => onGuestLogin('Passenger')}
          className="relative group w-full py-4 rounded-full bg-brand-green hover:bg-brand-green/90 text-[#020617] font-bold text-lg overflow-hidden transition-all active:scale-[0.98] mb-4 shadow-xl hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
        >
          <span className="relative z-10 flex items-center justify-center gap-3">
            <Navigation className="w-5 h-5 text-[#020617] rotate-45" />
            Guest Pass (Instant Sandbox Sign In)
          </span>
        </motion.button>
        
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          onClick={() => setShowDriverLogin(true)}
          className="relative group w-full py-4 rounded-full glass-card text-white font-bold text-lg overflow-hidden transition-all active:scale-[0.98] border border-white/10 hover:bg-slate-800/80 mb-4"
        >
          <span className="relative z-10 flex items-center justify-center gap-3">
            <Bus className="w-5 h-5 text-brand-green group-hover:text-white transition-colors" />
            Driver Portal Login
          </span>
        </motion.button>
      </div>

      {/* Decorative footer details */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.8 }}
        className="absolute bottom-8 flex gap-6 text-slate-500 text-sm font-medium"
      >
        <div className="flex items-center gap-2"><Bus className="w-4 h-4 text-brand-blue" /> Transit</div>
        <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-brand-orange" /> Discovery</div>
        <div className="flex items-center gap-2"><CloudRain className="w-4 h-4 text-brand-green" /> Weather</div>
      </motion.div>
    </div>
  );
}
