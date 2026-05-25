import { motion } from 'motion/react';
import { Route, Clock, ChevronRight, AlertCircle, Ship, Bus, Users, MapPin } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Vehicle } from '../types';
import { navState } from '../lib/navState';

export function RoutesScreen({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const q = query(collection(db, 'vehicles'), where('status', 'in', ['active', 'delayed']));
    const unsub = onSnapshot(q, (snap) => {
      const v = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Vehicle))
        .filter(vehicle => vehicle.driverId); // ONLY show real driver rides
      setVehicles(v);
    });
    return () => unsub();
  }, []);

  const filteredVehicles = vehicles.filter(v => {
    if (filter === 'Buses') return v.type === 'bus';
    if (filter === 'Ferries') return v.type === 'ferry';
    if (filter === 'Delayed') return v.status === 'delayed';
    return true; // 'All'
  });

  const handleRouteClick = (vid: string) => {
    navState.setSelectedVehicleId(vid);
    onNavigate('map');
  };

  return (
    <div className="pt-16 px-6 pb-32 h-full overflow-y-auto relative scroll-smooth bg-[#f8fafc]">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-brand-blue/5 via-transparent to-transparent pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl font-black tracking-tight mb-2 font-display text-slate-900">Active <span className="text-brand-blue">Routes</span></h1>
        <p className="text-slate-500 mb-8 font-medium">Select a live route for intelligent tracking and ETA predictions.</p>
      </motion.div>

      <div className="flex gap-3 mb-8 overflow-x-auto pb-2 hide-scrollbar">
         {['All', 'Buses', 'Ferries', 'Delayed'].map((t, i) => (
           <button 
             key={t} 
             onClick={() => setFilter(t)}
             className={cn(
             "px-5 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all duration-300",
             filter === t 
               ? "bg-slate-900 text-white shadow-md" 
               : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
           )}>
              {t}
           </button>
         ))}
      </div>

      <div className="flex flex-col gap-4 relative z-10">
        {filteredVehicles.length === 0 ? (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white text-center border border-slate-200 rounded-[32px] mt-4 overflow-hidden relative shadow-sm">
             <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/5 to-transparent pointer-events-none" />
             
             {/* Animated Illustration */}
             <div className="h-48 w-full flex items-center justify-center relative bg-slate-50 mb-6">
                <motion.div 
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="relative z-10 w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-lg border border-slate-100"
                >
                  <Route className="w-10 h-10 text-brand-blue" />
                  
                  {/* Floating Elements */}
                  <motion.div 
                    animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center border border-brand-green/20"
                  >
                     <MapPin className="w-5 h-5 text-brand-green" />
                  </motion.div>
                </motion.div>
             </div>

             <div className="px-8 pb-10">
               <h3 className="text-xl font-bold text-slate-900 mb-2 font-display">No Active Routes</h3>
               <p className="text-slate-500 font-medium text-sm max-w-[240px] mx-auto leading-relaxed">
                 There are no trips currently active for this category. Adjust filters or check back shortly.
               </p>
             </div>
           </motion.div>
        ) : (
          filteredVehicles.map((r, i) => (
             <motion.div 
               key={r.id}
               onClick={() => handleRouteClick(r.id)}
               initial={{ opacity: 0, scale: 0.95, y: 20 }} 
               animate={{ opacity: 1, scale: 1, y: 0 }} 
               transition={{ delay: i * 0.05, type: 'spring', stiffness: 350, damping: 25 }}
               className={cn(
                 "bg-white p-5 rounded-[24px] flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-all duration-300 shadow-sm border border-slate-200 border-l-4",
                 r.type === 'bus' ? "border-l-brand-blue" : "border-l-brand-green"
               )}
             >
                {r.status === 'delayed' && <div className="absolute top-0 right-0 w-24 h-24 bg-brand-orange/5 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>}
                
                <div className={cn(
                  "w-14 h-14 rounded-[18px] flex items-center justify-center shrink-0 border border-slate-100 shadow-sm",
                  r.type === 'bus' ? "bg-brand-blue/10" : "bg-brand-green/10"
                )}>
                  {r.type === 'bus' ? <Bus className="w-6 h-6 text-brand-blue" /> : <Ship className="w-6 h-6 text-brand-green" />}
                </div>
                
                <div className="flex-1 min-w-0 z-10">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-600 font-black">{r.routeNumber}</span>
                    {r.status === 'delayed' && <span className="text-[10px] uppercase font-bold text-brand-orange bg-brand-orange/10 border border-brand-orange/20 px-2 py-0.5 rounded flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Delayed</span>}
                  </div>
                  <h3 className="font-bold text-lg leading-tight mb-2 truncate text-slate-900 font-display">{r.routeName}</h3>
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-100"><Clock className="w-3 h-3 text-brand-orange" /> {r.speed} km/h</span>
                    <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded border border-slate-100 capitalize"><Users className="w-3 h-3 text-brand-blue" /> {r.crowdLevel}</span>
                  </div>
                </div>

                <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 z-10">
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
             </motion.div>
          ))
        )}
      </div>
      
      {/* Safe Area padding */}
      <div className="h-16"></div>
    </div>
  );
}
