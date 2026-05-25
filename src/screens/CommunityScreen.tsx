import { motion, AnimatePresence } from 'motion/react';
import { Plus, MapPin, AlertTriangle, ShieldCheck, X, ArrowUp, Zap, CloudRain, ShieldAlert } from 'lucide-react';
import { cn } from '../lib/utils';
import { auth } from '../lib/firebase';
import React, { useState, useEffect } from 'react';
import { subscribeToPosts, createPost, upvotePost } from '../lib/community';
import { CommunityPost } from '../types';

export function CommunityScreen() {
  const [filter, setFilter] = useState('All Alerts');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // New Alert Form State
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<CommunityPost['type']>('Transit' as any); // Re-using type field
  const [newLocation, setNewLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    // Map filters to backend categories
    let backendFilter = filter;
    if (filter === 'All Alerts') backendFilter = 'Trending';
    const unsub = subscribeToPosts(backendFilter, setPosts);
    return () => unsub();
  }, [filter]);

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await createPost(newTitle, newContent, newType, newLocation, '');
      setIsCreating(false);
      setNewTitle('');
      setNewContent('');
      setNewLocation('');
    } catch (error) {
      console.error(error);
      setSubmitError("Failed to report issue. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpvote = (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    upvotePost(postId);
  };

  const getAlertIcon = (type: string) => {
    switch(type) {
      case 'Accident': return <ShieldAlert className="w-5 h-5 text-red-500" />;
      case 'Weather': return <CloudRain className="w-5 h-5 text-brand-blue" />;
      case 'Traffic': return <AlertTriangle className="w-5 h-5 text-brand-orange" />;
      default: return <Zap className="w-5 h-5 text-slate-500" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch(type) {
      case 'Accident': return 'bg-red-50 border-red-200 text-red-700';
      case 'Weather': return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'Traffic': return 'bg-orange-50 border-orange-200 text-orange-700';
      default: return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };

  return (
    <div className="pt-16 px-6 pb-32 h-full overflow-y-auto relative scroll-smooth bg-[#f8fafc] font-sans">
      <div className="absolute top-0 left-0 right-0 h-[300px] bg-gradient-to-b from-brand-orange/5 via-transparent to-transparent pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl font-black tracking-tight mb-2 font-display text-slate-900">Live <span className="text-brand-orange">Alerts</span></h1>
        <p className="text-slate-500 mb-8 font-medium">Real-time road intelligence, weather impacts, and system warnings.</p>
      </motion.div>

      <div className="flex gap-3 mb-8 overflow-x-auto pb-2 hide-scrollbar">
         {['All Alerts', 'Traffic', 'Accidents', 'Weather', 'Roadblocks'].map((t) => (
           <button 
             key={t}
             onClick={() => setFilter(t)}
             className={cn(
               "px-5 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all duration-300",
               filter === t 
                 ? "bg-slate-900 text-white shadow-md" 
                 : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
             )}
           >
              {t}
           </button>
         ))}
      </div>

      <div className="grid grid-cols-1 gap-4 mb-10 relative z-10">
        {posts.length === 0 ? (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white text-center border border-slate-200 rounded-[32px] mt-4 overflow-hidden relative shadow-sm">
             <div className="absolute inset-0 bg-gradient-to-br from-brand-orange/5 to-transparent pointer-events-none" />
             
             {/* Animated Illustration */}
             <div className="h-48 w-full flex items-center justify-center relative bg-slate-50 mb-6">
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="relative z-10 w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg border border-slate-100"
                >
                  <ShieldCheck className="w-10 h-10 text-brand-green" />
                </motion.div>
             </div>

             <div className="px-8 pb-10">
               <h3 className="text-xl font-bold text-slate-900 mb-2 font-display">All Clear</h3>
               <p className="text-slate-500 font-medium text-sm max-w-[240px] mx-auto leading-relaxed">
                 No active alerts or roadblocks reported in your vicinity.
               </p>
             </div>
           </motion.div>
        ) : (
          posts.map((post, i) => {
            const hasUpvoted = auth.currentUser ? post.upvotedBy?.includes(auth.currentUser.uid) : false;
            // Map legacy types to new UI temporarily if needed
            const displayType = ['Accident', 'Weather', 'Traffic'].includes(post.type) ? post.type : 'Traffic';
            
            return (
              <motion.div 
                key={post.id}
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-[24px] overflow-hidden shadow-sm border border-slate-200 relative"
              >
                <div className="p-5">
                   <div className="flex justify-between items-start mb-4">
                     <div className={cn("px-2.5 py-1 rounded border flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider", getAlertColor(displayType))}>
                        {getAlertIcon(displayType)} {displayType}
                     </div>
                     <span className="text-xs text-slate-400 font-medium">
                       {new Date(post.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                     </span>
                   </div>
                   
                   <h3 className="text-lg font-bold text-slate-900 mb-2 font-display leading-tight">{post.title}</h3>
                   <p className="text-sm text-slate-600 mb-4 font-medium leading-relaxed">{post.content}</p>
                   
                   <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                     <div className="flex items-center gap-2 text-xs text-slate-500 font-bold bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {post.locationName || 'General Area'}
                     </div>
                     
                     <button onClick={(e) => handleUpvote(e, post.id)} className={cn("flex items-center gap-1.5 text-xs font-bold transition-colors bg-slate-50 px-3 py-1.5 rounded-lg border", hasUpvoted ? "border-brand-orange text-brand-orange bg-orange-50" : "border-slate-200 text-slate-500 hover:bg-slate-100")}>
                        <ArrowUp className={cn("w-3.5 h-3.5", hasUpvoted ? "text-brand-orange" : "")} /> Helpful ({post.upvotes})
                     </button>
                   </div>
                </div>
              </motion.div>
            )
          })
        )}
      </div>

      <div className="relative z-10 w-full mb-12">
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsCreating(true)}
          className="w-full rounded-[24px] p-5 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all hover:border-brand-orange/40 group"
        >
          <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:border-brand-orange shadow-sm transition-colors mb-3">
            <Plus className="w-6 h-6 text-brand-orange" />
          </div>
          <span className="font-bold text-slate-700 group-hover:text-slate-900 transition-colors">Report Road Issue</span>
        </motion.button>
      </div>
      
      {/* Safe Area padding */}
      <div className="h-20"></div>

      {/* REPORT ISSUE MODAL */}
      <AnimatePresence>
        {isCreating && (
          <motion.div 
            initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "100%" }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed inset-0 z-[1000] bg-white flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white/80 backdrop-blur-md">
              <h2 className="text-xl font-black text-slate-900 font-display">Report Issue</h2>
              <button onClick={() => setIsCreating(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 scroll-smooth bg-slate-50/50">
              <form id="create-post-form" onSubmit={handleCreateAlert} className="space-y-6">
                <AnimatePresence>
                  {submitError && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: 'auto' }} 
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-red-500/10 border border-red-500/30 text-red-700 p-4 rounded-xl text-xs font-bold shadow-sm"
                    >
                      ⚠️ {submitError}
                    </motion.div>
                  )}
                </AnimatePresence>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Alert Type</label>
                  <div className="flex flex-wrap gap-2">
                    {['Traffic', 'Accident', 'Weather', 'Roadblock'].map(t => (
                      <button type="button" key={t} onClick={() => setNewType(t as any)} className={cn("px-4 py-2.5 rounded-xl text-sm font-bold border transition-colors shadow-sm", newType === t ? "bg-brand-orange border-brand-orange text-white" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50")}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Summary</label>
                  <input type="text" required value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Heavy waterlogging on bypass" className="w-full bg-white border border-slate-200 rounded-xl p-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-shadow font-medium shadow-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Location/Area</label>
                  <input type="text" required value={newLocation} onChange={e => setNewLocation(e.target.value)} placeholder="e.g. Edappally Signal" className="w-full bg-white border border-slate-200 rounded-xl p-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-shadow font-medium shadow-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Additional Details</label>
                  <textarea required rows={4} value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Describe the impact on traffic..." className="w-full bg-white border border-slate-200 rounded-xl p-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-shadow font-medium resize-none shadow-sm" />
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-slate-100 bg-white">
              <button type="submit" form="create-post-form" disabled={isSubmitting} className="w-full py-4 rounded-xl bg-brand-orange text-white font-bold text-lg active:scale-[0.98] transition-all disabled:opacity-50 shadow-sm">
                {isSubmitting ? 'Submitting...' : 'Submit Alert'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
