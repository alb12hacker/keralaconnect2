import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { motion } from 'motion/react';
import { Bus, ArrowLeft, Loader2, Navigation2 } from 'lucide-react';

interface DriverLoginScreenProps {
  onBack: () => void;
  onGuestLogin: (role: 'Passenger' | 'Driver', emailInput?: string) => void;
}

export function DriverLoginScreen({ onBack, onGuestLogin }: DriverLoginScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.warn("Driver Firebase auth failed, attempting Sandbox Driver fallback: ", err);
      onGuestLogin('Driver', email);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-[#020617] overflow-hidden px-6 font-sans">
      {/* Background cinematic elements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-full h-[500px] bg-gradient-to-bl from-brand-blue/20 via-brand-green/10 to-transparent blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-orange/5 rounded-full blur-[100px]" />
        <motion.div 
          animate={{ x: [0, -20, 0], y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
          className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_#ffffff_1px,_transparent_1.5px)] bg-[length:32px_32px]"
        />
      </div>

      <button 
        onClick={onBack}
        className="absolute top-12 left-6 z-20 text-slate-400 hover:text-white flex items-center gap-2 p-2 glass-panel rounded-full shadow-lg transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut", type: 'spring', stiffness: 200 }}
          className="w-28 h-28 glass-panel rounded-[32px] flex items-center justify-center mb-8 relative overflow-hidden shadow-[0_0_50px_rgba(14,165,233,0.2)]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/20 to-brand-green/20" />
          <Navigation2 className="w-12 h-12 text-white relative z-10 drop-shadow-lg" />
        </motion.div>

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, delay: 0.1 }}
           className="text-center mb-10"
        >
          <h1 className="text-4xl font-bold tracking-tight text-white mb-2 font-display">
            Driver <span className="text-brand-blue">Portal</span>
          </h1>
          <p className="text-slate-400 font-medium">
            {isLogin ? "Sign in to start broadcasting your location" : "Register as a live transit partner"}
          </p>
        </motion.div>

        <motion.form 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          onSubmit={handleSubmit}
          className="w-full space-y-5"
        >
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-2xl text-sm font-medium shadow-inner">
              {error}
            </div>
          )}
          
          <input 
            type="email" 
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Driver Email"
            className="w-full glass-card border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-blue/50 focus:bg-slate-800/80 transition-all font-medium shadow-inner"
            required
          />
          <input 
            type="password" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full glass-card border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-blue/50 focus:bg-slate-800/80 transition-all font-medium shadow-inner"
            required
          />
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-full bg-brand-blue hover:bg-brand-blue/90 text-[#020617] font-bold text-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center shadow-[0_0_20px_rgba(14,165,233,0.3)] hover:shadow-[0_0_30px_rgba(14,165,233,0.5)]"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin text-[#020617]" /> : (isLogin ? "Start Broadcasting" : "Register Account")}
          </button>
        </motion.form>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          onClick={() => setIsLogin(!isLogin)}
          className="mt-8 text-slate-400 hover:text-white transition-colors text-sm font-bold tracking-wide block"
        >
          {isLogin ? "Need a driver account? Register" : "Already have an account? Sign in"}
        </motion.button>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          onClick={() => onGuestLogin('Driver', "ksrtc-vip-driver@keralaconnect.local")}
          className="mt-4 text-brand-green/80 hover:text-brand-green transition-colors text-sm font-bold tracking-wide block"
        >
          ⚡ Instant Driver Sandbox Sign In
        </motion.button>
      </div>
    </div>
  );
}
