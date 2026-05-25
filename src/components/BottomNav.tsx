import { Home, Map as MapIcon, Route, Bell } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface BottomNavProps {
  activeTab: string;
  onChange: (tab: string) => void;
}

export function BottomNav({ activeTab, onChange }: BottomNavProps) {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'map', icon: MapIcon, label: 'Map' },
    { id: 'routes', icon: Route, label: 'Route' },
    { id: 'alerts', icon: Bell, label: 'Alerts' },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-[400px] h-16 bg-white/90 backdrop-blur-xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-full flex items-center justify-around px-2 z-[999]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="relative flex flex-col items-center justify-center w-14 h-12"
          >
            {isActive && (
              <motion.div
                layoutId="active-indicator"
                className="absolute inset-0 bg-brand-blue/10 rounded-full"
                initial={false}
                transition={{ type: "spring", stiffness: 450, damping: 30 }}
              />
            )}
            <motion.div
              animate={{ 
                y: isActive ? -2 : 0,
                scale: isActive ? 1.1 : 1
              }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="z-10"
            >
              <Icon 
                className={cn(
                  "w-5 h-5 transition-colors duration-300", 
                  isActive ? "text-brand-blue" : "text-slate-500 hover:text-slate-700"
                )} 
                strokeWidth={isActive ? 2.5 : 2}
              />
            </motion.div>
            <AnimatePresence>
              {isActive && (
                <motion.span 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="text-[9px] mt-1 z-10 font-bold text-brand-blue tracking-wide"
                >
                  {tab.label}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        );
      })}
    </div>
  );
}
