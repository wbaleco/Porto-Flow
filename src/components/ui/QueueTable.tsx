import { MoreVertical } from 'lucide-react';
import { cn } from '../../lib/utils';
import { MOCK_QUEUE } from '../../constants';

export default function QueueTable({ limit }: { limit?: number }) {
  const data = limit ? MOCK_QUEUE.slice(0, limit) : MOCK_QUEUE;
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50/50">
          <tr className="text-slate-500 uppercase text-[9px] font-black tracking-widest">
            <th className="px-6 py-4">Placa</th>
            <th className="px-6 py-4">Motorista</th>
            <th className="px-6 py-4">Terminal</th>
            <th className="px-6 py-4">Horário Previsto</th>
            <th className="px-6 py-4">Status</th>
            <th className="px-6 py-4 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((truck) => (
            <tr key={truck.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-1.5 h-6 rounded-full",
                    truck.status === 'no-patio' ? 'bg-emerald-500' : 
                    truck.status === 'atrasado' ? 'bg-red-500' : 'bg-blue-500'
                  )} />
                  <span className="font-mono font-bold text-primary-navy">{truck.plate}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-400">
                    {truck.driver.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{truck.driver}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{truck.company}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-sm font-medium text-slate-600">Terminal {truck.terminal}</td>
              <td className="px-6 py-4 text-sm text-slate-500">{truck.entryTime} - 24 Mai</td>
              <td className="px-6 py-4">
                <span className={cn(
                  "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter",
                  truck.status === 'no-patio' ? 'bg-emerald-500/10 text-emerald-500' : 
                  truck.status === 'atrasado' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                )}>
                  {truck.status.replace('-', ' ')}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <button className="text-slate-300 hover:text-primary-navy"><MoreVertical size={16} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
