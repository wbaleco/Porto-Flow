import { ChevronLeft, Bell, Clock, Navigation, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function DriverMobile({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-[40px] shadow-2xl border-[8px] border-slate-900 overflow-hidden relative aspect-[9/19.5]">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-20" />
        
        <header className="px-6 pt-10 pb-4 border-b border-slate-100 flex justify-between items-center">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
             <ChevronLeft size={24} />
          </button>
          <h2 className="font-bold text-slate-800">Fila Alemoa</h2>
          <Bell size={20} className="text-slate-400" />
        </header>

        <div className="p-5 space-y-4 h-[calc(100%-80px)] overflow-y-auto">
          <div className="bg-emerald-500 text-white p-6 rounded-2xl flex flex-col items-center text-center shadow-lg shadow-emerald-500/20">
            <p className="text-[10px] font-black uppercase bg-white/20 px-2 py-0.5 rounded-full mb-2">Status Atual</p>
            <h1 className="text-2xl font-black uppercase leading-tight">Chamado - Siga para o Terminal</h1>
          </div>

          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
              <Clock size={14} /> Tempo Restante Entrada
            </p>
            <div className="text-5xl font-black text-emerald-500 tracking-tighter mb-4 timer-glow">01:42:58</div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
               <motion.div initial={{width: 0}} animate={{width: '85%'}} className="h-full bg-emerald-500" />
            </div>
          </div>

          <div className="h-40 rounded-2xl overflow-hidden relative border border-slate-100">
             <img src="https://images.unsplash.com/photo-1548345680-f5475ee5225d?w=400&fit=crop" className="w-full h-full object-cover" />
             <div className="absolute bottom-3 left-3 right-3 bg-white/95 p-3 rounded-xl shadow-lg flex items-center gap-3">
               <div className="p-2 bg-primary-navy text-white rounded-lg"><Navigation size={16} /></div>
               <div>
                  <p className="text-xs font-bold text-primary-navy">PATIO ALEMOA</p>
                  <p className="text-[10px] text-slate-400">2.4 km • 8 min de viagem</p>
               </div>
             </div>
          </div>

          <button className="w-full bg-primary-navy text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 active:scale-95 transition-transform shadow-lg">
             <CheckCircle2 size={24} /> INICIAR DESLOCAMENTO
          </button>
        </div>
      </div>
      <p className="mt-8 text-slate-400 text-xs font-medium">© 2026 Logistics Terminal alemoa</p>
    </div>
  );
}
