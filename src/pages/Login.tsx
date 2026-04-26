import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Truck as TruckIcon, Search, Plus, UserPlus, Building } from 'lucide-react';
import { cn } from '../lib/utils';
import { loginUser, registerUser, getTerminals } from '../services/api';
import { User } from '../types';

export default function Login({ onLogin }: { onLogin: (user: User) => void }) {
  const [isRegister, setIsRegister] = useState(false);
  const [profile, setProfile] = useState('transportadora');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [linkedTerminalId, setLinkedTerminalId] = useState<number | null>(null);
  const [terminals, setTerminals] = useState<{id: number, name: string}[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (isRegister && profile === 'transportadora') {
      getTerminals().then(setTerminals).catch(console.error);
    }
  }, [isRegister, profile]);
  
  const handleAuth = async () => {
    if(!email || !password || (isRegister && !tenantName)) return alert('Preencha todos os campos!');
    setLoading(true);
    try {
      let response;
      if (isRegister) {
        response = await registerUser({ 
          email, 
          password, 
          role: profile, 
          tenant_name: tenantName,
          linked_terminal_id: profile === 'transportadora' ? (linkedTerminalId || undefined) : undefined 
        });
      } else {
        response = await loginUser({ email, password, role: profile });
      }
      localStorage.setItem('token', response.access_token);
      onLogin(response.user);
    } catch (err: any) {
      alert(err.message || 'Falha na autenticação!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary-navy flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background with overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          className="w-full h-full object-cover opacity-20 grayscale brightness-50" 
          src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=1600&fit=crop" 
          alt="Port" 
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary-navy via-primary-navy/80 to-transparent"></div>
      </div>

      <motion.main 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-[480px]"
      >
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-lg mb-4">
            <TruckIcon className="text-primary-navy w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Fila Virtual Alemoa</h1>
          <p className="text-slate-400 text-sm max-w-xs">
            Gestão inteligente de fluxo logístico e agendamentos portuários de alta performance.
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-2xl p-8 border border-white/10">
          <h2 className="text-2xl font-bold text-primary-navy mb-1">{isRegister ? 'Criar Conta' : 'Bem-vindo'}</h2>
          <p className="text-slate-500 text-sm mb-6">
            {isRegister ? 'Cadastre sua empresa no sistema' : 'Acesse sua conta para gerenciar agendamentos'}
          </p>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Tipo de Perfil</label>
              <div className="grid grid-cols-3 gap-2 p-1 bg-slate-50 rounded-lg border border-slate-100">
                {['Transportadora', 'Terminal', 'Motorista'].map((type) => (
                  <button 
                    key={type}
                    onClick={() => setProfile(type.toLowerCase())}
                    className={cn(
                      "py-2 rounded-md text-[10px] font-black uppercase transition-all",
                      profile === type.toLowerCase() 
                        ? "bg-white shadow-sm text-primary-navy border border-slate-200" 
                        : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <AnimatePresence>
                {isRegister && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1 overflow-hidden"
                  >
                    <label className="text-[10px] font-black uppercase text-slate-500">
                      {profile === 'motorista' ? 'Nome Completo' : 'Nome da Empresa'}
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      <input 
                        value={tenantName}
                        onChange={e => setTenantName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-border-subtle rounded-lg text-sm focus:ring-2 focus:ring-primary-navy/10" 
                        placeholder={profile === 'motorista' ? "Seu nome" : "Ex: Translog Sudeste"} 
                      />
                    </div>

                    {profile === 'transportadora' && (
                      <div className="pt-2">
                        <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">
                          Terminal Vinculado
                        </label>
                        <select 
                          value={linkedTerminalId || ''}
                          onChange={e => setLinkedTerminalId(Number(e.target.value))}
                          className="w-full px-4 py-2 bg-slate-50 border border-border-subtle rounded-lg text-sm focus:ring-2 focus:ring-primary-navy/10 text-slate-700"
                        >
                          <option value="">Selecione um Terminal...</option>
                          {terminals.map(term => (
                            <option key={term.id} value={term.id}>{term.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500">E-mail ou CPF</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-border-subtle rounded-lg text-sm focus:ring-2 focus:ring-primary-navy/10" 
                    placeholder="exemplo@email.com" 
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase text-slate-500">Senha</label>
                  {!isRegister && <button className="text-[10px] font-black uppercase text-blue-600 hover:underline">Esqueceu?</button>}
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-border-subtle rounded-lg text-sm" 
                  placeholder="••••••••" 
                />
              </div>
            </div>

            <button 
              onClick={handleAuth}
              disabled={loading}
              className="w-full bg-primary-navy text-white font-bold py-3 rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (isRegister ? 'Criando Conta...' : 'Autenticando...') : (isRegister ? 'Finalizar Cadastro' : 'Entrar no Sistema')}
              {!loading && (isRegister ? <UserPlus size={18} /> : <Plus size={18} className="rotate-45" />)}
            </button>
            <button 
              onClick={() => setIsRegister(!isRegister)}
              className="w-full border border-border-subtle text-slate-600 font-bold py-3 rounded-lg hover:bg-slate-50 transition-all"
            >
              {isRegister ? 'Já tenho uma conta' : 'Criar Nova Conta'}
            </button>
          </div>
        </div>
      </motion.main>
    </div>
  );
}
