import { Shield, Zap, Activity, Settings } from 'lucide-react';

interface Props {
  activeView: 'vault' | 'settings' | 'health' | 'guide';
  hasSelectedEntry: boolean;
  onNavigate: (view: 'vault' | 'settings' | 'health' | 'guide') => void;
  onOpenGenerator: () => void;
}

export default function MobileBottomNav({
  activeView,
  hasSelectedEntry,
  onNavigate,
  onOpenGenerator,
}: Props) {
  return (
    <nav 
      aria-label="Mobile Navigation" 
      className="shrink-0 border-t border-white/10 bg-[#0c0c0c]/95 backdrop-blur-xl px-2 py-1.5 flex items-center justify-around z-30"
    >
      <button 
        type="button"
        onClick={() => onNavigate('vault')}
        className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-colors min-h-[44px] ${
          activeView === 'vault' && !hasSelectedEntry ? 'text-white font-semibold' : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <Shield size={18} strokeWidth={activeView === 'vault' && !hasSelectedEntry ? 2.5 : 1.5} />
        <span className="text-[10px]">Vault</span>
      </button>

      <button 
        type="button"
        onClick={onOpenGenerator}
        className="flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl text-zinc-500 hover:text-zinc-300 transition-colors min-h-[44px]"
      >
        <Zap size={18} strokeWidth={1.5} />
        <span className="text-[10px]">Tạo Pass</span>
      </button>

      <button 
        type="button"
        onClick={() => onNavigate('health')}
        className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-colors min-h-[44px] ${
          activeView === 'health' ? 'text-white font-semibold' : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <Activity size={18} strokeWidth={activeView === 'health' ? 2.5 : 1.5} />
        <span className="text-[10px]">Sức khỏe</span>
      </button>

      <button 
        type="button"
        onClick={() => onNavigate('settings')}
        className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-colors min-h-[44px] ${
          activeView === 'settings' ? 'text-white font-semibold' : 'text-zinc-500 hover:text-zinc-300'
        }`}
      >
        <Settings size={18} strokeWidth={activeView === 'settings' ? 2.5 : 1.5} />
        <span className="text-[10px]">Cài đặt</span>
      </button>
    </nav>
  );
}
