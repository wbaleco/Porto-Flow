import { TrendingUp, ListOrdered } from 'lucide-react';
import { useState } from 'react';
import StatsCard from '../components/ui/StatsCard';
import QueueTable from '../components/ui/QueueTable';
import TrackingTimer from '../components/ui/TrackingTimer';
import { callDriver } from '../services/api';

export default function Dashboard() {
  const [calling, setCalling] = useState(false);

  const handleCallNext = async () => {
    setCalling(true);
    try {
      // Utilizando dados de demonstração para chamar o próximo motorista
      const res = await callDriver('ABC-1234', 1);
      alert(`Motorista chamado com sucesso!\nPlaca: ${res.vehicle_id}\nJanela encerra: ${new Date(res.expires_at).toLocaleTimeString()}`);
    } catch (error) {
      alert('Erro ao conectar com o Backend. Verifique se a API está rodando na porta 8000.');
    } finally {
      setCalling(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatsCard title="Capacidade" value="ESTÁVEL" trend="+12%" icon={<TrendingUp />} />
            <div className="bg-primary-navy p-6 rounded-xl text-white shadow-xl flex flex-col justify-between">
              <div>
                <p className="text-blue-300 text-[10px] font-black uppercase tracking-widest mb-1">Comando</p>
                <h3 className="text-xl font-bold">Chamar Próximo</h3>
              </div>
              <button 
                onClick={handleCallNext} 
                disabled={calling}
                className="bg-emerald-500 py-2.5 rounded-lg font-black text-xs uppercase tracking-widest mt-4 disabled:opacity-50"
              >
                {calling ? 'Chamando...' : 'Ativar Chamado'}
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-border-subtle overflow-hidden">
            <div className="px-6 py-4 border-b border-border-subtle bg-slate-50/50 flex items-center gap-2">
              <ListOrdered size={18} />
              <h3 className="font-bold">Fila Prioritária</h3>
            </div>
            <QueueTable limit={4} />
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white rounded-xl border border-border-subtle overflow-hidden flex flex-col shadow-sm">
            <div className="p-4 border-b border-border-subtle font-bold text-sm tracking-tight">Rastreamento Ativo</div>
            <div className="h-40 bg-slate-900 relative">
              <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&fit=crop" className="w-full h-full object-cover opacity-50" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <p className="text-[10px] font-black text-white/60 uppercase">Em Rota</p>
                <p className="text-white text-xs font-bold">8 veículos aproximando</p>
              </div>
            </div>
            <div className="p-4 space-y-3 bg-slate-50/50">
               <TrackingTimer plate="PLQ-9012" time="01:42:33" driver="Jorge Silva" progress={85} />
               <TrackingTimer plate="DFG-2211" time="00:15:04" driver="Maria Luz" progress={12} isWarning />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
