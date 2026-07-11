import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ShieldAlert, KeyRound, Download, DatabaseBackup, Trash2, ArrowLeft, Home } from 'lucide-react';
import { save } from '@tauri-apps/plugin-dialog';
import { writeTextFile } from '@tauri-apps/plugin-fs';

interface Props {

  onBack: () => void;
  onHome: () => void;
  showToast: (msg: string) => void;
}

export default function SettingsPanel({ onBack, onHome, showToast }: Props) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

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
      setErrorMsg('Mật khẩu mới phải từ 8 ký tự trở lên');
      return;
    }
    
    setStatus('loading');
    try {
      await invoke('change_master_password', { oldPassword, newPassword });
      setStatus('success');
      showToast('Đổi mật khẩu chủ thành công!');
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.toString());
    }
  };

  const handleExportBackup = async () => {
    setStatus('loading');
    try {
      const data: string = await invoke('export_backup');
      const filePath = await save({
        filters: [{
          name: 'Vault Backup',
          extensions: ['vaultbak']
        }],
        defaultPath: `backup_${new Date().toISOString().split('T')[0]}.vaultbak`
      });
      if (filePath) {
        await writeTextFile(filePath, data);
        setStatus('success');
        showToast(`Đã lưu bản sao lưu thành công tại: ${filePath}`);
      } else {
        setStatus('idle');
      }
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.toString());
    }
  };

  const handleDeleteAll = async () => {
    const confirmText = prompt('CẢNH BÁO: Hành động này sẽ xóa VĨNH VIỄN toàn bộ mật khẩu. Việc này không thể hoàn tác.\n\nGõ chữ CONFIRM để xác nhận:');
    if (confirmText === 'CONFIRM') {
      setStatus('loading');
      try {
        await invoke('delete_all_entries');
        setStatus('success');
        showToast('Đã xóa toàn bộ mật khẩu!');
      } catch (err: any) {
        setStatus('error');
        setErrorMsg(err.toString());
      }
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
        <div className="flex gap-2">
          <button 
            onClick={onBack}
            type="button"
            className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/10 active:scale-95 text-white"
            title="Quay lại"
          >
            <ArrowLeft size={16} />
          </button>
          <button 
            onClick={onHome}
            type="button"
            className="w-10 h-10 flex items-center justify-center bg-white text-black hover:bg-zinc-100 rounded-full transition-colors border border-transparent active:scale-95"
            title="Về Trang chủ"
          >
            <Home size={16} />
          </button>
        </div>
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

            {status === 'error' && (
              <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {errorMsg}
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
                className="w-full px-6 py-4 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white rounded-2xl transition-all border border-white/10 active:scale-95 flex items-center justify-center gap-3"
              >
                <Download size={18} /> Chọn nơi lưu & Tạo bản sao lưu
              </button>
            </div>
          </div>
        </div>

        <div className="p-1.5 rounded-[2.5rem] bg-white/[0.02] border border-red-500/10 shadow-2xl mt-8">
          <div className="bg-[#0a0a0a]/60 backdrop-blur-3xl rounded-[calc(2.5rem-0.375rem)] p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-red-500/20 space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-red-500/10">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                <Trash2 size={18} />
              </div>
              <div>
                <h3 className="font-medium text-red-400">Vùng nguy hiểm</h3>
                <p className="text-xs text-red-500/60 mt-0.5">Xóa vĩnh viễn toàn bộ dữ liệu trong Vault này.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                type="button"
                onClick={handleDeleteAll}
                disabled={status === 'loading'}
                className="w-full px-6 py-4 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50 text-red-400 font-medium rounded-2xl transition-all border border-red-500/20 active:scale-95 flex items-center justify-center gap-3"
              >
                <Trash2 size={18} /> Xóa toàn bộ mật khẩu
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
