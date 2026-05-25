import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'motion/react';
import { ArrowLeft, Shield, Map, Target, Award, CloudRain, Star, ShieldCheck, ChevronRight, Plus, Zap, Moon, Flame, Lock, Check, Sparkles } from 'lucide-react';
import { User } from 'firebase/auth';
import { useEffect, useState } from 'react';

import { RewardToast, ToastMessage } from '../components/RewardToast';

export function RewardsScreen({ onNavigate, user }: { onNavigate: (tab: string) => void, user: User }) {
  const [baseKCP, setBaseKCP] = useState(1240);
  const [pointsAdded, setPointsAdded] = useState(0);
  const [lifetimeKCP, setLifetimeKCP] = useState(1240); // Tracks total points without deductions
  const [unlockedFeatures, setUnlockedFeatures] = useState<string[]>(['night_mode']);
  
  const totalKCP = baseKCP + pointsAdded;
  const nextLevelKCP = 2000;
  const progress = (totalKCP / nextLevelKCP) * 100;

  const dailyMilestone = 200;
  const initialDailyKCP = 120;
  const currentDailyKCP = initialDailyKCP + pointsAdded;
  const dailyTargetReached = currentDailyKCP >= dailyMilestone;

  const countValue = useMotionValue(0);
  const roundedCount = useTransform(countValue, Math.round);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const animation = animate(countValue, totalKCP, { 
      duration: 1.5, 
      ease: [0.16, 1, 0.3, 1] // Custom refined ease-out
    });
    return animation.stop;
  }, [totalKCP]);

  const simulateAddPoints = () => {
    const earned = 50;
    setPointsAdded(prev => prev + earned);
    setLifetimeKCP(prev => prev + earned);
    
    showToast(`Traffic report verified`, earned, 'earn');
  };

  const showToast = (title: string, amount: number, type: 'earn' | 'spend' = 'earn') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, points: amount, title, type }]);
  };

  const handleDismissToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleUnlock = (featureId: string, cost: number) => {
    if (totalKCP >= cost && !unlockedFeatures.includes(featureId)) {
      setBaseKCP(prev => prev - cost);
      setUnlockedFeatures(prev => [...prev, featureId]);
      showToast(`Feature unlocked`, cost, 'spend');
    }
  };

  const badges = [
    { id: 1, name: 'Monsoon Navigator', req: 500, icon: CloudRain, color: 'text-brand-blue', bg: 'bg-brand-blue/10', border: 'border-brand-blue/20' },
    { id: 2, name: 'Traffic Reporter', req: 1000, icon: ShieldCheck, color: 'text-brand-orange', bg: 'bg-brand-orange/10', border: 'border-brand-orange/20' },
    { id: 3, name: 'Route Optimizer', req: 1300, icon: Map, color: 'text-brand-green', bg: 'bg-brand-green/10', border: 'border-brand-green/20' },
    { id: 4, name: 'Local Legend', req: 2000, icon: Award, color: 'text-brand-blue', bg: 'bg-brand-blue/10', border: 'border-brand-blue/20' },
    { id: 5, name: 'Daily Consistency', req: 999999, icon: Flame, color: 'text-amber-500', bg: 'bg-amber-100', border: 'border-amber-200' },
  ];

  const [earnedBadges, setEarnedBadges] = useState<number[]>(() => {
    return badges.filter(b => b.req <= 1240).map(b => b.id);
  });
  const [newlyEarnedBadges, setNewlyEarnedBadges] = useState<number[]>([]);

  useEffect(() => {
    const newEarns: number[] = [];
    badges.forEach(badge => {
      if (lifetimeKCP >= badge.req && !earnedBadges.includes(badge.id)) {
        newEarns.push(badge.id);
        showToast(`New Badge: ${badge.name}`, 0, 'earn');
      }
    });

    if (newEarns.length > 0) {
      setEarnedBadges(prev => [...prev, ...newEarns]);
      setNewlyEarnedBadges(prev => [...prev, ...newEarns]);
      
      // Remove from newlyEarnedBadges after animation completes so it doesn't replay
      setTimeout(() => {
        setNewlyEarnedBadges(prev => prev.filter(id => !newEarns.includes(id)));
      }, 4000);
    }
  }, [lifetimeKCP, earnedBadges]);

  useEffect(() => {
    if (dailyTargetReached && !earnedBadges.includes(5)) {
      setEarnedBadges(prev => [...prev, 5]);
      setNewlyEarnedBadges(prev => [...prev, 5]);
      showToast(`New Badge: Daily Consistency`, 100, 'earn');
      setPointsAdded(prev => prev + 100);
      setLifetimeKCP(prev => prev + 100);
    }
  }, [dailyTargetReached, earnedBadges]);

  const missions = [
    { id: 1, title: 'Report one traffic update', points: 50, completed: false },
    { id: 2, title: 'Use a scenic route today', points: 20, completed: true },
    { id: 3, title: 'Complete 2 optimized trips', points: 40, completed: false },
  ];

  const storeItems = [
    { id: 'heatmaps', title: 'Live Traffic Heatmaps', desc: 'Unlock advanced congestion vision', cost: 1500, category: 'Map Feature', icon: Map, color: 'text-brand-orange', bg: 'bg-brand-orange/10' },
    { id: 'early_alert', title: 'Early Warning System', desc: 'Predictive roadblock alerts', cost: 3000, category: 'Core Upgrade', icon: Shield, color: 'text-brand-green', bg: 'bg-brand-green/10' },
    { id: 'night_mode', title: 'Ad-Free Navigation', desc: 'Remove system promotional alerts', cost: 800, category: 'Upgrade', icon: Star, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  return (
    <div className="pt-12 px-6 pb-32 h-full overflow-y-auto relative scroll-smooth font-sans bg-[#f8fafc] text-slate-900">
      {/* Toasts */}
      <div className="fixed top-4 inset-x-0 z-[9999] flex flex-col items-center gap-2 pointer-events-none px-4">
        <AnimatePresence>
          {toasts.map(toast => (
            <RewardToast key={toast.id} toast={toast} onDismiss={handleDismissToast} />
          ))}
        </AnimatePresence>
      </div>

      {/* Background aesthetic */}
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-brand-orange/5 via-transparent to-transparent pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center mb-10">
        <button 
          onClick={() => onNavigate('profile')} 
          className="w-10 h-10 rounded-full bg-white flex items-center justify-center mr-4 active:scale-95 transition-transform shadow-sm border border-slate-200"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h1 className="text-3xl font-black font-display text-slate-900">Navigation Identity</h1>
      </div>

      {/* Level Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-6 rounded-[32px] mb-8 relative overflow-hidden shadow-sm border border-slate-200"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
        
        <div className="relative z-10 flex flex-col justify-center items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-orange/10 flex items-center justify-center border border-brand-orange/20 shadow-sm mb-4">
             <Star className="w-8 h-8 text-brand-orange" />
          </div>
          <h2 className="text-2xl font-bold font-display tracking-wide text-slate-900">Route Explorer</h2>
          <p className="text-slate-500 font-medium text-sm mb-6 flex items-center justify-center gap-1.5">
             Level 5 <span className="w-1 h-1 rounded-full bg-slate-300 inline-block" /> Top 14% of Navigators
          </p>

          <div className="w-full">
            <div className="flex justify-between items-end mb-2">
               <div className="flex items-center gap-2">
                 <span className="text-3xl font-black text-slate-900 flex items-center">
                    <motion.span>{roundedCount}</motion.span>
                    <span className="text-sm text-brand-orange ml-1">KCP</span>
                 </span>
                 <AnimatePresence>
                   {pointsAdded > 0 && (
                     <motion.div
                       key={pointsAdded}
                       initial={{ opacity: 0, y: 10, scale: 0.8 }}
                       animate={{ opacity: 1, y: 0, scale: 1 }}
                       exit={{ opacity: 0, y: -10 }}
                       className="text-xs font-bold text-brand-green bg-brand-green/10 border border-brand-green/20 px-2 py-0.5 rounded-full"
                     >
                       +{50}
                     </motion.div>
                   )}
                 </AnimatePresence>
               </div>
               <span className="text-xs font-bold text-slate-400">{nextLevelKCP.toLocaleString()} to reach Traffic Observer</span>
            </div>
            
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner flex">
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: `${progress}%` }} 
                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                className="h-full bg-gradient-to-r from-brand-orange to-brand-green rounded-full shadow-sm" 
              />
            </div>
          </div>
        </div>
        
        {/* Simulate point additions for demo purposes */}
        <button 
          onClick={simulateAddPoints}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-slate-100 active:scale-95 transition-all outline-none"
        >
          <Plus className="w-5 h-5 text-brand-green" />
        </button>
      </motion.div>

      {/* Trust Score & Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-[24px] p-5 border border-slate-200 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 w-16 h-16 bg-brand-blue/5 blur-xl rounded-full" />
           <Shield className="w-6 h-6 text-brand-blue mb-3" />
           <div className="text-2xl font-black mb-1 text-slate-900">98%</div>
           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Trust Score</div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-[24px] p-5 border border-slate-200 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 w-16 h-16 bg-brand-green/5 blur-xl rounded-full" />
           <Target className="w-6 h-6 text-brand-green mb-3" />
           <div className="text-2xl font-black mb-1 text-slate-900">14</div>
           <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Reports Validated</div>
        </motion.div>
      </div>

      {/* Daily KCP Goal Visualizer -> 10x Enhanced Version */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-white border-2 border-amber-200/60 p-6 rounded-[36px] mb-8 relative overflow-hidden shadow-[0_12px_40px_rgba(245,158,11,0.06)] z-10"
      >
        {/* Cinematic Glowing Background Aura */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-br from-amber-400/10 to-transparent blur-3xl rounded-full translate-x-1/4 -translate-y-1/4 pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-32 h-32 bg-brand-orange/5 blur-2xl rounded-full pointer-events-none" />

        <div className="flex flex-col lg:flex-row gap-6 lg:items-stretch justify-between">
          <div className="flex-1 flex flex-col justify-between">
            <div>
              {/* Header Badge */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white px-2.5 py-1 rounded-full">
                  Transit Streak Hub
                </span>
                
                {dailyTargetReached ? (
                  <motion.span 
                    initial={{ scale: 0.9 }}
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="text-[10px] font-extrabold text-amber-700 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-full flex items-center gap-1"
                  >
                    <Flame className="w-3 h-3 fill-amber-500 text-amber-500" /> Daily Target Secured (+100 KCP Badge)
                  </motion.span>
                ) : (
                  <span className="text-[10px] font-extrabold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Zap className="w-3 h-3 text-brand-orange" /> {dailyMilestone - currentDailyKCP} KCP to Milestone
                  </span>
                )}

                <span className="text-[10px] font-extrabold text-slate-800 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                  🔥 1.2x Multiplier Active
                </span>
              </div>

              <h3 className="text-2xl font-black font-display tracking-tight text-slate-900 mb-1.5 flex items-center gap-2">
                Daily Consistency Journey
              </h3>
              
              <p className="text-sm text-slate-500 font-medium mb-5 max-w-md">
                {dailyTargetReached 
                  ? "Outstanding! You completed today's milestone. Your 5-day streak is certified with an extra +100 KCP batch." 
                  : "Collect KCP from live verification, on-trip echo reporting, or tap instant check-in below to secure your daily transit streak badge!"
                }
              </p>
            </div>

            {/* Streak Tracker & Calendar Row */}
            <div className="mb-5 bg-slate-50 border border-slate-100 p-4 rounded-2xl">
              <div className="text-xs font-bold text-slate-400 mb-3 flex justify-between items-center">
                <span>Streak Progress (Cochin, Kerala)</span>
                <span className="text-amber-600 flex items-center gap-1 font-mono">
                  <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 inline" /> {dailyTargetReached ? "5 Days Active" : "4 Days Active"}
                </span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-1">
                {[1, 2, 3, 4, 5].map((day) => {
                  const isPast = day < 4;
                  const isToday = day === 4;
                  const isFuture = day > 4;
                  
                  let dayStatus = "completed";
                  let dayBg = "bg-amber-500 text-white border-amber-500 shadow-sm";
                  let dayContent: any = <Check className="w-3 h-3 stroke-[3]" />;
                  let dayLabel = "Completed";

                  if (isPast) {
                    dayStatus = "completed";
                    dayBg = "bg-amber-500 text-white border-amber-500 shadow-sm";
                    dayContent = <Check className="w-3.5 h-3.5 stroke-[3]" />;
                    dayLabel = "+220 KCP Earned";
                  } else if (isToday) {
                    if (dailyTargetReached) {
                      dayStatus = "today-achieved";
                      dayBg = "bg-gradient-to-br from-amber-500 to-brand-orange text-white border-amber-500 shadow-[0_0_15px_rgba(249,115,22,0.35)]";
                      dayContent = <Flame className="w-4 h-4 fill-white stroke-none animate-bounce" />;
                      dayLabel = `Current: ${currentDailyKCP} KCP (Goal Met)`;
                    } else {
                      dayStatus = "today-pending";
                      dayBg = "bg-white text-slate-800 border-2 border-amber-500/80";
                      dayContent = <Flame className="w-4 h-4 fill-amber-500 stroke-none animate-pulse" />;
                      dayLabel = `Current: ${currentDailyKCP}/${dailyMilestone} KCP`;
                    }
                  } else if (isFuture) {
                    dayStatus = "locked";
                    dayBg = "bg-slate-100 text-slate-300 border border-slate-200";
                    dayContent = <Lock className="w-3 h-3 text-slate-400" />;
                    dayLabel = "Unlocks Tomorrow";
                  }

                  return (
                    <motion.div 
                      key={day} 
                      className="flex items-center"
                      whileHover={{ scale: 1.05 }}
                    >
                      {day > 1 && (
                        <div className={`w-3 md:w-5 h-0.5 ${isPast || (isToday && dailyTargetReached) ? 'bg-amber-500' : 'bg-slate-200'}`} />
                      )}
                      
                      {/* Tooltip trigger custom visual wrapper */}
                      <div className="relative group/day">
                        <div 
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold cursor-help transition-all ${dayBg}`}
                        >
                          {dayContent}
                        </div>
                        
                        {/* Elegant micro hover tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover/day:opacity-100 transition-opacity pointer-events-none z-50 shadow-md">
                          Day {day}: {dayLabel}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
                <div className="text-xs font-black text-amber-600 font-display ml-2">
                  {dailyTargetReached ? "5-Day Streak Active!" : "4-Day Streak"}
                </div>
              </div>
            </div>
          </div>

          {/* Right Pillar: Large Interactive Circular Gauge */}
          <div className="flex flex-row sm:flex-col items-center justify-center gap-4 bg-slate-50 border border-slate-100 p-5 rounded-3xl shrink-0">
            <div className="relative w-28 h-28 flex items-center justify-center group/gauge">
              {/* Metric Circle background */}
              <svg className="absolute inset-0 w-full h-full -rotate-90 transition-transform duration-500 group-hover/gauge:scale-105" viewBox="0 0 100 100">
                <circle 
                  cx="50" 
                  cy="50" 
                  r="42" 
                  className="stroke-slate-200 fill-none" 
                  strokeWidth="8" 
                />
                <motion.circle 
                  cx="50" 
                  cy="50" 
                  r="42" 
                  className={`fill-none ${dailyTargetReached ? 'stroke-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]' : 'stroke-brand-orange'}`} 
                  strokeWidth="8" 
                  strokeDasharray={263.89}
                  initial={{ strokeDashoffset: 263.89 }}
                  animate={{ strokeDashoffset: 263.89 - (263.89 * Math.min(100, (currentDailyKCP / dailyMilestone) * 100)) / 100 }}
                  transition={{ type: "spring", stiffness: 60, damping: 15 }}
                  strokeLinecap="round"
                />
              </svg>

              {/* Text indicator inside circle */}
              <div className="relative z-10 flex flex-col items-center justify-center text-center">
                <AnimatePresence mode="wait">
                  <motion.span 
                    key={currentDailyKCP}
                    initial={{ y: 5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -5, opacity: 0 }}
                    className="text-2xl font-black tracking-tighter text-slate-950 leading-none"
                  >
                    {currentDailyKCP}
                  </motion.span>
                </AnimatePresence>
                <span className="text-[9px] uppercase font-mono font-bold text-slate-400 mt-1.5 p-0.5 bg-slate-200/50 rounded">
                  {dailyTargetReached ? "GOAL" : `${Math.round((currentDailyKCP / dailyMilestone) * 100)}%`}
                </span>
              </div>
            </div>
            
            <div className="flex flex-col justify-center sm:items-center">
              <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase">
                Goal: {dailyMilestone} KCP
              </span>
              <span className="text-[11px] font-extrabold text-brand-orange mt-0.5">
                {dailyTargetReached ? "Claimed 100 KCP Bonus!" : `${dailyMilestone - currentDailyKCP} KCP Left`}
              </span>
            </div>
          </div>
        </div>

        {/* 10x Feature Sandbox Quest Hub */}
        <div className="mt-6 pt-5 border-t border-slate-150 relative">
          <div className="flex items-center gap-2 mb-4">
            <span className="p-1 rounded bg-amber-500/10 border border-amber-500/20">
              <Sparkles className="w-4 h-4 text-amber-600" />
            </span>
            <div className="flex flex-col">
              <h4 className="text-sm font-extrabold text-slate-900 leading-none">Aesthetic Sandbox Verification Quest</h4>
              <span className="text-[10px] font-bold text-slate-400 mt-0.5">Simulate rapid on-ground action to test the daily consistency engine</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Action 1: Check In */}
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (currentDailyKCP >= dailyMilestone + 150) {
                  showToast("Maximum Sandbox points reached today!", 0, 'earn');
                  return;
                }
                const pointsGained = 25;
                setPointsAdded(prev => prev + pointsGained);
                setLifetimeKCP(prev => prev + pointsGained);
                showToast("Instant Sandbox Transit Check-in", pointsGained, 'earn');
              }}
              className="group p-3.5 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex items-center justify-between hover:bg-amber-100/40 text-left transition-all relative overflow-hidden"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
                  <Flame className="w-5 h-5 text-amber-600 fill-amber-500/20 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-800">Check-In Sandbox</div>
                  <div className="text-[10px] font-medium text-slate-500">Tap daily reward</div>
                </div>
              </div>
              <span className="text-xs font-extrabold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">+25 KCP</span>
            </motion.button>

            {/* Action 2: Verify Aluva Water Routes */}
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (currentDailyKCP >= dailyMilestone + 150) {
                  showToast("Maximum Sandbox points reached today!", 0, 'earn');
                  return;
                }
                const pointsGained = 45;
                setPointsAdded(prev => prev + pointsGained);
                setLifetimeKCP(prev => prev + pointsGained);
                showToast("Verified Aluva route water level logs", pointsGained, 'earn');
              }}
              className="group p-3.5 bg-gradient-to-br from-brand-blue/5 to-slate-50 border border-brand-blue/20 rounded-2xl flex items-center justify-between hover:bg-brand-blue/10 text-left transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-blue/15 flex items-center justify-center shrink-0">
                  <CloudRain className="w-5 h-5 text-brand-blue group-hover:rotate-12 transition-transform" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-800">Verify Aluva Flood Info</div>
                  <div className="text-[10px] font-medium text-slate-500">Water levels & safety</div>
                </div>
              </div>
              <span className="text-xs font-extrabold text-brand-blue bg-brand-blue/10 px-2 py-0.5 rounded-full">+45 KCP</span>
            </motion.button>

            {/* Action 3: Confirm Fort Kochi Route */}
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (currentDailyKCP >= dailyMilestone + 150) {
                  showToast("Maximum Sandbox points reached today!", 0, 'earn');
                  return;
                }
                const pointsGained = 55;
                setPointsAdded(prev => prev + pointsGained);
                setLifetimeKCP(prev => prev + pointsGained);
                showToast("Confirmed Fort Kochi ferry speed echo", pointsGained, 'earn');
              }}
              className="group p-3.5 bg-gradient-to-br from-brand-green/5 to-slate-50 border border-brand-green/20 rounded-2xl flex items-center justify-between hover:bg-brand-green/10 text-left transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-green/15 flex items-center justify-center shrink-0">
                  <Map className="w-5 h-5 text-brand-green group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-800">Fort Kochi Ferry Check</div>
                  <div className="text-[10px] font-medium text-slate-500">Live timetable echo</div>
                </div>
              </div>
              <span className="text-xs font-extrabold text-brand-green bg-brand-green/15 px-2 py-0.5 rounded-full">+55 KCP</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Badges */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-10 relative z-10">
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="text-lg font-bold font-display text-slate-900">Recent Achievements</h3>
          <span className="text-xs font-black text-brand-blue cursor-pointer hover:underline uppercase tracking-wide">View All</span>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar -mx-6 px-6">
          <AnimatePresence mode="popLayout">
            {badges
              .filter(b => earnedBadges.includes(b.id))
              .map((badge, i) => {
                const isNew = newlyEarnedBadges.includes(badge.id);
                return (
                  <motion.div 
                    key={badge.id} 
                    layout
                    initial={{ opacity: 0, scale: 0.5, rotate: -15, y: 20 }}
                    animate={
                      isNew 
                        ? { opacity: 1, scale: [0.8, 1.1, 1], rotate: [0, 10, -10, 0], y: 0 } 
                        : { opacity: 1, scale: 1, rotate: 0, y: 0 }
                    }
                    transition={{ 
                      type: "spring", 
                      stiffness: 300, 
                      damping: 20,
                      mass: 1,
                      delay: isNew ? 0 : i * 0.05
                    }}
                    className={`min-w-[140px] bg-white border ${isNew ? 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]' : 'border-slate-200 shadow-sm'} rounded-[24px] p-5 flex flex-col items-center text-center relative overflow-hidden`}
                  >
                    {isNew && (
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-tr from-white/0 via-amber-200/40 to-white/0 pointer-events-none"
                        initial={{ x: '-100%', opacity: 0 }}
                        animate={{ x: '100%', opacity: 1 }}
                        transition={{ delay: 0.2, duration: 1, ease: "easeInOut", repeat: 2, repeatType: "loop" }}
                      />
                    )}
                    <div className={`w-14 h-14 rounded-[18px] ${badge.bg} border ${badge.border} flex items-center justify-center mb-3 shadow-sm relative z-10`}>
                       <badge.icon className={`w-7 h-7 ${badge.color}`} />
                    </div>
                    <div className="font-bold text-sm leading-tight text-slate-700 relative z-10">{badge.name}</div>
                  </motion.div>
                );
              })}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Missions */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="relative z-10 mb-6">
        <h3 className="text-lg font-bold font-display mb-4 px-1 text-slate-900">Daily Missions</h3>
        
        <div className="space-y-3">
          {missions.map(mission => (
             <div key={mission.id} className="bg-white rounded-[24px] p-4 border border-slate-200 shadow-sm flex items-center gap-4 group cursor-pointer hover:bg-slate-50 transition-colors">
                <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${mission.completed ? 'border-brand-green bg-brand-green/10' : 'border-slate-200 bg-slate-50'}`}>
                  {mission.completed ? <ShieldCheck className="w-5 h-5 text-brand-green" /> : <div className="w-2 h-2 rounded-full bg-slate-300" />}
                </div>
                <div className="flex-1">
                   <div className={`font-bold mb-1 group-hover:text-slate-900 transition-colors ${mission.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{mission.title}</div>
                   <div className="text-xs font-black text-brand-orange font-mono">+{mission.points} KCP</div>
                </div>
                {!mission.completed && <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />}
             </div>
          ))}
        </div>
      </motion.div>

      {/* Reward Store / Upgrades */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="relative z-10 mb-8">
        <div className="flex justify-between items-center mb-4 px-1">
          <div>
            <h3 className="text-lg font-bold font-display leading-tight text-slate-900">Feature Unlocks</h3>
            <p className="text-xs font-medium text-slate-500">Exchange KCP for utility upgrades</p>
          </div>
        </div>
        
        <div className="space-y-4">
          {storeItems.map(item => {
            const isUnlocked = unlockedFeatures.includes(item.id);
            const canAfford = totalKCP >= item.cost;
            
            return (
              <div key={item.id} className={`bg-white rounded-[24px] p-4 border transition-all shadow-sm ${isUnlocked ? 'border-brand-blue/30 bg-brand-blue/5' : 'border-slate-200 hover:bg-slate-50 overflow-hidden relative'}`}>
                 {!isUnlocked && !canAfford && <div className="absolute inset-0 bg-white/40 pointer-events-none z-10" />}
                 
                 <div className="flex items-start gap-4">
                   <div className={`w-12 h-12 rounded-[16px] ${item.bg} border border-slate-100 shadow-sm flex items-center justify-center shrink-0`}>
                      <item.icon className={`w-6 h-6 ${item.color}`} />
                   </div>
                   
                   <div className="flex-1 min-w-0 pr-2">
                     <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{item.category}</div>
                     <div className="font-bold text-slate-900 mb-0.5 leading-tight truncate">{item.title}</div>
                     <div className="text-xs font-medium text-slate-500 line-clamp-2 leading-relaxed">{item.desc}</div>
                   </div>
                 </div>

                 <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                   <div className="font-mono font-bold text-sm text-slate-600">
                     {isUnlocked ? 'Purchased' : `${item.cost} KCP`}
                   </div>
                   <button 
                     disabled={isUnlocked || !canAfford}
                     onClick={() => handleUnlock(item.id, item.cost)}
                     className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                       isUnlocked 
                         ? 'bg-brand-blue/10 text-brand-blue cursor-default' 
                         : canAfford
                         ? 'bg-slate-900 text-white active:scale-95 hover:bg-slate-800 shadow-md'
                         : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                     }`}
                   >
                     {isUnlocked ? 'Unlocked' : canAfford ? 'Redeem' : 'Need Points'}
                   </button>
                 </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
