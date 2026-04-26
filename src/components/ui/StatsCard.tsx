import { ReactNode } from 'react';

export default function StatsCard({ title, value, trend, icon }: { title: string, value: string, trend: string, icon: ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-border-subtle group hover:border-primary-navy transition-all animate-in fade-in zoom-in duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="text-slate-400">{icon}</div>
        <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded uppercase">{trend} hoje</span>
      </div>
      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{title}</p>
      <p className="text-3xl font-black text-primary-navy">{value}</p>
    </div>
  );
}
