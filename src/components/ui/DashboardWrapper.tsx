import React from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, 
  ListOrdered, 
  Calendar, 
  Truck as TruckIcon, 
  BarChart3, 
  Settings, 
  LogOut, 
  Bell, 
  HelpCircle, 
  Search, 
  Megaphone,
  Users,
  ShieldAlert
} from 'lucide-react';
import SidebarLink from './SidebarLink';
import HeaderIcon from './HeaderIcon';
import { View, User } from '../../types';

export default function DashboardWrapper({ 
  children, 
  activeTab, 
  onTabChange, 
  onLogout,
  user
}: { 
  children: React.ReactNode, 
  activeTab: View, 
  onTabChange: (v: View) => void,
  onLogout: () => void,
  user: User | null
}) {
  return (
    <div className="flex min-h-screen bg-surface-bg text-primary-navy">
      <aside className="fixed left-0 top-0 h-full w-64 border-r border-border-subtle bg-white flex flex-col p-4 z-50">
        <div className="flex items-center gap-3 px-2 py-4 mb-6">
          <div className="w-10 h-10 bg-primary-navy rounded-lg flex items-center justify-center shadow-lg">
            <TruckIcon className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="font-black text-primary-navy text-lg leading-tight uppercase tracking-tight">Logística</h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate max-w-[150px]">
              {user?.tenant_name || 'Porto Flow'}
            </p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {/* Links visíveis para todos */}
          <SidebarLink 
            icon={<LayoutDashboard size={20} />} 
            label="Painel Geral" 
            active={activeTab === 'dashboard'} 
            onClick={() => onTabChange('dashboard')} 
          />

          {/* Terminal: fila + aprovações */}
          {user?.role === 'terminal' && (
            <>
              <SidebarLink 
                icon={<ListOrdered size={20} />} 
                label="Fila Virtual" 
                active={activeTab === 'queue'} 
                onClick={() => onTabChange('queue')} 
              />
              <SidebarLink 
                icon={<ShieldAlert size={20} />} 
                label="Aprovações" 
                active={activeTab === 'terminal-approvals'} 
                onClick={() => onTabChange('terminal-approvals')} 
              />
            </>
          )}

          {/* Transportadora: agendamentos + frota */}
          {user?.role === 'transportadora' && (
            <>
              <SidebarLink 
                icon={<Calendar size={20} />} 
                label="Agendamentos" 
                active={activeTab === 'scheduling'} 
                onClick={() => onTabChange('scheduling')} 
              />
              <SidebarLink 
                icon={<Users size={20} />} 
                label="Minha Frota" 
                active={activeTab === 'fleet'} 
                onClick={() => onTabChange('fleet')} 
              />
            </>
          )}

          <SidebarLink icon={<TruckIcon size={20} />} label="Pátio Alemoa" />
          <SidebarLink icon={<BarChart3 size={20} />} label="Relatórios" />
        </nav>

        <div className="mt-auto pt-4 border-t border-border-subtle space-y-1">
          <button 
            onClick={() => onTabChange('driver')}
            className="w-full mb-4 py-3 px-4 bg-primary-navy text-white text-sm font-bold rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md group"
          >
            <Megaphone size={16} className="group-hover:rotate-12 transition-transform" />
            Chamar Próximo
          </button>
          <SidebarLink icon={<Settings size={20} />} label="Configurações" />
          <SidebarLink 
            icon={<LogOut size={20} />} 
            label="Sair" 
            className="text-red-500 hover:bg-red-50 hover:text-red-600" 
            onClick={onLogout}
          />
        </div>
      </aside>

      <main className="ml-64 flex-1 flex flex-col min-h-screen">
        <header className="h-16 flex justify-between items-center px-8 bg-white border-b border-border-subtle sticky top-0 z-40">
          <div className="flex items-center gap-8">
            <h2 className="text-xl font-bold tracking-tight text-primary-navy">Fila Virtual Alemoa</h2>
            <div className="hidden lg:flex items-center gap-6 h-16">
              <button className="h-full border-b-2 border-primary-navy px-2 font-semibold text-sm">Visão Operacional</button>
              <button className="h-full px-2 text-slate-500 font-medium text-sm hover:text-primary-navy transition-colors">Configuração de Fluxo</button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Buscar placa..." 
                className="pl-10 pr-4 py-2 bg-slate-50 border border-border-subtle rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-navy/10 w-64 transition-all"
              />
            </div>
            <button className="bg-primary-navy text-white px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-all active:scale-95 shadow-sm">
              Novo Agendamento
            </button>
            <div className="flex items-center gap-2 border-l border-border-subtle pl-4">
              <HeaderIcon icon={<Bell size={20} />} Badge={3} />
              <HeaderIcon icon={<HelpCircle size={20} />} />
              <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden ml-2 border border-border-subtle flex items-center justify-center text-primary-navy font-bold text-xs">
                {user?.email ? (
                  <img 
                    src={`https://ui-avatars.com/api/?name=${user.email}&background=1A2238&color=fff&bold=true`} 
                    alt={user.email} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  "U"
                )}
              </div>
            </div>
          </div>
        </header>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="flex-1"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
