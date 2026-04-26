import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle, XCircle, Building2, Clock, ShieldAlert } from 'lucide-react';
import { getTerminalApprovals, processTerminalApproval } from '../services/api';
import { User } from '../types';

export default function TerminalApprovals({ user }: { user: User }) {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApprovals = async () => {
    try {
      const data = await getTerminalApprovals(localStorage.getItem('token') || '');
      setApprovals(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleAction = async (id: number, action: 'APPROVED' | 'REJECTED') => {
    try {
      await processTerminalApproval(localStorage.getItem('token') || '', id, action);
      alert(`Transportadora ${action === 'APPROVED' ? 'aprovada' : 'rejeitada'} com sucesso!`);
      fetchApprovals();
    } catch (err: any) {
      alert(err.message || 'Erro ao processar');
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center text-slate-500">Carregando solicitações...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <ShieldAlert className="text-primary-navy" />
            Aprovações Pendentes
          </h1>
          <p className="text-slate-500 mt-1">
            Gerencie o acesso de Transportadoras ao seu Terminal.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-border-subtle overflow-hidden">
        {approvals.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <CheckCircle className="mx-auto mb-3 opacity-20" size={48} />
            <p>Nenhuma solicitação pendente no momento.</p>
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {approvals.map((req) => (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                key={req.id} 
                className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-navy/10 flex items-center justify-center text-primary-navy">
                    <Building2 size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{req.transportadora_name}</h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                      <Clock size={12} />
                      Aguardando aprovação
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleAction(req.transportadora_tenant_id, 'REJECTED')}
                    className="px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <XCircle size={16} />
                    Rejeitar
                  </button>
                  <button 
                    onClick={() => handleAction(req.transportadora_tenant_id, 'APPROVED')}
                    className="px-4 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <CheckCircle size={16} />
                    Aprovar
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
