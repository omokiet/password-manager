import { useState, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ShieldAlert, KeyRound, CheckCircle2, Download, Upload, DatabaseBackup } from 'lucide-react';

interface Props {
  onLock: () => void;
  onClose: () => void;
}

export default function SettingsPanel({ onLock, onClose }: Props) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = getStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setStatus('error');
      setMessage('Mật khẩu mới phải từ 8 ký tự trở lên');
      return;
    }
    
    setStatus('loading');
    try {
      await invoke('change_master_password', { oldPassword, newPassword });
      setStatus('success');
      setMessage('Đổi mật khẩu chủ thành công!');
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.toString());
    }
  };

  const handleExportBackup = async () => {
    setStatus('loading');
    try {
      const data: string = await invoke('export_backup');
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${new Date().toISOString().split('T')[0]}.vaultbak`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatus('success');
      setMessage('Đã tải xuống bản sao lưu');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.toString());
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('loading');
    try {
      const text = await file.text();
      await invoke('import_backup', { backupJson: text });
      // Restore thành công, đóng DB trên server, cần login lại
      onLock();
    } catch (err: any) {
      setStatus('error');
      setMessage(err.toString());
    }
  };

  return (
    <div className="max-w-3xl w-full mx-auto px-10 py-16 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]">
      <div className="mb-16 flex items-start justify-between">
        <div>
          <div className="inline-block rounded-full px-3 py-1 mb-4 text-[9px] uppercase tracking-[0.25em] font-medium bg-white/5 text-zinc-400 border border-white/10">
            Settings
          </div>
          <h2 className="text-5xl font-medium text-white tracking-tight leading-tight">
            Cài đặt
          </h2>
        </div>
        <button 
          onClick={onClose}
          type="button"
          className="px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-full text-sm font-medium transition-colors border border-white/10 active:scale-95 text-white"
        >
          Quay lại
        </button>
      </div>

      <div className="space-y-8">
        <form onSubmit={handleSubmit} className="p-1.5 rounded-[2.5rem] bg-white/[0.02] border border-white/5 shadow-2xl">
          <div className="bg-[#0a0a0a]/60 backdrop-blur-3xl rounded-[calc(2.5rem-0.375rem)] p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-white/5 space-y-6">
            
            <div className="flex items-center gap-4 pb-4 border-b border-white/5">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                <ShieldAlert size={18} />
              </div>
              <div>
                <h3 className="font-medium text-white">Đổi mật khẩu chủ</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Mật khẩu mới sẽ được mã hóa và tạo salt mới ngay lập tức.</p>
              </div>
            </div>

            {status === 'success' && (
              <div className="px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 text-green-400 text-sm">
                <CheckCircle2 size={16} />
                {message}
              </div>
            )}

            {status === 'error' && (
              <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {message}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.15em] mb-2.5 ml-1">Mật khẩu cũ</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                data-1p-ignore="true"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 focus:border-white/20 rounded-2xl px-5 py-4 text-base font-mono tracking-widest focus:outline-none transition-colors text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-[0.15em] mb-2.5 ml-1">Mật khẩu mới</label>
              <div className="relative group">
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  data-1p-ignore="true"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 focus:border-white/20 rounded-2xl pl-5 pr-20 py-4 text-base font-mono tracking-widest focus:outline-none transition-colors text-white"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div 
                      key={i} 
                      className={`w-4 h-1.5 rounded-full transition-colors ${strength >= i ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-white/10'}`} 
                    />
                  ))}
                </div>
              </div>
              {newPassword && oldPassword === newPassword && (
                <p className="text-yellow-500/90 text-[11px] mt-3 ml-1 flex items-center gap-1.5 font-medium tracking-wide">
                  <ShieldAlert size={12} /> Cảnh báo: Bạn đang sử dụng lại mật khẩu cũ.
                </p>
              )}
            </div>

            <div className="pt-6 pb-2 flex justify-end">
              <button 
                type="submit" 
                disabled={status === 'loading'}
                className="px-8 py-3.5 bg-white hover:bg-zinc-100 disabled:opacity-50 text-black active:scale-[0.98] font-medium rounded-full transition-all flex items-center gap-2"
              >
                <KeyRound size={16} />
                {status === 'loading' ? 'Đang đổi...' : 'Đổi mật khẩu'}
              </button>
            </div>
          </div>
        </form>

        <div className="p-1.5 rounded-[2.5rem] bg-white/[0.02] border border-white/5 shadow-2xl">
          <div className="bg-[#0a0a0a]/60 backdrop-blur-3xl rounded-[calc(2.5rem-0.375rem)] p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-white/5 space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-white/5">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500">
                <DatabaseBackup size={18} />
              </div>
              <div>
                <h3 className="font-medium text-white">Sao lưu & Khôi phục</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Tạo bản sao lưu toàn bộ dữ liệu hoặc khôi phục từ file .vaultbak.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                type="button"
                onClick={handleExportBackup}
                disabled={status === 'loading'}
                className="flex-1 px-6 py-4 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white rounded-2xl transition-all border border-white/10 active:scale-95 flex items-center justify-center gap-3"
              >
                <Download size={18} /> Tạo bản sao lưu
              </button>
              
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={status === 'loading'}
                className="flex-1 px-6 py-4 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white rounded-2xl transition-all border border-white/10 active:scale-95 flex items-center justify-center gap-3"
              >
                <Upload size={18} /> Khôi phục dữ liệu
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                accept=".vaultbak" 
                onChange={handleImportBackup} 
                className="hidden" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
