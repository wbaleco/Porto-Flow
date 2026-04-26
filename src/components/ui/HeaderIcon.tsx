import { ReactNode } from 'react';

export default function HeaderIcon({ icon, Badge }: { icon: ReactNode, Badge?: number }) {
  return (
    <button className="relative p-2 text-slate-400 hover:bg-slate-50 hover:text-primary-navy rounded-full active:scale-90 transition-all">
      {icon}
      {Badge && (
        <span className="absolute top-1.5 right-1.5 min-w-[12px] h-3 px-1 bg-red-500 text-white rounded-full text-[8px] font-black flex items-center justify-center">
          {Badge}
        </span>
      )}
    </button>
  );
}
