import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Search, Plus, UserPlus, FileText, CheckCircle2, X } from 'lucide-react';
import { getFleetDrivers, addFleetDriver, registerGlobalDriver } from '../services/api';
import { Driver } from '../types';

export default function FleetManagement() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // Search state
  const [searchDoc, setSearchDoc] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // New Driver Form state
  const [showNewForm, setShowNewForm] = useState(false);
  const [newDriver, setNewDriver] = useState({ name: '', cnh: '', default_plate: '' });
  const [isCreating, setIsCreating] = useState(false);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (token) {
        const data = await getFleetDrivers(token);
        setDrivers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleSearch = async () => {
    if (!searchDoc) return;
    setIsSearching(true);
    setSearchError('');
    setSearchResult(null);
    setShowNewForm(false);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      // Try to link directly (which searches and links if exists)
      const data = await addFleetDriver(searchDoc, token);
      setSearchResult(data);
      fetchDrivers(); // Refresh list
    } catch (err: any) {
      if (err.message.includes('não encontrado')) {
        setSearchError('Motorista não encontrado no Porto-Flow.');
        setShowNewForm(true);
      } else {
        setSearchError(err.message || 'Erro ao buscar');
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateAndLink = async () => {
    if (!newDriver.name || !newDriver.cnh || !newDriver.default_plate) {
      return alert('Preencha os dados básicos do motorista');
    }
    
    setIsCreating(true);
    try {
      // 1. Create global
      await registerGlobalDriver({
        document: searchDoc,
        name: newDriver.name,
        cnh: newDriver.cnh,
        default_plate: newDriver.default_plate
      });
      
      // 2. Link to fleet
      const token = localStorage.getItem('token');
      if (token) {
        await addFleetDriver(searchDoc, token);
        fetchDrivers();
        setIsAdding(false);
        // Reset states
        setSearchDoc('');
        setShowNewForm(false);
        setSearchResult(null);
      }
    } catch (err: any) {
      alert(err.message || 'Falha ao cadastrar');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-primary-navy tracking-tight mb-2">Minha Frota</h1>
          <p className="text-slate-500 text-sm">Gerencie os motoristas vinculados à sua transportadora</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-primary-navy text-white px-5 py-3 rounded-lg font-bold shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
        >
          {isAdding ? <X size={20} /> : <Plus size={20} />}
          {isAdding ? 'Cancelar' : 'Adicionar Motorista'}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-xl shadow-lg border border-border-subtle p-6 mb-8"
          >
            <h2 className="text-lg font-bold text-primary-navy mb-4 flex items-center gap-2">
              <UserPlus className="text-blue-500" /> Vincular Motorista
            </h2>
            
            <div className="flex gap-4 items-end mb-6">
              <div className="flex-1 space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500">CPF do Motorista</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input 
                    value={searchDoc}
                    onChange={e => setSearchDoc(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-border-subtle rounded-lg text-sm focus:ring-2 focus:ring-primary-navy/10" 
                    placeholder="Digite o CPF (apenas números)" 
                  />
                </div>
              </div>
              <button 
                onClick={handleSearch}
                disabled={isSearching || !searchDoc}
                className="bg-slate-100 text-primary-navy border border-slate-200 px-6 py-2.5 rounded-lg font-bold hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                {isSearching ? 'Buscando...' : 'Buscar e Vincular'}
              </button>
            </div>

            {searchError && !showNewForm && (
              <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100 mb-4">
                {searchError}
              </div>
            )}

            {searchResult && (
              <div className="p-4 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium border border-emerald-100 mb-4 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                Motorista {searchResult.name} ({searchResult.document}) foi vinculado com sucesso à sua frota!
              </div>
            )}

            {showNewForm && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="border-t border-border-subtle pt-6 mt-2 overflow-hidden"
              >
                <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm mb-6 flex items-start gap-3 border border-blue-100">
                  <FileText className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold mb-1">CPF não cadastrado no Porto-Flow</p>
                    <p>Preencha os dados básicos abaixo para criar o registro global deste motorista e vinculá-lo automaticamente à sua frota.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500">Nome Completo</label>
                    <input 
                      value={newDriver.name}
                      onChange={e => setNewDriver({...newDriver, name: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-border-subtle rounded-lg text-sm" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500">CNH</label>
                    <input 
                      value={newDriver.cnh}
                      onChange={e => setNewDriver({...newDriver, cnh: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-border-subtle rounded-lg text-sm" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500">Placa do Cavalo (Padrão)</label>
                    <input 
                      value={newDriver.default_plate}
                      onChange={e => setNewDriver({...newDriver, default_plate: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 border border-border-subtle rounded-lg text-sm uppercase" 
                      placeholder="ABC-1234"
                    />
                  </div>
                </div>
                
                <button 
                  onClick={handleCreateAndLink}
                  disabled={isCreating}
                  className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  {isCreating ? 'Cadastrando e Vinculando...' : 'Cadastrar Motorista Global'}
                </button>
              </motion.div>
            )}

          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white rounded-xl shadow-sm border border-border-subtle overflow-hidden">
        <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-slate-50/50">
          <h2 className="font-bold text-primary-navy">Motoristas Ativos</h2>
          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
            {drivers.length} Cadastrados
          </span>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-slate-400">Carregando frota...</div>
        ) : drivers.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium mb-2">Nenhum motorista vinculado</p>
            <p className="text-sm text-slate-400 max-w-sm">Adicione motoristas através do CPF para que eles possam receber agendamentos da sua transportadora.</p>
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {drivers.map(driver => (
              <div key={driver.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-200 border border-slate-300 overflow-hidden flex items-center justify-center text-slate-500 font-bold text-xs">
                    <img 
                      src={`https://ui-avatars.com/api/?name=${driver.name}&background=f1f5f9&color=64748b&bold=true`} 
                      alt={driver.name} 
                    />
                  </div>
                  <div>
                    <p className="font-bold text-primary-navy">{driver.name}</p>
                    <p className="text-xs text-slate-500 font-medium">CPF: {driver.document}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">CNH</p>
                    <p className="text-sm font-semibold text-slate-700">{driver.cnh || 'Não informada'}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Placa Padrão</p>
                    <p className="text-sm font-semibold text-slate-700">{driver.default_plate || '---'}</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full border border-emerald-100">
                    {driver.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
