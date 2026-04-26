import { Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

export default function TrackingTimer({ plate, time, driver, progress, isWarning = false }: { plate: string, time: string, driver: string, progress: number, isWarning?: boolean }) {
  return (
    <div className="bg-white border border-border-subtle p-4 rounded-xl shadow-sm hover:border-slate-300 transition-all group">
      <div className="flex justify-between items-center mb-3">
        <span className="font-mono font-black text-sm text-primary-navy tracking-tight">{plate}</span>
        <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-full border", isWarning ? "bg-orange-50 text-vibrant-orange border-orange-100" : "bg-slate-50 text-slate-400 border-slate-100")}>
          <Clock size={10} className={isWarning ? "animate-pulse" : ""} />
          <span className="text-[9px] font-black uppercase tracking-tighter">Restante</span>
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className={cn("text-2xl font-black tracking-tighter leading-none mb-1", isWarning ? "text-vibrant-orange" : "text-emerald-500")}>{time}</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{driver}</p>
        </div>
        <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
          <motion.div initial={{width:0}} animate={{width: `${progress}%`}} className={cn("h-full", isWarning ? "bg-vibrant-orange" : "bg-emerald-500")} />
        </div>
      </div>
    </div>
  );
}
