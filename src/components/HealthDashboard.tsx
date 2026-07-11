import { PasswordEntry } from '../types';
import { Activity, AlertTriangle, Clock, Copy, ShieldAlert, CheckCircle2, ArrowLeft, Home } from 'lucide-react';

interface Props {
  entries: PasswordEntry[];
  onBack: () => void;
  onHome: () => void;
  onEdit?: (entry: PasswordEntry) => void;
}

export default function HealthDashboard({ entries, onBack, onHome, onEdit }: Props) {
  const getStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;
    return score;
  };

  const weakEntries = entries.filter(e => getStrength(e.password) < 3);
  
  const passwordCounts: Record<string, number> = {};
  entries.forEach(e => {
    passwordCounts[e.password] = (passwordCounts[e.password] || 0) + 1;
  });
  const reusedEntries = entries.filter(e => passwordCounts[e.password] > 1);

  const ninetyDaysInMs = 90 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const oldEntries = entries.filter(e => (now - e.updated_at) > ninetyDaysInMs);

  const score = entries.length === 0 ? 100 : Math.max(0, Math.round(
    100 - (weakEntries.length / entries.length) * 40 - (reusedEntries.length / entries.length) * 40 - (oldEntries.length / entries.length) * 20
  ));

  return (
    <div className="max-w-4xl w-full mx-auto px-10 py-16 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
      <div className="mb-12 flex items-start justify-between">
        <div>
          <div className="inline-block rounded-full px-3 py-1 mb-4 text-[9px] uppercase tracking-[0.25em] font-medium bg-white/5 text-zinc-400 border border-white/10">
            Health
          </div>
          <h2 className="text-5xl font-medium text-white tracking-tight leading-tight flex items-center gap-4">
            Độ mạnh Mật khẩu
          </h2>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/10 active:scale-95 text-white"
            title="Quay lại"
          >
            <ArrowLeft size={16} />
          </button>
          <button 
            onClick={onHome}
            className="w-10 h-10 flex items-center justify-center bg-white text-black hover:bg-zinc-100 rounded-full transition-colors border border-transparent active:scale-95"
            title="Về Trang chủ"
          >
            <Home size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 shadow-2xl flex flex-col justify-between">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-4">
            <Activity size={18} />
          </div>
          <div>
            <div className="text-3xl font-medium text-white mb-1">{score}%</div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-semibold">Điểm độ mạnh</div>
          </div>
        </div>
        
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 shadow-2xl flex flex-col justify-between">
          <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mb-4">
            <ShieldAlert size={18} />
          </div>
          <div>
            <div className="text-3xl font-medium text-white mb-1">{weakEntries.length}</div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-semibold">Mật khẩu yếu</div>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 shadow-2xl flex flex-col justify-between">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 mb-4">
            <Copy size={18} />
          </div>
          <div>
            <div className="text-3xl font-medium text-white mb-1">{reusedEntries.length}</div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-semibold">Dùng lại</div>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 shadow-2xl flex flex-col justify-between">
          <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 mb-4">
            <Clock size={18} />
          </div>
          <div>
            <div className="text-3xl font-medium text-white mb-1">{oldEntries.length}</div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-semibold">Cũ (&gt;90 ngày)</div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {score === 100 && entries.length > 0 && (
          <div className="p-6 rounded-3xl bg-green-500/10 border border-green-500/20 flex items-center gap-4 text-green-400">
            <CheckCircle2 size={24} />
            <div>
              <h4 className="font-medium">Tuyệt vời!</h4>
              <p className="text-sm opacity-80 mt-0.5">Tất cả mật khẩu của bạn đều an toàn, độc nhất và được cập nhật gần đây.</p>
            </div>
          </div>
        )}

        {weakEntries.length > 0 && (
          <div className="p-1.5 rounded-[2rem] bg-white/[0.02] border border-white/5">
            <div className="bg-[#0a0a0a]/60 backdrop-blur-xl rounded-[calc(2rem-0.375rem)] p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-white/5">
              <div className="flex items-center gap-3 text-red-400 mb-4">
                <AlertTriangle size={16} />
                <h4 className="font-medium text-sm">Cần đổi mật khẩu yếu ({weakEntries.length})</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {weakEntries.map(e => (
                  <button 
                    key={e.id} 
                    onClick={() => onEdit && onEdit(e)}
                    className="px-3 py-1 bg-white/5 hover:bg-white/10 active:scale-95 rounded-full text-xs text-zinc-300 border border-white/10 transition-all flex items-center gap-1.5"
                    title={`Sửa: ${e.username}`}
                  >
                    {e.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {reusedEntries.length > 0 && (
          <div className="p-1.5 rounded-[2rem] bg-white/[0.02] border border-white/5">
            <div className="bg-[#0a0a0a]/60 backdrop-blur-xl rounded-[calc(2rem-0.375rem)] p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-white/5">
              <div className="flex items-center gap-3 text-orange-400 mb-4">
                <Copy size={16} />
                <h4 className="font-medium text-sm">Mật khẩu bị trùng lặp ({reusedEntries.length})</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {reusedEntries.map(e => (
                  <button 
                    key={e.id} 
                    onClick={() => onEdit && onEdit(e)}
                    className="px-3 py-1 bg-white/5 hover:bg-white/10 active:scale-95 rounded-full text-xs text-zinc-300 border border-white/10 transition-all flex items-center gap-1.5"
                    title={`Sửa: ${e.username}`}
                  >
                    {e.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
