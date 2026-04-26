import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export default function SidebarLink({ icon, label, active = false, onClick, className }: { icon: ReactNode, label: string, active?: boolean, onClick?: () => void, className?: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group active:translate-x-1",
        active 
          ? "bg-slate-100 text-primary-navy font-bold shadow-sm" 
          : "text-slate-500 hover:bg-slate-50 hover:text-primary-navy",
        className
      )}
    >
      <span className={cn("transition-transform duration-200 shadow-none", active ? "scale-110" : "group-hover:scale-110")}>{icon}</span>
      <span className="text-sm font-medium tracking-tight">{label}</span>
    </button>
  );
}
