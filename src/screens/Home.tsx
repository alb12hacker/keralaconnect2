import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, Navigation, Clock, ShieldCheck, ThermometerSun, ChevronRight, X, AlertTriangle, ArrowRight, Activity, Route, CloudRain } from 'lucide-react';
import { cn } from '../lib/utils';
import { useEffect, useState } from 'react';
import { navState } from '../lib/navState';
import { useRealWeather } from '../lib/weather';

export function Home({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const weather = useRealWeather();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAlertDismissed, setIsAlertDismissed] = useState(false);

  // Stats for cards
  const stats = [
    { id: 1, title: 'Traffic Status', value: 'Optimal', desc: 'NH66 is clear', icon: Activity, color: 'text-brand-green', bg: 'bg-brand-green/10' },
    { id: 2, title: 'Weather Impact', value: 'None', desc: 'Clear conditions', icon: CloudRain, color: 'text-brand-blue', bg: 'bg-brand-blue/10' },
    { id: 3, title: 'Time Saved', value: '14 min', desc: 'Today', icon: Clock, color: 'text-brand-green', bg: 'bg-brand-green/10' },
  ];

  return (
    <div className="w-full h-full overflow-y-auto pb-32 overflow-x-hidden scroll-smooth relative bg-[#f8fafc]">
      {/* Background ambient light */}
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-brand-blue/5 via-transparent to-transparent pointer-events-none" />
      
      <AnimatePresence>
        {weather.alert && !isAlertDismissed && (
          <motion.div
            initial={{ opacity: 0, y: -50, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -50, height: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full bg-orange-50 backdrop-blur-md border-b border-orange-200 overflow-hidden sticky top-0 z-50 rounded-b-3xl"
          >
            <div className="flex items-start gap-3 p-4 max-w-7xl mx-auto">
              <div className="mt-0.5 max-w-fit rounded-full bg-brand-orange/20 p-2 animate-pulse shadow-[0_0_15px_rgba(249,115,22,0.2)]">
                <AlertTriangle className="w-5 h-5 text-brand-orange" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-800 tracking-tight font-display">Local Alert</h4>
                <p className="text-sm text-slate-600 mt-0.5 leading-snug font-medium">{weather.alert}</p>
              </div>
              <button 
                onClick={() => setIsAlertDismissed(true)}
                className="p-1.5 hover:bg-black/5 rounded-full transition-colors text-slate-400 shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Header */}
      <div className="relative pt-12 px-6 pb-6">
        <div className="flex justify-between items-start mb-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-1 font-display">Kerala<span className="text-brand-blue">Connect</span></h1>
            <p className="text-sm font-medium text-slate-500">Intelligent Mobility System</p>
          </motion.div>
          <motion.button 
             onClick={() => onNavigate('profile')}
             initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
             className="w-11 h-11 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center relative hover:bg-slate-50 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
               <span className="text-sm font-bold text-slate-600">ME</span>
            </div>
          </motion.button>
        </div>

        {/* Smart Search */}
        <motion.div 
          className="relative group mt-2 z-40"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="relative bg-white rounded-3xl flex items-center px-5 py-4 cursor-text border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] transition-shadow">
            <Search className="w-6 h-6 text-brand-blue mr-4" />
            <div className="flex-1">
              <input 
                type="text" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Where to?" 
                className="w-full bg-transparent border-none outline-none text-slate-900 placeholder-slate-400 text-lg font-bold"
              />
            </div>
            {weather.temp && (
              <div className="flex items-center gap-1.5 ml-3 pl-3 border-l border-slate-200">
                <ThermometerSun className="w-4 h-4 text-brand-orange" />
                <span className="text-sm font-bold text-slate-700">{weather.temp}°</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Real-time Status Cards */}
      <div className="pl-6 mb-8 mt-2">
        <div className="flex gap-4 overflow-x-auto pb-4 pr-6 snap-x snap-mandatory hide-scrollbar">
          {stats.map((stat, i) => (
             <motion.div 
               key={stat.id}
               initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + (i * 0.1) }}
               className="w-[140px] shrink-0 snap-center bg-white rounded-[24px] p-4 border border-slate-200/60 shadow-sm"
             >
                <div className={`w-10 h-10 rounded-full ${stat.bg} flex items-center justify-center mb-3`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className="text-xs font-bold text-slate-500 mb-0.5">{stat.title}</div>
                <div className="text-base font-black text-slate-900 leading-tight mb-1">{stat.value}</div>
                <div className="text-[10px] font-medium text-slate-400">{stat.desc}</div>
             </motion.div>
          ))}
        </div>
      </div>

      {/* Quick Actions Array */}
      <div className="px-6 mb-8">
         <h2 className="text-lg font-black text-slate-900 mb-4 font-display">Quick Actions</h2>
         <div className="grid grid-cols-2 gap-3">
            <motion.button 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              onClick={() => onNavigate('map')}
              className="bg-brand-blue text-white rounded-[20px] p-4 text-left shadow-[0_4px_15px_rgba(14,165,233,0.3)] min-h-[100px] flex flex-col justify-between"
            >
              <Navigation className="w-6 h-6 mb-2" />
              <div className="font-bold">Start Navigation</div>
            </motion.button>
            <motion.button 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              onClick={() => onNavigate('routes')}
              className="bg-white text-slate-900 border border-slate-200 rounded-[20px] p-4 text-left shadow-sm min-h-[100px] flex flex-col justify-between"
            >
              <Route className="w-6 h-6 mb-2 text-brand-green" />
              <div className="font-bold">Find Fastest Route</div>
            </motion.button>
            <motion.button 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              onClick={() => onNavigate('map')}
              className="bg-white text-slate-900 border border-slate-200 rounded-[20px] p-4 text-left shadow-sm flex items-center gap-3"
            >
              <MapPin className="w-5 h-5 text-brand-orange shrink-0" />
              <div className="font-bold text-sm leading-tight">Live Map</div>
            </motion.button>
            <motion.button 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
              onClick={() => onNavigate('alerts')}
              className="bg-white text-slate-900 border border-slate-200 rounded-[20px] p-4 text-left shadow-sm flex items-center gap-3"
            >
              <ShieldCheck className="w-5 h-5 text-slate-400 shrink-0" />
              <div className="font-bold text-sm leading-tight">Report Issue</div>
            </motion.button>
         </div>
      </div>

      {/* Suggested Routes / Live Intelligence */}
      <div className="px-6 mb-8">
        <h2 className="text-lg font-black text-slate-900 mb-4 font-display">Suggested Routes</h2>
        <motion.div 
           initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
           className="bg-white rounded-[24px] p-1 border border-slate-200 shadow-sm"
        >
           <div className="p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors rounded-2xl" onClick={() => onNavigate('routes')}>
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                 <MapPin className="w-6 h-6 text-slate-400" />
              </div>
              <div className="flex-1">
                 <div className="font-bold text-slate-900">Home → Infopark</div>
                 <div className="text-sm font-medium text-brand-green">Fastest route • 28 mins</div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-300" />
           </div>
           
           <div className="h-px bg-slate-100 mx-4" />

           <div className="p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors rounded-2xl" onClick={() => onNavigate('routes')}>
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                 <MapPin className="w-6 h-6 text-slate-400" />
              </div>
              <div className="flex-1">
                 <div className="font-bold text-slate-900">MG Road via Bypass</div>
                 <div className="text-sm font-medium text-brand-green">Clear roads • 25 mins</div>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-300" />
           </div>
        </motion.div>
      </div>

      {/* Safe Area padding */}
      <div className="h-12"></div>
    </div>
  );
}
