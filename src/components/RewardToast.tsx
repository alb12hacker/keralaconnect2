import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Award } from 'lucide-react';
import React, { useEffect } from 'react';

export interface ToastMessage {
  id: number;
  points: number;
  title: string;
  type?: 'earn' | 'spend';
}

interface RewardToastProps extends React.PropsWithChildren {
  toast: ToastMessage;
  onDismiss: (id: number) => void;
}

export const RewardToast: React.FC<RewardToastProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      className={`glass-panel px-4 py-3 rounded-2xl flex items-center gap-3 backdrop-blur-xl border shadow-[0_4px_20px_rgba(0,0,0,0.15)] bg-slate-900/90 z-[9999] pointer-events-auto ${toast.type === 'spend' ? 'border-brand-blue/20' : 'border-brand-green/20'}`}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'spend' ? 'bg-brand-blue/10' : 'bg-brand-green/10'}`}>
        {toast.type === 'spend' ? (
          <Award className="w-4 h-4 text-brand-blue" />
        ) : (
          <ShieldCheck className="w-4 h-4 text-brand-green" />
        )}
      </div>
      <div>
        <div className="font-bold text-sm text-slate-200 leading-tight">{toast.title}</div>
        <div className={`font-bold text-xs ${toast.type === 'spend' ? 'text-brand-blue' : 'text-brand-green'}`}>
          {toast.type === 'spend' ? '-' : '+'}{toast.points} KCP
        </div>
      </div>
    </motion.div>
  );
}
