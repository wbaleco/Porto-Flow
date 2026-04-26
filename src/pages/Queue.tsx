import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Megaphone, RefreshCw, Clock, CheckCircle2, XCircle,
  ChevronRight, Truck, User, Package, AlertTriangle, Building2
} from 'lucide-react';
import { getTerminalQueue, updateAgendamentoStatus } from '../services/api';

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  AGENDADO:   { label: 'Agendado',   color: 'text-blue-600',   dot: 'bg-blue-500'   },
  CONFIRMADO: { label: 'Confirmado', color: 'text-emerald-600', dot: 'bg-emerald-500' },
  NA_FILA:    { label: 'Na Fila',    color: 'text-amber-600',  dot: 'bg-amber-500'  },
  CHAMADO:    { label: 'Chamado! ⚡', color: 'text-purple-600', dot: 'bg-purple-500 animate-pulse' },
  CONCLUIDO:  { label: 'Concluído',  color: 'text-slate-400',  dot: 'bg-slate-300'  },
};

function formatDate(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export default function TerminalQueue() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const token = localStorage.getItem('token') || '';

  const loadQueue = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTerminalQueue(token);
      setQueue(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 30000); // auto-refresh 30s
    return () => clearInterval(interval);
  }, [loadQueue]);

  const handleStatusChange = async (id: number, status: string) => {
    setActionLoading(id);
    try {
      await updateAgendamentoStatus(id, status, token);
      await loadQueue();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar');
    } finally {
      setActionLoading(null);
    }
  };

  const waiting = queue.filter(a => ['AGENDADO', 'CONFIRMADO', 'NA_FILA'].includes(a.status));
  const called  = queue.filter(a => a.status === 'CHAMADO');

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Building2 className="text-primary-navy" size={28} />
            Fila Virtual
          </h1>
          <p className="text-slate-500 mt-1">Gerencie a fila de entrada do seu terminal em tempo real.</p>
        </div>
        <button
          onClick={loadQueue}
          className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:bg-slate-100 px-4 py-2.5 rounded-xl transition-colors"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Na Fila', value: waiting.length, color: 'bg-blue-50 text-blue-700 border-blue-200' },
          { label: 'Chamados', value: called.length, color: 'bg-purple-50 text-purple-700 border-purple-200' },
          { label: 'Total Hoje', value: queue.length, color: 'bg-slate-50 text-slate-700 border-slate-200' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
            <p className="text-3xl font-black">{s.value}</p>
            <p className="text-xs font-bold uppercase tracking-wider mt-1 opacity-70">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Chamados (destaque) */}
      <AnimatePresence>
        {called.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-purple-600 text-white rounded-2xl p-5 shadow-lg"
          >
            <p className="text-sm font-black uppercase tracking-widest opacity-80 mb-3 flex items-center gap-2">
              <AlertTriangle size={14} />Motoristas Chamados — Aguardando Confirmação
            </p>
            {called.map(a => (
              <div key={a.id} className="flex items-center justify-between bg-white/10 rounded-xl px-4 py-3 mb-2 last:mb-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center font-bold text-sm">
                    {a.driver_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold">{a.driver_name}</p>
                    <p className="text-xs opacity-75 font-mono">{a.vehicle_plate}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleStatusChange(a.id, 'CONCLUIDO')}
                  disabled={actionLoading === a.id}
                  className="flex items-center gap-1.5 text-xs font-bold bg-white text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 size={14} />Confirmar Entrada
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fila principal */}
      <div className="bg-white rounded-2xl shadow-sm border border-border-subtle overflow-hidden">
        <div className="px-6 py-4 border-b border-border-subtle bg-slate-50/50 flex items-center justify-between">
          <h2 className="font-bold text-primary-navy">Fila de Entrada</h2>
          <span className="text-xs text-slate-400">{waiting.length} veículos aguardando</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">Carregando fila...</div>
        ) : waiting.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="mx-auto mb-3 text-slate-200" size={48} />
            <p className="text-slate-500 font-medium">Fila vazia</p>
            <p className="text-sm text-slate-400 mt-1">Nenhum veículo aguardando no momento.</p>
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {waiting.map((a, idx) => {
              const cfg = STATUS_CONFIG[a.status] || STATUS_CONFIG['AGENDADO'];
              const isFirst = idx === 0;
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className={`p-5 transition-colors ${isFirst ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'}`}
                >
                  <div className="flex items-center gap-4">
                    {/* Posição */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black shrink-0 ${isFirst ? 'bg-primary-navy text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {idx + 1}
                    </div>

                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(a.driver_name)}&background=1A2238&color=fff&bold=true&size=40`}
                        alt={a.driver_name}
                        className="w-full h-full"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-primary-navy">{a.driver_name}</span>
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${cfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}></span>
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1"><User size={11}/>{a.transportadora_name}</span>
                        <span className="flex items-center gap-1 font-mono font-semibold bg-slate-100 px-2 py-0.5 rounded"><Truck size={11}/>{a.vehicle_plate}</span>
                        {a.cargo_type && <span className="flex items-center gap-1"><Package size={11}/>{a.cargo_type}</span>}
                        <span className="flex items-center gap-1"><Clock size={11}/>{formatDate(a.scheduled_date)}</span>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2 shrink-0">
                      {a.status === 'AGENDADO' && (
                        <button
                          onClick={() => handleStatusChange(a.id, 'CONFIRMADO')}
                          disabled={actionLoading === a.id}
                          className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1 disabled:opacity-50"
                        >
                          <CheckCircle2 size={13} />Confirmar
                        </button>
                      )}
                      {(a.status === 'CONFIRMADO' || a.status === 'NA_FILA') && (
                        <button
                          onClick={() => handleStatusChange(a.id, 'CHAMADO')}
                          disabled={actionLoading === a.id}
                          className="text-xs font-bold text-white bg-primary-navy px-3 py-1.5 rounded-lg hover:opacity-90 transition-all flex items-center gap-1 shadow-sm disabled:opacity-50"
                        >
                          <Megaphone size={13} />Chamar
                        </button>
                      )}
                      <button
                        onClick={() => handleStatusChange(a.id, 'CANCELADO')}
                        disabled={actionLoading === a.id}
                        className="text-xs font-bold text-red-500 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <XCircle size={15} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
